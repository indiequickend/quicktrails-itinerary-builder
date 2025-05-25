import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { AppwriteProvider } from '@/contexts/AppwriteContext';
import Layout from '@/components/Layout';
import { AuthProvider } from '@/contexts/AuthContext';
import { SettingsProvider } from '@/contexts/SettingsContext';

export default function App({ Component, pageProps }: AppProps) {
    return (
        <AppwriteProvider>
            <AuthProvider>
                <SettingsProvider>
                    <Layout>
                        <Component {...pageProps} />
                    </Layout>
                </SettingsProvider>
            </AuthProvider>
        </AppwriteProvider>
    );
}
