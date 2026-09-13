/* ================================================================
   PLAN B — PUBLIC MENU
   Static / GitHub Pages
   Data source: data.json
   Firebase is NOT used here.
================================================================ */

"use strict";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

let SETTINGS = null;
let CATEGORIES = [];
let ITEMS = [];

let heroIndex = 0;
let heroTimer = null;


/* ================================================================
   BASIC HELPERS
================================================================ */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* ================================================================
   CACTUS
================================================================ */

const CACTUS_SVG = `
<svg viewBox="0 0 40 40"
     fill="currentColor"
     xmlns="http://www.w3.org/2000/svg">
  <rect x="16" y="4" width="8" height="32" rx="4"/>
  <rect x="7" y="15" width="16" height="6" rx="3"/>
  <rect x="7" y="15" width="7" height="15" rx="3.5"/>
  <rect x="17" y="10" width="16" height="6" rx="3"/>
  <rect x="26" y="10" width="7" height="13" rx="3.5"/>
  <ellipse cx="20" cy="37.5" rx="10" ry="2" opacity=".3"/>
</svg>
`;

function cactusDeco(extraClass = "") {
  return `
    <span class="cactus-deco ${extraClass}">
      ${CACTUS_SVG}
    </span>
  `;
}


/* ================================================================
   LOAD DATA
================================================================ */

async function loadData() {

  try {

    console.log("PLAN B: loading data.json...");

    const url =
      new URL(
        "data.json",
        window.location.href
      ).href +
      "?v=" +
      Date.now();

    const response =
      await fetch(url, {
        method: "GET",
        cache: "no-store",
        headers: {
          "Accept": "application/json"
        }
      });

    if (!response.ok) {
      throw new Error(
        `data.json قابل دریافت نیست. HTTP ${response.status}`
      );
    }

    const text =
      await response.text();

    if (!text.trim()) {
      throw new Error(
        "فایل data.json خالی است."
      );
    }

    let data;

    try {

      data = JSON.parse(text);

    } catch (jsonError) {

      console.error(
        "INVALID JSON:",
        jsonError,
        text
      );

      throw new Error(
        "ساختار data.json معتبر نیست. فایل JSON را بررسی کنید."
      );
    }


    /* ------------------------------------------------------------
       VALIDATE ROOT
    ------------------------------------------------------------ */

    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      throw new Error(
        "ساختار اصلی data.json صحیح نیست."
      );
    }


    /* ------------------------------------------------------------
       SETTINGS
    ------------------------------------------------------------ */

    SETTINGS =
      data.settings &&
      typeof data.settings === "object"
        ? data.settings
        : {};


    /* ------------------------------------------------------------
       CATEGORIES
    ------------------------------------------------------------ */

    CATEGORIES =
      Array.isArray(data.categories)
        ? data.categories
            .filter(
              category =>
                category &&
                category.id &&
                category.name
            )
            .map(category => ({
              id: String(category.id),
              name: String(category.name),
              nameEn:
                category.nameEn
                  ? String(category.nameEn)
                  : "",
              order:
                Number(category.order || 0)
            }))
            .sort(
              (a, b) =>
                a.order - b.order
            )
        : [];


    /* ------------------------------------------------------------
       ITEMS
    ------------------------------------------------------------ */

    const validCategoryIds =
      new Set(
        CATEGORIES.map(
          category => category.id
        )
      );

    ITEMS =
      Array.isArray(data.items)
        ? data.items
            .filter(item => {

              if (
                !item ||
                !item.id ||
                !item.title
              ) {
                return false;
              }

              if (
                item.categoryId &&
                !validCategoryIds.has(
                  String(item.categoryId)
                )
              ) {
                console.warn(
                  "PLAN B: item ignored because category does not exist:",
                  item
                );

                return false;
              }

              return true;

            })
            .map(item => ({
              id: String(item.id),
              categoryId:
                String(item.categoryId || ""),
              title:
                String(item.title || ""),
              subtitle:
                String(item.subtitle || ""),
              desc:
                String(item.desc || ""),
              price:
                String(item.price || ""),
              image:
                String(item.image || ""),
              isNew:
                Boolean(item.isNew),
              available:
                item.available !== false,
              order:
                Number(item.order || 0)
            }))
            .sort(
              (a, b) =>
                a.order - b.order
            )
        : [];


    console.log(
      "PLAN B DATA LOADED:",
      {
        categories:
          CATEGORIES.length,
        items:
          ITEMS.length,
        settings:
          !!SETTINGS
      }
    );


    /* ------------------------------------------------------------
       RENDER
    ------------------------------------------------------------ */

    renderHome();
    renderAbout();
    renderContact();
    renderCategoriesList();
    renderFeed();


  } catch (error) {

    console.error(
      "PLAN B DATA ERROR:",
      error
    );

    showDataError(
      error.message ||
      "خطا در دریافت اطلاعات."
    );

  }

}


