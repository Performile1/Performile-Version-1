import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  Package,
  MapPin,
  CreditCard,
  CheckCircle,
  ArrowRight,
  Loader,
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!);

interface ShipmentDetails {
  fromAddress: string;
  fromPostalCode: string;
  fromCity: string;
  fromCountry: string;
  toAddress: string;
  toPostalCode: string;
  toCity: string;
  toCountry: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  description: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: 'mobile' | 'card';
  fee: string;
  feePercentage: number;
  recommended: boolean;
  available: boolean;
  icon: string;
  description: string;
  baseAmount: number;
  feeAmount: number;
  totalAmount: number;
}

const C2CCreate: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [shipmentDetails, setShipmentDetails] = useState<ShipmentDetails>({
    fromAddress: '',
    fromPostalCode: '',
    fromCity: '',
    fromCountry: user?.country || 'NO',
    toAddress: '',
    toPostalCode: '',
    toCity: '',
    toCountry: 'NO',
    weight: 0,
    length: 0,
    width: 0,
    height: 0,
    description: '',
  });
  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');

  useEffect(() => {
    if (user?.user_role !== 'consumer') {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleInputChange = (field: keyof ShipmentDetails, value: string | number) => {
    setShipmentDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const calculatePrice = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/c2c/calculate-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(shipmentDetails),
      });

      if (response.ok) {
        const data = await response.json();
        setEstimatedPrice(data.price);
        setStep(2);
        
        // Fetch available payment methods
        await fetchPaymentMethods(data.price);
      }
    } catch (error) {
      console.error('Failed to calculate price:', error);
      alert('Failed to calculate price. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async (amount: number) => {
    try {
      const response = await fetch(
        `/api/c2c/get-payment-methods?country=${shipmentDetails.fromCountry}&amount=${amount}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.data.paymentMethods);
        setSelectedPaymentMethod(data.data.defaultMethod);
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    }
  };

  const createShipment = async () => {
    setLoading(true);
    try {
      // Create order first
      const orderResponse = await fetch('/api/c2c/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(shipmentDetails),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create order');
      }

      const orderData = await orderResponse.json();
      setOrderId(orderData.orderId);
      setStep(3);
    } catch (error) {
      console.error('Failed to create shipment:', error);
      alert('Failed to create shipment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async () => {
    setLoading(true);
    try {
      const selectedMethod = paymentMethods.find((m) => m.id === selectedPaymentMethod);

      if (selectedMethod?.type === 'mobile') {
        // Handle Vipps/Swish payment
        const endpoint =
          selectedPaymentMethod === 'vipps'
            ? '/api/vipps/create-payment'
            : '/api/swish/create-payment';

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            orderId,
            amount: estimatedPrice,
            paymentType: 'c2c_shipment',
            returnUrl: `${window.location.origin}/consumer/c2c/success`,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          // Redirect to payment URL
          window.location.href = data.data.checkoutUrl || data.data.deepLink;
        }
      } else {
        // Handle Stripe payment
        const response = await fetch('/api/stripe/create-c2c-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            orderId,
            amount: estimatedPrice,
            paymentType: 'c2c_shipment',
            currency: 'EUR',
            returnUrl: `${window.location.origin}/consumer/c2c/success`,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const stripe = await stripePromise;
          
          if (stripe) {
            const { error } = await stripe.confirmPayment({
              clientSecret: data.data.clientSecret,
              confirmParams: {
                return_url: `${window.location.origin}/consumer/c2c/success`,
              },
            });

            if (error) {
              console.error('Payment failed:', error);
              alert('Payment failed. Please try again.');
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to process payment:', error);
      alert('Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ship a Package</h1>
              <p className="mt-1 text-sm text-gray-500">
                Send packages anywhere with C2C shipping
              </p>
            </div>
            <button
              onClick={() => navigate('/consumer/dashboard')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { num: 1, title: 'Shipment Details' },
              { num: 2, title: 'Review & Confirm' },
              { num: 3, title: 'Payment' },
            ].map((s, index) => (
              <div key={s.num} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    step >= s.num
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step > s.num ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <span>{s.num}</span>
                  )}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    step >= s.num ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {s.title}
                </span>
                {index < 2 && (
                  <ArrowRight className="h-5 w-5 mx-4 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Shipment Details */}
        {step === 1 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              Shipment Details
            </h2>

            <div className="space-y-6">
              {/* From Address */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  From Address
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={shipmentDetails.fromAddress}
                      onChange={(e) => handleInputChange('fromAddress', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={shipmentDetails.fromPostalCode}
                      onChange={(e) =>
                        handleInputChange('fromPostalCode', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={shipmentDetails.fromCity}
                      onChange={(e) => handleInputChange('fromCity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <select
                      value={shipmentDetails.fromCountry}
                      onChange={(e) => handleInputChange('fromCountry', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="NO">Norway</option>
                      <option value="SE">Sweden</option>
                      <option value="DK">Denmark</option>
                      <option value="FI">Finland</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* To Address */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  To Address
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={shipmentDetails.toAddress}
                      onChange={(e) => handleInputChange('toAddress', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={shipmentDetails.toPostalCode}
                      onChange={(e) =>
                        handleInputChange('toPostalCode', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={shipmentDetails.toCity}
                      onChange={(e) => handleInputChange('toCity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <select
                      value={shipmentDetails.toCountry}
                      onChange={(e) => handleInputChange('toCountry', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="NO">Norway</option>
                      <option value="SE">Sweden</option>
                      <option value="DK">Denmark</option>
                      <option value="FI">Finland</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Package Details */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  Package Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={shipmentDetails.weight}
                      onChange={(e) =>
                        handleInputChange('weight', parseFloat(e.target.value))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Length (cm)
                    </label>
                    <input
                      type="number"
                      value={shipmentDetails.length}
                      onChange={(e) =>
                        handleInputChange('length', parseInt(e.target.value))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Width (cm)
                    </label>
                    <input
                      type="number"
                      value={shipmentDetails.width}
                      onChange={(e) =>
                        handleInputChange('width', parseInt(e.target.value))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      value={shipmentDetails.height}
                      onChange={(e) =>
                        handleInputChange('height', parseInt(e.target.value))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={shipmentDetails.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="What are you shipping?"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={calculatePrice}
                disabled={loading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin h-5 w-5 mr-2" />
                    Calculating...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Review & Confirm */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">
                Review Shipment
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">From</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {shipmentDetails.fromAddress}, {shipmentDetails.fromPostalCode}{' '}
                    {shipmentDetails.fromCity}, {shipmentDetails.fromCountry}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">To</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {shipmentDetails.toAddress}, {shipmentDetails.toPostalCode}{' '}
                    {shipmentDetails.toCity}, {shipmentDetails.toCountry}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Package</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {shipmentDetails.weight}kg, {shipmentDetails.length}x
                    {shipmentDetails.width}x{shipmentDetails.height}cm
                  </p>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-base font-medium text-gray-900">
                    <span>Estimated Price</span>
                    <span>€{estimatedPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Select Payment Method
              </h2>
              
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    onClick={() =>
                      method.available && setSelectedPaymentMethod(method.id)
                    }
                    className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedPaymentMethod === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${!method.available && 'opacity-50 cursor-not-allowed'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">{method.icon}</div>
                        <div>
                          <div className="flex items-center">
                            <h3 className="text-sm font-medium text-gray-900">
                              {method.name}
                            </h3>
                            {method.recommended && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            {method.description}
                          </p>
                          <p className="mt-2 text-sm font-medium text-gray-900">
                            €{method.baseAmount.toFixed(2)} + €
                            {method.feeAmount.toFixed(2)} fee = €
                            {method.totalAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      {selectedPaymentMethod === method.id && (
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back
              </button>
              <button
                onClick={createShipment}
                disabled={loading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin h-5 w-5 mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    Confirm & Pay
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              Complete Payment
            </h2>
            
            <div className="text-center py-8">
              <CreditCard className="h-16 w-16 mx-auto mb-4 text-blue-600" />
              <p className="text-sm text-gray-600 mb-6">
                Click below to complete your payment
              </p>
              
              <button
                onClick={processPayment}
                disabled={loading}
                className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin h-6 w-6 mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay €{paymentMethods.find((m) => m.id === selectedPaymentMethod)?.totalAmount.toFixed(2)}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default C2CCreate;
