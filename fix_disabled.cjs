const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace mainServices filter
code = code.replace(
  "let mainServices = services.filter(s => s.type === 'Main Grid' && s.isEnabled).sort((a,b) => a.sortOrder - b.sortOrder);",
  "let mainServices = services.filter(s => s.type === 'Main Grid').sort((a,b) => a.sortOrder - b.sortOrder);"
);

// Replace onClick for mainServices
code = code.replace(
  "onClick={() => { action(); playAudio('click'); }}",
  "onClick={() => { if (!serv.isEnabled) { alert('Temporary unavailable please contact helpline'); } else { action(); playAudio('click'); } }}"
);

// Replace mfsServices filter
code = code.replace(
  "let mfsServices = services.filter(s => s.type === 'Mobile Bank' && s.isEnabled).sort((a,b) => a.sortOrder - b.sortOrder);",
  "let mfsServices = services.filter(s => s.type === 'Mobile Bank').sort((a,b) => a.sortOrder - b.sortOrder);"
);

// Replace onClick for mfsServices
code = code.replace(
  "onClick={() => { setTransferMfsProvider(codeParam === 'more' ? null : codeParam); setActivePanel('mfs-transfer'); playAudio('click'); }}",
  "onClick={() => { if (!item.isEnabled) { alert('Temporary unavailable please contact helpline'); } else { setTransferMfsProvider(codeParam === 'more' ? null : codeParam); setActivePanel('mfs-transfer'); playAudio('click'); } }}"
);

fs.writeFileSync('src/App.tsx', code);
