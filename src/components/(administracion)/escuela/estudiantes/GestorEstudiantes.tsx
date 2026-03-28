'use client';

import { useState, useMemo } from 'react';
import {
    Users, Search, UserPlus, Trash2, Phone, Baby,
    ChevronDown, ChevronUp, Eye, Edit3, UserMinus, CalendarCheck2
} from 'lucide-react';
import { useGestorEstudiantes, useEstudianteMutations, useAsistencias } from '../lib/hooks';
import { EstudianteAula, SesionAsistencia } from '../lib/zod';
import InscribirEstudiante from './modals/InscribirEstudiante';
import ModalEstudiante from './modals/ModalEstudiante';
import Swal from 'sweetalert2';

interface Props {
    aulaId: string;
    perfilActual: any;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function calcularEdad(fechaISO: string | null | undefined): string {
    if (!fechaISO) return '—';
    const hoy = new Date();
    const nac = new Date(fechaISO);
    const edad = hoy.getFullYear() - nac.getFullYear();
    const cumplioEsteAño =
        hoy.getMonth() > nac.getMonth() ||
        (hoy.getMonth() === nac.getMonth() && hoy.getDate() >= nac.getDate());
    return `${cumplioEsteAño ? edad : edad - 1} años`;
}

function badgeGenero(genero: string) {
    const mapa: Record<string, { label: string; color: string }> = {
        masculino: { label: 'M', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
        femenino: { label: 'F', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
    };
    const { label, color } = mapa[genero] ?? { label: '?', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };
    return (
        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black border ${color}`}>
            {label}
        </span>
    );
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export default function GestorEstudiantes({ aulaId, perfilActual }: Props) {
    const [busqueda, setBusqueda] = useState('');
    const [isModalInscribirOpen, setIsModalInscribirOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<{ open: boolean, data: any, readOnly: boolean }>({
        open: false,
        data: null,
        readOnly: false
    });
    const [idExpandido, setIdExpandido] = useState<string | null>(null);

    const { data: inscripciones = [], isLoading } = useGestorEstudiantes(aulaId);
    const { data: sesiones = [] } = useAsistencias(aulaId); // Cargamos el historial de asistencias
    const { desinscribir } = useEstudianteMutations(aulaId);

    // --- LÓGICA DE ESTADÍSTICAS POR ALUMNO (LIGERA Y ROBUSTA) ---
    const statsAsistencia = useMemo(() => {
        const mapa: Record<string, { total: number; asistio: number; pct: number }> = {};

        // 1. Inicializar mapa con alumnos inscritos
        inscripciones.forEach(ins => {
            if (ins.estudiante_id) {
                mapa[ins.estudiante_id] = { total: 0, asistio: 0, pct: 0 };
            }
        });

        // 2. Procesar lista plana de asistencias (asistencias es un Array de registros directos)
        const registrosAsistencia = (sesiones || []) as any[];
        registrosAsistencia.forEach(reg => {
            if (reg.estudiante_id && mapa[reg.estudiante_id]) {
                mapa[reg.estudiante_id].total++;
                if (reg.asistio) mapa[reg.estudiante_id].asistio++;
            }
        });

        // 3. Calcular porcentajes finales
        Object.keys(mapa).forEach(id => {
            const s = mapa[id];
            s.pct = s.total > 0 ? Math.round((s.asistio / s.total) * 100) : 0;
        });

        return mapa;
    }, [inscripciones, sesiones]);

    // Filtrado reactivo
    const filtrados = useMemo(() => {
        const q = busqueda.toLowerCase().trim();
        const data = (inscripciones || []) as any[];
        if (!q) return data as EstudianteAula[];
        return data.filter((e) => e.estudiante?.nombre?.toLowerCase().includes(q)) as EstudianteAula[];
    }, [inscripciones, busqueda]);

    const handleDesinscribir = async (inscripcion: EstudianteAula) => {
        const res = await Swal.fire({
            title: '¿Retirar de la clase?',
            text: `Se retirará a "${inscripcion.estudiante?.nombre}" de este aula.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, retirar',
            cancelButtonText: 'Cancelar',
        });
        if (!res.isConfirmed) return;
        try {
            await desinscribir.mutateAsync(inscripcion.id);
            Swal.fire({ 
                icon: 'success', 
                title: 'Alumno retirado', 
                toast: true,
                position: 'top', 
                showConfirmButton: false, 
                timer: 5000,
                timerProgressBar: true,
                showClass: { popup: 'animate__animated animate__slideInDown' },
                hideClass: { popup: 'animate__animated animate__fadeOutUp' }
            });
        } catch (err: any) {
            Swal.fire({ 
                icon: 'error', 
                title: 'Error', 
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
        <>
            <div className="bg-white dark:bg-[#0a0a0a] border border-[#d5cec2] dark:border-[#3e3630] rounded-[2.5rem] overflow-hidden flex flex-col min-h-[500px] shadow-sm">

                {/* HEADER Y BUSCADOR */}
                <div className="px-3 md:px-6 py-4 border-b border-[#d5cec2] dark:border-[#3e3630] flex flex-col md:flex-row md:items-center justify-center md:justify-between gap-5">
                    <div className="shrink-0 text-center md:text-left">
                        <h2 className="text-sm md:text-base font-black uppercase tracking-tight text-[#4a3f36] dark:text-[#f4ebc3] flex items-center justify-center md:justify-start gap-3">
                            <Users className="text-[#d6a738]" size={20} />
                            <span className="hidden sm:inline">Directorio de Estudiantes</span>
                            <span className="sm:hidden text-xs">Directorio de Estudiantes</span>
                        </h2>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-[600px] flex-1">
                        <div className="relative group w-full">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#847563] group-focus-within:text-[#d6a738] transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar en esta clase..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="bg-[#f5f5f5] dark:bg-[#111] border border-[#e5e5e5] dark:border-[#2a2420] text-[#4a3f36] dark:text-white rounded-2xl pl-11 pr-4 py-3 outline-none focus:border-[#d6a738]/50 transition-colors text-sm font-bold w-full placeholder:text-[#847563]/50"
                            />
                        </div>

                        <button
                            onClick={() => setIsModalInscribirOpen(true)}
                            className="bg-[#d6a738] hover:bg-[#c08e2a] text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#d6a738]/10 transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95 w-full sm:w-auto"
                        >
                            <UserPlus size={16} /> <span className="whitespace-nowrap">Inscribir Alumno</span>
                        </button>
                    </div>
                </div>

                {/* LISTADO */}
                <div className="flex-1 px-1 md:px-3 py-2 space-y-3">
                    {isLoading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="h-20 bg-[#111] rounded-2xl border border-[#2a2420] animate-pulse" />
                        ))
                    ) : filtrados.length > 0 ? (
                        filtrados.map((item) => {
                            const estaExpandido = idExpandido === item.id;
                            return (
                                <div
                                    key={item.id}
                                    className={`
                                        bg-[#fafafa] dark:bg-[#111] border rounded-xl transition-all overflow-hidden
                                        ${estaExpandido ? 'border-[#d6a738] shadow-lg shadow-[#d6a738]/5' : 'border-[#e5e5e5] dark:border-[#2a2420] hover:border-[#d5cec2] dark:hover:border-[#3e3630]'}
                                    `}
                                >
                                    {/* CABECERA DE FILA (Click para expandir) */}
                                    <button
                                        onClick={() => setIdExpandido(estaExpandido ? null : item.id)}
                                        className="w-full px-3.5 py-3 flex flex-col gap-3 text-left group"
                                    >
                                        <div className="flex items-center gap-4 w-full">
                                            {/* Foto / Inicial con color de género */}
                                            <div className={`
                                                w-11 h-11 rounded-xl border flex items-center justify-center shrink-0
                                                ${item.estudiante?.genero === 'masculino'
                                                    ? 'bg-blue-500/5 border-blue-500/20 text-blue-400'
                                                    : item.estudiante?.genero === 'femenino'
                                                        ? 'bg-pink-500/5 border-pink-500/20 text-pink-400'
                                                        : 'bg-[#d6a738]/5 border-[#d6a738]/20 text-[#d6a738]'
                                                }
                                            `}>
                                                <span className="text-base font-black uppercase">
                                                    {item.estudiante?.nombre?.charAt(0)}
                                                </span>
                                            </div>

                                            <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center md:justify-start gap-1 md:gap-8">
                                                {/* Nombre */}
                                                <p className="text-sm font-black text-[#4a3f36] dark:text-[#f4ebc3] uppercase tracking-tight truncate md:min-w-[150px] lg:min-w-[220px]">
                                                    {item.estudiante?.nombre}
                                                </p>

                                                {/* Metadata */}
                                                <div className={`items-center gap-4 md:gap-6 ${estaExpandido ? 'flex' : 'hidden md:flex'}`}>
                                                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#847563] uppercase tracking-widest whitespace-nowrap">
                                                        <Baby size={10} className="text-[#d6a738]/50" />
                                                        {calcularEdad(item.estudiante?.fecha_nacimiento)}
                                                    </span>
                                                    {item.estudiante?.telefono && (
                                                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#847563] uppercase tracking-widest whitespace-nowrap">
                                                            <Phone size={10} className="text-[#d6a738]/50" />
                                                            {item.estudiante.telefono}
                                                        </span>
                                                    )}
                                                    <span className={`text-[9px] font-black uppercase tracking-widest hidden lg:block ${item.estudiante?.genero === 'femenino' ? 'text-pink-500' : 'text-[#847563]'}`}>
                                                        {item.estudiante?.genero}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Widget de Porcentaje/Barra (PC en una linea) */}
                                            <div className="hidden md:flex items-center gap-4 shrink-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-[#4a3f36] dark:text-[#f4ebc3]">{statsAsistencia[item.estudiante_id]?.pct || 0}%</span>
                                                </div>
                                                <div className="w-24 lg:w-32 h-1 bg-[#e5e5e5] dark:bg-[#1a1a1a] rounded-full overflow-hidden border border-[#e5e5e5] dark:border-[#2a2420]">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-[#d6a738] to-[#f4ebc3] transition-all duration-1000"
                                                        style={{ width: `${statsAsistencia[item.estudiante_id]?.pct || 0}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className={`p-2 rounded-xl transition-all ${estaExpandido ? 'bg-[#d6a738] text-white shadow-lg shadow-[#d6a738]/20' : 'text-[#847563] hover:text-[#4a3f36] dark:hover:text-[#f4ebc3] bg-black/5 dark:bg-white/5'}`}>
                                                {estaExpandido ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                            </div>
                                        </div>

                                        {/* Stats rápidos en móvil (Solo si expandido y ocupando todo el ancho) */}
                                        {estaExpandido && (
                                            <div className="md:hidden flex flex-col gap-1.5 w-full pt-2 border-t border-[#e5e5e5] dark:border-[#2a2420]/50">
                                                <div className="flex items-center justify-between gap-1.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <CalendarCheck2 size={12} className="text-[#d6a738]" />
                                                        <span className="text-[10px] font-black text-[#847563] uppercase tracking-widest leading-none">
                                                            Asistencia General
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-black text-[#d6a738] leading-none">
                                                        {statsAsistencia[item.estudiante_id]?.pct || 0}%
                                                    </span>
                                                </div>
                                                <div className="w-full h-1.5 bg-[#e5e5e5] dark:bg-[#1a1a1a] rounded-full overflow-hidden border border-[#e5e5e5] dark:border-[#2a2420]">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-[#d6a738] to-[#f4ebc3] transition-all duration-700 shadow-[0_0_10px_rgba(214,167,56,0.2)]"
                                                        style={{ width: `${statsAsistencia[item.estudiante_id]?.pct || 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </button>

                                    {/* PANEL DE ACCIONES (Acordeón) */}
                                    {estaExpandido && (
                                        <div className="px-5 pb-5 pt-2 border-t border-[#e5e5e5] dark:border-[#2a2420] flex flex-wrap gap-2 animate-in slide-in-from-top-1 duration-200">
                                            <button
                                                onClick={() => setModalConfig({ open: true, data: item.estudiante, readOnly: true })}
                                                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 bg-[#f5f5f5] dark:bg-[#1a1a1a] hover:bg-[#eee] dark:hover:bg-[#222] border border-[#e5e5e5] dark:border-[#2a2420] rounded-xl text-[10px] font-black uppercase tracking-widest text-[#4a3f36] dark:text-[#f4ebc3] transition-all"
                                            >
                                                <Eye size={14} className="text-[#d6a738]" /> Ver Datos
                                            </button>
                                            <button
                                                onClick={() => setModalConfig({ open: true, data: item.estudiante, readOnly: false })}
                                                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 bg-[#f5f5f5] dark:bg-[#1a1a1a] hover:bg-[#eee] dark:hover:bg-[#222] border border-[#e5e5e5] dark:border-[#2a2420] rounded-xl text-[10px] font-black uppercase tracking-widest text-[#4a3f36] dark:text-[#f4ebc3] transition-all"
                                            >
                                                <Edit3 size={14} className="text-blue-500 dark:text-blue-400" /> Editar
                                            </button>
                                            <button
                                                onClick={() => handleDesinscribir(item)}
                                                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-400 transition-all"
                                            >
                                                <UserMinus size={14} /> Desuscribir
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                            <Users size={48} className="mb-4 text-[#847563] opacity-20" />
                            <h3 className="text-base font-black uppercase tracking-widest text-[#4a3f36] dark:text-[#f4ebc3]">No hay estudiantes</h3>
                            <p className="text-xs font-bold text-[#847563] mt-2">Inscribe a un alumno para comenzar.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* MODALES */}
            <InscribirEstudiante
                isOpen={isModalInscribirOpen}
                onClose={() => setIsModalInscribirOpen(false)}
                aulaId={aulaId}
            />

            {modalConfig.open && (
                <ModalEstudiante
                    isOpen={modalConfig.open}
                    onClose={() => setModalConfig({ ...modalConfig, open: false })}
                    estudiante={modalConfig.data}
                    readOnly={modalConfig.readOnly}
                    perfilActual={perfilActual}
                />
            )}
        </>
    );
}
