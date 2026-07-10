# บันทึกสถานะระบบ MIKPURINUT Media Platform

ไฟล์นี้คือเอกสารกลางสำหรับอ่านก่อนทำงานต่อทุกครั้ง เพื่อเข้าใจว่าระบบมีอะไรแล้ว ขาดอะไร และควรทำอะไรต่อโดยไม่ต้องไล่อ่านโค้ดทั้งหมดใหม่

## ภาพรวมความคืบหน้า

- ระบบพร้อมใช้งานหลักประมาณ **96%**
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
  - หน้าปกและ Preview แปลงลิงก์ GitHub blob, Google Sheet `/copy|edit|view`, Google Drive และ YouTube เป็น URL ที่เหมาะกับการแสดงผลอัตโนมัติ
  - มีชนิดลิงก์ `Preview Image` สำหรับทำแกลเลอรีภาพตัวอย่างระบบเต็มแถว พร้อมตัวนับภาพ, ปุ่มเลื่อน, thumbnail แนวนอน และ modal ดูภาพใหญ่ โดยไม่ฝัง Sheet/ไฟล์จริงในส่วน Preview
  - Preview Image รองรับลิงก์รูปตรง, Google Drive image, Google Photos/Googleusercontent และ GitHub blob โดยมี API ช่วยดึงรูปจากลิงก์แชร์ Google Photos สาธารณะ
  - หลังบ้านมีตัวอย่างหน้าปกและ URL Preview ที่ระบบคำนวณให้ดูทันทีตอนเพิ่ม/แก้ไขสื่อ
  - หน้าจัดการสื่อหลังบ้านจัดใหม่เป็น workflow 5 ส่วน: ข้อมูลหลัก, การเผยแพร่และสิทธิ์, หน้าปก, Preview ระบบ, ไฟล์ใช้งานจริง เพื่อไม่ให้ภาพตัวอย่างปนกับไฟล์ดาวน์โหลด
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

- สมาชิกดูประวัติคำขอ VIP ย้อนหลังได้ และ Super Admin มีรายการประวัติอนุมัติ/ปฏิเสธล่าสุด
- ระบบซื้อสื่อแยกเก็บไฟล์หลักฐานจริงแบบเดียวกับ VIP และ Super Admin เปิดตรวจไฟล์ผ่าน API ที่ตรวจสิทธิ์ได้
- มีระบบคำขอคืนเงินภายในเว็บพร้อมเลขคำขอ สถานะ ประวัติสมาชิก และคิวจัดการใน Super Admin
- ระบบส่งอีเมลแจ้งผลอนุมัติ/ปฏิเสธ VIP, ซื้อสื่อ และการเปลี่ยนสถานะคืนเงินผ่าน Resend เมื่อกำหนด env ครบ
- เมื่อเปิด VIP แต่ราคาเป็น 0 ระบบจะระงับการส่งคำขอและแจ้งว่าต้องกำหนดราคาก่อน ป้องกันคำขอชำระเงินไม่ครบ
- มีศูนย์ช่วยเหลือและขอคืนเงินในหน้าคลังสมาชิก แสดงขั้นตอนมาตรฐาน ระยะเวลาพิจารณา และข้อควรระวังข้อมูลสำคัญ
- Super Admin เปิด/ปิดและกำหนดช่องทางคืนเงินได้ทั้งแบบฟอร์ม อีเมล LINE และโทรศัพท์ พร้อมแก้คำแนะนำได้จากตั้งค่าเว็บ
- Super Admin ปรับข้อความการ์ดแนะนำ VIP, จุดเด่น และเงื่อนไข VIP จากเมนูตั้งค่าเว็บได้
- สมาชิกกดอ่านเงื่อนไข VIP ก่อนติ๊กยอมรับได้ทั้งหน้าสมัครใหม่และหน้าคลังสมาชิก
- คำขอ VIP บังคับแนบหลักฐานเสมอ และหลังบ้านแสดงชัดเจนเมื่อคำขอเก่าไม่มีหลักฐาน
- ตอนอนุมัติคำขอ Super Admin กำหนดอายุสิทธิ์รายคำขอได้ 1-3,650 วันหรือเลือกตลอดชีพ

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
- VIP รองรับวันหมดอายุจริง
  - การอนุมัติคำขอ VIP และการปรับสมาชิกเป็น VIP ใช้จำนวนวันที่ตั้งจากหลังบ้าน
  - เมื่อหมดอายุ ระบบลดสิทธิ์ที่ใช้เปิดสื่อกลับเป็นสมาชิกโดยอัตโนมัติ
  - หลังบ้านแสดงวันหมดอายุ VIP ของแต่ละบัญชี
  - Super Admin ต่ออายุรายบัญชีแบบ `+30 / +90 / +365 วัน`, กำหนดวันหมดอายุเอง หรือยกเลิก VIP ได้
  - หน้าสมาชิกมีสรุป VIP ใช้งาน/ใกล้หมด/หมดอายุ และกรองตามสิทธิ์กับสถานะบัญชีได้
  - Notification Center แจ้งเมื่อมีสมาชิก VIP ใกล้หมดอายุภายใน 7 วัน
