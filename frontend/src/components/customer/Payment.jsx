import { useState, useEffect } from "react";
import api from "../../services/api";

const Payment = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setLoading(true);
        // Fetch available payment methods
        const response = await api.get("/payment-methods/");
        setPaymentMethods(response.data || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching payment methods:", err);
        setError("Failed to load payment methods. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchPaymentMethods();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || !selectedMethod) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Make payment request to the backend
      // Note: customer field is not required here as it will be set by the backend
      // based on the authenticated user's customer profile
      const token = localStorage.getItem("token");
      const response = await api.post(
        "/payments/",
        {
          amount: parseFloat(amount),
          method: selectedMethod,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Show success message
      setSuccess(true);
      // Reset form
      setAmount("");
      setSelectedMethod("");
    } catch (err) {
      console.error("Payment error:", err);
      setError(
        err.response?.data?.detail || "Payment failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Make a Payment</h1>

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Payment processed successfully! The payment has been applied to your
          balance.
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="amount" className="block mb-2">
            Amount:
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border rounded"
            required
            min="0.01"
            step="0.01"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="method" className="block mb-2">
            Payment Method:
          </label>
          {loading ? (
            <select id="method" className="w-full p-2 border rounded" disabled>
              <option>Loading payment methods...</option>
            </select>
          ) : (
            <select
              id="method"
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select a payment method</option>
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.method}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          type="submit"
          className={`bg-blue-500 text-white py-2 px-4 rounded ${
            submitting || loading
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-blue-600"
          }`}
          disabled={submitting || loading}
        >
          {submitting ? "Processing..." : "Pay Now"}
        </button>
      </form>
    </div>
  );
};

export default Payment;
