# GridSheet 改善 TODO

## バグ（高優先度）

### 1. ペースト時の `Number()` に NaN ガードがない
- **ファイル:** `src/hooks/useGridPaste.ts`
- 非数値文字列を number 型カラムにペーストすると `NaN` がセル値として保存される

## コード品質（中優先度）

### ~~2. CellDataType 判定ロジックが複数箇所に重複~~ ✅
- `isCellDataType()` / `updateCellValue()` を `utils/grid.ts` に追加し、全箇所を集約済み

### ~~3. `lint` / `lint:check` のスクリプト命名が逆~~ ✅
- `lint` = `--write`（自動修正）、`lint:check` = チェックのみ に修正済み
- CI・READMEも合わせて更新済み

### 4. `sampleData.ts` が9140行
- **ファイル:** `src/playground/sampleData.ts`
- ループやジェネレータで生成すれば大幅に縮小できる

### 5. `useGridKeyboard` が巨大で責務が多すぎる
- **ファイル:** `src/hooks/useGridKeyboard.ts`
- コピー、編集モード遷移、矢印キー、文字入力がすべて1つの `useCallback` に集約されている
- 機能ごとに分割すると保守性が向上

## 設計改善（低優先度）

### 6. ユニットテストが0件
- Vitest のセットアップは完了しているがテストコードがない
- hooks やユーティリティのテストを追加すべき

### 7. `renderCell` が関数で `React.memo` 不可
- **ファイル:** `src/components/Cell.tsx`
- コンポーネント化すれば大量データ時の再レンダリングを最適化できる

### 8. セルごとに毎レンダリングで新しい `onChange` 関数が生成
- **ファイル:** `src/GridSheet.tsx`
- `data.map` 内でクロージャが O(rows × cols) 個作られる

### 9. ARIA ロールがない
- グリッドに `role="grid"` / `role="row"` / `role="gridcell"` 等がない
- スクリーンリーダーでの操作が困難

### 10. a11y チェックが `'todo'` モード
- **ファイル:** `.storybook/preview.ts`
- アクセシビリティ違反がテストを失敗させない設定のまま
