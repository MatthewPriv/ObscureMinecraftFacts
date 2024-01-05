import { addFact, getFacts, getTags } from "./api.js";
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

function isBlank(string) {
    return /^\s*$/.test(string);
}

function areAnyBlank(...strings) {
    for (const string of strings) {
        if (isBlank(string)) {
            return true;
        }
    }
    return false;
}

function addFactModal() {
    const areas = document.getElementsByTagName("textarea");
    for (const area of areas) {
        area.setAttribute("style", `height:${area.scrollHeight}px; overflow-y: hidden; resize: none`);
        area.oninput = () => {
            area.style.height = 0;
            area.style.height = area.scrollHeight + "px";
        };
    }

    const alert = document.getElementById("fact_warn_alert");

    function modalWarning(message) {
        alert.innerHTML = `
        <div class="alert alert-warning alert-dismissible" role="alert" >
            <div>${message}</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
        `;
    }

    const tagNames = new Set();
    const tagButtons = document.getElementById("tag_buttons");
    const tagInput = document.getElementById("fact_tags_input");
    const addTagButton = document.getElementById("button_add_tag");
    addTagButton.onclick = () => {
        const tagName = tagInput.value;
        if (isBlank(tagName) || tagNames.has(tagName)) {
            modalWarning("Cannot add tag if is blank or already exists");
            return;
        }
        tagNames.add(tagName);
        tagButtons.innerHTML += `<button class="btn btn-outline-primary m-1 disabled">${tagName}</button>`;
    };

    const factName = document.getElementById("fact_name_input");
    const factTitle = document.getElementById("fact_title_input");
    const factDescription = document.getElementById("fact_description_input");
    const factForm = document.getElementById("add_fact_form");

    const snippetNames = new Set();
    let snippetEntries = [];

    const snippetButtons = document.getElementById("snippet_buttons");

    const snippetName = document.getElementById("snippet_name_input");
    const snippetSource = document.getElementById("snippet_source_input");
    const snippetMappings = document.getElementById("snippet_mapping_select");
    const snippetVersion = document.getElementById("snippet_version_input");
    const snippetDescription = document.getElementById("snippet_description_input");
    const snippetLines = document.getElementById("snippet_input");
    const addSnippetButton = document.getElementById("add_snippet_button");
    addSnippetButton.onclick = () => {
        const name = snippetName.value;
        const source = snippetSource.value;
        const mappings = snippetMappings.value;
        const version = snippetVersion.value;
        const lines = snippetLines.value;
        const description = snippetDescription.value;

        if (snippetNames.has(name)) {
            modalWarning("Cannot add snippet if it's name already exists");
            return;
        }
        if (areAnyBlank(name, source, version, lines, description)) {
            modalWarning("Snippet Name, Source, Version, Snippet, and Description may not be blank");
            return;
        }
        snippetNames.add(name);

        const snippet = {
            name,
            fact: factName.value,
            mappings,
            source,
            version,
            snippet: lines.split("\n"),
            description
        };
        snippetEntries.push(snippet);
        snippetButtons.innerHTML += `<button class="btn btn-outline-primary m-1 disabled">${name}</button>`;
    };

    factForm.onsubmit = async event => {
        event.preventDefault();

        const name = factName.value;
        const title = factTitle.value;
        const description = factDescription.value;

        if (areAnyBlank(name, title, description)) {
            modalWarning("Fact Name, Title, and Description may not be blank");
            return;
        }

        const response = await addFact(name, title, description, [...tagNames], [...snippetEntries]);
        if (typeof response === "string") {
            modalWarning(response);
            return;
        }
        if (!response) {
            serverUnavailablePage();
            return;
        }

        factName.value = "";
        factTitle.value = "";
        factDescription.value = "";
        alert.innerHTML = "";
        tagInput.value = "";
        tagNames.clear();
        tagButtons.innerHTML = "";
        snippetNames.clear();
        snippetEntries = [];

        snippetName.value = "";
        snippetSource.value = "";
        snippetVersion.value = "";
        snippetDescription.value = "";
        snippetLines.value = "";
        snippetButtons.innerHTML = "";

        await reloadFacts();
        await reloadTags();
    };
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

    addFactModal();

    for (const toast of document.querySelectorAll(".toast")) {
        toasts.push(new bootstrap.Toast(toast));
    }
});
