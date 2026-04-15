'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { checkIsJefe } from './core';
import { sendPushToUsers } from '@/utils/push-utils';

// Helper local para instanciar el cliente con privilegios
function getAdminClient() {
  return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function crearAlabanza(data: {
  nombre: string;
  tipo: string;
  tonalidad?: string;
  bpm?: number;
  compas?: string;
  observaciones?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const supabaseAdmin = getAdminClient();

  const { error } = await supabaseAdmin
    .from('act_banco_alabanzas')
    .insert({
      nombre: data.nombre.trim(),
      tipo: data.tipo,
      tonalidad: data.tonalidad || null, // Se cambia a minúsculas
      bpm: data.bpm || null,
      compas: data.compas || null,
      observaciones: data.observaciones?.trim() || null
    });

  if (error) {
    console.error("Error al crear alabanza:", error);
    throw new Error(error.message);
  }
  
  revalidatePath('/kore/planificador');
}

export async function actualizarAlabanza(id: string, data: Partial<{
  nombre: string;
  tipo: string;
  tonalidad?: string;
  bpm?: number;
  compas?: string;
  observaciones?: string;
}>) {
  const supabaseAdmin = getAdminClient();
  const { error } = await supabaseAdmin
    .from('act_banco_alabanzas')
    .update({
      nombre: data.nombre?.trim(),
      tipo: data.tipo,
      tonalidad: data.tonalidad || null,
      bpm: data.bpm || null,
      compas: data.compas || null,
      observaciones: data.observaciones?.trim() || null
    })
    .eq('id', id);

  if (error) {
    console.error("Error al actualizar:", error);
    throw new Error(error.message);
  }

  revalidatePath('/kore/planificador');
}

export async function eliminarAlabanza(id: string) {
  const supabaseAdmin = getAdminClient();
  const { error } = await supabaseAdmin
    .from('act_banco_alabanzas')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Error al eliminar:", error);
    throw new Error(error.message);
  }

  revalidatePath('/kore/planificador');
}

export async function obtenerBancoAlabanzas() {
  const supabaseAdmin = getAdminClient();
  const { data, error } = await supabaseAdmin
    .from('act_banco_alabanzas')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error fetching banco alabanzas:', error);
    return [];
  }

  return data;
}

// ============================================================================
// GESTIÓN DE ALABANZAS EN ACTIVIDADES
// ============================================================================

export async function sincronizarRepertorioActividad(actividad_id: string, alabanzas_ids: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const isJefe = await checkIsJefe(supabase, user.id);
  
  const { data: actividad } = await supabase
    .from('act_actividades')
    .select('created_by, title')
    .eq('id', actividad_id)
    .single();

  if (!actividad) throw new Error('Actividad no encontrada');

  // Verificar si el usuario es encargado de esta actividad
  const { data: registroEncargado } = await supabase
    .from('act_integrantes')
    .select('id')
    .eq('actividad_id', actividad_id)
    .eq('usuario_id', user.id)
    .eq('es_encargado', true)
    .maybeSingle();

  const esEncargado = !!registroEncargado;
  const esCreador = actividad.created_by === user.id;

  if (!isJefe && !esCreador && !esEncargado) {
    throw new Error('No tienes permisos suficientes para modificar el repertorio.');
  }

  // 1. Eliminar todo el repertorio anterior de esta actividad
  const { error: deleteError } = await supabase
    .from('act_actividades_alabanzas')
    .delete()
    .eq('actividad_id', actividad_id);

  if (deleteError) throw new Error(deleteError.message);

  // 2. Insertar el nuevo repertorio (si hay)
  if (alabanzas_ids.length > 0) {
    const payload = alabanzas_ids.map(id => ({
      actividad_id,
      alabanza_id: id
    }));
    
    const { error: insertError } = await supabase
      .from('act_actividades_alabanzas')
      .insert(payload);

    if (insertError) throw new Error(insertError.message);

    // 3. Notificar a los roles estratégicos y jefes operativos sobre el nuevo repertorio
    try {
      const supabaseAdmin = getAdminClient();
      const userIdsANotificar = new Set<string>();

      // a) Obtener todos los admin/super
      const { data: admins } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .in('rol', ['admin', 'super', 'ADMIN', 'SUPER']);
      
      if (admins) {
        admins.forEach((u: any) => userIdsANotificar.add(u.id));
      }

      // b) Obtener todos los jefes operativos (líderes)
      const { data: jefes } = await supabaseAdmin
        .from('puesto')
        .select('usuario_id')
        .eq('es_jefatura', true);

      if (jefes) {
        jefes.forEach((j: any) => {
          if (j.usuario_id) userIdsANotificar.add(j.usuario_id);
        });
      }

      if (userIdsANotificar.size > 0) {
        await sendPushToUsers(Array.from(userIdsANotificar), {
          title: "Repertorio de Alabanzas",
          body: `El departamento de Alabanza creó/modificó un repertorio para: ${actividad.title || 'Desconocida'}`,
          url: "/kore/planificador"
        });
      }
    } catch (err) {
      console.error("Error enviando notificación push de repertorio:", err);
    }
  }

  revalidatePath('/kore/planificador');
}

