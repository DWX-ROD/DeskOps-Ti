/**
 * @file googleSheets.ts
 * @description Comunicação direta com a API do Google Sheets v4 e Google Drive v3 para usar a planilha como banco de dados principal.
 */

import { Chamado, Funcionario, Equipamento, Movimentacao, PrioridadeChamado, StatusChamado, TipoEquipamento, StatusEquipamento } from '../types';
import { normalizarSetor } from '../data/initialData';
import { calcularSla } from '../utils/sla';

export const NOMES_ABAS = {
  FUNCIONARIOS: 'Funcionários',
  EQUIPAMENTOS: 'Equipamentos (Inventário)',
  CHAMADOS: 'Chamados (Helpdesk)',
  MOVIMENTACOES: 'Movimentações (Histórico)'
} as const;

export const CABECALHOS = {
  [NOMES_ABAS.FUNCIONARIOS]: [
    'Nome do Colaborador',
    'Email',
    'Setor',
    'Status',
    'Equipamentos Alocados'
  ],
  [NOMES_ABAS.EQUIPAMENTOS]: [
    'Património',
    'Tipo',
    'Marca & Modelo',
    'Nº de Série',
    'Status',
    'Colaborador Alocado'
  ],
  [NOMES_ABAS.CHAMADOS]: [
    'Protocolo',
    'Data/Hora',
    'Solicitante',
    'Email',
    'Setor',
    'Categoria',
    'Descrição',
    'Prioridade',
    'Status',
    'SLA',
    'Técnico Responsável'
  ],
  [NOMES_ABAS.MOVIMENTACOES]: [
    'Data/Hora',
    'Património',
    'Colaborador Origem',
    'Colaborador Destino',
    'Tipo de Movimentação',
    'Observações'
  ]
};

export interface PlanilhaMetadados {
  id: string;
  nome: string;
  url: string;
  abasExistentes: { id: number; titulo: string }[];
}

export interface ArquivoDrive {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

/**
 * Cria uma nova planilha no Google Drive formatada com as 4 abas estruturadas
 */
export async function criarPlanilhaBancoDeDados(
  accessToken: string,
  titulo: string = 'DeskOps TI - Banco de Dados'
): Promise<PlanilhaMetadados> {
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';

  const body = {
    properties: {
      title: titulo
    },
    sheets: [
      {
        properties: {
          title: NOMES_ABAS.CHAMADOS,
          gridProperties: { frozenRowCount: 1 }
        }
      },
      {
        properties: {
          title: NOMES_ABAS.EQUIPAMENTOS,
          gridProperties: { frozenRowCount: 1 }
        }
      },
      {
        properties: {
          title: NOMES_ABAS.FUNCIONARIOS,
          gridProperties: { frozenRowCount: 1 }
        }
      },
      {
        properties: {
          title: NOMES_ABAS.MOVIMENTACOES,
          gridProperties: { frozenRowCount: 1 }
        }
      }
    ]
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const erro = await res.json().catch(() => ({}));
    throw new Error(erro?.error?.message || `Erro ao criar planilha: ${res.statusText}`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;

  // Preenche os cabeçalhos das 4 abas
  const dadosValores = [
    {
      range: `'${NOMES_ABAS.CHAMADOS}'!A1:K1`,
      values: [CABECALHOS[NOMES_ABAS.CHAMADOS]]
    },
    {
      range: `'${NOMES_ABAS.EQUIPAMENTOS}'!A1:F1`,
      values: [CABECALHOS[NOMES_ABAS.EQUIPAMENTOS]]
    },
    {
      range: `'${NOMES_ABAS.FUNCIONARIOS}'!A1:E1`,
      values: [CABECALHOS[NOMES_ABAS.FUNCIONARIOS]]
    },
    {
      range: `'${NOMES_ABAS.MOVIMENTACOES}'!A1:F1`,
      values: [CABECALHOS[NOMES_ABAS.MOVIMENTACOES]]
    }
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: dadosValores
    })
  });

  const abas = (data.sheets || []).map((s: any) => ({
    id: s.properties.sheetId,
    titulo: s.properties.title
  }));

