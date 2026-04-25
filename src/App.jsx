import { useState, useEffect, useMemo } from "react";
import { 
  Car, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  CircleDollarSign, 
  Activity,
  LogOut,
  X,
  Mail,
  MessageCircle,
  CreditCard,
  QrCode,
  ShieldCheck,
  Smartphone,
  Maximize,
  User,
  Settings,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import confetti from "canvas-confetti";
import QRScanner from "./components/QRScanner";
import "./App.css";

const TICKET_TYPES = [
  { id: "4h", label: "4 Hours", duration: 4, price: 150 },
  { id: "6h", label: "6 Hours", duration: 6, price: 200 },
  { id: "12h", label: "12 Hours", duration: 12, price: 350 },
];

export default function App() {
  // 1. Core State
  const [slots, setSlots] = useState(() => {
    const saved = localStorage.getItem("abps_slots");
    if (saved) return JSON.parse(saved);
    return Array.from({ length: 60 }, (_, i) => ({
      slotNo: i + 1,
      occupied: false,
      vehicle: null,
      entryTime: null,
      expiryTime: null,
      ticketType: null,
      ticketId: null
    }));
  });

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("abps_history");
    return saved ? JSON.parse(saved) : [];
  });

  // UI State
  const [isAttendantMode, setIsAttendantMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    whatsapp: "",
    vehicle: "",
    duration: "4h"
  });

  // Persistence
  useEffect(() => {
    localStorage.setItem("abps_slots", JSON.stringify(slots));
    localStorage.setItem("abps_history", JSON.stringify(history));
  }, [slots, history]);

  // Stats
  const stats = useMemo(() => {
    const occupied = slots.filter(s => s.occupied).length;
    const revenue = history.reduce((acc, curr) => acc + (curr.cost || 0), 0);
    return { total: slots.length, occupied, available: slots.length - occupied, revenue };
  }, [slots, history]);

  const filteredSlots = useMemo(() => {
    if (!searchQuery) return slots;
    const query = searchQuery.toLowerCase();
    return slots.filter(s => 
      s.vehicle?.vehicle.toLowerCase().includes(query) ||
      s.vehicle?.name.toLowerCase().includes(query) ||
      s.vehicle?.phone.includes(query) ||
      s.ticketId?.toLowerCase().includes(query) ||
      s.slotNo.toString() === query
    );
  }, [slots, searchQuery]);

  // Handlers
  const handlePayment = async () => {
    if (!form.name || !form.vehicle || !form.phone) {
      alert("Please fill required details");
      return;
    }

    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsProcessing(false);
    setPaymentSuccess(true);
    confetti({ particleCount: 100, spread: 50 });

    const emptySlot = slots.find(s => !s.occupied);
    const ticketInfo = TICKET_TYPES.find(t => t.id === form.duration);
    const entry = new Date();
    const expiry = new Date(entry.getTime() + ticketInfo.duration * 60 * 60 * 1000);
    const ticketId = `ABPS-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const ticketData = {
      ...form,
      price: ticketInfo.price,
      duration: ticketInfo.label,
      ticketId,
      entryTime: entry.toISOString(),
      expiryTime: expiry.toISOString(),
      slotNo: emptySlot.slotNo
    };

    setSlots(slots.map(s => 
      s.slotNo === emptySlot.slotNo 
        ? { ...s, occupied: true, vehicle: { ...form }, entryTime: entry.toISOString(), expiryTime: expiry.toISOString(), ticketType: form.duration, ticketId }
        : s
    ));
    setActiveTicket(ticketData);
  };

  const verifyTicket = (idOrPhone) => {
    const query = idOrPhone.toLowerCase();
    const slot = slots.find(s => 
      s.ticketId?.toLowerCase() === query || 
      s.vehicle?.phone === query ||
      s.vehicle?.whatsapp === query
    );

    if (slot) {
      const now = new Date();
      const expiry = new Date(slot.expiryTime);
      const isValid = now < expiry;
      setVerificationResult({ ...slot, isValid });
    } else {
      setVerificationResult({ error: "Ticket Not Found" });
    }
    setShowScanner(false);
  };

  const handleExit = (slotNo) => {
    const slot = slots.find(s => s.slotNo === slotNo);
    const ticketInfo = TICKET_TYPES.find(t => t.id === slot.ticketType);
    
    setHistory([{
      ...slot.vehicle,
      slotNo,
      entryTime: slot.entryTime,
      exitTime: new Date().toISOString(),
      cost: ticketInfo.price
    }, ...history].slice(0, 50));

    setSlots(slots.map(s => 
      s.slotNo === slotNo 
        ? { ...s, occupied: false, vehicle: null, entryTime: null, expiryTime: null, ticketType: null, ticketId: null }
        : s
    ));
    setSelectedSlot(null);
    setVerificationResult(null);
  };

  return (
    <div className={`app-container ${isAttendantMode ? 'attendant-theme' : ''}`}>
      {/* Mode Switcher */}
      <div className="mode-toggle glass">
        <button className={!isAttendantMode ? 'active' : ''} onClick={() => setIsAttendantMode(false)}>
          <User size={16} /> User Portal
        </button>
        <button className={isAttendantMode ? 'active' : ''} onClick={() => setIsAttendantMode(true)}>
          <ShieldCheck size={16} /> Attendant Portal
        </button>
      </div>

      {/* Header */}
      <header className="header">
        <div>
          <h1 className="gradient-text">{isAttendantMode ? 'ABPS Admin' : 'ABPS Pro'}</h1>
          <p style={{ color: 'var(--text-dim)' }}>{isAttendantMode ? 'Verify & Manage Parking' : 'Smart Digital Parking'}</p>
        </div>
        
        <div className="search-bar">
          <Search size={18} />
          <input 
            placeholder={isAttendantMode ? "Verify by Phone or Ticket ID..." : "Search slot or vehicle..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {isAttendantMode ? (
          <button className="btn-primary" onClick={() => setShowScanner(true)}>
            <QrCode size={20} /> Scan Ticket
          </button>
        ) : (
          <button className="btn-primary" onClick={() => { setPaymentSuccess(false); setActiveTicket(null); setShowModal(true); }}>
            <Plus size={20} /> Book Now
          </button>
        )}
      </header>

      {/* Stats Dashboard */}
      <section className="stats-grid">
        <StatCard icon={<Car color="#3b82f6" />} label="Total" value={stats.total} color="blue" />
        <StatCard icon={<Activity color="#ef4444" />} label="Occupied" value={stats.occupied} color="red" />
        <StatCard icon={<CheckCircle2 color="#10b981" />} label="Available" value={stats.available} color="green" />
        <StatCard icon={<CircleDollarSign color="#f59e0b" />} label="Revenue" value={`₹${stats.revenue}`} color="orange" />
      </section>

      {/* Verification Tool (Attendant Mode) */}
      {isAttendantMode && searchQuery.length > 5 && (
        <div className="verification-quick-check glass animate-fade-in">
          <h3>Verification Results</h3>
          {filteredSlots.filter(s => s.occupied).map(slot => (
            <div key={slot.slotNo} className="verify-card" onClick={() => setVerificationResult({...slot, isValid: new Date() < new Date(slot.expiryTime)})}>
              <div className="flex-between">
                <span>{slot.vehicle.name} ({slot.vehicle.phone})</span>
                <Badge isValid={new Date() < new Date(slot.expiryTime)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Grid */}
      <main className="parking-grid">
        <AnimatePresence>
          {filteredSlots.map(slot => (
            <SlotCard 
              key={slot.slotNo} 
              slot={slot} 
              isAttendant={isAttendantMode}
              onClick={() => slot.occupied && (isAttendantMode ? setVerificationResult({...slot, isValid: new Date() < new Date(slot.expiryTime)}) : setSelectedSlot(slot))} 
            />
          ))}
        </AnimatePresence>
      </main>

      {/* History */}
      <section className="glass history-section">
        <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
          <div className="flex-center" style={{ gap: '0.75rem' }}>
            <Activity size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.2rem' }}>{isAttendantMode ? 'Recent Logs' : 'My Activity'}</h2>
          </div>
        </div>
        <div className="history-list">
          {history.length === 0 ? <p className="empty-text">No records found</p> : 
            history.map((tx, i) => <HistoryItem key={i} tx={tx} />)}
        </div>
      </section>

      {/* Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <div className="modal-overlay">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="modal-content glass">
              <div className="header">
                <h2>Scan Ticket QR</h2>
                <button onClick={() => setShowScanner(false)}><X size={20} /></button>
              </div>
              <QRScanner onScanSuccess={(id) => verifyTicket(id)} onScanError={(err) => console.log(err)} />
              <p style={{ textAlign: 'center', color: 'var(--text-dim)', marginTop: '1rem' }}>Position the QR code within the frame</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Verification Result Modal */}
      <AnimatePresence>
        {verificationResult && (
          <div className="modal-overlay" onClick={() => setVerificationResult(null)}>
            <motion.div onClick={e => e.stopPropagation()} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="modal-content glass verification-modal">
              {verificationResult.error ? (
                <div className="error-view">
                  <AlertTriangle size={64} color="var(--danger)" />
                  <h2>Invalid Ticket</h2>
                  <p>{verificationResult.error}</p>
                  <button className="btn-secondary" onClick={() => setVerificationResult(null)}>Close</button>
                </div>
              ) : (
                <div className="proof-view">
                  <div className={`status-banner ${verificationResult.isValid ? 'valid' : 'expired'}`}>
                    {verificationResult.isValid ? <ShieldCheck size={32} /> : <AlertTriangle size={32} />}
                    <span>{verificationResult.isValid ? 'VALID TICKET' : 'EXPIRED'}</span>
                  </div>

                  <div className="proof-details">
                    <DetailItem label="Owner" value={verificationResult.vehicle.name} />
                    <DetailItem label="Phone" value={verificationResult.vehicle.phone} />
                    <DetailItem label="Vehicle" value={verificationResult.vehicle.vehicle} />
                    <DetailItem label="Ticket ID" value={verificationResult.ticketId} />
                    <DetailItem label="Slot" value={`#${verificationResult.slotNo}`} />
                    <DetailItem label="Expires At" value={new Date(verificationResult.expiryTime).toLocaleTimeString()} />
                  </div>

                  <div className="timer-section">
                    <p>Time Remaining</p>
                    <Countdown time={verificationResult.expiryTime} />
                  </div>

                  <div className="action-row">
                    <button className="btn-exit" onClick={() => handleExit(verificationResult.slotNo)}>
                      <LogOut size={18} /> Release Slot
                    </button>
                    <button className="btn-secondary" onClick={() => setVerificationResult(null)}>Cancel</button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Booking Modal (User View) */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay">
            <motion.div className="modal-content glass">
              {!paymentSuccess ? (
                <BookingForm isProcessing={isProcessing} form={form} setForm={setForm} onPay={handlePayment} onClose={() => setShowModal(false)} />
              ) : (
                <TicketView ticket={activeTicket} onClose={() => setShowModal(false)} />
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-components
function SlotCard({ slot, isAttendant, onClick }) {
  const isValid = new Date() < new Date(slot.expiryTime);
  return (
    <motion.div layout whileHover={{ scale: 1.05 }} className={`slot glass ${slot.occupied ? (isValid ? 'occupied' : 'expired') : 'empty'}`} onClick={onClick}>
      <span className="slot-number">#{slot.slotNo}</span>
      <div className="slot-icon">
        {slot.occupied ? <Car size={24} color={isValid ? "var(--danger)" : "var(--warning)"} /> : <div className="slot-dot" />}
      </div>
      {slot.occupied && (
        <div className="slot-mini-info">
          <span style={{ fontSize: '0.7rem' }}>{slot.vehicle.vehicle}</span>
          <Countdown time={slot.expiryTime} mini />
        </div>
      )}
    </motion.div>
  );
}

function Badge({ isValid }) {
  return (
    <span className={`badge ${isValid ? 'valid' : 'expired'}`}>
      {isValid ? 'VALID' : 'EXPIRED'}
    </span>
  );
}

function BookingForm({ isProcessing, form, setForm, onPay, onClose }) {
  return (
    <>
      <div className="header">
        <h2>Reserve Parking</h2>
        <button onClick={onClose}><X size={20} /></button>
      </div>
      <div className="form-grid">
        <FormInput label="Name" value={form.name} onChange={v => setForm({...form, name: v})} placeholder="Full Name" />
        <FormInput label="Phone" value={form.phone} onChange={v => setForm({...form, phone: v})} placeholder="91XXXXXXXX" />
        <FormInput label="Vehicle" value={form.vehicle} onChange={v => setForm({...form, vehicle: v})} placeholder="KA 01 AB 1234" />
        <div className="form-group">
          <label>Plan</label>
          <select className="glass-select" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})}>
            {TICKET_TYPES.map(t => <option key={t.id} value={t.id}>{t.label} - ₹{t.price}</option>)}
          </select>
        </div>
      </div>
      <button className="btn-primary" disabled={isProcessing} onClick={onPay}>
        {isProcessing ? <div className="loader"></div> : <><CreditCard size={18} /> Pay & Park</>}
      </button>
    </>
  );
}

