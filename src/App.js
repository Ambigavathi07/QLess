import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import "./App.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import SuperAdmin from "./pages/SuperAdmin";
import HospitalAdmin from "./pages/HospitalAdmin";
import Reception from "./pages/Reception";
import Doctor from "./pages/Doctor";
import Pharmacy from "./pages/Pharmacy";
import DisplayBoard from "./pages/DisplayBoard";
import PatientView from "./pages/PatientView";
import PatientRegister from "./pages/PatientRegister";
import SearchResults from "./pages/SearchResults";
import HospitalDetail from "./pages/HospitalDetail";
import BookToken from "./pages/BookToken";

function RoleGate({ roles, children }) {
    const { user } = useAuth();
    if (user === null) return <div className="p-10 text-muted-foreground">Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(user.role))
        return <Navigate to="/" replace />;
    return children;
}

function StaffRedirect() {
    const { user } = useAuth();
    if (user === null) return <div className="p-10 text-muted-foreground">Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;
    const map = {
        super_admin: "/super-admin",
        hospital_admin: "/admin",
        receptionist: "/reception",
        doctor: "/doctor",
        pharmacist: "/pharmacy",
    };
    return <Navigate to={map[user.role] || "/"} replace />;
}

function App() {
    return (
        <div className="App">
            <Toaster position="top-right" richColors />
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/search" element={<SearchResults />} />
                        <Route path="/hospitals/:hospitalId" element={<HospitalDetail />} />
                        <Route path="/book/:doctorId" element={<BookToken />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/staff" element={<StaffRedirect />} />
                        <Route path="/display/:hospitalId" element={<DisplayBoard />} />
                        <Route path="/q/:qrToken" element={<PatientView />} />
                        <Route path="/qr/:hospitalId" element={<PatientRegister />} />
                        <Route path="/super-admin" element={<RoleGate roles={["super_admin"]}><SuperAdmin /></RoleGate>} />
                        <Route path="/admin" element={<RoleGate roles={["hospital_admin"]}><HospitalAdmin /></RoleGate>} />
                        <Route path="/reception" element={<RoleGate roles={["receptionist", "hospital_admin"]}><Reception /></RoleGate>} />
                        <Route path="/doctor" element={<RoleGate roles={["doctor"]}><Doctor /></RoleGate>} />
                        <Route path="/pharmacy" element={<RoleGate roles={["pharmacist", "hospital_admin"]}><Pharmacy /></RoleGate>} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </div>
    );
}

export default App;
