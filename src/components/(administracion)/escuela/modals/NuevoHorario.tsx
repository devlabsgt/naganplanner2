'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Save, Clock, CalendarDays, Loader2 } from 'lucide-react';
import { horarioFormSchema, HorarioForm, DIAS_OPCIONES } from '../lib/zod';
import { useHorarioMutations } from '../lib/hooks';
import Swal from 'sweetalert2';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  idEdicion?: string;
  initialData?: HorarioForm;
}

export default function NuevoHorario({ isOpen, onClose, idEdicion, initialData }: Props) {
  const { guardar } = useHorarioMutations();
  const isEditing = !!idEdicion;

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<HorarioForm>({
    resolver: zodResolver(horarioFormSchema),
    defaultValues: initialData || {
      nombre: '',
      dias: [],
      entrada: '08:00',
      salida: '16:00',
    }
  });

  const selectedDays = watch('dias');

  useEffect(() => {
    if (isOpen) {
      if (initialData) reset(initialData);
      else reset({ nombre: '', dias: [], entrada: '08:00', salida: '16:00' });
    }
  }, [isOpen, initialData, reset]);

  const toggleDay = (dayId: number) => {
    const current = [...selectedDays];
    if (current.includes(dayId)) {
      setValue('dias', current.filter(id => id !== dayId));
    } else {
      setValue('dias', [...current, dayId].sort());
    }
  };

  const selectWorkWeek = () => setValue('dias', [1, 2, 3, 4, 5]);
  const selectFullWeek = () => setValue('dias', [1, 2, 3, 4, 5, 6, 7]);

  const onSubmit = async (data: HorarioForm) => {
    try {
      await guardar.mutateAsync({ data, id: idEdicion });
      Swal.fire({
        icon: 'success',
        title: isEditing ? 'Horario actualizado' : 'Horario creado',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      onClose();
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.message });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-[480px] rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-neutral-800 animate-in zoom-in-95 duration-300">

        {/* HEADER */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-[#1a1a1a]">
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="text-[#d6a738]" size={24} />
            {isEditing ? 'Editar Horario' : 'Crear Nuevo Horario'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-400">
            <X size={22} />
          </button>
        </div>

        {/* CONTENIDO */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-6">

          {/* NOMBRE DEL HORARIO */}
          <div className="space-y-2">
            <label className="text-sm font-black text-gray-700 dark:text-gray-300 flex items-center gap-2">
              Nombre del Horario
            </label>
            <input
              {...register('nombre')}
              placeholder="Ej: Normal, Medio Turno, Sabatino"
              className={`w-full px-5 py-3.5 bg-gray-50 dark:bg-neutral-800 border ${errors.nombre ? 'border-red-500' : 'border-gray-200 dark:border-neutral-700'} rounded-2xl outline-none focus:ring-4 focus:ring-[#d6a738]/10 transition-all dark:text-white font-bold tracking-tight`}
            />
            {errors.nombre && <p className="text-xs text-red-500 font-bold ml-1">{errors.nombre.message}</p>}
          </div>

          {/* BOTONES PRE-SELECCIONADOS */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={selectWorkWeek}
              className="py-3 px-4 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-2xl text-xs font-black uppercase tracking-wider text-gray-600 dark:text-gray-300 transition-all active:scale-95"
            >
              Semana escolar
            </button>
            <button
              type="button"
              onClick={selectFullWeek}
              className="py-3 px-4 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-2xl text-xs font-black uppercase tracking-wider text-gray-600 dark:text-gray-300 transition-all active:scale-95"
            >
              Toda la Semana
            </button>
          </div>

          {/* SELECTOR DE DÍAS */}
          <div className="space-y-2">
            <label className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest text-[10px]">
              Seleccionar Días
            </label>
            <div className="flex flex-wrap justify-between gap-2 bg-gray-50 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 p-3 rounded-2xl">
              {DIAS_OPCIONES.map((dia) => (
                <button
                  key={dia.id}
                  type="button"
                  onClick={() => toggleDay(dia.id)}
                  className={`
                    group relative h-10 w-10 sm:h-12 sm:w-12 rounded-xl text-xs font-black transition-all transform active:scale-90
                    ${selectedDays.includes(dia.id)
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'bg-white dark:bg-neutral-800 text-gray-400 dark:text-gray-500 hover:border-[#d6a738] border border-gray-100 dark:border-neutral-700'
                    }
                  `}
                >
                  {dia.label}
                  {selectedDays.includes(dia.id) && (
                    <div className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-white border-2 border-blue-600 rounded-full" />
                  )}
                </button>
              ))}
            </div>
            {errors.dias && <p className="text-xs text-red-500 font-bold ml-1">{errors.dias.message}</p>}
          </div>

          {/* ENTRADA Y SALIDA */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-black text-gray-700 dark:text-gray-300 flex items-center gap-2">
                Entrada
              </label>
              <div className="relative">
                <input
                  type="time"
                  {...register('entrada')}
                  className="w-full px-5 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/10 transition-all dark:text-white font-bold"
                />
                <Clock size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black text-gray-700 dark:text-gray-300 flex items-center gap-2">
                Salida
              </label>
              <div className="relative">
                <input
                  type="time"
                  {...register('salida')}
                  className="w-full px-5 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/10 transition-all dark:text-white font-bold"
                />
                <Clock size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-gray-500 hover:text-gray-800 dark:hover:text-white font-black text-sm uppercase tracking-widest transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardar.isPending}
              className="flex-[1.5] flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-600/30 disabled:opacity-70 transition-all transform active:scale-95"
            >
              {guardar.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
