import type { KeyboardEvent } from "react";
import type { ColumnType } from "../../../types.js";
import { getCellRaw, resolveCell } from "../../../utils/grid.js";
import type { GridKeyboardParams } from "../types.js";

// === Enter / F2: 編集モードに入る（値は維持） ===
export function handleEnterEdit<C extends readonly ColumnType[]>(
    e: KeyboardEvent<HTMLDivElement>,
    params: GridKeyboardParams<C>,
): boolean {
    if (e.key !== "Enter" && e.key !== "F2") return false;

    const {
        selection,
        data,
        columns,
        colOffset,
        dataRowOffset,
        setEditingCell,
    } = params;

    if (
        !selection ||
        selection.start.row !== selection.end.row ||
        selection.start.col !== selection.end.col
    )
        return false;

    const r = selection.start.row;
    const c = selection.start.col;
    if (r < dataRowOffset || r >= dataRowOffset + data.length) return false;

    const colIdx = c - colOffset;
    if (colIdx < 0 || colIdx >= columns.length) return false;

    const colDef = columns[colIdx]!;
    const dataRow = data[r - dataRowOffset]!;
    const raw = getCellRaw(dataRow, colDef.key);
    const cellData = resolveCell(raw);
    if (cellData.readonly || colDef.readonly === true) return false;

    setEditingCell({ row: r, col: c });
    e.preventDefault();
    return true;
}
