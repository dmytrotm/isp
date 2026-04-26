import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, FileText } from "lucide-react";
import api from "../../services/api";

// Main Contracts component
export default function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalContracts, setTotalContracts] = useState(0);
  // Add missing state variables for invoices functionality
  const [invoices, setInvoices] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const contractsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    fetchContracts();
  }, [currentPage]);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      // Get access token from local storage or your auth context
      const accessToken = localStorage.getItem("token");

      if (!accessToken) {
        throw new Error("No access token found. Please log in again.");
      }

      // Form the API query with pagination only
      let endpoint = `/contracts/?page=${currentPage}`;

      const response = await api.get(endpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Axios already has the data parsed - no need for response.ok check
      const data = response.data;
      setContracts(data.results || data);

      // If pagination info is available
      if (data.count !== undefined) {
        setTotalContracts(data.count);
      } else {
        setTotalContracts((data.results || data).length);
      }

      setLoading(false);
    } catch (err) {
      // Axios error handling
      const errorMessage =
        err.response?.data?.detail ||
        err.message ||
        "Failed to fetch contracts";
      setError(errorMessage);
      setLoading(false);
    }
  };

  const viewContractDetails = async (contractId) => {
    navigate(`/contracts/${contractId}`);
  };

  const fetchInvoicesForContract = async (contractId) => {
    try {
      const accessToken = localStorage.getItem("token");
      if (!accessToken) throw new Error("No access token found.");

      const response = await api.get(`/invoices/?contract=${contractId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setInvoices(response.data.results || response.data);
      setSelectedContract(contractId);
      setShowInvoiceModal(true);
    } catch (err) {
      console.error("Error fetching invoices:", err);
    }
  };

  // Add a close modal function
  const closeInvoiceModal = () => {
    setShowInvoiceModal(false);
    setSelectedContract(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading contracts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        Error loading contracts: {error}
        <button
          onClick={fetchContracts}
          className="ml-4 px-3 py-1 bg-red-100 hover:bg-red-200 rounded-md"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Your Contracts</h1>
      </div>

      {contracts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-md">
          <div className="text-lg text-gray-500">No contracts found</div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contract ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tariff
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      #{contract.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contract.service_details?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contract.tariff_details?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(contract.start_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          contract.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {contract.is_active ? "Active" : "Expired"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewContractDetails(contract.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => fetchInvoicesForContract(contract.id)}
                          className="text-gray-600 hover:text-gray-900"
                          title="View invoices"
                        >
                          <FileText className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-700">
              Showing{" "}
              {Math.min(contracts.length, 1) +
                (currentPage - 1) * contractsPerPage}{" "}
              to {Math.min(currentPage * contractsPerPage, totalContracts)} of{" "}
              {totalContracts} contracts
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-md bg-white text-gray-700 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={currentPage * contractsPerPage >= totalContracts}
                className="px-4 py-2 border rounded-md bg-white text-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Invoices for Contract #{selectedContract}
              </h2>
              <button
                onClick={closeInvoiceModal}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            {invoices.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                No invoices found for this contract
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoice #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          #{invoice.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(invoice.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          ${invoice.amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              invoice.paid
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {invoice.paid ? "Paid" : "Pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={closeInvoiceModal}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
