const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `  if (reqMap) {
    unmet.push('DEBUG_STATUS: ' + reqMap.status);
  }
  if (!reqMap || reqMap.status !== 'MEMBER_REVIEWED') {
    unmet.push('Requirements Reviewed');
  }`;
const replace = `  if (!reqMap || reqMap.status !== 'MEMBER_REVIEWED') {
    unmet.push('Requirements Reviewed');
  }`;

if (content.includes(target)) {
  content = content.replace(target, replace);
  fs.writeFileSync(file, content);
  console.log("Reverted");
} else {
  console.log("Not found");
}
