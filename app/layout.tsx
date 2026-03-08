import './globals.css';
import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import { AuthProvider } from '@/lib/auth/context';
import { TenantProvider } from '@/lib/tenant-context';
import { ThemeProvider } from '@/lib/theme-context';
import { Toaster } from '@/components/ui/sonner';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

// Script to apply branding colors before React hydrates
function getBrandingScript() {
  return `
    (function() {
      try {
        var saved = localStorage.getItem('branding_settings');
        if (saved) {
          var branding = JSON.parse(saved);
          var root = document.documentElement;

          function hexToRGB(hex) {
            var result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
            return result ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16)
            } : null;
          }

          function rgbToHSL(r, g, b) {
            r /= 255; g /= 255; b /= 255;
            var max = Math.max(r, g, b), min = Math.min(r, g, b);
            var h = 0, s = 0, l = (max + min) / 2;
            if (max !== min) {
              var d = max - min;
              s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
              switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
              }
            }
            return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
          }

          if (branding.primaryColor) {
            var primaryRGB = hexToRGB(branding.primaryColor);
            if (primaryRGB) {
              var primaryHSL = rgbToHSL(primaryRGB.r, primaryRGB.g, primaryRGB.b);
              root.style.setProperty('--primary', primaryHSL.h + ' ' + primaryHSL.s + '% ' + primaryHSL.l + '%');
              root.style.setProperty('--ring', primaryHSL.h + ' ' + primaryHSL.s + '% ' + primaryHSL.l + '%');
              root.style.setProperty('--sidebar-primary', primaryHSL.h + ' ' + primaryHSL.s + '% ' + primaryHSL.l + '%');
              root.style.setProperty('--sidebar-ring', primaryHSL.h + ' ' + primaryHSL.s + '% ' + primaryHSL.l + '%');
            }
          }

          if (branding.accentColor) {
            var accentRGB = hexToRGB(branding.accentColor);
            if (accentRGB) {
              var accentHSL = rgbToHSL(accentRGB.r, accentRGB.g, accentRGB.b);
              root.style.setProperty('--accent', accentHSL.h + ' ' + accentHSL.s + '% ' + accentHSL.l + '%');
              root.style.setProperty('--sidebar-accent', accentHSL.h + ' ' + accentHSL.s + '% ' + accentHSL.l + '%');
            }
          }
        }

        // Also apply company name to title
        var companySaved = localStorage.getItem('company_settings');
        if (companySaved) {
          var company = JSON.parse(companySaved);
          if (company.companyName) {
            document.title = company.companyName + ' - ERP';
          }
        }
      } catch(e) {}
    })();
  `;
}

// Dynamic metadata that reads from localStorage on request
export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
    title: {
      template: '%s | BridgeBreak ERP',
      default: 'BridgeBreak ERP',
    },
    description: 'Enterprise Resource Planning System',
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: getBrandingScript() }} />
      </head>
      <body className={roboto.className}>
        <AuthProvider>
          <TenantProvider>
            <ThemeProvider>
              {children}
              <Toaster />
            </ThemeProvider>
          </TenantProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
