#!/bin/bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

if [[ -n "${VIRTUAL_ENV:-}" && -x "$VIRTUAL_ENV/bin/python" ]]; then
    python_bin="$VIRTUAL_ENV/bin/python"
    echo "使用已激活的 Python 环境：$VIRTUAL_ENV"
else
    if [[ ! -x .venv/bin/python ]]; then
        python_bin="${PYTHON:-}"
        if [[ -z "$python_bin" ]]; then
            for candidate in python3.14 python3.13 python3.12 python3.11 python3.10 /opt/homebrew/bin/python3 /usr/local/bin/python3 /Library/Frameworks/Python.framework/Versions/Current/bin/python3 python3; do
                if command -v "$candidate" >/dev/null 2>&1 && "$candidate" -c 'import sys; sys.exit(sys.version_info < (3, 10))' 2>/dev/null; then
                    python_bin="$candidate"
                    break
                fi
            done
        fi
        if [[ -z "$python_bin" ]] || ! "$python_bin" -c 'import sys; sys.exit(sys.version_info < (3, 10))'; then
            echo "请安装 Python 3.10+（https://www.python.org/downloads/macos/），或通过 PYTHON=/路径/python3 指定。" >&2
            exit 1
        fi
        echo "正在创建项目 Python 环境……"
        "$python_bin" -m venv .venv
    fi
    python_bin="$PWD/.venv/bin/python"
fi
"$python_bin" -c 'import sys; sys.exit(sys.version_info < (3, 10))' || {
    echo "需要 Python 3.10 或更新版本。" >&2
    exit 1
}
if ! "$python_bin" -c 'import fastapi, pydantic, uvicorn
from importlib.metadata import version
for name, lower, upper in [("fastapi", (0, 115), (1,)), ("pydantic", (2, 9), (3,)), ("uvicorn", (0, 30), (1,))]:
    value = tuple(int(v) for v in version(name).split(".")[:2])
    assert lower <= value < upper' 2>/dev/null; then
    echo "正在安装项目依赖（需要联网）……"
    "$python_bin" -m pip install -r requirements.txt
fi
exec "$python_bin" scripts/run.py "$@"
