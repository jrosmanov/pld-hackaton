const STORAGE_KEY = 'pld_data_v1';

if (localStorage.getItem('userRole') !== 'student') {
    window.location.href = 'login.html';
}

const actionButtons = document.querySelectorAll('.action-btn');
const studentView = document.getElementById('student-view');

const loadData = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { plds: [] };
        const parsed = JSON.parse(raw);
        return parsed && Array.isArray(parsed.plds) ? parsed : { plds: [] };
    } catch (error) {
        return { plds: [] };
    }
};

const getStudentName = () => {
    const existing = localStorage.getItem('student_name');
    if (existing) return existing;
    const name = window.prompt('Enter your full name to view your PLD scores:');
    if (name && name.trim()) {
        localStorage.setItem('student_name', name.trim());
        return name.trim();
    }
    return '';
};

const renderEmpty = (message) => {
    studentView.innerHTML = `<div class="student-empty">${message}</div>`;
};

const renderLastPld = (studentName) => {
    const data = loadData();
    if (!data.plds.length) {
        renderEmpty('No PLD data has been entered yet.');
        return;
    }

    const latest = [...data.plds].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    const scores = latest.scores?.[studentName];
    const avg = latest.averages?.[studentName];

    if (!scores) {
        renderEmpty('No PLD scores found for your name.');
        return;
    }

    const subtopicsHtml = latest.subtopics.map(subtopic => {
        const value = scores[subtopic] ?? 0;
        return `<div class="student-subtopic"><span>${subtopic}</span><strong>${value}</strong></div>`;
    }).join('');

    studentView.innerHTML = `
        <div class="student-card">
            <h3 class="student-title">${latest.topic} — Last PLD</h3>
            <div class="student-subtopic"><span>Overall Average</span><strong>${(avg ?? 0).toFixed(1)}</strong></div>
            ${subtopicsHtml}
        </div>
    `;
};

const renderAllPlds = (studentName) => {
    const data = loadData();
    if (!data.plds.length) {
        renderEmpty('No PLD data has been entered yet.');
        return;
    }

    const rows = data.plds
        .filter(pld => pld.averages && pld.averages[studentName] !== undefined)
        .map(pld => `
            <tr>
                <td>${pld.topic}</td>
                <td>${new Date(pld.createdAt).toLocaleDateString()}</td>
                <td>${(pld.averages[studentName] ?? 0).toFixed(1)}</td>
            </tr>
        `)
        .join('');

    if (!rows) {
        renderEmpty('No PLD scores found for your name.');
        return;
    }

    studentView.innerHTML = `
        <div class="student-card">
            <h3 class="student-title">All PLD Averages</h3>
            <table class="student-table">
                <thead>
                    <tr>
                        <th>Topic</th>
                        <th>Date</th>
                        <th>Avg Score</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
};

const setActiveButton = (action) => {
    actionButtons.forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-action') === action));
};

const handleAction = (action) => {
    const studentName = getStudentName();
    if (!studentName) {
        renderEmpty('Student name is required to show your scores.');
        return;
    }
    if (action === 'all') {
        renderAllPlds(studentName);
    } else {
        renderLastPld(studentName);
    }
};

actionButtons.forEach(button => {
    button.addEventListener('click', () => {
        const action = button.getAttribute('data-action');
        setActiveButton(action);
        handleAction(action);
    });
});

window.addEventListener('load', () => {
    setActiveButton('last');
    handleAction('last');
});
