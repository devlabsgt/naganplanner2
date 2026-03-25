'use client';

import { useState } from 'react';
import { Users, Search, Plus, UserPlus, MoreVertical, Mail, Phone } from 'lucide-react';

interface Props {
    aulaId: string;
}

export default function GestorEstudiantes({ aulaId }: Props) {
    const [busqueda, setBusqueda] = useState('');
    const [isModalingOpen, setIsModalOpen] = useState(false);

    // Dummy data por ahora
    const estudiantes = [];

    return (
        <div className="bg-[#0a0a0a] border border-neutral-900 rounded-[2.5rem] overflow-hidden flex flex-col min-h-[500px]">
            
            {/* CABECERA Y BUSCADOR */}
            <div className="p-6 md:p-8 border-b border-neutral-900 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 bg-[#0a0a0a]">
                <div>
                    <h2 className="text-base font-black uppercase tracking-tight text-white flex items-center gap-3">
                        <Users className="text-blue-500" />
                        Directorio de Estudiantes
                    </h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
                        Gestiona los alumnos inscritos en esta aula
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-2 md:mt-0 relative z-20">
                    <div className="relative group flex-1 md:min-w-[260px]">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Buscar estudiante..." 
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="bg-[#111] border border-neutral-800 text-white rounded-2xl pl-11 pr-4 py-3 outline-none focus:border-blue-500 transition-colors text-sm font-bold w-full"
                        />
                    </div>
                    
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 w-full sm:w-auto"
                    >
                        <UserPlus size={16} /> Inscribir Alumno
                    </button>
                </div>
            </div>

            {/* CONTENIDO (LISTA O VACÍO) */}
            <div className="flex-1 flex flex-col bg-[#0a0a0a]">
                {estudiantes.length > 0 ? (
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Aquí irían las tarjetas de estudiantes cuando haya datos */}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 p-12">
                        <div className="p-6 bg-[#111] rounded-full mb-6 border border-neutral-800">
                            <Users size={48} className="text-gray-500" />
                        </div>
                        <h3 className="text-base font-black uppercase tracking-widest text-white mb-2">Sin estudiantes inscritos</h3>
                        <p className="text-sm font-bold text-gray-500 max-w-sm">
                            Haz clic en "Inscribir Alumno" para agregar al primer estudiante a esta clase.
                        </p>
                    </div>
                )}
            </div>

        </div>
    );
}
