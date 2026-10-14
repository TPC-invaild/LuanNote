// frontend/js/api/http.js
// 通用请求层：拼 URL、序列化、超时、取消、统一错误。

import { API_BASE, REQUEST_TIMEOUT } from "../config.js";


/** 统一的接口错误：status、message、fieldErrors 三项，供界面直接使用 */
export class ApiError extends Error {
  constructor(message, { status = 0, fieldErrors = null, cause = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors; // { contact: ["..."], tag: ["..."] } 或 null
    this.cause = cause;
  }
}

/** 主动取消（切页、取消旧请求）不算失败，调用方应忽略 */
export class CanceledError extends Error {
  constructor() {
    super("请求已取消");
    this.name = "CanceledError";
  }
}

export function isCanceled(error) {
  return error instanceof CanceledError || error?.name === "CanceledError";
}

/* ---------------- 内部工具 ---------------- */

function buildUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  const base = API_BASE.replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

/** 把外部 signal 与超时 signal 合并：任一 abort，整体 abort */
function combineSignals(signals) {
  const controller = new AbortController();
  const detach = [];

  for (const source of signals) {
    if (!source) continue;
    if (source.aborted) {
      controller.abort(source.reason);
      break;
    }
    const onAbort = () => controller.abort(source.reason);
    source.addEventListener("abort", onAbort);
    detach.push(() => source.removeEventListener("abort", onAbort));
  }

  return {
    signal: controller.signal,
    cleanup: () => detach.forEach((fn) => fn()),
  };
}

const STATUS_FALLBACK = {
  400: "请求无效",
  401: "没有访问权限",
  403: "没有访问权限",
  404: "资源不存在",
  405: "请求方法不被允许",
  409: "数据冲突，请刷新后重试",
  422: "请求校验失败",
  500: "服务器内部错误",
  502: "服务暂时不可用",
  503: "服务暂时不可用",
};

/** 从失败响应里提取可读信息。FastAPI 的 422 detail 是数组，其余多为字符串 */
async function readErrorDetail(response) {
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // 正文为空或不是 JSON，交给下面的兜底
  }

  const detail = payload?.detail;

  if (Array.isArray(detail)) {
    const fieldErrors = {};
    const messages = [];

    for (const entry of detail) {
      const loc = Array.isArray(entry?.loc) ? entry.loc : [];
      const field =
        loc.filter((part) => part !== "body" && part !== "query" && part !== "path").join(".") ||
        "_";
      const msg = entry?.msg || "取值无效";

      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(msg);
      messages.push(field === "_" ? msg : `${field}：${msg}`);
    }

    return {
      message: messages.join("；") || "请求校验失败",
      fieldErrors,
    };
  }

  if (typeof detail === "string" && detail.trim()) {
    return { message: detail.trim(), fieldErrors: null };
  }

  return { message: "", fieldErrors: null };
}

/* ---------------- 对外主函数 ---------------- */

/**
 * 发起请求。
 * @param {"GET"|"POST"|"PATCH"|"DELETE"} method
 * @param {string} path              以 / 开头，或完整 URL
 * @param {object} [options]
 * @param {object} [options.body]    有值时自动 JSON 序列化并带 Content-Type
 * @param {AbortSignal} [options.signal] 调用方主动取消
 * @param {number} [options.timeout] 毫秒，默认 15000
 * @returns {Promise<any>} 204 或空正文返回 null，否则返回解析后的 JSON
 */
export async function request(method, path, { body, signal, timeout = REQUEST_TIMEOUT } = {}) {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(
    () => timeoutController.abort(new DOMException("timeout", "TimeoutError")),
    timeout
  );

  const { signal: combined, cleanup } = combineSignals([signal, timeoutController.signal]);

  let response;
  try {
    response = await fetch(buildUrl(path), {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: combined,
    });
  } catch (error) {
    // 外部取消优先：切页导致的取消不应该显示错误
    if (signal?.aborted) throw new CanceledError();
    if (timeoutController.signal.aborted) {
      throw new ApiError("请求超时，请检查网络后重试", { status: 0, cause: error });
    }
    throw new ApiError("网络错误，请检查连接后重试", { status: 0, cause: error });
  } finally {
    clearTimeout(timeoutId);
    cleanup();
  }

  // 删除成功：无正文，直接返回，不解析 JSON
  if (response.status === 204) return null;

  if (!response.ok) {
    const { message, fieldErrors } = await readErrorDetail(response);
    throw new ApiError(
      message || STATUS_FALLBACK[response.status] || `请求失败（${response.status}）`,
      { status: response.status, fieldErrors }
    );
  }

  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new ApiError("服务器返回了无法解析的数据", {
      status: response.status,
      cause: error,
    });
  }
}