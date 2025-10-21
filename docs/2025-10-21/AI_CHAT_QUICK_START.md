# 🤖 AI CHAT - QUICK START

## 🚀 5-MINUTE SETUP

### **Step 1: Get OpenAI API Key**
1. Go to https://platform.openai.com/
2. Sign up / Log in
3. Navigate to API Keys
4. Create new secret key
5. Copy the key (starts with `sk-...`)

### **Step 2: Add to Vercel**
1. Open Vercel dashboard
2. Go to your project → Settings → Environment Variables
3. Add new variable:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** `sk-your-key-here`
   - **Environments:** Production, Preview, Development
4. Click "Save"

### **Step 3: Deploy**
```bash
git push origin main
```

That's it! ✅

---

## 🎯 WHAT IT DOES

- ✅ Floating chat button (bottom-right corner)
- ✅ Works on homepage AND logged-in pages
- ✅ Answers questions about Performile
- ✅ Helps users navigate the platform
- ✅ **SECURE:** No user roles or subscription data exposed

---

## 🔐 SECURITY

**What AI CAN'T See:**
- ❌ User roles
- ❌ Subscription plans
- ❌ Payment info
- ❌ Personal data

**What AI CAN Help With:**
- ✅ Platform features
- ✅ How-to guides
- ✅ Navigation help
- ✅ General questions

---

## 💰 COST

**~$0.024 per message**

**Monthly estimates:**
- 100 msgs/day = $72/month
- 500 msgs/day = $360/month

---

## 🧪 TEST IT

1. Open homepage
2. Click chat button (bottom-right)
3. Ask: "What is Performile?"
4. Get instant AI response!

---

## 📁 FILES CREATED

```
apps/web/src/components/chat/AIChatWidget.tsx
apps/web/src/services/chatService.ts
apps/api/chat.ts
```

---

## ✅ DONE!

Chat is now live on your site! 🎉

**Full docs:** `AI_CHAT_SETUP_GUIDE.md`
