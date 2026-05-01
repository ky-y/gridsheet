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

export function useGridKeyboard<C extends readonly ColumnType[]>(
    params: GridKeyboardParams<C>,
) {
    const paramsRef = useRef(params);
    paramsRef.current = params;

    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
        const p = paramsRef.current;

        if (handleEditingKeys(e, p)) return;
        if (handleCopy(e, p)) return;
        if (handleDelete(e, p)) return;
        if (handleEnterEdit(e, p)) return;
        if (handleCharInput(e, p)) return;
        handleArrowNavigation(e, p);
    }, []);

    return handleKeyDown;
}
