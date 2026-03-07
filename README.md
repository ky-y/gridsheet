# @ky-y./gridsheet

A lightweight React grid sheet component — a spreadsheet without formula support, focused on data display and editing.

## Features

- **Cell types**: Text (`string`), Number (`number`), Number string (`numberString`), Checkbox (`check`), Select (`select`)
- **Read-only control** at cell and column level
- **Custom styling / class names** at cell and column level
- **Keyboard navigation**: Arrow keys, Tab, Enter, F2, Escape, Ctrl+C, Backspace/Delete, Ctrl+Arrow
- **Mouse drag** range selection
- **Clipboard paste** support (TSV and single-value expansion to multiple cells)
- **Header / Footer rows** with cell merging
- **Row numbers** display
- **Selection change** callback
- **ARIA grid roles** for screen reader accessibility

## Installation

```bash
pnpm add @ky-y./gridsheet
```

## Usage

```tsx
import { GridSheet, createCol, type DataType } from "@ky-y./gridsheet";
import { useState } from "react";

const columns = [
  createCol("name", "string", { title: "Name", width: 200 }),
  createCol("age", "number", { title: "Age", width: 100 }),
  createCol("active", "check", { title: "Active" }),
] as const;

function App() {
  const [data, setData] = useState<DataType<typeof columns>[]>([
    { name: "Alice", age: 30, active: true },
    { name: "Bob", age: 25, active: false },
  ]);

  return (
    <GridSheet
      columns={columns}
      data={data}
      onChange={setData}
      configs={{ showRowNumbers: true }}
    />
  );
}
```

## API

### `<GridSheet>` Props

| Prop                | Type                             | Description                                |
|---------------------|----------------------------------|--------------------------------------------|
| `columns`           | `ColumnType[]`                   | Array of column definitions                |
| `data`              | `DataType<C>[]`                  | Array of row data                          |
| `headers`           | `HeaderFooterCell[][]`           | Header rows (optional)                     |
| `footers`           | `HeaderFooterCell[][]`           | Footer rows (optional)                     |
| `configs`           | `GridSheetConfigs`               | Configuration options (optional)           |
| `onChange`          | `(data: DataType<C>[]) => void`  | Callback when data changes (optional)      |
| `onSelectionChange` | `(selection: Selection) => void` | Callback when selection changes (optional) |
| `className`         | `string`                         | Class name for the root element (optional) |

### `GridSheetConfigs`

| Option                 | Default | Description                              |
|------------------------|---------|------------------------------------------|
| `showRowNumbers`       | `false` | Show a row number column                 |
| `selectableTitles`     | `false` | Allow selecting the title row            |
| `selectableHeaders`    | `false` | Allow selecting header rows              |
| `selectableFooters`    | `false` | Allow selecting footer rows              |
| `selectableRowNumbers` | `false` | Allow selecting the row number column    |
| `scrollToSelection`    | `true`  | Scroll to keep the selected cell in view |

### Cell Types

| Type           | Value Type | Description                                                         |
|----------------|------------|---------------------------------------------------------------------|
| `string`       | `string`   | Text input                                                          |
| `number`       | `number`   | Numeric input (right-aligned)                                       |
| `numberString` | `string`   | Numeric string preserving format, e.g. `"0010.000"` (right-aligned) |
| `check`        | `boolean`  | Checkbox                                                            |
| `select`       | `string`   | Select dropdown (requires `options`)                                |

### `CellDataType`

Instead of passing a plain value, you can pass a `CellDataType` object for per-cell control:

```tsx
const data = [
  {
    name: { value: "Alice", readonly: true, style: { color: "red" } },
    age: 30,
    active: true,
  },
];
```

| Property    | Type                         | Description                        |
|-------------|------------------------------|------------------------------------|
| `value`     | Value type for the cell type | The cell value                     |
| `readonly`  | `boolean`                    | Per-cell read-only flag (optional) |
| `style`     | `CSSProperties`              | Per-cell inline style (optional)   |
| `className` | `string`                     | Per-cell class name (optional)     |

### `createCol(key, type, options?)`

A type-safe helper for creating column definitions.

```tsx
createCol("name", "string", { title: "Name", width: 200 });
createCol("status", "select", { title: "Status", options: [{ label: "Active", value: "active" }] });
```

## Development

```bash
pnpm install
pnpm dev          # Start playground
pnpm storybook    # Start Storybook
pnpm test         # Run tests
pnpm build        # Build library
pnpm format       # Format code
pnpm lint         # Lint (auto-fix)
```

## License

MIT
