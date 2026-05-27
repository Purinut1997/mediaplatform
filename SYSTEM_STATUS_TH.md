# บันทึกสถานะระบบ MIKPURINUT Media Platform

ไฟล์นี้คือเอกสารกลางสำหรับอ่านก่อนทำงานต่อทุกครั้ง เพื่อเข้าใจว่าระบบมีอะไรแล้ว ขาดอะไร และควรทำอะไรต่อโดยไม่ต้องไล่อ่านโค้ดทั้งหมดใหม่

## กติกาการทำงาน

- ก่อนแก้โค้ดหรือสร้างฟีเจอร์ใหม่ ต้องกลับมาอ่านไฟล์นี้ก่อนทุกครั้ง
- เมื่อทำฟีเจอร์สำคัญเสร็จ ต้องอัปเดตไฟล์นี้ให้ตรงกับระบบจริง
- ถ้าข้อมูลในไฟล์นี้ไม่ตรงกับโค้ด ให้ยึดโค้ดจริงเป็นหลัก แล้วแก้ไฟล์นี้ทันที
- ต้องคงเครดิต `Created by MIKPURINUT` และโลโก้ระบบตาม URL ที่กำหนด
- เขียนโค้ดให้กระชับ เร็ว ขยายต่อได้ และไม่เพิ่มระบบซ้ำซ้อนโดยไม่จำเป็น

## เทคโนโลยีหลัก

- Frontend: Vite, React, TypeScript, Tailwind CSS
- Backend: Cloudflare Pages Functions
- Database: Neon PostgreSQL
- Deploy: GitHub เชื่อม Cloudflare Pages
- Authentication: cookie session ผ่าน API

## สิ่งที่ระบบมีแล้ว

### หน้าเว็บผู้ใช้

- หน้าแรกแนว AI / Cyber / School Operations
- รองรับ Light Mode และ Dark Mode
- มีภาพแบรนด์, particle/grid background และเครดิต `Created by MIKPURINUT`
- แสดงสื่อแบบการ์ดและหน้ารายละเอียดสื่อ
- เก็บ event การเข้าชมและดาวน์โหลดจริงผ่านตาราง `media_events`
- แยกสิทธิ์ Public / Member / VIP / ซื้อแยก
- รองรับลิงก์สื่อหลายรายการต่อการ์ด เช่น Google Drive, Google Sheet, YouTube และ External Link
- รองรับแท็กจริงต่อสื่อผ่านตาราง `tags` และ `media_tags`
- มีหน้า Login และ Register พร้อม bot check แบบพื้นฐาน
- มีหน้า Maintenance Mode สำหรับผู้ใช้ทั่วไป เมื่อเปิดจากหลังบ้าน

### Super Admin

- เข้าใช้งานหลังบ้านผ่านบัญชี superadmin
- Dashboard เป็น dark programmer dashboard
- มีเมนูหลัก:
  - Dashboard
  - จัดการสื่อ
  - สมาชิกและ VIP
  - หมวดหมู่และแท็ก
  - ลิงก์ภายนอก
  - Activity Log
  - System Health
  - Backup
  - Error Log
  - ตั้งค่าเว็บ

### จัดการสื่อ

- เพิ่ม แก้ไข ลบสื่อผ่านหน้าเว็บได้
- ตั้งชื่อ หมวดหมู่ สิทธิ์ สถานะ ราคา หน้าปก รายละเอียด และลิงก์ได้
- เพิ่มลิงก์หลายรายการได้ในสื่อเดียว
- แต่ละลิงก์ตั้งชนิด URL, preview URL, label และสิทธิ์ได้
- เพิ่มแท็กได้หลายรายการต่อสื่อ โดยระบบสร้าง/ผูกแท็กให้อัตโนมัติ
- มีสถานะ workflow:
  - ฉบับร่าง
  - รอตรวจสอบ
  - เผยแพร่แล้ว
  - ซ่อนชั่วคราว
  - ถูกปฏิเสธ
- มีตัวกรองขั้นสูง:
  - ค้นหาจากชื่อ/คำอธิบาย/ลิงก์
  - กรองหมวดหมู่
  - กรองคำค้นหรือแท็กจริง
  - กรองสิทธิ์
  - กรองสถานะ
  - กรองวันที่เพิ่ม
  - เรียงล่าสุด / ดาวน์โหลดมากสุด / เข้าชมมากสุด / ชื่อ A-Z

