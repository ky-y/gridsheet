# 改善点リスト

## 高優先度

### 1. テストファイルが存在しない
Vitestの設定は完了しているが、実際のテストファイルがない。hooks（`useGridKeyboard`, `useGridMouse`, `useGridPaste`）やユーティリティ（`grid.ts`）のユニットテストを追加すべき。

### 2. CI/CDが未設定
GitHub Actionsなどの自動化がない。lint、テスト、ビルドの自動実行パイプラインがあると品質を保てる。

### 3. `dist/`にStorybookのstoriesが含まれている
ビルド出力にstoriesディレクトリが含まれており、ライブラリとして配布する際に不要なファイルが含まれている。

## 中優先度

### 4. スクリプト命名の不一致
`format`は書き込みモード、`format:check`はチェックのみ。一方`lint`はチェックのみで`lint:check`がauto-fix。命名が逆になっている。

### 5. A11yテストが無効
Storybookで`a11y: { test: 'todo' }`となっており、アクセシビリティテストが実行されていない。

### 6. READMEやドキュメントがない
使用方法やAPIドキュメントがないため、外部利用者にとって導入が困難。

## 低優先度

### 7. package.jsonのexportsが最小限
スタイルファイルの個別exportや、より詳細なexports mapの定義が有用。

### 8. `.idea/`がリポジトリに含まれている可能性
IDE設定ファイルは`.gitignore`に追加すべき。
