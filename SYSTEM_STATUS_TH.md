# บันทึกสถานะระบบ MIKPURINUT Media Platform

ไฟล์นี้คือเอกสารกลางสำหรับอ่านก่อนทำงานต่อทุกครั้ง เพื่อเข้าใจว่าระบบมีอะไรแล้ว ขาดอะไร และควรทำอะไรต่อโดยไม่ต้องไล่อ่านโค้ดทั้งหมดใหม่

## ภาพรวมความคืบหน้า

- ระบบพร้อมใช้งานหลักประมาณ **89%**
- งานหลักสำหรับหน้าเว็บผู้ใช้, สมาชิก, Super Admin, workflow สื่อ, รายงาน, log, backup และ security มีแล้ว
- งานที่เหลือส่วนใหญ่เป็นการรองรับข้อมูลขนาดใหญ่มาก, แยกโครงสร้างโค้ด และการตั้งค่า Secret/บริการภายนอกจากบัญชีเจ้าของ

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
- มี Web App Manifest สำหรับเพิ่มเว็บไว้หน้าจอโฮม โดยใช้โลโก้ MIKPURINUT เป็นไอคอน
- แสดงสื่อแบบการ์ดและหน้ารายละเอียดสื่อ
- เก็บ event การเข้าชมและดาวน์โหลดจริงผ่านตาราง `media_events`
  - ป้องกันการปั่นสถิติ โดยไม่นับการเข้าชมหรือดาวน์โหลดซ้ำจากผู้ใช้/ผู้เยี่ยมชมเดิมในช่วงเวลาสั้น ๆ
  - การเปิดไฟล์ยังทำงานตามปกติแม้เหตุการณ์ซ้ำจะไม่ถูกเพิ่มยอด
- แยกสิทธิ์ Public / Member / VIP / ซื้อแยก
- รองรับลิงก์สื่อหลายรายการต่อการ์ด เช่น Google Drive, Google Sheet, YouTube และ External Link
  - หน้ารายละเอียดแสดงรายการไฟล์/บทเรียนทุกลิงก์ให้ผู้ใช้เลือกเปิดได้
  - แต่ละปุ่มตรวจสิทธิ์ของลิงก์นั้นผ่าน backend ก่อนเปิดจริง
- รองรับแท็กจริงต่อสื่อผ่านตาราง `tags` และ `media_tags`
- มีหน้า Login และ Register พร้อม bot check แบบพื้นฐาน
- API สมัครสมาชิกเคารพสวิตช์เปิด/ปิดรับ VIP จากหลังบ้านจริง ผู้ใช้เรียก API ตรงเพื่อส่งคำขอ VIP ขณะปิดไม่ได้
- Login, Register, ลืมรหัสผ่าน, ตั้งรหัสผ่านใหม่ และบัญชีสมาชิกจำกัดรูปแบบ/ความยาวข้อมูลก่อนใช้ฐานข้อมูลหรือคำนวณรหัสผ่าน
- มีหน้า Maintenance Mode สำหรับผู้ใช้ทั่วไป เมื่อเปิดจากหลังบ้าน
- มีหน้า `คลังของฉัน` สำหรับสมาชิก
  - แสดงข้อมูลบัญชีและระดับสิทธิ์
  - บันทึก/นำสื่อออกจากรายการโปรดจริงผ่านตาราง `user_favorites`
  - แสดงประวัติดาวน์โหลดและจำนวนครั้งจาก `media_events` เดิม โดยไม่สร้างข้อมูลซ้ำ
  - ปุ่มรายการโปรดในหน้ารายละเอียดสื่อเชื่อมกับ Neon จริง
- มีหน้าจัดการบัญชีสมาชิก
  - แก้ชื่อที่แสดง
  - เปลี่ยนรหัสผ่าน โดยตรวจรหัสเดิมและออกจากระบบทุกอุปกรณ์หลังเปลี่ยน
  - ออกจากระบบทุกอุปกรณ์
- มีระบบลืมรหัสผ่าน/ตั้งรหัสผ่านใหม่ผ่าน token อายุ 30 นาที
  - ส่งอีเมลผ่าน Resend เมื่อกำหนด `RESEND_API_KEY` และ `EMAIL_FROM`
  - ตอบกลับแบบไม่เปิดเผยว่าอีเมลมีบัญชีหรือไม่
