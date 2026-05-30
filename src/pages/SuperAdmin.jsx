import { useEffect, useState } from "react";
import { api, formatApiError } from "../lib/api";
import AppShell from "../components/AppShell";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Buildings, Plus, Stethoscope, Ticket } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function SuperAdmin() {
    const [list, setList] = useState([]);
    const [open, setOpen] = useState(false);
const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
});
    const [loading, setLoading] = useState(false);

    async function load() {
        try {
            const r = await api.get("/hospitals");
            setList(r.data);
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail) || e.message);
        }
    }
    useEffect(() => { load(); }, []);

    async function submit(e) {
        e.preventDefault();
        setLoading(true);
        try {
await api.post("/hospitals", {
    name: form.name,
    address: form.address,
    city: form.city,
    phone: form.phone,
    adminName: form.adminName,
    adminEmail: form.adminEmail,
    adminPassword: form.adminPassword,
});            toast.success("Hospital onboarded");
            setOpen(false);
setForm({
    name: "",
    address: "",
    city: "",
    phone: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
});            load();
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail) || e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <AppShell title="Super Admin" subtitle="Manage hospitals on QLess"
            actions={
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#2A4B41] hover:bg-[#1E362E] text-white" data-testid="onboard-hospital-btn">
                            <Plus size={16} className="mr-1.5" /> Onboard hospital
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="font-heading tracking-tight">Onboard a new hospital</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={submit} className="space-y-4">
                            {[
    ["name", "Hospital name"],
    ["address", "Address"],
    ["city", "City"],
    ["phone", "Phone"],
    ["adminName", "Admin full name"],
    ["adminEmail", "Admin email", "email"],
    ["adminPassword", "Admin password", "password"],
].map(([k, label, type]) => (
                                <div key={k}>
                                    <Label htmlFor={k}>{label}</Label>
                                    <Input id={k} type={type || "text"} value={form[k]}
                                        onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                                        className="mt-1.5 h-10 border-[#E2E5E0]" required
                                        data-testid={`onboard-field-${k}`} />
                                </div>
                            ))}
                            <Button type="submit" disabled={loading}
                                className="w-full bg-[#2A4B41] hover:bg-[#1E362E] text-white"
                                data-testid="onboard-submit-btn">
                                {loading ? "Creating..." : "Create hospital"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            }>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
                {[
                    { label: "Total hospitals", value: list.length, icon: Buildings },
                    { label: "Total doctors", value: list.reduce((a, h) => a + (h.doctors_count || 0), 0), icon: Stethoscope },
                    { label: "Tokens today", value: list.reduce((a, h) => a + (h.tokens_today || 0), 0), icon: Ticket },
                ].map((s) => (
                    <div key={s.label} className="p-6 bg-white border border-[#E2E5E0] rounded-xl" data-testid={`stat-${s.label.toLowerCase().replace(/\s/g, "-")}`}>
                        <div className="flex items-center justify-between">
                            <div className="text-[11px] tracking-[0.25em] uppercase font-bold text-[#5C6661]">{s.label}</div>
                            <s.icon size={20} className="text-[#2A4B41]" />
                        </div>
                        <div className="font-heading text-4xl font-black tracking-tight mt-3">{s.value}</div>
                    </div>
                ))}
            </div>

            <div className="bg-white border border-[#E2E5E0] rounded-xl overflow-hidden">
                <div className="p-5 border-b border-[#E2E5E0]">
                    <div className="font-heading text-xl font-bold tracking-tight">Hospitals</div>
                </div>
                <table className="w-full text-sm" data-testid="hospitals-table">
                    <thead>
                        <tr className="text-[11px] tracking-[0.2em] uppercase text-[#5C6661] bg-[#F9F9F7]">
                            <th className="text-left p-4 font-bold">Name</th>
                            <th className="text-left p-4 font-bold">Address</th>
                            <th className="text-left p-4 font-bold">Doctors</th>
                            <th className="text-left p-4 font-bold">Tokens Today</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.length === 0 && (
                            <tr><td colSpan="4" className="p-10 text-center text-[#5C6661]">No hospitals yet.</td></tr>
                        )}
                        {list.map((h) => (
                            <tr key={h.id} className="border-t border-[#E2E5E0] hover:bg-[#EDEDE8]">
                                <td className="p-4 font-medium">{h.name}</td>
                                <td className="p-4 text-[#5C6661]">{h.address}</td>
                                <td className="p-4 font-mono">{h.doctors_count}</td>
                                <td className="p-4 font-mono">{h.tokens_today}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AppShell>
    );
}
