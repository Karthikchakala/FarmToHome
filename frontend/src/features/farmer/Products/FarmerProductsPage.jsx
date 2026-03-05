import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchFarmerProducts, deleteFarmerProduct } from './farmerProductsSlice';
import ProductCard from '../../../components/farmer/ProductCard/ProductCard';
import './FarmerProductsPage.css';

const FarmerProductsPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { products, status, error } = useSelector((state) => state.farmerProducts);

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchFarmerProducts());
        }
    }, [dispatch, status]);

    const handleDelete = async (productId) => {
        dispatch(deleteFarmerProduct(productId));
    };

    if (status === 'loading') return <div className="page-loading">Loading your products...</div>;
    if (status === 'failed') return <div className="page-error">Error: {error}</div>;

    const activeProducts = products.filter(p => p.is_active);

    return (
        <div className="farmer-products-page">
            <header className="page-header">
                <div className="header-info">
                    <h1>My Products</h1>
                    <p>Manage your farm's inventory, pricing, and details.</p>
                </div>
                <button
                    className="btn-add-product"
                    onClick={() => navigate('/farmer/products/new')}
                >
                    + Add New Product
                </button>
            </header>

            {activeProducts.length > 0 ? (
                <div className="products-grid">
                    {activeProducts.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            ) : (
                <div className="empty-catalog-state">
                    <span className="empty-icon">📦</span>
                    <h2>No Products Yet</h2>
                    <p>You haven't listed any products for sale. Click the button above to add your fresh produce.</p>
                </div>
            )}
        </div>
    );
};

export default FarmerProductsPage;
