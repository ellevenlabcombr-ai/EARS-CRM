const fs = require('fs');
let code = fs.readFileSync('/app/applet/app/api/evolution/route.ts', 'utf8');

code = code.replace(
  'let endpoint = "";',
  'const baseUrl = url.replace(/\\/+\$/, "");\n    let endpoint = "";'
);

code = code.replace(/\$\{url\}/g, '${baseUrl}');

fs.writeFileSync('/app/applet/app/api/evolution/route.ts', code);
