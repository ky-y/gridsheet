import { describe, expect, it, vi } from "vitest";
import {
    createMouseHandlerParams,
    makeMouseEvent,
} from "../../../test/handlerHelpers.js";
import type { Selection } from "../../../types.js";
import { handleMouseDown } from "./handleMouseDown.js";

describe("handleMouseDown", () => {
    it("does nothing when target has no [data-row] ancestor", () => {
        const setSelection = vi.fn();
        const params = createMouseHandlerParams({ setSelection });
        handleMouseDown(makeMouseEvent(null), params);
        expect(setSelection).not.toHaveBeenCalled();
    });

    it("does nothing when row/col are non-numeric", () => {
        const setSelection = vi.fn();
        const params = createMouseHandlerParams({ setSelection });
        handleMouseDown(makeMouseEvent({ row: "abc", col: "0" }), params);
        expect(setSelection).not.toHaveBeenCalled();
    });

    it("clears editing cell on every click", () => {
        const setEditingCell = vi.fn();
        const params = createMouseHandlerParams({ setEditingCell });
        handleMouseDown(makeMouseEvent({ row: "1", col: "1" }), params);
        expect(setEditingCell).toHaveBeenCalledWith(null);
    });

    it("selects entire grid on selectAll cell click", () => {
        const setSelection = vi.fn(
            (updater: (prev: Selection | null) => Selection | null) =>
                updater(null),
        );
        const setIsDragging = vi.fn();
        const onSelectionChange = vi.fn();
        const params = createMouseHandlerParams({
            setSelection,
            setIsDragging,
            onSelectionChange,
        });
        handleMouseDown(
            makeMouseEvent({ row: "0", col: "0", type: "selectAll" }),
            params,
        );
        const sel = setSelection.mock.calls[0]?.[0](null);
        expect(sel).toEqual({
            start: { row: 0, col: 0 },
            end: { row: 9, col: 4 },
        });
        expect(setIsDragging).toHaveBeenCalledWith(false);
        expect(onSelectionChange).toHaveBeenCalled();
    });

    it("selects column on title click", () => {
        const setSelection = vi.fn(
            (updater: (prev: Selection | null) => Selection | null) =>
                updater(null),
        );
        const setDragMode = vi.fn();
        const params = createMouseHandlerParams({ setSelection, setDragMode });
        handleMouseDown(
            makeMouseEvent({ row: "0", col: "2", type: "title" }),
            params,
        );
        const sel = setSelection.mock.calls[0]?.[0](null);
        expect(sel).toEqual({
            start: { row: 0, col: 2 },
            end: { row: 9, col: 2 },
        });
        expect(setDragMode).toHaveBeenCalledWith("column");
    });

    it("respects span on header click", () => {
        const setSelection = vi.fn(
            (updater: (prev: Selection | null) => Selection | null) =>
                updater(null),
        );
        const params = createMouseHandlerParams({ setSelection });
        handleMouseDown(
            makeMouseEvent({
                row: "1",
                col: "1",
                type: "header",
                span: "3",
            }),
            params,
        );
        const sel = setSelection.mock.calls[0]?.[0](null);
        expect(sel).toEqual({
            start: { row: 0, col: 1 },
            end: { row: 9, col: 3 },
        });
    });

    it("treats footer like header for column selection", () => {
        const setSelection = vi.fn(
            (updater: (prev: Selection | null) => Selection | null) =>
                updater(null),
        );
        const params = createMouseHandlerParams({ setSelection });
        handleMouseDown(
            makeMouseEvent({ row: "12", col: "2", type: "footer" }),
            params,
        );
        const sel = setSelection.mock.calls[0]?.[0](null);
        expect(sel).toEqual({
            start: { row: 0, col: 2 },
            end: { row: 9, col: 2 },
        });
    });

    it("selects entire row on rowNumber click", () => {
        const setSelection = vi.fn(
            (updater: (prev: Selection | null) => Selection | null) =>
                updater(null),
        );
        const setDragMode = vi.fn();
        const params = createMouseHandlerParams({ setSelection, setDragMode });
        handleMouseDown(
            makeMouseEvent({ row: "3", col: "0", type: "rowNumber" }),
            params,
        );
        const sel = setSelection.mock.calls[0]?.[0](null);
        expect(sel).toEqual({
            start: { row: 3, col: 0 },
            end: { row: 3, col: 4 },
        });
        expect(setDragMode).toHaveBeenCalledWith("row");
    });

    it("selects single cell on regular cell click", () => {
        const setSelection = vi.fn(
            (updater: (prev: Selection | null) => Selection | null) =>
                updater(null),
        );
        const setDragMode = vi.fn();
        const setIsDragging = vi.fn();
        const params = createMouseHandlerParams({
            setSelection,
            setDragMode,
            setIsDragging,
        });
        handleMouseDown(makeMouseEvent({ row: "2", col: "3" }), params);
        const sel = setSelection.mock.calls[0]?.[0](null);
        expect(sel).toEqual({
            start: { row: 2, col: 3 },
            end: { row: 2, col: 3 },
        });
        expect(setDragMode).toHaveBeenCalledWith("cell");
        expect(setIsDragging).toHaveBeenCalledWith(true);
    });

    it("enters edit mode when clicking already-selected single cell", () => {
        const setEditingCell = vi.fn();
        const setIsDragging = vi.fn();
        const params = createMouseHandlerParams({
            selection: { start: { row: 2, col: 3 }, end: { row: 2, col: 3 } },
            setEditingCell,
            setIsDragging,
        });
        handleMouseDown(makeMouseEvent({ row: "2", col: "3" }), params);
        // setEditingCell が { row, col } で呼ばれるのを期待
        expect(setEditingCell).toHaveBeenCalledWith({ row: 2, col: 3 });
        expect(setIsDragging).toHaveBeenCalledWith(false);
    });

    it("focuses container on selection", () => {
        const container = document.createElement("div");
        container.focus = vi.fn();
        const params = createMouseHandlerParams({
            containerRef: { current: container },
        });
        handleMouseDown(makeMouseEvent({ row: "1", col: "1" }), params);
        expect(container.focus).toHaveBeenCalled();
    });
});
