import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';

const PaymentSuccessPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-green-100 max-w-md w-full text-center slide-in-from-bottom flex flex-col items-center animate-in fade-in duration-500">

                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                </div>

                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Payment Successful!</h1>
                <p className="text-gray-500 mb-8">
                    Thank you for choosing local, sustainable farming. Your order has been placed and paid for.
                </p>

                <div className="bg-gray-50 rounded-xl p-4 w-full mb-8 border border-gray-100 flex justify-between items-center text-left">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Status</p>
                        <p className="font-semibold text-green-700">Confirmed</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Action</p>
                        <p className="font-medium text-gray-900">Preparing Order</p>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/orders')}
                    className="w-full bg-green-600 text-white font-bold py-3.5 px-6 rounded-xl hover:bg-green-700 transition flex items-center justify-center gap-2 group"
                >
                    View My Orders
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};

export default PaymentSuccessPage;
