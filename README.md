# 🖥️ DeskOps TI - Helpdesk, Inventário & Gestão de TI (Google Workspace)

> **Sistema Completo de Helpdesk, Gestão de Ativos de TI e Portal de Chamados por Setor integrado ao Google Sheets e Google Workspace com Execução Local em 1 Clique e Aplicativo Desktop (.exe).**

---

## ⚡ Como Baixar e Executar pelo GitHub (1 Duplo-Clique)

Não é necessário configurar servidores complexos. Qualquer pessoa pode clonar ou baixar este repositório e rodar no seu próprio computador:

### 1. Baixar o Projeto
- **Opção A (Download direto)**: Clique no botão verde **Code** no GitHub e escolha **Download ZIP**. Extraia a pasta no seu computador.
- **Opção B (Git Clone)**:
  ```bash
  git clone https://github.com/seu-usuario/deskops-ti.git
  cd deskops-ti
  ```

---

### 2. Executar no seu Computador

#### 🪟 No Windows (Executável com 1 Duplo-Clique):
Dê **dois cliques** em qualquer um dos arquivos de inicialização na pasta do projeto:
- `iniciar-deskops.bat`  OU  `DeskOps-TI.bat`

*O que o script faz automaticamente:*
1. Verifica se o Node.js está instalado (se não estiver, informa o link oficial: https://nodejs.org).
2. Instala as dependências (`npm install`) na primeira execução.
3. Inicia o servidor local em `http://localhost:3000`.
4. Abre o seu navegador padrão automaticamente!

#### 🐧 No Linux ou 🍏 macOS:
Abra o terminal na pasta do projeto e execute:
```bash
./iniciar-deskops.sh
```

---

## 💻 Instalar como Aplicativo Executável Desktop (.exe / PWA)

O DeskOps TI possui suporte nativo a **PWA (Progressive Web App)**:
1. Com o sistema aberto no **Google Chrome**, **Microsoft Edge** ou **Brave**, clique no botão **"Instalar Desktop"** na barra superior (ou no ícone de instalar na barra de endereços).
2. O Windows/macOS criará um atalho de aplicativo na sua **Área de Trabalho** e no **Menu Iniciar**.
3. O DeskOps TI rodará em uma janela própria e isolada (como um executável `.exe`), sem barras de navegador!

---

## ⚙️ Como Vincular a Sua Própria Utilidade (Personalização)

Ao baixar este projeto para a sua própria empresa, escola, hospital ou órgão público, você pode personalizar tudo na aba **"💻 Executável & GitHub"**:

### 1. Vincular a Sua Própria Planilha Google Sheets
- **Criar Nova Planilha (1 Clique)**: Clique em *"Criar Nova Planilha no Meu Google Drive"* para gerar uma planilha zerada e pré-formatada com as 5 abas (`Chamados (Helpdesk)`, `Inventário`, `Funcionários`, `Movimentações`, `Histórico de Status`).
- **Conectar Planilha Existente**: Cole o link ou ID da sua planilha já existente.
- **Buscar no Google Drive**: Selecione entre as planilhas da sua conta Google.

### 2. Personalizar o Nome da Sua Organização
- Altere o nome exibido no topo (ex: *"Secretaria de Educação"*, *"Hospital São Lucas"*, *"Tech Corp"*).
- Altere o subtítulo da sua unidade de TI.

### 3. Personalizar Setores da Sua Empresa
- Adicione, edite ou remova setores.
- Carregue modelos prontos de setores com 1 clique:
  - 🏢 **Corporativo Geral**: Diretoria, TI & Infra, RH, Financeiro, Comercial, Marketing, Jurídico, Logística, Compras.
  - 🏛️ **Órgão Público / Governamental**: 27 setores administrativos (Gabinete, Ouvidoria, Patrimônio, TI, etc.).
  - 🏥 **Saúde & Hospitalar**: Recepção, Triagem, Emergência, UTI, Enfermagem, Farmácia, Centro Cirúrgico, TI Hospitalar.
  - 🎓 **Educação & Ensino**: Direção, Secretaria, Coordenação, Professores, Biblioteca, Laboratórios, TI Educacional.
  - 🛒 **Comércio & Varejo**: Caixa, Vendas, Estoque, TI / PDV, Atendimento, Financeiro.

### 4. Exportar e Importar Configurações
- Baixe o arquivo `deskops-config.json` para transferir suas preferências para outros computadores da equipe com 1 clique.

---

## 📂 Estrutura das Abas da Planilha Google Sheets

| Aba | Descrição |
|---|---|
| **Chamados (Helpdesk)** | Protocolos `CH-2026-XXXX`, Solicitante, Setor, Descrição, Prioridade, SLA, Técnico, Status |
| **Inventário** | Código Patrimonial `PAT-XXXX`, Tipo, Modelo, Serial, Status, Alocação |
| **Funcionários** | Matrícula `FUNC-XXXX`, Nome, Cargo, Setor, E-mail |
| **Movimentações** | Histórico de Atribuições, Devoluções e Envios para Manutenção |
| **Histórico de Status** | Log de transições de status com carimbo de data/hora e técnico |

---

## 🛠️ Tecnologias Utilizadas
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Motion.
- **PWA & Desktop**: Service Workers, Web App Manifest, Cache First, Offline Storage.
- **Integração Google**: Google Sheets API v4, Google Drive API v3, Google Apps Script.

---

## 📄 Licença
Distribuído sob a licença **Apache 2.0**.
