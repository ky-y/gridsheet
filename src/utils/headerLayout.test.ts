import { describe, expect, it } from "vitest";
import { testColumns } from "../test/fixtures.js";
import type { HeaderRow, RowHeaderColumn } from "../types.js";
import { computeGridGeometry } from "./gridGeometry.js";
import {
    formatIndex,
    layoutHeaderCells,
    type PlacedHeaderCell,
    resolveHeaders,
} from "./headerLayout.js";

function layout(params: {
    headers?: HeaderRow[];
    footers?: HeaderRow[];
    rowHeaders?: RowHeaderColumn[];
    dataLength?: number;
}) {
    const full = {
        columns: testColumns,
        dataLength: params.dataLength ?? 3,
        headers: params.headers ?? [],
        footers: params.footers ?? [],
        rowHeaders: params.rowHeaders ?? [],
    };
    return layoutHeaderCells(full, computeGridGeometry(full));
}

// テストで見やすいよう、位置・結合・本文だけを抜き出す
const pick = ({ row, col, rowSpan, colSpan, body }: PlacedHeaderCell) => ({
    row,
    col,
    rowSpan,
    colSpan,
    body,
});

describe("formatIndex", () => {
    it("formats numbers starting from 1", () => {
        expect(formatIndex(0)).toBe("1");
        expect(formatIndex(9, "number")).toBe("10");
    });

    it("formats alphabets in spreadsheet style", () => {
        expect(formatIndex(0, "upperAlpha")).toBe("A");
        expect(formatIndex(25, "upperAlpha")).toBe("Z");
        expect(formatIndex(26, "upperAlpha")).toBe("AA");
        expect(formatIndex(27, "lowerAlpha")).toBe("ab");
        expect(formatIndex(701, "upperAlpha")).toBe("ZZ");
        expect(formatIndex(702, "upperAlpha")).toBe("AAA");
    });
});

describe("resolveHeaders", () => {
    it("defaults to a title row when any column has a title", () => {
        expect(resolveHeaders(undefined, testColumns)).toEqual([
            { type: "title" },
        ]);
    });

    it("defaults to no header rows when no column has a title", () => {
        expect(
            resolveHeaders(undefined, [{ key: "a", type: "string" }]),
        ).toEqual([]);
    });

    it("uses given headers as-is", () => {
        const headers: HeaderRow[] = [{ type: "index" }];
        expect(resolveHeaders(headers, testColumns)).toBe(headers);
    });
});

