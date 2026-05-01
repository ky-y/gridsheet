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

// マウス系イベントを束ねるフック。
// 内部状態としてドラッグ中フラグ(isDragging)とドラッグモード(cell/column/row)を保持し、
// 個別ハンドラに渡す。mouseup はグリッド外でも検知したいので window で受ける。
export function useGridMouse<C extends readonly ColumnType[]>(
    params: GridMouseParams<C>,
) {
    const { setSelection } = params;

    // useCallback の依存を空にしたいため、最新 params を ref 経由で参照する
    const paramsRef = useRef(params);
    paramsRef.current = params;

    const [isDragging, setIsDragging] = useState(false);
    const [dragMode, setDragMode] = useState<DragMode>("cell");

    // 状態の値そのものをハンドラ内のクロージャで読むと古い値を参照してしまうので
    // ref に同期させ、ハンドラからは ref を読む
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

    // ドラッグ中だけ window-level の mouseup を購読する。
    // グリッド外でマウスを離してもドラッグを正しく終了させるため。
    useEffect(() => {
        if (!isDragging) return;
        const onWindowMouseUp = () => {
            setIsDragging(false);
            // ドラッグ確定タイミングで onSelectionChange を発火する
            // （mouseMove ごとに発火するとパフォーマンス面で不利なため、終了時に 1 回）
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
