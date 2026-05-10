const fs = require('fs');
let content = fs.readFileSync('components/AthleteHealthProfile.tsx', 'utf-8');

// Find the form body
const startString = `                  {/* 1. Contexto & Dor */}`;
const endString = `                    Confirmar Registro\n                  </Button>\n                </div>\n`;

const startIdx = content.indexOf(startString);
const endIdx = content.indexOf(endString) + endString.length;

if (startIdx === -1 || endIdx === -1) {
  console.log('Error finding indices', startIdx, endIdx);
  process.exit(1);
}

const formBodyStr = content.substring(startIdx, endIdx);

// Remove it from the modal and replace with `{renderEvolutionFormBody()}`
content = content.replace(formBodyStr, '');

const returnIdx = content.indexOf(`  return (\n    <div className="flex-1 flex`);

const formBodyFn = `  const renderEvolutionFormBody = () => (
    <>
${formBodyStr}
    </>
  );

`;

content = content.substring(0, returnIdx) + formBodyFn + content.substring(returnIdx);

fs.writeFileSync('components/AthleteHealthProfile.tsx', content);
console.log('Success');
