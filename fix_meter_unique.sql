-- Enforce one meter per utility per customer
ALTER TABLE Meter
ADD CONSTRAINT uq_customer_utility UNIQUE (customer_id, utility_id);
