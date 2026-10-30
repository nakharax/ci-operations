import json
import os
import sys
import time
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlsplit

# Ensure root directory is in sys.path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

import ci_dashboard as dashboard
from app import HISTORY_STORE, _window_seconds, build_demo_state

LAST_POLL_TIME = 0
POLL_INTERVAL = int(os.environ.get("POLL", "30"))


class handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_HEAD(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()

    def do_GET(self):
        global LAST_POLL_TIME
        route = self.path.split("?", 1)[0]

        # 1. Favicon
        if route == "/favicon.ico":
            ico_path = os.path.join(ROOT_DIR, "app.ico")
            body = open(ico_path, "rb").read() if os.path.exists(ico_path) else b""
            self.send_response(200)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Content-Type", "image/x-icon")
            self.send_header("Cache-Control", "public, max-age=3600")
            self.end_headers()
            self.wfile.write(body)
            return

        # 2. History API
        if route in ("/api/history", "/api/history.csv"):
            query_params = parse_qs(urlsplit(self.path).query)
            w_name = self.headers.get("X-History-Window") or (query_params.get("window") or ["24h"])[0]
            w_sec = _window_seconds(w_name)
            since = time.time() - w_sec if w_sec else None
            if not dashboard.TOKEN:
                build_demo_state()
            if route == "/api/history.csv":
                body = (HISTORY_STORE.export_csv(since=since) if HISTORY_STORE else "").encode("utf-8")
                ct = "text/csv; charset=utf-8"
            else:
                summary = (
                    HISTORY_STORE.summary(since=since)
                    if HISTORY_STORE
                    else {
                        "total": 0,
                        "failed": 0,
                        "successes": 0,
                        "success_rate": None,
                        "workflows": [],
                        "failing_steps": [],
                        "trend": [],
                    }
                )
                jobs = HISTORY_STORE.export_json(since=since, limit=50)["jobs"] if HISTORY_STORE else []
                body = json.dumps({"summary": summary, "jobs": jobs}).encode("utf-8")
                ct = "application/json; charset=utf-8"
            self.send_response(200)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Referrer-Policy", "no-referrer")
            self.send_header("Content-Type", ct)
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)
            return

        # 3. State API with on-demand refresh
        if route == "/api/state":
            if dashboard.TOKEN:
                now = time.time()
                if now - LAST_POLL_TIME > POLL_INTERVAL:
                    try:
                        dashboard.poll_once()
                        LAST_POLL_TIME = now
                        if HISTORY_STORE is not None:
                            HISTORY_STORE.record(dashboard.STATE.get("jobs") or [])
                    except Exception as exc:
                        dashboard.STATE["error"] = str(exc)
            elif not os.environ.get("STATE_FILE"):
                dashboard.STATE.clear()
                dashboard.STATE.update(build_demo_state())

            body = json.dumps(dashboard.STATE).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Referrer-Policy", "no-referrer")
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)
            return

        self.send_error(404)

