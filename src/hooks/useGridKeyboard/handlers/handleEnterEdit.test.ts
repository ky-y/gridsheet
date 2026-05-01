import { describe, expect, it, vi } from "vitest";
import {
    createKeyboardParams,
    makeKeyEvent,
} from "../../../test/handlerHelpers.js";
import { handleEnterEdit } from "./handleEnterEdit.js";

describe("handleEnterEdit", () => {
    it("returns false for non Enter/F2 keys", () => {
        const params = createKeyboardParams();
        expect(handleEnterEdit(makeKeyEvent("a"), params)).toBe(false);
    });

    it("enters edit mode on Enter", () => {
        const setEditingCell = vi.fn();
        const params = createKeyboardParams({ setEditingCell });
        expect(handleEnterEdit(makeKeyEvent("Enter"), params)).toBe(true);
        expect(setEditingCell).toHaveBeenCalledWith({ row: 0, col: 0 });
    });

    it("enters edit mode on F2", () => {
        const setEditingCell = vi.fn();
        const params = createKeyboardParams({ setEditingCell });
        expect(handleEnterEdit(makeKeyEvent("F2"), params)).toBe(true);
        expect(setEditingCell).toHaveBeenCalledWith({ row: 0, col: 0 });
    });

    it("returns false on multi-cell selection", () => {
        const params = createKeyboardParams({
            selection: {
                start: { row: 0, col: 0 },
                end: { row: 1, col: 1 },
            },
        });
        expect(handleEnterEdit(makeKeyEvent("Enter"), params)).toBe(false);
    });

    it("returns false outside data range", () => {
        const params = createKeyboardParams({
            selection: {
                start: { row: 99, col: 0 },
                end: { row: 99, col: 0 },
            },
        });
        expect(handleEnterEdit(makeKeyEvent("Enter"), params)).toBe(false);
    });

    it("does not enter edit mode on readonly cell", () => {
        const setEditingCell = vi.fn();
        // row 2 col 0 = Charlie (readonly)
        const params = createKeyboardParams({
            selection: {
                start: { row: 2, col: 0 },
                end: { row: 2, col: 0 },
            },
            setEditingCell,
        });
        expect(handleEnterEdit(makeKeyEvent("Enter"), params)).toBe(false);
        expect(setEditingCell).not.toHaveBeenCalled();
    });
});
