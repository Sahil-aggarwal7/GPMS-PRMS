from flask import Flask, render_template, request, redirect, url_for, jsonify, send_file
from datetime import datetime
from flask import session  
import pyodbc
from config import DATABASE_CONFIG
from werkzeug.utils import secure_filename
import os

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'  

# Connect to the MS SQL Database
def get_db_connection():
    conn = pyodbc.connect(
        f'DRIVER={DATABASE_CONFIG["DRIVER"]};'
        f'SERVER={DATABASE_CONFIG["SERVER"]};'
        f'DATABASE={DATABASE_CONFIG["DATABASE"]};'
        f'UID={DATABASE_CONFIG["UID"]};'
        f'PWD={DATABASE_CONFIG["PWD"]}'
    )
    return conn

# Configure upload folder
app.config['UPLOAD_FOLDER'] = 'uploads'  # Make sure this directory exists

# Create uploads directory if it doesn't exist
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])
    
# ------------------------------- COMPANY MASTER --------------------------------

# Fetch all companies (API)
@app.route('/api/company-master', methods=['GET'])
def get_companies():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM CompanyMaster')
    companies = cursor.fetchall()
    conn.close()

    companies_list = []
    for company in companies:
        companies_list.append({
            "CompanyID": company[0],
            "CompanyCode": company[1],
            "CompanyName": company[2],
            "Address1": company[3],
            "Address2": company[4],
            "Place": company[5],
            "PinCode": company[6],
            "City": company[7],
            "State": company[8],
            "RegionCode": company[9],
            "Country": company[10],
            "TelephoneNo": company[11],
            "PANNo": company[12],
            "TNGSTNo": company[13],
            "CSTNo": company[14],
            "TINNo": company[15],
            "GSTNo": company[16],
            "CINNo": company[17],
            "PersonName": company[18],
            "PersonDesignation": company[19],
            "CreatedAt": company[20]  # Optional: include creation timestamp if needed
        })
    
    return jsonify(companies_list)

# Route to add a company (POST API)
@app.route('/add_company', methods=['POST'])
def add_company():
    company_data = request.json
    company_code = company_data.get('companyCode')
    company_name = company_data.get('companyName')
    address1 = company_data.get('address1')
    address2 = company_data.get('address2')
    place = company_data.get('place')
    pin_code = company_data.get('pinCode')
    city = company_data.get('city')
    state = company_data.get('state')
    region_code = company_data.get('regionCode')
    country = company_data.get('country')
    telephone_no = company_data.get('telephoneNo')
    pan_no = company_data.get('panNo')
    tngst_no = company_data.get('tngstNo')
    cst_no = company_data.get('cstNo')
    tin_no = company_data.get('tinNo')
    gst_no = company_data.get('gstNo')
    cin_no = company_data.get('cinNo')
    person_name = company_data.get('personName')
    person_designation = company_data.get('personDesignation')

    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(''' 
        INSERT INTO CompanyMaster (
            CompanyCode, CompanyName, Address1, Address2, Place, PinCode, City, State, RegionCode,
            Country, TelephoneNo, PANNo, TNGSTNo, CSTNo, TINNo, GSTNo, CINNo, PersonName, PersonDesignation
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (company_code, company_name, address1, address2, place, pin_code, city, state, region_code,
          country, telephone_no, pan_no, tngst_no, cst_no, tin_no, gst_no, cin_no, person_name, person_designation))
    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify({"message": "Company added successfully!"}), 201

# Route to update a company (PUT API)
@app.route('/update_company/<int:company_id>', methods=['PUT'])
def update_company(company_id):
    company_data = request.json
    company_code = company_data.get('companyCode')
    company_name = company_data.get('companyName')
    address1 = company_data.get('address1')
    address2 = company_data.get('address2')
    place = company_data.get('place')
    pin_code = company_data.get('pinCode')
    city = company_data.get('city')
    state = company_data.get('state')
    region_code = company_data.get('regionCode')
    country = company_data.get('country')
    telephone_no = company_data.get('telephoneNo')
    pan_no = company_data.get('panNo')
    tngst_no = company_data.get('tngstNo')
    cst_no = company_data.get('cstNo')
    tin_no = company_data.get('tinNo')
    gst_no = company_data.get('gstNo')
    cin_no = company_data.get('cinNo')
    person_name = company_data.get('personName')
    person_designation = company_data.get('personDesignation')

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(''' 
        UPDATE CompanyMaster 
        SET CompanyCode = ?, 
            CompanyName = ?, 
            Address1 = ?, 
            Address2 = ?,
            Place = ?,
            PinCode = ?,
            City = ?,
            State = ?,
            RegionCode = ?,
            Country = ?,
            TelephoneNo = ?,
            PANNo = ?,
            TNGSTNo = ?,
            CSTNo = ?,
            TINNo = ?,
            GSTNo = ?,
            CINNo = ?,
            PersonName = ?,
            PersonDesignation = ?
        WHERE CompanyID = ?
    ''', (company_code, company_name, address1, address2, place, pin_code, city, state, region_code,
          country, telephone_no, pan_no, tngst_no, cst_no, tin_no, gst_no, cin_no, person_name, person_designation,
          company_id))
    
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Company updated successfully!"})

# Route to delete a company (DELETE API)
@app.route('/delete_company/<int:company_id>', methods=['DELETE'])
def delete_company(company_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM CompanyMaster WHERE CompanyID = ?', (company_id,))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Company deleted successfully!"})


# ------------------------------- DEPARTMENT MASTER ----------------------------

# Fetch all departments (API)
@app.route('/api/department-master', methods=['GET'])
def get_departments():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM DepartmentMaster')
    departments = cursor.fetchall()
    conn.close()

    departments_list = []
    for dept in departments:
        departments_list.append({
            "DepartmentID": dept[0],
            "DepartmentCode": dept[1],
            "DepartmentName": dept[2],
            "EffectiveFrom": dept[3].strftime('%Y-%m-%d') if dept[3] else None,
            "EffectiveTo": dept[4].strftime('%Y-%m-%d') if dept[4] else None,
        })
    
    return jsonify(departments_list)

# Route to add a department (POST API)
@app.route('/add_department', methods=['POST'])
def add_department():
    dept_data = request.json
    dept_code = dept_data.get('departmentCode')
    dept_name = dept_data.get('departmentName')
    effective_from = dept_data.get('effectiveFrom')
    effective_to = dept_data.get('effectiveTo')
    
    # Set effective_to to None if it is empty or not provided
    if not effective_to or effective_to.strip() == "":
        effective_to = None

    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(''' 
        INSERT INTO DepartmentMaster (DepartmentCode, DepartmentName, EffectiveFrom, EffectiveTo)
        VALUES (?, ?, ?, ?)
    ''', (dept_code, dept_name, effective_from, effective_to ))
    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify({"message": "Department added successfully!"}), 201

# Route to update a department (PUT API)
@app.route('/update_department/<int:dept_id>', methods=['PUT'])
def update_department(dept_id):
    dept_data = request.json
    dept_code = dept_data.get('departmentCode')
    dept_name = dept_data.get('departmentName')
    effective_from = dept_data.get('effectiveFrom')
    effective_to = dept_data.get('effectiveTo')
    
    # Set effective_to to None if it is empty or not provided
    if not effective_to or effective_to.strip() == "":
        effective_to = None

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(''' 
        UPDATE DepartmentMaster 
        SET DepartmentCode = ?, DepartmentName = ?, EffectiveFrom = ?, 
            EffectiveTo = ?
        WHERE DepartmentID = ?
    ''', (dept_code, dept_name, effective_from,
        effective_to, dept_id))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Department updated successfully!"})

# Route to delete a department (DELETE API)
@app.route('/delete_department/<int:dept_id>', methods=['DELETE'])
def delete_department(dept_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM DepartmentMaster WHERE DepartmentID = ?', (dept_id,))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Department deleted successfully!"})

# ------------------------------- SUPPLIER MASTER -----------------------

# Fetch all suppliers (API)

@app.route('/api/suppliers', methods=['GET'])
def get_suppliers():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if we only need supplier code and name for dropdowns
    is_dropdown = request.args.get('dropdown') == 'true'
    
    if is_dropdown:
        cursor.execute('SELECT SupplierCode, SupplierName FROM Suppliers')
        suppliers = cursor.fetchall()
        suppliers_list = []
        for supplier in suppliers:
            suppliers_list.append({
                "supplierCode": supplier[0],
                "supplierName": supplier[1]
            })
    else:
        # Original full supplier details for supplier master
        cursor.execute('SELECT * FROM Suppliers')
        suppliers = cursor.fetchall()
        suppliers_list = []
        for supplier in suppliers:
            suppliers_list.append({
                "SupplierID": supplier[0],
                "SupplierCode": supplier[1],
                "SupplierName": supplier[2],
                "SupplierAddress": supplier[3],
                "GSTNo": supplier[4],
                "PANNo": supplier[5],
                "ContactName": supplier[6],
                "ContactPhone": supplier[7],
                "ContactEmail": supplier[8],
                "City": supplier[9],
                "State": supplier[10],
                "PinCode": supplier[11]
            })
    
    conn.close()
    return jsonify(suppliers_list)

# Route to add a supplier (POST API)
@app.route('/add_supplier', methods=['POST'])
def add_supplier():
    supplier_data = request.json
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(''' 
        INSERT INTO Suppliers (
            SupplierCode, SupplierName, SupplierAddress, GSTNo, PANNo, 
            ContactName, ContactPhone, ContactEmail, City, State, PinCode
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        supplier_data.get('supplierCode'),
        supplier_data.get('supplierName'),
        supplier_data.get('supplierAddress'),
        supplier_data.get('gstNo'),
        supplier_data.get('panNo'),
        supplier_data.get('contactName'),
        supplier_data.get('contactPhone'),
        supplier_data.get('contactEmail'),
        supplier_data.get('city'),
        supplier_data.get('state'),
        supplier_data.get('pincode')
    ))
    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify({"message": "Supplier added successfully!"}), 201

