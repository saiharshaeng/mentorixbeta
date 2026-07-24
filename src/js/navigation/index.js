/**
 * index.js — Universal Navigation & Interaction Architecture (UNIA) Facade
 * Compatibility Phase 3 (UNIA)
 *
 * Facade entry point for the navigation subsystem.
 */

'use strict';

(function(exports) {

  const NavigationContracts = exports.NavigationContracts || window.NavigationContracts;
  const NavigationRegistry = exports.NavigationRegistry || window.NavigationRegistry;
  const HistoryManager = exports.HistoryManager || window.HistoryManager;
  const DeepLinkResolver = exports.DeepLinkResolver || window.DeepLinkResolver;
  const BreadcrumbManager = exports.BreadcrumbManager || window.BreadcrumbManager;
  const FocusModes = exports.FocusModes || window.FocusModes;
  const FocusModeManager = exports.FocusModeManager || window.FocusModeManager;
  const RouteGuards = exports.RouteGuards || window.RouteGuards;
  const NavigationManager = exports.NavigationManager || window.NavigationManager;
  const NavigationEngine = exports.NavigationEngine || window.NavigationEngine;

  exports.NavigationContracts = NavigationContracts;
  exports.NavigationRegistry = NavigationRegistry;
  exports.HistoryManager = HistoryManager;
  exports.DeepLinkResolver = DeepLinkResolver;
  exports.BreadcrumbManager = BreadcrumbManager;
  exports.FocusModes = FocusModes;
  exports.FocusModeManager = FocusModeManager;
  exports.RouteGuards = RouteGuards;
  exports.NavigationManager = NavigationManager;
  exports.NavigationEngine = NavigationEngine;

})(typeof exports !== 'undefined' ? exports : window);
