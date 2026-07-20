# 📧 Resend Email Setup Guide

Quick guide to enable email notifications in your TickDesk deployment using Resend.

---

## Why Resend?

- ✅ **100 emails/day free** (perfect for student projects)
- ✅ Works on Render free tier (Gmail SMTP is blocked)
- ✅ Fast and reliable delivery
- ✅ Simple API integration
- ✅ No credit card required

---

## 🚀 Setup Steps (5 minutes)

### Step 1: Create Resend Account

1. Go to: **https://resend.com**
2. Click **Sign Up** (free)
3. Verify your email address
4. Complete onboarding

### Step 2: Get Your API Key

1. In Resend dashboard, click **API Keys** (left sidebar)
2. Click **Create API Key**
3. Name it: `TickDesk Production`
4. Click **Add**
5. **Copy the API key** (starts with `re_`)
   - ⚠️ Save it somewhere safe - you won't see it again!

### Step 3: Add to Render Environment Variables

1. Go to: **https://dashboard.render.com**
2. Click your **tickdesk-backend** service
3. Go to **Environment** tab
4. Click **Add Environment Variable**
5. Add these two variables:

```
Key: RESEND_API_KEY
Value: re_your_actual_api_key_here

Key: DEFAULT_FROM_EMAIL
Value: TickDesk <onboarding@resend.dev>
```

6. Click **Save Changes**
7. Wait for automatic redeploy (2-3 minutes)

### Step 4: Verify Your Domain (Optional - for custom sender)

**For now, use `onboarding@resend.dev`** - this works immediately.

Later, if you want to send from your own domain:
1. In Resend, go to **Domains**
2. Click **Add Domain**
3. Follow DNS setup instructions
4. Update `DEFAULT_FROM_EMAIL` to your domain

---

## 🧪 Testing Email

### Test 1: Sign Up New Company

1. Go to: https://tickdesk-app.vercel.app
2. Sign up with a **new** company and email
3. Check your `PLATFORM_NOTIFY_EMAIL` inbox
4. Should receive: "New company on TickDesk: [company name]"

### Test 2: Check Render Logs

1. Render Dashboard → Your service → **Logs**
2. Look for: `✅ Email sent successfully via Resend to [...] (ID: ...)`
3. If you see this, emails are working!

### Test 3: Resend Dashboard

1. Go to Resend dashboard
2. Click **Emails** (left sidebar)
3. You'll see all sent emails with delivery status

---

## 📊 Monitoring

### Free Tier Limits:
- **100 emails per day**
- **3,000 emails per month**

### Check Usage:
1. Resend Dashboard → **Usage**
2. See how many emails sent

---

## 🔧 Troubleshooting

### Email Not Sending?

**Check 1: API Key Set Correctly**
```bash
# In Render logs, look for:
✅ Email sent successfully via Resend
# NOT:
❌ Resend email failed
```

**Check 2: Environment Variables**
- Make sure `RESEND_API_KEY` is set in Render
- Make sure `PLATFORM_NOTIFY_EMAIL` is set (your email)
- Make sure `DEFAULT_FROM_EMAIL` is set

**Check 3: Render Logs**
- Look for error messages
- Should say "via Resend" not "via SMTP"

**Check 4: Resend Dashboard**
- Go to Emails tab
- Check delivery status
- Look for bounces/errors

---

## 📧 Email Types in TickDesk

Your app sends these emails:

1. **New Company Signup** → Platform admin notification
2. **User Invitations** → Invite links to join company
3. **Password Resets** (if implemented)
4. **Ticket Updates** (if implemented)

---

## 💰 Cost (for reference)

- **Free Tier**: 100 emails/day, 3,000/month
- **More than enough for a student project/portfolio**
- No credit card required

If you ever need more:
- **Pro Plan**: $20/month for 50,000 emails

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Resend account created
- [ ] API key copied
- [ ] `RESEND_API_KEY` added to Render
- [ ] `DEFAULT_FROM_EMAIL` set to `TickDesk <onboarding@resend.dev>`
- [ ] `PLATFORM_NOTIFY_EMAIL` set to your email
- [ ] Backend redeployed successfully
- [ ] Test signup sent email successfully
- [ ] Email visible in Resend dashboard
- [ ] Email received in your inbox

---

## 🎓 For Your Resume

You can mention:
- "Integrated Resend API for transactional email notifications"
- "Implemented asynchronous email sending with background threads"
- "100+ emails/day capacity for user notifications and invites"

---

## 🆘 Need Help?

If emails still don't work after setup:

1. Check Render logs for error messages
2. Verify all environment variables are set
3. Check Resend dashboard for delivery errors
4. Make sure you redeployed after adding env vars

---

**That's it! Your email notifications will now work perfectly! 🎉**
