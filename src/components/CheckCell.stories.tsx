import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { CheckCell } from "./Cell.js";
import styles from "./Cell.module.scss";

const cellDecorator = (Story: () => React.JSX.Element) => (
    <div className={styles.cell} style={{ width: 200 }}>
        <Story />
    </div>
);

const meta = {
    title: "Components/CheckCell",
    component: CheckCell,
    decorators: [cellDecorator],
    parameters: { layout: "centered" },
    tags: ["autodocs"],
    args: {
        onChangeValue: fn(),
    },
} satisfies Meta<typeof CheckCell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Checked: Story = {
    args: {
        value: true,
        readOnly: false,
        style: undefined,
        className: undefined,
    },
};

export const Unchecked: Story = {
    args: {
        value: false,
        readOnly: false,
        style: undefined,
        className: undefined,
    },
};

export const ReadOnly: Story = {
    args: {
        value: true,
        readOnly: true,
        style: undefined,
        className: undefined,
    },
};