  return {
    id: spreadsheetId,
    nome: titulo,
    url: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    abasExistentes: abas
  };
}

/**
 * Obtém os metadados de uma planilha existente e garante que as 4 abas e cabeçalhos estejam presentes
 */
export async function obterEGarantirEstruturaPlanilha(
  spreadsheetId: string,
  accessToken: string
): Promise<PlanilhaMetadados> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const erro = await res.json().catch(() => ({}));
    throw new Error(erro?.error?.message || `Erro ao carregar planilha (${res.status}): Verifique se o ID está correto e se sua conta Google tem permissão.`);
  }

  const data = await res.json();
  let abas = (data.sheets || []).map((s: any) => ({
    id: s.properties.sheetId as number,
    titulo: s.properties.title as string
  }));

  const titulosExistentes = abas.map((a: { id: number; titulo: string }) => a.titulo);
  const requests: any[] = [];

  // Cria abas ausentes
  const abasNecessarias = [
    NOMES_ABAS.CHAMADOS,
    NOMES_ABAS.EQUIPAMENTOS,
    NOMES_ABAS.FUNCIONARIOS,
    NOMES_ABAS.MOVIMENTACOES
  ];

  for (const nomeAba of abasNecessarias) {
    if (!titulosExistentes.includes(nomeAba)) {
      requests.push({
        addSheet: {
          properties: {
            title: nomeAba,
            gridProperties: { frozenRowCount: 1 }
          }
        }
      });
    }
  }

  if (requests.length > 0) {
    const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });

    if (updateRes.ok) {
      const updateData = await updateRes.json();
      const novasAbas = (updateData.replies || [])
        .filter((r: any) => r.addSheet)
        .map((r: any) => ({
          id: r.addSheet.properties.sheetId,
          titulo: r.addSheet.properties.title
        }));
      abas = [...abas, ...novasAbas];
    }
  }

  // Verifica e escreve os cabeçalhos caso as abas estejam vazias
  const batchValues: any[] = [];
  for (const nomeAba of abasNecessarias) {
    const headerRange = `'${nomeAba}'!A1:Z1`;
    const checkRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(headerRange)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (checkRes.ok) {
      const checkData = await checkRes.json();
      if (!checkData.values || checkData.values.length === 0 || !checkData.values[0] || checkData.values[0].length === 0) {
        batchValues.push({
          range: `'${nomeAba}'!A1:${String.fromCharCode(64 + CABECALHOS[nomeAba].length)}1`,
          values: [CABECALHOS[nomeAba]]
        });
      }
    }
  }

  if (batchValues.length > 0) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: batchValues
      })
    });
  }

  return {
    id: spreadsheetId,
    nome: data.properties?.title || 'Planilha DeskOps TI',
    url: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    abasExistentes: abas
  };
}

export interface ResultadoSincronizacaoForms {
  totalNovosImportados: number;
  novosChamados: Chamado[];
  nomeAbaOrigem: string | null;
}

/**
 * Lê novas respostas enviadas pelo Google Forms na aba 'Respostas ao formulário 1'
 * (ou qualquer aba de respostas vinculada pelo Google Forms),
 * formata o protocolo sequencial CH-2026-XXXX, calcula o SLA por prioridade,
 * grava diretamente na aba 'Chamados (Helpdesk)' e retorna os chamados novos gerados.
 */
