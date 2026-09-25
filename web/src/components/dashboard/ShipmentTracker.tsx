const STEPS = ["Pickup", "In Transit", "Out for Delivery", "Delivered"] as const;

export default function ShipmentTracker({ currentStep = -1 }: { currentStep?: number }) {
  return (
    <div className="ship-track" role="list" aria-label="Shipment status">
      {STEPS.map((step, index) => {
        const done = index <= currentStep;
        const current = index === currentStep;
        return (
          <div
            key={step}
            role="listitem"
            className={`ship-track__step${done ? " is-done" : ""}${current ? " is-current" : ""}`}
          >
            <span className="ship-track__dot">
              {done && <span className="ship-track__tick">✓</span>}
            </span>
            <span className="ship-track__label">{step}</span>
          </div>
        );
      })}
    </div>
  );
}