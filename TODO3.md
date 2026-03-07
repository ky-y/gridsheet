# GridSheet 改善点

## 1. パフォーマンス

### 1-1. Fragment に key がない
- **箇所**: `src/GridSheet.tsx:226`
- `data.map` の return で `<>` を使っているが、Fragment に key がないため React の差分検出が非効率
- `<React.Fragment key={rowIndex}>` に変更すべき

### 1-2. onChange で毎回全データをコピー
- **箇所**: `src/GridSheet.tsx:275-285`, `src/hooks/useGridKeyboard.ts` 各所
- 1セル変更するたびに全行の浅いコピーが発生する
- 大量データ時にパフォーマンスが気になる場合、変更行のみコピーするか、immer などの導入を検討

### 1-3. useGridKeyboard の依存配列にオブジェクト参照が含まれている
- **箇所**: `src/hooks/useGridKeyboard.ts:541-564`
- `selection`, `data`, `columns`, `headers` などのオブジェクト参照が依存配列にあり、親の再レンダリングのたびに `handleKeyDown` が再生成される
- `useRef` で最新値を保持し、依存配列を減らすことで改善可能

## 2. バグの可能性

### 2-1. resolveCellData の type guard が緩い
- **箇所**: `src/utils/grid.ts:12-16`
- `{ value: ... }` を持つ任意のオブジェクトを `CellDataType` として扱うため、意図しないオブジェクト（`Date` や他の `value` プロパティを持つオブジェクト）が誤判定される可能性
- ブランド型やシンボルでの判定が安全

### 2-2. navigator.clipboard.writeText の Promise が未処理
- **箇所**: `src/hooks/useGridKeyboard.ts:232`
- `navigator.clipboard.writeText(text)` は Promise を返すが、エラーハンドリングがない
- 権限エラー時に無視される

## 3. コード品質

### 3-1. useGridKeyboard が巨大で責務が多すぎる
- **箇所**: `src/hooks/useGridKeyboard.ts`（568行）
- コピー処理、編集モード遷移、矢印キー処理、文字入力処理がすべて1つの `useCallback` に詰め込まれている
- 機能ごとに分割すると保守性が向上

### 3-2. セル値の更新パターンが重複
- **箇所**: `src/hooks/useGridKeyboard.ts`, `src/hooks/useGridPaste.ts` 各所
- `CellDataType` かどうかを判定して値を更新するロジックが複数箇所で繰り返されている
- 共通ユーティリティ（例: `updateCellValue(raw, newValue)`）に抽出可能

## 4. 型安全性

### 4-1. renderCell が関数 export でコンポーネントではない
- **箇所**: `src/components/Cell.tsx:111`
- JSX を返すので React コンポーネントにする方が自然で、React DevTools での可視性も向上

### 4-2. HeaderFooterRow も関数で JSX.Element[] を返している
- **箇所**: `src/components/HeaderFooterRow.tsx`
- Fragment でラップしてコンポーネントにする方が React の慣習に合う

## 5. アクセシビリティ

### 5-1. ARIA ロールがない
- グリッドに `role="grid"` / `role="row"` / `role="gridcell"` などの ARIA ロールがない
- `tabIndex={0}` はあるが、`aria-label` や `aria-selected` がないため、スクリーンリーダーでの操作が困難

## 6. テスト

### 6-1. ユニットテストが存在しない
- `src/test/setup.ts` にセットアップはあるが、テストコードが見当たらない
- Storybook はあるが、ユニットテストやインタラクションテストがないため、リグレッションの検出が難しい
