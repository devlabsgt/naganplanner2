import { z } from 'zod';

export const DIAS_OPCIONES = [
    { id: 1, label: 'Lun' },
    { id: 2, label: 'Mar' },
    { id: 3, label: 'Mié' },
    { id: 4, label: 'Jue' },
    { id: 5, label: 'Vie' },
    { id: 6, label: 'Sáb' },
    { id: 7, label: 'Dom' },
];

export const horarioFormSchema = z.object({
    nombre: z.string().min(3, "El nombre del horario es requerido"),
    dias: z.array(z.number()).min(1, "Selecciona al menos un día"),
    entrada: z.string().min(1, "Hora de entrada requerida"),
    salida: z.string().min(1, "Hora de salida requerida"),
});

export type HorarioForm = z.infer<typeof horarioFormSchema>;

export interface Horario {
    id: string;
    nombre: string;
    dias: number[];
    entrada: string;
    salida: string;
    created_at: string;
}

export const aulaFormSchema = z.object({
    nombre: z.string()
        .min(3, "El nombre debe tener al menos 3 caracteres")
        .max(100, "El nombre es muy largo"),
    descripcion: z.string()
        .max(500, "La descripción no puede exceder los 500 caracteres")
        .optional()
        .nullable(),
    catedratico_id: z.string()
        .min(1, "Debes seleccionar un catedrático")
        .uuid("ID de catedrático inválido"),
    horario_id: z.string()
        .min(1, "Debes asignar un horario")
        .uuid("ID de horario inválido"),
    status: z.boolean(),
});

export type AulaForm = z.infer<typeof aulaFormSchema>;

export interface Aula {
    id: string;
    nombre: string;
    descripcion: string | null;
    catedratico_id: string;
    horario_id: string;
    status: boolean;
    created_at: string;
    created_by: string;
    // JOIN con horarios
    horario?: Horario;
    // JOIN con profiles
    perfil_catedratico?: {
        nombre: string;
        avatar_url?: string;
    };
}

export interface Perfil {
    id: string;
    nombre: string;
    avatar_url?: string;
    activo: boolean;
    rol?: string;
}
