"use client";

import { useState, useEffect } from "react";
import { X, ShieldCheck } from "lucide-react";
import { useCreatePuesto, useUpdatePuesto } from "./lib/hooks";
import Swal from "sweetalert2";
import { Puesto } from "../departamento/lib/schemas";

interface ModalPuestoProps {
  isOpen: boolean;
  onClose: () => void;
  departamentoId: string;
  departamentoNombre: string;
  puestoToEdit?: Puesto | null;
}

export default function ModalPuesto({ isOpen, onClose, departamentoId, departamentoNombre, puestoToEdit }: ModalPuestoProps) {
  const [nombre, setNombre] = useState("");
  const [esJefatura, setEsJefatura] = useState(false);
  
  const { mutate: crear, isPending: creating } = useCreatePuesto();
  const { mutate: actualizar, isPending: updating } = useUpdatePuesto();

  useEffect(() => {
    if (isOpen) {
      if (puestoToEdit) {
        setNombre(puestoToEdit.nombre);
        setEsJefatura(puestoToEdit.es_jefatura);
      } else {
        setNombre("");
        setEsJefatura(false);
      }
    }
  }, [isOpen, puestoToEdit]);

  const handleSave = () => {
    const isDark = document.documentElement.classList.contains('dark');
    const callbacks = {
      onSuccess: () => {
        Swal.fire({ 
          icon: 'success', 
          title: puestoToEdit ? 'Puesto Actualizado' : 'Puesto Creado', 
          toast: true, 
          position: 'top-end', 
          showConfirmButton: false, 
          timer: 3000, 
          timerProgressBar: true,
          background: isDark ? '#18181b' : '#fff',
          color: isDark ? '#fff' : '#000',
        });
        onClose();
      },
      onError: (err: any) => {
        Swal.fire({ 
          icon: 'error', 
          title: 'Error', 
          text: err.message,
          background: isDark ? '#18181b' : '#fff',
          color: isDark ? '#fff' : '#000',
        });
      }
    };

    if (puestoToEdit) {
      actualizar({ 
        id: puestoToEdit.id, 
        values: { nombre, departamento_id: departamentoId, es_jefatura: esJefatura } 
      }, callbacks);
    } else {
      crear({ 
        nombre, 
        departamento_id: departamentoId, 
        es_jefatura: esJefatura 
      }, callbacks);
    }
  };

  if (!isOpen) return null;
  const isLoading = creating || updating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/50">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              {puestoToEdit ? "Editar Puesto" : "Asignar Nuevo Puesto"}
            </h3>
            <p className="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">{departamentoNombre}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 bg-white dark:bg-zinc-900">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Nombre del Puesto</label>
            <input 
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white p-3 rounded-lg focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
              placeholder=""
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-lg">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className={esJefatura ? "text-purple-600 dark:text-purple-400" : "text-zinc-400 dark:text-zinc-600"} />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">¿Es Lider?</span>
            </div>
            <input 
              type="checkbox" 
              checked={esJefatura}
              onChange={(e) => setEsJefatura(e.target.checked)}
              className="w-5 h-5 accent-purple-600 cursor-pointer rounded"
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
          <button 
            onClick={handleSave} 
            disabled={isLoading || !nombre}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 transition-all shadow-md active:scale-95 shadow-purple-900/10 dark:shadow-purple-900/20"
          >
            {isLoading ? "Guardando..." : (puestoToEdit ? "Guardar Cambios" : "Crear Puesto")}
          </button>
        </div>
      </div>
    </div>
  );
}