import type { KeyboardEvent } from "react";
import type { CellAddress, ColumnType } from "../../../types.js";
import type { GridKeyboardParams } from "../types.js";

// === 矢印キー: セル移動・範囲選択 ===
export function handleArrowNavigation<C extends readonly ColumnType[]>(
    e: KeyboardEvent<HTMLDivElement>,
    params: GridKeyboardParams<C>,
): boolean {
    const dirMap: Record<string, CellAddress> = {
        ArrowUp: { row: -1, col: 0 },
        ArrowDown: { row: 1, col: 0 },
        ArrowLeft: { row: 0, col: -1 },
        ArrowRight: { row: 0, col: 1 },
    };
    const dir = dirMap[e.key];
    if (!dir) return false;

    e.preventDefault();

    const {
        setSelection,
        onSelectionChange,
        colOffset,
        minRow,
        maxRow,
        minCol,
        maxCol,
        fullMinCol,
    } = params;

    setSelection((prev) => {
        // 選択がなければ左上から開始
        const current = prev ?? {
            start: { row: minRow, col: minCol },
            end: { row: minRow, col: minCol },
        };

        const clamp = (addr: CellAddress): CellAddress => ({
            row: Math.max(minRow, Math.min(maxRow, addr.row)),
            col: Math.max(minCol, Math.min(maxCol, addr.col)),
        });

        // 列全体選択・行全体選択の検出
        const selMinRow = Math.min(current.start.row, current.end.row);
        const selMaxRow = Math.max(current.start.row, current.end.row);
        const selMinCol = Math.min(current.start.col, current.end.col);
        const selMaxCol = Math.max(current.start.col, current.end.col);
        const isColumnSelection = selMinRow === minRow && selMaxRow === maxRow;
        const isRowSelection = selMinCol === fullMinCol && selMaxCol === maxCol;

        // 列全体選択 + 左右キー: 列選択を移動/拡張
        if (isColumnSelection && dir.col !== 0) {
            if (e.shiftKey) {
                const newEndCol =
                    e.ctrlKey || e.metaKey
                        ? dir.col < 0
                            ? colOffset
                            : maxCol
                        : Math.max(
                              colOffset,
                              Math.min(maxCol, current.end.col + dir.col),
                          );
                const next = {
                    start: current.start,
                    end: { row: maxRow, col: newEndCol },
                };
                onSelectionChange?.(next);
                return next;
            }
            const newCol =
                e.ctrlKey || e.metaKey
                    ? dir.col < 0
                        ? colOffset
                        : maxCol
                    : Math.max(
                          colOffset,
                          Math.min(maxCol, selMinCol + dir.col),
                      );
            const next = {
                start: { row: minRow, col: newCol },
                end: { row: maxRow, col: newCol },
            };
            onSelectionChange?.(next);
            return next;
        }

        // 行全体選択 + 上下キー: 行選択を移動/拡張
        if (isRowSelection && dir.row !== 0) {
            if (e.shiftKey) {
                const newEndRow =
                    e.ctrlKey || e.metaKey
                        ? dir.row < 0
                            ? minRow
                            : maxRow
                        : Math.max(
                              minRow,
                              Math.min(maxRow, current.end.row + dir.row),
                          );
                const next = {
                    start: current.start,
                    end: { row: newEndRow, col: maxCol },
                };
                onSelectionChange?.(next);
                return next;
            }
            const newRow =
                e.ctrlKey || e.metaKey
                    ? dir.row < 0
                        ? minRow
                        : maxRow
                    : Math.max(minRow, Math.min(maxRow, selMinRow + dir.row));
            const next = {
                start: { row: newRow, col: fullMinCol },
                end: { row: newRow, col: maxCol },
            };
            onSelectionChange?.(next);
            return next;
        }

        if (e.shiftKey && (e.ctrlKey || e.metaKey)) {
            // Shift+Ctrl: endを端まで飛ばす
            const newEnd = { ...current.end };
            if (dir.row !== 0) newEnd.row = dir.row < 0 ? minRow : maxRow;
            if (dir.col !== 0) newEnd.col = dir.col < 0 ? minCol : maxCol;
            const next = { start: current.start, end: clamp(newEnd) };
            onSelectionChange?.(next);
            return next;
        }

        if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
            // Ctrl: 端までジャンプ（単一セル選択）
            const newPos = { ...current.end };
            if (dir.row !== 0) newPos.row = dir.row < 0 ? minRow : maxRow;
            if (dir.col !== 0) newPos.col = dir.col < 0 ? minCol : maxCol;
            const clamped = clamp(newPos);
            const next = { start: clamped, end: clamped };
            onSelectionChange?.(next);
            return next;
        }

        if (e.shiftKey) {
            // Shift: endを1セル移動（範囲拡張）
            const newEnd = clamp({
                row: current.end.row + dir.row,
                col: current.end.col + dir.col,
            });
            const next = { start: current.start, end: newEnd };
            onSelectionChange?.(next);
            return next;
        }

        // 矢印のみ: 単一セル移動
        const newPos = clamp({
            row: current.end.row + dir.row,
            col: current.end.col + dir.col,
        });
        const next = { start: newPos, end: newPos };
        onSelectionChange?.(next);
        return next;
    });
    return true;
}
