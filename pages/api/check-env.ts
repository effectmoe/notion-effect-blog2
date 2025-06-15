import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Notion関連の環境変数をチェック（値は表示しない）
  const notionEnvVars = Object.keys(process.env)
    .filter(key => key.includes('NOTION'))
    .map(key => ({
      name: key,
      exists: true,
      firstChars: process.env[key]?.substring(0, 10) + '...'
    }))

  res.status(200).json({
    notionEnvVars,
    totalEnvVars: Object.keys(process.env).length,
    message: 'Available Notion environment variables'
  })
}