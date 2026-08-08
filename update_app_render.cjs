const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const components = ['<MfsGateway', '<MfsTransferGateway', '<BankingGateway', '<OfferList', '<CallingCardView'];

components.forEach(comp => {
    // Find all occurrences of the component rendering
    const regex = new RegExp(`(${comp}\\s*[^>]*)(>)`, 'g');
    code = code.replace(regex, (match, p1, p2) => {
        if (p1.includes('showForeignCurrency')) return match;
        // Make sure it doesn't match closing tags like </MfsGateway>
        if (p1.startsWith('</')) return match;
        
        return `${p1} showForeignCurrency={showForeignCurrency} globalCurrencyName={globalCurrencyName} globalCurrencyRate={globalCurrencyRate} ${p2}`;
    });
});

fs.writeFileSync('src/App.tsx', code);
