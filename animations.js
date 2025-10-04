// GSAP ScrollTrigger animations
gsap.registerPlugin(ScrollTrigger);

// Split text into words
function splitTextIntoWords(element) {
    const text = element.textContent;
    const words = text.trim().split(/\s+/);
    element.innerHTML = words.map(word => `<span class="word">${word}</span>`).join(' ');
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Animate title - split into words and fade out on scroll
    const titleParagraphs = document.querySelectorAll('.title p');
    titleParagraphs.forEach(p => splitTextIntoWords(p));

    gsap.to('.title .word', {
        opacity: 0,
        y: -100,
        scrollTrigger: {
            trigger: '#content',
            start: 'top top',
            end: 'top -100px',
            scrub: 1,
            markers: false
        }
    });

        // 2. Animate section-header and content-wrapper elements in each section
    const sections = document.querySelectorAll('.section');
    sections.forEach((section) => {
        const header = section.querySelector('.section-header');
        const wrapper = section.querySelector('.content-wrapper');

        if (wrapper) {
            // Collect all elements to animate
            const elementsToAnimate = [];
            if (header) elementsToAnimate.push(header);
            const children = wrapper.querySelectorAll('*');
            elementsToAnimate.push(...children);

            gsap.fromTo(elementsToAnimate,
                {
                    opacity: 0,
                    y: 50
                },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    stagger: 0.1,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: wrapper,
                        start: "top 70%",
                        end: "bottom 30%",
                        toggleActions: "play reverse play reverse",
                        markers: false
                    }
                }
            );
        }
    });

    // 3. Animate .so-text when in view
    const soText = document.querySelector('.so-text');
    if (soText) {
        gsap.fromTo(soText,
            {
                opacity: 0,
                scale: 0.5
            },
            {
                opacity: 1,
                scale: 1,
                duration: 1.2,
                ease: "back.out(1.7)",
                scrollTrigger: {
                    trigger: soText,
                    start: "top 80%",
                    end: "bottom 30%",
                    toggleActions: "play reverse play reverse",
                    markers: false
                }
            }
        );
    }

    // 4. Animate .why-not when in view with pin to hold on screen
    const whyNot = document.querySelector('.why-not');
    if (whyNot) {
        const finalSection = document.querySelector('.final-section');

        // Pin the final section to hold "WHY NOT" on screen
        if (finalSection) {
            ScrollTrigger.create({
                trigger: finalSection,
                start: "center center",
                end: "+=100%",
                pin: true,
                pinSpacing: false,
                markers: false
            });
        }

        gsap.fromTo(whyNot,
            {
                opacity: 0,
                scale: 0.3,
                y: 100
            },
            {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: 1.5,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: whyNot,
                    start: "top 80%",
                    end: "bottom 5%",
                    toggleActions: "play reverse play reverse",
                    markers: false
                }
            }
        );
    }
});

// Handle window resize - refresh ScrollTrigger
window.addEventListener('resize', () => {
    ScrollTrigger.refresh();
});

// Refresh ScrollTrigger after models load
window.addEventListener('load', () => {
    setTimeout(() => {
        ScrollTrigger.refresh();
    }, 1000);
});
