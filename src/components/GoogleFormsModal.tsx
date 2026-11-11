import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  ExternalLink, 
  RefreshCw, 
  Plus, 
  Search, 
  X, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles, 
  Trash2, 
  Link, 
  ShieldAlert,
  ArrowRight,
  HelpCircle,
  Clock,
  Layers
} from 'lucide-react';
import { User } from 'firebase/auth';
import { getAccessToken, googleSignIn } from '../services/auth';
import { 
  GoogleFormCriado, 
  criarGoogleFormChamados, 
  verificarGoogleFormExistente, 
  listarFormulariosDoDrive,
  ArquivoFormDrive,
  extrairFormId,
  CAMPOS_FORMULARIO_PADRAO
} from '../services/googleForms';
import { SETORES_EMPRESA } from '../data/initialData';
import { Tecnico } from '../types';
import { PlanilhaMetadados } from '../services/googleSheets';

interface GoogleFormsModalProps {
  isOpen: boolean;
  onClose: () => void;
  formOficial: GoogleFormCriado | null;
  onSalvarFormOficial: (form: GoogleFormCriado | null) => void;
  tecnicoAtivo: Tecnico;
  userGoogle: User | null;
  planilhaAtiva: PlanilhaMetadados | null;
  onExibirNotificacao: (msg: string, tipo?: 'sucesso' | 'info') => void;
}

