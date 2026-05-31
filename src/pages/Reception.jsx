import { useEffect, useState, useCallback } from "react";
import { api, formatApiError } from "../lib/api";
import AppShell from "../components/AppShell";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Ticket, Printer, SkipForward, PencilSimple, XCircle, Phone, CurrencyInr } from "@phosphor-icons/react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useHospitalSocket } from "../hooks/useHospitalSocket";

const SESSIONS = ["morning", "evening"];

export default function Reception() {
    const { user } = useAuth();
    const [doctors, setDoctors] = useState([]);
    const [tokens, setTokens] = useState([]);
    const [session, setSession] = useState("morning");
    const [form, setForm] = useState({
        doctor_id: "", patient_name: "", patient_phone: "", patient_age: "",
        priority: "normal", session: "morning",
    });
    const [slip, setSlip] = useState(null);
    const [editing, setEditing] = useState(null);
    const [paymentFor, setPaymentFor] = useState(null);
    const [callingId, setCallingId] = useState(null);
console.log("USER", user);
console.log("HOSPITAL ID", user?.hospitalId);
 const load = useCallback(async () => {
    try {
        console.log("Hospital ID:", user?.hospitalId);

        if (!user?.hospitalId) return;

        const doctorResponse = await api.get(
            `/doctors/hospital/${user.hospitalId}`
        );

        console.log("Doctors:", doctorResponse.data);

        setDoctors(doctorResponse.data);

        if (
            !form.doctor_id &&
            doctorResponse.data.length > 0
        ) {
            setForm((f) => ({
                ...f,
                doctor_id: doctorResponse.data[0].id
            }));
        }
    } catch (e) {
        console.error(e);
        toast.error(
            formatApiError(
                e.response?.data?.detail
            ) || e.message
        );
    }
}, [user?.hospitalId]);

    useEffect(() => { load(); }, [load]);
    useHospitalSocket(user?.hospitalId, () => load());

    async function submit(e) {
        e.preventDefault();
        try {
const r = await api.post("/tokens", {
    hospitalId: user.hospitalId,
    doctorId: form.doctor_id,
    patientName: form.patient_name,
    patientPhone: form.patient_phone,
    patientAge: form.patient_age
        ? Number(form.patient_age)
        : 0,
    priority: form.priority,
    session: form.session
});
            toast.success(`Token #${r.data.token_number} issued`);
            setSlip(r.data);
            setForm((f) => ({ ...f, patient_name: "", patient_phone: "", patient_age: "", priority: "normal" }));
            load();
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail) || e.message);
        }
    }

    async function skip(id) {
        try {
            await api.post(`/reception/tokens/${id}/skip`);
            toast.success("Token moved to the back of the queue");
            load();
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail) || e.message);
        }
    }

    async function cancel(id) {
        try {
            await api.post(`/tokens/${id}/cancel`);
            toast.success("Token cancelled");
            load();
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail) || e.message);
        }
    }

    async function saveReassign(patch) {
        try {
            await api.post(`/reception/tokens/${editing.id}/reassign`, patch);
            toast.success("Token updated");
            setEditing(null);
            load();
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail) || e.message);
        }
    }

    async function callNext(doctorId) {
        if (callingId) return; // debounce
        setCallingId(doctorId);
        try {
            await api.post("/queue/call-next", { doctor_id: doctorId, session });
            toast.success("Next patient called");
            load();
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail) || e.message);
        } finally {
            setTimeout(() => setCallingId(null), 800);
        }
    }

