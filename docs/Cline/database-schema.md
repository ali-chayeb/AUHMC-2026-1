# Database Schema (MySQL/MariaDB)

## users
id INT PK AUTO_INCREMENT, email VARCHAR(255) UNIQUE, password VARCHAR(255), name VARCHAR(255), created_at TIMESTAMP

## registrations
id INT PK AUTO_INCREMENT, type VARCHAR(50), name VARCHAR(255), phone VARCHAR(50), email VARCHAR(255), specialty VARCHAR(255), workplace VARCHAR(255), workshops TEXT, created_at TIMESTAMP

## content
id INT PK AUTO_INCREMENT, key VARCHAR(100) UNIQUE, value TEXT, updated_at TIMESTAMP

## tracks
id INT PK AUTO_INCREMENT, track_id VARCHAR(100) UNIQUE, icon VARCHAR(100), title VARCHAR(255), desc TEXT, sort_order INT

## schedule
id INT PK AUTO_INCREMENT, day INT, time VARCHAR(100), title VARCHAR(255), speaker VARCHAR(255), track VARCHAR(255), sort_order INT

## committees
id INT PK AUTO_INCREMENT, icon VARCHAR(100), title VARCHAR(255), desc TEXT, sort_order INT

## workshops
id INT PK AUTO_INCREMENT, name VARCHAR(255), capacity INT, sort_order INT

## sponsors
id INT PK AUTO_INCREMENT, name VARCHAR(255), tier VARCHAR(100), desc TEXT, logo_url VARCHAR(500), sort_order INT

## posters
id INT PK AUTO_INCREMENT, title VARCHAR(255), researcher_name VARCHAR(255), specialty VARCHAR(255), image_url VARCHAR(500), description TEXT, sort_order INT

## submissions
id INT PK AUTO_INCREMENT, name, phone, email, degree, affiliation, title VARCHAR(500), submission_type VARCHAR(50), status VARCHAR(50) DEFAULT 'pending', cv_path VARCHAR(500), photo_path VARCHAR(500), created_at TIMESTAMP

## submission_files
id INT PK AUTO_INCREMENT, submission_id INT FK, file_type VARCHAR(50), file_path VARCHAR(500), original_name VARCHAR(255), file_size INT, created_at TIMESTAMP
