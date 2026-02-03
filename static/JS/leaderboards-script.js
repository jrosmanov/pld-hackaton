document.addEventListener('DOMContentLoaded', () => {
    const viewingLabel = document.getElementById('leaderboard-viewing');
    const statusLabel = document.getElementById('leaderboard-status');
    const bodyContainer = document.getElementById('leaderboard-body');
    const buttons = document.querySelectorAll('.leaderboard-btn');

    const setStatus = (message) => {
        if (statusLabel) {
            statusLabel.textContent = message;
        }
    };

    const clearBody = () => {
        bodyContainer.innerHTML = '';
    };

    const createRowElement = (rowData) => {
        const row = document.createElement('div');
        row.className = 'leaderboard-row';
        const score = Number(rowData.score);
        row.innerHTML = `
            <span class="rank-cell">#${rowData.rank}</span>
            <span class="name-cell">${rowData.name}</span>
            <span class="score-cell">${Number.isFinite(score) ? score.toFixed(1) : rowData.score}</span>
        `;
        return row;
    };

    const renderRows = (data) => {
        clearBody();

        if (data.top_10 && data.top_10.length > 0) {
            data.top_10.forEach(row => bodyContainer.appendChild(createRowElement(row)));
        } else {
            bodyContainer.innerHTML = '<div class="leaderboard-status">No data available yet.</div>';
        }

        if (data.user_row) {
            const separator = document.createElement('div');
            separator.className = 'leaderboard-separator';
            separator.innerHTML = '<span>•••</span>';
            bodyContainer.appendChild(separator);

            const userEl = createRowElement(data.user_row);
            userEl.classList.add('current-user-highlight');
            bodyContainer.appendChild(userEl);
        }
    };

    const loadLeaderboard = async (scope) => {
        viewingLabel.textContent = 'Loading...';
        setStatus('Fetching data from server...');

        try {
            const response = await fetch(`/api/leaderboards?scope=${scope}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Server error: ${response.status}`);
            }

            viewingLabel.textContent = data.viewing || 'Leaderboard';
            setStatus('');
            renderRows(data);
        } catch (error) {
            viewingLabel.textContent = 'Error';
            bodyContainer.innerHTML = `
                <div class="leaderboard-status" style="color: var(--hbtn-red);">
                    Failed to load leaderboard. Please try again later.
                </div>`;
        }
    };

    const setActive = (scope) => {
        buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.scope === scope));
    };

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const scope = btn.getAttribute('data-scope');
            setActive(scope);
            loadLeaderboard(scope);
        });
    });

    setActive('last');
    loadLeaderboard('last');
});
