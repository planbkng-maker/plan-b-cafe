/* ================================================================
   PLAN B — پنل مدیریت
   Firebase + مدیریت منو + انتشار data.json
================================================================ */

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

let CATEGORIES = [];
let ITEMS = [];
let editingItemId = null;


/* ================================================================
   شروع پنل
================================================================ */

document.addEventListener("DOMContentLoaded", () => {

  /* ---------- ورود / خروج ---------- */

  const loginForm = $("#loginForm");
  const logoutBtn = $("#logoutBtn");

  if (loginForm) {
    loginForm.addEventListener("submit", e => {
      e.preventDefault();

      const email = $("#loginEmail").value.trim();
      const pass = $("#loginPass").value;

      $("#loginError").textContent = "";

      auth.signInWithEmailAndPassword(email, pass)
        .catch(err => {
          $("#loginError").textContent =
            "ورود ناموفق: " + err.message;
        });
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      auth.signOut();
    });
  }


  /* ---------- وضعیت ورود ---------- */

  auth.onAuthStateChanged(user => {

    const loginScreen = $("#loginScreen");
    const adminApp = $("#adminApp");

    if (!loginScreen || !adminApp) {
      showFatalError(
        "عناصر loginScreen یا adminApp در صفحه پیدا نشدند."
      );
      return;
    }

    loginScreen.style.display = user ? "none" : "flex";
    adminApp.style.display = user ? "block" : "none";

    if (user) {
      loadSettings();
      loadCategories();
      loadItems();
    }

  });


  /* ---------- تب‌های پنل ---------- */

  $$(".admin-tab").forEach(tab => {

    tab.addEventListener("click", () => {

      $$(".admin-tab").forEach(t =>
        t.classList.remove("active")
      );

      tab.classList.add("active");

      $$(".admin-section").forEach(section =>
        section.classList.remove("active")
      );

      const target = $("#sec-" + tab.dataset.sec);

      if (target) {
        target.classList.add("active");
      }

    });

  });


  /* ---------- دکمه انتشار ---------- */

  const publishBtn = $("#publishBtn");

  if (publishBtn) {
    publishBtn.addEventListener("click", publishData);
  }


  /* ---------- تنظیمات ---------- */

  const settingsForm = $("#settingsForm");

  if (settingsForm) {
    settingsForm.addEventListener("submit", saveSettings);
  }


  /* ---------- افزودن عکس هیرو ---------- */

  const addHeroImg = $("#addHeroImg");

  if (addHeroImg) {
    addHeroImg.addEventListener("click", () => {
      const arr = collectListEditor("heroImagesList");
      addListRow(
        "heroImagesList",
        arr,
        "لینک عکس هیرو"
      );
    });
  }


  /* ---------- افزودن پاراگراف ---------- */

  const addAboutPara = $("#addAboutPara");

  if (addAboutPara) {
    addAboutPara.addEventListener("click", () => {
      const arr = collectListEditor("aboutBodyList");

      addListRow(
        "aboutBodyList",
        arr,
        "پاراگراف"
      );
    });
  }


  /* ---------- ساعات کاری ---------- */

  const addHoursRow = $("#addHoursRow");

  if (addHoursRow) {
    addHoursRow.addEventListener("click", () => {

      const arr = collectHoursEditor();

      arr.push({
        days: "",
        time: ""
      });

      renderHoursEditor(arr);
    });
  }


  /* ---------- ارزش‌ها ---------- */

  const addValueRow = $("#addValueRow");

  if (addValueRow) {
    addValueRow.addEventListener("click", () => {

      const arr = collectValuesEditor();

      arr.push({
        icon: "🌵",
        label: ""
      });

      renderValuesEditor(arr);
    });
  }


  /* ---------- دسته‌بندی جدید ---------- */

  const addCatForm = $("#addCatForm");

  if (addCatForm) {
    addCatForm.addEventListener("submit", addCategory);
  }


  /* ---------- آیتم جدید ---------- */

  const newItemBtn = $("#newItemBtn");

  if (newItemBtn) {
    newItemBtn.addEventListener("click", () => {
      openItemForm(null);
    });
  }


  /* ---------- بستن مودال ---------- */

  const closeItemModal = $("#closeItemModal");

  if (closeItemModal) {
    closeItemModal.addEventListener("click", () => {
      $("#itemModal").classList.remove("show");
    });
  }


  /* ---------- پیش‌نمایش عکس ---------- */

  const itemImageUrl = $("#itemImageUrl");

  if (itemImageUrl) {

    itemImageUrl.addEventListener("input", e => {

      const url = e.target.value.trim();

      $("#imgPreviewBox").innerHTML = url
        ? `<img src="${url}" onerror="this.style.display='none'">`
        : "";

    });

  }


  /* ---------- ذخیره آیتم ---------- */

  const itemForm = $("#itemForm");

  if (itemForm) {
    itemForm.addEventListener("submit", saveItem);
  }


  /* ---------- داده نمونه ---------- */

  const seedBtn = $("#seedBtn");

  if (seedBtn) {
    seedBtn.addEventListener("click", seedData);
  }

});


