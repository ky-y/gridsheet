import { type CSSProperties, memo } from "react";
import { cn } from "@/utils/cn.js";
import type {
    CellType,
    CellTypeToValue,
    ColumnType,
    SelectOption,
} from "../types.js";

export type CellProps = {
    readOnly: boolean;
    style: CSSProperties | undefined;
    className: string | undefined;
    onChangeValue: ((newValue: CellTypeToValue[CellType]) => void) | undefined;
};

export function CheckCell({
    value,
    readOnly,
    style,
    className,
    onChangeValue,
}: CellProps & { value: unknown }) {
    return (
        <input
            type="checkbox"
            checked={Boolean(value)}
            readOnly={readOnly || !onChangeValue}
            disabled={readOnly}
            style={style}
            className={className}
            onChange={
                !readOnly && onChangeValue
                    ? (e) => onChangeValue(e.target.checked)
                    : undefined
            }
        />
    );
}

export function SelectCell({
    value,
    options,
    readOnly,
    style,
    className,
    onChangeValue,
}: CellProps & { value: unknown; options: SelectOption[] }) {
    return (
        <select
            value={String(value ?? "")}
            disabled={readOnly}
            style={style}
            className={className}
            onChange={
                !readOnly && onChangeValue
                    ? (e) => onChangeValue(e.target.value)
                    : undefined
            }
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}

export function NumberCell({
    value,
    readOnly,
    style,
    className,
    onChangeValue,
}: CellProps & { value: unknown }) {
    return (
        <input
            type="number"
            value={value != null ? String(value) : ""}
            readOnly={readOnly || !onChangeValue}
            style={style}
            className={className}
            onChange={
                !readOnly && onChangeValue
                    ? (e) => onChangeValue(Number(e.target.value))
                    : undefined
            }
        />
    );
}

export function TextCell({
    value,
    readOnly,
    style,
    className,
    onChangeValue,
}: CellProps & { value: unknown }) {
    return (
        <input
            type="text"
            value={value != null ? String(value) : ""}
            readOnly={readOnly || !onChangeValue}
            style={style}
            className={className}
            onChange={
                !readOnly && onChangeValue
                    ? (e) => onChangeValue(e.target.value)
                    : undefined
            }
        />
    );
}

type RenderCellProps = {
    col: ColumnType;
    value: unknown;
    isReadonly: boolean;
    cellStyle: CSSProperties | undefined;
    cellClassName: string | undefined;
    onChangeValue: ((newValue: CellTypeToValue[CellType]) => void) | undefined;
};

export const RenderCell = memo(function RenderCell({
    col,
    value,
    isReadonly,
    cellStyle,
    cellClassName,
    onChangeValue,
}: RenderCellProps) {
    const baseStyle: CSSProperties | undefined =
        col.type === "number" || col.type === "numberString"
            ? { textAlign: "right" }
            : undefined;
    const style: CSSProperties | undefined =
        baseStyle || col.style || cellStyle
            ? { ...baseStyle, ...col.style, ...cellStyle }
            : undefined;
    const className = cn(col.className, cellClassName) || undefined;
    const readOnly = isReadonly || col.readonly === true;
    const props = { readOnly, style, className, onChangeValue };

    switch (col.type) {
        case "check":
            return <CheckCell value={value} {...props} />;
        case "select":
            return (
                <SelectCell value={value} options={col.options} {...props} />
            );
        case "number":
            return <NumberCell value={value} {...props} />;
        default:
            return <TextCell value={value} {...props} />;
    }
});
