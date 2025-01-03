import * as _ from "lodash-es";
type RequestArtifact = {
  url: string;
  path: string;
  query: Record<string, string>;
  method: string;
  headers: Record<string, string>;
  body: any;
};

type Constraint = {
  field: keyof RequestArtifact;
  value: any;
};

interface RequestMatcher {
  (val: any): boolean;
}

export class RequestQuery {
  private _constraints: Constraint[] = [];
  get constraints() {
    return this._constraints as Readonly<Constraint[]>;
  }
  to(to: string) {
    this._constraints.push({ field: "url", value: to });
    return this;
  }
  path(p: string) {
    this._constraints.push({ field: "path", value: p });
    return this;
  }

  query(params: Record<string, string>) {
    this._constraints.push({ field: "query", value: params });
    return this;
  }

  body(b: any) {
    this._constraints.push({ field: "body", value: b });
    return this;
  }

  method(m: string) {
    this._constraints.push({ field: "method", value: m });
    return this;
  }

  headers(h: Record<string, string>) {
    this._constraints.push({ field: "headers", value: h });
    return this;
  }
}

/**
 * this thing needs love. the request capture and the querying
 * should separate. for some crazy reason
 * we are putting constraints together from multiple different sources
 * we should be able to build 2 queries on the collector
 *
 */
export class HttpCollector {
  private requests: RequestArtifact[] = [];

  getRequest(requestQuery: RequestQuery): RequestArtifact {
    const filtered = this.requests.filter((request) => {
      return requestQuery.constraints.every((constraint) => {
        if (constraint.field === "url") {
          return request.url.startsWith(constraint.value);
        }
        return request[constraint.field] === constraint.value;
      });
    });

    if (filtered.length === 0) {
      console.warn(requestQuery.constraints, this.requests);
      throw new Error("No matching request found for");
    }
    if (filtered.length > 1) {
      throw new Error("Multiple matching requests found");
    }
    return filtered[0];
  }

  capture(req: RequestArtifact) {
    this.requests.push(req);
  }

  clear() {
    this.requests = [];
  }
}