/* ================================================================
   تنظیمات
================================================================ */

function loadSettings() {

  db.collection("settings")
    .doc("main")
    .get()
    .then(doc => {

      const s = doc.exists ? doc.data() : {};

      $("#f-cafeName").value =
        s.cafeName || "PLAN B";

      $("#f-tagline").value =
        s.tagline || "";

      $("#f-hoursNote").value =
        s.hoursNote || "";

      renderListEditor(
        "heroImagesList",
        s.heroImages || [],
        "لینک عکس هیرو"
      );

      renderHoursEditor(
        s.hours || []
      );

      $("#f-aboutTitle").value =
        s.aboutTitle || "";

      $("#f-aboutIntro").value =
        s.aboutIntro || "";

      renderListEditor(
        "aboutBodyList",
        s.aboutBody || [],
        "پاراگراف"
      );

      renderValuesEditor(
        s.values || []
      );

      const contact = s.contact || {};

      $("#f-address").value =
        contact.address || "";

      $("#f-phone").value =
        contact.phone || "";

      $("#f-instagram").value =
        contact.instagram || "";

      $("#f-whatsapp").value =
        contact.whatsapp || "";

      $("#f-mapUrl").value =
        contact.mapUrl || "";

    })
    .catch(err => {

      toast(
        "خطا در دریافت تنظیمات: " + err.message,
        true
      );

    });

}


/* ================================================================
   ذخیره تنظیمات
================================================================ */

function saveSettings(e) {

  e.preventDefault();

  try {

    const data = {

      cafeName:
        $("#f-cafeName").value.trim(),

      tagline:
        $("#f-tagline").value.trim(),

      hoursNote:
        $("#f-hoursNote").value.trim(),

      heroImages:
        collectListEditor("heroImagesList"),

      hours:
        collectHoursEditor(),

      aboutTitle:
        $("#f-aboutTitle").value.trim(),

      aboutIntro:
        $("#f-aboutIntro").value.trim(),

      aboutBody:
        collectListEditor("aboutBodyList"),

      values:
        collectValuesEditor(),

      contact: {

        address:
          $("#f-address").value.trim(),

        phone:
          $("#f-phone").value.trim(),

        instagram:
          $("#f-instagram").value.trim(),

        whatsapp:
          $("#f-whatsapp").value.trim(),

        mapUrl:
          $("#f-mapUrl").value.trim()

      }

    };

    db.collection("settings")
      .doc("main")
      .set(data, { merge: true })

      .then(() => {

        toast(
          "تنظیمات ذخیره شد ✓"
        );

      })

      .catch(err => {

        toast(
          "خطا: " + err.message,
          true
        );

        showFatalError(
          "ذخیره تنظیمات: " + err.message
        );

      });

  } catch (err) {

    showFatalError(
      "قبل از ذخیره: " + err.message
    );

  }

}


/* ================================================================
   ویرایشگر لیست‌ها
================================================================ */

