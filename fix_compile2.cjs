const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Move createdAttachments declaration outside
code = code.replace(`          const createdAttachments: any[] = [];\n`, '');
code = code.replace(
  `      const clientMsgId = \`MSG-CLI-\${Date.now().toString().slice(-6)}\`;\n      if (ai) {\n`,
  `      const clientMsgId = \`MSG-CLI-\${Date.now().toString().slice(-6)}\`;\n      const createdAttachments: any[] = [];\n      if (ai) {\n`
);

// Replace the two usages of activeSessionDisclosedAttIds inside the ai block:
const aiBlockTarget1 = `const resolution = resolveDocumentAttachment(req, existingCaseAtts, activeSessionDisclosedAttIds, "CLIENT_EXEC");`;
const aiBlockTarget2 = `const postGenResolution = resolveDocumentAttachment(req, [attRecord], activeSessionDisclosedAttIds, "CLIENT_EXEC");`;

code = code.replace(aiBlockTarget1, `const resolution = resolveDocumentAttachment(req, existingCaseAtts, new Set<string>(), "CLIENT_EXEC");`);
code = code.replace(aiBlockTarget2, `const postGenResolution = resolveDocumentAttachment(req, [attRecord], new Set<string>(), "CLIENT_EXEC");`);

// Now let's fix the 'structuredWorld' typing error.
// server.ts(8588,17): error TS2339: Property 'structuredWorld' does not exist on type '{ ... } | { ... }'
// Let's find those lines.

fs.writeFileSync('server.ts', code);
console.log("Patched basic errors.");
