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

// Add click event listener to each button
roleButtons.forEach(button => {
    button.addEventListener('click', function() {
        // Remove active class from all buttons
        roleButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        this.classList.add('active');
        
        // Update the "Logging in as" text
        const role = this.getAttribute('data-role');
        currentRoleElement.textContent = role.charAt(0).toUpperCase() + role.slice(1);
    });
});