let dishes = [];
let currentEdibleFilter = "All"; // Track selected filter state

// Fetch Data from json/dishes.json
async function loadDishData() {
  try {
    const response = await fetch("../json/dishes.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    dishes = await response.json();
    renderDishes();
  } catch (error) {
    console.error("Error loading dish data:", error);
  }
}

// Helper to check if a dish is edible
function isDishEdible(dish) {
  return dish.effects && dish.effects.length > 0 && dish.effects[0] !== "None";
}

// Helper to convert time strings (e.g., "1h 30m 15s") into total seconds for sorting
function parseTimeToSeconds(timeStr) {
  if (!timeStr) return 0;
  
  let totalSeconds = 0;
  const hoursMatch = timeStr.match(/(\d+)\s*h/);
  const minutesMatch = timeStr.match(/(\d+)\s*m/);
  const secondsMatch = timeStr.match(/(\d+)\s*s/);

  if (hoursMatch) totalSeconds += parseInt(hoursMatch[1]) * 3600;
  if (minutesMatch) totalSeconds += parseInt(minutesMatch[1]) * 60;
  if (secondsMatch) totalSeconds += parseInt(secondsMatch[1]);

  return totalSeconds;
}

// Helper function to highlight matching search text
function highlightMatch(text, query) {
  if (!query) return text;
  // Escape special regex characters in search query
  const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${safeQuery})`, 'gi');
  return text.replace(regex, '<mark class="highlight">$1</mark>');
}

// Render Dish Cards
function renderDishes() {
  const grid = document.getElementById("dishGrid");
  const searchQuery = document.getElementById("searchInput").value.toLowerCase();
  const sortOption = document.getElementById("sortOption").value;
  const itemCountEl = document.getElementById("itemCount");

  grid.innerHTML = "";

  // 1. Filter dishes by search and edible status
  const filteredDishes = dishes.filter(dish => {
    const matchesName = dish.name.toLowerCase().includes(searchQuery);
    const matchesIngredient = dish.ingredients.some(ing => ing.toLowerCase().includes(searchQuery));
    const matchesSearch = matchesName || matchesIngredient;

    const edibleStatus = isDishEdible(dish);
    let matchesEdible = true;

    if (currentEdibleFilter === "Edible") {
      matchesEdible = edibleStatus === true;
    } else if (currentEdibleFilter === "Inedible") {
      matchesEdible = edibleStatus === false;
    }

    return matchesSearch && matchesEdible;
  });

  // 2. Sort dishes
  filteredDishes.sort((a, b) => {
    if (sortOption === "nameAsc") {
      return a.name.localeCompare(b.name);
    } else if (sortOption === "nameDesc") {
      return b.name.localeCompare(a.name);
    } else if (sortOption === "timeAsc") {
      return parseTimeToSeconds(a.cookTime) - parseTimeToSeconds(b.cookTime);
    } else if (sortOption === "timeDesc") {
      return parseTimeToSeconds(b.cookTime) - parseTimeToSeconds(a.cookTime);
    }
  });

  // Update item counter
  if (itemCountEl) {
    itemCountEl.textContent = `${filteredDishes.length} Dishes`;
  }

  // Handle empty state
  if (filteredDishes.length === 0) {
    grid.innerHTML = `<p class="no-results">No dishes found.</p>`;
    return;
  }

  // Generate cards
  filteredDishes.forEach(dish => {
    const card = document.createElement("div");
    card.className = "card dish-card";

    // Determine edible status tag
    const edible = isDishEdible(dish);
    const tagClass = edible ? "tag-edible" : "tag-inedible";
    const tagText = edible ? "Edible" : "Inedible";

    // Highlight dish name
    const highlightedName = highlightMatch(dish.name, searchQuery);

    // Image Fallback
    const imageSrc = dish.image || "../images/dishes/placeholder.png";

    // Format ingredients as bullet items (with search highlight)
    const ingredientsHTML = dish.ingredients
      .map(ing => `<li>${highlightMatch(ing, searchQuery)}</li>`)
      .join("");

    // Format effects as bullet items
    const effectsHTML = dish.effects
      .map(eff => `<li>${eff}</li>`)
      .join("");

    card.innerHTML = `
      <div class="dish-header">
        <div class="dish-title-row">
          <h3>${highlightedName}</h3>
          <span class="edible-tag ${tagClass}">${tagText}</span>
        </div>
        <div class="cook-time-wrapper">
          <span class="cook-time-label">Cook Time:</span>
          <span class="cook-time">${dish.cookTime}</span>
        </div>
      </div>

      <div class="dish-body-middle">
        <div class="card-image-wrapper">
          <img 
            src="${imageSrc}" 
            alt="${dish.name}" 
            class="card-img"
            onerror="this.onerror=null; this.src='https://via.placeholder.com/80?text=?';"
          />
        </div>
        <div class="dish-section ingredients-section">
          <h4>Ingredients:</h4>
          <ul class="ingredient-list">
            ${ingredientsHTML}
          </ul>
        </div>
      </div>

      <div class="dish-section effects-section">
        <h4>Effects:</h4>
        <ul class="effect-list">
          ${effectsHTML}
        </ul>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Event Listeners
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const sortOption = document.getElementById("sortOption");
const filterContainer = document.getElementById("edibleFilterContainer");

searchInput.addEventListener("input", () => {
  if (searchInput.value.trim() !== "") {
    clearSearchBtn.style.display = "block";
  } else {
    clearSearchBtn.style.display = "none";
  }
  renderDishes();
});

clearSearchBtn.addEventListener("click", () => {
  searchInput.value = "";
  clearSearchBtn.style.display = "none";
  searchInput.focus();
  renderDishes();
});

sortOption.addEventListener("change", renderDishes);

// Edible Filter Buttons Click Handling
if (filterContainer) {
  filterContainer.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") {
      filterContainer.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
      e.target.classList.add("active");
      currentEdibleFilter = e.target.getAttribute("data-edible");
      renderDishes();
    }
  });
}

// Initial Load
loadDishData();