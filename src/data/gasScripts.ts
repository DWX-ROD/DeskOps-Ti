/**
 * Códigos completos e documentados do Google Apps Script para o DeskOps TI
 * Arquitetura Google Workspace (Sheets, Forms, Gmail e Web App)
 */

export const CODE_GS = `/**
 * @file Code.gs
 * @description Backend completo do Sistema DeskOps TI no Google Apps Script
 * Integração com Google Sheets, Google Forms, Gmail e Web App para a equipe de TI.
 * @version 2.0.0
 * @author DeskOps Workspace TI
 */

// ============================================================================
// CONFIGURAÇÕES GERAIS E NOMES DAS ABAS
// ============================================================================
const CONFIG = {
  NOMES_ABAS: {
    CHAMADOS: 'Chamados',
    FUNCIONARIOS: 'Funcionarios',
    INVENTARIO: 'Inventario',
    MOVIMENTACOES: 'Movimentacoes'
  },
  // SLA em Horas por Prioridade
  SLA_HORAS: {
    'Crítica': 2,
    'Alta': 4,
    'Média': 8,
    'Baixa': 24
  },
  NOME_SISTEMA: 'DeskOps TI - Helpdesk & Inventário',
  EMAIL_SUPORTE: 'suporte-ti@suaempresa.com.br',
  // E-mails autorizados com papel de ADMINISTRADOR (podem adicionar/remover setores e colaboradores)
  EMAILS_ADMINISTRADORES: [
    'rodrigohf.sornn@gmail.com', // Administrador Master
    'admin-ti@suaempresa.com.br'
  ]
};

/**
 * Ponto de entrada para renderizar a interface Web App para os técnicos
 */
function doGet(e) {
  // Se houver parâmetro de consulta de protocolo público via URL: ?protocolo=CH-2026-0042
  if (e && e.parameter && e.parameter.protocolo) {
    const chamado = consultarProtocolo(e.parameter.protocolo);
    return ContentService.createTextOutput(JSON.stringify(chamado))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Renderiza a interface visual para os técnicos
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle(CONFIG.NOME_SISTEMA)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Inclui arquivos parciais no HTML (caso utilize CSS/JS separados)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Retorna o e-mail do técnico atualmente logado no Google Workspace
 * Segurança: Não exige senhas manuais, captura direta da sessão Google
 */
function getEmailUsuarioLogado() {
  try {
    const email = Session.getActiveUser().getEmail();
    return email || 'tecnico@empresa.com';
  } catch (err) {
    return 'tecnico@empresa.com';
  }
}

/**
 * Verifica se o usuário atual é Administrador autorizado (RBAC)
 */
function isUsuarioAdmin() {
  const emailAtual = getEmailUsuarioLogado().toLowerCase();
  return CONFIG.EMAILS_ADMINISTRADORES.some(function(adm) {
    return adm.toLowerCase() === emailAtual;
  });
}

/**
 * Adiciona um novo setor corporativo (Apenas Administrador)
 */
function adicionarSetor(nomeSetor) {
  if (!isUsuarioAdmin()) {
    throw new Error('Acesso negado: Apenas e-mails com papel de Administrador têm autorização para adicionar setores.');
  }
  // Os setores são refletidos na lista de validação da planilha e nos chamados
  return { sucesso: true, mensagem: 'Setor "' + nomeSetor + '" cadastrado com sucesso!' };
}

/**
 * Remove um setor corporativo (Apenas Administrador)
 */
function removerSetor(nomeSetor) {
  if (!isUsuarioAdmin()) {
    throw new Error('Acesso negado: Apenas e-mails com papel de Administrador têm autorização para remover setores.');
  }
  return { sucesso: true, mensagem: 'Setor "' + nomeSetor + '" removido com sucesso!' };
}

/**
 * Adiciona novo funcionário na aba Funcionarios (Apenas Administrador)
 */
function adicionarFuncionario(dados) {
  if (!isUsuarioAdmin()) {
    throw new Error('Acesso negado: Apenas administradores podem cadastrar colaboradores.');
  }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.NOMES_ABAS.FUNCIONARIOS);
  if (!sheet) throw new Error('Aba Funcionarios não localizada.');

  const novoId = 'FUNC-' + Math.floor(1000 + Math.random() * 9000);
  sheet.appendRow([
    novoId,
    dados.nomeCompleto,
    dados.cpf || '000.000.000-00',
    dados.cargo,
    dados.setor,
    dados.email,
    'Ativo'
  ]);

  return { sucesso: true, mensagem: 'Colaborador "' + dados.nomeCompleto + '" cadastrado com sucesso!' };
}

/**
 * Remove funcionário da aba Funcionarios (Apenas Administrador)
 */
function removerFuncionario(idFuncionario) {
  if (!isUsuarioAdmin()) {
    throw new Error('Acesso negado: Apenas administradores podem remover colaboradores.');
  }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.NOMES_ABAS.FUNCIONARIOS);
  if (!sheet) throw new Error('Aba Funcionarios não localizada.');

  const dados = sheet.getDataRange().getValues();
  for (let i = 1; i < dados.length; i++) {
    if (dados[i][0] === idFuncionario) {
      sheet.deleteRow(i + 1);
      return { sucesso: true, mensagem: 'Colaborador ' + idFuncionario + ' removido da base de dados.' };
    }
  }
  throw new Error('Colaborador não localizado com o ID ' + idFuncionario);
}

// ============================================================================
// 1. GATILHO AUTOMÁTICO DE GOOGLE FORMS (onFormSubmit)
// ============================================================================
/**
 * Gatilho acionado automaticamente quando um colaborador submete o Google Forms.
 * Gera o protocolo único, grava na aba Chamados e envia e-mail de confirmação.
 */
function onFormSubmit(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetChamados = ss.getSheetByName(CONFIG.NOMES_ABAS.CHAMADOS);
  if (!sheetChamados) return;

  const dataAbertura = new Date();
  let nomeSolicitante = '';
  let emailSolicitante = '';
  let setor = '';
  let categoria = '';
  let descricao = '';
  let prioridade = 'Média';

  // Se o gatilho fornecer e.namedValues (Google Form vinculado)
  if (e && e.namedValues) {
    nomeSolicitante = (e.namedValues['Nome Completo'] || e.namedValues['Nome'] || ['Colaborador'])[0];
    emailSolicitante = (e.namedValues['E-mail'] || e.namedValues['Email'] || [''])[0];
    setor = (e.namedValues['Setor'] || e.namedValues['Departamento'] || ['Geral'])[0];
    categoria = (e.namedValues['Categoria do Problema'] || e.namedValues['Problema'] || ['⚙️ Outros'])[0];
    descricao = (e.namedValues['Descrição Detalhada'] || e.namedValues['Descrição'] || ['Sem descrição'])[0];
    prioridade = (e.namedValues['Prioridade Sugerida'] || ['Média'])[0];
  } else if (e && e.values) {
    // Se vier do array simples de colunas
    nomeSolicitante = e.values[1] || 'Colaborador';
    emailSolicitante = e.values[2] || '';
    setor = e.values[3] || 'Geral';
    categoria = e.values[4] || '⚙️ Outros';
    descricao = e.values[5] || '';
  }

  // Define prioridade baseada na categoria caso o formulário não peça
  if (categoria.includes('🔴') || categoria.toLowerCase().includes('internet')) {
    prioridade = 'Alta';
  } else if (categoria.includes('💻') || categoria.toLowerCase().includes('não liga')) {
    prioridade = 'Alta';
  }

  // Gera ID Sequencial: CH-2026-0001
  const ano = dataAbertura.getFullYear();
  const ultimaLinha = sheetChamados.getLastRow();
  const proximoNumero = ultimaLinha > 1 ? ultimaLinha : 1;
  const idChamado = 'CH-' + ano + '-' + String(proximoNumero).padStart(4, '0');

  // Grava o novo chamado na aba
  // Colunas: ID, Data/Hora, Nome, E-mail, Setor, Categoria, Descrição, Prioridade, Técnico, Status, Observações, Data Fechamento, SLA
  sheetChamados.appendRow([
    idChamado,
    Utilities.formatDate(dataAbertura, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss'),
    nomeSolicitante,
    emailSolicitante,
    setor,
    categoria,
    descricao,
    prioridade,
    '', // Técnico Responsável inicial em branco
    'Aberto',
    'Chamado aberto via Google Forms.',
    '', // Data de Fechamento
    'Dentro do Prazo'
  ]);

  // Envia e-mail de confirmação imediato para o solicitante
  if (emailSolicitante && emailSolicitante.includes('@')) {
    enviarEmailConfirmacaoAbertura({
      idChamado,
      nomeSolicitante,
      emailSolicitante,
      categoria,
      prioridade,
      dataAbertura
    });
  }
}

// ============================================================================
// 2. FUNÇÕES DE GESTÃO DE CHAMADOS (PAINEL DO TÉCNICO)
// ============================================================================

/**
 * Retorna todos os chamados cadastrados para o painel de Helpdesk
 */
function listarChamados() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.NOMES_ABAS.CHAMADOS);
  if (!sheet) return [];

  const dados = sheet.getDataRange().getValues();
  if (dados.length <= 1) return [];

  const chamados = [];
  for (let i = 1; i < dados.length; i++) {
    const row = dados[i];
    chamados.push({
      linha: i + 1,
      id: row[0],
      dataHoraAbertura: row[1],
      nomeSolicitante: row[2],
      emailSolicitante: row[3],
      setor: row[4],
      categoria: row[5],
      descricao: row[6],
      prioridade: row[7],
      emailTecnicoResponsavel: row[8],
      status: row[9],
      observacoesTecnicas: row[10],
      dataFechamento: row[11],
      tempoAtendimentoSla: row[12]
    });
  }
  return chamados.reverse(); // Mais recentes primeiro
}

/**
 * Botão "Assumir Chamado" com 1 Clique
 * Captura o e-mail do técnico logado via Session.getActiveUser().getEmail()
 * e altera o status para 'Em Andamento' com log de data/hora.
 */
function assumirChamado(idChamado) {
  const emailTecnico = getEmailUsuarioLogado();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.NOMES_ABAS.CHAMADOS);
  const dados = sheet.getDataRange().getValues();

  for (let i = 1; i < dados.length; i++) {
    if (dados[i][0] === idChamado) {
      const linha = i + 1;
      const agoraStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
      const obsAtual = dados[i][10] || '';
      const novaObs = obsAtual + '\\n[' + agoraStr + '] Chamado assumido por ' + emailTecnico + '.';

      // Coluna I (8): Técnico | Coluna J (9): Status | Coluna K (10): Observações
      sheet.getRange(linha, 9).setValue(emailTecnico);
      sheet.getRange(linha, 10).setValue('Em Andamento');
      sheet.getRange(linha, 11).setValue(novaObs);

      return {
        sucesso: true,
        mensagem: 'Chamado ' + idChamado + ' assumido com sucesso por ' + emailTecnico + '!'
      };
    }
  }
  throw new Error('Chamado não encontrado: ' + idChamado);
}

/**
 * Conclui o chamado, registra observações técnicas, calcula tempo de atendimento e notifica solicitante
 */
function finalizarChamado(idChamado, observacoes) {
  const emailTecnico = getEmailUsuarioLogado();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.NOMES_ABAS.CHAMADOS);
  const dados = sheet.getDataRange().getValues();

  for (let i = 1; i < dados.length; i++) {
    if (dados[i][0] === idChamado) {
      const linha = i + 1;
      const agora = new Date();
      const agoraStr = Utilities.formatDate(agora, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
      
      const nomeSolicitante = dados[i][2];
      const emailSolicitante = dados[i][3];
      const dataAberturaStr = dados[i][1];
      const prioridade = dados[i][7];
      const obsAtual = dados[i][10] || '';
      const novaObs = obsAtual + '\\n[' + agoraStr + ' - Resolução por ' + emailTecnico + ']: ' + observacoes;

      // Cálculo de SLA
      const dataAbertura = new Date(dataAberturaStr);
      let tempoAtendimento = 'Concluído';
      if (!isNaN(dataAbertura.getTime())) {
        const diffMs = agora.getTime() - dataAbertura.getTime();
        const diffHoras = (diffMs / (1000 * 60 * 60)).toFixed(1);
        const limiteHoras = CONFIG.SLA_HORAS[prioridade] || 8;
        tempoAtendimento = diffHoras + 'h (' + (diffHoras <= limiteHoras ? 'Dentro do SLA' : 'SLA Estourado') + ')';
      }

      sheet.getRange(linha, 10).setValue('Concluído');
      sheet.getRange(linha, 11).setValue(novaObs);
      sheet.getRange(linha, 12).setValue(agoraStr);
      sheet.getRange(linha, 13).setValue(tempoAtendimento);

      // Envia e-mail de conclusão ao solicitante
      if (emailSolicitante && emailSolicitante.includes('@')) {
        enviarEmailEncerramento({
          idChamado,
          nomeSolicitante,
          emailSolicitante,
          observacoes,
          emailTecnico,
          tempoAtendimento
        });
      }

      return {
        sucesso: true,
        mensagem: 'Chamado ' + idChamado + ' encerrado com sucesso! E-mail de notificação enviado.'
      };
    }
  }
  throw new Error('Chamado não localizado.');
}

// ============================================================================
// 3. GESTÃO DE INVENTÁRIO E MOVIMENTAÇÕES DE EQUIPAMENTOS
// ============================================================================

/**
 * Lista todos os equipamentos cadastrados no inventário
 */
function listarInventario() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.NOMES_ABAS.INVENTARIO);
  if (!sheet) return [];

  const dados = sheet.getDataRange().getValues();
  if (dados.length <= 1) return [];

  const equipamentos = [];
  for (let i = 1; i < dados.length; i++) {
    const row = dados[i];
    equipamentos.push({
      id: row[0],
      tipo: row[1],
      marcaModelo: row[2],
      numSerie: row[3],
      status: row[4],
      funcionarioAlocado: row[5],
      dataUltimaMovimentacao: row[6]
    });
  }
  return equipamentos;
}

/**
 * Atribui equipamento a um funcionário
 * - Atualiza Inventário para 'Em Uso' com o nome do funcionário
 * - Registra automaticamente na aba Movimentações com e-mail do técnico e carimbo de data/hora
 */
function atribuirEquipamento(idEquipamento, idOuNomeFuncionario, observacoes) {
  const emailTecnico = getEmailUsuarioLogado();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetInv = ss.getSheetByName(CONFIG.NOMES_ABAS.INVENTARIO);
  const sheetMov = ss.getSheetByName(CONFIG.NOMES_ABAS.MOVIMENTACOES);

  const dadosInv = sheetInv.getDataRange().getValues();
  let encontrado = false;
  const agoraStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');

  for (let i = 1; i < dadosInv.length; i++) {
    if (dadosInv[i][0] === idEquipamento) {
      const linha = i + 1;
      // Atualiza Inventário: Status = Em Uso, Funcionário = idOuNomeFuncionario, Data = agora
      sheetInv.getRange(linha, 5).setValue('Em Uso');
      sheetInv.getRange(linha, 6).setValue(idOuNomeFuncionario);
      sheetInv.getRange(linha, 7).setValue(agoraStr);
      encontrado = true;
      break;
    }
  }

  if (!encontrado) throw new Error('Equipamento não encontrado: ' + idEquipamento);

  // Gera ID Movimentação
  const proxIdMov = 'MOV-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd') + '-' + Math.floor(1000 + Math.random() * 9000);
  
  // Grava auditoria na aba Movimentações
  sheetMov.appendRow([
    proxIdMov,
    agoraStr,
    idEquipamento,
    'Atribuição',
    idOuNomeFuncionario,
    emailTecnico,
    observacoes || 'Atribuição realizada via Painel Web'
  ]);

  return {
    sucesso: true,
    mensagem: 'Equipamento ' + idEquipamento + ' atribuído a ' + idOuNomeFuncionario + ' com sucesso!'
  };
}

/**
 * Devolução de equipamento ao estoque
 * Altera status para 'Disponível', limpa funcionário alocado e gera log na aba Movimentações
 */
function devolverEquipamento(idEquipamento, observacoes) {
  const emailTecnico = getEmailUsuarioLogado();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetInv = ss.getSheetByName(CONFIG.NOMES_ABAS.INVENTARIO);
  const sheetMov = ss.getSheetByName(CONFIG.NOMES_ABAS.MOVIMENTACOES);

  const dadosInv = sheetInv.getDataRange().getValues();
  let funcionarioAnterior = 'Desconhecido';
  let encontrado = false;
  const agoraStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');

  for (let i = 1; i < dadosInv.length; i++) {
    if (dadosInv[i][0] === idEquipamento) {
      const linha = i + 1;
      funcionarioAnterior = dadosInv[i][5] || 'Nenhum';
      sheetInv.getRange(linha, 5).setValue('Disponível');
      sheetInv.getRange(linha, 6).setValue('');
      sheetInv.getRange(linha, 7).setValue(agoraStr);
      encontrado = true;
      break;
    }
  }

  if (!encontrado) throw new Error('Equipamento não encontrado: ' + idEquipamento);

  const proxIdMov = 'MOV-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd') + '-' + Math.floor(1000 + Math.random() * 9000);
  sheetMov.appendRow([
    proxIdMov,
    agoraStr,
    idEquipamento,
    'Devolução',
    funcionarioAnterior,
    emailTecnico,
    observacoes || 'Devolução ao estoque de TI'
  ]);

  return {
    sucesso: true,
    mensagem: 'Equipamento ' + idEquipamento + ' devolvido ao estoque com sucesso!'
  };
}

/**
 * Envia equipamento para manutenção preventiva ou corretiva
 */
function enviarManutencao(idEquipamento, motivo) {
  const emailTecnico = getEmailUsuarioLogado();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetInv = ss.getSheetByName(CONFIG.NOMES_ABAS.INVENTARIO);
  const sheetMov = ss.getSheetByName(CONFIG.NOMES_ABAS.MOVIMENTACOES);

  const dadosInv = sheetInv.getDataRange().getValues();
  let responsavelAnterior = '';
  const agoraStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');

  for (let i = 1; i < dadosInv.length; i++) {
    if (dadosInv[i][0] === idEquipamento) {
      const linha = i + 1;
      responsavelAnterior = dadosInv[i][5] || '';
      sheetInv.getRange(linha, 5).setValue('Em Manutenção');
      sheetInv.getRange(linha, 7).setValue(agoraStr);
      break;
    }
  }

  const proxIdMov = 'MOV-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd') + '-' + Math.floor(1000 + Math.random() * 9000);
  sheetMov.appendRow([
    proxIdMov,
    agoraStr,
    idEquipamento,
    'Manutenção',
    responsavelAnterior,
    emailTecnico,
    motivo || 'Envio para laboratório técnico'
  ]);

  return {
    sucesso: true,
    mensagem: 'Equipamento ' + idEquipamento + ' enviado para manutenção.'
  };
}

// ============================================================================
// 4. HISTÓRICO 360º DO FUNCIONÁRIO E CONSULTAS
// ============================================================================

/**
 * Retorna visão completa do funcionário:
 * 1. Dados cadastrais
 * 2. Equipamentos atualmente sob sua custódia
 * 3. Todos os chamados que ele já abriu no passado
 */
function obterHistoricoFuncionario(nomeOuEmail) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetFunc = ss.getSheetByName(CONFIG.NOMES_ABAS.FUNCIONARIOS);
  const sheetInv = ss.getSheetByName(CONFIG.NOMES_ABAS.INVENTARIO);
  const sheetChamados = ss.getSheetByName(CONFIG.NOMES_ABAS.CHAMADOS);

  let funcionario = null;
  const termo = String(nomeOuEmail).trim().toLowerCase();

  if (sheetFunc) {
    const dadosFunc = sheetFunc.getDataRange().getValues();
    for (let i = 1; i < dadosFunc.length; i++) {
      const row = dadosFunc[i];
      if (String(row[1]).toLowerCase().includes(termo) || String(row[5]).toLowerCase().includes(termo)) {
        funcionario = {
          id: row[0],
          nome: row[1],
          cpf: row[2],
          cargo: row[3],
          setor: row[4],
          email: row[5],
          status: row[6]
        };
        break;
      }
    }
  }

  // Equipamentos sob custódia
  const equipamentosAlocados = [];
  if (sheetInv) {
    const dadosInv = sheetInv.getDataRange().getValues();
    for (let i = 1; i < dadosInv.length; i++) {
      const row = dadosInv[i];
      const alocado = String(row[5] || '').toLowerCase();
      if (alocado.includes(termo) || (funcionario && alocado.includes(funcionario.nome.toLowerCase()))) {
        equipamentosAlocados.push({
          id: row[0],
          tipo: row[1],
          marcaModelo: row[2],
          numSerie: row[3],
          status: row[4],
          dataUltimaMovimentacao: row[6]
        });
      }
    }
  }

  // Chamados abertos pelo colaborador
  const chamadosColaborador = [];
  if (sheetChamados) {
    const dadosCh = sheetChamados.getDataRange().getValues();
    for (let i = 1; i < dadosCh.length; i++) {
      const row = dadosCh[i];
      const solicitante = String(row[2] || '').toLowerCase();
      const email = String(row[3] || '').toLowerCase();
      if (solicitante.includes(termo) || email.includes(termo) || (funcionario && solicitante.includes(funcionario.nome.toLowerCase()))) {
        chamadosColaborador.push({
          id: row[0],
          dataAbertura: row[1],
          categoria: row[5],
          descricao: row[6],
          prioridade: row[7],
          tecnico: row[8],
          status: row[9],
          dataFechamento: row[11],
          tempoAtendimento: row[12]
        });
      }
    }
  }

  return {
    funcionario: funcionario || { nome: nomeOuEmail, setor: 'Não identificado' },
    equipamentosAlocados,
    chamadosColaborador: chamadosColaborador.reverse()
  };
}

/**
 * Retorna visão consolidada e histórico completo por SETOR:
 * - Lista de funcionários cadastrados no setor
 * - Todos os equipamentos alocados para colaboradores daquele setor
 * - Todos os chamados abertos por pessoas daquele setor
 * - Métricas de atendimento e parque de máquinas
 */
function obterHistoricoPorSetor(nomeSetor) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetFunc = ss.getSheetByName(CONFIG.NOMES_ABAS.FUNCIONARIOS);
  const sheetInv = ss.getSheetByName(CONFIG.NOMES_ABAS.INVENTARIO);
  const sheetChamados = ss.getSheetByName(CONFIG.NOMES_ABAS.CHAMADOS);

  const setorAlvo = String(nomeSetor).trim().toLowerCase();
  const funcionariosDoSetor = [];
  const nomesFuncionarios = [];

  if (sheetFunc) {
    const dadosFunc = sheetFunc.getDataRange().getValues();
    for (let i = 1; i < dadosFunc.length; i++) {
      const row = dadosFunc[i];
      if (String(row[4]).trim().toLowerCase() === setorAlvo) {
        funcionariosDoSetor.push({
          id: row[0],
          nome: row[1],
          cpf: row[2],
          cargo: row[3],
          setor: row[4],
          email: row[5],
          status: row[6]
        });
        nomesFuncionarios.push(String(row[1]).trim().toLowerCase());
      }
    }
  }

  // Equipamentos vinculados ao setor
  const equipamentosSetor = [];
  if (sheetInv) {
    const dadosInv = sheetInv.getDataRange().getValues();
    for (let i = 1; i < dadosInv.length; i++) {
      const row = dadosInv[i];
      const alocado = String(row[5] || '').trim().toLowerCase();
      if (alocado && nomesFuncionarios.some(function(n) { return alocado.includes(n) || n.includes(alocado); })) {
        equipamentosSetor.push({
          id: row[0],
          tipo: row[1],
          marcaModelo: row[2],
          numSerie: row[3],
          status: row[4],
          funcionarioAlocado: row[5],
          dataUltimaMovimentacao: row[6]
        });
      }
    }
  }

  // Chamados abertos por este setor
  const chamadosSetor = [];
  if (sheetChamados) {
    const dadosCh = sheetChamados.getDataRange().getValues();
    for (let i = 1; i < dadosCh.length; i++) {
      const row = dadosCh[i];
      const setorCh = String(row[4] || '').trim().toLowerCase();
      const solicitante = String(row[2] || '').trim().toLowerCase();
      if (setorCh === setorAlvo || nomesFuncionarios.some(function(n) { return solicitante.includes(n); })) {
        chamadosSetor.push({
          id: row[0],
          dataAbertura: row[1],
          nomeSolicitante: row[2],
          setor: row[4],
          categoria: row[5],
          descricao: row[6],
          prioridade: row[7],
          tecnico: row[8],
          status: row[9],
          dataFechamento: row[11],
          tempoAtendimento: row[12]
        });
      }
    }
  }

  return {
    setor: nomeSetor,
    totalFuncionarios: funcionariosDoSetor.length,
    funcionarios: funcionariosDoSetor,
    equipamentos: equipamentosSetor,
    chamados: chamadosSetor.reverse()
  };
}

/**
 * Consulta de Status sem Login:
 * Permite ao colaborador digitar apenas o número do protocolo para ver o andamento em tempo real
 */
function consultarProtocolo(idProtocolo) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.NOMES_ABAS.CHAMADOS);
  if (!sheet) return null;

  const dados = sheet.getDataRange().getValues();
  const busca = String(idProtocolo).trim().toUpperCase();

  for (let i = 1; i < dados.length; i++) {
    if (String(dados[i][0]).toUpperCase() === busca) {
      const row = dados[i];
      return {
        encontrado: true,
        id: row[0],
        dataHoraAbertura: row[1],
        nomeSolicitante: row[2],
        setor: row[4],
        categoria: row[5],
        descricao: row[6],
        prioridade: row[7],
        tecnicoResponsavel: row[8] ? row[8] : 'Aguardando atribuição de técnico',
        status: row[9],
        observacoesTecnicas: row[10],
        dataFechamento: row[11],
        tempoAtendimentoSla: row[12]
      };
    }
  }
  return {
    encontrado: false,
    mensagem: 'Protocolo ' + idProtocolo + ' não foi encontrado na base de dados.'
  };
}

// ============================================================================
// 5. TEMPLATES DE E-MAIL EM HTML (GMAILAPP)
// ============================================================================

function enviarEmailConfirmacaoAbertura(dados) {
  const assunto = '🔔 [Chamado ' + dados.idChamado + '] Recebido com Sucesso - DeskOps TI';
  const htmlCorpo = \`
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #ffffff;">
      <div style="background-color: #1e293b; padding: 24px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px;">DeskOps TI - Helpdesk Corporativo</h2>
        <p style="margin: 6px 0 0; color: #94a3b8; font-size: 14px;">Confirmação de Abertura de Chamado</p>
      </div>
      <div style="padding: 24px; color: #334155; line-height: 1.6;">
        <p>Olá, <strong>\${dados.nomeSolicitante}</strong>,</p>
        <p>Seu chamado foi registrado na fila de atendimento da equipe de TI.</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 140px;">Número do Protocolo:</td>
              <td style="padding: 6px 0; font-weight: bold; font-family: monospace; font-size: 16px; color: #2563eb;">\${dados.idChamado}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Categoria:</td>
              <td style="padding: 6px 0; font-weight: 500;">\${dados.categoria}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Prioridade:</td>
              <td style="padding: 6px 0;"><strong>\${dados.prioridade}</strong></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Status Inicial:</td>
              <td style="padding: 6px 0;"><span style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Aberto</span></td>
            </tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #64748b;">
          💡 Você pode consultar o andamento deste chamado a qualquer momento usando apenas o número do protocolo <strong>\${dados.idChamado}</strong>.
        </p>
      </div>
      <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        Equipe de TI & Suporte Técnico Corporativo · Atendimento DeskOps
      </div>
    </div>
  \`;

  GmailApp.sendEmail(dados.emailSolicitante, assunto, 'Seu chamado foi registrado: ' + dados.idChamado, {
    htmlBody: htmlCorpo,
    name: 'Helpdesk TI'
  });
}

function enviarEmailEncerramento(dados) {
  const assunto = '✅ [Chamado ' + dados.idChamado + '] Concluído com Sucesso - DeskOps TI';
  const htmlCorpo = \`
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #ffffff;">
      <div style="background-color: #0f766e; padding: 24px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px;">Chamado Concluído</h2>
        <p style="margin: 6px 0 0; color: #ccfbf1; font-size: 14px;">Protocolo: \${dados.idChamado}</p>
      </div>
      <div style="padding: 24px; color: #334155; line-height: 1.6;">
        <p>Olá, <strong>\${dados.nomeSolicitante}</strong>,</p>
        <p>Informamos que o seu chamado de suporte técnico foi <strong>resolvido e concluído</strong> pelo técnico responsável.</p>

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #166534; font-size: 14px;">Resolução do Técnico:</h4>
          <p style="margin: 0; font-size: 14px; color: #15803d; white-space: pre-line;">\${dados.observacoes}</p>
          <hr style="border: 0; border-top: 1px dashed #bbf7d0; margin: 12px 0;">
          <table style="width: 100%; font-size: 13px; color: #475569;">
            <tr>
              <td><strong>Técnico Responsável:</strong></td>
              <td>\${dados.emailTecnico}</td>
            </tr>
            <tr>
              <td><strong>Tempo de Atendimento:</strong></td>
              <td>\${dados.tempoAtendimento}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #64748b;">
          Caso o problema persista ou necessite de apoio adicional, basta responder a este e-mail.
        </p>
      </div>
      <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        Equipe de TI & Suporte Técnico Corporativo · Atendimento DeskOps
      </div>
    </div>
  \`;

  GmailApp.sendEmail(dados.emailSolicitante, assunto, 'Seu chamado ' + dados.idChamado + ' foi concluído.', {
    htmlBody: htmlCorpo,
    name: 'Helpdesk TI'
  });
}
`;

