
import { useEffect, useState } from "react";
import { api, formatApiError } from "../lib/api";
import AppShell from "../components/AppShell";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { SkipForward, Check, X, Pause, Play, Phone, Pill, ClockCounterClockwise, Plus, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useHospitalSocket } from "../hooks/useHospitalSocket";

const newMed = () => ({ _key: `m-${Math.random().toString(36).slice(2, 9)}`, name: "", dosage: "", frequency: "1-0-1", duration: "5 days", notes: "", price: 0 });

export default function Doctor() {
    const { user } = useAuth();
    const [session, setSession] = useState("Morning");
    const [view, setView] = useState(null);
    const [current, setCurrent] = useState(null); // { token, history, current_medications }
    const [loading, setLoading] = useState(false);
    const [rxOpen, setRxOpen] = useState(false);
    const [rx, setRx] = useState({ diagnosis: "", medications: [newMed()] });
    const [sessionStatus, setSessionStatus] = useState("not_started");






    const load = async () => {
        try {

            console.log("QUEUE API START");

            console.log("USER:", user);

            if (!user?.userId) {
                console.log("USER ID NOT FOUND");
                return;
            }

            console.log("DOCTOR ID:", user.userId);

            const queueRes = await api.get(
                `/tokens/queue?session=${session}&doctorId=${user?.doctorId}`
            );

            console.log("QUEUE RESPONSE:", queueRes.data);

            const waitingQueue = (queueRes.data || []).map((item, index) => ({
                id: item.id,
                token_number: item.tokenNumber,
                patient_name: item.patientName,
                state: item.state,
                session: item.session,
                position: index + 1,
                eta_minutes: (index + 1) * 10,
                priority: item.state
            }));

            setView({
                waiting: waitingQueue,
                now_serving: current?.token || null,
                session: {
                    status: "active"
                },
                doctor: {
                    name: user?.name || "Doctor",
                    queue_control_mode: "doctor"
                }
            });

        } catch (e) {

            console.log("QUEUE ERROR:", e);

            toast.error(
                formatApiError(e.response?.data?.detail) || e.message
            );
        }
    };

    useEffect(() => {

        console.log("USE EFFECT RUNNING");

        if (user?.userId) {
            load();
        }

    }, [user?.userId, session]);





    // useHospitalSocket(user?.hospital_id, () => load());

    async function act(path, method = "post", body = { session }) {
        setLoading(true);
        try {
            await api[method](path, body);
            await load();
        } catch (e) {

            console.log("FULL ERROR:", e);
            console.log("ERROR RESPONSE:", e.response);
            console.log("ERROR DATA:", e.response?.data);

            toast.error(
                e.response?.data?.message ||
                e.response?.data?.detail ||
                e.message ||
                "Something went wrong"
            );
        }
        finally {
            setLoading(false);
        }
    }

    function openPrescription() {
        const existing = (current?.current_medications || []);
        setRx({
            diagnosis: current?.token?.diagnosis || "",
            medications: existing.length
                ? existing.map((m) => ({ name: m.name, dosage: m.dosage, frequency: m.frequency, duration: m.duration, notes: m.notes, price: m.price }))
                : [newMed()],
        });
        setRxOpen(true);
    }

   async function savePrescription() {
    if (!current?.token) return;

    try {

        for (const med of rx.medications) {

            if (!med.name?.trim()) continue;

            await api.post("/medications", {
                tokenId: current.token.id,
                name: med.name,
                dosage: med.dosage,
                frequency: med.frequency,
                duration: med.duration,
                notes: med.notes || "",
                price: Number(med.price || 0)
            });
        }

        toast.success("Prescription sent successfully");

        setRxOpen(false);

        await load();

    } catch (e) {
        toast.error(
            e.response?.data?.message ||
            e.response?.data?.detail ||
            e.message
        );
    }
}

    const now = current?.token || view?.now_serving;
    const waiting = view?.waiting || [];
const sessStatus = sessionStatus;
    const mode = view?.doctor?.queue_control_mode || "doctor";
    const receptionControlled = mode === "reception";

const isScreenLocked =
    sessionStatus === "not_started" ||
    sessionStatus === "paused";

    return (
        <AppShell title="Doctor Panel" subtitle={view?.doctor?.name}
            actions={
                <div className="flex items-center gap-2">
                    <Select value={session} onValueChange={setSession}>
                        <SelectTrigger className="w-[140px] h-9 border-[#E2E5E0]" data-testid="doctor-session-select"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Morning">Morning</SelectItem>
                            <SelectItem value="Evening">Evening</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">

                        {sessionStatus === "not_started" ? (
                            <Button
                                size="sm"
                                onClick={async () => {
                                    try {
                                        const body = {
                                            doctorId: user?.doctorId,
                                            hospitalId: user?.hospitalId,
                                            session: session,
                                        };

                                        await api.post("/session/start", body);

                                        setSessionStatus("active");

                                        toast.success("Session started");
                                    } catch (e) {
                                        toast.error(
                                            e.response?.data?.message ||
                                            e.response?.data?.detail ||
                                            e.message
                                        );
                                    }
                                }}
                                className="bg-[#2A4B41] text-white"
                            >
                                <Play size={16} className="mr-1.5" />
                                Start
                            </Button>
                        ) : sessionStatus === "active" ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                    try {
                                        await api.post("/session/pause", {
                                            doctorId: user?.doctorId,
                                            hospitalId: user?.hospitalId,
                                            session: session,
                                        });
                                        console.log("PAUSE CLICKED");

                                        const body = {
                                            doctorId: user?.doctorId,
                                            hospitalId: user?.hospitalId,
                                            session: session,
                                        };

                                        console.log("BODY:", body);

                                        const res = await api.post("/session/pause", body);

                                        console.log("PAUSE RESPONSE:", res.data);

                                        setSessionStatus("paused");

                                        toast.success("Session paused");
                                    } catch (e) {
                                        toast.error(
                                            e.response?.data?.message ||
                                            e.response?.data?.detail ||
                                            e.message
                                        );
                                    }
                                }}
                            >
                                <Pause size={16} className="mr-1.5" />
                                Pause
                            </Button>
                        ) : (
                            <Button
                                size="sm"



                                onClick={async () => {
                                    try {
                                        await api.post("/session/resume", {
                                            doctorId: user?.doctorId,
                                            hospitalId: user?.hospitalId,
                                            session: session,
                                        });

                                        console.log("RESUME CLICKED");

                                        const body = {
                                            doctorId: user?.doctorId,
                                            hospitalId: user?.hospitalId,
                                            session: session,
                                        };

                                        console.log("BODY:", body);

                                        const res = await api.post("/session/resume", body);

                                        console.log("RESUME RESPONSE:", res.data);

                                        setSessionStatus("active");

                                        toast.success("Session resumed");
                                    } catch (e) {
                                        toast.error(
                                            e.response?.data?.message ||
                                            e.response?.data?.detail ||
                                            e.message
                                        );
                                    }
                                }}
                                className="bg-red-500 hover:bg-red-600 text-white"
                            >
                                <Play size={16} className="mr-1.5" />
                                Resume
                            </Button>






                        )}

                    </div>
                </div>
            }>
