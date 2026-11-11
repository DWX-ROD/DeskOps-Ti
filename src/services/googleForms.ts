/**
 * @file googleForms.ts
 * @description Integração com a Google Forms API v1 para criação e vinculação automática do formulário de abertura de chamados.
 */

export interface GoogleFormCriado {
  formId: string;
  responderUri: string;
  editUri: string;
  titulo: string;
}

export const CAMPOS_FORMULARIO_PADRAO = {
  TITULO: 'DeskOps TI - Abertura de Chamado por Setor',
  DESCRICAO: 'Canal oficial de suporte técnico. Basta selecionar o seu Setor e descrever o que você precisa. A equipe de TI fará a triagem e o atendimento.',
  CATEGORIAS: [
    '💻 Hardware (Computador, Monitor, Periféricos)',
    '🌐 Redes / Internet / Wi-Fi',
    '🔐 Acessos, Senhas & Permissões',
    '🖨️ Impressoras & Digitalização',
    '⚙️ Software, Sistemas & ERP',
    '📦 Outros Assuntos'
  ],
  SETORES: [
    'OBIC',
    'RH',
    'GPAI',
    'SECEXECC',
    'GCOM',
    'PLAN',
    'OUVIDORIA',
    'GTEC',
    'GEDH',
    'GPC',
    'FOMENTO',
    'TI',
    'CPECV',
    'CPAD',
    'PRESTAÇÃO DE CONTAS',
    'PATRIMONIO',
    'JURIDICO',
    'FINANCEIRO',
    'SECEXECG',
    'GABINETE',
    'GADM',
    'MAPA CULTURAL',
    'GCICO',
    'ARQUITETURA',
    'COMED',
    'GPE',
    'CASA DOS CONSELHOS'
  ],
  URGENCIAS: [
    'Baixa (Até 24h)',
    'Média (Até 8h)',
    'Alta (Até 4h)',
    'Crítica (Até 2h - Sistema parado)'
  ]
};

/**
 * Cria o Google Form oficial de abertura de chamados na conta Google do usuário usando a Google Forms API v1
 * Estrutura simplificada focada em SETOR para facilitar a abertura pelos colaboradores.
 */
export async function criarGoogleFormChamados(
  accessToken: string,
  titulo: string = CAMPOS_FORMULARIO_PADRAO.TITULO,
  setoresPersonalizados?: string[]
): Promise<GoogleFormCriado> {
  const listaSetores = (setoresPersonalizados && setoresPersonalizados.length > 0)
    ? setoresPersonalizados
    : CAMPOS_FORMULARIO_PADRAO.SETORES;

  // 1. Cria o formulário base
  const resCriacao = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      info: {
        title: titulo
      }
    })
  });

  if (!resCriacao.ok) {
    const erro = await resCriacao.json().catch(() => ({}));
    throw new Error(erro?.error?.message || `Erro ao criar Google Form (${resCriacao.statusText}).`);
  }

  const formData = await resCriacao.json();
  const formId = formData.formId;

  // 2. Adiciona os campos simplificados focados no SETOR:
  // - Item 0: Setor / Departamento (Lista suspensa obrigatória com os 27 setores)
  // - Item 1: O que o seu Setor precisa? (Texto longo obrigatório)
  // - Item 2: Colaborador / Ramal de Contato (Texto curto opcional)
  const requests = [
    {
      createItem: {
        item: {
          title: 'Setor / Departamento Solicitante',
          description: 'Selecione o setor da sua empresa que necessita de suporte técnico.',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'DROP_DOWN',
                options: listaSetores.map((s) => ({ value: s }))
              }
            }
          }
        },
        location: { index: 0 }
      }
    },
    {
      createItem: {
        item: {
          title: 'O que o seu Setor precisa? (Descrição do problema)',
          description: 'Descreva em poucas palavras o que está acontecendo (ex: computador não liga, impressora sem papel, sem acesso à internet).',
          questionItem: {
            question: {
              required: true,
              textQuestion: { paragraph: true }
            }
          }
        },
        location: { index: 1 }
      }
    },
    {
      createItem: {
        item: {
          title: 'Colaborador / Ramal de Contato no Setor (Opcional)',
          description: 'Se desejar, informe seu nome ou ramal para facilitar o contato pelo técnico de TI.',
          questionItem: {
            question: {
              required: false,
              textQuestion: { paragraph: false }
            }
          }
        },
        location: { index: 2 }
      }
    }
  ];

  const resItens = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ requests })
  });

  if (!resItens.ok) {
    const erro = await resItens.json().catch(() => ({}));
    const detalhe = erro?.error?.message || resItens.statusText;
    console.error('Erro ao popular itens do Forms via API:', erro);
    throw new Error(`O formulário foi criado no Drive (ID: ${formId}), mas não foi possível adicionar as perguntas: ${detalhe}. Você pode recriá-lo a qualquer momento.`);
  }

  const responderUri = formData.responderUri || `https://docs.google.com/forms/d/e/${formId}/viewform`;
  const editUri = `https://docs.google.com/forms/d/${formId}/edit`;

  return {
    formId,
    responderUri,
    editUri,
    titulo
  };
}

/**
 * Extrai o ID do formulário a partir de um link completo ou ID direto
 */
export function extrairFormId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  // Ex: https://docs.google.com/forms/d/1FAIpQLSc.../edit
  const match = trimmed.match(/\/forms\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  // Ex: https://docs.google.com/forms/d/e/1FAIpQLSc.../viewform
  const matchE = trimmed.match(/\/forms\/d\/e\/([a-zA-Z0-9_-]+)/);
  if (matchE) return matchE[1];
  return trimmed;
}

/**
 * Valida se um formulário Google existe e está acessível na conta do usuário
 */
export async function verificarGoogleFormExistente(
  accessToken: string,
  formId: string
): Promise<{ valido: boolean; form?: GoogleFormCriado; erro?: string }> {
  try {
    const idLimpo = extrairFormId(formId);
    if (!idLimpo) {
      return { valido: false, erro: 'ID ou Link do formulário não informado.' };
    }

    const res = await fetch(`https://forms.googleapis.com/v1/forms/${idLimpo}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
      if (res.status === 404) {
        return { 
          valido: false, 
          erro: 'Formulário não encontrado no Google Drive (foi excluído da lixeira ou o ID está incorreto).' 
        };
      }
      const erroJson = await res.json().catch(() => ({}));
      return { 
        valido: false, 
        erro: erroJson?.error?.message || `Erro ao validar formulário (${res.statusText}).` 
      };
    }

    const data = await res.json();
    return {
      valido: true,
      form: {
        formId: data.formId || idLimpo,
        titulo: data.info?.title || 'DeskOps TI - Abertura de Chamado',
        responderUri: data.responderUri || `https://docs.google.com/forms/d/e/${idLimpo}/viewform`,
        editUri: `https://docs.google.com/forms/d/${idLimpo}/edit`
      }
    };
  } catch (err: any) {
    return { valido: false, erro: err?.message || 'Falha ao conectar com o Google Forms.' };
  }
}

export interface ArquivoFormDrive {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

/**
 * Lista todos os formulários Google existentes no Google Drive do usuário
 */
export async function listarFormulariosDoDrive(accessToken: string): Promise<ArquivoFormDrive[]> {
  try {
    const query = encodeURIComponent("mimeType='application/vnd.google-apps.form' and trashed=false");
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,webViewLink)&pageSize=25&orderBy=modifiedTime desc`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.error('Erro ao listar formulários do Drive:', err);
    return [];
  }
}
