import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
  DialogPortal
} from '@/components/ui/dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import {
  Music, Plus, Search, Filter, Save, X, Music2, Activity, Mic2, Heart,
  Info, Hash, Timer, Layers, ExternalLink, ArrowRight, ArrowLeft, Edit3, Trash2, ChevronDown
} from 'lucide-react';
import { obtenerBancoAlabanzas, crearAlabanza, actualizarAlabanza, eliminarAlabanza } from '../lib/actions/alabanzas';
import Swal from 'sweetalert2';

const TIPOS_ALABANZA = [
  'Acción de Gracias',
  'Alabanza',
  'Alabanza de Adoración',
  'Canto Especial'
];

const getTipoConfig = (tipo: string) => {
  return {
    bgColor: 'bg-[#fbf7e6] dark:bg-[#492C01] text-[#4a3f36] dark:text-[#f4ebc3]',
    borderColor: 'border-amber-200/40 dark:border-[#d6a738]/30'

  };
};

interface RegistroAlabanzasProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RegistroAlabanzas({ isOpen, onClose }: RegistroAlabanzasProps) {
  const [alabanzas, setAlabanzas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'Alabanza',
    tonalidad: '',
    bpm: '',
    compas: '4/4',
    observaciones: ''
  });

  const cargarAlabanzas = async () => {
    setLoading(true);
    try {
      const data = await obtenerBancoAlabanzas();
      setAlabanzas(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) cargarAlabanzas();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return;

    try {
      Swal.fire({
        title: 'Guardando...',
        target: '#modal-registro-alabanzas',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const payload = {
        ...formData,
        bpm: formData.bpm ? parseInt(formData.bpm) : undefined
      };

      if (editingId) {
        await actualizarAlabanza(editingId, payload);
      } else {
        await crearAlabanza(payload);
      }

      Swal.fire({
        icon: 'success',
        title: editingId ? '¡Actualizada!' : '¡Guardada!',
        text: editingId ? 'La alabanza ha sido modificada correctamente.' : 'La alabanza ha sido integrada al catálogo.',
        confirmButtonColor: '#d6a738',
        target: '#modal-registro-alabanzas'
      });

      setFormData({
        nombre: '',
        tipo: 'Alabanza',
        tonalidad: '',
        bpm: '',
        compas: '4/4',
        observaciones: ''
      });
      setIsAdding(false);
      setEditingId(null);
      cargarAlabanzas();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al procesar la solicitud: ' + err.message,
        target: '#modal-registro-alabanzas'
      });
      console.error(err);
    }
  };

  const handleEdit = (alabanza: any) => {
    setFormData({
      nombre: alabanza.nombre,
      tipo: alabanza.tipo,
      tonalidad: alabanza.tonalidad || '',
      bpm: alabanza.bpm?.toString() || '',
      compas: alabanza.compas || '4/4',
      observaciones: alabanza.observaciones || ''
    });
    setEditingId(alabanza.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string, nombre: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar Alabanza?',
      text: `¿Estás seguro de eliminar "${nombre}" del catálogo?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#847563',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      target: '#modal-registro-alabanzas'
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Eliminando...',
          target: '#modal-registro-alabanzas',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });
        await eliminarAlabanza(id);
        Swal.fire({
          icon: 'success',
          title: 'Eliminada',
          confirmButtonColor: '#d6a738',
          target: '#modal-registro-alabanzas'
        });
        cargarAlabanzas();
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: err.message,
          target: '#modal-registro-alabanzas'
        });
      }
    }
  };

  const alabanzasFiltradas = useMemo(() => {
    return alabanzas.filter(a => {
      const matchSearch = a.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const matchTipo = !filtroTipo || a.tipo.toLowerCase() === filtroTipo.toLowerCase();
      return matchSearch && matchTipo;
    });
  }, [alabanzas, busqueda, filtroTipo]);

  const handleCancelAndClear = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      nombre: '',
      tipo: 'Alabanza',
      tonalidad: '',
      bpm: '',
      compas: '4/4',
      observaciones: ''
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay className="backdrop-blur-md bg-black/60 z-[100]" />
        <DialogPrimitive.Content
          id="modal-registro-alabanzas"
          className={cn(
            "fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]",
            "z-[101] w-full sm:max-w-[99vw] h-[90vh] sm:h-[99vh] flex flex-col p-0 gap-0 overflow-hidden",
            "bg-white dark:bg-[#0a0a0b] border border-[#d6a738]/30 dark:border-[#d6a738]/40 rounded-[2.5rem]",
            "shadow-[0_0_50px_rgba(214,167,56,0.15)] outline-none duration-500 transition-all",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
          )}
        >

          <DialogHeader className="px-6 sm:px-8 py-5 sm:py-6 border-b border-[#e5ddd3] dark:border-neutral-800 shrink-0 bg-[#fdfcf5] dark:bg-[#0a0a0b] flex flex-col gap-4">
            {/* Fila Superior: Icono, Título, [Botón Agregar en PC] y CERRAR */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3 sm:gap-4 flex-1">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-[#d6a738] to-[#c08e2a] text-white flex items-center justify-center shrink-0 shadow-lg shadow-[#d6a738]/20">
                  <Music size={22} className="sm:hidden" />
                  <Music size={26} className="hidden sm:block" />
                </div>
                <DialogTitle className="text-sm sm:text-base font-black text-[#4a3f36] dark:text-white tracking-tight leading-none whitespace-nowrap">
                  Banco de Alabanzas
                </DialogTitle>

                {/* Contador en PC al lado del título */}
                <div className="hidden sm:block ml-4 shrink-0">
                  <span className="text-[10px] font-bold text-[#d6a738] bg-[#d6a738]/10 px-2.5 py-1.5 rounded-full uppercase tracking-widest border border-[#d6a738]/20">
                    {alabanzas.length} REGISTROS
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Botón AGREGAR (Sólo visible en PC aquí) */}
                {!isAdding && (
                  <button
                    onClick={() => { setIsAdding(true); setEditingId(null); }}
                    className="hidden sm:flex bg-gradient-to-r from-[#d6a738] to-[#c08e2a] hover:from-[#c08e2a] hover:to-[#a07621] text-white px-5 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-[#d6a738]/20 active:scale-95 items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <Plus size={14} strokeWidth={3} />
                    Agregar Canto
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 text-[#d6a738] transition-all shrink-0"
                >
                  <X size={20} strokeWidth={3} />
                </button>
              </div>
            </div>

            {/* Fila Inferior (Móvil): Registros Totales y Botón AGREGAR */}
            <div className="flex sm:hidden flex-row items-center justify-between gap-3 w-full">
              <div className="shrink-0">
                <span className="text-[9px] font-bold text-[#d6a738] bg-[#d6a738]/10 px-2 py-1 rounded-full uppercase tracking-widest border border-[#d6a738]/20">
                  {alabanzas.length} TOTALES
                </span>
              </div>

              <div className="flex-1 flex justify-end items-center gap-3">
                {!isAdding && (
                  <button
                    onClick={() => { setIsAdding(true); setEditingId(null); }}
                    className="bg-gradient-to-r from-[#d6a738] to-[#c08e2a] hover:from-[#c08e2a] hover:to-[#a07621] text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-lg shadow-[#d6a738]/20 active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Plus size={13} strokeWidth={3} />
                    Agregar Canto
                  </button>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-[#0a0a0b]">
            {isAdding ? (
              <div className="flex-1 overflow-y-auto px-6 py-10 custom-scrollbar">
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-center gap-4 mb-10">
                    <button
                      onClick={handleCancelAndClear}
                      className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-neutral-800 text-gray-500 hover:text-[#d6a738] transition-all active:scale-95 shrink-0"
                      title="Volver al catálogo"
                    >
                      <ArrowLeft size={20} strokeWidth={3} />
                    </button>
                    <h3 className="text-base font-black text-[#4a3f36] dark:text-white uppercase tracking-tight">
                      {editingId ? 'Editar Alabanza' : 'Registro de Nueva Alabanza'}
                    </h3>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-3 md:col-span-2">
                        <label className="text-[11px] font-black text-[#847563] uppercase tracking-widest ml-1 flex items-center gap-2">
                          <Hash size={14} className="text-[#d6a738]" /> Nombre oficial de la canción
                        </label>
                        <input
                          required
                          value={formData.nombre}
                          onChange={e => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                          placeholder="Ej: Solo en Jesús"
                          className="w-full bg-white dark:bg-neutral-900 border-2 border-transparent focus:border-[#d6a738]/30 rounded-[1.25rem] px-6 py-3.5 text-base outline-none placeholder:text-gray-400 transition-all font-bold shadow-sm text-[#4a3f36] dark:text-[#f4ebc3]"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-[#847563] uppercase tracking-widest ml-1 flex items-center gap-2">
                          <Filter size={14} className="text-[#d6a738]" /> Tipo / Categoría
                        </label>
                        <div className="relative group">
                          <select
                            value={formData.tipo}
                            onChange={e => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                            className="w-full bg-white dark:bg-neutral-900 border-2 border-transparent focus:border-[#d6a738]/30 rounded-[1.25rem] px-6 py-3.5 text-sm outline-none cursor-pointer appearance-none font-bold shadow-sm text-[#4a3f36] dark:text-[#f4ebc3]"
                          >
                            {TIPOS_ALABANZA.map(t => <option key={t} value={t} className="bg-white dark:bg-neutral-900">{t}</option>)}
                          </select>
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <Plus size={16} className="rotate-45" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-[#847563] uppercase tracking-widest ml-1 flex items-center gap-2">
                          <Music2 size={14} className="text-[#d6a738]" /> Tonalidad Original
                        </label>
                        <input
                          value={formData.tonalidad}
                          onChange={e => setFormData(prev => ({ ...prev, tonalidad: e.target.value }))}
                          placeholder="Ej: D"
                          className="w-full bg-white dark:bg-neutral-900 border-2 border-transparent focus:border-[#d6a738]/30 rounded-[1.25rem] px-6 py-3.5 text-sm outline-none font-bold placeholder:text-gray-400 shadow-sm text-[#4a3f36] dark:text-[#f4ebc3]"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-[#847563] uppercase tracking-widest ml-1 flex items-center gap-2">
                          <Timer size={14} className="text-[#d6a738]" /> BPM (Velocidad)
                        </label>
                        <input
                          type="number"
                          value={formData.bpm}
                          onChange={e => setFormData(prev => ({ ...prev, bpm: e.target.value }))}
                          placeholder="100"
                          className="w-full bg-white dark:bg-neutral-900 border-2 border-transparent focus:border-[#d6a738]/30 rounded-[1.25rem] px-6 py-3.5 text-sm outline-none font-bold placeholder:text-gray-400 shadow-sm text-[#4a3f36] dark:text-[#f4ebc3]"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-[#847563] uppercase tracking-widest ml-1 flex items-center gap-2">
                          <Layers size={14} className="text-[#d6a738]" /> Tiempo / Compás
                        </label>
                        <input
                          value={formData.compas}
                          onChange={e => setFormData(prev => ({ ...prev, compas: e.target.value }))}
                          placeholder="4/4"
                          className="w-full bg-white dark:bg-neutral-900 border-2 border-transparent focus:border-[#d6a738]/30 rounded-[1.25rem] px-6 py-4 text-sm outline-none font-bold placeholder:text-gray-400 shadow-sm text-[#4a3f36] dark:text-[#f4ebc3]"
                        />
                      </div>

                      <div className="space-y-3 md:col-span-2">
                        <label className="text-[11px] font-black text-[#847563] uppercase tracking-widest ml-1 flex items-center gap-2">
                          <Info size={14} className="text-[#d6a738]" /> Detalles u Observaciones
                        </label>
                        <textarea
                          rows={2}
                          value={formData.observaciones}
                          onChange={e => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                          placeholder="Notas relativas a la estructura o arreglos..."
                          className="w-full bg-white dark:bg-neutral-900 border-2 border-transparent focus:border-[#d6a738]/30 rounded-[1.25rem] px-6 py-3.5 text-sm outline-none font-bold placeholder:text-gray-400 resize-none shadow-sm text-[#4a3f36] dark:text-[#f4ebc3]"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-[#d6a738] to-[#c08e2a] hover:from-[#c08e2a] hover:to-[#a67a24] text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-[#d6a738]/30 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                      >
                        <Save size={18} /> {editingId ? 'Actualizar' : 'Guardar'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <>
                <div className="px-6 sm:px-8 py-4 flex flex-col sm:flex-row gap-3 border-b border-[#e5ddd3] dark:border-neutral-800 bg-[#f4efe8] dark:bg-[#0a0a0b]/50">
                  <div className="relative flex-1 group">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#d6a738] transition-colors" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre de alabanza..."
                      value={busqueda}
                      onChange={e => setBusqueda(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-[#fdfcf5] dark:bg-neutral-900/50 border border-[#e5ddd3] dark:border-neutral-800 focus:border-[#d6a738]/50 rounded-xl text-xs font-bold shadow-sm outline-none focus:ring-4 focus:ring-[#d6a738]/10 text-[#4a3f36] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all"
                    />
                  </div>
                  <div className="relative min-w-full sm:min-w-[240px]">
                    <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <select
                      value={filtroTipo}
                      onChange={e => setFiltroTipo(e.target.value)}
                      className="w-full pl-11 pr-8 py-3 bg-[#fdfcf5] dark:bg-neutral-900/50 border border-[#e5ddd3] dark:border-neutral-800 focus:border-[#d6a738]/50 rounded-xl text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer appearance-none focus:ring-4 focus:ring-[#d6a738]/10 text-[#4a3f36] dark:text-white transition-all"
                    >
                      <option value="" className="bg-[#fdfcf5] dark:bg-neutral-900 text-[#4a3f36] dark:text-white">TODAS</option>
                      {TIPOS_ALABANZA.map(t => <option key={t} value={t} className="bg-[#fdfcf5] dark:bg-neutral-900 text-[#4a3f36] dark:text-white">{t.toUpperCase()}</option>)}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-8 pb-10 custom-scrollbar">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                      <div className="h-12 w-12 border-4 border-[#d6a738]/20 border-t-[#d6a738] rounded-full animate-spin" />
                      <p className="text-xs font-black text-[#847563] uppercase tracking-widest animate-pulse">Cargando catálogo...</p>
                    </div>
                  ) : alabanzasFiltradas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-6">
                        <Music2 size={36} className="text-gray-300" />
                      </div>
                      <p className="font-black text-[#847563] text-sm uppercase tracking-widest">Sin resultados encontrados</p>
                      <button onClick={() => setIsAdding(true)} className="mt-4 text-[#d6a738] text-xs font-black uppercase tracking-widest hover:underline flex items-center gap-2">
                        Agregar Nueva Alabanza <ArrowRight size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-5 pb-10">
                      {alabanzasFiltradas.map(a => {
                        const config = getTipoConfig(a.tipo);
                        return (
                          <div key={a.id} className="group bg-white dark:bg-neutral-900/40 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-[#d6a738]/50 transition-all shadow-sm hover:shadow-lg hover:shadow-[#d6a738]/5 hover:-translate-y-1 duration-300 overflow-hidden flex flex-col text-center relative">
                            {/* Tipo y Acciones (Encabezado superior integrado) */}
                            <div className={`${config.bgColor} border-b border-neutral-200/50 dark:border-neutral-800/50 px-3 py-2 flex items-center justify-between`}>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEdit(a); }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/20 dark:hover:bg-white/10 text-gray-500 hover:text-amber-500 transition-all"
                                title="Editar"
                              >
                                <Edit3 size={15} />
                              </button>

                              <span className="font-black text-[10px] uppercase tracking-[0.25em] flex-1">
                                {a.tipo}
                              </span>

                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(a.id, a.nombre); }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/20 dark:hover:bg-white/10 text-gray-500 hover:text-red-500 transition-all"
                                title="Eliminar"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>

                            {/* Cuerpo Principal */}
                            <div className="flex-1 flex flex-col items-center gap-3 p-5">
                              <h4 className="text-base font-bold text-[#4a3f36] dark:text-white leading-snug group-hover:text-[#d6a738] transition-colors uppercase tracking-tight min-h-[2.5rem] line-clamp-2 w-full">
                                {a.nombre}
                              </h4>

                              {a.observaciones && (
                                <p className="text-[10px] font-medium text-gray-500 leading-tight line-clamp-2 uppercase italic border-x border-neutral-800 px-4 mt-1">
                                  {a.observaciones}
                                </p>
                              )}
                            </div>
                            {/* Datos Técnicos (Inferior) */}
                            <div className="bg-[#fdfcf5] dark:bg-black/20 border-t border-[#e5ddd3] dark:border-neutral-800 grid grid-cols-3 divide-x divide-[#e5ddd3] dark:divide-neutral-800/50">
                              <div className="flex flex-col items-center py-3 px-2">
                                <span className="text-[8px] font-black text-gray-600 uppercase tracking-tighter mb-0.5">BPM</span>
                                <span className="text-[12px] font-black text-[#847563] dark:text-gray-400 leading-none">{a.bpm || '--'}</span>
                              </div>

                              <div className="flex flex-col items-center py-3 px-2">
                                <span className="text-[8px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-tighter mb-0.5">TONO</span>
                                <span className="text-[12px] font-black text-[#d6a738] leading-none truncate w-full text-center px-1 uppercase tracking-tighter">{a.tonalidad || '--'}</span>
                              </div>
                              <div className="flex flex-col items-center py-3 px-2">
                                <span className="text-[8px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-tighter mb-0.5">COMPÁS</span>
                                <span className="text-[12px] font-black text-[#847563] dark:text-gray-400 leading-none">{a.compas || '4/4'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <style dangerouslySetInnerHTML={{
            __html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 5px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.05);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #2a2624;
            border-radius: 10px;
            transition: all 0.3s ease;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #d6a738;
          }
          /* Corregir z-index de SweetAlert2 para que esté sobre el modal */
          .swal2-container {
            z-index: 10000 !important;
          }
        `}} />

        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
