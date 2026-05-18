const fs = require('fs');
let content = fs.readFileSync('components/AthleteHealthProfile.tsx', 'utf8');

// remove ReceiptModal
let startIndex = content.indexOf('function ReceiptModal(');
if(startIndex > -1) {
    let parens = 0, end = -1, start = content.indexOf('{', startIndex);
    for(let i=start; i<content.length; i++) {
        if(content[i]==='{') parens++;
        if(content[i]==='}') {
            parens--;
            if(parens === 0) { end = i+1; break; }
        }
    }
    if (end > -1) content = content.substring(0, startIndex) + content.substring(end);
}

const renderStart = content.indexOf('{receiptTransaction && (');
if(renderStart > -1) {
    let parens = 0, end = -1, start = content.indexOf('(', renderStart);
    for(let i=start; i<content.length; i++) {
        if(content[i]==='(') parens++;
        if(content[i]===')') {
            parens--;
            if(parens === 0) { end = i+1; break; }
        }
    }
    // we also need to remove the closing } of {receiptTransaction && (...) }
    if (end > -1) {
        let closingBrace = content.indexOf('}', end);
        if (closingBrace > -1) content = content.substring(0, renderStart) + content.substring(closingBrace+1);
    }
}

fs.writeFileSync('components/AthleteHealthProfile.tsx', content);
console.log('done');
