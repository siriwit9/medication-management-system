/**
 * จัดการรูปภาพยาใน Google Drive
 */

var DRIVE_FOLDER_NAME = 'MedStock_Images';

function getImageFolder_() {
  var settings = getSettings();
  var folderId = settings.imageFolderId;
  if (folderId) {
    try { return DriveApp.getFolderById(folderId); } catch (e) {}
  }
  // สร้างโฟลเดอร์ใหม่
  var folder = DriveApp.createFolder(DRIVE_FOLDER_NAME);
  setSetting_('imageFolderId', folder.getId());
  return folder;
}

/**
 * อัปโหลดรูป (dataUrl = "data:image/png;base64,....") แล้วผูกกับยา
 */
function uploadMedicineImage(medicineId, dataUrl, filename) {
  if (!medicineId || !dataUrl) throw new Error('ข้อมูลรูปไม่ครบ');
  var med = findById_('Medicines', medicineId);
  if (!med) throw new Error('ไม่พบรายการยา');

  var match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
  if (!match) throw new Error('รูปแบบรูปไม่ถูกต้อง');
  var contentType = match[1];
  var bytes = Utilities.base64Decode(match[2]);
  var blob = Utilities.newBlob(bytes, contentType, filename || (medicineId + '.jpg'));

  // ลบรูปเดิมถ้ามี
  if (med.imageFileId) { try { deleteDriveFile_(med.imageFileId); } catch (e) {} }

  var folder = getImageFolder_();
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  med.imageFileId = file.getId();
  updateRow_('Medicines', med.__row, med);
  return { fileId: file.getId() };
}

/**
 * คืนรูปเป็น dataUrl (ให้ frontend แสดงโดยไม่ติดปัญหาสิทธิ์)
 */
function getMedicineImage(fileId) {
  if (!fileId) throw new Error('ไม่มี fileId');
  var file = DriveApp.getFileById(fileId);
  var blob = file.getBlob();
  var b64 = Utilities.base64Encode(blob.getBytes());
  return { dataUrl: 'data:' + blob.getContentType() + ';base64,' + b64 };
}

/**
 * อัปโหลดโลโก้โรงพยาบาล แล้วเก็บ fileId ใน Settings
 */
function uploadLogo(dataUrl, filename) {
  if (!dataUrl) throw new Error('ไม่มีรูป');
  var match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
  if (!match) throw new Error('รูปแบบรูปไม่ถูกต้อง');
  var blob = Utilities.newBlob(Utilities.base64Decode(match[2]), match[1], filename || 'logo.png');

  var settings = getSettings();
  if (settings.logoFileId) { try { deleteDriveFile_(settings.logoFileId); } catch (e) {} }

  var folder = getImageFolder_();
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  setSetting_('logoFileId', file.getId());
  return { fileId: file.getId() };
}

function deleteDriveFile_(fileId) {
  if (!fileId) return;
  DriveApp.getFileById(fileId).setTrashed(true);
}
