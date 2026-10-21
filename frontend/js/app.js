// ========js/app.js=======
// 应用入口：绑定路由，按路由配置分发到对应页面。

// 列表页已接入数据，支持新建与编辑笔记。

import { startRouter } from "./router.js";
import { NAV_ITEMS } from "./constant.js";
import { mountItemsPage } from "./pages/itemsPage.js";
import { openItemEditor } from "./components/itemEditor.js";
import { toast} from "./components/toast.js";
import {getState} from "./state/itemStore.js"

const app = document.getElementById("app")

if(!app){
    throw new Error("找不到挂载点#app, 请检查index.html")
}
let cleanupCurrentPage = null;


/*---------编辑器入口------------ */

function openCreateEditor(initialTag = ""){
    openItemEditor({
        mode:"create",
        initialTag,
        onSaved: () => toast("已添加",{type: "success"}),
    });
}

function openEditEditor(ID){
    const item = getState().items.find((i) => i.ID === ID);
    if(!item){
        toast("我想你可能失忆了",{type: "error"});
        return;
    }
    openItemEditor({
        mode:"edit",
        item,
        onSaved:(_save,meta) =>{
            if(meta?.unchanged) return;
            toast("已保存",{type:"success"});
        }
    });
}

// -------------------- 主页-----------------------
function renderHome() {
    app.replaceChildren();

    const wrap = document.createElement("div")
    wrap.className = "home";

    const title = document.createElement("h1")
    title.textContent = "LuanNote 当然是乱记啦";

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "hero-button";
    addButton.textContent = "想什么呢？"
    addButton.dataset.action = "add-note";
    
    const nav = document.createElement("nav");
    nav.className = "main-nav";
    for (const { path, label } of NAV_ITEMS ) {
        const link = document.createElement("a");
        link.href = `#${path}`;
        link.textContent = label ; 
        nav.append(link);
    };

    wrap.append(title,addButton,nav);
    app.append(wrap);

}


// -------------------列表页-----------------
function renderItemsPage(route) {
  const { config } = route;

  cleanupCurrentPage = mountItemsPage(app, {
    title: config.title,
    fixedTag: config.fixedTag,
    onAdd: ({ tag }) => openCreateEditor(tag),
    onOpenItem: (ID) => openEditEditor(ID),
  });
}
//------------------路由分发----------------
function render(route) {
    const { config } = route;

    // 先清理上一页：取消订阅、解绑事件、取消列表请求
    if (cleanupCurrentPage) {
        cleanupCurrentPage();
        cleanupCurrentPage = null;
    }
    document.title = `LuanNote · ${config.title}` ; 
    window.scrollTo(0,0);

    switch (config.page) {
        case "home":
            renderHome();
            break;
        case "items":
            renderItemsPage(route);
            break;
        default:
            app.textContent = "你迷路啦！"
    }
}


/* ---------------- 全局事件 ---------------- */

app.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const trigger = event.target.closest("[data-action]");
  if (!trigger) return;
  // 列表页的「添加」由 itemsPage 自己处理，这里只接主页入口
  if (trigger.dataset.action === "add-note") {
    openCreateEditor("");
  }
});

/* ---------------- 启动 ---------------- */

startRouter(render);
