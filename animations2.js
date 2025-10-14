// GSAP ScrollTrigger animations for page 2
gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
    // Animate section titles
    const sectionTitles = document.querySelectorAll('.section-title');
    sectionTitles.forEach((title) => {
        gsap.fromTo(title,
            {
                opacity: 0,
                y: 100,
                scale: 0.8
            },
            {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: title,
                    start: "top 80%",
                    end: "top 30%",
                    toggleActions: "play reverse play reverse",
                    markers: false
                }
            }
        );
    });

    // Animate fact boxes
    const factBoxes = document.querySelectorAll('.fact-box');
    factBoxes.forEach((box, index) => {
        gsap.fromTo(box,
            {
                opacity: 0,
                x: index % 2 === 0 ? -100 : 100,
                rotation: index % 2 === 0 ? -5 : 5
            },
            {
                opacity: 1,
                x: 0,
                rotation: 0,
                duration: 0.8,
                ease: "back.out(1.7)",
                scrollTrigger: {
                    trigger: box,
                    start: "top 80%",
                    end: "top 30%",
                    toggleActions: "play reverse play reverse",
                    markers: false
                }
            }
        );
    });

    // Animate stat circles
    const statCircles = document.querySelectorAll('.stat-circle');
    statCircles.forEach((circle, index) => {
        gsap.fromTo(circle,
            {
                opacity: 0,
                scale: 0,
                rotation: 180
            },
            {
                opacity: 1,
                scale: 1,
                rotation: 0,
                duration: 0.8,
                delay: index * 0.2,
                ease: "back.out(2)",
                scrollTrigger: {
                    trigger: circle,
                    start: "top 80%",
                    end: "top 30%",
                    toggleActions: "play reverse play reverse",
                    markers: false
                }
            }
        );
    });

    // Animate stats containers
    const statsContainers = document.querySelectorAll('.stats-container');
    statsContainers.forEach((container) => {
        gsap.fromTo(container,
            {
                opacity: 0,
                y: 50
            },
            {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: container,
                    start: "top 80%",
                    end: "top 30%",
                    toggleActions: "play reverse play reverse",
                    markers: false
                }
            }
        );
    });

    // Animate content wrappers
    const contentWrappers = document.querySelectorAll('.content-wrapper');
    contentWrappers.forEach((wrapper) => {
        const children = wrapper.querySelectorAll('*');
        gsap.fromTo(children,
            {
                opacity: 0,
                y: 50
            },
            {
                opacity: 1,
                y: 0,
                duration: 0.8,
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
    });

    // Special animation for final "WHY NOT?" text
    const finalText = document.querySelector('.final-text');
    if (finalText) {
        gsap.fromTo(finalText,
            {
                opacity: 0,
                scale: 0.3,
                rotation: -20
            },
            {
                opacity: 1,
                scale: 1,
                rotation: 0,
                duration: 1.5,
                ease: "elastic.out(1, 0.5)",
                scrollTrigger: {
                    trigger: finalText,
                    start: "top 80%",
                    end: "top 20%",
                    toggleActions: "play reverse play reverse",
                    markers: false
                }
            }
        );
    }

    // Pin the final section to hold "WHY NOT?" on screen
    const finalSection = document.querySelector('#section8');
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
