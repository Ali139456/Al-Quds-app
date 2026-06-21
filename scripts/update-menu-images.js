const fs = require('fs');
const path = require('path');

const menuPath = path.join(__dirname, '../constants/menu.ts');
let c = fs.readFileSync(menuPath, 'utf8');

c = c.replace(/(id: '(b\d+|a\d+|c\d+|f\d+|p\d+)',\n[\s\S]*?image: )'[^']*'/g, (block, prefix) => {
  const idMatch = block.match(/id: '([^']+)'/);
  return `${prefix}'/uploads/menu/${idMatch[1]}.jpg'`;
});

if (!c.includes('menuItemImage')) {
  c = c.replace(
    "import { FoodItem } from '@/types';",
    "import { FoodItem } from '@/types';\n\nexport const menuItemImage = (id: string) => `/uploads/menu/${id}.jpg`;\nexport const categoryImage = (id: string) => `/uploads/menu/categories/${id}.jpg`;"
  );
}

const categoryPatches = [
  ["{ id: 'burgers', label: 'Burgers', icon: '🍔' }", "{ id: 'burgers', label: 'Burgers', icon: '🍔', image: '/uploads/menu/categories/burgers.jpg' }"],
  ["{ id: 'arabian', label: 'Arabian', icon: '🥙' }", "{ id: 'arabian', label: 'Arabian', icon: '🥙', image: '/uploads/menu/categories/arabian.jpg' }"],
  ["{ id: 'chinese', label: 'Chinese', icon: '🍜' }", "{ id: 'chinese', label: 'Chinese', icon: '🍜', image: '/uploads/menu/categories/chinese.jpg' }"],
  ["{ id: 'fried', label: 'Fried', icon: '🍗' }", "{ id: 'fried', label: 'Fried', icon: '🍗', image: '/uploads/menu/categories/fried.jpg' }"],
  ["{ id: 'pasta', label: 'Pasta', icon: '🍝' }", "{ id: 'pasta', label: 'Pasta', icon: '🍝', image: '/uploads/menu/categories/pasta.jpg' }"],
  ["{ id: 'fries', label: 'Fries', icon: '🍟' }", "{ id: 'fries', label: 'Fries', icon: '🍟', image: '/uploads/menu/categories/fries.jpg' }"],
  ["{ id: 'drinks', label: 'Drinks', icon: '🥤' }", "{ id: 'drinks', label: 'Drinks', icon: '🥤', image: '/uploads/menu/categories/drinks.jpg' }"],
];

for (const [from, to] of categoryPatches) {
  c = c.replace(from, to);
}

fs.writeFileSync(menuPath, c);
console.log('Updated constants/menu.ts');
