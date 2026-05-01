import type { KeyboardEvent, ReactNode } from "react";
import type { ColumnType } from "../../../types.js";
import { getCellRaw, resolveCell } from "../../../utils/grid.js";
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
        headers,
        colOffset,
        titleRowIndex,
        hasTitle,
        headerRowOffset,
        dataRowOffset,
        showRowNumbers,
    } = params;

    // 選択範囲がなければコピー対象がない。true を返してデフォルト動作も抑止する
    if (!selection) return true;

    // start/end は選択操作の方向で逆順にもなりうるので min/max に正規化する
    const sMinRow = Math.min(selection.start.row, selection.end.row);
    const sMaxRow = Math.max(selection.start.row, selection.end.row);
    const sMinCol = Math.min(selection.start.col, selection.end.col);
    const sMaxCol = Math.max(selection.start.col, selection.end.col);

    // --- ヘッダー行の span 展開 ---
    // ヘッダーは colSpan/rowSpan で複数セルを跨ぐ表現を持つが、コピー時は
    // 「論理セル位置 → body」の 2 次元テーブルが欲しいので、ここで span を実セル位置に展開する。
    // headerResolved[rowIndex][colIndex] = body (ReactNode | undefined)
    const headerResolved: (ReactNode | undefined)[][] = [];
    if (headers) {
        const totalCols = columns.length;
        // occupied: 既に他セルの span に取られた位置を記録（重複配置を防ぐ）
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
                // 既に上の rowSpan で埋まっている位置はスキップ
                if (occupied[ri]![colIndex]) {
                    colIndex++;
                    continue;
                }
                const cell = row[cellIndex]!;
                const colSpan = cell.span ?? 1;
                const rowSpan = cell.rowSpan ?? 1;
                // span 範囲（dr × dc）を全て同じ body で埋める
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
                            // 自分自身の位置（左上）
                            resolved[colIndex + dc] = cell.body;
                        } else if (dr > 0) {
                            // 下の行に跨る場合: その行の occupied を立てて
                            // headerResolved にも書き込む（後段の row 反復でスキップさせる）
                            occupied[ri + dr]![colIndex + dc] = true;
                            if (!headerResolved[ri + dr]) {
                                headerResolved[ri + dr] = new Array(
                                    totalCols,
                                ).fill(undefined);
                            }
                            headerResolved[ri + dr]![colIndex + dc] = cell.body;
                        } else {
                            // 同一行内の colSpan 拡張部分
                            resolved[colIndex + dc] = cell.body;
                        }
                    }
                }
                colIndex += colSpan;
                cellIndex++;
            }
        }
    }

    // --- 選択範囲を 1 セルずつ走査して TSV 文字列を組み立てる ---
    // 行位置 r がどの領域（行番号列 / タイトル行 / ヘッダー行 / データ行 / 範囲外）に
    // 属するかで、参照すべき値の取り方が変わる
    const lines: string[] = [];
    for (let r = sMinRow; r <= sMaxRow; r++) {
        const cells: string[] = [];
        for (let c = sMinCol; c <= sMaxCol; c++) {
            // 行番号列（左端の数字列）: データ行に対応する位置だけ番号を出力
            if (showRowNumbers && c === 0) {
                if (r >= dataRowOffset && r < dataRowOffset + data.length) {
                    cells.push(String(r - dataRowOffset + 1));
                } else {
                    // タイトル/ヘッダー/フッター位置の行番号セルは空文字
                    cells.push("");
                }
                continue;
            }
            // colOffset 分だけシフトしてカラム配列のインデックスに変換
            const colIdx = c - colOffset;
            if (r === titleRowIndex && hasTitle) {
                // タイトル行（カラム見出し）
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
                // ヘッダー行: span 展開済みの headerResolved を参照
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
                        // チェックボックスは Excel の TSV 形式に合わせ TRUE/FALSE で出す
                        cells.push(v ? "TRUE" : "FALSE");
                    } else {
                        // null/undefined は空文字、それ以外は String() 化
                        cells.push(v != null ? String(v) : "");
                    }
                } else {
                    cells.push("");
                }
            } else {
                // 範囲外（フッター行など現状コピー対象外の領域）は空文字でパディング
                cells.push("");
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
