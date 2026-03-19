import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function KoreLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check agreement and active status
  const { data: profile } = await supabase
    .from('profiles')
    .select('acuerdo, activo')
    .eq('id', user.id)
    .single();

  // Bloqueo estricto: Si el perfil está inactivo o NO existe el campo activo como true.
  if (!profile || profile.activo === false) {
    redirect("/inactivo");
  }

  // Falta de acuerdo
  if (!profile.acuerdo) {
    redirect("/acuerdo");
  }

  return <>{children}</>;
}
