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