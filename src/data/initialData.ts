import { Chamado, Funcionario, Equipamento, Movimentacao, Tecnico } from '../types';

export const TECNICO_PADRAO: Tecnico = {
  nome: 'Rodrigo Henrique',
  email: 'rodrigohf.sornn@gmail.com',
  cargo: 'Especialista em Suporte e Infraestrutura',
  papel: 'admin'
};

export const LISTA_TECNICOS_DISPONIVEIS: Tecnico[] = [
  {
    nome: 'Rodrigo Henrique',
    email: 'rodrigohf.sornn@gmail.com',
    cargo: 'Especialista em TI',
    papel: 'admin'
  },
  {
    nome: 'Felipe Santos',
    email: 'felipe.santos@empresa.com',
    cargo: 'Analista de Suporte N2',
    papel: 'tecnico'
  },
  {
    nome: 'Camila Rocha',
    email: 'camila.rocha@empresa.com',
    cargo: 'Coordenadora de Service Desk',
    papel: 'tecnico'
  }
];

export const INITIAL_FUNCIONARIOS: Funcionario[] = [
  {
    id: 'FUNC-0101',
    nomeCompleto: 'Mariana Souza',
    cpf: '123.456.789-00',
    cargo: 'Analista Financeiro Pleno',
    setor: 'Financeiro',
    email: 'mariana.souza@empresa.com',
    status: 'Ativo'
  },
  {
    id: 'FUNC-0102',
    nomeCompleto: 'Carlos Eduardo',
    cpf: '234.567.890-11',
    cargo: 'Product Designer Lead',
    setor: 'Design & UX',
    email: 'carlos.eduardo@empresa.com',
    status: 'Ativo'
  },
  {
    id: 'FUNC-0103',
    nomeCompleto: 'Fernanda Lima',
    cpf: '345.678.901-22',
    cargo: 'Gerente Comercial',
    setor: 'Comercial',
    email: 'fernanda.lima@empresa.com',
    status: 'Ativo'
  },
  {
    id: 'FUNC-0104',
    nomeCompleto: 'Lucas Oliveira',
    cpf: '456.789.012-33',
    cargo: 'Engenheiro de Software Sênior',
    setor: 'Engenharia',
    email: 'lucas.oliveira@empresa.com',
    status: 'Ativo'
  },
  {
    id: 'FUNC-0105',
    nomeCompleto: 'Beatriz Mendes',
    cpf: '567.890.123-44',
    cargo: 'Coordenadora de Recursos Humanos',
    setor: 'RH & People',
    email: 'beatriz.mendes@empresa.com',
    status: 'Ativo'
  },
  {
    id: 'FUNC-0106',
    nomeCompleto: 'Roberto Albuquerque',
    cpf: '678.901.234-55',
    cargo: 'Auditor Fiscal',
    setor: 'Controladoria',
    email: 'roberto.albuquerque@empresa.com',
    status: 'Inativo'
  }
];

export const INITIAL_EQUIPAMENTOS: Equipamento[] = [
  {
    id: 'PAT-1042',
    tipo: 'Notebook',
    marcaModelo: 'Dell Latitude 5430 i7 16GB 512GB SSD',
    numSerie: 'DELL-LT-94021',
    status: 'Em Uso',
    funcionarioAlocado: 'Mariana Souza',
    dataUltimaMovimentacao: '2026-11-01 10:15:00'
  },
  {
    id: 'PAT-1043',
    tipo: 'Notebook',
    marcaModelo: 'MacBook Pro 14" M3 Pro 18GB 512GB',
    numSerie: 'APPLE-MBP-88210',
    status: 'Em Uso',
    funcionarioAlocado: 'Carlos Eduardo',
    dataUltimaMovimentacao: '2026-10-28 14:00:00'
  },
  {
    id: 'PAT-1044',
    tipo: 'Monitor',
    marcaModelo: 'Dell UltraSharp 27" 4K USB-C Hub',
    numSerie: 'DELL-MN-44910',
    status: 'Em Uso',
    funcionarioAlocado: 'Carlos Eduardo',
    dataUltimaMovimentacao: '2026-10-28 14:05:00'
  },
  {
    id: 'PAT-1045',
    tipo: 'Notebook',
    marcaModelo: 'Lenovo ThinkPad T14 Gen 4 Ryzen 7',
    numSerie: 'LEN-TP-33019',
    status: 'Disponível',
    funcionarioAlocado: null,
    dataUltimaMovimentacao: '2026-11-03 16:30:00'
  },
  {
    id: 'PAT-1046',
    tipo: 'Desktop',
    marcaModelo: 'HP EliteDesk 800 G6 i7 32GB',
    numSerie: 'HP-ED-11029',
    status: 'Em Manutenção',
    funcionarioAlocado: null,
    dataUltimaMovimentacao: '2026-11-02 11:20:00'
  },
  {
    id: 'PAT-1047',
    tipo: 'Monitor',
    marcaModelo: 'LG 29" Ultrawide IPS',
    numSerie: 'LG-UW-77201',
    status: 'Disponível',
    funcionarioAlocado: null,
    dataUltimaMovimentacao: '2026-10-25 09:00:00'
  },
  {
    id: 'PAT-1048',
    tipo: 'Notebook',
    marcaModelo: 'Dell Vostro 3520 i5 16GB',
    numSerie: 'DELL-VS-66102',
    status: 'Em Uso',
    funcionarioAlocado: 'Fernanda Lima',
    dataUltimaMovimentacao: '2026-09-15 08:30:00'
  },
  {
    id: 'PAT-1049',
    tipo: 'Impressora',
    marcaModelo: 'Brother HL-L6202DW Laser Duplex',
    numSerie: 'BRO-PR-99210',
    status: 'Em Manutenção',
    funcionarioAlocado: null,
    dataUltimaMovimentacao: '2026-11-04 07:30:00'
  }
];

