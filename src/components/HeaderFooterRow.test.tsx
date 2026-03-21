import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { renderHeaderFooterRows } from "./HeaderFooterRow.js";
import { testColumns, testHeaders, testFooters } from "../test/fixtures.js";

describe("renderHeaderFooterRows", () => {
    it("renders header cells with span using gridColumn", () => {
        const elements = renderHeaderFooterRows(
            [testHeaders[0]!],
            testColumns,
            "h",
            "header",
            1,
        );
        const { container } = render(
            <div style={{ display: "grid" }}>{elements}</div>,
        );
        const cells = container.firstElementChild!.children;
        // First cell has span 2
        expect(cells[0]!.textContent).toBe("個人情報");
        expect((cells[0] as HTMLElement).style.gridColumn).toBe("1 / span 2");
        // Second cell has no span
        expect(cells[1]!.textContent).toBe("コード");
        expect((cells[1] as HTMLElement).style.gridColumn).toBe("3");
    });

    it("pads remaining columns with empty cells", () => {
        const shortRow = [{ body: "Only one" }];
        const elements = renderHeaderFooterRows(
            [shortRow],
            testColumns,
            "h",
            "header",
            1,
        );
        const { container } = render(
            <div style={{ display: "grid" }}>{elements}</div>,
        );
        const cells = container.firstElementChild!.children;
        expect(cells).toHaveLength(5); // 5 columns total
        expect(cells[0]!.textContent).toBe("Only one");
        expect(cells[1]!.textContent).toBe("");
    });

    it("renders row number cell when provided", () => {
        const elements = renderHeaderFooterRows(
            [testFooters[0]!],
            testColumns,
            "f",
            "footer",
            1,
            undefined,
            true,
            true,
        );
        const { container } = render(
            <div style={{ display: "grid" }}>{elements}</div>,
        );
        const cells = container.firstElementChild!.children;
        // First element is the row number cell
        expect(cells[0]!.textContent).toBe("");
        expect((cells[0] as HTMLElement).style.gridColumn).toBe("1");
    });

    it("highlights selected cells", () => {
        const elements = renderHeaderFooterRows(
            [testHeaders[0]!],
            testColumns,
            "h",
            "header",
            1,
            {
                rowOffset: 0,
                colOffset: 0,
                selection: {
                    start: { row: 0, col: 0 },
                    end: { row: 0, col: 1 },
                },
                cellType: "header",
            },
        );
        const { container } = render(
            <div style={{ display: "grid" }}>{elements}</div>,
        );
        const cells = container.firstElementChild!.children;
        // First cell at col 0 should be selected
        expect(cells[0]!.className).toContain("selected");
    });

    it("renders rowSpan cells with gridRow span", () => {
        const elements = renderHeaderFooterRows(
            [
                [
                    { body: "Merged", rowSpan: 2 },
                    { body: "A" },
                    { body: "B" },
                    { body: "C" },
                    { body: "D" },
                ],
                [
                    { body: "A2" },
                    { body: "B2" },
                    { body: "C2" },
                    { body: "D2" },
                ],
            ],
            testColumns,
            "h",
            "header",
            1,
        );
        const { container } = render(
            <div style={{ display: "grid" }}>{elements}</div>,
        );
        const cells = container.firstElementChild!.children;
        // First cell should have gridRow span 2
        expect(cells[0]!.textContent).toBe("Merged");
        expect((cells[0] as HTMLElement).style.gridRow).toBe("1 / span 2");
        // Second row should have 4 cells (column 0 is occupied by rowSpan)
        // Cells from row 2 start after row 1's 5 cells
        expect(cells[5]!.textContent).toBe("A2");
        expect((cells[5] as HTMLElement).style.gridColumn).toBe("2");
        expect((cells[5] as HTMLElement).style.gridRow).toBe("2");
    });
});
