import type { KeyboardEvent } from "react";
import type { ColumnType } from "../../../types.js";
import { getCellRaw, resolveCell } from "../../../utils/grid.js";
import type { GridKeyboardParams } from "../types.js";

// === Enter / F2: 既存値を維持したまま編集モードに入る ===
// handleDelete と違って値はクリアしない（インライン編集の開始キー）
export function handleEnterEdit<C extends readonly ColumnType[]>(
    e: KeyboardEvent<HTMLDivElement>,
    params: GridKeyboardParams<C>,
): boolean {
    // Enter / F2 以外は対象外
    if (e.key !== "Enter" && e.key !== "F2") return false;

    const {
        selection,
        data,
        columns,
        colOffset,
        dataRowOffset,
        setEditingCell,
    } = params;

    // 単一セル選択時のみ編集を開始する（範囲選択中は対象セルが曖昧なので無視）
    if (
        !selection ||
        selection.start.row !== selection.end.row ||
        selection.start.col !== selection.end.col
    )
        return false;

    const r = selection.start.row;
    const c = selection.start.col;
    // データ行外（タイトル/ヘッダー/フッター）には編集モードを許可しない
    if (r < dataRowOffset || r >= dataRowOffset + data.length) return false;

    const colIdx = c - colOffset;
    // 行番号列や範囲外の列も対象外
    if (colIdx < 0 || colIdx >= columns.length) return false;

    const colDef = columns[colIdx]!;
    const dataRow = data[r - dataRowOffset]!;
    const raw = getCellRaw(dataRow, colDef.key);
    const cellData = resolveCell(raw);
    // readonly セル（個別 or カラム単位）には編集モードを開かない
    if (cellData.readonly || colDef.readonly === true) return false;

    setEditingCell({ row: r, col: c });
    // ここで preventDefault しないと Enter による余計な動作（フォーム送信など）が走る可能性がある
    e.preventDefault();
    return true;
}
