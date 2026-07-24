/**
 * layoutResolver.js — Layout Family Resolver
 * Compatibility Phase 2 (UALE)
 *
 * Resolves target Layout Family (Desktop, Laptop, Tablet, Mobile, Foldable)
 * based strictly on the DeviceProfile from Phase 1.
 */

'use strict';

(function(exports) {

  const LayoutFamilies = exports.LayoutFamilies || (window.LayoutFamilies || {
    DESKTOP: 'Desktop', LAPTOP: 'Laptop', TABLET: 'Tablet', MOBILE: 'Mobile', FOLDABLE: 'Foldable'
  });

  class LayoutResolver {
    static resolveLayoutFamily(deviceProfile) {
      if (!deviceProfile) return LayoutFamilies.DESKTOP;

      const { deviceClass, screenClass } = deviceProfile;

      if (deviceClass === 'Foldable') {
        return LayoutFamilies.FOLDABLE;
      }
      if (deviceClass === 'Phone' || screenClass === 'MobileCompact' || screenClass === 'MobileLarge') {
        return LayoutFamilies.MOBILE;
      }
      if (deviceClass === 'Tablet' || screenClass === 'TabletPortrait' || screenClass === 'TabletLandscape') {
        return LayoutFamilies.TABLET;
      }
      if (deviceClass === 'Laptop' || screenClass === 'LaptopStd') {
        return LayoutFamilies.LAPTOP;
      }

      return LayoutFamilies.DESKTOP;
    }
  }

  if (typeof window !== 'undefined') {
    window.LayoutResolver = LayoutResolver;
  }

  exports.LayoutResolver = LayoutResolver;

})(typeof exports !== 'undefined' ? exports : window);
