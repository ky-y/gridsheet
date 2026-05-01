import type { KeyboardEvent } from "react";
import type { ColumnType, Row } from "../../../types.js";
import {
    getCellRaw,
    resolveCell,
    toExtData,
    updateCellValue,
} from "../../../utils/grid.js";
import type { GridKeyboardParams } from "../types.js";

// === Backspace / Delete: セル内容をクリアして編集モードに入る ===
export function handleDelete<C extends readonly ColumnType[]>(
    e: KeyboardEvent<HTMLDivElement>,
    params: GridKeyboardParams<C>,
): boolean {
    if (e.key !== "Backspace" && e.key !== "Delete") return false;

    const {
        selection,
        data,
        columns,
        colOffset,
        dataRowOffset,
        onChange,
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

    if (cellData.readonly || colDef.readonly === true || !onChange)
        return false;

    const emptyValue =
        colDef.type === "check" ? false : colDef.type === "number" ? 0 : "";
    const cellUpdate = updateCellValue(raw, emptyValue);
    const newData = data.map((d, i) =>
        i === r - dataRowOffset
            ? ({ ...d, [colDef.key]: cellUpdate } as Row<C>)
            : d,
    );
    onChange(toExtData(newData));
    setEditingCell({ row: r, col: c });
    e.preventDefault();
    return true;
}
