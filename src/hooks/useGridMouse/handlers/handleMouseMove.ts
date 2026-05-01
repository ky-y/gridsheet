import type { MouseEvent } from "react";
import type { ColumnType } from "../../../types.js";
import { getCellAddress } from "../../../utils/grid.js";
import type { GridMouseHandlerParams } from "../types.js";

// === マウスムーブ: ドラッグ中の選択範囲を更新 ===
// dragMode により end を「列方向のみ / 行方向のみ / セル単位」のどれで拡張するかが変わる
export function handleMouseMove<C extends readonly ColumnType[]>(
    e: MouseEvent<HTMLDivElement>,
    params: GridMouseHandlerParams<C>,
): void {
    const { isDragging, dragMode, maxRow, maxCol, setSelection } = params;

    // mouseDown でドラッグ開始されていなければ何もしない
    if (!isDragging) return;

    // ホバー位置のセル要素を取得。セル外なら更新しない（境界をまたぐ瞬間など）
    const el = (e.target as HTMLElement).closest?.<HTMLElement>("[data-row]");
    if (!el) return;
    const addr = getCellAddress(e.target);
    if (!addr) return;
    // colSpan を考慮（ヘッダー上をドラッグした際、span 分先まで含めて選択する）
    const span = Number(el.dataset.span) || 1;
    setSelection((prev) => {
        // selection は mouseDown で必ず設定されている前提だが、念のため null ガード
        if (!prev) return null;
        if (dragMode === "column") {
            // 列ドラッグ: 行方向は常に最下端まで埋め、列方向のみ拡張
            return {
                start: prev.start,
                end: { row: maxRow, col: addr.col + span - 1 },
            };
        }
        if (dragMode === "row") {
            // 行ドラッグ: 列方向は最右端まで埋め、行方向のみ拡張
            return {
                start: prev.start,
                end: { row: addr.row, col: maxCol },
            };
        }
        // 通常セルドラッグ: 端点をホバー先のセルに合わせる（矩形選択）
        return { start: prev.start, end: addr };
    });
}
