import React, { useState } from 'react';
import { Music, X, User, Loader2, ChevronDown, Check } from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from "@/lib/utils";
import { asignarDirectorCanto } from '../lib/actions/alabanzas';
import Swal from 'sweetalert2';

interface Song {
  id: string;
  nombre: string;
  tipo: string;
  tonalidad?: string;
  bpm?: number;
  compas?: string;
  observaciones?: string;
  director_id?: string;
  director_nombre?: string;
}

interface Integrante {
  usuario_id: string;
  perfil?: { nombre: string; avatar_url?: string | null };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  songs: Song[];
  actividadId: string;
  integrantes: Integrante[];
  puedeGestionar: boolean;
}

export default function ModalRepertorioActividad({ isOpen, onClose, songs, actividadId, integrantes, puedeGestionar }: Props) {
  const [loadingAssignment, setLoadingAssignment] = useState<string | null>(null);
  const [localSongs, setLocalSongs] = useState<Song[]>(songs);

  // Sincronizar automáticamente si cambian desde el servidor
  React.useEffect(() => {
    setLocalSongs(songs);
  }, [songs]);

  const handleAssignDirector = async (songId: string, directorId: string | null) => {
    if (!puedeGestionar) return;
    setLoadingAssignment(songId);

    // Actualización optimista de la interfaz
    const memberMatched = directorId ? integrantes.find(i => i.usuario_id === directorId) : null;
    const newDirectorName = memberMatched?.perfil?.nombre || null;
    
    setLocalSongs(prev => prev.map(s => 
      s.id === songId 
        ? { ...s, director_id: directorId || undefined, director_nombre: newDirectorName || undefined }
        : s
    ));

    try {
      await asignarDirectorCanto(actividadId, songId, directorId);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: directorId ? 'Director asignado' : 'Director removido',
        showConfirmButton: false,
        timer: 2000,
        target: '#modal-repertorio-alabanzas'
      });
    } catch (err: any) {
      Swal.fire({
        title: 'Error',
        text: err.message,
        icon: 'error',
        target: '#modal-repertorio-alabanzas'
      });
    } finally {
      setLoadingAssignment(null);
    }
  };

  // Agrupar por tipo usando la copia local y llaves normalizadas
  const groupedSongs = localSongs.reduce((acc, song) => {
    // Normalizamos la llave para agrupar bajo el mismo nombre aunque en la DB varíe (ej: Alabanza vs alabanza)
    const typeLabel = song.tipo || 'Sin Categoría';
    const canonicalKey = Object.keys(acc).find(k => k.toLowerCase() === typeLabel.toLowerCase()) || typeLabel;
    
    if (!acc[canonicalKey]) acc[canonicalKey] = [];
    acc[canonicalKey].push(song);
    return acc;
  }, {} as Record<string, Song[]>);

  const groupKeys = Object.keys(groupedSongs).sort();

  return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogPortal>
          <DialogOverlay className="backdrop-blur-md bg-black/60 z-[100]" />
          <DialogPrimitive.Content 
            id="modal-repertorio-alabanzas"
            className={cn(
               "fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]",
               "z-[101] w-[99%] sm:w-full sm:max-w-[1100px] h-[98vh] sm:h-[80vh] flex flex-col p-0 overflow-hidden",
               "bg-white dark:bg-[#0a0a0b] border border-neutral-200 dark:border-[#d6a738]/40 rounded-[2rem] sm:rounded-[2.5rem]",
               "shadow-2xl shadow-black/10 dark:shadow-[0_0_50px_rgba(214,167,56,0.15)] outline-none duration-500 transition-all",
               "data-[state=open]:animate-in data-[state=closed]:animate-out",
               "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
               "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
            )}
          >
        
        {/* ENCABEZADO TIPO PERFIL */}
        <DialogHeader className="px-4 sm:px-8 py-5 sm:py-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0a0a0b]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-br from-[#d6a738] to-[#c08e2a] text-white flex items-center justify-center shadow-lg shadow-[#d6a738]/20 shrink-0">
                <Music size={24} className="sm:hidden" />
                <Music size={28} className="hidden sm:block" />
              </div>
              <div className="flex flex-col text-left">
                <DialogTitle className="text-sm sm:text-base font-black text-[#4a3f36] dark:text-white tracking-tight leading-none sm:leading-normal">
                  Repertorio del Servicio
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1 sm:mt-1">
                  <span className="text-[10px] sm:text-xs font-bold text-[#d6a738] bg-[#d6a738]/10 px-2 py-0.5 rounded-full uppercase tracking-widest border border-[#d6a738]/20">
                    {songs.length} Cantos Programados
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="h-10 w-10 flex items-center justify-center rounded-full bg-[#f5f5f5] dark:bg-white/10 hover:bg-[#e5e5e5] dark:hover:bg-white/20 border border-neutral-200 dark:border-white/10 text-[#4a3f36] dark:text-white transition-all outline-none"
              title="Cerrar modal"
            >
              <X size={20} />
            </button>
          </div>
        </DialogHeader>

        {/* CONTENIDO SCROLLEABLE */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar bg-white dark:bg-[#0a0a0b] flex flex-col gap-8 sm:gap-10">
          {songs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-50 py-10">
               <Music size={48} className="text-gray-500 mb-4" />
               <p className="text-gray-400 font-bold">No hay cantos vinculados a este servicio.</p>
            </div>
          ) : (
            groupKeys.map((tipo) => (
              <div key={tipo} className="flex flex-col gap-4 sm:gap-3">
                {/* Título de la Sección de Cantos */}
                <h3 className="text-sm sm:text-base font-bold text-[#4a3f36] dark:text-white border-b-2 border-neutral-100 dark:border-[#d6a738]/30 pb-2 inline-flex items-center gap-2">
                  <span className="text-[#d6a738] font-black tracking-wide uppercase text-xs sm:text-sm">{tipo}:</span>
                </h3>

                {/* --- VISTA TABLE (DESKTOP) --- */}
                <div className="hidden sm:block overflow-x-auto rounded-xl border border-neutral-200 dark:border-[#2a2624] shadow-xl">
                  <table className="w-full text-left border-collapse text-sm table-fixed">
                    <thead>
                      <tr className="bg-neutral-100 dark:bg-[#131211] text-[#d6a738] font-bold uppercase tracking-wider text-[10px]">
                        <th className="px-5 py-3 border-r border-neutral-200 dark:border-[#2a2624] w-[35%]">Nombre</th>
                        <th className="px-5 py-3 border-r border-neutral-200 dark:border-[#2a2624] text-center w-[12%]">Tonalidad</th>
                        <th className="px-5 py-3 border-r border-neutral-200 dark:border-[#2a2624] text-center w-[10%]">BPM</th>
                        <th className="px-5 py-3 border-r border-neutral-200 dark:border-[#2a2624] text-center w-[10%]">Compás</th>
                        <th className="px-5 py-3 border-r border-neutral-200 dark:border-[#2a2624] w-[20%] text-center">Director(a)</th>
                        <th className="px-5 py-3 w-[13%]">Observaciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-[#1a1a1a] text-[#4a3f36] dark:text-[#f4ebc3] font-medium text-[13px]">
                      {groupedSongs[tipo].map((song) => (
                        <tr key={song.id} className="border-b border-neutral-100 dark:border-[#2a2624] last:border-none hover:bg-neutral-50 dark:hover:bg-[#2a2624]/50 transition-colors">
                          <td className="px-5 py-3 border-r border-neutral-100 dark:border-[#2a2624] font-bold truncate" title={song.nombre}>{song.nombre}</td>
                          <td className="px-5 py-3 border-r border-neutral-100 dark:border-[#2a2624] text-center font-black text-[#d6a738]">{song.tonalidad || '-'}</td>
                          <td className="px-5 py-3 border-r border-neutral-100 dark:border-[#2a2624] text-center opacity-80">{song.bpm || '-'}</td>
                          <td className="px-5 py-3 border-r border-neutral-100 dark:border-[#2a2624] text-center opacity-80">{song.compas || '-'}</td>
                          <td className="px-5 py-3 border-r border-neutral-100 dark:border-[#2a2624] text-center">
                            <DirectorSelector 
                               song={song} 
                               integrantes={integrantes} 
                               isLoading={loadingAssignment === song.id}
                               onAssign={(directorId) => handleAssignDirector(song.id, directorId)}
                               disabled={!puedeGestionar}
                            />
                          </td>
                          <td className="px-5 py-3 opacity-60 italic truncate" title={song.observaciones || ''}>{song.observaciones || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* --- VISTA CARDS (MOBILE) --- */}
                <div className="flex flex-col gap-4 sm:hidden">
                  {groupedSongs[tipo].map((song) => (
                    <div 
                      key={song.id} 
                      className="bg-white dark:bg-[#131211] rounded-2xl overflow-hidden border border-neutral-100 dark:border-[#2a2624] shadow-lg"
                    >
                      {/* Cabecera de la tarjeta */}
                      <div className="bg-[#fbf7e6] dark:bg-[#2a241e] px-4 py-2 border-b border-amber-200/30 dark:border-[#3a3229] flex items-center justify-between">
                         <div className="w-4 h-4 opacity-30" />
                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d6a738] text-center">
                           {tipo}
                         </span>
                         <div className="w-4 h-4 opacity-30" />
                      </div>
                      
                      {/* Cuerpo de la tarjeta */}
                      <div className="py-6 px-4 flex items-center justify-center text-center">
                        <h4 className="text-base font-black text-[#4a3f36] dark:text-[#f4ebc3] uppercase tracking-tight">
                          {song.nombre}
                        </h4>
                      </div>

                      {/* Footer de la tarjeta con 3 columnas */}
                      <div className="grid grid-cols-3 border-t border-neutral-100 dark:border-[#2a2624] bg-neutral-50/50 dark:bg-black/40">
                        <div className="flex flex-col items-center justify-center py-3 border-r border-neutral-100 dark:border-[#2a2624]">
                          <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">BPM</span>
                          <span className="text-base font-black text-[#d6a738] leading-none">{song.bpm || '-'}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center py-3 border-r border-neutral-100 dark:border-[#2a2624]">
                          <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Tonalidad</span>
                          <span className="text-base font-black text-[#d6a738] leading-none">{song.tonalidad || '-'}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center py-3">
                          <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Compás</span>
                          <span className="text-base font-black text-[#d6a738] leading-none">{song.compas || '-'}</span>
                        </div>
                      </div>
                      
                      {/* Fila del Director (Móvil) */}
                      <div className="bg-white dark:bg-[#1a1a1a] border-t border-neutral-100 dark:border-[#2a2624] px-4 py-2.5 flex items-center justify-start gap-3">
                         <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5 shrink-0">
                           <User size={12} className="text-[#d6a738]" /> DIRECTOR:
                         </span>
                         <DirectorSelector 
                            song={song} 
                            integrantes={integrantes} 
                            isLoading={loadingAssignment === song.id}
                            onAssign={(directorId) => handleAssignDirector(song.id, directorId)}
                            disabled={!puedeGestionar}
                         />
                      </div>

                      {/* Observaciones (Solo si existen) */}
                      {song.observaciones && (
                        <div className="px-4 py-3 bg-neutral-50 dark:bg-black/50 border-t border-neutral-100 dark:border-[#2a2624] text-[11px] text-gray-500 dark:text-gray-400 italic text-center">
                          "{song.observaciones}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>

              </div>
            ))
          )}
        </div>
        
         <style dangerouslySetInnerHTML={{ __html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 5px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.05);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #d6a738;
            border-radius: 10px;
            transition: all 0.3s ease;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #b08a2e;
          }
        `}} />

      </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

// Subcomponente para el Selector de Director
function DirectorSelector({ 
  song, 
  integrantes, 
  isLoading, 
  onAssign, 
  disabled 
}: { 
  song: Song; 
  integrantes: Integrante[]; 
  isLoading: boolean; 
  onAssign: (id: string | null) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={(v) => !disabled && setOpen(v)}>
      <PopoverPrimitive.Trigger 
        disabled={disabled}
        className={cn(
          "w-fit min-w-[100px] flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[10px] font-bold outline-none",
          song.director_id 
             ? "bg-[#d6a738]/10 border-[#d6a738]/30 text-[#4a3f36] dark:text-[#f4ebc3] hover:border-[#d6a738]" 
             : "bg-transparent border-dashed border-neutral-300 dark:border-gray-600/50 text-gray-400 dark:text-gray-500 hover:border-[#d6a738]/50 hover:text-[#d6a738]",
          isLoading ? "opacity-50 pointer-events-none" : "",
          disabled ? "cursor-default opacity-80 hover:border-transparent hover:text-inherit" : "cursor-pointer"
        )}
      >
        {isLoading ? (
          <Loader2 size={13} className="animate-spin text-[#d6a738]" />
        ) : song.director_nombre ? (
          <>
            <User size={11} className="text-[#d6a738] shrink-0" /> 
            <span className="truncate max-w-[80px]">{song.director_nombre}</span>
          </>
        ) : (
          <span className="opacity-70">{disabled ? 'Sin asignar' : 'Asignar...'}</span>
        )}
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="center"
          sideOffset={4}
          className="z-[110] w-[220px] p-2 rounded-xl bg-white dark:bg-[#131211] border border-neutral-200 dark:border-[#2a2624] shadow-2xl animate-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95"
        >
          <div className="flex flex-col gap-1">
             <div className="px-2 py-1.5 text-[9px] font-black text-[#847563] uppercase tracking-widest border-b border-neutral-100 dark:border-[#2a2624] mb-1">
               Seleccionar Miembro
             </div>

             {/* Opción de Remover */}
             {song.director_id && (
               <button
                 onClick={() => { onAssign(null); setOpen(false); }}
                 className="flex items-center gap-2 px-2 py-2 w-full text-left text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
               >
                 <X size={14} /> Remover asigación
               </button>
             )}

             <div 
               className="max-h-[200px] overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1 pointer-events-auto"
               onWheel={(e) => e.stopPropagation()}
               onTouchMove={(e) => e.stopPropagation()}
             >
               {integrantes.map((int) => {
                 const isSelected = int.usuario_id === song.director_id;
                 return (
                   <button
                     key={int.usuario_id}
                     onClick={() => { onAssign(int.usuario_id); setOpen(false); }}
                     className={cn(
                       "flex items-center justify-between px-2 py-2 w-full text-left rounded-lg transition-all text-xs outline-none",
                       isSelected 
                          ? "bg-[#d6a738]/10 text-[#d6a738] font-black" 
                          : "text-[#4a3f36] dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium"
                     )}
                   >
                     <div className="flex items-center gap-2 truncate">
                        {int.perfil?.avatar_url ? (
                           <img src={int.perfil.avatar_url} className="w-5 h-5 rounded-full object-cover shrink-0" alt="" />
                        ) : (
                           <div className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                             <User size={10} className="text-gray-500" />
                           </div>
                        )}
                        <span className="truncate">{int.perfil?.nombre || 'Usuario Desconocido'}</span>
                     </div>
                     {isSelected && <Check size={14} />}
                   </button>
                 );
               })}

               {integrantes.length === 0 && (
                  <div className="px-2 py-4 text-center text-[10px] text-gray-500 italic">
                    No hay asignados
                  </div>
               )}
             </div>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

