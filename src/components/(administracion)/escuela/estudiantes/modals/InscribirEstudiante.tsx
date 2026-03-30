'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Save, UserPlus, Loader2, User, Phone, Calendar, Users, Search, Info } from 'lucide-react';
import { estudianteFormSchema, EstudianteForm, Estudiante } from '../../lib/zod';
import { useEstudianteMutations, useBuscarEstudiantes, useGestorEstudiantes } from '../../lib/hooks';
import Swal from 'sweetalert2';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    aulaId: string;
}

const GENEROS = [
    { value: 'masculino', label: 'Masculino' },
    { value: 'femenino', label: 'Femenino' },
] as const;

export default function InscribirEstudiante({ isOpen, onClose, aulaId }: Props) {
    const [busquedaGeneral, setBusquedaGeneral] = useState('');
    const [inputFocus, setInputFocus] = useState(false);

    // Obtener alumnos actuales para excluirlos de la búsqueda
    const { data: inscritos = [] } = useGestorEstudiantes(aulaId);

    // Lista de IDs a excluir (los que ya están en esta aula)
    const excluirIds = useMemo(() => {
        return (inscritos as any[]).map((i) => i.estudiante_id).filter(Boolean);
    }, [inscritos]);

    const {
        data: resultadosBusqueda = [],
        isFetching: buscando
    } = useBuscarEstudiantes(busquedaGeneral, excluirIds);

    const { inscribir, vincular } = useEstudianteMutations(aulaId);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm<EstudianteForm>({
        resolver: zodResolver(estudianteFormSchema),
        defaultValues: {
            nombre: '',
            genero: undefined,
            fecha_nacimiento: null,
            telefono: null,
        },
    });

    const generoSeleccionado = watch('genero');

    const onSubmit = async (data: EstudianteForm) => {
        try {
            await inscribir.mutateAsync(data);
            Swal.fire({
                icon: 'success',
                title: '¡Alumno creado!',
                text: `${data.nombre} ha sido agregado al sistema y al aula.`,
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 5000,
                timerProgressBar: true,
                showClass: { popup: 'animate__animated animate__slideInDown' },
                hideClass: { popup: 'animate__animated animate__fadeOutUp' }
            });
            handleClose();
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
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

    const handleVincularExistente = async (estudiante: Estudiante) => {
        try {
            await vincular.mutateAsync(estudiante.id);
            Swal.fire({
                icon: 'success',
                title: 'Alumno asignado',
                text: `${estudiante.nombre} ahora está en esta aula.`,
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 5000,
                timerProgressBar: true,
                showClass: { popup: 'animate__animated animate__slideInDown' },
                hideClass: { popup: 'animate__animated animate__fadeOutUp' }
            });
            handleClose();
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
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

    const handleClose = () => {
        reset();
        setBusquedaGeneral('');
        setInputFocus(false);
        onClose();
    };

    if (!isOpen) return null;

    // Mostrar resultados si hay búsqueda activa O si el input tiene el foco (sugerencias recientes)
    const showResults = busquedaGeneral.length > 0 || inputFocus;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-[0.5%] sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#0f0f0f] w-[99%] sm:w-full sm:max-w-[550px] rounded-[2rem] sm:rounded-3xl shadow-2xl flex flex-col max-h-[98vh] sm:max-h-[95vh] overflow-hidden border border-[#d5cec2] dark:border-[#3e3630] animate-in zoom-in-95 duration-200 shadow-gold/5">

                {/* HEADER */}
                <div className="px-3 sm:px-8 py-5 border-b border-[#e5ddd3] dark:border-[#3e3630] flex justify-between items-center bg-white dark:bg-[#0f0f0f] z-10">
                    <h2 className="text-base font-black text-[#4a3f36] dark:text-[#f4ebc3] uppercase tracking-tight flex items-center gap-3">
                        <UserPlus className="text-[#d6a738]" size={20} />
                        Inscribir Alumno
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-[#847563] hover:text-[#4a3f36] dark:hover:text-[#f4ebc3]"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* BUSCADOR GENERAL */}
                <div className="p-2 sm:p-6 border-b border-[#e5ddd3] dark:border-[#3e3630] bg-white dark:bg-[#0f0f0f]">
                    <p className="text-[10px] font-black text-[#847563] uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Search size={12} />
                        Buscar en base de datos general
                    </p>
                    <div className="relative group">
                        <Search size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${buscando ? 'text-[#d6a738] animate-pulse' : 'text-[#847563]'}`} />
                        <input
                            type="text"
                            placeholder="Nombre del alumno..."
                            value={busquedaGeneral}
                            onFocus={() => setInputFocus(true)}
                            onChange={(e) => setBusquedaGeneral(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#161616] border border-[#e5ddd3] dark:border-[#3e3630] rounded-2xl outline-none focus:border-[#d6a738]/50 transition-colors text-[#4a3f36] dark:text-white font-bold text-sm placeholder:text-[#847563]/40"
                        />
                    </div>

                    {/* SUGERENCIAS / RESULTADOS */}
                    {showResults && (
                        <div className="mt-4 space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[9px] font-black text-[#4a3f36] uppercase tracking-[0.2em]">
                                    {busquedaGeneral ? 'Resultados encontrados' : 'Sugerencias recientes'}
                                </span>
                            </div>

                            {resultadosBusqueda.length > 0 ? (
                                resultadosBusqueda.map((est) => (
                                    <div
                                        key={est.id}
                                        className="group bg-white dark:bg-[#161616] border border-[#e5ddd3] dark:border-neutral-800/50 hover:border-[#d6a738]/40 rounded-2xl p-2.5 sm:p-4 flex items-center justify-between transition-all shadow-sm"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-9 h-9 rounded-xl bg-[#d6a738]/10 flex items-center justify-center shrink-0 border border-[#d6a738]/10 group-hover:border-[#d6a738]/30 transition-colors">
                                                <User size={16} className="text-[#d6a738]" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-[#4a3f36] dark:text-[#f4ebc3] truncate uppercase tracking-tight">{est.nombre}</p>
                                                <div className="flex gap-3 items-center">
                                                    <p className={`text-[9px] font-black uppercase tracking-widest ${est.genero === 'femenino' ? 'text-pink-500' : 'text-[#847563]'}`}>{est.genero}</p>
                                                    {est.telefono && <p className="text-[9px] font-bold text-[#847563]/60">{est.telefono}</p>}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleVincularExistente(est)}
                                            disabled={vincular.isPending}
                                            className="px-4 py-2 bg-[#d6a738] hover:bg-[#c08e2a] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-[#d6a738]/10"
                                        >
                                            Asignar
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="py-6 text-center bg-[#fafafa]/50 dark:bg-[#111]/30 rounded-2xl border border-dashed border-[#d5cec2] dark:border-[#3e3630]">
                                    <Info size={24} className="mx-auto mb-2 text-[#d5cec2]" />
                                    <p className="text-[10px] font-black text-[#847563] uppercase tracking-widest">Sin alumnos disponibles</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* FORMULARIO DE "NUEVO" */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-5 custom-scrollbar bg-white dark:bg-[#0a0a0b]/50">
                    <div className="flex items-center gap-3 opacity-30">
                        <div className="flex-1 h-px bg-[#e5ddd3] dark:bg-[#3e3630]"></div>
                        <p className="text-[9px] font-black text-[#847563] uppercase tracking-[0.2em] whitespace-nowrap">Registro de alumno nuevo</p>
                        <div className="flex-1 h-px bg-[#e5ddd3] dark:bg-[#3e3630]"></div>
                    </div>

                    <form
                        id="inscribir-form"
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-5"
                    >
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-[#847563] uppercase tracking-widest flex items-center gap-2 ml-1">
                                <User size={10} /> Nombre Completo
                            </label>
                            <input
                                {...register('nombre')}
                                placeholder="Escribe el nombre aquí..."
                                className={`w-full px-5 py-3.5 bg-white dark:bg-[#161616] border ${errors.nombre ? 'border-red-500' : 'border-[#e5ddd3] dark:border-[#2a2420]'} rounded-2xl outline-none focus:border-[#d6a738]/50 transition-colors text-[#4a3f36] dark:text-white font-bold text-sm placeholder:text-[#847563]/40`}
                            />
                            {errors.nombre && <p className="text-xs text-red-500 font-black ml-2 mt-1 uppercase text-[10px] tracking-tight">{errors.nombre.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-[#847563] uppercase tracking-widest flex items-center gap-2 ml-1">
                                <Users size={10} /> Género
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {GENEROS.map((g) => {
                                    const isSelected = generoSeleccionado === g.value;
                                    const isFemenino = g.value === 'femenino';
                                    return (
                                        <button
                                            key={g.value}
                                            type="button"
                                            onClick={() => setValue('genero', g.value, { shouldValidate: true })}
                                            className={`
                                                py-3.5 px-4 rounded-2xl border text-xs font-black uppercase tracking-[0.1em] transition-all active:scale-95
                                                ${isSelected
                                                    ? isFemenino
                                                        ? 'bg-pink-600 border-pink-600 text-white shadow-lg shadow-pink-600/20 ring-2 ring-pink-500/20'
                                                        : 'bg-[#d6a738] border-[#d6a738] text-white shadow-lg shadow-[#d6a738]/20 ring-2 ring-gold/20'
                                                    : 'bg-white dark:bg-[#161616] border-[#e5ddd3] dark:border-[#2a2420] text-[#847563] hover:border-[#d6a738]/40 hover:text-[#4a3f36] dark:hover:text-[#f4ebc3]'}
                                            `}
                                        >
                                            {g.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 space-y-1.5">
                                <label className="text-[10px] font-black text-[#847563] uppercase tracking-widest flex items-center gap-2 ml-1">
                                    <Calendar size={10} /> Fecha de Nacimiento
                                </label>
                                <input
                                    type="date"
                                    {...register('fecha_nacimiento')}
                                    className="w-full px-5 py-3.5 bg-white dark:bg-[#161616] border border-[#e5ddd3] dark:border-[#2a2420] rounded-2xl outline-none focus:border-[#d6a738]/50 transition-colors text-[#4a3f36] dark:text-white font-bold text-sm"
                                />
                            </div>
                            <div className="flex-1 space-y-1.5">
                                <label className="text-[10px] font-black text-[#847563] uppercase tracking-widest flex items-center gap-2 ml-1">
                                    <Phone size={10} /> Teléfono Opcional
                                </label>
                                <input
                                    {...register('telefono')}
                                    type="tel"
                                    placeholder="0000-0000"
                                    className="w-full px-5 py-3.5 bg-white dark:bg-[#161616] border border-[#e5ddd3] dark:border-[#2a2420] rounded-2xl outline-none focus:border-[#d6a738]/50 transition-colors text-[#4a3f36] dark:text-white font-bold text-sm placeholder:text-[#847563]/40"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                {/* FOOTER */}
                <div className="px-3 sm:px-8 py-5 border-t border-[#e5ddd3] dark:border-[#3e3630] flex justify-center bg-white dark:bg-[#0f0f0f]">
                    <button
                        type="submit"
                        form="inscribir-form"
                        disabled={inscribir.isPending}
                        className="flex items-center justify-center gap-2 px-8 py-3 bg-[#d6a738] hover:bg-[#c08e2a] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#d6a738]/20 disabled:opacity-70 transition-all active:scale-95"
                    >
                        {inscribir.isPending ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                        Guardar Alumno
                    </button>
                </div>
            </div>
        </div>
    );
}
