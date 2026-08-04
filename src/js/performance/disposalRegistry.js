/**
 * disposalRegistry.js — Memory Leak Prevention & Asset Disposer for Mentorix
 *
 * Automatically tracks and cleans up active timers, Chart.js instances, resize observers,
 * and DOM event listeners upon route transitions to keep heap memory low.
 */
(function () {
  'use strict';

  const activeTimers = new Set();
  const activeIntervals = new Set();
  const activeCharts = new Set();
  const activeDisposables = new Set();

  function registerTimer(timerId) {
    if (timerId) activeTimers.add(timerId);
    return timerId;
  }

  function registerInterval(intervalId) {
    if (intervalId) activeIntervals.add(intervalId);
    return intervalId;
  }

  function registerChart(chartInstance) {
    if (chartInstance) activeCharts.add(chartInstance);
    return chartInstance;
  }

  function registerDisposable(disposeFn) {
    if (typeof disposeFn === 'function') activeDisposables.add(disposeFn);
  }

  function disposeAll() {
    // Clear Timers
    activeTimers.forEach(id => clearTimeout(id));
    activeTimers.clear();

    // Clear Intervals
    activeIntervals.forEach(id => clearInterval(id));
    activeIntervals.clear();

    // Destroy Chart instances
    activeCharts.forEach(chart => {
      try {
        if (chart && typeof chart.destroy === 'function') chart.destroy();
      } catch (e) {
        // Ignore chart destroy errors
      }
    });
    activeCharts.clear();

    // Run custom disposable callbacks
    activeDisposables.forEach(fn => {
      try { fn(); } catch (e) { /* Ignore */ }
    });
    activeDisposables.clear();
  }

  const DisposalRegistry = {
    registerTimer,
    registerInterval,
    registerChart,
    registerDisposable,
    disposeAll
  };

  if (typeof window !== 'undefined') {
    window.DisposalRegistry = DisposalRegistry;
    // Automatically purge old screen allocations on route changes
    window.addEventListener('hashchange', () => {
      DisposalRegistry.disposeAll();
    });
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DisposalRegistry;
  }
})();
