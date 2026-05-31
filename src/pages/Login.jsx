import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { ArrowRight } from "@phosphor-icons/react";
import { Eye, EyeSlash } from "@phosphor-icons/react";

const DEMO = [
  {
    role: "Hospital Admin",
    email: "admin@cityhospital.com",
    password: "admin123",
  },
  {
    role: "Receptionist",
    email: "reception@cityhospital.com",
    password: "recep123",
  },
  {
    role: "Pharmacist",
    email: "pharmacy@cityhospital.com",
    password: "pharma123",
  },
  {
    role: "Doctor (Sharma)",
    email: "dr.sharma@cityhospital.com",
    password: "doctor123",
  },
  {
    role: "Doctor (Patel)",
    email: "dr.patel@cityhospital.com",
    password: "doctor123",
  },
  { role: "Super Admin", email: "super@qless.io", password: "super123" },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const u = await login(email, password);

      console.log("LOGIN USER:", u);

      toast.success(`Welcome, ${u.name}`);

      const map = {
        super_admin: "/super-admin",
        hospital_admin: "/admin",
        receptionist: "/reception",
        doctor: "/doctor",
        pharmacist: "/pharmacy",
      };
      console.log("LOGIN USER:", u);
      console.log("ROLE:", u.role);
      const roleRoutes = {
        super_admin: "/super-admin",
        admin: "/admin",
        receptionist: "/reception",
        doctor: "/doctor",
        pharmacist: "/pharmacy",
      };

      navigate(roleRoutes[u.role?.toLowerCase()] || "/", {
        replace: true,
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function fill(d) {
    setEmail(d.email);
    setPassword(d.password);
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-[#F9F9F7]">
      <div className="hidden md:flex flex-col justify-between bg-[#2A4B41] text-white p-12 relative overflow-hidden">
        <Link
          to="/"
          className="flex items-center gap-2"
          data-testid="login-brand"
        >
          <div className="w-9 h-9 rounded-lg bg-white text-[#2A4B41] grid place-items-center font-heading font-black">
            Q
          </div>
          <div className="font-heading font-black tracking-tight text-xl">
            QLess
          </div>
        </Link>
        <div>
          <div className="text-[11px] tracking-[0.3em] uppercase text-white/60 font-bold">
            Queue OS
          </div>
          <h1 className="font-heading text-4xl lg:text-5xl font-black tracking-tight mt-4 leading-tight">
            A calmer waiting room starts at the dashboard.
          </h1>
          <p className="text-white/70 mt-6 max-w-md leading-relaxed">
            Sign in to manage doctors, tokens and live queues across your
            hospital.
          </p>
        </div>
        <div className="text-xs text-white/40">© 2026 QLess</div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="text-xs tracking-[0.25em] uppercase font-bold text-[#5C6661]">
            Sign in
          </div>
          <h2 className="font-heading text-3xl font-black tracking-tight mt-2">
            Welcome back.
          </h2>
          <p className="text-sm text-[#5C6661] mt-2">
            Use your QLess staff credentials.
          </p>

          <form
            onSubmit={onSubmit}
            className="mt-8 space-y-5"
            autoComplete="off"
          >
            {" "}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter Email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 h-11 border-[#E2E5E0]"
                required
                data-testid="login-email-input"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter Password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 border-[#E2E5E0] pr-10"
                  required
                  data-testid="login-password-input"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-11 bg-[#2A4B41] hover:bg-[#1E362E] text-white"
              data-testid="login-submit-btn"
            >
              {submitting ? (
                "Signing in..."
              ) : (
                <>
                  Sign in <ArrowRight size={16} className="ml-1.5" />
                </>
              )}
            </Button>
          </form>

         {/* <div className="mt-8 border-t border-[#E2E5E0] pt-6">
            <div className="text-[11px] tracking-[0.25em] uppercase font-bold text-[#5C6661] mb-3">
              Demokkk accounts — click to fill
            </div>
            <div className="space-y-2">
              {DEMO.map((d) => (
                <button 
                  key={d.email}
                  type="button"
                  onClick={() => fill(d)}
                  className="w-full text-left p-3 rounded-lg border border-[#E2E5E0] hover:border-[#2A4B41] hover:bg-[#EDEDE8] transition-colors"
                  data-testid={`demo-${d.role.toLowerCase().replace(/[^a-z]/g, "-")}-btn`}
                >
                  <div className="font-medium text-sm">{d.role}</div>
                  <div className="text-xs text-[#5C6661] font-mono mt-0.5">
                    {d.email}
                  </div>
                </button>
              ))}
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
