import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getRazorpayKey, createRazorpayOrder, verifyPayment, clearPaymentState } from '../../features/payments/paymentsSlice';
import { fetchOrderById } from '../../features/consumer/orders/ordersSlice';
import { ShieldCheck, Truck, CreditCard, ChevronLeft, Loader2 } from 'lucide-react';

// Hook to load razorpay script
const useRazorpay = () => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (document.getElementById('razorpay-checkout-js')) {
            setTimeout(() => setIsLoaded(true), 0);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.id = 'razorpay-checkout-js';
        script.async = true;
        script.onload = () => setIsLoaded(true);
        document.body.appendChild(script);
    }, []);

    return isLoaded;
};

const PaymentPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isRazorpayLoaded = useRazorpay();

    // Selections
    const { razorpayKey, currentOrder: _currentOrder, status: paymentStatus, verificationStatus } = useSelector(s => s.payments);
    const { currentOrder: dbOrder, status: orderStatus } = useSelector(s => s.orders);

    useEffect(() => {
        dispatch(fetchOrderById(orderId));
        dispatch(getRazorpayKey());
        return () => dispatch(clearPaymentState());
    }, [dispatch, orderId]);

    // Navigate away if it's already paid or COD
    useEffect(() => {
        if (dbOrder) {
            if (dbOrder.payment_status === 'SUCCESS') {
                navigate('/payment/success', { replace: true });
            } else if (dbOrder.payment_method === 'COD') {
                navigate('/orders', { replace: true });
            }
        }
    }, [dbOrder, navigate]);

    // Navigation watcher after successful verification via backend
    useEffect(() => {
        if (verificationStatus === 'success') {
            navigate('/payment/success', { replace: true });
        } else if (verificationStatus === 'failed') {
            navigate(`/payment/failed?orderId=${orderId}`, { replace: true });
        }
    }, [verificationStatus, navigate, orderId]);


    const handlePayment = async () => {
        if (!isRazorpayLoaded || !razorpayKey) {
            alert("Payment gateway is initializing. Please wait...");
            return;
        }

        try {
            // 1. Create Order through Backend
            const rpOrderRes = await dispatch(createRazorpayOrder(orderId)).unwrap();

            // 2. Open Razorpay Checkout Modal
            const options = {
                key: razorpayKey,
                amount: rpOrderRes.amount,
                currency: rpOrderRes.currency,
                name: "Farm To Table",
                description: `Order ${dbOrder?.order_number || orderId}`,
                order_id: rpOrderRes.orderId,
                handler: async function (response) {
                    // 3. Very transaction on callback
                    dispatch(verifyPayment({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        internal_order_id: orderId
                    }));
                },
                prefill: {
                    name: dbOrder?.Items?.[0]?.product?.farmer?.farm_name ? "Customer" : "Customer",
                    // email, contact if available
                },
                theme: {
                    color: "#16a34a" // green-600
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                // Let the user retry closing the modal, or optionally log it
                console.warn("Razorpay modal error:", response.error);
                navigate(`/payment/failed?orderId=${orderId}`);
            });
            rzp.open();

        } catch (err) {
            console.error(err);
            alert("Failed to initiate payment: " + err);
        }
    };


    if (orderStatus === 'loading' || !dbOrder) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="w-10 h-10 animate-spin text-green-600" />
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-10 px-4 md:px-0">
            <div className="max-w-3xl mx-auto">

                <button onClick={() => navigate(-1)} className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition">
                    <ChevronLeft size={16} className="mr-1" /> Back
                </button>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

                    {/* Header */}
                    <div className="bg-gray-900 px-8 py-6 text-white flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-extrabold mb-1">Complete Payment</h1>
                            <p className="text-gray-400 text-sm">Order #{dbOrder.order_number}</p>
                        </div>
                        <div className="bg-gray-800 p-3 rounded-full hidden sm:block">
                            <ShieldCheck className="w-8 h-8 text-green-400" />
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="flex flex-col md:flex-row gap-10">

                            {/* Left Column: Order details */}
                            <div className="flex-1 space-y-6">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Truck size={16} /> Delivery To
                                    </h3>
                                    <p className="text-gray-800 font-medium bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        {dbOrder.delivery_address || 'Address provided at checkout'}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Order Summary</h3>
                                    <div className="space-y-4">
                                        {dbOrder.Items?.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                                <div>
                                                    <p className="font-semibold text-gray-800">{item.product_name || 'Product'}</p>
                                                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                                </div>
                                                <p className="font-medium text-gray-900">₹{(item.price_at_time * item.quantity).toFixed(2)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Payment Trigger */}
                            <div className="w-full md:w-80 flex flex-col justify-center">
                                <div className="bg-green-50 rounded-2xl p-6 border border-green-100 mb-6">
                                    <p className="text-green-800 text-sm font-medium mb-1">Total to Pay</p>
                                    <p className="text-4xl font-extrabold text-green-900 tracking-tight">₹{Number(dbOrder.total_amount).toFixed(2)}</p>
                                </div>

                                <button
                                    onClick={handlePayment}
                                    disabled={paymentStatus === 'loading' || !isRazorpayLoaded || verificationStatus === 'verifying'}
                                    className="w-full bg-gray-900 text-white font-bold py-4 px-6 rounded-2xl hover:bg-gray-800 hover:shadow-lg transition-all disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                                >
                                    {(paymentStatus === 'loading' || verificationStatus === 'verifying') ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <>
                                            <CreditCard size={24} />
                                            Pay Securely
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-xs text-gray-400 mt-4 font-medium flex items-center justify-center gap-1">
                                    <ShieldCheck size={14} /> Secured by Razorpay
                                </p>
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PaymentPage;
