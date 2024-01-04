import { getFacts, getTags } from "./api.js";
import { factToCard, tagToButton } from "./markup.js";

const searchTags = new Set();
const toasts = [];

let reconnecting = null;

async function reloadTags() {
    const tagButtons = document.getElementById("fact_tags");

    const tags = await getTags();
    if (tags === null) {
        // It doesn't really matter if tags aren't available
        return;
    }
    tagButtons.innerHTML = tags.map(tag => tagToButton(tag)).join("\n");
    for (const tag of tagButtons.getElementsByTagName("*")) {
        tag.classList.add("buttonFadeIn");
        tag.onclick = async () => {
            if (!searchTags.delete(tag.innerText)) {
                searchTags.add(tag.innerText);
            }
            await reloadFacts();
            tag.classList.toggle("btn-outline-primary");
            tag.classList.toggle("btn-success");
        };
    }
}

export async function reloadFacts() {
    const content = document.getElementById("fact_content");
    const search = document.getElementById("search_input");

    let animated = fadeOutContent(content, false);
    const facts = await getFacts([...searchTags], search.value, false, 10);
    if (facts === null) {
        waitForAnimation(animated, serverUnavailablePage);
        return false;
    }
    animated = fadeOutContent(content, true);

    waitForAnimation(animated, () => {
        if (facts.length === 0) {
            content.innerHTML = `<div class="text-center p-3" style="font-size: x-large">No Search Results</div>`;
        } else {
            content.innerHTML = facts.map(fact => factToCard(fact)).join("\n");
        }

        for (const element of content.getElementsByTagName("*")) {
            element.classList.toggle("fadeIn");
        }

        // Initialize tooltips
        for (const trigger of document.querySelectorAll('[data-bs-toggle="tooltip"]')) {
            if (trigger.id !== "mapping_license") {
                new bootstrap.Tooltip(trigger);
            }
        }
    });
    return true;
}

function fadeOutContent(content, post) {
    if ((post && reconnecting !== null) || (!post && reconnecting === null)) {
        let animated = null;
        for (const element of content.getElementsByTagName("*")) {
            element.classList.add("fadeOut");
            if (animated === null) {
                animated = element;
            }
        }
        return animated;
    }
    return null;
}

function serverUnavailablePage() {
    if (reconnecting !== null) {
        return;
    }

    const content = document.getElementById("fact_content");
    content.innerHTML = `<div class="loader"></div>`;
    for (const toast of toasts) {
        toast.show();
    }
    reconnecting = setInterval(tryReconnectToServer, 1_000);
}

async function tryReconnectToServer() {
    if (reconnecting !== null && await reloadFacts()) {
        reconnecting = null;
        clearInterval(reconnecting);
        for (const toast of toasts) {
            toast.hide();
        }
    }
}

function waitForAnimation(animated, runnable) {
    if (animated !== null) {
        animated.addEventListener("animationend", runnable);
        return;
    }
    runnable();
}

window.addEventListener("DOMContentLoaded", async () => {
    await reloadTags();
    await reloadFacts();

    const form = document.getElementById("search_form");
    form.onsubmit = event => {
        event.preventDefault();
        reloadFacts();
    };

    const license = document.getElementById("mapping_license");
    // eslint-disable-next-line no-undef
    const tooltip = new bootstrap.Tooltip(license);
    // We want the user to be able to click the link on the tooltip.
    license.onmouseenter = () => {
        if (!tooltip._isShown()) {
            tooltip.show();
        }
    };
    license.onmouseleave = () => {
        setTimeout(() => {
            if (!license.matches(":hover")) {
                tooltip.hide();
            }
        }, 600);
    };

    for (const toast of document.querySelectorAll(".toast")) {
        toasts.push(new bootstrap.Toast(toast));
    }
});
