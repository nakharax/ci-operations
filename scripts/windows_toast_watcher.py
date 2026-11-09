#!/usr/bin/env python3
"""
NakharaX Windows Desktop Toast & Observability Watcher
=====================================================
Lightweight background watcher that sends native Windows 10/11 Toast Notifications
for CI pipeline failures, VPS health status, and build anomalies without external UI dependencies.
"""

import os
import sys
import re
import time
import json
import urllib.request
import subprocess
from pathlib import Path

# Patterns to mask from toast notifications to protect credentials
SECRET_PATTERNS = [
    re.compile(r"sk-[a-zA-Z0-9_\-]{8,}"),
    re.compile(r"eyJ[a-zA-Z0-9_\-\.]{6,}"),
    re.compile(r"(?:Bearer|Token|secret|key)[=:\s]+[a-zA-Z0-9_\-]{8,}", re.IGNORECASE),
]

def sanitize_toast_message(message: str) -> str:
    """Mask any sensitive API keys, JWTs, or secrets before displaying in desktop toast."""
    sanitized = message
    for pattern in SECRET_PATTERNS:
        sanitized = pattern.sub("[REDACTED]", sanitized)
    return sanitized

def build_powershell_toast_command(title: str, message: str) -> str:
    """Constructs a PowerShell script command to trigger a native Windows Toast notification."""
    safe_title = sanitize_toast_message(title).replace("'", "''").replace('"', '`"')
    safe_msg = sanitize_toast_message(message).replace("'", "''").replace('"', '`"')
    
    ps_script = (
        f"[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null; "
        f"$template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02); "
        f"$textNodes = $template.GetElementsByTagName('text'); "
        f"$textNodes.Item(0).AppendChild($template.CreateTextNode('{safe_title}')) > $null; "
        f"$textNodes.Item(1).AppendChild($template.CreateTextNode('{safe_msg}')) > $null; "
        f"$notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('NakharaX'); "
        f"$notification = [Windows.UI.Notifications.ToastNotification]::new($template); "
        f"$notifier.Show($notification);"
    )
    return f'powershell -NoProfile -ExecutionPolicy Bypass -Command "{ps_script}"'

def send_toast(title: str, message: str) -> bool:
    """Dispatches toast notification on Windows."""
    if sys.platform != "win32":
        print(f"[TOAST - Non-Win32] {title}: {message}")
        return True
    try:
        cmd = build_powershell_toast_command(title, message)
        res = subprocess.run(cmd, shell=True, capture_output=True, timeout=5)
        return res.returncode == 0
    except Exception as e:
        print(f"[!] Toast notification error: {e}")
        return False

def check_service_health(url: str, timeout: float = 2.0) -> tuple[bool, dict]:
    """Polls an HTTP health endpoint."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "NakharaX-ToastWatcher/1.0"})
        res = urllib.request.urlopen(req, timeout=timeout)
        resp = res.__enter__() if hasattr(res, "__enter__") else res
        status_code = getattr(resp, "status", getattr(resp, "code", 200))
        if status_code == 200:
            body = resp.read()
            if isinstance(body, bytes):
                body = body.decode("utf-8")
            try:
                data = json.loads(body)
                return True, data
            except Exception:
                return True, {"raw": body}
        return False, {"status_code": status_code}
    except Exception as e:
        return False, {"error": str(e)}

def run_watcher(interval_seconds: int = 30):
    print(f"[*] Starting NakharaX Windows Toast Watcher (Polling every {interval_seconds}s)...")
    hermes_url = "http://127.0.0.1:19119/health"
    last_state = None

    while True:
        is_healthy, info = check_service_health(hermes_url)
        current_state = "UP" if is_healthy else "DOWN"

        if last_state is not None and current_state != last_state:
            if current_state == "DOWN":
                send_toast(
                    "⚠️ NakharaX Hermes Alert",
                    f"Hermes Daemon (19119) is DOWN: {info.get('error', 'Unreachable')}"
                )
            else:
                send_toast(
                    "✅ NakharaX Hermes Restored",
                    f"Hermes Daemon is UP (v{info.get('version', 'unknown')})"
                )

        last_state = current_state
        time.sleep(interval_seconds)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--test-toast":
        send_toast("NakharaX System", "Desktop notification test successful.")
        sys.exit(0)
    run_watcher()
