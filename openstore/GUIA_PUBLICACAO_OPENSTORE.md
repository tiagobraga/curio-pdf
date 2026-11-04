# Guia Completo de Publicação na OpenStore e GitHub — Curió PDF

Este diretório contém os pacotes compilados `.click` e todas as informações, textos e instruções necessárias para publicar o aplicativo **Curió PDF** na [OpenStore](https://open-store.io/) e no [GitHub](https://github.com/).

---

## 📦 1. Pacotes `.click` Disponíveis

* **Versão Atual:** [`leitorpdf.braga_1.1.2_all.click`](leitorpdf.braga_1.1.2_all.click) (1.2 MB)
  * **Arquitetura:** `all` (compatível com `arm64`, `armhf`, `amd64`)
  * **Framework:** `ubuntu-touch-24.04-1.x` (compatível com Ubuntu Touch Focal 20.04 e Noble 24.04)
  * **Clickable Review:** `pass` (aprovado nos testes de segurança e sandboxing do Lomiri)
* **Versões Anteriores:** 
  * `leitorpdf.braga_1.1.1_all.click`
  * `leitorpdf.braga_1.1.0_all.click`
  * `leitorpdf.braga_1.0.0_all.click`

---

## 📝 2. Metadados Prontos para a OpenStore (`open-store.io`)

### Nome do Pacote (Package Name)
```text
leitorpdf.braga
```

### Título do Aplicativo (Title)
```text
Curió PDF
```
*(Alternativa: `Curió PDF - Leitor & Marca-texto`)*

### Resumo / Tagline (Summary)
*(Exibido nos cards e resultados de busca da loja — máx. 80 caracteres)*

* **Português:**
  ```text
  Leitor de PDF minimalista com rolagem contínua e marca-texto inteligente.
  ```
* **Inglês (caso opte pela listagem internacional):**
  ```text
  Minimalist PDF reader with continuous scrolling & smart highlighter.
  ```

### Categoria (Category)
* **Office** (Escritório / Produtividade) ou **Books & Reference**

### Tags (Palavras-chave)
```text
pdf, reader, highlight, notes, documents, books, viewer, study
```

### Licença (License)
```text
MIT
```

---

### Descrição Completa (Description)
Copie e cole o texto em Markdown abaixo no campo **Description** da OpenStore:

```markdown
O **Curió PDF** é um leitor de documentos PDF moderno, minimalista e rápido, desenvolvido sob medida para a experiência móvel no **Ubuntu Touch** (Lomiri).

Projetado para leitura agradável e anotações táteis ergonômicas, o Curió PDF oferece rolagem contínua fluida, consumo reduzido de memória e ferramentas completas de marcação.

### 🌟 Destaques Principais:

* **Integração Nativa ao Lomiri Content Hub:**
  * Abra documentos diretamente da pasta Documentos, Downloads ou serviços em nuvem (Nextcloud) usando o seletor nativo do sistema.
  * Salve e compartilhe arquivos com um toque.

* **Marca-texto Inteligente (2 Modos):**
  * **Modo Texto:** Selecione trechos e palavras para aplicar o destaque de forma instantânea e alinhada. As opções de cores ficam fixadas na borda da tela sem cobrir o texto lido ou as alças de seleção.
  * **Modo Caneta:** Desenhe livremente anotações e rabiscos com o dedo ou caneta stylus (ideal para páginas digitalizadas).
  * **4 Cores Vivas:** Amarelo, Verde, Azul e Rosa.
  * **Edição Fácil:** Toque em qualquer destaque existente para alterar a cor ou excluí-lo.

* **Gravação Padrão no PDF:**
  * Os destaques são gravados diretamente na estrutura binária padrão do PDF ao salvar. Suas anotações poderão ser visualizadas em qualquer outro leitor no computador ou celular.

* **Zoom Inteligente e Ergonomia:**
  * Zoom com dois dedos (pinch-to-zoom) ou botões dedicados que redimensionam exclusivamente o documento, mantendo barras de ferramentas e paletas no tamanho tátil ideal.
  * **Rolagem Contínua:** Navegação suave sem quebras artificiais de página.
  * **Modo Noturno / Escuro:** Inversão suave para leitura no escuro.
  * **Busca no Texto:** Encontre termos rapidamente com contador de ocorrências.
  * **Painel Lateral:** Acesse sumário estruturado e índice de anotações.

* **Privacidade Total:**
  * Funciona 100% offline. Nenhum dado ou documento sai do seu aparelho.
```

---

### Changelog da Versão 1.1.2 (Changelog)
```text
v1.1.2:
- Posicionamento da barra de marcação: as cores de destaque ficam na borda da tela sem cobrir o texto selecionado nem as alças de expansão.
- Zoom inteligente: o gesto de pinça e botões de zoom redimensionam exclusivamente o documento PDF, mantendo barras e opções de cores no tamanho original.
- Botão da ferramenta de marca-texto inicia no estado neutro e fica laranja apenas quando ativado.
- Camada de texto otimizada com suporte aprimorado para gestos touch no Ubuntu Touch.
```

---

## 🚀 3. Passo a Passo para Publicação na Open-Store.io

1. **Acesso e Login:**
   * Acesse [https://open-store.io/](https://open-store.io/).
   * Clique em **Sign in** no canto superior direito (você pode entrar com sua conta Ubuntu One, GitLab ou GitHub).

2. **Iniciar Submissão:**
   * No menu do usuário, clique em **Submit App** (ou [https://open-store.io/submit](https://open-store.io/submit)).
   * Se já possuir o app registrado, vá em **My Apps** e selecione o Curió PDF para enviar uma nova versão.

3. **Preenchimento dos Dados:**
   * **Package Name:** `leitorpdf.braga`
   * Cole os campos de **Title**, **Tagline (Summary)**, **Description**, selecione **Office** em Category e preencha as **Tags**.
   * Insira o **Changelog da v1.1.2**.

4. **Upload do Pacote:**
   * No campo de arquivo, faça o upload do arquivo:
     `openstore/leitorpdf.braga_1.1.2_all.click`

5. **Screenshots:**
   * É altamente recomendado enviar de 2 a 4 capturas de tela do aplicativo no celular:
     * Tela inicial com documentos recentes.
     * Documento aberto em leitura clara.
     * Documento com texto grifado e menu de cores.
     * Documento em modo noturno.
   * *Dica para capturar telas no Ubuntu Touch:* Pressione simultaneamente os botões físicos `Power + Volume Baixo`, ou via terminal conectado pelo computador:
     ```bash
     adb exec-out screencap -p > openstore/screenshot_1.png
     ```

6. **Publicar:**
   * Clique em **Submit**. O sistema da OpenStore realizará as checagens automáticas e, em seguida, seu aplicativo estará público para a comunidade mundial do Ubuntu Touch!

---

## 🐙 4. Passo a Passo para Submissão no GitHub

O repositório Git local já está configurado na branch `main` com commits organizados e a tag `v1.1.2`.

### Passo 1: Criar o Repositório no GitHub
1. Acesse [https://github.com/new](https://github.com/new).
2. Defina o nome do repositório: `curio-pdf` (ou `leitorpdf-ut`).
3. Deixe marcado como **Public**.
4. **Não** marque para adicionar README, .gitignore ou License (eles já existem no projeto).
5. Clique em **Create repository**.

### Passo 2: Vincular o Repositório Remoto e Enviar
No terminal, na pasta raiz do projeto, execute:

```bash
cd /home/braga/Nextcloud/Projetos/2026_UT_leitorpdf

# Adicione o link do seu novo repositório GitHub (ajuste com seu usuário):
git remote add origin https://github.com/tiagobraga/curio-pdf.git

# Envie o código principal e as tags de versão:
git push -u origin main --tags
```

### Passo 3: Criar a Release da Versão v1.1.2
1. No seu repositório no GitHub, clique na seção **Releases** na coluna direita (ou [https://github.com/tiagobraga/curio-pdf/releases/new](https://github.com/tiagobraga/curio-pdf/releases/new)).
2. Em **Choose a tag**, selecione **`v1.1.2`**.
3. No campo **Release title**, informe: `Curió PDF v1.1.2`.
4. No campo de descrição, cole o changelog da versão.
5. **Anexo do binário:** Arraste o arquivo `openstore/leitorpdf.braga_1.1.2_all.click` para a área de anexos (*Attach binaries by dropping them here*).
6. Clique em **Publish release**.