- มีฐานระบบซื้อสื่อแยก
  - สมาชิกส่งคำขอซื้อสื่อที่เปิดจำหน่ายได้
  - Super Admin อนุมัติ/ปฏิเสธคำขอซื้อและเปิดสิทธิ์เฉพาะสื่อให้สมาชิกได้
  - สิทธิ์ซื้อแยกตรวจที่ backend ทุกครั้งก่อนเปิดไฟล์
  - สื่อที่ซื้อแล้วแสดงใน `คลังของฉัน` และบันทึกเป็นรายการโปรดได้
  - ระบบซื้อแยกปิดเป็นค่าเริ่มต้น จนกว่า Super Admin จะกำหนดราคาและเปิดใช้งาน
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
- กำหนดอายุ VIP, ระยะเวลาขอคืนเงิน, เวลาตรวจชำระเงิน และอายุคำสั่งซื้อได้
- เปิด/ปิดระบบซื้อสื่อแยกและแก้ข้อความนโยบายการซื้อ/คืนเงินได้
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
- `ADMIN_BOOTSTRAP_PASSWORD` ใช้สำหรับสร้างบัญชีเจ้าของครั้งแรกเท่านั้น การเปลี่ยนรหัสบัญชีที่มีอยู่แล้วต้องทำผ่านหน้าความปลอดภัยบัญชีหรือระบบลืมรหัสผ่าน
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
- Backup/Restore รองรับวันหมดอายุ VIP, คำขอซื้อ และสิทธิ์ซื้อสื่อแยก
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

1. Cron scheduler เปิดใช้งานแล้วและควรติดตามผลระยะยาว
   - Pages Functions มี endpoint cron แล้ว
   - หลังบ้านมีคู่มือ endpoint/header/env ให้ดูจากหน้า System Health แล้ว
   - มี Worker Cron แยกใน `workers/link-check-cron` แล้ว
   - Deploy Worker `mediaplatform-link-check-cron` แล้ว ทำงานตามตารางทุก 6 ชั่วโมง
   - ตั้ง `CRON_SECRET` แบบสุ่มจริงค่าเดียวกันให้ Cloudflare Pages Production และ Worker แล้ว
   - Wrangler บนเครื่องเชื่อมบัญชี Cloudflare เจ้าของระบบแล้ว
   - ทดสอบ Worker เรียก Pages Cron endpoint จริงสำเร็จ และ endpoint ปฏิเสธคำขอที่ไม่มี Secret
2. ตั้งค่า Secret ภายนอกก่อนเปิดใช้ฟีเจอร์เต็ม
   - เปลี่ยนรหัส Super Admin จริงผ่านหน้าความปลอดภัยบัญชีหรือระบบลืมรหัสผ่านแล้ว และควรตั้ง `ADMIN_BOOTSTRAP_PASSWORD` เป็นรหัสใหม่สำหรับกรณี bootstrap ฐานข้อมูลใหม่
   - Production ตั้งค่า `TURNSTILE_SITE_KEY` และ `TURNSTILE_SECRET_KEY` แล้ว ใช้ Turnstile จริงสำหรับ Login/Register/ลืมรหัสผ่าน
   - Production ตั้งค่า `RESEND_API_KEY`, `EMAIL_FROM` และ `APP_URL` แล้ว ระบบส่งอีเมลลืมรหัสผ่านและตั้งรหัสใหม่ทำงานจริง
3. Google OAuth เปิดใช้งานบน Production แล้ว
   - ปุ่ม Google, OAuth callback, การเชื่อมบัญชีเดิม และการสร้างสมาชิกใหม่ทำงานแล้ว
   - Authorized redirect URI คือ `https://mediaplatform.pages.dev/api/auth/google/callback`
   - Facebook OAuth ยังปิดและหน้าเว็บซ่อนปุ่มไว้
