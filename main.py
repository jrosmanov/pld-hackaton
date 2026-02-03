from flask import Flask, request, jsonify, render_template, session, redirect, url_for
from flask_cors import CORS
from datetime import datetime, timedelta
import json

app = Flask(__name__)
app.secret_key = 'its-really-secret-key'

# Включаем поддержку кук для сессий
CORS(app, supports_credentials=True)

# Имитация базы данных (ключ — это ID из почты)
users = {
    '12734': {"email": "12734@hbtn.com", "password": "123", "role": "student"},
    '33442': {"email": "33442@hbtn.com", "password": "123", "role": "student"},
    '11223': {"email": "11223@hbtn.com", "password": "123", "role": "student"},
    '44556': {"email": "44556@hbtn.com", "password": "123", "role": "student"},
    '63887': {"email": "63887@hbtn.com", "password": "123", "role": "student"},
    '99999': {"email": "99999@hbtn.com", "password": "123", "role": "mentor"}

}

def parse_date(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value.date()
    try:
        return datetime.fromisoformat(str(value).replace('Z', '+00:00')).date()
    except ValueError:
        try:
            return datetime.strptime(str(value), "%Y-%m-%d").date()
        except ValueError:
            return None


def normalize_date(value):
    parsed = parse_date(value)
    if parsed:
        return parsed.isoformat()
    return datetime.utcnow().date().isoformat()


def compute_avg(grades):
    if not grades:
        return 0.0
    values = []
    for val in grades.values():
        try:
            values.append(float(val))
        except (TypeError, ValueError):
            values.append(0.0)
    return round(sum(values) / len(values), 1) if values else 0.0


def ensure_history_list(student):
    if 'history_list' not in student or not isinstance(student['history_list'], list):
        student['history_list'] = []
    if not student['history_list'] and isinstance(student.get('history'), dict):
        for topic, avg in student['history'].items():
            student['history_list'].append({
                "date": None,
                "topic": topic,
                "avg": avg,
                "grades": {}
            })
    last_pld = student.get('last_pld')
    if last_pld and last_pld.get('topic'):
        last_topic = last_pld.get('topic')
        last_date = last_pld.get('date')
        updated = False
        for entry in student['history_list']:
            if entry.get('topic') == last_topic and entry.get('date') in (None, last_date):
                entry['date'] = entry.get('date') or last_date
                entry['grades'] = entry.get('grades') or last_pld.get('grades', {})
                entry['avg'] = entry.get('avg') or last_pld.get('avg') or compute_avg(last_pld.get('grades', {}))
                updated = True
                break
        if not updated:
            student['history_list'].append({
                "date": last_date,
                "topic": last_topic,
                "avg": last_pld.get('avg') or compute_avg(last_pld.get('grades', {})),
                "grades": last_pld.get('grades', {})
            })
    return student['history_list']


def rebuild_history_map(student):
    history_list = ensure_history_list(student)
    history = {}
    for entry in history_list:
        topic = entry.get('topic')
        avg = entry.get('avg')
        if topic:
            history[topic] = avg
    student['history'] = history


def rebuild_stats(student):
    history_list = ensure_history_list(student)
    averages = [float(entry.get('avg') or 0) for entry in history_list]
    total = len(averages)
    student['stats'] = {
        "total_plds": total,
        "avg_score": round(sum(averages) / total, 1) if total else 0
    }


def grades_signature(grades):
    if not grades:
        return ""
    return "|".join(f"{k}:{grades[k]}" for k in sorted(grades))


# --- СТРАНИЦЫ ---

@app.route('/')
@app.route('/login', methods=['GET'])
def index():
    """Открывает страницу логина или перенаправляет, если сессия активна"""
    if 'user_role' in session:
        if session['user_role'] == 'student':
            return redirect(url_for('student_page'))
        elif session['user_role'] == 'mentor':
            return redirect(url_for('mentor_page'))

    # Если сессии нет, показываем форму входа
    return render_template('login.html')


@app.route('/student.html')
def student_page():
    if session.get('user_role') == 'student':
        return render_template('student.html')
    return redirect(url_for('index'))


@app.route('/mentor.html')
def mentor_page():
    if session.get('user_role') == 'mentor':
        return render_template('mentor.html')
    return redirect(url_for('index'))


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))


# --- API ЛОГИНА ЧЕРЕЗ ID ---

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email', '')
    password = data.get('password')
    role = data.get('role')

    # Извлекаем ID из email (все что до символа @)
    try:
        user_id = email.split('@')[0]
    except IndexError:
        return jsonify({"status": "error", "message": "Invalid email format"}), 400

    # Мгновенный поиск в словаре по ключу
    user = users.get(user_id)

    # Проверяем: существует ли юзер, совпадает ли пароль и роль
    if user and user['password'] == password and user['role'] == role:
        session['user_email'] = email
        session['user_role'] = role
        session.modified = True
        print(f"User {user_id} logged in successfully as {role}")
        return jsonify({"status": "success", "role": role}), 200

    return jsonify({"status": "error", "message": "Wrong credentials"}), 401


