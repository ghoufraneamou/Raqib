-- Base AMMPS — authentification (MySQL 8+)
-- Créer la base : CREATE DATABASE ammps_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL DEFAULT '',
  verified TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- OTP Codes Table  
CREATE TABLE IF NOT EXISTS otp_codes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  purpose VARCHAR(32) NOT NULL,
  code_hash CHAR(64) NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  consumed TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_otp_email_purpose (email, purpose, consumed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
