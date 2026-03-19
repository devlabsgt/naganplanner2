import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { AcuerdoClient } from "./AcuerdoClient";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { AuroraText } from "@/components/ui/aurora-text";

export default async function AcuerdoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('acuerdo')
    .eq('id', user.id)
    .single();

  if (profile?.acuerdo) {
    redirect("/kore"); 
  }

  return (
    <div className="min-h-screen bg-[#faf8f4] dark:bg-black/95 flex flex-col items-center justify-center p-4 py-8 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1a1a1a] p-8 md:p-12 rounded-3xl border border-[#d5cec2] dark:border-[#3e3630] shadow-xl animate-in fade-in zoom-in-95 duration-500 my-auto">
        
        <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-3 mb-4 select-none">
              <img src="/icon.png" alt="Logo" className="w-12 h-12 rounded-xl object-contain shadow-sm border border-black/10 dark:border-white/10" />
              <BrandLogo className="flex" />
            </div>
            <p className="text-sm font-bold text-[#847563] dark:text-[#b9ae9f] uppercase tracking-widest text-center mt-2">
              Sistema de Gestión Ministerial Modular™️
            </p>
        </div>

        <div className="space-y-6 text-[#4a3f36] dark:text-[#f4ebc3]">
          
          <p className="text-sm md:text-base leading-relaxed text-center sm:text-left">
            <AuroraText variant="gold" className="font-bold whitespace-nowrap">Nagan Planner</AuroraText> es una herramienta que ayuda a organizar y coordinar el servicio en los ministerios de la iglesia.
          </p>
          
          <p className="text-sm font-medium text-[#847563] dark:text-[#b9ae9f] bg-[#faf8f4] dark:bg-neutral-800/50 p-4 rounded-xl border border-[#d5cec2]/50 dark:border-[#3e3630]/50 text-center sm:text-left">
            Al continuar, reconoces que tu participación es voluntaria y aceptas las siguientes condiciones:
          </p>

          <div className="space-y-4 mt-8 pt-4">
             <div className="p-4 sm:p-5 rounded-2xl bg-[#faf8f4] dark:bg-black/20 border border-[#d5cec2] dark:border-[#3e3630] transition-colors">
               <h3 className="font-black text-sm mb-1.5 uppercase tracking-wider text-[#d6a738]">Servicio voluntario</h3>
               <p className="text-xs sm:text-sm text-[#847563] dark:text-[#b9ae9f] leading-relaxed">Tu participación en el ministerio es libre y voluntaria, y no constituye relación laboral con la iglesia ni con la plataforma.</p>
             </div>
             <div className="p-4 sm:p-5 rounded-2xl bg-[#faf8f4] dark:bg-black/20 border border-[#d5cec2] dark:border-[#3e3630] transition-colors">
               <h3 className="font-black text-sm mb-1.5 uppercase tracking-wider text-[#d6a738]">Sin remuneración</h3>
               <p className="text-xs sm:text-sm text-[#847563] dark:text-[#b9ae9f] leading-relaxed">El servicio ministerial no genera salario ni compensación económica.</p>
             </div>
             <div className="p-4 sm:p-5 rounded-2xl bg-[#faf8f4] dark:bg-black/20 border border-[#d5cec2] dark:border-[#3e3630] transition-colors">
               <h3 className="font-black text-sm mb-1.5 uppercase tracking-wider text-[#d6a738]">Compromiso de servicio</h3>
               <p className="text-xs sm:text-sm text-[#847563] dark:text-[#b9ae9f] leading-relaxed">Al confirmar tu participación en turnos, ensayos o actividades, te comprometes a honrar ese servicio y avisar con anticipación si no puedes asistir.</p>
             </div>
             <div className="p-4 sm:p-5 rounded-2xl bg-[#faf8f4] dark:bg-black/20 border border-[#d5cec2] dark:border-[#3e3630] transition-colors">
               <h3 className="font-black text-sm mb-1.5 uppercase tracking-wider text-[#d6a738]">Libertad de participación</h3>
               <p className="text-xs sm:text-sm text-[#847563] dark:text-[#b9ae9f] leading-relaxed">Puedes suspender o finalizar tu servicio voluntario en cualquier momento informándolo al liderazgo del ministerio.</p>
             </div>
             <div className="p-4 sm:p-5 rounded-2xl bg-[#faf8f4] dark:bg-black/20 border border-[#d5cec2] dark:border-[#3e3630] transition-colors">
               <h3 className="font-black text-sm mb-1.5 uppercase tracking-wider text-[#d6a738]">Uso del sistema</h3>
               <p className="text-xs sm:text-sm text-[#847563] dark:text-[#b9ae9f] leading-relaxed"><AuroraText variant="gold" className="font-bold text-xs">Nagan</AuroraText> <AuroraText variant="planner" className="font-bold text-xs">Planner</AuroraText> es una herramienta para coordinar y organizar el servicio ministerial.</p>
             </div>
             <div className="p-4 sm:p-5 rounded-2xl bg-[#faf8f4] dark:bg-black/20 border border-[#d5cec2] dark:border-[#3e3630] transition-colors">
               <h3 className="font-black text-sm mb-1.5 uppercase tracking-wider text-[#d6a738]">Protección de datos</h3>
               <p className="text-xs sm:text-sm text-[#847563] dark:text-[#b9ae9f] leading-relaxed">La información registrada se utiliza únicamente para la organización del ministerio de la iglesia.</p>
             </div>
          </div>

          <hr className="my-8 border-[#d5cec2] dark:border-[#3e3630]" />

          <AcuerdoClient />

        </div>
      </div>
    </div>
  );
}
