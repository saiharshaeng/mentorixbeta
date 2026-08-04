/**
 * importPlugins.js — Extensible Importer Plugin System
 * Common interface for ingesting questions from PDF, DOCX, JSON, CSV, Web, and Image sources.
 */
(function () {
  'use strict';

  class BaseImporterPlugin {
    constructor(sourceType) {
      this.sourceType = sourceType;
    }
    async parse(payload) {
      throw new Error(`parse() not implemented for importer ${this.sourceType}`);
    }
  }

  class JsonImporterPlugin extends BaseImporterPlugin {
    constructor() { super('JSON'); }
    async parse(payload) {
      const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
      const questions = Array.isArray(data) ? data : (data.questions || []);
      return questions.map((q, idx) => ({
        rawId: q.id || `raw_json_${Date.now()}_${idx}`,
        stem: q.stem || q.question || q.q || '',
        options: q.options || q.opts || [],
        ans: Array.isArray(q.ans) ? q.ans : [q.correct || 0],
        explanation: q.solution || q.explanation || q.expl || '',
        subject: q.subject || 'Physics',
        chapter: q.chapter || q.chap || 'General',
        year: q.year || 2025,
        exam: q.exam || 'JEE_MAIN'
      }));
    }
  }

  class CsvImporterPlugin extends BaseImporterPlugin {
    constructor() { super('CSV'); }
    async parse(csvText) {
      const lines = String(csvText).split('\n').filter(l => l.trim().length > 0);
      if (lines.length <= 1) return [];
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      return lines.slice(1).map((line, idx) => {
        const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        const obj = {};
        headers.forEach((h, i) => { obj[h] = cols[i] || ''; });
        
        return {
          rawId: `raw_csv_${Date.now()}_${idx}`,
          stem: obj.question || obj.stem || cols[0] || '',
          options: [obj.opt_a || cols[1] || '', obj.opt_b || cols[2] || '', obj.opt_c || cols[3] || '', obj.opt_d || cols[4] || ''],
          ans: [parseInt(obj.answer || cols[5] || '0', 10)],
          explanation: obj.explanation || cols[6] || '',
          subject: obj.subject || 'Physics',
          chapter: obj.chapter || 'General',
          year: parseInt(obj.year || '2025', 10),
          exam: obj.exam || 'JEE_MAIN'
        };
      });
    }
  }

  class PdfImporterPlugin extends BaseImporterPlugin {
    constructor() { super('PDF'); }
    async parse(pdfPayload) {
      // Handled by Node-side ingestion script or browser PDF.js extractor
      return Array.isArray(pdfPayload) ? pdfPayload : [];
    }
  }

  const PluginRegistry = {
    json: new JsonImporterPlugin(),
    csv: new CsvImporterPlugin(),
    pdf: new PdfImporterPlugin()
  };

  function getImporter(type) {
    const key = String(type).toLowerCase();
    return PluginRegistry[key] || PluginRegistry['json'];
  }

  const ImportPlugins = {
    BaseImporterPlugin,
    JsonImporterPlugin,
    CsvImporterPlugin,
    PdfImporterPlugin,
    getImporter
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImportPlugins;
  }
  if (typeof window !== 'undefined') {
    window.ImportPlugins = ImportPlugins;
  }
})();
