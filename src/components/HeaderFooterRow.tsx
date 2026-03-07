import type { CSSProperties, JSX } from "react";
import { cn } from "@/utils/cn.js";
import { isSelected } from "../utils/grid.js";
import type { CellAddress, ColumnType, HeaderFooterCell } from "../types.js";
import styles from "./HeaderFooterRow.module.scss";

export type HeaderFooterVariant = "header" | "footer";

export function renderHeaderFooterRow(
    row: HeaderFooterCell[],
    columns: readonly ColumnType[],
    keyPrefix: string,
    variant: HeaderFooterVariant,
    rowInfo?: {
        rowIndex: number;
        colOffset: number;
        selection: { start: CellAddress; end: CellAddress } | null;
        cellType: string;
    },
    rowNumberCell?: {
        content: string;
    },
) {
    const cellClassName =
        variant === "header" ? styles.headerCell : styles.footerCell;
    const cellRole = variant === "header" ? "columnheader" : "gridcell";

    const elements: JSX.Element[] = [];

    // 行番号セル
    if (rowNumberCell) {
        const selected =
            rowInfo != null &&
            isSelected(rowInfo.rowIndex, 0, rowInfo.selection);
        elements.push(
            <div
                key={`${keyPrefix}-rn`}
                className={cn(
                    styles.rowNumber,
                    cellClassName,
                    selected ? styles.selected : undefined,
                )}
                role={cellRole}
                {...(rowInfo != null
                    ? {
                          "data-row": rowInfo.rowIndex,
                          "data-col": 0,
                          "data-type": rowInfo.cellType,
                      }
                    : {})}
            >
                {rowNumberCell.content}
            </div>,
        );
    }

    let colIndex = 0;
    for (let i = 0; i < row.length && colIndex < columns.length; i++) {
        const cell = row[i] as HeaderFooterCell | undefined;
        if (!cell) break;
        const span = cell.span ?? 1;
        const style: CSSProperties =
            span > 1 ? { gridColumn: `span ${span}` } : {};
        const absCol = rowInfo ? colIndex + rowInfo.colOffset : colIndex;
        const selected =
            rowInfo != null &&
            isSelected(rowInfo.rowIndex, absCol, rowInfo.selection);
        elements.push(
            <div
                key={`${keyPrefix}-${colIndex}`}
                style={style}
                role={cellRole}
                {...(rowInfo != null
                    ? {
                          "data-row": rowInfo.rowIndex,
                          "data-col": absCol,
                          "data-type": rowInfo.cellType,
                          ...(span > 1 ? { "data-span": span } : {}),
                      }
                    : {})}
                className={cn(
                    cellClassName,
                    selected ? styles.selected : undefined,
                )}
            >
                {cell.body}
            </div>,
        );
        colIndex += span;
    }
    // 残りの列を空セルで埋める
    while (colIndex < columns.length) {
        const absCol = rowInfo ? colIndex + rowInfo.colOffset : colIndex;
        elements.push(
            <div
                key={`${keyPrefix}-${colIndex}`}
                className={cellClassName}
                role={cellRole}
                {...(rowInfo != null
                    ? {
                          "data-row": rowInfo.rowIndex,
                          "data-col": absCol,
                          "data-type": rowInfo.cellType,
                      }
                    : {})}
            />,
        );
        colIndex++;
    }
    return (
        <div key={keyPrefix} role="row" style={{ display: "contents" }}>
            {elements}
        </div>
    );
}
