import type { CSSProperties } from "react";
import type {
    CellAddress,
    CellDataRow,
    CellDataType,
    ColumnType,
    DataType,
} from "../types.js";

/** CellDataType ラッパーかどうかを判定する型ガード */
export function isCellDataType(raw: unknown): raw is CellDataType {
    return (
        raw != null &&
        typeof raw === "object" &&
        !Array.isArray(raw) &&
        Object.getPrototypeOf(raw) === Object.prototype &&
        "value" in raw
    );
}

/** CellDataType か素の値かを判定し、value / readonly / style を返す */
export function resolveCellData(raw: unknown): {
    value: unknown;
    readonly: boolean;
    style: CSSProperties | undefined;
    className: string | undefined;
} {
    if (isCellDataType(raw)) {
        return {
            value: raw.value,
            readonly: raw.readonly ?? false,
            style: raw.style,
            className: raw.className,
        };
    }
    return {
        value: raw,
        readonly: false,
        style: undefined,
        className: undefined,
    };
}

/** CellDataType 構造を保持しつつセル値を更新する */
export function updateCellValue(raw: unknown, newValue: unknown): unknown {
    if (isCellDataType(raw)) {
        return { ...raw, value: newValue };
    }
    return newValue;
}

// セル値の取得用ヘルパー（型アサーション1箇所に集約）
export function getCellRaw<C extends readonly ColumnType[]>(
    row: DataType<C>,
    key: string,
): unknown {
    return (row as Record<string, unknown>)[key];
}

/** CellDataType から値を取り出す */
export function getCellValue<V>(cell: CellDataType<V>): V {
    return cell.value;
}

/** DataType の行を CellDataRow に正規化（全セルを CellDataType でラップ） */
export function normalizeRow<C extends readonly ColumnType[]>(
    row: DataType<C>,
    columns: C,
): CellDataRow<C> {
    const result = {} as Record<string, unknown>;
    for (const col of columns) {
        const raw = getCellRaw(row, col.key);
        if (isCellDataType(raw)) {
            result[col.key] = raw;
        } else {
            result[col.key] = { value: raw };
        }
    }
    return result as CellDataRow<C>;
}

/** DataType[] 全体を CellDataRow[] に正規化 */
export function normalizeData<C extends readonly ColumnType[]>(
    data: DataType<C>[],
    columns: C,
): CellDataRow<C>[] {
    return data.map((row) => normalizeRow(row, columns));
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
