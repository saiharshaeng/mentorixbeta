const { execSync } = require('child_process');
const files = execSync('git ls-files', { encoding: 'utf8' }).split(/\r?\n/);
console.log('Total tracked files in git:', files.length);

const bad = files.filter(f => /[\"\']/.test(f) || /[^\x00-\x7F]/.test(f));
console.log('Files with special chars:', bad.length);
bad.forEach(f => console.log(' -', f));