# Route to update a supplier (PUT API)
@app.route('/update_supplier/<int:supplier_id>', methods=['PUT'])
def update_supplier(supplier_id):
    supplier_data = request.json
    
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(''' 
        UPDATE Suppliers 
        SET SupplierCode = ?, SupplierName = ?, SupplierAddress = ?, 
            GSTNo = ?, PANNo = ?, ContactName = ?, ContactPhone = ?, 
            ContactEmail = ?, City = ?, State = ?, PinCode = ?
        WHERE SupplierID = ?
    ''', (
        supplier_data.get('supplierCode'),
        supplier_data.get('supplierName'),
        supplier_data.get('supplierAddress'),
        supplier_data.get('gstNo'),
        supplier_data.get('panNo'),
        supplier_data.get('contactName'),
        supplier_data.get('contactPhone'),
        supplier_data.get('contactEmail'),
        supplier_data.get('city'),
        supplier_data.get('state'),
        supplier_data.get('pincode'),
        supplier_id
    ))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Supplier updated successfully!"})

# ------------------------------- PLANT WAREHOUSE MASTER -----------------------


# Fetch all plant/warehouse records (API)
@app.route('/api/plant-warehouse-master', methods=['GET'])
def get_plant_warehouse():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM PlantWarehouseMaster')
    plant_warehouse = cursor.fetchall()
    conn.close()

    plant_warehouse_list = []
    for plant in plant_warehouse:
        plant_warehouse_list.append({
            "PlantID": plant[0],
            "CompanyCode": plant[1],
            "CompanyName": plant[2],
            "PlantWarehouseType": plant[3],
            "PlantCode": plant[4],
            "PlantName": plant[5],
            "Address1": plant[6],
            "Address2": plant[7],
            "City": plant[8],
            "State": plant[9],
            "Country": plant[10],
            "PinCode": plant[11],
            "RegionCode": plant[12],
            "PANNumber": plant[13],
            "TINNumber": plant[14],
            "GSTNumber": plant[15],
            "Telephone": plant[16],
            "CSTNumber": plant[17],
            "CINNumber": plant[18],
            "AuthorizedPerson": plant[19],
            "AuthorizedDesignation": plant[20],
            "CreatedAt": plant[21]
        })
    
    return jsonify(plant_warehouse_list)

