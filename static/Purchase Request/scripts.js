document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("purchase-request-form");
    const table = document.getElementById("purchase-table");
    const searchRow = document.getElementById("searchRow");
    const tbody = table.querySelector("tbody");
    const pagination = document.getElementById("pagination");
    const mailDetailsForm = document.getElementById("mail-details-form");
    const supplierCodeSelect = document.getElementById("supplier-code");
    const supplierNameSelect = document.getElementById("supplier-name");
    const requestedByField = document.getElementById("requested-by"); 

    let isEditing = false;
    let editingRequestId = null;
    const rowsPerPage = 10;
    let currentPage = 1;

    // Get the username display element
    const usernameDisplay = document.getElementById('username-display');
    
    // Fetch current user's name from the server and update both display and requested-by field
    fetch('/get_current_user')
        .then(response => response.json())
        .then(data => {
            if (data.username) {
                if (usernameDisplay.textContent === '') {
                    usernameDisplay.textContent = data.username;
                }
                // Set the requested-by field with the username
                requestedByField.value = data.username;
            }
        })
        .catch(error => console.error('Error fetching user info:', error));
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
            .catch(error => {
                console.error('Error fetching suppliers:', error);
            });
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
        fetch('/api/purchase-request')
            .then(response => response.json())
            .then(data => {
                localStorage.setItem("purchaseRequestData", JSON.stringify(data));
                renderPage(data, currentPage);
                updatePagination(data.length);
            })
            .catch(error => {
                console.error('Error fetching purchase requests:', error);
            });
    };

    // Function to generate PR No.
    const generatePRNo = () => {
        // Get current year (last two digits)
        const now = new Date();
        const year = now.getFullYear() % 100; // e.g. 2025 -> 25
        const yearStr = year.toString().padStart(2, '0');

        // Fixed plant code (modify if needed)
        const plantCode = "1101";

        // Retrieve existing purchase requests from localStorage
        const purchaseRequests = JSON.parse(localStorage.getItem("purchaseRequestData")) || [];

        // Look for PR Nos. that match the current year and plant code
        const prefix = `PR${yearStr}${plantCode}`;
        let maxSerial = 0;
        purchaseRequests.forEach(pr => {
            if (pr.PRNo && pr.PRNo.startsWith(prefix)) {
                // Extract the last 5 digits (serial)
                const serialPart = pr.PRNo.slice(prefix.length);
                const serialNum = parseInt(serialPart, 10);
                if (!isNaN(serialNum) && serialNum > maxSerial) {
                    maxSerial = serialNum;
                }
            }
        });
        // Increment serial for the new PR No.
        const newSerial = (maxSerial + 1).toString().padStart(5, '0');
        return `${prefix}${newSerial}`;
    };

    // Save purchase request data (with auto-generated PR No. when not editing)
    form.addEventListener("submit", (event) => {
        event.preventDefault();

        // If this is a new purchase request (not editing), generate the PR No.
        if (!isEditing) {
            const prNoField = form.querySelector('[name="prNo"]');
            // Generate and set the PR No.
            prNoField.value = generatePRNo();
        }

        // Re-enable the fields so their values are included in the FormData
        form.querySelector('[name="plant"]').disabled = false;
        form.querySelector('[name="supplierCode"]').disabled = false;
        form.querySelector('[name="supplierName"]').disabled = false;
        form.querySelector('[name="prDate"]').disabled = false;
        form.querySelector('[name="department"]').disabled = false;

        const formData = new FormData(form);
        const requestData = Object.fromEntries(formData.entries());
        requestData.newPart = form.querySelector('#new-part').checked;

        const url = isEditing ? `/update_purchase/${editingRequestId}` : '/add_purchase_request';
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

  if (confirm("Are you sure you want to delete this purchase request?")) {
    fetch(`/delete_purchase/${requestId}`, {
      method: 'DELETE'
    })
      .then(response => response.json())
      .then(data => {
        alert(data.message);
        row.remove();

        // Update localStorage data
        const fullData = JSON.parse(localStorage.getItem("purchaseRequestData")) || [];
        const updatedData = fullData.filter(request => request.id !== requestId);
        localStorage.setItem("purchaseRequestData", JSON.stringify(updatedData));

        // Update pagination
        updatePagination(updatedData.length);
      })
      .catch(error => {
        console.error("Error deleting purchase request:", error);
        alert("Error deleting purchase request.");
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
                const data = JSON.parse(localStorage.getItem("purchaseRequestData")) || [];
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
        const fullData = JSON.parse(localStorage.getItem("purchaseRequestData")) || [];

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

    // Mail details form handler
    mailDetailsForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(mailDetailsForm);
        
        fetch('/add_mail_details', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            mailDetailsForm.reset();
        })
        .catch(error => {
            console.error('Error processing mail details:', error);
            alert('An error occurred while processing the mail details.');
        });
    });

    // File input validation
    const attachmentInput = document.getElementById("attachment");
    attachmentInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                alert("File size should not exceed 5MB");
                attachmentInput.value = "";
            }
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

    // Initial data load
    fetchSuppliers();
    fetchTableData();
});
