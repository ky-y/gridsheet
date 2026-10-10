import { beforeEach, describe, expect, it, vi } from "vitest";
import { testFooters, testHeaders } from "../../../test/fixtures.js";
import {
    createHeaderLayout,
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
            ...createHeaderLayout({ headers: [{ type: "title" }] }),
            selection: {
                start: { row: 0, col: 0 },
                end: { row: 0, col: 1 },
            },
        });
        handleCopy(makeKeyEvent("c", { ctrlKey: true }), params);
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
            "名前\t年齢",
        );
    });

    it("emits row indexes from an index rowHeader", () => {
        const params = createKeyboardParams({
            ...createHeaderLayout({ rowHeaders: [{ type: "index" }] }),
            selection: {
                start: { row: 0, col: 0 },
                end: { row: 1, col: 0 },
            },
        });
        handleCopy(makeKeyEvent("c", { ctrlKey: true }), params);
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith("1\n2");
    });

    it("emits alphabetical column indexes", () => {
        const params = createKeyboardParams({
            ...createHeaderLayout({
                headers: [{ type: "index", format: "upperAlpha" }],
            }),
            selection: {
                start: { row: 0, col: 0 },
                end: { row: 0, col: 2 },
            },
        });
        handleCopy(makeKeyEvent("c", { ctrlKey: true }), params);
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith("A\tB\tC");
    });

    it("repeats spanned header text in every covered cell", () => {
        const params = createKeyboardParams({
            ...createHeaderLayout({ headers: testHeaders }),
            selection: {
                start: { row: 0, col: 0 },
                end: { row: 0, col: 4 },
            },
        });
        handleCopy(makeKeyEvent("c", { ctrlKey: true }), params);
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
            "個人情報\t個人情報\tコード\t設定\t設定",
        );
    });

    it("includes footer text", () => {
        const params = createKeyboardParams({
            ...createHeaderLayout({ footers: testFooters }),
            selection: {
                start: { row: 2, col: 0 },
                end: { row: 3, col: 1 },
            },
        });
        handleCopy(makeKeyEvent("c", { ctrlKey: true }), params);
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
            "Charlie\t40\n合計\t95",
        );
    });

    it("emits an empty string for the corner cell", () => {
        const params = createKeyboardParams({
            ...createHeaderLayout({
                headers: [{ type: "title" }],
                rowHeaders: [{ type: "index" }],
            }),
            selection: {
                start: { row: 0, col: 0 },
                end: { row: 1, col: 1 },
            },
        });
        handleCopy(makeKeyEvent("c", { ctrlKey: true }), params);
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
            "\t名前\n1\tAlice",
        );
    });
});