4. ระบบซื้อสื่อแยกและวันหมดอายุ VIP มีฐาน workflow แล้ว แต่ยังปิดรับชำระไว้
   - Super Admin ต้องกำหนดราคา, QR/บัญชี, อายุ VIP และเงื่อนไขคืนเงินในเมนูตั้งค่าเว็บก่อนเปิดใช้งาน
   - ขณะนี้ระบบเก็บชื่อไฟล์สลิปเพื่อประกอบการตรวจเท่านั้น ยังไม่ได้อัปโหลดไฟล์สลิปจริงไป Storage
   - ยังไม่มีระบบคืนเงินอัตโนมัติหรือ Payment Gateway การอนุมัติ/ปฏิเสธยังทำโดย Super Admin

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
   - แยก Super Admin ทั้งหน้าไปที่ `src/components/AdminPanel.tsx` และโหลดแบบ lazy เฉพาะเมื่อผู้ดูแลเปิดหลังบ้าน
   - `src/App.tsx` ลดจากจุดเริ่มต้นประมาณ 6,064 เหลือประมาณ 1,600 บรรทัด โดยพฤติกรรมหน้าเว็บเดิมยังคงเดิม
   - JavaScript หน้าเว็บทั่วไปลดจากประมาณ 406 KB เหลือประมาณ 290 KB และแยกชุดหลังบ้านประมาณ 118 KB ออกไปโหลดตามต้องการ
   - ปรับฟอร์มบัญชีให้รองรับ Password Manager/Browser Autofill ด้วย `autocomplete` ที่ถูกต้อง และตัดตัวเลือกจำการเข้าสู่ระบบที่ยังไม่มีพฤติกรรมจริงออก
5. เพิ่ม Integration Test สำหรับ Login, สมัครสมาชิก, Workflow สื่อ, VIP และ Backup/Restore
   - ตอนนี้มี Unit Test ด้าน URL และสิทธิ์สื่อ พร้อม GitHub Actions แล้ว
   - เพิ่ม Unit/Integration Test สำหรับ Cron Worker และการ hash/ตรวจรหัสผ่านแล้ว รวมชุดทดสอบปัจจุบันผ่าน 54 รายการ
   - Production smoke ตรวจ 20 endpoint/security contract รวมการป้องกัน Cron endpoint และ Purchase API

## ลำดับงานแนะนำต่อไป

