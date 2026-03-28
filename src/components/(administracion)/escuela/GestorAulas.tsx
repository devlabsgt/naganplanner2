import { obtenerDatosEscuela } from './lib/action';
import AulaList from './aulas/AulaList';

export default async function GestorAulas() {
  const datos = await obtenerDatosEscuela();

  if (!datos) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center space-y-4">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-2xl border border-red-100 dark:border-red-800 shadow-sm max-w-md">
          <h3 className="font-bold text-lg mb-2">Acceso Restringido</h3>
          <p className="text-sm">
            No se pudo cargar la información de las aulas o no tienes permisos para ver esta sección.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto px-0.5 md:px-1 py-1 sm:py-2">
      <AulaList 
        initialData={{
          aulas: datos.aulas,
          usuarios: datos.usuarios,
          horarios: datos.horarios,
          perfilActual: datos.perfilActual as any
        }} 
      />
    </div>
  );
}
