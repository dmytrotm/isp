import React, { useState } from "react";
import api from "../../services/api"; // Adjust import path as needed

const ApiTester = () => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [requestData, setRequestData] = useState(
    JSON.stringify(
      {
        user: {
          email: "test@example.com",
          first_name: "Test",
          last_name: "User",
          password: "securepassword123",
        },
        status: 1,
        phone_number: "3806842159", // Removed the "+" to test
        preferred_notification: "email",
        addresses: [],
      },
      null,
      2
    )
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);
    setError(null);

    try {
      // Parse the JSON from the textarea
      const parsedData = JSON.parse(requestData);
      console.log("Sending data:", parsedData);

      // Make a direct API call
      const result = await api.post("customers/", parsedData);

      setResponse(result.data);
      console.log("Success:", result.data);
    } catch (err) {
      setError({
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
      });
      console.error("Error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg w-full mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-center text-2xl font-bold text-gray-900 mb-6">
        API Tester
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="requestData"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Request Data (JSON)
          </label>
          <textarea
            id="requestData"
            rows={15}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm font-mono text-sm"
            value={requestData}
            onChange={(e) => setRequestData(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2"
        >
          {loading ? "Sending..." : "Send Request"}
        </button>
      </form>

      {error && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-red-600">Error</h3>
          <div className="mt-2 bg-red-50 p-4 rounded-md">
            <p className="text-sm text-red-700">
              <span className="font-medium">Status:</span> {error.status}{" "}
              {error.statusText}
            </p>
            <p className="text-sm text-red-700 mt-1">
              <span className="font-medium">Message:</span> {error.message}
            </p>
            {error.data && (
              <div className="mt-2">
                <p className="text-sm font-medium text-red-700">
                  Response Data:
                </p>
                <pre className="mt-1 text-xs text-red-600 overflow-auto max-h-40 p-2 bg-red-100 rounded">
                  {JSON.stringify(error.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {response && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-green-600">Success</h3>
          <pre className="mt-2 bg-green-50 p-4 rounded-md text-xs text-green-700 overflow-auto max-h-60">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ApiTester;
