'use client';

import { useState, useMemo } from 'react';
import { 
  Plus, Search, LayoutGrid, SearchX, 
  Filter, GraduationCap, ChevronDown 
} from 'lucide-react';
import { Aula, Perfil, Horario } from './lib/zod';
import { useGestorEscuela } from './lib/hooks';
import AulaItem from './AulaItem';
import NuevaAula from './modals/NuevaAula';
import InteriorAula from './InteriorAula';

interface Props {
  initialData: {
    aulas: Aula[];
    usuarios: Perfil[];
    horarios: Horario[];
  } | null;
}

export default function AulaList({ initialData }: Props) {
  // TanStack Query para manejo de caché e hidratación
  const { data } = useGestorEscuela(initialData);
  
  const aulas = (data?.aulas || []) as Aula[];
  const usuarios = (data?.usuarios || []) as Perfil[];
  const horarios = (data?.horarios || []) as Horario[];

  // --- ESTADOS ---
  const [busqueda, setBusqueda] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('activas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aulaEditar, setAulaEditar] = useState<Aula | undefined>(undefined);
  const [selectedAula, setSelectedAula] = useState<Aula | null>(null);

  const handleEditAula = (aula: Aula) => {
    setAulaEditar(aula);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setAulaEditar(undefined);
  };

  // --- LÓGICA DE FILTRADO ---
  const aulasFiltradas = useMemo(() => {
    return aulas.filter((aula) => {
      const coincideBusqueda = 
        aula.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        aula.perfil_catedratico?.nombre.toLowerCase().includes(busqueda.toLowerCase());

      const coincideStatus = 
        filtroStatus === 'todas' ? true :
        filtroStatus === 'activas' ? aula.status === true :
        aula.status === false;

      return coincideBusqueda && coincideStatus;
    });
  }, [aulas, busqueda, filtroStatus]);

  if (selectedAula) {
    return (
      <div className="max-w-6xl mx-auto font-sans">
        <InteriorAula 
          aula={selectedAula} 
          onBack={() => setSelectedAula(null)} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans max-w-6xl mx-auto animate-in fade-in duration-300">
      
      {/* HEADER Y CONTROLES */}
      <div className="flex flex-col gap-6 bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-[#d5cec2] dark:border-[#3e3630] shadow-sm animate-in fade-in duration-300">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-base font-black text-[#4a3f36] dark:text-[#f4ebc3] flex items-center gap-2">
              <GraduationCap className="text-[#d6a738]" size={24} />
              Gestión de Aulas
            </h1>
            <p className="text-sm text-[#847563] dark:text-[#b9ae9f] font-medium">
              Control de cursos, catedráticos y horarios
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none bg-[#d6a738] hover:bg-[#c08e2a] text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-[#d6a738]/20 dark:shadow-none transition-all flex items-center justify-center gap-2 active:scale-95 text-sm"
          >
            <Plus size={18} /> Nueva Aula
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          {/* BUSCADOR */}
          <div className="relative group flex-1 w-full">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9c8e7c] group-focus-within:text-[#d6a738] transition-colors" />
            <input
              type="text" 
              placeholder="Buscar por nombre de aula o profesor..." 
              value={busqueda} 
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#faf8f4] dark:bg-neutral-800 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#d6a738]/20 transition-all text-[#4a3f36] dark:text-[#f4ebc3] placeholder:text-[#9c8e7c]"
            />
          </div>

          {/* FILTRO STATUS */}
          <div className="relative min-w-[160px] w-full sm:w-auto">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9c8e7c] pointer-events-none">
              <Filter size={14} />
            </div>
            <select
              value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value)}
              className="w-full pl-9 pr-10 py-2.5 bg-[#faf8f4] dark:bg-neutral-800 rounded-2xl text-sm font-bold text-[#4a3f36] dark:text-[#f4ebc3] outline-none cursor-pointer border-r-8 border-r-transparent focus:ring-2 focus:ring-[#d6a738]/20 appearance-none"
            >
              <option value="activas">Aulas Activas</option>
              <option value="inactivas">Aulas Inactivas</option>
              <option value="todas">Todas las Aulas</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#9c8e7c]">
              <ChevronDown size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* LISTADO DE AULAS */}
      <div className="pb-20">
        {aulasFiltradas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-in fade-in duration-500">
            {aulasFiltradas.map((aula) => (
              <AulaItem 
                key={aula.id} 
                aula={aula} 
                onEdit={handleEditAula}
                onClick={setSelectedAula}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-[#faf8f4] dark:bg-neutral-900/30 rounded-3xl border border-dashed border-[#d5cec2] dark:border-[#3e3630]">
            <SearchX size={48} className="text-[#d5cec2] mb-4" />
            <h3 className="text-lg font-bold text-[#9c8e7c]">No se encontraron aulas</h3>
            <p className="text-sm text-[#847563]">Intenta ajustar los filtros o crear una nueva aula</p>
          </div>
        )}
      </div>

      {/* MODAL DE CREACIÓN / EDICIÓN */}
      <NuevaAula 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        usuarios={usuarios}
        horarios={horarios}
        aulaEditar={aulaEditar}
      />
    </div>
  );
}
