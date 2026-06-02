# Worker Cron ตรวจลิงก์อัตโนมัติ

โฟลเดอร์นี้คือ Cloudflare Worker แยกจาก Cloudflare Pages หลัก ใช้เรียก endpoint:

```text
POST https://mediaplatform.pages.dev/api/cron/link-checks
```

ทุก 6 ชั่วโมงตามค่าใน `wrangler.toml`

## ตั้งค่าก่อน deploy

1. ตั้ง `CRON_SECRET` ใน Cloudflare Pages project ให้ตรงกับ Worker
2. ตั้ง secret ใน Worker:

```bash
npm run cron:secret
```

3. Deploy Worker:

```bash
npm run cron:deploy
```

## ปรับรอบเวลา

แก้ค่าในไฟล์ `wrangler.toml`:

```toml
[triggers]
crons = ["0 */6 * * *"]
```

ตัวอย่าง:

- `0 */6 * * *` = ทุก 6 ชั่วโมง
- `0 0 * * *` = ทุกวันเวลา 00:00 UTC
- `0 17 * * *` = ทุกวันเวลา 17:00 UTC หรือ 00:00 เวลาไทย

## ความปลอดภัย

- ห้ามใส่ค่า `CRON_SECRET` จริงในไฟล์นี้
- ให้ใช้ `wrangler secret put CRON_SECRET`
- Worker จะส่ง secret ไปที่ Pages Functions ผ่าน header `x-cron-secret`
