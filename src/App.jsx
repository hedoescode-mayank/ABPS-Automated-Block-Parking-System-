import { useState } from "react";
import "./App.css";

export default function App() {
  // 60 parking slots
  const [slots, setSlots] = useState(
    Array.from({ length: 60 }, (_, i) => ({
      slotNo: i + 1,
      occupied: false,
      vehicle: null,
    }))
  );
//park car 
  function parkCar() {
    const index = slots.findIndex(s => !s.occupied);
    if (index === -1) {
      alert("Parking Full");
      return;
    }

    const newSlots = [...slots];
    newSlots[index] = {
      ...newSlots[index],
      occupied: true,
      vehicle: {
        name: "Test User",
        car: "Car",
        phone: "9999999999",
      },
    };

    setSlots(newSlots);
  }

  function removeCar(slotNo) {
    const newSlots = slots.map(s =>
      s.slotNo === slotNo
        ? { ...s, occupied: false, vehicle: null }
        : s
    );
    setSlots(newSlots);

  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Parking System</h1>
      <button onClick={parkCar}>Park Vehicle</button>

      <div className="grid">
        {slots.map(slot => (
          <div
            key={slot.slotNo}
            className={`slot ${slot.occupied ? "occupied" : "empty"}`}
            onClick={() =>
              slot.occupied && removeCar(slot.slotNo)
            }
          >
            <strong>{slot.slotNo}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
