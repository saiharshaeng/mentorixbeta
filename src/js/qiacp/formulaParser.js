/**
 * formulaParser.js — Multi-Format Formula Representation Engine
 * Stores equations in 3 formats: latex, unicode, plainText
 */
(function () {
  'use strict';

  function latexToUnicode(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/\\ce\{([^}]+)\}/g, '$1')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)')
      .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
      .replace(/\^2/g, '²')
      .replace(/\^3/g, '³')
      .replace(/\\theta/g, 'θ')
      .replace(/\\alpha/g, 'α')
      .replace(/\\beta/g, 'β')
      .replace(/\\pi/g, 'π')
      .replace(/\\infty/g, '∞')
      .replace(/\\pm/g, '±')
      .replace(/\\times/g, '×')
      .replace(/\\cdot/g, '·')
      .replace(/[\$\\]/g, '');
  }

  function latexToPlainText(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/\\ce\{([^}]+)\}/g, '$1')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
      .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')
      .replace(/[\$\\]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function parseFormula(inputStr) {
    const raw = String(inputStr || '').trim();
    return {
      latex: raw,
      unicode: latexToUnicode(raw),
      plainText: latexToPlainText(raw)
    };
  }

  const FormulaParser = {
    parseFormula,
    latexToUnicode,
    latexToPlainText
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormulaParser;
  }
  if (typeof window !== 'undefined') {
    window.FormulaParser = FormulaParser;
  }
})();
