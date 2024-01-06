// noinspection JSUnresolvedReference, ES6RedundantAwait

const request = require('supertest');
const {
    app,
    facts,
    snippets,
    factsToSnippets
} = require('./app');

function expectJson(response) {
    expect(response.headers["content-type"]).toMatch(/json/);
}

function expectStatusCode(response, code) {
    expect(response.statusCode).toBe(code);
}

function expectBody(response, body) {
    expect(response.body).toStrictEqual(body);
}

describe("Test GET /api/tags", () => {
    test("returns list of tags", async () => {
        const response = await request(app).get("/api/tags");
        expectJson(response);
        expectStatusCode(response, 200);
    });
});

describe("Test GET /api/fact", () => {
    test("returns correct fact json", async () => {
        const response = await request(app).get("/api/fact?name=explosive_furnace_minecarts");
        expectJson(response);
        expectStatusCode(response, 200);
        expectBody(response, facts.get("explosive_furnace_minecarts"));
    });

    test("returns correct fact with snippet json", async () => {
        const response = await request(app).get("/api/fact?name=explosive_furnace_minecarts&embed_snippets=true");
        expectJson(response);
        expectStatusCode(response, 200);
        expect(response.body.snippets).toStrictEqual(factsToSnippets.get("explosive_furnace_minecarts"));
    });

    test("fails with no name parameter", async () => {
        const response = await request(app).get("/api/fact");
        expectJson(response);
        expectStatusCode(response, 400);
    });

    test("fails with non-existent fact", async () => {
        const response = await request(app).get("/api/fact?name=123456789");
        expectJson(response);
        expectStatusCode(response, 400);
    });
});

describe("Test GET /api/facts", () => {
    test("returns array of all facts names", async () => {
        const response = await request(app).get("/api/facts");
        expectJson(response);
        expectStatusCode(response, 200);
        expectBody(response, [...facts.values()].map(fact => fact.name));
    });

    test("returns array of all fact names with tag filter", async () => {
        const response = await request(app).get("/api/facts?tag=biome");
        expectJson(response);
        expectStatusCode(response, 200);
        expectBody(response, [...facts.values()].filter(fact => fact.tags.includes("biome")).map(fact => fact.name));
    });

    test("returns array of all fact names with search filter", async () => {
        const response = await request(app).get("/api/facts?search=furnace");
        expectJson(response);
        expectStatusCode(response, 200);
        expectBody(response, [...facts.values()].filter(fact => {
            const title = fact.title.toLowerCase();
            const description = fact.description.toLowerCase();
            return title.includes("furnace") || description.includes("furnace");
        }).map(fact => fact.name));
    });
});

describe("Test GET /api/fact_snippet", () => {
    test("returns correct snippet json", async () => {
        const response = await request(app).get("/api/fact_snippet?name=minecart_furnace_destroy");
        expectJson(response);
        expectStatusCode(response, 200);
        expectBody(response, snippets.get("minecart_furnace_destroy"));
    });

    test("fails with non-existent snippet", async () => {
        const response = await request(app).get("/api/fact_snippet?name=123456789");
        expectJson(response);
        expectStatusCode(response, 400);
    });

    test("fails with no name parameter", async () => {
        const response = await request(app).get("/api/fact_snippet?");
        expectJson(response);
        expectStatusCode(response, 400);
    });
});

describe("Test POST /api/add_fact", () => {
    const fact = {
        name: "testing_fact",
        title: "Testing Fact",
        description: "Testing description...",
        tags: [],
        snippets: []
    };
    const emptyFact = {};

    test("adds fact to server", async () => {
        const response = await request(app).post("/api/add_fact").send(fact);
        expectJson(response);
        expectStatusCode(response, 201);

        const next = await request(app).get(response.headers.location);
        expectJson(next);
        expectStatusCode(next, 200);
        expectBody(next, fact);
    });

    test("fails to add duplicate fact", async () => {
        await request(app).post("/api/add_fact").send(fact);
        const response = await request(app).post("/api/add_fact").send(fact);
        expectJson(response);
        expectStatusCode(response, 400);
    });

    test("fails to add empty fact", async () => {
        const response = await request(app).post("/api/add_fact").send(emptyFact);
        expectJson(response);
        expectStatusCode(response, 400);
    });

    test("fails to add fact with invalid properties", async () => {
         for (const key in fact) {
             const clone = { ...fact };
             delete clone[key];
             const response = await request(app).post("/api/add_fact").send(clone);
             expectJson(response);
             expectStatusCode(response, 400);
         }
    });
});

describe("Test POST /api/add_snippet", () => {
    const snippet = {
        name: "testing_snippet",
        fact: "testing_fact",
        mappings: "Testing",
        source: "net.testing.source",
        version: "1.0.0",
        snippet: [
            "public static void main(String[] args) {",
            "",
            "}"
        ],
        description: "Testing description..."
    };
    const emptySnippet = {};

    test("adds snippet to server", async () => {
        const response = await request(app).post("/api/add_snippet").send(snippet);
        expectJson(response);
        expectStatusCode(response, 201);

        const next = await request(app).get(response.headers.location);
        expectJson(next);
        expectStatusCode(next, 200);
        expectBody(next, snippet);
    });

    test("fails to add duplicate snippet", async () => {
        await request(app).post("/api/add_snippet").send(snippet);
        const response = await request(app).post("/api/add_snippet").send(snippet);
        expectJson(response);
        expectStatusCode(response, 400);
    });

    test("fails to add empty snippet", async () => {
        const response = await request(app).post("/api/add_snippet").send(emptySnippet);
        expectJson(response);
        expectStatusCode(response, 400);
    });

    test("fails to add snippet with invalid properties", async () => {
        for (const key in snippet) {
            const clone = { ...snippet };
            delete clone[key];
            const response = await request(app).post("/api/add_snippet").send(clone);
            expectJson(response);
            expectStatusCode(response, 400);
        }
    });
});
