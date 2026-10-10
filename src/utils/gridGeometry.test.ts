import { describe, expect, it } from "vitest";
import { testColumns } from "../test/fixtures.js";
import { computeGridGeometry } from "./gridGeometry.js";

describe("computeGridGeometry", () => {
    it("starts data at the origin without headers", () => {
        const g = computeGridGeometry({
            columns: testColumns,
            dataLength: 3,
            headers: [],
            footers: [],
            rowHeaders: [],
        });
        expect(g).toMatchObject({
            colOffset: 0,
            dataRowOffset: 0,
            footerRowOffset: 3,
            minRow: 0,
            maxRow: 2,
            minCol: 0,
            maxCol: 4,
            fullMinCol: 0,
        });
    });

    it("offsets rows by headers and cols by rowHeaders", () => {
        const g = computeGridGeometry({
            columns: testColumns,
            dataLength: 3,
            headers: [{ type: "index" }, { type: "title" }],
            footers: [[{ body: "Total" }]],
            rowHeaders: [{ type: "index" }],
        });
        expect(g).toMatchObject({
            colOffset: 1,
            dataRowOffset: 2,
            footerRowOffset: 5,
            maxRow: 5,
            minCol: 1,
            maxCol: 5,
            fullMinCol: 0,
        });
    });

    it("includes rowHeaders in navigation when selectableRowHeaders is set", () => {
        const g = computeGridGeometry({
            columns: testColumns,
            dataLength: 3,
            headers: [],
            footers: [],
            rowHeaders: [{ type: "index" }],
            configs: { selectableRowHeaders: true },
        });
        expect(g.minCol).toBe(0);
    });

    it("builds grid-template-columns from rowHeaders and columns", () => {
        const g = computeGridGeometry({
            columns: [
                { key: "a", type: "string", width: 2 },
                { key: "b", type: "string", width: "100px" },
                { key: "c", type: "string" },
            ],
            dataLength: 0,
            headers: [],
            footers: [],
            rowHeaders: [
                { type: "index" },
                { type: "index", width: "40px" },
                [{ body: "x" }],
                { cells: [], width: 1 },
            ],
        });
        expect(g.gridTemplateColumns).toBe("3rem 40px auto 1fr 2fr 100px auto");
    });
});