function FormInput({ label, value, onChange, placeholder }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function TicketView({ ticket, onClose }) {
  return (
    <div className="ticket-view">
      <CheckCircle2 size={48} color="var(--success)" />
      <h2>Confirmed! Slot #{ticket.slotNo}</h2>
      <div className="ticket-card glass glow-blue">
        <div className="flex-between">
          <div><p className="t-label">Vehicle</p><p className="t-value">{ticket.vehicle}</p></div>
          <QRCodeSVG value={ticket.ticketId} size={60} bgColor="transparent" fgColor="white" />
        </div>
        <div className="t-divider"></div>
        <div className="grid-3">
          <div><p className="t-label">Plan</p><p>{ticket.duration}</p></div>
          <div><p className="t-label">Expires</p><p>{new Date(ticket.expiryTime).toLocaleTimeString()}</p></div>
          <div><p className="t-label">ID</p><p>{ticket.ticketId}</p></div>
        </div>
      </div>
      <button className="btn-primary" onClick={onClose}>Finish</button>
    </div>
  );
}

function Countdown({ time, mini }) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const timer = setInterval(() => {
      const diff = new Date(time) - new Date();
      if (diff <= 0) { setTimeLeft("Expired"); clearInterval(timer); }
      else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${h}h ${m}m ${mini ? '' : s + 's'}`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [time, mini]);
  return <span className={`countdown ${timeLeft === "Expired" ? 'red' : 'green'}`}>{timeLeft}</span>;
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className={`stat-card glass glow-${color}`}>
      <div className="stat-icon" style={{ background: `var(--${color}-glow)` }}>{icon}</div>
      <div><p className="stat-label">{label}</p><p className="stat-value">{value}</p></div>
    </div>
  );
}

function HistoryItem({ tx }) {
  return (
    <div className="history-item glass">
      <div className="flex-center" style={{ gap: '1rem' }}>
        <div className="h-icon"><Car size={18} /></div>
        <div><p className="h-title">{tx.vehicle}</p><p className="h-sub">Slot #{tx.slotNo} • {tx.name}</p></div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p className="h-cost">₹{tx.cost}</p>
        <p className="h-time">{new Date(tx.exitTime).toLocaleTimeString()}</p>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="detail-item">
      <p className="d-label">{label}</p>
      <p className="d-value">{value}</p>
    </div>
  );
}
