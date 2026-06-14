# บันทึกสถานะระบบ MIKPURINUT Media Platform

ไฟล์นี้คือเอกสารกลางสำหรับอ่านก่อนทำงานต่อทุกครั้ง เพื่อเข้าใจว่าระบบมีอะไรแล้ว ขาดอะไร และควรทำอะไรต่อโดยไม่ต้องไล่อ่านโค้ดทั้งหมดใหม่

## ภาพรวมความคืบหน้า

- ระบบพร้อมใช้งานหลักประมาณ **92%**
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
- รองรับ Google Login แบบ OAuth จริง
  - เชื่อมบัญชี Neon เดิมจากอีเมล Google ที่ยืนยันแล้ว โดยคง role/access เดิม
  - สร้างบัญชีสมาชิกทั่วไปอัตโนมัติเมื่อเป็น Gmail ใหม่
  - ใช้ state cookie แบบ HttpOnly/Secure/SameSite และ Rate Limit ป้องกัน callback
  - ปุ่ม Google ซ่อนอัตโนมัติจนกว่าจะตั้ง `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` และ `APP_URL` ครบ
  - มีคู่มือตั้งค่าที่ `GOOGLE_LOGIN_SETUP_TH.md`
- API สมัครสมาชิกเคารพสวิตช์เปิด/ปิดรับ VIP จากหลังบ้านจริง ผู้ใช้เรียก API ตรงเพื่อส่งคำขอ VIP ขณะปิดไม่ได้
- Login, Register, ลืมรหัสผ่าน, ตั้งรหัสผ่านใหม่ และบัญชีสมาชิกจำกัดรูปแบบ/ความยาวข้อมูลก่อนใช้ฐานข้อมูลหรือคำนวณรหัสผ่าน
- มีหน้า Maintenance Mode สำหรับผู้ใช้ทั่วไป เมื่อเปิดจากหลังบ้าน
- Maintenance Mode ยังเปิดทางให้ผู้ดูแลเข้าสู่ระบบ ใช้ลืมรหัสผ่าน และรีเซ็ตรหัสผ่านได้ แต่ปิดหน้าสาธารณะและการสมัครสมาชิกตามปกติ
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
  - หน้าเว็บและ API ตรวจความพร้อมของ `RESEND_API_KEY`, `EMAIL_FROM` และ `APP_URL` ก่อนสร้าง token จึงไม่ตอบว่าส่งสำเร็จลวง
  - หาก Resend ปฏิเสธอีเมล ระบบลบ reset token ที่ใช้ไม่ได้ทันที
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
- ฟอร์มมีปุ่มเพิ่มไฟล์ Drive, Google Sheet, วิดีโอ YouTube และลิงก์เว็บแบบสำเร็จรูป สูงสุด 20 รายการต่อสื่อ
- เมื่อสื่อมีทั้งไฟล์และวิดีโอ ระบบเลือก YouTube เป็น Preview อัตโนมัติ แต่ยังแสดงปุ่มเปิดทุกไฟล์ในชุด
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
- แก้ชื่อแบรนด์ คำอธิบาย และข้อความระบบใน Footer ได้ โดยเครดิต `Created by MIKPURINUT` และโลโก้ยังถูกล็อกไว้
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
  - ไม่เรียก Turnstile API เมื่อ token ว่าง, จำกัดเวลาตรวจ 8 วินาที และปฏิเสธคำขออย่างปลอดภัยเมื่อบริการตรวจสอบล้มเหลว
- มี Rate Limit ฝั่ง Neon แบบ atomic ใช้งานร่วมกันได้ทุก Cloudflare instance
  - จำกัดการยิง Login แยกตามต้นทางและบัญชี
  - จำกัดการสมัครสมาชิก ลืมรหัสผ่าน และรีเซ็ตรหัสผ่าน
  - จำกัดการแก้บัญชีและการลองรหัสผ่านปัจจุบันซ้ำจากหน้าสมาชิก
  - เก็บเฉพาะ hash ของตัวระบุ ไม่เก็บ IP หรืออีเมลดิบในตาราง rate limit
  - ตอบกลับ HTTP `429` และ `Retry-After` เมื่อถูกจำกัด
