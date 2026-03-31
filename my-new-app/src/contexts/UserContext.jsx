import { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (token) {
      axios.get("/api/users/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        const u = res.data;
        setUser({ 
          id: u.id, 
          name: u.fullName || u.full_name || u.email?.split("@")[0], 
          email: u.email,
          phone: u.phone,
          role: u.role, 
          plan: u.plan,
          avatarUrl: u.avatar_url || u.avatarUrl,
          token 
        });
      })
      .catch((err) => {
        console.error("Token invalid or expired", err);
        localStorage.removeItem("userToken");
      });
    }
  }, []);

  const login = (userData) => setUser(userData);
  
  const logout = () => {
    localStorage.removeItem("userToken");
    setUser(null);
  };

  const updateUser = (updatedData) => {
    setUser(prev => ({ ...prev, ...updatedData }));
  };

  return (
    <UserContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
