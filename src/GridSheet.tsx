import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn.js";
import { RenderCell } from "./components/Cell.js";
import cellStyles from "./components/Cell.module.scss";
import { renderHeaderFooterRows } from "./components/HeaderFooterRow.js";
import styles from "./GridSheet.module.scss";
import { useGridKeyboard } from "./hooks/useGridKeyboard.js";
import { useGridMouse } from "./hooks/useGridMouse.js";
import { useGridPaste } from "./hooks/useGridPaste.js";
import type {
    CellAddress,
    CellType,
    CellTypeToValue,
    ColumnType,
    GridSheetType,
    Row,
} from "./types.js";
import {
    getCellRaw,
    isSelected,
    resolveCell,
    toExtData,
} from "./utils/grid.js";

export const GridSheet = <const C extends readonly ColumnType[]>({
    className,
    columns,
    data,
    headers,
    footers,
    configs,
    onChange,
    onSelectionChange,
}: {
    className?: string;
} & GridSheetType<C>) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selection, setSelection] = useState<{
        start: CellAddress;
        end: CellAddress;
    } | null>(null);
    const [editingCell, setEditingCell] = useState<CellAddress | null>(null);

    const hasTitle = columns.some((col) => col.title != null);
    const showRowNumbers = configs?.showRowNumbers === true;
    const selectableRowNumbers =
        configs?.selectableRowNumbers === true && showRowNumbers;
    const scrollToSelection = configs?.scrollToSelection !== false;

    const colOffset = showRowNumbers ? 1 : 0;

    const dataRef = useRef(data);
    dataRef.current = data;
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const columnsRef = useRef(columns);
    columnsRef.current = columns;

    const handleCellChange = useCallback(
        (
            rowIndex: number,
            colKey: string,
            newValue: CellTypeToValue[CellType],
        ) => {
            const currentOnChange = onChangeRef.current;
            if (!currentOnChange) return;
            const currentData = dataRef.current;
            const newData = currentData.map((r, i) =>
                i === rowIndex ? ({ ...r, [colKey]: newValue } as Row<C>) : r,
            );
            currentOnChange(toExtData(newData));
        },
        [],
    );

    const gridTemplateColumns = [
        ...(showRowNumbers ? ["3rem"] : []),
        ...columns.map((col) => {
            if (typeof col.width === "number") return `${col.width}fr`;
            if (typeof col.width === "string") return col.width;
            return "auto";
        }),
    ].join(" ");

    let nextRow = 0;
    const titleRowIndex = hasTitle ? nextRow++ : -1;
    const headerRowOffset = headers?.length ? nextRow : -1;
    if (headers?.length) nextRow += headers.length;
    const dataRowOffset = nextRow;
    const footerRowOffset = dataRowOffset + data.length;

    // CSS grid rows are 1-based
    const titleCssRow = hasTitle ? 1 : -1;
    const headerCssRowStart = (hasTitle ? 1 : 0) + 1;
    const dataCssRowStart = headerCssRowStart + (headers?.length ?? 0);
    const footerCssRowStart = dataCssRowStart + data.length;

    const minRow = hasTitle
        ? titleRowIndex
        : headers?.length
          ? headerRowOffset
          : dataRowOffset;
    const maxRow = footers?.length
        ? footerRowOffset + footers.length - 1
        : dataRowOffset + data.length - 1;
    const minCol = selectableRowNumbers ? 0 : colOffset;
    const maxCol = columns.length - 1 + colOffset;
    const fullMinCol = showRowNumbers ? 0 : colOffset;

    // 編集モード時にinputをフォーカス
    useEffect(() => {
        if (!editingCell || !containerRef.current) return;
        const cell = containerRef.current.querySelector<HTMLElement>(
            `[data-row="${editingCell.row}"][data-col="${editingCell.col}"]`,
        );
        if (!cell) return;
        const input = cell.querySelector<HTMLInputElement | HTMLSelectElement>(
            "input, select",
        );
        if (input) {
            input.focus();
            if (input instanceof HTMLInputElement && input.type === "text") {
                const len = input.value.length;
                input.setSelectionRange(len, len);
            }
        }
    }, [editingCell]);

    // GridSheet外クリックでeditingモード・選択モード終了
    useEffect(() => {
        if (!editingCell && !selection) return;
        const handleOutsideClick = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setEditingCell(null);
                setSelection(null);
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () =>
            document.removeEventListener("mousedown", handleOutsideClick);
    }, [editingCell, selection]);

    // 選択セルが画面外に出た場合にスクロール
    // 列全選択・行全選択・全選択時はスクロールしない
    useEffect(() => {
        if (!scrollToSelection || !selection || !containerRef.current) return;
        const isFullRowSpan =
            selection.start.row === minRow && selection.end.row === maxRow;
        const isFullColSpan =
            selection.start.col === fullMinCol && selection.end.col === maxCol;
        if (isFullRowSpan || isFullColSpan) return;
        const targetRow = selection.end.row;
        const targetCol = selection.end.col;
        const cell = containerRef.current.querySelector<HTMLElement>(
            `[data-row="${targetRow}"][data-col="${targetCol}"]`,
        );
        if (cell) {
            cell.scrollIntoView({ block: "nearest", inline: "nearest" });
        }
    }, [scrollToSelection, selection, minRow, maxRow, fullMinCol, maxCol]);

    const { handleMouseDown, handleMouseMove } = useGridMouse({
        selection,
        setSelection,
        setEditingCell,
        containerRef,
        onSelectionChange,
        minRow,
        fullMinCol,
        maxRow,
        maxCol,
        data,
        columns,
        colOffset,
        dataRowOffset,
    });

    const handleKeyDown = useGridKeyboard({
        editingCell,
        setEditingCell,
        containerRef,
        selection,
        setSelection,
        onSelectionChange,
        columns,
        data,
        headers,
        onChange,
        colOffset,
        titleRowIndex,
        hasTitle,
        headerRowOffset,
        dataRowOffset,
        showRowNumbers,
        minRow,
        maxRow,
        minCol,
        maxCol,
        fullMinCol,
    });

    const handlePaste = useGridPaste({
        editingCell,
        selection,
        onChange,
        data,
        dataRowOffset,
        colOffset,
        columns,
    });

    return (
        <div
            ref={containerRef}
            className={cn(styles.GridSheet, className)}
            style={{ gridTemplateColumns }}
            role="grid"
            tabIndex={0}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
        >
            {showRowNumbers &&
                (hasTitle || (headers?.length ?? 0) > 0) &&
                (() => {
                    const cornerSpan =
                        (hasTitle ? 1 : 0) + (headers?.length ?? 0);
                    const canSelectAll = selectableRowNumbers;
                    return (
                        <div
                            key="select-all"
                            className={cn(
                                styles.selectAll,
                                isSelected(minRow, 0, selection)
                                    ? styles.selected
                                    : undefined,
                            )}
                            style={{
                                gridRow: `1 / span ${cornerSpan}`,
                                gridColumn: 1,
                            }}
                            role="columnheader"
                            data-row={minRow}
                            data-col={0}
                            {...(canSelectAll
                                ? { "data-type": "selectAll" }
                                : {})}
                        />
                    );
                })()}
            {hasTitle &&
                columns.map((col, colIndex) => {
                    const absCol = colIndex + colOffset;
                    const selected = isSelected(
                        titleRowIndex,
                        absCol,
                        selection,
                    );
                    return (
                        <div
                            key={`title-${col.key}`}
                            data-row={titleRowIndex}
                            data-col={absCol}
                            data-type="title"
                            role="columnheader"
                            style={{
                                gridRow: titleCssRow,
                                gridColumn: colIndex + (showRowNumbers ? 2 : 1),
                            }}
                            className={cn(
                                styles.titleCell,
                                col.titleClassName,
                                selected ? styles.selected : undefined,
                            )}
                        >
                            {col.title ?? ""}
                        </div>
                    );
                })}
            {headers &&
                headers.length > 0 &&
                renderHeaderFooterRows(
                    headers,
                    columns,
                    "header",
                    "header",
                    headerCssRowStart,
                    {
                        rowOffset: headerRowOffset,
                        colOffset,
                        selection,
                        cellType: "header",
                    },
                    showRowNumbers,
                    false, // select-allセルが行番号列をカバーする
                )}
            {data.map((row, rowIndex) => {
                const absoluteRow = dataRowOffset + rowIndex;
                const rowNum = rowIndex + 1;
                const cssRow = dataCssRowStart + rowIndex;
                return (
                    <div
                        key={rowIndex}
                        role="row"
                        style={{ display: "contents" }}
                    >
                        {showRowNumbers && (
                            <div
                                key={`rn-${rowIndex}`}
                                className={cn(
                                    styles.rowNumber,
                                    isSelected(absoluteRow, 0, selection)
                                        ? styles.selected
                                        : undefined,
                                )}
                                style={{ gridRow: cssRow, gridColumn: 1 }}
                                role="rowheader"
                                data-row={absoluteRow}
                                data-col={0}
                                data-type="rowNumber"
                            >
                                {rowNum}
                            </div>
                        )}
                        {columns.map((col, colIndex) => {
                            const absCol = colIndex + colOffset;
                            const raw = getCellRaw(row, col.key);
                            const cell = resolveCell(raw);
                            const selected = isSelected(
                                absoluteRow,
                                absCol,
                                selection,
                            );

                            return (
                                <div
                                    key={`${rowIndex}-${col.key}`}
                                    data-row={absoluteRow}
                                    data-col={absCol}
                                    role="gridcell"
                                    style={{
                                        gridRow: cssRow,
                                        gridColumn:
                                            colIndex + (showRowNumbers ? 2 : 1),
                                    }}
                                    className={cn(
                                        cellStyles.cell,
                                        col.type === "number" ||
                                            col.type === "numberString"
                                            ? cellStyles.numericCell
                                            : undefined,
                                        selected
                                            ? cellStyles.selected
                                            : undefined,
                                        editingCell?.row === absoluteRow &&
                                            editingCell?.col === absCol
                                            ? cellStyles.editing
                                            : undefined,
                                    )}
                                >
                                    <RenderCell
                                        col={col}
                                        value={cell.value}
                                        isReadonly={cell.readonly}
                                        isEditing={
                                            editingCell?.row === absoluteRow &&
                                            editingCell?.col === absCol
                                        }
                                        cellStyle={cell.style}
                                        cellClassName={cell.className}
                                        rowIndex={rowIndex}
                                        colKey={col.key}
                                        onCellChange={
                                            onChange
                                                ? handleCellChange
                                                : undefined
                                        }
                                    />
                                </div>
                            );
                        })}
                    </div>
                );
            })}
            {footers &&
                footers.length > 0 &&
                renderHeaderFooterRows(
                    footers,
                    columns,
                    "footer",
                    "footer",
                    footerCssRowStart,
                    {
                        rowOffset: footerRowOffset,
                        colOffset,
                        selection,
                        cellType: "footer",
                    },
                    showRowNumbers,
                    showRowNumbers,
                )}
        </div>
    );
};