export const INITIAL_MOVIMENTACOES: Movimentacao[] = [
  {
    id: 'MOV-20261101-01',
    dataHora: '2026-11-01 10:15:00',
    idEquipamento: 'PAT-1042',
    tipoAcao: 'Atribuição',
    funcionarioEnvolvido: 'Mariana Souza',
    emailTecnicoResponsavel: 'rodrigohf.sornn@gmail.com',
    observacoes: 'Substituição de notebook por upgrade de máquina corporativa.'
  },
  {
    id: 'MOV-20261028-02',
    dataHora: '2026-10-28 14:00:00',
    idEquipamento: 'PAT-1043',
    tipoAcao: 'Atribuição',
    funcionarioEnvolvido: 'Carlos Eduardo',
    emailTecnicoResponsavel: 'rodrigohf.sornn@gmail.com',
    observacoes: 'Entrega de kit workstation de design (MacBook + Monitor 4K).'
  },
  {
    id: 'MOV-20261028-03',
    dataHora: '2026-10-28 14:05:00',
    idEquipamento: 'PAT-1044',
    tipoAcao: 'Atribuição',
    funcionarioEnvolvido: 'Carlos Eduardo',
    emailTecnicoResponsavel: 'rodrigohf.sornn@gmail.com',
    observacoes: 'Entrega de monitor UltraSharp 27.'
  },
  {
    id: 'MOV-20261102-04',
    dataHora: '2026-11-02 11:20:00',
    idEquipamento: 'PAT-1046',
    tipoAcao: 'Manutenção',
    funcionarioEnvolvido: 'Estoque Central',
    emailTecnicoResponsavel: 'felipe.santos@empresa.com',
    observacoes: 'Falha intermitente na fonte de alimentação. Encaminhado ao laboratório.'
  },
  {
    id: 'MOV-20261103-05',
    dataHora: '2026-11-03 16:30:00',
    idEquipamento: 'PAT-1045',
    tipoAcao: 'Devolução',
    funcionarioEnvolvido: 'Roberto Albuquerque',
    emailTecnicoResponsavel: 'camila.rocha@empresa.com',
    observacoes: 'Devolução formal por encerramento de contrato do colaborador.'
  }
];

// Gerar datas relativas ao momento atual para testar visualmente os alertas de SLA
const agora = new Date();
const formatarData = (d: Date) => d.toISOString();

// Criar datas para teste de SLA
const data3HorasAtras = new Date(agora.getTime() - 2.8 * 60 * 60 * 1000); // Crítica estoura em 2h -> Estourado!
const data3HorasMeiaAtras = new Date(agora.getTime() - 3.2 * 60 * 60 * 1000); // Alta (4h) -> Faltam 48min (Em Risco)
const data1HoraAtras = new Date(agora.getTime() - 1.1 * 60 * 60 * 1000); // Média (8h) -> Faltam 6.9h (No prazo)
const data20MinAtras = new Date(agora.getTime() - 20 * 60 * 1000); // Baixa (24h) -> No prazo
const dataOntem = new Date(agora.getTime() - 24 * 60 * 60 * 1000);

