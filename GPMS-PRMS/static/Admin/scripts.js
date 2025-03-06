document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("company-form");
    const table = document.getElementById("company-table");
    const searchRow = document.getElementById("searchRow");
    const tbody = table.querySelector("tbody");
    const pagination = document.getElementById("pagination");

    let isEditing = false;
    let editingUserId = null;
    const rowsPerPage = 10;
    let currentPage = 1;

    // Reference the fields that must be frozen
    const userCodeField = form.querySelector('[name="userCode"]');
    const effectiveFromField = form.querySelector('[name="effectiveFrom"]');

    // Fetch data from the backend and render table
    const fetchTableData = () => {
        fetch('/api/user-master')
            .then(response => response.json())
            .then(data => {
                renderPage(data, currentPage);
                updatePagination(data.length);
                localStorage.setItem("userMasterData", JSON.stringify(data));
            })
            .catch(error => {
                console.error('Error fetching users:', error);
            });
    };

    // Save user data (Add or Edit)
    form.addEventListener("submit", (event) => {
        event.preventDefault();

        // Re-enable the fields so their values are included in the FormData
        userCodeField.disabled = false;
        effectiveFromField.disabled = false;

        // Password validation
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirm-password").value;
        
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        const formData = new FormData(form);
        const userData = Object.fromEntries(formData.entries());

        // Modify the endpoint and method based on editing state
        const url = isEditing ? `/update_user/${editingUserId}` : '/add_user';
        const method = isEditing ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                form.reset();
                isEditing = false;
                editingUserId = null;
                fetchTableData();

                // Freeze the fields after submission
                userCodeField.disabled = true;
                effectiveFromField.disabled = true;
            })
            .catch(error => {
                console.error('Error processing user:', error);
                alert('An error occurred while processing the user.');
            });
    });

    // Render table based on current page
    const renderPage = (data, page) => {
        const start = (page - 1) * rowsPerPage;
        const end = page * rowsPerPage;
        const pageData = data.slice(start, end);

        tbody.innerHTML = "";
        pageData.forEach(user => {
            const row = document.createElement("tr");
            row.dataset.userId = user.UserID;

            // Define the specific order and mapping of fields
            const fieldOrder = [
                { key: 'UserCode', formName: 'userCode' },
                { key: 'UserName', formName: 'userName' },
                { key: 'Email', formName: 'email' },
                { key: 'Department', formName: 'department' },
                { key: 'EffectiveFrom', formName: 'effectiveFrom' },
                { key: 'EffectiveTo', formName: 'effectiveTo' }
            ];

            // Create cells in the specific order
            fieldOrder.forEach(field => {
                const cell = document.createElement("td");
                let value = user[field.key] || '';
                
                if (field.key === 'EffectiveFrom' || field.key === 'EffectiveTo') {
                    if (value) {
                        // Store the ISO date for use in the form
                        cell.dataset.isoDate = new Date(value).toISOString().split('T')[0];
                        // Display a formatted date
                        value = new Date(value).toLocaleDateString();
                    }
                }
                
                cell.textContent = value;
                cell.dataset.field = field.formName.toLowerCase();
                row.appendChild(cell);
            });

            tbody.appendChild(row);
        });
    };

    // Update pagination buttons
    const updatePagination = (totalRows) => {
        const totalPages = Math.ceil(totalRows / rowsPerPage);
        pagination.innerHTML = "";
        for (let i = 1; i <= totalPages; i++) {
            const button = document.createElement("button");
            button.textContent = i;
            button.classList.add("page-btn");
            if (i === currentPage) {
                button.classList.add("active");
            }
            button.addEventListener("click", () => {
                currentPage = i;
                const data = JSON.parse(localStorage.getItem("userMasterData")) || [];
                renderPage(data, currentPage);
                updatePagination(data.length);
            });
            pagination.appendChild(button);
        }
    };

    // Event listener for row click (populate form fields)
    tbody.addEventListener("click", (event) => {
        const row = event.target.closest("tr");
        if (!row) return;

        isEditing = true;
        editingUserId = row.dataset.userId;

        const fieldMapping = {
            'usercode': 'userCode',
            'username': 'userName',
            'email': 'email',
            'department': 'department',
            'effectivefrom': 'effectiveFrom',
            'effectiveto': 'effectiveTo'
        };

        // Populate form fields from row cells
        Array.from(row.children).forEach(cell => {
            const fieldName = cell.dataset.field;
            if (fieldName) {
                const formFieldName = fieldMapping[fieldName] || fieldName;
                const formField = form.querySelector(`[name="${formFieldName}"]`);
                if (formField) {
                    if (fieldName === 'effectivefrom' || fieldName === 'effectiveto') {
                        // Use the stored ISO date for the form
                        if (cell.dataset.isoDate) {
                            formField.value = cell.dataset.isoDate;
                        }
                    } else {
                        formField.value = cell.textContent.trim();
                    }
                }
            }
        });

        // Freeze these two fields when editing
        userCodeField.disabled = true;
        effectiveFromField.disabled = true;

        // Clear password fields when editing
        document.getElementById("password").value = "";
        document.getElementById("confirm-password").value = "";
    });

    // (Optional) When adding a new user (via a "New" button), re-enable the frozen fields.
    const addNewBtn = document.getElementById("add-new-btn");
    if (addNewBtn) {
        addNewBtn.addEventListener("click", () => {
            form.reset();
            isEditing = false;
            editingUserId = null;
            // Re-enable the fields so they can be filled for a new user
            userCodeField.disabled = false;
            effectiveFromField.disabled = false;
        });
    }

    // Search functionality
    searchRow.addEventListener("input", (event) => {
        const searchTerm = event.target.value.toLowerCase().trim();
        const column = event.target.getAttribute("data-column");

        const fullData = JSON.parse(localStorage.getItem("userMasterData")) || [];

        if (searchTerm === "") {
            renderPage(fullData, currentPage);
            updatePagination(fullData.length);
            return;
        }

        const filteredData = fullData.filter(user => {
            if (column) {
                const fieldMap = {
                    'userCode': 'UserCode',
                    'userName': 'UserName',
                    'email': 'Email',
                    'department': 'Department',
                    'effectiveFrom': 'EffectiveFrom',
                    'effectiveTo': 'EffectiveTo'
                };

                const mappedColumn = fieldMap[column];
                return user[mappedColumn]
                    ? user[mappedColumn].toString().toLowerCase().includes(searchTerm)
                    : false;
            }
            return Object.values(user).some(value =>
                value ? value.toString().toLowerCase().includes(searchTerm) : false
            );
        });

        renderPage(filteredData, 1);
        updatePagination(filteredData.length);
    });

    // Dropdown functionality for sidebar menu
    document.querySelectorAll('.dropdown-btn').forEach(button => {
        button.addEventListener('click', function () {
            const parent = this.parentElement;
            document.querySelectorAll('.sidebar ul li.open').forEach(item => {
                if (item !== parent) {
                    item.classList.remove('open');
                }
            });
            parent.classList.toggle('open');
        });
    });

    // Load initial data
    fetchTableData();
});
