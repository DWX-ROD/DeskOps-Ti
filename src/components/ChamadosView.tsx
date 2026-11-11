import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Filter, 
  UserCheck, 
  Eye, 
  CheckSquare, 
  Sparkles,
  ArrowUpDown,
  Search,
  Send,
  X,
  RefreshCw,
  Radio
} from 'lucide-react';
import { Chamado, PrioridadeChamado, StatusChamado, Tecnico } from '../types';
import { calcularSla } from '../utils/sla';
import { SETORES_EMPRESA } from '../data/initialData';

interface ChamadosViewProps {
  chamados: Chamado[];
  tecnicoAtivo: Tecnico;
  onAssumirChamado: (id: string) => void;
  onConcluirChamado: (id: string, observacoes: string) => void;
  onAtualizarStatus: (id: string, novoStatus: StatusChamado, observacao?: string) => void;
  onAbrirNovoChamadoTab: () => void;
  onSincronizarPlanilha?: () => void;
  isSincronizando?: boolean;
  planilhaConectada?: boolean;
  ultimaSincronizacao?: Date | null;
}

export const ChamadosView: React.FC<ChamadosViewProps> = ({
  chamados,
  tecnicoAtivo,
  onAssumirChamado,
  onConcluirChamado,
  onAtualizarStatus,
  onAbrirNovoChamadoTab,
  onSincronizarPlanilha,
  isSincronizando,
  planilhaConectada,
  ultimaSincronizacao
}) => {
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('todas');
  const [filtroSetor, setFiltroSetor] = useState<string>('todos');
  const [termoBusca, setTermoBusca] = useState<string>('');
  
  // Modal states
  const [modalConcluirChamado, setModalConcluirChamado] = useState<Chamado | null>(null);
  const [textoResolucao, setTextoResolucao] = useState<string>('');
  const [chamadoDetalhes, setChamadoDetalhes] = useState<Chamado | null>(null);
  const [novaNotaTecnica, setNovaNotaTecnica] = useState<string>('');

  // Filtering
  const chamadosFiltrados = chamados.filter((ch) => {
    if (filtroStatus !== 'todos' && ch.status !== filtroStatus) return false;
    if (filtroPrioridade !== 'todas' && ch.prioridade !== filtroPrioridade) return false;
    if (filtroSetor !== 'todos' && ch.setor !== filtroSetor) return false;
    if (termoBusca.trim()) {
      const b = termoBusca.toLowerCase();
      const matchId = ch.id.toLowerCase().includes(b);
      const matchNome = ch.nomeSolicitante.toLowerCase().includes(b);
      const matchCat = ch.categoria.toLowerCase().includes(b);
      const matchDesc = ch.descricao.toLowerCase().includes(b);
      const matchSetor = ch.setor.toLowerCase().includes(b);
      if (!matchId && !matchNome && !matchCat && !matchDesc && !matchSetor) return false;
    }
    return true;
  });

  // Metrics
  const totalChamados = chamados.length;
  const chamadosAbertos = chamados.filter((c) => c.status === 'Aberto').length;
  const chamadosEmAndamento = chamados.filter((c) => c.status === 'Em Andamento').length;
  const chamadosAguardando = chamados.filter((c) => c.status === 'Aguardando Peça').length;
  const chamadosConcluidos = chamados.filter((c) => c.status === 'Concluído').length;

  const chamadosSlaCritico = chamados.filter((c) => {
    if (c.status === 'Concluído' || c.status === 'Cancelado') return false;
    const sla = calcularSla(c.dataHoraAbertura, c.prioridade, c.status);
    return sla.statusSla === 'estourado' || sla.statusSla === 'em_risco';
  }).length;

  const handleConfirmarConclusao = () => {
    if (!modalConcluirChamado) return;
    if (!textoResolucao.trim()) {
      alert('Por favor, informe as observações técnicas da resolução.');
      return;
    }
    onConcluirChamado(modalConcluirChamado.id, textoResolucao);
    setModalConcluirChamado(null);
    setTextoResolucao('');
  };

  const handleAdicionarNotaDetalhes = () => {
    if (!chamadoDetalhes || !novaNotaTecnica.trim()) return;
    onAtualizarStatus(chamadoDetalhes.id, chamadoDetalhes.status, novaNotaTecnica);
    setChamadoDetalhes({
      ...chamadoDetalhes,
      observacoesTecnicas: (chamadoDetalhes.observacoesTecnicas || '') + `\n[Nota de ${tecnicoAtivo.nome}]: ${novaNotaTecnica}`
    });
    setNovaNotaTecnica('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display">
            Fila de Chamados & Helpdesk
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Painel operacional da equipe de TI com cálculo de SLA por prioridade e botão "Assumir Chamado" com 1 clique.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {planilhaConectada && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-medium shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="hidden sm:inline">Banco Oficial:</span>
              <span className="font-semibold text-emerald-900 dark:text-emerald-100">DeskOps TI - Banco de Dados</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">(Tempo Real)</span>
            </div>
          )}

          {onSincronizarPlanilha && (
            <button
              onClick={onSincronizarPlanilha}
              disabled={isSincronizando}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/70 text-slate-700 dark:text-slate-200 shadow-2xs transition disabled:opacity-50"
              title="Sincronizar dados em tempo real com a planilha Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSincronizando ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span>{isSincronizando ? 'Sincronizando...' : 'Sincronizar Planilha'}</span>
            </button>
          )}

          <button
            onClick={onAbrirNovoChamadoTab}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Abrir Chamado por Setor</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Abertos</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
            {chamadosAbertos}
          </div>
          <span className="text-[11px] text-slate-400">Aguardando atendimento</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Em Andamento</span>
            <UserCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono tabular-nums">
            {chamadosEmAndamento}
          </div>
          <span className="text-[11px] text-slate-400">Com técnico atribuído</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Aguardando Peça</span>
            <Clock className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 font-mono tabular-nums">
            {chamadosAguardando}
          </div>
          <span className="text-[11px] text-slate-400">Pendente de suprimento</span>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm ${
          chamadosSlaCritico > 0 
            ? 'bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-900' 
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-semibold uppercase tracking-wider ${
              chamadosSlaCritico > 0 ? 'text-red-700 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'
            }`}>
              Alerta de SLA
            </span>
            <AlertTriangle className={`w-4 h-4 ${chamadosSlaCritico > 0 ? 'text-red-600 animate-bounce' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl font-bold font-mono tabular-nums ${
            chamadosSlaCritico > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'
          }`}>
            {chamadosSlaCritico}
          </div>
          <span className={`text-[11px] ${chamadosSlaCritico > 0 ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
            {chamadosSlaCritico > 0 ? 'Exige atenção imediata!' : 'Tudo dentro do prazo'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Concluídos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
            {chamadosConcluidos}
          </div>
          <span className="text-[11px] text-slate-400">Total de {totalChamados} chamados</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filtros Operacionais</span>
          </div>
          {(filtroStatus !== 'todos' || filtroPrioridade !== 'todas' || filtroSetor !== 'todos' || termoBusca) && (
            <button
              onClick={() => {
                setFiltroStatus('todos');
                setFiltroPrioridade('todas');
                setFiltroSetor('todos');
                setTermoBusca('');
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Limpar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Status</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="todos">Todos os Status</option>
              <option value="Aberto">Aberto</option>
              <option value="Em Andamento">Em Andamento</option>
              <option value="Aguardando Peça">Aguardando Peça</option>
              <option value="Concluído">Concluído</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Prioridade / SLA</label>
            <select
              value={filtroPrioridade}
              onChange={(e) => setFiltroPrioridade(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="todas">Todas as Prioridades</option>
              <option value="Crítica">Crítica (SLA 2h)</option>
              <option value="Alta">Alta (SLA 4h)</option>
              <option value="Média">Média (SLA 8h)</option>
              <option value="Baixa">Baixa (SLA 24h)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Setor Solicitante</label>
            <select
              value={filtroSetor}
              onChange={(e) => setFiltroSetor(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="todos">Todos os Setores</option>
              {SETORES_EMPRESA.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Busca Textual</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                placeholder="Protocolo, solicitante, problema..."
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Tickets Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Protocolo</th>
                <th className="py-3 px-4">Solicitante</th>
                <th className="py-3 px-4">Categoria / Descrição</th>
                <th className="py-3 px-4">Prioridade</th>
                <th className="py-3 px-4">Status & SLA</th>
                <th className="py-3 px-4">Técnico Responsável</th>
                <th className="py-3 px-4 text-right">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {chamadosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Nenhum chamado corresponde aos filtros selecionados.
                  </td>
                </tr>
              ) : (
                chamadosFiltrados.map((ch) => {
                  const sla = calcularSla(ch.dataHoraAbertura, ch.prioridade, ch.status, ch.dataFechamento);
                  const isAberto = ch.status === 'Aberto';
                  const isEmAndamento = ch.status === 'Em Andamento';
                  const isAguardando = ch.status === 'Aguardando Peça';
                  const isConcluido = ch.status === 'Concluído';

                  const formatarHoraAbertura = (d: string) => {
                    try {
                      const dt = new Date(d);
                      return dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' · ' + dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    } catch {
                      return d;
                    }
                  };

                  return (
                    <tr 
                      key={ch.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Protocolo */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-blue-600 dark:text-blue-400">{ch.id}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {formatarHoraAbertura(ch.dataHoraAbertura)}
                        </span>
                      </td>

                      {/* Solicitante */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {ch.nomeSolicitante}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <span>{ch.setor}</span>
                          <span>·</span>
                          <span className="truncate max-w-[120px]">{ch.emailSolicitante}</span>
                        </div>
                      </td>

                      {/* Categoria & Resumo */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {ch.categoria}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5" title={ch.descricao}>
                          {ch.descricao}
                        </p>
                      </td>

                      {/* Prioridade */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          ch.prioridade === 'Crítica'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800'
                            : ch.prioridade === 'Alta'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : ch.prioridade === 'Média'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}>
                          {ch.prioridade}
                        </span>
                      </td>

                      {/* Status & SLA */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold w-fit ${
                            isAberto
                              ? 'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800'
                              : isEmAndamento
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
                              : isAguardando
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                              : isConcluido
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {ch.status}
                          </span>

                          {/* SLA Timer Badge */}
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums border w-fit ${sla.badgeClasse}`}>
                            <Clock className="w-3 h-3" />
                            {sla.textoFormatado}
                          </span>
                        </div>
                      </td>

                      {/* Técnico Responsável */}
                      <td className="py-3.5 px-4">
                        {ch.emailTecnicoResponsavel ? (
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span className="truncate max-w-[140px] text-[11px] font-medium" title={ch.emailTecnicoResponsavel}>
                              {ch.emailTecnicoResponsavel}
                            </span>
                          </div>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-medium text-[11px] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                            Sem técnico
                          </span>
                        )}
                      </td>

                      {/* Ações Rápidas */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* 1-Click "Assumir Chamado" */}
                          {isAberto && (
                            <button
                              onClick={() => onAssumirChamado(ch.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1"
                              title={`Atribuir instantaneamente ao técnico ativo (${tecnicoAtivo.email}) e alterar status para Em Andamento`}
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Assumir</span>
                            </button>
                          )}

                          {/* Finalizar / Concluir */}
                          {(isEmAndamento || isAguardando) && (
                            <button
                              onClick={() => {
                                setModalConcluirChamado(ch);
                                setTextoResolucao('');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1"
                              title="Concluir chamado, registrar observações e enviar e-mail ao solicitante"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              <span>Concluir</span>
                            </button>
                          )}

                          {/* Ver Detalhes */}
                          <button
                            onClick={() => setChamadoDetalhes(ch)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition"
                            title="Ver detalhes completos e histórico"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: FINALIZAR CHAMADO */}
      {modalConcluirChamado && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
                  Concluir Chamado de Suporte
                </h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-mono font-semibold">
                  Protocolo: {modalConcluirChamado.id} · Solicitante: {modalConcluirChamado.nomeSolicitante}
                </p>
              </div>
              <button 
                onClick={() => setModalConcluirChamado(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Problema relatado:</span>
                <p className="text-slate-600 dark:text-slate-400 italic">"{modalConcluirChamado.descricao}"</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Observações Técnicas / Resolução Aplicada <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={textoResolucao}
                  onChange={(e) => setTextoResolucao(e.target.value)}
                  placeholder="Ex: Realizada troca de cabo de rede cat6 e reconfiguração de IP na porta 14 do switch. Testes de conectividade validados com sucesso."
                  className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  ✉️ Esta nota será gravada na aba <code>Chamados</code> e disparada automaticamente por e-mail para <strong>{modalConcluirChamado.emailSolicitante}</strong>.
                </p>
              </div>

              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  O script registrará a data de encerramento, o tempo total de SLA e o técnico responsável (<strong>{tecnicoAtivo.email}</strong>).
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setModalConcluirChamado(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarConclusao}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvar e Notificar Solicitante</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER / MODAL: DETALHES COMPLETOS DO CHAMADO */}
      {chamadoDetalhes && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400">
                    {chamadoDetalhes.id}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {chamadoDetalhes.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Aberto em {new Date(chamadoDetalhes.dataHoraAbertura).toLocaleString('pt-BR')}
                </p>
              </div>
              <button 
                onClick={() => setChamadoDetalhes(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              
              {/* Informações Gerais */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <span className="text-slate-400 block">Solicitante:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{chamadoDetalhes.nomeSolicitante}</span>
                  <span className="text-slate-400 block">{chamadoDetalhes.emailSolicitante}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Setor:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{chamadoDetalhes.setor}</span>
                  <span className="text-slate-400 block">Prioridade: <strong>{chamadoDetalhes.prioridade}</strong></span>
                </div>
                <div>
                  <span className="text-slate-400 block">Técnico Responsável:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {chamadoDetalhes.emailTecnicoResponsavel || 'Não atribuído'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Status de SLA:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {calcularSla(chamadoDetalhes.dataHoraAbertura, chamadoDetalhes.prioridade, chamadoDetalhes.status).textoFormatado}
                  </span>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Descrição do Problema:
                </span>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                  {chamadoDetalhes.descricao}
                </div>
              </div>

              {/* Linha do Tempo de Observações */}
              <div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Histórico & Observações Técnicas (Gravadas na Planilha):
                </span>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-line max-h-40 overflow-y-auto">
                  {chamadoDetalhes.observacoesTecnicas || 'Nenhuma observação registrada até o momento.'}
                </div>
              </div>

              {/* Ação rápida para trocar status */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                  Atualizar Status ou Adicionar Nota:
                </span>
                <div className="flex flex-wrap gap-2 mb-3">
                  {chamadoDetalhes.status !== 'Em Andamento' && (
                    <button
                      onClick={() => {
                        onAtualizarStatus(chamadoDetalhes.id, 'Em Andamento', 'Status alterado para Em Andamento');
                        setChamadoDetalhes({ ...chamadoDetalhes, status: 'Em Andamento' });
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                    >
                      Marcar Em Andamento
                    </button>
                  )}

                  {chamadoDetalhes.status !== 'Aguardando Peça' && (
                    <button
                      onClick={() => {
                        onAtualizarStatus(chamadoDetalhes.id, 'Aguardando Peça', 'Aguardando chegada de peças');
                        setChamadoDetalhes({ ...chamadoDetalhes, status: 'Aguardando Peça' });
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                    >
                      Aguardando Peça
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={novaNotaTecnica}
                    onChange={(e) => setNovaNotaTecnica(e.target.value)}
                    placeholder="Adicionar nota rápida com carimbo de técnico..."
                    className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                  <button
                    onClick={handleAdicionarNotaDetalhes}
                    className="px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
                  >
                    Gravar Nota
                  </button>
                </div>
              </div>

            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setChamadoDetalhes(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
