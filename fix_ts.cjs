const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(`finalChosen.structuredWorld = migrationResult.world;`, `(finalChosen as any).structuredWorld = migrationResult.world;`);
code = code.replace(`structuredWorld: generatedCompany.structuredWorld,`, `structuredWorld: (generatedCompany as any).structuredWorld,`);

fs.writeFileSync('server.ts', code);
