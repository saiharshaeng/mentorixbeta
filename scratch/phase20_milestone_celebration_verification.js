/**
 * phase20_milestone_celebration_verification.js
 * Verification suite for Mentorix Splash Screen Milestone Celebration.
 */

'use strict';

const fs = require('fs');
const path = require('path');

console.log('=== MENTORIX MILESTONE CELEBRATION VERIFICATION ===\n');

let errors = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ [PASS] ${message}`);
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    errors++;
  }
}

const jsPath = path.join(__dirname, '../src/js/services/milestoneCelebration.js');
const corePath = path.join(__dirname, '../src/core/services/milestoneCelebration.js');
const indexPath = path.join(__dirname, '../src/index.html');

// 1. File existence
assert(fs.existsSync(jsPath), 'src/js/services/milestoneCelebration.js exists');
assert(fs.existsSync(corePath), 'src/core/services/milestoneCelebration.js exists');

// 2. Require module
const { COMMUNITY_STATS, MilestoneCelebration } = require(jsPath);

assert(!!COMMUNITY_STATS, 'COMMUNITY_STATS config object exported');
assert(COMMUNITY_STATS.learners === 2150, 'COMMUNITY_STATS.learners equals 2150');
assert(COMMUNITY_STATS.suffix === '+', 'COMMUNITY_STATS.suffix equals "+"');
assert(COMMUNITY_STATS.label === 'LEARNERS REACHED', 'COMMUNITY_STATS.label equals "LEARNERS REACHED"');
assert(COMMUNITY_STATS.subtitle === 'Still counting...', 'COMMUNITY_STATS.subtitle equals "Still counting..."');
assert(COMMUNITY_STATS.thankYou.includes('Thank you for your support and belief in us.'), 'COMMUNITY_STATS.thankYou has thank-you message');
assert(COMMUNITY_STATS.enabled === true, 'COMMUNITY_STATS.enabled flag exists and defaults to true');
assert(Object.isFrozen(COMMUNITY_STATS), 'COMMUNITY_STATS is frozen/immutable');

assert(!!MilestoneCelebration, 'MilestoneCelebration instance exported');
assert(typeof MilestoneCelebration.play === 'function', 'MilestoneCelebration.play() method exists');
assert(typeof MilestoneCelebration.animateCounter === 'function', 'MilestoneCelebration.animateCounter() method exists');
assert(typeof MilestoneCelebration.triggerParticleCelebration === 'function', 'MilestoneCelebration.triggerParticleCelebration() method exists');

// 3. index.html checks
const html = fs.readFileSync(indexPath, 'utf8');
assert(html.includes('src="js/services/milestoneCelebration.js?v=80"'), 'index.html includes milestoneCelebration.js script tag');
assert(html.includes('MilestoneCelebration.play(runExistingSplashTimeline)'), 'index.html invokes MilestoneCelebration before existing splash timeline');

console.log('\n====================================================');
if (errors === 0) {
  console.log('   🏆 MILESTONE CELEBRATION AUDIT SUCCESSFUL! 0 ERRORS.');
} else {
  console.error(`   ❌ MILESTONE CELEBRATION AUDIT FAILED WITH ${errors} ERRORS.`);
}
console.log('====================================================\n');
process.exit(errors > 0 ? 1 : 0);
