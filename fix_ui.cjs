const fs = require('fs');
const file = 'src/components/ModuleStudyWorkspace.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /{isCaseRoomReadyToStart \? \([\s\S]*?MISSING PREREQUISITES: \{unmetPrereqs\.join\([^}]+\)\}[\s\S]*?\)\}/;
const replaceUI = `{isCaseRoomReadyToStart ? (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    ALL PREREQUISITES CONFIRMED
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    MISSING PREREQUISITES: {unmetPrereqs.join(', ')}
                  </span>
                )}`;

if (content.match(regex)) {
  content = content.replace(regex, replaceUI);
  fs.writeFileSync(file, content);
  console.log("Fixed UI block");
} else {
  console.log("Could not find regex");
}