export async function sincronizarAbaFormularioParaChamados(
  spreadsheetId: string,
  accessToken: string,
  abasExistentes?: { id: number; titulo: string }[]
): Promise<ResultadoSincronizacaoForms> {
  try {
    // 1. Descobrir se há alguma aba de respostas do Google Forms
    let abas = abasExistentes;
    if (!abas || abas.length === 0) {
      const metaRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties(sheetId,title)`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (metaRes.ok) {
        const metaData = await metaRes.json();
        abas = (metaData.sheets || []).map((s: any) => ({
          id: s.properties?.sheetId,
          titulo: s.properties?.title
        }));
      }
    }

    // Procura por abas criadas pelo Google Forms
    // Padrões comuns: "Respostas ao formulário 1", "Respostas ao formulário", "Form Responses 1"
    const abaForms = (abas || []).find((a) => {
      const t = (a.titulo || '').toLowerCase().trim();
      return (
        t.includes('respostas ao formul') ||
        t.includes('respostas ao form') ||
        t.includes('form responses') ||
        t.startsWith('respostas')
      );
    });

    const nomeAbaRespostas = abaForms ? abaForms.titulo : 'Respostas ao formulário 1';

    // 2. Busca todas as linhas da aba de respostas do formulário
    const resForms = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent("'" + nomeAbaRespostas + "'!A1:Z")}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!resForms.ok) {
      // Se a aba não existe ainda na planilha, retorna vazio sem travar a aplicação
      return { totalNovosImportados: 0, novosChamados: [], nomeAbaOrigem: null };
    }

    const dataForms = await resForms.json();
    const rowsForms: any[][] = dataForms.values || [];

    if (rowsForms.length <= 1) {
      // Aba vazia ou só contém linha de cabeçalho
      return { totalNovosImportados: 0, novosChamados: [], nomeAbaOrigem: nomeAbaRespostas };
    }

    // 3. Lê os chamados já existentes na aba 'Chamados (Helpdesk)'
    const resChamados = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent("'" + NOMES_ABAS.CHAMADOS + "'!A1:K")}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const dataChamados = resChamados.ok ? await resChamados.json() : { values: [] };
    const rowsChamados: any[][] = dataChamados.values || [];

    // Determina o maior sequencial existente para continuar o padrão CH-2026-XXXX
    let maxSequencial = 0;
    const anoAtual = new Date().getFullYear();

    for (let i = 1; i < rowsChamados.length; i++) {
      const protocolo = String(rowsChamados[i][0] || '').trim();
      const match = protocolo.match(/^CH-(\d{4})-(\d+)$/i);
      if (match) {
        const num = parseInt(match[2], 10);
        if (!isNaN(num) && num > maxSequencial) {
          maxSequencial = num;
        }
      }
    }

    // Se nenhum chamado tiver protocolo CH-YYYY-XXXX, usa o total de linhas como base
    if (maxSequencial === 0 && rowsChamados.length > 1) {
      maxSequencial = rowsChamados.length - 1;
    }

    // Constrói assinaturas únicas dos chamados já presentes para evitar duplicatas
    const assinaturasExistentes = new Set<string>();
    for (let i = 1; i < rowsChamados.length; i++) {
      const r = rowsChamados[i];
      const dataH = String(r[1] || '').trim();
      const sol = String(r[2] || '').trim().toLowerCase();
      const em = String(r[3] || '').trim().toLowerCase();
      const desc = String(r[6] || '').trim().toLowerCase();

      const digitosData = dataH.replace(/\D/g, '');
      if (digitosData && em) assinaturasExistentes.add(`${digitosData}_${em}`);
      if (digitosData && sol) assinaturasExistentes.add(`${digitosData}_${sol}`);
      if (em && desc) assinaturasExistentes.add(`${em}_${desc.slice(0, 40)}`);
      if (sol && desc) assinaturasExistentes.add(`${sol}_${desc.slice(0, 40)}`);
      if (dataH) assinaturasExistentes.add(dataH);
    }

    // 4. Mapeamento inteligente de colunas pelo cabeçalho da aba de respostas do Forms
    const cabecalhos = (rowsForms[0] || []).map((h: any) => String(h || '').trim().toLowerCase());

    let colCarimbo = cabecalhos.findIndex((h: string) => h.includes('carimbo') || h.includes('data') || h.includes('timestamp'));
    if (colCarimbo === -1) colCarimbo = 0;

    let colSetor = cabecalhos.findIndex((h: string) => h.includes('setor') || h.includes('departamento') || h.includes('área') || h.includes('area'));

    let colDescricao = cabecalhos.findIndex((h: string) => h.includes('descri') || h.includes('detalhe') || h.includes('mensagem') || h.includes('precisa') || h.includes('problema'));

    let colNome = cabecalhos.findIndex((h: string) => h.includes('nome') || h.includes('solicitante') || h.includes('colaborador') || h.includes('contato') || h.includes('ramal'));

    let colEmail = cabecalhos.findIndex((h: string) => h.includes('e-mail') || h.includes('email') || h.includes('endereço'));

    let colCategoria = cabecalhos.findIndex((h: string) => h.includes('categoria') || h.includes('tipo'));

    let colUrgencia = cabecalhos.findIndex((h: string) => h.includes('urgência') || h.includes('urgencia') || h.includes('prioridade') || h.includes('impacto'));

    // 5. Itera sobre as respostas e gera os novos chamados
    const novasLinhas: any[][] = [];
    const novosChamados: Chamado[] = [];

    for (let r = 1; r < rowsForms.length; r++) {
      const row = rowsForms[r];
      if (!row || row.length === 0 || !row.some((c: any) => c && String(c).trim())) {
        continue;
      }

      const carimboOriginal = colCarimbo !== -1 && row[colCarimbo] ? String(row[colCarimbo]).trim() : '';

      // Setor identificado
      const setorBruto = (colSetor !== -1 && row[colSetor]) 
        ? String(row[colSetor]).trim() 
        : (row[1] ? String(row[1]).trim() : 'TI');
      const setor = normalizarSetor(setorBruto);

      // Descrição do problema / O que o setor precisa
      const descricao = (colDescricao !== -1 && row[colDescricao]) 
        ? String(row[colDescricao]).trim() 
        : (row[2] ? String(row[2]).trim() : 'Solicitação de suporte aberta pelo setor');

      // Solicitante: nome informado ou padrão "Setor [SETOR]"
      const nomeContato = (colNome !== -1 && row[colNome]) ? String(row[colNome]).trim() : '';
      const solicitante = nomeContato || `Setor ${setor}`;

      const email = (colEmail !== -1 && row[colEmail]) ? String(row[colEmail]).trim() : '';
      const categoriaBruta = (colCategoria !== -1 && row[colCategoria]) ? String(row[colCategoria]).trim() : 'Geral / Suporte ao Setor';
      const urgenciaBruta = (colUrgencia !== -1 && row[colUrgencia]) ? String(row[colUrgencia]).trim() : 'Média';

      const digitosData = carimboOriginal.replace(/\D/g, '');
      const emLower = email.toLowerCase();
      const solLower = solicitante.toLowerCase();
      const descLower = descricao.slice(0, 40).toLowerCase();

      // Checa duplicidade
      const jaExiste =
        (digitosData && emLower && assinaturasExistentes.has(`${digitosData}_${emLower}`)) ||
        (digitosData && solLower && assinaturasExistentes.has(`${digitosData}_${solLower}`)) ||
        (emLower && descLower && assinaturasExistentes.has(`${emLower}_${descLower}`)) ||
        (carimboOriginal && assinaturasExistentes.has(carimboOriginal));

      if (jaExiste) {
        continue;
      }

      // Novo chamado detectado! Gera sequencial no padrão CH-YYYY-XXXX (ex: CH-2026-0045)
      maxSequencial++;
      const protocolo = `CH-${anoAtual}-${String(maxSequencial).padStart(4, '0')}`;

      // Prioridade e SLA
      let prioridade: PrioridadeChamado = 'Média';
      const uLower = urgenciaBruta.toLowerCase();
      if (uLower.includes('crític') || uLower.includes('critic') || uLower.includes('2h')) {
        prioridade = 'Crítica';
      } else if (uLower.includes('alta') || uLower.includes('4h')) {
        prioridade = 'Alta';
      } else if (uLower.includes('baixa') || uLower.includes('24h')) {
        prioridade = 'Baixa';
      } else {
        prioridade = 'Média';
      }

      const dataAbertura = carimboOriginal || new Date().toISOString();
      const sla = calcularSla(dataAbertura, prioridade, 'Aberto');
      const tempoAtendimentoSla = `${sla.limiteHoras}h (Dentro do Prazo)`;

      const linhaTabela = [
        protocolo,
        dataAbertura,
        solicitante,
        email,
        setor,
        categoriaBruta,
        descricao,
        prioridade,
        'Aberto',
        tempoAtendimentoSla,
        '' // Técnico Responsável inicial: vazio
      ];

      novasLinhas.push(linhaTabela);

      novosChamados.push({
        id: protocolo,
        dataHoraAbertura: dataAbertura,
        nomeSolicitante: solicitante,
        emailSolicitante: email,
        setor,
        categoria: categoriaBruta,
        descricao,
        prioridade,
        status: 'Aberto',
        tempoAtendimentoSla,
        emailTecnicoResponsavel: '',
        observacoesTecnicas: `Chamado importado automaticamente da aba "${nomeAbaRespostas}".`,
        dataFechamento: null
      });

      // Registra assinatura para não duplicar se houver múltiplas submissões
      if (digitosData && emLower) assinaturasExistentes.add(`${digitosData}_${emLower}`);
      if (carimboOriginal) assinaturasExistentes.add(carimboOriginal);
      if (emLower && descLower) assinaturasExistentes.add(`${emLower}_${descLower}`);
    }

    // 6. Grava em lote na aba 'Chamados (Helpdesk)' da planilha
    if (novasLinhas.length > 0) {
      const appendRange = `'${NOMES_ABAS.CHAMADOS}'!A:K`;
      const resAppend = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(appendRange)}:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ values: novasLinhas })
        }
      );

      if (!resAppend.ok) {
        console.warn('Erro ao anexar novos chamados do Forms no Sheets:', await resAppend.text());
      }
    }

    return {
      totalNovosImportados: novosChamados.length,
      novosChamados,
      nomeAbaOrigem: nomeAbaRespostas
    };
  } catch (err) {
    console.error('Erro na sincronização de Respostas ao Formulário 1:', err);
    return { totalNovosImportados: 0, novosChamados: [], nomeAbaOrigem: null };
  }
}

/**
 * Lê todos os dados das 4 abas em uma única requisição em lote (batchGet)
 * e sincroniza previamente novas respostas da aba 'Respostas ao formulário 1'.
 */
export async function carregarDadosDoGoogleSheets(
  spreadsheetId: string,
  accessToken: string,
  abasExistentes?: { id: number; titulo: string }[]
): Promise<{
  chamados: Chamado[];
  equipamentos: Equipamento[];
  funcionarios: Funcionario[];
  movimentacoes: Movimentacao[];
  novosChamadosForms?: Chamado[];
}> {
  // Sincroniza automaticamente qualquer resposta nova do Google Forms para Chamados (Helpdesk)
  let novosChamadosForms: Chamado[] = [];
  try {
    const resSync = await sincronizarAbaFormularioParaChamados(spreadsheetId, accessToken, abasExistentes);
    if (resSync.totalNovosImportados > 0) {
      novosChamadosForms = resSync.novosChamados;
    }
  } catch (errSync) {
    console.warn('Sincronização de formulário:', errSync);
  }

  const ranges = [
    `'${NOMES_ABAS.CHAMADOS}'!A2:K`,
    `'${NOMES_ABAS.EQUIPAMENTOS}'!A2:F`,
    `'${NOMES_ABAS.FUNCIONARIOS}'!A2:E`,
    `'${NOMES_ABAS.MOVIMENTACOES}'!A2:F`
  ];

  const params = ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join('&');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${params}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const erro = await res.json().catch(() => ({}));
    throw new Error(erro?.error?.message || `Erro ao ler dados da planilha (${res.status}).`);
  }

  const data = await res.json();
  const valueRanges = data.valueRanges || [];

  const rawChamados = valueRanges[0]?.values || [];
  const rawEquipamentos = valueRanges[1]?.values || [];
  const rawFuncionarios = valueRanges[2]?.values || [];
  const rawMovimentacoes = valueRanges[3]?.values || [];

  // Mapeia Chamados
  // Colunas: Protocolo, Data/Hora, Solicitante, Email, Setor, Categoria, Descrição, Prioridade, Status, SLA, Técnico Responsável
  const chamados: Chamado[] = rawChamados.map((row: any[], index: number) => {
    return {
      id: row[0] || `CH-2026-${(index + 1).toString().padStart(4, '0')}`,
      dataHoraAbertura: row[1] || new Date().toISOString(),
      nomeSolicitante: row[2] || 'Colaborador',
      emailSolicitante: row[3] || '',
      setor: normalizarSetor(row[4] || 'TI'),
      categoria: row[5] || '⚙️ Outros',
      descricao: row[6] || '',
      prioridade: (row[7] || 'Média') as PrioridadeChamado,
      status: (row[8] || 'Aberto') as StatusChamado,
      tempoAtendimentoSla: row[9] || 'No Prazo',
      emailTecnicoResponsavel: row[10] || '',
      observacoesTecnicas: '',
      dataFechamento: null
    };
  });

  // Mapeia Equipamentos
  // Colunas: Património, Tipo, Marca & Modelo, Nº de Série, Status, Colaborador Alocado
  const equipamentos: Equipamento[] = rawEquipamentos.map((row: any[], index: number) => {
    const rawStatus = (row[4] || 'Disponível').trim();
    let statusFormatado: StatusEquipamento = 'Disponível';
    if (rawStatus.toLowerCase().includes('uso')) statusFormatado = 'Em Uso';
    else if (rawStatus.toLowerCase().includes('manuten')) statusFormatado = 'Em Manutenção';
    else if (rawStatus.toLowerCase().includes('descart')) statusFormatado = 'Descartado';
    else if (rawStatus.toLowerCase().includes('estoque') || rawStatus.toLowerCase().includes('dispon')) statusFormatado = 'Disponível';

    return {
      id: row[0] || `PAT-${(index + 1).toString().padStart(4, '0')}`,
      tipo: (row[1] || 'Notebook') as TipoEquipamento,
      marcaModelo: row[2] || 'Equipamento TI',
      numSerie: row[3] || 'S/N',
      status: statusFormatado,
      funcionarioAlocado: row[5] && row[5].trim() ? row[5].trim() : null,
      dataUltimaMovimentacao: new Date().toISOString()
    };
  });

  // Mapeia Funcionários
  // Colunas: Nome do Colaborador, Email, Setor, Status, Equipamentos Alocados
  const funcionarios: Funcionario[] = rawFuncionarios.map((row: any[], index: number) => {
    return {
      id: `FUNC-${(index + 1).toString().padStart(4, '0')}`,
      nomeCompleto: row[0] || 'Colaborador',
      email: row[1] || `colaborador${index + 1}@empresa.com`,
      setor: normalizarSetor(row[2] || 'TI'),
      status: ((row[3] || 'Ativo').toLowerCase().includes('inativ') ? 'Inativo' : 'Ativo') as 'Ativo' | 'Inativo',
      cpf: '000.000.000-00',
      cargo: 'Colaborador'
    };
  });

  // Mapeia Movimentações
  // Colunas: Data/Hora, Património, Colaborador Origem, Colaborador Destino, Tipo de Movimentação, Observações
  const movimentacoes: Movimentacao[] = rawMovimentacoes.map((row: any[], index: number) => {
    const tipo = (row[4] || 'Atribuição') as any;
    return {
      id: `MOV-${(index + 1).toString().padStart(4, '0')}`,
      dataHora: row[0] || new Date().toISOString(),
      idEquipamento: row[1] || '',
      funcionarioEnvolvido: row[3] || row[2] || 'Estoque',
      tipoAcao: tipo.includes('Devol') ? 'Devolução' : tipo.includes('Manut') ? 'Manutenção' : 'Atribuição',
      emailTecnicoResponsavel: 'tecnico@empresa.com',
      observacoes: row[5] || ''
    };
  });

  return { chamados, equipamentos, funcionarios, movimentacoes, novosChamadosForms };
}

/**
 * Insere um novo chamado na aba 'Chamados (Helpdesk)'
 */
export async function gravarNovoChamadoNaPlanilha(
  spreadsheetId: string,
  accessToken: string,
  chamado: Chamado
): Promise<void> {
  const range = `'${NOMES_ABAS.CHAMADOS}'!A:K`;
  const linha = [
    chamado.id,
    chamado.dataHoraAbertura,
    chamado.nomeSolicitante,
    chamado.emailSolicitante,
    chamado.setor,
    chamado.categoria,
    chamado.descricao,
    chamado.prioridade,
    chamado.status,
    chamado.tempoAtendimentoSla || 'No Prazo',
    chamado.emailTecnicoResponsavel || ''
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values: [linha] })
  });
}

/**
 * Atualiza um chamado existente na aba 'Chamados (Helpdesk)'
 */
export async function atualizarChamadoNaPlanilha(
  spreadsheetId: string,
  accessToken: string,
  chamado: Chamado
): Promise<void> {
  // 1. Busca os IDs na coluna A para descobrir o índice da linha
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${NOMES_ABAS.CHAMADOS}'!A:A`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) return;

  const data = await res.json();
  const rows: string[][] = data.values || [];
  let rowIndex = -1;

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === chamado.id) {
      rowIndex = i + 1; // 1-indexed
      break;
    }
  }

  if (rowIndex === -1) {
    // Se não achou por algum motivo, anexa
    await gravarNovoChamadoNaPlanilha(spreadsheetId, accessToken, chamado);
    return;
  }

  const range = `'${NOMES_ABAS.CHAMADOS}'!A${rowIndex}:K${rowIndex}`;
  const linha = [
    chamado.id,
    chamado.dataHoraAbertura,
    chamado.nomeSolicitante,
    chamado.emailSolicitante,
    chamado.setor,
    chamado.categoria,
    chamado.descricao,
    chamado.prioridade,
    chamado.status,
    chamado.tempoAtendimentoSla || 'No Prazo',
    chamado.emailTecnicoResponsavel || ''
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values: [linha] })
  });
}

