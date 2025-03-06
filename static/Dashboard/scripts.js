document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("company-form");
    const table = document.getElementById("company-table");
    const searchRow = document.getElementById("searchRow");
    const tbody = table.querySelector("tbody");
    const pagination = document.getElementById("pagination");
    const stateField = document.querySelector('[name="state"]');
    const regionCodeField = document.querySelector('[name="regionCode"]');

    let isEditing = false;
    let editingCompanyId = null;
    const rowsPerPage = 10; // Number of rows per page
    let currentPage = 1;
    
    // Mapping of Indian states to their numeric region codes
    const stateToRegionCode = {
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
        if (stateToRegionCode[selectedState]) {
            regionCodeField.value = stateToRegionCode[selectedState]; // Auto-fill region code
        } else {
            regionCodeField.value = ""; // Clear if no valid state is selected
        }
    });

    // Fetch data from the backend and render table
    const fetchTableData = () => {
        fetch('/api/company-master')
            .then(response => response.json())
            .then(data => {
                renderPage(data, currentPage);
                updatePagination(data.length);
                localStorage.setItem("companyMasterData", JSON.stringify(data));
            })
            .catch(error => {
                console.error('Error fetching companies:', error);
            });
    };

    // Save company data (Add or Edit)
    form.addEventListener("submit", (event) => {
        event.preventDefault();

        // Re-enable disabled fields so that their values are included in the submission
        form.querySelector('[name="companyCode"]').disabled = false;
        form.querySelector('[name="regionCode"]').disabled = false;

        const formData = new FormData(form);
        const companyData = Object.fromEntries(formData.entries());

        // Modify the endpoint and method based on editing state
        const url = isEditing ? `/update_company/${editingCompanyId}` : '/add_company';
        const method = isEditing ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(companyData),
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            form.reset();
            // Re-enable the fields when resetting the form
            form.querySelector('[name="companyCode"]').disabled = false;
            form.querySelector('[name="regionCode"]').disabled = false;
            isEditing = false;
            editingCompanyId = null;
            fetchTableData(); // Reload data
        })
        .catch(error => {
            console.error('Error processing company:', error);
            alert('An error occurred while processing the company.');
        });
    });

    // Render table based on current page
    const renderPage = (data, page) => {
        const start = (page - 1) * rowsPerPage;
        const end = page * rowsPerPage;
        const pageData = data.slice(start, end);

        tbody.innerHTML = ""; // Clear existing rows

        // Define the order and mapping of fields (as per the updated schema)
        const fieldOrder = [
            { key: 'CompanyCode', formName: 'companyCode' },
            { key: 'CompanyName', formName: 'companyName' },
            { key: 'Address1', formName: 'address1' },
            { key: 'Address2', formName: 'address2' },
            { key: 'Place', formName: 'place' },
            { key: 'PinCode', formName: 'pinCode' },
            { key: 'City', formName: 'city' },
            { key: 'State', formName: 'state' },
            { key: 'RegionCode', formName: 'regionCode' },
            { key: 'Country', formName: 'country' },
            { key: 'TelephoneNo', formName: 'telephoneNo' },
            { key: 'PANNo', formName: 'panNo' },
            { key: 'TNGSTNo', formName: 'tngstNo' },
            { key: 'CSTNo', formName: 'cstNo' },
            { key: 'TINNo', formName: 'tinNo' },
            { key: 'GSTNo', formName: 'gstNo' },
            { key: 'CINNo', formName: 'cinNo' },
            { key: 'PersonName', formName: 'personName' },
            { key: 'PersonDesignation', formName: 'personDesignation' }
        ];

        pageData.forEach(company => {
            const row = document.createElement("tr");
            row.dataset.companyId = company.CompanyID; // Store CompanyID in row

            // Create cells in the specific order
            fieldOrder.forEach(field => {
                const cell = document.createElement("td");
                cell.textContent = company[field.key] || ''; // Use empty string if value is undefined
                cell.dataset.field = field.formName.toLowerCase(); // Lowercase for form field mapping
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
                renderPage(JSON.parse(localStorage.getItem("companyMasterData")) || [], currentPage);
                updatePagination(JSON.parse(localStorage.getItem("companyMasterData"))?.length || 0);
            });
            pagination.appendChild(button);
        }
    };

    // Event listener for row click (populate form fields with clicked row data)
    tbody.addEventListener("click", (event) => {
        const row = event.target.closest("tr");
        if (!row) return;

        isEditing = true;
        editingCompanyId = row.dataset.companyId;

        // Mapping to match form field names
        const fieldMapping = {
            'companycode': 'companyCode',
            'companyname': 'companyName',
            'address1': 'address1',
            'address2': 'address2',
            'place': 'place',
            'pincode': 'pinCode',
            'city': 'city',
            'state': 'state',
            'regioncode': 'regionCode',
            'country': 'country',
            'telephoneno': 'telephoneNo',
            'panno': 'panNo',
            'tngstno': 'tngstNo',
            'cstno': 'cstNo',
            'tinno': 'tinNo',
            'gstno': 'gstNo',
            'cinno': 'cinNo',
            'personname': 'personName',
            'persondesignation': 'personDesignation'
        };

        // Populate the form fields from the clicked row
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

        // Freeze (disable) the Company Code and Region Code fields for editing
        form.querySelector('[name="companyCode"]').disabled = true;
        form.querySelector('[name="regionCode"]').disabled = true;
    });

    // Search functionality
    searchRow.addEventListener("input", (event) => {
        const searchTerm = event.target.value.toLowerCase().trim();
        const column = event.target.getAttribute("data-column");

        // Retrieve full data from localStorage
        const fullData = JSON.parse(localStorage.getItem("companyMasterData")) || [];
        if (searchTerm === "") {
            renderPage(fullData, currentPage);
            updatePagination(fullData.length);
            return;
        }

        // Filter based on search term
        const filteredData = fullData.filter(company => {
            if (column) {
                const fieldMap = {
                    'companyCode': 'CompanyCode',
                    'companyName': 'CompanyName',
                    'address1': 'Address1',
                    'address2': 'Address2',
                    'place': 'Place',
                    'pinCode': 'PinCode',
                    'city': 'City',
                    'state': 'State',
                    'regionCode': 'RegionCode',
                    'country': 'Country',
                    'telephoneNo': 'TelephoneNo',
                    'panNo': 'PANNo',
                    'tngstNo': 'TNGSTNo',
                    'cstNo': 'CSTNo',
                    'tinNo': 'TINNo',
                    'gstNo': 'GSTNo',
                    'cinNo': 'CINNo',
                    'personName': 'PersonName',
                    'personDesignation': 'PersonDesignation'
                };
                const mappedColumn = fieldMap[column];
                return company[mappedColumn]
                    ? company[mappedColumn].toString().toLowerCase().includes(searchTerm)
                    : false;
            }
            // Search across all fields if no specific column provided
            return Object.values(company).some(value =>
                value ? value.toString().toLowerCase().includes(searchTerm) : false
            );
        });

        renderPage(filteredData, 1);
        updatePagination(filteredData.length);
    });

    // Dropdown functionality for sidebar menus
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
