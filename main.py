from flask import Flask, request, jsonify, render_template, session, redirect, url_for
from flask_cors import CORS
from datetime import datetime
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
                return jsonify(user_data['last_pld'])
            return jsonify({"error": "No PLD data found"}), 404
    except Exception as e:
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
            return jsonify(user_data.get('history', {}))
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
        list_data = [{"id": uid, "name": data['profile']['fullname']} for uid, data in db.items()]
        return jsonify(list_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/save_pld', methods=['POST'])
def save_pld():
    if session.get('user_role') != 'mentor':
        return jsonify({"status": "error", "message": "Access denied"}), 403

    data = request.json
    student_id = data.get('student_id')
    topic = data.get('topic')
    grades = data.get('grades')  # { "Вопрос": оценка }

    if not student_id or not topic or not grades:
        return jsonify({"status": "error", "message": "Missing data"}), 400

    try:
        with open('users.json', 'r+', encoding='utf-8') as f:
            db = json.load(f)

            if student_id not in db:
                return jsonify({"status": "error", "message": "Student not found"}), 404

            student = db[student_id]

            # 1. Считаем средний балл текущего PLD
            current_pld_avg = sum(grades.values()) / len(grades) if grades else 0
            current_pld_avg = round(current_pld_avg, 1)

            # 2. Обновляем last_pld
            student['last_pld'] = {
                "date": datetime.now().strftime("%Y-%m-%d"),
                "topic": topic,
                "grades": grades
            }

            # 3. Обновляем history
            if 'history' not in student:
                student['history'] = {}
            # Добавляем/обновляем топик в истории
            student['history'][topic] = current_pld_avg

            # 4. Обновляем stats
            if 'stats' not in student:
                student['stats'] = {"total_plds": 0, "avg_score": 0}

            # Количество PLD — это просто длина истории
            student['stats']['total_plds'] = len(student['history'])
            # Итоговый средний балл — среднее от всех баллов в истории
            all_history_scores = student['history'].values()
            student['stats']['avg_score'] = round(sum(all_history_scores) / len(all_history_scores), 1)

            # Сохраняем файл
            f.seek(0)
            json.dump(db, f, indent=4, ensure_ascii=False)
            f.truncate()

        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/leaderboards')
def get_leaderboards():
    scope = request.args.get('scope', 'last')
    current_user_email = session.get('user_email', '')
    current_user_id = current_user_email.split('@')[0] if current_user_email else None

    try:
        with open('users.json', 'r', encoding='utf-8') as f:
            db = json.load(f)

        all_students = []

        for uid, user in db.items():
            # Работаем только со студентами
            if user.get('role') == 'mentor':
                continue

            fullname = user.get('profile', {}).get('fullname', 'Unknown')
            display_name = f"{fullname} ({uid})"
            score = 0

            if scope == 'last':
                # Сумма баллов за последнее PLD
                grades = user.get('last_pld', {}).get('grades', {})
                score = sum(grades.values()) / len(grades) if grades else 0
            else:
                # Sprint: Сумма ВСЕХ баллов из истории
                history = user.get('history', {})
                # Если в истории хранятся средние баллы за топик, суммируем их
                score = sum(history.values()) if history else 0

            all_students.append({
                "id": uid,
                "name": display_name,
                "score": round(score, 1)
            })

        # Сортируем всех по убыванию баллов
        all_students.sort(key=lambda x: x['score'], reverse=True)

        # Присваиваем ранги
        for index, student in enumerate(all_students):
            student['rank'] = index + 1

        # Формируем ТОП-10
        top_10 = all_students[:10]

        # Ищем текущего юзера в полном списке
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
            "viewing": "Last PLD (Top 10)" if scope == 'last' else "Sprint Total (Top 10)",
            "columns": ["Rank", "Name", "Score"],
            "top_10": top_10,
            "user_row": current_user_row if not user_in_top_10 else None
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)