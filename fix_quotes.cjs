const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/{ label: 'bKash', icon: 'Coins'/g, "{ label: 'bKash', icon: Coins");
code = code.replace(/{ label: 'Nagad', icon: 'Flame'/g, "{ label: 'Nagad', icon: Flame");
code = code.replace(/{ label: 'Rocket', icon: 'Rocket'/g, "{ label: 'Rocket', icon: Rocket");
code = code.replace(/{ label: 'Upay', icon: 'Activity'/g, "{ label: 'Upay', icon: Activity");
code = code.replace(/{ label: 'Selfin', icon: 'Shield'/g, "{ label: 'Selfin', icon: Shield");
code = code.replace(/{ label: 'M Cash', icon: 'Wallet'/g, "{ label: 'M Cash', icon: Wallet");
code = code.replace(/{ label: 'SureCash', icon: 'CreditCard'/g, "{ label: 'SureCash', icon: CreditCard");
code = code.replace(/{ label: 'Tap', icon: 'Fingerprint'/g, "{ label: 'Tap', icon: Fingerprint");

fs.writeFileSync('src/App.tsx', code);
