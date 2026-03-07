import type { DataType, HeaderFooterCell } from "../types.js";
import { createCol } from "../types.js";

export const testColumns = [
    createCol("name", "string", { title: "名前" }),
    createCol("age", "number", { title: "年齢" }),
    createCol("code", "numberString", { title: "コード" }),
    createCol("active", "check", { title: "有効" }),
    createCol("role", "select", {
        title: "役割",
        options: [
            { label: "管理者", value: "admin" },
            { label: "ユーザー", value: "user" },
        ],
    }),
] as const;

export type TestColumns = typeof testColumns;

export const testData: DataType<TestColumns>[] = [
    { name: "Alice", age: 30, code: "0010", active: true, role: "admin" },
    { name: "Bob", age: 25, code: "0020", active: false, role: "user" },
    {
        name: { value: "Charlie", readonly: true, style: { color: "red" }, className: "special" },
        age: 40,
        code: "0030",
        active: true,
        role: "admin",
    },
];

export const testHeaders: HeaderFooterCell[][] = [
    [{ body: "個人情報", span: 2 }, { body: "コード" }, { body: "設定", span: 2 }],
];

export const testFooters: HeaderFooterCell[][] = [
    [{ body: "合計" }, { body: "95" }, { body: "" }, { body: "" }, { body: "" }],
];
