# GridSheet 改善点

## バグ（高優先度）

### 1. Fragment に `key` がない

- **ファイル:** `src/GridSheet.tsx:226`
- `data.map` 内で `<>` を使っているが、`<React.Fragment key={rowIndex}>` にすべき
- React の reconciliation に影響する

### 2. ドラッグ状態がコンポーネント外でリセットされない

- **ファイル:** `src/hooks/useGridMouse.ts`
- `onMouseUp` がコンテナにのみ付いているため、グリッド外でマウスを離すと `isDragging` が `true` のまま
- `window` に `mouseup` リスナーを追加する必要がある

### 3. `clipboard.writeText()` の Promise が未処理

- **ファイル:** `src/hooks/useGridKeyboard.ts:232`
- `await` も `.catch()` もないため、権限エラー時にサイレントに失敗する

### 4. ペースト時の `Number()` に NaN ガードがない

- **ファイル:** `src/hooks/useGridPaste.ts:66`
- 非数値文字列をペーストすると `NaN` がセル値として保存される

## コード品質（中優先度）

### 5. `colOffset` パラメータが未使用

- **ファイル:** `src/hooks/useGridMouse.ts`
- 宣言・受け取りされているが使われていない

### 6. CellDataType 判定ロジックが5箇所以上に重複

- `resolveCellData` のような値の更新ヘルパーに集約すべき
- 該当箇所: `utils/grid.ts`, `hooks/useGridKeyboard.ts`, `hooks/useGridPaste.ts` 等

### 7. `sampleData.ts` が9140行

- **ファイル:** `src/playground/sampleData.ts`
- ループやジェネレータで生成すれば大幅に縮小できる

### 8. Storybook のスキャフォールドが `dist/` に残存

- `Button`, `Header`, `Page` の story ファイルがビルド出力に含まれている

## 設計改善（低優先度）

### 9. ユニットテストが0件

- Storybook の visual テストのみ
- キーボード操作・ペースト・選択ロジック等のテストがない

### 10. `renderCell` が関数で `React.memo` 不可

- 大量データ時のパフォーマンスに影響
- コンポーネント化すれば再レンダリングを最適化できる

### 11. セルごとに毎レンダリングで新しい関数が生成

- **ファイル:** `src/GridSheet.tsx`
- `data.map` 内で `onChange` のクロージャが O(rows × cols) 個作られる

### 12. a11y チェックが `'todo'` モード

- **ファイル:** `.storybook/preview.ts`
- アクセシビリティ違反がテストを失敗させない
