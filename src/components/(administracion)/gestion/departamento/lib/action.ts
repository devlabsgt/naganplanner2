"use server";

import { createClient } from "@/utils/supabase/server";
import { departamentoSchema, DepartamentoFormValues } from "./schemas";
import { revalidatePath } from "next/cache";

export async function getDepartamentos() {
  const supabase = await createClient();
  
  const { data: deptos, error: deptoError } = await supabase
    .from("departamento")
    .select("*") 
    .order("orden", { ascending: true });

  if (deptoError) throw new Error(deptoError.message);
  if (!deptos || deptos.length === 0) return [];

  const { data: puestosData, error: puestosError } = await supabase
  .from("puesto")
  .select("*")
  .order("es_jefatura", { ascending: false }) 
  .order("nombre", { ascending: true });      
    
  if (puestosError) throw new Error(puestosError.message);
  const puestos = puestosData || [];

  const profileIds = new Set<string>();
  deptos.forEach(d => { if (d.jefe_id) profileIds.add(d.jefe_id); });
  puestos.forEach(p => { if (p.usuario_id) profileIds.add(p.usuario_id); });

  let profiles: any[] = [];
  if (profileIds.size > 0) {
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, nombre, avatar_url, rol")
      .in("id", Array.from(profileIds));

    if (profilesError) throw new Error(profilesError.message);
    profiles = profilesData || [];
  }

  const puestosConUsuarios = puestos.map(p => ({
    ...p,
    usuario: p.usuario_id ? profiles.find(pr => pr.id === p.usuario_id) || null : null
  }));

  const deptosCompletos = deptos.map(depto => {
    const jefe = depto.jefe_id ? profiles.find(pr => pr.id === depto.jefe_id) || null : null;
    const puestosDelDepto = puestosConUsuarios.filter(p => p.departamento_id === depto.id);
    
    return {
      ...depto,
      jefe,
      puestos: puestosDelDepto
    };
  });

  return deptosCompletos;
}

export async function createDepartamento(values: DepartamentoFormValues) {
  const result = departamentoSchema.safeParse(values);
  
  if (!result.success) {
    return { error: "Datos inválidos" };
  }

  const supabase = await createClient();

  // Auto-asignar el siguiente orden disponible entre hermanos
  let ordenFinal = result.data.orden;
  if (!ordenFinal) {
    const parentId = result.data.parent_id || null;
    const query = supabase
      .from("departamento")
      .select("orden")
      .order("orden", { ascending: false })
      .limit(1);

    if (parentId) {
      query.eq("parent_id", parentId);
    } else {
      query.is("parent_id", null);
    }

    const { data: hermanos } = await query;
    ordenFinal = hermanos && hermanos.length > 0 ? (hermanos[0].orden ?? 0) + 1 : 1;
  }

  const { data, error } = await supabase
    .from("departamento")
    .insert({
      nombre: result.data.nombre,
      parent_id: result.data.parent_id || null, 
      jefe_id: result.data.jefe_id || null,
      orden: ordenFinal,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  
  revalidatePath("/administracion/gestion/departamento");
  return { success: true, data };
}

export async function updateDepartamento(id: string, values: DepartamentoFormValues) {
  const result = departamentoSchema.safeParse(values);

  if (!result.success) return { error: "Datos inválidos" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("departamento")
    .update({
      nombre: result.data.nombre,
      parent_id: result.data.parent_id || null,
      ...(result.data.orden !== undefined && { orden: result.data.orden }),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/administracion/gestion/departamento");
  return { success: true, data };
}

export async function deleteDepartamento(id: string) {
  const supabase = await createClient();

  const { count: subDeptCount, error: subError } = await supabase
    .from("departamento")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", id);

  if (subError) return { error: "Error al verificar dependencias." };
  if (subDeptCount && subDeptCount > 0) {
    return { error: "No se puede eliminar: Contiene subdepartamentos." };
  }

  const { count: puestosCount, error: puestosError } = await supabase
    .from("puesto")
    .select("id", { count: "exact", head: true })
    .eq("departamento_id", id);

  if (puestosError) return { error: "Error al verificar puestos." };
  if (puestosCount && puestosCount > 0) {
    return { error: "No se puede eliminar: Tiene puestos creados." };
  }

  const { error } = await supabase
    .from("departamento")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/administracion/gestion/departamento");
  return { success: true };
}

export async function getCandidatosJefatura() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nombre, rol, email, avatar_url")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error) return { error: error.message };
  return { success: true, data };
}

export async function asignarJefeDepartamento(departamentoId: string, jefeId: string | null) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("departamento")
    .update({ jefe_id: jefeId })
    .eq("id", departamentoId);

  if (error) return { error: error.message };
  
  revalidatePath("/administracion/gestion/departamento");
  return { success: true };
}