import React, { useState, useEffect } from 'react';
import './ProductForm.css';

const CATEGORIES = ['Vegetables', 'Fruits', 'Dairy', 'Meat', 'Grains', 'Herbs', 'Other'];
const UNITS = ['kg', 'gram', 'liter', 'piece', 'bunch', 'dozen'];

const ProductForm = ({ initialData, onSubmit, isSubmitting, title }) => {
    const [formData, setFormData] = useState({
        productName: '',
        description: '',
        category: 'Vegetables',
        pricePerUnit: '',
        stockQuantity: '',
        unit: 'kg',
        images: [''],
        harvestDate: ''
    });

    useEffect(() => {
        if (initialData) {
            setTimeout(() => setFormData({
                productName: initialData.name || '',
                description: initialData.description || '',
                category: initialData.category || 'Vegetables',
                pricePerUnit: initialData.price || '',
                stockQuantity: initialData.stock_quantity || '',
                unit: initialData.unit || 'kg',
                images: initialData.image_url ? [initialData.image_url] : [''],
            }), 0);
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUrlChange = (e) => {
        setFormData(prev => ({ ...prev, images: [e.target.value] }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Convert to numbers for API
        const submitData = {
            ...formData,
            pricePerUnit: parseFloat(formData.pricePerUnit),
            stockQuantity: parseInt(formData.stockQuantity, 10)
        };

        // Remove empty strings for harvestDate
        if (!submitData.harvestDate) {
            delete submitData.harvestDate;
        }

        onSubmit(submitData);
    };

    return (
        <div className="product-form-container">
            <h2 className="form-title">{title}</h2>

            <form onSubmit={handleSubmit} className="product-form">
                <div className="form-row">
                    <div className="form-group full-width">
                        <label htmlFor="productName">Product Name *</label>
                        <input
                            type="text"
                            id="productName"
                            name="productName"
                            value={formData.productName}
                            onChange={handleChange}
                            required
                            placeholder="e.g. Organic Roma Tomatoes"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group full-width">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Describe your product's quality, farming method, etc."
                        />
                    </div>
                </div>

                <div className="form-row split">
                    <div className="form-group">
                        <label htmlFor="category">Category *</label>
                        <select id="category" name="category" value={formData.category} onChange={handleChange} required>
                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="harvestDate">Harvest Date</label>
                        <input
                            type="date"
                            id="harvestDate"
                            name="harvestDate"
                            value={formData.harvestDate}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="form-row split-three">
                    <div className="form-group">
                        <label htmlFor="pricePerUnit">Price (₹) *</label>
                        <input
                            type="number"
                            id="pricePerUnit"
                            name="pricePerUnit"
                            value={formData.pricePerUnit}
                            onChange={handleChange}
                            min="0.01"
                            step="0.01"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="unit">Unit *</label>
                        <select id="unit" name="unit" value={formData.unit} onChange={handleChange} required>
                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="stockQuantity">Stock Quantity *</label>
                        <input
                            type="number"
                            id="stockQuantity"
                            name="stockQuantity"
                            value={formData.stockQuantity}
                            onChange={handleChange}
                            min="0"
                            step="1"
                            required
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group full-width">
                        <label htmlFor="imageUrl">Image URL</label>
                        <input
                            type="url"
                            id="imageUrl"
                            name="imageUrl"
                            value={formData.images[0]}
                            onChange={handleImageUrlChange}
                            placeholder="https://example.com/image.jpg"
                        />
                        <small className="help-text">For V1, paste a direct link to an image.</small>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn-submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Product'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
