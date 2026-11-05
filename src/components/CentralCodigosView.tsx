import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Download, 
  BookOpen, 
  FileCode, 
  Layers, 
  Terminal,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { CODE_GS, SETUP_PLANILHA_GS, CRIAR_FORMULARIO_GS, INDEX_HTML, GUIA_IMPLANTACAO_MD } from '../data/gasScripts';

type ArquivoCodigo = 'code_gs' | 'setup_gs' | 'criar_form_gs' | 'index_html' | 'guia_md';

export const CentralCodigosView: React.FC = () => {
  const [arquivoAtivo, setArquivoAtivo] = useState<ArquivoCodigo>('code_gs');
  const [copiado, setCopiado] = useState<boolean>(false);

  const obterConteudo = (): { nome: string; extensao: string; conteudo: string; tipo: string } => {
    switch (arquivoAtivo) {
      case 'code_gs':
        return { nome: 'Code', extensao: 'gs', conteudo: CODE_GS, tipo: 'Backend Google Apps Script' };
      case 'setup_gs':
        return { nome: 'Setup_Planilha', extensao: 'gs', conteudo: SETUP_PLANILHA_GS, tipo: 'Script de Inicialização do Banco' };
      case 'criar_form_gs':
        return { nome: 'Criar_Formulario', extensao: 'gs', conteudo: CRIAR_FORMULARIO_GS, tipo: 'Criador Automático do Google Form' };
      case 'index_html':
        return { nome: 'Index', extensao: 'html', conteudo: INDEX_HTML, tipo: 'Interface Web App (HTML/JS/CSS)' };
      case 'guia_md':
        return { nome: 'Guia_Implantacao', extensao: 'md', conteudo: GUIA_IMPLANTACAO_MD, tipo: 'Manual Passo a Passo' };
    }
  };

  const dadosArquivo = obterConteudo();

  const handleCopiar = () => {
    navigator.clipboard.writeText(dadosArquivo.conteudo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleBaixar = () => {
    const blob = new Blob([dadosArquivo.conteudo], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${dadosArquivo.nome}.${dadosArquivo.extensao}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Code2 className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display">
              Central de Códigos & Implantação
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Todos os códigos-fonte do Google Apps Script prontos para copiar e colar diretamente no seu projeto Google Workspace.
          </p>
        </div>

        {/* Global Download Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopiar}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm transition flex items-center gap-1.5"
          >
            {copiado ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copiado ? 'Código Copiado!' : 'Copiar Código'}</span>
          </button>
          <button
            onClick={handleBaixar}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Baixar {dadosArquivo.nome}.{dadosArquivo.extensao}</span>
          </button>
        </div>
      </div>

      {/* Visual Workflow Steps */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-xs text-blue-600 dark:text-blue-400 mb-1">
            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px]">1</span>
            <span>Setup do Banco</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Execute <code>Setup_Planilha.gs</code> para criar e formatar automaticamente as 4 abas com validações.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-xs text-blue-600 dark:text-blue-400 mb-1">
            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px]">2</span>
            <span>Backend Code.gs</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Cole o <code>Code.gs</code> para lidar com gatilho de formulário, SLA, e-mails e atribuições com 1 clique.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-xs text-blue-600 dark:text-blue-400 mb-1">
            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px]">3</span>
            <span>Web App Index.html</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Crie o arquivo <code>Index.html</code> para publicar a interface moderna da equipe de TI no navegador.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-xs text-emerald-600 dark:text-emerald-400 mb-1">
            <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[10px]">4</span>
            <span>Ativação de Trigger</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Configure o gatilho <code>onFormSubmit</code> no Apps Script para automação total de e-mails e protocolos.
          </p>
        </div>
      </div>

      {/* Code Viewer Container */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Sub-Header Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setArquivoAtivo('code_gs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition flex items-center gap-2 ${
                arquivoAtivo === 'code_gs'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Code.gs (Backend)</span>
            </button>

            <button
              onClick={() => setArquivoAtivo('setup_gs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition flex items-center gap-2 ${
                arquivoAtivo === 'setup_gs'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Setup_Planilha.gs</span>
            </button>

            <button
              onClick={() => setArquivoAtivo('criar_form_gs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition flex items-center gap-2 ${
                arquivoAtivo === 'criar_form_gs'
                  ? 'bg-purple-600 text-white'
                  : 'text-purple-400 hover:text-purple-300 hover:bg-slate-800'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-purple-400" />
              <span>Criar_Formulario.gs (Forms)</span>
            </button>

            <button
              onClick={() => setArquivoAtivo('index_html')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition flex items-center gap-2 ${
                arquivoAtivo === 'index_html'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Index.html (Web App)</span>
            </button>

            <button
              onClick={() => setArquivoAtivo('guia_md')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition flex items-center gap-2 ${
                arquivoAtivo === 'guia_md'
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Guia_Implantacao.md</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-mono text-[11px]">{dadosArquivo.tipo}</span>
            <span className="text-slate-600">·</span>
            <button
              onClick={handleCopiar}
              className="text-slate-300 hover:text-white flex items-center gap-1 font-semibold"
            >
              {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiado ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-4 overflow-x-auto max-h-[650px] overflow-y-auto font-mono text-xs text-slate-200 leading-relaxed select-text">
          <pre className="whitespace-pre">
            {dadosArquivo.conteudo}
          </pre>
        </div>

        {/* Footer Info */}
        <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>
            {dadosArquivo.nome}.{dadosArquivo.extensao} · Total de {dadosArquivo.conteudo.split('\n').length} linhas
          </span>
          <span className="text-slate-500">Google Apps Script V8 Runtime · Modern ES6+</span>
        </div>
      </div>

    </div>
  );
};