# Route to add a plant/warehouse (POST API)
@app.route('/add_plant_warehouse', methods=['POST'])
def add_plant_warehouse():
    plant_data = request.json
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(''' 
        INSERT INTO PlantWarehouseMaster (
            CompanyCode, CompanyName, PlantWarehouseType, PlantCode, PlantName,
            Address1, Address2, City, State, Country, PinCode, RegionCode,
            PANNumber, TINNumber, GSTNumber, Telephone, CSTNumber, CINNumber,
            AuthorizedPerson, AuthorizedDesignation
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        plant_data.get('companyCode'),
        plant_data.get('companyName'),
        plant_data.get('plantWarehouseType'),
        plant_data.get('plantCode'),
        plant_data.get('plantName'),
        plant_data.get('address1'),
        plant_data.get('address2'),
        plant_data.get('city'),
        plant_data.get('state'),
        plant_data.get('country'),
        plant_data.get('pinCode'),
        plant_data.get('regionCode'),
        plant_data.get('panNumber'),
        plant_data.get('tinNumber'),
        plant_data.get('gstNumber'),
        plant_data.get('telephone'),
        plant_data.get('cstNumber'),
        plant_data.get('cinNumber'),
        plant_data.get('authorizedPerson'),
        plant_data.get('authorizedDesignation')
    ))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify({"message": "Plant/Warehouse added successfully!"}), 201

# Route to update a plant/warehouse (PUT API)
@app.route('/update_plant_warehouse/<int:plant_id>', methods=['PUT'])
def update_plant_warehouse(plant_id):
    plant_data = request.json
    
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(''' 
        UPDATE PlantWarehouseMaster 
        SET CompanyCode = ?, CompanyName = ?, PlantWarehouseType = ?,
            PlantCode = ?, PlantName = ?, Address1 = ?, Address2 = ?,
            City = ?, State = ?, Country = ?, PinCode = ?, RegionCode = ?,
            PANNumber = ?, TINNumber = ?, GSTNumber = ?, Telephone = ?,
            CSTNumber = ?, CINNumber = ?, AuthorizedPerson = ?,
            AuthorizedDesignation = ?
        WHERE PlantID = ?
    ''', (
        plant_data.get('companyCode'),
        plant_data.get('companyName'),
        plant_data.get('plantWarehouseType'),
        plant_data.get('plantCode'),
        plant_data.get('plantName'),
        plant_data.get('address1'),
        plant_data.get('address2'),
        plant_data.get('city'),
        plant_data.get('state'),
        plant_data.get('country'),
        plant_data.get('pinCode'),
        plant_data.get('regionCode'),
        plant_data.get('panNumber'),
        plant_data.get('tinNumber'),
        plant_data.get('gstNumber'),
        plant_data.get('telephone'),
        plant_data.get('cstNumber'),
        plant_data.get('cinNumber'),
        plant_data.get('authorizedPerson'),
        plant_data.get('authorizedDesignation'),
        plant_id
    ))
    
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Plant/Warehouse updated successfully!"})

# Route to delete a plant/warehouse (DELETE API)
@app.route('/delete_plant_warehouse/<int:plant_id>', methods=['DELETE'])
def delete_plant_warehouse(plant_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM PlantWarehouseMaster WHERE PlantID = ?', (plant_id,))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Plant/Warehouse deleted successfully!"})

# ------------------------------- CURRENCY MASTER -------------------------------

# Fetch all currency exchange rates (GET API)
@app.route('/api/currency-master', methods=['GET'])
def get_currency_rates():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM CurrencyMaster')
    rates = cursor.fetchall()
    conn.close()

    rates_list = []
    for rate in rates:
        rates_list.append({
            "CurrencyID": rate[0],
            "CurrencyType": rate[1],
            "ExchangeRate": float(rate[2]),  # Convert Decimal to float for JSON serialization
            "EffectiveFrom": rate[3].strftime('%Y-%m-%d') if rate[3] else None,
            "EffectiveTo": rate[4].strftime('%Y-%m-%d') if rate[4] else None,
            "CreatedAt": rate[5].strftime('%Y-%m-%d %H:%M:%S') if rate[5] else None,
            "UpdatedAt": rate[6].strftime('%Y-%m-%d %H:%M:%S') if rate[6] else None
        })
    
    return jsonify(rates_list)

# Route to add a currency exchange rate (POST API)
@app.route('/api/currency-master', methods=['POST'])
def add_currency_rate():
    rate_data = request.json

    # Retrieve fields from request data
    currency_type = rate_data.get('currencyType')
    exchange_rate = rate_data.get('exchangeRate')
    effective_from = rate_data.get('effectiveFrom')
    effective_to = rate_data.get('effectiveTo')
    
    # Set effective_to to None if it is empty or not provided
    if not effective_to or effective_to.strip() == "":
        effective_to = None

    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute(''' 
            INSERT INTO CurrencyMaster (
                CurrencyType, ExchangeRate, EffectiveFrom, EffectiveTo
            ) VALUES (?, ?, ?, ?)
        ''', (
            currency_type,
            exchange_rate,
            effective_from,
            effective_to
        ))
        conn.commit()
        response = {"message": "Currency exchange rate added successfully!"}
        status_code = 201
    except Exception as e:
        response = {"error": str(e)}
        status_code = 400
    finally:
        cursor.close()
        conn.close()
    
    return jsonify(response), status_code

# Route to update a currency exchange rate (PUT API)
@app.route('/api/currency-master/<int:currency_id>', methods=['PUT'])
def update_currency_rate(currency_id):
    rate_data = request.json

    # Retrieve fields from request data
    currency_type = rate_data.get('currencyType')
    exchange_rate = rate_data.get('exchangeRate')
    effective_from = rate_data.get('effectiveFrom')
    effective_to = rate_data.get('effectiveTo')
    
    # Set effective_to to None if it is empty or not provided
    if not effective_to or effective_to.strip() == "":
        effective_to = None

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(''' 
            UPDATE CurrencyMaster 
            SET CurrencyType = ?, 
                ExchangeRate = ?, 
                EffectiveFrom = ?, 
                EffectiveTo = ?,
                UpdatedAt = GETDATE()
            WHERE CurrencyID = ?
        ''', (
            currency_type,
            exchange_rate,
            effective_from,
            effective_to,
            currency_id
        ))
        conn.commit()
        response = {"message": "Currency exchange rate updated successfully!"}
        status_code = 200
    except Exception as e:
        response = {"error": str(e)}
        status_code = 400
    finally:
        cursor.close()
        conn.close()

    return jsonify(response), status_code

# Route to delete a currency exchange rate (DELETE API)
@app.route('/api/currency-master/<int:currency_id>', methods=['DELETE'])
def delete_currency_rate(currency_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('DELETE FROM CurrencyMaster WHERE CurrencyID = ?', (currency_id,))
        conn.commit()
        response = {"message": "Currency exchange rate deleted successfully!"}
        status_code = 200
    except Exception as e:
        response = {"error": str(e)}
        status_code = 400
    finally:
        cursor.close()
        conn.close()

    return jsonify(response), status_code

# Route to get a specific currency exchange rate by ID (GET API)
@app.route('/api/currency-master/<int:currency_id>', methods=['GET'])
def get_currency_rate(currency_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT * FROM CurrencyMaster WHERE CurrencyID = ?', (currency_id,))
        rate = cursor.fetchone()
        
        if rate:
            rate_data = {
                "CurrencyID": rate[0],
                "CurrencyType": rate[1],
                "ExchangeRate": float(rate[2]),
                "EffectiveFrom": rate[3].strftime('%Y-%m-%d') if rate[3] else None,
                "EffectiveTo": rate[4].strftime('%Y-%m-%d') if rate[4] else None,
                "CreatedAt": rate[5].strftime('%Y-%m-%d %H:%M:%S') if rate[5] else None,
                "UpdatedAt": rate[6].strftime('%Y-%m-%d %H:%M:%S') if rate[6] else None
            }
            response = rate_data
            status_code = 200
        else:
            response = {"error": "Currency exchange rate not found"}
            status_code = 404
    except Exception as e:
        response = {"error": str(e)}
        status_code = 400
    finally:
        cursor.close()
        conn.close()

    return jsonify(response), status_code

# ------------------------------- CUSTOMER MASTER ----------------------------

# Fetch all customers (API)
@app.route('/api/customer-master', methods=['GET'])
def get_customers():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM CustomerMaster')
    customers = cursor.fetchall()
    conn.close()

    customers_list = []
    for customer in customers:
        customers_list.append({
            "CustomerID": customer[0],
            "CustomerCode": customer[1],
            "CustomerName": customer[2],
            "CompanyCode": customer[3],
            "FaxNo": customer[4],
            "CustomerPlantName": customer[5],
            "GSTNo": customer[6],
            "Address": customer[7],
            "Country": customer[8],
            "State": customer[9],
            "StateCode": customer[10],
            "PinCode": customer[11],
            "ContactPerson": customer[12],
            "PhoneNo": customer[13],
            "MobileNo": customer[14],
            "EmailID": customer[15],
            "IsDefaultBilling": bool(customer[16]),
            "IsDefaultShipping": bool(customer[17])
        })
    
    return jsonify(customers_list)

# Route to add a customer (POST API)
@app.route('/add_customer', methods=['POST'])
def add_customer():
    customer_data = request.json
    customer_code = customer_data.get('customerCode')
    customer_name = customer_data.get('customerName')
    company_code = customer_data.get('companyCode')
    fax_no = customer_data.get('faxNo')
    customer_plant_name = customer_data.get('customerPlantName')
    gst_no = customer_data.get('gstNo')
    address = customer_data.get('address')
    country = customer_data.get('country')
    state = customer_data.get('state')
    state_code = customer_data.get('stateCode')
    pin_code = customer_data.get('pinCode')
    contact_person = customer_data.get('contactPerson')
    phone_no = customer_data.get('phoneNo')
    mobile_no = customer_data.get('mobileNo')
    email_id = customer_data.get('emailId')
    is_default_billing = customer_data.get('isDefaultBilling', False)
    is_default_shipping = customer_data.get('isDefaultShipping', False)

    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(''' 
        INSERT INTO CustomerMaster (
            CustomerCode, CustomerName, CompanyCode, FaxNo, CustomerPlantName,
            GSTNo, Address, Country, State, StateCode, PinCode,
            ContactPerson, PhoneNo, MobileNo, EmailID,
            IsDefaultBilling, IsDefaultShipping
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        customer_code, customer_name, company_code, fax_no, customer_plant_name,
        gst_no, address, country, state, state_code, pin_code,
        contact_person, phone_no, mobile_no, email_id,
        is_default_billing, is_default_shipping
    ))
    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify({"message": "Customer added successfully!"}), 201

# Route to update a customer (PUT API)
@app.route('/update_customer/<int:customer_id>', methods=['PUT'])
def update_customer(customer_id):
    customer_data = request.json
    customer_code = customer_data.get('customerCode')
    customer_name = customer_data.get('customerName')
    company_code = customer_data.get('companyCode')
    fax_no = customer_data.get('faxNo')
    customer_plant_name = customer_data.get('customerPlantName')
    gst_no = customer_data.get('gstNo')
    address = customer_data.get('address')
    country = customer_data.get('country')
    state = customer_data.get('state')
    state_code = customer_data.get('stateCode')
    pin_code = customer_data.get('pinCode')
    contact_person = customer_data.get('contactPerson')
    phone_no = customer_data.get('phoneNo')
    mobile_no = customer_data.get('mobileNo')
    email_id = customer_data.get('emailId')
    is_default_billing = customer_data.get('isDefaultBilling', False)
    is_default_shipping = customer_data.get('isDefaultShipping', False)

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(''' 
        UPDATE CustomerMaster 
        SET CustomerCode = ?, CustomerName = ?, CompanyCode = ?, FaxNo = ?,
            CustomerPlantName = ?, GSTNo = ?, Address = ?, Country = ?,
            State = ?, StateCode = ?, PinCode = ?, ContactPerson = ?,
            PhoneNo = ?, MobileNo = ?, EmailID = ?, IsDefaultBilling = ?,
            IsDefaultShipping = ?
        WHERE CustomerID = ?
    ''', (
        customer_code, customer_name, company_code, fax_no,
        customer_plant_name, gst_no, address, country,
        state, state_code, pin_code, contact_person,
        phone_no, mobile_no, email_id, is_default_billing,
        is_default_shipping, customer_id
    ))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Customer updated successfully!"})

