import {
    type MouseEvent,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import type { ColumnType } from "../../types.js";
import { handleMouseDown as handleMouseDownAction } from "./handlers/handleMouseDown.js";
import { handleMouseMove as handleMouseMoveAction } from "./handlers/handleMouseMove.js";
import type { DragMode, GridMouseParams } from "./types.js";

export type { GridMouseParams } from "./types.js";

export function useGridMouse<C extends readonly ColumnType[]>(
    params: GridMouseParams<C>,
) {
    const { setSelection } = params;

    const paramsRef = useRef(params);
    paramsRef.current = params;

    const [isDragging, setIsDragging] = useState(false);
    const [dragMode, setDragMode] = useState<DragMode>("cell");

    // ハンドラ内でも常に最新のドラッグ状態を参照できるようref化
    const isDraggingRef = useRef(isDragging);
    isDraggingRef.current = isDragging;
    const dragModeRef = useRef(dragMode);
    dragModeRef.current = dragMode;

    const handleMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
        handleMouseDownAction(e, {
            ...paramsRef.current,
            isDragging: isDraggingRef.current,
            dragMode: dragModeRef.current,
            setIsDragging,
            setDragMode,
        });
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
        handleMouseMoveAction(e, {
            ...paramsRef.current,
            isDragging: isDraggingRef.current,
            dragMode: dragModeRef.current,
            setIsDragging,
            setDragMode,
        });
    }, []);

    useEffect(() => {
        if (!isDragging) return;
        const onWindowMouseUp = () => {
            setIsDragging(false);
            setSelection((current) => {
                if (current) {
                    paramsRef.current.onSelectionChange?.(current);
                }
                return current;
            });
        };
        window.addEventListener("mouseup", onWindowMouseUp);
        return () => window.removeEventListener("mouseup", onWindowMouseUp);
    }, [isDragging, setSelection]);

    return { handleMouseDown, handleMouseMove };
}
