'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';

export default function NotFound() {
    const router = useRouter();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md animate-in fade-in duration-300">

            <div className="w-full max-w-lg mx-auto bg-white dark:bg-[#111111] rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative scale-in-center">

                {/* Línea dorada superior tipo Nagan */}
                <div className="w-full h-1.5 bg-gradient-to-r from-[#d6a738] to-[#f4ebc3] dark:from-[#d6a738] dark:to-yellow-600"></div>

                <div className="px-6 py-10 sm:p-12 text-center flex flex-col items-center">

                    {/* Logotipo Integrado Nagan */}
                    <div className="flex items-center justify-center gap-3 mb-10 select-none">
                        <img
                            src="/icon.png"
                            alt="Nagan Planner Logo"
                            className="h-12 w-12 sm:h-14 sm:w-14 object-contain rounded-xl border border-black/5 dark:border-white/10 shadow-sm"
                        />
                        <BrandLogo className="scale-110 origin-left" />
                    </div>

                    {/* Icono de Error - Cambiado a Escudo Dorado */}
                    <div className="w-20 h-20 mb-6 bg-[#d6a738]/10 dark:bg-[#d6a738]/5 rounded-full flex items-center justify-center border border-[#d6a738]/20 dark:border-[#d6a738]/10 shadow-inner">
                        <ShieldAlert className="w-10 h-10 text-[#d6a738]" />
                    </div>

                    <h1 className="mb-4 text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-[#f4ebc3]">
                        Error 404
                    </h1>

                    <p className="mb-10 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Lo sentimos, la página que intentas buscar no existe dentro de Nagan Planner o no tiene los permisos necesarios.
                    </p>

                    <Button
                        onClick={() => router.push('/')}
                        className="w-full h-12 px-8 text-sm font-bold text-white transition-all rounded-xl sm:w-auto hover:scale-[1.02] active:scale-95 shadow-lg bg-gray-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Regresar al Inicio
                    </Button>
                </div>

            </div>
        </div>
    );
}