export async function asignarDirectorCanto(actividad_id: string, alabanza_id: string, director_id: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const payload = director_id ? { id_director: director_id } : { id_director: null };

  const { error } = await supabase
    .from('act_actividades_alabanzas')
    .update(payload)
    .eq('actividad_id', actividad_id)
    .eq('alabanza_id', alabanza_id);

  if (error) {
    console.error("Error asignando director:", error);
    throw new Error(error.message);
  }

  revalidatePath('/kore/planificador');
}

export async function obtenerRepertoriosDelMismoDia(actividad_id: string) {
  const supabase = await createClient();
  
  // 1. Obtener la fecha de la actividad actual
  const { data: actividadActual } = await supabase
    .from('act_actividades')
    .select('due_date')
    .eq('id', actividad_id)
    .single();

  if (!actividadActual?.due_date) return [];

  const fecha = new Date(actividadActual.due_date);
  const fechaSoloDia = fecha.toISOString().split('T')[0];

  // 2. Buscar otras actividades en el mismo da que tengan alabanzas
  // Nota: Usamos query raw o filtros de fecha para asegurar el da exacto independientemente de la hora
  const { data: actividadesConCanciones, error } = await supabase
    .from('act_actividades')
    .select(`
      id,
      title,
      modulo,
      act_actividades_alabanzas!inner (id)
    `)
    .neq('id', actividad_id)
    .gte('due_date', `${fechaSoloDia}T00:00:00`)
    .lte('due_date', `${fechaSoloDia}T23:59:59`);

  if (error) {
    console.error("Error al buscar repertorios del da:", error);
    return [];
  }

  return actividadesConCanciones.map((act: any) => ({
    id: act.id,
    title: act.title,
    modulo: act.modulo,
    canciones_count: act.act_actividades_alabanzas?.length || 0
  }));
}

export async function clonarRepertorio(origen_id: string, destino_id: string) {
  const supabase = await createClient();

  // 1. Obtener las canciones de la actividad origen
  const { data: cancionesOrigen, error: fetchError } = await supabase
    .from('act_actividades_alabanzas')
    .select('alabanza_id, id_director')
    .eq('actividad_id', origen_id);

  if (fetchError || !cancionesOrigen) throw new Error("No se pudo obtener el repertorio origen");

  // 2. Eliminar repertorio actual de la actividad destino
  await supabase
    .from('act_actividades_alabanzas')
    .delete()
    .eq('actividad_id', destino_id);

  // 3. Insertar las nuevas canciones
  if (cancionesOrigen.length > 0) {
    const payload = cancionesOrigen.map(c => ({
      actividad_id: destino_id,
      alabanza_id: c.alabanza_id,
      id_director: c.id_director
    }));

    const { error: insertError } = await supabase
      .from('act_actividades_alabanzas')
      .insert(payload);

    if (insertError) throw new Error(insertError.message);
  }

  revalidatePath('/kore/planificador');
  return { success: true, count: cancionesOrigen.length };
}
