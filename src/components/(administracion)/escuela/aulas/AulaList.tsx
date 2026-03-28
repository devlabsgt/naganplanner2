'use client';

import { useState, useMemo } from 'react';
import {
  Plus, Search, LayoutGrid, SearchX,
  Filter, GraduationCap, ChevronDown, Users, BookOpen, ArrowLeft
} from 'lucide-react';
import { Aula, Perfil, Horario } from '../lib/zod';
import { useGestorEscuela } from '../lib/hooks';
import AulaItem from './AulaItem';
import NuevaAula from './modals/NuevaAula';
import InteriorAula from './InteriorAula';
import DirectorioGeneral from '../estudiantes/DirectorioGeneral';

interface Props {
  initialData: {
    aulas: Aula[];
    usuarios: Perfil[];
    horarios: Horario[];
    perfilActual: Perfil | null;
  } | null;
}

type VistaActual = 'aulas' | 'estudiantes';

export default function AulaList({ initialData }: Props) {
  // TanStack Query para manejo de caché e hidratación
  const { data } = useGestorEscuela(initialData);

  const aulas = (data?.aulas || []) as Aula[];
  const usuarios = (data?.usuarios || []) as Perfil[];
  const horarios = (data?.horarios || []) as Horario[];
  const perfilActual = data?.perfilActual || null;

  // --- ESTADOS ---
  const [vista, setVista] = useState<VistaActual>('aulas');
  const [busqueda, setBusqueda] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('activas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aulaEditar, setAulaEditar] = useState<Aula | undefined>(undefined);
  const [selectedAula, setSelectedAula] = useState<Aula | null>(null);

  const esAdmin = useMemo(() => {
    const rol = (perfilActual?.rol || '').toUpperCase();
    return rol === 'SUPER' || rol === 'ADMIN';
  }, [perfilActual]);

  const handleEditAula = (aula: Aula) => {
    setAulaEditar(aula);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setAulaEditar(undefined);
  };

  // --- LÓGICA DE FILTRADO AULAS ---
  const aulasFiltradas = useMemo(() => {
    // 1. FILTRADO POR ROL/PERMISO
    let baseAulas = aulas;
    if (!esAdmin) {
      // Si no es admin, solo puede ver las aulas donde sea el catedrático asignado
      baseAulas = aulas.filter(aula => aula.catedratico_id === perfilActual?.id);
    }

    // 2. FILTRADO POR BÚSQUEDA Y STATUS
    return baseAulas.filter((aula) => {
      const coincideBusqueda =
        aula.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        aula.perfil_catedratico?.nombre.toLowerCase().includes(busqueda.toLowerCase());

      const coincideStatus =
        filtroStatus === 'todas' ? true :
          filtroStatus === 'activas' ? aula.status === true :
            aula.status === false;

      return coincideBusqueda && coincideStatus;
    });
  }, [aulas, busqueda, filtroStatus, esAdmin, perfilActual]);

  // Si hay un aula seleccionada, mostramos el interior
  if (selectedAula) {
    const aulaActualizada = aulas.find(a => a.id === selectedAula.id) || selectedAula;

    return (
      <div className="max-w-[98%] mx-auto font-sans px-1 md:px-2">
        <InteriorAula
          aula={aulaActualizada}
          perfilActual={perfilActual}
          onBack={() => setSelectedAula(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans max-w-[98%] md:max-w-6xl mx-auto animate-in fade-in duration-300 px-1 md:px-0">

      {/* HEADER DINÁMICO */}
      <div className="flex flex-col gap-6 bg-white dark:bg-[#0a0a0a] p-4 md:p-8 rounded-[2.5rem] border border-[#d5cec2] dark:border-[#3e3630] shadow-sm">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              {vista === 'estudiantes' && (
                <button
                  onClick={() => setVista('aulas')}
                  className="p-2 hover:bg-white/5 rounded-xl text-[#847563] hover:text-[#d6a738] transition-all"
                  title="Regresar a Aulas"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <h1 className="text-base font-black text-[#4a3f36] dark:text-[#f4ebc3] flex items-center gap-3">
                {vista === 'aulas' ? (
                  <>
                    <GraduationCap className="text-[#d6a738]" size={26} />
                    Gestión de Aulas
                  </>
                ) : (
                  <>
                    <Users className="text-[#d6a738]" size={26} />
                    Directorio General de Estudiantes
                  </>
                )}
              </h1>
            </div>
            <p className="text-[10px] text-[#847563] font-black uppercase tracking-widest mt-1 ml-0.5">
              {vista === 'aulas' ? 'Control de cursos, catedráticos y horarios' : 'Administración completa de la base de datos de alumnos'}
            </p>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            {esAdmin && vista === 'aulas' && (
              <>
                <button
                  onClick={() => setVista('estudiantes')}
                  className="flex-1 md:flex-none bg-[#fafafa] dark:bg-[#161616] hover:bg-white dark:hover:bg-[#1e1e1e] border border-[#d5cec2] dark:border-[#3e3630] text-[#4a3f36] dark:text-[#f4ebc3] px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
                >
                  <Users size={16} /> Estudiantes
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex-1 md:flex-none bg-[#d6a738] hover:bg-[#c08e2a] text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#d6a738]/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Plus size={18} /> Nueva Aula
                </button>
              </>
            )}
            {!esAdmin && vista === 'aulas' && (
              <div className="bg-[#fafafa] dark:bg-[#111] px-5 py-3 rounded-2xl border border-[#d5cec2] dark:border-[#3e3630] flex items-center gap-3 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-[#d6a738]/10 flex items-center justify-center">
                  <GraduationCap className="text-[#d6a738]" size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#4a3f36] dark:text-[#f4ebc3] uppercase tracking-tighter leading-none">Catedrático</p>
                </div>
              </div>
            )}
            {/* Botón removido: Ver Aulas */}
          </div>
        </div>

        {/* CONTROLES EXCLUSIVOS DE AULAS */}
        {vista === 'aulas' && (
          <div className="flex flex-col sm:flex-row gap-4 items-center animate-in slide-in-from-top-2 duration-300">
            {/* BUSCADOR */}
            <div className="relative group flex-1 w-full">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9c8e7c] group-focus-within:text-[#d6a738] transition-colors" />
              <input
                type="text"
                placeholder="Buscar aula o profesor..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#faf8f4] dark:bg-[#111] border border-transparent dark:border-[#2a2420] rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#d6a738]/20 transition-all text-[#4a3f36] dark:text-[#f4ebc3] placeholder:text-[#847563] font-bold"
              />
            </div>

            {/* FILTRO STATUS */}
            <div className="relative min-w-[180px] w-full sm:w-auto">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9c8e7c] pointer-events-none">
                <Filter size={14} />
              </div>
              <select
                value={filtroStatus}
                onChange={e => setFiltroStatus(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-[#faf8f4] dark:bg-[#111] dark:border-[#2a2420] rounded-2xl text-xs font-black uppercase tracking-widest text-[#4a3f36] dark:text-[#f4ebc3] outline-none cursor-pointer border-r-8 border-r-transparent focus:ring-2 focus:ring-[#d6a738]/20 appearance-none transition-all"
              >
                <option value="activas">Aulas Activas</option>
                <option value="inactivas">Aulas Inactivas</option>
                <option value="todas">Todas las Aulas</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#9c8e7c]">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="pb-20">
        {vista === 'aulas' ? (
          !esAdmin && aulasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[#faf8f4] dark:bg-[#0a0a0a]/50 rounded-[3rem] border border-dashed border-[#d5cec2] dark:border-[#3e3630] animate-in fade-in duration-500">
              <GraduationCap size={48} className="text-[#d5cec2] dark:text-[#3e3630] mb-4 opacity-20" />
              <h3 className="text-lg font-black text-[#9c8e7c] uppercase tracking-tight">Acceso Restringido</h3>
              <p className="text-sm text-[#847563] font-bold mt-1 max-w-xs text-center">
                No tienes aulas asignadas actualmente. Contacta al administrador para gestionar tu perfil docente.
              </p>
            </div>
          ) : aulasFiltradas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-in fade-in duration-500">
              {aulasFiltradas.map((aula) => (
                <AulaItem
                  key={aula.id}
                  aula={aula}
                  perfilActual={perfilActual}
                  onEdit={handleEditAula}
                  onClick={setSelectedAula}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-[#faf8f4] dark:bg-[#0a0a0a]/50 rounded-[3rem] border border-dashed border-[#d5cec2] dark:border-[#3e3630] animate-in fade-in duration-500">
              <SearchX size={48} className="text-[#d5cec2] dark:text-[#3e3630] mb-4" />
              <h3 className="text-lg font-black text-[#9c8e7c] uppercase tracking-tight">No se encontraron aulas</h3>
              <p className="text-sm text-[#847563] font-bold mt-1">Intenta ajustar los filtros de búsqueda</p>
            </div>
          )
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <DirectorioGeneral perfilActual={perfilActual} />
          </div>
        )}
      </div>

      {/* MODALES */}
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
