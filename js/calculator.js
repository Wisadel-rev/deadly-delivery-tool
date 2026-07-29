// State Management
let foodsData = [];
let mutationData = {
  regularMutations: [],
  advancedMutations: [],
  specialMutations: []
};

let selectedFood = null;
let selectedRegulars = new Set();
let selectedAdvanced = new Set();
let selectedSpecials = new Set();

// Active index for keyboard arrow navigation
let activeDropdownIndex = -1;

// DOM Elements
const foodSearchInput = document.getElementById("foodSearchInput");
const clearFoodSearchBtn = document.getElementById("clearFoodSearchBtn");
const foodDropdown = document.getElementById("foodDropdown");
const selectedFoodBadge = document.getElementById("selectedFoodBadge");
const selectedFoodName = document.getElementById("selectedFoodName");
const selectedFoodPrice = document.getElementById("selectedFoodPrice");
const clearFoodBtn = document.getElementById("clearFoodBtn");

// Mutation Search DOM Elements
const mutationSearchInput = document.getElementById("mutationSearchInput");
const clearMutationSearchBtn = document.getElementById("clearMutationSearchBtn");
const mutationDropdown = document.getElementById("mutationDropdown");

const sizeInput = document.getElementById("sizeInput");

const regularContainer = document.getElementById("regularMutationsContainer");
const advancedContainer = document.getElementById("advancedMutationsContainer");
const specialContainer = document.getElementById("specialMutationsContainer");

const formulaBreakdown = document.getElementById("formulaBreakdown");
const finalPriceOutput = document.getElementById("finalPriceOutput");
const resetMutationsBtn = document.getElementById("resetMutationsBtn");
const resetAllBtn = document.getElementById("resetAllBtn");

// 1. Fetch Data from JSON Files
async function loadData() {
  try {
    const [foodsRes, calcRes] = await Promise.all([
      fetch("../json/foods.json"),
      fetch("../json/calculator.json")
    ]);

    if (!foodsRes.ok || !calcRes.ok) {
      throw new Error("Failed to load JSON data.");
    }

    foodsData = await foodsRes.json();
    mutationData = await calcRes.json();

    initUI();
  } catch (error) {
    console.error("Error initializing calculator:", error);
  }
}

// 2. Initialize UI Components
function initUI() {
  renderTags(mutationData.regularMutations, regularContainer, selectedRegulars, "+");
  renderTags(mutationData.advancedMutations, advancedContainer, selectedAdvanced, "+");
  renderTags(mutationData.specialMutations, specialContainer, selectedSpecials, "^");

  setupEventListeners();
  calculatePrice();
}

// 3. Render Mutation Tag Buttons with Tooltips
function renderTags(mutationsList, container, stateSet, symbol) {
  container.innerHTML = "";
  mutationsList.forEach(mut => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tag-btn";
    btn.textContent = mut.name;
    btn.dataset.id = mut.id;

    let formattedTooltip = "";
    if (symbol === "^") {
      const multiplier = Math.pow(3, mut.value);
      formattedTooltip = `x${multiplier}`;
    } else {
      const multiplier = 1 + mut.value;
      formattedTooltip = `x${multiplier}`;
    }

    btn.setAttribute("data-tooltip", formattedTooltip);

    btn.addEventListener("click", () => {
      toggleMutation(mut.id, categoryTypeByMutId(mut.id));
    });

    container.appendChild(btn);
  });
}

// Helper: Determine category type ('regular', 'advanced', or 'special') by mutation ID
function categoryTypeByMutId(id) {
  if (mutationData.regularMutations.some(m => m.id === id)) return 'regular';
  if (mutationData.advancedMutations.some(m => m.id === id)) return 'advanced';
  if (mutationData.specialMutations.some(m => m.id === id)) return 'special';
  return null;
}

