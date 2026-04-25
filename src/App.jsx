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
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";

const HOURLY_RATE = 50;

export default function App() {
  // 1. Initial State with Persistence
  const [slots, setSlots] = useState(() => {
    const saved = localStorage.getItem("abps_slots");
    if (saved) return JSON.parse(saved);
    return Array.from({ length: 60 }, (_, i) => ({
      slotNo: i + 1,
      occupied: false,
      vehicle: null,
      entryTime: null
    }));
  });

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("abps_history");
    return saved ? JSON.parse(saved) : [];
  });

  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  const [form, setForm] = useState({
    name: "",
    phone: "",
    vehicle: "",
    paid: false
  });

  // 2. Persistence Side Effects
  useEffect(() => {
    localStorage.setItem("abps_slots", JSON.stringify(slots));
  }, [slots]);

  useEffect(() => {
    localStorage.setItem("abps_history", JSON.stringify(history));
  }, [history]);

  // 3. Computed Stats
  const stats = useMemo(() => {
    const occupied = slots.filter(s => s.occupied).length;
    const revenue = history.reduce((acc, curr) => acc + (curr.cost || 0), 0);
    return {
      total: slots.length,
      occupied,
      available: slots.length - occupied,
      revenue
    };
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
  const handlePark = () => {
    const emptySlot = slots.find(s => !s.occupied);
    if (!emptySlot) {
      alert("Parking Full!");
      return;
    }
    if (!form.name || !form.vehicle) {
      alert("Please fill required fields");
      return;
    }

    const newSlots = slots.map(s => 
      s.slotNo === emptySlot.slotNo 
        ? { ...s, occupied: true, vehicle: { ...form }, entryTime: new Date().toISOString() }
        : s
    );

    setSlots(newSlots);
    setForm({ name: "", phone: "", vehicle: "", paid: false });
    setShowModal(false);
  };

  const handleExit = (slotNo) => {
    const slot = slots.find(s => s.slotNo === slotNo);
    if (!slot) return;

    const entry = new Date(slot.entryTime);
    const exit = new Date();
    const hours = Math.max(1, Math.ceil((exit - entry) / (1000 * 60 * 60)));
    const cost = hours * HOURLY_RATE;

    const transaction = {
      ...slot.vehicle,
      slotNo,
      entryTime: slot.entryTime,
      exitTime: exit.toISOString(),
      cost: slot.vehicle.paid ? 0 : cost
    };

    setHistory([transaction, ...history].slice(0, 50));
    setSlots(slots.map(s => 
      s.slotNo === slotNo 
        ? { ...s, occupied: false, vehicle: null, entryTime: null }
        : s
    ));
    setSelectedSlot(null);
  };

  return (
    <div className="app-container">
      {/* Header Area */}
      <header className="header">
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, background: 'linear-gradient(to right, #3b82f6, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ABPS Pro
          </h1>
          <p style={{ color: 'var(--text-dim)' }}>Automated Block Parking System</p>
        </div>
        
        <div className="search-bar">
          <Search size={18} />
          <input 
            placeholder="Search slot, vehicle or owner..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={20} /> Park Vehicle
        </button>
      </header>

      {/* Stats Dashboard */}
      <section className="stats-grid">
        <StatCard icon={<Car color="#3b82f6" />} label="Total Slots" value={stats.total} color="blue" />
        <StatCard icon={<Activity color="#ef4444" />} label="Occupied" value={stats.occupied} color="red" />
        <StatCard icon={<CheckCircle2 color="#10b981" />} label="Available" value={stats.available} color="green" />
        <StatCard icon={<CircleDollarSign color="#f59e0b" />} label="Total Revenue" value={`₹${stats.revenue}`} color="orange" />
      </section>

      {/* Parking Grid */}
      <main className="parking-grid">
        <AnimatePresence>
          {filteredSlots.map(slot => (
            <motion.div
              layout
              key={slot.slotNo}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -5 }}
              className={`slot glass ${slot.occupied ? 'occupied' : 'empty'}`}
              onClick={() => slot.occupied ? setSelectedSlot(slot) : null}
            >
              <span className="slot-number">#{slot.slotNo}</span>
              <div className="slot-icon">
                {slot.occupied ? <Car size={24} color="var(--danger)" /> : <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px dashed var(--success)' }} />}
              </div>
              {slot.occupied && (
                <span style={{ fontSize: '0.6rem', fontWeight: 700 }}>{slot.vehicle.vehicle}</span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </main>

      {/* Transaction History */}
      <section className="glass" style={{ marginTop: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Activity size={20} color="var(--primary)" />
          <h2 style={{ fontSize: '1.2rem' }}>Recent Transactions</h2>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {history.length === 0 ? (
            <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '2rem' }}>No recent transactions</p>
          ) : (
            history.map((tx, i) => (
              <div key={i} className="glass" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)' }}>
                    <Car size={18} color="var(--primary)" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600 }}>{tx.vehicle}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Slot #{tx.slotNo} • {tx.name}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 700, color: tx.cost > 0 ? 'var(--success)' : 'var(--text-dim)' }}>
                    {tx.cost > 0 ? `+ ₹${tx.cost}` : 'PREPAID'}
                  </p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    {new Date(tx.exitTime).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Booking Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="modal-content glass"
            >
              <div className="header" style={{ marginBottom: 0 }}>
                <h2>Add Vehicle</h2>
                <button onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>

              <div className="form-group">
                <label>Owner Name</label>
                <input 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="form-group">
                <label>Vehicle Number</label>
                <input 
                  value={form.vehicle} 
                  onChange={e => setForm({...form, vehicle: e.target.value})}
                  placeholder="e.g. KA 01 HH 1234"
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  value={form.phone} 
                  onChange={e => setForm({...form, phone: e.target.value})}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={form.paid} 
                  onChange={e => setForm({...form, paid: e.target.checked})}
                />
                <span style={{ fontSize: '0.9rem' }}>Prepaid / VIP Pass</span>
              </label>

              <button className="btn-primary" onClick={handlePark}>Confirm Parking</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedSlot && (
          <div className="modal-overlay" onClick={() => setSelectedSlot(null)}>
            <motion.div 
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="modal-content glass"
              style={{ borderLeft: '4px solid var(--danger)' }}
            >
              <div className="header">
                <h2>Slot Details #{selectedSlot.slotNo}</h2>
                <button onClick={() => setSelectedSlot(null)}><X size={20} /></button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <DetailItem label="Owner" value={selectedSlot.vehicle.name} />
                <DetailItem label="Vehicle" value={selectedSlot.vehicle.vehicle} />
                <DetailItem label="Phone" value={selectedSlot.vehicle.phone || 'N/A'} />
                <DetailItem label="Status" value={selectedSlot.vehicle.paid ? 'Paid' : 'Unpaid'} />
              </div>

              <div className="glass" style={{ padding: '1rem', marginTop: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                  <Clock size={14} /> Entry: {new Date(selectedSlot.entryTime).toLocaleTimeString()}
                </div>
              </div>

              <button 
                className="btn-primary" 
                style={{ background: 'var(--danger)', marginTop: '1rem' }}
                onClick={() => handleExit(selectedSlot.slotNo)}
              >
                <LogOut size={18} style={{ marginRight: '0.5rem' }} /> Checkout & Exit
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className={`stat-card glass glow-${color}`}>
      <div className="stat-icon" style={{ background: `var(--${color}-glow)` }}>
        {icon}
      </div>
      <div>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</p>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>{label}</p>
      <p style={{ fontWeight: 600 }}>{value}</p>
    </div>
  );
}
