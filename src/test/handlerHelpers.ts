import { vi } from "vitest";
import type { GridKeyboardParams } from "../hooks/useGridKeyboard/types.js";
import type {
    GridMouseHandlerParams,
    GridMouseParams,
} from "../hooks/useGridMouse/types.js";
import type { GridPasteParams } from "../hooks/useGridPaste/types.js";
import { testColumns, testData } from "./fixtures.js";

// === Keyboard ===
export function createKeyboardParams(
    overrides: Partial<GridKeyboardParams<typeof testColumns>> = {},
): GridKeyboardParams<typeof testColumns> {
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
        headers: undefined,
        onChange: vi.fn(),
        colOffset: 0,
        titleRowIndex: -1,
        hasTitle: false,
        headerRowOffset: -1,
        dataRowOffset: 0,
        showRowNumbers: false,
        minRow: 0,
        maxRow: 2,
        minCol: 0,
        maxCol: 4,
        fullMinCol: 0,
        ...overrides,
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

export function createMouseParams(
    overrides: Partial<GridMouseParams> = {},
): GridMouseParams {
    const container = document.createElement("div");
    container.focus = vi.fn();
    return {
        selection: null,
        setSelection: vi.fn((updater) => updater(null)),
        setEditingCell: vi.fn(),
        containerRef: { current: container },
        onSelectionChange: vi.fn(),
        minRow: 0,
        fullMinCol: 0,
        maxRow: 9,
        maxCol: 4,
        // biome-ignore lint/suspicious/noExplicitAny: 既存テストと同じパターン
        data: defaultMouseData as any,
        // biome-ignore lint/suspicious/noExplicitAny: 既存テストと同じパターン
        columns: defaultMouseColumns as any,
        colOffset: 0,
        dataRowOffset: 0,
        ...overrides,
    };
}

export function createMouseHandlerParams(
    overrides: Partial<GridMouseHandlerParams<typeof defaultMouseColumns>> = {},
): GridMouseHandlerParams<typeof defaultMouseColumns> {
    return {
        ...(createMouseParams() as GridMouseHandlerParams<
            typeof defaultMouseColumns
        >),
        isDragging: false,
        dragMode: "cell",
        setIsDragging: vi.fn(),
        setDragMode: vi.fn(),
        ...overrides,
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
    overrides: Partial<GridPasteParams<typeof testColumns>> = {},
): GridPasteParams<typeof testColumns> {
    return {
        editingCell: null,
        selection: { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } },
        onChange: vi.fn(),
        data: testData,
        dataRowOffset: 0,
        colOffset: 0,
        columns: testColumns,
        ...overrides,
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
