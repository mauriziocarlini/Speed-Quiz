const STORAGE_KEYS = {
  mode: "speedQuizMode",
  topLimit: "speedQuizTopLimit",
  customPools: "speedQuizCustomPools",
  activeCustom: "speedQuizActiveCustom",
  fullSp: "speedQuizFullSp",
  naturePlus: "speedQuizNaturePlus",
  natureMinus: "speedQuizNatureMinus",
  modifiers: "speedQuizModifiers",
  theme: "speedQuizTheme",
};

const MODIFIER_STAGE_WEIGHTS = [
  { stage: -6, weight: 1 },
  { stage: -5, weight: 2 },
  { stage: -4, weight: 4 },
  { stage: -3, weight: 8 },
  { stage: -2, weight: 32 },
  { stage: -1, weight: 96 },
  { stage: 0, weight: 24 },
  { stage: 1, weight: 96 },
  { stage: 2, weight: 32 },
  { stage: 3, weight: 8 },
  { stage: 4, weight: 4 },
  { stage: 5, weight: 2 },
  { stage: 6, weight: 1 },
];

const MEGA_BY_BASE_ID = {
  abomasnow: ["mega-abomasnow"],
  absol: ["mega-absol"],
  aerodactyl: ["mega-aerodactyl"],
  aggron: ["mega-aggron"],
  alakazam: ["mega-alakazam"],
  altaria: ["mega-altaria"],
  ampharos: ["mega-ampharos"],
  audino: ["mega-audino"],
  banette: ["mega-banette"],
  beedrill: ["mega-beedrill"],
  blastoise: ["mega-blastoise"],
  camerupt: ["mega-camerupt"],
  charizard: ["mega-charizard-x", "mega-charizard-y"],
  clefable: ["mega-clefable"],
  delphox: ["mega-delphox"],
  dragonite: ["mega-dragonite"],
  excadrill: ["mega-excadrill"],
  froslass: ["mega-froslass"],
  gallade: ["mega-gallade"],
  garchomp: ["mega-garchomp"],
  gardevoir: ["mega-gardevoir"],
  gengar: ["mega-gengar"],
  glalie: ["mega-glalie"],
  greninja: ["mega-greninja"],
  gyarados: ["mega-gyarados"],
  hawlucha: ["mega-hawlucha"],
  heracross: ["mega-heracross"],
  houndoom: ["mega-houndoom"],
  kangaskhan: ["mega-kangaskhan"],
  lopunny: ["mega-lopunny"],
  lucario: ["mega-lucario"],
  manectric: ["mega-manectric"],
  medicham: ["mega-medicham"],
  metagross: ["mega-metagross"],
  pidgeot: ["mega-pidgeot"],
  pinsir: ["mega-pinsir"],
  sableye: ["mega-sableye"],
  scizor: ["mega-scizor"],
  sharpedo: ["mega-sharpedo"],
  slowbro: ["mega-slowbro"],
  starmie: ["mega-starmie"],
  steelix: ["mega-steelix"],
  tyranitar: ["mega-tyranitar"],
  venusaur: ["mega-venusaur"],
  "eternal-flower-floette": ["mega-floette"],
  meowstic: ["mega-meowstic"],
  "meowstic-2": ["mega-meowstic-2"],
};

const championsData = window.CHAMPIONS_POKEMON;

if (!Array.isArray(championsData) || championsData.length === 0) {
  throw new Error("Pokémon data was not loaded. Check champions-data.js.");
}

const pokemon = championsData.map((mon, index) => ({
  ...mon,
  order: index,
}));

const byId = new Map(pokemon.map((mon) => [mon.id, mon]));
const byName = new Map(pokemon.map((mon) => [normalize(mon.name), mon]));