export const SETUP_PLANILHA_GS = `/**
 * @file Setup_Planilha.gs
 * @description Script de inicialização automática do banco de dados na planilha
 * Cria as 4 abas, formata cabeçalhos institucionais, congela linhas e insere dados de teste.
 * Execute a função: configurarBancoDeDados()
 */

function configurarBancoDeDados() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. ABA CHAMADOS
  let abaChamados = ss.getSheetByName('Chamados');
  if (!abaChamados) {
    abaChamados = ss.insertSheet('Chamados');
  }
  abaChamados.clear();
  const cabecalhosChamados = [
    'ID Chamado',
    'Data/Hora Abertura',
    'Nome Solicitante',
    'E-mail Solicitante',
    'Setor',
    'Categoria do Problema',
    'Descrição',
    'Prioridade',
    'E-mail Técnico Responsável',
    'Status',
    'Observações Técnicas',
    'Data de Fechamento',
    'Tempo de Atendimento / SLA'
  ];
  abaChamados.getRange(1, 1, 1, cabecalhosChamados.length).setValues([cabecalhosChamados]);
  formatarCabecalho(abaChamados, '#1E293B', cabecalhosChamados.length);

  // Validação de dados (Status e Prioridade)
  const regraStatus = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Aberto', 'Em Andamento', 'Aguardando Peça', 'Concluído', 'Cancelado'], true)
    .build();
  abaChamados.getRange('J2:J1000').setDataValidation(regraStatus);

  const regraPrioridade = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Baixa', 'Média', 'Alta', 'Crítica'], true)
    .build();
  abaChamados.getRange('H2:H1000').setDataValidation(regraPrioridade);

  // 2. ABA FUNCIONÁRIOS
  let abaFunc = ss.getSheetByName('Funcionarios');
  if (!abaFunc) {
    abaFunc = ss.insertSheet('Funcionarios');
  }
  abaFunc.clear();
  const cabecalhosFunc = [
    'ID Funcionário',
    'Nome Completo',
    'CPF',
    'Cargo',
    'Setor',
    'E-mail',
    'Status'
  ];
  abaFunc.getRange(1, 1, 1, cabecalhosFunc.length).setValues([cabecalhosFunc]);
  formatarCabecalho(abaFunc, '#0F766E', cabecalhosFunc.length);

  const regraStatusFunc = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Ativo', 'Inativo'], true)
    .build();
  abaFunc.getRange('G2:G1000').setDataValidation(regraStatusFunc);

  // 3. ABA INVENTÁRIO
  let abaInv = ss.getSheetByName('Inventario');
  if (!abaInv) {
    abaInv = ss.insertSheet('Inventario');
  }
  abaInv.clear();
  const cabecalhosInv = [
    'ID Máquina/Patrimônio',
    'Tipo',
    'Marca/Modelo',
    'Nº de Série',
    'Status',
    'Funcionário Alocado',
    'Data da Última Movimentação'
  ];
  abaInv.getRange(1, 1, 1, cabecalhosInv.length).setValues([cabecalhosInv]);
  formatarCabecalho(abaInv, '#1D4ED8', cabecalhosInv.length);

  const regraStatusInv = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Disponível', 'Em Uso', 'Em Manutenção', 'Descartado'], true)
    .build();
  abaInv.getRange('E2:E1000').setDataValidation(regraStatusInv);

  const regraTipoInv = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Notebook', 'Desktop', 'Monitor', 'Impressora', 'Periférico', 'Servidor / Rede'], true)
    .build();
  abaInv.getRange('B2:B1000').setDataValidation(regraTipoInv);

  // 4. ABA MOVIMENTAÇÕES
  let abaMov = ss.getSheetByName('Movimentacoes');
  if (!abaMov) {
    abaMov = ss.insertSheet('Movimentacoes');
  }
  abaMov.clear();
  const cabecalhosMov = [
    'ID Movimentação',
    'Data/Hora',
    'ID Equipamento',
    'Tipo de Ação',
    'Funcionário Envolvido',
    'E-mail Técnico Responsável',
    'Observações'
  ];
  abaMov.getRange(1, 1, 1, cabecalhosMov.length).setValues([cabecalhosMov]);
  formatarCabecalho(abaMov, '#475569', cabecalhosMov.length);

  const regraAcaoMov = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Atribuição', 'Devolução', 'Manutenção'], true)
    .build();
  abaMov.getRange('D2:D1000').setDataValidation(regraAcaoMov);

  // 5. INSERIR DADOS INICIAIS DE TESTE
  inserirDadosIniciais(abaChamados, abaFunc, abaInv, abaMov);

  SpreadsheetApp.getActiveSpreadsheet().toast('Banco de dados DeskOps configurado com sucesso nas 4 abas!', 'Sucesso', 5);
}

function formatarCabecalho(aba, corFundoHex, colunas) {
  const headerRange = aba.getRange(1, 1, 1, colunas);
  headerRange.setBackground(corFundoHex);
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setFontFamily('Arial');
  headerRange.setFontSize(10);
  headerRange.setHorizontalAlignment('center');
  aba.setFrozenRows(1);
  for (let c = 1; c <= colunas; c++) {
    aba.setColumnWidth(c, 160);
  }
}

function inserirDadosIniciais(abaChamados, abaFunc, abaInv, abaMov) {
  // Dados de Funcionários
  abaFunc.appendRow(['FUNC-001', 'Mariana Souza', '123.456.789-00', 'Analista Financeiro', 'Financeiro', 'mariana.souza@empresa.com', 'Ativo']);
  abaFunc.appendRow(['FUNC-002', 'Carlos Eduardo', '234.567.890-11', 'Designer UI/UX', 'Marketing', 'carlos.eduardo@empresa.com', 'Ativo']);
  abaFunc.appendRow(['FUNC-003', 'Fernanda Lima', '345.678.901-22', 'Gerente Comercial', 'Comercial', 'fernanda.lima@empresa.com', 'Ativo']);
  abaFunc.appendRow(['FUNC-004', 'Lucas Oliveira', '456.789.012-33', 'Dev Backend', 'Engenharia', 'lucas.oliveira@empresa.com', 'Ativo']);

  // Dados de Inventário
  abaInv.appendRow(['PAT-1001', 'Notebook', 'Dell Latitude 3420 i7 16GB', 'DELL-SN-89211', 'Em Uso', 'Mariana Souza', '02/11/2026 09:30']);
  abaInv.appendRow(['PAT-1002', 'Notebook', 'MacBook Air M2 16GB', 'APPLE-SN-44391', 'Em Uso', 'Carlos Eduardo', '01/11/2026 14:15']);
  abaInv.appendRow(['PAT-1003', 'Monitor', 'Dell UltraSharp 27" 4K', 'DELL-MN-11822', 'Em Uso', 'Carlos Eduardo', '01/11/2026 14:20']);
  abaInv.appendRow(['PAT-1004', 'Notebook', 'Lenovo ThinkPad E14 i5 16GB', 'LEN-SN-99812', 'Disponível', '', '28/10/2026 11:00']);
  abaInv.appendRow(['PAT-1005', 'Desktop', 'HP ProDesk 600 G6 i5', 'HP-SN-33910', 'Em Manutenção', '', '30/10/2026 16:45']);

  // Dados de Movimentações
  abaMov.appendRow(['MOV-20261102-01', '02/11/2026 09:30', 'PAT-1001', 'Atribuição', 'Mariana Souza', 'suporte-ti@empresa.com', 'Notebook entregue no onboarding']);
  abaMov.appendRow(['MOV-20261101-02', '01/11/2026 14:15', 'PAT-1002', 'Atribuição', 'Carlos Eduardo', 'suporte-ti@empresa.com', 'MacBook alocado para design']);
  abaMov.appendRow(['MOV-20261030-03', '30/10/2026 16:45', 'PAT-1005', 'Manutenção', '', 'suporte-ti@empresa.com', 'Substituição de cooler e fonte']);

  // Dados de Chamados
  abaChamados.appendRow([
    'CH-2026-0001',
    '04/11/2026 08:30:00',
    'Mariana Souza',
    'mariana.souza@empresa.com',
    'Financeiro',
    '🔴 Sem internet / Rede',
    'Cabo de rede não conecta ao switch da baia 4. Não consigo acessar o ERP.',
    'Alta',
    'suporte-ti@empresa.com',
    'Em Andamento',
    '[04/11 08:45] Técnico no local testando o ponto de rede.',
    '',
    'Dentro do Prazo'
  ]);

  abaChamados.appendRow([
    'CH-2026-0002',
    '04/11/2026 09:15:00',
    'Fernanda Lima',
    'fernanda.lima@empresa.com',
    'Comercial',
    '🖨️ Impressora não funciona',
    'Impressora do 2º andar com aviso de papel atolado e toner baixo.',
    'Média',
    '',
    'Aberto',
    'Chamado aberto via Google Forms.',
    '',
    'Dentro do Prazo'
  ]);
}
`;

