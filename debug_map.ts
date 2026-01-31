
import { BODY_PATHS } from './frontend/src/components/player/BodyMapPaths';

const BODY_PART_MAP = BODY_PATHS.reduce((acc, part) => {
    acc[part.id] = part.name;
    return acc;
}, {} as Record<string, string>);

console.log("Checking upper_back_l:");
console.log("Value:", BODY_PART_MAP['upper_back_l']);
console.log("Keys count:", Object.keys(BODY_PART_MAP).length);

const targetKey = 'upper_back_l';
const foundKey = Object.keys(BODY_PART_MAP).find(k => k === targetKey);
console.log("Explicit check:", foundKey);

if (foundKey) {
    console.log("Char codes of found key:", foundKey.split('').map(c => c.charCodeAt(0)));
} else {
    console.log("Key not found!");
    // Check for near matches
    const near = Object.keys(BODY_PART_MAP).filter(k => k.includes('upper') && k.includes('back'));
    console.log("Near matches:", near);
}
