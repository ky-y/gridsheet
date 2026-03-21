import { Children, isValidElement, type ReactNode } from "react";

/** ReactNode からプレーンテキストを再帰的に抽出する */
export function extractText(node: ReactNode): string {
    if (node == null || typeof node === "boolean") return "";
    if (typeof node === "string" || typeof node === "number") return String(node);
    if (isValidElement(node))
        return extractText((node.props as { children?: ReactNode }).children);
    if (Array.isArray(node))
        return Children.map(node, extractText)?.join("") ?? "";
    return "";
}
