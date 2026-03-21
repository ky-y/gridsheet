import { type CSSProperties, memo, useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn.js";
import type {
    CellType,
    CellTypeToValue,
    ColumnType,
    SelectOption,
} from "../types.js";

export type CellProps = {
    readOnly: boolean;
    editing: boolean;
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
}: Omit<CellProps, "editing"> & { value: unknown }) {
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
    editing,
    style,
    className,
    onChangeValue,
}: CellProps & { value: unknown; options: SelectOption[] }) {
    const [draft, setDraft] = useState(String(value ?? ""));

    useEffect(() => {
        if (editing) {
            setDraft(String(value ?? ""));
        }
    }, [editing, value]);

    return (
        <select
            value={editing ? draft : String(value ?? "")}
            disabled={readOnly}
            style={style}
            className={className}
            onChange={
                !readOnly && onChangeValue
                    ? (e) => {
                          if (editing) {
                              setDraft(e.target.value);
                          }
                          onChangeValue(e.target.value);
                      }
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
    editing,
    style,
    className,
    onChangeValue,
}: CellProps & { value: unknown }) {
    const [draft, setDraft] = useState(value != null ? String(value) : "");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editing) {
            setDraft(value != null ? String(value) : "");
        }
    }, [editing, value]);

    useEffect(() => {
        if (!editing || !inputRef.current) return;
        const el = inputRef.current;
        const raf = requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(el.value.length, el.value.length);
        });
        return () => cancelAnimationFrame(raf);
    }, [editing]);

    const handleBlur = () => {
        if (readOnly || !onChangeValue) return;
        const num = Number(draft);
        onChangeValue(Number.isNaN(num) || draft === "" ? 0 : num);
    };

    return (
        <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={editing ? draft : value != null ? String(value) : ""}
            readOnly={readOnly || !onChangeValue}
            style={style}
            className={className}
            onChange={
                !readOnly && onChangeValue
                    ? (e) => setDraft(e.target.value)
                    : undefined
            }
            onBlur={handleBlur}
        />
    );
}

export function NumberStringCell({
    value,
    readOnly,
    editing,
    style,
    className,
    onChangeValue,
}: CellProps & { value: unknown }) {
    const [draft, setDraft] = useState(value != null ? String(value) : "");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editing) {
            setDraft(value != null ? String(value) : "");
        }
    }, [editing, value]);

    useEffect(() => {
        if (!editing || !inputRef.current) return;
        const el = inputRef.current;
        const raf = requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(el.value.length, el.value.length);
        });
        return () => cancelAnimationFrame(raf);
    }, [editing]);

    const handleBlur = () => {
        if (readOnly || !onChangeValue) return;
        // Remove non-numeric characters, then ensure at most one leading dash and one dot
        let sanitized = draft.replace(/[^\d.-]/g, "");
        const negative = sanitized.startsWith("-");
        sanitized = sanitized.replace(/-/g, "");
        const parts = sanitized.split(".");
        sanitized =
            parts[0] + (parts.length > 1 ? `.${parts.slice(1).join("")}` : "");
        if (negative) sanitized = `-${sanitized}`;
        onChangeValue(sanitized);
    };

    return (
        <input
            ref={inputRef}
            type="text"
            value={editing ? draft : value != null ? String(value) : ""}
            readOnly={readOnly || !onChangeValue}
            style={style}
            className={className}
            onChange={
                !readOnly && onChangeValue
                    ? (e) => setDraft(e.target.value)
                    : undefined
            }
            onBlur={handleBlur}
        />
    );
}

export function TextCell({
    value,
    readOnly,
    editing,
    style,
    className,
    onChangeValue,
}: CellProps & { value: unknown }) {
    const [draft, setDraft] = useState(value != null ? String(value) : "");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editing) {
            setDraft(value != null ? String(value) : "");
        }
    }, [editing, value]);

    useEffect(() => {
        if (!editing || !inputRef.current) return;
        const el = inputRef.current;
        const raf = requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(el.value.length, el.value.length);
        });
        return () => cancelAnimationFrame(raf);
    }, [editing]);

    const handleBlur = () => {
        if (readOnly || !onChangeValue) return;
        onChangeValue(draft);
    };

    return (
        <input
            ref={inputRef}
            type="text"
            value={editing ? draft : value != null ? String(value) : ""}
            readOnly={readOnly || !onChangeValue}
            style={style}
            className={className}
            onChange={
                !readOnly && onChangeValue
                    ? (e) => setDraft(e.target.value)
                    : undefined
            }
            onBlur={handleBlur}
        />
    );
}

type RenderCellProps = {
    col: ColumnType;
    value: unknown;
    isReadonly: boolean;
    isEditing: boolean;
    cellStyle: CSSProperties | undefined;
    cellClassName: string | undefined;
    rowIndex: number;
    colKey: string;
    onCellChange:
        | ((
              rowIndex: number,
              colKey: string,
              newValue: CellTypeToValue[CellType],
          ) => void)
        | undefined;
};

export const RenderCell = memo(function RenderCell({
    col,
    value,
    isReadonly,
    isEditing,
    cellStyle,
    cellClassName,
    rowIndex,
    colKey,
    onCellChange,
}: RenderCellProps) {
    const onChangeValue = onCellChange
        ? (newValue: CellTypeToValue[CellType]) =>
              onCellChange(rowIndex, colKey, newValue)
        : undefined;
    const style: CSSProperties | undefined =
        col.style || cellStyle ? { ...col.style, ...cellStyle } : undefined;
    const className = cn(col.cellClassName, cellClassName) || undefined;
    const readOnly = isReadonly || col.readonly === true;
    const editing = isEditing;
    const baseProps = { readOnly, style, className, onChangeValue };

    switch (col.type) {
        case "check":
            return <CheckCell value={value} {...baseProps} />;
        case "select":
            return (
                <SelectCell
                    value={value}
                    options={col.options}
                    editing={editing}
                    {...baseProps}
                />
            );
        case "number":
            return (
                <NumberCell value={value} editing={editing} {...baseProps} />
            );
        case "numberString":
            return (
                <NumberStringCell
                    value={value}
                    editing={editing}
                    {...baseProps}
                />
            );
        default:
            return <TextCell value={value} editing={editing} {...baseProps} />;
    }
});
