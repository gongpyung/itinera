const tripConfig = window.TRIP_CONFIG;
const { hotel, days } = window.TRIP_DATA;

const dayList = document.querySelector("#dayList");
const dayNav = document.querySelector(".day-nav");
const mapFrame = document.querySelector("#mapFrame");
const mapTitle = document.querySelector("#mapTitle");
const mapOpenLink = document.querySelector("#mapOpenLink");
const mapDetails = document.querySelector("#mapDetails");
const openHotelMap = document.querySelector("#openHotelMap");
const mobileInlineMap = window.matchMedia("(max-width: 720px)");
let activeInlineMap = null;

function googleSearchUrl(query) {
  const url = new URL("https://www.google.com/maps/search/");
  url.searchParams.set("api", "1");
  url.searchParams.set("query", query);
  return url.toString();
}

function googleEmbedUrl(query) {
  const url = new URL("https://maps.google.com/maps");
  url.searchParams.set("q", query);
  url.searchParams.set("output", "embed");
  return url.toString();
}

function googleRouteUrl(stops, travelMode = "walking") {
  const routeStops = stops.filter((stop) => stop.query);

  if (routeStops.length === 0) {
    return googleSearchUrl(hotel.query);
  }

  if (routeStops.length === 1) {
    return googleSearchUrl(routeStops[0].query);
  }

  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("origin", routeStops[0].query);
  url.searchParams.set("destination", routeStops[routeStops.length - 1].query);
  url.searchParams.set("travelmode", travelMode);

  const waypoints = routeStops
    .slice(1, -1)
    .map((stop) => stop.query)
    .join("|");
  if (waypoints) {
    url.searchParams.set("waypoints", waypoints);
  }

  return url.toString();
}

function tagClass(tag, stop) {
  if (stop.booked || tag.includes("예약")) return "tag is-booked";
  if (stop.free || tag.includes("무료") || tag.includes("자유")) return "tag is-free";
  return "tag";
}

function applyTripChrome() {
  const root = document.documentElement;
  root.lang = tripConfig.htmlLang;
  root.dataset.theme = tripConfig.theme;
  root.style.setProperty("--hero-image", `url("${tripConfig.heroImage}")`);

  document.title = tripConfig.documentTitle;

  const textBindings = {
    tripEyebrow: tripConfig.eyebrow,
    tripTitle: tripConfig.title,
    tripHotel: `${tripConfig.hotelLabelPrefix}: ${hotel.displayName}`,
    itineraryEyebrow: tripConfig.itineraryEyebrow,
    itineraryHeading: tripConfig.itineraryHeading,
    mapEyebrow: tripConfig.mapEyebrow,
    allDaysButton: tripConfig.allDaysLabel,
  };
  for (const [id, text] of Object.entries(textBindings)) {
    document.getElementById(id).textContent = text;
  }

  const totalStops = days.reduce((sum, d) => sum + d.stops.length, 0);
  const resolveChip = (template) =>
    template.replace("{days}", days.length).replace("{stops}", totalStops);

  document.querySelector("#tripSummary").innerHTML = tripConfig.summaryChips
    .map((chip) => `<span>${resolveChip(chip)}</span>`)
    .join("");

  document
    .querySelector("#itinerarySection")
    .setAttribute("aria-label", tripConfig.itineraryAriaLabel);

  mapTitle.textContent = hotel.displayName;
  mapOpenLink.textContent = tripConfig.openInGoogleMapsLabel;
  openHotelMap.textContent = tripConfig.hotelMapLinkLabel;
}

function mapDetailsMarkup(day, stop) {
  return `
    <h3 class="map-details__title">${day.date} · ${stop.category}</h3>
    <p class="map-details__text">${stop.note}</p>
    <div class="tag-row">
      ${stop.tags.map((tag) => `<span class="${tagClass(tag, stop)}">${tag}</span>`).join("")}
    </div>
    <div class="map-actions">
      <a class="place-link" href="${googleSearchUrl(stop.query)}" target="_blank" rel="noreferrer">${tripConfig.openPlaceLabel}</a>
      <a class="place-link" href="${googleRouteUrl([hotel, stop])}" target="_blank" rel="noreferrer">${tripConfig.routeFromHotelLabel}</a>
      <a class="place-link" href="${googleRouteUrl(day.stops, day.travelMode)}" target="_blank" rel="noreferrer">${tripConfig.todayRouteCardLabel}</a>
    </div>
  `;
}

function renderNav() {
  const buttons = days
    .map(
      (day) =>
        `<button class="day-nav__button" data-day="${day.id}" type="button">${day.number}${tripConfig.dayButtonSuffix}</button>`,
    )
    .join("");

  dayNav.insertAdjacentHTML("beforeend", buttons);
}