const byDoctor = doctors.map((d) => ({
    ...d,
    tokens: []
}));

    return (
        <AppShell title="Reception" subtitle="Tokens · payments · queue control"
            actions={
                <Select value={session} onValueChange={setSession}>
                    <SelectTrigger className="w-[140px] h-9 border-[#E2E5E0]" data-testid="reception-global-session"><SelectValue /></SelectTrigger>
                    <SelectContent>{SESSIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
            }>
            <div className="grid lg:grid-cols-12 gap-6">
                {/* Form */}
                <div className="lg:col-span-5">
                    <div className="bg-white border border-[#E2E5E0] rounded-xl p-6 sticky top-6">
                        <div className="font-heading text-xl font-bold tracking-tight flex items-center gap-2 mb-5">
                            <Ticket size={22} className="text-[#2A4B41]" /> Generate token
                        </div>
                        <form onSubmit={submit} className="space-y-4" data-testid="reception-form">
                            <Field label="Doctor">
                                <Select
                                    value={form.doctor_id}
                                    onValueChange={(value) =>
                                        setForm({ ...form, doctor_id: value })
                                    }
                                >
                                    <SelectTrigger
                                        className="mt-1.5 h-10 border-[#E2E5E0]"
                                        data-testid="reception-doctor-select"
                                    >
                                        <SelectValue placeholder="Select doctor" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {doctors.map((doctor) => (
                                           <SelectItem
    key={doctor.id}
    value={doctor.id}
>
    {doctor.name} - {doctor.specialization}
</SelectItem>

                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field label="Session">
                                <Select value={form.session} onValueChange={(v) => setForm({ ...form, session: v })}>
                                    <SelectTrigger className="mt-1.5 h-10 border-[#E2E5E0]" data-testid="reception-session-select"><SelectValue /></SelectTrigger>
                                    <SelectContent>{SESSIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                            </Field>
                            <Field label="Patient name">
                                <Input value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
                                    className="mt-1.5 h-10 border-[#E2E5E0]" required data-testid="reception-name-input" />
                            </Field>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Phone">
                                    <Input value={form.patient_phone} onChange={(e) => setForm({ ...form, patient_phone: e.target.value })}
                                        className="mt-1.5 h-10 border-[#E2E5E0]" required data-testid="reception-phone-input" />
                                </Field>
                                <Field label="Age">
                                    <Input type="number" value={form.patient_age} onChange={(e) => setForm({ ...form, patient_age: e.target.value })}
                                        className="mt-1.5 h-10 border-[#E2E5E0]" data-testid="reception-age-input" />
                                </Field>
                            </div>
                            <Field label="Priority">
                                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                                    <SelectTrigger className="mt-1.5 h-10 border-[#E2E5E0]" data-testid="reception-priority-select"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="normal">Normal</SelectItem>
                                        <SelectItem value="emergency">Emergency (priority)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Button type="submit" className="w-full h-11 bg-[#2A4B41] hover:bg-[#1E362E] text-white" data-testid="reception-submit-btn">
                                Issue token
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Queues per doctor */}
                <div className="lg:col-span-7 space-y-6">
                    {byDoctor.map((d) => {
                        const receptionControlled = d.queue_control_mode === "reception";
                        const waitingCount = d.tokens.filter((t) => t.state === "waiting").length;
                        return (
                            <div key={d.id} className="bg-white border border-[#E2E5E0] rounded-xl overflow-hidden">
                                <div className="p-4 border-b border-[#E2E5E0] flex items-center justify-between gap-3 flex-wrap">
                                    <div>
                                        <div className="font-heading font-bold tracking-tight flex items-center gap-2">
                                            {d.name}
                                            {receptionControlled && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f4d4ca] text-[#9C3A24] font-bold tracking-wide uppercase" data-testid={`mode-badge-${d.id}`}>
                                                    Reception controlled
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-[#5C6661]">{d.specialization}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-[11px] tracking-[0.2em] uppercase font-bold text-[#5C6661]">{d.tokens.length} today · {waitingCount} waiting</div>
                                        {receptionControlled && (
                                            <Button size="sm" onClick={() => callNext(d.id)}
                                                disabled={callingId === d.id || waitingCount === 0}
                                                className="bg-[#2A4B41] hover:bg-[#1E362E] text-white"
                                                data-testid={`reception-call-next-${d.id}`}>
                                                <Phone size={14} className="mr-1.5" /> Call next
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                {d.tokens.length === 0 ? (
                                    <div className="p-8 text-center text-sm text-[#5C6661]">No tokens yet.</div>
                                ) : (
                                    <div className="max-h-[340px] overflow-y-auto">
                                        <table className="w-full text-sm" data-testid={`doctor-queue-table-${d.id}`}>
                                            <thead className="sticky top-0 bg-[#F9F9F7]">
                                                <tr className="text-[11px] tracking-[0.2em] uppercase text-[#5C6661]">
                                                    <th className="text-left p-3 font-bold">#</th>
                                                    <th className="text-left p-3 font-bold">Patient</th>
                                                    <th className="text-left p-3 font-bold">State</th>
                                                    <th className="text-right p-3 font-bold">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {d.tokens.map((t) => (
                                                    <tr key={t.id} className="border-t border-[#E2E5E0]">
                                                        <td className="p-3 font-mono font-bold">
                                                            {t.token_number}
                                                            {t.priority === "emergency" && <span className="ml-1 text-[#D36A50]">!</span>}
                                                        </td>
                                                        <td className="p-3">
                                                            <div>{t.patient_name}</div>
                                                            <div className="text-xs text-[#5C6661] font-mono">{t.patient_phone}</div>
                                                        </td>
                                                        <td className="p-3"><StateBadge state={t.state} priority={t.priority} /></td>
                                                        <td className="p-3 text-right">
                                                            <div className="inline-flex gap-1 flex-wrap justify-end">
                                                                <Button size="sm" variant="ghost"
                                                                    onClick={() => setPaymentFor(t)}
                                                                    className="h-7 px-2 text-xs hover:bg-[#EDEDE8]"
                                                                    data-testid={`pay-btn-${t.token_number}`}>
                                                                    <CurrencyInr size={12} className="mr-1" /> Pay
                                                                </Button>
                                                                {t.state === "waiting" && (
                                                                    <>
                                                                        <Button size="sm" variant="ghost"
                                                                            onClick={() => skip(t.id)}
                                                                            className="h-7 px-2 text-xs hover:bg-[#EDEDE8]"
                                                                            data-testid={`skip-btn-${t.token_number}`}>
                                                                            <SkipForward size={12} className="mr-1" /> Skip
                                                                        </Button>
                                                                        <Button size="sm" variant="ghost"
                                                                            onClick={() => setEditing(t)}
                                                                            className="h-7 px-2 text-xs hover:bg-[#EDEDE8]"
                                                                            data-testid={`reassign-btn-${t.token_number}`}>
                                                                            <PencilSimple size={12} className="mr-1" /> Change
                                                                        </Button>
                                                                        <Button size="sm" variant="ghost"
                                                                            onClick={() => cancel(t.id)}
                                                                            className="h-7 px-2 text-xs text-[#D36A50] hover:bg-[#f4d4ca]"
                                                                            data-testid={`cancel-btn-${t.token_number}`}>
                                                                            <XCircle size={12} />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Slip */}
            <Dialog open={!!slip} onOpenChange={(o) => !o && setSlip(null)}>
                <DialogContent className="max-w-sm" data-testid="token-slip">
                    <DialogHeader><DialogTitle className="font-heading tracking-tight">Token issued</DialogTitle></DialogHeader>
                    {slip && (
                        <div className="space-y-4 text-center">
                            <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-[#5C6661]">Your token</div>
                            <div className="font-mono text-8xl font-black tracking-tighter text-[#2A4B41] leading-none">{slip.token_number}</div>
                            <div className="text-sm">
                                <div className="font-medium">{slip.patient_name}</div>
                                <div className="text-[#5C6661]">Session: {slip.session}</div>
                            </div>
                            <div className="grid place-items-center py-2">
                                <QRCodeSVG value={`${window.location.origin}/q/${slip.qr_token}`} size={140} bgColor="#fff" fgColor="#2A4B41" />
                            </div>
                            <div className="text-xs text-[#5C6661]">Scan to track live queue position</div>
                            <div className="flex gap-2">
                                <Button onClick={() => window.print()} variant="outline" className="flex-1 border-[#E2E5E0]" data-testid="print-slip-btn">
                                    <Printer size={16} className="mr-1.5" /> Print
                                </Button>
                                <Button onClick={() => setSlip(null)} className="flex-1 bg-[#2A4B41] hover:bg-[#1E362E] text-white" data-testid="close-slip-btn">Done</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Reassign */}
            <ReassignDialog editing={editing} setEditing={setEditing} doctors={doctors} onSave={saveReassign} />

            {/* Payment */}
            <PaymentDialog token={paymentFor} onClose={() => setPaymentFor(null)} onSaved={load} />
        </AppShell>
    );
}

function Field({ label, children }) {
    return <div><Label>{label}</Label>{children}</div>;
}

function ReassignDialog({ editing, setEditing, doctors, onSave }) {
    const [patch, setPatch] = useState({});
    useEffect(() => {
        if (editing) setPatch({
            doctor_id: editing.doctor_id, patient_name: editing.patient_name,
            patient_phone: editing.patient_phone, patient_age: editing.patient_age ?? "",
        });
    }, [editing]);
    if (!editing) return null;
    return (
        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
            <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Change token #{editing.token_number}</DialogTitle></DialogHeader>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const send = { ...patch };
                    send.patient_age = send.patient_age === "" ? null : Number(send.patient_age);
                    onSave(send);
                }} className="space-y-4" data-testid="reassign-form">
                    <Field label="Doctor (reassign changes token number)">
                        <Select value={patch.doctor_id} onValueChange={(v) => setPatch({ ...patch, doctor_id: v })}>
                            <SelectTrigger className="mt-1.5 h-10 border-[#E2E5E0]" data-testid="reassign-doctor-select"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.name} — {d.specialization}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field label="Patient name">
                        <Input value={patch.patient_name} onChange={(e) => setPatch({ ...patch, patient_name: e.target.value })}
                            className="mt-1.5 h-10 border-[#E2E5E0]" data-testid="reassign-name" />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Phone">
                            <Input value={patch.patient_phone} onChange={(e) => setPatch({ ...patch, patient_phone: e.target.value })}
                                className="mt-1.5 h-10 border-[#E2E5E0]" data-testid="reassign-phone" />
                        </Field>
                        <Field label="Age">
                            <Input type="number" value={patch.patient_age} onChange={(e) => setPatch({ ...patch, patient_age: e.target.value })}
                                className="mt-1.5 h-10 border-[#E2E5E0]" data-testid="reassign-age" />
                        </Field>
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" className="flex-1 border-[#E2E5E0]" onClick={() => setEditing(null)}>Cancel</Button>
                        <Button type="submit" className="flex-1 bg-[#2A4B41] hover:bg-[#1E362E] text-white" data-testid="reassign-save-btn">Save</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function PaymentDialog({ token, onClose, onSaved }) {
    const [form, setForm] = useState({
        amount: "", method: "cash", type: "consultation", notes: "",
    });
    useEffect(() => {
        if (token) setForm({ amount: "", method: "cash", type: "consultation", notes: "" });
    }, [token]);
    if (!token) return null;

    async function submit(e) {
        e.preventDefault();
        try {
            await api.post("/payments", {
                patient_name: token.patient_name,
                patient_phone: token.patient_phone,
                amount: Number(form.amount),
                method: form.method,
                type: form.type,
                token_id: token.id,
                notes: form.notes || "",
            });
            toast.success("Payment recorded · pending admin approval");
            onClose();
            onSaved?.();
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail) || e.message);
        }
    }

    return (
        <Dialog open={!!token} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Record payment — token #{token.token_number}</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4" data-testid="payment-form">
                    <div className="text-sm text-[#5C6661]">
                        <div className="font-medium text-[#1A1D1C]">{token.patient_name}</div>
                        <div className="font-mono">{token.patient_phone}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Type">
                            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                                <SelectTrigger className="mt-1.5 h-10 border-[#E2E5E0]" data-testid="payment-type-select"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="consultation">Consultation</SelectItem>
                                    <SelectItem value="registration">Registration</SelectItem>
                                    <SelectItem value="lab">Lab</SelectItem>
                                    <SelectItem value="procedure">Procedure</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Method">
                            <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                                <SelectTrigger className="mt-1.5 h-10 border-[#E2E5E0]" data-testid="payment-method-select"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="upi">UPI</SelectItem>
                                    <SelectItem value="card">Card</SelectItem>
                                    <SelectItem value="netbanking">Netbanking</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                    </div>
                    <Field label="Amount (₹)">
                        <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                            className="mt-1.5 h-10 border-[#E2E5E0]" required data-testid="payment-amount-input" />
                    </Field>
                    <Field label="Notes (optional)">
                        <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            className="mt-1.5 h-10 border-[#E2E5E0]" data-testid="payment-notes-input" />
                    </Field>
                    <div className="text-xs text-[#5C6661] bg-[#EDEDE8] p-3 rounded-lg">
                        Requires hospital admin approval to count as paid.
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" className="flex-1 border-[#E2E5E0]" onClick={onClose}>Cancel</Button>
                        <Button type="submit" className="flex-1 bg-[#2A4B41] hover:bg-[#1E362E] text-white" data-testid="payment-submit-btn">
                            Record payment
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function StateBadge({ state, priority }) {
    const map = {
        waiting: ["bg-[#EDEDE8]", "text-[#1A1D1C]"],
        called: ["bg-[#D36A50]", "text-white"],
        in_consultation: ["bg-[#2A4B41]", "text-white"],
        completed: ["bg-[#DCE0D9]", "text-[#2A4B41]"],
        no_show: ["bg-[#f4d4ca]", "text-[#9C3A24]"],
        cancelled: ["bg-[#EDEDE8]", "text-[#5C6661]"],
    };
    const [bg, fg] = map[state] || map.waiting;
    return (
        <div className="inline-flex items-center gap-1">
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${bg} ${fg}`}>{state.replace("_", " ")}</span>
            {priority === "skipped" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EDEDE8] text-[#5C6661] font-bold">skipped</span>}
        </div>
    );
}