/* ================================================================
   ERROR
================================================================ */

function showDataError(message) {

  const status =
    $("#openStatus");

  if (status) {
    status.textContent =
      "خطا در دریافت اطلاعات منو";
  }

  const hero =
    $("#heroImages");

  if (hero) {
    hero.innerHTML = `
      <div class="hero-slide active hero-empty">
        🌵
      </div>
    `;
  }

  const dots =
    $("#heroDots");

  if (dots) {
    dots.innerHTML = "";
  }

  console.error(
    "PLAN B:",
    message
  );

}


/* ================================================================
   HOME
================================================================ */

function renderHome() {

  if (!SETTINGS) return;

  const tagline =
    $("#homeTagline");

  if (tagline) {
    tagline.textContent =
      SETTINGS.tagline || "";
  }

  const status =
    $("#openStatus");

  if (status) {
    status.textContent =
      SETTINGS.hoursNote || "";
  }


  const hero =
    $("#heroImages");

  const dots =
    $("#heroDots");

  if (!hero || !dots) {
    return;
  }


  const images =
    Array.isArray(
      SETTINGS.heroImages
    )
      ? SETTINGS.heroImages.filter(Boolean)
      : [];


  hero.innerHTML =
    images
      .map(
        (src, index) => `
          <div
            class="hero-slide ${
              index === 0
                ? "active"
                : ""
            }"
            style="background-image:url('${src}')">
          </div>
        `
      )
      .join("");


  if (!images.length) {

    hero.innerHTML = `
      <div class="hero-slide active hero-empty">
        🌵
      </div>
    `;

    dots.innerHTML = "";

    return;
  }


  dots.innerHTML =
    images
      .map(
        (_, index) => `
          <span
            class="hero-dot ${
              index === 0
                ? "active"
                : ""
            }">
          </span>
        `
      )
      .join("");


  heroIndex = 0;

  clearInterval(heroTimer);

  if (images.length > 1) {

    heroTimer =
      setInterval(
        () => {

          const slides =
            $$("#heroImages .hero-slide");

          const dotsList =
            $$("#heroDots .hero-dot");

          if (!slides.length) return;

          slides.forEach(
            slide =>
              slide.classList.remove(
                "active"
              )
          );

          dotsList.forEach(
            dot =>
              dot.classList.remove(
                "active"
              )
          );

          heroIndex =
            (heroIndex + 1) %
            slides.length;

          slides[
            heroIndex
          ].classList.add(
            "active"
          );

          if (dotsList[heroIndex]) {
            dotsList[
              heroIndex
            ].classList.add(
              "active"
            );
          }

        },
        4500
      );

  }

}


/* ================================================================
   CATEGORIES PAGE
================================================================ */

function renderCategoriesList() {

  const container =
    $("#categoriesList");

  if (!container) return;


  if (!CATEGORIES.length) {

    container.innerHTML = `
      <p class="empty-note">
        هنوز دسته‌بندی‌ای ثبت نشده.
      </p>
    `;

    return;
  }


  container.innerHTML =
    CATEGORIES
      .map(
        category => `
          <button
            class="cat-index-btn"
            data-cat-index="${escapeHtml(
              category.id
            )}">

            <span>
              ${escapeHtml(
                category.name
              )}
            </span>

            <span class="cat-index-en">
              ${escapeHtml(
                category.nameEn
              )}
            </span>

          </button>
        `
      )
      .join("");


  container
    .querySelectorAll(
      "[data-cat-index]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          goToPage("feed");

          setTimeout(
            () => {

              scrollToCategory(
                button.dataset.catIndex
              );

            },
            50
          );

        }
      );

    });


  renderCategoriesFooter();

}


/* ================================================================
   FEED
================================================================ */

