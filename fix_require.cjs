const fs = require('fs');
let s = fs.readFileSync('server.ts', 'utf-8');
s = s.replace('const crypto = require("crypto");', '');
s = s.replace("const canonicalReqId = \"REQ-\" + require('crypto').createHash", "const canonicalReqId = \"REQ-\" + crypto.createHash");
fs.writeFileSync('server.ts', s);
console.log("Fixed require in server.ts");
