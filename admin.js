/* ================================================================
   PLAN B — پنل مدیریت
   ورود با ایمیل/رمز عبوری که در Firebase Authentication ساختی.
================================================================ */
const $  = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

let CATEGORIES = [];
let ITEMS = [];

/* ---------- ورود / خروج ---------- */
auth.onAuthStateChanged(user=>{
  $("#loginScreen").style.display = user ? "none" : "flex";
  $("#adminApp").style.display = user ? "block" : "none";
  if(user){
    loadSettings();
    loadCategories();
    loadItems();
  }
});
$("#loginForm").addEventListener("submit", e=>{
  e.preventDefault();
  const email = $("#loginEmail").value.trim();
  const pass = $("#loginPass").value;
  $("#loginError").textContent = "";
  auth.signInWithEmailAndPassword(email, pass).catch(err=>{
    $("#loginError").textContent = "ورود ناموفق: " + err.message;
  });
});
$("#logoutBtn").addEventListener("click", ()=> auth.signOut());

/* ---------- تب‌های پنل ---------- */
$$(".admin-tab").forEach(tab=>{
  tab.addEventListener("click", ()=>{
    $$(".admin-tab").forEach(t=>t.classList.remove("active"));
    tab.classList.add("active");
    $$(".admin-section").forEach(s=>s.classList.remove("active"));
    $("#sec-"+tab.dataset.sec).classList.add("active");
  });
});

/* ================================================================
   بخش تنظیمات کلی
================================================================ */
function loadSettings(){
  db.collection("settings").doc("main").get().then(doc=>{
    const s = doc.exists ? doc.data() : {};
    $("#f-cafeName").value = s.cafeName || "PLAN B";
    $("#f-tagline").value = s.tagline || "";
    $("#f-hoursNote").value = s.hoursNote || "";
    renderListEditor("heroImagesList", s.heroImages||[], "لینک عکس هیرو");
    renderHoursEditor(s.hours||[]);
    $("#f-aboutTitle").value = s.aboutTitle || "";
    $("#f-aboutIntro").value = s.aboutIntro || "";
    renderListEditor("aboutBodyList", s.aboutBody||[], "پاراگراف");
    renderValuesEditor(s.values||[]);
    $("#f-address").value = s.contact?.address || "";
    $("#f-phone").value = s.contact?.phone || "";
    $("#f-instagram").value = s.contact?.instagram || "";
    $("#f-whatsapp").value = s.contact?.whatsapp || "";
    $("#f-mapUrl").value = s.contact?.mapUrl || "";
  });
}

function renderListEditor(containerId, arr, placeholder){
  const c = $("#"+containerId);
  c.innerHTML = arr.map((v,i)=>`
    <div class="row-item">
      <input type="text" data-idx="${i}" value="${escAttr(v)}" placeholder="${placeholder}">
      <button type="button" class="del-row" data-idx="${i}">✕</button>
    </div>`).join("");
  c.querySelectorAll(".del-row").forEach(b=>b.addEventListener("click", ()=>{
    arr.splice(+b.dataset.idx,1); renderListEditor(containerId, arr, placeholder);
  }));
  c.dataset.raw = JSON.stringify(arr);
}
function collectListEditor(containerId){
  const c = $("#"+containerId);
  return [...c.querySelectorAll("input")].map(i=>i.value.trim()).filter(Boolean);
}
function addListRow(containerId, arr, placeholder){
  arr.push("");
  renderListEditor(containerId, arr, placeholder);
}
$("#addHeroImg").addEventListener("click", ()=>{
  const arr = collectListEditor("heroImagesList");
  addListRow("heroImagesList", arr, "لینک عکس هیرو");
});
$("#addAboutPara").addEventListener("click", ()=>{
  const arr = collectListEditor("aboutBodyList");
  addListRow("aboutBodyList", arr, "پاراگراف");
});

function renderHoursEditor(arr){
  const c = $("#hoursList");
  c.innerHTML = arr.map((h,i)=>`
    <div class="row-item two">
      <input type="text" value="${escAttr(h.days)}" placeholder="مثلا: شنبه تا چهارشنبه" data-f="days">
      <input type="text" value="${escAttr(h.time)}" placeholder="مثلا: ۹:۰۰ - ۲۳:۰۰" data-f="time">
      <button type="button" class="del-row" data-idx="${i}">✕</button>
    </div>`).join("");
  c.querySelectorAll(".del-row").forEach(b=>b.addEventListener("click", ()=>{
    arr.splice(+b.dataset.idx,1); renderHoursEditor(arr);
  }));
  c.dataset.raw = JSON.stringify(arr);
}
function collectHoursEditor(){
  const rows = $$("#hoursList .row-item");
  return [...rows].map(r=>({
    days: r.querySelector('[data-f="days"]').value.trim(),
    time: r.querySelector('[data-f="time"]').value.trim()
  })).filter(h=>h.days||h.time);
}
$("#addHoursRow").addEventListener("click", ()=>{
  const arr = collectHoursEditor(); arr.push({days:"",time:""}); renderHoursEditor(arr);
});

