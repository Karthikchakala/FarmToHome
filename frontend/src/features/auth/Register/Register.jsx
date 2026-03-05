import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerSchema } from '../authSchemas.js';
import { loginSuccess } from '../authSlice.js';
import api from '../../../utils/axiosConfig.js';
import AuthLayout from '../AuthLayout.jsx';
import './Register.css';

const ROLES = [
    {
        key: 'consumer',
        icon: '🛒',
        label: 'Consumer',
        description: 'Buy fresh produce from local farms',
    },
    {
        key: 'farmer',
        icon: '🌾',
        label: 'Farmer',
        description: 'Sell your produce directly to consumers',
    },
];

const Register = () => {
    const [searchParams] = useSearchParams();
    const [role, setRole] = useState(searchParams.get('role') === 'farmer' ? 'farmer' : 'consumer');
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

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: { role: 'consumer' },
    });

    const handleRoleChange = (newRole) => {
        setRole(newRole);
        reset({ role: newRole });
        setServerError('');
    };

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            setServerError('');
            const payload = { ...data, role };

            const response = await api.post('/auth/register', payload);

            dispatch(loginSuccess({
                user: response.data.user,
                token: response.data.token,
            }));

            if (role === 'farmer') navigate('/farmer/dashboard');
            else navigate('/');
        } catch (err) {
            setServerError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Join the Farm Revolution"
            subtitle="Connect with local farms. Get fresher food. Support sustainable agriculture in your community."
        >
            <div className="register-section">
                <div className="login-header">
                    <h1 className="login-title">Create Account</h1>
                    <p className="login-sub">Start your journey with Farm to Table</p>
                </div>

                {/* Role Selector */}
                <div className="role-selector">
                    <p className="role-selector__label">I want to join as:</p>
                    <div className="role-selector__cards">
                        {ROLES.map((r) => (
                            <button
                                key={r.key}
                                type="button"
                                className={`role-card${role === r.key ? ' role-card--active' : ''}`}
                                onClick={() => handleRoleChange(r.key)}
                            >
                                <span className="role-card__icon">{r.icon}</span>
                                <span className="role-card__label">{r.label}</span>
                                <span className="role-card__desc">{r.description}</span>
                                {role === r.key && <span className="role-card__check">✓</span>}
                            </button>
                        ))}
                    </div>
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
                        <label className="form-label" htmlFor="reg-email">Email Address</label>
                        <div className="form-input-wrap">
                            <span className="form-icon">✉️</span>
                            <input
                                id="reg-email"
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
                        <label className="form-label" htmlFor="reg-password">Password</label>
                        <div className="form-input-wrap">
                            <span className="form-icon">🔒</span>
                            <input
                                id="reg-password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Min 6 characters"
                                className={`form-input${errors.password ? ' form-input--error' : ''}`}
                                autoComplete="new-password"
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

                    {/* Full Name — consumer + farmer */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-fullName">Full Name</label>
                        <div className="form-input-wrap">
                            <span className="form-icon">👤</span>
                            <input
                                id="reg-fullName"
                                type="text"
                                placeholder="Your full name"
                                className={`form-input${errors.fullName ? ' form-input--error' : ''}`}
                                {...register('fullName')}
                            />
                        </div>
                        {errors.fullName && <p className="form-error-msg">{errors.fullName.message}</p>}
                    </div>

                    {/* Phone */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-phone">Phone Number</label>
                        <div className="form-input-wrap">
                            <span className="form-icon">📞</span>
                            <input
                                id="reg-phone"
                                type="tel"
                                placeholder="+91 98765 43210"
                                className={`form-input${errors.phone ? ' form-input--error' : ''}`}
                                {...register('phone')}
                            />
                        </div>
                        {errors.phone && <p className="form-error-msg">{errors.phone.message}</p>}
                    </div>

                    {/* Farm Name — farmer only */}
                    {role === 'farmer' && (
                        <div className="form-group">
                            <label className="form-label" htmlFor="reg-farmName">Farm Name</label>
                            <div className="form-input-wrap">
                                <span className="form-icon">🏡</span>
                                <input
                                    id="reg-farmName"
                                    type="text"
                                    placeholder="e.g. Green Valley Farms"
                                    className={`form-input${errors.farmName ? ' form-input--error' : ''}`}
                                    {...register('farmName')}
                                />
                            </div>
                            {errors.farmName && <p className="form-error-msg">{errors.farmName.message}</p>}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={loading}
                        style={{ marginTop: '0.5rem' }}
                    >
                        {loading ? (
                            <span className="auth-submit-btn__loading">
                                <span className="spinner" />
                                Creating Account...
                            </span>
                        ) : `Create ${role === 'farmer' ? 'Farmer' : 'Consumer'} Account →`}
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </AuthLayout>
    );
};

export default Register;
