import type React from "react";
import { useCallback, useRef } from "react";
import type { ColumnType } from "../../types.js";
import { handlePaste as handlePasteAction } from "./handlers/handlePaste.js";
import type { GridPasteParams } from "./types.js";

export type { GridPasteParams } from "./types.js";

// グリッドの onPaste を提供するフック。
// 実装本体は handlePasteAction に委譲し、ここではハンドラの参照安定化のみ担う。
export function useGridPaste<C extends readonly ColumnType[]>(
    params: GridPasteParams<C>,
) {
    // 毎レンダーで params が変わっても useCallback の参照を安定させるため ref 化
    const paramsRef = useRef(params);
    paramsRef.current = params;

    const handlePaste = useCallback(
        (e: React.ClipboardEvent<HTMLDivElement>) => {
            handlePasteAction(e, paramsRef.current);
        },
        [],
    );

    return handlePaste;
}
