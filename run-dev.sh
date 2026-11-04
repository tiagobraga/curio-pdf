#!/usr/bin/env bash
# run-dev.sh - Script de desenvolvimento e testes locais do Leitor PDF para Ubuntu Touch

PORT=8085
echo "=========================================================="
echo "  Iniciando servidor de teste local do Leitor PDF UT...   "
echo "  Acesse em seu navegador: http://localhost:${PORT}/assets/www/"
echo "=========================================================="

python3 -m http.server ${PORT}
