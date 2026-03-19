'use client';

import { useState, useMemo } from 'react';
import { 
  Plus, Search, Calendar as CalendarIcon, 
  SearchX, LayoutGrid, ArrowLeft, Building2, ChevronDown, ChevronRight, User
} from 'lucide-react';
import { Actividad, Perfil } from './lib/zod';
import { useGestorActividades } from './lib/hooks';
import ActividadItem from './ActividadItem';
import NuevaActividad from './modals/NuevaActividad';

type DeptoEquipo = {
  id: string;
  nombre: string;
  miembros: string[];
};

interface Props {
  initialData: {
    actividades: Actividad[];
    usuarios: Perfil[];
    perfil: Perfil;
    departamentosEquipo?: DeptoEquipo[]; 
    isJefe?: boolean;
  };
  tipoVista: 'mis_actividades' | 'mi_equipo' | 'todas';
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function ActividadList({ initialData, tipoVista }: Props) {
  const { data } = useGestorActividades(tipoVista, initialData);
  
  const actividades = (data?.actividades || []) as Actividad[];
  const usuarios = (data?.usuarios || []) as Perfil[];
  const perfil = (data?.perfil || initialData.perfil) as Perfil;
  const departamentosEquipo = (data?.departamentosEquipo || initialData.departamentosEquipo || []) as DeptoEquipo[];
  const isJefe = data?.isJefe ?? initialData.isJefe ?? false;

  // --- ESTADOS ---
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [expandedDeptos, setExpandedDeptos] = useState<Record<string, boolean>>({});
  const toggleDepto = (id: string) => setExpandedDeptos(prev => ({...prev, [id]: !prev[id]}));

  // --- LÓGICA DE FILTRADO BASE (Fecha, Texto, Estado) ---
  const actividadesFiltradasRaw = useMemo(() => {
    return actividades.filter((act: Actividad) => {
      if (!act.due_date) return false;
      const fecha = new Date(act.due_date);
      
      const coincideFecha = fecha.getMonth() === mesSeleccionado && fecha.getFullYear() === anioSeleccionado;
      
      const termino = busqueda.toLowerCase();
      // Verificación segura de assignee
      const nombreAsignado = act.assignee?.nombre?.toLowerCase() || '';
      const coincideTexto = act.title.toLowerCase().includes(termino) || nombreAsignado.includes(termino);
      
      const coincideEstado = filtroEstado === '' || act.status === filtroEstado;

      return coincideFecha && coincideTexto && coincideEstado;
    });
  }, [actividades, busqueda, mesSeleccionado, anioSeleccionado, filtroEstado]);

  // --- LÓGICA DE FILTRADO 2: STRICTLY INDIVIDUAL ---
  // Una actividad es "Individual" para este módulo si:
  // 1. NO tiene la propiedad 'integrantes' (es una actividad simple).
  // 2. O tiene 'integrantes', pero la longitud es 1 Y ese integrante es el usuario actual.
  const actividadesIndividuales = useMemo(() => {
    return actividadesFiltradasRaw.filter(act => {
      // Casteamos a any para verificar si viene de la tabla de planificador (con integrantes)
      const actWithIntegrantes = act as any;

      if (actWithIntegrantes.integrantes && Array.isArray(actWithIntegrantes.integrantes)) {
        // Si tiene más de 1 integrante -> ES GRUPAL -> OCULTAR
        if (actWithIntegrantes.integrantes.length > 1) return false;

        // Si tiene 1 integrante, pero NO soy yo -> ES DELEGADA/GRUPAL -> OCULTAR
        if (actWithIntegrantes.integrantes.length === 1) {
           const integranteId = actWithIntegrantes.integrantes[0].usuario_id || actWithIntegrantes.integrantes[0].id;
           if (integranteId !== perfil.id) return false;
        }
      }
      
      // Si pasa las pruebas, es individual
      return true;
    });
  }, [actividadesFiltradasRaw, perfil.id]);


  // --- HELPERS VISUALES ---
  const getNombreFecha = (isoFormatted: string) => {
    if (isoFormatted === 'sin-fecha') return 'Sin fecha límite';
    // isoFormatted viene como YYYY-MM-DD local
    const [year, month, day] = isoFormatted.split('-').map(Number);
    const fechaObj = new Date(year, month - 1, day);
    const opciones: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    return fechaObj.toLocaleDateString('es-ES', opciones);
  };

  const aniosDisponibles = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 1 + i);