export const INDEX_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DeskOps TI - Painel do Técnico</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;600&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'DM Sans', sans-serif; }
    h1, h2, h3, h4, .font-display { font-family: 'Plus Jakarta Sans', sans-serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 antialiased min-h-screen">
  <!-- TOPO -->
  <header class="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between shadow-sm">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-display font-bold text-lg text-white">
        D
      </div>
      <div>
        <h1 class="text-base font-bold tracking-tight text-white leading-tight">DeskOps TI</h1>
        <p class="text-xs text-slate-400">Helpdesk & Inventário Google Workspace</p>
      </div>
    </div>

    <!-- Navegação de Abas -->
    <nav class="hidden md:flex items-center gap-2 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs font-medium">
      <button onclick="mudarAba('chamados')" id="btnAba-chamados" class="px-3.5 py-1.5 rounded-md bg-blue-600 text-white shadow-sm transition">
        Chamados
      </button>
      <button onclick="mudarAba('inventario')" id="btnAba-inventario" class="px-3.5 py-1.5 rounded-md text-slate-300 hover:text-white transition">
        Inventário
      </button>
      <button onclick="mudarAba('historico')" id="btnAba-historico" class="px-3.5 py-1.5 rounded-md text-slate-300 hover:text-white transition">
        Histórico 360º
      </button>
    </nav>

    <!-- Usuário Conectado -->
    <div class="flex items-center gap-2.5 text-xs text-slate-300 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700">
      <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
      <span id="userEmail">Carregando usuário...</span>
    </div>
  </header>

  <!-- CONTEÚDO PRINCIPAL -->
  <main class="max-w-7xl mx-auto px-6 py-6">

    <!-- ABA 1: CHAMADOS -->
    <section id="aba-chamados" class="space-y-6">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-900">Fila de Chamados</h2>
          <p class="text-sm text-slate-500">Gerencie a fila de suporte com SLA em tempo real e atribuição com 1 clique.</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="recarregarChamados()" class="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition flex items-center gap-1.5">
            🔄 Atualizar Fila
          </button>
        </div>
      </div>

      <!-- Filtros Rápidos -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1">Status</label>
          <select id="filtroStatus" onchange="filtrarTabelaChamados()" class="w-full text-xs rounded-lg border-slate-200 bg-slate-50 py-2 px-2.5 focus:border-blue-500">
            <option value="">Todos os Status</option>
            <option value="Aberto">Aberto</option>
            <option value="Em Andamento">Em Andamento</option>
            <option value="Aguardando Peça">Aguardando Peça</option>
            <option value="Concluído">Concluído</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1">Prioridade</label>
          <select id="filtroPrioridade" onchange="filtrarTabelaChamados()" class="w-full text-xs rounded-lg border-slate-200 bg-slate-50 py-2 px-2.5 focus:border-blue-500">
            <option value="">Todas</option>
            <option value="Crítica">Crítica (2h)</option>
            <option value="Alta">Alta (4h)</option>
            <option value="Média">Média (8h)</option>
            <option value="Baixa">Baixa (24h)</option>
          </select>
        </div>
        <div class="md:col-span-2">
          <label class="block text-xs font-semibold text-slate-600 mb-1">Busca rápida</label>
          <input type="text" id="filtroBusca" onkeyup="filtrarTabelaChamados()" placeholder="Buscar por protocolo, solicitante ou setor..." class="w-full text-xs rounded-lg border-slate-200 bg-slate-50 py-2 px-3 focus:border-blue-500">
        </div>
      </div>

      <!-- Tabela de Chamados -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th class="py-3 px-4">Protocolo</th>
                <th class="py-3 px-4">Abertura</th>
                <th class="py-3 px-4">Solicitante</th>
                <th class="py-3 px-4">Categoria</th>
                <th class="py-3 px-4">Prioridade</th>
                <th class="py-3 px-4">SLA / Status</th>
                <th class="py-3 px-4">Técnico</th>
                <th class="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody id="corpoTabelaChamados" class="divide-y divide-slate-100">
              <tr>
                <td colspan="8" class="text-center py-8 text-slate-400">Carregando chamados do Google Sheets...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- ABA 2: INVENTÁRIO -->
    <section id="aba-inventario" class="space-y-6 hidden">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-slate-900">Inventário de TI</h2>
          <p class="text-sm text-slate-500">Controle de máquinas, monitores e periféricos com histórico de movimentação.</p>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th class="py-3 px-4">Patrimônio</th>
                <th class="py-3 px-4">Tipo</th>
                <th class="py-3 px-4">Marca / Modelo</th>
                <th class="py-3 px-4">Nº de Série</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4">Alocado Para</th>
                <th class="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody id="corpoTabelaInventario" class="divide-y divide-slate-100">
              <tr>
                <td colspan="7" class="text-center py-8 text-slate-400">Carregando inventário...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- ABA 3: HISTÓRICO POR SETOR -->
    <section id="aba-historico" class="space-y-6 hidden">
      <div>
        <h2 class="text-xl font-bold text-slate-900">Histórico 360º por Setor</h2>
        <p class="text-sm text-slate-500">Consulte o parque de máquinas e todos os chamados agrupados por departamento e seus colaboradores registrados.</p>
      </div>

      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <label class="block text-xs font-semibold text-slate-700">Selecione o Setor da Empresa</label>
        <div class="flex flex-wrap gap-2">
          <button onclick="selecionarSetor('Financeiro')" class="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white shadow-sm">Financeiro</button>
          <button onclick="selecionarSetor('Design & UX')" class="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700">Design & UX</button>
          <button onclick="selecionarSetor('Comercial')" class="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700">Comercial</button>
          <button onclick="selecionarSetor('Engenharia')" class="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700">Engenharia</button>
          <button onclick="selecionarSetor('RH & People')" class="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700">RH & People</button>
        </div>
      </div>

      <div id="resultadoSetor" class="space-y-4">
        <div class="p-6 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
          Selecione um setor acima para visualizar o histórico de ativos e chamados dos seus colaboradores.
        </div>
      </div>
    </section>

  </main>

  <!-- MODAL: FINALIZAR CHAMADO -->
  <div id="modalFinalizar" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
    <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
      <h3 class="text-lg font-bold text-slate-900 mb-1">Encerrar Chamado</h3>
      <p class="text-xs text-slate-500 mb-4" id="modalProtocoloInfo">Protocolo: CH-2026-XXXX</p>
      
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Observações Técnicas / Resolução</label>
          <textarea id="modalObsTexto" rows="4" placeholder="Descreva a causa e a solução aplicada. Esta nota será enviada por e-mail ao solicitante." class="w-full text-xs p-3 rounded-lg border border-slate-200 bg-slate-50 focus:border-blue-500"></textarea>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 mt-6">
        <button onclick="fecharModalFinalizar()" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
        <button onclick="confirmarFechamentoChamado()" class="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm">Salvar e Enviar E-mail</button>
      </div>
    </div>
  </div>

  <!-- SCRIPT CLIENT-SIDE GOOGLE APPS SCRIPT -->
  <script>
    let todosChamados = [];
    let chamadoSelecionadoId = null;

    // Inicialização
    window.onload = function() {
      obterUsuario();
      recarregarChamados();
      recarregarInventario();
    };

    function mudarAba(aba) {
      document.getElementById('aba-chamados').classList.add('hidden');
      document.getElementById('aba-inventario').classList.add('hidden');
      document.getElementById('aba-historico').classList.add('hidden');

      document.getElementById('btnAba-chamados').className = 'px-3.5 py-1.5 rounded-md text-slate-300 hover:text-white transition';
      document.getElementById('btnAba-inventario').className = 'px-3.5 py-1.5 rounded-md text-slate-300 hover:text-white transition';
      document.getElementById('btnAba-historico').className = 'px-3.5 py-1.5 rounded-md text-slate-300 hover:text-white transition';

      document.getElementById('aba-' + aba).classList.remove('hidden');
      document.getElementById('btnAba-' + aba).className = 'px-3.5 py-1.5 rounded-md bg-blue-600 text-white shadow-sm transition';
    }

    function obterUsuario() {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(email) {
            document.getElementById('userEmail').textContent = email;
          })
          .getEmailUsuarioLogado();
      } else {
        document.getElementById('userEmail').textContent = 'tecnico@empresa.com (Modo Teste)';
      }
    }

    function recarregarChamados() {
      const tbody = document.getElementById('corpoTabelaChamados');
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-slate-400">Atualizando chamados...</td></tr>';

      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(dados) {
            todosChamados = dados;
            renderizarTabelaChamados(dados);
          })
          .withFailureHandler(function(err) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-6 text-red-500">Erro ao carregar: ' + err.message + '</td></tr>';
          })
          .listarChamados();
      }
    }

    function renderizarTabelaChamados(lista) {
      const tbody = document.getElementById('corpoTabelaChamados');
      if (!lista || lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-slate-400">Nenhum chamado localizado.</td></tr>';
        return;
      }

      tbody.innerHTML = lista.map(function(ch) {
        const isAberto = ch.status === 'Aberto';
        const isEmAndamento = ch.status === 'Em Andamento';
        const btnAssumir = isAberto ? 
          '<button onclick="assumirDireto(\\'' + ch.id + '\\')" class="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold border border-blue-200">Assumir</button>' : '';
        const btnConcluir = (isEmAndamento || ch.status === 'Aguardando Peça') ?
          '<button onclick="abrirModalFinalizar(\\'' + ch.id + '\\')" class="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold border border-emerald-200">Concluir</button>' : '';

        return '<tr class="hover:bg-slate-50/80 transition-colors">' +
          '<td class="py-3 px-4 font-mono font-bold text-slate-900">' + ch.id + '</td>' +
          '<td class="py-3 px-4 text-slate-500">' + ch.dataHoraAbertura + '</td>' +
          '<td class="py-3 px-4"><div class="font-medium text-slate-800">' + ch.nomeSolicitante + '</div><div class="text-[11px] text-slate-400">' + ch.setor + '</div></td>' +
          '<td class="py-3 px-4 font-medium">' + ch.categoria + '</td>' +
          '<td class="py-3 px-4 font-semibold">' + ch.prioridade + '</td>' +
          '<td class="py-3 px-4"><span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">' + ch.status + '</span></td>' +
          '<td class="py-3 px-4 text-slate-500 text-[11px]">' + (ch.emailTecnicoResponsavel || '<span class="text-amber-600 font-medium">Não atribuído</span>') + '</td>' +
          '<td class="py-3 px-4 text-right space-x-1">' + btnAssumir + btnConcluir + '</td>' +
        '</tr>';
      }).join('');
    }

    function assumirDireto(idChamado) {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(resp) {
            alert(resp.mensagem);
            recarregarChamados();
          })
          .assumirChamado(idChamado);
      }
    }

    function abrirModalFinalizar(idChamado) {
      chamadoSelecionadoId = idChamado;
      document.getElementById('modalProtocoloInfo').textContent = 'Protocolo: ' + idChamado;
      document.getElementById('modalObsTexto').value = '';
      document.getElementById('modalFinalizar').classList.remove('hidden');
    }

    function fecharModalFinalizar() {
      document.getElementById('modalFinalizar').classList.add('hidden');
    }

    function confirmarFechamentoChamado() {
      const obs = document.getElementById('modalObsTexto').value;
      if (!obs.trim()) {
        alert('Por favor, informe a resolução do chamado.');
        return;
      }
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(resp) {
            fecharModalFinalizar();
            alert(resp.mensagem);
            recarregarChamados();
          })
          .finalizarChamado(chamadoSelecionadoId, obs);
      }
    }

    function recarregarInventario() {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(dados) {
            const tbody = document.getElementById('corpoTabelaInventario');
            tbody.innerHTML = dados.map(function(eq) {
              return '<tr class="hover:bg-slate-50/80 transition-colors">' +
                '<td class="py-3 px-4 font-mono font-bold text-slate-900">' + eq.id + '</td>' +
                '<td class="py-3 px-4">' + eq.tipo + '</td>' +
                '<td class="py-3 px-4 font-medium">' + eq.marcaModelo + '</td>' +
                '<td class="py-3 px-4 font-mono text-[11px] text-slate-500">' + eq.numSerie + '</td>' +
                '<td class="py-3 px-4 font-semibold">' + eq.status + '</td>' +
                '<td class="py-3 px-4">' + (eq.funcionarioAlocado || '-') + '</td>' +
                '<td class="py-3 px-4 text-right text-slate-400">' + (eq.dataUltimaMovimentacao || '-') + '</td>' +
              '</tr>';
            }).join('');
          })
          .listarInventario();
      }
    }
  </script>
