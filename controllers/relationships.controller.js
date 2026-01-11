import db from "../db.js";


export const getCustomersWithRelations = (req, res) => {
  const sql = `
    SELECT
      c.customer_id,
      c.name AS customer_name,
      c.email,
      c.phone,
      c.address,
      c.created_at AS customer_created_at,
      
      m.meter_id,
      m.meter_number,
      m.installation_date,
      m.status AS meter_status,
      
      u.utility_id,
      u.utility_name,
      
      mr.reading_id,
      mr.reading_date,
      mr.previous_reading,
      mr.current_reading,
      mr.consumption,
      
      b.bill_id,
      b.billing_month,
      b.amount,
      b.status AS bill_status
    FROM Customer c
    LEFT JOIN Meter m ON c.customer_id = m.customer_id
    LEFT JOIN Utility u ON m.utility_id = u.utility_id
    LEFT JOIN MeterReading mr ON m.meter_id = mr.meter_id
    LEFT JOIN Bill b ON m.meter_id = b.meter_id
    ORDER BY c.customer_id, m.meter_id, mr.reading_date DESC, b.billing_month DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("GET CUSTOMERS WITH RELATIONS ERROR:", err);
      return res.status(500).json({ message: "Failed to fetch customer relationships" });
    }

  
    const customersMap = {};

    rows.forEach(row => {
      const customerId = row.customer_id;

     
      if (!customersMap[customerId]) {
        customersMap[customerId] = {
          customer_id: row.customer_id,
          customer_name: row.customer_name,
          email: row.email,
          phone: row.phone,
          address: row.address,
          customer_created_at: row.customer_created_at,
          meters: {}
        };
      }

      const customer = customersMap[customerId];

    
      if (row.meter_id && !customer.meters[row.meter_id]) {
        customer.meters[row.meter_id] = {
          meter_id: row.meter_id,
          meter_number: row.meter_number,
          installation_date: row.installation_date,
          meter_status: row.meter_status,
          utility: {
            utility_id: row.utility_id,
            utility_name: row.utility_name
          },
          readings: [],
          bills: []
        };
      }

      const meter = customer.meters[row.meter_id];

      if (meter) {
        
        if (row.reading_id && !meter.readings.find(r => r.reading_id === row.reading_id)) {
          meter.readings.push({
            reading_id: row.reading_id,
            reading_date: row.reading_date,
            previous_reading: row.previous_reading,
            current_reading: row.current_reading,
            consumption: row.consumption
          });
        }

        
        if (row.bill_id && !meter.bills.find(b => b.bill_id === row.bill_id)) {
          meter.bills.push({
            bill_id: row.bill_id,
            billing_month: row.billing_month,
            amount: row.amount,
            bill_status: row.bill_status
          });
        }
      }
    });

    
    const customers = Object.values(customersMap).map(customer => ({
      ...customer,
      meters: Object.values(customer.meters)
    }));

    res.json(customers);
  });
};


export const getCustomerWithRelations = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT
      c.customer_id,
      c.name AS customer_name,
      c.email,
      c.phone,
      c.address,
      c.created_at AS customer_created_at,
      
      m.meter_id,
      m.meter_number,
      m.installation_date,
      m.status AS meter_status,
      
      u.utility_id,
      u.utility_name,
      
      mr.reading_id,
      mr.reading_date,
      mr.previous_reading,
      mr.current_reading,
      mr.consumption,
      
      b.bill_id,
      b.billing_month,
      b.amount,
      b.status AS bill_status
    FROM Customer c
    LEFT JOIN Meter m ON c.customer_id = m.customer_id
    LEFT JOIN Utility u ON m.utility_id = u.utility_id
    LEFT JOIN MeterReading mr ON m.meter_id = mr.meter_id
    LEFT JOIN Bill b ON m.meter_id = b.meter_id
    WHERE c.customer_id = ?
    ORDER BY m.meter_id, mr.reading_date DESC, b.billing_month DESC
  `;

  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.error("GET CUSTOMER WITH RELATIONS ERROR:", err);
      return res.status(500).json({ message: "Failed to fetch customer relationships" });
    }

    if (!rows.length) {
      return res.status(404).json({ message: "Customer not found" });
    }

    
    const customer = {
      customer_id: rows[0].customer_id,
      customer_name: rows[0].customer_name,
      email: rows[0].email,
      phone: rows[0].phone,
      address: rows[0].address,
      customer_created_at: rows[0].customer_created_at,
      meters: {}
    };

    rows.forEach(row => {
      // Add meter if exists
      if (row.meter_id && !customer.meters[row.meter_id]) {
        customer.meters[row.meter_id] = {
          meter_id: row.meter_id,
          meter_number: row.meter_number,
          installation_date: row.installation_date,
          meter_status: row.meter_status,
          utility: {
            utility_id: row.utility_id,
            utility_name: row.utility_name
          },
          readings: [],
          bills: []
        };
      }

      const meter = customer.meters[row.meter_id];

      if (meter) {
        // Add reading if exists and not duplicate
        if (row.reading_id && !meter.readings.find(r => r.reading_id === row.reading_id)) {
          meter.readings.push({
            reading_id: row.reading_id,
            reading_date: row.reading_date,
            previous_reading: row.previous_reading,
            current_reading: row.current_reading,
            consumption: row.consumption
          });
        }

        // Add bill if exists and not duplicate
        if (row.bill_id && !meter.bills.find(b => b.bill_id === row.bill_id)) {
          meter.bills.push({
            bill_id: row.bill_id,
            billing_month: row.billing_month,
            amount: row.amount,
            bill_status: row.bill_status
          });
        }
      }
    });

    // Convert meters object to array
    customer.meters = Object.values(customer.meters);

    res.json(customer);
  });
};