/**
 * Insere ou atualiza um equipamento na aba 'Equipamentos (Inventário)'
 */
export async function salvarEquipamentoNaPlanilha(
  spreadsheetId: string,
  accessToken: string,
  eq: Equipamento
): Promise<void> {
  // Procura linha correspondente pelo ID do Patrimônio
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${NOMES_ABAS.EQUIPAMENTOS}'!A:A`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  const rowValues = [
    eq.id,
    eq.tipo,
    eq.marcaModelo,
    eq.numSerie,
    eq.status,
    eq.funcionarioAlocado || ''
  ];

  if (res.ok) {
    const data = await res.json();
    const rows: string[][] = data.values || [];
    let rowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === eq.id) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex > 1) {
      // Atualiza linha existente
      const range = `'${NOMES_ABAS.EQUIPAMENTOS}'!A${rowIndex}:F${rowIndex}`;
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: [rowValues] })
      });
      return;
    }
  }

  // Anexa nova linha
  const rangeAppend = `'${NOMES_ABAS.EQUIPAMENTOS}'!A:F`;
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(rangeAppend)}:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values: [rowValues] })
  });
}

/**
 * Remove um equipamento da aba 'Equipamentos (Inventário)'
 */
export async function removerEquipamentoDaPlanilha(
  spreadsheetId: string,
  accessToken: string,
  sheetId: number,
  idEquipamento: string
): Promise<void> {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${NOMES_ABAS.EQUIPAMENTOS}'!A:A`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) return;

  const data = await res.json();
  const rows: string[][] = data.values || [];
  let rowIndex0 = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === idEquipamento) {
      rowIndex0 = i; // 0-indexed for batchUpdate
      break;
    }
  }

  if (rowIndex0 > 0) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex0,
                endIndex: rowIndex0 + 1
              }
            }
          }
        ]
      })
    });
  }
}

