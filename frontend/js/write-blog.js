// =========================================
// WORD & CHARACTER COUNTER
// =========================================

const blogContent = document.getElementById("blog-content");
const wordCount = document.getElementById("word-count");
const charCount = document.getElementById("char-count");

blogContent.addEventListener("input", function () {

    const text = blogContent.value;

    const characters = text.length;

    const words = text.trim() === ""
        ? 0
        : text.trim().split(/\s+/).length;

    wordCount.textContent = `${words} words`;
    charCount.textContent = `${characters} characters`;
});


// =========================================
// COVER IMAGE
// =========================================

const coverInput = document.getElementById("blog-cover");
const coverPreview = document.getElementById("cover-preview");
const removeCoverButton = document.getElementById("remove-cover");

let currentImageURL = null;


// =========================================
// GET LOGGED-IN USER
// =========================================

function getLoggedInUserId() {

    const userId =
        localStorage.getItem("user_id");

    if (!userId) {

        alert(
            "Your login session could not be found. Please log in again."
        );

        return null;
    }

    const parsedUserId =
        Number(userId);

    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {

        console.error(
            "Invalid user_id:",
            userId
        );

        alert(
            "Invalid login session. Please log in again."
        );

        return null;
    }

    return parsedUserId;
}


// =========================================
// SELECT COVER IMAGE
// =========================================

coverInput.addEventListener("change", function () {

    const file = this.files[0];

    if (!file) {
        clearCoverImage();
        return;
    }


    if (!file.type.startsWith("image/")) {

        alert(
            "Please choose a valid image file."
        );

        clearCoverImage();

        return;
    }


    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];


    if (!allowedTypes.includes(file.type)) {

        alert(
            "Please choose a JPG, PNG or WEBP image."
        );

        clearCoverImage();

        return;
    }


    if (currentImageURL) {

        URL.revokeObjectURL(
            currentImageURL
        );
    }


    currentImageURL =
        URL.createObjectURL(file);


    coverPreview.innerHTML = `
        <img
            src="${currentImageURL}"
            alt="Blog cover preview"
        >
    `;


    coverPreview.style.display =
        "block";


    removeCoverButton.style.display =
        "inline-flex";
});


// =========================================
// REMOVE COVER IMAGE
// =========================================

removeCoverButton.addEventListener(
    "click",
    function () {

        clearCoverImage();

    }
);


// =========================================
// CLEAR COVER IMAGE
// =========================================

function clearCoverImage() {

    if (currentImageURL) {

        URL.revokeObjectURL(
            currentImageURL
        );

        currentImageURL = null;
    }


    coverInput.value = "";

    coverPreview.innerHTML = "";

    coverPreview.style.display =
        "none";

    removeCoverButton.style.display =
        "none";
}


// =========================================
// UPLOAD COVER IMAGE
// =========================================

async function uploadCoverImage() {

    const file =
        coverInput.files[0];


    if (!file) {
        return null;
    }


    const formData =
        new FormData();


    formData.append(
        "file",
        file
    );


    const response =
        await fetch(
            "http://127.0.0.1:8000/blogs/upload-cover",
            {
                method: "POST",
                body: formData
            }
        );


    const data =
        await response.json();


    if (!response.ok || data.error) {

        throw new Error(
            data.error ||
            "Failed to upload cover image."
        );
    }


    console.log(
        "Cover image uploaded:",
        data.cover_image
    );


    return data.cover_image;
}


// =========================================
// SAVE BLOG AS DRAFT
// =========================================

const saveDraftButton =
    document.getElementById(
        "save-draft"
    );