- การเปลี่ยนรหัสผ่านไม่อนุญาตให้ใช้รหัสเดิม และบันทึก Error Log เมื่อตรวจรหัสผ่านปัจจุบันไม่ผ่าน
- การรีเซ็ตรหัสผ่านจากอีเมล claim token, เปลี่ยนรหัส และล้าง session ในคำสั่งฐานข้อมูลแบบ atomic ป้องกัน token เดียวถูกใช้พร้อมกัน
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
  - การสั่ง Worker แบบ manual ต้องส่ง `x-cron-secret` หรือ `Authorization: Bearer` เพื่อป้องกันบุคคลภายนอกกระตุ้นงานซ้ำ
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
- มีหน้าตรวจสอบอีเมล Resend ในเมนูตั้งค่าเว็บ
  - แสดงสถานะ API Key, อีเมลผู้ส่ง และ URL เว็บไซต์โดยไม่เปิดเผยค่าจริง
  - Super Admin ส่งอีเมลทดสอบไปยังบัญชีตนเองได้
  - บันทึก audit action เป็น `email_test` และบันทึก Error Log เมื่อ Resend ล้มเหลว

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
   - Production ตั้งค่า `TURNSTILE_SITE_KEY` และ `TURNSTILE_SECRET_KEY` แล้ว ใช้ Turnstile จริงสำหรับ Login/Register/ลืมรหัสผ่าน
   - `RESEND_API_KEY`, `EMAIL_FROM` และ `APP_URL` สำหรับส่งอีเมลลืมรหัสผ่าน
3. Google OAuth เปิดใช้งานบน Production แล้ว
   - ปุ่ม Google, OAuth callback, การเชื่อมบัญชีเดิม และการสร้างสมาชิกใหม่ทำงานแล้ว
   - Authorized redirect URI คือ `https://mediaplatform.pages.dev/api/auth/google/callback`
   - Facebook OAuth ยังปิดและหน้าเว็บซ่อนปุ่มไว้
4. ระบบซื้อสื่อแยกและวันหมดอายุ VIP ยังปิดไว้
   - ต้องกำหนดราคา วิธีรับชำระ อายุ VIP และเงื่อนไขคืนเงินก่อนสร้าง workflow จริง

### งานปรับความทนทานที่ยังควรทำต่อ

1. เพิ่ม Server-side Pagination ให้รายการสื่อ, Activity Log, Error Log และ Notification
   - หน้าสมาชิกหลังบ้านรองรับค้นหาและแบ่งหน้าจาก API แล้ว
   - Activity Log และ Error Log รองรับแบ่งหน้า 50 รายการแล้ว
   - Notification กรองสิทธิ์จากฐานข้อมูลก่อนจำกัดจำนวน แสดงยอดยังไม่อ่านจริง และแบ่งหน้าจาก Neon ครั้งละ 8 รายการแล้ว
   - รายการสื่อรองรับ Server-side Pagination หน้าละ 40 รายการ พร้อมปุ่มโหลดเพิ่มแล้ว
   - การค้นหาและเลือกหมวดหมู่หน้าคลังค้นจาก Neon ทั้งระบบ พร้อม debounce ลด request ซ้ำ
   - ตัวกรองขั้นสูงในหลังบ้านค้นจาก Neon ทั้งระบบแล้ว รองรับคำค้น หมวดหมู่ แท็ก สถานะ สิทธิ์ วันที่ และการเรียงลำดับ
