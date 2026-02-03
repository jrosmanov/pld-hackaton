document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('userRole') !== 'mentor') {
        window.location.href = '/';
        return;
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
    const summaryEl = document.getElementById('pld-summary');
    const resetBtn = document.getElementById('reset-form');
    const clearLastBtn = document.getElementById('clear-last');
    const logoutBtn = document.getElementById('logout-btn');

    let studentOptions = [];

    const setStatus = (message, isError = false) => {
        statusEl.textContent = message;
        statusEl.style.color = isError ? 'var(--hbtn-red)' : 'var(--text-gray)';
    };

    const setSummary = (message) => {
        summaryEl.textContent = message;
    };

    const clampScore = (value) => Math.min(10, Math.max(0, value));

    const fillStudentSelect = (select, selectedId = '') => {
        select.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = '-- Select Student --';
        placeholder.disabled = true;
        placeholder.selected = !selectedId;
        select.appendChild(placeholder);

        studentOptions.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option.id;
            opt.textContent = `${option.name} (${option.id})`;
            if (option.id === selectedId) {
                opt.selected = true;
            }
            select.appendChild(opt);
        });
    };

    const fetchStudents = async () => {
        try {
            const res = await fetch('/api/get_students_list');
            const data = await res.json();
            studentOptions = Array.isArray(data) ? data : [];
            if (studentOptions.length === 0) {
                setStatus('No students found in database.', true);
            }
            studentsList.querySelectorAll('select').forEach(select => {
                fillStudentSelect(select, select.value);
            });
            refreshStudentOptions();
            rebuildGrid();
        } catch (error) {
            setStatus('Failed to load students list.', true);
        }
    };

    const addSubtopicRow = (value = '') => {
        const wrapper = document.createElement('div');
        wrapper.className = 'pld-item';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Question or Subtopic';
        input.className = 'subtopic-input';
        input.value = value;
        input.required = true;

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'pld-remove';
        remove.textContent = 'Remove';
        remove.addEventListener('click', () => {
            wrapper.remove();
            rebuildGrid();
        });

        input.addEventListener('input', rebuildGrid);

        wrapper.appendChild(input);
        wrapper.appendChild(remove);
        subtopicsList.appendChild(wrapper);
    };

    const addStudentRow = (selectedId = '') => {
        const wrapper = document.createElement('div');
        wrapper.className = 'pld-item';

        const select = document.createElement('select');
        select.className = 'student-select';
        select.required = true;
        fillStudentSelect(select, selectedId);

        select.addEventListener('change', () => {
            refreshStudentOptions();
            rebuildGrid();
        });

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'pld-remove';
        remove.textContent = 'Remove';
        remove.addEventListener('click', () => {
            wrapper.remove();
            refreshStudentOptions();
            rebuildGrid();
        });

        wrapper.appendChild(select);
        wrapper.appendChild(remove);
        studentsList.appendChild(wrapper);
    };

    const getSubtopics = () => Array.from(subtopicsList.querySelectorAll('.subtopic-input'))
        .map(input => input.value.trim())
        .filter(Boolean);

    const getSelectedStudents = () => Array.from(studentsList.querySelectorAll('select'))
        .map(select => {
            const id = select.value;
            const option = studentOptions.find(item => item.id === id);
            return id ? { id, name: option ? option.name : id } : null;
        })
        .filter(Boolean);

    const refreshStudentOptions = () => {
        const selectedIds = new Set(getSelectedStudents().map(student => student.id));
        studentsList.querySelectorAll('select').forEach(select => {
            select.querySelectorAll('option').forEach(option => {
                if (!option.value) return;
                option.disabled = selectedIds.has(option.value) && option.value !== select.value;
            });
        });
    };

    const readScoresFromGrid = () => {
        const scores = {};
        scoresGrid.querySelectorAll('input[data-student][data-subtopic]').forEach(input => {
            const studentId = input.dataset.student;
            const subtopic = input.dataset.subtopic;
            const value = parseFloat(input.value);
            const safeValue = Number.isNaN(value) ? 0 : clampScore(value);
            if (!scores[studentId]) scores[studentId] = {};
            scores[studentId][subtopic] = safeValue;
        });
        return scores;
    };

    const updateAverages = () => {
        const subtopics = getSubtopics();
        const scores = readScoresFromGrid();
        const students = getSelectedStudents();
        let total = 0;

        students.forEach(student => {
            let sum = 0;
            subtopics.forEach(subtopic => {
                sum += scores[student.id]?.[subtopic] ?? 0;
            });
            const avg = subtopics.length ? sum / subtopics.length : 0;
            const avgEl = scoresGrid.querySelector(`[data-avg="${student.id}"]`);
            if (avgEl) {
                avgEl.textContent = avg.toFixed(1);
            }
            total += avg;
        });

        const overall = students.length ? total / students.length : 0;
        overallAverageEl.textContent = overall.toFixed(1);
        setSummary(`Students: ${students.length} • Subtopics: ${subtopics.length} • Overall Avg: ${overall.toFixed(1)}`);
    };

    const rebuildGrid = () => {
        const subtopics = getSubtopics();
        const students = getSelectedStudents();
        const currentScores = readScoresFromGrid();

        scoresGrid.innerHTML = '';

        if (subtopics.length === 0 || students.length === 0) {
            scoresGrid.innerHTML = '<div style="padding: 12px; color: var(--text-gray);">Add subtopics and students to enter scores.</div>';
            overallAverageEl.textContent = '0.0';
            setSummary('');
            return;
        }

        const gridTemplate = `minmax(180px, 1.6fr) repeat(${subtopics.length}, minmax(80px, 1fr)) minmax(80px, 1fr)`;
        const headerRow = document.createElement('div');
        headerRow.className = 'scores-row header';
        headerRow.style.gridTemplateColumns = gridTemplate;

        let headerHtml = '<div>Student</div>';
        subtopics.forEach(subtopic => {
            headerHtml += `<div>${subtopic}</div>`;
        });
        headerHtml += '<div>Avg</div>';
        headerRow.innerHTML = headerHtml;
        scoresGrid.appendChild(headerRow);

        students.forEach(student => {
            const row = document.createElement('div');
            row.className = 'scores-row';
            row.style.gridTemplateColumns = gridTemplate;

            let rowHtml = `<div class="scores-cell"><strong>${student.name}</strong><div style="font-size:0.75rem; color: var(--text-gray);">${student.id}</div></div>`;
            subtopics.forEach(subtopic => {
                const value = currentScores[student.id]?.[subtopic];
                rowHtml += `<input type="number" class="scores-input grade-value"
                    data-student="${student.id}" data-subtopic="${subtopic}" min="0" max="10" step="1"
                    value="${Number.isFinite(value) ? value : 0}">`;
            });
            rowHtml += `<div class="scores-cell" data-avg="${student.id}">0.0</div>`;
            row.innerHTML = rowHtml;
            scoresGrid.appendChild(row);
        });

        scoresGrid.querySelectorAll('.grade-value').forEach(input => {
            input.addEventListener('keydown', (event) => {
                if (['e', 'E', '+', '-'].includes(event.key)) {
                    event.preventDefault();
                }
            });
            input.addEventListener('input', () => {
                const value = parseFloat(input.value);
                if (Number.isNaN(value)) {
                    input.value = '';
                } else {
                    input.value = clampScore(value);
                }
                updateAverages();
            });
        });

        updateAverages();
    };

    const clearErrors = () => {
        [topicInput, subtopicsList, studentsList].forEach(el => el.classList.remove('pld-error'));
    };

    const validateForm = () => {
        clearErrors();
        const topic = topicInput.value.trim();
        const subtopics = getSubtopics();
        const students = getSelectedStudents();
        const selectedIds = students.map(student => student.id);
        const hasDuplicates = new Set(selectedIds).size !== selectedIds.length;

        if (!topic) {
            topicInput.classList.add('pld-error');
            setStatus('Please enter a PLD topic name.', true);
            return false;
        }
        if (subtopics.length === 0) {
            subtopicsList.classList.add('pld-error');
            setStatus('Please add at least one subtopic.', true);
            return false;
        }
        if (students.length === 0) {
            studentsList.classList.add('pld-error');
            setStatus('Please add at least one student.', true);
            return false;
        }
        if (hasDuplicates) {
            studentsList.classList.add('pld-error');
            setStatus('Duplicate students detected. Please select unique students.', true);
            return false;
        }

        setStatus('');
        return true;
    };

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!validateForm()) return;

        const topic = topicInput.value.trim();
        const subtopics = getSubtopics();
        const students = getSelectedStudents();
        const scores = readScoresFromGrid();

        const payload = {
            topic,
            subtopics,
            students,
            scores
        };

        try {
            setStatus('Saving PLD data...');
            const response = await fetch('/api/save_pld', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Server error');
            }
            setStatus(`Saved ${result.saved_count || students.length} student records successfully.`);
        } catch (error) {
            setStatus(`Error: ${error.message}`, true);
        }
    });

    resetBtn.addEventListener('click', () => {
        topicInput.value = '';
        subtopicsList.innerHTML = '';
        studentsList.innerHTML = '';
        scoresGrid.innerHTML = '';
        overallAverageEl.textContent = '0.0';
        addSubtopicRow();
        addStudentRow();
        refreshStudentOptions();
        rebuildGrid();
        setStatus('');
        setSummary('');
    });

    clearLastBtn.addEventListener('click', async () => {
        const students = getSelectedStudents();
        if (students.length === 0) {
            setStatus('Select at least one student to clear last PLD.', true);
            return;
        }
        try {
            setStatus('Clearing last PLD...');
            const response = await fetch('/api/clear_last_pld', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_ids: students.map(s => s.id) })
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to clear last PLD.');
            }
            setStatus('Last PLD cleared for selected students.');
        } catch (error) {
            setStatus(`Error: ${error.message}`, true);
        }
    });


    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('/logout', { method: 'GET', credentials: 'include' });
        } finally {
            localStorage.removeItem('userRole');
            window.location.href = '/login';
        }
    });

    addSubtopicBtn.addEventListener('click', () => {
        addSubtopicRow();
        rebuildGrid();
    });

    addStudentBtn.addEventListener('click', () => {
        addStudentRow();
        refreshStudentOptions();
        rebuildGrid();
    });

    addSubtopicRow();
    addStudentRow();
    fetchStudents();
    rebuildGrid();
});
