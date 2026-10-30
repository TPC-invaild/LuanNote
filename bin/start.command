#!/bin/bash
cd -- "$(dirname -- "${BASH_SOURCE[0]}")" || exit 1
./run.sh "$@"
status=$?
if [[ $status -ne 0 ]]; then
    read -r -p "启动失败，请查看上方提示。按回车关闭……"
fi
exit "$status"
