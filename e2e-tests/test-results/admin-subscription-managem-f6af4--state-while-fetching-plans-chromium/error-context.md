# Page snapshot

```yaml
- generic [ref=e7]:
  - generic [ref=e8]:
    - img "Performile Logo" [ref=e9]
    - heading "Performile" [level=1] [ref=e10]
    - paragraph [ref=e11]: Elevate Every Delivery
  - heading "Sign In" [level=2] [ref=e12]
  - paragraph [ref=e13]: Welcome back to your dashboard
  - alert [ref=e14]:
    - img [ref=e16]
    - generic [ref=e18]: Login failed. Please check your credentials and try again.
  - generic [ref=e19]:
    - generic [ref=e20]:
      - generic [ref=e21]: Email Address
      - generic [ref=e22]:
        - img [ref=e24]
        - textbox "Email Address" [ref=e26]: admin@test.com
        - group:
          - generic: Email Address
    - generic [ref=e27]:
      - generic [ref=e28]: Password
      - generic [ref=e29]:
        - img [ref=e31]
        - textbox "Password" [ref=e33]: AdminPassword123!
        - button "toggle password visibility" [ref=e35] [cursor=pointer]:
          - img [ref=e36]
        - group:
          - generic: Password
    - button "Sign In" [ref=e38] [cursor=pointer]: Sign In
    - generic [ref=e39]:
      - button "Forgot password?" [ref=e40] [cursor=pointer]
      - button "Sign up" [ref=e41] [cursor=pointer]
```