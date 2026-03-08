'use client';

import { useEffect, useState } from 'react';

export function TitleUpdater() {
    const [companyName, setCompanyName] = useState('BridgeBreak');

    useEffect(() => {
        // Load company name from localStorage
        const loadCompanyName = () => {
            const companySaved = localStorage.getItem('company_settings');
            if (companySaved) {
                const company = JSON.parse(companySaved);
                const name = company.companyName || 'BridgeBreak';
                setCompanyName(name);
                document.title = `${name} - ERP`;
            } else {
                // Check app_company_name set by theme provider
                const appName = localStorage.getItem('app_company_name');
                if (appName) {
                    setCompanyName(appName);
                    document.title = `${appName} - ERP`;
                }
            }
        };

        loadCompanyName();

        // Listen for storage changes
        window.addEventListener('storage', loadCompanyName);

        // Also poll for changes since localStorage changes in same tab won't trigger event
        const interval = setInterval(loadCompanyName, 1000);

        return () => {
            window.removeEventListener('storage', loadCompanyName);
            clearInterval(interval);
        };
    }, []);

    return null;
}