const art = document.querySelector("#pokemon-art");
const rankLabel = document.querySelector("#rank-label");
const pokemonName = document.querySelector("#pokemon-name");
const variantBadges = document.querySelector("#variant-badges");
const form = document.querySelector("#quiz-form");
const answer = document.querySelector("#speed-answer");
const feedback = document.querySelector("#feedback");
const quizEmptyState = document.querySelector("#quiz-empty-state");
const quizCardHead = document.querySelector(".quiz-card-head");
const currentPokemon = document.querySelector(".current-pokemon");
const sessionSummary = document.querySelector("#session-summary");
const createReviewListButton = document.querySelector("#create-review-list-button");
const scoreValue = document.querySelector("#score-value");
const streakValue = document.querySelector("#streak-value");
const remainingValue = document.querySelector("#remaining-value");
const hintButton = document.querySelector("#hint-button");
const fullSpToggle = document.querySelector("#full-sp-toggle");
const naturePlusToggle = document.querySelector("#nature-plus-toggle");
const natureMinusToggle = document.querySelector("#nature-minus-toggle");
const modifiersToggle = document.querySelector("#modifiers-toggle");
const themeToggle = document.querySelector("#theme-toggle");
const themeLabel = document.querySelector("#theme-label");
const slowerHint = document.querySelector("#slower-hint");
const fasterHint = document.querySelector("#faster-hint");
const skipButton = document.querySelector("#skip-button");
const resetButton = document.querySelector("#reset-button");
const tiersSection = document.querySelector("#tiers-section");
const tiersToggleLabel = document.querySelector("#tiers-toggle-label");
const tiersList = document.querySelector("#tiers-list");
const modeInputs = [...document.querySelectorAll('input[name="quiz-mode"]')];
const topSettings = document.querySelector("#top-settings");
const topLimit = document.querySelector("#top-limit");
const customSettings = document.querySelector("#custom-settings");
const customPoolSelect = document.querySelector("#custom-pool-select");
const newCustomButton = document.querySelector("#new-custom-button");
const deleteCustomButton = document.querySelector("#delete-custom-button");
const exportCustomButton = document.querySelector("#export-custom-button");
const importCustomButton = document.querySelector("#import-custom-button");
const importCustomFile = document.querySelector("#import-custom-file");
const customEmpty = document.querySelector("#custom-empty");
const customEditor = document.querySelector("#custom-editor");
const customName = document.querySelector("#custom-name");
const customSearch = document.querySelector("#custom-search");
const customCount = document.querySelector("#custom-count");
const customGrid = document.querySelector("#custom-grid");
const saveCustomButton = document.querySelector("#save-custom-button");
const clearCustomButton = document.querySelector("#clear-custom-button");

document.addEventListener(
  "error",
  (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || image.dataset.fallbackApplied) return;
    const id = image.dataset.pokeapiId;
    if (!id) return;
    image.dataset.fallbackApplied = "true";
    image.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
  },
  true,
);

let queue = [];
let current = null;
let currentPool = [];
let sessionEntries = [];
let correct = 0;
let attempts = 0;
let streak = 0;
let customDraft = new Set();
let missedIds = new Set();
let usageRankingIds = [];

function normalize(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function championsSpeed(mon) {
  return mon.baseSpeed + 20;
}

function pokemonArt(mon) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${mon.pokeapiId}.png`;
}

function variantSpeed(entry) {
  const neutral = championsSpeed(entry.mon) + entry.sp;
  const spreadAdjusted = Math.floor(neutral * entry.nature);
  return applyStage(spreadAdjusted, entry.stage);
}

function randomSp() {
  return fullSpToggle.checked && Math.random() < 0.5 ? 32 : 0;
}

function randomNature() {
  const options = [1];
  if (naturePlusToggle.checked) options.push(1.1);
  if (natureMinusToggle.checked) options.push(0.9);
  return options[Math.floor(Math.random() * options.length)];
}

function randomStage() {
  if (!modifiersToggle.checked) return 0;
  const total = MODIFIER_STAGE_WEIGHTS.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;

  for (const item of MODIFIER_STAGE_WEIGHTS) {
    roll -= item.weight;
    if (roll <= 0) return item.stage;
  }

  return 0;
}

function applyStage(speed, stage) {
  const multiplier = stage >= 0 ? (2 + stage) / 2 : 2 / (2 + Math.abs(stage));
  return Math.max(1, Math.floor(speed * multiplier));
}

function stageLabel(stage) {
  if (stage === 0) return "±0";
  return stage > 0 ? `+${stage}` : String(stage);
}

function stageFormula(stage) {
  if (stage > 0) {
    return `×${formatMultiplier((2 + stage) / 2)}`;
  }

  if (stage < 0) {
    return `×${formatMultiplier(2 / (2 + Math.abs(stage)))}`;
  }

  return "";
}

function formatMultiplier(value) {
  return value.toFixed(2).replace(/\.?0+$/, "");
}

function stageArrows(stage) {
  if (stage === 0) return "";
  const arrow = stage > 0 ? "▲" : "▼";
  return arrow.repeat(Math.abs(stage));
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

async function loadUsageRanking() {
  try {
    const response = await fetch("usage-ranking.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Usage ranking HTTP ${response.status}`);
    const ids = await response.json();
    usageRankingIds = Array.isArray(ids) ? uniqueKnownIds(ids) : [];
  } catch (error) {
    console.error(error);
    usageRankingIds = [];
  }
}

