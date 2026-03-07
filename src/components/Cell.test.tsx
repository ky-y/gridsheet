import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import {
    CheckCell,
    NumberCell,
    SelectCell,
    TextCell,
    RenderCell,
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
                style={undefined}
                className={undefined}
                onChangeValue={vi.fn()}
            />,
        );
        const input = screen.getByRole("spinbutton") as HTMLInputElement;
        expect(input.value).toBe("42");
    });
});

describe("TextCell", () => {
    it("renders text input with value", () => {
        render(
            <TextCell
                value="hello"
                readOnly={false}
                style={undefined}
                className={undefined}
                onChangeValue={vi.fn()}
            />,
        );
        const input = screen.getByRole("textbox") as HTMLInputElement;
        expect(input.value).toBe("hello");
    });
});

describe("renderCell", () => {
    it("dispatches to CheckCell for check type", () => {
        const col = { key: "active", type: "check" as const };
        const { container } = render(
            renderCell(col, true, false, undefined, undefined, vi.fn()),
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
            renderCell(col, "a", false, undefined, undefined, vi.fn()),
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
            renderCell(
                col,
                100,
                false,
                { fontWeight: "bold" },
                undefined,
                vi.fn(),
            ),
        );
        const input = container.querySelector("input") as HTMLInputElement;
        expect(input.style.textAlign).toBe("right"); // base style for number
        expect(input.style.color).toBe("blue"); // column style
        expect(input.style.fontWeight).toBe("bold"); // cell style
    });

    it("merges classNames from column and cell", () => {
        const col = {
            key: "name",
            type: "string" as const,
            className: "col-class",
        };
        const { container } = render(
            renderCell(col, "test", false, undefined, "cell-class", vi.fn()),
        );
        const input = container.querySelector("input") as HTMLInputElement;
        expect(input.className).toContain("col-class");
        expect(input.className).toContain("cell-class");
    });
});