# Route to delete a customer (DELETE API)
@app.route('/delete_customer/<int:customer_id>', methods=['DELETE'])
def delete_customer(customer_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM CustomerMaster WHERE CustomerID = ?', (customer_id,))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Customer deleted successfully!"})

# ------------------------------- NUMBERING SCHEME MASTER ----------------------------

# Fetch all numbering schemes (API)
@app.route('/api/numbering-scheme-master', methods=['GET'])
def get_numbering_schemes():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM NumberingSchemeMaster')
    numbering_schemes = cursor.fetchall()
    conn.close()

    numbering_schemes_list = []
    for scheme in numbering_schemes:
        numbering_schemes_list.append({
            "NumberingSchemeID": scheme[0],
            "DocumentType": scheme[1],
            "FromPlantWarehouse": scheme[2],
            "Prefix": scheme[3],
            "Pattern": scheme[4],
            "CreatedAt": scheme[5]
        })
    
    return jsonify(numbering_schemes_list)

# Route to add a numbering scheme (POST API)
@app.route('/add_numbering_scheme', methods=['POST'])
def add_numbering_scheme():
    scheme_data = request.json
    document_type = scheme_data.get('documentType')
    from_plant_warehouse = scheme_data.get('fromPlantWarehouse')
    prefix = scheme_data.get('prefix')
    pattern = scheme_data.get('pattern')

    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(''' 
        INSERT INTO NumberingSchemeMaster (DocumentType, FromPlantWarehouse, Prefix, Pattern)
        VALUES (?, ?, ?, ?)
    ''', (document_type, from_plant_warehouse, prefix, pattern))
    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify({"message": "Numbering Scheme added successfully!"}), 201

# Route to update a numbering scheme (PUT API)
@app.route('/update_numbering_scheme/<int:scheme_id>', methods=['PUT'])
def update_numbering_scheme(scheme_id):
    scheme_data = request.json
    document_type = scheme_data.get('documentType')
    from_plant_warehouse = scheme_data.get('fromPlantWarehouse')
    prefix = scheme_data.get('prefix')
    pattern = scheme_data.get('pattern')

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(''' 
        UPDATE NumberingSchemeMaster 
        SET DocumentType = ?, FromPlantWarehouse = ?, Prefix = ?, Pattern = ?
        WHERE NumberingSchemeID = ?
    ''', (document_type, from_plant_warehouse, prefix, pattern, scheme_id))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Numbering Scheme updated successfully!"})

# Route to delete a numbering scheme (DELETE API)
@app.route('/delete_numbering_scheme/<int:scheme_id>', methods=['DELETE'])
def delete_numbering_scheme(scheme_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM NumberingSchemeMaster WHERE NumberingSchemeID = ?', (scheme_id,))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Numbering Scheme deleted successfully!"})

# ------------------------------- PART MASTER ----------------------------

@app.route('/api/part-master', methods=['GET'])
def get_parts():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT * FROM PartMaster')
        parts = cursor.fetchall()
        
        parts_list = []
        for part in parts:
            # Handle EffectiveTo specifically - return None if not set
            effective_to = part[15].strftime('%Y-%m-%d') if part[15] else None
            
            parts_list.append({
                "PartMasterID": part[0],
                "PartCode": part[1],
                "PartName": part[2],
                "BasicCost": float(part[3]) if part[3] is not None else None,
                "PackingCost": float(part[4]) if part[4] is not None else None,
                "FreightCost": float(part[5]) if part[5] is not None else None,
                "AmortisationCost": float(part[6]) if part[6] is not None else None,
                "UOM": part[7],
                "HSNCode": part[8],
                "StdWeight": float(part[9]) if part[9] is not None else None,
                "Container": part[10],
                "StuffQuantity": part[11],
                "Model": part[12],
                "Division": part[13],
                "EffectiveFrom": part[14].strftime('%Y-%m-%d') if part[14] else None,
                "EffectiveTo": effective_to,
                "MaterialType": part[16],
                "CreatedAt": part[17].strftime('%Y-%m-%d %H:%M:%S') if part[17] else None
            })
        
        return jsonify(parts_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/add_part', methods=['POST'])
def add_part():
    try:
        part_data = request.json
        
        # Validate required fields
        required_fields = ['partCode', 'partName', 'hsnCode', 'stuffQuantity', 'model', 'division', 'effectiveFrom']
        missing_fields = [field for field in required_fields if not part_data.get(field)]
        if missing_fields:
            return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if part code already exists
        cursor.execute('SELECT PartCode FROM PartMaster WHERE PartCode = ?', (part_data.get('partCode'),))
        if cursor.fetchone():
            return jsonify({"error": "Part Code already exists"}), 400

        # Handle numeric fields - convert empty strings to None
        numeric_fields = ['basicCost', 'packingCost', 'freightCost', 'amortisationCost', 'stdWeight']
        for field in numeric_fields:
            if part_data.get(field) == '':
                part_data[field] = None

        # Handle EffectiveTo - set to None if empty
        effective_to = part_data.get('effectiveTo')
        if not effective_to or effective_to.strip() == '':
            effective_to = None

        cursor.execute('''
            INSERT INTO PartMaster (
                PartCode, PartName, BasicCost, PackingCost, FreightCost, 
                AmortisationCost, UOM, HSNCode, StdWeight, Container, 
                StuffQuantity, Model, Division, EffectiveFrom, EffectiveTo, 
                MaterialType
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            part_data.get('partCode'),
            part_data.get('partName'),
            part_data.get('basicCost'),
            part_data.get('packingCost'),
            part_data.get('freightCost'),
            part_data.get('amortisationCost'),
            part_data.get('uom'),
            part_data.get('hsnCode'),
            part_data.get('stdWeight'),
            part_data.get('container'),
            part_data.get('stuffQuantity'),
            part_data.get('model'),
            part_data.get('division'),
            part_data.get('effectiveFrom'),
            effective_to,
            part_data.get('materialType')
        ))
        
        conn.commit()
        return jsonify({"message": "Part added successfully!"}), 201

    except pyodbc.IntegrityError as e:
        return jsonify({"error": "Database integrity error. Please check your input."}), 400
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

@app.route('/update_part/<int:part_id>', methods=['PUT'])
def update_part(part_id):
    try:
        part_data = request.json
        
        # Validate required fields for update
        required_fields = ['partName', 'hsnCode', 'stuffQuantity', 'model', 'division']
        missing_fields = [field for field in required_fields if not part_data.get(field)]
        if missing_fields:
            return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if part exists and get current PartCode and EffectiveFrom
        cursor.execute('SELECT PartCode, EffectiveFrom FROM PartMaster WHERE PartMasterID = ?', (part_id,))
        existing_part = cursor.fetchone()
        if not existing_part:
            return jsonify({"error": "Part not found"}), 404

        # Verify PartCode and EffectiveFrom haven't been changed
        if (part_data.get('partCode') and part_data.get('partCode') != existing_part[0]) or \
           (part_data.get('effectiveFrom') and part_data.get('effectiveFrom') != existing_part[1].strftime('%Y-%m-%d')):
            return jsonify({"error": "Part Code and Effective From date cannot be modified"}), 400

        # Handle numeric fields
        numeric_fields = ['basicCost', 'packingCost', 'freightCost', 'amortisationCost', 'stdWeight']
        for field in numeric_fields:
            if part_data.get(field) == '':
                part_data[field] = None

        # Handle EffectiveTo - set to None if empty
        effective_to = part_data.get('effectiveTo')
        if not effective_to or effective_to.strip() == '':
            effective_to = None

        cursor.execute('''
            UPDATE PartMaster 
            SET PartName = ?, BasicCost = ?, PackingCost = ?, 
                FreightCost = ?, AmortisationCost = ?, UOM = ?, HSNCode = ?, 
                StdWeight = ?, Container = ?, StuffQuantity = ?, Model = ?, 
                Division = ?, EffectiveTo = ?, MaterialType = ?
            WHERE PartMasterID = ?
        ''', (
            part_data.get('partName'),
            part_data.get('basicCost'),
            part_data.get('packingCost'),
            part_data.get('freightCost'),
            part_data.get('amortisationCost'),
            part_data.get('uom'),
            part_data.get('hsnCode'),
            part_data.get('stdWeight'),
            part_data.get('container'),
            part_data.get('stuffQuantity'),
            part_data.get('model'),
            part_data.get('division'),
            effective_to,
            part_data.get('materialType'),
            part_id
        ))
        
        conn.commit()
        return jsonify({"message": "Part updated successfully!"})

    except pyodbc.IntegrityError as e:
        return jsonify({"error": "Database integrity error. Please check your input."}), 400
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

@app.route('/delete_part/<int:part_id>', methods=['DELETE'])
def delete_part(part_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('SELECT PartCode FROM PartMaster WHERE PartMasterID = ?', (part_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Part not found"}), 404

        cursor.execute('DELETE FROM PartMaster WHERE PartMasterID = ?', (part_id,))
        conn.commit()
        
        return jsonify({"message": "Part deleted successfully!"})

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()
# ------------------------------- USER MASTER ---------------------------- #

# Fetch all users (API)
@app.route('/api/user-master', methods=['GET'])
def get_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM UserMaster')
    users = cursor.fetchall()
    conn.close()

    users_list = []
    for user in users:
        users_list.append({
            "UserID": user[0],
            "UserCode": user[1],
            "UserName": user[2],
            "Email": user[3],
            "Department": user[4],
            "EffectiveFrom": user[5].strftime('%Y-%m-%d') if user[5] else None,
            "EffectiveTo": user[6].strftime('%Y-%m-%d') if user[6] else None,
            "CreatedAt": user[7].strftime('%Y-%m-%d %H:%M:%S') if user[7] else None
        })
    return jsonify(users_list)

# Route to add a user (POST API)
@app.route('/add_user', methods=['POST'])
def add_user():
    user_data = request.json
    
    # Extract data from request
    user_code = user_data.get('userCode')
    user_name = user_data.get('userName')
    email = user_data.get('email')
    department = user_data.get('department')
    effective_from = user_data.get('effectiveFrom')
    effective_to = user_data.get('effectiveTo')
    password = user_data.get('password')  # In production, this should be hashed
    
     # Set effective_to to None if it is empty or not provided
    if not effective_to or effective_to.strip() == "":
        effective_to = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user code already exists
        cursor.execute('SELECT COUNT(*) FROM UserMaster WHERE UserCode = ?', (user_code,))
        if cursor.fetchone()[0] > 0:
            return jsonify({"error": "User Code already exists!"}), 400

        # Insert new user
        cursor.execute('''
            INSERT INTO UserMaster (UserCode, UserName, Email, Department, EffectiveFrom, EffectiveTo)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_code, user_name, email, department, effective_from, effective_to))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"message": "User added successfully!"}), 201
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Route to update a user (PUT API)
@app.route('/update_user/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user_data = request.json
    
    # Extract data from request
    user_code = user_data.get('userCode')
    user_name = user_data.get('userName')
    email = user_data.get('email')
    department = user_data.get('department')
    effective_from = user_data.get('effectiveFrom')
    effective_to = user_data.get('effectiveTo')
    password = user_data.get('password')  # Only update if provided
    
     # Set effective_to to None if it is empty or not provided
    if not effective_to or effective_to.strip() == "":
        effective_to = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Check if user exists
        cursor.execute('SELECT COUNT(*) FROM UserMaster WHERE UserID = ?', (user_id,))
        if cursor.fetchone()[0] == 0:
            return jsonify({"error": "User not found!"}), 404

        # Check if user code already exists for different user
        cursor.execute('SELECT COUNT(*) FROM UserMaster WHERE UserCode = ? AND UserID != ?', 
                      (user_code, user_id))
        if cursor.fetchone()[0] > 0:
            return jsonify({"error": "User Code already exists for another user!"}), 400

        # Update user information
        update_query = '''
            UPDATE UserMaster 
            SET UserCode = ?, 
                UserName = ?, 
                Email = ?, 
                Department = ?, 
                EffectiveFrom = ?, 
                EffectiveTo = ?
            WHERE UserID = ?
        '''
        cursor.execute(update_query, 
                      (user_code, user_name, email, department, 
                       effective_from, effective_to, user_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"message": "User updated successfully!"})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Route to delete a user (DELETE API)
@app.route('/delete_user/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute('SELECT COUNT(*) FROM UserMaster WHERE UserID = ?', (user_id,))
        if cursor.fetchone()[0] == 0:
            return jsonify({"error": "User not found!"}), 404

        # Delete the user
        cursor.execute('DELETE FROM UserMaster WHERE UserID = ?', (user_id,))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"message": "User deleted successfully!"})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    
