import requests
import json

# FAQエンドポイントをテスト
base_url = "http://localhost:3000"
faq_endpoints = [
    "/api/faq",
    "/api/faq/published"
]

print("=== FAQ APIエンドポイントのテスト ===\n")

for endpoint in faq_endpoints:
    print(f"\nテスト中: {endpoint}")
    try:
        response = requests.get(f"{base_url}{endpoint}")
        print(f"ステータスコード: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"レスポンスのキー: {list(data.keys())}")
            
            if 'results' in data:
                print(f"FAQ数: {len(data['results'])}")
                if data['results']:
                    print("\n最初のFAQアイテム:")
                    print(json.dumps(data['results'][0], indent=2, ensure_ascii=False))
            else:
                print("データ構造:")
                print(json.dumps(data, indent=2, ensure_ascii=False))
        else:
            print(f"エラーレスポンス: {response.text}")
    except Exception as e:
        print(f"エラー: {str(e)}")

# 直接Notion APIでFAQマスターを取得して比較
print("\n\n=== 直接Notion APIでFAQマスターを取得 ===")
notion_api_key = "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"
headers = {
    "Authorization": f"Bearer {notion_api_key}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

faq_master_id = "212b802c-b0c6-80ea-b7ed-ef4459f38819"
query_url = f"https://api.notion.com/v1/databases/{faq_master_id}/query"

# 公開されているFAQのみを取得
query_filter = {
    "filter": {
        "property": "公開",
        "checkbox": {
            "equals": True
        }
    }
}

response = requests.post(query_url, headers=headers, json=query_filter)
if response.status_code == 200:
    data = response.json()
    print(f"\n公開されているFAQ数: {len(data.get('results', []))}")
    
    for i, item in enumerate(data.get('results', [])):
        props = item.get('properties', {})
        question = "".join([t.get('plain_text', '') for t in props.get('質問', {}).get('title', [])])
        is_public = props.get('公開', {}).get('checkbox', False)
        print(f"\n{i+1}. {question}")
        print(f"   公開: {is_public}")
        print(f"   ID: {item.get('id')}")