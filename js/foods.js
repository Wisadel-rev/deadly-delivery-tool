let foods = [];
// Store active rarities using a Set for multi-select support
let selectedRarities = new Set(["All"]);

const rarityRank = {
  "Common": 1,
  "Uncommon": 2,
  "Rare": 3,
  "Epic": 4,
  "Legendary": 5,
  "Mythic": 6
};

// Fetch Data from json/foods.json
async function loadFoodData() {
  try {
    const response = await fetch("../json/foods.json");
    foods = await response.json();
    renderFoods();
  } catch (error) {
    console.error("Error loading food data:", error);
  }
}

// Render Food Cards
function renderFoods() {
  const grid = document.getElementById("foodGrid");
  const searchQuery = document.getElementById("searchInput").value.toLowerCase();
  const sortOption = document.getElementById("sortOption").value;
  const itemCountEl = document.getElementById("itemCount");

  grid.innerHTML = "";

  // 1. Filter items by search query and active rarities
  const filteredFoods = foods.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery);
    
    // Matches if "All" is active OR if item's rarity is inside selectedRarities Set
    const matchesRarity = selectedRarities.has("All") || selectedRarities.has(item.rarity);
    
    return matchesSearch && matchesRarity;
  });

  // 2. Sort items dynamically based on the dropdown choice
  filteredFoods.sort((a, b) => {
    if (sortOption === "rarity") {
      // Sort by Rarity Rank first, then Alphabetically within the same rank
      if (rarityRank[a.rarity] !== rarityRank[b.rarity]) {
        return rarityRank[a.rarity] - rarityRank[b.rarity];
      }
      return a.name.localeCompare(b.name);
    } 
    else if (sortOption === "nameAsc") {
      return a.name.localeCompare(b.name);
    } 
    else if (sortOption === "nameDesc") {
      return b.name.localeCompare(a.name);
    } 
    else if (sortOption === "valAsc") {
      return a.value - b.value;
    } 
    else if (sortOption === "valDesc") {
      return b.value - a.value;
    }
  });

  // Update item counter
  if (itemCountEl) {
    itemCountEl.textContent = `${filteredFoods.length} Foods`;
  }

  // Handle empty state
  if (filteredFoods.length === 0) {
    grid.innerHTML = `<p class="no-results">No foods found.</p>`;
    return;
  }

  // Generate cards with images
  filteredFoods.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    
    // Fallback if image path is missing or fails to load
    const imageSrc = item.image || "../images/foods/placeholder.png";

    card.innerHTML = `
      <div class="card-image-wrapper">
        <img 
          src="${imageSrc}" 
          alt="${item.name}" 
          class="card-img"
          onerror="this.onerror=null; this.src='https://via.placeholder.com/80?text=?';"
        />
      </div>
      <div class="card-content">
        <span class="badge badge-${item.rarity.toLowerCase()}">${item.rarity}</span>
        <h3>${item.name}</h3>
        <p class="value">Base Value: $${item.value.toLocaleString()}</p>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Controls Event Listeners
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const sortOption = document.getElementById("sortOption");

// 1. Search Input & Clear Button Visibility
searchInput.addEventListener("input", () => {
  if (searchInput.value.trim() !== "") {
    clearSearchBtn.style.display = "block";
  } else {
    clearSearchBtn.style.display = "none";
  }
  renderFoods();
});

// 2. Clear Search Action
clearSearchBtn.addEventListener("click", () => {
  searchInput.value = "";
  clearSearchBtn.style.display = "none";
  searchInput.focus();
  renderFoods();
});

// 3. Sort Dropdown Action
sortOption.addEventListener("change", renderFoods);

// 4. Multi-Select Rarity Filter Pill Buttons
const filterContainer = document.getElementById("rarityFilterContainer");
if (filterContainer) {
  filterContainer.addEventListener("click", (e) => {
    if (!e.target.classList.contains("filter-btn")) return;

    const clickedRarity = e.target.getAttribute("data-rarity");
    const allBtn = filterContainer.querySelector('[data-rarity="All"]');

    if (clickedRarity === "All") {
      // If "All" clicked: reset selection back to only "All"
      selectedRarities.clear();
      selectedRarities.add("All");

      filterContainer.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
      allBtn.classList.add("active");
    } else {
      // If specific rarity clicked: remove "All"
      selectedRarities.delete("All");
      allBtn.classList.remove("active");

      // Toggle clicked rarity in or out of the Set
      if (selectedRarities.has(clickedRarity)) {
        selectedRarities.delete(clickedRarity);
        e.target.classList.remove("active");
      } else {
        selectedRarities.add(clickedRarity);
        e.target.classList.add("active");
      }

      // If everything was deselected, default back to "All"
      if (selectedRarities.size === 0) {
        selectedRarities.add("All");
        allBtn.classList.add("active");
      }
    }

    renderFoods();
  });
}

// Initial Data Load
loadFoodData();