'use client';

import { useState } from 'react';
import { 
    Users, BookOpen, Clock, CalendarDays, GraduationCap, 
    ClipboardList, CalendarCheck, Settings, Plus, Star, Search, ChevronLeft
} from 'lucide-react';
import GestorEstudiantes from './GestorEstudiantes';

interface Props {
    aula: any; // Usaremos any por ahora hasta tipar todo el join
    onBack: () => void;
}

type TabType = 'resumen' | 'estudiantes' | 'actividades' | 'asistencia' | 'configuracion';

export default function InteriorAula({ aula, onBack }: Props) {
    const [activeTab, setActiveTab] = useState<TabType>('resumen');

    const tabs = [
        { id: 'resumen', label: 'Resumen', icon: BookOpen },
        { id: 'estudiantes', label: 'Estudiantes', icon: Users },
        // { id: 'actividades', label: 'Actividades', icon: ClipboardList },
        { id: 'asistencia', label: 'Asistencia', icon: CalendarCheck },
        { id: 'configuracion', label: 'Configuración', icon: Settings },
    ];

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300 min-h-[70vh]">
            
            {/* CABECERA (Reemplaza a la página anterior) */}
            <div className="space-y-8">
                <button 
                    onClick={onBack}
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest group"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Regresar al listado
                </button>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-neutral-800 pb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 bg-blue-600/10 text-blue-500 text-[10px] font-black uppercase tracking-widest border border-blue-500/20 rounded-full">
                                Aula Activa
                            </span>
                        </div>
                        <h1 className="text-base font-black uppercase tracking-tighter leading-none mb-4 text-white">
                            {aula.nombre}
                        </h1>
                        <p className="text-gray-500 text-base max-w-2xl font-medium text-justify">
                            {aula.descripcion || 'Sin descripción adicional para esta aula.'}
                        </p>
                    </div>

                    <div className="flex w-full md:w-auto mt-4 md:mt-0">
                        <div className="bg-[#111] border border-neutral-800 p-5 md:p-6 rounded-2xl flex items-center gap-4 w-full md:min-w-[200px]">
                            <div className="p-3 bg-neutral-900 rounded-xl text-blue-500">
                                <Users size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Estudiantes</p>
                                <p className="text-base font-black text-white">0</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* NAVEGACIÓN DE PESTAÑAS */}
            <div className="flex justify-start md:justify-center gap-2 p-1 bg-[#111] border border-neutral-800 rounded-2xl overflow-x-auto custom-scrollbar snap-x">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`
                                flex-shrink-0 flex items-center gap-2 px-5 md:px-6 py-3 md:py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap snap-center
                                ${isActive 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                    : 'text-gray-500 hover:text-white hover:bg-white/5'
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
                        {/* PANEL DE HORARIO */}
                        <div className="col-span-1 md:col-span-3 bg-[#0a0a0a] border border-neutral-900 rounded-3xl p-6 hover:border-neutral-800 transition-colors">
                            <h2 className="text-base font-black uppercase tracking-tight flex items-center gap-3 mb-5 text-white">
                                <Clock size={20} className="text-blue-500" />
                                Información Académica
                            </h2>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Horario de Clases</p>
                                    <p className="text-base font-bold italic text-white">
                                        {aula.horario ? `${aula.horario.entrada} - ${aula.horario.salida}` : 'No Definido'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Plan de Estudios</p>
                                    <p className="text-base font-bold italic uppercase text-white">{aula.horario?.nombre || 'General'}</p>
                                </div>
                            </div>
                        </div>

                        {/* PANEL DE DOCENTE */}
                        <div className="bg-blue-600 rounded-3xl p-6 text-white relative overflow-hidden group">
                            <div className="relative z-10">
                                <GraduationCap size={42} className="mb-4 opacity-40 group-hover:scale-110 transition-transform duration-500" />
                                <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-1">Catedrático Asignado</p>
                                <h3 className="text-base font-black leading-tight truncate">
                                    {(aula.perfil_catedratico?.nombre && aula.perfil_catedratico.nombre !== 'Desconocido') ? aula.perfil_catedratico.nombre : 'Sin Docente'}
                                </h3>
                            </div>
                            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
                        </div>
                    </div>
                )}

                {/* 2. ESTUDIANTES */}
                {activeTab === 'estudiantes' && (
                    <GestorEstudiantes aulaId={aula.id} />
                )}

                {/* 3. ACTIVIDADES (Comentado temporalmente) */}
                {/* {activeTab === 'actividades' && (
                    <div className="bg-[#0a0a0a] border border-neutral-900 rounded-[2.5rem] overflow-hidden">
                        <div className="p-8 border-b border-neutral-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                                    <ClipboardList className="text-blue-500" />
                                    Actividades y Tareas
                                </h2>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Crea asignaciones, proyectos y exámenes</p>
                            </div>
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2">
                                <Plus size={16} /> Nueva Actividad
                            </button>
                        </div>
                        <div className="p-16 flex flex-col items-center justify-center text-center opacity-40">
                            <ClipboardList size={48} className="mb-4 text-gray-600" />
                            <h3 className="text-lg font-black uppercase tracking-widest text-white mb-1">Cero actividades</h3>
                            <p className="text-xs font-bold text-gray-500">Haz clic en 'Nueva Actividad' para empezar.</p>
                        </div>
                    </div>
                )} */}

                {/* 4. ASISTENCIA */}
                {activeTab === 'asistencia' && (
                    <div className="bg-[#0a0a0a] border border-neutral-900 rounded-[2.5rem] overflow-hidden">
                        <div className="p-6 md:p-8 border-b border-neutral-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-base font-black uppercase tracking-tight text-white flex items-center gap-3">
                                    <CalendarCheck className="text-blue-500" />
                                    Control de Asistencia
                                </h2>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Registra la asistencia diaria de los alumnos</p>
                            </div>
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                                Tomar Asistencia Hoy
                            </button>
                        </div>
                        <div className="p-16 flex flex-col items-center justify-center text-center opacity-40">
                            <CalendarCheck size={48} className="mb-4 text-gray-600" />
                            <h3 className="text-base font-black uppercase tracking-widest text-white mb-1">Sin registros</h3>
                            <p className="text-xs font-bold text-gray-500">Agrega estudiantes primero para pasar asistencia.</p>
                        </div>
                    </div>
                )}

                {/* 5. CONFIGURACIÓN */}
                {activeTab === 'configuracion' && (
                    <div className="bg-[#0a0a0a] border border-neutral-900 rounded-[2.5rem] p-8">
                        <h2 className="text-base font-black uppercase tracking-tight text-white flex items-center gap-3 mb-8">
                            <Settings className="text-blue-500" />
                            Ajustes del Aula
                        </h2>
                        
                        <div className="max-w-xl space-y-4 md:space-y-6">
                            <div className="bg-[#111] p-5 md:p-6 rounded-2xl border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <h4 className="font-black text-white uppercase tracking-tight">Estado del Aula</h4>
                                    <p className="text-xs text-gray-500 font-bold">Activar o desactivar vistas externas</p>
                                </div>
                                <div className="px-4 py-2 bg-green-500/10 text-green-500 rounded-xl font-black text-xs uppercase tracking-widest">
                                    Activa
                                </div>
                            </div>

                            <div className="bg-red-500/5 p-6 rounded-2xl border border-red-500/10">
                                <h4 className="font-black text-red-500 uppercase tracking-tight mb-2 flex items-center gap-2">
                                    Zona de Peligro
                                </h4>
                                <p className="text-xs text-gray-500 font-bold mb-4">Una vez eliminada el aula, se perderán todas las actividades, asistencia y registros permanentemente.</p>
                                <button className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors w-full sm:w-auto">
                                    Eliminar Aula Definitivamente
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
