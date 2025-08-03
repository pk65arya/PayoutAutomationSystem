
function StripePaymentModal({
  clientSecret,
  paymentId,
  amount,
  onSuccess,
  onCancel,
}) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [paymentComplete, setPaymentComplete] = React.useState(false);

  React.useEffect(() => {
   
    const initStripe = async () => {
      if (!window.Stripe) {
        console.error("Stripe.js not loaded");
        setError("Payment system unavailable. Please try again later.");
        return;
      }

      try {
        const stripe = window.Stripe("pk_test_sample_key"); 
        const elements = stripe.elements();

     
        const cardElement = elements.create("card");
        cardElement.mount("#card-element");

       
        const form = document.getElementById("payment-form");
        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          setLoading(true);
          setError("");

          try {
            const { error, paymentIntent } = await stripe.confirmCardPayment(
              clientSecret,
              {
                payment_method: {
                  card: cardElement,
                },
              }
            );

            if (error) {
              throw new Error(error.message);
            }

            
            console.log("Payment successful:", paymentIntent);
            setPaymentComplete(true);

           
            if (onSuccess) {
              onSuccess(paymentId, paymentIntent.id);
            }
          } catch (err) {
            console.error("Payment error:", err);
            setError(err.message || "Payment failed. Please try again.");
          } finally {
            setLoading(false);
          }
        });
      } catch (err) {
        console.error("Error initializing Stripe:", err);
        setError(
          "Failed to initialize payment system. Please try again later."
        );
      }
    };

    initStripe();
  }, [clientSecret, paymentId, onSuccess]);

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Process Payment</h3>
          <button
            onClick={onCancel}
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

        {paymentComplete ? (
          <div className="text-center py-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="mt-3 text-lg font-medium text-gray-900">
              Payment successful!
            </h3>
            <p className="mt-2 text-gray-500">
              The payment has been processed successfully.
            </p>
            <div className="mt-4">
              <button
                onClick={onCancel}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form id="payment-form" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Amount
              </label>
              <div className="text-lg font-bold">₹{amount}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Details
              </label>
              <div
                id="card-element"
                className="p-3 border border-gray-300 rounded-md shadow-sm"
              ></div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-sm text-red-700 rounded-md">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Pay Now"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}


function AdminDashboard() {
  const { user, logout, refreshAuth } = React.useContext(AuthContext);
  const [activeTab, setActiveTab] = React.useState("sessions");
  const [sessions, setSessions] = React.useState([]);
  const [mentors, setMentors] = React.useState([]);
  const [payments, setPayments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [showDebugInfo, setShowDebugInfo] = React.useState(false);
  const [paymentModalConfig, setPaymentModalConfig] = React.useState(null);
  const [filterMentorId, setFilterMentorId] = React.useState(null);
  const [conversations, setConversations] = React.useState([]);
  const [messages, setMessages] = React.useState([]);

  
  const [stripeModalOpen, setStripeModalOpen] = React.useState(false);
  const [stripePaymentData, setStripePaymentData] = React.useState(null);

 
  const [localSessions, setLocalSessions] = React.useState([]);

 
  React.useEffect(() => {
    if (paymentModalConfig) {
      handleCreatePaymentForMentor(
        paymentModalConfig.mentorId,
        paymentModalConfig.sessionIds
      );
     
      setPaymentModalConfig(null);
    }

    
    setLocalSessions(sessions);
  }, [paymentModalConfig, sessions]);


  React.useEffect(() => {
   
    window.createPaymentForSession = (mentorId, sessionIds) => {
      setActiveTab("payments");
      setPaymentModalConfig({ mentorId, sessionIds });
    };

 
    window.handleCreatePaymentForMentor = (mentorId, sessionIds) => {
      setActiveTab("payments");
      setPaymentModalConfig({ mentorId, sessionIds });
    };

    // Make refreshData globally available for child components
    window.adminDashboardRefreshData = refreshData;

    return () => {
      delete window.createPaymentForSession;
      delete window.handleCreatePaymentForMentor;
      delete window.adminDashboardRefreshData;
    };
  }, []);

 
  React.useEffect(() => {
   
    if (!user || !user.id) {
      console.error("AdminDashboard: No valid user found:", user);
      setError("Authentication error. Please log in again.");
      setLoading(false);
      return;
    }

    console.log("AdminDashboard: User authenticated as:", user.username);
    console.log("AdminDashboard: User roles:", user.roles);

    fetchData();

   
    const refreshInterval = setInterval(fetchData, 5 * 60 * 1000);
    // Set up a timer to refresh data more frequently (every 30 seconds)
    const refreshInterval = setInterval(() => {
      console.log("Running scheduled data refresh");
      refreshData();
    }, 30000);

  
    return () => clearInterval(refreshInterval);
  }, [user]);


  const handleApiError = async (err) => {
    console.error("API error:", err);

  
      err.message === "Authentication error" ||
      (err.response && err.response.status === 401)
    ) {
      console.log("Attempting to refresh authentication before giving up");

      try {
       
        const refreshSuccessful = await refreshAuth();

        if (refreshSuccessful) {
          console.log(
            "Authentication refreshed successfully, retrying operation"
          );
          return { handled: true, refreshed: true };
        }
      } catch (refreshError) {
        console.error("Failed to refresh authentication:", refreshError);
      }

     
      setError("Your session has expired. Please log in again.");

      
      setTimeout(() => {
        if (
          confirm("Your session has expired. Would you like to log in again?")
        ) {
          logout();
          window.location.href = "/";
        }
      }, 2000);

      return { handled: true, refreshed: false };
    }

    return { handled: false, refreshed: false };
  };

 
  const fetchData = async () => {
    setLoading(true);
    setError("");

    console.log("Admin Dashboard: Fetching data");

    try {
    
      console.log("Sending API requests...");

      const [sessionsRes, usersRes, paymentsRes] = await Promise.all([
        axios.get("/api/sessions"),
        axios.get("/api/users?paginate=true&size=1000"), // Use a large size to get all users/mentors
        axios.get("/api/payments"),
      ]);

      
      console.log("Raw users response structure:", usersRes.data);
      console.log("Raw sessions response structure:", sessionsRes.data);
      console.log("Raw payments response structure:", paymentsRes.data);

   
      let sessionsData = [];
      if (sessionsRes.data && typeof sessionsRes.data === "object") {
        sessionsData = sessionsRes.data.sessions || sessionsRes.data;
        if (!Array.isArray(sessionsData)) {
          console.warn("Sessions data is not an array, setting to empty array");
          sessionsData = [];
        }
      }
      console.log("Sessions data processed:", sessionsData.length, "sessions");

      let usersData = [];
      if (usersRes.data && typeof usersRes.data === "object") {
        // Check if we have a paginated response with users field
        if (usersRes.data.users && Array.isArray(usersRes.data.users)) {
          usersData = usersRes.data.users;
        }
       
        else if (Array.isArray(usersRes.data)) {
          usersData = usersRes.data;
        }
        
        else {
          console.warn(
            "Could not extract users array from response",
            usersRes.data
          );
        }
      }
      console.log("Users data processed:", usersData.length, "users");

      
      let paymentsData = [];
      if (paymentsRes.data && typeof paymentsRes.data === "object") {
        paymentsData = paymentsRes.data.payments || paymentsRes.data;
        if (!Array.isArray(paymentsData)) {
          console.warn("Payments data is not an array, setting to empty array");
          paymentsData = [];
        }
      }
      console.log("Payments data processed:", paymentsData.length, "payments");

      
      if (Array.isArray(usersData)) {
        const rolesSummary = usersData.map((user) => ({
          username: user.username,
          roles: user.roles,
        }));
        console.log("User roles:", rolesSummary);
      } else {
        console.warn("Cannot map user roles - usersData is not an array");
      }

      setSessions(sessionsData);

     
      let mentorsList = [];
      if (Array.isArray(usersData)) {
        mentorsList = usersData.filter((user) => {
         
          if (!user.roles || !Array.isArray(user.roles)) {
            console.warn(
              `User ${user.id} has invalid roles format:`,
              user.roles
            );
            return false;
          }

         
          const isMentor = user.roles.some((role) => {
            if (typeof role === "string") {
             
              return role === "ROLE_MENTOR" || role === "MENTOR";
            } else if (typeof role === "object" && role !== null) {
             
              return role.name === "ROLE_MENTOR" || role.name === "MENTOR";
            }
            return false;
          });

          return isMentor;
        });
      }

      console.log("Filtered mentors:", mentorsList.length, mentorsList);
      setMentors(mentorsList);
      setPayments(paymentsData);

      console.log("Admin dashboard data loaded successfully");
    } catch (err) {
    
      const { handled, refreshed } = await handleApiError(err);

      if (refreshed) {
       
        fetchData();
        return;
      }

      if (!handled) {
      
        console.error(
          "Admin dashboard fetch error:",
          err.response?.status,
          err.response?.data || err.message
        );
        setError(
          `Failed to fetch data: ${err.response?.status || ""} ${err.message}`
        );
      }
    } finally {
      setLoading(false);
    }
  };


  const refreshData = async () => {
    try {
      console.log("Refreshing all data...");
    
      const [sessionsRes, paymentsRes, mentorsRes] = await Promise.all([
        axios.get("/api/sessions"),
        axios.get("/api/payments"),
        axios.get("/api/users?role=MENTOR"),
      ]);

    
      let sessionsData = [];
      if (sessionsRes.data && typeof sessionsRes.data === "object") {
        sessionsData = sessionsRes.data.sessions || sessionsRes.data;
        if (!Array.isArray(sessionsData)) {
          console.warn("Sessions data is not an array during refresh");
          sessionsData = [];
        }
      }
      console.log(`Refreshed ${sessionsData.length} sessions`);

   
      let paymentsData = [];
      if (paymentsRes.data && typeof paymentsRes.data === "object") {
        paymentsData = paymentsRes.data.payments || paymentsRes.data;
        if (!Array.isArray(paymentsData)) {
          console.warn("Payments data is not an array during refresh");
          paymentsData = [];
        }
      }
      console.log(`Refreshed ${paymentsData.length} payments`);

      // Process mentors data
      let mentorsData = [];
      if (mentorsRes.data && typeof mentorsRes.data === "object") {
        mentorsData = mentorsRes.data.users || mentorsRes.data;
        if (!Array.isArray(mentorsData)) {
          console.warn("Mentors data is not an array during refresh");
          mentorsData = [];
        }
      }
      console.log(`Refreshed ${mentorsData.length} mentors`);

      // Update state with fresh data
      setSessions(sessionsData);
      setPayments(paymentsData);
      setMentors(mentorsData);

      return true;
    } catch (err) {
      console.error("Error refreshing data:", err);
      const { handled, refreshed } = await handleApiError(err);

      if (!handled) {
        setError(`Failed to refresh data: ${err.message}`);
      }

      return false;
    }
  };


  const handleSessionStatusUpdate = async (sessionId, newStatus) => {
    try {
      console.log(`Updating session ${sessionId} to status: ${newStatus}`);
      setLoading(true);

      const response = await axios.put(
        `/api/sessions/${sessionId}/status?status=${newStatus}`
      );
      console.log("Session status updated successfully:", response.data);

      
      await refreshData();

     
      setError("");
    } catch (err) {
      const { handled, refreshed } = await handleApiError(err);

      if (refreshed) {
     
        return handleSessionStatusUpdate(sessionId, newStatus);
      }

      if (!handled) {
        console.error(
          "Failed to update session status:",
          err.response?.data || err.message
        );
        setError(
          `Failed to update session status: ${
            err.response?.data?.message || err.message
          }`
        );
      }
    } finally {
      setLoading(false);
    }
  };

 
  const handleCreatePayment = async (mentorId, selectedSessions) => {
    try {
      console.log(
        `Creating payment for mentor ${mentorId} with selected sessions:`,
        selectedSessions
      );
      setLoading(true);

      if (!selectedSessions || selectedSessions.length === 0) {
        setError("No sessions selected for payment.");
        setLoading(false);
        return;
      }

     
      const mentor = mentors.find((m) => m.id === mentorId);
      if (!mentor) {
        setError("Selected mentor not found.");
        setLoading(false);
        return;
      }

     
      if (
        !mentor.bankName ||
        !mentor.accountNumber ||
        !mentor.accountHolderName
      ) {
        setError(
          "Mentor does not have complete bank details. Payment cannot be processed."
        );
        alert(
          "Bank details missing! The mentor needs to update their profile with complete bank information before payments can be processed."
        );
        setLoading(false);
        return;
      }

      console.log("Mentor bank details verified:", {
        bankName: mentor.bankName,
        accountHolder: mentor.accountHolderName,
        accountNumber: mentor.accountNumber
          ? `${mentor.accountNumber.substring(
              0,
              2
            )}...${mentor.accountNumber.substring(
              mentor.accountNumber.length - 4
            )}`
          : "missing",
      });

      const sessionsToPayFor = sessions.filter(
        (session) =>
          selectedSessions.includes(session.id) &&
          session.mentor.id === mentorId &&
          session.status === "APPROVED"
      );

      console.log("Filtered sessions to pay for:", sessionsToPayFor);

      if (sessionsToPayFor.length === 0) {
        setError(
          "No valid sessions selected for payment. Sessions must be in APPROVED status."
        );
        setLoading(false);
        return;
      }

      const totalAmount = sessionsToPayFor.reduce(
        (sum, session) => sum + parseFloat(session.finalPayoutAmount || 0),
        0
      );

      console.log("Calculated total amount:", totalAmount);

      const paymentData = {
        mentor: { id: mentorId },
        sessions: sessionsToPayFor.map((session) => ({ id: session.id })),
        totalAmount: totalAmount.toFixed(2),
        paymentDate: new Date().toISOString(),
        status: "PENDING",
      };

      console.log("Sending payment data:", paymentData);

     
      try {
        const pingResponse = await axios.get("/api/users");
        console.log(
          "API is reachable, users endpoint response:",
          pingResponse.status
        );
      } catch (pingError) {
        console.error("API might be unreachable:", pingError);
        setError("Cannot connect to the server. Please check your connection.");
        setLoading(false);
        return;
      }

  
      const response = await axios.post("/api/payments", paymentData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      console.log("Payment created successfully:", response.data);

     
      if (response.data && response.data.payment) {
 
        const { payment, clientSecret } = response.data;

        console.log("Payment ID:", payment.id);
        console.log("Client Secret:", clientSecret);

       
        setStripePaymentData({
          clientSecret,
          paymentId: payment.id,
          amount: payment.totalAmount,
        });

    
        setStripeModalOpen(true);
      } else {
       
        console.log("Using fallback payment handling");
        const payment = response.data;

       
        const confirmPayment = window.confirm(
          `Payment created successfully for ₹${payment.totalAmount}.\n\n` +
            `Would you like to process this payment now?`
        );

        if (confirmPayment) {
          await processPayment(
            payment.id,
            payment.transactionId || "direct_payment"
          );
        }
      }

    
      const [sessionsRes, paymentsRes] = await Promise.all([
        axios.get("/api/sessions"),
        axios.get("/api/payments"),
      ]);

      setSessions(sessionsRes.data.sessions || sessionsRes.data);
      setPayments(paymentsRes.data.payments || paymentsRes.data);

      setError("");
    } catch (err) {
      console.error("Failed to create payment:", err);

  
      if (err.response) {
       
        console.error("Error response data:", err.response.data);
        console.error("Error response status:", err.response.status);
        console.error("Error response headers:", err.response.headers);
      } else if (err.request) {
       
        console.error("Error request:", err.request);
      } else {
     
        console.error("Error message:", err.message);
      }

      setError(
        `Failed to create payment: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };


  const processPayment = async (paymentId, paymentIntentId) => {
    try {
      setLoading(true);
      console.log(
        `Processing payment ${paymentId} with intent ID: ${paymentIntentId}`
      );

    
      const response = await axios.post(
        `/api/payments/${paymentId}/process-stripe-payment?paymentIntentId=${paymentIntentId}`
      );

      console.log("Payment processed:", response.data);

   
      if (stripeModalOpen) {
        setStripeModalOpen(false);
        setStripePaymentData(null);
      }

   
      alert(`Payment processed successfully to mentor's bank account.`);

     
      await refreshData();
    } catch (err) {
      console.error(
        "Failed to process payment:",
        err.response?.data || err.message
      );
      setError(
        `Failed to process payment: ${
          err.response?.data?.message || err.message
        }`
      );

     
    } finally {
      setLoading(false);
    }
  };

 
  const handleUpdatePaymentStatus = async (paymentId, newStatus) => {
    try {
      console.log(`Updating payment ${paymentId} to status: ${newStatus}`);
      setLoading(true);

      const response = await axios.put(
        `/api/payments/${paymentId}/status?status=${newStatus}`
      );
      console.log("Payment status updated successfully:", response.data);

     
      const paymentsResponse = await axios.get("/api/payments");
      setPayments(paymentsResponse.data.payments || paymentsResponse.data);

      // Refresh the UI immediately instead of showing a signout message
      refreshData();

      setError("");
    } catch (err) {
      console.error(
        "Failed to update payment status:",
        err.response?.data || err.message
      );

      // Handle unauthorized (401) error silently by refreshing the data
      if (err.response && err.response.status === 401) {
        console.log(
          "Token may have expired. Attempting to recover by refreshing data..."
        );
        try {
          // Try to recover by refreshing data with current credentials
          await refreshData();

          // Try the operation again after refreshing
          const retryResponse = await axios.put(
            `/api/payments/${paymentId}/status?status=${newStatus}`
          );
          console.log(
            "Payment status updated successfully on retry:",
            retryResponse.data
          );

          // Refresh payments data after successful retry
          const paymentsResponse = await axios.get("/api/payments");
          setPayments(paymentsResponse.data.payments || paymentsResponse.data);
          setError("");
          return;
        } catch (retryErr) {
          console.error("Recovery attempt failed:", retryErr);
        }
      }

      setError(
        `Failed to update payment status: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

 
  const handleViewPaymentDetails = async (paymentId) => {
    try {
      console.log(`Viewing details for payment ${paymentId}`);
      const response = await axios.get(`/api/payments/${paymentId}`);
      console.log("Payment details:", response.data);

      
      alert(
        `Payment details for ID ${paymentId}:\n` +
          `Amount: ₹${response.data.totalAmount}\n` +
          `Date: ${new Date(
            response.data.paymentDate
          ).toLocaleDateString()}\n` +
          `Status: ${response.data.status}\n` +
          `Transaction ID: ${response.data.transactionId || "Not assigned yet"}`
      );
    } catch (err) {
      console.error(
        "Failed to fetch payment details:",
        err.response?.data || err.message
      );
      setError(
        `Failed to fetch payment details: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

 
  const displayAuthDebugInfo = async () => {
    try {
      setShowDebugInfo(true);
      const token = localStorage.getItem("token");
      const userData = JSON.parse(localStorage.getItem("user") || "{}");

      // Test token with users endpoint
      let usersAccessible = false;
      try {
        await axios.get("/api/users");
        usersAccessible = true;
      } catch (e) {
        console.error("Can't access /api/users:", e);
      }

  
      let sessionsAccessible = false;
      try {
        await axios.get("/api/sessions");
        sessionsAccessible = true;
      } catch (e) {
        console.error("Can't access /api/sessions:", e);
      }

    
      setError(`
        AUTH DEBUG:
        - Token exists: ${!!token}
        - Token prefix: ${token ? token.substring(0, 15) + "..." : "N/A"}
        - User ID: ${userData.id || "Not found"}
        - Username: ${userData.username || "Not found"}
        - Roles: ${JSON.stringify(userData.roles || [])}
        - Can access /api/users: ${usersAccessible ? "YES" : "NO"}
        - Can access /api/sessions: ${sessionsAccessible ? "YES" : "NO"}
        
        If you can't create sessions, you might not have admin privileges.
        Try logging out and logging in again with an admin account.
      `);
    } catch (err) {
      setError("Error during auth debug: " + err.message);
    }
  };

 
  const filterSessionsByMentor = (mentorId) => {
    setFilterMentorId(mentorId);
    setActiveTab("sessions");
  };


  const fetchConversations = async () => {
    try {
      setLoading(true);
      console.log("Fetching conversations for admin");
      const response = await axios.get("/api/messages/conversations");
      console.log("Admin conversations received:", response.data);

      
      if (!response.data) {
        console.warn("No data received from conversations API");
        setConversations([]);
      } else if (Array.isArray(response.data)) {
        
        const validatedConversations = response.data
          .filter((conv) => conv !== null)
          .map((conv) => {
            return {
              ...conv,
            
              participants: Array.isArray(conv.participants)
                ? conv.participants.filter((p) => p !== null)
                : [],
          
              id:
                conv.id ||
                `temp-${Math.random().toString(36).substring(2, 11)}`,
              lastMessage: conv.lastMessage || "",
              lastMessageTime: conv.lastMessageTime || null,
            };
          });
        console.log("Processed conversations:", validatedConversations);
        setConversations(validatedConversations);
      } else {
        console.warn("Unexpected data format received:", response.data);
        setConversations([]);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setError(
        "Failed to load conversations: " +
          (err.response?.data?.message || err.message)
      );
     
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="bg-white shadow">
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
                  Payout System
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
                    Sessions
                  </button>

                  <button
                    onClick={() => setActiveTab("mentors")}
                    className={`${
                      activeTab === "mentors"
                        ? "bg-indigo-100 text-indigo-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    } px-4 py-2 rounded-md text-sm font-medium flex items-center`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 mr-1 ${
                        activeTab === "mentors"
                          ? "text-indigo-600"
                          : "text-gray-500"
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    Mentors
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
                    Payments
                  </button>

                  <button
                    onClick={() => setActiveTab("reports")}
                    className={`${
                      activeTab === "reports"
                        ? "bg-indigo-100 text-indigo-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    } px-4 py-2 rounded-md text-sm font-medium flex items-center`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 mr-1 ${
                        activeTab === "reports"
                          ? "text-indigo-600"
                          : "text-gray-500"
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Reports
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("messages");
                      fetchConversations()
                        .then(() => {
                          console.log("Conversations loaded for Messages tab");
                        })
                        .catch((err) => {
                          console.error(
                            "Error loading conversations for Messages tab:",
                            err
                          );
                        });
                    }}
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
                className="ml-3 flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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

              <button
                onClick={displayAuthDebugInfo}
                className="ml-2 p-2 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                title="Debug Auth"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              <button
                onClick={() => {
                  localStorage.removeItem("user");
                  localStorage.removeItem("token");
                  window.location.reload();
                }}
                className="ml-2 flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414a1 1 0 00-.293-.707L11.414 2.414A1 1 0 0010.586 2H3zm9 2.414L15.414 7H12V5.414z"
                    clipRule="evenodd"
                  />
                  <path d="M3 7h6v2H3V7zm0 4h6v2H3v-2zm0 4h6v2H3v-2zm8-8h2v6h-2V7z" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading && (
          <div className="mb-4 p-4 bg-gray-100 rounded-md text-gray-700">
            Loading...
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-100 rounded-md text-red-700">
            {error}
          </div>
        )}

        {showDebugInfo && (
          <div className="mb-4 p-4 bg-yellow-100 rounded-md text-yellow-800 whitespace-pre-line">
            {error}
          </div>
        )}

        {activeTab === "sessions" && (
          <SessionsTab
            sessions={sessions}
            onStatusUpdate={handleSessionStatusUpdate}
            onSessionsUpdated={refreshData}
            clearMentorFilter={() => setFilterMentorId(null)}
            filterMentorId={filterMentorId}
            mentors={mentors}
          />
        )}

        {activeTab === "mentors" && (
          <MentorsTab
            mentors={mentors}
            sessions={sessions}
            onViewSessions={(mentorId) => {
              setFilterMentorId(mentorId);
              setActiveTab("sessions");
            }}
          />
        )}

        {activeTab === "payments" && (
          <PaymentsTab
            payments={payments}
            sessions={sessions}
            mentors={mentors}
            onCreatePayment={handleCreatePayment}
            onUpdateStatus={handleUpdatePaymentStatus}
            onViewDetails={handleViewPaymentDetails}
            paymentModalConfig={paymentModalConfig}
            setPaymentModalConfig={setPaymentModalConfig}
          />
        )}

        {activeTab === "reports" && (
          <ReportsTab
            sessions={sessions}
            payments={payments}
            mentors={mentors}
          />
        )}

        {activeTab === "messages" && (
          <div>
            {error && (
              <div className="mb-4 p-4 bg-red-100 rounded-md text-red-700">
                {error}
              </div>
            )}
            <MessagesTab
              user={user}
              conversations={conversations}
              setConversations={setConversations}
              messages={messages}
              setMessages={setMessages}
            />
          </div>
        )}
      </div>

      {/* Render the Stripe Payment Modal if open */}
      {stripeModalOpen && stripePaymentData && (
        <StripePaymentModal
          clientSecret={stripePaymentData.clientSecret}
          paymentId={stripePaymentData.paymentId}
          amount={stripePaymentData.amount}
          onSuccess={processPayment}
          onCancel={() => {
            setStripeModalOpen(false);
            setStripePaymentData(null);
          }}
        />
      )}
    </div>
  );
}

// Sessions Tab Component
function SessionsTab({
  sessions,
  onStatusUpdate,
  onSessionsUpdated,
  clearMentorFilter,
  filterMentorId,
  mentors,
}) {
  const [selectedStatus, setSelectedStatus] = React.useState("ALL");
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [showViewModal, setShowViewModal] = React.useState(false);
  const [selectedSession, setSelectedSession] = React.useState(null);
  const [newSession, setNewSession] = React.useState({
    mentorId: "",
    sessionType: "Online Teaching",
    duration: 60,
    hourlyRate: 1000,
    sessionDateTime: new Date().toISOString().slice(0, 16), // Format as YYYY-MM-DDTHH:MM for datetime-local input
    notes: "",
  });
  const [availableMentors, setAvailableMentors] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const { refreshAuth } = React.useContext(AuthContext);

 
  const [currentPage, setCurrentPage] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [totalItems, setTotalItems] = React.useState(0);
  const [paginatedSessions, setPaginatedSessions] = React.useState([]);


  React.useEffect(() => {
    fetchPaginatedSessions(currentPage, pageSize);
  }, [currentPage, pageSize, selectedStatus]);

  const fetchPaginatedSessions = async (page, size) => {
    try {
      setLoading(true);
      const actualSize = size || pageSize;

      let url = `/api/sessions?page=${page}&size=${actualSize}&sortBy=sessionDateTime&direction=desc`;
      if (selectedStatus !== "ALL") {
        url += `&status=${selectedStatus}`;
      }

      console.log(`Fetching sessions with url: ${url}`);
      const response = await axios.get(url);
      console.log(
        "Sessions response:",
        response.data,
        "Page:",
        page,
        "Size:",
        actualSize
      );

      let sessionsData = [];
      let totalItemsCount = 0;
      let totalPagesCount = 0;

      if (response.data && typeof response.data === "object") {
        if (Array.isArray(response.data.sessions)) {
          sessionsData = response.data.sessions;
          totalItemsCount = response.data.totalItems || 0;
          totalPagesCount = response.data.totalPages || 0;
        } else if (Array.isArray(response.data)) {
          sessionsData = response.data;
          totalItemsCount = sessionsData.length;
          totalPagesCount = Math.ceil(sessionsData.length / actualSize);
        }
      }

      console.log(
        `Loaded ${sessionsData.length} sessions out of ${totalItemsCount} total`
      );

      let filteredSessions = sessionsData;
      if (filterMentorId) {
        filteredSessions = sessionsData.filter(
          (session) => session.mentor && session.mentor.id === filterMentorId
        );
        console.log(
          `Filtered to ${filteredSessions.length} sessions for mentor ${filterMentorId}`
        );
      }

      setPaginatedSessions(filteredSessions);
      setCurrentPage(page);
      setTotalPages(totalPagesCount);
      setTotalItems(totalItemsCount);
      setError("");
    } catch (err) {
      console.error("Failed to fetch paginated sessions:", err);
      setError(
        "Failed to load sessions: " +
          (err.response?.data?.message || err.message)
      );

      if (
        err.response &&
        err.response.status === 401 &&
        typeof refreshAuth === "function"
      ) {
        try {
          const refreshed = await refreshAuth();
          if (refreshed) {
            fetchPaginatedSessions(page, size);
          }
        } catch (refreshError) {
          console.error("Failed to refresh authentication:", refreshError);
        }
      }

      console.log("Falling back to client-side session filtering");
      let filteredSessions = filterMentorId
        ? sessions.filter(
            (session) => session.mentor && session.mentor.id === filterMentorId
          )
        : sessions;

      if (selectedStatus !== "ALL") {
        filteredSessions = filteredSessions.filter(
          (session) => session.status === selectedStatus
        );
      }

      const startIndex = page * actualSize;
      const endIndex = Math.min(
        startIndex + actualSize,
        filteredSessions.length
      );
      setPaginatedSessions(filteredSessions.slice(startIndex, endIndex));
      setTotalItems(filteredSessions.length);
      setTotalPages(Math.ceil(filteredSessions.length / actualSize));
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (event) => {
    const newSize = parseInt(event.target.value);
    setPageSize(newSize);
    setCurrentPage(0); // Reset to first page when changing page size
  };

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/users?paginate=true&size=1000");

      const usersData = response.data.users
        ? response.data.users
        : response.data;

      if (response.data.totalPages) {
        console.log(`Total pages: ${response.data.totalPages}, 
                    Current page: ${response.data.currentPage}, 
                    Total items: ${response.data.totalItems}`);
      }

      const mentors = usersData.filter((user) => {
        if (!user.roles || !Array.isArray(user.roles)) return false;

        return user.roles.some((role) => {
          if (typeof role === "string") {
            return role === "ROLE_MENTOR" || role === "MENTOR";
          } else if (typeof role === "object" && role !== null) {
            return role.name === "ROLE_MENTOR" || role.name === "MENTOR";
          }
          return false;
        });
      });

      console.log(`Loaded ${mentors.length} mentors for dropdown selection`);
      setAvailableMentors(mentors);
      setLoading(false);
      setError("");
    } catch (err) {
      console.error("Failed to fetch mentors:", err.message);
      setError("Failed to load mentors: " + err.message);
      setLoading(false);

      if (
        err.message === "Authentication error" ||
        (err.response && err.response.status === 401)
      ) {
        try {
          const refreshSuccessful = await refreshAuth();
          if (refreshSuccessful) {
            fetchMentors();
          }
        } catch (refreshErr) {
          console.error("Auth refresh failed:", refreshErr);
        }
      }
    }
  };

  const openCreateModal = () => {
    setShowCreateModal(true);
    fetchMentors();
    setError("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSession({ ...newSession, [name]: value });
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();

    // Validate form
    if (!newSession.mentorId) {
      setError("Please select a mentor");
      return;
    }

    try {
      setLoading(true);
      setError("");

    const token = localStorage.getItem("token");
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    console.log("Creating session with auth:", {
      tokenExists: !!token,
      userRoles: userData.roles || [],
      userId: userData.id,
      username: userData.username,
    });

    try {
      if (!newSession.mentorId) {
        throw new Error("Please select a mentor");
      }

      const durationHours = newSession.duration / 60;
      const finalPayoutAmount = (durationHours * newSession.hourlyRate).toFixed(
        2
      );

      const sessionData = {
        mentor: { id: newSession.mentorId },
      // The sessionDateTime already contains both date and time from the datetime-local input
      // We just need to parse it correctly
      console.log("Raw session date time value:", newSession.sessionDateTime);

      const sessionDateTime = new Date(newSession.sessionDateTime);

      console.log("Parsed session date time:", sessionDateTime);

      // Format the session data for API
      const formattedSession = {
        mentor: { id: parseInt(newSession.mentorId) },
        sessionDateTime: sessionDateTime.toISOString(),
        recordedDate: newSession.sessionDateTime.split("T")[0], // Just the date part
        sessionType: newSession.sessionType,
        duration: `PT${newSession.duration}M`, // ISO-8601 format for minutes
        hourlyRate: newSession.hourlyRate,
        finalPayoutAmount: finalPayoutAmount,
        sessionDateTime: new Date(newSession.sessionDateTime).toISOString(),
        recordedDate: new Date().toISOString().split("T")[0],
        status: "PENDING",
        notes: newSession.notes || "",
      };

      console.log("Creating new session:", sessionData);

      const startTime = Date.now();

      console.log("Testing authentication with a simple GET request...");
      try {
        await axios.get("/api/users");
        console.log(
          "Authentication test passed - we have permission to read users"
        );
      } catch (authTestError) {
        console.error("Authentication test failed:", authTestError);
        if (authTestError.response && authTestError.response.status === 401) {
          setError(
            "You don't have permission to perform this action. Please make sure you're logged in with an Admin account."
          );
          setLoading(false);
          return;
        }
      }

      const response = await axios.post("/api/sessions", sessionData);
        duration: parseInt(newSession.duration),
        hourlyRate: parseFloat(newSession.hourlyRate),
        notes: newSession.notes,
        status: "PENDING", // Default status for new sessions
      };

      console.log("Creating session with data:", formattedSession);

      const response = await axios.post("/api/sessions", formattedSession);
      console.log("Session created successfully:", response.data);

      setSuccess(true);
      setShowCreateModal(false);
      setNewSession({
        mentorId: "",
        sessionType: "Online Teaching",
        duration: 60,
        hourlyRate: 1000,
        sessionDateTime: new Date().toISOString().slice(0, 16), // Format for datetime-local input
        notes: "",
      });

      // Update the sessions list immediately and refresh all data
      const updatedSessions = await axios.get("/api/sessions");
      onSessionsUpdated(updatedSessions.data.sessions || updatedSessions.data);

      // Also refresh all data in the parent component
      if (window.adminDashboardRefreshData) {
        window.adminDashboardRefreshData();
      }

      // Close the modal after successful creation
      setTimeout(() => {
        setShowCreateModal(false);
        setSuccess(false);
      }, 1000);
    } catch (err) {
      console.error("Failed to create session:", err);
      setError(
        `Failed to create session: ${
          err.response?.data?.message || err.message
        }`
      );
      try {
        const sessionsResponse = await axios.get("/api/sessions");
        if (typeof onSessionsUpdated === "function") {
          onSessionsUpdated(sessionsResponse.data);
        } else {
          console.log(
            "Sessions updated, but no handler available to update UI"
          );
        }

        alert("Session created successfully!");
      } catch (refreshErr) {
        console.error("Error refreshing sessions:", refreshErr);
        alert(
          "Session created, but couldn't refresh the list. Please reload manually."
        );
      }
    } catch (err) {
      console.error(
        "Error creating session:",
        err.response?.data || err.message
      );

      if (err.response?.status === 403) {
        setError(
          "You don't have permission to create sessions. This action requires Admin privileges."
        );
        setLoading(false);
        return;
      }

      if (
        err.message === "Authentication error" ||
        (err.response && err.response.status === 401)
      ) {
        try {
          console.log(
            "Session creation failed due to auth - attempting refresh"
          );

          const lastRefreshTime = parseInt(
            localStorage.getItem("last_session_refresh") || "0"
          );
          const now = Date.now();

          if (now - lastRefreshTime < 5000) {
            console.log(
              "Already attempted refresh recently, not retrying to avoid loop"
            );
            setError(
              "Authentication failed. Please try logging out and back in as an Admin user."
            );
            return;
          }

          localStorage.setItem("last_session_refresh", now.toString());

          const refreshSuccessful = await refreshAuth();

          if (refreshSuccessful) {
            console.log(
              "Auth refreshed successfully, retrying session creation"
            );
            setTimeout(() => {
              setError("");
              const retryEvent = { preventDefault: () => {} };
              handleCreateSession(retryEvent);
            }, 1000);
            return;
          } else {
            setError(
              "Authentication failed. Please log in again as an Admin user."
            );
          }
        } catch (refreshErr) {
          console.error("Failed to refresh authentication:", refreshErr);
          setError("Session could not be created - authentication failed.");
        }
      } else {
        setError(
          `Failed to create session: ${
            err.response?.data?.message || err.message
          }`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCsvImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setLoading(true);
        const csvData = e.target.result;
        const rows = csvData.split("\n");
        const headers = rows[0].split(",");

        const requiredHeaders = [
          "mentorId",
          "sessionType",
          "duration",
          "hourlyRate",
          "sessionDateTime",
        ];
        const missingHeaders = requiredHeaders.filter(
          (h) => !headers.includes(h)
        );

        if (missingHeaders.length > 0) {
          setError(`Missing required headers: ${missingHeaders.join(", ")}`);
          setLoading(false);
          return;
        }

        for (let i = 1; i < rows.length; i++) {
          if (!rows[i].trim()) continue; // Skip empty rows

          const values = rows[i].split(",");
          const rowData = {};

          headers.forEach((header, index) => {
            rowData[header.trim()] = values[index]?.trim();
          });

          if (
            !rowData.mentorId ||
            !rowData.sessionType ||
            !rowData.duration ||
            !rowData.hourlyRate ||
            !rowData.sessionDateTime
          ) {
            console.error(`Row ${i} has missing required fields, skipping`);
            continue;
          }

          const durationHours = parseInt(rowData.duration) / 60;
          const finalPayoutAmount = (
            durationHours * parseFloat(rowData.hourlyRate)
          ).toFixed(2);

          // Make sure we have a valid date for sessionDateTime
          let sessionDateTime;
          try {
            sessionDateTime = new Date(rowData.sessionDateTime);
            if (isNaN(sessionDateTime.getTime())) {
              throw new Error("Invalid date");
            }
          } catch (dateErr) {
            console.error(
              `Row ${i} has invalid date format, using current date`
            );
            sessionDateTime = new Date();
          }

          const sessionData = {
            mentor: { id: rowData.mentorId },
            sessionType: rowData.sessionType,
            duration: parseInt(rowData.duration),
            hourlyRate: parseFloat(rowData.hourlyRate),
            finalPayoutAmount: finalPayoutAmount,
            sessionDateTime: sessionDateTime.toISOString(),
            recordedDate: sessionDateTime.toISOString().split("T")[0],
            status: "PENDING",
            notes: rowData.notes || "",
          };

          await axios.post("/api/sessions", sessionData);
        }

        // Refresh sessions list without page reload
        const updatedSessions = await axios.get("/api/sessions");
        onSessionsUpdated(
          updatedSessions.data.sessions || updatedSessions.data
        );
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
        }, 2000);
        window.location.reload();
      } catch (err) {
        console.error("Error importing CSV:", err);
        setError(`Failed to import CSV: ${err.message}`);
      } finally {
        setLoading(false);
        event.target.value = null;
      }
    };

    reader.readAsText(file);
  };

  const filteredSessions =
    selectedStatus === "ALL"
      ? sessions
      : sessions.filter((session) => session.status === selectedStatus);

  const handleViewSession = (session) => {
    setSelectedSession(session);
    setShowViewModal(true);
  };

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-gray-900">Sessions</h2>

          {filterMentorId && (
            <div className="ml-4 flex items-center">
              <span className="text-sm text-gray-500">
                Filtered by mentor:{" "}
                {mentors?.find((m) => m.id === filterMentorId)?.fullName ||
                  "Unknown"}
              </span>
              <button
                onClick={clearMentorFilter}
                className="ml-2 inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none"
              >
                Clear Filter ×
              </button>
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(0); // Reset to first page when changing filter
            }}
            className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="ALL">All Sessions</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="PAID">Paid</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Session
          </button>

          <div className="relative">
            <input
              type="file"
              accept=".csv"
              id="csvImport"
              className="sr-only"
              onChange={handleCsvImport}
            />
            <label
              htmlFor="csvImport"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
            >
              Import CSV
            </label>
          </div>
        </div>
      </div>

      {/* Session creation modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Create New Session</h3>

            {error && (
              <div className="mb-4 bg-red-50 p-3 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleCreateSession}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mentor
                </label>
                <div className="flex items-center space-x-2">
                  <select
                    name="mentorId"
                    value={newSession.mentorId}
                    onChange={handleInputChange}
                    required
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">-- Select Mentor --</option>
                    {availableMentors.map((mentor) => (
                      <option key={mentor.id} value={mentor.id}>
                        {mentor.fullName || mentor.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Type
                </label>
                <select
                  name="sessionType"
                  value={newSession.sessionType}
                  onChange={handleInputChange}
                  required
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="Online Teaching">Online Teaching</option>
                  <option value="One-on-One Mentoring">
                    One-on-One Mentoring
                  </option>
                  <option value="Group Session">Group Session</option>
                  <option value="Technical Review">Technical Review</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={newSession.duration}
                    onChange={handleInputChange}
                    required
                    min="15"
                    step="15"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hourly Rate (₹)
                  </label>
                  <input
                    type="number"
                    name="hourlyRate"
                    value={newSession.hourlyRate}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="100"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="sessionDateTime"
                  value={newSession.sessionDateTime}
                  onChange={handleInputChange}
                  required
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={newSession.notes}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Optional notes about this session"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Session view modal */}
      {showViewModal && selectedSession && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Session Details</h3>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500">Mentor</p>
              <p className="mt-1 text-sm text-gray-900">
                {selectedSession.mentor.fullName}
              </p>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500">Session Type</p>
              <p className="mt-1 text-sm text-gray-900">
                {selectedSession.sessionType}
              </p>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500">Duration</p>
              <p className="mt-1 text-sm text-gray-900">
                {typeof selectedSession.duration === "object" &&
                selectedSession.duration.seconds
                  ? Math.floor(selectedSession.duration.seconds / 60) + " mins"
                  : typeof selectedSession.duration === "string" &&
                    selectedSession.duration.startsWith("PT")
                  ? selectedSession.duration.replace(/PT(\d+)M/, "$1") + " mins"
                  : typeof selectedSession.duration === "number"
                  ? selectedSession.duration + " mins"
                  : "Unknown duration"}
              </p>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500">Date & Time</p>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(selectedSession.sessionDateTime).toLocaleString()}
              </p>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500">Hourly Rate</p>
              <p className="mt-1 text-sm text-gray-900">
                ₹{selectedSession.hourlyRate}
              </p>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500">Final Amount</p>
              <p className="mt-1 text-sm text-gray-900">
                ₹{selectedSession.finalPayoutAmount}
              </p>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className="mt-1 text-sm text-gray-900">
                {selectedSession.status}
              </p>
            </div>

            {selectedSession.notes && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500">Notes</p>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedSession.notes}
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>

              {selectedSession.status === "APPROVED" && (
                <button
                  onClick={() => {
                    if (typeof window.createPaymentForSession === "function") {
                      window.createPaymentForSession(
                        selectedSession.mentor.id,
                        [selectedSession.id]
                      );
                    } else {
                      alert(
                        "Please go to the Payments tab and create a payment for this session."
                      );
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  Process Payment
                </button>
              )}
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
                Mentor
              </th>
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
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan="8"
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  <div className="flex justify-center items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-500"></div>
                    <span>Loading sessions...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedSessions.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No sessions found
                </td>
              </tr>
            ) : (
              paginatedSessions.map((session) => (
                <tr key={session.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {session.mentor.fullName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {session.sessionType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {typeof session.duration === "object" &&
                    session.duration.seconds
                      ? Math.floor(session.duration.seconds / 60) + " mins"
                      : typeof session.duration === "string" &&
                        session.duration.startsWith("PT")
                      ? session.duration.replace(/PT(\d+)M/, "$1") + " mins"
                      : typeof session.duration === "number"
                      ? session.duration + " mins"
                      : "Unknown duration"}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {session.status === "PENDING" && (
                        <>
                          <button
                            onClick={() =>
                              onStatusUpdate(session.id, "APPROVED")
                            }
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              onStatusUpdate(session.id, "REJECTED")
                            }
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {session.status === "APPROVED" && (
                        <button
                          onClick={() => {
                            if (
                              typeof window.createPaymentForSession ===
                              "function"
                            ) {
                              window.createPaymentForSession(
                                session.mentor.id,
                                [session.id]
                              );
                            } else {
                              alert(
                                "Please go to the Payments tab and create a payment for this session."
                              );
                            }
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Process Payment
                        </button>
                      )}
                      <button
                        onClick={() => handleViewSession(session)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Controls for Sessions */}
        <div className="mt-4 flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
          <div className="flex items-center">
            <p className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-medium">{paginatedSessions.length}</span> of{" "}
              <span className="font-medium">{totalItems}</span> sessions
            </p>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="ml-4 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
              <option value="200">200 per page</option>
            </select>
          </div>

          <div className="flex-1 flex justify-center">
            <nav
              className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
              aria-label="Pagination"
            >
              <button
                onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                &larr;
              </button>

              {/* Enhanced pagination with first/last pages and ellipsis */}
              {(() => {
                const pageNumbers = [];

                // Always show first page
                if (currentPage > 2) {
                  pageNumbers.push(
                    <button
                      key="first"
                      onClick={() => handlePageChange(0)}
                      className="relative inline-flex items-center px-4 py-2 border text-sm font-medium bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                    >
                      1
                    </button>
                  );

                  // Add ellipsis if needed
                  if (currentPage > 3) {
                    pageNumbers.push(
                      <span
                        key="ellipsis-start"
                        className="relative inline-flex items-center px-4 py-2 border text-sm font-medium bg-white border-gray-300 text-gray-700"
                      >
                        ...
                      </span>
                    );
                  }
                }

                // Calculate range around current page
                const startPage = Math.max(0, currentPage - 1);
                const endPage = Math.min(totalPages - 1, currentPage + 1);

                // Add pages around current page
                for (let i = startPage; i <= endPage; i++) {
                  pageNumbers.push(
                    <button
                      key={i}
                      onClick={() => handlePageChange(i)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === i
                          ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                }

                // Show ellipsis and last page if needed
                if (currentPage < totalPages - 3) {
                  pageNumbers.push(
                    <span
                      key="ellipsis-end"
                      className="relative inline-flex items-center px-4 py-2 border text-sm font-medium bg-white border-gray-300 text-gray-700"
                    >
                      ...
                    </span>
                  );

                  pageNumbers.push(
                    <button
                      key="last"
                      onClick={() => handlePageChange(totalPages - 1)}
                      className="relative inline-flex items-center px-4 py-2 border text-sm font-medium bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                    >
                      {totalPages}
                    </button>
                  );
                }

                return pageNumbers;
              })()}

              <button
                onClick={() =>
                  handlePageChange(Math.min(totalPages - 1, currentPage + 1))
                }
                disabled={currentPage >= totalPages - 1}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                &rarr;
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mentors Tab Component
function MentorsTab({ mentors, sessions, onViewSessions }) {
  console.log("MentorsTab rendered with:", {
    mentorsCount: mentors.length,
    sessionsCount: sessions.length,
  });

  if (mentors.length === 0) {
    console.warn("No mentors data available to display");
  } else {
    console.log("First mentor sample:", mentors[0]);
  }

  const [currentPage, setCurrentPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [totalPages, setTotalPages] = React.useState(0);
  const [totalItems, setTotalItems] = React.useState(0);
  const [paginatedMentors, setPaginatedMentors] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    fetchPaginatedMentors();
  }, [mentors, pageSize, currentPage]);

  const fetchPaginatedMentors = async () => {
    setLoading(true);

    try {
      const response = await axios.get(
        `/api/users?page=${currentPage}&size=${pageSize}&sortBy=fullName&direction=asc`
      );

      console.log("Received mentor data:", response.data);

      let usersData = [];
      if (response.data && Array.isArray(response.data)) {
        usersData = response.data;
      } else if (response.data && Array.isArray(response.data.users)) {
        usersData = response.data.users;
        if (response.data.totalItems !== undefined) {
          setTotalItems(response.data.totalItems);
        }
        if (response.data.totalPages !== undefined) {
          setTotalPages(response.data.totalPages);
        }
      }

      const mentorsData = usersData.filter((user) => {
        if (!user.roles || !Array.isArray(user.roles)) return false;

        return user.roles.some((role) => {
          if (typeof role === "string") {
            return role === "ROLE_MENTOR" || role === "MENTOR";
          } else if (typeof role === "object" && role !== null) {
            return role.name === "ROLE_MENTOR" || role.name === "MENTOR";
          }
          return false;
        });
      });

      console.log(
        `Filtered ${mentorsData.length} mentors from ${usersData.length} users`
      );
      setPaginatedMentors(mentorsData);

      if (response.data && !response.data.totalItems) {
        const allMentors = mentors;
        setTotalItems(allMentors.length);
        setTotalPages(Math.ceil(allMentors.length / pageSize));
      }
    } catch (err) {
      console.error("Error fetching paginated mentors:", err);

      console.log("Falling back to client-side pagination");
      const startIndex = currentPage * pageSize;
      const endIndex = Math.min(startIndex + pageSize, mentors.length);
      const mentorsPage = mentors.slice(startIndex, endIndex);

      setPaginatedMentors(mentorsPage);
      setTotalItems(mentors.length);
      setTotalPages(Math.ceil(mentors.length / pageSize));
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (event) => {
    const newSize = parseInt(event.target.value);
    setPageSize(newSize);
    setCurrentPage(0); 
  };

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Mentors</h2>
        <div>
          <span className="text-sm text-gray-500">
            Total mentors: {totalItems}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center my-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : paginatedMentors.length === 0 ? (
        <div className="bg-yellow-50 p-4 rounded-md mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                No mentors found
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  No mentor accounts exist in the system. Please create mentors
                  first.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Phone
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Total Sessions
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Pending Amount
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedMentors.map((mentor) => {
                // Find all sessions for this mentor - with proper error handling
                const mentorSessions = sessions.filter(
                  (session) => session.mentor && session.mentor.id === mentor.id
                );
                // Get only approved sessions - these are pending payment
                const approvedSessions = mentorSessions.filter(
                  (session) => session.status === "APPROVED"
                );
                // Calculate pending payout amount - this is the sum of all approved but not yet paid sessions
                const pendingAmount = approvedSessions.reduce(
                  (sum, session) =>
                    sum + parseFloat(session.finalPayoutAmount || 0),
                  0
                );

                return (
                  <tr key={mentor.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {mentor.fullName || mentor.username || "Unknown Name"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {mentor.email || "No email"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {mentor.phoneNumber || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {mentorSessions.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{pendingAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => onViewSessions(mentor.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View Sessions
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination Controls for Mentors */}
          <div className="mt-4 flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
            <div className="flex items-center">
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">{paginatedMentors.length}</span>{" "}
                of <span className="font-medium">{totalItems}</span> mentors
              </p>
              <select
                value={pageSize}
                onChange={handlePageSizeChange}
                className="ml-4 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
                <option value="200">200 per page</option>
              </select>
            </div>

            <div className="flex-1 flex justify-center">
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  &larr;
                </button>

                {/* Enhanced pagination with first/last pages and ellipsis */}
                {(() => {
                  const pageNumbers = [];

                  // Always show first page
                  if (currentPage > 2) {
                    pageNumbers.push(
                      <button
                        key="first"
                        onClick={() => handlePageChange(0)}
                        className="relative inline-flex items-center px-4 py-2 border text-sm font-medium bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      >
                        1
                      </button>
                    );

                    // Add ellipsis if needed
                    if (currentPage > 3) {
                      pageNumbers.push(
                        <span
                          key="ellipsis-start"
                          className="relative inline-flex items-center px-4 py-2 border text-sm font-medium bg-white border-gray-300 text-gray-700"
                        >
                          ...
                        </span>
                      );
                    }
                  }

                  // Calculate range around current page
                  const startPage = Math.max(0, currentPage - 1);
                  const endPage = Math.min(totalPages - 1, currentPage + 1);

                  // Add pages around current page
                  for (let i = startPage; i <= endPage; i++) {
                    pageNumbers.push(
                      <button
                        key={i}
                        onClick={() => handlePageChange(i)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === i
                            ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {i + 1}
                      </button>
                    );
                  }

                  // Show ellipsis and last page if needed
                  if (currentPage < totalPages - 3) {
                    pageNumbers.push(
                      <span
                        key="ellipsis-end"
                        className="relative inline-flex items-center px-4 py-2 border text-sm font-medium bg-white border-gray-300 text-gray-700"
                      >
                        ...
                      </span>
                    );

                    pageNumbers.push(
                      <button
                        key="last"
                        onClick={() => handlePageChange(totalPages - 1)}
                        className="relative inline-flex items-center px-4 py-2 border text-sm font-medium bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      >
                        {totalPages}
                      </button>
                    );
                  }

                  return pageNumbers;
                })()}

                <button
                  onClick={() =>
                    handlePageChange(Math.min(totalPages - 1, currentPage + 1))
                  }
                  disabled={currentPage >= totalPages - 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  &rarr;
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Payments Tab Component
function PaymentsTab({
  payments,
  sessions,
  mentors,
  onCreatePayment,
  onUpdateStatus,
  onViewDetails,
  paymentModalConfig,
  setPaymentModalConfig,
}) {
  const [currentPage, setCurrentPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [totalPages, setTotalPages] = React.useState(0);
  const [totalItems, setTotalItems] = React.useState(0);
  const [paginatedPayments, setPaginatedPayments] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [availableMentors, setAvailableMentors] = React.useState([]);
  const [selectedMentor, setSelectedMentor] = React.useState("");
  const [sessionsToPayFor, setSessionsToPayFor] = React.useState([]);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [localSessions, setLocalSessions] = React.useState([]); // Add localSessions state

  const [showReceiptModal, setShowReceiptModal] = React.useState(false);
  const [activePayment, setActivePayment] = React.useState(null);
  const [receiptLoading, setReceiptLoading] = React.useState(false);
  const [receiptError, setReceiptError] = React.useState("");
  const [sendEmailMessage, setSendEmailMessage] = React.useState("");
  const [sendEmailModalOpen, setSendEmailModalOpen] = React.useState(false);

  React.useEffect(() => {
    if (sessions && sessions.length > 0) {
      console.log(
        "Updating local sessions from prop changes:",
        sessions.length
      );
      setLocalSessions((prevSessions) => {
        // If we already have sessions loaded, intelligently merge them
        if (prevSessions && prevSessions.length > 0) {
          // Create a map of existing session IDs for quick lookup
          const existingSessionMap = {};
          prevSessions.forEach((session) => {
            if (session && session.id) {
              existingSessionMap[session.id] = true;
            }
          });

          // Add only sessions that don't exist in our local state
          const newSessions = sessions.filter(
            (session) =>
              session && session.id && !existingSessionMap[session.id]
          );

          if (newSessions.length > 0) {
            console.log(
              `Merging ${newSessions.length} new sessions with ${prevSessions.length} existing ones`
            );
            return [...prevSessions, ...newSessions];
          }
          return prevSessions;
        }

        return sessions;
      });
    }
  }, [sessions]);

  React.useEffect(() => {
    if (paymentModalConfig) {
      handleCreatePaymentForMentor(
        paymentModalConfig.mentorId,
        paymentModalConfig.sessionIds
      );
      setPaymentModalConfig(null);
    }
  }, [paymentModalConfig]);

  React.useEffect(() => {
    fetchPaginatedPayments().catch((err) => {
      console.error("Error in pagination effect:", err);
    });
  }, [pageSize, currentPage]); 

  const fetchPaginatedPayments = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      const response = await axios.get(
        `/api/payments?page=${currentPage}&size=${pageSize}&sortBy=paymentDate&direction=desc`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Payments pagination response:", response.data);

      let paymentsData = [];
      let totalItemsCount = 0;
      let totalPagesCount = 0;

      if (response.data && typeof response.data === "object") {
        if (Array.isArray(response.data.payments)) {
          paymentsData = response.data.payments;
          totalItemsCount = response.data.totalItems || 0;
          totalPagesCount = response.data.totalPages || 0;

          console.log(
            `Loaded ${paymentsData.length} payments (page ${
              currentPage + 1
            } of ${totalPagesCount})`
          );
        } else if (Array.isArray(response.data)) {
          paymentsData = response.data;
          totalItemsCount = payments.length; // Fall back to the full list length
          totalPagesCount = Math.ceil(payments.length / pageSize);

          const startIndex = currentPage * pageSize;
          const endIndex = Math.min(startIndex + pageSize, paymentsData.length);
          paymentsData = paymentsData.slice(startIndex, endIndex);

          console.log(
            `Applied client-side pagination: ${
              paymentsData.length
            } payments (page ${currentPage + 1} of ${totalPagesCount})`
          );
        }
      } else {
        console.warn("Invalid payments response format", response.data);
        const startIndex = currentPage * pageSize;
        const endIndex = Math.min(startIndex + pageSize, payments.length);
        paymentsData = payments.slice(startIndex, endIndex);
        totalItemsCount = payments.length;
        totalPagesCount = Math.ceil(payments.length / pageSize);
      }

      setPaginatedPayments(paymentsData);
      setTotalItems(totalItemsCount);
      setTotalPages(totalPagesCount > 0 ? totalPagesCount : 1); // Ensure at least 1 page
    } catch (err) {
      console.error("Error fetching paginated payments:", err);

      console.log("Falling back to client-side payment pagination");
      const startIndex = currentPage * pageSize;
      const endIndex = Math.min(startIndex + pageSize, payments.length);
      const paymentsPage = payments.slice(startIndex, endIndex);

      setPaginatedPayments(paymentsPage);
      setTotalItems(payments.length);
      setTotalPages(Math.ceil(payments.length / pageSize) || 1);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (event) => {
    const newSize = parseInt(event.target.value);
    setPageSize(newSize);
    setCurrentPage(0);
  };

  const openCreateModal = () => {
    setShowCreateModal(true);
    setSelectedMentor("");
    setSessionsToPayFor([]);
    fetchAllMentors(); 
  };


  const fetchAllMentors = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("Fetching all mentors for payment creation...");

     
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

     
      const response = await axios.get("/api/users?paginate=true&size=1000", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

     
      const usersData = response.data.users
        ? response.data.users
        : response.data;

      if (!usersData || !Array.isArray(usersData)) {
        throw new Error("Invalid response format: users data is not an array");
      }

      const mentorsList = usersData.filter((user) => {
        if (!user || !user.roles || !Array.isArray(user.roles)) return false;

        return user.roles.some((role) => {
          if (typeof role === "string") {
            return role === "ROLE_MENTOR" || role === "MENTOR";
          } else if (typeof role === "object" && role !== null) {
            return role.name === "ROLE_MENTOR" || role.name === "MENTOR";
          }
          return false;
        });
      });

      console.log(
        `Loaded ${mentorsList.length} mentors for payment creation dropdown selection`
      );
      setAvailableMentors(mentorsList);
    } catch (err) {
      console.error(
        "Failed to fetch mentors for payment creation:",
        err.message
      );
      setError(`Failed to load mentors: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMentorChange = (e) => {
    const mentorId = e.target.value;
    setSelectedMentor(mentorId);
    setSessionsToPayFor([]);

    if (mentorId) {
      console.log(`Loading sessions for mentor ID: ${mentorId}`);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token not found. Please login again.");
        return;
      }

      axios
        .get(`/api/users/${mentorId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          console.log("Loaded complete mentor details:", response.data);

          setAvailableMentors((prevMentors) => {
            return prevMentors.map((mentor) =>
              mentor.id === mentorId ? { ...mentor, ...response.data } : mentor
            );
          });
        })
        .catch((error) => {
          console.error("Failed to load complete mentor details:", error);
          if (error.response && error.response.status === 401) {
            setError(
              "Authentication failed. Please refresh the page and login again."
            );
            if (typeof window.refreshAuth === "function") {
              window
                .refreshAuth()
                .catch((e) => console.error("Failed to refresh auth:", e));
            }
          } else {
            setError(`Failed to load mentor details: ${error.message}`);
          }
        });

      axios
        .get(`/api/sessions?mentorId=${mentorId}&status=APPROVED`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          const mentorSessions = Array.isArray(response.data)
            ? response.data
            : response.data.sessions || [];

          console.log(`Loaded ${mentorSessions.length} sessions for mentor`);

          const otherSessions = (
            localSessions && localSessions.length > 0
              ? localSessions
              : sessions || []
          ).filter(
            (session) => !session.mentor || session.mentor.id !== mentorId
          );

          const updatedSessions = [...otherSessions, ...mentorSessions];
          console.log(
            `Updated sessions array with ${updatedSessions.length} total sessions`
          );

          setLocalSessions(updatedSessions);
        })
        .catch((error) => {
          console.error("Failed to load mentor sessions:", error);
          if (error.response && error.response.status === 401) {
            setError(
              "Authentication failed. Please refresh the page and login again."
            );
            if (typeof window.refreshAuth === "function") {
              window
                .refreshAuth()
                .catch((e) => console.error("Failed to refresh auth:", e));
            }
          } else {
            setError(`Failed to load sessions: ${error.message}`);
          }
        });
    }
  };

  const handleSessionSelection = (sessionId, isSelected) => {
    if (isSelected) {
      setSessionsToPayFor([...sessionsToPayFor, sessionId]);
    } else {
      setSessionsToPayFor(sessionsToPayFor.filter((id) => id !== sessionId));
    }
  };

  const handleCreatePaymentForMentor = (mentorId, sessionIds) => {
    setShowCreateModal(true);
    setSelectedMentor(mentorId);
    setSessionsToPayFor(sessionIds || []);
    fetchAllMentors(); 
  };

  const handleSubmitPayment = () => {
    if (selectedMentor && sessionsToPayFor.length > 0) {
      onCreatePayment(selectedMentor, sessionsToPayFor);
      setShowCreateModal(false);
    }
  };

 
  const handleViewReceipt = (payment) => {
    setActivePayment(payment);
    setShowReceiptModal(true);
    setReceiptError("");
    setSendEmailMessage("");
  };


  const handleGenerateReceipt = async () => {
    if (!activePayment) return;

    try {
      setReceiptLoading(true);
      setReceiptError("");

      console.log(`Generating receipt for payment ID: ${activePayment.id}`);

     
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      
      const checkResponse = await axios.get(
        `/api/payments/${activePayment.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!checkResponse.data || checkResponse.data.error) {
        throw new Error(
          "Could not verify payment details before generating receipt"
        );
      }

      console.log("Payment verified, generating receipt...");

      const response = await axios.post(
        `/api/payments/${activePayment.id}/generate-receipt`,
        {}, // Empty body
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data && response.data.receiptUrl) {
        console.log(
          "Receipt generated successfully:",
          response.data.receiptUrl
        );

        // Test if the receipt URL is accessible
        try {
          const testFetch = await fetch(response.data.receiptUrl, {
            method: "HEAD",
          });
          if (!testFetch.ok) {
            console.warn(
              "Receipt URL may not be accessible:",
              testFetch.status
            );
          }
        } catch (fetchErr) {
          console.warn("Could not verify receipt URL:", fetchErr);
        }

       
        setActivePayment({
          ...activePayment,
          receiptUrl: response.data.receiptUrl,
        });

      
        const updatedPayments = paginatedPayments.map((p) =>
          p.id === activePayment.id
            ? { ...p, receiptUrl: response.data.receiptUrl }
            : p
        );
        setPaginatedPayments(updatedPayments);

     
        alert(
          "Receipt has been successfully generated. You can now download or print it directly from this page."
        );
      } else {
        throw new Error("Receipt generation failed or returned invalid URL");
      }
    } catch (err) {
      console.error("Error generating receipt:", err);
      setReceiptError(
        `Failed to generate receipt: ${
          err.response?.data?.message || err.message
        }. Please try again.`
      );
    } finally {
      setReceiptLoading(false);
    }
  };

 
  const handleSendReceipt = async () => {
    if (!activePayment || !activePayment.receiptUrl) return;

   
    if (!activePayment.mentor || !activePayment.mentor.email) {
      setReceiptError("Cannot send receipt: Mentor email address is missing");
      return;
    }

    try {
      setReceiptLoading(true);
      setReceiptError("");

     
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      console.log(
        `Sending receipt for payment ID: ${activePayment.id} to ${activePayment.mentor.email}`
      );
      console.log(`Custom message: ${sendEmailMessage || "(none)"}`);

      const response = await axios.post(
        `/api/payments/${activePayment.id}/send-receipt`,
        {
          customMessage: sendEmailMessage,
          recipientEmail: activePayment.mentor.email,
          recipientName:
            activePayment.mentor.fullName || activePayment.mentor.username,
          receiptUrl: activePayment.receiptUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data && response.data.success) {
        console.log("Receipt sent successfully to mentor's email");

       
        setActivePayment({ ...activePayment, receiptSent: true });

     
        const updatedPayments = paginatedPayments.map((p) =>
          p.id === activePayment.id ? { ...p, receiptSent: true } : p
        );
        setPaginatedPayments(updatedPayments);

       
        setSendEmailMessage("");
      } else {
        console.error("Receipt sending failed:", response.data);
        throw new Error(response.data?.message || "Failed to send receipt");
      }
    } catch (err) {
      console.error("Error sending receipt:", err);
      setReceiptError(
        `Failed to send receipt: ${
          err.response?.data?.message || err.message
        }. Please verify that the email service is configured correctly.`
      );
    } finally {
      setReceiptLoading(false);
    }
  };

  
  const getPaymentStatusDisplay = (status) => {
    let bgColor, textColor;

    switch (status) {
      case "PENDING":
        bgColor = "bg-yellow-100";
        textColor = "text-yellow-800";
        break;
      case "COMPLETED":
        bgColor = "bg-green-100";
        textColor = "text-green-800";
        break;
      case "FAILED":
        bgColor = "bg-red-100";
        textColor = "text-red-800";
        break;
      default:
        bgColor = "bg-gray-100";
        textColor = "text-gray-800";
    }

    return (
      <span
        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-gray-900">Payments</h2>
          <button
            onClick={() => {
              fetchPaginatedPayments();
            }}
            className="ml-2 flex items-center text-sm text-gray-500 hover:text-gray-700"
            title="Refresh payments data"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
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
            <span className="ml-1">
              {loading ? "Refreshing..." : "Refresh"}
            </span>
          </button>
        </div>
        <div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create Payment
          </button>
        </div>
      </div>

      {/* Payment creation modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-medium mb-4">Create New Payment</h3>

            {error && (
              <div className="mb-4 p-3 bg-red-50 rounded-md text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Mentor
              </label>
              <select
                value={selectedMentor}
                onChange={handleMentorChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                disabled={!!paymentModalConfig}
              >
                <option value="">-- Select Mentor --</option>
                {(availableMentors.length > 0 ? availableMentors : mentors).map(
                  (mentor) => (
                    <option key={mentor.id} value={mentor.id}>
                      {mentor.fullName || mentor.username}
                    </option>
                  )
                )}
              </select>
            </div>

            {selectedMentor && (
              <>
                {/* Bank details verification section */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
                  <h4 className="font-medium text-sm text-blue-700 mb-2">
                    Bank Account Details
                  </h4>
                  {(() => {
                    const mentor = (
                      availableMentors.length > 0 ? availableMentors : mentors
                    ).find((m) => m.id === selectedMentor);
                    if (!mentor)
                      return (
                        <p className="text-red-500 text-sm">Mentor not found</p>
                      );

                    const hasBankDetails =
                      mentor.bankName &&
                      mentor.accountNumber &&
                      mentor.accountHolderName;

                    if (!hasBankDetails) {
                      return (
                        <div className="text-red-500 text-sm">
                          <p className="font-bold">⚠️ Missing bank details!</p>
                          <p>
                            This mentor does not have complete bank details.
                            Payment cannot be processed.
                          </p>
                          <p>
                            Please ask the mentor to update their profile with
                            bank information.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="text-sm">
                        <p>
                          <span className="font-medium">Account Holder:</span>{" "}
                          {mentor.accountHolderName}
                        </p>
                        <p>
                          <span className="font-medium">Bank Name:</span>{" "}
                          {mentor.bankName}
                        </p>
                        <p>
                          <span className="font-medium">Account Number:</span>{" "}
                          {mentor.accountNumber}
                        </p>
                        {mentor.ifscCode && (
                          <p>
                            <span className="font-medium">IFSC Code:</span>{" "}
                            {mentor.ifscCode}
                          </p>
                        )}
                        {mentor.accountType && (
                          <p>
                            <span className="font-medium">Account Type:</span>{" "}
                            {mentor.accountType}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Sessions
                  </label>
                  <div className="overflow-y-auto max-h-60 border rounded">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2"></th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                            Date
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                            Type
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(localSessions && localSessions.length > 0
                          ? localSessions
                          : sessions
                        )
                          .filter(
                            (session) =>
                              session &&
                              session.status === "APPROVED" &&
                              session.mentor &&
                              session.mentor.id === selectedMentor
                          )
                          .map((session) => (
                            <tr key={session.id}>
                              <td className="px-4 py-2">
                                <input
                                  type="checkbox"
                                  checked={sessionsToPayFor.includes(
                                    session.id
                                  )}
                                  onChange={(e) =>
                                    handleSessionSelection(
                                      session.id,
                                      e.target.checked
                                    )
                                  }
                                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                />
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {new Date(
                                  session.sessionDateTime
                                ).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {session.sessionType}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                ₹{session.finalPayoutAmount}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitPayment}
                disabled={
                  !selectedMentor ||
                  sessionsToPayFor.length === 0 ||
                  !(
                    availableMentors.length > 0 ? availableMentors : mentors
                  ).find(
                    (m) =>
                      m.id === selectedMentor &&
                      m.bankName &&
                      m.accountNumber &&
                      m.accountHolderName
                  )
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                Create Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && activePayment && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-2xl w-full mx-4 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Payment Receipt #{activePayment.id}
              </h3>
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
                      {activePayment.sessions?.map((session) => (
                        <tr key={session.id}>
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
                  <span>
                    Platform Fee ({activePayment.platformFeeRate || "5%"})
                  </span>
                  <span>-₹{activePayment.platformFee || 0}</span>
                </div>
                <div className="flex justify-between mb-1 text-xs">
                  <span>GST ({activePayment.gstRate || "18%"})</span>
                  <span>-₹{activePayment.gstAmount || 0}</span>
                </div>
                {activePayment.otherDeductions > 0 && (
                  <div className="flex justify-between mb-1 text-xs">
                    <span>Other Deductions</span>
                    <span>-₹{activePayment.otherDeductions}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold pt-1 border-t text-sm">
                  <span>Net Amount</span>
                  <span>
                    ₹{activePayment.baseAmount || activePayment.totalAmount}
                  </span>
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

            {/* Email Form Section */}
            {activePayment.receiptUrl && !activePayment.receiptSent && (
              <div className="mb-4 p-3 border rounded-md bg-blue-50">
                <h4 className="text-sm font-semibold mb-2">
                  Send Receipt to Mentor
                </h4>
                <div className="mb-3">
                  <p className="text-xs text-gray-600 mb-2">
                    This receipt will be emailed to:{" "}
                    <strong>
                      {activePayment.mentor?.email || "No email available"}
                    </strong>
                  </p>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Custom Message (Optional)
                  </label>
                  <textarea
                    value={sendEmailMessage}
                    onChange={(e) => setSendEmailMessage(e.target.value)}
                    rows="3"
                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter a personal message to include with the receipt..."
                  ></textarea>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleSendReceipt}
                    disabled={receiptLoading || !activePayment.mentor?.email}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {receiptLoading ? "Sending..." : "Send Receipt to Mentor"}
                  </button>
                </div>
              </div>
            )}

            {/* Receipt Status or Error */}
            {activePayment.receiptSent && (
              <div className="mb-4 p-3 border rounded-md bg-green-50 text-green-800 text-sm">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span>Receipt has been sent to the mentor's email.</span>
                </div>
              </div>
            )}

            {receiptError && (
              <div className="mt-3 p-3 bg-red-50 text-sm text-red-700 rounded-md">
                {receiptError}
              </div>
            )}

            <div className="flex justify-end space-x-2 mt-3">
              {!activePayment.receiptUrl ? (
                <button
                  onClick={handleGenerateReceipt}
                  disabled={receiptLoading}
                  className="px-3 py-1 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {receiptLoading ? "Generating..." : "Generate Receipt"}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      // Create a download link and trigger it
                      const link = document.createElement("a");
                      link.href = activePayment.receiptUrl;
                      link.download = `receipt-${activePayment.id}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => {
                      // Open in new window and print
                      const printWindow = window.open(
                        activePayment.receiptUrl,
                        "_blank"
                      );
                      if (printWindow) {
                        printWindow.addEventListener("load", () => {
                          setTimeout(() => {
                            printWindow.print();
                          }, 1000);
                        });
                      } else {
                        alert("Please allow pop-ups to print the receipt");
                      }
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Print
                  </button>
                </>
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

      {loading ? (
        <div className="flex justify-center my-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : paginatedPayments.length === 0 ? (
        <div className="bg-yellow-50 p-4 rounded-md mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                No payments found
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>No payments have been created yet.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Mentor
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
                  Date
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedPayments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{payment.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.mentor?.fullName || "Unknown"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{payment.totalAmount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payment.paymentDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPaymentStatusDisplay(payment.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      {payment.status === "PENDING" && (
                        <button
                          onClick={() =>
                            onUpdateStatus(payment.id, "COMPLETED")
                          }
                          className="text-green-600 hover:text-green-900"
                        >
                          Complete
                        </button>
                      )}
                      <button
                        onClick={() => handleViewReceipt(payment)}
                        className="flex items-center px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-900"
                      >
                        {payment.receiptUrl ? (
                          <>
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              ></path>
                            </svg>
                            Receipt Options
                            <span className="ml-1 text-xs">
                              (View/Print/Download)
                            </span>
                          </>
                        ) : (
                          "Create Receipt"
                        )}
                      </button>
                      {payment.receiptUrl && payment.receiptSent && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <svg
                            className="mr-1.5 h-2 w-2 text-green-400"
                            fill="currentColor"
                            viewBox="0 0 8 8"
                          >
                            <circle cx="4" cy="4" r="3" />
                          </svg>
                          Sent
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="mt-4 flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
            <div className="flex items-center">
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">{paginatedPayments.length}</span>{" "}
                of <span className="font-medium">{totalItems}</span> payments
              </p>
              <select
                value={pageSize}
                onChange={handlePageSizeChange}
                className="ml-4 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="5">5 per page</option>
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
                <option value="200">200 per page</option>
              </select>
            </div>

            <div className="flex-1 flex justify-center">
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  &larr;
                </button>

                {/* Enhanced pagination with first/last pages and ellipsis */}
                {(() => {
                  const pageNumbers = [];

                  // Always show first page
                  if (currentPage > 2) {
                    pageNumbers.push(
                      <button
                        key="first"
                        onClick={() => handlePageChange(0)}
                        className="relative inline-flex items-center px-4 py-2 border text-sm font-medium bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      >
                        1
                      </button>
                    );

                    // Add ellipsis if needed
                    if (currentPage > 3) {
                      pageNumbers.push(
                        <span
                          key="ellipsis-start"
                          className="relative inline-flex items-center px-4 py-2 border text-sm font-medium bg-white border-gray-300 text-gray-700"
                        >
                          ...
                        </span>
                      );
                    }
                  }

                  // Calculate range around current page
                  const startPage = Math.max(0, currentPage - 1);
                  const endPage = Math.min(totalPages - 1, currentPage + 1);

                  // Add pages around current page
                  for (let i = startPage; i <= endPage; i++) {
                    pageNumbers.push(
                      <button
                        key={i}
                        onClick={() => handlePageChange(i)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === i
                            ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {i + 1}
                      </button>
                    );
                  }

                  // Show ellipsis and last page if needed
                  if (currentPage < totalPages - 3) {
                    pageNumbers.push(
                      <span
                        key="ellipsis-end"
                        className="relative inline-flex items-center px-4 py-2 border text-sm font-medium bg-white border-gray-300 text-gray-700"
                      >
                        ...
                      </span>
                    );

                    pageNumbers.push(
                      <button
                        key="last"
                        onClick={() => handlePageChange(totalPages - 1)}
                        className="relative inline-flex items-center px-4 py-2 border text-sm font-medium bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      >
                        {totalPages}
                      </button>
                    );
                  }

                  return pageNumbers;
                })()}

                <button
                  onClick={() =>
                    handlePageChange(Math.min(totalPages - 1, currentPage + 1))
                  }
                  disabled={currentPage >= totalPages - 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  &rarr;
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reports Tab Component
function ReportsTab({ sessions, payments, mentors }) {
  const [activeTab, setActiveTab] = React.useState("overview");
  const [chartInstances, setChartInstances] = React.useState({});


  const sessionsChartRef = React.useRef(null);
  const paymentsChartRef = React.useRef(null);
  const sessionTypesChartRef = React.useRef(null);
  const paymentStatusChartRef = React.useRef(null);
  const gstFeeChartRef = React.useRef(null);

 
  const monthlyData = React.useMemo(() => {
    const now = new Date();
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(now.getMonth() - (5 - i));
      return {
        month: monthNames[d.getMonth()],
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        yearMonth: `${d.getFullYear()}-${d.getMonth() + 1}`,
      };
    });

   
    const sessionsPerMonth = last6Months.map((monthData) => {
      const count = sessions.filter((session) => {
        const sessionDate = new Date(session.sessionDateTime);
        return (
          sessionDate.getMonth() === monthData.monthIndex &&
          sessionDate.getFullYear() === monthData.year
        );
      }).length;
      return {
        ...monthData,
        count,
      };
    });

 
    const paymentsPerMonth = last6Months.map((monthData) => {
      const monthPayments = payments.filter((payment) => {
        const paymentDate = new Date(payment.paymentDate);
        return (
          paymentDate.getMonth() === monthData.monthIndex &&
          paymentDate.getFullYear() === monthData.year
        );
      });

      const amount = monthPayments.reduce(
        (sum, payment) => sum + parseFloat(payment.totalAmount || 0),
        0
      );

     
      const gst = monthPayments.reduce(
        (sum, payment) => sum + parseFloat(payment.gstAmount || 0),
        0
      );

     
      const platformFee = monthPayments.reduce(
        (sum, payment) => sum + parseFloat(payment.platformFee || 0),
        0
      );

      return {
        ...monthData,
        amount,
        count: monthPayments.length,
        gst,
        platformFee,
      };
    });

  
    const sessionTypes = {};
    sessions.forEach((session) => {
      const type = session.sessionType || "Unknown";
      sessionTypes[type] = (sessionTypes[type] || 0) + 1;
    });

   
    const paymentStatuses = {};
    payments.forEach((payment) => {
      const status = payment.status || "Unknown";
      paymentStatuses[status] = (paymentStatuses[status] || 0) + 1;
    });

    
    const totalGST = payments.reduce(
      (sum, payment) => sum + parseFloat(payment.gstAmount || 0),
      0
    );

    const totalPlatformFee = payments.reduce(
      (sum, payment) => sum + parseFloat(payment.platformFee || 0),
      0
    );

    return {
      sessionsPerMonth,
      paymentsPerMonth,
      sessionTypes,
      paymentStatuses,
      totalGST,
      totalPlatformFee,
    };
  }, [sessions, payments]);

 
  React.useEffect(() => {
  
    Object.values(chartInstances).forEach((chart) => {
      if (chart) {
        try {
          chart.destroy();
        } catch (err) {
          console.error("Error destroying chart:", err);
        }
      }
    });

    const newChartInstances = {};

   
    const ChartClass = window.Chart || window.ChartInstance;

    if (!ChartClass) {
      console.error("Chart.js is not available. Charts will not be rendered.");

    
      if (
        !document.querySelector('script[src="/js/ReportsChartFallback.js"]')
      ) {
        console.log("Loading fallback Chart implementation");
        const fallbackScript = document.createElement("script");
        fallbackScript.src = "/js/ReportsChartFallback.js";
        fallbackScript.onload = function () {
          console.log("Fallback loaded, updating charts");
          setChartInstances({}); 
        };
        document.body.appendChild(fallbackScript);
      }
      return;
    }

   
    const createChart = (ref, config) => {
      try {
        if (ref.current) {
          const ctx = ref.current.getContext("2d");
          return new ChartClass(ctx, config);
        }
        return null;
      } catch (err) {
        console.error("Error creating chart:", err);
        return null;
      }
    };

   
    if (
      activeTab === "overview" &&
      sessionsChartRef.current &&
      paymentsChartRef.current
    ) {
    
      const sessionsCtx = sessionsChartRef.current.getContext("2d");
      newChartInstances.sessions = createChart(sessionsChartRef, {
        type: "bar",
        data: {
          labels: monthlyData.sessionsPerMonth.map((d) => d.month),
          datasets: [
            {
              label: "Number of Sessions",
              data: monthlyData.sessionsPerMonth.map((d) => d.count),
              backgroundColor: "rgba(99, 102, 241, 0.7)",
              borderColor: "rgba(79, 70, 229, 1)",
              borderWidth: 1,
              borderRadius: 5,
              hoverBackgroundColor: "rgba(79, 70, 229, 0.9)",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: "top",
            },
            tooltip: {
              mode: "index",
              intersect: false,
              callbacks: {
                label: function (context) {
                  return `Sessions: ${context.raw}`;
                },
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                display: true,
                color: "rgba(0, 0, 0, 0.05)",
              },
            },
            x: {
              grid: {
                display: false,
              },
            },
          },
          animation: {
            duration: 1000,
            easing: "easeInOutQuad",
          },
        },
      });

      
      newChartInstances.payments = createChart(paymentsChartRef, {
        type: "bar",
        data: {
          labels: monthlyData.paymentsPerMonth.map((d) => d.month),
          datasets: [
            {
              label: "Total Amount (₹)",
              data: monthlyData.paymentsPerMonth.map((d) => d.amount),
              backgroundColor: "rgba(16, 185, 129, 0.7)",
              borderColor: "rgba(5, 150, 105, 1)",
              borderWidth: 1,
              borderRadius: 5,
              hoverBackgroundColor: "rgba(5, 150, 105, 0.9)",
              order: 1,
            },
            {
              label: "GST (₹)",
              data: monthlyData.paymentsPerMonth.map((d) => d.gst),
              backgroundColor: "rgba(245, 158, 11, 0.7)",
              borderColor: "rgba(217, 119, 6, 1)",
              borderWidth: 1,
              borderRadius: 5,
              hoverBackgroundColor: "rgba(217, 119, 6, 0.9)",
              order: 2,
            },
            {
              label: "Platform Fee (₹)",
              data: monthlyData.paymentsPerMonth.map((d) => d.platformFee),
              backgroundColor: "rgba(124, 58, 237, 0.7)",
              borderColor: "rgba(109, 40, 217, 1)",
              borderWidth: 1,
              borderRadius: 5,
              hoverBackgroundColor: "rgba(109, 40, 217, 0.9)",
              order: 3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: "top",
            },
            tooltip: {
              mode: "index",
              intersect: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                display: true,
                color: "rgba(0, 0, 0, 0.05)",
              },
            },
            x: {
              grid: {
                display: false,
              },
            },
          },
          animation: {
            duration: 1000,
            easing: "easeInOutQuad",
          },
        },
      });

      // GST and Platform Fee Chart
      newChartInstances.gstFee = createChart(gstFeeChartRef, {
        type: "doughnut",
        data: {
          labels: ["GST", "Platform Fee", "Net Amount"],
          datasets: [
            {
              data: [
                monthlyData.totalGST,
                monthlyData.totalPlatformFee,
                payments.reduce(
                  (sum, p) => sum + parseFloat(p.totalAmount || 0),
                  0
                ) -
                  monthlyData.totalGST -
                  monthlyData.totalPlatformFee,
              ],
              backgroundColor: [
                "rgba(245, 158, 11, 0.8)",
                "rgba(124, 58, 237, 0.8)",
                "rgba(16, 185, 129, 0.8)",
              ],
              borderColor: [
                "rgba(217, 119, 6, 1)",
                "rgba(109, 40, 217, 1)",
                "rgba(5, 150, 105, 1)",
              ],
              borderWidth: 1,
              hoverOffset: 15,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "right",
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const label = context.label || "";
                  const value = context.raw;
                  const total = context.chart.data.datasets[0].data.reduce(
                    (a, b) => a + b,
                    0
                  );
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: ₹${value.toFixed(2)} (${percentage}%)`;
                },
              },
            },
          },
          animation: {
            animateRotate: true,
            animateScale: true,
            duration: 1000,
            easing: "easeInOutQuad",
          },
        },
      });
    }

    if (activeTab === "sessions" && sessionTypesChartRef.current) {
      // Session Types Chart
      const sessionTypesData = Object.entries(monthlyData.sessionTypes);

      newChartInstances.sessionTypes = createChart(sessionTypesChartRef, {
        type: "pie",
        data: {
          labels: sessionTypesData.map(([type]) => type),
          datasets: [
            {
              data: sessionTypesData.map(([_, count]) => count),
              backgroundColor: [
                "rgba(99, 102, 241, 0.8)",
                "rgba(16, 185, 129, 0.8)",
                "rgba(245, 158, 11, 0.8)",
                "rgba(239, 68, 68, 0.8)",
                "rgba(124, 58, 237, 0.8)",
                "rgba(236, 72, 153, 0.8)",
              ],
              borderColor: [
                "rgba(79, 70, 229, 1)",
                "rgba(5, 150, 105, 1)",
                "rgba(217, 119, 6, 1)",
                "rgba(220, 38, 38, 1)",
                "rgba(109, 40, 217, 1)",
                "rgba(219, 39, 119, 1)",
              ],
              borderWidth: 1,
              hoverOffset: 15,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "right",
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const label = context.label || "";
                  const value = context.raw;
                  const total = context.chart.data.datasets[0].data.reduce(
                    (a, b) => a + b,
                    0
                  );
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: ${value} (${percentage}%)`;
                },
              },
            },
          },
          animation: {
            animateRotate: true,
            duration: 1000,
            easing: "easeInOutQuad",
          },
        },
      });
    }

    if (activeTab === "payments" && paymentStatusChartRef.current) {
      // Payment Status Chart
      const paymentStatusData = Object.entries(monthlyData.paymentStatuses);

      newChartInstances.paymentStatus = createChart(paymentStatusChartRef, {
        type: "doughnut",
        data: {
          labels: paymentStatusData.map(([status]) => status),
          datasets: [
            {
              data: paymentStatusData.map(([_, count]) => count),
              backgroundColor: [
                "rgba(16, 185, 129, 0.8)",
                "rgba(245, 158, 11, 0.8)",
                "rgba(239, 68, 68, 0.8)",
                "rgba(99, 102, 241, 0.8)",
                "rgba(124, 58, 237, 0.8)",
              ],
              borderColor: [
                "rgba(5, 150, 105, 1)",
                "rgba(217, 119, 6, 1)",
                "rgba(220, 38, 38, 1)",
                "rgba(79, 70, 229, 1)",
                "rgba(109, 40, 217, 1)",
              ],
              borderWidth: 1,
              hoverOffset: 15,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "right",
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const label = context.label || "";
                  const value = context.raw;
                  const total = context.chart.data.datasets[0].data.reduce(
                    (a, b) => a + b,
                    0
                  );
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: ${value} (${percentage}%)`;
                },
              },
            },
          },
          animation: {
            animateRotate: true,
            animateScale: true,
            duration: 1000,
            easing: "easeInOutQuad",
          },
        },
      });
    }

    // Apply all chart instances
    setChartInstances(newChartInstances);

    // Log chart creation results
    console.log(
      `Charts created for ${activeTab} tab:`,
      Object.keys(newChartInstances)
        .map(
          (key) => `${key}: ${newChartInstances[key] ? "success" : "failed"}`
        )
        .join(", ")
    );

    // Cleanup function
    return () => {
      Object.values(newChartInstances).forEach((chart) => {
        if (chart) {
          try {
            chart.destroy();
          } catch (err) {
            console.error("Error destroying chart:", err);
          }
        }
      });
    };
  }, [activeTab, monthlyData]);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Reports</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Sessions */}
        <div className="bg-white p-4 rounded-lg shadow-lg border-l-4 border-indigo-500 hover:shadow-xl transition-shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Total Sessions
          </h3>
          <p className="text-3xl font-bold text-indigo-600">
            {sessions.length}
          </p>
          <div className="mt-2 flex justify-between text-sm text-gray-500">
            <span>
              Pending: {sessions.filter((s) => s.status === "PENDING").length}
            </span>
            <span>
              Approved: {sessions.filter((s) => s.status === "APPROVED").length}
            </span>
          </div>
        </div>

        {/* Total Mentors */}
        <div className="bg-white p-4 rounded-lg shadow-lg border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Active Mentors
          </h3>
          <p className="text-3xl font-bold text-purple-600">{mentors.length}</p>
          <p className="mt-2 text-sm text-gray-500">
            With {sessions.filter((s) => s.status === "APPROVED").length}{" "}
            approved sessions
          </p>
        </div>

        {/* Total Payments */}
        <div className="bg-white p-4 rounded-lg shadow-lg border-l-4 border-green-500 hover:shadow-xl transition-shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Total Payments
          </h3>
          <p className="text-3xl font-bold text-green-600">
            ₹
            {payments
              .reduce(
                (sum, payment) => sum + parseFloat(payment.totalAmount || 0),
                0
              )
              .toFixed(2)}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Across {payments.length} payment transactions
          </p>
        </div>

        {/* Total GST */}
        <div className="bg-white p-4 rounded-lg shadow-lg border-l-4 border-amber-500 hover:shadow-xl transition-shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Total GST</h3>
          <p className="text-3xl font-bold text-amber-600">
            ₹{monthlyData.totalGST.toFixed(2)}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            {(
              (monthlyData.totalGST /
                payments.reduce(
                  (sum, payment) => sum + parseFloat(payment.totalAmount || 0),
                  0
                )) *
              100
            ).toFixed(1)}
            % of total payments
          </p>
        </div>

        {/* Total Platform Fee */}
        <div className="bg-white p-4 rounded-lg shadow-lg border-l-4 border-rose-500 hover:shadow-xl transition-shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Platform Fee
          </h3>
          <p className="text-3xl font-bold text-rose-600">
            ₹{monthlyData.totalPlatformFee.toFixed(2)}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            {(
              (monthlyData.totalPlatformFee /
                payments.reduce(
                  (sum, payment) => sum + parseFloat(payment.totalAmount || 0),
                  0
                )) *
              100
            ).toFixed(1)}
            % of total payments
          </p>
        </div>
      </div>

      {/* Tabs for different charts */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`${
                activeTab === "overview"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
            >
              Monthly Overview
            </button>
            <button
              onClick={() => setActiveTab("sessions")}
              className={`${
                activeTab === "sessions"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
            >
              Sessions Analysis
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              className={`${
                activeTab === "payments"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
            >
              Payment Analytics
            </button>
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === "overview" && (
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Monthly Sessions
                  </h3>
                  <div className="h-80">
                    <canvas ref={sessionsChartRef}></canvas>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Monthly Payments
                  </h3>
                  <div className="h-80">
                    <canvas ref={paymentsChartRef}></canvas>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-white p-4 rounded-lg shadow border border-gray-100">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Payment Distribution
                </h3>
                <div className="h-80">
                  <canvas ref={gstFeeChartRef}></canvas>
                </div>
              </div>
            </div>
          )}

          {activeTab === "sessions" && (
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Session Types Distribution
                  </h3>
                  <div className="h-80">
                    <canvas ref={sessionTypesChartRef}></canvas>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Session Status Summary
                  </h3>
                  <div className="overflow-hidden bg-white rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Count
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Percentage
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Visualization
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {["PENDING", "APPROVED", "PAID", "REJECTED"].map(
                          (status) => {
                            const count = sessions.filter(
                              (s) => s.status === status
                            ).length;
                            const percentage =
                              sessions.length > 0
                                ? ((count / sessions.length) * 100).toFixed(1)
                                : 0;

                            // Choose color based on status
                            const getStatusColor = (status) => {
                              switch (status) {
                                case "PENDING":
                                  return "bg-yellow-500";
                                case "APPROVED":
                                  return "bg-green-500";
                                case "PAID":
                                  return "bg-blue-500";
                                case "REJECTED":
                                  return "bg-red-500";
                                default:
                                  return "bg-gray-500";
                              }
                            };

                            return (
                              <tr key={status}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {status}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {count}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {percentage}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                      className={`h-2.5 rounded-full ${getStatusColor(
                                        status
                                      )}`}
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "payments" && (
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Payment Status Distribution
                  </h3>
                  <div className="h-80">
                    <canvas ref={paymentStatusChartRef}></canvas>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Payment Status Summary
                  </h3>
                  <div className="overflow-hidden bg-white rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Count
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            GST
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Platform Fee
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(monthlyData.paymentStatuses).map(
                          ([status, count]) => {
                            const statusPayments = payments.filter(
                              (p) => p.status === status
                            );
                            const amount = statusPayments.reduce(
                              (sum, payment) =>
                                sum + parseFloat(payment.totalAmount || 0),
                              0
                            );
                            const gst = statusPayments.reduce(
                              (sum, payment) =>
                                sum + parseFloat(payment.gstAmount || 0),
                              0
                            );
                            const platformFee = statusPayments.reduce(
                              (sum, payment) =>
                                sum + parseFloat(payment.platformFee || 0),
                              0
                            );

                            return (
                              <tr key={status}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {status}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {count}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  ₹{amount.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  ₹{gst.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  ₹{platformFee.toFixed(2)}
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Top Earning Mentors
                </h3>
                <div className="overflow-hidden bg-white rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mentor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sessions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Earnings
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          GST Paid
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Platform Fee
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {mentors
                        .map((mentor) => {
                          const mentorSessions = sessions.filter(
                            (s) => s.mentor && s.mentor.id === mentor.id
                          );
                          const earnings = mentorSessions.reduce(
                            (sum, session) =>
                              sum + parseFloat(session.finalPayoutAmount || 0),
                            0
                          );

                          // Calculate GST and platform fee for this mentor
                          const mentorPayments = payments.filter(
                            (p) => p.mentor && p.mentor.id === mentor.id
                          );
                          const gstPaid = mentorPayments.reduce(
                            (sum, payment) =>
                              sum + parseFloat(payment.gstAmount || 0),
                            0
                          );
                          const platformFee = mentorPayments.reduce(
                            (sum, payment) =>
                              sum + parseFloat(payment.platformFee || 0),
                            0
                          );

                          return {
                            mentor,
                            sessions: mentorSessions.length,
                            earnings,
                            gstPaid,
                            platformFee,
                          };
                        })
                        .sort((a, b) => b.earnings - a.earnings)
                        .slice(0, 5)
                        .map(
                          ({
                            mentor,
                            sessions: mentorSessions,
                            earnings,
                            gstPaid,
                            platformFee,
                          }) => (
                            <tr
                              key={mentor.id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {mentor.fullName || mentor.username}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {mentorSessions}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                                ₹{earnings.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-600">
                                ₹{gstPaid.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600">
                                ₹{platformFee.toFixed(2)}
                              </td>
                            </tr>
                          )
                        )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// MessagesTab Component
function MessagesTab({
  user,
  conversations,
  setConversations,
  messages,
  setMessages,
}) {
  const [currentConversation, setCurrentConversation] = React.useState(null);
  const [newMessage, setNewMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const messagesEndRef = React.useRef(null);

  const [mergedHistory, setMergedHistory] = React.useState(false);

  React.useEffect(() => {
    console.log(
      "MessagesTab initialized with",
      conversations?.length || 0,
      "conversations"
    );

    return () => {
      setMessages([]);
      setCurrentConversation(null);
    };
  }, []);

  const fetchMessages = async (conversationId) => {
    if (!conversationId) {
      console.error("No conversation ID provided");
      setError("Invalid conversation selected");
      return;
    }

    try {
      setLoading(true);
      setError("");
      console.log(
        `Fetching messages for conversation with ID: ${conversationId}`
      );

      const response = await axios.get(
        `/api/messages/conversation/${conversationId}`
      );

      console.log("Messages fetched:", response.data?.length || 0);

      const processedMessages = processChatHistory(response.data);
      setMessages(processedMessages);

      const foundConversation = conversations.find(
        (conv) =>
          conv && conv.id && conv.id.toString() === conversationId.toString()
      );

      if (foundConversation) {
        console.log("Setting current conversation:", foundConversation);
        setCurrentConversation(foundConversation);
      } else {
        console.warn(
          `Conversation with ID ${conversationId} not found in conversations list`
        );
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError(
        "Failed to load messages: " +
          (err.response?.data?.message || err.message)
      );
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const processChatHistory = (messages) => {
    if (!Array.isArray(messages)) {
      console.warn("Messages is not an array:", messages);
      return [];
    }

    console.log("Processing", messages.length, "messages");

    const messageMap = new Map();
    messages.forEach((message) => {
      if (message && message.id) {
        messageMap.set(message.id, message);
      } else {
        console.warn("Invalid message format (missing ID):", message);
      }
    });

    const uniqueMessages = Array.from(messageMap.values());
    uniqueMessages.sort((a, b) => {
      return new Date(a.sentAt || 0) - new Date(b.sentAt || 0);
    });

    console.log("Processed to", uniqueMessages.length, "unique messages");
    return uniqueMessages;
  };

  const refreshAllConversations = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("Refreshing all conversations");

      const response = await axios.get("/api/messages/conversations");
      console.log("Conversations response:", response.data);

      if (response.data && Array.isArray(response.data)) {
        const validConversations = response.data
          .filter((conv) => conv !== null)
          .map((conv) => ({
            ...conv,
            participants: Array.isArray(conv.participants)
              ? conv.participants.filter((p) => p !== null)
              : [],
            id:
              conv.id || `temp-${Math.random().toString(36).substring(2, 11)}`,
            lastMessage: conv.lastMessage || "",
            lastMessageTime: conv.lastMessageTime || null,
          }));

        console.log("Processed conversations:", validConversations);
        setConversations(validConversations);
        setMergedHistory(true);

        if (currentConversation && currentConversation.id) {
          await fetchMessages(currentConversation.id);
        } else if (validConversations.length > 0) {
          setCurrentConversation(validConversations[0]);
          await fetchMessages(validConversations[0].id);
        }
      } else {
        console.warn("Invalid conversations data format:", response.data);
        setConversations([]);
      }

      console.log("All conversations refreshed successfully");
    } catch (err) {
      console.error("Error refreshing conversations:", err);
      setError(
        "Failed to refresh conversations: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!currentConversation || !currentConversation.id) {
      setError("No conversation selected");
      return;
    }

    if (!newMessage.trim()) {
      console.warn("Empty message, not sending");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const messageData = {
        content: newMessage,
        recipient: {
          id: currentConversation.id,
        },
        sentAt: new Date().toISOString(),
      };

      console.log("Sending message:", messageData);
      const response = await axios.post("/api/messages", messageData);

      console.log("Message sent successfully:", response.data);

      // Add the new message to the existing messages
      if (response.data) {
        setMessages((prevMessages) => [...prevMessages, response.data]);
      }

      setNewMessage("");

      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      console.error("Error sending message:", err);
      setError(
        "Failed to send message: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  React.useEffect(() => {
    if (conversations.length === 0) {
      refreshAllConversations();
    }

    const intervalId = setInterval(() => {
      console.log("Auto-refreshing conversations...");
      refreshAllConversations();
    }, 30000); 

    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex h-[calc(100vh-200px)]">
      {/* Conversations sidebar */}
      <div className="w-1/3 bg-gray-50 border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Conversations</h2>
          <button
            onClick={refreshAllConversations}
            className="text-xs bg-blue-500 hover:bg-blue-600 text-white rounded px-2 py-1"
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {conversations.length === 0 ? (
          <div className="p-4 text-gray-500">No conversations found</div>
        ) : (
          <ul>
            {conversations.map((conversation) =>
              conversation && conversation.id ? (
                <li
                  key={conversation.id}
                  onClick={() => fetchMessages(conversation.id)}
                  className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 ${
                    currentConversation?.id === conversation.id
                      ? "bg-indigo-50"
                      : ""
                  }`}
                >
                  <div className="font-medium text-gray-900">
                    {conversation.participants &&
                    Array.isArray(conversation.participants)
                      ? conversation.participants
                          .filter((p) => p && p.id !== user.id)
                          .map((p) => p?.fullName || p?.username || "Unknown")
                          .join(", ")
                      : "Unknown Participants"}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {conversation.lastMessage || "Start a conversation"}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {conversation.lastMessageTime
                      ? new Date(conversation.lastMessageTime).toLocaleString()
                      : ""}
                  </div>
                </li>
              ) : null
            )}
          </ul>
        )}
      </div>

      {/* Messages area */}
      <div className="w-2/3 flex flex-col bg-white">
        {currentConversation ? (
          <>
            {/* Conversation header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                {currentConversation.participants &&
                Array.isArray(currentConversation.participants)
                  ? currentConversation.participants
                      .filter((p) => p && p.id !== user.id)
                      .map((p) => p?.fullName || p?.username || "Unknown")
                      .join(", ")
                  : "Unknown"}
              </h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 messages-container">
              {loading && messages.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-10 w-10"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex justify-center items-center h-full text-gray-500">
                  No messages yet. Start a conversation!
                </div>
              ) : (
                messages.map((message, index) =>
                  message && message.id ? (
                    <div
                      key={message.id}
                      className={`mb-4 flex ${
                        message.sender && message.sender.id === user.id
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          message.sender && message.sender.id === user.id
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <div className="text-sm">{message.content || ""}</div>
                        <div className="text-xs mt-1 opacity-70">
                          {message.sentAt
                            ? new Date(message.sentAt).toLocaleString()
                            : ""}
                        </div>
                      </div>
                    </div>
                  ) : null
                )
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="p-4 border-t border-gray-200">
              {error && (
                <div className="mb-2 text-sm text-red-600">{error}</div>
              )}
              <form onSubmit={sendMessage} className="flex">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="rounded-r-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                  disabled={loading || !newMessage.trim()}
                >
                  {loading ? "Sending..." : "Send"}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex justify-center items-center h-full text-gray-500">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
