'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { aulaFormSchema, AulaForm, horarioFormSchema, HorarioForm } from './zod';

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

    // 1. Obtener Perfiles
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

    return {
        aulas,
        horarios: horarios || [],
        usuarios: profiles || []
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
