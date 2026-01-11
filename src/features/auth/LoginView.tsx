import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import './LoginView.css';

export const LoginView: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (provider: 'google' | 'kakao') => {
        try {
            setLoading(true);
            setError(null);

            const { error } = await supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: window.location.origin
                }
            });

            if (error) throw error;
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-header">
                <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '1rem' }}>Great 12 Weeks</h1>
                <p className="subtitle">Login to sync your goals across devices.</p>
            </div>

            <Card className="login-card">
                <div className="login-buttons">
                    <Button
                        onClick={() => handleLogin('google')}
                        disabled={loading}
                        className="btn-google"
                        style={{ width: '100%', marginBottom: '1rem', background: '#fff', color: '#000' }}
                    >
                        Sign in with Google
                    </Button>
                    <Button
                        onClick={() => handleLogin('kakao')}
                        disabled={loading}
                        className="btn-kakao"
                        style={{ width: '100%', background: '#FEE500', color: '#000', border: 'none' }}
                    >
                        Sign in with Kakao
                    </Button>
                </div>
                {error && <p className="login-error">{error}</p>}

                <div className="login-footer">
                    <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '2rem' }}>
                        Note: You need to set up Supabase Auth providers first.
                    </p>
                </div>
            </Card>
        </div>
    );
};
