
const API_URL = "http://127.0.0.1:8000";
const AUTHOR_ID = 4;

const blogId = new URLSearchParams(window.location.search).get("id");

const titleInput = document.getElementById("blog-title");
const categoryInput = document.getElementById("blog-category");
const contentInput = document.getElementById("blog-content");
const wordCount = document.getElementById("word-count");
const charCount = document.getElementById("char-count");
const cancelButton = document.getElementById("cancel-edit");
const resubmitButton = document.getElementById("resubmit-blog");

async function loadBlog() {
if (!blogId) {
alert("Blog ID is missing.");
return;
}

try {
    const response = await fetch(`${API_URL}/blogs/my/${AUTHOR_ID}`);

    if (!response.ok) {
        throw new Error("Could not load blogs.");
    }

    const blogs = await response.json();

    const blog = blogs.find(function(item) {
        return String(item.id) === String(blogId);
    });

    if (!blog) {
        alert("Blog not found.");
        return;
    }

    titleInput.value = blog.title;
    categoryInput.value = blog.category;
    contentInput.value = blog.content;

    updateCounter();

} catch (error) {
    console.error(error);
    alert("Could not load the blog.");
}

}

function updateCounter() {
const text = contentInput.value;

const characters = text.length;

const words = text.trim() === ""
    ? 0
    : text.trim().split(/\s+/).length;

wordCount.textContent = `${words} words`;
charCount.textContent = `${characters} characters`;

}

contentInput.addEventListener("input", updateCounter);

cancelButton.addEventListener("click", function() {
window.location.href = "my-blogs.html";
});

resubmitButton.addEventListener("click", async function() {
const title = titleInput.value.trim();
const category = categoryInput.value;
const content = contentInput.value.trim();

if (!title) {
    alert("Please enter a blog title.");
    return;
}

if (!category) {
    alert("Please select a category.");
    return;
}

if (!content) {
    alert("Please enter your blog content.");
    return;
}

const confirmed = confirm(
    "Are you sure you want to resubmit this blog for review?"
);

if (!confirmed) {
    return;
}

try {
    resubmitButton.disabled = true;
    resubmitButton.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Resubmitting...';

    const response = await fetch(
        `${API_URL}/blogs/${blogId}/resubmit`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: title,
                content: content,
                category: category
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || "Resubmission failed.");
    }

    alert("Blog resubmitted successfully!");

    window.location.href = "my-blogs.html";

} catch (error) {
    console.error(error);

    alert(error.message);

    resubmitButton.disabled = false;

    resubmitButton.innerHTML =
        '<i class="fa-solid fa-paper-plane"></i> Resubmit for Review';
}

});

loadBlog();