'use client';

import { ChevronRight, Edit3, Trash2 } from 'lucide-react';
import { Aula } from '../lib/zod';
import { useEscuelaMutations } from '../lib/hooks';
import Swal from 'sweetalert2';

interface Props {
    aula: Aula;
    perfilActual: any;
    onEdit: (aula: Aula) => void;
    onClick: (aula: Aula) => void;
}

export default function AulaItem({ aula, perfilActual, onEdit, onClick }: Props) {
    const { eliminar } = useEscuelaMutations();

    // Verificación de rol robusta (case-insensitive)
    const userRole = (perfilActual?.rol || '').toUpperCase();
    const esAdmin = userRole === 'SUPER' || userRole === 'ADMIN';

    const handleEliminar = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const res = await Swal.fire({
            title: '¿Eliminar aula?',
            text: `Se borrará "${aula.nombre}". Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (res.isConfirmed) {
            try {
                await eliminar.mutateAsync(aula.id);
                Swal.fire({
                    icon: 'success',
                    title: 'Eliminado',
                    toast: true,
                    position: 'top',
                    showConfirmButton: false,
                    timer: 5000,
                    timerProgressBar: true,
                    showClass: { popup: 'animate__animated animate__slideInDown' },
                    hideClass: { popup: 'animate__animated animate__fadeOutUp' }
                });
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
        }
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onEdit(aula);
    };

    return (
        <div
            onClick={() => onClick(aula)}
            className="block group bg-[#fafafa] dark:bg-[#161616] hover:bg-white dark:hover:bg-[#1c1c1c] border border-[#e5e5e5] dark:border-neutral-800 rounded-xl transition-all duration-300 overflow-hidden cursor-pointer"
        >
            <div className="px-2 py-4 md:px-6 md:py-5 flex items-center justify-between gap-4">

                {/* INFO PRINCIPAL (Título y Subtítulo) */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black text-[#4a3f36] dark:text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors">
                        {aula.nombre}
                    </h3>
                    <p className="text-[10px] font-black text-[#d6a738] mt-0.5 truncate uppercase tracking-widest">
                        {aula.perfil_catedratico?.nombre || 'Sin Docente'}
                    </p>
                </div>

                {/* ACCIONES (Botón Editar y Eliminar para Admins) */}
                <div className="flex items-center gap-2">
                    {esAdmin && (
                        <>
                            <button
                                onClick={handleEdit}
                                className="p-2 text-gray-600 hover:text-blue-500 hover:bg-blue-500/5 rounded-lg transition-all"
                                title="Editar Aula"
                            >
                                <Edit3 size={16} />
                            </button>

                            <button
                                onClick={handleEliminar}
                                className="p-2.5 text-gray-600 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
                                title="Eliminar Aula"
                            >
                                <Trash2 size={16} />
                            </button>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}
