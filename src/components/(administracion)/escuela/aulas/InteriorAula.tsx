'use client';

import { useState } from 'react';
import {
    Users, BookOpen, Clock, CalendarDays, GraduationCap,
    ClipboardList, CalendarCheck, Settings, Plus, Star, Search, ChevronLeft
} from 'lucide-react';
import GestorEstudiantes from '../estudiantes/GestorEstudiantes';
import GestorAsistencia from '../asistencias/GestorAsistencia';
import { useGestorEstudiantes, useEscuelaMutations } from '../lib/hooks';
import { AulaForm } from '../lib/zod';
import Swal from 'sweetalert2';
import { Loader2 } from 'lucide-react';

interface Props {
    aula: any; // Usaremos any por ahora hasta tipar todo el join
    onBack: () => void;
    perfilActual: any;
}

type TabType = 'resumen' | 'estudiantes' | 'actividades' | 'asistencia' | 'configuracion';

export default function InteriorAula({ aula, onBack, perfilActual }: Props) {
    const [activeTab, setActiveTab] = useState<TabType>('resumen');
    const { guardar, eliminar } = useEscuelaMutations();

    const handleToggleStatus = async () => {
        try {
            const nuevoEstado = !aula.status;
            const data: AulaForm = {
                nombre: aula.nombre,
                descripcion: aula.descripcion,
                catedratico_id: aula.catedratico_id,
                horario_id: aula.horario_id,
                status: nuevoEstado
            };
            await guardar.mutateAsync({ data, id: aula.id });
            Swal.fire({
                icon: 'success',
                title: nuevoEstado ? 'Aula activada' : 'Aula desactivada',
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

    const handleEliminarAula = async () => {
        const res = await Swal.fire({
            title: '¿Eliminar aula definitivamente?',
            text: 'Esta acción no se puede deshacer y borrará toda la información relacionada.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });
        if (res.isConfirmed) {
            try {
                await eliminar.mutateAsync(aula.id);
                onBack();
            } catch (err: any) {
                Swal.fire({ icon: 'error', title: 'Error', text: err.message });
            }
        }
    };

    const tabs = [
        { id: 'resumen', label: 'Resumen', icon: BookOpen },
        { id: 'estudiantes', label: 'Estudiantes', icon: Users },
        // { id: 'actividades', label: 'Actividades', icon: ClipboardList },
        { id: 'asistencia', label: 'Asistencia', icon: CalendarCheck },
        { id: 'configuracion', label: 'Configuración', icon: Settings },
    ].filter(tab => {
        if (tab.id === 'configuracion') {
            const rol = perfilActual?.rol?.toUpperCase();
            return rol === 'SUPER' || rol === 'ADMIN';
        }
        return true;
    });

    return (
        <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300 min-h-[70vh]">

            {/* CABECERA (Reemplaza a la página anterior) */}
            <div className="space-y-2 pt-4 md:pt-6">
                <button
                    onClick={onBack}
                    className="inline-flex items-center gap-2 text-[#847563] hover:text-[#4a3f36] dark:hover:text-[#f4ebc3] transition-colors text-xs font-black uppercase tracking-widest group"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Regresar al listado
                </button>

                <div className="border-b border-[#d5cec2] dark:border-[#3e3630] pb-4">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                        <h1 className="text-base md:text-xl font-black uppercase tracking-tighter leading-none text-[#4a3f36] dark:text-[#f4ebc3]">
                            {aula.nombre}
                        </h1>
                        <TotalEstudiantesBadge aulaId={aula.id} />
                    </div>
                    <p className="text-[#847563] text-sm font-medium text-justify leading-relaxed">
                        {aula.descripcion || 'Sin descripción adicional para esta aula.'}
                    </p>
                </div>
            </div>

            {/* NAVEGACIÓN DE PESTAÑAS (SIN BORDE - SLIM) */}
            <div className="grid grid-cols-2 md:flex md:flex-nowrap gap-x-1 gap-y-1 p-1 bg-transparent rounded-2xl mb-2 mt-1 px-[5px] md:px-0 w-full md:w-fit mx-auto">
                {tabs.map((tab, index) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const esUltimoYImpar = tabs.length % 2 !== 0 && index === tabs.length - 1;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`
                                flex-shrink-0 flex items-center justify-center gap-2 px-1 md:px-4 py-1.5 md:py-2 rounded-xl font-black text-[12px] md:text-xs uppercase tracking-widest transition-all whitespace-nowrap snap-center
                                ${esUltimoYImpar ? 'col-span-2 w-1/2 mx-auto' : ''}
                                ${isActive
                                    ? 'text-[#d6a738] drop-shadow-[0_0_8px_rgba(214,167,56,0.3)]'
                                    : 'text-[#847563] hover:text-[#4a3f36] dark:hover:text-[#f4ebc3]'
                                }
                            `}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* CONTENIDO DE LAS PESTAÑAS */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* 1. RESUMEN */}
                {activeTab === 'resumen' && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* PANEL DE INFORMACIÓN EN UNA SOLA LÍNEA (SLIM) */}
                        <div className="col-span-1 md:col-span-3 bg-white dark:bg-[#0a0a0a] border border-[#d5cec2] dark:border-[#3e3630] rounded-3xl px-4 py-2.5 hover:border-[#d6a738]/30 transition-colors flex items-center gap-6 overflow-hidden shadow-sm">
                            <h2 className="text-[11px] font-black uppercase tracking-tighter flex items-center gap-2 text-[#4a3f36] dark:text-[#f4ebc3] shrink-0 border-r border-[#d5cec2] dark:border-[#3e3630] pr-6">
                                <Clock size={16} className="text-[#d6a738]" />
                                Información Académica
                            </h2>

                            <div className="flex flex-wrap items-center gap-x-8 gap-y-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-[9px] font-black text-[#847563] uppercase tracking-widest">Horario:</p>
                                    <h3 className="text-[11px] font-black leading-none truncate tracking-tight text-[#4a3f36] dark:text-[#f4ebc3]">
                                        {(aula.horario?.entrada || '00:00').slice(0, 5)} - {(aula.horario?.salida || '00:00').slice(0, 5)}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="text-[9px] font-black text-[#847563] uppercase tracking-widest">Plan:</p>
                                    <p className="text-[11px] font-black italic uppercase text-[#4a3f36] dark:text-white leading-none tracking-tight">{aula.horario?.nombre || 'General'}</p>
                                </div>
                            </div>
                        </div>

                        {/* PANEL DE DOCENTE LINEAL COMPACTO (SLIM) */}
                        <div className="bg-[#d6a738] rounded-3xl px-4 py-2.5 text-white relative overflow-hidden group shadow-lg shadow-[#d6a738]/10 flex items-center h-full">
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="p-2 bg-white/20 rounded-xl">
                                    <GraduationCap size={16} className="opacity-100" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="text-[9px] font-black text-white/70 uppercase tracking-widest leading-none">Catedrático:</p>
                                    <h3 className="text-[13px] font-black leading-none truncate tracking-tight">
                                        {(aula.perfil_catedratico?.nombre && aula.perfil_catedratico.nombre !== 'Desconocido') ? aula.perfil_catedratico.nombre : 'Sin Docente'}
                                    </h3>
                                </div>
                            </div>
                            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
                        </div>
                    </div>
                )}

                {/* 2. ESTUDIANTES */}
                {activeTab === 'estudiantes' && (
                    <GestorEstudiantes aulaId={aula.id} perfilActual={perfilActual} />
                )}

                {/* 4. ASISTENCIA */}
                {activeTab === 'asistencia' && (
                    <GestorAsistencia aulaId={aula.id} />
                )}

                {/* 5. CONFIGURACIÓN */}
                {activeTab === 'configuracion' && (
                    <div className="bg-white dark:bg-[#0a0a0a] border border-[#d5cec2] dark:border-neutral-900 rounded-[2.5rem] p-8 shadow-sm">
                        <h2 className="text-base font-black uppercase tracking-tight text-[#4a3f36] dark:text-white flex items-center gap-3 mb-8">
                            <Settings size={20} className="text-[#d6a738]" />
                            Ajustes del Aula
                        </h2>

                        <div className="max-w-xl space-y-4 md:space-y-6">
                            <div className="bg-[#fafafa] dark:bg-[#111] p-5 md:p-6 rounded-2xl border border-[#e5e5e5] dark:border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <h4 className="font-black text-[#4a3f36] dark:text-white uppercase tracking-tight">Estado del Aula</h4>
                                    <p className="text-xs text-gray-500 font-bold">Activar o desactivar vistas externas</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${aula.status ? 'text-green-500' : 'text-red-500'}`}>
                                        {aula.status ? 'Activa' : 'Inactiva'}
                                    </span>
                                    <button 
                                        onClick={handleToggleStatus}
                                        disabled={guardar.isPending}
                                        className={`
                                            relative inline-flex h-7 w-12 items-center rounded-full transition-all outline-none
                                            ${aula.status ? 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'bg-red-500/20 border border-red-500/50'}
                                            ${guardar.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-90'}
                                        `}
                                    >
                                        <span className={`
                                            ${aula.status ? 'translate-x-6 bg-white' : 'translate-x-1 bg-red-500'} 
                                            inline-block h-5 w-5 transform rounded-full shadow-lg transition-all duration-350 ease-in-out
                                            flex items-center justify-center
                                        `}>
                                            {guardar.isPending && <Loader2 size={10} className={`animate-spin ${aula.status ? 'text-green-500' : 'text-white'}`} />}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <div className="bg-red-500/5 p-6 rounded-2xl border border-red-500/10">
                                <h4 className="font-black text-red-500 uppercase tracking-tight mb-2 flex items-center gap-2">
                                    Zona de Peligro
                                </h4>
                                <p className="text-xs text-neutral-500 font-bold mb-4 leading-relaxed">Una vez eliminada el aula, se perderán todas las actividades, asistencia y registros permanentemente de forma irreversible.</p>
                                <button 
                                    onClick={handleEliminarAula}
                                    disabled={eliminar.isPending}
                                    className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 px-7 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all w-full sm:w-auto flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-red-500/5 disabled:opacity-40"
                                >
                                    {eliminar.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Eliminar Aula Definitivamente'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

/** 
 * Subcomponente para mostrar el total de estudiantes con datos reales 
 */
function TotalEstudiantesBadge({ aulaId }: { aulaId: string }) {
    const { data: inscritos = [] } = useGestorEstudiantes(aulaId);

    return (
        <div className="bg-white dark:bg-[#111] border border-[#d5cec2] dark:border-[#3e3630] py-1.5 px-1.5 rounded-2xl flex items-center gap-1.5 w-fit animate-in fade-in duration-300 shadow-sm">
            <div className="p-1.5 bg-[#fafafa] dark:bg-neutral-900 rounded-xl text-[#d6a738]">
                <Users size={14} />
            </div>
            <div className="flex items-center gap-1">
                <p className="text-[9px] font-black text-[#847563] uppercase tracking-widest leading-none">Estudiantes:</p>
                <p className="text-sm font-black text-[#d6a738] leading-none">{inscritos.length}</p>
            </div>
        </div>
    );
}
