'use client';

import { useState } from 'react';
import { 
  Edit2, Trash2, ChevronDown, Calendar, User, Users,
  Clock, AlertCircle, Ban, Mail, Paperclip, Youtube, X,
  Star, Music
} from 'lucide-react';
import { Planificador, Perfil } from './lib/zod';
import { usePlanificadorLogic } from './lib/hooks'; 
import NuevoPlanificador from './modals/NuevoPlanificador';
import FilaIntegrante from './FilaIntegrante';
import PlanificadorChecklist from './PlanificadorChecklist'; 
import GestorArchivos from './modals/GestorArchivos';
import GestorVideo from './modals/GestorVideo';
import GestorAlabanzaActividad from './modals/GestorAlabanzaActividad';
import ModalRepertorioActividad from './modals/ModalRepertorioActividad';

interface Props {
  planificador: Planificador; 
  isExpanded?: boolean;
  onToggle?: () => void;
  usuarioActualId: string;
  usuarios: Perfil[];
  isJefe: boolean; 
  modulo: string;
  tipoVista: 'mis_actividades' | 'mi_equipo' | 'todas';
}

export default function PlanificadorItem({ 
  planificador, 
  isExpanded = false, 
  onToggle, 
  usuarioActualId, 
  usuarios,
  isJefe,
  modulo,
  tipoVista 
}: Props) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  const [forceShowFiles, setForceShowFiles] = useState(false);
  const [forceShowVideos, setForceShowVideos] = useState(false);
  const [forceShowAlabanzas, setForceShowAlabanzas] = useState(false);
  const [modalRepertorioOpen, setModalRepertorioOpen] = useState(false);

  const { permisos, datos, acciones } = usePlanificadorLogic(
    planificador, 
    usuarioActualId, 
    usuarios, 
    isJefe, 
    onToggle, 
    isExpanded
  );

  const handleHeaderClick = (e: React.MouseEvent) => {
    if (permisos.estaPendiente) {
      acciones.abrirModalInvitacion(e);
      return;
    }
    if (permisos.estaRechazado && !permisos.esCreador && !isJefe) {
      return;
    }
    if (onToggle) onToggle();
  };

  // --- 1. COLOR DEL BORDE (Solo borde izquierdo discreto según urgencia) ---
  const getStatusColor = () => {
    if (datos.estado === 'Para hoy') return 'border-l-blue-500 bg-blue-50/10 dark:bg-blue-900/10';
    if (datos.estado === 'Terminado') return 'border-l-purple-500 bg-purple-50/10 dark:bg-purple-900/10';
    return 'border-l-[#d6a738] bg-white dark:bg-neutral-900';
  };

  // --- 2. ESTILO DEL BADGE DE SERVICIO (Servicio, Ensayo, Servicio Especial) ---
  const getServiceBadgeStyle = (tipo: string | null | undefined) => {
    switch (tipo) {
      case 'servicio':
      case 'culto': 
        return 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800';
      case 'ensayo': 
        return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
      case 'servicio_especial':
      case 'especial': 
        return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800';
      case 'reunion':
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800';
      default: 
        return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-neutral-800 dark:text-gray-400';
    }
  };

  const getServiceLabel = (status: string | null | undefined) => {
    switch (status) {
      case 'servicio':
      case 'culto': return 'Servicio';
      case 'ensayo': return 'Ensayo';
      case 'servicio_especial':
      case 'especial': return 'Servicio Especial';
      case 'reunion': return 'Reunión';
      default: return status || 'General';
    }
  };

  const esMiembroConfirmado = [...datos.encargados, ...datos.miembros].some(
    i => i.usuario_id === usuarioActualId && i.invitación !== false
  );
  const puedeHacerCheck = permisos.puedeEditar || esMiembroConfirmado;
  const esEncargadoActividad = datos.encargados.some(i => i.usuario_id === usuarioActualId);
  const puedeGestionarContenido = isJefe || esEncargadoActividad || permisos.esCreador;

  const checklistSeguro = planificador.checklist ?? [];
  const adjuntosSeguros = planificador.archivos_pdf ?? [];
  const videosSeguros = planificador.videos_url ?? [];
  const alabanzasSeguras = (planificador as any).alabanzas ?? [];

  const showFiles = adjuntosSeguros.length > 0 || forceShowFiles;
  const showVideos = videosSeguros.length > 0 || forceShowVideos;
  const showAlabanzas = alabanzasSeguras.length > 0 || forceShowAlabanzas;

  return (
    <>
      <div className={`
        group rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col
        ${getStatusColor()} 
        ${isExpanded ? 'ring-1 ring-blue-500/50 shadow-lg dark:border-blue-900/50' : 'hover:shadow-md border-gray-200 dark:border-[#3e3630]'}
        dark:bg-neutral-900
      `}>
        {/* ================= HEADER ================= */}
        <div 
          onClick={handleHeaderClick}
          className={`p-4 sm:p-5 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${permisos.estaPendiente ? 'hover:bg-blue-50/30 dark:hover:bg-blue-900/10' : ''}`}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              
              {/* ÚNICO BADGE VISIBLE: TIPO DE SERVICIO */}
              <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border ${getServiceBadgeStyle(planificador.status)}`}>
                {(planificador.status === 'servicio_especial' || planificador.status === 'especial') && <Star size={10} className="fill-current"/>}
                {getServiceLabel(planificador.status)}
              </span>

            </div>

            <h3 className="font-bold text-gray-800 dark:text-[#f4ebc3] truncate text-base">
              {isExpanded ? 'Detalles de la actividad' : planificador.title}
            </h3>
            
            {!isExpanded && (
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500 dark:text-[#b9ae9f]">
                <span className="flex items-center gap-1"><Clock size={14} className="text-[#d6a738]"/> {datos.fechaFmt}</span>
                <span className="flex items-center gap-1"><User size={14}/> {datos.encargados[0]?.perfil?.nombre || 'N/A'}</span>
                <span className="flex items-center gap-1"><Users size={14}/> {planificador.integrantes.length} Integrante(s)</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
              
              {permisos.estaPendiente && (
                <button 
                  onClick={acciones.abrirModalInvitacion} 
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 mr-2 animate-pulse"
                >
                  <Mail size={14} /> Invitación
                </button>
              )}

              {permisos.estaRechazado && !permisos.esCreador && (
                <span className="mr-2 px-3 py-1.5 text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900/50 flex items-center gap-1">
                  <Ban size={14}/> Rechazado
                </span>
              )}

              {permisos.mostrarHerramientasEdicion && (
                <>
                  <button onClick={() => setIsEditOpen(true)} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-500 dark:text-[#9c8e7c] dark:hover:bg-neutral-800 rounded-lg transition-colors">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={acciones.eliminarActividad} className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:text-[#9c8e7c] dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </>
              )}

              <button 
                className={`transition-all duration-300 p-2 rounded-lg ${
                  isExpanded ? 'rotate-180 text-blue-500' : 'text-gray-400 hover:bg-gray-100 dark:text-[#9c8e7c] dark:hover:bg-neutral-800'
                } ${permisos.estaPendiente ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <ChevronDown size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* ================= CUERPO EXPANDIDO ================= */}
        <div className={`
          flex flex-col overflow-hidden transition-all duration-300 ease-in-out
          ${isExpanded ? 'max-h-1250 border-t border-gray-100 dark:border-blue-900/30' : 'max-h-0 border-t-0'}
        `}>
          <div className="p-5 sm:p-6 bg-gray-50/50 dark:bg-transparent flex flex-col gap-6">
            
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{planificador.title}</h2>
              
              {planificador.due_date && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 font-medium">
                  <Calendar size={16} className="text-blue-500" />
                  <span>Fecha y Hora: {datos.vencimiento}</span>
                </div>
              )}
              
              {planificador.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 whitespace-pre-line">
                  {planificador.description}
                </p>
              )}

              {(checklistSeguro.length > 0 || permisos.puedeEditar) && (
                <PlanificadorChecklist 
                  planificadorId={planificador.id}
                  checklist={checklistSeguro}
                  readOnly={!puedeHacerCheck}
                  puedeEditarEstructura={permisos.puedeEditar}
                />
              )}

              {puedeGestionarContenido && (!showFiles || !showVideos) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 animate-in fade-in slide-in-from-top-2">
                  {!showFiles && (
                    <button 
                      onClick={() => setForceShowFiles(true)}
                      className="group flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-gray-300 dark:border-neutral-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-200 active:scale-95 hover:-translate-y-0.5 hover:shadow-sm"
                    >
                      <Paperclip size={18} className="text-gray-400 group-hover:text-blue-500 transition-colors group-hover:scale-110" /> 
                      <span className="text-sm font-bold text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        Adjuntar PDF
                      </span>
                    </button>
                  )}
                  {!showVideos && (
                    <button 
                      onClick={() => setForceShowVideos(true)}
                      className="group flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-gray-300 dark:border-neutral-700 hover:border-red-500 dark:hover:border-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-all duration-200 active:scale-95 hover:-translate-y-0.5 hover:shadow-sm"
                    >
                      <Youtube size={18} className="text-gray-400 group-hover:text-red-500 transition-colors group-hover:scale-110" />
                      <span className="text-sm font-bold text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400">
                        Vincular Video
                      </span>
                    </button>
                  )}
                  {!showAlabanzas && (
                    <button 
                      onClick={() => setForceShowAlabanzas(true)}
                      className="group flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-gray-300 dark:border-[#2a2624] hover:border-[#d6a738] dark:hover:border-[#d6a738] hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-all duration-200 active:scale-95 hover:-translate-y-0.5 hover:shadow-sm sm:col-span-2"
                    >
                      <Music size={18} className="text-gray-400 group-hover:text-[#d6a738] transition-colors group-hover:scale-110" />
                      <span className="text-sm font-bold text-gray-500 dark:text-gray-400 group-hover:text-[#d6a738] dark:group-hover:text-[#d6a738]">
                        Añadir Repertorio Musical
                      </span>
                    </button>
                  )}
                </div>
              )}

              {showAlabanzas && (
                <div className="relative animate-in fade-in slide-in-from-top-2 flex flex-col gap-3 p-5 bg-gradient-to-br from-white to-gray-50 dark:from-[#131211] dark:to-[#0f0e0d] rounded-2xl border border-[#d5cec2]/50 dark:border-[#2a2624]/50 shadow-sm mt-4">
                   {forceShowAlabanzas && alabanzasSeguras.length === 0 && (
                      <button 
                        onClick={() => setForceShowAlabanzas(false)}
                        className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all z-10 active:scale-90"
                        title="Quitar sección de alabanza"
                      >
                        <X size={16} />
                      </button>
                   )}
                   
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 flex items-center justify-center bg-gradient-to-br from-[#d6a738] to-[#c08e2a] text-white rounded-xl shadow-lg shadow-[#d6a738]/20">
                          <Music size={24} />
                        </div>
                        <div>
                          <h4 className="font-black text-lg text-[#4a3f36] dark:text-[#f4ebc3] tracking-tight">Repertorio Musical</h4>
                          <p className="text-xs font-bold text-[#847563] uppercase tracking-widest mt-0.5">{alabanzasSeguras.length} CANTOS PROGRAMADOS</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                       {alabanzasSeguras.length > 0 && (
                         <button 
                           onClick={() => setModalRepertorioOpen(true)}
                           className="flex-1 sm:flex-none px-4 py-2 bg-neutral-900 text-white dark:bg-[#f4ebc3] dark:text-[#2a2624] rounded-xl text-[10px] font-black uppercase tracking-widest transition-transform active:scale-95 shadow-md flex justify-center items-center"
                         >
                           Ver Repertorio
                         </button>
                       )}
                       {puedeGestionarContenido && (
                         <div className="flex-1 sm:flex-none">
                           <GestorAlabanzaActividad 
                              actividadId={planificador.id}
                              alabanzasIniciales={alabanzasSeguras}
                              readonly={!puedeGestionarContenido}
                           />
                         </div>
                       )}
                     </div>
                   </div>

                   <ModalRepertorioActividad 
                      isOpen={modalRepertorioOpen}
                      onClose={() => setModalRepertorioOpen(false)}
                      songs={alabanzasSeguras}
                      actividadId={planificador.id}
                      integrantes={planificador.integrantes}
                      puedeGestionar={puedeGestionarContenido}
                   />
                </div>
              )}

              {showFiles && (
                <div className="relative mt-4 pt-9 border-t border-gray-100 dark:border-neutral-800 animate-in fade-in slide-in-from-top-2">
                  {forceShowFiles && adjuntosSeguros.length === 0 && (
                     <button 
                        onClick={() => setForceShowFiles(false)}
                        className="absolute top-2 right-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all z-10 active:scale-90"
                        title="Cancelar adjunto"
                     >
                        <X size={16} />
                     </button>
                  )}
                  <GestorArchivos 
                     actividadId={planificador.id}
                     adjuntosIniciales={adjuntosSeguros}
                     readonly={!puedeGestionarContenido}
                  />
                </div>
              )}

              {showVideos && (
                <div className="relative mt-2 animate-in fade-in slide-in-from-top-2">
                  {forceShowVideos && videosSeguros.length === 0 && (
                     <button 
                        onClick={() => setForceShowVideos(false)}
                        className="absolute top-2 right-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all z-10 active:scale-90"
                        title="Cancelar video"
                     >
                        <X size={16} />
                     </button>
                  )}
                  <GestorVideo 
                    actividadId={planificador.id}
                    videosIniciales={videosSeguros}
                    readonly={!puedeGestionarContenido}
                  />
                </div>
              )}

            </div>

            {/* INTEGRANTES */}
            {[
              { titulo: 'Encargados', icon: User, lista: datos.encargados, empty: 'No hay encargados asignados.' },
              { titulo: 'Integrantes', icon: Users, lista: datos.miembros, empty: 'No hay integrantes adicionales.' }
            ].map((grupo, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-neutral-800 pb-2">
                  <grupo.icon size={16} className="text-blue-500"/> {grupo.titulo}
                </div>
                <div className="flex flex-col gap-2">
                  {grupo.lista.length > 0 ? (
                    grupo.lista.map((integrante, idx) => (
                      <FilaIntegrante 
                        key={idx}
                        integrante={integrante}
                        usuarioActualId={usuarioActualId}
                        puedeEditar={permisos.puedeEditar}
                        onVerJustificacion={acciones.verJustificacion}
                        onSustituir={acciones.sustituir}
                        onDarDeBaja={acciones.darDeBaja}
                        isJefe={isJefe}
                        actividadId={planificador.id}
                      />
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 italic">{grupo.empty}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-4 bg-gray-100/50 dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-neutral-800/50 mt-auto">
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-[#9c8e7c]">
              <span>Creado por: <strong className="text-gray-700 dark:text-gray-300">{planificador.creator?.nombre}</strong></span>
              <span>Registro: {datos.fechaFmt}</span>
            </div>
          </div>
        </div>
      </div>

      {isEditOpen && (
        <NuevoPlanificador 
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          usuarios={usuarios}
          usuarioActualId={usuarioActualId}
          planificadorEditar={planificador}
          isJefe={isJefe}
          modulo={modulo}
          tipoVista={tipoVista}
        />
      )}
    </>
  );
}