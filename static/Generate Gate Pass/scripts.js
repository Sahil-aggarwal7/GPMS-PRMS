document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("gate-pass-form");
    const table = document.getElementById("gate-pass-table");
    const searchRow = document.getElementById("searchRow");
    const tbody = table.querySelector("tbody");
    const pagination = document.getElementById("pagination");
    const customerCodeSelect = document.getElementById("customer-code");
    const customerNameSelect = document.getElementById("customer-name");
    const gatePassDateInput = document.getElementById("gate-pass-date");
    const plantSelect = document.getElementById("plant");

    let isEditing = false;
    let editingGatePassId = null;
    const rowsPerPage = 10;
    let currentPage = 1;

    // Helper functions to freeze (disable) and unfreeze (enable) key fields
    function disableFreezeFields() {
        customerCodeSelect.disabled = true;
        customerNameSelect.disabled = true;
        gatePassDateInput.disabled = true;
        plantSelect.disabled = true;
    }

    function enableFreezeFields() {
        customerCodeSelect.disabled = false;
        customerNameSelect.disabled = false;
        gatePassDateInput.disabled = false;
        plantSelect.disabled = false;
    }

    // Fetch customer data from Customer Master
    const fetchCustomerData = () => {
        fetch('/api/customer-master')
            .then(response => response.json())
            .then(data => {
                populateCustomerDropdowns(data);
                localStorage.setItem("customerMasterData", JSON.stringify(data));
            })
            .catch(error => {
                console.error('Error fetching customer data:', error);
            });
    };

    // Populate customer dropdowns
    const populateCustomerDropdowns = (customers) => {
        // Clear existing options except the default
        customerCodeSelect.innerHTML = '<option value="">--Select--</option>';
        customerNameSelect.innerHTML = '<option value="">--Select--</option>';

        // Sort customers by customer code
        customers.sort((a, b) => a.CustomerCode.localeCompare(b.CustomerCode));

        // Add customer options
        customers.forEach(customer => {
            // Add to Customer Code dropdown
            const codeOption = document.createElement('option');
            codeOption.value = customer.CustomerCode;
            codeOption.textContent = customer.CustomerCode;
            customerCodeSelect.appendChild(codeOption);

            // Add to Customer Name dropdown
            const nameOption = document.createElement('option');
            nameOption.value = JSON.stringify({
                code: customer.CustomerCode,
                name: customer.CustomerName
            });
            nameOption.textContent = customer.CustomerName;
            customerNameSelect.appendChild(nameOption);
        });
    };

    // Handle customer code dropdown change
    customerCodeSelect.addEventListener('change', (event) => {
        const selectedCode = event.target.value;
        if (!selectedCode) {
            customerNameSelect.value = "";
            return;
        }

        const customerData = JSON.parse(localStorage.getItem("customerMasterData")) || [];
        const customer = customerData.find(c => c.CustomerCode === selectedCode);
        
        if (customer) {
            customerNameSelect.value = JSON.stringify({
                code: customer.CustomerCode,
                name: customer.CustomerName
            });
        }
    });

    // Handle customer name dropdown change
    customerNameSelect.addEventListener('change', (event) => {
        const selectedValue = event.target.value;
        if (!selectedValue) {
            customerCodeSelect.value = "";
            return;
        }

        const selectedData = JSON.parse(selectedValue);
        customerCodeSelect.value = selectedData.code;
    });

    // Fetch gate pass data from backend
    const fetchTableData = () => {
        fetch('/api/gate-pass')
            .then(response => response.json())
            .then(data => {
                renderPage(data, currentPage);
                updatePagination(data.length);
                localStorage.setItem("gatePassData", JSON.stringify(data));
            })
            .catch(error => {
                console.error('Error fetching gate pass data:', error);
            });
    };

    // Handle form submission
