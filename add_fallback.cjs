const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `      // CRITICAL INVARIANT: Clean any false "I attached" statements if 0 attachments were actually created
      const sanitizedClientText = cleanFalseAttachmentClaims(clientReplyText, createdAttachments.length);`;

const fallback = `      if (!clientReplyText) {
        clientReplyText = "We are reviewing your request and will get back to you shortly.";
      }
      
      // CRITICAL INVARIANT: Clean any false "I attached" statements if 0 attachments were actually created
      const sanitizedClientText = cleanFalseAttachmentClaims(clientReplyText, createdAttachments.length);`;

if (code.includes(target)) {
    code = code.replace(target, fallback);
    fs.writeFileSync('server.ts', code);
    console.log("Fallback added.");
} else {
    console.log("Could not find target.");
}
