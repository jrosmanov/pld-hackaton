document.addEventListener('DOMContentLoaded', () => {
    // 1. Проверка роли
    if (localStorage.getItem('userRole') !== 'student') {
        window.location.href = '/';
        return;
    }

    // 2. Элементы интерфейса
    // Теперь ищем именно student-view, который есть в HTML
    const contentArea = document.getElementById('student-view');
    const actionButtons = document.querySelectorAll('.action-btn');

    // 3. Функция загрузки Last PLD
    async function loadLastPLD() {
        if (!contentArea) return;
        contentArea.innerHTML = '<p style="color: var(--text-gray); text-align: center;">Loading data...</p>';

        try {
            const response = await fetch('/api/get_last_pld');
            const data = await response.json();

            if (data.error) {
                contentArea.innerHTML = `<p style="color: var(--hbtn-red); text-align: center;">${data.error}</p>`;
                return;
            }

            const entries = Object.entries(data.grades);
            const amount = entries.length;
            const avg = (Object.values(data.grades).reduce((a, b) => a + b, 0) / amount).toFixed(1);

            contentArea.innerHTML = `
                <div class="pld-report" style="animation: fadeIn 0.4s ease;">
                    <div style="border-left: 4px solid var(--hbtn-red); padding-left: 15px; margin-bottom: 20px;">
                        <span style="color: var(--text-gray); font-size: 0.8rem; text-transform: uppercase;">Topic</span><br>
                        <strong style="font-size: 1.3rem; color: white;">${data.topic}</strong>
                    </div>
                    <div class="questions-list">
                        ${entries.map(([q, g]) => `
                            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <span style="color: var(--text-gray);">• ${q}</span>
                                <span style="color: var(--hbtn-red); font-weight: bold;">${g}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div style="display: flex; justify-content: space-between; background: rgba(0,0,0,0.25); padding: 15px; border-radius: 8px; margin-top: 20px;">
                        <span>Questions: <strong>${amount}</strong></span>
                        <span>Average: <strong style="color: var(--hbtn-red);">${avg}</strong></span>
                    </div>
                </div>`;
        } catch (e) {
            contentArea.innerHTML = '<p style="color: var(--hbtn-red); text-align: center;">Connection error</p>';
        }
    }

    // 4. Функция загрузки All PLD
    async function loadAllPLD() {
        if (!contentArea) return;
        contentArea.innerHTML = '<p style="color: var(--text-gray); text-align: center;">Loading archives...</p>';

        try {
            const response = await fetch('/api/get_all_pld');
            const historyData = await response.json();
            const entries = Object.entries(historyData);

            if (entries.length === 0) {
                contentArea.innerHTML = '<p style="color: var(--text-gray); text-align: center;">No history found.</p>';
                return;
            }

            const amount = entries.length;
            const totalAvg = (Object.values(historyData).reduce((a, b) => a + b, 0) / amount).toFixed(1);

            contentArea.innerHTML = `
                <div class="all-pld-report" style="animation: fadeIn 0.4s ease;">
                    <div style="margin-bottom: 15px; color: var(--text-gray); font-size: 0.9rem;">
                        Amount of PLDs: <strong style="color: white;">${amount}</strong>
                        <span style="margin-left: 10px;">(AVG Score: <strong style="color: var(--hbtn-red);">${totalAvg}</strong>)</span>
                    </div>
                    <div style="height: 1px; background: linear-gradient(to right, var(--hbtn-red), transparent); margin-bottom: 20px;"></div>
                    <div class="history-list">
                        ${entries.map(([topic, score]) => `
                            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <span style="color: var(--text-white);">${topic}</span>
                                <strong style="color: var(--hbtn-red);">${score}</strong>
                            </div>
                        `).join('')}
                    </div>
                </div>`;
        } catch (e) {
            contentArea.innerHTML = '<p style="color: var(--hbtn-red); text-align: center;">Error loading history</p>';
        }
    }

    // 5. Обработчики кнопок
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            actionButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const action = this.getAttribute('data-action');
            if (action === 'last') loadLastPLD();
            else if (action === 'all') loadAllPLD();
        });
    });

    // 6. Инициализация (авто-клик на Last PLD)
    const defaultBtn = document.querySelector('[data-action="last"]');
    if (defaultBtn) {
        defaultBtn.classList.add('active');
        loadLastPLD();
    }
});