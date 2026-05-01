import type { KeyboardEvent } from "react";
import type { ColumnType, Row } from "../../../types.js";
import {
    getCellRaw,
    resolveCell,
    toExtData,
    updateCellValue,
} from "../../../utils/grid.js";
import type { GridKeyboardParams } from "../types.js";

// === 文字キー: セルにキーをそのまま打ち込みつつ編集モードに入る ===
// Excel のように「セル選択中に文字を押すと既存値が消えて新しい入力が始まる」挙動を実現する
export function handleCharInput<C extends readonly ColumnType[]>(
    e: KeyboardEvent<HTMLDivElement>,
    params: GridKeyboardParams<C>,
): boolean {
    // 1 文字キーのみが対象（"a" などは長さ 1、"ArrowUp" などは複数文字）
    // Ctrl/Cmd 併用時は別ハンドラ用のショートカットなので無視する
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

    // 単一セル選択時のみ動作（複数セルの一括書き換えを避ける）
    if (
        !selection ||
        selection.start.row !== selection.end.row ||
        selection.start.col !== selection.end.col
    )
        return false;

    const r = selection.start.row;
    const c = selection.start.col;
    // データ行範囲外なら無視
    if (r < dataRowOffset || r >= dataRowOffset + data.length) return false;

    const colIdx = c - colOffset;
    // 行番号列や範囲外列なら無視
    if (colIdx < 0 || colIdx >= columns.length) return false;

    const colDef = columns[colIdx]!;
    const dataRow = data[r - dataRowOffset]!;
    const raw = getCellRaw(dataRow, colDef.key);
    const cellData = resolveCell(raw);

    // readonly セル/カラムには書き込まない
    if (cellData.readonly || colDef.readonly === true) return false;

    // 型に応じた書き込み方:
    //   - string / numberString : 押した文字をそのままセル値として書き込む
    //   - number               : 数字キー(0-9)のときだけ Number 化して書き込む
    //   - check / select 等    : ここでは何もせず、編集モードに入るだけ
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
        // 数値カラムは数字キーだけ受け付ける（"-" や "." は edit モードに入った input 側で扱う）
        const cellUpdate = updateCellValue(raw, Number(e.key));
        const newData = data.map((d, i) =>
            i === r - dataRowOffset
                ? ({ ...d, [colDef.key]: cellUpdate } as Row<C>)
                : d,
        );
        onChange(toExtData(newData));
    }
    // 値書き込みの有無に関わらず編集モードに入る
    setEditingCell({ row: r, col: c });
    e.preventDefault();
    return true;
}
