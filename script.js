class DocumentViewer {
    constructor() {
        this.currentDocument = null;
        this.pdfDoc = null;
        this.pageNum = 1;
        this.pageRendering = false;
        this.pageNumPending = null;
        this.scale = 1.5;
        this.documentsData = [
            {
                id: 1,
                title: "Sentencia Stalking 2024/001",
                description: "Resolución judicial sobre caso de acoso...",
                url: "Stalking.pdf",
                comentarios: [
                    "Interesante análisis del caso.",
                    "Considero que la pena debería ser mayor.",
                ],
            },
            {
                id: 2,
                title: "Sentencia Coacciones 2024/002",
                description: "Análisis jurídico sobre coacciones...",
                url: "Coacciones.pdf",
                comentarios: [
                    "Un claro ejemplo de coacción.",
                    "La defensa no presentó suficientes pruebas.",
                ],
            }
        ];
        this.isAdmin = false; // Initially set to false
    }

    async init() {
        try {
            this.renderDocumentList();
            this.setupSubscriptionForm();
            this.setupAdminLoginForm();
            this.setupAdminCommentForm();
            this.renderBlogPosts(); // Call the new function here
        } catch (error) {
            console.error('Error initializing DocumentViewer:', error);
        }
    }

    renderDocumentList() {
        const documentList = document.querySelector('.document-list');
        if (!documentList) return;
        
        documentList.innerHTML = this.documentsData.map(doc => `
            <div class="document-item" data-id="${doc.id}">
                <h3>${doc.title}</h3>
                <p>${doc.description}</p>
                <button class="view-doc-btn">Ver Documento</button>
            </div>
        `).join('');

        // Initialize or re-initialize event listeners after rendering the list
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.querySelectorAll('.view-doc-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const docId = e.target.closest('.document-item')?.dataset?.id;
                if (docId) this.loadDocument(docId);
            });
        });

        // Add event listeners for area categories
        document.querySelectorAll('.area-category').forEach(category => {
            category.addEventListener('click', (e) => {
                e.preventDefault();
                const area = e.currentTarget.dataset.area;
                const sublist = document.querySelector(`.area-sublist[data-area="${area}"]`);
                if (sublist) {
                    sublist.classList.toggle('active');
                }
            });
        });
    }

    setupSubscriptionForm() {
        const subscriptionForm = document.querySelector('#subscription-form');
        if (subscriptionForm) {
            subscriptionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubscriptionSubmission(e);
            });
        }
    }
    
    setupAdminLoginForm() {
        const adminForm = document.querySelector('#admin-form');
        if (adminForm) {
            adminForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAdminLogin(e);
            });
        }
    }

    setupAdminCommentForm() {
        const adminCommentForm = document.querySelector('#admin-comment-form');
        if (adminCommentForm) {
            adminCommentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAdminCommentSubmission(e);
            });
        }
    }

    async loadDocument(docId) {
        try {
            const document = this.documentsData.find(doc => doc.id === parseInt(docId));
            if (document) {
                this.currentDocument = document;
                this.pdfDoc = null;
                this.pageNum = 1;
                this.loadPdf(document.url);
                this.displayDocumentComments(document.id);
            }
        } catch (error) {
            console.error('Error loading document:', error);
        }
    }

    async loadPdf(url) {
        const pdfContainer = document.getElementById('pdf-container');
        const pdfLoader = document.getElementById('pdf-loader');
        const pdfError = document.getElementById('pdf-error');
        const pdfViewer = document.getElementById('pdf-viewer');
        const pageNumSpan = document.getElementById('page-num');
        const pageCountSpan = document.getElementById('page-count');
        const prevPageButton = document.getElementById('prev-page');
        const nextPageButton = document.getElementById('next-page');

        pdfContainer.style.display = 'block';
        pdfLoader.style.display = 'block';
        pdfError.style.display = 'none';

        try {
            this.pdfDoc = await pdfjsLib.getDocument(url).promise;
            pdfLoader.style.display = 'none';
            pageCountSpan.textContent = this.pdfDoc.numPages;
            this.renderPage(this.pageNum);

            prevPageButton.addEventListener('click', this.onPrevPage.bind(this));
            nextPageButton.addEventListener('click', this.onNextPage.bind(this));
        } catch (error) {
            pdfLoader.style.display = 'none';
            pdfError.style.display = 'block';
            pdfError.textContent = 'Error al cargar el PDF.';
            console.error('Error loading PDF:', error);
        }
    }

    renderPage(num) {
        if (this.pageRendering) {
            this.pageNumPending = num;
            return;
        }

        this.pageRendering = true;
        const pdfViewer = document.getElementById('pdf-viewer');
        const pageNumSpan = document.getElementById('page-num');

        this.pdfDoc.getPage(num).then(page => {
            const viewport = page.getViewport({ scale: this.scale });
            pdfViewer.height = viewport.height;
            pdfViewer.width = viewport.width;

            const renderContext = {
                canvasContext: pdfViewer.getContext('2d'),
                viewport: viewport
            };
            const renderTask = page.render(renderContext);

            renderTask.promise.then(() => {
                this.pageRendering = false;
                if (this.pageNumPending !== null) {
                    this.renderPage(this.pageNumPending);
                    this.pageNumPending = null;
                }
            });
        });

        pageNumSpan.textContent = num;
    }

    onPrevPage() {
        if (this.pageNum <= 1) {
            return;
        }
        this.pageNum--;
        this.renderPage(this.pageNum);
    }

    onNextPage() {
        if (this.pageNum >= this.pdfDoc.numPages) {
            return;
        }
        this.pageNum++;
        this.renderPage(this.pageNum);
    }

    displayDocumentComments(documentId) {
        const adminCommentsList = document.getElementById('admin-comments-list');
        if (!adminCommentsList) return;

        // Find the document and get comments
        const document = this.documentsData.find(doc => doc.id === parseInt(documentId));
        const comments = document?.comentarios || [];

        // Render comments
        adminCommentsList.innerHTML = comments.map(comment => `
            <div class="comment">${comment}</div>
        `).join('');
    }

    handleSubscriptionSubmission(event) {
        try {
            const form = event.target;
            const emailInput = form.querySelector('input[type="email"]');
            if (!emailInput) return;

            const email = emailInput.value;
            if (email.trim()) {
                console.log(`Subscribing ${email} to newsletter`);
                // Add subscription logic here
                form.reset();
            }
        } catch (error) {
            console.error('Error submitting subscription:', error);
        }
    }

    handleAdminLogin(event) {
        try {
            // Admin login logic here
            console.log('Admin logged in');
            this.isAdmin = true;
        } catch (error) {
            console.error('Error logging in admin:', error);
        }
    }

    handleAdminCommentSubmission(event) {
        try {
            const commentText = document.getElementById('admin-comment').value;

            if (this.currentDocument) {
                this.currentDocument.comentarios.push(commentText);
                this.displayDocumentComments(this.currentDocument.id);
                document.getElementById('admin-comment').value = '';
            } else {
                console.warn('No document is currently loaded.');
            }
            // Admin comment submission logic here
            console.log('Admin comment submitted');
        } catch (error) {
            console.error('Error submitting admin comment:', error);
        }
    }

    renderBlogPosts() {
        const blogSection = document.querySelector('#blog .image-grid');
        if (!blogSection) return;

        const blogPosts = [
            {
                title: "Claves para reclamar reparaciones a la comunidad de propietarios",
                content: "Si necesitas que la comunidad haga reparaciones en tu edificio o vivienda, aquí tienes algunos consejos clave...",
                imageUrl: "junta-vecinos.jpg"
            },
            // Add more blog posts here
        ];

        blogSection.innerHTML = blogPosts.map(post => `
            <div class="blog-post">
                <h3>${post.title}</h3>
                <img src="${post.imageUrl}" alt="${post.title}" style="width: 300px; height: 200px; object-fit: cover;">
                <p>${post.content}</p>
            </div>
        `).join('');
    }
}

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
    try {
        const viewer = new DocumentViewer();
        viewer.init();
    } catch (error) {
        console.error('Error creating DocumentViewer:', error);
    }
});