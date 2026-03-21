import {
    type KeyboardEvent,
    type ReactNode,
    type RefObject,
    useCallback,
    useRef,
} from "react";
import { extractText } from "../utils/reactNode.js";
import type {
    CellAddress,
    ColumnType,
    ExtRow,
    HeaderFooterCell,
    Row,
    Selection,
} from "../types.js";
import {
    getCellRaw,
    resolveCell,
    toExtData,
    updateCellValue,
} from "../utils/grid.js";

export type GridKeyboardParams<C extends readonly ColumnType[]> = {
    editingCell: CellAddress | null;
    setEditingCell: (cell: CellAddress | null) => void;
    containerRef: RefObject<HTMLDivElement | null>;
    selection: { start: CellAddress; end: CellAddress } | null;
    setSelection: (
        updater: (
            prev: { start: CellAddress; end: CellAddress } | null,
        ) => { start: CellAddress; end: CellAddress } | null,
    ) => void;
    onSelectionChange?: ((selection: Selection) => void) | undefined;
    columns: C;
    data: Row<C>[];
    headers?: HeaderFooterCell[][] | undefined;
    onChange?: ((data: ExtRow<C>[]) => void) | undefined;
    colOffset: number;
    titleRowIndex: number;
    hasTitle: boolean;
    headerRowOffset: number;
    dataRowOffset: number;
    showRowNumbers: boolean;
    minRow: number;
    maxRow: number;
    minCol: number;
    maxCol: number;
    fullMinCol: number;
};

// === 編集モード中のキー処理 ===
function handleEditingKeys<C extends readonly ColumnType[]>(
    e: KeyboardEvent<HTMLDivElement>,
    params: GridKeyboardParams<C>,
): boolean {
    const {
        editingCell,
        setEditingCell,
        containerRef,
        setSelection,
        onSelectionChange,
        minCol,
        maxCol,
    } = params;

    if (!editingCell) return false;

    if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        setEditingCell(null);
        containerRef.current?.focus();
        return true;
    }

    if (e.key === "Tab") {
        e.preventDefault();
        setEditingCell(null);
        const tabDir = e.shiftKey ? -1 : 1;
        setSelection((prev) => {
            if (!prev) return null;
            const newCol = Math.max(
                minCol,
                Math.min(maxCol, prev.start.col + tabDir),
            );
            const next = {
                start: { row: prev.start.row, col: newCol },
                end: { row: prev.start.row, col: newCol },
            };
            onSelectionChange?.(next);
            return next;
        });
        containerRef.current?.focus();
        return true;
    }

    // 矢印キー: 編集終了して隣のセルへ移動（以降の矢印キー処理に落とす）
    if (
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight"
    ) {
        e.preventDefault();
        setEditingCell(null);
        containerRef.current?.focus();
        return false; // 矢印キー処理を続行
    }

    // 編集中はinputにキー処理を委譲
    return true;
}

