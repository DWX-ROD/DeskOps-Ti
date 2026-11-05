import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  Laptop, 
  Headphones, 
  Mail, 
  Briefcase, 
  RotateCcw, 
  Search,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  UserCheck,
  Filter,
  Monitor,
  Printer,
  ShieldCheck,
  Plus,
  Trash2,
  ShieldAlert,
  Lock,
  UserPlus,
  AlertTriangle,
  X,
  Check,
  Edit2,
  ArrowRightLeft
} from 'lucide-react';
import { Funcionario, Equipamento, Chamado, Tecnico } from '../types';

interface FuncionarioHistoricoViewProps {
  funcionarios: Funcionario[];
  equipamentos: Equipamento[];
  chamados: Chamado[];
  tecnicoAtivo: Tecnico;
  setores: string[];
  onDevolverEquipamento: (idEquipamento: string, observacoes: string) => void;
  onAdicionarSetor: (nomeSetor: string) => boolean;
  onRemoverSetor: (nomeSetor: string) => boolean;
  onEditarSetor: (nomeAntigo: string, nomeNovo: string) => boolean;
  onAdicionarFuncionario: (funcionario: Funcionario) => boolean;
  onEditarFuncionario: (funcionario: Funcionario) => boolean;
  onRemoverFuncionario: (idFuncionario: string) => boolean;
}

