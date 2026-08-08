const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/<Wifi\s+className:\s*"([^"]+)",\s*strokeWidth:\s*([0-9.]+)\s*\/>/g, '<Wifi className="$1" strokeWidth={$2} />');
code = code.replace(/<Wifi\s+className:\s*"([^"]+)"\s*\/>/g, '<Wifi className="$1" />');
code = code.replace(/<ArrowRight\s+className:\s*"([^"]+)"\s*\/>/g, '<ArrowRight className="$1" />');
code = code.replace(/<Wallet\s+className:\s*`([^`]+)`\s*\/>/g, '<Wallet className={`$1`} />');
code = code.replace(/<ArrowRightLeft\s+className:\s*`([^`]+)`\s*\/>/g, '<ArrowRightLeft className={`$1`} />');
code = code.replace(/<Users\s+className:\s*`([^`]+)`\s*\/>/g, '<Users className={`$1`} />');
code = code.replace(/<CheckCircle2\s+className:\s*`([^`]+)`\s*\/>/g, '<CheckCircle2 className={`$1`} />');

fs.writeFileSync('src/App.tsx', code);
