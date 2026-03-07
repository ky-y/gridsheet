import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { NumberCell } from "./Cell.js";
import styles from "./Cell.module.scss";

const cellDecorator = (Story: () => React.JSX.Element) => (
    <div className={styles.cell} style={{ width: 200 }}>
        <Story />
    </div>
);

const meta = {
    title: "Components/NumberCell",
    component: NumberCell,
    decorators: [cellDecorator],
    parameters: { layout: "centered" },
    tags: ["autodocs"],
    args: {
        onChangeValue: fn(),
    },
} satisfies Meta<typeof NumberCell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        value: 42,
        readOnly: false,
        style: undefined,
        className: undefined,
    },
};

export const ReadOnly: Story = {
    args: {
        value: 100,
        readOnly: true,
        style: undefined,
        className: undefined,
    },
};

export const Zero: Story = {
    args: {
        value: 0,
        readOnly: false,
        style: undefined,
        className: undefined,
    },
};

export const RightAligned: Story = {
    args: {
        value: 12345,
        readOnly: false,
        style: undefined,
        className: undefined,
    },
};
