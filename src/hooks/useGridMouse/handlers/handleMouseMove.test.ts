import { describe, expect, it, vi } from "vitest";
import {
    createMouseHandlerParams,
    makeMouseEvent,
} from "../../../test/handlerHelpers.js";
import type { Selection } from "../../../types.js";
import { handleMouseMove } from "./handleMouseMove.js";

describe("handleMouseMove", () => {
    it("does nothing when not dragging", () => {
        const setSelection = vi.fn();
        const params = createMouseHandlerParams({
            setSelection,
            isDragging: false,
        });
        handleMouseMove(makeMouseEvent({ row: "1", col: "1" }), params);
        expect(setSelection).not.toHaveBeenCalled();
    });

    it("does nothing when target has no [data-row] ancestor", () => {
        const setSelection = vi.fn();
        const params = createMouseHandlerParams({
            setSelection,
            isDragging: true,
        });
        handleMouseMove(makeMouseEvent(null), params);
        expect(setSelection).not.toHaveBeenCalled();
    });

    it("updates selection end in cell drag mode", () => {
        const setSelection = vi.fn(
            (updater: (prev: Selection | null) => Selection | null) =>
                updater({
                    start: { row: 0, col: 0 },
                    end: { row: 0, col: 0 },
                }),
        );
        const params = createMouseHandlerParams({
            setSelection,
            isDragging: true,
            dragMode: "cell",
        });
        handleMouseMove(makeMouseEvent({ row: "3", col: "2" }), params);
        const sel = setSelection.mock.calls[0]?.[0]({
            start: { row: 0, col: 0 },
            end: { row: 0, col: 0 },
        });
        expect(sel).toEqual({
            start: { row: 0, col: 0 },
            end: { row: 3, col: 2 },
        });
    });

    it("updates selection in column drag mode (extends rows to maxRow + span)", () => {
        const setSelection = vi.fn(
            (updater: (prev: Selection | null) => Selection | null) =>
                updater({
                    start: { row: 0, col: 1 },
                    end: { row: 9, col: 1 },
                }),
        );
        const params = createMouseHandlerParams({
            setSelection,
            isDragging: true,
            dragMode: "column",
        });
        handleMouseMove(
            makeMouseEvent({ row: "5", col: "3", span: "2" }),
            params,
        );
        const sel = setSelection.mock.calls[0]?.[0]({
            start: { row: 0, col: 1 },
            end: { row: 9, col: 1 },
        });
        expect(sel).toEqual({
            start: { row: 0, col: 1 },
            end: { row: 9, col: 4 },
        });
    });

    it("updates selection in row drag mode (extends cols to maxCol)", () => {
        const setSelection = vi.fn(
            (updater: (prev: Selection | null) => Selection | null) =>
                updater({
                    start: { row: 1, col: 0 },
                    end: { row: 1, col: 4 },
                }),
        );
        const params = createMouseHandlerParams({
            setSelection,
            isDragging: true,
            dragMode: "row",
        });
        handleMouseMove(makeMouseEvent({ row: "5", col: "2" }), params);
        const sel = setSelection.mock.calls[0]?.[0]({
            start: { row: 1, col: 0 },
            end: { row: 1, col: 4 },
        });
        expect(sel).toEqual({
            start: { row: 1, col: 0 },
            end: { row: 5, col: 4 },
        });
    });

    it("returns null updater when prev selection is null", () => {
        const setSelection = vi.fn(
            (updater: (prev: Selection | null) => Selection | null) =>
                updater(null),
        );
        const params = createMouseHandlerParams({
            setSelection,
            isDragging: true,
        });
        handleMouseMove(makeMouseEvent({ row: "1", col: "1" }), params);
        const sel = setSelection.mock.calls[0]?.[0](null);
        expect(sel).toBe(null);
    });
});
