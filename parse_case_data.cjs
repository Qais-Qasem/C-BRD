const fs = require('fs');
try {
  const data = JSON.parse(fs.readFileSync('case_data.json', 'utf8'));
  console.log("ATTACHMENTS COUNT:", data.attachments ? data.attachments.length : 0);
  if (data.attachments) {
    data.attachments.forEach(a => {
      console.log(`- ${a.id} | Type: ${a.documentType} | Visibility: ${a.visibilityScope} | Entities: ${a.entityRefs ? a.entityRefs.join(',') : 'none'} | Rels: ${a.relationshipRefs ? a.relationshipRefs.join(',') : 'none'}`);
    });
  }
} catch (e) {
  console.error("Error parsing case data:", e);
}
