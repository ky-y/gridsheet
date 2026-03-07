import { describe, expect, it } from "vitest";
import {
    getCellAddress,
    getCellRaw,
    isSelected,
    resolveCellData,
} from "./grid.js";
import type { CellDataType } from "../types.js";
import { testData } from "../test/fixtures.js";

describe("resolveCellData", () => {
    it("returns raw value when given a primitive", () => {
        const result = resolveCellData("hello");
        expect(result).toEqual({
            value: "hello",
            readonly: false,
            style: undefined,
            className: undefined,
        });
    });

    it("returns raw value for null/undefined", () => {
        expect(resolveCellData(null).value).toBe(null);
        expect(resolveCellData(undefined).value).toBe(undefined);
    });

    it("unwraps CellDataType object", () => {
        const cell: CellDataType<string> = {
            value: "test",
            readonly: true,
            style: { color: "red" },
            className: "custom",
        };
        const result = resolveCellData(cell);
        expect(result).toEqual({
            value: "test",
            readonly: true,
            style: { color: "red" },
            className: "custom",
        });
    });

    it("defaults readonly to false when not specified in CellDataType", () => {
        const cell: CellDataType<number> = { value: 42 };
        expect(resolveCellData(cell).readonly).toBe(false);
    });

    it("does not treat arrays as CellDataType", () => {
        const arr = [1, 2, 3];
        expect(resolveCellData(arr).value).toBe(arr);
    });
});

describe("getCellRaw", () => {
    it("retrieves value by key from a data row", () => {
        expect(getCellRaw(testData[0]!, "name")).toBe("Alice");
        expect(getCellRaw(testData[0]!, "age")).toBe(30);
    });

    it("retrieves CellDataType object when present", () => {
        const raw = getCellRaw(testData[2]!, "name");
        expect(raw).toEqual({
            value: "Charlie",
            readonly: true,
            style: { color: "red" },
            className: "special",
        });
    });

    it("returns undefined for non-existent key", () => {
        expect(getCellRaw(testData[0]!, "nonexistent")).toBeUndefined();
    });
});

describe("getCellAddress", () => {
    it("returns row and col from element with data attributes", () => {
        const el = document.createElement("div");
        el.dataset.row = "2";
        el.dataset.col = "3";
        expect(getCellAddress(el)).toEqual({ row: 2, col: 3 });
    });

    it("finds closest ancestor with data-row", () => {
        const parent = document.createElement("div");
        parent.dataset.row = "1";
        parent.dataset.col = "2";
        const child = document.createElement("span");
        parent.appendChild(child);
        expect(getCellAddress(child)).toEqual({ row: 1, col: 2 });
    });

    it("returns null when no matching element found", () => {
        const el = document.createElement("div");
        expect(getCellAddress(el)).toBeNull();
    });

    it("returns null for non-numeric data attributes", () => {
        const el = document.createElement("div");
        el.dataset.row = "abc";
        el.dataset.col = "1";
        expect(getCellAddress(el)).toBeNull();
    });
});

describe("isSelected", () => {
    it("returns false when selection is null", () => {
        expect(isSelected(0, 0, null)).toBe(false);
    });

    it("returns true for cells within selection range", () => {
        const sel = { start: { row: 1, col: 1 }, end: { row: 3, col: 3 } };
        expect(isSelected(2, 2, sel)).toBe(true);
        expect(isSelected(1, 1, sel)).toBe(true);
        expect(isSelected(3, 3, sel)).toBe(true);
    });

    it("returns false for cells outside selection range", () => {
        const sel = { start: { row: 1, col: 1 }, end: { row: 3, col: 3 } };
        expect(isSelected(0, 0, sel)).toBe(false);
        expect(isSelected(4, 2, sel)).toBe(false);
    });

    it("handles reversed selection (end before start)", () => {
        const sel = { start: { row: 3, col: 3 }, end: { row: 1, col: 1 } };
        expect(isSelected(2, 2, sel)).toBe(true);
        expect(isSelected(0, 0, sel)).toBe(false);
    });
});
