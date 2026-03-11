import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth/context';
import { TenantProvider } from '@/lib/tenant-context';
import { ThemeProvider } from '@/lib/theme-context';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    template: '%s | ERP',
    default: 'ERP System',
  },
  description: 'Enterprise Resource Planning System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
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
