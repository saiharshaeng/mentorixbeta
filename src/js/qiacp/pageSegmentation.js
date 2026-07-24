/**
 * qiacp/pageSegmentation.js — QIACP Stage 4: Page & Section Segmentation Engine
 * Identifies paper metadata, instructions, sections (Section A, Section B), and segments raw blocks.
 */

'use strict';

(function(exports) {

  function segmentPage(cleanupResult) {
    console.log('[QIACP Stage 4] Segmenting paper into structural sections...');
    const text = cleanupResult.sanitizedText || '';

    const sections = [];
    const lines = text.split('\n');

    let currentSection = { name: 'General', content: [] };

    lines.forEach(line => {
      const secMatch = line.match(/(SECTION\s*[-–:]?\s*[A-Z]|PART\s*[-–:]?\s*[I|V|X\d]+|PHYSICS|CHEMISTRY|MATHEMATICS|BIOLOGY)/i);
      if (secMatch) {
        if (currentSection.content.length > 0) {
          sections.push({ ...currentSection, contentStr: currentSection.content.join('\n') });
        }
        currentSection = { name: secMatch[0].toUpperCase(), content: [] };
      } else {
        currentSection.content.push(line);
      }
    });

    if (currentSection.content.length > 0) {
      sections.push({ ...currentSection, contentStr: currentSection.content.join('\n') });
    }

    return {
      ...cleanupResult,
      sections,
      stage: 'PAGE_SEGMENTED'
    };
  }

  exports.pageSegmentation = { segmentPage };

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.QIACP = window.QIACP || {}));
