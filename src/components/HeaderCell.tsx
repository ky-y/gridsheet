import { cn } from "@/utils/cn.js";
import type { PlacedHeaderCell } from "../utils/headerLayout.js";
import styles from "./HeaderCell.module.scss";

// 上部は列見出し、左側は行見出し、下部（フッター）は通常セルとして読み上げさせる
const roleByArea = {
    top: "columnheader",
    side: "rowheader",
    bottom: "gridcell",
} as const;

// CSS grid の位置は 1 始まりなので論理座標に +1 する
const gridTrack = (start: number, span: number) =>
    span > 1 ? `${start + 1} / span ${span}` : start + 1;

/**
 * layoutHeaderCells で配置済みの見出しセルを 1 つ描画する。
 * data-type / data-*-span はマウス操作（列選択・行選択・全選択）の判定に使う。
 */
export function RenderHeaderCell({
    cell,
    selected,
}: {
    cell: PlacedHeaderCell;
    selected: boolean;
}) {
    return (
        <div
            role={roleByArea[cell.area]}
            data-row={cell.row}
            data-col={cell.col}
            data-type={cell.kind}
            data-row-span={cell.rowSpan > 1 ? cell.rowSpan : undefined}
            data-col-span={cell.colSpan > 1 ? cell.colSpan : undefined}
            style={{
                gridRow: gridTrack(cell.row, cell.rowSpan),
                gridColumn: gridTrack(cell.col, cell.colSpan),
            }}
            className={cn(
                styles.headerCell,
                cell.index ? styles.index : undefined,
                cell.kind === "selectAll" ? styles.selectAll : undefined,
                cell.dividerTop ? styles.dividerTop : undefined,
                cell.dividerBottom ? styles.dividerBottom : undefined,
                cell.dividerRight ? styles.dividerRight : undefined,
                cell.className,
                selected ? styles.selected : undefined,
            )}
        >
            {cell.body}
        </div>
    );
}
