import type { CellAddress, ColumnType, ExtRow, Row } from "../../types.js";

export type GridPasteParams<C extends readonly ColumnType[]> = {
    editingCell: CellAddress | null;
    selection: { start: CellAddress; end: CellAddress } | null;
    onChange?: ((data: ExtRow<C>[]) => void) | undefined;
    data: Row<C>[];
    dataRowOffset: number;
    colOffset: number;
    columns: C;
};
