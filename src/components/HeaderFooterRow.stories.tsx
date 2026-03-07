import type { Meta, StoryObj } from "@storybook/react-vite";
import { renderHeaderFooterRow } from "./HeaderFooterRow.js";
import { createCol, type ColumnType } from "../types.js";

const columns = [
    createCol("name", "string", { title: "Name", width: "120px" }),
    createCol("score", "number", { title: "Score" }),
    createCol("active", "check", { title: "Active" }),
    createCol("note", "numberString", { title: "Note" }),
] as const satisfies readonly ColumnType[];

function HeaderRowWrapper() {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr 1fr" }}>
            {renderHeaderFooterRow(
                [
                    { body: "Personal", span: 2 },
                    { body: "Status", span: 2 },
                ],
                columns,
                "header-0",
                "header",
            )}
        </div>
    );
}

function FooterRowWrapper() {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr 1fr" }}>
            {renderHeaderFooterRow(
                [
                    { body: "Total" },
                    { body: "409" },
                    { body: "" },
                    { body: "" },
                ],
                columns,
                "footer-0",
                "footer",
            )}
        </div>
    );
}

function HeaderWithSpanWrapper() {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr 1fr" }}>
            {renderHeaderFooterRow(
                [
                    { body: "All Columns", span: 4 },
                ],
                columns,
                "header-span",
                "header",
            )}
        </div>
    );
}

function HeaderWithSelectionWrapper() {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr 1fr" }}>
            {renderHeaderFooterRow(
                [
                    { body: "Col A" },
                    { body: "Col B" },
                    { body: "Col C" },
                    { body: "Col D" },
                ],
                columns,
                "header-sel",
                "header",
                {
                    rowIndex: 0,
                    colOffset: 0,
                    selection: { start: { row: 0, col: 1 }, end: { row: 0, col: 2 } },
                    cellType: "header",
                },
            )}
        </div>
    );
}

const meta = {
    title: "Components/HeaderFooterRow",
    component: HeaderRowWrapper,
    parameters: { layout: "padded" },
    tags: ["autodocs"],
} satisfies Meta<typeof HeaderRowWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Header: Story = {
    render: () => <HeaderRowWrapper />,
};

export const Footer: Story = {
    render: () => <FooterRowWrapper />,
};

export const FullSpanHeader: Story = {
    render: () => <HeaderWithSpanWrapper />,
};

export const HeaderWithSelection: Story = {
    render: () => <HeaderWithSelectionWrapper />,
};
