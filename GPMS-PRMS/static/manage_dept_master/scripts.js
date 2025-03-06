document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("department-master-form");
    const table = document.getElementById("department-master-table");
    const searchRow = document.getElementById("searchRow");
    const tbody = table.querySelector("tbody");
    const pagination = document.getElementById("pagination");
  
    let isEditing = false;
    let editingDepartmentId = null;
    const rowsPerPage = 10; // Number of rows per page
    let currentPage = 1;
  
    // Fetch data from the backend and render table
    const fetchTableData = () => {
        fetch('/api/department-master')
            .then(response => response.json())
            .then(data => {
                renderPage(data, currentPage);
                updatePagination(data.length);
                localStorage.setItem("departmentMasterData", JSON.stringify(data));
            })
            .catch(error => {
                console.error('Error fetching departments:', error);
            });
    };
  
    // Save department data (Add or Edit)
    form.addEventListener("submit", (event) => {
        event.preventDefault();

          // Re-enable fields so that their values are included
    form.querySelector('[name="departmentCode"]').disabled = false;
    form.querySelector('[name="effectiveFrom"]').disabled = false;
  
        const formData = new FormData(form);
        const departmentData = Object.fromEntries(formData.entries());
  
        // Modify the endpoint and method based on editing state
        const url = isEditing ? `/update_department/${editingDepartmentId}` : '/add_department';
        const method = isEditing ? 'PUT' : 'POST';
  
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(departmentData),
        })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                form.reset();
                // Re-enable the fields when resetting the form
                form.querySelector('[name="departmentCode"]').disabled = false;
                form.querySelector('[name="effectiveFrom"]').disabled = false;
                isEditing = false;
                editingDepartmentId = null;
                fetchTableData(); // Reload data
            })
            .catch(error => {
                console.error('Error processing department:', error);
                alert('An error occurred while processing the department.');
            });
    });
  
    // Render table based on current page
    const renderPage = (data, page) => {
        const start = (page - 1) * rowsPerPage;
        const end = page * rowsPerPage;
        const pageData = data.slice(start, end);
  
        tbody.innerHTML = ""; // Clear existing rows
        pageData.forEach(department => {
            const row = document.createElement("tr");
            row.dataset.departmentId = department.DepartmentID; // Store DepartmentID in row
  
            // Define the specific order and mapping of fields
            const fieldOrder = [
                { key: 'DepartmentCode', formName: 'departmentCode' },
                { key: 'DepartmentName', formName: 'departmentName' },
                { key: 'EffectiveFrom', formName: 'effectiveFrom' },
                { key: 'EffectiveTo', formName: 'effectiveTo' }
            ];
  
            // Create cells in the specific order
            fieldOrder.forEach(field => {
                const cell = document.createElement("td");
                let value = department[field.key] || '';
                // Format dates for display if applicable
                if ((field.key === 'EffectiveFrom' || field.key === 'EffectiveTo') && value) {
                    const date = new Date(value);
                    if (!isNaN(date.getTime())) {
                        value = date.toISOString().split('T')[0];
                    }
                }
                cell.textContent = value;
                // Save the field identifier in lowercase for easier mapping later
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
                renderPage(JSON.parse(localStorage.getItem("departmentMasterData")) || [], currentPage);
                updatePagination(JSON.parse(localStorage.getItem("departmentMasterData"))?.length || 0);
            });
            pagination.appendChild(button);
            
        }
    };
  
    // Event listener for row click (populate form fields with clicked row data)
    tbody.addEventListener("click", (event) => {
        const row = event.target.closest("tr");
        if (!row) return;
  
        isEditing = true;
        editingDepartmentId = row.dataset.departmentId;
  
        // Build a mapping for form fields using the lower-case keys
        const formFields = {
            departmentcode: form.querySelector('[name="departmentCode"]'),
            departmentname: form.querySelector('[name="departmentName"]'),
            effectivefrom: form.querySelector('[name="effectiveFrom"]'),
            effectiveto: form.querySelector('[name="effectiveTo"]')
        };
  
        // Loop over each cell in the clicked row
        Array.from(row.children).forEach(cell => {
            const fieldName = cell.dataset.field; // e.g., "departmentcode", "effectivefrom"
            if (fieldName && formFields[fieldName]) {
                let value = cell.textContent.trim();
                // Format date fields to YYYY-MM-DD if needed
                if (fieldName === 'effectivefrom' || fieldName === 'effectiveto') {
                    if (value) {
                        const date = new Date(value);
                        if (!isNaN(date.getTime())) {
                            value = date.toISOString().split('T')[0];
                        }
                    }
                }
                formFields[fieldName].value = value;
            }
        });
  
        // Freeze Department Code and Effective From fields (disable them)
        formFields.departmentcode.disabled = true;
        formFields.effectivefrom.disabled = true;
    });
  
    // Search functionality
    searchRow.addEventListener("input", (event) => {
        const searchTerm = event.target.value.toLowerCase().trim();
        const column = event.target.getAttribute("data-column");
  
        // Retrieve the full data from localStorage
        const fullData = JSON.parse(localStorage.getItem("departmentMasterData")) || [];
  
        // If no search term, render the current page of full data
        if (searchTerm === "") {
            renderPage(fullData, currentPage);
            updatePagination(fullData.length);
            return;
        }
  
        // Filter data based on search term
        const filteredData = fullData.filter(department => {
            if (column) {
                const fieldMap = {
                    'departmentCode': 'DepartmentCode',
                    'departmentName': 'DepartmentName',
                    'effectiveFrom': 'EffectiveFrom',
                    'effectiveTo': 'EffectiveTo'
                };
  
                const mappedColumn = fieldMap[column];
                return department[mappedColumn]
                    ? department[mappedColumn].toString().toLowerCase().includes(searchTerm)
                    : false;
            }
  
            // Search across all fields
            return Object.values(department).some(value =>
                value ? value.toString().toLowerCase().includes(searchTerm) : false
            );
        });
  
        renderPage(filteredData, 1);
        updatePagination(filteredData.length);
    });
  
    // Dropdown functionality
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
