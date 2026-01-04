# Pawar Pathology Lab - Next-Gen Diagnostic Management System

![Pawar Pathology Lab Banner](/public/banner.png) *<!-- Placeholder for actual banner if exists, or remove if not -->*

## 🏥 Overview

**Pawar Pathology Lab** is a state-of-the-art diagnostic center management platform designed to streamline the entire pathology workflow—from patient booking to report delivery. Built with **Next.js 14**, **TypeScript**, and **MongoDB**, this application focuses on providing a seamless, high-performance experience for patients, partners, and administrators.

The system replaces traditional manual processes with a digital-first approach, featuring real-time booking, automated notifications, and secure report access, ensuring **NABH compliance** and data security throughout the patient journey.

---

## ✨ Core Features

### 📅 Advanced Booking Wizard
A highly intuitive, multi-step booking engine for patients.
- **Dynamic Slot Selection**: Real-time availability checking.
- **Smart Test Search**: Instant search with categorization.
- **Home Collection Toggle**: Seamlessly switch between clinic visits and home sample collection.
- **Coupon System**: Integrated discount logic with validation.

### 📊 Role-Based Dashboards
Tailored interfaces for different user types, secured by **Role-Based Access Control (RBAC)**.

- **Admin Command Center**:
  - Global view of all appointments (Pending, Confirmed, Completed).
  - Revenue analytics and daily reporting.
  - Staff and doctor management.
  - Content management for tests and packages.

- **Partner Portal**:
  - Referral tracking for referring doctors and labs.
  - Commission transparency and payout history.
  - Quick-booking tools for partners to register patients.

- **Patient Portal**:
  - Appointment history.
  - Secure download of PDF reports.
  - Profile management.

### 🔔 Smart Notification Hub
An omni-channel notification system ensuring no communication is missed.
- **WhatsApp Cloud API**: Instant booking confirmations and status updates.
- **Gmail API**: Professional email notifications with deep links.
- **Telegram Bot API**: Real-time admin alerts for new bookings and critical system events.

### 🛡️ Security & Compliance
- **Authentication**: Powered by **NextAuth.js** with custom credentials provider.
- **Data Protection**: **BCrypt** hashing for passwords, granular API access controls.
- **Verification**: OTP-based verification for critical actions.
- **Audit Logs**: Comprehensive tracking of system actions for accountability.

---

## 🏗️ Technical Architecture

The application checks all boxes for a modern, production-grade web application:

### Tech Stack
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/) for type safety.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with **Framer Motion** for animations.
- **Database**: [MongoDB](https://www.mongodb.com/) with **Mongoose** ORM.
- **3D Graphics**: **Three.js** (@react-three/fiber) for immersive UI elements.

### Key Architectural Decisions
- **Server Actions**: Leveraging Next.js Server Actions for secure, direct backend mutations.
- **Edge Compatibility**: Designed with edge-ready patterns where possible.
- **Optimistic UI**: Immediate feedback implementation for smoother user interactions.
- **Responsive Design**: Mobile-first architecture ensuring full functionality on all devices.

---

## 🔄 User Workflows

### 1. The Patient Journey
1.  **Discovery**: Patient lands on the high-performance landing page.
2.  **Selection**: Searches for specific tests or selects health packages.
3.  **Booking**: Completes the wizard (Date/Time -> Details -> Payment Mode).
4.  **Confirmation**: Receives instant WhatsApp/Email confirmation.
5.  **Result**: Downloads the signed report securely from the portal upon completion.

### 2. Administrator Operations
1.  **Monitoring**: Views daily schedule via the Admin Dashboard.
2.  **Processing**: Updates sample collection status and report generation.
3.  **Management**: Adds new test types or updates pricing dynamically.

---

## 🔌 Integrations

| Service | Purpose |
| :--- | :--- |
| **Google Drive API** | Secure cloud storage for generated patient reports. |
| **Gmail API** | Transactional email delivery infrastructure. |
| **WhatsApp Cloud API** | Business-grade messaging for high engagement. |
| **Telegram API** | Internal alerting system for operations teams. |

---

## 🚀 Performance & UX

- **Dynamic Island Navigation**: iPhone-inspired fluid navigation menu.
- **Skeleton Loading**: Optimized loading states (Shimmer effects) for perceived performance.
- **SEO Optimized**: Metadata-rich pages for better search engine visibility.
- **Maintenance Mode**: Granular system controls to toggle access for specific user groups during updates.

---

> **Note**: This is a production application. Source code access is restricted to authorized personnel. Environment configurations and secrets are managed via secure vaults and are not exposed in this repository.

## 📧 Contact
**Pawar Pathology Lab**  
Betul, Madhya Pradesh  
*Precision Diagnostics Since 1998*

---
<div align="center">
  <sub>Built with ❤️ by Jhankar Jhade 9826852135 jhadejhankar@gmail.com</sub>
</div>

