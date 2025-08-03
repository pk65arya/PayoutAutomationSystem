const AuthContext = React.createContext();

const API_URL = window.location.origin;

axios.defaults.baseURL = API_URL;
axios.defaults.headers.common["Content-Type"] = "application/json";

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      const formattedToken = token.startsWith("Bearer ")
        ? token
        : `Bearer ${token}`;
      config.headers["Authorization"] = formattedToken;

    
      const tokenPreview =
        token.length > 10 ? token.substring(0, 10) + "..." : token;
      console.log("Adding token to request:", `Bearer ${tokenPreview}`);
    } else {
      console.log("No auth token available for request");
    }

   
    if (config.method === "post" || config.method === "put") {
      config.headers["Content-Type"] = "application/json";
    }

    console.log("Axios request:", config.method, config.url);
    return config;
  },
  (error) => {
    console.error("Axios request error:", error);
    return Promise.reject(error);
  }
);


axios.interceptors.response.use(
  (response) => {
    
    console.log("Axios response:", response.status, response.config.url);
    return response;
  },
  (error) => {
    
    console.error(
      "Axios response error:",
      error.response ? error.response.status : "No response",
      error.config ? error.config.url : "Unknown URL"
    );

    
    return Promise.reject(error);
  }
);


function App() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [authError, setAuthError] = React.useState(null);

 
  React.useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    console.log("Checking authentication status:");
    console.log("- Token exists:", !!token);
    console.log("- Saved user exists:", !!savedUser);

    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        console.log("User authenticated:", userData.username);
        console.log("User roles:", userData.roles);
        setUser(userData);
      } catch (error) {
        console.error("Error parsing user from localStorage", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setAuthError("Invalid user data format. Please log in again.");
      }
    } else {
      console.log("No authentication found, user must log in");
      // Clear any partial auth data
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    }

    setLoading(false);
  }, []);

 
  const login = (token, userData) => {
    console.log("Login function called with user:", userData.username);

   
    const tokenToStore = token.startsWith("Bearer ")
      ? token.substring(7)
      : token;

   
    localStorage.setItem("token", tokenToStore);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setAuthError(null);
  };

 
  const logout = () => {
    console.log("Logout function called");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const authContextValue = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.roles?.some((role) =>
      typeof role === "string"
        ? role === "ROLE_ADMIN" || role === "ADMIN"
        : role?.name === "ROLE_ADMIN" || role?.name === "ADMIN"
    ),
    isMentor: user?.roles?.some((role) =>
      typeof role === "string"
        ? role === "ROLE_MENTOR" || role === "MENTOR"
        : role?.name === "ROLE_MENTOR" || role?.name === "MENTOR"
    ),
    authError,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      {authError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded fixed top-0 left-0 right-0 m-4 z-50">
          <span className="font-bold">Authentication Error:</span> {authError}.
          <button
            className="ml-2 underline"
            onClick={() => (window.location.href = "/")}
          >
            Go to login
          </button>
        </div>
      )}
      {user ? <Dashboard /> : <Auth />}
    </AuthContext.Provider>
  );
}

function Dashboard() {
  const { user, logout, isAdmin } = React.useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gradient-to-r from-indigo-600 to-purple-700 shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {/* EdTech Logo */}
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-9 w-9 text-white"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    strokeWidth="2"
                    stroke="white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="ml-2 text-xl font-bold text-white tracking-tight">
                  EdTech
                </span>
              </div>
              <h1 className="hidden sm:block text-xl font-semibold text-white">
                Payout Automation System
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-white bg-opacity-20 rounded-full py-1 px-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="ml-2 text-sm font-medium text-white">
                  {user.fullName}
                </span>
              </div>
              <button
                onClick={logout}
                className="bg-white text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414l-5.707-5.707A1 1 0 0010 2H3zm9 2.414L15.414 7H12V5.414z"
                    clipRule="evenodd"
                  />
                  <path d="M3 7h6v2H3V7zm0 4h6v2H3v-2zm0 4h6v2H3v-2zm8-8h2v6h-2V7z" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-4">
        {isAdmin ? <AdminDashboard /> : <MentorDashboard />}
      </div>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
