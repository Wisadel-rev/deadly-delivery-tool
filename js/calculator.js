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

// DOM Elements
const foodSearchInput = document.getElementById("foodSearchInput");
const clearFoodSearchBtn = document.getElementById("clearFoodSearchBtn"); // Clear button for search
const foodDropdown = document.getElementById("foodDropdown");
const selectedFoodBadge = document.getElementById("selectedFoodBadge");
const selectedFoodName = document.getElementById("selectedFoodName");
const selectedFoodPrice = document.getElementById("selectedFoodPrice");
const clearFoodBtn = document.getElementById("clearFoodBtn");

const sizeInput = document.getElementById("sizeInput");

const regularContainer = document.getElementById("regularMutationsContainer");
const advancedContainer = document.getElementById("advancedMutationsContainer");
const specialContainer = document.getElementById("specialMutationsContainer");

const formulaBreakdown = document.getElementById("formulaBreakdown");
const finalPriceOutput = document.getElementById("finalPriceOutput");
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

// 3. Render Mutation Tag Buttons with Tooltips (Shows exact multipliers)
function renderTags(mutationsList, container, stateSet, symbol) {
  container.innerHTML = "";
  mutationsList.forEach(mut => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tag-btn";
    btn.textContent = mut.name;
    btn.dataset.id = mut.id;

    // Format tooltips to show actual multiplier values (e.g., x5, x0.5, x3)
    let formattedTooltip = "";
    
    if (symbol === "^") {
      // Special Mutations: Math.pow(3, mut.value) -> e.g., value of 1 gives x3
      const multiplier = Math.pow(3, mut.value);
      formattedTooltip = `x${multiplier}`;
    } else {
      // Regular / Advanced Mutations: value 0.5 -> x1.5, value -0.5 -> x0.5, value 4 -> x5
      const multiplier = 1 + mut.value;
      formattedTooltip = `x${multiplier}`;
    }

    btn.setAttribute("data-tooltip", formattedTooltip);

    btn.addEventListener("click", () => {
      if (stateSet.has(mut.id)) {
        stateSet.delete(mut.id);
        btn.classList.remove("active");
      } else {
        stateSet.add(mut.id);
        btn.classList.add("active");
      }
      calculatePrice();
    });

    container.appendChild(btn);
  });
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
    foodDropdown.innerHTML = `<div class="dropdown-item">No food items found</div>`;
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

  // Reset and apply rarity class
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

// Reset All Logic
function resetAll() {
  clearFoodSelection();
  sizeInput.value = 1.0;
  
  selectedRegulars.clear();
  selectedAdvanced.clear();
  selectedSpecials.clear();

  document.querySelectorAll(".tag-btn").forEach(btn => btn.classList.remove("active"));
  calculatePrice();
}

// 5. Calculate Final Price and Display Formula
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

// 6. Event Listeners & Hotkeys
function setupEventListeners() {
  // Input Typing: Filter dropdown and toggle clear button
  foodSearchInput.addEventListener("input", (e) => {
    const val = e.target.value;
    if (clearFoodSearchBtn) {
      clearFoodSearchBtn.style.display = val.trim() !== "" ? "block" : "none";
    }
    filterFoodDropdown(val);
  });

  // Clear search input on button click
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

  document.addEventListener("click", (e) => {
    if (!foodSearchInput.contains(e.target) && !foodDropdown.contains(e.target) && (!clearFoodSearchBtn || !clearFoodSearchBtn.contains(e.target))) {
      foodDropdown.classList.add("hidden");
    }
  });

  clearFoodBtn.addEventListener("click", clearFoodSelection);
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