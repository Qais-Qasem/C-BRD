const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// For any condition like this, just replace it to check if it's missing
code = code.replace(/if \(moduleId === "MA-324-01" \|\| projectId === "PRJ-FSVP-01" \|\| !projectId\) \{/g, 'if (!projectId) {');

code = code.replace(/if \(workflowState\.moduleId === "MA-324-01" \|\| workflowState\.projectId === "PRJ-FSVP-01" \|\| !workflowState\.projectId\) \{/g, 'if (!workflowState.projectId) {');

fs.writeFileSync('server.ts', code);
