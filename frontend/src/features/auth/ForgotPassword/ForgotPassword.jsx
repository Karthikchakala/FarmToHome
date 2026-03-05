import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../AuthLayout.jsx';
import '../Login/Login.css';
import './ForgotPassword.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (email) setSubmitted(true);
    };

    return (
        <AuthLayout
            title="Forgot Your Password?"
            subtitle="No worries! Enter your email and we'll guide you to reset your password and get back to fresh produce."
        >
            <div className="login-form-section">
                <div className="login-header">
                    <h1 className="login-title">Reset Password</h1>
                    <p className="login-sub">Enter your registered email address</p>
                </div>

                {submitted ? (
                    <div className="auth-alert auth-alert--success">
                        <span>✅</span>
                        If an account with <strong>{email}</strong> exists, you'll receive a reset link shortly. Check your inbox.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="login-form" noValidate>
                        <div className="form-group">
                            <label className="form-label" htmlFor="forgot-email">Email Address</label>
                            <div className="form-input-wrap">
                                <span className="form-icon">✉️</span>
                                <input
                                    id="forgot-email"
                                    type="email"
                                    placeholder="you@example.com"
                                    className="form-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>
                        <button type="submit" className="auth-submit-btn" disabled={!email}>
                            Send Reset Link →
                        </button>
                    </form>
                )}

                <p className="auth-switch">
                    Remembered your password? <Link to="/login">Back to Login</Link>
                </p>
            </div>
        </AuthLayout>
    );
};

export default ForgotPassword;
