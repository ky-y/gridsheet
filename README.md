# @ky-y./gridsheet

React 向けの軽量なグリッドシートコンポーネント。スプレッドシートから計算機能を省いた、データ表示・編集に特化したコンポーネントです。

## 特徴

- セル型: テキスト (`string`)、数値 (`number`)、数値文字列 (`numberString`)、チェックボックス (`check`)、セレクトボックス (`select`)
- セル単位・カラム単位の `readonly` 制御
- セル単位・カラム単位のスタイル / クラス名指定
- キーボード操作（矢印キー・Tab・Enter・F2・Escape・Ctrl+C・Backspace/Delete・Ctrl+Arrow）
- マウスドラッグによる範囲選択
- クリップボードからのペースト（TSV / 単一値の複数セル展開）
- ヘッダー / フッター行（セル結合対応）
- 行番号表示
- 選択変更コールバック

## インストール

```bash
pnpm add @ky-y./gridsheet
```

## 使い方

```tsx
import { GridSheet, createCol, type DataType } from "@ky-y./gridsheet";
import { useState } from "react";

const columns = [
  createCol("name", "string", { title: "名前", width: 200 }),
  createCol("age", "number", { title: "年齢", width: 100 }),
  createCol("active", "check", { title: "有効" }),
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

| Prop | 型 | 説明 |
|------|------|------|
| `columns` | `ColumnType[]` | カラム定義の配列 |
| `data` | `DataType<C>[]` | 行データの配列 |
| `headers` | `HeaderFooterCell[][]` | ヘッダー行（省略可） |
| `footers` | `HeaderFooterCell[][]` | フッター行（省略可） |
| `configs` | `GridSheetConfigs` | 設定オプション（省略可） |
| `onChange` | `(data: DataType<C>[]) => void` | データ変更時のコールバック（省略可） |
| `onSelectionChange` | `(selection: Selection) => void` | 選択変更時のコールバック（省略可） |
| `className` | `string` | ルート要素に付与するクラス名（省略可） |

### `GridSheetConfigs`

| オプション | デフォルト | 説明 |
|------|------|------|
| `showRowNumbers` | `false` | 行番号列を表示する |
| `selectableTitles` | `false` | タイトル行を選択可能にする |
| `selectableHeaders` | `false` | ヘッダー行を選択可能にする |
| `selectableFooters` | `false` | フッター行を選択可能にする |
| `selectableRowNumbers` | `false` | 行番号列を選択可能にする |
| `scrollToSelection` | `true` | 選択セルが画面外に出た場合にスクロールする |

### セル型

| 型 | 値の型 | 説明 |
|------|------|------|
| `string` | `string` | テキスト入力 |
| `number` | `number` | 数値入力（右揃え） |
| `numberString` | `string` | 数値文字列（`"0010.000"` など、右揃え） |
| `check` | `boolean` | チェックボックス |
| `select` | `string` | セレクトボックス（`options` が必要） |

### `CellDataType`

セルの値に直接値を渡す代わりに、`CellDataType` オブジェクトでセル単位の制御が可能です。

```tsx
const data = [
  {
    name: { value: "Alice", readonly: true, style: { color: "red" } },
    age: 30,
    active: true,
  },
];
```

| プロパティ | 型 | 説明 |
|------|------|------|
| `value` | セル型に応じた値 | セルの値 |
| `readonly` | `boolean` | セル単位の読み取り専用（省略可） |
| `style` | `CSSProperties` | セル単位のスタイル（省略可） |
| `className` | `string` | セル単位のクラス名（省略可） |

### `createCol(key, type, options?)`

型安全なカラム定義のヘルパー関数です。

```tsx
createCol("name", "string", { title: "名前", width: 200 });
createCol("status", "select", { title: "状態", options: [{ label: "有効", value: "active" }] });
```

## 開発

```bash
pnpm install
pnpm dev          # Playground 起動
pnpm storybook    # Storybook 起動
pnpm test         # テスト実行
pnpm build        # ライブラリビルド
pnpm format       # コードフォーマット
pnpm lint         # Lint チェック
```

## ライセンス

MIT
