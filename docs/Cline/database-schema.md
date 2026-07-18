# Database Schema (MySQL)

## users: id, email, password, name, created_at
## registrations: id, type, name, phone, email, specialty, workplace, workshops, created_at
## content: id, key, value, updated_at
## tracks: id, track_id, icon, title, desc, sort_order
## schedule: id, day, time, title, speaker, track, sort_order
## committees: id, icon, title, desc, sort_order
## workshops: id, name, capacity, sort_order
## sponsors: id, name, tier, desc, logo_url, sort_order
## posters: id, title, researcher_name, specialty, image_url, description, sort_order
## submissions: id, name, phone, email, degree, affiliation, title, submission_type, status, cv_path, photo_path, created_at
## submission_files: id, submission_id, file_type, file_path, original_name, file_size, created_at

All: ENGINE=InnoDB, CHARSET=utf8mb4
