const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `  let adminNumbers = {
    bkash: { personal: "01700112233", merchant: "01800112233" },
    nagad: { personal: "01900112233", merchant: "01500112233" },
    rocket: { personal: "01300112233", merchant: "01400112233" }
  };`;
const replaceStr = `  let adminNumbers = {
    bkash: { personal: "01700112233", merchant: "01800112233" },
    nagad: { personal: "01900112233", merchant: "01500112233" },
    rocket: { personal: "01300112233", merchant: "01400112233" },
    usdt: { personal: "TRC20: TVgJ8U... (Your address here)" }
  };`;

if(code.includes(targetStr)) {
    code = code.replace(targetStr, replaceStr);
    console.log("adminNumbers initialized");
}

const updateGatewaysTarget = `      const { bkash, nagad, rocket } = req.body;
      if (bkash) adminNumbers.bkash = bkash;
      if (nagad) adminNumbers.nagad = nagad;
      if (rocket) adminNumbers.rocket = rocket;`;
      
const updateGatewaysReplace = `      const { bkash, nagad, rocket, usdt } = req.body;
      if (bkash) adminNumbers.bkash = bkash;
      if (nagad) adminNumbers.nagad = nagad;
      if (rocket) adminNumbers.rocket = rocket;
      if (usdt) adminNumbers.usdt = usdt;`;

if(code.includes(updateGatewaysTarget)) {
    code = code.replace(updateGatewaysTarget, updateGatewaysReplace);
    console.log("adminNumbers update endpoint updated");
}

fs.writeFileSync('server.ts', code);
