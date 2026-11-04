# Curió PDF para Ubuntu Touch (`leitorpdf.braga`)

Um aplicativo moderno, leve e minimalista para leitura de PDFs no **Ubuntu Touch** (compatível com Focal 20.04 e Noble 24.04), projetado especificamente para o ambiente móvel com foco em **rolagem contínua fluida**, **integração nativa ao Content Hub** e **ferramentas táteis de marca-texto**.

![Ícone do Aplicativo](assets/logo.png)

---

## 🚀 Principais Recursos

1. **Interface Móvel Touch-First (Ergonomia para Smartphone)**:
   - Ícones grandes e alvos de toque de 48px a 54px para fácil manuseio com os dedos.
   - **Top Bar fixa**: título legível, atalho rápido para busca e alternância de tema escuro/claro.
   - **Bottom Bar ergonômica fixa na base**: ao alcance do polegar para abrir sumário, ativar marca-texto, ajustar zoom à tela e salvar/exportar.
2. **Integração Nativa com o Lomiri Content Hub**:
   - **Navegação de Arquivos**: O botão "Abrir Documento PDF" abre diretamente o seletor nativo do sistema (`ContentPeerPicker`), permitindo navegar por pastas (Documentos, Downloads, Nextcloud) usando o Gerenciador de Arquivos do Ubuntu Touch.
   - **Salvar / Compartilhar**: Permite gravar e exportar o PDF destacado para qualquer pasta ou compartilhar via outros apps.
3. **Marca-texto Completo (2 Modos)**:
   - **Seleção Inteligente de Texto**: Selecione linhas ou palavras e aplique o grifo instantaneamente. As caixas de texto são unificadas suavemente para uma leitura limpa.
   - **Traço Livre (Caneta)**: Desenhe diretamente sobre a página usando o dedo ou uma caneta stylus (ideal para PDFs escaneados ou anotações rápidas).
   - **4 Cores de Marcação**: Amarelo (`#FFEB3B`), Verde (`#69F0AE`), Azul (`#40C4FF`) e Rosa (`#FF80AB`).
   - **Edição Dinâmica**: Toque em qualquer destaque existente para alterar sua cor ou excluí-lo.
4. **Rolagem Contínua Virtualizada**:
   - Leitura fluida sem quebras de página artificiais.
   - Pré-carregamento inteligente de páginas sob demanda (`IntersectionObserver`), garantindo baixo consumo de memória RAM mesmo em arquivos com centenas de páginas.
5. **Persistência Dupla e Modo Noturno**:
   - Memoriza última página, ponto de rolagem e todos os grifos internamente no `IndexedDB`.
   - Exportação padrão com gravação vetorial no próprio arquivo PDF.
   - Modo noturno com inversão suave de contraste para ambientes com pouca luz.
   - 100% offline.

---

## 🛠️ Como Testar no Computador (Desenvolvimento Local)

Você pode testar a interface e todas as funcionalidades imediatamente no seu navegador:

```bash
./run-dev.sh
```

Depois, acesse no navegador:
👉 **[http://localhost:8085/assets/www/](http://localhost:8085/assets/www/)**

Para testar, você pode abrir o arquivo de exemplo incluído: `assets/sample.pdf`.

---

## 📦 Como Compilar e Instalar no Ubuntu Touch (Clickable)

O projeto está configurado para o [Clickable](https://clickable-ut.dev/):

### Compilar o pacote `.click`:
```bash
clickable build
```

### Instalar e executar diretamente no seu dispositivo conectado via USB / ADB:
```bash
clickable
```

### Executar em modo desktop:
```bash
clickable desktop
```

---

## 📂 Estrutura do Projeto

```
2026_UT_leitorpdf/
├── assets/
│   ├── logo.png               # Ícone oficial da aplicação
│   ├── sample.pdf             # PDF de amostra para testes
│   └── www/                   # Motor web offline
│       ├── css/style.css      # Estilo Suru Minimalista & Modo Escuro
│       ├── js/
│       │   ├── app.js         # Controlador da interface e eventos
│       │   ├── highlighter.js # Motor de marca-texto (seleção + caneta)
│       │   ├── pdf-exporter.js# Gravador de anotações no binário do PDF
│       │   ├── pdf-viewer.js  # Renderizador contínuo e busca
│       │   └── storage.js     # Armazenamento IndexedDB de recentes e anotações
│       ├── vendor/            # PDF.js e pdf-lib (100% offline)
│       └── index.html         # Estrutura da interface
├── qml/
│   └── Main.qml               # Integração nativa Lomiri & ContentHub
├── clickable.yaml             # Configuração do Clickable
├── CMakeLists.txt             # Script de build e instalação
├── content-hub.json           # Configuração de importação/exportação de documentos
├── leitorpdf.apparmor         # Políticas de segurança do Ubuntu Touch
├── leitorpdf.desktop.in       # Lançador do sistema
├── manifest.json.in           # Metadados do pacote .click
├── run-dev.sh                 # Servidor de teste rápido
└── test_integrity.py          # Verificação automatizada dos arquivos
```
