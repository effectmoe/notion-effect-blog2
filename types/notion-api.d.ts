// Notion API型定義の拡張
declare module '@notionhq/client' {
  export interface Client {
    databases: {
      retrieve: (args: { database_id: string }) => Promise<any>
      query: (args: { database_id: string; [key: string]: any }) => Promise<any>
    }
    pages: {
      retrieve: (args: { page_id: string }) => Promise<any>
    }
  }
}