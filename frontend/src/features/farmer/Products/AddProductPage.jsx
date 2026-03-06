import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createFarmerProduct, fetchFarmerProducts } from './farmerProductsSlice';
import ProductForm from '../../../components/farmer/ProductForm/ProductForm';

const AddProductPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (productData) => {
        setIsSubmitting(true);
        try {
            await dispatch(createFarmerProduct(productData)).unwrap();
            // Refetch to ensure sync with server side (like ID generation)
            await dispatch(fetchFarmerProducts()).unwrap();
            navigate('/farmer/products');
        } catch (error) {
            alert(error || 'Failed to add product');
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ padding: '32px' }}>
            <ProductForm
                title="Add New Produce"
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
            />
        </div>
    );
};

export default AddProductPage;
