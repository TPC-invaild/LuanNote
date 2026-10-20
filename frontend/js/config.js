// ================ js/config.js============

/**
 *  前端全局配置
 * 
 * 当前直接访问 http://127.0.0.1:8001 的后端 /items 接口。
 * 若前端使用不同源的静态服务，后端需允许对应来源的跨域请求。
 */

//基础接口地址
import { ORDER } from "./constant.js";

export const API_BASE = "http://127.0.0.1:8001"

//单次请求超时时间(ms)
export const REQUEST_TIMEOUT=10000

//列表默认排序 
export const DEFAULT_ORDER= ORDER.NEWSET
