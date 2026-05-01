import type React from "react";
import { useCallback, useRef } from "react";
import type { ColumnType } from "../../types.js";
import { handlePaste as handlePasteAction } from "./handlers/handlePaste.js";
import type { GridPasteParams } from "./types.js";

export type { GridPasteParams } from "./types.js";

export function useGridPaste<C extends readonly ColumnType[]>(
    params: GridPasteParams<C>,
) {
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
