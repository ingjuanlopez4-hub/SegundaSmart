import assert from "node:assert/strict";
import { test } from "node:test";
import { createConfig } from "./config.mjs";

test("rechaza orígenes inseguros, credenciales y rutas que amplían el destino", () => {
  for (const value of [undefined, "", "not-a-url", "http://example.test", "file:///tmp/index.html", "javascript:alert(1)", "https://user:secret@example.test", "https://example.test/app", "https://example.test?token=private", "https://example.test/#fragment"]) {
    assert.throws(() => createConfig(value));
  }
});

test("mantiene sesión web same-origin sin interceptar cookies ni peticiones", () => {
  const config = createConfig("https://qa.example.test:8443/");
  assert.equal(config.server.url, "https://qa.example.test:8443");
  assert.equal(config.server.appStartPath, "/login");
  assert.deepEqual(config.server.allowNavigation, []);
  assert.equal(config.server.cleartext, false);
  assert.equal(config.android.allowMixedContent, false);
  assert.equal(config.android.useLegacyBridge, false);
  assert.deepEqual(config.includePlugins, []);
  assert.equal(config.plugins.CapacitorCookies.enabled, false);
  assert.equal(config.plugins.CapacitorHttp.enabled, false);
  assert.equal(config.loggingBehavior, "none");
});
