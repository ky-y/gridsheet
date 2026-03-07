import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { CheckCell, NumberCell, SelectCell, TextCell } from "./Cell.js";
import styles from "./Cell.module.scss";

const cellDecorator = (Story: () => React.JSX.Element) => (
    <div className={styles.cell} style={{ width: 200 }}>
        <Story />
    </div>
);

// --- TextCell ---

const textMeta = {
    title: "Components/TextCell",
    component: TextCell,
    decorators: [cellDecorator],
    parameters: { layout: "centered" },
    tags: ["autodocs"],
    args: {
        onChangeValue: fn(),
    },
} satisfies Meta<typeof TextCell>;

export default textMeta;
type TextStory = StoryObj<typeof textMeta>;

export const Default: TextStory = {
    args: {
        value: "Hello",
        readOnly: false,
        style: undefined,
        className: undefined,
    },
};

export const ReadOnly: TextStory = {
    args: {
        value: "Read only text",
        readOnly: true,
        style: undefined,
        className: undefined,
    },
};

export const Empty: TextStory = {
    args: {
        value: "",
        readOnly: false,
        style: undefined,
        className: undefined,
    },
};

export const WithStyle: TextStory = {
    args: {
        value: "Styled",
        readOnly: false,
        style: { color: "blue", fontWeight: "bold" },
        className: undefined,
    },
};
