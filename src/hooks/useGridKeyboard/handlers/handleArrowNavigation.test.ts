import { describe, expect, it, vi } from "vitest";
import {
    createKeyboardParams,
    makeKeyEvent,
} from "../../../test/handlerHelpers.js";
import type { Selection } from "../../../types.js";
import { handleArrowNavigation } from "./handleArrowNavigation.js";

describe("handleArrowNavigation", () => {
    it("returns false for non-arrow keys", () => {
        const params = createKeyboardParams();
        expect(handleArrowNavigation(makeKeyEvent("a"), params)).toBe(false);
    });

    it("moves selection down with ArrowDown", () => {
        const setSelection = vi.fn(
            (updater: (prev: Selection | null) => Selection | null) =>
                updater({
                    start: { row: 0, col: 0 },
                    end: { row: 0, col: 0 },
                }),
        );
        const params = createKeyboardParams({ setSelection });
        expect(handleArrowNavigation(makeKeyEvent("ArrowDown"), params)).toBe(
            true,
        );
        const sel = setSelection.mock.calls[0]?.[0]({
            start: { row: 0, col: 0 },
            end: { row: 0, col: 0 },
        });
        expect(sel).toEqual({
            start: { row: 1, col: 0 },
            end: { row: 1, col: 0 },
        });
    });

    it("clamps to minRow when moving up at top", () => {
        const setSelection = vi.fn(
            (updater: (prev: Selection | null) => Selection | null) =>
                updater({
                    start: { row: 0, col: 0 },
                    end: { row: 0, col: 0 },
                }),
        );
        const params = createKeyboardParams({ setSelection });
        handleArrowNavigation(makeKeyEvent("ArrowUp"), params);
        const sel = setSelection.mock.calls[0]?.[0]({
            start: { row: 0, col: 0 },
            end: { row: 0, col: 0 },
        });
        expect(sel?.start.row).toBe(0);
    });

    it("starts from top-left when no prior selection", () => {
        const setSelection = vi.fn(
            (updater: (prev: Selection | null) => Selection | null) =>
                updater(null),
        );
        const params = createKeyboardParams({ setSelection });
        handleArrowNavigation(makeKeyEvent("ArrowDown"), params);
        const sel = setSelection.mock.calls[0]?.[0](null);
        expect(sel).toEqual({
            start: { row: 1, col: 0 },
            end: { row: 1, col: 0 },
        });
    });

    it("extends selection with Shift+Arrow", () => {
        const setSelection = vi.fn(
            (updater: (prev: Selection | null) => Selection | null) =>
                updater({
                    start: { row: 0, col: 0 },
                    end: { row: 0, col: 0 },
                }),
        );
        const params = createKeyboardParams({ setSelection });
        handleArrowNavigation(
            makeKeyEvent("ArrowDown", { shiftKey: true }),
            params,
        );
        const sel = setSelection.mock.calls[0]?.[0]({
            start: { row: 0, col: 0 },
            end: { row: 0, col: 0 },
        });
        expect(sel).toEqual({
            start: { row: 0, col: 0 },
            end: { row: 1, col: 0 },
        });
    });

    it("jumps to edge with Ctrl+Arrow", () => {
        const setSelection = vi.fn(
            (updater: (prev: Selection | null) => Selection | null) =>
                updater({
                    start: { row: 0, col: 0 },
                    end: { row: 0, col: 0 },
                }),
        );
        const params = createKeyboardParams({ setSelection });
        handleArrowNavigation(
            makeKeyEvent("ArrowRight", { ctrlKey: true }),
            params,
        );
        const sel = setSelection.mock.calls[0]?.[0]({
            start: { row: 0, col: 0 },
            end: { row: 0, col: 0 },
        });
        expect(sel).toEqual({
            start: { row: 0, col: 4 },
            end: { row: 0, col: 4 },
        });
    });

    it("extends to edge with Shift+Ctrl+Arrow", () => {
        const setSelection = vi.fn(
            (updater: (prev: Selection | null) => Selection | null) =>
                updater({
                    start: { row: 0, col: 0 },
                    end: { row: 0, col: 0 },
                }),
        );
        const params = createKeyboardParams({ setSelection });
        handleArrowNavigation(
            makeKeyEvent("ArrowDown", { shiftKey: true, ctrlKey: true }),
            params,
        );
        const sel = setSelection.mock.calls[0]?.[0]({
            start: { row: 0, col: 0 },
            end: { row: 0, col: 0 },
        });
        expect(sel?.end.row).toBe(2);
    });

    it("moves whole-column selection with left/right", () => {
        // 列全体選択（minRow〜maxRowで列1）
        const setSelection = vi.fn(
            (updater: (prev: Selection | null) => Selection | null) =>
                updater({
                    start: { row: 0, col: 1 },
                    end: { row: 2, col: 1 },
                }),
        );
        const params = createKeyboardParams({
            setSelection,
            colOffset: 0,
        });
        handleArrowNavigation(makeKeyEvent("ArrowRight"), params);
        const sel = setSelection.mock.calls[0]?.[0]({
            start: { row: 0, col: 1 },
            end: { row: 2, col: 1 },
        });
        expect(sel).toEqual({
            start: { row: 0, col: 2 },
            end: { row: 2, col: 2 },
        });
    });

    it("moves whole-row selection with up/down", () => {
        const setSelection = vi.fn(
            (updater: (prev: Selection | null) => Selection | null) =>
                updater({
                    start: { row: 1, col: 0 },
                    end: { row: 1, col: 4 },
                }),
        );
        const params = createKeyboardParams({ setSelection });
        handleArrowNavigation(makeKeyEvent("ArrowDown"), params);
        const sel = setSelection.mock.calls[0]?.[0]({
            start: { row: 1, col: 0 },
            end: { row: 1, col: 4 },
        });
        expect(sel).toEqual({
            start: { row: 2, col: 0 },
            end: { row: 2, col: 4 },
        });
    });

    it("calls onSelectionChange with new selection", () => {
        const onSelectionChange = vi.fn();
        const setSelection = vi.fn(
            (updater: (prev: Selection | null) => Selection | null) =>
                updater({
                    start: { row: 0, col: 0 },
                    end: { row: 0, col: 0 },
                }),
        );
        const params = createKeyboardParams({
            setSelection,
            onSelectionChange,
        });
        handleArrowNavigation(makeKeyEvent("ArrowDown"), params);
        expect(onSelectionChange).toHaveBeenCalled();
    });
});
