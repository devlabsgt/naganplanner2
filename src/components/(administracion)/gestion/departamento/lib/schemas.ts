import { z } from "zod";

export const departamentoSchema = z.object({
  id: z.string().uuid().optional(),
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  parent_id: z.string().uuid().nullable().optional(),
  jefe_id: z.string().uuid().nullable().optional(),
  orden: z.number().int().min(1).optional(),
});

export type DepartamentoFormValues = z.infer<typeof departamentoSchema>;
export type Puesto = {
  id: string;
  nombre: string;
  es_jefatura: boolean;
  departamento_id: string;
  usuario_id?: string | null; 
  
  usuario?: {
    id: string;
    nombre: string;
    avatar_url?: string;
    rol?: string;
  } | null;
};

export type DepartamentoRow = DepartamentoFormValues & {
  id: string;
  created_at?: string;
  orden?: number;
  puestos?: Puesto[];
  jefe?: {
    id: string;
    nombre: string;
    avatar_url?: string;
    rol?: string;
  } | null;
};

export type DepartamentoNode = DepartamentoRow & {
  children?: DepartamentoNode[];
};