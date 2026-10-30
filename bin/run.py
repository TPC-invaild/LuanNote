"""Start and supervise the local API and static frontend."""
import argparse
import json
import os
from pathlib import Path
import signal
import socket
import subprocess
import sys
import time
from urllib.request import ProxyHandler, build_opener
from urllib.error import URLError
import webbrowser

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description="启动 LuanNote 前后端；Ctrl+C 停止。")
    parser.add_argument("--no-browser", action="store_true", help="不自动打开浏览器")
    args = parser.parse_args()
    children = []

    def stop(signum, frame):
        raise KeyboardInterrupt

    stop_signals = [signal.SIGINT, signal.SIGTERM]
    if hasattr(signal, "SIGHUP"):
        stop_signals.append(signal.SIGHUP)
    for sig in stop_signals:
        signal.signal(sig, stop)
    try:
        for port in (8001, 5501):
            with socket.socket() as sock:
                try:
                    sock.bind(("127.0.0.1", port))
                except OSError as exc:
                    raise RuntimeError(f"端口 {port} 无法使用，请先停止占用该端口的服务：{exc}") from exc

        paths = json.loads((ROOT / "backend/share/dataPath.json").read_text(encoding="utf-8"))["Item"]
        for path in paths.values():
            (ROOT / path).parent.mkdir(parents=True, exist_ok=True)

        commands = [
            [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8001"],
            [sys.executable, "-m", "http.server", "5501", "--bind", "127.0.0.1", "--directory", str(ROOT / "frontend")],
        ]
        process_options = (
            {"creationflags": subprocess.CREATE_NEW_PROCESS_GROUP}
            if os.name == "nt" else {"start_new_session": True}
        )
        for command in commands:
            children.append(subprocess.Popen(command, cwd=ROOT, **process_options))

        opener = build_opener(ProxyHandler({}))
        pending = {"http://127.0.0.1:8001/items", "http://127.0.0.1:5501/"}
        deadline = time.monotonic() + 30
        while pending:
            if any(child.poll() is not None for child in children):
                raise RuntimeError("服务启动失败，请查看上方日志。")
            if time.monotonic() > deadline:
                raise RuntimeError("等待服务启动超时，请查看上方日志。")
            for url in list(pending):
                try:
                    with opener.open(url, timeout=1) as response:
                        if response.status == 200:
                            pending.remove(url)
                except (URLError, TimeoutError, OSError):
                    pass
            time.sleep(0.2)

        print("\nLuanNote 已启动：http://127.0.0.1:5501/\nAPI 文档：http://127.0.0.1:8001/docs\n保持此终端打开，按 Ctrl+C 停止。", flush=True)
        if not args.no_browser:
            try:
                webbrowser.open("http://127.0.0.1:5501/")
            except webbrowser.Error:
                print("浏览器未能打开，请手动访问上方地址。", flush=True)
        while True:
            if any(child.poll() is not None for child in children):
                raise RuntimeError("一个服务意外退出，正在停止另一个服务。")
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\n正在停止 LuanNote……", flush=True)
        return 0
    except (OSError, RuntimeError, ValueError) as exc:
        print(f"启动失败：{exc}", file=sys.stderr)
        return 1
    finally:
        for sig in stop_signals:
            signal.signal(sig, signal.SIG_IGN)
        for child in children:
            if child.poll() is None:
                child.terminate()
        for child in children:
            try:
                child.wait(timeout=5)
            except subprocess.TimeoutExpired:
                child.kill()
                child.wait()


if __name__ == "__main__":
    sys.exit(main())
