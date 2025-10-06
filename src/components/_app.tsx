// pages/_app.tsx
import '../app/globals.css';               // your global styles
import '../components/VaultPanel.css';     // VaultPanel styles
import '../components/PasswordGenerator.css'; // PasswordGenerator styles
import '../components/VaultItemCard.css';  // VaultItemCard styles
import type { AppProps } from 'next/app';

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
