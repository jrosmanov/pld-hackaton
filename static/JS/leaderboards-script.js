const API_BASE_URL = '/api/leaderboards';

const buttons = document.querySelectorAll('.leaderboard-btn');
const viewingLabel = document.getElementById('leaderboard-viewing');
const statusLabel = document.getElementById('leaderboard-status');
const columnsRow = document.getElementById('leaderboard-columns');
const bodyContainer = document.getElementById('leaderboard-body');

const fallbackData = {
    last: {
        viewing: 'Last PLD',
        columns: ['Rank', 'Name', 'Score'],
        rows: [
            { rank: 1, name: 'Aliyev Anar', score: 950 },
            { rank: 2, name: 'Memmedov Samir', score: 880 },
            { rank: 3, name: 'Hesenova Leyla', score: 720 }
        ]
    },
    month: {
        viewing: 'Month',
        columns: ['Rank', 'Name', 'Score'],
        rows: [
            { rank: 1, name: 'Khalilova Aysel', score: 1840 },
            { rank: 2, name: 'Aliyev Anar', score: 1765 },
            { rank: 3, name: 'Ismayilov Elvin', score: 1620 }
        ]
    },
    sprint: {
        viewing: 'Sprint',
        columns: ['Rank', 'Name', 'Score'],
        rows: [
            { rank: 1, name: 'Mammadova Nigar', score: 620 },
            { rank: 2, name: 'Huseynov Orkhan', score: 580 },
            { rank: 3, name: 'Hasanova Leila', score: 540 }
        ]
    }
};

const scopeLabels = {
    last: 'Last PLD',
    month: 'Month',
    sprint: 'Sprint'
};

const setStatus = (message) => {
    if (!statusLabel) return;
    statusLabel.textContent = message;
};

const setActiveButton = (scope) => {
    buttons.forEach(button => {
        const isActive = button.getAttribute('data-scope') === scope;
        button.classList.toggle('active', isActive);
    });
};

const renderTable = (data) => {
    if (!data || !Array.isArray(data.columns) || !Array.isArray(data.rows)) {
        return;
    }

    columnsRow.innerHTML = '';
    data.columns.forEach(column => {
        const span = document.createElement('span');
        span.textContent = column;
        columnsRow.appendChild(span);
    });

    bodyContainer.innerHTML = '';
    data.rows.forEach(row => {
        const rowElement = document.createElement('div');
        rowElement.className = 'leaderboard-row';

        const rank = document.createElement('span');
        rank.textContent = row.rank ?? '-';

        const name = document.createElement('span');
        name.textContent = row.name ?? '-';

        const score = document.createElement('span');
        score.textContent = row.score ?? '-';

        rowElement.append(rank, name, score);
        bodyContainer.appendChild(rowElement);
    });
};

const loadLeaderboard = async (scope) => {
    const defaultData = fallbackData[scope] || fallbackData.last;
    setStatus('Loading...');
    viewingLabel.textContent = scopeLabels[scope] || defaultData.viewing;

    try {
        const response = await fetch(`${API_BASE_URL}?scope=${encodeURIComponent(scope)}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Request failed');
        }

        const data = await response.json();
        if (!data || !Array.isArray(data.columns) || !Array.isArray(data.rows)) {
            throw new Error('Invalid payload');
        }

        renderTable(data);
        viewingLabel.textContent = data.viewing || scopeLabels[scope] || defaultData.viewing;
        setStatus('');
    } catch (error) {
        renderTable(defaultData);
        setStatus('Using fallback data');
    }
};

buttons.forEach(button => {
    button.addEventListener('click', () => {
        const scope = button.getAttribute('data-scope') || 'last';
        setActiveButton(scope);
        loadLeaderboard(scope);
    });
});

window.addEventListener('load', () => {
    setActiveButton('last');
    loadLeaderboard('last');
});