export const FuncionarioHistoricoView: React.FC<FuncionarioHistoricoViewProps> = ({
  funcionarios,
  equipamentos,
  chamados,
  tecnicoAtivo,
  setores,
  onDevolverEquipamento,
  onAdicionarSetor,
  onRemoverSetor,
  onEditarSetor,
  onAdicionarFuncionario,
  onEditarFuncionario,
  onRemoverFuncionario
}) => {
  const isAdmin = tecnicoAtivo.papel === 'admin';

  // Estado do Setor Selecionado
  const [setorSelecionado, setSetorSelecionado] = useState<string>(
    setores[0] || 'Financeiro'
  );
  
  // Modo de visualização: 'consolidado' (setor inteiro) ou 'funcionario' (individual)
  const [modoVisualizacao, setModoVisualizacao] = useState<'consolidado' | 'funcionario'>('consolidado');
  
  // Funcionário selecionado dentro do setor
  const [funcionarioSelecionadoId, setFuncionarioSelecionadoId] = useState<string | null>(null);

  const [termoBusca, setTermoBusca] = useState<string>('');

  // Modais de Administração - Setores
  const [modalNovoSetor, setModalNovoSetor] = useState<boolean>(false);
  const [nomeNovoSetor, setNomeNovoSetor] = useState<string>('');

  const [modalEditarSetor, setModalEditarSetor] = useState<boolean>(false);
  const [novoNomeSetorEdit, setNovoNomeSetorEdit] = useState<string>('');

  // Modais de Administração - Funcionários
  const [modalNovoFuncionario, setModalNovoFuncionario] = useState<boolean>(false);
  const [novoFuncNome, setNovoFuncNome] = useState<string>('');
  const [novoFuncCpf, setNovoFuncCpf] = useState<string>('');
  const [novoFuncCargo, setNovoFuncCargo] = useState<string>('');
  const [novoFuncEmail, setNovoFuncEmail] = useState<string>('');
  const [novoFuncSetor, setNovoFuncSetor] = useState<string>(setorSelecionado);

  const [modalEditarFuncionario, setModalEditarFuncionario] = useState<Funcionario | null>(null);
  const [editFuncNome, setEditFuncNome] = useState<string>('');
  const [editFuncCpf, setEditFuncCpf] = useState<string>('');
  const [editFuncCargo, setEditFuncCargo] = useState<string>('');
  const [editFuncSetor, setEditFuncSetor] = useState<string>('');
  const [editFuncEmail, setEditFuncEmail] = useState<string>('');
  const [editFuncStatus, setEditFuncStatus] = useState<'Ativo' | 'Inativo'>('Ativo');

  const [modalAcessoNegado, setModalAcessoNegado] = useState<string | null>(null);

  // Lista consolidada de setores
  const todosSetores = Array.from(new Set([...setores, ...funcionarios.map(f => f.setor)]));

  // Funcionários do setor selecionado
  const funcionariosDoSetor = funcionarios.filter(
    (f) => f.setor.toLowerCase() === setorSelecionado.toLowerCase()
  );

  // Funcionário ativo detalhado
  const funcionarioAtivo = funcionarioSelecionadoId
    ? funcionarios.find((f) => f.id === funcionarioSelecionadoId) || funcionariosDoSetor[0]
    : funcionariosDoSetor[0];

  // Nomes dos funcionários do setor (para cruzar com inventário e chamados)
  const nomesFuncionariosSetor = funcionariosDoSetor.map((f) => f.nomeCompleto.toLowerCase());

  // Equipamentos alocados para o setor inteiro
  const equipamentosDoSetor = equipamentos.filter((eq) => {
    if (!eq.funcionarioAlocado) return false;
    const alocado = eq.funcionarioAlocado.toLowerCase();
    return nomesFuncionariosSetor.some((nome) => alocado.includes(nome) || nome.includes(alocado));
  });

  // Chamados abertos por qualquer membro do setor
  const chamadosDoSetor = chamados.filter((ch) => {
    if (ch.setor.toLowerCase() === setorSelecionado.toLowerCase()) return true;
    const sol = ch.nomeSolicitante.toLowerCase();
    return nomesFuncionariosSetor.some((nome) => sol.includes(nome) || nome.includes(sol));
  });

  // Equipamentos e chamados do funcionário selecionado especificamente
  const equipamentosFuncionario = funcionarioAtivo
    ? equipamentos.filter((eq) => {
        if (!eq.funcionarioAlocado) return false;
        const alocado = eq.funcionarioAlocado.toLowerCase();
        return (
          alocado.includes(funcionarioAtivo.nomeCompleto.toLowerCase()) ||
          funcionarioAtivo.nomeCompleto.toLowerCase().includes(alocado)
        );
      })
    : [];

  const chamadosFuncionario = funcionarioAtivo
    ? chamados.filter((ch) => {
        const sol = ch.nomeSolicitante.toLowerCase();
        const em = ch.emailSolicitante.toLowerCase();
        return (
          sol.includes(funcionarioAtivo.nomeCompleto.toLowerCase()) ||
          funcionarioAtivo.nomeCompleto.toLowerCase().includes(sol) ||
          em === funcionarioAtivo.email.toLowerCase()
        );
      })
    : [];

  // Filtro de busca geral
  const setoresFiltrados = todosSetores.filter((setor) => {
    if (!termoBusca.trim()) return true;
    const b = termoBusca.toLowerCase();
    if (setor.toLowerCase().includes(b)) return true;
    const temFuncionario = funcionarios.some(
      (f) => f.setor.toLowerCase() === setor.toLowerCase() && (f.nomeCompleto.toLowerCase().includes(b) || f.cargo.toLowerCase().includes(b))
    );
    return temFuncionario;
  });

  // ==========================================
  // HANDLERS DE ADMINISTRAÇÃO DE SETOR
  // ==========================================

  const handleSalvarNovoSetor = () => {
    if (!isAdmin) {
      setModalAcessoNegado('Apenas e-mails autenticados com papel de Administrador têm autorização para adicionar novos setores na empresa.');
      return;
    }
    const nomeLimpo = nomeNovoSetor.trim();
    if (!nomeLimpo) {
      alert('Por favor, informe o nome do setor.');
      return;
    }
    const sucesso = onAdicionarSetor(nomeLimpo);
    if (sucesso) {
      setSetorSelecionado(nomeLimpo);
      setModalNovoSetor(false);
      setNomeNovoSetor('');
    }
  };

  const handleAbrirEditarSetor = () => {
    if (!isAdmin) {
      setModalAcessoNegado('Apenas administradores podem renomear ou editar setores.');
      return;
    }
    setNovoNomeSetorEdit(setorSelecionado);
    setModalEditarSetor(true);
  };

  const handleConfirmarEditarSetor = () => {
    if (!isAdmin) return;
    const novoNome = novoNomeSetorEdit.trim();
    if (!novoNome) {
      alert('O nome do setor não pode estar em branco.');
      return;
    }
    if (novoNome.toLowerCase() === setorSelecionado.toLowerCase()) {
      setModalEditarSetor(false);
      return;
    }
    const sucesso = onEditarSetor(setorSelecionado, novoNome);
    if (sucesso) {
      setSetorSelecionado(novoNome);
      setModalEditarSetor(false);
    }
  };

  const handleRemoverSetorClick = (nomeSetor: string) => {
    if (!isAdmin) {
      setModalAcessoNegado('Apenas e-mails autenticados com papel de Administrador têm permissão para remover setores da empresa.');
      return;
    }

    const funcsNoSetor = funcionarios.filter((f) => f.setor.toLowerCase() === nomeSetor.toLowerCase());
    if (funcsNoSetor.length > 0) {
      alert(`Não é possível remover o setor "${nomeSetor}" pois ainda existem ${funcsNoSetor.length} colaborador(es) cadastrados nele. Transfira os colaboradores para outro setor antes.`);
      return;
    }

    if (confirm(`Tem certeza de que deseja remover permanentemente o setor "${nomeSetor}" da lista corporativa?`)) {
      const sucesso = onRemoverSetor(nomeSetor);
      if (sucesso) {
        const restante = todosSetores.filter(s => s !== nomeSetor);
        setSetorSelecionado(restante[0] || 'Geral');
      }
    }
  };

  // ==========================================
  // HANDLERS DE ADMINISTRAÇÃO DE FUNCIONÁRIOS
  // ==========================================

  const handleSalvarNovoFuncionario = () => {
    if (!isAdmin) {
      setModalAcessoNegado('Apenas e-mails autenticados com papel de Administrador têm autorização para cadastrar colaboradores.');
      return;
    }
    if (!novoFuncNome.trim() || !novoFuncEmail.trim() || !novoFuncCargo.trim()) {
      alert('Preencha Nome Completo, E-mail e Cargo.');
      return;
    }

    const novoId = `FUNC-${Math.floor(1000 + Math.random() * 9000)}`;
    const novoFunc: Funcionario = {
      id: novoId,
      nomeCompleto: novoFuncNome.trim(),
      cpf: novoFuncCpf.trim() || '000.000.000-00',
      cargo: novoFuncCargo.trim(),
      setor: novoFuncSetor || setorSelecionado,
      email: novoFuncEmail.trim(),
      status: 'Ativo'
    };

    const sucesso = onAdicionarFuncionario(novoFunc);
    if (sucesso) {
      setModalNovoFuncionario(false);
      setNovoFuncNome('');
      setNovoFuncCpf('');
      setNovoFuncCargo('');
      setNovoFuncEmail('');
    }
  };

  const handleAbrirEditarFuncionario = (func: Funcionario) => {
    if (!isAdmin) {
      setModalAcessoNegado('Apenas e-mails autenticados com papel de Administrador têm autorização para editar dados e setores de colaboradores.');
      return;
    }
    setModalEditarFuncionario(func);
    setEditFuncNome(func.nomeCompleto);
    setEditFuncCpf(func.cpf);
    setEditFuncCargo(func.cargo);
    setEditFuncSetor(func.setor);
    setEditFuncEmail(func.email);
    setEditFuncStatus(func.status);
  };

  const handleConfirmarEditarFuncionario = () => {
    if (!isAdmin || !modalEditarFuncionario) return;
    if (!editFuncNome.trim() || !editFuncEmail.trim() || !editFuncCargo.trim()) {
      alert('Nome, E-mail e Cargo são campos obrigatórios.');
      return;
    }

    const funcAtualizado: Funcionario = {
      ...modalEditarFuncionario,
      nomeCompleto: editFuncNome.trim(),
      cpf: editFuncCpf.trim(),
      cargo: editFuncCargo.trim(),
      setor: editFuncSetor,
      email: editFuncEmail.trim(),
      status: editFuncStatus
    };

    const sucesso = onEditarFuncionario(funcAtualizado);
    if (sucesso) {
      setModalEditarFuncionario(null);
    }
  };

  const handleRemoverFuncionarioClick = (func: Funcionario) => {
    if (!isAdmin) {
      setModalAcessoNegado('Apenas e-mails autenticados com papel de Administrador têm permissão para remover ou inativar colaboradores.');
      return;
    }

    const equipsComEle = equipamentos.filter(eq => eq.funcionarioAlocado?.toLowerCase().includes(func.nomeCompleto.toLowerCase()));
    if (equipsComEle.length > 0) {
      alert(`Não é possível remover "${func.nomeCompleto}" porque ele(a) possui ${equipsComEle.length} equipamento(s) sob custódia (ex: ${equipsComEle[0].id}). Realize a devolução do equipamento ao estoque primeiro.`);
      return;
    }

    if (confirm(`Confirma a remoção do colaborador "${func.nomeCompleto}" (${func.id}) do setor ${func.setor}?`)) {
      onRemoverFuncionario(func.id);
      if (funcionarioSelecionadoId === func.id) {
        setFuncionarioSelecionadoId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Building2 className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display">
              Gestão de Setores & Histórico 360º
            </h1>
            {isAdmin ? (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin: Edição Completa</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                <span>Modo Técnico (Leitura)</span>
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestão total de Departamentos: adicione, edite e remova setores e aloque ou transfira funcionários entre setores com autorização de <strong>Administrador</strong>.
          </p>
        </div>

        {/* Ações de Setor */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (!isAdmin) {
                setModalAcessoNegado('Apenas e-mails com acesso Administrador têm permissão para criar novos setores na empresa.');
                return;
              }
              setModalNovoSetor(true);
            }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5 ${
              isAdmin
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
            title={isAdmin ? 'Adicionar novo setor corporativo' : 'Ação restrita a administradores'}
          >
            <Plus className="w-4 h-4" />
            <span>Novo Setor</span>
          </button>
        </div>
      </div>

      {/* Grid de Seletor de Setores */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Setores Corporativos Cadastrados ({setoresFiltrados.length})
          </span>
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder="Buscar setores ou colaboradores..."
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 pl-8 pr-2.5 py-1.5 shadow-2xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {setoresFiltrados.map((setor) => {
            const isSelected = setor.toLowerCase() === setorSelecionado.toLowerCase();
            const funcsNoSetor = funcionarios.filter((f) => f.setor.toLowerCase() === setor.toLowerCase());
            const nomesSetor = funcsNoSetor.map((f) => f.nomeCompleto.toLowerCase());
            
            const equipsCount = equipamentos.filter((eq) => {
              if (!eq.funcionarioAlocado) return false;
              const alocado = eq.funcionarioAlocado.toLowerCase();
              return nomesSetor.some((n) => alocado.includes(n));
            }).length;

            const chamadosCount = chamados.filter((ch) => {
              if (ch.setor.toLowerCase() === setor.toLowerCase()) return true;
              return nomesSetor.some((n) => ch.nomeSolicitante.toLowerCase().includes(n));
            }).length;

            return (
              <button
                key={setor}
                onClick={() => {
                  setSetorSelecionado(setor);
                  setModoVisualizacao('consolidado');
                  setFuncionarioSelecionadoId(null);
                }}
                className={`p-3.5 rounded-xl text-left border transition relative flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {setor}
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        {funcsNoSetor.length} {funcsNoSetor.length === 1 ? 'colaborador' : 'colaboradores'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Laptop className="w-3 h-3 text-blue-500" />
                    <strong>{equipsCount}</strong> ativos
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Headphones className="w-3 h-3 text-emerald-500" />
                    <strong>{chamadosCount}</strong> chamados
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* PAINEL CENTRAL DO SETOR */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Cabeçalho do Setor Ativo com Botões de Edição e Ações Administrativas */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-display font-bold text-xl shadow-md shadow-blue-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-display">
                  Setor: {setorSelecionado}
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {funcionariosDoSetor.length} Colaboradores
                </span>

                {/* BOTÕES DE EDITAR E EXCLUIR SETOR (ADMIN) */}
                {isAdmin && (
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={handleAbrirEditarSetor}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition text-xs flex items-center gap-1"
                      title={`Renomear setor "${setorSelecionado}" (Exclusivo Administrador)`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium">Renomear</span>
                    </button>

                    <button
                      onClick={() => handleRemoverSetorClick(setorSelecionado)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition text-xs flex items-center gap-1"
                      title={`Remover setor "${setorSelecionado}" (Exclusivo Administrador)`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium text-red-600 dark:text-red-400">Excluir</span>
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Visão departamental integrada · Parque de ativos: <strong>{equipamentosDoSetor.length} equipamentos</strong> · Total de <strong>{chamadosDoSetor.length} chamados registrados</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Botão Adicionar Funcionário (Apenas Administrador) */}
            <button
              onClick={() => {
                if (!isAdmin) {
                  setModalAcessoNegado('Apenas e-mails com papel de Administrador têm autorização para cadastrar colaboradores na empresa.');
                  return;
                }
                setNovoFuncSetor(setorSelecionado);
                setModalNovoFuncionario(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs ${
                isAdmin
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
              title={isAdmin ? `Adicionar colaborador ao setor ${setorSelecionado}` : 'Ação restrita a administradores'}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Adicionar ao Setor</span>
            </button>

            {/* Seletor de Modo: Consolidado vs Funcionário */}
            <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs text-xs font-semibold">
              <button
                onClick={() => {
                  setModoVisualizacao('consolidado');
                  setFuncionarioSelecionadoId(null);
                }}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  modoVisualizacao === 'consolidado'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Visão do Setor</span>
              </button>

              <button
                onClick={() => {
                  setModoVisualizacao('funcionario');
                  if (!funcionarioSelecionadoId && funcionariosDoSetor.length > 0) {
                    setFuncionarioSelecionadoId(funcionariosDoSetor[0].id);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  modoVisualizacao === 'funcionario'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Colaborador Individual</span>
              </button>
            </div>
          </div>
        </div>

        {/* CONTEÚDO 1: VISÃO CONSOLIDADA DO SETOR */}
        {modoVisualizacao === 'consolidado' && (
          <div className="p-6 space-y-6">
            
            {/* Cards de Métricas do Setor */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Colaboradores do Setor</span>
                  <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                    {funcionariosDoSetor.length}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-medium">
                    {funcionariosDoSetor.filter(f => f.status === 'Ativo').length} ativos
                  </span>
                </div>
                <Users className="w-8 h-8 text-blue-500/40" />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Equipamentos em Custódia</span>
                  <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
                    {equipamentosDoSetor.length}
                  </div>
                  <span className="text-[11px] text-slate-500">Distribuídos no setor</span>
                </div>
                <Laptop className="w-8 h-8 text-blue-500/40" />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Histórico de Chamados</span>
                  <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {chamadosDoSetor.length}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {chamadosDoSetor.filter(c => c.status === 'Concluído').length} resolvidos
                  </span>
                </div>
                <Headphones className="w-8 h-8 text-emerald-500/40" />
              </div>
            </div>

            {/* Lista dos Funcionários Registrados no Setor */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Funcionários Registrados em {setorSelecionado} ({funcionariosDoSetor.length})</span>
                </h3>
                <span className="text-xs text-slate-400">
                  {isAdmin ? 'Edição e remoção de funcionários liberadas' : 'Modo visualização'}
                </span>
              </div>

              {funcionariosDoSetor.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs space-y-2">
                  <p>Nenhum funcionário cadastrado neste setor.</p>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setNovoFuncSetor(setorSelecionado);
                        setModalNovoFuncionario(true);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white"
                    >
                      Cadastrar Primeiro Colaborador
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {funcionariosDoSetor.map((func) => {
                    const equipsFunc = equipamentos.filter(eq => eq.funcionarioAlocado?.toLowerCase().includes(func.nomeCompleto.toLowerCase()));
                    const chamadosFunc = chamados.filter(ch => ch.nomeSolicitante.toLowerCase().includes(func.nomeCompleto.toLowerCase()));

                    return (
                      <div
                        key={func.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-blue-400 transition shadow-2xs flex flex-col justify-between gap-3 group relative"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center font-display border border-blue-200 dark:border-blue-800">
                              {func.nomeCompleto.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                {func.nomeCompleto}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Briefcase className="w-3 h-3" />
                                <span>{func.cargo}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              func.status === 'Ativo'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {func.status}
                            </span>

                            {/* BOTÕES DE EDITAR E REMOVER DO ADMIN */}
                            {isAdmin && (
                              <div className="flex items-center gap-0.5">
                                <button
                                  onClick={() => handleAbrirEditarFuncionario(func)}
                                  className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                                  title={`Editar dados ou transferir ${func.nomeCompleto} de setor`}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRemoverFuncionarioClick(func)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                                  title={`Remover ${func.nomeCompleto} do setor`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                          <div className="flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{func.email}</span>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              {equipsFunc.length} {equipsFunc.length === 1 ? 'máquina' : 'máquinas'}
                            </span>
                            <span className="text-slate-400">
                              {chamadosFunc.length} chamados
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setFuncionarioSelecionadoId(func.id);
                            setModoVisualizacao('funcionario');
                          }}
                          className="w-full py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold transition flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700"
                        >
                          <span>Ver Histórico 360º</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Equipamentos Alocados ao Setor Inteiro */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-blue-600" />
                  <span>Equipamentos em Custódia no Setor ({equipamentosDoSetor.length})</span>
                </h3>
              </div>

              {equipamentosDoSetor.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
                  Nenhum equipamento alocado para membros deste setor no momento.
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                          <th className="py-2.5 px-4">Patrimônio</th>
                          <th className="py-2.5 px-4">Tipo</th>
                          <th className="py-2.5 px-4">Marca & Modelo</th>
                          <th className="py-2.5 px-4">Nº de Série</th>
                          <th className="py-2.5 px-4">Colaborador em Posse</th>
                          <th className="py-2.5 px-4 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {equipamentosDoSetor.map((eq) => (
                          <tr key={eq.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                            <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                              {eq.id}
                            </td>
                            <td className="py-3 px-4">{eq.tipo}</td>
                            <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{eq.marcaModelo}</td>
                            <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{eq.numSerie}</td>
                            <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                              {eq.funcionarioAlocado}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => onDevolverEquipamento(eq.id, `Devolução pelo setor ${setorSelecionado}`)}
                                className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 text-[11px] font-semibold transition"
                              >
                                Devolver
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Chamados do Setor */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-emerald-600" />
                  <span>Histórico de Chamados Abertos pelo Setor ({chamadosDoSetor.length})</span>
                </h3>
              </div>

              {chamadosDoSetor.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
                  Nenhum chamado aberto por colaboradores deste setor.
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                          <th className="py-2.5 px-4">Protocolo</th>
                          <th className="py-2.5 px-4">Data</th>
                          <th className="py-2.5 px-4">Solicitante</th>
                          <th className="py-2.5 px-4">Categoria do Problema</th>
                          <th className="py-2.5 px-4">Prioridade</th>
                          <th className="py-2.5 px-4">Status</th>
                          <th className="py-2.5 px-4">Técnico</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {chamadosDoSetor.map((ch) => (
                          <tr key={ch.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                            <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                              {ch.id}
                            </td>
                            <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                              {new Date(ch.dataHoraAbertura).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                              {ch.nomeSolicitante}
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300 max-w-xs truncate" title={ch.categoria}>
                              {ch.categoria}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                ch.prioridade === 'Crítica' ? 'bg-red-100 text-red-800' :
                                ch.prioridade === 'Alta' ? 'bg-amber-100 text-amber-800' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {ch.prioridade}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                              {ch.status}
                            </td>
                            <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                              {ch.emailTecnicoResponsavel || 'Não atribuído'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* CONTEÚDO 2: DETALHES DE UM COLABORADOR ESPECÍFICO DO SETOR */}
        {modoVisualizacao === 'funcionario' && (
          <div className="p-6 space-y-6">
            
            {/* Seletor rápido de colaboradores do setor */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 shrink-0">Colaboradores de {setorSelecionado}:</span>
              {funcionariosDoSetor.map((func) => (
                <button
                  key={func.id}
                  onClick={() => setFuncionarioSelecionadoId(func.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1.5 ${
                    funcionarioAtivo?.id === func.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <span>{func.nomeCompleto}</span>
                </button>
              ))}
            </div>

            {funcionarioAtivo ? (
              <>
                {/* Perfil Individual com Botões de Edição */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center font-display">
                        {funcionarioAtivo.nomeCompleto.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            {funcionarioAtivo.nomeCompleto}
                          </h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            funcionarioAtivo.status === 'Ativo'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {funcionarioAtivo.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span>{funcionarioAtivo.cargo}</span>
                          <span>·</span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400">{funcionarioAtivo.setor}</span>
                          <span>·</span>
                          <span>{funcionarioAtivo.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right mr-2">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Matrícula</span>
                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                          {funcionarioAtivo.id}
                        </span>
                      </div>

                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleAbrirEditarFuncionario(funcionarioAtivo)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition"
                            title="Editar dados e transferir colaborador de setor"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          <button
                            onClick={() => handleRemoverFuncionarioClick(funcionarioAtivo)}
                            className="px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-1 transition"
                            title="Remover colaborador do setor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remover</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Equipamentos Alocados ao Colaborador */}
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-blue-600" />
                    <span>Equipamentos em Custódia de {funcionarioAtivo.nomeCompleto} ({equipamentosFuncionario.length})</span>
                  </h4>

                  {equipamentosFuncionario.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
                      Nenhum equipamento de TI vinculado a este colaborador.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {equipamentosFuncionario.map((eq) => (
                        <div key={eq.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">{eq.id}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">{eq.tipo}</span>
                            </div>
                            <div className="font-bold text-xs text-slate-900 dark:text-slate-100">{eq.marcaModelo}</div>
                            <div className="font-mono text-[10px] text-slate-400 mt-0.5">S/N: {eq.numSerie}</div>
                          </div>
                          <button
                            onClick={() => onDevolverEquipamento(eq.id, `Devolução formal de ${funcionarioAtivo.nomeCompleto}`)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-blue-600 dark:text-blue-400 text-xs font-semibold"
                          >
                            Devolver
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chamados Abertos pelo Colaborador */}
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-emerald-600" />
                    <span>Chamados Pessoais Registrados ({chamadosFuncionario.length})</span>
                  </h4>

                  {chamadosFuncionario.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
                      Este colaborador não possui chamados anteriores registrados.
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                              <th className="py-2.5 px-4">Protocolo</th>
                              <th className="py-2.5 px-4">Abertura</th>
                              <th className="py-2.5 px-4">Categoria</th>
                              <th className="py-2.5 px-4">Prioridade</th>
                              <th className="py-2.5 px-4">Status</th>
                              <th className="py-2.5 px-4">Técnico</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {chamadosFuncionario.map((ch) => (
                              <tr key={ch.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                                <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">{ch.id}</td>
                                <td className="py-3 px-4 text-slate-500">{new Date(ch.dataHoraAbertura).toLocaleDateString('pt-BR')}</td>
                                <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{ch.categoria}</td>
                                <td className="py-3 px-4">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                    ch.prioridade === 'Crítica' ? 'bg-red-100 text-red-800' :
                                    ch.prioridade === 'Alta' ? 'bg-amber-100 text-amber-800' :
                                    'bg-slate-100 text-slate-700'
                                  }`}>
                                    {ch.prioridade}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{ch.status}</td>
                                <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{ch.emailTecnicoResponsavel || 'Não atribuído'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Selecione um funcionário na lista acima.
              </div>
            )}

          </div>
        )}

      </div>

      {/* MODAL: NOVO SETOR (EXCLUSIVO ADMIN) */}
      {modalNovoSetor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-600">
                  <Building2 className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                  Adicionar Novo Setor Corporativo
                </h3>
              </div>
              <button onClick={() => setModalNovoSetor(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome do Setor / Departamento <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nomeNovoSetor}
                  onChange={(e) => setNomeNovoSetor(e.target.value)}
                  placeholder="Ex: Logística & Suprimentos, Jurídico..."
                  className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-[11px] text-blue-800 dark:text-blue-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Ação validada pelo Administrador: <strong>{tecnicoAtivo.email}</strong>.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setModalNovoSetor(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarNovoSetor}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition"
              >
                Criar Setor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR / RENOMEAR SETOR (ADMIN) */}
      {modalEditarSetor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-600">
                  <Edit2 className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                  Renomear Setor ({setorSelecionado})
                </h3>
              </div>
              <button onClick={() => setModalEditarSetor(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Novo Nome para o Setor <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={novoNomeSetorEdit}
                  onChange={(e) => setNovoNomeSetorEdit(e.target.value)}
                  className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-800 dark:text-amber-300">
                💡 Ao renomear o setor, todos os <strong>{funcionariosDoSetor.length} colaboradores</strong> e os chamados vinculados serão automaticamente transferidos para o novo nome.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setModalEditarSetor(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarEditarSetor}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition"
              >
                Salvar Novo Nome
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVO FUNCIONÁRIO (EXCLUSIVO ADMIN) */}
      {modalNovoFuncionario && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                  <UserPlus className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                  Adicionar Funcionário ao Setor
                </h3>
              </div>
              <button onClick={() => setModalNovoFuncionario(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={novoFuncNome}
                    onChange={(e) => setNovoFuncNome(e.target.value)}
                    placeholder="Ex: Gabriela Castro"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    CPF
                  </label>
                  <input
                    type="text"
                    value={novoFuncCpf}
                    onChange={(e) => setNovoFuncCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cargo / Função <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={novoFuncCargo}
                    onChange={(e) => setNovoFuncCargo(e.target.value)}
                    placeholder="Ex: Coordenador Fiscal"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Setor Alocado <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={novoFuncSetor}
                    onChange={(e) => setNovoFuncSetor(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    {todosSetores.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail Corporativo <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={novoFuncEmail}
                  onChange={(e) => setNovoFuncEmail(e.target.value)}
                  placeholder="gabriela.castro@empresa.com"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  O colaborador será gravado na aba <code>Funcionarios</code> com status Ativo.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setModalNovoFuncionario(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarNovoFuncionario}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition"
              >
                Salvar Colaborador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR FUNCIONÁRIO & MUDAR DE SETOR (ADMIN) */}
      {modalEditarFuncionario && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-600">
                  <Edit2 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                    Editar Colaborador ({modalEditarFuncionario.id})
                  </h3>
                  <span className="text-[10px] text-amber-600 font-medium">Exclusivo Administrador</span>
                </div>
              </div>
              <button onClick={() => setModalEditarFuncionario(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFuncNome}
                    onChange={(e) => setEditFuncNome(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    CPF
                  </label>
                  <input
                    type="text"
                    value={editFuncCpf}
                    onChange={(e) => setEditFuncCpf(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cargo / Função <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFuncCargo}
                    onChange={(e) => setEditFuncCargo(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* TRANSFERÊNCIA / MUDANÇA DE SETOR */}
                <div>
                  <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Setor Alocado (Transferir)</span>
                  </label>
                  <select
                    value={editFuncSetor}
                    onChange={(e) => setEditFuncSetor(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30 text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    {todosSetores.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail Corporativo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={editFuncEmail}
                    onChange={(e) => setEditFuncEmail(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status do Cadastro
                  </label>
                  <select
                    value={editFuncStatus}
                    onChange={(e) => setEditFuncStatus(e.target.value as 'Ativo' | 'Inativo')}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setModalEditarFuncionario(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarEditarFuncionario}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ACESSO NEGADO / RESTRITO */}
      {modalAcessoNegado && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 dark:border-red-900 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Permissão Restrita a Administradores
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {modalAcessoNegado}
            </p>
            <div className="pt-2">
              <button
                onClick={() => setModalAcessoNegado(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold hover:bg-slate-800"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
