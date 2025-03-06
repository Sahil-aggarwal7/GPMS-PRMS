document.addEventListener("DOMContentLoaded", () => {
    // --- Update header with current user's name ---
    const usernameDisplay = document.getElementById("username-display");
    fetch('/get_current_user')
        .then(response => response.json())
        .then(data => {
            if (data.username) {
                usernameDisplay.textContent = data.username;
            }
        })
        .catch(error => console.error("Error fetching current user:", error));

    // --- Populate the Users dropdown ---
    const userDropdown = document.getElementById("user");

    const fetchUsers = () => {
        // Fetch user data from the manage user creation endpoint
        fetch('/api/user-master')
            .then(response => response.json())
            .then(users => {
                // Clear any existing options and add a default prompt option
                userDropdown.innerHTML = `<option value="">--Select--</option>`;
                
                // Assume each user object contains property "UserName"
                users.forEach(user => {
                    const option = document.createElement("option");
                    option.value = user.UserName; // Use the username as the value
                    option.textContent = user.UserName;
                    userDropdown.appendChild(option);
                });
            })
            .catch(error => {
                console.error("Error fetching users:", error);
            });
    };

    // Load the users when the page loads
    fetchUsers();

    // --- When a user is selected, fetch and display their permissions ---
    userDropdown.addEventListener("change", (event) => {
        const selectedUsername = event.target.value;
        // Clear all checked module permissions
        document.querySelectorAll('input[name="module_permissions"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        // If no user is selected, exit early
        if (!selectedUsername) return;

        // Fetch permissions for the selected user (assuming the endpoint returns { modules: [...] })
        fetch(`/get_user_access_rights?username=${encodeURIComponent(selectedUsername)}`)
            .then(response => response.json())
            .then(data => {
                if (data.modules && Array.isArray(data.modules)) {
                    data.modules.forEach(moduleName => {
                        const checkbox = document.querySelector(`input[name="module_permissions"][value="${moduleName}"]`);
                        if (checkbox) {
                            checkbox.checked = true;
                        }
                    });
                }
                // Automatically open all permission dropdown sections so the user can see the selected checkboxes
                document.querySelectorAll('.permission-section .dropdown-container').forEach(container => {
                    container.classList.add('show');
                });
            })
            .catch(error => {
                console.error("Error fetching user permissions:", error);
            });
    });

    // --- Handle form submission for updating access rights ---
    const form = document.getElementById("user-access-form");
    form.addEventListener("submit", (event) => {
        event.preventDefault();
    
        // Ensure a user is selected
        const selectedUsername = userDropdown.value;
        if (!selectedUsername) {
            alert("Please select a user.");
            return;
        }
    
        // Collect all checked modules
        const checkedModules = [];
        document.querySelectorAll('input[name="module_permissions"]:checked')
                .forEach(checkbox => {
                    checkedModules.push(checkbox.value);
                });
    
        // Prepare the data object with username instead of user_id
        const accessRightsData = {
            username: selectedUsername,
            modules: checkedModules
        };
    
        // Send the data to the backend endpoint
        fetch('/update_user_access_rights', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(accessRightsData)
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            form.reset();
        })
        .catch(error => {
            console.error("Error updating user access rights:", error);
            alert("An error occurred while updating user access rights.");
        });
    });

    // --- Dropdown toggle for any element with .dropdown-btn (applies to both sidebar and permission sections) ---
    const dropdownButtons = document.querySelectorAll('.dropdown-btn');
    dropdownButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Toggle the next sibling container's visibility
            const dropdownContainer = button.nextElementSibling;
            if (dropdownContainer) {
                dropdownContainer.classList.toggle('show');
            }
        });
    });
    
    // --- Sidebar dropdown functionality (if applicable) ---
    document.querySelectorAll('.dropdown-btn').forEach(button => {
        button.addEventListener("click", function() {
            const parent = this.parentElement;
            document.querySelectorAll('.sidebar ul li.open').forEach(item => {
                if (item !== parent) {
                    item.classList.remove("open");
                }
            });
            parent.classList.toggle("open");
        });
    });
});