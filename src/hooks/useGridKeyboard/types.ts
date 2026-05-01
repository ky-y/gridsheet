import type { RefObject } from "react";
import type {
    CellAddress,
    ColumnType,
    ExtRow,
    HeaderFooterCell,
    Row,
    Selection,
} from "../../types.js";

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
    headers?: HeaderFooterCell[][] | undefined;
    onChange?: ((data: ExtRow<C>[]) => void) | undefined;
    colOffset: number;
    titleRowIndex: number;
    hasTitle: boolean;
    headerRowOffset: number;
    dataRowOffset: number;
    showRowNumbers: boolean;
    minRow: number;
    maxRow: number;
    minCol: number;
    maxCol: number;
    fullMinCol: number;
};
