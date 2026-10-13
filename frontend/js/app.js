// ========js/api.js=======
// 应用入口：绑定路由，按路由配置分发到对应页面。

// 本阶段页面内容为占位，用于验证路由与目录结构。

import { startRouter } from "./router";
import { NAV_ITEMS } from "./constant";

const app = document.getElementById("app")

if(!app){
    throw new Error("找不到挂载点#app, 请检查index.html")
}

// -------------------- 主页-----------------------
function renderHome() {
    app.replaceChild();

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
    const {config} = route;
    app.replaceChild();
    
    const wrap = document.createElement("section");
    wrap.className = "item-page";
    wrap.dataset.fixedTag = config.fixedTag ?? "";

    const head = document.createElement("header");
    head.className = "item-head";

    const back = document.createElement("a");
    back.href="#/";
    back.textContent="<- 首页";

    const title = document.createElement("h1");
    title.textContent = config.title;

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "btn-add";
    addButton.textContent = "记录此刻";

    head.append(back,title,addButton);

    const placeholder = document.createElement("p");
    placeholder.className = "placeholder";
    placeholder.textContent = "什么都没有哦.";
    
    wrap.append(head,placeholder);
    app.append(wrap);
}

//------------------路由分发----------------
function render(route) {
    const {config} = route;

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
    const trigger = event.target.closest("[data-action]");
    if(!trigger) return;

    switch (trigger.dataset.action){
        case "add-note":
            app.textContent = "建设中..."
            break;
        default:
            break;
    }
});

startRouter(render)