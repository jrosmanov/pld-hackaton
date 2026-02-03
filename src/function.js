// Welcome splash screen animation
const welcomeSplash = document.querySelector('.welcome-splash');
const loginCard = document.querySelector('.login-card');

// Show welcome screen for 2 seconds, then fade out
setTimeout(() => {
    welcomeSplash.classList.add('fade-out');
    loginCard.classList.add('fade-in');
    
    // Remove welcome splash after animation completes
    setTimeout(() => {
        welcomeSplash.style.display = 'none';
    }, 600);
}, 2000);

// Get all role buttons
const roleButtons = document.querySelectorAll('.role-btn');
const currentRoleElement = document.getElementById('current-role');
let selectedRole = 'student'; // Default role

// Add click event listener to each button
roleButtons.forEach(button => {
    button.addEventListener('click', function() {
        // Remove active class from all buttons
        roleButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        this.classList.add('active');
        
        // Update the "Logging in as" text and selected role
        selectedRole = this.getAttribute('data-role');
        currentRoleElement.textContent = selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1);
    });
});

// Handle login form submission
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Store the selected role in localStorage
        localStorage.setItem('userRole', selectedRole);
        
        // Redirect based on selected role
        if (selectedRole === 'student') {
            window.location.href = 'student.html';
        } else if (selectedRole === 'mentor') {
            window.location.href = 'mentor.html';
        }
    });
}