import type { CSSProperties, JSX } from "react";
import { cn } from "@/utils/cn.js";
import { isSelected } from "../utils/grid.js";
import type { CellAddress, ColumnType, HeaderFooterCell } from "../types.js";
import styles from "./HeaderFooterRow.module.scss";

export type HeaderFooterVariant = "header" | "footer";

/**
 * header/footer行群をまとめてレンダリングする。
 * rowSpanによるセル占有を管理し、各セルに明示的なgridRow/gridColumnを指定する。
 * display:contentsのrow wrapperは使わず、フラットにセルを出力する。
 */
export function renderHeaderFooterRows(
    rows: HeaderFooterCell[][],
    columns: readonly ColumnType[],
    keyPrefix: string,
    variant: HeaderFooterVariant,
    gridRowStart: number,
    rowInfo?: {
        rowOffset: number;
        colOffset: number;
        selection: { start: CellAddress; end: CellAddress } | null;
        cellType: string;
    },
    hasRowNumberColumn?: boolean,
    renderRowNumberCells?: boolean,
) {
    const cellClassName =
        variant === "header" ? styles.headerCell : styles.footerCell;
    const borderClassName =
        variant === "header" ? styles.headerBorder : styles.footerBorder;
    const cellRole = variant === "header" ? "columnheader" : "gridcell";
    const lastRowIndex = rows.length - 1;
    const totalCols = columns.length;

    // occupied[row][col] = true if occupied by a rowSpan from a previous row
    const occupied: boolean[][] = rows.map(() =>
        new Array(totalCols).fill(false),
    );

    const elements: JSX.Element[] = [];
    const colGridOffset = hasRowNumberColumn ? 2 : 1; // CSS grid is 1-based

    for (let ri = 0; ri < rows.length; ri++) {
        const row = rows[ri] as HeaderFooterCell[];
        const occupiedRow = occupied[ri] as boolean[];
        const gridRow = gridRowStart + ri;

        // 行番号セル
        if (renderRowNumberCells) {
            const absRow = rowInfo ? rowInfo.rowOffset + ri : ri;
            const selected =
                rowInfo != null && isSelected(absRow, 0, rowInfo.selection);
            elements.push(
                <div
                    key={`${keyPrefix}-${ri}-rn`}
                    className={cn(
                        styles.rowNumber,
                        cellClassName,
                        selected ? styles.selected : undefined,
                    )}
                    role={cellRole}
                    style={{ gridRow, gridColumn: 1 }}
                    {...(rowInfo != null
                        ? {
                              "data-row": absRow,
                              "data-col": 0,
                              "data-type": rowInfo.cellType,
                          }
                        : {})}
                >
                    {""}
                </div>,
            );
        }

        let colIndex = 0;
        let cellIndex = 0;

        while (colIndex < totalCols && cellIndex < row.length) {
            if (occupiedRow[colIndex]) {
                colIndex++;
                continue;
            }

            const cell = row[cellIndex];
            if (!cell) break;

            const colSpan = cell.span ?? 1;
            const rowSpan = cell.rowSpan ?? 1;

            // Mark occupied cells for subsequent rows
            if (rowSpan > 1) {
                for (let dr = 1; dr < rowSpan && ri + dr < rows.length; dr++) {
                    const targetRow = occupied[ri + dr] as boolean[];
                    for (
                        let dc = 0;
                        dc < colSpan && colIndex + dc < totalCols;
                        dc++
                    ) {
                        targetRow[colIndex + dc] = true;
                    }
                }
            }

            const style: CSSProperties = {
                gridRow: rowSpan > 1 ? `${gridRow} / span ${rowSpan}` : gridRow,
                gridColumn:
                    colSpan > 1
                        ? `${colIndex + colGridOffset} / span ${colSpan}`
                        : colIndex + colGridOffset,
            };

            const absCol = rowInfo ? colIndex + rowInfo.colOffset : colIndex;
            const absRow = rowInfo ? rowInfo.rowOffset + ri : ri;
            const selected =
                rowInfo != null &&
                isSelected(absRow, absCol, rowInfo.selection);

            // header: 最終行に達するセルに太線、footer: 最初の行のセルに太線
            const hasBorder =
                variant === "header"
                    ? ri + rowSpan - 1 >= lastRowIndex
                    : ri === 0;

            elements.push(
                <div
                    key={`${keyPrefix}-${ri}-${colIndex}`}
                    style={style}
                    role={cellRole}
                    {...(rowInfo != null
                        ? {
                              "data-row": absRow,
                              "data-col": absCol,
                              "data-type": rowInfo.cellType,
                              ...(colSpan > 1 ? { "data-span": colSpan } : {}),
                          }
                        : {})}
                    className={cn(
                        cellClassName,
                        hasBorder ? borderClassName : undefined,
                        cell.className,
                        selected ? styles.selected : undefined,
                    )}
                >
                    {cell.body}
                </div>,
            );

            colIndex += colSpan;
            cellIndex++;
        }

        // Fill remaining columns with empty cells
        const fillerBorder =
            variant === "header" ? ri >= lastRowIndex : ri === 0;
        while (colIndex < totalCols) {
            if (occupiedRow[colIndex]) {
                colIndex++;
                continue;
            }
            const absCol = rowInfo ? colIndex + rowInfo.colOffset : colIndex;
            const absRow = rowInfo ? rowInfo.rowOffset + ri : ri;
            elements.push(
                <div
                    key={`${keyPrefix}-${ri}-${colIndex}`}
                    className={cn(
                        cellClassName,
                        fillerBorder ? borderClassName : undefined,
                    )}
                    role={cellRole}
                    style={{
                        gridRow,
                        gridColumn: colIndex + colGridOffset,
                    }}
                    {...(rowInfo != null
                        ? {
                              "data-row": absRow,
                              "data-col": absCol,
                              "data-type": rowInfo.cellType,
                          }
                        : {})}
                />,
            );
            colIndex++;
        }
    }

    return elements;
}
