import { PrioridadeChamado, StatusChamado } from '../types';

export interface SlaInfo {
  limiteHoras: number;
  dataLimite: Date;
  tempoDecorridoMinutos: number;
  minutosRestantes: number;
  statusSla: 'dentro_prazo' | 'em_risco' | 'estourado' | 'concluido_no_prazo' | 'concluido_com_atraso';
  textoFormatado: string;
  badgeClasse: string;
}

export const SLA_HORAS_POR_PRIORIDADE: Record<PrioridadeChamado, number> = {
  'Crítica': 2,
  'Alta': 4,
  'Média': 8,
  'Baixa': 24,
};

export function calcularSla(
  dataAberturaStr: string,
  prioridade: PrioridadeChamado,
  status: StatusChamado,
  dataFechamentoStr?: string | null
): SlaInfo {
  const limiteHoras = SLA_HORAS_POR_PRIORIDADE[prioridade] || 8;
  const dataAbertura = new Date(dataAberturaStr);
  const dataLimite = new Date(dataAbertura.getTime() + limiteHoras * 60 * 60 * 1000);
  
  const agora = new Date();
  const dataFim = (status === 'Concluído' || status === 'Cancelado') && dataFechamentoStr 
    ? new Date(dataFechamentoStr) 
    : agora;

  const tempoDecorridoMs = dataFim.getTime() - dataAbertura.getTime();
  const tempoDecorridoMinutos = Math.max(0, Math.floor(tempoDecorridoMs / (1000 * 60)));
  
  const minutosTotaisSla = limiteHoras * 60;
  const minutosRestantes = minutosTotaisSla - tempoDecorridoMinutos;

  // Se já foi concluído
  if (status === 'Concluído' || status === 'Cancelado') {
    if (minutosRestantes >= 0) {
      return {
        limiteHoras,
        dataLimite,
        tempoDecorridoMinutos,
        minutosRestantes,
        statusSla: 'concluido_no_prazo',
        textoFormatado: `Concluído em ${formatarDuracao(tempoDecorridoMinutos)} (No Prazo)`,
        badgeClasse: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
      };
    } else {
      return {
        limiteHoras,
        dataLimite,
        tempoDecorridoMinutos,
        minutosRestantes,
        statusSla: 'concluido_com_atraso',
        textoFormatado: `Concluído com atraso (+${formatarDuracao(Math.abs(minutosRestantes))})`,
        badgeClasse: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
      };
    }
  }

  // Se ainda está aberto ou em andamento
  if (minutosRestantes < 0) {
    const atraso = Math.abs(minutosRestantes);
    return {
      limiteHoras,
      dataLimite,
      tempoDecorridoMinutos,
      minutosRestantes,
      statusSla: 'estourado',
      textoFormatado: `Atrasado há ${formatarDuracao(atraso)}`,
      badgeClasse: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800 animate-pulse'
    };
  } else if (minutosRestantes <= minutosTotaisSla * 0.25 || minutosRestantes <= 60) {
    return {
      limiteHoras,
      dataLimite,
      tempoDecorridoMinutos,
      minutosRestantes,
      statusSla: 'em_risco',
      textoFormatado: `Resta ${formatarDuracao(minutosRestantes)} (Atenção)`,
      badgeClasse: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
    };
  } else {
    return {
      limiteHoras,
      dataLimite,
      tempoDecorridoMinutos,
      minutosRestantes,
      statusSla: 'dentro_prazo',
      textoFormatado: `Resta ${formatarDuracao(minutosRestantes)}`,
      badgeClasse: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-800'
    };
  }
}

export function formatarDuracao(minutos: number): string {
  if (minutos < 60) {
    return `${minutos}min`;
  }
  const horas = Math.floor(minutos / 60);
  const minRestantes = minutos % 60;
  if (minRestantes === 0) {
    return `${horas}h`;
  }
  return `${horas}h ${minRestantes}min`;
}
