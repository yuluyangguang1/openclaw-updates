const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// 找到 UPDATES_DATA 的开始和结束
const startIdx = html.indexOf('const UPDATES_DATA = [');
if (startIdx === -1) { console.log('UPDATES_DATA not found!'); process.exit(1); }

// 用括号计数法找到数组结束位置
let depth = 0;
let inString = false;
let stringChar = '';
let endIdx = -1;

for (let i = startIdx + 'const UPDATES_DATA = '.length; i < html.length; i++) {
  const ch = html[i];
  const prevCh = i > 0 ? html[i-1] : '';

  if (inString) {
    if (ch === stringChar && prevCh !== '\\') {
      inString = false;
    }
    continue;
  }

  if (ch === '"' || ch === "'") {
    inString = true;
    stringChar = ch;
    continue;
  }

  if (ch === '[') depth++;
  if (ch === ']') {
    depth--;
    if (depth === 0) {
      endIdx = i + 1;
      break;
    }
  }
}

if (endIdx === -1) {
  console.log('Could not find end of UPDATES_DATA!');
  process.exit(1);
}

const arrayStr = html.substring(startIdx + 'const UPDATES_DATA = '.length, endIdx);

// 用 eval 解析（因为这是合法的 JS 对象数组，不是标准 JSON）
let data;
try {
  eval('data = ' + arrayStr);
} catch (e) {
  console.log('Parse error:', e.message);
  // 试着找到出错位置
  console.log('Array starts at char', startIdx);
  console.log('First 200 chars:', arrayStr.substring(0, 200));
  console.log('Around char 5000:', arrayStr.substring(4900, 5200));
  process.exit(1);
}

console.log('Total entries in UPDATES_DATA:', data.length);
console.log('\nAll versions in order:');
data.forEach((item, i) => {
  console.log(`  ${i+1}. v${item.version} (${item.date}) - ${item.title ? item.title.substring(0, 40) : 'NO TITLE'}`);
});

// 检查缺失 title 的
const noTitle = data.filter(item => !item.title || item.title.trim() === '');
console.log(`\nEntries with no title: ${noTitle.length}`);
noTitle.forEach(item => console.log(`  v${item.version}`));
