// Add this to your existing script or create a new script.js file
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in (you'll need to implement this based on your authentication system)
    function checkLoginStatus() {
        // This is a placeholder - replace with actual login check
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const username = localStorage.getItem('username');
        
        const authDefault = document.querySelector('.auth-default');
        const userAccount = document.querySelector('.user-account');
        const usernameElement = document.querySelector('.username');
        
        if (isLoggedIn) {
            authDefault.style.display = 'none';
            userAccount.style.display = 'block';
            usernameElement.textContent = username || 'User';
        } else {
            authDefault.style.display = 'block';
            userAccount.style.display = 'none';
        }
    }

    // Handle logout
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Clear login status
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('username');
            // Redirect to login page
            window.location.href = 'login.html';
        });
    }

    // Check login status when page loads
    checkLoginStatus();
});