function renderFeed() {

  const tabs =
    $("#feedTabs");

  const feed =
    $("#feedList");

  if (!tabs || !feed) {
    return;
  }


  if (!CATEGORIES.length) {

    tabs.innerHTML = "";

    feed.innerHTML = `
      <p class="empty-note">
        هنوز دسته‌بندی‌ای ثبت نشده.
      </p>
    `;

    return;
  }


  tabs.innerHTML =
    CATEGORIES
      .map(
        (category, index) => `
          <button
            class="feed-tab ${
              index === 0
                ? "active"
                : ""
            }"
            data-cat="${escapeHtml(
              category.id
            )}">

            ${escapeHtml(
              category.name
            )}

          </button>
        `
      )
      .join("");


  let html = "";


  CATEGORIES.forEach(
    category => {

      const items =
        ITEMS.filter(
          item =>
            item.categoryId ===
              category.id &&
            item.available !== false
        );


      if (!items.length) {
        return;
      }


      html += `
        <section
          class="feed-section"
          id="cat-${escapeHtml(
            category.id
          )}">

          <div class="cactus-row">
            ${cactusDeco()}
            ${cactusDeco("small")}
            ${cactusDeco()}
          </div>

          ${items
            .map(
              item => `
                <article class="feed-card">

                  ${
                    item.isNew
                      ? `
                        <span class="badge-new feed-new">
                          جدید
                        </span>
                      `
                      : ""
                  }

                  <div class="feed-photo">

                    ${
                      item.image
                        ? `
                          <img
                            src="${escapeHtml(
                              item.image
                            )}"
                            alt="${escapeHtml(
                              item.title
                            )}">
                        `
                        : `
                          <span class="feed-emoji">
                            🌵
                          </span>
                        `
                    }

                  </div>

                  ${
                    item.subtitle
                      ? `
                        <div class="feed-sub">
                          ${escapeHtml(
                            item.subtitle
                          )}
                        </div>
                      `
                      : ""
                  }

                  <h3 class="feed-title">
                    ${escapeHtml(
                      item.title
                    )}
                  </h3>

                  ${
                    item.desc
                      ? `
                        <p class="feed-desc">
                          ${escapeHtml(
                            item.desc
                          )}
                        </p>
                      `
                      : ""
                  }

                  <span class="price-badge">
                    ${escapeHtml(
                      item.price
                    )}
                  </span>

                </article>
              `
            )
            .join("")}

        </section>
      `;

    }
  );


  if (!html) {

    html = `
      <p class="empty-note">
        هنوز آیتمی ثبت نشده.
      </p>
    `;

  }


  feed.innerHTML =
    html +
    `
      <div class="cactus-row">
        ${cactusDeco()}
        ${cactusDeco("small")}
        ${cactusDeco()}
      </div>

      <div class="touch-card">
        <h4>در تماس باشید</h4>

        <p>
          اگر سوالی داری یا به کمک نیاز داری، تماس بگیر.
        </p>

        <a
          id="ctPhoneCall"
          class="pill-btn"
          href="tel:">
          تماس بگیر
        </a>

      </div>
    `;


  $$(".feed-tab")
    .forEach(tab => {

      tab.addEventListener(
        "click",
        () => {

          scrollToCategory(
            tab.dataset.cat
          );

        }
      );

    });


  updatePhoneButton();

  setupScrollSpy();

}


/* ================================================================
   CATEGORY SCROLL
================================================================ */

function scrollToCategory(categoryId) {

  const element =
    document.getElementById(
      "cat-" + categoryId
    );

  if (!element) return;


  const y =
    element.getBoundingClientRect()
      .top +
    window.scrollY -
    118;


  window.scrollTo({
    top: y,
    behavior: "smooth"
  });

}


/* ================================================================
   SCROLL SPY
================================================================ */

function setupScrollSpy() {

  const sections =
    $$(".feed-section");

  if (!sections.length) return;


  if (
    !("IntersectionObserver" in window)
  ) {
    return;
  }


  const observer =
    new IntersectionObserver(
      entries => {

        entries.forEach(
          entry => {

            if (!entry.isIntersecting) {
              return;
            }

            const id =
              entry.target.id.replace(
                "cat-",
                ""
              );


            $$(".feed-tab")
              .forEach(tab => {

                tab.classList.toggle(
                  "active",
                  tab.dataset.cat === id
                );

              });

          }
        );

      },
      {
        rootMargin:
          "-40% 0px -50% 0px"
      }
    );


  sections.forEach(
    section =>
      observer.observe(section)
  );

}


/* ================================================================
   ABOUT
================================================================ */

