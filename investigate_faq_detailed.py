import requests
import json
import time

# Notion API設定
notion_api_key = "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"
headers = {
    "Authorization": f"Bearer {notion_api_key}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

def get_all_blocks(page_id, start_cursor=None):
    """ページ内のすべてのブロックを再帰的に取得"""
    all_blocks = []
    
    url = f"https://api.notion.com/v1/blocks/{page_id}/children"
    params = {}
    if start_cursor:
        params['start_cursor'] = start_cursor
    
    response = requests.get(url, headers=headers, params=params)
    if response.status_code != 200:
        print(f"エラー: {response.status_code}")
        print(response.text)
        return all_blocks
    
    data = response.json()
    blocks = data.get('results', [])
    all_blocks.extend(blocks)
    
    # ページネーション対応
    if data.get('has_more'):
        time.sleep(0.3)  # レート制限対策
        more_blocks = get_all_blocks(page_id, data.get('next_cursor'))
        all_blocks.extend(more_blocks)
    
    return all_blocks

# CafeKinesiページのブロックを取得
page_id = "1ceb802cb0c680f29369dba86095fb38"
print("CafeKinesiページのブロックを取得中...")
blocks = get_all_blocks(page_id)

print(f"\n取得したブロック総数: {len(blocks)}")

# ブロックの詳細を表示
print("\n=== 全ブロックの詳細 ===")
for i, block in enumerate(blocks):
    block_type = block.get('type', 'unknown')
    block_id = block.get('id', '')
    
    print(f"\n--- ブロック {i+1} ---")
    print(f"タイプ: {block_type}")
    print(f"ID: {block_id}")
    
    # ブロックタイプごとの内容表示
    if block_type == 'heading_1':
        rich_text = block.get('heading_1', {}).get('rich_text', [])
        text = "".join([t.get('plain_text', '') for t in rich_text])
        print(f"テキスト: {text}")
    elif block_type == 'paragraph':
        rich_text = block.get('paragraph', {}).get('rich_text', [])
        text = "".join([t.get('plain_text', '') for t in rich_text])
        if text:
            print(f"テキスト: {text[:100]}...")
    elif block_type == 'child_database':
        child_db = block.get('child_database', {})
        print(f"データベースタイトル: {child_db.get('title', 'なし')}")
        print(f"child_databaseの全プロパティ: {json.dumps(child_db, indent=2, ensure_ascii=False)}")

# 「よくある質問」の次のブロックを特定
print("\n\n=== 「よくある質問」の次のブロックを探索 ===")
for i, block in enumerate(blocks):
    if block.get('type') == 'heading_1':
        rich_text = block.get('heading_1', {}).get('rich_text', [])
        text = "".join([t.get('plain_text', '') for t in rich_text])
        if "よくある質問" in text:
            print(f"\n「よくある質問」が見つかりました！")
            print(f"位置: {i+1}番目のブロック")
            
            if i + 1 < len(blocks):
                next_block = blocks[i + 1]
                print(f"\n次のブロックの完全な情報:")
                print(json.dumps(next_block, indent=2, ensure_ascii=False))
                
                # FAQマスターデータベースの詳細分析
                if next_block.get('type') == 'child_database':
                    print("\n\n=== FAQマスターデータベースの詳細分析 ===")
                    
                    # データベースIDを使って直接データベース情報を取得
                    db_id = next_block.get('id')
                    db_url = f"https://api.notion.com/v1/databases/{db_id}"
                    db_response = requests.get(db_url, headers=headers)
                    
                    if db_response.status_code == 200:
                        db_data = db_response.json()
                        print("\nデータベースの詳細情報:")
                        print(f"タイトル: {db_data.get('title', [])}")
                        print(f"説明: {db_data.get('description', [])}")
                        print(f"プロパティ: {list(db_data.get('properties', {}).keys())}")
                        print(f"親ページID: {db_data.get('parent', {}).get('page_id')}")
                        print(f"URL: {db_data.get('url')}")
                        print(f"公開URL: {db_data.get('public_url')}")
                        print(f"アーカイブ状態: {db_data.get('archived')}")
                        print(f"インラインかどうか: {db_data.get('is_inline')}")
                        
                        # プロパティの詳細
                        print("\nプロパティの詳細:")
                        for prop_name, prop_data in db_data.get('properties', {}).items():
                            print(f"  - {prop_name}: {prop_data.get('type')}")
                    else:
                        print(f"データベース情報の取得に失敗: {db_response.status_code}")
                        print(db_response.text)
                
                # 他のchild_databaseと比較
                print("\n\n=== 他のデータベースとの比較 ===")
                other_dbs = [b for b in blocks if b.get('type') == 'child_database' and b.get('id') != next_block.get('id')]
                
                for other_db in other_dbs[:3]:  # 最初の3つと比較
                    print(f"\n比較対象DB ID: {other_db.get('id')}")
                    print(f"構造の違い:")
                    print(f"  FAQマスターのキー: {set(next_block.keys())}")
                    print(f"  このDBのキー: {set(other_db.keys())}")
                    print(f"  child_databaseプロパティの違い:")
                    print(f"    FAQマスター: {set(next_block.get('child_database', {}).keys())}")
                    print(f"    このDB: {set(other_db.get('child_database', {}).keys())}")
            break