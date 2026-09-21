const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(`const projId = db?.app?.options?.projectId || 'unknown';`, `const projId = (db as any)?.app?.options?.projectId || 'unknown';`);

fs.writeFileSync('server.ts', code);