1. ทยอยแยก `src/App.tsx` และเพิ่ม Integration Test สำหรับ workflow สำคัญ
2. แยก Migration และปรับ Backup/Restore ขนาดใหญ่
3. ย้ายหลักฐานการชำระเงินจากฐานข้อมูลไป Object Storage เมื่อปริมาณไฟล์เพิ่ม และเพิ่ม Integration Test workflow ซื้อแยก/VIP/คืนเงิน

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
- `functions/api/purchases.ts`
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
  - ฐานข้อมูลเดิมที่มี schema version แล้วจะอัปเดต version แบบสั้น ไม่ย้อนรัน bootstrap ทั้งระบบจนชนเวลาจำกัด Cloudflare
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
- วันที่ 14 มิถุนายน 2026 ตั้งค่า Resend บน Production และทดสอบเส้นทางลืมรหัสผ่าน ส่งอีเมล ตั้งรหัสใหม่ และเข้าสู่ระบบด้วยรหัสใหม่สำเร็จแล้ว
- วันที่ 14 มิถุนายน 2026 เชื่อม Wrangler, Deploy Worker ตรวจลิงก์เสียทุก 6 ชั่วโมง และตั้ง `CRON_SECRET` ให้ตรงกันทั้ง Pages Production กับ Worker แล้ว
- วันที่ 14 มิถุนายน 2026 ทดสอบ Cron Worker เรียก Production endpoint สำเร็จ เพิ่มชุดทดสอบ Worker และขยาย Production smoke ตรวจการป้องกัน Cron endpoint
- วันที่ 14 มิถุนายน 2026 แยก Super Admin ออกจาก `src/App.tsx` และโหลดแบบ lazy ทำให้ JavaScript หน้าเว็บทั่วไปเล็กลง พร้อมตรวจ desktop/mobile ไม่พบ overflow หรือ console error
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
- วันที่ 14 มิถุนายน 2026 ตรวจ Production เวอร์ชัน `2026.06.14.11` หลังรวม pagination กลางแล้ว หน้าเว็บไม่ล้น ไม่มี console error และ Production smoke ผ่านครบ
- วันที่ 14 มิถุนายน 2026 เพิ่มฐานระบบวันหมดอายุ VIP และซื้อสื่อแยก ปรับรายละเอียด/เงื่อนไขจาก Super Admin ได้ พร้อมสิทธิ์ซื้อรายสื่อ คลังสื่อที่ซื้อ และ Backup/Restore
- วันที่ 14 มิถุนายน 2026 ตรวจ Production เวอร์ชัน `2026.06.14.12` หลัง migration ฐานการค้าแล้ว Schema พร้อมครบ, API กลับมาปกติ และ Production smoke ผ่านครบ 20 รายการ
- วันที่ 14 มิถุนายน 2026 เพิ่มการจัดการวันหมดอายุ VIP รายบัญชี ตัวกรองสมาชิก และแจ้งเตือน VIP ใกล้หมดอายุในเวอร์ชัน `2026.06.14.13` พร้อมตรวจ Production smoke ผ่านครบ 20 รายการ
- วันที่ 14 มิถุนายน 2026 แยกหน้าดูแลสมาชิกเป็น รายชื่อสมาชิก, จัดการ VIP, คำขอรอตรวจ และผู้ดูแลระบบ พร้อมตัวกรองบทบาทฝั่งเซิร์ฟเวอร์และแบ่งหน้าละ 24 บัญชีในเวอร์ชัน `2026.06.14.14`
- วันที่ 14 มิถุนายน 2026 ตรวจ Production เวอร์ชัน `2026.06.14.14` และ Production smoke ผ่านครบ 20 เส้นทาง
- วันที่ 14 มิถุนายน 2026 ปรับธีมทั้งเว็บเป็น `MIKPURINUT Nexus — Modern AI School Portal` โดย Light Mode ใช้ Soft Apple AI, Dark Mode/หลังบ้านใช้ Nexus Cyber Glass, รวม Theme Token กลาง, glass surface, ปุ่ม gradient, code rain แบบเบา และรองรับ Reduced Motion ในเวอร์ชัน `2026.06.14.15`
- วันที่ 14 มิถุนายน 2026 ตรวจ Production เวอร์ชัน `2026.06.14.15` ทั้ง Light/Dark และมือถือแล้ว ไม่พบ horizontal overflow หรือ console error, เครดิตยังอยู่ครบ และ Production smoke ผ่านครบ 20 เส้นทาง
- วันที่ 14 มิถุนายน 2026 ปรับธีมหลังบ้านเป็นสองโหมดตามแนวทาง `Soft Apple Admin` และ `Nexus Cyber Control` ในเวอร์ชัน `2026.06.14.16` โดยเพิ่ม Admin Theme Layer กลางสำหรับกรอบหลัก การ์ดสถิติ เมนูแบ่งหมวด ฟอร์ม ตาราง สถานะ และเมนูแนวนอนบนมือถือ โดยไม่เปลี่ยน logic หรือ API เดิม
- วันที่ 14 มิถุนายน 2026 ตรวจ Production เวอร์ชัน `2026.06.14.16` แล้ว Build/Lint ผ่าน, Unit Test ผ่าน 54 รายการ, Production smoke ผ่านครบ 20 เส้นทาง และหน้าเว็บ desktop/mobile ไม่มี horizontal overflow หรือ console error
- วันที่ 14 มิถุนายน 2026 เพิ่มระบบสมัคร VIP ภายหลังสำหรับสมาชิกในหน้า `คลังของฉัน` เวอร์ชัน `2026.06.14.17` รองรับแสดงแพ็กเกจ/QR/เงื่อนไขจากหลังบ้าน ส่งคำขอ ป้องกันคำขอซ้ำ ติดตามสถานะรอตรวจ/อนุมัติ/ปฏิเสธ และแสดงวันหมดอายุ VIP
- วันที่ 14 มิถุนายน 2026 ตรวจ Production เวอร์ชัน `2026.06.14.17` แล้ว Build/Lint ผ่าน, Unit Test ผ่าน 54 รายการ, Production smoke ผ่านครบ 21 เส้นทาง และหน้าเว็บ desktop/mobile ไม่มี horizontal overflow หรือ console error
- วันที่ 16 มิถุนายน 2026 เพิ่มการแนบหลักฐานการโอนจริงสำหรับสมัคร VIP และคำขอ VIP ภายหลัง รองรับ JPG/PNG/WebP/PDF ไม่เกิน 750KB, บันทึกหลักฐานใน `vip_requests.slip_data_url`, เปิดดูหลักฐานจากหลังบ้านได้, เพิ่มโหมด VIP ตลอดชีพจากตั้งค่าเว็บและปุ่มกำหนดตลอดชีพรายสมาชิก ในเวอร์ชัน `2026.06.16.1`
- วันที่ 16 มิถุนายน 2026 ปรับ `ensureSchema` ให้ฐานข้อมูลเดิมรันเฉพาะ migration เล็กของรอบล่าสุด แทนการ seed/DDL ชุดใหญ่ทุก cold start แก้ปัญหา Cloudflare Error 1101 หลัง deploy และยืนยัน Production smoke ผ่านครบ
- วันที่ 18 มิถุนายน 2026 แก้การเปิดหลักฐานการโอน VIP โดยเพิ่ม API `/api/admin/vip-proof?id=...` ที่ตรวจสิทธิ์ Super Admin และส่งไฟล์รูป/PDF แบบ binary แทนการเปิด data URL โดยตรง พร้อมลดขนาด response รายการคำขอด้วย `hasSlipData` ในเวอร์ชัน `2026.06.18.1`
# อัปเดต 19 มิถุนายน 2569 — ระบบคลังสื่อรอบหลัก

