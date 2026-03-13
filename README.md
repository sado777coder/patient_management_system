Hospital Patient Management System API

Version: 1.0.0
OpenAPI Spec: OAS 3.0

The Hospital Patient Management System API is a production-ready healthcare backend built with Node.js, Express, MongoDB, and Stripe.

It provides a complete Hospital Information System (HIS) for managing:

Patients

Clinical workflows

Pharmacy

Laboratory operations

Billing and payments

Maternity services

Hospital administration

The API includes JWT authentication, Swagger documentation, audit logging, and payment integration with Stripe.

Features
Authentication

JWT authentication

User registration and login

Role-based access control

Patient Management

Patient registration

Patient profiles

Medical history records

Visit tracking

Clinical Workflow

Patient visits

Triage and vital signs

Diagnosis

Prescriptions

Medical records

Pharmacy

Medication catalog

Prescription dispensing

Medication inventory management

Laboratory

Lab orders

Lab results

Diagnostic workflows

Billing & Payments

Billing charges

Stripe payments

Invoice management

Insurance claims

Hospital Operations

Bed management

Patient admissions

Patient discharge

Queue management

Maternal Health

Antenatal visits

Delivery records

Postnatal care

Abortion records

Referrals

Administration

User management

Hospital management

Audit logs

Reporting

Analytics

Live Links

Swagger Documentation (OpenAPI)

https://patient-management-system-6jvc.onrender.com/api/docs

Swagger JSON

https://patient-management-system-6jvc.onrender.com/api/docs-json
Installation

Clone the repository

git clone https://github.com/your-username/patient-management-system.git
cd patient-management-system

Install dependencies

npm install

Create a .env file.

Run the application

npm run dev
Environment Variables

Create a .env file in the root directory.

PORT=3004

MONGO_URI=mongodb://localhost/hospital

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d

STRIPE_SECRET=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret
API Endpoints
Authentication
Method	Endpoint	Description
POST	/api/auth/login	Login user
POST	/api/auth/register	Register user
Patients
Method	Endpoint	Description
GET	/api/patients	Get all patients
POST	/api/patients	Create patient
GET	/api/patients/:id	Get patient by ID
PUT	/api/patients/:id	Update patient
DELETE	/api/patients/:id	Delete patient
Visits
Method	Endpoint	Description
POST	/api/visits	Create visit
GET	/api/visits	Get visits
PUT	/api/visits/:id	Update visit
DELETE	/api/visits/:id	Delete visit
Triage
Method	Endpoint	Description
POST	/api/triage	Record patient vitals
GET	/api/triage	Get triage records
Diagnosis
Method	Endpoint	Description
POST	/api/diagnoses	Create diagnosis
GET	/api/diagnoses	Get diagnoses
Prescriptions
Method	Endpoint	Description
POST	/api/prescriptions	Create prescription
GET	/api/prescriptions	Get prescriptions
Medications
Method	Endpoint	Description
POST	/api/medications	Create medication
GET	/api/medications	Get medications
PUT	/api/medications/:id	Update medication
DELETE	/api/medications/:id	Delete medication
Pharmacy / Dispense
Method	Endpoint	Description
POST	/api/dispenses	Dispense medication
GET	/api/dispenses	Get dispense history
Lab Orders
Method	Endpoint	Description
POST	/api/lab-orders	Create lab order
GET	/api/lab-orders	Get lab orders
Lab Results
Method	Endpoint	Description
POST	/api/lab-results	Add lab result
GET	/api/lab-results	Get lab results
Billing
Method	Endpoint	Description
POST	/api/billing	Create billing charge
GET	/api/billing	Get billing records
Payments
Method	Endpoint	Description
POST	/api/payments/checkout	Create Stripe checkout session
Insurance Claims
Method	Endpoint	Description
POST	/api/claim	Submit insurance claim
GET	/api/claim	Get claims
Admissions
Method	Endpoint	Description
POST	/api/admissions	Admit patient
GET	/api/admissions	Get admissions
Discharges
Method	Endpoint	Description
POST	/api/discharges	Discharge patient
Beds
Method	Endpoint	Description
GET	/api/beds	Get hospital beds
POST	/api/beds	Create bed
Queue
Method	Endpoint	Description
POST	/api/queue	Add patient to queue
GET	/api/queue	Get queue
Audit Logs
Method	Endpoint	Description
GET	/api/audit	Get system audit logs
Analytics
Method	Endpoint	Description
GET	/api/analytics	Get hospital analytics
Documentation

Swagger UI

http://localhost:3004/api/docs

Swagger JSON

http://localhost:3004/api/docs-json
Project Structure
src
 ├── controllers
 ├── models
 ├── routes
 ├── validators
 ├── middlewares
 ├── services
 ├── config
 │    └── swagger.yaml
 └── app.js
Security

JWT authentication

Helmet security headers

Rate limiting

Stripe webhook verification

Audit logging

Payment Flow

Billing creates invoice

Payment endpoint creates Stripe checkout session

Stripe webhook confirms payment

Invoice is marked as paid

Deployment

Recommended production stack:

Backend
Node.js (Render / AWS / Railway)

Database
MongoDB Atlas

Payments
Stripe

API Documentation
Swagger / OpenAPI

Future Improvements

Multi-hospital support

FHIR healthcare standard integration

Electronic medical records export

Telemedicine

Mobile application

License

MIT

Author

Developed by Amos Ofori Sottie
