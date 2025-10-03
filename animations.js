// GSAP ScrollTrigger animations for sections
gsap.registerPlugin(ScrollTrigger);

// Animate each section
const sections = gsap.utils.toArray('.section');

sections.forEach((section, index) => {
    // Fade in and slide up when scrolling down
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
                markers: true // Uncomment for debugging
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
            stagger: 0.1,
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
});