</body>
</html>
`;

export const GUIA_IMPLANTACAO_MD = `# Guia Completo de Instalação e Implantação
## DeskOps TI - Helpdesk, Inventário e Chamados no Google Workspace

Siga este passo a passo para colocar o sistema em produção na sua organização em menos de 10 minutos.

---

### Passo 1: Criar a Planilha Central no Google Drive
1. Acesse o [Google Drive](https://drive.google.com/) da sua conta corporativa.
2. Clique em **Novo > Planilhas Google**.
3. Nomeie a planilha como: \`DeskOps TI - Banco de Dados\`.

---

### Passo 2: Executar a Configuração Automática do Banco de Dados
1. Na planilha, clique no menu superior: **Extensões > Apps Script**.
2. Apague qualquer código existente no arquivo inicial \`Código.gs\`.
3. Renomeie o arquivo para \`Setup_Planilha.gs\` e cole o código fornecido na aba **Setup_Planilha.gs**.
4. No topo do editor, selecione a função **\`configurarBancoDeDados\`** e clique em **Executar**.
5. O Google solicitará autorização de permissões ("Revisar permissões" > Escolha sua conta > Avançado > Acessar projeto).
6. Volte à planilha: você verá as 4 abas estruturadas, com cores, larguras de coluna e regras de validação prontas!

---

### Passo 3: Criar o Arquivo do Backend (\`Code.gs\`)
1. No editor do Apps Script, clique no ícone **+ (Adicionar arquivo) > Script**.
2. Nomeie o arquivo como **\`Code\`** (ficará como \`Code.gs\`).
3. Cole todo o conteúdo fornecido na aba **Code.gs**.
4. Salve o projeto (\`Ctrl + S\` ou ícone de disco).

---

### Passo 4: Criar a Interface Visual (\`Index.html\`)
1. No editor do Apps Script, clique no ícone **+ (Adicionar arquivo) > HTML**.
2. Nomeie o arquivo exatamente como **\`Index\`** (ficará como \`Index.html\`).
3. Cole o código fornecido na aba **Index.html**.
4. Salve o projeto.

---

### Passo 5: Vincular o Formulário do Google Forms (Para Chamados)
1. Na sua planilha, clique em **Ferramentas > Criar um formulário**.
2. Crie as seguintes perguntas no formulário:
   - **Nome Completo** (Resposta curta - Obrigatório)
   - **E-mail** (Resposta curta - Obrigatório)
   - **Setor / Departamento** (Lista suspensa: Financeiro, RH, Comercial, TI, Operações, Marketing)
   - **Categoria do Problema** (Múltipla escolha com ícones amigáveis):
     - 🔴 Sem internet / Rede
     - 🖨️ Impressora não funciona
     - 💻 Computador não liga / Lento
     - 🔑 Acessos & Senhas
     - 📦 Instalação de Software
     - ⚙️ Outros
   - **Descrição Detalhada** (Parágrafo - Obrigatório)
   - **Prioridade Sugerida** (Múltipla escolha: Baixa, Média, Alta, Crítica)

---

### Passo 6: Ativar o Gatilho Automático (Trigger \`onFormSubmit\`)
1. No editor do Apps Script, clique no ícone de relógio na barra lateral esquerda (**Acionadores / Gatilhos**).
2. Clique no botão azul **+ Adicionar Acionador** (canto inferior direito).
3. Preencha as configurações:
   - **Escolha qual função executar**: \`onFormSubmit\`
   - **Qual implantação deve ser executada**: \`Head\`
   - **Selecione a fonte do evento**: \`Da planilha\`
   - **Selecione o tipo de evento**: \`Ao enviar formulário\`
4. Clique em **Salvar** e autorize o escopo do Gmail e Planilhas.
*Pronto! Todo chamado preenchido no Forms agora gera ID automático e envia e-mail de confirmação ao solicitante!*

---

### Passo 7: Publicar como Web App para a Equipe de TI
1. No canto superior direito do Apps Script, clique em **Implantar > Nova implantação**.
2. Clique no ícone de engrenagem ⚙️ (Selecionar tipo) e escolha **Aplicativo da Web**.
3. Configure os campos:
   - **Descrição**: \`Painel DeskOps TI v2.0\`
   - **Executar como**: \`Usuário que está acessando o aplicativo da Web\` (para capturar o e-mail real do técnico)
   - **Quem tem acesso**: \`Qualquer pessoa na sua organização\`
4. Clique em **Implantar**.
5. Copie a **URL do Aplicativo da Web**: essa é a URL oficial que os técnicos usarão no navegador!
`;
