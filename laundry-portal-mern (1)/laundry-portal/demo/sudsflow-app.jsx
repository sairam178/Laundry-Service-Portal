import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles, Package, Truck, CheckCircle2, Clock, ShieldCheck, LogOut,
  Plus, Trash2, Pencil, ArrowLeft, ShirtIcon, Loader2, User as UserIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ *
 *  Persistence layer: this stands in for the MongoDB/Express backend.
 *  Same shape / rules as backend/models + controllers in the real repo:
 *  - services: catalog, admin CRUD
 *  - users: register/login (demo only — plaintext, real backend uses bcrypt+JWT)
 *  - orders: booking, status history, payment
 * ------------------------------------------------------------------ */
const STAGES = [
  "Pending", "Confirmed", "Picked Up", "In Progress",
  "Ready for Delivery", "Out for Delivery", "Delivered",
];
const NEXT_STATUS = Object.fromEntries(STAGES.slice(0, -1).map((s, i) => [s, STAGES[i + 1]]));

const DEFAULT_SERVICES = [
  { id: "s1", name: "Everyday Wash & Fold", category: "Wash & Fold", unit: "kg", price: 60, turnaround: 24, active: true },
  { id: "s2", name: "Bedsheet & Linen Wash", category: "Wash & Fold", unit: "kg", price: 70, turnaround: 36, active: true },
  { id: "s3", name: "Premium Dry Cleaning", category: "Dry Cleaning", unit: "item", price: 150, turnaround: 48, active: true },
  { id: "s4", name: "Steam Ironing", category: "Ironing", unit: "item", price: 20, turnaround: 12, active: true },
  { id: "s5", name: "Sneaker & Shoe Cleaning", category: "Shoe Cleaning", unit: "item", price: 120, turnaround: 48, active: true },
];

const DEFAULT_USERS = [
  { email: "demo@customer.com", password: "pass123", name: "Aditi Rao", phone: "9876543210", role: "customer" },
  { email: "demo@provider.com", password: "pass123", name: "Karan Singh", phone: "9988776655", role: "provider" },
  { email: "demo@admin.com", password: "pass123", name: "Priya Nair", phone: "9123456780", role: "admin" },
];

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 8));

async function loadKey(key, fallback) {
  try {
    const res = await window.storage.get(key);
    return res ? JSON.parse(res.value) : fallback;
  } catch {
    return fallback;
  }
}
async function saveKey(key, value) {
  try {
    await window.storage.set(key, JSON.stringify(value));
  } catch (e) {
    console.error("storage save failed", key, e);
  }
}

