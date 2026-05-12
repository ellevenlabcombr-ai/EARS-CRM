const fs = require('fs');
let content = fs.readFileSync('components/WellnessDashboard.tsx', 'utf8');
content = content.replace(/selectedAnswers\.(\w+?)\s*===\s*(\d+)/g, 'Number(selectedAnswers.$1) === $2');
content = content.replace(/selectedAnswers\.symptoms\?\.(\w+?)\s*===\s*(\d+)/g, 'Number(selectedAnswers.symptoms?.$1) === $2');
fs.writeFileSync('components/WellnessDashboard.tsx', content);