function renderValuesEditor(arr){
  const c = $("#valuesList");
  c.innerHTML = arr.map((v,i)=>`
    <div class="row-item two">
      <input type="text" value="${escAttr(v.icon)}" placeholder="ایموجی مثلا 🌵" data-f="icon" style="max-width:70px;">
      <input type="text" value="${escAttr(v.label)}" placeholder="عنوان کوتاه" data-f="label">
      <button type="button" class="del-row" data-idx="${i}">✕</button>
    </div>`).join("");
  c.querySelectorAll(".del-row").forEach(b=>b.addEventListener("click", ()=>{
    arr.splice(+b.dataset.idx,1); renderValuesEditor(arr);
  }));
}
function collectValuesEditor(){
  const rows = $$("#valuesList .row-item");
  return [...rows].map(r=>({
    icon: r.querySelector('[data-f="icon"]').value.trim(),
    label: r.querySelector('[data-f="label"]').value.trim()
  })).filter(v=>v.label);
}
$("#addValueRow").addEventListener("click", ()=>{
  const arr = collectValuesEditor(); arr.push({icon:"🌵",label:""}); renderValuesEditor(arr);
});

$("#settingsForm").addEventListener("submit", e=>{
  e.preventDefault();
  const data = {
    cafeName: $("#f-cafeName").value.trim(),
    tagline: $("#f-tagline").value.trim(),
    hoursNote: $("#f-hoursNote").value.trim(),
    heroImages: collectListEditor("heroImagesList"),
    hours: collectHoursEditor(),
    aboutTitle: $("#f-aboutTitle").value.trim(),
    aboutIntro: $("#f-aboutIntro").value.trim(),
    aboutBody: collectListEditor("aboutBodyList"),
    values: collectValuesEditor(),
    contact: {
      address: $("#f-address").value.trim(),
      phone: $("#f-phone").value.trim(),
      instagram: $("#f-instagram").value.trim(),
      whatsapp: $("#f-whatsapp").value.trim(),
      mapUrl: $("#f-mapUrl").value.trim()
    }
  };
  db.collection("settings").doc("main").set(data, {merge:true})
    .then(()=> toast("تنظیمات ذخیره شد ✓"))
    .catch(err=> toast("خطا: "+err.message, true));
});

/* ================================================================
   بخش دسته‌بندی‌ها
================================================================ */
function loadCategories(){
  db.collection("categories").orderBy("order","asc").onSnapshot(snap=>{
    CATEGORIES = snap.docs.map(d=>({id:d.id, ...d.data()}));
    renderCategoriesAdmin();
    fillCategorySelect();
  });
}
function renderCategoriesAdmin(){
  $("#catAdminList").innerHTML = CATEGORIES.map((c,i)=>`
    <div class="admin-cat-row">
      <div class="mv">
        <button data-up="${c.id}" ${i===0?'disabled':''}>▲</button>
        <button data-down="${c.id}" ${i===CATEGORIES.length-1?'disabled':''}>▼</button>
      </div>
      <div class="grow">
        <input type="text" value="${escAttr(c.name)}" data-field="name" data-id="${c.id}" placeholder="نام دسته (فارسی)">
        <input type="text" value="${escAttr(c.nameEn||'')}" data-field="nameEn" data-id="${c.id}" placeholder="نام دسته (انگلیسی - اختیاری)">
      </div>
      <button class="save-cat" data-id="${c.id}">ذخیره</button>
      <button class="del-cat" data-id="${c.id}">حذف</button>
    </div>
  `).join("") || `<p class="empty-note">هنوز دسته‌بندی‌ای نداری.</p>`;

  $$(".save-cat").forEach(b=>b.addEventListener("click", ()=>{
    const id = b.dataset.id;
    const row = b.closest(".admin-cat-row");
    const name = row.querySelector('[data-field="name"]').value.trim();
    const nameEn = row.querySelector('[data-field="nameEn"]').value.trim();
    db.collection("categories").doc(id).update({name, nameEn})
      .then(()=> toast("دسته‌بندی ذخیره شد ✓"));
  }));
  $$(".del-cat").forEach(b=>b.addEventListener("click", ()=>{
    if(!confirm("حذف این دسته‌بندی؟ آیتم‌های داخلش هم از دید مشتری مخفی می‌شوند.")) return;
    db.collection("categories").doc(b.dataset.id).delete().then(()=> toast("حذف شد"));
  }));
  $$("[data-up]").forEach(b=>b.addEventListener("click", ()=> swapOrder(b.dataset.up, -1)));
  $$("[data-down]").forEach(b=>b.addEventListener("click", ()=> swapOrder(b.dataset.down, 1)));
}
function swapOrder(id, dir){
  const idx = CATEGORIES.findIndex(c=>c.id===id);
  const swapIdx = idx+dir;
  if(swapIdx<0 || swapIdx>=CATEGORIES.length) return;
  const a = CATEGORIES[idx], b = CATEGORIES[swapIdx];
  const batch = db.batch();
  batch.update(db.collection("categories").doc(a.id), {order:b.order});
  batch.update(db.collection("categories").doc(b.id), {order:a.order});
  batch.commit();
}
$("#addCatForm").addEventListener("submit", e=>{
  e.preventDefault();
  const name = $("#newCatName").value.trim();
  const nameEn = $("#newCatNameEn").value.trim();
  if(!name) return;
  const order = CATEGORIES.length ? Math.max(...CATEGORIES.map(c=>c.order||0))+1 : 1;
  db.collection("categories").add({name, nameEn, order}).then(()=>{
    $("#newCatName").value=""; $("#newCatNameEn").value="";
    toast("دسته‌بندی اضافه شد ✓");
  });
});

