'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { obtenerDatosEscuela, guardarAula, eliminarAula, guardarHorario, eliminarHorario, obtenerEstudiantesDeAula, inscribirEstudiante, desinscribirEstudiante, buscarEstudiantesGenerales, vincularEstudianteAAula, obtenerAsistenciasDeAula, verificarAsistenciaHoy, guardarAsistencia, guardarEstudianteGeneral, eliminarEstudianteGeneral } from './action';
import { AulaForm, HorarioForm, EstudianteForm } from './zod';

/**
 * Hook para obtener todos los datos del módulo de escuela
 */
export function useGestorEscuela(initialData?: any) {
    return useQuery({
        queryKey: ['escuela-datos'],
        queryFn: () => obtenerDatosEscuela(),
        initialData,
        staleTime: 1000 * 60 * 5, // 5 minutos de caché persistente
    });
}

/**
 * Hook para las mutaciones de Horarios
 */
export function useHorarioMutations() {
    const queryClient = useQueryClient();

    const guardar = useMutation({
        mutationFn: ({ data, id }: { data: HorarioForm, id?: string }) => guardarHorario(data, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['escuela-datos'] });
        }
    });

    const eliminar = useMutation({
        mutationFn: (id: string) => eliminarHorario(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['escuela-datos'] });
        }
    });

    return { guardar, eliminar };
}

/**
 * Hook para las mutaciones de Aulas
 */
export function useEscuelaMutations() {
    const queryClient = useQueryClient();

    const guardar = useMutation({
        mutationFn: ({ data, id }: { data: AulaForm, id?: string }) => guardarAula(data, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['escuela-datos'] });
        }
    });

    const eliminar = useMutation({
        mutationFn: (id: string) => eliminarAula(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['escuela-datos'] });
        }
    });

    return { guardar, eliminar };
}

/**
 * Hook para obtener los estudiantes inscritos en un aula
 */
export function useGestorEstudiantes(aulaId: string) {
    return useQuery({
        queryKey: ['estudiantes', aulaId],
        queryFn: () => obtenerEstudiantesDeAula(aulaId),
        staleTime: 1000 * 60 * 2,
    });
}

/**
 * Hook para buscar estudiantes en la BD general
 */
export function useBuscarEstudiantes(query: string, excluirIds: string[] = []) {
    return useQuery({
        queryKey: ['buscar-estudiantes', query, excluirIds.join(',')],
        queryFn: () => buscarEstudiantesGenerales(query, excluirIds),
        staleTime: 1000 * 30, // 30 segundos
    });
}

/**
 * Hook para las mutaciones de Estudiantes
 */
export function useEstudianteMutations(aulaId: string) {
    const queryClient = useQueryClient();

    const inscribir = useMutation({
        mutationFn: (data: EstudianteForm) => inscribirEstudiante(data, aulaId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['estudiantes', aulaId] });
        }
    });

    const desinscribir = useMutation({
        mutationFn: (estudianteAulaId: string) => desinscribirEstudiante(estudianteAulaId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['estudiantes', aulaId] });
        }
    });

    const vincular = useMutation({
        mutationFn: (estudianteId: string) => vincularEstudianteAAula(estudianteId, aulaId),
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['estudiantes', aulaId] });
        }
    });

    return { inscribir, desinscribir, vincular };
}

/**
 * Hook para obtener el historial de asistencias de un aula
 */
export function useAsistencias(aulaId: string) {
    return useQuery({
        queryKey: ['asistencias', aulaId],
        queryFn: () => obtenerAsistenciasDeAula(aulaId),
        staleTime: 1000 * 60 * 2,
    });
}

/**
 * Hook para verificar si ya se pasó asistencia hoy
 */
export function useVerificarAsistenciaHoy(aulaId: string) {
    return useQuery({
        queryKey: ['asistencia-hoy', aulaId],
        queryFn: () => verificarAsistenciaHoy(aulaId),
        staleTime: 1000 * 60 * 5,
    });
}

/**
 * Hook para guardar una sesión de asistencia
 */
export function useAsistenciaMutations(aulaId: string) {
    const queryClient = useQueryClient();

    const guardar = useMutation({
        mutationFn: (registros: { estudiante_id: string; asistio: boolean }[]) =>
            guardarAsistencia(aulaId, registros),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['asistencias', aulaId] });
            queryClient.invalidateQueries({ queryKey: ['asistencia-hoy', aulaId] });
        },
    });

    return { guardar };
}

/**
 * Hook para las mutaciones globales de Estudiantes
 */
export function useEstudianteGeneralMutations() {
    const queryClient = useQueryClient();

    const guardar = useMutation({
        mutationFn: ({ data, id }: { data: EstudianteForm, id?: string }) => guardarEstudianteGeneral(data, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['estudiantes-general'] });
        }
    });

    const eliminar = useMutation({
        mutationFn: (id: string) => eliminarEstudianteGeneral(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['estudiantes-general'] });
        }
    });

    return { guardar, eliminar };
}