- เพิ่มถังขยะสื่อ: การลบเดี่ยวและหลายรายการเป็น Soft Delete พร้อมกู้คืนหรือลบถาวรจาก Super Admin
- เพิ่มตัวกรองผู้ใช้: สิทธิ์ ชนิดไฟล์ แท็ก ช่วงเวลา และการเรียงตามล่าสุด/ดาวน์โหลด/เข้าชม/คะแนน/ชื่อ
- เก็บประวัติคำค้นล่าสุดในอุปกรณ์เพื่อเรียกใช้ซ้ำได้รวดเร็ว
- เพิ่มนโยบายรายสื่อ: วันเริ่มเปิด วันปิด และจำนวนดาวน์โหลดสูงสุดต่อบัญชี โดยตรวจสิทธิ์ที่ API
- Backup/Restore และ DB readiness รองรับฟิลด์ถังขยะกับนโยบายดาวน์โหลดแล้ว
# อัปเดต 19 มิถุนายน 2569 — ระบบแจ้งปัญหาสื่อ

- สมาชิกแจ้งลิงก์เสีย เนื้อหาผิด ปัญหาลิขสิทธิ์ หรือปัญหาอื่นจากหน้ารายละเอียดสื่อได้
- ป้องกันรายงานซ้ำที่ยังดำเนินการและจำกัดคำขอต่อบัญชี
- สมาชิกติดตามสถานะและอ่านข้อความตอบกลับของผู้ดูแลได้จากหน้าสื่อเดิม
- Admin รับเรื่อง เปลี่ยนเป็นกำลังตรวจ แก้ไขแล้ว หรือปิดรายงาน พร้อมหมายเหตุได้
- เชื่อม Notification Center, Activity Log, Database readiness, Backup และ Production smoke test

# อัปเดต 20 มิถุนายน 2569 — หน้าแรกและเส้นทางเริ่มใช้งาน

- เพิ่มส่วนแนะนำการเริ่มใช้งาน 3 ขั้นตอนบนหน้าแรก ตั้งแต่ค้นหาสื่อ สมัครสมาชิก ไปจนถึงเก็บและกลับมาใช้สื่อต่อ
- ปุ่มเริ่มใช้งานปรับตาม session: ผู้เยี่ยมชมไปหน้าสมัคร ส่วนสมาชิกไปคลังของฉัน
- เพิ่มแถบอธิบาย Server-side Security, Neon PostgreSQL และ Cloudflare Pages เพื่อสื่อสารความน่าเชื่อถือของระบบ
- เปลี่ยนตัวเลขสื่อและยอดดาวน์โหลดใน Hero จากค่าตกแต่งเป็นข้อมูลจริง พร้อม fallback สำหรับการพัฒนาบนเครื่อง
- ตรวจ responsive ที่ความกว้าง 390px และ desktop แล้วไม่พบ horizontal overflow

# อัปเดต 20 มิถุนายน 2569 — Spotlight, Trending และ Smart Search

- เพิ่ม Spotlight แบบ cinematic บนหน้าแรก โดยเลือกสื่อเด่นจากยอดเข้าชม ดาวน์โหลด และคะแนนจริง
- เพิ่มอันดับ Trending 3 รายการ พร้อมสถิติย่อและปุ่มเปิดรายละเอียดโดยตรง
- เพิ่ม Smart Search ค้นจากชื่อ คำอธิบาย หมวดหมู่ แหล่งสื่อ และแท็ก โดยไม่เพิ่ม request ไปฐานข้อมูล
- เปิด Smart Search ได้จาก Header, เมนูมือถือ และคีย์ลัด `Ctrl/Command + K`; ปิดด้วย `Escape`
- ตรวจ dialog และ responsive ที่ความกว้าง 390px แล้วไม่พบ horizontal overflow หรือ console error

# อัปเดต 20 มิถุนายน 2569 — Nexus Learning Flow

- เพิ่ม Quick Preview สำหรับดูภาพ/ตัวอย่างฝัง รายละเอียด สิทธิ์ และสถิติก่อนเปิดหน้าสื่อเต็ม โดยไม่เพิ่มยอดเข้าชมจากการดูตัวอย่าง
- เพิ่ม Learning Path อัตโนมัติ 3 กลุ่มจากหมวดหมู่สื่อจริง พร้อมลำดับบทเรียน ปุ่มเริ่ม/เรียนต่อ/ทบทวน และ progress รายอุปกรณ์
- เพิ่ม Continue Learning แสดงสื่อที่เปิดล่าสุดสูงสุด 3 รายการบนหน้าแรก
- ประวัติ Learning Flow เก็บใน `localStorage` เฉพาะรหัสสื่อสูงสุด 6 รายการ ไม่ส่งข้อมูลส่วนนี้เพิ่มไป backend
- การเปิดหน้ารายละเอียดจริงเท่านั้นที่อัปเดต Continue Learning และ progress
- เพิ่มปุ่มดูตัวอย่างบนการ์ดสื่อหน้าแรกและหน้าคลัง พร้อมตรวจ desktop/mobile 390px แล้วไม่พบ horizontal overflow หรือ console error