function renderListEditor(
  containerId,
  arr,
  placeholder
) {

  const c = $("#" + containerId);

  if (!c) return;

  c.innerHTML = arr.map((v, i) => `

    <div class="row-item">

      <input
        type="text"
        data-idx="${i}"
        value="${escAttr(v)}"
        placeholder="${placeholder}"
      >

      <button
        type="button"
        class="del-row"
        data-idx="${i}"
      >✕</button>

    </div>

  `).join("");

  c.querySelectorAll(".del-row")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          arr.splice(
            Number(button.dataset.idx),
            1
          );

          renderListEditor(
            containerId,
            arr,
            placeholder
          );

        }
      );

    });

}


function collectListEditor(containerId) {

  const c = $("#" + containerId);

  if (!c) return [];

  return [
    ...c.querySelectorAll("input")
  ]

    .map(input =>
      input.value.trim()
    )

    .filter(Boolean);

}


function addListRow(
  containerId,
  arr,
  placeholder
) {

  arr.push("");

  renderListEditor(
    containerId,
    arr,
    placeholder
  );

}


/* ================================================================
   ساعات کاری
================================================================ */

function renderHoursEditor(arr) {

  const c = $("#hoursList");

  if (!c) return;

  c.innerHTML = arr.map((h, i) => `

    <div class="row-item two">

      <input
        type="text"
        value="${escAttr(h.days)}"
        placeholder="مثلا: شنبه تا چهارشنبه"
        data-f="days"
      >

      <input
        type="text"
        value="${escAttr(h.time)}"
        placeholder="مثلا: ۹:۰۰ - ۲۳:۰۰"
        data-f="time"
      >

      <button
        type="button"
        class="del-row"
        data-idx="${i}"
      >✕</button>

    </div>

  `).join("");

  c.querySelectorAll(".del-row")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          arr.splice(
            Number(button.dataset.idx),
            1
          );

          renderHoursEditor(arr);

        }
      );

    });

}


function collectHoursEditor() {

  const rows =
    $$("#hoursList .row-item");

  return [...rows]

    .map(row => ({

      days:
        row.querySelector(
          '[data-f="days"]'
        ).value.trim(),

      time:
        row.querySelector(
          '[data-f="time"]'
        ).value.trim()

    }))

    .filter(h =>
      h.days || h.time
    );

}


/* ================================================================
   ارزش‌ها
================================================================ */

function renderValuesEditor(arr) {

  const c = $("#valuesList");

  if (!c) return;

  c.innerHTML = arr.map((v, i) => `

    <div class="row-item two">

      <input
        type="text"
        value="${escAttr(v.icon)}"
        placeholder="ایموجی مثلا 🌵"
        data-f="icon"
        style="max-width:70px;"
      >

      <input
        type="text"
        value="${escAttr(v.label)}"
        placeholder="عنوان کوتاه"
        data-f="label"
      >

      <button
        type="button"
        class="del-row"
        data-idx="${i}"
      >✕</button>

    </div>

  `).join("");

  c.querySelectorAll(".del-row")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          arr.splice(
            Number(button.dataset.idx),
            1
          );

          renderValuesEditor(arr);

        }
      );

    });

}


function collectValuesEditor() {

  const rows =
    $$("#valuesList .row-item");

  return [...rows]

    .map(row => ({

      icon:
        row.querySelector(
          '[data-f="icon"]'
        ).value.trim(),

      label:
        row.querySelector(
          '[data-f="label"]'
        ).value.trim()

    }))

    .filter(v => v.label);

}


/* ================================================================
   دسته‌بندی‌ها
================================================================ */

function loadCategories() {

  db.collection("categories")
    .orderBy("order", "asc")
    .onSnapshot(

      snap => {

        CATEGORIES =
          snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

        renderCategoriesAdmin();
        fillCategorySelect();

        renderItemsAdmin();

      },

      err => {

        toast(
          "خطا در دریافت دسته‌بندی‌ها: " +
          err.message,
          true
        );

      }

    );

}


