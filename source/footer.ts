const footerElement = document.querySelector("#footer")! as HTMLElement;

const buildFooter = () => {
  const rightNow = new Date(Date.now());
  const thisYear = rightNow.getFullYear();

  const homeLinkElement = document.createElement("a");
  homeLinkElement.setAttribute("href", "/dist/");
  homeLinkElement.innerText = "Home";

  const aboutLinkElement = document.createElement("a");
  aboutLinkElement.setAttribute("href", "/dist/about.html");
  aboutLinkElement.innerText = "About";

  const creditLinkElement = document.createElement("a");
  creditLinkElement.setAttribute("href", "https://www.lucasmace.com/");
  creditLinkElement.setAttribute("target", "_blank");
  creditLinkElement.innerText = "Lucas Mace";

  const copyrightElement = document.createElement("div");
  copyrightElement.classList.add("ml-auto");
  copyrightElement.innerText = `Copyright ${thisYear} - `;
  copyrightElement.appendChild(creditLinkElement);

  footerElement.appendChild(homeLinkElement);
  footerElement.appendChild(aboutLinkElement);
  footerElement.appendChild(copyrightElement);
};

buildFooter();
