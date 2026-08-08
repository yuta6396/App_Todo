# Task Map

重要度 × 緊急度の2次元マップでタスクを可視化する、個人用のシンプルなToDo Webアプリです。

PC と iPhone 間は **Supabase** でタスクを同期します（Email + Password ログイン）。

## 特徴

- **Map** … 未完了タスクを付箋として「重要度 × 緊急度」マップ上に表示
- **List** … 未完了タスクの一覧表示と完了チェック
- タスク本体は **Supabase** に保存（端末間で同期）
- 緊急度は締切と予測時間から都度計算（保存しない）

## 技術

- HTML / CSS / Vanilla JavaScript
- Supabase（Auth + Postgres + RLS）
- ビルド不要（GitHub Pages でそのまま動作）

## セットアップ（初回のみ）

1. [Supabase](https://supabase.com/) でプロジェクトを作成
2. SQL Editor で `supabase/schema.sql` を実行
3. Authentication → Users で自分用ユーザーを作成（Email / Password）
4. Project Settings → API の URL と **anon public** key を `js/config.js` に設定  
   （**service_role** は入れない）
5. GitHub に push して Pages を更新

## 使い方

1. GitHub Pages の URL を開く
2. Supabase で作ったアカウントでログイン
3. 右上の **＋** からタスクを追加
4. 下部タブで **Map** / **List** を切り替え
5. 付箋またはリスト項目をタップして編集・削除

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

```
https://<username>.github.io/<repo>/task-map/
```

## ディレクトリ構成

```
task-map/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── config.js
│   ├── storage.js
│   ├── supabase.js
│   └── urgency.js
├── supabase/
│   └── schema.sql
├── manifest.json
└── README.md
```

## 非対応（意図的に未実装）

リアルタイム購読、オフライン同期、通知、サブタスク、繰り返し、ドラッグ&ドロップ、カテゴリ編集、AI 機能など。
