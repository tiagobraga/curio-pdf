"""
backend.py - Backend Python nativo para Curió PDF no Ubuntu Touch (OpenStore / Lomiri).
Inspirado na arquitetura do projeto Assinei! para garantir:
1. Servidor HTTP loopback (127.0.0.1) com MIME types estáticos (sem dependência de /etc/mime.types).
2. Integração confiável com Lomiri Content Hub para Importação e Exportação (sem limites de URL/title).
3. Armazenamento confinado em diretórios XDG (~/.local/share/ e ~/.cache/).
"""

import base64
import http.server
import json
import os
import shutil
import sys
import threading
import time
import urllib.parse
from pathlib import Path
from typing import Any, Dict, List, Optional

try:
    import pyotherside  # type: ignore
except ImportError:
    pyotherside = None

APP_ID = "leitorpdf.braga"


def _notify_qml(event_name: str, payload: Any = None) -> None:
    if pyotherside is not None:
        try:
            pyotherside.send(event_name, payload)
        except Exception as exc:
            print(f"[Curió-PDF] Erro ao enviar evento PyOtherSide {event_name}: {exc}")


class XdgPaths:
    """Resolve diretórios XDG confinados permitidos pelo AppArmor na OpenStore."""

    def __init__(self, app_id: str = APP_ID) -> None:
        home = Path.home()
        xdg_data = Path(os.environ.get("XDG_DATA_HOME", home / ".local" / "share"))
        xdg_config = Path(os.environ.get("XDG_CONFIG_HOME", home / ".config"))
        xdg_cache = Path(os.environ.get("XDG_CACHE_HOME", home / ".cache"))

        self.data_dir = xdg_data / app_id
        self.config_dir = xdg_config / app_id
        self.cache_dir = xdg_cache / app_id

        self.incoming_dir = self.cache_dir / "incoming"
        self.saved_dir = self.cache_dir / "saved"

        for d in (self.data_dir, self.config_dir, self.cache_dir, self.incoming_dir, self.saved_dir):
            try:
                d.mkdir(parents=True, exist_ok=True)
            except OSError:
                pass


