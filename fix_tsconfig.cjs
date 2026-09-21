const fs = require('fs');
let code = fs.readFileSync('tsconfig.json', 'utf8');
if (!code.includes('"dist"')) {
  code = code.replace('"node_modules"', '"node_modules", "dist"');
  fs.writeFileSync('tsconfig.json', code);
}
