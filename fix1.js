const fs = require('fs');
// Let's just fix the file.
let content = fs.readFileSync('components/AthleteHealthProfile.tsx', 'utf-8');

const returnMatch = `  const StatusIcon = statusCfg.icon;\n\n  return (\n    <div className="flex-1`;
// wait, the file already has the wrong renderEvolutionFormBody function.

// Find the start and end of the BAD renderEvolutionFormBody
const badStart = `  const renderEvolutionFormBody = () => (\n    <>\n`;
const badEndIdx = content.indexOf(`  const StatusIcon = statusCfg.icon;\n\n  return (\n    <div className="flex-1`);
const badStartIdx = content.indexOf(badStart);

if (badStartIdx !== -1 && badEndIdx !== -1) {
  content = content.substring(0, badStartIdx) + content.substring(badEndIdx);
}
fs.writeFileSync('components/AthleteHealthProfile.tsx', content);
