const API_URL = "http://127.0.0.1:8000";


// ============================================================
// LOAD BLOG DETAILS
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
    loadBlogDetails();
});


// ============================================================
// BUTTON EVENTS
// ============================================================

document.addEventListener("click", function (event) {

    if (event.target.closest("#save-blog-btn")) {
        saveBlog();
    }

    if (event.target.closest("#like-blog-btn")) {
        likeBlog();
    }

});


// ============================================================
// LOAD BLOG
// ============================================================

async function loadBlogDetails() {

    const blogContent =
        document.getElementById("blog-content");

    if (!blogContent) {
        return;
    }


    // ========================================================
    // GET URL PARAMETERS
    // ========================================================

    const params =
        new URLSearchParams(window.location.search);

    const blogId =
        params.get("id");

    const isMyBlog =
        params.get("mine") === "true";


    if (!blogId) {

        blogContent.innerHTML = `
            <div class="empty-message">
                <p>Article not found.</p>
            </div>
        `;

        return;
    }


    try {

        // ====================================================
        // GET CURRENT USER
        // ====================================================

        const userId =
            localStorage.getItem("user_id");


        let response;


        // ====================================================
        // LOAD OWN BLOG
        // ====================================================

        /*
         * When opened from My Blogs:
         *
         * blog-details.html?id=5&mine=true
         *
         * use:
         *
         * /blogs/my/{author_id}/{blog_id}
         *
         * This allows the author to read their own
         * draft, pending, rejected or published blog.
         */

        if (isMyBlog && userId) {

            response =
                await fetch(
                    API_URL +
                    "/blogs/my/" +
                    userId +
                    "/" +
                    blogId
                );

        } else {

            // ================================================
            // LOAD PUBLIC BLOG
            // ================================================

            response =
                await fetch(
                    API_URL +
                    "/blogs/" +
                    blogId
                );
        }


        if (!response.ok) {

            if (response.status === 404) {

                throw new Error(
                    "This article could not be found."
                );
            }

            throw new Error(
                "Failed to load article."
            );
        }


        const blog =
            await response.json();


        if (!blog || blog.error) {

            throw new Error(
                blog?.error ||
                "Invalid blog data received."
            );
        }


        // ====================================================
        // IMAGE
        // ====================================================

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


        /*
         * FIRST PRIORITY:
         * Use the image uploaded specifically
         * for this blog.
         */

        if (blog.cover_image) {

            const coverImage =
                String(blog.cover_image).trim();


            if (
                coverImage.startsWith("http://") ||
                coverImage.startsWith("https://") ||
                coverImage.startsWith("images/") ||
                coverImage.startsWith("/")
            ) {

                imagePath =
                    coverImage;

            } else {

                imagePath =
                    "images/Blogs/" +
                    coverImage;
            }

        } else {

            /*
             * If no custom cover image exists,
             * use the category fallback image.
             */

            imagePath =
                categoryImages[blog.category] ||
                "images/Blogs/overthinking.jpg";
        }


        // ====================================================
        // DATE
        // ====================================================

        let dateText = "";


        if (blog.created_at) {

            const date =
                new Date(blog.created_at);


            if (!Number.isNaN(date.getTime())) {

                dateText =
                    date.toLocaleDateString(
                        "en-US",
                        {
                            month: "long",
                            day: "numeric",
                            year: "numeric"
                        }
                    );
            }
        }


        // ====================================================
        // STATUS
        // ====================================================

        const blogStatus =
            String(
                blog.status || "published"
            ).toLowerCase();


        const isPublished =
            blogStatus === "published";


        // ====================================================
        // STATUS MESSAGE FOR OWN BLOG
        // ====================================================

        let statusMessage = "";


        if (isMyBlog && !isPublished) {

            let statusText =
                blogStatus.charAt(0).toUpperCase() +
                blogStatus.slice(1);


            let statusDescription = "";


            if (blogStatus === "draft") {

                statusDescription =
                    "This blog is saved as a draft and has not been submitted yet.";

            } else if (blogStatus === "pending") {

                statusDescription =
                    "This blog has been submitted and is waiting for review.";

            } else if (blogStatus === "rejected") {

                statusDescription =
                    "This blog was rejected. You can edit it and resubmit it.";

            }


            statusMessage = `
                <div class="blog-status-message ${blogStatus}">

                    <strong>
                        Status: ${escapeHTML(statusText)}
                    </strong>

                    ${
                        statusDescription
                            ? `
                                <p>
                                    ${escapeHTML(
                                        statusDescription
                                    )}
                                </p>
                            `
                            : ""
                    }

                    ${
                        blog.rejection_reason
                            ? `
                                <div class="rejection-detail">

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
            `;
        }


        // ====================================================
        // ACTION BUTTONS
        // ====================================================

        let actionButtons = "";


        /*
         * Like and Save are only available for
         * published blogs.
         */

        if (isPublished) {

            actionButtons = `

                <div class="blog-actions">

                    <button
                        class="like-blog-btn"
                        id="like-blog-btn"
                        data-blog-id="${blog.id}"
                        data-liked="false"
                    >

                        <i class="fa-regular fa-heart"></i>

                        <span>
                            Like
                        </span>

                    </button>


                    <button
                        class="save-blog-btn"
                        id="save-blog-btn"
                        data-blog-id="${blog.id}"
                        data-saved="false"
                    >

                        <i class="fa-regular fa-bookmark"></i>

                        Save Blog

                    </button>

                </div>

            `;
        }


        // ====================================================
        // DISPLAY ARTICLE
        // ====================================================

        blogContent.innerHTML = `

            <article class="blog-detail-card">


                <!-- COVER IMAGE -->

                <div class="blog-detail-image">

                    <img
                        src="${imagePath}"
                        alt="${escapeHTML(
                            blog.title ||
                            "MindSpeak article"
                        )}"
                        onerror="
                            this.onerror=null;
                            this.src='images/Blogs/overthinking.jpg';
                        "
                    >

                </div>


                <!-- CATEGORY -->

                <span class="blog-category">

                    ${escapeHTML(
                        blog.category ||
                        "MindSpeak"
                    )}

                </span>


                <!-- TITLE -->

                <h1>

                    ${escapeHTML(
                        blog.title ||
                        "Untitled Article"
                    )}

                </h1>


                <!-- AUTHOR + DATE -->

                <p class="blog-author">

                    By
                    ${escapeHTML(
                        blog.author ||
                        "MindSpeak"
                    )}

                    ${
                        dateText
                            ? ` • ${dateText}`
                            : ""
                    }

                </p>


                <!-- STATUS -->

                ${statusMessage}


                <!-- ACTION BUTTONS -->

                ${actionButtons}


                <!-- FULL BLOG CONTENT -->

                <div class="blog-body">

                    ${blog.content || ""}

                </div>


            </article>

        `;


        // ====================================================
        // CHECK LIKE / SAVE
        // ====================================================

        if (isPublished) {

            checkIfSaved();

            checkIfLiked();
        }


    } catch (error) {

        console.error(
            "Error loading blog:",
            error
        );


        blogContent.innerHTML = `

            <div class="empty-message">

                <p>
                    ${
                        error.message ||
                        "Unable to load this article."
                    }
                </p>

            </div>

        `;
    }
}


// ============================================================
// CHECK SAVED
// ============================================================

async function checkIfSaved() {

    const userId =
        localStorage.getItem("user_id");


    const params =
        new URLSearchParams(
            window.location.search
        );


    const blogId =
        params.get("id");


    if (!userId || !blogId) {
        return;
    }


    try {

        const response =
            await fetch(
                API_URL +
                "/blogs/saved/" +
                userId
            );


        if (!response.ok) {
            return;
        }


        const savedBlogs =
            await response.json();


        const isSaved =
            savedBlogs.some(function (blog) {

                return Number(blog.id) ===
                    Number(blogId);

            });


        const button =
            document.getElementById(
                "save-blog-btn"
            );


        if (button && isSaved) {

            button.innerHTML = `
                <i class="fa-solid fa-bookmark"></i>
                Saved
            `;

            button.classList.add("saved");

            button.setAttribute(
                "data-saved",
                "true"
            );
        }


    } catch (error) {

        console.error(
            "Error checking saved blog:",
            error
        );
    }
}


// ============================================================
// SAVE BLOG
// ============================================================

async function saveBlog() {

    const userId =
        localStorage.getItem("user_id");


    const button =
        document.getElementById(
            "save-blog-btn"
        );


    if (!userId) {

        alert(
            "Please log in to save this blog."
        );

        return;
    }


    if (!button) {
        return;
    }


    const blogId =
        button.getAttribute(
            "data-blog-id"
        );


    const isSaved =
        button.getAttribute(
            "data-saved"
        ) === "true";


    try {

        const response =
            await fetch(
                API_URL +
                "/blogs/" +
                blogId +
                "/save",
                {
                    method:
                        isSaved
                            ? "DELETE"
                            : "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            user_id:
                                Number(userId)
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Failed to update saved blog"
            );
        }


        if (isSaved) {

            button.innerHTML = `
                <i class="fa-regular fa-bookmark"></i>
                Save Blog
            `;

            button.classList.remove("saved");

            button.setAttribute(
                "data-saved",
                "false"
            );


        } else {

            button.innerHTML = `
                <i class="fa-solid fa-bookmark"></i>
                Saved
            `;

            button.classList.add("saved");

            button.setAttribute(
                "data-saved",
                "true"
            );
        }


    } catch (error) {

        console.error(
            "Error updating saved blog:",
            error
        );

        alert(
            "Unable to update saved blog."
        );
    }
}


// ============================================================
// CHECK LIKED
// ============================================================

async function checkIfLiked() {

    const userId =
        localStorage.getItem("user_id");


    const params =
        new URLSearchParams(
            window.location.search
        );


    const blogId =
        params.get("id");


    if (!userId || !blogId) {
        return;
    }


    try {

        const response =
            await fetch(
                API_URL +
                "/blogs/" +
                blogId +
                "/liked/" +
                userId
            );


        if (!response.ok) {
            return;
        }


        const data =
            await response.json();


        const button =
            document.getElementById(
                "like-blog-btn"
            );


        if (!button) {
            return;
        }


        if (data.liked) {

            button.innerHTML = `
                <i class="fa-solid fa-heart"></i>
                <span>Liked</span>
            `;

            button.classList.add("liked");

            button.setAttribute(
                "data-liked",
                "true"
            );


        } else {

            button.innerHTML = `
                <i class="fa-regular fa-heart"></i>
                <span>Like</span>
            `;

            button.classList.remove("liked");

            button.setAttribute(
                "data-liked",
                "false"
            );
        }


    } catch (error) {

        console.error(
            "Error checking liked blog:",
            error
        );
    }
}


// ============================================================
// LIKE BLOG
// ============================================================

async function likeBlog() {

    const button =
        document.getElementById(
            "like-blog-btn"
        );


    if (!button) {
        return;
    }


    const userId =
        localStorage.getItem("user_id");


    if (!userId) {

        alert(
            "Please log in to like this blog."
        );

        return;
    }


    const blogId =
        button.getAttribute(
            "data-blog-id"
        );


    const isLiked =
        button.getAttribute(
            "data-liked"
        ) === "true";


    try {

        const response =
            await fetch(
                API_URL +
                "/blogs/" +
                blogId +
                "/like",
                {
                    method:
                        isLiked
                            ? "DELETE"
                            : "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            user_id:
                                Number(userId)
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Failed to update like"
            );
        }


        if (isLiked) {

            button.innerHTML = `
                <i class="fa-regular fa-heart"></i>
                <span>Like</span>
            `;

            button.classList.remove("liked");

            button.setAttribute(
                "data-liked",
                "false"
            );


        } else {

            button.innerHTML = `
                <i class="fa-solid fa-heart"></i>
                <span>Liked</span>
            `;

            button.classList.add("liked");

            button.setAttribute(
                "data-liked",
                "true"
            );
        }


    } catch (error) {

        console.error(
            "Error updating like:",
            error
        );

        alert(
            "Unable to update like."
        );
    }
}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text ?? "";

    return div.innerHTML;
}