import type { MouseEvent } from "react";
import type { ColumnType } from "../../../types.js";
import { getCellRaw, resolveCell } from "../../../utils/grid.js";
import type { GridMouseHandlerParams } from "../types.js";

// === マウスダウン: 選択開始 / 編集モード突入の判定 ===
// クリックされた要素の data-type 属性で挙動が分岐する:
//   - selectAll : 左上コーナー → テーブル全選択
//   - title     : タイトル行 → 単一列の全選択
//   - header/footer : ヘッダー/フッター → span を考慮した列選択
//   - rowNumber : 行番号列 → 行の全選択
//   - その他    : 通常セル → セル選択 or 既選択セルなら編集モードに入る
export function handleMouseDown<C extends readonly ColumnType[]>(
    e: MouseEvent<HTMLDivElement>,
    params: GridMouseHandlerParams<C>,
): void {
    const {
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
        setIsDragging,
        setDragMode,
    } = params;

    // クリック位置から最も近い「セル要素」を辿る。data-row 属性を持つ要素がセルの目印
    const el = (e.target as HTMLElement).closest?.<HTMLElement>("[data-row]");
    // セル外（パディング部分など）クリックなら無視
    if (!el) return;
    const row = Number(el.dataset.row);
    const col = Number(el.dataset.col);
    // data 属性が壊れていたら処理しない（防御的なガード）
    if (Number.isNaN(row) || Number.isNaN(col)) return;
    const cellType = el.dataset.type;

    // どんな選択遷移であっても編集モードからは抜ける
    setEditingCell(null);

    // --- 全セル選択（左上コーナーセルクリック） ---
    if (cellType === "selectAll") {
        setSelection(() => ({
            start: { row: minRow, col: fullMinCol },
            end: { row: maxRow, col: maxCol },
        }));
        // ドラッグ拡張させずワンショットで終わらせる
        setDragMode("cell");
        setIsDragging(false);
        onSelectionChange?.({
            start: { row: minRow, col: fullMinCol },
            end: { row: maxRow, col: maxCol },
        });
        containerRef.current?.focus();
        return;
    }
    if (cellType === "title") {
        // タイトル行（カラム見出し）クリック → その列を全行選択
        setSelection(() => ({
            start: { row: minRow, col },
            end: { row: maxRow, col },
        }));
        // 以後ドラッグで列を拡張するためのモード
        setDragMode("column");
    } else if (cellType === "header" || cellType === "footer") {
        // ヘッダー/フッターは colSpan を持つことがあるので span 分の列を選択する
        const span = Number(el.dataset.span) || 1;
        setSelection(() => ({
            start: { row: minRow, col },
            end: { row: maxRow, col: col + span - 1 },
        }));
        setDragMode("column");
    } else if (cellType === "rowNumber") {
        // 行番号列クリック → その行を全列選択
        setSelection(() => ({
            start: { row, col: fullMinCol },
            end: { row, col: maxCol },
        }));
        setDragMode("row");
    } else {
        // --- 通常セル ---
        // 既にこの単一セルが選択されている状態で再クリックされたら「編集モード突入」とみなす
        // （Excel の「アクティブセル再クリックで編集」と同等の挙動）
        if (
            selection &&
            selection.start.row === row &&
            selection.start.col === col &&
            selection.end.row === row &&
            selection.end.col === col
        ) {
            const colIdx = col - colOffset;
            const dataIdx = row - dataRowOffset;
            // データ範囲内なら readonly チェックを行う
            if (
                colIdx >= 0 &&
                colIdx < columns.length &&
                dataIdx >= 0 &&
                dataIdx < data.length
            ) {
                const colDef = columns[colIdx]!;
                const raw = getCellRaw(data[dataIdx]!, colDef.key);
                const cellData = resolveCell(raw);
                // readonly セルへの編集モード突入は禁止（選択は維持してそのまま return）
                if (cellData.readonly || colDef.readonly === true) {
                    setIsDragging(false);
                    return;
                }
            }
            setEditingCell({ row, col });
            setIsDragging(false);
            return;
        }
        // 別セルへの通常クリック: そのセルを単一選択しドラッグ開始可能にする
        setSelection(() => ({
            start: { row, col },
            end: { row, col },
        }));
        setDragMode("cell");
    }
    // selectAll 以外はドラッグ開始フラグを立てて mouseMove で範囲拡張できるようにする
    setIsDragging(true);
    containerRef.current?.focus();
}
