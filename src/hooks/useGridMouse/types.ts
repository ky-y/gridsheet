import type React from "react";
import type { CellAddress, ColumnType, Row, Selection } from "../../types.js";

export type DragMode = "cell" | "column" | "row";

export type GridMouseParams<C extends readonly ColumnType[] = ColumnType[]> = {
    selection: { start: CellAddress; end: CellAddress } | null;
    setSelection: (
        updater: (
            prev: { start: CellAddress; end: CellAddress } | null,
        ) => { start: CellAddress; end: CellAddress } | null,
    ) => void;
    setEditingCell: (cell: CellAddress | null) => void;
    containerRef: React.RefObject<HTMLDivElement | null>;
    onSelectionChange?: ((selection: Selection) => void) | undefined;
    minRow: number;
    fullMinCol: number;
    maxRow: number;
    maxCol: number;
    data: Row<C>[];
    columns: C;
    colOffset: number;
    dataRowOffset: number;
};

// 内部ドラッグ状態を含むハンドラ用パラメータ
export type GridMouseHandlerParams<C extends readonly ColumnType[]> =
    GridMouseParams<C> & {
        isDragging: boolean;
        dragMode: DragMode;
        setIsDragging: (v: boolean) => void;
        setDragMode: (v: DragMode) => void;
    };
