import { useEffect, useState, useCallback } from "react";
import { api, formatApiError } from "../lib/api";
import AppShell from "../components/AppShell";
import { Button } from "../components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Pill, Check, CurrencyInr, Clock } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useHospitalSocket } from "../hooks/useHospitalSocket";

export default function Pharmacy() {
    const { user } = useAuth();
    const [status, setStatus] = useState("pending");
    const [list, setList] = useState([]);
    const [summary, setSummary] = useState(null);

    const load = useCallback(async () => {
        try {
            const [l, s] = await Promise.all([
                api.get(`/pharmacy/medications?status=${status}`),
                api.get("/pharmacy/summary"),
            ]);
            setList(l.data); setSummary(s.data);
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail) || e.message);
        }
    }, [status]);

    useEffect(() => { load(); }, [load]);
    useHospitalSocket(user?.hospital_id, () => load());

    async function act(id, action) {
        try {
            await api.post(`/pharmacy/medications/${id}/${action}`);
            toast.success(action === "dispense" ? "Dispensed" : "Marked paid");
            load();
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail) || e.message);
        }
    }

    // group by patient+token for readability
    const grouped = {};
    list.forEach((m) => {
        const key = `${m.token_id}|${m.patient_phone}`;
        if (!grouped[key]) grouped[key] = { patient_name: m.patient_name, patient_phone: m.patient_phone, token_id: m.token_id, meds: [] };
        grouped[key].meds.push(m);
    });
    const groups = Object.values(grouped);

    return (
        <AppShell title="Pharmacy" subtitle="Dispense & payment">
            {summary && (
                <div className="grid md:grid-cols-4 gap-5 mb-8">
                    {[
                        { label: "Pending", value: summary.pending, icon: Pill },
                        { label: "Dispensed unpaid", value: summary.dispensed_unpaid, icon: Clock },
                        { label: "Paid today", value: summary.paid, icon: Check },
                        { label: "Revenue ₹", value: `${summary.revenue_today}`, icon: CurrencyInr },
                    ].map((s) => (
                        <div key={s.label} className="p-5 bg-white border border-[#E2E5E0] rounded-xl" data-testid={`pharmacy-stat-${s.label.toLowerCase().replace(/[^a-z]/g, "-")}`}>
                            <div className="flex items-center justify-between">
                                <div className="text-[11px] tracking-[0.25em] uppercase font-bold text-[#5C6661]">{s.label}</div>
                                <s.icon size={18} className="text-[#2A4B41]" />
                            </div>
                            <div className="font-heading text-3xl font-black tracking-tight mt-2">{s.value}</div>
                        </div>
                    ))}
                </div>
            )}

            <Tabs value={status} onValueChange={setStatus}>
                <TabsList className="bg-[#EDEDE8] border border-[#E2E5E0]">
                    <TabsTrigger value="pending" data-testid="pharmacy-tab-pending">Pending</TabsTrigger>
                    <TabsTrigger value="dispensed" data-testid="pharmacy-tab-dispensed">Dispensed — unpaid</TabsTrigger>
                    <TabsTrigger value="paid" data-testid="pharmacy-tab-paid">Paid</TabsTrigger>
                </TabsList>
                <TabsContent value={status} className="mt-6 space-y-4">
                    {groups.length === 0 && <div className="p-10 text-center text-[#5C6661] bg-white border border-[#E2E5E0] rounded-xl">No items in this list.</div>}
                    {groups.map((g) => (
                        <div key={g.token_id} className="bg-white border border-[#E2E5E0] rounded-xl overflow-hidden" data-testid={`pharmacy-group-${g.token_id}`}>
                            <div className="p-4 border-b border-[#E2E5E0] flex items-center justify-between">
                                <div>
                                    <div className="font-heading font-bold text-lg tracking-tight">{g.patient_name}</div>
                                    <div className="text-xs text-[#5C6661] font-mono">{g.patient_phone}</div>
                                </div>
                                <div className="text-[11px] tracking-[0.2em] uppercase font-bold text-[#5C6661]">
                                    {g.meds.length} items · ₹ {g.meds.reduce((a, m) => a + (m.price || 0), 0).toFixed(2)}
                                </div>
                            </div>
                            <ul className="divide-y divide-[#E2E5E0]">
                                {g.meds.map((m) => (
                                    <li key={m.id} className="p-4 flex items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="font-medium">{m.name} <span className="text-xs text-[#5C6661] font-normal">· {m.dosage} · {m.frequency} · {m.duration}</span></div>
                                            {m.notes && <div className="text-xs text-[#5C6661] mt-0.5">{m.notes}</div>}
                                        </div>
                                        <div className="w-20 text-right font-mono font-bold">₹{(m.price || 0).toFixed(2)}</div>
                                        <div className="flex gap-2">
                                            {!m.dispensed && (
                                                <Button size="sm" onClick={() => act(m.id, "dispense")}
                                                    className="bg-[#2A4B41] hover:bg-[#1E362E] text-white" data-testid={`dispense-${m.id}`}>
                                                    Dispense
                                                </Button>
                                            )}
                                            {!m.paid && (
                                                <Button size="sm" variant="outline" onClick={() => act(m.id, "pay")}
                                                    className="border-[#D36A50] text-[#D36A50] hover:bg-[#D36A50] hover:text-white" data-testid={`pay-${m.id}`}>
                                                    Mark paid
                                                </Button>
                                            )}
                                            {m.paid && <span className="text-xs font-bold text-[#2A4B41] px-3 py-1 bg-[#DCE0D9] rounded-full">PAID</span>}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </TabsContent>
            </Tabs>
        </AppShell>
    );
}
