import { describe, expect, it, vi } from "vitest";
import {
    createPasteParams,
    makePasteEvent,
} from "../../../test/handlerHelpers.js";
import { handlePaste } from "./handlePaste.js";

describe("handlePaste", () => {
    it("does nothing while editing", () => {
        const onChange = vi.fn();
        const params = createPasteParams({
            editingCell: { row: 0, col: 0 },
            onChange,
        });
        handlePaste(makePasteEvent("X"), params);
        expect(onChange).not.toHaveBeenCalled();
    });

    it("does nothing without selection", () => {
        const onChange = vi.fn();
        const params = createPasteParams({ selection: null, onChange });
        handlePaste(makePasteEvent("X"), params);
        expect(onChange).not.toHaveBeenCalled();
    });

    it("does nothing without onChange", () => {
        const params = createPasteParams({ onChange: undefined });
        const e = makePasteEvent("X");
        handlePaste(e, params);
        expect(e.preventDefault).not.toHaveBeenCalled();
    });

    it("does nothing for empty clipboard text", () => {
        const onChange = vi.fn();
        const params = createPasteParams({ onChange });
        handlePaste(makePasteEvent(""), params);
        expect(onChange).not.toHaveBeenCalled();
    });

    it("pastes a single value into a single cell", () => {
        const onChange = vi.fn();
        const params = createPasteParams({ onChange });
        const e = makePasteEvent("Hello");
        handlePaste(e, params);
        const newData = onChange.mock.calls[0]?.[0];
        expect(newData[0].name.value).toBe("Hello");
        expect(e.preventDefault).toHaveBeenCalled();
    });

    it("pastes a TSV grid into multiple cells", () => {
        const onChange = vi.fn();
        const params = createPasteParams({ onChange });
        handlePaste(makePasteEvent("X\t99\nY\t88"), params);
        const newData = onChange.mock.calls[0]?.[0];
        expect(newData[0].name.value).toBe("X");
        expect(newData[0].age.value).toBe(99);
        expect(newData[1].name.value).toBe("Y");
        expect(newData[1].age.value).toBe(88);
    });

    it("normalizes CRLF line endings", () => {
        const onChange = vi.fn();
        const params = createPasteParams({ onChange });
        handlePaste(makePasteEvent("A\r\nB\r\n"), params);
        const newData = onChange.mock.calls[0]?.[0];
        expect(newData[0].name.value).toBe("A");
        expect(newData[1].name.value).toBe("B");
    });

    it("fills single value across multi-cell selection", () => {
        const onChange = vi.fn();
        const params = createPasteParams({
            onChange,
            selection: {
                start: { row: 0, col: 0 },
                end: { row: 1, col: 0 },
            },
        });
        handlePaste(makePasteEvent("Same"), params);
        const newData = onChange.mock.calls[0]?.[0];
        expect(newData[0].name.value).toBe("Same");
        expect(newData[1].name.value).toBe("Same");
    });

    it("constrains TSV paste to selection bounds when multi-cell", () => {
        const onChange = vi.fn();
        const params = createPasteParams({
            onChange,
            // 2x2 selection — TSV provides 3x3 but should clip to 2 cols × 2 rows
            selection: {
                start: { row: 0, col: 0 },
                end: { row: 1, col: 1 },
            },
        });
        handlePaste(makePasteEvent("a\tb\tc\nd\te\tf\ng\th\ti"), params);
        const newData = onChange.mock.calls[0]?.[0];
        expect(newData[0].name.value).toBe("a");
        // "b" は数値として無効なので age は元の値（30）のまま
        expect(newData[0].age.value).toBe(30);
        expect(newData[1].name.value).toBe("d");
        // 3行目は選択範囲外なので変更なし
        expect(newData[2].name.value).toBe("Charlie");
    });

    it("skips readonly cells during paste", () => {
        const onChange = vi.fn();
        // row 2 col 0 = Charlie (readonly)
        const params = createPasteParams({
            onChange,
            selection: {
                start: { row: 2, col: 0 },
                end: { row: 2, col: 0 },
            },
        });
        handlePaste(makePasteEvent("Override"), params);
        // 上書きされず、changedがfalseのままなのでrは元のオブジェクト → onChangeはまだ呼ばれる（newDataは生成される）
        const newData = onChange.mock.calls[0]?.[0];
        expect(newData[2].name.value).toBe("Charlie");
    });

    it("converts boolean values for check columns (TRUE/false/1/0)", () => {
        const onChange = vi.fn();
        const params = createPasteParams({
            onChange,
            selection: {
                start: { row: 0, col: 3 },
                end: { row: 1, col: 3 },
            },
        });
        handlePaste(makePasteEvent("TRUE\nfalse"), params);
        const newData = onChange.mock.calls[0]?.[0];
        expect(newData[0].active.value).toBe(true);
        expect(newData[1].active.value).toBe(false);
    });

    it("rejects invalid boolean values (non-true/false/1/0)", () => {
        const onChange = vi.fn();
        const params = createPasteParams({
            onChange,
            selection: {
                start: { row: 0, col: 3 },
                end: { row: 0, col: 3 },
            },
        });
        handlePaste(makePasteEvent("yes"), params);
        const newData = onChange.mock.calls[0]?.[0];
        // 元の値のままであること（true）— toExtDataでExtCellに包まれる
        expect(newData[0].active.value).toBe(true);
    });

    it("converts number cells from string TSV", () => {
        const onChange = vi.fn();
        const params = createPasteParams({
            onChange,
            selection: {
                start: { row: 0, col: 1 },
                end: { row: 1, col: 1 },
            },
        });
        handlePaste(makePasteEvent("42\n7"), params);
        const newData = onChange.mock.calls[0]?.[0];
        expect(newData[0].age.value).toBe(42);
        expect(newData[1].age.value).toBe(7);
    });

    it("rejects invalid select values not present in options", () => {
        const onChange = vi.fn();
        const params = createPasteParams({
            onChange,
            selection: {
                start: { row: 0, col: 4 },
                end: { row: 0, col: 4 },
            },
        });
        // testColumns role options = admin/user. "guest" は許可されない
        handlePaste(makePasteEvent("guest"), params);
        const newData = onChange.mock.calls[0]?.[0];
        // 値は変更されない（toExtDataでExtCellに包まれる）
        expect(newData[0].role.value).toBe("admin");
    });

    it("accepts valid select values", () => {
        const onChange = vi.fn();
        const params = createPasteParams({
            onChange,
            selection: {
                start: { row: 0, col: 4 },
                end: { row: 0, col: 4 },
            },
        });
        handlePaste(makePasteEvent("user"), params);
        const newData = onChange.mock.calls[0]?.[0];
        expect(newData[0].role.value).toBe("user");
    });
});
