/**
 * ระบบใบเบิกยา — สร้าง/แก้ไข/ลบใบเบิก + ดึงรายการพร้อมข้อมูลยา
 */

function listRequisitions() {
  var users = {};
  readAll_('Users').forEach(function (u) { users[u.id] = u; });
  return readAll_('Requisitions').map(function (r) {
    return {
      id: r.id, reqNumber: r.reqNumber, reqDate: r.reqDate,
      requesterName: r.requesterName, approverName: r.approverName,
      distributorName: r.distributorName, receiverName: r.receiverName,
      status: r.status || 'draft', note: r.note,
      createdBy: (users[r.createdBy] || {}).username || '', createdAt: r.createdAt
    };
  }).sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
}

function getRequisition(id) {
  var req = findById_('Requisitions', id);
  if (!req) throw new Error('ไม่พบใบเบิก');
  var meds = {};
  readAll_('Medicines').forEach(function (m) { meds[m.id] = m; });

  // คำนวณยอดคงเหลือรวมของแต่ละยา
  var stockTotals = {};
  readAll_('Stock').forEach(function (s) {
    stockTotals[s.medicineId] = (stockTotals[s.medicineId] || 0) + Number(s.qty);
  });

  var items = readAll_('RequisitionItems').filter(function (it) {
    return String(it.requisitionId) === String(id);
  }).map(function (it) {
    var m = meds[it.medicineId] || {};
    return {
      id: it.id, medicineId: it.medicineId, medicineName: m.name || '(ไม่พบยา)',
      unit: m.unit || '', qtyRequested: Number(it.qtyRequested),
      qtyApproved: Number(it.qtyApproved), qtyRemaining: Number(it.qtyRemaining),
      note: it.note || ''
    };
  });

  return {
    id: req.id, reqNumber: req.reqNumber, reqDate: req.reqDate,
    requesterName: req.requesterName, approverName: req.approverName,
    distributorName: req.distributorName, receiverName: req.receiverName,
    status: req.status || 'draft', note: req.note, createdAt: req.createdAt,
    items: items
  };
}

function saveRequisition(payload, user) {
  if (!payload) throw new Error('ไม่มีข้อมูลใบเบิก');
  if (!payload.items || !payload.items.length) throw new Error('ต้องมีรายการยาอย่างน้อย 1 รายการ');

  // คำนวณยอดคงเหลือรวม
  var stockTotals = {};
  readAll_('Stock').forEach(function (s) {
    stockTotals[s.medicineId] = (stockTotals[s.medicineId] || 0) + Number(s.qty);
  });

  if (payload.id) {
    // แก้ไข
    var existing = findById_('Requisitions', payload.id);
    if (!existing) throw new Error('ไม่พบใบเบิก');
    existing.reqDate = payload.reqDate || existing.reqDate;
    existing.requesterName = payload.requesterName || existing.requesterName;
    existing.approverName = payload.approverName || existing.approverName;
    existing.distributorName = payload.distributorName || existing.distributorName;
    existing.receiverName = payload.receiverName || existing.receiverName;
    existing.status = payload.status || existing.status;
    existing.note = payload.note !== undefined ? payload.note : existing.note;
    updateRow_('Requisitions', existing.__row, existing);

    // ลบ items เดิม แล้วเพิ่มใหม่
    deleteRowByMatch_('RequisitionItems', function (it) { return String(it.requisitionId) === String(payload.id); });
    payload.items.forEach(function (it) {
      appendRow_('RequisitionItems', {
        id: Utilities.getUuid(), requisitionId: payload.id,
        medicineId: it.medicineId, qtyRequested: String(Number(it.qtyRequested || 0)),
        qtyApproved: String(Number(it.qtyApproved || it.qtyRequested || 0)),
        qtyRemaining: String(stockTotals[it.medicineId] || 0),
        note: it.note || ''
      });
    });
    return { id: payload.id };
  }

  // สร้างใหม่
  var allReqs = readAll_('Requisitions');
  var maxNum = allReqs.reduce(function (mx, r) {
    var n = Number(String(r.reqNumber).replace(/\D/g, '') || 0);
    return Math.max(mx, n);
  }, 0);
  var reqNumber = 'REQ-' + String(maxNum + 1).padStart(4, '0');

  var id = Utilities.getUuid();
  appendRow_('Requisitions', {
    id: id, reqNumber: reqNumber,
    reqDate: payload.reqDate || new Date().toISOString().slice(0, 10),
    requesterName: payload.requesterName || '',
    approverName: payload.approverName || '',
    distributorName: payload.distributorName || '',
    receiverName: payload.receiverName || '',
    status: 'draft', note: payload.note || '',
    createdBy: user.id, createdAt: new Date().toISOString()
  });

  payload.items.forEach(function (it) {
    appendRow_('RequisitionItems', {
      id: Utilities.getUuid(), requisitionId: id,
      medicineId: it.medicineId, qtyRequested: String(Number(it.qtyRequested || 0)),
      qtyApproved: String(Number(it.qtyApproved || it.qtyRequested || 0)),
      qtyRemaining: String(stockTotals[it.medicineId] || 0),
      note: it.note || ''
    });
  });
  return { id: id, reqNumber: reqNumber };
}

function deleteRequisition(id, user) {
  var req = findById_('Requisitions', id);
  if (!req) throw new Error('ไม่พบใบเบิก');
  deleteRowByMatch_('RequisitionItems', function (it) { return String(it.requisitionId) === String(id); });
  deleteRowByMatch_('Requisitions', function (r) { return String(r.id) === String(id); });
  return { deleted: true };
}
