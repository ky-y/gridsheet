import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    createKeyboardParams,
    makeKeyEvent,
} from "../../../test/handlerHelpers.js";
import { handleCopy } from "./handleCopy.js";

describe("handleCopy", () => {
    beforeEach(() => {
        vi.stubGlobal("navigator", {
            clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
        });
        vi.stubGlobal("window", {
            ...globalThis.window,
            getSelection: () => ({ toString: () => "" }),
        });
    });

    it("returns false for non Ctrl+C key", () => {
        const params = createKeyboardParams();
        expect(handleCopy(makeKeyEvent("a"), params)).toBe(false);
        expect(handleCopy(makeKeyEvent("c"), params)).toBe(false);
    });

    it("returns false when modifier combinations include shift or alt", () => {
        const params = createKeyboardParams();
        expect(
            handleCopy(
                makeKeyEvent("c", { ctrlKey: true, shiftKey: true }),
                params,
            ),
        ).toBe(false);
        expect(
            handleCopy(
                makeKeyEvent("c", { ctrlKey: true, altKey: true }),
                params,
            ),
        ).toBe(false);
    });

    it("falls through (returns true, no clipboard write) when text is selected", () => {
        vi.stubGlobal("window", {
            ...globalThis.window,
            getSelection: () => ({ toString: () => "selected text" }),
        });
        const params = createKeyboardParams();
        expect(handleCopy(makeKeyEvent("c", { ctrlKey: true }), params)).toBe(
            true,
        );
        expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });

    it("returns true without writing when there is no selection", () => {
        const params = createKeyboardParams({ selection: null });
        expect(handleCopy(makeKeyEvent("c", { ctrlKey: true }), params)).toBe(
            true,
        );
        expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });

    it("copies a single cell value", () => {
        const params = createKeyboardParams();
        const e = makeKeyEvent("c", { metaKey: true });
        expect(handleCopy(e, params)).toBe(true);
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Alice");
        expect(e.preventDefault).toHaveBeenCalled();
    });

    it("formats boolean as TRUE / FALSE", () => {
        const params = createKeyboardParams({
            selection: {
                start: { row: 0, col: 3 },
                end: { row: 1, col: 3 },
            },
        });
        handleCopy(makeKeyEvent("c", { ctrlKey: true }), params);
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
            "TRUE\nFALSE",
        );
    });

    it("emits TSV across multi-cell selections", () => {
        const params = createKeyboardParams({
            selection: {
                start: { row: 0, col: 0 },
                end: { row: 1, col: 1 },
            },
        });
        handleCopy(makeKeyEvent("c", { ctrlKey: true }), params);
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
            "Alice\t30\nBob\t25",
        );
    });

    it("includes title row text when range covers it", () => {
        const params = createKeyboardParams({
            selection: {
                start: { row: 0, col: 0 },
                end: { row: 0, col: 1 },
            },
            hasTitle: true,
            titleRowIndex: 0,
            dataRowOffset: 1,
        });
        handleCopy(makeKeyEvent("c", { ctrlKey: true }), params);
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
            "名前\t年齢",
        );
    });

    it("emits row numbers when showRowNumbers is enabled", () => {
        const params = createKeyboardParams({
            selection: {
                start: { row: 0, col: 0 },
                end: { row: 1, col: 0 },
            },
            showRowNumbers: true,
            colOffset: 1,
        });
        handleCopy(makeKeyEvent("c", { ctrlKey: true }), params);
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith("1\n2");
    });
});
