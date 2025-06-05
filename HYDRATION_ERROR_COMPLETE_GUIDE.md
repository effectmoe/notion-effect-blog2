# React Hydration Error 完全ガイド

## はじめに
このガイドでは、Notion-Effect-Blog2プロジェクトで発生したハイドレーションエラーの原因、解決方法、そして今後の開発で同じ問題を防ぐための知識をまとめています。

## 目次
1. [ハイドレーションエラーとは？](#ハイドレーションエラーとは)
2. [今回発生したエラーの詳細](#今回発生したエラーの詳細)
3. [解決までの手順](#解決までの手順)
4. [今後気をつけるべきポイント](#今後気をつけるべきポイント)
5. [トラブルシューティングガイド](#トラブルシューティングガイド)
6. [チェックリスト](#チェックリスト)

## ハイドレーションエラーとは？

### 簡単な説明
ハイドレーション（Hydration）とは、サーバーで生成されたHTMLに、クライアント側でJavaScriptの機能を「注入」するプロセスです。

**例えで説明すると**：
- サーバー側：HTMLの「骨組み」を作る（静的なページ）
- クライアント側：その骨組みに「動き」を加える（インタラクティブにする）

### エラーが起きる理由
サーバーで作ったHTMLと、クライアントで作ろうとしたHTMLが**一致しない**ときに発生します。

## 今回発生したエラーの詳細

### エラー1: 無効なHTML構造
```
Error: Expected server HTML to contain a matching <div> in <a>.
```

**原因**: HTMLの規則違反
```html
<!-- ❌ 間違い：<a>タグの中に<div>タグ -->
<a href="/page">
  <div>タイトル</div>
  <div>説明文</div>
</a>

<!-- ✅ 正しい：<a>タグの中は<span>などのインライン要素のみ -->
<a href="/page">
  <span>タイトル</span>
  <span>説明文</span>
</a>
```

### エラー2: 条件付きレンダリング
**原因**: サーバーとクライアントで異なる内容を表示
```javascript
// ❌ 間違い：クライアント側でのみ表示が変わる
function Component() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);
  
  return isMobile ? <MobileMenu /> : <DesktopMenu />;
}
```

### エラー3: Reactフックの使用順序
```
Error: Rendered more hooks than during the previous render.
```

**原因**: 条件によってフックの数が変わる
```javascript
// ❌ 間違い：早期リターンの後にフックを使用
function Component({ data }) {
  if (!data) return <Loading />;  // 早期リターン
  
  useEffect(() => {  // このフックは実行されない場合がある
    console.log(data);
  }, [data]);
}

// ✅ 正しい：すべてのフックを最初に配置
function Component({ data }) {
  useEffect(() => {
    if (data) {
      console.log(data);
    }
  }, [data]);
  
  if (!data) return <Loading />;
}
```

## 解決までの手順

### ステップ1: エラーメッセージの確認
1. ブラウザの開発者ツールを開く（F12キー）
2. Consoleタブでエラーメッセージを確認
3. エラーの種類を特定

### ステップ2: 問題箇所の特定
今回の修正で特定した問題：

1. **Header.tsx**
   - 検索結果の`<a>`タグ内に`<div>`があった
   - `isMobile`状態による条件付きレンダリング

2. **SimplifiedSearch.tsx**
   - `<Link>`コンポーネント内に`<div>`があった

3. **PageSocial.tsx**
   - ソーシャルボタンの`<a>`タグ内に`<div>`があった

4. **NotionPage.tsx**
   - `useEffect`フックが早期リターンの後に配置されていた

### ステップ3: 修正の実施

#### 修正1: HTML構造の修正
```javascript
// CustomPageLink.tsxを作成
// <a>タグの代わりに<div role="link">を使用
export const CustomPageLink = ({ href, children, className }) => {
  const router = useRouter();
  
  const handleClick = (e) => {
    e.preventDefault();
    router.push(href);
  };
  
  return (
    <div
      className={className}
      onClick={handleClick}
      role="link"
      tabIndex={0}
      style={{ cursor: 'pointer' }}
    >
      {children}
    </div>
  );
};
```

#### 修正2: 条件付きレンダリングの削除
```javascript
// Before: 条件によって表示が変わる
const [isMobile, setIsMobile] = useState(false);

// After: 条件を削除してCSSで対応
// CSSメディアクエリを使用
@media (max-width: 768px) {
  .desktop-only { display: none; }
}
```

#### 修正3: フックの配置修正
```javascript
// すべてのフックを関数の最初に配置
function NotionPage({ site, recordMap, error }) {
  // 1. すべてのフックを最初に宣言
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // 2. その後に早期リターン
  if (!site) return <Page404 />;
  
  // 3. 残りのロジック
  return <div>...</div>;
}
```

## 今後気をつけるべきポイント

### 1. HTMLの正しい構造を守る

**ブロック要素とインライン要素の違い**：
- **ブロック要素**: `<div>`, `<p>`, `<h1>`, `<section>` など
- **インライン要素**: `<span>`, `<a>`, `<strong>`, `<em>` など

**ルール**: インライン要素の中にブロック要素を入れない

### 2. サーバーサイドレンダリング（SSR）を意識する

**避けるべきこと**：
- `window`や`document`を直接使う
- `localStorage`や`sessionStorage`を初期レンダリングで使う
- デバイス情報による条件分岐

**正しい方法**：
```javascript
// useEffectの中で使用
useEffect(() => {
  // ここでブラウザAPIを使用
  const width = window.innerWidth;
}, []);
```

### 3. Reactフックのルール

**必ず守るルール**：
1. フックは関数コンポーネントの**最上位**で呼ぶ
2. 条件文、ループ、ネストした関数の中で呼ばない
3. カスタムフックは`use`で始める名前にする

## トラブルシューティングガイド

### 問題: ハイドレーションエラーが発生した

**手順1: エラーメッセージを読む**
```
Error: Hydration failed because the initial UI does not match what was rendered on the server.
```

**手順2: 原因を特定する**
- [ ] HTML構造の違反がないか確認
- [ ] 条件付きレンダリングがないか確認
- [ ] ブラウザAPIを初期レンダリングで使っていないか確認

**手順3: デバッグツールを使う**
```javascript
// 一時的にSSRを無効化して問題を切り分け
import dynamic from 'next/dynamic';

const ProblematicComponent = dynamic(
  () => import('./ProblematicComponent'),
  { ssr: false }
);
```

### 問題: 特定のコンポーネントだけエラーが出る

**対処法**：
1. そのコンポーネントを`dynamic import`でSSRを無効化
2. 問題の原因を修正
3. SSRを有効に戻す

### 問題: 開発環境では動くが本番環境でエラー

**確認事項**：
- [ ] 環境変数の違い
- [ ] ビルド時の最適化による影響
- [ ] キャッシュの問題

**対処法**：
```bash
# キャッシュをクリアしてビルド
rm -rf .next
npm run build
npm run start
```

## チェックリスト

### コンポーネント作成時のチェックリスト

- [ ] **HTML構造**
  - [ ] `<a>`タグ内にブロック要素を入れていない
  - [ ] 正しいHTML要素を使用している

- [ ] **Reactフック**
  - [ ] すべてのフックが最上位にある
  - [ ] 条件文の中でフックを使っていない
  - [ ] 早期リターンの前にすべてのフックがある

- [ ] **SSR対応**
  - [ ] `window`や`document`を直接使っていない
  - [ ] `useEffect`内でブラウザAPIを使用している
  - [ ] サーバーとクライアントで同じ内容をレンダリングしている

- [ ] **スタイリング**
  - [ ] レスポンシブ対応はCSSで行っている
  - [ ] JavaScriptによる条件付きスタイルを避けている

### デプロイ前のチェックリスト

1. **ローカルでの確認**
   ```bash
   npm run build
   npm run start
   ```

2. **エラーの確認**
   - [ ] コンソールにエラーがない
   - [ ] ハイドレーションエラーがない
   - [ ] 警告メッセージを確認した

3. **ブラウザテスト**
   - [ ] Chrome
   - [ ] Firefox
   - [ ] Safari
   - [ ] モバイルブラウザ

## よくある質問（FAQ）

### Q: ハイドレーションエラーはなぜ重要？
A: ユーザー体験に直接影響します。エラーが発生すると：
- ページが正しく表示されない
- インタラクティブ機能が動かない
- SEOに悪影響を与える可能性がある

### Q: どうやって防げばいい？
A: 以下の原則を守る：
1. 正しいHTML構造を使う
2. SSRを意識したコーディング
3. Reactのルールに従う

### Q: エラーが解決できない場合は？
A: 以下の手順を試す：
1. 問題のコンポーネントを特定
2. 一時的にSSRを無効化
3. 段階的に修正を適用
4. それでも解決しない場合は、コードレビューを依頼

## 関連リソース

- [Next.js Hydration Error Documentation](https://nextjs.org/docs/messages/react-hydration-error)
- [React Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- [MDN HTML Elements Reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element)

---
最終更新日: 2024年1月
このガイドは新入社員の方にも理解できるよう、技術的な説明を最小限に抑えて作成されています。