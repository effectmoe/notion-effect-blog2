// 日本語フォントのサブセット化設定

// 頻出漢字（常用漢字から抜粋）
export const KANJI_SUBSET = '一二三四五六七八九十百千万円年月日時分秒人名前後新入出上下左右大小中外内男女子学生会社国家間田山川水火木金土本体作品事物者用意見聞食言語文字書読話電気車道路駅店屋室部門番号数量質問題答案計画定決選度回目手足頭顔心思考知識情報理由原因結果効果能力可能性質特長短利益損失勝負成功失敗始終続変化発展進歩退後期限速遅早近遠高低強弱多少全部分半両方向側面表裏正反対違同様式方法手段目的理論実践経験教育学習研究調査分析総合判断評価記録報告発表示説明解釈証明確認否定疑問希望願望期待不安心配恐怖喜怒哀楽愛憎好嫌美醜善悪真偽';

// ひらがな
export const HIRAGANA = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽゃゅょっぁぃぅぇぉ';

// カタカナ
export const KATAKANA = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポャュョッァィゥェォヴー';

// 英数字と記号
export const ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
export const SYMBOLS = '！？。、・「」『』（）｛｝［］【】〈〉《》〔〕〜ー＿／＼｜＋−＝＊＆％＄＃＠！？.,;:\'"-_/\\|+=*&%$#@!?';

// 完全なサブセット
export const FONT_SUBSET = HIRAGANA + KATAKANA + KANJI_SUBSET + ALPHANUMERIC + SYMBOLS;

// Google Fonts APIのtext parameterに使用する文字列（URLエンコードが必要）
export const getGoogleFontsSubsetUrl = (fontFamily: string, weights: number[] = [400, 700]) => {
  const encodedText = encodeURIComponent(FONT_SUBSET);
  const weightString = weights.join(',');
  return `https://fonts.googleapis.com/css2?family=${fontFamily}:wght@${weightString}&text=${encodedText}&display=swap`;
};

// Noto Sans JPの最適化されたURL
export const NOTO_SANS_JP_SUBSET_URL = getGoogleFontsSubsetUrl('Noto+Sans+JP', [300, 400, 700]);

// フォント読み込み状態を管理するためのキー
export const FONT_LOADING_STAGES = {
  SYSTEM: 'system',      // システムフォント
  BASIC: 'basic',        // 基本ウェイト(400)
  COMPLETE: 'complete'   // 全ウェイト
} as const;

export type FontLoadingStage = typeof FONT_LOADING_STAGES[keyof typeof FONT_LOADING_STAGES];