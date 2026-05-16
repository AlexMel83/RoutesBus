const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'utils', 'routeLines.json');
let content = fs.readFileSync(filePath, 'utf8');

// Remove 'const routeLines = '
content = content.replace(/const\s+routeLines\s*=\s*/, '');
// Remove 'export default routeLines;' and trailing semicolon
content = content.replace(/;\s*export\s+default\s+routeLines\s*;?\s*/, '');
// Remove any remaining trailing semicolon
content = content.trim();
if (content.endsWith(';')) {
    content = content.slice(0, -1);
}

// Now we have something that looks like a JS array.
// Eval it to get the object, then stringify.
try {
    const data = eval('(' + content + ')');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log('Successfully converted routeLines.json to valid JSON.');
} catch (e) {
    console.error('Error during conversion:', e);
}
