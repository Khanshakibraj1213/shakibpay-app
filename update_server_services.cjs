const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

const servicesStart = code.indexOf('let services = [');
const servicesEnd = code.indexOf('];', servicesStart) + 2;

const newServices = `let services = [
    // Main 8-Button Grid Services
    { id: "s-add-money", name: "Add Money", slug: "add_money", type: "Main Grid", country: "Bangladesh", sortOrder: 1, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
    { id: "s-send-money", name: "Send Money", slug: "send_money", type: "Main Grid", country: "Bangladesh", sortOrder: 2, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
    { id: "s-drive", name: "Drive Pack", slug: "drive", type: "Main Grid", country: "Bangladesh", sortOrder: 3, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
    { id: "s-recharge", name: "Recharge", slug: "recharge", type: "Main Grid", country: "Bangladesh", sortOrder: 4, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
    { id: "s-bill", name: "Pay Bill", slug: "bill", type: "Main Grid", country: "Bangladesh", sortOrder: 5, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
    { id: "s-banking", name: "Banking", slug: "banking", type: "Main Grid", country: "Bangladesh", sortOrder: 6, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
    { id: "s-make-agent", name: "Make Agent", slug: "make_agent", type: "Main Grid", country: "Bangladesh", sortOrder: 7, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
    { id: "s-ecommerce", name: "E-Commerce", slug: "ecommerce", type: "Main Grid", country: "Bangladesh", sortOrder: 8, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },

    // Mobile Banking Row Services
    { id: "s-bkash", name: "bKash", slug: "bkash", type: "Mobile Bank", country: "Bangladesh", sortOrder: 9, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
    { id: "s-nagad", name: "Nagad", slug: "nagad", type: "Mobile Bank", country: "Bangladesh", sortOrder: 10, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
    { id: "s-rocket", name: "Rocket", slug: "rocket", type: "Mobile Bank", country: "Bangladesh", sortOrder: 11, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
    { id: "s-upay", name: "Upay", slug: "upay", type: "Mobile Bank", country: "Bangladesh", sortOrder: 12, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
    { id: "s-selfin", name: "Selfin", slug: "selfin", type: "Mobile Bank", country: "Bangladesh", sortOrder: 13, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
    { id: "s-mcash", name: "M Cash", slug: "mcash", type: "Mobile Bank", country: "Bangladesh", sortOrder: 14, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
    { id: "s-surecash", name: "SureCash", slug: "surecash", type: "Mobile Bank", country: "Bangladesh", sortOrder: 15, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
    { id: "s-tap", name: "Tap", slug: "tap", type: "Mobile Bank", country: "Bangladesh", sortOrder: 16, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" }
  ];`;

if (servicesStart !== -1) {
  code = code.substring(0, servicesStart) + newServices + code.substring(servicesEnd);
  fs.writeFileSync('server.ts', code);
}
