const http = require('http');
function get(url) {
  return new Promise((r,j) => {
    const req = http.get(url, res => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>r({s:res.statusCode,b:d})); });
    req.on('error',j); req.setTimeout(3000,()=>{req.destroy();j(new Error('timeout'));});
  });
}
async function check() {
  const ps = await get('http://localhost:8080/data/pyqService.js');
  console.log('pyqService.js size:', ps.b.length, 'bytes');
  console.log('  Has window.location.origin:', ps.b.includes('window.location.origin') ? 'YES ✅ FIXED' : 'NO ❌ OLD VERSION');
  console.log('  Has file guard:', ps.b.includes('file:') ? 'YES ✅' : 'NO ❌');
  
  const mi = await get('http://localhost:8080/data/pyq/master_index.json');
  const idx = JSON.parse(mi.b);
  const totalQs = idx.JEE_MAIN.reduce((s,p)=>s+(p.questionCount||0),0) + (idx.JEE_ADVANCED||[]).reduce((s,p)=>s+(p.questionCount||0),0);
  console.log('master_index: JEE_MAIN=' + idx.JEE_MAIN.length + ' JEE_ADV=' + (idx.JEE_ADVANCED||[]).length + ' total=' + totalQs + ' questions');
}
check().catch(e=>console.error('ERROR:',e.message));
