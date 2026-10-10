import type { ReactNode } from "react";
import type {
    ColumnType,
    HeaderCell,
    HeaderRow,
    IndexFormat,
    RowHeaderColumn,
} from "../types.js";
import { cn } from "./cn.js";
import type { GridGeometry } from "./gridGeometry.js";

// 見出し（headers / footers / rowHeaders と、その交差する左上・左下の角）を
// 「グリッド上に配置済みのセル」の配列に変換する。描画・コピーはこの配列だけを見ればよい。
//
//   [corner top   ][headers (top)   ]
//   [rowHeaders   ][data            ]
//   [corner bottom][footers (bottom)]

/** 見出しの領域: top = headers, bottom = footers, side = rowHeaders */
export type HeaderArea = "top" | "bottom" | "side";

export type PlacedHeaderCell = {
    key: string;
    area: HeaderArea;
    /** クリック時の選択挙動: 列選択 / 行選択 / 全選択（角のセル） */
    kind: "columnHeader" | "rowHeader" | "selectAll";
    row: number;
    col: number;
    rowSpan: number;
    colSpan: number;
    body: ReactNode;
    className: string;
    /** インデックス行/列のセルか（行番号風の見た目にする） */
    index: boolean;
    dividerTop: boolean;
    dividerBottom: boolean;
    dividerRight: boolean;
};

/** headers 未指定時は columns[].title があるときだけ title 行を表示する */
export function resolveHeaders(
    headers: HeaderRow[] | undefined,
    columns: readonly ColumnType[],
): HeaderRow[] {
    if (headers) return headers;
    return columns.some((col) => col.title != null) ? [{ type: "title" }] : [];
}

/** 0 始まりの index を表示用の文字列にする（alpha は Z の次が AA になるスプレッドシート方式） */
export function formatIndex(
    index: number,
    format: IndexFormat = "number",
): string {
    if (format === "number") return String(index + 1);
    let n = index + 1;
    let label = "";
    while (n > 0) {
        const rem = (n - 1) % 26;
        label = String.fromCharCode(65 + rem) + label;
        n = Math.floor((n - 1) / 26);
    }
    return format === "lowerAlpha" ? label.toLowerCase() : label;
}

type LineCell = Pick<HeaderCell, "body" | "span" | "rowSpan"> & {
    className?: string | undefined;
};

/** 見出しの 1 行 / 1 列を、種類（title / index / cells）によらずセル配列に揃えたもの */
type ResolvedLine = {
    cells: LineCell[];
    divider: boolean | undefined;
    className: string | undefined;
    index: boolean;
};

// length: 線に沿ったセル数（headers/footers なら列数、rowHeaders ならデータ行数）
function resolveLine(
    def: HeaderRow | RowHeaderColumn,
    columns: readonly ColumnType[],
    length: number,
): ResolvedLine {
    if (Array.isArray(def)) {
        return {
            cells: def,
            divider: undefined,
            className: undefined,
            index: false,
        };
    }
    const { divider, className } = def;
    if ("cells" in def) {
        return { cells: def.cells, divider, className, index: false };
    }
    if (def.type === "index") {
        const cells = Array.from({ length }, (_, i) => ({
            body: formatIndex(i, def.format),
        }));
        return { cells, divider, className, index: true };
    }
    const cells = columns.map((col) => ({
        body: col.title ?? "",
        className: col.titleClassName,
    }));
    return { cells, divider, className, index: false };
}

type Slot = {
    line: number;
    pos: number;
    mainSpan: number;
    crossSpan: number;
    cell: LineCell | undefined;
};

/**
 * 線（行 or 列）ごとのセル列を、結合を考慮して格子に詰める。
 * main = 線に沿った方向、cross = 隣の線へ跨ぐ方向。
 * 前の線から跨いできたセルが占有する位置は飛ばし、セルが足りない位置は空セル（cell: undefined）で埋める。
 */
function placeLines(
    lines: LineCell[][],
    length: number,
    spanOf: (cell: LineCell) => { main: number; cross: number },
): Slot[] {
    const occupied = lines.map(() => new Array<boolean>(length).fill(false));
    const slots: Slot[] = [];
    lines.forEach((cells, line) => {
        let next = 0;
        let pos = 0;
        while (pos < length) {
            if (occupied[line]![pos]) {
                pos++;
                continue;
            }
            const cell = cells[next++];
            const want = cell ? spanOf(cell) : { main: 1, cross: 1 };
            // 結合は格子の端と、既に占有済みの位置の手前で打ち切る
            let mainSpan = 1;
            while (
                mainSpan < want.main &&
                pos + mainSpan < length &&
                !occupied[line]![pos + mainSpan]
            ) {
                mainSpan++;
            }
            const crossSpan = Math.max(
                1,
                Math.min(want.cross, lines.length - line),
            );
            for (let dl = 0; dl < crossSpan; dl++) {
                for (let dp = 0; dp < mainSpan; dp++) {
                    occupied[line + dl]![pos + dp] = true;
                }
            }
            slots.push({ line, pos, mainSpan, crossSpan, cell });
            pos += mainSpan;
        }
    });
    return slots;
}

