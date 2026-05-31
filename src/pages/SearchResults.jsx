import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { MagnifyingGlass, MapPin, Buildings, ArrowRight, Stethoscope } from "@phosphor-icons/react";

export default function SearchResults() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const [q, setQ] = useState(params.get("q") || "");
    const [city, setCity] = useState(params.get("city") || "all");
    const [dept, setDept] = useState(params.get("department") || "all");
    const [cities, setCities] = useState([]);
    const [depts, setDepts] = useState([]);
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get("/public/cities").then((r) => setCities(r.data)).catch(() => {});
        api.get("/public/departments").then((r) => setDepts(r.data)).catch(() => {});
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const query = {};
            if (params.get("q")) query.q = params.get("q");
            if (params.get("city")) query.city = params.get("city");
            if (params.get("department")) query.department = params.get("department");
            const r = await api.get("/public/search", { params: query });
            setList(r.data);
        } finally {
            setLoading(false);
        }
    }, [params]);

    useEffect(() => { load(); }, [load]);

    function submit(e) {
        e.preventDefault();
        const p = new URLSearchParams();
        if (q) p.set("q", q);
        if (city && city !== "all") p.set("city", city);
        if (dept && dept !== "all") p.set("department", dept);
        navigate(`/search?${p.toString()}`);
    }

    return (
        <div className="min-h-screen bg-[#F9F9F7] grain">
            <header className="border-b border-[#E2E5E0] bg-[#F9F9F7]">
                <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-[#2A4B41] text-white grid place-items-center font-heading font-black">Q</div>
                        <div className="font-heading font-black tracking-tight text-xl">QLess</div>
                    </Link>
                    <Link to="/login"><Button variant="outline" className="border-[#1A1D1C] hover:bg-[#1A1D1C] hover:text-white">Staff login</Button></Link>
                </div>
            </header>

            <section className="max-w-7xl mx-auto px-6 pt-10 pb-6">
                <div className="text-xs tracking-[0.25em] uppercase font-bold text-[#5C6661]">Search</div>
                <h1 className="font-heading text-3xl lg:text-4xl font-black tracking-tight mt-2">Find a hospital</h1>

                <form onSubmit={submit} className="mt-6 p-4 bg-white border border-[#E2E5E0] rounded-2xl grid md:grid-cols-12 gap-3" data-testid="search-form">
                    <div className="md:col-span-5 relative">
                        <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5C6661]" />
                        <Input value={q} onChange={(e) => setQ(e.target.value)}
                            placeholder="Hospital name"
                            className="pl-10 h-11 border-[#E2E5E0]"
                            data-testid="search-q" />
                    </div>
                    <div className="md:col-span-3">
                        <Select value={city} onValueChange={setCity}>
                            <SelectTrigger className="h-11 border-[#E2E5E0]" data-testid="search-city"><SelectValue placeholder="Any city" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Any city</SelectItem>
                                {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="md:col-span-3">
                        <Select value={dept} onValueChange={setDept}>
                            <SelectTrigger className="h-11 border-[#E2E5E0]" data-testid="search-dept"><SelectValue placeholder="Any department" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Any department</SelectItem>
                                {depts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit" className="md:col-span-1 h-11 bg-[#2A4B41] hover:bg-[#1E362E] text-white" data-testid="search-submit-btn">
                        <ArrowRight size={18} />
                    </Button>
                </form>
            </section>

            <section className="max-w-7xl mx-auto px-6 pb-16">
                <div className="flex items-baseline justify-between mb-5">
                    <div className="text-sm text-[#5C6661]" data-testid="search-count">
                        {loading ? "Searching..." : `${list.length} ${list.length === 1 ? "hospital" : "hospitals"} found`}
                    </div>
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                    {list.map((h) => (
                        <Link key={h.id} to={`/hospitals/${h.id}`} className="block" data-testid={`hospital-card-${h.id}`}>
                            <div className="p-6 bg-white border border-[#E2E5E0] rounded-2xl lift-card">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="font-heading text-xl font-bold tracking-tight">{h.name}</div>
                                        <div className="text-sm text-[#5C6661] flex items-center gap-1 mt-1">
                                            <MapPin size={14} /> {h.city} · {h.address}
                                        </div>
                                    </div>
                                    <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#5C6661]">
                                        {h.tokens_today} today
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {(h.departments || []).slice(0, 4).map((d) => (
                                        <span key={d} className="text-xs px-2 py-1 bg-[#EDEDE8] text-[#2A4B41] rounded-full font-medium">{d}</span>
                                    ))}
                                    {(h.departments || []).length > 4 && (
                                        <span className="text-xs px-2 py-1 text-[#5C6661]">+{h.departments.length - 4}</span>
                                    )}
                                </div>
                                <div className="mt-5 flex items-center justify-between pt-4 border-t border-[#E2E5E0]">
                                    <div className="inline-flex items-center gap-2 text-sm text-[#5C6661]">
                                        <Stethoscope size={16} /> {h.doctors_count} doctors
                                    </div>
                                    <div className="inline-flex items-center gap-1 text-sm font-bold text-[#2A4B41]">
                                        View & book <ArrowRight size={14} />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                    {!loading && list.length === 0 && (
                        <div className="md:col-span-2 text-center p-16 text-[#5C6661]" data-testid="no-results">
                            <Buildings size={40} className="mx-auto mb-4 text-[#5C6661]/60" />
                            No hospitals match your search. Try widening the filters.
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
