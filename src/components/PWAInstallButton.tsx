import React, { useState } from 'react';
import { Download, Monitor, CheckCircle, Apple, HelpCircle, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'compact' | 'full' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'compact'
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);

  // If already running inside standalone desktop window
  if (isInstalled) {
    if (variant === 'banner') return null;
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
        <span>Aplicativo Desktop Ativo</span>
      </div>
    );
  }

  // Chromium / Edge / Desktop flow (standard beforeinstallprompt)
  if (isInstallable) {
    if (variant === 'banner') {
      return (
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-slate-900 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-white">Instalar DeskOps TI no Computador</h4>
              <p className="text-xs text-slate-300">
                Execute como aplicativo desktop independente (.exe), sem barra de navegação e com atalho na Área de Trabalho.
              </p>
            </div>
          </div>
          <button
            onClick={install}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md transition shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Instalar Aplicativo (.exe)</span>
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={install}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition ${className}`}
        title="Instalar DeskOps TI como aplicativo desktop (.exe / standalone)"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar Desktop</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium transition ${className}`}
        >
          <Apple className="w-3.5 h-3.5" />
          <span>Instalar no iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Apple className="w-4 h-4 text-blue-400" />
                  <span>Instalar no iPhone / iPad</span>
                </h3>
                <button onClick={() => setShowIOSGuide(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 space-y-2 text-xs text-slate-300">
                <p>1. Abra este site no navegador <strong>Safari</strong>.</p>
                <p>2. Toque no botão <strong>Compartilhar</strong> (ícone de quadrado com seta para cima).</p>
                <p>3. Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.</p>
                <p>4. O DeskOps TI funcionará em tela cheia como aplicativo nativo.</p>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback for browsers when beforeinstallprompt has not fired yet or manual install
  return (
    <>
      <button
        onClick={() => setShowManualGuide(true)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium transition ${className}`}
        title="Como executar e instalar DeskOps TI no computador"
      >
        <Monitor className="w-3.5 h-3.5 text-blue-400" />
        <span>Modo Desktop</span>
      </button>

      {showManualGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Monitor className="w-5 h-5 text-blue-400" />
                <span>Instalar como Executável / Desktop</span>
              </h3>
              <button onClick={() => setShowManualGuide(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mt-4 space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="font-semibold text-white block mb-1">💻 Opção 1: Instalar pelo Navegador (Chrome / Edge / Brave)</span>
                No menu do navegador (três pontinhos no topo à direita) ou na barra de endereços, clique no ícone de <strong>Instalar DeskOps TI</strong>. Ele criará um aplicativo executável na Área de Trabalho!
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="font-semibold text-white block mb-1">🚀 Opção 2: Executar do GitHub em 1 Duplo-Clique</span>
                Ao baixar o projeto do GitHub, basta dar <strong>dois cliques</strong> no arquivo <code className="text-blue-400 bg-slate-900 px-1 py-0.5 rounded">iniciar-deskops.bat</code> no Windows ou <code className="text-blue-400 bg-slate-900 px-1 py-0.5 rounded">./iniciar-deskops.sh</code> no Linux/Mac!
              </div>
            </div>

            <button
              onClick={() => setShowManualGuide(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
};
