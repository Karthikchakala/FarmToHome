import React, { useState } from 'react';
import './CheckoutForm.css';

const CheckoutForm = ({ onSubmit, isSubmitting }) => {
    const [formData, setFormData] = useState({
        deliveryAddress: '',
        deliverySlot: '',
        paymentMethod: 'COD'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form className="checkout-form" onSubmit={handleSubmit}>
            <div className="form-section">
                <h3 className="section-title">Delivery Details</h3>

                <div className="form-group">
                    <label htmlFor="deliveryAddress">Delivery Address</label>
                    <textarea
                        id="deliveryAddress"
                        name="deliveryAddress"
                        value={formData.deliveryAddress}
                        onChange={handleChange}
                        placeholder="Enter your full address"
                        required
                        rows="3"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="deliverySlot">Preferred Delivery Slot</label>
                    <select
                        id="deliverySlot"
                        name="deliverySlot"
                        value={formData.deliverySlot}
                        onChange={handleChange}
                        required
                    >
                        <option value="" disabled>Select a timeslot</option>
                        <option value="Morning (8 AM - 12 PM)">Morning (8 AM - 12 PM)</option>
                        <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
                        <option value="Evening (4 PM - 8 PM)">Evening (4 PM - 8 PM)</option>
                    </select>
                </div>
            </div>

            <div className="form-section">
                <h3 className="section-title">Payment Method</h3>

                <div className="payment-options">
                    <label className={`payment-option ${formData.paymentMethod === 'COD' ? 'selected' : ''}`}>
                        <input
                            type="radio"
                            name="paymentMethod"
                            value="COD"
                            checked={formData.paymentMethod === 'COD'}
                            onChange={handleChange}
                        />
                        <div className="option-content">
                            <span className="option-title">Cash on Delivery</span>
                            <span className="option-desc">Pay directly when your order arrives.</span>
                        </div>
                    </label>

                    <label className={`payment-option disabled`}>
                        <input
                            type="radio"
                            name="paymentMethod"
                            value="ONLINE"
                            disabled
                        />
                        <div className="option-content">
                            <span className="option-title">Online Payment</span>
                            <span className="option-desc">Coming in the next update.</span>
                        </div>
                    </label>
                </div>
            </div>

            <button type="submit" className="btn-place-order" disabled={isSubmitting}>
                {isSubmitting ? 'Placing Order...' : 'Place Order'}
            </button>
        </form>
    );
};

export default CheckoutForm;
