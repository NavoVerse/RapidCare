# RapidCare Ambulance Booking Guide

After analyzing the RapidCare codebase, I can confirm that the full lifecycle of the ambulance booking system—from patient request to driver dispatch and live tracking—is completely implemented.

Here is a breakdown of how it works under the hood, and a step-by-step guide to testing it locally.

## 🏗️ How it Works (Under the Hood)

1. **Patient Request (`/api/v1/trips/request`)**
   - The patient selects a hospital on the map and clicks "Book Ambulance" via `Frontend/patient_Dashboard/script.js`.
   - The frontend calls the `POST /trips/request` API, sending the patient's GPS coordinates and the chosen `hospital_id`.
   - *AI Triage:* If Gemini API is configured, the backend quickly analyzes the patient's vitals (HR, BP, SpO2) to assign a severity (`CRITICAL`, `URGENT`, `STANDARD`).
   - The backend loops through all drivers with status `available`, calculates the nearest driver using the Haversine distance formula, and assigns the trip to them.
2. **Real-time Dispatch (`Socket.io`)**
   - The assigned driver receives the trip in their queue on the Driver Dashboard.
   - The driver can Accept or Reject the trip.
   - Upon acceptance, the patient receives a live socket notification: `trip:accepted`.
3. **Live Tracking**
   - As the driver updates their status (`Arrived`, `Heading to Hospital`, `Completed`), the backend updates the database (`PUT /api/v1/trips/:id/status`).
   - The driver's location is continuously piped via Socket.io to the patient's tracking map in real-time.

---

## 🚀 How to Actually Run and Test it

To see the ambulance booking work from end-to-end on your local machine, follow this guide to simulate both a Patient and a Driver.

### Step 1: Initialize Backend & Database
You need a populated database so that you have a registered patient, driver, and hospital to play with. The project includes a seed file just for this.

1. Open your terminal and navigate to the backend folder:
   ```bash
   cd Backend
   ```
2. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```
3. Run Knex migrations to build the tables:
   ```bash
   npx knex migrate:latest
   ```
4. Run the seed script to populate default users:
   ```bash
   npx knex seed:run
   ```
   > [!NOTE]
   > This automatically creates:
   > - Patient: `patient@rapidcare.com`
   > - Driver: `driver@rapidcare.com`
   > - Hospital: `hospital@rapidcare.com`
   > - Password for all: `password123`

5. Start the backend server:
   ```bash
   npm start
   ```

### Step 2: Set Up the Driver (Tab 1)
You must have a driver actively listening for requests.

1. Open a browser tab to **http://localhost:5000/driver-login**
2. Log in with `driver@rapidcare.com` and password `password123`.
3. Keep this tab open. Ensure your status shows as **"Available"** on the dashboard.

### Step 3: Book the Ambulance as a Patient (Tab 2)
Now you will act as the patient in distress.

1. Open a new browser tab to **http://localhost:5000/login**
2. Log in with `patient@rapidcare.com` and password `password123`.
3. Navigate to the map section in your patient dashboard.
4. Select the "Main General Hospital" from the list/map and click **Book Ambulance**.
5. The backend will detect that `driver@rapidcare.com` is the nearest available driver and assign the trip to them!

### Step 4: Manage the Trip Lifecycle
1. Switch back to the **Driver Tab**. You should see the new trip appear in your queue.
2. Click **Accept Trip**. 
3. Switch back to the **Patient Tab**. You will see a notification that the ambulance has been dispatched, and the live tracking map will initiate.
4. On the **Driver Tab**, update your trip status step-by-step (`Arrived at Patient`, `Picked Up`, etc.) until completion.

---

> [!TIP]
> **Missing Hospital Dashboard Route**
> Note that `server.js` currently does not serve the Hospital Dashboard statically. If you want to view the hospital side of things, you should either open `Frontend/hospital_Dashboard/index.html` directly in your browser using the filesystem, or add the following line to your `server.js` around line 205:
> `app.use('/hospital', express.static(path.resolve(__dirname, '../Frontend/hospital_Dashboard')));`
