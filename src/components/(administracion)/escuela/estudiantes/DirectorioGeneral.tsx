'use client';

import { useState, useMemo } from 'react';
import {
    Users, Search, Plus, Phone, Baby,
    ChevronDown, ChevronUp, Edit3, Trash2,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { buscarEstudiantesGenerales } from '../lib/action';
import { Estudiante } from '../lib/zod';
import { useEstudianteGeneralMutations } from '../lib/hooks';
import ModalEstudiante from './modals/ModalEstudiante';
import Swal from 'sweetalert2';

interface Props {
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

// ─── COMPONENTE INTERNO: TARJETA DE ESTUDIANTE ───────────────────────────────

function TarjetaEstudiante({ est, onEdit, onDelete }: { est: Estudiante, onEdit: (e: any) => void, onDelete: (e: any) => void }) {
    const [estaExpandido, setEstaExpandido] = useState(false);

    return (
        <div
            className={`
                bg-[#fafafa] dark:bg-[#111] border rounded-[2rem] transition-all overflow-hidden
                ${estaExpandido ? 'border-[#d6a738] shadow-lg shadow-[#d6a738]/10' : 'border-[#e5e5e5] dark:border-[#2a2420] hover:border-[#d5cec2] dark:hover:border-[#3e3630]'}
            `}
        >
            <button
                onClick={() => setEstaExpandido(!estaExpandido)}
                className="w-full px-3 py-5 flex items-center justify-between gap-4 text-left group"
            >
                <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className={`
                        w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0
                        ${est.genero === 'masculino'
                            ? 'bg-blue-500/5 border-blue-500/20 text-blue-500 dark:text-blue-400'
                            : est.genero === 'femenino'
                                ? 'bg-pink-500/5 border-pink-500/20 text-pink-500 dark:text-pink-400'
                                : 'bg-[#d6a738]/5 border-[#d6a738]/20 text-[#d6a738]'
                        }
                    `}>
                        <span className="text-xl font-black uppercase">
                            {est.nombre.charAt(0)}
                        </span>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-1 md:gap-8">
                        <h3 className="text-base font-black text-[#4a3f36] dark:text-[#f4ebc3] uppercase tracking-tight truncate leading-tight">
                            {est.nombre}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 md:gap-6">
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#847563] uppercase tracking-widest whitespace-nowrap">
                                <Baby size={12} className="text-[#d6a738]/50" />
                                {calcularEdad(est.fecha_nacimiento)}
                            </span>
                            {est.telefono && (
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#847563] uppercase tracking-widest whitespace-nowrap">
                                    <Phone size={12} className="text-[#d6a738]/50" />
                                    {est.telefono}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </button>

            {estaExpandido && (
                <div className="px-3 pb-5 pt-2 border-t border-[#e5e5e5] dark:border-[#2a2420] grid grid-cols-2 gap-3 animate-in slide-in-from-top-1 duration-200">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(est); }}
                        className="flex items-center justify-center gap-2 py-3.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#4a3f36] dark:text-[#f4ebc3] transition-all active:scale-95"
                    >
                        <Edit3 size={16} className="text-[#d6a738]" /> Editar
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(est); }}
                        className="flex items-center justify-center gap-2 py-3.5 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-400 transition-all active:scale-95"
                    >
                        <Trash2 size={16} /> Eliminar
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────

export default function DirectorioGeneral({ perfilActual }: Props) {
    const [busqueda, setBusqueda] = useState('');
    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = useState(5);
    const [ordenNombre, setOrdenNombre] = useState<'asc' | 'desc'>('asc');
    const [modalConfig, setModalConfig] = useState<{ open: boolean, data: Estudiante | null, readOnly: boolean }>({
        open: false,
        data: null,
        readOnly: false
    });

    const { data: estudiantes = [], isLoading } = useQuery({
        queryKey: ['estudiantes-general', busqueda],
        queryFn: () => buscarEstudiantesGenerales(busqueda),
        staleTime: 1000 * 60,
    });

    const { eliminar } = useEstudianteGeneralMutations();

    const estudiantesOrdenados = useMemo(() => {
        return [...estudiantes].sort((a, b) => {
            const res = a.nombre.localeCompare(b.nombre);
            return ordenNombre === 'asc' ? res : -res;
        });
    }, [estudiantes, ordenNombre]);

    // LÓGICA DE PAGINACIÓN
    const totalPaginas = Math.ceil(estudiantesOrdenados.length / porPagina) || 1;
    const paginados = useMemo(() => {
        const inicio = (pagina - 1) * porPagina;
        return estudiantesOrdenados.slice(inicio, inicio + porPagina);
    }, [estudiantesOrdenados, pagina, porPagina]);

    // Resetear página al buscar o cambiar tamaño
    useMemo(() => {
        setPagina(1);
    }, [busqueda, porPagina, ordenNombre]);

    const handleEdit = (est: Estudiante) => setModalConfig({ open: true, data: est, readOnly: false });
    
    const handleDelete = async (est: Estudiante) => {
        const res = await Swal.fire({
            title: '¿Eliminar estudiante?',
            text: `Se borrará permanentemente a "${est.nombre}" de la base de datos. Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'No, cancelar',
            background: document.documentElement.classList.contains('dark') ? '#1a1a1a' : '#fff',
            color: document.documentElement.classList.contains('dark') ? '#fff' : '#4a3f36'
        });

        if (res.isConfirmed) {
            try {
                await eliminar.mutateAsync(est.id);
                Swal.fire({
                    icon: 'success',
                    title: 'Estudiante eliminado',
                    toast: true,
                    position: 'top',
                    showConfirmButton: false,
                    timer: 3000
                });
            } catch (err: any) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al eliminar',
                    text: err.message
                });
            }
        }
    };

    const handleCreate = () => setModalConfig({ open: true, data: null, readOnly: false });

    return (
        <div className="space-y-6 animate-in fade-in duration-500 px-1 md:px-0">
            {/* BARRA DE ACCIONES Y PAGINACIÓN */}
            <div className="flex flex-col gap-4 py-2">
                {/* 1. BUSCADOR */}
                <div className="w-full relative group">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#847563] group-focus-within:text-[#d6a738] transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-[#f5f5f5] dark:bg-[#111] border border-[#e5e5e5] dark:border-[#2a2420] rounded-2xl outline-none focus:border-[#d6a738]/50 transition-colors text-sm font-bold text-[#4a3f36] dark:text-[#f4ebc3] placeholder:text-[#847563]/50"
                    />
                </div>

                {/* 2. BOTÓN DE CREAR (Fila dedicada) */}
                <button
                    onClick={handleCreate}
                    className="w-full bg-[#d6a738] hover:bg-[#c08e2a] text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg shadow-[#d6a738]/10 active:scale-95 transition-all"
                >
                    <Plus size={18} /> Registrar Nuevo Alumno
                </button>
                
                {/* 3. CONTROLES UNIFICADOS (Una sola linea) */}
                <div className="flex items-center justify-center gap-2 w-full overflow-x-auto no-scrollbar py-1">
                    {/* Items por página */}
                    <div className="flex items-center gap-2 bg-[#f5f5f5] dark:bg-[#111] border border-[#e5e5e5] dark:border-[#2a2420] px-3 py-2 rounded-xl shrink-0">
                        <select 
                            value={porPagina}
                            onChange={(e) => setPorPagina(Number(e.target.value))}
                            className="bg-transparent text-[#4a3f36] dark:text-[#f4ebc3] text-[10px] font-black outline-none"
                        >
                            {[5, 10, 20, 50].map(n => <option key={n} value={n} className="bg-white dark:bg-[#111]">{n}</option>)}
                        </select>
                    </div>

                    {/* Ordenamiento - Imagen 2 */}
                    <div className="relative group shrink-0">
                        <select
                            value={ordenNombre}
                            onChange={(e) => setOrdenNombre(e.target.value as 'asc' | 'desc')}
                            className="bg-[#f5f5f5] dark:bg-[#111] border border-[#e5e5e5] dark:border-[#2a2420] text-[#4a3f36] dark:text-[#f4ebc3] text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer hover:border-[#d6a738]/50 transition-colors appearance-none px-4 py-2.5 rounded-xl pr-8"
                        >
                            <option value="asc" className="bg-white dark:bg-[#0a0a0a]">Nombre (A-Z)</option>
                            <option value="desc" className="bg-white dark:bg-[#0a0a0a]">Nombre (Z-A)</option>
                        </select>
                        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#d6a738] pointer-events-none" />
                    </div>

                    {/* Navegación y Página */}
                    <div className="flex items-center gap-0.5 bg-[#f5f5f5] dark:bg-[#111] border border-[#e5e5e5] dark:border-[#2a2420] p-1 rounded-xl shrink-0">
                        <button 
                            onClick={() => setPagina(p => Math.max(1, p - 1))}
                            disabled={pagina === 1}
                            className="p-2 text-[#847563] hover:text-[#d6a738] disabled:opacity-20"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        
                        <div className="px-2 py-1 flex items-center">
                            <span className="text-[10px] font-black tracking-widest text-[#4a3f36] dark:text-[#f4ebc3]">
                                <span className="text-[#d6a738]">{pagina}</span><span className="opacity-20 mx-1">/</span>{totalPaginas}
                            </span>
                        </div>

                        <button 
                            onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                            disabled={pagina === totalPaginas}
                            className="p-2 text-[#847563] hover:text-[#d6a738] disabled:opacity-20"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* LISTADO ACORDEÓN */}
            <div className="space-y-3">
                {isLoading ? (
                    [...Array(6)].map((_, i) => (
                        <div key={i} className="h-20 bg-[#f5f5f5] dark:bg-[#111] border border-[#e5e5e5] dark:border-[#2a2420] rounded-[2rem] animate-pulse" />
                    ))
                ) : paginados.length > 0 ? (
                    <>
                        <p className="text-[10px] font-black text-[#847563] uppercase tracking-[0.2em] text-center mb-4 opacity-60">
                            Presiona una Tarjeta para ver opciones
                        </p>
                        {paginados.map((est) => (
                            <TarjetaEstudiante
                                key={est.id}
                                est={est}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </>
                ) : (
                    <div className="py-20 text-center bg-white dark:bg-[#0a0a0a] border border-dashed border-[#d5cec2] dark:border-[#3e3630] rounded-[3rem] opacity-60">
                        <Users size={48} className="mx-auto mb-4 text-[#847563]" />
                        <h3 className="text-base font-black uppercase tracking-widest text-[#4a3f36] dark:text-[#f4ebc3]">No hay alumnos registrados</h3>
                        <p className="text-xs font-bold text-[#847563] mt-2">Registra tu primer alumno para que aparezca aquí.</p>
                    </div>
                )}
            </div>

            {/* MODALES */}
            {modalConfig.open && (
                <ModalEstudiante
                    isOpen={modalConfig.open}
                    onClose={() => setModalConfig({ ...modalConfig, open: false })}
                    estudiante={modalConfig.data}
                    readOnly={modalConfig.readOnly}
                    perfilActual={perfilActual}
                />
            )}
        </div>
    );
}
