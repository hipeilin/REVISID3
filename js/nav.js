// Presentation navigation
let currentSlide = 15;
const slidesWrapper = document.getElementById('slidesWrapper');
const slides = document.querySelectorAll('.slide');
const totalSlides = slides.length;
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const currentSlideDisplay = document.getElementById('currentSlide');
const totalSlidesDisplay = document.getElementById('totalSlides');
const jumpToInput = document.getElementById('jumpToInput');

// Timer variables
const timerDisplay = document.getElementById('timer');
const timerElement = document.querySelector('.timer-display');
let timerInterval = null;
let timerSeconds = 0;
const TARGET_SLIDE = 1; // Slide 2 (0-indexed)

// Track reveal state for each slide
let slideRevealState = {};

function initializeRevealState() {
    slides.forEach((slide, index) => {
        const listItems = slide.querySelectorAll('.main-text li');
        // Count only non-explanation-text items
        const regularItems = Array.from(listItems).filter(item => !item.classList.contains('explaination-text'));
        
        // Make the first regular item visible initially
        if (regularItems.length > 0) {
            const firstRegularItem = regularItems[0];
            const firstRegularIndex = Array.from(listItems).indexOf(firstRegularItem);
            
            // Reveal the first regular item
            firstRegularItem.classList.add('visible');
            
            // Also reveal any explanation-text item that comes right before it
            if (firstRegularIndex > 0) {
                const prevItem = Array.from(listItems)[firstRegularIndex - 1];
                if (prevItem.classList.contains('explaination-text')) {
                    prevItem.classList.add('visible');
                }
            }
        }
        
        slideRevealState[index] = {
            total: regularItems.length,
            current: 1,
            allRevealed: regularItems.length <= 1,
            listItems: Array.from(listItems) // Store the full list for easier access
        };
    });
}



function revealNextItem() {
    const state = slideRevealState[currentSlide];

    if (!state || state.allRevealed) {
        return false; // No items to reveal
    }

    const listItems = state.listItems;
    const regularItems = listItems.filter(item => !item.classList.contains('explaination-text'));
    
    if (state.current < state.total) {
        const nextRegularItem = regularItems[state.current];
        const nextRegularIndex = listItems.indexOf(nextRegularItem);
        
        // Reveal the next regular item
        nextRegularItem.classList.add('visible');
        
        // Also reveal any explanation-text item that comes right before this regular item
        if (nextRegularIndex > 0) {
            const prevItem = listItems[nextRegularIndex - 1];
            if (prevItem.classList.contains('explaination-text')) {
                prevItem.classList.add('visible');
            }
        }
        
        state.current++;

        if (state.current >= state.total) {
            state.allRevealed = true;
        }

        return true; // Item was revealed
    }

    return false; // No more items
}

function resetSlideReveal(slideIndex) {
    const slide = slides[slideIndex];
    const listItems = Array.from(slide.querySelectorAll('.main-text li'));

    listItems.forEach(item => {
        item.classList.remove('visible');
    });

    if (slideRevealState[slideIndex]) {
        const regularItems = listItems.filter(item => !item.classList.contains('explaination-text'));
        slideRevealState[slideIndex].current = 1;
        slideRevealState[slideIndex].allRevealed = regularItems.length <= 1;
        
        // Make the first regular item visible again after reset
        if (regularItems.length > 0) {
            const firstRegularItem = regularItems[0];
            const firstRegularIndex = listItems.indexOf(firstRegularItem);
            
            // Reveal the first regular item
            firstRegularItem.classList.add('visible');
            
            // Also reveal any explanation-text item that comes right before it
            if (firstRegularIndex > 0) {
                const prevItem = listItems[firstRegularIndex - 1];
                if (prevItem.classList.contains('explaination-text')) {
                    prevItem.classList.add('visible');
                }
            }
        }
    }
}

function handleKeyPress(e) {
    if (e.key === 'ArrowRight') {
        e.preventDefault();

        // Try to reveal next item first
        const itemRevealed = revealNextItem();

        // If no item was revealed, go to next slide
        if (!itemRevealed) {
            nextSlide();
        }
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
    } else if (e.key === ' ') {
        e.preventDefault();

        // Spacebar also reveals items
        const itemRevealed = revealNextItem();

        if (!itemRevealed) {
            nextSlide();
        }
    } else if (e.key === 'Home') {
        e.preventDefault();
        goToSlide(0);
    } else if (e.key === 'End') {
        e.preventDefault();
        goToSlide(totalSlides - 1);
    }
}

function setupEventListeners() {
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);
    document.addEventListener('keydown', handleKeyPress);

    // Click anywhere on slide to reveal next item
    document.addEventListener('click', function (e) {
        // Don't interfere with navigation buttons
        if (e.target.closest('.nav-button') ||
            e.target.closest('#prevBtn') ||
            e.target.closest('#nextBtn')) {
            return;
        }

        // Try to reveal next item
        revealNextItem();
        // const itemRevealed = revealNextItem();

        // If no item revealed, do nothing (or optionally go to next slide)
        // if (!itemRevealed) {
        //     nextSlide();
        // }
    });
}

function animateSlideContainers(slideIndex) {
    const slide = slides[slideIndex];
    const containers = slide.querySelectorAll('.paragraph-container');

    containers.forEach((container, index) => {
        setTimeout(() => {
            container.classList.add('visible');
        }, index * 1500); // 500ms delay between each container
    });
}

function updateSlide() {
    slidesWrapper.style.transform = `translateX(-${currentSlide * 100}vw)`;
    currentSlideDisplay.textContent = currentSlide + 1;
    prevBtn.disabled = currentSlide === 0;
    nextBtn.disabled = currentSlide === totalSlides - 1;

    // Reset all list items on all slides
    slides.forEach((slide, index) => {
        resetSlideReveal(index);
    });

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
        }, 300); // Small delay for better effect
    }


    // Reset all paragraph containers
    document.querySelectorAll('.paragraph-container').forEach(container => {
        container.classList.remove('visible');
    });

    // Animate containers on current slide
    setTimeout(() => {
        animateSlideContainers(currentSlide);
    }, 200); // Small delay to ensure reset happens first

    // Handle timer
    handleTimer();
}

function startTimer() {
    if (timerInterval) return; // Timer already running
    
    timerSeconds = 0;
    timerInterval = setInterval(() => {
        timerSeconds++;
        updateTimerDisplay();
    }, 1000);
    
    timerElement.classList.add('active');
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetTimer() {
    stopTimer();
    timerSeconds = 0;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    timerDisplay.textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function handleTimer() {
    if (currentSlide === TARGET_SLIDE) {
        // Start or continue timer on slide 2
        if (!timerInterval) {
            startTimer();
        }
    } else {
        // Reset timer when leaving slide 2
        if (timerInterval) {
            resetTimer();
            timerElement.classList.remove('active');
        }
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

// Keyboard navigation
// document.addEventListener('keydown', (e) => {
//     if (e.key === 'ArrowRight' || e.key === ' ') {
//         e.preventDefault();
//         nextSlide();
//     } else if (e.key === 'ArrowLeft') {
//         e.preventDefault();
//         prevSlide();
//     }
// });

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
initializeRevealState();

setupEventListeners();
updateSlide();