# อัปเดต 20 มิถุนายน 2569 — Nexus Experience ครบ 10 ฟีเจอร์

- เพิ่ม Personal Collections สร้าง/ลบชุดและเลือกเก็บสื่อได้ โดยเก็บข้อมูลเฉพาะบนอุปกรณ์
- เพิ่ม Share Card พร้อม QR, คัดลอกลิงก์, Native Share และ deep link `?media=id` ที่เปิดหน้าสื่อโดยตรง
- เพิ่ม Achievement 4 ระดับจากการสำรวจสื่อและการสร้างคอลเลกชัน
- เพิ่ม Nexus Pulse แสดงจำนวนสื่อ ยอดเข้าชม ดาวน์โหลด คะแนนเฉลี่ย และสื่อยอดนิยมจากข้อมูลจริง
- เพิ่ม AI Media Guide แนะนำสื่อจากเป้าหมายด้วยการให้คะแนนข้อความในเบราว์เซอร์ ไม่ส่งข้อมูลไป AI ภายนอกและไม่มีค่า API
- เพิ่ม PWA Install Experience ใช้ browser install prompt เมื่อรองรับ และแสดงวิธีติดตั้งด้วยตนเองเมื่อยังเรียก prompt ไม่ได้
- เพิ่ม Creator Profile ของ MIKPURINUT พร้อมความเชี่ยวชาญและจำนวนผลงานในระบบ
- รวมกับ Quick Preview, Learning Path และ Continue Learning ทำให้ชุด UX ที่วางแผนไว้ครบ 10 รายการ
- ตรวจ interaction หลักและ responsive ที่ความกว้าง 390px แล้วไม่พบ horizontal overflow หรือ console error
# อัปเดต 20 มิถุนายน 2569 — Experience Hub และเมนูหน้าแรก

- ลดความหนาแน่นหน้าแรก โดยเหลือ Hero, เมนู Experience 4 หมวด, Spotlight และ Continue Learning เมื่อมีประวัติ
- เพิ่มเมนู สำรวจ, เรียนรู้, พื้นที่ของฉัน และเกี่ยวกับ Nexus พร้อม active state และปุ่มกลับภาพรวม
- หมวดสำรวจรวม Spotlight, Trending, Smart Search, AI Media Guide และ Nexus Pulse
- หมวดเรียนรู้รวม Learning Path และ Quick Preview ส่วน Continue Learning แสดงย่อในภาพรวม
- หมวดพื้นที่ของฉันรวม Collections, Achievement และ PWA Install
- หมวดเกี่ยวกับ Nexus รวม Creator Profile, ขั้นตอนเริ่มใช้งาน และข้อมูลความน่าเชื่อถือของระบบ
- ย้ายรายการคลังสื่อออกจากหน้าแรก โดยยังเปิดได้จากเมนูคลังสื่อหลัก ทำให้หน้าแรกสั้นและมีลำดับชัดขึ้น
- `lint`, tests 57 รายการ และ production build ผ่าน; browser visual automation รอบนี้ถูก Windows sandbox ปฏิเสธการเริ่ม process จึงไม่ได้อ้างผล screenshot รอบล่าสุด

# อัปเดต 20 มิถุนายน 2569 — Dependency Security Maintenance

- รัน `npm audit fix` เพื่อปิดช่องโหว่ใน development toolchain โดยไม่เปลี่ยน API หรือพฤติกรรมระบบ
- อัปเดต Vite จาก `8.0.14` เป็น `8.0.16` และ Babel packages เป็นรุ่นที่มี security patch ผ่าน `package-lock.json`
- `npm audit` เหลือ 0 vulnerabilities
- หลังอัปเดต `lint`, tests 57 รายการ และ production build ผ่านครบ

# อัปเดต 20 มิถุนายน 2569 — My E‑Service

