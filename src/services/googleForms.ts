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
  TITULO: 'DeskOps TI - Abertura de Chamado',
  DESCRICAO: 'Canal oficial de suporte técnico da empresa. Preencha os campos abaixo para abrir um chamado para a equipe de TI.',
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
        title: titulo,
        documentTitle: titulo
      }
    })
  });

  if (!resCriacao.ok) {
    const erro = await resCriacao.json().catch(() => ({}));
    throw new Error(erro?.error?.message || `Erro ao criar Google Form (${resCriacao.statusText}).`);
  }

  const formData = await resCriacao.json();
  const formId = formData.formId;

  // 2. Adiciona os campos estruturados solicitados:
  // - Nome Completo (Texto curto)
  // - E-mail do Solicitante (Texto curto)
  // - Setor / Departamento (Lista suspensa)
  // - Categoria do Problema (Lista suspensa)
  // - Descrição Detalhada do Problema (Texto longo)
  // - Nível de Urgência / Impacto Percebido (Múltipla escolha)
  const requests = [
    {
      createItem: {
        item: {
          title: 'Nome Completo do Solicitante',
          description: 'Informe seu nome e sobrenome.',
          questionItem: {
            question: {
              required: true,
              textQuestion: { paragraph: false }
            }
          }
        },
        location: { index: 0 }
      }
    },
    {
      createItem: {
        item: {
          title: 'E-mail Corporativo do Solicitante',
          description: 'Você receberá a confirmação com o número do protocolo neste e-mail.',
          questionItem: {
            question: {
              required: true,
              textQuestion: { paragraph: false }
            }
          }
        },
        location: { index: 1 }
      }
    },
    {
      createItem: {
        item: {
          title: 'Setor / Departamento',
          description: 'Selecione a sua área na empresa.',
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
        location: { index: 2 }
      }
    },
    {
      createItem: {
        item: {
          title: 'Categoria do Problema',
          description: 'Selecione o tipo de problema para direcionar ao técnico correto.',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'DROP_DOWN',
                options: CAMPOS_FORMULARIO_PADRAO.CATEGORIAS.map((c) => ({ value: c }))
              }
            }
          }
        },
        location: { index: 3 }
      }
    },
    {
      createItem: {
        item: {
          title: 'Descrição Detalhada do Problema',
          description: 'Descreva o que está acontecendo, mensagens de erro e há quanto tempo o problema começou.',
          questionItem: {
            question: {
              required: true,
              textQuestion: { paragraph: true }
            }
          }
        },
        location: { index: 4 }
      }
    },
    {
      createItem: {
        item: {
          title: 'Nível de Urgência / Impacto Percebido',
          description: 'Defina o impacto do problema em suas atividades. Isso determinará o SLA de atendimento.',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'Baixa (Até 24h - Dúvida ou problema sem parada de trabalho)' },
                  { value: 'Média (Até 8h - Trabalho prejudicado, mas com alternativa)' },
                  { value: 'Alta (Até 4h - Máquina ou serviço indispensável sem funcionar)' },
                  { value: 'Crítica (Até 2h - Parada total de setor ou diretoria)' }
                ]
              }
            }
          }
        },
        location: { index: 5 }
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
    console.warn('Erro ao popular itens do Forms via API, formulário criado vazio:', erro);
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
