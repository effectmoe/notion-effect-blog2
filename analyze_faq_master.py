import requests
import json

# Notion API設定
notion_api_key = "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"
headers = {
    "Authorization": f"Bearer {notion_api_key}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

# FAQマスターとカフェキネシコンテンツの両方を詳細比較
faq_master_id = "212b802c-b0c6-80ea-b7ed-ef4459f38819"
cafe_content_id = "1ceb802c-b0c6-814a-b43e-ddb38e80f2e0"

print("=== FAQマスターデータベースの詳細分析 ===\n")

# FAQマスターの詳細を取得
faq_url = f"https://api.notion.com/v1/databases/{faq_master_id}"
faq_response = requests.get(faq_url, headers=headers)

if faq_response.status_code == 200:
    faq_data = faq_response.json()
    
    print("1. 基本情報:")
    print(f"   - ID: {faq_data.get('id')}")
    print(f"   - タイトル: {[t.get('plain_text', '') for t in faq_data.get('title', [])]}")
    print(f"   - 説明: {[t.get('plain_text', '') for t in faq_data.get('description', [])]}")
    print(f"   - 作成日時: {faq_data.get('created_time')}")
    print(f"   - 最終更新: {faq_data.get('last_edited_time')}")
    print(f"   - アーカイブ: {faq_data.get('archived')}")
    print(f"   - インライン: {faq_data.get('is_inline')}")
    
    print("\n2. 親要素情報:")
    parent = faq_data.get('parent', {})
    print(f"   - タイプ: {parent.get('type')}")
    print(f"   - ページID: {parent.get('page_id')}")
    
    print("\n3. URL情報:")
    print(f"   - URL: {faq_data.get('url')}")
    print(f"   - 公開URL: {faq_data.get('public_url')}")
    
    print("\n4. プロパティ詳細:")
    for prop_name, prop_data in faq_data.get('properties', {}).items():
        print(f"\n   {prop_name}:")
        print(f"     - タイプ: {prop_data.get('type')}")
        print(f"     - ID: {prop_data.get('id')}")
        if prop_data.get('type') == 'title':
            print(f"     - タイトル設定: {prop_data.get('title', {})}")
        elif prop_data.get('type') == 'rich_text':
            print(f"     - リッチテキスト設定: {prop_data.get('rich_text', {})}")
    
    # データベースの内容を確認
    print("\n\n5. データベース内のアイテム:")
    query_url = f"https://api.notion.com/v1/databases/{faq_master_id}/query"
    query_response = requests.post(query_url, headers=headers, json={})
    
    if query_response.status_code == 200:
        items = query_response.json()
        print(f"   - 総アイテム数: {len(items.get('results', []))}")
        
        if items.get('results'):
            print("\n   最初の3アイテム:")
            for i, item in enumerate(items.get('results', [])[:3]):
                print(f"\n   アイテム {i+1}:")
                print(f"     - ID: {item.get('id')}")
                print(f"     - アーカイブ: {item.get('archived')}")
                props = item.get('properties', {})
                for prop_name, prop_value in props.items():
                    if prop_value.get('type') == 'title' and prop_value.get('title'):
                        text = "".join([t.get('plain_text', '') for t in prop_value.get('title', [])])
                        if text:
                            print(f"     - {prop_name}: {text}")
else:
    print(f"FAQマスター取得エラー: {faq_response.status_code}")
    print(faq_response.text)

# カフェキネシコンテンツとの比較
print("\n\n=== カフェキネシコンテンツデータベースとの比較 ===\n")

cafe_url = f"https://api.notion.com/v1/databases/{cafe_content_id}"
cafe_response = requests.get(cafe_url, headers=headers)

if cafe_response.status_code == 200:
    cafe_data = cafe_response.json()
    
    print("構造の違い:")
    print(f"\n1. タイトル:")
    print(f"   - FAQマスター: {[t.get('plain_text', '') for t in faq_data.get('title', [])]}")
    print(f"   - カフェキネシ: {[t.get('plain_text', '') for t in cafe_data.get('title', [])]}")
    
    print(f"\n2. インライン設定:")
    print(f"   - FAQマスター: {faq_data.get('is_inline')}")
    print(f"   - カフェキネシ: {cafe_data.get('is_inline')}")
    
    print(f"\n3. プロパティの違い:")
    faq_props = set(faq_data.get('properties', {}).keys())
    cafe_props = set(cafe_data.get('properties', {}).keys())
    
    print(f"   - FAQマスターのプロパティ: {faq_props}")
    print(f"   - カフェキネシのプロパティ: {cafe_props}")
    print(f"   - FAQマスターのみ: {faq_props - cafe_props}")
    print(f"   - カフェキネシのみ: {cafe_props - faq_props}")
    
    print(f"\n4. 親要素の設定:")
    print(f"   - FAQマスター親: {faq_data.get('parent')}")
    print(f"   - カフェキネシ親: {cafe_data.get('parent')}")

# メインページ上のデータベースとの比較
print("\n\n=== メインページ上のデータベースとの比較 ===")
main_db_id = "20fb802c-b0c6-8057-a57d-caa1e1172c0c"
main_url = f"https://api.notion.com/v1/databases/{main_db_id}"
main_response = requests.get(main_url, headers=headers)

if main_response.status_code == 200:
    main_data = main_response.json()
    print(f"\nメインページのデータベース:")
    print(f"   - タイトル: {[t.get('plain_text', '') for t in main_data.get('title', [])]}")
    print(f"   - インライン: {main_data.get('is_inline')}")
    print(f"   - 親: {main_data.get('parent')}")
    
print("\n\n=== 重要な発見 ===")
print("1. FAQマスターはtoggleブロック内に配置されている")
print("2. メインページには別のchild_databaseブロックが存在")
print("3. FAQマスターとカフェキネシコンテンツは両方ともtoggle内に存在")
print("4. それぞれのデータベースは異なるプロパティ構造を持つ可能性がある")