- มีระบบรีวิวและให้คะแนนจริงต่อสื่อ สมาชิกหนึ่งบัญชีแก้คะแนนของตัวเองได้

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
- คำสั่งอนุมัติ/ปฏิเสธ VIP ทำได้เฉพาะคำขอที่ยังรอตรวจ ป้องกันการดำเนินการซ้ำ
- คำสั่งเปลี่ยนสิทธิ์ บทบาท และสถานะสมาชิกตรวจว่ามีบัญชีที่แก้ไขได้จริงก่อนตอบว่าสำเร็จ
- เมื่อปิดบัญชีสมาชิก ระบบลบ session ทุกอุปกรณ์ของบัญชีนั้นทันที
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
- Backend จำกัดความยาวข้อความ URL และราคา VIP ก่อนบันทึก ป้องกันค่าผิดรูปหรือข้อมูลขนาดใหญ่เกินจำเป็น

### หมวดหมู่และแท็ก

- เพิ่มและลบหมวดหมู่ผ่านหลังบ้านได้
- เปลี่ยนชื่อหมวดหมู่ได้ โดยระบบเปลี่ยนหมวดของสื่อเดิมทั้งหมดพร้อมกันแบบ transaction
- เลื่อนลำดับหมวดหมู่ขึ้น/ลงได้ และหน้าเว็บแสดงตามลำดับที่กำหนด
- ป้องกันการลบหมวดหมู่ที่ยังมีสื่ออยู่
- ทุกการเพิ่ม เปลี่ยนชื่อ เลื่อนลำดับ และลบหมวดหมู่ถูกบันทึกใน Activity Log
- แท็กยังสร้างและผูกกับสื่ออัตโนมัติจากฟอร์มจัดการสื่อ

### ระบบตรวจสอบและความปลอดภัย

- ลิงก์สื่อที่ผู้ใช้ไม่มีสิทธิ์จะไม่ถูกส่งออกจาก API
- การเปิดลิงก์/ดาวน์โหลดจริงต้องผ่าน `/api/media/access` เพื่อตรวจทั้งสิทธิ์สื่อและสิทธิ์ลิงก์ก่อน
- ไม่มีอีเมล ชื่อผู้ใช้ หรือรหัสผ่าน Super Admin ฝังคงที่ในโค้ดแล้ว
- Bootstrap Super Admin ทำงานเมื่อกำหนด `ADMIN_BOOTSTRAP_EMAIL` และ `ADMIN_BOOTSTRAP_PASSWORD` ผ่าน Secret เท่านั้น
- การเปลี่ยน `ADMIN_BOOTSTRAP_PASSWORD` จะหมุนรหัสบัญชีเจ้าของใน Neon เมื่อ Functions ทำงานครั้งถัดไป
- บัญชี Super Admin แบบชื่อผู้ใช้เดิม `admin` จะถูกปิดอัตโนมัติ เหลือการเข้าใช้ผ่านอีเมล Secret เท่านั้น
- รองรับ Cloudflare Turnstile จริงเมื่อกำหนด `TURNSTILE_SITE_KEY` และ `TURNSTILE_SECRET_KEY`
  - หากยังไม่กำหนด จะใช้ bot check พื้นฐานเดิม
- มี Rate Limit ฝั่ง Neon แบบ atomic ใช้งานร่วมกันได้ทุก Cloudflare instance
  - จำกัดการยิง Login แยกตามต้นทางและบัญชี
  - จำกัดการสมัครสมาชิก ลืมรหัสผ่าน และรีเซ็ตรหัสผ่าน
  - เก็บเฉพาะ hash ของตัวระบุ ไม่เก็บ IP หรืออีเมลดิบในตาราง rate limit
  - ตอบกลับ HTTP `429` และ `Retry-After` เมื่อถูกจำกัด
- ล้าง session หมดอายุ, reset token เก่า และข้อมูล rate limit เก่าอัตโนมัติระหว่างเตรียม schema
- มี API middleware ป้องกันคำขอแก้ไขข้อมูลจากเว็บไซต์อื่น และบังคับไม่ให้ cache ข้อมูล API
- มี Security Headers สำหรับหน้าเว็บ เช่น CSP, Permissions Policy, Referrer Policy, `nosniff` และป้องกันการฝังเว็บใน iframe
- ไฟล์ build ใต้ `/assets` ใช้ immutable cache ระยะยาวเพื่อเพิ่มความเร็วและลดการใช้ทรัพยากร Cloudflare
- มีตัวตรวจ URL กลางสำหรับลิงก์สื่อ ภาพหน้าเว็บ และ QR Code
  - ยอมรับเฉพาะ `http/https`
  - ปฏิเสธ URL ที่ฝัง username/password, localhost, private IP และเครือข่ายภายใน
  - ตรวจ redirect ทุกขั้นของ Broken Link Checker เพื่อป้องกัน SSRF
  - ข้อมูล URL เก่าที่ไม่ปลอดภัยจะไม่ถูกส่งไปหน้าเว็บหรือเปิดให้ผู้ใช้
