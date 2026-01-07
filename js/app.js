// ===============================
// OpenPlayground - Main JavaScript
// ===============================

// ===============================
// THEME TOGGLE
// ===============================
const toggleBtn = document.getElementById("toggle-mode-btn");
const themeIcon = document.getElementById("theme-icon");
const html = document.documentElement;

const savedTheme = localStorage.getItem("theme") || "light";
html.setAttribute("data-theme", savedTheme);
updateThemeIcon(savedTheme);

function updateThemeIcon(theme) {
    if (theme === "dark") {
        themeIcon.className = "ri-moon-fill";
    } else {
        themeIcon.className = "ri-sun-line";
    }
}

toggleBtn?.addEventListener("click", () => {
    const newTheme = html.getAttribute("data-theme") === "light" ? "dark" : "light";
    html.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon(newTheme);
    toggleBtn.classList.add("shake");
    setTimeout(() => toggleBtn.classList.remove("shake"), 500);
});

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("project-search");
    const projectsPlaceholder = document.getElementById("projects-placeholder");
    const emptyState = document.getElementById("empty-state");

    // Function to filter projects
    function filterProjects() {
        // Get current cards (in case they are dynamically loaded)
        const cards = projectsPlaceholder.querySelectorAll(".card");
        const query = searchInput.value.toLowerCase().trim();
        let visibleCount = 0;

        cards.forEach(card => {
            const title = card.querySelector(".card-heading")?.textContent.toLowerCase() || "";
            const description = card.querySelector(".card-description")?.textContent.toLowerCase() || "";
            const category = card.dataset.category?.toLowerCase() || "";

            if (title.includes(query) || description.includes(query) || category.includes(query)) {
                card.style.display = ""; // Keep default CSS layout
                visibleCount++;
            } else {
                card.style.display = "none";
            }
        });

        emptyState.style.display = visibleCount === 0 ? "flex" : "none";
    }

    // Listen for input on search box
    searchInput.addEventListener("input", filterProjects);

    // Optional: if projects are loaded asynchronously, observe changes
    const observer = new MutationObserver(() => {
        filterProjects(); // Re-apply filter whenever new cards are added
    });

    observer.observe(projectsPlaceholder, { childList: true, subtree: true });
});


// ===============================
// SCROLL TO TOP
// ===============================
const scrollBtn = document.getElementById("scrollToTopBtn");
window.addEventListener("scroll", () => {
    scrollBtn.classList.toggle("show", window.scrollY > 300);
});
scrollBtn?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
});

// ===============================
// MOBILE NAVBAR
// ===============================
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

if(navToggle && navLinks){
    navToggle.addEventListener("click", () => {
        navLinks.classList.toggle("active");
        const icon = navToggle.querySelector("i");
        icon.className = navLinks.classList.contains("active") ? "ri-close-line" : "ri-menu-3-line";
    });
    navLinks.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("active");
            navToggle.querySelector("i").className = "ri-menu-3-line";
        });
    });
}

// ===============================
// PROJECTS SEARCH, FILTER, SORT, PAGINATION
// ===============================
const searchInput = document.getElementById("project-search");
const sortSelect = document.getElementById("project-sort");
const filterBtns = document.querySelectorAll(".filter-btn");
const projectsContainer = document.querySelector(".projects-container");
const paginationContainer = document.getElementById("pagination-controls");
const emptyState = document.getElementById("empty-state");

let allProjectsData = [];
let currentPage = 1;
const itemsPerPage = 9;
let currentCategory = "all";
let currentSort = "default";

// Fetch projects JSON
async function fetchProjects() {
    try {
        const res = await fetch("./projects.json");
        allProjectsData = await res.json();
        renderProjects();
    } catch(err) {
        console.error("Failed to load projects:", err);
        projectsContainer.innerHTML = `<p>Unable to load projects.</p>`;
    }
}

