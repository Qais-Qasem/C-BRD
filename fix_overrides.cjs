const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/if \(moduleId === "MA-324-01" \|\| projectId === "PRJ-FSVP-01" \|\| !projectId\) \{\n\s*moduleId = "MA-324-01";\n\s*\}/g,
`if (!moduleId) {
      moduleId = "MA-324-01";
    }`);

code = code.replace(/if \(workflowState\.moduleId === "MA-324-01" \|\| workflowState\.projectId === "PRJ-FSVP-01" \|\| !workflowState\.projectId\) \{/g, 
`if (!workflowState.projectId) {`);

code = code.replace(/\n\s*workflowState\.moduleId = "MA-324-01";\n\s*workflowState\.moduleTitle = "MSU Module 1 — Foundational FSVP Framework, Statutory Authority & Scope";/g,
`\n        if (!workflowState.moduleId) {
          workflowState.moduleId = "MA-324-01";
          workflowState.moduleTitle = "MSU Module 1 — Foundational FSVP Framework, Statutory Authority & Scope";
        }`);

code = code.replace(/if \(position\.projectId === "PRJ-FSVP-01" \|\| !position\.projectId \|\| position\.moduleId === "MA-324-01"\) \{/g,
`if (!position.projectId) {`);

code = code.replace(/\n\s*position\.moduleId = "MA-324-01";\n\s*position\.moduleName = "MSU Module 1 — Foundational FSVP Framework, Statutory Authority & Scope";/g,
`\n        if (!position.moduleId) {
          position.moduleId = "MA-324-01";
          position.moduleName = "MSU Module 1 — Foundational FSVP Framework, Statutory Authority & Scope";
        }`);

fs.writeFileSync('server.ts', code);
