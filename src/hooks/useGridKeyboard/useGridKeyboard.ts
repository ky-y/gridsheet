import { type KeyboardEvent, useCallback, useRef } from "react";
import type { ColumnType } from "../../types.js";
import { handleArrowNavigation } from "./handlers/handleArrowNavigation.js";
import { handleCharInput } from "./handlers/handleCharInput.js";
import { handleCopy } from "./handlers/handleCopy.js";
import { handleDelete } from "./handlers/handleDelete.js";
import { handleEditingKeys } from "./handlers/handleEditingKeys.js";
import { handleEnterEdit } from "./handlers/handleEnterEdit.js";
import type { GridKeyboardParams } from "./types.js";

export type { GridKeyboardParams } from "./types.js";

// グリッドの onKeyDown を一本化するためのフック。
// 内部で分割された個別ハンドラを「true を返したら処理済み（停止）」のチェーンとして順に呼び出す。
// 順序は意図的: 編集モード中の特殊キー → コピー → 削除 → 編集突入 → 文字入力 → 矢印移動。
export function useGridKeyboard<C extends readonly ColumnType[]>(
    params: GridKeyboardParams<C>,
) {
    // params は毎レンダー変わりうるが、useCallback の依存配列を空にして
    // ハンドラ自体の参照は安定させたいので ref 経由で最新値を引く
    const paramsRef = useRef(params);
    paramsRef.current = params;

    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
        const p = paramsRef.current;

        // 編集中のキー: Escape/Enter/Tab/矢印 など編集モード固有の処理
        if (handleEditingKeys(e, p)) return;
        // Ctrl+C / Cmd+C
        if (handleCopy(e, p)) return;
        // Backspace / Delete（単一セル選択時のみ）
        if (handleDelete(e, p)) return;
        // Enter / F2（編集モード突入）
        if (handleEnterEdit(e, p)) return;
        // 通常文字キーによる上書き入力 → 編集モード突入
        if (handleCharInput(e, p)) return;
        // 矢印キー: 上記いずれにも該当しなかった場合のフォールバック
        handleArrowNavigation(e, p);
    }, []);

    return handleKeyDown;
}
