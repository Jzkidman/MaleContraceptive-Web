// GSAP ScrollTrigger animations for sections
gsap.registerPlugin(ScrollTrigger);

// Split text into words manually
function splitTextIntoWords(element) {
    const text = element.textContent;
    const words = text.trim().split(/\s+/);
    element.innerHTML = words.map(word => `<span class="word">${word}</span>`).join(' ');
}

// Split title text into words
document.addEventListener('DOMContentLoaded', () => {
    const titleParagraphs = document.querySelectorAll('.title p');
    titleParagraphs.forEach(p => splitTextIntoWords(p));

    // Animate title fade out word by word
    gsap.to('.title .word', {
        opacity: 0,
        y: -100,
        scrollTrigger: {
            trigger: '#content',
            start: 'top top',
            end: 'top -200px',
            scrub: 1,
            markers: false
        }
    });
});

// Animate each section
const sections = gsap.utils.toArray('.section');

sections.forEach((section, index) => {
    const isHomeSection = section.id === 'home';

    if (isHomeSection) {
        // Special animation for home section - scale and rotate in
        gsap.fromTo(section,
            {
                opacity: 0,
                scale: 0.8,
                rotation: -15
            },
            {
                opacity: 1,
                scale: 1,
                rotation: 0,
                duration: 1.5,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: section,
                    start: "top 70%",
                    end: "bottom 50%",
                    toggleActions: "play reverse play reverse",
                    markers: true
                }
            }
        );

        // Animate home content with different timing
        const homeContent = section.querySelector('.home-content');
        if (homeContent) {
            gsap.fromTo(homeContent,
                {
                    opacity: 0,
                    x: -100,
                    rotation: 15
                },
                {
                    opacity: 1,
                    x: 0,
                    rotation: 30, // Final rotation matches CSS
                    duration: 1.2,
                    delay: 0.3,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: section,
                        start: "top 200%",
                        end: "bottom 50%",
                        toggleActions: "play reverse play reverse",
                        markers: true
                    }
                }
            );
        }
    } else {
        // Standard animation for other sections
        gsap.fromTo(section,
            {
                opacity: 0,
                y: 100
            },
            {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: section,
                    start: "top 70%",
                    end: "bottom 50%",
                    toggleActions: "play reverse play reverse",
                    markers: true
                }
            }
        );

        // Animate child elements with stagger
        const children = section.querySelectorAll('h1, h2, h3, p, .highlight, .stats');
        gsap.fromTo(children,
            {
                opacity: 0,
                y: 30
            },
            {
                opacity: 1,
                y: 0,
                duration: 0.8,
                stagger: 0.05,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: section,
                    start: "top 50%",
                    end: "bottom 50%",
                    toggleActions: "play reverse play reverse",
                    markers: true
                }
            }
        );
    }
});
