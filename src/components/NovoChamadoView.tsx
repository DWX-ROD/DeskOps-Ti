import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink,
  Plus,
  RefreshCw,
  HelpCircle,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  Clock,
  Layers,
  AlertCircle
} from 'lucide-react';
import { Chamado, PrioridadeChamado } from '../types';
import { SETORES_EMPRESA } from '../data/initialData';
import { getAccessToken } from '../services/auth';
import { criarGoogleFormChamados, GoogleFormCriado, CAMPOS_FORMULARIO_PADRAO } from '../services/googleForms';

interface NovoChamadoViewProps {
  onCriarChamado: (novoChamado: Chamado) => void;
  onIrParaConsulta: (protocolo: string) => void;
}

export const NovoChamadoView: React.FC<NovoChamadoViewProps> = ({
  onCriarChamado,
  onIrParaConsulta
}) => {
  // Estado do formulário de abertura
  const [nome, setNome] = useState<string>('Mariana Souza');
  const [email, setEmail] = useState<string>('mariana.souza@empresa.com');
  const [setor, setSetor] = useState<string>(SETORES_EMPRESA[0] || 'OBIC');
  const [categoria, setCategoria] = useState<string>(CAMPOS_FORMULARIO_PADRAO.CATEGORIAS[0]);
  const [urgencia, setUrgencia] = useState<PrioridadeChamado>('Alta');
  const [descricao, setDescricao] = useState<string>('');

  // Resultado do chamado criado
  const [chamadoCriado, setChamadoCriado] = useState<Chamado | null>(null);
  const [copiado, setCopiado] = useState<boolean>(false);

  // Estado do Google Form Oficial integrado
  const [formOficial, setFormOficial] = useState<GoogleFormCriado | null>(null);
  const [criandoForm, setCriandoForm] = useState<boolean>(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  // Carrega formulário salvo localmente se existir
  useEffect(() => {
    const salvo = localStorage.getItem('deskops_google_form');
    if (salvo) {
      try {
        setFormOficial(JSON.parse(salvo));
      } catch (e) {}
    }
  }, []);

  // Criação automática do Google Form na conta Google do usuário
  const handleCriarGoogleFormOficial = async () => {
    try {
      setCriandoForm(true);
      setErroForm(null);
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Faça login com sua conta Google no topo da tela para criar o formulário.');
      }

      const form = await criarGoogleFormChamados(token, 'DeskOps TI - Abertura de Chamado', SETORES_EMPRESA);
      setFormOficial(form);
      localStorage.setItem('deskops_google_form', JSON.stringify(form));
    } catch (err: any) {
      setErroForm(err?.message || 'Erro ao criar o Google Form oficial.');
    } finally {
      setCriandoForm(false);
    }
  };

  // Submissão do chamado (Simulador / Processamento onFormSubmit)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !descricao.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const agora = new Date();
    const ano = agora.getFullYear();
    const randomSeq = Math.floor(10 + Math.random() * 90);
    const novoId = `CH-${ano}-${String(randomSeq).padStart(4, '0')}`;

    // SLA com base na urgência solicitada
    let horasSla = 8;
    if (urgencia === 'Crítica') horasSla = 2;
    else if (urgencia === 'Alta') horasSla = 4;
    else if (urgencia === 'Média') horasSla = 8;
    else if (urgencia === 'Baixa') horasSla = 24;

    const limiteSla = new Date(agora.getTime() + horasSla * 60 * 60 * 1000);
    const slaTexto = `${horasSla}h (Até ${limiteSla.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${limiteSla.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})`;

    const novo: Chamado = {
      id: novoId,
      dataHoraAbertura: agora.toISOString(),
      nomeSolicitante: nome.trim(),
      emailSolicitante: email.trim(),
      setor,
      categoria,
      descricao: descricao.trim(),
      prioridade: urgencia,
      emailTecnicoResponsavel: 'Sem Técnico',
      status: 'Aberto',
      tempoAtendimentoSla: slaTexto,
      observacoesTecnicas: 'Chamado recebido via Google Forms e normalizado para a fila de atendimento.',
      dataFechamento: null
    };

    onCriarChamado(novo);
    setChamadoCriado(novo);
  };

  const handleCopiarProtocolo = () => {
    if (!chamadoCriado) return;
    navigator.clipboard.writeText(chamadoCriado.id);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="text-center space-y-2 py-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Canal Oficial de Abertura · Google Forms & Sheets Integration</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display">
          Abertura de Chamado DeskOps TI
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Os chamados são abertos pelos colaboradores via Google Forms e processados automaticamente com geração de protocolo, SLA e status inicial "Aberto".
        </p>
      </div>

      {/* Card 1: Canal Oficial Google Forms (Nativo) */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border border-purple-200 dark:border-purple-800/60 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/20 shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
                  Google Forms Oficial
                </h3>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-purple-600/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                  Canal dos Funcionários
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Formulário estruturado com os 6 campos obrigatórios: E-mail, Nome, Setor, Categoria, Descrição e Urgência.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {formOficial ? (
              <a
                href={formOficial.responderUri}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-purple-600/20 transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Abrir Google Form</span>
              </a>
            ) : (
              <button
                onClick={handleCriarGoogleFormOficial}
                disabled={criandoForm}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-purple-600/20 transition disabled:opacity-50"
              >
                {criandoForm ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Criando Formulário...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Gerar Google Form Automático</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {erroForm && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{erroForm}</span>
          </div>
        )}

        {formOficial && (
          <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-purple-200/80 dark:border-purple-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="font-medium text-slate-800 dark:text-slate-200">
                Formulário Oficial Ativo: <strong>{formOficial.titulo}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <a
                href={formOficial.responderUri}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 dark:text-purple-400 font-semibold hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Responder como Colaborador</span>
              </a>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <a
                href={formOficial.editUri}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 dark:text-slate-400 hover:underline"
              >
                Editar Perguntas
              </a>
            </div>
          </div>
        )}

        {/* Mapeamento de Regras onFormSubmit */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-purple-200/60 dark:border-purple-800/40 text-[11px] text-slate-600 dark:text-slate-400">
          <div className="p-2 rounded-lg bg-white/60 dark:bg-slate-900/40">
            <strong>1. Protocolo:</strong> CH-YYYY-XXXX (automático e sequencial)
          </div>
          <div className="p-2 rounded-lg bg-white/60 dark:bg-slate-900/40">
            <strong>2. SLA:</strong> Crítica 2h, Alta 4h, Média 8h, Baixa 24h
          </div>
          <div className="p-2 rounded-lg bg-white/60 dark:bg-slate-900/40">
            <strong>3. Status Inicial:</strong> Aberto | Sem Técnico
          </div>
          <div className="p-2 rounded-lg bg-white/60 dark:bg-slate-900/40">
            <strong>4. Notificação:</strong> E-mail com protocolo imediato
          </div>
        </div>
      </div>

      {/* Card 2: Formulário Interativo Web / Simulador onFormSubmit */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
        
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
              Formulário Direto de Abertura (Simulador de Resposta)
            </h2>
            <p className="text-xs text-slate-500">
              Preencha os campos abaixo para testar a criação imediata de ticket com os dados normalizados no Google Sheets.
            </p>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            Gera Protocolo CH-2026-XXXX
          </span>
        </div>

        {/* Campo 1 e 2: Solicitante e E-mail */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome Completo do Solicitante <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Mariana Souza"
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              E-mail do Solicitante <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ex: mariana.souza@empresa.com"
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              O solicitante receberá a confirmação com o protocolo gerado neste e-mail.
            </span>
          </div>
        </div>

        {/* Campo 3 e 4: Setor e Categoria */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Setor / Departamento <span className="text-red-500">*</span>
            </label>
            <select
              value={setor}
              onChange={(e) => setSetor(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SETORES_EMPRESA.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Categoria do Problema <span className="text-red-500">*</span>
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CAMPOS_FORMULARIO_PADRAO.CATEGORIAS.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Campo 5: Urgência e SLA Calculado */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Nível de Urgência / Impacto Percebido <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'Baixa', label: 'Baixa', tempo: 'SLA 24h', desc: 'Dúvida ou sem parada' },
              { id: 'Média', label: 'Média', tempo: 'SLA 8h', desc: 'Trabalho parcial' },
              { id: 'Alta', label: 'Alta', tempo: 'SLA 4h', desc: 'Máquina parada' },
              { id: 'Crítica', label: 'Crítica', tempo: 'SLA 2h', desc: 'Setor inteiro parado' }
            ].map((u) => {
              const isSelected = urgencia === u.id;
              return (
                <button
                  type="button"
                  key={u.id}
                  onClick={() => setUrgencia(u.id as PrioridadeChamado)}
                  className={`p-3 rounded-xl text-left border transition ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20 font-semibold'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs">{u.label}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      u.id === 'Crítica' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
                      u.id === 'Alta' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                      'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {u.tempo}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-normal">
                    {u.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Campo 6: Descrição Detalhada */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Descrição Detalhada do Problema <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            required
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreva o que está acontecendo, mensagens de erro que apareceram e o que você precisa que seja feito..."
            className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            Status inicial será definido como <strong>Aberto</strong> e técnico como <strong>Sem Técnico</strong>.
          </p>
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 transition"
          >
            <Send className="w-4 h-4" />
            <span>Enviar Chamado (Gerar Protocolo)</span>
          </button>
        </div>

      </form>

      {/* Modal / Card de Chamado Criado com Sucesso */}
      {chamadoCriado && (
        <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-emerald-900 dark:text-emerald-100">
                  Chamado Registrado com Sucesso!
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Os dados foram processados e gravados na aba <strong>Chamados (Helpdesk)</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setChamadoCriado(null)}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Fechar
            </button>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                Número do Protocolo
              </span>
              <div className="font-mono text-2xl font-bold text-blue-600 dark:text-blue-400">
                {chamadoCriado.id}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                SLA: <strong>{chamadoCriado.tempoAtendimentoSla}</strong> | Status: <strong>{chamadoCriado.status}</strong> | Técnico: <strong>{chamadoCriado.emailTecnicoResponsavel}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleCopiarProtocolo}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                {copiado ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copiado ? 'Copiado!' : 'Copiar Protocolo'}</span>
              </button>

              <button
                onClick={() => onIrParaConsulta(chamadoCriado.id)}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition"
              >
                <span>Consultar Andamento</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
