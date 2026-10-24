# Cybersecurity Threat Monitoring Dashboard
## Mini Project Report

**Degree/Branch:** B.Tech CSE (AI & ML)  
**Project Type:** Web application  
**Technology Stack:** Python, Flask, SQLite, HTML, CSS, JavaScript, Chart.js  
**Project Status:** Educational prototype using simulated data

## 1. Abstract

The Cybersecurity Threat Monitoring Dashboard, named CyberWatch, is a web-based educational prototype that presents security event information in a centralized interface. The application displays event counts, open and critical alerts, a simple demo risk indicator, severity distribution, event activity, threat categories, and frequent source addresses. Analysts can search and filter events, inspect event details, mark records as resolved, generate a simulated event, and export records to CSV. Flask provides the API, SQLite stores events, and a responsive browser interface visualizes the results.

The prototype is designed to demonstrate dashboard development, REST API design, database operations, data visualization, and basic rule-based security event concepts. It uses synthetic data only and does not claim to detect actual attacks.

## 2. Problem Statement

Security event information can be difficult to review when it is spread across logs and separate tools. A compact dashboard can make sample events easier to understand by presenting severity, timestamps, sources, categories, and status in one place. The goal of this project is to create an interactive demonstration that supports event review and simple incident workflow.

## 3. Objectives

1. Build a responsive and visually clear security dashboard.
2. Store event records in a local SQLite database.
3. Provide API endpoints to retrieve and update event records.
4. Visualize activity, severity, and threat categories.
5. Support searching and filtering by severity/status.
6. Allow a user to inspect an event and mark it resolved.
7. Export event records to CSV for reporting.
8. Demonstrate safe, transparent rule-based security concepts with simulated records.

## 4. Scope

The current prototype is suitable for a classroom demonstration and local testing. It provides synthetic events for categories including brute force, reconnaissance, malware, command-and-control indicators, policy violations, privilege abuse, and misconfiguration. It does not connect to a production SIEM, collect real network packets, block IP addresses, or guarantee detection of threats.

## 5. Technology Stack

| Technology | Purpose |
|---|---|
| Python | Application and business logic |
| Flask | HTTP server and REST API |
| SQLite | Persistent local event storage |
| HTML5 | Page structure |
| CSS3 | Responsive styling and dashboard layout |
| JavaScript | Interactions, API requests, filtering |
| Chart.js | Interactive charts |

## 6. System Architecture

The browser UI calls the Flask API using HTTP requests. Flask reads and updates records in SQLite. The summary endpoint aggregates stored records for KPI cards and charts. The simulated event generator inserts a predefined sample event. The browser then refreshes the summary and event list.

**Data flow:** Sample event generator → Flask routes and rule labels → SQLite database → REST API → JavaScript dashboard and charts → analyst review/export.

## 7. Main Modules

### 7.1 Dashboard overview
Shows total event count, open alert count, critical open alerts, and a rule-based demo risk indicator.

### 7.2 Event visualization
Chart.js presents event activity over recent hours, severity distribution, and event counts by category.

### 7.3 Alert management
Users can search by title, IP, category, or asset, filter by severity and status, view event details, and mark an open record as resolved.

### 7.4 Event generation
A button inserts a new synthetic record chosen from predefined example patterns. It is not a live detection engine.

### 7.5 Database and export
SQLite stores the event ID, timestamp, source IP, title, category, severity, asset, description, and status. CSV export supports offline review.

## 8. Methodology

1. Define a schema for security events.
2. Seed the database with synthetic event records on first launch.
3. Implement REST endpoints for summaries, lists, resolution, generation, and export.
4. Build the responsive dashboard layout.
5. Fetch API data in JavaScript and render metrics and charts.
6. Add search, severity/status filters, details modal, and resolve action.
7. Test the application locally with representative interactions.

## 9. Demo Risk Indicator

The prototype calculates:

`Risk score = min(100, 18 × open critical alerts + 8 × open high alerts + total open alerts)`

The result is capped at 100. This simple formula is intended only to make the dashboard interactive and explainable. It is not a standard security risk model and should not be used for real operational decisions.

## 10. Testing Plan

| Test | Expected result |
|---|---|
| Launch application | Dashboard loads at localhost |
| First launch | Database is created and sample events are inserted |
| Load overview | KPI values and charts render |
| Search by IP/title | Only matching events are displayed |
| Filter by severity | Results match the selected severity |
| Open event details | Modal shows the selected event fields |
| Resolve an open event | Status changes to Resolved and metrics refresh |
| Generate test event | New simulated event appears in database and UI |
| Export CSV | Browser downloads `security_events.csv` |
| Resize browser | Layout adapts to mobile and desktop widths |

## 11. Security and Ethical Considerations

The project is deliberately limited to synthetic records and does not scan or access any external system. Reserved documentation IP addresses are used in sample records. The demo has no authentication and is intended to run locally. Before any real deployment, authentication, authorization, secure configuration, validation, audit trails, access controls, monitoring, and security testing would be necessary.

## 12. Limitations

- Synthetic event records do not represent real network telemetry.
- Detection labels are predefined rather than derived from traffic.
- The risk indicator is a simplistic teaching metric.
- Authentication, permissions, and audit logging are not implemented.
- External CDN assets require internet access unless downloaded and served locally.

## 13. Future Enhancements

- Import authorized sample logs from CSV or JSON.
- Add login and analyst roles.
- Implement pagination and audit history.
- Create configurable detection rules and unit tests.
- Add a log-ingestion pipeline for a controlled lab environment.
- Integrate a trained anomaly-detection model using a clearly documented dataset.
- Add automated report generation and deployment configuration.

## 14. Conclusion

CyberWatch demonstrates how a web application can collect structured sample event records, summarize them through an API, and present the information through interactive visualizations. It combines backend development, database operations, front-end design, and basic cybersecurity concepts in a manageable intermediate-level project. The prototype provides a foundation for future improvements while clearly distinguishing simulated events from genuine threat detection.
