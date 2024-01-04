const express = require("express");
const fs = require("node:fs");
const { join } = require("path");

const app = express();

let version;
const facts = new Map();
const snippets = new Map();
const factTags = [];

// We cache all the fact names to their snippets,
// so we don't need to do this on the fly...
const factsToSnippets = new Map();
fs.readFile(join(__dirname, "assets", "facts.json"), "utf-8", (error, data) => {
    if (error) {
        console.error(error);
        throw error;
    }
    const json = JSON.parse(data);
    version = json.version;

    for (const snippet of json.snippets) {
        snippets.set(snippet.name, snippet);
    }

    const tags = new Set();
    for (const fact of json.facts) {
        for (const tag of fact.tags) {
            tags.add(tag);
        }
        const factName = fact.name;
        facts.set(factName, fact);
        const factSnippets = [];
        for (const snippetName of fact.snippets) {
            const snippet = snippets[snippetName];
            if (snippet) {
                factSnippets.push(snippet);
            }
        }
        factsToSnippets.set(factName, factSnippets);
    }
    factTags.push(...tags);
});

function embedSnippetsInFact(fact) {
    const clone = { ...fact };
    const snippetNames = [...clone.snippets];
    const embeddedSnippets = [];
    for (const snippetName of snippetNames) {
        const snippet = snippets.get(snippetName);
        if (snippet) {
            embeddedSnippets.push(snippet);
        }
    }
    clone.snippets = embeddedSnippets;
    return clone;
}

app.get("/api/version", (req, res) => {
    res.send(version);
});

app.get("/api/tags", (req, res) => {
    res.send(factTags);
});

// Handler for singular fact by name
app.get("/api/fact", (req, res) => {
    // Name of the fact to get
    const name = req.query.name;
    // Whether snippets should be included or just include their name
    const embedSnippets = req.query.embed_snippets;
    if (!name) {
        // Invalid body - Bad Request 400
        res.status(400).send({ message: "Invalid request body, must include 'name'" });
        return;
    }

    const fact = facts.get(name);
    if (fact) {
        res.send(embedSnippets === "true" ? embedSnippetsInFact(fact) : fact);
        return;
    }
    res.status(400).send({ message: `Invalid request body, fact with name '${name}' doesn't exist` });
});

// Handler for multiple facts optionally filtered by tags and/or a string search
app.get("/api/facts", (req, res) => {
    // Tags to filter by
    const tags = req.query.tag;
    // String to filter by
    const search = req.query.search;
    let result = [...facts.values()];
    if (tags) {
        if (Array.isArray(tags) && tags.length !== 0) {
            result = result.filter(fact => fact.tags.some(tag => tags.includes(tag)));
        } else if (typeof tags === "string") {
            result = result.filter(fact => fact.tags.includes(tags));
        }
    }
    if (typeof search === "string") {
        const lowerSearch = decodeURI(search).toLowerCase();
        result = result.filter(fact => {
            const title = fact.title.toLowerCase();
            const description = fact.description.toLowerCase();
            return title.includes(lowerSearch) || description.includes(lowerSearch);
        });
    }

    res.send(result.map(fact => fact.name));
});

// Handler for getting a specific snippet by name
app.get("/api/fact_snippet", (req, res) => {
    const snippetName = req.query.name;
    if (!snippetName) {
        // Invalid body - Bad Request 400
        res.status(400).send({ message: "Invalid request body, must include 'name'" });
        return;
    }

    const snippet = snippets.get(snippetName);
    if (snippet) {
        res.send(snippet);
        return;
    }
    res.status(400).send({ message: `Invalid request body, snippet with name '${snippetName}' doesn't exist` });
});

// Handler for getting all the snippets for a given fact
app.get("/api/fact_snippets", (req, res) => {
    const factName = req.query.name;
    if (!factName) {
        // Invalid body - Bad Request 400
        res.status(400).send({ message: "Invalid request body, must include 'name'" });
        return;
    }

    const snippets = factsToSnippets.get(factName);
    if (!snippets) {
        res.status(400).send({ message: `Invalid request body, fact with name '${factName}' doesn't exist` });
        return;
    }
    res.send(snippets);
});

app.use(express.static("client"));

app.listen(8080);
