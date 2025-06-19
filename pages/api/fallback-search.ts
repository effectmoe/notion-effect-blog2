// ハードコードされた検索結果を提供するAPI（NotionのAPIが機能しない場合のフォールバック）
import { type NextApiRequest, type NextApiResponse } from 'next'

export default async function fallbackSearch(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    // 検索クエリ取得
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    // 標準的なサンプルコンテンツ（デモ用）
    const demoContent = [
      {
        id: 'page1',
        title: 'カフェでのキネシオロジー入門',
        url: 'https://notion-effect-blog2.vercel.app/',
        description: 'キネシオロジーとは何か、基本的な考え方と実践方法について解説します。',
        object: 'page'
      },
      {
        id: 'page2',
        title: 'リラクゼーションテクニック',
        url: 'https://notion-effect-blog2.vercel.app/',
        description: '日常で簡単に実践できるリラクゼーション方法を紹介します。',
        object: 'page'
      },
      {
        id: 'page3',
        title: 'マインドフルネスと瞑想',
        url: 'https://notion-effect-blog2.vercel.app/',
        description: '集中力を高め、ストレスを軽減するためのテクニックについて解説します。',
        object: 'page'
      },
      {
        id: 'page4',
        title: '筋肉テスト基礎講座',
        url: 'https://notion-effect-blog2.vercel.app/',
        description: 'キネシオロジーにおける筋肉テストの基本と応用について学びます。',
        object: 'page'
      },
      {
        id: 'page5',
        title: 'エネルギーバランスの調整法',
        url: 'https://notion-effect-blog2.vercel.app/',
        description: '体のエネルギーバランスを整えるための実践的な方法を紹介します。',
        object: 'page'
      }
    ];

    // 非常にシンプルな検索ロジック
    const normalizedQuery = query.toLowerCase().trim();
    const results = demoContent.filter(item => 
      item.title.toLowerCase().includes(normalizedQuery) || 
      item.description.toLowerCase().includes(normalizedQuery)
    );

    // 検索統計情報
    console.log(`フォールバック検索: "${query}" の結果が ${results.length} 件見つかりました`);

    // Notionの検索結果形式に合わせる
    res.status(200).json({
      results: results,
      next_cursor: null,
      has_more: false,
      type: 'page',
      page: {}
    });
  } catch (error) {
    console.error('フォールバック検索エラー:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
