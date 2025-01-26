import { DBResponse } from "../types";

const showLoginFlag = () => {
  const loginFlagElement = document.querySelector("#login-flag")! as HTMLElement;
  loginFlagElement.classList.add("show");
};

const url = new URL(window.location.href);
const urlParams = new URLSearchParams(url.search);

if (urlParams.has("unauthorized")) {
  showLoginFlag();
}

const apiHelper = async (url: string, method: "GET" | "POST" = "GET", data?: any) => {
  const headers = { "Content-Type": "application/json", Accept: "application/json" };

  const options: { method: string; headers: typeof headers; body?: any } = { method, headers };

  if (data) {
    const body = JSON.stringify(data);
    options.body = body;
  }

  try {
    const request = await fetch(url, options);
    const jsonResponse: DBResponse = await request.json();
    return jsonResponse;
  } catch (e) {
    console.error(e);
  }
};

const emailInputElement = document.querySelector("#email-address")! as HTMLInputElement;
const passwordInputElement = document.querySelector("#password")! as HTMLInputElement;
const submitButtonElement = document.querySelector("#submit-login")! as HTMLButtonElement;

const attemptLogin = async (emailAddress: string, password: string) => {
  try {
    const request = await apiHelper(`/api/admin/login-attempt`, "POST", { emailAddress, password });
    return request;
  } catch (error) {
    console.error(error);
  }
};

const handleLoginClick = async (event: Event) => {
  event.preventDefault();

  const request = await attemptLogin(emailInputElement.value, passwordInputElement.value);

  if (request?.data.login) {
    // Save JWT
    localStorage.setItem("jwt", request.data.token);
    window.location.href = "./dashboard.html";
  } else {
    alert("You suck at hacking.");
  }
};

submitButtonElement.addEventListener("click", handleLoginClick);
