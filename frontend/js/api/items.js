// frontend/js/api/items.js
// 条目 API：只做「前端参数 → 后端请求」的映射，不含状态、不碰 DOM。

import { request, ApiError } from "./http.js";

/**
 * 查询列表。
 * 不传 tag / status 表示「全部」，对应省略查询参数。
 * @param {{ tag?: string, status?: string, signal?: AbortSignal }} [options]
 * @returns {Promise<Array>} Item 数组，后端按 time 升序
 */
export function list({ tag, status, signal } = {}) {
  const params = new URLSearchParams();
  if (tag) params.set("tag", tag);
  if (status) params.set("status", status);

  const query = params.toString();
  return request("GET", query ? `/items?${query}` : "/items", { signal });
}

/**
 * 按 ID 查询单条。
 * @param {number} ID
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<object>}
 */
export function get(ID, { signal } = {}) {
  return request("GET", `/items/${ID}`, { signal });
}

/**
 * 创建条目。
 * 不发送 ID 与 time；status 省略时由后端填 CREATE。
 * @param {{ contact: string, tag: string, status?: string }} payload
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<object>} 新建的 Item
 */
export function create({ contact, tag, status } = {}, { signal } = {}) {
  const body = { contact, tag };
  if (status !== undefined && status !== null) body.status = status;
  return request("POST", "/items", { body, signal });
}

/**
 * 局部更新。
 * 只发送实际变化的 contact / tag / status；拒绝 ID、time、null。
 * 空变更不请求，直接抛出 400 语义的错误，避免无意义往返。
 * @param {number} ID
 * @param {{ contact?: string, tag?: string, status?: string }} changes
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<object>} 更新后的 Item
 */
export function patch(ID, changes = {}, { signal } = {}) {
  const body = {};

  for (const [key, value] of Object.entries(changes)) {
    if (key !== "contact" && key !== "tag" && key !== "status") continue;
    if (value === undefined || value === null) continue;
    body[key] = value;
  }

  if (Object.keys(body).length === 0) {
    return Promise.reject(
      new ApiError("没有可保存的修改", { status: 400, fieldErrors: null })
    );
  }

  return request("PATCH", `/items/${ID}`, { body, signal });
}

/**
 * 删除条目。
 * @param {number} ID
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<null>} 204，无正文
 */
export function remove(ID, { signal } = {}) {
  return request("DELETE", `/items/${ID}`, { signal });
}