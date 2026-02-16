export default function AdminReviewView({ status, onStatusChange, items, loading, onResolve, onDismiss }) {
  return (
    <main className="page-shell">
      <section className="page-card">
        <div className="toolbar">
          <div>
            <h1>Admin Review Queue</h1>
            <p className="muted">Review conflicting intelligence tags and resolve them without using curl.</p>
          </div>
          <label>
            Status
            <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
              <option value="OPEN">OPEN</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="DISMISSED">DISMISSED</option>
            </select>
          </label>
        </div>

        {loading ? <p className="muted">Loading review queue...</p> : null}

        <div className="list-stack">
          {items.map((item) => (
            <article key={item.id} className="list-item vertical">
              <div className="result-head">
                <strong>{item.restaurant?.name || 'Restaurant'}</strong>
                <span className="score-pill">{item.status}</span>
              </div>
              <p className="mini-meta">
                {item.tagType} • {item.tagValue}
              </p>
              <p className="mini-why">Reason: {item.reason}</p>
              <p className="muted">Created: {new Date(item.createdAt).toLocaleString()}</p>

              {item.status === 'OPEN' ? (
                <div className="search-row">
                  <button type="button" className="secondary-btn" onClick={() => onResolve(item.id)}>
                    Resolve
                  </button>
                  <button type="button" className="chip" onClick={() => onDismiss(item.id)}>
                    Dismiss
                  </button>
                </div>
              ) : null}
            </article>
          ))}

          {!items.length && !loading ? <p className="muted">No items for this status.</p> : null}
        </div>
      </section>
    </main>
  );
}
