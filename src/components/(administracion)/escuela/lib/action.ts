'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { aulaFormSchema, AulaForm, horarioFormSchema, HorarioForm, estudianteFormSchema, EstudianteForm } from './zod';

/**
 * Función interna para formatear la fecha de creación con desfase de 6 horas
 */
function formatearVisual(fechaISO: string) {
    const d = new Date(fechaISO);
    const localDate = new Date(d.getTime() - (6 * 60 * 60 * 1000));
    return localDate.toLocaleString('es-ES', { 
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true 
    }).toUpperCase();
}

/**
 * Obtiene todos los datos necesarios para el gestor de escuela (Aulas, Horarios, Usuarios)
 */
export async function obtenerDatosEscuela() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // 1. Obtener Perfil Actual DIRECTAMENTE (Más seguro para roles)
    const { data: perfilActual } = await supabase
        .from('profiles')
        .select('id, nombre, avatar_url, activo, rol')
        .eq('id', user.id)
        .single();

    // 2. Obtener Perfiles para Catedráticos (Si se necesitan todos, mantener select)
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nombre, avatar_url, activo, rol');

    const perfilesMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    // 2. Obtener Horarios
    const { data: horarios } = await supabase
        .from('esc_horarios')
        .select('*')
        .order('nombre', { ascending: true });

    // 3. Obtener Aulas con JOIN explícito a horarios
    const { data: rawAulas, error } = await supabase
        .from('esc_aulas')
        .select(`
            *,
            horario:esc_horarios!fk_aula_horario(*)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('--- ERROR FETCHING AULAS ---');
        console.error('Mensaje:', error.message);
        console.error('Detalles:', error.details);
        console.error('Sugerencia:', error.hint);
        return { aulas: [], horarios: horarios || [], usuarios: profiles || [] };
    }

    // 4. Mapear datos finales
    const aulas = (rawAulas || []).map((aula: any) => {
        const perfil = perfilesMap.get(aula.catedratico_id);
        return {
            ...aula,
            perfil_catedratico: {
                nombre: perfil?.nombre || 'Desconocido',
                avatar_url: perfil?.avatar_url
            }
        };
    });

    // const perfilActual ya fue obtenido arriba

    return {
        aulas,
        horarios: horarios || [],
        usuarios: profiles || [],
        perfilActual
    };
}

/**
 * CRUD HORARIOS
 */
export async function guardarHorario(data: HorarioForm, idEdicion?: string) {
    const parsed = horarioFormSchema.safeParse(data);
    if (!parsed.success) throw new Error(parsed.error.issues[0].message);

    const supabase = await createClient();
    
    if (idEdicion) {
        const { error } = await supabase.from('esc_horarios').update(parsed.data).eq('id', idEdicion);
        if (error) throw new Error(error.message);
    } else {
        const { error } = await supabase.from('esc_horarios').insert(parsed.data);
        if (error) throw new Error(error.message);
    }

    revalidatePath('/kore/escuela');
}

export async function eliminarHorario(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('esc_horarios').delete().eq('id', id);
    if (error) throw new Error(error.message);
    revalidatePath('/kore/escuela');
}

/**
 * CRUD AULAS
 */
export async function guardarAula(data: AulaForm, idEdicion?: string) {
    const parsed = aulaFormSchema.safeParse(data);
    if (!parsed.success) throw new Error(parsed.error.issues[0].message);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const payload = {
        ...parsed.data,
        created_by: idEdicion ? undefined : user.id
    };

    if (idEdicion) {
        const { error } = await supabase.from('esc_aulas').update(payload).eq('id', idEdicion);
        if (error) throw new Error(error.message);
    } else {
        const { error } = await supabase.from('esc_aulas').insert(payload);
        if (error) throw new Error(error.message);
    }

    revalidatePath('/kore/escuela');
}

export async function eliminarAula(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('esc_aulas').delete().eq('id', id);
    if (error) throw new Error(error.message);
    revalidatePath('/kore/escuela');
}

/**
 * CRUD ESTUDIANTES
 */
export async function obtenerEstudiantesDeAula(aulaId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('esc_estudiante_aulas')
        .select(`
            id,
            estudiante_id,
            aula_id,
            created_at,
            estudiante:esc_estudiantes(*)
        `)
        .eq('aula_id', aulaId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error obteniendo estudiantes:', error.message);
        return [];
    }

    return data || [];
}

/**
 * Busca estudiantes en la base de datos general (no filtrados por aula)
 * Si no hay query, devuelve los últimos 10 agregados.
 */
export async function buscarEstudiantesGenerales(query: string, excluirIds: string[] = []) {
    const supabase = await createClient();
    
    let dbQuery = supabase
        .from('esc_estudiantes')
        .select('*');

    // Filtrar por nombre si hay query
    if (query && query.trim().length > 0) {
        dbQuery = dbQuery.ilike('nombre', `%${query}%`);
    }

    // Excluir IDs si se proporcionan
    if (excluirIds.length > 0) {
        dbQuery = dbQuery.not('id', 'in', `(${excluirIds.join(',')})`);
    }

    const { data, error } = await dbQuery
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error buscando estudiantes:', error.message);
        return [];
    }
    return data || [];
}

/**
 * Vincula un estudiante existente a un aula
 */
export async function vincularEstudianteAAula(estudianteId: string, aulaId: string) {
    const supabase = await createClient();
    
    // Verificar si ya está inscrito
    const { data: existe } = await supabase
        .from('esc_estudiante_aulas')
        .select('id')
        .eq('estudiante_id', estudianteId)
        .eq('aula_id', aulaId)
        .single();

    if (existe) throw new Error('El estudiante ya está inscrito en esta aula');

    const { error } = await supabase
        .from('esc_estudiante_aulas')
        .insert({
            estudiante_id: estudianteId,
            aula_id: aulaId,
        });

    if (error) throw new Error(error.message);
    revalidatePath('/kore/escuela');
}

export async function inscribirEstudiante(data: EstudianteForm, aulaId: string) {
    const parsed = estudianteFormSchema.safeParse(data);
    if (!parsed.success) throw new Error(parsed.error.issues[0].message);

    const supabase = await createClient();

    // 1. Crear el estudiante en esc_estudiantes
    const { data: nuevoEstudiante, error: errorEstudiante } = await supabase
        .from('esc_estudiantes')
        .insert({
            nombre: parsed.data.nombre,
            genero: parsed.data.genero,
            fecha_nacimiento: parsed.data.fecha_nacimiento || null,
            telefono: parsed.data.telefono || null,
        })
        .select('id')
        .single();

    if (errorEstudiante) throw new Error(errorEstudiante.message);

    // 2. Inscribir en el aula
    await vincularEstudianteAAula(nuevoEstudiante.id, aulaId);
}

export async function desinscribirEstudiante(estudianteAulaId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('esc_estudiante_aulas')
        .delete()
        .eq('id', estudianteAulaId);
    if (error) throw new Error(error.message);
    revalidatePath('/kore/escuela');
}

// ─── ASISTENCIAS ─────────────────────────────────────────────────────────────

/**
 * Obtiene todas las asistencias de un aula, con datos del estudiante
 */
export async function obtenerAsistenciasDeAula(aulaId: string) {
    const supabase = await createClient();

    // Obtener todos los estudiantes inscritos en el aula
    const { data: inscripciones } = await supabase
        .from('esc_estudiante_aulas')
        .select('estudiante_id')
        .eq('aula_id', aulaId);

    if (!inscripciones || inscripciones.length === 0) return [];

    const estudianteIds = inscripciones.map((i) => i.estudiante_id);

    const { data, error } = await supabase
        .from('esc_asistencias')
        .select(`
            id,
            estudiante_id,
            aula_id,
            asistio,
            created_at,
            estudiante:esc_estudiantes(id, nombre, genero)
        `)
        .eq('aula_id', aulaId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error obteniendo asistencias:', error.message);
        return [];
    }

    return data || [];
}

/**
 * Verifica si ya se pasó asistencia hoy para un aula dada
 */
export async function verificarAsistenciaHoy(aulaId: string): Promise<boolean> {
    const supabase = await createClient();

    const hoyInicio = new Date();
    hoyInicio.setHours(0, 0, 0, 0);
    const hoyFin = new Date();
    hoyFin.setHours(23, 59, 59, 999);

    const { data } = await supabase
        .from('esc_asistencias')
        .select('id')
        .eq('aula_id', aulaId)
        .gte('created_at', hoyInicio.toISOString())
        .lte('created_at', hoyFin.toISOString())
        .limit(1);

    return (data?.length ?? 0) > 0;
}

/**
 * Guarda la asistencia de una sesión completa.
 * Si ya existen registros para hoy de esos estudiantes, los actualiza (upsert).
 */
export async function guardarAsistencia(
    aulaId: string,
    registros: { estudiante_id: string; asistio: boolean }[]
) {
    if (!registros.length) return;
    const supabase = await createClient();

    const hoyInicio = new Date();
    hoyInicio.setHours(0, 0, 0, 0);
    const hoyFin = new Date();
    hoyFin.setHours(23, 59, 59, 999);

    // 1. Borrar registros previos de ESTA aula para hoy (Permite el re-save/edición)
    const { error: errorDelete } = await supabase
        .from('esc_asistencias')
        .delete()
        .eq('aula_id', aulaId)
        .gte('created_at', hoyInicio.toISOString())
        .lte('created_at', hoyFin.toISOString());

    if (errorDelete) throw new Error(errorDelete.message);

    // 2. Insertar los nuevos registros incluyendo el aula_id
    const { error: errorInsert } = await supabase
        .from('esc_asistencias')
        .insert(registros.map((r) => ({
            estudiante_id: r.estudiante_id,
            aula_id: aulaId,
            asistio: r.asistio,
        })));

    if (errorInsert) throw new Error(errorInsert.message);
    revalidatePath('/kore/escuela');
}

/**
 * Guarda (crea o edita) un estudiante de forma general
 */
export async function guardarEstudianteGeneral(data: EstudianteForm, id?: string) {
    const parsed = estudianteFormSchema.safeParse(data);
    if (!parsed.success) throw new Error(parsed.error.issues[0].message);

    const supabase = await createClient();

    if (id) {
        // Actualizar existente
        const { error } = await supabase
            .from('esc_estudiantes')
            .update({
                nombre: parsed.data.nombre,
                genero: parsed.data.genero,
                fecha_nacimiento: parsed.data.fecha_nacimiento || null,
                telefono: parsed.data.telefono || null,
            })
            .eq('id', id);

        if (error) throw new Error(error.message);
    } else {
        // Crear nuevo
        const { error } = await supabase
            .from('esc_estudiantes')
            .insert({
                nombre: parsed.data.nombre,
                genero: parsed.data.genero,
                fecha_nacimiento: parsed.data.fecha_nacimiento || null,
                telefono: parsed.data.telefono || null,
            });

        if (error) throw new Error(error.message);
    }

    revalidatePath('/kore/escuela');
}

/**
 * Elimina un estudiante por completo de la base de datos
 * Esto disparará un ON DELETE CASCADE si hay foreign keys configuradas, 
 * de lo contrario podría fallar si está en aulas (seguro es lo deseado por integridad).
 */
export async function eliminarEstudianteGeneral(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('esc_estudiantes')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/kore/escuela');
}

