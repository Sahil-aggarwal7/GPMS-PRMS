document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("plant-form");
    const table = document.getElementById("plant-table");
    const searchRow = document.getElementById("searchRow");
    const tbody = table.querySelector("tbody");
    const pagination = document.getElementById("pagination");
    const stateField = document.querySelector('[name="state"]');
    const regionCodeField = document.querySelector('[name="regionCode"]');

    let isEditing = false;
    let editingPlantId = null;
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

    // Ensure the form submission validates both fields
    form.addEventListener("submit", (event) => {
        if (!stateField.value || !regionCodeField.value) {
            event.preventDefault();
            alert("Both State and Region Code fields are required.");
        }
    });

    // Utility functions to freeze or unfreeze the key fields
    const freezeFields = () => {
        const fieldsToFreeze = ['companyCode', 'plantCode', 'plantName', 'regionCode'];
        fieldsToFreeze.forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.disabled = true;
            }
        });
    };

    const unfreezeFields = () => {
        const fieldsToFreeze = ['companyCode', 'plantCode', 'plantName', 'regionCode'];
        fieldsToFreeze.forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.disabled = false;
            }
        });
    };

    // Fetch data from the backend and render table
    const fetchTableData = () => {
        fetch('/api/plant-warehouse-master') // Flask API endpoint
            .then(response => response.json())
            .then(data => {
                renderPage(data, currentPage);
                updatePagination(data.length);
                localStorage.setItem("plantWarehouseMasterData", JSON.stringify(data));
            })
            .catch(error => {
                console.error('Error fetching plant data:', error);
            });
    };

    // Save plant data (Add or Edit)
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        unfreezeFields();

        const formData = new FormData(form);
        const plantData = Object.fromEntries(formData.entries());

        // Modify the endpoint and method based on editing state
        const url = isEditing ? `/update_plant_warehouse/${editingPlantId}` : '/add_plant_warehouse';
        const method = isEditing ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(plantData),
        })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                form.reset();
                // Freeze key fields after submission
                freezeFields();
                isEditing = false;
                editingPlantId = null;
                fetchTableData(); // Reload data
            })
            .catch(error => {
                console.error('Error processing plant data:', error);
                alert('An error occurred while processing the plant data.');
            });
    });

    // When the form is reset (e.g., Clear button), re-enable the frozen fields.
    form.addEventListener("reset", () => {
        unfreezeFields();
        isEditing = false;
        editingPlantId = null;
    });

    // Render table based on current page
    const renderPage = (data, page) => {
        const start = (page - 1) * rowsPerPage;
        const end = page * rowsPerPage;
        const pageData = data.slice(start, end);

        tbody.innerHTML = ""; // Clear existing rows
        pageData.forEach(plant => {
            const row = document.createElement("tr");
            row.dataset.plantId = plant.PlantID; // Store PlantID in row

            // Define the specific order and mapping of fields (only the ones in the table)
            const fieldOrder = [
                { key: 'CompanyCode', formName: 'companyCode' },
                { key: 'CompanyName', formName: 'companyName' },
                { key: 'PlantCode', formName: 'plantCode' },
                { key: 'PlantName', formName: 'plantName' },
            ];

            // Create cells in the specific order
            fieldOrder.forEach(field => {
                const cell = document.createElement("td");
                cell.textContent = plant[field.key] || ''; // Use empty string if value is undefined
                cell.dataset.field = field.formName.toLowerCase(); // For form field matching
                row.appendChild(cell);
            });

            // Store the full plant data as a data attribute for form population
            row.dataset.fullData = JSON.stringify(plant);
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
                const data = JSON.parse(localStorage.getItem("plantWarehouseMasterData")) || [];
                renderPage(data, currentPage);
                // Update active state of pagination buttons
                document.querySelectorAll('.page-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.textContent == i);
                });
            });
            pagination.appendChild(button);
        }
    };

    // Event listener for row click (populate form fields with clicked row data)
    tbody.addEventListener("click", (event) => {
        const row = event.target.closest("tr");
        if (!row) return;

        isEditing = true;
        editingPlantId = row.dataset.plantId;

        // Get the full data stored in the row
        const fullData = JSON.parse(row.dataset.fullData);

        // Define the mapping between database fields and form fields
        const fieldMapping = {
            'CompanyCode': 'companyCode',
            'CompanyName': 'companyName',
            'PlantWarehouseType': 'plantWarehouseType',
            'PlantCode': 'plantCode',
            'PlantName': 'plantName',
            'Address1': 'address1',
            'Address2': 'address2',
            'City': 'city',
            'State': 'state',
            'Country': 'country',
            'PinCode': 'pinCode',
            'RegionCode': 'regionCode',
            'PANNumber': 'panNumber',
            'TINNumber': 'tinNumber',
            'GSTNumber': 'gstNumber',
            'Telephone': 'telephone',
            'CSTNumber': 'cstNumber',
            'CINNumber': 'cinNumber',
            'AuthorizedPerson': 'authorizedPerson',
            'AuthorizedDesignation': 'authorizedDesignation'
        };

        // Populate all form fields from the full data
        Object.entries(fieldMapping).forEach(([dbField, formField]) => {
            const formElement = form.querySelector(`[name="${formField}"]`);
            if (formElement && fullData[dbField] !== undefined) {
                formElement.value = fullData[dbField];
            }
        });

        freezeFields();
    });

    // Search functionality
    searchRow.addEventListener("input", (event) => {
        const searchTerm = event.target.value.toLowerCase().trim();
        let column = event.target.getAttribute("data-column");
        // Convert column to lowercase to match keys in our field map
        column = column ? column.toLowerCase() : null;

        // Retrieve the full data from localStorage
        const fullData = JSON.parse(localStorage.getItem("plantWarehouseMasterData")) || [];

        // If no search term, render the current page of full data
        if (searchTerm === "") {
            renderPage(fullData, currentPage);
            updatePagination(fullData.length);
            return;
        }

        // Filter data based on search term
        const filteredData = fullData.filter(plant => {
            if (column) {
                const fieldMap = {
                    'companycode': 'CompanyCode',
                    'companyname': 'CompanyName',
                    'plantcode': 'PlantCode',
                    'plantname': 'PlantName',
                };

                const mappedColumn = fieldMap[column];
                return plant[mappedColumn]
                    ? plant[mappedColumn].toString().toLowerCase().includes(searchTerm)
                    : false;
            }

            // Search across all fields
            return Object.values(plant).some(value =>
                value ? value.toString().toLowerCase().includes(searchTerm) : false
            );
        });

        renderPage(filteredData, 1);
        updatePagination(filteredData.length);
    });

    document.addEventListener("DOMContentLoaded", () => {
    // Mapping of Indian states to their numeric state codes
    const stateToRegionCode = {
        "Andhra Pradesh": "37",
        "Arunachal Pradesh": "12",
        "Assam": "18",
        "Bihar": "10",
        "Chhattisgarh": "22",
        "Goa": "30",
        "Gujarat": "24",
        "Haryana": "06",
        "Himachal Pradesh": "02",
        "Jharkhand": "20",
        "Karnataka": "29",
        "Kerala": "32",
        "Madhya Pradesh": "23",
        "Maharashtra": "27",
        "Manipur": "14",
        "Meghalaya": "17",
        "Mizoram": "15",
        "Nagaland": "13",
        "Odisha": "21",
        "Punjab": "03",
        "Rajasthan": "08",
        "Sikkim": "11",
        "Tamil Nadu": "33",
        "Telangana": "36",
        "Tripura": "16",
        "Uttar Pradesh": "09",
        "Uttarakhand": "05",
        "West Bengal": "19"
    };

    // Select the dropdown and input fields
    const stateField = document.querySelector('[name="state"]');
    const regionCodeField = document.querySelector('[name="regionCode"]');

    // Event listener to update region code when a state is selected
    stateField.addEventListener("change", () => {
        const selectedState = stateField.value;
        if (stateToRegionCode[selectedState]) {
            regionCodeField.value = stateToRegionCode[selectedState]; // Auto-fill
        } else {
            regionCodeField.value = ""; // Clear if state is not found
        }
    });
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