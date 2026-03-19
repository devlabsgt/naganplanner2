'use server'

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { checkIsJefe } from './core';

// ============================================================================
// GESTIÓN DE PLANTILLAS DE EQUIPO (Módulo: 'PLANTILLA_EQUIPO')
// ============================================================================

export async function obtenerPlantillasEquipos() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('act_actividades')
    .select(`
      id, 
      title, 
      created_by,
      act_integrantes (count)
    `)
    .eq('modulo', 'PLANTILLA_EQUIPO')
    .order('title', { ascending: true });

  if (error) {
    console.error('Error al obtener plantillas:', error);
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    nombre: item.title,
    miembros_count: item.act_integrantes?.[0]?.count || 0,
    created_by: item.created_by
  }));
}

export async function guardarPlantillaEquipo(
  nombre: string, 
  integrantes: any[], 
  idEdicion?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const isJefe = await checkIsJefe(supabase, user.id);
  if (!isJefe) throw new Error('Solo los líderes pueden gestionar plantillas de equipo.');

  if (!nombre || nombre.trim().length < 3) {
    throw new Error('El nombre del equipo debe tener al menos 3 caracteres.');
  }

  const payload: any = {
    title: nombre.toUpperCase(),
    modulo: 'PLANTILLA_EQUIPO',
    due_date: null,
    status: 'borrador',
    description: 'Plantilla de equipo predefinido',
    checklist: [],
    videos_url: [],
    archivos_pdf: []
  };

  let templateId = idEdicion;

  if (idEdicion) {
    const { data: existente } = await supabase
      .from('act_actividades')
      .select('id, modulo')
      .eq('id', idEdicion)
      .single();

    if (!existente || existente.modulo !== 'PLANTILLA_EQUIPO') {
      throw new Error('La plantilla no es válida.');
    }

    const { error } = await supabase.from('act_actividades').update(payload).eq('id', idEdicion);
    if (error) throw new Error(error.message);
    
    await supabase.from('act_integrantes').delete().eq('actividad_id', idEdicion);

  } else {
    const { data: nueva, error } = await supabase
      .from('act_actividades')
      .insert({ ...payload, created_by: user.id })
      .select('id')
      .single();

    if (error) throw new Error(error.message);
    templateId = nueva.id;
  }

  if (templateId && integrantes.length > 0) {
    const payloadIntegrantes = integrantes.map(int => ({
      actividad_id: templateId,
      usuario_id: int.usuario_id,
      es_encargado: int.es_encargado || false,
      rol: int.rol || null,
      invitación: null,
      justificación: null
    }));

    const { error: errorInt } = await supabase.from('act_integrantes').insert(payloadIntegrantes);
    if (errorInt) throw new Error(errorInt.message);
  }

  revalidatePath('/kore/planificador');
}

export async function eliminarPlantillaEquipo(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const isJefe = await checkIsJefe(supabase, user.id);
  if (!isJefe) throw new Error('No tienes permisos.');

  const { data: plantilla } = await supabase
    .from('act_actividades')
    .select('modulo')
    .eq('id', id)
    .single();

  if (!plantilla || plantilla.modulo !== 'PLANTILLA_EQUIPO') {
    throw new Error('No es una plantilla válida.');
  }

  await supabase.from('act_integrantes').delete().eq('actividad_id', id);
  const { error } = await supabase.from('act_actividades').delete().eq('id', id);
  
  if (error) throw new Error(error.message);
  revalidatePath('/kore/planificador');
}

export async function cargarMiembrosDePlantilla(plantillaId: string) {
  const supabase = await createClient();
  
  // 1. Obtener la relación cruda (IDs y Roles)
  const { data: integrantes, error } = await supabase
    .from('act_integrantes')
    .select('usuario_id, es_encargado, rol')
    .eq('actividad_id', plantillaId);

  if (error) {
    console.error('Error cargando miembros (act_integrantes):', error);
    return [];
  }

  if (!integrantes || integrantes.length === 0) return [];

  // 2. Extraer los IDs de usuario
  const userIds = integrantes.map((i: any) => i.usuario_id);

  // 3. Buscar la información de perfil manualmente
  const { data: perfiles } = await supabase
    .from('profiles')
    .select('id, nombre, avatar_url')
    .in('id', userIds);

  // 4. Crear un mapa para búsqueda rápida
  const perfilesMap = new Map(perfiles?.map((p: any) => [p.id, p]));

  // 5. Unir los datos
  return integrantes.map((item: any) => {
    const perfil = perfilesMap.get(item.usuario_id);
    return {
      usuario_id: item.usuario_id,
      nombre: perfil?.nombre || 'Usuario Desconocido',
      avatar_url: perfil?.avatar_url,
      es_encargado: item.es_encargado,
      rol: item.rol || '',
      is_new: true 
    };
  });
}
