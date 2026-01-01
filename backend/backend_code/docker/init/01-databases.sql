-- Create Staging Database
CREATE DATABASE IF NOT EXISTS e4l_staging;
CREATE USER IF NOT EXISTS 'staging_user'@'%' IDENTIFIED BY 'staging_pass';
GRANT ALL PRIVILEGES ON e4l_staging.* TO 'staging_user'@'%';

-- Create Production Database
CREATE DATABASE IF NOT EXISTS e4l_prod;
CREATE USER IF NOT EXISTS 'prod_user'@'%' IDENTIFIED BY 'prod_pass';
GRANT ALL PRIVILEGES ON e4l_prod.* TO 'prod_user'@'%';

FLUSH PRIVILEGES;
