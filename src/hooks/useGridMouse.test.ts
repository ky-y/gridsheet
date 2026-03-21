import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGridMouse } from "./useGridMouse.js";
import type { GridMouseParams } from "./useGridMouse.js";
import type { Selection } from "../types.js";

function createParams(
    overrides: Partial<GridMouseParams> = {},
): GridMouseParams {
    const container = document.createElement("div");
    container.focus = vi.fn();
    return {
        selection: null,
        setSelection: vi.fn((updater) => updater(null)),
        setEditingCell: vi.fn(),
        containerRef: { current: container },
        onSelectionChange: vi.fn(),
        minRow: 0,
        fullMinCol: 0,
        maxRow: 9,
        maxCol: 4,
        ...overrides,
    };
}

function makeMouseEvent(
    dataset: Record<string, string>,
): React.MouseEvent<HTMLDivElement> {
    const el = document.createElement("div");
    for (const [k, v] of Object.entries(dataset)) {
        el.dataset[k] = v;
    }
    return { target: el } as unknown as React.MouseEvent<HTMLDivElement>;
}

describe("useGridMouse", () => {
    it("selects all on selectAll cell type click", () => {
        const setSelection = vi.fn(
            (updater: (prev: Selection | null) => Selection | null) =>
                updater(null),
        );
        const onSelectionChange = vi.fn();
        const { result } = renderHook(() =>
            useGridMouse(createParams({ setSelection, onSelectionChange })),
        );
        act(() => {
            result.current.handleMouseDown(
                makeMouseEvent({ row: "0", col: "0", type: "selectAll" }),
            );
        });
        const sel = setSelection.mock.calls[0]?.[0](null);
        expect(sel).toEqual({
            start: { row: 0, col: 0 },
            end: { row: 9, col: 4 },
        });
    });

    it("selects column on title cell click", () => {
        const setSelection = vi.fn(
            (updater: (prev: Selection | null) => Selection | null) =>
                updater(null),
        );
        const { result } = renderHook(() =>
            useGridMouse(createParams({ setSelection })),
        );
        act(() => {
            result.current.handleMouseDown(
                makeMouseEvent({ row: "0", col: "2", type: "title" }),
            );
        });
        const sel = setSelection.mock.calls[0]?.[0](null);
        expect(sel).toEqual({
            start: { row: 0, col: 2 },
            end: { row: 9, col: 2 },
        });
    });

    it("selects columns with span on header cell click", () => {
        const setSelection = vi.fn(
            (updater: (prev: Selection | null) => Selection | null) =>
                updater(null),
        );
        const { result } = renderHook(() =>
            useGridMouse(createParams({ setSelection })),
        );
        act(() => {
            result.current.handleMouseDown(
                makeMouseEvent({
                    row: "1",
                    col: "1",
                    type: "header",
                    span: "3",
                }),
            );
        });
        const sel = setSelection.mock.calls[0]?.[0](null);
        expect(sel).toEqual({
            start: { row: 0, col: 1 },
            end: { row: 9, col: 3 },
        });
    });

    it("selects row on rowNumber cell click", () => {
        const setSelection = vi.fn(
            (updater: (prev: Selection | null) => Selection | null) =>
                updater(null),
        );
        const { result } = renderHook(() =>
            useGridMouse(createParams({ setSelection })),
        );
        act(() => {
            result.current.handleMouseDown(
                makeMouseEvent({ row: "3", col: "0", type: "rowNumber" }),
            );
        });
        const sel = setSelection.mock.calls[0]?.[0](null);
        expect(sel).toEqual({
            start: { row: 3, col: 0 },
            end: { row: 3, col: 4 },
        });
    });

    it("selects single cell on regular cell click", () => {
        const setSelection = vi.fn(
            (updater: (prev: Selection | null) => Selection | null) =>
                updater(null),
        );
        const { result } = renderHook(() =>
            useGridMouse(createParams({ setSelection })),
        );
        act(() => {
            result.current.handleMouseDown(
                makeMouseEvent({ row: "2", col: "3" }),
            );
        });
        const sel = setSelection.mock.calls[0]?.[0](null);
        expect(sel).toEqual({
            start: { row: 2, col: 3 },
            end: { row: 2, col: 3 },
        });
    });

    it("enters edit mode on clicking already-selected single cell", () => {
        const setEditingCell = vi.fn();
        const selection = {
            start: { row: 2, col: 3 },
            end: { row: 2, col: 3 },
        };
        const { result } = renderHook(() =>
            useGridMouse(createParams({ setEditingCell, selection })),
        );
        act(() => {
            result.current.handleMouseDown(
                makeMouseEvent({ row: "2", col: "3" }),
            );
        });
        expect(setEditingCell).toHaveBeenCalledWith({ row: 2, col: 3 });
    });

    it("clears editing cell on new cell click", () => {
        const setEditingCell = vi.fn();
        const { result } = renderHook(() =>
            useGridMouse(createParams({ setEditingCell })),
        );
        act(() => {
            result.current.handleMouseDown(
                makeMouseEvent({ row: "1", col: "1" }),
            );
        });
        expect(setEditingCell).toHaveBeenCalledWith(null);
    });

    it("does nothing when target has no data-row", () => {
        const setSelection = vi.fn();
        const { result } = renderHook(() =>
            useGridMouse(createParams({ setSelection })),
        );
        const el = document.createElement("div");
        act(() => {
            result.current.handleMouseDown({
                target: el,
            } as unknown as React.MouseEvent<HTMLDivElement>);
        });
        expect(setSelection).not.toHaveBeenCalled();
    });

    it("fires onSelectionChange on window mouseUp after drag", () => {
        const onSelectionChange = vi.fn();
        const setSelection = vi.fn(
            (updater: (prev: Selection | null) => Selection | null) => {
                updater({ start: { row: 0, col: 0 }, end: { row: 0, col: 0 } });
            },
        );
        const { result } = renderHook(() =>
            useGridMouse(createParams({ setSelection, onSelectionChange })),
        );
        // mouseDown to start drag
        act(() => {
            result.current.handleMouseDown(
                makeMouseEvent({ row: "0", col: "0" }),
            );
        });
        // window mouseUp to end drag
        act(() => {
            window.dispatchEvent(new MouseEvent("mouseup"));
        });
        expect(onSelectionChange).toHaveBeenCalled();
    });

    it("ignores mouseMove when not dragging", () => {
        const setSelection = vi.fn();
        const { result } = renderHook(() =>
            useGridMouse(createParams({ setSelection })),
        );
        act(() => {
            result.current.handleMouseMove(
                makeMouseEvent({ row: "1", col: "1" }),
            );
        });
        expect(setSelection).not.toHaveBeenCalled();
    });
});
