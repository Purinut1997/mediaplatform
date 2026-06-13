# คู่มือตั้งค่า Google Login

ระบบรองรับ Google OAuth จริงแล้ว เมื่อเปิดใช้งาน ผู้ใช้เลือกบัญชี Gmail เพื่อเข้าสู่ระบบได้ทันที:

- ถ้าอีเมลมีบัญชีใน Neon อยู่แล้ว ระบบจะใช้สิทธิ์เดิมของบัญชีนั้น
- ถ้าเป็นอีเมลใหม่ ระบบจะสร้างบัญชีระดับสมาชิกทั่วไป
- ระบบรับเฉพาะอีเมลที่ Google ยืนยันแล้ว
- ปุ่ม Google จะซ่อนอัตโนมัติจนกว่าจะตั้งค่าครบ

## 1. สร้าง OAuth Client ใน Google Cloud

1. เปิด [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. สร้างหรือเลือก Project
3. ตั้งค่า OAuth consent screen
4. สร้าง Credentials ชนิด `OAuth client ID`
5. เลือก Application type เป็น `Web application`
6. ใส่ Authorized JavaScript origins:

```text
https://mediaplatform.pages.dev
```

7. ใส่ Authorized redirect URIs:

```text
https://mediaplatform.pages.dev/api/auth/google/callback
```

8. เก็บค่า Client ID และ Client Secret ไว้สำหรับขั้นถัดไป

หากใช้ Custom Domain ภายหลัง ต้องเพิ่ม origin/redirect ของโดเมนนั้นใน Google Cloud และเปลี่ยน `APP_URL` ให้ตรงกัน

## 2. ตั้งค่า Cloudflare Pages

ไปที่ Cloudflare Pages > `mediaplatform` > Settings > Variables and Secrets แล้วเพิ่มค่าใน Production:

| Type | Variable name | Value |
|---|---|---|
| Plaintext | `APP_URL` | `https://mediaplatform.pages.dev` |
| Plaintext | `GOOGLE_CLIENT_ID` | Client ID จาก Google |
| Secret | `GOOGLE_CLIENT_SECRET` | Client Secret จาก Google |

จากนั้น Redeploy Production หนึ่งครั้ง

## 3. ตรวจผล

1. เปิดหน้าเข้าสู่ระบบ
2. ปุ่ม `Google` ต้องแสดงขึ้นมา
3. กดปุ่มและเลือก Gmail
4. ระบบต้องกลับมาที่หน้าเว็บและแสดงว่าเข้าสู่ระบบสำเร็จ
5. ตรวจหน้า Super Admin > System Health ว่า `Google Login` เป็น `พร้อมใช้งาน`

บัญชี Gmail ที่มีอีเมลตรงกับ Super Admin ใน Neon จะเข้าสู่ระบบด้วยสิทธิ์ Super Admin เดิม
