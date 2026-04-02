import React from 'react';
import { Link } from 'react-router-dom';

const CostChartReference = () => {
  return (
    <div className="cost-chart-reference bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className="text-green-600 mr-2">📊</span>
          <h3 className="text-lg font-semibold text-gray-800">Pricing Reference</h3>
        </div>
        <Link
          to="/farmer/cost-chart"
          className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-block"
        >
          View Cost Chart
        </Link>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Reference prices set by admin. You can set prices within ±10% of base price.
      </p>

      {/* Essential Guidelines */}
      <div className="bg-white rounded-lg p-3 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
          <span className="text-green-600 mr-2">�</span>
          Quick Guidelines
        </h4>
        <ul className="text-xs text-gray-700 space-y-1">
          <li>• Base price is the reference price set by admin</li>
          <li>• Set prices between 90% to 110% of base price</li>
          <li>• Prices outside this range will be rejected</li>
          <li>• Click "View Cost Chart" to see complete pricing details</li>
        </ul>
      </div>
    </div>
  );
};

export default CostChartReference;
