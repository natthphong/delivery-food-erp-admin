INSERT INTO public.tbl_mock_key_value (key, value) VALUES
('dashboard:all:sales', '{"total":1250000.25,"byCompany":[{"companyId":1,"name":"FoodieGo Co","sales":512300.1},{"companyId":2,"name":"Baan Eats","sales":738700.15}]}'),
('dashboard:company:1:sales', '{"companyId":1,"name":"FoodieGo Co","byBranch":[{"branchId":1,"name":"Siam","sales":210000.55},{"branchId":2,"name":"Phra Khanong","sales":145500.00}]}'),
('dashboard:branch:1:revenueByProduct', '{"branchId":1,"items":[{"productId":1,"name":"ข้าวกะเพราไก่","revenue":120000.5},{"productId":3,"name":"ก๋วยเตี๋ยวเรือ","revenue":90000.0}]}'),
('dashboard:liveTxns', '{"items":[
{"id":101,"ts":"2025-09-28T14:09:14+07:00","scope":"ALL","amount":250.50,"companyId":1,"branchId":1},
{"id":102,"ts":"2025-09-28T14:09:18+07:00","scope":"COMPANY","companyId":1,"amount":180.00}
]}'),
('orders:list', '{"orders":[
{"id":13,"status":"PENDING","displayStatus":"PENDING","created_at":"2025-09-28T14:09:14.460+07:00","updated_at":"2025-09-28T14:09:14.460+07:00",
"order_details":{"userId":18,"branchId":"1","branchName":"FoodieGo - Siam","productList":[{"qty":1,"price":0.01,"productId":"2","productName":"ข้าวกะเพราหมูกรอบ","productAddOns":[]}],
"delivery":{"lat":13.686919076251383,"lng":100.43522679378886,"distanceKm":12.472}},
"branch":{"id":1,"name":"FoodieGo - Siam","address":"Siam, Bangkok","lat":13.745,"lng":100.534},
"txn":{"id":39,"status":"accepted","expired_at":null,"isExpired":false}
}
]}'),
('branch:2:detail', '{
"branch":{"id":2,"company_id":1,"name":"FoodieGo - Ari","description":"สาขาอารีย์",
"image_url":"https://example.com/product5.png","address_line":"Ari, Bangkok",
"lat":13.781,"lng":100.546,
"open_hours":{"fri":[["10:00","23:59"]],"mon":[["10:00","19:00"]],"sat":[["10:00","20:00"]],"sun":[["10:00","23:59"]],
"thu":[["10:00","19:00"]],"tue":[["10:00","19:00"]],"wed":[["10:00","19:00"]]},
"is_force_closed":false},
"menu":[
{"product_id":1,"name":"ข้าวกะเพราไก่","description":"กะเพราไก่ไข่ดาว",
"image_url":"https://example.com/product5.png","price":"0.01","is_enabled":true,"stock_qty":null,
"add_ons":[{"id":1,"name":"ไข่ดาว","price":10,"is_required":false,"group_name":"ท็อปปิ้ง"},
{"id":2,"name":"ไข่เจียว","price":12,"is_required":false,"group_name":"ท็อปปิ้ง"}]},
{"product_id":3,"name":"ก๋วยเตี๋ยวเรือ","description":"น้ำซุปเข้มข้น",
"image_url":"https://example.com/product5.png","price":"0.01","is_enabled":true,"stock_qty":null,"add_ons":[]}
],
"page":1,"size":20,"total":2
}');
