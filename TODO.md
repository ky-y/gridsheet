 # GridSheet 改善 TODO

## バグ（高優先度）

### 1. ドラッグ状態がコンポーネント外でリセットされない
- **ファイル:** `src/hooks/useGridMouse.ts`
- `onMouseUp` がコンテナにのみ付いているため、グリッド外でマウスを離すと `isDragging` が `true` のまま
- `window` に `mouseup` リスナーを追加する必要がある

### 2. ~~`clipboard.writeText()` の Promise が未処理~~ ✅
- **ファイル:** `src/hooks/useGridKeyboard.ts`
- `.catch(() => {})` を追加して未処理 Promise を解消

### 3. ペースト時の `Number()` に NaN ガードがない
- **ファイル:** `src/hooks/useGridPaste.ts`
- 非数値文字列を number 型カラムにペーストすると `NaN` がセル値として保存される

### 4. `resolveCellData` の型ガードが緩い
- **ファイル:** `src/utils/grid.ts`
- `{ value: ... }` を持つ任意のオブジェクトを `CellDataType` として扱うため、`Date` 等が誤判定される可能性

## コード品質（中優先度）

### ~~5. `colOffset` パラメータが未使用~~ ✅
- **ファイル:** `src/hooks/useGridMouse.ts`
- ~~型定義にあるが実際には使われていない~~
- 対応済み: `GridMouseParams` から `colOffset` を削除

### 6. CellDataType 判定ロジックが複数箇所に重複
- `utils/grid.ts`, `hooks/useGridKeyboard.ts`, `hooks/useGridPaste.ts` 等
- 共通ユーティリティ（例: `updateCellValue(raw, newValue)`）に集約すべき

### 7. `lint` / `lint:check` のスクリプト命名が逆
- **ファイル:** `package.json`
- `lint` がチェックのみ、`lint:check` が `--write`（自動修正）になっている
- `format` / `format:check` と整合性がない

### 8. `sampleData.ts` が9140行
- **ファイル:** `src/playground/sampleData.ts`
- ループやジェネレータで生成すれば大幅に縮小できる

### 9. `useGridKeyboard` が巨大で責務が多すぎる
- **ファイル:** `src/hooks/useGridKeyboard.ts`
- コピー、編集モード遷移、矢印キー、文字入力がすべて1つの `useCallback` に集約されている
- 機能ごとに分割すると保守性が向上

## 設計改善（低優先度）

### 10. ユニットテストが0件
- Vitest のセットアップは完了しているがテストコードがない
- hooks やユーティリティのテストを追加すべき

### 11. `renderCell` が関数で `React.memo` 不可
- **ファイル:** `src/components/Cell.tsx`
- コンポーネント化すれば大量データ時の再レンダリングを最適化できる

### 12. セルごとに毎レンダリングで新しい `onChange` 関数が生成
- **ファイル:** `src/GridSheet.tsx`
- `data.map` 内でクロージャが O(rows × cols) 個作られる

### 13. ARIA ロールがない
- グリッドに `role="grid"` / `role="row"` / `role="gridcell"` 等がない
- スクリーンリーダーでの操作が困難

### 14. a11y チェックが `'todo'` モード
- **ファイル:** `.storybook/preview.ts`
- アクセシビリティ違反がテストを失敗させない設定のまま
