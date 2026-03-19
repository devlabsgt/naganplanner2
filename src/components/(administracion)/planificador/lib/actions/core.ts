'use server'

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { planificadorFormSchema, PlanificadorForm } from '../zod';
import { sendPushToUsers } from '@/utils/push-utils';

// --- FUNCIÓN HELPER: VERIFICAR SI ES JEFE O ADMIN ---
export async function checkIsJefe(supabase: any, userId: string): Promise<boolean> {
  const { data: puestosJefatura } = await supabase
    .from('puesto')
    .select('id')
    .eq('usuario_id', userId)
    .eq('es_jefatura', true);

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', userId)
    .single();

  const esJefeOperativo = puestosJefatura && puestosJefatura.length > 0;

  // Normalizar el rol para que sea insensible a mayúsculas/minúsculas
  const userRole = (profile?.rol || '').toUpperCase();
  const esSuperAdmin = userRole === 'SUPER';

  return esJefeOperativo || esSuperAdmin;
}

export async function obtenerDatosPlanificador(
  tipoVista: 'mis_actividades' | 'mi_equipo' | 'todas',
  modulo: 'alabanza' | 'danza' | 'multimedia' | 'todas'
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Obtener Perfiles
  const { data: rawProfiles } = await supabase
    .from('profiles')
    .select('id, nombre, email, avatar_url, activo, rol');

  const perfilesMap = new Map((rawProfiles || []).map((p: any) => [p.id, p]));
  const miPerfil = perfilesMap.get(user.id);
  const isJefe = await checkIsJefe(supabase, user.id);

  // 2. Lógica de Filtro por Equipo
  let teamIds: string[] = [user.id];
  let departamentosEquipo: any[] = [];

  if (isJefe || tipoVista === 'mi_equipo' || tipoVista === 'todas') {
    let arrayIdsTotales: string[] = [];
    const { data: todosDeptos } = await supabase.from('departamento').select('id, nombre, parent_id');

    if (tipoVista === 'todas') {
      arrayIdsTotales = todosDeptos ? todosDeptos.map(d => d.id) : [];
    } else {
      const { data: puestosJefatura } = await supabase
        .from('puesto')
        .select('departamento_id')
        .eq('usuario_id', user.id)
        .eq('es_jefatura', true);

      if (puestosJefatura && puestosJefatura.length > 0) {
        const idsDirectos = puestosJefatura.map(p => p.departamento_id);
        const idsJerarquia = new Set<string>(idsDirectos);

        const buscarDescendencia = (padresIds: string[]) => {
          if (!todosDeptos) return;
          const hijos = todosDeptos.filter(d => d.parent_id && padresIds.includes(d.parent_id)).map(d => d.id);
          if (hijos.length > 0) {
            hijos.forEach(id => idsJerarquia.add(id));
            buscarDescendencia(hijos);
          }
        };

        buscarDescendencia(idsDirectos);
        arrayIdsTotales = Array.from(idsJerarquia);
      }
    }

    if (arrayIdsTotales.length > 0) {
      const infoDeptos = todosDeptos?.filter(d => arrayIdsTotales.includes(d.id)) || [];
      const { data: puestosMiembros } = await supabase
        .from('puesto')
        .select('usuario_id, departamento_id')
        .in('departamento_id', arrayIdsTotales)
        .not('usuario_id', 'is', null);

      if (puestosMiembros) {
        const idsEmpleados = puestosMiembros.map(p => p.usuario_id as string);
        teamIds = [...new Set([...teamIds, ...idsEmpleados])];

        const usuariosYaAsignados = new Set<string>();
        departamentosEquipo = infoDeptos.map(depto => {
          const miembrosDelDepto = puestosMiembros
            .filter(p => p.departamento_id === depto.id)
            .map(p => p.usuario_id as string);

          const miembrosUnicos = miembrosDelDepto.filter(userId => {
            if (usuariosYaAsignados.has(userId)) return false;
            usuariosYaAsignados.add(userId);
            return true;
          });

          return { id: depto.id, nombre: depto.nombre, miembros: miembrosUnicos };
        }).filter(depto => depto.miembros.length > 0);
      }
    }
  }

  // 3. Obtener los IDs de las actividades
  let queryIntegrantes = supabase.from('act_integrantes').select('actividad_id');
  if (tipoVista === 'mis_actividades') {
    queryIntegrantes = queryIntegrantes.eq('usuario_id', user.id);
  } else if (tipoVista === 'mi_equipo') {
    queryIntegrantes = queryIntegrantes.in('usuario_id', teamIds);
  }

  const { data: actsFiltradas } = await queryIntegrantes;
  const validActIds = actsFiltradas?.map(a => a.actividad_id) || [];

  if (validActIds.length === 0 && tipoVista !== 'todas') {
    return { perfil: miPerfil, planificadores: [], usuarios: rawProfiles || [], departamentosEquipo, isJefe };
  }

  let queryActs = supabase
    .from('act_actividades')
    .select(`
      *,
      act_integrantes (
        id,
        usuario_id,
        es_encargado,
        invitación,
        justificación,
        rol
      )
    `)
    .order('due_date', { ascending: true });

  if (tipoVista !== 'todas') {
    queryActs = queryActs.in('id', validActIds);
  }

  if (modulo !== 'todas') {
    queryActs = queryActs.eq('modulo', modulo);
  }

  const { data: rawPlanificadores, error } = await queryActs;

  if (error) {
    console.error('Error fetching planificadores:', error);
    return { perfil: miPerfil, planificadores: [], usuarios: [], departamentosEquipo: [], isJefe: false };
  }

  const planificadores = rawPlanificadores.map((act: any) => {
    const creador = perfilesMap.get(act.created_by);

    const integrantesMapeados = (act.act_integrantes || []).map((int: any) => {
      const perfilInt = perfilesMap.get(int.usuario_id);
      return {
        ...int,
        perfil: {
          nombre: perfilInt?.nombre || 'Desconocido',
          avatar_url: perfilInt?.avatar_url
        }
      };
    });

    return {
      ...act,
      creator: { nombre: creador?.nombre || 'Desconocido' },
      integrantes: integrantesMapeados
    };
  });

  return {
    perfil: miPerfil,
    planificadores,
    usuarios: (rawProfiles || []),
    departamentosEquipo,
    isJefe
  };
}

