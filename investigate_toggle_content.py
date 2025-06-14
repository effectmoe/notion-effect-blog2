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

def get_block_children(block_id):
    """ブロックの子要素を取得"""
    url = f"https://api.notion.com/v1/blocks/{block_id}/children"
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print(f"エラー: {response.status_code}")
        return []
    
    data = response.json()
    return data.get('results', [])

# toggleブロックの内容を取得
toggle_id = "212b802c-b0c6-800f-9a7f-e1b106d76f12"
print(f"Toggleブロック（ID: {toggle_id}）の内容を取得中...")

children = get_block_children(toggle_id)
print(f"\nToggle内のブロック数: {len(children)}")

# Toggle内の各ブロックを表示
for i, block in enumerate(children):
    block_type = block.get('type', 'unknown')
    block_id = block.get('id', '')
    
    print(f"\n--- Toggle内ブロック {i+1} ---")
    print(f"タイプ: {block_type}")
    print(f"ID: {block_id}")
    
    # ヘッダーテキストを取得
    if block_type == 'heading_1':
        rich_text = block.get('heading_1', {}).get('rich_text', [])
        text = "".join([t.get('plain_text', '') for t in rich_text])
        print(f"テキスト: {text}")
        
        # 「よくある質問」の次のブロックを探す
        if "よくある質問" in text:
            print("\n「よくある質問」を発見！次のブロックを確認...")
            if i + 1 < len(children):
                next_block = children[i + 1]
                print(f"\n次のブロックの詳細:")
                print(json.dumps(next_block, indent=2, ensure_ascii=False))
                
                # child_databaseの場合、詳細を取得
                if next_block.get('type') == 'child_database':
                    db_id = next_block.get('id')
                    print(f"\n\nFAQマスターデータベース（ID: {db_id}）の詳細を取得中...")
                    
                    # データベースの詳細情報を取得
                    db_url = f"https://api.notion.com/v1/databases/{db_id}"
                    db_response = requests.get(db_url, headers=headers)
                    
                    if db_response.status_code == 200:
                        db_data = db_response.json()
                        print("\n=== FAQマスターデータベースの完全な情報 ===")
                        print(json.dumps(db_data, indent=2, ensure_ascii=False))
                        
                        # 重要なプロパティを抽出
                        print("\n\n=== 重要なプロパティ ===")
                        print(f"データベースID: {db_data.get('id')}")
                        print(f"タイトル: {[t.get('plain_text', '') for t in db_data.get('title', [])]}")
                        print(f"親ページID: {db_data.get('parent', {}).get('page_id')}")
                        print(f"インライン: {db_data.get('is_inline')}")
                        print(f"アーカイブ: {db_data.get('archived')}")
                        print(f"URL: {db_data.get('url')}")
                        print(f"公開URL: {db_data.get('public_url')}")
                        
                        print("\n=== プロパティ一覧 ===")
                        for prop_name, prop_data in db_data.get('properties', {}).items():
                            print(f"{prop_name}:")
                            print(f"  - タイプ: {prop_data.get('type')}")
                            print(f"  - ID: {prop_data.get('id')}")
                            
                        # データベース内のアイテムを取得
                        print("\n\n=== データベース内のアイテムを確認 ===")
                        query_url = f"https://api.notion.com/v1/databases/{db_id}/query"
                        query_response = requests.post(query_url, headers=headers, json={})
                        
                        if query_response.status_code == 200:
                            items = query_response.json()
                            print(f"アイテム数: {len(items.get('results', []))}")
                            if items.get('results'):
                                print("\n最初のアイテムのサンプル:")
                                print(json.dumps(items.get('results')[0], indent=2, ensure_ascii=False))
                        else:
                            print(f"アイテム取得エラー: {query_response.status_code}")
                            print(query_response.text)
                    else:
                        print(f"データベース詳細取得エラー: {db_response.status_code}")
                        print(db_response.text)
                        
    elif block_type == 'child_database':
        child_db = block.get('child_database', {})
        print(f"データベースタイトル: {child_db.get('title', 'なし')}")

# 他のデータベースと比較するため、メインページのデータベースも確認
print("\n\n=== メインページのデータベース（カフェキネシコンテンツ）の詳細 ===")
main_db_id = "20fb802c-b0c6-8057-a57d-caa1e1172c0c"
db_url = f"https://api.notion.com/v1/databases/{main_db_id}"
db_response = requests.get(db_url, headers=headers)

if db_response.status_code == 200:
    db_data = db_response.json()
    print(f"データベースID: {db_data.get('id')}")
    print(f"タイトル: {[t.get('plain_text', '') for t in db_data.get('title', [])]}")
    print(f"インライン: {db_data.get('is_inline')}")
    print(f"アーカイブ: {db_data.get('archived')}")
    print(f"プロパティ: {list(db_data.get('properties', {}).keys())}")