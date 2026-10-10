import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { GridSheet } from "./GridSheet.js";
import { testColumns, testData, testFooters } from "./test/fixtures.js";

afterEach(cleanup);

const texts = (els: NodeListOf<Element>) =>
    Array.from(els, (el) => el.textContent);

const cellAt = (container: HTMLElement, row: number, col: number) =>
    container.querySelector<HTMLElement>(
        `[data-row="${row}"][data-col="${col}"]`,
    )!;

describe("GridSheet", () => {
    it("renders a title row by default when columns have titles", () => {
        const { container } = render(
            <GridSheet columns={testColumns} data={testData} />,
        );
        expect(
            texts(container.querySelectorAll('[role="columnheader"]')),
        ).toEqual(["名前", "年齢", "コード", "有効", "役割"]);
        // タイトル行が 1 行あるので、データは row 1 から始まる
        expect(cellAt(container, 1, 0).textContent).toBe("");
        expect(cellAt(container, 1, 0).querySelector("input")?.value).toBe(
            "Alice",
        );
    });

    it("renders only the given headers in order", () => {
        const { container } = render(
            <GridSheet
                columns={testColumns}
                data={testData}
                headers={[
                    { type: "index", format: "upperAlpha" },
                    [{ body: "Group", span: 5 }],
                ]}
            />,
        );
        expect(
            texts(container.querySelectorAll('[role="columnheader"]')),
        ).toEqual(["A", "B", "C", "D", "E", "Group"]);
        expect(cellAt(container, 1, 0).style.gridColumn).toBe("1 / span 5");
    });

    it("renders rowHeaders with a select-all corner", () => {
        const { container } = render(
            <GridSheet
                columns={testColumns}
                data={testData}
                rowHeaders={[{ type: "index" }]}
            />,
        );
        expect(texts(container.querySelectorAll('[role="rowheader"]'))).toEqual(
            ["1", "2", "3"],
        );
        expect(cellAt(container, 0, 0).dataset.type).toBe("selectAll");
        // rowHeaders の列ぶんデータ列が右にずれる
        expect(cellAt(container, 1, 1).style.gridColumn).toBe("2");
    });

    it("wraps every logical row in a row element", () => {
        const { container } = render(
            <GridSheet
                columns={testColumns}
                data={testData}
                footers={testFooters}
                rowHeaders={[{ type: "index" }]}
            />,
        );
        // title 1 行 + データ 3 行 + フッター 1 行
        expect(container.querySelectorAll('[role="row"]')).toHaveLength(5);
        expect(cellAt(container, 4, 1).textContent).toBe("合計");
        expect(cellAt(container, 4, 1).className).toContain("dividerTop");
    });

    it("draws the divider under the last header row by default", () => {
        const { container } = render(
            <GridSheet
                columns={testColumns}
                data={testData}
                headers={[{ type: "index" }, { type: "title" }]}
            />,
        );
        expect(cellAt(container, 0, 0).className).not.toContain(
            "dividerBottom",
        );
        expect(cellAt(container, 1, 0).className).toContain("dividerBottom");
    });

    it("selects the whole column on column header click", () => {
        const { container } = render(
            <GridSheet columns={testColumns} data={testData} />,
        );
        fireEvent.mouseDown(cellAt(container, 0, 1));
        expect(cellAt(container, 0, 1).className).toContain("selected");
        expect(cellAt(container, 3, 1).className).toContain("selected");
        expect(cellAt(container, 3, 0).className).not.toContain("selected");
    });

    it("selects merged rows on row header click", () => {
        const { container } = render(
            <GridSheet
                columns={testColumns}
                data={testData}
                headers={[]}
                rowHeaders={[[{ body: "Group", rowSpan: 2 }]]}
            />,
        );
        fireEvent.mouseDown(cellAt(container, 0, 0));
        expect(cellAt(container, 0, 1).className).toContain("selected");
        expect(cellAt(container, 1, 5).className).toContain("selected");
        expect(cellAt(container, 2, 1).className).not.toContain("selected");
    });
});
