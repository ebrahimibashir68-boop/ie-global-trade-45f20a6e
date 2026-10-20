import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { SERVICES, serviceReach } from "./services";
import { canTransition, dossierInput, readyToClose } from "./operations";

describe("Pi-aligned traditional trade operations", () => {
  test("every catalogue service can start a dossier at each supported reach", () => {
    assert.ok(SERVICES.length > 30);
    for (const service of SERVICES) for (const reach of serviceReach(service)) {
      assert.equal(dossierInput.safeParse({ service_slug: service.slug, reach, title: "Trade operation", contract_id: null,
        provider: "", external_reference: "", origin_country: "", destination_country: "", quoted_pi: 0, due_date: null }).success, true);
    }
  });
  test("completion requires all tasks and document references", () => {
    assert.equal(readyToClose([{ label: "Clearance", done: false }], []), false);
    assert.equal(readyToClose([{ label: "Clearance", done: true }], [{ label: "Release", reference: " " }]), false);
    assert.equal(readyToClose([{ label: "Clearance", done: true }], [{ label: "Release", reference: "REF-123" }]), true);
    assert.equal(readyToClose([], []), false);
  });
  test("workflow cannot skip approval stages or change a closed dossier", () => {
    assert.equal(canTransition("draft", "completed"), false);
    assert.equal(canTransition("draft", "submitted"), true);
    assert.equal(canTransition("submitted", "in_progress"), true);
    assert.equal(canTransition("in_progress", "completed"), true);
    assert.equal(canTransition("completed", "completed"), false);
    assert.equal(canTransition("cancelled", "draft"), false);
  });
});