/* =========================================================
   PLAN B - ADMIN PANEL
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  console.log("PLAN B ADMIN JS STARTED");

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);

  let CATEGORIES = [];
  let ITEMS = [];
  let editingItemId = null;

  /* =========================================================
     ELEMENTS
     ========================================================= */

  const loginScreen = $("#loginScreen");
  const adminApp = $("#adminApp");

  /* اگر صفحه درست لود نشده باشد */
  if (!loginScreen || !adminApp) {
    showFatalError(
      "خطا: ساختار صفحه مدیریت پیدا نشد. لطفاً صفحه admin.html را باز کنید و صفحه را Refresh کنید."
    );
    return;
  }

  /* =========================================================
     FIREBASE CHECK
     ========================================================= */

  if (typeof firebase === "undefined") {
    showFatalError("Firebase در صفحه بارگذاری نشده است.");
    return;
  }

  if (typeof auth === "undefined" || typeof db === "undefined") {
    showFatalError(
      "Firebase Auth یا Firestore پیدا نشد. فایل firebase-config.js را بررسی کنید."
    );
    return;
  }

  /* =========================================================
     AUTH
     ========================================================= */

  auth.onAuthStateChanged(function (user) {

    if (user) {

      loginScreen.style.display = "none";
      adminApp.style.display = "block";

      loadSettings();
      loadCategories();
      loadItems();

    } else {

      loginScreen.style.display = "flex";
      adminApp.style.display = "none";

    }

  });


  /* =========================================================
     LOGIN
     ========================================================= */

  const loginForm = $("#loginForm");

  if (loginForm) {

    loginForm.addEventListener("submit", async function (e) {

      e.preventDefault();

      const email = $("#loginEmail")?.value.trim();
      const password = $("#loginPass")?.value;

      const errorBox = $("#loginError");

      if (errorBox) {
        errorBox.textContent = "";
      }

      try {

        await auth.signInWithEmailAndPassword(email, password);

      } catch (error) {

        console.error(error);

        if (errorBox) {
          errorBox.textContent = firebaseErrorMessage(error);
        }

      }

    });

  }


  /* =========================================================
     LOGOUT
     ========================================================= */

  const logoutBtn = $("#logoutBtn");

  if (logoutBtn) {

    logoutBtn.addEventListener("click", async function () {

      try {
        await auth.signOut();
      } catch (error) {
        console.error(error);
        showToast("خطا در خروج");
      }

    });

  }


  /* =========================================================
     TABS
     ========================================================= */

  $$(".admin-tab").forEach(function (tab) {

    tab.addEventListener("click", function () {

      const sectionName = tab.dataset.sec;

      $$(".admin-tab").forEach(t => {
        t.classList.remove("active");
      });

      tab.classList.add("active");

      document.querySelectorAll(".admin-section").forEach(section => {
        section.style.display = "none";
      });

      const target = $("#sec-" + sectionName);

      if (target) {
        target.style.display = "block";
      }

    });

  });


  /* =========================================================
     SETTINGS
     ========================================================= */

  const settingsForm = $("#settingsForm");

  if (settingsForm) {

    settingsForm.addEventListener("submit", async function (e) {

      e.preventDefault();

      try {

        const settings = collectSettings();

        await db.collection("settings")
          .doc("main")
          .set(settings, { merge: true });

        showToast("تنظیمات ذخیره شد ✓");

      } catch (error) {

        console.error(error);

        showToast("خطا در ذخیره تنظیمات");

      }

    });

  }


  /* =========================================================
     HERO IMAGES
     ========================================================= */

  const addHeroImg = $("#addHeroImg");

  if (addHeroImg) {

    addHeroImg.addEventListener("click", function () {

      addHeroImageRow("");

    });

  }


  /* =========================================================
     HOURS
     ========================================================= */

  const addHoursRow = $("#addHoursRow");

  if (addHoursRow) {

    addHoursRow.addEventListener("click", function () {

      addHoursRowElement("", "");

    });

  }


  /* =========================================================
     ABOUT
     ========================================================= */

  const addAboutPara = $("#addAboutPara");

  if (addAboutPara) {

    addAboutPara.addEventListener("click", function () {

      addAboutParagraph("");

    });

  }


  /* =========================================================
     VALUES
     ========================================================= */

  const addValueRow = $("#addValueRow");

  if (addValueRow) {

    addValueRow.addEventListener("click", function () {

      addValueElement("", "");

    });

  }


  /* =========================================================
     CATEGORIES
     ========================================================= */

  const addCatForm = $("#addCatForm");

  if (addCatForm) {

    addCatForm.addEventListener("submit", async function (e) {

      e.preventDefault();

      const name = $("#newCatName")?.value.trim();
      const nameEn = $("#newCatNameEn")?.value.trim();

      if (!name) {
        showToast("نام دسته‌بندی را وارد کنید");
        return;
      }

      try {

        const id = createId(name);

        const order =
          CATEGORIES.length > 0
            ? Math.max(...CATEGORIES.map(c => Number(c.order || 0))) + 1
            : 1;

        await db.collection("categories")
          .doc(id)
          .set({
            id,
            name,
            nameEn,
            order
          });

        $("#newCatName").value = "";
        $("#newCatNameEn").value = "";

        showToast("دسته‌بندی اضافه شد ✓");

        loadCategories();

      } catch (error) {

        console.error(error);

        showToast("خطا در افزودن دسته‌بندی");

      }

    });

  }


  /* =========================================================
     NEW ITEM
     ========================================================= */

  const newItemBtn = $("#newItemBtn");

  if (newItemBtn) {

    newItemBtn.addEventListener("click", function () {

      openItemModal();

    });

  }


  /* =========================================================
     ITEM FORM
     ========================================================= */

  const itemForm = $("#itemForm");

  if (itemForm) {

    itemForm.addEventListener("submit", async function (e) {

      e.preventDefault();

      await saveItem();

    });

  }


  /* =========================================================
     IMAGE PREVIEW
     ========================================================= */

  const itemImageUrl = $("#itemImageUrl");

  if (itemImageUrl) {

    itemImageUrl.addEventListener("input", function () {

      updateImagePreview(itemImageUrl.value.trim());

    });

  }


  /* =========================================================
     PUBLISH
     ========================================================= */

  const publishBtn = $("#publishBtn");

  if (publishBtn) {

    publishBtn.addEventListener("click", async function () {

      await publishData();

    });

  }


  /* =========================================================
     SEED
     ========================================================= */

  const seedBtn = $("#seedBtn");

  if (seedBtn) {

    seedBtn.addEventListener("click", async function () {

      await seedDatabase();

    });

  }


  /* =========================================================
     LOAD SETTINGS
     ========================================================= */

  async function loadSettings() {

    try {

      const snap = await db.collection("settings")
        .doc("main")
        .get();

      if (!snap.exists) {
        console.log("Settings document does not exist.");
        return;
      }

      const data = snap.data() || {};

      setValue("f-cafeName", data.cafeName);
      setValue("f-tagline", data.tagline);
      setValue("f-hoursNote", data.hoursNote);

      setValue("f-aboutTitle", data.aboutTitle);
      setValue("f-aboutIntro", data.aboutIntro);

      setValue("f-address", data.contact?.address);
      setValue("f-phone", data.contact?.phone);
      setValue("f-instagram", data.contact?.instagram);
      setValue("f-whatsapp", data.contact?.whatsapp);
      setValue("f-mapUrl", data.contact?.mapUrl);

      renderHeroImages(data.heroImages || []);
      renderHours(data.hours || []);
      renderAboutBody(data.aboutBody || []);
      renderValues(data.values || []);

    } catch (error) {

      console.error("LOAD SETTINGS ERROR:", error);

      showToast("خطا در دریافت تنظیمات");

    }

  }


  /* =========================================================
     COLLECT SETTINGS
     ========================================================= */

  function collectSettings() {

    const heroImages = [];

    $$("#heroImagesList input").forEach(input => {

      const value = input.value.trim();

      if (value) {
        heroImages.push(value);
      }

    });


    const hours = [];

    $$("#hoursList .dynamic-row").forEach(row => {

      const inputs = row.querySelectorAll("input");

      if (inputs.length >= 2) {

        hours.push({
          days: inputs[0].value.trim(),
          time: inputs[1].value.trim()
        });

      }

    });


    const aboutBody = [];

    $$("#aboutBodyList textarea").forEach(textarea => {

      const value = textarea.value.trim();

      if (value) {
        aboutBody.push(value);
      }

    });


    const values = [];

    $$("#valuesList .dynamic-row").forEach(row => {

      const inputs = row.querySelectorAll("input");

      if (inputs.length >= 2) {

        values.push({
          icon: inputs[0].value.trim(),
          label: inputs[1].value.trim()
        });

      }

    });


    return {

      cafeName: getValue("f-cafeName"),
      tagline: getValue("f-tagline"),
      hoursNote: getValue("f-hoursNote"),

      heroImages,

      hours,

      aboutTitle: getValue("f-aboutTitle"),
      aboutIntro: getValue("f-aboutIntro"),
      aboutBody,

      values,

      contact: {
        address: getValue("f-address"),
        phone: getValue("f-phone"),
        instagram: getValue("f-instagram"),
        whatsapp: getValue("f-whatsapp"),
        mapUrl: getValue("f-mapUrl")
      }

    };

  }


  /* =========================================================
     CATEGORIES LOAD
     ========================================================= */

  async function loadCategories() {

    try {

      const snap = await db.collection("categories")
        .orderBy("order")
        .get();

      CATEGORIES = [];

      snap.forEach(doc => {

        CATEGORIES.push({
          id: doc.id,
          ...doc.data()
        });

      });

      renderCategories();

      populateItemCategories();

    } catch (error) {

      console.error("LOAD CATEGORIES ERROR:", error);

      showToast("خطا در دریافت دسته‌بندی‌ها");

    }

  }


  /* =========================================================
     RENDER CATEGORIES
     ========================================================= */

  function renderCategories() {

    const container = $("#catAdminList");

    if (!container) return;

    container.innerHTML = "";

    CATEGORIES.forEach(category => {

      const row = document.createElement("div");

      row.className = "admin-list-row";

      row.innerHTML = `
        <div>
          <strong>${escapeHtml(category.name || "")}</strong>
          <small>${escapeHtml(category.nameEn || "")}</small>
        </div>

        <div style="display:flex;gap:6px;">
          <button class="btn small secondary" data-edit-cat="${category.id}">
            ویرایش
          </button>

          <button class="btn small danger" data-delete-cat="${category.id}">
            حذف
          </button>
        </div>
      `;

      container.appendChild(row);

    });


    container.querySelectorAll("[data-delete-cat]").forEach(button => {

      button.addEventListener("click", async function () {

        const id = button.dataset.deleteCat;

        const used = ITEMS.some(item => item.categoryId === id);

        if (used) {

          showToast("این دسته‌بندی دارای آیتم است و قابل حذف نیست.");

          return;

        }

        if (!confirm("این دسته‌بندی حذف شود؟")) return;

        try {

          await db.collection("categories")
            .doc(id)
            .delete();

          showToast("دسته‌بندی حذف شد");

          loadCategories();

        } catch (error) {

          console.error(error);

          showToast("خطا در حذف دسته‌بندی");

        }

      });

    });


    container.querySelectorAll("[data-edit-cat]").forEach(button => {

      button.addEventListener("click", async function () {

        const id = button.dataset.editCat;

        const category = CATEGORIES.find(c => c.id === id);

        if (!category) return;

        const name = prompt("نام دسته‌بندی:", category.name || "");

        if (name === null) return;

        const nameEn = prompt(
          "نام انگلیسی:",
          category.nameEn || ""
        );

        if (nameEn === null) return;

        try {

          await db.collection("categories")
            .doc(id)
            .update({
              name: name.trim(),
              nameEn: nameEn.trim()
            });

          showToast("دسته‌بندی ویرایش شد ✓");

          loadCategories();

        } catch (error) {

          console.error(error);

          showToast("خطا در ویرایش دسته‌بندی");

        }

      });

    });

  }


  /* =========================================================
     LOAD ITEMS
     ========================================================= */

  async function loadItems() {

    try {

      const snap = await db.collection("items")
        .orderBy("order")
        .get();

      ITEMS = [];

      snap.forEach(doc => {

        ITEMS.push({
          id: doc.id,
          ...doc.data()
        });

      });

      renderItems();

    } catch (error) {

      console.error("LOAD ITEMS ERROR:", error);

      showToast("خطا در دریافت آیتم‌ها");

    }

  }


  /* =========================================================
     RENDER ITEMS
     ========================================================= */

  function renderItems() {

    const container = $("#itemsAdminList");

    if (!container) return;

    container.innerHTML = "";

    ITEMS.forEach(item => {

      const category = CATEGORIES.find(
        c => c.id === item.categoryId
      );

      const categoryName = category
        ? category.name
        : "بدون دسته‌بندی";


      const row = document.createElement("div");

      row.className = "admin-list-row";

      row.innerHTML = `
        <div style="display:flex;gap:12px;align-items:center;">

          ${
            item.image
              ? `<img src="${escapeAttribute(item.image)}"
                       style="width:55px;height:55px;object-fit:cover;border-radius:10px;">`
              : ""
          }

          <div>
            <strong>${escapeHtml(item.title || "")}</strong>

            <small>
              ${escapeHtml(categoryName)}
              ${item.isNew ? " • جدید" : ""}
              ${item.available === false ? " • ناموجود" : ""}
            </small>

            <div>${escapeHtml(item.price || "")}</div>
          </div>

        </div>

        <div style="display:flex;gap:6px;">

          <button class="btn small secondary"
                  data-edit-item="${item.id}">
            ویرایش
          </button>

          <button class="btn small danger"
                  data-delete-item="${item.id}">
            حذف
          </button>

        </div>
      `;

      container.appendChild(row);

    });


    container.querySelectorAll("[data-edit-item]").forEach(button => {

      button.addEventListener("click", function () {

        const id = button.dataset.editItem;

        const item = ITEMS.find(i => i.id === id);

        if (item) {
          openItemModal(item);
        }

      });

    });


    container.querySelectorAll("[data-delete-item]").forEach(button => {

      button.addEventListener("click", async function () {

        const id = button.dataset.deleteItem;

        if (!confirm("این آیتم حذف شود؟")) return;

        try {

          await db.collection("items")
            .doc(id)
            .delete();

          showToast("آیتم حذف شد");

          loadItems();

        } catch (error) {

          console.error(error);

          showToast("خطا در حذف آیتم");

        }

      });

    });

  }


  /* =========================================================
     OPEN ITEM MODAL
     ========================================================= */

  function openItemModal(item = null) {

    const modal = $("#itemModal");

    if (!modal) return;

    editingItemId = item?.id || null;

    populateItemCategories();

    setValue("itemTitle", item?.title || "");
    setValue("itemSubtitle", item?.subtitle || "");
    setValue("itemDesc", item?.desc || "");
    setValue("itemPrice", item?.price || "");
    setValue("itemImageUrl", item?.image || "");

    const categorySelect = $("#itemCategory");

    if (categorySelect) {
      categorySelect.value = item?.categoryId || "";
    }

    const isNew = $("#itemIsNew");
    const available = $("#itemAvailable");

    if (isNew) {
      isNew.checked = item?.isNew || false;
    }

    if (available) {
      available.checked =
        item?.available !== false;
    }

    updateImagePreview(item?.image || "");

    modal.style.display = "flex";

  }


  /* =========================================================
     CLOSE MODAL
     ========================================================= */

  function closeItemModal() {

    const modal = $("#itemModal");

    if (modal) {
      modal.style.display = "none";
    }

    editingItemId = null;

  }


  /* =========================================================
     ITEM MODAL CLOSE BUTTONS
     ========================================================= */

  document.addEventListener("click", function (e) {

    if (
      e.target.matches(
        "#itemModal .close, #itemModal [data-close], #itemModal .modal-close"
      )
    ) {

      closeItemModal();

    }

  });


  /* =========================================================
     POPULATE CATEGORY SELECT
     ========================================================= */

  function populateItemCategories() {

    const select = $("#itemCategory");

    if (!select) return;

    const current = select.value;

    select.innerHTML = `
      <option value="">انتخاب دسته‌بندی</option>
    `;

    CATEGORIES.forEach(category => {

      const option = document.createElement("option");

      option.value = category.id;
      option.textContent = category.name;

      select.appendChild(option);

    });

    if (current) {
      select.value = current;
    }

  }


  /* =========================================================
     SAVE ITEM
     ========================================================= */

  async function saveItem() {

    try {

      const title = getValue("itemTitle");
      const categoryId = getValue("itemCategory");

      if (!title) {
        showToast("نام آیتم را وارد کنید");
        return;
      }

      if (!categoryId) {
        showToast("دسته‌بندی را انتخاب کنید");
        return;
      }

      const categoryExists = CATEGORIES.some(
        c => c.id === categoryId
      );

      if (!categoryExists) {
        showToast("دسته‌بندی انتخاب‌شده معتبر نیست");
        return;
      }

      const data = {

        categoryId,

        title,

        subtitle: getValue("itemSubtitle"),

        desc: getValue("itemDesc"),

        price: getValue("itemPrice"),

        image: getValue("itemImageUrl"),

        isNew: $("#itemIsNew")?.checked || false,

        available:
          $("#itemAvailable")
            ? $("#itemAvailable").checked
            : true

      };


      if (editingItemId) {

        await db.collection("items")
          .doc(editingItemId)
          .update(data);

        showToast("آیتم ویرایش شد ✓");

      } else {

        const order =
          ITEMS.length > 0
            ? Math.max(...ITEMS.map(i => Number(i.order || 0))) + 1
            : 1;

        data.order = order;

        const id = createId(title);

        await db.collection("items")
          .doc(id)
          .set({
            id,
            ...data
          });

        showToast("آیتم اضافه شد ✓");

      }

      closeItemModal();

      loadItems();

    } catch (error) {

      console.error("SAVE ITEM ERROR:", error);

      showToast("خطا در ذخیره آیتم");

    }

  }


  /* =========================================================
     PUBLISH DATA.JSON
     ========================================================= */

  async function publishData() {

    try {

      showToast("در حال آماده‌سازی فایل data.json...");

      const settingsSnap = await db.collection("settings")
        .doc("main")
        .get();

      const categoriesSnap = await db.collection("categories")
        .orderBy("order")
        .get();

      const itemsSnap = await db.collection("items")
        .orderBy("order")
        .get();


      const settings = settingsSnap.exists
        ? settingsSnap.data()
        : {};


      const categories = [];

      categoriesSnap.forEach(doc => {

        categories.push({
          id: doc.id,
          ...doc.data()
        });

      });


      const items = [];

      itemsSnap.forEach(doc => {

        items.push({
          id: doc.id,
          ...doc.data()
        });

      });


      /* بررسی دسته‌بندی آیتم‌ها */

      const categoryIds = new Set(
        categories.map(category => category.id)
      );

      const invalidItems = items.filter(
        item => !categoryIds.has(item.categoryId)
      );


      if (invalidItems.length > 0) {

        const names = invalidItems
          .map(item => item.title || item.id)
          .join("، ");

        showToast(
          "خطا: بعضی آیتم‌ها دسته‌بندی معتبر ندارند: " + names
        );

        return;

      }


      const output = {

        settings,

        categories,

        items

      };


      const json = JSON.stringify(
        output,
        null,
        2
      );


      const blob = new Blob(
        [json],
        {
          type: "application/json;charset=utf-8"
        }
      );


      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = "data.json";

      document.body.appendChild(link);

      link.click();

      link.remove();

      URL.revokeObjectURL(url);


      showToast(
        "data.json آماده شد ✓ فایل را در GitHub جایگزین کنید."
      );

    } catch (error) {

      console.error("PUBLISH ERROR:", error);

      showToast(
        "خطا در ساخت data.json"
      );

    }

  }


  /* =========================================================
     SEED DATABASE
     ========================================================= */

  async function seedDatabase() {

    if (
      !confirm(
        "اطلاعات نمونه به Firebase اضافه شود؟"
      )
    ) {
      return;
    }

    try {

      const categories = [

        {
          id: "coffee",
          name: "قهوه",
          nameEn: "Coffee",
          order: 1
        },

        {
          id: "cold-drinks",
          name: "نوشیدنی سرد",
          nameEn: "Cold Drinks",
          order: 2
        },

        {
          id: "dessert",
          name: "دسر",
          nameEn: "Dessert",
          order: 3
        },

        {
          id: "breakfast",
          name: "صبحانه",
          nameEn: "Breakfast",
          order: 4
        }

      ];


      for (const category of categories) {

        await db.collection("categories")
          .doc(category.id)
          .set(category);

      }


      const items = [

        {
          id: "espresso",
          categoryId: "coffee",
          title: "اسپرسو",
          subtitle: "",
          desc: "دبل‌شات، طعم غلیظ",
          price: "۹۵٬۰۰۰ تومان",
          image: "",
          isNew: false,
          available: true,
          order: 1
        },

        {
          id: "latte",
          categoryId: "coffee",
          title: "لاته",
          subtitle: "",
          desc: "اسپرسو با شیر بخارداده",
          price: "۱۲۰٬۰۰۰ تومان",
          image: "",
          isNew: false,
          available: true,
          order: 2
        },

        {
          id: "cheesecake",
          categoryId: "dessert",
          title: "چیزکیک",
          subtitle: "",
          desc: "با تاپینگ توت قرمز",
          price: "۱۸۵٬۰۰۰ تومان",
          image: "",
          isNew: true,
          available: true,
          order: 3
        },

        {
          id: "croissant",
          categoryId: "breakfast",
          title: "کروسان",
          subtitle: "",
          desc: "کره‌ای، تازه از فر",
          price: "۱۴۰٬۰۰۰ تومان",
          image: "",
          isNew: false,
          available: true,
          order: 4
        }

      ];


      for (const item of items) {

        await db.collection("items")
          .doc(item.id)
          .set(item);

      }


      await db.collection("settings")
        .doc("main")
        .set({

          cafeName: "PLAN B",

          tagline: "همیشه یه نقشه‌ی بهتر هست",

          hoursNote: "الان باز هستیم",

          heroImages: [],

          hours: [
            {
              days: "شنبه تا چهارشنبه",
              time: "۹:۰۰ - ۲۳:۰۰"
            },
            {
              days: "پنجشنبه و جمعه",
              time: "۹:۰۰ - ۲۴:۰۰"
            }
          ],

          aboutTitle: "داستان PLAN B",

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
            address: "تهران، خیابان ...",
            phone: "021-00000000",
            instagram: "https://instagram.com/planb.cafe",
            whatsapp: "",
            mapUrl: "https://maps.google.com"
          }

        }, { merge: true });


      showToast(
        "اطلاعات نمونه با موفقیت ساخته شد ✓"
      );

      loadCategories();
      loadItems();
      loadSettings();

    } catch (error) {

      console.error("SEED ERROR:", error);

      showToast(
        "خطا در ساخت اطلاعات نمونه"
      );

    }

  }


  /* =========================================================
     DYNAMIC SETTINGS UI
     ========================================================= */

  function renderHeroImages(images) {

    const container = $("#heroImagesList");

    if (!container) return;

    container.innerHTML = "";

    images.forEach(image => {
      addHeroImageRow(image);
    });

  }


  function addHeroImageRow(value) {

    const container = $("#heroImagesList");

    if (!container) return;

    const row = document.createElement("div");

    row.className = "dynamic-row";

    row.innerHTML = `
      <input
        type="url"
        value="${escapeAttribute(value)}"
        placeholder="URL تصویر"
      >

      <button type="button"
              class="btn small danger">
        حذف
      </button>
    `;

    row.querySelector("button")
      .addEventListener("click", () => row.remove());

    container.appendChild(row);

  }


  function renderHours(hours) {

    const container = $("#hoursList");

    if (!container) return;

    container.innerHTML = "";

    hours.forEach(hour => {

      addHoursRowElement(
        hour.days || "",
        hour.time || ""
      );

    });

  }


  function addHoursRowElement(days, time) {

    const container = $("#hoursList");

    if (!container) return;

    const row = document.createElement("div");

    row.className = "dynamic-row";

    row.innerHTML = `
      <input
        type="text"
        value="${escapeAttribute(days)}"
        placeholder="روزها"
      >

      <input
        type="text"
        value="${escapeAttribute(time)}"
        placeholder="ساعت"
      >

      <button type="button"
              class="btn small danger">
        حذف
      </button>
    `;

    row.querySelector("button")
      .addEventListener("click", () => row.remove());

    container.appendChild(row);

  }


  function renderAboutBody(paragraphs) {

    const container = $("#aboutBodyList");

    if (!container) return;

    container.innerHTML = "";

    paragraphs.forEach(text => {

      addAboutParagraph(text);

    });

  }


  function addAboutParagraph(text) {

    const container = $("#aboutBodyList");

    if (!container) return;

    const row = document.createElement("div");

    row.className = "dynamic-row";

    row.innerHTML = `
      <textarea
        rows="3"
        placeholder="متن پاراگراف"
      >${escapeHtml(text)}</textarea>

      <button type="button"
              class="btn small danger">
        حذف
      </button>
    `;

    row.querySelector("button")
      .addEventListener("click", () => row.remove());

    container.appendChild(row);

  }


  function renderValues(values) {

    const container = $("#valuesList");

    if (!container) return;

    container.innerHTML = "";

    values.forEach(value => {

      addValueElement(
        value.icon || "",
        value.label || ""
      );

    });

  }


  function addValueElement(icon, label) {

    const container = $("#valuesList");

    if (!container) return;

    const row = document.createElement("div");

    row.className = "dynamic-row";

    row.innerHTML = `
      <input
        type="text"
        value="${escapeAttribute(icon)}"
        placeholder="آیکون"
      >

      <input
        type="text"
        value="${escapeAttribute(label)}"
        placeholder="عنوان"
      >

      <button type="button"
              class="btn small danger">
        حذف
      </button>
    `;

    row.querySelector("button")
      .addEventListener("click", () => row.remove());

    container.appendChild(row);

  }


  /* =========================================================
     IMAGE PREVIEW
     ========================================================= */

  function updateImagePreview(url) {

    const box = $("#imgPreviewBox");

    if (!box) return;

    if (!url) {

      box.innerHTML = "";

      return;

    }

    box.innerHTML = `
      <img
        src="${escapeAttribute(url)}"
        style="max-width:180px;max-height:180px;border-radius:12px;object-fit:cover;"
        onerror="this.parentElement.innerHTML='<small>تصویر قابل نمایش نیست</small>'"
      >
    `;

  }


  /* =========================================================
     HELPERS
     ========================================================= */

  function getValue(id) {

    const element = document.getElementById(id);

    return element
      ? element.value.trim()
      : "";

  }


  function setValue(id, value) {

    const element = document.getElementById(id);

    if (element) {
      element.value = value || "";
    }

  }


  function createId(text) {

    return text
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\u0600-\u06FF-]/g, "")
      .replace(/-+/g, "-")
      .substring(0, 50)
      + "-" +
      Math.random()
        .toString(36)
        .substring(2, 7);

  }


  function escapeHtml(value) {

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }


  function escapeAttribute(value) {

    return escapeHtml(value);

  }


  function showToast(message) {

    const toast = $("#toast");

    if (!toast) {
      console.log("TOAST:", message);
      return;
    }

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(window.__planBToastTimer);

    window.__planBToastTimer = setTimeout(function () {

      toast.classList.remove("show");

    }, 3500);

  }


  function showFatalError(message) {

    console.error(message);

    document.body.insertAdjacentHTML(
      "afterbegin",

      `
      <div style="
        position:fixed;
        top:0;
        left:0;
        right:0;
        z-index:999999;
        background:#b3261e;
        color:#fff;
        padding:16px;
        text-align:center;
        direction:rtl;
        font-family:Arial,sans-serif;
        font-size:15px;
        line-height:1.8;
      ">
        ${escapeHtml(message)}
      </div>
      `

    );

  }


  function firebaseErrorMessage(error) {

    const code = error?.code || "";

    const messages = {

      "auth/invalid-credential":
        "ایمیل یا رمز عبور اشتباه است.",

      "auth/user-not-found":
        "کاربری با این ایمیل پیدا نشد.",

      "auth/wrong-password":
        "رمز عبور اشتباه است.",

      "auth/invalid-email":
        "فرمت ایمیل صحیح نیست.",

      "auth/too-many-requests":
        "تعداد تلاش‌ها زیاد است. کمی بعد دوباره امتحان کنید."

    };

    return messages[code]
      || error?.message
      || "خطا در ورود";

  }

});
