# PLD Hackaton

Full-stack Flask app for PLD (Peer Learning Day) tracking. It includes a role-based login, student and mentor portals, and a leaderboards page. Data is stored in `users.json` and served through a small REST API.

**Tech Stack**
1. Python + Flask
2. HTML
3. JS
4. CSS (custom, per page)

**How To Run**
1. `python main.py`
2. Open `http://127.0.0.1:5000` in a browser.

**Login Credentials (Seeded)**
The login API uses the in-memory `users` dictionary in `main.py`, not `users.json`.
1. Students (password `123`):
   1. `12734@hbtn.com`
   2. `33442@hbtn.com`
   3. `11223@hbtn.com`
   4. `44556@hbtn.com`
   5. `63887@hbtn.com`
2. Mentor (password `123`):
   1. `99999@hbtn.com`

**Pages**
1. Login: `http://127.0.0.1:5000/login`
2. Student portal: `http://127.0.0.1:5000/student.html`
3. Mentor portal: `http://127.0.0.1:5000/mentor.html`
4. Leaderboards: `http://127.0.0.1:5000/leaderboards`

**Routes (Server)**
1. `GET /` and `GET /login`  
   Shows login page or redirects if session exists.
2. `GET /student.html`  
   Student portal, requires student session.
3. `GET /mentor.html`  
   Mentor portal, requires mentor session.
4. `GET /leaderboards`  
   Leaderboards page, requires any logged-in session.
5. `GET /logout`  
   Clears session and redirects to login.

**API Endpoints**
1. `POST /login`  
   Authenticates using the in-memory `users` dictionary and sets session.  
   Body: `{ "email": "...", "password": "...", "role": "student|mentor" }`
2. `GET /api/get_last_pld`  
   Returns last PLD data for logged-in student.
3. `GET /api/get_all_pld`  
   Returns full history for logged-in student.
4. `GET /api/get_students_list`  
   Returns student list for mentor data entry.
5. `POST /api/save_pld`  
   Saves PLD data for multiple students or single student.
6. `POST /api/clear_last_pld`  
   Removes last PLD for selected students.
7. `GET /api/leaderboards?scope=last|month|sprint`  
   Returns ranked data for the selected time window.

**Data Model**
Data persists in `users.json`. Key fields:
1. `profile`  
   `fullname`, `email`, `program`
2. `last_pld`  
   `date`, `topic`, `grades`, `avg`
3. `history`  
   Map of `topic -> avg`
4. `history_list`  
   List of entries with `date`, `topic`, `grades`, `avg`
5. `stats`  
   `total_plds`, `avg_score`

**Front-End Behavior**
1. `static/JS/function.js`  
   Splash screen animation and login POST to Flask. Saves role in `localStorage`.
2. `static/JS/student-script.js`  
   Role gate (student only), fetches last/all PLD data, logout.
3. `static/JS/mentor-script.js`  
   Role gate (mentor only), data entry form, scores grid, save/reset/clear actions, logout.
4. `static/JS/leaderboards-script.js`  
   Loads leaderboard data for selected scope.

**Project Structure**
1. `main.py`  
   Flask app and API logic.
2. `users.json`  
   Data storage for student PLD history.
3. `templates/`  
   `login.html`, `student.html`, `mentor.html`, `leaderboards.html`
4. `static/CSS/`  
   `style.css`, `student-style.css`, `mentor-style.css`, `leaderboards-style.css`
5. `static/JS/`  
   `function.js`, `student-script.js`, `mentor-script.js`, `leaderboards-script.js`

**UI Notes**
1. Rose accent theme uses CSS variables `--hbtn-red` and `--hbtn-red-hover`.
2. Background image floats on the left with `floatLogo` animation.
3. Layouts are full-screen with centered cards; mentor page supports vertical scroll for long forms.

**Known Gaps**
1. Login uses the in-memory `users` dict while PLD data comes from `users.json`. A mentor account in `users.json` is not required but could be added for consistency.
2. Some `history_list` entries in `users.json` are duplicated; the API tries to normalize when saving new PLDs.

**Next Ideas**
1. Move auth data into `users.json` and hash passwords.
2. Add a real user management UI for mentors.
3. Add export for leaderboards and PLD history.
