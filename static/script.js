document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const previewContainer = document.getElementById('previewContainer');
    const previewImage = document.getElementById('previewImage');
    const predictBtn = document.getElementById('predictBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultsCard = document.getElementById('resultsCard');
    const primaryPrediction = document.getElementById('primaryPrediction');
    const primaryConfidence = document.getElementById('primaryConfidence');
    const alternativeResults = document.getElementById('alternativeResults');
    const historyContainer = document.getElementById('historyContainer');
    const themeSwitch = document.querySelector('.theme-switch');
    const shareModal = document.getElementById('shareModal');

    // Theme Management
    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    };

    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeSwitch.addEventListener('click', toggleTheme);

    // File Upload Handling
    const handleFileSelect = (file) => {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImage.src = e.target.result;
                uploadArea.style.display = 'none';
                previewContainer.style.display = 'block';
                predictBtn.disabled = false;
            };
            reader.readAsDataURL(file);
        }
    };

    // Drag and Drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    });

    // File Input Change
    fileInput.addEventListener('change', (e) => {
        handleFileSelect(e.target.files[0]);
    });

    // Browse Button Click
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // Change Image Button
    document.getElementById('changeImageBtn').addEventListener('click', () => {
        uploadArea.style.display = 'block';
        previewContainer.style.display = 'none';
        predictBtn.disabled = true;
        resultsCard.style.display = 'none';
    });

    // Prediction Handler
    predictBtn.addEventListener('click', async () => {
        try {
            loadingSpinner.style.display = 'block';
            predictBtn.disabled = true;

            const formData = new FormData();
            formData.append('file', fileInput.files[0]);

            const response = await fetch('/predict', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                displayResults(result);
                addToHistory(result, previewImage.src);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            loadingSpinner.style.display = 'none';
            predictBtn.disabled = false;
        }
    });

    // Display Results
    const displayResults = (result) => {
        primaryPrediction.textContent = formatClassName(result.prediction);
        primaryConfidence.style.width = `${result.confidence * 100}%`;

        alternativeResults.innerHTML = result.top_3
            .slice(1)
            .map(pred => `
                <div class="diagnosis-box">
                    <p>${formatClassName(pred.class)}</p>
                    <div class="confidence-bar">
                        <div class="confidence-progress" 
                             style="width: ${pred.confidence * 100}%"></div>
                    </div>
                </div>
            `).join('');

        resultsCard.style.display = 'block';
        resultsCard.scrollIntoView({ behavior: 'smooth' });
    };

    // History Management
    const addToHistory = (result, imageUrl) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'card history-item';
        historyItem.innerHTML = `
            <img src="${imageUrl}" alt="Plant" style="width: 100%; border-radius: 5px;">
            <h3>${formatClassName(result.prediction)}</h3>
            <p>Confidence: ${(result.confidence * 100).toFixed(1)}%</p>
            <p>${new Date().toLocaleDateString()}</p>
        `;

        historyContainer.insertBefore(historyItem, historyContainer.firstChild);

        // Limit history to 6 items
        while (historyContainer.children.length > 6) {
            historyContainer.removeChild(historyContainer.lastChild);
        }
    };

    // Share Results
    document.getElementById('shareResultsBtn').addEventListener('click', () => {
        shareModal.style.display = 'flex';
    });

    document.querySelector('.close-modal-btn').addEventListener('click', () => {
        shareModal.style.display = 'none';
    });

    // Share Options
    document.querySelectorAll('.share-option').forEach(button => {
        button.addEventListener('click', () => {
            const platform = button.dataset.platform;
            const text = `Check out my plant analysis results from Plant Disease Detective!`;

            let url;
            switch (platform) {
                case 'twitter':
                    url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
                    break;
                case 'whatsapp':
                    url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                    break;
                case 'email':
                    url = `mailto:?subject=Plant Analysis Results&body=${encodeURIComponent(text)}`;
                    break;
            }

            window.open(url, '_blank');
            shareModal.style.display = 'none';
        });
    });

    // Utility Functions
    const formatClassName = (name) => {
        return name
            .replace(/_/g, ' ')
            .replace(/___/g, ' - ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };
});