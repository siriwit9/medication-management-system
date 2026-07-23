# คู่มือ Deploy ระบบจัดการคลังยา สำหรับ รพ.สต. ใหม่

## ระบบจัดการคลังยา (Medication Management System)

ระบบนี้ออกแบบมาสำหรับ **โรงพยาบาลส่งเสริมสุขภาพประจำตำบล (รพ.สต.)** เพื่อจัดการคลังยา ใบเบิกยา ใบเสร็จ และเชื่อมต่อข้อมูล JHCIS

---

## สิ่งที่ต้องเตรียม

| รายการ | รายละเอียด |
|--------|-----------|
| **Supabase Account** | สมัครฟรีที่ [supabase.com](https://supabase.com) (Free Tier รองรับ 500MB) |
| **Netlify Account** | สมัครฟรีที่ [netlify.com](https://netlify.com) (Free Hosting) |
| **Source Code** | ดาวน์โหลด ZIP หรือ Fork จาก GitHub Repository |

---

## ขั้นตอนการติดตั้ง (15-20 นาที)

### ขั้นตอนที่ 1: สร้าง Supabase Project

1. ไปที่ [app.supabase.com](https://app.supabase.com) แล้วกด **New Project**
2. ตั้งชื่อ Project เช่น `med-clinic-banna` (ชื่อ รพ.สต. ของคุณ)
3. ตั้ง Database Password (จดไว้)
4. เลือก Region: **Southeast Asia (Singapore)** — เร็วที่สุดสำหรับไทย
5. กด **Create new project** รอประมาณ 2 นาที

### ขั้นตอนที่ 2: สร้างตาราง Database

1. เข้า Supabase Dashboard > **SQL Editor**
2. คัดลอกเนื้อหาจากไฟล์ต่อไปนี้ ทีละไฟล์ แล้ววางใน SQL Editor แล้วกด **Run**:

```
supabase/migrations/001_create_tables.sql    (สร้างตาราง)
supabase/migrations/002_rls_policies.sql     (ตั้งค่า Security)
supabase/migrations/003_receipts_and_jhcis.sql (ใบเสร็จ + JHCIS)
```

> **สำคัญ**: ต้อง Run ทีละไฟล์ ตามลำดับ 001 > 002 > 003

### ขั้นตอนที่ 3: คัดลอก API Keys

1. ไปที่ Supabase Dashboard > **Settings** > **API**
2. คัดลอก 2 ค่าต่อไปนี้:
   - **Project URL** เช่น `https://xxxxx.supabase.co`
   - **anon public key** เช่น `eyJhbGciOiJIUzI1NiIs...`

### ขั้นตอนที่ 4: ตั้งค่า Source Code

มี 2 วิธี:

#### วิธี A: แก้ไข config.js (ง่ายที่สุด)

เปิดไฟล์ `frontend/assets/js/config.js` แล้วแก้ไข:

```javascript
SUPABASE_URL: 'https://xxxxx.supabase.co',      // ใส่ URL ของคุณ
SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIs...',   // ใส่ Key ของคุณ
```

#### วิธี B: ใช้ Meta Tags (ไม่ต้องแก้ JS)

เปิด `frontend/index.html` แล้วเพิ่มบรรทัดนี้ใน `<head>`:

```html
<meta name="app-supabase-url" content="https://xxxxx.supabase.co" />
<meta name="app-supabase-key" content="eyJhbGciOiJIUzI1NiIs..." />
<meta name="app-hospital-code" content="banna" />
```

### ขั้นตอนที่ 5: Deploy ขึ้น Netlify

#### วิธี A: ลากไฟล์ขึ้น (ง่ายที่สุด)
1. ไปที่ [app.netlify.com](https://app.netlify.com)
2. กด **Add new site** > **Deploy manually**
3. ลาก folder `frontend/` ไปวางในกล่อง Deploy
4. รอ 30 วินาที — ได้เว็บไซต์พร้อมใช้งาน!

#### วิธี B: เชื่อมต่อ GitHub (อัปเดตอัตโนมัติ)
1. Fork Repository บน GitHub
2. ไปที่ Netlify > **Add new site** > **Import from Git**
3. เลือก Repository ที่ Fork
4. ตั้งค่า:
   - **Publish directory**: `frontend`
5. กด **Deploy site**

### ขั้นตอนที่ 6: เข้าสู่ระบบครั้งแรก

1. เปิดเว็บไซต์ที่ได้จาก Netlify (เช่น `https://med-banna.netlify.app`)
2. เข้าสู่ระบบด้วย:
   - **ชื่อผู้ใช้**: `admin`
   - **รหัสผ่าน**: `admin1234`
3. ไปที่ **ตั้งค่า** > ตั้งชื่อ รพ.สต. ของคุณ
4. อัปโหลดโลโก้/ครุฑ (ถ้ามี)
5. เพิ่มผู้ใช้คนอื่น แล้วเปลี่ยนรหัสผ่าน admin

---

## ใช้ Setup Script (สำหรับผู้ชำนาญ)

```bash
chmod +x deploy-kit/setup.sh
./deploy-kit/setup.sh "รพ.สต.ตำบลบ้านนา" "https://xxxxx.supabase.co" "eyJhbGci..."
```

Script จะสร้างไฟล์ `config.js` ให้อัตโนมัติ

---

## คำถามที่พบบ่อย

**Q: ค่าใช้จ่ายเท่าไหร่?**
A: ฟรี! Supabase Free Tier (500MB) + Netlify Free Tier เพียงพอสำหรับ รพ.สต. ขนาดเล็ก-กลาง

**Q: ข้อมูลของแต่ละ รพ.สต. แยกกันไหม?**
A: ใช่ แต่ละ รพ.สต. มี Supabase Project แยกกัน ข้อมูลไม่ปะปนกัน

**Q: อัปเดตระบบใหม่ทำอย่างไร?**
A: ถ้าใช้ GitHub จะอัปเดตอัตโนมัติเมื่อ Push โค้ดใหม่ ถ้าลากไฟล์ขึ้น ให้ลากใหม่อีกครั้ง

**Q: รองรับกี่คนพร้อมกัน?**
A: Supabase Free Tier รองรับ concurrent connections ไม่เกิน 200 (เพียงพอสำหรับ รพ.สต.)

---

## โครงสร้างไฟล์สำคัญ

```
frontend/
  index.html                    - หน้าหลักของเว็บแอป
  assets/
    css/styles.css              - ธีมและ Design System
    js/
      config.js                 - ตั้งค่า Supabase URL/Key
      supabase.js               - ตัวเชื่อมต่อ Supabase
      views/                    - หน้าจอต่างๆ
supabase/
  migrations/                   - SQL สำหรับสร้างตาราง
deploy-kit/
  README.md                     - ไฟล์นี้
  setup.sh                      - Script ตั้งค่าอัตโนมัติ
  config-template.js            - Template สำหรับ config.js
```