// === Ctrl+C / Cmd+C: セル選択範囲をコピー ===
function handleCopy<C extends readonly ColumnType[]>(
    e: KeyboardEvent<HTMLDivElement>,
    params: GridKeyboardParams<C>,
): boolean {
    if (
        !(e.key === "c" && (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey)
    )
        return false;

    // ブラウザのテキスト選択がある場合はデフォルト動作に任せる
    const textSelection = window.getSelection();
    if (textSelection && textSelection.toString().length > 0) return true;

    const {
        selection,
        columns,
        data,
        headers,
        colOffset,
        titleRowIndex,
        hasTitle,
        headerRowOffset,
        dataRowOffset,
        showRowNumbers,
    } = params;

    if (!selection) return true;

    const sMinRow = Math.min(selection.start.row, selection.end.row);
    const sMaxRow = Math.max(selection.start.row, selection.end.row);
    const sMinCol = Math.min(selection.start.col, selection.end.col);
    const sMaxCol = Math.max(selection.start.col, selection.end.col);

    // ヘッダー行のrowSpan/colSpanを解決して、各セル位置に対応するbodyを格納
    // headerResolved[rowIndex][colIndex] = body (ReactNode | undefined)
    const headerResolved: (ReactNode | undefined)[][] = [];
    if (headers) {
        const totalCols = columns.length;
        const occupied: boolean[][] = headers.map(() =>
            new Array(totalCols).fill(false),
        );
        for (let ri = 0; ri < headers.length; ri++) {
            const resolved: (ReactNode | undefined)[] = new Array(
                totalCols,
            ).fill(undefined);
            headerResolved.push(resolved);
            const row = headers[ri]!;
            let colIndex = 0;
            let cellIndex = 0;
            while (colIndex < totalCols && cellIndex < row.length) {
                if (occupied[ri]![colIndex]) {
                    colIndex++;
                    continue;
                }
                const cell = row[cellIndex]!;
                const colSpan = cell.span ?? 1;
                const rowSpan = cell.rowSpan ?? 1;
                // このセルが占有する全位置にbodyを設定
                for (
                    let dr = 0;
                    dr < rowSpan && ri + dr < headers.length;
                    dr++
                ) {
                    for (
                        let dc = 0;
                        dc < colSpan && colIndex + dc < totalCols;
                        dc++
                    ) {
                        if (dr === 0 && dc === 0) {
                            resolved[colIndex + dc] = cell.body;
                        } else if (dr > 0) {
                            occupied[ri + dr]![colIndex + dc] = true;
                            if (!headerResolved[ri + dr]) {
                                headerResolved[ri + dr] = new Array(
                                    totalCols,
                                ).fill(undefined);
                            }
                            headerResolved[ri + dr]![colIndex + dc] = cell.body;
                        } else {
                            resolved[colIndex + dc] = cell.body;
                        }
                    }
                }
                colIndex += colSpan;
                cellIndex++;
            }
        }
    }

    const lines: string[] = [];
    for (let r = sMinRow; r <= sMaxRow; r++) {
        const cells: string[] = [];
        for (let c = sMinCol; c <= sMaxCol; c++) {
            // 行番号列
            if (showRowNumbers && c === 0) {
                if (r >= dataRowOffset && r < dataRowOffset + data.length) {
                    cells.push(String(r - dataRowOffset + 1));
                } else {
                    cells.push("");
                }
                continue;
            }
            const colIdx = c - colOffset;
            if (r === titleRowIndex && hasTitle) {
                // タイトル行
                if (colIdx >= 0 && colIdx < columns.length) {
                    cells.push(extractText(columns[colIdx]?.title));
                } else {
                    cells.push("");
                }
            } else if (
                headerRowOffset >= 0 &&
                r >= headerRowOffset &&
                r < dataRowOffset &&
                headers
            ) {
                // ヘッダー行（headerResolvedを参照）
                const ri = r - headerRowOffset;
                const resolved = headerResolved[ri];
                if (resolved && colIdx >= 0 && colIdx < columns.length) {
                    cells.push(extractText(resolved[colIdx]));
                } else {
                    cells.push("");
                }
            } else if (r >= dataRowOffset && r < dataRowOffset + data.length) {
                // データ行
                const dataRow = data[r - dataRowOffset];
                if (colIdx >= 0 && colIdx < columns.length && dataRow) {
                    const col = columns[colIdx]!;
                    const raw = getCellRaw(dataRow, col.key);
                    const cell = resolveCell(raw);
                    const v = cell.value;
                    if (typeof v === "boolean") {
                        cells.push(v ? "TRUE" : "FALSE");
                    } else {
                        cells.push(v != null ? String(v) : "");
                    }
                } else {
                    cells.push("");
                }
            } else {
                cells.push("");
            }
        }
        lines.push(cells.join("\t"));
    }
    const text = lines.join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
    e.preventDefault();
    return true;
}

// === Backspace / Delete: セル内容をクリアして編集モードに入る ===
function handleDelete<C extends readonly ColumnType[]>(
    e: KeyboardEvent<HTMLDivElement>,
    params: GridKeyboardParams<C>,
): boolean {
    if (e.key !== "Backspace" && e.key !== "Delete") return false;

    const {
        selection,
        data,
        columns,
        colOffset,
        dataRowOffset,
        onChange,
        setEditingCell,
    } = params;

    if (
        !selection ||
        selection.start.row !== selection.end.row ||
        selection.start.col !== selection.end.col
    )
        return false;

    const r = selection.start.row;
    const c = selection.start.col;
    if (r < dataRowOffset || r >= dataRowOffset + data.length) return false;

    const colIdx = c - colOffset;
    if (colIdx < 0 || colIdx >= columns.length) return false;

    const colDef = columns[colIdx]!;
    const dataRow = data[r - dataRowOffset]!;
    const raw = getCellRaw(dataRow, colDef.key);
    const cellData = resolveCell(raw);

    if (cellData.readonly || colDef.readonly === true || !onChange)
        return false;

    const emptyValue =
        colDef.type === "check" ? false : colDef.type === "number" ? 0 : "";
    const cellUpdate = updateCellValue(raw, emptyValue);
    const newData = data.map((d, i) =>
        i === r - dataRowOffset
            ? ({ ...d, [colDef.key]: cellUpdate } as Row<C>)
            : d,
    );
    onChange(toExtData(newData));
    setEditingCell({ row: r, col: c });
    e.preventDefault();
    return true;
}

// === Enter / F2: 編集モードに入る（値は維持） ===
function handleEnterEdit<C extends readonly ColumnType[]>(
    e: KeyboardEvent<HTMLDivElement>,
    params: GridKeyboardParams<C>,
): boolean {
    if (e.key !== "Enter" && e.key !== "F2") return false;

    const {
        selection,
        data,
        columns,
        colOffset,
        dataRowOffset,
        setEditingCell,
    } = params;

    if (
        !selection ||
        selection.start.row !== selection.end.row ||
        selection.start.col !== selection.end.col
    )
        return false;

    const r = selection.start.row;
    const c = selection.start.col;
    if (r < dataRowOffset || r >= dataRowOffset + data.length) return false;

    const colIdx = c - colOffset;
    if (colIdx < 0 || colIdx >= columns.length) return false;

    setEditingCell({ row: r, col: c });
    e.preventDefault();
    return true;
}

// === 文字キー: 編集モードに入り値を置換 ===
function handleCharInput<C extends readonly ColumnType[]>(
    e: KeyboardEvent<HTMLDivElement>,
    params: GridKeyboardParams<C>,
): boolean {
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey) return false;

    const {
        selection,
        data,
        columns,
        colOffset,
        dataRowOffset,
        onChange,
        setEditingCell,
    } = params;

    if (
        !selection ||
        selection.start.row !== selection.end.row ||
        selection.start.col !== selection.end.col
    )
        return false;

    const r = selection.start.row;
    const c = selection.start.col;
    if (r < dataRowOffset || r >= dataRowOffset + data.length) return false;

    const colIdx = c - colOffset;
    if (colIdx < 0 || colIdx >= columns.length) return false;

    const colDef = columns[colIdx]!;
    const dataRow = data[r - dataRowOffset]!;
    const raw = getCellRaw(dataRow, colDef.key);
    const cellData = resolveCell(raw);

    if (cellData.readonly || colDef.readonly === true) return false;

    if (
        onChange &&
        (colDef.type === "string" || colDef.type === "numberString")
    ) {
        const cellUpdate = updateCellValue(raw, e.key);
        const newData = data.map((d, i) =>
            i === r - dataRowOffset
                ? ({ ...d, [colDef.key]: cellUpdate } as Row<C>)
                : d,
        );
        onChange(toExtData(newData));
    } else if (onChange && colDef.type === "number" && /\d/.test(e.key)) {
        const cellUpdate = updateCellValue(raw, Number(e.key));
        const newData = data.map((d, i) =>
            i === r - dataRowOffset
                ? ({ ...d, [colDef.key]: cellUpdate } as Row<C>)
                : d,
        );
        onChange(toExtData(newData));
    }
    setEditingCell({ row: r, col: c });
    e.preventDefault();
    return true;
}

