import requests
import json

# FAQマスターデータベースのAPIをデバッグモードで呼び出す
base_url = "http://localhost:3000"
faq_master_id = "212b802c-b0c6-80ea-b7ed-ef4459f38819"

print("=== FAQ APIのデバッグ ===\n")

# APIを呼び出してレスポンスを確認
url = f"{base_url}/api/fetch-faq-database?databaseId={faq_master_id}"
print(f"呼び出しURL: {url}")

response = requests.get(url)
print(f"ステータスコード: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    print(f"\nレスポンス:")
    print(json.dumps(data, indent=2, ensure_ascii=False))
    
    # アイテムが0の場合、サーバーログを確認する必要がある
    if data.get('totalItems', 0) == 0:
        print("\nアイテムが0件です。サーバーログを確認してください。")
else:
    print(f"エラー: {response.text}")

# 直接Notion APIでデータ形式を確認
print("\n\n=== Notion APIでデータ形式を確認 ===")

notion_api_key = "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"
headers = {
    "Authorization": f"Bearer {notion_api_key}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

# データベースのすべてのアイテムを取得（フィルタなし）
query_url = f"https://api.notion.com/v1/databases/{faq_master_id}/query"
response = requests.post(query_url, headers=headers, json={})

if response.status_code == 200:
    data = response.json()
    print(f"\n全アイテム数: {len(data.get('results', []))}")
    
    # 最初のアイテムの公開プロパティを詳しく見る
    if data.get('results'):
        item = data.get('results')[0]
        props = item.get('properties', {})
        
        print("\n最初のアイテムのプロパティ:")
        for prop_name, prop_value in props.items():
            print(f"\n{prop_name}:")
            print(f"  タイプ: {prop_value.get('type')}")
            print(f"  値: {json.dumps(prop_value, indent=2, ensure_ascii=False)}")
            
            # チェックボックスの場合の値を特に確認
            if prop_value.get('type') == 'checkbox':
                print(f"  チェックボックスの値: {prop_value.get('checkbox')}")
                print(f"  真偽値: {prop_value.get('checkbox') == True}")