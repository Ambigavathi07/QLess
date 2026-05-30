import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { api } from "../lib/api";
import {
    MagnifyingGlass, ArrowRight, CheckCircle, Users, Stethoscope, Television,
    DeviceMobile, ChartLineUp, Pill,
} from "@phosphor-icons/react";

export default function Landing() {
    const navigate = useNavigate();
    const [q, setQ] = useState("");
    const [city, setCity] = useState("all");
    const [dept, setDept] = useState("all");
    const [cities, setCities] = useState([]);
    const [depts, setDepts] = useState([]);
    const [hospitals, setHospitals] = useState([]);

    useEffect(() => {
    api.get("/public/search")
        .then((res) => {
            setHospitals(res.data || []);
        })
        .catch(console.error);
}, []);

    useEffect(() => {
        api.get("/public/cities").then((r) => setCities(r.data)).catch(() => {});
        api.get("/public/departments").then((r) => setDepts(r.data)).catch(() => {});
    }, []);

    function doSearch(e) {
        e?.preventDefault();
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (city && city !== "all") params.set("city", city);
        if (dept && dept !== "all") params.set("department", dept);
        navigate(`/search?${params.toString()}`);
    }

    return (
        <div className="min-h-screen bg-[#F9F9F7] grain">
            {/* Nav */}
            <header className="border-b border-[#E2E5E0]">
                <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2" data-testid="landing-brand">
                        <div className="w-9 h-9 rounded-lg bg-[#2A4B41] text-white grid place-items-center font-heading font-black">Q</div>
                        <div className="font-heading font-black tracking-tight text-xl">QLess</div>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link to="/search" data-testid="nav-search">
                            <Button variant="ghost" className="hover:bg-[#EDEDE8]">Find a hospital</Button>
                        </Link>
                        <Link to="/login" data-testid="nav-staff-login">
                            <Button variant="outline" className="border-[#1A1D1C] hover:bg-[#1A1D1C] hover:text-white">
                                Staff login
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero with search */}
            <section className="max-w-7xl mx-auto px-6 pt-16 md:pt-20 pb-16">
                <div className="grid md:grid-cols-12 gap-10 items-end">
                    <div className="md:col-span-7">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DCE0D9] text-[11px] tracking-[0.2em] uppercase font-bold text-[#2A4B41] mb-8" data-testid="landing-badge">
                            <span className="w-2 h-2 rounded-full bg-[#D36A50]" /> Book · Track · Skip the queue
                        </div>
                        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-none font-black text-[#1A1D1C]">
                            Find a doctor. <span className="italic text-[#D36A50]">Book a token.</span>
                            <br /> Arrive when it's your turn.
                        </h1>
                        <p className="mt-8 text-lg text-[#5C6661] max-w-xl leading-relaxed">
                            Search hospitals by city or department, see live queue status, book your token,
                            and know exactly when to leave home.
                        </p>

                        <form onSubmit={doSearch} className="mt-10 p-4 bg-white border border-[#E2E5E0] rounded-2xl grid md:grid-cols-12 gap-3" data-testid="landing-search-form">
                            <div className="md:col-span-5 relative">
                                <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5C6661]" />
                                <Input value={q} onChange={(e) => setQ(e.target.value)}
                                    placeholder="Hospital name"
                                    className="pl-10 h-12 border-[#E2E5E0]"
                                    data-testid="landing-search-q" />
                            </div>
                            <div className="md:col-span-3">
                                <Select value={city} onValueChange={setCity}>
                                    <SelectTrigger className="h-12 border-[#E2E5E0]" data-testid="landing-city-select">
                                        <SelectValue placeholder="Any city" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Any city</SelectItem>
                                        {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-3">
                                <Select value={dept} onValueChange={setDept}>
                                    <SelectTrigger className="h-12 border-[#E2E5E0]" data-testid="landing-dept-select">
                                        <SelectValue placeholder="Any department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Any department</SelectItem>
                                        {depts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="md:col-span-1 h-12 bg-[#2A4B41] hover:bg-[#1E362E] text-white" data-testid="landing-search-btn">
                                <ArrowRight size={18} />
                            </Button>
                        </form>

                        <div className="mt-8 flex flex-wrap gap-6 text-sm text-[#5C6661]">
                            {["Live queue · real time", "Medication history saved", "No app install"].map((t) => (
                                <span key={t} className="inline-flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-[#2A4B41]" /> {t}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="md:col-span-5">
                        <div className="relative rounded-2xl overflow-hidden border border-[#E2E5E0] bg-white">
                            <img src="https://images.pexels.com/photos/33812025/pexels-photo-33812025.jpeg"
                                alt="Hospital reception" className="w-full h-80 object-cover" />
                            <div className="absolute top-4 left-4 right-4 p-4 rounded-xl bg-white/95 border border-[#E2E5E0]">
                                <div className="text-[10px] tracking-[0.25em] uppercase text-[#5C6661] font-bold">Now serving</div>
                                <div className="font-mono text-5xl font-black tracking-tighter text-[#2A4B41] leading-none mt-1">A-024</div>
                                <div className="text-xs text-[#5C6661] mt-1">Dr. Sharma · ~6 min wait</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="border-y border-[#E2E5E0] bg-white">
                <div className="max-w-7xl mx-auto px-6 py-20">
                    <div className="grid md:grid-cols-12 gap-8">
                        <div className="md:col-span-4">
                            <div className="text-xs tracking-[0.25em] uppercase font-bold text-[#5C6661]">Inside QLess</div>
                            <h2 className="font-heading text-3xl lg:text-4xl font-black tracking-tight mt-3">
                                One platform, every touchpoint.
                            </h2>
                        </div>
                        <div className="md:col-span-8 grid sm:grid-cols-2 gap-6">
                            {[
                                { icon: MagnifyingGlass, title: "Discover", desc: "Search by city, department or hospital name." },
                                { icon: DeviceMobile, title: "Book online", desc: "Confirmed token + 'leave home now' signal based on your travel time." },
                                { icon: Users, title: "Reception console", desc: "Generate, skip, reassign tokens in seconds." },
                                { icon: Stethoscope, title: "Doctor panel", desc: "Call next + full patient medication history in one view." },
                                { icon: Pill, title: "Pharmacy flow", desc: "Dispense + mark paid, updates patient records instantly." },
                                { icon: Television, title: "Live TV board", desc: "Now serving + next 3, auto-refresh via WebSocket." },
                                { icon: ChartLineUp, title: "Analytics", desc: "Tokens/day, wait time, no-show rate, peak hours." },
                                { icon: CheckCircle, title: "Built for India", desc: "FIFO, emergency override, morning/evening sessions." },
                            ].map((f) => (
                                <div key={f.title} className="p-6 border border-[#E2E5E0] rounded-xl lift-card bg-white" data-testid={`feature-${f.title.toLowerCase().replace(/[^a-z]/g, "-")}`}>
                                    <f.icon size={28} weight="duotone" className="text-[#2A4B41]" />
                                    <div className="font-heading font-bold text-lg mt-4 tracking-tight">{f.title}</div>
                                    <div className="text-sm text-[#5C6661] mt-1.5 leading-relaxed">{f.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <footer className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-sm text-[#5C6661]">© 2026 QLess</div>
                <div className="flex gap-6 text-sm">
                    <Link to="/search" className="hover:text-[#2A4B41]">Find a hospital</Link>
                    <Link to="/login" className="hover:text-[#2A4B41]">Staff login</Link>
                </div>
            </footer>
        </div>
    );
}
