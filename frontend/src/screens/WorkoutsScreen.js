export default function WorkoutsScreen() {
  return (
    <>
      <section className="card">
        <div className="card-header">
          <h2 className="screen-title">Today&apos;s workout plan</h2>
          <span className="card-label">At-home or gym friendly</span>
        </div>
        <ul style={{ listStyle: "none", fontSize: "0.9rem", color: "#e5e7eb" }}>
          <li>• 5 min dynamic warm-up</li>
          <li>• 3 × 12 squats (bodyweight or dumbbells)</li>
          <li>• 3 × 10 push-ups (knees or standard)</li>
          <li>• 3 × 12 dumbbell rows (backpack if at home)</li>
          <li>• 10 min light walk or cycle</li>
        </ul>
      </section>

      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Equipment ideas</h2>
          <span className="card-label">At-home</span>
        </div>
        <p style={{ fontSize: "0.9rem", color: "#d1d5db" }}>
          Use water bottles, backpacks, chairs, and towels as simple at-home equipment.
          We can wire this up later to a workout generator and photo examples.
        </p>
      </section>
    </>
  );
}