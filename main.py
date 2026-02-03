from flask import Flask, request, jsonify, render_template, session, redirect, url_for
from flask_cors import CORS
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

if __name__ == '__main__':
    app.run(debug=True, port=5000)