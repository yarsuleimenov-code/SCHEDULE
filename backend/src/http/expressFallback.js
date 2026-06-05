const http = require("http");
const { URL } = require("url");

function compilePath(pathPattern) {
  const keys = [];
  const pattern = pathPattern
    .split("/")
    .map((part) => {
      if (part.startsWith(":")) {
        keys.push(part.slice(1));
        return "([^/]+)";
      }
      return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");
  return { regex: new RegExp(`^${pattern}$`), keys };
}

function enhanceResponse(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    const body = JSON.stringify(payload);
    res.setHeader("content-type", "application/json");
    res.end(body);
  };
  return res;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function createRouter() {
  const routes = [];
  const middlewares = [];
  const errorMiddlewares = [];

  function add(method, path, handler) {
    routes.push({ method, path, compiled: compilePath(path), handler });
  }

  async function handle(req, res, basePath = "") {
    const parsed = new URL(req.url, "http://localhost");
    req.query = Object.fromEntries(parsed.searchParams.entries());
    const previousPath = req.path;
    const currentPath = parsed.pathname.slice(basePath.length) || "/";
    req.path = currentPath;
    req.body = req.body || await readBody(req);
    enhanceResponse(res);

    try {
      for (const middleware of middlewares) {
        if (middleware.path && !parsed.pathname.startsWith(middleware.path)) continue;
        if (middleware.router) {
          const handled = await middleware.router.handle(req, res, middleware.path);
          if (handled) return true;
          continue;
        }
        await new Promise((resolve, reject) => middleware.handler(req, res, (error) => error ? reject(error) : resolve()));
        if (res.writableEnded) return true;
      }

      for (const route of routes) {
        if (route.method !== req.method) continue;
        const match = route.compiled.regex.exec(currentPath);
        if (!match) continue;
        req.params = {};
        route.compiled.keys.forEach((key, index) => {
          req.params[key] = decodeURIComponent(match[index + 1]);
        });
        await route.handler(req, res);
        return true;
      }
      return false;
    } catch (error) {
      if (errorMiddlewares.length) {
        errorMiddlewares[0](error, req, res, () => {});
        return true;
      }
      throw error;
    } finally {
      req.path = previousPath;
    }
  }

  return {
    routes,
    middlewares,
    errorMiddlewares,
    get: (path, handler) => add("GET", path, handler),
    post: (path, handler) => add("POST", path, handler),
    patch: (path, handler) => add("PATCH", path, handler),
    use(pathOrHandler, maybeRouter) {
      if (typeof pathOrHandler === "function" && pathOrHandler.length === 4) {
        errorMiddlewares.push(pathOrHandler);
        return;
      }
      if (typeof pathOrHandler === "function") {
        middlewares.push({ handler: pathOrHandler });
        return;
      }
      if (maybeRouter && maybeRouter.handle) {
        middlewares.push({ path: pathOrHandler, router: maybeRouter });
      }
    },
    async handle(req, res, basePath) {
      return handle(req, res, basePath);
    }
  };
}

function express() {
  const router = createRouter();
  router.listen = (port, callback) => {
    const server = http.createServer(async (req, res) => {
      try {
        const handled = await router.handle(req, res, "");
        if (!handled && !res.writableEnded) {
          enhanceResponse(res).status(404).json({ error: { code: "NOT_FOUND", message: "Not found" } });
        }
      } catch (error) {
        if (!res.writableEnded) {
          enhanceResponse(res).status(500).json({ error: { code: "INTERNAL_ERROR", message: error.message } });
        }
      }
    });
    return server.listen(port, callback);
  };
  return router;
}

express.Router = createRouter;
express.json = () => (req, res, next) => next();

module.exports = express;
