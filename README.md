<div align="center">
  <img src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" alt="Pawar Pathology Lab Banner" width="100%" />
  
  # Pawar Pathology Lab
  
  **Next-Generation Diagnostic Lab Management Platform**
  
  [![Next.js](https://img.shields.io/badge/Next.js-14.0-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Leaf-green?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
  [![Shadcn UI](https://img.shields.io/badge/Shadcn_UI-Components-black?style=for-the-badge&logo=shadcnui&logoColor=white)](https://ui.shadcn.com/)
  [![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](LICENSE)

</div>

---

## 📋 Problem Statement
Traditional pathology labs often struggle with fragmented workflows, manual reporting, and poor patient engagement. Problems include:
- **Inefficient Booking**: Manual phone/walk-in bookings leading to queues and errors.
- **Report Delivery Delays**: Physical collection or scattered email chains.
- **Lack of Transparency**: Patients unsure about test status or pricing.
- **Operational Silos**: Disconnected systems for admin, partners, and lab technicians.

**Pawar Pathology Lab** provides a unified, digital-first solution to streamline operations, enhance diagnostic precision, and deliver a premium patient experience.

---

## 🚀 Key Features
- **Smart Booking Wizard**: Interactive, multi-step booking for Home Collection or Lab Visit with real-time slot selection.
- **Role-Based Dashboards**:
  - **Admin**: Complete oversight of bookings, reports, and partner management.
  - **Patient**: Track test status, download secure PDF reports, and manage profile.
  - **Partner**: Referral management and commission tracking.
- **Automated Notification Hub**:
    - **WhatsApp**: Direct alerts for confirmations and report readiness.
    - **Telegram**: Instant internal staff alerts for new bookings.
    - **Email**: Professional HTML templates with precise appointment details.
- **Coupon & Discount Engine**: Dynamic discount codes and promotional campaigns.
- **Secure Report Management**: Google Drive integrated storage for secure Report PDF hosting and delivery.

---

## 🛠️ Tech Stack
| Category | Technologies |
|----------|--------------|
| **Frontend** | Next.js 14 (App Router), React 18, TailwindCSS, Framer Motion, Three.js |
| **Backend** | Next.js API Routes, Node.js |
| **Database** | MongoDB (Mongoose ODM) |
| **Auth** | NextAuth.js (Credentials & Social) |
| **Utilities** | Lucide React (Icons), Sonner (Toasts), Zod (Validation) |
| **Integrations**| Google Drive API (Storage), Gmail API (Email), Telegram Bot API |

---

## 👥 Use Cases

### 1. The Patient
*Scenario*: A patient needs a Thyroid Profile test.
- **Action**: Visits website -> Selects Test -> Chooses "Home Collection" -> Pays Online/COD.
- **Result**: Receives instant WhatsApp/Email confirmation. Phlebotomist arrives at scheduled time. Report downloaded from dashboard next day.

### 2. The Lab Administrator
*Scenario*: A new booking comes in.
- **Action**: Acknowledges Telegram alert -> Verifies details in Admin Panel -> Assigns phlebotomist.
- **Result**: Smooth workflow zero manual data entry errors.

### 3. The Partner Doctor
*Scenario*: Referring a patient.
- **Action**: Logs into Partner Portal -> Refers patient via unique code.
- **Result**: Patient gets discount, Partner gets transparent commission tracking.

---

## ⚡ Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Instance (Local or Atlas)
- Google Cloud Console Project (for Auth & Drive API)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/pawar-pathology-lab.git
   cd pawar-pathology-lab
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Database
   MONGODB_URI=mongodb+srv://...

   # Authentication
   NEXTAUTH_SECRET=your_super_secret
   NEXTAUTH_URL=http://localhost:3000

   # Google APIs (Drive, Gmail, Auth)
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   REPORTS_GOOGLE_REFRESH_TOKEN=...
   
   # Notifications
   TELEGRAM_BOT_TOKEN=...
   TELEGRAM_ADMIN_CHAT_ID=...
   WHATSAPP_TOKEN=...
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

Access the app at `http://localhost:3000`.

---

## 📂 Project Structure
```
pawar-pathology-lab/
├── app/                  # Next.js App Router
│   ├── api/              # API Routes (Bookings, Auth, Reports)
│   ├── dashboard/        # Admin/Partner Dashboards
│   ├── reports/          # Patient Reports Portal
│   └── layout.tsx        # Root Layout & Providers
├── components/           # Reusable UI Components
├── lib/                  # Utilities (Notifications, DB Connect)
├── models/               # Mongoose Schemas (Booking, User, Test)
├── public/               # Static Assets
└── types/                # TypeScript Interfaces
```

---

## 📧 Contact
**Pawar Pathology Lab**  
Betul, Madhya Pradesh  
*Precision Diagnostics Since 1998*

---
<div align="center">
  <sub>Built with ❤️ by Jhankar Jhade</sub>
</div>