const badgeClass = (status) => {
  if (status === "Delivered") return "bg-emerald-100 text-emerald-700";
  if (status === "Cancelled") return "bg-red-100 text-red-700";
  if (status === "Pending") return "bg-amber-100 text-amber-700";
  return "bg-teal-100 text-teal-700";
};
const payBadgeClass = (s) => (s === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700");

export default function SudsFlowApp() {
  const [booting, setBooting] = useState(true);
  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [screen, setScreen] = useState("home");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  /* ---------------- boot: load or seed everything ---------------- */
  useEffect(() => {
    (async () => {
      let svc = await loadKey("services", null);
      if (!svc) { svc = DEFAULT_SERVICES; await saveKey("services", svc); }

      let usr = await loadKey("users", null);
      if (!usr) { usr = DEFAULT_USERS; await saveKey("users", usr); }

      let ord = await loadKey("orders", null);
      if (!ord) { ord = []; await saveKey("orders", ord); }

      const session = await loadKey("session", null);

      setServices(svc);
      setUsers(usr);
      setOrders(ord);
      if (session) {
        const found = usr.find((u) => u.email === session);
        if (found) {
          setCurrentUser(found);
          setScreen(found.role === "admin" ? "admin" : found.role === "provider" ? "provider" : "home");
        }
      }
      setBooting(false);
    })();
  }, []);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2200); };

  /* ---------------- auth ---------------- */
  const handleLogin = async (email, password) => {
    setError("");
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!found) return setError("Invalid email or password.");
    setCurrentUser(found);
    await saveKey("session", found.email);
    setScreen(found.role === "admin" ? "admin" : found.role === "provider" ? "provider" : "home");
    flash(`Welcome back, ${found.name.split(" ")[0]}!`);
  };

  const handleRegister = async (form) => {
    setError("");
    if (users.some((u) => u.email.toLowerCase() === form.email.toLowerCase())) {
      return setError("An account with this email already exists.");
    }
    const newUser = { ...form, role: form.role === "provider" ? "provider" : "customer" };
    const updated = [...users, newUser];
    setUsers(updated);
    await saveKey("users", updated);
    setCurrentUser(newUser);
    await saveKey("session", newUser.email);
    setScreen(newUser.role === "provider" ? "provider" : "home");
    flash("Account created!");
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    await saveKey("session", null);
    setScreen("home");
  };

  /* ---------------- orders ---------------- */
  const createOrder = async (booking) => {
    const items = booking.items.map((i) => {
      const svc = services.find((s) => s.id === i.serviceId);
      return { serviceId: svc.id, name: svc.name, price: svc.price, quantity: i.quantity, subtotal: svc.price * i.quantity };
    });
    const total = items.reduce((sum, i) => sum + i.subtotal, 0);
    const newOrder = {
      id: uid(),
      customerEmail: currentUser.email,
      customerName: currentUser.name,
      customerPhone: currentUser.phone,
      items,
      pickupAddress: booking.pickupAddress,
      deliveryAddress: booking.deliveryAddress,
      pickupDate: booking.pickupDate,
      pickupSlot: booking.pickupSlot,
      instructions: booking.instructions,
      status: "Pending",
      paymentStatus: "Unpaid",
      paymentMethod: booking.paymentMethod,
      providerEmail: null,
      total,
      history: [{ status: "Pending", note: "Booking placed by customer", at: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
    };
    const updated = [newOrder, ...orders];
    setOrders(updated);
    await saveKey("orders", updated);
    setSelectedOrderId(newOrder.id);
    setScreen("orderdetail");
    flash("Booking confirmed!");
  };

  const updateOrder = async (orderId, patch, historyEntry) => {
    const updated = orders.map((o) => {
      if (o.id !== orderId) return o;
      const next = { ...o, ...patch };
      if (historyEntry) next.history = [...o.history, { ...historyEntry, at: new Date().toISOString() }];
      return next;
    });
    setOrders(updated);
    await saveKey("orders", updated);
  };

  const advanceStatus = async (order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    const patch = { status: next };
    if (!order.providerEmail) patch.providerEmail = currentUser.email;
    if (next === "Delivered" && order.paymentMethod === "Cash on Delivery") patch.paymentStatus = "Paid";
    await updateOrder(order.id, patch, { status: next, note: `Marked by ${currentUser.name}` });
    flash(`Order moved to "${next}"`);
  };

  const cancelOrder = async (order) => {
    await updateOrder(order.id, { status: "Cancelled" }, { status: "Cancelled", note: "Cancelled by customer" });
    flash("Booking cancelled.");
  };

  const payOrder = async (order, method) => {
    const patch = { paymentStatus: "Paid", paymentMethod: method };
    const historyEntry = { status: order.status, note: "Payment received" };
    if (order.status === "Pending") { patch.status = "Confirmed"; historyEntry.status = "Confirmed"; }
    await updateOrder(order.id, patch, historyEntry);
    flash("Payment successful!");
    setScreen("orderdetail");
  };

  /* ---------------- admin: services CRUD ---------------- */
  const saveService = async (svc) => {
    let updated;
    if (svc.id) {
      updated = services.map((s) => (s.id === svc.id ? svc : s));
    } else {
      updated = [...services, { ...svc, id: uid() }];
    }
    setServices(updated);
    await saveKey("services", updated);
    flash("Service saved.");
  };
  const deleteService = async (id) => {
    const updated = services.filter((s) => s.id !== id);
    setServices(updated);
    await saveKey("services", updated);
  };
  const toggleService = async (id) => {
    const updated = services.map((s) => (s.id === id ? { ...s, active: !s.active } : s));
    setServices(updated);
    await saveKey("services", updated);
  };

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-teal-50">
        <Loader2 className="animate-spin text-teal-700" size={28} />
      </div>
    );
  }

  const myOrders = currentUser ? orders.filter((o) => o.customerEmail === currentUser.email) : [];
  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || null;

  return (
    <div className="min-h-screen bg-teal-50 font-sans text-slate-800 flex flex-col">
      <Navbar currentUser={currentUser} setScreen={setScreen} onLogout={handleLogout} />
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      <main className="flex-1">
        {screen === "home" && <HomeScreen setScreen={setScreen} currentUser={currentUser} />}

        {screen === "services" && <ServicesScreen services={services.filter((s) => s.active)} setScreen={setScreen} currentUser={currentUser} />}

        {screen === "login" && (
          <AuthLayout title="Welcome back" subtitle="Log in to book a pickup or check your order status.">
            <LoginForm onSubmit={handleLogin} error={error} />
            <p className="text-center text-sm mt-4">
              New to SudsFlow?{" "}
              <button className="text-teal-700 font-semibold underline" onClick={() => { setError(""); setScreen("register"); }}>Create an account</button>
            </p>
            <div className="mt-5 bg-teal-50 border border-teal-100 rounded-lg p-3 text-xs text-slate-500">
              Demo logins — customer: demo@customer.com · provider: demo@provider.com · admin: demo@admin.com (password: pass123)
            </div>
          </AuthLayout>
        )}

        {screen === "register" && (
          <AuthLayout title="Create your account" subtitle="Book pickups, track orders, and pay online in one place.">
            <RegisterForm onSubmit={handleRegister} error={error} />
            <p className="text-center text-sm mt-4">
              Already have an account?{" "}
              <button className="text-teal-700 font-semibold underline" onClick={() => { setError(""); setScreen("login"); }}>Log in</button>
            </p>
          </AuthLayout>
        )}

        {screen === "book" && currentUser?.role === "customer" && (
          <BookScreen services={services.filter((s) => s.active)} currentUser={currentUser} onSubmit={createOrder} />
        )}

        {screen === "myorders" && currentUser?.role === "customer" && (
          <MyOrdersScreen orders={myOrders} setScreen={setScreen} setSelectedOrderId={setSelectedOrderId} />
        )}

        {screen === "orderdetail" && selectedOrder && (
          <OrderDetailScreen
            order={selectedOrder} currentUser={currentUser} setScreen={setScreen}
            onCancel={cancelOrder} onGoPay={() => setScreen("pay")}
          />
        )}

        {screen === "pay" && selectedOrder && (
          <PayScreen order={selectedOrder} onPay={payOrder} setScreen={setScreen} />
        )}

        {screen === "provider" && currentUser?.role === "provider" && (
          <ProviderScreen orders={orders} currentUser={currentUser} onAdvance={advanceStatus} />
        )}

        {screen === "admin" && currentUser?.role === "admin" && (
          <AdminScreen orders={orders} setScreen={setScreen} />
        )}

        {screen === "adminservices" && currentUser?.role === "admin" && (
          <AdminServicesScreen services={services} onSave={saveService} onDelete={deleteService} onToggle={toggleService} setScreen={setScreen} />
        )}
      </main>

      <footer className="border-t border-teal-100 bg-white py-4 text-center text-xs text-slate-400">
        SudsFlow — B.Tech Mini Project (MERN Stack) · data persists via Claude artifact storage
      </footer>
    </div>
  );
}

