import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  ExternalLink, 
  RefreshCw, 
  Database, 
  X, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles,
  Lock,
  Layers,
  ArrowRight,
  Check
} from 'lucide-react';
import { User } from 'firebase/auth';
import { googleSignIn, getAccessToken } from '../services/auth';
import { 
  obterOuVincularPlanilhaOficial,
  popularDadosIniciaisNaPlanilha,
  PlanilhaMetadados, 
  NOME_PLANILHA_OFICIAL,
  NOMES_ABAS
} from '../services/googleSheets';
import { Chamado, Equipamento, Funcionario, Movimentacao } from '../types';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userGoogle: User | null;
  setUserGoogle: (u: User | null) => void;
  planilhaAtiva: PlanilhaMetadados | null;
  setPlanilhaAtiva: (p: PlanilhaMetadados | null) => void;
  onSincronizarDados: () => Promise<void>;
  chamados: Chamado[];
  equipamentos: Equipamento[];
  funcionarios: Funcionario[];
  movimentacoes: Movimentacao[];
  isSincronizando: boolean;
  ultimaSincronizacao: Date | null;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  userGoogle,
  setUserGoogle,
  planilhaAtiva,
  setPlanilhaAtiva,
  onSincronizarDados,
  chamados,
  equipamentos,
  funcionarios,
  movimentacoes,
  isSincronizando,
  ultimaSincronizacao
}) => {
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingAcao, setLoadingAcao] = useState(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);

  const handleLoginGoogle = async () => {
    try {
      setLoadingLogin(true);
      setMensagemErro(null);
      const result = await googleSignIn();
      if (result) {
        setUserGoogle(result.user);
        setSucessoMsg(`Conectado como ${result.user.email}! Vinculando ao banco de dados oficial...`);
        const meta = await obterOuVincularPlanilhaOficial(result.accessToken);
        setPlanilhaAtiva(meta);
        await onSincronizarDados();
      }
    } catch (err: any) {
      if (
        err?.code !== 'auth/popup-closed-by-user' && 
        err?.code !== 'auth/cancelled-popup-request'
      ) {
        setMensagemErro(err?.message || 'Falha ao autenticar com o Google.');
      }
    } finally {
      setLoadingLogin(false);
    }
  };

  // Popula os dados de demonstração na planilha oficial caso esteja vazia
  const handleSemearDadosIniciais = async () => {
    if (!planilhaAtiva) return;
    try {
      setLoadingAcao(true);
      setMensagemErro(null);
      const token = await getAccessToken();
      if (!token) throw new Error('Token expirado. Faça login novamente.');

      await popularDadosIniciaisNaPlanilha(
        planilhaAtiva.id,
        token,
        chamados,
        equipamentos,
        funcionarios,
        movimentacoes
      );
      await onSincronizarDados();
      setSucessoMsg('Dados estruturados gravados na planilha oficial com sucesso!');
    } catch (err: any) {
      setMensagemErro(err?.message || 'Erro ao semear dados na planilha.');
    } finally {
      setLoadingAcao(false);
    }
  };

  // Força re-verificação da estrutura oficial
  const handleReverificarEstrutura = async () => {
    try {
      setLoadingAcao(true);
      setMensagemErro(null);
      const token = await getAccessToken();
      if (!token) throw new Error('Faça login com sua conta Google.');
      const meta = await obterOuVincularPlanilhaOficial(token, true);
      setPlanilhaAtiva(meta);
      await onSincronizarDados();
      setSucessoMsg('Estrutura oficial verificada e sincronizada com sucesso!');
    } catch (err: any) {
      setMensagemErro(err?.message || 'Erro ao verificar planilha oficial.');
    } finally {
      setLoadingAcao(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
                  Banco de Dados Oficial
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Exclusiva e Bloqueada</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Aplicação permanentemente vinculada à planilha <strong>{NOME_PLANILHA_OFICIAL}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificações no Modal */}
        {mensagemErro && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span className="flex-1">{mensagemErro}</span>
            <button onClick={() => setMensagemErro(null)} className="text-red-400 hover:text-red-600">×</button>
          </div>
        )}

        {sucessoMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="flex-1">{sucessoMsg}</span>
            <button onClick={() => setSucessoMsg(null)} className="text-emerald-400 hover:text-emerald-600">×</button>
          </div>
        )}

        {/* Body com Scroll */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs text-slate-700 dark:text-slate-300">
          
          {/* Alerta de Conexão Exclusiva & Bloqueio de Outras Planilhas */}
          <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-emerald-950 dark:text-emerald-200 font-semibold block text-xs">
                Conexão Bloqueada à Planilha Oficial
              </strong>
              <p className="text-[11px] text-emerald-900/80 dark:text-emerald-300/80 leading-relaxed">
                Este sistema foi configurado para operar <strong>exclusivamente</strong> com a planilha <strong>{NOME_PLANILHA_OFICIAL}</strong>. A possibilidade de conectar a qualquer outra planilha foi desabilitada para garantir a integridade dos dados, prevenir duplicidades e assegurar que todos os chamados e movimentações de patrimônio fiquem centralizados em um único banco de dados oficial.
              </p>
            </div>
          </div>

          {/* Status da Conta Google Conectada */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                Conta Google Autorizada
              </span>
              {userGoogle ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Autenticado
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  Pendente Login
                </span>
              )}
            </div>

            {userGoogle ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  {userGoogle.photoURL ? (
                    <img 
                      src={userGoogle.photoURL} 
                      alt={userGoogle.displayName || 'Avatar'} 
                      className="w-8 h-8 rounded-full border border-emerald-500/30"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      {userGoogle.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                      {userGoogle.displayName || 'Usuário Google'}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {userGoogle.email}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Acesso Total ao Sheets
                </span>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <p className="text-slate-600 dark:text-slate-400 text-xs">
                  Faça login com sua conta Google para sincronizar automaticamente com a planilha oficial.
                </p>
                <button
                  onClick={handleLoginGoogle}
                  disabled={loadingLogin}
                  className="inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs shadow-sm transition disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>{loadingLogin ? 'Autenticando...' : 'Conectar com Conta Google'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Detalhes da Planilha Oficial Fixa */}
          {planilhaAtiva && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {planilhaAtiva.nome}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Fixa
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block select-all">
                      ID: {planilhaAtiva.id}
                    </span>
                  </div>
                </div>

                <a
                  href={planilhaAtiva.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 font-semibold text-xs flex items-center gap-1.5 transition shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir no Google Sheets</span>
                </a>
              </div>

              {/* Status das 4 Abas Oficiais */}
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                  Abas Estruturadas & Dados Registrados
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 font-medium truncate">{NOMES_ABAS.CHAMADOS}</div>
                    <div className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                      {chamados.length} <span className="text-[10px] font-normal text-slate-500">tickets</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 font-medium truncate">{NOMES_ABAS.EQUIPAMENTOS}</div>
                    <div className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                      {equipamentos.length} <span className="text-[10px] font-normal text-slate-500">itens</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 font-medium truncate">{NOMES_ABAS.FUNCIONARIOS}</div>
                    <div className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                      {funcionarios.length} <span className="text-[10px] font-normal text-slate-500">colabs</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 font-medium truncate">{NOMES_ABAS.MOVIMENTACOES}</div>
                    <div className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                      {movimentacoes.length} <span className="text-[10px] font-normal text-slate-500">logs</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Barra de Ações & Sincronização */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {ultimaSincronizacao ? (
                    <span>Última sincronização: <strong>{ultimaSincronizacao.toLocaleTimeString('pt-BR')}</strong> (Auto-sync 15s)</span>
                  ) : (
                    <span>Sincronização em tempo real ativa</span>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleReverificarEstrutura}
                    disabled={loadingAcao || isSincronizando}
                    className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition"
                    title="Verifica se todas as abas e cabeçalhos oficiais estão intactos na planilha"
                  >
                    <span>Validar Abas</span>
                  </button>

                  <button
                    onClick={handleSemearDadosIniciais}
                    disabled={loadingAcao || isSincronizando}
                    className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition"
                    title="Popula a planilha com os dados padrão caso ela tenha sido recém-criada"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 inline mr-1" />
                    <span>Popular Iniciais</span>
                  </button>

                  <button
                    onClick={onSincronizarDados}
                    disabled={loadingAcao || isSincronizando}
                    className="flex-1 sm:flex-initial px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSincronizando ? 'animate-spin' : ''}`} />
                    <span>{isSincronizando ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span>Banco de dados exclusivo DeskOps TI · Sem troca de planilha</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-medium text-xs transition"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
