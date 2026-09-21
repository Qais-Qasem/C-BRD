const fs = require('fs');
const server = fs.readFileSync('server.ts', 'utf8');
const serverBak = fs.readFileSync('server.ts.bak', 'utf8');

const topPart = server.substring(0, server.indexOf('sessix'));
// find the equivalent part in serverBak
// The garbage started at "sessix". Look at the line before it:
//       sessix...
// Actually, let's just grab the text from serverBak starting from:
//       sessionId,
//       projectId = "PRJ-324",

const bottomPartIndex = serverBak.indexOf('      sessionId,\n      projectId = "PRJ-324",');
if (bottomPartIndex === -1) {
  console.log("Could not find bottom part in bak");
  process.exit(1);
}

const bottomPart = serverBak.substring(bottomPartIndex);

const newServer = topPart + bottomPart;

fs.writeFileSync('server.ts', newServer);
console.log("Fixed server.ts!");
