const fs = require('fs');
const util = require('util');

// dev5.logからデータを読み込む
const logContent = fs.readFileSync('dev5.log', 'utf8');

// recordMapデータを探す
const recordMapMatch = logContent.match(/recordMap: {[\s\S]*?collection_view: {[\s\S]*?}/);

if (recordMapMatch) {
  console.log('Found recordMap section, but data is stringified.');
  console.log('Looking for specific view ID: 212b802c-b0c6-80ff-9c41-000cec7d8204');
  
  // ビューIDの周辺の情報を探す
  const viewIdRegex = /'212b802c-b0c6-80ff-9c41-000cec7d8204':\s*\[Object\]/g;
  const matches = logContent.match(viewIdRegex);
  if (matches) {
    console.log(`Found ${matches.length} occurrences of the FAQ Master view ID`);
  }
}

// 他のビューIDも探して比較
console.log('\nSearching for other view IDs for comparison:');
const viewIds = [
  '20fb802c-b0c6-80b2-a9ff-000cb1533162',
  '1ceb802c-b0c6-811c-86ef-000c4141e47c',
  '20db802c-b0c6-8066-846e-000cd27e4a85'
];

viewIds.forEach(id => {
  const regex = new RegExp(`'${id}':\\s*\\[Object\\]`, 'g');
  const matches = logContent.match(regex);
  if (matches) {
    console.log(`View ID ${id}: found ${matches.length} times`);
  }
});