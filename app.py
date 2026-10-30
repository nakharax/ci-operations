#!/usr/bin/env python3
"""Web server entry point for CI Operations · Runner Console on 0.0.0.0:3000."""
import json
import logging
import os
import signal
import tempfile
import threading
import time
from datetime import datetime, timedelta, timezone
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

import ci_dashboard as dashboard
from desktop_history import load_store

LOGGER = logging.getLogger("ci_operations_web")
HISTORY_WINDOWS = {"24h": 24 * 3600, "7d": 7 * 24 * 3600, "30d": 30 * 24 * 3600, "all": 0}
HISTORY_DB_PATH = Path(tempfile.gettempdir()) / "ci_operations_history.db"
HISTORY_STORE = load_store(HISTORY_DB_PATH, enabled=True)


def _iso(dt):
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def build_demo_state():
    """Generate realistic, time-relative CI telemetry when GITHUB_TOKEN is not configured."""
    now = datetime.now(timezone.utc)
    runners = [
        {
            "name": "prd-linux-x64-01",
            "repo": "nakharax/core-engine",
            "status": "online",
            "busy": True,
            "os": "Linux · x64",
            "labels": ["self-hosted", "linux", "x64", "nvme", "docker"],
        },
        {
            "name": "prd-linux-x64-02",
            "repo": "nakharax/core-engine",
            "status": "online",
            "busy": False,
            "os": "Linux · x64",
            "labels": ["self-hosted", "linux", "x64", "docker"],
        },
        {
            "name": "gpu-cuda-runner-01",
            "repo": "nakharax/ml-inference",
            "status": "online",
            "busy": True,
            "os": "Linux · CUDA 12",
            "labels": ["self-hosted", "linux", "gpu", "a100"],
        },
        {
            "name": "win-build-node-01",
            "repo": "nakharax/desktop-console",
            "status": "online",
            "busy": False,
            "os": "Windows · x64",
            "labels": ["self-hosted", "windows", "x64", "msvc"],
        },
        {
            "name": "win-build-node-02",
            "repo": "nakharax/desktop-console",
            "status": "online",
            "busy": True,
            "os": "Windows · x64",
            "labels": ["self-hosted", "windows", "x64", "inno-setup"],
        },
        {
            "name": "edge-arm64-runner",
            "repo": "nakharax/telemetry-gateway",
            "status": "offline",
            "busy": False,
            "os": "Linux · ARM64",
            "labels": ["self-hosted", "linux", "arm64"],
        },
    ]

    jobs = [
        {
            "repo": "nakharax/core-engine",
            "run_id": 9041,
            "job_id": 1001,
            "workflow": "Core CI Pipeline",
            "branch": "main",
            "pr": 412,
            "sha": "8f3a19c",
            "name": "cargo-test-workspace (ubuntu-24.04)",
            "status": "in_progress",
            "conclusion": None,
            "runner": "prd-linux-x64-01",
            "created": _iso(now - timedelta(minutes=7, seconds=20)),
            "started": _iso(now - timedelta(minutes=6, seconds=45)),
            "completed": None,
            "url": "https://github.com/nakharax/ci-operations/actions",
            "steps": [
                {
                    "number": 1,
                    "name": "Set up job & runner environment",
                    "conclusion": "success",
                    "started": _iso(now - timedelta(minutes=6, seconds=45)),
                    "completed": _iso(now - timedelta(minutes=6, seconds=20)),
                },
                {
                    "number": 2,
                    "name": "Checkout repository & submodules",
                    "conclusion": "success",
                    "started": _iso(now - timedelta(minutes=6, seconds=20)),
                    "completed": _iso(now - timedelta(minutes=5, seconds=40)),
                },
                {
                    "number": 3,
                    "name": "Restore Rust & Cargo registry cache",
                    "conclusion": "success",
                    "started": _iso(now - timedelta(minutes=5, seconds=40)),
                    "completed": _iso(now - timedelta(minutes=4, seconds=30)),
                },
                {
                    "number": 4,
                    "name": "Run integration test suite",
                    "conclusion": "in_progress",
                    "started": _iso(now - timedelta(minutes=4, seconds=30)),
                    "completed": None,
                },
            ],
        },
        {
            "repo": "nakharax/ml-inference",
            "run_id": 9042,
            "job_id": 1002,
            "workflow": "TensorRT Benchmark",
            "branch": "feat/fp8-quantization",
            "pr": 89,
            "sha": "4d92e1b",
            "name": "gpu-latency-validation (a100)",
            "status": "in_progress",
            "conclusion": None,
            "runner": "gpu-cuda-runner-01",
            "created": _iso(now - timedelta(minutes=14)),
            "started": _iso(now - timedelta(minutes=13, seconds=10)),
            "completed": None,
            "url": "https://github.com/nakharax/ci-operations/actions",
            "steps": [
                {
                    "number": 1,
                    "name": "Verify NVIDIA CUDA driver & nvcc",
                    "conclusion": "success",
                    "started": _iso(now - timedelta(minutes=13, seconds=10)),
                    "completed": _iso(now - timedelta(minutes=12, seconds=20)),
                },
                {
                    "number": 2,
                    "name": "Compile custom FP8 kernels",
                    "conclusion": "success",
                    "started": _iso(now - timedelta(minutes=12, seconds=20)),
                    "completed": _iso(now - timedelta(minutes=6, seconds=15)),
                },
                {
                    "number": 3,
                    "name": "Execute throughput & p99 latency suite",
                    "conclusion": "in_progress",
                    "started": _iso(now - timedelta(minutes=6, seconds=15)),
                    "completed": None,
                },
            ],
        },
        {
            "repo": "nakharax/desktop-console",
            "run_id": 9043,
            "job_id": 1003,
            "workflow": "Windows Release Packaging",
            "branch": "release/v1.4",
            "pr": None,
            "sha": "c17b4e2",
            "name": "pyinstaller-bundle-signed",
            "status": "in_progress",
            "conclusion": None,
            "runner": "win-build-node-02",
            "created": _iso(now - timedelta(minutes=4, seconds=15)),
            "started": _iso(now - timedelta(minutes=3, seconds=50)),
            "completed": None,
            "url": "https://github.com/nakharax/ci-operations/actions",
            "steps": [
                {
                    "number": 1,
                    "name": "Checkout source & verify integrity",
                    "conclusion": "success",
                    "started": _iso(now - timedelta(minutes=3, seconds=50)),
                    "completed": _iso(now - timedelta(minutes=3, seconds=10)),
                },
                {
                    "number": 2,
                    "name": "Run unit & frontend test suites",
                    "conclusion": "success",
                    "started": _iso(now - timedelta(minutes=3, seconds=10)),
                    "completed": _iso(now - timedelta(minutes=1, seconds=40)),
                },
                {
                    "number": 3,
                    "name": "Build standalone executable & installer",
                    "conclusion": "in_progress",
                    "started": _iso(now - timedelta(minutes=1, seconds=40)),
                    "completed": None,
                },
            ],
        },
        {
            "repo": "nakharax/core-engine",
            "run_id": 9044,
            "job_id": 1004,
            "workflow": "Security Audit & Fuzzing",
            "branch": "main",
            "pr": 415,
            "sha": "e04a77d",
            "name": "cargo-fuzz-sanitizer",
            "status": "queued",
            "conclusion": None,
            "runner": None,
            "created": _iso(now - timedelta(minutes=3, seconds=42)),
            "started": None,
            "completed": None,
            "url": "https://github.com/nakharax/ci-operations/actions",
            "steps": [],
        },
        {
            "repo": "nakharax/telemetry-gateway",
            "run_id": 9045,
            "job_id": 1005,
            "workflow": "ARM64 Edge Build",
            "branch": "feat/zero-copy-ingest",
            "pr": 64,
            "sha": "7b2190f",
            "name": "cross-compile-aarch64",
            "status": "waiting",
            "conclusion": None,
            "runner": None,
            "created": _iso(now - timedelta(minutes=1, seconds=55)),
            "started": None,
            "completed": None,
            "url": "https://github.com/nakharax/ci-operations/actions",
            "steps": [],
        },
        {
            "repo": "nakharax/core-engine",
            "run_id": 9030,
            "job_id": 981,
            "workflow": "Core CI Pipeline",
            "branch": "main",
            "pr": 410,
            "sha": "19f2b8a",
            "name": "lint-and-format-check",
            "status": "completed",
            "conclusion": "success",
            "runner": "prd-linux-x64-02",
            "created": _iso(now - timedelta(minutes=54)),
            "started": _iso(now - timedelta(minutes=53, seconds=30)),
            "completed": _iso(now - timedelta(minutes=47, seconds=10)),
            "url": "https://github.com/nakharax/ci-operations/actions",
            "steps": [
                {
                    "number": 1,
                    "name": "Checkout repository",
                    "conclusion": "success",
                    "started": _iso(now - timedelta(minutes=53, seconds=30)),
                    "completed": _iso(now - timedelta(minutes=52, seconds=50)),
                },
                {
                    "number": 2,
                    "name": "Run rustfmt & clippy strict checks",
                    "conclusion": "success",
                    "started": _iso(now - timedelta(minutes=52, seconds=50)),
                    "completed": _iso(now - timedelta(minutes=47, seconds=10)),
                },
            ],
        },
        {
            "repo": "nakharax/core-engine",
            "run_id": 9031,
            "job_id": 982,
            "workflow": "Core CI Pipeline",
            "branch": "fix/consensus-timeout",
            "pr": 411,
            "sha": "6a88d4e",
            "name": "distributed-consensus-sim",
            "status": "completed",
            "conclusion": "failure",
            "runner": "prd-linux-x64-01",
            "created": _iso(now - timedelta(minutes=44)),
            "started": _iso(now - timedelta(minutes=43)),
            "completed": _iso(now - timedelta(minutes=34, seconds=20)),
            "url": "https://github.com/nakharax/ci-operations/actions",
            "steps": [
                {
                    "number": 1,
                    "name": "Checkout repository",
                    "conclusion": "success",
                    "started": _iso(now - timedelta(minutes=43)),
                    "completed": _iso(now - timedelta(minutes=42, seconds=15)),
                },
                {
                    "number": 2,
                    "name": "Build test cluster nodes",
                    "conclusion": "success",
                    "started": _iso(now - timedelta(minutes=42, seconds=15)),
                    "completed": _iso(now - timedelta(minutes=37, seconds=40)),
                },
                {
                    "number": 3,
                    "name": "Verify quorum recovery under partition",
                    "conclusion": "failure",
                    "started": _iso(now - timedelta(minutes=37, seconds=40)),
                    "completed": _iso(now - timedelta(minutes=34, seconds=20)),
                },
            ],
        },
        {
            "repo": "nakharax/ml-inference",
            "run_id": 9032,
            "job_id": 983,
            "workflow": "TensorRT Benchmark",
            "branch": "main",
            "pr": 87,
            "sha": "3e55c91",
            "name": "onnx-export-and-verify",
            "status": "completed",
            "conclusion": "success",
            "runner": "gpu-cuda-runner-01",
            "created": _iso(now - timedelta(minutes=39)),
            "started": _iso(now - timedelta(minutes=38)),
            "completed": _iso(now - timedelta(minutes=27, seconds=30)),
            "url": "https://github.com/nakharax/ci-operations/actions",
            "steps": [
                {
                    "number": 1,
                    "name": "Set up CUDA runtime",
                    "conclusion": "success",
                    "started": _iso(now - timedelta(minutes=38)),
                    "completed": _iso(now - timedelta(minutes=36, seconds=20)),
                },
                {
                    "number": 2,
                    "name": "Export model graph to ONNX",
                    "conclusion": "success",
                    "started": _iso(now - timedelta(minutes=36, seconds=20)),
                    "completed": _iso(now - timedelta(minutes=31, seconds=10)),
                },
                {
                    "number": 3,
                    "name": "Validate numerical parity against PyTorch",
                    "conclusion": "success",
                    "started": _iso(now - timedelta(minutes=31, seconds=10)),
                    "completed": _iso(now - timedelta(minutes=27, seconds=30)),
                },
            ],
        },
        {
            "repo": "nakharax/desktop-console",
            "run_id": 9033,
            "job_id": 984,
            "workflow": "Desktop Test Suite",
            "branch": "main",
            "pr": 154,
            "sha": "9c02f18",
            "name": "test-webgl-and-ui (windows-latest)",
            "status": "completed",
            "conclusion": "success",
            "runner": "win-build-node-01",
            "created": _iso(now - timedelta(minutes=31)),
            "started": _iso(now - timedelta(minutes=30, seconds=15)),
            "completed": _iso(now - timedelta(minutes=22, seconds=45)),
            "url": "https://github.com/nakharax/ci-operations/actions",
            "steps": [
                {
                    "number": 1,
                    "name": "Checkout repository",
                    "conclusion": "success",
                    "started": _iso(now - timedelta(minutes=30, seconds=15)),
                    "completed": _iso(now - timedelta(minutes=29, seconds=30)),
                },
                {
                    "number": 2,
                    "name": "Run Python unit tests",
                    "conclusion": "success",
                    "started": _iso(now - timedelta(minutes=29, seconds=30)),
                    "completed": _iso(now - timedelta(minutes=25, seconds=50)),
                },
                {
                    "number": 3,
                    "name": "Run Node.js 3D volume & frontend tests",
                    "conclusion": "success",
                    "started": _iso(now - timedelta(minutes=25, seconds=50)),
                    "completed": _iso(now - timedelta(minutes=22, seconds=45)),
                },
            ],
        },
        {
            "repo": "nakharax/desktop-console",
            "run_id": 9034,
            "job_id": 985,
            "workflow": "Windows Release Packaging",
            "branch": "main",
            "pr": 155,
            "sha": "5b71a3c",
            "name": "inno-setup-installer-check",
            "status": "completed",
            "conclusion": "success",
            "runner": "win-build-node-02",
            "created": _iso(now - timedelta(minutes=21)),
            "started": _iso(now - timedelta(minutes=20, seconds=30)),
            "completed": _iso(now - timedelta(minutes=12, seconds=15)),
            "url": "https://github.com/nakharax/ci-operations/actions",
            "steps": [
                {
                    "number": 1,
                    "name": "Prepare dist bundle",
                    "conclusion": "success",
                    "started": _iso(now - timedelta(minutes=20, seconds=30)),
                    "completed": _iso(now - timedelta(minutes=16, seconds=10)),
                },
                {
                    "number": 2,
                    "name": "Compile Inno Setup script",
                    "conclusion": "success",
                    "started": _iso(now - timedelta(minutes=16, seconds=10)),
                    "completed": _iso(now - timedelta(minutes=12, seconds=15)),
                },
            ],
        },
        {
            "repo": "nakharax/telemetry-gateway",
            "run_id": 9035,
            "job_id": 986,
            "workflow": "ARM64 Edge Build",
            "branch": "main",
            "pr": 62,
            "sha": "2f84d60",
            "name": "e2e-tls-handshake-stress",
            "status": "completed",
            "conclusion": "failure",
            "runner": "prd-linux-x64-02",
            "created": _iso(now - timedelta(minutes=18)),
            "started": _iso(now - timedelta(minutes=17, seconds=20)),
            "completed": _iso(now - timedelta(minutes=9, seconds=40)),
            "url": "https://github.com/nakharax/ci-operations/actions",
            "steps": [
                {
                    "number": 1,
                    "name": "Checkout repository",
                    "conclusion": "success",
                    "started": _iso(now - timedelta(minutes=17, seconds=20)),
                    "completed": _iso(now - timedelta(minutes=16, seconds=40)),
                },
                {
                    "number": 2,
                    "name": "Provision ephemeral mTLS certificates",
                    "conclusion": "success",
                    "started": _iso(now - timedelta(minutes=16, seconds=40)),
                    "completed": _iso(now - timedelta(minutes=14, seconds=10)),
                },
                {
                    "number": 3,
                    "name": "Verify quorum recovery under partition",
                    "conclusion": "failure",
                    "started": _iso(now - timedelta(minutes=14, seconds=10)),
                    "completed": _iso(now - timedelta(minutes=9, seconds=40)),
                },
            ],
        },
        {
            "repo": "nakharax/core-engine",
            "run_id": 9036,
            "job_id": 987,
            "workflow": "Core CI Pipeline",
            "branch": "main",
            "pr": 413,
            "sha": "b4190c2",
            "name": "storage-wal-compaction-bench",
            "status": "completed",
            "conclusion": "success",
            "runner": "prd-linux-x64-02",
            "created": _iso(now - timedelta(minutes=28)),
            "started": _iso(now - timedelta(minutes=27, seconds=10)),
            "completed": _iso(now - timedelta(minutes=19, seconds=20)),
            "url": "https://github.com/nakharax/ci-operations/actions",
            "steps": [
                {
                    "number": 1,
                    "name": "Checkout repository",
                    "conclusion": "success",
                    "started": _iso(now - timedelta(minutes=27, seconds=10)),
                    "completed": _iso(now - timedelta(minutes=26, seconds=30)),
                },
                {
                    "number": 2,
                    "name": "Run WAL compaction throughput suite",
                    "conclusion": "success",
                    "started": _iso(now - timedelta(minutes=26, seconds=30)),
                    "completed": _iso(now - timedelta(minutes=19, seconds=20)),
                },
            ],
        },
        {
            "repo": "nakharax/telemetry-gateway",
            "run_id": 9037,
            "job_id": 988,
            "workflow": "ARM64 Edge Build",
            "branch": "main",
            "pr": 61,
            "sha": "d903e11",
            "name": "grpc-ingest-backpressure-test",
            "status": "completed",
            "conclusion": "success",
            "runner": "edge-arm64-runner",
            "created": _iso(now - timedelta(minutes=49)),
            "started": _iso(now - timedelta(minutes=48, seconds=15)),
            "completed": _iso(now - timedelta(minutes=38, seconds=40)),
            "url": "https://github.com/nakharax/ci-operations/actions",
            "steps": [
                {
                    "number": 1,
                    "name": "Provision test ingest ring",
                    "conclusion": "success",
                    "started": _iso(now - timedelta(minutes=48, seconds=15)),
                    "completed": _iso(now - timedelta(minutes=45, seconds=10)),
                },
                {
                    "number": 2,
                    "name": "Verify zero-drop burst replay",
                    "conclusion": "success",
                    "started": _iso(now - timedelta(minutes=45, seconds=10)),
                    "completed": _iso(now - timedelta(minutes=38, seconds=40)),
                },
            ],
        },
        {
            "repo": "nakharax/ml-inference",
            "run_id": 9028,
            "job_id": 979,
            "workflow": "TensorRT Benchmark",
            "branch": "main",
            "pr": 85,
            "sha": "7c12a08",
            "name": "int4-kv-cache-calibration",
            "status": "completed",
            "conclusion": "cancelled",
            "runner": "gpu-cuda-runner-01",
            "created": _iso(now - timedelta(minutes=56)),
            "started": _iso(now - timedelta(minutes=55, seconds=20)),
            "completed": _iso(now - timedelta(minutes=49, seconds=10)),
            "url": "https://github.com/nakharax/ci-operations/actions",
            "steps": [
                {
                    "number": 1,
                    "name": "Load calibration dataset",
                    "conclusion": "cancelled",
                    "started": _iso(now - timedelta(minutes=55, seconds=20)),
                    "completed": _iso(now - timedelta(minutes=49, seconds=10)),
                },
            ],
        },
    ]

    if HISTORY_STORE is not None:
        try:
            HISTORY_STORE.record(jobs)
            historical_samples = []
            # Seed 24h, 7d, and 30d historical runs so all window selections have rich trend series
            offsets_hours = [2, 4, 6, 9, 12, 15, 18, 22, 36, 48, 72, 96, 120, 148, 192, 260, 340, 480, 600]
            for idx, h in enumerate(offsets_hours):
                dt_end = now - timedelta(hours=h)
                dt_start = dt_end - timedelta(minutes=4 + (idx % 6))
                # Vary success/failure across buckets so the line chart displays a realistic trend
                outcomes = ["success", "success", "success", "failure" if idx % 3 == 0 else "success", "success"]
                for sub_idx, outcome in enumerate(outcomes):
                    historical_samples.append({
                        "repo": "nakharax/core-engine" if sub_idx % 2 == 0 else "nakharax/ml-inference",
                        "run_id": 8000 + idx * 10 + sub_idx,
                        "job_id": 50000 + idx * 10 + sub_idx,
                        "workflow": "Core CI Pipeline" if sub_idx % 2 == 0 else "TensorRT Benchmark",
                        "branch": "main",
                        "pr": 300 + idx,
                        "sha": f"a1b2{idx:02x}{sub_idx}",
                        "name": f"ci-matrix-shard-{sub_idx + 1}",
                        "status": "completed",
                        "conclusion": outcome,
                        "runner": "prd-linux-x64-01" if sub_idx % 2 == 0 else "gpu-cuda-runner-01",
                        "created": _iso(dt_start - timedelta(seconds=20)),
                        "started": _iso(dt_start),
                        "completed": _iso(dt_end),
                        "url": "https://github.com/nakharax/ci-operations/actions",
                        "steps": [
                            {
                                "number": 1,
                                "name": "Verify quorum recovery under partition" if outcome == "failure" else "Execute workflow shard",
                                "conclusion": outcome,
                                "started": _iso(dt_start),
                                "completed": _iso(dt_end),
                            }
                        ],
                    })
            HISTORY_STORE.record(historical_samples)
            with HISTORY_STORE.lock:
                for sample in historical_samples:
                    key = f"{sample['repo']}:{sample['run_id']}:{sample['job_id']}"
                    comp_epoch = (now - timedelta(hours=offsets_hours[(sample['run_id'] - 8000) // 10])).timestamp()
                    HISTORY_STORE.connection.execute(
                        "UPDATE jobs SET recorded_at = ? WHERE key = ?", (comp_epoch, key)
                    )
                HISTORY_STORE.connection.commit()
        except Exception:
            pass

    return {
        "updated": _iso(now),
        "error": None,
        "rate": "4892",
        "poll_interval": 20,
        "version": "1.4.0",
        "latest_version": "1.4.0",
        "runners": runners,
        "jobs": jobs,
    }


def _window_seconds(value):
    return HISTORY_WINDOWS.get(str(value or "").lower(), 0)


class WebConsoleHandler(dashboard.H):
    def do_HEAD(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()

    def do_GET(self):
        route = self.path.split("?", 1)[0]
        if route == "/favicon.ico":
            ico_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app.ico")
            body = open(ico_path, "rb").read() if os.path.exists(ico_path) else b""
            self.send_response(200)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Content-Type", "image/x-icon")
            self.send_header("Cache-Control", "public, max-age=3600")
            self.end_headers()
            self.wfile.write(body)
            return
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
                summary = HISTORY_STORE.summary(since=since) if HISTORY_STORE else {
                    "total": 0, "failed": 0, "successes": 0, "success_rate": None, "workflows": [], "failing_steps": [], "trend": []
                }
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

        if route == "/api/state" and not dashboard.TOKEN and not os.environ.get("STATE_FILE"):
            dashboard.STATE.clear()
            dashboard.STATE.update(build_demo_state())

        super().do_GET()


def main():
    port = int(os.environ.get("PORT", "3000"))
    host = os.environ.get("HOST", "0.0.0.0")
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

    sf = os.environ.get("STATE_FILE")
    if sf:
        with open(sf, encoding="utf-8") as source:
            dashboard.STATE.update(json.load(source))
        dashboard.STATE["snapshot"] = True
    elif dashboard.TOKEN:
        def poll_loop():
            while True:
                try:
                    dashboard.poll_once()
                    if HISTORY_STORE is not None:
                        HISTORY_STORE.record(dashboard.STATE.get("jobs") or [])
                except Exception as exc:
                    dashboard.STATE["error"] = str(exc)
                time.sleep(dashboard.POLL)
        threading.Thread(target=poll_loop, daemon=True).start()
    else:
        dashboard.STATE.clear()
        dashboard.STATE.update(build_demo_state())

    server = ThreadingHTTPServer((host, port), WebConsoleHandler)
    LOGGER.info("CI Operations Console listening on http://%s:%s", host, port)

    def stop(signum, frame):
        threading.Thread(target=server.shutdown, daemon=True).start()

    for sig_name in ("SIGINT", "SIGTERM"):
        if hasattr(signal, sig_name):
            signal.signal(getattr(signal, sig_name), stop)

    try:
        server.serve_forever()
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
