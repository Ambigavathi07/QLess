import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { MapPin, Phone, ArrowRight, Hourglass, Pause } from "@phosphor-icons/react";
import { useHospitalSocket } from "../hooks/useHospitalSocket";

export default function HospitalDetail() {
    const { hospitalId } = useParams();
    const [info, setInfo] = useState(null);
    const [session, setSession] = useState("morning");
    const [live, setLive] = useState(null);

    const load = useCallback(async () => {
        try {
            const r = await api.get(`/public/hospitals/${hospitalId}/doctors-live?session=${session}`);
            setInfo({ hospital: r.data.hospital });
            setLive(r.data.doctors);
        } catch (_) {}
    }, [hospitalId, session]);

    useEffect(() => { load(); }, [load]);
    useHospitalSocket(hospitalId, () => load());

    if (!info) return <div className="min-h-screen grid place-items-center text-[#5C6661]">Loading…</div>;
    const h = info.hospital;

    return (
        <div className="min-h-screen bg-[#F9F9F7] grain">
            <header className="border-b border-[#E2E5E0] bg-[#F9F9F7]">
                <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-[#2A4B41] text-white grid place-items-center font-heading font-black">Q</div>
                        <div className="font-heading font-black tracking-tight text-xl">QLess</div>
                    </Link>
                    <Link to="/search"><Button variant="ghost" className="hover:bg-[#EDEDE8]">← Search</Button></Link>
                </div>
            </header>

            <section className="max-w-7xl mx-auto px-6 pt-10">
                <div className="text-xs tracking-[0.25em] uppercase font-bold text-[#5C6661]">Hospital</div>
                <h1 className="font-heading text-3xl lg:text-5xl font-black tracking-tight mt-2">{h.name}</h1>
                <div className="mt-3 flex flex-wrap gap-5 text-sm text-[#5C6661]">
                    <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> {h.address}, {h.city}</span>
                    <span className="inline-flex items-center gap-1.5"><Phone size={14} /> {h.phone}</span>
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-5">
                    <div className="font-heading text-xl font-bold tracking-tight">Doctors today</div>
                    <Select value={session} onValueChange={setSession}>
                        <SelectTrigger className="w-[160px] h-10 border-[#E2E5E0]" data-testid="hospital-session-select"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="morning">Morning session</SelectItem>
                            <SelectItem value="evening">Evening session</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                    {live && live.map((d) => <DoctorCard key={d.doctor.id} d={d} session={session} hospitalId={h.id} />)}
                    {live && live.length === 0 && (
                        <div className="md:col-span-2 text-center text-[#5C6661] p-16">No active doctors.</div>
                    )}
                </div>
            </section>
        </div>
    );
}

function DoctorCard({ d, session, hospitalId }) {
    const doc = d.doctor;
    const paused = d.session_status === "paused";
    return (
        <div className="p-6 bg-white border border-[#E2E5E0] rounded-2xl" data-testid={`doctor-card-${doc.id}`}>
            <div className="flex items-start justify-between">
                <div>
                    <div className="font-heading text-lg font-bold tracking-tight">{doc.name}</div>
                    <div className="text-xs text-[#5C6661] mt-0.5">{doc.specialization}</div>
                </div>
                {paused && <span className="px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase bg-[#f4d4ca] text-[#9C3A24] inline-flex items-center gap-1"><Pause size={10} /> Paused</span>}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
                <Stat label="Now serving" value={d.now_serving ?? "—"} accent />
                <Stat label="Waiting" value={d.waiting} />
                <Stat label="Next ETA" value={`~${d.next_eta_minutes}m`} />
            </div>

            <Link to={`/book/${doc.id}?session=${session}&hospital=${hospitalId}`}>
                <Button className="w-full mt-5 h-11 bg-[#2A4B41] hover:bg-[#1E362E] text-white" data-testid={`book-btn-${doc.id}`}>
                    <Hourglass size={16} className="mr-1.5" /> Book token · see wait time <ArrowRight size={16} className="ml-1.5" />
                </Button>
            </Link>
        </div>
    );
}

function Stat({ label, value, accent }) {
    return (
        <div className="text-center p-3 rounded-lg bg-[#F9F9F7] border border-[#E2E5E0]">
            <div className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#5C6661]">{label}</div>
            <div className={`font-mono text-2xl font-black tracking-tight mt-1 ${accent ? "text-[#2A4B41]" : "text-[#1A1D1C]"}`}>{value}</div>
        </div>
    );
}
