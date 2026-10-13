//===================js/constant.js==========
//集中存放枚举、文案、路由表。页面组件只从这里取值

//Tag enum
export const TAG=Object.freeze({
    TODOLIST:"TODOLIST",
    IMAGINATION:"IMAGINATION"
});

//Status enum
export const STATUS=Object.freeze({
    CREATE:"CREATE",
    RUNNING:"RUNNING",
    DONE:"DONE",
    CANCEL:"CANCEL",
    FAILED:"FAILED"
});

//Tag界面文案
export const TAG_LABELS=Object.freeze({
    [TAG.TODOLIST]:"待办",
    [TAG.IMAGINATION]: "想法"
});

//状态的界面文案
export const STATUS_LABELS=Object.freeze({
    [STATUS.CREATE]:"待开始",
    [STATUS.RUNNING]: "进行中",
    [STATUS.DONE]: "已完成",
    [STATUS.CANCEL]: "已取消",
    [STATUS.FAILED]: "已失败"
});

//筛选
export const TAG_ALL = "";
export const STATUS_ALL = "";

//排序方式
export const ORDER=Object.freeze({
    NEWSET:"newset",
    OLDSET:"oldset"
});

export const ORDER_LABELS=Object.freeze({
    [ORDER.NEWSET]: "最新优先",
    [ORDER.OLDSET]: "最早优先"
});

//默认主页
export const DEFAULT_ROUTE = "/";

/**页面路由表
 * page     - 使用哪个页面模版
 * title    - 浏览标题与页面标题
 * fixedTag - 该页面的固定分类
 */

export const ROUTES = Object.freeze({
    "/" : {
        page: "home",
        title: "首页",
        fixedTag: null
    },
    "/todolist" : {
        page : "items",
        title : "TODOLIST",
        fixedTag : TAG.TODOLIST
    },
    "/imagination" : {
        page : "items",
        title : "IMAGINATION",
        fixedTag : TAG.IMAGINATION
    },
    "/total" : {
        page : "items",
        title : "TOTAL",
        fixedTag : null
    }
});

// 主页上的三个导航入口
export const NAV_ITEMS = Object.freeze([
    {path: "/todolist", label: "TODOLIST"},
    {path: "/imagination", label: "IMAGINATION"},
    {path: "/total", label: "TOTAL"}
])
