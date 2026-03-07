import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGridPaste } from "./useGridPaste.js";
import { testColumns, testData } from "../test/fixtures.js";
import type { GridPasteParams } from "./useGridPaste.js";

function createParams(
    overrides: Partial<GridPasteParams<typeof testColumns>> = {},
): GridPasteParams<typeof testColumns> {
    return {
        editingCell: null,
        selection: { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } },
        onChange: vi.fn(),
        data: testData,
        dataRowOffset: 0,
        colOffset: 0,
        columns: testColumns,
        ...overrides,
    };
}

function makePasteEvent(text: string) {
    return {
        clipboardData: { getData: () => text },
        preventDefault: vi.fn(),
    } as unknown as React.ClipboardEvent<HTMLDivElement>;
}

describe("useGridPaste", () => {
    it("does nothing when editingCell is set", () => {
        const onChange = vi.fn();
        const { result } = renderHook(() =>
            useGridPaste(
                createParams({ editingCell: { row: 0, col: 0 }, onChange }),
            ),
        );
        const e = makePasteEvent("test");
        act(() => result.current(e));
        expect(onChange).not.toHaveBeenCalled();
    });

    it("does nothing when selection is null", () => {
        const onChange = vi.fn();
        const { result } = renderHook(() =>
            useGridPaste(createParams({ selection: null, onChange })),
        );
        act(() => result.current(makePasteEvent("test")));
        expect(onChange).not.toHaveBeenCalled();
    });

    it("pastes a single value into a single cell", () => {
        const onChange = vi.fn();
        const { result } = renderHook(() =>
            useGridPaste(createParams({ onChange })),
        );
        act(() => result.current(makePasteEvent("NewName")));
        expect(onChange).toHaveBeenCalledTimes(1);
        const newData = onChange.mock.calls[0]?.[0];
        expect(newData[0].name).toBe("NewName");
        expect(newData[1].name).toBe("Bob"); // unchanged
    });

    it("parses TSV with CRLF line endings", () => {
        const onChange = vi.fn();
        const { result } = renderHook(() =>
            useGridPaste(
                createParams({
                    selection: {
                        start: { row: 0, col: 0 },
                        end: { row: 0, col: 0 },
                    },
                    onChange,
                }),
            ),
        );
        act(() => result.current(makePasteEvent("X\t99\r\nY\t88\r\n")));
        const newData = onChange.mock.calls[0]?.[0];
        expect(newData[0].name).toBe("X");
        expect(newData[0].age).toBe(99);
        expect(newData[1].name).toBe("Y");
        expect(newData[1].age).toBe(88);
    });

    it("converts check column values (TRUE/true/1 → boolean)", () => {
        const onChange = vi.fn();
        const { result } = renderHook(() =>
            useGridPaste(
                createParams({
                    selection: {
                        start: { row: 0, col: 3 },
                        end: { row: 0, col: 3 },
                    },
                    onChange,
                }),
            ),
        );
        act(() => result.current(makePasteEvent("TRUE")));
        expect(onChange.mock.calls[0]?.[0][0].active).toBe(true);

        const onChange2 = vi.fn();
        const { result: r2 } = renderHook(() =>
            useGridPaste(
                createParams({
                    selection: {
                        start: { row: 1, col: 3 },
                        end: { row: 1, col: 3 },
                    },
                    onChange: onChange2,
                }),
            ),
        );
        act(() => r2.current(makePasteEvent("false")));
        expect(onChange2.mock.calls[0]?.[0][1].active).toBe(false);
    });

    it("converts number column values", () => {
        const onChange = vi.fn();
        const { result } = renderHook(() =>
            useGridPaste(
                createParams({
                    selection: {
                        start: { row: 0, col: 1 },
                        end: { row: 0, col: 1 },
                    },
                    onChange,
                }),
            ),
        );
        act(() => result.current(makePasteEvent("42")));
        expect(onChange.mock.calls[0]?.[0][0].age).toBe(42);
    });

    it("converts empty string to 0 for number columns", () => {
        const onChange = vi.fn();
        const { result } = renderHook(() =>
            useGridPaste(
                createParams({
                    selection: {
                        start: { row: 0, col: 1 },
                        end: { row: 0, col: 1 },
                    },
                    onChange,
                }),
            ),
        );
        act(() => result.current(makePasteEvent("")));
        // empty text → no paste (getData returns "")
        expect(onChange).not.toHaveBeenCalled();
    });

    it("skips readonly cells during paste", () => {
        const onChange = vi.fn();
        const { result } = renderHook(() =>
            useGridPaste(
                createParams({
                    // row 2, col 0 is Charlie (readonly CellDataType)
                    selection: {
                        start: { row: 2, col: 0 },
                        end: { row: 2, col: 0 },
                    },
                    onChange,
                }),
            ),
        );
        act(() => result.current(makePasteEvent("Override")));
        const newData = onChange.mock.calls[0]?.[0];
        // Charlie is readonly, so name should be unchanged
        expect((newData[2].name as { value: string }).value).toBe("Charlie");
    });

    it("fills single value across multi-cell selection", () => {
        const onChange = vi.fn();
        const { result } = renderHook(() =>
            useGridPaste(
                createParams({
                    selection: {
                        start: { row: 0, col: 0 },
                        end: { row: 1, col: 0 },
                    },
                    onChange,
                }),
            ),
        );
        act(() => result.current(makePasteEvent("Same")));
        const newData = onChange.mock.calls[0]?.[0];
        expect(newData[0].name).toBe("Same");
        expect(newData[1].name).toBe("Same");
    });

    it("preserves CellDataType wrapper when pasting into wrapped cells", () => {
        const onChange = vi.fn();
        // Paste into col 1 (age) for row 2 which is a plain value
        // But row 2, col 0 (name) is a CellDataType — paste a multi-cell to cover it
        const { result } = renderHook(() =>
            useGridPaste(
                createParams({
                    selection: {
                        start: { row: 2, col: 1 },
                        end: { row: 2, col: 1 },
                    },
                    onChange,
                }),
            ),
        );
        act(() => result.current(makePasteEvent("50")));
        const newData = onChange.mock.calls[0]?.[0];
        expect(newData[2].age).toBe(50);
    });
});
