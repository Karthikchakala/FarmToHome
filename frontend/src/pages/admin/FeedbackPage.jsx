import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReviews } from '../../features/admin/adminSlices';
import { Star, AlertTriangle, Trash2 } from 'lucide-react';

const FeedbackPage = () => {
  const dispatch = useDispatch();
  const { reviews, status } = useSelector((state) => state.analytics || { reviews: [] });

  useEffect(() => {
    dispatch(fetchReviews());
  }, [dispatch]);

  const handleDelete = (_id) => {
    window.confirm('Delete this review? (Not implemented in backend yet)');
  };

  if (status === 'loading') return <div className="p-8 text-center text-gray-500">Loading feedback...</div>;

  return (
    <div className="p-8 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Feedback & Reviews</h1>
        <p className="text-gray-500 mt-1">Monitor product and farmer reviews to ensure quality standards.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-1 text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill={i < review.rating ? "currentColor" : "none"} />
                  ))}
                </div>
                <span className={`text-xs px-2 py-1 rounded ${review.rating >= 4 ? 'bg-green-100 text-green-700' : review.rating === 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>
                  {review.target_type}
                </span>
              </div>
              <p className="text-gray-700 italic text-sm mb-4">"{review.comment}"</p>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                By <span className="font-medium">{review.reviewer_name}</span><br />
                {new Date(review.created_at).toLocaleDateString()}
              </div>
              <div className="flex gap-2">
                {review.rating <= 2 && <AlertTriangle size={18} className="text-red-500" title="Low Rating Alert" />}
                <button onClick={() => handleDelete(review.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">No recent feedback available.</p>
          </div>
        )}
      </div>
    </div >
  );
};

export default FeedbackPage;
