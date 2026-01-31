import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";

export function useAuth() {
    const [user, setUser] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        SecureStore.getItemAsync("userToken").then((token) => {
            setUser(token || null);
            setLoading(false);
        });
    }, []);

    return { user, loading, setUser };
}
