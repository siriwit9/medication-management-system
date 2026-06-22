/**
 * ฟอนต์ไทยสำหรับ PDF (ทางเลือก)
 * ค่าเริ่มต้นว่าง = PDF จะใช้ฟอนต์ละติน (ภาษาไทยอาจไม่สมบูรณ์)
 *
 * วิธีเปิดใช้ภาษาไทยใน PDF ให้คมชัด:
 *  1) ดาวน์โหลดฟอนต์ Sarabun (Sarabun-Regular.ttf) จาก Google Fonts
 *  2) แปลงเป็น base64: `base64 -i Sarabun-Regular.ttf | tr -d '\n'`
 *  3) วางสตริงที่ได้ในตัวแปรด้านล่าง: window.THAI_FONT_BASE64 = 'AAEAAA...';
 */
window.THAI_FONT_BASE64 = '';
