# CRM API Documentation

## Base URL
```
Development: http://localhost:5001/api
Production: https://your-domain.com/api
```

## Authentication
All endpoints require Bearer token in Authorization header:
```
Authorization: Bearer <supabase_access_token>
```

---

## Endpoints

### 🔐 Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me` | Get current user profile |
| GET | `/users` | List all users (admin) |

---

### 👥 Leads
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/leads` | List all leads |
| POST | `/leads` | Create new lead |
| GET | `/leads/:id` | Get lead by ID |
| PUT | `/leads/:id` | Update lead |
| DELETE | `/leads/:id` | Delete lead (admin) |

**Create Lead Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Acme Inc",
  "source": "website",
  "status": "new",
  "assigned_to": "uuid"
}
```

---

### 💰 Deals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/deals` | List all deals |
| GET | `/deals/stats` | Pipeline statistics |
| POST | `/deals` | Create deal (converts lead) |
| PUT | `/deals/:id` | Update deal/stage |
| DELETE | `/deals/:id` | Delete deal |

**Deal Stages:** `prospecting`, `negotiation`, `closed_won`, `closed_lost`

**Create Deal Body:**
```json
{
  "name": "Enterprise Contract",
  "lead_id": "uuid",
  "amount": 50000,
  "stage": "prospecting",
  "expected_close_date": "2024-03-01"
}
```

---

### 📋 Follow-ups
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/followups?type=today\|upcoming\|missed` | List follow-ups |
| POST | `/followups` | Create follow-up |
| PUT | `/followups/:id` | Update follow-up |
| DELETE | `/followups/:id` | Delete follow-up |

---

### 👨‍💼 Employees (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/employees` | List with performance stats |
| GET | `/employees/roles` | List available roles |
| PUT | `/employees/:id` | Update role/status |

---

### 📊 Reports (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/leads?from=&to=` | Lead report |
| GET | `/reports/sales?from=&to=` | Sales report |
| GET | `/reports/employees?from=&to=` | Team performance |

---

### 📜 Activities
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/activities?user_id=&type=&from=&to=` | List activities |
| GET | `/activities/stats` | Activity statistics |
| POST | `/activities/auth` | Log auth events |

---

## Response Format
```json
{
  "success": true,
  "data": { ... }
}
```

## Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```
