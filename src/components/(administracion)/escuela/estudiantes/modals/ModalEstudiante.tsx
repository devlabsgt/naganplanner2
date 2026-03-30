'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Save, UserCircle, Loader2, Trash2, User, Users, Calendar, Phone } from 'lucide-react';
import { estudianteFormSchema, EstudianteForm, Estudiante } from '../../lib/zod';
import { useEstudianteGeneralMutations } from '../../lib/hooks';
import Swal from 'sweetalert2';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    estudiante?: Estudiante | null;
    readOnly?: boolean;
    perfilActual?: any; // Perfil del usuario actual para roles
}

const GENEROS = [
    { value: 'masculino', label: 'Masculino' },
    { value: 'femenino', label: 'Femenino' },
] as const;

export default function ModalEstudiante({ isOpen, onClose, estudiante, readOnly = false, perfilActual }: Props) {
    const isEdit = !!estudiante && !readOnly;
    const { guardar, eliminar } = useEstudianteGeneralMutations();

    // Verificación de rol: tu DB usa minúsculas ('super', 'admin')
    const rolActual = perfilActual?.rol?.toLowerCase();
    const tienePermisoEliminar = rolActual === 'super' || rolActual === 'admin';

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

    // Cargar datos
    useEffect(() => {
        if (estudiante) {
            reset({
                nombre: estudiante.nombre,
                genero: estudiante.genero as any,
                fecha_nacimiento: estudiante.fecha_nacimiento || null,
                telefono: estudiante.telefono || null,
            });
        } else {
            reset({ nombre: '', genero: undefined, fecha_nacimiento: null, telefono: null });
        }
    }, [estudiante, reset, isOpen]);

    const onSubmit = async (data: EstudianteForm) => {
        if (readOnly) return;
        try {
            await guardar.mutateAsync({ data, id: estudiante?.id });
            Swal.fire({
                icon: 'success',
                title: isEdit ? '¡Cambios guardados!' : '¡Alumno registrado!',
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

    const handleEliminar = async () => {
        if (!estudiante || readOnly || !tienePermisoEliminar) return;
        const res = await Swal.fire({
            title: '¿Eliminar de la base de datos?',
            text: `Esta acción borrará a "${estudiante.nombre}" permanentemente de todo el sistema.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar permanentemente',
            cancelButtonText: 'Cancelar',
        });
        if (res.isConfirmed) {
            try {
                await eliminar.mutateAsync(estudiante.id);
                onClose();
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
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-[0.5%] sm:p-6 bg-black/80 backdrop-blur-[2px] animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#0f0f0f] w-[99%] sm:w-full sm:max-w-[500px] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col border border-[#e5ddd3] dark:border-[#3e3630] animate-in zoom-in-95 duration-200 overflow-hidden text-[#4a3f36] dark:text-[#f4ebc3]">

                {/* HEADER */}
                <div className="px-2.5 py-5 border-b border-[#e5ddd3] dark:border-[#3e3630] flex justify-between items-center bg-white dark:bg-[#0d0d0d]">
                    <h2 className="text-sm font-black text-[#4a3f36] dark:text-[#f4ebc3] uppercase tracking-tight flex items-center gap-3">
                        <UserCircle className="text-[#d6a738]" size={20} />
                        {readOnly ? 'Expediente' : isEdit ? 'Modificar' : 'Nuevo Registro General'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-[#847563] hover:text-[#4a3f36] dark:hover:text-[#f4ebc3]">
                        <X size={20} />
                    </button>
                </div>

                <form id="estudiante-form" onSubmit={handleSubmit(onSubmit)} className="p-2.5 md:p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                    {/* Nombre */}
                    <div className="space-y-1.5 px-0.5">
                        <label className="text-[10px] font-black text-[#847563] uppercase tracking-widest flex items-center gap-2 ml-1">
                            <User size={10} /> Nombre Completo
                        </label>
                        <input
                            {...register('nombre')}
                            disabled={readOnly}
                            placeholder="Ej: Carlos Martínez..."
                            className={`w-full px-5 py-4 bg-white dark:bg-[#161616] border ${errors.nombre ? 'border-red-500' : 'border-[#e5ddd3] dark:border-[#2a2420]'} rounded-2xl outline-none focus:border-[#d6a738]/50 transition-colors text-[#4a3f36] dark:text-white font-bold text-sm disabled:opacity-60 placeholder:text-[#847563]/50`}
                        />
                    </div>

                    {/* Género */}
                    <div className="space-y-1.5 px-0.5">
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
                                        disabled={readOnly}
                                        onClick={() => setValue('genero', g.value, { shouldValidate: true })}
                                        className={`
                                            py-4 px-4 rounded-2xl border text-[10px] font-black uppercase tracking-[0.1em] transition-all
                                            ${isSelected
                                                ? isFemenino
                                                    ? 'bg-pink-600 border-pink-600 text-white shadow-lg shadow-pink-600/20'
                                                    : 'bg-[#d6a738] border-[#d6a738] text-white shadow-lg shadow-[#d6a738]/20'
                                                : 'bg-white dark:bg-[#161616] border-[#e5ddd3] dark:border-[#2a2420] text-[#847563]'}
                                            ${readOnly && !isSelected ? 'hidden' : ''} 
                                            ${readOnly ? 'w-full col-span-2 cursor-default border-dashed border-[#d6a738]/30 flex justify-start pl-8' : ''}
                                        `}
                                    >
                                        {g.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Otros datos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 px-0.5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-[#847563] uppercase tracking-widest flex items-center gap-2 ml-1">
                                <Calendar size={10} /> Fecha Nacimiento
                            </label>
                            <input
                                type="date"
                                {...register('fecha_nacimiento')}
                                disabled={readOnly}
                                className="w-full px-5 py-4 bg-white dark:bg-[#161616] border border-[#e5ddd3] dark:border-[#2a2420] rounded-2xl outline-none text-[#4a3f36] dark:text-white font-bold text-sm disabled:opacity-60"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-[#847563] uppercase tracking-widest flex items-center gap-2 ml-1">
                                <Phone size={10} /> Teléfono
                            </label>
                            <input
                                {...register('telefono')}
                                disabled={readOnly}
                                className="w-full px-5 py-4 bg-white dark:bg-[#161616] border border-[#e5ddd3] dark:border-[#2a2420] rounded-2xl outline-none text-[#4a3f36] dark:text-white font-bold text-sm disabled:opacity-60"
                            />
                        </div>
                    </div>
                </form>

                {/* FOOTER */}
                {!readOnly && (
                    <div className="px-2.5 py-6 border-t border-[#e5ddd3] dark:border-[#3e3630] flex flex-col items-center bg-white dark:bg-[#0d0d0d] gap-4">
                        <button
                            type="submit"
                            form="estudiante-form"
                            disabled={guardar.isPending}
                            className="w-full sm:w-auto px-12 py-4 bg-[#d6a738] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#d6a738]/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {guardar.isPending ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                            {isEdit ? 'Guardar Cambios' : 'Registrar Ahora'}
                        </button>

                        {isEdit && tienePermisoEliminar && (
                            <button
                                type="button"
                                onClick={handleEliminar}
                                disabled={eliminar.isPending}
                                className="text-[10px] font-black text-red-500/50 hover:text-red-500 uppercase tracking-[0.2em] transition-all py-2"
                            >
                                {eliminar.isPending ? 'Eliminando...' : 'Eliminar Registro Permanente'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