### สมาชิกและ VIP

- ดูรายชื่อสมาชิก
- ดูคำขอ VIP
- อนุมัติ/ปฏิเสธคำขอ VIP
- ปรับสมาชิกเป็น VIP หรือกลับเป็นสมาชิกทั่วไป
- เปิด/ปิดบัญชีสมาชิก
- ตั้งผู้ใช้ทั่วไปเป็น admin หรือลด admin กลับเป็น member ได้
- ป้องกันไม่ให้แก้ role/status/access ของ superadmin ผ่านปุ่มหน้าเว็บ
- มีระบบสิทธิ์ admin รายเมนูแบบ config ในโค้ดแล้ว
  - admin จัดการสื่อได้
  - admin จัดการหมวดหมู่ได้
  - admin ตรวจลิงก์และดู System Health ได้
  - admin เข้าเมนูสมาชิก, settings, backup, restore, error log และ activity log ไม่ได้
  - superadmin ยังทำได้ทั้งหมด

### ตั้งค่าเว็บ

- แก้ข้อความหน้าแรกผ่านหลังบ้านได้
- แก้รูป hero หน้าแรกได้
- แก้ข้อความปุ่มหน้าแรกได้
- เพิ่มข้อความประกาศหน้าแรกได้
- เปิด/ปิด Maintenance Mode ได้
- แก้หัวข้อและข้อความ Maintenance Mode ได้
- เปิด/ปิดสมัคร VIP ได้
- แก้ข้อมูล QR, บัญชี, ข้อความส่วนชำระเงิน และข้อความปุ่มสมัคร VIP ได้

### ระบบตรวจสอบและความปลอดภัย

- มี Activity Log เก็บการกระทำสำคัญ เช่น สมัครสมาชิก แก้ setting อนุมัติ VIP แก้สิทธิ์สมาชิก backup และตรวจลิงก์
  - ค้นหาและกรองตามช่วงเวลาได้
- มี Error Log เก็บปัญหา เช่น login failed, bot check failed, register duplicate, API error และ Telegram send failed
  - ค้นหา กรองช่วงเวลา กรองกลุ่ม Auth/Bot/API/Telegram ได้
  - ลบ log เก่ากว่า 30 วันได้เฉพาะ superadmin
- มี Notification Center แบบเก็บลงฐานข้อมูลผ่านตาราง `notifications`
  - แสดงสถานะอ่านแล้ว/ยังไม่อ่าน
  - กดอ่านทีละรายการ หรืออ่านทั้งหมดแล้วได้
  - สร้างแจ้งเตือนจากคำขอ VIP, สื่อรอตรวจ, error ล่าสุด, ลิงก์เสีย และ Maintenance Mode
- มี System Health ดู Cloudflare, Neon, API, response time, last backup, error ล่าสุด และจำนวนข้อมูลสำคัญ
- มี Broken Link Checker ตรวจลิงก์จาก media links และบันทึกผลลงฐานข้อมูล
- มี Cron endpoint สำหรับตรวจลิงก์อัตโนมัติที่ `/api/cron/link-checks`
  - ต้องตั้ง env `CRON_SECRET`
  - เรียกด้วย header `Authorization: Bearer <CRON_SECRET>` หรือ `x-cron-secret`
  - ใช้ logic เดียวกับปุ่มตรวจลิงก์หลังบ้าน และบันทึก audit action เป็น `cron_link_check`
- มี Backup Export เป็น JSON ทั้งระบบ และ CSV แยกตาราง
- Backup/Restore รองรับ `tags` และ `media_tags`
- Backup/Restore รองรับ `notifications`
- Backup/Restore รองรับ `media_events`
- มี Restore Import แบบปลอดภัยจากไฟล์ JSON backup
  - Preview ข้อมูลก่อนนำเข้า
  - ยืนยันก่อน restore จริง
  - Restore แบบ merge ไม่ลบข้อมูลเดิม
  - Restore แบบ replace เฉพาะตารางที่เลือกได้ โดยไม่ล้าง users เพื่อความปลอดภัย
  - ข้ามผู้ใช้ใหม่ที่ไม่มี password hash เพื่อความปลอดภัย