/* ===================== shared bits ===================== */

function Navbar({ currentUser, setScreen, onLogout }) {
  return (
    <header className="bg-white border-b border-teal-100 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
        <button onClick={() => setScreen("home")} className="flex items-center gap-2 font-bold text-teal-800 text-lg">
          <Sparkles size={18} className="text-orange-500" /> SudsFlow
        </button>
        <nav className="flex items-center gap-5 text-sm font-medium">
          {!currentUser && (
            <>
              <button onClick={() => setScreen("services")} className="hover:text-teal-700">Services</button>
              <button onClick={() => setScreen("login")} className="hover:text-teal-700">Log in</button>
              <button onClick={() => setScreen("register")} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full">Get started</button>
            </>
          )}
          {currentUser?.role === "customer" && (
            <>
              <button onClick={() => setScreen("services")} className="hover:text-teal-700">Services</button>
              <button onClick={() => setScreen("book")} className="hover:text-teal-700">Book pickup</button>
              <button onClick={() => setScreen("myorders")} className="hover:text-teal-700">My orders</button>
            </>
          )}
          {currentUser?.role === "provider" && <button onClick={() => setScreen("provider")} className="hover:text-teal-700">Dashboard</button>}
          {currentUser?.role === "admin" && (
            <>
              <button onClick={() => setScreen("admin")} className="hover:text-teal-700">Dashboard</button>
              <button onClick={() => setScreen("adminservices")} className="hover:text-teal-700">Services</button>
            </>
          )}
          {currentUser && (
            <div className="flex items-center gap-3 pl-4 border-l border-teal-100">
              <span className="text-teal-800 font-semibold flex items-center gap-1"><UserIcon size={14} />{currentUser.name.split(" ")[0]}</span>
              <button onClick={onLogout} className="flex items-center gap-1 text-slate-500 hover:text-red-600 text-xs"><LogOut size={14} />Log out</button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

function Card({ children, className = "" }) {
  return <div className={`bg-white border border-teal-100 rounded-2xl shadow-sm p-6 ${className}`}>{children}</div>;
}

function StatusBadge({ status }) {
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${badgeClass(status)}`}>{status}</span>;
}
function PayBadge({ status }) {
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${payBadgeClass(status)}`}>{status}</span>;
}

function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex justify-center px-5 py-14">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">{title}</h1>
        <p className="text-slate-500 text-sm mb-5">{subtitle}</p>
        {children}
      </Card>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
const inputCls = "w-full border border-teal-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300";

/* ===================== Home ===================== */

function HomeScreen({ setScreen, currentUser }) {
  const bookTarget = currentUser?.role === "customer" ? "book" : "register";
  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-800 via-teal-700 to-teal-600 text-white py-16">
        <div className="max-w-2xl mx-auto px-5 relative z-10">
          <p className="uppercase tracking-widest text-teal-200 text-xs font-bold mb-3">Pickup · Wash · Deliver</p>
          <h1 className="text-4xl font-extrabold mb-4">Laundry day, off your to-do list.</h1>
          <p className="text-teal-50 mb-6">Book a pickup in a minute, track every wash live, and pay online — this demo is fully wired up, try it end to end.</p>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => setScreen(bookTarget)} className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-lg font-semibold">Book a pickup</button>
            <button onClick={() => setScreen("services")} className="border border-white/60 hover:bg-white/10 px-6 py-3 rounded-lg font-semibold">See pricing</button>
          </div>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-5 py-12">
        <h2 className="text-xl font-bold mb-4">How it works</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: Package, title: "Schedule a pickup", text: "Pick services, a slot, and your address." },
            { icon: ShirtIcon, title: "We wash, you relax", text: "Cleaned and quality-checked by a provider." },
            { icon: Truck, title: "Delivered to your door", text: "Track live and pay when it arrives." },
          ].map(({ icon: Icon, title, text }) => (
            <Card key={title}>
              <Icon className="text-teal-600 mb-2" size={22} />
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-sm text-slate-500 mb-0">{text}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ===================== Services ===================== */

function ServicesScreen({ services, setScreen, currentUser }) {
  const grouped = services.reduce((acc, s) => { (acc[s.category] ||= []).push(s); return acc; }, {});
  return (
    <div className="max-w-5xl mx-auto px-5 py-10">
      <h1 className="text-2xl font-bold mb-1">Services & pricing</h1>
      <p className="text-slate-500 mb-6">Live from the service catalog — admins can edit this and it updates instantly.</p>
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-teal-700 mb-2">{cat}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {items.map((s) => (
              <Card key={s.id}>
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold">{s.name}</h3>
                  <span className="font-bold text-orange-600 whitespace-nowrap">₹{s.price}<span className="text-slate-400 font-normal">/{s.unit}</span></span>
                </div>
                <p className="text-xs text-slate-400 mb-0 mt-1">Ready in ~{s.turnaround}h</p>
              </Card>
            ))}
          </div>
        </div>
      ))}
      <div className="text-center mt-6">
        <button onClick={() => setScreen(currentUser?.role === "customer" ? "book" : "register")} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold">Book a pickup</button>
      </div>
    </div>
  );
}

