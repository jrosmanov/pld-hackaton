document.addEventListener('DOMContentLoaded', () => {
    // --- ЭЛЕМЕНТЫ ИНТЕРФЕЙСА ---
    const welcomeSplash = document.querySelector('.welcome-splash');
    const loginCard = document.querySelector('.login-card');
    const roleButtons = document.querySelectorAll('.role-btn');
    const currentRoleElement = document.getElementById('current-role');
    const loginForm = document.getElementById('login-form');

    let selectedRole = 'student'; // Роль по умолчанию

    // --- 1. АНИМАЦИЯ ПРИ ЗАГРУЗКЕ (SPLASH SCREEN) ---
    // Показываем заставку 2 секунды, затем переключаемся на карточку логина
    setTimeout(() => {
        if (welcomeSplash) {
            welcomeSplash.classList.add('fade-out');
        }
        if (loginCard) {
            loginCard.classList.add('fade-in');
        }

        // Полностью удаляем splash из DOM через 0.6 сек (время анимации)
        setTimeout(() => {
            if (welcomeSplash) welcomeSplash.style.display = 'none';
        }, 600);
    }, 2000);

    // --- 2. ПЕРЕКЛЮЧЕНИЕ РОЛЕЙ (STUDENT / MENTOR) ---
    roleButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Убираем активный класс у всех и даем нажатой кнопке
            roleButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Обновляем переменную и текст на экране
            selectedRole = this.getAttribute('data-role');
            if (currentRoleElement) {
                currentRoleElement.textContent = selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1);
            }
        });
    });

    // --- 3. ОТПРАВКА ДАННЫХ НА FLASK (REST API) ---
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Останавливаем обычную перезагрузку страницы

            // Собираем данные из полей ввода
            const email = loginForm.querySelector('input[type="email"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;

            // Отправляем POST запрос на твой Flask сервер
            fetch('http://127.0.0.1:5000/login', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    role: selectedRole
                })
            })
            .then(response => {
                if (!response.ok) {
                    // Если статус не 200 (например 401 ошибка доступа)
                    throw new Error('The wrong Password, Email either Role');
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    // Сохраняем роль в браузере (чтобы использовать на других страницах)
                    localStorage.setItem('userRole', data.role);

                    // Редирект на страницу соответствующей роли
                    // Flask должен уметь отдавать эти страницы
                    window.location.href = window.location.origin + '/' + data.role + '.html';
                }
            })
            .catch(error => {
                console.error('Ошибка авторизации:', error);
                alert(error.message || 'Ошибка соединения с сервером');
            });
        });
    }
});