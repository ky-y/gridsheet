import type { KeyboardEvent } from "react";
import type { ColumnType } from "../../../types.js";
import type { GridKeyboardParams } from "../types.js";

// === 編集モード中のキー処理 ===
export function handleEditingKeys<C extends readonly ColumnType[]>(
    e: KeyboardEvent<HTMLDivElement>,
    params: GridKeyboardParams<C>,
): boolean {
    const {
        editingCell,
        setEditingCell,
        containerRef,
        setSelection,
        onSelectionChange,
        minCol,
        maxCol,
    } = params;

    if (!editingCell) return false;

    if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        setEditingCell(null);
        containerRef.current?.focus();
        return true;
    }

    if (e.key === "Tab") {
        e.preventDefault();
        setEditingCell(null);
        const tabDir = e.shiftKey ? -1 : 1;
        setSelection((prev) => {
            if (!prev) return null;
            const newCol = Math.max(
                minCol,
                Math.min(maxCol, prev.start.col + tabDir),
            );
            const next = {
                start: { row: prev.start.row, col: newCol },
                end: { row: prev.start.row, col: newCol },
            };
            onSelectionChange?.(next);
            return next;
        });
        containerRef.current?.focus();
        return true;
    }

    // 矢印キー: 編集終了して隣のセルへ移動（以降の矢印キー処理に落とす）
    if (
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight"
    ) {
        e.preventDefault();
        setEditingCell(null);
        containerRef.current?.focus();
        return false; // 矢印キー処理を続行
    }

    // 編集中はinputにキー処理を委譲
    return true;
}