  // --- RENDERIZADO ---
  const renderListaActividades = (listaAProcesar: Actividad[]) => {
    let listaFinal = listaAProcesar;
    if (expandedId) {
      const actividadActiva = actividades.find(a => a.id === expandedId);
      if (actividadActiva) listaFinal = [actividadActiva];
    }

    const map: Record<string, Actividad[]> = {};
    listaFinal.forEach((act) => {
      let fechaKey = 'sin-fecha';
      
      if (act.due_date) {
        // En lugar de hacer split('T'), usamos el objeto Date para obtener el año/mes/día LOCAL
        const d = new Date(act.due_date);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        fechaKey = `${y}-${m}-${day}`;
      }

      if (!map[fechaKey]) map[fechaKey] = [];
      map[fechaKey].push(act);
    });
    
    const grupos = Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));

    if (grupos.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 bg-[#faf8f4] dark:bg-neutral-900/30 rounded-2xl border border-dashed border-[#d5cec2] dark:border-[#3e3630]">
          <SearchX size={36} className="text-[#d5cec2] mb-3" />
          <h3 className="text-sm font-bold text-[#9c8e7c]">No hay actividades individuales aquí</h3>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {grupos.map(([fecha, actividadesGrupo]) => (
          <div key={fecha} className="space-y-3 animate-in fade-in">
            <h3 className="flex items-center gap-2 text-[11px] font-black text-[#9c8e7c] dark:text-[#847563] uppercase tracking-[0.2em] ml-2">
              <CalendarIcon size={14} className="text-[#d6a738]" />
              {getNombreFecha(fecha)}
              <span className="ml-auto bg-[#faf8f4] dark:bg-neutral-800 text-[#4a3f36] dark:text-[#b9ae9f] px-2 py-0.5 rounded-lg text-[10px] font-bold">
                {actividadesGrupo.length}
              </span>
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              {actividadesGrupo.map((act) => (
                <ActividadItem 
                  key={act.id} 
                  actividad={act} 
                  usuarios={usuarios} 
                  usuarioActualId={perfil.id}
                  isExpanded={expandedId === act.id} 
                  onToggle={() => setExpandedId(expandedId === act.id ? null : act.id)}
                  isJefe={isJefe} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const isVistaDepartamentos = (tipoVista === 'mi_equipo' || tipoVista === 'todas') && departamentosEquipo.length > 0;

  // Calculamos tareas individuales directas (no asociadas a un departamento en esta vista)
  const idsEnDeptos = departamentosEquipo.flatMap(d => d.miembros);
  const actosDirectos = actividadesIndividuales.filter(a => !idsEnDeptos.includes(a.assigned_to!));

  return (
    <div className="space-y-6 font-sans max-w-6xl mx-auto">
      
      {!expandedId ? (
        <div className="flex flex-col gap-6 bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-[#d5cec2] dark:border-[#3e3630] shadow-sm animate-in fade-in duration-300">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-base font-black text-[#4a3f36] dark:text-[#f4ebc3] flex items-center gap-2">
                <LayoutGrid className="text-[#d6a738]" size={20} />
                Gestor de Actividades
              </h1>
              <p className="text-sm text-[#847563] dark:text-[#b9ae9f] font-medium">
                {tipoVista === 'mis_actividades' && 'Mis tareas personales'}
                {tipoVista === 'mi_equipo' && 'Tareas individuales de mi equipo'}
                {tipoVista === 'todas' && 'Todas las tareas individuales'}
              </p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full md:w-auto bg-[#d6a738] hover:bg-[#c08e2a] text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-[#d6a738]/20 dark:shadow-none transition-all flex items-center justify-center gap-2 active:scale-95 text-sm"
            >
              <Plus size={18} /> Nueva Actividad
            </button>
          </div>

          <div className="flex flex-col xl:flex-row gap-4 items-center">
            
            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide w-full xl:w-auto justify-start">
              {['Asignado', 'Completado', 'Vencido'].map((estado) => {
                // Count sobre la lista FILTRADA (solo individuales)
                const count = actividadesIndividuales.filter((act) => act.status === estado).length;
                const isActive = filtroEstado === estado;
                
                return (
                  <button
                    key={estado} 
                    onClick={() => setFiltroEstado(prev => prev === estado ? '' : estado)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-2 ${isActive ? 'bg-[#d6a738] border-[#d6a738] text-white shadow-md' : 'bg-white dark:bg-neutral-800 border-[#d5cec2] dark:border-[#3e3630] text-[#847563] hover:border-[#d6a738]/50 dark:text-[#b9ae9f]'}`}
                  >
                    <span>{estado === 'Vencido' ? 'VENCIDOS' : estado.toUpperCase()}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] min-w-5 text-center ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-neutral-700 text-gray-500 dark:text-gray-400'}`}>{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto flex-1">
              <div className="relative group flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9c8e7c] group-focus-within:text-[#d6a738] transition-colors" />
                <input 
                  type="text" placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#faf8f4] dark:bg-neutral-800 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#d6a738]/20 transition-all text-[#4a3f36] dark:text-[#f4ebc3] placeholder:text-[#9c8e7c]"
                />
              </div>
              <div className="flex gap-2 min-w-50">
                <select value={mesSeleccionado} onChange={e => setMesSeleccionado(Number(e.target.value))} className="flex-1 px-3 py-2.5 bg-[#faf8f4] dark:bg-neutral-800 rounded-2xl text-sm font-bold text-[#4a3f36] dark:text-[#f4ebc3] outline-none cursor-pointer border-r-8 border-r-transparent focus:ring-2 focus:ring-[#d6a738]/20">
                  {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select value={anioSeleccionado} onChange={e => setAnioSeleccionado(Number(e.target.value))} className="px-3 py-2.5 bg-[#faf8f4] dark:bg-neutral-800 rounded-2xl text-sm font-bold text-[#4a3f36] dark:text-[#f4ebc3] outline-none cursor-pointer border-r-8 border-r-transparent focus:ring-2 focus:ring-[#d6a738]/20">
                  {aniosDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center animate-in fade-in slide-in-from-left-4 duration-300">
          <button 
            onClick={() => setExpandedId(null)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-neutral-900 border border-[#d5cec2] dark:border-[#3e3630] text-[#847563] dark:text-[#b9ae9f] hover:text-[#d6a738] dark:hover:text-[#d6a738] rounded-2xl font-bold text-sm shadow-sm transition-all"
          >
            <ArrowLeft size={18} /> Volver a la lista
          </button>
        </div>
      )}

      <div className="pb-20">
        
        {expandedId ? (
          renderListaActividades(actividadesIndividuales)
        ) : 
        
        isVistaDepartamentos ? (
          <div className="space-y-4">
            
            {actosDirectos.length > 0 && (
              <div className="flex flex-col bg-white dark:bg-[#1a1a1a] border border-[#d5cec2] dark:border-[#3e3630] rounded-2xl overflow-hidden shadow-sm">
                <div onClick={() => toggleDepto('directas')} className="flex items-center justify-between p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 flex items-center justify-center shrink-0">
                      <User size={24} />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-[#4a3f36] dark:text-white font-bold text-sm uppercase tracking-wide">
                        {tipoVista === 'todas' ? 'Sin Departamento / Externas' : 'Mis Actividades Directas'}
                      </h3>
                      <p className="text-[#847563] dark:text-gray-400 text-xs mt-0.5">{actosDirectos.length} actividades</p>
                    </div>
                  </div>
                  <div className="text-[#9c8e7c] dark:text-gray-500 mr-2">
                    {expandedDeptos['directas'] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </div>
                </div>
                {expandedDeptos['directas'] && (
                  <div className="p-4 sm:p-6 border-t border-[#d5cec2] dark:border-[#3e3630] bg-[#faf8f4] dark:bg-black/20">
                    {renderListaActividades(actosDirectos)}
                  </div>
                )}
              </div>
            )}

            {departamentosEquipo.map(depto => {
              // Filtrar actividades INDIVIDUALES de los miembros de este departamento
              const actsDepto = actividadesIndividuales.filter(a => depto.miembros.includes(a.assigned_to!));
              
              const isOpen = expandedDeptos[depto.id];
              
              if (actsDepto.length === 0) return null;

              return (
                <div key={depto.id} className="flex flex-col bg-white dark:bg-[#1a1a1a] border border-[#d5cec2] dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                  <div onClick={() => toggleDepto(depto.id)} className="flex items-center justify-between p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-[#fbf7e6] dark:bg-[#d6a738]/20 text-[#c08e2a] dark:text-[#d6a738] flex items-center justify-center shrink-0">
                        <Building2 size={24} />
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-[#4a3f36] dark:text-white font-bold text-sm uppercase tracking-wide">{depto.nombre}</h3>
                        <p className="text-[#847563] dark:text-gray-400 text-xs mt-0.5">{actsDepto.length} actividades</p>
                      </div>
                    </div>
                    <div className="text-[#9c8e7c] dark:text-gray-500 mr-2">
                      {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>
                  </div>
                  
                  {isOpen && (
                    <div className="p-4 sm:p-6 border-t border-[#d5cec2] dark:border-neutral-800 bg-[#faf8f4] dark:bg-black/20">
                      {renderListaActividades(actsDepto)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : 
        
        (
          renderListaActividades(actividadesIndividuales)
        )}
      </div>

      <NuevaActividad 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        usuarios={usuarios}
        usuarioActualId={perfil.id}
        isJefe={isJefe} 
      />
    </div>
  );
}