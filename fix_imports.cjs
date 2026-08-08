const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
const bracketIndex = code.indexOf('} from \'lucide-react\';');
code = code.substring(0, bracketIndex) + ', Rocket\n' + code.substring(bracketIndex);
fs.writeFileSync('src/App.tsx', code);
