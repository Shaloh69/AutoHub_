-- ====================================
-- Migration: Add car_documents table
-- Purpose: Store car documentation (OR/CR, registration, insurance, etc.)
-- Date: 2025-01-21
-- ====================================

CREATE TABLE IF NOT EXISTS car_documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    car_id INT NOT NULL,
    document_type ENUM('OR_CR', 'REGISTRATION', 'INSURANCE', 'WARRANTY', 'SERVICE_HISTORY', 'DEED_OF_SALE', 'LTO_DOCUMENTS', 'OTHER') NOT NULL,
    document_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INT,  -- in bytes
    mime_type VARCHAR(100),  -- e.g., application/pdf, image/jpeg
    title VARCHAR(255),
    description TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,  -- Admin can verify document authenticity
    verified_by INT,  -- Admin user who verified
    verified_at TIMESTAMP NULL,

    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_car (car_id),
    INDEX idx_document_type (document_type),
    INDEX idx_verified (is_verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comments for better documentation
ALTER TABLE car_documents
COMMENT = 'Stores car documentation files uploaded by sellers for admin verification';