function renderCategoriesAdmin() {

  const container =
    $("#catAdminList");

  if (!container) return;

  container.innerHTML =
    CATEGORIES.map((c, i) => `

      <div class="admin-cat-row">

        <div class="mv">

          <button
            data-up="${c.id}"
            ${i === 0 ? "disabled" : ""}
          >▲</button>

          <button
            data-down="${c.id}"
            ${i === CATEGORIES.length - 1
              ? "disabled"
              : ""}
          >▼</button>

        </div>

        <div class="grow">

          <input
            type="text"
            value="${escAttr(c.name)}"
            data-field="name"
            data-id="${c.id}"
            placeholder="نام دسته (فارسی)"
          >

          <input
            type="text"
            value="${escAttr(c.nameEn || "")}"
            data-field="nameEn"
            data-id="${c.id}"
            placeholder="نام دسته (انگلیسی - اختیاری)"
          >

        </div>

        <button
          class="save-cat"
          data-id="${c.id}"
        >ذخیره</button>

        <button
          class="del-cat"
          data-id="${c.id}"
        >حذف</button>

      </div>

    `).join("")

    || `<p class="empty-note">
          هنوز دسته‌بندی‌ای نداری.
       </p>`;


  $$(".save-cat")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.id;

          const row =
            button.closest(
              ".admin-cat-row"
            );

          const name =
            row.querySelector(
              '[data-field="name"]'
            ).value.trim();

          const nameEn =
            row.querySelector(
              '[data-field="nameEn"]'
            ).value.trim();

          db.collection("categories")
            .doc(id)
            .update({
              name,
              nameEn
            })

            .then(() => {

              toast(
                "دسته‌بندی ذخیره شد ✓"
              );

            })

            .catch(err => {

              toast(
                "خطا: " + err.message,
                true
              );

            });

        }
      );

    });


  $$(".del-cat")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          if (!confirm(
            "حذف این دسته‌بندی؟ آیتم‌های داخلش هم از دید مشتری مخفی می‌شوند."
          )) return;

          db.collection("categories")
            .doc(button.dataset.id)
            .delete()

            .then(() => {

              toast("حذف شد ✓");

            })

            .catch(err => {

              toast(
                "خطا: " + err.message,
                true
              );

            });

        }
      );

    });


  $$("[data-up]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () =>
          swapOrder(
            button.dataset.up,
            -1
          )
      );

    });


  $$("[data-down]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () =>
          swapOrder(
            button.dataset.down,
            1
          )
      );

    });

}


function swapOrder(id, dir) {

  const idx =
    CATEGORIES.findIndex(
      c => c.id === id
    );

  const swapIdx =
    idx + dir;

  if (
    idx < 0 ||
    swapIdx < 0 ||
    swapIdx >= CATEGORIES.length
  ) return;

  const a =
    CATEGORIES[idx];

  const b =
    CATEGORIES[swapIdx];

  const batch =
    db.batch();

  batch.update(
    db.collection("categories").doc(a.id),
    { order: b.order }
  );

  batch.update(
    db.collection("categories").doc(b.id),
    { order: a.order }
  );

  batch.commit()

    .then(() => {

      toast(
        "ترتیب تغییر کرد ✓"
      );

    })

    .catch(err => {

      toast(
        "خطا: " + err.message,
        true
      );

    });

}


function addCategory(e) {

  e.preventDefault();

  const name =
    $("#newCatName").value.trim();

  const nameEn =
    $("#newCatNameEn").value.trim();

  if (!name) return;

  const order =
    CATEGORIES.length
      ? Math.max(
          ...CATEGORIES.map(
            c => c.order || 0
          )
        ) + 1
      : 1;

  db.collection("categories")
    .add({
      name,
      nameEn,
      order
    })

    .then(() => {

      $("#newCatName").value = "";
      $("#newCatNameEn").value = "";

      toast(
        "دسته‌بندی اضافه شد ✓"
      );

    })

    .catch(err => {

      toast(
        "خطا: " + err.message,
        true
      );

    });

}


