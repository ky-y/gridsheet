import { type MouseEvent, useCallback, useRef, useState } from "react";
import type { CellAddress, Selection } from "../types.js";
import { getCellAddress } from "../utils/grid.js";

export type GridMouseParams = {
    selection: { start: CellAddress; end: CellAddress } | null;
    setSelection: (updater: (prev: { start: CellAddress; end: CellAddress } | null) => { start: CellAddress; end: CellAddress } | null) => void;
    setEditingCell: (cell: CellAddress | null) => void;
    onSelectionChange?: ((selection: Selection) => void) | undefined;
    fullMinRow: number;
    fullMinCol: number;
    maxRow: number;
    maxCol: number;
    colOffset: number;
};

export function useGridMouse(params: GridMouseParams) {
    const { setSelection, setEditingCell } = params;

    const paramsRef = useRef(params);
    paramsRef.current = params;

    const [isDragging, setIsDragging] = useState(false);
    const [dragMode, setDragMode] = useState<"cell" | "column" | "row">(
        "cell",
    );

    const handleMouseDown = useCallback(
        (e: MouseEvent<HTMLDivElement>) => {
            const {
                selection,
                onSelectionChange,
                fullMinRow,
                fullMinCol,
                maxRow,
                maxCol,
            } = paramsRef.current;

            const el = (e.target as HTMLElement).closest?.<HTMLElement>(
                "[data-row]",
            );
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
                    start: { row: fullMinRow, col: fullMinCol },
                    end: { row: maxRow, col: maxCol },
                }));
                setDragMode("cell");
                setIsDragging(false);
                onSelectionChange?.({
                    start: { row: fullMinRow, col: fullMinCol },
                    end: { row: maxRow, col: maxCol },
                });
                return;
            }
            if (cellType === "title") {
                // 列全選択
                setSelection(() => ({
                    start: { row: fullMinRow, col },
                    end: { row: maxRow, col },
                }));
                setDragMode("column");
            } else if (cellType === "header" || cellType === "footer") {
                // 列全選択（spanがある場合は複数列）
                const span = Number(el.dataset.span) || 1;
                setSelection(() => ({
                    start: { row: fullMinRow, col },
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
                // 既にアクティブなセルを再クリック → 編集モードに入る
                if (
                    selection &&
                    selection.start.row === row &&
                    selection.start.col === col &&
                    selection.end.row === row &&
                    selection.end.col === col
                ) {
                    setEditingCell({ row, col });
                    setIsDragging(false);
                    return;
                }
                setSelection(() => ({ start: { row, col }, end: { row, col } }));
                setDragMode("cell");
            }
            setIsDragging(true);
        },
        [setSelection, setEditingCell],
    );

    const handleMouseMove = useCallback(
        (e: MouseEvent<HTMLDivElement>) => {
            if (!isDragging) return;
            const { maxRow, maxCol } = paramsRef.current;

            const el = (e.target as HTMLElement).closest?.<HTMLElement>(
                "[data-row]",
            );
            if (!el) return;
            const addr = getCellAddress(e.target);
            if (!addr) return;
            const span = Number(el.dataset.span) || 1;
            setSelection((prev) => {
                if (!prev) return null;
                if (dragMode === "column") {
                    return {
                        start: prev.start,
                        end: { row: maxRow, col: addr.col + span - 1 },
                    };
                }
                if (dragMode === "row") {
                    return {
                        start: prev.start,
                        end: { row: addr.row, col: maxCol },
                    };
                }
                return { start: prev.start, end: addr };
            });
        },
        [isDragging, dragMode, setSelection],
    );

    const handleMouseUp = useCallback(() => {
        if (!isDragging) return;
        setIsDragging(false);
        setSelection((current) => {
            if (current) {
                paramsRef.current.onSelectionChange?.(current);
            }
            return current;
        });
    }, [isDragging, setSelection]);

    return { handleMouseDown, handleMouseMove, handleMouseUp };
}
