'use client';

import { useState, useMemo } from 'react';
import { X, CalendarCheck, CheckCircle2, XCircle, Loader2, Save, AlertCircle } from 'lucide-react';
import { AsistenciaFormItem } from '../../lib/zod';
import { useAsistenciaMutations } from '../../lib/hooks';
import Swal from 'sweetalert2';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    aulaId: string;
    estudiantes: AsistenciaFormItem[];
}

type EstadoAsistencia = boolean | null;

// Omit 'asistio' de AsistenciaFormItem para poder redefinirlo como boolean | null
interface ItemLista extends Omit<AsistenciaFormItem, 'asistio'> {
    asistio: EstadoAsistencia;
}

function formatearFechaHoy(): string {
    return new Date().toLocaleDateString('es-GT', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}

export default function ModalTomarAsistencia({ isOpen, onClose, aulaId, estudiantes }: Props) {
    const { guardar } = useAsistenciaMutations(aulaId);

    // Estado inicial: usa el valor pasado (si ya se tomó hoy) o false (ausente por defecto)
    const [lista, setLista] = useState<ItemLista[]>(() =>
        estudiantes.map((e) => ({
            ...e,
            asistio: (e.asistio !== undefined && e.asistio !== null) ? e.asistio : false
        }))
    );

    if (!isOpen) return null;

    const presentes = lista.filter((e) => e.asistio === true).length;
    const ausentes = lista.filter((e) => e.asistio === false).length;

    // Ciclo simple: true <-> false
    const toggleEstudiante = (id: string) => {
        setLista((prev) =>
            prev.map((e) => e.estudiante_id === id ? { ...e, asistio: !e.asistio } : e)
        );
    };

    const marcarTodos = (valor: boolean) => {
        setLista((prev) => prev.map((e) => ({ ...e, asistio: valor })));
    };

    const handleGuardar = async () => {
        try {
            await guardar.mutateAsync(lista.map((e) => ({
                estudiante_id: e.estudiante_id,
                asistio: e.asistio as boolean,
            })));
            Swal.fire({
                icon: 'success',
                title: '¡Asistencia guardada!',
                html: `<b>${presentes} presente${presentes !== 1 ? 's' : ''}</b> · <b>${ausentes} ausente${ausentes !== 1 ? 's' : ''}</b>`,
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 5000,
                timerProgressBar: true,
                showClass: { popup: 'animate__animated animate__slideInDown' },
                hideClass: { popup: 'animate__animated animate__fadeOutUp' }
            });
            onClose();
        } catch (err: any) {
            Swal.fire({ 
                icon: 'error', 
                title: 'Error al ahorrar', 
                text: err.message,
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 5000,
                timerProgressBar: true,
                showClass: { popup: 'animate__animated animate__slideInDown' },
                hideClass: { popup: 'animate__animated animate__fadeOutUp' }
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0.5 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#0f0f0f] w-full max-w-[600px] rounded-3xl shadow-2xl flex flex-col max-h-[92vh] border border-[#d5cec2] dark:border-[#3e3630] animate-in zoom-in-95 duration-200">

                {/* HEADER */}
                <div className="px-6 py-5 border-b border-[#d5cec2] dark:border-[#3e3630] flex justify-between items-start bg-white dark:bg-[#0f0f0f]">
                    <div>
                        <h2 className="text-base font-black text-[#4a3f36] dark:text-[#f4ebc3] uppercase tracking-tight flex items-center gap-3">
                            <CalendarCheck className="text-[#d6a738]" size={20} />
                            Pasar Asistencia
                        </h2>
                        <p className="text-[10px] font-bold text-[#847563] uppercase tracking-widest mt-1 capitalize">
                            {formatearFechaHoy()}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-[#847563] hover:text-[#4a3f36] dark:hover:text-[#f4ebc3]">
                        <X size={20} />
                    </button>
                </div>

                {/* STATS BAR */}
                <div className="px-6 py-2 border-b border-[#d5cec2] dark:border-[#3e3630] flex flex-col sm:flex-row items-center justify-between gap-1 bg-[#fafafa] dark:bg-[#0a0a0a]">
                    <div className="flex items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20"></div>
                            <span className="text-[11px] font-black text-[#4a3f36] dark:text-[#f4ebc3] uppercase tracking-widest">{presentes} Presentes</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/20"></div>
                            <span className="text-[11px] font-black text-[#4a3f36] dark:text-[#f4ebc3] uppercase tracking-widest">{ausentes} Ausentes</span>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end">
                        <button
                            onClick={() => marcarTodos(true)}
                            className="flex-1 sm:flex-none text-[10px] font-black uppercase tracking-widest px-1 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-all border border-emerald-500/10"
                        >
                            Todos Presentes
                        </button>
                        <button
                            onClick={() => marcarTodos(false)}
                            className="flex-1 sm:flex-none text-[10px] font-black uppercase tracking-widest px-1 py-2 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 rounded-lg transition-all border border-red-500/10"
                        >
                            Todos Ausentes
                        </button>
                    </div>
                </div>


                {/* LISTA DE ALUMNOS */}
                <div className="flex-1 overflow-y-auto px-2 py-4 space-y-2.5 custom-scrollbar">
                    {lista.map((est) => {
                        const esPresente = est.asistio === true;
                        const esAusente = est.asistio === false;

                        return (
                            <button
                                key={est.estudiante_id}
                                onClick={() => toggleEstudiante(est.estudiante_id)}
                                className={`
                                    w-full flex items-center gap-3.5 px-1.5 py-1.5 rounded-xl border transition-all text-left group
                                    ${esPresente ? 'bg-emerald-500/5 border-emerald-500/30'
                                        : 'bg-red-500/5 border-red-500/20'}
                                `}
                            >
                                {/* Inicial */}
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm border transition-all
                                    ${esPresente ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                        : 'bg-red-500/10 border-red-500/20 text-red-400'}
                                `}>
                                    {est.nombre.charAt(0).toUpperCase()}
                                </div>


                                {/* Nombre + género */}
                                <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-0.5 md:gap-4">
                                    <p className={`text-sm font-black uppercase tracking-tight truncate transition-colors
                                        ${esPresente ? 'text-[#4a3f36] dark:text-[#f4ebc3]'
                                            : esAusente ? 'text-[#847563]'
                                                : 'text-[#6a5a4a]'}
                                    `}>
                                        {est.nombre}
                                    </p>
                                    <p className={`text-[9px] font-black uppercase tracking-widest
                                        ${est.genero === 'femenino' ? 'text-pink-500 dark:text-pink-400' : 'text-[#847563] dark:text-[#4a3f36]'}
                                    `}>{est.genero}</p>
                                </div>

                                {/* Icono de estado */}
                                <div className="shrink-0">
                                    {esPresente ? (
                                        <CheckCircle2 size={22} className="text-emerald-400" />
                                    ) : (
                                        <XCircle size={22} className="text-red-400" />
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* FOOTER */}
                <div className="px-6 py-4 border-t border-[#d5cec2] dark:border-[#3e3630] flex justify-end items-center gap-3 bg-white dark:bg-[#0f0f0f]">
                    <button onClick={onClose} className="px-6 py-3 text-[#847563] hover:text-[#4a3f36] dark:hover:text-[#f4ebc3] font-black text-[10px] uppercase tracking-widest hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all">
                        Cancelar
                    </button>
                    <button
                        onClick={handleGuardar}
                        disabled={guardar.isPending || lista.length === 0}
                        className="flex items-center gap-2 px-8 py-3 bg-[#d6a738] hover:bg-[#c08e2a] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#d6a738]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                        {guardar.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Guardar{estudiantes.some(e => e.asistio !== null && e.asistio !== undefined) ? ' Cambios' : ' Asistencia'}
                    </button>
                </div>
            </div>
        </div>
    );
}