// Render projects based on search/filter/sort/pagination
function renderProjects() {
    if(!projectsContainer) return;

    const searchText = searchInput.value.toLowerCase();
    let filtered = allProjectsData.filter(p => 
        p.title.toLowerCase().includes(searchText) || 
        p.description.toLowerCase().includes(searchText)
    );

    if(currentCategory !== "all") filtered = filtered.filter(p => p.category === currentCategory);

    switch(currentSort){
        case "az": filtered.sort((a,b)=>a.title.localeCompare(b.title)); break;
        case "za": filtered.sort((a,b)=>b.title.localeCompare(a.title)); break;
        case "newest": filtered.reverse(); break;
    }

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const start = (currentPage-1)*itemsPerPage;
    const paginated = filtered.slice(start, start+itemsPerPage);

    // Empty state
    if(paginated.length===0){
        emptyState.style.display = "block";
        projectsContainer.innerHTML = "";
        paginationContainer.innerHTML = "";
        return;
    } else {
        emptyState.style.display = "none";
    }

    // Render project cards
    projectsContainer.innerHTML = "";
    paginated.forEach(project=>{
        const card = document.createElement("a");
        card.href = project.link;
        card.className = "card";
        card.setAttribute("data-category", project.category);
        card.innerHTML = `
            <div class="card-cover" style="${project.coverStyle || ''}"><i class="${project.icon}"></i></div>
            <div class="card-content">
                <div class="card-header-flex">
                    <h3 class="card-heading">${project.title}</h3>
                    <span class="category-tag">${capitalize(project.category)}</span>
                </div>
                <p class="card-description">${project.description}</p>
                <div class="card-tech">${project.tech.map(t=>`<span>${t}</span>`).join('')}</div>
            </div>
        `;
        projectsContainer.appendChild(card);
    });

    renderPagination(totalPages);
}

// Pagination
function renderPagination(totalPages){
    paginationContainer.innerHTML = "";
    if(totalPages <= 1) return;

    for(let i=1;i<=totalPages;i++){
        const btn = document.createElement("button");
        btn.textContent = i;
        btn.classList.toggle("active", i===currentPage);
        btn.addEventListener("click", () => {
            currentPage=i;
            renderProjects();
            window.scrollTo({top: document.getElementById("projects").offsetTop-80, behavior:"smooth"});
        });
        paginationContainer.appendChild(btn);
    }
}

function capitalize(str){ return str.charAt(0).toUpperCase() + str.slice(1); }

// Event listeners
searchInput?.addEventListener("input", ()=>{ currentPage=1; renderProjects(); });
sortSelect?.addEventListener("change", ()=>{ currentSort=sortSelect.value; currentPage=1; renderProjects(); });
filterBtns.forEach(btn=>btn.addEventListener("click", ()=>{
    filterBtns.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    currentCategory=btn.dataset.filter;
    currentPage=1;
    renderProjects();
}));

// ===============================
// FETCH CONTRIBUTORS
// ===============================
const contributorsGrid = document.getElementById("contributors-grid");
async function fetchContributors(){
    if(!contributorsGrid) return;
    try {
        const res = await fetch("https://api.github.com/repos/YadavAkhileshh/OpenPlayground/contributors");
        const contributors = await res.json();
        contributorsGrid.innerHTML = "";
        contributors.forEach((c,i)=>{
            const card = document.createElement("a");
            card.href = c.html_url;
            card.target = "_blank";
            card.className = "contributor-card";
            card.innerHTML = `
                <img src="${c.avatar_url}" alt="${c.login}" class="contributor-avatar" loading="lazy">
                <span class="contributor-name">${c.login}</span>
            `;
            contributorsGrid.appendChild(card);
        });
    } catch(err){
        console.error("Failed to fetch contributors:", err);
        contributorsGrid.innerHTML = `<p>Unable to load contributors.</p>`;
    }
}

// ===============================
// SMOOTH SCROLL ANCHORS
// ===============================
document.querySelectorAll('a[href^="#"]').forEach(anchor=>{
    anchor.addEventListener("click", function(e){
        const targetId = this.getAttribute("href");
        if(targetId==="#") return;
        const target = document.querySelector(targetId);
        if(target){
            e.preventDefault();
            target.scrollIntoView({behavior:"smooth", block:"start"});
        }
    });
});

// ===============================
// NAVBAR SCROLL SHADOW
// ===============================
const navbar = document.getElementById('navbar');
window.addEventListener("scroll", ()=>{
    navbar?.classList.toggle("scrolled", window.scrollY > 50);
});

// ===============================
// INITIALIZATION
// ===============================
fetchProjects();
fetchContributors();
console.log("%c🚀 Contribute at https://github.com/YadavAkhileshh/OpenPlayground", "color:#6366f1;font-size:14px;font-weight:bold;");
