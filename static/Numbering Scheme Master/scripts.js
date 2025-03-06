document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("numbering-scheme-form");
    const table = document.getElementById("numbering-scheme-table");
    const searchRow = document.getElementById("searchRow");
    const tbody = table.querySelector("tbody");
    const pagination = document.getElementById("pagination");
  
    let isEditing = false;
    let editingSchemeId = null;
    const rowsPerPage = 10;
    let currentPage = 1;
  
    // Fetch data from the backend and render table
    const fetchTableData = () => {
      fetch('/api/numbering-scheme-master')
        .then(response => response.json())
        .then(data => {
          renderPage(data, currentPage);
          updatePagination(data.length);
          localStorage.setItem("numberingSchemeMasterData", JSON.stringify(data));
        })
        .catch(error => {
          console.error('Error fetching numbering schemes:', error);
        });
    };
  
    // Save numbering scheme data (Add or Edit)
    form.addEventListener("submit", (event) => {
      event.preventDefault();
  
      // Re-enable the frozen (disabled) fields temporarily so that their values are included in the FormData.
      const docTypeField = form.querySelector('[name="documentType"]');
      const fromPlantField = form.querySelector('[name="fromPlantWarehouse"]');
      if (docTypeField) {
        docTypeField.disabled = false;
      }
      if (fromPlantField) {
        fromPlantField.disabled = false;
      }
  
      const formData = new FormData(form);
      const schemeData = Object.fromEntries(formData.entries());
  
      // Modify the endpoint and method based on editing state
      const url = isEditing ? `/update_numbering_scheme/${editingSchemeId}` : '/add_numbering_scheme';
      const method = isEditing ? 'PUT' : 'POST';
  
      fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schemeData),
      })
        .then(response => response.json())
        .then(data => {
          alert(data.message);
          form.reset();
          isEditing = false;
          editingSchemeId = null;
          fetchTableData(); // Reload data
  
          // After submission, if you want the fields to remain frozen for editing existing records,
          // disable them again.
          if (docTypeField) {
            docTypeField.disabled = true;
          }
          if (fromPlantField) {
            fromPlantField.disabled = true;
          }
        })
        .catch(error => {
          console.error('Error processing numbering scheme:', error);
          alert('An error occurred while processing the numbering scheme.');
        });
    });
  
    // Render table based on current page
    const renderPage = (data, page) => {
      const start = (page - 1) * rowsPerPage;
      const end = page * rowsPerPage;
      const pageData = data.slice(start, end);
  
      tbody.innerHTML = ""; // Clear existing rows
      pageData.forEach(scheme => {
        const row = document.createElement("tr");
        row.dataset.schemeId = scheme.NumberingSchemeID;
  
        // Define the specific order and mapping of fields
        const fieldOrder = [
          { key: 'DocumentType', formName: 'documentType' },
          { key: 'FromPlantWarehouse', formName: 'fromPlantWarehouse' },
          { key: 'Prefix', formName: 'prefix' },
          { key: 'Pattern', formName: 'pattern' }
        ];
  
        // Create cells in the specific order
        fieldOrder.forEach(field => {
          const cell = document.createElement("td");
          cell.textContent = scheme[field.key] || '';
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
          renderPage(JSON.parse(localStorage.getItem("numberingSchemeMasterData")) || [], currentPage);
        });
        pagination.appendChild(button);
      }
    };
  
    // Event listener for row click (populate form fields with clicked row data)
    tbody.addEventListener("click", (event) => {
      const row = event.target.closest("tr");
      if (!row) return;
  
      isEditing = true;
      editingSchemeId = row.dataset.schemeId;
  
      // Define the field mapping to match form input names
      const fieldMapping = {
        'documenttype': 'documentType',
        'fromplantwarehouse': 'fromPlantWarehouse',
        'prefix': 'prefix',
        'pattern': 'pattern'
      };
  
      // Populate form fields
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
  
      // Freeze (disable) the Document Type and From Plant/Warehouse fields
      const docTypeField = form.querySelector('[name="documentType"]');
      const fromPlantField = form.querySelector('[name="fromPlantWarehouse"]');
      if (docTypeField) {
        docTypeField.disabled = true;
      }
      if (fromPlantField) {
        fromPlantField.disabled = true;
      }
    });
  
    // Search functionality
    searchRow.addEventListener("input", (event) => {
      const searchTerm = event.target.value.toLowerCase().trim();
      const column = event.target.getAttribute("data-column");
  
      // Retrieve the full data from localStorage
      const fullData = JSON.parse(localStorage.getItem("numberingSchemeMasterData")) || [];
  
      // If no search term, render the current page of full data
      if (searchTerm === "") {
        renderPage(fullData, currentPage);
        updatePagination(fullData.length);
        return;
      }
  
      // Filter data based on search term
      const filteredData = fullData.filter(scheme => {
        if (column) {
          const fieldMap = {
            'documentType': 'DocumentType',
            'fromPlantWarehouse': 'FromPlantWarehouse',
            'prefix': 'Prefix',
            'pattern': 'Pattern'
          };
  
          const mappedColumn = fieldMap[column];
          return scheme[mappedColumn]
            ? scheme[mappedColumn].toString().toLowerCase().includes(searchTerm)
            : false;
        }
  
        // Search across all fields
        return Object.values(scheme).some(value =>
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
  