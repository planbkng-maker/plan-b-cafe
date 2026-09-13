/* =========================================================
   PLAN B - ADMIN PANEL
   Stable version
   ========================================================= */

(function () {
  "use strict";

  let CATEGORIES = [];
  let ITEMS = [];
  let editingItemId = null;
  let started = false;

  /* =========================================================
     START
     ========================================================= */

  function startAdmin() {

    if (started) return;

    started = true;

    console.log("PLAN B ADMIN: starting...");

    const loginScreen = document.getElementById("loginScreen");
    const adminApp = document.getElementById("adminApp");

    /*
      اگر عناصر هنوز وجود ندارند، چند لحظه صبر می‌کنیم.
      این قسمت عمداً به جای خطای فوری، صفحه را دوباره بررسی می‌کند.
    */

    if (!loginScreen || !adminApp) {

      console.warn(
        "PLAN B ADMIN: loginScreen/adminApp not found. Retrying..."
      );

      started = false;

      let attempts = 0;

      const retry = setInterval(function () {

        attempts++;

        const login = document.getElementById("loginScreen");
        const app = document.getElementById("adminApp");

        if (login && app) {

          clearInterval(retry);

          startAdmin();

        } else if (attempts >= 30) {

          clearInterval(retry);

          showFatalError(
            "ساختار صفحه مدیریت پیدا نشد. لطفاً admin.html را Refresh کنید."
          );

        }

      }, 200);

      return;
    }

    /* =====================================================
       FIREBASE
       ===================================================== */

    if (
      typeof firebase === "undefined" ||
      typeof auth === "undefined" ||
      typeof db === "undefined"
    ) {

      showFatalError(
        "Firebase به‌درستی بارگذاری نشده است. فایل‌های Firebase و firebase-config.js را بررسی کنید."
      );

      return;
    }

    /* =====================================================
       AUTH
       ===================================================== */

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

    /* =====================================================
       LOGIN
       ===================================================== */

    const loginForm = document.getElementById("loginForm");

    if (loginForm) {

      loginForm.addEventListener("submit", async function (e) {

        e.preventDefault();

        const emailElement =
          document.getElementById("loginEmail");

        const passwordElement =
          document.getElementById("loginPass");

        const errorElement =
          document.getElementById("loginError");

        const email =
          emailElement ? emailElement.value.trim() : "";

        const password =
          passwordElement ? passwordElement.value : "";

        if (errorElement) {
          errorElement.textContent = "";
        }

        if (!email || !password) {

          if (errorElement) {
            errorElement.textContent =
              "ایمیل و رمز عبور را وارد کنید.";
          }

          return;
        }

        try {

          await auth.signInWithEmailAndPassword(
            email,
            password
          );

        } catch (error) {

          console.error("LOGIN ERROR:", error);

          if (errorElement) {
            errorElement.textContent =
              firebaseErrorMessage(error);
          }

        }

      });

    }

    /* =====================================================
       LOGOUT
       ===================================================== */

    const logoutBtn =
      document.getElementById("logoutBtn");

    if (logoutBtn) {

      logoutBtn.addEventListener("click", async function () {

        try {

          await auth.signOut();

        } catch (error) {

          console.error(error);

          showToast("خطا در خروج از حساب");

        }

      });

    }

    /* =====================================================
       TABS
       ===================================================== */

    document.querySelectorAll(".admin-tab")
      .forEach(function (tab) {

        tab.addEventListener("click", function () {

          const sectionName =
            tab.dataset.sec;

          document
            .querySelectorAll(".admin-tab")
            .forEach(function (t) {
              t.classList.remove("active");
            });

          tab.classList.add("active");

          document
            .querySelectorAll(".admin-section")
            .forEach(function (section) {
              section.style.display = "none";
            });

          const target =
            document.getElementById(
              "sec-" + sectionName
            );

          if (target) {
            target.style.display = "block";
          }

        });

      });

    /* =====================================================
       SETTINGS FORM
       ===================================================== */

    const settingsForm =
      document.getElementById("settingsForm");

    if (settingsForm) {

      settingsForm.addEventListener(
        "submit",
        async function (e) {

          e.preventDefault();

          try {

            const settings =
              collectSettings();

            await db
              .collection("settings")
              .doc("main")
              .set(settings, { merge: true });

            showToast(
              "تنظیمات با موفقیت ذخیره شد ✓"
            );

          } catch (error) {

            console.error(
              "SETTINGS SAVE ERROR:",
              error
            );

            showToast(
              "خطا در ذخیره تنظیمات"
            );

          }

        }
      );

    }

    /* =====================================================
       HERO IMAGE
       ===================================================== */

    const addHeroImg =
      document.getElementById("addHeroImg");

    if (addHeroImg) {

      addHeroImg.addEventListener(
        "click",
        function () {
          addHeroImageRow("");
        }
      );

    }

    /* =====================================================
       HOURS
       ===================================================== */

    const addHoursRow =
      document.getElementById("addHoursRow");

    if (addHoursRow) {

      addHoursRow.addEventListener(
        "click",
        function () {
          addHoursRowElement("", "");
        }
      );

    }

    /* =====================================================
       ABOUT
       ===================================================== */

    const addAboutPara =
      document.getElementById("addAboutPara");

    if (addAboutPara) {

      addAboutPara.addEventListener(
        "click",
        function () {
          addAboutParagraph("");
        }
      );

    }

    /* =====================================================
       VALUES
       ===================================================== */

    const addValueRow =
      document.getElementById("addValueRow");

    if (addValueRow) {

      addValueRow.addEventListener(
        "click",
        function () {
          addValueElement("", "");
        }
      );

    }

    /* =====================================================
       CATEGORY
       ===================================================== */

    const addCatForm =
      document.getElementById("addCatForm");

    if (addCatForm) {

      addCatForm.addEventListener(
        "submit",
        async function (e) {

          e.preventDefault();

          const name =
            getValue("newCatName");

          const nameEn =
            getValue("newCatNameEn");

          if (!name) {

            showToast(
              "نام دسته‌بندی را وارد کنید"
            );

            return;
          }

          try {

            const id =
              createId(name);

            const order =
              CATEGORIES.length
                ? Math.max(
                    ...CATEGORIES.map(
                      c => Number(c.order || 0)
                    )
                  ) + 1
                : 1;

            await db
              .collection("categories")
              .doc(id)
              .set({
                id: id,
                name: name,
                nameEn: nameEn,
                order: order
              });

            setValue("newCatName", "");
            setValue("newCatNameEn", "");

            showToast(
              "دسته‌بندی اضافه شد ✓"
            );

            await loadCategories();

          } catch (error) {

            console.error(
              "CATEGORY ERROR:",
              error
            );

            showToast(
              "خطا در افزودن دسته‌بندی"
            );

          }

        }
      );

    }

    /* =====================================================
       NEW ITEM
       ===================================================== */

    const newItemBtn =
      document.getElementById("newItemBtn");

    if (newItemBtn) {

      newItemBtn.addEventListener(
        "click",
        function () {
          openItemModal();
        }
      );

    }

    /* =====================================================
       ITEM FORM
       ===================================================== */

    const itemForm =
      document.getElementById("itemForm");

    if (itemForm) {

      itemForm.addEventListener(
        "submit",
        async function (e) {

          e.preventDefault();

          await saveItem();

        }
      );

    }

    /* =====================================================
       IMAGE PREVIEW
       ===================================================== */

    const itemImageUrl =
      document.getElementById("itemImageUrl");

    if (itemImageUrl) {

      itemImageUrl.addEventListener(
        "input",
        function () {

          updateImagePreview(
            itemImageUrl.value.trim()
          );

        }
      );

    }

    /* =====================================================
       PUBLISH
       ===================================================== */

    const publishBtn =
      document.getElementById("publishBtn");

    if (publishBtn) {

      publishBtn.addEventListener(
        "click",
        publishData
      );

    }

    /* =====================================================
       SEED
       ===================================================== */

    const seedBtn =
      document.getElementById("seedBtn");

    if (seedBtn) {

      seedBtn.addEventListener(
        "click",
        seedDatabase
      );

    }

    /* =====================================================
       CLOSE MODAL
       ===================================================== */

    document.addEventListener(
      "click",
      function (e) {

        if (
          e.target.matches(
            "#itemModal .close, " +
            "#itemModal [data-close], " +
            "#itemModal .modal-close"
          )
        ) {

          closeItemModal();

        }

      }
    );

    console.log(
      "PLAN B ADMIN: started successfully ✓"
    );

  }


  /* =========================================================
     SETTINGS
     ========================================================= */

  async function loadSettings() {

    try {

      const snap =
        await db
          .collection("settings")
          .doc("main")
          .get();

      if (!snap.exists) {
        return;
      }

      const data =
        snap.data() || {};

      setValue(
        "f-cafeName",
        data.cafeName
      );

      setValue(
        "f-tagline",
        data.tagline
      );

      setValue(
        "f-hoursNote",
        data.hoursNote
      );

      setValue(
        "f-aboutTitle",
        data.aboutTitle
      );

      setValue(
        "f-aboutIntro",
        data.aboutIntro
      );

      setValue(
        "f-address",
        data.contact?.address
      );

      setValue(
        "f-phone",
        data.contact?.phone
      );

      setValue(
        "f-instagram",
        data.contact?.instagram
      );

      setValue(
        "f-whatsapp",
        data.contact?.whatsapp
      );

      setValue(
        "f-mapUrl",
        data.contact?.mapUrl
      );

      renderHeroImages(
        data.heroImages || []
      );

      renderHours(
        data.hours || []
      );

      renderAboutBody(
        data.aboutBody || []
      );

      renderValues(
        data.values || []
      );

    } catch (error) {

      console.error(
        "LOAD SETTINGS ERROR:",
        error
      );

      showToast(
        "خطا در دریافت تنظیمات"
      );

    }

  }


  /* =========================================================
     COLLECT SETTINGS
     ========================================================= */

  function collectSettings() {

    const heroImages = [];

    document
      .querySelectorAll(
        "#heroImagesList input"
      )
      .forEach(function (input) {

        const value =
          input.value.trim();

        if (value) {
          heroImages.push(value);
        }

      });


    const hours = [];

    document
      .querySelectorAll(
        "#hoursList .dynamic-row"
      )
      .forEach(function (row) {

        const inputs =
          row.querySelectorAll("input");

        if (inputs.length >= 2) {

          hours.push({
            days:
              inputs[0].value.trim(),

            time:
              inputs[1].value.trim()
          });

        }

      });


    const aboutBody = [];

    document
      .querySelectorAll(
        "#aboutBodyList textarea"
      )
      .forEach(function (textarea) {

        const value =
          textarea.value.trim();

        if (value) {
          aboutBody.push(value);
        }

      });


    const values = [];

    document
      .querySelectorAll(
        "#valuesList .dynamic-row"
      )
      .forEach(function (row) {

        const inputs =
          row.querySelectorAll("input");

        if (inputs.length >= 2) {

          values.push({
            icon:
              inputs[0].value.trim(),

            label:
              inputs[1].value.trim()
          });

        }

      });


    return {

      cafeName:
        getValue("f-cafeName"),

      tagline:
        getValue("f-tagline"),

      hoursNote:
        getValue("f-hoursNote"),

      heroImages:

        heroImages,

      hours:

        hours,

      aboutTitle:
        getValue("f-aboutTitle"),

      aboutIntro:
        getValue("f-aboutIntro"),

      aboutBody:

        aboutBody,

      values:

        values,

      contact: {

        address:
          getValue("f-address"),

        phone:
          getValue("f-phone"),

        instagram:
          getValue("f-instagram"),

        whatsapp:
          getValue("f-whatsapp"),

        mapUrl:
          getValue("f-mapUrl")

      }

    };

  }


  /* =========================================================
     CATEGORIES
     ========================================================= */

  async function loadCategories() {

    try {

      const snap =
        await db
          .collection("categories")
          .orderBy("order")
          .get();

      CATEGORIES = [];

      snap.forEach(function (doc) {

        CATEGORIES.push({
          id: doc.id,
          ...doc.data()
        });

      });

      renderCategories();
      populateItemCategories();

    } catch (error) {

      console.error(
        "LOAD CATEGORIES ERROR:",
        error
      );

      showToast(
        "خطا در دریافت دسته‌بندی‌ها"
      );

    }

  }


  function renderCategories() {

    const container =
      document.getElementById(
        "catAdminList"
      );

    if (!container) return;

    container.innerHTML = "";

    CATEGORIES.forEach(function (category) {

      const row =
        document.createElement("div");

      row.className =
        "admin-list-row";

      row.innerHTML = `

        <div>

          <strong>
            ${escapeHtml(
              category.name || ""
            )}
          </strong>

          <small>
            ${escapeHtml(
              category.nameEn || ""
            )}
          </small>

        </div>

        <div
          style="
            display:flex;
            gap:6px;
          "
        >

          <button
            class="btn small secondary"
            data-edit-cat="${escapeAttribute(
              category.id
            )}"
          >
            ویرایش
          </button>

          <button
            class="btn small danger"
            data-delete-cat="${escapeAttribute(
              category.id
            )}"
          >
            حذف
          </button>

        </div>

      `;

      container.appendChild(row);

    });


    container
      .querySelectorAll(
        "[data-delete-cat]"
      )
      .forEach(function (button) {

        button.addEventListener(
          "click",
          async function () {

            const id =
              button.dataset.deleteCat;

            const used =
              ITEMS.some(
                item =>
                  item.categoryId === id
              );

            if (used) {

              showToast(
                "این دسته‌بندی دارای آیتم است و قابل حذف نیست."
              );

              return;
            }

            if (
              !confirm(
                "این دسته‌بندی حذف شود؟"
              )
            ) {
              return;
            }

            try {

              await db
                .collection("categories")
                .doc(id)
                .delete();

              showToast(
                "دسته‌بندی حذف شد ✓"
              );

              await loadCategories();

            } catch (error) {

              console.error(error);

              showToast(
                "خطا در حذف دسته‌بندی"
              );

            }

          }
        );

      });


    container
      .querySelectorAll(
        "[data-edit-cat]"
      )
      .forEach(function (button) {

        button.addEventListener(
          "click",
          async function () {

            const id =
              button.dataset.editCat;

            const category =
              CATEGORIES.find(
                c => c.id === id
              );

            if (!category) return;

            const name =
              prompt(
                "نام دسته‌بندی:",
                category.name || ""
              );

            if (name === null) {
              return;
            }

            const nameEn =
              prompt(
                "نام انگلیسی:",
                category.nameEn || ""
              );

            if (nameEn === null) {
              return;
            }

            try {

              await db
                .collection("categories")
                .doc(id)
                .update({
                  name:
                    name.trim(),

                  nameEn:
                    nameEn.trim()
                });

              showToast(
                "دسته‌بندی ویرایش شد ✓"
              );

              await loadCategories();

            } catch (error) {

              console.error(error);

              showToast(
                "خطا در ویرایش دسته‌بندی"
              );

            }

          }
        );

      });

  }


  /* =========================================================
     ITEMS
     ========================================================= */

  async function loadItems() {

    try {

      const snap =
        await db
          .collection("items")
          .orderBy("order")
          .get();

      ITEMS = [];

      snap.forEach(function (doc) {

        ITEMS.push({
          id: doc.id,
          ...doc.data()
        });

      });

      renderItems();

    } catch (error) {

      console.error(
        "LOAD ITEMS ERROR:",
        error
      );

      showToast(
        "خطا در دریافت آیتم‌ها"
      );

    }

  }


  function renderItems() {

    const container =
      document.getElementById(
        "itemsAdminList"
      );

    if (!container) return;

    container.innerHTML = "";

    ITEMS.forEach(function (item) {

      const category =
        CATEGORIES.find(
          c =>
            c.id === item.categoryId
        );

      const categoryName =
        category
          ? category.name
          : "بدون دسته‌بندی";


      const row =
        document.createElement("div");

      row.className =
        "admin-list-row";

      row.innerHTML = `

        <div
          style="
            display:flex;
            gap:12px;
            align-items:center;
          "
        >

          ${
            item.image
              ? `
                <img
                  src="${escapeAttribute(
                    item.image
                  )}"
                  style="
                    width:55px;
                    height:55px;
                    object-fit:cover;
                    border-radius:10px;
                  "
                >
              `
              : ""
          }

          <div>

            <strong>
              ${escapeHtml(
                item.title || ""
              )}
            </strong>

            <small>

              ${escapeHtml(
                categoryName
              )}

              ${
                item.isNew
                  ? " • جدید"
                  : ""
              }

              ${
                item.available === false
                  ? " • ناموجود"
                  : ""
              }

            </small>

            <div>
              ${escapeHtml(
                item.price || ""
              )}
            </div>

          </div>

        </div>

        <div
          style="
            display:flex;
            gap:6px;
          "
        >

          <button
            class="btn small secondary"
            data-edit-item="${escapeAttribute(
              item.id
            )}"
          >
            ویرایش
          </button>

          <button
            class="btn small danger"
            data-delete-item="${escapeAttribute(
              item.id
            )}"
          >
            حذف
          </button>

        </div>

      `;

      container.appendChild(row);

    });


    container
      .querySelectorAll(
        "[data-edit-item]"
      )
      .forEach(function (button) {

        button.addEventListener(
          "click",
          function () {

            const id =
              button.dataset.editItem;

            const item =
              ITEMS.find(
                i => i.id === id
              );

            if (item) {
              openItemModal(item);
            }

          }
        );

      });


    container
      .querySelectorAll(
        "[data-delete-item]"
      )
      .forEach(function (button) {

        button.addEventListener(
          "click",
          async function () {

            const id =
              button.dataset.deleteItem;

            if (
              !confirm(
                "این آیتم حذف شود؟"
              )
            ) {
              return;
            }

            try {

              await db
                .collection("items")
                .doc(id)
                .delete();

              showToast(
                "آیتم حذف شد ✓"
              );

              await loadItems();

            } catch (error) {

              console.error(error);

              showToast(
                "خطا در حذف آیتم"
              );

            }

          }
        );

      });

  }


  /* =========================================================
     ITEM MODAL
     ========================================================= */

  function openItemModal(item) {

    const modal =
      document.getElementById(
        "itemModal"
      );

    if (!modal) return;

    editingItemId =
      item?.id || null;

    populateItemCategories();

    setValue(
      "itemTitle",
      item?.title || ""
    );

    setValue(
      "itemSubtitle",
      item?.subtitle || ""
    );

    setValue(
      "itemDesc",
      item?.desc || ""
    );

    setValue(
      "itemPrice",
      item?.price || ""
    );

    setValue(
      "itemImageUrl",
      item?.image || ""
    );

    const category =
      document.getElementById(
        "itemCategory"
      );

    if (category) {
      category.value =
        item?.categoryId || "";
    }

    const isNew =
      document.getElementById(
        "itemIsNew"
      );

    if (isNew) {
      isNew.checked =
        !!item?.isNew;
    }

    const available =
      document.getElementById(
        "itemAvailable"
      );

    if (available) {
      available.checked =
        item?.available !== false;
    }

    updateImagePreview(
      item?.image || ""
    );

    modal.style.display =
      "flex";

  }


  function closeItemModal() {

    const modal =
      document.getElementById(
        "itemModal"
      );

    if (modal) {
      modal.style.display =
        "none";
    }

    editingItemId = null;

  }


  function populateItemCategories() {

    const select =
      document.getElementById(
        "itemCategory"
      );

    if (!select) return;

    const current =
      select.value;

    select.innerHTML =
      `<option value="">
        انتخاب دسته‌بندی
      </option>`;

    CATEGORIES.forEach(
      function (category) {

        const option =
          document.createElement(
            "option"
          );

        option.value =
          category.id;

        option.textContent =
          category.name;

        select.appendChild(
          option
        );

      }
    );

    if (current) {
      select.value = current;
    }

  }


  async function saveItem() {

    try {

      const title =
        getValue("itemTitle");

      const categoryId =
        getValue("itemCategory");

      if (!title) {

        showToast(
          "نام آیتم را وارد کنید"
        );

        return;
      }

      if (!categoryId) {

        showToast(
          "دسته‌بندی را انتخاب کنید"
        );

        return;
      }

      const categoryExists =
        CATEGORIES.some(
          c =>
            c.id === categoryId
        );

      if (!categoryExists) {

        showToast(
          "دسته‌بندی انتخاب‌شده معتبر نیست"
        );

        return;
      }

      const data = {

        categoryId:

          categoryId,

        title:

          title,

        subtitle:

          getValue(
            "itemSubtitle"
          ),

        desc:

          getValue(
            "itemDesc"
          ),

        price:

          getValue(
            "itemPrice"
          ),

        image:

          getValue(
            "itemImageUrl"
          ),

        isNew:

          document.getElementById(
            "itemIsNew"
          )?.checked || false,

        available:

          document.getElementById(
            "itemAvailable"
          )
            ? document.getElementById(
                "itemAvailable"
              ).checked
            : true

      };


      if (editingItemId) {

        await db
          .collection("items")
          .doc(editingItemId)
          .update(data);

        showToast(
          "آیتم ویرایش شد ✓"
        );

      } else {

        const order =
          ITEMS.length
            ? Math.max(
                ...ITEMS.map(
                  i =>
                    Number(
                      i.order || 0
                    )
                )
              ) + 1
            : 1;

        data.order =
          order;

        const id =
          createId(title);

        await db
          .collection("items")
          .doc(id)
          .set({
            id: id,
            ...data
          });

        showToast(
          "آیتم اضافه شد ✓"
        );

      }

      closeItemModal();

      await loadItems();

    } catch (error) {

      console.error(
        "SAVE ITEM ERROR:",
        error
      );

      showToast(
        "خطا در ذخیره آیتم"
      );

    }

  }


  /* =========================================================
     PUBLISH
     ========================================================= */

  async function publishData() {

    const button =
      document.getElementById(
        "publishBtn"
      );

    if (button) {
      button.disabled = true;
      button.textContent =
        "در حال آماده‌سازی...";
    }

    try {

      const settingsSnap =
        await db
          .collection("settings")
          .doc("main")
          .get();

      const categoriesSnap =
        await db
          .collection("categories")
          .orderBy("order")
          .get();

      const itemsSnap =
        await db
          .collection("items")
          .orderBy("order")
          .get();


      const settings =
        settingsSnap.exists
          ? settingsSnap.data()
          : {};


      const categories = [];

      categoriesSnap.forEach(
        function (doc) {

          categories.push({
            id: doc.id,
            ...doc.data()
          });

        }
      );


      const items = [];

      itemsSnap.forEach(
        function (doc) {

          items.push({
            id: doc.id,
            ...doc.data()
          });

        }
      );


      const categoryIds =
        new Set(
          categories.map(
            c => c.id
          )
        );


      const invalidItems =
        items.filter(
          item =>
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
          "آیتم‌های بدون دسته‌بندی معتبر: " +
          names
        );

      }


      const output = {

        settings:
          settings,

        categories:
          categories,

        items:
          items

      };


      const json =
        JSON.stringify(
          output,
          null,
          2
        );


      const blob =
        new Blob(
          [json],
          {
            type:
              "application/json;charset=utf-8"
          }
        );


      const url =
        URL.createObjectURL(
          blob
        );


      const link =
        document.createElement(
          "a"
        );

      link.href =
        url;

      link.download =
        "data.json";

      document.body.appendChild(
        link
      );

      link.click();

      link.remove();

      setTimeout(
        function () {
          URL.revokeObjectURL(
            url
          );
        },
        1000
      );


      showToast(
        "data.json ساخته شد ✓ آن را در GitHub جایگزین کنید."
      );

    } catch (error) {

      console.error(
        "PUBLISH ERROR:",
        error
      );

      showToast(
        error.message ||
        "خطا در ساخت data.json"
      );

    } finally {

      if (button) {

        button.disabled =
          false;

        button.textContent =
          "انتشار تغییرات";

      }

    }

  }


  /* =========================================================
     SEED
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


      for (
        const category
        of categories
      ) {

        await db
          .collection("categories")
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


      for (
        const item
        of items
      ) {

        await db
          .collection("items")
          .doc(item.id)
          .set(item);

      }


      await db
        .collection("settings")
        .doc("main")
        .set({

          cafeName:
            "PLAN B",

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

        }, {
          merge: true
        });


      showToast(
        "اطلاعات نمونه ساخته شد ✓"
      );

      await loadCategories();
      await loadItems();
      await loadSettings();

    } catch (error) {

      console.error(
        "SEED ERROR:",
        error
      );

      showToast(
        "خطا در ساخت اطلاعات نمونه"
      );

    }

  }


  /* =========================================================
     DYNAMIC SETTINGS
     ========================================================= */

  function renderHeroImages(images) {

    const container =
      document.getElementById(
        "heroImagesList"
      );

    if (!container) return;

    container.innerHTML = "";

    images.forEach(
      function (image) {
        addHeroImageRow(image);
      }
    );

  }


  function addHeroImageRow(value) {

    const container =
      document.getElementById(
        "heroImagesList"
      );

    if (!container) return;

    const row =
      document.createElement(
        "div"
      );

    row.className =
      "dynamic-row";

    row.innerHTML = `

      <input
        type="url"
        value="${escapeAttribute(
          value
        )}"
        placeholder="URL تصویر"
      >

      <button
        type="button"
        class="btn small danger"
      >
        حذف
      </button>

    `;

    row.querySelector(
      "button"
    ).addEventListener(
      "click",
      function () {
        row.remove();
      }
    );

    container.appendChild(
      row
    );

  }


  function renderHours(hours) {

    const container =
      document.getElementById(
        "hoursList"
      );

    if (!container) return;

    container.innerHTML = "";

    hours.forEach(
      function (hour) {

        addHoursRowElement(
          hour.days || "",
          hour.time || ""
        );

      }
    );

  }


  function addHoursRowElement(
    days,
    time
  ) {

    const container =
      document.getElementById(
        "hoursList"
      );

    if (!container) return;

    const row =
      document.createElement(
        "div"
      );

    row.className =
      "dynamic-row";

    row.innerHTML = `

      <input
        type="text"
        value="${escapeAttribute(
          days
        )}"
        placeholder="روزها"
      >

      <input
        type="text"
        value="${escapeAttribute(
          time
        )}"
        placeholder="ساعت"
      >

      <button
        type="button"
        class="btn small danger"
      >
        حذف
      </button>

    `;

    row.querySelector(
      "button"
    ).addEventListener(
      "click",
      function () {
        row.remove();
      }
    );

    container.appendChild(
      row
    );

  }


  function renderAboutBody(
    paragraphs
  ) {

    const container =
      document.getElementById(
        "aboutBodyList"
      );

    if (!container) return;

    container.innerHTML = "";

    paragraphs.forEach(
      function (text) {
        addAboutParagraph(text);
      }
    );

  }


  function addAboutParagraph(
    text
  ) {

    const container =
      document.getElementById(
        "aboutBodyList"
      );

    if (!container) return;

    const row =
      document.createElement(
        "div"
      );

    row.className =
      "dynamic-row";

    row.innerHTML = `

      <textarea
        rows="3"
        placeholder="متن پاراگراف"
      >${escapeHtml(
        text
      )}</textarea>

      <button
        type="button"
        class="btn small danger"
      >
        حذف
      </button>

    `;

    row.querySelector(
      "button"
    ).addEventListener(
      "click",
      function () {
        row.remove();
      }
    );

    container.appendChild(
      row
    );

  }


  function renderValues(
    values
  ) {

    const container =
      document.getElementById(
        "valuesList"
      );

    if (!container) return;

    container.innerHTML = "";

    values.forEach(
      function (value) {

        addValueElement(
          value.icon || "",
          value.label || ""
        );

      }
    );

  }


  function addValueElement(
    icon,
    label
  ) {

    const container =
      document.getElementById(
        "valuesList"
      );

    if (!container) return;

    const row =
      document.createElement(
        "div"
      );

    row.className =
      "dynamic-row";

    row.innerHTML = `

      <input
        type="text"
        value="${escapeAttribute(
          icon
        )}"
        placeholder="آیکون"
      >

      <input
        type="text"
        value="${escapeAttribute(
          label
        )}"
        placeholder="عنوان"
      >

      <button
        type="button"
        class="btn small danger"
      >
        حذف
      </button>

    `;

    row.querySelector(
      "button"
    ).addEventListener(
      "click",
      function () {
        row.remove();
      }
    );

    container.appendChild(
      row
    );

  }


  /* =========================================================
     IMAGE PREVIEW
     ========================================================= */

  function updateImagePreview(
    url
  ) {

    const box =
      document.getElementById(
        "imgPreviewBox"
      );

    if (!box) return;

    if (!url) {

      box.innerHTML = "";

      return;

    }

    box.innerHTML = `

      <img
        src="${escapeAttribute(
          url
        )}"
        style="
          max-width:180px;
          max-height:180px;
          border-radius:12px;
          object-fit:cover;
        "
        onerror="
          this.parentElement.innerHTML =
          '<small>تصویر قابل نمایش نیست</small>'
        "
      >

    `;

  }


  /* =========================================================
     HELPERS
     ========================================================= */

  function getValue(id) {

    const element =
      document.getElementById(id);

    return element
      ? element.value.trim()
      : "";

  }


  function setValue(
    id,
    value
  ) {

    const element =
      document.getElementById(id);

    if (element) {
      element.value =
        value || "";
    }

  }


  function createId(
    text
  ) {

    let value =
      String(text || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(
          /[^\w\u0600-\u06FF-]/g,
          ""
        )
        .replace(
          /-+/g,
          "-"
        )
        .substring(
          0,
          45
        );

    if (!value) {
      value = "item";
    }

    return (
      value +
      "-" +
      Math.random()
        .toString(36)
        .substring(2, 7)
    );

  }


  function escapeHtml(
    value
  ) {

    return String(
      value ?? ""
    )
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );

  }


  function escapeAttribute(
    value
  ) {

    return escapeHtml(
      value
    );

  }


  function showToast(
    message
  ) {

    const toast =
      document.getElementById(
        "toast"
      );

    if (!toast) {

      console.log(
        "PLAN B:",
        message
      );

      return;

    }

    toast.textContent =
      message;

    toast.classList.add(
      "show"
    );

    clearTimeout(
      window.__planBToastTimer
    );

    window.__planBToastTimer =
      setTimeout(
        function () {

          toast.classList.remove(
            "show"
          );

        },
        3500
      );

  }


  function showFatalError(
    message
  ) {

    console.error(
      "PLAN B ADMIN FATAL:",
      message
    );

    const old =
      document.getElementById(
        "planBAdminFatal"
      );

    if (old) {
      old.remove();
    }

    const box =
      document.createElement(
        "div"
      );

    box.id =
      "planBAdminFatal";

    box.style.cssText = `
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
    `;

    box.textContent =
      message;

    document.body.prepend(
      box
    );

  }


  function firebaseErrorMessage(
    error
  ) {

    const code =
      error?.code || "";

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
        "تعداد تلاش‌ها زیاد است. کمی بعد دوباره امتحان کنید.",

      "auth/network-request-failed":
        "ارتباط با Firebase برقرار نشد. اینترنت یا دسترسی Firebase را بررسی کنید."

    };

    return (
      messages[code] ||
      error?.message ||
      "خطا در ورود"
    );

  }


  /* =========================================================
     BOOT
     ========================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      startAdmin,
      { once: true }
    );

  } else {

    startAdmin();

  }

})();
