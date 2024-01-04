import hljs from "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/es/highlight.min.js";
import java from "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/es/languages/java.min.js";

hljs.registerLanguage('java', java);

export function tagToButton(tag) {
    return `<button type="button" class="btn btn-outline-primary btn-sm m-1">${tag}</button>`;
}

export function factToCard(fact) {
    return `<div class="card p-2 m-4 semi-transparent-white-background">
        <div class="card-body">
            <h3 class="card-title">${fact.title}</h3>
            <p class="card-text">${fact.description}</p>
            ${snippetsToCard(fact.snippets)}
        </div>
    </div>`;
}

function snippetsToCard(snippets) {
    return snippets.reduce((previous, data) => previous + snippetToCard(data), "");
}

function snippetToCard(snippet) {
    const tooltip = "Minecraft Version: " + snippet.version + " Mappings: " + snippet.mappings;
    return `
    <p class="card-title">Snippet below taken from <code data-bs-toggle="tooltip" title="${tooltip}">${snippet.source}</code>:</p>
    <div class="card p-1 very-transparent-while-background">
        <pre class="m-0"><code>${hljs.highlight(snippet.snippet.join("\n"), { language: "java" }).value}</code></pre>
    </div>
    <p class="card-text">${snippet.description}</p>
    `;
}