function applyTheme(theme) {
  const safeTheme = theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = safeTheme;
  themeToggle.checked = safeTheme === "light";
  themeLabel.textContent = safeTheme === "light" ? "Light" : "Dark";
}

function getUsageRanking() {
  return usageRankingIds;
}

function getCustomPools() {
  const pools = readJson(STORAGE_KEYS.customPools, []);
  return Array.isArray(pools) ? pools : [];
}

function setCustomPools(pools) {
  writeJson(STORAGE_KEYS.customPools, pools);
}

function uniqueKnownIds(ids) {
  const seen = new Set();
  return ids.filter((id) => {
    if (!byId.has(id) || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function safeFileName(value) {
  return (
    normalize(value)
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "") || "custom-list"
  );
}

function currentMode() {
  return modeInputs.find((input) => input.checked)?.value ?? "top";
}

function setMode(mode) {
  modeInputs.forEach((input) => {
    input.checked = input.value === mode;
  });
  localStorage.setItem(STORAGE_KEYS.mode, mode);
}

function shuffle(items) {
  return items
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

function poolForSettings() {
  const mode = currentMode();
  let selected = [];

  if (mode === "all") selected = [...pokemon];

  if (mode === "custom") {
    const activeId = customPoolSelect.value;
    const active = getCustomPools().find((pool) => pool.id === activeId);
    selected = active ? active.ids.map((id) => byId.get(id)).filter(Boolean) : [];
  }

  if (mode === "top") {
    selected = getUsageRanking()
      .filter((id) => !isMegaId(id))
      .slice(0, Number(topLimit.value))
      .map((id) => byId.get(id))
      .filter(Boolean);
  }

  return withLinkedMegas(selected);
}

function isMegaId(id) {
  return byId.get(id)?.name.startsWith("Mega ") ?? false;
}

function withLinkedMegas(list) {
  const expanded = [];
  const seen = new Set();

  function add(mon) {
    if (!mon || seen.has(mon.id)) return;
    seen.add(mon.id);
    expanded.push(mon);
  }

  list.forEach((mon) => {
    add(mon);
    (MEGA_BY_BASE_ID[mon.id] ?? []).forEach((megaId) => add(byId.get(megaId)));
  });

  return expanded;
}

function resetQuiz() {
  currentPool = poolForSettings();
  sessionEntries = currentPool.map((mon) => ({
    mon,
    sp: randomSp(),
    nature: randomNature(),
    stage: randomStage(),
  }));
  queue = shuffle(sessionEntries);
  correct = 0;
  attempts = 0;
  streak = 0;
  missedIds = new Set();
  feedback.textContent = "";
  feedback.className = "feedback";
  sessionSummary.hidden = true;
  sessionSummary.textContent = "";
  createReviewListButton.hidden = true;
  hideHint();
  nextQuestion();
  updateScore();
  renderTiers();
}

function nextQuestion() {
  current = queue.shift() ?? null;

  if (!current) {
    art.hidden = true;
    art.removeAttribute("src");
    delete art.dataset.pokeapiId;
    delete art.dataset.fallbackApplied;
    art.alt = "";
    rankLabel.hidden = false;
    rankLabel.textContent = currentPool.length ? "Session finished" : "No Pokémon";
    pokemonName.textContent = currentPool.length ? `${correct} / ${attempts}` : "Empty pool";
    variantBadges.innerHTML = "";
    feedback.textContent = "";
    feedback.className = "feedback";
    renderEmptyState(currentPool.length === 0);
    renderSessionSummary();
    answer.value = "";
    answer.disabled = true;
    hintButton.disabled = true;
    hideHint();
    updateScore();
    return;
  }

  hideHint();
  renderEmptyState(false);
  art.hidden = false;
  art.src = pokemonArt(current.mon);
  art.dataset.pokeapiId = current.mon.pokeapiId;
  delete art.dataset.fallbackApplied;
  art.alt = current.mon.name;
  rankLabel.hidden = true;
  rankLabel.textContent = "";
  pokemonName.textContent = current.mon.name;
  sessionSummary.hidden = true;
  sessionSummary.textContent = "";
  createReviewListButton.hidden = true;
  feedback.textContent = "";
  feedback.className = "feedback";
  renderVariantBadges(current);
  answer.disabled = false;
  hintButton.disabled = advancedOptionsActive();
  answer.value = "";
  answer.focus();
  updateScore();
}

function advancedOptionsActive() {
  return (
    fullSpToggle.checked ||
    naturePlusToggle.checked ||
    natureMinusToggle.checked ||
    modifiersToggle.checked
  );
}

function renderVariantBadges(entry) {
  const badges = [];

  if (entry.sp > 0) {
    badges.push(`<span class="variant-badge">Max SP <strong>+32</strong></span>`);
  }

  if (entry.nature !== 1) {
    const isPositive = entry.nature > 1;
    badges.push(
      `<span class="variant-badge nature-${isPositive ? "up" : "down"}">
        Nature ${isPositive ? "▲" : "▼"} <strong>×${entry.nature}</strong>
      </span>`,
    );
  }

  if (modifiersToggle.checked && entry.stage !== 0) {
    const direction = entry.stage > 0 ? "up" : "down";
    badges.push(
      `<span class="variant-badge stage-${direction}">
        <span class="stage-arrows">${stageArrows(entry.stage)}</span>
        <strong>${stageLabel(entry.stage)}</strong> ${stageFormula(entry.stage)}
      </span>`,
    );
  }

  variantBadges.innerHTML = badges.join("");
}

function updateScore() {
  scoreValue.textContent = `${correct} / ${attempts}`;
  streakValue.textContent = streak;
  remainingValue.textContent = current ? queue.length + 1 : 0;
}

function renderEmptyState(isEmpty) {
  quizEmptyState.hidden = !isEmpty;
  quizCardHead.hidden = isEmpty;
  currentPokemon.hidden = isEmpty;
}

function answerText(guess, target) {
  const delta = Math.abs(guess - target);
  if (delta === 0) return `Correct: ${target}.`;
  if (delta <= 5) return `Close: ${target}.`;
  return `${target}.`;
}

function submitAnswer(event) {
  event.preventDefault();
  if (!current) return;

  const guess = Number(answer.value);
  const target = variantSpeed(current);
  const isCorrect = guess === target;

  attempts += 1;
  correct += isCorrect ? 1 : 0;
  if (!isCorrect) missedIds.add(current.mon.id);
  streak = isCorrect ? streak + 1 : 0;
  feedback.textContent = answerText(guess, target);
  feedback.className = `feedback ${isCorrect ? "is-correct" : "is-wrong"}`;
  updateScore();

  window.setTimeout(nextQuestion, isCorrect ? 850 : 1500);
}

function skipQuestion() {
  if (!current) return;
  attempts += 1;
  missedIds.add(current.mon.id);
  streak = 0;
  feedback.textContent = `${variantSpeed(current)}.`;
  feedback.className = "feedback is-wrong";
  updateScore();
  window.setTimeout(nextQuestion, 950);
}

function renderSessionSummary() {
  if (!currentPool.length) {
    sessionSummary.hidden = true;
    sessionSummary.textContent = "";
    createReviewListButton.hidden = true;
    return;
  }

  const misses = missedIds.size;
  sessionSummary.textContent =
    misses > 0
      ? `Session finished: ${correct}/${attempts}. You missed ${misses} Pokémon.`
      : `Session finished: ${correct}/${attempts}. Perfect run.`;
  sessionSummary.hidden = false;
  createReviewListButton.hidden = misses === 0;
}

function createReviewListFromMisses() {
  if (!missedIds.size) return;

  const pools = getCustomPools();
  const id = `review-${Date.now()}`;
  const name = `Review ${new Date().toLocaleDateString()}`;
  pools.push({ id, name, ids: [...missedIds] });
  setCustomPools(pools);
  localStorage.setItem(STORAGE_KEYS.activeCustom, id);
  renderCustomSelect();
  setMode("custom");
  applySettingsVisibility();
  customEditor.open = true;
  resetQuiz();
}

function hideHint() {
  slowerHint.hidden = true;
  fasterHint.hidden = true;
  slowerHint.innerHTML = "";
  fasterHint.innerHTML = "";
}

function findNeighbor(direction) {
  const target = variantSpeed(current);
  const sorted = [...sessionEntries].sort(
    (a, b) => variantSpeed(a) - variantSpeed(b) || a.mon.order - b.mon.order,
  );
  const candidates = sorted.filter((entry) =>
    direction === "slower"
      ? variantSpeed(entry) < target
      : variantSpeed(entry) > target,
  );

  return direction === "slower" ? candidates.at(-1) ?? null : candidates[0] ?? null;
}

function hintMarkup(label, entry, emptyText) {
  if (!entry) {
    return `
      <span class="hint-label">${label}</span>
      <span class="hint-name">${emptyText}</span>
    `;
  }

  const { mon } = entry;
  return `
    <span class="hint-label">${label}</span>
    <img src="${pokemonArt(mon)}" alt="${mon.name}" data-pokeapi-id="${mon.pokeapiId}" />
    <span class="hint-name">${mon.name}</span>
    <span class="hint-speed">${variantSpeed(entry)}</span>
  `;
}

function renderHint() {
  if (!current || advancedOptionsActive()) return;
  slowerHint.innerHTML = hintMarkup("Slower", findNeighbor("slower"), "Slowest");
  fasterHint.innerHTML = hintMarkup("Faster", findNeighbor("faster"), "Fastest");
  slowerHint.hidden = false;
  fasterHint.hidden = false;
}

function renderTiers() {
  tiersSection.hidden = sessionEntries.length === 0;
  if (!sessionEntries.length) {
    tiersList.innerHTML = "";
    return;
  }

  const groups = [...sessionEntries]
    .sort((a, b) => variantSpeed(b) - variantSpeed(a) || a.mon.order - b.mon.order)
    .reduce((tiers, entry) => {
      const speed = variantSpeed(entry);
      const tier = tiers.find((item) => item.speed === speed);
      if (tier) tier.entries.push(entry);
      else tiers.push({ speed, entries: [entry] });
      return tiers;
    }, []);

  tiersList.innerHTML = groups
    .map(
      (tier) => `
        <div class="tier-row">
          <div class="tier-speed">${tier.speed}</div>
          <div class="tier-names">
            ${tier.entries
              .map(
                (entry) => `
                  <span class="tier-pill">
                    <img src="${pokemonArt(entry.mon)}" alt="${entry.mon.name}" data-pokeapi-id="${entry.mon.pokeapiId}" />
                    ${entry.mon.name}
                  </span>
                `,
              )
              .join("")}
          </div>
          <div class="tier-bar" aria-hidden="true">
            ${renderTickBar(tier.speed)}
          </div>
        </div>
      `,
    )
    .join("");
}

function updateTiersToggleLabel() {
  tiersToggleLabel.textContent = tiersSection.open ? "Hide" : "Show";
}

function renderTickBar(speed) {
  const colors = [
    "#2f9e44",
    "#37b24d",
    "#74b816",
    "#a9c42c",
    "#f08c00",
    "#e67700",
    "#f76707",
    "#e8590c",
    "#d9480f",
    "#c92a2a",
  ];
  const total = 10;
  const active = Math.max(1, Math.min(total, Math.round((speed / 200) * total)));

  return Array.from({ length: total }, (_, index) => {
    const isActive = index < active;
    return `<span class="${isActive ? "is-active" : ""}" style="--tick-color: ${colors[index]}"></span>`;
  }).join("");
}

function resolvePokemon(value) {
  if (!value) return null;
  const raw = String(value);
  const normalized = normalize(raw);
  const tokens = normalized.split(" ").filter(Boolean);
  return (
    byId.get(raw) ??
    byName.get(normalized) ??
    pokemon.find((mon) => tokens.every((token) => normalize(mon.name).includes(token))) ??
    null
  );
}

function renderCustomSelect() {
  const pools = getCustomPools();
  const active = localStorage.getItem(STORAGE_KEYS.activeCustom) ?? pools[0]?.id ?? "";

  customPoolSelect.innerHTML = pools.length
    ? pools.map((pool) => `<option value="${pool.id}">${pool.name}</option>`).join("")
    : `<option value="">No lists</option>`;

  if (pools.length && pools.some((pool) => pool.id === active)) {
    customPoolSelect.value = active;
  }

  customPoolSelect.disabled = pools.length === 0;
  deleteCustomButton.disabled = pools.length === 0;
  exportCustomButton.disabled = pools.length === 0;
  customEditor.hidden = pools.length === 0;
  customEmpty.hidden = pools.length !== 0;
  loadCustomDraft();
}

function activeCustomPool() {
  return getCustomPools().find((pool) => pool.id === customPoolSelect.value) ?? null;
}

function loadCustomDraft() {
  const active = activeCustomPool();
  customName.value = active?.name ?? "";
  customDraft = new Set(active?.ids ?? []);
  renderCustomGrid();
}

function renderCustomGrid() {
  const query = normalize(customSearch.value);
  const visible = pokemon.filter((mon) => !query || normalize(mon.name).includes(query));

  customGrid.innerHTML = visible
    .map(
      (mon) => `
        <label class="custom-option">
          <input type="checkbox" value="${mon.id}" ${customDraft.has(mon.id) ? "checked" : ""} />
          <img src="${pokemonArt(mon)}" alt="${mon.name}" data-pokeapi-id="${mon.pokeapiId}" />
          <span>${mon.name}</span>
        </label>
      `,
    )
    .join("");

  customCount.textContent = `${customDraft.size} selected`;
}

function createCustomPool() {
  const pools = getCustomPools();
  const id = `custom-${Date.now()}`;
  pools.push({ id, name: `Custom ${pools.length + 1}`, ids: [] });
  setCustomPools(pools);
  localStorage.setItem(STORAGE_KEYS.activeCustom, id);
  renderCustomSelect();
  customEditor.open = true;
  setMode("custom");
  applySettingsVisibility();
  resetQuiz();
}

function saveCustomPool() {
  const pools = getCustomPools();
  const activeId = customPoolSelect.value || `custom-${Date.now()}`;
  const name = customName.value.trim() || "Custom";
  const updated = { id: activeId, name, ids: [...customDraft] };
  const index = pools.findIndex((pool) => pool.id === activeId);

  if (index >= 0) pools[index] = updated;
  else pools.push(updated);

  setCustomPools(pools);
  localStorage.setItem(STORAGE_KEYS.activeCustom, activeId);
  renderCustomSelect();
  resetQuiz();
}

function deleteCustomPool() {
  const activeId = customPoolSelect.value;
  const active = activeCustomPool();
  if (!active || !window.confirm(`Delete "${active.name}"?`)) return;
  const pools = getCustomPools().filter((pool) => pool.id !== activeId);
  setCustomPools(pools);
  localStorage.setItem(STORAGE_KEYS.activeCustom, pools[0]?.id ?? "");
  renderCustomSelect();
  resetQuiz();
}

function exportCustomPool() {
  const active = activeCustomPool();
  if (!active) return;

  const payload = {
    name: customName.value.trim() || active.name || "Custom",
    ids: uniqueKnownIds([...customDraft]),
  };
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFileName(payload.name)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importCustomPoolFromFile(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const data = JSON.parse(String(reader.result));
      const name = typeof data.name === "string" && data.name.trim() ? data.name.trim() : "Imported list";
      const ids = uniqueKnownIds(Array.isArray(data.ids) ? data.ids : []);

      if (!ids.length) {
        window.alert("Import failed: no valid Pokémon ids found.");
        return;
      }

      const pools = getCustomPools();
      const id = `custom-${Date.now()}`;
      pools.push({ id, name, ids });
      setCustomPools(pools);
      localStorage.setItem(STORAGE_KEYS.activeCustom, id);
      renderCustomSelect();
      customEditor.open = true;
      setMode("custom");
      applySettingsVisibility();
      resetQuiz();
    } catch {
      window.alert("Import failed: invalid JSON file.");
    } finally {
      importCustomFile.value = "";
    }
  });
  reader.readAsText(file);
}

function applySettingsVisibility() {
  const mode = currentMode();
  topSettings.hidden = mode !== "top";
  customSettings.hidden = mode !== "custom";
}

function initSettings() {
  const storedMode = localStorage.getItem(STORAGE_KEYS.mode) ?? "top";
  const pools = getCustomPools();
  applyTheme(localStorage.getItem(STORAGE_KEYS.theme) ?? "dark");
  setMode(storedMode === "custom" && pools.length === 0 ? "top" : storedMode);
  topLimit.value = localStorage.getItem(STORAGE_KEYS.topLimit) ?? "10";
  fullSpToggle.checked = localStorage.getItem(STORAGE_KEYS.fullSp) === "true";
  naturePlusToggle.checked = localStorage.getItem(STORAGE_KEYS.naturePlus) === "true";
  natureMinusToggle.checked = localStorage.getItem(STORAGE_KEYS.natureMinus) === "true";
  modifiersToggle.checked = localStorage.getItem(STORAGE_KEYS.modifiers) === "true";
  renderCustomSelect();
  applySettingsVisibility();
}

form.addEventListener("submit", submitAnswer);
skipButton.addEventListener("click", skipQuestion);
resetButton.addEventListener("click", resetQuiz);
hintButton.addEventListener("click", renderHint);
fullSpToggle.addEventListener("change", () => {
  localStorage.setItem(STORAGE_KEYS.fullSp, String(fullSpToggle.checked));
  hideHint();
  resetQuiz();
});
naturePlusToggle.addEventListener("change", () => {
  localStorage.setItem(STORAGE_KEYS.naturePlus, String(naturePlusToggle.checked));
  hideHint();
  resetQuiz();
});
natureMinusToggle.addEventListener("change", () => {
  localStorage.setItem(STORAGE_KEYS.natureMinus, String(natureMinusToggle.checked));
  hideHint();
  resetQuiz();
});
modifiersToggle.addEventListener("change", () => {
  localStorage.setItem(STORAGE_KEYS.modifiers, String(modifiersToggle.checked));
  hideHint();
  resetQuiz();
});
themeToggle.addEventListener("change", () => {
  const theme = themeToggle.checked ? "light" : "dark";
  localStorage.setItem(STORAGE_KEYS.theme, theme);
  applyTheme(theme);
});

modeInputs.forEach((input) => {
  input.addEventListener("change", () => {
    localStorage.setItem(STORAGE_KEYS.mode, currentMode());
    applySettingsVisibility();
    resetQuiz();
  });
});

topLimit.addEventListener("change", () => {
  localStorage.setItem(STORAGE_KEYS.topLimit, topLimit.value);
  resetQuiz();
});

customPoolSelect.addEventListener("change", () => {
  localStorage.setItem(STORAGE_KEYS.activeCustom, customPoolSelect.value);
  loadCustomDraft();
  resetQuiz();
});

newCustomButton.addEventListener("click", createCustomPool);
deleteCustomButton.addEventListener("click", deleteCustomPool);
exportCustomButton.addEventListener("click", exportCustomPool);
importCustomButton.addEventListener("click", () => importCustomFile.click());
importCustomFile.addEventListener("change", () => {
  importCustomPoolFromFile(importCustomFile.files[0]);
});
saveCustomButton.addEventListener("click", saveCustomPool);
clearCustomButton.addEventListener("click", () => {
  customDraft.clear();
  renderCustomGrid();
});
createReviewListButton.addEventListener("click", createReviewListFromMisses);
tiersSection.addEventListener("toggle", updateTiersToggleLabel);
customSearch.addEventListener("input", renderCustomGrid);
customGrid.addEventListener("change", (event) => {
  if (!event.target.matches('input[type="checkbox"]')) return;
  if (event.target.checked) customDraft.add(event.target.value);
  else customDraft.delete(event.target.value);
  customCount.textContent = `${customDraft.size} selected`;
});

async function initApp() {
  await loadUsageRanking();
  initSettings();
  updateTiersToggleLabel();
  resetQuiz();
}

initApp();
