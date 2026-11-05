/**
 * Tipos de dados estruturados para o ecossistema DeskOps TI
 * Mapeados exatamente com as colunas das 4 abas do Google Sheets
 */

export type PrioridadeChamado = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

export type StatusChamado = 
  | 'Aberto' 
  | 'Em Andamento' 
  | 'Aguardando Peça' 
  | 'Concluído' 
  | 'Cancelado';

export interface Chamado {
  id: string; // Ex: CH-2026-0042
  dataHoraAbertura: string; // ISO string ou formatado
  nomeSolicitante: string;
  emailSolicitante: string;
  setor: string;
  categoria: string; // Ex: 🔴 Sem internet, 🖨️ Impressora não funciona, etc.
  descricao: string;
  prioridade: PrioridadeChamado;
  emailTecnicoResponsavel: string;
  status: StatusChamado;
  observacoesTecnicas: string;
  dataFechamento: string | null;
  tempoAtendimentoSla?: string;
}

export type StatusFuncionario = 'Ativo' | 'Inativo';

export interface Funcionario {
  id: string; // Ex: FUNC-0101
  nomeCompleto: string;
  cpf: string;
  cargo: string;
  setor: string;
  email: string;
  status: StatusFuncionario;
}

export type TipoEquipamento = 
  | 'Notebook' 
  | 'Desktop' 
  | 'Monitor' 
  | 'Impressora' 
  | 'Periférico' 
  | 'Servidor / Rede';

export type StatusEquipamento = 
  | 'Disponível' 
  | 'Em Uso' 
  | 'Em Manutenção' 
  | 'Descartado';

export interface Equipamento {
  id: string; // Ex: PAT-1042
  tipo: TipoEquipamento;
  marcaModelo: string;
  numSerie: string;
  status: StatusEquipamento;
  funcionarioAlocado: string | null; // Nome ou ID do funcionário
  dataUltimaMovimentacao: string;
}

export type TipoAcaoMovimentacao = 'Atribuição' | 'Devolução' | 'Manutenção';

export interface Movimentacao {
  id: string; // Ex: MOV-2026-0089
  dataHora: string;
  idEquipamento: string;
  tipoAcao: TipoAcaoMovimentacao;
  funcionarioEnvolvido: string;
  emailTecnicoResponsavel: string;
  observacoes: string;
}

export interface Tecnico {
  nome: string;
  email: string;
  cargo: string;
  papel: 'admin' | 'tecnico';
}
