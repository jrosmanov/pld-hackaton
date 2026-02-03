/**
 * Mentor Portal Script - Holberton PLD System
 * Обработка динамических форм, расчет среднего балла и отправка данных в БД
 */

const studentSelect = document.createElement('select');
studentSelect.className = 'pld-input';
studentSelect.id = 'student-selector';
studentSelect.required = true;

// 1. Инициализация: заменяем старый интерфейс добавления студентов на выпадающий список
document.addEventListener('DOMContentLoaded', () => {
    const studentSection = document.querySelector('.pld-section:nth-child(3)');
    if (studentSection) {
        studentSection.innerHTML = `
            <div class="pld-section-header">
                <span class="pld-label">Target Student</span>
            </div>
            <div id="student-container"></div>
        `;
        document.getElementById('student-container').appendChild(studentSelect);
    }
    fetchStudents(); // Подгружаем список из базы
});

// 2. Загрузка списка студентов из Python API
async function fetchStudents() {
    try {
        const res = await fetch('/api/get_students_list');
        const students = await res.json();

        studentSelect.innerHTML = '<option value="" disabled selected>-- Select Student by ID --</option>';
        students.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = `${s.name} (${s.id})`;
            studentSelect.appendChild(opt);
        });
    } catch (err) {
        console.error("Failed to load students:", err);
    }
}

// 3. Динамическое добавление подтем (вопросов)
document.getElementById('add-subtopic').addEventListener('click', () => {
    const list = document.getElementById('subtopics-list');
    const wrapper = document.createElement('div');
    wrapper.className = 'pld-item';

    wrapper.innerHTML = `
        <input type="text" placeholder="Question or Subtopic" class="subtopic-input" required>
        <button type="button" class="pld-remove">Remove</button>
    `;

    // При каждом изменении названия вопроса — перестраиваем таблицу оценок
    wrapper.querySelector('input').addEventListener('input', rebuildGrid);
    wrapper.querySelector('.pld-remove').addEventListener('click', () => {
        wrapper.remove();
        rebuildGrid();
    });

    list.appendChild(wrapper);
});

// 4. Построение таблицы оценок (Grid)
function rebuildGrid() {
    const grid = document.getElementById('scores-grid');
    const subtopics = Array.from(document.querySelectorAll('.subtopic-input'))
                           .map(i => i.value.trim())
                           .filter(Boolean);
    const selectedStudentId = studentSelect.value;

    grid.innerHTML = '';

    if (!selectedStudentId || subtopics.length === 0) {
        grid.innerHTML = '<div style="padding: 15px; color: #b0b3b8;">Add questions and select a student to enter scores...</div>';
        return;
    }

    // Создаем заголовок таблицы
    const header = document.createElement('div');
    header.className = 'scores-row header';
    header.style.gridTemplateColumns = `1.5fr repeat(${subtopics.length}, 1fr) 0.8fr`;

    let headerHtml = '<div>Student ID</div>';
    subtopics.forEach(s => headerHtml += `<div>${s}</div>`);
    headerHtml += '<div>Avg</div>';
    header.innerHTML = headerHtml;
    grid.appendChild(header);

    // Создаем строку ввода оценок
    const row = document.createElement('div');
    row.className = 'scores-row';
    row.style.gridTemplateColumns = `1.5fr repeat(${subtopics.length}, 1fr) 0.8fr`;

    let rowHtml = `<div class="scores-cell"><strong>${selectedStudentId}</strong></div>`;
    subtopics.forEach((sub, index) => {
        rowHtml += `<input type="number" class="scores-input grade-value"
                    data-subtopic="${sub}" min="0" max="10" step="1" value="0">`;
    });
    rowHtml += `<div class="scores-cell" id="live-avg">0.0</div>`;
    row.innerHTML = rowHtml;
    grid.appendChild(row);

    // Добавляем слушатель для живого расчета среднего
    row.querySelectorAll('.grade-value').forEach(input => {
        input.addEventListener('input', calculateLiveAverages);
    });
}

// 5. Расчет среднего балла «на лету»
function calculateLiveAverages() {
    const inputs = document.querySelectorAll('.grade-value');
    let sum = 0;
    inputs.forEach(i => sum += parseFloat(i.value) || 0);

    const avg = inputs.length > 0 ? (sum / inputs.length).toFixed(1) : "0.0";
    document.getElementById('live-avg').textContent = avg;
    document.getElementById('overall-average').textContent = avg;
}

// 6. Отправка данных на бэкенд
document.getElementById('pld-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('pld-status');
    const topic = document.getElementById('pld-topic').value.trim();
    const studentId = studentSelect.value;

    const grades = {};
    document.querySelectorAll('.grade-value').forEach(input => {
        grades[input.dataset.subtopic] = parseFloat(input.value) || 0;
    });

    const payload = {
        student_id: studentId,
        topic: topic,
        grades: grades
    };

    try {
        status.textContent = "Saving to database...";
        status.style.color = "var(--text-gray)";

        const response = await fetch('/api/save_pld', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            status.textContent = "✓ Success: Student record and stats updated!";
            status.style.color = "#4CAF50";
            // Опционально: сбросить форму после успеха
            // e.target.reset();
        } else {
            throw new Error(result.message || "Server error");
        }
    } catch (err) {
        status.textContent = "Error: " + err.message;
        status.style.color = "var(--hbtn-red)";
    }
});

// Слушаем изменения в селекторе студентов
studentSelect.addEventListener('change', rebuildGrid);