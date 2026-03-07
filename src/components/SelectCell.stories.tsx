import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { SelectCell } from "./Cell.js";
import styles from "./Cell.module.scss";

const sampleOptions = [
    { label: "Admin", value: "admin" },
    { label: "Editor", value: "editor" },
    { label: "Viewer", value: "viewer" },
];

const cellDecorator = (Story: () => React.JSX.Element) => (
    <div className={styles.cell} style={{ width: 200 }}>
        <Story />
    </div>
);

const meta = {
    title: "Components/SelectCell",
    component: SelectCell,
    decorators: [cellDecorator],
    parameters: { layout: "centered" },
    tags: ["autodocs"],
    args: {
        options: sampleOptions,
        onChangeValue: fn(),
    },
} satisfies Meta<typeof SelectCell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        value: "editor",
        readOnly: false,
        style: undefined,
        className: undefined,
    },
};

export const ReadOnly: Story = {
    args: {
        value: "admin",
        readOnly: true,
        style: undefined,
        className: undefined,
    },
};

export const FirstOption: Story = {
    args: {
        value: "admin",
        readOnly: false,
        style: undefined,
        className: undefined,
    },
};
