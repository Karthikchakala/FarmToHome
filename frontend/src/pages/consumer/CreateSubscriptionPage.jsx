import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Repeat2 } from 'lucide-react';
import { createSubscription, clearCreateStatus } from '../../features/subscriptions/subscriptionsSlice';
import SubscriptionForm from '../../features/subscriptions/components/SubscriptionForm';

const CreateSubscriptionPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { createStatus, createError } = useSelector(s => s.subscriptions);

    React.useEffect(() => {
        if (createStatus === 'succeeded') {
            dispatch(clearCreateStatus());
            navigate('/subscriptions');
        }
    }, [createStatus, navigate, dispatch]);

    React.useEffect(() => {
        return () => { dispatch(clearCreateStatus()); };
    }, [dispatch]);

    const handleSubmit = (data) => {
        dispatch(createSubscription(data));
    };

    return (
        <div className="min-h-screen bg-gray-50 py-10">
            <div className="max-w-2xl mx-auto px-4">
                <button onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
                    <ArrowLeft size={16} /> Back to Subscriptions
                </button>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Card header */}
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <Repeat2 size={24} />
                            <h1 className="text-2xl font-bold">New Recurring Subscription</h1>
                        </div>
                        <p className="text-green-100 text-sm">
                            Choose your products and delivery schedule. We'll automatically create orders for you.
                        </p>
                    </div>

                    <div className="p-8">
                        <SubscriptionForm
                            onSubmit={handleSubmit}
                            isLoading={createStatus === 'loading'}
                            error={createError}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateSubscriptionPage;
