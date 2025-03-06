document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("supplier-form");
    const table = document.getElementById("supplier-table");
    const searchRow = document.getElementById("searchRow");
    const tbody = table.querySelector("tbody");
    const pagination = document.getElementById("pagination");

    let isEditing = false;
    let editingSupplierId = null;
    const rowsPerPage = 10;
    let currentPage = 1;

    // Fetch data from the backend and render table
    const fetchTableData = () => {
        fetch('/api/suppliers')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                renderPage(data, currentPage);
                updatePagination(data.length);
                localStorage.setItem("suppliersMasterData", JSON.stringify(data));
            })
            .catch(error => {
                console.error('Error fetching suppliers:', error);
                alert('Failed to fetch suppliers. Please try again.');
            });
    };

    // Save supplier data (Add or Edit)
    form.addEventListener("submit", (event) => {
        event.preventDefault();

        // Re-enable the supplierCode field so its value is included in the FormData
    const supplierCodeField = form.querySelector('[name="supplierCode"]');
    if (supplierCodeField) {
        supplierCodeField.disabled = false;
    }

        const formData = new FormData(form);
        const supplierData = Object.fromEntries(formData.entries());

        // Validate required fields
        const requiredFields = ['supplierCode', 'supplierName'];
        const missingFields = requiredFields.filter(field => !supplierData[field]);

        if (missingFields.length > 0) {
            alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
            return;
        }

        // Modify the endpoint and method based on editing state
        const url = isEditing ? `/update_supplier/${editingSupplierId}` : '/add_supplier';
        const method = isEditing ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(supplierData),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                alert(data.message);
                form.reset();
                // Re-enable the supplierCode field for new entries
                form.querySelector('[name="supplierCode"]').disabled = false;
                isEditing = false;
                editingSupplierId = null;
                fetchTableData(); // Reload data
            })
            .catch(error => {
                console.error('Error processing supplier:', error);
                alert('An error occurred while processing the supplier. Please check your input and try again.');
            });
    });

    const renderPage = (data, page) => {
        const start = (page - 1) * rowsPerPage;
        const end = page * rowsPerPage;
        const pageData = data.slice(start, end);

        tbody.innerHTML = ""; // Clear existing rows

        pageData.forEach(supplier => {
            const row = document.createElement("tr");
            row.dataset.supplierId = supplier.SupplierID;

            const fieldOrder = [
                { key: 'SupplierCode', formName: 'supplierCode' },
                { key: 'SupplierName', formName: 'supplierName' },
                { key: 'SupplierAddress', formName: 'supplierAddress' },
                { key: 'GSTNo', formName: 'gstNo' },
                { key: 'PANNo', formName: 'panNo' },
                { key: 'ContactName', formName: 'contactName' },
                { key: 'ContactPhone', formName: 'contactPhone' },
                { key: 'ContactEmail', formName: 'contactEmail' },
                { key: 'City', formName: 'city' },
                { key: 'State', formName: 'state' },
                { key: 'PinCode', formName: 'pincode' }
            ];

            fieldOrder.forEach(field => {
                const cell = document.createElement("td");
                cell.textContent = supplier[field.key] || '';
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
            button.addEventListener("click", () => {
                currentPage = i;
                const storedData = JSON.parse(localStorage.getItem("suppliersMasterData")) || [];
                renderPage(storedData, currentPage);
                updatePaginationActiveState(i);
            });
            pagination.appendChild(button);
        }

        // Highlight current page button
        updatePaginationActiveState(currentPage);
    };

    // Highlight active pagination button
    const updatePaginationActiveState = (activePage) => {
        const buttons = pagination.querySelectorAll('.page-btn');
        buttons.forEach(button => {
            button.classList.toggle('active', parseInt(button.textContent) === activePage);
        });
    };

    // Event listener for row click (populate form fields with clicked row data)
    tbody.addEventListener("click", (event) => {
        const row = event.target.closest("tr");
        if (!row) return;

        isEditing = true;
        editingSupplierId = row.dataset.supplierId;

        const fieldMapping = {
            'suppliercode': 'supplierCode',
            'suppliername': 'supplierName',
            'supplieraddress': 'supplierAddress',
            'gstno': 'gstNo',
            'panno': 'panNo',
            'contactname': 'contactName',
            'contactphone': 'contactPhone',
            'contactemail': 'contactEmail',
            'city': 'city',
            'state': 'state',
            'pincode': 'pincode'
        };

        Array.from(row.children).forEach(cell => {
            const fieldName = cell.dataset.field;

            if (fieldName) {
                const formFieldName = fieldMapping[fieldName] || fieldName;
                const formField = form.querySelector(`[name="${formFieldName}"]`);
                if (formField) {
                    formField.value = cell.textContent.trim();
                }
            }
        });

        // Freeze Supplier Code field after submission by disabling it
        const supplierCodeField = form.querySelector('[name="supplierCode"]');
        if (supplierCodeField) {
            supplierCodeField.disabled = true;
        }
    });

    // Search functionality
    searchRow.addEventListener("input", (event) => {
        const searchTerm = event.target.value.toLowerCase().trim();
        const column = event.target.getAttribute("data-column");

        const fullData = JSON.parse(localStorage.getItem("suppliersMasterData")) || [];

        if (searchTerm === "") {
            renderPage(fullData, currentPage);
            updatePagination(fullData.length);
            return;
        }

        const filteredData = fullData.filter(supplier => {
            if (column) {
                const fieldMap = {
                    'supplierCode': 'SupplierCode',
                    'supplierName': 'SupplierName',
                    'supplierAddress': 'SupplierAddress',
                    'gstNo': 'GSTNo',
                    'panNo': 'PANNo',
                    'contactName': 'ContactName',
                    'contactPhone': 'ContactPhone',
                    'contactEmail': 'ContactEmail',
                    'city': 'City',
                    'state': 'State',
                    'pincode': 'PinCode'
                };

                const mappedColumn = fieldMap[column];
                return supplier[mappedColumn]
                    ? supplier[mappedColumn].toString().toLowerCase().includes(searchTerm)
                    : false;
            }

            return Object.values(supplier).some(value =>
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
