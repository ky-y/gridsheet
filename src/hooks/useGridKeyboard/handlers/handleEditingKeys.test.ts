import { describe, expect, it, vi } from "vitest";
import {
    createKeyboardParams,
    makeKeyEvent,
} from "../../../test/handlerHelpers.js";
import type { Selection } from "../../../types.js";
import { handleEditingKeys } from "./handleEditingKeys.js";

describe("handleEditingKeys", () => {
    it("returns false when not editing", () => {
        const params = createKeyboardParams({ editingCell: null });
        expect(handleEditingKeys(makeKeyEvent("Enter"), params)).toBe(false);
    });

    it("exits edit mode and focuses container on Escape", () => {
        const setEditingCell = vi.fn();
        const containerRef = {
            current: { focus: vi.fn() } as unknown as HTMLDivElement,
        };
        const params = createKeyboardParams({
            editingCell: { row: 0, col: 0 },
            setEditingCell,
            containerRef,
        });
        const e = makeKeyEvent("Escape");
        expect(handleEditingKeys(e, params)).toBe(true);
        expect(setEditingCell).toHaveBeenCalledWith(null);
        expect(containerRef.current.focus).toHaveBeenCalled();
        expect(e.preventDefault).toHaveBeenCalled();
    });

    it("exits edit mode on Enter", () => {
        const setEditingCell = vi.fn();
        const params = createKeyboardParams({
            editingCell: { row: 0, col: 0 },
            setEditingCell,
        });
        expect(handleEditingKeys(makeKeyEvent("Enter"), params)).toBe(true);
        expect(setEditingCell).toHaveBeenCalledWith(null);
    });

    it("moves selection right on Tab", () => {
        const setEditingCell = vi.fn();
        const setSelection = vi.fn(
            (updater: (prev: Selection | null) => Selection | null) =>
                updater({
                    start: { row: 0, col: 0 },
                    end: { row: 0, col: 0 },
                }),
        );
        const params = createKeyboardParams({
            editingCell: { row: 0, col: 0 },
            setEditingCell,
            setSelection,
        });
        expect(handleEditingKeys(makeKeyEvent("Tab"), params)).toBe(true);
        expect(setEditingCell).toHaveBeenCalledWith(null);
        const sel = setSelection.mock.calls[0]?.[0]({
            start: { row: 0, col: 0 },
            end: { row: 0, col: 0 },
        });
        expect(sel?.start.col).toBe(1);
        expect(sel?.end.col).toBe(1);
    });

    it("moves selection left on Shift+Tab", () => {
        const setSelection = vi.fn(
            (updater: (prev: Selection | null) => Selection | null) =>
                updater({
                    start: { row: 0, col: 2 },
                    end: { row: 0, col: 2 },
                }),
        );
        const params = createKeyboardParams({
            editingCell: { row: 0, col: 2 },
            setSelection,
        });
        handleEditingKeys(makeKeyEvent("Tab", { shiftKey: true }), params);
        const sel = setSelection.mock.calls[0]?.[0]({
            start: { row: 0, col: 2 },
            end: { row: 0, col: 2 },
        });
        expect(sel?.start.col).toBe(1);
    });

    it("clamps Tab movement at maxCol", () => {
        const setSelection = vi.fn(
            (updater: (prev: Selection | null) => Selection | null) =>
                updater({
                    start: { row: 0, col: 4 },
                    end: { row: 0, col: 4 },
                }),
        );
        const params = createKeyboardParams({
            editingCell: { row: 0, col: 4 },
            setSelection,
            maxCol: 4,
        });
        handleEditingKeys(makeKeyEvent("Tab"), params);
        const sel = setSelection.mock.calls[0]?.[0]({
            start: { row: 0, col: 4 },
            end: { row: 0, col: 4 },
        });
        expect(sel?.start.col).toBe(4);
    });

    it("returns false on arrow keys to delegate to navigation", () => {
        const setEditingCell = vi.fn();
        const params = createKeyboardParams({
            editingCell: { row: 0, col: 0 },
            setEditingCell,
        });
        expect(handleEditingKeys(makeKeyEvent("ArrowDown"), params)).toBe(
            false,
        );
        expect(setEditingCell).toHaveBeenCalledWith(null);
    });

    it("returns true to swallow other keys while editing", () => {
        const params = createKeyboardParams({
            editingCell: { row: 0, col: 0 },
        });
        expect(handleEditingKeys(makeKeyEvent("a"), params)).toBe(true);
    });
});