/* =========================
   GET METER WITH READINGS & BILLS
========================= */
export const getMeterWithRelations = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT
      m.meter_id,
      m.meter_number,
      m.installation_date,
      m.status AS meter_status,
      
      c.customer_id,
      c.name AS customer_name,
      c.email,
      c.phone,
      
      u.utility_id,
      u.utility_name,
      
      mr.reading_id,
      mr.reading_date,
      mr.previous_reading,
      mr.current_reading,
      mr.consumption,
      
      b.bill_id,
      b.billing_month,
      b.amount,
      b.status AS bill_status
    FROM Meter m
    JOIN Customer c ON m.customer_id = c.customer_id
    JOIN Utility u ON m.utility_id = u.utility_id
    LEFT JOIN MeterReading mr ON m.meter_id = mr.meter_id
    LEFT JOIN Bill b ON m.meter_id = b.meter_id
    WHERE m.meter_id = ?
    ORDER BY mr.reading_date DESC, b.billing_month DESC
  `;

  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.error("GET METER WITH RELATIONS ERROR:", err);
      return res.status(500).json({ message: "Failed to fetch meter relationships" });
    }

    if (!rows.length) {
      return res.status(404).json({ message: "Meter not found" });
    }

    // Build hierarchical structure
    const meter = {
      meter_id: rows[0].meter_id,
      meter_number: rows[0].meter_number,
      installation_date: rows[0].installation_date,
      meter_status: rows[0].meter_status,
      customer: {
        customer_id: rows[0].customer_id,
        customer_name: rows[0].customer_name,
        email: rows[0].email,
        phone: rows[0].phone
      },
      utility: {
        utility_id: rows[0].utility_id,
        utility_name: rows[0].utility_name
      },
      readings: [],
      bills: []
    };

    rows.forEach(row => {
      // Add reading if exists and not duplicate
      if (row.reading_id && !meter.readings.find(r => r.reading_id === row.reading_id)) {
        meter.readings.push({
          reading_id: row.reading_id,
          reading_date: row.reading_date,
          previous_reading: row.previous_reading,
          current_reading: row.current_reading,
          consumption: row.consumption
        });
      }

      // Add bill if exists and not duplicate
      if (row.bill_id && !meter.bills.find(b => b.bill_id === row.bill_id)) {
        meter.bills.push({
          bill_id: row.bill_id,
          billing_month: row.billing_month,
          amount: row.amount,
          bill_status: row.bill_status
        });
      }
    });

    res.json(meter);
  });
};

/* =========================
   GET RELATIONSHIP SUMMARY
========================= */
export const getRelationshipSummary = (req, res) => {
  const sql = `
    SELECT 
      (SELECT COUNT(*) FROM Customer) AS total_customers,
      (SELECT COUNT(*) FROM Meter) AS total_meters,
      (SELECT COUNT(*) FROM MeterReading) AS total_readings,
      (SELECT COUNT(*) FROM Bill) AS total_bills,
      (SELECT COUNT(*) FROM Bill WHERE status = 'PAID') AS paid_bills,
      (SELECT COUNT(*) FROM Bill WHERE status = 'UNPAID') AS unpaid_bills,
      (SELECT COUNT(DISTINCT customer_id) FROM Meter) AS customers_with_meters,
      (SELECT COUNT(DISTINCT meter_id) FROM MeterReading) AS meters_with_readings,
      (SELECT COUNT(DISTINCT meter_id) FROM Bill) AS meters_with_bills
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("GET RELATIONSHIP SUMMARY ERROR:", err);
      return res.status(500).json({ message: "Failed to fetch relationship summary" });
    }

    res.json(rows[0]);
  });
};