export type LayoutHeaderCellsParams = {
    columns: readonly ColumnType[];
    dataLength: number;
    headers: readonly HeaderRow[];
    footers: readonly HeaderRow[];
    rowHeaders: readonly RowHeaderColumn[];
};

export function layoutHeaderCells(
    params: LayoutHeaderCellsParams,
    geometry: GridGeometry,
): PlacedHeaderCell[] {
    const { columns, dataLength } = params;
    const { colOffset, dataRowOffset, footerRowOffset } = geometry;

    const top = params.headers.map((def) =>
        resolveLine(def, columns, columns.length),
    );
    const bottom = params.footers.map((def) =>
        resolveLine(def, columns, columns.length),
    );
    const side = params.rowHeaders.map((def) =>
        resolveLine(def, columns, dataLength),
    );

    // 太線は未指定ならデータ領域に接する線だけに引く
    const topDivider = (i: number) => top[i]?.divider ?? i === top.length - 1;
    const bottomDivider = (i: number) => bottom[i]?.divider ?? i === 0;
    const sideDivider = (i: number) =>
        side[i]?.divider ?? i === side.length - 1;

    const cells: PlacedHeaderCell[] = [];

    // 角: rowHeaders と headers/footers が交差する領域。クリックで全選択
    if (colOffset > 0) {
        const corners = [
            { area: "top" as const, row: 0, rowSpan: top.length },
            {
                area: "bottom" as const,
                row: footerRowOffset,
                rowSpan: bottom.length,
            },
        ];
        for (const { area, row, rowSpan } of corners) {
            if (rowSpan === 0) continue;
            cells.push({
                key: `corner-${area}`,
                area,
                kind: "selectAll",
                row,
                col: 0,
                rowSpan,
                colSpan: colOffset,
                body: null,
                className: "",
                index: false,
                dividerTop: area === "bottom" && bottomDivider(0),
                dividerBottom: area === "top" && topDivider(top.length - 1),
                dividerRight: sideDivider(colOffset - 1),
            });
        }
    }

    // headers / footers: 線 = 行、span が線に沿った結合、rowSpan が線を跨ぐ結合
    const rowAreas = [
        { area: "top" as const, lines: top, rowStart: 0 },
        { area: "bottom" as const, lines: bottom, rowStart: footerRowOffset },
    ];
    for (const { area, lines, rowStart } of rowAreas) {
        const slots = placeLines(
            lines.map((line) => line.cells),
            columns.length,
            (cell) => ({ main: cell.span ?? 1, cross: cell.rowSpan ?? 1 }),
        );
        for (const slot of slots) {
            const line = lines[slot.line]!;
            cells.push({
                key: `${area}-${slot.line}-${slot.pos}`,
                area,
                kind: "columnHeader",
                row: rowStart + slot.line,
                col: colOffset + slot.pos,
                rowSpan: slot.crossSpan,
                colSpan: slot.mainSpan,
                body: slot.cell?.body ?? null,
                className: cn(line.className, slot.cell?.className),
                index: line.index,
                // headers はセル下端の行、footers はセル上端の行の divider に従う
                dividerTop: area === "bottom" && bottomDivider(slot.line),
                dividerBottom:
                    area === "top" &&
                    topDivider(slot.line + slot.crossSpan - 1),
                dividerRight: false,
            });
        }
    }

    // rowHeaders: 線 = 列、rowSpan が線に沿った結合、span が線を跨ぐ結合
    const sideSlots = placeLines(
        side.map((line) => line.cells),
        dataLength,
        (cell) => ({ main: cell.rowSpan ?? 1, cross: cell.span ?? 1 }),
    );
    for (const slot of sideSlots) {
        const line = side[slot.line]!;
        cells.push({
            key: `side-${slot.line}-${slot.pos}`,
            area: "side",
            kind: "rowHeader",
            row: dataRowOffset + slot.pos,
            col: slot.line,
            rowSpan: slot.mainSpan,
            colSpan: slot.crossSpan,
            body: slot.cell?.body ?? null,
            className: cn(line.className, slot.cell?.className),
            index: line.index,
            dividerTop: false,
            dividerBottom: false,
            dividerRight: sideDivider(slot.line + slot.crossSpan - 1),
        });
    }

    return cells;
}
