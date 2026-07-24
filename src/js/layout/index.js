/**
 * index.js — Universal Adaptive Layout Engine (UALE) Facade
 * Compatibility Phase 2 (UALE)
 *
 * Facade entry point for the layout subsystem.
 */

'use strict';

(function(exports) {

  const LayoutFamilies = exports.LayoutFamilies || window.LayoutFamilies;
  const LayoutTokens = exports.LayoutTokens || window.LayoutTokens;
  const SafeAreaManager = exports.SafeAreaManager || window.SafeAreaManager;
  const OrientationManager = exports.OrientationManager || window.OrientationManager;
  const LayoutResolver = exports.LayoutResolver || window.LayoutResolver;
  const LayoutRegistry = exports.LayoutRegistry || window.LayoutRegistry;
  const LayoutEngine = exports.LayoutEngine || window.LayoutEngine;

  exports.LayoutFamilies = LayoutFamilies;
  exports.LayoutTokens = LayoutTokens;
  exports.SafeAreaManager = SafeAreaManager;
  exports.OrientationManager = OrientationManager;
  exports.LayoutResolver = LayoutResolver;
  exports.LayoutRegistry = LayoutRegistry;
  exports.LayoutEngine = LayoutEngine;

})(typeof exports !== 'undefined' ? exports : window);
