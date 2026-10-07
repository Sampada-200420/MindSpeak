const API_URL = "http://127.0.0.1:8000";

let allBlogs = [];
let selectedCategory = "All";

document.addEventListener("DOMContentLoaded", function () {
    loadBlogs();
    setupSearch();
    setupCategories();
    setupNewsletter();
});

async function loadBlogs() {
try {
const response = await fetch(API_URL + "/blogs/");

    if (!response.ok) {
        throw new Error("Failed to load blogs");
    }

    allBlogs = await response.json();

    displayBlogs(allBlogs);

} catch (error) {
    console.error("Error loading blogs:", error);
    showEmptyMessage("Unable to load articles right now.");
}

}

function displayBlogs(blogs) {

const featuredContainer = document.getElementById("featured-blogs");
const latestContainer = document.getElementById("latest-blogs");
const popularContainer = document.getElementById("popular-blogs");

if (!featuredContainer || !latestContainer || !popularContainer) {
    return;
}

if (blogs.length === 0) {
    showEmptyMessage("No articles found.");
    return;
}
const featuredBlogs = [...blogs].sort((a, b) => {
if (a.title === "Managing Overthinking") return -1;
if (b.title === "Managing Overthinking") return 1;
return 0;
}).slice(0, 3);

featuredContainer.innerHTML = "";

featuredBlogs.forEach(function (blog) {
    featuredContainer.innerHTML += createBlogCard(blog);
});

const latestBlogs = blogs.slice(0, 6);

latestContainer.innerHTML = "";

latestBlogs.forEach(function (blog) {
    latestContainer.innerHTML += createBlogCard(blog);
});

const popularBlogs = getPopularBlogs(blogs);

popularContainer.innerHTML = "";

if (popularBlogs.length > 0) {

    popularBlogs.forEach(function (blog) {
        popularContainer.innerHTML += createBlogCard(blog);
    });

} else {

    popularContainer.innerHTML =
        '<div class="empty-message">' +
        '<p>Popular articles will appear here as the community engages with them.</p>' +
        '</div>';
}

}

function createBlogCard(blog) {

const categoryImages = {

    "Mental Health":
        "images/Blogs/overthinking.jpg",

    "Self Growth":
        "images/Blogs/selfgrowth.jpg",

    "Relationships":
        "images/Blogs/relationships.jpg",

    "Student Life":
        "images/Blogs/student.jpg",

    "Wellbeing":
        "images/Blogs/wellbeing.jpg",

    "Personal Stories":
        "images/Blogs/story.jpg"
};


let imagePath = "";

if (blog.cover_image) {

    const coverImage =
        String(blog.cover_image).trim();

    if (
        coverImage.startsWith("http://") ||
        coverImage.startsWith("https://") ||
        coverImage.startsWith("images/") ||
        coverImage.startsWith("/")
    ) {
        imagePath = coverImage;
    } else {
        imagePath = "images/Blogs/" + coverImage;
    }

} else {

    imagePath =
        categoryImages[blog.category] ||
        "images/Blogs/overthinking.jpg";
}

const description =
    stripHTML(blog.content || "").slice(0, 150);

return '<article class="blog-card">' +
    '<div class="blog-card-image">' +
        '<img src="' + imagePath + '" alt="' +
        escapeHTML(blog.title || "MindSpeak article") +
        '" loading="lazy">' +
    '</div>' +

    '<div class="blog-card-content">' +

        '<span class="blog-category">' +
            escapeHTML(blog.category || "MindSpeak") +
        '</span>' +

        '<h3>' +
            escapeHTML(blog.title || "Untitled Article") +
        '</h3>' +

        '<p>' +
            escapeHTML(description) +
            '...</p>' +

        '<div class="blog-card-footer">' +

            '<span>By ' +
                escapeHTML(blog.author || "MindSpeak") +
            '</span>' +

            '<a href="blog-details.html?id=' +
                blog.id +
                '">Read More</a>' +

        '</div>' +

    '</div>' +

'</article>';

}


function getPopularBlogs(blogs) {

    if (!blogs || blogs.length === 0) {
        return [];
    }

    const blogsWithScores = blogs.map(function (blog) {

        const views = Number(blog.views || 0);
        const likes = Number(blog.likes || 0);
        const saves = Number(blog.saves || 0);
        const shares = Number(blog.shares || 0);

        const score =
            views +
            (likes * 2) +
            (saves * 3) +
            (shares * 4);

        return {
            ...blog,
            popularityScore: score
        };
    });

    return blogsWithScores
        .sort(function (a, b) {
            return b.popularityScore - a.popularityScore;
        })
        .slice(0, 3);
}
function setupCategories() {

const categoryButtons =
    document.querySelectorAll(".category-btn");

categoryButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        categoryButtons.forEach(function (btn) {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        selectedCategory =
            button.getAttribute("data-category") || "All";

        applyFilters();
    });
});

}

function setupSearch() {
    const searchInput = document.getElementById("blog-search");

    if (!searchInput) {
        return;
    }

    searchInput.addEventListener("input", function () {
        applyFilters();
    });
}

function applyFilters() {

const searchInput =
    document.getElementById("blog-search");

const searchTerm =
    searchInput ?
    searchInput.value.toLowerCase().trim() :
    "";

const filteredBlogs = allBlogs.filter(function (blog) {

    const matchesCategory =
        selectedCategory === "All" ||
        blog.category === selectedCategory;

    const title =
        (blog.title || "").toLowerCase();

    const content =
        stripHTML(blog.content || "").toLowerCase();

    const category =
        (blog.category || "").toLowerCase();

    const author =
        (blog.author || "").toLowerCase();

    const matchesSearch =
        searchTerm === "" ||
        title.includes(searchTerm) ||
        content.includes(searchTerm) ||
        category.includes(searchTerm) ||
        author.includes(searchTerm);

    return matchesCategory && matchesSearch;
});

displayBlogs(filteredBlogs);

}

function showEmptyMessage(message) {

const containers = [
    document.getElementById("featured-blogs"),
    document.getElementById("latest-blogs"),
    document.getElementById("popular-blogs")
];

containers.forEach(function (container) {

    if (container) {

        container.innerHTML =
            '<div class="empty-message">' +
            '<p>' +
            escapeHTML(message) +
            '</p>' +
            '</div>';
    }
});

}

function stripHTML(text) {

const tempElement =
    document.createElement("div");

tempElement.innerHTML = text;

return tempElement.textContent ||
    tempElement.innerText ||
    "";

}

function escapeHTML(text) {

const div =
    document.createElement("div");

div.textContent = text;

return div.innerHTML;

}

function setupNewsletter() {

const newsletterForm =
    document.getElementById("newsletter-form");

const newsletterEmail =
    document.getElementById("newsletter-email");

const newsletterMessage =
    document.getElementById("newsletter-message");

if (!newsletterForm) {
    return;
}

newsletterForm.addEventListener("submit", function (event) {

    event.preventDefault();

    if (!newsletterEmail || !newsletterMessage) {
        return;
    }

    const email =
        newsletterEmail.value.trim();

    if (email === "") {

        newsletterMessage.textContent =
            "Please enter your email address.";

        return;
    }

    newsletterMessage.textContent =
        "Thank you for subscribing to MindSpeak!";

    newsletterEmail.value = "";
});

}