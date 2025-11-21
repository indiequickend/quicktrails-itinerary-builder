import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { AppwriteProvider } from '@/contexts/AppwriteContext';
import Layout from '@/components/Layout';
import { AuthProvider } from '@/contexts/AuthContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { useRouter } from 'next/router';

export default function App({ Component, pageProps }: AppProps) {
    const router = useRouter();
    const isStaticError = router.pathname === '/404' || router.pathname === '/500';

    if (isStaticError) {
        return <Component {...pageProps} />;
    }

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