- มี Telegram Notification แบบ optional ผ่าน env `TELEGRAM_BOT_TOKEN` และ `TELEGRAM_CHAT_ID`
  - แจ้งคำขอ VIP ใหม่
  - แจ้งผลอนุมัติ/ปฏิเสธ VIP
  - แจ้งเมื่อตรวจพบลิงก์เสีย

### Dashboard

- มีการ์ดสรุปจำนวนสมาชิก สื่อเผยแพร่ ยอดดาวน์โหลด และงานรอตรวจ
- มีกราฟแท่งแบบเบา ๆ สำหรับสื่อยอดดาวน์โหลดสูงสุด
- มีกราฟหมวดหมู่ที่มีสื่อมากสุด
- มี Notification Center จากฐานข้อมูลจริง พร้อม unread/read
- มีกราฟเชิงเวลาจริงจาก event/database:
  - ดาวน์โหลดรายวัน 14 วัน
  - การเข้าชมรายวัน 14 วัน
  - สมาชิกใหม่รายเดือน
  - คำขอ VIP รายสัปดาห์
  - สื่อยอดดาวน์โหลดจริง 10 อันดับ

## สิ่งที่ยังขาดหรือควรทำต่อ

### สำคัญมาก

1. ตั้ง scheduler จริงให้เรียก Cron endpoint
   - Pages Functions มี endpoint cron แล้ว
   - เหลือตั้ง Cloudflare Worker Cron หรือ scheduler ที่เชื่อถือได้ให้เรียก `/api/cron/link-checks`
   - ต้องใส่ `CRON_SECRET` ใน Cloudflare Variables and Secrets ก่อนใช้งาน

### ควรทำต่อเมื่อระบบหลักนิ่ง

1. Audit Log รายละเอียดมากขึ้น
   - เพิ่ม dropdown ตาม action หรือ target type หากข้อมูล log เริ่มเยอะมาก

2. Telegram settings ผ่านหลังบ้าน
   - ตอนนี้ใช้ env เพื่อความปลอดภัย
   - ถ้าจะตั้งผ่านหลังบ้าน ต้องออกแบบการเก็บ secret ให้รอบคอบ

## ลำดับงานแนะนำต่อไป

1. เพิ่ม filter ขั้นสูงให้ Activity Log เช่น target type/action แบบ dropdown
2. ทำหน้าแนะนำการตั้งค่า Cloudflare Cron/secret ในหลังบ้าน ถ้าต้องการให้ผู้ใช้ตั้งเองง่ายขึ้น
3. ออกแบบ Telegram settings ผ่านหลังบ้านแบบไม่เปิดเผย secret หากจำเป็น

## ไฟล์หลักที่ควรดูเมื่อทำงานต่อ

- `src/App.tsx`
- `functions/_lib/db.ts`
- `functions/_lib/admin.ts`
- `functions/_lib/notify.ts`
- `functions/_lib/notifications.ts`
- `functions/api/media/index.ts`
- `functions/api/media/[id].ts`
- `functions/api/media/track.ts`
- `functions/api/admin/analytics.ts`
- `functions/api/admin/users.ts`
- `functions/api/admin/activity.ts`
- `functions/api/admin/backup.ts`
- `functions/api/admin/restore.ts`
- `functions/api/admin/errors.ts`
- `functions/api/admin/health.ts`
- `functions/api/admin/link-checks.ts`
- `functions/api/admin/notifications.ts`
- `functions/api/cron/link-checks.ts`
- `functions/_lib/link-checker.ts`
- `functions/api/settings.ts`

## สถานะตรวจล่าสุด

- `npm run lint` ผ่าน
- `npm run build` ผ่าน
- ฟีเจอร์ที่เพิ่มล่าสุด: Restore replace เฉพาะตารางที่เลือก, Cron endpoint สำหรับตรวจลิงก์อัตโนมัติ, Analytics เชิงเวลาจริงด้วย `media_events`, filter/clear Error Log, filter Activity Log, Notification Center แบบฐานข้อมูลพร้อม read/unread, ระบบแท็กจริง `tags/media_tags`, Admin Permission รายเมนู, Activity/Error Log CSV export, System Health, Backup Export, Broken Link Checker, Maintenance Mode, admin role toggle และ Telegram optional notification