- จำกัดขนาด request API โดยให้ Restore backup มีเพดานแยกที่สูงกว่า API ทั่วไป
- ผู้ใช้ทั่วไปไม่สามารถเปลี่ยน query เพื่ออ่านสื่อสถานะฉบับร่าง/รอตรวจสอบ/ซ่อน/ปฏิเสธได้
- การนับยอดเข้าชมรับเฉพาะสื่อที่เผยแพร่แล้ว
- มีกฎตรวจข้อมูลสื่อกลาง ป้องกันสถานะ สิทธิ์ ราคา ชื่อ หมวดหมู่ แท็ก และชนิดลิงก์ที่ผิดรูปก่อนบันทึกลงฐานข้อมูล
- Neon มีกฎ `CHECK constraint` สำหรับสถานะ/สิทธิ์/ราคา/คะแนนสื่อ สิทธิ์ลิงก์ บทบาท/สถานะสมาชิก และสถานะคำขอ VIP
  - migration จะแปลงสถานะสื่อเก่าเป็น workflow ใหม่และซ่อมค่าผิดรูปก่อนคืน constraint
  - ไม่ลบ constraint รวมของตารางทิ้งทุกครั้งที่ Functions เริ่มทำงานแล้ว
- มี Activity Log เก็บการกระทำสำคัญ เช่น สมัครสมาชิก แก้ setting อนุมัติ VIP แก้สิทธิ์สมาชิก backup และตรวจลิงก์
  - ค้นหา กรองตามช่วงเวลา กรองตาม action และกรองตาม target type ได้
- มี Error Log เก็บปัญหา เช่น login failed, bot check failed, register duplicate, API error และ Telegram send failed
  - ค้นหา กรองช่วงเวลา กรองกลุ่ม Auth/Bot/API/Telegram ได้
  - ลบ log เก่ากว่า 30 วันได้เฉพาะ superadmin
- มี Notification Center แบบเก็บลงฐานข้อมูลผ่านตาราง `notifications`
  - แสดงสถานะอ่านแล้ว/ยังไม่อ่าน
  - กดอ่านทีละรายการ หรืออ่านทั้งหมดแล้วได้
  - สร้างแจ้งเตือนจากคำขอ VIP, สื่อรอตรวจ, error ล่าสุด, ลิงก์เสีย และ Maintenance Mode
- มี System Health ดู Cloudflare, Neon, API, response time, last backup, error ล่าสุด และจำนวนข้อมูลสำคัญ
  - แสดงจำนวนการป้องกันคำขอที่กำลังบล็อกอยู่
  - มีการ์ดแนะนำการตั้งค่า Cron ตรวจลิงก์อัตโนมัติ โดยไม่แสดงค่า secret บนหน้าเว็บ
  - มีการ์ดแนะนำ env สำหรับ Telegram notification โดยไม่แสดง token จริง
- มี Broken Link Checker ตรวจลิงก์จาก media links และบันทึกผลลงฐานข้อมูล
- มี Cron endpoint สำหรับตรวจลิงก์อัตโนมัติที่ `/api/cron/link-checks`
  - ต้องตั้ง env `CRON_SECRET`
  - เรียกด้วย header `Authorization: Bearer <CRON_SECRET>` หรือ `x-cron-secret`
  - ใช้ logic เดียวกับปุ่มตรวจลิงก์หลังบ้าน และบันทึก audit action เป็น `cron_link_check`
- มี Cloudflare Worker Cron แยกใน `workers/link-check-cron`
  - ใช้เรียก `/api/cron/link-checks` ทุก 6 ชั่วโมงตามค่าเริ่มต้น
  - มีคำสั่ง `npm run cron:secret`, `npm run cron:deploy` และ `npm run cron:tail`
  - ไม่เก็บค่า `CRON_SECRET` จริงใน GitHub
