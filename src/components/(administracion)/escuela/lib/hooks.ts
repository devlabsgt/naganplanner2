'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { obtenerDatosEscuela, guardarAula, eliminarAula, guardarHorario, eliminarHorario } from './action';
import { AulaForm, HorarioForm } from './zod';

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