function renderItinerary() {
  dayList.innerHTML = days
    .map((day) => {
      const stops = day.stops
        .map(
          (stop, index) => `
            <button class="stop-card" type="button" data-day="${day.id}" data-stop="${index}">
              <span class="stop-time">${stop.time}</span>
              <span class="stop-body">
                <span class="stop-title-row">
                  <span class="stop-category">${stop.category}</span>
                  <strong class="stop-name">${stop.name}</strong>
                </span>
                <span class="stop-note">${stop.note}</span>
                <span class="tag-row">
                  ${stop.tags.map((tag) => `<span class="${tagClass(tag, stop)}">${tag}</span>`).join("")}
                </span>
              </span>
            </button>
          `,
        )
        .join("");

      return `
        <article class="day-card" data-day-card="${day.id}">
          <header class="day-card__header">
            <span class="day-number">${day.number}</span>
            <div>
              <h3>${day.date} ${day.title}</h3>
              <p class="day-meta">${day.summary}</p>
            </div>
            <a class="route-link" href="${googleRouteUrl(day.stops, day.travelMode)}" target="_blank" rel="noreferrer">${tripConfig.todayRouteLinkLabel}</a>
          </header>
          <div class="stop-list">${stops}</div>
        </article>
      `;
    })
    .join("");
}

function selectStop(dayId, stopIndex) {
  const day = days.find((item) => item.id === dayId);
  const stop = day?.stops[stopIndex];

  if (!day || !stop) return;

  document.querySelectorAll(".stop-card").forEach((card) => {
    const isActive = card.dataset.day === dayId && Number(card.dataset.stop) === stopIndex;
    card.classList.toggle("is-active", isActive);
  });

  mapTitle.textContent = stop.name;
  mapFrame.src = googleEmbedUrl(stop.query);
  mapOpenLink.href = googleSearchUrl(stop.query);
  mapDetails.innerHTML = mapDetailsMarkup(day, stop);

  return { day, stop };
}

function clearInlineMap(clearActive = false) {
  document.querySelector(".inline-map")?.remove();
  activeInlineMap = null;

  if (clearActive) {
    document.querySelectorAll(".stop-card").forEach((card) => {
      card.classList.remove("is-active");
    });
  }
}

function renderInlineMap(stopCard, day, stop, stopIndex) {
  clearInlineMap();

  const inlineMap = document.createElement("div");
  inlineMap.className = "inline-map";
  inlineMap.dataset.day = day.id;
  inlineMap.dataset.stop = String(stopIndex);
  inlineMap.innerHTML = `
    <div class="inline-map__toolbar">
      <div>
        <p class="eyebrow">${tripConfig.mapEyebrow}</p>
        <h4>${stop.name}</h4>
      </div>
      <button class="inline-map__close" type="button">${tripConfig.inlineMapCloseLabel}</button>
    </div>
    <div class="inline-map__frame">
      <iframe
        title="${stop.name} Google Maps"
        src="${googleEmbedUrl(stop.query)}"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        allowfullscreen
      ></iframe>
    </div>
    <div class="inline-map__details">
      ${mapDetailsMarkup(day, stop)}
    </div>
  `;

  stopCard.insertAdjacentElement("afterend", inlineMap);
  activeInlineMap = { dayId: day.id, stopIndex };
}

function filterDay(dayId) {
  clearInlineMap();

  document.querySelectorAll(".day-nav__button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.day === dayId);
  });

  document.querySelectorAll(".day-card").forEach((card) => {
    card.classList.toggle("is-hidden", dayId !== "all" && card.dataset.dayCard !== dayId);
  });

  const targetDay = dayId === "all" ? days[0] : days.find((day) => day.id === dayId);
  if (targetDay) {
    selectStop(targetDay.id, 0);
  }
}

applyTripChrome();
renderNav();
renderItinerary();
openHotelMap.href = googleSearchUrl(hotel.query);
selectStop(days[0].id, 0);

dayList.addEventListener("click", (event) => {
  const closeButton = event.target.closest(".inline-map__close");
  if (closeButton) {
    clearInlineMap(true);
    return;
  }

  const stopCard = event.target.closest(".stop-card");
  if (!stopCard) return;

  const stopIndex = Number(stopCard.dataset.stop);

  if (
    mobileInlineMap.matches &&
    activeInlineMap?.dayId === stopCard.dataset.day &&
    activeInlineMap?.stopIndex === stopIndex
  ) {
    clearInlineMap(true);
    return;
  }

  const selection = selectStop(stopCard.dataset.day, stopIndex);

  if (mobileInlineMap.matches && selection) {
    renderInlineMap(stopCard, selection.day, selection.stop, stopIndex);
  }
});

dayNav.addEventListener("click", (event) => {
  const button = event.target.closest(".day-nav__button");
  if (!button) return;

  filterDay(button.dataset.day);
});

mobileInlineMap.addEventListener("change", () => {
  clearInlineMap();
});