/* ================================================================
   آیتم‌ها
================================================================ */

function fillCategorySelect() {

  const select =
    $("#itemCategory");

  if (!select) return;

  select.innerHTML =
    CATEGORIES.map(c => `

      <option value="${c.id}">
        ${escAttr(c.name)}
      </option>

    `).join("");

}


function loadItems() {

  db.collection("items")
    .orderBy("order", "asc")
    .onSnapshot(

      snap => {

        ITEMS =
          snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

        renderItemsAdmin();

      },

      err => {

        toast(
          "خطا در دریافت آیتم‌ها: " +
          err.message,
          true
        );

      }

    );

}


function renderItemsAdmin() {

  const wrap =
    $("#itemsAdminList");

  if (!wrap) return;

  if (!ITEMS.length) {

    wrap.innerHTML =
      `<p class="empty-note">
        هنوز آیتمی اضافه نشده.
       </p>`;

    return;

  }

  wrap.innerHTML =
    ITEMS.map(it => {

      const catName =
        CATEGORIES.find(
          c => c.id === it.categoryId
        )?.name || "—";

      return `

        <div class="admin-item-row">

          <div class="admin-item-thumb">

            ${
              it.image
                ? `<img src="${escAttr(it.image)}">`
                : "🌵"
            }

          </div>

          <div class="grow">

            <div class="ai-title">

              ${escAttr(it.title)}

              <span class="ai-cat">
                ${escAttr(catName)}
              </span>

            </div>

            <div class="ai-sub">

              ${escAttr(it.price || "")}

              ${
                it.available === false
                  ? " · مخفی"
                  : ""
              }

            </div>

          </div>

          <button
            class="edit-item"
            data-id="${it.id}"
          >ویرایش</button>

          <button
            class="del-item"
            data-id="${it.id}"
          >حذف</button>

        </div>

      `;

    }).join("");


  $$(".edit-item")
    .forEach(button => {

      button.addEventListener(
        "click",
        () =>
          openItemForm(
            button.dataset.id
          )
      );

    });


  $$(".del-item")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          if (!confirm(
            "این آیتم حذف شود؟"
          )) return;

          db.collection("items")
            .doc(button.dataset.id)
            .delete()

            .then(() => {

              toast(
                "آیتم حذف شد ✓"
              );

            })

            .catch(err => {

              toast(
                "خطا: " + err.message,
                true
              );

            });

        }
      );

    });

}


function openItemForm(id) {

  editingItemId =
    id || null;

  const item =
    id
      ? ITEMS.find(
          i => i.id === id
        )
      : {};

  $("#itemFormTitle").textContent =
    id
      ? "ویرایش آیتم"
      : "افزودن آیتم جدید";

  $("#itemCategory").value =
    item.categoryId ||
    CATEGORIES[0]?.id ||
    "";

  $("#itemTitle").value =
    item.title || "";

  $("#itemSubtitle").value =
    item.subtitle || "";

  $("#itemDesc").value =
    item.desc || "";

  $("#itemPrice").value =
    item.price || "";

  $("#itemImageUrl").value =
    item.image || "";

  $("#imgPreviewBox").innerHTML =
    item.image
      ? `<img src="${escAttr(item.image)}"
           onerror="this.style.display='none'">`
      : "";

  $("#itemIsNew").checked =
    !!item.isNew;

  $("#itemAvailable").checked =
    item.available !== false;

  $("#itemModal")
    .classList
    .add("show");

}


