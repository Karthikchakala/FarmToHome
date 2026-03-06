import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { XCircle, RefreshCcw } from 'lucide-react';

const PaymentFailurePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const orderId = new URLSearchParams(location.search).get('orderId');

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-red-50 max-w-md w-full text-center animate-in zoom-in-95 duration-300">

                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <XCircle className="w-12 h-12 text-red-500" />
                </div>

                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Payment Failed</h1>
                <p className="text-gray-500 mb-8">
                    We couldn't process your payment at this time. No charges were made to your account.
                </p>

                <div className="space-y-3">
                    {orderId && (
                        <button
                            onClick={() => navigate(`/payment/${orderId}`)}
                            className="w-full bg-gray-900 text-white font-bold py-3.5 px-6 rounded-xl hover:bg-gray-800 transition flex items-center justify-center gap-2"
                        >
                            <RefreshCcw className="w-5 h-5" />
                            Try Payment Again
                        </button>
                    )}

                    <button
                        onClick={() => navigate('/cart')}
                        className="w-full bg-white text-gray-700 font-bold py-3.5 px-6 rounded-xl border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition"
                    >
                        Return to Cart
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentFailurePage;