- มี Backup Export เป็น JSON ทั้งระบบ และ CSV แยกตาราง
- Backup/Restore รองรับ `tags` และ `media_tags`
- Backup/Restore รองรับ `notifications`
- Backup/Restore รองรับ `media_events`
- Backup/Restore รองรับ `user_favorites`
- Backup/Restore รองรับ `media_reviews`
- มี Restore Import แบบปลอดภัยจากไฟล์ JSON backup
  - Preview ข้อมูลก่อนนำเข้า
  - ยืนยันก่อน restore จริง
  - Restore แบบ merge ไม่ลบข้อมูลเดิม
  - Restore แบบ replace เฉพาะตารางที่เลือกได้ โดยไม่ล้าง users เพื่อความปลอดภัย
  - ข้ามผู้ใช้ใหม่ที่ไม่มี password hash เพื่อความปลอดภัย
  - แปลงสถานะ backup รุ่นเก่าให้เข้ากับ workflow ใหม่ และปรับค่าตัวเลข/สิทธิ์ที่ผิดรูปให้อยู่ในช่วงปลอดภัย
  - ไม่อนุญาตให้ไฟล์ restore สร้างหรือยกระดับบัญชีเป็น superadmin
  - ข้ามลิงก์ภายในเครือข่ายหรือ URL อันตรายจากไฟล์ restore
- มี Telegram Notification แบบ optional ผ่าน env `TELEGRAM_BOT_TOKEN` และ `TELEGRAM_CHAT_ID`
  - แจ้งคำขอ VIP ใหม่
  - แจ้งผลอนุมัติ/ปฏิเสธ VIP
  - แจ้งเมื่อตรวจพบลิงก์เสีย
- มีหน้า Telegram Notification ในเมนูตั้งค่าเว็บ
  - แสดงสถานะว่า `TELEGRAM_BOT_TOKEN` และ `TELEGRAM_CHAT_ID` ตั้งค่าแล้วหรือยัง
  - กดส่งข้อความทดสอบได้จากหลังบ้าน
  - ไม่แสดง token หรือ chat id จริงบนหน้าเว็บ
  - บันทึก audit action เป็น `telegram_test`

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
- มีรายงานเชิงลึกสำหรับตัดสินใจ:
  - ยอดเข้าชมและดาวน์โหลด 30 วัน
  - อัตราเข้าชมต่อดาวน์โหลด
  - สัดส่วนสมาชิก VIP
  - สัดส่วนสิทธิ์สื่อ
  - สถานะ workflow สื่อ
  - แหล่งสื่อที่ใช้งาน

## สิ่งที่ยังขาดหรือควรทำต่อ

### สำคัญมาก

1. ตั้ง scheduler จริงให้เรียก Cron endpoint
   - Pages Functions มี endpoint cron แล้ว
   - หลังบ้านมีคู่มือ endpoint/header/env ให้ดูจากหน้า System Health แล้ว
   - มี Worker Cron แยกใน `workers/link-check-cron` แล้ว
   - เหลือ deploy Worker และใส่ `CRON_SECRET` จริงใน Cloudflare Variables and Secrets ก่อนใช้งานจริง
   - ตรวจล่าสุดพบว่า Wrangler บนเครื่องยังไม่ได้ login บัญชี Cloudflare จึงยัง deploy อัตโนมัติไม่ได้
2. ตั้งค่า Secret ภายนอกก่อนเปิดใช้ฟีเจอร์เต็ม
   - เปลี่ยน `ADMIN_BOOTSTRAP_PASSWORD` เป็นรหัสใหม่ที่ไม่เคยอยู่ใน Git history
   - `TURNSTILE_SITE_KEY` และ `TURNSTILE_SECRET_KEY` สำหรับ Turnstile จริง
   - `RESEND_API_KEY`, `EMAIL_FROM` และ `APP_URL` สำหรับส่งอีเมลลืมรหัสผ่าน
3. Google/Facebook OAuth ยังปิดอยู่
   - หน้าเว็บซ่อนปุ่มไว้เพื่อไม่แสดงฟังก์ชันจำลอง
   - ต้องมี OAuth Client ID/Secret และตั้งค่า redirect URL จากบัญชีเจ้าของก่อนเชื่อมจริง
4. ระบบซื้อสื่อแยกและวันหมดอายุ VIP ยังปิดไว้
   - ต้องกำหนดราคา วิธีรับชำระ อายุ VIP และเงื่อนไขคืนเงินก่อนสร้าง workflow จริง

