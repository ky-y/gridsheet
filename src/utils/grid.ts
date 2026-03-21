import type { CSSProperties } from "react";
import type {
    CellAddress,
    ColumnType,
    ExtCell,
    ExtRow,
    PlainRow,
    Row,
} from "../types.js";

/** ExtCell ラッパーかどうかを判定する型ガード */
export function isExtCell(raw: unknown): raw is ExtCell {
    return (
        raw != null &&
        typeof raw === "object" &&
        !Array.isArray(raw) &&
        Object.getPrototypeOf(raw) === Object.prototype &&
        "value" in raw
    );
}

/** ExtCell か素の値かを判定し、value / readonly / style を返す */
export function resolveCell(raw: unknown): {
    value: unknown;
    readonly: boolean;
    style: CSSProperties | undefined;
    className: string | undefined;
} {
    if (isExtCell(raw)) {
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

/** ExtCell 構造を保持しつつセル値を更新する */
export function updateCellValue(raw: unknown, newValue: unknown): unknown {
    if (isExtCell(raw)) {
        return { ...raw, value: newValue };
    }
    return newValue;
}

// セル値の取得用ヘルパー（型アサーション1箇所に集約）
export function getCellRaw<C extends readonly ColumnType[]>(
    row: Row<C>,
    key: string,
): unknown {
    return (row as Record<string, unknown>)[key];
}

/** ExtCell から値を取り出す */
export function getCellValue<V>(cell: ExtCell<V>): V {
    return cell.value;
}

/** Row を ExtRow に正規化（全セルを ExtCell でラップ） */
export function toExtRow<C extends readonly ColumnType[]>(
    row: Row<C>,
    columns: C,
): ExtRow<C> {
    const result = {} as Record<string, unknown>;
    for (const col of columns) {
        const raw = getCellRaw(row, col.key);
        if (isExtCell(raw)) {
            result[col.key] = raw;
        } else {
            result[col.key] = { value: raw };
        }
    }
    return result as ExtRow<C>;
}

/** ExtRow を素の値のみの行に変換 */
export function toPlainRow<C extends readonly ColumnType[]>(
    row: ExtRow<C>,
    columns: C,
): PlainRow<C> {
    const result = {} as Record<string, unknown>;
    for (const col of columns) {
        const cell = (row as Record<string, ExtCell>)[col.key]!;
        result[col.key] = cell.value;
    }
    return result as PlainRow<C>;
}

/** ExtRow[] 全体を素の値のみの配列に変換 */
export function toPlainData<C extends readonly ColumnType[]>(
    data: ExtRow<C>[],
    columns: C,
): PlainRow<C>[] {
    return data.map((row) => toPlainRow(row, columns));
}

/** Row[] 全体を ExtRow[] に正規化 */
export function toExtData<C extends readonly ColumnType[]>(
    data: Row<C>[],
    columns: C,
): ExtRow<C>[] {
    return data.map((row) => toExtRow(row, columns));
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