@app.route('/api/get_last_pld')
def get_last_pld():
    # 1. Получаем ID из сессии (например, из '12734@hbtn.com' берем '12734')
    if 'user_email' not in session:
        return jsonify({"error": "Unauthorized"}), 401

    user_id = session.get('user_email').split('@')[0]

    try:
        with open('users.json', 'r', encoding='utf-8') as f:
            db_users = json.load(f)
            user_data = db_users.get(user_id)

            if user_data and 'last_pld' in user_data:
                last_pld = user_data['last_pld']
                if 'avg' not in last_pld:
                    last_pld['avg'] = compute_avg(last_pld.get('grades', {}))
                return jsonify(last_pld)
            return jsonify({"error": "No PLD data found"}), 404
    except Exception:
        return jsonify({"error": "Server error"}), 500

@app.route('/api/get_all_pld')
def get_all_pld():
    if 'user_email' not in session:
        return jsonify({"error": "Unauthorized"}), 401

    user_id = session.get('user_email').split('@')[0]

    try:
        with open('users.json', 'r', encoding='utf-8') as f:
            db_users = json.load(f)
            user_data = db_users.get(user_id)

            # Отдаем только объект history или пустой объект, если истории нет
            if not user_data:
                return jsonify([])

            history_list = ensure_history_list(user_data)
            history_list.sort(key=lambda x: parse_date(x.get('date')) or datetime.min.date(), reverse=True)
            return jsonify(history_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/leaderboards')
def leaderboards_page():
    # Проверяем, залогинен ли пользователь (по желанию)
    if 'user_role' not in session:
        return redirect(url_for('index'))
    return render_template('leaderboards.html')

@app.route('/api/get_students_list')
def get_students_list():
    """Отдает список всех студентов (ID и Имя) для выпадающего списка ментора"""
    try:
        with open('users.json', 'r', encoding='utf-8') as f:
            db = json.load(f)
        # Собираем только тех, у кого роль student (если есть в профиле) или всех
        list_data = []
        for uid, data in db.items():
            if users.get(uid, {}).get('role') == 'mentor':
                continue
            fullname = data.get('profile', {}).get('fullname', 'Unknown')
            list_data.append({"id": uid, "name": fullname})
        return jsonify(list_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/save_pld', methods=['POST'])
def save_pld():
    if session.get('user_role') != 'mentor':
        return jsonify({"status": "error", "message": "Access denied"}), 403

    data = request.json or {}

    if data.get('students') and data.get('scores'):
        topic = data.get('topic')
        subtopics = data.get('subtopics', [])
        students = data.get('students', [])
        scores = data.get('scores', {})
        created_at = normalize_date(data.get('created_at'))

        if not topic or not subtopics or not students:
            return jsonify({"status": "error", "message": "Missing data"}), 400

        try:
            with open('users.json', 'r+', encoding='utf-8') as f:
                db = json.load(f)

                missing_ids = [student.get('id') for student in students if student.get('id') not in db]
                if missing_ids:
                    return jsonify({"status": "error", "message": f"Students not found: {', '.join(missing_ids)}"}), 404

                saved_count = 0
                overall_sum = 0

                for student in students:
                    student_id = student.get('id')
                    student_record = db.get(student_id)
                    if not student_record:
                        continue

                    student_scores = scores.get(student_id, {})
                    grades = {}
                    for subtopic in subtopics:
                        value = student_scores.get(subtopic, 0)
                        try:
                            value = float(value)
                        except (TypeError, ValueError):
                            value = 0
                        value = max(0, min(10, value))
                        grades[subtopic] = value

                    avg = compute_avg(grades)
                    last_pld = {
                        "date": created_at,
                        "topic": topic,
                        "grades": grades,
                        "avg": avg
                    }

                    student_record['last_pld'] = last_pld
                    history_list = ensure_history_list(student_record)
                    signature = grades_signature(grades)
                    exists = any(
                        entry.get('topic') == topic
                        and normalize_date(entry.get('date')) == created_at
                        and grades_signature(entry.get('grades', {})) == signature
                        for entry in history_list
                    )
                    if not exists:
                        history_list.append({
                            "date": created_at,
                            "topic": topic,
                            "grades": grades,
                            "avg": avg
                        })
                    rebuild_history_map(student_record)
                    rebuild_stats(student_record)

                    saved_count += 1
                    overall_sum += avg

                f.seek(0)
                json.dump(db, f, indent=4, ensure_ascii=False)
                f.truncate()

            overall_avg = round(overall_sum / saved_count, 1) if saved_count else 0
            return jsonify({"status": "success", "saved_count": saved_count, "avg_overall": overall_avg}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    student_id = data.get('student_id')
    topic = data.get('topic')
    grades = data.get('grades')

    if not student_id or not topic or not grades:
        return jsonify({"status": "error", "message": "Missing data"}), 400

    try:
        with open('users.json', 'r+', encoding='utf-8') as f:
            db = json.load(f)

            if student_id not in db:
                return jsonify({"status": "error", "message": "Student not found"}), 404

            student = db[student_id]
            avg = compute_avg(grades)
            date_value = normalize_date(data.get('created_at'))

            student['last_pld'] = {
                "date": date_value,
                "topic": topic,
                "grades": grades,
                "avg": avg
            }

            history_list = ensure_history_list(student)
            signature = grades_signature(grades)
            exists = any(
                entry.get('topic') == topic
                and normalize_date(entry.get('date')) == date_value
                and grades_signature(entry.get('grades', {})) == signature
                for entry in history_list
            )
            if not exists:
                history_list.append({
                    "date": date_value,
                    "topic": topic,
                    "grades": grades,
                    "avg": avg
                })
            rebuild_history_map(student)
            rebuild_stats(student)

            f.seek(0)
            json.dump(db, f, indent=4, ensure_ascii=False)
            f.truncate()

        return jsonify({"status": "success", "saved_count": 1, "avg_overall": avg}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/clear_last_pld', methods=['POST'])
def clear_last_pld():
    if session.get('user_role') != 'mentor':
        return jsonify({"status": "error", "message": "Access denied"}), 403

    data = request.json or {}
    student_ids = data.get('student_ids') or []
    student_id = data.get('student_id')
    if student_id:
        student_ids.append(student_id)

    student_ids = [sid for sid in student_ids if sid]
    if not student_ids:
        return jsonify({"status": "error", "message": "No student IDs provided"}), 400

    try:
        with open('users.json', 'r+', encoding='utf-8') as f:
            db = json.load(f)
            cleared = 0
            for sid in student_ids:
                if sid in db and 'last_pld' in db[sid]:
                    db[sid].pop('last_pld', None)
                    cleared += 1

            f.seek(0)
            json.dump(db, f, indent=4, ensure_ascii=False)
            f.truncate()

        return jsonify({"status": "success", "cleared": cleared}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/leaderboards')
def get_leaderboards():
    scope = request.args.get('scope', 'last')
    current_user_email = session.get('user_email', '')
    current_user_id = current_user_email.split('@')[0] if current_user_email else None

    now = datetime.utcnow().date()
    if scope == 'month':
        window_days = 30
        viewing_label = 'Month (Last 30 Days)'
    elif scope == 'sprint':
        window_days = 90
        viewing_label = 'Sprint (Last 3 Months)'
    else:
        window_days = None
        viewing_label = 'Last PLD'
        scope = 'last'

    try:
        with open('users.json', 'r', encoding='utf-8') as f:
            db = json.load(f)

        all_students = []

        for uid, user in db.items():
            if users.get(uid, {}).get('role') == 'mentor':
                continue

            fullname = user.get('profile', {}).get('fullname', 'Unknown')
            display_name = f"{fullname} ({uid})"

            if scope == 'last':
                last_pld = user.get('last_pld', {})
                score = last_pld.get('avg')
                if score is None:
                    score = compute_avg(last_pld.get('grades', {}))
            else:
                history_list = ensure_history_list(user)
                cutoff = now - timedelta(days=window_days)
                values = []
                for entry in history_list:
                    entry_date = parse_date(entry.get('date'))
                    if entry_date and entry_date >= cutoff:
                        avg = entry.get('avg')
                        if avg is None:
                            avg = compute_avg(entry.get('grades', {}))
                        values.append(float(avg))
                score = round(sum(values) / len(values), 1) if values else 0

            all_students.append({
                "id": uid,
                "name": display_name,
                "score": round(float(score), 1) if score is not None else 0
            })

        all_students.sort(key=lambda x: x['score'], reverse=True)

        for index, student in enumerate(all_students):
            student['rank'] = index + 1

        top_10 = all_students[:10]

        current_user_row = None
        user_in_top_10 = False

        if current_user_id:
            for student in all_students:
                if student['id'] == current_user_id:
                    current_user_row = student
                    if student['rank'] <= 10:
                        user_in_top_10 = True
                    break

        return jsonify({
            "viewing": f"{viewing_label} (Top 10)",
            "columns": ["Rank", "Name", "Score"],
            "top_10": top_10,
            "user_row": current_user_row if not user_in_top_10 else None
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
