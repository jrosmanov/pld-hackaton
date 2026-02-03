document.addEventListener('DOMContentLoaded', () => {
    // 1. Проверка авторизации
    if (localStorage.getItem('userRole') !== 'student') {
        window.location.href = '/';
        return;
    }

    // 2. Настройка кнопок ролей (скрываем ментора для студента)
    const roleButtons = document.querySelectorAll('.role-btn');
    roleButtons.forEach(button => {
        const role = button.getAttribute('data-role');
        if (role === 'mentor') {
            button.style.display = 'none';
        } else if (role === 'student') {
            button.disabled = true;
            button.style.cursor = 'not-allowed';
            button.style.opacity = '1';
        }
    });

    const contentArea = document.getElementById('button-text').parentElement;
    const actionButtons = document.querySelectorAll('.action-btn');

    // Функция отрисовки LAST PLD
    async function loadLastPLD() {
        contentArea.innerHTML = '<p style="color: var(--text-gray);">Loading data from server...</p>';
        try {
            const response = await fetch('/api/get_last_pld');
            const data = await response.json();

            if (data.error) {
                contentArea.innerHTML = `<p style="color: var(--hbtn-red);">${data.error}</p>`;
                return;
            }

            const entries = Object.entries(data.grades);
            const amount = entries.length;
            const avg = (Object.values(data.grades).reduce((a, b) => a + b, 0) / amount).toFixed(1);

            contentArea.innerHTML = `
                <div class="pld-report" style="width: 100%; text-align: left; animation: fadeIn 0.4s ease;">
                    <div style="border-left: 4px solid var(--hbtn-red); padding-left: 15px; margin-bottom: 20px;">
                        <span style="color: var(--text-gray); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">Topic</span><br>
                        <strong style="font-size: 1.3rem; color: white;">${data.topic}</strong>
                    </div>
                    <div style="height: 1px; background: linear-gradient(to right, var(--hbtn-red), transparent); margin: 20px 0;"></div>
                    <div class="questions-list" style="margin-bottom: 20px;">
                        ${entries.map(([q, g]) => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <span style="color: var(--text-gray); font-size: 0.95rem; padding-right: 20px;">• ${q}</span>
                                <span style="color: var(--hbtn-red); font-weight: bold; border: 1px solid var(--hbtn-red); padding: 2px 10px; border-radius: 4px; min-width: 30px; text-align: center;">${g}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div style="height: 1px; background: linear-gradient(to right, var(--hbtn-red), transparent); margin: 20px 0;"></div>
                    <div style="display: flex; justify-content: space-between; background: rgba(0,0,0,0.25); padding: 15px; border-radius: 8px; font-size: 0.9rem;">
                        <span>Questions: <strong style="color: white;">${amount}</strong></span>
                        <span>Average Score: <strong style="color: var(--hbtn-red); font-size: 1.1rem;">${avg}</strong></span>
                    </div>
                </div>
            `;
        } catch (error) {
            contentArea.innerHTML = '<p style="color: var(--hbtn-red);">Connection Error.</p>';
        }
    }

    // Функция отрисовки ALL PLD (История)
    async function loadAllPLD() {
        contentArea.innerHTML = '<p style="color: var(--text-gray);">Accessing archives...</p>';
        try {
            const response = await fetch('/api/get_all_pld');
            const historyData = await response.json();

            const entries = Object.entries(historyData);
            if (entries.length === 0) {
                contentArea.innerHTML = '<p>No history records found.</p>';
                return;
            }

            const amount = entries.length;
            const totalSum = Object.values(historyData).reduce((a, b) => a + b, 0);
            const totalAvg = (totalSum / amount).toFixed(1);

            contentArea.innerHTML = `
                <div class="all-pld-report" style="width: 100%; text-align: left; animation: fadeIn 0.4s ease;">
                    <div style="margin-bottom: 10px; font-size: 0.95rem; color: var(--text-gray);">
                        Amount of PLDs: <strong style="color: white;">${amount}</strong>
                        <span style="margin-left: 8px; opacity: 0.8;">(AVG Score: <strong style="color: var(--hbtn-red);">${totalAvg}</strong>)</span>
                    </div>
                    <div style="height: 1px; background: linear-gradient(to right, var(--hbtn-red), transparent); margin-bottom: 20px;"></div>
                    <div class="history-list">
                        ${entries.map(([topic, score]) => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <span style="color: var(--text-white); font-size: 1rem;">${topic}</span>
                                <span style="color: var(--hbtn-red); font-weight: bold; font-family: monospace; font-size: 1.1rem;">${score}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } catch (error) {
            contentArea.innerHTML = '<p style="color: var(--hbtn-red);">Failed to load history.</p>';
        }
    }

    // 3. Обработка кликов по кнопкам
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            actionButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const action = this.getAttribute('data-action');
            if (action === 'last') {
                loadLastPLD();
            } else if (action === 'all') {
                loadAllPLD();
            }
        });
    });

    // 4. Авто-запуск при входе
    const defaultBtn = document.querySelector('[data-action="last"]');
    if (defaultBtn) {
        defaultBtn.classList.add('active');
        loadLastPLD();
    }
});