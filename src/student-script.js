// Check if user is logged in as student, if not redirect to login
if (localStorage.getItem('userRole') !== 'student') {
    window.location.href = 'login.html';
}

// Get all role buttons
const roleButtons = document.querySelectorAll('.role-btn');

// Hide the mentor button and make student button non-clickable
roleButtons.forEach(button => {
    const role = button.getAttribute('data-role');
    
    if (role === 'mentor') {
        // Hide mentor button for student users
        button.style.display = 'none';
    } else if (role === 'student') {
        // Disable student button (already active)
        button.disabled = true;
        button.style.cursor = 'not-allowed';
        button.style.opacity = '1';
    }
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

// Set LAST PLD as default and display its content on page load
window.addEventListener('load', function() {
    const lastPldButton = Array.from(actionButtons).find(btn => btn.getAttribute('data-action') === 'last');
    if (lastPldButton) {
        lastPldButton.classList.add('active');
        buttonText.textContent = 'Showing Last PLD Results';
    }
});