/* ================================================================
   بخش آیتم‌های منو
================================================================ */
function fillCategorySelect(){
  const sel = $("#itemCategory");
  sel.innerHTML = CATEGORIES.map(c=>`<option value="${c.id}">${c.name}</option>`).join("");
}
function loadItems(){
  db.collection("items").orderBy("order","asc").onSnapshot(snap=>{
    ITEMS = snap.docs.map(d=>({id:d.id, ...d.data()}));
    renderItemsAdmin();
  });
}
function renderItemsAdmin(){
  const wrap = $("#itemsAdminList");
  if(!ITEMS.length){ wrap.innerHTML = `<p class="empty-note">هنوز آیتمی اضافه نشده.</p>`; return; }
  wrap.innerHTML = ITEMS.map(it=>{
    const catName = CATEGORIES.find(c=>c.id===it.categoryId)?.name || "—";
    return `
    <div class="admin-item-row">
      <div class="admin-item-thumb">${it.image ? `<img src="${it.image}">` : "🌵"}</div>
      <div class="grow">
        <div class="ai-title">${it.title} <span class="ai-cat">${catName}</span></div>
        <div class="ai-sub">${it.price||""} ${it.available===false ? " · مخفی" : ""}</div>
      </div>
      <button class="edit-item" data-id="${it.id}">ویرایش</button>
      <button class="del-item" data-id="${it.id}">حذف</button>
    </div>`;
  }).join("");
  $$(".edit-item").forEach(b=>b.addEventListener("click", ()=> openItemForm(b.dataset.id)));
  $$(".del-item").forEach(b=>b.addEventListener("click", ()=>{
    if(!confirm("این آیتم حذف شود؟")) return;
    db.collection("items").doc(b.dataset.id).delete().then(()=> toast("حذف شد"));
  }));
}

let editingItemId = null;
function openItemForm(id){
  editingItemId = id || null;
  const it = id ? ITEMS.find(i=>i.id===id) : {};
  $("#itemFormTitle").textContent = id ? "ویرایش آیتم" : "افزودن آیتم جدید";
  $("#itemCategory").value = it.categoryId || CATEGORIES[0]?.id || "";
  $("#itemTitle").value = it.title || "";
  $("#itemSubtitle").value = it.subtitle || "";
  $("#itemDesc").value = it.desc || "";
  $("#itemPrice").value = it.price || "";
  $("#itemImageUrl").value = it.image || "";
  $("#itemIsNew").checked = !!it.isNew;
  $("#itemAvailable").checked = it.available !== false;
  $("#itemModal").classList.add("show");
}
$("#newItemBtn").addEventListener("click", ()=> openItemForm(null));
$("#closeItemModal").addEventListener("click", ()=> $("#itemModal").classList.remove("show"));

