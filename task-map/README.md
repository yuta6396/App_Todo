# Task Map

重要度 × 緊急度の2次元マップでタスクを可視化する、個人用のシンプルなToDo Webアプリです。

## 特徴

- **Map** … 未完了タスクを付箋として「重要度 × 緊急度」マップ上に表示
- **List** … 未完了タスクの一覧表示と完了チェック
- データはブラウザの **localStorage** に保存（サーバー不要）
- 緊急度は締切と予測時間から都度計算（保存しない）

## 技術

- HTML / CSS / Vanilla JavaScript
- localStorage
- ビルド不要（`index.html` を直接開けば動作）

## 使い方

1. `task-map/index.html` をブラウザで開く  
   またはローカルサーバーで配信する
2. 右上の **＋** からタスクを追加
3. 下部タブで **Map** / **List** を切り替え
4. 付箋またはリスト項目をタップして編集・削除

## カテゴリ

| ID | 表示名 |
|----|--------|
| research | 研究 |
| university | 大学 |
| private | プライベート |
| other | その他 |

## 緊急度の計算

```
remainingHours = deadline - 現在時刻
requiredHours  = estimatedMinutes / 60
ratio          = requiredHours / remainingHours
urgency        = min(100, ratio * 200)
```

締切を過ぎている場合は `urgency = 100` です。

## GitHub Pages での公開

1. このリポジトリを GitHub に push する
2. Settings → Pages で Source を選択
3. ルートがリポジトリ直下の場合、公開URLは次のようになります

```
https://<username>.github.io/<repo>/task-map/
```

`task-map` をリポジトリのルートにする場合は、`task-map` 内のファイルをリポジトリ直下に配置してください。

## ディレクトリ構成

```
task-map/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── storage.js
│   └── urgency.js
├── manifest.json
└── README.md
```

## 非対応（意図的に未実装）

ログイン、クラウド同期、通知、サブタスク、繰り返し、ドラッグ&ドロップ、カテゴリ編集、AI 機能など。
