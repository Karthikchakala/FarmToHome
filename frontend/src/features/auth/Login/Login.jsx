import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginSchema } from '../authSchemas.js';
import { loginSuccess } from '../authSlice.js';
import api from '../../../utils/axiosConfig.js';
import AuthLayout from '../AuthLayout.jsx';
import './Login.css';

const Login = () => {
    const [serverError, setServerError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === 'admin') navigate('/admin/dashboard');
            else if (user.role === 'farmer') navigate('/farmer/dashboard');
            else navigate('/');
        }
    }, [isAuthenticated, user, navigate]);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            setServerError('');
            const response = await api.post('/auth/login', data);

            dispatch(loginSuccess({
                user: response.data.user,
                token: response.data.token,
            }));

            const role = response.data.user.role;
            if (role === 'admin') navigate('/admin/dashboard');
            else if (role === 'farmer') navigate('/farmer/dashboard');
            else navigate('/');
        } catch (err) {
            setServerError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Feed Your Family Fresher"
            subtitle="Login to access farm-fresh produce delivered straight from local farmers to your doorstep."
        >
            <div className="login-form-section">
                <div className="login-header">
                    <h1 className="login-title">Welcome Back</h1>
                    <p className="login-sub">Sign in to continue to Farm to Table</p>
                </div>

                {serverError && (
                    <div className="auth-alert auth-alert--error" role="alert">
                        <span className="auth-alert__icon">⚠️</span>
                        {serverError}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="login-form" noValidate>
                    {/* Email */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="login-email">Email Address</label>
                        <div className="form-input-wrap">
                            <span className="form-icon">✉️</span>
                            <input
                                id="login-email"
                                type="email"
                                placeholder="you@example.com"
                                className={`form-input${errors.email ? ' form-input--error' : ''}`}
                                autoComplete="email"
                                {...register('email')}
                            />
                        </div>
                        {errors.email && <p className="form-error-msg">{errors.email.message}</p>}
                    </div>

                    {/* Password */}
                    <div className="form-group">
                        <div className="form-label-row">
                            <label className="form-label" htmlFor="login-password">Password</label>
                            <Link to="/forgot-password" className="form-forgot">Forgot password?</Link>
                        </div>
                        <div className="form-input-wrap">
                            <span className="form-icon">🔒</span>
                            <input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                className={`form-input${errors.password ? ' form-input--error' : ''}`}
                                autoComplete="current-password"
                                {...register('password')}
                            />
                            <button
                                type="button"
                                className="form-eye-btn"
                                onClick={() => setShowPassword((v) => !v)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                        {errors.password && <p className="form-error-msg">{errors.password.message}</p>}
                    </div>

                    <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="auth-submit-btn__loading">
                                <span className="spinner" />
                                Signing in...
                            </span>
                        ) : 'Sign In →'}
                    </button>
                </form>

                {/* Social divider */}
                <div className="auth-divider">
                    <span>or continue with</span>
                </div>

                {/* Demo quick-logins */}
                <div className="demo-logins">
                    <p className="demo-logins__label">Quick demo login:</p>
                    <div className="demo-logins__btns">
                        <button type="button" className="demo-btn" onClick={() => {
                            document.getElementById('login-email').value = 'consumer@demo.com';
                            document.getElementById('login-password').value = 'demo123';
                        }}>👤 Consumer</button>
                        <button type="button" className="demo-btn" onClick={() => {
                            document.getElementById('login-email').value = 'farmer@demo.com';
                            document.getElementById('login-password').value = 'demo123';
                        }}>🌾 Farmer</button>
                        <button type="button" className="demo-btn" onClick={() => {
                            document.getElementById('login-email').value = 'admin@demo.com';
                            document.getElementById('login-password').value = 'demo123';
                        }}>🛡️ Admin</button>
                    </div>
                </div>

                <p className="auth-switch">
                    New to Farm to Table? <Link to="/register">Create a free account</Link>
                </p>
            </div>
        </AuthLayout>
    );
};

export default Login;
