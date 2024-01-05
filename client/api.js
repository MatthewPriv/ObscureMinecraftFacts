export async function addFact(name, title, description, tags, snippets) {
    try {
        const factResponse = await fetch("http://127.0.0.1:8080/api/add_fact", {
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify({
                name,
                title,
                description,
                tags,
                snippets: snippets.map(snippet => snippet.name)
            })
        });
        if (!factResponse.ok) {
            return JSON.parse(await factResponse.text()).message;
        }
        for (const snippet of snippets) {
            const result = await addSnippet(snippet);
            if (result !== null) {
                return result;
            }
        }
    } catch (e) {
        return false;
    }
    return true;
}

async function addSnippet(snippet) {
    const response = await fetch("http://127.0.0.1:8080/api/add_snippet", {
        headers: {
            "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify(snippet)
    });
    if (!response.ok) {
        return JSON.parse(await response.text()).message;
    }
    return null;
}

export async function getTags() {
    try {
        const response = await fetch("http://127.0.0.1:8080/api/tags");
        return JSON.parse(await response.text());
    } catch (e) {
        return null;
    }
}

// eslint-disable-next-line space-before-function-paren
export async function getFacts(tags, search, randomize, limit) {
    let tagsParam = tags.map(tag => `tag=${tag}`).join("&");
    if (tagsParam !== "") {
        tagsParam = "&" + tagsParam;
    }
    let searchParam = "";
    if (typeof search === "string") {
        searchParam = "&search=" + encodeURI(search);
    }

    let factNames;
    try {
        const factNamesResponse = await fetch(`http://127.0.0.1:8080/api/facts?${tagsParam}${searchParam}`);
        factNames = JSON.parse(await factNamesResponse.text());
    } catch (e) {
        // Server is down
        return null;
    }

    if (randomize) {
        // In place shuffle
        shuffleArray(factNames);
    } else {
        // In place sort
        factNames.sort((a, b) => a.localeCompare(b));
    }
    if (limit > 0 && factNames.length > limit) {
        factNames = factNames.slice(0, limit);
    }

    const facts = [];
    for (const name of factNames) {
        try {
            const factResponse = await fetch(`http://127.0.0.1:8080/api/fact?name=${name}&embed_snippets=true`);
            const fact = JSON.parse(await factResponse.text());
            facts.push(fact);
        } catch (e) {
            console.error(`Failed to fetch fact '${name}'`);
        }
    }
    return facts;
}

// Array shuffle taken from: https://stackoverflow.com/a/12646864
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
