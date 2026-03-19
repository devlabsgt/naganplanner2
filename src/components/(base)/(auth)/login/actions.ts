"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

export type ActionState = {
  message: string | null;
  errorType: "invalid" | "connection" | null;
  fields?: {
    email?: string;
    password?: string;
  };
} | null;

export async function login(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();

  const emailInput = formData.get("email") as string;
  const password = formData.get("password") as string;
  const username = emailInput ? emailInput.split('@')[0] : "";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 1. Verificación Administrativa de Inactividad y BAN
  if (url && adminKey && emailInput) {
    const adminClient = createSupabaseAdmin(url, adminKey);

    // --- A. Verificar BANEADO en AUTH directamente ---
    const { data: { users } } = await adminClient.auth.admin.listUsers();
    
    // Casteamos a any[] para acceder a 'banned_until', ya que el tipo User de la SDK 
    // a veces no lo incluye en su definición de tipos aunque el dato esté presente.
    const targetedUserInAuth = (users as any[]).find(u => u.email?.toLowerCase() === emailInput.toLowerCase());

    if (targetedUserInAuth) {
      // Si el campo banned_until existe y es una fecha futura, lo mandamos a /inactivo
      const banDate = targetedUserInAuth.banned_until;
      if (banDate && new Date(banDate) > new Date()) {
        redirect("/inactivo");
      }
    }

    // --- B. Verificar ACTIVO en PROFILES (Fallback/Doble Check) ---
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, activo')
      .or(`email.ilike.${emailInput},nombre.ilike.${username}`)
      .order('activo', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (profile && profile.activo === false) {
      redirect("/inactivo");
    }
  }

  // 2. Intento de inicio de sesión estándar
  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailInput,
    password,
  });

  if (error || !data.user) {
    // Si falló con 400, volvemos a verificar el ban (Doble barrera)
    if (url && adminKey && emailInput) {
        const adminClient = createSupabaseAdmin(url, adminKey);
        const { data: { users } } = await adminClient.auth.admin.listUsers();
        const userRetry = (users as any[]).find(u => u.email?.toLowerCase() === emailInput.toLowerCase());
        
        if (userRetry?.banned_until && new Date(userRetry.banned_until) > new Date()) {
            redirect("/inactivo");
        }
    }

    return {
      message:
        error?.status === 400 ? "Credenciales inválidas" : "Error de conexión",
      errorType: error?.status === 400 ? "invalid" : "connection",
      fields: {
        email: emailInput,
        password,
      },
    };
  }

  // 3. Verificación post-login exitoso
  const { data: profile } = await supabase
    .from('profiles')
    .select('activo, acuerdo')
    .eq('id', data.user.id)
    .single();

  if (profile) {
    if (profile.activo === false) {
      await supabase.auth.signOut();
      redirect("/inactivo");
    }
    
    if (!profile.acuerdo) {
      redirect("/acuerdo");
    }
  }

  redirect("/kore");
}
