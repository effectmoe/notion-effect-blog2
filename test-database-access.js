// Test script to debug Notion database access
// Run with: node test-database-access.js

async function testDatabaseAccess() {
  // Get API key from environment
  const apiKey = process.env.NOTION_API_KEY || process.env.NOTION_API_SECRET;
  
  if (!apiKey) {
    console.error('❌ No API key found in NOTION_API_KEY or NOTION_API_SECRET');
    console.log('Please set one of these environment variables');
    return;
  }
  
  console.log('🔑 API key found:', apiKey.substring(0, 10) + '...');
  
  // Test different database ID formats
  const databaseIds = [
    '1ceb802cb0c681e8a45e000ba000bfe2',  // Without hyphens (from code)
    '1ceb802c-b0c6-81e8-a45e-000ba000bfe2',  // With hyphens (standard format)
    '1ceb802c-b0c6-80f2-9369-dba86095fb38',  // Trying another format
  ];
  
  for (const dbId of databaseIds) {
    console.log(`\n📊 Testing database ID: ${dbId}`);
    
    try {
      // Try to retrieve database info
      const response = await fetch(`https://api.notion.com/v1/databases/${dbId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Notion-Version': '2022-06-28'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Success! Database found:', data.title?.[0]?.plain_text || 'Untitled');
        console.log('Properties:', Object.keys(data.properties || {}));
        
        // Try a simple query
        console.log('\n🔍 Attempting query...');
        const queryResponse = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            page_size: 1
          })
        });
        
        if (queryResponse.ok) {
          const queryData = await queryResponse.json();
          console.log('✅ Query successful! Results:', queryData.results.length);
        } else {
          const errorText = await queryResponse.text();
          console.log('❌ Query failed:', queryResponse.status, errorText);
        }
        
      } else {
        const errorText = await response.text();
        console.log('❌ Failed:', response.status, errorText);
      }
      
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }
  
  // Also test search API to find databases
  console.log('\n🔎 Searching for all accessible databases...');
  try {
    const searchResponse = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filter: {
          property: 'object',
          value: 'database'
        },
        page_size: 10
      })
    });
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log(`\n📚 Found ${searchData.results.length} databases:`);
      searchData.results.forEach((db, i) => {
        console.log(`${i + 1}. ID: ${db.id} - ${db.title?.[0]?.plain_text || 'Untitled'}`);
      });
    } else {
      const errorText = await searchResponse.text();
      console.log('❌ Search failed:', searchResponse.status, errorText);
    }
    
  } catch (error) {
    console.log('❌ Search error:', error.message);
  }
}

// Run the test
testDatabaseAccess();