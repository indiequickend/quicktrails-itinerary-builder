// contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useAppwrite } from '@/contexts/AppwriteContext';

interface AuthContextType {
    user: any;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    error: null,
    login: async () => { },
    logout: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { account } = useAppwrite();
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // On mount, check if there’s an existing session
    useEffect(() => {
        account
            .get()                      // throws if no session
            .then(setUser)
            .catch(() => setUser(null))
            .finally(() => setIsLoading(false));
    }, [account]);

    const login = useCallback(
        async (email: string, password: string) => {
            setIsLoading(true);
            setError(null);
            try {
                await account.createEmailPasswordSession(email, password);
                const usr = await account.get();  // fetch profile
                setUser(usr);
            } catch (err: any) {
                setError(err.message || 'Login failed');
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [account]
    );

    const logout = useCallback(async () => {
        await account.deleteSession('current');
        setUser(null);
    }, [account]);

    return (
        <AuthContext.Provider value={{ user, isLoading, error, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
