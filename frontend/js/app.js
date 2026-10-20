// ========js/app.js=======
// 应用入口：绑定路由，按路由配置分发到对应页面。

// 列表页已接入数据；编辑器和详情仍为占位。

import { startRouter } from "./router.js";
import { NAV_ITEMS } from "./constant.js";
import { mountItemsPage } from "./pages/itemsPage.js";

const app = document.getElementById("app")
let cleanupCurrentPage = null;

if(!app){
    throw new Error("找不到挂载点#app, 请检查index.html")
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
    onAdd: ({ tag }) => {
      // 下一阶段：打开 itemEditor，传入预选分类
      console.log("[TODO] 打开编辑器，预选分类:", tag);
    },
    onOpenItem: (ID) => {
      // 下一阶段：打开 itemDetail
      console.log("[TODO] 打开详情:", ID);
    },
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


// --------------全局委托-------------

app.addEventListener("click",(event) => {
    if (!(event.target instanceof Element)) return;
    const trigger = event.target.closest("[data-action]");
    if(!trigger) return;

    switch (trigger.dataset.action){
        case "add-note":
            window.alert("记录功能建设中...");
            break;
        default:
            break;
    }
});

startRouter(render)