# ------------------------------- PURCHASE REQUEST ----------------------------

# Fetch all purchase requests (API)
@app.route('/api/purchase-request', methods=['GET'])
def get_purchase_requests():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Fetch all columns from PurchaseRequest table
    cursor.execute('SELECT * FROM PurchaseRequest')
    purchase_requests = cursor.fetchall()
    
    # Get column names from cursor description
    columns = [column[0] for column in cursor.description]
    conn.close()

    # Convert to list of dictionaries with all fields
    purchase_requests_list = []
    for req in purchase_requests:
        request_dict = {
            "id": req[0],  # Assuming PurchaseRequestID is the first column
            "Corporate": req[columns.index("Corporate")],
            "Plant": req[columns.index("Plant")],
            "PRNo": req[columns.index("PRNo")],
            "SupplierCode": req[columns.index("SupplierCode")],
            "SupplierName": req[columns.index("SupplierName")],
            "PRDate": req[columns.index("PRDate")],
            "Department": req[columns.index("Department")],
            "RequestedBy": req[columns.index("RequestedBy")],
            "Category": req[columns.index("Category")],
            "PartName": req[columns.index("PartName")],
            "PartNumber": req[columns.index("PartNumber")],
            "Quantity": req[columns.index("Quantity")],
            "NewPart": bool(req[columns.index("NewPart")]),  # Convert to boolean
            "CurrencyType": req[columns.index("CurrencyType")],
            "UnitPrice": req[columns.index("UnitPrice")],
            "UOM": req[columns.index("UOM")],
            "RequiredDate": req[columns.index("RequiredDate")]
        }
        purchase_requests_list.append(request_dict)

    return jsonify(purchase_requests_list)

