import React, { useState } from 'react';
import { 
  Send, 
  Sparkles, 
  CheckCircle2, 
  WifiOff, 
  Laptop, 
  Printer, 
  Key, 
  Download, 
  HelpCircle,
  Copy,
  Check,
  ArrowRight
} from 'lucide-react';
import { Chamado, PrioridadeChamado } from '../types';
import { CATEGORIAS_PROBLEMAS, SETORES_EMPRESA } from '../data/initialData';

interface NovoChamadoViewProps {
  onCriarChamado: (novoChamado: Chamado) => void;
  onIrParaConsulta: (protocolo: string) => void;
}

export const NovoChamadoView: React.FC<NovoChamadoViewProps> = ({
  onCriarChamado,
  onIrParaConsulta
}) => {
  const [nome, setNome] = useState<string>('Mariana Souza');
  const [email, setEmail] = useState<string>('mariana.souza@empresa.com');
  const [setor, setSetor] = useState<string>('Financeiro');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>(CATEGORIAS_PROBLEMAS[0].label);
  const [prioridade, setPrioridade] = useState<PrioridadeChamado>('Alta');
  const [descricao, setDescricao] = useState<string>('');

  // Result modal state
  const [chamadoCriado, setChamadoCriado] = useState<Chamado | null>(null);
  const [copiado, setCopiado] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !descricao.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const agora = new Date();
    const ano = agora.getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const novoId = `CH-${ano}-${randomNum}`;

    const novo: Chamado = {
      id: novoId,
      dataHoraAbertura: agora.toISOString(),
      nomeSolicitante: nome.trim(),
      emailSolicitante: email.trim(),
      setor,
      categoria: categoriaSelecionada,
      descricao: descricao.trim(),
      prioridade,
      emailTecnicoResponsavel: '',
      status: 'Aberto',
      observacoesTecnicas: 'Chamado registrado via Portal / Simulação onFormSubmit.',
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
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="text-center space-y-2 py-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Formulário Humanizado para Colaboradores (Google Forms / Web)</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display">
          Abrir Chamado de Suporte TI
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          Linguagem simples, direta e sem termos técnicos complexos para você receber ajuda rápida da equipe.
        </p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
        
        {/* Passo 1: Categoria Amigável */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            1. Qual é o problema que você está enfrentando? <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {CATEGORIAS_PROBLEMAS.map((cat) => {
              const isSelected = categoriaSelecionada === cat.label;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => {
                    setCategoriaSelecionada(cat.label);
                    setPrioridade(cat.prioridadeDefault);
                  }}
                  className={`p-3.5 rounded-xl text-left border transition flex items-center gap-3 ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                      : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-sm font-semibold">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Passo 2: Seus Dados */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Seu Nome Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Mariana Souza"
              className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Seu E-mail Corporativo <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ex: mariana.souza@empresa.com"
              className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Você receberá a confirmação com o protocolo neste e-mail.
            </span>
          </div>
        </div>

        {/* Passo 3: Setor e Prioridade */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Seu Setor / Departamento <span className="text-red-500">*</span>
            </label>
            <select
              value={setor}
              onChange={(e) => setSetor(e.target.value)}
              className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {SETORES_EMPRESA.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Urgência do Impacto
            </label>
            <select
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value as PrioridadeChamado)}
              className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="Baixa">Baixa · Não impede o trabalho (SLA 24h)</option>
              <option value="Média">Média · Dificulta o trabalho parcial (SLA 8h)</option>
              <option value="Alta">Alta · Impede meu trabalho totalmente (SLA 4h)</option>
              <option value="Crítica">Crítica · Setor inteiro parado / Emergência (SLA 2h)</option>
            </select>
          </div>
        </div>

        {/* Passo 4: Descrição do Problema */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Explique o que está acontecendo com suas próprias palavras <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            required
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: Liguei meu computador esta manhã e a tela fica preta com uma luz piscando. Já tentei tirar da tomada e religar, mas não deu sinal."
            className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Enviar Chamado de Suporte</span>
          </button>
        </div>
      </form>

      {/* MODAL DE SUCESSO / CONFIRMAÇÃO DO PROTOCOLO */}
      {chamadoCriado && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-display">
              Chamado Aberto com Sucesso!
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Seu chamado foi registrado na planilha <code>Chamados</code> e o gatilho <code>onFormSubmit</code> enviou um e-mail de confirmação para <strong>{chamadoCriado.emailSolicitante}</strong>.
            </p>

            {/* Protocolo Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Número do Protocolo</span>
                <span className="font-mono text-xl font-bold text-blue-600 dark:text-blue-400">
                  {chamadoCriado.id}
                </span>
              </div>
              <button
                onClick={handleCopiarProtocolo}
                className="p-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 hover:bg-slate-100 text-xs flex items-center gap-1 shadow-2xs"
                title="Copiar Protocolo"
              >
                {copiado ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span className="text-[11px] font-medium">{copiado ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  const prot = chamadoCriado.id;
                  setChamadoCriado(null);
                  onIrParaConsulta(prot);
                }}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition flex items-center justify-center gap-1.5"
              >
                <span>Acompanhar Chamado Agora</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setChamadoCriado(null);
                  setDescricao('');
                }}
                className="w-full py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
              >
                Abrir Outro Chamado
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
