// ContractDetails.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

const ContractDetails = () => {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchContractDetails = async () => {
      try {
        const accessToken = localStorage.getItem("token");

        if (!accessToken) {
          throw new Error("No access token found. Please log in again.");
        }

        const response = await api.get(`/contracts/${id}/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        setContract(response.data);
        setLoading(false);
      } catch (err) {
        console.error(
          "Error fetching contract details:",
          err.response?.data || err.message
        );
        setError(
          err.response?.data?.detail ||
            err.message ||
            "Failed to load contract details"
        );
        setLoading(false);
      }
    };

    fetchContractDetails();
  }, [id]);

  if (loading)
    return <div className="loading">Loading contract details...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!contract) return <div className="not-found">Contract not found</div>;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  return (
    <div className="contract-details">
      <div className="contract-header">
        <h2>Contract #{contract.id}</h2>
        <button className="back-button" onClick={() => navigate(-1)}>
          Back to Contracts
        </button>
      </div>

      <div className="contract-content">
        <div className="detail-item">
          <span className="label">Contract Number:</span>
          <span className="value">{contract.id || "N/A"}</span>
        </div>

        <div className="detail-item">
          <span className="label">Start Date:</span>
          <span className="value">
            {formatDate(contract.start_date) || "N/A"}
          </span>
        </div>

        <div className="detail-item">
          <span className="label">End Date:</span>
          <span className="value">
            {formatDate(contract.start_date) || "N/A"}
          </span>
        </div>

        <div className="detail-item">
          <span className="label">Status:</span>
          <span
            className={`value status-${
              contract.is_active ? "active" : "inactive"
            }`}
          >
            {contract.is_active ? "active" : "inactive"}
          </span>
        </div>

        <div className="detail-item">
          <span className="label">Customer:</span>
          <span className="value">
            {`${contract.customer_details?.user_details?.first_name || ""} ${
              contract.customer_details?.user_details?.last_name || ""
            }`.trim() || "N/A"}
          </span>
        </div>

        {/* Address details */}
        <div className="detail-item">
          <span className="label">Address:</span>
          <span className="value">
            {contract.address_details ? (
              <>
                {contract.address_details.street}{" "}
                {contract.address_details.building}
                {contract.address_details.apartment
                  ? `, apt. ${contract.address_details.apartment}`
                  : ""}
                , {contract.address_details.city},{" "}
                {contract.address_details.region_name}
              </>
            ) : (
              "N/A"
            )}
          </span>
        </div>

        {/* Service details */}
        <div className="detail-item">
          <span className="label">Service:</span>
          <span className="value">
            {contract.service_details?.name || "N/A"}
            {contract.service_details?.description && (
              <span className="service-description">
                {" "}
                - {contract.service_details.description}
              </span>
            )}
          </span>
        </div>

        <div className="detail-item">
          <span className="label">Tariff:</span>
          <span className="value">
            {contract.tariff_details?.name || "N/A"}
            {contract.tariff_details?.price && (
              <span className="tariff-price">
                {" "}
                - ${contract.tariff_details.price}
              </span>
            )}
          </span>
        </div>

        {/* Display related equipment if available */}
        {contract.equipment && contract.equipment.length > 0 && (
          <div className="equipment-section">
            <h3>Equipment</h3>
            <ul className="equipment-list">
              {contract.equipment.map((item) => (
                <li key={item.id} className="equipment-item">
                  {item.name} - {item.serial_number || "No S/N"}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="contract-actions">
        <button
          className="action-button export"
          onClick={async () => {
            try {
              const token = localStorage.getItem("token"); // or however you store your token
              const response = await api.get(
                `/contracts/${contract.id}/export_pdf/`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                  responseType: "blob",
                }
              );

              const url = window.URL.createObjectURL(new Blob([response.data]));
              const a = document.createElement("a");
              a.href = url;
              a.download = `contract-${contract.id}.pdf`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              a.remove();
            } catch (error) {
              console.error("Error downloading PDF:", error);
              // Optional: display a toast or message
            }
          }}
        >
          Export PDF
        </button>
      </div>
    </div>
  );
};

export default ContractDetails;