2. แยก Database Migration ออกจาก `ensureSchema`
   - เพิ่ม Schema Version Guard แล้ว ทำให้ Worker ใหม่ไม่รัน schema, cleanup และ seed ซ้ำเมื่อเวอร์ชันตรงกัน
   - มีไฟล์ migration ดัชนีตัวกรองสื่อที่ `database/migrations/2026-06-09-media-filter-indexes.sql` สำหรับรันจาก Neon SQL Editor โดยไม่ทำให้ Cloudflare request ช้า
   - ระยะยาวยังควรแยก migration เป็นคำสั่ง deploy โดยเฉพาะ
3. ทำ Backup/Restore สำหรับข้อมูลขนาดใหญ่แบบ Background Job หรือใช้ Neon Restore
   - JSON Backup ปัจจุบันยังโหลดทุกตารางใน request เดียว
   - เพิ่ม JSON ข้อมูลหลักสำหรับสำรองประจำวัน โดยไม่รวมประวัติ, รีวิว, รายการโปรด และแจ้งเตือน
   - Restore แบบ Merge เปิดใช้งานได้
   - Restore แบบ Replace ถูกปิดเพื่อป้องกันข้อมูลหายจากคำสั่งที่หยุดกลางทาง
4. ทยอยแยก `src/App.tsx` เป็นหน้าและ component ย่อย เพื่อลดความเสี่ยงเวลาแก้ระบบระยะยาว
   - แยก type contract กลางไปที่ `src/types.ts` แล้ว
   - แยก helper สำหรับ API response, สิทธิ์สื่อ, workflow status และ preview URL ไปที่ `src/lib` แล้ว
   - แยกค่ากลางแบรนด์, ค่าเริ่มต้น, พื้นหลังเทคโนโลยี, Portal Tiles, Turnstile widget, UI แจ้งสถานะ และ Public Shell ไปที่ `src/brand.ts`, `src/defaults.ts` และ `src/components` แล้ว
   - Public Shell รวม Header, Hero, Brand Showcase และหน้า Maintenance ไว้ที่ `src/components/PublicShell.tsx`
   - แยกหน้าคลังสมาชิกและการจัดการความปลอดภัยบัญชีไว้ที่ `src/components/MemberLibrary.tsx`
   - แยกหน้ารายละเอียดสื่อ, preview, ลิงก์ในชุด และรีวิวไว้ที่ `src/components/MediaDetail.tsx`
   - `src/App.tsx` ลดจากประมาณ 6,064 เหลือประมาณ 4,415 บรรทัด โดยพฤติกรรมหน้าเว็บเดิมยังคงเดิม
   - ปรับฟอร์มบัญชีให้รองรับ Password Manager/Browser Autofill ด้วย `autocomplete` ที่ถูกต้อง และตัดตัวเลือกจำการเข้าสู่ระบบที่ยังไม่มีพฤติกรรมจริงออก
5. เพิ่ม Integration Test สำหรับ Login, สมัครสมาชิก, Workflow สื่อ, VIP และ Backup/Restore
   - ตอนนี้มี Unit Test ด้าน URL และสิทธิ์สื่อ พร้อม GitHub Actions แล้ว

## ลำดับงานแนะนำต่อไป

1. ตั้งค่า Resend Secrets บน Cloudflare Pages เพื่อเปิดระบบลืมรหัสผ่านผ่านอีเมล
2. Login Wrangler แล้วตั้ง `CRON_SECRET` ให้ตรงกันทั้ง Cloudflare Pages และ Worker จากนั้นรัน `npm run cron:secret` + `npm run cron:deploy`
3. ทยอยแยก `src/App.tsx` และเพิ่ม Integration Test สำหรับ workflow สำคัญ
4. แยก Migration และปรับ Backup/Restore ขนาดใหญ่
5. กำหนดกติกาธุรกิจสำหรับซื้อแยกและ VIP expiry ก่อนเปิดสองระบบนี้

## ไฟล์หลักที่ควรดูเมื่อทำงานต่อ