### งานปรับความทนทานที่ยังควรทำต่อ

1. เพิ่ม Server-side Pagination ให้รายการสื่อ, Activity Log, Error Log และ Notification
   - หน้าสมาชิกหลังบ้านรองรับค้นหาและแบ่งหน้าจาก API แล้ว
   - Activity Log และ Error Log รองรับแบ่งหน้า 50 รายการแล้ว
   - Notification กรองสิทธิ์จากฐานข้อมูลก่อนจำกัดจำนวน และแสดงยอดยังไม่อ่านจริงแล้ว
   - รายการสื่อรองรับ Server-side Pagination หน้าละ 40 รายการ พร้อมปุ่มโหลดเพิ่มแล้ว
   - การค้นหาและเลือกหมวดหมู่หน้าคลังค้นจาก Neon ทั้งระบบ พร้อม debounce ลด request ซ้ำ
   - ตัวกรองขั้นสูงในหลังบ้านค้นจาก Neon ทั้งระบบแล้ว รองรับคำค้น หมวดหมู่ แท็ก สถานะ สิทธิ์ วันที่ และการเรียงลำดับ
2. แยก Database Migration ออกจาก `ensureSchema`
   - เพิ่ม Schema Version Guard แล้ว ทำให้ Worker ใหม่ไม่รัน schema, cleanup และ seed ซ้ำเมื่อเวอร์ชันตรงกัน
   - ระยะยาวยังควรแยก migration เป็นคำสั่ง deploy โดยเฉพาะ
3. ทำ Backup/Restore สำหรับข้อมูลขนาดใหญ่แบบ Background Job หรือใช้ Neon Restore
   - JSON Backup ปัจจุบันยังโหลดทุกตารางใน request เดียว
   - เพิ่ม JSON ข้อมูลหลักสำหรับสำรองประจำวัน โดยไม่รวมประวัติ, รีวิว, รายการโปรด และแจ้งเตือน
   - Restore แบบ Merge เปิดใช้งานได้
   - Restore แบบ Replace ถูกปิดเพื่อป้องกันข้อมูลหายจากคำสั่งที่หยุดกลางทาง
4. ทยอยแยก `src/App.tsx` เป็นหน้าและ component ย่อย เพื่อลดความเสี่ยงเวลาแก้ระบบระยะยาว
5. เพิ่ม Integration Test สำหรับ Login, สมัครสมาชิก, Workflow สื่อ, VIP และ Backup/Restore
   - ตอนนี้มี Unit Test ด้าน URL และสิทธิ์สื่อ พร้อม GitHub Actions แล้ว

## ลำดับงานแนะนำต่อไป

1. ตั้งค่า Turnstile และ Resend Secrets บน Cloudflare Pages
2. Login Wrangler แล้วตั้ง `CRON_SECRET` ให้ตรงกันทั้ง Cloudflare Pages และ Worker จากนั้นรัน `npm run cron:secret` + `npm run cron:deploy`
3. ทยอยแยก `src/App.tsx` และเพิ่ม Integration Test สำหรับ workflow สำคัญ
4. แยก Migration และปรับ Backup/Restore ขนาดใหญ่
5. กำหนดกติกาธุรกิจสำหรับซื้อแยกและ VIP expiry ก่อนเปิดสองระบบนี้

## ไฟล์หลักที่ควรดูเมื่อทำงานต่อ

- `src/App.tsx`
- `functions/_lib/db.ts`
- `functions/_lib/admin.ts`
- `functions/_lib/notify.ts`
- `functions/_lib/notifications.ts`
- `functions/_lib/rate-limit.ts`
- `functions/_lib/media-events.ts`
- `functions/_lib/media-validation.ts`
- `functions/_lib/input.ts`
- `functions/_lib/url.ts`
- `functions/api/_middleware.ts`
- `functions/api/media/index.ts`
- `functions/api/media/[id].ts`
- `functions/api/media/track.ts`
- `functions/api/media/access.ts`
- `functions/api/media/reviews.ts`
- `functions/api/member/library.ts`
- `functions/api/member/account.ts`
- `functions/api/auth/forgot-password.ts`
- `functions/api/auth/reset-password.ts`
- `functions/api/admin/analytics.ts`
- `functions/api/admin/users.ts`
- `functions/api/admin/activity.ts`
- `functions/api/admin/backup.ts`
- `functions/api/admin/restore.ts`
- `functions/api/admin/errors.ts`
- `functions/api/admin/health.ts`
- `functions/api/admin/link-checks.ts`
- `functions/api/admin/notifications.ts`
- `functions/api/admin/telegram.ts`
- `functions/api/cron/link-checks.ts`
- `workers/link-check-cron/src/index.ts`
- `workers/link-check-cron/wrangler.toml`
- `functions/_lib/link-checker.ts`
- `functions/api/settings.ts`

