from flask import Flask, render_template

app = Flask(__name__)

# Əsas Giriş Səhifəsi
@app.route('/')
def index():
    return render_template('index.html')

# Student Login Səhifəsi (Nümunə keçid)
@app.route('/login/student')
def student_login():
    return "<h1>Student Login Səhifəsi Hazırlanır...</h1>"

# Mentor Login Səhifəsi (Nümunə keçid)
@app.route('/login/mentor')
def mentor_login():
    return "<h1>Mentor Login Səhifəsi Hazırlanır...</h1>"

if __name__ == '__main__':
    # debug=True sayəsində kodu dəyişdikdə sayt avtomatik yenilənir
    app.run(debug=True)