function saveItem(e) {

  e.preventDefault();

  const data = {

    categoryId:
      $("#itemCategory").value,

    title:
      $("#itemTitle").value.trim(),

    subtitle:
      $("#itemSubtitle").value.trim(),

    desc:
      $("#itemDesc").value.trim(),

    price:
      $("#itemPrice").value.trim(),

    image:
      $("#itemImageUrl").value.trim(),

    isNew:
      $("#itemIsNew").checked,

    available:
      $("#itemAvailable").checked

  };


  const save =
    editingItemId

      ? db.collection("items")
          .doc(editingItemId)
          .update(data)

      : db.collection("items")
          .add({

            ...data,

            order:
              ITEMS.length
                ? Math.max(
                    ...ITEMS.map(
                      i => i.order || 0
                    )
                  ) + 1
                : 1

          });


  save

    .then(() => {

      $("#itemModal")
        .classList
        .remove("show");

      toast(
        "آیتم ذخیره شد ✓"
      );

    })

    .catch(err => {

      toast(
        "خطا: " + err.message,
        true
      );

    });

}


/* ================================================================
   داده نمونه
================================================================ */

async function seedData() {

  if (!confirm(
    "داده‌ی نمونه اضافه شود؟ (روی داده‌های موجود اثر نمی‌گذارد)"
  )) return;

  try {

    await db.collection("settings")
      .doc("main")
      .set({

        cafeName: "PLAN B",

        tagline:
          "همیشه یه نقشه‌ی بهتر هست",

        hoursNote:
          "الان باز هستیم",

        heroImages: [],

        hours: [
          {
            days:
              "شنبه تا چهارشنبه",
            time:
              "۹:۰۰ - ۲۳:۰۰"
          },
          {
            days:
              "پنجشنبه و جمعه",
            time:
              "۹:۰۰ - ۲۴:۰۰"
          }
        ],

        aboutTitle:
          "داستان PLAN B",

        aboutIntro:
          "وقتی نقشه‌ی اول جواب نمیده، یه فنجون قهوه‌ی خوب بهترین نقشه‌ی دومه.",

        aboutBody: [
          "PLAN B جایی برای آدم‌هایی‌ست که دوست دارن یه‌کم آروم‌تر زندگی کنن.",
          "ما به کیفیت مواد اولیه و حس خوب فضا اهمیت میدیم."
        ],

        values: [
          {
            icon: "🌱",
            label: "مواد تازه"
          },
          {
            icon: "☕",
            label: "قهوه تخصصی"
          },
          {
            icon: "🌵",
            label: "فضای دنج"
          }
        ],

        contact: {
          address:
            "تهران، خیابان ...",

          phone:
            "021-00000000",

          instagram:
            "https://instagram.com/planb.cafe",

          whatsapp:
            "",

          mapUrl:
            "https://maps.google.com"
        }

      }, { merge: true });


    const catRefs = {};

    const categoryNames = [
      "قهوه",
      "نوشیدنی سرد",
      "دسر",
      "صبحانه"
    ];


    for (
      const [i, name]
      of categoryNames.entries()
    ) {

      const ref =
        await db.collection("categories")
          .add({

            name,
            nameEn: "",
            order: i + 1

          });

      catRefs[name] =
        ref.id;

    }


    const items = [

      {
        cat: "قهوه",
        title: "اسپرسو",
        desc: "دبل‌شات، طعم غلیظ",
        price: "۹۵٬۰۰۰ تومان"
      },

      {
        cat: "قهوه",
        title: "لاته",
        desc: "اسپرسو با شیر بخارداده",
        price: "۱۲۰٬۰۰۰ تومان"
      },

      {
        cat: "دسر",
        title: "چیزکیک",
        desc: "با تاپینگ توت قرمز",
        price: "۱۸۵٬۰۰۰ تومان",
        isNew: true
      },

      {
        cat: "صبحانه",
        title: "کروسان",
        desc: "کره‌ای، تازه از فر",
        price: "۱۴۰٬۰۰۰ تومان"
      }

    ];


    let order = 1;


    for (const item of items) {

      await db.collection("items")
        .add({

          categoryId:
            catRefs[item.cat],

          title:
            item.title,

          subtitle:
            "",

          desc:
            item.desc,

          price:
            item.price,

          image:
            "",

          isNew:
            !!item.isNew,

          available:
            true,

          order:
            order++

        });

    }


    toast(
      "داده‌ی نمونه اضافه شد ✓"
    );

  } catch (err) {

    toast(
      "خطا: " + err.message,
      true
    );

    showFatalError(
      "افزودن داده نمونه: " +
      err.message
    );

  }

}


