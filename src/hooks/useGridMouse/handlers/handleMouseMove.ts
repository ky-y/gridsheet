import type { MouseEvent } from "react";
import type { ColumnType } from "../../../types.js";
import { getCellAddress } from "../../../utils/grid.js";
import type { GridMouseHandlerParams } from "../types.js";

// === マウスムーブ: ドラッグ中の選択範囲を更新 ===
export function handleMouseMove<C extends readonly ColumnType[]>(
    e: MouseEvent<HTMLDivElement>,
    params: GridMouseHandlerParams<C>,
): void {
    const { isDragging, dragMode, maxRow, maxCol, setSelection } = params;

    if (!isDragging) return;

    const el = (e.target as HTMLElement).closest?.<HTMLElement>("[data-row]");
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
}
