"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { aceptarAcuerdo } from "./actions";

export function AcuerdoClient() {
  const [accepted, setAccepted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleAccept = () => {
    if (!accepted) return;
    startTransition(() => {
        // Obtenemos el tiempo local del cliente, sin interferencia de zona horaria del servidor
        const now = new Date();
        const offset = now.getTimezoneOffset(); // en minutos
        const localDate = new Date(now.getTime() - (offset * 60000));
        const localIso = localDate.toISOString().slice(0, -1); // Removemos la 'Z'
        aceptarAcuerdo(localIso);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <label className="flex items-start gap-4 cursor-pointer group p-2 -ml-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
        <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${accepted ? 'bg-[#d6a738] border-[#d6a738] text-white' : 'border-[#d5cec2] dark:border-[#3e3630] bg-[#faf8f4] dark:bg-neutral-900 text-transparent group-hover:border-[#d6a738]'}`}>
          <Check size={16} className={accepted ? 'opacity-100' : 'opacity-0'} strokeWidth={3} />
        </div>
        <input 
          type="checkbox" 
          className="hidden" 
          checked={accepted} 
          onChange={(e) => setAccepted(e.target.checked)} 
        />
        <span className="text-sm font-semibold select-none pt-0.5 text-foreground leading-relaxed">
          Acepto participar voluntariamente en el servicio ministerial.
        </span>
      </label>

      <button 
        onClick={handleAccept}
        disabled={!accepted || isPending}
        className="w-full flex items-center justify-center py-4 rounded-2xl font-bold transition-all text-white bg-[#d6a738] hover:bg-[#c08e2a] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed shadow-xl shadow-[#d6a738]/20 dark:shadow-none active:scale-95"
      >
        {isPending ? (
           <span className="flex items-center gap-2">
             <Loader2 size={20} className="animate-spin" />
             Guardando acuerdo...
           </span>
        ) : (
          "Aceptar y continuar"
        )}
      </button>
    </div>
  );
}
