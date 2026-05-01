import type { KeyboardEvent } from "react";
import type { ColumnType, Row } from "../../../types.js";
import {
    getCellRaw,
    resolveCell,
    toExtData,
    updateCellValue,
} from "../../../utils/grid.js";
import type { GridKeyboardParams } from "../types.js";

// === Backspace / Delete: 単一セル選択時に値をクリアして編集モードへ突入 ===
// 複数セル選択時は何もしない（破壊的操作を避けるため）
export function handleDelete<C extends readonly ColumnType[]>(
    e: KeyboardEvent<HTMLDivElement>,
    params: GridKeyboardParams<C>,
): boolean {
    // 対象キーでなければ即離脱
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

    // 単一セル選択でない場合は処理しない
    // （複数セルクリアは将来仕様。誤操作を防ぐため明示的に弾く）
    if (
        !selection ||
        selection.start.row !== selection.end.row ||
        selection.start.col !== selection.end.col
    )
        return false;

    const r = selection.start.row;
    const c = selection.start.col;
    // 選択行がデータ行の範囲外（タイトル/ヘッダー/フッター）なら無視
    if (r < dataRowOffset || r >= dataRowOffset + data.length) return false;

    const colIdx = c - colOffset;
    // 行番号列やカラム数を越えた位置 → 対象外
    if (colIdx < 0 || colIdx >= columns.length) return false;

    const colDef = columns[colIdx]!;
    const dataRow = data[r - dataRowOffset]!;
    const raw = getCellRaw(dataRow, colDef.key);
    const cellData = resolveCell(raw);

    // セル単位 readonly / カラム単位 readonly / onChange 未指定 のいずれでも変更不可
    if (cellData.readonly || colDef.readonly === true || !onChange)
        return false;

    // 型に応じた「空値」を決める（check は false、number は 0、文字列系は ""）
    const emptyValue =
        colDef.type === "check" ? false : colDef.type === "number" ? 0 : "";
    const cellUpdate = updateCellValue(raw, emptyValue);
    // 変更対象の行だけ差し替えた新しい配列を作る（イミュータブル更新）
    const newData = data.map((d, i) =>
        i === r - dataRowOffset
            ? ({ ...d, [colDef.key]: cellUpdate } as Row<C>)
            : d,
    );
    onChange(toExtData(newData));
    // クリア後はそのまま編集モードに入って続けて入力できるようにする
    setEditingCell({ row: r, col: c });
    e.preventDefault();
    return true;
}
