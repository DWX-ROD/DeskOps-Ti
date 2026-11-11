import React, { useState } from 'react';
import { 
  Laptop, 
  Download, 
  Building2, 
  FileSpreadsheet, 
  Layers, 
  Check, 
  Sparkles, 
  ExternalLink, 
  Upload, 
  RefreshCw, 
  Plus, 
  Trash2, 
  HelpCircle, 
  Copy, 
  CheckCircle2, 
  AlertCircle,
  Terminal,
  ShieldCheck,
  FolderOpen,
  ArrowRight
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { PlanilhaMetadados, ArquivoDrive } from '../services/googleSheets';
import { PRESETS_SETORES, SETORES_EMPRESA } from '../data/initialData';
import { Tecnico } from '../types';

interface MinhaUtilidadeViewProps {
  nomeEmpresa: string;
  setNomeEmpresa: (nome: string) => void;
  subtituloEmpresa: string;
  setSubtituloEmpresa: (sub: string) => void;
  setores: string[];
  setSetores: React.Dispatch<React.SetStateAction<string[]>>;
  planilhaAtiva: PlanilhaMetadados | null;
  onConectarPlanilhaPorId: (idOuUrl: string) => Promise<boolean>;
  onCriarNovaPlanilha: (nome: string) => Promise<boolean>;
  onRestaurarPlanilhaOficial: () => Promise<void>;
  onListarPlanilhasDrive: () => Promise<ArquivoDrive[]>;
  tecnicoAtivo: Tecnico;
  onExibirNotificacao: (msg: string, tipo?: 'sucesso' | 'info') => void;
}

export const MinhaUtilidadeView: React.FC<MinhaUtilidadeViewProps> = ({
  nomeEmpresa,
  setNomeEmpresa,
  subtituloEmpresa,
  setSubtituloEmpresa,
  setores,
  setSetores,
  planilhaAtiva,
  onConectarPlanilhaPorId,
  onCriarNovaPlanilha,
  onRestaurarPlanilhaOficial,
  onListarPlanilhasDrive,
  tecnicoAtivo,
  onExibirNotificacao
}) => {
  // Estados para Organização
  const [nomeTemp, setNomeTemp] = useState(nomeEmpresa);
  const [subtituloTemp, setSubtituloTemp] = useState(subtituloEmpresa);

  // Estados para Planilha
  const [inputPlanilhaId, setInputPlanilhaId] = useState('');
  const [nomeNovaPlanilha, setNomeNovaPlanilha] = useState(`DeskOps TI - Banco de Dados (${nomeEmpresa})`);
  const [criandoPlanilha, setCriandoPlanilha] = useState(false);
  const [conectandoId, setConectandoId] = useState(false);
  const [restaurandoPadrao, setRestaurandoPadrao] = useState(false);
  const [planilhasDrive, setPlanilhasDrive] = useState<ArquivoDrive[]>([]);
  const [carregandoDrive, setCarregandoDrive] = useState(false);
  const [copiadoId, setCopiadoId] = useState(false);

  // Estados para Setores
  const [novoSetorInput, setNovoSetorInput] = useState('');
  const [presetSelecionado, setPresetSelecionado] = useState('');

  // Salvar Empresa
  const handleSalvarIdentidade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeTemp.trim()) {
      alert('Informe o nome da sua empresa ou organização.');
      return;
    }
    setNomeEmpresa(nomeTemp.trim());
    setSubtituloEmpresa(subtituloTemp.trim());
    localStorage.setItem('deskops_nome_empresa', nomeTemp.trim());
    localStorage.setItem('deskops_subtitulo_empresa', subtituloTemp.trim());
    onExibirNotificacao(`Identidade atualizada: "${nomeTemp.trim()}"`);
  };

  // Conectar Planilha por ID ou Link
  const handleConectarId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPlanilhaId.trim()) return;
    try {
      setConectandoId(true);
      const ok = await onConectarPlanilhaPorId(inputPlanilhaId.trim());
      if (ok) {
        setInputPlanilhaId('');
        onExibirNotificacao('Sua planilha foi conectada com sucesso!');
      }
    } finally {
      setConectandoId(false);
    }
  };

  // Criar Nova Planilha do Usuário
  const handleCriarPlanilha = async () => {
    try {
      setCriandoPlanilha(true);
      const nomeFinal = nomeNovaPlanilha.trim() || `DeskOps TI - Banco de Dados (${nomeEmpresa})`;
      const ok = await onCriarNovaPlanilha(nomeFinal);
      if (ok) {
        onExibirNotificacao(`Nova planilha criada no seu Google Drive: "${nomeFinal}"!`);
      }
    } finally {
      setCriandoPlanilha(false);
    }
  };

  // Listar Planilhas do Drive do Usuário
  const handleCarregarPlanilhasDrive = async () => {
    try {
      setCarregandoDrive(true);
      const lista = await onListarPlanilhasDrive();
      setPlanilhasDrive(lista);
      if (lista.length === 0) {
        onExibirNotificacao('Nenhuma planilha encontrada no seu Google Drive.', 'info');
      }
    } finally {
      setCarregandoDrive(false);
    }
  };

  // Restaurar Banco Oficial Original
  const handleRestaurarPadrao = async () => {
    if (!confirm('Deseja restaurar a vinculação com a planilha oficial padrão da empresa?')) return;
    try {
      setRestaurandoPadrao(true);
      await onRestaurarPlanilhaOficial();
      onExibirNotificacao('Banco de dados oficial padrão restaurado com sucesso!');
    } finally {
      setRestaurandoPadrao(false);
    }
  };

  // Adicionar Setor Customizado
  const handleAdicionarSetor = (e: React.FormEvent) => {
    e.preventDefault();
    const limpo = novoSetorInput.trim().toUpperCase();
    if (!limpo) return;
    if (setores.includes(limpo)) {
      alert(`O setor "${limpo}" já existe na lista.`);
      return;
    }
    const novaLista = [...setores, limpo];
    setSetores(novaLista);
    localStorage.setItem('deskops_custom_setores', JSON.stringify(novaLista));
    setNovoSetorInput('');
    onExibirNotificacao(`Setor "${limpo}" adicionado com sucesso!`);
  };

  // Remover Setor
  const handleRemoverSetor = (setorParaRemover: string) => {
    if (setores.length <= 1) {
      alert('Você deve manter pelo menos um setor cadastrado.');
      return;
    }
    const novaLista = setores.filter((s) => s !== setorParaRemover);
    setSetores(novaLista);
    localStorage.setItem('deskops_custom_setores', JSON.stringify(novaLista));
    onExibirNotificacao(`Setor "${setorParaRemover}" removido.`);
  };

  // Aplicar Preset de Setores
  const handleAplicarPreset = (presetId: string) => {
    const preset = PRESETS_SETORES.find((p) => p.id === presetId);
    if (!preset) return;
    if (confirm(`Substituir a lista atual pelos setores do modelo "${preset.nome}"?`)) {
      setSetores(preset.setores);
      localStorage.setItem('deskops_custom_setores', JSON.stringify(preset.setores));
      setPresetSelecionado(presetId);
      onExibirNotificacao(`Modelo de setores "${preset.nome}" aplicado com sucesso!`);
    }
  };

  // Exportar Configuração em JSON
  const handleExportarConfiguracao = () => {
    const config = {
      versao: '1.0',
      dataExportacao: new Date().toISOString(),
      empresa: {
        nome: nomeEmpresa,
        subtitulo: subtituloEmpresa
      },
      planilha: {
        id: planilhaAtiva?.id || '',
        nome: planilhaAtiva?.nome || '',
        url: planilhaAtiva?.url || ''
      },
      setores: setores
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deskops-config-${nomeEmpresa.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onExibirNotificacao('Arquivo de configuração baixado com sucesso!');
  };

  // Importar Configuração de JSON
  const handleImportarConfiguracao = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const conteudo = event.target?.result as string;
        const config = JSON.parse(conteudo);

        if (config.empresa?.nome) {
          setNomeEmpresa(config.empresa.nome);
          setNomeTemp(config.empresa.nome);
          localStorage.setItem('deskops_nome_empresa', config.empresa.nome);
        }
        if (config.empresa?.subtitulo) {
          setSubtituloEmpresa(config.empresa.subtitulo);
          setSubtituloTemp(config.empresa.subtitulo);
          localStorage.setItem('deskops_subtitulo_empresa', config.empresa.subtitulo);
        }
        if (Array.isArray(config.setores) && config.setores.length > 0) {
          setSetores(config.setores);
          localStorage.setItem('deskops_custom_setores', JSON.stringify(config.setores));
        }
        if (config.planilha?.id) {
          onConectarPlanilhaPorId(config.planilha.id);
        }

        onExibirNotificacao('Configurações importadas e aplicadas com sucesso!');
      } catch (err) {
        alert('Erro ao ler arquivo de configuração JSON inválido.');
      }
    };
    reader.readAsText(file);
  };

  const handleCopiarIdPlanilha = () => {
    if (!planilhaAtiva) return;
    navigator.clipboard.writeText(planilhaAtiva.id);
    setCopiadoId(true);
    setTimeout(() => setCopiadoId(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2">
            <Terminal className="w-3.5 h-3.5" />
            <span>Portabilidade & Executável GitHub</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display">
            Executável & Minha Utilidade
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Configure o DeskOps TI para a sua própria organização, vincule a sua própria planilha do Google Sheets, personalize seus setores e execute localmente em 1 clique pelo GitHub.
          </p>
        </div>

        {/* Botoes de Exportar / Importar Config */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportarConfiguracao}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 shadow-2xs transition"
            title="Exportar arquivo deskops-config.json com suas personalizações"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Config (.json)</span>
          </button>

          <label className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Importar Config</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportarConfiguracao}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* SEÇÃO 1: Como Executar Localmente do GitHub & Instalar Desktop (.exe) */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shadow-xl border border-blue-800/40 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-lg text-white">
                  Executar como Aplicativo Desktop no Computador
                </h2>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Pronto para GitHub
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Você pode executar este projeto localmente com duplo-clique ou instalá-lo como um aplicativo executável na sua Área de Trabalho.
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <PWAInstallButton />
          </div>
        </div>

        {/* Passos de Execução 1 Clique do GitHub */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs uppercase tracking-wider">
              <Terminal className="w-4 h-4" />
              <span>1. Windows (1 Duplo-Clique)</span>
            </div>
            <p className="text-xs text-slate-300">
              Ao baixar o repositório do GitHub, dê <strong>dois cliques</strong> no arquivo:
            </p>
            <div className="p-2 rounded-lg bg-slate-950 font-mono text-xs text-emerald-400 border border-slate-800 flex items-center justify-between">
              <span>iniciar-deskops.bat</span>
              <span className="text-[10px] text-slate-500 font-sans">ou DeskOps-TI.bat</span>
            </div>
            <p className="text-[11px] text-slate-400">
              O script verifica o Node.js, instala dependências e abre o sistema automaticamente no seu navegador padrão.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs uppercase tracking-wider">
              <Terminal className="w-4 h-4" />
              <span>2. Linux & macOS</span>
            </div>
            <p className="text-xs text-slate-300">
              No terminal, navegue até a pasta baixada e execute o script:
            </p>
            <div className="p-2 rounded-lg bg-slate-950 font-mono text-xs text-purple-300 border border-slate-800">
              ./iniciar-deskops.sh
            </div>
            <p className="text-[11px] text-slate-400">
              Inicia o servidor e abre automaticamente no navegador com suporte a atalhos de sistema.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>3. Aplicativo Desktop (.exe)</span>
            </div>
            <p className="text-xs text-slate-300">
              Com o sistema aberto no Chrome ou Edge, clique em <strong>"Instalar Desktop"</strong> no topo da barra.
            </p>
            <p className="text-[11px] text-slate-400">
              O Windows criará um ícone executável no Menu Iniciar e na Área de Trabalho com janela nativa, sem barra de URL.
            </p>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SEÇÃO 2: Identidade da Minha Organização */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
                Minha Empresa / Organização
              </h3>
              <p className="text-xs text-slate-500">
                Personalize o nome exibido em relatórios, telas e e-mails do sistema.
              </p>
            </div>
          </div>

          <form onSubmit={handleSalvarIdentidade} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome da Empresa, Secretaria ou Instituição
              </label>
              <input
                type="text"
                required
                value={nomeTemp}
                onChange={(e) => setNomeTemp(e.target.value)}
                placeholder="Ex: Secretaria de Educação, Empresa ABC Tecnologia, Hospital Central..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subtítulo / Descrição da Unidade de TI
              </label>
              <input
                type="text"
                value={subtituloTemp}
                onChange={(e) => setSubtituloTemp(e.target.value)}
                placeholder="Ex: Departamento de Tecnologia e Infraestrutura"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Salvo localmente no seu computador.
              </span>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Identidade</span>
              </button>
            </div>
          </form>

          {/* Prévia da Identidade Atual */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                Nome Ativo no Sistema
              </span>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {nomeEmpresa}
              </div>
              <div className="text-xs text-slate-500">
                {subtituloEmpresa || 'Helpdesk e Inventário de TI'}
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
              Ativo
            </span>
          </div>
        </div>

        {/* SEÇÃO 3: Vincular Minha Própria Planilha Google Sheets */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
                Vincular Minha Própria Planilha
              </h3>
              <p className="text-xs text-slate-500">
                Crie ou conecte a sua própria planilha do Google Sheets para armazenar seus dados.
              </p>
            </div>
          </div>

          {/* Planilha Atual Conectada */}
          <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  {planilhaAtiva ? planilhaAtiva.nome : 'Nenhuma Planilha Conectada'}
                </span>
              </div>
              {planilhaAtiva && (
                <a
                  href={planilhaAtiva.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir no Sheets</span>
                </a>
              )}
            </div>

            {planilhaAtiva && (
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-emerald-100 dark:border-emerald-800/40">
                <span className="font-mono truncate max-w-[240px]">ID: {planilhaAtiva.id}</span>
                <button
                  onClick={handleCopiarIdPlanilha}
                  className="text-slate-600 dark:text-slate-300 hover:text-emerald-600 flex items-center gap-1 font-medium"
                >
                  {copiadoId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiadoId ? 'Copiado!' : 'Copiar ID'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Opção A: Criar Nova Planilha do Usuário */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Criar Nova Planilha no Meu Google Drive (1 Clique)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                value={nomeNovaPlanilha}
                onChange={(e) => setNomeNovaPlanilha(e.target.value)}
                placeholder="Nome da sua nova planilha..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={handleCriarPlanilha}
                disabled={criandoPlanilha}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition shrink-0 disabled:opacity-50"
              >
                {criandoPlanilha ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{criandoPlanilha ? 'Criando...' : 'Criar Planilha'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Cria automaticamente as 5 abas essenciais com cabeçalhos congelados e formatação corporativa.
            </p>
          </div>

          {/* Opção B: Conectar por ID ou URL */}
          <form onSubmit={handleConectarId} className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Conectar Planilha Existente (Cole o ID ou URL)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                value={inputPlanilhaId}
                onChange={(e) => setInputPlanilhaId(e.target.value)}
                placeholder="Ex: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms ou link..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={conectandoId || !inputPlanilhaId.trim()}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition shrink-0 disabled:opacity-50"
              >
                {conectandoId ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                <span>Conectar</span>
              </button>
            </div>
          </form>

          {/* Opção C: Listar Planilhas do Drive ou Restaurar Padrão */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={handleCarregarPlanilhasDrive}
              disabled={carregandoDrive}
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 font-medium"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>{carregandoDrive ? 'Buscando...' : 'Buscar planilhas no meu Drive'}</span>
            </button>

            <button
              type="button"
              onClick={handleRestaurarPadrao}
              disabled={restaurandoPadrao}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
              title="Voltar para a planilha DeskOps TI - Banco de Dados oficial"
            >
              {restaurandoPadrao ? 'Restaurando...' : 'Restaurar Banco Padrão'}
            </button>
          </div>

          {/* Lista de planilhas encontradas no Drive */}
          {planilhasDrive.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                Planilhas encontradas no seu Google Drive:
              </span>
              {planilhasDrive.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                    {p.name}
                  </span>
                  <button
                    onClick={() => onConectarPlanilhaPorId(p.id)}
                    className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-[11px] font-semibold hover:bg-blue-100 transition"
                  >
                    Vincular
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* SEÇÃO 4: Personalizar Setores da Minha Organização */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
                  Setores da Minha Organização ({setores.length} Ativos)
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                  Personalizável
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Defina os setores específicos que aparecerão no portal de abertura de chamados e no inventário.
              </p>
            </div>
          </div>

          {/* Modelos / Presets Rápidos */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={presetSelecionado}
              onChange={(e) => handleAplicarPreset(e.target.value)}
              className="w-full sm:w-auto text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Carregar Modelo de Setores...</option>
              {PRESETS_SETORES.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Adicionar Novo Setor */}
        <form onSubmit={handleAdicionarSetor} className="flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            value={novoSetorInput}
            onChange={(e) => setNovoSetorInput(e.target.value)}
            placeholder="Digite o nome de um novo setor (ex: LOGÍSTICA, COORDENAÇÃO, ALMOXARIFADO...)"
            className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Setor</span>
          </button>
        </form>

        {/* Grid de Setores Ativos */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Setores Atualmente Disponíveis para Abertura de Chamados:
          </span>
          <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            {setores.map((setor) => (
              <div
                key={setor}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium shadow-2xs group hover:border-purple-300 dark:hover:border-purple-700 transition"
              >
                <span>{setor}</span>
                <button
                  type="button"
                  onClick={() => handleRemoverSetor(setor)}
                  className="text-slate-400 hover:text-red-500 transition ml-1"
                  title={`Remover setor ${setor}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
