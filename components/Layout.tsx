import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from './AppSidebar';
import { Separator } from './ui/separator';


const PUBLIC_ROUTES = ['/login'];


// Simple full‑screen loading indicator
function FullScreenLoader() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-lg">Loading…</p>
        </div>
    );
}

// Prompt shown when unauthenticated
function LoginPrompt() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <Link
                href="/login"
                className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
            >
                Login to Continue
            </Link>
        </div>
    );
}

export default function Layout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, logout } = useAuth();
    const { pathname, replace } = useRouter();

    // Allow login page (or other public paths) to render even without a session
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (isLoading) {
        return <FullScreenLoader />;
    }

    if (!user && !isPublicRoute) {
        return <LoginPrompt />;
    }




    return (
        <div className="flex min-h-screen">
            <SidebarProvider>
                {
                    user && (
                        <AppSidebar
                            user={user}
                            onLogout={async () => {
                                await logout();
                                replace('/login')
                            }}
                        />

                    )
                }
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <span className='font-bold text-lg'>Itinerary Builder</span>
                    </header>
                    <main className="flex-1 p-6 bg-gray-50 min-h-screen">
                        {children}
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </div>
    );
}