// Helper: Toggle a mutation state & sync tag button UI
function toggleMutation(id, categoryType) {
  let targetSet = null;
  if (categoryType === 'regular') targetSet = selectedRegulars;
  else if (categoryType === 'advanced') targetSet = selectedAdvanced;
  else if (categoryType === 'special') targetSet = selectedSpecials;

  if (!targetSet) return;

  const btn = document.querySelector(`.tag-btn[data-id="${id}"]`);

  if (targetSet.has(id)) {
    targetSet.delete(id);
    if (btn) btn.classList.remove("active");
  } else {
    targetSet.add(id);
    if (btn) btn.classList.add("active");
  }

  calculatePrice();
}

// 4. Food Search & Selection Logic
function filterFoodDropdown(query) {
  const cleanQuery = query.toLowerCase().trim();
  if (!cleanQuery) {
    foodDropdown.classList.add("hidden");
    foodDropdown.innerHTML = "";
    return;
  }

  const matches = foodsData.filter(food => 
    food.name.toLowerCase().includes(cleanQuery)
  );

  if (matches.length === 0) {
    foodDropdown.innerHTML = `<div class="dropdown-item no-results">No food items found</div>`;
  } else {
    foodDropdown.innerHTML = matches.map(food => {
      const price = food.value ?? 0;
      return `
        <div class="dropdown-item" data-id="${food.name}" data-name="${food.name}" data-price="${price}" data-rarity="${food.rarity || 'Common'}">
          <span>${food.name}</span>
          <span class="base-price-tag">$${price}</span>
        </div>
      `;
    }).join("");
  }

  foodDropdown.classList.remove("hidden");
}

function selectFood(food) {
  selectedFood = food;
  selectedFoodName.textContent = food.name;
  selectedFoodPrice.textContent = `($${food.price})`;
  
  foodSearchInput.value = "";
  if (clearFoodSearchBtn) clearFoodSearchBtn.style.display = "none";
  foodSearchInput.classList.add("hidden");
  foodDropdown.classList.add("hidden");

  selectedFoodBadge.className = "selected-badge";
  if (food.rarity) {
    selectedFoodBadge.classList.add(`rarity-${food.rarity.toLowerCase()}`);
  }

  selectedFoodBadge.classList.remove("hidden");
  calculatePrice();
}

function clearFoodSelection() {
  selectedFood = null;
  selectedFoodBadge.className = "selected-badge hidden";
  foodSearchInput.classList.remove("hidden");
  foodSearchInput.value = "";
  if (clearFoodSearchBtn) clearFoodSearchBtn.style.display = "none";
  foodSearchInput.focus();

  calculatePrice();
}

// 5. Mutation Search & Selection Logic
function filterMutationDropdown(query) {
  const cleanQuery = query.toLowerCase().trim();
  if (!cleanQuery) {
    mutationDropdown.classList.add("hidden");
    mutationDropdown.innerHTML = "";
    return;
  }

  // Combine all categories into one searchable list
  const allMutations = [
    ...mutationData.regularMutations.map(m => ({ ...m, category: 'Regular', type: 'regular' })),
    ...mutationData.advancedMutations.map(m => ({ ...m, category: 'Advanced', type: 'advanced' })),
    ...mutationData.specialMutations.map(m => ({ ...m, category: 'Special', type: 'special' }))
  ];

  const matches = allMutations.filter(mut => 
    mut.name.toLowerCase().includes(cleanQuery)
  );

  if (matches.length === 0) {
    mutationDropdown.innerHTML = `<div class="dropdown-item no-results">No mutations found</div>`;
  } else {
    mutationDropdown.innerHTML = matches.map(mut => {
      let isSelected = false;
      if (mut.type === 'regular') isSelected = selectedRegulars.has(mut.id);
      else if (mut.type === 'advanced') isSelected = selectedAdvanced.has(mut.id);
      else if (mut.type === 'special') isSelected = selectedSpecials.has(mut.id);

      const activeBadge = isSelected ? `<span class="active-badge">Selected</span>` : '';

      return `
        <div class="dropdown-item" data-id="${mut.id}" data-type="${mut.type}">
          <span>${mut.name} <small style="color: var(--text-muted); font-size: 0.8rem;">(${mut.category})</small></span>
          ${activeBadge}
        </div>
      `;
    }).join("");
  }

  mutationDropdown.classList.remove("hidden");
}

