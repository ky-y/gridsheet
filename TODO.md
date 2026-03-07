# GridSheet 改善 TODO

## バグ（高優先度）

### 1. ペースト時の `Number()` に NaN ガードがない
- **ファイル:** `src/hooks/useGridPaste.ts`
- 非数値文字列を number 型カラムにペーストすると `NaN` がセル値として保存される

## コード品質（中優先度）

### 2. `sampleData.ts` が9140行
- **ファイル:** `src/playground/sampleData.ts`
- ループやジェネレータで生成すれば大幅に縮小できる

## 設計改善（低優先度）

### 5. a11y チェックが `'todo'` モード
- **ファイル:** `.storybook/preview.ts`
- アクセシビリティ違反がテストを失敗させない設定のまま
