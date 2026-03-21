import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
    CheckCell,
    NumberCell,
    NumberStringCell,
    RenderCell,
    SelectCell,
    TextCell,
} from "./Cell.js";

afterEach(cleanup);

describe("CheckCell", () => {
    it("renders checked checkbox", () => {
        render(
            <CheckCell
                value={true}
                readOnly={false}
                style={undefined}
                className={undefined}
                onChangeValue={vi.fn()}
            />,
        );
        const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
        expect(checkbox.checked).toBe(true);
        expect(checkbox.disabled).toBe(false);
    });

    it("renders disabled checkbox when readOnly", () => {
        render(
            <CheckCell
                value={false}
                readOnly={true}
                style={undefined}
                className={undefined}
                onChangeValue={undefined}
            />,
        );
        const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
        expect(checkbox.disabled).toBe(true);
    });
});

describe("SelectCell", () => {
    it("renders select with options", () => {
        const options = [
            { label: "A", value: "a" },
            { label: "B", value: "b" },
        ];
        render(
            <SelectCell
                value="b"
                options={options}
                readOnly={false}
                editing={false}
                style={undefined}
                className={undefined}
                onChangeValue={vi.fn()}
            />,
        );
        const select = screen.getByRole("combobox") as HTMLSelectElement;
        expect(select.value).toBe("b");
        expect(screen.getAllByRole("option")).toHaveLength(2);
    });
});

describe("NumberCell", () => {
    it("renders number input with value", () => {
        render(
            <NumberCell
                value={42}
                readOnly={false}
                editing={false}
                style={undefined}
                className={undefined}
                onChangeValue={vi.fn()}
            />,
        );
        const input = screen.getByRole("textbox") as HTMLInputElement;
        expect(input.value).toBe("42");
    });
});

describe("TextCell", () => {
    it("renders text input with value", () => {
        render(
            <TextCell
                value="hello"
                readOnly={false}
                editing={false}
                style={undefined}
                className={undefined}
                onChangeValue={vi.fn()}
            />,
        );
        const input = screen.getByRole("textbox") as HTMLInputElement;
        expect(input.value).toBe("hello");
    });
});

describe("NumberStringCell", () => {
    function renderEditing(initialValue: string) {
        const onChangeValue = vi.fn();
        render(
            <NumberStringCell
                value={initialValue}
                readOnly={false}
                editing={true}
                style={undefined}
                className={undefined}
                onChangeValue={onChangeValue}
            />,
        );
        return { onChangeValue };
    }

    it("passes through valid number string on blur", () => {
        const { onChangeValue } = renderEditing("123.45");
        const input = screen.getByRole("textbox") as HTMLInputElement;
        fireEvent.blur(input);
        expect(onChangeValue).toHaveBeenCalledWith("123.45");
    });

    it("passes through valid negative number string on blur", () => {
        const { onChangeValue } = renderEditing("-42.5");
        const input = screen.getByRole("textbox") as HTMLInputElement;
        fireEvent.blur(input);
        expect(onChangeValue).toHaveBeenCalledWith("-42.5");
    });

    it("removes multiple dashes", () => {
        const { onChangeValue } = renderEditing("");
        const input = screen.getByRole("textbox") as HTMLInputElement;
        fireEvent.change(input, { target: { value: "--5" } });
        fireEvent.blur(input);
        expect(onChangeValue).toHaveBeenCalledWith("-5");
    });

    it("removes multiple dots", () => {
        const { onChangeValue } = renderEditing("");
        const input = screen.getByRole("textbox") as HTMLInputElement;
        fireEvent.change(input, { target: { value: "1.2.3" } });
        fireEvent.blur(input);
        expect(onChangeValue).toHaveBeenCalledWith("1.23");
    });

    it("sanitizes mixed invalid characters", () => {
        const { onChangeValue } = renderEditing("");
        const input = screen.getByRole("textbox") as HTMLInputElement;
        fireEvent.change(input, { target: { value: "--5.5.5abc" } });
        fireEvent.blur(input);
        expect(onChangeValue).toHaveBeenCalledWith("-5.55");
    });

    it("strips non-numeric characters", () => {
        const { onChangeValue } = renderEditing("");
        const input = screen.getByRole("textbox") as HTMLInputElement;
        fireEvent.change(input, { target: { value: "abc123def" } });
        fireEvent.blur(input);
        expect(onChangeValue).toHaveBeenCalledWith("123");
    });

    it("handles dash in middle of string", () => {
        const { onChangeValue } = renderEditing("");
        const input = screen.getByRole("textbox") as HTMLInputElement;
        fireEvent.change(input, { target: { value: "12-34" } });
        fireEvent.blur(input);
        expect(onChangeValue).toHaveBeenCalledWith("1234");
    });

    it("does not call onChangeValue when readOnly", () => {
        const onChangeValue = vi.fn();
        render(
            <NumberStringCell
                value="123"
                readOnly={true}
                editing={true}
                style={undefined}
                className={undefined}
                onChangeValue={onChangeValue}
            />,
        );
        const input = screen.getByRole("textbox") as HTMLInputElement;
        fireEvent.blur(input);
        expect(onChangeValue).not.toHaveBeenCalled();
    });
});

describe("RenderCell", () => {
    it("dispatches to CheckCell for check type", () => {
        const col = { key: "active", type: "check" as const };
        const { container } = render(
            <RenderCell
                col={col}
                value={true}
                isReadonly={false}
                isEditing={false}
                cellStyle={undefined}
                cellClassName={undefined}
                rowIndex={0}
                colKey="active"
                onCellChange={vi.fn()}
            />,
        );
        expect(container.querySelector("input[type='checkbox']")).toBeTruthy();
    });

    it("dispatches to SelectCell for select type", () => {
        const col = {
            key: "role",
            type: "select" as const,
            options: [{ label: "A", value: "a" }],
        };
        const { container } = render(
            <RenderCell
                col={col}
                value="a"
                isReadonly={false}
                isEditing={false}
                cellStyle={undefined}
                cellClassName={undefined}
                rowIndex={0}
                colKey="role"
                onCellChange={vi.fn()}
            />,
        );
        expect(container.querySelector("select")).toBeTruthy();
    });

    it("applies merged styles (base + column + cell)", () => {
        const col = {
            key: "price",
            type: "number" as const,
            style: { color: "blue" },
        };
        const { container } = render(
            <RenderCell
                col={col}
                value={100}
                isReadonly={false}
                isEditing={false}
                cellStyle={{ fontWeight: "bold" }}
                cellClassName={undefined}
                rowIndex={0}
                colKey="price"
                onCellChange={vi.fn()}
            />,
        );
        const input = container.querySelector("input") as HTMLInputElement;
        expect(input.style.color).toBe("blue"); // column style
        expect(input.style.fontWeight).toBe("bold"); // cell style
    });

    it("merges classNames from column and cell", () => {
        const col = {
            key: "name",
            type: "string" as const,
            cellClassName: "col-class",
        };
        const { container } = render(
            <RenderCell
                col={col}
                value="test"
                isReadonly={false}
                isEditing={false}
                cellStyle={undefined}
                cellClassName="cell-class"
                rowIndex={0}
                colKey="name"
                onCellChange={vi.fn()}
            />,
        );
        const input = container.querySelector("input") as HTMLInputElement;
        expect(input.className).toContain("col-class");
        expect(input.className).toContain("cell-class");
    });
});
