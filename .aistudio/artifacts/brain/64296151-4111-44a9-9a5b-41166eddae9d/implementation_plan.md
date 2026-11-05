# Sistema Integrado de Gestão de TI, Helpdesk e Inventário (Google Workspace & Apps Script)

Sistema corporativo de Helpdesk e Inventário de TI projetado sob medida para o ecossistema Google Workspace (Google Sheets, Google Forms, Gmail e Google Apps Script), integrando uma interface moderna para técnicos (Web App) e um portal simplificado para colaboradores consultarem chamados sem login.

---

### Decisões Críticas Confirmadas

> [!IMPORTANT]
> Decisões alinhadas com o usuário durante a fase de clarificação:

- **Formato da Interface de TI**: Web App independente em tela cheia no navegador com layout responsivo e moderno (com suporte arquitetural adaptável para Sidebar no Google Sheets).
- **Políticas e Alertas de SLA**: SLA dinâmico baseado em prioridade — **Crítica: 2 horas**, **Alta: 4 horas**, **Média: 8 horas**, **Baixa: 24 horas** — com contador visual de tempo decorrido e destaque cromático imediato para chamados em risco ou estourados.
- **Canal de Atendimento para Funcionários**: Híbrido — Suporte nativo ao Google Forms oficial com gatilho `onFormSubmit` e portal web leve de consulta e abertura por número de protocolo (sem necessidade de login ou senha).

---

## 1. Visão Geral e Conceito do Sistema

O sistema resolve o atrito comum entre colaboradores e a equipe de suporte técnico através de dois pilares:
1. **Para os Colaboradores**: Abertura descomplicada de chamados com linguagem visual intuitiva (ícones e categorias diretas) e acompanhamento em tempo real através do número de protocolo, recebendo confirmações e atualizações automáticas via e-mail formatado em HTML.
2. **Para a Equipe de TI**: Painel operacional unificado com listagem de chamados, filtros dinâmicos, atribuição com 1 clique (`Session.getActiveUser().getEmail()`), controle de SLA, gestão de inventário de hardware e rastreabilidade total (logs com carimbo de data/hora e e-mail do técnico).

---

## 2. Experiência do Usuário (UX/UI) e Arquitetura Visual

### Layout e Navegação
- **Estrutura Visual**: Layout profissional SaaS com barra lateral de navegação colapsável, cabeçalho de contexto e três ambientes principais:
  - **Fila de Chamados (Helpdesk)**: Cards de status rápidos, tabela de chamados com badges de SLA, filtros por status/setor/prioridade e gaveta lateral de detalhes com botão de ação rápida "Assumir Chamado" e fechamento com observações.
  - **Inventário de Ativos**: Catálogo de equipamentos (notebooks, desktops, monitores, periféricos) com status (`Disponível`, `Em Uso`, `Em Manutenção`, `Descartado`), ações rápidas de atribuição a funcionários, devolução ao estoque e envio para reparo.
  - **Histórico 360º de Colaboradores**: Visão centralizada por funcionário, exibindo todos os equipamentos atualmente sob sua posse e a linha do tempo de todos os chamados abertos.
  - **Portal do Colaborador (Autoatendimento)**: Interface limpa para busca instantânea por protocolo e formulário amigável de abertura rápida.
  - **Central de Códigos e Instalação (Exportador)**: Visualizador de código com realce de sintaxe, cópia em 1 clique e download dos arquivos Google Apps Script (`Code.gs`, `Index.html`, `Setup_Planilha.gs`) acompanhados de um guia passo a passo ilustrado de configuração de gatilhos e permissões.

### Estilo Visual e Tipografia
- **Paleta de Cores**: Base neutra sólida em Slate/Zinc (`bg-slate-50 dark:bg-slate-950`), superfícies nítidas com bordas sutis (`border-slate-200 dark:border-slate-800`), e acentos de cor funcionais reservados para estados de SLA e chamados:
  - Normal/Concluído: Esmeralda (`#16a34a`)
  - Em Andamento: Azul corporativo (`#2563eb`)
  - Alerta de SLA / Alta Prioridade: Âmbar (`#d97706`)
  - SLA Estourado / Crítico: Carmesim (`#dc2626`)
