'use client';

import { useMemo, useState } from 'react';
import {
    CalendarCheck, Users, TrendingUp, Clock, CheckCircle2,
    XCircle, AlertCircle, Calendar, ChevronDown, ChevronUp, Filter, CalendarDays
} from 'lucide-react';
import { useAsistencias, useVerificarAsistenciaHoy, useGestorEstudiantes } from '../lib/hooks';
import { AsistenciaFormItem, SesionAsistencia } from '../lib/zod';
import TomarAsistencia from './modals/TomarAsistencia';

interface Props {
    aulaId: string;
}

// ─── CONSTANTES ──────────────────────────────────────────────────────────────

const MESES = [
    { value: 'all', label: 'Todos los Meses' },
    { value: '0', label: 'Enero' },
    { value: '1', label: 'Febrero' },
    { value: '2', label: 'Marzo' },
    { value: '3', label: 'Abril' },
    { value: '4', label: 'Mayo' },
    { value: '5', label: 'Junio' },
    { value: '6', label: 'Julio' },
    { value: '7', label: 'Agosto' },
    { value: '8', label: 'Septiembre' },
    { value: '9', label: 'Octubre' },
    { value: '10', label: 'Noviembre' },
    { value: '11', label: 'Diciembre' },
];

const GENERAR_AÑOS = () => {
    const añoActual = new Date().getFullYear();
    const años = [{ value: 'all', label: 'Todos los Años' }];
    for (let i = 0; i < 5; i++) {
        const a = añoActual - i;
        años.push({ value: a.toString(), label: a.toString() });
    }
    return años;
};

const AÑOS = GENERAR_AÑOS();

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function formatearFechaCorta(fechaStr: string): string {
    // fechaStr es "YYYY-MM-DD"
    const [año, mes, dia] = fechaStr.split('-').map(Number);
    // Crear fecha local (mes es 0-indexado)
    return new Date(año, mes - 1, dia).toLocaleDateString('es-GT', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
}

/** Agrupa los registros planos por fecha aplicando filtros de mes y año */
function agruparYFiltrar(registros: any[], mes: string, año: string): SesionAsistencia[] {
    const mapa = new Map<string, SesionAsistencia>();

    const filtrados = registros.filter(r => {
        const fechaR = new Date(r.created_at);
        const coincideMes = mes === 'all' || fechaR.getMonth().toString() === mes;
        const coincideAño = año === 'all' || fechaR.getFullYear().toString() === año;
        return coincideMes && coincideAño;
    });

    for (const r of filtrados) {
        const d = new Date(r.created_at);
        const fecha = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!mapa.has(fecha)) {
            mapa.set(fecha, { fecha, registros: [], presentes: 0, ausentes: 0 });
        }
        const sesion = mapa.get(fecha)!;
        sesion.registros.push(r);
        if (r.asistio) sesion.presentes++;
        else sesion.ausentes++;
    }

    return Array.from(mapa.values()).sort((a, b) => b.fecha.localeCompare(a.fecha));
}

// ─── SUBCOMPONENTES ───────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: {
    icon: React.ElementType; label: string; value: string | number; color: string;
}) {
    return (
        <div className="bg-[#fafafa] dark:bg-[#111] border border-[#e5e5e5] dark:border-[#2a2420] hover:border-[#d5cec2] dark:hover:border-[#3e3630] rounded-2xl px-3 py-2 flex items-center gap-3 transition-all w-fit shadow-sm">
            <div className={`p-2 rounded-xl shrink-0 ${color}`}>
                <Icon size={15} />
            </div>
            <div className="flex items-center gap-2">
                <p className="text-[9px] font-black text-[#847563] uppercase tracking-widest leading-none whitespace-nowrap">{label}</p>
                <p className="text-sm font-black text-[#4a3f36] dark:text-[#f4ebc3] leading-none">{value}</p>
            </div>
        </div>
    );
}

