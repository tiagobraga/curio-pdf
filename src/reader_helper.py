"""
reader_helper.py - Utilitário nativo Python para leitura e gravação de PDFs confinados no Ubuntu Touch
"""

import base64
import os
import urllib.parse
from pathlib import Path


def read_file_base64(file_url_or_path: str) -> dict:
    raw_path = file_url_or_path.replace("file://", "").strip()
    # Decodificar caracteres de URL (como %20 para espaços ou acentos)
    clean_path = urllib.parse.unquote(raw_path)
    
    p = Path(clean_path)
    if not p.is_file():
        # Tenta também o caminho original caso unquote tenha divergido
        p_raw = Path(raw_path)
        if p_raw.is_file():
            p = p_raw
        else:
            return {"success": False, "error": f"Arquivo não encontrado: {clean_path}"}
            
    try:
        data = p.read_bytes()
        b64 = base64.b64encode(data).decode("ascii")
        return {"success": True, "data": b64, "name": p.name}
    except Exception as e:
        return {"success": False, "error": str(e)}


def save_file_base64(file_name: str, b64_data: str) -> dict:
    home = Path.home()
    cache_dir = home / ".cache" / "leitorpdf.braga" / "export"
    try:
        cache_dir.mkdir(parents=True, exist_ok=True)
        safe_name = urllib.parse.unquote(file_name)
        out_path = cache_dir / safe_name
        raw_bytes = base64.b64decode(b64_data)
        out_path.write_bytes(raw_bytes)
        return {"success": True, "path": str(out_path)}
    except Exception as e:
        return {"success": False, "error": str(e)}