saveDraftButton.addEventListener(
    "click",
    async function () {

        const title =
            document.getElementById(
                "blog-title"
            ).value.trim();


        const category =
            document.getElementById(
                "blog-category"
            ).value;


        const content =
            document.getElementById(
                "blog-content"
            ).value.trim();


        // -----------------------------------------
        // GET LOGGED-IN USER
        // -----------------------------------------

        const userId =
            getLoggedInUserId();


        if (!userId) {
            return;
        }


        // -----------------------------------------
        // VALIDATION
        // -----------------------------------------

        if (!title || !content) {

            alert(
                "Please enter a title and write something before saving."
            );

            return;
        }


        saveDraftButton.disabled = true;


        saveDraftButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Saving...
        `;


        try {

            // -----------------------------------------
            // UPLOAD COVER IMAGE
            // -----------------------------------------

            let coverImage = null;


            if (coverInput.files.length > 0) {

                coverImage =
                    await uploadCoverImage();
            }


            // -----------------------------------------
            // BLOG DATA
            // -----------------------------------------

            const blogData = {

                title: title,

                content: content,

                category: category,

                cover_image: coverImage,

                author_id: userId,

                status: "draft"
            };


            console.log(
                "Saving blog for logged-in user:",
                userId
            );


            // -----------------------------------------
            // CREATE BLOG
            // -----------------------------------------

            const response =
                await fetch(
                    "http://127.0.0.1:8000/blogs/",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                blogData
                            )
                    }
                );


            const data =
                await response.json();


            if (!response.ok || data.error) {

                throw new Error(
                    data.error ||
                    data.detail ||
                    "Failed to save blog."
                );
            }


            console.log(
                "Saved blog:",
                data
            );


            alert(
                "Your blog has been saved as a draft."
            );


            clearBlogForm();


        } catch (error) {

            console.error(
                "Error saving blog:",
                error
            );


            alert(
                error.message ||
                "Could not save the blog. Please make sure the backend is running."
            );


        } finally {

            saveDraftButton.disabled =
                false;


            saveDraftButton.innerHTML = `
                <i class="fa-regular fa-floppy-disk"></i>
                Save as Draft
            `;
        }
    }
);


// =========================================
// SUBMIT BLOG FOR REVIEW
// =========================================

const submitBlogButton =
    document.getElementById(
        "submit-blog"
    );


submitBlogButton.addEventListener(
    "click",
    async function () {

        const title =
            document.getElementById(
                "blog-title"
            ).value.trim();


        const category =
            document.getElementById(
                "blog-category"
            ).value;


        const content =
            document.getElementById(
                "blog-content"
            ).value.trim();


        // -----------------------------------------
        // GET LOGGED-IN USER
        // -----------------------------------------

        const userId =
            getLoggedInUserId();


        if (!userId) {
            return;
        }


        // -----------------------------------------
        // VALIDATION
        // -----------------------------------------

        if (!title || !category || !content) {

            alert(
                "Please complete the title, category, and story before submitting."
            );

            return;
        }


        submitBlogButton.disabled =
            true;


        submitBlogButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Submitting...
        `;


        try {

            // -----------------------------------------
            // UPLOAD COVER IMAGE
            // -----------------------------------------

            let coverImage = null;


            if (coverInput.files.length > 0) {

                coverImage =
                    await uploadCoverImage();
            }


            // -----------------------------------------
            // BLOG DATA
            // -----------------------------------------

            const blogData = {

                title: title,

                content: content,

                category: category,

                cover_image: coverImage,

                author_id: userId,

                status: "pending"
            };


            console.log(
                "Submitting blog for logged-in user:",
                userId
            );


            // -----------------------------------------
            // SEND BLOG
            // -----------------------------------------

            const response =
                await fetch(
                    "http://127.0.0.1:8000/blogs/",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                blogData
                            )
                    }
                );


            const data =
                await response.json();


            if (!response.ok || data.error) {

                throw new Error(
                    data.error ||
                    data.detail ||
                    "Failed to submit blog."
                );
            }


            console.log(
                "Submitted blog:",
                data
            );


            alert(
                "Your blog has been submitted for review."
            );


            clearBlogForm();


        } catch (error) {

            console.error(
                "Error submitting blog:",
                error
            );


            alert(
                error.message ||
                "Could not submit the blog. Please make sure the backend is running."
            );


        } finally {

            submitBlogButton.disabled =
                false;


            submitBlogButton.innerHTML = `
                <i class="fa-solid fa-paper-plane"></i>
                Submit for Review
            `;
        }
    }
);


// =========================================
// CLEAR BLOG FORM
// =========================================

function clearBlogForm() {

    document.getElementById(
        "blog-title"
    ).value = "";


    document.getElementById(
        "blog-category"
    ).value = "";


    document.getElementById(
        "blog-content"
    ).value = "";


    clearCoverImage();


    wordCount.textContent =
        "0 words";


    charCount.textContent =
        "0 characters";
}