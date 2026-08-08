const fs = require('fs');
let code = fs.readFileSync('src/components/MfsGateway.tsx', 'utf8');

// Add USDT to adminNums state
const adminNumsTarget = `  const [adminNums, setAdminNums] = useState({
    bkash: '01635275233',
    nagad: '01635275233',
    rocket: '01635275233'
  });`;
const adminNumsReplace = `  const [adminNums, setAdminNums] = useState({
    bkash: '01635275233',
    nagad: '01635275233',
    rocket: '01635275233',
    usdt: 'TRC20: TVgJ...'
  });`;

if (code.includes(adminNumsTarget)) {
    code = code.replace(adminNumsTarget, adminNumsReplace);
}

// Add USDT to selectedService state type
const selectedServiceTarget = `  const [selectedService, setSelectedService] = useState<'বিকাশ' | 'নগদ' | 'রকেট' | 'ব্যাংক'>(() => {`;
const selectedServiceReplace = `  const [selectedService, setSelectedService] = useState<'বিকাশ' | 'নগদ' | 'রকেট' | 'ব্যাংক' | 'USDT'>(() => {`;

if (code.includes(selectedServiceTarget)) {
    code = code.replace(selectedServiceTarget, selectedServiceReplace);
}

// Add usdt to fetch result
const fetchTarget = `          setAdminNums({
            bkash: data.adminNumbers.bkash?.personal || '01635275233',
            nagad: data.adminNumbers.nagad?.personal || '01635275233',
            rocket: data.adminNumbers.rocket?.personal || '01635275233'
          });`;
const fetchReplace = `          setAdminNums({
            bkash: data.adminNumbers.bkash?.personal || '01635275233',
            nagad: data.adminNumbers.nagad?.personal || '01635275233',
            rocket: data.adminNumbers.rocket?.personal || '01635275233',
            usdt: data.adminNumbers.usdt?.personal || 'TRC20: TVgJ...'
          });`;

if (code.includes(fetchTarget)) {
    code = code.replace(fetchTarget, fetchReplace);
}

fs.writeFileSync('src/components/MfsGateway.tsx', code);
