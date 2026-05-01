import { describe, expect, it, vi } from "vitest";
import {
    createKeyboardParams,
    makeKeyEvent,
} from "../../../test/handlerHelpers.js";
import { handleDelete } from "./handleDelete.js";

describe("handleDelete", () => {
    it("returns false for non Backspace/Delete keys", () => {
        const params = createKeyboardParams();
        expect(handleDelete(makeKeyEvent("Enter"), params)).toBe(false);
    });

    it("returns false when selection spans multiple cells", () => {
        const params = createKeyboardParams({
            selection: {
                start: { row: 0, col: 0 },
                end: { row: 1, col: 1 },
            },
        });
        expect(handleDelete(makeKeyEvent("Backspace"), params)).toBe(false);
    });

    it("returns false outside data range", () => {
        const params = createKeyboardParams({
            selection: {
                start: { row: 5, col: 0 },
                end: { row: 5, col: 0 },
            },
        });
        expect(handleDelete(makeKeyEvent("Backspace"), params)).toBe(false);
    });

    it("returns false on readonly cell", () => {
        const onChange = vi.fn();
        // row 2 col 0 = Charlie (readonly ExtCell)
        const params = createKeyboardParams({
            selection: {
                start: { row: 2, col: 0 },
                end: { row: 2, col: 0 },
            },
            onChange,
        });
        expect(handleDelete(makeKeyEvent("Backspace"), params)).toBe(false);
        expect(onChange).not.toHaveBeenCalled();
    });

    it("clears string cell to empty string", () => {
        const onChange = vi.fn();
        const setEditingCell = vi.fn();
        const params = createKeyboardParams({ onChange, setEditingCell });
        const e = makeKeyEvent("Backspace");
        expect(handleDelete(e, params)).toBe(true);
        const newData = onChange.mock.calls[0]?.[0];
        expect(newData[0].name.value).toBe("");
        expect(setEditingCell).toHaveBeenCalledWith({ row: 0, col: 0 });
        expect(e.preventDefault).toHaveBeenCalled();
    });

    it("clears number cell to 0", () => {
        const onChange = vi.fn();
        const params = createKeyboardParams({
            selection: {
                start: { row: 0, col: 1 },
                end: { row: 0, col: 1 },
            },
            onChange,
        });
        handleDelete(makeKeyEvent("Delete"), params);
        const newData = onChange.mock.calls[0]?.[0];
        expect(newData[0].age.value).toBe(0);
    });

    it("clears check cell to false", () => {
        const onChange = vi.fn();
        const params = createKeyboardParams({
            selection: {
                start: { row: 0, col: 3 },
                end: { row: 0, col: 3 },
            },
            onChange,
        });
        handleDelete(makeKeyEvent("Delete"), params);
        const newData = onChange.mock.calls[0]?.[0];
        expect(newData[0].active.value).toBe(false);
    });

    it("returns false when onChange is not provided", () => {
        const params = createKeyboardParams({ onChange: undefined });
        expect(handleDelete(makeKeyEvent("Backspace"), params)).toBe(false);
    });
});
