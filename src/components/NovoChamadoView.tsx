import React, { useState } from 'react';
import { 
  Send, 
  Sparkles, 
  Copy, 
  Check, 
  ArrowRight, 
  Building2, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  User, 
  SlidersHorizontal 
} from 'lucide-react';
import { Chamado, PrioridadeChamado, Tecnico } from '../types';
import { SETORES_EMPRESA } from '../data/initialData';

const CATEGORIAS_CHAMADO = [
  'Hardware / Computador / Periféricos',
  'Redes / Conectividade / Internet',
  'Acessos, Senhas & Contas',
  'Impressoras & Scanners',
  'Sistemas & Softwares Internos',
  'Outros Suportes ao Setor'
];

interface NovoChamadoViewProps {
  onCriarChamado: (novoChamado: Chamado) => void;
  onIrParaConsulta: (protocolo: string) => void;
  tecnicoAtivo?: Tecnico;
  setores?: string[];
  nomeEmpresa?: string;
}

export const NovoChamadoView: React.FC<NovoChamadoViewProps> = ({
  onCriarChamado,
  onIrParaConsulta,
  tecnicoAtivo,
  setores: propSetores,
  nomeEmpresa = 'DeskOps TI'
}) => {
  const listaSetores = propSetores && propSetores.length > 0 ? propSetores : SETORES_EMPRESA;

  // 1. Campo Principal: SETOR da empresa
  const [setor, setSetor] = useState<string>(() => listaSetores[0] || 'TI');
  const [buscaSetor, setBuscaSetor] = useState<string>('');

  // 2. Campo Principal: O que o setor precisa
  const [descricao, setDescricao] = useState<string>('');

  // 3. Identificação Opcional (para não dificultar para o funcionário)
  const [nomeOpcional, setNomeOpcional] = useState<string>('');
  const [emailOpcional, setEmailOpcional] = useState<string>('');

  // 4. Opções Técnicas Avançadas (Recolhidas por padrão)
  const [mostrarAvancado, setMostrarAvancado] = useState<boolean>(false);
  const [categoria, setCategoria] = useState<string>('Geral / Atendimento ao Setor');
  const [urgencia, setUrgencia] = useState<PrioridadeChamado>('Média');

  // Resultado do chamado criado
  const [chamadoCriado, setChamadoCriado] = useState<Chamado | null>(null);
  const [copiado, setCopiado] = useState<boolean>(false);

  // Submissão simplificada: focada apenas em SETOR + DESCRIÇÃO
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setor.trim()) {
      alert('Por favor, selecione o setor solicitante.');
      return;
    }
    if (!descricao.trim()) {
      alert('Por favor, descreva em poucas palavras o que o seu setor precisa.');
      return;
    }

    const agora = new Date();
    const ano = agora.getFullYear();
    const randomSeq = Math.floor(10 + Math.random() * 90);
    const novoId = `CH-${ano}-${String(randomSeq).padStart(4, '0')}`;

    // SLA com base na urgência
    let horasSla = 8;
    if (urgencia === 'Crítica') horasSla = 2;
    else if (urgencia === 'Alta') horasSla = 4;
    else if (urgencia === 'Média') horasSla = 8;
    else if (urgencia === 'Baixa') horasSla = 24;

    const limiteSla = new Date(agora.getTime() + horasSla * 60 * 60 * 1000);
    const slaTexto = `${horasSla}h (Até ${limiteSla.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${limiteSla.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})`;

    // Solicitante em nome do Setor caso o colaborador não informe seu nome
    const nomeFinal = nomeOpcional.trim() 
      ? `${nomeOpcional.trim()} (${setor})` 
      : `Setor ${setor}`;

    const emailFinal = emailOpcional.trim();

    const novo: Chamado = {
      id: novoId,
      dataHoraAbertura: agora.toISOString(),
      nomeSolicitante: nomeFinal,
      emailSolicitante: emailFinal,
      setor: setor.trim(),
      categoria: categoria || 'Geral / Atendimento ao Setor',
      descricao: descricao.trim(),
      prioridade: urgencia,
      emailTecnicoResponsavel: 'Sem Técnico',
      status: 'Aberto',
      tempoAtendimentoSla: slaTexto,
      observacoesTecnicas: 'Chamado aberto por setor. Triagem e direcionamento inicial a cargo da equipe de TI.',
      dataFechamento: null
    };

    onCriarChamado(novo);
    setChamadoCriado(novo);
    setDescricao('');
  };

  const handleCopiarProtocolo = () => {
    if (!chamadoCriado) return;
    navigator.clipboard.writeText(chamadoCriado.id);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  // Setores filtrados pela busca rápida
  const setoresFiltrados = listaSetores.filter((s) => 
    s.toLowerCase().includes(buscaSetor.toLowerCase().trim())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="text-center space-y-2 py-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Abertura Simplificada · {nomeEmpresa}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display">
          Abrir Chamado por Setor
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Processo simplificado para os colaboradores: basta selecionar o seu <strong>Setor</strong> e descrever a necessidade. A equipe de TI fará a triagem, classificação técnica e o atendimento.
        </p>
      </div>

      {/* Formulário Interativo Web Direto - Focado Apenas no SETOR */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
        
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Abertura Rápida de Chamado</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sem termos técnicos difíceis: selecione o setor e conte-nos o que você precisa.
            </p>
          </div>
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Protocolo Automático CH-2026-XXXX
          </span>
        </div>

        {/* PASSO 1: Seleção do Setor */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              1. Qual é o Setor que precisa de suporte? <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
              Setor Selecionado: <strong>{setor}</strong>
            </span>
          </div>

          {/* Campo de Busca Rápida de Setores */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Digite para filtrar os ${listaSetores.length} setores (ex: ${listaSetores.slice(0, 3).join(', ')}...)`}
              value={buscaSetor}
              onChange={(e) => setBuscaSetor(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Seletor em Dropdown */}
          <div>
            <select
              value={setor}
              onChange={(e) => setSetor(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {setoresFiltrados.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Chips de Acesso Rápido aos Setores */}
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            {setoresFiltrados.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setSetor(s)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                  setor === s
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* PASSO 2: O que o setor precisa? */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            2. O que o setor precisa? (Descrição do problema) <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            required
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreva em palavras simples o que está acontecendo (ex: O computador 02 da baia não liga, a impressora do setor travou papel, estamos sem internet na sala, preciso de acesso ao sistema do setor...)"
            className="w-full text-xs p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
          />
        </div>

        {/* PASSO 3: Identificação Opcional (Não obrigatória) */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Contato no Setor (Opcional)</span>
            </span>
            <span className="text-[10px] text-slate-400">
              Caso não informe, o chamado será aberto como "Setor {setor}"
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                Seu Nome ou Ramal
              </label>
              <input
                type="text"
                value={nomeOpcional}
                onChange={(e) => setNomeOpcional(e.target.value)}
                placeholder="Ex: João / Ramal 204"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                E-mail para Acompanhamento
              </label>
              <input
                type="email"
                value={emailOpcional}
                onChange={(e) => setEmailOpcional(e.target.value)}
                placeholder="Ex: joao@empresa.com"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Opções Técnicas Avançadas (Recolhidas por padrão) */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
          <button
            type="button"
            onClick={() => setMostrarAvancado(!mostrarAvancado)}
            className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium transition"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Configurações Técnicas Avançadas (Opcional para Técnicos de TI)</span>
            {mostrarAvancado ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
          </button>

          {mostrarAvancado && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Classificação Prévia de Categoria
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Geral / Atendimento ao Setor">Geral / Atendimento ao Setor (Padrão)</option>
                    {CATEGORIAS_CHAMADO.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Urgência / Prioridade Prévia
                  </label>
                  <select
                    value={urgencia}
                    onChange={(e) => setUrgencia(e.target.value as PrioridadeChamado)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Média">Média (SLA 8h - Padrão)</option>
                    <option value="Baixa">Baixa (SLA 24h)</option>
                    <option value="Alta">Alta (SLA 4h)</option>
                    <option value="Crítica">Crítica (SLA 2h - Parada total)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500 text-center sm:text-left">
            O chamado entrará imediatamente na fila como <strong>Aberto</strong> para a equipe de TI atender.
          </p>
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition"
          >
            <Send className="w-4 h-4" />
            <span>Enviar Chamado do Setor {setor}</span>
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
                  Chamado do Setor {chamadoCriado.setor} Registrado!
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  O chamado foi gravado com sucesso no Google Sheets e está visível na fila para a equipe de TI.
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
                Setor: <strong>{chamadoCriado.setor}</strong> | SLA: <strong>{chamadoCriado.tempoAtendimentoSla}</strong> | Status: <strong>{chamadoCriado.status}</strong>
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
