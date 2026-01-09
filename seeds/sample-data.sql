-- Seed data for Utility Management System
-- Run with: mysql -u <user> -p ums_dbase < seeds/sample-data.sql

SET FOREIGN_KEY_CHECKS = 0;

-- Optional: ensure supporting tables exist for tariff plans and complaints
CREATE TABLE IF NOT EXISTS TariffPlan (
  plan_id INT AUTO_INCREMENT PRIMARY KEY,
  utility_id INT NOT NULL,
  plan_name VARCHAR(100) NOT NULL,
  base_rate DECIMAL(10,2) NOT NULL,
  per_unit_rate DECIMAL(10,2) NOT NULL,
  description TEXT,
  FOREIGN KEY (utility_id) REFERENCES Utility(utility_id)
);

CREATE TABLE IF NOT EXISTS Complaints (
  complaint_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  subject VARCHAR(150) NOT NULL,
  description TEXT,
  priority ENUM('Low','Medium','High') DEFAULT 'Medium',
  status ENUM('Open','In Progress','Resolved','Closed') DEFAULT 'Open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
);

CREATE TABLE IF NOT EXISTS Payment (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  bill_id INT NOT NULL,
  payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  amount_paid DECIMAL(12,2) NOT NULL,
  payment_method ENUM('CASH','CARD','BANK_TRANSFER','ONLINE','CHEQUE') DEFAULT 'CARD',
  FOREIGN KEY (bill_id) REFERENCES Bill(bill_id)
);

-- Clean tables so IDs start from 1 (order matters due to FK constraints)
TRUNCATE TABLE Payment;
TRUNCATE TABLE Bill;
TRUNCATE TABLE MeterReading;
TRUNCATE TABLE Meter;
TRUNCATE TABLE Complaints;
TRUNCATE TABLE TariffPlan;
TRUNCATE TABLE Customer;
TRUNCATE TABLE Utility;

SET FOREIGN_KEY_CHECKS = 1;

-- Master data -------------------------------------------------------------
INSERT INTO Utility (utility_id, utility_name, rate_per_unit)
VALUES
  (1, 'Electricity', 32.50),
  (2, 'Water', 15.00),
  (3, 'Telecom', 8.75);

INSERT INTO Customer (customer_id, name, email, phone, address)
VALUES
  (1, 'Hasini Perera', 'hasini@example.com', '+94 71 555 1020', 'Colombo 05'),
  (2, 'Thisharie Fernando', 'thisharie@example.com', '+94 77 123 9045', 'Negombo'),
  (3, 'Ravindu Samarasinghe', 'ravindu@example.com', '+94 70 888 2211', 'Galle');

INSERT INTO Meter (meter_id, meter_number, status, customer_id, utility_id)
VALUES
  (1, 'EL-1001', 'Active', 1, 1),
  (2, 'WT-3012', 'Active', 2, 2),
  (3, 'TC-5507', 'Maintenance', 3, 3);

INSERT INTO MeterReading (reading_id, meter_id, reading_date, previous_reading, current_reading, consumption)
VALUES
  (1, 1, '2025-11-30', 480, 515, 35),
  (2, 1, '2025-12-31', 515, 572, 57),
  (3, 2, '2025-11-30', 220, 240, 20),
  (4, 2, '2025-12-31', 240, 268, 28),
  (5, 3, '2025-11-30', 980, 1005, 25),
  (6, 3, '2025-12-31', 1005, 1044, 39);

INSERT INTO Bill (bill_id, meter_id, billing_month, consumption, amount, status)
VALUES
  (1, 1, '2025-12', 57, 57 * 32.50, 'UNPAID'),
  (2, 2, '2025-12', 28, 28 * 15.00, 'PAID'),
  (3, 3, '2025-12', 39, 39 * 8.75, 'UNPAID');

INSERT INTO Payment (payment_id, bill_id, payment_date, amount_paid, payment_method)
VALUES
  (1, 2, '2026-01-02', 420.00, 'CARD');

-- Tariff plans -----------------------------------------------------------
INSERT INTO TariffPlan (plan_id, utility_id, plan_name, base_rate, per_unit_rate, description)
VALUES
  (1, 1, 'Residential Saver', 500.00, 28.00, 'Tier for low usage homes'),
  (2, 1, 'Business Flex', 1200.00, 30.50, 'Slightly higher per unit but lower demand charge'),
  (3, 2, 'Household Water', 300.00, 12.50, 'Standard domestic connections'),
  (4, 3, 'Fiber 100 Mbps', 1500.00, 5.50, 'Fixed broadband plan');

-- Complaints -------------------------------------------------------------
INSERT INTO Complaints (complaint_id, customer_id, subject, description, priority, status, created_at, updated_at)
VALUES
  (1, 1, 'Voltage fluctuation', 'Experiencing frequent voltage dips in the evenings.', 'High', 'In Progress', '2026-01-03 09:30:00', '2026-01-03 09:30:00'),
  (2, 2, 'Meter reading mismatch', 'December bill shows higher consumption than the portal.', 'Medium', 'Open', '2026-01-04 11:05:00', '2026-01-04 11:05:00'),
  (3, 3, 'Slow internet', 'Fiber connection drops below 20 Mbps during peak hours.', 'High', 'Resolved', '2026-01-02 15:42:00', '2026-01-02 15:42:00');

-- Optional upcoming month bills using auto-generator reference
INSERT INTO Bill (meter_id, billing_month, consumption, amount, status)
SELECT m.meter_id, '2026-01', r.consumption, r.consumption * u.rate_per_unit, 'UNPAID'
FROM (
  SELECT mr.meter_id, mr.consumption, ROW_NUMBER() OVER (PARTITION BY mr.meter_id ORDER BY mr.reading_date DESC) AS rn
  FROM MeterReading mr
) r
JOIN Meter m ON r.meter_id = m.meter_id
JOIN Utility u ON m.utility_id = u.utility_id
WHERE r.rn = 1;