function SesionRow({ sesion }: { sesion: SesionAsistencia }) {
    const [abierto, setAbierto] = useState(false);
    const porcentaje = sesion.registros.length
        ? Math.round((sesion.presentes / sesion.registros.length) * 100)
        : 0;

    return (
        <div className="bg-[#fafafa] dark:bg-[#111] border border-[#e5e5e5] dark:border-[#2a2420] hover:border-[#d5cec2] dark:hover:border-[#3e3630] rounded-xl overflow-hidden transition-all shadow-sm">
            <button
                onClick={() => setAbierto(!abierto)}
                className="w-full px-3.5 py-3 flex items-center gap-4 text-left group"
            >
                {/* Fecha */}
                <div className="p-2 bg-[#d6a738]/10 border border-[#d6a738]/20 rounded-xl shrink-0">
                    <Calendar size={16} className="text-[#d6a738]" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-[#4a3f36] dark:text-[#f4ebc3] uppercase tracking-tight capitalize truncate">
                        {formatearFechaCorta(sesion.fecha)}
                    </p>
                    <p className="text-[9px] font-bold text-[#847563] uppercase tracking-widest mt-0.5 leading-none">
                        {sesion.registros.length} alumnos registrados
                    </p>
                </div>

                {/* MINI STATS */}
                <div className="hidden sm:flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-1.5 line-height-1">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-500 dark:text-emerald-400">{sesion.presentes}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <XCircle size={12} className="text-red-500" />
                        <span className="text-[10px] font-black text-red-500 dark:text-red-400">{sesion.ausentes}</span>
                    </div>
                    {/* Barra de progreso */}
                    <div className="w-16 h-1.5 bg-[#e5e5e5] dark:bg-[#2a2420] rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${porcentaje >= 80 ? 'bg-emerald-500' : porcentaje >= 50 ? 'bg-[#d6a738]' : 'bg-red-500'}`}
                            style={{ width: `${porcentaje}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-black text-[#847563]">{porcentaje}%</span>
                </div>

                {abierto ? <ChevronUp size={16} className="text-[#847563] shrink-0" /> : <ChevronDown size={16} className="text-[#847563] shrink-0" />}
            </button>

            {/* DETALLE DE LA SESIÓN */}
            {abierto && (
                <div className="border-t border-[#e5e5e5] dark:border-[#2a2420] px-2 py-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 animate-in slide-in-from-top-1 duration-200">
                    {sesion.registros.map((r) => (
                        <div key={r.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
                            r.asistio
                                ? 'bg-emerald-500/5 border-emerald-500/20'
                                : 'bg-red-500/5 border-red-500/20'
                        }`}>
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 ${
                                r.asistio ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' : 'bg-red-500/10 text-red-500 dark:text-red-400'
                            }`}>
                                {(r.estudiante as any)?.nombre?.charAt(0).toUpperCase() ?? '?'}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-row items-center justify-between gap-2">
                                <p className="text-[10px] font-black text-[#4a3f36] dark:text-[#f4ebc3] truncate uppercase tracking-tight">
                                    {(r.estudiante as any)?.nombre ?? 'Desconocido'}
                                </p>
                            </div>
                            {r.asistio
                                ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                                : <XCircle size={14} className="text-red-500 shrink-0" />
                            }
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export default function GestorAsistencia({ aulaId }: Props) {
    const [modalAbierto, setModalAbierto] = useState(false);
    
    // Filtros por defecto: Mes actual y Año actual
    const [filtroMes, setFiltroMes] = useState<string>(new Date().getMonth().toString());
    const [filtroAño, setFiltroAño] = useState<string>(new Date().getFullYear().toString());

    const { data: asistencias = [], isLoading: loadingAsistencias } = useAsistencias(aulaId);
    const { data: yaSeTomoHoy, isLoading: loadingHoy } = useVerificarAsistenciaHoy(aulaId);
    const { data: inscritos = [], isLoading: loadingInscritos } = useGestorEstudiantes(aulaId);

    // Sesiones filtradas y agrupadas
    const sesiones = useMemo(() => agruparYFiltrar(asistencias as any[], filtroMes, filtroAño), [asistencias, filtroMes, filtroAño]);

    // Estadísticas basadas en los filtros actuales
    const statsActuales = useMemo(() => {
        let total = 0;
        let presentes = 0;
        sesiones.forEach(s => {
            total += s.registros.length;
            presentes += s.presentes;
        });
        const pct = total ? Math.round((presentes / total) * 100) : 0;
        return { totalSesiones: sesiones.length, pct };
    }, [sesiones]);

    // Preparar lista para el modal
    const listaParaModal: AsistenciaFormItem[] = useMemo(() => {
        const d = new Date();
        const hoyStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const sesionesTotales = agruparYFiltrar(asistencias as any[], 'all', 'all');
        const sesionHoy = sesionesTotales.find((s) => s.fecha === hoyStr);

        return (inscritos as any[]).map((i) => {
            const registroHoy = sesionHoy?.registros.find((r) => r.estudiante_id === i.estudiante_id);
            return {
                estudiante_id: i.estudiante_id,
                nombre: i.estudiante?.nombre ?? 'Sin nombre',
                genero: i.estudiante?.genero ?? '',
                asistio: registroHoy ? registroHoy.asistio : null as any,
            };
        });
    }, [inscritos, asistencias]);

    const isLoading = loadingAsistencias || loadingHoy || loadingInscritos;

    return (
        <>
            <div className="bg-white dark:bg-[#0a0a0a] rounded-[2.5rem] overflow-hidden flex flex-col min-h-[500px] border border-[#d5cec2] dark:border-[#3e3630] shadow-sm">

                {/* CABECERA CON FILTROS ESTILO PILA */}
                <div className="p-6 md:p-8 border-b border-[#d5cec2] dark:border-[#3e3630] flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#fafafa] dark:bg-transparent">
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-base font-black uppercase tracking-tight text-[#4a3f36] dark:text-[#f4ebc3] flex items-center justify-center md:justify-start gap-3">
                            <CalendarCheck className="text-[#d6a738]" />
                            Control de Asistencia
                        </h2>
                        <p className="text-[10px] text-[#847563] font-bold uppercase tracking-widest mt-1">
                            {isLoading ? 'Cargando Historial...' : `${statsActuales.totalSesiones} sesión${statsActuales.totalSesiones !== 1 ? 'es' : ''} en periodo`}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-center">
                        
                        {/* SELECTORES DUALES: MES Y AÑO */}
                        <div className="flex items-center justify-center gap-2 w-full md:w-auto">
                            {/* Mes */}
                            <div className="relative flex-1 sm:flex-none min-w-[120px]">
                                <select 
                                    value={filtroMes}
                                    onChange={(e) => setFiltroMes(e.target.value)}
                                    className="w-full px-4 py-3 bg-white dark:bg-[#161616] border border-[#d5cec2] dark:border-[#2a2420] text-[#4a3f36] dark:text-[#f4ebc3] rounded-full text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#d6a738]/40 appearance-none cursor-pointer transition-all text-center shadow-sm"
                                >
                                    {MESES.map(m => <option key={m.value} value={m.value} className="bg-white dark:bg-[#0a0a0a]">{m.label}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#d6a738] pointer-events-none" />
                            </div>

                            {/* Año */}
                            <div className="relative flex-1 sm:flex-none min-w-[100px]">
                                <select 
                                    value={filtroAño}
                                    onChange={(e) => setFiltroAño(e.target.value)}
                                    className="w-full px-4 py-3 bg-white dark:bg-[#161616] border border-[#d5cec2] dark:border-[#2a2420] text-[#4a3f36] dark:text-[#f4ebc3] rounded-full text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#d6a738]/40 appearance-none cursor-pointer transition-all text-center shadow-sm"
                                >
                                    {AÑOS.map(a => <option key={a.value} value={a.value} className="bg-white dark:bg-[#0a0a0a]">{a.label}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#d6a738] pointer-events-none" />
                            </div>
                        </div>

                        <button
                            onClick={() => setModalAbierto(true)}
                            disabled={listaParaModal.length === 0}
                            className="w-full sm:w-auto bg-[#d6a738] hover:bg-[#c08e2a] disabled:opacity-40 text-white px-7 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-[#d6a738]/20"
                        >
                            <CalendarDays size={16} />
                            Asistencia Hoy
                        </button>
                    </div>
                </div>

                {/* STATS DINÁMICOS */}
                {!isLoading && (
                    <div className="px-4 py-4 border-b border-[#d5cec2] dark:border-[#3e3630] flex flex-wrap justify-center gap-3">
                        <StatCard icon={CalendarCheck} label="Sesiones" value={statsActuales.totalSesiones} color="bg-[#d6a738]/10 text-[#d6a738]" />
                        <StatCard icon={TrendingUp} label="Rendimiento" value={`${statsActuales.pct}%`} color={statsActuales.pct >= 80 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'} />
                        <StatCard icon={Users} label="Total Alumnos" value={listaParaModal.length} color="bg-[#d6a738]/10 text-[#d6a738]" />
                    </div>
                )}

                {/* CONTENIDO */}
                <div className="flex-1 px-1 md:px-3 py-2">
                    {isLoading ? (
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-20 bg-[#fafafa] dark:bg-[#111] rounded-2xl border border-[#e5e5e5] dark:border-[#2a2420] animate-pulse" />
                            ))}
                        </div>
                    ) : sesiones.length > 0 ? (
                        <div className="space-y-2 animate-in fade-in duration-300">
                            {sesiones.map((s) => (
                                <SesionRow key={s.fecha} sesion={s} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 py-16">
                            <div className="p-6 bg-[#fafafa] dark:bg-[#161616] rounded-full mb-6 border border-[#e5e5e5] dark:border-[#2a2420]">
                                <CalendarDays size={48} className="text-[#d6a738]" />
                            </div>
                            <h3 className="text-base font-black uppercase tracking-widest text-[#4a3f36] dark:text-[#f4ebc3] mb-2">Sin registros</h3>
                            <p className="text-sm font-bold text-[#847563] max-w-sm">No hay pases de lista para este mes.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL */}
            {modalAbierto && (
                <TomarAsistencia
                    isOpen={modalAbierto}
                    onClose={() => setModalAbierto(false)}
                    aulaId={aulaId}
                    estudiantes={listaParaModal}
                />
            )}
        </>
    );
}
