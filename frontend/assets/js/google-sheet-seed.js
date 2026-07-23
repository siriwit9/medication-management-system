/**
 * Google Sheet Seed Data (140 รายการยา + 4 สถานที่ + สต็อก)
 * ดึงจาก: https://docs.google.com/spreadsheets/d/1EA-P2lljL48o4PyphqE4zZw8931JO7qlcXBZPLTV_2k
 */
window.GOOGLE_SHEET_SEED = {
  sheetId: '1EA-P2lljL48o4PyphqE4zZw8931JO7qlcXBZPLTV_2k',
  locations: [
  {
    "id": "6bec17e9-3c7c-4001-84d9-9151266e9595",
    "name": "คลังใน",
    "icon": "snowflake",
    "color": "#2563eb",
    "isReceivingDefault": true,
    "sortOrder": 1
  },
  {
    "id": "ef5f08ba-1a6d-49fc-93ee-5b00a3740987",
    "name": "คลังนอก (ห้องจ่ายยา)",
    "icon": "pill",
    "color": "#16a34a",
    "isReceivingDefault": false,
    "sortOrder": 2
  },
  {
    "id": "a35f027e-cd22-4466-8fa6-4c9fc33ba798",
    "name": "ห้องฉุกเฉิน",
    "icon": "cross",
    "color": "#dc2626",
    "isReceivingDefault": false,
    "sortOrder": 3
  },
  {
    "id": "e94938c6-4f75-4bd3-8c6f-597491cb1c37",
    "name": "ห้อง EPI",
    "icon": "syringe",
    "color": "#7c3aed",
    "isReceivingDefault": false,
    "sortOrder": 4
  }
],
  medicines: [
  {
    "id": "3242deaf-2048-4bff-866f-4abc0681abee",
    "name": "ฟ้าทะลายโจร แคปซูล cap 500 mg",
    "barcode": "8858694901859",
    "unit": "แคปซูล",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "fd4bcea3-9def-4f41-9e81-219f6e1cc5b7",
    "name": "ยาระบายมะขามแขก 450 mg",
    "barcode": "8858694900210",
    "unit": "แคปซูล",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "9975324e-049a-4e9a-a58f-f5f36af2d736",
    "name": "เพชรสังฆาต KMP 500 mg",
    "barcode": "8858694900227",
    "unit": "แคปซูล",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "96fb0c3c-2795-4a6b-87b9-21d330614fb3",
    "name": "รางจืด ยาชง ธงทอง",
    "barcode": "8857102880199",
    "unit": "ซอง",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "7da16f4d-59df-4a7f-b2dc-7de628de829f",
    "name": "ขมิ้นชันแคปซูล KMP (500mg/capsule)",
    "barcode": "8858694900081",
    "unit": "แคปซูล",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "e2843223-c301-4bc0-89fa-11a4275ae9e2",
    "name": "ยาอมประสะมะแว้ง",
    "barcode": "8858694900432",
    "unit": "ซอง",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "84ea75a9-92ba-4eb4-9b37-de2dce6f71b6",
    "name": "ยาแก้ไอมะขามป้อม syr 120 ซีซี",
    "barcode": "8858694902009",
    "unit": "ขวด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "43f4fc65-6a91-49ea-a2b4-7dc4fe258fb9",
    "name": "ครีมไพล KMP (cre)",
    "barcode": "8858694900500",
    "unit": "หลอด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "0af8581d-ff48-4702-abc0-f15aee30ef6f",
    "name": "เถาวัลย์เปรียง 500 mg ตราธงทอง",
    "barcode": "",
    "unit": "แคปซูล",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "3aab3d2d-b97d-43fc-9c4f-a32337895a0c",
    "name": "ยาธาตุผสมอบเชย ตราธงทอง",
    "barcode": "",
    "unit": "ขวด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "2293d8a4-9fc5-4054-a165-681e175e5429",
    "name": "สหัสธารา 500 mg (cap)",
    "barcode": "8858694901040",
    "unit": "แคปซูล",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "ce8874e8-5900-4887-a1fa-8bb37d07ddd3",
    "name": "Adrenaline inj 1mg. in 1ml",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "a35f027e-cd22-4466-8fa6-4c9fc33ba798"
  },
  {
    "id": "748e720f-c2d5-4b70-8b17-f30dcc4a8c04",
    "name": "Alcohol 70% 450 ml",
    "barcode": "",
    "unit": "ขวด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "eeb38518-136c-4e64-af2d-941d473ac82d",
    "name": "Allopurinol tab 100 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "7c6ae7ea-9db2-4205-91e2-451cd92f5c34",
    "name": "Amitriptyline 10 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "52d2684c-02e0-468f-b70f-2b638b950de0",
    "name": "Amlodipine 5 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "ec4c6385-7137-4527-8065-63139dc003e9",
    "name": "Ammonia sol 60 ml",
    "barcode": "",
    "unit": "ขวด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "a35f027e-cd22-4466-8fa6-4c9fc33ba798"
  },
  {
    "id": "0898f333-1459-4e71-b943-fab99692c98d",
    "name": "Amoxicillin 500 mg",
    "barcode": "",
    "unit": "แคปซูล",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "a4b9ebc4-8ceb-4b7d-ab31-903d8608b311",
    "name": "Amoxicillin syr 250 mg/5 ml",
    "barcode": "",
    "unit": "ขวด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "80adb2b6-6ec3-4aa8-b3ef-af004c86ccba",
    "name": "Antacid susp",
    "barcode": "",
    "unit": "ขวด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "90f19e1c-c1c6-4a93-a4f5-3224b4a6a0bd",
    "name": "Aspirin 81 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "b550e39b-8fb1-4313-bbb5-2da896a6bee4",
    "name": "Atenolol 50 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "d7fb3f55-39b4-4792-b786-e59ca0de5df0",
    "name": "Atorvastatin tab 40 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "1ba15ed2-e699-4575-958d-cab870953bd5",
    "name": "Atropine s04 inj 0.6 mg in 1 ml",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "c1798aff-8bc7-4cfd-953b-b250006f0a29",
    "name": "Benzyl benzoate Emulsion 25%",
    "barcode": "",
    "unit": "ขวด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "173fb444-43f2-419b-87bb-03ea26be5d0e",
    "name": "Betahistine mesylate 12 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "67005300-9847-4f14-8e40-fecc1d6442b1",
    "name": "Betamethasone cream 0.1%",
    "barcode": "",
    "unit": "หลอด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "03cd686a-f5a6-4511-a337-123d38c4e8a0",
    "name": "Calamine lotion",
    "barcode": "",
    "unit": "ขวด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "41532a82-62ac-41b5-8187-f90a9135a277",
    "name": "Calcium carbonate 1000 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "c2b72c71-57ee-45bd-b4f7-9682ef84121f",
    "name": "Calcium gluconate inj1g/10ml",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "877f962b-a3a2-4950-bfc5-575b7d1944ba",
    "name": "Carfergot",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "fb1d8a9e-c2b6-47b0-b6a1-4550a5db990a",
    "name": "Carvedilol tab 6.25 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "722665b0-b683-4710-bb8f-4aa452326e34",
    "name": "Cetririzine",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "efe16460-c825-447c-ba4f-ae9fea79056c",
    "name": "Chloramphenicol eye ointment",
    "barcode": "",
    "unit": "หลอด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "1eb5131a-9b47-403b-a407-822196ae0080",
    "name": "Chlorhexidine scrub sol 4%in450cc",
    "barcode": "",
    "unit": "ขวด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "b1d57f25-3581-43cb-a494-00acb581b22b",
    "name": "Chlorpheniramine inj10mg/1ml",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "a35f027e-cd22-4466-8fa6-4c9fc33ba798"
  },
  {
    "id": "f37e375a-3552-4613-bde5-fd1b62cbe78b",
    "name": "Chlorpheniramine syrup 2mg/5ml",
    "barcode": "",
    "unit": "ขวด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "235bf7a3-5f8f-4c03-bfab-27c9c0233546",
    "name": "Chlorpheniramine tab 4 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "81f9ebba-a982-4382-ae76-d194eab1cb3b",
    "name": "Clopidogrel tab 75 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "cd9a6603-e13f-4421-8e9c-1d8490abe7c5",
    "name": "Clotrimazole 0.1% 5g",
    "barcode": "",
    "unit": "หลอด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "825aea29-f0fd-4d5f-8646-3bb88e62e99c",
    "name": "Clotrimazole vaginal tab",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "ba631706-11da-4b6c-86d6-e1a70e1f8e7d",
    "name": "Cyproheptadine hcl tab 4 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "d33ae017-5646-43ba-9c22-3341b1fe7dcb",
    "name": "Dexamethasone inj 4 mg in 1ml",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "bac5d5b2-bef7-4be7-99e8-a795a042612b",
    "name": "Dextromethophan HBr 15 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "fffda37f-f57c-4739-8a06-536b271c76d2",
    "name": "Diclofenac 25 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "d0811bcb-19c9-4664-8f1a-74ab826674c3",
    "name": "Dicloxacillin 250 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "521e9181-2503-4c76-bb19-b3bb94afe9cf",
    "name": "Dicloxacillin dry syrup 62.5mg/ml",
    "barcode": "",
    "unit": "ขวด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "01fc9d45-9968-4569-8377-f46f2c7eb65d",
    "name": "Dimenhydrinate 50 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "b6c34905-2614-40f9-b464-85564f373f50",
    "name": "Domperidone 10 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "4fe07a51-2768-42e0-96cd-e386b6c88bc2",
    "name": "Domperidone syrup 1 mg/ml",
    "barcode": "",
    "unit": "หลอด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "d654c19c-6721-469d-9d79-5552b40ec613",
    "name": "Doxazosin tab 2 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "2c986e43-e1e5-4fd0-98d0-d8d672aabf62",
    "name": "Enalapril 20mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "4f6f5f2d-f4f2-4f32-95d2-5e76a47bd50f",
    "name": "Enalapril 5 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "9ccd1bf2-2a3f-4d65-90bd-6a274773b03b",
    "name": "Ferrous fumarate 45 mg/0.6ml.sus 15 ml",
    "barcode": "",
    "unit": "ขวด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "2f1699a4-c650-4078-b94a-257777c7daf6",
    "name": "Ferrous fumarate tab 200 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "5bc23062-70c3-43e0-b006-86a7596df3f5",
    "name": "Folic acid 5 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "b84d4db1-1349-498f-b8ac-c5b89f74deb7",
    "name": "Furosemide 40 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "80a71a72-b27f-4d30-b8a6-dd0041e0c81a",
    "name": "Furosemide inj.40mg/ml",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "dd4191c4-ca55-44f7-8c44-5ae210857577",
    "name": "Gabapentin tab 300 mg",
    "barcode": "",
    "unit": "แคปซูล",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "ab848854-7012-4783-8f0a-cbbb2c77fc98",
    "name": "Gemfibrozil 600 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "af54c85e-e2d8-498f-b19b-1e2e1375eccf",
    "name": "Glipizide 5 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "7e23382d-8e1c-4888-a91a-fe582ef53766",
    "name": "Glucose injection 50% in 50cc",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "a35f027e-cd22-4466-8fa6-4c9fc33ba798"
  },
  {
    "id": "ea354509-3869-465a-9f93-971e83a70b30",
    "name": "Glyceryl guaiacolate tab 100 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "8425447f-a96e-45a3-b3db-77a2f8fb46df",
    "name": "Guaifenesin syrup 100 mg/5mg",
    "barcode": "",
    "unit": "ขวด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "493f9e79-6b32-44fe-b9ee-a4335191cf85",
    "name": "Hista Oph Eye Drops",
    "barcode": "",
    "unit": "ขวด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "20bccd0f-23ed-4ec7-bc02-efc6a7fb4bbc",
    "name": "Humulin 70/30 300 unit",
    "barcode": "",
    "unit": "หลอด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "6c750f37-e1ee-4d8f-867e-d371e6f9263a",
    "name": "Hydralazine HCL 25 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "5230301a-d4f1-4a52-9ff5-6efb535315d0",
    "name": "Hydrochlorothiazide 25 mg(hctz)",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "bc614635-6c47-4ca9-9ef9-c5004f6bfa7d",
    "name": "Hydroxyzine 10 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "416f8d9f-ce54-47d8-bcaf-daaff665f947",
    "name": "Hyoscine (buscopan) tab 10mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "a88fcbe7-7277-4cd8-8545-ca88af94bac7",
    "name": "Hyoscin n butyl bromid syrup",
    "barcode": "",
    "unit": "ขวด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "4161d8f9-c65c-4d5a-b3ac-20f56f3e0666",
    "name": "Ibuprofen 200 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "868fe399-23be-4a06-9fe6-643c3f6dcce0",
    "name": "Ibuprofen 400 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "e21c5577-4ff9-48eb-b610-74d6c2f9fd52",
    "name": "Isosorbide dinitrate 10 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "afcfe3a9-6296-48c9-a388-339d92dbeba7",
    "name": "Isosorbide dinitrate sublingual 5mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "6efecac2-9f98-4fcd-9391-196b5fbc1489",
    "name": "Lactate Ringer inf 1000ml",
    "barcode": "",
    "unit": "ขวด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "930279f8-ccc0-40e6-a81b-589552db6d7e",
    "name": "Lidocaine inj 2% in 20ml",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "680c0343-4c69-436e-9eec-1c11a7ea1de7",
    "name": "Lorazepam 0.5 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "2b301f26-6ef1-4830-8898-c6e6293f3617",
    "name": "Losartan 50 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "2b5902c6-96b0-4f03-95ec-b603c772e56d",
    "name": "M.carminative",
    "barcode": "",
    "unit": "ขวด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "26c79994-cfd8-4340-bf47-eae3fcd732e0",
    "name": "M.Tussis mix 60 ml",
    "barcode": "",
    "unit": "ขวด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "6779f23e-343a-462b-96ad-24fed7a0c3fa",
    "name": "Manidipine tab 20 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "ebbfa807-319c-4065-ac98-2917ba11651a",
    "name": "Metformin 500 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "ee291eb8-f033-4825-94d7-8156648d2093",
    "name": "Methyl salicylate Cream(Balm)",
    "barcode": "",
    "unit": "หลอด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "1b4bac57-09e6-40ce-893d-5dde426f918f",
    "name": "Metronidazole 200 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "8f8a24e6-7f1a-4c12-9ae7-51ceb1bedf4b",
    "name": "Milk of Magnesia",
    "barcode": "",
    "unit": "ขวด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "e88d048f-5aa9-417b-acc2-a1954d08a485",
    "name": "Norfloxacin tab 200 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "d3f5bc4f-4396-4fbe-a387-fd04627ccf88",
    "name": "Norgesic 450+35 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "835b189a-7aa4-4c04-b661-5fd80d3a4172",
    "name": "NSS Irrigate",
    "barcode": "",
    "unit": "ขวด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "df11c6cb-3f96-4288-a480-e5266d5f4aaa",
    "name": "Omeprazole 20 mg",
    "barcode": "",
    "unit": "แคปซูล",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "c05d31b7-aa40-4a0a-ad73-f3fbf4c9468b",
    "name": "Ors sodium-75",
    "barcode": "",
    "unit": "ซอง",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "76df6333-a2dc-4928-addd-0d7b8b22c858",
    "name": "Paracetamol 325 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "8a4bf11e-6081-4ecf-bffc-0516a8f8d56c",
    "name": "Paracetamol 500 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "65206e6e-af81-441e-b9fd-e092c8058054",
    "name": "Paracetamol syrup120mg/5ml",
    "barcode": "",
    "unit": "ขวด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "feb0bd50-ec49-44ea-9ff6-fc3d7e394afe",
    "name": "Pioglitazone tab 30 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "aa454564-de75-4a05-83c8-5807c4629dd6",
    "name": "Povidine iodine slo 15cc",
    "barcode": "",
    "unit": "ขวด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "ad7fd1dc-2bc2-4a8f-8341-009b243e788a",
    "name": "Povidine iodine slo 450cc",
    "barcode": "",
    "unit": "ขวด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "92ab3ebf-ff27-4578-b693-2b45da63ce1f",
    "name": "Salbutamol Inhaler 0.1mg/puff 200",
    "barcode": "",
    "unit": "หลอด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "c54b8d67-2f25-45e7-8e3a-9db445ddb9c4",
    "name": "Salbutamol tab 2 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "818da8a6-3156-4f8a-8805-29bfde897068",
    "name": "Paracetamol syrup120mg/5ml",
    "barcode": "",
    "unit": "ขวด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "8923e45c-7c0c-4e40-9f8b-5b40b604c107",
    "name": "Seretide Accuhaler inh 50/250 mcg",
    "barcode": "",
    "unit": "หลอด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "6a37b920-da1e-4c9b-8fda-ad2ad950b6a2",
    "name": "Silver sulfadiazine cream",
    "barcode": "",
    "unit": "หลอด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "8f1c16f7-9613-4f20-838a-a2d8a8f9d23b",
    "name": "Simethicone drops",
    "barcode": "",
    "unit": "ขวด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "bf1ab6af-3b12-4901-837c-c573004376f6",
    "name": "Simethicone tab 80 mg(air-x)",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "b0bb25c1-1245-453d-a946-ef3a06babebe",
    "name": "Simvastatin tab20 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "e54d66bc-985e-4828-8f1c-1e6e0299d234",
    "name": "Sterile water inf 1000cc",
    "barcode": "",
    "unit": "ขวด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "1841e40e-8bf4-4950-9392-dea72d661040",
    "name": "Theophylline SR tab 200 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "7a453696-21c9-48df-8259-49572ccd1eda",
    "name": "Triamcinolone cream 0.02%in5gm",
    "barcode": "",
    "unit": "หลอด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "9e68b358-4715-42c2-9f98-5444e29c1df3",
    "name": "Triamcinolone cream 0.1%in5gm",
    "barcode": "",
    "unit": "หลอด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "3bd09d01-f8d5-49d3-87c9-f267d27a3503",
    "name": "Triamcinolone lotion",
    "barcode": "",
    "unit": "ขวด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "1cd3c85a-47cd-49de-a173-c15a0f4520b2",
    "name": "Triamcinolone oral paste 0.1%",
    "barcode": "",
    "unit": "ซอง",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "c684d745-650c-4e24-8030-26c1dab7750d",
    "name": "Triferdine 150 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "6a967269-efa0-4dce-8db5-5ae20f9e2090",
    "name": "Vitamin B1 tab 100 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "a1ea4f09-0747-49d3-9b97-55fab69a86cf",
    "name": "Vitamin B complex",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "5b91ac4c-802e-4bc5-8fed-d71c4cc228b5",
    "name": "Vitamin C tab 50 mg",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "093685db-9901-4edf-ab15-2a4fb244f207",
    "name": "ยาฉีดคุมกำเนิด (อีนาฟ-150)",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "22c4e653-2f2e-4ab6-87a2-df306932bd22",
    "name": "ยาคุมกำเนิดชนิดฮอร์โมนต่ำ (อาร์เดน)",
    "barcode": "",
    "unit": "เม็ด",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "6bec17e9-3c7c-4001-84d9-9151266e9595"
  },
  {
    "id": "5aa49b42-b39d-45fc-a6c6-b0d36fe039ba",
    "name": "ดีทีพีตับอักเสบบีฮิบ1 (DTP-HB+Hib 1)",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "e94938c6-4f75-4bd3-8c6f-597491cb1c37"
  },
  {
    "id": "782cea20-226b-4d3e-896a-8802fe5b78ab",
    "name": "ดีทีพีตับอักเสบบีฮิบ2 (DTP-HB+Hib 2)",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "e94938c6-4f75-4bd3-8c6f-597491cb1c37"
  },
  {
    "id": "2fbb6cce-27cc-4d3d-9ff1-9f97ef804ced",
    "name": "ดีทีพีตับอักเสบบีฮิบ3 (DTP-HB+Hib 3)",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "e94938c6-4f75-4bd3-8c6f-597491cb1c37"
  },
  {
    "id": "3f574d1d-d97c-462c-8574-8c40deaabf64",
    "name": "ดีที(สร้างภูมิคุ้มกัน คอตีบ+บาดทะยัก)",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "e94938c6-4f75-4bd3-8c6f-597491cb1c37"
  },
  {
    "id": "de66fec7-eb9e-48e5-95d9-6f7db6176d79",
    "name": "DTP กระตุ้น 1",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "e94938c6-4f75-4bd3-8c6f-597491cb1c37"
  },
  {
    "id": "1e39cb8f-5222-4210-931f-426de971d963",
    "name": "DTP กระตุ้น 2",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "e94938c6-4f75-4bd3-8c6f-597491cb1c37"
  },
  {
    "id": "9452a080-47ab-4c05-b64a-e06bfc341335",
    "name": "ดีทีเอส 1 (DT นักเรียน(ป.1) ครั้งที่ 1)",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "e94938c6-4f75-4bd3-8c6f-597491cb1c37"
  },
  {
    "id": "e241020b-050a-4f90-9769-a61bf03d6774",
    "name": "ดีทีเอส 4 (DT นักเรียน(ป.6) ครั้งที่ 4)",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "e94938c6-4f75-4bd3-8c6f-597491cb1c37"
  },
  {
    "id": "bf0372d3-12bc-4c11-b8d4-db9ffdd426e2",
    "name": "ไข้หวัดใหญ่ 815",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "e94938c6-4f75-4bd3-8c6f-597491cb1c37"
  },
  {
    "id": "5b247a04-187d-47be-98e4-20d4c1cb03cb",
    "name": "HPV (GARDASIL9) เอชพีวี (การ์ดาซิล 9 สายพันธุ์)",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "e94938c6-4f75-4bd3-8c6f-597491cb1c37"
  },
  {
    "id": "e6293d92-ed38-4152-861f-431411bfc563",
    "name": "HPVs1(ฉีด) นร. หญิง ป. 5 ป้องกันมะเร็งปากมดลูก",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "e94938c6-4f75-4bd3-8c6f-597491cb1c37"
  },
  {
    "id": "18d27a8b-db75-4559-8a76-6c262bd5f79d",
    "name": "HPVs2(ฉีด) นร. หญิง ป. 5 ป้องกันมะเร็งปากมดลูก ห่างเข็มแรกอย่างน้อย 6 เดือน",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "e94938c6-4f75-4bd3-8c6f-597491cb1c37"
  },
  {
    "id": "0a599f4d-de22-4ec1-8515-b58bff23aa93",
    "name": "JE เชื้อเป็น 1(Lived attenuated 1)",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "e94938c6-4f75-4bd3-8c6f-597491cb1c37"
  },
  {
    "id": "d7a432b0-720f-48de-a250-a809e3ff54bb",
    "name": "JE เชื้อเป็น 2(Lived attenuated 2)",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "e94938c6-4f75-4bd3-8c6f-597491cb1c37"
  },
  {
    "id": "f9834845-b80f-4841-9d48-f9d05781a5b9",
    "name": "MMR (9 เดือน)",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "e94938c6-4f75-4bd3-8c6f-597491cb1c37"
  },
  {
    "id": "36652a21-3d3f-46af-adf7-4e8b6a692f86",
    "name": "หัด คางทูม หัดเยอรมัน อายุ 2 ปีครึ่ง",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "e94938c6-4f75-4bd3-8c6f-597491cb1c37"
  },
  {
    "id": "cb874a0e-4939-4258-a655-961cfba06e91",
    "name": "หัด หัดเยอรมัน(ฉีด) 9 เดือนขึ้นไป รณรงค์เพื่อเก็บตก",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "e94938c6-4f75-4bd3-8c6f-597491cb1c37"
  },
  {
    "id": "032b6dd8-4328-48a8-88fd-7a8451832f80",
    "name": "หัด หัดเยอรมัน(ฉีด) นักเรียน ป. 1 เฉพาะที่ยังรับไม่ครบ",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "e94938c6-4f75-4bd3-8c6f-597491cb1c37"
  },
  {
    "id": "83341e42-eed9-4828-ac1a-e2cce0ce9d35",
    "name": "โอพีวี1",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "e94938c6-4f75-4bd3-8c6f-597491cb1c37"
  },
  {
    "id": "c79e2616-8357-482d-ab78-e2e462ac7248",
    "name": "โอพีวี2",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "e94938c6-4f75-4bd3-8c6f-597491cb1c37"
  },
  {
    "id": "88f13189-8272-4bfc-841a-572dca61f2a4",
    "name": "โอพีวี3",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "e94938c6-4f75-4bd3-8c6f-597491cb1c37"
  },
  {
    "id": "fde75465-a9b3-48d7-bdb1-87d158c23422",
    "name": "โอพีวี กระตุ้น 1",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "e94938c6-4f75-4bd3-8c6f-597491cb1c37"
  },
  {
    "id": "d9ae104b-4ba3-4402-bd07-aad098dfec86",
    "name": "โอพีวี กระตุ้น 2",
    "barcode": "",
    "unit": "โดส",
    "minStock": 0,
    "requireLot": true,
    "defaultLocationId": "e94938c6-4f75-4bd3-8c6f-597491cb1c37"
  }
],
  stock: [
  {
    "id": "3b0f32eb-f778-4827-9e05-9d5e8a0df1bc",
    "medicineId": "bf0372d3-12bc-4c11-b8d4-db9ffdd426e2",
    "locationId": "e94938c6-4f75-4bd3-8c6f-597491cb1c37",
    "lot": "",
    "expiryDate": "2027-03-10",
    "qty": 27
  },
  {
    "id": "54f9f3af-3013-4435-ba81-5525e2be0f0a",
    "medicineId": "43f4fc65-6a91-49ea-a2b4-7dc4fe258fb9",
    "locationId": "ef5f08ba-1a6d-49fc-93ee-5b00a3740987",
    "lot": "496936",
    "expiryDate": "2029-02-24",
    "qty": 10
  }
]
};
