# @ky-y./gridsheet

## 0.1.0

### Minor Changes

- [#14](https://github.com/ky-y/gridsheet/pull/14) [`b67f079`](https://github.com/ky-y/gridsheet/commit/b67f079c12ea69c2383b0b283228021ea30e63e5) Thanks [@kyoya0819](https://github.com/kyoya0819)! - Unify headers, footers and row headers into a single model.
  
  Column titles, header rows, footer rows, row numbers and the select-all corner used to be separate features. They are now built from the same parts: `headers` (top), `footers` (bottom) and the new `rowHeaders` (left).
  
  **Breaking changes**
  
  - `configs.showRowNumbers` is removed. Use `rowHeaders={[{ type: "index" }]}` instead.
  - `configs.selectableRowNumbers` is renamed to `configs.selectableRowHeaders`.
  - The `HeaderFooterCell` type is renamed to `HeaderCell`. `headers` and `footers` now take `HeaderRow[]`. Plain arrays of cells still work.
  - If you pass `headers`, the title row is no longer added automatically. Add `{ type: "title" }` where you want it. If you don't pass `headers`, the title row is still shown when any column has a `title`.
  
  **New features**
  
  - `rowHeaders`: header columns on the left. Each one can be an index column or custom cells. `rowSpan` merges cells vertically, and `width` sets the column width (index columns default to `3rem`).
  - `{ type: "index", format }` rows and columns. `format` can be `"number"` (1, 2, 3, the default), `"upperAlpha"` (A, B, C) or `"lowerAlpha"` (a, b, c). Letters continue from Z to AA.
  - `{ type: "title" }` places the column titles in any row of `headers` or `footers`.
  - `divider` turns the thick line on the data side of each row or column on or off. By default, only the line next to the data is drawn.
  - `className` applies a class to every cell in a row or column.
  - New exported types: `HeaderCell`, `HeaderRow`, `RowHeaderColumn`, `IndexFormat` and `ColumnWidth`.
  
  **Behavior changes**
  
  - There is now one thick line between the headers and the data. Before, the title row and the last header row each had one.
  - Row headers have a thick line on their right by default. Use `divider: false` to remove it.
  - Footer cells are now included when copying.
  - Corner cells always select the whole grid. Before, they did this only when `selectableRowNumbers` was set.
  - A merged header cell is highlighted when any part of it is selected.
  - Clicking a merged row header selects every row it covers.
  - Spans larger than the grid are cut off at the edge of the grid.
  - DOM: header cells use `data-type="columnHeader" | "rowHeader" | "selectAll"`, plus `data-col-span` / `data-row-span` on merged cells. Every row, including header and footer rows, is wrapped in `role="row"`.
  
  **Migration**
  
  ```tsx
  // Before
  <GridSheet
    columns={columns}
    data={data}
    headers={[[{ body: "Personal", span: 2 }, { body: "Status", span: 2 }]]}
    configs={{ showRowNumbers: true, selectableRowNumbers: true }}
  />
  
  // After
  <GridSheet
    columns={columns}
    data={data}
    headers={[
      { type: "title" },
      [{ body: "Personal", span: 2 }, { body: "Status", span: 2 }],
    ]}
    rowHeaders={[{ type: "index" }]}
    configs={{ selectableRowHeaders: true }}
  />
  ```
  
  **Internal**
  
  - Merged cells (`span` / `rowSpan`) are now laid out in one module, used by both rendering and copying. `HeaderFooterRow` is replaced by a smaller `HeaderCell` component.
  - The keyboard, mouse and paste hooks are split into one handler per action. Grid coordinates are calculated in one place (`computeGridGeometry`).
