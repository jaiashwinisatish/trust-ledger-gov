

# AI-Powered Government Document Management System

## Overview
A secure, professional government document management platform with real authentication, document upload/storage, AI-powered OCR & classification, and an analytics dashboard. Government/formal design with navy blue tones.

## Design System
- **Primary colors**: Navy blue (#1e3a5f), accent blue (#3b82f6), white backgrounds
- **Typography**: Clean, professional, Inter font family
- **Style**: Formal institutional look with structured layouts, clear hierarchy, subtle borders, official seal/shield iconography

## Pages & Features

### 1. Authentication (Login/Signup)
- Email/password authentication via Lovable Cloud
- Government-branded login page with official styling
- Role selection during signup (Admin, Officer, Citizen)
- Roles stored in a separate `user_roles` table with RLS

### 2. Dashboard (Home)
- Overview cards: Total documents, pending reviews, flagged documents, recent uploads
- Document workflow status chart (uploaded → reviewed → approved)
- Recent activity feed showing latest uploads and actions
- Quick action buttons for common tasks

### 3. Document Upload & Storage
- Drag-and-drop upload zone for PDFs, images, and scanned documents
- Document metadata form: title, category (Birth Certificate, Land Record, Tax Filing, etc.), department, priority
- Supabase Storage bucket for secure file storage
- Document list view with filters by status, category, date, department

### 4. AI-Powered OCR & Auto-Classification
- On upload, documents are processed via Lovable AI (edge function)
- AI extracts text content from uploaded documents
- Auto-suggests document category, department, and key metadata
- Displays extracted text alongside the original document
- Confidence score for classification

### 5. AI Anomaly Detection
- AI flags documents with suspicious patterns (duplicate content, metadata mismatches)
- Visual indicators (red/yellow badges) on flagged documents
- Anomaly detail panel showing what was detected and why

### 6. Analytics Dashboard
- Charts showing: documents by category, upload trends over time, processing bottlenecks
- Pending approvals queue with aging indicators
- Department-level breakdown of document volumes
- Status distribution (pending, approved, flagged, archived)

### 7. Document Detail View
- Full document preview (PDF viewer / image viewer)
- Extracted OCR text panel
- AI classification results with confidence
- Audit trail log (who uploaded, viewed, edited)
- Status management (approve, flag, archive)

### 8. Role-Based Access
- **Admin**: Full access, user management, all documents, analytics
- **Officer**: Department documents, can review/approve, limited analytics
- **Citizen**: Upload own documents, view own document status only

## Database Schema
- `documents` — id, title, category, department, status, file_path, uploaded_by, ocr_text, ai_classification, confidence_score, flagged, created_at
- `user_roles` — id, user_id, role (enum: admin, officer, citizen)
- `profiles` — id, user_id, full_name, department
- `audit_logs` — id, document_id, user_id, action, details, created_at

## Backend
- Lovable Cloud for auth, database, storage, and edge functions
- Edge function for AI document processing (OCR extraction + classification via Lovable AI)
- Edge function for anomaly detection
- Storage bucket with RLS policies per role

