import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DestructiveConfirmModalProps {
  isOpen: boolean;
  titulo: string;
  descricao: string;
  itemIdentificador?: string;
  impacto?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const DestructiveConfirmModal: React.FC<DestructiveConfirmModalProps> = ({
  isOpen,
  titulo,
  descricao,
  itemIdentificador,
  impacto,
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header com Alerta */}
        <div className="bg-red-50 dark:bg-red-950/40 border-b border-red-100 dark:border-red-900/40 p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-bold text-base text-red-900 dark:text-red-200">
              {titulo}
            </h3>
            <p className="text-xs text-red-700/80 dark:text-red-300/80 mt-1">
              Confirmação de Ação Crítica no Google Sheets
            </p>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-4 text-xs text-slate-600 dark:text-slate-300">
          <p>{descricao}</p>

          {itemIdentificador && (
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-800 dark:text-slate-200 break-all">
              {itemIdentificador}
            </div>
          )}

          {impacto && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-800 dark:text-amber-300 text-[11px] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{impacto}</span>
            </div>
          )}

          <p className="text-[11px] text-slate-500 italic">
            Esta operação atualizará e removerá a linha correspondente diretamente na planilha conectada.
          </p>
        </div>

        {/* Ações */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-red-600/20 transition disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processando...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirmar Exclusão</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
