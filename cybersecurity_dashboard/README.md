# CyberWatch — Cybersecurity Dashboard

An intermediate-level educational web application for monitoring **simulated** security events. It includes a Flask REST API, SQLite persistence, a responsive dashboard, charts, alert filters, event details, resolution workflow, and CSV export.

> **Important:** This project uses synthetic/sample data only. It does not inspect, scan, or protect real systems. IP ranges in the sample data are reserved for documentation (RFC 5737).

## Features

- Overview KPI cards: total events, open alerts, critical alerts, demo risk score
- Interactive Chart.js event activity, severity, and category charts
- Search and filters for severity and status
- Event investigation modal and resolve workflow
- Generate a simulated test event
- SQLite database seeded on first launch
- CSV export of stored events
- Responsive UI for desktop and mobile

## Requirements

- Python 3.10 or later
- pip
- Internet access for Google Fonts and Chart.js CDN (optional; offline mode requires local copies)

## Run locally

### Windows (PowerShell / CMD)
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### macOS / Linux
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Open http://127.0.0.1:5000 in your browser. The SQLite database `security.db` is created automatically and seeded on the first run. The dashboard uses simulated sample events for learning; it is not a real intrusion detection system.

## Project structure

```text
cybersecurity_dashboard/
├── app.py
├── requirements.txt
├── README.md
├── REPORT.md
├── templates/
│   └── index.html
└── static/
    ├── style.css
    └── app.js
```

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/summary` | KPIs and chart aggregates |
| GET | `/api/events` | Retrieve/search/filter events |
| POST | `/api/events/<id>/resolve` | Mark an event resolved |
| POST | `/api/events/generate` | Insert a simulated event |
| GET | `/api/export.csv` | Download all events as CSV |

Example:
```bash
curl http://127.0.0.1:5000/api/summary
curl "http://127.0.0.1:5000/api/events?severity=Critical&status=Open"
```

## Detection logic

The demo generator selects from predefined event patterns such as repeated failed logins, port scanning, suspicious DNS requests, and unusual outbound traffic. These are pre-labeled sample events rather than detections from live traffic.

The risk indicator is intentionally transparent:
`min(100, 18 × open critical + 8 × open high + open alerts)`

It is a classroom metric only, not a validated risk score.

## Limitations and next steps

- Data is synthetic; no packet capture or live endpoint telemetry is collected.
- No authentication or role-based access is included; do not expose this demo to the public internet.
- The risk score and event generator are educational examples.
- For a more advanced version, add authenticated analyst accounts, unit tests, audit history, pagination, configurable rules, and ingestion from an authorized lab log file.

## Troubleshooting

- If `flask` is not found, activate the virtual environment and run `pip install -r requirements.txt`.
- If port 5000 is busy, change the port in the last line of `app.py`.
- The database is created in the project directory. Delete `security.db` only if you want to reset the local demo data.
