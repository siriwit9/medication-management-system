/**
 * แจ้งเตือนผ่าน Telegram + ตัวจับเวลารายวัน
 * (โครงเผื่อ LINE Messaging API ในอนาคต — ดู sendLine_)
 */

function saveSettings(settings, user) {
  if (!settings) throw new Error('ไม่มีข้อมูลตั้งค่า');
  var allow = ['hospitalName', 'logoFileId', 'warnRed', 'warnOrange', 'warnYellow',
    'telegramToken', 'telegramChatId', 'notifyTime', 'notifyEnabled'];
  allow.forEach(function (k) {
    if (settings[k] !== undefined) setSetting_(k, String(settings[k]));
  });
  // ถ้าเปลี่ยนเวลา/เปิดปิด ให้ตั้ง trigger ใหม่ (ไม่ให้ error บล็อกการบันทึก
  // เพราะการสร้าง trigger ต้องอนุญาตสิทธิ์โดยรัน setupNotifications จาก Editor ครั้งแรก)
  try { setupNotifications(); } catch (e) { /* ผู้ใช้ต้องรัน setupNotifications ใน Apps Script เอง */ }
  return getSettings();
}

function sendTelegram_(text) {
  var s = getSettings();
  if (!s.telegramToken || !s.telegramChatId) throw new Error('ยังไม่ได้ตั้งค่า Telegram token / chat id');
  var url = 'https://api.telegram.org/bot' + s.telegramToken + '/sendMessage';
  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ chat_id: s.telegramChatId, text: text, parse_mode: 'HTML' }),
    muteHttpExceptions: true
  });
  var body = JSON.parse(res.getContentText() || '{}');
  if (!body.ok) throw new Error('Telegram error: ' + (body.description || res.getContentText()));
  return true;
}

// โครงเผื่อ LINE Messaging API (เพิ่มภายหลัง)
function sendLine_(text) {
  var s = getSettings();
  if (!s.lineToken) throw new Error('ยังไม่ได้ตั้งค่า LINE');
  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/broadcast', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + s.lineToken },
    payload: JSON.stringify({ messages: [{ type: 'text', text: text }] }),
    muteHttpExceptions: true
  });
  return true;
}

function testNotify() {
  sendTelegram_('🔔 ทดสอบการแจ้งเตือนจากระบบจัดการคลังยา รพ.สต.');
  return { sent: true };
}

function buildDailyReportText_() {
  var s = getSettings();
  var dash = getDashboard('');
  var t = dash.thresholds;
  var lines = [];
  lines.push('🏥 <b>' + (s.hospitalName || 'รพ.สต.') + '</b>');
  lines.push('📅 สรุปยาใกล้หมดอายุประจำวัน');
  lines.push('');
  lines.push('🔴 ภายใน ' + t.red + ' วัน (เร่งด่วน): ' + dash.buckets.red + ' รายการ');
  lines.push('🟠 ภายใน ' + t.orange + ' วัน: ' + dash.buckets.orange + ' รายการ');
  lines.push('🟡 ภายใน ' + t.yellow + ' วัน: ' + dash.buckets.yellow + ' รายการ');

  // รายการเร่งด่วน (แดง) สูงสุด 15
  var urgent = dash.items.filter(function (i) { return i.bucket === 'red'; }).slice(0, 15);
  if (urgent.length) {
    lines.push('');
    lines.push('<b>รายการเร่งด่วน:</b>');
    urgent.forEach(function (i) {
      var dleft = i.daysLeft === null ? '-' : (i.daysLeft < 0 ? 'หมดอายุแล้ว' : 'เหลือ ' + i.daysLeft + ' วัน');
      lines.push('• ' + i.medicineName + ' (Lot ' + (i.lot || '-') + ', ' + i.locationName + ') ' + dleft);
    });
  }

  if (dash.lowStock.length) {
    lines.push('');
    lines.push('<b>⚠️ สต็อกต่ำกว่าขั้นต่ำ:</b>');
    dash.lowStock.slice(0, 15).forEach(function (l) {
      lines.push('• ' + l.medicineName + ': มี ' + l.have + ' / ขั้นต่ำ ' + l.minStock);
    });
  }
  return lines.join('\n');
}

/**
 * ฟังก์ชันที่ trigger เรียกทุกวัน
 */
function dailyNotifyJob() {
  var s = getSettings();
  if (String(s.notifyEnabled) !== 'true') return;
  if (!s.telegramToken || !s.telegramChatId) return;
  sendTelegram_(buildDailyReportText_());
}

/**
 * ตั้ง/รีเซ็ต trigger รายวันตามเวลาใน Settings (รันครั้งแรกจาก Editor เพื่ออนุญาตสิทธิ์)
 */
function setupNotifications() {
  // ลบ trigger เดิมของ dailyNotifyJob
  ScriptApp.getProjectTriggers().forEach(function (tr) {
    if (tr.getHandlerFunction() === 'dailyNotifyJob') ScriptApp.deleteTrigger(tr);
  });

  var s = getSettings();
  if (String(s.notifyEnabled) !== 'true') return 'ปิดการแจ้งเตือน — ไม่ได้ตั้ง trigger';

  var time = String(s.notifyTime || '08:00');
  var parts = time.split(':');
  var hour = Number(parts[0] || 8);

  ScriptApp.newTrigger('dailyNotifyJob')
    .timeBased()
    .everyDays(1)
    .atHour(hour)
    .nearMinute(Number(parts[1] || 0))
    .create();
  return 'ตั้ง trigger รายวันเวลา ' + hour + ':00 แล้ว';
}
