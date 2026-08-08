const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/setIsRechargeModalOpen\(true\)/g, "setActivePanel('recharge')");
code = code.replace(/<CheckCircle\s+className/g, "<CheckCircle2 className");

fs.writeFileSync('src/App.tsx', code);
