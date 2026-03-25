'use client';

import { useEffect } from 'react';
import { X, MapPin, Clock } from 'lucide-react';

interface Registro {
  latitud: number;
  longitud: number;
  fecha_creacion: string;
  tipo: 'entrada' | 'salida';
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  datos: {
    entrada?: Registro;
    salida?: Registro;
  } | null;
  nombreIntegrante: string;
}

export default function ModalUbicacion({ isOpen, onClose, datos, nombreIntegrante }: Props) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      const handleZoom = (e: WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
        }
      };
      
      window.addEventListener('wheel', handleZoom, { passive: false });
      return () => {
        window.removeEventListener('wheel', handleZoom);
        document.body.style.overflow = 'auto';
      };
    }
  }, [isOpen]);

  if (!isOpen || !datos) return null;

  const hasEntrada = !!datos.entrada;
  const hasSalida = !!datos.salida;

  const renderCard = (registro: Registro) => {
    const isEntrada = registro.tipo === 'entrada';
    const accentColor = isEntrada ? 'green' : 'orange';

    const fechaObj = new Date(registro.fecha_creacion);
    
    // Formato: mar, 27/mar/26
    const diaSem = fechaObj.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
    const dia = fechaObj.getDate().toString().padStart(2, '0');
    const mes = fechaObj.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
    const anio = fechaObj.getFullYear().toString().slice(-2);
    const fechaFormateada = `${diaSem}, ${dia}/${mes}/${anio}`;

    // Formato: 10:22 AM
    const horaFormateada = fechaObj.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });

    return (
      <div className={`py-5 px-4 sm:p-5 space-y-4 rounded-none sm:rounded-xl border-y sm:border border-x-0 sm:border-x border-${accentColor}-100 dark:border-${accentColor}-900/40 bg-${accentColor}-50/30 dark:bg-${accentColor}-900/10 relative overflow-hidden transition-all hover:shadow-lg`}>
        {/* Etiqueta Superior */}
        <div className={`absolute top-0 right-0 px-3 py-1 font-bold uppercase tracking-widest rounded-none sm:rounded-bl-xl text-[10px] z-10
          ${isEntrada 
            ? 'bg-green-100 text-green-900 dark:bg-green-200 dark:text-green-950' 
            : 'bg-orange-100 text-orange-900 dark:bg-orange-200 dark:text-orange-950'}`}>
          {isEntrada ? 'Entrada' : 'Salida'}
        </div>

        <div className="flex flex-col pt-2 relative">
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-neutral-800 shadow-sm z-10">
            <Clock size={16} className={isEntrada ? 'text-green-500' : 'text-orange-500'} />
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">Hora de registro</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-gray-900 dark:text-white leading-none">
                  {horaFormateada}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase leading-none">
                  - {fechaFormateada}
                </span>
              </div>
            </div>
          </div>

          {/* MAPA EMBEBIDO - Modo Satelital (&t=k) y Zoom Mejorado (z=18) */}
          <div className="-mx-4 sm:mx-0 mt-4 h-60 rounded-none sm:rounded-xl overflow-hidden border-y sm:border border-gray-200 dark:border-neutral-800 shadow-inner bg-gray-100 dark:bg-neutral-900 animate-in fade-in zoom-in-95 duration-500">
             <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${registro.latitud},${registro.longitud}&t=k&z=18&ie=UTF8&iwloc=&output=embed`}
             ></iframe>
          </div>

          <a 
            href={`https://www.google.com/maps?q=${registro.latitud},${registro.longitud}`} 
            target="_blank" 
            rel="noreferrer"
            className={`w-full flex items-center justify-center gap-2 py-3 mt-4 text-xs font-black rounded-xl transition-all shadow-sm active:scale-[0.98]
              ${isEntrada 
                ? 'bg-green-100 text-green-900 hover:bg-green-200 dark:bg-green-200 dark:text-green-950 dark:hover:bg-green-300' 
                : 'bg-orange-100 text-orange-900 hover:bg-orange-200 dark:bg-orange-200 dark:text-orange-950 dark:hover:bg-orange-300'}`}
          >
            <MapPin size={14} />
            Abrir en Google Maps
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-[5px] sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Crecimos el max-width para acomodar mejor dos columnas en PC, en móvil ocupa todo respetando 5px de borde */}
      <div className="bg-white dark:bg-[#111111] w-full max-w-4xl max-h-[calc(100dvh-10px)] h-[calc(100dvh-10px)] sm:h-auto sm:max-h-[95vh] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-neutral-800 flex flex-col scale-in-center overflow-y-auto">
        
        {/* HEADER - Fijo arriba si el modal scrollea */}
        <div className="sticky top-0 z-20 px-4 sm:px-8 py-4 sm:py-5 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shadow-inner">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-[#f4ebc3] tracking-tight">
                Detalles de Asistencia
              </h3>
              <p className="text-sm text-gray-500 font-medium">Asignado a: <span className="text-gray-700 dark:text-gray-300">{nombreIntegrante}</span></p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all active:scale-95"
            title="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTENIDO (Dos Columnas si hay ambos, una si solo hay uno) */}
        <div className={`px-0 sm:px-6 py-4 sm:py-6 grid gap-2 sm:gap-6 ${hasEntrada && hasSalida ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:max-w-sm sm:mx-auto'}`}>
          {hasEntrada && renderCard(datos.entrada!)}
          {hasSalida && renderCard(datos.salida!)}
          
          {!hasEntrada && !hasSalida && (
            <div className="col-span-full py-10 text-center text-gray-500">
               No hay registros de ubicación.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
