document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("purchase-request-form");
    const table = document.getElementById("purchase-table");
    const searchRow = document.getElementById("searchRow");
    const tbody = table.querySelector("tbody");
    const pagination = document.getElementById("pagination");
    const supplierCodeSelect = document.getElementById("supplier-code");
    const supplierNameSelect = document.getElementById("supplier-name");
    const requestedByField = document.getElementById("requested-by");
    const prNoSelect = document.getElementById("pr-no"); // Added PR No select element

    let isEditing = false;
    let editingRequestId = null;
    const rowsPerPage = 10;
    let currentPage = 1;

    // Get the username display element
    const usernameDisplay = document.getElementById('username-display');
    
    // Fetch current user's name from the server
    fetch('/get_current_user')
        .then(response => response.json())
        .then(data => {
            if (data.username) {
                if (usernameDisplay.textContent === '') {
                    usernameDisplay.textContent = data.username;
                }
                requestedByField.value = data.username;
            }
        })
        .catch(error => console.error('Error fetching user info:', error));

    // New function to fetch PR numbers from create purchase request
    const fetchPRNumbers = () => {
        fetch('/api/purchase-request')
            .then(response => response.json())
            .then(data => {
                prNoSelect.innerHTML = '<option value="">--Select--</option>';
                // Add PR numbers to dropdown
                data.forEach(request => {
                    if (request.PRNo) {
                        const option = document.createElement('option');
                        option.value = request.PRNo;
                        option.textContent = request.PRNo;
                        prNoSelect.appendChild(option);
                    }
                });
            })
            .catch(error => console.error('Error fetching PR numbers:', error));
    };

    // Fetch suppliers data and populate dropdowns
    const fetchSuppliers = () => {
        fetch('/api/suppliers')
            .then(response => response.json())
            .then(suppliers => {
                supplierCodeSelect.innerHTML = '<option value="">--Select--</option>';
                supplierNameSelect.innerHTML = '<option value="">--Select--</option>';

                suppliers.forEach(supplier => {
                    const codeOption = document.createElement('option');
                    codeOption.value = supplier.SupplierCode;
                    codeOption.textContent = supplier.SupplierCode;
                    supplierCodeSelect.appendChild(codeOption);

                    const nameOption = document.createElement('option');
                    nameOption.value = supplier.SupplierCode;
                    nameOption.textContent = supplier.SupplierName;
                    supplierNameSelect.appendChild(nameOption);
                });
            })
            .catch(error => console.error('Error fetching suppliers:', error));
    };

    // Link supplier dropdowns
    supplierCodeSelect.addEventListener('change', (event) => {
        supplierNameSelect.value = event.target.value;
    });
    supplierNameSelect.addEventListener('change', (event) => {
        supplierCodeSelect.value = event.target.value;
    });

    // Fetch table data
    const fetchTableData = () => {
        fetch('/api/update-purchase-request')
            .then(response => response.json())
            .then(data => {
                renderPage(data, currentPage);
                updatePagination(data.length);
                localStorage.setItem("updatePurchaseRequestData", JSON.stringify(data));
            })
            .catch(error => console.error('Error fetching update purchase requests:', error));
    };

    // Form submit handler
    form.addEventListener("submit", (event) => {
        event.preventDefault();

        // Re-enable the fields so their values are included in the FormData
        form.querySelector('[name="plant"]').disabled = false;
        form.querySelector('[name="supplierCode"]').disabled = false;
        form.querySelector('[name="supplierName"]').disabled = false;
        form.querySelector('[name="prDate"]').disabled = false;
        form.querySelector('[name="department"]').disabled = false;

        const formData = new FormData(form);
        const requestData = Object.fromEntries(formData.entries());
        requestData.newPart = form.querySelector('#new-part').checked;

        const url = isEditing ? `/update_update_purchase/${editingRequestId}` : '/add_update_purchase_request';
        const method = isEditing ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
        })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                form.reset();
                isEditing = false;
                editingRequestId = null;
                fetchTableData();

                // Freeze these five fields after submission
                form.querySelector('[name="plant"]').disabled = true;
                form.querySelector('[name="supplierCode"]').disabled = true;
                form.querySelector('[name="supplierName"]').disabled = true;
                form.querySelector('[name="prDate"]').disabled = true;
                form.querySelector('[name="department"]').disabled = true;
            })
            .catch(error => {
                console.error('Error processing purchase request:', error);
                alert('An error occurred while processing the purchase request.');
            });
    });

    // Render table page
    const renderPage = (data, page) => {
        const start = (page - 1) * rowsPerPage;
        const end = page * rowsPerPage;
        const pageData = data.slice(start, end);

        tbody.innerHTML = "";
        pageData.forEach(request => {
            const row = document.createElement("tr");
            row.dataset.requestId = request.id;
            row.dataset.fullData = JSON.stringify(request);

            const displayFields = [
                { key: 'PartNumber', formName: 'partNumber' },
                { key: 'PartName', formName: 'partName' },
                { key: 'UOM', formName: 'uom' },
                { key: 'Quantity', formName: 'quantity' },
                { key: 'CurrencyType', formName: 'currencyType' },
                { key: 'UnitPrice', formName: 'unitPrice' },
                { key: 'RequiredDate', formName: 'requiredDate' }
            ];

            displayFields.forEach(field => {
                const cell = document.createElement("td");
                let value = request[field.key] || '';
                if (field.key === 'RequiredDate' && value) {
                    cell.dataset.isoDate = new Date(value).toISOString().split('T')[0];
                    value = new Date(value).toLocaleDateString();
                }
                cell.textContent = value;
                cell.dataset.field = field.formName;
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
  const requestId = row.dataset.requestId;

  if (confirm("Are you sure you want to delete this update purchase request?")) {
    fetch(`/delete_update_purchase_request/${requestId}`, {
      method: 'DELETE'
    })
      .then(response => response.json())
      .then(data => {
        alert(data.message);
        row.remove();

        // Update localStorage data
        const fullData = JSON.parse(localStorage.getItem("updatePurchaseRequestData")) || [];
        const updatedData = fullData.filter(request => request.id !== requestId);
        localStorage.setItem("updatePurchaseRequestData", JSON.stringify(updatedData));

        // Update pagination
        updatePagination(updatedData.length);
      })
      .catch(error => {
        console.error("Error deleting update purchase request:", error);
        alert("Error deleting update purchase request.");
      });
  }
});

// Append delete cell to the row
row.appendChild(deleteCell);

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
                const data = JSON.parse(localStorage.getItem("updatePurchaseRequestData")) || [];
                renderPage(data, currentPage);
                updatePagination(data.length);
            });
            pagination.appendChild(button);
        }
    };

    // Handle row click - populate all form fields
    tbody.addEventListener("click", (event) => {
        const row = event.target.closest("tr");
        if (!row) return;

        try {
            const fullData = JSON.parse(row.dataset.fullData);
            isEditing = true;
            editingRequestId = fullData.id;

            // Map and populate all form fields
            const fieldMappings = {
                'Corporate': 'corporate',
                'Plant': 'plant',
                'PRNo': 'prNo',
                'SupplierCode': 'supplierCode',
                'SupplierName': 'supplierName',
                'PRDate': 'prDate',
                'Department': 'department',
                'RequestedBy': 'requestedBy',
                'Category': 'category',
                'PartName': 'partName',
                'PartNumber': 'partNumber',
                'Quantity': 'quantity',
                'NewPart': 'newPart',
                'CurrencyType': 'currencyType',
                'UnitPrice': 'unitPrice',
                'UOM': 'uom',
                'RequiredDate': 'requiredDate'
            };

            Object.entries(fieldMappings).forEach(([backendField, formField]) => {
                const formElement = form.querySelector(`[name="${formField}"]`);
                if (!formElement) return;

                const value = fullData[backendField];
                if (formElement.type === 'checkbox') {
                    formElement.checked = value === true;
                } else if (formElement.type === 'date' && value) {
                    formElement.value = new Date(value).toISOString().split('T')[0];
                } else if (formElement.tagName === 'SELECT') {
                    const options = Array.from(formElement.options);
                    const matchingOption = options.find(opt => 
                        opt.value === value || opt.textContent === value
                    );
                    if (matchingOption) {
                        formElement.value = matchingOption.value;
                    }
                } else {
                    formElement.value = value || '';
                }
            });

            // Trigger change events for linked dropdowns
            supplierCodeSelect.dispatchEvent(new Event('change'));
            supplierNameSelect.dispatchEvent(new Event('change'));

            // Freeze these five fields when editing:
            // Plant, Supplier Code, Supplier Name, PR Date, Department
            form.querySelector('[name="plant"]').disabled = true;
            form.querySelector('[name="supplierCode"]').disabled = true;
            form.querySelector('[name="supplierName"]').disabled = true;
            form.querySelector('[name="prDate"]').disabled = true;
            form.querySelector('[name="department"]').disabled = true;

        } catch (error) {
            console.error('Error populating form:', error);
            alert('Error populating form fields');
        }
    });

    // Search functionality
    searchRow.addEventListener("input", (event) => {
        const searchTerm = event.target.value.toLowerCase().trim();
        const column = event.target.getAttribute("data-column");
        const fullData = JSON.parse(localStorage.getItem("updatePurchaseRequestData")) || [];

        if (searchTerm === "") {
            renderPage(fullData, currentPage);
            updatePagination(fullData.length);
            return;
        }

        const filteredData = fullData.filter(request => {
            if (column) {
                const fieldMap = {
                    'partNumber': 'PartNumber',
                    'partName': 'PartName',
                    'uom': 'UOM',
                    'quantity': 'Quantity',
                    'currencyType': 'CurrencyType',
                    'unitPrice': 'UnitPrice',
                    'requiredDate': 'RequiredDate'
                };

                const mappedColumn = fieldMap[column];
                const value = request[mappedColumn];
                return value ? value.toString().toLowerCase().includes(searchTerm) : false;
            }

            return Object.values(request).some(value =>
                value ? value.toString().toLowerCase().includes(searchTerm) : false
            );
        });

        renderPage(filteredData, 1);
        updatePagination(filteredData.length);
    });

    prNoSelect.addEventListener('change', async (event) => {
        const selectedPRNo = event.target.value;
        if (!selectedPRNo) {
            form.reset();
            return;
        }

        try {
            // Show loading state
            const loadingMessage = document.createElement('div');
            loadingMessage.textContent = 'Loading PR details...';
            loadingMessage.style.color = 'blue';
            form.insertBefore(loadingMessage, form.firstChild);

            // First, try to fetch from the original endpoint
            let response = await fetch(`/api/purchase-request/${selectedPRNo}`);
            let data;

            if (!response.ok) {
                console.log('Trying alternative endpoint...');
                // If first endpoint fails, try fetching from the main PR endpoint
                response = await fetch('/api/purchase-request');
                const allPRs = await response.json();
                // Find the matching PR
                data = allPRs.find(pr => pr.PRNo === selectedPRNo);
                
                if (!data) {
                    throw new Error('PR not found in either endpoint');
                }
            } else {
                data = await response.json();
            }

            // Remove loading message
            loadingMessage.remove();

            console.log('Fetched PR Data:', data); // Debug log

            // Map and populate all form fields
            const fieldMappings = {
                'Corporate': 'corporate',
                'Plant': 'plant',
                'SupplierCode': 'supplierCode',
                'SupplierName': 'supplierName',
                'PRDate': 'prDate',
                'Department': 'department',
                'RequestedBy': 'requestedBy',
                'Category': 'category',
                'PartName': 'partName',
                'PartNumber': 'partNumber',
                'Quantity': 'quantity',
                'NewPart': 'newPart',
                'CurrencyType': 'currencyType',
                'UnitPrice': 'unitPrice',
                'UOM': 'uom',
                'RequiredDate': 'requiredDate'
            };

            let populatedFields = 0; // Counter for successful field populations

            Object.entries(fieldMappings).forEach(([backendField, formField]) => {
                const formElement = form.querySelector(`[name="${formField}"]`);
                if (!formElement) {
                    console.warn(`Form element not found for field: ${formField}`);
                    return;
                }

                const value = data[backendField];
                console.log(`Setting ${formField} to value:`, value); // Debug log

                try {
                    if (formElement.type === 'checkbox') {
                        formElement.checked = value === true;
                        populatedFields++;
                    } else if (formElement.type === 'date' && value) {
                        const dateValue = new Date(value).toISOString().split('T')[0];
                        formElement.value = dateValue;
                        populatedFields++;
                    } else if (formElement.tagName === 'SELECT') {
                        const options = Array.from(formElement.options);
                        const matchingOption = options.find(opt => 
                            opt.value === value || opt.textContent === value
                        );
                        if (matchingOption) {
                            formElement.value = matchingOption.value;
                            populatedFields++;
                        } else {
                            console.warn(`No matching option found for ${formField} with value: ${value}`);
                        }
                    } else {
                        formElement.value = value || '';
                        if (value) populatedFields++;
                    }
                } catch (fieldError) {
                    console.error(`Error setting field ${formField}:`, fieldError);
                }
            });

            console.log(`Successfully populated ${populatedFields} fields`);

            // Trigger change events for linked dropdowns
            supplierCodeSelect.dispatchEvent(new Event('change'));
            supplierNameSelect.dispatchEvent(new Event('change'));

            // Freeze specific fields
            const fieldsToFreeze = ['plant', 'supplierCode', 'supplierName', 'prDate', 'department'];
            fieldsToFreeze.forEach(fieldName => {
                const element = form.querySelector(`[name="${fieldName}"]`);
                if (element) {
                    element.disabled = true;
                } else {
                    console.warn(`Could not find element to freeze: ${fieldName}`);
                }
            });

            // Show success message
            const successMessage = document.createElement('div');
            successMessage.textContent = `PR details loaded successfully (${populatedFields} fields populated)`;
            successMessage.style.color = 'green';
            form.insertBefore(successMessage, form.firstChild);
            setTimeout(() => successMessage.remove(), 3000);

        } catch (error) {
            console.error('Detailed error fetching PR details:', error);
            
            // Remove loading message if it exists
            const existingLoadingMessage = form.querySelector('div');
            if (existingLoadingMessage) {
                existingLoadingMessage.remove();
            }

            // Show error message to user
            const errorMessage = document.createElement('div');
            errorMessage.textContent = `Error loading PR details: ${error.message}. Please try again or contact support.`;
            errorMessage.style.color = 'red';
            form.insertBefore(errorMessage, form.firstChild);
            setTimeout(() => errorMessage.remove(), 5000);
        }
    });

    // Initialize dropdown functionality for sidebar menu
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

    fetchSuppliers();
    fetchPRNumbers(); // Add this line to fetch PR numbers on load
    fetchTableData();
});