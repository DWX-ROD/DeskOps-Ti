import React, { useState } from 'react';
import { Mail, CheckCircle2, Bell, ExternalLink, Send, ShieldCheck } from 'lucide-react';
import { Chamado, Tecnico } from '../types';

interface SimuladorEmailViewProps {
  tecnicoAtivo: Tecnico;
}

export const SimuladorEmailView: React.FC<SimuladorEmailViewProps> = ({ tecnicoAtivo }) => {
  const [tipoEmail, setTipoEmail] = useState<'abertura' | 'encerramento'>('abertura');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Mail className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display">
              Simulador de Notificações por E-mail (GmailApp)
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pré-visualização dos e-mails HTML responsivos disparados automaticamente pelo Google Apps Script para os colaboradores.
          </p>
        </div>

        {/* Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <button
            onClick={() => setTipoEmail('abertura')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              tipoEmail === 'abertura'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>1. Confirmação de Abertura</span>
          </button>

          <button
            onClick={() => setTipoEmail('encerramento')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              tipoEmail === 'encerramento'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>2. Conclusão & Encerramento</span>
          </button>
        </div>
      </div>

      {/* Simulated Email Client Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        
        {/* Email Metadata Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500 dark:text-slate-400">De:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Helpdesk TI &lt;suporte-ti@suaempresa.com.br&gt;</span>
            </div>
            <span className="text-[11px] text-slate-400">Via GmailApp.sendEmail()</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Para:</span>
            <span className="text-slate-700 dark:text-slate-300">mariana.souza@empresa.com</span>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Assunto:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 font-display">
              {tipoEmail === 'abertura'
                ? '🔔 [Chamado CH-2026-0041] Recebido com Sucesso - DeskOps TI'
                : '✅ [Chamado CH-2026-0041] Concluído com Sucesso - DeskOps TI'}
            </span>
          </div>
        </div>

        {/* Email Body Rendering */}
        <div className="p-6 sm:p-10 bg-slate-100/50 dark:bg-slate-950 flex justify-center">
          
          {tipoEmail === 'abertura' ? (
            /* E-MAIL 1: ABERTURA */
            <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden text-slate-800">
              <div className="bg-slate-900 p-6 text-center text-white">
                <h2 className="text-lg font-bold font-display">DeskOps TI - Helpdesk Corporativo</h2>
                <p className="text-xs text-slate-400 mt-1">Confirmação de Abertura de Chamado</p>
              </div>

              <div className="p-6 text-xs leading-relaxed space-y-4">
                <p>Olá, <strong>Mariana Souza</strong>,</p>
                <p>Seu chamado foi registrado na fila de atendimento da equipe de TI.</p>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Número do Protocolo:</span>
                    <span className="font-mono font-bold text-sm text-blue-600">CH-2026-0041</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Categoria:</span>
                    <span className="font-medium text-slate-800">🔴 Sem internet / Switch Baia 4</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Prioridade:</span>
                    <span className="font-bold text-red-600">Crítica (SLA 2 horas)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Status Inicial:</span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold text-[11px]">Aberto</span>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-[11px] leading-normal flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    Você pode consultar o andamento deste chamado a qualquer momento usando apenas o número do protocolo <strong>CH-2026-0041</strong>, sem precisar de senha ou ligar para o técnico.
                  </span>
                </div>
              </div>

              <div className="bg-slate-100 p-3 text-center text-[11px] text-slate-500 border-t border-slate-200">
                Equipe de TI & Suporte Técnico Corporativo · Atendimento DeskOps
              </div>
            </div>
          ) : (
            /* E-MAIL 2: ENCERRAMENTO */
            <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden text-slate-800">
              <div className="bg-teal-700 p-6 text-center text-white">
                <h2 className="text-lg font-bold font-display">Chamado Concluído com Sucesso</h2>
                <p className="text-xs text-teal-100 mt-1 font-mono font-semibold">Protocolo: CH-2026-0041</p>
              </div>

              <div className="p-6 text-xs leading-relaxed space-y-4">
                <p>Olá, <strong>Mariana Souza</strong>,</p>
                <p>Informamos que o seu chamado de suporte técnico foi <strong>resolvido e concluído</strong> pelo técnico responsável.</p>

                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-3">
                  <h4 className="font-bold text-emerald-900 text-xs">Resolução do Técnico:</h4>
                  <p className="text-emerald-800 italic bg-white p-3 rounded border border-emerald-100">
                    "Identificado cabo de rede rompido na baia 4. Feita crimpagem de novo conector RJ-45 Cat6 e teste de link no switch a 1 Gbps. Conectividade restabelecida."
                  </p>
                  
                  <div className="pt-2 border-t border-emerald-200/80 space-y-1 text-slate-600 text-[11px]">
                    <div className="flex justify-between">
                      <span>Técnico Responsável:</span>
                      <strong className="text-slate-800">{tecnicoAtivo.email}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Tempo de Atendimento:</span>
                      <strong className="text-emerald-700">1.4h (Dentro do SLA de 2h)</strong>
                    </div>
                  </div>
                </div>

                <p className="text-slate-500 text-[11px]">
                  Caso o problema persista ou necessite de apoio adicional, basta responder a este e-mail.
                </p>
              </div>

              <div className="bg-slate-100 p-3 text-center text-[11px] text-slate-500 border-t border-slate-200">
                Equipe de TI & Suporte Técnico Corporativo · Atendimento DeskOps
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
