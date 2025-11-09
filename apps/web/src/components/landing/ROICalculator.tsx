import React, { useState } from 'react';
import { Calculator, TrendingUp, DollarSign } from 'lucide-react';

export function ROICalculator() {
  const [inputs, setInputs] = useState({
    monthlyOrders: 1000,
    avgOrderValue: 50,
    currentShippingCost: 8,
    currentProcessingTime: 5,
  });

  const calculateROI = () => {
    const { monthlyOrders, avgOrderValue, currentShippingCost, currentProcessingTime } = inputs;
    
    // Current costs
    const currentMonthlyShipping = monthlyOrders * currentShippingCost;
    const currentLaborCost = (currentProcessingTime / 60) * 25 * monthlyOrders; // $25/hour
    const currentTotalCost = currentMonthlyShipping + currentLaborCost;
    
    // With Performile
    const performileShippingCost = monthlyOrders * (currentShippingCost * 0.75); // 25% savings
    const performileLaborCost = (1 / 60) * 25 * monthlyOrders; // 1 min per order
    const performileSubscription = 79;
    const performileTotalCost = performileShippingCost + performileLaborCost + performileSubscription;
    
    // Savings
    const monthlySavings = currentTotalCost - performileTotalCost;
    const annualSavings = monthlySavings * 12;
    const roi = ((annualSavings - (performileSubscription * 12)) / (performileSubscription * 12)) * 100;
    
    return {
      currentMonthlyCost: currentTotalCost,
      performileMonthlyCost: performileTotalCost,
      monthlySavings,
      annualSavings,
      roi,
      paybackMonths: (performileSubscription * 12) / monthlySavings,
    };
  };

  const results = calculateROI();

  return (
    <section id="roi-calculator" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Calculator className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Calculate Your Savings
          </h2>
          <p className="text-xl text-gray-600">
            See how much you can save with Performile
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Input Section */}
          <div className="bg-gray-50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Current Situation</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Monthly Orders
                </label>
                <input
                  type="number"
                  value={inputs.monthlyOrders}
                  onChange={(e) => setInputs({ ...inputs, monthlyOrders: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Average Order Value (€)
                </label>
                <input
                  type="number"
                  value={inputs.avgOrderValue}
                  onChange={(e) => setInputs({ ...inputs, avgOrderValue: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Shipping Cost per Order (€)
                </label>
                <input
                  type="number"
                  value={inputs.currentShippingCost}
                  onChange={(e) => setInputs({ ...inputs, currentShippingCost: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Processing Time per Order (minutes)
                </label>
                <input
                  type="number"
                  value={inputs.currentProcessingTime}
                  onChange={(e) => setInputs({ ...inputs, currentProcessingTime: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="h-8 w-8" />
                <h3 className="text-2xl font-bold">Your Potential Savings</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-green-100 text-sm mb-1">Monthly Savings</div>
                  <div className="text-4xl font-bold">€{results.monthlySavings.toLocaleString()}</div>
                </div>
                
                <div>
                  <div className="text-green-100 text-sm mb-1">Annual Savings</div>
                  <div className="text-3xl font-bold">€{results.annualSavings.toLocaleString()}</div>
                </div>

                <div className="pt-4 border-t border-green-400">
                  <div className="text-green-100 text-sm mb-1">Return on Investment</div>
                  <div className="text-2xl font-bold">{results.roi.toFixed(0)}% ROI</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-xl p-6">
                <DollarSign className="h-8 w-8 text-blue-600 mb-2" />
                <div className="text-sm text-gray-600 mb-1">Current Monthly Cost</div>
                <div className="text-2xl font-bold text-gray-900">
                  €{results.currentMonthlyCost.toLocaleString()}
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-6">
                <DollarSign className="h-8 w-8 text-green-600 mb-2" />
                <div className="text-sm text-gray-600 mb-1">With Performile</div>
                <div className="text-2xl font-bold text-gray-900">
                  €{results.performileMonthlyCost.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 mb-3">What You Get:</h4>
              <ul className="space-y-2 text-gray-700">
                <li>✓ 25% lower shipping costs (better rates)</li>
                <li>✓ 80% faster processing (1 min vs {inputs.currentProcessingTime} min)</li>
                <li>✓ Automated label printing & tracking</li>
                <li>✓ Multi-courier comparison</li>
                <li>✓ Real-time analytics dashboard</li>
              </ul>
            </div>

            <button className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors">
              Start Saving Today
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
