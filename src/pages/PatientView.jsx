import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useHospitalSocket } from "../hooks/useHospitalSocket";
import { Clock, Hourglass, User } from "@phosphor-icons/react";

export default function PatientView() {
    const { qrToken } = useParams();
    const [data, setData] = useState(null);
    const [err, setErr] = useState("");

    const load = useCallback(async () => {
        try {
            const r = await api.get(`/public/token/${qrToken}`);
            setData(r.data);
        } catch (e) {
            setErr(e.response?.data?.detail || "Token not found");
        }
    }, [qrToken]);

    useEffect(() => {
        load();
        const t = setInterval(load, 15000);
        return () => clearInterval(t);
    }, [load]);

    useHospitalSocket(data?.token?.hospital_id, () => load());

    if (err) return <FullMessage text={err} />;
    if (!data) return <FullMessage text="Loading…" />;

    const t = data.token;
    const isNow = t.state === "called" || t.state === "in_consultation";

    return (
        <div className="min-h-screen bg-[#F9F9F7] grain">
            <div className="max-w-md mx-auto px-6 py-10">
                <div className="bg-[#2A4B41] rounded-2xl p-6 text-white">
                    <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-white/60">{data.hospital?.name}</div>
                    <div className="font-heading text-xl font-bold tracking-tight mt-1">{data.doctor?.name}</div>
                    <div className="text-xs text-white/70">{data.doctor?.specialization} · {t.session}</div>
                </div>

                <div className={`mt-6 bg-white border border-[#E2E5E0] rounded-2xl p-8 text-center ${isNow ? "token-pulse border-[#D36A50]" : ""}`}>
                    <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-[#5C6661]">Your token</div>
                    <div className="font-mono text-8xl md:text-9xl font-black tracking-tighter text-[#2A4B41] leading-none mt-2" data-testid="patient-token-number">
                        {t.token_number}
                    </div>
                    <div className="mt-4">
                        <StatePill state={t.state} />
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                    <Stat icon={User} label="Position" value={data.position ?? (isNow ? "Now" : "—")} />
                    <Stat icon={Hourglass} label="ETA" value={data.eta_minutes != null ? `~${data.eta_minutes} min` : (isNow ? "Now" : "—")} />
                </div>

                <div className="mt-6 bg-white border border-[#E2E5E0] rounded-2xl p-6">
                    <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-[#5C6661] flex items-center gap-2">
                        <Clock size={14} /> Now serving
                    </div>
                    <div className="font-mono text-5xl font-black tracking-tighter mt-1 text-[#1A1D1C]">
                        {data.now_serving ? data.now_serving.token_number : "—"}
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <div className="text-sm text-[#5C6661]">Patient · {t.patient_name}</div>
                    <div className="text-xs text-[#5C6661] mt-1">This page updates live. Keep it open.</div>
                </div>
            </div>
        </div>
    );
}

function Stat({ icon: Icon, label, value }) {
    return (
        <div className="bg-white border border-[#E2E5E0] rounded-2xl p-5">
            <div className="flex items-center justify-between">
                <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-[#5C6661]">{label}</div>
                <Icon size={16} className="text-[#2A4B41]" />
            </div>
            <div className="font-heading text-3xl font-black tracking-tight mt-2">{value}</div>
        </div>
    );
}

function StatePill({ state }) {
    const map = {
        waiting: ["Waiting", "bg-[#EDEDE8] text-[#1A1D1C]"],
        called: ["It's your turn!", "bg-[#D36A50] text-white"],
        in_consultation: ["In consultation", "bg-[#2A4B41] text-white"],
        completed: ["Completed", "bg-[#DCE0D9] text-[#2A4B41]"],
        no_show: ["No show", "bg-[#f4d4ca] text-[#9C3A24]"],
        cancelled: ["Cancelled", "bg-[#EDEDE8] text-[#5C6661]"],
    };
    const [label, cls] = map[state] || map.waiting;
    return <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold tracking-wide ${cls}`} data-testid="patient-state-pill">{label}</span>;
}

function FullMessage({ text }) {
    return <div className="min-h-screen bg-[#F9F9F7] grid place-items-center text-[#5C6661] font-heading">{text}</div>;
}
