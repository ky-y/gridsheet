import type { KeyboardEvent } from "react";
import type { CellAddress, ColumnType } from "../../../types.js";
import type { GridKeyboardParams } from "../types.js";

// === 矢印キー: セル移動・範囲選択 ===
// 修飾キーの組み合わせで挙動が変化する:
//   - 矢印のみ          : 単一セル移動
//   - Shift + 矢印      : 選択範囲を1セル拡張
//   - Ctrl/Cmd + 矢印   : 端まで一気にジャンプ（単一セル）
//   - Shift + Ctrl/Cmd  : 端まで選択範囲を拡張
// さらに「列全体選択中」「行全体選択中」では特別扱いされる。
export function handleArrowNavigation<C extends readonly ColumnType[]>(
    e: KeyboardEvent<HTMLDivElement>,
    params: GridKeyboardParams<C>,
): boolean {
    // キー名から移動量(dr, dc)を引く。矢印キー以外なら dir が undefined になる
    const dirMap: Record<string, CellAddress> = {
        ArrowUp: { row: -1, col: 0 },
        ArrowDown: { row: 1, col: 0 },
        ArrowLeft: { row: 0, col: -1 },
        ArrowRight: { row: 0, col: 1 },
    };
    const dir = dirMap[e.key];
    // 矢印キーでなければこのハンドラの責務外なので、上位ディスパッチャに委ねる
    if (!dir) return false;

    // 矢印キーをグリッドが処理した場合はページスクロールを抑止する
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
        // 選択が空ならグリッド左上を起点にする
        const current = prev ?? {
            start: { row: minRow, col: minCol },
            end: { row: minRow, col: minCol },
        };

        // 移動先がグリッド範囲外に出ないように両端でクランプする
        const clamp = (addr: CellAddress): CellAddress => ({
            row: Math.max(minRow, Math.min(maxRow, addr.row)),
            col: Math.max(minCol, Math.min(maxCol, addr.col)),
        });

        // 現在の選択範囲を正規化（start/end が逆順でも min/max が取れるように）
        const selMinRow = Math.min(current.start.row, current.end.row);
        const selMaxRow = Math.max(current.start.row, current.end.row);
        const selMinCol = Math.min(current.start.col, current.end.col);
        const selMaxCol = Math.max(current.start.col, current.end.col);
        // 縦方向に全行覆っている → 「列全体選択」とみなす
        const isColumnSelection = selMinRow === minRow && selMaxRow === maxRow;
        // 横方向に全列（行番号列含む fullMinCol 〜 maxCol）覆っている → 「行全体選択」
        const isRowSelection = selMinCol === fullMinCol && selMaxCol === maxCol;

        // --- ケース1: 列全体選択中に左右キー → 列選択のまま左右に移動/拡張 ---
        if (isColumnSelection && dir.col !== 0) {
            if (e.shiftKey) {
                // Shift あり: end の列だけ動かして列選択を拡張する
                // Ctrl/Cmd 併用時は端（colOffset または maxCol）まで一気に飛ばす
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
            // Shift なし: 単一列を選び直す（列全体選択のまま隣の列へ移動）
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

        // --- ケース2: 行全体選択中に上下キー → 行選択のまま上下に移動/拡張 ---
        if (isRowSelection && dir.row !== 0) {
            if (e.shiftKey) {
                // Shift あり: end の行だけ動かして行選択を拡張
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
            // Shift なし: 単一行を選び直す
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

        // --- ケース3: Shift + Ctrl/Cmd: 選択範囲を端まで一気に拡張 ---
        // Excel の Ctrl+Shift+矢印 相当。start は固定し、end のみ動かす
        if (e.shiftKey && (e.ctrlKey || e.metaKey)) {
            const newEnd = { ...current.end };
            if (dir.row !== 0) newEnd.row = dir.row < 0 ? minRow : maxRow;
            if (dir.col !== 0) newEnd.col = dir.col < 0 ? minCol : maxCol;
            const next = { start: current.start, end: clamp(newEnd) };
            onSelectionChange?.(next);
            return next;
        }

        // --- ケース4: Ctrl/Cmd 単独: 端まで一気にジャンプ（単一セル選択になる） ---
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
            const newPos = { ...current.end };
            if (dir.row !== 0) newPos.row = dir.row < 0 ? minRow : maxRow;
            if (dir.col !== 0) newPos.col = dir.col < 0 ? minCol : maxCol;
            const clamped = clamp(newPos);
            const next = { start: clamped, end: clamped };
            onSelectionChange?.(next);
            return next;
        }

        // --- ケース5: Shift 単独: end を 1 セルだけ動かして範囲を拡張 ---
        if (e.shiftKey) {
            const newEnd = clamp({
                row: current.end.row + dir.row,
                col: current.end.col + dir.col,
            });
            const next = { start: current.start, end: newEnd };
            onSelectionChange?.(next);
            return next;
        }

        // --- ケース6: 修飾キーなし: 単一セルを 1 マス移動 ---
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
