'use server'

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { checkIsJefe } from './core';
import { sendPushToUsers } from '@/utils/push-utils';

export async function responderInvitacionComision(actividad_id: string, aceptada: boolean, motivo?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Obtener información para la notificación antes de los cambios o en paralelo
  const [resPerfil, resActividad, resEncargados] = await Promise.all([
    supabase.from('profiles').select('nombre').eq('id', user.id).single(),
    supabase.from('act_actividades').select('title').eq('id', actividad_id).single(),
    supabase.from('act_integrantes').select('usuario_id').eq('actividad_id', actividad_id).eq('es_encargado', true)
  ]);

  const { error } = await supabase
    .from('act_integrantes')
    .update({ 
      invitación: aceptada, 
      justificación: motivo || null 
    })
    .eq('actividad_id', actividad_id)
    .eq('usuario_id', user.id);

  if (error) throw new Error(error.message);

  // Notificar a los encargados (excluyendo al que responde si fuera encargado)
  const encargadosIds = resEncargados.data?.map(e => e.usuario_id).filter(id => id !== user.id) || [];
  
  if (encargadosIds.length > 0 && resActividad.data?.title && resPerfil.data?.nombre) {
    const accion = aceptada ? 'ACEPTADO ✅' : 'RECHAZADO ❌';
    sendPushToUsers(encargadosIds, {
      title: `Invitación ${accion}`,
      body: `${resPerfil.data.nombre} ha ${aceptada ? 'aceptado' : 'rechazado'} la invitación a: ${resActividad.data.title}`,
      url: "/kore/planificador"
    }).catch(err => console.error("Error enviando push de respuesta:", err));
  }

  revalidatePath('/kore/planificador');
}

export async function removerMiembroComision(actividad_id: string, usuario_id_a_remover: string, motivo: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const isJefe = await checkIsJefe(supabase, user.id);
  const { data: actividad } = await supabase.from('act_actividades').select('created_by').eq('id', actividad_id).single();

  const esAutoGestion = user.id === usuario_id_a_remover;

  if (!isJefe && actividad?.created_by !== user.id && !esAutoGestion) {
    throw new Error('No tienes permisos para dar de baja a otros integrantes.');
  }

  const { error } = await supabase
    .from('act_integrantes')
    .update({ 
      invitación: false, 
      justificación: esAutoGestion ? `Auto-baja: ${motivo}` : motivo 
    })
    .eq('actividad_id', actividad_id)
    .eq('usuario_id', usuario_id_a_remover);

  if (error) throw new Error(error.message);
  revalidatePath('/kore/planificador');
}

export async function sustituirMiembroComision(
  actividad_id: string, 
  usuario_id_actual: string, 
  nuevo_usuario_id: string,
  justificacion: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const isJefe = await checkIsJefe(supabase, user.id);
  const { data: actividad } = await supabase.from('act_actividades').select('title, created_by').eq('id', actividad_id).single();

  const esAutoGestion = user.id === usuario_id_actual;

  if (!isJefe && actividad?.created_by !== user.id && !esAutoGestion) {
    throw new Error('No tienes permisos para editar esta comisión.');
  }

  const autoAsignacion = user.id === nuevo_usuario_id;

  const { error } = await supabase
    .from('act_integrantes')
    .update({ 
      usuario_id: nuevo_usuario_id,
      invitación: autoAsignacion ? true : null, 
      justificación: null 
    })
    .eq('actividad_id', actividad_id)
    .eq('usuario_id', usuario_id_actual);

  if (error) throw new Error(error.message);

  // --- NOTIFICACIÓN PUSH AL NUEVO INTEGRANTE ---
  if (actividad?.title && nuevo_usuario_id !== user.id) {
    sendPushToUsers([nuevo_usuario_id], {
      title: "Nueva Sustitución / Asignación",
      body: `Has sido asignado a la actividad: ${actividad.title.toUpperCase()}`,
      url: "/kore/planificador"
    }).catch(err => console.error("Error enviando push en sustitución:", err));
  }

  // --- REGISTRO DE SUSTITUCIÓN ---
  if (justificacion) {
    const { error: errorLog } = await supabase
      .from('act_sustituciones')
      .insert({
        actividad_id,
        usuario_saliente_id: usuario_id_actual,
        usuario_entrante_id: nuevo_usuario_id,
        justificacion,
        creado_por: user.id
      });
      
    if (errorLog) console.error('Error al registrar sustitución:', errorLog);
  }

  revalidatePath('/kore/planificador');
}

export async function actualizarChecklistPlanificador(id: string, items: any[]) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('act_actividades')
    .update({ checklist: items })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/kore/planificador');
}

export async function obtenerRolesExistentes() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('act_integrantes')
    .select('rol')
    .not('rol', 'is', null)
    .neq('rol', '');

  if (error) {
    console.error('Error al obtener roles:', error);
    return [];
  }

  const rolesUnicos = Array.from(new Set(data.map(item => item.rol).filter(Boolean)));
  
  return rolesUnicos.sort((a, b) => a.localeCompare(b));
}

export async function marcarAsistenciaUbicacion(
  actividad_id: string,
  usuario_id: string,
  tipo: 'entrada' | 'salida',
  latitud: number,
  longitud: number,
  fecha_creacion: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Asegurarnos de que el usuario solo puede marcar SU propia asistencia, 
  // o si es jefe/creador, tal vez pueda marcar la de otros? 
  // Por ahora lo limitamos a auto-gestión o permitir si tiene permisos.
  // Para asistencia, lo ideal es que cada quien marque la suya por GPS.
  if (user.id !== usuario_id) {
    throw new Error('Solo puedes marcar tu propia asistencia.');
  }

  // Buscar integrante para obtener la ubicación actual
  const { data: integrante, error: findError } = await supabase
    .from('act_integrantes')
    .select('ubicacion')
    .eq('actividad_id', actividad_id)
    .eq('usuario_id', usuario_id)
    .single();

  if (findError) throw new Error('Error al buscar integrante: ' + findError.message);

  let currentUbicacion = integrante.ubicacion || {};

  // Agregar o actualizar el tipo (entrada o salida)
  currentUbicacion[tipo] = {
    tipo,
    latitud,
    longitud,
    fecha_creacion
  };

  const { error: updateError } = await supabase
    .from('act_integrantes')
    .update({ ubicacion: currentUbicacion })
    .eq('actividad_id', actividad_id)
    .eq('usuario_id', usuario_id);

  if (updateError) throw new Error('Error al guardar ubicación: ' + updateError.message);

  revalidatePath('/kore/planificador');
}
