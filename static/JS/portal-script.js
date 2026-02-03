// Get all role buttons
const roleButtons = document.querySelectorAll('.role-btn');
const pageTitle = document.getElementById('page-title');

// Role switcher functionality
roleButtons.forEach(button => {
    button.addEventListener('click', function() {
        // Remove active class from all buttons
        roleButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        this.classList.add('active');
        
        // Update page title based on selected role
        const role = this.getAttribute('data-role');
        if (role === 'student') {
            pageTitle.textContent = 'WELCOME TO STUDENT PAGE';
        } else if (role === 'mentor') {
            pageTitle.textContent = 'WELCOME TO MENTOR PAGE';
        }
    });
});

// Get action buttons and content area
const actionButtons = document.querySelectorAll('.action-btn');
const buttonText = document.getElementById('button-text');

// Action buttons functionality
actionButtons.forEach(button => {
    button.addEventListener('click', function() {
        // Remove active class from all buttons
        actionButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        this.classList.add('active');
        
        // Update content based on selected action
        const action = this.getAttribute('data-action');
        if (action === 'last') {
            buttonText.textContent = 'Showing Last PLD Results';
        } else if (action === 'all') {
            buttonText.textContent = 'Showing All PLD Results';
        }
    });
});
