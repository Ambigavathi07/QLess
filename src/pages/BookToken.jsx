import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { api, formatApiError } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { Hourglass, CheckCircle, Warning, CarProfile } from "@phosphor-icons/react";

export default function BookToken() {
    const { doctorId } = useParams();
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const hospitalId = params.get("hospital");
    const [info, setInfo] = useState(null);
    const [form, setForm] = useState({
        patient_name: "", patient_phone: "", patient_age: "",
        session: params.get("session") || "morning", arrival_minutes: 30,
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        if (!hospitalId) return;
        api.get(`/public/hospitals/${hospitalId}`).then((r) => {
            const doctor = r.data.doctors.find((d) => d.id === doctorId);
            setInfo({ hospital: r.data.hospital, doctor });
        }).catch(() => toast.error("Hospital not found"));
    }, [hospitalId, doctorId]);

    async function submit(e) {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post("/public/bookings", {
                hospital_id: hospitalId,
                doctor_id: doctorId,
                session: form.session,
                patient_name: form.patient_name,
                patient_phone: form.patient_phone,
                patient_age: form.patient_age ? Number(form.patient_age) : null,
                arrival_minutes: Number(form.arrival_minutes || 0),
            });
            toast.success(`Token #${data.token_number} booked`);
            setResult(data);
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail) || e.message);
        } finally {
            setLoading(false);
        }
    }

    if (!hospitalId || !info) return <div className="min-h-screen grid place-items-center text-[#5C6661]">Loading…</div>;
    if (!info.doctor) return <div className="min-h-screen grid place-items-center text-[#5C6661]">Doctor not found.</div>;

    if (result) return <BookingConfirmation r={result} onDone={() => navigate(`/q/${result.qr_token}`)} />;

    return (
        <div className="min-h-screen bg-[#F9F9F7] grain">
            <header className="border-b border-[#E2E5E0] bg-[#F9F9F7]">
                <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-[#2A4B41] text-white grid place-items-center font-heading font-black">Q</div>
                        <div className="font-heading font-black tracking-tight text-xl">QLess</div>
                    </Link>
                    <Link to={`/hospitals/${hospitalId}`}><Button variant="ghost" className="hover:bg-[#EDEDE8]">← Back</Button></Link>
                </div>
            </header>

            <div className="max-w-xl mx-auto px-6 py-10">
                <div className="text-xs tracking-[0.25em] uppercase font-bold text-[#5C6661]">Book token</div>
                <h1 className="font-heading text-3xl font-black tracking-tight mt-2">{info.doctor.name}</h1>
                <div className="text-sm text-[#5C6661] mt-1">{info.doctor.specialization} · {info.hospital.name}</div>

                <form onSubmit={submit} className="mt-8 space-y-4 bg-white border border-[#E2E5E0] rounded-2xl p-6" data-testid="book-form">
                    <div>
                        <Label>Your name</Label>
                        <Input value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
                            className="mt-1.5 h-11 border-[#E2E5E0]" required data-testid="book-name" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>Phone</Label>
                            <Input value={form.patient_phone} onChange={(e) => setForm({ ...form, patient_phone: e.target.value })}
                                className="mt-1.5 h-11 border-[#E2E5E0]" required data-testid="book-phone" />
                        </div>
                        <div>
                            <Label>Age</Label>
                            <Input type="number" value={form.patient_age} onChange={(e) => setForm({ ...form, patient_age: e.target.value })}
                                className="mt-1.5 h-11 border-[#E2E5E0]" data-testid="book-age" />
                        </div>
                    </div>
                    <div>
                        <Label>Session</Label>
                        <Select value={form.session} onValueChange={(v) => setForm({ ...form, session: v })}>
                            <SelectTrigger className="mt-1.5 h-11 border-[#E2E5E0]" data-testid="book-session"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="morning">Morning</SelectItem>
                                <SelectItem value="evening">Evening</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="flex items-center gap-2"><CarProfile size={14} /> How long to reach the hospital? (minutes)</Label>
                        <Input type="number" value={form.arrival_minutes}
                            onChange={(e) => setForm({ ...form, arrival_minutes: e.target.value })}
                            className="mt-1.5 h-11 border-[#E2E5E0]" required data-testid="book-arrival" />
                        <p className="text-xs text-[#5C6661] mt-1.5">
                            We'll tell you if you'll arrive in time for your turn.
                        </p>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full h-12 bg-[#2A4B41] hover:bg-[#1E362E] text-white" data-testid="book-submit-btn">
                        {loading ? "Booking…" : <><Hourglass size={16} className="mr-2" /> Confirm booking</>}
                    </Button>
                </form>
            </div>
        </div>
    );
}

function BookingConfirmation({ r, onDone }) {
    const onTime = r.on_time;
    return (
        <div className="min-h-screen bg-[#F9F9F7] grain">
            <div className="max-w-md mx-auto px-6 py-10">
                <div className="bg-[#2A4B41] rounded-2xl p-6 text-white text-center">
                    <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-white/70">Token booked</div>
                    <div className="font-mono text-8xl font-black tracking-tighter mt-2 leading-none">{r.token_number}</div>
                    <div className="text-sm mt-3 text-white/80">{r.doctor_name} · {r.session}</div>
                </div>

                <div className={`mt-6 p-6 rounded-2xl border ${onTime ? "border-[#2A4B41] bg-white" : "border-[#D36A50] bg-[#fff5f1]"}`} data-testid="timing-verdict">
                    <div className="flex items-center gap-3">
                        {onTime ? <CheckCircle size={32} weight="fill" className="text-[#2A4B41]" />
                                : <Warning size={32} weight="fill" className="text-[#D36A50]" />}
                        <div>
                            <div className="font-heading font-bold text-xl tracking-tight">
                                {onTime ? "You'll make it on time" : "Leave now — you might be late"}
                            </div>
                            <div className="text-sm text-[#5C6661] mt-0.5">
                                Your turn in ~{r.eta_minutes} min · travel time {r.arrival_minutes} min ·
                                {onTime ? ` ${r.slack_minutes} min to spare` : ` ${-r.slack_minutes} min short`}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 bg-white border border-[#E2E5E0] rounded-2xl p-6 text-center">
                    <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-[#5C6661]">Your live link</div>
                    <div className="mt-4 grid place-items-center">
                        <QRCodeSVG value={`${window.location.origin}/q/${r.qr_token}`} size={160} bgColor="#fff" fgColor="#2A4B41" />
                    </div>
                    <div className="text-xs text-[#5C6661] mt-3">Scan to track queue on another device</div>
                </div>

                <Button onClick={onDone} className="w-full mt-6 h-12 bg-[#2A4B41] hover:bg-[#1E362E] text-white" data-testid="goto-live-btn">
                    Track live queue
                </Button>
            </div>
        </div>
    );
}
