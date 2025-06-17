// Script to investigate why grouped list views behave differently for different databases
// Run with: node investigate-grouped-lists.js

const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

async function investigateDatabase(databaseId, databaseName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Investigating: ${databaseName}`);
  console.log(`Database ID: ${databaseId}`);
  console.log(`${'='.repeat(60)}`);

  try {
    // Get database metadata
    const database = await notion.databases.retrieve({
      database_id: databaseId
    });

    console.log('\n📊 Database Properties:');
    Object.entries(database.properties).forEach(([name, prop]) => {
      console.log(`  - ${name}: ${prop.type}`);
      if (prop.type === 'select' || prop.type === 'multi_select') {
        console.log(`    Options: ${prop[prop.type].options.map(o => o.name).join(', ')}`);
      }
    });

    // Query the database to understand its structure
    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: 5
    });

    console.log(`\n📝 Sample entries (${response.results.length}):`);
    response.results.forEach((page, index) => {
      console.log(`\n  Entry ${index + 1}:`);
      Object.entries(page.properties).forEach(([name, prop]) => {
        let value = 'N/A';
        switch (prop.type) {
          case 'title':
            value = prop.title[0]?.plain_text || 'Empty';
            break;
          case 'select':
            value = prop.select?.name || 'None';
            break;
          case 'multi_select':
            value = prop.multi_select.map(s => s.name).join(', ') || 'None';
            break;
          case 'rich_text':
            value = prop.rich_text[0]?.plain_text || 'Empty';
            break;
          case 'checkbox':
            value = prop.checkbox ? 'Checked' : 'Unchecked';
            break;
        }
        console.log(`    ${name}: ${value}`);
      });
    });

    // Check if database is a linked database
    console.log('\n🔗 Database Type:');
    console.log(`  Is Inline: ${database.is_inline}`);
    console.log(`  Parent Type: ${database.parent.type}`);
    if (database.parent.type === 'page_id') {
      console.log(`  Parent Page: ${database.parent.page_id}`);
    } else if (database.parent.type === 'workspace') {
      console.log(`  Parent: Workspace`);
    }

  } catch (error) {
    console.error(`❌ Error investigating ${databaseName}:`, error.message);
  }
}

async function findDatabaseIds() {
  console.log('🔍 Searching for database IDs...\n');

  // Known database names to search for
  const databaseNames = [
    'カフェキネシラバーズ',
    'Cafe Kinesi Lovers',
    'FAQマスター',
    'FAQ Master'
  ];

  try {
    // Search for pages/databases
    for (const name of databaseNames) {
      console.log(`\nSearching for: "${name}"`);
      
      const response = await notion.search({
        query: name,
        filter: {
          property: 'object',
          value: 'database'
        }
      });

      if (response.results.length > 0) {
        console.log(`✅ Found ${response.results.length} database(s)`);
        for (const db of response.results) {
          console.log(`  - ID: ${db.id}`);
          console.log(`    Title: ${db.title[0]?.plain_text || 'No title'}`);
          await investigateDatabase(db.id, name);
        }
      } else {
        console.log(`❌ No database found with name: ${name}`);
      }
    }
  } catch (error) {
    console.error('Error searching databases:', error);
  }
}

// Main execution
(async () => {
  console.log('🚀 Starting Grouped List View Investigation\n');
  console.log('This script will help identify differences between databases');
  console.log('that might affect grouped list view behavior.\n');

  await findDatabaseIds();

  console.log('\n\n📋 Summary:');
  console.log('Compare the properties above to identify differences that might');
  console.log('affect grouped list view rendering, particularly:');
  console.log('- Select/Multi-select properties used for grouping');
  console.log('- Database structure (inline vs linked)');
  console.log('- Property configurations');
})();