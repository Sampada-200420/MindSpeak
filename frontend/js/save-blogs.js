
const API_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", function () {
    loadSavedBlogs();
});

async function loadSavedBlogs() {
    const container = document.getElementById("saved-blogs");
    const userId = localStorage.getItem("user_id");

    if (!userId) {
        container.innerHTML = `
            <div class="empty-message">
                <p>Please log in to view your saved blogs.</p>
            </div>
        `;
        return;
    }

    try {
        const response = await fetch(
            API_URL + "/blogs/saved/" + userId
        );

        if (!response.ok) {
            throw new Error("Failed to load saved blogs");
        }

        const savedBlogs = await response.json();

        if (savedBlogs.length === 0) {
            container.innerHTML = `
                <div class="empty-message">
                    <p>You haven't saved any blogs yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = "";

        savedBlogs.forEach(function (blog) {
            container.innerHTML += createSavedBlogCard(blog);
        });

    } catch (error) {
        console.error("Error loading saved blogs:", error);

        container.innerHTML = `
            <div class="empty-message">
                <p>Unable to load your saved blogs.</p>
            </div>
        `;
    }
}

function createSavedBlogCard(blog) {
    const description =
        stripHTML(blog.content || "").slice(0, 150);

    return `
        <article class="blog-card">

            <div class="blog-card-image">
                <img
                    src="${escapeHTML(blog.cover_image || "")}"
                    alt="${escapeHTML(blog.title || "MindSpeak article")}"
                    loading="lazy"
                >
            </div>

            <div class="blog-card-content">

                <span class="blog-category">
                    ${escapeHTML(blog.category || "MindSpeak")}
                </span>

                <h3>
                    ${escapeHTML(blog.title || "Untitled Article")}
                </h3>

                <p>
                    ${escapeHTML(description)}...
                </p>

                <div class="blog-card-footer">
                    <span>
                        By ${escapeHTML(blog.author || "MindSpeak")}
                    </span>

                    <a href="blog-details.html?id=${blog.id}">
                        Read More
                    </a>
                </div>

            </div>

        </article>
    `;
}

function stripHTML(text) {
    const tempElement = document.createElement("div");
    tempElement.innerHTML = text;
    return tempElement.textContent ||
           tempElement.innerText ||
           "";
}

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}