function renderAbout() {

  if (!SETTINGS) return;


  const title =
    $("#aboutTitle");

  const intro =
    $("#aboutIntro");

  const body =
    $("#aboutBody");

  const values =
    $("#valueGrid");


  if (title) {
    title.textContent =
      SETTINGS.aboutTitle || "";
  }


  if (intro) {
    intro.textContent =
      SETTINGS.aboutIntro || "";
  }


  if (body) {

    body.innerHTML =
      Array.isArray(
        SETTINGS.aboutBody
      )
        ? SETTINGS.aboutBody
            .map(
              text =>
                `<p>${escapeHtml(
                  text
                )}</p>`
            )
            .join("")
        : "";

  }


  if (values) {

    const list =
      Array.isArray(
        SETTINGS.values
      )
        ? SETTINGS.values
        : [];


    values.innerHTML =
      list
        .map(
          value => `
            <div class="value-card">

              <div class="ico">
                ${escapeHtml(
                  value.icon || "🌵"
                )}
              </div>

              <div class="lbl">
                ${escapeHtml(
                  value.label || ""
                )}
              </div>

            </div>
          `
        )
        .join("");

  }

}


/* ================================================================
   CONTACT
================================================================ */

function renderContact() {

  if (!SETTINGS) return;


  const contact =
    SETTINGS.contact || {};


  const address =
    $("#cAddress");

  if (address) {
    address.textContent =
      contact.address || "-";
  }


  const phone =
    $("#cPhoneVal");

  if (phone) {

    phone.textContent =
      contact.phone || "-";

    phone.href =
      contact.phone
        ? "tel:" +
          contact.phone.replace(
            /[^0-9+]/g,
            ""
          )
        : "#";

  }


  const table =
    $("#hoursTable");

  if (table) {

    const hours =
      Array.isArray(
        SETTINGS.hours
      )
        ? SETTINGS.hours
        : [];


    table.innerHTML =
      hours
        .map(
          hour => `
            <tr>
              <td>
                ${escapeHtml(
                  hour.days || ""
                )}
              </td>

              <td>
                ${escapeHtml(
                  hour.time || ""
                )}
              </td>
            </tr>
          `
        )
        .join("");

  }


  const social =
    $("#socialRow");

  if (social) {

    const links = [];


    if (contact.instagram) {

      links.push({
        label: "اینستاگرام",
        url: contact.instagram
      });

    }


    if (contact.whatsapp) {

      links.push({
        label: "واتساپ",
        url: contact.whatsapp
      });

    }


    if (contact.mapUrl) {

      links.push({
        label: "مسیر روی نقشه",
        url: contact.mapUrl
      });

    }


    social.innerHTML =
      links
        .map(
          link => `
            <a
              class="pill-btn"
              style="flex:1;"
              href="${escapeHtml(
                link.url
              )}"
              target="_blank"
              rel="noopener noreferrer">

              ${escapeHtml(
                link.label
              )}

            </a>
          `
        )
        .join("");

  }


  updatePhoneButton();

}


/* ================================================================
   PHONE BUTTON
================================================================ */

function updatePhoneButton() {

  const button =
    $("#ctPhoneCall");

  if (!button) return;


  const phone =
    SETTINGS?.contact?.phone || "";


  if (!phone) {

    button.style.display =
      "none";

    return;

  }


  button.style.display =
    "block";

  button.href =
    "tel:" +
    phone.replace(
      /[^0-9+]/g,
      ""
    );

}


/* ================================================================
   NAVIGATION
================================================================ */

function goToPage(name) {

  $$(".page")
    .forEach(
      page =>
        page.classList.remove(
          "active"
        )
    );


  const page =
    $("#page-" + name);

  if (page) {

    page.classList.add(
      "active"
    );

  }


  $$("nav.bottom button")
    .forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.page ===
            name
        );

      }
    );


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* ================================================================
   NAV SETUP
================================================================ */

function setupNav() {

  $$("[data-goto]")
    .forEach(
      element => {

        element.addEventListener(
          "click",
          () => {

            goToPage(
              element.dataset.goto
            );

          }
        );

      }
    );


  $$("nav.bottom button")
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            goToPage(
              button.dataset.page
            );

          }
        );

      }
    );


  const back =
    $("#feedBackBtn");

  if (back) {

    back.addEventListener(
      "click",
      () => {

        goToPage(
          "categories"
        );

      }
    );

  }


  const logo =
    $("#logoHome");

  if (logo) {

    logo.addEventListener(
      "click",
      () => {

        goToPage(
          "home"
        );

      }
    );

  }

}


/* ================================================================
   SPLASH
================================================================ */

window.addEventListener(
  "load",
  () => {

    setTimeout(
      () => {

        const splash =
          $("#splash");

        if (splash) {

          splash.classList.add(
            "hide"
          );

        }

      },
      1300
    );

  }
);


/* ================================================================
   START
================================================================ */

setupNav();
loadData();
