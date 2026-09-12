/* ================================================================
   PLAN B — منطق سایت اصلی
   این فایل داده‌ها را زنده از Firestore می‌خواند؛ یعنی هر تغییری که
   در پنل مدیریت (admin.html) بدهی، بلافاصله همینجا هم به‌روز می‌شود.
   نیازی به ویرایش این فایل نیست.
================================================================ */
const $  = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

let SETTINGS = null;
let CATEGORIES = [];
let ITEMS = [];
let heroIndex = 0;
let heroTimer = null;

/* ---------- آیکون کاکتوس ساده (SVG درون‌خطی) ---------- */
const CACTUS_SVG = `
<svg viewBox="0 0 40 40" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <rect x="16" y="4" width="8" height="32" rx="4"/>
  <rect x="7" y="15" width="16" height="6" rx="3"/>
  <rect x="7" y="15" width="7" height="15" rx="3.5"/>
  <rect x="17" y="10" width="16" height="6" rx="3"/>
  <rect x="26" y="10" width="7" height="13" rx="3.5"/>
  <ellipse cx="20" cy="37.5" rx="10" ry="2" opacity=".3"/>
</svg>`;

function cactusDeco(extraClass=""){
  const el = document.createElement("span");
  el.className = "cactus-deco " + extraClass;
  el.style.color = "var(--pistachio)";
  el.innerHTML = CACTUS_SVG;
  return el.outerHTML;
}

/* ---------- موج کویر زیر تصویر هیرو ---------- */
function duneMaskSVG(){
  return `
  <svg class="dune-mask" viewBox="0 0 400 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 30 C 80 60, 140 0, 220 22 C 290 42, 340 8, 400 26 L400 60 L0 60 Z" fill="var(--sand)"/>
  </svg>`;
}

/* ================================================================
   خواندن داده‌ها از Firestore (زنده)
================================================================ */
function listenSettings(){
  db.collection("settings").doc("main").onSnapshot(doc=>{
    SETTINGS = doc.exists ? doc.data() : null;
    renderHome();
    renderAbout();
    renderContact();
    renderCategoriesFooter();
  });
}
function listenCategories(){
  db.collection("categories").orderBy("order","asc").onSnapshot(snap=>{
    CATEGORIES = snap.docs.map(d=>({id:d.id, ...d.data()}));
    renderCategoriesList();
    renderFeed();
  });
}
function listenItems(){
  db.collection("items").orderBy("order","asc").onSnapshot(snap=>{
    ITEMS = snap.docs.map(d=>({id:d.id, ...d.data()}));
    renderFeed();
  });
}

/* ================================================================
   صفحه‌ی خانه
================================================================ */
function renderHome(){
  const heroWrap = $("#heroImages");
  const dotsWrap = $("#heroDots");
  if(!SETTINGS){
    $("#homeTagline").textContent = "به‌زودی این بخش تکمیل می‌شود...";
    heroWrap.innerHTML = "";
    dotsWrap.innerHTML = "";
    $("#openStatus").textContent = "برای شروع، از پنل مدیریت اطلاعات کافه را وارد کنید";
    return;
  }
  $("#homeTagline").textContent = SETTINGS.tagline || "";
  $("#openStatus").textContent = SETTINGS.hoursNote || "";

  const imgs = (SETTINGS.heroImages||[]).filter(Boolean);
  heroWrap.innerHTML = imgs.map((src,i)=>`
    <div class="hero-slide ${i===0?'active':''}" style="background-image:url('${src}')"></div>
  `).join("") || `<div class="hero-slide active hero-empty">🌵</div>`;
  dotsWrap.innerHTML = imgs.map((_,i)=>`<span class="hero-dot ${i===0?'active':''}"></span>`).join("");

  heroIndex = 0;
  clearInterval(heroTimer);
  if(imgs.length>1){
    heroTimer = setInterval(()=>{
      const slides = $$(".hero-slide");
      const dots = $$(".hero-dot");
      slides[heroIndex].classList.remove("active");
      dots[heroIndex]?.classList.remove("active");
      heroIndex = (heroIndex+1) % slides.length;
      slides[heroIndex].classList.add("active");
      dots[heroIndex]?.classList.add("active");
    }, 3200);
  }
}

/* ================================================================
   صفحه‌ی «منو / انتخاب دسته‌بندی»
================================================================ */
function renderCategoriesList(){
  const wrap = $("#categoriesList");
  if(!CATEGORIES.length){
    wrap.innerHTML = `<p class="empty-note">هنوز دسته‌بندی‌ای ثبت نشده — از پنل مدیریت اضافه کن.</p>`;
    return;
  }
  wrap.innerHTML = CATEGORIES.map(c=>`
    <button class="cat-index-btn" data-cat="${c.id}">
      <span>${c.name}</span>
      ${c.nameEn ? `<span class="cat-index-en">${c.nameEn}</span>` : ""}
    </button>
  `).join("");
  $$(".cat-index-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      goToPage("feed");
      setTimeout(()=> scrollToCategory(btn.dataset.cat), 60);
    });
  });
}
function renderCategoriesFooter(){
  if(!SETTINGS) return;
  $("#ctPhoneCall").href = "tel:" + (SETTINGS.contact?.phone||"").replace(/[^0-9+]/g,"");
}

