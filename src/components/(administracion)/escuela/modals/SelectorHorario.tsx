'use client';

import { useState } from 'react';
import { 
    X, Plus, Clock, CalendarDays, Edit2, 
    Trash2, CheckCircle2, ChevronRight, SearchX, PlusCircle 
} from 'lucide-react';
import { Horario, DIAS_OPCIONES } from '../lib/zod';
import { useHorarioMutations } from '../lib/hooks';
import NuevoHorario from './NuevoHorario';
import Swal from 'sweetalert2';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    horarios: Horario[];
    onSelect: (id: string) => void;
    selectedId?: string;
}

export default function SelectorHorario({ isOpen, onClose, horarios, onSelect, selectedId }: Props) {
    const { eliminar } = useHorarioMutations();
    const [isNuevoOpen, setIsNuevoOpen] = useState(false);
    const [idEdicion, setIdEdicion] = useState<string | undefined>(undefined);
    const [horarioEdicion, setHorarioEdicion] = useState<any>(undefined);

    const getDiasLabels = (dias: number[]) => {
        return DIAS_OPCIONES
            .filter(d => dias.includes(d.id))
            .map(d => d.label)
            .join(', ');
    };

    const handleEliminar = async (e: React.MouseEvent, h: Horario) => {
        e.stopPropagation();
        const res = await Swal.fire({
            title: '¿Eliminar horario?',
            text: `Borraras "${h.nombre}". Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (res.isConfirmed) {
            try {
                await eliminar.mutateAsync(h.id);
                Swal.fire({ icon: 'success', title: 'Horario eliminado', toast: true, position: 'top-end', showConfirmButton: false, timer: 2500 });
            } catch (err: any) {
                Swal.fire({ icon: 'error', title: 'Error', text: err.message });
            }
        }
    };

    const handleEditar = (e: React.MouseEvent, h: Horario) => {
        e.stopPropagation();
        setIdEdicion(h.id);
        setHorarioEdicion({
            nombre: h.nombre,
            dias: h.dias,
            entrada: h.entrada,
            salida: h.salida
        });
        setIsNuevoOpen(true);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                <div className="bg-[#f8f9fa] dark:bg-[#121212] w-full max-w-[550px] rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-white/10 animate-in zoom-in-95 duration-200">
                    
                    {/* HEADER */}
                    <div className="px-8 py-6 flex justify-between items-center border-b border-gray-100 dark:border-white/5 bg-white dark:bg-[#1a1a1a]">
                        <div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Seleccionar Horario</h2>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">Gestión de Horarios Maestros</p>
                        </div>
                        <button onClick={onClose} className="p-2.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-400">
                            <X size={22} />
                        </button>
                    </div>

                    {/* LISTADO */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                        
                        <button 
                            onClick={() => { setIdEdicion(undefined); setHorarioEdicion(undefined); setIsNuevoOpen(true); }}
                            className="w-full flex items-center justify-center gap-3 py-5 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[2rem] text-gray-400 dark:text-gray-500 hover:border-blue-500/50 hover:text-blue-500 hover:bg-blue-500/5 transition-all group"
                        >
                            <PlusCircle size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                            <span className="font-black text-sm uppercase tracking-widest">Crear Nuevo Horario</span>
                        </button>

                        {horarios.length > 0 ? (
                            horarios.map((h) => (
                                <div 
                                    key={h.id}
                                    onClick={() => { onSelect(h.id); onClose(); }}
                                    className={`
                                        group relative p-5 rounded-[2rem] border transition-all cursor-pointer flex items-center gap-4
                                        ${selectedId === h.id 
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/30' 
                                            : 'bg-white dark:bg-[#1a1a1a] border-gray-100 dark:border-white/5 text-gray-900 dark:text-white hover:border-blue-500/30 hover:shadow-lg'
                                        }
                                    `}
                                >
                                    <div className={`p-3 rounded-2xl ${selectedId === h.id ? 'bg-white/20' : 'bg-gray-50 dark:bg-white/5 text-blue-500'}`}>
                                        <Clock size={20} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-black text-base truncate uppercase tracking-tight">{h.nombre}</h3>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest truncate ${selectedId === h.id ? 'text-blue-100' : 'text-gray-400'}`}>
                                            {getDiasLabels(h.dias)}
                                        </p>
                                        <p className={`text-xs font-black mt-1 ${selectedId === h.id ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`}>
                                            {h.entrada} - {h.salida}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => handleEditar(e, h)}
                                            className={`p-2.5 rounded-xl transition-colors ${selectedId === h.id ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-amber-500'}`}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={(e) => handleEliminar(e, h)}
                                            className={`p-2.5 rounded-xl transition-colors ${selectedId === h.id ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-red-500'}`}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {selectedId === h.id && (
                                        <CheckCircle2 size={24} className="text-white ml-2 animate-in zoom-in-50 duration-300" />
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center opacity-40">
                                <SearchX size={48} />
                                <p className="font-bold text-sm mt-4 uppercase tracking-widest text-center">No hay horarios creados<br/><span className="text-[10px] opacity-70">Empieza creando uno nuevo arriba</span></p>
                            </div>
                        )}
                    </div>

                    {/* FOOTER */}
                    <div className="p-8 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#1a1a1a]/50">
                        <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Selecciona un horario para asignarlo automáticamente al aula
                        </p>
                    </div>
                </div>
            </div>

            <NuevoHorario 
                isOpen={isNuevoOpen}
                onClose={() => { setIsNuevoOpen(false); setIdEdicion(undefined); setHorarioEdicion(undefined); }}
                idEdicion={idEdicion}
                initialData={horarioEdicion}
            />
        </>
    );
}
