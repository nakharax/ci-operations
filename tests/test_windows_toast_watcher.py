import pytest
from unittest.mock import patch, MagicMock
from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parent.parent / "scripts"))
from windows_toast_watcher import sanitize_toast_message, build_powershell_toast_command, check_service_health

def test_sanitize_toast_message_masks_secrets():
    raw_message = "Failed build with key sk-ant-api03-abcdef123456789 and token eyJhbGciOi"
    sanitized = sanitize_toast_message(raw_message)
    assert "sk-ant" not in sanitized
    assert "eyJhb" not in sanitized
    assert "[REDACTED]" in sanitized

def test_build_powershell_toast_command():
    cmd = build_powershell_toast_command("XpFirm Alert", "All 18 tests passed")
    assert "powershell" in cmd.lower()
    assert "XpFirm Alert" in cmd
    assert "All 18 tests passed" in cmd

def test_build_powershell_toast_command_escapes_single_quotes():
    cmd = build_powershell_toast_command("Hermes Alert", "Can't connect to server's port")
    assert "Can''t connect to server''s port" in cmd


def test_check_service_health_healthy():
    with patch("urllib.request.urlopen") as mock_url:
        mock_resp = MagicMock()
        mock_resp.status = 200
        mock_resp.read.return_value = b'{"status": "ok", "version": "0.23.0"}'
        mock_resp.__enter__.return_value = mock_resp
        mock_url.return_value = mock_resp
        
        status, details = check_service_health("http://127.0.0.1:19119/health")
        assert status is True
        assert details["version"] == "0.23.0"
