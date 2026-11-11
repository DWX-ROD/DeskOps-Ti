import React, { useState } from 'react';
import { 
  Headphones, 
  Laptop, 
  Users, 
  Search, 
  PlusCircle, 
  Code2, 
  Mail, 
  ShieldCheck, 
  ChevronDown, 
  Moon, 
  Sun,
  Layers,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { Tecnico } from '../types';
import { LISTA_TECNICOS_DISPONIVEIS } from '../data/initialData';

export type TabType = 
  | 'chamados' 
  | 'inventario' 
  | 'historico' 
  | 'consulta' 
  | 'novo_chamado' 
  | 'codigos' 
  | 'emails';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  tecnicoAtivo: Tecnico;
  setTecnicoAtivo: (tec: Tecnico) => void;
  chamadosAbertosCount: number;
  slaCriticoCount: number;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  isSheetsConnected?: boolean;
  onOpenSheetsModal: () => void;
  isFormsConnected?: boolean;
  onOpenFormsModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  tecnicoAtivo,
  setTecnicoAtivo,
  chamadosAbertosCount,
  slaCriticoCount,
  darkMode,
  setDarkMode,
  isSheetsConnected = false,
  onOpenSheetsModal,
  isFormsConnected = false,
  onOpenFormsModal
}) => {
  const [showTecnicoDropdown, setShowTecnicoDropdown] = useState(false);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-display font-bold text-white shadow-md shadow-blue-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-base tracking-tight text-white">
                  DeskOps TI
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Google Workspace
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-normal">
                Helpdesk · Inventário · Apps Script
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-medium">
            <button
              onClick={() => setActiveTab('chamados')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'chamados'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Headphones className="w-4 h-4" />
              <span>Chamados</span>
              {chamadosAbertosCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-950/40 text-white">
                  {chamadosAbertosCount}
                </span>
              )}
              {slaCriticoCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" title="Chamados com SLA crítico ou estourado!" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('inventario')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'inventario'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Laptop className="w-4 h-4" />
              <span>Inventário</span>
            </button>

            <button
              onClick={() => setActiveTab('historico')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'historico'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Histórico por Setor</span>
            </button>

            <button
              onClick={() => setActiveTab('consulta')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'consulta'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Consulta sem Login</span>
            </button>

            <button
              onClick={() => setActiveTab('novo_chamado')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'novo_chamado'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Abrir Chamado</span>
            </button>

            <button
              onClick={() => setActiveTab('codigos')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'codigos'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-800'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Códigos & Guia</span>
            </button>

            <button
              onClick={() => setActiveTab('emails')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'emails'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>E-mails</span>
            </button>
          </nav>

          {/* Right Actions: Session Identity & Theme */}
          <div className="flex items-center gap-2.5 shrink-0">

            {/* Google Sheets Trigger Button */}
            <button
              onClick={onOpenSheetsModal}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                isSheetsConnected
                  ? 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-700/60'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
              title={isSheetsConnected ? 'Google Sheets Conectado (Clique para gerenciar)' : 'Conectar Planilha Google Sheets'}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Google Sheets</span>
              {isSheetsConnected ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ) : (
                <span className="text-[10px] text-slate-400 hidden md:inline">Desconectado</span>
              )}
            </button>

            {/* Google Forms Trigger Button */}
            <button
              onClick={onOpenFormsModal}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                isFormsConnected
                  ? 'bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border-purple-700/60'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
              title={isFormsConnected ? 'Google Forms Conectado (Clique para gerenciar ou recriar como Admin)' : 'Configurar / Criar Google Forms Oficial'}
            >
              <FileText className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">Google Forms</span>
              {isFormsConnected ? (
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              ) : (
                <span className="text-[10px] text-slate-400 hidden md:inline">Desconectado</span>
              )}
            </button>
            
            {/* Technician Session Selector */}
            <div className="relative">
              <button
                onClick={() => setShowTecnicoDropdown(!showTecnicoDropdown)}
                className="flex items-center gap-2 text-left bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs transition"
                title="Sessão autenticada via Google Workspace (Session.getActiveUser().getEmail())"
              >
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-[11px]">
                  {tecnicoAtivo.nome.charAt(0)}
                </div>
                <div className="hidden sm:block">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="font-semibold text-slate-100 max-w-[130px] truncate">
                      {tecnicoAtivo.nome}
                    </span>
                    {tecnicoAtivo.papel === 'admin' ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Admin
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-700 text-slate-300">
                        Técnico
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 truncate block max-w-[130px]">
                    {tecnicoAtivo.email}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {/* Technician Dropdown */}
              {showTecnicoDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-xs">
                  <div className="px-3.5 py-2 border-b border-slate-800">
                    <p className="font-semibold text-slate-200">Sessão Google Workspace</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Segurança RBAC: Apenas usuários com papel <strong>Administrador</strong> têm permissão para adicionar/remover setores e funcionários.
                    </p>
                  </div>
                  <div className="py-1">
                    {LISTA_TECNICOS_DISPONIVEIS.map((tec) => (
                      <button
                        key={tec.email}
                        onClick={() => {
                          setTecnicoAtivo(tec);
                          setShowTecnicoDropdown(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-slate-800 transition ${
                          tecnicoAtivo.email === tec.email ? 'bg-blue-900/30 text-blue-300 font-semibold' : 'text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-slate-200">{tec.nome}</span>
                            {tec.papel === 'admin' ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Admin
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] text-slate-400 bg-slate-800">
                                Técnico
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">{tec.email}</div>
                        </div>
                        {tecnicoAtivo.email === tec.email && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-300 border border-blue-500/40">
                            Ativo
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dark/Light Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title={darkMode ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('chamados')}
            className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'chamados' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
          >
            Chamados ({chamadosAbertosCount})
          </button>
          <button
            onClick={() => setActiveTab('inventario')}
            className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'inventario' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
          >
            Inventário
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'historico' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
          >
            Por Setor
          </button>
          <button
            onClick={() => setActiveTab('consulta')}
            className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'consulta' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
          >
            Consulta
          </button>
          <button
            onClick={() => setActiveTab('novo_chamado')}
            className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'novo_chamado' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
          >
            Novo Chamado
          </button>
          <button
            onClick={() => setActiveTab('codigos')}
            className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'codigos' ? 'bg-emerald-600 text-white' : 'text-emerald-400'}`}
          >
            Códigos & Guia
          </button>
          <button
            onClick={() => setActiveTab('emails')}
            className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'emails' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
          >
            E-mails
          </button>
        </div>

      </div>
    </header>
  );
};
