import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const   AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        // Try to parse the stored user object
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        console.log("✅ User loaded from localStorage:", parsedUser);
      } catch (error) {
        console.error("Failed to parse stored user data:", error);
        // Fallback: try to get individual items
        const storedRole = localStorage.getItem("role");
        if (storedRole) {
          setToken(storedToken);
          setUser({
            role: storedRole,
            email: localStorage.getItem("email"),
            name: localStorage.getItem("name"),
          });
        }
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, authToken) => {
    setToken(authToken);
    setUser(userData);
    
    // Store in localStorage - Save complete user object
    localStorage.setItem("token", authToken);
    localStorage.setItem("user", JSON.stringify(userData)); // ✅ Save complete user object
    localStorage.setItem("role", userData.role);
    localStorage.setItem("email", userData.email);
    localStorage.setItem("name", userData.name);
    
    // ✅ Store organizationId for easy access by components
    if (userData.organizationId) {
      localStorage.setItem("organizationId", userData.organizationId);
    }
    
    console.log("✅ Login successful - User data saved:", userData);
    console.log("✅ Organization ID saved:", userData.organizationId);
  };

  const logout = () => {
    console.log("[LOGOUT] Starting logout process");
    
    // Clear localStorage first
    localStorage.removeItem("token");
    localStorage.removeItem("user"); // ✅ Remove user object
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("name");
    localStorage.removeItem("organizationId"); // ✅ Remove organizationId
    console.log("[LOGOUT] Cleared localStorage");
    
    // Update state
    setToken(null);
    setUser(null);
    console.log("[LOGOUT] Cleared state");
    
    // Use hard redirect to bypass ProtectedRoute check
    console.log("[LOGOUT] Redirecting to /organization");
    window.location.href = "/organization";
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const hasRole = (allowedRoles) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
