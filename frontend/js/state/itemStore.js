// -------------------js/state/itemStore.js
// 列表层状态： 持有 items / loading / error / filters / order
// 负责请求序号，取消旧请求、排序、并把写入操作与刷新串起来。

import * as itemApi from "../api/items.js"
import { isCanceled  } from "../api/http.js"
import { ORDER } from "../constant.js"


/*------------内部状态-------- */
let state ={
    items: [],
    loading : false,
    error: null,
    filters: {tag: "",status: ""},
    order: ORDER.NEWSET,
    hasLoaded:  false,
}

let requestSeq = 0;
let currentController = null;
const subscribers = new Set();


/*---------------订阅------------------ */

/**
 *  订阅状态变化。订阅时立即推送一次当前状态.
 *  @param {(state:object) => void } listener
 *  @retruns { () => void }取消订阅
 */

export function subscribe( listener ){
    subscribers.add(listener);
    listener(state);
    return () => subscribers.delete(listener);
}

function setState(patch){
    state = {...state, ...patch};
    for (const listener of [...subscribers]) listener(state);
}

/*-------排序------*/

function sortItems(items,order){
    const copy = [...items];
    copy.sort( (a,b) => {
        const ta = typeof a?.time === "string" ? a.time : "";
        const tb = typeof b?.time === "string" ? b.time : "";
        if( ta === tb) return 0;
        const ascending = ta < tb ? -1 : 1;
        return order === ORDER.OLDSET ? ascending : -ascending;
    });
    return copy;
}


/* ------------ 加载 ------------*/
/**
 * 
 * 加载列表
 * 不传入tag / status 时沿用当前filters; 传 "" 表示全部。
 * 失败不抛出，错误写入 state.error，由页面渲染。
 * @param {{ tag?:string, status?:string }} [overrides]
 */
export async function load(overrides = {}){
    if (currentController) currentController.abort();
    currentController = new AbortController();
    const { signal } = currentController;

    const seq = ++requestSeq;

    const nextFilters = {
        tag:overrides.tag !== undefined ? overrides.tag : state.filters.tag;
        status : overrides.status !== undefined ? overrides.status : state.filters.status ;
    }

    setState( {loading:true,error:null,filters:nextFilters} );
    try{
        const raw = await itemApi.list({...nextFilters, signal });

        if (seq !== requestSeq) return;

        setState({
            items: sortItems(raw,state.order),
            loading: false,
            error : null,
            hasLoaded: true,
        });
    } catch(error){
        if(isCanceled(error) || seq !== requestSeq) return;

        setState({
            loading: false,
            error:{
                message: error?.message || "列表加载失败，请重试",
                status: error?.status ?? 0,
            },
            hasLoaded: true,
        });
    }
}


// 用当前filters 重新加载 
export function refresh() {
    return load();
}

//筛选与排序
export function setFilters({ tag, status } = {} ){
    const nextFilters = {
        tag: tag !== undefined ? tag: state.filters.tag,
        status: status !== undefined ? status : state.filters.status,
    };
    return load(nextFilters);
}

export function setOrder(order){
    if(state.order === order ) return;
    setState( {order, items:sortItems(state.items,order)});
}



/**--------------------写入-------------------- */

//写入操作会抛出错误（如422 /404 ），由编辑器或详情捕获
// 写入成功后的刷新失败之写入 state.error， 不影响写入结果的
// 这样界面可以 先提示保存成功， 在单独提示刷新失败

export async function create(payload) {
    const created = await itemApi.create(payload);
    await refresh();
    return created;
}


export async function update(ID, changes) {
    const update = await itemApi.patch(ID, changes);
    await refresh();
    return update;
}

export async function remove(ID) {
    const result = await itemApi.remove(ID);
    await refresh();
    return result;
}

