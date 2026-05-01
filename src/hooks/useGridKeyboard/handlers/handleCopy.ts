import type { KeyboardEvent, ReactNode } from "react";
import type { ColumnType } from "../../../types.js";
import { getCellRaw, resolveCell } from "../../../utils/grid.js";
import { extractText } from "../../../utils/reactNode.js";
import type { GridKeyboardParams } from "../types.js";

// === Ctrl+C / Cmd+C: セル選択範囲をコピー ===
export function handleCopy<C extends readonly ColumnType[]>(
    e: KeyboardEvent<HTMLDivElement>,
    params: GridKeyboardParams<C>,
): boolean {
    if (
        !(e.key === "c" && (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey)
    )
        return false;

    // ブラウザのテキスト選択がある場合はデフォルト動作に任せる
    const textSelection = window.getSelection();
    if (textSelection && textSelection.toString().length > 0) return true;

    const {
        selection,
        columns,
        data,
        headers,
        colOffset,
        titleRowIndex,
        hasTitle,
        headerRowOffset,
        dataRowOffset,
        showRowNumbers,
    } = params;

    if (!selection) return true;

    const sMinRow = Math.min(selection.start.row, selection.end.row);
    const sMaxRow = Math.max(selection.start.row, selection.end.row);
    const sMinCol = Math.min(selection.start.col, selection.end.col);
    const sMaxCol = Math.max(selection.start.col, selection.end.col);

    // ヘッダー行のrowSpan/colSpanを解決して、各セル位置に対応するbodyを格納
    // headerResolved[rowIndex][colIndex] = body (ReactNode | undefined)
    const headerResolved: (ReactNode | undefined)[][] = [];
    if (headers) {
        const totalCols = columns.length;
        const occupied: boolean[][] = headers.map(() =>
            new Array(totalCols).fill(false),
        );
        for (let ri = 0; ri < headers.length; ri++) {
            const resolved: (ReactNode | undefined)[] = new Array(
                totalCols,
            ).fill(undefined);
            headerResolved.push(resolved);
            const row = headers[ri]!;
            let colIndex = 0;
            let cellIndex = 0;
            while (colIndex < totalCols && cellIndex < row.length) {
                if (occupied[ri]![colIndex]) {
                    colIndex++;
                    continue;
                }
                const cell = row[cellIndex]!;
                const colSpan = cell.span ?? 1;
                const rowSpan = cell.rowSpan ?? 1;
                // このセルが占有する全位置にbodyを設定
                for (
                    let dr = 0;
                    dr < rowSpan && ri + dr < headers.length;
                    dr++
                ) {
                    for (
                        let dc = 0;
                        dc < colSpan && colIndex + dc < totalCols;
                        dc++
                    ) {
                        if (dr === 0 && dc === 0) {
                            resolved[colIndex + dc] = cell.body;
                        } else if (dr > 0) {
                            occupied[ri + dr]![colIndex + dc] = true;
                            if (!headerResolved[ri + dr]) {
                                headerResolved[ri + dr] = new Array(
                                    totalCols,
                                ).fill(undefined);
                            }
                            headerResolved[ri + dr]![colIndex + dc] = cell.body;
                        } else {
                            resolved[colIndex + dc] = cell.body;
                        }
                    }
                }
                colIndex += colSpan;
                cellIndex++;
            }
        }
    }

    const lines: string[] = [];
    for (let r = sMinRow; r <= sMaxRow; r++) {
        const cells: string[] = [];
        for (let c = sMinCol; c <= sMaxCol; c++) {
            // 行番号列
            if (showRowNumbers && c === 0) {
                if (r >= dataRowOffset && r < dataRowOffset + data.length) {
                    cells.push(String(r - dataRowOffset + 1));
                } else {
                    cells.push("");
                }
                continue;
            }
            const colIdx = c - colOffset;
            if (r === titleRowIndex && hasTitle) {
                // タイトル行
                if (colIdx >= 0 && colIdx < columns.length) {
                    cells.push(extractText(columns[colIdx]?.title));
                } else {
                    cells.push("");
                }
            } else if (
                headerRowOffset >= 0 &&
                r >= headerRowOffset &&
                r < dataRowOffset &&
                headers
            ) {
                // ヘッダー行（headerResolvedを参照）
                const ri = r - headerRowOffset;
                const resolved = headerResolved[ri];
                if (resolved && colIdx >= 0 && colIdx < columns.length) {
                    cells.push(extractText(resolved[colIdx]));
                } else {
                    cells.push("");
                }
            } else if (r >= dataRowOffset && r < dataRowOffset + data.length) {
                // データ行
                const dataRow = data[r - dataRowOffset];
                if (colIdx >= 0 && colIdx < columns.length && dataRow) {
                    const col = columns[colIdx]!;
                    const raw = getCellRaw(dataRow, col.key);
                    const cell = resolveCell(raw);
                    const v = cell.value;
                    if (typeof v === "boolean") {
                        cells.push(v ? "TRUE" : "FALSE");
                    } else {
                        cells.push(v != null ? String(v) : "");
                    }
                } else {
                    cells.push("");
                }
            } else {
                cells.push("");
            }
        }
        lines.push(cells.join("\t"));
    }
    const text = lines.join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
    e.preventDefault();
    return true;
}
