import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { updateFarmerProduct, fetchFarmerProducts } from './farmerProductsSlice';
import ProductForm from '../../../components/farmer/ProductForm/ProductForm';

const EditProductPage = () => {
    const { productId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Find the product from Redux state
    const { products, status } = useSelector(state => state.farmerProducts);
    const existingProduct = products.find(p => p.id === parseInt(productId, 10));

    useEffect(() => {
        // If loaded directly via URL, we might need to fetch products first
        if (status === 'idle') {
            dispatch(fetchFarmerProducts());
        }
    }, [dispatch, status]);

    const handleSubmit = async (productData) => {
        setIsSubmitting(true);
        try {
            await dispatch(updateFarmerProduct({ productId, productData })).unwrap();
            navigate('/farmer/products');
        } catch (error) {
            alert(error || 'Failed to update product');
            setIsSubmitting(false);
        }
    };

    if (status === 'loading') return <div style={{ padding: '32px' }}>Loading product details...</div>;
    if (!existingProduct && status === 'succeeded') {
        return <div style={{ padding: '32px', color: 'red' }}>Product not found.</div>;
    }

    return (
        <div style={{ padding: '32px' }}>
            <ProductForm
                title="Edit Product Details"
                initialData={existingProduct}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
            />
        </div>
    );
};

export default EditProductPage;