form.addEventListener("submit", (event) => {
    event.preventDefault();

    // Temporarily re-enable disabled required fields so that their values are included
    const requiredFieldNames = ["customerCode", "customerName", "gatePassDate", "plant"];
    const disabledFields = [];
    requiredFieldNames.forEach(name => {
        const element = form.querySelector(`[name="${name}"]`);
        if (element.disabled) {
            disabledFields.push(element);
            element.disabled = false;
        }
    });

    // Now, construct FormData (it will include the values from the previously disabled fields)
    const formData = new FormData(form);

    // Re-disable those fields immediately after constructing FormData
    disabledFields.forEach(element => element.disabled = true);

    // Convert FormData into a plain object
    const gatePassData = Object.fromEntries(formData.entries());
    
    // Get the actual customer name from the selected option if needed
    if (gatePassData.customerName) {
        try {
            const customerNameData = JSON.parse(gatePassData.customerName);
            gatePassData.customerName = customerNameData.name;
            // Ensure the customer code is taken from the customer code dropdown
            gatePassData.customerCode = customerCodeSelect.value;
        } catch (e) {
            console.error('Error parsing customer name data:', e);
            return;
        }
    }

    // Validate required fields
    const requiredFields = ['customerCode', 'customerName', 'gatePassDate', 'gatePassType', 
                              'plant', 'noOfPacks', 'description', 'quantity', 'purpose'];
    
    const missingFields = requiredFields.filter(field => !gatePassData[field]);
    if (missingFields.length > 0) {
        alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
    }
    
    // Ensure corporate is set
    gatePassData.corporate = "SYRMA SGS TECHNOLOGY LIMITED";

    const url = isEditing ? `/update_gate/${editingGatePassId}` : '/add_gate_pass';
    const method = isEditing ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(gatePassData),
    })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            form.reset();
            // Freeze the key fields after submission so they cannot be changed
            disableFreezeFields();
            isEditing = false;
            editingGatePassId = null;
            fetchTableData();
        })
        .catch(error => {
            console.error('Error processing gate pass:', error);
            alert('An error occurred while processing the gate pass.');
        });
});


    // Render table page
    const renderPage = (data, page) => {
        const start = (page - 1) * rowsPerPage;
        const end = page * rowsPerPage;
        const pageData = data.slice(start, end);

        tbody.innerHTML = "";
        pageData.forEach(gatePass => {
            const row = document.createElement("tr");
            row.dataset.gatePassId = gatePass.GatePassID;

            const fieldOrder = [
                { key: 'NoOfPacks', formName: 'noOfPacks' },
                { key: 'UOM', formName: 'uom' },
                { key: 'Description', formName: 'description' },
                { key: 'Quantity', formName: 'quantity' },
                { key: 'Purpose', formName: 'purpose' },
                { key: 'VehicleNo', formName: 'vehicleNo' }
            ];

            fieldOrder.forEach(field => {
                const cell = document.createElement("td");
                cell.textContent = gatePass[field.key] || '';
                cell.dataset.field = field.formName.toLowerCase();
                row.appendChild(cell);
            });

            // Create delete cell with cross icon
const deleteCell = document.createElement("td");
deleteCell.classList.add("delete-cell");
deleteCell.innerHTML = `<i class="fa fa-times delete-icon" aria-hidden="true"></i>`;

// Add event listener to delete this row
deleteCell.addEventListener("click", (event) => {
    event.stopPropagation();
    const row = event.target.closest("tr");
    const requestId = row.dataset.gatePassId;  // Correct the field name here

    if (confirm("Are you sure you want to delete this Gate Pass?")) {
        fetch(`/delete_gate_pass/${requestId}`, {
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                row.remove();

                // Update localStorage data
                const fullData = JSON.parse(localStorage.getItem("gatePassData")) || [];
                const updatedData = fullData.filter(request => request.GatePassID !== requestId);
                localStorage.setItem("gatePassData", JSON.stringify(updatedData));

                // Update pagination
                updatePagination(updatedData.length);
            })
            .catch(error => {
                console.error("Error deleting gate pass:", error);
                alert("Error deleting gate pass.");
            });
    }
});

// Append delete cell to the row
row.appendChild(deleteCell);

            tbody.appendChild(row);
        });
    };

    // Update pagination
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
                const data = JSON.parse(localStorage.getItem("gatePassData")) || [];
                renderPage(data, currentPage);
                updatePaginationActive(i);
            });
            pagination.appendChild(button);
        }
    };

    // Update active pagination button
    const updatePaginationActive = (page) => {
        document.querySelectorAll('.page-btn').forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.textContent) === page) {
                btn.classList.add('active');
            }
        });
    };

    // Handle row click for editing
    tbody.addEventListener("click", (event) => {
        const row = event.target.closest("tr");
        if (!row) return;

        isEditing = true;
        editingGatePassId = row.dataset.gatePassId;

        const data = JSON.parse(localStorage.getItem("gatePassData")) || [];
        const gatePass = data.find(gp => gp.GatePassID.toString() === editingGatePassId);

        if (gatePass) {
            // Set customer code
            customerCodeSelect.value = gatePass.CustomerCode || '';
            
            // Set customer name using customer master data
            const customerData = JSON.parse(localStorage.getItem("customerMasterData")) || [];
            const customer = customerData.find(c => c.CustomerCode === gatePass.CustomerCode);
            if (customer) {
                customerNameSelect.value = JSON.stringify({
                    code: customer.CustomerCode,
                    name: customer.CustomerName
                });
            }

            // Set other fields
            const fieldMapping = {
                'GatePassDate': 'gatePassDate',
                'GatePassType': 'gatePassType',
                'Plant': 'plant',
                'NoOfPacks': 'noOfPacks',
                'UOM': 'uom',
                'Description': 'description',
                'Quantity': 'quantity',
                'Purpose': 'purpose',
                'VehicleNo': 'vehicleNo'
            };

            Object.entries(fieldMapping).forEach(([dbField, formField]) => {
                const input = form.querySelector(`[name="${formField}"]`);
                if (input) {
                    input.value = gatePass[dbField] || '';
                }
            });
            // Freeze these fields during editing so they cannot be changed
            disableFreezeFields();
        }
    });

