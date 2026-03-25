import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import GestorAulas from "@/components/(administracion)/escuela/GestorAulas";

export default async function EscuelaPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Solo verificar que tenga sesión activa
    if (!user) {
        redirect('/kore');
    }

    return (
        <div className="w-full">
            <Suspense fallback={<div className="p-10 text-center text-gray-500 italic animate-pulse">Cargando gestión de aulas...</div>}>
                <GestorAulas />
            </Suspense>
        </div>
    );
}
