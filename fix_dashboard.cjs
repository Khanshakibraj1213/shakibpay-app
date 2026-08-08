const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// Fix the admin tab state setter
code = code.replace("setAdminActiveSubTab('maintenance_control');", "setCurrentTab('maintenance_control');");

// Add missing lucide imports
const importLucideStart = code.indexOf("from 'lucide-react';");
if (importLucideStart !== -1) {
  const newImports = "  Package, Receipt, ShoppingBag, Wifi, Activity, Shield, Fingerprint,\n";
  // Insert before the last bracket of the lucide-react import
  const bracketIndex = code.lastIndexOf('}', importLucideStart);
  code = code.substring(0, bracketIndex) + newImports + code.substring(bracketIndex);
}

// Replace the require() hacks with actual component references
// In the 8-button grid
code = code.replace(
  /{ label: "Add Money", icon: "Plus"/g,
  "{ label: 'Add Money', icon: Plus"
).replace(
  /{ label: "Send Money", icon: "Send"/g,
  "{ label: 'Send Money', icon: Send"
).replace(
  /{ label: "Drive Pack", icon: "Package"/g,
  "{ label: 'Drive Pack', icon: Package"
).replace(
  /{ label: "Recharge", icon: "Smartphone"/g,
  "{ label: 'Recharge', icon: Smartphone"
).replace(
  /{ label: "Pay Bill", icon: "Receipt"/g,
  "{ label: 'Pay Bill', icon: Receipt"
).replace(
  /{ label: "Banking", icon: "Building2"/g,
  "{ label: 'Banking', icon: Building2"
).replace(
  /{ label: "Agent Bill", icon: "Users"/g,
  "{ label: 'Agent Bill', icon: Users"
).replace(
  /{ label: "E-Commerce", icon: "ShoppingBag"/g,
  "{ label: 'E-Commerce', icon: ShoppingBag"
);
code = code.replace("const Icon = require('lucide-react')[serv.icon] || (() => <span />);", "const Icon = serv.icon;");

// In the mobile banking row
code = code.replace(
  /{ label: 'bKash', icon: 'Coins'/g,
  "{ label: 'bKash', icon: Coins"
).replace(
  /{ label: 'Nagad', icon: 'Flame'/g,
  "{ label: 'Nagad', icon: Flame"
).replace(
  /{ label: 'Rocket', icon: 'Rocket'/g,
  "{ label: 'Rocket', icon: SmartphoneNfc" // Actually Rocket icon wasn't in lucide-react as Rocket but SmartphoneNfc was used for it before. Wait, Rocket is a lucide icon! Let's import it. Wait, I didn't import Rocket! Let me add it. No, Rocket is already imported maybe? No it's not. Ah, wait, SmartphoneNfc is used. I'll just use Rocket and add it to imports.
).replace(
  /{ label: 'Upay', icon: 'Activity'/g,
  "{ label: 'Upay', icon: Activity"
).replace(
  /{ label: 'Selfin', icon: 'Shield'/g,
  "{ label: 'Selfin', icon: Shield"
).replace(
  /{ label: 'M Cash', icon: 'Wallet'/g,
  "{ label: 'M Cash', icon: Wallet"
).replace(
  /{ label: 'SureCash', icon: 'CreditCard'/g,
  "{ label: 'SureCash', icon: CreditCard"
).replace(
  /{ label: 'Tap', icon: 'Fingerprint'/g,
  "{ label: 'Tap', icon: Fingerprint"
);
code = code.replace("const Icon = require('lucide-react')[item.icon] || (() => <span />);", "const Icon = item.icon;");

// In the QUICK ACCESS row
code = code.replace(
  /{ label: "Add Balance", icon: "Plus"/g,
  "{ label: 'Add Balance', icon: Plus"
).replace(
  /{ label: "Send Money", icon: "Send"/g,
  "{ label: 'Send Money', icon: Send"
).replace(
  /{ label: "Recharge", icon: "Smartphone"/g,
  "{ label: 'Recharge', icon: Smartphone"
).replace(
  /{ label: "Pay Bill", icon: "Receipt"/g,
  "{ label: 'Pay Bill', icon: Receipt"
);
code = code.replace("const Icon = require('lucide-react')[act.icon] || (() => <span />);", "const Icon = act.icon;");

fs.writeFileSync('src/App.tsx', code);
