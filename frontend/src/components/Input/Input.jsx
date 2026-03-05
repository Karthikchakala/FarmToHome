import React, { forwardRef } from 'react';
import './Input.css';

const Input = forwardRef(({ label, error, className = '', ...props }, ref) => {
    return (
        <div className={`input-group ${className}`}>
            {label && <label className="input-label">{label}</label>}
            <input
                ref={ref}
                className={`input-field ${error ? 'error' : ''}`}
                {...props}
            />
            {error && <span className="input-error-msg">{error}</span>}
        </div>
    );
});

Input.displayName = 'Input';
export default Input;
