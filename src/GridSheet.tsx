import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn.js";
import { isSelected, resolveCellData, getCellRaw } from "./utils/grid.js";
import { RenderCell } from "./components/Cell.js";
import cellStyles from "./components/Cell.module.scss";
import { renderHeaderFooterRow } from "./components/HeaderFooterRow.js";
import { useGridKeyboard } from "./hooks/useGridKeyboard.js";
import { useGridMouse } from "./hooks/useGridMouse.js";
import { useGridPaste } from "./hooks/useGridPaste.js";
import type {
    CellAddress,
    CellType,
    CellTypeToValue,
    ColumnType,
    DataType,
    GridSheetType,
} from "./types.js";
import styles from "./GridSheet.module.scss";

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
    const selectableTitles = configs?.selectableTitles === true;
    const selectableHeaders = configs?.selectableHeaders === true;
    const selectableFooters = configs?.selectableFooters === true;
    const showRowNumbers = configs?.showRowNumbers === true;
    const selectableRowNumbers =
        configs?.selectableRowNumbers === true && showRowNumbers;
    const scrollToSelection = configs?.scrollToSelection !== false;

    const colOffset = showRowNumbers ? 1 : 0;

    const dataRef = useRef(data);
    dataRef.current = data;
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

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
                i === rowIndex
                    ? ({ ...r, [colKey]: newValue } as DataType<C>)
                    : r,
            );
            currentOnChange(newData);
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

    const minRow =
        selectableTitles && hasTitle
            ? titleRowIndex
            : selectableHeaders && headers?.length
              ? headerRowOffset
              : dataRowOffset;
    const maxRow =
        selectableFooters && footers?.length
            ? footerRowOffset + footers.length - 1
            : dataRowOffset + data.length - 1;
    const minCol = selectableRowNumbers ? 0 : colOffset;
    const maxCol = columns.length - 1 + colOffset;

    const fullMinRow = hasTitle
        ? titleRowIndex
        : headers?.length
          ? headerRowOffset
          : dataRowOffset;
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

    // 選択セルが画面外に出た場合にスクロール
    useEffect(() => {
        if (!scrollToSelection || !selection || !containerRef.current) return;
        const targetRow = selection.end.row;
        const targetCol = selection.end.col;
        const cell = containerRef.current.querySelector<HTMLElement>(
            `[data-row="${targetRow}"][data-col="${targetCol}"]`,
        );
        if (cell) {
            cell.scrollIntoView({ block: "nearest", inline: "nearest" });
        }
    }, [scrollToSelection, selection]);

    const { handleMouseDown, handleMouseMove, handleMouseUp } = useGridMouse({
        selection,
        setSelection,
        setEditingCell,
        onSelectionChange,
        fullMinRow,
        fullMinCol,
        maxRow,
        maxCol,
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
        fullMinRow,
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
            onMouseUp={handleMouseUp}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
        >
            {showRowNumbers &&
                (hasTitle || (headers?.length ?? 0) > 0) &&
                (() => {
                    const cornerSpan =
                        (hasTitle ? 1 : 0) + (headers?.length ?? 0);
                    return (
                        <div
                            key="select-all"
                            className={styles.selectAll}
                            style={{ gridRow: `span ${cornerSpan}` }}
                            role="columnheader"
                            data-row={fullMinRow}
                            data-col={0}
                            data-type="selectAll"
                        />
                    );
                })()}
            {hasTitle && (
                <div role="row" style={{ display: "contents" }}>
                    {columns.map((col, colIndex) => {
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
                                className={cn(
                                    styles.titleCell,
                                    selected ? styles.selected : undefined,
                                )}
                            >
                                {col.title ?? ""}
                            </div>
                        );
                    })}
                </div>
            )}
            {headers?.map((row, ri) =>
                renderHeaderFooterRow(row, columns, `header-${ri}`, "header", {
                    rowIndex: headerRowOffset + ri,
                    colOffset,
                    selection,
                    cellType: "header",
                }),
            )}
            {data.map((row, rowIndex) => {
                const absoluteRow = dataRowOffset + rowIndex;
                const rowNum = rowIndex + 1;
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
                            const cell = resolveCellData(raw);
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
                                    className={cn(
                                        cellStyles.cell,
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
            {footers?.map((row, ri) =>
                renderHeaderFooterRow(
                    row,
                    columns,
                    `footer-${ri}`,
                    "footer",
                    selectableFooters
                        ? {
                              rowIndex: footerRowOffset + ri,
                              colOffset,
                              selection,
                              cellType: "footer",
                          }
                        : undefined,
                    showRowNumbers ? { content: "" } : undefined,
                ),
            )}
        </div>
    );
};
