const fs = require('fs');
let code = fs.readFileSync('src/components/CallingCardView.tsx', 'utf8');

code = code.replace(/const \[screen, setScreen\] = useState\<'brands' \| 'pulses' \| 'offers'\>\('brands'\);/, `const [screen, setScreen] = useState<'brands' | 'offers'>('brands');`);
code = code.replace(/const \[selectedPulse, setSelectedPulse\] = useState\<string\>\(''\);/, ``);

code = code.replace(/  \/\/ Filtering offers based on current user selections\n  const filteredOffers = cardsList\.filter\(o => \{\n    return o\.brand === selectedBrand && \n           o\.pulseRate === selectedPulse && \n           o\.country === selectedCountry && \n           \(selectedDollarVal === 0 \|\| o\.value === selectedDollarVal\);\n  \}\);\n\n  const handleBrandSelect = \(brandName: string\) => \{\n    setSelectedBrand\(brandName\);\n    setScreen\('pulses'\);\n  \};\n\n  const handlePulseSelect = \(pulseName: string\) => \{\n    setSelectedPulse\(pulseName\);\n    setScreen\('offers'\);\n  \};/, `  // Filtering offers based on current user selections
  const filteredOffers = cardsList.filter(o => {
    return o.brand === selectedBrand && 
           o.country === selectedCountry && 
           (selectedDollarVal === 0 || o.value === selectedDollarVal);
  });

  const handleBrandSelect = (brandName: string) => {
    setSelectedBrand(brandName);
    setScreen('offers');
  };`);

code = code.replace(/            if \(screen === 'offers'\) setScreen\('pulses'\);\n            else if \(screen === 'pulses'\) setScreen\('brands'\);/, `            if (screen === 'offers') setScreen('brands');`);

code = code.replace(/            \{screen === 'brands' && 'কলিং কার্ড ব্র্যান্ডসমূহ \(Calling Cards\)'\}\n            \{screen === 'pulses' && `পালস রেট সিলেক্ট করুন \(\$\{selectedBrand\}\)`\}\n            \{screen === 'offers' && `\$\{selectedBrand\} - \$\{selectedPulse\}`\}/, `            {screen === 'brands' && 'কলিং কার্ড ব্র্যান্ডসমূহ (Calling Cards)'}
            {screen === 'offers' && \`\${selectedBrand} Offers\`}`);

code = code.replace(/            \{screen === 'brands' && 'আইটেল মোবাইল ডায়ালারের জন্য অটো পিন ও ডলার রিচার্জ'\}\n            \{screen === 'pulses' && 'আপনার সুবিধাজনক পালস রেট ক্যাটাগরি সিলেক্ট করুন'\}\n            \{screen === 'offers' && 'দেশ ও কার্ডের ডলারের মান অনুযায়ী অফার সিলেক্ট করুন'\}/, `            {screen === 'brands' && 'আইটেল মোবাইল ডায়ালারের জন্য অটো পিন ও ডলার রিচার্জ'}
            {screen === 'offers' && 'দেশ ও কার্ডের ডলারের মান অনুযায়ী অফার সিলেক্ট করুন'}`);

code = code.replace(/      \{screen === 'pulses' && \([\s\S]*?      \)\}\n\n      \{\/\* 3\. CARD OFFER PACKAGE SCREEN \*\/\}/, `      {/* 2. CARD OFFER PACKAGE SCREEN */}`);

fs.writeFileSync('src/components/CallingCardView.tsx', code);
