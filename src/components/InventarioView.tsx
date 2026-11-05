import React, { useState } from 'react';
import { 
  Laptop, 
  CheckCircle, 
  Wrench, 
  Plus, 
  UserPlus, 
  RotateCcw, 
  History, 
  Search, 
  Filter,
  X,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Equipamento, Funcionario, Movimentacao, Tecnico, TipoEquipamento, StatusEquipamento } from '../types';

interface InventarioViewProps {
  equipamentos: Equipamento[];
  funcionarios: Funcionario[];
  movimentacoes: Movimentacao[];
  tecnicoAtivo: Tecnico;
  onAtribuirEquipamento: (idEquipamento: string, idFuncionario: string, observacoes: string) => void;
  onDevolverEquipamento: (idEquipamento: string, observacoes: string) => void;
  onEnviarManutencao: (idEquipamento: string, motivo: string) => void;
  onCadastrarEquipamento: (equipamento: Omit<Equipamento, 'dataUltimaMovimentacao'>) => void;
}

export const InventarioView: React.FC<InventarioViewProps> = ({
  equipamentos,
  funcionarios,
  movimentacoes,
  tecnicoAtivo,
  onAtribuirEquipamento,
  onDevolverEquipamento,
  onEnviarManutencao,
  onCadastrarEquipamento
}) => {
  const [subAba, setSubAba] = useState<'ativos' | 'movimentacoes'>('ativos');
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  // Modal states
  const [modalAtribuir, setModalAtribuir] = useState<Equipamento | null>(null);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<string>('');
  const [obsAtribuicao, setObsAtribuicao] = useState<string>('');

  const [modalNovoAtivo, setModalNovoAtivo] = useState<boolean>(false);
  const [novoId, setNovoId] = useState<string>('');
  const [novoTipo, setNovoTipo] = useState<TipoEquipamento>('Notebook');
  const [novaMarcaModelo, setNovaMarcaModelo] = useState<string>('');
  const [novoNumSerie, setNovoNumSerie] = useState<string>('');

  const [modalManutencao, setModalManutencao] = useState<Equipamento | null>(null);
  const [motivoManutencao, setMotivoManutencao] = useState<string>('');

  // Metrics
  const totalEquipamentos = equipamentos.length;
  const equipamentosEmUso = equipamentos.filter((e) => e.status === 'Em Uso').length;
  const equipamentosDisponiveis = equipamentos.filter((e) => e.status === 'Disponível').length;
  const equipamentosManutencao = equipamentos.filter((e) => e.status === 'Em Manutenção').length;

  // Filtered Equipment
  const equipamentosFiltrados = equipamentos.filter((eq) => {
    if (filtroTipo !== 'todos' && eq.tipo !== filtroTipo) return false;
    if (filtroStatus !== 'todos' && eq.status !== filtroStatus) return false;
    if (termoBusca.trim()) {
      const b = termoBusca.toLowerCase();
      const matchId = eq.id.toLowerCase().includes(b);
      const matchMarca = eq.marcaModelo.toLowerCase().includes(b);
      const matchSerie = eq.numSerie.toLowerCase().includes(b);
      const matchFunc = (eq.funcionarioAlocado || '').toLowerCase().includes(b);
      if (!matchId && !matchMarca && !matchSerie && !matchFunc) return false;
    }
    return true;
  });

  const handleConfirmarAtribuicao = () => {
    if (!modalAtribuir || !funcionarioSelecionado) {
      alert('Por favor, selecione um funcionário.');
      return;
    }
    onAtribuirEquipamento(modalAtribuir.id, funcionarioSelecionado, obsAtribuicao);
    setModalAtribuir(null);
    setFuncionarioSelecionado('');
    setObsAtribuicao('');
  };

  const handleConfirmarManutencao = () => {
    if (!modalManutencao || !motivoManutencao.trim()) {
      alert('Informe o motivo do envio para manutenção.');
      return;
    }
    onEnviarManutencao(modalManutencao.id, motivoManutencao);
    setModalManutencao(null);
    setMotivoManutencao('');
  };

  const handleSalvarNovoAtivo = () => {
    if (!novaMarcaModelo.trim() || !novoNumSerie.trim()) {
      alert('Preencha marca/modelo e número de série.');
      return;
    }
    const idFinal = novoId.trim() || `PAT-${Math.floor(1000 + Math.random() * 9000)}`;
    onCadastrarEquipamento({
      id: idFinal,
      tipo: novoTipo,
      marcaModelo: novaMarcaModelo,
      numSerie: novoNumSerie,
      status: 'Disponível',
      funcionarioAlocado: null
    });
    setModalNovoAtivo(false);
    setNovoId('');
    setNovaMarcaModelo('');
    setNovoNumSerie('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display">
            Inventário & Movimentações de TI
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Controle de máquinas e periféricos com atribuição automatizada e histórico de rastreabilidade na aba Movimentações.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalNovoAtivo(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Equipamento</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total de Ativos</span>
            <Laptop className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
            {totalEquipamentos}
          </div>
          <span className="text-[11px] text-slate-400">Patrimônios cadastrados</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Em Uso / Alocados</span>
            <UserPlus className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
            {equipamentosEmUso}
          </div>
          <span className="text-[11px] text-slate-400">Com colaboradores</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Disponíveis em Estoque</span>
            <CheckCircle className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-sky-600 dark:text-sky-400 font-mono tabular-nums">
            {equipamentosDisponiveis}
          </div>
          <span className="text-[11px] text-slate-400">Prontos para entrega</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Em Manutenção</span>
            <Wrench className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono tabular-nums">
            {equipamentosManutencao}
          </div>
          <span className="text-[11px] text-slate-400">No laboratório técnico</span>
        </div>
      </div>

      {/* Sub-tabs: Catálogo vs Movimentações */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setSubAba('ativos')}
          className={`pb-3 text-xs font-semibold transition border-b-2 ${
            subAba === 'ativos'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          Catálogo de Equipamentos ({equipamentos.length})
        </button>
        <button
          onClick={() => setSubAba('movimentacoes')}
          className={`pb-3 text-xs font-semibold transition border-b-2 flex items-center gap-1.5 ${
            subAba === 'movimentacoes'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Histórico de Movimentações ({movimentacoes.length})</span>
        </button>
      </div>

      {subAba === 'ativos' ? (
        <>
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Tipo</label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 py-2 px-3"
              >
                <option value="todos">Todos os Tipos</option>
                <option value="Notebook">Notebook</option>
                <option value="Desktop">Desktop</option>
                <option value="Monitor">Monitor</option>
                <option value="Impressora">Impressora</option>
                <option value="Periférico">Periférico</option>
                <option value="Servidor / Rede">Servidor / Rede</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Status</label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 py-2 px-3"
              >
                <option value="todos">Todos os Status</option>
                <option value="Disponível">Disponível</option>
                <option value="Em Uso">Em Uso</option>
                <option value="Em Manutenção">Em Manutenção</option>
                <option value="Descartado">Descartado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Busca por Série ou Modelo</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  placeholder="ID, modelo, serial ou funcionário..."
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 pl-9 pr-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Equipment Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Patrimônio</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Marca & Modelo</th>
                    <th className="py-3 px-4">Nº de Série</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Funcionário Alocado</th>
                    <th className="py-3 px-4 text-right">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {equipamentosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400">
                        Nenhum equipamento encontrado com estes critérios.
                      </td>
                    </tr>
                  ) : (
                    equipamentosFiltrados.map((eq) => {
                      const isDisponivel = eq.status === 'Disponível';
                      const isEmUso = eq.status === 'Em Uso';
                      const isManutencao = eq.status === 'Em Manutenção';

                      return (
                        <tr 
                          key={eq.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            {eq.id}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {eq.tipo}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                            {eq.marcaModelo}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {eq.numSerie}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                              isDisponivel
                                ? 'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800'
                                : isEmUso
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                : isManutencao
                                ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {eq.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {eq.funcionarioAlocado ? (
                              <div className="font-medium text-slate-800 dark:text-slate-200">
                                {eq.funcionarioAlocado}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Disponível em Estoque</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              
                              {/* Atribuir a Funcionário */}
                              {isDisponivel && (
                                <button
                                  onClick={() => {
                                    setModalAtribuir(eq);
                                    setFuncionarioSelecionado('');
                                    setObsAtribuicao('');
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1"
                                  title="Atribuir a um colaborador ativo e gerar log na aba Movimentações"
                                >
                                  <UserPlus className="w-3.5 h-3.5" />
                                  <span>Atribuir</span>
                                </button>
                              )}

                              {/* Devolver ao Estoque */}
                              {isEmUso && (
                                <button
                                  onClick={() => onDevolverEquipamento(eq.id, 'Devolução formal ao estoque de TI')}
                                  className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 font-semibold text-xs border border-blue-200 dark:border-blue-800 transition flex items-center gap-1"
                                  title="Devolver equipamento ao estoque (libera para novo usuário)"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Devolver</span>
                                </button>
                              )}

                              {/* Enviar para Manutenção */}
                              {!isManutencao && (
                                <button
                                  onClick={() => {
                                    setModalManutencao(eq);
                                    setMotivoManutencao('');
                                  }}
                                  className="px-2 py-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs transition"
                                  title="Enviar para manutenção preventiva ou corretiva"
                                >
                                  <Wrench className="w-3.5 h-3.5" />
                                </button>
                              )}
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
        </>
      ) : (
        /* Aba de Histórico de Movimentações */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Auditoria & Rastreabilidade (Aba Movimentações)
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              Todas as ações registram o e-mail do técnico e a data/hora exata
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/60 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">ID Movimentação</th>
                  <th className="py-3 px-4">Data/Hora</th>
                  <th className="py-3 px-4">Patrimônio</th>
                  <th className="py-3 px-4">Ação</th>
                  <th className="py-3 px-4">Funcionário Envolvido</th>
                  <th className="py-3 px-4">Técnico Responsável</th>
                  <th className="py-3 px-4">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {movimentacoes.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {mov.id}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {mov.dataHora}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {mov.idEquipamento}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        mov.tipoAcao === 'Atribuição'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                          : mov.tipoAcao === 'Devolução'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                          : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                      }`}>
                        {mov.tipoAcao}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {mov.funcionarioEnvolvido}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                      {mov.emailTecnicoResponsavel}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={mov.observacoes}>
                      {mov.observacoes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ATRIBUIR EQUIPAMENTO A FUNCIONÁRIO */}
      {modalAtribuir && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
                  Atribuir Equipamento
                </h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-mono font-semibold">
                  {modalAtribuir.id} · {modalAtribuir.marcaModelo}
                </p>
              </div>
              <button onClick={() => setModalAtribuir(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Selecione o Funcionário <span className="text-red-500">*</span>
                </label>
                <select
                  value={funcionarioSelecionado}
                  onChange={(e) => setFuncionarioSelecionado(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Selecione um funcionário ativo...</option>
                  {funcionarios
                    .filter((f) => f.status === 'Ativo')
                    .map((func) => (
                      <option key={func.id} value={func.nomeCompleto}>
                        {func.nomeCompleto} ({func.cargo} - {func.setor})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Observações da Movimentação
                </label>
                <textarea
                  rows={3}
                  value={obsAtribuicao}
                  onChange={(e) => setObsAtribuicao(e.target.value)}
                  placeholder="Ex: Entrega de notebook corporativo no kit de boas-vindas."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-[11px] text-blue-800 dark:text-blue-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  O sistema gravará automaticamente o e-mail do técnico autenticado (<strong>{tecnicoAtivo.email}</strong>) no log da planilha.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setModalAtribuir(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarAtribuicao}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar Atribuição</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ENVIAR PARA MANUTENÇÃO */}
      {modalManutencao && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
                  Enviar para Manutenção
                </h3>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-mono font-semibold">
                  {modalManutencao.id} · {modalManutencao.marcaModelo}
                </p>
              </div>
              <button onClick={() => setModalManutencao(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Motivo da Manutenção <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={motivoManutencao}
                  onChange={(e) => setMotivoManutencao(e.target.value)}
                  placeholder="Ex: Troca de tela danificada / Manutenção periódica de ventoinha."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setModalManutencao(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarManutencao}
                className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm transition"
              >
                Registrar Envio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVO EQUIPAMENTO */}
      {modalNovoAtivo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
                Cadastrar Novo Ativo de TI
              </h3>
              <button onClick={() => setModalNovoAtivo(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ID Patrimônio (opcional, gerado automático se vazio)
                </label>
                <input
                  type="text"
                  value={novoId}
                  onChange={(e) => setNovoId(e.target.value)}
                  placeholder="Ex: PAT-1050"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo de Equipamento
                </label>
                <select
                  value={novoTipo}
                  onChange={(e) => setNovoTipo(e.target.value as TipoEquipamento)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="Notebook">Notebook</option>
                  <option value="Desktop">Desktop</option>
                  <option value="Monitor">Monitor</option>
                  <option value="Impressora">Impressora</option>
                  <option value="Periférico">Periférico</option>
                  <option value="Servidor / Rede">Servidor / Rede</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Marca & Modelo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={novaMarcaModelo}
                  onChange={(e) => setNovaMarcaModelo(e.target.value)}
                  placeholder="Ex: Dell Latitude 3420 i7 16GB"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Número de Série / Service Tag <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={novoNumSerie}
                  onChange={(e) => setNovoNumSerie(e.target.value)}
                  placeholder="Ex: DELL-SN-99420"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setModalNovoAtivo(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarNovoAtivo}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition"
              >
                Salvar Equipamento
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
