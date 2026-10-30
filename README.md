# LuanNote

本地笔记与待办应用：原生 HTML/CSS/JavaScript 前端、FastAPI 后端，数据保存在 `database/item.json`，写入时备份到 `database/item.json.bak`。

## 一键运行

需要 Python 3.10 或更新版本，无需 Node.js。缺少依赖时脚本会通过 pip 安装，需要联网。

**macOS：双击 `bin/start.command`。**

**Windows：双击 `bin/start.bat`。** 首次运行前安装 Python 3.10+，安装时启用 Python Launcher 或勾选 Add Python to PATH。

也可以在终端执行：

```bash
./bin/run.sh
```

脚本优先使用当前已激活的虚拟环境；否则自动查找 Python，在项目中创建并复用 `.venv`。支持 Apple Silicon 和 Intel Mac 的常见 Homebrew、python.org 安装路径，也可使用 `PYTHON=/路径/python3 ./bin/run.sh` 指定创建环境所用的 Python。

随后检查依赖、准备数据目录、启动前后端，待服务就绪后打开浏览器。可从任意目录通过脚本的完整路径启动。将项目复制到其他电脑 时不要复制 `.venv`，让目标机器重新创建。若文件复制后丢失执行权限，执行 `chmod +x bin/run.sh bin/start.command`。

本机使用已有环境进行测试：

```bash
source ~/python3H/bin/activate
./bin/run.sh --no-browser
```

- 页面：http://127.0.0.1:5501/
- API 文档：http://127.0.0.1:8001/docs
- 停止：在运行终端按 `Ctrl+C`，两个服务会一同关闭。

不打开浏览器：macOS 执行 `./bin/run.sh --no-browser`；Windows 执行 `bin\start.bat --no-browser`。Windows 优先使用已激活的虚拟环境，否则通过 `py -3` 或 `python` 创建 `.venv`；也可先用 `set "PYTHON=C:\路径\python.exe"` 指定解释器。

端口与前端 API 地址及后端 CORS 配置一致；端口被占用时会报错，请先关闭已有服务再重试。首次没有数据文件时从空列表开始，保存笔记后自动生成文件。

## 项目结构

- `frontend/`：页面、样式、路由与 API 请求。
- `backend/main.py`：FastAPI 入口。
- `backend/routers/`：笔记增删改查接口。
- `backend/Store/`：JSON 文件存储及内存缓存。
- `backend/Models/`：数据模型。
- `backend/share/dataPath.json`：数据文件路径配置。
- `bin/`：macOS、Windows 启动入口。
- `bin/run.py`：服务启动、就绪检查和退出清理。
