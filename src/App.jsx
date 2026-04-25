import { useState, useEffect, useMemo } from "react";
import { 
  Car, 
  Search, 
  Plus, 
  Trash2, 
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
  Download,
  Share2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import confetti from "canvas-confetti";
import "./App.css";

const TICKET_TYPES = [
  { id: "4h", label: "4 Hours", duration: 4, price: 150 },
  { id: "6h", label: "6 Hours", duration: 6, price: 200 },
  { id: "12h", label: "12 Hours", duration: 12, price: 350 },
];

export default function App() {
  // 1. Initial State
  const [slots, setSlots] = useState(() => {
    const saved = localStorage.getItem("abps_slots");
    if (saved) return JSON.parse(saved);
    return Array.from({ length: 60 }, (_, i) => ({
      slotNo: i + 1,
      occupied: false,
      vehicle: null,
      entryTime: null,
      expiryTime: null,
      ticketType: null
    }));
  });

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("abps_history");
    return saved ? JSON.parse(saved) : [];
  });

  const [showModal, setShowModal] = useState(false);
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

  // 2. Persistence
  useEffect(() => {
    localStorage.setItem("abps_slots", JSON.stringify(slots));
  }, [slots]);

  useEffect(() => {
    localStorage.setItem("abps_history", JSON.stringify(history));
  }, [history]);

  // 3. Stats & Filters
  const stats = useMemo(() => {
    const occupied = slots.filter(s => s.occupied).length;
    const revenue = history.reduce((acc, curr) => acc + (curr.cost || 0), 0);
    return { total: slots.length, occupied, available: slots.length - occupied, revenue };
  }, [slots, history]);

  const filteredSlots = useMemo(() => {
    if (!searchQuery) return slots;
    return slots.filter(s => 
      s.vehicle?.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.vehicle?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.slotNo.toString() === searchQuery
    );
  }, [slots, searchQuery]);

  // 4. Handlers
  const handlePayment = async () => {
    if (!form.name || !form.vehicle || !form.email || !form.whatsapp) {
      alert("Please fill all contact details");
      return;
    }

    setIsProcessing(true);
    // Simulate Payment Gateway Delay
    await new Promise(r => setTimeout(r, 2000));
    setIsProcessing(false);
    setPaymentSuccess(true);
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

    // Allocate Slot
    const emptySlot = slots.find(s => !s.occupied);
    const ticketInfo = TICKET_TYPES.find(t => t.id === form.duration);
    const entry = new Date();
    const expiry = new Date(entry.getTime() + ticketInfo.duration * 60 * 60 * 1000);

    const ticketData = {
      ...form,
      price: ticketInfo.price,
      duration: ticketInfo.label,
      ticketId: `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      entryTime: entry.toISOString(),
      expiryTime: expiry.toISOString(),
      slotNo: emptySlot.slotNo
    };

    const newSlots = slots.map(s => 
      s.slotNo === emptySlot.slotNo 
        ? { ...s, occupied: true, vehicle: { ...form }, entryTime: entry.toISOString(), expiryTime: expiry.toISOString(), ticketType: form.duration }
        : s
    );

    setSlots(newSlots);
    setActiveTicket(ticketData);
    
    // Simulate Notifications
    console.log(`Email sent to ${form.email}`);
    console.log(`WhatsApp sent to ${form.whatsapp}`);
  };

  const handleExit = (slotNo) => {
    const slot = slots.find(s => s.slotNo === slotNo);
    const ticketInfo = TICKET_TYPES.find(t => t.id === slot.ticketType);
    
    const transaction = {
      ...slot.vehicle,
      slotNo,
      entryTime: slot.entryTime,
      exitTime: new Date().toISOString(),
      cost: ticketInfo.price
    };

    setHistory([transaction, ...history].slice(0, 50));
    setSlots(slots.map(s => 
      s.slotNo === slotNo 
        ? { ...s, occupied: false, vehicle: null, entryTime: null, expiryTime: null, ticketType: null }
        : s
    ));
    setSelectedSlot(null);
  };

  const sendWhatsApp = (ticket) => {
    const msg = `Hello ${ticket.name}, your parking ticket for ${ticket.vehicle} is confirmed! Slot: #${ticket.slotNo}, Expiry: ${new Date(ticket.expiryTime).toLocaleTimeString()}. Transaction ID: ${ticket.ticketId}`;
    window.open(`https://wa.me/${ticket.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 800 }}>ABPS Pro</h1>
          <p style={{ color: 'var(--text-dim)' }}>Smart Multi-Block Parking System</p>
        </div>
        
        <div className="search-bar">
          <Search size={18} />
          <input 
            placeholder="Search slot, vehicle or owner..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button className="btn-primary" onClick={() => { setPaymentSuccess(false); setActiveTicket(null); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={20} /> Book Slot
        </button>
      </header>

      {/* Stats */}
      <section className="stats-grid">
        <StatCard icon={<Car color="#3b82f6" />} label="Total Slots" value={stats.total} color="blue" />
        <StatCard icon={<Activity color="#ef4444" />} label="Occupied" value={stats.occupied} color="red" />
        <StatCard icon={<CheckCircle2 color="#10b981" />} label="Available" value={stats.available} color="green" />
        <StatCard icon={<CircleDollarSign color="#f59e0b" />} label="Revenue" value={`₹${stats.revenue}`} color="orange" />
      </section>

      {/* Grid */}
      <main className="parking-grid">
        <AnimatePresence>
          {filteredSlots.map(slot => (
            <SlotCard key={slot.slotNo} slot={slot} onClick={() => slot.occupied && setSelectedSlot(slot)} />
          ))}
        </AnimatePresence>
      </main>

      {/* History */}
      <section className="glass" style={{ marginTop: '2rem', padding: '1.5rem' }}>
        <div className="flex-between" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.2rem' }}>Recent Activity</h2>
          </div>
        </div>
        <div className="history-list">
          {history.length === 0 ? <p className="empty-text">No recent transactions</p> : 
            history.map((tx, i) => <HistoryItem key={i} tx={tx} />)}
        </div>
      </section>

      {/* Booking Modal & Payment Flow */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="modal-content glass">
              
              {!paymentSuccess ? (
                <>
                  <div className="header">
                    <h2>Smart Reservation</h2>
                    <button onClick={() => setShowModal(false)}><X size={20} /></button>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Owner Name</label>
                      <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Full Name" />
                    </div>
                    <div className="form-group">
                      <label>Vehicle Number</label>
                      <input value={form.vehicle} onChange={e => setForm({...form, vehicle: e.target.value})} placeholder="KA 01 AB 1234" />
                    </div>
                    <div className="form-group">
                      <label><Mail size={14} style={{ marginRight: 4 }} /> Email Address</label>
                      <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@example.com" />
                    </div>
                    <div className="form-group">
                      <label><MessageCircle size={14} style={{ marginRight: 4 }} /> WhatsApp Number</label>
                      <input value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} placeholder="91XXXXXXXXXX" />
                    </div>
                  </div>

                  <div className="duration-selector">
                    <label>Select Duration</label>
                    <div className="ticket-options">
                      {TICKET_TYPES.map(type => (
                        <div 
                          key={type.id} 
                          className={`ticket-option glass ${form.duration === type.id ? 'active' : ''}`}
                          onClick={() => setForm({...form, duration: type.id})}
                        >
                          <span>{type.label}</span>
                          <strong>₹{type.price}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button className="btn-primary" disabled={isProcessing} onClick={handlePayment} style={{ height: 50 }}>
                    {isProcessing ? <div className="loader"></div> : <><CreditCard size={18} style={{ marginRight: 8 }} /> Pay & Reserve Now</>}
                  </button>
                </>
              ) : (
                <TicketView ticket={activeTicket} onClose={() => setShowModal(false)} onWhatsApp={() => sendWhatsApp(activeTicket)} />
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Slot Details Modal */}
      <AnimatePresence>
        {selectedSlot && (
          <div className="modal-overlay" onClick={() => setSelectedSlot(null)}>
            <motion.div onClick={e => e.stopPropagation()} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="modal-content glass details-modal">
              <div className="header">
                <h2>Slot #{selectedSlot.slotNo} Details</h2>
                <button onClick={() => setSelectedSlot(null)}><X size={20} /></button>
              </div>

              <div className="details-grid">
                <DetailItem label="Owner" value={selectedSlot.vehicle.name} />
                <DetailItem label="Vehicle" value={selectedSlot.vehicle.vehicle} />
                <DetailItem label="Check-in" value={new Date(selectedSlot.entryTime).toLocaleTimeString()} />
                <DetailItem label="Expires In" value={<Countdown time={selectedSlot.expiryTime} />} />
              </div>

              <div className="ticket-badge glass">
                <QrCode size={40} />
                <div>
                  <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Ticket ID</p>
                  <p style={{ fontWeight: 700 }}>#{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
                </div>
              </div>

              <button className="btn-exit" onClick={() => handleExit(selectedSlot.slotNo)}>
                <LogOut size={18} /> Checkout & Exit
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper Components
function SlotCard({ slot, onClick }) {
  return (
    <motion.div
      layout
      whileHover={{ y: -5 }}
      className={`slot glass ${slot.occupied ? 'occupied' : 'empty'}`}
      onClick={onClick}
    >
      <span className="slot-number">#{slot.slotNo}</span>
      <div className="slot-icon">
        {slot.occupied ? <Car size={24} color="var(--danger)" /> : <div className="slot-dot" />}
      </div>
      {slot.occupied && (
        <div className="slot-mini-info">
          <span>{slot.vehicle.vehicle}</span>
          <Countdown time={slot.expiryTime} mini />
        </div>
      )}
    </motion.div>
  );
}

function TicketView({ ticket, onClose, onWhatsApp }) {
  return (
    <div className="ticket-view">
      <div className="success-header">
        <CheckCircle2 size={48} color="var(--success)" />
        <h2>Payment Successful!</h2>
        <p>Slot #{ticket.slotNo} Reserved Successfully</p>
      </div>

      <div className="ticket-card glass glow-blue">
        <div className="ticket-top">
          <div>
            <h3>{ticket.name}</h3>
            <p>{ticket.vehicle}</p>
          </div>
          <div className="qr-container">
            <QRCodeSVG value={ticket.ticketId} size={80} bgColor="transparent" fgColor="white" />
          </div>
        </div>
        <div className="ticket-divider"></div>
        <div className="ticket-bottom">
          <div className="info">
            <span>Duration</span>
            <p>{ticket.duration}</p>
          </div>
          <div className="info">
            <span>Expiry</span>
            <p>{new Date(ticket.expiryTime).toLocaleTimeString()}</p>
          </div>
          <div className="info">
            <span>Price</span>
            <p>₹{ticket.price}</p>
          </div>
        </div>
      </div>

      <div className="notification-status">
        <p><Mail size={12} /> Confirmation sent to {ticket.email}</p>
      </div>

      <div className="ticket-actions">
        <button className="btn-whatsapp" onClick={onWhatsApp}><MessageCircle size={18} /> Send on WhatsApp</button>
        <button className="btn-secondary" onClick={onClose}><X size={18} /> Close</button>
      </div>
    </div>
  );
}

function Countdown({ time, mini }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const end = new Date(time);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
        clearInterval(timer);
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${h}h ${m}m ${mini ? '' : s + 's'}`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [time, mini]);

  return <span style={{ color: timeLeft === "Expired" ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>{timeLeft}</span>;
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className={`stat-card glass glow-${color}`}>
      <div className="stat-icon" style={{ background: `var(--${color}-glow)` }}>{icon}</div>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );
}

function HistoryItem({ tx }) {
  return (
    <div className="history-item glass">
      <div className="history-left">
        <div className="history-icon"><Car size={18} color="var(--primary)" /></div>
        <div>
          <p className="history-vehicle">{tx.vehicle}</p>
          <p className="history-details">Slot #{tx.slotNo} • {tx.name}</p>
        </div>
      </div>
      <div className="history-right">
        <p className="history-cost">+ ₹{tx.cost}</p>
        <p className="history-time">{new Date(tx.exitTime).toLocaleTimeString()}</p>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="detail-item">
      <p className="detail-label">{label}</p>
      <p className="detail-value">{value}</p>
    </div>
  );
}
