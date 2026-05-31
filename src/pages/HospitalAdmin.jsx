import { useEffect, useState, useCallback } from "react";
import { api, formatApiError, API } from "../lib/api";
import AppShell from "../components/AppShell";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Plus,
  Stethoscope,
  User,
  Ticket,
  Clock,
  ChartBar,
  MagnifyingGlass,
  Pill,
  CurrencyInr,
  CheckCircle,
  XCircle,
  FileCsv,
  ClipboardText,
  Gavel,
  PencilSimple,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function HospitalAdmin() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [receptionists, setReceptionists] = useState([]);
  const [pharmacists, setPharmacists] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const load = useCallback(async () => {
    try {
      const d = await api.get("/doctors");
      setDoctors(d.data);

      try {
        const r = await api.get("/staff/receptionists");
        setReceptionists(r.data);
      } catch {}

      try {
        const p = await api.get("/staff/pharmacists");
        setPharmacists(p.data);
      } catch {}

      try {
        const a = await api.get("/analytics");
        setAnalytics(a.data);
      } catch {}
    } catch (e) {
      console.log("ERROR RESPONSE:", e.response?.data);
      console.log("ERROR STATUS:", e.response?.status);

      toast.error(
        e.response?.data?.message || e.response?.data?.title || e.message,
      );
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppShell
      title="Hospital Admin"
      subtitle="Staff · payments · reports · analytics"
      actions={
        <Link
          to={`/display/${user?.hospital_id}`}
          target="_blank"
          data-testid="open-display-btn"
        >
          <Button
            variant="outline"
            className="border-[#E2E5E0] hover:bg-[#EDEDE8]"
          >
            Open TV display
          </Button>
        </Link>
      }
    >
      {analytics && (
        <div className="grid md:grid-cols-4 gap-5 mb-8">
          {[
            {
              label: "Tokens today",
              value: analytics.tokens_today,
              icon: Ticket,
            },
            {
              label: "Completed",
              value: analytics.completed,
              icon: Stethoscope,
            },
            {
              label: "Avg wait (min)",
              value: analytics.avg_wait_minutes,
              icon: Clock,
            },
            {
              label: "No-show rate",
              value: `${analytics.no_show_rate}%`,
              icon: ChartBar,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="p-5 bg-white border border-[#E2E5E0] rounded-xl"
              data-testid={`analytics-${s.label.toLowerCase().replace(/[^a-z]/g, "-")}`}
            >
              <div className="flex items-center justify-between">
                <div className="text-[11px] tracking-[0.25em] uppercase font-bold text-[#5C6661]">
                  {s.label}
                </div>
                <s.icon size={18} className="text-[#2A4B41]" />
              </div>
              <div className="font-heading text-3xl font-black tracking-tight mt-2">
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      <Tabs defaultValue="doctors">
        <TabsList className="bg-[#EDEDE8] border border-[#E2E5E0] flex-wrap h-auto">
          <TabsTrigger value="doctors" data-testid="tab-doctors">
            Doctors
          </TabsTrigger>
          <TabsTrigger value="reception" data-testid="tab-reception">
            Reception
          </TabsTrigger>
          <TabsTrigger value="pharmacy" data-testid="tab-pharmacy">
            Pharmacy
          </TabsTrigger>
          <TabsTrigger value="payments" data-testid="tab-payments">
            Payments
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            Patient history
          </TabsTrigger>
          <TabsTrigger value="reports" data-testid="tab-reports">
            Monthly reports
          </TabsTrigger>
          <TabsTrigger value="audit" data-testid="tab-audit">
            Audit
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            Today
          </TabsTrigger>
        </TabsList>
        <TabsContent value="doctors" className="mt-6">
          <DoctorsPanel items={doctors} onChanged={load} />
        </TabsContent>
        <TabsContent value="reception" className="mt-6">
          <StaffPanel
            items={receptionists}
            label="Receptionists"
            endpoint="/staff/receptionist"
            onChanged={load}
          />
        </TabsContent>
        <TabsContent value="pharmacy" className="mt-6">
          <StaffPanel
            items={pharmacists}
            label="Pharmacists"
            endpoint="/staff/pharmacist"
            onChanged={load}
          />
        </TabsContent>
        <TabsContent value="payments" className="mt-6">
          <PaymentsPanel />
        </TabsContent>
        <TabsContent value="history" className="mt-6">
          <PatientHistory />
        </TabsContent>
        <TabsContent value="reports" className="mt-6">
          <ReportsPanel />
        </TabsContent>
        <TabsContent value="audit" className="mt-6">
          <AuditPanel doctors={doctors} />
        </TabsContent>
        <TabsContent value="analytics" className="mt-6">
          <AnalyticsPanel data={analytics} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function DoctorsPanel({ items, onChanged }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    specialization: "",
    avg_consultation_minutes: 10,
    queue_control_mode: "doctor",
  });
  async function submit(e) {
    e.preventDefault();
    try {
      await api.post("/doctors", {
        hospitalId: user?.hospitalId,
        name: form.name,
        email: form.email,
        password: form.password,
        specialization: form.specialization,
        queueControlMode: form.queue_control_mode,
        avgConsultationMinutes: Number(form.avg_consultation_minutes),
      });
      toast.success("Doctor added");
      setOpen(false);
      setForm({
        name: "",
        email: "",
        password: "",
        specialization: "",
        avg_consultation_minutes: 10,
        queue_control_mode: "doctor",
      });
      onChanged();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || e.message);
    }
  }
async function saveEdit(data) {
  try {
    await api.put(`/doctors/${editing.id}`, {
      name: data.name,
      specialization: data.specialization,
      avgConsultationMinutes: data.avgConsultationMinutes,
      queueControlMode: data.queueControlMode,
    });

    toast.success("Doctor updated");
    setEditing(null);
    onChanged();
  } catch (e) {
    console.log(e.response?.data);
    toast.error(
      e.response?.data?.message ||
      formatApiError(e.response?.data?.detail) ||
      e.message
    );
  }
}
  return (
    <div className="bg-white border border-[#E2E5E0] rounded-xl overflow-hidden">
      <div className="p-5 border-b border-[#E2E5E0] flex items-center justify-between">
        <div className="font-heading text-xl font-bold tracking-tight flex items-center gap-2">
          <Stethoscope size={20} /> Doctors
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="bg-[#2A4B41] hover:bg-[#1E362E] text-white"
              data-testid="add-doctor-btn"
            >
              <Plus size={16} className="mr-1.5" /> Add doctor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add doctor</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              {[
                ["name", "Full name"],
                ["email", "Email", "email"],
                ["password", "Password", "password"],
                ["specialization", "Department"],
                [
                  "avg_consultation_minutes",
                  "Avg consultation (min)",
                  "number",
                ],
              ].map(([k, l, t]) => (
                <div key={k}>
                  <Label>{l}</Label>
                  <Input
                    type={t || "text"}
                    value={form[k]}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                    className="mt-1.5 h-10 border-[#E2E5E0]"
                    required
                    data-testid={`doctor-field-${k}`}
                  />
                </div>
              ))}
              <div>
                <Label>Queue control mode</Label>
                <Select
                  value={form.queue_control_mode}
                  onValueChange={(v) =>
                    setForm({ ...form, queue_control_mode: v })
                  }
                >
                  <SelectTrigger
                    className="mt-1.5 h-10 border-[#E2E5E0]"
                    data-testid="doctor-field-mode"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor">
                      Doctor controlled (default)
                    </SelectItem>
                    <SelectItem value="reception">
                      Reception controlled
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full bg-[#2A4B41] hover:bg-[#1E362E] text-white"
                data-testid="doctor-submit-btn"
              >
                Add
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <table className="w-full text-sm" data-testid="doctors-table">
        <thead>
          <tr className="text-[11px] tracking-[0.2em] uppercase text-[#5C6661] bg-[#F9F9F7]">
            <th className="text-left p-4 font-bold">Name</th>
            <th className="text-left p-4 font-bold">Department</th>
            <th className="text-left p-4 font-bold">Avg time</th>
            <th className="text-left p-4 font-bold">Queue mode</th>
            <th className="text-right p-4 font-bold"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((d) => (
            <tr
              key={d.id}
              className="border-t border-[#E2E5E0] hover:bg-[#EDEDE8]"
            >
              <td className="p-4 font-medium">{d.name}</td>
              <td className="p-4">{d.specialization}</td>
              <td className="p-4 font-mono">
                {d.avgConsultationMinutes} min
              </td>{" "}
              <td className="p-4">
                <span
                  className={`text-xs px-2 py-1 rounded font-bold tracking-wide uppercase ${
                    d.queueControlMode === "reception"
                      ? "bg-[#f4d4ca] text-[#9C3A24]"
                      : "bg-[#DCE0D9] text-[#2A4B41]"
                  }`}
                >
                  {d.queueControlMode === "reception" ? "Reception" : "Doctor"}
                </span>
              </td>
              <td className="p-4 text-right">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7"
                  onClick={() => setEditing(d)}
                  data-testid={`edit-doctor-${d.id}`}
                >
                  <PencilSimple size={14} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editing?.name}</DialogTitle>
          </DialogHeader>
          {editing && <DoctorEditForm doctor={editing} onSave={saveEdit} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DoctorEditForm({ doctor, onSave }) {
const [patch, setPatch] = useState({
  name: doctor.name,
  specialization: doctor.specialization,
  avg_consultation_minutes:
    doctor.avgConsultationMinutes || 10,
  queue_control_mode:
    doctor.queueControlMode || "doctor",
});
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
onSave({
  name: patch.name,
  specialization: patch.specialization,
  avgConsultationMinutes: Number(patch.avg_consultation_minutes),
  queueControlMode: patch.queue_control_mode,
});
      }}
      className="space-y-4"
      data-testid="doctor-edit-form"
    >
      <div>
        <Label>Name</Label>
        <Input
          value={patch.name}
          onChange={(e) => setPatch({ ...patch, name: e.target.value })}
          className="mt-1.5 h-10 border-[#E2E5E0]"
        />
      </div>
      <div>
        <Label>Department</Label>
        <Input
          value={patch.specialization}
          onChange={(e) =>
            setPatch({ ...patch, specialization: e.target.value })
          }
          className="mt-1.5 h-10 border-[#E2E5E0]"
        />
      </div>
      <div>
        <Label>Avg consultation (min)</Label>
        <Input
          type="number"
          value={patch.avg_consultation_minutes}
          onChange={(e) =>
            setPatch({ ...patch, avg_consultation_minutes: e.target.value })
          }
          className="mt-1.5 h-10 border-[#E2E5E0]"
        />
      </div>
      <div>
        <Label>Queue control mode</Label>
        <Select
          value={patch.queue_control_mode}
          onValueChange={(v) => setPatch({ ...patch, queue_control_mode: v })}
        >
          <SelectTrigger
            className="mt-1.5 h-10 border-[#E2E5E0]"
            data-testid="edit-mode-select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="doctor">Doctor controlled</SelectItem>
            <SelectItem value="reception">Reception controlled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        type="submit"
        className="w-full bg-[#2A4B41] hover:bg-[#1E362E] text-white"
        data-testid="doctor-edit-save"
      >
        Save
      </Button>
    </form>
  );
}

function StaffPanel({ items, label, endpoint, onChanged }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  async function submit(e) {
    e.preventDefault();
    try {
      await api.post(endpoint, {
        hospitalId: user?.hospitalId,
        name: form.name,
        email: form.email,
        password: form.password,
      });
      toast.success(`${label.slice(0, -1)} added`);
      setOpen(false);
      setForm({ name: "", email: "", password: "" });
      onChanged();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || e.message);
    }
  }
  return (
    <div className="bg-white border border-[#E2E5E0] rounded-xl overflow-hidden">
      <div className="p-5 border-b border-[#E2E5E0] flex items-center justify-between">
        <div className="font-heading text-xl font-bold tracking-tight flex items-center gap-2">
          <User size={20} /> {label}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="bg-[#2A4B41] hover:bg-[#1E362E] text-white"
            >
              <Plus size={16} className="mr-1.5" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add {label.slice(0, -1).toLowerCase()}</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              {[
                ["name", "Full name"],
                ["email", "Email", "email"],
                ["password", "Password", "password"],
              ].map(([k, l, t]) => (
                <div key={k}>
                  <Label>{l}</Label>
                  <Input
                    type={t || "text"}
                    value={form[k]}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                    className="mt-1.5 h-10 border-[#E2E5E0]"
                    required
                  />
                </div>
              ))}
              <Button
                type="submit"
                className="w-full bg-[#2A4B41] hover:bg-[#1E362E] text-white"
              >
                Add
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <ul className="divide-y divide-[#E2E5E0]">
        {items.map((r) => (
          <li
            key={r.id}
            className="p-4 flex items-center justify-between hover:bg-[#EDEDE8]"
          >
            <div>
              <div className="font-medium">{r.name}</div>
              <div className="text-xs text-[#5C6661]">{r.email}</div>
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <li className="p-10 text-center text-[#5C6661]">None yet.</li>
        )}
      </ul>
    </div>
  );
}

function PaymentsPanel() {
  const [status, setStatus] = useState("pending");
  const [items, setItems] = useState([]);

  const load = useCallback(async () => {
    try {
      const r = await api.get("/payments", { params: { status } });
      setItems(r.data);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || e.message);
    }
  }, [status]);
  useEffect(() => {
    load();
  }, [load]);

  async function act(id, action) {
    try {
      await api.post(`/payments/${id}/${action}`);
      toast.success(
        action === "approve" ? "Payment approved" : "Payment rejected",
      );
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || e.message);
    }
  }

  return (
    <Tabs value={status} onValueChange={setStatus}>
      <TabsList className="bg-[#EDEDE8] border border-[#E2E5E0]">
        <TabsTrigger value="pending" data-testid="payments-tab-pending">
          Pending approval
        </TabsTrigger>
        <TabsTrigger value="approved" data-testid="payments-tab-approved">
          Approved
        </TabsTrigger>
        <TabsTrigger value="rejected" data-testid="payments-tab-rejected">
          Rejected
        </TabsTrigger>
      </TabsList>
      <TabsContent value={status} className="mt-5">
        <div
          className="bg-white border border-[#E2E5E0] rounded-xl overflow-hidden"
          data-testid="payments-list"
        >
          {items.length === 0 && (
            <div className="p-10 text-center text-[#5C6661]">Nothing here.</div>
          )}
          {items.map((p) => (
            <div
              key={p.id}
              className="p-4 border-b border-[#E2E5E0] last:border-b-0 flex flex-wrap items-center gap-4"
            >
              <div className="flex-1 min-w-[220px]">
                <div className="font-medium">
                  {p.patient_name}{" "}
                  <span className="text-xs text-[#5C6661] font-mono ml-1">
                    {p.patient_phone}
                  </span>
                </div>
                <div className="text-xs text-[#5C6661]">
                  {p.type} · {p.method} · by {p.recorded_by_name} ·{" "}
                  {new Date(p.created_at).toLocaleString()}
                </div>
                {p.notes && (
                  <div className="text-xs text-[#5C6661] mt-1 italic">
                    {p.notes}
                  </div>
                )}
              </div>
              <div className="font-mono text-2xl font-black tracking-tight text-[#2A4B41]">
                ₹{p.amount.toFixed(2)}
              </div>
              {status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => act(p.id, "approve")}
                    className="bg-[#2A4B41] hover:bg-[#1E362E] text-white"
                    data-testid={`approve-payment-${p.id}`}
                  >
                    <CheckCircle size={14} className="mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => act(p.id, "reject")}
                    className="border-[#D36A50] text-[#D36A50] hover:bg-[#D36A50] hover:text-white"
                    data-testid={`reject-payment-${p.id}`}
                  >
                    <XCircle size={14} className="mr-1" /> Reject
                  </Button>
                </div>
              )}
              {status !== "pending" && (
                <div className="text-xs text-[#5C6661]">
                  {status === "approved"
                    ? `Approved by ${p.approved_by_name}`
                    : "Rejected"}
                </div>
              )}
            </div>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}

function PatientHistory() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function search(e) {
    e?.preventDefault();
    if (!name && !phone) return;
    setLoading(true);
    try {
      const r = await api.get("/admin/patient-history", {
        params: { name: name || undefined, phone: phone || undefined },
      });
      setResult(r.data);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={search}
        className="bg-white border border-[#E2E5E0] rounded-xl p-5 grid md:grid-cols-12 gap-3"
        data-testid="patient-history-form"
      >
        <div className="md:col-span-5">
          <Label>Patient name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 h-10 border-[#E2E5E0]"
            placeholder="Ramesh"
            data-testid="history-name"
          />
        </div>
        <div className="md:col-span-5">
          <Label>Phone (primary)</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1.5 h-10 border-[#E2E5E0]"
            placeholder="9876543210"
            data-testid="history-phone"
          />
        </div>
        <div className="md:col-span-2 flex items-end">
          <Button
            type="submit"
            disabled={loading || (!name && !phone)}
            className="w-full h-10 bg-[#2A4B41] hover:bg-[#1E362E] text-white"
            data-testid="history-search-btn"
          >
            <MagnifyingGlass size={14} className="mr-1.5" /> Search
          </Button>
        </div>
      </form>

      {result && (
        <>
          <div className="grid md:grid-cols-4 gap-5">
            <Stat icon={Ticket} label="Visits" value={result.total_visits} />
            <Stat
              icon={Pill}
              label="Meds paid (₹)"
              value={result.total_spend_paid.toFixed(2)}
            />
            <Stat
              icon={CurrencyInr}
              label="Fees paid (₹)"
              value={result.total_paid_fees.toFixed(2)}
            />
            <Stat
              icon={CurrencyInr}
              label="Outstanding (₹)"
              value={(result.outstanding + result.pending_fees).toFixed(2)}
              accent
            />
          </div>

          <div
            className="bg-white border border-[#E2E5E0] rounded-xl overflow-hidden"
            data-testid="history-results"
          >
            {result.visits.length === 0 && (
              <div className="p-10 text-center text-[#5C6661]">
                No visits found.
              </div>
            )}
            {result.visits.map((v) => (
              <div
                key={v.id}
                className="p-5 border-b border-[#E2E5E0] last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {v.patient_name}{" "}
                      <span className="text-xs text-[#5C6661] ml-2">
                        {v.patient_phone}
                      </span>
                    </div>
                    <div className="text-xs text-[#5C6661]">
                      {v.date} · {v.session} · {v.doctor_name} (
                      {v.doctor_specialization}) · token #{v.token_number}
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#EDEDE8] text-[#5C6661] font-bold uppercase tracking-wider">
                    {v.state.replace("_", " ")}
                  </span>
                </div>
                {v.diagnosis && (
                  <div className="mt-2 text-sm text-[#2A4B41]">
                    Dx: {v.diagnosis}
                  </div>
                )}
                {v.medications.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm">
                    {v.medications.map((m) => (
                      <li key={m.id} className="flex items-center gap-2">
                        <Pill size={12} className="text-[#2A4B41]" />
                        <span className="font-medium">{m.name}</span>
                        <span className="text-xs text-[#5C6661]">
                          {m.dosage} · {m.frequency} · {m.duration}
                        </span>
                        <span className="ml-auto font-mono text-xs">
                          ₹{(m.price || 0).toFixed(2)}
                        </span>
                        {m.paid ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#DCE0D9] text-[#2A4B41] font-bold">
                            paid
                          </span>
                        ) : m.dispensed ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f4d4ca] text-[#9C3A24] font-bold">
                            unpaid
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EDEDE8] text-[#5C6661] font-bold">
                            pending
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {result.payments?.length > 0 && (
            <div className="bg-white border border-[#E2E5E0] rounded-xl overflow-hidden">
              <div className="p-5 border-b border-[#E2E5E0] font-heading text-lg font-bold tracking-tight flex items-center gap-2">
                <CurrencyInr size={18} /> Payments
              </div>
              <ul className="divide-y divide-[#E2E5E0]">
                {result.payments.map((p) => (
                  <li
                    key={p.id}
                    className="p-4 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">
                        ₹{p.amount.toFixed(2)} · {p.type}
                      </div>
                      <div className="text-xs text-[#5C6661]">
                        {p.method} · {new Date(p.created_at).toLocaleString()}
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-wide ${p.status === "approved" ? "bg-[#DCE0D9] text-[#2A4B41]" : p.status === "pending" ? "bg-[#EDEDE8] text-[#5C6661]" : "bg-[#f4d4ca] text-[#9C3A24]"}`}
                    >
                      {p.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ReportsPanel() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await api.get("/reports/monthly", { params: { year, month } });
      setData(r.data);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || e.message);
    }
  }, [year, month]);
  useEffect(() => {
    load();
  }, [load]);

  function exportCsv() {
    const url = `${API}/reports/monthly/export?year=${year}&month=${month}`;
    window.open(url, "_blank");
  }

  return (
    <div className="space-y-5">
      <div
        className="bg-white border border-[#E2E5E0] rounded-xl p-5 flex flex-wrap items-end gap-3"
        data-testid="reports-filter"
      >
        <div>
          <Label>Month</Label>
          <Select
            value={String(month)}
            onValueChange={(v) => setMonth(Number(v))}
          >
            <SelectTrigger
              className="mt-1.5 w-[140px] h-10 border-[#E2E5E0]"
              data-testid="report-month-select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {new Date(2000, m - 1).toLocaleString("default", {
                    month: "long",
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Year</Label>
          <Input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="mt-1.5 w-28 h-10 border-[#E2E5E0]"
            data-testid="report-year-input"
          />
        </div>
        <Button
          onClick={exportCsv}
          variant="outline"
          className="h-10 border-[#2A4B41] text-[#2A4B41] hover:bg-[#2A4B41] hover:text-white"
          data-testid="report-export-csv"
        >
          <FileCsv size={16} className="mr-1.5" /> Export CSV
        </Button>
      </div>

      {data && (
        <>
          <div className="grid md:grid-cols-4 gap-5">
            <Stat
              icon={Ticket}
              label="Total tokens"
              value={data.tokens_total}
            />
            <Stat icon={CheckCircle} label="Completed" value={data.completed} />
            <Stat
              icon={ChartBar}
              label="No-show rate"
              value={`${data.no_show_rate}%`}
            />
            <Stat
              icon={CurrencyInr}
              label="Revenue (₹)"
              value={data.total_revenue.toFixed(2)}
              accent
            />
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <Stat
              icon={Clock}
              label="Avg wait (min)"
              value={data.avg_wait_minutes}
            />
            <Stat
              icon={Clock}
              label="Avg consultation (min)"
              value={data.avg_consultation_minutes}
            />
            <Stat icon={XCircle} label="Cancelled" value={data.cancelled} />
          </div>

          <div className="bg-white border border-[#E2E5E0] rounded-xl p-6">
            <div className="font-heading text-lg font-bold tracking-tight mb-4">
              Per doctor
            </div>
            <table
              className="w-full text-sm"
              data-testid="report-doctors-table"
            >
              <thead>
                <tr className="text-[11px] tracking-[0.2em] uppercase text-[#5C6661]">
                  <th className="text-left p-3 font-bold">Doctor</th>
                  <th className="text-left p-3 font-bold">Department</th>
                  <th className="text-left p-3 font-bold">Tokens</th>
                  <th className="text-left p-3 font-bold">Completed</th>
                  <th className="text-left p-3 font-bold">No-show</th>
                  <th className="text-left p-3 font-bold">Cancelled</th>
                </tr>
              </thead>
              <tbody>
                {data.per_doctor.map((d) => (
                  <tr key={d.doctor_id} className="border-t border-[#E2E5E0]">
                    <td className="p-3 font-medium">{d.doctor_name}</td>
                    <td className="p-3">{d.specialization}</td>
                    <td className="p-3 font-mono">{d.tokens}</td>
                    <td className="p-3 font-mono">{d.completed}</td>
                    <td className="p-3 font-mono">{d.no_show}</td>
                    <td className="p-3 font-mono">{d.cancelled}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function AuditPanel({ doctors }) {
  const [logs, setLogs] = useState([]);
  const [date, setDate] = useState("");
  const [doctorId, setDoctorId] = useState("all");

  const load = useCallback(async () => {
    try {
      const params = {};
      if (date) params.date = date;
      if (doctorId && doctorId !== "all") params.doctor_id = doctorId;
      const r = await api.get("/audit/call-next", { params });
      setLogs(r.data);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || e.message);
    }
  }, [date, doctorId]);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="bg-white border border-[#E2E5E0] rounded-xl p-5 flex flex-wrap items-end gap-3">
        <div>
          <Label>Date (YYYY-MM-DD)</Label>
          <Input
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="2026-04-24"
            className="mt-1.5 w-44 h-10 border-[#E2E5E0]"
            data-testid="audit-date-input"
          />
        </div>
        <div>
          <Label>Doctor</Label>
          <Select value={doctorId} onValueChange={setDoctorId}>
            <SelectTrigger
              className="mt-1.5 w-[220px] h-10 border-[#E2E5E0]"
              data-testid="audit-doctor-select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All doctors</SelectItem>
              {doctors.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white border border-[#E2E5E0] rounded-xl overflow-hidden">
        <div className="p-5 border-b border-[#E2E5E0] font-heading text-lg font-bold tracking-tight flex items-center gap-2">
          <ClipboardText size={18} /> Call-next audit log
        </div>
        {logs.length === 0 && (
          <div className="p-10 text-center text-[#5C6661]">No entries.</div>
        )}
        <ul
          className="divide-y divide-[#E2E5E0] max-h-[560px] overflow-y-auto"
          data-testid="audit-list"
        >
          {logs.map((l) => (
            <li key={l.id} className="p-4 flex items-center gap-4">
              <div className="font-mono text-xl font-black tracking-tight w-14 text-[#2A4B41]">
                {l.token_number}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{l.doctor_name}</div>
                <div className="text-xs text-[#5C6661]">
                  called by <b>{l.actor_name}</b> ({l.actor_role}) · mode:{" "}
                  {l.mode} · {l.session}
                </div>
              </div>
              <div className="text-xs text-[#5C6661] font-mono">
                {new Date(l.at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }) {
  return (
    <div className="p-5 bg-white border border-[#E2E5E0] rounded-xl">
      <div className="flex items-center justify-between">
        <div className="text-[11px] tracking-[0.25em] uppercase font-bold text-[#5C6661]">
          {label}
        </div>
        <Icon size={18} className="text-[#2A4B41]" />
      </div>
      <div
        className={`font-heading text-3xl font-black tracking-tight mt-2 ${accent ? "text-[#D36A50]" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

function AnalyticsPanel({ data }) {
  if (!data) return <div className="text-[#5C6661]">Loading...</div>;
  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E2E5E0] rounded-xl p-6">
        <div className="font-heading text-lg font-bold tracking-tight mb-4">
          Hourly tokens (today)
        </div>
        <div className="h-64" data-testid="hourly-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.hourly_distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDEDE8" />
              <XAxis dataKey="hour" stroke="#5C6661" fontSize={11} />
              <YAxis stroke="#5C6661" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #E2E5E0",
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="tokens" fill="#2A4B41" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white border border-[#E2E5E0] rounded-xl p-6">
        <div className="font-heading text-lg font-bold tracking-tight mb-4">
          Per doctor (today)
        </div>
        <table className="w-full text-sm" data-testid="per-doctor-table">
          <thead>
            <tr className="text-[11px] tracking-[0.2em] uppercase text-[#5C6661]">
              <th className="text-left p-3 font-bold">Doctor</th>
              <th className="text-left p-3 font-bold">Tokens</th>
              <th className="text-left p-3 font-bold">Completed</th>
              <th className="text-left p-3 font-bold">No-show</th>
            </tr>
          </thead>
          <tbody>
            {data.per_doctor.map((d) => (
              <tr key={d.doctor_id} className="border-t border-[#E2E5E0]">
                <td className="p-3 font-medium">{d.doctor_name}</td>
                <td className="p-3 font-mono">{d.tokens}</td>
                <td className="p-3 font-mono">{d.completed}</td>
                <td className="p-3 font-mono">{d.no_show}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