<div className="relative">

    {isScreenLocked && (
        <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20 rounded-xl">
            <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-center">
                <h3 className="font-bold text-lg">
                    {sessionStatus === "not_started"
                        ? "Session Not Started"
                        : "Session Paused"}
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                    {sessionStatus === "not_started"
                        ? "Click Start to begin serving patients"
                        : "Click Resume to continue serving patients"}
                </p>
            </div>
        </div>
    )}

    <div
        className={`grid lg:grid-cols-12 gap-6 ${
            isScreenLocked
                ? "pointer-events-none blur-sm"
                : ""
        }`}
    >                {/* Left: current token + actions */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white border border-[#E2E5E0] rounded-xl p-8">
                        <div className="text-[11px] tracking-[0.3em] uppercase font-bold text-[#5C6661]">
                            Now serving {sessStatus === "paused" && <span className="ml-2 text-[#D36A50]">· Queue paused</span>}
                        </div>
                        {now ? (
                            <div className="mt-3">
                                <div className="font-mono text-8xl md:text-9xl font-black tracking-tighter text-[#2A4B41] leading-none">{now.token_number}</div>
                                <div className="mt-6">
                                    <div className="text-2xl font-heading font-bold tracking-tight">{now.patient_name || now.patientName}</div>
                                    <div className="text-sm text-[#5C6661] mt-1">
                                        {now.patient_phone} {now.patient_age ? `· ${now.patient_age} yrs` : ""} · {now.priority === "emergency" ? <span className="text-[#D36A50] font-bold">EMERGENCY</span> : "Normal"}
                                    </div>
                                </div>
                                <div className="mt-8 flex flex-wrap gap-3">
                                    <Button onClick={openPrescription}
                                        className="bg-[#D36A50] hover:bg-[#a85036] text-white h-11 px-6" data-testid="prescribe-btn">
                                        <Pill size={18} className="mr-1.5" /> Prescribe
                                    </Button>
                                    <Button
                                        onClick={async () => {
                                            try {
                                                await api.post("/tokens/update-state", {
                                                    tokenId: now.id,
                                                    state: "completed",
                                                    userId: user?.userId
                                                });

                                                toast.success("Token completed");

                                                setCurrent(null);

                                                await load();
                                            } catch (e) {
                                                toast.error(
                                                    e.response?.data?.message ||
                                                    e.response?.data?.detail ||
                                                    e.message
                                                );
                                            }
                                        }}
                                        disabled={loading}
                                        className="bg-[#2A4B41] hover:bg-[#1E362E] text-white h-11 px-6"
                                    >
                                        <Check size={18} className="mr-1.5" />
                                        Complete
                                    </Button>
                                    <Button
                                        onClick={async () => {
                                            try {
                                                await api.post("/tokens/update-state", {
                                                    tokenId: now.id,
                                                    state: "no_show",
                                                    userId: user?.userId
                                                });

                                                toast.success("Marked as no-show");

                                                setCurrent(null);

                                                await load();
                                            } catch (e) {
                                                toast.error(
                                                    e.response?.data?.message ||
                                                    e.response?.data?.detail ||
                                                    e.message               
                                                );
                                            }
                                        }}
                                        variant="outline"
                                        className="border-[#D36A50] text-[#D36A50] hover:bg-[#D36A50] hover:text-white h-11 px-6"
                                    >
                                        <X size={18} className="mr-1.5" />
                                        No-show
                                    </Button>
                                    <Button
                                        onClick={async () => {
                                            try {
                                                await api.post("/tokens/update-state", {
                                                    tokenId: now.id,
                                                    state: "skipped",
                                                    userId: user?.userId
                                                });

                                                toast.success("Token skipped");

                                                setCurrent(null);

                                                await load();
                                            } catch (e) {
                                                toast.error(
                                                    e.response?.data?.message ||
                                                    e.response?.data?.detail ||
                                                    e.message
                                                );
                                            }
                                        }}
                                        disabled={loading}
                                        className="bg-black hover:bg-gray-800 text-white h-11 px-6"
                                    >
                                        <SkipForward size={18} className="mr-1.5" />
                                        Skip Next
                                    </Button>

                                </div>
                            </div>
                        ) : (
                            <div className="mt-6">
                                <div className="text-[#5C6661] text-lg">No one being served.</div>
                                {receptionControlled ? (
                                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f4d4ca] text-[#9C3A24] text-sm font-bold" data-testid="reception-controlled-badge">
                                        This queue is reception-controlled. Ask reception to call next.
                                    </div>
                                ) : (
                                    <Button
                                        onClick={async () => {
                                            try {
                                                setLoading(true);

                                                const res = await api.post("/tokens/call-next", {
                                                    doctorId: user?.doctorId,
                                                    session: session
                                                });

                                                setCurrent({
                                                    token: {
                                                        id: res.data.id,
                                                        token_number: res.data.tokenNumber,
                                                        patient_name: res.data.patientName,
                                                        state: res.data.state,
                                                        session: res.data.session
                                                    }
                                                });

                                                load();
                                            } catch (e) {
                                                toast.error(formatApiError(e.response?.data?.detail) || e.message);
                                            } finally {
                                                setLoading(false);
                                            }
                                        }} disabled={loading || waiting.length === 0}
                                        className="mt-6 bg-[#2A4B41] hover:bg-[#1E362E] text-white h-12 px-8" data-testid="call-next-btn">
                                        <Phone size={18} className="mr-1.5" /> Call next ({waiting.length} waiting)
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Medication history of the current patient */}
                    {current?.token && (
                        <div className="bg-white border border-[#E2E5E0] rounded-xl overflow-hidden">
                            <div className="p-5 border-b border-[#E2E5E0]">
                                <div className="font-heading text-lg font-bold tracking-tight flex items-center gap-2">
                                    <ClockCounterClockwise size={18} /> Patient medication history
                                </div>
                                <div className="text-xs text-[#5C6661] mt-0.5">{current.history?.length || 0} prior visits at this hospital</div>
                            </div>
                            {(!current.history || current.history.length === 0) ? (
                                <div className="p-8 text-center text-sm text-[#5C6661]">First visit — no history yet.</div>
                            ) : (
                                <ul className="divide-y divide-[#E2E5E0] max-h-[420px] overflow-y-auto">
                                    {current.history.map((h) => (
                                        <li key={h.token_id} className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium">{h.doctor_name} <span className="text-xs text-[#5C6661]">· {h.doctor_specialization}</span></div>
                                                    <div className="text-xs text-[#5C6661] font-mono">{h.date} · {h.session}</div>
                                                </div>
                                                <div className="text-[10px] tracking-[0.2em] uppercase text-[#5C6661] font-bold">{h.medications.length} rx</div>
                                            </div>
                                            {h.diagnosis && <div className="text-sm mt-1 text-[#2A4B41]">Dx: {h.diagnosis}</div>}
                                            {h.medications.length > 0 && (
                                                <ul className="mt-2 space-y-1 text-sm">
                                                    {h.medications.map((m) => (
                                                        <li key={m.id} className="flex items-center gap-2">
                                                            <Pill size={12} className="text-[#2A4B41]" />
                                                            <span className="font-medium">{m.name}</span>
                                                            <span className="text-xs text-[#5C6661]">{m.dosage} · {m.frequency} · {m.duration}</span>
                                                            {m.paid && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#DCE0D9] text-[#2A4B41] font-bold">paid</span>}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: waiting queue */}
                <div className="lg:col-span-5">
                    <div className="bg-white border border-[#E2E5E0] rounded-xl overflow-hidden">
                        <div className="p-5 border-b border-[#E2E5E0] flex items-center justify-between">
                            <div className="font-heading text-lg font-bold tracking-tight">Waiting queue</div>
                            <div className="text-[11px] tracking-[0.2em] uppercase text-[#5C6661] font-bold">{waiting.length} patients</div>
                        </div>
                        {waiting.length === 0 && <div className="p-10 text-center text-[#5C6661] text-sm">Queue is empty.</div>}
                        <ul className="divide-y divide-[#E2E5E0] max-h-[520px] overflow-y-auto">
                            {waiting.map((t) => (
                                <li key={t.id} className="p-4 flex items-center justify-between hover:bg-[#EDEDE8]" data-testid={`waiting-token-${t.token_number}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="font-mono text-2xl font-black tracking-tight w-12 text-[#2A4B41]">{t.token_number}</div>
                                        <div>
                                            <div className="font-medium">{t.patient_name}</div>
                                            <div className="text-xs text-[#5C6661]">ETA ~{t.eta_minutes} min · pos #{t.position}</div>
                                        </div>
                                    </div>
                                    {t.priority === "emergency" && <span className="px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase bg-[#D36A50] text-white">Emergency</span>}
                                    {t.priority === "skipped" && <span className="px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase bg-[#EDEDE8] text-[#5C6661]">Skipped</span>}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Prescription modal */}
            <Dialog open={rxOpen} onOpenChange={setRxOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>Prescription for {current?.token?.patient_name}</DialogTitle></DialogHeader>
                    <div className="space-y-4" data-testid="prescription-form">
                        <div>
                            <Label>Diagnosis / notes</Label>
                            <Textarea value={rx.diagnosis} onChange={(e) => setRx({ ...rx, diagnosis: e.target.value })}
                                className="mt-1.5 border-[#E2E5E0]" rows={2} data-testid="rx-diagnosis" />
                        </div>
                        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                            {rx.medications.map((m, idx) => (
                                <div key={m._key} className="p-4 border border-[#E2E5E0] rounded-lg grid grid-cols-12 gap-2">
                                    <Input placeholder="Medicine" className="col-span-4 h-9 border-[#E2E5E0]"
                                        value={m.name} onChange={(e) => {
                                            const next = [...rx.medications]; next[idx].name = e.target.value; setRx({ ...rx, medications: next });
                                        }} data-testid={`rx-name-${idx}`} />
                                    <Input placeholder="Dosage" className="col-span-2 h-9 border-[#E2E5E0]"
                                        value={m.dosage} onChange={(e) => {
                                            const next = [...rx.medications]; next[idx].dosage = e.target.value; setRx({ ...rx, medications: next });
                                        }} data-testid={`rx-dosage-${idx}`} />
                                    <Input placeholder="Frequency" className="col-span-2 h-9 border-[#E2E5E0]"
                                        value={m.frequency} onChange={(e) => {
                                            const next = [...rx.medications]; next[idx].frequency = e.target.value; setRx({ ...rx, medications: next });
                                        }} data-testid={`rx-frequency-${idx}`} />
                                    <Input placeholder="Duration" className="col-span-2 h-9 border-[#E2E5E0]"
                                        value={m.duration} onChange={(e) => {
                                            const next = [...rx.medications]; next[idx].duration = e.target.value; setRx({ ...rx, medications: next });
                                        }} data-testid={`rx-duration-${idx}`} />
                                    <Input placeholder="₹" type="number" className="col-span-1 h-9 border-[#E2E5E0]"
                                        value={m.price} onChange={(e) => {
                                            const next = [...rx.medications]; next[idx].price = e.target.value; setRx({ ...rx, medications: next });
                                        }} data-testid={`rx-price-${idx}`} />
                                    <Button type="button" variant="ghost" size="sm" className="col-span-1 h-9"
                                        onClick={() => {
                                            const next = rx.medications.filter((_, i) => i !== idx);
                                            setRx({ ...rx, medications: next.length ? next : [newMed()] });
                                        }} data-testid={`rx-remove-${idx}`}>
                                        <Trash size={14} />
                                    </Button>
                                    <Input placeholder="Notes (optional)" className="col-span-12 h-8 border-[#E2E5E0] text-xs"
                                        value={m.notes} onChange={(e) => {
                                            const next = [...rx.medications]; next[idx].notes = e.target.value; setRx({ ...rx, medications: next });
                                        }} />
                                </div>
                            ))}
                        </div>
                        <Button variant="outline" className="border-[#E2E5E0] hover:bg-[#EDEDE8]"
                            onClick={() => setRx({ ...rx, medications: [...rx.medications, newMed()] })}
                            data-testid="rx-add-row">
                            <Plus size={14} className="mr-1.5" /> Add medicine
                        </Button>
                        <div className="flex gap-2 pt-2 border-t border-[#E2E5E0]">
                            <Button variant="outline" className="flex-1 border-[#E2E5E0]" onClick={() => setRxOpen(false)}>Cancel</Button>
                            <Button onClick={savePrescription} className="flex-1 bg-[#2A4B41] hover:bg-[#1E362E] text-white" data-testid="rx-save-btn">
                                Send to pharmacy
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            </div>

        </AppShell>
    );
}
