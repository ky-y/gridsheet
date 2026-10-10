import type { RefObject } from "react";
import type {
    CellAddress,
    ColumnType,
    ExtRow,
    Row,
    Selection,
} from "../../types.js";
import type { GridGeometry } from "../../utils/gridGeometry.js";
import type { PlacedHeaderCell } from "../../utils/headerLayout.js";

export type GridKeyboardParams<C extends readonly ColumnType[]> = {
    editingCell: CellAddress | null;
    setEditingCell: (cell: CellAddress | null) => void;
    containerRef: RefObject<HTMLDivElement | null>;
    selection: { start: CellAddress; end: CellAddress } | null;
    setSelection: (
        updater: (
            prev: { start: CellAddress; end: CellAddress } | null,
        ) => { start: CellAddress; end: CellAddress } | null,
    ) => void;
    onSelectionChange?: ((selection: Selection) => void) | undefined;
    columns: C;
    data: Row<C>[];
    /** 配置済みの見出しセル（コピー時に見出しのテキストを引くのに使う） */
    headerCells: PlacedHeaderCell[];
    onChange?: ((data: ExtRow<C>[]) => void) | undefined;
    geometry: GridGeometry;
};
