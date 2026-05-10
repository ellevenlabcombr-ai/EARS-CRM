const fs = require('fs');
const file = 'components/AthleteHealthProfile.tsx';
let content = fs.readFileSync(file, 'utf-8');

// The block to extract
const startString = `                  {/* 1. Contexto & Dor */}`;
const endString = `              </div>\n            </motion.div>`;

const startIdx = content.indexOf(startString);
const endIdx = content.indexOf(endString);

if (startIdx === -1 || endIdx === -1) {
  console.log('Could not find start or end index', startIdx, endIdx);
  process.exit(1);
}

// Notice we only take up to `</div>` before `</motion.div>`
const formBodyStr = content.substring(startIdx - 18, endIdx + 20);

// In the original place, we'll replace the block with a function call
content = content.replace(formBodyStr, `\n                  {renderEvolutionFormBody()}\n`);

const returnMatch = `  const StatusIcon = statusCfg.icon;\n\n  return (\n    <div className="flex-1`;
const returnIdx = content.indexOf(returnMatch);

if (returnIdx === -1) {
  console.log('Could not find return match');
  process.exit(1);
}

const formBodyFn = `  const renderEvolutionFormBody = () => (
    <>
${formBodyStr}
    </>
  );

`;

content = content.substring(0, returnIdx) + formBodyFn + content.substring(returnIdx);

// Also we need to pass `evolutionForm={renderEvolutionFormBody()}` to `SessionModePanel`
content = content.replace(
  `onOpenNewEvolution={handleOpenNewEvolution}`,
  `evolutionForm={renderEvolutionFormBody()}`
);

fs.writeFileSync(file, content);
console.log('Refactor complete');
