import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useHospitalSocket } from "../hooks/useHospitalSocket";

export default function DisplayBoard() {
    const { hospitalId } = useParams();
    const [data, setData] = useState(null);

    const load = useCallback(async () => {
        try {
            const r = await api.get(`/public/display/${hospitalId}`);
            setData(r.data);
        } catch (err) {
            console.warn("[display] fetch failed", err);
        }
    }, [hospitalId]);

    useEffect(() => {
        load();
        const t = setInterval(load, 10000);
        return () => clearInterval(t);
    }, [load]);
    useHospitalSocket(hospitalId, () => load());

    if (!data) return <div className="min-h-screen bg-[#1A1D1C] text-white grid place-items-center font-heading">Loading…</div>;

    const boards = data.boards || [];

    return (
        <div className="min-h-screen bg-[#1A1D1C] text-white p-8">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <div className="text-[11px] tracking-[0.4em] uppercase font-bold text-white/50">QLess Live Board</div>
                    <div className="font-heading text-3xl font-black tracking-tight mt-1">{data.hospital.name}</div>
                </div>
                <div className="text-right">
                    <div className="font-mono text-3xl font-black tracking-tight" data-testid="display-clock">
                        <Clock />
                    </div>
                    <div className="text-[10px] tracking-[0.3em] uppercase text-white/50 font-bold">Updated {new Date(data.at).toLocaleTimeString()}</div>
                </div>
            </header>

            {boards.length === 0 && (
                <div className="min-h-[60vh] grid place-items-center">
                    <div className="text-white/50 font-heading text-2xl">No active sessions yet today.</div>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                {boards.map((b) => (
                    <BoardCard key={`${b.doctor.id}-${b.session}`} board={b} />
                ))}
            </div>
        </div>
    );
}

function BoardCard({ board }) {
    const now = board.now_serving;
    const next = board.next || [];
    const paused = board.status === "paused";
    return (
        <div className="bg-[#232625] border border-white/5 rounded-2xl overflow-hidden" data-testid={`board-card-${board.doctor.id}`}>
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div>
                    <div className="font-heading text-xl font-bold tracking-tight">{board.doctor.name}</div>
                    <div className="text-[10px] tracking-[0.3em] uppercase text-white/50 font-bold">
                        {board.doctor.specialization} · {board.session}
                    </div>
                </div>
                {paused && <span className="px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase bg-[#D36A50] text-white">Paused</span>}
            </div>
            <div className="grid md:grid-cols-3 gap-0">
                <div className="md:col-span-1 p-6 bg-[#2A4B41] flex flex-col items-center justify-center min-h-[220px]">
                    <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-white/70">Now serving</div>
                    {now ? (
                        <div className="font-mono text-7xl md:text-8xl font-black tracking-tighter mt-2 token-pulse">
                            {now.token_number}
                        </div>
                    ) : (
                        <div className="font-mono text-6xl font-black tracking-tighter mt-2 text-white/30">—</div>
                    )}
                    {now && <div className="text-sm mt-2 text-white/80">{now.patient_name.split(" ")[0]}…</div>}
                </div>
                <div className="md:col-span-2 p-6">
                    <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-white/50 mb-3">Next in queue</div>
                    {next.length === 0 ? (
                        <div className="text-white/30">No patients waiting.</div>
                    ) : (
                        <ul className="space-y-3">
                            {next.map((t) => (
                                <li key={t.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="font-mono text-3xl font-black tracking-tight w-14">{t.token_number}</div>
                                        <div>
                                            <div className="font-medium">{t.patient_name}</div>
                                            <div className="text-[11px] text-white/50">~{t.eta_minutes} min</div>
                                        </div>
                                    </div>
                                    {t.priority === "emergency" && (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#D36A50]">EMR</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                    <div className="mt-4 text-[11px] tracking-[0.2em] uppercase text-white/40 font-bold">
                        Total waiting: <span className="text-white/80">{board.total_waiting}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Clock() {
    const [t, setT] = useState(new Date());
    useEffect(() => {
        const i = setInterval(() => setT(new Date()), 1000);
        return () => clearInterval(i);
    }, []);
    const pad = (n) => String(n).padStart(2, "0");
    return <>{pad(t.getHours())}:{pad(t.getMinutes())}:{pad(t.getSeconds())}</>;
}
