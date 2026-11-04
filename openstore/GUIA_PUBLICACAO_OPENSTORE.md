# OpenStore & GitHub Publishing Guide — Curió PDF

This folder contains the compiled `.click` packages along with all metadata, texts, and step-by-step instructions needed to publish **Curió PDF** on the [OpenStore](https://open-store.io/) and [GitHub](https://github.com/).

---

## 📦 1. Available `.click` Packages

* **Current Release:** [`curio-pdf_1.1.3_all.click`](curio-pdf_1.1.3_all.click) (1.2 MB)
  * **Package Name:** `curio-pdf`
  * **Architecture:** `all` (multi-arch: `arm64`, `armhf`, `amd64`)
  * **Framework:** `ubuntu-touch-24.04-1.x` (compatible with both Ubuntu Touch Focal 20.04 and Noble 24.04)
  * **Clickable Review Status:** `pass` (fully compliant with Lomiri security and confinement standards)

---

## 📝 2. Metadata for OpenStore (`open-store.io`)

### Package Name
```text
curio-pdf
```

### Application Title
```text
Curió PDF
```
*(Alternative: `Curió PDF - Reader & Highlighter`)*

### Summary / Tagline
*(Displayed on OpenStore search results and cards — max 80 characters)*

```text
Minimalist PDF reader with continuous scrolling & smart highlighter.
```

*(Portuguese version if preferred: `Leitor de PDF minimalista com rolagem contínua e marca-texto inteligente.`)*

### Category
* **Office** (or **Books & Reference**)

### Tags (Keywords)
```text
pdf, reader, highlight, notes, documents, books, viewer, study
```

### License
```text
MIT
```

---

### Full Description (Markdown)
Copy and paste the formatted Markdown text below into the **Description** field on OpenStore:

```markdown
**Curió PDF** is a modern, fast, and minimalist PDF document reader tailor-made for the mobile experience on **Ubuntu Touch** (Lomiri).

Engineered for comfortable reading and thumb-friendly touch interactions, Curió PDF provides smooth continuous scrolling, lightweight memory consumption, and a full-featured highlighting suite.

### 🌟 Key Highlights:

* **Native Lomiri Content Hub Integration:**
  * Open documents seamlessly from Documents, Downloads, or cloud folders (Nextcloud) using the system file picker.
  * Save and export annotated files with a single tap.

* **Smart Highlighter (2 Modes):**
  * **Text Mode:** Select words and sentences to apply clean, aligned highlights instantly. The color picker docks unobtrusively at the screen edge, never blocking the text you are reading or the touch selection handles.
  * **Freehand Ink Mode:** Draw notes and annotations directly over pages using your finger or a stylus (ideal for scanned documents).
  * **4 Distinct Colors:** Yellow, Green, Blue, and Pink.
  * **Easy Editing:** Tap any existing highlight to switch colors or delete it.

* **Standard PDF Specification Export:**
  * Highlights are written directly into the standard PDF binary format upon saving. Your annotations can be viewed on any other PDF reader across desktop computers, tablets, or phones.

* **Smart Zoom & Touch Ergonomics:**
  * Two-finger pinch-to-zoom and dedicated zoom buttons resize **strictly the PDF document**, keeping toolbars, buttons, and color pickers at their exact original touch-friendly scale.
  * **Continuous Scrolling:** Smooth navigation without artificial page breaks.
  * **Dark / Night Mode:** Gentle contrast inversion for eye-friendly nighttime reading.
  * **In-Text Search:** Find keywords instantly with match counters and navigation arrows.
  * **Sidebar Navigation:** Access structured table of contents (outlines) and your saved highlights list.

* **Total Privacy:**
  * Runs 100% offline. No data or document ever leaves your device.
```

---

### Version 1.1.3 Changelog
```text
v1.1.3:
- Strict viewport zoom isolation: Top and bottom bars remain 100% fixed during pinch-to-zoom gestures, scaling strictly the PDF document.
- Fluid PDF drag & pan: Added smooth horizontal and vertical touch panning when zoomed in so reading overflowing text is completely frictionless.
- Added "About" (Sobre) button to bottom bar and home screen featuring project background, research group link (curio.ia.br), and Lattes CV.
- Preserved neutral highlighter button state and non-obstructive color palette docking.
```

---

## 🚀 3. Step-by-Step Publishing Guide for Open-Store.io

1. **Access and Sign In:**
   * Open [https://open-store.io/](https://open-store.io/).
   * Click **Sign in** in the top-right corner (authenticate using your Ubuntu One, GitLab, or GitHub account).

2. **Start Submission:**
   * In the user menu, click **Submit App** (or navigate directly to [https://open-store.io/submit](https://open-store.io/submit)).
   * If you have already registered the app before, go to **My Apps** and select Curió PDF to upload a new release.

3. **Fill in Details:**
   * **Package Name:** `curio-pdf`
   * Paste the **Title**, **Summary / Tagline**, **Description**, choose **Office** under Category, and set the **Tags**.
   * Add the **Changelog for v1.1.3**.

4. **Upload the `.click` Package:**
   * In the package upload field, upload:
     `openstore/curio-pdf_1.1.3_all.click`

5. **Screenshots:**
   * It is highly recommended to upload 2 to 4 screenshots from your phone:
     * Welcome screen with recent documents.
     * Document open in standard reading view.
     * Highlighted text with the docked color palette.
     * Night mode reading view.
   * *Tip for capturing screenshots on Ubuntu Touch:* Press physical buttons `Power + Volume Down` simultaneously, or capture via terminal from your computer:
     ```bash
     adb exec-out screencap -p > openstore/screenshot_1.png
     ```

6. **Submit:**
   * Click **Submit**. The OpenStore automated checks will run, and your application will be published and available for the global Ubuntu Touch community!

---

## 🐙 4. Step-by-Step GitHub Submission Guide

The local Git repository is already configured on the `main` branch with clean commits and tagged as `v1.1.3`.

### Step 1: Create the Repository on GitHub
1. Open [https://github.com/new](https://github.com/new).
2. Set the repository name: `curio-pdf` (or `leitorpdf-ut`).
3. Set the visibility to **Public**.
4. **Do NOT** initialize with a README, .gitignore, or license (these already exist in the codebase).
5. Click **Create repository**.

### Step 2: Link Remote and Push Commits & Tags
In your terminal, inside the project root directory, run:

```bash
cd /home/braga/Nextcloud/Projetos/2026_UT_leitorpdf

# Link your remote GitHub repository (replace with your GitHub username/repo):
git remote add origin https://github.com/tiagobraga/curio-pdf.git

# Push the main branch and release tags:
git push -u origin main --tags
```

### Step 3: Create GitHub Release v1.1.3
1. In your GitHub repository, open the **Releases** section in the right sidebar (or [https://github.com/tiagobraga/curio-pdf/releases/new](https://github.com/tiagobraga/curio-pdf/releases/new)).
2. Under **Choose a tag**, select **`v1.1.3`**.
3. In **Release title**, enter: `Curió PDF v1.1.3`.
4. In the description box, paste the v1.1.3 changelog.
5. **Attach the binary:** Drag and drop `openstore/curio-pdf_1.1.3_all.click` into the *Attach binaries by dropping them here* box.
6. Click **Publish release**.
