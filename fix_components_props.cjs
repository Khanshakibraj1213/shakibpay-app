const fs = require('fs');

const components = [
  'src/components/OfferList.tsx',
  'src/components/BankingGateway.tsx',
  'src/components/MfsTransferGateway.tsx',
  'src/components/MfsGateway.tsx',
  'src/components/CallingCardView.tsx'
];

components.forEach(file => {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');

  // Add the 3 props to interface if not exist
  if (!code.includes('showForeignCurrency?: boolean;')) {
    code = code.replace(/interface [a-zA-Z]+Props \{/, match => `${match}\n  showForeignCurrency?: boolean;\n  globalCurrencyName?: string;\n  globalCurrencyRate?: number;`);
  }

  // Add to function parameters
  const funcRegex = /export default function [a-zA-Z]+\(\{\s*([^}]*)\s*\}\s*:\s*[a-zA-Z]+Props\)\s*\{/;
  code = code.replace(funcRegex, (match, props) => {
    if (!props.includes('showForeignCurrency')) {
      const newProps = props + ', showForeignCurrency, globalCurrencyName, globalCurrencyRate';
      return match.replace(props, newProps);
    }
    return match;
  });
  
  // Add to generateReceiptCanvas
  const regex = /generateReceiptCanvas\(\s*\{([\s\S]*?)\}\s*\)/g;
  code = code.replace(regex, (match, p1) => {
      if (p1.includes('showForeignCurrency')) return match;
      return `generateReceiptCanvas({${p1}, showForeignCurrency, globalCurrencyName, globalCurrencyRate })`;
  });

  fs.writeFileSync(file, code);
});
