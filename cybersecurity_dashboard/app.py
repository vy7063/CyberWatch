from flask import Flask, jsonify, request, render_template, Response
import sqlite3, random, csv, io
from datetime import datetime, timedelta, timezone
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "security.db"
app = Flask(__name__)

SEED_EVENTS = [
    ("192.0.2.24", "Failed login burst", "Brute Force", "High", "Authentication service", "Repeated failed logins from a single source."),
    ("198.51.100.18", "Port scan detected", "Reconnaissance", "Medium", "Edge firewall", "Multiple destination ports probed in a short interval."),
    ("203.0.113.77", "Suspicious DNS request", "Command & Control", "Critical", "DNS resolver", "Request matched a simulated suspicious-domain rule."),
    ("192.0.2.91", "Unusual outbound traffic", "Exfiltration", "High", "Gateway monitor", "Outbound transfer exceeded the configured demo threshold."),
    ("198.51.100.42", "Malware signature match", "Malware", "Critical", "Endpoint sensor", "A simulated file hash matched a demo signature."),
    ("203.0.113.14", "Policy violation", "Policy", "Low", "Web proxy", "A request matched a demo acceptable-use rule."),
    ("192.0.2.105", "Privilege escalation attempt", "Privilege Abuse", "High", "Host audit log", "A simulated process requested elevated permissions."),
    ("198.51.100.63", "Unexpected service exposure", "Misconfiguration", "Medium", "Asset scanner", "A demo host exposed a service outside its baseline."),
]

def connect():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con

def init_db():
    with connect() as con:
        con.execute("""CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            source_ip TEXT NOT NULL,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            severity TEXT NOT NULL,
            asset TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Open'
        )""")
        count = con.execute("SELECT COUNT(*) FROM events").fetchone()[0]
        if count == 0:
            now = datetime.now(timezone.utc)
            for i in range(48):
                sample = random.choice(SEED_EVENTS)
                stamp = (now - timedelta(minutes=random.randint(1, 60 * 24))).isoformat(timespec="seconds")
                con.execute(
                    "INSERT INTO events(timestamp,source_ip,title,category,severity,asset,description,status) VALUES(?,?,?,?,?,?,?,?)",
                    (stamp, *sample, "Resolved" if random.random() < .28 else "Open")
                )

def row_dict(row):
    return dict(row)

@app.route("/")
def home():
    return render_template("index.html")

@app.get("/api/events")
def get_events():
    severity = request.args.get("severity", "All")
    status = request.args.get("status", "All")
    query = request.args.get("q", "").strip()
    sql = "SELECT * FROM events WHERE 1=1"
    args = []
    if severity != "All":
        sql += " AND severity = ?"; args.append(severity)
    if status != "All":
        sql += " AND status = ?"; args.append(status)
    if query:
        sql += " AND (title LIKE ? OR source_ip LIKE ? OR category LIKE ? OR asset LIKE ?)"
        args.extend([f"%{query}%"] * 4)
    sql += " ORDER BY timestamp DESC LIMIT 250"
    with connect() as con:
        rows = con.execute(sql, args).fetchall()
    return jsonify([row_dict(r) for r in rows])

@app.get("/api/summary")
def summary():
    with connect() as con:
        total = con.execute("SELECT COUNT(*) FROM events").fetchone()[0]
        open_count = con.execute("SELECT COUNT(*) FROM events WHERE status='Open'").fetchone()[0]
        critical = con.execute("SELECT COUNT(*) FROM events WHERE severity='Critical' AND status='Open'").fetchone()[0]
        high = con.execute("SELECT COUNT(*) FROM events WHERE severity='High' AND status='Open'").fetchone()[0]
        severity = con.execute("SELECT severity, COUNT(*) n FROM events GROUP BY severity").fetchall()
        categories = con.execute("SELECT category, COUNT(*) n FROM events GROUP BY category ORDER BY n DESC LIMIT 7").fetchall()
        recent = con.execute("""SELECT substr(timestamp,1,13) hour, COUNT(*) n FROM events
                             WHERE timestamp >= ? GROUP BY hour ORDER BY hour""",
                             ((datetime.now(timezone.utc)-timedelta(hours=12)).isoformat(timespec="seconds"),)).fetchall()
        top_ips = con.execute("""SELECT source_ip, COUNT(*) n FROM events
                              GROUP BY source_ip ORDER BY n DESC LIMIT 5""").fetchall()
    risk = min(100, critical * 18 + high * 8 + open_count * 1)
    return jsonify({
        "total_events": total, "open_alerts": open_count, "critical_alerts": critical,
        "high_alerts": high, "risk_score": risk,
        "severity": [dict(r) for r in severity],
        "categories": [dict(r) for r in categories],
        "hourly": [dict(r) for r in recent],
        "top_ips": [dict(r) for r in top_ips]
    })

@app.post("/api/events/<int:event_id>/resolve")
def resolve_event(event_id):
    with connect() as con:
        cur = con.execute("UPDATE events SET status='Resolved' WHERE id=?", (event_id,))
        if cur.rowcount == 0:
            return jsonify({"error": "Event not found"}), 404
    return jsonify({"ok": True, "id": event_id, "status": "Resolved"})

@app.post("/api/events/generate")
def generate_event():
    sample = random.choice(SEED_EVENTS)
    stamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
    with connect() as con:
        cur = con.execute(
            "INSERT INTO events(timestamp,source_ip,title,category,severity,asset,description,status) VALUES(?,?,?,?,?,?,?,?)",
            (stamp, *sample, "Open")
        )
        new_id = cur.lastrowid
        row = con.execute("SELECT * FROM events WHERE id=?", (new_id,)).fetchone()
    return jsonify(row_dict(row)), 201

@app.get("/api/export.csv")
def export_csv():
    with connect() as con:
        rows = con.execute("SELECT * FROM events ORDER BY timestamp DESC").fetchall()
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=list(rows[0].keys()) if rows else
                            ["id","timestamp","source_ip","title","category","severity","asset","description","status"])
    writer.writeheader()
    writer.writerows([row_dict(r) for r in rows])
    return Response(output.getvalue(), mimetype="text/csv",
                    headers={"Content-Disposition": "attachment; filename=security_events.csv"})

init_db()

if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=5000)
