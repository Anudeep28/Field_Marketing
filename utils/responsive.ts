import { Dimensions, Platform } from 'react-native';
import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

function getIsMobile(): boolean {
  const { width } = Dimensions.get('window');
  return width < MOBILE_BREAKPOINT;
}

/**
 * Hook that returns true when the screen width is below the mobile breakpoint.
 * Updates on window resize (web) or orientation change (native).
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(getIsMobile());

  useEffect(() => {
    const handler = ({ window }: { window: { width: number; height: number } }) => {
      setIsMobile(window.width < MOBILE_BREAKPOINT);
    };
    const subscription = Dimensions.addEventListener('change', handler);
    return () => subscription?.remove();
  }, []);

  return isMobile;
}

/**
 * Returns a value based on whether the current screen is mobile or desktop.
 */
export function responsive<T>(mobile: T, desktop: T): T {
  return getIsMobile() ? mobile : desktop;
}
