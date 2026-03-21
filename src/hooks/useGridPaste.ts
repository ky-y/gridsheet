import type React from "react";
import { useCallback, useRef } from "react";
import type { CellAddress, ColumnType, ExtRow, Row } from "../types.js";
import {
    getCellRaw,
    resolveCell,
    toExtData,
    updateCellValue,
} from "../utils/grid.js";

export type GridPasteParams<C extends readonly ColumnType[]> = {
    editingCell: CellAddress | null;
    selection: { start: CellAddress; end: CellAddress } | null;
    onChange?: ((data: ExtRow<C>[]) => void) | undefined;
    data: Row<C>[];
    dataRowOffset: number;
    colOffset: number;
    columns: C;
};

export function useGridPaste<C extends readonly ColumnType[]>(
    params: GridPasteParams<C>,
) {
    const paramsRef = useRef(params);
    paramsRef.current = params;

    const handlePaste = useCallback(
        (e: React.ClipboardEvent<HTMLDivElement>) => {
            const {
                editingCell,
                selection,
                onChange,
                data,
                dataRowOffset,
                colOffset,
                columns,
            } = paramsRef.current;

            if (editingCell) return;
            if (!selection || !onChange) return;

            const text = e.clipboardData.getData("text/plain");
            if (!text) return;
            e.preventDefault();

            const sMinRow = Math.min(selection.start.row, selection.end.row);
            const sMaxRow = Math.max(selection.start.row, selection.end.row);
            const sMinCol = Math.min(selection.start.col, selection.end.col);
            const sMaxCol = Math.max(selection.start.col, selection.end.col);

            const normalized = text.replace(/\r\n?/g, "\n").replace(/\n$/, "");
            const rows = normalized.split("\n").map((line) => line.split("\t"));
            const isSingleValue = rows.length === 1 && rows[0]?.length === 1;
            const isMultiCellSelection =
                sMinRow !== sMaxRow || sMinCol !== sMaxCol;

            /** 貼り付け値を型変換する。型が合わなければ null を返す */
            const applyValue = (
                pasteValue: string,
                col: (typeof columns)[number],
            ): unknown | null => {
                switch (col.type) {
                    case "check": {
                        const lower = pasteValue.toLowerCase();
                        if (
                            lower === "true" ||
                            lower === "false" ||
                            pasteValue === "1" ||
                            pasteValue === "0"
                        )
                            return lower === "true" || pasteValue === "1";
                        return null;
                    }
                    case "number": {
                        if (pasteValue === "") return 0;
                        const n = Number(pasteValue);
                        if (Number.isNaN(n)) return null;
                        return n;
                    }
                    case "select": {
                        if (
                            col.type === "select" &&
                            !col.options.some((o) => o.value === pasteValue)
                        )
                            return null;
                        return pasteValue;
                    }
                    default:
                        return pasteValue;
                }
            };

            const newData = data.map((r, i) => {
                const absoluteRow = dataRowOffset + i;

                if (isSingleValue && isMultiCellSelection) {
                    if (absoluteRow < sMinRow || absoluteRow > sMaxRow)
                        return r;
                    const updated = { ...r } as Record<string, unknown>;
                    let changed = false;
                    for (let tc = sMinCol; tc <= sMaxCol; tc++) {
                        const colIdx = tc - colOffset;
                        if (colIdx < 0 || colIdx >= columns.length) continue;
                        const col = columns[colIdx]!;
                        const raw = getCellRaw(r, col.key);
                        const cell = resolveCell(raw);
                        if (cell.readonly || col.readonly === true) continue;
                        const newValue = applyValue(rows[0]?.[0] ?? "", col);
                        if (newValue === null) continue;
                        updated[col.key] = updateCellValue(raw, newValue);
                        changed = true;
                    }
                    return changed ? (updated as Row<C>) : r;
                }

                const pasteRowIdx = absoluteRow - sMinRow;
                if (pasteRowIdx < 0 || pasteRowIdx >= rows.length) return r;
                // 選択範囲が複数セルなら、その範囲内だけ貼り付ける
                if (isMultiCellSelection && absoluteRow > sMaxRow) return r;
                const pasteRow = rows[pasteRowIdx]!;
                const updated = { ...r } as Record<string, unknown>;
                let changed = false;
                const maxPasteCols = isMultiCellSelection
                    ? Math.min(pasteRow.length, sMaxCol - sMinCol + 1)
                    : pasteRow.length;
                for (let pci = 0; pci < maxPasteCols; pci++) {
                    const targetCol = sMinCol + pci;
                    const colIdx = targetCol - colOffset;
                    if (colIdx < 0 || colIdx >= columns.length) continue;
                    const col = columns[colIdx]!;
                    const raw = getCellRaw(r, col.key);
                    const cell = resolveCell(raw);
                    if (cell.readonly || col.readonly === true) continue;
                    const newValue = applyValue(pasteRow[pci]!, col);
                    if (newValue === null) continue;
                    updated[col.key] = updateCellValue(raw, newValue);
                    changed = true;
                }
                return changed ? (updated as Row<C>) : r;
            });
            onChange(toExtData(newData));
        },
        [],
    );

    return handlePaste;
}
