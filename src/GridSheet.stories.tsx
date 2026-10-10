import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { GridSheet } from "./GridSheet.js";
import { createCol, type ColumnType, type Row } from "./types.js";

const columns = [
    createCol("name", "string", { title: "Name", width: "120px" }),
    createCol("score", "number", { title: "Score" }),
    createCol("active", "check", { title: "Active" }),
    createCol("note", "numberString", { title: "Note" }),
] as const satisfies readonly ColumnType[];

type SampleRow = Row<typeof columns>;

const sampleData: SampleRow[] = [
    { name: "Alice", score: 95, active: true, note: "100" },
    { name: "Bob", score: 82, active: false, note: "200" },
    { name: "Charlie", score: 73, active: true, note: "300" },
    { name: "Diana", score: 91, active: true, note: "400" },
    { name: "Eve", score: 68, active: false, note: "500" },
];

const meta = {
    title: "GridSheet",
    component: GridSheet,
    parameters: {
        layout: "padded",
    },
    tags: ["autodocs"],
    args: {
        onSelectionChange: fn(),
    },
} satisfies Meta<typeof GridSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        columns,
        data: sampleData,
    },
};

export const WithRowHeaders: Story = {
    args: {
        columns,
        data: sampleData,
        rowHeaders: [{ type: "index" }],
    },
};

// スプレッドシート風: 列は A, B, C…、行は 1, 2, 3…
export const SpreadsheetStyle: Story = {
    args: {
        columns,
        data: sampleData,
        headers: [{ type: "index", format: "upperAlpha" }, { type: "title" }],
        rowHeaders: [{ type: "index" }],
    },
};

export const WithHeaders: Story = {
    args: {
        columns,
        data: sampleData,
        configs: {
            selectableRowHeaders: true,
        },
        rowHeaders: [{ type: "index" }],
        headers: [
            [
                { body: "Personal", span: 2 },
                { body: "Status", span: 2 },
            ],
            { type: "title" },
        ],
    },
};

// divider で太線の有無を行ごとに切り替える
export const CustomDividers: Story = {
    args: {
        columns,
        data: sampleData,
        rowHeaders: [{ type: "index", format: "lowerAlpha", divider: false }],
        headers: [
            {
                cells: [
                    { body: "Personal", span: 2 },
                    { body: "Status", span: 2 },
                ],
                divider: true,
            },
            { type: "title", divider: false },
        ],
    },
};

// rowHeaders もセルを並べられ、rowSpan で縦に結合できる
export const GroupedRowHeaders: Story = {
    args: {
        columns,
        data: sampleData,
        rowHeaders: [
            {
                cells: [
                    { body: "Team A", rowSpan: 3 },
                    { body: "Team B", rowSpan: 2 },
                ],
                width: "80px",
            },
            { type: "index" },
        ],
    },
};

export const WithFooters: Story = {
    args: {
        columns,
        data: sampleData,
        rowHeaders: [{ type: "index" }],
        footers: [
            [{ body: "Total" }, { body: "409" }, { body: "" }, { body: "" }],
        ],
    },
};

export const WithHeadersAndFooters: Story = {
    args: {
        columns,
        data: sampleData,
        configs: {
            selectableRowHeaders: true,
        },
        rowHeaders: [{ type: "index" }],
        headers: [
            [
                { body: "Personal", span: 2 },
                { body: "Status", span: 2 },
            ],
            { type: "title" },
        ],
        footers: [
            [{ body: "Total" }, { body: "409" }, { body: "" }, { body: "" }],
        ],
    },
};

const selectColumns = [
    createCol("name", "string", { title: "Name", width: "120px" }),
    createCol("role", "select", {
        title: "Role",
        width: "120px",
        options: [
            { label: "Admin", value: "admin" },
            { label: "Editor", value: "editor" },
            { label: "Viewer", value: "viewer" },
        ],
    }),
    createCol("score", "number", { title: "Score" }),
] as const satisfies readonly ColumnType[];

export const WithSelectColumn: Story = {
    args: {
        columns: selectColumns,
        data: [
            { name: "Alice", role: "admin", score: 95 },
            { name: "Bob", role: "editor", score: 82 },
            { name: "Charlie", role: "viewer", score: 73 },
        ] as Row<typeof selectColumns>[],
    },
};

const readonlyColumns = [
    createCol("name", "string", {
        title: "Name",
        width: "120px",
        readonly: true,
    }),
    createCol("score", "number", { title: "Score", readonly: true }),
    createCol("active", "check", { title: "Active", readonly: true }),
] as const satisfies readonly ColumnType[];

export const ReadOnly: Story = {
    args: {
        columns: readonlyColumns,
        data: [
            { name: "Alice", score: 95, active: true },
            { name: "Bob", score: 82, active: false },
        ] as Row<typeof readonlyColumns>[],
    },
};

function InteractiveWrapper() {
    const [data, setData] = useState<SampleRow[]>(sampleData);
    return (
        <div>
            <GridSheet
                columns={columns}
                data={data}
                onChange={setData}
                configs={{ selectableRowHeaders: true }}
                rowHeaders={[{ type: "index" }]}
                headers={[
                    [
                        { body: "Personal", span: 2 },
                        { body: "Status", span: 2 },
                    ],
                    { type: "title" },
                ]}
            />
        </div>
    );
}

export const Interactive: Story = {
    render: () => <InteractiveWrapper />,
    args: {
        columns,
        data: sampleData,
    },
};
