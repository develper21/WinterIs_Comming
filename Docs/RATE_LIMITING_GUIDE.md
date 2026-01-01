# Rate Limiting Configuration Guide

## Overview
Your application has rate limiting on login endpoints to prevent brute force attacks. During development/testing, you can easily enable or disable this feature.

---

## Current Rate Limiting Rules

### Login Attempts
- **Limit:** 5 attempts per 15 minutes
- **Message:** "Too many login attempts. Please try again in 15 minutes."
- **Applies to:** `/api/auth/login` and `/api/superadmin/auth/login`

### Registration
- **Limit:** 5 attempts per 1 hour
- **Message:** "Too many accounts created from this IP, please try again after an hour."

### General API
- **Limit:** 100 requests per 10 minutes

### Strict Operations
- **Limit:** 3 requests per 1 minute

---

## Enable/Disable Rate Limiting

### Location: `.env` file

```env
# Rate limiting configuration
# true = Rate limiting ENABLED (production/security)
# false = Rate limiting DISABLED (development/testing)
ENABLE_RATE_LIMIT=true
```

---

## During Development/Testing

### To DISABLE rate limiting:

**Edit `.env`:**
```env
ENABLE_RATE_LIMIT=false
```

**Then restart your backend server:**
```bash
npm start
# or
node server.js
```

**Expected console output:**
```
[RATE_LIMIT_DISABLED] POST /api/auth/login - Rate limiting bypassed for development
[RATE_LIMIT_DISABLED] POST /api/superadmin/auth/login - Rate limiting bypassed for development
```

Now you can test login as many times as you want without being blocked!

---

### To RE-ENABLE rate limiting:

**Edit `.env`:**
```env
ENABLE_RATE_LIMIT=true
```

**Restart your backend server:**
```bash
npm start
```

---

## How It Works

1. **Environment Variable Check:**
   - Reads `ENABLE_RATE_LIMIT` from `.env`
   - Defaults to `true` if not specified (safe for production)

2. **Conditional Middleware:**
   - If enabled → Rate limiting is applied
   - If disabled → Requests bypass rate limiting (logs "RATE_LIMIT_DISABLED")

3. **All Limiters Affected:**
   - Login Limiter
   - Register Limiter
   - General API Limiter
   - Strict Limiter

---

## Production vs Development

| Environment | ENABLE_RATE_LIMIT | Behavior |
|------------|-----------------|----------|
| **Production** | `true` | Rate limiting active (secure) |
| **Development** | `false` | Rate limiting disabled (test freely) |
| **Testing** | `false` | Rate limiting disabled (unlimited attempts) |

---

## Example Scenarios

### Scenario 1: Testing Multiple Logins
```
ENABLE_RATE_LIMIT=false

// Can now test login 10+ times in a minute without being blocked
```

### Scenario 2: Production Ready
```
ENABLE_RATE_LIMIT=true

// After 5 failed login attempts, users must wait 15 minutes
```

### Scenario 3: Testing Rate Limit Behavior
```
ENABLE_RATE_LIMIT=true

// Test to ensure rate limiting works as expected
// Try logging in 6+ times in a minute
// You should see 429 error after 5 attempts
```

---

## Console Logs

When rate limiting is disabled, you'll see:
```
[RATE_LIMIT_DISABLED] POST /api/auth/login - Rate limiting bypassed for development
[RATE_LIMIT_DISABLED] POST /api/superadmin/auth/login - Rate limiting bypassed for development
```

When rate limiting is enabled:
```
// Normal requests pass through silently
// Blocked requests return 429 status with message
```

---

## Testing Rate Limits (When Enabled)

If you want to test the rate limiting behavior:

1. Set `ENABLE_RATE_LIMIT=true`
2. Try login 5 times with wrong credentials (within 15 minutes)
3. On the 6th attempt, you'll get:
   ```json
   {
     "success": false,
     "message": "Too many login attempts. Please try again in 15 minutes.",
     "data": null
   }
   ```

---

## Summary

| Task | Configuration |
|------|---|
| **Allow unlimited login attempts** | `ENABLE_RATE_LIMIT=false` |
| **Enable security/rate limiting** | `ENABLE_RATE_LIMIT=true` |
| **Default behavior** | `true` (if not specified) |