describe("layoutHeaderCells", () => {
    it("places title cells from columns", () => {
        const cells = layout({ headers: [{ type: "title" }] });
        expect(cells.map((c) => c.body)).toEqual([
            "名前",
            "年齢",
            "コード",
            "有効",
            "役割",
        ]);
        expect(cells.every((c) => c.kind === "columnHeader")).toBe(true);
    });

    it("places index cells for headers and rowHeaders", () => {
        const cells = layout({
            headers: [{ type: "index", format: "lowerAlpha" }],
            rowHeaders: [{ type: "index" }],
        });
        const top = cells.filter((c) => c.area === "top" && !c.index);
        const topIndex = cells.filter((c) => c.area === "top" && c.index);
        const side = cells.filter((c) => c.area === "side");
        // top には角（全選択）が 1 つ含まれる
        expect(top.map((c) => c.kind)).toEqual(["selectAll"]);
        expect(topIndex.map((c) => c.body)).toEqual(["a", "b", "c", "d", "e"]);
        expect(side.map((c) => c.body)).toEqual(["1", "2", "3"]);
        expect(side.map((c) => c.row)).toEqual([1, 2, 3]);
        expect(side.every((c) => c.kind === "rowHeader")).toBe(true);
    });

    it("resolves span and rowSpan, skipping occupied positions", () => {
        const cells = layout({
            headers: [
                [
                    { body: "Name", rowSpan: 2 },
                    { body: "Detail", span: 4 },
                ],
                [{ body: "A" }, { body: "B" }, { body: "C" }, { body: "D" }],
            ],
        });
        expect(cells.map(pick)).toEqual([
            { row: 0, col: 0, rowSpan: 2, colSpan: 1, body: "Name" },
            { row: 0, col: 1, rowSpan: 1, colSpan: 4, body: "Detail" },
            { row: 1, col: 1, rowSpan: 1, colSpan: 1, body: "A" },
            { row: 1, col: 2, rowSpan: 1, colSpan: 1, body: "B" },
            { row: 1, col: 3, rowSpan: 1, colSpan: 1, body: "C" },
            { row: 1, col: 4, rowSpan: 1, colSpan: 1, body: "D" },
        ]);
    });

    it("fills missing cells and clamps spans to the grid", () => {
        const cells = layout({
            headers: [[{ body: "Wide", span: 10, rowSpan: 5 }]],
            footers: [[{ body: "Total" }]],
        });
        expect(cells.map(pick)).toEqual([
            { row: 0, col: 0, rowSpan: 1, colSpan: 5, body: "Wide" },
            { row: 4, col: 0, rowSpan: 1, colSpan: 1, body: "Total" },
            { row: 4, col: 1, rowSpan: 1, colSpan: 1, body: null },
            { row: 4, col: 2, rowSpan: 1, colSpan: 1, body: null },
            { row: 4, col: 3, rowSpan: 1, colSpan: 1, body: null },
            { row: 4, col: 4, rowSpan: 1, colSpan: 1, body: null },
        ]);
    });

    it("merges rowHeaders vertically with rowSpan", () => {
        const cells = layout({
            dataLength: 5,
            rowHeaders: [
                [
                    { body: "Team A", rowSpan: 3 },
                    { body: "Team B", rowSpan: 2 },
                ],
            ],
        });
        expect(cells.map(pick)).toEqual([
            { row: 0, col: 0, rowSpan: 3, colSpan: 1, body: "Team A" },
            { row: 3, col: 0, rowSpan: 2, colSpan: 1, body: "Team B" },
        ]);
    });

    it("places corners where rowHeaders meet headers and footers", () => {
        const cells = layout({
            headers: [{ type: "title" }, { type: "index" }],
            footers: [[{ body: "Total" }]],
            rowHeaders: [{ type: "index" }, [{ body: "x" }]],
        });
        const corners = cells.filter((c) => c.kind === "selectAll");
        expect(corners.map(pick)).toEqual([
            { row: 0, col: 0, rowSpan: 2, colSpan: 2, body: null },
            { row: 5, col: 0, rowSpan: 1, colSpan: 2, body: null },
        ]);
    });

    it("draws dividers only next to the data area by default", () => {
        const cells = layout({
            headers: [{ type: "index" }, { type: "title" }],
            footers: [[{ body: "f1" }], [{ body: "f2" }]],
            rowHeaders: [{ type: "index" }, { type: "index" }],
        });
        const at = (row: number, col: number) =>
            cells.find((c) => c.row === row && c.col === col)!;
        // headers: 最終行だけ下に太線
        expect(at(0, 2).dividerBottom).toBe(false);
        expect(at(1, 2).dividerBottom).toBe(true);
        // footers: 先頭行だけ上に太線
        expect(at(5, 2).dividerTop).toBe(true);
        expect(at(6, 2).dividerTop).toBe(false);
        // rowHeaders: 最終列だけ右に太線
        expect(at(2, 0).dividerRight).toBe(false);
        expect(at(2, 1).dividerRight).toBe(true);
        // 角は接する境界の太線を引き継ぐ
        expect(at(0, 0).dividerBottom).toBe(true);
        expect(at(0, 0).dividerRight).toBe(true);
        expect(at(5, 0).dividerTop).toBe(true);
    });

    it("follows the divider option of each line", () => {
        const cells = layout({
            headers: [
                { cells: [{ body: "Group", span: 5 }], divider: true },
                { type: "title", divider: false },
            ],
            rowHeaders: [{ type: "index", divider: false }],
        });
        const at = (row: number, col: number) =>
            cells.find((c) => c.row === row && c.col === col)!;
        expect(at(0, 1).dividerBottom).toBe(true);
        expect(at(1, 1).dividerBottom).toBe(false);
        expect(at(2, 0).dividerRight).toBe(false);
        expect(at(0, 0).dividerBottom).toBe(false);
    });

    it("uses the divider of the bottom row for rowSpan cells", () => {
        const cells = layout({
            headers: [
                [{ body: "Name", rowSpan: 2 }],
                { type: "title", divider: false },
            ],
        });
        expect(cells[0]!.body).toBe("Name");
        expect(cells[0]!.dividerBottom).toBe(false);
    });

    it("combines line and cell class names", () => {
        const cells = layout({
            headers: [
                {
                    cells: [{ body: "A", className: "cell" }],
                    className: "line",
                },
            ],
        });
        expect(cells[0]!.className).toBe("line cell");
        expect(cells[1]!.className).toBe("line");
    });
});