class CurioBackend:
    def __init__(self) -> None:
        self.paths = XdgPaths()
        self.pending_files: List[Dict[str, Any]] = []
        self._lock = threading.Lock()
        self._server: Optional[http.server.ThreadingHTTPServer] = None
        self._server_port: int = 0
        self.web_root = Path(__file__).resolve().parent.parent / "assets" / "www"

    def enqueue_imported_file(self, file_url_or_path: str) -> Dict[str, Any]:
        """
        Recebe arquivos do Content Hub ou argumentos de linha de comando.
        Copia para a pasta incoming/ segura e extrai Base64 para consumo imediato.
        """
        try:
            clean_path = file_url_or_path
            if clean_path.startswith("file://"):
                clean_path = urllib.parse.unquote(clean_path[len("file://"):])

            src = Path(clean_path)
            if not src.exists():
                return {"success": False, "error": f"Arquivo não encontrado: {clean_path}"}

            dest = self.paths.incoming_dir / f"{int(time.time() * 1000)}_{src.name}"
            shutil.copy2(src, dest)

            data_b64 = base64.b64encode(dest.read_bytes()).decode("ascii")
            item = {
                "name": src.name,
                "path": str(dest),
                "base64": data_b64,
            }
            with self._lock:
                self.pending_files.append(item)

            _notify_qml("pdf-imported", {"name": src.name, "path": str(dest)})
            return {"success": True, "name": src.name, "path": str(dest)}
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    def pop_pending_files(self) -> List[Dict[str, Any]]:
        with self._lock:
            items = list(self.pending_files)
            self.pending_files.clear()
            return items

    def request_import_dialog(self) -> Dict[str, Any]:
        _notify_qml("request-import-pdf", {})
        return {"success": True, "contentHubRequested": True}

    def save_annotated_pdf(self, pdf_base64: str, original_name: str = "documento.pdf") -> Dict[str, Any]:
        """
        Salva o PDF anotado no diretório seguro de cache e aciona o Lomiri Content Hub
        no QML para exportar / salvar o arquivo no dispositivo.
        """
        try:
            safe_name = Path(original_name).name
            if not safe_name.lower().endswith(".pdf"):
                safe_name += ".pdf"

            dest_path = self.paths.saved_dir / safe_name
            raw_bytes = base64.b64decode(pdf_base64)
            dest_path.write_bytes(raw_bytes)

            # Notifica o Main.qml para abrir o ContentPeerPicker de exportação do Ubuntu Touch
            _notify_qml("request-export-pdf", str(dest_path))

            return {
                "success": True,
                "destPath": str(dest_path),
                "fileName": safe_name,
            }
        except Exception as exc:
            print(f"[Curió-PDF] Erro ao salvar PDF: {exc}")
            return {"success": False, "error": str(exc)}

    def read_file(self, file_path: str) -> Dict[str, Any]:
        try:
            clean = file_path
            if clean.startswith("file://"):
                clean = urllib.parse.unquote(clean[len("file://"):])
            p = Path(clean)
            if not p.is_file():
                return {"success": False, "error": f"Arquivo não encontrado: {clean}"}
            data_b64 = base64.b64encode(p.read_bytes()).decode("ascii")
            return {"success": True, "data": data_b64, "name": p.name}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def start_local_server(self, preferred_port: int = 19485) -> int:
        if self._server is not None:
            return self._server_port

        backend_ref = self
        web_root = self.web_root

        class Handler(http.server.SimpleHTTPRequestHandler):
            # Mapeamento MIME estático sem ler /etc/mime.types (bloqueado por AppArmor no Ubuntu Touch)
            _MIME_MAP = {
                ".html": "text/html; charset=utf-8",
                ".htm": "text/html; charset=utf-8",
                ".js": "application/javascript; charset=utf-8",
                ".mjs": "application/javascript; charset=utf-8",
                ".css": "text/css; charset=utf-8",
                ".json": "application/json; charset=utf-8",
                ".png": "image/png",
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".gif": "image/gif",
                ".svg": "image/svg+xml",
                ".ico": "image/x-icon",
                ".pdf": "application/pdf",
                ".woff": "font/woff",
                ".woff2": "font/woff2",
                ".ttf": "font/ttf",
            }

            def __init__(self, *args: Any, **kwargs: Any) -> None:
                super().__init__(*args, directory=str(web_root), **kwargs)

            def guess_type(self, path: Any) -> str:
                ext = Path(str(path)).suffix.lower()
                return self._MIME_MAP.get(ext, "application/octet-stream")

            def end_headers(self) -> None:
                self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
                self.send_header("Pragma", "no-cache")
                self.send_header("Expires", "0")
                super().end_headers()

            def log_message(self, format: str, *args: Any) -> None:
                pass  # Manter console limpo

            def _send_json(self, data: Any, status: int = 200) -> None:
                body = json.dumps(data).encode("utf-8")
                self.send_response(status)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
                self.send_header("Access-Control-Allow-Headers", "Content-Type")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)

            def do_OPTIONS(self) -> None:
                self._send_json({"ok": True})

            def do_GET(self) -> None:
                parsed = urllib.parse.urlparse(self.path)
                route = parsed.path

                if route == "/api/health":
                    self._send_json({"ok": True, "app": "curio-pdf", "version": "1.1.3"})
                elif route == "/api/pending-files":
                    self._send_json({"success": True, "files": backend_ref.pop_pending_files()})
                else:
                    super().do_GET()

            def do_POST(self) -> None:
                parsed = urllib.parse.urlparse(self.path)
                route = parsed.path
                length = int(self.headers.get("Content-Length", "0"))
                raw_body = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
                try:
                    body = json.loads(raw_body) if raw_body else {}
                except Exception:
                    body = {}

                if route == "/api/request-open-dialog":
                    self._send_json(backend_ref.request_import_dialog())
                elif route == "/api/save-pdf":
                    self._send_json(
                        backend_ref.save_annotated_pdf(
                            body.get("pdfBase64", ""),
                            body.get("fileName", "documento_destacado.pdf")
                        )
                    )
                elif route == "/api/read-file":
                    self._send_json(backend_ref.read_file(body.get("path", "")))
                else:
                    self._send_json({"success": False, "error": f"Rota desconhecida: {route}"}, status=404)

        for port in (preferred_port, 0):
            try:
                server = http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler)
                self._server = server
                self._server_port = server.server_address[1]
                thread = threading.Thread(target=server.serve_forever, daemon=True)
                thread.start()
                break
            except OSError:
                continue

        return self._server_port


_backend: Optional[CurioBackend] = None

def get_backend() -> CurioBackend:
    global _backend
    if _backend is None:
        _backend = CurioBackend()
    return _backend

def start_server() -> str:
    port = get_backend().start_local_server()
    return f"http://127.0.0.1:{port}/index.html"

def import_file(file_url: str) -> Dict[str, Any]:
    return get_backend().enqueue_imported_file(file_url)
