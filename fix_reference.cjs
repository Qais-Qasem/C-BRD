const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

const target1 = `if (!checkQuota(err))`;
content = content.replaceAll(target1, `if (true)`);

const target2 = `if (!checkQuota(dbErr))`;
content = content.replaceAll(target2, `if (true)`);

fs.writeFileSync(file, content);
console.log("Reference errors fixed");
