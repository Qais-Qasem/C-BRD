const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/if \(position\.projectId === "PRJ-FSVP-01" \|\| !position\.projectId \|\| position\.moduleId === "MA-324-01"\) \{/g, 
'if (!position.projectId) {');

code = code.replace(/\n\s*position\.moduleId = "MA-324-01";\n\s*position\.moduleName = "MSU Module 1 — Foundational FSVP Framework, Statutory Authority & Scope";/g, '');

fs.writeFileSync('server.ts', code);
