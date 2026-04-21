'use server'

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { checkIsJefe } from './core';

// ============================================================================
// GESTIÓN DE ADJUNTOS (PDFs)
// ============================================================================

export async function guardarAdjunto(actividad_id: string, archivo: { nombre: string, url: string, tipo: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const isJefe = await checkIsJefe(supabase, user.id);
  
  const { data: actividad } = await supabase
    .from('act_actividades')
    .select('created_by, archivos_pdf')
    .eq('id', actividad_id)
    .single();

  if (!actividad) throw new Error('Actividad no encontrada');
  if (!isJefe && actividad.created_by !== user.id) {
     throw new Error('No tienes permisos para subir archivos a esta actividad.');
  }

  const adjuntosActuales = actividad.archivos_pdf || [];
  const nuevosAdjuntos = [...adjuntosActuales, archivo];

  const { error } = await supabase
    .from('act_actividades')
    .update({ archivos_pdf: nuevosAdjuntos })
    .eq('id', actividad_id);

  if (error) throw new Error(error.message);
  revalidatePath('/kore/planificador');
}

export async function eliminarAdjunto(actividad_id: string, archivoUrl: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const isJefe = await checkIsJefe(supabase, user.id);
  
  const { data: actividad } = await supabase
    .from('act_actividades')
    .select('created_by, archivos_pdf')
    .eq('id', actividad_id)
    .single();

  if (!actividad) throw new Error('Actividad no encontrada');
  if (!isJefe && actividad.created_by !== user.id) {
     throw new Error('No tienes permisos para eliminar archivos de esta actividad.');
  }

  const adjuntosActuales = actividad.archivos_pdf || [];
  const nuevosAdjuntos = adjuntosActuales.filter((a: any) => a.url !== archivoUrl);

  const { error } = await supabase
    .from('act_actividades')
    .update({ archivos_pdf: nuevosAdjuntos })
    .eq('id', actividad_id);

  if (error) throw new Error(error.message);
  revalidatePath('/kore/planificador');
}

// ============================================================================
// GESTIÓN DE VIDEOS (YouTube JSONB usando videos_url)
// ============================================================================

export async function guardarVideo(actividad_id: string, video: { id: string, nombre: string, url: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const isJefe = await checkIsJefe(supabase, user.id);
  
  const { data: actividad } = await supabase
    .from('act_actividades')
    .select('created_by, videos_url')
    .eq('id', actividad_id)
    .single();

  if (!actividad) throw new Error('Actividad no encontrada');
  
  if (!isJefe && actividad.created_by !== user.id) {
    throw new Error('No tienes permisos para agregar videos a esta actividad.');
  }

  const videosActuales = actividad.videos_url || [];
  const nuevosVideos = [...videosActuales, video];

  const { error } = await supabase
    .from('act_actividades')
    .update({ videos_url: nuevosVideos })
    .eq('id', actividad_id);

  if (error) throw new Error(error.message);
  revalidatePath('/kore/planificador');
}

export async function eliminarVideo(actividad_id: string, videoId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const isJefe = await checkIsJefe(supabase, user.id);
  
  const { data: actividad } = await supabase
    .from('act_actividades')
    .select('created_by, videos_url')
    .eq('id', actividad_id)
    .single();

  if (!actividad) throw new Error('Actividad no encontrada');
  
  if (!isJefe && actividad.created_by !== user.id) {
    throw new Error('No tienes permisos para eliminar videos de esta actividad.');
  }

  const videosActuales = actividad.videos_url || [];
  const nuevosVideos = videosActuales.filter((v: any) => v.id !== videoId);

  const { error } = await supabase
    .from('act_actividades')
    .update({ videos_url: nuevosVideos })
    .eq('id', actividad_id);

  if (error) throw new Error(error.message);
  revalidatePath('/kore/planificador');
}

// ============================================================================
// GESTIÓN DE DRIVE (Google Drive JSONB usando archivos_drive)
// ============================================================================

export async function guardarDrive(actividad_id: string, archivo: { id: string, nombre: string, url: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const isJefe = await checkIsJefe(supabase, user.id);
  
  const { data: actividad } = await supabase
    .from('act_actividades')
    .select('created_by, archivos_drive')
    .eq('id', actividad_id)
    .single();

  if (!actividad) throw new Error('Actividad no encontrada');
  
  if (!isJefe && actividad.created_by !== user.id) {
    throw new Error('No tienes permisos para agregar archivos de Drive a esta actividad.');
  }

  const driveActuales = actividad.archivos_drive || [];
  const nuevosDrive = [...driveActuales, archivo];

  const { error } = await supabase
    .from('act_actividades')
    .update({ archivos_drive: nuevosDrive })
    .eq('id', actividad_id);

  if (error) throw new Error(error.message);
  revalidatePath('/kore/planificador');
}

export async function eliminarDrive(actividad_id: string, driveId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const isJefe = await checkIsJefe(supabase, user.id);
  
  const { data: actividad } = await supabase
    .from('act_actividades')
    .select('created_by, archivos_drive')
    .eq('id', actividad_id)
    .single();

  if (!actividad) throw new Error('Actividad no encontrada');
  
  if (!isJefe && actividad.created_by !== user.id) {
    throw new Error('No tienes permisos para eliminar archivos de Drive de esta actividad.');
  }

  const driveActuales = actividad.archivos_drive || [];
  const nuevosDrive = driveActuales.filter((v: any) => v.id !== driveId);

  const { error } = await supabase
    .from('act_actividades')
    .update({ archivos_drive: nuevosDrive })
    .eq('id', actividad_id);

  if (error) throw new Error(error.message);
  revalidatePath('/kore/planificador');
}
