import type { CSSProperties, ReactNode } from "react";

export type CellType =
    | "string"
    | "check"
    | "select"
    | "number"
    | "numberString";

export type CellTypeToValue = {
    string: string;
    check: boolean;
    select: string;
    number: number;
    numberString: string;
};

export type SelectOption = {
    label: string;
    value: string;
};

/** 拡張セル（value + readonly + style + className） */
export type ExtCell<V = unknown> = {
    value: V;
    readonly?: boolean;
    style?: CSSProperties;
    className?: string;
};

/** 列幅（数値は fr 比率、文字列はそのまま CSS の値、未指定は auto） */
export type ColumnWidth = "auto" | string | number;

type BaseColumn = {
    key: string;
    /** `{ type: "title" }` の見出し行に表示される列名 */
    title?: ReactNode;
    titleClassName?: string;
    width?: ColumnWidth;
    readonly?: boolean;
    style?: CSSProperties;
    cellClassName?: string;
};

export type ColumnType =
    | (BaseColumn & { type: Exclude<CellType, "select"> })
    | (BaseColumn & { type: "select"; options: SelectOption[] });

/** セルの値は直接の値 or ExtCell のどちらでも受け取れる */
type Cell<V> = V | ExtCell<V>;

export type Row<C extends readonly ColumnType[]> = {
    [K in C[number] as K["key"]]: Cell<CellTypeToValue[K["type"]]>;
};

/** 正規化済み行（全セルが ExtCell でラップ済み） */
export type ExtRow<C extends readonly ColumnType[]> = {
    [K in C[number] as K["key"]]: ExtCell<CellTypeToValue[K["type"]]>;
};

/** 素の値のみの行型（ExtCell を剥がした状態） */
export type PlainRow<C extends readonly ColumnType[]> = {
    [K in C[number] as K["key"]]: CellTypeToValue[K["type"]];
};

/** 見出し（headers / footers / rowHeaders）の 1 セル */
export type HeaderCell = {
    body: ReactNode;
    /** 横方向の結合数 */
    span?: number;
    /** 縦方向の結合数 */
    rowSpan?: number;
    className?: string;
};

/** インデックスの書式: number = 1, 2, 3 / upperAlpha = A, B, C / lowerAlpha = a, b, c */
export type IndexFormat = "number" | "upperAlpha" | "lowerAlpha";

/** 見出しの行（headers / footers）・列（rowHeaders）に共通の指定 */
type HeaderLineOptions = {
    /**
     * データ領域側に太線を引くか（headers は下、footers は上、rowHeaders は右）。
     * 未指定ならデータ領域に接する行/列だけ太線になる
     */
    divider?: boolean;
    /** この行/列のすべてのセルに付与するクラス名 */
    className?: string;
};

/** headers / footers の 1 行 */
export type HeaderRow =
    /** セルを並べた行（`{ cells }` の省略形） */
    | HeaderCell[]
    | (HeaderLineOptions & { cells: HeaderCell[] })
    /** columns[].title を並べた行 */
    | (HeaderLineOptions & { type: "title" })
    /** 列のインデックスを並べた行 */
    | (HeaderLineOptions & { type: "index"; format?: IndexFormat });

/** rowHeaders の 1 列（データ行の左側に並ぶ見出し列） */
export type RowHeaderColumn =
    /** データ行ごとのセルを並べた列（`{ cells }` の省略形） */
    | HeaderCell[]
    | (HeaderLineOptions & { cells: HeaderCell[]; width?: ColumnWidth })
    /** 行のインデックスを並べた列（width の既定は 3rem） */
    | (HeaderLineOptions & {
          type: "index";
          format?: IndexFormat;
          width?: ColumnWidth;
      });

export type CellAddress = {
    row: number;
    col: number;
};

export type Selection = {
    start: CellAddress;
    end: CellAddress;
} | null;

export type GridSheetConfigs = {
    /** rowHeaders の列を矢印キー移動・範囲選択の対象に含めるか (default: false) */
    selectableRowHeaders?: boolean;
    /** 選択セルが画面外に出た場合にスクロールするか (default: true) */
    scrollToSelection?: boolean;
};

export type GridSheetType<C extends readonly ColumnType[] = ColumnType[]> = {
    columns: C;
    data: Row<C>[];
    /** 上部の見出し行。未指定なら columns[].title があるときだけ title 行を表示する */
    headers?: HeaderRow[];
    /** 下部の見出し行 */
    footers?: HeaderRow[];
    /** データ行の左側の見出し列（行番号など） */
    rowHeaders?: RowHeaderColumn[];
    configs?: GridSheetConfigs;
    onChange?: (data: ExtRow<C>[]) => void;
    onSelectionChange?: (selection: Selection) => void;
};

type CreateColOthers<T extends CellType> = T extends "select"
    ? Omit<BaseColumn, "key"> & { options: SelectOption[] }
    : Omit<BaseColumn, "key">;

export const createCol = <K extends string, T extends CellType>(
    key: K,
    type: T,
    others?: CreateColOthers<T>,
): { key: K; type: T } & CreateColOthers<T> => {
    return { key, type, ...others } as { key: K; type: T } & CreateColOthers<T>;
};