- **Tipografia**: `Plus Jakarta Sans` para títulos e botões, `DM Sans` para textos e `font-mono tabular-nums` para protocolos, números de série e cronômetros de SLA.

---

## 3. Decisões de Produto e Engenharia

- **Decisão 1: Identificação Sem Senhas Manuais**
  - *Abordagem*: No Google Apps Script, utilização de `Session.getActiveUser().getEmail()` para autenticar o técnico e gravar automaticamente a autoria em todas as alterações e movimentações.
  - *No Simulador/Web App*: Seletor de técnico ativo simulando a sessão corporativa do Google Workspace para testes imediatos.
- **Decisão 2: Estrutura Relacional no Google Sheets**
  - *Abordagem*: 4 abas estritas (`Chamados`, `Funcionarios`, `Inventario`, `Movimentacoes`) com colunas padronizadas, IDs únicos (`CH-2026-XXXX`, `MOV-XXXX`, `EQ-XXXX`) e integridade referencial mantida por script.
- **Decisão 3: Notificações Automáticas em HTML via GmailApp**
  - *Abordagem*: Templates responsivos de e-mail com protocolo destacado, card de status e links diretos para acompanhamento.

---

## 4. Arquitetura Técnica e Fluxo de Dados

```
┌────────────────────────────────────────────────────────────────────────┐
│                        COLABORADOR / SOLICITANTE                       │
│  - Google Forms (com ícones amigáveis) OU Portal Web por Protocolo     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ onFormSubmit / Web App POST
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   BACKEND GOOGLE APPS SCRIPT (Code.gs)                 │
│  - Captura payload & gera ID CH-2026-XXXX                              │
│  - Envia e-mail de confirmação via GmailApp com Protocolo              │
│  - Grava na aba "Chamados" e calcula meta de SLA por prioridade        │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│       BANCO DE DADOS (Sheets)        │  │   PAINEL DO TÉCNICO (Web App) │
│  - Chamados (Status, SLA, Técnico)   │  │  - Assumir chamado (1 clique)│
│  - Funcionários (Ativos/Inativos)    │  │  - Alertas visuais de SLA    │
│  - Inventário (Máquinas, Status)     │  │  - Atribuição de Ativos      │
│  - Movimentações (Rastreabilidade)   │  │  - Histórico 360º de Usuário │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

### Entregáveis de Código Google Workspace
1. **`Code.gs`**:
   - `onFormSubmit(e)`: Gatilho automático ao receber respostas do Google Forms.
   - `doGet(e)` / `doPost(e)`: Roteamento da interface Web App e API JSON.
   - `assumirChamado(idChamado)`: Atribui ao técnico autenticado e atualiza status.
   - `finalizarChamado(idChamado, solucao)`: Encerra, calcula SLA real e notifica o solicitante por e-mail.
   - `atribuirEquipamento(idEquipamento, idFuncionario)`: Atualiza status do inventário e grava log em Movimentações.
   - `devolverEquipamento(idEquipamento, motivo)` & `enviarManutencao(idEquipamento, motivo)`.
   - `consultarHistoricoFuncionario(idFuncionario)`: Retorna chamados passados e equipamentos vinculados.
2. **`Index.html`**:
   - Interface completa em HTML5, Tailwind CSS e JavaScript limpo com chamadas seguras via `google.script.run`.
3. **`Setup_Planilha.gs`**:
   - Função executável `configurarBancoDeDados()` que cria todas as abas, formata cabeçalhos com cores institucionais, congela linhas, define validações de listas suspensas e insere dados iniciais de teste.
4. **Guia Passo a Passo (`Guia_Implantacao.md`)**:
   - Instruções completas para vinculação de formulário, ativação de gatilhos acionados por tempo e por envio de formulário, e autorização de permissões de escopo (`Gmail`, `SpreadsheetApp`, `ScriptApp`).
