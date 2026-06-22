# ระบบจัดการคลังยา + แจ้งเตือนวันหมดอายุ (รพ.สต.)

ระบบ PWA ภาษาไทย (พ.ศ.) สำหรับจัดการคลังยาและแจ้งเตือนวันหมดอายุ
- **Frontend:** Vanilla HTML/CSS/JS (วางบน GitHub Pages ได้ทันที ไม่ต้อง build)
- **Backend:** Google Apps Script (JSON API)
- **ฐานข้อมูล:** Google Sheets
- **รูปภาพ:** Google Drive
- **แจ้งเตือน:** Telegram Bot (โครงเผื่อ LINE Messaging API ในอนาคต)

---

## โครงสร้างโปรเจกต์
```
backend/     # โค้ด Google Apps Script (.gs + appsscript.json)
frontend/    # เว็บ PWA (deploy ขึ้น GitHub Pages)
วางแผน/      # ภาพคู่มือ/แผนงานต้นฉบับ
```

---

## ขั้นตอนติดตั้ง

### 1) สร้างฐานข้อมูล + Backend (Google Apps Script)
1. สร้าง Google Sheet ใหม่ (ตั้งชื่ออะไรก็ได้) → เมนู **ส่วนขยาย (Extensions) > Apps Script**
2. ลบไฟล์ `Code.gs` เดิม แล้วสร้างไฟล์ตามในโฟลเดอร์ `backend/` ให้ครบ:
   `Code.gs`, `Sheets.gs`, `Auth.gs`, `Catalog.gs`, `Inventory.gs`, `Drive.gs`, `Reports.gs`, `Notify.gs`
   (คัดลอกเนื้อหาแต่ละไฟล์ไปวาง)
3. ตั้งค่า `appsscript.json`: กดไอคอนเฟือง **Project Settings** → ติ๊ก *"Show appsscript.json"* แล้ววางเนื้อหาจาก `backend/appsscript.json`
4. เลือกฟังก์ชัน **`setup`** จากเมนูดรอปดาวน์ แล้วกด **Run** หนึ่งครั้ง
   - อนุญาตสิทธิ์ (Sheets, Drive) ตามที่ขอ
   - ระบบจะสร้างชีตทั้งหมด + ผู้ใช้ **admin / admin1234** + สถานที่ตัวอย่าง
5. กด **Deploy > New deployment** → ชนิด **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - กด Deploy แล้วคัดลอก **Web app URL** (ลงท้ายด้วย `/exec`)

### 2) ตั้งค่า Frontend
1. เปิด `frontend/assets/js/config.js`
2. วาง Web app URL ที่ได้ในตัวแปร `APPS_SCRIPT_URL`
   ```js
   APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycb..../exec'
   ```

### 3) อัปขึ้น GitHub + Deploy GitHub Pages (อัตโนมัติ)
โปรเจกต์มี GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) ที่ deploy เฉพาะโฟลเดอร์ `frontend/` ให้อัตโนมัติ จึงเก็บทั้งโปรเจกต์ (backend + frontend + วางแผน) ไว้ใน repo เดียวได้

1. สร้าง repo ว่างบน GitHub (เช่น `medstock`) — **ยังไม่ต้อง** สร้าง README/gitignore ในเว็บ
2. ที่เครื่อง รันคำสั่ง (อยู่ในโฟลเดอร์โปรเจกต์):
   ```bash
   git init
   git add .
   git commit -m "ระบบจัดการคลังยา รพ.สต. เวอร์ชันแรก"
   git branch -M main
   git remote add origin https://github.com/<ชื่อผู้ใช้>/<ชื่อ-repo>.git
   git push -u origin main
   ```
3. บน GitHub ไปที่ **Settings > Pages** → Source: เลือก **GitHub Actions**
4. workflow จะรันเอง (ดูได้ที่แท็บ **Actions**) เมื่อเสร็จจะได้ URL แบบ `https://<ชื่อผู้ใช้>.github.io/<ชื่อ-repo>/`
5. เปิด URL (เป็น **https** ซึ่งจำเป็นสำหรับกล้องและ PWA) → เข้าสู่ระบบด้วย **admin / admin1234** แล้ว **เปลี่ยนรหัสผ่านทันที** ที่ ตั้งค่า > บัญชีของฉัน

