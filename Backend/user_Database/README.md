# RapidCare User Database

This directory contains the SQL implementation for the RapidCare User Database.

## Integration
The database is structured to support three distinct roles:
1. **Patients**: Core users who request services.
2. **Drivers**: Service providers (Ambulances) with real-time tracking capabilities.
3. **Hospitals**: Medical destinations with bed availability tracking.

## Usage
- Run `schema.sql` in your favorite SQL client (SQLite, PostgreSQL, MySQL) to initialize the tables.
- The `users` table is the primary table; role-specific details are linked via foreign keys.

## Data Structure
- **Latitude/Longitude**: Stored as REAL/DECIMAL for precision in mapping.
- **Trip Tracking**: The `trips` table allows for auditing and historical analysis of emergency services.
