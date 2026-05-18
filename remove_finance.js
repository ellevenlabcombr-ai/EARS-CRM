const fs = require('fs');
const content = fs.readFileSync('components/AthleteHealthProfile.tsx', 'utf8');
const startIndex = content.indexOf(`{activeTab === 'finance' && (`);
if(startIndex > -1) {
    let parens = 0, end = -1, start = content.indexOf('(', startIndex);
    for(let i=start; i<content.length; i++) {
        if(content[i]==='(') parens++;
        if(content[i]===')') {
            parens--;
            if(parens === 0) { end = content.indexOf('}', i)+1; break; }
        }
    }
    fs.writeFileSync('components/AthleteHealthProfile.tsx', content.substring(0, startIndex) + content.substring(end));
    console.log('done');
}