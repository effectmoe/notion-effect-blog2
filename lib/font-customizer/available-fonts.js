// 利用可能なフォントのリスト
export const availableFonts = {
  // 日本語フォント
  japanese: [
    { 
      name: 'Noto Sans JP', 
      import: "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap",
      category: 'ゴシック体',
      description: 'Googleが開発した読みやすいゴシック体'
    },
    { 
      name: 'Noto Serif JP', 
      import: "https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&display=swap",
      category: '明朝体',
      description: 'Googleが開発した美しい明朝体'
    },
    { 
      name: 'M PLUS 1p', 
      import: "https://fonts.googleapis.com/css2?family=M+PLUS+1p:wght@400;700&display=swap",
      category: 'ゴシック体',
      description: 'シンプルで現代的なゴシック体'
    },
    { 
      name: 'M PLUS Rounded 1c', 
      import: "https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700&display=swap",
      category: '丸ゴシック',
      description: '親しみやすい丸ゴシック体'
    },
    { 
      name: 'Kosugi Maru', 
      import: "https://fonts.googleapis.com/css2?family=Kosugi+Maru&display=swap",
      category: '丸ゴシック',
      description: 'かわいらしい丸ゴシック体'
    },
    { 
      name: 'Sawarabi Gothic', 
      import: "https://fonts.googleapis.com/css2?family=Sawarabi+Gothic&display=swap",
      category: 'ゴシック体',
      description: '上品なゴシック体'
    },
    { 
      name: 'Sawarabi Mincho', 
      import: "https://fonts.googleapis.com/css2?family=Sawarabi+Mincho&display=swap",
      category: '明朝体',
      description: '上品な明朝体'
    },
    { 
      name: 'BIZ UDPGothic', 
      import: "https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&display=swap",
      category: 'ゴシック体',
      description: 'ビジネス文書向けゴシック体'
    },
    { 
      name: 'BIZ UDPMincho', 
      import: "https://fonts.googleapis.com/css2?family=BIZ+UDPMincho&display=swap",
      category: '明朝体',
      description: 'ビジネス文書向け明朝体'
    },
    { 
      name: 'Shippori Mincho', 
      import: "https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;700&display=swap",
      category: '明朝体',
      description: '筆の質感を残した明朝体'
    },
    { 
      name: 'Zen Maru Gothic', 
      import: "https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700&display=swap",
      category: '丸ゴシック',
      description: 'やわらかい印象の丸ゴシック'
    },
    { 
      name: 'Zen Kaku Gothic New', 
      import: "https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap",
      category: 'ゴシック体',
      description: 'モダンな角ゴシック体'
    },
    { 
      name: 'Zen Old Mincho', 
      import: "https://fonts.googleapis.com/css2?family=Zen+Old+Mincho:wght@400;500;700&display=swap",
      category: '明朝体',
      description: '伝統的な明朝体'
    },
    { 
      name: 'Yuji Syuku', 
      import: "https://fonts.googleapis.com/css2?family=Yuji+Syuku&display=swap",
      category: '手書き風',
      description: '肉筆の質感を持つフォント'
    },
    { 
      name: 'Murecho', 
      import: "https://fonts.googleapis.com/css2?family=Murecho:wght@400;500;700&display=swap",
      category: 'ゴシック体',
      description: '無印良品風のシンプルなゴシック'
    },
    { 
      name: 'Klee One', 
      import: "https://fonts.googleapis.com/css2?family=Klee+One:wght@400;600&display=swap",
      category: '手書き風',
      description: '教科書体風の手書きフォント'
    },
    { 
      name: 'Kaisei Decol', 
      import: "https://fonts.googleapis.com/css2?family=Kaisei+Decol:wght@400;500;700&display=swap",
      category: 'デコラティブ',
      description: '装飾的な楷書体'
    },
    { 
      name: 'Kaisei Tokumin', 
      import: "https://fonts.googleapis.com/css2?family=Kaisei+Tokumin:wght@400;500;700;800&display=swap",
      category: '明朝体',
      description: '読みやすい楷書系明朝体'
    },
    { 
      name: 'Hina Mincho', 
      import: "https://fonts.googleapis.com/css2?family=Hina+Mincho&display=swap",
      category: '明朝体',
      description: '繊細な明朝体'
    },
    // ここに新しい日本語フォントを追加
  ],
  
  // 英語フォント
  english: [
    { 
      name: 'Roboto', 
      import: "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap",
      category: 'Sans-serif',
      description: 'Modern and clean sans-serif'
    },
    { 
      name: 'Open Sans', 
      import: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&display=swap",
      category: 'Sans-serif',
      description: 'Friendly and readable sans-serif'
    },
    { 
      name: 'Lato', 
      import: "https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap",
      category: 'Sans-serif',
      description: 'Humanist sans-serif'
    },
    { 
      name: 'Montserrat', 
      import: "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap",
      category: 'Sans-serif',
      description: 'Geometric sans-serif'
    },
    { 
      name: 'Playfair Display', 
      import: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap",
      category: 'Serif',
      description: 'Elegant serif with high contrast'
    },
    { 
      name: 'Inter', 
      import: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
      category: 'Sans-serif',
      description: 'UI optimized sans-serif'
    },
    // ここに新しい英語フォントを追加
  ],
  
  // システムフォント
  system: [
    {
      name: 'System UI',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      import: null,
      category: 'システム',
      description: 'OSのデフォルトフォント'
    },
    {
      name: 'Yu Gothic',
      fontFamily: '"Yu Gothic", "游ゴシック", YuGothic, "游ゴシック体", sans-serif',
      import: null,
      category: 'システム',
      description: 'Windows/Mac標準の游ゴシック'
    },
    {
      name: 'Yu Mincho',
      fontFamily: '"Yu Mincho", "游明朝", YuMincho, "游明朝体", serif',
      import: null,
      category: 'システム',
      description: 'Windows/Mac標準の游明朝'
    },
  ]
};

// すべてのフォントを一つの配列にまとめる関数
export function getAllFonts() {
  return [
    ...availableFonts.japanese,
    ...availableFonts.english,
    ...availableFonts.system
  ];
}

// カテゴリ別にフォントを取得する関数
export function getFontsByCategory(category) {
  return getAllFonts().filter(font => font.category === category);
}

// フォント名から情報を取得する関数
export function getFontInfo(fontName) {
  return getAllFonts().find(font => font.name === fontName);
}