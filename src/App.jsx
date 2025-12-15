import { useState } from "react";
import "./App.css";

export default function App() {

  /* ===============================
     1. PARKING DATA (TRUTH)
     =============================== */

  // 60 fixed parking slots
  // Har slot ek object hai
  const [slots, setSlots] = useState(
    Array.from({ length: 60 }, (_, i) => ({
      slotNo: i + 1,
      occupied: false,   // false = green, true = red
      vehicle: null      // yahan vehicle ka data aayega
    }))
  );

  /* ===============================
     2. MODAL + FORM STATE
     =============================== */

  // Modal dikhana hai ya nahi
  const [showModal, setShowModal] = useState(false);

  // Temporary form data
  const [form, setForm] = useState({
    name: "",
    phone: "",
    vehicle: "",
    paid: false
  });

  /* ===============================
     3. FORM INPUT HANDLE
     =============================== */

  // Jab user input likhta hai
  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    // Form ke andar sirf ek field update hoti hai
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  /* ===============================
     4. SUBMIT FORM = PARK VEHICLE
     =============================== */

  function submitForm() {

    // First empty slot dhundo
    const index = slots.findIndex(s => !s.occupied);

    // Agar parking full hai
    if (index === -1) {
      alert("Parking Full");
      return;
    }

    // Agar form incomplete hai
    if (!form.name || !form.phone || !form.vehicle) {
      alert("Fill all fields");
      return;
    }

    // Slots ka naya copy banao (React rule)
    const newSlots = [...slots];

    // Us empty slot ko occupied karo
    newSlots[index] = {
      ...newSlots[index],
      occupied: true,        // yahi RED karta hai
      vehicle: { ...form }   // yahan data attach hota hai
    };

    // React ko bolo: data badal gaya
    setSlots(newSlots);

    // Form reset + modal close
    setForm({ name: "", phone: "", vehicle: "", paid: false });
    setShowModal(false);
  }

  /* ===============================
     5. REMOVE VEHICLE (EXIT)
     =============================== */

  function removeCar(slotNo) {

    // Sirf ek slot ko empty karo
    const newSlots = slots.map(slot =>
      slot.slotNo === slotNo
        ? { ...slot, occupied: false, vehicle: null }
        : slot
    );

    // React redraw karega -> GREEN ho jayega
    setSlots(newSlots);
  }

  /* ===============================
     6. UI (RENDER)
     =============================== */

  return (
    <div className="container">
      <h1>Parking System</h1>

      {/* Modal open button */}
      <button onClick={() => setShowModal(true)}>
        Park Vehicle
      </button>

      {/* PARKING GRID */}
      <div className="grid">
        {slots.map(slot => (
          <div
            key={slot.slotNo}

            // DATA decide karta hai color
            className={`slot ${slot.occupied ? "occupied" : "empty"}`}

            // Agar occupied hai to click pe exit
            onClick={() => slot.occupied && removeCar(slot.slotNo)}
          >
            <strong>{slot.slotNo}</strong>
          </div>
        ))}
      </div>

      {/* ===============================
          MODAL
         =============================== */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Add Vehicle</h2>

            <input
              name="name"
              placeholder="Customer Name"
              value={form.name}
              onChange={handleChange}
            />

            <input
              name="phone"
              placeholder="Phone Number"
              value={form.phone}
              onChange={handleChange}
            />

            <input
              name="vehicle"
              placeholder="Vehicle Number"
              value={form.vehicle}
              onChange={handleChange}
            />

            <label>
              <input
                type="checkbox"
                name="paid"
                checked={form.paid}
                onChange={handleChange}
              />
              Paid
            </label>

            <div className="actions">
              <button onClick={submitForm}>Submit</button>
              <button onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
