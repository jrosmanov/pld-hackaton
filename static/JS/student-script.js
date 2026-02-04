document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('userRole') !== 'student') {
        window.location.href = '/';
        return;
    }

    const contentArea = document.getElementById('student-view');
    const actionButtons = document.querySelectorAll('.action-btn');
    const logoutBtn = document.getElementById('logout-btn');

    const renderMessage = (message, isError = false) => {
        contentArea.innerHTML = `<p style="color: ${isError ? 'var(--hbtn-red)' : 'var(--text-gray)'}; text-align: center;">${message}</p>`;
    };

    const formatDate = (value) => {
        if (!value) return '—';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleDateString();
    };

    async function loadLastPLD() {
        renderMessage('Loading data...');
        try {
            const response = await fetch('/api/get_last_pld');
            const data = await response.json();
            if (!response.ok || data.error) {
                renderMessage(data.error || 'No PLD data found.', true);
                return;
            }

            const grades = data.grades || {};
            const entries = Object.entries(grades);
            const amount = entries.length;
            const avg = data.avg !== undefined
                ? Number(data.avg).toFixed(1)
                : (amount ? (Object.values(grades).reduce((a, b) => a + b, 0) / amount).toFixed(1) : '0.0');

            const commentSection = data.comment
                ? `<div style="margin-top: 18px; padding: 14px; border-radius: 8px; background: rgba(255,255,255,0.04); color: var(--text-gray);">
                        <strong style="color: white; display: block; margin-bottom: 6px;">Mentor Comment</strong>
                        <span>${data.comment}</span>
                   </div>`
                : '';

            contentArea.innerHTML = `
                <div class="pld-report" style="animation: fadeIn 0.4s ease;">
                    <div style="border-left: 4px solid var(--hbtn-red); padding-left: 15px; margin-bottom: 20px;">
                        <span style="color: var(--text-gray); font-size: 0.8rem; text-transform: uppercase;">Topic</span><br>
                        <strong style="font-size: 1.3rem; color: white;">${data.topic || 'Untitled PLD'}</strong>
                        <div style="color: var(--text-gray); font-size: 0.85rem; margin-top: 6px;">Date: ${formatDate(data.date)}</div>
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
                    ${commentSection}
                </div>`;
        } catch (error) {
            renderMessage('Connection error', true);
        }
    }

    async function loadAllPLD() {
        renderMessage('Loading archives...');
        try {
            const response = await fetch('/api/get_all_pld');
            const historyData = await response.json();

            if (!response.ok || historyData.error) {
                renderMessage(historyData.error || 'No history found.', true);
                return;
            }

            let entries = [];
            if (Array.isArray(historyData)) {
                entries = historyData;
            } else if (historyData && typeof historyData === 'object') {
                entries = Object.entries(historyData).map(([topic, avg]) => ({
                    topic,
                    avg,
                    date: null
                }));
            }

            if (entries.length === 0) {
                renderMessage('No history found.');
                return;
            }

            const totalAvg = (entries.reduce((sum, item) => sum + (parseFloat(item.avg) || 0), 0) / entries.length).toFixed(1);

            contentArea.innerHTML = `
                <div class="all-pld-report" style="animation: fadeIn 0.4s ease;">
                    <div style="margin-bottom: 15px; color: var(--text-gray); font-size: 0.9rem;">
                        Amount of PLDs: <strong style="color: white;">${entries.length}</strong>
                        <span style="margin-left: 10px;">(AVG Score: <strong style="color: var(--hbtn-red);">${totalAvg}</strong>)</span>
                    </div>
                    <div style="height: 1px; background: linear-gradient(to right, var(--hbtn-red), transparent); margin-bottom: 20px;"></div>
                    <div class="history-list">
                        ${entries.map((item, index) => `
                            <button class="history-item" data-index="${index}" type="button">
                                <span class="history-topic">${item.topic}</span>
                                <span class="history-date">${formatDate(item.date)}</span>
                                <strong class="history-avg">${Number(item.avg).toFixed(1)}</strong>
                            </button>
                            <div class="history-details" data-detail="${index}">
                                <div class="history-subtopics">
                                    ${(item.grades && Object.keys(item.grades).length)
                                        ? Object.entries(item.grades).map(([q, g]) => `
                                            <div class="history-subtopic">
                                                <span>${q}</span>
                                                <strong>${g}</strong>
                                            </div>
                                        `).join('')
                                        : '<div class="history-empty">No subtopic scores available.</div>'
                                    }
                                </div>
                                ${item.comment ? `
                                    <div class="history-comment">
                                        <strong>Mentor Comment</strong>
                                        <span>${item.comment}</span>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>`;

            contentArea.querySelectorAll('.history-item').forEach(button => {
                button.addEventListener('click', () => {
                    const index = button.dataset.index;
                    const details = contentArea.querySelector(`.history-details[data-detail="${index}"]`);
                    if (!details) return;
                    const isOpen = details.classList.contains('open');
                    contentArea.querySelectorAll('.history-details').forEach(panel => panel.classList.remove('open'));
                    if (!isOpen) {
                        details.classList.add('open');
                    }
                });
            });
        } catch (error) {
            renderMessage('Error loading history', true);
        }
    }

    actionButtons.forEach(button => {
        button.addEventListener('click', () => {
            actionButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const action = button.getAttribute('data-action');
            if (action === 'last') loadLastPLD();
            if (action === 'all') loadAllPLD();
        });
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch('/logout', { method: 'GET', credentials: 'include' });
            } finally {
                localStorage.removeItem('userRole');
                window.location.href = '/login';
            }
        });
    }

    const defaultBtn = document.querySelector('[data-action="last"]');
    if (defaultBtn) {
        defaultBtn.classList.add('active');
        loadLastPLD();
    }
});
