import React from 'react';
import { FileSpreadsheet, RefreshCw, ExternalLink, Settings2, CloudCheck, CloudOff, AlertCircle } from 'lucide-react';
import { PlanilhaMetadados } from '../services/googleSheets';
import { User } from 'firebase/auth';

interface SheetsConnectionBannerProps {
  planilhaAtiva: PlanilhaMetadados | null;
  userGoogle: User | null;
  onOpenModal: () => void;
  onSincronizar: () => void;
  isSincronizando: boolean;
  ultimaSincronizacao: Date | null;
}

export const SheetsConnectionBanner: React.FC<SheetsConnectionBannerProps> = ({
  planilhaAtiva,
  userGoogle,
  onOpenModal,
  onSincronizar,
  isSincronizando,
  ultimaSincronizacao
}) => {
  if (planilhaAtiva) {
    return (
      <div className="bg-emerald-950/40 border-b border-emerald-800/40 text-emerald-200 px-4 sm:px-6 py-2 text-xs transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">Google Sheets Ativo:</span>
              <span className="text-emerald-300 font-medium truncate max-w-[200px] sm:max-w-xs">
                {planilhaAtiva.nome}
              </span>
              <span className="hidden md:inline text-emerald-500/80">|</span>
              <span className="hidden md:inline text-[11px] text-emerald-300/80">
                4 Abas DeskOps + Respostas ao formulário 1 (Auto-sync)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-[11px]">
            {ultimaSincronizacao && (
              <span className="text-emerald-400/80 hidden sm:inline">
                Sincronizado às {ultimaSincronizacao.toLocaleTimeString('pt-BR')}
              </span>
            )}

            <button
              onClick={onSincronizar}
              disabled={isSincronizando}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-800/60 hover:bg-emerald-700/80 text-white font-medium transition"
              title="Recarrega todos os dados mais recentes do Google Sheets"
            >
              <RefreshCw className={`w-3 h-3 ${isSincronizando ? 'animate-spin' : ''}`} />
              <span>{isSincronizando ? 'Sincronizando...' : 'Sincronizar'}</span>
            </button>

            <a
              href={planilhaAtiva.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-900/50 hover:bg-emerald-800/60 text-emerald-200 hover:text-white transition"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Abrir Planilha</span>
            </a>

            <button
              onClick={onOpenModal}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Gerenciar conexão ou trocar planilha"
            >
              <Settings2 className="w-3 h-3" />
              <span>Configurar</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/90 border-b border-slate-700/80 text-slate-300 px-4 sm:px-6 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Modo Local:</strong> Conecte sua planilha Google Sheets para usar como banco de dados na nuvem com gravação em tempo real.
          </span>
        </div>
        <button
          onClick={onOpenModal}
          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Conectar Google Sheets</span>
        </button>
      </div>
    </div>
  );
};