/* ================================================================
   صفحه‌ی فید آیتم‌ها (تب چسبان + کارت‌های تمام‌عرض)
================================================================ */
function renderFeed(){
  const tabsWrap = $("#feedTabs");
  const feedWrap = $("#feedList");
  if(!CATEGORIES.length){
    tabsWrap.innerHTML = "";
    feedWrap.innerHTML = `<p class="empty-note">هنوز آیتمی ثبت نشده.</p>`;
    return;
  }
  tabsWrap.innerHTML = CATEGORIES.map((c,i)=>`
    <button class="feed-tab ${i===0?'active':''}" data-cat="${c.id}">${c.name}</button>
  `).join("");

  feedWrap.innerHTML = CATEGORIES.map(c=>{
    const items = ITEMS.filter(it=>it.categoryId===c.id && it.available!==false);
    if(!items.length) return "";
    return `
      <section class="feed-section" id="cat-${c.id}">
        <div class="cactus-row">${cactusDeco()}${cactusDeco("small")}${cactusDeco()}</div>
        ${items.map(it=>`
          <article class="feed-card">
            ${it.isNew ? '<span class="badge-new feed-new">جدید</span>' : ""}
            <div class="feed-photo">
              ${it.image ? `<img src="${it.image}" alt="${it.title}">` : `<span class="feed-emoji">🌵</span>`}
            </div>
            ${it.subtitle ? `<div class="feed-sub">${it.subtitle}</div>` : ""}
            <h3 class="feed-title">${it.title}</h3>
            <p class="feed-desc">${it.desc||""}</p>
            <span class="price-badge">${it.price||""}</span>
          </article>
        `).join("")}
      </section>`;
  }).join("") + `
    <div class="cactus-row">${cactusDeco()}${cactusDeco("small")}${cactusDeco()}</div>
    <div class="touch-card">
      <h4>در تماس باشید</h4>
      <p>اگر سوالی داری یا به کمک نیاز داری، تماس بگیر.</p>
      <a id="ctPhoneCall" class="pill-btn" href="tel:">تماس بگیر</a>
    </div>
  `;

  $$(".feed-tab").forEach(tab=>{
    tab.addEventListener("click", ()=> scrollToCategory(tab.dataset.cat));
  });
  renderCategoriesFooter();
  setupScrollSpy();
}
function scrollToCategory(catId){
  const el = $("#cat-"+catId);
  if(!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - 118;
  window.scrollTo({top:y, behavior:"smooth"});
}
function setupScrollSpy(){
  const sections = $$(".feed-section");
  if(!sections.length) return;
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        const id = entry.target.id.replace("cat-","");
        $$(".feed-tab").forEach(t=>t.classList.toggle("active", t.dataset.cat===id));
      }
    });
  }, {rootMargin:"-40% 0px -50% 0px"});
  sections.forEach(s=>obs.observe(s));
}

/* ================================================================
   صفحه‌ی درباره‌ی ما
================================================================ */
function renderAbout(){
  if(!SETTINGS) return;
  $("#aboutTitle").textContent = SETTINGS.aboutTitle || "";
  $("#aboutIntro").textContent = SETTINGS.aboutIntro || "";
  $("#aboutBody").innerHTML = (SETTINGS.aboutBody||[]).map(p=>`<p>${p}</p>`).join("");
  $("#valueGrid").innerHTML = (SETTINGS.values||[]).map(v=>`
    <div class="value-card"><div class="ico">${v.icon}</div><div class="lbl">${v.label}</div></div>
  `).join("");
}

/* ================================================================
   صفحه‌ی تماس با ما
================================================================ */
function renderContact(){
  if(!SETTINGS) return;
  const c = SETTINGS.contact || {};
  $("#cAddress").textContent = c.address || "-";
  const phoneEl = $("#cPhoneVal");
  phoneEl.textContent = c.phone || "-";
  phoneEl.href = "tel:" + (c.phone||"").replace(/[^0-9+]/g,"");
  $("#hoursTable").innerHTML = (SETTINGS.hours||[]).map(h=>`
    <tr><td>${h.days}</td><td>${h.time}</td></tr>
  `).join("");
  const socials = [];
  if(c.instagram) socials.push({label:"اینستاگرام", url:c.instagram});
  if(c.whatsapp)  socials.push({label:"واتساپ", url:c.whatsapp});
  if(c.mapUrl)    socials.push({label:"مسیر روی نقشه", url:c.mapUrl});
  $("#socialRow").innerHTML = socials.map(s=>`
    <a class="pill-btn" style="flex:1;" href="${s.url}" target="_blank" rel="noopener">${s.label}</a>
  `).join("");
}

/* ================================================================
   ناوبری بین صفحات
================================================================ */
function goToPage(name){
  $$(".page").forEach(p=>p.classList.remove("active"));
  $("#page-"+name).classList.add("active");
  $$("nav.bottom button").forEach(b=>b.classList.toggle("active", b.dataset.page===name));
  window.scrollTo({top:0});
}
function setupNav(){
  $$("[data-goto]").forEach(el=>{
    el.addEventListener("click", ()=> goToPage(el.dataset.goto));
  });
  $$("nav.bottom button").forEach(btn=>{
    btn.addEventListener("click", ()=> goToPage(btn.dataset.page));
  });
  $("#feedBackBtn").addEventListener("click", ()=> goToPage("categories"));
  $("#logoHome").addEventListener("click", ()=> goToPage("home"));
}

/* ---------- اجرا ---------- */
window.addEventListener("load", ()=>{
  setTimeout(()=> $("#splash").classList.add("hide"), 1300);
});
setupNav();
listenSettings();
listenCategories();
listenItems();
