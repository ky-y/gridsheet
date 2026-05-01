import { describe, expect, it, vi } from "vitest";
import {
    createKeyboardParams,
    makeKeyEvent,
} from "../../../test/handlerHelpers.js";
import { handleCharInput } from "./handleCharInput.js";

describe("handleCharInput", () => {
    it("returns false for multi-character keys", () => {
        const params = createKeyboardParams();
        expect(handleCharInput(makeKeyEvent("ArrowUp"), params)).toBe(false);
    });

    it("returns false when Ctrl/Meta is held", () => {
        const params = createKeyboardParams();
        expect(
            handleCharInput(makeKeyEvent("a", { ctrlKey: true }), params),
        ).toBe(false);
        expect(
            handleCharInput(makeKeyEvent("a", { metaKey: true }), params),
        ).toBe(false);
    });

    it("returns false on multi-cell selection", () => {
        const params = createKeyboardParams({
            selection: {
                start: { row: 0, col: 0 },
                end: { row: 1, col: 1 },
            },
        });
        expect(handleCharInput(makeKeyEvent("X"), params)).toBe(false);
    });

    it("replaces string cell value with the typed key", () => {
        const onChange = vi.fn();
        const setEditingCell = vi.fn();
        const params = createKeyboardParams({ onChange, setEditingCell });
        const e = makeKeyEvent("X");
        expect(handleCharInput(e, params)).toBe(true);
        expect(onChange.mock.calls[0]?.[0][0].name.value).toBe("X");
        expect(setEditingCell).toHaveBeenCalledWith({ row: 0, col: 0 });
        expect(e.preventDefault).toHaveBeenCalled();
    });

    it("accepts digits for number cells", () => {
        const onChange = vi.fn();
        const params = createKeyboardParams({
            selection: {
                start: { row: 0, col: 1 },
                end: { row: 0, col: 1 },
            },
            onChange,
        });
        handleCharInput(makeKeyEvent("7"), params);
        expect(onChange.mock.calls[0]?.[0][0].age.value).toBe(7);
    });

    it("ignores non-digit input on number cells (no onChange) but still enters edit mode", () => {
        const onChange = vi.fn();
        const setEditingCell = vi.fn();
        const params = createKeyboardParams({
            selection: {
                start: { row: 0, col: 1 },
                end: { row: 0, col: 1 },
            },
            onChange,
            setEditingCell,
        });
        handleCharInput(makeKeyEvent("a"), params);
        expect(onChange).not.toHaveBeenCalled();
        // 編集モードへは入る
        expect(setEditingCell).toHaveBeenCalledWith({ row: 0, col: 1 });
    });

    it("returns false on readonly cell", () => {
        const onChange = vi.fn();
        const setEditingCell = vi.fn();
        const params = createKeyboardParams({
            selection: {
                start: { row: 2, col: 0 },
                end: { row: 2, col: 0 },
            },
            onChange,
            setEditingCell,
        });
        expect(handleCharInput(makeKeyEvent("X"), params)).toBe(false);
        expect(onChange).not.toHaveBeenCalled();
        expect(setEditingCell).not.toHaveBeenCalled();
    });

    it("accepts characters for numberString cells", () => {
        const onChange = vi.fn();
        const params = createKeyboardParams({
            selection: {
                start: { row: 0, col: 2 },
                end: { row: 0, col: 2 },
            },
            onChange,
        });
        handleCharInput(makeKeyEvent("9"), params);
        expect(onChange.mock.calls[0]?.[0][0].code.value).toBe("9");
    });
});