- `src/App.tsx`
- `src/types.ts`
- `src/lib/api.ts`
- `src/lib/media.ts`
- `src/brand.ts`
- `src/defaults.ts`
- `src/components/AuthBotCheck.tsx`
- `src/components/PortalTiles.tsx`
- `src/components/PublicShell.tsx`
- `src/components/MemberLibrary.tsx`
- `src/components/MediaDetail.tsx`
- `src/components/SharedUI.tsx`
- `src/components/TechBackground.tsx`
- `GOOGLE_LOGIN_SETUP_TH.md`
- `functions/_lib/db.ts`
- `functions/_lib/admin.ts`
- `functions/_lib/notify.ts`
- `functions/_lib/notifications.ts`
- `functions/_lib/rate-limit.ts`
- `functions/_lib/media-events.ts`
- `functions/_lib/media-validation.ts`
- `functions/_lib/input.ts`
- `functions/_lib/url.ts`
- `functions/_lib/google-oauth.ts`
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
- `functions/api/auth/google.ts`
- `functions/api/auth/google/callback.ts`
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
- `npm test` ผ่าน 40 tests ครอบคลุม URL, สิทธิ์สื่อทั้ง frontend/backend, preview URL, การอ่าน API response, bot/Turnstile, Google OAuth state/config/redirect response, validation บัญชี, validation workflow สื่อ, ความพร้อม/ความปลอดภัยของอีเมล, session cookie, rate-limit response และ API middleware
- Functions TypeScript ผ่าน
- มี GitHub Actions ตรวจ `lint`, `test` และ `build` ทุก push/PR
- มี Production Smoke Check ตรวจหน้าเว็บ, Security Headers, Cloudflare Functions, Neon, Turnstile config, session ผู้เยี่ยมชม, settings, media API และการซ่อนสื่อ/ลิงก์ที่ไม่มีสิทธิ์ทุก 6 ชั่วโมงผ่าน GitHub Actions โดยไม่แก้ข้อมูลจริง
  - ตรวจยืนยันด้วยว่า API หลังบ้านสำคัญตอบ `401 Unauthorized` สำหรับผู้เยี่ยมชม และ API response มี security headers ครบ
