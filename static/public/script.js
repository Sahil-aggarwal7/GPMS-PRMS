document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent the default form submission

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username) {
        alert("Please enter your username.");
        document.getElementById('username').focus();
        return;
    }
    if (!password) {
        alert("Please enter your password.");
        document.getElementById('password').focus();
        return;
    }

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'username': username,
            'password': password
        })
    })
    .then(response => {
        if (response.redirected) {
            window.location.href = response.url; // Redirect on success
            return;
        }
        return response.json(); // Parse JSON on non-redirect responses
    })
    .then(data => {
        if (data && data.success) {
            alert('Login successful');
            window.location.href = data.redirectTo;
        } else if (data && data.message) {
            alert('Login failed: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert("An error occurred while logging in. Please try again later.");
    });
});
