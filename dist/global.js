"use strict";
const navHamburger = document.querySelector(`#nav-hamburger`);
const siteNavElement = document.querySelector(`#site-nav-container`);
const closeSiteNavButton = document.querySelector(`#close-nav-button`);
const siteNavCurtain = document.querySelector(`#site-nav-curtain`);
const handleHamburgerClick = () => {
    toggleNavMenu();
};
const toggleNavMenu = () => {
    if (!navHamburger || !siteNavElement)
        return;
    const menuIsOpen = navHamburger.getAttribute("aria-expanded") === "true";
    if (menuIsOpen) {
        navHamburger.setAttribute("aria-label", "Open Menu");
        navHamburger.setAttribute("aria-expanded", "false");
    }
    else {
        siteNavElement.removeAttribute("hidden");
        requestAnimationFrame(() => {
            navHamburger.setAttribute("aria-label", "Close Menu");
            navHamburger.setAttribute("aria-expanded", "true");
        });
    }
};
const handleCloseNavButtonClick = () => {
    toggleNavMenu();
};
const handleSiteNavTransitionEnd = () => {
    if (!navHamburger || !siteNavElement)
        return;
    const nowClosed = navHamburger.getAttribute("aria-expanded") === "false";
    if (nowClosed) {
        siteNavElement.setAttribute("hidden", "");
    }
};
const handleCurtainClick = () => {
    toggleNavMenu();
};
siteNavElement?.addEventListener("transitionend", handleSiteNavTransitionEnd);
navHamburger?.addEventListener("click", handleHamburgerClick);
closeSiteNavButton?.addEventListener("click", handleCloseNavButtonClick);
siteNavCurtain?.addEventListener("click", handleCurtainClick);
