import { createContext, useContext, useEffect, useState } from "react";
import { api, formatApiError } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null); // null = loading, false = unauth, obj = auth
    const [error, setError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");


        if (token) {
            setUser({
                role: localStorage.getItem("role"),
                name: localStorage.getItem("name"),
                hospitalId: localStorage.getItem("hospitalId"),
                doctorId: localStorage.getItem("doctorId"),
                userId: localStorage.getItem("userId"),
            });
        }


        else {
            setUser(false);
        }
    }, []);

    async function login(email, password) {
        setError("");

        try {
            const { data } = await api.post("/auth/login", {
                email,
                password,
            });

            console.log("LOGIN RESPONSE:", data);

            // Save JWT token
            localStorage.setItem("token", data.token);
            localStorage.setItem("role", data.role);
            localStorage.setItem("name", data.name);
            localStorage.setItem("hospitalId", data.hospitalId);
            localStorage.setItem("doctorId", data.doctorId); // ADD THIS
            // Create user object from API response
            const user = {
                userId: data.userId,
                email: data.email,
                role: data.role?.toLowerCase(),
                name: data.name,
                hospitalId: data.hospitalId,
                doctorId: data.doctorId, // ADD THIS
            };

            setUser(user);

            return user;
        } catch (e) {
            const msg = formatApiError(e.response?.data?.detail) || e.message;
            setError(msg);
            throw new Error(msg);
        }
    }

    async function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("name");
        localStorage.removeItem("email");

        setUser(false);

        window.location.href = "/login";
    }

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, error }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);