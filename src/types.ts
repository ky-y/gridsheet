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

type BaseColumn = {
    key: string;
    title?: ReactNode;
    titleClassName?: string;
    width?: "auto" | string | number;
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

export type HeaderFooterCell = {
    body: ReactNode;
    span?: number;
    rowSpan?: number;
    className?: string;
};

export type CellAddress = {
    row: number;
    col: number;
};

export type Selection = {
    start: CellAddress;
    end: CellAddress;
} | null;

export type GridSheetConfigs = {
    /** title行を選択範囲に含めるか (default: false) */
    selectableTitles?: boolean;
    /** header行を選択範囲に含めるか (default: false) */
    selectableHeaders?: boolean;
    /** 行番号列を表示するか (default: false) */
    showRowNumbers?: boolean;
    /** 行番号列を選択範囲に含めるか (default: false) */
    selectableRowNumbers?: boolean;
    /** footer行を選択範囲に含めるか (default: false) */
    selectableFooters?: boolean;
    /** 選択セルが画面外に出た場合にスクロールするか (default: true) */
    scrollToSelection?: boolean;
};

export type GridSheetType<C extends readonly ColumnType[] = ColumnType[]> = {
    columns: C;
    data: Row<C>[];
    headers?: HeaderFooterCell[][];
    footers?: HeaderFooterCell[][];
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
