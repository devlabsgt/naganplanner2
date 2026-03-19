"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

/**
 * Re-verifica el estado del usuario logueado.
 */
export async function verificarEstado() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('activo')
    .eq('id', user.id)
    .single();

  if (profile?.activo) {
    redirect("/kore");
  } else {
    redirect("/inactivo");
  }
}

/**
 * Intercepta usuarios inactivos por email o nombre antes de validar Auth.
 */
export async function interceptarLoginInactivo(emailInput: string) {
  if (!emailInput) return;

  const emailToSearch = emailInput.trim();
  const username = emailToSearch.split('@')[0];

  // Obtenemos las llaves. IMPORTANTE: Usamos el operador ! para romper si faltan, 
  // pero aquí usamos condicional por seguridad.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && serviceKey) {
    const supabaseAdmin = createSupabaseAdmin(url, serviceKey);

    // Buscamos en la tabla profiles por EMAIL (el generado) o por NOMBRE (el usuario escrito)
    // Usamos .or() para cubrir ambas posibilidades en una sola consulta
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('activo, email, nombre')
      .or(`email.ilike."${emailToSearch}",nombre.ilike."${username}"`)
      .limit(5); // Traemos varios por si hay duplicados (aunque no debería)

    if (error) {
        // console.error("Error en interceptarLoginInactivo:", error.message);
        return;
    }

    if (profiles && profiles.length > 0) {
      // Si encontramos AL MENOS un perfil que coincida y esté marcado como inactivo (false o null)
      // Lo mandamos a la pantalla de bloqueo.
      const hayInactivo = profiles.some(p => p.activo === false);
      
      if (hayInactivo) {
        redirect("/inactivo");
      }
    }
  }
}
