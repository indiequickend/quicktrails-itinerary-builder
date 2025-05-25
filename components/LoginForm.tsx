import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAppwrite } from '@/contexts/AppwriteContext';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Replace } from 'lucide-react';

export default function LoginForm() {
    const { account } = useAppwrite();
    const router = useRouter();
    const { user, isLoading, error, login } = useAuth()

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (user) router.replace('/');
    }, [user, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(email, password);
        } catch (err: any) {

        }
    };

    return (
        <form onSubmit={handleLogin} className="max-w-md mx-auto p-6 bg-white rounded shadow">
            <h2 className="text-2xl font-bold mb-4">Login</h2>
            {error && <p className="text-red-600 mb-2">{error}</p>}
            <div className="mb-4">
                <label className="block mb-1">Email</label>
                <input
                    type="email"
                    required
                    autoComplete='email'
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full border p-2 rounded"
                    disabled={isLoading}
                />
            </div>
            <div className="mb-6">
                <label className="block mb-1">Password</label>
                <input
                    type="password"
                    required
                    autoComplete='current-password'
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border p-2 rounded"
                    disabled={isLoading}
                />
            </div>
            <Button
                type="submit"
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                disabled={isLoading}
            >
                {isLoading ? 'Logging in…' : 'Login'}
            </Button>
        </form>
    );
}
