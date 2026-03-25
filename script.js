const menuButton = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const subscribeForm = document.querySelector("#subscribe-form");
const formNote = document.querySelector("#form-note");

if (menuButton && navLinks) {
  menuButton.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });
}

if (subscribeForm && formNote) {
  subscribeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const emailInput = subscribeForm.querySelector('input[type="email"]');
    const email = emailInput ? emailInput.value.trim() : "";

    if (!email) {
      formNote.textContent = "请输入有效邮箱后再订阅。";
      formNote.classList.remove("success");
      return;
    }

    formNote.textContent = `已收到 ${email}，这里先做前端演示，后续可以接入真实订阅服务。`;
    formNote.classList.add("success");
    subscribeForm.reset();
  });
}
