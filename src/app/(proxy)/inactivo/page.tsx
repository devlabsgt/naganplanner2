import { ShieldAlert } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { AuroraText } from "@/components/ui/aurora-text";
import { createClient } from "@/utils/supabase/server";
import { InactivoClient } from "./InactivoClient";

export default async function InactivoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Si hay usuario logueado, verificamos su estado para ser proactivos
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('activo')
      .eq('id', user.id)
      .single();

    // Si ya le quitaron el bloqueo, lo regresamos al panel
    if (profile?.activo) {
      // Usando import dinámico para evitar error de redirect circular si ocurre
      const { redirect } = await import("next/navigation");
      redirect("/kore");
    }
  }

  // IMPORTANTE: Si NO hay usuario (caso de baneo Auth total), permitimos ver la página
  // para que el login pueda enviarlos aquí y vean el mensaje de soporte.

  return (
    <div className="min-h-screen bg-[#faf8f4] dark:bg-black/95 flex flex-col items-center justify-center p-4 py-8">
      <div className="w-full max-w-md bg-white dark:bg-[#1a1a1a] p-8 md:p-12 rounded-3xl border border-[#d5cec2] dark:border-[#3e3630] shadow-xl animate-in fade-in zoom-in-95 duration-500">
        
        <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-3 mb-4 select-none">
              <img src="/icon.png" alt="Logo" className="w-12 h-12 rounded-xl object-contain shadow-sm border border-black/10 dark:border-white/10" />
              <BrandLogo className="flex" />
            </div>
            <p className="text-sm font-bold text-[#847563] dark:text-[#b9ae9f] uppercase tracking-widest text-center mt-2">
              Acceso Restringido
            </p>
        </div>

        <div className="flex flex-col items-center text-center space-y-6">
          <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-full text-red-600 dark:text-red-400">
            <ShieldAlert size={40} strokeWidth={1.5} />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[#4a3f36] dark:text-[#f4ebc3]">
              Acceso Denegado
            </h2>
            <p className="text-sm text-[#847563] dark:text-[#b9ae9f] leading-relaxed">
              Actualmente no puede acceder al sistema. <br />
              <span className="font-bold">Debe consultar a soporte técnico</span> para reactivar su cuenta.
            </p>
          </div>

          <div className="w-full h-px bg-[#d5cec2] dark:border-[#3e3630]" />

          {/* Acciones para soporte (Cerrar sesión o llamar) */}
          <InactivoClient />

        </div>

        <div className="mt-8 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#4a3f36]/40 dark:text-white/60">
                POWERED BY <AuroraText>Kore | ingeniería de software</AuroraText>
            </p>
        </div>
      </div>
    </div>
  );
}
