/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Navbar, TabType } from './components/Navbar';
import { ChamadosView } from './components/ChamadosView';
import { InventarioView } from './components/InventarioView';
import { FuncionarioHistoricoView } from './components/FuncionarioHistoricoView';
import { ConsultaProtocoloView } from './components/ConsultaProtocoloView';
import { NovoChamadoView } from './components/NovoChamadoView';
import { CentralCodigosView } from './components/CentralCodigosView';
import { SimuladorEmailView } from './components/SimuladorEmailView';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { SheetsConnectionBanner } from './components/SheetsConnectionBanner';
import { DestructiveConfirmModal } from './components/DestructiveConfirmModal';

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
import { initAuth, getAccessToken } from './services/auth';
import { 
  PlanilhaMetadados, 
  obterEGarantirEstruturaPlanilha, 
  carregarDadosDoGoogleSheets, 
  gravarNovoChamadoNaPlanilha, 
  atualizarChamadoNaPlanilha, 
  salvarEquipamentoNaPlanilha, 
  removerEquipamentoDaPlanilha, 
  gravarMovimentacaoNaPlanilha, 
  salvarFuncionarioNaPlanilha, 
  removerFuncionarioDaPlanilha,
  NOMES_ABAS
} from './services/googleSheets';

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

  // Estados da Conexão com Google Sheets (Banco de Dados Principal)
  const [userGoogle, setUserGoogle] = useState<User | null>(null);
  const [planilhaAtiva, setPlanilhaAtiva] = useState<PlanilhaMetadados | null>(null);
  const [modalSheetsAberto, setModalSheetsAberto] = useState<boolean>(false);
  const [isSincronizando, setIsSincronizando] = useState<boolean>(false);
  const [ultimaSincronizacao, setUltimaSincronizacao] = useState<Date | null>(null);

  // Modal de Confirmação para Operações Destrutivas (Requisito Workspace API)
  const [modalDestrutivo, setModalDestrutivo] = useState<{
    isOpen: boolean;
    titulo: string;
    descricao: string;
    itemIdentificador?: string;
    impacto?: string;
    onConfirm: () => void;
    isLoading?: boolean;
  }>({
    isOpen: false,
    titulo: '',
    descricao: '',
    onConfirm: () => {}
  });

  // Sync dark class on document root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Inicializa listener de autenticação Google e restaura conexão salva com a planilha
  useEffect(() => {
    const unsubscribe = initAuth(
      async (user, token) => {
        setUserGoogle(user);
        const savedSheetId = localStorage.getItem('deskops_spreadsheet_id');
        if (savedSheetId && token) {
          try {
            setIsSincronizando(true);
            const meta = await obterEGarantirEstruturaPlanilha(savedSheetId, token);
            setPlanilhaAtiva(meta);
            const dados = await carregarDadosDoGoogleSheets(savedSheetId, token);
            if (dados.chamados.length > 0) setChamados(dados.chamados);
            if (dados.equipamentos.length > 0) setEquipamentos(dados.equipamentos);
            if (dados.funcionarios.length > 0) {
              setFuncionarios(dados.funcionarios);
              const setoresDaPlanilha = Array.from(new Set(dados.funcionarios.map((f) => f.setor).filter(Boolean)));
              if (setoresDaPlanilha.length > 0) {
                setSetores((prev) => Array.from(new Set([...prev, ...setoresDaPlanilha])));
              }
            }
            if (dados.movimentacoes.length > 0) setMovimentacoes(dados.movimentacoes);
            setUltimaSincronizacao(new Date());
            exibirNotificacao(`Google Sheets conectado: "${meta.nome}" pronto para uso.`);
          } catch (e: any) {
            console.error('Erro ao restaurar conexão com planilha:', e);
          } finally {
            setIsSincronizando(false);
          }
        }
      },
      () => {
        setUserGoogle(null);
      }
    );

    return () => unsubscribe();
  }, []);

  const exibirNotificacao = (mensagem: string, tipo: 'sucesso' | 'info' = 'sucesso') => {
    setNotificacao({ mensagem, tipo });
    setTimeout(() => {
      setNotificacao(null);
    }, 4000);
  };

  // Sincroniza dados com o Google Sheets sob demanda
  const handleSincronizarPlanilha = async () => {
    if (!planilhaAtiva) {
      setModalSheetsAberto(true);
      return;
    }
    try {
      setIsSincronizando(true);
      const token = await getAccessToken();
      if (!token) throw new Error('Sessão expirada. Faça login com o Google.');
      const dados = await carregarDadosDoGoogleSheets(planilhaAtiva.id, token);
      setChamados(dados.chamados);
      setEquipamentos(dados.equipamentos);
      if (dados.funcionarios.length > 0) {
        setFuncionarios(dados.funcionarios);
        const setoresDaPlanilha = Array.from(new Set(dados.funcionarios.map((f) => f.setor).filter(Boolean)));
        if (setoresDaPlanilha.length > 0) {
          setSetores((prev) => Array.from(new Set([...prev, ...setoresDaPlanilha])));
        }
      }
      setMovimentacoes(dados.movimentacoes);
      setUltimaSincronizacao(new Date());
      exibirNotificacao('Dados sincronizados com o Google Sheets com sucesso!');
    } catch (err: any) {
      exibirNotificacao(err?.message || 'Erro ao sincronizar com Google Sheets.', 'info');
    } finally {
      setIsSincronizando(false);
    }
  };

  // 1-Click "Assumir Chamado"
  const handleAssumirChamado = (id: string) => {
    const agora = new Date();
    const dataHoraStr = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let chamadoAtualizado: Chamado | null = null;

    setChamados((prev) =>
      prev.map((ch) => {
        if (ch.id === id) {
          const obsAnterior = ch.observacoesTecnicas || '';
          const novaObs = obsAnterior 
            ? `${obsAnterior}\n[${dataHoraStr}] Chamado assumido por ${tecnicoAtivo.email}.`
            : `[${dataHoraStr}] Chamado assumido por ${tecnicoAtivo.email}.`;

          chamadoAtualizado = {
            ...ch,
            emailTecnicoResponsavel: tecnicoAtivo.email,
            status: 'Em Andamento',
            observacoesTecnicas: novaObs
          };
          return chamadoAtualizado;
        }
        return ch;
      })
    );

    // Grava diretamente na aba 'Chamados (Helpdesk)' se conectado
    if (planilhaAtiva && chamadoAtualizado) {
      getAccessToken().then((token) => {
        if (token && chamadoAtualizado) {
          atualizarChamadoNaPlanilha(planilhaAtiva.id, token, chamadoAtualizado).catch((e) =>
            console.error('Erro ao salvar no Google Sheets:', e)
          );
        }
      });
    }

    exibirNotificacao(`Chamado ${id} assumido com sucesso por ${tecnicoAtivo.nome}! Status alterado para Em Andamento.`);
  };

  // Finalizar / Concluir Chamado
  const handleConcluirChamado = (id: string, observacoes: string) => {
    const agora = new Date();
    const dataHoraStr = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let chamadoConcluido: Chamado | null = null;

    setChamados((prev) =>
      prev.map((ch) => {
        if (ch.id === id) {
          const obsAnterior = ch.observacoesTecnicas || '';
          const novaObs = `${obsAnterior}\n[${dataHoraStr} - Resolução por ${tecnicoAtivo.email}]: ${observacoes}`;
          const diffMs = agora.getTime() - new Date(ch.dataHoraAbertura).getTime();
          const diffHoras = (diffMs / (1000 * 60 * 60)).toFixed(1);

          chamadoConcluido = {
            ...ch,
            status: 'Concluído',
            observacoesTecnicas: novaObs,
            dataFechamento: agora.toISOString(),
            tempoAtendimentoSla: `${diffHoras}h (Concluído)`
          };
          return chamadoConcluido;
        }
        return ch;
      })
    );

    // Grava diretamente no Google Sheets
    if (planilhaAtiva && chamadoConcluido) {
      getAccessToken().then((token) => {
        if (token && chamadoConcluido) {
          atualizarChamadoNaPlanilha(planilhaAtiva.id, token, chamadoConcluido).catch((e) =>
            console.error('Erro ao atualizar chamado no Google Sheets:', e)
          );
        }
      });
    }

    exibirNotificacao(`Chamado ${id} concluído com sucesso! Registrado na planilha Chamados.`);
  };

  // Atualizar Status genérico
  const handleAtualizarStatus = (id: string, novoStatus: StatusChamado, observacao?: string) => {
    const agora = new Date();
    const dataHoraStr = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let chamadoModificado: Chamado | null = null;

    setChamados((prev) =>
      prev.map((ch) => {
        if (ch.id === id) {
          let obs = ch.observacoesTecnicas || '';
          if (observacao) {
            obs = `${obs}\n[${dataHoraStr} - ${tecnicoAtivo.email}]: ${observacao}`;
          }
          chamadoModificado = {
            ...ch,
            status: novoStatus,
            observacoesTecnicas: obs
          };
          return chamadoModificado;
        }
        return ch;
      })
    );

    if (planilhaAtiva && chamadoModificado) {
      getAccessToken().then((token) => {
        if (token && chamadoModificado) {
          atualizarChamadoNaPlanilha(planilhaAtiva.id, token, chamadoModificado).catch((e) =>
            console.error('Erro ao atualizar status no Google Sheets:', e)
          );
        }
      });
    }

    exibirNotificacao(`Status do chamado ${id} atualizado para ${novoStatus}.`);
  };

  // Atribuir Equipamento a Funcionário (Atualiza Inventário e grava em Movimentações)
  const handleAtribuirEquipamento = (idEquipamento: string, nomeFuncionario: string, observacoes: string) => {
    const agora = new Date();
    const agoraStr = agora.toISOString().replace('T', ' ').slice(0, 19);

    let eqAtualizado: Equipamento | null = null;

    // 1. Atualiza Inventário
    setEquipamentos((prev) =>
      prev.map((eq) => {
        if (eq.id === idEquipamento) {
          eqAtualizado = {
            ...eq,
            status: 'Em Uso',
            funcionarioAlocado: nomeFuncionario,
            dataUltimaMovimentacao: agoraStr
          };
          return eqAtualizado;
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

    // Grava diretamente nas abas do Google Sheets
    if (planilhaAtiva) {
      getAccessToken().then((token) => {
        if (token) {
          if (eqAtualizado) salvarEquipamentoNaPlanilha(planilhaAtiva.id, token, eqAtualizado);
          gravarMovimentacaoNaPlanilha(planilhaAtiva.id, token, novaMov);
        }
      }).catch(console.error);
    }

    exibirNotificacao(`Equipamento ${idEquipamento} atribuído a ${nomeFuncionario} e salvo no Google Sheets.`);
  };

  // Devolver Equipamento ao Estoque
  const handleDevolverEquipamento = (idEquipamento: string, observacoes: string) => {
    const agora = new Date();
    const agoraStr = agora.toISOString().replace('T', ' ').slice(0, 19);
    const eqAtual = equipamentos.find((e) => e.id === idEquipamento);
    const funcAnterior = eqAtual?.funcionarioAlocado || 'Desconhecido';

    let eqDevolvido: Equipamento | null = null;

    setEquipamentos((prev) =>
      prev.map((eq) => {
        if (eq.id === idEquipamento) {
          eqDevolvido = {
            ...eq,
            status: 'Disponível',
            funcionarioAlocado: null,
            dataUltimaMovimentacao: agoraStr
          };
          return eqDevolvido;
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

    if (planilhaAtiva) {
      getAccessToken().then((token) => {
        if (token) {
          if (eqDevolvido) salvarEquipamentoNaPlanilha(planilhaAtiva.id, token, eqDevolvido);
          gravarMovimentacaoNaPlanilha(planilhaAtiva.id, token, novaMov);
        }
      }).catch(console.error);
    }

    exibirNotificacao(`Equipamento ${idEquipamento} devolvido ao estoque com status Disponível.`);
  };

  // Enviar para Manutenção
  const handleEnviarManutencao = (idEquipamento: string, motivo: string) => {
    const agora = new Date();
    const agoraStr = agora.toISOString().replace('T', ' ').slice(0, 19);

    let eqManut: Equipamento | null = null;

    setEquipamentos((prev) =>
      prev.map((eq) => {
        if (eq.id === idEquipamento) {
          eqManut = {
            ...eq,
            status: 'Em Manutenção',
            dataUltimaMovimentacao: agoraStr
          };
          return eqManut;
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

    if (planilhaAtiva) {
      getAccessToken().then((token) => {
        if (token) {
          if (eqManut) salvarEquipamentoNaPlanilha(planilhaAtiva.id, token, eqManut);
          gravarMovimentacaoNaPlanilha(planilhaAtiva.id, token, novaMov);
        }
      }).catch(console.error);
    }

    exibirNotificacao(`Equipamento ${idEquipamento} enviado para manutenção.`);
  };

  // Gestão de Equipamentos (Exclusivo Administrador)
  const handleCadastrarEquipamento = (dados: Omit<Equipamento, 'dataUltimaMovimentacao'>): boolean => {
    if (tecnicoAtivo.papel !== 'admin') {
      exibirNotificacao('Acesso negado: Apenas administradores podem cadastrar novos equipamentos.', 'info');
      return false;
    }
    const agora = new Date();
    const agoraStr = agora.toISOString().replace('T', ' ').slice(0, 19);

    const novo: Equipamento = {
      ...dados,
      dataUltimaMovimentacao: agoraStr
    };

    setEquipamentos((prev) => [novo, ...prev]);

    const novoIdMov = `MOV-${agora.getFullYear()}${(agora.getMonth() + 1).toString().padStart(2, '0')}${agora.getDate().toString().padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;
    const novaMov: Movimentacao = {
      id: novoIdMov,
      dataHora: agoraStr,
      idEquipamento: novo.id,
      tipoAcao: 'Atribuição',
      funcionarioEnvolvido: novo.funcionarioAlocado || 'Entrada em Estoque',
      emailTecnicoResponsavel: tecnicoAtivo.email,
      observacoes: `Ativo cadastrado no inventário pelo Administrador (${tecnicoAtivo.email})`
    };
    setMovimentacoes((prev) => [novaMov, ...prev]);

    if (planilhaAtiva) {
      getAccessToken().then((token) => {
        if (token) {
          salvarEquipamentoNaPlanilha(planilhaAtiva.id, token, novo);
          gravarMovimentacaoNaPlanilha(planilhaAtiva.id, token, novaMov);
        }
      }).catch(console.error);
    }

    exibirNotificacao(`Novo ativo ${novo.id} (${novo.marcaModelo}) cadastrado no Google Sheets com sucesso!`);
    return true;
  };

  const handleEditarEquipamento = (dadosAtualizados: Equipamento): boolean => {
    if (tecnicoAtivo.papel !== 'admin') {
      exibirNotificacao('Acesso negado: Apenas administradores podem editar equipamentos.', 'info');
      return false;
    }
    const agora = new Date();
    const agoraStr = agora.toISOString().replace('T', ' ').slice(0, 19);

    const eqComData: Equipamento = {
      ...dadosAtualizados,
      dataUltimaMovimentacao: agoraStr
    };

    setEquipamentos((prev) =>
      prev.map((eq) => (eq.id === dadosAtualizados.id ? eqComData : eq))
    );

    const novoIdMov = `MOV-${agora.getFullYear()}${(agora.getMonth() + 1).toString().padStart(2, '0')}${agora.getDate().toString().padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;
    const novaMov: Movimentacao = {
      id: novoIdMov,
      dataHora: agoraStr,
      idEquipamento: dadosAtualizados.id,
      tipoAcao: 'Atribuição',
      funcionarioEnvolvido: dadosAtualizados.funcionarioAlocado || 'Inventário Geral',
      emailTecnicoResponsavel: tecnicoAtivo.email,
      observacoes: `Equipamento atualizado pelo Administrador (${tecnicoAtivo.email})`
    };
    setMovimentacoes((prev) => [novaMov, ...prev]);

    if (planilhaAtiva) {
      getAccessToken().then((token) => {
        if (token) {
          salvarEquipamentoNaPlanilha(planilhaAtiva.id, token, eqComData);
          gravarMovimentacaoNaPlanilha(planilhaAtiva.id, token, novaMov);
        }
      }).catch(console.error);
    }

    exibirNotificacao(`Equipamento ${dadosAtualizados.id} (${dadosAtualizados.marcaModelo}) atualizado na planilha.`);
    return true;
  };

  // Remoção de equipamento com confirmação explícita
  const handleRemoverEquipamento = (idEquipamento: string): boolean => {
    if (tecnicoAtivo.papel !== 'admin') {
      exibirNotificacao('Acesso negado: Apenas administradores podem remover equipamentos.', 'info');
      return false;
    }

    const eq = equipamentos.find((e) => e.id === idEquipamento);

    setModalDestrutivo({
      isOpen: true,
      titulo: 'Excluir Equipamento do Google Sheets',
      descricao: `Tem certeza que deseja remover o equipamento ${idEquipamento} (${eq?.marcaModelo || 'Item'}) do inventário?`,
      itemIdentificador: `Patrimônio: ${idEquipamento} | Status: ${eq?.status || 'N/A'} | Alocado: ${eq?.funcionarioAlocado || 'Nenhum'}`,
      impacto: 'A linha será excluída permanentemente da aba Equipamentos (Inventário) na sua planilha Google Sheets.',
      onConfirm: async () => {
        setModalDestrutivo((prev) => ({ ...prev, isLoading: true }));
        try {
          setEquipamentos((prev) => prev.filter((e) => e.id !== idEquipamento));

          const agora = new Date();
          const agoraStr = agora.toISOString().replace('T', ' ').slice(0, 19);
          const novoIdMov = `MOV-${agora.getFullYear()}${(agora.getMonth() + 1).toString().padStart(2, '0')}${agora.getDate().toString().padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;
          const novaMov: Movimentacao = {
            id: novoIdMov,
            dataHora: agoraStr,
            idEquipamento: idEquipamento,
            tipoAcao: 'Devolução',
            funcionarioEnvolvido: eq?.funcionarioAlocado || 'Baixa Patrimonial',
            emailTecnicoResponsavel: tecnicoAtivo.email,
            observacoes: `Equipamento ${idEquipamento} baixado/removido do inventário pelo Administrador`
          };
          setMovimentacoes((prev) => [novaMov, ...prev]);

          if (planilhaAtiva) {
            const token = await getAccessToken();
            if (token) {
              const abaEq = planilhaAtiva.abasExistentes.find((a) => a.titulo === NOMES_ABAS.EQUIPAMENTOS);
              if (abaEq) {
                await removerEquipamentoDaPlanilha(planilhaAtiva.id, token, abaEq.id, idEquipamento);
              }
              await gravarMovimentacaoNaPlanilha(planilhaAtiva.id, token, novaMov);
            }
          }

          exibirNotificacao(`Equipamento ${idEquipamento} removido do inventário e da planilha Google Sheets.`);
        } catch (err: any) {
          exibirNotificacao('Erro ao remover equipamento da planilha: ' + err?.message, 'info');
        } finally {
          setModalDestrutivo((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      }
    });

    return true;
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
    exibirNotificacao(`Setor "${nomeSetor}" cadastrado com sucesso.`);
    return true;
  };

  const handleEditarSetor = (nomeAntigo: string, nomeNovo: string): boolean => {
    if (tecnicoAtivo.papel !== 'admin') {
      exibirNotificacao('Acesso negado: Apenas administradores podem renomear setores.', 'info');
      return false;
    }
    const nomeLimpo = nomeNovo.trim();
    if (!nomeLimpo) return false;
    if (setores.some((s) => s.toLowerCase() === nomeLimpo.toLowerCase() && s.toLowerCase() !== nomeAntigo.toLowerCase())) {
      alert(`Já existe um setor com o nome "${nomeLimpo}".`);
      return false;
    }

    setSetores((prev) => prev.map((s) => (s.toLowerCase() === nomeAntigo.toLowerCase() ? nomeLimpo : s)));
    setFuncionarios((prev) =>
      prev.map((f) => (f.setor.toLowerCase() === nomeAntigo.toLowerCase() ? { ...f, setor: nomeLimpo } : f))
    );
    setChamados((prev) =>
      prev.map((c) => (c.setor.toLowerCase() === nomeAntigo.toLowerCase() ? { ...c, setor: nomeLimpo } : c))
    );

    // Atualiza no Google Sheets os colaboradores afetados
    if (planilhaAtiva) {
      getAccessToken().then((token) => {
        if (token) {
          funcionarios.forEach((f) => {
            if (f.setor.toLowerCase() === nomeAntigo.toLowerCase()) {
              salvarFuncionarioNaPlanilha(planilhaAtiva.id, token, { ...f, setor: nomeLimpo });
            }
          });
        }
      }).catch(console.error);
    }

    exibirNotificacao(`Setor renomeado para "${nomeLimpo}". Colaboradores e chamados vinculados atualizados.`);
    return true;
  };

  const handleRemoverSetor = (nomeSetor: string): boolean => {
    if (tecnicoAtivo.papel !== 'admin') {
      exibirNotificacao('Acesso negado: Apenas administradores podem remover setores.', 'info');
      return false;
    }
    setSetores((prev) => prev.filter((s) => s.toLowerCase() !== nomeSetor.toLowerCase()));
    exibirNotificacao(`Setor "${nomeSetor}" removido com sucesso.`);
    return true;
  };

  // Administração de Funcionários (Exclusivo Administrador)
  const handleAdicionarFuncionario = (novo: Funcionario): boolean => {
    if (tecnicoAtivo.papel !== 'admin') {
      exibirNotificacao('Acesso negado: Apenas administradores podem cadastrar colaboradores.', 'info');
      return false;
    }
    setFuncionarios((prev) => [novo, ...prev]);

    if (planilhaAtiva) {
      getAccessToken().then((token) => {
        if (token) salvarFuncionarioNaPlanilha(planilhaAtiva.id, token, novo);
      }).catch(console.error);
    }

    exibirNotificacao(`Colaborador(a) "${novo.nomeCompleto}" (${novo.cargo} - Setor: ${novo.setor}) cadastrado(a) na planilha Google Sheets.`);
    return true;
  };

  const handleEditarFuncionario = (funcAtualizado: Funcionario): boolean => {
    if (tecnicoAtivo.papel !== 'admin') {
      exibirNotificacao('Acesso negado: Apenas administradores podem editar colaboradores.', 'info');
      return false;
    }
    setFuncionarios((prev) =>
      prev.map((f) => (f.id === funcAtualizado.id ? funcAtualizado : f))
    );

    if (planilhaAtiva) {
      getAccessToken().then((token) => {
        if (token) salvarFuncionarioNaPlanilha(planilhaAtiva.id, token, funcAtualizado);
      }).catch(console.error);
    }

    exibirNotificacao(`Colaborador(a) "${funcAtualizado.nomeCompleto}" (Setor: ${funcAtualizado.setor}) atualizado(a) na planilha.`);
    return true;
  };

  const handleRemoverFuncionario = (idFuncionario: string): boolean => {
    if (tecnicoAtivo.papel !== 'admin') {
      exibirNotificacao('Acesso negado: Apenas administradores podem remover colaboradores.', 'info');
      return false;
    }
    const func = funcionarios.find((f) => f.id === idFuncionario);

    setModalDestrutivo({
      isOpen: true,
      titulo: 'Excluir Colaborador do Google Sheets',
      descricao: `Tem certeza que deseja excluir o cadastro do colaborador ${func?.nomeCompleto || idFuncionario}?`,
      itemIdentificador: `${func?.nomeCompleto} (${func?.email}) - Setor: ${func?.setor}`,
      impacto: 'A linha será removida permanentemente da aba Funcionários da planilha.',
      onConfirm: async () => {
        setModalDestrutivo((prev) => ({ ...prev, isLoading: true }));
        try {
          setFuncionarios((prev) => prev.filter((f) => f.id !== idFuncionario));

          if (planilhaAtiva && func) {
            const token = await getAccessToken();
            if (token) {
              const abaFunc = planilhaAtiva.abasExistentes.find((a) => a.titulo === NOMES_ABAS.FUNCIONARIOS);
              if (abaFunc) {
                await removerFuncionarioDaPlanilha(planilhaAtiva.id, token, abaFunc.id, func.email);
              }
            }
          }

          exibirNotificacao(`Colaborador "${func?.nomeCompleto || idFuncionario}" removido com sucesso.`);
        } catch (err: any) {
          exibirNotificacao('Erro ao remover colaborador da planilha: ' + err?.message, 'info');
        } finally {
          setModalDestrutivo((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      }
    });

    return true;
  };

  // Criar Chamado (Abertura de Chamado)
  const handleCriarChamado = (novo: Chamado) => {
    setChamados((prev) => [novo, ...prev]);

    // Grava diretamente na aba 'Chamados (Helpdesk)'
    if (planilhaAtiva) {
      getAccessToken().then((token) => {
        if (token) {
          gravarNovoChamadoNaPlanilha(planilhaAtiva.id, token, novo).catch((e) =>
            console.error('Erro ao salvar chamado no Google Sheets:', e)
          );
        }
      });
    }

    exibirNotificacao(`Chamado ${novo.id} registrado com sucesso na planilha Chamados (Helpdesk)!`);
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
      
      {/* Top Navbar com gatilho Google Sheets */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tecnicoAtivo={tecnicoAtivo}
        setTecnicoAtivo={setTecnicoAtivo}
        chamadosAbertosCount={chamadosAbertosCount}
        slaCriticoCount={slaCriticoCount}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        isSheetsConnected={!!planilhaAtiva}
        onOpenSheetsModal={() => setModalSheetsAberto(true)}
      />

      {/* Banner de Status da Conexão em Tempo Real com Google Sheets */}
      <SheetsConnectionBanner
        planilhaAtiva={planilhaAtiva}
        userGoogle={userGoogle}
        onOpenModal={() => setModalSheetsAberto(true)}
        onSincronizar={handleSincronizarPlanilha}
        isSincronizando={isSincronizando}
        ultimaSincronizacao={ultimaSincronizacao}
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
            onEditarEquipamento={handleEditarEquipamento}
            onRemoverEquipamento={handleRemoverEquipamento}
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
            onEditarSetor={handleEditarSetor}
            onRemoverSetor={handleRemoverSetor}
            onAdicionarFuncionario={handleAdicionarFuncionario}
            onEditarFuncionario={handleEditarFuncionario}
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

      {/* Modal de Conexão com Google Sheets */}
      <GoogleSheetsModal
        isOpen={modalSheetsAberto}
        onClose={() => setModalSheetsAberto(false)}
        userGoogle={userGoogle}
        setUserGoogle={setUserGoogle}
        planilhaAtiva={planilhaAtiva}
        setPlanilhaAtiva={setPlanilhaAtiva}
        onSincronizarDados={handleSincronizarPlanilha}
        chamados={chamados}
        equipamentos={equipamentos}
        funcionarios={funcionarios}
        movimentacoes={movimentacoes}
        isSincronizando={isSincronizando}
        ultimaSincronizacao={ultimaSincronizacao}
      />

      {/* Modal de Confirmação para Operações Destrutivas */}
      <DestructiveConfirmModal
        isOpen={modalDestrutivo.isOpen}
        titulo={modalDestrutivo.titulo}
        descricao={modalDestrutivo.descricao}
        itemIdentificador={modalDestrutivo.itemIdentificador}
        impacto={modalDestrutivo.impacto}
        onConfirm={modalDestrutivo.onConfirm}
        onCancel={() => setModalDestrutivo((prev) => ({ ...prev, isOpen: false }))}
        isLoading={modalDestrutivo.isLoading}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            DeskOps TI · Sistema de Helpdesk e Inventário conectado com Google Sheets (Google Workspace)
          </span>
          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setModalSheetsAberto(true)}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
            >
              {planilhaAtiva ? '🟢 Google Sheets Conectado' : 'Conectar Planilha'}
            </button>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <button
              onClick={() => setActiveTab('codigos')}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Exportar Scripts Google (.gs)
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
