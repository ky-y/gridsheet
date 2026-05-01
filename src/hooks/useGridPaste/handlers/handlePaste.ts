import type React from "react";
import type { ColumnType, Row } from "../../../types.js";
import {
    getCellRaw,
    resolveCell,
    toExtData,
    updateCellValue,
} from "../../../utils/grid.js";
import type { GridPasteParams } from "../types.js";

// === ペースト: クリップボードの TSV を選択範囲に貼り付け ===
// ペーストモードは 2 種類:
//   1) 単一値 + 複数セル選択 → 選択範囲のすべてのセルに同じ値を貼り付ける（フィル）
//   2) それ以外              → クリップボードの行列構造を起点セルから順に展開
export function handlePaste<C extends readonly ColumnType[]>(
    e: React.ClipboardEvent<HTMLDivElement>,
    params: GridPasteParams<C>,
): void {
    const {
        editingCell,
        selection,
        onChange,
        data,
        dataRowOffset,
        colOffset,
        columns,
    } = params;

    // 編集中のセルにはブラウザ標準のペースト（input への入力）を任せる
    if (editingCell) return;
    // 選択範囲が無い、または onChange が指定されていない（読み取り専用ホスト）なら何もしない
    if (!selection || !onChange) return;

    const text = e.clipboardData.getData("text/plain");
    // クリップボードに文字列が無い（画像のみなど）ならスキップ
    if (!text) return;
    // ここに到達した時点でグリッド側で処理する確定。デフォルトのペースト挙動を抑止
    e.preventDefault();

    // 選択範囲を min/max で正規化（start > end の方向ドラッグでも対応）
    const sMinRow = Math.min(selection.start.row, selection.end.row);
    const sMaxRow = Math.max(selection.start.row, selection.end.row);
    const sMinCol = Math.min(selection.start.col, selection.end.col);
    const sMaxCol = Math.max(selection.start.col, selection.end.col);

    // CRLF/CR を LF に揃え、末尾の改行 1 文字だけ落とす
    // （Excel コピー時に末尾改行が付くことがあり、空行扱いされるのを避ける）
    const normalized = text.replace(/\r\n?/g, "\n").replace(/\n$/, "");
    // TSV を 2 次元配列にパース
    const rows = normalized.split("\n").map((line) => line.split("\t"));
    // 1 行 1 列 = 単一値とみなす
    const isSingleValue = rows.length === 1 && rows[0]?.length === 1;
    // 選択範囲が 2 セル以上に渡るか
    const isMultiCellSelection = sMinRow !== sMaxRow || sMinCol !== sMaxCol;

    /**
     * 貼り付け値を列の型に合わせて変換。失敗時は null を返し、
     * 呼び出し側はそのセルの更新をスキップ（既存値を保持）する。
     */
    const applyValue = (pasteValue: string, col: C[number]): unknown | null => {
        switch (col.type) {
            case "check": {
                // 真偽値として認識可能なリテラル: "true"/"false"/"1"/"0"
                // それ以外（"yes"/"on" など）は受け付けず null
                const lower = pasteValue.toLowerCase();
                if (
                    lower === "true" ||
                    lower === "false" ||
                    pasteValue === "1" ||
                    pasteValue === "0"
                )
                    return lower === "true" || pasteValue === "1";
                return null;
            }
            case "number": {
                // 空文字は 0 として扱う（Excel の数値セル空欄に合わせる）
                if (pasteValue === "") return 0;
                const n = Number(pasteValue);
                // "abc" など数値変換できない場合は null（更新スキップ）
                if (Number.isNaN(n)) return null;
                return n;
            }
            case "select": {
                // 候補にない値は受け付けない（不正値の混入を防ぐ）
                if (
                    col.type === "select" &&
                    !col.options.some((o) => o.value === pasteValue)
                )
                    return null;
                return pasteValue;
            }
            default:
                // string / numberString はそのまま値を採用
                return pasteValue;
        }
    };

    // data を 1 行ずつ走査し、貼り付け範囲に該当する行だけ差し替える
    const newData = data.map((r, i) => {
        // この行のグリッド全体での行番号
        const absoluteRow = dataRowOffset + i;

        // --- モード1: 単一値を選択範囲全体にフィル ---
        if (isSingleValue && isMultiCellSelection) {
            // 選択範囲外の行はそのまま返す
            if (absoluteRow < sMinRow || absoluteRow > sMaxRow) return r;
            const updated = { ...r } as Record<string, unknown>;
            let changed = false;
            // 選択範囲の全列を埋める
            for (let tc = sMinCol; tc <= sMaxCol; tc++) {
                const colIdx = tc - colOffset;
                // 行番号列や範囲外列はスキップ
                if (colIdx < 0 || colIdx >= columns.length) continue;
                const col = columns[colIdx]!;
                const raw = getCellRaw(r, col.key);
                const cell = resolveCell(raw);
                // readonly セル/カラムには書き込まない
                if (cell.readonly || col.readonly === true) continue;
                const newValue = applyValue(rows[0]?.[0] ?? "", col);
                // 型が合わない値は null となり、その列はスキップ（既存値保持）
                if (newValue === null) continue;
                updated[col.key] = updateCellValue(raw, newValue);
                changed = true;
            }
            // 1 つも更新されなかった場合は元のオブジェクトをそのまま返す（参照を変えない最適化）
            return changed ? (updated as Row<C>) : r;
        }

        // --- モード2: TSV の行列構造を起点セルから展開して貼り付け ---
        // 起点 sMinRow からの相対インデックス（0 始まり）
        const pasteRowIdx = absoluteRow - sMinRow;
        // クリップボード側の行範囲を超えた行は更新しない
        if (pasteRowIdx < 0 || pasteRowIdx >= rows.length) return r;
        // 選択範囲が複数セルなら、その範囲を超えるクリップボード行は捨てる
        // （Excel と同じ「選択範囲がペースト範囲を制限する」挙動）
        if (isMultiCellSelection && absoluteRow > sMaxRow) return r;
        const pasteRow = rows[pasteRowIdx]!;
        const updated = { ...r } as Record<string, unknown>;
        let changed = false;
        // 列方向の上限:
        //   - 複数セル選択時: クリップボード列数と選択範囲列数の小さい方
        //   - 単一セル選択時: クリップボード列数そのまま
        const maxPasteCols = isMultiCellSelection
            ? Math.min(pasteRow.length, sMaxCol - sMinCol + 1)
            : pasteRow.length;
        for (let pci = 0; pci < maxPasteCols; pci++) {
            const targetCol = sMinCol + pci;
            const colIdx = targetCol - colOffset;
            // グリッド外の列はスキップ
            if (colIdx < 0 || colIdx >= columns.length) continue;
            const col = columns[colIdx]!;
            const raw = getCellRaw(r, col.key);
            const cell = resolveCell(raw);
            // readonly はスキップ
            if (cell.readonly || col.readonly === true) continue;
            const newValue = applyValue(pasteRow[pci]!, col);
            // 型変換失敗もスキップ
            if (newValue === null) continue;
            updated[col.key] = updateCellValue(raw, newValue);
            changed = true;
        }
        return changed ? (updated as Row<C>) : r;
    });
    onChange(toExtData(newData));
}