export async function guardarPlanificador(data: PlanificadorForm, idEdicion?: string) {
  const parsed = planificadorFormSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const isJefe = await checkIsJefe(supabase, user.id);

  if (!idEdicion && !isJefe) {
    throw new Error('No tienes permisos para crear nuevas actividades. Solo los lideres pueden hacerlo.');
  }

  // --- MAYÚSCULAS EN EL TÍTULO ---
  const tituloMayusculas = parsed.data.title.toUpperCase();

  let fechaVencimiento = parsed.data.due_date;
  if (fechaVencimiento) {
    if (fechaVencimiento.length === 10) fechaVencimiento = `${fechaVencimiento}T23:59:59-06:00`;
    else if (fechaVencimiento.length === 16) fechaVencimiento = `${fechaVencimiento}:00-06:00`;
  }

  const payloadActividad: any = {
    title: tituloMayusculas,
    description: parsed.data.description || null,
    due_date: fechaVencimiento,
    assigned_to: null,
    checklist: parsed.data.checklist || [],
    modulo: parsed.data.modulo || null,
    status: parsed.data.status,
    videos_url: parsed.data.videos_url || []
  };

  let actividadId = idEdicion;
  let integrantesAnteriores: any[] = [];

  if (idEdicion) {
    const { data: tareaActual } = await supabase.from('act_actividades').select('*').eq('id', idEdicion).single();
    if (!tareaActual) throw new Error('Planificador no encontrado');

    const esActividadPasada = tareaActual.due_date && new Date(tareaActual.due_date) < new Date();

    if (esActividadPasada && !isJefe) {
      throw new Error('Solo los lideres pueden editar actividades que ya han finalizado (fechas pasadas).');
    }

    if (!isJefe) {
      payloadActividad.title = tareaActual.title;
      payloadActividad.due_date = tareaActual.due_date;
      payloadActividad.modulo = tareaActual.modulo;
      payloadActividad.status = tareaActual.status;
      payloadActividad.videos_url = tareaActual.videos_url || [];
    }

    const { data: intAnt } = await supabase.from('act_integrantes').select('*').eq('actividad_id', idEdicion);
    integrantesAnteriores = intAnt || [];

    const { error: errorUpdate } = await supabase.from('act_actividades').update(payloadActividad).eq('id', idEdicion);
    if (errorUpdate) throw new Error(errorUpdate.message);

    await supabase.from('act_integrantes').delete().eq('actividad_id', idEdicion);

  } else {
    const { data: nuevaActividad, error: errorInsert } = await supabase
      .from('act_actividades')
      .insert({ ...payloadActividad, created_by: user.id })
      .select('id')
      .single();

    if (errorInsert) throw new Error(errorInsert.message);
    actividadId = nuevaActividad.id;
  }

  if (actividadId && parsed.data.integrantes.length > 0) {
    const usuariosANotificar: string[] = [];

    const payloadIntegrantes = parsed.data.integrantes.map(int => {
      const existente = integrantesAnteriores.find(ea => ea.usuario_id === int.usuario_id);

      let estadoInvitacion = existente ? existente.invitación : null;
      let motivoRechazo = existente ? existente.justificación : null;

      const esNuevoRealmente = int.es_nuevo || !existente;

      if (esNuevoRealmente) {
        estadoInvitacion = null;
        motivoRechazo = null;
        if (int.usuario_id !== user.id) {
          usuariosANotificar.push(int.usuario_id);
        }
      }

      if (int.usuario_id === user.id && estadoInvitacion === null) {
        estadoInvitacion = true;
        motivoRechazo = null;
      }

      return {
        actividad_id: actividadId,
        usuario_id: int.usuario_id,
        es_encargado: int.es_encargado,
        invitación: estadoInvitacion,
        justificación: motivoRechazo,
        rol: int.rol
      };
    });

    const { error: errorIntegrantes } = await supabase.from('act_integrantes').insert(payloadIntegrantes);
    if (errorIntegrantes) throw new Error(errorIntegrantes.message);

    if (usuariosANotificar.length > 0) {
      try {
        await sendPushToUsers(usuariosANotificar, {
          title: idEdicion ? "Te han añadido a una actividad" : "Nueva Actividad Asignada",
          body: `Has sido asignado a la actividad: ${tituloMayusculas}`,
          url: "/kore/planificador"
        });
      } catch (err) {
        console.error("Error enviando push en planificador:", err);
      }
    }
  }

  revalidatePath('/admin/planificador');
}

export async function eliminarPlanificador(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const isJefe = await checkIsJefe(supabase, user.id);
  const { data: tareaActual } = await supabase.from('act_actividades').select('status, created_by, due_date').eq('id', id).single();

  if (!isJefe) {
    const esActividadPasada = tareaActual?.due_date && new Date(tareaActual.due_date) < new Date();

    if (esActividadPasada) {
      throw new Error('Solo los lideres pueden eliminar actividades que ya han finalizado (fechas pasadas).');
    }
    if (tareaActual?.created_by !== user.id) {
      throw new Error('No tienes permisos. Solo puedes eliminar planificadores creados por ti mismo.');
    }
  }

  await supabase.from('act_integrantes').delete().eq('actividad_id', id);

  const { error } = await supabase.from('act_actividades').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/kore/planificador');
}