/**
 * Grava uma nova movimentação na aba 'Movimentações (Histórico)'
 */
export async function gravarMovimentacaoNaPlanilha(
  spreadsheetId: string,
  accessToken: string,
  mov: Movimentacao
): Promise<void> {
  const range = `'${NOMES_ABAS.MOVIMENTACOES}'!A:F`;
  const linha = [
    mov.dataHora,
    mov.idEquipamento,
    mov.tipoAcao === 'Devolução' ? mov.funcionarioEnvolvido : 'Estoque / TI',
    mov.tipoAcao === 'Atribuição' ? mov.funcionarioEnvolvido : 'Estoque / Manutenção',
    mov.tipoAcao,
    mov.observacoes
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values: [linha] })
  });
}

/**
 * Salva ou atualiza um colaborador na aba 'Funcionários'
 */
export async function salvarFuncionarioNaPlanilha(
  spreadsheetId: string,
  accessToken: string,
  func: Funcionario,
  equipamentosAlocados: string = ''
): Promise<void> {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${NOMES_ABAS.FUNCIONARIOS}'!B:B`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  const rowValues = [
    func.nomeCompleto,
    func.email,
    func.setor,
    func.status,
    equipamentosAlocados
  ];

  if (res.ok) {
    const data = await res.json();
    const rows: string[][] = data.values || [];
    let rowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] && rows[i][0].toLowerCase() === func.email.toLowerCase()) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex > 1) {
      const range = `'${NOMES_ABAS.FUNCIONARIOS}'!A${rowIndex}:E${rowIndex}`;
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: [rowValues] })
      });
      return;
    }
  }

  const rangeAppend = `'${NOMES_ABAS.FUNCIONARIOS}'!A:E`;
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(rangeAppend)}:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values: [rowValues] })
  });
}

