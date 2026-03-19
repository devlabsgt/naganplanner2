"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function aceptarAcuerdo(clientTimestamp: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await supabase
    .from('profiles')
    .update({ 
      acuerdo: true, 
      fecha_acuerdo: clientTimestamp 
    })
    .eq('id', user.id);

  redirect("/kore");
}
