import type {
    ColumnType,
    ColumnWidth,
    GridSheetConfigs,
    HeaderRow,
    RowHeaderColumn,
} from "../types.js";

// 行/列のオフセット・選択範囲の境界など、columns/data/見出しから派生する座標情報。
// 各 hook と GridSheet 本体で共有する。
//
//   row: [headers...][data rows...][footers...]
//   col: [rowHeaders...][columns...]
//
// 論理座標（0 始まり）をそのまま CSS grid の位置（1 始まり）に +1 して使う。
export type GridGeometry = {
    /** rowHeaders の列数 = データ列の先頭 col */
    colOffset: number;
    /** headers の行数 = データ行の先頭 row */
    dataRowOffset: number;
    /** フッター行の先頭 row */
    footerRowOffset: number;
    /** 選択可能領域の最上行 */
    minRow: number;
    /** 選択可能領域の最下行 */
    maxRow: number;
    /** 矢印キー移動の最左列（selectableRowHeaders 設定を反映） */
    minCol: number;
    /** 選択可能領域の最右列 */
    maxCol: number;
    /** 「行全体選択」時の左端列（rowHeaders も含める） */
    fullMinCol: number;
    /** CSS grid-template-columns 文字列 */
    gridTemplateColumns: string;
};

export type ComputeGridGeometryParams = {
    columns: readonly ColumnType[];
    dataLength: number;
    headers: readonly HeaderRow[];
    footers: readonly HeaderRow[];
    rowHeaders: readonly RowHeaderColumn[];
    configs?: GridSheetConfigs | undefined;
};

// 列幅指定: 数値は fr 単位（比率）、文字列はそのまま（"100px" 等）、未指定は fallback
function toGridTrack(width: ColumnWidth | undefined, fallback: string) {
    if (typeof width === "number") return `${width}fr`;
    return width ?? fallback;
}

function rowHeaderTrack(def: RowHeaderColumn) {
    if (Array.isArray(def)) return "auto";
    // インデックス列は数字が収まる程度の固定幅を既定にする
    return toGridTrack(def.width, "type" in def ? "3rem" : "auto");
}

export function computeGridGeometry(
    params: ComputeGridGeometryParams,
): GridGeometry {
    const { columns, dataLength, headers, footers, rowHeaders, configs } =
        params;

    const colOffset = rowHeaders.length;
    const dataRowOffset = headers.length;
    const footerRowOffset = dataRowOffset + dataLength;

    return {
        colOffset,
        dataRowOffset,
        footerRowOffset,
        minRow: 0,
        maxRow: footerRowOffset + footers.length - 1,
        minCol: configs?.selectableRowHeaders === true ? 0 : colOffset,
        maxCol: colOffset + columns.length - 1,
        fullMinCol: 0,
        gridTemplateColumns: [
            ...rowHeaders.map(rowHeaderTrack),
            ...columns.map((col) => toGridTrack(col.width, "auto")),
        ].join(" "),
    };
}
