const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. Move createdAttachments declaration outside
// Replace `          const createdAttachments: any[] = [];` with empty string inside the `if (ai)` block
code = code.replace(`          const createdAttachments: any[] = [];\n`, '');

// 2. Add it before `if (ai) {`
code = code.replace(
  `      const clientMsgId = \`MSG-CLI-\${Date.now().toString().slice(-6)}\`;\n      if (ai) {\n`,
  `      const clientMsgId = \`MSG-CLI-\${Date.now().toString().slice(-6)}\`;\n      const createdAttachments: any[] = [];\n      if (ai) {\n`
);

// 3. Fix activeSessionDisclosedAttIds
code = code.replace(/activeSessionDisclosedAttIds/g, 'new Set<string>()');

// 4. Wait, replace all? No, `activeSessionDisclosedAttIds` is used at the bottom of the function correctly! I should only replace it in the `if(ai)` block!
// Actually, let's just do a specific replace.
// Let's reload code to undo global replace.