- เพิ่มหน้า E‑Service ส่วนตัว แยกข้อมูลตามบัญชี รองรับค้นหา หมวดหมู่ ปักหมุด เพิ่ม แก้ไข ลบ และเปิดระบบภายนอกแบบ `https://`
- ไอคอนรองรับ PNG/JPG/WebP ไม่เกิน 80 KB เพื่อลดภาระพื้นที่และเวลาโหลด
- โควตาเริ่มต้น Member 6 ช่อง, VIP 18 ช่อง, Admin/Super Admin ไม่จำกัด โดยระบบที่ MIKPURINUT มอบให้ไม่นับโควตา
- Super Admin ปรับโควตากลางภายหลังได้ และกำหนดค่าเฉพาะบัญชี 0-1,000 ช่องหรือคืนค่าเป็นตามแพ็กเกจได้
- Super Admin มอบ E‑Service ให้ผู้ใช้จากหน้าจัดการสมาชิกได้ พร้อมจำนวนระบบเพิ่มเอง/ระบบที่มอบให้บนการ์ดสมาชิก
- เพิ่มตาราง `user_services`, ฟิลด์ `users.eservice_limit_override`, Activity Log และรองรับ Backup/Restore
- เพิ่ม smoke test สำหรับสิทธิ์ API `/api/member/services`; `lint`, tests 57 รายการ และ production build ผ่าน
- Deploy Production เวอร์ชัน `2026.06.20.1` แล้ว, Neon migration พร้อม, ค่าจริง Member 6 / VIP 18 และ Production smoke ผ่านครบ 27 เส้นทาง
- เพิ่มการย่อไอคอน E‑Service ฝั่งเบราว์เซอร์: รับ PNG/JPG/WebP ต้นฉบับไม่เกิน 12 MB, ครอปกึ่งกลางเป็นสี่เหลี่ยม, แปลง WebP สูงสุด 256×256px และลดคุณภาพ/มิติอัตโนมัติจนไม่เกิน 80 KB
- แยกหน้า `โปรไฟล์` ออกจาก `คลังของฉัน`: โปรไฟล์รวมข้อมูลบัญชี สิทธิ์/สมัคร VIP ประวัติคำขอ ความปลอดภัย การออกจากระบบทุกอุปกรณ์ และศูนย์ช่วยเหลือ ส่วนคลังเหลือเฉพาะรายการโปรด ประวัติดาวน์โหลด และสื่อที่ซื้อ
- ย้ายทางเข้า `โปรไฟล์` ออกจากเมนูหลักไปไว้ที่ปุ่มชื่อผู้ใช้ ลดความแน่นของ Header, ตัดชื่อยาวด้วย ellipsis และเพิ่มการ์ดชื่อผู้ใช้สำหรับเปิดโปรไฟล์ในเมนูมือถือ
- แก้ Light Mode หลังบ้านให้ข้อความสีขาว/พาสเทลและปุ่ม disabled มี contrast สูงขึ้นบนพื้นสว่าง
- รองรับลิงก์ภาพ GitHub แบบ `/blob/` โดยแปลงเป็น `raw.githubusercontent.com` อัตโนมัติสำหรับ QR VIP และแสดง fallback เมื่อรูปเปิดไม่ได้
- ปรับหลักฐานสมัคร VIP: รูป JPG/PNG/WebP ต้นฉบับได้ถึง 12 MB และย่อเป็น WebP ไม่เกิน 750 KB อัตโนมัติ, PDF จำกัด 750 KB, รองรับไฟล์ที่ MIME ว่างจากบางอุปกรณ์ และแสดงสถานะเตรียมไฟล์ชัดเจน

# อัปเดต 21 มิถุนายน 2569 — QR และตรวจหลักฐาน VIP

- กดภาพ QR ในหน้าโปรไฟล์เพื่อเปิดภาพขนาดใหญ่ใน dialog ได้ รองรับปิดด้วยปุ่ม พื้นหลัง หรือปุ่ม Escape และมีทางเปิดภาพต้นฉบับ
- เปลี่ยนขั้นตอนหลังบ้านเป็น `ตรวจหลักฐานและมอบสิทธิ์ VIP` เปิดภาพหลักฐานพร้อมข้อมูลสมาชิกในหน้าต่างเดียว
- ผู้ดูแลกำหนดจำนวนวัน 1–3,650 วันหรือเลือก VIP ตลอดชีพ แล้วอนุมัติ/ปฏิเสธจากหน้าต่างตรวจหลักฐานได้ทันที
- หลักฐานภาพแสดงขนาดใหญ่ภายในระบบ ส่วน PDF เปิดแท็บใหม่และกลับมาดำเนินการใน dialog เดิมได้

# อัปเดต 21 มิถุนายน 2569 — E‑Service Card Refresh

