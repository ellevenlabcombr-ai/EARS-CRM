import type {Metadata, Viewport} from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ScrollToTop } from '@/components/ScrollToTop';
import { InstallPrompt } from '@/components/InstallPrompt';
import { AgendaNotifier } from '@/components/AgendaNotifier';
import { BrandingInjector } from '@/components/BrandingInjector';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });

export const viewport: Viewport = {
  themeColor: '#050B14',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'EARS • ELLEVEN',
  description: 'Sistema de monitoramento de wellness para atletas da EARS (7 a 19 anos).',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'EARS',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  const envUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'] || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const envKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return (
    <html lang="pt-BR" className={`${inter.variable} ${spaceGrotesk.variable} dark`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-[#050B14] text-slate-50" suppressHydrationWarning>
        {/* Environment script injected before hydration */}
        <script
          key="env-script"
          dangerouslySetInnerHTML={{
            __html: `
              window.__ENV = {
                NEXT_PUBLIC_SUPABASE_URL: ${JSON.stringify(envUrl)},
                NEXT_PUBLIC_SUPABASE_ANON_KEY: ${JSON.stringify(envKey)}
              };
              window.addEventListener('error', (e) => {
                if (e.message && e.message.includes('ChunkLoadError')) {
                  console.warn('ChunkLoadError detected, reloading page...');
                  window.location.reload();
                }
              });
            `,
          }}
        />
        <ErrorBoundary key="err-boundary">
          <LanguageProvider key="lang-provider">
            <BrandingInjector />
            {children}
            <AgendaNotifier />
            <ScrollToTop />
            <InstallPrompt />
          </LanguageProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
