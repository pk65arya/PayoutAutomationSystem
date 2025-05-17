// Mentor Dashboard Component
function MentorDashboard() {
  const { user } = React.useContext(AuthContext);
  const [activeTab, setActiveTab] = React.useState("sessions");
  const [sessions, setSessions] = React.useState([]);
  const [payments, setPayments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  // Fetch data on component mount
  React.useEffect(() => {
    fetchData();
  }, []);

  // Function to fetch mentor data
  const fetchData = async () => {
    setLoading(true);
    setError("");

    console.log("Mentor Dashboard: Fetching data for user ID:", user?.id);

    if (!user || !user.id) {
      console.error("User ID is missing or invalid:", user);
      setError("User information is missing. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      // Fetch sessions and payments in parallel
      console.log("Sending API requests for mentor data...");

      const [sessionsRes, paymentsRes] = await Promise.all([
        axios.get(`/api/sessions/mentor/${user.id}`),
        axios.get(`/api/payments/mentor/${user.id}`),
      ]);

      console.log(
        "Mentor sessions received:",
        sessionsRes.data.length,
        "sessions"
      );
      console.log(
        "Mentor payments received:",
        paymentsRes.data.length,
        "payments"
      );

      setSessions(sessionsRes.data);
      setPayments(paymentsRes.data);

      console.log("Mentor dashboard data loaded successfully");
    } catch (err) {
      console.error(
        "Mentor dashboard fetch error:",
        err.response?.status,
        err.response?.data || err.message
      );
      setError(
        `Failed to fetch data: ${err.response?.status || ""} ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white shadow mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                {/* EdTech Logo */}
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-indigo-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  <span className="ml-2 text-xl font-bold text-indigo-600 tracking-tight">
                    EdTech
                  </span>
                </div>
                <span className="ml-3 text-xl font-semibold text-gray-800">
                  Mentor Portal
                </span>
              </div>

              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                <div className="flex space-x-1">
                  <button
                    onClick={() => setActiveTab("sessions")}
                    className={`${
                      activeTab === "sessions"
                        ? "bg-indigo-100 text-indigo-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    } px-4 py-2 rounded-md text-sm font-medium flex items-center`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 mr-1 ${
                        activeTab === "sessions"
                          ? "text-indigo-600"
                          : "text-gray-500"
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    My Sessions
                  </button>

                  <button
                    onClick={() => setActiveTab("payments")}
                    className={`${
                      activeTab === "payments"
                        ? "bg-indigo-100 text-indigo-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    } px-4 py-2 rounded-md text-sm font-medium flex items-center`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 mr-1 ${
                        activeTab === "payments"
                          ? "text-indigo-600"
                          : "text-gray-500"
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                      <path
                        fillRule="evenodd"
                        d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    My Payments
                  </button>

                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`${
                      activeTab === "profile"
                        ? "bg-indigo-100 text-indigo-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    } px-4 py-2 rounded-md text-sm font-medium flex items-center`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 mr-1 ${
                        activeTab === "profile"
                          ? "text-indigo-600"
                          : "text-gray-500"
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    My Profile
                  </button>

                  <button
                    onClick={() => setActiveTab("messages")}
                    className={`${
                      activeTab === "messages"
                        ? "bg-indigo-100 text-indigo-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    } px-4 py-2 rounded-md text-sm font-medium flex items-center`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 mr-1 ${
                        activeTab === "messages"
                          ? "text-indigo-600"
                          : "text-gray-500"
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Messages
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <button
                onClick={fetchData}
                className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 p-4 rounded-md max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {activeTab === "sessions" && <MentorSessionsTab sessions={sessions} />}

        {activeTab === "payments" && <MentorPaymentsTab payments={payments} />}

        {activeTab === "profile" && <MentorProfileTab user={user} />}

        {activeTab === "messages" && <MentorMessagesTab user={user} />}
      </div>
    </div>
  );
}

// Mentor Sessions Tab Component
function MentorSessionsTab({ sessions }) {
  const [selectedStatus, setSelectedStatus] = React.useState("ALL");

  // Filter sessions based on selected status
  const filteredSessions =
    selectedStatus === "ALL"
      ? sessions
      : sessions.filter((session) => session.status === selectedStatus);

  // Helper function to format duration from different possible formats
  const formatDuration = (duration) => {
    if (typeof duration === "object" && duration.seconds) {
      return Math.floor(duration.seconds / 60) + " mins";
    } else if (typeof duration === "string" && duration.startsWith("PT")) {
      // Handle PT format (ISO duration)
      return duration.replace(/PT(\d+)M.*/, "$1") + " mins";
    } else if (typeof duration === "number") {
      return duration + " mins";
    } else {
      console.warn("Unknown duration format:", duration);
      return "N/A";
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">My Sessions</h2>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="ALL">All Sessions</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="PAID">Paid</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Type
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Duration
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Rate
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Amount
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSessions.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No sessions found
                </td>
              </tr>
            ) : (
              filteredSessions.map((session) => (
                <tr key={session.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {session.sessionType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDuration(session.duration)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{session.hourlyRate}/hr
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(session.sessionDateTime).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{session.finalPayoutAmount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${
                        session.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : session.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : session.status === "PAID"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {session.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Mentor Payments Tab Component
function MentorPaymentsTab({ payments }) {
  const [showReceiptModal, setShowReceiptModal] = React.useState(false);
  const [activePayment, setActivePayment] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // Function to view receipt
  const handleViewReceipt = async (payment) => {
    try {
      setLoading(true);
      setError("");

      // Get fresh token to ensure we're using the most up-to-date one
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token is missing. Please login again.");
        setLoading(false);
        return;
      }

      // Get payment details if needed
      let paymentDetails = payment;
      if (!payment.sessions) {
        // Fetch payment details with sessions if not already included
        try {
          const response = await axios.get(`/api/payments/${payment.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          paymentDetails = response.data;
        } catch (err) {
          console.error("Error fetching payment details:", err);

          // Handle authentication errors
          if (err.response && err.response.status === 401) {
            setError("Authentication failed. Please log in again.");
            setLoading(false);
            return;
          }

          throw err;
        }
      }

      // Calculate tax breakdowns if not provided
      if (!paymentDetails.gstAmount) {
        paymentDetails = {
          ...paymentDetails,
          gstAmount: (
            parseFloat(paymentDetails.totalAmount || 0) * 0.18
          ).toFixed(2),
          platformFee: (
            parseFloat(paymentDetails.totalAmount || 0) * 0.05
          ).toFixed(2),
          netAmount: (
            parseFloat(paymentDetails.totalAmount || 0) * 0.77
          ).toFixed(2),
        };
      }

      // Set active payment for the receipt
      setActivePayment(paymentDetails);
      // Open the receipt modal
      setShowReceiptModal(true);
    } catch (err) {
      console.error("Error viewing receipt:", err);
      setError(
        "Failed to view receipt: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">My Payments</h2>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Payment Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Amount
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Transaction ID
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Receipt
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No payments found
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payment.paymentDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{payment.totalAmount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.transactionId || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${
                        payment.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : payment.status === "COMPLETED"
                          ? "bg-green-100 text-green-800"
                          : payment.status === "FAILED"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewReceipt(payment)}
                      className="text-indigo-600 hover:text-indigo-900 mr-2"
                    >
                      View Receipt
                    </button>
                    {payment.receiptUrl && (
                      <a
                        href={payment.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Download
                      </a>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && activePayment && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-2xl w-full mx-4 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-md font-medium">Payment Receipt</h3>
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setActivePayment(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Receipt Content */}
            <div className="border rounded-lg p-3 mb-3 bg-gray-50 text-sm">
              <div className="flex justify-between border-b pb-2 mb-2">
                <div>
                  <h4 className="text-lg font-bold">EdTech Payout System</h4>
                  <p className="text-xs text-gray-500">
                    support@edtech-payout.com
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">
                    Receipt #{activePayment.id}
                  </p>
                  <p className="text-xs">
                    {new Date(activePayment.paymentDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Sessions section */}
              <div className="mb-2">
                <h5 className="font-semibold text-xs mb-1">Sessions</h5>
                <div className="max-h-32 overflow-y-auto border border-gray-100 rounded">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-1 py-1 text-left text-xs font-medium text-gray-500">
                          Date
                        </th>
                        <th className="px-1 py-1 text-left text-xs font-medium text-gray-500">
                          Type
                        </th>
                        <th className="px-1 py-1 text-left text-xs font-medium text-gray-500">
                          Duration
                        </th>
                        <th className="px-1 py-1 text-right text-xs font-medium text-gray-500">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(activePayment.sessions || []).map((session) => (
                        <tr key={session.id || Math.random()}>
                          <td className="px-1 py-1 text-xs">
                            {session.sessionDateTime
                              ? new Date(
                                  session.sessionDateTime
                                ).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="px-1 py-1 text-xs">
                            {session.sessionType || "N/A"}
                          </td>
                          <td className="px-1 py-1 text-xs">
                            {typeof session.duration === "object" &&
                            session.duration &&
                            session.duration.seconds
                              ? Math.floor(session.duration.seconds / 60) +
                                " mins"
                              : typeof session.duration === "string" &&
                                session.duration &&
                                session.duration.startsWith("PT")
                              ? session.duration.replace(/PT(\d+)M/, "$1") +
                                " mins"
                              : typeof session.duration === "number"
                              ? session.duration + " mins"
                              : "Unknown"}
                          </td>
                          <td className="px-1 py-1 text-xs text-right">
                            ₹{session.finalPayoutAmount || 0}
                          </td>
                        </tr>
                      ))}
                      {(!activePayment.sessions ||
                        activePayment.sessions.length === 0) && (
                        <tr>
                          <td
                            colSpan="4"
                            className="px-1 py-1 text-xs text-center"
                          >
                            No session details available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="border-t pt-2">
                <div className="flex justify-between mb-1 text-xs">
                  <span>Subtotal</span>
                  <span>₹{activePayment.totalAmount}</span>
                </div>
                <div className="flex justify-between mb-1 text-xs">
                  <span>Platform Fee (5%)</span>
                  <span>-₹{activePayment.platformFee}</span>
                </div>
                <div className="flex justify-between mb-1 text-xs">
                  <span>GST (18%)</span>
                  <span>-₹{activePayment.gstAmount}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t text-sm">
                  <span>Net Amount</span>
                  <span>₹{activePayment.netAmount}</span>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  <p>
                    Payment Status:{" "}
                    <span className="font-semibold">
                      {activePayment.status}
                    </span>
                  </p>
                  {activePayment.transactionId && (
                    <p>
                      Transaction ID:{" "}
                      <span className="font-semibold">
                        {activePayment.transactionId}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Print
              </button>
              {activePayment.receiptUrl && (
                <a
                  href={activePayment.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Download
                </a>
              )}
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setActivePayment(null);
                }}
                className="px-3 py-1 bg-indigo-600 text-white rounded-md text-xs font-medium hover:bg-indigo-700"
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

// Mentor Profile Tab Component
function MentorProfileTab({ user }) {
  const [formData, setFormData] = React.useState({
    fullName: user.fullName || "",
    email: user.email || "",
    phoneNumber: user.phoneNumber || "",
    bankName: user.bankName || "",
    accountNumber: user.accountNumber || "",
    accountHolderName: user.accountHolderName || "",
    ifscCode: user.ifscCode || "",
    branchName: user.branchName || "",
    swiftCode: user.swiftCode || "",
    accountType: user.accountType || "",
    taxIdentificationNumber: user.taxIdentificationNumber || "",
  });
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState("");
  const [error, setError] = React.useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");

    try {
      // Get the authentication token from localStorage
      const token = localStorage.getItem("token");

      // Add explicit authorization header with Bearer token
      await axios.put(`/api/users/${user.id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setSuccess("Profile updated successfully!");
      console.log("Profile update successful");
    } catch (err) {
      console.error("Profile update error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to update profile. Please try again."
      );

      // If it's an authentication error, provide more helpful message
      if (err.response && err.response.status === 401) {
        setError(
          "Authentication error. Please log out and log in again to update your profile."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">My Profile</h2>
      </div>

      {success && (
        <div className="mb-4 bg-green-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-gray-700"
          >
            Full Name
          </label>
          <div className="mt-1">
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              value={formData.fullName}
              onChange={handleChange}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="phoneNumber"
            className="block text-sm font-medium text-gray-700"
          >
            Phone Number
          </label>
          <div className="mt-1">
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="text"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Bank Account Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="accountHolderName"
                className="block text-sm font-medium text-gray-700"
              >
                Account Holder Name
              </label>
              <div className="mt-1">
                <input
                  id="accountHolderName"
                  name="accountHolderName"
                  type="text"
                  value={formData.accountHolderName}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter account holder name"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="accountNumber"
                className="block text-sm font-medium text-gray-700"
              >
                Account Number
              </label>
              <div className="mt-1">
                <input
                  id="accountNumber"
                  name="accountNumber"
                  type="text"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter account number"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="bankName"
                className="block text-sm font-medium text-gray-700"
              >
                Bank Name
              </label>
              <div className="mt-1">
                <input
                  id="bankName"
                  name="bankName"
                  type="text"
                  value={formData.bankName}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter bank name"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="ifscCode"
                className="block text-sm font-medium text-gray-700"
              >
                IFSC Code
              </label>
              <div className="mt-1">
                <input
                  id="ifscCode"
                  name="ifscCode"
                  type="text"
                  value={formData.ifscCode}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter IFSC code"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="branchName"
                className="block text-sm font-medium text-gray-700"
              >
                Branch Name
              </label>
              <div className="mt-1">
                <input
                  id="branchName"
                  name="branchName"
                  type="text"
                  value={formData.branchName}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter branch name"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="accountType"
                className="block text-sm font-medium text-gray-700"
              >
                Account Type
              </label>
              <div className="mt-1">
                <select
                  id="accountType"
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Select Account Type</option>
                  <option value="SAVINGS">Savings</option>
                  <option value="CURRENT">Current</option>
                  <option value="SALARY">Salary</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="swiftCode"
                className="block text-sm font-medium text-gray-700"
              >
                SWIFT Code (International Transfers)
              </label>
              <div className="mt-1">
                <input
                  id="swiftCode"
                  name="swiftCode"
                  type="text"
                  value={formData.swiftCode}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Optional - for international transfers"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="taxIdentificationNumber"
            className="block text-sm font-medium text-gray-700"
          >
            Tax Identification Number
          </label>
          <div className="mt-1">
            <input
              id="taxIdentificationNumber"
              name="taxIdentificationNumber"
              type="text"
              value={formData.taxIdentificationNumber}
              onChange={handleChange}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Mentor Messages Tab Component - Identical to Admin's implementation
function MentorMessagesTab({ user }) {
  const [conversations, setConversations] = React.useState([]);
  const [messages, setMessages] = React.useState([]);
  const [activeUser, setActiveUser] = React.useState(null);
  const [newMessage, setNewMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showAdminModal, setShowAdminModal] = React.useState(false);
  const [availableAdmins, setAvailableAdmins] = React.useState([]);
  const [selectedAdminId, setSelectedAdminId] = React.useState("");
  const [modalMounted, setModalMounted] = React.useState(false);

  // Ref for the modal element
  const modalRef = React.useRef(null);

  // Add state for tracking scroll position
  const [showScrollBottom, setShowScrollBottom] = React.useState(false);
  const messagesEndRef = React.useRef(null);

  // Add scroll event handler to the messages container
  React.useEffect(() => {
    const handleScroll = () => {
      const container = document.querySelector(".messages-container");
      if (container) {
        // Show button if user scrolled up more than 100px from bottom
        const isScrolledUp =
          container.scrollHeight -
            container.clientHeight -
            container.scrollTop >
          100;
        setShowScrollBottom(isScrolledUp);
      }
    };

    const container = document.querySelector(".messages-container");
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [messages, activeUser]);

  // Helper function to get authenticated axios instance
  const getAuthenticatedAxios = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No authentication token found");
      throw new Error("You are not logged in. Please log in and try again.");
    }

    return {
      get: (url, config = {}) =>
        axios.get(url, {
          ...config,
          headers: {
            ...config.headers,
            Authorization: `Bearer ${token}`,
          },
        }),
      post: (url, data, config = {}) =>
        axios.post(url, data, {
          ...config,
          headers: {
            ...config.headers,
            Authorization: `Bearer ${token}`,
          },
        }),
      put: (url, data, config = {}) =>
        axios.put(url, data, {
          ...config,
          headers: {
            ...config.headers,
            Authorization: `Bearer ${token}`,
          },
        }),
      delete: (url, config = {}) =>
        axios.delete(url, {
          ...config,
          headers: {
            ...config.headers,
            Authorization: `Bearer ${token}`,
          },
        }),
    };
  };

  // Fetch conversations on component mount
  React.useEffect(() => {
    console.log("MentorMessagesTab mounted, fetching conversations");
    fetchConversations();

    // Setup periodic refresh of conversations
    const intervalId = setInterval(() => {
      console.log("Refreshing conversations...");
      fetchConversations(false);
    }, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, []);

  // Log when conversations change
  React.useEffect(() => {
    console.log("Conversations updated:", conversations);

    // Auto-select the first conversation if none is active
    if (conversations.length > 0 && !activeUser) {
      console.log("Auto-selecting first conversation");
      setActiveUser(conversations[0]);
    }
  }, [conversations]);

  // Fetch messages when an active user is selected
  React.useEffect(() => {
    if (activeUser) {
      console.log(
        "Active user changed, fetching messages for:",
        activeUser.username
      );
      fetchMessages(activeUser.id);
    }
  }, [activeUser]);

  // Handle modal visibility with event listeners
  React.useEffect(() => {
    if (showAdminModal && !modalMounted) {
      console.log("Modal opened, adding event listeners");
      document.body.style.overflow = "hidden"; // Prevent background scrolling
      setModalMounted(true);

      // Add click outside handler
      const handleClickOutside = (event) => {
        if (modalRef.current && !modalRef.current.contains(event.target)) {
          console.log("Click outside modal detected");
          setShowAdminModal(false);
        }
      };

      // Add escape key handler
      const handleEscKey = (event) => {
        if (event.key === "Escape") {
          console.log("Escape key detected");
          setShowAdminModal(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscKey);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscKey);
      };
    } else if (!showAdminModal && modalMounted) {
      document.body.style.overflow = "auto"; // Restore scrolling
      setModalMounted(false);
    }
  }, [showAdminModal, modalMounted]);

  // Fetch conversations
  const fetchConversations = async (showLoadingState = true) => {
    if (showLoadingState) {
      setLoading(true);
    }
    try {
      console.log("Fetching conversations...");

      const authAxios = getAuthenticatedAxios();
      const response = await authAxios.get("/api/messages/conversations");

      console.log("Conversations received:", response.data);

      if (response.data && Array.isArray(response.data)) {
        setConversations(response.data);

        // If there are conversations but no active user, set the first one as active
        if (response.data.length > 0 && !activeUser) {
          console.log(
            "Setting first conversation as active:",
            response.data[0]
          );
          setActiveUser(response.data[0]);
        }
      } else {
        console.error(
          "Invalid response format for conversations:",
          response.data
        );
        setError("Invalid response format for conversations");
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
      console.error("Error details:", err.response || err);
      setError(
        "Failed to load conversations: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      if (showLoadingState) {
        setLoading(false);
      }
    }
  };

  // Fetch admin users for potential conversations
  const fetchAdminUsers = async () => {
    try {
      console.log("Fetching admin users...");

      const authAxios = getAuthenticatedAxios();
      console.log("Making authenticated request to /api/users/admins");
      const response = await authAxios.get("/api/users/admins");

      console.log(`Admin API response status: ${response.status}`);

      const data = response.data;
      console.log("Admin users API response:", data);

      if (!data || !Array.isArray(data)) {
        console.error("Invalid admin users response format:", typeof data);
        throw new Error("Server returned invalid data format");
      }

      console.log(`Found ${data.length} admin users`);

      // Log each admin for debugging
      data.forEach((admin, index) => {
        console.log(`Admin ${index + 1}: ${admin.username}, ID: ${admin.id}`);
      });

      setAvailableAdmins(data);
      return data;
    } catch (err) {
      console.error("Error fetching admin users:", err);
      setError(`Failed to load administrators: ${err.message}`);
      return [];
    }
  };

  // Start a new conversation - show modal to select admin
  const startNewConversation = async () => {
    console.log("Starting new conversation - opening modal");
    setError(""); // Clear any previous errors

    try {
      // Show loading state
      setLoading(true);

      // Clear any existing admins in state before fetching
      setAvailableAdmins([]);

      // Reset selected admin
      setSelectedAdminId("");

      console.log("Fetching admin users...");
      const admins = await fetchAdminUsers();

      if (admins && admins.length > 0) {
        console.log(
          "Opening admin selection modal with",
          admins.length,
          "admins"
        );

        // Show the modal
        setShowAdminModal(true);

        // Focus on the select element after modal appears
        setTimeout(() => {
          if (modalRef.current) {
            const selectElement = modalRef.current.querySelector("select");
            if (selectElement) {
              selectElement.focus();
              console.log("Modal select focused");
            }
          }
        }, 100);
      } else {
        setError(
          "No administrators are available to message. Please try again later or contact support."
        );
      }
    } catch (err) {
      console.error("Error in startNewConversation:", err);
      setError("Failed to start conversation: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle admin selection from modal
  const handleSelectAdmin = () => {
    console.log("Admin selected button clicked");

    if (!selectedAdminId) {
      console.error("No admin selected");
      setError("Please select an administrator to message");
      return;
    }

    try {
      console.log("Processing admin selection, ID:", selectedAdminId);

      // Convert to number to ensure proper comparison
      const adminId = parseInt(selectedAdminId);
      console.log("Parsed admin ID:", adminId);

      // Find the selected admin in the available admins list
      const selectedAdmin = availableAdmins.find(
        (admin) => admin.id === adminId
      );

      if (!selectedAdmin) {
        console.error("Selected admin not found in available admins list");
        console.log("Available admins:", availableAdmins);
        setError("Selected administrator not found");
        return;
      }

      console.log("Selected admin found:", selectedAdmin);

      // First close the modal
      setShowAdminModal(false);

      // Add to conversations if not already present
      setConversations((prevConversations) => {
        // Check if admin already exists in conversations
        if (!prevConversations.some((c) => c.id === selectedAdmin.id)) {
          console.log("Adding admin to conversations list");
          return [...prevConversations, selectedAdmin];
        }
        return prevConversations;
      });

      // Set as active user with a slight delay to ensure state updates properly
      setTimeout(() => {
        console.log("Setting active user:", selectedAdmin);
        setActiveUser(selectedAdmin);
        setSelectedAdminId("");
      }, 100);
    } catch (err) {
      console.error("Error in handleSelectAdmin:", err);
      setError("Error selecting admin: " + err.message);
    }
  };

  // Close the modal
  const closeModal = () => {
    console.log("Closing admin selection modal");
    setShowAdminModal(false);
    setSelectedAdminId("");
  };

  // Add this helper function at the top of the MentorMessagesTab component
  const scrollToBottom = () => {
    setTimeout(() => {
      const messagesContainer = document.querySelector(".messages-container");
      if (messagesContainer) {
        try {
          // First try scrolling to the bottom with modern method
          messagesContainer.scrollTo({
            top: messagesContainer.scrollHeight,
            behavior: "smooth",
          });

          // Fallback to older method for wider compatibility
          setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            console.log(
              "Scrolled messages to bottom, height:",
              messagesContainer.scrollHeight
            );
          }, 50);
        } catch (e) {
          // Fallback for any errors
          console.error("Error scrolling:", e);
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }
    }, 150); // Slight delay to ensure DOM is updated
  };

  // Update fetchMessages to use scrollToBottom
  const fetchMessages = async (userId) => {
    setLoading(true);
    try {
      console.log(`Fetching messages for conversation with user ID: ${userId}`);

      // Clear any existing error
      setError("");

      const authAxios = getAuthenticatedAxios();
      // Make API call
      const response = await authAxios.get(
        `/api/messages/conversation/${userId}`
      );
      console.log("Messages received:", response.data);
      console.log("Total messages count:", response.data?.length || 0);

      if (response.data && Array.isArray(response.data)) {
        // Log each message for debugging
        response.data.forEach((msg, index) => {
          console.log(
            `Message ${index + 1} - ID: ${msg.id}, From: ${
              msg.sender.username
            } to ${msg.recipient.username}, Content: "${msg.content.substring(
              0,
              30
            )}${msg.content.length > 30 ? "..." : ""}"`
          );
        });

        // Set all messages without filtering
        setMessages(response.data);

        // Scroll to bottom after messages are loaded
        scrollToBottom();
      } else {
        console.error("Invalid message format received:", response.data);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      console.error("Error details:", err.response || err);
      setError(
        "Failed to load messages: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // Update sendMessage function to use scrollToBottom
  const sendMessage = async () => {
    // Validate input
    if (!newMessage.trim()) {
      console.warn("Empty message, not sending");
      return;
    }

    if (!activeUser || !activeUser.id) {
      console.error("No active recipient selected");
      setError("Please select a recipient first");
      return;
    }

    // Show loading state
    setLoading(true);

    try {
      console.log("SENDING MESSAGE:");
      console.log(
        "- To: " + activeUser.username + " (ID: " + activeUser.id + ")"
      );
      console.log("- Content: " + newMessage);

      // Build request body
      const requestBody = {
        recipient: {
          id: Number(activeUser.id),
        },
        content: newMessage,
        sentAt: new Date().toISOString(),
      };

      console.log("Request payload:", JSON.stringify(requestBody));

      const authAxios = getAuthenticatedAxios();
      // Make API call
      const response = await authAxios.post("/api/messages", requestBody);

      const data = response.data;
      console.log("Message sent successfully:", data);

      // Update UI
      setMessages((prev) => [...prev, data]);
      setNewMessage("");

      // Scroll to bottom after sending a message
      scrollToBottom();
    } catch (error) {
      console.error("Failed to send message:", error);
      setError("Failed to send message: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
        <div className="flex space-x-2">
          <button
            onClick={async () => {
              try {
                console.log("Running message system diagnostics...");
                setError("");
                setLoading(true);

                const authAxios = getAuthenticatedAxios();
                const response = await authAxios.get("/api/messages/debug");
                console.log("Diagnostic data:", response.data);

                // Display readable diagnostic info
                const diagnosticInfo = response.data;
                let debugMsg = `User: ${diagnosticInfo.currentUser?.username}\n`;
                debugMsg += `Messages sent: ${diagnosticInfo.messageStats?.sentCount}, received: ${diagnosticInfo.messageStats?.receivedCount}\n`;
                debugMsg += `Conversations: ${diagnosticInfo.conversationCount}\n`;

                if (diagnosticInfo.conversations?.length > 0) {
                  debugMsg += "Conversation details:\n";
                  diagnosticInfo.conversations.forEach((c) => {
                    debugMsg += `- ${c.username} (${c.messageCount} messages)\n`;
                  });
                } else {
                  debugMsg += "No conversations found\n";
                }

                alert("Diagnostic Results:\n\n" + debugMsg);

                // Force refresh conversations
                fetchConversations();
              } catch (err) {
                console.error("Diagnostics error:", err);
                setError(
                  `Diagnostics failed: ${
                    err.response?.data?.message || err.message
                  }`
                );
              } finally {
                setLoading(false);
              }
            }}
            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            Debug
          </button>

          <button
            onClick={async () => {
              try {
                console.log("Sending test message...");
                setError("");
                setLoading(true);

                const authAxios = getAuthenticatedAxios();

                // If active user exists, use it as recipient, otherwise let the backend choose
                const params = activeUser ? { recipientId: activeUser.id } : {};
                const response = await authAxios.post(
                  "/api/messages/test-message",
                  null,
                  {
                    params: params,
                  }
                );

                console.log("Test message response:", response.data);

                if (response.data.success) {
                  // Show success message
                  alert(
                    `Test message sent successfully to ${
                      activeUser ? activeUser.username : "a recipient"
                    }`
                  );
                } else {
                  console.error("Test message failed");
                  setError("Test message failed");
                }
              } catch (err) {
                console.error("Test message error:", err);
                setError("Failed to send test message: " + err.message);
              } finally {
                setLoading(false);
              }
            }}
            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            Test Message
          </button>

          <button
            onClick={() => {
              try {
                console.log("Refreshing data...");
                setError("");
                setLoading(true);

                // Refresh conversations
                fetchConversations();

                // If there's an active user, refresh messages too
                if (activeUser) {
                  fetchMessages(activeUser.id);
                }

                console.log("Refresh complete");
              } catch (err) {
                console.error("Refresh error:", err);
                setError("Failed to refresh: " + err.message);
              } finally {
                setLoading(false);
              }
            }}
            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>

          <button
            onClick={startNewConversation}
            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Message
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {loading && !activeUser ? (
        <div className="flex justify-center my-8">
          <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-10 w-10"></div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No conversations yet.</p>
              <button
                onClick={startNewConversation}
                className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Start New Conversation
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 h-96">
              {/* Conversation list */}
              <div className="col-span-1 border-r overflow-y-auto">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setActiveUser(conv)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      activeUser?.id === conv.id ? "bg-indigo-50" : ""
                    }`}
                  >
                    <p className="font-medium">
                      {conv.fullName || conv.username}
                    </p>
                    <p className="text-sm text-gray-500">{conv.email}</p>
                    {conv.roles &&
                      conv.roles.some(
                        (role) =>
                          (typeof role === "string" && role === "ROLE_ADMIN") ||
                          (typeof role === "object" &&
                            role.name === "ROLE_ADMIN")
                      ) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Admin
                        </span>
                      )}
                  </div>
                ))}
              </div>

              {/* Message area */}
              <div className="col-span-2 flex flex-col h-full">
                {activeUser ? (
                  <>
                    <div className="p-4 border-b">
                      <h3 className="font-medium">
                        {activeUser.fullName || activeUser.username}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {activeUser.email}
                      </p>
                    </div>

                    {/* Fixed height message container with overflow */}
                    <div className="flex-1 flex flex-col h-full relative">
                      <div
                        className="flex-1 p-4 overflow-y-auto messages-container scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                        style={{
                          height: "calc(100% - 70px)",
                          minHeight: "200px",
                          maxHeight: "350px",
                          overflowY: "auto",
                          paddingBottom: "40px",
                        }}
                      >
                        {loading ? (
                          <div className="flex justify-center items-center h-full">
                            <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-10 w-10"></div>
                          </div>
                        ) : messages.length === 0 ? (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-center text-gray-500">
                              No messages yet. Send a message to start the
                              conversation.
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col space-y-3 pb-2">
                            {messages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`mb-4 max-w-xs p-3 rounded-lg ${
                                  msg.sender.id === user.id
                                    ? "ml-auto bg-indigo-100"
                                    : "bg-gray-100"
                                }`}
                                title={`Message ID: ${msg.id}`}
                              >
                                <p className="text-sm font-semibold mb-1">
                                  {msg.sender.id === user.id
                                    ? "You"
                                    : msg.sender.username}
                                </p>
                                <p className="text-sm whitespace-pre-wrap">
                                  {msg.content}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(msg.sentAt).toLocaleString()}
                                </p>
                              </div>
                            ))}
                            {/* Add extra space at bottom to prevent last message being hidden */}
                            <div
                              ref={messagesEndRef}
                              style={{ marginBottom: "30px" }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Scroll to bottom button */}
                      {showScrollBottom && (
                        <button
                          onClick={scrollToBottom}
                          className="absolute bottom-20 right-4 bg-indigo-600 text-white rounded-full h-10 w-10 flex items-center justify-center shadow-lg hover:bg-indigo-700 focus:outline-none"
                          aria-label="Scroll to bottom"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L10 15.586l5.293-5.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      )}

                      {/* Message input fixed at bottom */}
                      <div className="p-4 border-t sticky bottom-0 bg-white">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (newMessage.trim()) {
                              sendMessage();
                            }
                          }}
                          className="flex"
                        >
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                            disabled={loading}
                            autoFocus
                          />
                          <button
                            type="submit"
                            className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700 disabled:opacity-50"
                            disabled={!newMessage.trim() || loading}
                          >
                            {loading ? "Sending..." : "Send"}
                          </button>
                        </form>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">
                      Select a conversation to view messages
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin Selection Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" id="admin-modal">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            {/* Background overlay */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={closeModal}
            ></div>

            {/* Modal panel */}
            <div
              ref={modalRef}
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative"
            >
              {/* Modal header */}
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  New Message to Administrator
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Select an administrator to start a conversation.
                </p>

                {loading ? (
                  <div className="flex justify-center py-4">
                    <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-10 w-10"></div>
                  </div>
                ) : availableAdmins.length === 0 ? (
                  <div className="bg-yellow-50 p-4 rounded-md">
                    <p className="text-sm text-yellow-700">
                      No administrators are currently available. Please try
                      again later.
                    </p>
                  </div>
                ) : (
                  <div className="mt-2">
                    <select
                      value={selectedAdminId}
                      onChange={(e) => {
                        console.log(
                          "Admin selected in dropdown:",
                          e.target.value
                        );
                        setSelectedAdminId(e.target.value);
                      }}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="">-- Select an administrator --</option>
                      {availableAdmins.map((admin) => (
                        <option key={admin.id} value={admin.id}>
                          {admin.fullName || admin.username}
                          {admin.email ? ` (${admin.email})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => {
                    console.log("Start Conversation button clicked");
                    handleSelectAdmin();
                  }}
                  disabled={
                    !selectedAdminId || availableAdmins.length === 0 || loading
                  }
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Start Conversation"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
