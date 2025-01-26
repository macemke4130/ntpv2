const showLoginFlag = () => {
    const loginFlagElement = document.querySelector("#login-flag");
    loginFlagElement.classList.add("show");
};
const url = new URL(window.location.href);
const urlParams = new URLSearchParams(url.search);
if (urlParams.has("unauthorized")) {
    showLoginFlag();
}
const apiHelper = async (url, method = "GET", data) => {
    const headers = { "Content-Type": "application/json", Accept: "application/json" };
    const options = { method, headers };
    if (data) {
        const body = JSON.stringify(data);
        options.body = body;
    }
    try {
        const request = await fetch(url, options);
        const jsonResponse = await request.json();
        return jsonResponse;
    }
    catch (e) {
        console.error(e);
    }
};
const emailInputElement = document.querySelector("#email-address");
const passwordInputElement = document.querySelector("#password");
const submitButtonElement = document.querySelector("#submit-login");
const attemptLogin = async (emailAddress, password) => {
    try {
        const request = await apiHelper(`/api/admin/login-attempt`, "POST", { emailAddress, password });
        return request;
    }
    catch (error) {
        console.error(error);
    }
};
const handleLoginClick = async (event) => {
    event.preventDefault();
    const request = await attemptLogin(emailInputElement.value, passwordInputElement.value);
    if (request?.data.login) {
        // Save JWT
        localStorage.setItem("jwt", request.data.token);
        window.location.href = "./dashboard.html";
    }
    else {
        alert("You suck at hacking.");
    }
};
submitButtonElement.addEventListener("click", handleLoginClick);
export {};
