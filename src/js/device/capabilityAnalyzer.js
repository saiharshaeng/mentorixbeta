/**
 * capabilityAnalyzer.js — Graphics & Shader Capability Analyzer
 * Compatibility Phase 1 (UDICDS)
 *
 * Detects WebGL 1.0, WebGL 2.0, GPU renderer context, and Three.js shader capabilities.
 */

'use strict';

(function(exports) {

  const GraphicsTiers = exports.GraphicsTiers || (window.GraphicsTiers || {
    WEBGL2: 'WebGL2', WEBGL1: 'WebGL1', CANVAS2D: 'Canvas2D', NONE: 'None'
  });

  class CapabilityAnalyzer {
    static analyzeGraphics() {
      try {
        const canvas = document.createElement('canvas');
        let gl = canvas.getContext('webgl2');

        if (gl) {
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
          return {
            tier: GraphicsTiers.WEBGL2,
            renderer: renderer || 'WebGL2 Context',
            supportsShaders: true,
            maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096
          };
        }

        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          return {
            tier: GraphicsTiers.WEBGL1,
            renderer: 'WebGL1 Context',
            supportsShaders: true,
            maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048
          };
        }

        const ctx2d = canvas.getContext('2d');
        if (ctx2d) {
          return {
            tier: GraphicsTiers.CANVAS2D,
            renderer: '2D Canvas Fallback',
            supportsShaders: false,
            maxTextureSize: 1024
          };
        }
      } catch (e) {
        console.warn('[CapabilityAnalyzer] WebGL detection fallback:', e.message);
      }

      return {
        tier: GraphicsTiers.NONE,
        renderer: 'Software Fallback',
        supportsShaders: false,
        maxTextureSize: 0
      };
    }
  }

  if (typeof window !== 'undefined') {
    window.CapabilityAnalyzer = CapabilityAnalyzer;
  }

  exports.CapabilityAnalyzer = CapabilityAnalyzer;

})(typeof exports !== 'undefined' ? exports : window);
