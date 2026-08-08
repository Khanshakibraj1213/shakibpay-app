const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/,\s*,\s*Rocket/, ', Rocket');
fs.writeFileSync('src/App.tsx', code);
