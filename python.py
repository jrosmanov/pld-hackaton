from flask import Flask, request, jsonify, render_template, session, redirect, url_for
from flask_cors import CORS

app = Flask(__name__)
app.secret_key = 'its-really-secret-key'

# Включаем поддержку кук для сессий
CORS(app, supports_credentials=True)

# Имитация базы данных (ключ — это ID из почты)
users = {
    '12734': {"email": "12734@hbtn.com", "password": "123", "role": "student"},
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


if __name__ == '__main__':
    app.run(debug=True, port=5000)