// Helper: Visual Highlight for Arrow Navigation
function updateDropdownHighlight(items) {
  items.forEach((item, idx) => {
    if (idx === activeDropdownIndex) {
      item.classList.add("highlighted");
      item.scrollIntoView({ block: "nearest" });
    } else {
      item.classList.remove("highlighted");
    }
  });
}

// Reset Only Mutations Logic
function resetMutations() {
  selectedRegulars.clear();
  selectedAdvanced.clear();
  selectedSpecials.clear();

  document.querySelectorAll(".tag-btn").forEach(btn => btn.classList.remove("active"));
  
  if (mutationSearchInput) {
    mutationSearchInput.value = "";
    if (clearMutationSearchBtn) clearMutationSearchBtn.style.display = "none";
  }
  if (mutationDropdown) mutationDropdown.classList.add("hidden");

  calculatePrice();
}

// Reset All Logic
function resetAll() {
  clearFoodSelection();
  sizeInput.value = 1.0;
  resetMutations();
}

// 6. Calculate Final Price and Display Formula
function calculatePrice() {
  const basePrice = selectedFood ? parseFloat(selectedFood.price) : 0;
  let size = parseFloat(sizeInput.value);

  if (isNaN(size)) size = 1.0;
  size = Math.min(Math.max(size, 0.25), 4.0);

  let regSum = 0;
  selectedRegulars.forEach(id => {
    const item = mutationData.regularMutations.find(m => m.id === id);
    if (item) regSum += item.value;
  });

  let advSum = 0;
  selectedAdvanced.forEach(id => {
    const item = mutationData.advancedMutations.find(m => m.id === id);
    if (item) advSum += item.value;
  });

  let specSum = 0;
  selectedSpecials.forEach(id => {
    const item = mutationData.specialMutations.find(m => m.id === id);
    if (item) specSum += item.value;
  });

  const basePart = basePrice * size;
  const regTerm = 1 + regSum;
  const advTerm = 1 + advSum;
  const specTerm = Math.pow(3, specSum);

  const finalPrice = basePart * regTerm * advTerm * specTerm;

  const breakdownStr = `(${basePrice} x ${size}) x (1 + ${regSum}) x (1 + ${advSum}) x 3^(${specSum})`;
  formulaBreakdown.textContent = breakdownStr;

  finalPriceOutput.textContent = `$${finalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// 7. Event Listeners & Hotkeys
function setupEventListeners() {
  // --- FOOD SEARCH LISTENERS ---
  foodSearchInput.addEventListener("input", (e) => {
    const val = e.target.value;
    activeDropdownIndex = -1;
    if (clearFoodSearchBtn) {
      clearFoodSearchBtn.style.display = val.trim() !== "" ? "block" : "none";
    }
    filterFoodDropdown(val);
  });

  foodSearchInput.addEventListener("keydown", (e) => {
    const items = foodDropdown.querySelectorAll(".dropdown-item:not(.no-results)");
    if (!items.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeDropdownIndex = (activeDropdownIndex + 1) % items.length;
      updateDropdownHighlight(items);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeDropdownIndex = (activeDropdownIndex - 1 + items.length) % items.length;
      updateDropdownHighlight(items);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const targetIndex = activeDropdownIndex >= 0 ? activeDropdownIndex : 0;
      const targetItem = items[targetIndex];

      if (targetItem && targetItem.dataset.name) {
        selectFood({
          id: targetItem.dataset.id,
          name: targetItem.dataset.name,
          price: parseFloat(targetItem.dataset.price),
          rarity: targetItem.dataset.rarity
        });
      }
    }
  });

  if (clearFoodSearchBtn) {
    clearFoodSearchBtn.addEventListener("click", () => {
      foodSearchInput.value = "";
      clearFoodSearchBtn.style.display = "none";
      foodSearchInput.focus();
      filterFoodDropdown("");
    });
  }

  foodDropdown.addEventListener("click", (e) => {
    const item = e.target.closest(".dropdown-item");
    if (item && item.dataset.name) {
      selectFood({
        id: item.dataset.id,
        name: item.dataset.name,
        price: parseFloat(item.dataset.price),
        rarity: item.dataset.rarity
      });
    }
  });

  // --- MUTATION SEARCH LISTENERS ---
  if (mutationSearchInput) {
    mutationSearchInput.addEventListener("input", (e) => {
      const val = e.target.value;
      activeDropdownIndex = -1;
      if (clearMutationSearchBtn) {
        clearMutationSearchBtn.style.display = val.trim() !== "" ? "block" : "none";
      }
      filterMutationDropdown(val);
    });

    mutationSearchInput.addEventListener("keydown", (e) => {
      const items = mutationDropdown.querySelectorAll(".dropdown-item:not(.no-results)");
      if (!items.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        activeDropdownIndex = (activeDropdownIndex + 1) % items.length;
        updateDropdownHighlight(items);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeDropdownIndex = (activeDropdownIndex - 1 + items.length) % items.length;
        updateDropdownHighlight(items);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const targetIndex = activeDropdownIndex >= 0 ? activeDropdownIndex : 0;
        const targetItem = items[targetIndex];

        if (targetItem && targetItem.dataset.id) {
          const id = targetItem.dataset.id;
          const type = targetItem.dataset.type;
          toggleMutation(id, type);

          mutationSearchInput.value = "";
          if (clearMutationSearchBtn) clearMutationSearchBtn.style.display = "none";
          mutationDropdown.classList.add("hidden");
        }
      }
    });
  }

  if (clearMutationSearchBtn) {
    clearMutationSearchBtn.addEventListener("click", () => {
      mutationSearchInput.value = "";
      clearMutationSearchBtn.style.display = "none";
      mutationSearchInput.focus();
      filterMutationDropdown("");
    });
  }

  if (mutationDropdown) {
    mutationDropdown.addEventListener("click", (e) => {
      const item = e.target.closest(".dropdown-item");
      if (item && item.dataset.id) {
        const id = item.dataset.id;
        const type = item.dataset.type;
        toggleMutation(id, type);
        
        filterMutationDropdown(mutationSearchInput.value);
      }
    });
  }

  // --- GENERAL LISTENERS ---
  document.addEventListener("click", (e) => {
    if (foodSearchInput && !foodSearchInput.contains(e.target) && !foodDropdown.contains(e.target) && (!clearFoodSearchBtn || !clearFoodSearchBtn.contains(e.target))) {
      foodDropdown.classList.add("hidden");
    }
    if (mutationSearchInput && mutationDropdown && !mutationSearchInput.contains(e.target) && !mutationDropdown.contains(e.target) && (!clearMutationSearchBtn || !clearMutationSearchBtn.contains(e.target))) {
      mutationDropdown.classList.add("hidden");
    }
  });

  clearFoodBtn.addEventListener("click", clearFoodSelection);
  if (resetMutationsBtn) resetMutationsBtn.addEventListener("click", resetMutations);
  if (resetAllBtn) resetAllBtn.addEventListener("click", resetAll);

  sizeInput.addEventListener("input", calculatePrice);
  sizeInput.addEventListener("blur", () => {
    let size = parseFloat(sizeInput.value);
    if (isNaN(size) || size < 0.25) size = 0.25;
    if (size > 4.0) size = 4.0;
    sizeInput.value = size;
    calculatePrice();
  });

  // Hotkey: Press ESC to reset everything
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      resetAll();
    }
  });
}

// Run Initial Load
loadData();