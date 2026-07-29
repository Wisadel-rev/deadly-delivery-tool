document.addEventListener('DOMContentLoaded', () => {
  // State Variables
  let skinsData = [];
  let currentCategory = 'classes'; // 'classes' or 'gear'
  let currentRarity = 'all';
  let searchQuery = '';

  // DOM Elements
  const skinsContainer = document.getElementById('skins-grid-container');
  const searchInput = document.getElementById('skin-search');
  const toggleBtns = document.querySelectorAll('.toggle-btn');
  const rarityChips = document.querySelectorAll('.filter-chip');
  const countBadge = document.getElementById('skins-count');
  const galleryTitle = document.getElementById('gallery-title');

  // 1. Fetch JSON Data
  fetch('../json/skins.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      skinsData = data;
      renderGallery();
    })
    .catch(error => {
      console.error('Error loading skins data:', error);
      skinsContainer.innerHTML = `
        <div class="no-results">
          <p>⚠️ Failed to load skins data. Make sure <code>skins.json</code> exists in the data directory.</p>
        </div>
      `;
      if (countBadge) countBadge.textContent = 'Showing 0 skins';
    });

  // 2. Filter & Render Logic
  function renderGallery() {
    skinsContainer.innerHTML = '';

    // Determine target list based on JSON structure (Array or Object)
    let targetData = [];
    if (Array.isArray(skinsData)) {
      targetData = skinsData;
    } else {
      targetData = skinsData[currentCategory] || [];
    }

    let visibleCount = 0;
    let totalCategoryCount = 0;

    targetData.forEach(group => {
      const groupName = group.class || group.gear || 'Unknown';
      
      // Count total skins in the current active category
      if (group.skins && Array.isArray(group.skins)) {
        totalCategoryCount += group.skins.length;
      }

      // Filter skins in this group based on rarity and search text
      const filteredSkins = group.skins.filter(skin => {
        const matchesRarity = (currentRarity === 'all') || 
                              (skin.rarity.toLowerCase() === currentRarity.toLowerCase());
        
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = query === '' || 
                              skin.name.toLowerCase().includes(query) || 
                              groupName.toLowerCase().includes(query);

        return matchesRarity && matchesSearch;
      });

      // If any skins match in this class/gear, render the group
      if (filteredSkins.length > 0) {
        visibleCount += filteredSkins.length;

        // Group Container
        const groupEl = document.createElement('div');
        groupEl.className = 'class-group';

        // Title Heading
        const titleEl = document.createElement('h2');
        titleEl.className = 'class-title';
        titleEl.textContent = groupName;

        // Grid Container for Skin Cards
        const gridEl = document.createElement('div');
        gridEl.className = 'skins-grid';

        // Render Cards
        filteredSkins.forEach(skin => {
          const card = createSkinCard(skin, groupName);
          gridEl.appendChild(card);
        });

        groupEl.appendChild(titleEl);
        groupEl.appendChild(gridEl);
        skinsContainer.appendChild(groupEl);
      }
    });

    // Handle Empty State
    if (visibleCount === 0) {
      skinsContainer.innerHTML = `
        <div class="no-results">
          <p>No skins found matching your current filters.</p>
        </div>
      `;
    }

    // Update Counter & Title Badge
    updateSkinsCounter(visibleCount, totalCategoryCount);
  }

  // 3. Update Counter Badge & Title Text
  function updateSkinsCounter(visible, total) {
    if (galleryTitle) {
      galleryTitle.textContent = currentCategory === 'classes' ? 'Class Skins' : 'Gear Skins';
    }

    if (countBadge) {
      if (visible === total) {
        countBadge.textContent = `Showing ${visible} skin${visible !== 1 ? 's' : ''}`;
      } else {
        countBadge.textContent = `Showing ${visible} of ${total} skin${total !== 1 ? 's' : ''}`;
      }
    }
  }

  // 4. Create Skin Card HTML Element
  function createSkinCard(skin, groupName) {
    const card = document.createElement('div');
    const rarityClass = skin.rarity ? skin.rarity.toLowerCase() : 'common';
    card.className = `skin-card ${rarityClass}`;

    // Image Fallback Handler
    const imagePath = skin.image || `../images/skins/placeholder.png`;
    const fallbackText = encodeURIComponent(skin.name);
    const placeholderUrl = `https://via.placeholder.com/300x300/14161d/888888?text=${fallbackText}`;

    card.innerHTML = `
      <div class="skin-img-wrapper">
        <img 
          src="${imagePath}" 
          alt="${skin.name}" 
          loading="lazy"
          onerror="this.onerror=null; this.src='${placeholderUrl}';"
        >
      </div>
      <div class="skin-info">
        <h3 class="skin-name">${skin.name}</h3>
        <span class="skin-rarity-tag">${skin.rarity}</span>
      </div>
    `;

    return card;
  }

  // 5. Event Listeners

  // Search Input Listener
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderGallery();
    });
  }

  // Category Toggle (Classes vs. Gear)
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      currentCategory = btn.getAttribute('data-category');

      // Update search placeholder based on selected category
      if (searchInput) {
        if (currentCategory === 'classes') {
          searchInput.placeholder = 'Search skin or class name...';
        } else if (currentCategory === 'gear') {
          searchInput.placeholder = 'Search skin or gear name...';
        }
      }

      renderGallery();
    });
  });

  // Rarity Filter Chips
  rarityChips.forEach(chip => {
    chip.addEventListener('click', () => {
      rarityChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      currentRarity = chip.getAttribute('data-rarity');
      renderGallery();
    });
  });
});