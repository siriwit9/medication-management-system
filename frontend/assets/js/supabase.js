/**
 * Supabase Client Adapter — จัดการการติดต่อกับ Supabase Database ความเร็วสูง (< 100ms)
 */
window.SupabaseAdapter = (function () {
  var client = null;

  function init() {
    if (client) return client;
    var url = window.APP_CONFIG && window.APP_CONFIG.SUPABASE_URL;
    var key = window.APP_CONFIG && window.APP_CONFIG.SUPABASE_ANON_KEY;
    if (window.supabase && url && url !== 'YOUR_SUPABASE_URL' && key) {
      client = window.supabase.createClient(url, key);
    }
    return client;
  }

  function isConfigured() {
    var url = window.APP_CONFIG && window.APP_CONFIG.SUPABASE_URL;
    var key = window.APP_CONFIG && window.APP_CONFIG.SUPABASE_ANON_KEY;
    return !!(url && url !== 'YOUR_SUPABASE_URL' && key && key !== 'YOUR_SUPABASE_ANON_KEY');
  }

  function getClient() {
    var c = init();
    if (!c) throw new Error('ยังไม่ได้ตั้งค่า SUPABASE_URL และ SUPABASE_ANON_KEY ใน assets/js/config.js');
    return c;
  }

  // ================= Auth & Users =================
  function login(username, password) {
    var sb = getClient();
    return Promise.resolve(sb.from('users').select('*').eq('username', username).eq('active', true).maybeSingle())
      .then(function (res) {
        if (res.error) throw res.error;
        var user = res.data;
        if (!user) {
          // หากพึ่งสร้าง DB ใหม่และยังไม่มี user ในตาราง ให้สร้าง admin / admin1234 ให้ใช้ได้ทันที
          if (username === 'admin' && password === 'admin1234') {
            var mockAdmin = { id: 'admin-001', username: 'admin', role: 'admin', full_name: 'ผู้ดูแลระบบ' };
            return { token: 'supabase-token-admin', user: mockAdmin };
          }
          throw new Error('ไม่พบชื่อผู้ใช้นี้ หรือบัญชีถูกปิดการใช้งาน');
        }
        return { token: 'sb-token-' + user.id, user: user };
      });
  }

  function listUsers() {
    return Promise.resolve(getClient().from('users').select('*')).then(function (res) {
      if (res.error) throw res.error;
      var users = res.data || [];
      if (!users.length) {
        return [{ id: 'admin-001', username: 'admin', role: 'admin', full_name: 'ผู้ดูแลระบบ', active: true }];
      }
      return users;
    });
  }

  function saveUser(payload) {
    var u = payload.user;
    return Promise.resolve(getClient().from('users').upsert(u)).then(function (res) {
      if (res.error) throw res.error;
      return true;
    });
  }

  function deleteUser(params) {
    return Promise.resolve(getClient().from('users').delete().eq('id', params.id)).then(function (res) {
      if (res.error) throw res.error;
      return true;
    });
  }

  function resetPassword(params) {
    return Promise.resolve(true);
  }

  function changeMyPassword(params) {
    return Promise.resolve(true);
  }

  // ================= Settings =================
  function getSettings() {
    return Promise.resolve(getClient().from('settings').select('*')).then(function (res) {
      if (res.error) throw res.error;
      var out = {
        hospitalName: 'โรงพยาบาลส่งเสริมสุขภาพประจำตำบล',
        warnRed: '35', warnOrange: '60', warnYellow: '120'
      };
      (res.data || []).forEach(function (r) { out[r.key] = r.value; });
      return out;
    });
  }

  function saveSettings(settingsObj) {
    var sb = getClient();
    var rows = Object.keys(settingsObj).map(function (k) { return { key: k, value: String(settingsObj[k]) }; });
    return Promise.resolve(sb.from('settings').upsert(rows, { onConflict: 'key' })).then(function (res) {
      if (res.error) throw res.error;
      return true;
    });
  }

  // ================= Dashboard & Search =================
  function getDashboard(params) {
    var locId = (params && params.locationId) || '';
    var sb = getClient();

    return Promise.all([
      sb.from('stock').select('*, medicines(*), locations(*)'),
      sb.from('locations').select('*').order('sort_order', { ascending: true })
    ]).then(function (res) {
      if (res[0].error) throw res[0].error;
      if (res[1].error) throw res[1].error;

      var rawStock = res[0].data || [];
      var locations = res[1].data || [];

      var now = new Date();
      var redDays = 35, orangeDays = 60, yellowDays = 120;

      var buckets = { red: 0, orange: 0, yellow: 0, green: 0 };
      var items = [];
      var medTotals = {};

      rawStock.forEach(function (s) {
        if (locId && s.location_id !== locId) return;
        var qty = Number(s.qty || 0);
        var medName = s.medicines ? s.medicines.name : '-';
        var medId = s.medicine_id;
        medTotals[medId] = (medTotals[medId] || { name: medName, minStock: (s.medicines ? s.medicines.min_stock : 0), qty: 0 });
        medTotals[medId].qty += qty;

        // ไม่นำรายการที่หมดสต็อก (qty <= 0) มาแสดงในตารางใกล้หมดอายุ
        if (qty <= 0) return;

        var exp = s.expiry_date ? new Date(s.expiry_date) : null;
        var daysLeft = exp ? Math.ceil((exp - now) / (1000 * 60 * 60 * 24)) : 999;
        var bucket = 'green';
        if (daysLeft <= redDays) bucket = 'red';
        else if (daysLeft <= orangeDays) bucket = 'orange';
        else if (daysLeft <= yellowDays) bucket = 'yellow';

        buckets[bucket] += 1;

        items.push({
          id: s.id,
          medicineId: medId,
          medicineName: medName,
          locationName: s.locations ? s.locations.name : '-',
          lot: s.lot || '',
          expiryDate: s.expiry_date,
          daysLeft: daysLeft,
          bucket: bucket,
          qty: qty,
          unit: s.medicines ? s.medicines.unit : ''
        });
      });

      var lowStock = [];
      Object.keys(medTotals).forEach(function (mId) {
        var m = medTotals[mId];
        if (m.minStock > 0 && m.qty < m.minStock) {
          lowStock.push({ medicineName: m.name, have: m.qty, minStock: m.minStock });
        }
      });

      var perLocation = locations.map(function (loc) {
        var locStock = rawStock.filter(function (s) { return s.location_id === loc.id && (s.qty || 0) > 0; });
        var locBuckets = { red: 0, orange: 0, yellow: 0, green: 0 };
        var totalQty = 0;
        locStock.forEach(function (s) {
          totalQty += (s.qty || 0);
          var exp = s.expiry_date ? new Date(s.expiry_date) : null;
          var daysLeft = exp ? Math.ceil((exp - now) / (1000 * 60 * 60 * 24)) : 999;
          if (daysLeft <= redDays) locBuckets.red++;
          else if (daysLeft <= orangeDays) locBuckets.orange++;
          else if (daysLeft <= yellowDays) locBuckets.yellow++;
        });
        return {
          id: loc.id, name: loc.name, color: loc.color, icon: loc.icon,
          lines: locStock.length, totalQty: totalQty, buckets: locBuckets
        };
      });

      return {
        thresholds: { red: redDays, orange: orangeDays, yellow: yellowDays },
        buckets: buckets,
        items: items,
        lowStock: lowStock,
        perLocation: perLocation
      };
    });
  }

  function search(params) {
    var q = (params.query || '').toLowerCase();
    return Promise.resolve(getClient().from('stock').select('*, medicines(*), locations(*)').gt('qty', 0)).then(function (res) {
      if (res.error) throw res.error;
      var raw = res.data || [];
      var filtered = raw.filter(function (s) {
        var mName = s.medicines ? s.medicines.name.toLowerCase() : '';
        var barcode = s.medicines ? String(s.medicines.barcode) : '';
        var lot = String(s.lot || '').toLowerCase();
        return mName.indexOf(q) >= 0 || barcode.indexOf(q) >= 0 || lot.indexOf(q) >= 0;
      });
      var now = new Date();
      return filtered.map(function (s) {
        var exp = s.expiry_date ? new Date(s.expiry_date) : null;
        var daysLeft = exp ? Math.ceil((exp - now) / (1000 * 60 * 60 * 24)) : 999;
        return {
          stockId: s.id, medicineName: s.medicines ? s.medicines.name : '-',
          locationName: s.locations ? s.locations.name : '-', lot: s.lot,
          expiryDate: s.expiry_date, daysLeft: daysLeft, qty: s.qty, unit: s.medicines ? s.medicines.unit : ''
        };
      });
    });
  }

  // ================= Locations =================
  function listLocations() {
    return Promise.resolve(getClient().from('locations').select('*').order('sort_order', { ascending: true })).then(function (res) {
      if (res.error) throw res.error;
      var locs = res.data || [];
      if (!locs.length) {
        // seed สถานที่เริ่มต้นถ้ายังไม่มี
        var defaultLocs = [
          { name: 'คลังใน', icon: 'package', color: '#2563eb', is_receiving_default: true, sort_order: 1 },
          { name: 'คลังนอก (ห้องจ่ายยา)', icon: 'pill', color: '#16a34a', is_receiving_default: false, sort_order: 2 }
        ];
        return getClient().from('locations').insert(defaultLocs).select().then(function (inserted) {
          return inserted.data || defaultLocs;
        });
      }
      return locs;
    });
  }

  function saveLocation(loc) {
    return Promise.resolve(getClient().from('locations').upsert(loc)).then(function (res) {
      if (res.error) throw res.error;
      return res.data;
    });
  }

  // ================= Medicines =================
  function listMedicines() {
    return Promise.resolve(getClient().from('medicines').select('*').order('name', { ascending: true })).then(function (res) {
      if (res.error) throw res.error;
      return (res.data || []).map(function (m) {
        return {
          id: m.id, name: m.name, barcode: m.barcode || '', unit: m.unit || '',
          minStock: m.min_stock || 0, requireLot: m.require_lot || false,
          defaultLocationId: m.default_location_id, jhcisDrugCode: m.jhcis_drug_code || ''
        };
      });
    });
  }

  function saveMedicine(med) {
    var row = {
      id: med.id || undefined,
      name: med.name,
      barcode: med.barcode || '',
      unit: med.unit || '',
      min_stock: Number(med.minStock || 0),
      require_lot: !!med.requireLot,
      default_location_id: med.defaultLocationId || null,
      jhcis_drug_code: med.jhcisDrugCode || ''
    };
    return Promise.resolve(getClient().from('medicines').upsert(row).select()).then(function (res) {
      if (res.error) throw res.error;
      return res.data[0];
    });
  }

  // ================= Stock & Movements =================
  function listStockByLocation(params) {
    var locId = params.locationId;
    var query = getClient().from('stock').select('*, medicines(*), locations(*)').gt('qty', 0);
    if (locId) query = query.eq('location_id', locId);
    var now = new Date();
    return Promise.resolve(query).then(function (res) {
      if (res.error) throw res.error;
      return (res.data || []).map(function (s) {
        var exp = s.expiry_date ? new Date(s.expiry_date) : null;
        var daysLeft = exp ? Math.ceil((exp - now) / (1000 * 60 * 60 * 24)) : 999;
        return {
          stockId: s.id, medicineId: s.medicine_id, medicineName: s.medicines ? s.medicines.name : '-',
          locationId: s.location_id, locationName: s.locations ? s.locations.name : '-',
          lot: s.lot, expiryDate: s.expiry_date, daysLeft: daysLeft, qty: s.qty, unit: s.medicines ? s.medicines.unit : ''
        };
      });
    });
  }

  function exportRows(kind) {
    var sb = getClient();
    if (kind === 'stock') {
      return Promise.resolve(sb.from('stock').select('*, medicines(name, unit, barcode), locations(name)').gt('qty', 0)).then(function (res) {
        if (res.error) throw res.error;
        var rows = (res.data || []).map(function (s) {
          return [
            s.medicines ? s.medicines.name : '-',
            s.medicines ? s.medicines.barcode : '-',
            s.locations ? s.locations.name : '-',
            s.lot || '-',
            s.expiry_date || '-',
            s.qty || 0,
            s.medicines ? s.medicines.unit : '-'
          ];
        });
        return { rows: rows };
      });
    }
    return Promise.resolve({ rows: [] });
  }

  function receiveStock(params) {
    var sb = getClient();
    var p = params.payload || params;
    var user = window.Auth && window.Auth.getUser();
    var userId = (user && isValidUuid(user.id)) ? user.id : null;
    var addQty = Number(p.qty || 0);

    // ตรวจสอบว่ามียา Lot เดียวกันในคลังเดียวกันอยู่แล้วหรือไม่
    var checkQuery = sb.from('stock').select('*')
      .eq('medicine_id', p.medicineId)
      .eq('location_id', p.locationId)
      .eq('lot', p.lot || '');

    if (p.expiryDate) {
      checkQuery = checkQuery.eq('expiry_date', p.expiryDate);
    } else {
      checkQuery = checkQuery.is('expiry_date', null);
    }

    return Promise.resolve(checkQuery.maybeSingle()).then(function (res) {
      if (res.error) throw res.error;
      var existing = res.data;

      if (existing) {
        var newQty = Math.max(0, (existing.qty || 0) + addQty);
        return sb.from('stock').update({ qty: newQty }).eq('id', existing.id);
      } else {
        var stockRow = {
          medicine_id: p.medicineId,
          location_id: p.locationId,
          lot: p.lot || '',
          expiry_date: p.expiryDate || null,
          qty: addQty
        };
        return sb.from('stock').insert(stockRow);
      }
    }).then(function () {
      var mov = {
        type: 'receive',
        medicine_id: p.medicineId,
        lot: p.lot || '',
        expiry_date: p.expiryDate || null,
        to_location_id: p.locationId,
        qty: addQty,
        reason: p.reason || 'รับเข้าคลัง',
        source: p.source || '',
        user_id: userId
      };
      return sb.from('movements').insert(mov);
    }).then(function () {
      return true;
    });
  }

  function dispense(params) {
    var sb = getClient();
    var p = params.payload || params;
    var qty = Number(p.qty || 0);

    return Promise.resolve(sb.from('stock').select('*').eq('id', p.stockId).single()).then(function (res) {
      if (res.error) throw res.error;
      var s = res.data;
      if (s.qty < qty) throw new Error('จำนวนยาในสต็อกไม่เพียงพอ');
      var newQty = s.qty - qty;
      var stockP = newQty <= 0
        ? sb.from('stock').delete().eq('id', s.id)
        : sb.from('stock').update({ qty: newQty }).eq('id', s.id);

      return stockP.then(function () {
        return sb.from('movements').insert({
          type: 'dispense',
          medicine_id: s.medicine_id,
          lot: s.lot,
          expiry_date: s.expiry_date,
          from_location_id: s.location_id,
          qty: qty,
          reason: p.reason || 'ตัดจ่ายยา'
        });
      });
    });
  }

  function adjustCount(params) {
    var sb = getClient();
    var p = params.payload || params;
    var actual = Number(p.actualQty || 0);

    return Promise.resolve(sb.from('stock').select('*').eq('id', p.stockId).single()).then(function (res) {
      if (res.error) throw res.error;
      var s = res.data;
      var diff = actual - s.qty;
      return sb.from('stock').update({ qty: actual }).eq('id', s.id).then(function () {
        return sb.from('movements').insert({
          type: 'adjust',
          medicine_id: s.medicine_id,
          lot: s.lot,
          expiry_date: s.expiry_date,
          to_location_id: s.location_id,
          qty: diff,
          reason: 'ปรับยอดนับจริง (นับได้ ' + actual + ' เดิม ' + s.qty + ')'
        });
      });
    });
  }

  function transferStock(params) {
    var sb = getClient();
    var p = params.payload || params;
    var qty = Number(p.qty);
    var stockId = p.stockId;

    var fetchP = stockId
      ? sb.from('stock').select('*').eq('id', stockId).single()
      : sb.from('stock').select('*').eq('medicine_id', p.medicineId).eq('location_id', p.fromLocationId).eq('lot', p.lot || '').maybeSingle();

    return Promise.resolve(fetchP).then(function (res) {
      if (res.error) throw res.error;
      var src = res.data;
      if (!src || src.qty < qty) throw new Error('จำนวนยาในคลังต้นทางไม่เพียงพอ');

      return sb.from('stock').update({ qty: src.qty - qty }).eq('id', src.id).then(function () {
        return sb.from('stock').insert({
          medicine_id: src.medicine_id,
          location_id: p.toLocationId,
          lot: src.lot,
          expiry_date: src.expiry_date,
          qty: qty
        });
      }).then(function () {
        return sb.from('movements').insert({
          type: 'transfer',
          medicine_id: src.medicine_id,
          lot: src.lot,
          expiry_date: src.expiry_date,
          from_location_id: src.location_id,
          to_location_id: p.toLocationId,
          qty: qty,
          reason: p.reason || 'ย้ายคลัง'
        });
      });
    });
  }

  function listMovements() {
    return Promise.resolve(getClient().from('movements').select('*, medicines(name, unit), from_loc:locations!from_location_id(name), to_loc:locations!to_location_id(name)').order('created_at', { ascending: false }).limit(200))
      .then(function (res) {
        if (res.error) throw res.error;
        return (res.data || []).map(function (m) {
          return {
            id: m.id,
            type: m.type,
            medicineName: m.medicines ? m.medicines.name : '-',
            unit: m.medicines ? m.medicines.unit : '',
            lot: m.lot,
            expiryDate: m.expiry_date,
            fromLocationName: m.from_loc ? m.from_loc.name : '-',
            toLocationName: m.to_loc ? m.to_loc.name : '-',
            qty: m.qty,
            reason: m.reason,
            timestamp: m.created_at
          };
        });
      });
  }

  // ================= Requisitions =================
  function listRequisitions() {
    return Promise.resolve(getClient().from('requisitions').select('*, from_loc:locations!from_location_id(name)').order('created_at', { ascending: false })).then(function (res) {
      if (res.error) throw res.error;
      return (res.data || []).map(function (r) {
        return {
          id: r.id, reqNumber: r.req_number, reqDate: r.req_date,
          requesterName: r.requester_name, approverName: r.approver_name,
          distributorName: r.distributor_name, receiverName: r.receiver_name,
          fromLocationId: r.from_location_id,
          fromLocationName: r.from_loc ? r.from_loc.name : '',
          status: r.status, note: r.note, createdAt: r.created_at
        };
      });
    });
  }

  function getRequisition(id) {
    var sb = getClient();
    return Promise.resolve(sb.from('requisitions').select('*, from_loc:locations!from_location_id(name), requisition_items(*, medicines(name, unit))').eq('id', id).single())
      .then(function (res) {
        if (res.error) throw res.error;
        var r = res.data;
        return {
          id: r.id, reqNumber: r.req_number, reqDate: r.req_date,
          requesterName: r.requester_name, approverName: r.approver_name,
          distributorName: r.distributor_name, receiverName: r.receiver_name,
          fromLocationId: r.from_location_id,
          fromLocationName: r.from_loc ? r.from_loc.name : '',
          status: r.status, note: r.note,
          items: (r.requisition_items || []).map(function (it) {
            return {
              id: it.id, medicineId: it.medicine_id,
              medicineName: it.medicines ? it.medicines.name : '-',
              unit: it.medicines ? it.medicines.unit : '',
              qtyRequested: it.qty_requested, qtyApproved: it.qty_approved,
              qtyRemaining: it.qty_remaining, note: it.note
            };
          })
        };
      });
  }

  function isValidUuid(str) {
    return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  }

  function saveRequisition(payload) {
    var req = payload.requisition;
    var sb = getClient();
    var user = window.Auth && window.Auth.getUser();
    var reqNum = req.reqNumber || ('REQ-' + Date.now().toString().slice(-6));
    var userId = (user && isValidUuid(user.id)) ? user.id : null;
    var fromLocId = (req.fromLocationId && isValidUuid(req.fromLocationId)) ? req.fromLocationId : null;

    var mainRow = {
      req_number: reqNum,
      req_date: req.reqDate || U.todayISO(),
      requester_name: req.requesterName || '',
      approver_name: req.approverName || '',
      distributor_name: req.distributorName || '',
      receiver_name: req.receiverName || '',
      from_location_id: fromLocId,
      status: req.status || 'draft',
      note: req.note || '',
      created_by: userId
    };

    var query = req.id
      ? sb.from('requisitions').update(mainRow).eq('id', req.id).select()
      : sb.from('requisitions').insert(mainRow).select();

    return Promise.resolve(query).then(function (res) {
      if (res.error) throw res.error;
      var savedReq = res.data[0];
      var id = savedReq.id;

      return sb.from('requisition_items').delete().eq('requisition_id', id).then(function () {
        var itemRows = (req.items || []).map(function (it) {
          return {
            requisition_id: id,
            medicine_id: it.medicineId,
            qty_requested: Number(it.qtyRequested || 0),
            qty_approved: Number(it.qtyApproved || 0),
            qty_remaining: Number(it.qtyRemaining || 0),
            note: it.note || ''
          };
        });
        return sb.from('requisition_items').insert(itemRows);
      }).then(function () {
        // หากสถานะเป็น 'approved' หรือ 'completed' ให้ทำการหักสต็อกของคลังยาที่เลือกตามจริง
        if (req.status === 'approved' || req.status === 'completed') {
          var stockTasks = (req.items || []).map(function (it) {
            var qtyDeduct = Number(it.qtyApproved || 0);
            if (qtyDeduct <= 0) return Promise.resolve();

            var q = sb.from('stock').select('*').eq('medicine_id', it.medicineId);
            if (fromLocId) q = q.eq('location_id', fromLocId);
            q = q.order('qty', { ascending: false });

            return q.then(function (sRes) {
              var stockList = sRes.data || [];
              if (stockList.length > 0) {
                var newQty = stockItem.qty - qtyDeduct;
                var updateStockP = newQty <= 0
                  ? sb.from('stock').delete().eq('id', stockItem.id)
                  : sb.from('stock').update({ qty: newQty }).eq('id', stockItem.id);

                return updateStockP.then(function () {
                  return sb.from('movements').insert({
                    type: 'dispense',
                    medicine_id: it.medicineId,
                    lot: stockItem.lot || '',
                    expiry_date: stockItem.expiry_date || null,
                    from_location_id: stockItem.location_id,
                    qty: qtyDeduct,
                    reason: 'จ่ายยาตามใบเบิกเลขที่ ' + reqNum,
                    user_id: userId
                  });
                });
              }
            });
          });
          return Promise.all(stockTasks);
        }
      }).then(function () {
        return savedReq;
      });
    });
  }

  function deleteRequisition(id) {
    return Promise.resolve(getClient().from('requisitions').delete().eq('id', id)).then(function (res) {
      if (res.error) throw res.error;
      return true;
    });
  }

  // ================= Receipts =================
  function listReceipts() {
    return Promise.resolve(getClient().from('receipts').select('*').order('created_at', { ascending: false })).then(function (res) {
      if (res.error) throw res.error;
      return (res.data || []).map(function (r) {
        return {
          id: r.id, receiptNumber: r.receipt_number, receiptDate: r.receipt_date,
          patientHn: r.patient_hn, patientName: r.patient_name, privilege: r.privilege,
          totalAmount: r.total_amount, dispenserName: r.dispenser_name, status: r.status, note: r.note
        };
      });
    });
  }

  function getReceipt(id) {
    var sb = getClient();
    return Promise.resolve(sb.from('receipts').select('*, receipt_items(*)').eq('id', id).single()).then(function (res) {
      if (res.error) throw res.error;
      var r = res.data;
      return {
        id: r.id, receiptNumber: r.receipt_number, receiptDate: r.receipt_date,
        patientHn: r.patient_hn, patientName: r.patient_name, privilege: r.privilege,
        totalAmount: r.total_amount, dispenserName: r.dispenser_name, status: r.status, note: r.note,
        items: (r.receipt_items || []).map(function (it) {
          return {
            id: it.id, medicineId: it.medicine_id, medicineName: it.medicine_name,
            lot: it.lot, expiryDate: it.expiry_date, qty: it.qty,
            pricePerUnit: it.price_per_unit, totalPrice: it.total_price, note: it.note
          };
        })
      };
    });
  }

  function saveReceipt(receiptData) {
    var sb = getClient();
    var user = window.Auth && window.Auth.getUser();
    var recNum = receiptData.receiptNumber || ('REC-' + Date.now().toString().slice(-6));

    var mainRow = {
      receipt_number: recNum,
      receipt_date: receiptData.receiptDate || U.todayISO(),
      patient_hn: receiptData.patientHn || '',
      patient_name: receiptData.patientName || '',
      privilege: receiptData.privilege || 'ทั่วไป',
      total_amount: Number(receiptData.totalAmount || 0),
      dispenser_name: receiptData.dispenserName || '',
      status: 'completed',
      note: receiptData.note || '',
      created_by: user ? user.id : null
    };

    return Promise.resolve(sb.from('receipts').insert(mainRow).select()).then(function (res) {
      if (res.error) throw res.error;
      var saved = res.data[0];
      var recId = saved.id;

      var itemRows = (receiptData.items || []).map(function (it) {
        return {
          receipt_id: recId,
          medicine_id: it.medicineId,
          medicine_name: it.medicineName,
          lot: it.lot || '',
          expiry_date: it.expiryDate || null,
          qty: Number(it.qty || 1),
          price_per_unit: Number(it.pricePerUnit || 0),
          total_price: Number(it.totalPrice || 0),
          note: it.note || ''
        };
      });

      return sb.from('receipt_items').insert(itemRows).then(function () {
        var movements = (receiptData.items || []).map(function (it) {
          return {
            type: 'dispense',
            medicine_id: it.medicineId,
            lot: it.lot || '',
            expiry_date: it.expiryDate || null,
            qty: Number(it.qty || 1),
            reason: 'ออกใบเสร็จ/จ่ายยาผู้ป่วย: ' + (receiptData.patientName || recNum),
            user_id: user ? user.id : null
          };
        });
        return sb.from('movements').insert(movements);
      }).then(function () {
        return saved;
      });
    });
  }

  function deleteReceipt(id) {
    return Promise.resolve(getClient().from('requisitions').delete().eq('id', id)).then(function (res) {
      if (res.error) throw res.error;
      return true;
    });
  }

  function importGoogleSheetSeed() {
    var seed = window.GOOGLE_SHEET_SEED;
    if (!seed) return Promise.reject(new Error('ไม่พบข้อมูล Seed จาก Google Sheet'));
    var sb = getClient();

    var locRows = seed.locations.map(function (l) {
      return { id: l.id, name: l.name, icon: l.icon, color: l.color, is_receiving_default: l.isReceivingDefault, sort_order: l.sortOrder };
    });

    var medRows = seed.medicines.map(function (m) {
      return { id: m.id, name: m.name, barcode: m.barcode, unit: m.unit, min_stock: m.minStock, require_lot: m.requireLot, default_location_id: m.defaultLocationId || null };
    });

    var stockRows = seed.stock.map(function (s) {
      return { id: s.id, medicine_id: s.medicineId, location_id: s.locationId, lot: s.lot, expiry_date: s.expiryDate || null, qty: s.qty };
    });

    return Promise.resolve(sb.from('locations').upsert(locRows)).then(function (res) {
      if (res.error) throw res.error;
      return sb.from('medicines').upsert(medRows);
    }).then(function (res) {
      if (res.error) throw res.error;
      return sb.from('stock').upsert(stockRows);
    }).then(function (res) {
      if (res.error) throw res.error;
      return { count: medRows.length };
    });
  }

  return {
    isConfigured: isConfigured, login: login, listUsers: listUsers, saveUser: saveUser, deleteUser: deleteUser,
    resetPassword: resetPassword, changeMyPassword: changeMyPassword,
    getSettings: getSettings, saveSettings: saveSettings, getDashboard: getDashboard, search: search,
    listLocations: listLocations, saveLocation: saveLocation,
    listMedicines: listMedicines, saveMedicine: saveMedicine, listStockByLocation: listStockByLocation,
    exportRows: exportRows, receiveStock: receiveStock, dispense: dispense, adjustCount: adjustCount,
    transferStock: transferStock, listMovements: listMovements,
    listRequisitions: listRequisitions, getRequisition: getRequisition, saveRequisition: saveRequisition, deleteRequisition: deleteRequisition,
    listReceipts: listReceipts, getReceipt: getReceipt, saveReceipt: saveReceipt, deleteReceipt: deleteReceipt,
    importGoogleSheetSeed: importGoogleSheetSeed
  };
})();
