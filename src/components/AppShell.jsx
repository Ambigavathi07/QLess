import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import { SignOut } from "@phosphor-icons/react";

export default function AppShell({ title, subtitle, children, actions }) {
    const { user, logout } = useAuth();
    return (
        <div className="min-h-screen bg-[#F9F9F7] grain">
            <header className="border-b border-[#E2E5E0] bg-[#F9F9F7]">
                <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="flex items-center gap-2" data-testid="qless-brand">
                            <div className="w-9 h-9 rounded-lg bg-[#2A4B41] text-white grid place-items-center font-heading font-black">
                                Q
                            </div>
                            <div>
                                <div className="font-heading font-black tracking-tight text-lg leading-none">QLess</div>
                                <div className="text-[10px] tracking-[0.25em] uppercase text-[#5C6661]">Queue OS</div>
                            </div>
                        </Link>
                        <div className="hidden md:block w-px h-8 bg-[#E2E5E0]" />
                        <div className="hidden md:block">
                            <div className="font-heading text-xl tracking-tight">{title}</div>
                            {subtitle && <div className="text-xs text-[#5C6661]">{subtitle}</div>}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {actions}
                        {user && (
                            <>
                                <div className="hidden sm:block text-right">
                                    <div className="text-sm font-medium">{user.name}</div>
                                    <div className="text-[10px] tracking-[0.2em] uppercase text-[#5C6661]">
                                        {user.role.replace("_", " ")}
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={logout}
                                    data-testid="logout-btn"
                                    className="border-[#E2E5E0] hover:bg-[#EDEDE8]"
                                >
                                    <SignOut size={16} className="mr-1.5" /> Logout
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
        </div>
    );
}
