'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Save, Sparkles, Loader2, User, BookOpen, Clock, AlignLeft, Search, PlusCircle, ChevronDown, Edit2, Trash2, CalendarDays, ChevronRight } from 'lucide-react';
import { aulaFormSchema, AulaForm, Perfil, Aula, Horario, DIAS_OPCIONES } from '../../lib/zod';
import { useEscuelaMutations } from '../../lib/hooks';
import SelectorHorario from './SelectorHorario';
import Swal from 'sweetalert2';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    usuarios: Perfil[];
    horarios: Horario[];
    aulaEditar?: Aula | null;
}

export default function NuevaAula({ isOpen, onClose, usuarios, horarios, aulaEditar }: Props) {
    const { guardar } = useEscuelaMutations();
    const isEditing = !!aulaEditar;

    // --- ESTADO PARA LOS BUSCADORES ---
    const [busqueda, setBusqueda] = useState('');
    const [isSelectUserOpen, setIsSelectUserOpen] = useState(false);
    const [isSelectorHorarioOpen, setIsSelectorHorarioOpen] = useState(false);

    // --- CONFIGURACIÓN DE FORMULARIO ---
    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<AulaForm>({
        resolver: zodResolver(aulaFormSchema),
        defaultValues: {
            nombre: '',
            descripcion: '',
            catedratico_id: '',
            horario_id: '',
            status: true
        }
    });

    // CARGAR DATOS SI ES EDICIÓN
    useEffect(() => {
        if (isOpen) {
            if (aulaEditar) {
                setValue('nombre', aulaEditar.nombre);
                setValue('descripcion', aulaEditar.descripcion || '');
                setValue('catedratico_id', aulaEditar.catedratico_id);
                setValue('horario_id', aulaEditar.horario_id);
                setValue('status', aulaEditar.status);
                setBusqueda(aulaEditar.perfil_catedratico?.nombre || '');
            } else {
                reset();
                setBusqueda('');
            }
        }
    }, [isOpen, aulaEditar, setValue, reset]);

    // FILTRAR USUARIOS PARA EL SELECT
    const usuariosFiltrados = usuarios.filter(u =>
        u.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    const selectHorarioId = watch('horario_id');
    const horarioSeleccionado = horarios.find(h => h.id === selectHorarioId);

    const getDiasResumen = (dias: number[]) => {
        return DIAS_OPCIONES.filter(d => dias.includes(d.id)).map(d => d.label).join(', ');
    };

    const onSubmit = async (data: AulaForm) => {
        try {
            await guardar.mutateAsync({ data, id: aulaEditar?.id });
            Swal.fire({
                icon: 'success',
                title: isEditing ? 'Aula actualizada' : 'Aula creada correctamente',
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 5000,
                timerProgressBar: true,
                showClass: { popup: 'animate__animated animate__slideInDown' },
                hideClass: { popup: 'animate__animated animate__fadeOutUp' }
            });
            onClose();
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error al ahorrar',
                text: error.message,
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

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-[5px] sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-[98%] sm:max-w-[600px] rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-gray-100 dark:border-neutral-800 animate-in zoom-in-95 duration-200">

                    {/* HEADER */}
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-[#1a1a1a]">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 font-black uppercase tracking-tight">
                            {isEditing ? <Save className="text-[#d6a738]" size={22} /> : <Sparkles className="text-[#d6a738]" size={22} />}
                            {isEditing ? 'Editar Aula' : 'Nueva Aula'}
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-400">
                            <X size={22} />
                        </button>
                    </div>

                    {/* CONTENIDO */}
                    <form id="aula-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-3 py-6 sm:p-8 space-y-6 custom-scrollbar">

                        {/* NOMBRE */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-600 dark:text-gray-400 flex items-center gap-2 uppercase tracking-widest text-[10px]">
                                Nombre del Aula
                            </label>
                            <input
                                {...register('nombre')}
                                placeholder="Ej: Piano Nivel 1"
                                className={`w-full px-5 py-4 bg-gray-50 dark:bg-neutral-800 border ${errors.nombre ? 'border-red-500' : 'border-gray-200 dark:border-neutral-700'} rounded-2xl outline-none focus:ring-2 focus:ring-[#d6a738]/20 transition-all dark:text-white font-bold leading-tight`}
                            />
                            {errors.nombre && <p className="text-xs text-red-500 font-bold ml-1">{errors.nombre.message}</p>}
                        </div>

                        {/* CATEDRÁTICO */}
                        <div className="space-y-1.5 relative">
                            <label className="text-sm font-bold text-gray-600 dark:text-gray-400 flex items-center gap-2 uppercase tracking-widest text-[10px]">
                                Catedrático Asignado
                            </label>
                            <div className="relative">
                                <input
                                    value={busqueda}
                                    onChange={(e) => {
                                        setBusqueda(e.target.value);
                                        setIsSelectUserOpen(true);
                                    }}
                                    onFocus={() => setIsSelectUserOpen(true)}
                                    placeholder="Buscar docente..."
                                    className={`w-full pl-12 pr-5 py-4 bg-gray-50 dark:bg-neutral-800 border ${errors.catedratico_id ? 'border-red-500' : 'border-gray-200 dark:border-neutral-700'} rounded-2xl outline-none focus:ring-2 focus:ring-[#d6a738]/20 transition-all dark:text-white font-bold leading-tight`}
                                />
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                                {isSelectUserOpen && (
                                    <div className="absolute z-[60] top-full left-0 w-full mt-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl shadow-2xl max-h-[200px] overflow-y-auto custom-scrollbar">
                                        {usuariosFiltrados.length > 0 ? (
                                            usuariosFiltrados.map((u) => (
                                                <button key={u.id} type="button" onClick={() => { setValue('catedratico_id', u.id); setBusqueda(u.nombre); setIsSelectUserOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#d6a738]/10 text-left transition-colors border-b border-gray-50 dark:border-neutral-800 last:border-0">
                                                    <div className="h-8 w-8 rounded-lg bg-gray-200 dark:bg-neutral-800 flex items-center justify-center shrink-0 overflow-hidden">
                                                        {u.avatar_url ? <img src={u.avatar_url} className="h-full w-full object-cover" /> : <User size={14} />}
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{u.nombre}</span>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-sm text-gray-500 italic">No hay resultados</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {errors.catedratico_id && <p className="text-xs text-red-500 font-bold ml-1">{errors.catedratico_id.message}</p>}
                        </div>

                        {/* SECCIÓN DE HORARIO REELABORADA */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-600 dark:text-gray-400 flex items-center gap-2 uppercase tracking-widest text-[10px] px-1">
                                Configuración de Horario
                            </label>

                            <button
                                type="button"
                                onClick={() => setIsSelectorHorarioOpen(true)}
                                className={`
                                    w-full flex items-center gap-5 p-5 rounded-[2rem] border transition-all active:scale-[0.98] text-left group
                                    ${horarioSeleccionado
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/20'
                                        : 'bg-gray-50 dark:bg-neutral-800 border-gray-100 dark:border-neutral-700 hover:border-[#d6a738]/40 hover:bg-gray-100 dark:hover:bg-neutral-900'
                                    }
                                `}
                            >
                                <div className={`p-4 rounded-2xl ${horarioSeleccionado ? 'bg-white/20' : 'bg-white dark:bg-neutral-900 text-blue-500 shadow-sm border border-gray-100 dark:border-neutral-700'}`}>
                                    <Clock size={24} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className={`font-black text-sm uppercase tracking-tight ${horarioSeleccionado ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                        {horarioSeleccionado ? horarioSeleccionado.nombre : 'Seleccionar Horario'}
                                    </h4>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${horarioSeleccionado ? 'text-blue-100' : 'text-gray-400'}`}>
                                        {horarioSeleccionado
                                            ? `${getDiasResumen(horarioSeleccionado.dias)} (${horarioSeleccionado.entrada} - ${horarioSeleccionado.salida})`
                                            : 'Define los días y horas de clase'}
                                    </p>
                                </div>

                                <ChevronRight size={20} className={horarioSeleccionado ? 'text-white' : 'text-gray-300'} />
                            </button>
                            {errors.horario_id && <p className="text-xs text-red-500 font-bold ml-1">{errors.horario_id.message}</p>}
                        </div>

                        {/* DESCRIPCIÓN */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-600 dark:text-gray-400 flex items-center gap-2 uppercase tracking-widest text-[10px]">
                                Descripción o Notas
                            </label>
                            <textarea
                                {...register('descripcion')}
                                rows={3}
                                placeholder="Detalles adicionales del aula..."
                                className="w-full px-5 py-4 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-2xl outline-none focus:ring-2 focus:ring-[#d6a738]/20 transition-all dark:text-white font-bold resize-none"
                            />
                        </div>

                        {/* STATUS TOGGLE */}
                        <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700 shadow-sm">
                            <div className="flex flex-col">
                                <span className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-tight">Aula Habilitada</span>
                                <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Visible para estudiantes</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" {...register('status')} className="sr-only peer" />
                                <div className="w-12 h-6.5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5.5 after:w-5.5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500 peer-checked:dark:bg-green-500"></div>
                            </label>
                        </div>

                    </form>

                    {/* FOOTER CENTRADO */}
                    <div className="px-8 py-6 border-t border-gray-100 dark:border-neutral-800 bg-white dark:bg-[#1a1a1a] flex justify-center shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                        <button
                            type="submit"
                            form="aula-form"
                            disabled={guardar.isPending}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-16 py-4 bg-[#d6a738] hover:bg-[#c08e2a] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#d6a738]/30 disabled:opacity-70 transition-all transform active:scale-95"
                        >
                            {guardar.isPending ? <Loader2 className="animate-spin" size={18} /> : null}
                            {isEditing ? 'Guardar' : 'Crear'}
                        </button>
                    </div>
                </div>
            </div>

            {/* EL NUEVO SELECTOR INTELIGENTE */}
            <SelectorHorario
                isOpen={isSelectorHorarioOpen}
                onClose={() => setIsSelectorHorarioOpen(false)}
                horarios={horarios}
                selectedId={selectHorarioId}
                onSelect={(id) => setValue('horario_id', id)}
            />
        </>
    );
}
