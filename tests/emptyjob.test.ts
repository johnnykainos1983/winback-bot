import { describe, expect, it } from "vitest";
import { TEMPLATES, buildMessage, fillTemplate } from "@/lib/templates";

const v = { name: "Thabo", job: "", business: "Sipho Plumbing", bookingLink: "x.co" };

describe("empty job wording", () => {
  it.each(TEMPLATES.map((t) => [t.id, t.body] as const))("template %s has a job-free variant", (_id, body) => {
    const t = TEMPLATES.find((x) => x.body === body)!;
    expect(t.noJobBody).not.toContain("{job}");
    const out = fillTemplate(body, v);
    expect(out).not.toMatch(/last job|\{job\}/i);
    expect(out).toContain("Thabo");
    expect(out).toContain("Sipho Plumbing");
    expect(out).toContain("x.co");
  });
  it("whitespace-only job counts as empty", () => {
    expect(fillTemplate(TEMPLATES[0].body, { ...v, job: "   " })).not.toContain("your ");
  });
  it("keeps the job wording when a job is present", () => {
    expect(fillTemplate(TEMPLATES[0].body, { ...v, job: "geyser repair" })).toContain("since your geyser repair");
  });
  it("custom text with {job} gets neutral wording instead of 'last job'", () => {
    const out = fillTemplate("Thanks for your {job}!", v);
    expect(out).toBe("Thanks for your recent visit!");
    expect(out).not.toContain("last job");
  });
  it("buildMessage still appends the opt-out line", () => {
    expect(buildMessage(TEMPLATES[1].body, v)).toMatch(/Reply STOP to opt out$/);
  });
});
