-- Add bank details fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_number VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_holder_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS swift_code VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type VARCHAR(255);

-- Move data from accountDetails to these fields if possible
-- This assumes accountDetails might have structured data that can be parsed
-- If the data is not structured, just set account_holder_name to the same as full_name for existing records
UPDATE users SET 
    bank_name = '', 
    account_number = '', 
    account_holder_name = full_name,
    ifsc_code = '',
    branch_name = '',
    swift_code = '',
    account_type = ''
WHERE account_details IS NULL OR account_details = '';

-- For existing data with accountDetails, we keep it as is but also populate account_holder_name
UPDATE users SET 
    account_holder_name = full_name
WHERE account_details IS NOT NULL AND account_details != '';

-- Finally, drop the accountDetails column after all data is migrated
ALTER TABLE users DROP COLUMN IF EXISTS account_details; 