- ขยายไอคอนการ์ด E‑Service จาก 80px เป็นสูงสุด 144px พร้อมเงาและสถานะ hover
- กดภาพไอคอนเพื่อเปิดระบบโดยตรง และนำปุ่ม `เปิดระบบ` ด้านล่างออกเพื่อลดความซ้ำซ้อน
- รวมเมนู `แก้ไขระบบ` และ `ลบระบบ` ไว้ในเมนูสามจุดข้างปุ่มหมุด
- เพิ่มการยืนยันก่อนลบ ป้ายแนะนำการคลิก และคงสถานะตัวอย่างที่ไม่เปิดลิงก์จริง
- ปรับ E‑Service เป็น launcher card แบบกระชับตามภาพอ้างอิง: รูปเต็มกรอบ 4:3, ใช้ `object-contain`, ป้ายแหล่งที่มาทับบนภาพ และข้อมูลใต้ภาพเหลือชื่อกับหมวด/คำอธิบายหนึ่งบรรทัด
- Responsive grid แสดง 2 คอลัมน์บนมือถือ, 3 บนแท็บเล็ต, 4 บนเดสก์ท็อป และ 5 บนจอกว้าง เพื่อลดพื้นที่ว่างและเห็นระบบพร้อมกันมากขึ้น
- อัปเดต 10 กรกฎาคม 2569: หน้า E‑Service แสดงลิงก์เป็นกลุ่มหมวดหมู่ชัดเจน มีปุ่มกรองพร้อมจำนวนรายการ และรองรับกดค้าง/ลากการ์ดเพื่อเรียงลำดับภายในหมวด โดยบันทึกลง `user_services.sort_order` ผ่าน API `/api/member/services`
- การเพิ่ม E‑Service ใหม่จะต่อท้ายลำดับของหมวดนั้นอัตโนมัติ และการลากเรียงลำดับทำได้กับลิงก์ของบัญชีผู้ใช้โดยไม่กระทบโควตา Member/VIP
- ปรับ gesture ให้เป็น long‑press จริง: กดค้างที่การ์ดประมาณครึ่งวินาทีแล้วลากข้ามการ์ดภายในหมวดเดียวกัน ปล่อยเพื่อบันทึกตำแหน่งใหม่ พร้อมป้องกันไม่ให้ปุ่มหมุด/เมนูสามจุดถูกลากโดยไม่ตั้งใจ
- ปรับไอคอนการ์ด E‑Service เป็นสัดส่วน 1:1 แบบ launcher และจัดลำดับให้รายการปักหมุดอยู่หน้าสุดเสมอ โดยลากเรียงลำดับได้เฉพาะกลุ่มปักหมุดด้วยกันหรือกลุ่มทั่วไปด้วยกัน
- แก้ปุ่มบนการ์ด E‑Service กดไม่ติดในบางจังหวะ โดยถอด native HTML draggable ออกจากการ์ดและใช้ long‑press pointer gesture เป็นตัวจัดลำดับเพียงทางเดียว ทำให้ปุ่มเปิดระบบ ปักหมุด และเมนูสามจุดกดได้ตามปกติ
- แก้คลิกไอคอนแล้วไม่เปิดลิงก์ โดยเลื่อนการจับ pointer capture ไปหลังครบเวลา long‑press เท่านั้น ทำให้ click สั้นบนรูปยังส่งถึงปุ่มเปิดระบบตามปกติ
- ปรับ UX การลาก E‑Service ให้ชัดขึ้น: รูปไอคอนใช้คลิกเปิดลิงก์ ส่วนมือจับจุด ๆ และพื้นที่การ์ดใช้กดค้างลากเรียงลำดับ พร้อมขยายมือจับลากให้กดง่ายขึ้นบนจอสัมผัส
- ปรับระบบลากเรียงลำดับให้เริ่มจากมือจับจุด ๆ โดยตรง ลดเวลารอเหลือประมาณ 0.18 วินาที ไม่ยกเลิกจากการขยับนิ้วเล็กน้อย และคืน pointer capture เมื่อปล่อย เพื่อให้การเลื่อนเปลี่ยนตำแหน่งทำงานเสถียรกว่าเดิม

# อัปเดต 21 มิถุนายน 2569 — Header Notification Inbox

- ย้าย Notification Center ออกจาก Dashboard หลังบ้านมาเป็นปุ่มกล่องข้อความข้างโปรไฟล์สำหรับ Admin/Super Admin
- แสดง badge จำนวนข้อความยังไม่อ่าน, รายการล่าสุด 8 รายการ, สถานะอ่านแล้ว และปุ่มอ่านทั้งหมด
- ตรวจข้อความใหม่ทุก 45 วินาทีและเมื่อกลับมาเปิดแท็บ พร้อม toast เด้งแจ้งเตือนข้อความล่าสุดโดยไม่ขอสิทธิ์แจ้งเตือนจากระบบปฏิบัติการ
- คลิกข้อความแล้วทำเครื่องหมายว่าอ่าน พร้อมเปิดหลังบ้านไปยังหมวดสมาชิก/คำขอ, สื่อ, ลิงก์, Error หรือ Settings ตามประเภทข้อความ
- Dropdown รองรับมือถือแบบเต็มความกว้างและเดสก์ท็อปแบบกล่องลอย พร้อมสีแยกตามระดับ sky/amber/red/emerald