- System Health แสดงสถานะพร้อมใช้งานของ Turnstile, อีเมลลืมรหัสผ่าน, Cron และ Telegram โดยไม่เปิดเผยค่า Secret
- หลังบ้านมีปุ่มส่งอีเมล Resend ทดสอบไปยัง Super Admin โดยไม่ต้องแก้โค้ด
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
- หน้าจัดการสื่อหลังบ้านใช้การแบ่งหน้าแบบจริง ค่าเริ่มต้น 10 รายการ และเลือก 10/20/50 รายการต่อหน้าได้ โดยไม่สะสมรายการจนหน้ายาว
- หน้าจัดการสื่อหลังบ้านเลือกสื่อหลายรายการบนหน้าปัจจุบันได้สูงสุด 100 รายการต่อคำสั่ง เพื่อเปลี่ยนสถานะ ย้ายหมวดหมู่ หรือลบพร้อมกัน โดยทุกคำสั่งบันทึก Activity Log
- หน้าจัดการสื่อมีปุ่มทำสำเนาการ์ดสื่อ โดยคัดลอกหน้าปก รายละเอียด สิทธิ์ ไฟล์ วิดีโอ ลิงก์ และแท็ก แต่รีเซ็ตสถิติและตั้งสำเนาเป็นฉบับร่างอัตโนมัติ
- ฟอร์มสื่อจัดลำดับไฟล์ วิดีโอ และลิงก์ด้วยปุ่มขึ้น/ลงได้ โดยรายการบนสุดเป็นรายการหลักและระบบคงลำดับไว้ในฐานข้อมูล
- การค้นหา/เลือกหมวดหมู่หน้าคลังค้นจาก Neon ทั้งระบบ ไม่จำกัดเฉพาะสื่อที่โหลดอยู่
- ตัวกรองขั้นสูงหน้าจัดการสื่อค้นจาก Neon ทั้งระบบ พร้อมแบ่งหน้า 50 รายการและ debounce ลด request ซ้ำ
- Media API ฝั่งผู้ดูแลรองรับค้นชื่อ หมวดหมู่ คำอธิบาย แท็ก และลิงก์ รวมถึงกรองสิทธิ์ สถานะ วันที่ และเรียงตามยอดดาวน์โหลด/เข้าชม/ชื่อ
- วันที่ 7 มิถุนายน 2026 ยืนยันว่า production ใช้ Functions และ static frontend รุ่นล่าสุดแล้ว มี `app-version` สำหรับตรวจ deployment และ asset production มี UI หลายลิงก์ครบ
- ฟีเจอร์ที่เพิ่มล่าสุด: จัดการหมวดหมู่ครบ, ตรวจค่าตั้งค่าเว็บก่อนบันทึก และป้องกันการอนุมัติ VIP/แก้สมาชิกซ้ำหรือสำเร็จลวง
- สิทธิ์ผู้ใช้บนหน้าเว็บอ้างอิงจาก session cookie/API เท่านั้น ไม่อ่านหรือบันทึก role/access ใน `localStorage` เพื่อป้องกันการปลอมสถานะผู้ดูแลจากเบราว์เซอร์
- API middleware ป้องกัน cross-site mutation/request ขนาดเกินกำหนด และกำหนด CSP/Permissions Policy สำหรับ API responses
- เริ่มแยกโครงสร้าง frontend แล้ว โดยย้าย type contract และ helper ที่ทดสอบได้ออกจาก `src/App.tsx`
- วันที่ 13 มิถุนายน 2026 ตรวจ frontend หลังแยก component บน desktop/mobile แล้ว ไม่พบ horizontal overflow หรือ console error และเครดิต MIKPURINUT ยังแสดงครบ
- วันที่ 13 มิถุนายน 2026 แยก Public Shell ออกจาก `src/App.tsx`, ปรับฟอร์มบัญชีให้ทำงานกับ Password Manager ได้ถูกต้อง และตัดช่องจำการเข้าสู่ระบบที่ยังไม่มีผลจริงออก
- วันที่ 13 มิถุนายน 2026 แยกหน้าคลังสมาชิกและความปลอดภัยบัญชีออกจาก `src/App.tsx` พร้อมปรับช่องเปลี่ยนรหัสผ่านให้รองรับ Password Manager
- วันที่ 13 มิถุนายน 2026 เพิ่ม rate limit สำหรับการจัดการบัญชี ป้องกันใช้รหัสเดิมซ้ำ และทำการรีเซ็ตรหัสผ่านด้วย token เป็น atomic operation
- วันที่ 13 มิถุนายน 2026 เพิ่ม Google OAuth Login จริง พร้อมเชื่อมอีเมลเดิม/สร้างสมาชิกใหม่, state cookie, rate limit, System Health และ Production smoke
- วันที่ 14 มิถุนายน 2026 แก้ Google OAuth redirect ให้สร้าง headers/cookies แบบ Cloudflare Workers รองรับ ปิด Error 1101 จาก immutable `Response.redirect()` headers
- วันที่ 14 มิถุนายน 2026 ตรวจ Production ยืนยันว่า Google Login และ Turnstile พร้อมใช้งาน ส่วน Password Reset Email ยังรอ Resend
- วันที่ 14 มิถุนายน 2026 เพิ่ม Production smoke ตรวจ Google OAuth state cookie/callback และแยกหน้ารายละเอียดสื่อกับรีวิวออกจาก `src/App.tsx`
- วันที่ 14 มิถุนายน 2026 ตรวจ Production เวอร์ชัน `2026.06.14.2` หลังแยกหน้ารายละเอียดสื่อแล้ว ทั้ง desktop/mobile ไม่มี horizontal overflow หรือ console error และ Production smoke ผ่านครบ
- วันที่ 14 มิถุนายน 2026 เอา Toast แจ้งเชื่อมต่อ Cloudflare + Neon สำเร็จออกจากหน้าเว็บผู้ใช้ โดยยังคง Toast การทำงานและข้อผิดพลาดที่จำเป็นไว้
- วันที่ 14 มิถุนายน 2026 เพิ่มการแก้ Footer จากหลังบ้าน และจัดเมนูผู้ดูแลเป็นกลุ่มภาพรวม, เนื้อหา, สมาชิก และระบบ พร้อมเปลี่ยนชื่อเมนูเทคนิคให้อ่านง่าย
- วันที่ 14 มิถุนายน 2026 ตรวจ Production เวอร์ชัน `2026.06.14.4` ยืนยันว่า Footer ใช้ค่าจาก API, เครดิตยังอยู่ครบ และ desktop/mobile ไม่มี horizontal overflow หรือ console error
- วันที่ 14 มิถุนายน 2026 เปลี่ยนรายการสื่อหลังบ้านจากโหลดต่อกันยาวเป็นแบ่งหน้าแบบจริง พร้อมแสดงช่วงรายการและเลือกจำนวนต่อหน้า
- วันที่ 14 มิถุนายน 2026 ตรวจ Production เวอร์ชัน `2026.06.14.5` ยืนยัน API pagination หน้าละ 10 รายการและ Production smoke ผ่านครบ
- วันที่ 14 มิถุนายน 2026 ปรับฟอร์มสื่อหลายชนิดให้เพิ่มไฟล์/Sheet/YouTube/เว็บได้ชัดเจน และเลือกวิดีโอเป็น Preview อัตโนมัติเมื่อมีทั้งไฟล์และวิดีโอ
- วันที่ 14 มิถุนายน 2026 ตรวจ Production เวอร์ชัน `2026.06.14.6` หลังปรับ workflow สื่อหลายชนิดแล้ว Production smoke ผ่านครบ
- วันที่ 14 มิถุนายน 2026 เพิ่ม Bulk Action สำหรับจัดการสื่อหลายรายการ พร้อม validation, permission และ Activity/Error Log โดยชุดทดสอบทั้งหมดผ่าน
- วันที่ 14 มิถุนายน 2026 ตรวจ Production เวอร์ชัน `2026.06.14.7` หลังเพิ่ม Bulk Action แล้ว หน้าเว็บไม่ล้น ไม่มี console error และ Production smoke ผ่านครบ
- วันที่ 14 มิถุนายน 2026 เพิ่มระบบทำสำเนาสื่อแบบปลอดภัย พร้อม Unit Test และตรวจสิทธิ์ API ใน Production smoke
- วันที่ 14 มิถุนายน 2026 ตรวจ Production เวอร์ชัน `2026.06.14.8` หลังเพิ่มระบบทำสำเนาสื่อแล้ว Production smoke ผ่านครบ
- วันที่ 14 มิถุนายน 2026 เพิ่มการจัดลำดับไฟล์/วิดีโอภายในการ์ดสื่อ พร้อมป้ายรายการหลักและ Unit Test
- วันที่ 14 มิถุนายน 2026 ตรวจ Production เวอร์ชัน `2026.06.14.9` หลังเพิ่มการจัดลำดับลิงก์แล้ว หน้าเว็บไม่ล้น ไม่มี console error และ Production smoke ผ่านครบ
- วันที่ 14 มิถุนายน 2026 เพิ่ม Server-side Pagination ให้ Notification Center พร้อม helper pagination กลางและ Unit Test
- วันที่ 14 มิถุนายน 2026 ตรวจ Production เวอร์ชัน `2026.06.14.10` หลังแบ่งหน้า Notification Center แล้ว Production smoke ผ่านครบ
- วันที่ 14 มิถุนายน 2026 รวมกติกา pagination ของ Media, Members, Activity, Error และ Notification ไว้ที่ helper กลาง พร้อมขยาย Production smoke ตรวจสิทธิ์ API หลังบ้าน
