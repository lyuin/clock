# Clock

ドライブ中にダッシュボード上のスマートフォンでアナログ時計を表示するWebアプリ。

## 機能

- シンプルなアナログ時計（時・分・秒針）
- 滑らかな秒針アニメーション（requestAnimationFrame）
- 画面スリープ防止（Wake Lock API + 動画フォールバック）
- オフライン起動対応（PWA）
- ダークテーマ、運転中の視認性を重視したシンプルUI

## 使い方

1. https://lyuin.github.io/clock/ にアクセス
2. スマホのホーム画面に追加するとアプリとして使える

## 技術構成

- HTML / CSS / JavaScript（フレームワークなし）
- Canvas によるアナログ時計描画
- GitHub Pages でホスティング
- Service Worker によるオフラインキャッシュ

## バージョニング

`YYYYMMDD.N` 形式（例: `20260331.1`）

- `YYYYMMDD` — 更新日
- `.N` — 同日内の更新連番（1始まり）

アプリ右下に表示。Service Worker のキャッシュ名も同じバージョンと連動。
