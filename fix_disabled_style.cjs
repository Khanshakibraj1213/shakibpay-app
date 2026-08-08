const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// For Main Grid
code = code.replace(
  "className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all cursor-pointer active:scale-95 ${",
  "className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all cursor-pointer active:scale-95 ${!serv.isEnabled ? 'opacity-60 grayscale' : ''} ${"
);

// For Mobile Bank
code = code.replace(
  "className=\"flex flex-col items-center flex-shrink-0 space-y-1.5 cursor-pointer active:scale-95 transition-transform\"",
  "className={`flex flex-col items-center flex-shrink-0 space-y-1.5 cursor-pointer active:scale-95 transition-transform ${!item.isEnabled ? 'opacity-60 grayscale' : ''}`}"
);

fs.writeFileSync('src/App.tsx', code);