/* ================================================================
   انتشار
   Firebase → data.json
================================================================ */

async function publishData() {

  const publishBtn =
    $("#publishBtn");

  if (!auth.currentUser) {

    toast(
      "ابتدا وارد پنل مدیریت شو.",
      true
    );

    return;

  }


  const originalText =
    publishBtn
      ? publishBtn.textContent
      : "";


  try {

    if (publishBtn) {

      publishBtn.disabled = true;

      publishBtn.textContent =
        "در حال آماده‌سازی...";

    }


    /* ---------- settings ---------- */

    const settingsSnap =
      await db.collection("settings")
        .doc("main")
        .get();


    if (!settingsSnap.exists) {

      throw new Error(
        "تنظیمات اصلی پیدا نشد."
      );

    }


    const settings =
      settingsSnap.data();


    /* ---------- categories ---------- */

    const categoriesSnap =
      await db.collection("categories")
        .orderBy("order", "asc")
        .get();


    const categories =
      categoriesSnap.docs.map(doc => ({

        id: doc.id,

        ...doc.data()

      }));


    if (!categories.length) {

      throw new Error(
        "هیچ دسته‌بندی‌ای وجود ندارد."
      );

    }


    /* ---------- items ---------- */

    const itemsSnap =
      await db.collection("items")
        .orderBy("order", "asc")
        .get();


    const items =
      itemsSnap.docs.map(doc => ({

        id: doc.id,

        ...doc.data()

      }));


    /* ---------- اعتبارسنجی ---------- */

    const categoryIds =
      new Set(
        categories.map(
          c => c.id
        )
      );


    const invalidItems =
      items.filter(item =>
        !item.categoryId ||
        !categoryIds.has(
          item.categoryId
        )
      );


    if (invalidItems.length) {

      const names =
        invalidItems
          .map(
            item =>
              item.title ||
              item.id
          )
          .join("، ");


      throw new Error(
        "این آیتم‌ها دسته‌بندی معتبر ندارند: " +
        names
      );

    }


    categories.forEach(
      (category, index) => {

        if (
          category.order === undefined ||
          category.order === null
        ) {
          category.order =
            index + 1;
        }

      }
    );


    items.forEach(
      (item, index) => {

        if (
          item.order === undefined ||
          item.order === null
        ) {
          item.order =
            index + 1;
        }

      }
    );


    /* ---------- ساخت JSON ---------- */

    const exportData = {

      settings,

      categories,

      items

    };


    const json =
      JSON.stringify(
        exportData,
        null,
        2
      );


    /* ---------- دانلود ---------- */

    const blob =
      new Blob(
        [json],
        {
          type:
            "application/json;charset=utf-8"
        }
      );


    const url =
      URL.createObjectURL(blob);


    const a =
      document.createElement("a");

    a.href = url;

    a.download =
      "data.json";


    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);


    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);


    toast(
      "data.json آماده شد ✓"
    );


    if (publishBtn) {

      publishBtn.textContent =
        "دانلود شد ✓";

      setTimeout(() => {

        publishBtn.textContent =
          originalText;

      }, 2500);

    }


  } catch (err) {

    console.error(
      "Publish error:",
      err
    );


    toast(
      "انتشار ناموفق: " +
      (err.message ||
        "خطای نامشخص"),
      true
    );


    showFatalError(
      "انتشار داده‌ها: " +
      (err.message ||
        "خطای نامشخص")
    );


  } finally {

    if (publishBtn) {

      publishBtn.disabled =
        false;

    }

  }

}


/* ================================================================
   ابزارها
================================================================ */

function escAttr(v) {

  return (v ?? "")
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

}


function toast(msg, isError) {

  const t =
    $("#toast");

  if (!t) return;

  t.textContent =
    msg;

  t.className =
    "show" +
    (isError
      ? " error"
      : "");

  setTimeout(() => {

    t.className = "";

  }, 2500);

}
