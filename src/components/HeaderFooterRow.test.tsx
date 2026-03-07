import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { renderHeaderFooterRow } from "./HeaderFooterRow.js";
import { testColumns, testHeaders, testFooters } from "../test/fixtures.js";

describe("renderHeaderFooterRow", () => {
    it("renders header cells with span using gridColumn", () => {
        const elements = renderHeaderFooterRow(
            testHeaders[0]!,
            testColumns,
            "h-0",
            "header",
        );
        const { container } = render(<div>{elements}</div>);
        const cells = container.querySelectorAll("div > div");
        // First cell has span 2
        expect(cells[0]!.textContent).toBe("個人情報");
        expect((cells[0] as HTMLElement).style.gridColumn).toBe("span 2");
        // Second cell has no span
        expect(cells[1]!.textContent).toBe("コード");
        expect((cells[1] as HTMLElement).style.gridColumn).toBe("");
    });

    it("pads remaining columns with empty cells", () => {
        const shortRow = [{ body: "Only one" }];
        const elements = renderHeaderFooterRow(
            shortRow,
            testColumns,
            "h-0",
            "header",
        );
        const { container } = render(<div>{elements}</div>);
        const cells = container.querySelectorAll("div > div");
        expect(cells).toHaveLength(5); // 5 columns total
        expect(cells[0]!.textContent).toBe("Only one");
        expect(cells[1]!.textContent).toBe("");
    });

    it("renders row number cell when provided", () => {
        const elements = renderHeaderFooterRow(
            testFooters[0]!,
            testColumns,
            "f-0",
            "footer",
            undefined,
            { content: "#" },
        );
        const { container } = render(<div>{elements}</div>);
        const cells = container.querySelectorAll("div > div");
        expect(cells[0]!.textContent).toBe("#");
    });

    it("highlights selected cells", () => {
        const elements = renderHeaderFooterRow(
            testHeaders[0]!,
            testColumns,
            "h-0",
            "header",
            {
                rowIndex: 0,
                colOffset: 0,
                selection: { start: { row: 0, col: 0 }, end: { row: 0, col: 1 } },
                cellType: "header",
            },
        );
        const { container } = render(<div>{elements}</div>);
        const cells = container.querySelectorAll("div > div");
        // First cell at col 0 should be selected
        expect(cells[0]!.className).toContain("selected");
    });
});
