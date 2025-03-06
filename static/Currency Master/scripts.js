document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("currency-form");
    const table = document.getElementById("currency-table");
    const searchRow = document.getElementById("searchRow");
    const tbody = table.querySelector("tbody");
    const pagination = document.getElementById("pagination");

    let isEditing = false;
    let editingCurrencyId = null;
    const rowsPerPage = 10;
    let currentPage = 1;

    // Fetch data from the backend and render table
    const fetchTableData = () => {
        fetch('/api/currency-master')
            .then(response => response.json())
            .then(data => {
                // Store the data first
                localStorage.setItem("currencyMasterData", JSON.stringify(data));
                // Then render and update pagination
                renderPage(data, currentPage);
                updatePagination(data.length);
            })
            .catch(error => {
                console.error('Error fetching currency rates:', error);
            });
    };

    // Save currency data (Add or Edit)
    form.addEventListener("submit", (event) => {
        event.preventDefault();

        form.querySelector('[name="currencyType"]').disabled = false;
        form.querySelector('[name="effectiveFrom"]').disabled = false;

        const formData = new FormData(form);
        const currencyData = Object.fromEntries(formData.entries());

        // Modify the endpoint and method based on editing state
        const url = isEditing ? `/api/currency-master/${editingCurrencyId}` : '/api/currency-master';
        const method = isEditing ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                currencyType: currencyData.currencyType,
                exchangeRate: parseFloat(currencyData.exchangeRate),
                effectiveFrom: currencyData.effectiveFrom,
                effectiveTo: currencyData.effectiveTo
            }),
        })
            .then(response => response.json())
            .then(data => {
                alert(data.message);

                // Reset form and editing flags
                form.reset();
                isEditing = false;
                editingCurrencyId = null;
                // Re-enable the frozen fields for new entries
                form.querySelector('[name="currencyType"]').disabled = false;
                form.querySelector('[name="effectiveFrom"]').disabled = false;

                // After successful submission, fetch fresh data
                fetchTableData();

                // Get the updated data and render the last page where the new entry would be
                const currentData = JSON.parse(localStorage.getItem("currencyMasterData")) || [];
                const totalPages = Math.ceil(currentData.length / rowsPerPage);
                currentPage = isEditing ? currentPage : totalPages; // Go to last page for new entries
                renderPage(currentData, currentPage);
            })
            .catch(error => {
                console.error('Error processing currency rate:', error);
                alert('An error occurred while processing the currency rate.');
            });
    });

    // Render table based on current page
    const renderPage = (data, page) => {
        const start = (page - 1) * rowsPerPage;
        const end = page * rowsPerPage;
        const pageData = data.slice(start, end);

        tbody.innerHTML = "";
        pageData.forEach(currency => {
            const row = document.createElement("tr");
            row.dataset.currencyId = currency.CurrencyID;

            // Define the specific order and mapping of fields
            const fieldOrder = [
                { key: 'CurrencyType', formName: 'currencyType' },
                { key: 'ExchangeRate', formName: 'exchangeRate' },
                { key: 'EffectiveFrom', formName: 'effectiveFrom' },
                { key: 'EffectiveTo', formName: 'effectiveTo' }
            ];

            // Create cells in the specific order
            fieldOrder.forEach(field => {
                const cell = document.createElement("td");
                let value = currency[field.key];
                
                // Format dates for display
                if (field.key === 'EffectiveFrom' || field.key === 'EffectiveTo') {
                    value = value ? new Date(value).toISOString().split('T')[0] : '';
                }
                // Format exchange rate to 4 decimal places
                else if (field.key === 'ExchangeRate') {
                    value = parseFloat(value).toFixed(4);
                }
                
                cell.textContent = value || '';
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
                const currentData = JSON.parse(localStorage.getItem("currencyMasterData")) || [];
                renderPage(currentData, currentPage);
                updatePagination(currentData.length);
            });
            pagination.appendChild(button);
        }
    };

    // When a table row is clicked, load the data into the form for editing.
    // Also, freeze the Currency Type and Effective From fields so they cannot be changed.
    tbody.addEventListener("click", (event) => {
        const row = event.target.closest("tr");
        if (!row) return;
    
        isEditing = true;
        editingCurrencyId = row.dataset.currencyId;
    
        // Map the data fields to form fields
        const cells = row.querySelectorAll("td");
        const formFields = {
            currencytype: form.querySelector('[name="currencyType"]'),
            exchangerate: form.querySelector('[name="exchangeRate"]'),
            effectivefrom: form.querySelector('[name="effectiveFrom"]'),
            effectiveto: form.querySelector('[name="effectiveTo"]')
        };
    
        cells.forEach(cell => {
            const fieldName = cell.dataset.field;
            if (fieldName && formFields[fieldName]) {
                let value = cell.textContent.trim();
                
                // Handle date fields
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

        // Freeze (disable) the Currency Type and Effective From fields in edit mode
        formFields.currencytype.disabled = true;
        formFields.effectivefrom.disabled = true;
    });

    // Search functionality
    searchRow.addEventListener("input", (event) => {
        const searchTerm = event.target.value.toLowerCase().trim();
        const column = event.target.getAttribute("data-column");

        const fullData = JSON.parse(localStorage.getItem("currencyMasterData")) || [];

        if (searchTerm === "") {
            renderPage(fullData, currentPage);
            updatePagination(fullData.length);
            return;
        }

        const filteredData = fullData.filter(currency => {
            if (column) {
                const fieldMap = {
                    'currencyType': 'CurrencyType',
                    'exchangeRate': 'ExchangeRate',
                    'effectiveFrom': 'EffectiveFrom',
                    'effectiveTo': 'EffectiveTo'
                };

                const mappedColumn = fieldMap[column];
                return currency[mappedColumn]
                    ? currency[mappedColumn].toString().toLowerCase().includes(searchTerm)
                    : false;
            }

            return Object.values(currency).some(value =>
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