/* ===================== Auth forms ===================== */

function LoginForm({ onSubmit, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => { e.preventDefault(); setBusy(true); await onSubmit(email, password); setBusy(false); };
  return (
    <form onSubmit={submit}>
      {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}
      <Field label="Email address"><input type="email" required className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      <Field label="Password"><input type="password" required className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
      <button disabled={busy} className="w-full bg-teal-700 hover:bg-teal-800 text-white py-2.5 rounded-lg font-semibold">{busy ? "Logging in…" : "Log in"}</button>
    </form>
  );
}

function RegisterForm({ onSubmit, error }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", address: "", role: "customer" });
  const [busy, setBusy] = useState(false);
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = async (e) => { e.preventDefault(); setBusy(true); await onSubmit(form); setBusy(false); };
  return (
    <form onSubmit={submit}>
      {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}
      <Field label="Full name"><input name="name" required className={inputCls} value={form.name} onChange={change} /></Field>
      <Field label="Email address"><input name="email" type="email" required className={inputCls} value={form.email} onChange={change} /></Field>
      <Field label="Phone number"><input name="phone" required className={inputCls} value={form.phone} onChange={change} /></Field>
      <Field label="Password"><input name="password" type="password" minLength={6} required className={inputCls} value={form.password} onChange={change} /></Field>
      <Field label="Default address (optional)"><input name="address" className={inputCls} value={form.address} onChange={change} /></Field>
      <Field label="I am registering as">
        <select name="role" className={inputCls} value={form.role} onChange={change}>
          <option value="customer">Customer — I want laundry picked up</option>
          <option value="provider">Service provider — I fulfill orders</option>
        </select>
      </Field>
      <button disabled={busy} className="w-full bg-teal-700 hover:bg-teal-800 text-white py-2.5 rounded-lg font-semibold">{busy ? "Creating…" : "Create account"}</button>
    </form>
  );
}

/* ===================== Booking ===================== */

function BookScreen({ services, currentUser, onSubmit }) {
  const [qty, setQty] = useState({});
  const [pickupAddress, setPickupAddress] = useState(currentUser.address || "");
  const [deliveryAddress, setDeliveryAddress] = useState(currentUser.address || "");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupSlot, setPickupSlot] = useState("09:00 - 11:00");
  const [instructions, setInstructions] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const setQuantity = (id, val) => setQty((p) => ({ ...p, [id]: Math.max(0, Number(val) || 0) }));
  const selected = services.filter((s) => qty[s.id] > 0).map((s) => ({ serviceId: s.id, name: s.name, price: s.price, unit: s.unit, quantity: qty[s.id] }));
  const total = selected.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (selected.length === 0) return setError("Please select at least one service and quantity.");
    if (!pickupAddress || !deliveryAddress || !pickupDate) return setError("Please fill in address and pickup date.");
    setBusy(true);
    await onSubmit({ items: selected, pickupAddress, deliveryAddress, pickupDate, pickupSlot, instructions, paymentMethod });
    setBusy(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-5 py-10">
      <h1 className="text-2xl font-bold mb-1">Book a laundry pickup</h1>
      <p className="text-slate-500 mb-4">Choose your services and quantities, then set a pickup slot.</p>
      {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}
      <form onSubmit={submit} className="grid lg:grid-cols-[1fr_320px] gap-5 items-start">
        <Card>
          <h2 className="font-bold mb-3">1. Select services</h2>
          <div className="space-y-2">
            {services.map((s) => (
              <div key={s.id} className="flex justify-between items-center bg-teal-50 border border-teal-100 rounded-lg px-4 py-3">
                <div>
                  <div className="font-semibold text-sm">{s.name}</div>
                  <div className="text-xs text-slate-500">₹{s.price} / {s.unit}</div>
                </div>
                <input type="number" min="0" className="w-20 text-center border border-teal-200 rounded-lg py-1.5" value={qty[s.id] || ""} placeholder="0" onChange={(e) => setQuantity(s.id, e.target.value)} />
              </div>
            ))}
          </div>

          <h2 className="font-bold mt-6 mb-3">2. Pickup & delivery</h2>
          <Field label="Pickup address"><input required className={inputCls} value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} /></Field>
          <Field label="Delivery address"><input required className={inputCls} value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} /></Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Pickup date"><input type="date" required className={inputCls} value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} /></Field>
            <Field label="Pickup time slot">
              <select className={inputCls} value={pickupSlot} onChange={(e) => setPickupSlot(e.target.value)}>
                {["09:00 - 11:00", "11:00 - 13:00", "14:00 - 16:00", "16:00 - 18:00"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Special instructions (optional)"><textarea rows={2} className={inputCls} value={instructions} onChange={(e) => setInstructions(e.target.value)} /></Field>

          <h2 className="font-bold mt-6 mb-3">3. Payment method</h2>
          <select className={inputCls} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option>Cash on Delivery</option>
            <option>Card</option>
            <option>UPI</option>
          </select>
        </Card>

        <Card className="lg:sticky lg:top-24">
          <h2 className="font-bold mb-3">Order summary</h2>
          {selected.length === 0 && <p className="text-sm text-slate-400">No services selected yet.</p>}
          {selected.map((i) => (
            <div key={i.serviceId} className="flex justify-between text-sm py-1.5 border-b border-dashed border-teal-100">
              <span>{i.name} × {i.quantity}</span><span>₹{i.price * i.quantity}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold pt-3 mt-2 border-t-2 border-teal-100">
            <span>Total</span><span>₹{total}</span>
          </div>
          <button disabled={busy} className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg font-semibold">
            {busy ? "Placing booking…" : "Confirm booking"}
          </button>
        </Card>
      </form>
    </div>
  );
}

/* ===================== My orders / detail / pay ===================== */

function MyOrdersScreen({ orders, setScreen, setSelectedOrderId }) {
  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-2xl font-bold">My orders</h1>
        <button onClick={() => setScreen("book")} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">Book new pickup</button>
      </div>
      {orders.length === 0 && (
        <Card className="text-center text-slate-400 py-12">
          <div className="text-3xl mb-2">🧺</div>
          <p>You haven't booked a pickup yet.</p>
          <button onClick={() => setScreen("book")} className="bg-teal-700 hover:bg-teal-800 text-white px-5 py-2.5 rounded-lg font-semibold">Book your first pickup</button>
        </Card>
      )}
      <div className="space-y-3">
        {orders.map((o) => (
          <Card key={o.id} className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <h3 className="font-semibold">Order #{o.id.slice(-6).toUpperCase()}</h3>
              <div className="text-xs text-slate-500">{o.items.length} item(s) · ₹{o.total} · Pickup {o.pickupDate}</div>
            </div>
            <div className="flex items-center gap-2">
              <PayBadge status={o.paymentStatus} />
              <StatusBadge status={o.status} />
              <button onClick={() => { setSelectedOrderId(o.id); setScreen("orderdetail"); }} className="border border-teal-300 text-teal-700 px-3 py-1.5 rounded-lg text-xs font-semibold">View</button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function BubbleTrail({ status }) {
  if (status === "Cancelled") return <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 font-semibold text-sm">This booking was cancelled.</div>;
  const idx = STAGES.indexOf(status);
  return (
    <ol className="flex flex-wrap gap-y-4">
      {STAGES.map((stage, i) => (
        <li key={stage} className="flex-1 min-w-[90px] flex flex-col items-center text-center relative px-1">
          {i < STAGES.length - 1 && <span className={`absolute top-3 left-1/2 w-full h-0.5 ${i < idx ? "bg-teal-600" : "bg-teal-100"}`} />}
          <span className={`w-6 h-6 rounded-full border-4 z-10 ${i <= idx ? "bg-teal-600 border-teal-600" : "bg-white border-teal-100"}`} />
          <span className={`text-[10px] font-semibold mt-1.5 ${i <= idx ? "text-teal-800" : "text-slate-400"}`}>{stage}</span>
        </li>
      ))}
    </ol>
  );
}

function OrderDetailScreen({ order, currentUser, setScreen, onCancel, onGoPay }) {
  const canCancel = currentUser?.role === "customer" && ["Pending", "Confirmed"].includes(order.status);
  const canPay = currentUser?.role === "customer" && order.paymentStatus === "Unpaid" && order.status !== "Cancelled";
  return (
    <div className="max-w-4xl mx-auto px-5 py-10">
      <button onClick={() => setScreen("myorders")} className="flex items-center gap-1 text-teal-700 text-sm font-semibold mb-4"><ArrowLeft size={14} /> Back to my orders</button>
      <div className="flex justify-between items-center flex-wrap gap-2 mb-4">
        <h1 className="text-2xl font-bold">Order #{order.id.slice(-6).toUpperCase()}</h1>
        <div className="flex gap-2"><PayBadge status={order.paymentStatus} /><StatusBadge status={order.status} /></div>
      </div>
      <Card className="mb-5">
        <h2 className="font-bold mb-2">Progress</h2>
        <BubbleTrail status={order.status} />
      </Card>
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">
        <Card>
          <h2 className="font-bold mb-2">Items</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-400 text-xs"><th className="py-1">Service</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
            <tbody>{order.items.map((i) => (
              <tr key={i.serviceId} className="border-t border-teal-50"><td className="py-1.5">{i.name}</td><td>{i.quantity}</td><td>₹{i.price}</td><td>₹{i.subtotal}</td></tr>
            ))}</tbody>
          </table>
          <div className="flex justify-between font-bold mt-3 pt-3 border-t border-teal-100"><span>Total</span><span>₹{order.total}</span></div>

          <h2 className="font-bold mt-6 mb-2">History</h2>
          <ul className="space-y-2">
            {[...order.history].reverse().map((h, i) => (
              <li key={i} className="border-l-2 border-teal-200 pl-3 text-xs text-slate-500">
                <strong className="text-slate-700">{h.status}</strong> — {new Date(h.at).toLocaleString()}{h.note ? ` · ${h.note}` : ""}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-bold mb-2">Pickup & delivery</h2>
          <p className="text-sm"><strong>Pickup:</strong> {order.pickupAddress}</p>
          <p className="text-sm"><strong>Delivery:</strong> {order.deliveryAddress}</p>
          <p className="text-sm"><strong>Date & slot:</strong> {order.pickupDate} · {order.pickupSlot}</p>
          {order.instructions && <p className="text-sm"><strong>Notes:</strong> {order.instructions}</p>}
          <p className="text-sm mb-4"><strong>Payment method:</strong> {order.paymentMethod}</p>
          <div className="flex gap-2 flex-wrap">
            {canPay && <button onClick={onGoPay} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">Pay now</button>}
            {canCancel && <button onClick={() => onCancel(order)} className="border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm font-semibold">Cancel booking</button>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function PayScreen({ order, onPay, setScreen }) {
  const [method, setMethod] = useState("Card");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    await onPay(order, method);
    setDone(true);
    setBusy(false);
  };
  return (
    <AuthLayout title="Complete payment" subtitle={`Order #${order.id.slice(-6).toUpperCase()}`}>
      {done ? (
        <div className="bg-emerald-50 text-emerald-700 rounded-lg px-3 py-2 text-sm font-semibold flex items-center gap-2"><CheckCircle2 size={16} /> Payment successful!</div>
      ) : (
        <>
          <h2 className="text-3xl font-extrabold mb-4">₹{order.total}</h2>
          <form onSubmit={submit}>
            <Field label="Payment method">
              <select className={inputCls} value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="Card">Credit / Debit Card</option>
                <option value="UPI">UPI</option>
              </select>
            </Field>
            {method === "Card" ? (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Card number"><input required placeholder="4242 4242 4242 4242" className={inputCls} /></Field>
                <Field label="Expiry"><input required placeholder="MM/YY" className={inputCls} /></Field>
              </div>
            ) : (
              <Field label="UPI ID"><input required placeholder="yourname@upi" className={inputCls} /></Field>
            )}
            <p className="text-xs text-slate-400 mb-3">Simulated payment for demo purposes — no real transaction is made.</p>
            <button disabled={busy} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg font-semibold">{busy ? "Processing…" : `Pay ₹${order.total}`}</button>
          </form>
        </>
      )}
      <button onClick={() => setScreen("orderdetail")} className="text-teal-700 text-sm font-semibold mt-4">← Back to order</button>
    </AuthLayout>
  );
}

/* ===================== Provider ===================== */

function ProviderScreen({ orders, currentUser, onAdvance }) {
  const [filter, setFilter] = useState("active");
  const visible = orders.filter((o) => {
    if (filter === "active") return !["Delivered", "Cancelled"].includes(o.status);
    if (filter === "mine") return o.providerEmail === currentUser.email;
    return true;
  });
  return (
    <div className="max-w-4xl mx-auto px-5 py-10">
      <h1 className="text-2xl font-bold mb-1">Provider dashboard</h1>
      <p className="text-slate-500 mb-4">Pick up unassigned orders and move active jobs through each stage.</p>
      <div className="flex gap-2 mb-5">
        {[["active", "Active orders"], ["mine", "My assigned"], ["all", "All"]].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} className={`px-4 py-1.5 rounded-full text-sm font-semibold ${filter === key ? "bg-teal-700 text-white" : "border border-teal-300 text-teal-700"}`}>{label}</button>
        ))}
      </div>
      {visible.length === 0 && <Card className="text-center text-slate-400 py-10">No orders in this view right now.</Card>}
      <div className="space-y-3">
        {visible.map((o) => (
          <Card key={o.id}>
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="font-semibold">Order #{o.id.slice(-6).toUpperCase()}</h3>
              <StatusBadge status={o.status} />
            </div>
            <p className="text-xs text-slate-500 mt-1">Customer: {o.customerName} ({o.customerPhone}) · Pickup {o.pickupDate} · {o.pickupSlot}</p>
            <p className="text-xs text-slate-500">Pickup at: {o.pickupAddress}</p>
            <p className="text-xs text-slate-500">{o.items.length} item(s) · ₹{o.total} · {o.paymentStatus} · {o.providerEmail ? (o.providerEmail === currentUser.email ? "Assigned to you" : `Assigned to ${o.providerEmail}`) : "Unassigned"}</p>
            {NEXT_STATUS[o.status] && (
              <button onClick={() => onAdvance(o)} className="mt-3 bg-teal-700 hover:bg-teal-800 text-white px-4 py-1.5 rounded-lg text-xs font-semibold">Mark as "{NEXT_STATUS[o.status]}"</button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ===================== Admin ===================== */

function AdminScreen({ orders, setScreen }) {
  const stats = {
    total: orders.length,
    active: orders.filter((o) => !["Delivered", "Cancelled"].includes(o.status)).length,
    delivered: orders.filter((o) => o.status === "Delivered").length,
    revenue: orders.filter((o) => o.paymentStatus === "Paid").reduce((sum, o) => sum + o.total, 0),
  };
  return (
    <div className="max-w-5xl mx-auto px-5 py-10">
      <div className="flex justify-between items-center mb-5 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Admin dashboard</h1>
        <button onClick={() => setScreen("adminservices")} className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-lg text-sm font-semibold">Manage services</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[["Total orders", stats.total], ["Active orders", stats.active], ["Delivered", stats.delivered], ["Revenue collected", `₹${stats.revenue}`]].map(([label, value]) => (
          <Card key={label} className="text-center">
            <div className="text-2xl font-extrabold text-teal-800">{value}</div>
            <div className="text-xs text-slate-500">{label}</div>
          </Card>
        ))}
      </div>
      <h2 className="font-bold mb-3">All orders</h2>
      <div className="overflow-x-auto rounded-2xl border border-teal-100">
        <table className="w-full text-sm bg-white">
          <thead className="bg-teal-50 text-xs uppercase text-slate-500"><tr><th className="text-left px-4 py-2">Order</th><th className="text-left px-4 py-2">Customer</th><th className="text-left px-4 py-2">Amount</th><th className="text-left px-4 py-2">Payment</th><th className="text-left px-4 py-2">Status</th><th className="text-left px-4 py-2">Provider</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-teal-50">
                <td className="px-4 py-2">#{o.id.slice(-6).toUpperCase()}</td>
                <td className="px-4 py-2">{o.customerName}</td>
                <td className="px-4 py-2">₹{o.total}</td>
                <td className="px-4 py-2"><PayBadge status={o.paymentStatus} /></td>
                <td className="px-4 py-2"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-2">{o.providerEmail || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminServicesScreen({ services, onSave, onDelete, onToggle, setScreen }) {
  const empty = { id: null, name: "", category: "Wash & Fold", unit: "kg", price: "", turnaround: 24 };
  const [form, setForm] = useState(empty);
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    onSave({ ...form, price: Number(form.price), turnaround: Number(form.turnaround), active: form.active ?? true });
    setForm(empty);
  };
  return (
    <div className="max-w-5xl mx-auto px-5 py-10">
      <button onClick={() => setScreen("admin")} className="flex items-center gap-1 text-teal-700 text-sm font-semibold mb-4"><ArrowLeft size={14} /> Back to dashboard</button>
      <h1 className="text-2xl font-bold mb-4">Manage services</h1>
      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-5">
        <Card>
          <h2 className="font-bold mb-3">All services</h2>
          <div className="space-y-2">
            {services.map((s) => (
              <div key={s.id} className="flex justify-between items-center flex-wrap gap-2 border border-teal-100 rounded-lg px-3 py-2.5">
                <div>
                  <strong className="text-sm">{s.name}</strong>{!s.active && <span className="ml-2 bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-semibold">Inactive</span>}
                  <div className="text-xs text-slate-500">{s.category} · ₹{s.price} / {s.unit}</div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => onToggle(s.id)} className="border border-teal-300 text-teal-700 px-2.5 py-1 rounded-lg text-xs font-semibold">{s.active ? "Deactivate" : "Activate"}</button>
                  <button onClick={() => setForm(s)} className="border border-teal-300 text-teal-700 px-2.5 py-1 rounded-lg text-xs font-semibold"><Pencil size={12} /></button>
                  <button onClick={() => onDelete(s.id)} className="border border-red-300 text-red-600 px-2.5 py-1 rounded-lg text-xs font-semibold"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-bold mb-3">{form.id ? "Edit service" : "Add new service"}</h2>
          <form onSubmit={submit}>
            <Field label="Service name"><input name="name" required className={inputCls} value={form.name} onChange={change} /></Field>
            <Field label="Category">
              <select name="category" className={inputCls} value={form.category} onChange={change}>
                {["Wash & Fold", "Dry Cleaning", "Ironing", "Shoe Cleaning", "Bedding & Linen"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Unit">
                <select name="unit" className={inputCls} value={form.unit} onChange={change}><option value="kg">Per kg</option><option value="item">Per item</option></select>
              </Field>
              <Field label="Price (₹)"><input name="price" type="number" min="0" required className={inputCls} value={form.price} onChange={change} /></Field>
            </div>
            <Field label="Turnaround (hours)"><input name="turnaround" type="number" min="1" className={inputCls} value={form.turnaround} onChange={change} /></Field>
            <div className="flex gap-2">
              <button type="submit" className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1"><Plus size={14} />{form.id ? "Save changes" : "Add service"}</button>
              {form.id && <button type="button" onClick={() => setForm(empty)} className="text-slate-500 text-sm">Cancel</button>}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
