const STORAGE_KEY = 'pld_data_v1';

if (localStorage.getItem('userRole') !== 'mentor') {
    window.location.href = 'login.html';
}

const form = document.getElementById('pld-form');
const topicInput = document.getElementById('pld-topic');
const addSubtopicBtn = document.getElementById('add-subtopic');
const addStudentBtn = document.getElementById('add-student');
const subtopicsList = document.getElementById('subtopics-list');
const studentsList = document.getElementById('students-list');
const scoresGrid = document.getElementById('scores-grid');
const overallAverageEl = document.getElementById('overall-average');
const statusEl = document.getElementById('pld-status');

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

const saveData = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const createListItem = (placeholder, listEl) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'pld-item';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'pld-remove';
    removeBtn.textContent = 'Remove';

    removeBtn.addEventListener('click', () => {
        wrapper.remove();
        rebuildGrid();
    });

    input.addEventListener('input', rebuildGrid);

    wrapper.appendChild(input);
    wrapper.appendChild(removeBtn);
    listEl.appendChild(wrapper);
};

const getListValues = (listEl) => {
    return Array.from(listEl.querySelectorAll('input'))
        .map(input => input.value.trim())
        .filter(Boolean);
};

const getCurrentScores = () => {
    const scores = {};
    scoresGrid.querySelectorAll('input[data-student][data-subtopic]').forEach(input => {
        const student = input.getAttribute('data-student');
        const subtopic = input.getAttribute('data-subtopic');
        const value = parseFloat(input.value);
        if (!scores[student]) scores[student] = {};
        scores[student][subtopic] = Number.isFinite(value) ? value : 0;
    });
    return scores;
};

const clampScore = (value) => {
    if (!Number.isFinite(value)) return 0;
    return Math.min(10, Math.max(0, value));
};

const updateAverages = () => {
    const students = getListValues(studentsList);
    const subtopics = getListValues(subtopicsList);
    const scores = getCurrentScores();
    let total = 0;
    let count = 0;

    students.forEach(student => {
        let sum = 0;
        subtopics.forEach(subtopic => {
            const score = scores[student]?.[subtopic] ?? 0;
            sum += score;
        });
        const avg = subtopics.length ? sum / subtopics.length : 0;
        const avgEl = scoresGrid.querySelector(`[data-avg="${student}"]`);
        if (avgEl) {
            avgEl.textContent = avg.toFixed(1);
        }
        total += avg;
        count += 1;
    });

    const overall = count ? total / count : 0;
    overallAverageEl.textContent = overall.toFixed(1);
};

const rebuildGrid = () => {
    const students = getListValues(studentsList);
    const subtopics = getListValues(subtopicsList);
    const existingScores = getCurrentScores();

    scoresGrid.innerHTML = '';

    if (!students.length || !subtopics.length) {
        return;
    }

    const columnCount = 2 + subtopics.length;
    const gridTemplate = `minmax(140px, 1.5fr) repeat(${subtopics.length}, minmax(80px, 1fr)) minmax(80px, 1fr)`;

    const headerRow = document.createElement('div');
    headerRow.className = 'scores-row header';
    headerRow.style.gridTemplateColumns = gridTemplate;

    const headerStudent = document.createElement('div');
    headerStudent.className = 'scores-cell';
    headerStudent.textContent = 'Student';
    headerRow.appendChild(headerStudent);

    subtopics.forEach(subtopic => {
        const cell = document.createElement('div');
        cell.className = 'scores-cell';
        cell.textContent = subtopic;
        headerRow.appendChild(cell);
    });

    const headerAvg = document.createElement('div');
    headerAvg.className = 'scores-cell';
    headerAvg.textContent = 'Avg';
    headerRow.appendChild(headerAvg);

    scoresGrid.appendChild(headerRow);

    students.forEach(student => {
        const row = document.createElement('div');
        row.className = 'scores-row';
        row.style.gridTemplateColumns = gridTemplate;

        const nameCell = document.createElement('div');
        nameCell.className = 'scores-cell';
        nameCell.textContent = student;
        row.appendChild(nameCell);

        subtopics.forEach(subtopic => {
            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.max = '10';
            input.step = '1';
            input.className = 'scores-input';
            input.setAttribute('data-student', student);
            input.setAttribute('data-subtopic', subtopic);
            const existing = existingScores[student]?.[subtopic];
            if (Number.isFinite(existing)) {
                input.value = existing;
            }

            input.addEventListener('input', () => {
                const value = clampScore(parseFloat(input.value));
                input.value = value;
                updateAverages();
            });

            row.appendChild(input);
        });

        const avgCell = document.createElement('div');
        avgCell.className = 'scores-cell';
        avgCell.setAttribute('data-avg', student);
        avgCell.textContent = '0.0';
        row.appendChild(avgCell);

        scoresGrid.appendChild(row);
    });

    updateAverages();
};

addSubtopicBtn.addEventListener('click', () => {
    createListItem('Subtopic name', subtopicsList);
    rebuildGrid();
});

addStudentBtn.addEventListener('click', () => {
    createListItem('Student name', studentsList);
    rebuildGrid();
});

form.addEventListener('submit', (event) => {
    event.preventDefault();
    statusEl.textContent = '';

    const topic = topicInput.value.trim();
    const subtopics = getListValues(subtopicsList);
    const students = getListValues(studentsList);

    if (!topic) {
        statusEl.textContent = 'Please enter a PLD topic name.';
        return;
    }
    if (!subtopics.length) {
        statusEl.textContent = 'Please add at least one subtopic.';
        return;
    }
    if (!students.length) {
        statusEl.textContent = 'Please add at least one student.';
        return;
    }

    const scores = getCurrentScores();
    const averages = {};

    students.forEach(student => {
        let sum = 0;
        subtopics.forEach(subtopic => {
            const value = clampScore(parseFloat(scores[student]?.[subtopic] ?? 0));
            if (!scores[student]) scores[student] = {};
            scores[student][subtopic] = value;
            sum += value;
        });
        averages[student] = subtopics.length ? sum / subtopics.length : 0;
    });

    const now = new Date();
    const record = {
        id: `pld_${now.toISOString()}`,
        topic,
        subtopics,
        students,
        scores,
        averages,
        createdAt: now.toISOString()
    };

    const data = loadData();
    data.plds.push(record);
    saveData(data);

    statusEl.textContent = 'PLD saved successfully.';
});

createListItem('Subtopic name', subtopicsList);
createListItem('Student name', studentsList);
rebuildGrid();
