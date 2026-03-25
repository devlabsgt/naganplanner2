"use client";

import { useMemo, useState } from "react";
import { TODOS_LOS_MODULOS, Rol, Modulo } from "../constants";
import { ModuleCard } from "../modules/ModuleCard";
import ModuleAccordion from "../modules/ModuleAccordion";
import { useUser } from "@/components/(base)/providers/UserProvider";
import { useProfile } from "@/components/(base)/(users)/profile/lib/hooks";

interface ModulesViewProps {
  rol?: Rol | null;
  isJefe?: boolean;
}

export function ModulesView({ rol, isJefe = false }: ModulesViewProps) {
  const [loadingModule, setLoadingModule] = useState<string | null>(null);
  
  const user = useUser();
  const { profile } = useProfile(user?.id ?? "", !!user?.id);

  const modulosVisibles = useMemo(() => {
    return TODOS_LOS_MODULOS.filter((mod) => {
      // Restricción por género solo para usuarios estándar
      if (rol === "user") {
        const generoStr = (profile?.genero as string)?.trim().toLowerCase();
        if (mod.id === "DANZA_DAMAS" && generoStr !== "femenino") return false;
        if (mod.id === "DANZA_CABALLEROS" && generoStr !== "masculino") return false;
      }

      if (mod.soloJefe && !isJefe) return false;
      if (mod.rolesPermitidos === "TODOS") return true;
      if (!rol) return false;
      return mod.rolesPermitidos.includes(rol);
    });
  }, [rol, isJefe, profile]);

  const modulosMinisteriales = useMemo(
    () => modulosVisibles.filter((m) => m.subgrupo === "Organización Ministerial"),
    [modulosVisibles]
  );

  const modulosPlanificacion = useMemo(
    () => modulosVisibles.filter((m) => m.subgrupo === "Planificación de Servicio"),
    [modulosVisibles]
  );

  const modulosFormacion = useMemo(
    () => modulosVisibles.filter((m) => m.subgrupo === "Formación Espiritual"),
    [modulosVisibles]
  );

  if (modulosVisibles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground text-sm">
          No tienes módulos disponibles para tu rol.
        </p>
      </div>
    );
  }

  const tieneIzquierda = modulosMinisteriales.length > 0 || modulosFormacion.length > 0;
  const tieneDerecha = modulosPlanificacion.length > 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <div className={`grid grid-cols-1 ${tieneIzquierda && tieneDerecha ? "lg:grid-cols-2" : ""} gap-8 items-start`}>
        {/* Columna Izquierda: Organización y Formación */}
        {tieneIzquierda && (
          <div className="flex flex-col gap-6">
            {/* Categoría: Organización Ministerial */}
            {modulosMinisteriales.length > 0 && (
              <ModuleAccordion
                titulo="Organización Ministerial"
                descripcion="Estructura organizacional y departamentos"
                iconKey="unfvchvi"
              >
                {modulosMinisteriales.map((mod) => (
                  <ModuleCard
                    key={mod.id}
                    modulo={mod}
                    loadingModule={loadingModule}
                    setLoadingModule={setLoadingModule}
                  />
                ))}
              </ModuleAccordion>
            )}

            {/* Categoría: Formación Espiritual */}
            {modulosFormacion.length > 0 && (
              <ModuleAccordion
                titulo="Formación Espiritual"
                descripcion="Escuelas de Aprendizaje Espiritual"
                iconKey="freytsxj"
              >
                {modulosFormacion.map((mod) => (
                  <ModuleCard
                    key={mod.id}
                    modulo={mod}
                    loadingModule={loadingModule}
                    setLoadingModule={setLoadingModule}
                  />
                ))}
              </ModuleAccordion>
            )}
          </div>
        )}

        {/* Columna Derecha: Planificación de Servicio */}
        {tieneDerecha && (
          <div className="flex flex-col gap-6">
            {/* Categoría: Planificación de Servicio */}
            {modulosPlanificacion.length > 0 && (
              <ModuleAccordion
                titulo="Planificación de Servicio"
                descripcion="Gestión de actividades y departamentos operativos"
                iconKey="ctuxkbtj"
              >
                {modulosPlanificacion.map((mod) => (
                  <ModuleCard
                    key={mod.id}
                    modulo={mod}
                    loadingModule={loadingModule}
                    setLoadingModule={setLoadingModule}
                  />
                ))}
              </ModuleAccordion>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
