const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/\{React\.createElement\(Wallet,\s*\{\s*className:\s*`([^`]+)`\s*\}\)\}/g, '<Wallet className={`$1`} />');
code = code.replace(/\{React\.createElement\(ArrowRightLeft,\s*\{\s*className:\s*`([^`]+)`\s*\}\)\}/g, '<ArrowRightLeft className={`$1`} />');
code = code.replace(/\{React\.createElement\(Users,\s*\{\s*className:\s*`([^`]+)`\s*\}\)\}/g, '<Users className={`$1`} />');
code = code.replace(/\{React\.createElement\(CheckCircle2,\s*\{\s*className:\s*`([^`]+)`\s*\}\)\}/g, '<CheckCircle2 className={`$1`} />');

fs.writeFileSync('src/App.tsx', code);
