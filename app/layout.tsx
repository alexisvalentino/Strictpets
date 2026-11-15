import type { Metadata, Viewport } from 'next';
import { Roboto_Flex } from 'next/font/google';

import 'tailwindcss/tailwind.css';
/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

import '../styles/global.css';
import '../styles/variables.css';

export const metadata: Metadata = {
  title: 'Focus Tracker',
  description: 'A friendly focus buddy: set the phone down and focus alongside your pet to grow streaks, coins, and a collection of friends.',
};

export const viewport: Viewport = {
  initialScale: 1,
  width: 'device-width',
  viewportFit: 'cover',
  // Match the browser chrome (address bar) to the app's blue branding.
  themeColor: '#0EA5E9',
};

// Self-hosted Roboto Flex — the variable app-standard typeface, tight at small
// sizes. Variable weight covers every weight the UI uses (base + semibold +
// bold + black) without faux-bold synthesis.
const roboto = Roboto_Flex({
  subsets: ['latin'],
  weight: 'variable',
  variable: '--font-roboto',
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={roboto.variable}>
      {/* No remote scripts: the app runs fully offline and never executes
          third-party code (icons are emoji/inline SVG). */}
      <body>{children}</body>
    </html>
  );
}
