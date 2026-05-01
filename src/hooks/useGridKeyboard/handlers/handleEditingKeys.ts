import type { KeyboardEvent } from "react";
import type { ColumnType } from "../../../types.js";
import type { GridKeyboardParams } from "../types.js";

// === 編集モード中のキー処理 ===
// 編集モード（セル内 input/select にフォーカスがある状態）で押されたキーの扱い:
//   - Escape/Enter : 確定して編集モード終了（同セルに留まる）
//   - Tab          : 確定して隣のセルへ移動（Shift で逆方向）
//   - 矢印キー     : 確定して矢印ナビゲーションに処理を引き継ぐ（return false で次へ）
//   - その他       : input 要素自身に処理を任せる（return true で他ハンドラを止める）
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

    // 編集モードでなければこのハンドラは無関係
    if (!editingCell) return false;

    // Escape / Enter: 編集を確定して同じセルに留まる
    if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        setEditingCell(null);
        // input からコンテナへフォーカスを戻し、以降のキー操作をグリッド側で受け取れるようにする
        containerRef.current?.focus();
        return true;
    }

    // Tab: 編集を確定して隣のセルへ。Shift+Tab で逆方向（左）
    if (e.key === "Tab") {
        e.preventDefault();
        setEditingCell(null);
        const tabDir = e.shiftKey ? -1 : 1;
        setSelection((prev) => {
            // 編集中なのに選択が空 (= 不整合) の場合は何もしない
            if (!prev) return null;
            // グリッド端を超えないよう minCol/maxCol でクランプ
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

    // 矢印キー: 編集を確定し、矢印ナビゲーションに処理を委譲する
    // false を返すことで上位の handleKeyDown が次のハンドラを呼ぶ
    if (
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight"
    ) {
        e.preventDefault();
        setEditingCell(null);
        containerRef.current?.focus();
        return false;
    }

    // 上記以外の通常キー: input 要素に入力させたいので true を返してハンドラ連鎖を止める
    return true;
}
