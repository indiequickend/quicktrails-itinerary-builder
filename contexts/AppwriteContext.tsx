import { createContext, useContext } from 'react';
import { account, databases, storage, functions, APPWRITE_ID, APPWRITE_DATABASE_ID } from '@/lib/appwrite';

export const AppwriteContext = createContext({ account, databases, storage, functions, APPWRITE_ID, APPWRITE_DATABASE_ID });

export function AppwriteProvider({ children }: { children: React.ReactNode }) {
    return (
        <AppwriteContext.Provider value={{ account, databases, storage, functions, APPWRITE_ID, APPWRITE_DATABASE_ID }}>
            {children}
        </AppwriteContext.Provider>
    );
}

export const useAppwrite = () => useContext(AppwriteContext);
