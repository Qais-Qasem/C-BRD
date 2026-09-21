const htmlContent = "<h1>Title</h1><p>Para 1</p><ul><li>List 1</li><li>List 2</li></ul><table><tr><td>Cell 1</td></tr></table>";
const blockMatches = [...htmlContent.matchAll(/<(h[1-6]|p|li|table)[^>]*>([\s\S]*?)<\/\1>/gi)];
const preLlmBlocks = blockMatches.map((m, idx) => {
  const tag = m[1].toLowerCase();
  const innerHtml = m[2];
  const text = innerHtml.replace(/<[^>]+>/g, '').trim();
  let type = "paragraph";
  if (tag.startsWith('h')) type = "heading";
  if (tag === 'li') type = "list_item";
  if (tag === 'table') type = "table";
  
  return {
     blockId: `BLK-hash-${idx}`,
     ordinal: idx,
     type,
     rawText: text
  };
}).filter(b => b.rawText.length > 0);
console.log(preLlmBlocks);
