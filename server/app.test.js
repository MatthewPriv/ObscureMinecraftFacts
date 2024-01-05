// noinspection JSUnresolvedReference, ES6RedundantAwait

const request = require('supertest');
const { app, facts } = require('./app');

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
