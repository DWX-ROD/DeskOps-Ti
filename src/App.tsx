/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar, TabType } from './components/Navbar';
import { ChamadosView } from './components/ChamadosView';
import { InventarioView } from './components/InventarioView';
import { FuncionarioHistoricoView } from './components/FuncionarioHistoricoView';
import { ConsultaProtocoloView } from './components/ConsultaProtocoloView';
import { NovoChamadoView } from './components/NovoChamadoView';
import { CentralCodigosView } from './components/CentralCodigosView';
import { SimuladorEmailView } from './components/SimuladorEmailView';

import { Chamado, Funcionario, Equipamento, Movimentacao, Tecnico, StatusChamado } from './types';
import { 
  INITIAL_CHAMADOS, 
  INITIAL_FUNCIONARIOS, 
  INITIAL_EQUIPAMENTOS, 
  INITIAL_MOVIMENTACOES, 
  TECNICO_PADRAO,
  SETORES_EMPRESA
} from './data/initialData';
import { calcularSla } from './utils/sla';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('chamados');
  const [chamados, setChamados] = useState<Chamado[]>(INITIAL_CHAMADOS);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>(INITIAL_FUNCIONARIOS);
  const [setores, setSetores] = useState<string[]>(SETORES_EMPRESA);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>(INITIAL_EQUIPAMENTOS);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>(INITIAL_MOVIMENTACOES);
  const [tecnicoAtivo, setTecnicoAtivo] = useState<Tecnico>(TECNICO_PADRAO);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [notificacao, setNotificacao] = useState<{ mensagem: string; tipo: 'sucesso' | 'info' } | null>(null);

  // Sync dark class on document root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const exibirNotificacao = (mensagem: string, tipo: 'sucesso' | 'info' = 'sucesso') => {
    setNotificacao({ mensagem, tipo });
    setTimeout(() => {
      setNotificacao(null);
    }, 4000);
  };

  // 1-Click "Assumir Chamado"
  const handleAssumirChamado = (id: string) => {
    const agora = new Date();
    const dataHoraStr = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    setChamados((prev) =>
      prev.map((ch) => {
        if (ch.id === id) {
          const obsAnterior = ch.observacoesTecnicas || '';
          const novaObs = obsAnterior 
            ? `${obsAnterior}\n[${dataHoraStr}] Chamado assumido por ${tecnicoAtivo.email}.`
            : `[${dataHoraStr}] Chamado assumido por ${tecnicoAtivo.email}.`;

          return {
            ...ch,
            emailTecnicoResponsavel: tecnicoAtivo.email,
            status: 'Em Andamento',
            observacoesTecnicas: novaObs
          };
        }
        return ch;
      })
    );

    exibirNotificacao(`Chamado ${id} assumido com sucesso por ${tecnicoAtivo.nome} (${tecnicoAtivo.email})! Status alterado para Em Andamento.`);
  };

  // Finalizar / Concluir Chamado
  const handleConcluirChamado = (id: string, observacoes: string) => {
    const agora = new Date();
    const dataHoraStr = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    setChamados((prev) =>
      prev.map((ch) => {
        if (ch.id === id) {
          const obsAnterior = ch.observacoesTecnicas || '';
          const novaObs = `${obsAnterior}\n[${dataHoraStr} - Resolução por ${tecnicoAtivo.email}]: ${observacoes}`;
          const diffMs = agora.getTime() - new Date(ch.dataHoraAbertura).getTime();
          const diffHoras = (diffMs / (1000 * 60 * 60)).toFixed(1);

          return {
            ...ch,
            status: 'Concluído',
            observacoesTecnicas: novaObs,
            dataFechamento: agora.toISOString(),
            tempoAtendimentoSla: `${diffHoras}h (Concluído)`
          };
        }
        return ch;
      })
    );

    exibirNotificacao(`Chamado ${id} concluído com sucesso! E-mail de encerramento enviado ao solicitante.`);
  };

  // Atualizar Status genérico
  const handleAtualizarStatus = (id: string, novoStatus: StatusChamado, observacao?: string) => {
    const agora = new Date();
    const dataHoraStr = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    setChamados((prev) =>
      prev.map((ch) => {
        if (ch.id === id) {
          let obs = ch.observacoesTecnicas || '';
          if (observacao) {
            obs = `${obs}\n[${dataHoraStr} - ${tecnicoAtivo.email}]: ${observacao}`;
          }
          return {
            ...ch,
            status: novoStatus,
            observacoesTecnicas: obs
          };
        }
        return ch;
      })
    );

    exibirNotificacao(`Status do chamado ${id} atualizado para ${novoStatus}.`);
  };

  // Atribuir Equipamento a Funcionário (Atualiza Inventário e grava em Movimentações)
  const handleAtribuirEquipamento = (idEquipamento: string, nomeFuncionario: string, observacoes: string) => {
    const agora = new Date();
    const agoraStr = agora.toISOString().replace('T', ' ').slice(0, 19);

    // 1. Atualiza Inventário
    setEquipamentos((prev) =>
      prev.map((eq) => {
        if (eq.id === idEquipamento) {
          return {
            ...eq,
            status: 'Em Uso',
            funcionarioAlocado: nomeFuncionario,
            dataUltimaMovimentacao: agoraStr
          };
        }
        return eq;
      })
    );

    // 2. Grava auditoria em Movimentações
    const novoIdMov = `MOV-${agora.getFullYear()}${(agora.getMonth() + 1).toString().padStart(2, '0')}${agora.getDate().toString().padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;
    const novaMov: Movimentacao = {
      id: novoIdMov,
      dataHora: agoraStr,
      idEquipamento,
      tipoAcao: 'Atribuição',
      funcionarioEnvolvido: nomeFuncionario,
      emailTecnicoResponsavel: tecnicoAtivo.email,
      observacoes: observacoes || 'Atribuição realizada no painel web'
    };
    setMovimentacoes((prev) => [novaMov, ...prev]);

    exibirNotificacao(`Equipamento ${idEquipamento} atribuído a ${nomeFuncionario} e registrado na aba Movimentações.`);
  };

  // Devolver Equipamento ao Estoque
  const handleDevolverEquipamento = (idEquipamento: string, observacoes: string) => {
    const agora = new Date();
    const agoraStr = agora.toISOString().replace('T', ' ').slice(0, 19);
    const eqAtual = equipamentos.find((e) => e.id === idEquipamento);
    const funcAnterior = eqAtual?.funcionarioAlocado || 'Desconhecido';

    setEquipamentos((prev) =>
      prev.map((eq) => {
        if (eq.id === idEquipamento) {
          return {
            ...eq,
            status: 'Disponível',
            funcionarioAlocado: null,
            dataUltimaMovimentacao: agoraStr
          };
        }
        return eq;
      })
    );

    const novoIdMov = `MOV-${agora.getFullYear()}${(agora.getMonth() + 1).toString().padStart(2, '0')}${agora.getDate().toString().padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;
    const novaMov: Movimentacao = {
      id: novoIdMov,
      dataHora: agoraStr,
      idEquipamento,
      tipoAcao: 'Devolução',
      funcionarioEnvolvido: funcAnterior,
      emailTecnicoResponsavel: tecnicoAtivo.email,
      observacoes: observacoes || 'Devolução ao estoque de TI'
    };
    setMovimentacoes((prev) => [novaMov, ...prev]);

    exibirNotificacao(`Equipamento ${idEquipamento} devolvido ao estoque com status Disponível.`);
  };

  // Enviar para Manutenção
  const handleEnviarManutencao = (idEquipamento: string, motivo: string) => {
    const agora = new Date();
    const agoraStr = agora.toISOString().replace('T', ' ').slice(0, 19);

    setEquipamentos((prev) =>
      prev.map((eq) => {
        if (eq.id === idEquipamento) {
          return {
            ...eq,
            status: 'Em Manutenção',
            dataUltimaMovimentacao: agoraStr
          };
        }
        return eq;
      })
    );

    const novoIdMov = `MOV-${agora.getFullYear()}${(agora.getMonth() + 1).toString().padStart(2, '0')}${agora.getDate().toString().padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;
    const novaMov: Movimentacao = {
      id: novoIdMov,
      dataHora: agoraStr,
      idEquipamento,
      tipoAcao: 'Manutenção',
      funcionarioEnvolvido: 'Estoque / Laboratório',
      emailTecnicoResponsavel: tecnicoAtivo.email,
      observacoes: motivo || 'Envio para manutenção técnica'
    };
    setMovimentacoes((prev) => [novaMov, ...prev]);

    exibirNotificacao(`Equipamento ${idEquipamento} enviado para manutenção.`);
  };

  // Cadastrar novo Ativo
  const handleCadastrarEquipamento = (dados: Omit<Equipamento, 'dataUltimaMovimentacao'>) => {
    const agora = new Date();
    const agoraStr = agora.toISOString().replace('T', ' ').slice(0, 19);

    const novo: Equipamento = {
      ...dados,
      dataUltimaMovimentacao: agoraStr
    };

    setEquipamentos((prev) => [novo, ...prev]);
    exibirNotificacao(`Novo ativo ${novo.id} cadastrado no inventário com sucesso!`);
  };

  // Administração de Setores (Exclusivo Administrador)
  const handleAdicionarSetor = (nomeSetor: string): boolean => {
    if (tecnicoAtivo.papel !== 'admin') {
      exibirNotificacao('Acesso negado: Apenas administradores podem cadastrar setores.', 'info');
      return false;
    }
    const existe = setores.some((s) => s.toLowerCase() === nomeSetor.toLowerCase());
    if (existe) {
      alert(`O setor "${nomeSetor}" já existe.`);
      return false;
    }
    setSetores((prev) => [...prev, nomeSetor]);
    exibirNotificacao(`Setor "${nomeSetor}" cadastrado com sucesso pelo administrador.`);
    return true;
  };

  const handleRemoverSetor = (nomeSetor: string): boolean => {
    if (tecnicoAtivo.papel !== 'admin') {
      exibirNotificacao('Acesso negado: Apenas administradores podem remover setores.', 'info');
      return false;
    }
    setSetores((prev) => prev.filter((s) => s.toLowerCase() !== nomeSetor.toLowerCase()));
    exibirNotificacao(`Setor "${nomeSetor}" removido com sucesso pelo administrador.`);
    return true;
  };

  // Administração de Funcionários (Exclusivo Administrador)
  const handleAdicionarFuncionario = (novo: Funcionario): boolean => {
    if (tecnicoAtivo.papel !== 'admin') {
      exibirNotificacao('Acesso negado: Apenas administradores podem cadastrar colaboradores.', 'info');
      return false;
    }
    setFuncionarios((prev) => [novo, ...prev]);
    exibirNotificacao(`Colaborador(a) "${novo.nomeCompleto}" (${novo.cargo}) cadastrado(a) com sucesso.`);
    return true;
  };

  const handleRemoverFuncionario = (idFuncionario: string): boolean => {
    if (tecnicoAtivo.papel !== 'admin') {
      exibirNotificacao('Acesso negado: Apenas administradores podem remover colaboradores.', 'info');
      return false;
    }
    const func = funcionarios.find((f) => f.id === idFuncionario);
    setFuncionarios((prev) => prev.filter((f) => f.id !== idFuncionario));
    exibirNotificacao(`Colaborador "${func?.nomeCompleto || idFuncionario}" removido com sucesso.`);
    return true;
  };

  // Criar Chamado
  const handleCriarChamado = (novo: Chamado) => {
    setChamados((prev) => [novo, ...prev]);
    exibirNotificacao(`Chamado ${novo.id} registrado com sucesso na planilha Chamados!`);
  };

  // Alertas e Contadores
  const chamadosAbertosCount = chamados.filter((c) => c.status === 'Aberto').length;
  const slaCriticoCount = chamados.filter((c) => {
    if (c.status === 'Concluído' || c.status === 'Cancelado') return false;
    const s = calcularSla(c.dataHoraAbertura, c.prioridade, c.status);
    return s.statusSla === 'estourado' || s.statusSla === 'em_risco';
  }).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tecnicoAtivo={tecnicoAtivo}
        setTecnicoAtivo={setTecnicoAtivo}
        chamadosAbertosCount={chamadosAbertosCount}
        slaCriticoCount={slaCriticoCount}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Toast Notification */}
      {notificacao && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white border border-slate-700 shadow-2xl text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{notificacao.mensagem}</span>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'chamados' && (
          <ChamadosView
            chamados={chamados}
            tecnicoAtivo={tecnicoAtivo}
            onAssumirChamado={handleAssumirChamado}
            onConcluirChamado={handleConcluirChamado}
            onAtualizarStatus={handleAtualizarStatus}
            onAbrirNovoChamadoTab={() => setActiveTab('novo_chamado')}
          />
        )}

        {activeTab === 'inventario' && (
          <InventarioView
            equipamentos={equipamentos}
            funcionarios={funcionarios}
            movimentacoes={movimentacoes}
            tecnicoAtivo={tecnicoAtivo}
            onAtribuirEquipamento={handleAtribuirEquipamento}
            onDevolverEquipamento={handleDevolverEquipamento}
            onEnviarManutencao={handleEnviarManutencao}
            onCadastrarEquipamento={handleCadastrarEquipamento}
          />
        )}

        {activeTab === 'historico' && (
          <FuncionarioHistoricoView
            funcionarios={funcionarios}
            equipamentos={equipamentos}
            chamados={chamados}
            tecnicoAtivo={tecnicoAtivo}
            setores={setores}
            onDevolverEquipamento={handleDevolverEquipamento}
            onAdicionarSetor={handleAdicionarSetor}
            onRemoverSetor={handleRemoverSetor}
            onAdicionarFuncionario={handleAdicionarFuncionario}
            onRemoverFuncionario={handleRemoverFuncionario}
          />
        )}

        {activeTab === 'consulta' && (
          <ConsultaProtocoloView chamados={chamados} />
        )}

        {activeTab === 'novo_chamado' && (
          <NovoChamadoView
            onCriarChamado={handleCriarChamado}
            onIrParaConsulta={(protocolo) => {
              setActiveTab('consulta');
            }}
          />
        )}

        {activeTab === 'codigos' && (
          <CentralCodigosView />
        )}

        {activeTab === 'emails' && (
          <SimuladorEmailView tecnicoAtivo={tecnicoAtivo} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            DeskOps TI · Sistema de Helpdesk e Inventário para Google Workspace (Apps Script & Sheets)
          </span>
          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setActiveTab('codigos')}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Exportar Scripts Google (.gs)
            </button>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span>Autenticação: <code>Session.getActiveUser().getEmail()</code></span>
          </div>
        </div>
      </footer>

    </div>
  );
}
