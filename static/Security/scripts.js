document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("manage-approvals-form");
  const table = document.getElementById("approval-table");
  const searchRow = document.getElementById("searchRow");
  const tbody = table.querySelector("tbody");
  const pagination = document.getElementById("pagination");

  let isEditing = false;
  let editingApprovalId = null;
  const rowsPerPage = 10;
  let currentPage = 1;

  // Fetch approval data from the backend
  const fetchTableData = () => {
    fetch('/api/security-approvals')
      .then(response => response.json())
      .then(data => {
        // Add computed SerialNo to each approval (starting from 1)
        data.forEach((approval, index) => {
          approval.SerialNo = index + 1;
        });
        localStorage.setItem("securityApprovalsData", JSON.stringify(data));
        renderPage(data, currentPage);
        updatePagination(data.length);
      })
      .catch(error => {
        console.error('Error fetching approvals:', error);
      });
  };

  // Save approval data (Add or Edit)
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const approvalData = Object.fromEntries(formData.entries());

    const url = isEditing ? `/update_approval/${editingApprovalId}` : '/add_approval';
    const method = isEditing ? 'PUT' : 'POST';

    fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(approvalData),
    })
      .then(response => response.json())
      .then(data => {
        alert(data.message);
        form.reset();
        isEditing = false;
        editingApprovalId = null;
        fetchTableData();
      })
      .catch(error => {
        console.error('Error processing approval:', error);
        alert('An error occurred while processing the approval.');
      });
  });

  // Render table based on current page
  const renderPage = (data, page) => {
    const start = (page - 1) * rowsPerPage;
    const end = page * rowsPerPage;
    const pageData = data.slice(start, end);

    tbody.innerHTML = "";
    pageData.forEach((approval, index) => {
      const row = document.createElement("tr");
      row.dataset.approvalId = approval.ApprovalID;

      // Define the specific order and mapping of fields
      const fieldOrder = [
        { key: 'SerialNo', value: start + index + 1 },
        { key: 'DocumentType', formName: 'documentType' },
        { key: 'FromPlantWarehouse', formName: 'fromPlant' },
        { key: 'Users', formName: 'users' },
        { key: 'Level', formName: 'level' },
        { key: 'DepartmentName', formName: 'departmentName' }
      ];

      fieldOrder.forEach(field => {
        const cell = document.createElement("td");
        cell.textContent = field.value || approval[field.key] || '';
        if (field.formName) {
          cell.dataset.field = field.formName.toLowerCase();
        }
        row.appendChild(cell);
      });

      // Create delete cell with cross icon
      const deleteCell = document.createElement("td");
      deleteCell.classList.add("delete-cell");
      // Using Font Awesome's "times" icon for the cross
      deleteCell.innerHTML = `<i class="fa fa-times delete-icon" aria-hidden="true"></i>`;

      // Add event listener to delete this row
      deleteCell.addEventListener("click", (event) => {
        // Prevent the row click (editing) from firing
        event.stopPropagation();
        const row = event.target.closest("tr");
        const approvalId = row.dataset.approvalId;

        if (confirm("Are you sure you want to delete this approval?")) {
          fetch(`/delete_approval/${approvalId}`, {
            method: 'DELETE'
          })
            .then(response => response.json())
            .then(data => {
              alert(data.message);
              row.remove();

              const fullData = JSON.parse(localStorage.getItem("securityApprovalsData")) || [];
              const updatedData = fullData.filter(approval => approval.ApprovalID !== approvalId);
              localStorage.setItem("securityApprovalsData", JSON.stringify(updatedData));

              updatePagination(updatedData.length);
            })
            .catch(error => {
              console.error("Error deleting approval:", error);
              alert("Error deleting approval.");
            });
        }
      });

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
        const data = JSON.parse(localStorage.getItem("securityApprovalsData")) || [];
        renderPage(data, currentPage);
        updatePaginationActive(i);
      });
      pagination.appendChild(button);
    }
  };

  // Update active pagination button
  const updatePaginationActive = (page) => {
    const buttons = pagination.querySelectorAll(".page-btn");
    buttons.forEach(button => {
      button.classList.remove("active");
      if (parseInt(button.textContent) === page) {
        button.classList.add("active");
      }
    });
  };

  // Row click handler to populate form for editing
  tbody.addEventListener("click", (event) => {
    const row = event.target.closest("tr");
    if (!row) return;

    isEditing = true;
    editingApprovalId = row.dataset.approvalId;

    const fieldMapping = {
      'documenttype': 'documentType',
      'fromplant': 'fromPlant',
      'users': 'users',
      'level': 'level',
      'departmentname': 'departmentName'
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
  });

  // Search functionality with fixed column mapping
  searchRow.addEventListener("input", (event) => {
    const searchTerm = event.target.value.toLowerCase().trim();
    // Convert any data-column attribute value to lowercase
    const columnAttr = event.target.getAttribute("data-column");
    const column = columnAttr ? columnAttr.toLowerCase() : null;
    const fullData = JSON.parse(localStorage.getItem("securityApprovalsData")) || [];

    if (searchTerm === "") {
      renderPage(fullData, currentPage);
      updatePagination(fullData.length);
      return;
    }

    const filteredData = fullData.filter(approval => {
      if (column) {
        // Use lowercase keys in the mapping to match the search input’s data attribute
        const fieldMap = {
          'sno': 'SerialNo',
          'documenttype': 'DocumentType',
          'fromplant': 'FromPlantWarehouse',
          'users': 'Users',
          'level': 'Level',
          'departmentname': 'DepartmentName'
        };

        const mappedColumn = fieldMap[column];
        return approval[mappedColumn]
          ? approval[mappedColumn].toString().toLowerCase().includes(searchTerm)
          : false;
      }
      // If no specific column is provided, search all fields
      return Object.values(approval).some(value =>
        value ? value.toString().toLowerCase().includes(searchTerm) : false
      );
    });

    currentPage = 1; // reset to first page on search
    renderPage(filteredData, currentPage);
    updatePagination(filteredData.length);
  });

  // Dropdown menu functionality
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
