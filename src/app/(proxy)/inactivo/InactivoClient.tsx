"use client";

import { useTransition, useEffect, useState } from "react";
import { PhoneCall, LogOut, RefreshCw } from "lucide-react";
import { logout } from "@/app/actions";
import { verificarEstado } from "./actions";
import { createClient } from "@/utils/supabase/client";

export function InactivoClient() {
  const [isPending, startTransition] = useTransition();
  const [hasSession, setHasSession] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setHasSession(!!session);
    };
    checkSession();
  }, [supabase]);

  const handleVerificar = () => {
    startTransition(() => {
        verificarEstado();
    });
  };

  const handleBackToLogin = () => {
    window.location.href = "/login";
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="grid grid-cols-2 gap-3">
        {hasSession ? (
          <>
            <button 
              onClick={handleVerificar}
              disabled={isPending}
              className="flex items-center justify-center gap-2 px-4 py-4 text-xs font-bold text-[#4a3f36] dark:text-[#f4ebc3] bg-[#faf8f4] dark:bg-white/5 border border-[#d5cec2] dark:border-white/10 rounded-2xl transition-all hover:border-[#d6a738] active:scale-95 disabled:opacity-50"
            >
              {isPending ? <RefreshCw size={16} className="animate-spin text-[#d6a738]" /> : <RefreshCw size={16} className="text-[#d6a738]" />}
              Reintentar ingreso
            </button>

            <form action={logout} className="w-full">
              <button 
                type="submit"
                className="flex items-center justify-center gap-2 w-full px-4 py-4 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 border border-red-200/50 dark:border-red-900/30 rounded-2xl transition-all hover:bg-red-100 dark:hover:bg-red-900/20 active:scale-95"
              >
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </form>
          </>
        ) : (
          <button 
            onClick={handleBackToLogin}
            className="col-span-2 flex items-center justify-center gap-2 px-4 py-4 text-xs font-bold text-[#4a3f36] dark:text-[#f4ebc3] bg-[#faf8f4] dark:bg-white/5 border border-[#d5cec2] dark:border-white/10 rounded-2xl transition-all hover:border-[#d6a738] active:scale-95"
          >
            <LogOut size={16} className="text-red-500 rotate-180" />
            Volver al Inicio
          </button>
        )}
      </div>
    </div>
  );
}