// Search functionality
searchRow.addEventListener("input", (event) => {
    const searchTerm = event.target.value.toLowerCase().trim();
    let column = event.target.getAttribute("data-column");
    if (column) {
        column = column.toLowerCase();  // Force lowercase for proper mapping
    }

    const fullData = JSON.parse(localStorage.getItem("gatePassData")) || [];

    if (searchTerm === "") {
        renderPage(fullData, currentPage);
        updatePagination(fullData.length);
        return;
    }

    const fieldMap = {
        'noofpacks': 'NoOfPacks',
        'uom': 'UOM',
        'description': 'Description',
        'quantity': 'Quantity',
        'purpose': 'Purpose',
        'vehicleno': 'VehicleNo'
    };

    const filteredData = fullData.filter(gatePass => {
        if (column) {
            const mappedColumn = fieldMap[column];
            const value = gatePass[mappedColumn];
            return value ? value.toString().toLowerCase().includes(searchTerm) : false;
        }

        // If no specific column is provided, search across all mapped fields
        return Object.values(fieldMap).some(field => {
            const value = gatePass[field];
            return value ? value.toString().toLowerCase().includes(searchTerm) : false;
        });
    });

    currentPage = 1;  // Reset to first page for search results
    renderPage(filteredData, currentPage);
    updatePagination(filteredData.length);
});

    // Clear form button functionality – re-enable the fields for a new entry
    const clearButton = form.querySelector('button[type="reset"]');
    clearButton.addEventListener('click', () => {
        form.reset();
        enableFreezeFields();
        isEditing = false;
        editingGatePassId = null;
    });

    // Dropdown menu functionality (for sidebar)
    document.querySelectorAll('.dropdown-btn').forEach(button => {
        button.addEventListener('click', function() {
            const parent = this.parentElement;
            document.querySelectorAll('.sidebar ul li.open').forEach(item => {
                if (item !== parent) {
                    item.classList.remove('open');
                }
            });
            parent.classList.toggle('open');
        });
    });

    // Initialize the page
    fetchCustomerData(); // Fetch customer data first
    fetchTableData();    // Then fetch gate pass data
});