## สถานะตรวจล่าสุด

- `npm run lint` ผ่าน
- `npm run build` ผ่าน
- `npm test` ผ่าน 9 tests
- Functions TypeScript ผ่าน
- มี GitHub Actions ตรวจ `lint`, `test` และ `build` ทุก push/PR
- วันที่ 9 มิถุนายน 2026 ตรวจหน้าเว็บบนเครื่องทั้ง desktop/mobile แล้ว ไม่พบ horizontal overflow หรือ console error
- เพิ่ม Transaction สำหรับการเพิ่ม/แก้สื่อ, สมัคร VIP และอนุมัติ VIP เพื่อลดข้อมูลค้างครึ่งชุด
- สมาชิกไม่สามารถบันทึกรายการโปรดหรือรีวิวสื่อที่ยังไม่เผยแพร่/ไม่มีสิทธิ์ได้
- API Settings ซ่อนข้อมูล QR/เลขบัญชีเมื่อปิดรับสมัคร VIP สำหรับผู้ใช้ทั่วไป
- เมื่อ API โหลดข้อมูลล้มเหลว หน้า Production จะแสดง Empty/Error state แทนข้อมูลตัวอย่าง
- หน้าสมาชิกหลังบ้านรองรับค้นหาชื่อ/อีเมลและแบ่งหน้า 50 บัญชีต่อหน้า
- Restore แบบ Replace ถูกปิดทั้ง API/UI จนกว่าจะมีวิธี restore แบบ atomic หรือใช้ Neon Restore
- เพิ่ม Schema Version Guard ลด cold-start จากการรัน DDL/seed ซ้ำใน Worker ใหม่
- Activity Log และ Error Log รองรับ Server-side Pagination 50 รายการต่อหน้า
- Notification Center กรอง audience ก่อน limit และแสดงยอด unread จากฐานข้อมูลจริง
- Link Checker เลือกลิงก์ที่ไม่เคยตรวจหรือเก่าสุดก่อน และตรวจขนานเป็นชุดละ 10 ลิงก์
- Backup มี JSON ข้อมูลหลักแบบเบา และ JSON ทั้งระบบสำหรับเก็บประวัติครบ
- Media API รองรับ Pagination หน้าละ 40 รายการ และ UI โหลดเพิ่มได้ทั้งหน้าคลังและหลังบ้าน
- การค้นหา/เลือกหมวดหมู่หน้าคลังค้นจาก Neon ทั้งระบบ ไม่จำกัดเฉพาะสื่อที่โหลดอยู่
- ตัวกรองขั้นสูงหน้าจัดการสื่อค้นจาก Neon ทั้งระบบ พร้อมแบ่งหน้า 50 รายการและ debounce ลด request ซ้ำ
- Media API ฝั่งผู้ดูแลรองรับค้นชื่อ หมวดหมู่ คำอธิบาย แท็ก และลิงก์ รวมถึงกรองสิทธิ์ สถานะ วันที่ และเรียงตามยอดดาวน์โหลด/เข้าชม/ชื่อ
- Neon มีดัชนีสำหรับตัวกรองสื่อ สถานะ สิทธิ์ วันที่ ยอดดาวน์โหลด ยอดเข้าชม และค้นหาข้อความแบบบางส่วนด้วย `pg_trgm`
- วันที่ 7 มิถุนายน 2026 ยืนยันว่า production ใช้ Functions และ static frontend รุ่นล่าสุดแล้ว มี `app-version` สำหรับตรวจ deployment และ asset production มี UI หลายลิงก์ครบ
- ฟีเจอร์ที่เพิ่มล่าสุด: จัดการหมวดหมู่ครบ, ตรวจค่าตั้งค่าเว็บก่อนบันทึก และป้องกันการอนุมัติ VIP/แก้สมาชิกซ้ำหรือสำเร็จลวง
