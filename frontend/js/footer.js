// ==========================================
// LOAD FOOTER
// ==========================================

async function loadFooter() {

    try {

        // ==========================================
        // CHECK WHETHER CURRENT PAGE IS INSIDE
        // A SUBFOLDER
        // ==========================================

        const isSubfolder =

            window.location.pathname.includes('/mentor/') ||

            window.location.pathname.includes('/admin/') ||

            window.location.pathname
                .toLowerCase()
                .includes('/journal/') ||

            window.location.pathname.includes('/connection/') ||

            window.location.pathname
                .toLowerCase()
                .includes('/toolkit/') ||

            window.location.pathname
                .toLowerCase()
                .includes('/contact/');


        // ==========================================
        // FOOTER COMPONENT PATH
        // ==========================================

        const footerPath = isSubfolder

            ? '../components/footer.html'

            : 'components/footer.html';


        // ==========================================
        // LOAD FOOTER
        // ==========================================

        const response =
            await fetch(footerPath);


        if (!response.ok) {

            throw new Error(
                `Footer could not be loaded. Status: ${response.status}`
            );

        }


        const footerHTML =
            await response.text();


        // ==========================================
        // FIND FOOTER CONTAINER
        // ==========================================

        const footerContainer =
            document.getElementById('footer');


        if (!footerContainer) {

            console.error(
                'Footer container #footer was not found.'
            );

            return;

        }


        // ==========================================
        // INSERT FOOTER
        // ==========================================

        footerContainer.innerHTML =
            footerHTML;


        // ==========================================
        // FIX LOGO PATH
        // ==========================================

        const footerLogo =
            document.querySelector(
                '#footer-logo img'
            );


        if (footerLogo) {

            footerLogo.src = isSubfolder

                ? '../images/mindspeak.jpg'

                : 'images/mindspeak.jpg';

        }


        // ==========================================
        // FIX FOOTER LINKS
        // ==========================================

        if (isSubfolder) {

            document
                .querySelectorAll('.footer a')
                .forEach(link => {

                    const href =
                        link.getAttribute('href');


                    if (
                        href &&
                        !href.startsWith('http') &&
                        !href.startsWith('#') &&
                        !href.startsWith('../') &&
                        !href.startsWith('/')
                    ) {

                        link.setAttribute(
                            'href',
                            '../' + href
                        );

                    }

                });

        }


        // ==========================================
        // INITIALIZE FOOTER
        // ==========================================

        initializeFooter();


    } catch (error) {

        console.error(
            'Footer failed to load:',
            error
        );

    }

}


// ==========================================
// INITIALIZE FOOTER
// ==========================================

function initializeFooter() {


    // ==========================================
    // BACK TO TOP
    // ==========================================

    const topBtn =
        document.getElementById('topBtn');


    if (topBtn) {

        function toggleTopButton() {

            if (window.scrollY > 300) {

                topBtn.classList.add('show');

            } else {

                topBtn.classList.remove('show');

            }

        }


        window.addEventListener(
            'scroll',
            toggleTopButton
        );


        topBtn.addEventListener(
            'click',
            () => {

                window.scrollTo({

                    top: 0,

                    behavior: 'smooth'

                });

            }
        );

    }


    // ==========================================
    // FOOTER REVEAL
    // ==========================================

    const footerCols =
        document.querySelectorAll(
            '.footer-col'
        );


    if (footerCols.length > 0) {

        const footerObserver =
            new IntersectionObserver(

                (entries, observer) => {

                    entries.forEach(entry => {

                        if (entry.isIntersecting) {

                            entry.target.classList.add(
                                'reveal'
                            );


                            observer.unobserve(
                                entry.target
                            );

                        }

                    });

                },

                {
                    threshold: 0.15
                }

            );


        footerCols.forEach(col => {

            footerObserver.observe(col);

        });

    }


    // ==========================================
    // NEWSLETTER
    // ==========================================

    const form =
        document.querySelector(
            '.newsletter'
        );


    if (form) {

        const input =
            form.querySelector('input');


        const button =
            form.querySelector('button');


        const feedback =
            document.createElement('p');


        feedback.className =
            'newsletter-feedback';


        form.appendChild(
            feedback
        );


        form.addEventListener(
            'submit',
            async (e) => {

                e.preventDefault();


                const email =
                    input.value.trim();


                // ==========================================
                // EMAIL VALIDATION
                // ==========================================

                const emailPattern =
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


                if (!emailPattern.test(email)) {

                    feedback.textContent =
                        '❌ Please enter a valid email';

                    return;

                }


                // ==========================================
                // SUBMITTING STATE
                // ==========================================

                button.disabled = true;

                button.textContent =
                    'Subscribing...';


                // ==========================================
                // TEMPORARY SUBSCRIPTION PROCESS
                // ==========================================

                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            1200
                        )
                );


                feedback.textContent =
                    '💚 Successfully subscribed!';


                input.value =
                    '';


                button.disabled =
                    false;


                button.textContent =
                    'Subscribe';

            }
        );

    }

}


// ==========================================
// START
// ==========================================

loadFooter();