import requests
import json
from notion_client import NotionAPI

# Notion APIの設定
notion_token = "v03%3AeyJhbGciOiJkaXIiLCJraWQiOiJwcm9kdWN0aW9uOnRva2VuLXYzOjIwMjQtMTEtMDciLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIn0..LB1_tXvFt6AliP9NcPVnDQ.fbaTG1bNytjOVS57mdhZ8WcRsogkjy--RcgdMoQgxYiOa_5pINIuVTv11EYCvBCz-zPBBcvbwGoLwztlIvsJWMAI-2mEkifvFI1secC26YqsING8TANneSTfAUZbRgoh1xEjPLPKfRNl27KC42b6hKcO1XpTQ4E9cMyMXR3ep38GaG0uFGRc-9I3r5rJMkgInJOh3fgE8c5W9NxaQNg88wEcEzZDCFlBIRcbh-leT2kZhf21vHyiXY9vnR2tOr3e77yl5B8yTHwI6kfQxnM2MRgUcxYg22jqp1PkX0wb_ZwR9m_1lri8MAIjjGemkOk6FLRSNGE3QX0boAHokWdLchX4jSUXOVOeXqQvOn_Xn3LgKn6LanfCde6kYfbLwncMlLJaa51LcfmcBx4-PDlLJDRZBZphcRKW87thOHXC8N0.CCmBq7o-i-GRTe3nY0-T2_SSkURxAFzYqcqPQisc-wov03%3AeyJhbGciOiJkaXIiLCJraWQiOiJwcm9kdWN0aW9uOnRva2VuLXYzOjIwMjQtMTEtMDciLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIn0..LB1_tXvFt6AliP9NcPVnDQ.fbaTG1bNytjOVS57mdhZ8WcRsogkjy--RcgdMoQgxYiOa_5pINIuVTv11EYCvBCz-zPBBcvbwGoLwztlIvsJWMAI-2mEkifvFI1secC26YqsING8TANneSTfAUZbRgoh1xEjPLPKfRNl27KC42b6hKcO1XpTQ4E9cMyMXR3ep38GaG0uFGRc-9I3r5rJMkgInJOh3fgE8c5W9NxaQNg88wEcEzZDCFlBIRcbh-leT2kZhf21vHyiXY9vnR2tOr3e77yl5B8yTHwI6kfQxnM2MRgUcxYg22jqp1PkX0wb_ZwR9m_1lri8MAIjjGemkOk6FLRSNGE3QX0boAHokWdLchX4jSUXOVOeXqQvOn_Xn3LgKn6LanfCde6kYfbLwncMlLJaa51LcfmcBx4-PDlLJDRZBZphcRKW87thOHXC8N0.CCmBq7o-i-GRTe3nY0-T2_SSkURxAFzYqcqPQisc-wo"
active_user = "91b6494e-7ede-45b2-99f9-402ae7d7fcee"

# notion-clientライブラリでFAQマスターデータベースを取得
print("=== notion-clientライブラリでFAQマスターを取得 ===\n")

try:
    from notion_client import NotionAPI
    
    notion = NotionAPI(
        authToken=notion_token,
        activeUser=active_user,
        userTimeZone='Asia/Tokyo'
    )
    
    faq_master_id = "212b802c-b0c6-80ea-b7ed-ef4459f38819"
    
    print(f"FAQマスターデータベース（{faq_master_id}）を取得中...")
    
    # データベースを取得
    record_map = notion.getPage(faq_master_id)
    
    # コレクションとビューを確認
    collection_id = list(record_map.get('collection', {}).keys())[0] if record_map.get('collection') else None
    collection_view_id = list(record_map.get('collection_view', {}).keys())[0] if record_map.get('collection_view') else None
    
    print(f"Collection ID: {collection_id}")
    print(f"Collection View ID: {collection_view_id}")
    
    if collection_id and collection_view_id:
        # コレクションデータを取得
        collection_data = notion.getCollectionData(
            collection_id,
            collection_view_id,
            {
                'limit': 999,
                'searchQuery': '',
                'userTimeZone': 'Asia/Tokyo'
            }
        )
        
        # スキーマを確認
        collection = record_map['collection'][collection_id]['value']
        schema = collection.get('schema', {})
        
        print("\n=== データベーススキーマ ===")
        for prop_id, prop_info in schema.items():
            print(f"{prop_id}: {prop_info.get('name')} ({prop_info.get('type')})")
        
        # 実際のデータを確認
        print("\n=== FAQアイテムのサンプル ===")
        if collection_data.get('result') and collection_data['result'].get('blockIds'):
            for i, block_id in enumerate(collection_data['result']['blockIds'][:3]):
                block = collection_data.get('recordMap', {}).get('block', {}).get(block_id, {}).get('value', {})
                
                if block and block.get('properties'):
                    print(f"\nアイテム {i+1} (ID: {block_id}):")
                    print(f"Properties keys: {list(block['properties'].keys())}")
                    
                    # 各プロパティの値を表示
                    for prop_id, prop_value in block['properties'].items():
                        prop_name = schema.get(prop_id, {}).get('name', prop_id)
                        print(f"  {prop_name}: {prop_value}")
                        
                        # 公開プロパティの値の形式を特に確認
                        if prop_name == '公開':
                            print(f"    -> 公開プロパティの完全な値: {json.dumps(prop_value, ensure_ascii=False)}")
                            print(f"    -> prop_value[0][0]の値: {prop_value[0][0] if prop_value and len(prop_value) > 0 and len(prop_value[0]) > 0 else 'None'}")
        
except Exception as e:
    print(f"エラー: {str(e)}")
    import traceback
    traceback.print_exc()