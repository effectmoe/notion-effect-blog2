export default function Page() {
  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>ページ読み込み中...</h1>
      <p>Notion APIの制限により、現在コンテンツの読み込みができません。</p>
      <p>しばらくしてから再度お試しください。</p>
      <div style={{ marginTop: '20px' }}>
        <a href="/" style={{ color: 'blue' }}>ホームに戻る</a>
      </div>
    </div>
  )
}