export const INITIAL_CHAMADOS: Chamado[] = [
  {
    id: 'CH-2026-0041',
    dataHoraAbertura: formatarData(data3HorasAtras),
    nomeSolicitante: 'Mariana Souza',
    emailSolicitante: 'mariana.souza@empresa.com',
    setor: 'Financeiro',
    categoria: '🔴 Sem Internet / Switch Baia 4',
    descricao: 'Queda total de conexão física nos pontos da baia do financeiro durante fechamento da folha e conciliação bancária.',
    prioridade: 'Crítica',
    emailTecnicoResponsavel: '',
    status: 'Aberto',
    observacoesTecnicas: 'Aguardando técnico assumir com prioridade máxima.',
    dataFechamento: null
  },
  {
    id: 'CH-2026-0042',
    dataHoraAbertura: formatarData(data3HorasMeiaAtras),
    nomeSolicitante: 'Carlos Eduardo',
    emailSolicitante: 'carlos.eduardo@empresa.com',
    setor: 'Design & UX',
    categoria: '💻 Computador não liga / Tela preta',
    descricao: 'MacBook não dá sinal de vida após a atualização de segurança de ontem à noite. Carregador original testado em outras tomadas.',
    prioridade: 'Alta',
    emailTecnicoResponsavel: 'rodrigohf.sornn@gmail.com',
    status: 'Em Andamento',
    observacoesTecnicas: '[04/11 08:30] Realizado reset de SMC e NVRAM. Testando modo de recuperação via DFU.',
    dataFechamento: null
  },
  {
    id: 'CH-2026-0043',
    dataHoraAbertura: formatarData(data1HoraAtras),
    nomeSolicitante: 'Fernanda Lima',
    emailSolicitante: 'fernanda.lima@empresa.com',
    setor: 'Comercial',
    categoria: '🖨️ Impressora não funciona',
    descricao: 'A impressora laser Brother do 2º andar está atolando todas as folhas de proposta comercial e avisando toner baixo.',
    prioridade: 'Média',
    emailTecnicoResponsavel: 'felipe.santos@empresa.com',
    status: 'Aguardando Peça',
    observacoesTecnicas: '[04/11 09:10] Solicitado novo rolete tracionador e toner TN-850 ao almoxarifado.',
    dataFechamento: null
  },
  {
    id: 'CH-2026-0044',
    dataHoraAbertura: formatarData(data20MinAtras),
    nomeSolicitante: 'Lucas Oliveira',
    emailSolicitante: 'lucas.oliveira@empresa.com',
    setor: 'Engenharia',
    categoria: '🔑 Acessos & Senhas',
    descricao: 'Necessidade de liberação de permissão na VPN corporativa e acesso ao repositório de microsserviços de cobrança.',
    prioridade: 'Baixa',
    emailTecnicoResponsavel: '',
    status: 'Aberto',
    observacoesTecnicas: 'Chamado registrado via Google Forms.',
    dataFechamento: null
  },
  {
    id: 'CH-2026-0038',
    dataHoraAbertura: formatarData(new Date(dataOntem.getTime() - 2 * 60 * 60 * 1000)),
    nomeSolicitante: 'Beatriz Mendes',
    emailSolicitante: 'beatriz.mendes@empresa.com',
    setor: 'RH & People',
    categoria: '📦 Instalação de Software',
    descricao: 'Instalação do pacote de software de ponto biométrico e certificação digital A1.',
    prioridade: 'Média',
    emailTecnicoResponsavel: 'rodrigohf.sornn@gmail.com',
    status: 'Concluído',
    observacoesTecnicas: '[03/11 15:40 - Resolução por rodrigohf.sornn@gmail.com]: Instalado certificado Serasa e homologado acesso ao sistema de folha.',
    dataFechamento: formatarData(new Date(dataOntem.getTime() + 1.5 * 60 * 60 * 1000)),
    tempoAtendimentoSla: '3.5h (Dentro do SLA)'
  }
];

export const CATEGORIAS_PROBLEMAS = [
  { id: 'cat-1', label: '🔴 Sem internet / Rede física ou Wi-Fi', prioridadeDefault: 'Alta' as const, icone: 'WifiOff' },
  { id: 'cat-2', label: '💻 Computador não liga / Lento ou travando', prioridadeDefault: 'Alta' as const, icone: 'Laptop' },
  { id: 'cat-3', label: '🖨️ Impressora não funciona / Papel atolado', prioridadeDefault: 'Média' as const, icone: 'Printer' },
  { id: 'cat-4', label: '🔑 Acessos & Senhas / Reset de credenciais', prioridadeDefault: 'Baixa' as const, icone: 'Key' },
  { id: 'cat-5', label: '📦 Instalação de Software / Atualização', prioridadeDefault: 'Baixa' as const, icone: 'Download' },
  { id: 'cat-6', label: '⚙️ Outros Problemas Técnicos', prioridadeDefault: 'Média' as const, icone: 'HelpCircle' }
];

export const SETORES_EMPRESA = [
  'Financeiro',
  'Design & UX',
  'Comercial',
  'Engenharia',
  'RH & People',
  'Operações',
  'Controladoria',
  'Jurídico'
];
