import requests
import json

# Notion API設定
notion_api_key = "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"
headers = {
    "Authorization": f"Bearer {notion_api_key}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

# CafeKinesiページのブロックを取得
page_id = "1ceb802cb0c680f29369dba86095fb38"
url = f"https://api.notion.com/v1/blocks/{page_id}/children"

print("CafeKinesiページのブロックを取得中...")
response = requests.get(url, headers=headers)
data = response.json()

# ブロックの概要を表示
print(f"\n取得したブロック数: {len(data.get('results', []))}")
print("\n各ブロックの概要:")
for i, block in enumerate(data.get('results', [])):
    block_type = block.get('type', 'unknown')
    block_id = block.get('id', '')
    
    # テキスト内容を取得
    text_content = ""
    if block_type == "paragraph" and block.get('paragraph', {}).get('rich_text'):
        text_content = "".join([t.get('plain_text', '') for t in block['paragraph']['rich_text']])
    elif block_type == "heading_1" and block.get('heading_1', {}).get('rich_text'):
        text_content = "".join([t.get('plain_text', '') for t in block['heading_1']['rich_text']])
    
    print(f"\n{i+1}. タイプ: {block_type}")
    print(f"   ID: {block_id}")
    if text_content:
        print(f"   テキスト: {text_content[:50]}...")

# 「よくある質問」を探す
print("\n\n「よくある質問」テキストを検索中...")
faq_found = False
faq_next_block = None

for i, block in enumerate(data.get('results', [])):
    if block.get('type') == 'heading_1':
        rich_text = block.get('heading_1', {}).get('rich_text', [])
        text = "".join([t.get('plain_text', '') for t in rich_text])
        if "よくある質問" in text:
            print(f"\n「よくある質問」が見つかりました！")
            print(f"位置: {i+1}番目のブロック")
            faq_found = True
            
            # 次のブロックを取得
            if i + 1 < len(data.get('results', [])):
                faq_next_block = data.get('results', [])[i + 1]
                print(f"\n次のブロックの詳細:")
                print(json.dumps(faq_next_block, indent=2, ensure_ascii=False))
            break

# FAQマスターブロックの詳細調査
if faq_next_block and faq_next_block.get('type') == 'child_database':
    print("\n\n=== FAQマスターブロックの詳細分析 ===")
    print(f"ブロックタイプ: {faq_next_block.get('type')}")
    print(f"ブロックID: {faq_next_block.get('id')}")
    print(f"作成時刻: {faq_next_block.get('created_time')}")
    print(f"最終編集時刻: {faq_next_block.get('last_edited_time')}")
    print(f"アーカイブ状態: {faq_next_block.get('archived', False)}")
    print(f"子要素あり: {faq_next_block.get('has_children', False)}")
    
    # child_databaseの詳細
    child_db = faq_next_block.get('child_database', {})
    print(f"\nchild_databaseプロパティ:")
    print(f"  - タイトル: {child_db.get('title', 'なし')}")
    
    # 他のデータベースブロックと比較
    print("\n\n=== 他のデータベースブロックとの比較 ===")
    for block in data.get('results', []):
        if block.get('type') == 'child_database' and block.get('id') != faq_next_block.get('id'):
            print(f"\n他のデータベース: {block.get('id')}")
            other_db = block.get('child_database', {})
            print(f"  タイトル: {other_db.get('title', 'なし')}")
            print(f"  構造の比較:")
            print(f"    - FAQマスター: {set(child_db.keys())}")
            print(f"    - このDB: {set(other_db.keys())}")