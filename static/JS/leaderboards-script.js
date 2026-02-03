const API_BASE_URL = '/api/leaderboards';
const STORAGE_KEY = 'pld_data_v1';

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

const loadLocalData = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { plds: [] };
        const parsed = JSON.parse(raw);
        return parsed && Array.isArray(parsed.plds) ? parsed : { plds: [] };
    } catch (error) {
        return { plds: [] };
    }
};

const buildLocalLeaderboard = (scope) => {
    const data = loadLocalData();
    if (!data.plds.length) return null;

    const sorted = [...data.plds].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const latest = sorted[0];

    if (scope === 'last' || scope === 'sprint') {
        if (!latest || !latest.averages) return null;
        const rows = Object.entries(latest.averages)
            .map(([name, score]) => ({ name, score: Number(score) }))
            .sort((a, b) => b.score - a.score)
            .map((entry, index) => ({ rank: index + 1, name: entry.name, score: entry.score.toFixed(1) }));

        return {
            viewing: scope === 'sprint' ? 'Sprint' : 'Last PLD',
            columns: ['Rank', 'Name', 'Score'],
            rows
        };
    }

    if (scope === 'month') {
        const totals = {};
        const counts = {};

        data.plds.forEach(pld => {
            Object.entries(pld.averages || {}).forEach(([name, score]) => {
                if (!totals[name]) totals[name] = 0;
                if (!counts[name]) counts[name] = 0;
                totals[name] += Number(score) || 0;
                counts[name] += 1;
            });
        });

        const rows = Object.keys(totals)
            .map(name => ({
                name,
                score: counts[name] ? totals[name] / counts[name] : 0
            }))
            .sort((a, b) => b.score - a.score)
            .map((entry, index) => ({ rank: index + 1, name: entry.name, score: entry.score.toFixed(1) }));

        return {
            viewing: 'Month',
            columns: ['Rank', 'Name', 'Score'],
            rows
        };
    }

    return null;
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

    const localData = buildLocalLeaderboard(scope);
    if (localData && localData.rows.length) {
        renderTable(localData);
        viewingLabel.textContent = localData.viewing || scopeLabels[scope] || defaultData.viewing;
        setStatus('');
        return;
    }

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
