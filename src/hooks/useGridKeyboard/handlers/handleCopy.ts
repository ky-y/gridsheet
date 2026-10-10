import type { KeyboardEvent } from "react";
import type { ColumnType } from "../../../types.js";
import {
    getCellRaw,
    intersectsSelection,
    resolveCell,
} from "../../../utils/grid.js";
import { extractText } from "../../../utils/reactNode.js";
import type { GridKeyboardParams } from "../types.js";

// === Ctrl+C / Cmd+C: セル選択範囲を TSV としてクリップボードへコピー ===
// 出力形式: 各セルをタブ区切り、行を改行区切り（Excel 等への貼り付けと互換）
export function handleCopy<C extends readonly ColumnType[]>(
    e: KeyboardEvent<HTMLDivElement>,
    params: GridKeyboardParams<C>,
): boolean {
    // 修飾キー条件: 「Ctrl/Cmd + C」のみを対象。Shift や Alt が同時押しなら処理しない
    if (
        !(e.key === "c" && (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey)
    )
        return false;

    // ユーザーがセル内のテキストを範囲選択している場合は、ブラウザ標準の
    // テキストコピー動作を優先する（true を返してハンドラ連鎖を止めるが preventDefault しない）
    const textSelection = window.getSelection();
    if (textSelection && textSelection.toString().length > 0) return true;

    const {
        selection,
        columns,
        data,
        headerCells,
        geometry: { colOffset, dataRowOffset, footerRowOffset },
    } = params;

    // 選択範囲がなければコピー対象がない。true を返してデフォルト動作も抑止する
    if (!selection) return true;

    // start/end は選択操作の方向で逆順にもなりうるので min/max に正規化する
    const sMinRow = Math.min(selection.start.row, selection.end.row);
    const sMaxRow = Math.max(selection.start.row, selection.end.row);
    const sMinCol = Math.min(selection.start.col, selection.end.col);
    const sMaxCol = Math.max(selection.start.col, selection.end.col);

    // --- 見出しセル（headers / footers / rowHeaders / 角）の「位置 → テキスト」表 ---
    // 結合セルは覆っているすべての位置に同じテキストを入れる。
    // 選択範囲と重ならないセルは参照されないので飛ばす
    const headerText = new Map<string, string>();
    for (const cell of headerCells) {
        if (!intersectsSelection(cell, selection)) continue;
        const text = extractText(cell.body);
        for (let dr = 0; dr < cell.rowSpan; dr++) {
            for (let dc = 0; dc < cell.colSpan; dc++) {
                headerText.set(`${cell.row + dr},${cell.col + dc}`, text);
            }
        }
    }

    // --- 選択範囲を 1 セルずつ走査して TSV 文字列を組み立てる ---
    // データ領域はセル値、それ以外は見出しのテキストを出す
    const lines: string[] = [];
    for (let r = sMinRow; r <= sMaxRow; r++) {
        const dataRow =
            r >= dataRowOffset && r < footerRowOffset
                ? data[r - dataRowOffset]
                : undefined;
        const cells: string[] = [];
        for (let c = sMinCol; c <= sMaxCol; c++) {
            const col = columns[c - colOffset];
            if (dataRow && col) {
                const raw = getCellRaw(dataRow, col.key);
                cells.push(toClipboardText(resolveCell(raw).value));
            } else {
                cells.push(headerText.get(`${r},${c}`) ?? "");
            }
        }
        lines.push(cells.join("\t"));
    }
    const text = lines.join("\n");
    // クリップボード API は権限ブロック等で reject する可能性がある。
    // 失敗してもユーザー操作（他キー入力など）は止めたくないので握り潰す
    navigator.clipboard.writeText(text).catch(() => {});
    e.preventDefault();
    return true;
}

function toClipboardText(value: unknown): string {
    // チェックボックスは Excel の TSV 形式に合わせ TRUE/FALSE で出す
    if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
    // null/undefined は空文字、それ以外は String() 化
    return value != null ? String(value) : "";
}
