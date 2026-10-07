// ================================
// LOAD MY BLOGS
// ================================

const blogsContainer = document.getElementById("my-blogs-list");

async function loadMyBlogs() {

    try {

    const sessionToken =
    localStorage.getItem("session_token");

if (!sessionToken) {

    blogsContainer.innerHTML = `
        <p class="error-message">
            Please log in to view your blogs.
        </p>
    `;

    return;
}

const response = await fetch(
    `http://127.0.0.1:8000/blogs/my?session_token=${encodeURIComponent(sessionToken)}`
);

        if (!response.ok) {
            throw new Error("Failed to load blogs.");
        }

        const blogs = await response.json();

        displayBlogs(blogs);

    } catch (error) {

        console.error("Error loading blogs:", error);

        blogsContainer.innerHTML = `
            <p class="error-message">
                Unable to load your blogs. Please make sure the backend is running.
            </p>
        `;
    }
}


// ================================
// DISPLAY BLOGS
// ================================

function displayBlogs(blogs) {

    if (blogs.length === 0) {

        blogsContainer.innerHTML = `
            <div class="empty-message">
                <i class="fa-regular fa-pen-to-square"></i>

                <h3>You haven't written any blogs yet.</h3>

                <p>
                    Start writing and share your voice with MindSpeak.
                </p>
            </div>
        `;

        return;
    }


    blogsContainer.innerHTML = blogs.map(blog => {

        // ==========================================
        // COVER IMAGE
        // ==========================================

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

                imagePath =
                    "images/Blogs/" + coverImage;
            }

        } else {

            imagePath =
                "images/Blogs/overthinking.jpg";
        }


        // ==========================================
        // DATE
        // ==========================================

        const dateText =
            blog.created_at
                ? new Date(blog.created_at).toLocaleDateString(
                    "en-US",
                    {
                        month: "long",
                        day: "numeric",
                        year: "numeric"
                    }
                )
                : "";


        // ==========================================
        // BLOG CARD
        // ==========================================

        return `
            <article class="blog-card">

                ${
                    imagePath
                        ? `
                            <div class="blog-card-image">

                                <img
                                    src="${imagePath}"
                                    alt="${escapeHTML(
                                        blog.title ||
                                        "Blog cover"
                                    )}"
                                    onerror="
                                        this.onerror=null;
                                        this.src='images/Blogs/overthinking.jpg';
                                    "
                                >

                            </div>
                        `
                        : ""
                }


                <div class="blog-card-content">

                    <!-- CATEGORY + STATUS -->

                    <div class="blog-card-top">

                        <span class="blog-category">
                            ${escapeHTML(
                                blog.category ||
                                "General"
                            )}
                        </span>

                        <span class="blog-status ${escapeHTML(
                            blog.status || ""
                        )}">
                            ${escapeHTML(
                                blog.status ||
                                "unknown"
                            )}
                        </span>

                    </div>


                    <!-- TITLE -->

                    <h2>
                        ${escapeHTML(
                            blog.title ||
                            "Untitled Blog"
                        )}
                    </h2>


                    <!-- DATE -->

                    ${
                        dateText
                            ? `
                                <p class="blog-date">
                                    ${dateText}
                                </p>
                            `
                            : ""
                    }


                    <!-- BLOG PREVIEW -->

                    ${
                        blog.content
                            ? `
                                <p class="blog-preview">
                                    ${getBlogPreview(
                                        blog.content
                                    )}
                                </p>
                            `
                            : ""
                    }


                    <!-- ACTION BUTTONS -->

                    <div class="blog-card-actions">

                        <a
                            href="blog-details.html?id=${blog.id}&mine=true"
                            class="read-blog-btn"
                        >
                            <i class="fa-solid fa-book-open"></i>
                            Read Full Blog
                        </a>

                        ${
                            blog.status === "rejected"
                                ? `
                                    <button
                                        type="button"
                                        class="edit-resubmit-btn"
                                        onclick="editBlog(${blog.id})"
                                    >
                                        <i class="fa-solid fa-pen"></i>
                                        Edit & Resubmit
                                    </button>
                                `
                                : ""
                        }

                    </div>


                    <!-- REJECTION MESSAGE -->

                    ${
                        blog.rejection_reason
                            ? `
                                <div class="rejection-box">

                                    <strong>
                                        Reason for rejection:
                                    </strong>

                                    <p>
                                        ${escapeHTML(
                                            blog.rejection_reason
                                        )}
                                    </p>

                                </div>
                            `
                            : ""
                    }

                </div>

            </article>
        `;

    }).join("");
}


// ================================
// BLOG PREVIEW
// ================================

function getBlogPreview(content) {

    if (!content) {
        return "";
    }

    // Remove HTML tags
    const text =
        String(content)
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim();

    if (text.length <= 180) {
        return escapeHTML(text);
    }

    return escapeHTML(
        text.substring(0, 180) + "..."
    );
}


// ================================
// HTML ESCAPE
// ================================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text ?? "";

    return div.innerHTML;
}


// ================================
// INITIAL LOAD
// ================================

loadMyBlogs();


// ================================
// BLOG STATUS FILTER
// ================================

const filterButtons =
    document.querySelectorAll(".filter-btn");


filterButtons.forEach(button => {

    button.addEventListener(
        "click",
        function () {

            // Remove active class
            filterButtons.forEach(btn => {
                btn.classList.remove("active");
            });


            // Add active class
            this.classList.add("active");


            const selectedStatus =
                this.dataset.status;


            const blogCards =
                document.querySelectorAll(".blog-card");


            blogCards.forEach(card => {

                const statusElement =
                    card.querySelector(".blog-status");


                if (!statusElement) {
                    return;
                }


                const blogStatus =
                    statusElement.textContent
                        .trim()
                        .toLowerCase();


                if (
                    selectedStatus === "all" ||
                    blogStatus === selectedStatus
                ) {

                    card.style.display = "block";

                } else {

                    card.style.display = "none";

                }

            });

        }
    );

});


// ================================
// EDIT REJECTED BLOG
// ================================

function editBlog(blogId) {

    window.location.href =
        `edit-blog.html?id=${blogId}`;

}