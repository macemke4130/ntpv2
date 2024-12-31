"use strict";
const footerElement = document.querySelector("#footer");
const handleFooterMenuClick = (event) => {
    const target = event.currentTarget;
    if (footerElement.classList.contains("open")) {
        target.innerText = "Open Menu";
        footerElement.classList.remove("open");
        target.setAttribute("aria-expanded", "false");
    }
    else {
        target.innerText = "Close Menu";
        footerElement.classList.add("open");
        target.setAttribute("aria-expanded", "true");
    }
};
const buildFooter = () => {
    const rightNow = new Date(Date.now());
    const thisYear = rightNow.getFullYear();
    const footerMenuButtonElement = document.createElement("button");
    footerMenuButtonElement.innerText = "Open Menu";
    footerMenuButtonElement.setAttribute("id", "mobile-menu-button");
    if (window.innerWidth <= 1026) {
        footerMenuButtonElement.setAttribute("aria-expanded", "false");
        footerMenuButtonElement.setAttribute("aria-controls", "footer-nav");
    }
    footerMenuButtonElement.addEventListener("click", handleFooterMenuClick);
    const footerNavElement = document.createElement("nav");
    footerNavElement.setAttribute("id", "footer-nav");
    const homeLinkElement = document.createElement("a");
    homeLinkElement.setAttribute("href", "/");
    homeLinkElement.innerText = "Home";
    const aboutLinkElement = document.createElement("a");
    aboutLinkElement.setAttribute("href", "/about.html");
    aboutLinkElement.innerText = "About";
    const scoreboardLinkElement = document.createElement("a");
    scoreboardLinkElement.setAttribute("href", "/scoreboard.html");
    scoreboardLinkElement.innerText = "Scoreboard";
    const creditLinkElement = document.createElement("a");
    creditLinkElement.setAttribute("href", "https://www.lucasmace.com/");
    creditLinkElement.setAttribute("target", "_blank");
    creditLinkElement.innerText = "Lucas Mace";
    const copyrightElement = document.createElement("div");
    copyrightElement.classList.add("copyright");
    copyrightElement.innerText = `Copyright ${thisYear} - `;
    copyrightElement.appendChild(creditLinkElement);
    footerNavElement.appendChild(homeLinkElement);
    footerNavElement.appendChild(aboutLinkElement);
    footerNavElement.appendChild(scoreboardLinkElement);
    footerElement.appendChild(footerMenuButtonElement);
    footerElement.appendChild(footerNavElement);
    footerElement.appendChild(copyrightElement);
};
buildFooter();
