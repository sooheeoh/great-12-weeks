import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { FcGoogle } from 'react-icons/fc'; // Google Icon
import './LoginView.css';

export const LoginView: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fix: Explicitly use window.location.origin to support both localhost and Vercel
            // Ensure this URL is added to Supabase -> Authentication -> URL Configuration -> Redirect URLs
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
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
                <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '1rem' }}>위대한 12주</h1>
                <p className="subtitle">12주간의 위대한 여정을 시작하세요.</p>
            </div>

            <Card className="login-card">
                <div className="login-buttons">
                    <Button
                        onClick={handleLogin}
                        disabled={loading}
                        className="btn-google"
                        style={{
                            width: '100%',
                            marginBottom: '1rem',
                            background: '#fff',
                            color: '#1f2937',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            fontWeight: 600,
                            padding: '0.75rem'
                        }}
                    >
                        <FcGoogle size={24} />
                        <span>Google 계정으로 시작하기</span>
                    </Button>
                </div>
                {error && <p className="login-error">{error}</p>}

                <div className="login-footer">
                    <p className="footer-text">
                        오늘의 시작이 12주 후의 기적을 만듭니다.
                    </p>
                </div>
            </Card>
        </div>
    );
};
