import React, { useState } from 'react';
import { 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  ShieldCheck, 
  HelpCircle,
  ArrowRight,
  Sparkles,
  FileText
} from 'lucide-react';
import { Chamado } from '../types';
import { calcularSla } from '../utils/sla';

interface ConsultaProtocoloViewProps {
  chamados: Chamado[];
}

export const ConsultaProtocoloView: React.FC<ConsultaProtocoloViewProps> = ({ chamados }) => {
  const [protocoloInput, setProtocoloInput] = useState<string>('CH-2026-0042');
  const [resultado, setResultado] = useState<Chamado | null>(
    chamados.find((c) => c.id === 'CH-2026-0042') || null
  );
  const [mensagemErro, setMensagemErro] = useState<string>('');

  const handleConsultar = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setMensagemErro('');
    const termo = protocoloInput.trim().toUpperCase();
    if (!termo) {
      setMensagemErro('Por favor, informe o número do protocolo.');
      setResultado(null);
      return;
    }

    const encontrado = chamados.find((c) => c.id.toUpperCase() === termo);
    if (encontrado) {
      setResultado(encontrado);
      setMensagemErro('');
    } else {
      setResultado(null);
      setMensagemErro(`Nenhum chamado encontrado com o protocolo "${termo}". Verifique se digitou corretamente.`);
    }
  };

  const handleTestarExemplo = (idExemplo: string) => {
    setProtocoloInput(idExemplo);
    const encontrado = chamados.find((c) => c.id === idExemplo);
    if (encontrado) {
      setResultado(encontrado);
      setMensagemErro('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header for Collaborators */}
      <div className="text-center space-y-2 py-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Autoatendimento ao Colaborador · Consulta Direta</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display">
          Acompanhar Meu Chamado
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          Digite apenas o número do protocolo recebido no seu e-mail para acompanhar o status e as notas da equipe de TI em tempo real.
        </p>
      </div>

      {/* Input Box */}
      <form onSubmit={handleConsultar} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          Número do Protocolo
        </label>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={protocoloInput}
              onChange={(e) => setProtocoloInput(e.target.value)}
              placeholder="Ex: CH-2026-0042"
              className="w-full text-base font-mono font-bold tracking-wider rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase placeholder:normal-case placeholder:font-normal placeholder:tracking-normal"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 shrink-0"
          >
            <span>Consultar Status</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Test Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-400">Exemplos rápidos:</span>
          <button
            type="button"
            onClick={() => handleTestarExemplo('CH-2026-0041')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px] transition"
          >
            CH-2026-0041 (Aberto)
          </button>
          <button
            type="button"
            onClick={() => handleTestarExemplo('CH-2026-0042')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px] transition"
          >
            CH-2026-0042 (Em Andamento)
          </button>
          <button
            type="button"
            onClick={() => handleTestarExemplo('CH-2026-0038')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px] transition"
          >
            CH-2026-0038 (Concluído)
          </button>
        </div>
      </form>

      {/* Error Message */}
      {mensagemErro && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{mensagemErro}</span>
        </div>
      )}

      {/* Result Card */}
      {resultado && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          
          {/* Status Header Banner */}
          <div className={`p-6 border-b text-white ${
            resultado.status === 'Concluído'
              ? 'bg-gradient-to-r from-emerald-700 to-teal-800 border-emerald-600'
              : resultado.status === 'Em Andamento'
              ? 'bg-gradient-to-r from-blue-700 to-indigo-800 border-blue-600'
              : resultado.status === 'Aguardando Peça'
              ? 'bg-gradient-to-r from-amber-600 to-orange-700 border-amber-500'
              : 'bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-200 block font-semibold">
                  Protocolo Oficial DeskOps
                </span>
                <span className="text-2xl font-mono font-bold tracking-tight">
                  {resultado.id}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-sm text-sm font-bold border border-white/30">
                  Status: {resultado.status}
                </span>
              </div>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 space-y-6">
            
            {/* 3 Step Visual Progress */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center mx-auto mb-1 text-[11px]">
                  ✓
                </div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">1. Abertura</span>
                <span className="text-[10px] text-slate-400">Recebido na fila</span>
              </div>

              <div className={`p-3 rounded-xl border ${
                resultado.status !== 'Aberto' 
                  ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' 
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 opacity-60'
              }`}>
                <div className={`w-6 h-6 rounded-full font-bold flex items-center justify-center mx-auto mb-1 text-[11px] ${
                  resultado.status !== 'Aberto' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  2
                </div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">2. Em Atendimento</span>
                <span className="text-[10px] text-slate-400">
                  {resultado.emailTecnicoResponsavel ? 'Técnico analisando' : 'Aguardando técnico'}
                </span>
              </div>

              <div className={`p-3 rounded-xl border ${
                resultado.status === 'Concluído'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 opacity-60'
              }`}>
                <div className={`w-6 h-6 rounded-full font-bold flex items-center justify-center mx-auto mb-1 text-[11px] ${
                  resultado.status === 'Concluído' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  3
                </div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">3. Conclusão</span>
                <span className="text-[10px] text-slate-400">Resolvido e encerrado</span>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <div>
                <span className="text-slate-400 block mb-0.5">Solicitante:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {resultado.nomeSolicitante} ({resultado.setor})
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Data e Hora de Registro:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {new Date(resultado.dataHoraAbertura).toLocaleString('pt-BR')}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Categoria do Problema:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {resultado.categoria}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Técnico de TI Responsável:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {resultado.emailTecnicoResponsavel || 'Equipe de TI Geral'}
                </span>
              </div>
            </div>

            {/* Problema Relatado */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Descrição do Seu Problema:
              </span>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                {resultado.descricao}
              </div>
            </div>

            {/* Resolução e Notas Técnicas */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Observações Técnicas da Equipe de TI:
              </span>
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/60 dark:border-blue-900/60 text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-line">
                {resultado.observacoesTecnicas || 'O chamado está na fila e será atendido em breve pela equipe técnica.'}
              </div>
            </div>

            {resultado.status === 'Concluído' && resultado.dataFechamento && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                <span>Encerramento: {new Date(resultado.dataFechamento).toLocaleString('pt-BR')}</span>
                <span className="font-semibold">{resultado.tempoAtendimentoSla || 'Atendimento Concluído'}</span>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
