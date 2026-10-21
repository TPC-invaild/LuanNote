/*--------js/pages/itemsPage.js----------- */
// 列表页 ： TODOLIST / IMAGINATION / TOTAL 共用同一套模版
// 只负责渲染与收集， 数据来自于itemStore,写入通过回调交给上层。


import { subscribe,load, setFilters,setOrder,refresh,cancelLoad } from "../state/itemStore.js";

import {TAG,TAG_LABELS,STATUS,STATUS_LABELS,ORDER,ORDER_LABELS} from "../constant.js"

/*----------小工具 ------------- */
function el(tag,className,text){
    const node = document.createElement(tag);
    if(className) node.className = className;
    if(text !== undefined ) node.textContent = text;
    
    return node;
}

function option(value ,label){
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;

    return opt;
}

function field (labelText, control){
    const wrap = el("label","filter-field");
    wrap.append(el("span","filter-label",labelText),control);
    return wrap;
}

//后端Time

function formatTime(value){
    if(typeof(value) !== "string" || !value ) return "时间未知";
    const matched = value.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
    return matched? `${matched[1]} ${matched[2]}` : value;
}


/*----------页面---------*/

/**
 * 挂载列表页
 * @param {HTMLElement} container 挂载点
 * @param {object} options
 * @param {string} options.title
 * @param {string|null} options.fixedTag
 * @param {(info:{tag:string}) => void } options.onAdd
 * @param {(ID: number) => void } options.onOpenItem
 * @returns {() => void} 清理函数
 */

export function mountItemsPage(container, options={}){
    const {title = "列表", fixedTag = null, onAdd, onOpenItem} = options;
    const pageTag = fixedTag ?? "";

    container.replaceChildren();

    //骨架
    const root = el("section", "items-page");

    const headers = el("header","items-head");
    const back = document.createElement("a");
    back.href = "#/";
    back.className = "back-link";
    back.textContent = "首页";

    const heading = el("h1", "items-title",title);
    const addButton = el("button", "btn-add", " + 添加笔记");
    addButton.type = "button";
    addButton.dataset.action = "add";
    headers.append(back,heading,addButton,)


    const toolbar = el("div","filter-bar") ; 
    
    let tagSelect = null;
    if(fixedTag === null){
        tagSelect = el("select", "filter-select");
        tagSelect.dataset.filter = "tag";
        tagSelect.append(option("", "全部分类"));
        
        for(const value of Object.values(TAG)){
            tagSelect.append(option(value,TAG_LABELS[value] ??  value));
        }
        toolbar.append(field("分类", tagSelect));
    };

    const statusSelect = el("select","filter-select");
    statusSelect.dataset.filter = "status";
    statusSelect.append(option("", "全部状态"));
    for( const value of Object.values(STATUS)){
        statusSelect.append(option(value,STATUS_LABELS[value] ?? value));
    }

    toolbar.append(field("状态",statusSelect));

    const orderSelect = el("select","filter-select");
    orderSelect.dataset.filter = "order";
    for( const value of Object.values(ORDER)){
        orderSelect.append(option(value,ORDER_LABELS[value] ?? value));
    }

    toolbar.append(field("排序", orderSelect));

    const listEl = el("div","items-list");
    root.append(headers,toolbar,listEl);
    container.append(root);

    /*-----首次加载------- */
    //load的同步部分会立即将 filters 设为页面分类并进入 loading
    // 随后subscribe推送的第一帧就是正确状态，不会闪出上一页的内容
    load( { tag:pageTag, status:"" } );

    //订阅
    const unsubscribe = subscribe(render);

    function render (state) {
        statusSelect.value = state.filters.status;
        if(tagSelect) tagSelect.value = state.filters.tag;
        orderSelect.value = state.order;

        listEl.replaceChildren();

        if(state.loading){
            listEl.append(renderLoading());
            return;
        }

        if(state.error){
            listEl.append(renderError(state.error));
            return;
        }

        if(state.items.length === 0 ){
            listEl.append(renderEmpty(state));
            return;
        }

        const fragment = document.createDocumentFragment();
        for(const item of state.items) fragment.append(renderCard(item));
        listEl.append(fragment);
    }

    function renderLoading(){
        return el("div", "loading-state","加载中...");
    }

    function renderError(error){
        const box = el("div","error-state");
        box.append(el("p","error-message",error?.message || "加载失败，请重试"));
        const retry = el("button","btn-retry","重试");
        retry.type = "button";
        retry.dataset.action = "retry";
        box.append(retry);
        return box;
    }

    function renderEmpty(state){
        const userFilter = 
            state.filters.status !==  "" ||
            (fixedTag === null && state.filters.tag !== "");
        
        return el(
            "p",
            "empty-state",
            userFilter ? "没有符合当前页面的笔记" : "没有笔记"
        )
    }

    function renderCard(item){
        const card = el("article","item-card");
        card.dataset.id = String(item.ID);
        card.tabIndex = 0 ;
        card.setAttribute("role","button");
        card.setAttribute("aria-label", `打开笔记:${item.contact ?? ""}`);

        const meta = el('div',"item-meta");

        if(fixedTag === null) {
            meta.append(el("span","tag-badge",TAG_LABELS[item.tag] ?? item.tag));
        }

        const badge = el(
            "span",
            `status-badge status-${String(item.status).toLocaleLowerCase()}`,
            STATUS_LABELS[item.status] ?? item.status
        );

        const time = document.createElement("time");
        time.className = "item-time";
        time.textContent = formatTime(item.time);
        if(typeof item.time === "string") time.dateTime = item.time;

        meta.append(badge,time);

        const  content = el("p","item-content",item.contact ?? "");

        card.append(meta,content);
        return card;
    }

    //交互

    function currentAddTag(){
        if(fixedTag) return fixedTag;
        return tagSelect?.value ?? "";
    }

    function onClick(event){
        if (!(event.target instanceof Element)) return;
        const actionEl = event.target.closest("[data-action]");
        if( actionEl && root.contains(actionEl) ) {
            const action = actionEl.dataset.action;
            if(action === "add") {
                onAdd?.({tag: currentAddTag()});
                return;
            }
            if(action === "retry") {
                refresh();
                return;
            }
        }

        const card = event.target.closest(".item-card[data-id]");
        if(card && root.contains(card)){
            onOpenItem?.(Number(card.dataset.id));
        }
    }

    function onKeydown(event){
        if (!(event.target instanceof Element)) return;
        if(event.key !== "Enter" && event.key !== " ") return;
        const card = event.target.closest(".item-card[data-id]");

        if(card && event.target === card) {
            event.preventDefault();
            onOpenItem?.(Number(card.dataset.id));
        }
    }

    function onChange(event){
        const select = event.target;
        const filter = select?.dataset?.filter;

        if(!filter){
            return;
        }

        if(filter === "status") setFilters({status:select.value});
        else if(filter === "tag") setFilters({tag:select.value});
        else if(filter === "order") setOrder(select.value);
    }

    root.addEventListener("click",onClick);
    root.addEventListener("keydown",onKeydown);
    root.addEventListener("change",onChange);

    /*-----清理------*/

    return () => {
        unsubscribe();
        cancelLoad();
        root.removeEventListener("click",onClick);
        root.removeEventListener("keydown",onKeydown);
        root.removeEventListener("change",onChange);
        container.replaceChildren();
    }
}