import React, {
    createContext,
    useState,
    useEffect,
    ReactNode,
    useContext,
} from "react";
import { useAppwrite } from "@/contexts/AppwriteContext";
import { Settings } from "@/types";

interface SettingsContextValue {
    settings: Settings | null;
    loading: boolean;
    error: string | null;
    /** Call after your form saves successfully */
    updateSettings: (newSettings: Settings) => void;
    /** If you ever need to re-fetch from Appwrite */
    refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue>({
    settings: null,
    loading: true,
    error: null,
    updateSettings: () => { },
    refreshSettings: async () => { },
});

export function SettingsProvider({ children }: { children: ReactNode }) {
    const { databases, APPWRITE_DATABASE_ID } = useAppwrite();
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch once on mount
    const fetchSettings = async () => {
        setLoading(true);
        setError(null);
        try {
            const doc = await databases.getDocument<Settings>(
                APPWRITE_DATABASE_ID,
                "682a28440038cc7ba928",
                "682a40a9003c3a60b1bb"
            );
            setSettings(doc);
        } catch (err: any) {
            setError(err.message || "Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    // Expose updater for SettingsForm
    const updateSettings = (newSettings: Settings) => {
        setSettings(newSettings);
    };

    return (
        <SettingsContext.Provider
            value={{
                settings,
                loading,
                error,
                updateSettings,
                refreshSettings: fetchSettings,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    return useContext(SettingsContext);
}
