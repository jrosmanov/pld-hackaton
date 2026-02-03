/**
 * Holberton PLD | Leaderboard Script
 * Управляет логикой отображения рейтинга студентов
 */

const viewingLabel = document.getElementById('leaderboard-viewing');
const bodyContainer = document.getElementById('leaderboard-body');
const buttons = document.querySelectorAll('.leaderboard-btn');

/**
 * Загружает данные лидерборда с сервера
 * @param {string} scope - 'last' (последний PLD) или 'sprint' (общий зачет)
 */
async function loadLeaderboard(scope) {
    // Визуальный фидбек во время загрузки
    viewingLabel.textContent = "Loading...";
    bodyContainer.innerHTML = '<div class="leaderboard-status">Fetching data from server...</div>';

    try {
        // Делаем запрос к нашему API в Python
        const response = await fetch(`/api/leaderboards?scope=${scope}`);

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        // Обновляем заголовок (Last PLD или Sprint)
        viewingLabel.textContent = data.viewing;

        // Очищаем контейнер перед отрисовкой
        bodyContainer.innerHTML = '';

        // 1. Рендерим ТОП-10 студентов
        if (data.top_10 && data.top_10.length > 0) {
            data.top_10.forEach(row => {
                const rowEl = createRowElement(row);
                bodyContainer.appendChild(rowEl);
            });
        } else {
            bodyContainer.innerHTML = '<div class="leaderboard-status">No data available yet.</div>';
        }

        // 2. Рендерим текущего пользователя, если его нет в ТОП-10
        if (data.user_row) {
            // Добавляем визуальный разделитель (три точки)
            const separator = document.createElement('div');
            separator.className = 'leaderboard-separator';
            separator.innerHTML = '<span>•••</span>';
            bodyContainer.appendChild(separator);

            // Добавляем строку юзера с особым классом для подсветки
            const userEl = createRowElement(data.user_row);
            userEl.classList.add('current-user-highlight');
            bodyContainer.appendChild(userEl);
        }

    } catch (error) {
        console.error("Leaderboard Error:", error);
        viewingLabel.textContent = "Error";
        bodyContainer.innerHTML = `
            <div class="leaderboard-status" style="color: var(--hbtn-red);">
                Failed to load leaderboard. Please try again later.
            </div>`;
    }
}

/**
 * Создает HTML-элемент строки таблицы
 * @param {Object} rowData - объект с rank, name и score
 */
function createRowElement(rowData) {
    const row = document.createElement('div');
    row.className = 'leaderboard-row';

    // Используем innerHTML для быстрой вставки структуры
    row.innerHTML = `
        <span class="rank-cell">#${rowData.rank}</span>
        <span class="name-cell">${rowData.name}</span>
        <span class="score-cell">${rowData.score} pts</span>
    `;

    return row;
}

/**
 * Обработка переключения вкладок
 */
buttons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Если кнопка уже активна — ничего не делаем
        if (btn.classList.contains('active')) return;

        // Переключаем визуальный статус кнопок
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Загружаем соответствующие данные
        const scope = btn.getAttribute('data-scope');
        loadLeaderboard(scope);
    });
});

/**
 * Инициализация страницы при загрузке
 */
document.addEventListener('DOMContentLoaded', () => {
    // По умолчанию загружаем Last PLD
    loadLeaderboard('last');
});