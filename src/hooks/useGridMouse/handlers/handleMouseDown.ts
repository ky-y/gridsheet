import type { MouseEvent } from "react";
import type { ColumnType } from "../../../types.js";
import { getCellRaw, resolveCell } from "../../../utils/grid.js";
import type { GridMouseHandlerParams } from "../types.js";

// === マウスダウン: 選択開始 / 編集モード突入の判定 ===
export function handleMouseDown<C extends readonly ColumnType[]>(
    e: MouseEvent<HTMLDivElement>,
    params: GridMouseHandlerParams<C>,
): void {
    const {
        selection,
        setSelection,
        setEditingCell,
        containerRef,
        onSelectionChange,
        minRow,
        fullMinCol,
        maxRow,
        maxCol,
        data,
        columns,
        colOffset,
        dataRowOffset,
        setIsDragging,
        setDragMode,
    } = params;

    const el = (e.target as HTMLElement).closest?.<HTMLElement>("[data-row]");
    if (!el) return;
    const row = Number(el.dataset.row);
    const col = Number(el.dataset.col);
    if (Number.isNaN(row) || Number.isNaN(col)) return;
    const cellType = el.dataset.type;

    // 編集モードをクリア
    setEditingCell(null);

    if (cellType === "selectAll") {
        // テーブル全選択
        setSelection(() => ({
            start: { row: minRow, col: fullMinCol },
            end: { row: maxRow, col: maxCol },
        }));
        setDragMode("cell");
        setIsDragging(false);
        onSelectionChange?.({
            start: { row: minRow, col: fullMinCol },
            end: { row: maxRow, col: maxCol },
        });
        containerRef.current?.focus();
        return;
    }
    if (cellType === "title") {
        // 列全選択
        setSelection(() => ({
            start: { row: minRow, col },
            end: { row: maxRow, col },
        }));
        setDragMode("column");
    } else if (cellType === "header" || cellType === "footer") {
        // 列全選択（spanがある場合は複数列）
        const span = Number(el.dataset.span) || 1;
        setSelection(() => ({
            start: { row: minRow, col },
            end: { row: maxRow, col: col + span - 1 },
        }));
        setDragMode("column");
    } else if (cellType === "rowNumber") {
        // 行全選択
        setSelection(() => ({
            start: { row, col: fullMinCol },
            end: { row, col: maxCol },
        }));
        setDragMode("row");
    } else {
        // 既にアクティブなセルを再クリック → 編集モードに入る（readonlyでない場合）
        if (
            selection &&
            selection.start.row === row &&
            selection.start.col === col &&
            selection.end.row === row &&
            selection.end.col === col
        ) {
            const colIdx = col - colOffset;
            const dataIdx = row - dataRowOffset;
            if (
                colIdx >= 0 &&
                colIdx < columns.length &&
                dataIdx >= 0 &&
                dataIdx < data.length
            ) {
                const colDef = columns[colIdx]!;
                const raw = getCellRaw(data[dataIdx]!, colDef.key);
                const cellData = resolveCell(raw);
                if (cellData.readonly || colDef.readonly === true) {
                    setIsDragging(false);
                    return;
                }
            }
            setEditingCell({ row, col });
            setIsDragging(false);
            return;
        }
        setSelection(() => ({
            start: { row, col },
            end: { row, col },
        }));
        setDragMode("cell");
    }
    setIsDragging(true);
    containerRef.current?.focus();
}
