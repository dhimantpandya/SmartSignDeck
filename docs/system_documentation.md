# SmartSignDeck System Documentation

This document provides a technical overview of the SmartSignDeck system through various architectural and data flow diagrams.

---

## 🏗️ System Architecture Diagram
The architecture follows a modern MERN-like stack with external integrations for media and communication.

```mermaid
graph TD
    User((User / Browser)) -->|HTTPS| Frontend[React + Vite Frontend]
    Frontend -->|REST API + Socket.io| Backend[Node.js + Express Backend]
    
    subgraph "Backend Services"
        Backend -->|Mongoose| MongoDB[(MongoDB Atlas)]
    end
    
    subgraph "External Integrations"
        Backend -->|Gmail API| Google[Gmail REST API]
        Backend -->|S3 SDK| AWS[AWS S3 Bucket]
        Backend -->|Admin SDK| Firebase[Firebase Auth]
        Backend -->|Cloudinary SDK| Cloudinary[Cloudinary Media]
    end
    
    Backend -->|Socket.io| LiveDevices[Live Signage Screens]
```

---

## 👤 Use Case Diagram
Describes how different types of actors interact with the system.

```mermaid
graph TD
    SA[Super Admin]
    CA[Company Admin]
    U[End User]

    subgraph "SmartSignDeck System"
        UC1(System Management)
        UC2(User & Role Management)
        UC3(Media Library Management)
        UC4(Template Creation)
        UC5(Playlist Scheduling)
        UC6(Screen Monitoring)
        UC7(Analytics)
        UC8(OTP Registration)
    end

    SA --> UC1
    SA --> UC2
    
    CA --> UC2
    CA --> UC3
    CA --> UC4
    CA --> UC5
    CA --> UC6
    CA --> UC7

    U --> UC8
    U --> UC3
    U --> UC4
```

---

## 🔄 Data Flow Diagram (DFD Level 1)
Shows the flow of information between processes and external entities.

```mermaid
graph LR
    User((User))
    Process[SmartSignDeck Backend]
    Database[(Mongoose DB)]
    Storage[[AWS S3 / Cloudinary]]
    EmailSvc[[Gmail API]]

    User -->|Auth Credentials| Process
    Process -->|Verification OTP| User
    
    User -->|Media Upload| Process
    Process -->|Store Media| Storage
    Storage -->|Media URL| Process
    
    Process -->|CRUD Operations| Database
    Database -->|Query Results| Process
    
    Process -->|Send Email| EmailSvc
    
    Process -->|UI State / Data| User
```

---

## 📊 Entity Relationship (ER) Diagram
Represents the database structure and relationships between core entities.

```mermaid
erDiagram
    COMPANY ||--o{ USER : contains
    COMPANY ||--o{ SCREEN : owns
    COMPANY ||--o{ TEMPLATE : creates
    COMPANY ||--o{ PLAYLIST : schedules
    
    USER ||--o{ TOKEN : owns
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ PLAYLIST : creates
    
    ROLE ||--o{ PERMISSION : defines
    USER }|--|| ROLE : assigned
    
    SCREEN ||--o{ PLAYBACK_LOG : generates
    SCREEN }|--|| PLAYLIST : displays
    
    PLAYLIST ||--o{ TEMPLATE : contains
    
    TEMPLATE ||--o{ ZONE : defines
```

---

## 🧪 Sequence Diagram: User Registration & OTP
Illustrates the flow we've been debugging: Registration via Gmail API.

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as MongoDB
    participant G as Gmail API

    U->>F: Enter Registration Details
    F->>B: POST /v1/auth/register
    B->>DB: Check if User Exists
    DB-->>B: User Not Found
    B->>DB: Save Pending Signup (OTP)
    B->>B: Generate OTP
    
    B->>G: Send OTP via Gmail API (HTTP)
    G-->>B: 200 OK (Email Sent)
    
    B-->>F: 200 OK (Verification Required)
    F-->>U: Show OTP Verification Screen
    
    U->>F: Enter 6-digit OTP
    F->>B: POST /v1/auth/verify-otp
    B->>DB: Compare OTP
    DB-->>B: Valid
    B->>DB: Promote Pending User to Active
    B-->>F: 200 OK (Registration Complete)
```