# Add a purchase request (POST API)
@app.route('/add_purchase_request', methods=['POST'])
def add_purchase_request():
    try:
        req_data = request.json

        # Convert string 'true'/'false' to boolean for NewPart if necessary
        new_part = req_data.get('newPart')
        if isinstance(new_part, str):
            new_part = new_part.lower() == 'true'

        # Prepare data with all fields
        data = (
            req_data.get('corporate'),
            req_data.get('plant'),
            req_data.get('prNo'),
            req_data.get('supplierCode'),
            req_data.get('supplierName'),
            req_data.get('prDate'),
            req_data.get('department'),
            req_data.get('requestedBy'),
            req_data.get('category'),
            req_data.get('partName'),
            req_data.get('partNumber'),
            req_data.get('quantity'),
            1 if new_part else 0,  # Convert boolean to integer for database
            req_data.get('currencyType'),
            req_data.get('unitPrice'),
            req_data.get('uom'),
            req_data.get('requiredDate')
        )

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(''' 
            INSERT INTO PurchaseRequest 
            (Corporate, Plant, PRNo, SupplierCode, SupplierName, PRDate, Department, 
             RequestedBy, Category, PartName, PartNumber, Quantity, NewPart, 
             CurrencyType, UnitPrice, UOM, RequiredDate)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', data)
        
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Purchase request added successfully!", "status": "success"}), 201

    except Exception as e:
        return jsonify({
            "message": f"Error adding purchase request: {str(e)}", 
            "status": "error"
        }), 500

# Update a purchase request (PUT API)
@app.route('/update_purchase/<int:pr_id>', methods=['PUT'])
def update_purchase(pr_id):
    try:
        req_data = request.json

        # Convert string 'true'/'false' to boolean for NewPart if necessary
        new_part = req_data.get('newPart')
        if isinstance(new_part, str):
            new_part = new_part.lower() == 'true'

        # Prepare data with all fields
        data = (
            req_data.get('corporate'),
            req_data.get('plant'),
            req_data.get('prNo'),
            req_data.get('supplierCode'),
            req_data.get('supplierName'),
            req_data.get('prDate'),
            req_data.get('department'),
            req_data.get('requestedBy'),
            req_data.get('category'),
            req_data.get('partName'),
            req_data.get('partNumber'),
            req_data.get('quantity'),
            1 if new_part else 0,  # Convert boolean to integer for database
            req_data.get('currencyType'),
            req_data.get('unitPrice'),
            req_data.get('uom'),
            req_data.get('requiredDate'),
            pr_id  # For WHERE clause
        )

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(''' 
            UPDATE PurchaseRequest 
            SET Corporate = ?, Plant = ?, PRNo = ?, SupplierCode = ?, SupplierName = ?, 
                PRDate = ?, Department = ?, RequestedBy = ?, Category = ?, PartName = ?, 
                PartNumber = ?, Quantity = ?, NewPart = ?, CurrencyType = ?, UnitPrice = ?, 
                UOM = ?, RequiredDate = ?
            WHERE PurchaseRequestID = ?
        ''', data)

        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({
                "message": "Purchase request not found", 
                "status": "error"
            }), 404

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "message": "Purchase request updated successfully!", 
            "status": "success"
        })

    except Exception as e:
        return jsonify({
            "message": f"Error updating purchase request: {str(e)}", 
            "status": "error"
        }), 500

# Delete a purchase request (DELETE API)
@app.route('/delete_purchase/<int:pr_id>', methods=['DELETE'])
def delete_purchase(pr_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM PurchaseRequest WHERE PurchaseRequestID = ?', (pr_id,))
        
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({
                "message": "Purchase request not found", 
                "status": "error"
            }), 404

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "message": "Purchase request deleted successfully!", 
            "status": "success"
        })

    except Exception as e:
        return jsonify({
            "message": f"Error deleting purchase request: {str(e)}", 
            "status": "error"
        }), 500
# ------------------------------- UPDATE PURCHASE REQUEST ----------------------------

# Fetch all update purchase requests (GET API)
@app.route('/api/update-purchase-request', methods=['GET'])
def get_update_purchase_requests():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM UpdatePurchaseRequest')
    purchase_requests = cursor.fetchall()
     # Get column names from cursor description
    columns = [column[0] for column in cursor.description]
    conn.close()

    # Convert to list of dictionaries with all fields
    purchase_requests_list = []
    for req in purchase_requests:
        request_dict = {
            "id": req[0],  # Assuming PurchaseRequestID is the first column
            "Corporate": req[columns.index("Corporate")],
            "Plant": req[columns.index("Plant")],
            "PRNo": req[columns.index("PRNo")],
            "SupplierCode": req[columns.index("SupplierCode")],
            "SupplierName": req[columns.index("SupplierName")],
            "PRDate": req[columns.index("PRDate")],
            "Department": req[columns.index("Department")],
            "RequestedBy": req[columns.index("RequestedBy")],
            "Category": req[columns.index("Category")],
            "PartName": req[columns.index("PartName")],
            "PartNumber": req[columns.index("PartNumber")],
            "Quantity": req[columns.index("Quantity")],
            "NewPart": bool(req[columns.index("NewPart")]),  # Convert to boolean
            "CurrencyType": req[columns.index("CurrencyType")],
            "UnitPrice": req[columns.index("UnitPrice")],
            "UOM": req[columns.index("UOM")],
            "RequiredDate": req[columns.index("RequiredDate")]
        }
        purchase_requests_list.append(request_dict)

    return jsonify(purchase_requests_list)

# Add an update purchase request (POST API)
@app.route('/add_update_purchase_request', methods=['POST'])
def add_update_purchase_request():
    try:
        req_data = request.json

        # Convert string 'true'/'false' to boolean for NewPart if necessary
        new_part = req_data.get('newPart')
        if isinstance(new_part, str):
            new_part = new_part.lower() == 'true'

        # Prepare data with all fields
        data = (
            req_data.get('corporate'),
            req_data.get('plant'),
            req_data.get('prNo'),
            req_data.get('supplierCode'),
            req_data.get('supplierName'),
            req_data.get('prDate'),
            req_data.get('department'),
            req_data.get('requestedBy'),
            req_data.get('category'),
            req_data.get('partName'),
            req_data.get('partNumber'),
            req_data.get('quantity'),
            1 if new_part else 0,  # Convert boolean to integer for database
            req_data.get('currencyType'),
            req_data.get('unitPrice'),
            req_data.get('uom'),
            req_data.get('requiredDate')
        )

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(''' 
            INSERT INTO UpdatePurchaseRequest 
            (Corporate, Plant, PRNo, SupplierCode, SupplierName, PRDate, Department, 
             RequestedBy, Category, PartName, PartNumber, Quantity, NewPart, 
             CurrencyType, UnitPrice, UOM, RequiredDate)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', data)
        
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Update Purchase request added successfully!", "status": "success"}), 201

    except Exception as e:
        return jsonify({
            "message": f"Error adding update purchase request: {str(e)}", 
            "status": "error"
        }), 500

# Update an update purchase request (PUT API)
@app.route('/update_update_purchase/<int:pr_id>', methods=['PUT'])
def update_update_purchase(pr_id):
    try:
        req_data = request.json

        # Convert string 'true'/'false' to boolean for NewPart if necessary
        new_part = req_data.get('newPart')
        if isinstance(new_part, str):
            new_part = new_part.lower() == 'true'

        # Prepare data with all fields
        data = (
            req_data.get('corporate'),
            req_data.get('plant'),
            req_data.get('prNo'),
            req_data.get('supplierCode'),
            req_data.get('supplierName'),
            req_data.get('prDate'),
            req_data.get('department'),
            req_data.get('requestedBy'),
            req_data.get('category'),
            req_data.get('partName'),
            req_data.get('partNumber'),
            req_data.get('quantity'),
            1 if new_part else 0,  # Convert boolean to integer for database
            req_data.get('currencyType'),
            req_data.get('unitPrice'),
            req_data.get('uom'),
            req_data.get('requiredDate'),
            pr_id  # For WHERE clause
        )

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(''' 
            UPDATE UpdatePurchaseRequest 
            SET Corporate = ?, Plant = ?, PRNo = ?, SupplierCode = ?, SupplierName = ?, 
                PRDate = ?, Department = ?, RequestedBy = ?, Category = ?, PartName = ?, 
                PartNumber = ?, Quantity = ?, NewPart = ?, CurrencyType = ?, UnitPrice = ?, 
                UOM = ?, RequiredDate = ?
            WHERE PurchaseRequestID = ?
        ''', data)

        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({
                "message": "Update Purchase request not found", 
                "status": "error"
            }), 404

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "message": "Update Purchase request updated successfully!", 
            "status": "success"
        })

    except Exception as e:
        return jsonify({
            "message": f"Error updating update purchase request: {str(e)}", 
            "status": "error"
        }), 500
        