// === 矢印キー: セル移動・範囲選択 ===
function handleArrowNavigation<C extends readonly ColumnType[]>(
    e: KeyboardEvent<HTMLDivElement>,
    params: GridKeyboardParams<C>,
): boolean {
    const dirMap: Record<string, CellAddress> = {
        ArrowUp: { row: -1, col: 0 },
        ArrowDown: { row: 1, col: 0 },
        ArrowLeft: { row: 0, col: -1 },
        ArrowRight: { row: 0, col: 1 },
    };
    const dir = dirMap[e.key];
    if (!dir) return false;

    e.preventDefault();

    const {
        setSelection,
        onSelectionChange,
        colOffset,
        minRow,
        maxRow,
        minCol,
        maxCol,
        fullMinCol,
    } = params;

    setSelection((prev) => {
        // 選択がなければ左上から開始
        const current = prev ?? {
            start: { row: minRow, col: minCol },
            end: { row: minRow, col: minCol },
        };

        const clamp = (addr: CellAddress): CellAddress => ({
            row: Math.max(minRow, Math.min(maxRow, addr.row)),
            col: Math.max(minCol, Math.min(maxCol, addr.col)),
        });

        // 列全体選択・行全体選択の検出
        const selMinRow = Math.min(current.start.row, current.end.row);
        const selMaxRow = Math.max(current.start.row, current.end.row);
        const selMinCol = Math.min(current.start.col, current.end.col);
        const selMaxCol = Math.max(current.start.col, current.end.col);
        const isColumnSelection = selMinRow === minRow && selMaxRow === maxRow;
        const isRowSelection = selMinCol === fullMinCol && selMaxCol === maxCol;

        // 列全体選択 + 左右キー: 列選択を移動/拡張
        if (isColumnSelection && dir.col !== 0) {
            if (e.shiftKey) {
                const newEndCol =
                    e.ctrlKey || e.metaKey
                        ? dir.col < 0
                            ? colOffset
                            : maxCol
                        : Math.max(
                              colOffset,
                              Math.min(maxCol, current.end.col + dir.col),
                          );
                const next = {
                    start: current.start,
                    end: { row: maxRow, col: newEndCol },
                };
                onSelectionChange?.(next);
                return next;
            }
            const newCol =
                e.ctrlKey || e.metaKey
                    ? dir.col < 0
                        ? colOffset
                        : maxCol
                    : Math.max(
                          colOffset,
                          Math.min(maxCol, selMinCol + dir.col),
                      );
            const next = {
                start: { row: minRow, col: newCol },
                end: { row: maxRow, col: newCol },
            };
            onSelectionChange?.(next);
            return next;
        }

        // 行全体選択 + 上下キー: 行選択を移動/拡張
        if (isRowSelection && dir.row !== 0) {
            if (e.shiftKey) {
                const newEndRow =
                    e.ctrlKey || e.metaKey
                        ? dir.row < 0
                            ? minRow
                            : maxRow
                        : Math.max(
                              minRow,
                              Math.min(maxRow, current.end.row + dir.row),
                          );
                const next = {
                    start: current.start,
                    end: { row: newEndRow, col: maxCol },
                };
                onSelectionChange?.(next);
                return next;
            }
            const newRow =
                e.ctrlKey || e.metaKey
                    ? dir.row < 0
                        ? minRow
                        : maxRow
                    : Math.max(minRow, Math.min(maxRow, selMinRow + dir.row));
            const next = {
                start: { row: newRow, col: fullMinCol },
                end: { row: newRow, col: maxCol },
            };
            onSelectionChange?.(next);
            return next;
        }

        if (e.shiftKey && (e.ctrlKey || e.metaKey)) {
            // Shift+Ctrl: endを端まで飛ばす
            const newEnd = { ...current.end };
            if (dir.row !== 0) newEnd.row = dir.row < 0 ? minRow : maxRow;
            if (dir.col !== 0) newEnd.col = dir.col < 0 ? minCol : maxCol;
            const next = { start: current.start, end: clamp(newEnd) };
            onSelectionChange?.(next);
            return next;
        }

        if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
            // Ctrl: 端までジャンプ（単一セル選択）
            const newPos = { ...current.end };
            if (dir.row !== 0) newPos.row = dir.row < 0 ? minRow : maxRow;
            if (dir.col !== 0) newPos.col = dir.col < 0 ? minCol : maxCol;
            const clamped = clamp(newPos);
            const next = { start: clamped, end: clamped };
            onSelectionChange?.(next);
            return next;
        }

        if (e.shiftKey) {
            // Shift: endを1セル移動（範囲拡張）
            const newEnd = clamp({
                row: current.end.row + dir.row,
                col: current.end.col + dir.col,
            });
            const next = { start: current.start, end: newEnd };
            onSelectionChange?.(next);
            return next;
        }

        // 矢印のみ: 単一セル移動
        const newPos = clamp({
            row: current.end.row + dir.row,
            col: current.end.col + dir.col,
        });
        const next = { start: newPos, end: newPos };
        onSelectionChange?.(next);
        return next;
    });
    return true;
}

export function useGridKeyboard<C extends readonly ColumnType[]>(
    params: GridKeyboardParams<C>,
) {
    const paramsRef = useRef(params);
    paramsRef.current = params;

    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
        const p = paramsRef.current;

        if (handleEditingKeys(e, p)) return;
        if (handleCopy(e, p)) return;
        if (handleDelete(e, p)) return;
        if (handleEnterEdit(e, p)) return;
        if (handleCharInput(e, p)) return;
        handleArrowNavigation(e, p);
    }, []);

    return handleKeyDown;
}
