import React from 'react';
import { useNavigate } from 'react-router-dom';
import StockBadge from '../StockBadge/StockBadge';
import './ProductCard.css';

const ProductCard = ({ product, onDelete }) => {
    const navigate = useNavigate();

    return (
        <div className="farmer-product-card">
            <div className="product-image-container">
                <img
                    src={product.image_url || 'https://via.placeholder.com/300x200?text=No+Image'}
                    alt={product.name}
                    loading="lazy"
                />
                <div className="product-status-overlay">
                    <StockBadge quantity={product.stock_quantity} />
                </div>
            </div>

            <div className="product-details">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-category">{product.category}</p>
                <div className="product-meta">
                    <span className="product-price">₹{parseFloat(product.price).toFixed(2)}</span>
                    <span className="product-unit">/ {product.unit}</span>
                </div>
            </div>

            <div className="product-actions">
                <button
                    className="btn btn-edit"
                    onClick={() => navigate(`/farmer/products/edit/${product.id}`)}
                >
                    Edit
                </button>
                <button
                    className="btn btn-delete"
                    onClick={() => {
                        if (window.confirm('Are you sure you want to delete this product?')) {
                            onDelete(product.id);
                        }
                    }}
                >
                    Delete
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
