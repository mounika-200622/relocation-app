import { describe, expect, it } from "vitest";
import { cleanForEmbedding, cosine } from "@/lib/vector/embed";
import { similarityPipeline } from "@/lib/vector/store";
import { ipv4Loopback, mysqlUrl } from "@/lib/db-url";

/** Evaluates the $reduce/$zip dot product the same way MongoDB does, for one document. */
function runScore(pipeline: ReturnType<typeof similarityPipeline>, embedding: number[]) {
  const project = pipeline[1] as unknown as { $project: { score: { $reduce: { input: { $zip: { inputs: [string, { $literal: number[] }] } } } } } };
  const query = project.$project.score.$reduce.input.$zip.inputs[1].$literal;
  return embedding.reduce((sum, v, i) => sum + v * query[i]!, 0);
}

const unit = (v: number[]) => {
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
};

describe("vector similarity", () => {
  it("cosine is 1 for identical, 0 for orthogonal and -1 for opposite vectors", () => {
    expect(cosine([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0);
    expect(cosine([1, 1], [-1, -1])).toBeCloseTo(-1);
    expect(cosine([0, 0], [1, 1])).toBe(0);
  });

  it("the Mongo pipeline's dot product equals cosine for normalised vectors", () => {
    const q = unit([0.2, 0.9, -0.3, 0.1]);
    const d = unit([0.1, 0.8, -0.1, 0.4]);
    const pipeline = similarityPipeline(q, { kind: "guide" });
    expect(runScore(pipeline, d)).toBeCloseTo(cosine(q, d), 10);
  });

  it("filters on metadata first, then thresholds, sorts by score and limits", () => {
    const p = similarityPipeline([1, 0], { kind: "listing", cityId: 7 }, { limit: 5, minScore: 0.4 });
    expect(p[0]).toEqual({ $match: { kind: "listing", cityId: 7 } });
    expect(p[2]).toEqual({ $match: { score: { $gte: 0.4 } } });
    expect(p[3]).toEqual({ $sort: { score: -1 } });
    expect(p[4]).toEqual({ $limit: 5 });
  });

  it("cleans markdown and whitespace before embedding", () => {
    expect(cleanForEmbedding("## SIM *cards*\n\n- [Jio](https://jio.com)  plans")).toBe("SIM cards - Jio https://jio.com plans");
    expect(cleanForEmbedding("x".repeat(50), 10)).toHaveLength(10);
  });
});

describe("ipv4Loopback", () => {
  it("pins localhost to 127.0.0.1 for MySQL and MongoDB urls", () => {
    expect(ipv4Loopback("mysql://u:p@localhost:3306/nira")).toBe("mysql://u:p@127.0.0.1:3306/nira");
    expect(ipv4Loopback("mongodb://localhost:27017")).toBe("mongodb://127.0.0.1:27017");
    expect(ipv4Loopback("mongodb://localhost")).toBe("mongodb://127.0.0.1");
  });

  it("leaves other hosts alone", () => {
    expect(ipv4Loopback("mysql://u:p@db.example.com:3306/nira")).toBe("mysql://u:p@db.example.com:3306/nira");
    expect(ipv4Loopback("mysql://u:p@localhost.example.com/nira")).toBe("mysql://u:p@localhost.example.com/nira");
    expect(ipv4Loopback(undefined)).toBeUndefined();
  });
});

describe("mysqlUrl", () => {
  it("adds longer connect and pool timeouts unless the URL sets them", () => {
    expect(mysqlUrl("mysql://u:p@localhost:3306/nira")).toBe("mysql://u:p@127.0.0.1:3306/nira?connect_timeout=30&pool_timeout=30");
    expect(mysqlUrl("mysql://u:p@db:3306/nira?connect_timeout=5")).toBe("mysql://u:p@db:3306/nira?connect_timeout=5&pool_timeout=30");
  });

  it("leaves non-MySQL and missing URLs alone", () => {
    expect(mysqlUrl("mongodb://localhost:27017")).toBe("mongodb://127.0.0.1:27017");
    expect(mysqlUrl(undefined)).toBeUndefined();
  });
});
