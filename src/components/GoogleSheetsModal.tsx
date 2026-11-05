import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  ExternalLink, 
  RefreshCw, 
  Plus, 
  Search, 
  Database, 
  X, 
  AlertCircle, 
  ShieldCheck, 
  LogOut, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { User } from 'firebase/auth';
import { googleSignIn, logoutGoogle, getAccessToken } from '../services/auth';
import { 
  criarPlanilhaBancoDeDados, 
  obterEGarantirEstruturaPlanilha, 
  listarPlanilhasDoDrive, 
  popularDadosIniciaisNaPlanilha,
  PlanilhaMetadados, 
  ArquivoDrive,
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

  const [planilhasDrive, setPlanilhasDrive] = useState<ArquivoDrive[]>([]);
  const [carregandoDrive, setCarregandoDrive] = useState(false);
  const [inputUrlOuId, setInputUrlOuId] = useState('');
  const [buscaDrive, setBuscaDrive] = useState('');

  // Carrega lista de planilhas do Google Drive do usuário quando logado
  useEffect(() => {
    if (isOpen && userGoogle) {
      buscarPlanilhasDrive();
    }
  }, [isOpen, userGoogle]);

  const buscarPlanilhasDrive = async () => {
    try {
      setCarregandoDrive(true);
      setMensagemErro(null);
      const token = await getAccessToken();
      if (!token) return;
      const files = await listarPlanilhasDoDrive(token);
      setPlanilhasDrive(files);
    } catch (err: any) {
      console.error('Erro ao listar arquivos do Drive:', err);
    } finally {
      setCarregandoDrive(false);
    }
  };

  const handleLoginGoogle = async () => {
    try {
      setLoadingLogin(true);
      setMensagemErro(null);
      const result = await googleSignIn();
      if (result) {
        setUserGoogle(result.user);
        setSucessoMsg(`Conectado como ${result.user.email}!`);
        const files = await listarPlanilhasDoDrive(result.accessToken);
        setPlanilhasDrive(files);
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

  const handleLogout = async () => {
    try {
      await logoutGoogle();
      setUserGoogle(null);
      setPlanilhaAtiva(null);
      localStorage.removeItem('deskops_spreadsheet_id');
      setSucessoMsg('Desconectado do Google com sucesso.');
    } catch (err: any) {
      setMensagemErro('Erro ao desconectar.');
    }
  };

  // Cria uma nova planilha no Drive com as 4 abas estruturadas
  const handleCriarNovaPlanilha = async () => {
    try {
      setLoadingAcao(true);
      setMensagemErro(null);
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Sessão expirada. Faça login com o Google novamente.');
      }

      const nova = await criarPlanilhaBancoDeDados(token, 'DeskOps TI - Banco de Dados');
      setPlanilhaAtiva(nova);
      localStorage.setItem('deskops_spreadsheet_id', nova.id);

      // Popula dados iniciais para não ficar vazia
      await popularDadosIniciaisNaPlanilha(nova.id, token, chamados, equipamentos, funcionarios, movimentacoes);
      await onSincronizarDados();

      setSucessoMsg(`Planilha "${nova.nome}" criada e configurada com sucesso com as 4 abas!`);
      buscarPlanilhasDrive();
    } catch (err: any) {
      setMensagemErro(err?.message || 'Erro ao criar nova planilha no Google Sheets.');
    } finally {
      setLoadingAcao(false);
    }
  };

  // Conecta a uma planilha existente (selecionada do Drive ou digitada)
  const handleConectarPlanilha = async (idOuUrl: string) => {
    try {
      setLoadingAcao(true);
      setMensagemErro(null);
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Sessão expirada. Faça login com o Google novamente.');
      }

      let id = idOuUrl.trim();
      // Extrai ID de URLs como https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
      const match = id.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        id = match[1];
      }

      if (!id) {
        throw new Error('Informe um ID ou Link válido do Google Sheets.');
      }

      const meta = await obterEGarantirEstruturaPlanilha(id, token);
      setPlanilhaAtiva(meta);
      localStorage.setItem('deskops_spreadsheet_id', meta.id);
      await onSincronizarDados();

      setSucessoMsg(`Conectado à planilha "${meta.nome}"!`);
      setInputUrlOuId('');
    } catch (err: any) {
      setMensagemErro(err?.message || 'Erro ao conectar à planilha.');
    } finally {
      setLoadingAcao(false);
    }
  };

  // Semear dados iniciais na planilha conectada
  const handleSemearDadosIniciais = async () => {
    if (!planilhaAtiva) return;
    const confirmou = window.confirm(
      'Deseja exportar todos os registros de demonstração atuais para a sua planilha do Google Sheets? Isso adicionará linhas às abas Chamados, Equipamentos, Funcionários e Movimentações.'
    );
    if (!confirmou) return;

    try {
      setLoadingAcao(true);
      setMensagemErro(null);
      const token = await getAccessToken();
      if (!token) throw new Error('Token expirado.');

      await popularDadosIniciaisNaPlanilha(
        planilhaAtiva.id,
        token,
        chamados,
        equipamentos,
        funcionarios,
        movimentacoes
      );
      await onSincronizarDados();
      setSucessoMsg('Dados iniciais semeados na planilha com sucesso!');
    } catch (err: any) {
      setMensagemErro(err?.message || 'Erro ao semear dados na planilha.');
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
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Conexão com Google Sheets
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Banco de Dados Principal
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sincronização em tempo real de chamados, inventário e funcionários diretamente na sua planilha
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
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
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-700 dark:text-slate-300">
          
          {/* Passo 1: Autenticação Google */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[11px]">
                  1
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                  Conta Google Conectada
                </span>
              </div>
              {userGoogle ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-[11px] text-red-500 hover:text-red-600 font-medium transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Desconectar Conta</span>
                </button>
              ) : null}
            </div>

            {userGoogle ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                <div className="flex items-center gap-3">
                  {userGoogle.photoURL ? (
                    <img 
                      src={userGoogle.photoURL} 
                      alt={userGoogle.displayName || 'Avatar'} 
                      className="w-9 h-9 rounded-full border border-emerald-500/30"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      {userGoogle.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {userGoogle.displayName || 'Usuário Google'}
                      </span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {userGoogle.email}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Autorizado
                </span>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <p className="text-slate-600 dark:text-slate-400 text-xs">
                  Faça login com sua conta Google para conceder permissão de leitura e gravação no Google Sheets e Drive.
                </p>

                {/* Botão Oficial Sign in with Google */}
                <button
                  onClick={handleLoginGoogle}
                  disabled={loadingLogin}
                  className="inline-flex items-center justify-center gap-3 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs shadow-sm hover:shadow transition disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>{loadingLogin ? 'Conectando ao Google...' : 'Fazer Login com Google'}</span>
                </button>

                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  💡 Caso a janela de login não apareça ou seja fechada, verifique se o navegador não está bloqueando janelas pop-up para este site.
                </p>
              </div>
            )}
          </div>

          {/* Passo 2: Seleção ou Criação de Planilha */}
          {userGoogle && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[11px]">
                    2
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                    Planilha do Banco de Dados
                  </span>
                </div>
                {planilhaAtiva && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Conectada
                  </span>
                )}
              </div>

              {/* Informações da Planilha Ativa */}
              {planilhaAtiva ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-600/10 text-emerald-600 flex items-center justify-center shrink-0">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {planilhaAtiva.nome}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          ID: {planilhaAtiva.id}
                        </div>
                      </div>
                    </div>
                    <a
                      href={planilhaAtiva.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-medium text-[11px] transition shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir no Google Sheets</span>
                    </a>
                  </div>

                  {/* Resumo das 4 Abas Estruturadas */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500">{NOMES_ABAS.CHAMADOS}</div>
                      <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{chamados.length} linhas</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500">{NOMES_ABAS.EQUIPAMENTOS}</div>
                      <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{equipamentos.length} itens</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500">{NOMES_ABAS.FUNCIONARIOS}</div>
                      <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{funcionarios.length} pessoas</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500">{NOMES_ABAS.MOVIMENTACOES}</div>
                      <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{movimentacoes.length} logs</div>
                    </div>
                  </div>

                  {/* Ações de Sincronização */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    <div className="text-[11px] text-slate-500">
                      {ultimaSincronizacao ? (
                        <span>Última sincronização: <strong>{ultimaSincronizacao.toLocaleTimeString('pt-BR')}</strong></span>
                      ) : (
                        <span>Pronto para sincronizar</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSemearDadosIniciais}
                        disabled={loadingAcao || isSincronizando}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1.5 transition"
                        title="Exporta todos os dados de exemplo atuais para preencher a planilha"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Semear Dados Demo</span>
                      </button>
                      <button
                        onClick={onSincronizarDados}
                        disabled={loadingAcao || isSincronizando}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] flex items-center gap-1.5 shadow-sm transition"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSincronizando ? 'animate-spin' : ''}`} />
                        <span>{isSincronizando ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Botão de Criação Rápida */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-blue-900 dark:text-blue-200 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Configuração Automática em 1 Clique</span>
                  </div>
                  <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 mt-0.5">
                    Cria uma nova planilha estruturada no seu Google Drive com as 4 abas exatas e cabeçalhos formatados.
                  </p>
                </div>
                <button
                  onClick={handleCriarNovaPlanilha}
                  disabled={loadingAcao}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 transition shrink-0 disabled:opacity-50"
                >
                  {loadingAcao ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Criando...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Criar Nova Planilha</span>
                    </>
                  )}
                </button>
              </div>

              {/* Conectar via Link ou ID */}
              <div className="space-y-2 pt-2">
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300">
                  Ou conecte usando o Link ou ID de uma planilha já existente:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputUrlOuId}
                    onChange={(e) => setInputUrlOuId(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/... ou ID"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    onClick={() => handleConectarPlanilha(inputUrlOuId)}
                    disabled={loadingAcao || !inputUrlOuId.trim()}
                    className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-medium text-xs transition disabled:opacity-50"
                  >
                    Conectar
                  </button>
                </div>
              </div>

              {/* Lista de Planilhas Recentes do Google Drive */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                    Planilhas Recentes no seu Google Drive:
                  </span>
                  <button
                    onClick={buscarPlanilhasDrive}
                    className="text-blue-600 dark:text-blue-400 text-[10px] hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${carregandoDrive ? 'animate-spin' : ''}`} />
                    <span>Atualizar lista</span>
                  </button>
                </div>

                {carregandoDrive ? (
                  <div className="p-4 text-center text-slate-400 text-xs">
                    Buscando planilhas no Google Drive...
                  </div>
                ) : planilhasDrive.length > 0 ? (
                  <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-950/40">
                    {planilhasDrive.map((arq) => (
                      <div
                        key={arq.id}
                        className={`flex items-center justify-between p-2 rounded-lg transition text-xs ${
                          planilhaAtiva?.id === arq.id
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800'
                            : 'hover:bg-white dark:hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate max-w-[360px]">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                            {arq.name}
                          </span>
                        </div>
                        {planilhaAtiva?.id === arq.id ? (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            Ativa
                          </span>
                        ) : (
                          <button
                            onClick={() => handleConectarPlanilha(arq.id)}
                            disabled={loadingAcao}
                            className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-[10px] transition"
                          >
                            Selecionar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    Nenhuma planilha encontrada. Clique no botão "Criar Nova Planilha" acima para começar imediatamente.
                  </p>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Comunicação direta cliente-Google via HTTPS e OAuth 2.0</span>
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
