import React from 'react'
import { Header } from '@/components/Header'

export default function TestHeaderSearch() {
  return (
    <div>
      <Header />
      <div style={{ 
        marginTop: '80px', 
        padding: '40px', 
        maxWidth: '800px', 
        margin: '80px auto 0' 
      }}>
        <h1>ヘッダー検索テスト</h1>
        <p>上部のヘッダーにある検索アイコンをクリックして、検索機能をテストしてください。</p>
        
        <h2>テスト手順：</h2>
        <ol>
          <li>右上の検索アイコン（虫眼鏡）をクリック</li>
          <li>検索ボックスに「カフェ」や「キネシ」などを入力</li>
          <li>Enterキーを押すか「検索」ボタンをクリック</li>
          <li>チェックボックスが有効なページのみが表示されることを確認</li>
        </ol>
        
        <h2>期待される結果：</h2>
        <ul>
          <li>システムページ（「無題のページ」）が表示されない</li>
          <li>データベースで「検索対象」チェックボックスが有効なページのみが表示される</li>
          <li>検索結果にはタイトルと抜粋が表示される</li>
        </ul>
      </div>
    </div>
  )
}