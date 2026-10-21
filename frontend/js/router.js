// ===========js/router.js=======

import { ROUTES, DEFAULT_ROUTE } from "./constant.js";


/**
 * 把当前 location.hash 解析为路由对象。
 * @returns {{ path: string, config: object, unknown: boolean }}
 */
export function resolverRoute() {
    const raw = window.location.hash.slice(1) || DEFAULT_ROUTE ;
    const path = raw.startsWith("/") ? raw : `/${raw}` ;
    const config = ROUTES[path]; 

    if (!config){
        return{
            path:DEFAULT_ROUTE,
            config:ROUTES[DEFAULT_ROUTE],
            unknown:true
        };
    }

    return {path, config, unknown:false}
}



/**
 * 跳转到指定路由。
 * 仅修改 hash，由 hashchange 触发渲染，保证「前进/后退」行为一致。
 * @param {string} path 形如 "/todolist"
 */
export function navigate(path) {
    const normalized = path.startsWith("/") ? path :`/${path}`;
    const target = `#${normalized}`;
    if(window.location.hash == target)return;
    window.location.hash = target;

}

/**
 * 启动路由。
 * @param {(route: { path: string, config: object }) => void} onRoute
 *        每次路由变化时调用；首次启动会立即调用一次。
 * @returns {() => void} 停止监听
 */

export function startRouter(onRoute){
    const handle = () => {
        let route = resolverRoute();

        // 未知路径回到首页

        if(route.unknown) {
            window.history.replaceState(null, "", `#${DEFAULT_ROUTE}`)
            route = resolverRoute();
        }

        onRoute(route);
    };

    window.addEventListener("hashchange", handle);
    handle();
    return () => window.removeEventListener("hashchange",handle)
}