> ครั้งต่อ ๆ ไปแก้ไขแล้วแค่ `git add . && git commit -m "..." && git push` ระบบจะ deploy ใหม่ให้เอง
>
> **ทางเลือกแบบง่าย (ไม่ใช้ Actions):** อัปเฉพาะเนื้อหาในโฟลเดอร์ `frontend/` ขึ้น repo ให้ `index.html` อยู่ราก แล้วตั้ง Pages เป็น *Deploy from a branch* → `main` / root

---

## ตั้งค่าการแจ้งเตือน Telegram
1. ใน Telegram คุยกับ **@BotFather** → `/newbot` เพื่อสร้างบอท จะได้ **Bot Token**
2. หา **Chat ID**:
   - ส่งข้อความหาบอท (หรือเพิ่มบอทเข้ากลุ่มแล้วพิมพ์ข้อความ)
   - เปิด `https://api.telegram.org/bot<TOKEN>/getUpdates` ดูค่า `chat.id`
3. ในแอป: **ตั้งค่า > การแจ้งเตือน** → เปิดสวิตช์ ใส่ token + chat id + เวลา → **บันทึก** → **ส่งข้อความทดสอบ**
4. กลับไปที่ Apps Script เลือกฟังก์ชัน **`setupNotifications`** กด **Run** หนึ่งครั้ง (สร้างตัวจับเวลารายวัน)

> หมายเหตุ: LINE Notify ปิดบริการแล้ว — ส่วน LINE จะรองรับผ่าน **Messaging API** ในเวอร์ชันถัดไป (มีโครง `sendLine_` เตรียมไว้แล้วใน `Notify.gs`)

---

## ภาษาไทยใน PDF (ทางเลือก)
ฟอนต์ดีฟอลต์ของ jsPDF ไม่รองรับภาษาไทยเต็มที่ หากต้องการให้รายงาน PDF คมชัด:
1. ดาวน์โหลด **Sarabun-Regular.ttf** จาก Google Fonts
2. แปลงเป็น base64: `base64 -i Sarabun-Regular.ttf | tr -d '\n' > font.txt`
3. เปิด `frontend/assets/js/thai-font.js` แล้ววางสตริงในตัวแปร `window.THAI_FONT_BASE64`

Excel (.xlsx) รองรับภาษาไทยอยู่แล้วโดยไม่ต้องตั้งค่าเพิ่ม

---

## บทบาทผู้ใช้
| บทบาท | สิทธิ์ |
|-------|--------|
| **admin** | ทั้งหมด รวมตั้งค่า รพ. / แจ้งเตือน / จัดการผู้ใช้ |
| **pharmacist** | จัดการสต็อก รายการยา สถานที่ รับเข้า ย้าย ตัดจ่าย ตรวจนับ |
| **staff** | รับเข้า + ดูข้อมูล + ส่งออก |

---

## ความปลอดภัย/ข้อจำกัด
- รหัสผ่านเก็บแบบ **SHA-256 + salt** ต่อผู้ใช้ (ไม่เก็บ plain text) — เหมาะกับงานภายในหน่วยงาน
- ป้องกันยอดติดลบด้วย **LockService** (อ่าน→ตรวจ→เขียน แบบทำทีละคน)
- เรียก API แบบ `text/plain` เพื่อเลี่ยง CORS preflight ของ Apps Script
- โควต้า Apps Script/Drive ฟรี เพียงพอสำหรับ รพ.สต. ขนาดเล็ก

---

## บัญชีเริ่มต้น
- ผู้ใช้: `admin`
- รหัสผ่าน: `admin1234`
- **เปลี่ยนรหัสผ่านทันทีหลังเข้าใช้ครั้งแรก**
