import { vi } from "vitest";
import type { GridKeyboardParams } from "../hooks/useGridKeyboard/types.js";
import type {
    GridMouseHandlerParams,
    GridMouseParams,
} from "../hooks/useGridMouse/types.js";
import type { GridPasteParams } from "../hooks/useGridPaste/types.js";
import type { HeaderRow, RowHeaderColumn } from "../types.js";
import {
    computeGridGeometry,
    type GridGeometry,
} from "../utils/gridGeometry.js";
import {
    layoutHeaderCells,
    type PlacedHeaderCell,
} from "../utils/headerLayout.js";
import { testColumns, testData } from "./fixtures.js";

// === Geometry ===
// テストの大半は見出しなしの標準的な3行5列のグリッドを前提にしている。
// 見出しがあるケース（dataRowOffset / colOffset のずれ）は overrides で差分指定する。
export function createGeometry(
    overrides: Partial<GridGeometry> = {},
): GridGeometry {
    return {
        colOffset: 0,
        dataRowOffset: 0,
        footerRowOffset: 3,
        minRow: 0,
        maxRow: 2,
        minCol: 0,
        maxCol: 4,
        fullMinCol: 0,
        gridTemplateColumns: "auto auto auto auto auto",
        ...overrides,
    };
}

// 見出しを含むケースは、本体と同じ計算で geometry と headerCells を組み立てる
export function createHeaderLayout(
    layout: {
        headers?: HeaderRow[];
        footers?: HeaderRow[];
        rowHeaders?: RowHeaderColumn[];
    } = {},
): { geometry: GridGeometry; headerCells: PlacedHeaderCell[] } {
    const params = {
        columns: testColumns,
        dataLength: testData.length,
        headers: layout.headers ?? [],
        footers: layout.footers ?? [],
        rowHeaders: layout.rowHeaders ?? [],
    };
    const geometry = computeGridGeometry(params);
    return { geometry, headerCells: layoutHeaderCells(params, geometry) };
}

// === Keyboard ===
export function createKeyboardParams(
    overrides: Partial<
        Omit<GridKeyboardParams<typeof testColumns>, "geometry">
    > & { geometry?: Partial<GridGeometry> } = {},
): GridKeyboardParams<typeof testColumns> {
    const { geometry: geometryOverrides, ...rest } = overrides;
    return {
        editingCell: null,
        setEditingCell: vi.fn(),
        containerRef: {
            current: { focus: vi.fn() } as unknown as HTMLDivElement,
        },
        selection: { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } },
        setSelection: vi.fn((updater) => updater(null)),
        onSelectionChange: vi.fn(),
        columns: testColumns,
        data: testData,
        headerCells: [],
        onChange: vi.fn(),
        geometry: createGeometry(geometryOverrides),
        ...rest,
    };
}

export function makeKeyEvent(
    key: string,
    mods: {
        ctrlKey?: boolean;
        metaKey?: boolean;
        shiftKey?: boolean;
        altKey?: boolean;
    } = {},
): React.KeyboardEvent<HTMLDivElement> {
    return {
        key,
        ctrlKey: mods.ctrlKey ?? false,
        metaKey: mods.metaKey ?? false,
        shiftKey: mods.shiftKey ?? false,
        altKey: mods.altKey ?? false,
        preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent<HTMLDivElement>;
}

// === Mouse ===
const defaultMouseColumns = [
    { key: "name", type: "string" as const },
    { key: "age", type: "number" as const },
    { key: "score", type: "number" as const },
    { key: "active", type: "check" as const },
    { key: "role", type: "string" as const },
] as const;

const defaultMouseData = Array.from({ length: 10 }, (_, i) => ({
    name: `User${i}`,
    age: 20 + i,
    score: 100 + i,
    active: i % 2 === 0,
    role: "member",
}));

// マウステストは 10 行 5 列を前提にしているので、geometry の maxRow を 9 に差し替える。
const defaultMouseGeometry: GridGeometry = createGeometry({
    maxRow: 9,
    footerRowOffset: 10,
});

export function createMouseParams(
    overrides: Partial<Omit<GridMouseParams, "geometry">> & {
        geometry?: Partial<GridGeometry>;
    } = {},
): GridMouseParams {
    const container = document.createElement("div");
    container.focus = vi.fn();
    const { geometry: geometryOverrides, ...rest } = overrides;
    return {
        selection: null,
        setSelection: vi.fn((updater) => updater(null)),
        setEditingCell: vi.fn(),
        containerRef: { current: container },
        onSelectionChange: vi.fn(),
        // biome-ignore lint/suspicious/noExplicitAny: 既存テストと同じパターン
        data: defaultMouseData as any,
        // biome-ignore lint/suspicious/noExplicitAny: 既存テストと同じパターン
        columns: defaultMouseColumns as any,
        geometry: geometryOverrides
            ? { ...defaultMouseGeometry, ...geometryOverrides }
            : defaultMouseGeometry,
        ...rest,
    };
}

export function createMouseHandlerParams(
    overrides: Partial<
        Omit<GridMouseHandlerParams<typeof defaultMouseColumns>, "geometry">
    > & { geometry?: Partial<GridGeometry> } = {},
): GridMouseHandlerParams<typeof defaultMouseColumns> {
    const { geometry: geometryOverrides, ...rest } = overrides;
    return {
        ...(createMouseParams({
            geometry: geometryOverrides,
        }) as GridMouseHandlerParams<typeof defaultMouseColumns>),
        isDragging: false,
        dragMode: "cell",
        setIsDragging: vi.fn(),
        setDragMode: vi.fn(),
        ...rest,
    };
}

export function makeMouseEvent(
    dataset: Record<string, string> | null,
): React.MouseEvent<HTMLDivElement> {
    if (dataset === null) {
        const el = document.createElement("div");
        return { target: el } as unknown as React.MouseEvent<HTMLDivElement>;
    }
    const el = document.createElement("div");
    for (const [k, v] of Object.entries(dataset)) {
        el.dataset[k] = v;
    }
    return { target: el } as unknown as React.MouseEvent<HTMLDivElement>;
}

// === Paste ===
export function createPasteParams(
    overrides: Partial<
        Omit<GridPasteParams<typeof testColumns>, "geometry">
    > & { geometry?: Partial<GridGeometry> } = {},
): GridPasteParams<typeof testColumns> {
    const { geometry: geometryOverrides, ...rest } = overrides;
    return {
        editingCell: null,
        selection: { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } },
        onChange: vi.fn(),
        data: testData,
        columns: testColumns,
        geometry: createGeometry(geometryOverrides),
        ...rest,
    };
}

export function makePasteEvent(
    text: string,
): React.ClipboardEvent<HTMLDivElement> {
    return {
        clipboardData: { getData: () => text },
        preventDefault: vi.fn(),
    } as unknown as React.ClipboardEvent<HTMLDivElement>;
}