$("#itemImageFile").addEventListener("change", async (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  $("#uploadStatus").textContent = "در حال آپلود عکس...";
  try{
    const path = "items/" + Date.now() + "_" + file.name;
    const ref = storage.ref().child(path);
    await ref.put(file);
    const url = await ref.getDownloadURL();
    $("#itemImageUrl").value = url;
    $("#uploadStatus").textContent = "آپلود شد ✓";
  }catch(err){
    $("#uploadStatus").textContent = "خطا در آپلود: " + err.message;
  }
});

$("#itemForm").addEventListener("submit", e=>{
  e.preventDefault();
  const data = {
    categoryId: $("#itemCategory").value,
    title: $("#itemTitle").value.trim(),
    subtitle: $("#itemSubtitle").value.trim(),
    desc: $("#itemDesc").value.trim(),
    price: $("#itemPrice").value.trim(),
    image: $("#itemImageUrl").value.trim(),
    isNew: $("#itemIsNew").checked,
    available: $("#itemAvailable").checked,
  };
  const save = editingItemId
    ? db.collection("items").doc(editingItemId).update(data)
    : db.collection("items").add({...data, order: ITEMS.length ? Math.max(...ITEMS.map(i=>i.order||0))+1 : 1});
  save.then(()=>{
    $("#itemModal").classList.remove("show");
    toast("ذخیره شد ✓");
  }).catch(err=> toast("خطا: "+err.message, true));
});

/* ================================================================
   داده‌ی نمونه برای شروع سریع
================================================================ */
$("#seedBtn").addEventListener("click", async ()=>{
  if(!confirm("داده‌ی نمونه اضافه شود؟ (روی داده‌های موجود اثر نمی‌گذارد)")) return;
  await db.collection("settings").doc("main").set({
    cafeName: "PLAN B",
    tagline: "همیشه یه نقشه‌ی بهتر هست",
    hoursNote: "الان باز هستیم",
    heroImages: [],
    hours: [{days:"شنبه تا چهارشنبه", time:"۹:۰۰ - ۲۳:۰۰"}, {days:"پنجشنبه و جمعه", time:"۹:۰۰ - ۲۴:۰۰"}],
    aboutTitle: "داستان PLAN B",
    aboutIntro: "وقتی نقشه‌ی اول جواب نمیده، یه فنجون قهوه‌ی خوب بهترین نقشه‌ی دومه.",
    aboutBody: ["PLAN B جایی برای آدم‌هایی‌ست که دوست دارن یه‌کم آروم‌تر زندگی کنن.", "ما به کیفیت مواد اولیه و حس خوب فضا اهمیت میدیم."],
    values: [{icon:"🌱",label:"مواد تازه"},{icon:"☕",label:"قهوه تخصصی"},{icon:"🌵",label:"فضای دنج"}],
    contact: {address:"تهران، خیابان ...", phone:"021-00000000", instagram:"https://instagram.com/planb.cafe", whatsapp:"", mapUrl:"https://maps.google.com"}
  }, {merge:true});

  const catRefs = {};
  for(const [i,name] of ["قهوه","نوشیدنی سرد","دسر","صبحانه"].entries()){
    const ref = await db.collection("categories").add({name, nameEn:"", order:i+1});
    catRefs[name] = ref.id;
  }
  const items = [
    {cat:"قهوه", title:"اسپرسو", desc:"دبل‌شات، طعم غلیظ", price:"۹۵٬۰۰۰ تومان"},
    {cat:"قهوه", title:"لاته", desc:"اسپرسو با شیر بخارداده", price:"۱۲۰٬۰۰۰ تومان"},
    {cat:"دسر", title:"چیزکیک", desc:"با تاپینگ توت قرمز", price:"۱۸۵٬۰۰۰ تومان", isNew:true},
    {cat:"صبحانه", title:"کروسان", desc:"کره‌ای، تازه از فر", price:"۱۴۰٬۰۰۰ تومان"}
  ];
  let order=1;
  for(const it of items){
    await db.collection("items").add({
      categoryId: catRefs[it.cat], title:it.title, subtitle:"", desc:it.desc, price:it.price,
      image:"", isNew: !!it.isNew, available:true, order:order++
    });
  }
  toast("داده‌ی نمونه اضافه شد ✓");
});

/* ---------- کمکی‌ها ---------- */
function escAttr(v){ return (v||"").toString().replace(/"/g,"&quot;"); }
function toast(msg, isError){
  const t = $("#toast");
  t.textContent = msg;
  t.className = "show" + (isError ? " error" : "");
  setTimeout(()=> t.className = "", 2500);
}
