import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn.js";
import { RenderCell } from "./components/Cell.js";
import cellStyles from "./components/Cell.module.scss";
import { renderHeaderFooterRows } from "./components/HeaderFooterRow.js";
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

    // タイトル行（カラム見出し）を表示するか: いずれかの列に title が設定されていれば true
    const hasTitle = columns.some((col) => col.title != null);
    // 行番号列の表示有無
    const showRowNumbers = configs?.showRowNumbers === true;
    // 行番号列をクリックして行選択を許可するか（showRowNumbers が前提）
    const selectableRowNumbers =
        configs?.selectableRowNumbers === true && showRowNumbers;
    // 選択セルが画面外に出たときに自動スクロールするか（既定 true、明示的に false の時だけ無効）
    const scrollToSelection = configs?.scrollToSelection !== false;

    // 行番号列がある場合、データ列のインデックスは 1 ずれる（先頭列が行番号列になるため）
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

    // CSS grid-template-columns 文字列を組み立てる。
    //   - 数値指定: fr 単位（比率指定）
    //   - 文字列指定: そのまま使用（"100px" 等）
    //   - 未指定: auto
    const gridTemplateColumns = [
        ...(showRowNumbers ? ["3rem"] : []),
        ...columns.map((col) => {
            if (typeof col.width === "number") return `${col.width}fr`;
            if (typeof col.width === "string") return col.width;
            return "auto";
        }),
    ].join(" ");

    // --- 論理行インデックスの計算 ---
    // 行レイアウトは「タイトル行 → ヘッダー行 → データ行 → フッター行」の順。
    // 各セクションが存在する場合だけ次のオフセットを進める。
    let nextRow = 0;
    const titleRowIndex = hasTitle ? nextRow++ : -1;
    const headerRowOffset = headers?.length ? nextRow : -1;
    if (headers?.length) nextRow += headers.length;
    const dataRowOffset = nextRow;
    const footerRowOffset = dataRowOffset + data.length;

    // CSS grid の row は 1 始まり（論理インデックスは 0 始まりなので +1 する）
    const titleCssRow = hasTitle ? 1 : -1;
    const headerCssRowStart = (hasTitle ? 1 : 0) + 1;
    const dataCssRowStart = headerCssRowStart + (headers?.length ?? 0);
    const footerCssRowStart = dataCssRowStart + data.length;

    // 選択可能領域の境界。
    // minRow: タイトル → ヘッダー → データ の順で「最も上にある領域」を採用
    const minRow = hasTitle
        ? titleRowIndex
        : headers?.length
          ? headerRowOffset
          : dataRowOffset;
    // maxRow: フッターがあればフッター末尾、なければデータ末尾
    const maxRow = footers?.length
        ? footerRowOffset + footers.length - 1
        : dataRowOffset + data.length - 1;
    // minCol: 行番号列を選択可能にする設定なら 0、それ以外は colOffset から
    const minCol = selectableRowNumbers ? 0 : colOffset;
    const maxCol = columns.length - 1 + colOffset;
    // fullMinCol: 行全体選択時の列開始位置（行番号列を含めるかどうか）
    const fullMinCol = showRowNumbers ? 0 : colOffset;

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
