import type { KeyboardEvent } from "react";
import type { ColumnType, Row } from "../../../types.js";
import {
    getCellRaw,
    resolveCell,
    toExtData,
    updateCellValue,
} from "../../../utils/grid.js";
import type { GridKeyboardParams } from "../types.js";

// === 文字キー: 編集モードに入り値を置換 ===
export function handleCharInput<C extends readonly ColumnType[]>(
    e: KeyboardEvent<HTMLDivElement>,
    params: GridKeyboardParams<C>,
): boolean {
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey) return false;

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

    if (cellData.readonly || colDef.readonly === true) return false;

    if (
        onChange &&
        (colDef.type === "string" || colDef.type === "numberString")
    ) {
        const cellUpdate = updateCellValue(raw, e.key);
        const newData = data.map((d, i) =>
            i === r - dataRowOffset
                ? ({ ...d, [colDef.key]: cellUpdate } as Row<C>)
                : d,
        );
        onChange(toExtData(newData));
    } else if (onChange && colDef.type === "number" && /\d/.test(e.key)) {
        const cellUpdate = updateCellValue(raw, Number(e.key));
        const newData = data.map((d, i) =>
            i === r - dataRowOffset
                ? ({ ...d, [colDef.key]: cellUpdate } as Row<C>)
                : d,
        );
        onChange(toExtData(newData));
    }
    setEditingCell({ row: r, col: c });
    e.preventDefault();
    return true;
}
