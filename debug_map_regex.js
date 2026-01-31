
const fs = require('fs');
const path = require('path');

const filePath = path.join('frontend', 'src', 'components', 'player', 'BodyMapPaths.ts');
const content = fs.readFileSync(filePath, 'utf8');

console.log('File size:', content.length);

// Regex to match objects in the array
const regex = /{ id: '([^']+)', name: '([^']+)'/g;
let match;
let found = false;

while ((match = regex.exec(content)) !== null) {
    const id = match[1];
    const name = match[2];
    if (id === 'upper_back_l') {
        console.log(`Found: id='${id}', name='${name}'`);
        found = true;
    }
}

if (!found) {
    console.log('upper_back_l not found via regex!');
}
