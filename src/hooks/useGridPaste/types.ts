import type { CellAddress, ColumnType, ExtRow, Row } from "../../types.js";
import type { GridGeometry } from "../../utils/gridGeometry.js";

export type GridPasteParams<C extends readonly ColumnType[]> = {
    editingCell: CellAddress | null;
    selection: { start: CellAddress; end: CellAddress } | null;
    onChange?: ((data: ExtRow<C>[]) => void) | undefined;
    data: Row<C>[];
    columns: C;
    geometry: GridGeometry;
};
