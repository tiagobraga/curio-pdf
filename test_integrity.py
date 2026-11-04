#!/usr/bin/env python3
"""
test_integrity.py - Verificação automatizada dos componentes e configurações do Curió PDF UT
"""
import os
import json
import sys

REQUIRED_FILES = [
    "clickable.yaml",
    "CMakeLists.txt",
    "manifest.json.in",
    "curio-pdf.apparmor",
    "curio-pdf.content-hub",
    "content-hub.json",
    "curio-pdf.desktop.in",
    "qml/Main.qml",
    "src/backend.py",
    "src/reader_helper.py",
    "assets/logo.png",
    "assets/www/logo.png",
    "assets/sample.pdf",
    "assets/www/index.html",
    "assets/www/css/style.css",
    "assets/www/js/polyfills.js",
    "assets/www/js/i18n.js",
    "assets/www/js/storage.js",
    "assets/www/js/pdf-viewer.js",
    "assets/www/js/highlighter.js",
    "assets/www/js/pdf-exporter.js",
    "assets/www/js/app.js",
    "assets/www/vendor/pdf.min.js",
    "assets/www/vendor/pdf.worker.min.js",
    "assets/www/vendor/pdf-lib.min.js"
]

def main():
    print("Iniciando verificação de integridade do Curió PDF...")
    all_ok = True

    for filepath in REQUIRED_FILES:
        if not os.path.isfile(filepath):
            print(f"[FALHA] Arquivo ausente: {filepath}")
            all_ok = False
        else:
            size = os.path.getsize(filepath)
            print(f"[OK] {filepath} ({size} bytes)")

    # Validação sintática de JSONs
    json_files = ["manifest.json.in", "curio-pdf.apparmor", "curio-pdf.content-hub", "content-hub.json"]
    for jf in json_files:
        try:
            with open(jf, "r") as f:
                data = json.load(f)
            if jf == "manifest.json.in":
                assert data["title"] == "Curió PDF", f"Título incorreto: {data.get('title')}"
                assert data["name"] == "curio-pdf", f"Nome de pacote incorreto: {data.get('name')}"
            print(f"[OK JSON] {jf} é válido.")
        except Exception as e:
            print(f"[FALHA JSON] {jf} inválido: {e}")
            all_ok = False

    # Validação do Desktop Entry
    with open("curio-pdf.desktop.in", "r") as f:
        desktop_content = f.read()
        assert "Name=Curió PDF" in desktop_content
        assert "Icon=assets/logo.png" in desktop_content
        print("[OK DESKTOP] curio-pdf.desktop.in contém as diretivas esperadas para Curió PDF.")

    if all_ok:
        print("\nTODOS OS TESTES DE INTEGRIDADE PASSARAM COM SUCESSO!")
        sys.exit(0)
    else:
        print("\nOCORRERAM FALHAS NA VERIFICAÇÃO.")
        sys.exit(1)

if __name__ == "__main__":
    main()
