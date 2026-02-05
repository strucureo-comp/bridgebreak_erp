/**
 * Tax Data Collection Initializer Component
 * Triggers tax data collection initialization on app startup
 * Runs silently in background - 3x per month automatically
 */

'use client';

import { useEffect, useRef } from 'react';

export function TaxCollectionInitializer() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    
    // Small delay to ensure server is ready during dev reload
    const timer = setTimeout(async () => {
      try {
        initialized.current = true;
        const response = await fetch('/api/internal/tax-init');
        if (response.ok) {
          const data = await response.json();
          console.log('[TAX INIT] System initialized:', data.message);
        }
      } catch (error) {
        // Silently catch network errors during dev reloads
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return null;
}

export default TaxCollectionInitializer;
