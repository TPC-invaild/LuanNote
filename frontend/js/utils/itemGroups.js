import { STATUS } from "../constant.js";

export const GROUP_LABELS = { day: "日", week: "周", month: "月", year: "年" };

const dateKey = date => `${String(date.getUTCFullYear()).padStart(4, "0")}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;

// 按记录中的日历日期分组，不将无时区的后端时间转换到其他时区。
function period(value, mode) {
    const match = typeof value === "string" && value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ]|$)/);
    if (!match) return { key: "unknown", label: "时间未知" };
    const day = `${match[1]}-${match[2]}-${match[3]}`;
    const date = new Date(`${day}T00:00:00Z`);
    if (!Number.isFinite(date.getTime()) || dateKey(date) !== day) {
        return { key: "unknown", label: "时间未知" };
    }
    if (mode === "year") return { key: match[1], label: `${match[1]}年` };
    if (mode === "month") return { key: day.slice(0, 7), label: `${match[1]}年${match[2]}月` };
    if (mode === "week") {
        date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
        const start = dateKey(date);
        date.setUTCDate(date.getUTCDate() + 6);
        return { key: start, label: `${start} ～ ${dateKey(date)}` };
    }
    return { key: day, label: day };
}

// 保留 store 已确定的时间排序，组内事项也沿用原顺序。
export function groupItems(items, mode) {
    const groups = new Map();
    for (const item of items) {
        const { key, label } = period(item.time, mode);
        if (!groups.has(key)) groups.set(key, { key, label, items: [], completed: 0 });
        const group = groups.get(key);
        group.items.push(item);
        if (item.status === STATUS.DONE) group.completed++;
    }
    const unknown = groups.get("unknown");
    groups.delete("unknown");
    return [...groups.values(), ...(unknown ? [unknown] : [])];
}
