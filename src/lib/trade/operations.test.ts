import { describe, expect, test } from "bun:test";
import { SERVICES, serviceReach } from "./services";
import { canTransition, dossierInput, readyToClose } from "./operations";

describe("Pi-aligned traditional trade operations", () => {
  test("every catalogue service can start a dossier at each supported reach", () => {
    expect(SERVICES.length).toBeGreaterThan(30);
    for (const service of SERVICES) for (const reach of serviceReach(service)) {
      expect(dossierInput.safeParse({ service_slug: service.slug, reach, title: "Trade operation", contract_id: null,
        provider: "", external_reference: "", origin_country: "", destination_country: "", quoted_pi: 0, due_date: null }).success).toBe(true);
    }
  });
  test("completion requires all tasks and document references", () => {
    expect(readyToClose([{ label: "Clearance", done: false }], [])).toBe(false);
    expect(readyToClose([{ label: "Clearance", done: true }], [{ label: "Release", reference: " " }])).toBe(false);
    expect(readyToClose([{ label: "Clearance", done: true }], [{ label: "Release", reference: "REF-123" }])).toBe(true);
    expect(readyToClose([], [])).toBe(false);
  });
  test("workflow cannot skip approval stages or change a closed dossier", () => {
    expect(canTransition("draft", "completed")).toBe(false);
    expect(canTransition("draft", "submitted")).toBe(true);
    expect(canTransition("submitted", "in_progress")).toBe(true);
    expect(canTransition("in_progress", "completed")).toBe(true);
    expect(canTransition("completed", "completed")).toBe(false);
    expect(canTransition("cancelled", "draft")).toBe(false);
  });
});