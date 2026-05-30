import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, formatApiError } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";

export default function PatientRegister() {
    const { hospitalId } = useParams();
    const navigate = useNavigate();
    const [info, setInfo] = useState(null);
    const [form, setForm] = useState({
        doctor_id: "", patient_name: "", patient_phone: "", patient_age: "", session: "morning",
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get(`/public/hospitals/${hospitalId}`).then((r) => {
            setInfo(r.data);
            if (r.data.doctors?.length) setForm((f) => ({ ...f, doctor_id: r.data.doctors[0].id }));
        }).catch((e) => toast.error(e.response?.data?.detail || "Hospital not found"));
    }, [hospitalId]);

    async function submit(e) {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post("/public/tokens", {
                ...form,
                hospital_id: hospitalId,
                patient_age: form.patient_age ? Number(form.patient_age) : null,
            });
            toast.success(`Token #${data.token_number} issued`);
            navigate(`/q/${data.qr_token}`);
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail) || e.message);
        } finally {
            setLoading(false);
        }
    }

    if (!info) return <div className="min-h-screen grid place-items-center text-[#5C6661]">Loading…</div>;

    return (
        <div className="min-h-screen bg-[#F9F9F7] grain">
            <div className="max-w-md mx-auto px-6 py-10">
                <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-[#5C6661]">Patient self register</div>
                <h1 className="font-heading text-3xl font-black tracking-tight mt-1">{info.hospital.name}</h1>
                <p className="text-sm text-[#5C6661] mt-2">Fill your details to get a token. You'll see your live queue position on the next screen.</p>

                <form onSubmit={submit} className="mt-8 space-y-4 bg-white border border-[#E2E5E0] rounded-2xl p-6" data-testid="patient-register-form">
                    <div>
                        <Label>Doctor</Label>
                        <Select value={form.doctor_id} onValueChange={(v) => setForm({ ...form, doctor_id: v })}>
                            <SelectTrigger className="mt-1.5 h-11 border-[#E2E5E0]" data-testid="patient-doctor-select">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {info.doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.name} — {d.specialization}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Session</Label>
                        <Select value={form.session} onValueChange={(v) => setForm({ ...form, session: v })}>
                            <SelectTrigger className="mt-1.5 h-11 border-[#E2E5E0]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="morning">Morning</SelectItem>
                                <SelectItem value="evening">Evening</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Your name</Label>
                        <Input value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
                            className="mt-1.5 h-11 border-[#E2E5E0]" required data-testid="patient-name-input" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>Phone</Label>
                            <Input value={form.patient_phone} onChange={(e) => setForm({ ...form, patient_phone: e.target.value })}
                                className="mt-1.5 h-11 border-[#E2E5E0]" required data-testid="patient-phone-input" />
                        </div>
                        <div>
                            <Label>Age</Label>
                            <Input type="number" value={form.patient_age} onChange={(e) => setForm({ ...form, patient_age: e.target.value })}
                                className="mt-1.5 h-11 border-[#E2E5E0]" data-testid="patient-age-input" />
                        </div>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full h-12 bg-[#2A4B41] hover:bg-[#1E362E] text-white" data-testid="patient-submit-btn">
                        {loading ? "Issuing…" : "Get my token"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
