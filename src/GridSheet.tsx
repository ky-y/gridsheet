import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn.js";
import { RenderCell } from "./components/Cell.js";
import cellStyles from "./components/Cell.module.scss";
import { RenderHeaderCell } from "./components/HeaderCell.js";
import styles from "./GridSheet.module.scss";
import { useGridKeyboard } from "./hooks/useGridKeyboard/index.js";
import { useGridMouse } from "./hooks/useGridMouse/index.js";
import { useGridPaste } from "./hooks/useGridPaste/index.js";
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
    intersectsSelection,
    isSelected,
    resolveCell,
    toExtData,
} from "./utils/grid.js";
import { computeGridGeometry } from "./utils/gridGeometry.js";
import {
    layoutHeaderCells,
    type PlacedHeaderCell,
    resolveHeaders,
} from "./utils/headerLayout.js";

export const GridSheet = <const C extends readonly ColumnType[]>({
    className,
    columns,
    data,
    headers: headersProp,
    footers = [],
    rowHeaders = [],
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

    // 見出しは headers / footers / rowHeaders（とその角）をすべて同じ「配置済みセル」として扱う。
    // 座標系は computeGridGeometry、セル配置は layoutHeaderCells に集約
    const headers = resolveHeaders(headersProp, columns);
    const layoutParams = {
        columns,
        dataLength: data.length,
        headers,
        footers,
        rowHeaders,
    };
    const geometry = computeGridGeometry({ ...layoutParams, configs });
    const headerCells = layoutHeaderCells(layoutParams, geometry);
    const {
        colOffset,
        dataRowOffset,
        footerRowOffset,
        minRow,
        maxRow,
        fullMinCol,
        maxCol,
        gridTemplateColumns,
    } = geometry;

    // 描画は論理行ごとに行う。各行には「その行から始まる見出しセル」とデータセルが入る
    const headerCellsByRow: PlacedHeaderCell[][] = Array.from(
        { length: maxRow + 1 },
        () => [],
    );
    for (const cell of headerCells) headerCellsByRow[cell.row]!.push(cell);

    // 選択セルが画面外に出たときに自動スクロールするか（既定 true、明示的に false の時だけ無効）
    const scrollToSelection = configs?.scrollToSelection !== false;

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

    // 編集モードに入ったとき、対象セル内の input/select に自動フォーカスする。
    // text input の場合はキャレットを末尾に移動して、続けて入力できるようにする。
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
            // text input ではキャレットを末尾に置く（既存値を維持しつつ続けて入力できる位置）
            if (input instanceof HTMLInputElement && input.type === "text") {
                const len = input.value.length;
                input.setSelectionRange(len, len);
            }
        }
    }, [editingCell]);

    // GridSheet 外をクリックしたら編集・選択をリセットする。
    // editingCell/selection がどちらも null なら購読する必要がないので早期 return で最適化。
    useEffect(() => {
        if (!editingCell && !selection) return;
        const handleOutsideClick = (e: MouseEvent) => {
            // クリック先がグリッドコンテナの外側だった場合のみリセット
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

    // 選択セルが画面外に出たら自動スクロールする。
    // ただし「行全体選択 / 列全体選択 / 全選択」のときはスクロールするとUX的に不自然なのでスキップ。
    useEffect(() => {
        if (!scrollToSelection || !selection || !containerRef.current) return;
        // 行全範囲 = 選択の縦範囲が minRow〜maxRow を完全に覆っている
        const isFullRowSpan =
            selection.start.row === minRow && selection.end.row === maxRow;
        // 列全範囲 = 選択の横範囲が fullMinCol〜maxCol を完全に覆っている
        const isFullColSpan =
            selection.start.col === fullMinCol && selection.end.col === maxCol;
        if (isFullRowSpan || isFullColSpan) return;
        // end 側（カーソル側）のセルを画面内に収める
        const targetRow = selection.end.row;
        const targetCol = selection.end.col;
        const cell = containerRef.current.querySelector<HTMLElement>(
            `[data-row="${targetRow}"][data-col="${targetCol}"]`,
        );
        if (cell) {
            // 「画面内ならスクロールしない、外なら最小限だけスクロール」モード
            cell.scrollIntoView({ block: "nearest", inline: "nearest" });
        }
    }, [scrollToSelection, selection, minRow, maxRow, fullMinCol, maxCol]);

    const { handleMouseDown, handleMouseMove } = useGridMouse({
        selection,
        setSelection,
        setEditingCell,
        containerRef,
        onSelectionChange,
        data,
        columns,
        geometry,
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
        headerCells,
        onChange,
        geometry,
    });

    const handlePaste = useGridPaste({
        editingCell,
        selection,
        onChange,
        data,
        columns,
        geometry,
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
            {headerCellsByRow.map((rowCells, row) => {
                const dataIndex = row - dataRowOffset;
                const dataRow =
                    row >= dataRowOffset && row < footerRowOffset
                        ? data[dataIndex]
                        : undefined;
                return (
                    <div key={row} role="row" style={{ display: "contents" }}>
                        {rowCells.map((cell) => (
                            <RenderHeaderCell
                                key={cell.key}
                                cell={cell}
                                selected={intersectsSelection(cell, selection)}
                            />
                        ))}
                        {dataRow &&
                            columns.map((col, colIndex) => {
                                const absCol = colIndex + colOffset;
                                const raw = getCellRaw(dataRow, col.key);
                                const cell = resolveCell(raw);
                                const selected = isSelected(
                                    row,
                                    absCol,
                                    selection,
                                );
                                const isEditing =
                                    editingCell?.row === row &&
                                    editingCell?.col === absCol;

                                return (
                                    <div
                                        key={col.key}
                                        data-row={row}
                                        data-col={absCol}
                                        role="gridcell"
                                        style={{
                                            gridRow: row + 1,
                                            gridColumn: absCol + 1,
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
                                            isEditing
                                                ? cellStyles.editing
                                                : undefined,
                                        )}
                                    >
                                        <RenderCell
                                            col={col}
                                            value={cell.value}
                                            isReadonly={cell.readonly}
                                            isEditing={isEditing}
                                            cellStyle={cell.style}
                                            cellClassName={cell.className}
                                            rowIndex={dataIndex}
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
        </div>
    );
};
