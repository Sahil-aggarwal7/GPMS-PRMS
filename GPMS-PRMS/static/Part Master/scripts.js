document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("part-master-form");
    const table = document.getElementById("part-master-table");
    const searchRow = document.getElementById("searchRow");
    const tbody = table.querySelector("tbody");
    const pagination = document.getElementById("pagination");
    const partCodeInput = document.getElementById("part-code");
    const effectiveFromInput = document.getElementById("effective-from");
  
    let isEditing = false;
    let editingPartId = null;
    const rowsPerPage = 10;
    let currentPage = 1;
  
    const fetchTableData = () => {
        fetch('/api/part-master')
            .then(response => response.json())
            .then(data => {
                renderPage(data, currentPage);
                updatePagination(data.length);
                localStorage.setItem("partMasterData", JSON.stringify(data));
            })
            .catch(error => {
                console.error('Error fetching parts:', error);
            });
    };
  
    form.addEventListener("submit", (event) => {
        event.preventDefault();
  
        const formData = new FormData(form);
        const partData = Object.fromEntries(formData.entries());
  
        const url = isEditing ? `/update_part/${editingPartId}` : '/add_part';
        const method = isEditing ? 'PUT' : 'POST';
  
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(partData),
        })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                if (!isEditing) {
                    // Only freeze fields on new submission
                    partCodeInput.disabled = true;
                    effectiveFromInput.disabled = true;
                }
                isEditing = false;
                editingPartId = null;
                fetchTableData();
            })
            .catch(error => {
                console.error('Error processing part:', error);
                alert('An error occurred while processing the part.');
            });
    });
  
    const renderPage = (data, page) => {
        const start = (page - 1) * rowsPerPage;
        const end = page * rowsPerPage;
        const pageData = data.slice(start, end);
  
        tbody.innerHTML = "";
        pageData.forEach(part => {
            const row = document.createElement("tr");
            row.dataset.partId = part.PartMasterID;
  
            const fieldOrder = [
                { key: 'PartCode', formName: 'partCode' },
                { key: 'PartName', formName: 'partName' },
                { key: 'BasicCost', formName: 'basicCost' },
                { key: 'PackingCost', formName: 'packingCost' },
                { key: 'FreightCost', formName: 'freightCost' },
                { key: 'AmortisationCost', formName: 'amortisationCost' },
                { key: 'UOM', formName: 'uom' },
                { key: 'HSNCode', formName: 'hsnCode' },
                { key: 'StdWeight', formName: 'stdWeight' },
                { key: 'Container', formName: 'container' },
                { key: 'StuffQuantity', formName: 'stuffQuantity' },
                { key: 'Model', formName: 'model' },
                { key: 'Division', formName: 'division' },
                { key: 'EffectiveFrom', formName: 'effectiveFrom' },
                { key: 'EffectiveTo', formName: 'effectiveTo' },
                { key: 'MaterialType', formName: 'materialType' }
            ];
  
            fieldOrder.forEach(field => {
                const cell = document.createElement("td");
                let value = part[field.key];
                
                if (field.key === 'EffectiveFrom' || field.key === 'EffectiveTo') {
                    value = value ? new Date(value).toISOString().split('T')[0] : '';
                }
                else if (typeof value === 'number' && !Number.isInteger(value)) {
                    value = value.toFixed(2);
                }
                
                cell.textContent = value || '';
                cell.dataset.field = field.formName.toLowerCase();
                row.appendChild(cell);
            });
  
            tbody.appendChild(row);
        });
    };
  
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
                const allButtons = pagination.querySelectorAll(".page-btn");
                allButtons.forEach(btn => btn.classList.remove("active"));
                button.classList.add("active");
                renderPage(JSON.parse(localStorage.getItem("partMasterData")) || [], currentPage);
            });
            pagination.appendChild(button);
        }
    };
  
    tbody.addEventListener("click", (event) => {
        const row = event.target.closest("tr");
        if (!row) return;
  
        isEditing = true;
        editingPartId = row.dataset.partId;
  
        const fieldMapping = {
            'partcode': 'partCode',
            'partname': 'partName',
            'basiccost': 'basicCost',
            'packingcost': 'packingCost',
            'freightcost': 'freightCost',
            'amortisationcost': 'amortisationCost',
            'uom': 'uom',
            'hsncode': 'hsnCode',
            'stdweight': 'stdWeight',
            'container': 'container',
            'stuffquantity': 'stuffQuantity',
            'model': 'model',
            'division': 'division',
            'effectivefrom': 'effectiveFrom',
            'effectiveto': 'effectiveTo',
            'materialtype': 'materialType'
        };
  
        Array.from(row.children).forEach(cell => {
            const fieldName = cell.dataset.field;
  
            if (fieldName) {
                const formFieldName = fieldMapping[fieldName] || fieldName;
                const formField = form.querySelector(`[name="${formFieldName}"]`);
  
                if (formField) {
                    formField.value = cell.textContent.trim();
                    // Keep Part Code and Effective From fields disabled in edit mode
                    if (formFieldName === 'partCode' || formFieldName === 'effectiveFrom') {
                        formField.disabled = true;
                    }
                }
            }
        });
    });
  
    searchRow.addEventListener("input", (event) => {
        const searchTerm = event.target.value.toLowerCase().trim();
        const column = event.target.getAttribute("data-column");
  
        const fullData = JSON.parse(localStorage.getItem("partMasterData")) || [];
  
        if (searchTerm === "") {
            renderPage(fullData, currentPage);
            updatePagination(fullData.length);
            return;
        }
  
        const filteredData = fullData.filter(part => {
            if (column) {
                const fieldMap = {
                    'partCode': 'PartCode',
                    'partName': 'PartName',
                    'basicCost': 'BasicCost',
                    'packingCost': 'PackingCost',
                    'freightCost': 'FreightCost',
                    'amortisationCost': 'AmortisationCost',
                    'uom': 'UOM',
                    'hsnCode': 'HSNCode',
                    'stdWeight': 'StdWeight',
                    'container': 'Container',
                    'stuffQuantity': 'StuffQuantity',
                    'model': 'Model',
                    'division': 'Division',
                    'effectiveFrom': 'EffectiveFrom',
                    'effectiveTo': 'EffectiveTo',
                    'materialType': 'MaterialType'
                };
  
                const mappedColumn = fieldMap[column];
                const value = part[mappedColumn];
                return value ? value.toString().toLowerCase().includes(searchTerm) : false;
            }
  
            return Object.values(part).some(value =>
                value ? value.toString().toLowerCase().includes(searchTerm) : false
            );
        });
  
        renderPage(filteredData, 1);
        updatePagination(filteredData.length);
    });
  
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

    // Clear button functionality
    const clearButton = form.querySelector('button[type="reset"]');
    clearButton.addEventListener('click', () => {
        isEditing = false;
        editingPartId = null;
        partCodeInput.disabled = false;
        effectiveFromInput.disabled = false;
    });
  
    fetchTableData();
});