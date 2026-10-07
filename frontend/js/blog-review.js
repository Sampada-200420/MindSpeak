
const API_URL = "http://127.0.0.1:8000";

const pendingBlogsContainer = document.getElementById("pending-blogs");
const pendingCount = document.getElementById("pending-count");
const approvedCount = document.getElementById("approved-count");
const rejectedCount = document.getElementById("rejected-count");
const refreshButton = document.getElementById("refresh-blogs");

async function loadPendingBlogs() {
pendingBlogsContainer.innerHTML =
'<div class="loading-message">' +
'<i class="fa-solid fa-spinner fa-spin"></i>' +
' Loading submissions...' +
'</div>';

try {
    const response = await fetch(API_URL + "/blogs/pending");

    if (!response.ok) {
        throw new Error("Failed to load pending blogs.");
    }

    const blogs = await response.json();

    pendingCount.textContent = blogs.length;

    if (blogs.length === 0) {
        pendingBlogsContainer.innerHTML =
            '<div class="empty-message">' +
            '<i class="fa-regular fa-circle-check"></i>' +
            '<p>No blogs are waiting for review.</p>' +
            '</div>';

        return;
    }

    pendingBlogsContainer.innerHTML = "";

    blogs.forEach(function (blog) {
        const card = document.createElement("article");
        card.className = "blog-review-card";

        const date = blog.created_at
            ? new Date(blog.created_at).toLocaleDateString()
            : "Date unavailable";

        card.innerHTML =
            '<div class="blog-card-top">' +
                '<span class="blog-category">' +
                    escapeHTML(blog.category || "Uncategorized") +
                '</span>' +

                '<span class="blog-date">' +
                    date +
                '</span>' +
            '</div>' +

            '<h3>' +
                escapeHTML(blog.title || "Untitled Blog") +
            '</h3>' +

            '<p class="blog-author">' +
                '<i class="fa-solid fa-user"></i>' +
                ' Author ID: ' +
                escapeHTML(String(blog.author_id || "Unknown")) +
            '</p>' +

            '<div class="blog-content">' +
                '<p>' +
                    escapeHTML(blog.content || "No content available.") +
                '</p>' +
            '</div>' +

            '<div class="review-actions">' +

                '<button type="button" class="review-btn reject-btn" onclick="showRejectForm(' +
                    blog.id +
                ')">' +
                    '<i class="fa-solid fa-xmark"></i>' +
                    ' Reject' +
                '</button>' +

                '<button type="button" class="review-btn approve-btn" onclick="approveBlog(' +
                    blog.id +
                ')">' +
                    '<i class="fa-solid fa-check"></i>' +
                    ' Approve & Publish' +
                '</button>' +

            '</div>' +

            '<div class="reject-form" id="reject-form-' +
                blog.id +
            '">' +

                '<label for="reject-reason-' +
                    blog.id +
                '">' +
                    'Feedback for the writer' +
                '</label>' +

                '<textarea id="reject-reason-' +
                    blog.id +
                    '" placeholder="Explain what the writer should improve before resubmitting..."></textarea>' +

                '<div class="reject-form-actions">' +

                    '<button type="button" class="cancel-reject-btn" onclick="hideRejectForm(' +
                        blog.id +
                    ')">' +
                        'Cancel' +
                    '</button>' +

                    '<button type="button" class="confirm-reject-btn" onclick="rejectBlog(' +
                        blog.id +
                    ')">' +
                        'Reject Blog' +
                    '</button>' +

                '</div>' +

            '</div>';

        pendingBlogsContainer.appendChild(card);
    });

} catch (error) {
    console.error(error);

    pendingBlogsContainer.innerHTML =
        '<div class="error-message">' +
            '<i class="fa-solid fa-triangle-exclamation"></i>' +
            '<p>Unable to load blog submissions.</p>' +
        '</div>';
}

}

async function approveBlog(blogId) {
const confirmed = confirm(
"Are you sure you want to approve this blog and publish it?"
);

if (!confirmed) {
    return;
}

try {
    const response = await fetch(
        API_URL + "/blogs/" + blogId + "/approve",
        {
            method: "PUT"
        }
    );

    if (!response.ok) {
        throw new Error("Failed to approve blog.");
    }

    alert("Blog approved and published successfully.");

    await loadPendingBlogs();

} catch (error) {
    console.error(error);
    alert("Something went wrong while approving the blog.");
}

}

function showRejectForm(blogId) {
const form = document.getElementById("reject-form-" + blogId);

if (form) {
    form.classList.add("active");
}

}

function hideRejectForm(blogId) {
const form = document.getElementById("reject-form-" + blogId);

if (form) {
    form.classList.remove("active");
}

}

async function rejectBlog(blogId) {
const reasonInput = document.getElementById("reject-reason-" + blogId);

if (!reasonInput) {
    return;
}

const reason = reasonInput.value.trim();

if (!reason) {
    alert("Please provide feedback before rejecting the blog.");
    return;
}

try {
    const response = await fetch(
        API_URL + "/blogs/" + blogId + "/reject",
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                reason: reason
            })
        }
    );

    if (!response.ok) {
        throw new Error("Failed to reject blog.");
    }

    alert("Blog rejected and feedback has been sent to the writer.");

    await loadPendingBlogs();

} catch (error) {
    console.error(error);
    alert("Something went wrong while rejecting the blog.");
}

}

function escapeHTML(value) {
const div = document.createElement("div");
div.textContent = value;
return div.innerHTML;
}

if (refreshButton) {
refreshButton.addEventListener("click", loadPendingBlogs);
}

loadPendingBlogs();