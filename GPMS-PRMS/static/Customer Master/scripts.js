document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("customer-form");
    const table = document.getElementById("customer-table");
    const searchRow = document.getElementById("searchRow");
    const tbody = table.querySelector("tbody");
    const pagination = document.getElementById("pagination");
    const stateField = document.querySelector('[name="state"]');
    const stateCodeField = document.querySelector('[name="stateCode"]');

    let isEditing = false;
    let editingCustomerId = null;
    const rowsPerPage = 10;
    let currentPage = 1;

    // Mapping of Indian states to their numeric region codes
    const stateToStateCode = {
        "Andhra Pradesh": "37", "Arunachal Pradesh": "12", "Assam": "18",
        "Bihar": "10", "Chhattisgarh": "22", "Goa": "30",
        "Gujarat": "24", "Haryana": "06", "Himachal Pradesh": "02",
        "Jharkhand": "20", "Karnataka": "29", "Kerala": "32",
        "Madhya Pradesh": "23", "Maharashtra": "27", "Manipur": "14",
        "Meghalaya": "17", "Mizoram": "15", "Nagaland": "13",
        "Odisha": "21", "Punjab": "03", "Rajasthan": "08",
        "Sikkim": "11", "Tamil Nadu": "33", "Telangana": "36",
        "Tripura": "16", "Uttar Pradesh": "09", "Uttarakhand": "05",
        "West Bengal": "19",

        // Union Territories (UT)
        "Andaman and Nicobar Islands": "35", "Chandigarh": "04",
        "Dadra and Nagar Haveli and Daman and Diu": "26",
        "Lakshadweep": "31", "Delhi": "07", "Puducherry": "34",
        "Ladakh": "38", "Jammu and Kashmir": "39"
    };

    // Auto-fill region code when a state is selected
    stateField.addEventListener("change", () => {
        const selectedState = stateField.value;
        if (stateToStateCode[selectedState]) {
            stateCodeField.value = stateToStateCode[selectedState]; // Auto-fill region code
        } else {
            stateCodeField.value = ""; // Clear if no valid state is selected
        }
    });

    // Ensure the form submission validates both fields
    form.addEventListener("submit", (event) => {
        if (!stateField.value || !stateCodeField.value) {
            event.preventDefault();
            alert("Both State and State Code fields are required.");
        }
    });

    // Fetch data from the backend and render table
    const fetchTableData = () => {
        fetch('/api/customer-master')
            .then(response => response.json())
            .then(data => {
                renderPage(data, currentPage);
                updatePagination(data.length);
                localStorage.setItem("customerMasterData", JSON.stringify(data));
            })
            .catch(error => {
                console.error('Error fetching customers:', error);
            });
    };

    // Save customer data (Add or Edit)
    form.addEventListener("submit", (event) => {
        event.preventDefault();

        form.querySelector('[name="customerCode"]').disabled = false;
        form.querySelector('[name="customerName"]').disabled = false;
        form.querySelector('[name="companyCode"]').disabled = false;

        const formData = new FormData(form);
        const customerData = Object.fromEntries(formData.entries());

        // Handle checkbox values
        customerData.isDefaultBilling = form.querySelector("#is-default-billing").checked;
        customerData.isDefaultShipping = form.querySelector("#is-default-shipping").checked;

        const url = isEditing ? `/update_customer/${editingCustomerId}` : '/add_customer';
        const method = isEditing ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(customerData),
        })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                form.reset();
                // After submitting (whether adding or editing), reset the editing state...
                isEditing = false;
                editingCustomerId = null;
                // Re-enable the frozen fields for a new customer entry
                form.querySelector('[name="customerCode"]').disabled = false;
                form.querySelector('[name="customerName"]').disabled = false;
                form.querySelector('[name="companyCode"]').disabled = false;
                fetchTableData();
            })
            .catch(error => {
                console.error('Error processing customer:', error);
                alert('An error occurred while processing the customer.');
            });
    });

    // Render table based on current page
    const renderPage = (data, page) => {
        const start = (page - 1) * rowsPerPage;
        const end = page * rowsPerPage;
        const pageData = data.slice(start, end);

        tbody.innerHTML = "";
        pageData.forEach(customer => {
            const row = document.createElement("tr");
            row.dataset.customerId = customer.CustomerID;

            const fieldOrder = [
                { key: 'CustomerCode', formName: 'customerCode' },
                { key: 'CustomerName', formName: 'customerName' },
                { key: 'CompanyCode', formName: 'companyCode' },
                { key: 'FaxNo', formName: 'faxNo' },
                { key: 'CustomerPlantName', formName: 'customerPlantName' },
                { key: 'GSTNo', formName: 'gstNo' },
                { key: 'Address', formName: 'address' },
                { key: 'Country', formName: 'country' },
                { key: 'State', formName: 'state' },
                { key: 'StateCode', formName: 'stateCode' },
                { key: 'PinCode', formName: 'pinCode' },
                { key: 'ContactPerson', formName: 'contactPerson' },
                { key: 'PhoneNo', formName: 'phoneNo' },
                { key: 'MobileNo', formName: 'mobileNo' },
                { key: 'EmailID', formName: 'emailId' },
                { key: 'IsDefaultBilling', formName: 'isDefaultBilling' },
                { key: 'IsDefaultShipping', formName: 'isDefaultShipping' }
            ];

            fieldOrder.forEach(field => {
                const cell = document.createElement("td");
                if (field.key === 'IsDefaultBilling' || field.key === 'IsDefaultShipping') {
                    cell.textContent = customer[field.key] ? 'Yes' : 'No';
                } else {
                    cell.textContent = customer[field.key] || '';
                }
                // Using lowercase for the data-field attribute
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
                const data = JSON.parse(localStorage.getItem("customerMasterData")) || [];
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

    // Event listener for row click to enter editing mode
    tbody.addEventListener("click", (event) => {
        const row = event.target.closest("tr");
        if (!row) return;

        isEditing = true;
        editingCustomerId = row.dataset.customerId;

        const fieldMapping = {
            'customercode': 'customerCode',
            'customername': 'customerName',
            'companycode': 'companyCode',
            'faxno': 'faxNo',
            'customerplantname': 'customerPlantName',
            'gstno': 'gstNo',
            'address': 'address',
            'country': 'country',
            'state': 'state',
            'statecode': 'stateCode',
            'pincode': 'pinCode',
            'contactperson': 'contactPerson',
            'phoneno': 'phoneNo',
            'mobileno': 'mobileNo',
            'emailid': 'emailId',
            'isdefaultbilling': 'isDefaultBilling',
            'isdefaultshipping': 'isDefaultShipping'
        };

        Array.from(row.children).forEach(cell => {
            const fieldName = cell.dataset.field;
            if (fieldName) {
                const formFieldName = fieldMapping[fieldName] || fieldName;
                const formField = form.querySelector(`[name="${formFieldName}"]`);

                if (formField) {
                    if (fieldName === 'isdefaultbilling' || fieldName === 'isdefaultshipping') {
                        formField.checked = cell.textContent === 'Yes';
                    } else {
                        formField.value = cell.textContent.trim();
                    }
                    // Freeze (disable) the Customer Code, Customer Name, and Company Code fields in edit mode.
                    if (formField.name === 'customerCode' || formField.name === 'customerName' || formField.name === 'companyCode') {
                        formField.disabled = true;
                    }
                }
            }
        });
    });

    // Search functionality
    searchRow.addEventListener("input", (event) => {
        const searchTerm = event.target.value.toLowerCase().trim();
        const column = event.target.getAttribute("data-column");

        const fullData = JSON.parse(localStorage.getItem("customerMasterData")) || [];

        if (searchTerm === "") {
            renderPage(fullData, currentPage);
            updatePagination(fullData.length);
            return;
        }

        const filteredData = fullData.filter(customer => {
            if (column) {
                const fieldMap = {
                    'customerCode': 'CustomerCode',
                    'customerName': 'CustomerName',
                    'companyCode': 'CompanyCode',
                    'faxNo': 'FaxNo',
                    'customerPlantName': 'CustomerPlantName',
                    'gstNo': 'GSTNo',
                    'address': 'Address',
                    'country': 'Country',
                    'state': 'State',
                    'stateCode': 'StateCode',
                    'pinCode': 'PinCode',
                    'contactPerson': 'ContactPerson',
                    'phoneNo': 'PhoneNo',
                    'mobileNo': 'MobileNo',
                    'emailId': 'EmailID',
                    'isDefaultBilling': 'IsDefaultBilling',
                    'isDefaultShipping': 'IsDefaultShipping'
                };

                const mappedColumn = fieldMap[column];
                const value = customer[mappedColumn];
                
                if (typeof value === 'boolean') {
                    const searchValue = searchTerm === 'yes' ? true : searchTerm === 'no' ? false : null;
                    return searchValue !== null ? value === searchValue : false;
                }
                
                return value ? value.toString().toLowerCase().includes(searchTerm) : false;
            }

            return Object.values(customer).some(value => {
                if (typeof value === 'boolean') {
                    return (value ? 'yes' : 'no').includes(searchTerm);
                }
                return value ? value.toString().toLowerCase().includes(searchTerm) : false;
            });
        });

        renderPage(filteredData, 1);
        updatePagination(filteredData.length);
    });

    // Dropdown functionality
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

    // Clear form button functionality: reset editing state and re-enable the frozen fields.
    const clearButton = form.querySelector('button[type="reset"]');
    clearButton.addEventListener('click', () => {
        isEditing = false;
        editingCustomerId = null;
        // Re-enable fields for new customer entry
        form.querySelector('[name="customerCode"]').disabled = false;
        form.querySelector('[name="customerName"]').disabled = false;
        form.querySelector('[name="companyCode"]').disabled = false;
    });

    // Load initial data
    fetchTableData();
});
