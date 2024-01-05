const express = require("express");
const cors = require("cors");
const fs = require("node:fs");
const bodyParser = require("body-parser");
const { join } = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const facts = new Map();
const snippets = new Map();
const factTags = new Set();

// We cache all the fact names to their snippets,
// so we don't need to do this on the fly...
const factsToSnippets = new Map();

{
    const data = fs.readFileSync(join(__dirname, "assets", "facts.json"), "utf-8");
    const json = JSON.parse(data);

    for (const fact of json.facts) {
        addFact(fact);
    }
    for (const snippet of json.snippets) {
        addSnippet(snippet);
    }
}

function addFact(fact) {
    for (const tag of fact.tags) {
        factTags.add(tag);
    }
    const factName = fact.name;
    facts.set(factName, fact);
}

function addSnippet(snippet) {
    snippets.set(snippet.name, snippet);
    const factSnippets = factsToSnippets.get(snippet.fact) ?? [];
    factSnippets.push(snippet);
    factsToSnippets.set(snippet.fact, factSnippets);
}

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

function checkFactValid(fact) {
    if (typeof fact.name !== "string") {
        return "Fact must have a name property";
    }
    if (facts.has(fact.name)) {
        return "Cannot add fact that already exists";
    }
    if (typeof fact.title !== "string") {
        return "Fact must have a title property";
    }
    if (typeof fact.description !== "string") {
        return "Fact must have a description property";
    }
    if (!Array.isArray(fact.tags)) {
        return "Fact must have an array of tags";
    }
    if (fact.tags.some(tag => typeof tag !== "string")) {
        return "Fact tags must be strings";
    }
    if (!Array.isArray(fact.snippets)) {
        return "Fact must have an array of snippets";
    }
    if (fact.snippets.some(snippet => typeof snippet !== "string")) {
        return "Fact snippets must be strings";
    }
    return null;
}

function checkSnippetValid(snippet) {
    if (typeof snippet.name !== "string") {
        return "Snippet must have name property";
    }
    if (snippets.has(snippet.name)) {
        return "Cannot add snippet that already exists";
    }
    if (typeof snippet.fact !== "string") {
        return "Snippet must have fact property";
    }
    if (typeof snippet.mappings !== "string") {
        return "Snippet must have mappings property";
    }
    if (typeof snippet.source !== "string") {
        return "Snippet must have source property";
    }
    if (typeof snippet.version !== "string") {
        return "Snippet must have a version property";
    }
    if (typeof snippet.description !== "string") {
        return "Snippet must have a description property";
    }
    const lines = snippet.snippet;
    if (!Array.isArray(lines)) {
        return "Snippet must have an array of snippet lines";
    }
    if (lines.some(tag => typeof tag !== "string")) {
        return "Snippet lines must be strings";
    }
    return null;
}

app.get("/api/tags", (req, res) => {
    res.status(200).send([...factTags]);
});

// Handler for singular fact by name
app.get("/api/fact", (req, res) => {
    // Name of the fact to get
    const name = req.query.name;
    // Whether snippets should be included or just include their name
    const embedSnippets = req.query.embed_snippets;
    if (!name) {
        // Invalid body - Bad Request 400
        res.status(400).send({ message: "Request must include name parameter" });
        return;
    }

    const fact = facts.get(name);
    if (fact) {
        res.status(200).send(embedSnippets === "true" ? embedSnippetsInFact(fact) : fact);
        return;
    }
    res.status(400).send({ message: "Fact doesn't exist" });
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

    res.status(200).send(result.map(fact => fact.name));
});

// Handler for getting a specific snippet by name
app.get("/api/fact_snippet", (req, res) => {
    const snippetName = req.query.name;
    if (!snippetName) {
        // Invalid body - Bad Request 400
        res.status(400).send({ message: "Request must include name parameter" });
        return;
    }

    const snippet = snippets.get(snippetName);
    if (snippet) {
        res.status(200).send(snippet);
        return;
    }
    res.status(400).send({ message: "Snippet doesn't exist" });
});

// Post handler for clients adding facts
app.post("/api/add_fact", (req, res) => {
    const fact = req.body;
    // Check that the fact contains all the correct data
    const error = checkFactValid(fact);
    if (error !== null) {
        res.status(400).send({ message: error });
        return;
    }

    addFact(fact);
    res.status(201).send();
});

// Post handler for clients adding snippets
app.post("/api/add_snippet", (req, res) => {
    const snippet = req.body;
    // Check that the snippet contains all the correct data
    const error = checkSnippetValid(snippet);
    if (error !== null) {
        res.status(400).send({ message: error });
        return;
    }

    addSnippet(snippet);
    res.status(201).send();
});

app.use(express.static("client"));

module.exports = { app, facts, snippets };