/**
 * Remove um colaborador da aba 'Funcionários'
 */
export async function removerFuncionarioDaPlanilha(
  spreadsheetId: string,
  accessToken: string,
  sheetId: number,
  emailFuncionario: string
): Promise<void> {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${NOMES_ABAS.FUNCIONARIOS}'!B:B`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) return;

  const data = await res.json();
  const rows: string[][] = data.values || [];
  let rowIndex0 = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] && rows[i][0].toLowerCase() === emailFuncionario.toLowerCase()) {
      rowIndex0 = i;
      break;
    }
  }

  if (rowIndex0 > 0) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex0,
                endIndex: rowIndex0 + 1
              }
            }
          }
        ]
      })
    });
  }
}

/**
 * Semeia registros iniciais na planilha caso esteja vazia
 */
export async function popularDadosIniciaisNaPlanilha(
  spreadsheetId: string,
  accessToken: string,
  chamados: Chamado[],
  equipamentos: Equipamento[],
  funcionarios: Funcionario[],
  movimentacoes: Movimentacao[]
): Promise<void> {
  const batchData = [
    {
      range: `'${NOMES_ABAS.CHAMADOS}'!A2:K`,
      values: chamados.map((c) => [
        c.id,
        c.dataHoraAbertura,
        c.nomeSolicitante,
        c.emailSolicitante,
        c.setor,
        c.categoria,
        c.descricao,
        c.prioridade,
        c.status,
        c.tempoAtendimentoSla || 'No Prazo',
        c.emailTecnicoResponsavel || ''
      ])
    },
    {
      range: `'${NOMES_ABAS.EQUIPAMENTOS}'!A2:F`,
      values: equipamentos.map((eq) => [
        eq.id,
        eq.tipo,
        eq.marcaModelo,
        eq.numSerie,
        eq.status,
        eq.funcionarioAlocado || ''
      ])
    },
    {
      range: `'${NOMES_ABAS.FUNCIONARIOS}'!A2:E`,
      values: funcionarios.map((f) => {
        const eqAloc = equipamentos
          .filter((e) => e.funcionarioAlocado && e.funcionarioAlocado.toLowerCase() === f.nomeCompleto.toLowerCase())
          .map((e) => e.id)
          .join(', ');
        return [
          f.nomeCompleto,
          f.email,
          f.setor,
          f.status,
          eqAloc || 'Nenhum'
        ];
      })
    },
    {
      range: `'${NOMES_ABAS.MOVIMENTACOES}'!A2:F`,
      values: movimentacoes.map((m) => [
        m.dataHora,
        m.idEquipamento,
        m.tipoAcao === 'Devolução' ? m.funcionarioEnvolvido : 'Estoque / TI',
        m.tipoAcao === 'Atribuição' ? m.funcionarioEnvolvido : 'Estoque / Manutenção',
        m.tipoAcao,
        m.observacoes
      ])
    }
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: batchData
    })
  });
}

/**
 * Lista planilhas do Google Drive do usuário para facilitar a seleção
 */
export async function listarPlanilhasDoDrive(accessToken: string): Promise<ArquivoDrive[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,webViewLink)&pageSize=25&orderBy=modifiedTime desc`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return data.files || [];
}
