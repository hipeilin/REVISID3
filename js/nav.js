// Presentation navigation
let currentSlide = 6;
const slidesWrapper = document.getElementById('slidesWrapper');
const slides = document.querySelectorAll('.slide');
const totalSlides = slides.length;
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const currentSlideDisplay = document.getElementById('currentSlide');
const totalSlidesDisplay = document.getElementById('totalSlides');
const jumpToInput = document.getElementById('jumpToInput');

function updateSlide() {
    slidesWrapper.style.transform = `translateX(-${currentSlide * 100}vw)`;
    currentSlideDisplay.textContent = currentSlide + 1;
    prevBtn.disabled = currentSlide === 0;
    nextBtn.disabled = currentSlide === totalSlides - 1;
    
    // Clear jump to input
    jumpToInput.value = "";

    // Only remove animation from .profile elements in the previous slide
    if (typeof updateSlide.prevSlideIndex === 'number') {
        const prevSlideElement = slides[updateSlide.prevSlideIndex];
        if (prevSlideElement && prevSlideElement.hasAttribute('data-animate-profiles')) {
            setTimeout(() => {
                prevSlideElement.querySelectorAll('.profile').forEach(profile => {
                    profile.classList.remove('animate');
                });
            }, 600);
        }
    }
    updateSlide.prevSlideIndex = currentSlide;

    // Check if current slide needs profile animation
    const currentSlideElement = slides[currentSlide];
    if (currentSlideElement.hasAttribute('data-animate-profiles')) {
        setTimeout(() => {
            currentSlideElement.querySelectorAll('.profile').forEach(profile => {
                profile.classList.add('animate');
            });
        }, 200); // Small delay for better effect
    }
}

function nextSlide() {
    if (currentSlide < totalSlides - 1) {
        currentSlide++;
        updateSlide();
    }
}

function prevSlide() {
    if (currentSlide > 0) {
        currentSlide--;
        updateSlide();
    }
}

// Button navigation
prevBtn.addEventListener('click', prevSlide);
nextBtn.addEventListener('click', nextSlide);

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
    }
});

// Jump to slide functionality
function jumpToSlide() {
    const slideNumber = parseInt(jumpToInput.value);
    // Convert from 1-indexed (user input) to 0-indexed (internal)
    const slideIndex = slideNumber - 1;
    
    if (!isNaN(slideIndex) && slideIndex >= 0 && slideIndex < totalSlides) {
        currentSlide = slideIndex;
        updateSlide();
    } else if (jumpToInput.value !== "") {
        // Invalid input - shake the input or show feedback
        jumpToInput.style.borderColor = '#e74c3c';
        setTimeout(() => {
            jumpToInput.style.borderColor = '#1D3160';
        }, 300);
    }
}

// Jump on Enter key press
jumpToInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        jumpToSlide();
    }
});

// Jump on blur (when user clicks away)
jumpToInput.addEventListener('blur', () => {
    if (jumpToInput.value !== "") {
        jumpToSlide();
    }
});

// Initialize
totalSlidesDisplay.textContent = totalSlides;
jumpToInput.setAttribute('max', totalSlides);
updateSlide();