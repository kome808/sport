
const { BODY_PATHS } = require('./frontend/src/components/player/BodyMapPaths.ts');

const BODY_PART_MAP = BODY_PATHS.reduce((acc, part) => {
    acc[part.id] = part.name;
    return acc;
}, {});

console.log("Checking upper_back_l:");
console.log("Value:", BODY_PART_MAP['upper_back_l']);
console.log("Exists:", 'upper_back_l' in BODY_PART_MAP);

const keys = Object.keys(BODY_PART_MAP);
const target = keys.find(k => k.includes('upper') && k.includes('back'));
console.log("Found key similar to upper_back_l:", target);
console.log("Char codes of target:", target.split('').map(c => c.charCodeAt(0)));
console.log("Char codes of input string:", 'upper_back_l'.split('').map(c => c.charCodeAt(0)));
