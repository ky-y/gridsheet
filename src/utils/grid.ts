import type { CSSProperties } from "react";
import type {
    CellAddress,
    CellDataType,
    ColumnType,
    DataType,
} from "../types.js";

/** CellDataType か素の値かを判定し、value / readonly / style を返す */
export function resolveCellData(raw: unknown): {
    value: unknown;
    readonly: boolean;
    style: CSSProperties | undefined;
    className: string | undefined;
} {
    if (
        raw != null &&
        typeof raw === "object" &&
        "value" in raw &&
        !Array.isArray(raw)
    ) {
        const cell = raw as CellDataType;
        return {
            value: cell.value,
            readonly: cell.readonly ?? false,
            style: cell.style,
            className: cell.className,
        };
    }
    return {
        value: raw,
        readonly: false,
        style: undefined,
        className: undefined,
    };
}

// セル値の取得用ヘルパー（型アサーション1箇所に集約）
export function getCellRaw<C extends readonly ColumnType[]>(
    row: DataType<C>,
    key: string,
): unknown {
    return (row as Record<string, unknown>)[key];
}

export function getCellAddress(target: EventTarget): CellAddress | null {
    const el = (target as HTMLElement).closest?.<HTMLElement>("[data-row]");
    if (!el) return null;
    const row = Number(el.dataset.row);
    const col = Number(el.dataset.col);
    if (Number.isNaN(row) || Number.isNaN(col)) return null;
    return { row, col };
}

export function isSelected(
    row: number,
    col: number,
    selection: { start: CellAddress; end: CellAddress } | null,
): boolean {
    if (!selection) return false;
    const minRow = Math.min(selection.start.row, selection.end.row);
    const maxRow = Math.max(selection.start.row, selection.end.row);
    const minCol = Math.min(selection.start.col, selection.end.col);
    const maxCol = Math.max(selection.start.col, selection.end.col);
    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
}