# Delete an update purchase request (DELETE API)
@app.route('/delete_update_purchase_request/<int:pr_id>', methods=['DELETE'])
def delete_update_purchase_request(pr_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM UpdatePurchaseRequest WHERE PurchaseRequestID = ?', (pr_id,))
        
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({
                "message": "Update Purchase request not found", 
                "status": "error"
            }), 404

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "message": "Update Purchase request deleted successfully!", 
            "status": "success"
        })

    except Exception as e:
        return jsonify({
            "message": f"Error deleting update purchase request: {str(e)}", 
            "status": "error"
        }), 500

# ---------------------------- GATE PASS MANAGEMENT ----------------------------

@app.route('/api/gate-pass', methods=['GET'])
def get_gate_passes():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT GatePassID, Corporate, CustomerCode, CustomerName, 
               GatePassDate, GatePassType, Plant, NoOfPacks, UOM, 
               Description, Quantity, Purpose, VehicleNo, CreatedAt
        FROM GatePass 
    ''')
    gate_passes = cursor.fetchall()
    conn.close()

    gate_passes_list = []
    for gp in gate_passes:
        gate_passes_list.append({
            "GatePassID": gp[0],
            "Corporate": gp[1],
            "CustomerCode": gp[2],
            "CustomerName": gp[3],
            "GatePassDate": gp[4].strftime('%Y-%m-%d') if gp[4] else None,
            "GatePassType": gp[5],
            "Plant": gp[6],
            "NoOfPacks": gp[7],
            "UOM": gp[8],
            "Description": gp[9],
            "Quantity": gp[10],
            "Purpose": gp[11],
            "VehicleNo": gp[12],
            "CreatedAt": gp[13].strftime('%Y-%m-%d %H:%M:%S') if gp[13] else None
        })
    
    return jsonify(gate_passes_list)

@app.route('/add_gate_pass', methods=['POST'])
def add_gate_pass():
    data = request.json
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO GatePass (
                Corporate, CustomerCode, CustomerName, GatePassDate,
                GatePassType, Plant, NoOfPacks, UOM, Description,
                Quantity, Purpose, VehicleNo
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('corporate'),
            data.get('customerCode'),
            data.get('customerName'),
            data.get('gatePassDate'),
            data.get('gatePassType'),
            data.get('plant'),
            data.get('noOfPacks'),
            data.get('uom'),
            data.get('description'),
            data.get('quantity'),
            data.get('purpose'),
            data.get('vehicleNo')
        ))
        conn.commit()
        return jsonify({"message": "Gate pass created successfully!"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@app.route('/update_gate/<int:gate_pass_id>', methods=['PUT'])
def update_gate(gate_pass_id):
    data = request.json
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            UPDATE GatePass 
            SET Corporate = ?, CustomerCode = ?, CustomerName = ?,
                GatePassDate = ?, GatePassType = ?, Plant = ?,
                NoOfPacks = ?, UOM = ?, Description = ?,
                Quantity = ?, Purpose = ?, VehicleNo = ?
            WHERE GatePassID = ?
        ''', (
            data.get('corporate'),
            data.get('customerCode'),
            data.get('customerName'),
            data.get('gatePassDate'),
            data.get('gatePassType'),
            data.get('plant'),
            data.get('noOfPacks'),
            data.get('uom'),
            data.get('description'),
            data.get('quantity'),
            data.get('purpose'),
            data.get('vehicleNo'),
            gate_pass_id
        ))
        conn.commit()
        return jsonify({"message": "Gate pass updated successfully!"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

# Additional route for deletion if needed
@app.route('/delete_gate_pass/<int:gate_pass_id>', methods=['DELETE'])
def delete_gate_pass(gate_pass_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('DELETE FROM GatePass WHERE GatePassID = ?', (gate_pass_id,))
        conn.commit()
        return jsonify({"message": "Gate pass deleted successfully!"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        cursor.close()
        conn.close()
        
# ------------------------------- UPDATE GATE PASS ----------------------------

@app.route('/api/update-gate-pass', methods=['GET'])
def get_update_gate_passes():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            SELECT GatePassID, Corporate, GatePassNo, CustomerCode, CustomerName, 
                   GatePassDate, GatePassType, NoOfPacks, UOM, Description, 
                   Quantity, Purpose, VehicleNo, CreatedAt
            FROM UpdateGatePass 
        ''')
        gate_passes = cursor.fetchall()
        
        gate_passes_list = []
        for gp in gate_passes:
            gate_passes_list.append({
                "GatePassID": gp[0],
                "Corporate": gp[1],
                "GatePassNo": gp[2],
                "CustomerCode": gp[3],
                "CustomerName": gp[4],
                "GatePassDate": gp[5].strftime('%Y-%m-%d') if gp[5] else None,
                "GatePassType": gp[6],
                "NoOfPacks": gp[7],
                "UOM": gp[8],
                "Description": gp[9],
                "Quantity": gp[10],
                "Purpose": gp[11],
                "VehicleNo": gp[12],
                "CreatedAt": gp[13].strftime('%Y-%m-%d %H:%M:%S') if gp[13] else None
            })
        
        return jsonify(gate_passes_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/add_update_gate_pass', methods=['POST'])
def add_update_gate_pass():
    data = request.json
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO UpdateGatePass (
                Corporate, GatePassNo, CustomerCode, CustomerName,
                GatePassDate, GatePassType, NoOfPacks, UOM,
                Description, Quantity, Purpose, VehicleNo
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('corporate'),
            data.get('gatePassNo'),
            data.get('customerCode'),
            data.get('customerName'),
            data.get('gatePassDate'),
            data.get('gatePassType'),
            data.get('noOfPacks'),
            data.get('uom'),
            data.get('description'),
            data.get('quantity'),
            data.get('purpose'),
            data.get('vehicleNo')
        ))
        conn.commit()
        return jsonify({"message": "Gate pass created successfully!"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@app.route('/update_gate_passes/<int:gate_pass_id>', methods=['PUT'])
def update_gate_passes(gate_pass_id):
    data = request.json
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            UPDATE UpdateGatePass 
            SET Corporate = ?, GatePassNo = ?, CustomerCode = ?,
                CustomerName = ?, GatePassDate = ?, GatePassType = ?,
                NoOfPacks = ?, UOM = ?, Description = ?,
                Quantity = ?, Purpose = ?, VehicleNo = ?
            WHERE GatePassID = ?
        ''', (
            data.get('corporate'),
            data.get('gatePassNo'),
            data.get('customerCode'),
            data.get('customerName'),
            data.get('gatePassDate'),
            data.get('gatePassType'),
            data.get('noOfPacks'),
            data.get('uom'),
            data.get('description'),
            data.get('quantity'),
            data.get('purpose'),
            data.get('vehicleNo'),
            gate_pass_id
        ))
        conn.commit()
        return jsonify({"message": "Gate pass updated successfully!"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@app.route('/delete_gate_passes/<int:gate_pass_id>', methods=['DELETE'])
def delete_update_gate_passes(gate_pass_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('DELETE FROM UpdateGatePass WHERE GatePassID = ?', (gate_pass_id,))
        conn.commit()
        return jsonify({"message": "Gate pass deleted successfully!"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

# ------------------------------- SECURITY APPROVALS ----------------------------

# Fetch all security approvals (API)
@app.route('/api/security-approvals', methods=['GET'])
def get_security_approvals():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM SecurityApprovals')
    approvals = cursor.fetchall()
    conn.close()

    approvals_list = []
    for approval in approvals:
        approvals_list.append({
            "ApprovalID": approval[0],
            "DocumentType": approval[1],
            "FromPlantWarehouse": approval[2],
            "Users": approval[3],
            "Level": approval[4],
            "DepartmentName": approval[5],
            "CreatedAt": approval[6].strftime('%Y-%m-%d %H:%M:%S') if approval[6] else None
        })
    
    return jsonify(approvals_list)

# Route to add an approval (POST API)
@app.route('/add_approval', methods=['POST'])
def add_approval():
    approval_data = request.json
    doc_type = approval_data.get('documentType')
    from_plant = approval_data.get('fromPlant')
    users = approval_data.get('users')
    level = approval_data.get('level')
    dept_name = approval_data.get('departmentName')

    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(''' 
        INSERT INTO SecurityApprovals (
            DocumentType, 
            FromPlantWarehouse, 
            Users, 
            Level, 
            DepartmentName
        )
        VALUES (?, ?, ?, ?, ?)
    ''', (doc_type, from_plant, users, level, dept_name))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify({"message": "Approval added successfully!"}), 201

# Route to update an approval (PUT API)
@app.route('/update_approval/<int:approval_id>', methods=['PUT'])
def update_approval(approval_id):
    approval_data = request.json
    doc_type = approval_data.get('documentType')
    from_plant = approval_data.get('fromPlant')
    users = approval_data.get('users')
    level = approval_data.get('level')
    dept_name = approval_data.get('departmentName')

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(''' 
        UPDATE SecurityApprovals 
        SET DocumentType = ?, 
            FromPlantWarehouse = ?, 
            Users = ?, 
            Level = ?, 
            DepartmentName = ?
        WHERE ApprovalID = ?
    ''', (doc_type, from_plant, users, level, dept_name, approval_id))
    
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Approval updated successfully!"})

# Route to delete an approval (DELETE API)
@app.route('/delete_approval/<int:approval_id>', methods=['DELETE'])
def delete_approval(approval_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM SecurityApprovals WHERE ApprovalID = ?', (approval_id,))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Approval deleted successfully!"})

# ------------------------------- MAIL DETAILS ----------------------------

# Route to add mail details (POST API)
@app.route('/add_mail_details', methods=['POST'])
def add_mail_details():
    try:
        # Get file and reason from form
        attachment = request.files['attachment']
        pr_reason = request.form['prReason']

        # Save the file
        if attachment:
            # Ensure filename is secure
            filename = secure_filename(attachment.filename)
            # Save file to a designated uploads folder
            attachment.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        
        # Save to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(''' 
            INSERT INTO MailDetails (AttachmentFileName, PRReason)
            VALUES (?, ?)
        ''', (filename, pr_reason))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"message": "Mail details added successfully!"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Route to get mail details (GET API)
@app.route('/api/mail-details', methods=['GET'])
def get_mail_details():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM MailDetails')
    mail_details = cursor.fetchall()
    conn.close()

    mail_details_list = []
    for detail in mail_details:
        mail_details_list.append({
            "MailID": detail[0],
            "AttachmentFileName": detail[1],
            "PRReason": detail[2],
            "CreatedAt": detail[3]
        })
    
    return jsonify(mail_details_list) 

# Route to update mail details (PUT API)
@app.route('/update_mail_details/<int:mail_id>', methods=['PUT'])
def update_mail_details(mail_id):
    try:
        attachment = request.files.get('attachment')
        pr_reason = request.form.get('prReason')

        conn = get_db_connection()
        cursor = conn.cursor()

        if attachment:
            filename = secure_filename(attachment.filename)
            attachment.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            
            cursor.execute(''' 
                UPDATE MailDetails 
                SET AttachmentFileName = ?, PRReason = ?
                WHERE MailID = ?
            ''', (filename, pr_reason, mail_id))
        else:
            cursor.execute(''' 
                UPDATE MailDetails 
                SET PRReason = ?
                WHERE MailID = ?
            ''', (pr_reason, mail_id))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Mail details updated successfully!"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    
    
@app.route('/update_user_access_rights', methods=['POST'])
def update_user_access_rights():
    data = request.json
    username = data.get('username')  # Changed from user_id to username
    modules = data.get('modules', [])  # list of module strings

    if not username:
        return jsonify({"message": "No user selected"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # 1) Delete existing permissions for this username
    cursor.execute("DELETE FROM UserPermissions WHERE Username = ?", (username,))

    # 2) Insert new permissions
    for module_name in modules:
        cursor.execute("""
            INSERT INTO UserPermissions (Username, ModuleName, CanAccess)
            VALUES (?, ?, 1)
        """, (username, module_name))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "User access rights updated successfully!"})


# New endpoint to get user access rights based on username
@app.route('/get_user_access_rights')
def get_user_access_rights():
    username = request.args.get('username')
    if not username:
        return jsonify({"modules": []})
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT ModuleName FROM UserPermissions WHERE Username = ? AND CanAccess = 1", (username,))
    rows = cursor.fetchall()
    modules = [row[0] for row in rows]
    cursor.close()
    conn.close()
    
    return jsonify({"modules": modules})

# ------------------------------- FRONTEND ROUTES ------------------------------

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT Id, Username 
            FROM Users 
            WHERE Username = ? 
            AND Password = ?
        """
        
        cursor.execute(query, (username, password))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if user:
            session['user_id'] = user[0]
            session['username'] = user[1]

            # Fetch this user's module permissions using the username
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
                SELECT ModuleName 
                FROM UserPermissions 
                WHERE Username = ? AND CanAccess = 1
            """, (user[1],))
            rows = cursor.fetchall()
            cursor.close()
            conn.close()

            allowed_modules = [row[0] for row in rows]
            session['allowed_modules'] = allowed_modules

            return redirect(url_for('dashboard'))
        else:
            error_message = "Invalid username or password"
            return render_template('public/login.html', error=error_message)
            
    return render_template('public/login.html')


@app.route('/get_current_user')
def get_current_user():
    return jsonify({
        'username': session.get('username', ''),
        'user_id': session.get('user_id', '')
    })

@app.route('/logout')
def logout():
    # Clear the session
    session.clear()
    # Redirect to login page
    return redirect(url_for('login'))

# Route for the dashboard page
@app.route('/dashboard', methods=['GET'])
def dashboard():
    return render_template('Dashboard/index.html', username=session.get('username'))

@app.route('/department_master', methods=['GET'])
def department_master():
    return render_template('manage_dept_master/index.html', username=session.get('username'))

@app.route('/suppliers', methods=['GET'])
def suppliers():
    return render_template('Suppliers/manageSuppliers.html', username=session.get('username'))

@app.route('/plant_warehouse', methods=['GET'])
def plant_warehouse():
    return render_template('manage_plant_warehouse/index.html', username=session.get('username'))

@app.route('/currency_master', methods=['GET'])
def currency_master():
    return render_template('Currency Master/index.html', username=session.get('username'))

@app.route('/customer_master', methods=['GET'])
def customer_master():
    return render_template('Customer Master/customerMaster.html', username=session.get('username'))

@app.route('/numbering_scheme_master', methods=['GET'])
def numbering_scheme_master():
    return render_template('Numbering Scheme Master/index.html', username=session.get('username'))

@app.route('/part_master', methods=['GET'])
def part_master():
    return render_template('Part Master/index.html', username=session.get('username'))

@app.route('/user_creation', methods=['GET'])
def user_creation():
    return render_template('Admin/index.html', username=session.get('username'))

@app.route('/create_purchase_request', methods=['GET'])
def create_purchase_request():
    return render_template('Purchase Request/index.html', username=session.get('username'))

@app.route('/update_purchase_request', methods=['GET'])
def update_purchase_request():
    return render_template('Update PR/index.html', username=session.get('username'))

@app.route('/generate_gate_pass', methods=['GET'])
def generate_gate_pass():
    return render_template('Generate Gate Pass/index.html', username=session.get('username'))

@app.route('/update_gate_pass', methods=['GET'])
def update_gate_pass():
    return render_template('Update Gate Pass/index.html', username=session.get('username'))

@app.route('/manage_approvals', methods=['GET'])
def manage_approvals():
    return render_template('Security/index.html', username=session.get('username'))

@app.route('/user_access', methods=['GET'])
def user_access():
    return render_template('User Access Rights/index.html', username=session.get('username'))

# Default route redirects to login
@app.route('/')
def index():
    return redirect(url_for('login'))

# ------------------------------- RUN SERVER -----------------------------------

if __name__ == '__main__':
    app.run(debug=True, port=8080, host='0.0.0.0')
