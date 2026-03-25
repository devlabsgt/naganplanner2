import { Suspense } from "react";
import GestorPlanificador from "@/components/(administracion)/planificador/GestorPlanificador";

export default function PlanificadorPageDanzaCaballeros() {
  return (
    <div className="w-full">
      <Suspense fallback={<div className="p-10 text-center text-gray-500">Cargando comisiones...</div>}>
        <GestorPlanificador tipoVista="mis_actividades" modulo="danza-caballeros"/>
      </Suspense>
    </div>
  );
}