export const GoogleFormsModal: React.FC<GoogleFormsModalProps> = ({
  isOpen,
  onClose,
  formOficial,
  onSalvarFormOficial,
  tecnicoAtivo,
  userGoogle,
  planilhaAtiva,
  onExibirNotificacao
}) => {
  const isAdmin = tecnicoAtivo.papel === 'admin';

  const [loadingCriacao, setLoadingCriacao] = useState(false);
  const [loadingValidacao, setLoadingValidacao] = useState(false);
  const [carregandoDrive, setCarregandoDrive] = useState(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);

  const [inputUrlOuId, setInputUrlOuId] = useState('');
  const [formulariosDrive, setFormulariosDrive] = useState<ArquivoFormDrive[]>([]);
  const [termoBuscaDrive, setTermoBuscaDrive] = useState('');

  // Confirmação para recriação destrutiva
  const [confirmandoRecriacao, setConfirmandoRecriacao] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMensagemErro(null);
      setSucessoMsg(null);
      setConfirmandoRecriacao(false);
      if (userGoogle) {
        buscarFormulariosDrive();
      }
    }
  }, [isOpen, userGoogle]);

  if (!isOpen) return null;

  const buscarFormulariosDrive = async () => {
    try {
      setCarregandoDrive(true);
      const token = await getAccessToken();
      if (!token) return;
      const files = await listarFormulariosDoDrive(token);
      setFormulariosDrive(files);
    } catch (err) {
      console.error('Erro ao listar formulários do Drive:', err);
    } finally {
      setCarregandoDrive(false);
    }
  };

  // 1. Ação de Criar / Recriar o Formulário do zero via API
  const handleCriarOuRecriarForm = async () => {
    if (!isAdmin) {
      setMensagemErro('Apenas administradores autorizados têm permissão para criar ou recriar o formulário oficial.');
      return;
    }

    try {
      setLoadingCriacao(true);
      setMensagemErro(null);
      setSucessoMsg(null);

      let token = await getAccessToken();
      if (!token) {
        const loginRes = await googleSignIn();
        if (!loginRes) {
          setLoadingCriacao(false);
          return;
        }
        token = loginRes.accessToken;
      }

      // Criação do formulário com as 6 perguntas e 27 setores
      const novoForm = await criarGoogleFormChamados(
        token, 
        'DeskOps TI - Abertura de Chamado', 
        SETORES_EMPRESA
      );

      onSalvarFormOficial(novoForm);
      setSucessoMsg(`Google Form recriado com sucesso! Protocolo e campos configurados.`);
      onExibirNotificacao(`Google Form "${novoForm.titulo}" criado com sucesso!`);
      setConfirmandoRecriacao(false);

      // Atualiza lista do Drive
      buscarFormulariosDrive();
    } catch (err: any) {
      console.error('Erro ao recriar Google Form:', err);
      setMensagemErro(err?.message || 'Falha ao recriar o formulário Google.');
    } finally {
      setLoadingCriacao(false);
    }
  };

  // 2. Ação de Validar e Conectar Formulário por Link ou ID
  const handleConectarFormPorId = async (idOuLinkManual?: string) => {
    const alvo = idOuLinkManual || inputUrlOuId;
    if (!alvo.trim()) {
      setMensagemErro('Informe o link ou ID do formulário.');
      return;
    }

    try {
      setLoadingValidacao(true);
      setMensagemErro(null);
      setSucessoMsg(null);

      let token = await getAccessToken();
      if (!token) {
        const loginRes = await googleSignIn();
        if (!loginRes) {
          setLoadingValidacao(false);
          return;
        }
        token = loginRes.accessToken;
      }

      const idLimpo = extrairFormId(alvo);
      const checagem = await verificarGoogleFormExistente(token, idLimpo);

      if (!checagem.valido || !checagem.form) {
        throw new Error(checagem.erro || 'Não foi possível validar este formulário.');
      }

      onSalvarFormOficial(checagem.form);
      setSucessoMsg(`Formulário "${checagem.form.titulo}" conectado com sucesso!`);
      onExibirNotificacao(`Formulário vinculado com sucesso.`);
      setInputUrlOuId('');
    } catch (err: any) {
      setMensagemErro(err?.message || 'Erro ao conectar formulário.');
    } finally {
      setLoadingValidacao(false);
    }
  };

  // 3. Ação de Desconectar Formulário
  const handleDesconectarForm = () => {
    if (!isAdmin) {
      setMensagemErro('Apenas administradores podem desconectar o formulário.');
      return;
    }
    onSalvarFormOficial(null);
    setSucessoMsg('Formulário desconectado. Você pode recriar ou selecionar outro formulário abaixo.');
    onExibirNotificacao('Formulário desconectado.');
  };

  // 4. Testar se o formulário atual ainda existe
  const handleTestarConexaoAtual = async () => {
    if (!formOficial) return;
    try {
      setLoadingValidacao(true);
      setMensagemErro(null);
      setSucessoMsg(null);

      const token = await getAccessToken();
      if (!token) throw new Error('Faça login com o Google para testar a conexão.');

      const checagem = await verificarGoogleFormExistente(token, formOficial.formId);
      if (checagem.valido) {
        setSucessoMsg(`Conexão confirmada! O formulário "${formOficial.titulo}" está ativo e respondendo no Google Drive.`);
      } else {
        setMensagemErro(`Atenção: ${checagem.erro || 'O formulário não respondeu. Ele pode ter sido excluído no Google Drive. Use o botão abaixo para recriá-lo.'}`);
      }
    } catch (err: any) {
      setMensagemErro(err?.message || 'Erro ao testar conexão.');
    } finally {
      setLoadingValidacao(false);
    }
  };

  const formsFiltrados = formulariosDrive.filter((f) => {
    if (!termoBuscaDrive.trim()) return true;
    return f.name.toLowerCase().includes(termoBuscaDrive.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        
        {/* Cabeçalho do Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between border-b border-purple-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-white flex items-center gap-2">
                Gerenciador do Google Forms Oficial
                {isAdmin ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Acesso Admin
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-700 text-slate-300">
                    Modo Leitura
                  </span>
                )}
              </h2>
              <p className="text-xs text-purple-200/80">
                Crie, recrie e vincule o canal oficial de abertura de chamados da empresa
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-slate-800 dark:text-slate-100 text-xs">
          
          {/* Mensagens de Sucesso e Erro */}
          {sucessoMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{sucessoMsg}</div>
            </div>
          )}

          {mensagemErro && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{mensagemErro}</div>
            </div>
          )}

          {/* Bloqueio de Segurança RBAC para Não Administradores */}
          {!isAdmin && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-semibold">Acesso Restrito ao Administrador</strong>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                  Apenas usuários com papel de <strong>Administrador</strong> têm autorização para criar, recriar ou desconectar formulários Google corporativos.
                </p>
              </div>
            </div>
          )}

          {/* CARD DE STATUS ATUAL DO FORMULÁRIO */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Status da Conexão
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${formOficial ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {formOficial ? formOficial.titulo : 'Nenhum Formulário Conectado'}
                  </span>
                </div>
              </div>

              {formOficial && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTestarConexaoAtual}
                    disabled={loadingValidacao}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingValidacao ? 'animate-spin' : ''}`} />
                    <span>Testar Conexão</span>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={handleDesconectarForm}
                      className="px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-medium flex items-center gap-1.5 transition"
                      title="Desconecta este formulário sem exclui-lo do Drive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Desconectar</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {formOficial ? (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 font-mono block">ID do Formulário:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-200 font-semibold select-all break-all">
                      {formOficial.formId}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 font-mono block">Planilha Vinculada:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold truncate block">
                      {planilhaAtiva ? `${planilhaAtiva.nome} (Aba: Respostas ao formulário 1)` : 'Não vinculada ao Sheets'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href={formOficial.responderUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir Link Público (Colaboradores)</span>
                  </a>

                  <a
                    href={formOficial.editUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Editar Perguntas no Forms</span>
                  </a>
                </div>

                {/* BOTÃO EXCLUSIVO DO ADMIN: RECRIAR FORMULÁRIO DO ZERO */}
                {isAdmin && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                    {!confirmandoRecriacao ? (
                      <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/50">
                        <div>
                          <strong className="text-purple-900 dark:text-purple-200 font-semibold block text-xs">
                            Precisa recriar ou o Forms foi excluído?
                          </strong>
                          <span className="text-[11px] text-purple-700 dark:text-purple-300">
                            Recria o formulário oficial simplificado apenas por Setor e descrição do problema.
                          </span>
                        </div>
                        <button
                          onClick={() => setConfirmandoRecriacao(true)}
                          className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shrink-0 shadow-sm transition flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Recriar Forms (Admin)</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 space-y-2.5">
                        <div className="flex items-start gap-2 text-amber-900 dark:text-amber-200 text-xs">
                          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <strong>Confirmar recriação do Formulário Google:</strong>
                            <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                              Um novo Google Form será criado em sua conta Google com estrutura simplificada por Setor e as 27 opções oficiais.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => setConfirmandoRecriacao(false)}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleCriarOuRecriarForm}
                            disabled={loadingCriacao}
                            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                          >
                            <Sparkles className={`w-3.5 h-3.5 ${loadingCriacao ? 'animate-spin' : ''}`} />
                            <span>{loadingCriacao ? 'Recriando...' : 'Confirmar e Recriar Agora'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 space-y-3">
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                  Você ainda não possui um formulário Google configurado para este sistema.
                </p>

                {isAdmin ? (
                  <button
                    onClick={handleCriarOuRecriarForm}
                    disabled={loadingCriacao}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles className={`w-4 h-4 ${loadingCriacao ? 'animate-spin' : ''}`} />
                    <span>{loadingCriacao ? 'Criando Formulário...' : 'Criar Google Forms Oficial (1-Clique)'}</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">
                    Solicite ao Administrador do sistema a criação do formulário.
                  </span>
                )}
              </div>
            )}
          </div>

          {/* SELEÇÃO OU VINCULAÇÃO DE FORMULÁRIO EXISTENTE */}
          {isAdmin && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Link className="w-4 h-4 text-purple-500" />
                <span>Ou Vincular Formulário Já Existente</span>
              </h3>

              {/* Colar Link ou ID */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputUrlOuId}
                  onChange={(e) => setInputUrlOuId(e.target.value)}
                  placeholder="Cole o link de visualização/edição ou o ID do Google Forms..."
                  className="flex-1 text-xs px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={() => handleConectarFormPorId()}
                  disabled={loadingValidacao || !inputUrlOuId.trim()}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition disabled:opacity-50 shrink-0"
                >
                  {loadingValidacao ? 'Validando...' : 'Conectar'}
                </button>
              </div>

              {/* Formulários encontrados no Google Drive */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">
                    Formulários no seu Google Drive ({formsFiltrados.length})
                  </span>
                  <button
                    onClick={buscarFormulariosDrive}
                    disabled={carregandoDrive}
                    className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${carregandoDrive ? 'animate-spin' : ''}`} />
                    <span>Recarregar Drive</span>
                  </button>
                </div>

                {formsFiltrados.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-950/30">
                    {formsFiltrados.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 transition gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                            {item.name}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {item.id} {item.modifiedTime && `• Modificado em ${new Date(item.modifiedTime).toLocaleDateString('pt-BR')}`}
                          </span>
                        </div>
                        <button
                          onClick={() => handleConectarFormPorId(item.id)}
                          disabled={loadingValidacao || (formOficial?.formId === item.id)}
                          className="px-2.5 py-1 text-xs rounded-lg bg-purple-100 dark:bg-purple-950/60 hover:bg-purple-200 dark:hover:bg-purple-900 text-purple-800 dark:text-purple-200 font-semibold transition shrink-0 disabled:opacity-40"
                        >
                          {formOficial?.formId === item.id ? 'Ativo' : 'Selecionar'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs">
                    {carregandoDrive ? 'Buscando formulários no seu Drive...' : 'Nenhum formulário Google encontrado no Drive.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* GUIA PASSO A PASSO: VINCULAÇÃO COM O GOOGLE SHEETS */}
          <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/20 space-y-2.5">
            <h4 className="font-semibold text-blue-950 dark:text-blue-200 flex items-center gap-1.5 text-xs">
              <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Como vincular as respostas do Forms à sua Planilha Google:</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-blue-900 dark:text-blue-300 leading-relaxed">
              <li>
                Abra o formulário criado clicando no botão <strong>"Editar Perguntas no Forms"</strong> acima.
              </li>
              <li>
                No editor do Google Forms, clique na aba <strong>"Respostas"</strong> no topo.
              </li>
              <li>
                Clique no ícone verde de planilha (ou no menu de 3 pontinhos) e escolha <strong>"Vincular às Planilhas"</strong>.
              </li>
              <li>
                Marque a opção <strong>"Selecionar planilha existente"</strong> e selecione a sua planilha do DeskOps TI.
              </li>
              <li>
                O Google Sheets criará automaticamente a aba <strong>"Respostas ao formulário 1"</strong>, e o DeskOps TI começará a importar os chamados em tempo real com protocolo sequencial <strong>CH-2026-XXXX</strong>!
              </li>
            </ol>
          </div>

        </div>

        {/* Rodapé do Modal */}
        <div className="px-6 py-3.5 bg-slate-100 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400 text-[11px]">
            DeskOps TI • Canal Oficial Google Workspace
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
