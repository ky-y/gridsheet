import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGridKeyboard } from "./useGridKeyboard.js";
import type { GridKeyboardParams } from "./useGridKeyboard.js";
import { testColumns, testData } from "../test/fixtures.js";

function createParams(
    overrides: Partial<GridKeyboardParams<typeof testColumns>> = {},
): GridKeyboardParams<typeof testColumns> {
    return {
        editingCell: null,
        setEditingCell: vi.fn(),
        containerRef: { current: { focus: vi.fn() } as unknown as HTMLDivElement },
        selection: { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } },
        setSelection: vi.fn((updater) => updater(null)),
        onSelectionChange: vi.fn(),
        columns: testColumns,
        data: testData,
        headers: undefined,
        onChange: vi.fn(),
        colOffset: 0,
        titleRowIndex: -1,
        hasTitle: false,
        headerRowOffset: -1,
        dataRowOffset: 0,
        showRowNumbers: false,
        minRow: 0,
        maxRow: 2,
        minCol: 0,
        maxCol: 4,
        fullMinRow: 0,
        fullMinCol: 0,
        ...overrides,
    };
}

function makeKeyEvent(
    key: string,
    mods: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean; altKey?: boolean } = {},
): React.KeyboardEvent<HTMLDivElement> {
    return {
        key,
        ctrlKey: mods.ctrlKey ?? false,
        metaKey: mods.metaKey ?? false,
        shiftKey: mods.shiftKey ?? false,
        altKey: mods.altKey ?? false,
        preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent<HTMLDivElement>;
}

describe("useGridKeyboard", () => {
    beforeEach(() => {
        vi.stubGlobal("navigator", {
            clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
        });
        vi.stubGlobal("window", {
            ...globalThis.window,
            getSelection: () => ({ toString: () => "" }),
        });
    });

    // === Arrow navigation ===
    it("moves selection down with ArrowDown", () => {
        const setSelection = vi.fn((updater: (prev: unknown) => unknown) => updater(null));
        const { result } = renderHook(() =>
            useGridKeyboard(createParams({ setSelection })),
        );
        act(() => result.current(makeKeyEvent("ArrowDown")));
        expect(setSelection).toHaveBeenCalled();
        const sel = setSelection.mock.calls[0]![0]({
            start: { row: 0, col: 0 },
            end: { row: 0, col: 0 },
        });
        expect(sel).toEqual({
            start: { row: 1, col: 0 },
            end: { row: 1, col: 0 },
        });
    });

    it("moves selection right with ArrowRight", () => {
        const setSelection = vi.fn((updater: (prev: unknown) => unknown) => updater(null));
        const { result } = renderHook(() =>
            useGridKeyboard(createParams({ setSelection })),
        );
        act(() => result.current(makeKeyEvent("ArrowRight")));
        const sel = setSelection.mock.calls[0]![0]({
            start: { row: 0, col: 0 },
            end: { row: 0, col: 0 },
        });
        expect(sel).toEqual({
            start: { row: 0, col: 1 },
            end: { row: 0, col: 1 },
        });
    });

    it("clamps selection at grid boundaries", () => {
        const setSelection = vi.fn((updater: (prev: unknown) => unknown) => updater(null));
        const { result } = renderHook(() =>
            useGridKeyboard(createParams({ setSelection })),
        );
        act(() => result.current(makeKeyEvent("ArrowUp")));
        const sel = setSelection.mock.calls[0]![0]({
            start: { row: 0, col: 0 },
            end: { row: 0, col: 0 },
        });
        // row should stay at 0 (minRow)
        expect(sel.start.row).toBe(0);
    });

    // === Shift+Arrow (range extension) ===
    it("extends selection with Shift+Arrow", () => {
        const setSelection = vi.fn((updater: (prev: unknown) => unknown) => updater(null));
        const { result } = renderHook(() =>
            useGridKeyboard(createParams({ setSelection })),
        );
        act(() => result.current(makeKeyEvent("ArrowDown", { shiftKey: true })));
        const sel = setSelection.mock.calls[0]![0]({
            start: { row: 0, col: 0 },
            end: { row: 0, col: 0 },
        });
        expect(sel).toEqual({
            start: { row: 0, col: 0 },
            end: { row: 1, col: 0 },
        });
    });

    // === Ctrl+Arrow (jump to edge) ===
    it("jumps to edge with Ctrl+Arrow", () => {
        const setSelection = vi.fn((updater: (prev: unknown) => unknown) => updater(null));
        const { result } = renderHook(() =>
            useGridKeyboard(createParams({ setSelection })),
        );
        act(() => result.current(makeKeyEvent("ArrowDown", { ctrlKey: true })));
        const sel = setSelection.mock.calls[0]![0]({
            start: { row: 0, col: 0 },
            end: { row: 0, col: 0 },
        });
        expect(sel).toEqual({
            start: { row: 2, col: 0 },
            end: { row: 2, col: 0 },
        });
    });

    // === Shift+Ctrl+Arrow ===
    it("extends to edge with Shift+Ctrl+Arrow", () => {
        const setSelection = vi.fn((updater: (prev: unknown) => unknown) => updater(null));
        const { result } = renderHook(() =>
            useGridKeyboard(createParams({ setSelection })),
        );
        act(() => result.current(makeKeyEvent("ArrowRight", { shiftKey: true, ctrlKey: true })));
        const sel = setSelection.mock.calls[0]![0]({
            start: { row: 0, col: 0 },
            end: { row: 0, col: 0 },
        });
        expect(sel).toEqual({
            start: { row: 0, col: 0 },
            end: { row: 0, col: 4 },
        });
    });

    // === Ctrl+C copy ===
    it("copies cell value to clipboard with Ctrl+C", () => {
        const { result } = renderHook(() =>
            useGridKeyboard(createParams()),
        );
        const e = makeKeyEvent("c", { ctrlKey: true });
        act(() => result.current(e));
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Alice");
        expect(e.preventDefault).toHaveBeenCalled();
    });

    // === Enter / F2 → editing mode ===
    it("enters edit mode on Enter key", () => {
        const setEditingCell = vi.fn();
        const { result } = renderHook(() =>
            useGridKeyboard(createParams({ setEditingCell })),
        );
        act(() => result.current(makeKeyEvent("Enter")));
        expect(setEditingCell).toHaveBeenCalledWith({ row: 0, col: 0 });
    });

    it("enters edit mode on F2 key", () => {
        const setEditingCell = vi.fn();
        const { result } = renderHook(() =>
            useGridKeyboard(createParams({ setEditingCell })),
        );
        act(() => result.current(makeKeyEvent("F2")));
        expect(setEditingCell).toHaveBeenCalledWith({ row: 0, col: 0 });
    });

    // === Escape exits editing ===
    it("exits edit mode on Escape", () => {
        const setEditingCell = vi.fn();
        const containerRef = { current: { focus: vi.fn() } as unknown as HTMLDivElement };
        const { result } = renderHook(() =>
            useGridKeyboard(
                createParams({ editingCell: { row: 0, col: 0 }, setEditingCell, containerRef }),
            ),
        );
        act(() => result.current(makeKeyEvent("Escape")));
        expect(setEditingCell).toHaveBeenCalledWith(null);
        expect(containerRef.current.focus).toHaveBeenCalled();
    });

    // === Tab exits editing and moves ===
    it("exits edit mode and moves on Tab", () => {
        const setEditingCell = vi.fn();
        const setSelection = vi.fn((updater: (prev: unknown) => unknown) => updater(null));
        const { result } = renderHook(() =>
            useGridKeyboard(
                createParams({
                    editingCell: { row: 0, col: 0 },
                    setEditingCell,
                    setSelection,
                }),
            ),
        );
        act(() => result.current(makeKeyEvent("Tab")));
        expect(setEditingCell).toHaveBeenCalledWith(null);
        const sel = setSelection.mock.calls[0]![0]({
            start: { row: 0, col: 0 },
            end: { row: 0, col: 0 },
        });
        expect(sel.start.col).toBe(1);
    });

    // === Backspace clears cell ===
    it("clears cell and enters edit mode on Backspace", () => {
        const onChange = vi.fn();
        const setEditingCell = vi.fn();
        const { result } = renderHook(() =>
            useGridKeyboard(createParams({ onChange, setEditingCell })),
        );
        act(() => result.current(makeKeyEvent("Backspace")));
        expect(onChange).toHaveBeenCalled();
        const newData = onChange.mock.calls[0]![0];
        expect(newData[0].name).toBe("");
        expect(setEditingCell).toHaveBeenCalledWith({ row: 0, col: 0 });
    });

    // === Character key replaces value ===
    it("replaces string cell value on character key press", () => {
        const onChange = vi.fn();
        const setEditingCell = vi.fn();
        const { result } = renderHook(() =>
            useGridKeyboard(createParams({ onChange, setEditingCell })),
        );
        act(() => result.current(makeKeyEvent("X")));
        expect(onChange).toHaveBeenCalled();
        const newData = onChange.mock.calls[0]![0];
        expect(newData[0].name).toBe("X");
        expect(setEditingCell).toHaveBeenCalledWith({ row: 0, col: 0 });
    });

    it("replaces number cell value only with digit keys", () => {
        const onChange = vi.fn();
        const setEditingCell = vi.fn();
        const { result } = renderHook(() =>
            useGridKeyboard(
                createParams({
                    selection: { start: { row: 0, col: 1 }, end: { row: 0, col: 1 } },
                    onChange,
                    setEditingCell,
                }),
            ),
        );
        // digit key should work
        act(() => result.current(makeKeyEvent("5")));
        expect(onChange).toHaveBeenCalled();
        expect(onChange.mock.calls[0]![0][0].age).toBe(5);

        // letter key should NOT trigger onChange for number cell
        const onChange2 = vi.fn();
        const { result: r2 } = renderHook(() =>
            useGridKeyboard(
                createParams({
                    selection: { start: { row: 0, col: 1 }, end: { row: 0, col: 1 } },
                    onChange: onChange2,
                    setEditingCell: vi.fn(),
                }),
            ),
        );
        act(() => r2.current(makeKeyEvent("a")));
        expect(onChange2).not.toHaveBeenCalled();
    });
});
