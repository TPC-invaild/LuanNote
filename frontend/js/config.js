// ================ js/config.js============

/**
 *  前端全局配置
 * 
 * 访问方式采用同源代理：
 *     浏览器访问    /              -> 静态服务器返回frontend/index.html
 *     前端请求接口  /api/items     -> 代理去掉/api前缀，转发到FastAPI / items
 */

//基础接口地址
import { ORDER } from "./constant.js";

export const API_BASE = "http://127.0.0.1:8001"

//单次请求超时时间(ms)
export const REQUEST_TIMEOUT=10000

//列表默认排序 
export const DEFAULT_ORDER= ORDER.NEWSET
