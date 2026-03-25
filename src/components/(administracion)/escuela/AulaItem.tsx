'use client';

import { ChevronRight, Edit3, Trash2 } from 'lucide-react';
import { Aula } from './lib/zod';
import { useEscuelaMutations } from './lib/hooks';
import Swal from 'sweetalert2';

interface Props {
    aula: Aula;
    onEdit: (aula: Aula) => void;
    onClick: (aula: Aula) => void;
}

export default function AulaItem({ aula, onEdit, onClick }: Props) {
    const { eliminar } = useEscuelaMutations();

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
                Swal.fire({ icon: 'success', title: 'Eliminado', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
            } catch (error: any) {
                Swal.fire({ icon: 'error', title: 'Error', text: error.message });
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
            className="block group bg-[#161616] hover:bg-[#1c1c1c] border border-neutral-800 rounded-xl transition-all duration-300 overflow-hidden cursor-pointer"
        >
            <div className="px-6 py-5 flex items-center justify-between gap-4">
                
                {/* INFO PRINCIPAL (Título y Subtítulo) */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors">
                        {aula.nombre}
                    </h3>
                    <p className="text-sm font-bold text-gray-500 mt-0.5 truncate uppercase tracking-widest text-[11px]">
                        {aula.descripcion || `Gestión Escolar - ${aula.perfil_catedratico?.nombre}`}
                    </p>
                </div>

                {/* ACCIONES (Botón Editar y Eliminar) */}
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleEdit}
                        className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 border border-neutral-800 text-gray-300 hover:text-white hover:border-neutral-600 rounded-lg transition-all text-xs font-black uppercase tracking-widest"
                    >
                        <Edit3 size={14} />
                        Editar
                    </button>
                    
                    <button 
                        onClick={handleEliminar}
                        className="p-2.5 text-gray-600 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
                        title="Eliminar Aula"
                    >
                        <Trash2 size={16} />
                    </button>

                    <div className="ml-2 text-gray-700 group-hover:text-blue-500 transition-colors">
                        <ChevronRight size={20} />
                    </div>
                </div>
            </div>
        </div>
    );
}
