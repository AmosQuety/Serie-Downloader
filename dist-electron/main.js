var Vy = Object.defineProperty;
var Ud = (e) => {
  throw TypeError(e);
};
var By = (e, t, r) => t in e ? Vy(e, t, { enumerable: !0, configurable: !0, writable: !0, value: r }) : e[t] = r;
var ee = (e, t, r) => By(e, typeof t != "symbol" ? t + "" : t, r), Fd = (e, t, r) => t.has(e) || Ud("Cannot " + r);
var Ae = (e, t, r) => (Fd(e, t, "read from private field"), r ? r.call(e) : t.get(e)), bs = (e, t, r) => t.has(e) ? Ud("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, r), Ss = (e, t, r, n) => (Fd(e, t, "write to private field"), n ? n.call(e, r) : t.set(e, r), r);
import vr, { app as wn, BrowserWindow as wp, Menu as Ep, ipcMain as Ve, dialog as Ld } from "electron";
import { createRequire as Hy } from "node:module";
import { fileURLToPath as zy } from "node:url";
import fe from "node:path";
import Gt from "fs";
import Me from "axios";
import Gy from "https";
import Ma, { Transform as Ky } from "stream";
import st from "path";
import Sr from "fs-extra";
import Ro from "sanitize-filename";
import je from "node:process";
import { promisify as Qe, isDeepStrictEqual as Wy } from "node:util";
import le from "node:fs";
import Ts from "node:crypto";
import Yy from "node:assert";
import xa from "node:os";
import * as sr from "cheerio";
import { chromium as Xy } from "playwright";
import qa, { spawn as jd } from "child_process";
import bp from "events";
import ui from "crypto";
import Sp from "tty";
import Jy from "util";
import Va from "os";
import Jr from "url";
import Qy from "string_decoder";
import Tp from "zlib";
import Zy from "http";
class e$ {
  // 0 = unlimited, in bytes per second
  constructor() {
    ee(this, "MAX_RETRIES", 3);
    ee(this, "INITIAL_RETRY_DELAY", 2e3);
    ee(this, "CONCURRENCY_LIMIT", 3);
    ee(this, "queue", []);
    ee(this, "activeCount", 0);
    ee(this, "activeTasks", /* @__PURE__ */ new Map());
    ee(this, "maxSpeed", 0);
  }
  /**
   * Set the maximum download speed in bytes per second
   */
  setMaxSpeed(t) {
    this.maxSpeed = t;
  }
  async downloadFile(t, r, n) {
    return new Promise((s, i) => {
      const a = new AbortController(), o = { url: t, savePath: r, onProgress: n, resolve: s, reject: i, abortController: a };
      this.queue.push(o), this.processQueue();
    });
  }
  /**
   * Pause/Cancel a download by URL
   */
  async stopDownload(t) {
    const r = this.activeTasks.get(t);
    if (r)
      return r.abortController.abort(), this.activeTasks.delete(t), !0;
    const n = this.queue.findIndex((s) => s.url === t);
    if (n !== -1) {
      const [s] = this.queue.splice(n, 1);
      return s.reject(new Error("Download cancelled by user")), !0;
    }
    return !1;
  }
  async processQueue() {
    if (this.activeCount >= this.CONCURRENCY_LIMIT || this.queue.length === 0)
      return;
    const t = this.queue.shift();
    this.activeCount++, this.activeTasks.set(t.url, t);
    try {
      await this.downloadWithRetry(t.url, t.savePath, t.abortController.signal, t.onProgress), t.resolve();
    } catch (r) {
      r.name === "AbortError" ? t.reject(new Error("Paused")) : t.reject(r);
    } finally {
      this.activeCount--, this.activeTasks.delete(t.url), this.processQueue();
    }
  }
  async downloadWithRetry(t, r, n, s) {
    let i;
    for (let a = 1; a <= this.MAX_RETRIES; a++) {
      if (n.aborted) throw new Error("AbortError");
      try {
        await this.executeDownload(t, r, n, s);
        return;
      } catch (o) {
        if (i = o, o.name === "AbortError" || o.message === "Paused")
          throw o;
        if (a < this.MAX_RETRIES) {
          const l = this.INITIAL_RETRY_DELAY * Math.pow(2, a - 1);
          await new Promise((c) => setTimeout(c, l));
        }
      }
    }
    throw i;
  }
  async executeDownload(t, r, n, s) {
    const i = Gt.createWriteStream(r), a = process.env.NODE_ENV === "development" ? new Gy.Agent({ rejectUnauthorized: !1 }) : void 0, o = await Me({
      url: t,
      method: "GET",
      responseType: "stream",
      httpsAgent: a,
      timeout: 6e4,
      signal: n
      // Pass the abort signal to axios
    }), l = parseInt(o.headers["content-length"] || "0", 10);
    let c = 0;
    const u = new Ky({
      transform: (d, p, m) => {
        if (n.aborted) {
          m(new Error("AbortError"));
          return;
        }
        if (c += d.length, s && l > 0 && s(Math.round(c / l * 100)), this.maxSpeed > 0) {
          const _ = d.length / this.maxSpeed * 1e3;
          setTimeout(() => m(null, d), _);
        } else
          m(null, d);
      }
    });
    return new Promise((d, p) => {
      const m = (_) => {
        i.close(), _.name === "AbortError" || _.message === "AbortError" ? p({ name: "AbortError" }) : (Gt.unlink(r, () => {
        }), p(_));
      };
      o.data.pipe(u).pipe(i), i.on("finish", () => {
        i.close(), d();
      }), i.on("error", m), o.data.on("error", m), u.on("error", m), n.addEventListener("abort", () => {
        o.data.destroy(), i.destroy(), m({ name: "AbortError" });
      });
    });
  }
}
function t$(e, t, r = ".mp4") {
  const n = Ro(t.seriesTitle);
  let s = st.join(e, n);
  if (t.season !== void 0) {
    const a = `Season ${t.season.toString().padStart(2, "0")}`;
    s = st.join(s, a);
  }
  Sr.ensureDirSync(s);
  let i = n;
  return t.season !== void 0 && t.episode !== void 0 ? (i += ` S${t.season.toString().padStart(2, "0")}E${t.episode.toString().padStart(2, "0")}`, t.episodeTitle && (i += ` - ${Ro(t.episodeTitle)}`)) : i += ` - ${Ro(t.episodeTitle || "Full")}`, st.join(s, `${i}${r}`);
}
const En = (e) => {
  const t = typeof e;
  return e !== null && (t === "object" || t === "function");
}, No = /* @__PURE__ */ new Set([
  "__proto__",
  "prototype",
  "constructor"
]), r$ = new Set("0123456789");
function Ba(e) {
  const t = [];
  let r = "", n = "start", s = !1;
  for (const i of e)
    switch (i) {
      case "\\": {
        if (n === "index")
          throw new Error("Invalid character in an index");
        if (n === "indexEnd")
          throw new Error("Invalid character after an index");
        s && (r += i), n = "property", s = !s;
        break;
      }
      case ".": {
        if (n === "index")
          throw new Error("Invalid character in an index");
        if (n === "indexEnd") {
          n = "property";
          break;
        }
        if (s) {
          s = !1, r += i;
          break;
        }
        if (No.has(r))
          return [];
        t.push(r), r = "", n = "property";
        break;
      }
      case "[": {
        if (n === "index")
          throw new Error("Invalid character in an index");
        if (n === "indexEnd") {
          n = "index";
          break;
        }
        if (s) {
          s = !1, r += i;
          break;
        }
        if (n === "property") {
          if (No.has(r))
            return [];
          t.push(r), r = "";
        }
        n = "index";
        break;
      }
      case "]": {
        if (n === "index") {
          t.push(Number.parseInt(r, 10)), r = "", n = "indexEnd";
          break;
        }
        if (n === "indexEnd")
          throw new Error("Invalid character after an index");
      }
      default: {
        if (n === "index" && !r$.has(i))
          throw new Error("Invalid character in an index");
        if (n === "indexEnd")
          throw new Error("Invalid character after an index");
        n === "start" && (n = "property"), s && (s = !1, r += "\\"), r += i;
      }
    }
  switch (s && (r += "\\"), n) {
    case "property": {
      if (No.has(r))
        return [];
      t.push(r);
      break;
    }
    case "index":
      throw new Error("Index was not closed");
    case "start": {
      t.push("");
      break;
    }
  }
  return t;
}
function ec(e, t) {
  if (typeof t != "number" && Array.isArray(e)) {
    const r = Number.parseInt(t, 10);
    return Number.isInteger(r) && e[r] === e[t];
  }
  return !1;
}
function Pp(e, t) {
  if (ec(e, t))
    throw new Error("Cannot use string index");
}
function n$(e, t, r) {
  if (!En(e) || typeof t != "string")
    return r === void 0 ? e : r;
  const n = Ba(t);
  if (n.length === 0)
    return r;
  for (let s = 0; s < n.length; s++) {
    const i = n[s];
    if (ec(e, i) ? e = s === n.length - 1 ? void 0 : null : e = e[i], e == null) {
      if (s !== n.length - 1)
        return r;
      break;
    }
  }
  return e === void 0 ? r : e;
}
function Md(e, t, r) {
  if (!En(e) || typeof t != "string")
    return e;
  const n = e, s = Ba(t);
  for (let i = 0; i < s.length; i++) {
    const a = s[i];
    Pp(e, a), i === s.length - 1 ? e[a] = r : En(e[a]) || (e[a] = typeof s[i + 1] == "number" ? [] : {}), e = e[a];
  }
  return n;
}
function s$(e, t) {
  if (!En(e) || typeof t != "string")
    return !1;
  const r = Ba(t);
  for (let n = 0; n < r.length; n++) {
    const s = r[n];
    if (Pp(e, s), n === r.length - 1)
      return delete e[s], !0;
    if (e = e[s], !En(e))
      return !1;
  }
}
function i$(e, t) {
  if (!En(e) || typeof t != "string")
    return !1;
  const r = Ba(t);
  if (r.length === 0)
    return !1;
  for (const n of r) {
    if (!En(e) || !(n in e) || ec(e, n))
      return !1;
    e = e[n];
  }
  return !0;
}
const Mr = xa.homedir(), tc = xa.tmpdir(), { env: Bn } = je, a$ = (e) => {
  const t = fe.join(Mr, "Library");
  return {
    data: fe.join(t, "Application Support", e),
    config: fe.join(t, "Preferences", e),
    cache: fe.join(t, "Caches", e),
    log: fe.join(t, "Logs", e),
    temp: fe.join(tc, e)
  };
}, o$ = (e) => {
  const t = Bn.APPDATA || fe.join(Mr, "AppData", "Roaming"), r = Bn.LOCALAPPDATA || fe.join(Mr, "AppData", "Local");
  return {
    // Data/config/cache/log are invented by me as Windows isn't opinionated about this
    data: fe.join(r, e, "Data"),
    config: fe.join(t, e, "Config"),
    cache: fe.join(r, e, "Cache"),
    log: fe.join(r, e, "Log"),
    temp: fe.join(tc, e)
  };
}, l$ = (e) => {
  const t = fe.basename(Mr);
  return {
    data: fe.join(Bn.XDG_DATA_HOME || fe.join(Mr, ".local", "share"), e),
    config: fe.join(Bn.XDG_CONFIG_HOME || fe.join(Mr, ".config"), e),
    cache: fe.join(Bn.XDG_CACHE_HOME || fe.join(Mr, ".cache"), e),
    // https://wiki.debian.org/XDGBaseDirectorySpecification#state
    log: fe.join(Bn.XDG_STATE_HOME || fe.join(Mr, ".local", "state"), e),
    temp: fe.join(tc, t, e)
  };
};
function c$(e, { suffix: t = "nodejs" } = {}) {
  if (typeof e != "string")
    throw new TypeError(`Expected a string, got ${typeof e}`);
  return t && (e += `-${t}`), je.platform === "darwin" ? a$(e) : je.platform === "win32" ? o$(e) : l$(e);
}
const Nr = (e, t) => function(...n) {
  return e.apply(void 0, n).catch(t);
}, fr = (e, t) => function(...n) {
  try {
    return e.apply(void 0, n);
  } catch (s) {
    return t(s);
  }
}, u$ = je.getuid ? !je.getuid() : !1, d$ = 1e4, bt = () => {
}, Re = {
  /* API */
  isChangeErrorOk: (e) => {
    if (!Re.isNodeError(e))
      return !1;
    const { code: t } = e;
    return t === "ENOSYS" || !u$ && (t === "EINVAL" || t === "EPERM");
  },
  isNodeError: (e) => e instanceof Error,
  isRetriableError: (e) => {
    if (!Re.isNodeError(e))
      return !1;
    const { code: t } = e;
    return t === "EMFILE" || t === "ENFILE" || t === "EAGAIN" || t === "EBUSY" || t === "EACCESS" || t === "EACCES" || t === "EACCS" || t === "EPERM";
  },
  onChangeError: (e) => {
    if (!Re.isNodeError(e))
      throw e;
    if (!Re.isChangeErrorOk(e))
      throw e;
  }
};
class f$ {
  constructor() {
    this.interval = 25, this.intervalId = void 0, this.limit = d$, this.queueActive = /* @__PURE__ */ new Set(), this.queueWaiting = /* @__PURE__ */ new Set(), this.init = () => {
      this.intervalId || (this.intervalId = setInterval(this.tick, this.interval));
    }, this.reset = () => {
      this.intervalId && (clearInterval(this.intervalId), delete this.intervalId);
    }, this.add = (t) => {
      this.queueWaiting.add(t), this.queueActive.size < this.limit / 2 ? this.tick() : this.init();
    }, this.remove = (t) => {
      this.queueWaiting.delete(t), this.queueActive.delete(t);
    }, this.schedule = () => new Promise((t) => {
      const r = () => this.remove(n), n = () => t(r);
      this.add(n);
    }), this.tick = () => {
      if (!(this.queueActive.size >= this.limit)) {
        if (!this.queueWaiting.size)
          return this.reset();
        for (const t of this.queueWaiting) {
          if (this.queueActive.size >= this.limit)
            break;
          this.queueWaiting.delete(t), this.queueActive.add(t), t();
        }
      }
    };
  }
}
const h$ = new f$(), Cr = (e, t) => function(n) {
  return function s(...i) {
    return h$.schedule().then((a) => {
      const o = (c) => (a(), c), l = (c) => {
        if (a(), Date.now() >= n)
          throw c;
        if (t(c)) {
          const u = Math.round(100 * Math.random());
          return new Promise((p) => setTimeout(p, u)).then(() => s.apply(void 0, i));
        }
        throw c;
      };
      return e.apply(void 0, i).then(o, l);
    });
  };
}, Or = (e, t) => function(n) {
  return function s(...i) {
    try {
      return e.apply(void 0, i);
    } catch (a) {
      if (Date.now() > n)
        throw a;
      if (t(a))
        return s.apply(void 0, i);
      throw a;
    }
  };
}, tt = {
  attempt: {
    /* ASYNC */
    chmod: Nr(Qe(le.chmod), Re.onChangeError),
    chown: Nr(Qe(le.chown), Re.onChangeError),
    close: Nr(Qe(le.close), bt),
    fsync: Nr(Qe(le.fsync), bt),
    mkdir: Nr(Qe(le.mkdir), bt),
    realpath: Nr(Qe(le.realpath), bt),
    stat: Nr(Qe(le.stat), bt),
    unlink: Nr(Qe(le.unlink), bt),
    /* SYNC */
    chmodSync: fr(le.chmodSync, Re.onChangeError),
    chownSync: fr(le.chownSync, Re.onChangeError),
    closeSync: fr(le.closeSync, bt),
    existsSync: fr(le.existsSync, bt),
    fsyncSync: fr(le.fsync, bt),
    mkdirSync: fr(le.mkdirSync, bt),
    realpathSync: fr(le.realpathSync, bt),
    statSync: fr(le.statSync, bt),
    unlinkSync: fr(le.unlinkSync, bt)
  },
  retry: {
    /* ASYNC */
    close: Cr(Qe(le.close), Re.isRetriableError),
    fsync: Cr(Qe(le.fsync), Re.isRetriableError),
    open: Cr(Qe(le.open), Re.isRetriableError),
    readFile: Cr(Qe(le.readFile), Re.isRetriableError),
    rename: Cr(Qe(le.rename), Re.isRetriableError),
    stat: Cr(Qe(le.stat), Re.isRetriableError),
    write: Cr(Qe(le.write), Re.isRetriableError),
    writeFile: Cr(Qe(le.writeFile), Re.isRetriableError),
    /* SYNC */
    closeSync: Or(le.closeSync, Re.isRetriableError),
    fsyncSync: Or(le.fsyncSync, Re.isRetriableError),
    openSync: Or(le.openSync, Re.isRetriableError),
    readFileSync: Or(le.readFileSync, Re.isRetriableError),
    renameSync: Or(le.renameSync, Re.isRetriableError),
    statSync: Or(le.statSync, Re.isRetriableError),
    writeSync: Or(le.writeSync, Re.isRetriableError),
    writeFileSync: Or(le.writeFileSync, Re.isRetriableError)
  }
}, p$ = "utf8", xd = 438, m$ = 511, g$ = {}, y$ = xa.userInfo().uid, $$ = xa.userInfo().gid, _$ = 1e3, v$ = !!je.getuid;
je.getuid && je.getuid();
const qd = 128, w$ = (e) => e instanceof Error && "code" in e, Vd = (e) => typeof e == "string", Co = (e) => e === void 0, E$ = je.platform === "linux", Ap = je.platform === "win32", rc = ["SIGABRT", "SIGALRM", "SIGHUP", "SIGINT", "SIGTERM"];
Ap || rc.push("SIGVTALRM", "SIGXCPU", "SIGXFSZ", "SIGUSR2", "SIGTRAP", "SIGSYS", "SIGQUIT", "SIGIOT");
E$ && rc.push("SIGIO", "SIGPOLL", "SIGPWR", "SIGSTKFLT", "SIGUNUSED");
class b$ {
  /* CONSTRUCTOR */
  constructor() {
    this.callbacks = /* @__PURE__ */ new Set(), this.exited = !1, this.exit = (t) => {
      if (!this.exited) {
        this.exited = !0;
        for (const r of this.callbacks)
          r();
        t && (Ap && t !== "SIGINT" && t !== "SIGTERM" && t !== "SIGKILL" ? je.kill(je.pid, "SIGTERM") : je.kill(je.pid, t));
      }
    }, this.hook = () => {
      je.once("exit", () => this.exit());
      for (const t of rc)
        try {
          je.once(t, () => this.exit(t));
        } catch {
        }
    }, this.register = (t) => (this.callbacks.add(t), () => {
      this.callbacks.delete(t);
    }), this.hook();
  }
}
const S$ = new b$(), T$ = S$.register, rt = {
  /* VARIABLES */
  store: {},
  /* API */
  create: (e) => {
    const t = `000000${Math.floor(Math.random() * 16777215).toString(16)}`.slice(-6), s = `.tmp-${Date.now().toString().slice(-10)}${t}`;
    return `${e}${s}`;
  },
  get: (e, t, r = !0) => {
    const n = rt.truncate(t(e));
    return n in rt.store ? rt.get(e, t, r) : (rt.store[n] = r, [n, () => delete rt.store[n]]);
  },
  purge: (e) => {
    rt.store[e] && (delete rt.store[e], tt.attempt.unlink(e));
  },
  purgeSync: (e) => {
    rt.store[e] && (delete rt.store[e], tt.attempt.unlinkSync(e));
  },
  purgeSyncAll: () => {
    for (const e in rt.store)
      rt.purgeSync(e);
  },
  truncate: (e) => {
    const t = fe.basename(e);
    if (t.length <= qd)
      return e;
    const r = /^(\.?)(.*?)((?:\.[^.]+)?(?:\.tmp-\d{10}[a-f0-9]{6})?)$/.exec(t);
    if (!r)
      return e;
    const n = t.length - qd;
    return `${e.slice(0, -t.length)}${r[1]}${r[2].slice(0, -n)}${r[3]}`;
  }
};
T$(rt.purgeSyncAll);
function Rp(e, t, r = g$) {
  if (Vd(r))
    return Rp(e, t, { encoding: r });
  const n = Date.now() + ((r.timeout ?? _$) || -1);
  let s = null, i = null, a = null;
  try {
    const o = tt.attempt.realpathSync(e), l = !!o;
    e = o || e, [i, s] = rt.get(e, r.tmpCreate || rt.create, r.tmpPurge !== !1);
    const c = v$ && Co(r.chown), u = Co(r.mode);
    if (l && (c || u)) {
      const d = tt.attempt.statSync(e);
      d && (r = { ...r }, c && (r.chown = { uid: d.uid, gid: d.gid }), u && (r.mode = d.mode));
    }
    if (!l) {
      const d = fe.dirname(e);
      tt.attempt.mkdirSync(d, {
        mode: m$,
        recursive: !0
      });
    }
    a = tt.retry.openSync(n)(i, "w", r.mode || xd), r.tmpCreated && r.tmpCreated(i), Vd(t) ? tt.retry.writeSync(n)(a, t, 0, r.encoding || p$) : Co(t) || tt.retry.writeSync(n)(a, t, 0, t.length, 0), r.fsync !== !1 && (r.fsyncWait !== !1 ? tt.retry.fsyncSync(n)(a) : tt.attempt.fsync(a)), tt.retry.closeSync(n)(a), a = null, r.chown && (r.chown.uid !== y$ || r.chown.gid !== $$) && tt.attempt.chownSync(i, r.chown.uid, r.chown.gid), r.mode && r.mode !== xd && tt.attempt.chmodSync(i, r.mode);
    try {
      tt.retry.renameSync(n)(i, e);
    } catch (d) {
      if (!w$(d) || d.code !== "ENAMETOOLONG")
        throw d;
      tt.retry.renameSync(n)(i, rt.truncate(e));
    }
    s(), i = null;
  } finally {
    a && tt.attempt.closeSync(a), i && rt.purge(i);
  }
}
var Dt = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function Np(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var wl = { exports: {} }, Cp = {}, Ht = {}, ts = {}, di = {}, ne = {}, Qs = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.regexpCode = e.getEsmExportName = e.getProperty = e.safeStringify = e.stringify = e.strConcat = e.addCodeArg = e.str = e._ = e.nil = e._Code = e.Name = e.IDENTIFIER = e._CodeOrName = void 0;
  class t {
  }
  e._CodeOrName = t, e.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
  class r extends t {
    constructor(E) {
      if (super(), !e.IDENTIFIER.test(E))
        throw new Error("CodeGen: name must be a valid identifier");
      this.str = E;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      return !1;
    }
    get names() {
      return { [this.str]: 1 };
    }
  }
  e.Name = r;
  class n extends t {
    constructor(E) {
      super(), this._items = typeof E == "string" ? [E] : E;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      if (this._items.length > 1)
        return !1;
      const E = this._items[0];
      return E === "" || E === '""';
    }
    get str() {
      var E;
      return (E = this._str) !== null && E !== void 0 ? E : this._str = this._items.reduce((N, O) => `${N}${O}`, "");
    }
    get names() {
      var E;
      return (E = this._names) !== null && E !== void 0 ? E : this._names = this._items.reduce((N, O) => (O instanceof r && (N[O.str] = (N[O.str] || 0) + 1), N), {});
    }
  }
  e._Code = n, e.nil = new n("");
  function s(g, ...E) {
    const N = [g[0]];
    let O = 0;
    for (; O < E.length; )
      o(N, E[O]), N.push(g[++O]);
    return new n(N);
  }
  e._ = s;
  const i = new n("+");
  function a(g, ...E) {
    const N = [m(g[0])];
    let O = 0;
    for (; O < E.length; )
      N.push(i), o(N, E[O]), N.push(i, m(g[++O]));
    return l(N), new n(N);
  }
  e.str = a;
  function o(g, E) {
    E instanceof n ? g.push(...E._items) : E instanceof r ? g.push(E) : g.push(d(E));
  }
  e.addCodeArg = o;
  function l(g) {
    let E = 1;
    for (; E < g.length - 1; ) {
      if (g[E] === i) {
        const N = c(g[E - 1], g[E + 1]);
        if (N !== void 0) {
          g.splice(E - 1, 3, N);
          continue;
        }
        g[E++] = "+";
      }
      E++;
    }
  }
  function c(g, E) {
    if (E === '""')
      return g;
    if (g === '""')
      return E;
    if (typeof g == "string")
      return E instanceof r || g[g.length - 1] !== '"' ? void 0 : typeof E != "string" ? `${g.slice(0, -1)}${E}"` : E[0] === '"' ? g.slice(0, -1) + E.slice(1) : void 0;
    if (typeof E == "string" && E[0] === '"' && !(g instanceof r))
      return `"${g}${E.slice(1)}`;
  }
  function u(g, E) {
    return E.emptyStr() ? g : g.emptyStr() ? E : a`${g}${E}`;
  }
  e.strConcat = u;
  function d(g) {
    return typeof g == "number" || typeof g == "boolean" || g === null ? g : m(Array.isArray(g) ? g.join(",") : g);
  }
  function p(g) {
    return new n(m(g));
  }
  e.stringify = p;
  function m(g) {
    return JSON.stringify(g).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  }
  e.safeStringify = m;
  function _(g) {
    return typeof g == "string" && e.IDENTIFIER.test(g) ? new n(`.${g}`) : s`[${g}]`;
  }
  e.getProperty = _;
  function $(g) {
    if (typeof g == "string" && e.IDENTIFIER.test(g))
      return new n(`${g}`);
    throw new Error(`CodeGen: invalid export name: ${g}, use explicit $id name mapping`);
  }
  e.getEsmExportName = $;
  function v(g) {
    return new n(g.toString());
  }
  e.regexpCode = v;
})(Qs);
var El = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.ValueScope = e.ValueScopeName = e.Scope = e.varKinds = e.UsedValueState = void 0;
  const t = Qs;
  class r extends Error {
    constructor(c) {
      super(`CodeGen: "code" for ${c} not defined`), this.value = c.value;
    }
  }
  var n;
  (function(l) {
    l[l.Started = 0] = "Started", l[l.Completed = 1] = "Completed";
  })(n || (e.UsedValueState = n = {})), e.varKinds = {
    const: new t.Name("const"),
    let: new t.Name("let"),
    var: new t.Name("var")
  };
  class s {
    constructor({ prefixes: c, parent: u } = {}) {
      this._names = {}, this._prefixes = c, this._parent = u;
    }
    toName(c) {
      return c instanceof t.Name ? c : this.name(c);
    }
    name(c) {
      return new t.Name(this._newName(c));
    }
    _newName(c) {
      const u = this._names[c] || this._nameGroup(c);
      return `${c}${u.index++}`;
    }
    _nameGroup(c) {
      var u, d;
      if (!((d = (u = this._parent) === null || u === void 0 ? void 0 : u._prefixes) === null || d === void 0) && d.has(c) || this._prefixes && !this._prefixes.has(c))
        throw new Error(`CodeGen: prefix "${c}" is not allowed in this scope`);
      return this._names[c] = { prefix: c, index: 0 };
    }
  }
  e.Scope = s;
  class i extends t.Name {
    constructor(c, u) {
      super(u), this.prefix = c;
    }
    setValue(c, { property: u, itemIndex: d }) {
      this.value = c, this.scopePath = (0, t._)`.${new t.Name(u)}[${d}]`;
    }
  }
  e.ValueScopeName = i;
  const a = (0, t._)`\n`;
  class o extends s {
    constructor(c) {
      super(c), this._values = {}, this._scope = c.scope, this.opts = { ...c, _n: c.lines ? a : t.nil };
    }
    get() {
      return this._scope;
    }
    name(c) {
      return new i(c, this._newName(c));
    }
    value(c, u) {
      var d;
      if (u.ref === void 0)
        throw new Error("CodeGen: ref must be passed in value");
      const p = this.toName(c), { prefix: m } = p, _ = (d = u.key) !== null && d !== void 0 ? d : u.ref;
      let $ = this._values[m];
      if ($) {
        const E = $.get(_);
        if (E)
          return E;
      } else
        $ = this._values[m] = /* @__PURE__ */ new Map();
      $.set(_, p);
      const v = this._scope[m] || (this._scope[m] = []), g = v.length;
      return v[g] = u.ref, p.setValue(u, { property: m, itemIndex: g }), p;
    }
    getValue(c, u) {
      const d = this._values[c];
      if (d)
        return d.get(u);
    }
    scopeRefs(c, u = this._values) {
      return this._reduceValues(u, (d) => {
        if (d.scopePath === void 0)
          throw new Error(`CodeGen: name "${d}" has no value`);
        return (0, t._)`${c}${d.scopePath}`;
      });
    }
    scopeCode(c = this._values, u, d) {
      return this._reduceValues(c, (p) => {
        if (p.value === void 0)
          throw new Error(`CodeGen: name "${p}" has no value`);
        return p.value.code;
      }, u, d);
    }
    _reduceValues(c, u, d = {}, p) {
      let m = t.nil;
      for (const _ in c) {
        const $ = c[_];
        if (!$)
          continue;
        const v = d[_] = d[_] || /* @__PURE__ */ new Map();
        $.forEach((g) => {
          if (v.has(g))
            return;
          v.set(g, n.Started);
          let E = u(g);
          if (E) {
            const N = this.opts.es5 ? e.varKinds.var : e.varKinds.const;
            m = (0, t._)`${m}${N} ${g} = ${E};${this.opts._n}`;
          } else if (E = p == null ? void 0 : p(g))
            m = (0, t._)`${m}${E}${this.opts._n}`;
          else
            throw new r(g);
          v.set(g, n.Completed);
        });
      }
      return m;
    }
  }
  e.ValueScope = o;
})(El);
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.or = e.and = e.not = e.CodeGen = e.operators = e.varKinds = e.ValueScopeName = e.ValueScope = e.Scope = e.Name = e.regexpCode = e.stringify = e.getProperty = e.nil = e.strConcat = e.str = e._ = void 0;
  const t = Qs, r = El;
  var n = Qs;
  Object.defineProperty(e, "_", { enumerable: !0, get: function() {
    return n._;
  } }), Object.defineProperty(e, "str", { enumerable: !0, get: function() {
    return n.str;
  } }), Object.defineProperty(e, "strConcat", { enumerable: !0, get: function() {
    return n.strConcat;
  } }), Object.defineProperty(e, "nil", { enumerable: !0, get: function() {
    return n.nil;
  } }), Object.defineProperty(e, "getProperty", { enumerable: !0, get: function() {
    return n.getProperty;
  } }), Object.defineProperty(e, "stringify", { enumerable: !0, get: function() {
    return n.stringify;
  } }), Object.defineProperty(e, "regexpCode", { enumerable: !0, get: function() {
    return n.regexpCode;
  } }), Object.defineProperty(e, "Name", { enumerable: !0, get: function() {
    return n.Name;
  } });
  var s = El;
  Object.defineProperty(e, "Scope", { enumerable: !0, get: function() {
    return s.Scope;
  } }), Object.defineProperty(e, "ValueScope", { enumerable: !0, get: function() {
    return s.ValueScope;
  } }), Object.defineProperty(e, "ValueScopeName", { enumerable: !0, get: function() {
    return s.ValueScopeName;
  } }), Object.defineProperty(e, "varKinds", { enumerable: !0, get: function() {
    return s.varKinds;
  } }), e.operators = {
    GT: new t._Code(">"),
    GTE: new t._Code(">="),
    LT: new t._Code("<"),
    LTE: new t._Code("<="),
    EQ: new t._Code("==="),
    NEQ: new t._Code("!=="),
    NOT: new t._Code("!"),
    OR: new t._Code("||"),
    AND: new t._Code("&&"),
    ADD: new t._Code("+")
  };
  class i {
    optimizeNodes() {
      return this;
    }
    optimizeNames(f, y) {
      return this;
    }
  }
  class a extends i {
    constructor(f, y, P) {
      super(), this.varKind = f, this.name = y, this.rhs = P;
    }
    render({ es5: f, _n: y }) {
      const P = f ? r.varKinds.var : this.varKind, w = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
      return `${P} ${this.name}${w};` + y;
    }
    optimizeNames(f, y) {
      if (f[this.name.str])
        return this.rhs && (this.rhs = F(this.rhs, f, y)), this;
    }
    get names() {
      return this.rhs instanceof t._CodeOrName ? this.rhs.names : {};
    }
  }
  class o extends i {
    constructor(f, y, P) {
      super(), this.lhs = f, this.rhs = y, this.sideEffects = P;
    }
    render({ _n: f }) {
      return `${this.lhs} = ${this.rhs};` + f;
    }
    optimizeNames(f, y) {
      if (!(this.lhs instanceof t.Name && !f[this.lhs.str] && !this.sideEffects))
        return this.rhs = F(this.rhs, f, y), this;
    }
    get names() {
      const f = this.lhs instanceof t.Name ? {} : { ...this.lhs.names };
      return se(f, this.rhs);
    }
  }
  class l extends o {
    constructor(f, y, P, w) {
      super(f, P, w), this.op = y;
    }
    render({ _n: f }) {
      return `${this.lhs} ${this.op}= ${this.rhs};` + f;
    }
  }
  class c extends i {
    constructor(f) {
      super(), this.label = f, this.names = {};
    }
    render({ _n: f }) {
      return `${this.label}:` + f;
    }
  }
  class u extends i {
    constructor(f) {
      super(), this.label = f, this.names = {};
    }
    render({ _n: f }) {
      return `break${this.label ? ` ${this.label}` : ""};` + f;
    }
  }
  class d extends i {
    constructor(f) {
      super(), this.error = f;
    }
    render({ _n: f }) {
      return `throw ${this.error};` + f;
    }
    get names() {
      return this.error.names;
    }
  }
  class p extends i {
    constructor(f) {
      super(), this.code = f;
    }
    render({ _n: f }) {
      return `${this.code};` + f;
    }
    optimizeNodes() {
      return `${this.code}` ? this : void 0;
    }
    optimizeNames(f, y) {
      return this.code = F(this.code, f, y), this;
    }
    get names() {
      return this.code instanceof t._CodeOrName ? this.code.names : {};
    }
  }
  class m extends i {
    constructor(f = []) {
      super(), this.nodes = f;
    }
    render(f) {
      return this.nodes.reduce((y, P) => y + P.render(f), "");
    }
    optimizeNodes() {
      const { nodes: f } = this;
      let y = f.length;
      for (; y--; ) {
        const P = f[y].optimizeNodes();
        Array.isArray(P) ? f.splice(y, 1, ...P) : P ? f[y] = P : f.splice(y, 1);
      }
      return f.length > 0 ? this : void 0;
    }
    optimizeNames(f, y) {
      const { nodes: P } = this;
      let w = P.length;
      for (; w--; ) {
        const h = P[w];
        h.optimizeNames(f, y) || (L(f, h.names), P.splice(w, 1));
      }
      return P.length > 0 ? this : void 0;
    }
    get names() {
      return this.nodes.reduce((f, y) => x(f, y.names), {});
    }
  }
  class _ extends m {
    render(f) {
      return "{" + f._n + super.render(f) + "}" + f._n;
    }
  }
  class $ extends m {
  }
  class v extends _ {
  }
  v.kind = "else";
  class g extends _ {
    constructor(f, y) {
      super(y), this.condition = f;
    }
    render(f) {
      let y = `if(${this.condition})` + super.render(f);
      return this.else && (y += "else " + this.else.render(f)), y;
    }
    optimizeNodes() {
      super.optimizeNodes();
      const f = this.condition;
      if (f === !0)
        return this.nodes;
      let y = this.else;
      if (y) {
        const P = y.optimizeNodes();
        y = this.else = Array.isArray(P) ? new v(P) : P;
      }
      if (y)
        return f === !1 ? y instanceof g ? y : y.nodes : this.nodes.length ? this : new g(K(f), y instanceof g ? [y] : y.nodes);
      if (!(f === !1 || !this.nodes.length))
        return this;
    }
    optimizeNames(f, y) {
      var P;
      if (this.else = (P = this.else) === null || P === void 0 ? void 0 : P.optimizeNames(f, y), !!(super.optimizeNames(f, y) || this.else))
        return this.condition = F(this.condition, f, y), this;
    }
    get names() {
      const f = super.names;
      return se(f, this.condition), this.else && x(f, this.else.names), f;
    }
  }
  g.kind = "if";
  class E extends _ {
  }
  E.kind = "for";
  class N extends E {
    constructor(f) {
      super(), this.iteration = f;
    }
    render(f) {
      return `for(${this.iteration})` + super.render(f);
    }
    optimizeNames(f, y) {
      if (super.optimizeNames(f, y))
        return this.iteration = F(this.iteration, f, y), this;
    }
    get names() {
      return x(super.names, this.iteration.names);
    }
  }
  class O extends E {
    constructor(f, y, P, w) {
      super(), this.varKind = f, this.name = y, this.from = P, this.to = w;
    }
    render(f) {
      const y = f.es5 ? r.varKinds.var : this.varKind, { name: P, from: w, to: h } = this;
      return `for(${y} ${P}=${w}; ${P}<${h}; ${P}++)` + super.render(f);
    }
    get names() {
      const f = se(super.names, this.from);
      return se(f, this.to);
    }
  }
  class U extends E {
    constructor(f, y, P, w) {
      super(), this.loop = f, this.varKind = y, this.name = P, this.iterable = w;
    }
    render(f) {
      return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(f);
    }
    optimizeNames(f, y) {
      if (super.optimizeNames(f, y))
        return this.iterable = F(this.iterable, f, y), this;
    }
    get names() {
      return x(super.names, this.iterable.names);
    }
  }
  class q extends _ {
    constructor(f, y, P) {
      super(), this.name = f, this.args = y, this.async = P;
    }
    render(f) {
      return `${this.async ? "async " : ""}function ${this.name}(${this.args})` + super.render(f);
    }
  }
  q.kind = "func";
  class B extends m {
    render(f) {
      return "return " + super.render(f);
    }
  }
  B.kind = "return";
  class me extends _ {
    render(f) {
      let y = "try" + super.render(f);
      return this.catch && (y += this.catch.render(f)), this.finally && (y += this.finally.render(f)), y;
    }
    optimizeNodes() {
      var f, y;
      return super.optimizeNodes(), (f = this.catch) === null || f === void 0 || f.optimizeNodes(), (y = this.finally) === null || y === void 0 || y.optimizeNodes(), this;
    }
    optimizeNames(f, y) {
      var P, w;
      return super.optimizeNames(f, y), (P = this.catch) === null || P === void 0 || P.optimizeNames(f, y), (w = this.finally) === null || w === void 0 || w.optimizeNames(f, y), this;
    }
    get names() {
      const f = super.names;
      return this.catch && x(f, this.catch.names), this.finally && x(f, this.finally.names), f;
    }
  }
  class I extends _ {
    constructor(f) {
      super(), this.error = f;
    }
    render(f) {
      return `catch(${this.error})` + super.render(f);
    }
  }
  I.kind = "catch";
  class ye extends _ {
    render(f) {
      return "finally" + super.render(f);
    }
  }
  ye.kind = "finally";
  class W {
    constructor(f, y = {}) {
      this._values = {}, this._blockStarts = [], this._constants = {}, this.opts = { ...y, _n: y.lines ? `
` : "" }, this._extScope = f, this._scope = new r.Scope({ parent: f }), this._nodes = [new $()];
    }
    toString() {
      return this._root.render(this.opts);
    }
    // returns unique name in the internal scope
    name(f) {
      return this._scope.name(f);
    }
    // reserves unique name in the external scope
    scopeName(f) {
      return this._extScope.name(f);
    }
    // reserves unique name in the external scope and assigns value to it
    scopeValue(f, y) {
      const P = this._extScope.value(f, y);
      return (this._values[P.prefix] || (this._values[P.prefix] = /* @__PURE__ */ new Set())).add(P), P;
    }
    getScopeValue(f, y) {
      return this._extScope.getValue(f, y);
    }
    // return code that assigns values in the external scope to the names that are used internally
    // (same names that were returned by gen.scopeName or gen.scopeValue)
    scopeRefs(f) {
      return this._extScope.scopeRefs(f, this._values);
    }
    scopeCode() {
      return this._extScope.scopeCode(this._values);
    }
    _def(f, y, P, w) {
      const h = this._scope.toName(y);
      return P !== void 0 && w && (this._constants[h.str] = P), this._leafNode(new a(f, h, P)), h;
    }
    // `const` declaration (`var` in es5 mode)
    const(f, y, P) {
      return this._def(r.varKinds.const, f, y, P);
    }
    // `let` declaration with optional assignment (`var` in es5 mode)
    let(f, y, P) {
      return this._def(r.varKinds.let, f, y, P);
    }
    // `var` declaration with optional assignment
    var(f, y, P) {
      return this._def(r.varKinds.var, f, y, P);
    }
    // assignment code
    assign(f, y, P) {
      return this._leafNode(new o(f, y, P));
    }
    // `+=` code
    add(f, y) {
      return this._leafNode(new l(f, e.operators.ADD, y));
    }
    // appends passed SafeExpr to code or executes Block
    code(f) {
      return typeof f == "function" ? f() : f !== t.nil && this._leafNode(new p(f)), this;
    }
    // returns code for object literal for the passed argument list of key-value pairs
    object(...f) {
      const y = ["{"];
      for (const [P, w] of f)
        y.length > 1 && y.push(","), y.push(P), (P !== w || this.opts.es5) && (y.push(":"), (0, t.addCodeArg)(y, w));
      return y.push("}"), new t._Code(y);
    }
    // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
    if(f, y, P) {
      if (this._blockNode(new g(f)), y && P)
        this.code(y).else().code(P).endIf();
      else if (y)
        this.code(y).endIf();
      else if (P)
        throw new Error('CodeGen: "else" body without "then" body');
      return this;
    }
    // `else if` clause - invalid without `if` or after `else` clauses
    elseIf(f) {
      return this._elseNode(new g(f));
    }
    // `else` clause - only valid after `if` or `else if` clauses
    else() {
      return this._elseNode(new v());
    }
    // end `if` statement (needed if gen.if was used only with condition)
    endIf() {
      return this._endBlockNode(g, v);
    }
    _for(f, y) {
      return this._blockNode(f), y && this.code(y).endFor(), this;
    }
    // a generic `for` clause (or statement if `forBody` is passed)
    for(f, y) {
      return this._for(new N(f), y);
    }
    // `for` statement for a range of values
    forRange(f, y, P, w, h = this.opts.es5 ? r.varKinds.var : r.varKinds.let) {
      const k = this._scope.toName(f);
      return this._for(new O(h, k, y, P), () => w(k));
    }
    // `for-of` statement (in es5 mode replace with a normal for loop)
    forOf(f, y, P, w = r.varKinds.const) {
      const h = this._scope.toName(f);
      if (this.opts.es5) {
        const k = y instanceof t.Name ? y : this.var("_arr", y);
        return this.forRange("_i", 0, (0, t._)`${k}.length`, (R) => {
          this.var(h, (0, t._)`${k}[${R}]`), P(h);
        });
      }
      return this._for(new U("of", w, h, y), () => P(h));
    }
    // `for-in` statement.
    // With option `ownProperties` replaced with a `for-of` loop for object keys
    forIn(f, y, P, w = this.opts.es5 ? r.varKinds.var : r.varKinds.const) {
      if (this.opts.ownProperties)
        return this.forOf(f, (0, t._)`Object.keys(${y})`, P);
      const h = this._scope.toName(f);
      return this._for(new U("in", w, h, y), () => P(h));
    }
    // end `for` loop
    endFor() {
      return this._endBlockNode(E);
    }
    // `label` statement
    label(f) {
      return this._leafNode(new c(f));
    }
    // `break` statement
    break(f) {
      return this._leafNode(new u(f));
    }
    // `return` statement
    return(f) {
      const y = new B();
      if (this._blockNode(y), this.code(f), y.nodes.length !== 1)
        throw new Error('CodeGen: "return" should have one node');
      return this._endBlockNode(B);
    }
    // `try` statement
    try(f, y, P) {
      if (!y && !P)
        throw new Error('CodeGen: "try" without "catch" and "finally"');
      const w = new me();
      if (this._blockNode(w), this.code(f), y) {
        const h = this.name("e");
        this._currNode = w.catch = new I(h), y(h);
      }
      return P && (this._currNode = w.finally = new ye(), this.code(P)), this._endBlockNode(I, ye);
    }
    // `throw` statement
    throw(f) {
      return this._leafNode(new d(f));
    }
    // start self-balancing block
    block(f, y) {
      return this._blockStarts.push(this._nodes.length), f && this.code(f).endBlock(y), this;
    }
    // end the current self-balancing block
    endBlock(f) {
      const y = this._blockStarts.pop();
      if (y === void 0)
        throw new Error("CodeGen: not in self-balancing block");
      const P = this._nodes.length - y;
      if (P < 0 || f !== void 0 && P !== f)
        throw new Error(`CodeGen: wrong number of nodes: ${P} vs ${f} expected`);
      return this._nodes.length = y, this;
    }
    // `function` heading (or definition if funcBody is passed)
    func(f, y = t.nil, P, w) {
      return this._blockNode(new q(f, y, P)), w && this.code(w).endFunc(), this;
    }
    // end function definition
    endFunc() {
      return this._endBlockNode(q);
    }
    optimize(f = 1) {
      for (; f-- > 0; )
        this._root.optimizeNodes(), this._root.optimizeNames(this._root.names, this._constants);
    }
    _leafNode(f) {
      return this._currNode.nodes.push(f), this;
    }
    _blockNode(f) {
      this._currNode.nodes.push(f), this._nodes.push(f);
    }
    _endBlockNode(f, y) {
      const P = this._currNode;
      if (P instanceof f || y && P instanceof y)
        return this._nodes.pop(), this;
      throw new Error(`CodeGen: not in block "${y ? `${f.kind}/${y.kind}` : f.kind}"`);
    }
    _elseNode(f) {
      const y = this._currNode;
      if (!(y instanceof g))
        throw new Error('CodeGen: "else" without "if"');
      return this._currNode = y.else = f, this;
    }
    get _root() {
      return this._nodes[0];
    }
    get _currNode() {
      const f = this._nodes;
      return f[f.length - 1];
    }
    set _currNode(f) {
      const y = this._nodes;
      y[y.length - 1] = f;
    }
  }
  e.CodeGen = W;
  function x(S, f) {
    for (const y in f)
      S[y] = (S[y] || 0) + (f[y] || 0);
    return S;
  }
  function se(S, f) {
    return f instanceof t._CodeOrName ? x(S, f.names) : S;
  }
  function F(S, f, y) {
    if (S instanceof t.Name)
      return P(S);
    if (!w(S))
      return S;
    return new t._Code(S._items.reduce((h, k) => (k instanceof t.Name && (k = P(k)), k instanceof t._Code ? h.push(...k._items) : h.push(k), h), []));
    function P(h) {
      const k = y[h.str];
      return k === void 0 || f[h.str] !== 1 ? h : (delete f[h.str], k);
    }
    function w(h) {
      return h instanceof t._Code && h._items.some((k) => k instanceof t.Name && f[k.str] === 1 && y[k.str] !== void 0);
    }
  }
  function L(S, f) {
    for (const y in f)
      S[y] = (S[y] || 0) - (f[y] || 0);
  }
  function K(S) {
    return typeof S == "boolean" || typeof S == "number" || S === null ? !S : (0, t._)`!${A(S)}`;
  }
  e.not = K;
  const M = b(e.operators.AND);
  function X(...S) {
    return S.reduce(M);
  }
  e.and = X;
  const H = b(e.operators.OR);
  function C(...S) {
    return S.reduce(H);
  }
  e.or = C;
  function b(S) {
    return (f, y) => f === t.nil ? y : y === t.nil ? f : (0, t._)`${A(f)} ${S} ${A(y)}`;
  }
  function A(S) {
    return S instanceof t.Name ? S : (0, t._)`(${S})`;
  }
})(ne);
var V = {};
Object.defineProperty(V, "__esModule", { value: !0 });
V.checkStrictMode = V.getErrorPath = V.Type = V.useFunc = V.setEvaluated = V.evaluatedPropsToName = V.mergeEvaluated = V.eachItem = V.unescapeJsonPointer = V.escapeJsonPointer = V.escapeFragment = V.unescapeFragment = V.schemaRefOrVal = V.schemaHasRulesButRef = V.schemaHasRules = V.checkUnknownRules = V.alwaysValidSchema = V.toHash = void 0;
const _e = ne, P$ = Qs;
function A$(e) {
  const t = {};
  for (const r of e)
    t[r] = !0;
  return t;
}
V.toHash = A$;
function R$(e, t) {
  return typeof t == "boolean" ? t : Object.keys(t).length === 0 ? !0 : (Op(e, t), !Ip(t, e.self.RULES.all));
}
V.alwaysValidSchema = R$;
function Op(e, t = e.schema) {
  const { opts: r, self: n } = e;
  if (!r.strictSchema || typeof t == "boolean")
    return;
  const s = n.RULES.keywords;
  for (const i in t)
    s[i] || Up(e, `unknown keyword: "${i}"`);
}
V.checkUnknownRules = Op;
function Ip(e, t) {
  if (typeof e == "boolean")
    return !e;
  for (const r in e)
    if (t[r])
      return !0;
  return !1;
}
V.schemaHasRules = Ip;
function N$(e, t) {
  if (typeof e == "boolean")
    return !e;
  for (const r in e)
    if (r !== "$ref" && t.all[r])
      return !0;
  return !1;
}
V.schemaHasRulesButRef = N$;
function C$({ topSchemaRef: e, schemaPath: t }, r, n, s) {
  if (!s) {
    if (typeof r == "number" || typeof r == "boolean")
      return r;
    if (typeof r == "string")
      return (0, _e._)`${r}`;
  }
  return (0, _e._)`${e}${t}${(0, _e.getProperty)(n)}`;
}
V.schemaRefOrVal = C$;
function O$(e) {
  return Dp(decodeURIComponent(e));
}
V.unescapeFragment = O$;
function I$(e) {
  return encodeURIComponent(nc(e));
}
V.escapeFragment = I$;
function nc(e) {
  return typeof e == "number" ? `${e}` : e.replace(/~/g, "~0").replace(/\//g, "~1");
}
V.escapeJsonPointer = nc;
function Dp(e) {
  return e.replace(/~1/g, "/").replace(/~0/g, "~");
}
V.unescapeJsonPointer = Dp;
function D$(e, t) {
  if (Array.isArray(e))
    for (const r of e)
      t(r);
  else
    t(e);
}
V.eachItem = D$;
function Bd({ mergeNames: e, mergeToName: t, mergeValues: r, resultToName: n }) {
  return (s, i, a, o) => {
    const l = a === void 0 ? i : a instanceof _e.Name ? (i instanceof _e.Name ? e(s, i, a) : t(s, i, a), a) : i instanceof _e.Name ? (t(s, a, i), i) : r(i, a);
    return o === _e.Name && !(l instanceof _e.Name) ? n(s, l) : l;
  };
}
V.mergeEvaluated = {
  props: Bd({
    mergeNames: (e, t, r) => e.if((0, _e._)`${r} !== true && ${t} !== undefined`, () => {
      e.if((0, _e._)`${t} === true`, () => e.assign(r, !0), () => e.assign(r, (0, _e._)`${r} || {}`).code((0, _e._)`Object.assign(${r}, ${t})`));
    }),
    mergeToName: (e, t, r) => e.if((0, _e._)`${r} !== true`, () => {
      t === !0 ? e.assign(r, !0) : (e.assign(r, (0, _e._)`${r} || {}`), sc(e, r, t));
    }),
    mergeValues: (e, t) => e === !0 ? !0 : { ...e, ...t },
    resultToName: kp
  }),
  items: Bd({
    mergeNames: (e, t, r) => e.if((0, _e._)`${r} !== true && ${t} !== undefined`, () => e.assign(r, (0, _e._)`${t} === true ? true : ${r} > ${t} ? ${r} : ${t}`)),
    mergeToName: (e, t, r) => e.if((0, _e._)`${r} !== true`, () => e.assign(r, t === !0 ? !0 : (0, _e._)`${r} > ${t} ? ${r} : ${t}`)),
    mergeValues: (e, t) => e === !0 ? !0 : Math.max(e, t),
    resultToName: (e, t) => e.var("items", t)
  })
};
function kp(e, t) {
  if (t === !0)
    return e.var("props", !0);
  const r = e.var("props", (0, _e._)`{}`);
  return t !== void 0 && sc(e, r, t), r;
}
V.evaluatedPropsToName = kp;
function sc(e, t, r) {
  Object.keys(r).forEach((n) => e.assign((0, _e._)`${t}${(0, _e.getProperty)(n)}`, !0));
}
V.setEvaluated = sc;
const Hd = {};
function k$(e, t) {
  return e.scopeValue("func", {
    ref: t,
    code: Hd[t.code] || (Hd[t.code] = new P$._Code(t.code))
  });
}
V.useFunc = k$;
var bl;
(function(e) {
  e[e.Num = 0] = "Num", e[e.Str = 1] = "Str";
})(bl || (V.Type = bl = {}));
function U$(e, t, r) {
  if (e instanceof _e.Name) {
    const n = t === bl.Num;
    return r ? n ? (0, _e._)`"[" + ${e} + "]"` : (0, _e._)`"['" + ${e} + "']"` : n ? (0, _e._)`"/" + ${e}` : (0, _e._)`"/" + ${e}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
  }
  return r ? (0, _e.getProperty)(e).toString() : "/" + nc(e);
}
V.getErrorPath = U$;
function Up(e, t, r = e.opts.strictSchema) {
  if (r) {
    if (t = `strict mode: ${t}`, r === !0)
      throw new Error(t);
    e.self.logger.warn(t);
  }
}
V.checkStrictMode = Up;
var Tt = {};
Object.defineProperty(Tt, "__esModule", { value: !0 });
const Ze = ne, F$ = {
  // validation function arguments
  data: new Ze.Name("data"),
  // data passed to validation function
  // args passed from referencing schema
  valCxt: new Ze.Name("valCxt"),
  // validation/data context - should not be used directly, it is destructured to the names below
  instancePath: new Ze.Name("instancePath"),
  parentData: new Ze.Name("parentData"),
  parentDataProperty: new Ze.Name("parentDataProperty"),
  rootData: new Ze.Name("rootData"),
  // root data - same as the data passed to the first/top validation function
  dynamicAnchors: new Ze.Name("dynamicAnchors"),
  // used to support recursiveRef and dynamicRef
  // function scoped variables
  vErrors: new Ze.Name("vErrors"),
  // null or array of validation errors
  errors: new Ze.Name("errors"),
  // counter of validation errors
  this: new Ze.Name("this"),
  // "globals"
  self: new Ze.Name("self"),
  scope: new Ze.Name("scope"),
  // JTD serialize/parse name for JSON string and position
  json: new Ze.Name("json"),
  jsonPos: new Ze.Name("jsonPos"),
  jsonLen: new Ze.Name("jsonLen"),
  jsonPart: new Ze.Name("jsonPart")
};
Tt.default = F$;
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.extendErrors = e.resetErrorsCount = e.reportExtraError = e.reportError = e.keyword$DataError = e.keywordError = void 0;
  const t = ne, r = V, n = Tt;
  e.keywordError = {
    message: ({ keyword: v }) => (0, t.str)`must pass "${v}" keyword validation`
  }, e.keyword$DataError = {
    message: ({ keyword: v, schemaType: g }) => g ? (0, t.str)`"${v}" keyword must be ${g} ($data)` : (0, t.str)`"${v}" keyword is invalid ($data)`
  };
  function s(v, g = e.keywordError, E, N) {
    const { it: O } = v, { gen: U, compositeRule: q, allErrors: B } = O, me = d(v, g, E);
    N ?? (q || B) ? l(U, me) : c(O, (0, t._)`[${me}]`);
  }
  e.reportError = s;
  function i(v, g = e.keywordError, E) {
    const { it: N } = v, { gen: O, compositeRule: U, allErrors: q } = N, B = d(v, g, E);
    l(O, B), U || q || c(N, n.default.vErrors);
  }
  e.reportExtraError = i;
  function a(v, g) {
    v.assign(n.default.errors, g), v.if((0, t._)`${n.default.vErrors} !== null`, () => v.if(g, () => v.assign((0, t._)`${n.default.vErrors}.length`, g), () => v.assign(n.default.vErrors, null)));
  }
  e.resetErrorsCount = a;
  function o({ gen: v, keyword: g, schemaValue: E, data: N, errsCount: O, it: U }) {
    if (O === void 0)
      throw new Error("ajv implementation error");
    const q = v.name("err");
    v.forRange("i", O, n.default.errors, (B) => {
      v.const(q, (0, t._)`${n.default.vErrors}[${B}]`), v.if((0, t._)`${q}.instancePath === undefined`, () => v.assign((0, t._)`${q}.instancePath`, (0, t.strConcat)(n.default.instancePath, U.errorPath))), v.assign((0, t._)`${q}.schemaPath`, (0, t.str)`${U.errSchemaPath}/${g}`), U.opts.verbose && (v.assign((0, t._)`${q}.schema`, E), v.assign((0, t._)`${q}.data`, N));
    });
  }
  e.extendErrors = o;
  function l(v, g) {
    const E = v.const("err", g);
    v.if((0, t._)`${n.default.vErrors} === null`, () => v.assign(n.default.vErrors, (0, t._)`[${E}]`), (0, t._)`${n.default.vErrors}.push(${E})`), v.code((0, t._)`${n.default.errors}++`);
  }
  function c(v, g) {
    const { gen: E, validateName: N, schemaEnv: O } = v;
    O.$async ? E.throw((0, t._)`new ${v.ValidationError}(${g})`) : (E.assign((0, t._)`${N}.errors`, g), E.return(!1));
  }
  const u = {
    keyword: new t.Name("keyword"),
    schemaPath: new t.Name("schemaPath"),
    // also used in JTD errors
    params: new t.Name("params"),
    propertyName: new t.Name("propertyName"),
    message: new t.Name("message"),
    schema: new t.Name("schema"),
    parentSchema: new t.Name("parentSchema")
  };
  function d(v, g, E) {
    const { createErrors: N } = v.it;
    return N === !1 ? (0, t._)`{}` : p(v, g, E);
  }
  function p(v, g, E = {}) {
    const { gen: N, it: O } = v, U = [
      m(O, E),
      _(v, E)
    ];
    return $(v, g, U), N.object(...U);
  }
  function m({ errorPath: v }, { instancePath: g }) {
    const E = g ? (0, t.str)`${v}${(0, r.getErrorPath)(g, r.Type.Str)}` : v;
    return [n.default.instancePath, (0, t.strConcat)(n.default.instancePath, E)];
  }
  function _({ keyword: v, it: { errSchemaPath: g } }, { schemaPath: E, parentSchema: N }) {
    let O = N ? g : (0, t.str)`${g}/${v}`;
    return E && (O = (0, t.str)`${O}${(0, r.getErrorPath)(E, r.Type.Str)}`), [u.schemaPath, O];
  }
  function $(v, { params: g, message: E }, N) {
    const { keyword: O, data: U, schemaValue: q, it: B } = v, { opts: me, propertyName: I, topSchemaRef: ye, schemaPath: W } = B;
    N.push([u.keyword, O], [u.params, typeof g == "function" ? g(v) : g || (0, t._)`{}`]), me.messages && N.push([u.message, typeof E == "function" ? E(v) : E]), me.verbose && N.push([u.schema, q], [u.parentSchema, (0, t._)`${ye}${W}`], [n.default.data, U]), I && N.push([u.propertyName, I]);
  }
})(di);
Object.defineProperty(ts, "__esModule", { value: !0 });
ts.boolOrEmptySchema = ts.topBoolOrEmptySchema = void 0;
const L$ = di, j$ = ne, M$ = Tt, x$ = {
  message: "boolean schema is false"
};
function q$(e) {
  const { gen: t, schema: r, validateName: n } = e;
  r === !1 ? Fp(e, !1) : typeof r == "object" && r.$async === !0 ? t.return(M$.default.data) : (t.assign((0, j$._)`${n}.errors`, null), t.return(!0));
}
ts.topBoolOrEmptySchema = q$;
function V$(e, t) {
  const { gen: r, schema: n } = e;
  n === !1 ? (r.var(t, !1), Fp(e)) : r.var(t, !0);
}
ts.boolOrEmptySchema = V$;
function Fp(e, t) {
  const { gen: r, data: n } = e, s = {
    gen: r,
    keyword: "false schema",
    data: n,
    schema: !1,
    schemaCode: !1,
    schemaValue: !1,
    params: {},
    it: e
  };
  (0, L$.reportError)(s, x$, void 0, t);
}
var Fe = {}, bn = {};
Object.defineProperty(bn, "__esModule", { value: !0 });
bn.getRules = bn.isJSONType = void 0;
const B$ = ["string", "number", "integer", "boolean", "null", "object", "array"], H$ = new Set(B$);
function z$(e) {
  return typeof e == "string" && H$.has(e);
}
bn.isJSONType = z$;
function G$() {
  const e = {
    number: { type: "number", rules: [] },
    string: { type: "string", rules: [] },
    array: { type: "array", rules: [] },
    object: { type: "object", rules: [] }
  };
  return {
    types: { ...e, integer: !0, boolean: !0, null: !0 },
    rules: [{ rules: [] }, e.number, e.string, e.array, e.object],
    post: { rules: [] },
    all: {},
    keywords: {}
  };
}
bn.getRules = G$;
var gr = {};
Object.defineProperty(gr, "__esModule", { value: !0 });
gr.shouldUseRule = gr.shouldUseGroup = gr.schemaHasRulesForType = void 0;
function K$({ schema: e, self: t }, r) {
  const n = t.RULES.types[r];
  return n && n !== !0 && Lp(e, n);
}
gr.schemaHasRulesForType = K$;
function Lp(e, t) {
  return t.rules.some((r) => jp(e, r));
}
gr.shouldUseGroup = Lp;
function jp(e, t) {
  var r;
  return e[t.keyword] !== void 0 || ((r = t.definition.implements) === null || r === void 0 ? void 0 : r.some((n) => e[n] !== void 0));
}
gr.shouldUseRule = jp;
Object.defineProperty(Fe, "__esModule", { value: !0 });
Fe.reportTypeError = Fe.checkDataTypes = Fe.checkDataType = Fe.coerceAndCheckDataType = Fe.getJSONTypes = Fe.getSchemaTypes = Fe.DataType = void 0;
const W$ = bn, Y$ = gr, X$ = di, ae = ne, Mp = V;
var Xn;
(function(e) {
  e[e.Correct = 0] = "Correct", e[e.Wrong = 1] = "Wrong";
})(Xn || (Fe.DataType = Xn = {}));
function J$(e) {
  const t = xp(e.type);
  if (t.includes("null")) {
    if (e.nullable === !1)
      throw new Error("type: null contradicts nullable: false");
  } else {
    if (!t.length && e.nullable !== void 0)
      throw new Error('"nullable" cannot be used without "type"');
    e.nullable === !0 && t.push("null");
  }
  return t;
}
Fe.getSchemaTypes = J$;
function xp(e) {
  const t = Array.isArray(e) ? e : e ? [e] : [];
  if (t.every(W$.isJSONType))
    return t;
  throw new Error("type must be JSONType or JSONType[]: " + t.join(","));
}
Fe.getJSONTypes = xp;
function Q$(e, t) {
  const { gen: r, data: n, opts: s } = e, i = Z$(t, s.coerceTypes), a = t.length > 0 && !(i.length === 0 && t.length === 1 && (0, Y$.schemaHasRulesForType)(e, t[0]));
  if (a) {
    const o = ic(t, n, s.strictNumbers, Xn.Wrong);
    r.if(o, () => {
      i.length ? e_(e, t, i) : ac(e);
    });
  }
  return a;
}
Fe.coerceAndCheckDataType = Q$;
const qp = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
function Z$(e, t) {
  return t ? e.filter((r) => qp.has(r) || t === "array" && r === "array") : [];
}
function e_(e, t, r) {
  const { gen: n, data: s, opts: i } = e, a = n.let("dataType", (0, ae._)`typeof ${s}`), o = n.let("coerced", (0, ae._)`undefined`);
  i.coerceTypes === "array" && n.if((0, ae._)`${a} == 'object' && Array.isArray(${s}) && ${s}.length == 1`, () => n.assign(s, (0, ae._)`${s}[0]`).assign(a, (0, ae._)`typeof ${s}`).if(ic(t, s, i.strictNumbers), () => n.assign(o, s))), n.if((0, ae._)`${o} !== undefined`);
  for (const c of r)
    (qp.has(c) || c === "array" && i.coerceTypes === "array") && l(c);
  n.else(), ac(e), n.endIf(), n.if((0, ae._)`${o} !== undefined`, () => {
    n.assign(s, o), t_(e, o);
  });
  function l(c) {
    switch (c) {
      case "string":
        n.elseIf((0, ae._)`${a} == "number" || ${a} == "boolean"`).assign(o, (0, ae._)`"" + ${s}`).elseIf((0, ae._)`${s} === null`).assign(o, (0, ae._)`""`);
        return;
      case "number":
        n.elseIf((0, ae._)`${a} == "boolean" || ${s} === null
              || (${a} == "string" && ${s} && ${s} == +${s})`).assign(o, (0, ae._)`+${s}`);
        return;
      case "integer":
        n.elseIf((0, ae._)`${a} === "boolean" || ${s} === null
              || (${a} === "string" && ${s} && ${s} == +${s} && !(${s} % 1))`).assign(o, (0, ae._)`+${s}`);
        return;
      case "boolean":
        n.elseIf((0, ae._)`${s} === "false" || ${s} === 0 || ${s} === null`).assign(o, !1).elseIf((0, ae._)`${s} === "true" || ${s} === 1`).assign(o, !0);
        return;
      case "null":
        n.elseIf((0, ae._)`${s} === "" || ${s} === 0 || ${s} === false`), n.assign(o, null);
        return;
      case "array":
        n.elseIf((0, ae._)`${a} === "string" || ${a} === "number"
              || ${a} === "boolean" || ${s} === null`).assign(o, (0, ae._)`[${s}]`);
    }
  }
}
function t_({ gen: e, parentData: t, parentDataProperty: r }, n) {
  e.if((0, ae._)`${t} !== undefined`, () => e.assign((0, ae._)`${t}[${r}]`, n));
}
function Sl(e, t, r, n = Xn.Correct) {
  const s = n === Xn.Correct ? ae.operators.EQ : ae.operators.NEQ;
  let i;
  switch (e) {
    case "null":
      return (0, ae._)`${t} ${s} null`;
    case "array":
      i = (0, ae._)`Array.isArray(${t})`;
      break;
    case "object":
      i = (0, ae._)`${t} && typeof ${t} == "object" && !Array.isArray(${t})`;
      break;
    case "integer":
      i = a((0, ae._)`!(${t} % 1) && !isNaN(${t})`);
      break;
    case "number":
      i = a();
      break;
    default:
      return (0, ae._)`typeof ${t} ${s} ${e}`;
  }
  return n === Xn.Correct ? i : (0, ae.not)(i);
  function a(o = ae.nil) {
    return (0, ae.and)((0, ae._)`typeof ${t} == "number"`, o, r ? (0, ae._)`isFinite(${t})` : ae.nil);
  }
}
Fe.checkDataType = Sl;
function ic(e, t, r, n) {
  if (e.length === 1)
    return Sl(e[0], t, r, n);
  let s;
  const i = (0, Mp.toHash)(e);
  if (i.array && i.object) {
    const a = (0, ae._)`typeof ${t} != "object"`;
    s = i.null ? a : (0, ae._)`!${t} || ${a}`, delete i.null, delete i.array, delete i.object;
  } else
    s = ae.nil;
  i.number && delete i.integer;
  for (const a in i)
    s = (0, ae.and)(s, Sl(a, t, r, n));
  return s;
}
Fe.checkDataTypes = ic;
const r_ = {
  message: ({ schema: e }) => `must be ${e}`,
  params: ({ schema: e, schemaValue: t }) => typeof e == "string" ? (0, ae._)`{type: ${e}}` : (0, ae._)`{type: ${t}}`
};
function ac(e) {
  const t = n_(e);
  (0, X$.reportError)(t, r_);
}
Fe.reportTypeError = ac;
function n_(e) {
  const { gen: t, data: r, schema: n } = e, s = (0, Mp.schemaRefOrVal)(e, n, "type");
  return {
    gen: t,
    keyword: "type",
    data: r,
    schema: n.type,
    schemaCode: s,
    schemaValue: s,
    parentSchema: n,
    params: {},
    it: e
  };
}
var Ha = {};
Object.defineProperty(Ha, "__esModule", { value: !0 });
Ha.assignDefaults = void 0;
const Cn = ne, s_ = V;
function i_(e, t) {
  const { properties: r, items: n } = e.schema;
  if (t === "object" && r)
    for (const s in r)
      zd(e, s, r[s].default);
  else t === "array" && Array.isArray(n) && n.forEach((s, i) => zd(e, i, s.default));
}
Ha.assignDefaults = i_;
function zd(e, t, r) {
  const { gen: n, compositeRule: s, data: i, opts: a } = e;
  if (r === void 0)
    return;
  const o = (0, Cn._)`${i}${(0, Cn.getProperty)(t)}`;
  if (s) {
    (0, s_.checkStrictMode)(e, `default is ignored for: ${o}`);
    return;
  }
  let l = (0, Cn._)`${o} === undefined`;
  a.useDefaults === "empty" && (l = (0, Cn._)`${l} || ${o} === null || ${o} === ""`), n.if(l, (0, Cn._)`${o} = ${(0, Cn.stringify)(r)}`);
}
var er = {}, ue = {};
Object.defineProperty(ue, "__esModule", { value: !0 });
ue.validateUnion = ue.validateArray = ue.usePattern = ue.callValidateCode = ue.schemaProperties = ue.allSchemaProperties = ue.noPropertyInData = ue.propertyInData = ue.isOwnProperty = ue.hasPropFunc = ue.reportMissingProp = ue.checkMissingProp = ue.checkReportMissingProp = void 0;
const Se = ne, oc = V, Ir = Tt, a_ = V;
function o_(e, t) {
  const { gen: r, data: n, it: s } = e;
  r.if(cc(r, n, t, s.opts.ownProperties), () => {
    e.setParams({ missingProperty: (0, Se._)`${t}` }, !0), e.error();
  });
}
ue.checkReportMissingProp = o_;
function l_({ gen: e, data: t, it: { opts: r } }, n, s) {
  return (0, Se.or)(...n.map((i) => (0, Se.and)(cc(e, t, i, r.ownProperties), (0, Se._)`${s} = ${i}`)));
}
ue.checkMissingProp = l_;
function c_(e, t) {
  e.setParams({ missingProperty: t }, !0), e.error();
}
ue.reportMissingProp = c_;
function Vp(e) {
  return e.scopeValue("func", {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    ref: Object.prototype.hasOwnProperty,
    code: (0, Se._)`Object.prototype.hasOwnProperty`
  });
}
ue.hasPropFunc = Vp;
function lc(e, t, r) {
  return (0, Se._)`${Vp(e)}.call(${t}, ${r})`;
}
ue.isOwnProperty = lc;
function u_(e, t, r, n) {
  const s = (0, Se._)`${t}${(0, Se.getProperty)(r)} !== undefined`;
  return n ? (0, Se._)`${s} && ${lc(e, t, r)}` : s;
}
ue.propertyInData = u_;
function cc(e, t, r, n) {
  const s = (0, Se._)`${t}${(0, Se.getProperty)(r)} === undefined`;
  return n ? (0, Se.or)(s, (0, Se.not)(lc(e, t, r))) : s;
}
ue.noPropertyInData = cc;
function Bp(e) {
  return e ? Object.keys(e).filter((t) => t !== "__proto__") : [];
}
ue.allSchemaProperties = Bp;
function d_(e, t) {
  return Bp(t).filter((r) => !(0, oc.alwaysValidSchema)(e, t[r]));
}
ue.schemaProperties = d_;
function f_({ schemaCode: e, data: t, it: { gen: r, topSchemaRef: n, schemaPath: s, errorPath: i }, it: a }, o, l, c) {
  const u = c ? (0, Se._)`${e}, ${t}, ${n}${s}` : t, d = [
    [Ir.default.instancePath, (0, Se.strConcat)(Ir.default.instancePath, i)],
    [Ir.default.parentData, a.parentData],
    [Ir.default.parentDataProperty, a.parentDataProperty],
    [Ir.default.rootData, Ir.default.rootData]
  ];
  a.opts.dynamicRef && d.push([Ir.default.dynamicAnchors, Ir.default.dynamicAnchors]);
  const p = (0, Se._)`${u}, ${r.object(...d)}`;
  return l !== Se.nil ? (0, Se._)`${o}.call(${l}, ${p})` : (0, Se._)`${o}(${p})`;
}
ue.callValidateCode = f_;
const h_ = (0, Se._)`new RegExp`;
function p_({ gen: e, it: { opts: t } }, r) {
  const n = t.unicodeRegExp ? "u" : "", { regExp: s } = t.code, i = s(r, n);
  return e.scopeValue("pattern", {
    key: i.toString(),
    ref: i,
    code: (0, Se._)`${s.code === "new RegExp" ? h_ : (0, a_.useFunc)(e, s)}(${r}, ${n})`
  });
}
ue.usePattern = p_;
function m_(e) {
  const { gen: t, data: r, keyword: n, it: s } = e, i = t.name("valid");
  if (s.allErrors) {
    const o = t.let("valid", !0);
    return a(() => t.assign(o, !1)), o;
  }
  return t.var(i, !0), a(() => t.break()), i;
  function a(o) {
    const l = t.const("len", (0, Se._)`${r}.length`);
    t.forRange("i", 0, l, (c) => {
      e.subschema({
        keyword: n,
        dataProp: c,
        dataPropType: oc.Type.Num
      }, i), t.if((0, Se.not)(i), o);
    });
  }
}
ue.validateArray = m_;
function g_(e) {
  const { gen: t, schema: r, keyword: n, it: s } = e;
  if (!Array.isArray(r))
    throw new Error("ajv implementation error");
  if (r.some((l) => (0, oc.alwaysValidSchema)(s, l)) && !s.opts.unevaluated)
    return;
  const a = t.let("valid", !1), o = t.name("_valid");
  t.block(() => r.forEach((l, c) => {
    const u = e.subschema({
      keyword: n,
      schemaProp: c,
      compositeRule: !0
    }, o);
    t.assign(a, (0, Se._)`${a} || ${o}`), e.mergeValidEvaluated(u, o) || t.if((0, Se.not)(a));
  })), e.result(a, () => e.reset(), () => e.error(!0));
}
ue.validateUnion = g_;
Object.defineProperty(er, "__esModule", { value: !0 });
er.validateKeywordUsage = er.validSchemaType = er.funcKeywordCode = er.macroKeywordCode = void 0;
const lt = ne, un = Tt, y_ = ue, $_ = di;
function __(e, t) {
  const { gen: r, keyword: n, schema: s, parentSchema: i, it: a } = e, o = t.macro.call(a.self, s, i, a), l = Hp(r, n, o);
  a.opts.validateSchema !== !1 && a.self.validateSchema(o, !0);
  const c = r.name("valid");
  e.subschema({
    schema: o,
    schemaPath: lt.nil,
    errSchemaPath: `${a.errSchemaPath}/${n}`,
    topSchemaRef: l,
    compositeRule: !0
  }, c), e.pass(c, () => e.error(!0));
}
er.macroKeywordCode = __;
function v_(e, t) {
  var r;
  const { gen: n, keyword: s, schema: i, parentSchema: a, $data: o, it: l } = e;
  E_(l, t);
  const c = !o && t.compile ? t.compile.call(l.self, i, a, l) : t.validate, u = Hp(n, s, c), d = n.let("valid");
  e.block$data(d, p), e.ok((r = t.valid) !== null && r !== void 0 ? r : d);
  function p() {
    if (t.errors === !1)
      $(), t.modifying && Gd(e), v(() => e.error());
    else {
      const g = t.async ? m() : _();
      t.modifying && Gd(e), v(() => w_(e, g));
    }
  }
  function m() {
    const g = n.let("ruleErrs", null);
    return n.try(() => $((0, lt._)`await `), (E) => n.assign(d, !1).if((0, lt._)`${E} instanceof ${l.ValidationError}`, () => n.assign(g, (0, lt._)`${E}.errors`), () => n.throw(E))), g;
  }
  function _() {
    const g = (0, lt._)`${u}.errors`;
    return n.assign(g, null), $(lt.nil), g;
  }
  function $(g = t.async ? (0, lt._)`await ` : lt.nil) {
    const E = l.opts.passContext ? un.default.this : un.default.self, N = !("compile" in t && !o || t.schema === !1);
    n.assign(d, (0, lt._)`${g}${(0, y_.callValidateCode)(e, u, E, N)}`, t.modifying);
  }
  function v(g) {
    var E;
    n.if((0, lt.not)((E = t.valid) !== null && E !== void 0 ? E : d), g);
  }
}
er.funcKeywordCode = v_;
function Gd(e) {
  const { gen: t, data: r, it: n } = e;
  t.if(n.parentData, () => t.assign(r, (0, lt._)`${n.parentData}[${n.parentDataProperty}]`));
}
function w_(e, t) {
  const { gen: r } = e;
  r.if((0, lt._)`Array.isArray(${t})`, () => {
    r.assign(un.default.vErrors, (0, lt._)`${un.default.vErrors} === null ? ${t} : ${un.default.vErrors}.concat(${t})`).assign(un.default.errors, (0, lt._)`${un.default.vErrors}.length`), (0, $_.extendErrors)(e);
  }, () => e.error());
}
function E_({ schemaEnv: e }, t) {
  if (t.async && !e.$async)
    throw new Error("async keyword in sync schema");
}
function Hp(e, t, r) {
  if (r === void 0)
    throw new Error(`keyword "${t}" failed to compile`);
  return e.scopeValue("keyword", typeof r == "function" ? { ref: r } : { ref: r, code: (0, lt.stringify)(r) });
}
function b_(e, t, r = !1) {
  return !t.length || t.some((n) => n === "array" ? Array.isArray(e) : n === "object" ? e && typeof e == "object" && !Array.isArray(e) : typeof e == n || r && typeof e > "u");
}
er.validSchemaType = b_;
function S_({ schema: e, opts: t, self: r, errSchemaPath: n }, s, i) {
  if (Array.isArray(s.keyword) ? !s.keyword.includes(i) : s.keyword !== i)
    throw new Error("ajv implementation error");
  const a = s.dependencies;
  if (a != null && a.some((o) => !Object.prototype.hasOwnProperty.call(e, o)))
    throw new Error(`parent schema must have dependencies of ${i}: ${a.join(",")}`);
  if (s.validateSchema && !s.validateSchema(e[i])) {
    const l = `keyword "${i}" value is invalid at path "${n}": ` + r.errorsText(s.validateSchema.errors);
    if (t.validateSchema === "log")
      r.logger.error(l);
    else
      throw new Error(l);
  }
}
er.validateKeywordUsage = S_;
var Br = {};
Object.defineProperty(Br, "__esModule", { value: !0 });
Br.extendSubschemaMode = Br.extendSubschemaData = Br.getSubschema = void 0;
const Qt = ne, zp = V;
function T_(e, { keyword: t, schemaProp: r, schema: n, schemaPath: s, errSchemaPath: i, topSchemaRef: a }) {
  if (t !== void 0 && n !== void 0)
    throw new Error('both "keyword" and "schema" passed, only one allowed');
  if (t !== void 0) {
    const o = e.schema[t];
    return r === void 0 ? {
      schema: o,
      schemaPath: (0, Qt._)`${e.schemaPath}${(0, Qt.getProperty)(t)}`,
      errSchemaPath: `${e.errSchemaPath}/${t}`
    } : {
      schema: o[r],
      schemaPath: (0, Qt._)`${e.schemaPath}${(0, Qt.getProperty)(t)}${(0, Qt.getProperty)(r)}`,
      errSchemaPath: `${e.errSchemaPath}/${t}/${(0, zp.escapeFragment)(r)}`
    };
  }
  if (n !== void 0) {
    if (s === void 0 || i === void 0 || a === void 0)
      throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
    return {
      schema: n,
      schemaPath: s,
      topSchemaRef: a,
      errSchemaPath: i
    };
  }
  throw new Error('either "keyword" or "schema" must be passed');
}
Br.getSubschema = T_;
function P_(e, t, { dataProp: r, dataPropType: n, data: s, dataTypes: i, propertyName: a }) {
  if (s !== void 0 && r !== void 0)
    throw new Error('both "data" and "dataProp" passed, only one allowed');
  const { gen: o } = t;
  if (r !== void 0) {
    const { errorPath: c, dataPathArr: u, opts: d } = t, p = o.let("data", (0, Qt._)`${t.data}${(0, Qt.getProperty)(r)}`, !0);
    l(p), e.errorPath = (0, Qt.str)`${c}${(0, zp.getErrorPath)(r, n, d.jsPropertySyntax)}`, e.parentDataProperty = (0, Qt._)`${r}`, e.dataPathArr = [...u, e.parentDataProperty];
  }
  if (s !== void 0) {
    const c = s instanceof Qt.Name ? s : o.let("data", s, !0);
    l(c), a !== void 0 && (e.propertyName = a);
  }
  i && (e.dataTypes = i);
  function l(c) {
    e.data = c, e.dataLevel = t.dataLevel + 1, e.dataTypes = [], t.definedProperties = /* @__PURE__ */ new Set(), e.parentData = t.data, e.dataNames = [...t.dataNames, c];
  }
}
Br.extendSubschemaData = P_;
function A_(e, { jtdDiscriminator: t, jtdMetadata: r, compositeRule: n, createErrors: s, allErrors: i }) {
  n !== void 0 && (e.compositeRule = n), s !== void 0 && (e.createErrors = s), i !== void 0 && (e.allErrors = i), e.jtdDiscriminator = t, e.jtdMetadata = r;
}
Br.extendSubschemaMode = A_;
var Ke = {}, za = function e(t, r) {
  if (t === r) return !0;
  if (t && r && typeof t == "object" && typeof r == "object") {
    if (t.constructor !== r.constructor) return !1;
    var n, s, i;
    if (Array.isArray(t)) {
      if (n = t.length, n != r.length) return !1;
      for (s = n; s-- !== 0; )
        if (!e(t[s], r[s])) return !1;
      return !0;
    }
    if (t.constructor === RegExp) return t.source === r.source && t.flags === r.flags;
    if (t.valueOf !== Object.prototype.valueOf) return t.valueOf() === r.valueOf();
    if (t.toString !== Object.prototype.toString) return t.toString() === r.toString();
    if (i = Object.keys(t), n = i.length, n !== Object.keys(r).length) return !1;
    for (s = n; s-- !== 0; )
      if (!Object.prototype.hasOwnProperty.call(r, i[s])) return !1;
    for (s = n; s-- !== 0; ) {
      var a = i[s];
      if (!e(t[a], r[a])) return !1;
    }
    return !0;
  }
  return t !== t && r !== r;
}, Gp = { exports: {} }, qr = Gp.exports = function(e, t, r) {
  typeof t == "function" && (r = t, t = {}), r = t.cb || r;
  var n = typeof r == "function" ? r : r.pre || function() {
  }, s = r.post || function() {
  };
  oa(t, n, s, e, "", e);
};
qr.keywords = {
  additionalItems: !0,
  items: !0,
  contains: !0,
  additionalProperties: !0,
  propertyNames: !0,
  not: !0,
  if: !0,
  then: !0,
  else: !0
};
qr.arrayKeywords = {
  items: !0,
  allOf: !0,
  anyOf: !0,
  oneOf: !0
};
qr.propsKeywords = {
  $defs: !0,
  definitions: !0,
  properties: !0,
  patternProperties: !0,
  dependencies: !0
};
qr.skipKeywords = {
  default: !0,
  enum: !0,
  const: !0,
  required: !0,
  maximum: !0,
  minimum: !0,
  exclusiveMaximum: !0,
  exclusiveMinimum: !0,
  multipleOf: !0,
  maxLength: !0,
  minLength: !0,
  pattern: !0,
  format: !0,
  maxItems: !0,
  minItems: !0,
  uniqueItems: !0,
  maxProperties: !0,
  minProperties: !0
};
function oa(e, t, r, n, s, i, a, o, l, c) {
  if (n && typeof n == "object" && !Array.isArray(n)) {
    t(n, s, i, a, o, l, c);
    for (var u in n) {
      var d = n[u];
      if (Array.isArray(d)) {
        if (u in qr.arrayKeywords)
          for (var p = 0; p < d.length; p++)
            oa(e, t, r, d[p], s + "/" + u + "/" + p, i, s, u, n, p);
      } else if (u in qr.propsKeywords) {
        if (d && typeof d == "object")
          for (var m in d)
            oa(e, t, r, d[m], s + "/" + u + "/" + R_(m), i, s, u, n, m);
      } else (u in qr.keywords || e.allKeys && !(u in qr.skipKeywords)) && oa(e, t, r, d, s + "/" + u, i, s, u, n);
    }
    r(n, s, i, a, o, l, c);
  }
}
function R_(e) {
  return e.replace(/~/g, "~0").replace(/\//g, "~1");
}
var N_ = Gp.exports;
Object.defineProperty(Ke, "__esModule", { value: !0 });
Ke.getSchemaRefs = Ke.resolveUrl = Ke.normalizeId = Ke._getFullPath = Ke.getFullPath = Ke.inlineRef = void 0;
const C_ = V, O_ = za, I_ = N_, D_ = /* @__PURE__ */ new Set([
  "type",
  "format",
  "pattern",
  "maxLength",
  "minLength",
  "maxProperties",
  "minProperties",
  "maxItems",
  "minItems",
  "maximum",
  "minimum",
  "uniqueItems",
  "multipleOf",
  "required",
  "enum",
  "const"
]);
function k_(e, t = !0) {
  return typeof e == "boolean" ? !0 : t === !0 ? !Tl(e) : t ? Kp(e) <= t : !1;
}
Ke.inlineRef = k_;
const U_ = /* @__PURE__ */ new Set([
  "$ref",
  "$recursiveRef",
  "$recursiveAnchor",
  "$dynamicRef",
  "$dynamicAnchor"
]);
function Tl(e) {
  for (const t in e) {
    if (U_.has(t))
      return !0;
    const r = e[t];
    if (Array.isArray(r) && r.some(Tl) || typeof r == "object" && Tl(r))
      return !0;
  }
  return !1;
}
function Kp(e) {
  let t = 0;
  for (const r in e) {
    if (r === "$ref")
      return 1 / 0;
    if (t++, !D_.has(r) && (typeof e[r] == "object" && (0, C_.eachItem)(e[r], (n) => t += Kp(n)), t === 1 / 0))
      return 1 / 0;
  }
  return t;
}
function Wp(e, t = "", r) {
  r !== !1 && (t = Jn(t));
  const n = e.parse(t);
  return Yp(e, n);
}
Ke.getFullPath = Wp;
function Yp(e, t) {
  return e.serialize(t).split("#")[0] + "#";
}
Ke._getFullPath = Yp;
const F_ = /#\/?$/;
function Jn(e) {
  return e ? e.replace(F_, "") : "";
}
Ke.normalizeId = Jn;
function L_(e, t, r) {
  return r = Jn(r), e.resolve(t, r);
}
Ke.resolveUrl = L_;
const j_ = /^[a-z_][-a-z0-9._]*$/i;
function M_(e, t) {
  if (typeof e == "boolean")
    return {};
  const { schemaId: r, uriResolver: n } = this.opts, s = Jn(e[r] || t), i = { "": s }, a = Wp(n, s, !1), o = {}, l = /* @__PURE__ */ new Set();
  return I_(e, { allKeys: !0 }, (d, p, m, _) => {
    if (_ === void 0)
      return;
    const $ = a + p;
    let v = i[_];
    typeof d[r] == "string" && (v = g.call(this, d[r])), E.call(this, d.$anchor), E.call(this, d.$dynamicAnchor), i[p] = v;
    function g(N) {
      const O = this.opts.uriResolver.resolve;
      if (N = Jn(v ? O(v, N) : N), l.has(N))
        throw u(N);
      l.add(N);
      let U = this.refs[N];
      return typeof U == "string" && (U = this.refs[U]), typeof U == "object" ? c(d, U.schema, N) : N !== Jn($) && (N[0] === "#" ? (c(d, o[N], N), o[N] = d) : this.refs[N] = $), N;
    }
    function E(N) {
      if (typeof N == "string") {
        if (!j_.test(N))
          throw new Error(`invalid anchor "${N}"`);
        g.call(this, `#${N}`);
      }
    }
  }), o;
  function c(d, p, m) {
    if (p !== void 0 && !O_(d, p))
      throw u(m);
  }
  function u(d) {
    return new Error(`reference "${d}" resolves to more than one schema`);
  }
}
Ke.getSchemaRefs = M_;
Object.defineProperty(Ht, "__esModule", { value: !0 });
Ht.getData = Ht.KeywordCxt = Ht.validateFunctionCode = void 0;
const Xp = ts, Kd = Fe, uc = gr, _a = Fe, x_ = Ha, xs = er, Oo = Br, J = ne, te = Tt, q_ = Ke, yr = V, Ps = di;
function V_(e) {
  if (Zp(e) && (em(e), Qp(e))) {
    z_(e);
    return;
  }
  Jp(e, () => (0, Xp.topBoolOrEmptySchema)(e));
}
Ht.validateFunctionCode = V_;
function Jp({ gen: e, validateName: t, schema: r, schemaEnv: n, opts: s }, i) {
  s.code.es5 ? e.func(t, (0, J._)`${te.default.data}, ${te.default.valCxt}`, n.$async, () => {
    e.code((0, J._)`"use strict"; ${Wd(r, s)}`), H_(e, s), e.code(i);
  }) : e.func(t, (0, J._)`${te.default.data}, ${B_(s)}`, n.$async, () => e.code(Wd(r, s)).code(i));
}
function B_(e) {
  return (0, J._)`{${te.default.instancePath}="", ${te.default.parentData}, ${te.default.parentDataProperty}, ${te.default.rootData}=${te.default.data}${e.dynamicRef ? (0, J._)`, ${te.default.dynamicAnchors}={}` : J.nil}}={}`;
}
function H_(e, t) {
  e.if(te.default.valCxt, () => {
    e.var(te.default.instancePath, (0, J._)`${te.default.valCxt}.${te.default.instancePath}`), e.var(te.default.parentData, (0, J._)`${te.default.valCxt}.${te.default.parentData}`), e.var(te.default.parentDataProperty, (0, J._)`${te.default.valCxt}.${te.default.parentDataProperty}`), e.var(te.default.rootData, (0, J._)`${te.default.valCxt}.${te.default.rootData}`), t.dynamicRef && e.var(te.default.dynamicAnchors, (0, J._)`${te.default.valCxt}.${te.default.dynamicAnchors}`);
  }, () => {
    e.var(te.default.instancePath, (0, J._)`""`), e.var(te.default.parentData, (0, J._)`undefined`), e.var(te.default.parentDataProperty, (0, J._)`undefined`), e.var(te.default.rootData, te.default.data), t.dynamicRef && e.var(te.default.dynamicAnchors, (0, J._)`{}`);
  });
}
function z_(e) {
  const { schema: t, opts: r, gen: n } = e;
  Jp(e, () => {
    r.$comment && t.$comment && rm(e), X_(e), n.let(te.default.vErrors, null), n.let(te.default.errors, 0), r.unevaluated && G_(e), tm(e), Z_(e);
  });
}
function G_(e) {
  const { gen: t, validateName: r } = e;
  e.evaluated = t.const("evaluated", (0, J._)`${r}.evaluated`), t.if((0, J._)`${e.evaluated}.dynamicProps`, () => t.assign((0, J._)`${e.evaluated}.props`, (0, J._)`undefined`)), t.if((0, J._)`${e.evaluated}.dynamicItems`, () => t.assign((0, J._)`${e.evaluated}.items`, (0, J._)`undefined`));
}
function Wd(e, t) {
  const r = typeof e == "object" && e[t.schemaId];
  return r && (t.code.source || t.code.process) ? (0, J._)`/*# sourceURL=${r} */` : J.nil;
}
function K_(e, t) {
  if (Zp(e) && (em(e), Qp(e))) {
    W_(e, t);
    return;
  }
  (0, Xp.boolOrEmptySchema)(e, t);
}
function Qp({ schema: e, self: t }) {
  if (typeof e == "boolean")
    return !e;
  for (const r in e)
    if (t.RULES.all[r])
      return !0;
  return !1;
}
function Zp(e) {
  return typeof e.schema != "boolean";
}
function W_(e, t) {
  const { schema: r, gen: n, opts: s } = e;
  s.$comment && r.$comment && rm(e), J_(e), Q_(e);
  const i = n.const("_errs", te.default.errors);
  tm(e, i), n.var(t, (0, J._)`${i} === ${te.default.errors}`);
}
function em(e) {
  (0, yr.checkUnknownRules)(e), Y_(e);
}
function tm(e, t) {
  if (e.opts.jtd)
    return Yd(e, [], !1, t);
  const r = (0, Kd.getSchemaTypes)(e.schema), n = (0, Kd.coerceAndCheckDataType)(e, r);
  Yd(e, r, !n, t);
}
function Y_(e) {
  const { schema: t, errSchemaPath: r, opts: n, self: s } = e;
  t.$ref && n.ignoreKeywordsWithRef && (0, yr.schemaHasRulesButRef)(t, s.RULES) && s.logger.warn(`$ref: keywords ignored in schema at path "${r}"`);
}
function X_(e) {
  const { schema: t, opts: r } = e;
  t.default !== void 0 && r.useDefaults && r.strictSchema && (0, yr.checkStrictMode)(e, "default is ignored in the schema root");
}
function J_(e) {
  const t = e.schema[e.opts.schemaId];
  t && (e.baseId = (0, q_.resolveUrl)(e.opts.uriResolver, e.baseId, t));
}
function Q_(e) {
  if (e.schema.$async && !e.schemaEnv.$async)
    throw new Error("async schema in sync schema");
}
function rm({ gen: e, schemaEnv: t, schema: r, errSchemaPath: n, opts: s }) {
  const i = r.$comment;
  if (s.$comment === !0)
    e.code((0, J._)`${te.default.self}.logger.log(${i})`);
  else if (typeof s.$comment == "function") {
    const a = (0, J.str)`${n}/$comment`, o = e.scopeValue("root", { ref: t.root });
    e.code((0, J._)`${te.default.self}.opts.$comment(${i}, ${a}, ${o}.schema)`);
  }
}
function Z_(e) {
  const { gen: t, schemaEnv: r, validateName: n, ValidationError: s, opts: i } = e;
  r.$async ? t.if((0, J._)`${te.default.errors} === 0`, () => t.return(te.default.data), () => t.throw((0, J._)`new ${s}(${te.default.vErrors})`)) : (t.assign((0, J._)`${n}.errors`, te.default.vErrors), i.unevaluated && ev(e), t.return((0, J._)`${te.default.errors} === 0`));
}
function ev({ gen: e, evaluated: t, props: r, items: n }) {
  r instanceof J.Name && e.assign((0, J._)`${t}.props`, r), n instanceof J.Name && e.assign((0, J._)`${t}.items`, n);
}
function Yd(e, t, r, n) {
  const { gen: s, schema: i, data: a, allErrors: o, opts: l, self: c } = e, { RULES: u } = c;
  if (i.$ref && (l.ignoreKeywordsWithRef || !(0, yr.schemaHasRulesButRef)(i, u))) {
    s.block(() => im(e, "$ref", u.all.$ref.definition));
    return;
  }
  l.jtd || tv(e, t), s.block(() => {
    for (const p of u.rules)
      d(p);
    d(u.post);
  });
  function d(p) {
    (0, uc.shouldUseGroup)(i, p) && (p.type ? (s.if((0, _a.checkDataType)(p.type, a, l.strictNumbers)), Xd(e, p), t.length === 1 && t[0] === p.type && r && (s.else(), (0, _a.reportTypeError)(e)), s.endIf()) : Xd(e, p), o || s.if((0, J._)`${te.default.errors} === ${n || 0}`));
  }
}
function Xd(e, t) {
  const { gen: r, schema: n, opts: { useDefaults: s } } = e;
  s && (0, x_.assignDefaults)(e, t.type), r.block(() => {
    for (const i of t.rules)
      (0, uc.shouldUseRule)(n, i) && im(e, i.keyword, i.definition, t.type);
  });
}
function tv(e, t) {
  e.schemaEnv.meta || !e.opts.strictTypes || (rv(e, t), e.opts.allowUnionTypes || nv(e, t), sv(e, e.dataTypes));
}
function rv(e, t) {
  if (t.length) {
    if (!e.dataTypes.length) {
      e.dataTypes = t;
      return;
    }
    t.forEach((r) => {
      nm(e.dataTypes, r) || dc(e, `type "${r}" not allowed by context "${e.dataTypes.join(",")}"`);
    }), av(e, t);
  }
}
function nv(e, t) {
  t.length > 1 && !(t.length === 2 && t.includes("null")) && dc(e, "use allowUnionTypes to allow union type keyword");
}
function sv(e, t) {
  const r = e.self.RULES.all;
  for (const n in r) {
    const s = r[n];
    if (typeof s == "object" && (0, uc.shouldUseRule)(e.schema, s)) {
      const { type: i } = s.definition;
      i.length && !i.some((a) => iv(t, a)) && dc(e, `missing type "${i.join(",")}" for keyword "${n}"`);
    }
  }
}
function iv(e, t) {
  return e.includes(t) || t === "number" && e.includes("integer");
}
function nm(e, t) {
  return e.includes(t) || t === "integer" && e.includes("number");
}
function av(e, t) {
  const r = [];
  for (const n of e.dataTypes)
    nm(t, n) ? r.push(n) : t.includes("integer") && n === "number" && r.push("integer");
  e.dataTypes = r;
}
function dc(e, t) {
  const r = e.schemaEnv.baseId + e.errSchemaPath;
  t += ` at "${r}" (strictTypes)`, (0, yr.checkStrictMode)(e, t, e.opts.strictTypes);
}
let sm = class {
  constructor(t, r, n) {
    if ((0, xs.validateKeywordUsage)(t, r, n), this.gen = t.gen, this.allErrors = t.allErrors, this.keyword = n, this.data = t.data, this.schema = t.schema[n], this.$data = r.$data && t.opts.$data && this.schema && this.schema.$data, this.schemaValue = (0, yr.schemaRefOrVal)(t, this.schema, n, this.$data), this.schemaType = r.schemaType, this.parentSchema = t.schema, this.params = {}, this.it = t, this.def = r, this.$data)
      this.schemaCode = t.gen.const("vSchema", am(this.$data, t));
    else if (this.schemaCode = this.schemaValue, !(0, xs.validSchemaType)(this.schema, r.schemaType, r.allowUndefined))
      throw new Error(`${n} value must be ${JSON.stringify(r.schemaType)}`);
    ("code" in r ? r.trackErrors : r.errors !== !1) && (this.errsCount = t.gen.const("_errs", te.default.errors));
  }
  result(t, r, n) {
    this.failResult((0, J.not)(t), r, n);
  }
  failResult(t, r, n) {
    this.gen.if(t), n ? n() : this.error(), r ? (this.gen.else(), r(), this.allErrors && this.gen.endIf()) : this.allErrors ? this.gen.endIf() : this.gen.else();
  }
  pass(t, r) {
    this.failResult((0, J.not)(t), void 0, r);
  }
  fail(t) {
    if (t === void 0) {
      this.error(), this.allErrors || this.gen.if(!1);
      return;
    }
    this.gen.if(t), this.error(), this.allErrors ? this.gen.endIf() : this.gen.else();
  }
  fail$data(t) {
    if (!this.$data)
      return this.fail(t);
    const { schemaCode: r } = this;
    this.fail((0, J._)`${r} !== undefined && (${(0, J.or)(this.invalid$data(), t)})`);
  }
  error(t, r, n) {
    if (r) {
      this.setParams(r), this._error(t, n), this.setParams({});
      return;
    }
    this._error(t, n);
  }
  _error(t, r) {
    (t ? Ps.reportExtraError : Ps.reportError)(this, this.def.error, r);
  }
  $dataError() {
    (0, Ps.reportError)(this, this.def.$dataError || Ps.keyword$DataError);
  }
  reset() {
    if (this.errsCount === void 0)
      throw new Error('add "trackErrors" to keyword definition');
    (0, Ps.resetErrorsCount)(this.gen, this.errsCount);
  }
  ok(t) {
    this.allErrors || this.gen.if(t);
  }
  setParams(t, r) {
    r ? Object.assign(this.params, t) : this.params = t;
  }
  block$data(t, r, n = J.nil) {
    this.gen.block(() => {
      this.check$data(t, n), r();
    });
  }
  check$data(t = J.nil, r = J.nil) {
    if (!this.$data)
      return;
    const { gen: n, schemaCode: s, schemaType: i, def: a } = this;
    n.if((0, J.or)((0, J._)`${s} === undefined`, r)), t !== J.nil && n.assign(t, !0), (i.length || a.validateSchema) && (n.elseIf(this.invalid$data()), this.$dataError(), t !== J.nil && n.assign(t, !1)), n.else();
  }
  invalid$data() {
    const { gen: t, schemaCode: r, schemaType: n, def: s, it: i } = this;
    return (0, J.or)(a(), o());
    function a() {
      if (n.length) {
        if (!(r instanceof J.Name))
          throw new Error("ajv implementation error");
        const l = Array.isArray(n) ? n : [n];
        return (0, J._)`${(0, _a.checkDataTypes)(l, r, i.opts.strictNumbers, _a.DataType.Wrong)}`;
      }
      return J.nil;
    }
    function o() {
      if (s.validateSchema) {
        const l = t.scopeValue("validate$data", { ref: s.validateSchema });
        return (0, J._)`!${l}(${r})`;
      }
      return J.nil;
    }
  }
  subschema(t, r) {
    const n = (0, Oo.getSubschema)(this.it, t);
    (0, Oo.extendSubschemaData)(n, this.it, t), (0, Oo.extendSubschemaMode)(n, t);
    const s = { ...this.it, ...n, items: void 0, props: void 0 };
    return K_(s, r), s;
  }
  mergeEvaluated(t, r) {
    const { it: n, gen: s } = this;
    n.opts.unevaluated && (n.props !== !0 && t.props !== void 0 && (n.props = yr.mergeEvaluated.props(s, t.props, n.props, r)), n.items !== !0 && t.items !== void 0 && (n.items = yr.mergeEvaluated.items(s, t.items, n.items, r)));
  }
  mergeValidEvaluated(t, r) {
    const { it: n, gen: s } = this;
    if (n.opts.unevaluated && (n.props !== !0 || n.items !== !0))
      return s.if(r, () => this.mergeEvaluated(t, J.Name)), !0;
  }
};
Ht.KeywordCxt = sm;
function im(e, t, r, n) {
  const s = new sm(e, r, t);
  "code" in r ? r.code(s, n) : s.$data && r.validate ? (0, xs.funcKeywordCode)(s, r) : "macro" in r ? (0, xs.macroKeywordCode)(s, r) : (r.compile || r.validate) && (0, xs.funcKeywordCode)(s, r);
}
const ov = /^\/(?:[^~]|~0|~1)*$/, lv = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
function am(e, { dataLevel: t, dataNames: r, dataPathArr: n }) {
  let s, i;
  if (e === "")
    return te.default.rootData;
  if (e[0] === "/") {
    if (!ov.test(e))
      throw new Error(`Invalid JSON-pointer: ${e}`);
    s = e, i = te.default.rootData;
  } else {
    const c = lv.exec(e);
    if (!c)
      throw new Error(`Invalid JSON-pointer: ${e}`);
    const u = +c[1];
    if (s = c[2], s === "#") {
      if (u >= t)
        throw new Error(l("property/index", u));
      return n[t - u];
    }
    if (u > t)
      throw new Error(l("data", u));
    if (i = r[t - u], !s)
      return i;
  }
  let a = i;
  const o = s.split("/");
  for (const c of o)
    c && (i = (0, J._)`${i}${(0, J.getProperty)((0, yr.unescapeJsonPointer)(c))}`, a = (0, J._)`${a} && ${i}`);
  return a;
  function l(c, u) {
    return `Cannot access ${c} ${u} levels up, current level is ${t}`;
  }
}
Ht.getData = am;
var fi = {};
Object.defineProperty(fi, "__esModule", { value: !0 });
let cv = class extends Error {
  constructor(t) {
    super("validation failed"), this.errors = t, this.ajv = this.validation = !0;
  }
};
fi.default = cv;
var os = {};
Object.defineProperty(os, "__esModule", { value: !0 });
const Io = Ke;
let uv = class extends Error {
  constructor(t, r, n, s) {
    super(s || `can't resolve reference ${n} from id ${r}`), this.missingRef = (0, Io.resolveUrl)(t, r, n), this.missingSchema = (0, Io.normalizeId)((0, Io.getFullPath)(t, this.missingRef));
  }
};
os.default = uv;
var dt = {};
Object.defineProperty(dt, "__esModule", { value: !0 });
dt.resolveSchema = dt.getCompilingSchema = dt.resolveRef = dt.compileSchema = dt.SchemaEnv = void 0;
const Ft = ne, dv = fi, sn = Tt, Vt = Ke, Jd = V, fv = Ht;
let Ga = class {
  constructor(t) {
    var r;
    this.refs = {}, this.dynamicAnchors = {};
    let n;
    typeof t.schema == "object" && (n = t.schema), this.schema = t.schema, this.schemaId = t.schemaId, this.root = t.root || this, this.baseId = (r = t.baseId) !== null && r !== void 0 ? r : (0, Vt.normalizeId)(n == null ? void 0 : n[t.schemaId || "$id"]), this.schemaPath = t.schemaPath, this.localRefs = t.localRefs, this.meta = t.meta, this.$async = n == null ? void 0 : n.$async, this.refs = {};
  }
};
dt.SchemaEnv = Ga;
function fc(e) {
  const t = om.call(this, e);
  if (t)
    return t;
  const r = (0, Vt.getFullPath)(this.opts.uriResolver, e.root.baseId), { es5: n, lines: s } = this.opts.code, { ownProperties: i } = this.opts, a = new Ft.CodeGen(this.scope, { es5: n, lines: s, ownProperties: i });
  let o;
  e.$async && (o = a.scopeValue("Error", {
    ref: dv.default,
    code: (0, Ft._)`require("ajv/dist/runtime/validation_error").default`
  }));
  const l = a.scopeName("validate");
  e.validateName = l;
  const c = {
    gen: a,
    allErrors: this.opts.allErrors,
    data: sn.default.data,
    parentData: sn.default.parentData,
    parentDataProperty: sn.default.parentDataProperty,
    dataNames: [sn.default.data],
    dataPathArr: [Ft.nil],
    // TODO can its length be used as dataLevel if nil is removed?
    dataLevel: 0,
    dataTypes: [],
    definedProperties: /* @__PURE__ */ new Set(),
    topSchemaRef: a.scopeValue("schema", this.opts.code.source === !0 ? { ref: e.schema, code: (0, Ft.stringify)(e.schema) } : { ref: e.schema }),
    validateName: l,
    ValidationError: o,
    schema: e.schema,
    schemaEnv: e,
    rootId: r,
    baseId: e.baseId || r,
    schemaPath: Ft.nil,
    errSchemaPath: e.schemaPath || (this.opts.jtd ? "" : "#"),
    errorPath: (0, Ft._)`""`,
    opts: this.opts,
    self: this
  };
  let u;
  try {
    this._compilations.add(e), (0, fv.validateFunctionCode)(c), a.optimize(this.opts.code.optimize);
    const d = a.toString();
    u = `${a.scopeRefs(sn.default.scope)}return ${d}`, this.opts.code.process && (u = this.opts.code.process(u, e));
    const m = new Function(`${sn.default.self}`, `${sn.default.scope}`, u)(this, this.scope.get());
    if (this.scope.value(l, { ref: m }), m.errors = null, m.schema = e.schema, m.schemaEnv = e, e.$async && (m.$async = !0), this.opts.code.source === !0 && (m.source = { validateName: l, validateCode: d, scopeValues: a._values }), this.opts.unevaluated) {
      const { props: _, items: $ } = c;
      m.evaluated = {
        props: _ instanceof Ft.Name ? void 0 : _,
        items: $ instanceof Ft.Name ? void 0 : $,
        dynamicProps: _ instanceof Ft.Name,
        dynamicItems: $ instanceof Ft.Name
      }, m.source && (m.source.evaluated = (0, Ft.stringify)(m.evaluated));
    }
    return e.validate = m, e;
  } catch (d) {
    throw delete e.validate, delete e.validateName, u && this.logger.error("Error compiling schema, function code:", u), d;
  } finally {
    this._compilations.delete(e);
  }
}
dt.compileSchema = fc;
function hv(e, t, r) {
  var n;
  r = (0, Vt.resolveUrl)(this.opts.uriResolver, t, r);
  const s = e.refs[r];
  if (s)
    return s;
  let i = gv.call(this, e, r);
  if (i === void 0) {
    const a = (n = e.localRefs) === null || n === void 0 ? void 0 : n[r], { schemaId: o } = this.opts;
    a && (i = new Ga({ schema: a, schemaId: o, root: e, baseId: t }));
  }
  if (i !== void 0)
    return e.refs[r] = pv.call(this, i);
}
dt.resolveRef = hv;
function pv(e) {
  return (0, Vt.inlineRef)(e.schema, this.opts.inlineRefs) ? e.schema : e.validate ? e : fc.call(this, e);
}
function om(e) {
  for (const t of this._compilations)
    if (mv(t, e))
      return t;
}
dt.getCompilingSchema = om;
function mv(e, t) {
  return e.schema === t.schema && e.root === t.root && e.baseId === t.baseId;
}
function gv(e, t) {
  let r;
  for (; typeof (r = this.refs[t]) == "string"; )
    t = r;
  return r || this.schemas[t] || Ka.call(this, e, t);
}
function Ka(e, t) {
  const r = this.opts.uriResolver.parse(t), n = (0, Vt._getFullPath)(this.opts.uriResolver, r);
  let s = (0, Vt.getFullPath)(this.opts.uriResolver, e.baseId, void 0);
  if (Object.keys(e.schema).length > 0 && n === s)
    return Do.call(this, r, e);
  const i = (0, Vt.normalizeId)(n), a = this.refs[i] || this.schemas[i];
  if (typeof a == "string") {
    const o = Ka.call(this, e, a);
    return typeof (o == null ? void 0 : o.schema) != "object" ? void 0 : Do.call(this, r, o);
  }
  if (typeof (a == null ? void 0 : a.schema) == "object") {
    if (a.validate || fc.call(this, a), i === (0, Vt.normalizeId)(t)) {
      const { schema: o } = a, { schemaId: l } = this.opts, c = o[l];
      return c && (s = (0, Vt.resolveUrl)(this.opts.uriResolver, s, c)), new Ga({ schema: o, schemaId: l, root: e, baseId: s });
    }
    return Do.call(this, r, a);
  }
}
dt.resolveSchema = Ka;
const yv = /* @__PURE__ */ new Set([
  "properties",
  "patternProperties",
  "enum",
  "dependencies",
  "definitions"
]);
function Do(e, { baseId: t, schema: r, root: n }) {
  var s;
  if (((s = e.fragment) === null || s === void 0 ? void 0 : s[0]) !== "/")
    return;
  for (const o of e.fragment.slice(1).split("/")) {
    if (typeof r == "boolean")
      return;
    const l = r[(0, Jd.unescapeFragment)(o)];
    if (l === void 0)
      return;
    r = l;
    const c = typeof r == "object" && r[this.opts.schemaId];
    !yv.has(o) && c && (t = (0, Vt.resolveUrl)(this.opts.uriResolver, t, c));
  }
  let i;
  if (typeof r != "boolean" && r.$ref && !(0, Jd.schemaHasRulesButRef)(r, this.RULES)) {
    const o = (0, Vt.resolveUrl)(this.opts.uriResolver, t, r.$ref);
    i = Ka.call(this, n, o);
  }
  const { schemaId: a } = this.opts;
  if (i = i || new Ga({ schema: r, schemaId: a, root: n, baseId: t }), i.schema !== i.root.schema)
    return i;
}
const $v = "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#", _v = "Meta-schema for $data reference (JSON AnySchema extension proposal)", vv = "object", wv = [
  "$data"
], Ev = {
  $data: {
    type: "string",
    anyOf: [
      {
        format: "relative-json-pointer"
      },
      {
        format: "json-pointer"
      }
    ]
  }
}, bv = !1, Sv = {
  $id: $v,
  description: _v,
  type: vv,
  required: wv,
  properties: Ev,
  additionalProperties: bv
};
var hc = {}, Wa = { exports: {} };
const Tv = RegExp.prototype.test.bind(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu), lm = RegExp.prototype.test.bind(/^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/u);
function cm(e) {
  let t = "", r = 0, n = 0;
  for (n = 0; n < e.length; n++)
    if (r = e[n].charCodeAt(0), r !== 48) {
      if (!(r >= 48 && r <= 57 || r >= 65 && r <= 70 || r >= 97 && r <= 102))
        return "";
      t += e[n];
      break;
    }
  for (n += 1; n < e.length; n++) {
    if (r = e[n].charCodeAt(0), !(r >= 48 && r <= 57 || r >= 65 && r <= 70 || r >= 97 && r <= 102))
      return "";
    t += e[n];
  }
  return t;
}
const Pv = RegExp.prototype.test.bind(/[^!"$&'()*+,\-.;=_`a-z{}~]/u);
function Qd(e) {
  return e.length = 0, !0;
}
function Av(e, t, r) {
  if (e.length) {
    const n = cm(e);
    if (n !== "")
      t.push(n);
    else
      return r.error = !0, !1;
    e.length = 0;
  }
  return !0;
}
function Rv(e) {
  let t = 0;
  const r = { error: !1, address: "", zone: "" }, n = [], s = [];
  let i = !1, a = !1, o = Av;
  for (let l = 0; l < e.length; l++) {
    const c = e[l];
    if (!(c === "[" || c === "]"))
      if (c === ":") {
        if (i === !0 && (a = !0), !o(s, n, r))
          break;
        if (++t > 7) {
          r.error = !0;
          break;
        }
        l > 0 && e[l - 1] === ":" && (i = !0), n.push(":");
        continue;
      } else if (c === "%") {
        if (!o(s, n, r))
          break;
        o = Qd;
      } else {
        s.push(c);
        continue;
      }
  }
  return s.length && (o === Qd ? r.zone = s.join("") : a ? n.push(s.join("")) : n.push(cm(s))), r.address = n.join(""), r;
}
function um(e) {
  if (Nv(e, ":") < 2)
    return { host: e, isIPV6: !1 };
  const t = Rv(e);
  if (t.error)
    return { host: e, isIPV6: !1 };
  {
    let r = t.address, n = t.address;
    return t.zone && (r += "%" + t.zone, n += "%25" + t.zone), { host: r, isIPV6: !0, escapedHost: n };
  }
}
function Nv(e, t) {
  let r = 0;
  for (let n = 0; n < e.length; n++)
    e[n] === t && r++;
  return r;
}
function Cv(e) {
  let t = e;
  const r = [];
  let n = -1, s = 0;
  for (; s = t.length; ) {
    if (s === 1) {
      if (t === ".")
        break;
      if (t === "/") {
        r.push("/");
        break;
      } else {
        r.push(t);
        break;
      }
    } else if (s === 2) {
      if (t[0] === ".") {
        if (t[1] === ".")
          break;
        if (t[1] === "/") {
          t = t.slice(2);
          continue;
        }
      } else if (t[0] === "/" && (t[1] === "." || t[1] === "/")) {
        r.push("/");
        break;
      }
    } else if (s === 3 && t === "/..") {
      r.length !== 0 && r.pop(), r.push("/");
      break;
    }
    if (t[0] === ".") {
      if (t[1] === ".") {
        if (t[2] === "/") {
          t = t.slice(3);
          continue;
        }
      } else if (t[1] === "/") {
        t = t.slice(2);
        continue;
      }
    } else if (t[0] === "/" && t[1] === ".") {
      if (t[2] === "/") {
        t = t.slice(2);
        continue;
      } else if (t[2] === "." && t[3] === "/") {
        t = t.slice(3), r.length !== 0 && r.pop();
        continue;
      }
    }
    if ((n = t.indexOf("/", 1)) === -1) {
      r.push(t);
      break;
    } else
      r.push(t.slice(0, n)), t = t.slice(n);
  }
  return r.join("");
}
function Ov(e, t) {
  const r = t !== !0 ? escape : unescape;
  return e.scheme !== void 0 && (e.scheme = r(e.scheme)), e.userinfo !== void 0 && (e.userinfo = r(e.userinfo)), e.host !== void 0 && (e.host = r(e.host)), e.path !== void 0 && (e.path = r(e.path)), e.query !== void 0 && (e.query = r(e.query)), e.fragment !== void 0 && (e.fragment = r(e.fragment)), e;
}
function Iv(e) {
  const t = [];
  if (e.userinfo !== void 0 && (t.push(e.userinfo), t.push("@")), e.host !== void 0) {
    let r = unescape(e.host);
    if (!lm(r)) {
      const n = um(r);
      n.isIPV6 === !0 ? r = `[${n.escapedHost}]` : r = e.host;
    }
    t.push(r);
  }
  return (typeof e.port == "number" || typeof e.port == "string") && (t.push(":"), t.push(String(e.port))), t.length ? t.join("") : void 0;
}
var dm = {
  nonSimpleDomain: Pv,
  recomposeAuthority: Iv,
  normalizeComponentEncoding: Ov,
  removeDotSegments: Cv,
  isIPv4: lm,
  isUUID: Tv,
  normalizeIPv6: um
};
const { isUUID: Dv } = dm, kv = /([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-.:;=@]|%[\da-f]{2})+)/iu;
function fm(e) {
  return e.secure === !0 ? !0 : e.secure === !1 ? !1 : e.scheme ? e.scheme.length === 3 && (e.scheme[0] === "w" || e.scheme[0] === "W") && (e.scheme[1] === "s" || e.scheme[1] === "S") && (e.scheme[2] === "s" || e.scheme[2] === "S") : !1;
}
function hm(e) {
  return e.host || (e.error = e.error || "HTTP URIs must have a host."), e;
}
function pm(e) {
  const t = String(e.scheme).toLowerCase() === "https";
  return (e.port === (t ? 443 : 80) || e.port === "") && (e.port = void 0), e.path || (e.path = "/"), e;
}
function Uv(e) {
  return e.secure = fm(e), e.resourceName = (e.path || "/") + (e.query ? "?" + e.query : ""), e.path = void 0, e.query = void 0, e;
}
function Fv(e) {
  if ((e.port === (fm(e) ? 443 : 80) || e.port === "") && (e.port = void 0), typeof e.secure == "boolean" && (e.scheme = e.secure ? "wss" : "ws", e.secure = void 0), e.resourceName) {
    const [t, r] = e.resourceName.split("?");
    e.path = t && t !== "/" ? t : void 0, e.query = r, e.resourceName = void 0;
  }
  return e.fragment = void 0, e;
}
function Lv(e, t) {
  if (!e.path)
    return e.error = "URN can not be parsed", e;
  const r = e.path.match(kv);
  if (r) {
    const n = t.scheme || e.scheme || "urn";
    e.nid = r[1].toLowerCase(), e.nss = r[2];
    const s = `${n}:${t.nid || e.nid}`, i = pc(s);
    e.path = void 0, i && (e = i.parse(e, t));
  } else
    e.error = e.error || "URN can not be parsed.";
  return e;
}
function jv(e, t) {
  if (e.nid === void 0)
    throw new Error("URN without nid cannot be serialized");
  const r = t.scheme || e.scheme || "urn", n = e.nid.toLowerCase(), s = `${r}:${t.nid || n}`, i = pc(s);
  i && (e = i.serialize(e, t));
  const a = e, o = e.nss;
  return a.path = `${n || t.nid}:${o}`, t.skipEscape = !0, a;
}
function Mv(e, t) {
  const r = e;
  return r.uuid = r.nss, r.nss = void 0, !t.tolerant && (!r.uuid || !Dv(r.uuid)) && (r.error = r.error || "UUID is not valid."), r;
}
function xv(e) {
  const t = e;
  return t.nss = (e.uuid || "").toLowerCase(), t;
}
const mm = (
  /** @type {SchemeHandler} */
  {
    scheme: "http",
    domainHost: !0,
    parse: hm,
    serialize: pm
  }
), qv = (
  /** @type {SchemeHandler} */
  {
    scheme: "https",
    domainHost: mm.domainHost,
    parse: hm,
    serialize: pm
  }
), la = (
  /** @type {SchemeHandler} */
  {
    scheme: "ws",
    domainHost: !0,
    parse: Uv,
    serialize: Fv
  }
), Vv = (
  /** @type {SchemeHandler} */
  {
    scheme: "wss",
    domainHost: la.domainHost,
    parse: la.parse,
    serialize: la.serialize
  }
), Bv = (
  /** @type {SchemeHandler} */
  {
    scheme: "urn",
    parse: Lv,
    serialize: jv,
    skipNormalize: !0
  }
), Hv = (
  /** @type {SchemeHandler} */
  {
    scheme: "urn:uuid",
    parse: Mv,
    serialize: xv,
    skipNormalize: !0
  }
), va = (
  /** @type {Record<SchemeName, SchemeHandler>} */
  {
    http: mm,
    https: qv,
    ws: la,
    wss: Vv,
    urn: Bv,
    "urn:uuid": Hv
  }
);
Object.setPrototypeOf(va, null);
function pc(e) {
  return e && (va[
    /** @type {SchemeName} */
    e
  ] || va[
    /** @type {SchemeName} */
    e.toLowerCase()
  ]) || void 0;
}
var zv = {
  SCHEMES: va,
  getSchemeHandler: pc
};
const { normalizeIPv6: Gv, removeDotSegments: ks, recomposeAuthority: Kv, normalizeComponentEncoding: ki, isIPv4: Wv, nonSimpleDomain: Yv } = dm, { SCHEMES: Xv, getSchemeHandler: gm } = zv;
function Jv(e, t) {
  return typeof e == "string" ? e = /** @type {T} */
  tr(wr(e, t), t) : typeof e == "object" && (e = /** @type {T} */
  wr(tr(e, t), t)), e;
}
function Qv(e, t, r) {
  const n = r ? Object.assign({ scheme: "null" }, r) : { scheme: "null" }, s = ym(wr(e, n), wr(t, n), n, !0);
  return n.skipEscape = !0, tr(s, n);
}
function ym(e, t, r, n) {
  const s = {};
  return n || (e = wr(tr(e, r), r), t = wr(tr(t, r), r)), r = r || {}, !r.tolerant && t.scheme ? (s.scheme = t.scheme, s.userinfo = t.userinfo, s.host = t.host, s.port = t.port, s.path = ks(t.path || ""), s.query = t.query) : (t.userinfo !== void 0 || t.host !== void 0 || t.port !== void 0 ? (s.userinfo = t.userinfo, s.host = t.host, s.port = t.port, s.path = ks(t.path || ""), s.query = t.query) : (t.path ? (t.path[0] === "/" ? s.path = ks(t.path) : ((e.userinfo !== void 0 || e.host !== void 0 || e.port !== void 0) && !e.path ? s.path = "/" + t.path : e.path ? s.path = e.path.slice(0, e.path.lastIndexOf("/") + 1) + t.path : s.path = t.path, s.path = ks(s.path)), s.query = t.query) : (s.path = e.path, t.query !== void 0 ? s.query = t.query : s.query = e.query), s.userinfo = e.userinfo, s.host = e.host, s.port = e.port), s.scheme = e.scheme), s.fragment = t.fragment, s;
}
function Zv(e, t, r) {
  return typeof e == "string" ? (e = unescape(e), e = tr(ki(wr(e, r), !0), { ...r, skipEscape: !0 })) : typeof e == "object" && (e = tr(ki(e, !0), { ...r, skipEscape: !0 })), typeof t == "string" ? (t = unescape(t), t = tr(ki(wr(t, r), !0), { ...r, skipEscape: !0 })) : typeof t == "object" && (t = tr(ki(t, !0), { ...r, skipEscape: !0 })), e.toLowerCase() === t.toLowerCase();
}
function tr(e, t) {
  const r = {
    host: e.host,
    scheme: e.scheme,
    userinfo: e.userinfo,
    port: e.port,
    path: e.path,
    query: e.query,
    nid: e.nid,
    nss: e.nss,
    uuid: e.uuid,
    fragment: e.fragment,
    reference: e.reference,
    resourceName: e.resourceName,
    secure: e.secure,
    error: ""
  }, n = Object.assign({}, t), s = [], i = gm(n.scheme || r.scheme);
  i && i.serialize && i.serialize(r, n), r.path !== void 0 && (n.skipEscape ? r.path = unescape(r.path) : (r.path = escape(r.path), r.scheme !== void 0 && (r.path = r.path.split("%3A").join(":")))), n.reference !== "suffix" && r.scheme && s.push(r.scheme, ":");
  const a = Kv(r);
  if (a !== void 0 && (n.reference !== "suffix" && s.push("//"), s.push(a), r.path && r.path[0] !== "/" && s.push("/")), r.path !== void 0) {
    let o = r.path;
    !n.absolutePath && (!i || !i.absolutePath) && (o = ks(o)), a === void 0 && o[0] === "/" && o[1] === "/" && (o = "/%2F" + o.slice(2)), s.push(o);
  }
  return r.query !== void 0 && s.push("?", r.query), r.fragment !== void 0 && s.push("#", r.fragment), s.join("");
}
const ew = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
function wr(e, t) {
  const r = Object.assign({}, t), n = {
    scheme: void 0,
    userinfo: void 0,
    host: "",
    port: void 0,
    path: "",
    query: void 0,
    fragment: void 0
  };
  let s = !1;
  r.reference === "suffix" && (r.scheme ? e = r.scheme + ":" + e : e = "//" + e);
  const i = e.match(ew);
  if (i) {
    if (n.scheme = i[1], n.userinfo = i[3], n.host = i[4], n.port = parseInt(i[5], 10), n.path = i[6] || "", n.query = i[7], n.fragment = i[8], isNaN(n.port) && (n.port = i[5]), n.host)
      if (Wv(n.host) === !1) {
        const l = Gv(n.host);
        n.host = l.host.toLowerCase(), s = l.isIPV6;
      } else
        s = !0;
    n.scheme === void 0 && n.userinfo === void 0 && n.host === void 0 && n.port === void 0 && n.query === void 0 && !n.path ? n.reference = "same-document" : n.scheme === void 0 ? n.reference = "relative" : n.fragment === void 0 ? n.reference = "absolute" : n.reference = "uri", r.reference && r.reference !== "suffix" && r.reference !== n.reference && (n.error = n.error || "URI is not a " + r.reference + " reference.");
    const a = gm(r.scheme || n.scheme);
    if (!r.unicodeSupport && (!a || !a.unicodeSupport) && n.host && (r.domainHost || a && a.domainHost) && s === !1 && Yv(n.host))
      try {
        n.host = URL.domainToASCII(n.host.toLowerCase());
      } catch (o) {
        n.error = n.error || "Host's domain name can not be converted to ASCII: " + o;
      }
    (!a || a && !a.skipNormalize) && (e.indexOf("%") !== -1 && (n.scheme !== void 0 && (n.scheme = unescape(n.scheme)), n.host !== void 0 && (n.host = unescape(n.host))), n.path && (n.path = escape(unescape(n.path))), n.fragment && (n.fragment = encodeURI(decodeURIComponent(n.fragment)))), a && a.parse && a.parse(n, r);
  } else
    n.error = n.error || "URI can not be parsed.";
  return n;
}
const mc = {
  SCHEMES: Xv,
  normalize: Jv,
  resolve: Qv,
  resolveComponent: ym,
  equal: Zv,
  serialize: tr,
  parse: wr
};
Wa.exports = mc;
Wa.exports.default = mc;
Wa.exports.fastUri = mc;
var $m = Wa.exports;
Object.defineProperty(hc, "__esModule", { value: !0 });
const _m = $m;
_m.code = 'require("ajv/dist/runtime/uri").default';
hc.default = _m;
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.CodeGen = e.Name = e.nil = e.stringify = e.str = e._ = e.KeywordCxt = void 0;
  var t = Ht;
  Object.defineProperty(e, "KeywordCxt", { enumerable: !0, get: function() {
    return t.KeywordCxt;
  } });
  var r = ne;
  Object.defineProperty(e, "_", { enumerable: !0, get: function() {
    return r._;
  } }), Object.defineProperty(e, "str", { enumerable: !0, get: function() {
    return r.str;
  } }), Object.defineProperty(e, "stringify", { enumerable: !0, get: function() {
    return r.stringify;
  } }), Object.defineProperty(e, "nil", { enumerable: !0, get: function() {
    return r.nil;
  } }), Object.defineProperty(e, "Name", { enumerable: !0, get: function() {
    return r.Name;
  } }), Object.defineProperty(e, "CodeGen", { enumerable: !0, get: function() {
    return r.CodeGen;
  } });
  const n = fi, s = os, i = bn, a = dt, o = ne, l = Ke, c = Fe, u = V, d = Sv, p = hc, m = (C, b) => new RegExp(C, b);
  m.code = "new RegExp";
  const _ = ["removeAdditional", "useDefaults", "coerceTypes"], $ = /* @__PURE__ */ new Set([
    "validate",
    "serialize",
    "parse",
    "wrapper",
    "root",
    "schema",
    "keyword",
    "pattern",
    "formats",
    "validate$data",
    "func",
    "obj",
    "Error"
  ]), v = {
    errorDataPath: "",
    format: "`validateFormats: false` can be used instead.",
    nullable: '"nullable" keyword is supported by default.',
    jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
    extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
    missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
    processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
    sourceCode: "Use option `code: {source: true}`",
    strictDefaults: "It is default now, see option `strict`.",
    strictKeywords: "It is default now, see option `strict`.",
    uniqueItems: '"uniqueItems" keyword is always validated.',
    unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
    cache: "Map is used as cache, schema object as key.",
    serialize: "Map is used as cache, schema object as key.",
    ajvErrors: "It is default now."
  }, g = {
    ignoreKeywordsWithRef: "",
    jsPropertySyntax: "",
    unicode: '"minLength"/"maxLength" account for unicode characters by default.'
  }, E = 200;
  function N(C) {
    var b, A, S, f, y, P, w, h, k, R, z, he, ge, we, Pe, Xe, $e, Ue, kt, Pt, vt, At, ar, or, lr;
    const wt = C.strict, Rt = (b = C.code) === null || b === void 0 ? void 0 : b.optimize, cr = Rt === !0 || Rt === void 0 ? 1 : Rt || 0, Tr = (S = (A = C.code) === null || A === void 0 ? void 0 : A.regExp) !== null && S !== void 0 ? S : m, mt = (f = C.uriResolver) !== null && f !== void 0 ? f : p.default;
    return {
      strictSchema: (P = (y = C.strictSchema) !== null && y !== void 0 ? y : wt) !== null && P !== void 0 ? P : !0,
      strictNumbers: (h = (w = C.strictNumbers) !== null && w !== void 0 ? w : wt) !== null && h !== void 0 ? h : !0,
      strictTypes: (R = (k = C.strictTypes) !== null && k !== void 0 ? k : wt) !== null && R !== void 0 ? R : "log",
      strictTuples: (he = (z = C.strictTuples) !== null && z !== void 0 ? z : wt) !== null && he !== void 0 ? he : "log",
      strictRequired: (we = (ge = C.strictRequired) !== null && ge !== void 0 ? ge : wt) !== null && we !== void 0 ? we : !1,
      code: C.code ? { ...C.code, optimize: cr, regExp: Tr } : { optimize: cr, regExp: Tr },
      loopRequired: (Pe = C.loopRequired) !== null && Pe !== void 0 ? Pe : E,
      loopEnum: (Xe = C.loopEnum) !== null && Xe !== void 0 ? Xe : E,
      meta: ($e = C.meta) !== null && $e !== void 0 ? $e : !0,
      messages: (Ue = C.messages) !== null && Ue !== void 0 ? Ue : !0,
      inlineRefs: (kt = C.inlineRefs) !== null && kt !== void 0 ? kt : !0,
      schemaId: (Pt = C.schemaId) !== null && Pt !== void 0 ? Pt : "$id",
      addUsedSchema: (vt = C.addUsedSchema) !== null && vt !== void 0 ? vt : !0,
      validateSchema: (At = C.validateSchema) !== null && At !== void 0 ? At : !0,
      validateFormats: (ar = C.validateFormats) !== null && ar !== void 0 ? ar : !0,
      unicodeRegExp: (or = C.unicodeRegExp) !== null && or !== void 0 ? or : !0,
      int32range: (lr = C.int32range) !== null && lr !== void 0 ? lr : !0,
      uriResolver: mt
    };
  }
  class O {
    constructor(b = {}) {
      this.schemas = {}, this.refs = {}, this.formats = {}, this._compilations = /* @__PURE__ */ new Set(), this._loading = {}, this._cache = /* @__PURE__ */ new Map(), b = this.opts = { ...b, ...N(b) };
      const { es5: A, lines: S } = this.opts.code;
      this.scope = new o.ValueScope({ scope: {}, prefixes: $, es5: A, lines: S }), this.logger = x(b.logger);
      const f = b.validateFormats;
      b.validateFormats = !1, this.RULES = (0, i.getRules)(), U.call(this, v, b, "NOT SUPPORTED"), U.call(this, g, b, "DEPRECATED", "warn"), this._metaOpts = ye.call(this), b.formats && me.call(this), this._addVocabularies(), this._addDefaultMetaSchema(), b.keywords && I.call(this, b.keywords), typeof b.meta == "object" && this.addMetaSchema(b.meta), B.call(this), b.validateFormats = f;
    }
    _addVocabularies() {
      this.addKeyword("$async");
    }
    _addDefaultMetaSchema() {
      const { $data: b, meta: A, schemaId: S } = this.opts;
      let f = d;
      S === "id" && (f = { ...d }, f.id = f.$id, delete f.$id), A && b && this.addMetaSchema(f, f[S], !1);
    }
    defaultMeta() {
      const { meta: b, schemaId: A } = this.opts;
      return this.opts.defaultMeta = typeof b == "object" ? b[A] || b : void 0;
    }
    validate(b, A) {
      let S;
      if (typeof b == "string") {
        if (S = this.getSchema(b), !S)
          throw new Error(`no schema with key or ref "${b}"`);
      } else
        S = this.compile(b);
      const f = S(A);
      return "$async" in S || (this.errors = S.errors), f;
    }
    compile(b, A) {
      const S = this._addSchema(b, A);
      return S.validate || this._compileSchemaEnv(S);
    }
    compileAsync(b, A) {
      if (typeof this.opts.loadSchema != "function")
        throw new Error("options.loadSchema should be a function");
      const { loadSchema: S } = this.opts;
      return f.call(this, b, A);
      async function f(R, z) {
        await y.call(this, R.$schema);
        const he = this._addSchema(R, z);
        return he.validate || P.call(this, he);
      }
      async function y(R) {
        R && !this.getSchema(R) && await f.call(this, { $ref: R }, !0);
      }
      async function P(R) {
        try {
          return this._compileSchemaEnv(R);
        } catch (z) {
          if (!(z instanceof s.default))
            throw z;
          return w.call(this, z), await h.call(this, z.missingSchema), P.call(this, R);
        }
      }
      function w({ missingSchema: R, missingRef: z }) {
        if (this.refs[R])
          throw new Error(`AnySchema ${R} is loaded but ${z} cannot be resolved`);
      }
      async function h(R) {
        const z = await k.call(this, R);
        this.refs[R] || await y.call(this, z.$schema), this.refs[R] || this.addSchema(z, R, A);
      }
      async function k(R) {
        const z = this._loading[R];
        if (z)
          return z;
        try {
          return await (this._loading[R] = S(R));
        } finally {
          delete this._loading[R];
        }
      }
    }
    // Adds schema to the instance
    addSchema(b, A, S, f = this.opts.validateSchema) {
      if (Array.isArray(b)) {
        for (const P of b)
          this.addSchema(P, void 0, S, f);
        return this;
      }
      let y;
      if (typeof b == "object") {
        const { schemaId: P } = this.opts;
        if (y = b[P], y !== void 0 && typeof y != "string")
          throw new Error(`schema ${P} must be string`);
      }
      return A = (0, l.normalizeId)(A || y), this._checkUnique(A), this.schemas[A] = this._addSchema(b, S, A, f, !0), this;
    }
    // Add schema that will be used to validate other schemas
    // options in META_IGNORE_OPTIONS are alway set to false
    addMetaSchema(b, A, S = this.opts.validateSchema) {
      return this.addSchema(b, A, !0, S), this;
    }
    //  Validate schema against its meta-schema
    validateSchema(b, A) {
      if (typeof b == "boolean")
        return !0;
      let S;
      if (S = b.$schema, S !== void 0 && typeof S != "string")
        throw new Error("$schema must be a string");
      if (S = S || this.opts.defaultMeta || this.defaultMeta(), !S)
        return this.logger.warn("meta-schema not available"), this.errors = null, !0;
      const f = this.validate(S, b);
      if (!f && A) {
        const y = "schema is invalid: " + this.errorsText();
        if (this.opts.validateSchema === "log")
          this.logger.error(y);
        else
          throw new Error(y);
      }
      return f;
    }
    // Get compiled schema by `key` or `ref`.
    // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
    getSchema(b) {
      let A;
      for (; typeof (A = q.call(this, b)) == "string"; )
        b = A;
      if (A === void 0) {
        const { schemaId: S } = this.opts, f = new a.SchemaEnv({ schema: {}, schemaId: S });
        if (A = a.resolveSchema.call(this, f, b), !A)
          return;
        this.refs[b] = A;
      }
      return A.validate || this._compileSchemaEnv(A);
    }
    // Remove cached schema(s).
    // If no parameter is passed all schemas but meta-schemas are removed.
    // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
    // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
    removeSchema(b) {
      if (b instanceof RegExp)
        return this._removeAllSchemas(this.schemas, b), this._removeAllSchemas(this.refs, b), this;
      switch (typeof b) {
        case "undefined":
          return this._removeAllSchemas(this.schemas), this._removeAllSchemas(this.refs), this._cache.clear(), this;
        case "string": {
          const A = q.call(this, b);
          return typeof A == "object" && this._cache.delete(A.schema), delete this.schemas[b], delete this.refs[b], this;
        }
        case "object": {
          const A = b;
          this._cache.delete(A);
          let S = b[this.opts.schemaId];
          return S && (S = (0, l.normalizeId)(S), delete this.schemas[S], delete this.refs[S]), this;
        }
        default:
          throw new Error("ajv.removeSchema: invalid parameter");
      }
    }
    // add "vocabulary" - a collection of keywords
    addVocabulary(b) {
      for (const A of b)
        this.addKeyword(A);
      return this;
    }
    addKeyword(b, A) {
      let S;
      if (typeof b == "string")
        S = b, typeof A == "object" && (this.logger.warn("these parameters are deprecated, see docs for addKeyword"), A.keyword = S);
      else if (typeof b == "object" && A === void 0) {
        if (A = b, S = A.keyword, Array.isArray(S) && !S.length)
          throw new Error("addKeywords: keyword must be string or non-empty array");
      } else
        throw new Error("invalid addKeywords parameters");
      if (F.call(this, S, A), !A)
        return (0, u.eachItem)(S, (y) => L.call(this, y)), this;
      M.call(this, A);
      const f = {
        ...A,
        type: (0, c.getJSONTypes)(A.type),
        schemaType: (0, c.getJSONTypes)(A.schemaType)
      };
      return (0, u.eachItem)(S, f.type.length === 0 ? (y) => L.call(this, y, f) : (y) => f.type.forEach((P) => L.call(this, y, f, P))), this;
    }
    getKeyword(b) {
      const A = this.RULES.all[b];
      return typeof A == "object" ? A.definition : !!A;
    }
    // Remove keyword
    removeKeyword(b) {
      const { RULES: A } = this;
      delete A.keywords[b], delete A.all[b];
      for (const S of A.rules) {
        const f = S.rules.findIndex((y) => y.keyword === b);
        f >= 0 && S.rules.splice(f, 1);
      }
      return this;
    }
    // Add format
    addFormat(b, A) {
      return typeof A == "string" && (A = new RegExp(A)), this.formats[b] = A, this;
    }
    errorsText(b = this.errors, { separator: A = ", ", dataVar: S = "data" } = {}) {
      return !b || b.length === 0 ? "No errors" : b.map((f) => `${S}${f.instancePath} ${f.message}`).reduce((f, y) => f + A + y);
    }
    $dataMetaSchema(b, A) {
      const S = this.RULES.all;
      b = JSON.parse(JSON.stringify(b));
      for (const f of A) {
        const y = f.split("/").slice(1);
        let P = b;
        for (const w of y)
          P = P[w];
        for (const w in S) {
          const h = S[w];
          if (typeof h != "object")
            continue;
          const { $data: k } = h.definition, R = P[w];
          k && R && (P[w] = H(R));
        }
      }
      return b;
    }
    _removeAllSchemas(b, A) {
      for (const S in b) {
        const f = b[S];
        (!A || A.test(S)) && (typeof f == "string" ? delete b[S] : f && !f.meta && (this._cache.delete(f.schema), delete b[S]));
      }
    }
    _addSchema(b, A, S, f = this.opts.validateSchema, y = this.opts.addUsedSchema) {
      let P;
      const { schemaId: w } = this.opts;
      if (typeof b == "object")
        P = b[w];
      else {
        if (this.opts.jtd)
          throw new Error("schema must be object");
        if (typeof b != "boolean")
          throw new Error("schema must be object or boolean");
      }
      let h = this._cache.get(b);
      if (h !== void 0)
        return h;
      S = (0, l.normalizeId)(P || S);
      const k = l.getSchemaRefs.call(this, b, S);
      return h = new a.SchemaEnv({ schema: b, schemaId: w, meta: A, baseId: S, localRefs: k }), this._cache.set(h.schema, h), y && !S.startsWith("#") && (S && this._checkUnique(S), this.refs[S] = h), f && this.validateSchema(b, !0), h;
    }
    _checkUnique(b) {
      if (this.schemas[b] || this.refs[b])
        throw new Error(`schema with key or id "${b}" already exists`);
    }
    _compileSchemaEnv(b) {
      if (b.meta ? this._compileMetaSchema(b) : a.compileSchema.call(this, b), !b.validate)
        throw new Error("ajv implementation error");
      return b.validate;
    }
    _compileMetaSchema(b) {
      const A = this.opts;
      this.opts = this._metaOpts;
      try {
        a.compileSchema.call(this, b);
      } finally {
        this.opts = A;
      }
    }
  }
  O.ValidationError = n.default, O.MissingRefError = s.default, e.default = O;
  function U(C, b, A, S = "error") {
    for (const f in C) {
      const y = f;
      y in b && this.logger[S](`${A}: option ${f}. ${C[y]}`);
    }
  }
  function q(C) {
    return C = (0, l.normalizeId)(C), this.schemas[C] || this.refs[C];
  }
  function B() {
    const C = this.opts.schemas;
    if (C)
      if (Array.isArray(C))
        this.addSchema(C);
      else
        for (const b in C)
          this.addSchema(C[b], b);
  }
  function me() {
    for (const C in this.opts.formats) {
      const b = this.opts.formats[C];
      b && this.addFormat(C, b);
    }
  }
  function I(C) {
    if (Array.isArray(C)) {
      this.addVocabulary(C);
      return;
    }
    this.logger.warn("keywords option as map is deprecated, pass array");
    for (const b in C) {
      const A = C[b];
      A.keyword || (A.keyword = b), this.addKeyword(A);
    }
  }
  function ye() {
    const C = { ...this.opts };
    for (const b of _)
      delete C[b];
    return C;
  }
  const W = { log() {
  }, warn() {
  }, error() {
  } };
  function x(C) {
    if (C === !1)
      return W;
    if (C === void 0)
      return console;
    if (C.log && C.warn && C.error)
      return C;
    throw new Error("logger must implement log, warn and error methods");
  }
  const se = /^[a-z_$][a-z0-9_$:-]*$/i;
  function F(C, b) {
    const { RULES: A } = this;
    if ((0, u.eachItem)(C, (S) => {
      if (A.keywords[S])
        throw new Error(`Keyword ${S} is already defined`);
      if (!se.test(S))
        throw new Error(`Keyword ${S} has invalid name`);
    }), !!b && b.$data && !("code" in b || "validate" in b))
      throw new Error('$data keyword must have "code" or "validate" function');
  }
  function L(C, b, A) {
    var S;
    const f = b == null ? void 0 : b.post;
    if (A && f)
      throw new Error('keyword with "post" flag cannot have "type"');
    const { RULES: y } = this;
    let P = f ? y.post : y.rules.find(({ type: h }) => h === A);
    if (P || (P = { type: A, rules: [] }, y.rules.push(P)), y.keywords[C] = !0, !b)
      return;
    const w = {
      keyword: C,
      definition: {
        ...b,
        type: (0, c.getJSONTypes)(b.type),
        schemaType: (0, c.getJSONTypes)(b.schemaType)
      }
    };
    b.before ? K.call(this, P, w, b.before) : P.rules.push(w), y.all[C] = w, (S = b.implements) === null || S === void 0 || S.forEach((h) => this.addKeyword(h));
  }
  function K(C, b, A) {
    const S = C.rules.findIndex((f) => f.keyword === A);
    S >= 0 ? C.rules.splice(S, 0, b) : (C.rules.push(b), this.logger.warn(`rule ${A} is not defined`));
  }
  function M(C) {
    let { metaSchema: b } = C;
    b !== void 0 && (C.$data && this.opts.$data && (b = H(b)), C.validateSchema = this.compile(b, !0));
  }
  const X = {
    $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
  };
  function H(C) {
    return { anyOf: [C, X] };
  }
})(Cp);
var gc = {}, yc = {}, $c = {};
Object.defineProperty($c, "__esModule", { value: !0 });
const tw = {
  keyword: "id",
  code() {
    throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
  }
};
$c.default = tw;
var Er = {};
Object.defineProperty(Er, "__esModule", { value: !0 });
Er.callRef = Er.getValidate = void 0;
const rw = os, Zd = ue, gt = ne, On = Tt, ef = dt, Ui = V, nw = {
  keyword: "$ref",
  schemaType: "string",
  code(e) {
    const { gen: t, schema: r, it: n } = e, { baseId: s, schemaEnv: i, validateName: a, opts: o, self: l } = n, { root: c } = i;
    if ((r === "#" || r === "#/") && s === c.baseId)
      return d();
    const u = ef.resolveRef.call(l, c, s, r);
    if (u === void 0)
      throw new rw.default(n.opts.uriResolver, s, r);
    if (u instanceof ef.SchemaEnv)
      return p(u);
    return m(u);
    function d() {
      if (i === c)
        return ca(e, a, i, i.$async);
      const _ = t.scopeValue("root", { ref: c });
      return ca(e, (0, gt._)`${_}.validate`, c, c.$async);
    }
    function p(_) {
      const $ = vm(e, _);
      ca(e, $, _, _.$async);
    }
    function m(_) {
      const $ = t.scopeValue("schema", o.code.source === !0 ? { ref: _, code: (0, gt.stringify)(_) } : { ref: _ }), v = t.name("valid"), g = e.subschema({
        schema: _,
        dataTypes: [],
        schemaPath: gt.nil,
        topSchemaRef: $,
        errSchemaPath: r
      }, v);
      e.mergeEvaluated(g), e.ok(v);
    }
  }
};
function vm(e, t) {
  const { gen: r } = e;
  return t.validate ? r.scopeValue("validate", { ref: t.validate }) : (0, gt._)`${r.scopeValue("wrapper", { ref: t })}.validate`;
}
Er.getValidate = vm;
function ca(e, t, r, n) {
  const { gen: s, it: i } = e, { allErrors: a, schemaEnv: o, opts: l } = i, c = l.passContext ? On.default.this : gt.nil;
  n ? u() : d();
  function u() {
    if (!o.$async)
      throw new Error("async schema referenced by sync schema");
    const _ = s.let("valid");
    s.try(() => {
      s.code((0, gt._)`await ${(0, Zd.callValidateCode)(e, t, c)}`), m(t), a || s.assign(_, !0);
    }, ($) => {
      s.if((0, gt._)`!(${$} instanceof ${i.ValidationError})`, () => s.throw($)), p($), a || s.assign(_, !1);
    }), e.ok(_);
  }
  function d() {
    e.result((0, Zd.callValidateCode)(e, t, c), () => m(t), () => p(t));
  }
  function p(_) {
    const $ = (0, gt._)`${_}.errors`;
    s.assign(On.default.vErrors, (0, gt._)`${On.default.vErrors} === null ? ${$} : ${On.default.vErrors}.concat(${$})`), s.assign(On.default.errors, (0, gt._)`${On.default.vErrors}.length`);
  }
  function m(_) {
    var $;
    if (!i.opts.unevaluated)
      return;
    const v = ($ = r == null ? void 0 : r.validate) === null || $ === void 0 ? void 0 : $.evaluated;
    if (i.props !== !0)
      if (v && !v.dynamicProps)
        v.props !== void 0 && (i.props = Ui.mergeEvaluated.props(s, v.props, i.props));
      else {
        const g = s.var("props", (0, gt._)`${_}.evaluated.props`);
        i.props = Ui.mergeEvaluated.props(s, g, i.props, gt.Name);
      }
    if (i.items !== !0)
      if (v && !v.dynamicItems)
        v.items !== void 0 && (i.items = Ui.mergeEvaluated.items(s, v.items, i.items));
      else {
        const g = s.var("items", (0, gt._)`${_}.evaluated.items`);
        i.items = Ui.mergeEvaluated.items(s, g, i.items, gt.Name);
      }
  }
}
Er.callRef = ca;
Er.default = nw;
Object.defineProperty(yc, "__esModule", { value: !0 });
const sw = $c, iw = Er, aw = [
  "$schema",
  "$id",
  "$defs",
  "$vocabulary",
  { keyword: "$comment" },
  "definitions",
  sw.default,
  iw.default
];
yc.default = aw;
var _c = {}, vc = {};
Object.defineProperty(vc, "__esModule", { value: !0 });
const wa = ne, Dr = wa.operators, Ea = {
  maximum: { okStr: "<=", ok: Dr.LTE, fail: Dr.GT },
  minimum: { okStr: ">=", ok: Dr.GTE, fail: Dr.LT },
  exclusiveMaximum: { okStr: "<", ok: Dr.LT, fail: Dr.GTE },
  exclusiveMinimum: { okStr: ">", ok: Dr.GT, fail: Dr.LTE }
}, ow = {
  message: ({ keyword: e, schemaCode: t }) => (0, wa.str)`must be ${Ea[e].okStr} ${t}`,
  params: ({ keyword: e, schemaCode: t }) => (0, wa._)`{comparison: ${Ea[e].okStr}, limit: ${t}}`
}, lw = {
  keyword: Object.keys(Ea),
  type: "number",
  schemaType: "number",
  $data: !0,
  error: ow,
  code(e) {
    const { keyword: t, data: r, schemaCode: n } = e;
    e.fail$data((0, wa._)`${r} ${Ea[t].fail} ${n} || isNaN(${r})`);
  }
};
vc.default = lw;
var wc = {};
Object.defineProperty(wc, "__esModule", { value: !0 });
const qs = ne, cw = {
  message: ({ schemaCode: e }) => (0, qs.str)`must be multiple of ${e}`,
  params: ({ schemaCode: e }) => (0, qs._)`{multipleOf: ${e}}`
}, uw = {
  keyword: "multipleOf",
  type: "number",
  schemaType: "number",
  $data: !0,
  error: cw,
  code(e) {
    const { gen: t, data: r, schemaCode: n, it: s } = e, i = s.opts.multipleOfPrecision, a = t.let("res"), o = i ? (0, qs._)`Math.abs(Math.round(${a}) - ${a}) > 1e-${i}` : (0, qs._)`${a} !== parseInt(${a})`;
    e.fail$data((0, qs._)`(${n} === 0 || (${a} = ${r}/${n}, ${o}))`);
  }
};
wc.default = uw;
var Ec = {}, bc = {};
Object.defineProperty(bc, "__esModule", { value: !0 });
function wm(e) {
  const t = e.length;
  let r = 0, n = 0, s;
  for (; n < t; )
    r++, s = e.charCodeAt(n++), s >= 55296 && s <= 56319 && n < t && (s = e.charCodeAt(n), (s & 64512) === 56320 && n++);
  return r;
}
bc.default = wm;
wm.code = 'require("ajv/dist/runtime/ucs2length").default';
Object.defineProperty(Ec, "__esModule", { value: !0 });
const dn = ne, dw = V, fw = bc, hw = {
  message({ keyword: e, schemaCode: t }) {
    const r = e === "maxLength" ? "more" : "fewer";
    return (0, dn.str)`must NOT have ${r} than ${t} characters`;
  },
  params: ({ schemaCode: e }) => (0, dn._)`{limit: ${e}}`
}, pw = {
  keyword: ["maxLength", "minLength"],
  type: "string",
  schemaType: "number",
  $data: !0,
  error: hw,
  code(e) {
    const { keyword: t, data: r, schemaCode: n, it: s } = e, i = t === "maxLength" ? dn.operators.GT : dn.operators.LT, a = s.opts.unicode === !1 ? (0, dn._)`${r}.length` : (0, dn._)`${(0, dw.useFunc)(e.gen, fw.default)}(${r})`;
    e.fail$data((0, dn._)`${a} ${i} ${n}`);
  }
};
Ec.default = pw;
var Sc = {};
Object.defineProperty(Sc, "__esModule", { value: !0 });
const mw = ue, ba = ne, gw = {
  message: ({ schemaCode: e }) => (0, ba.str)`must match pattern "${e}"`,
  params: ({ schemaCode: e }) => (0, ba._)`{pattern: ${e}}`
}, yw = {
  keyword: "pattern",
  type: "string",
  schemaType: "string",
  $data: !0,
  error: gw,
  code(e) {
    const { data: t, $data: r, schema: n, schemaCode: s, it: i } = e, a = i.opts.unicodeRegExp ? "u" : "", o = r ? (0, ba._)`(new RegExp(${s}, ${a}))` : (0, mw.usePattern)(e, n);
    e.fail$data((0, ba._)`!${o}.test(${t})`);
  }
};
Sc.default = yw;
var Tc = {};
Object.defineProperty(Tc, "__esModule", { value: !0 });
const Vs = ne, $w = {
  message({ keyword: e, schemaCode: t }) {
    const r = e === "maxProperties" ? "more" : "fewer";
    return (0, Vs.str)`must NOT have ${r} than ${t} properties`;
  },
  params: ({ schemaCode: e }) => (0, Vs._)`{limit: ${e}}`
}, _w = {
  keyword: ["maxProperties", "minProperties"],
  type: "object",
  schemaType: "number",
  $data: !0,
  error: $w,
  code(e) {
    const { keyword: t, data: r, schemaCode: n } = e, s = t === "maxProperties" ? Vs.operators.GT : Vs.operators.LT;
    e.fail$data((0, Vs._)`Object.keys(${r}).length ${s} ${n}`);
  }
};
Tc.default = _w;
var Pc = {};
Object.defineProperty(Pc, "__esModule", { value: !0 });
const As = ue, Bs = ne, vw = V, ww = {
  message: ({ params: { missingProperty: e } }) => (0, Bs.str)`must have required property '${e}'`,
  params: ({ params: { missingProperty: e } }) => (0, Bs._)`{missingProperty: ${e}}`
}, Ew = {
  keyword: "required",
  type: "object",
  schemaType: "array",
  $data: !0,
  error: ww,
  code(e) {
    const { gen: t, schema: r, schemaCode: n, data: s, $data: i, it: a } = e, { opts: o } = a;
    if (!i && r.length === 0)
      return;
    const l = r.length >= o.loopRequired;
    if (a.allErrors ? c() : u(), o.strictRequired) {
      const m = e.parentSchema.properties, { definedProperties: _ } = e.it;
      for (const $ of r)
        if ((m == null ? void 0 : m[$]) === void 0 && !_.has($)) {
          const v = a.schemaEnv.baseId + a.errSchemaPath, g = `required property "${$}" is not defined at "${v}" (strictRequired)`;
          (0, vw.checkStrictMode)(a, g, a.opts.strictRequired);
        }
    }
    function c() {
      if (l || i)
        e.block$data(Bs.nil, d);
      else
        for (const m of r)
          (0, As.checkReportMissingProp)(e, m);
    }
    function u() {
      const m = t.let("missing");
      if (l || i) {
        const _ = t.let("valid", !0);
        e.block$data(_, () => p(m, _)), e.ok(_);
      } else
        t.if((0, As.checkMissingProp)(e, r, m)), (0, As.reportMissingProp)(e, m), t.else();
    }
    function d() {
      t.forOf("prop", n, (m) => {
        e.setParams({ missingProperty: m }), t.if((0, As.noPropertyInData)(t, s, m, o.ownProperties), () => e.error());
      });
    }
    function p(m, _) {
      e.setParams({ missingProperty: m }), t.forOf(m, n, () => {
        t.assign(_, (0, As.propertyInData)(t, s, m, o.ownProperties)), t.if((0, Bs.not)(_), () => {
          e.error(), t.break();
        });
      }, Bs.nil);
    }
  }
};
Pc.default = Ew;
var Ac = {};
Object.defineProperty(Ac, "__esModule", { value: !0 });
const Hs = ne, bw = {
  message({ keyword: e, schemaCode: t }) {
    const r = e === "maxItems" ? "more" : "fewer";
    return (0, Hs.str)`must NOT have ${r} than ${t} items`;
  },
  params: ({ schemaCode: e }) => (0, Hs._)`{limit: ${e}}`
}, Sw = {
  keyword: ["maxItems", "minItems"],
  type: "array",
  schemaType: "number",
  $data: !0,
  error: bw,
  code(e) {
    const { keyword: t, data: r, schemaCode: n } = e, s = t === "maxItems" ? Hs.operators.GT : Hs.operators.LT;
    e.fail$data((0, Hs._)`${r}.length ${s} ${n}`);
  }
};
Ac.default = Sw;
var Rc = {}, hi = {};
Object.defineProperty(hi, "__esModule", { value: !0 });
const Em = za;
Em.code = 'require("ajv/dist/runtime/equal").default';
hi.default = Em;
Object.defineProperty(Rc, "__esModule", { value: !0 });
const ko = Fe, He = ne, Tw = V, Pw = hi, Aw = {
  message: ({ params: { i: e, j: t } }) => (0, He.str)`must NOT have duplicate items (items ## ${t} and ${e} are identical)`,
  params: ({ params: { i: e, j: t } }) => (0, He._)`{i: ${e}, j: ${t}}`
}, Rw = {
  keyword: "uniqueItems",
  type: "array",
  schemaType: "boolean",
  $data: !0,
  error: Aw,
  code(e) {
    const { gen: t, data: r, $data: n, schema: s, parentSchema: i, schemaCode: a, it: o } = e;
    if (!n && !s)
      return;
    const l = t.let("valid"), c = i.items ? (0, ko.getSchemaTypes)(i.items) : [];
    e.block$data(l, u, (0, He._)`${a} === false`), e.ok(l);
    function u() {
      const _ = t.let("i", (0, He._)`${r}.length`), $ = t.let("j");
      e.setParams({ i: _, j: $ }), t.assign(l, !0), t.if((0, He._)`${_} > 1`, () => (d() ? p : m)(_, $));
    }
    function d() {
      return c.length > 0 && !c.some((_) => _ === "object" || _ === "array");
    }
    function p(_, $) {
      const v = t.name("item"), g = (0, ko.checkDataTypes)(c, v, o.opts.strictNumbers, ko.DataType.Wrong), E = t.const("indices", (0, He._)`{}`);
      t.for((0, He._)`;${_}--;`, () => {
        t.let(v, (0, He._)`${r}[${_}]`), t.if(g, (0, He._)`continue`), c.length > 1 && t.if((0, He._)`typeof ${v} == "string"`, (0, He._)`${v} += "_"`), t.if((0, He._)`typeof ${E}[${v}] == "number"`, () => {
          t.assign($, (0, He._)`${E}[${v}]`), e.error(), t.assign(l, !1).break();
        }).code((0, He._)`${E}[${v}] = ${_}`);
      });
    }
    function m(_, $) {
      const v = (0, Tw.useFunc)(t, Pw.default), g = t.name("outer");
      t.label(g).for((0, He._)`;${_}--;`, () => t.for((0, He._)`${$} = ${_}; ${$}--;`, () => t.if((0, He._)`${v}(${r}[${_}], ${r}[${$}])`, () => {
        e.error(), t.assign(l, !1).break(g);
      })));
    }
  }
};
Rc.default = Rw;
var Nc = {};
Object.defineProperty(Nc, "__esModule", { value: !0 });
const Pl = ne, Nw = V, Cw = hi, Ow = {
  message: "must be equal to constant",
  params: ({ schemaCode: e }) => (0, Pl._)`{allowedValue: ${e}}`
}, Iw = {
  keyword: "const",
  $data: !0,
  error: Ow,
  code(e) {
    const { gen: t, data: r, $data: n, schemaCode: s, schema: i } = e;
    n || i && typeof i == "object" ? e.fail$data((0, Pl._)`!${(0, Nw.useFunc)(t, Cw.default)}(${r}, ${s})`) : e.fail((0, Pl._)`${i} !== ${r}`);
  }
};
Nc.default = Iw;
var Cc = {};
Object.defineProperty(Cc, "__esModule", { value: !0 });
const Us = ne, Dw = V, kw = hi, Uw = {
  message: "must be equal to one of the allowed values",
  params: ({ schemaCode: e }) => (0, Us._)`{allowedValues: ${e}}`
}, Fw = {
  keyword: "enum",
  schemaType: "array",
  $data: !0,
  error: Uw,
  code(e) {
    const { gen: t, data: r, $data: n, schema: s, schemaCode: i, it: a } = e;
    if (!n && s.length === 0)
      throw new Error("enum must have non-empty array");
    const o = s.length >= a.opts.loopEnum;
    let l;
    const c = () => l ?? (l = (0, Dw.useFunc)(t, kw.default));
    let u;
    if (o || n)
      u = t.let("valid"), e.block$data(u, d);
    else {
      if (!Array.isArray(s))
        throw new Error("ajv implementation error");
      const m = t.const("vSchema", i);
      u = (0, Us.or)(...s.map((_, $) => p(m, $)));
    }
    e.pass(u);
    function d() {
      t.assign(u, !1), t.forOf("v", i, (m) => t.if((0, Us._)`${c()}(${r}, ${m})`, () => t.assign(u, !0).break()));
    }
    function p(m, _) {
      const $ = s[_];
      return typeof $ == "object" && $ !== null ? (0, Us._)`${c()}(${r}, ${m}[${_}])` : (0, Us._)`${r} === ${$}`;
    }
  }
};
Cc.default = Fw;
Object.defineProperty(_c, "__esModule", { value: !0 });
const Lw = vc, jw = wc, Mw = Ec, xw = Sc, qw = Tc, Vw = Pc, Bw = Ac, Hw = Rc, zw = Nc, Gw = Cc, Kw = [
  // number
  Lw.default,
  jw.default,
  // string
  Mw.default,
  xw.default,
  // object
  qw.default,
  Vw.default,
  // array
  Bw.default,
  Hw.default,
  // any
  { keyword: "type", schemaType: ["string", "array"] },
  { keyword: "nullable", schemaType: "boolean" },
  zw.default,
  Gw.default
];
_c.default = Kw;
var Oc = {}, ls = {};
Object.defineProperty(ls, "__esModule", { value: !0 });
ls.validateAdditionalItems = void 0;
const fn = ne, Al = V, Ww = {
  message: ({ params: { len: e } }) => (0, fn.str)`must NOT have more than ${e} items`,
  params: ({ params: { len: e } }) => (0, fn._)`{limit: ${e}}`
}, Yw = {
  keyword: "additionalItems",
  type: "array",
  schemaType: ["boolean", "object"],
  before: "uniqueItems",
  error: Ww,
  code(e) {
    const { parentSchema: t, it: r } = e, { items: n } = t;
    if (!Array.isArray(n)) {
      (0, Al.checkStrictMode)(r, '"additionalItems" is ignored when "items" is not an array of schemas');
      return;
    }
    bm(e, n);
  }
};
function bm(e, t) {
  const { gen: r, schema: n, data: s, keyword: i, it: a } = e;
  a.items = !0;
  const o = r.const("len", (0, fn._)`${s}.length`);
  if (n === !1)
    e.setParams({ len: t.length }), e.pass((0, fn._)`${o} <= ${t.length}`);
  else if (typeof n == "object" && !(0, Al.alwaysValidSchema)(a, n)) {
    const c = r.var("valid", (0, fn._)`${o} <= ${t.length}`);
    r.if((0, fn.not)(c), () => l(c)), e.ok(c);
  }
  function l(c) {
    r.forRange("i", t.length, o, (u) => {
      e.subschema({ keyword: i, dataProp: u, dataPropType: Al.Type.Num }, c), a.allErrors || r.if((0, fn.not)(c), () => r.break());
    });
  }
}
ls.validateAdditionalItems = bm;
ls.default = Yw;
var Ic = {}, cs = {};
Object.defineProperty(cs, "__esModule", { value: !0 });
cs.validateTuple = void 0;
const tf = ne, ua = V, Xw = ue, Jw = {
  keyword: "items",
  type: "array",
  schemaType: ["object", "array", "boolean"],
  before: "uniqueItems",
  code(e) {
    const { schema: t, it: r } = e;
    if (Array.isArray(t))
      return Sm(e, "additionalItems", t);
    r.items = !0, !(0, ua.alwaysValidSchema)(r, t) && e.ok((0, Xw.validateArray)(e));
  }
};
function Sm(e, t, r = e.schema) {
  const { gen: n, parentSchema: s, data: i, keyword: a, it: o } = e;
  u(s), o.opts.unevaluated && r.length && o.items !== !0 && (o.items = ua.mergeEvaluated.items(n, r.length, o.items));
  const l = n.name("valid"), c = n.const("len", (0, tf._)`${i}.length`);
  r.forEach((d, p) => {
    (0, ua.alwaysValidSchema)(o, d) || (n.if((0, tf._)`${c} > ${p}`, () => e.subschema({
      keyword: a,
      schemaProp: p,
      dataProp: p
    }, l)), e.ok(l));
  });
  function u(d) {
    const { opts: p, errSchemaPath: m } = o, _ = r.length, $ = _ === d.minItems && (_ === d.maxItems || d[t] === !1);
    if (p.strictTuples && !$) {
      const v = `"${a}" is ${_}-tuple, but minItems or maxItems/${t} are not specified or different at path "${m}"`;
      (0, ua.checkStrictMode)(o, v, p.strictTuples);
    }
  }
}
cs.validateTuple = Sm;
cs.default = Jw;
Object.defineProperty(Ic, "__esModule", { value: !0 });
const Qw = cs, Zw = {
  keyword: "prefixItems",
  type: "array",
  schemaType: ["array"],
  before: "uniqueItems",
  code: (e) => (0, Qw.validateTuple)(e, "items")
};
Ic.default = Zw;
var Dc = {};
Object.defineProperty(Dc, "__esModule", { value: !0 });
const rf = ne, eE = V, tE = ue, rE = ls, nE = {
  message: ({ params: { len: e } }) => (0, rf.str)`must NOT have more than ${e} items`,
  params: ({ params: { len: e } }) => (0, rf._)`{limit: ${e}}`
}, sE = {
  keyword: "items",
  type: "array",
  schemaType: ["object", "boolean"],
  before: "uniqueItems",
  error: nE,
  code(e) {
    const { schema: t, parentSchema: r, it: n } = e, { prefixItems: s } = r;
    n.items = !0, !(0, eE.alwaysValidSchema)(n, t) && (s ? (0, rE.validateAdditionalItems)(e, s) : e.ok((0, tE.validateArray)(e)));
  }
};
Dc.default = sE;
var kc = {};
Object.defineProperty(kc, "__esModule", { value: !0 });
const Ot = ne, Fi = V, iE = {
  message: ({ params: { min: e, max: t } }) => t === void 0 ? (0, Ot.str)`must contain at least ${e} valid item(s)` : (0, Ot.str)`must contain at least ${e} and no more than ${t} valid item(s)`,
  params: ({ params: { min: e, max: t } }) => t === void 0 ? (0, Ot._)`{minContains: ${e}}` : (0, Ot._)`{minContains: ${e}, maxContains: ${t}}`
}, aE = {
  keyword: "contains",
  type: "array",
  schemaType: ["object", "boolean"],
  before: "uniqueItems",
  trackErrors: !0,
  error: iE,
  code(e) {
    const { gen: t, schema: r, parentSchema: n, data: s, it: i } = e;
    let a, o;
    const { minContains: l, maxContains: c } = n;
    i.opts.next ? (a = l === void 0 ? 1 : l, o = c) : a = 1;
    const u = t.const("len", (0, Ot._)`${s}.length`);
    if (e.setParams({ min: a, max: o }), o === void 0 && a === 0) {
      (0, Fi.checkStrictMode)(i, '"minContains" == 0 without "maxContains": "contains" keyword ignored');
      return;
    }
    if (o !== void 0 && a > o) {
      (0, Fi.checkStrictMode)(i, '"minContains" > "maxContains" is always invalid'), e.fail();
      return;
    }
    if ((0, Fi.alwaysValidSchema)(i, r)) {
      let $ = (0, Ot._)`${u} >= ${a}`;
      o !== void 0 && ($ = (0, Ot._)`${$} && ${u} <= ${o}`), e.pass($);
      return;
    }
    i.items = !0;
    const d = t.name("valid");
    o === void 0 && a === 1 ? m(d, () => t.if(d, () => t.break())) : a === 0 ? (t.let(d, !0), o !== void 0 && t.if((0, Ot._)`${s}.length > 0`, p)) : (t.let(d, !1), p()), e.result(d, () => e.reset());
    function p() {
      const $ = t.name("_valid"), v = t.let("count", 0);
      m($, () => t.if($, () => _(v)));
    }
    function m($, v) {
      t.forRange("i", 0, u, (g) => {
        e.subschema({
          keyword: "contains",
          dataProp: g,
          dataPropType: Fi.Type.Num,
          compositeRule: !0
        }, $), v();
      });
    }
    function _($) {
      t.code((0, Ot._)`${$}++`), o === void 0 ? t.if((0, Ot._)`${$} >= ${a}`, () => t.assign(d, !0).break()) : (t.if((0, Ot._)`${$} > ${o}`, () => t.assign(d, !1).break()), a === 1 ? t.assign(d, !0) : t.if((0, Ot._)`${$} >= ${a}`, () => t.assign(d, !0)));
    }
  }
};
kc.default = aE;
var Ya = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.validateSchemaDeps = e.validatePropertyDeps = e.error = void 0;
  const t = ne, r = V, n = ue;
  e.error = {
    message: ({ params: { property: l, depsCount: c, deps: u } }) => {
      const d = c === 1 ? "property" : "properties";
      return (0, t.str)`must have ${d} ${u} when property ${l} is present`;
    },
    params: ({ params: { property: l, depsCount: c, deps: u, missingProperty: d } }) => (0, t._)`{property: ${l},
    missingProperty: ${d},
    depsCount: ${c},
    deps: ${u}}`
    // TODO change to reference
  };
  const s = {
    keyword: "dependencies",
    type: "object",
    schemaType: "object",
    error: e.error,
    code(l) {
      const [c, u] = i(l);
      a(l, c), o(l, u);
    }
  };
  function i({ schema: l }) {
    const c = {}, u = {};
    for (const d in l) {
      if (d === "__proto__")
        continue;
      const p = Array.isArray(l[d]) ? c : u;
      p[d] = l[d];
    }
    return [c, u];
  }
  function a(l, c = l.schema) {
    const { gen: u, data: d, it: p } = l;
    if (Object.keys(c).length === 0)
      return;
    const m = u.let("missing");
    for (const _ in c) {
      const $ = c[_];
      if ($.length === 0)
        continue;
      const v = (0, n.propertyInData)(u, d, _, p.opts.ownProperties);
      l.setParams({
        property: _,
        depsCount: $.length,
        deps: $.join(", ")
      }), p.allErrors ? u.if(v, () => {
        for (const g of $)
          (0, n.checkReportMissingProp)(l, g);
      }) : (u.if((0, t._)`${v} && (${(0, n.checkMissingProp)(l, $, m)})`), (0, n.reportMissingProp)(l, m), u.else());
    }
  }
  e.validatePropertyDeps = a;
  function o(l, c = l.schema) {
    const { gen: u, data: d, keyword: p, it: m } = l, _ = u.name("valid");
    for (const $ in c)
      (0, r.alwaysValidSchema)(m, c[$]) || (u.if(
        (0, n.propertyInData)(u, d, $, m.opts.ownProperties),
        () => {
          const v = l.subschema({ keyword: p, schemaProp: $ }, _);
          l.mergeValidEvaluated(v, _);
        },
        () => u.var(_, !0)
        // TODO var
      ), l.ok(_));
  }
  e.validateSchemaDeps = o, e.default = s;
})(Ya);
var Uc = {};
Object.defineProperty(Uc, "__esModule", { value: !0 });
const Tm = ne, oE = V, lE = {
  message: "property name must be valid",
  params: ({ params: e }) => (0, Tm._)`{propertyName: ${e.propertyName}}`
}, cE = {
  keyword: "propertyNames",
  type: "object",
  schemaType: ["object", "boolean"],
  error: lE,
  code(e) {
    const { gen: t, schema: r, data: n, it: s } = e;
    if ((0, oE.alwaysValidSchema)(s, r))
      return;
    const i = t.name("valid");
    t.forIn("key", n, (a) => {
      e.setParams({ propertyName: a }), e.subschema({
        keyword: "propertyNames",
        data: a,
        dataTypes: ["string"],
        propertyName: a,
        compositeRule: !0
      }, i), t.if((0, Tm.not)(i), () => {
        e.error(!0), s.allErrors || t.break();
      });
    }), e.ok(i);
  }
};
Uc.default = cE;
var Xa = {};
Object.defineProperty(Xa, "__esModule", { value: !0 });
const Li = ue, xt = ne, uE = Tt, ji = V, dE = {
  message: "must NOT have additional properties",
  params: ({ params: e }) => (0, xt._)`{additionalProperty: ${e.additionalProperty}}`
}, fE = {
  keyword: "additionalProperties",
  type: ["object"],
  schemaType: ["boolean", "object"],
  allowUndefined: !0,
  trackErrors: !0,
  error: dE,
  code(e) {
    const { gen: t, schema: r, parentSchema: n, data: s, errsCount: i, it: a } = e;
    if (!i)
      throw new Error("ajv implementation error");
    const { allErrors: o, opts: l } = a;
    if (a.props = !0, l.removeAdditional !== "all" && (0, ji.alwaysValidSchema)(a, r))
      return;
    const c = (0, Li.allSchemaProperties)(n.properties), u = (0, Li.allSchemaProperties)(n.patternProperties);
    d(), e.ok((0, xt._)`${i} === ${uE.default.errors}`);
    function d() {
      t.forIn("key", s, (v) => {
        !c.length && !u.length ? _(v) : t.if(p(v), () => _(v));
      });
    }
    function p(v) {
      let g;
      if (c.length > 8) {
        const E = (0, ji.schemaRefOrVal)(a, n.properties, "properties");
        g = (0, Li.isOwnProperty)(t, E, v);
      } else c.length ? g = (0, xt.or)(...c.map((E) => (0, xt._)`${v} === ${E}`)) : g = xt.nil;
      return u.length && (g = (0, xt.or)(g, ...u.map((E) => (0, xt._)`${(0, Li.usePattern)(e, E)}.test(${v})`))), (0, xt.not)(g);
    }
    function m(v) {
      t.code((0, xt._)`delete ${s}[${v}]`);
    }
    function _(v) {
      if (l.removeAdditional === "all" || l.removeAdditional && r === !1) {
        m(v);
        return;
      }
      if (r === !1) {
        e.setParams({ additionalProperty: v }), e.error(), o || t.break();
        return;
      }
      if (typeof r == "object" && !(0, ji.alwaysValidSchema)(a, r)) {
        const g = t.name("valid");
        l.removeAdditional === "failing" ? ($(v, g, !1), t.if((0, xt.not)(g), () => {
          e.reset(), m(v);
        })) : ($(v, g), o || t.if((0, xt.not)(g), () => t.break()));
      }
    }
    function $(v, g, E) {
      const N = {
        keyword: "additionalProperties",
        dataProp: v,
        dataPropType: ji.Type.Str
      };
      E === !1 && Object.assign(N, {
        compositeRule: !0,
        createErrors: !1,
        allErrors: !1
      }), e.subschema(N, g);
    }
  }
};
Xa.default = fE;
var Fc = {};
Object.defineProperty(Fc, "__esModule", { value: !0 });
const hE = Ht, nf = ue, Uo = V, sf = Xa, pE = {
  keyword: "properties",
  type: "object",
  schemaType: "object",
  code(e) {
    const { gen: t, schema: r, parentSchema: n, data: s, it: i } = e;
    i.opts.removeAdditional === "all" && n.additionalProperties === void 0 && sf.default.code(new hE.KeywordCxt(i, sf.default, "additionalProperties"));
    const a = (0, nf.allSchemaProperties)(r);
    for (const d of a)
      i.definedProperties.add(d);
    i.opts.unevaluated && a.length && i.props !== !0 && (i.props = Uo.mergeEvaluated.props(t, (0, Uo.toHash)(a), i.props));
    const o = a.filter((d) => !(0, Uo.alwaysValidSchema)(i, r[d]));
    if (o.length === 0)
      return;
    const l = t.name("valid");
    for (const d of o)
      c(d) ? u(d) : (t.if((0, nf.propertyInData)(t, s, d, i.opts.ownProperties)), u(d), i.allErrors || t.else().var(l, !0), t.endIf()), e.it.definedProperties.add(d), e.ok(l);
    function c(d) {
      return i.opts.useDefaults && !i.compositeRule && r[d].default !== void 0;
    }
    function u(d) {
      e.subschema({
        keyword: "properties",
        schemaProp: d,
        dataProp: d
      }, l);
    }
  }
};
Fc.default = pE;
var Lc = {};
Object.defineProperty(Lc, "__esModule", { value: !0 });
const af = ue, Mi = ne, of = V, lf = V, mE = {
  keyword: "patternProperties",
  type: "object",
  schemaType: "object",
  code(e) {
    const { gen: t, schema: r, data: n, parentSchema: s, it: i } = e, { opts: a } = i, o = (0, af.allSchemaProperties)(r), l = o.filter(($) => (0, of.alwaysValidSchema)(i, r[$]));
    if (o.length === 0 || l.length === o.length && (!i.opts.unevaluated || i.props === !0))
      return;
    const c = a.strictSchema && !a.allowMatchingProperties && s.properties, u = t.name("valid");
    i.props !== !0 && !(i.props instanceof Mi.Name) && (i.props = (0, lf.evaluatedPropsToName)(t, i.props));
    const { props: d } = i;
    p();
    function p() {
      for (const $ of o)
        c && m($), i.allErrors ? _($) : (t.var(u, !0), _($), t.if(u));
    }
    function m($) {
      for (const v in c)
        new RegExp($).test(v) && (0, of.checkStrictMode)(i, `property ${v} matches pattern ${$} (use allowMatchingProperties)`);
    }
    function _($) {
      t.forIn("key", n, (v) => {
        t.if((0, Mi._)`${(0, af.usePattern)(e, $)}.test(${v})`, () => {
          const g = l.includes($);
          g || e.subschema({
            keyword: "patternProperties",
            schemaProp: $,
            dataProp: v,
            dataPropType: lf.Type.Str
          }, u), i.opts.unevaluated && d !== !0 ? t.assign((0, Mi._)`${d}[${v}]`, !0) : !g && !i.allErrors && t.if((0, Mi.not)(u), () => t.break());
        });
      });
    }
  }
};
Lc.default = mE;
var jc = {};
Object.defineProperty(jc, "__esModule", { value: !0 });
const gE = V, yE = {
  keyword: "not",
  schemaType: ["object", "boolean"],
  trackErrors: !0,
  code(e) {
    const { gen: t, schema: r, it: n } = e;
    if ((0, gE.alwaysValidSchema)(n, r)) {
      e.fail();
      return;
    }
    const s = t.name("valid");
    e.subschema({
      keyword: "not",
      compositeRule: !0,
      createErrors: !1,
      allErrors: !1
    }, s), e.failResult(s, () => e.reset(), () => e.error());
  },
  error: { message: "must NOT be valid" }
};
jc.default = yE;
var Mc = {};
Object.defineProperty(Mc, "__esModule", { value: !0 });
const $E = ue, _E = {
  keyword: "anyOf",
  schemaType: "array",
  trackErrors: !0,
  code: $E.validateUnion,
  error: { message: "must match a schema in anyOf" }
};
Mc.default = _E;
var xc = {};
Object.defineProperty(xc, "__esModule", { value: !0 });
const da = ne, vE = V, wE = {
  message: "must match exactly one schema in oneOf",
  params: ({ params: e }) => (0, da._)`{passingSchemas: ${e.passing}}`
}, EE = {
  keyword: "oneOf",
  schemaType: "array",
  trackErrors: !0,
  error: wE,
  code(e) {
    const { gen: t, schema: r, parentSchema: n, it: s } = e;
    if (!Array.isArray(r))
      throw new Error("ajv implementation error");
    if (s.opts.discriminator && n.discriminator)
      return;
    const i = r, a = t.let("valid", !1), o = t.let("passing", null), l = t.name("_valid");
    e.setParams({ passing: o }), t.block(c), e.result(a, () => e.reset(), () => e.error(!0));
    function c() {
      i.forEach((u, d) => {
        let p;
        (0, vE.alwaysValidSchema)(s, u) ? t.var(l, !0) : p = e.subschema({
          keyword: "oneOf",
          schemaProp: d,
          compositeRule: !0
        }, l), d > 0 && t.if((0, da._)`${l} && ${a}`).assign(a, !1).assign(o, (0, da._)`[${o}, ${d}]`).else(), t.if(l, () => {
          t.assign(a, !0), t.assign(o, d), p && e.mergeEvaluated(p, da.Name);
        });
      });
    }
  }
};
xc.default = EE;
var qc = {};
Object.defineProperty(qc, "__esModule", { value: !0 });
const bE = V, SE = {
  keyword: "allOf",
  schemaType: "array",
  code(e) {
    const { gen: t, schema: r, it: n } = e;
    if (!Array.isArray(r))
      throw new Error("ajv implementation error");
    const s = t.name("valid");
    r.forEach((i, a) => {
      if ((0, bE.alwaysValidSchema)(n, i))
        return;
      const o = e.subschema({ keyword: "allOf", schemaProp: a }, s);
      e.ok(s), e.mergeEvaluated(o);
    });
  }
};
qc.default = SE;
var Vc = {};
Object.defineProperty(Vc, "__esModule", { value: !0 });
const Sa = ne, Pm = V, TE = {
  message: ({ params: e }) => (0, Sa.str)`must match "${e.ifClause}" schema`,
  params: ({ params: e }) => (0, Sa._)`{failingKeyword: ${e.ifClause}}`
}, PE = {
  keyword: "if",
  schemaType: ["object", "boolean"],
  trackErrors: !0,
  error: TE,
  code(e) {
    const { gen: t, parentSchema: r, it: n } = e;
    r.then === void 0 && r.else === void 0 && (0, Pm.checkStrictMode)(n, '"if" without "then" and "else" is ignored');
    const s = cf(n, "then"), i = cf(n, "else");
    if (!s && !i)
      return;
    const a = t.let("valid", !0), o = t.name("_valid");
    if (l(), e.reset(), s && i) {
      const u = t.let("ifClause");
      e.setParams({ ifClause: u }), t.if(o, c("then", u), c("else", u));
    } else s ? t.if(o, c("then")) : t.if((0, Sa.not)(o), c("else"));
    e.pass(a, () => e.error(!0));
    function l() {
      const u = e.subschema({
        keyword: "if",
        compositeRule: !0,
        createErrors: !1,
        allErrors: !1
      }, o);
      e.mergeEvaluated(u);
    }
    function c(u, d) {
      return () => {
        const p = e.subschema({ keyword: u }, o);
        t.assign(a, o), e.mergeValidEvaluated(p, a), d ? t.assign(d, (0, Sa._)`${u}`) : e.setParams({ ifClause: u });
      };
    }
  }
};
function cf(e, t) {
  const r = e.schema[t];
  return r !== void 0 && !(0, Pm.alwaysValidSchema)(e, r);
}
Vc.default = PE;
var Bc = {};
Object.defineProperty(Bc, "__esModule", { value: !0 });
const AE = V, RE = {
  keyword: ["then", "else"],
  schemaType: ["object", "boolean"],
  code({ keyword: e, parentSchema: t, it: r }) {
    t.if === void 0 && (0, AE.checkStrictMode)(r, `"${e}" without "if" is ignored`);
  }
};
Bc.default = RE;
Object.defineProperty(Oc, "__esModule", { value: !0 });
const NE = ls, CE = Ic, OE = cs, IE = Dc, DE = kc, kE = Ya, UE = Uc, FE = Xa, LE = Fc, jE = Lc, ME = jc, xE = Mc, qE = xc, VE = qc, BE = Vc, HE = Bc;
function zE(e = !1) {
  const t = [
    // any
    ME.default,
    xE.default,
    qE.default,
    VE.default,
    BE.default,
    HE.default,
    // object
    UE.default,
    FE.default,
    kE.default,
    LE.default,
    jE.default
  ];
  return e ? t.push(CE.default, IE.default) : t.push(NE.default, OE.default), t.push(DE.default), t;
}
Oc.default = zE;
var Hc = {}, us = {};
Object.defineProperty(us, "__esModule", { value: !0 });
us.dynamicAnchor = void 0;
const Fo = ne, GE = Tt, uf = dt, KE = Er, WE = {
  keyword: "$dynamicAnchor",
  schemaType: "string",
  code: (e) => Am(e, e.schema)
};
function Am(e, t) {
  const { gen: r, it: n } = e;
  n.schemaEnv.root.dynamicAnchors[t] = !0;
  const s = (0, Fo._)`${GE.default.dynamicAnchors}${(0, Fo.getProperty)(t)}`, i = n.errSchemaPath === "#" ? n.validateName : YE(e);
  r.if((0, Fo._)`!${s}`, () => r.assign(s, i));
}
us.dynamicAnchor = Am;
function YE(e) {
  const { schemaEnv: t, schema: r, self: n } = e.it, { root: s, baseId: i, localRefs: a, meta: o } = t.root, { schemaId: l } = n.opts, c = new uf.SchemaEnv({ schema: r, schemaId: l, root: s, baseId: i, localRefs: a, meta: o });
  return uf.compileSchema.call(n, c), (0, KE.getValidate)(e, c);
}
us.default = WE;
var ds = {};
Object.defineProperty(ds, "__esModule", { value: !0 });
ds.dynamicRef = void 0;
const df = ne, XE = Tt, ff = Er, JE = {
  keyword: "$dynamicRef",
  schemaType: "string",
  code: (e) => Rm(e, e.schema)
};
function Rm(e, t) {
  const { gen: r, keyword: n, it: s } = e;
  if (t[0] !== "#")
    throw new Error(`"${n}" only supports hash fragment reference`);
  const i = t.slice(1);
  if (s.allErrors)
    a();
  else {
    const l = r.let("valid", !1);
    a(l), e.ok(l);
  }
  function a(l) {
    if (s.schemaEnv.root.dynamicAnchors[i]) {
      const c = r.let("_v", (0, df._)`${XE.default.dynamicAnchors}${(0, df.getProperty)(i)}`);
      r.if(c, o(c, l), o(s.validateName, l));
    } else
      o(s.validateName, l)();
  }
  function o(l, c) {
    return c ? () => r.block(() => {
      (0, ff.callRef)(e, l), r.let(c, !0);
    }) : () => (0, ff.callRef)(e, l);
  }
}
ds.dynamicRef = Rm;
ds.default = JE;
var zc = {};
Object.defineProperty(zc, "__esModule", { value: !0 });
const QE = us, ZE = V, eb = {
  keyword: "$recursiveAnchor",
  schemaType: "boolean",
  code(e) {
    e.schema ? (0, QE.dynamicAnchor)(e, "") : (0, ZE.checkStrictMode)(e.it, "$recursiveAnchor: false is ignored");
  }
};
zc.default = eb;
var Gc = {};
Object.defineProperty(Gc, "__esModule", { value: !0 });
const tb = ds, rb = {
  keyword: "$recursiveRef",
  schemaType: "string",
  code: (e) => (0, tb.dynamicRef)(e, e.schema)
};
Gc.default = rb;
Object.defineProperty(Hc, "__esModule", { value: !0 });
const nb = us, sb = ds, ib = zc, ab = Gc, ob = [nb.default, sb.default, ib.default, ab.default];
Hc.default = ob;
var Kc = {}, Wc = {};
Object.defineProperty(Wc, "__esModule", { value: !0 });
const hf = Ya, lb = {
  keyword: "dependentRequired",
  type: "object",
  schemaType: "object",
  error: hf.error,
  code: (e) => (0, hf.validatePropertyDeps)(e)
};
Wc.default = lb;
var Yc = {};
Object.defineProperty(Yc, "__esModule", { value: !0 });
const cb = Ya, ub = {
  keyword: "dependentSchemas",
  type: "object",
  schemaType: "object",
  code: (e) => (0, cb.validateSchemaDeps)(e)
};
Yc.default = ub;
var Xc = {};
Object.defineProperty(Xc, "__esModule", { value: !0 });
const db = V, fb = {
  keyword: ["maxContains", "minContains"],
  type: "array",
  schemaType: "number",
  code({ keyword: e, parentSchema: t, it: r }) {
    t.contains === void 0 && (0, db.checkStrictMode)(r, `"${e}" without "contains" is ignored`);
  }
};
Xc.default = fb;
Object.defineProperty(Kc, "__esModule", { value: !0 });
const hb = Wc, pb = Yc, mb = Xc, gb = [hb.default, pb.default, mb.default];
Kc.default = gb;
var Jc = {}, Qc = {};
Object.defineProperty(Qc, "__esModule", { value: !0 });
const Fr = ne, pf = V, yb = Tt, $b = {
  message: "must NOT have unevaluated properties",
  params: ({ params: e }) => (0, Fr._)`{unevaluatedProperty: ${e.unevaluatedProperty}}`
}, _b = {
  keyword: "unevaluatedProperties",
  type: "object",
  schemaType: ["boolean", "object"],
  trackErrors: !0,
  error: $b,
  code(e) {
    const { gen: t, schema: r, data: n, errsCount: s, it: i } = e;
    if (!s)
      throw new Error("ajv implementation error");
    const { allErrors: a, props: o } = i;
    o instanceof Fr.Name ? t.if((0, Fr._)`${o} !== true`, () => t.forIn("key", n, (d) => t.if(c(o, d), () => l(d)))) : o !== !0 && t.forIn("key", n, (d) => o === void 0 ? l(d) : t.if(u(o, d), () => l(d))), i.props = !0, e.ok((0, Fr._)`${s} === ${yb.default.errors}`);
    function l(d) {
      if (r === !1) {
        e.setParams({ unevaluatedProperty: d }), e.error(), a || t.break();
        return;
      }
      if (!(0, pf.alwaysValidSchema)(i, r)) {
        const p = t.name("valid");
        e.subschema({
          keyword: "unevaluatedProperties",
          dataProp: d,
          dataPropType: pf.Type.Str
        }, p), a || t.if((0, Fr.not)(p), () => t.break());
      }
    }
    function c(d, p) {
      return (0, Fr._)`!${d} || !${d}[${p}]`;
    }
    function u(d, p) {
      const m = [];
      for (const _ in d)
        d[_] === !0 && m.push((0, Fr._)`${p} !== ${_}`);
      return (0, Fr.and)(...m);
    }
  }
};
Qc.default = _b;
var Zc = {};
Object.defineProperty(Zc, "__esModule", { value: !0 });
const hn = ne, mf = V, vb = {
  message: ({ params: { len: e } }) => (0, hn.str)`must NOT have more than ${e} items`,
  params: ({ params: { len: e } }) => (0, hn._)`{limit: ${e}}`
}, wb = {
  keyword: "unevaluatedItems",
  type: "array",
  schemaType: ["boolean", "object"],
  error: vb,
  code(e) {
    const { gen: t, schema: r, data: n, it: s } = e, i = s.items || 0;
    if (i === !0)
      return;
    const a = t.const("len", (0, hn._)`${n}.length`);
    if (r === !1)
      e.setParams({ len: i }), e.fail((0, hn._)`${a} > ${i}`);
    else if (typeof r == "object" && !(0, mf.alwaysValidSchema)(s, r)) {
      const l = t.var("valid", (0, hn._)`${a} <= ${i}`);
      t.if((0, hn.not)(l), () => o(l, i)), e.ok(l);
    }
    s.items = !0;
    function o(l, c) {
      t.forRange("i", c, a, (u) => {
        e.subschema({ keyword: "unevaluatedItems", dataProp: u, dataPropType: mf.Type.Num }, l), s.allErrors || t.if((0, hn.not)(l), () => t.break());
      });
    }
  }
};
Zc.default = wb;
Object.defineProperty(Jc, "__esModule", { value: !0 });
const Eb = Qc, bb = Zc, Sb = [Eb.default, bb.default];
Jc.default = Sb;
var eu = {}, tu = {};
Object.defineProperty(tu, "__esModule", { value: !0 });
const Oe = ne, Tb = {
  message: ({ schemaCode: e }) => (0, Oe.str)`must match format "${e}"`,
  params: ({ schemaCode: e }) => (0, Oe._)`{format: ${e}}`
}, Pb = {
  keyword: "format",
  type: ["number", "string"],
  schemaType: "string",
  $data: !0,
  error: Tb,
  code(e, t) {
    const { gen: r, data: n, $data: s, schema: i, schemaCode: a, it: o } = e, { opts: l, errSchemaPath: c, schemaEnv: u, self: d } = o;
    if (!l.validateFormats)
      return;
    s ? p() : m();
    function p() {
      const _ = r.scopeValue("formats", {
        ref: d.formats,
        code: l.code.formats
      }), $ = r.const("fDef", (0, Oe._)`${_}[${a}]`), v = r.let("fType"), g = r.let("format");
      r.if((0, Oe._)`typeof ${$} == "object" && !(${$} instanceof RegExp)`, () => r.assign(v, (0, Oe._)`${$}.type || "string"`).assign(g, (0, Oe._)`${$}.validate`), () => r.assign(v, (0, Oe._)`"string"`).assign(g, $)), e.fail$data((0, Oe.or)(E(), N()));
      function E() {
        return l.strictSchema === !1 ? Oe.nil : (0, Oe._)`${a} && !${g}`;
      }
      function N() {
        const O = u.$async ? (0, Oe._)`(${$}.async ? await ${g}(${n}) : ${g}(${n}))` : (0, Oe._)`${g}(${n})`, U = (0, Oe._)`(typeof ${g} == "function" ? ${O} : ${g}.test(${n}))`;
        return (0, Oe._)`${g} && ${g} !== true && ${v} === ${t} && !${U}`;
      }
    }
    function m() {
      const _ = d.formats[i];
      if (!_) {
        E();
        return;
      }
      if (_ === !0)
        return;
      const [$, v, g] = N(_);
      $ === t && e.pass(O());
      function E() {
        if (l.strictSchema === !1) {
          d.logger.warn(U());
          return;
        }
        throw new Error(U());
        function U() {
          return `unknown format "${i}" ignored in schema at path "${c}"`;
        }
      }
      function N(U) {
        const q = U instanceof RegExp ? (0, Oe.regexpCode)(U) : l.code.formats ? (0, Oe._)`${l.code.formats}${(0, Oe.getProperty)(i)}` : void 0, B = r.scopeValue("formats", { key: i, ref: U, code: q });
        return typeof U == "object" && !(U instanceof RegExp) ? [U.type || "string", U.validate, (0, Oe._)`${B}.validate`] : ["string", U, B];
      }
      function O() {
        if (typeof _ == "object" && !(_ instanceof RegExp) && _.async) {
          if (!u.$async)
            throw new Error("async format in sync schema");
          return (0, Oe._)`await ${g}(${n})`;
        }
        return typeof v == "function" ? (0, Oe._)`${g}(${n})` : (0, Oe._)`${g}.test(${n})`;
      }
    }
  }
};
tu.default = Pb;
Object.defineProperty(eu, "__esModule", { value: !0 });
const Ab = tu, Rb = [Ab.default];
eu.default = Rb;
var rs = {};
Object.defineProperty(rs, "__esModule", { value: !0 });
rs.contentVocabulary = rs.metadataVocabulary = void 0;
rs.metadataVocabulary = [
  "title",
  "description",
  "default",
  "deprecated",
  "readOnly",
  "writeOnly",
  "examples"
];
rs.contentVocabulary = [
  "contentMediaType",
  "contentEncoding",
  "contentSchema"
];
Object.defineProperty(gc, "__esModule", { value: !0 });
const Nb = yc, Cb = _c, Ob = Oc, Ib = Hc, Db = Kc, kb = Jc, Ub = eu, gf = rs, Fb = [
  Ib.default,
  Nb.default,
  Cb.default,
  (0, Ob.default)(!0),
  Ub.default,
  gf.metadataVocabulary,
  gf.contentVocabulary,
  Db.default,
  kb.default
];
gc.default = Fb;
var ru = {}, Ja = {};
Object.defineProperty(Ja, "__esModule", { value: !0 });
Ja.DiscrError = void 0;
var yf;
(function(e) {
  e.Tag = "tag", e.Mapping = "mapping";
})(yf || (Ja.DiscrError = yf = {}));
Object.defineProperty(ru, "__esModule", { value: !0 });
const xn = ne, Rl = Ja, $f = dt, Lb = os, jb = V, Mb = {
  message: ({ params: { discrError: e, tagName: t } }) => e === Rl.DiscrError.Tag ? `tag "${t}" must be string` : `value of tag "${t}" must be in oneOf`,
  params: ({ params: { discrError: e, tag: t, tagName: r } }) => (0, xn._)`{error: ${e}, tag: ${r}, tagValue: ${t}}`
}, xb = {
  keyword: "discriminator",
  type: "object",
  schemaType: "object",
  error: Mb,
  code(e) {
    const { gen: t, data: r, schema: n, parentSchema: s, it: i } = e, { oneOf: a } = s;
    if (!i.opts.discriminator)
      throw new Error("discriminator: requires discriminator option");
    const o = n.propertyName;
    if (typeof o != "string")
      throw new Error("discriminator: requires propertyName");
    if (n.mapping)
      throw new Error("discriminator: mapping is not supported");
    if (!a)
      throw new Error("discriminator: requires oneOf keyword");
    const l = t.let("valid", !1), c = t.const("tag", (0, xn._)`${r}${(0, xn.getProperty)(o)}`);
    t.if((0, xn._)`typeof ${c} == "string"`, () => u(), () => e.error(!1, { discrError: Rl.DiscrError.Tag, tag: c, tagName: o })), e.ok(l);
    function u() {
      const m = p();
      t.if(!1);
      for (const _ in m)
        t.elseIf((0, xn._)`${c} === ${_}`), t.assign(l, d(m[_]));
      t.else(), e.error(!1, { discrError: Rl.DiscrError.Mapping, tag: c, tagName: o }), t.endIf();
    }
    function d(m) {
      const _ = t.name("valid"), $ = e.subschema({ keyword: "oneOf", schemaProp: m }, _);
      return e.mergeEvaluated($, xn.Name), _;
    }
    function p() {
      var m;
      const _ = {}, $ = g(s);
      let v = !0;
      for (let O = 0; O < a.length; O++) {
        let U = a[O];
        if (U != null && U.$ref && !(0, jb.schemaHasRulesButRef)(U, i.self.RULES)) {
          const B = U.$ref;
          if (U = $f.resolveRef.call(i.self, i.schemaEnv.root, i.baseId, B), U instanceof $f.SchemaEnv && (U = U.schema), U === void 0)
            throw new Lb.default(i.opts.uriResolver, i.baseId, B);
        }
        const q = (m = U == null ? void 0 : U.properties) === null || m === void 0 ? void 0 : m[o];
        if (typeof q != "object")
          throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${o}"`);
        v = v && ($ || g(U)), E(q, O);
      }
      if (!v)
        throw new Error(`discriminator: "${o}" must be required`);
      return _;
      function g({ required: O }) {
        return Array.isArray(O) && O.includes(o);
      }
      function E(O, U) {
        if (O.const)
          N(O.const, U);
        else if (O.enum)
          for (const q of O.enum)
            N(q, U);
        else
          throw new Error(`discriminator: "properties/${o}" must have "const" or "enum"`);
      }
      function N(O, U) {
        if (typeof O != "string" || O in _)
          throw new Error(`discriminator: "${o}" values must be unique strings`);
        _[O] = U;
      }
    }
  }
};
ru.default = xb;
var nu = {};
const qb = "https://json-schema.org/draft/2020-12/schema", Vb = "https://json-schema.org/draft/2020-12/schema", Bb = {
  "https://json-schema.org/draft/2020-12/vocab/core": !0,
  "https://json-schema.org/draft/2020-12/vocab/applicator": !0,
  "https://json-schema.org/draft/2020-12/vocab/unevaluated": !0,
  "https://json-schema.org/draft/2020-12/vocab/validation": !0,
  "https://json-schema.org/draft/2020-12/vocab/meta-data": !0,
  "https://json-schema.org/draft/2020-12/vocab/format-annotation": !0,
  "https://json-schema.org/draft/2020-12/vocab/content": !0
}, Hb = "meta", zb = "Core and Validation specifications meta-schema", Gb = [
  {
    $ref: "meta/core"
  },
  {
    $ref: "meta/applicator"
  },
  {
    $ref: "meta/unevaluated"
  },
  {
    $ref: "meta/validation"
  },
  {
    $ref: "meta/meta-data"
  },
  {
    $ref: "meta/format-annotation"
  },
  {
    $ref: "meta/content"
  }
], Kb = [
  "object",
  "boolean"
], Wb = "This meta-schema also defines keywords that have appeared in previous drafts in order to prevent incompatible extensions as they remain in common use.", Yb = {
  definitions: {
    $comment: '"definitions" has been replaced by "$defs".',
    type: "object",
    additionalProperties: {
      $dynamicRef: "#meta"
    },
    deprecated: !0,
    default: {}
  },
  dependencies: {
    $comment: '"dependencies" has been split and replaced by "dependentSchemas" and "dependentRequired" in order to serve their differing semantics.',
    type: "object",
    additionalProperties: {
      anyOf: [
        {
          $dynamicRef: "#meta"
        },
        {
          $ref: "meta/validation#/$defs/stringArray"
        }
      ]
    },
    deprecated: !0,
    default: {}
  },
  $recursiveAnchor: {
    $comment: '"$recursiveAnchor" has been replaced by "$dynamicAnchor".',
    $ref: "meta/core#/$defs/anchorString",
    deprecated: !0
  },
  $recursiveRef: {
    $comment: '"$recursiveRef" has been replaced by "$dynamicRef".',
    $ref: "meta/core#/$defs/uriReferenceString",
    deprecated: !0
  }
}, Xb = {
  $schema: qb,
  $id: Vb,
  $vocabulary: Bb,
  $dynamicAnchor: Hb,
  title: zb,
  allOf: Gb,
  type: Kb,
  $comment: Wb,
  properties: Yb
}, Jb = "https://json-schema.org/draft/2020-12/schema", Qb = "https://json-schema.org/draft/2020-12/meta/applicator", Zb = {
  "https://json-schema.org/draft/2020-12/vocab/applicator": !0
}, e1 = "meta", t1 = "Applicator vocabulary meta-schema", r1 = [
  "object",
  "boolean"
], n1 = {
  prefixItems: {
    $ref: "#/$defs/schemaArray"
  },
  items: {
    $dynamicRef: "#meta"
  },
  contains: {
    $dynamicRef: "#meta"
  },
  additionalProperties: {
    $dynamicRef: "#meta"
  },
  properties: {
    type: "object",
    additionalProperties: {
      $dynamicRef: "#meta"
    },
    default: {}
  },
  patternProperties: {
    type: "object",
    additionalProperties: {
      $dynamicRef: "#meta"
    },
    propertyNames: {
      format: "regex"
    },
    default: {}
  },
  dependentSchemas: {
    type: "object",
    additionalProperties: {
      $dynamicRef: "#meta"
    },
    default: {}
  },
  propertyNames: {
    $dynamicRef: "#meta"
  },
  if: {
    $dynamicRef: "#meta"
  },
  then: {
    $dynamicRef: "#meta"
  },
  else: {
    $dynamicRef: "#meta"
  },
  allOf: {
    $ref: "#/$defs/schemaArray"
  },
  anyOf: {
    $ref: "#/$defs/schemaArray"
  },
  oneOf: {
    $ref: "#/$defs/schemaArray"
  },
  not: {
    $dynamicRef: "#meta"
  }
}, s1 = {
  schemaArray: {
    type: "array",
    minItems: 1,
    items: {
      $dynamicRef: "#meta"
    }
  }
}, i1 = {
  $schema: Jb,
  $id: Qb,
  $vocabulary: Zb,
  $dynamicAnchor: e1,
  title: t1,
  type: r1,
  properties: n1,
  $defs: s1
}, a1 = "https://json-schema.org/draft/2020-12/schema", o1 = "https://json-schema.org/draft/2020-12/meta/unevaluated", l1 = {
  "https://json-schema.org/draft/2020-12/vocab/unevaluated": !0
}, c1 = "meta", u1 = "Unevaluated applicator vocabulary meta-schema", d1 = [
  "object",
  "boolean"
], f1 = {
  unevaluatedItems: {
    $dynamicRef: "#meta"
  },
  unevaluatedProperties: {
    $dynamicRef: "#meta"
  }
}, h1 = {
  $schema: a1,
  $id: o1,
  $vocabulary: l1,
  $dynamicAnchor: c1,
  title: u1,
  type: d1,
  properties: f1
}, p1 = "https://json-schema.org/draft/2020-12/schema", m1 = "https://json-schema.org/draft/2020-12/meta/content", g1 = {
  "https://json-schema.org/draft/2020-12/vocab/content": !0
}, y1 = "meta", $1 = "Content vocabulary meta-schema", _1 = [
  "object",
  "boolean"
], v1 = {
  contentEncoding: {
    type: "string"
  },
  contentMediaType: {
    type: "string"
  },
  contentSchema: {
    $dynamicRef: "#meta"
  }
}, w1 = {
  $schema: p1,
  $id: m1,
  $vocabulary: g1,
  $dynamicAnchor: y1,
  title: $1,
  type: _1,
  properties: v1
}, E1 = "https://json-schema.org/draft/2020-12/schema", b1 = "https://json-schema.org/draft/2020-12/meta/core", S1 = {
  "https://json-schema.org/draft/2020-12/vocab/core": !0
}, T1 = "meta", P1 = "Core vocabulary meta-schema", A1 = [
  "object",
  "boolean"
], R1 = {
  $id: {
    $ref: "#/$defs/uriReferenceString",
    $comment: "Non-empty fragments not allowed.",
    pattern: "^[^#]*#?$"
  },
  $schema: {
    $ref: "#/$defs/uriString"
  },
  $ref: {
    $ref: "#/$defs/uriReferenceString"
  },
  $anchor: {
    $ref: "#/$defs/anchorString"
  },
  $dynamicRef: {
    $ref: "#/$defs/uriReferenceString"
  },
  $dynamicAnchor: {
    $ref: "#/$defs/anchorString"
  },
  $vocabulary: {
    type: "object",
    propertyNames: {
      $ref: "#/$defs/uriString"
    },
    additionalProperties: {
      type: "boolean"
    }
  },
  $comment: {
    type: "string"
  },
  $defs: {
    type: "object",
    additionalProperties: {
      $dynamicRef: "#meta"
    }
  }
}, N1 = {
  anchorString: {
    type: "string",
    pattern: "^[A-Za-z_][-A-Za-z0-9._]*$"
  },
  uriString: {
    type: "string",
    format: "uri"
  },
  uriReferenceString: {
    type: "string",
    format: "uri-reference"
  }
}, C1 = {
  $schema: E1,
  $id: b1,
  $vocabulary: S1,
  $dynamicAnchor: T1,
  title: P1,
  type: A1,
  properties: R1,
  $defs: N1
}, O1 = "https://json-schema.org/draft/2020-12/schema", I1 = "https://json-schema.org/draft/2020-12/meta/format-annotation", D1 = {
  "https://json-schema.org/draft/2020-12/vocab/format-annotation": !0
}, k1 = "meta", U1 = "Format vocabulary meta-schema for annotation results", F1 = [
  "object",
  "boolean"
], L1 = {
  format: {
    type: "string"
  }
}, j1 = {
  $schema: O1,
  $id: I1,
  $vocabulary: D1,
  $dynamicAnchor: k1,
  title: U1,
  type: F1,
  properties: L1
}, M1 = "https://json-schema.org/draft/2020-12/schema", x1 = "https://json-schema.org/draft/2020-12/meta/meta-data", q1 = {
  "https://json-schema.org/draft/2020-12/vocab/meta-data": !0
}, V1 = "meta", B1 = "Meta-data vocabulary meta-schema", H1 = [
  "object",
  "boolean"
], z1 = {
  title: {
    type: "string"
  },
  description: {
    type: "string"
  },
  default: !0,
  deprecated: {
    type: "boolean",
    default: !1
  },
  readOnly: {
    type: "boolean",
    default: !1
  },
  writeOnly: {
    type: "boolean",
    default: !1
  },
  examples: {
    type: "array",
    items: !0
  }
}, G1 = {
  $schema: M1,
  $id: x1,
  $vocabulary: q1,
  $dynamicAnchor: V1,
  title: B1,
  type: H1,
  properties: z1
}, K1 = "https://json-schema.org/draft/2020-12/schema", W1 = "https://json-schema.org/draft/2020-12/meta/validation", Y1 = {
  "https://json-schema.org/draft/2020-12/vocab/validation": !0
}, X1 = "meta", J1 = "Validation vocabulary meta-schema", Q1 = [
  "object",
  "boolean"
], Z1 = {
  type: {
    anyOf: [
      {
        $ref: "#/$defs/simpleTypes"
      },
      {
        type: "array",
        items: {
          $ref: "#/$defs/simpleTypes"
        },
        minItems: 1,
        uniqueItems: !0
      }
    ]
  },
  const: !0,
  enum: {
    type: "array",
    items: !0
  },
  multipleOf: {
    type: "number",
    exclusiveMinimum: 0
  },
  maximum: {
    type: "number"
  },
  exclusiveMaximum: {
    type: "number"
  },
  minimum: {
    type: "number"
  },
  exclusiveMinimum: {
    type: "number"
  },
  maxLength: {
    $ref: "#/$defs/nonNegativeInteger"
  },
  minLength: {
    $ref: "#/$defs/nonNegativeIntegerDefault0"
  },
  pattern: {
    type: "string",
    format: "regex"
  },
  maxItems: {
    $ref: "#/$defs/nonNegativeInteger"
  },
  minItems: {
    $ref: "#/$defs/nonNegativeIntegerDefault0"
  },
  uniqueItems: {
    type: "boolean",
    default: !1
  },
  maxContains: {
    $ref: "#/$defs/nonNegativeInteger"
  },
  minContains: {
    $ref: "#/$defs/nonNegativeInteger",
    default: 1
  },
  maxProperties: {
    $ref: "#/$defs/nonNegativeInteger"
  },
  minProperties: {
    $ref: "#/$defs/nonNegativeIntegerDefault0"
  },
  required: {
    $ref: "#/$defs/stringArray"
  },
  dependentRequired: {
    type: "object",
    additionalProperties: {
      $ref: "#/$defs/stringArray"
    }
  }
}, eS = {
  nonNegativeInteger: {
    type: "integer",
    minimum: 0
  },
  nonNegativeIntegerDefault0: {
    $ref: "#/$defs/nonNegativeInteger",
    default: 0
  },
  simpleTypes: {
    enum: [
      "array",
      "boolean",
      "integer",
      "null",
      "number",
      "object",
      "string"
    ]
  },
  stringArray: {
    type: "array",
    items: {
      type: "string"
    },
    uniqueItems: !0,
    default: []
  }
}, tS = {
  $schema: K1,
  $id: W1,
  $vocabulary: Y1,
  $dynamicAnchor: X1,
  title: J1,
  type: Q1,
  properties: Z1,
  $defs: eS
};
Object.defineProperty(nu, "__esModule", { value: !0 });
const rS = Xb, nS = i1, sS = h1, iS = w1, aS = C1, oS = j1, lS = G1, cS = tS, uS = ["/properties"];
function dS(e) {
  return [
    rS,
    nS,
    sS,
    iS,
    aS,
    t(this, oS),
    lS,
    t(this, cS)
  ].forEach((r) => this.addMetaSchema(r, void 0, !1)), this;
  function t(r, n) {
    return e ? r.$dataMetaSchema(n, uS) : n;
  }
}
nu.default = dS;
(function(e, t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.MissingRefError = t.ValidationError = t.CodeGen = t.Name = t.nil = t.stringify = t.str = t._ = t.KeywordCxt = t.Ajv2020 = void 0;
  const r = Cp, n = gc, s = ru, i = nu, a = "https://json-schema.org/draft/2020-12/schema";
  class o extends r.default {
    constructor(m = {}) {
      super({
        ...m,
        dynamicRef: !0,
        next: !0,
        unevaluated: !0
      });
    }
    _addVocabularies() {
      super._addVocabularies(), n.default.forEach((m) => this.addVocabulary(m)), this.opts.discriminator && this.addKeyword(s.default);
    }
    _addDefaultMetaSchema() {
      super._addDefaultMetaSchema();
      const { $data: m, meta: _ } = this.opts;
      _ && (i.default.call(this, m), this.refs["http://json-schema.org/schema"] = a);
    }
    defaultMeta() {
      return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(a) ? a : void 0);
    }
  }
  t.Ajv2020 = o, e.exports = t = o, e.exports.Ajv2020 = o, Object.defineProperty(t, "__esModule", { value: !0 }), t.default = o;
  var l = Ht;
  Object.defineProperty(t, "KeywordCxt", { enumerable: !0, get: function() {
    return l.KeywordCxt;
  } });
  var c = ne;
  Object.defineProperty(t, "_", { enumerable: !0, get: function() {
    return c._;
  } }), Object.defineProperty(t, "str", { enumerable: !0, get: function() {
    return c.str;
  } }), Object.defineProperty(t, "stringify", { enumerable: !0, get: function() {
    return c.stringify;
  } }), Object.defineProperty(t, "nil", { enumerable: !0, get: function() {
    return c.nil;
  } }), Object.defineProperty(t, "Name", { enumerable: !0, get: function() {
    return c.Name;
  } }), Object.defineProperty(t, "CodeGen", { enumerable: !0, get: function() {
    return c.CodeGen;
  } });
  var u = fi;
  Object.defineProperty(t, "ValidationError", { enumerable: !0, get: function() {
    return u.default;
  } });
  var d = os;
  Object.defineProperty(t, "MissingRefError", { enumerable: !0, get: function() {
    return d.default;
  } });
})(wl, wl.exports);
var fS = wl.exports, Nl = { exports: {} }, Nm = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.formatNames = e.fastFormats = e.fullFormats = void 0;
  function t(W, x) {
    return { validate: W, compare: x };
  }
  e.fullFormats = {
    // date: http://tools.ietf.org/html/rfc3339#section-5.6
    date: t(i, a),
    // date-time: http://tools.ietf.org/html/rfc3339#section-5.6
    time: t(l(!0), c),
    "date-time": t(p(!0), m),
    "iso-time": t(l(), u),
    "iso-date-time": t(p(), _),
    // duration: https://tools.ietf.org/html/rfc3339#appendix-A
    duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/,
    uri: g,
    "uri-reference": /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,
    // uri-template: https://tools.ietf.org/html/rfc6570
    "uri-template": /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i,
    // For the source: https://gist.github.com/dperini/729294
    // For test cases: https://mathiasbynens.be/demo/url-regex
    url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu,
    email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
    hostname: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i,
    // optimized https://www.safaribooksonline.com/library/view/regular-expressions-cookbook/9780596802837/ch07s16.html
    ipv4: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/,
    ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i,
    regex: ye,
    // uuid: http://tools.ietf.org/html/rfc4122
    uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
    // JSON-pointer: https://tools.ietf.org/html/rfc6901
    // uri fragment: https://tools.ietf.org/html/rfc3986#appendix-A
    "json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/,
    "json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,
    // relative JSON-pointer: http://tools.ietf.org/html/draft-luff-relative-json-pointer-00
    "relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,
    // the following formats are used by the openapi specification: https://spec.openapis.org/oas/v3.0.0#data-types
    // byte: https://github.com/miguelmota/is-base64
    byte: N,
    // signed 32 bit integer
    int32: { type: "number", validate: q },
    // signed 64 bit integer
    int64: { type: "number", validate: B },
    // C-type float
    float: { type: "number", validate: me },
    // C-type double
    double: { type: "number", validate: me },
    // hint to the UI to hide input strings
    password: !0,
    // unchecked string payload
    binary: !0
  }, e.fastFormats = {
    ...e.fullFormats,
    date: t(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, a),
    time: t(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, c),
    "date-time": t(/^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, m),
    "iso-time": t(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, u),
    "iso-date-time": t(/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, _),
    // uri: https://github.com/mafintosh/is-my-json-valid/blob/master/formats.js
    uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,
    "uri-reference": /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,
    // email (sources from jsen validator):
    // http://stackoverflow.com/questions/201323/using-a-regular-expression-to-validate-an-email-address#answer-8829363
    // http://www.w3.org/TR/html5/forms.html#valid-e-mail-address (search for 'wilful violation')
    email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i
  }, e.formatNames = Object.keys(e.fullFormats);
  function r(W) {
    return W % 4 === 0 && (W % 100 !== 0 || W % 400 === 0);
  }
  const n = /^(\d\d\d\d)-(\d\d)-(\d\d)$/, s = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  function i(W) {
    const x = n.exec(W);
    if (!x)
      return !1;
    const se = +x[1], F = +x[2], L = +x[3];
    return F >= 1 && F <= 12 && L >= 1 && L <= (F === 2 && r(se) ? 29 : s[F]);
  }
  function a(W, x) {
    if (W && x)
      return W > x ? 1 : W < x ? -1 : 0;
  }
  const o = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i;
  function l(W) {
    return function(se) {
      const F = o.exec(se);
      if (!F)
        return !1;
      const L = +F[1], K = +F[2], M = +F[3], X = F[4], H = F[5] === "-" ? -1 : 1, C = +(F[6] || 0), b = +(F[7] || 0);
      if (C > 23 || b > 59 || W && !X)
        return !1;
      if (L <= 23 && K <= 59 && M < 60)
        return !0;
      const A = K - b * H, S = L - C * H - (A < 0 ? 1 : 0);
      return (S === 23 || S === -1) && (A === 59 || A === -1) && M < 61;
    };
  }
  function c(W, x) {
    if (!(W && x))
      return;
    const se = (/* @__PURE__ */ new Date("2020-01-01T" + W)).valueOf(), F = (/* @__PURE__ */ new Date("2020-01-01T" + x)).valueOf();
    if (se && F)
      return se - F;
  }
  function u(W, x) {
    if (!(W && x))
      return;
    const se = o.exec(W), F = o.exec(x);
    if (se && F)
      return W = se[1] + se[2] + se[3], x = F[1] + F[2] + F[3], W > x ? 1 : W < x ? -1 : 0;
  }
  const d = /t|\s/i;
  function p(W) {
    const x = l(W);
    return function(F) {
      const L = F.split(d);
      return L.length === 2 && i(L[0]) && x(L[1]);
    };
  }
  function m(W, x) {
    if (!(W && x))
      return;
    const se = new Date(W).valueOf(), F = new Date(x).valueOf();
    if (se && F)
      return se - F;
  }
  function _(W, x) {
    if (!(W && x))
      return;
    const [se, F] = W.split(d), [L, K] = x.split(d), M = a(se, L);
    if (M !== void 0)
      return M || c(F, K);
  }
  const $ = /\/|:/, v = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
  function g(W) {
    return $.test(W) && v.test(W);
  }
  const E = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
  function N(W) {
    return E.lastIndex = 0, E.test(W);
  }
  const O = -2147483648, U = 2 ** 31 - 1;
  function q(W) {
    return Number.isInteger(W) && W <= U && W >= O;
  }
  function B(W) {
    return Number.isInteger(W);
  }
  function me() {
    return !0;
  }
  const I = /[^\\]\\Z/;
  function ye(W) {
    if (I.test(W))
      return !1;
    try {
      return new RegExp(W), !0;
    } catch {
      return !1;
    }
  }
})(Nm);
var Cm = {}, Cl = { exports: {} }, Om = {}, zt = {}, ns = {}, pi = {}, ce = {}, Zs = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.regexpCode = e.getEsmExportName = e.getProperty = e.safeStringify = e.stringify = e.strConcat = e.addCodeArg = e.str = e._ = e.nil = e._Code = e.Name = e.IDENTIFIER = e._CodeOrName = void 0;
  class t {
  }
  e._CodeOrName = t, e.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
  class r extends t {
    constructor(E) {
      if (super(), !e.IDENTIFIER.test(E))
        throw new Error("CodeGen: name must be a valid identifier");
      this.str = E;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      return !1;
    }
    get names() {
      return { [this.str]: 1 };
    }
  }
  e.Name = r;
  class n extends t {
    constructor(E) {
      super(), this._items = typeof E == "string" ? [E] : E;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      if (this._items.length > 1)
        return !1;
      const E = this._items[0];
      return E === "" || E === '""';
    }
    get str() {
      var E;
      return (E = this._str) !== null && E !== void 0 ? E : this._str = this._items.reduce((N, O) => `${N}${O}`, "");
    }
    get names() {
      var E;
      return (E = this._names) !== null && E !== void 0 ? E : this._names = this._items.reduce((N, O) => (O instanceof r && (N[O.str] = (N[O.str] || 0) + 1), N), {});
    }
  }
  e._Code = n, e.nil = new n("");
  function s(g, ...E) {
    const N = [g[0]];
    let O = 0;
    for (; O < E.length; )
      o(N, E[O]), N.push(g[++O]);
    return new n(N);
  }
  e._ = s;
  const i = new n("+");
  function a(g, ...E) {
    const N = [m(g[0])];
    let O = 0;
    for (; O < E.length; )
      N.push(i), o(N, E[O]), N.push(i, m(g[++O]));
    return l(N), new n(N);
  }
  e.str = a;
  function o(g, E) {
    E instanceof n ? g.push(...E._items) : E instanceof r ? g.push(E) : g.push(d(E));
  }
  e.addCodeArg = o;
  function l(g) {
    let E = 1;
    for (; E < g.length - 1; ) {
      if (g[E] === i) {
        const N = c(g[E - 1], g[E + 1]);
        if (N !== void 0) {
          g.splice(E - 1, 3, N);
          continue;
        }
        g[E++] = "+";
      }
      E++;
    }
  }
  function c(g, E) {
    if (E === '""')
      return g;
    if (g === '""')
      return E;
    if (typeof g == "string")
      return E instanceof r || g[g.length - 1] !== '"' ? void 0 : typeof E != "string" ? `${g.slice(0, -1)}${E}"` : E[0] === '"' ? g.slice(0, -1) + E.slice(1) : void 0;
    if (typeof E == "string" && E[0] === '"' && !(g instanceof r))
      return `"${g}${E.slice(1)}`;
  }
  function u(g, E) {
    return E.emptyStr() ? g : g.emptyStr() ? E : a`${g}${E}`;
  }
  e.strConcat = u;
  function d(g) {
    return typeof g == "number" || typeof g == "boolean" || g === null ? g : m(Array.isArray(g) ? g.join(",") : g);
  }
  function p(g) {
    return new n(m(g));
  }
  e.stringify = p;
  function m(g) {
    return JSON.stringify(g).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  }
  e.safeStringify = m;
  function _(g) {
    return typeof g == "string" && e.IDENTIFIER.test(g) ? new n(`.${g}`) : s`[${g}]`;
  }
  e.getProperty = _;
  function $(g) {
    if (typeof g == "string" && e.IDENTIFIER.test(g))
      return new n(`${g}`);
    throw new Error(`CodeGen: invalid export name: ${g}, use explicit $id name mapping`);
  }
  e.getEsmExportName = $;
  function v(g) {
    return new n(g.toString());
  }
  e.regexpCode = v;
})(Zs);
var Ol = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.ValueScope = e.ValueScopeName = e.Scope = e.varKinds = e.UsedValueState = void 0;
  const t = Zs;
  class r extends Error {
    constructor(c) {
      super(`CodeGen: "code" for ${c} not defined`), this.value = c.value;
    }
  }
  var n;
  (function(l) {
    l[l.Started = 0] = "Started", l[l.Completed = 1] = "Completed";
  })(n || (e.UsedValueState = n = {})), e.varKinds = {
    const: new t.Name("const"),
    let: new t.Name("let"),
    var: new t.Name("var")
  };
  class s {
    constructor({ prefixes: c, parent: u } = {}) {
      this._names = {}, this._prefixes = c, this._parent = u;
    }
    toName(c) {
      return c instanceof t.Name ? c : this.name(c);
    }
    name(c) {
      return new t.Name(this._newName(c));
    }
    _newName(c) {
      const u = this._names[c] || this._nameGroup(c);
      return `${c}${u.index++}`;
    }
    _nameGroup(c) {
      var u, d;
      if (!((d = (u = this._parent) === null || u === void 0 ? void 0 : u._prefixes) === null || d === void 0) && d.has(c) || this._prefixes && !this._prefixes.has(c))
        throw new Error(`CodeGen: prefix "${c}" is not allowed in this scope`);
      return this._names[c] = { prefix: c, index: 0 };
    }
  }
  e.Scope = s;
  class i extends t.Name {
    constructor(c, u) {
      super(u), this.prefix = c;
    }
    setValue(c, { property: u, itemIndex: d }) {
      this.value = c, this.scopePath = (0, t._)`.${new t.Name(u)}[${d}]`;
    }
  }
  e.ValueScopeName = i;
  const a = (0, t._)`\n`;
  class o extends s {
    constructor(c) {
      super(c), this._values = {}, this._scope = c.scope, this.opts = { ...c, _n: c.lines ? a : t.nil };
    }
    get() {
      return this._scope;
    }
    name(c) {
      return new i(c, this._newName(c));
    }
    value(c, u) {
      var d;
      if (u.ref === void 0)
        throw new Error("CodeGen: ref must be passed in value");
      const p = this.toName(c), { prefix: m } = p, _ = (d = u.key) !== null && d !== void 0 ? d : u.ref;
      let $ = this._values[m];
      if ($) {
        const E = $.get(_);
        if (E)
          return E;
      } else
        $ = this._values[m] = /* @__PURE__ */ new Map();
      $.set(_, p);
      const v = this._scope[m] || (this._scope[m] = []), g = v.length;
      return v[g] = u.ref, p.setValue(u, { property: m, itemIndex: g }), p;
    }
    getValue(c, u) {
      const d = this._values[c];
      if (d)
        return d.get(u);
    }
    scopeRefs(c, u = this._values) {
      return this._reduceValues(u, (d) => {
        if (d.scopePath === void 0)
          throw new Error(`CodeGen: name "${d}" has no value`);
        return (0, t._)`${c}${d.scopePath}`;
      });
    }
    scopeCode(c = this._values, u, d) {
      return this._reduceValues(c, (p) => {
        if (p.value === void 0)
          throw new Error(`CodeGen: name "${p}" has no value`);
        return p.value.code;
      }, u, d);
    }
    _reduceValues(c, u, d = {}, p) {
      let m = t.nil;
      for (const _ in c) {
        const $ = c[_];
        if (!$)
          continue;
        const v = d[_] = d[_] || /* @__PURE__ */ new Map();
        $.forEach((g) => {
          if (v.has(g))
            return;
          v.set(g, n.Started);
          let E = u(g);
          if (E) {
            const N = this.opts.es5 ? e.varKinds.var : e.varKinds.const;
            m = (0, t._)`${m}${N} ${g} = ${E};${this.opts._n}`;
          } else if (E = p == null ? void 0 : p(g))
            m = (0, t._)`${m}${E}${this.opts._n}`;
          else
            throw new r(g);
          v.set(g, n.Completed);
        });
      }
      return m;
    }
  }
  e.ValueScope = o;
})(Ol);
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.or = e.and = e.not = e.CodeGen = e.operators = e.varKinds = e.ValueScopeName = e.ValueScope = e.Scope = e.Name = e.regexpCode = e.stringify = e.getProperty = e.nil = e.strConcat = e.str = e._ = void 0;
  const t = Zs, r = Ol;
  var n = Zs;
  Object.defineProperty(e, "_", { enumerable: !0, get: function() {
    return n._;
  } }), Object.defineProperty(e, "str", { enumerable: !0, get: function() {
    return n.str;
  } }), Object.defineProperty(e, "strConcat", { enumerable: !0, get: function() {
    return n.strConcat;
  } }), Object.defineProperty(e, "nil", { enumerable: !0, get: function() {
    return n.nil;
  } }), Object.defineProperty(e, "getProperty", { enumerable: !0, get: function() {
    return n.getProperty;
  } }), Object.defineProperty(e, "stringify", { enumerable: !0, get: function() {
    return n.stringify;
  } }), Object.defineProperty(e, "regexpCode", { enumerable: !0, get: function() {
    return n.regexpCode;
  } }), Object.defineProperty(e, "Name", { enumerable: !0, get: function() {
    return n.Name;
  } });
  var s = Ol;
  Object.defineProperty(e, "Scope", { enumerable: !0, get: function() {
    return s.Scope;
  } }), Object.defineProperty(e, "ValueScope", { enumerable: !0, get: function() {
    return s.ValueScope;
  } }), Object.defineProperty(e, "ValueScopeName", { enumerable: !0, get: function() {
    return s.ValueScopeName;
  } }), Object.defineProperty(e, "varKinds", { enumerable: !0, get: function() {
    return s.varKinds;
  } }), e.operators = {
    GT: new t._Code(">"),
    GTE: new t._Code(">="),
    LT: new t._Code("<"),
    LTE: new t._Code("<="),
    EQ: new t._Code("==="),
    NEQ: new t._Code("!=="),
    NOT: new t._Code("!"),
    OR: new t._Code("||"),
    AND: new t._Code("&&"),
    ADD: new t._Code("+")
  };
  class i {
    optimizeNodes() {
      return this;
    }
    optimizeNames(f, y) {
      return this;
    }
  }
  class a extends i {
    constructor(f, y, P) {
      super(), this.varKind = f, this.name = y, this.rhs = P;
    }
    render({ es5: f, _n: y }) {
      const P = f ? r.varKinds.var : this.varKind, w = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
      return `${P} ${this.name}${w};` + y;
    }
    optimizeNames(f, y) {
      if (f[this.name.str])
        return this.rhs && (this.rhs = F(this.rhs, f, y)), this;
    }
    get names() {
      return this.rhs instanceof t._CodeOrName ? this.rhs.names : {};
    }
  }
  class o extends i {
    constructor(f, y, P) {
      super(), this.lhs = f, this.rhs = y, this.sideEffects = P;
    }
    render({ _n: f }) {
      return `${this.lhs} = ${this.rhs};` + f;
    }
    optimizeNames(f, y) {
      if (!(this.lhs instanceof t.Name && !f[this.lhs.str] && !this.sideEffects))
        return this.rhs = F(this.rhs, f, y), this;
    }
    get names() {
      const f = this.lhs instanceof t.Name ? {} : { ...this.lhs.names };
      return se(f, this.rhs);
    }
  }
  class l extends o {
    constructor(f, y, P, w) {
      super(f, P, w), this.op = y;
    }
    render({ _n: f }) {
      return `${this.lhs} ${this.op}= ${this.rhs};` + f;
    }
  }
  class c extends i {
    constructor(f) {
      super(), this.label = f, this.names = {};
    }
    render({ _n: f }) {
      return `${this.label}:` + f;
    }
  }
  class u extends i {
    constructor(f) {
      super(), this.label = f, this.names = {};
    }
    render({ _n: f }) {
      return `break${this.label ? ` ${this.label}` : ""};` + f;
    }
  }
  class d extends i {
    constructor(f) {
      super(), this.error = f;
    }
    render({ _n: f }) {
      return `throw ${this.error};` + f;
    }
    get names() {
      return this.error.names;
    }
  }
  class p extends i {
    constructor(f) {
      super(), this.code = f;
    }
    render({ _n: f }) {
      return `${this.code};` + f;
    }
    optimizeNodes() {
      return `${this.code}` ? this : void 0;
    }
    optimizeNames(f, y) {
      return this.code = F(this.code, f, y), this;
    }
    get names() {
      return this.code instanceof t._CodeOrName ? this.code.names : {};
    }
  }
  class m extends i {
    constructor(f = []) {
      super(), this.nodes = f;
    }
    render(f) {
      return this.nodes.reduce((y, P) => y + P.render(f), "");
    }
    optimizeNodes() {
      const { nodes: f } = this;
      let y = f.length;
      for (; y--; ) {
        const P = f[y].optimizeNodes();
        Array.isArray(P) ? f.splice(y, 1, ...P) : P ? f[y] = P : f.splice(y, 1);
      }
      return f.length > 0 ? this : void 0;
    }
    optimizeNames(f, y) {
      const { nodes: P } = this;
      let w = P.length;
      for (; w--; ) {
        const h = P[w];
        h.optimizeNames(f, y) || (L(f, h.names), P.splice(w, 1));
      }
      return P.length > 0 ? this : void 0;
    }
    get names() {
      return this.nodes.reduce((f, y) => x(f, y.names), {});
    }
  }
  class _ extends m {
    render(f) {
      return "{" + f._n + super.render(f) + "}" + f._n;
    }
  }
  class $ extends m {
  }
  class v extends _ {
  }
  v.kind = "else";
  class g extends _ {
    constructor(f, y) {
      super(y), this.condition = f;
    }
    render(f) {
      let y = `if(${this.condition})` + super.render(f);
      return this.else && (y += "else " + this.else.render(f)), y;
    }
    optimizeNodes() {
      super.optimizeNodes();
      const f = this.condition;
      if (f === !0)
        return this.nodes;
      let y = this.else;
      if (y) {
        const P = y.optimizeNodes();
        y = this.else = Array.isArray(P) ? new v(P) : P;
      }
      if (y)
        return f === !1 ? y instanceof g ? y : y.nodes : this.nodes.length ? this : new g(K(f), y instanceof g ? [y] : y.nodes);
      if (!(f === !1 || !this.nodes.length))
        return this;
    }
    optimizeNames(f, y) {
      var P;
      if (this.else = (P = this.else) === null || P === void 0 ? void 0 : P.optimizeNames(f, y), !!(super.optimizeNames(f, y) || this.else))
        return this.condition = F(this.condition, f, y), this;
    }
    get names() {
      const f = super.names;
      return se(f, this.condition), this.else && x(f, this.else.names), f;
    }
  }
  g.kind = "if";
  class E extends _ {
  }
  E.kind = "for";
  class N extends E {
    constructor(f) {
      super(), this.iteration = f;
    }
    render(f) {
      return `for(${this.iteration})` + super.render(f);
    }
    optimizeNames(f, y) {
      if (super.optimizeNames(f, y))
        return this.iteration = F(this.iteration, f, y), this;
    }
    get names() {
      return x(super.names, this.iteration.names);
    }
  }
  class O extends E {
    constructor(f, y, P, w) {
      super(), this.varKind = f, this.name = y, this.from = P, this.to = w;
    }
    render(f) {
      const y = f.es5 ? r.varKinds.var : this.varKind, { name: P, from: w, to: h } = this;
      return `for(${y} ${P}=${w}; ${P}<${h}; ${P}++)` + super.render(f);
    }
    get names() {
      const f = se(super.names, this.from);
      return se(f, this.to);
    }
  }
  class U extends E {
    constructor(f, y, P, w) {
      super(), this.loop = f, this.varKind = y, this.name = P, this.iterable = w;
    }
    render(f) {
      return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(f);
    }
    optimizeNames(f, y) {
      if (super.optimizeNames(f, y))
        return this.iterable = F(this.iterable, f, y), this;
    }
    get names() {
      return x(super.names, this.iterable.names);
    }
  }
  class q extends _ {
    constructor(f, y, P) {
      super(), this.name = f, this.args = y, this.async = P;
    }
    render(f) {
      return `${this.async ? "async " : ""}function ${this.name}(${this.args})` + super.render(f);
    }
  }
  q.kind = "func";
  class B extends m {
    render(f) {
      return "return " + super.render(f);
    }
  }
  B.kind = "return";
  class me extends _ {
    render(f) {
      let y = "try" + super.render(f);
      return this.catch && (y += this.catch.render(f)), this.finally && (y += this.finally.render(f)), y;
    }
    optimizeNodes() {
      var f, y;
      return super.optimizeNodes(), (f = this.catch) === null || f === void 0 || f.optimizeNodes(), (y = this.finally) === null || y === void 0 || y.optimizeNodes(), this;
    }
    optimizeNames(f, y) {
      var P, w;
      return super.optimizeNames(f, y), (P = this.catch) === null || P === void 0 || P.optimizeNames(f, y), (w = this.finally) === null || w === void 0 || w.optimizeNames(f, y), this;
    }
    get names() {
      const f = super.names;
      return this.catch && x(f, this.catch.names), this.finally && x(f, this.finally.names), f;
    }
  }
  class I extends _ {
    constructor(f) {
      super(), this.error = f;
    }
    render(f) {
      return `catch(${this.error})` + super.render(f);
    }
  }
  I.kind = "catch";
  class ye extends _ {
    render(f) {
      return "finally" + super.render(f);
    }
  }
  ye.kind = "finally";
  class W {
    constructor(f, y = {}) {
      this._values = {}, this._blockStarts = [], this._constants = {}, this.opts = { ...y, _n: y.lines ? `
` : "" }, this._extScope = f, this._scope = new r.Scope({ parent: f }), this._nodes = [new $()];
    }
    toString() {
      return this._root.render(this.opts);
    }
    // returns unique name in the internal scope
    name(f) {
      return this._scope.name(f);
    }
    // reserves unique name in the external scope
    scopeName(f) {
      return this._extScope.name(f);
    }
    // reserves unique name in the external scope and assigns value to it
    scopeValue(f, y) {
      const P = this._extScope.value(f, y);
      return (this._values[P.prefix] || (this._values[P.prefix] = /* @__PURE__ */ new Set())).add(P), P;
    }
    getScopeValue(f, y) {
      return this._extScope.getValue(f, y);
    }
    // return code that assigns values in the external scope to the names that are used internally
    // (same names that were returned by gen.scopeName or gen.scopeValue)
    scopeRefs(f) {
      return this._extScope.scopeRefs(f, this._values);
    }
    scopeCode() {
      return this._extScope.scopeCode(this._values);
    }
    _def(f, y, P, w) {
      const h = this._scope.toName(y);
      return P !== void 0 && w && (this._constants[h.str] = P), this._leafNode(new a(f, h, P)), h;
    }
    // `const` declaration (`var` in es5 mode)
    const(f, y, P) {
      return this._def(r.varKinds.const, f, y, P);
    }
    // `let` declaration with optional assignment (`var` in es5 mode)
    let(f, y, P) {
      return this._def(r.varKinds.let, f, y, P);
    }
    // `var` declaration with optional assignment
    var(f, y, P) {
      return this._def(r.varKinds.var, f, y, P);
    }
    // assignment code
    assign(f, y, P) {
      return this._leafNode(new o(f, y, P));
    }
    // `+=` code
    add(f, y) {
      return this._leafNode(new l(f, e.operators.ADD, y));
    }
    // appends passed SafeExpr to code or executes Block
    code(f) {
      return typeof f == "function" ? f() : f !== t.nil && this._leafNode(new p(f)), this;
    }
    // returns code for object literal for the passed argument list of key-value pairs
    object(...f) {
      const y = ["{"];
      for (const [P, w] of f)
        y.length > 1 && y.push(","), y.push(P), (P !== w || this.opts.es5) && (y.push(":"), (0, t.addCodeArg)(y, w));
      return y.push("}"), new t._Code(y);
    }
    // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
    if(f, y, P) {
      if (this._blockNode(new g(f)), y && P)
        this.code(y).else().code(P).endIf();
      else if (y)
        this.code(y).endIf();
      else if (P)
        throw new Error('CodeGen: "else" body without "then" body');
      return this;
    }
    // `else if` clause - invalid without `if` or after `else` clauses
    elseIf(f) {
      return this._elseNode(new g(f));
    }
    // `else` clause - only valid after `if` or `else if` clauses
    else() {
      return this._elseNode(new v());
    }
    // end `if` statement (needed if gen.if was used only with condition)
    endIf() {
      return this._endBlockNode(g, v);
    }
    _for(f, y) {
      return this._blockNode(f), y && this.code(y).endFor(), this;
    }
    // a generic `for` clause (or statement if `forBody` is passed)
    for(f, y) {
      return this._for(new N(f), y);
    }
    // `for` statement for a range of values
    forRange(f, y, P, w, h = this.opts.es5 ? r.varKinds.var : r.varKinds.let) {
      const k = this._scope.toName(f);
      return this._for(new O(h, k, y, P), () => w(k));
    }
    // `for-of` statement (in es5 mode replace with a normal for loop)
    forOf(f, y, P, w = r.varKinds.const) {
      const h = this._scope.toName(f);
      if (this.opts.es5) {
        const k = y instanceof t.Name ? y : this.var("_arr", y);
        return this.forRange("_i", 0, (0, t._)`${k}.length`, (R) => {
          this.var(h, (0, t._)`${k}[${R}]`), P(h);
        });
      }
      return this._for(new U("of", w, h, y), () => P(h));
    }
    // `for-in` statement.
    // With option `ownProperties` replaced with a `for-of` loop for object keys
    forIn(f, y, P, w = this.opts.es5 ? r.varKinds.var : r.varKinds.const) {
      if (this.opts.ownProperties)
        return this.forOf(f, (0, t._)`Object.keys(${y})`, P);
      const h = this._scope.toName(f);
      return this._for(new U("in", w, h, y), () => P(h));
    }
    // end `for` loop
    endFor() {
      return this._endBlockNode(E);
    }
    // `label` statement
    label(f) {
      return this._leafNode(new c(f));
    }
    // `break` statement
    break(f) {
      return this._leafNode(new u(f));
    }
    // `return` statement
    return(f) {
      const y = new B();
      if (this._blockNode(y), this.code(f), y.nodes.length !== 1)
        throw new Error('CodeGen: "return" should have one node');
      return this._endBlockNode(B);
    }
    // `try` statement
    try(f, y, P) {
      if (!y && !P)
        throw new Error('CodeGen: "try" without "catch" and "finally"');
      const w = new me();
      if (this._blockNode(w), this.code(f), y) {
        const h = this.name("e");
        this._currNode = w.catch = new I(h), y(h);
      }
      return P && (this._currNode = w.finally = new ye(), this.code(P)), this._endBlockNode(I, ye);
    }
    // `throw` statement
    throw(f) {
      return this._leafNode(new d(f));
    }
    // start self-balancing block
    block(f, y) {
      return this._blockStarts.push(this._nodes.length), f && this.code(f).endBlock(y), this;
    }
    // end the current self-balancing block
    endBlock(f) {
      const y = this._blockStarts.pop();
      if (y === void 0)
        throw new Error("CodeGen: not in self-balancing block");
      const P = this._nodes.length - y;
      if (P < 0 || f !== void 0 && P !== f)
        throw new Error(`CodeGen: wrong number of nodes: ${P} vs ${f} expected`);
      return this._nodes.length = y, this;
    }
    // `function` heading (or definition if funcBody is passed)
    func(f, y = t.nil, P, w) {
      return this._blockNode(new q(f, y, P)), w && this.code(w).endFunc(), this;
    }
    // end function definition
    endFunc() {
      return this._endBlockNode(q);
    }
    optimize(f = 1) {
      for (; f-- > 0; )
        this._root.optimizeNodes(), this._root.optimizeNames(this._root.names, this._constants);
    }
    _leafNode(f) {
      return this._currNode.nodes.push(f), this;
    }
    _blockNode(f) {
      this._currNode.nodes.push(f), this._nodes.push(f);
    }
    _endBlockNode(f, y) {
      const P = this._currNode;
      if (P instanceof f || y && P instanceof y)
        return this._nodes.pop(), this;
      throw new Error(`CodeGen: not in block "${y ? `${f.kind}/${y.kind}` : f.kind}"`);
    }
    _elseNode(f) {
      const y = this._currNode;
      if (!(y instanceof g))
        throw new Error('CodeGen: "else" without "if"');
      return this._currNode = y.else = f, this;
    }
    get _root() {
      return this._nodes[0];
    }
    get _currNode() {
      const f = this._nodes;
      return f[f.length - 1];
    }
    set _currNode(f) {
      const y = this._nodes;
      y[y.length - 1] = f;
    }
  }
  e.CodeGen = W;
  function x(S, f) {
    for (const y in f)
      S[y] = (S[y] || 0) + (f[y] || 0);
    return S;
  }
  function se(S, f) {
    return f instanceof t._CodeOrName ? x(S, f.names) : S;
  }
  function F(S, f, y) {
    if (S instanceof t.Name)
      return P(S);
    if (!w(S))
      return S;
    return new t._Code(S._items.reduce((h, k) => (k instanceof t.Name && (k = P(k)), k instanceof t._Code ? h.push(...k._items) : h.push(k), h), []));
    function P(h) {
      const k = y[h.str];
      return k === void 0 || f[h.str] !== 1 ? h : (delete f[h.str], k);
    }
    function w(h) {
      return h instanceof t._Code && h._items.some((k) => k instanceof t.Name && f[k.str] === 1 && y[k.str] !== void 0);
    }
  }
  function L(S, f) {
    for (const y in f)
      S[y] = (S[y] || 0) - (f[y] || 0);
  }
  function K(S) {
    return typeof S == "boolean" || typeof S == "number" || S === null ? !S : (0, t._)`!${A(S)}`;
  }
  e.not = K;
  const M = b(e.operators.AND);
  function X(...S) {
    return S.reduce(M);
  }
  e.and = X;
  const H = b(e.operators.OR);
  function C(...S) {
    return S.reduce(H);
  }
  e.or = C;
  function b(S) {
    return (f, y) => f === t.nil ? y : y === t.nil ? f : (0, t._)`${A(f)} ${S} ${A(y)}`;
  }
  function A(S) {
    return S instanceof t.Name ? S : (0, t._)`(${S})`;
  }
})(ce);
var G = {};
Object.defineProperty(G, "__esModule", { value: !0 });
G.checkStrictMode = G.getErrorPath = G.Type = G.useFunc = G.setEvaluated = G.evaluatedPropsToName = G.mergeEvaluated = G.eachItem = G.unescapeJsonPointer = G.escapeJsonPointer = G.escapeFragment = G.unescapeFragment = G.schemaRefOrVal = G.schemaHasRulesButRef = G.schemaHasRules = G.checkUnknownRules = G.alwaysValidSchema = G.toHash = void 0;
const ve = ce, hS = Zs;
function pS(e) {
  const t = {};
  for (const r of e)
    t[r] = !0;
  return t;
}
G.toHash = pS;
function mS(e, t) {
  return typeof t == "boolean" ? t : Object.keys(t).length === 0 ? !0 : (Im(e, t), !Dm(t, e.self.RULES.all));
}
G.alwaysValidSchema = mS;
function Im(e, t = e.schema) {
  const { opts: r, self: n } = e;
  if (!r.strictSchema || typeof t == "boolean")
    return;
  const s = n.RULES.keywords;
  for (const i in t)
    s[i] || Fm(e, `unknown keyword: "${i}"`);
}
G.checkUnknownRules = Im;
function Dm(e, t) {
  if (typeof e == "boolean")
    return !e;
  for (const r in e)
    if (t[r])
      return !0;
  return !1;
}
G.schemaHasRules = Dm;
function gS(e, t) {
  if (typeof e == "boolean")
    return !e;
  for (const r in e)
    if (r !== "$ref" && t.all[r])
      return !0;
  return !1;
}
G.schemaHasRulesButRef = gS;
function yS({ topSchemaRef: e, schemaPath: t }, r, n, s) {
  if (!s) {
    if (typeof r == "number" || typeof r == "boolean")
      return r;
    if (typeof r == "string")
      return (0, ve._)`${r}`;
  }
  return (0, ve._)`${e}${t}${(0, ve.getProperty)(n)}`;
}
G.schemaRefOrVal = yS;
function $S(e) {
  return km(decodeURIComponent(e));
}
G.unescapeFragment = $S;
function _S(e) {
  return encodeURIComponent(su(e));
}
G.escapeFragment = _S;
function su(e) {
  return typeof e == "number" ? `${e}` : e.replace(/~/g, "~0").replace(/\//g, "~1");
}
G.escapeJsonPointer = su;
function km(e) {
  return e.replace(/~1/g, "/").replace(/~0/g, "~");
}
G.unescapeJsonPointer = km;
function vS(e, t) {
  if (Array.isArray(e))
    for (const r of e)
      t(r);
  else
    t(e);
}
G.eachItem = vS;
function _f({ mergeNames: e, mergeToName: t, mergeValues: r, resultToName: n }) {
  return (s, i, a, o) => {
    const l = a === void 0 ? i : a instanceof ve.Name ? (i instanceof ve.Name ? e(s, i, a) : t(s, i, a), a) : i instanceof ve.Name ? (t(s, a, i), i) : r(i, a);
    return o === ve.Name && !(l instanceof ve.Name) ? n(s, l) : l;
  };
}
G.mergeEvaluated = {
  props: _f({
    mergeNames: (e, t, r) => e.if((0, ve._)`${r} !== true && ${t} !== undefined`, () => {
      e.if((0, ve._)`${t} === true`, () => e.assign(r, !0), () => e.assign(r, (0, ve._)`${r} || {}`).code((0, ve._)`Object.assign(${r}, ${t})`));
    }),
    mergeToName: (e, t, r) => e.if((0, ve._)`${r} !== true`, () => {
      t === !0 ? e.assign(r, !0) : (e.assign(r, (0, ve._)`${r} || {}`), iu(e, r, t));
    }),
    mergeValues: (e, t) => e === !0 ? !0 : { ...e, ...t },
    resultToName: Um
  }),
  items: _f({
    mergeNames: (e, t, r) => e.if((0, ve._)`${r} !== true && ${t} !== undefined`, () => e.assign(r, (0, ve._)`${t} === true ? true : ${r} > ${t} ? ${r} : ${t}`)),
    mergeToName: (e, t, r) => e.if((0, ve._)`${r} !== true`, () => e.assign(r, t === !0 ? !0 : (0, ve._)`${r} > ${t} ? ${r} : ${t}`)),
    mergeValues: (e, t) => e === !0 ? !0 : Math.max(e, t),
    resultToName: (e, t) => e.var("items", t)
  })
};
function Um(e, t) {
  if (t === !0)
    return e.var("props", !0);
  const r = e.var("props", (0, ve._)`{}`);
  return t !== void 0 && iu(e, r, t), r;
}
G.evaluatedPropsToName = Um;
function iu(e, t, r) {
  Object.keys(r).forEach((n) => e.assign((0, ve._)`${t}${(0, ve.getProperty)(n)}`, !0));
}
G.setEvaluated = iu;
const vf = {};
function wS(e, t) {
  return e.scopeValue("func", {
    ref: t,
    code: vf[t.code] || (vf[t.code] = new hS._Code(t.code))
  });
}
G.useFunc = wS;
var Il;
(function(e) {
  e[e.Num = 0] = "Num", e[e.Str = 1] = "Str";
})(Il || (G.Type = Il = {}));
function ES(e, t, r) {
  if (e instanceof ve.Name) {
    const n = t === Il.Num;
    return r ? n ? (0, ve._)`"[" + ${e} + "]"` : (0, ve._)`"['" + ${e} + "']"` : n ? (0, ve._)`"/" + ${e}` : (0, ve._)`"/" + ${e}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
  }
  return r ? (0, ve.getProperty)(e).toString() : "/" + su(e);
}
G.getErrorPath = ES;
function Fm(e, t, r = e.opts.strictSchema) {
  if (r) {
    if (t = `strict mode: ${t}`, r === !0)
      throw new Error(t);
    e.self.logger.warn(t);
  }
}
G.checkStrictMode = Fm;
var ir = {};
Object.defineProperty(ir, "__esModule", { value: !0 });
const et = ce, bS = {
  // validation function arguments
  data: new et.Name("data"),
  // data passed to validation function
  // args passed from referencing schema
  valCxt: new et.Name("valCxt"),
  // validation/data context - should not be used directly, it is destructured to the names below
  instancePath: new et.Name("instancePath"),
  parentData: new et.Name("parentData"),
  parentDataProperty: new et.Name("parentDataProperty"),
  rootData: new et.Name("rootData"),
  // root data - same as the data passed to the first/top validation function
  dynamicAnchors: new et.Name("dynamicAnchors"),
  // used to support recursiveRef and dynamicRef
  // function scoped variables
  vErrors: new et.Name("vErrors"),
  // null or array of validation errors
  errors: new et.Name("errors"),
  // counter of validation errors
  this: new et.Name("this"),
  // "globals"
  self: new et.Name("self"),
  scope: new et.Name("scope"),
  // JTD serialize/parse name for JSON string and position
  json: new et.Name("json"),
  jsonPos: new et.Name("jsonPos"),
  jsonLen: new et.Name("jsonLen"),
  jsonPart: new et.Name("jsonPart")
};
ir.default = bS;
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.extendErrors = e.resetErrorsCount = e.reportExtraError = e.reportError = e.keyword$DataError = e.keywordError = void 0;
  const t = ce, r = G, n = ir;
  e.keywordError = {
    message: ({ keyword: v }) => (0, t.str)`must pass "${v}" keyword validation`
  }, e.keyword$DataError = {
    message: ({ keyword: v, schemaType: g }) => g ? (0, t.str)`"${v}" keyword must be ${g} ($data)` : (0, t.str)`"${v}" keyword is invalid ($data)`
  };
  function s(v, g = e.keywordError, E, N) {
    const { it: O } = v, { gen: U, compositeRule: q, allErrors: B } = O, me = d(v, g, E);
    N ?? (q || B) ? l(U, me) : c(O, (0, t._)`[${me}]`);
  }
  e.reportError = s;
  function i(v, g = e.keywordError, E) {
    const { it: N } = v, { gen: O, compositeRule: U, allErrors: q } = N, B = d(v, g, E);
    l(O, B), U || q || c(N, n.default.vErrors);
  }
  e.reportExtraError = i;
  function a(v, g) {
    v.assign(n.default.errors, g), v.if((0, t._)`${n.default.vErrors} !== null`, () => v.if(g, () => v.assign((0, t._)`${n.default.vErrors}.length`, g), () => v.assign(n.default.vErrors, null)));
  }
  e.resetErrorsCount = a;
  function o({ gen: v, keyword: g, schemaValue: E, data: N, errsCount: O, it: U }) {
    if (O === void 0)
      throw new Error("ajv implementation error");
    const q = v.name("err");
    v.forRange("i", O, n.default.errors, (B) => {
      v.const(q, (0, t._)`${n.default.vErrors}[${B}]`), v.if((0, t._)`${q}.instancePath === undefined`, () => v.assign((0, t._)`${q}.instancePath`, (0, t.strConcat)(n.default.instancePath, U.errorPath))), v.assign((0, t._)`${q}.schemaPath`, (0, t.str)`${U.errSchemaPath}/${g}`), U.opts.verbose && (v.assign((0, t._)`${q}.schema`, E), v.assign((0, t._)`${q}.data`, N));
    });
  }
  e.extendErrors = o;
  function l(v, g) {
    const E = v.const("err", g);
    v.if((0, t._)`${n.default.vErrors} === null`, () => v.assign(n.default.vErrors, (0, t._)`[${E}]`), (0, t._)`${n.default.vErrors}.push(${E})`), v.code((0, t._)`${n.default.errors}++`);
  }
  function c(v, g) {
    const { gen: E, validateName: N, schemaEnv: O } = v;
    O.$async ? E.throw((0, t._)`new ${v.ValidationError}(${g})`) : (E.assign((0, t._)`${N}.errors`, g), E.return(!1));
  }
  const u = {
    keyword: new t.Name("keyword"),
    schemaPath: new t.Name("schemaPath"),
    // also used in JTD errors
    params: new t.Name("params"),
    propertyName: new t.Name("propertyName"),
    message: new t.Name("message"),
    schema: new t.Name("schema"),
    parentSchema: new t.Name("parentSchema")
  };
  function d(v, g, E) {
    const { createErrors: N } = v.it;
    return N === !1 ? (0, t._)`{}` : p(v, g, E);
  }
  function p(v, g, E = {}) {
    const { gen: N, it: O } = v, U = [
      m(O, E),
      _(v, E)
    ];
    return $(v, g, U), N.object(...U);
  }
  function m({ errorPath: v }, { instancePath: g }) {
    const E = g ? (0, t.str)`${v}${(0, r.getErrorPath)(g, r.Type.Str)}` : v;
    return [n.default.instancePath, (0, t.strConcat)(n.default.instancePath, E)];
  }
  function _({ keyword: v, it: { errSchemaPath: g } }, { schemaPath: E, parentSchema: N }) {
    let O = N ? g : (0, t.str)`${g}/${v}`;
    return E && (O = (0, t.str)`${O}${(0, r.getErrorPath)(E, r.Type.Str)}`), [u.schemaPath, O];
  }
  function $(v, { params: g, message: E }, N) {
    const { keyword: O, data: U, schemaValue: q, it: B } = v, { opts: me, propertyName: I, topSchemaRef: ye, schemaPath: W } = B;
    N.push([u.keyword, O], [u.params, typeof g == "function" ? g(v) : g || (0, t._)`{}`]), me.messages && N.push([u.message, typeof E == "function" ? E(v) : E]), me.verbose && N.push([u.schema, q], [u.parentSchema, (0, t._)`${ye}${W}`], [n.default.data, U]), I && N.push([u.propertyName, I]);
  }
})(pi);
Object.defineProperty(ns, "__esModule", { value: !0 });
ns.boolOrEmptySchema = ns.topBoolOrEmptySchema = void 0;
const SS = pi, TS = ce, PS = ir, AS = {
  message: "boolean schema is false"
};
function RS(e) {
  const { gen: t, schema: r, validateName: n } = e;
  r === !1 ? Lm(e, !1) : typeof r == "object" && r.$async === !0 ? t.return(PS.default.data) : (t.assign((0, TS._)`${n}.errors`, null), t.return(!0));
}
ns.topBoolOrEmptySchema = RS;
function NS(e, t) {
  const { gen: r, schema: n } = e;
  n === !1 ? (r.var(t, !1), Lm(e)) : r.var(t, !0);
}
ns.boolOrEmptySchema = NS;
function Lm(e, t) {
  const { gen: r, data: n } = e, s = {
    gen: r,
    keyword: "false schema",
    data: n,
    schema: !1,
    schemaCode: !1,
    schemaValue: !1,
    params: {},
    it: e
  };
  (0, SS.reportError)(s, AS, void 0, t);
}
var Le = {}, Sn = {};
Object.defineProperty(Sn, "__esModule", { value: !0 });
Sn.getRules = Sn.isJSONType = void 0;
const CS = ["string", "number", "integer", "boolean", "null", "object", "array"], OS = new Set(CS);
function IS(e) {
  return typeof e == "string" && OS.has(e);
}
Sn.isJSONType = IS;
function DS() {
  const e = {
    number: { type: "number", rules: [] },
    string: { type: "string", rules: [] },
    array: { type: "array", rules: [] },
    object: { type: "object", rules: [] }
  };
  return {
    types: { ...e, integer: !0, boolean: !0, null: !0 },
    rules: [{ rules: [] }, e.number, e.string, e.array, e.object],
    post: { rules: [] },
    all: {},
    keywords: {}
  };
}
Sn.getRules = DS;
var $r = {};
Object.defineProperty($r, "__esModule", { value: !0 });
$r.shouldUseRule = $r.shouldUseGroup = $r.schemaHasRulesForType = void 0;
function kS({ schema: e, self: t }, r) {
  const n = t.RULES.types[r];
  return n && n !== !0 && jm(e, n);
}
$r.schemaHasRulesForType = kS;
function jm(e, t) {
  return t.rules.some((r) => Mm(e, r));
}
$r.shouldUseGroup = jm;
function Mm(e, t) {
  var r;
  return e[t.keyword] !== void 0 || ((r = t.definition.implements) === null || r === void 0 ? void 0 : r.some((n) => e[n] !== void 0));
}
$r.shouldUseRule = Mm;
Object.defineProperty(Le, "__esModule", { value: !0 });
Le.reportTypeError = Le.checkDataTypes = Le.checkDataType = Le.coerceAndCheckDataType = Le.getJSONTypes = Le.getSchemaTypes = Le.DataType = void 0;
const US = Sn, FS = $r, LS = pi, oe = ce, xm = G;
var Qn;
(function(e) {
  e[e.Correct = 0] = "Correct", e[e.Wrong = 1] = "Wrong";
})(Qn || (Le.DataType = Qn = {}));
function jS(e) {
  const t = qm(e.type);
  if (t.includes("null")) {
    if (e.nullable === !1)
      throw new Error("type: null contradicts nullable: false");
  } else {
    if (!t.length && e.nullable !== void 0)
      throw new Error('"nullable" cannot be used without "type"');
    e.nullable === !0 && t.push("null");
  }
  return t;
}
Le.getSchemaTypes = jS;
function qm(e) {
  const t = Array.isArray(e) ? e : e ? [e] : [];
  if (t.every(US.isJSONType))
    return t;
  throw new Error("type must be JSONType or JSONType[]: " + t.join(","));
}
Le.getJSONTypes = qm;
function MS(e, t) {
  const { gen: r, data: n, opts: s } = e, i = xS(t, s.coerceTypes), a = t.length > 0 && !(i.length === 0 && t.length === 1 && (0, FS.schemaHasRulesForType)(e, t[0]));
  if (a) {
    const o = au(t, n, s.strictNumbers, Qn.Wrong);
    r.if(o, () => {
      i.length ? qS(e, t, i) : ou(e);
    });
  }
  return a;
}
Le.coerceAndCheckDataType = MS;
const Vm = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
function xS(e, t) {
  return t ? e.filter((r) => Vm.has(r) || t === "array" && r === "array") : [];
}
function qS(e, t, r) {
  const { gen: n, data: s, opts: i } = e, a = n.let("dataType", (0, oe._)`typeof ${s}`), o = n.let("coerced", (0, oe._)`undefined`);
  i.coerceTypes === "array" && n.if((0, oe._)`${a} == 'object' && Array.isArray(${s}) && ${s}.length == 1`, () => n.assign(s, (0, oe._)`${s}[0]`).assign(a, (0, oe._)`typeof ${s}`).if(au(t, s, i.strictNumbers), () => n.assign(o, s))), n.if((0, oe._)`${o} !== undefined`);
  for (const c of r)
    (Vm.has(c) || c === "array" && i.coerceTypes === "array") && l(c);
  n.else(), ou(e), n.endIf(), n.if((0, oe._)`${o} !== undefined`, () => {
    n.assign(s, o), VS(e, o);
  });
  function l(c) {
    switch (c) {
      case "string":
        n.elseIf((0, oe._)`${a} == "number" || ${a} == "boolean"`).assign(o, (0, oe._)`"" + ${s}`).elseIf((0, oe._)`${s} === null`).assign(o, (0, oe._)`""`);
        return;
      case "number":
        n.elseIf((0, oe._)`${a} == "boolean" || ${s} === null
              || (${a} == "string" && ${s} && ${s} == +${s})`).assign(o, (0, oe._)`+${s}`);
        return;
      case "integer":
        n.elseIf((0, oe._)`${a} === "boolean" || ${s} === null
              || (${a} === "string" && ${s} && ${s} == +${s} && !(${s} % 1))`).assign(o, (0, oe._)`+${s}`);
        return;
      case "boolean":
        n.elseIf((0, oe._)`${s} === "false" || ${s} === 0 || ${s} === null`).assign(o, !1).elseIf((0, oe._)`${s} === "true" || ${s} === 1`).assign(o, !0);
        return;
      case "null":
        n.elseIf((0, oe._)`${s} === "" || ${s} === 0 || ${s} === false`), n.assign(o, null);
        return;
      case "array":
        n.elseIf((0, oe._)`${a} === "string" || ${a} === "number"
              || ${a} === "boolean" || ${s} === null`).assign(o, (0, oe._)`[${s}]`);
    }
  }
}
function VS({ gen: e, parentData: t, parentDataProperty: r }, n) {
  e.if((0, oe._)`${t} !== undefined`, () => e.assign((0, oe._)`${t}[${r}]`, n));
}
function Dl(e, t, r, n = Qn.Correct) {
  const s = n === Qn.Correct ? oe.operators.EQ : oe.operators.NEQ;
  let i;
  switch (e) {
    case "null":
      return (0, oe._)`${t} ${s} null`;
    case "array":
      i = (0, oe._)`Array.isArray(${t})`;
      break;
    case "object":
      i = (0, oe._)`${t} && typeof ${t} == "object" && !Array.isArray(${t})`;
      break;
    case "integer":
      i = a((0, oe._)`!(${t} % 1) && !isNaN(${t})`);
      break;
    case "number":
      i = a();
      break;
    default:
      return (0, oe._)`typeof ${t} ${s} ${e}`;
  }
  return n === Qn.Correct ? i : (0, oe.not)(i);
  function a(o = oe.nil) {
    return (0, oe.and)((0, oe._)`typeof ${t} == "number"`, o, r ? (0, oe._)`isFinite(${t})` : oe.nil);
  }
}
Le.checkDataType = Dl;
function au(e, t, r, n) {
  if (e.length === 1)
    return Dl(e[0], t, r, n);
  let s;
  const i = (0, xm.toHash)(e);
  if (i.array && i.object) {
    const a = (0, oe._)`typeof ${t} != "object"`;
    s = i.null ? a : (0, oe._)`!${t} || ${a}`, delete i.null, delete i.array, delete i.object;
  } else
    s = oe.nil;
  i.number && delete i.integer;
  for (const a in i)
    s = (0, oe.and)(s, Dl(a, t, r, n));
  return s;
}
Le.checkDataTypes = au;
const BS = {
  message: ({ schema: e }) => `must be ${e}`,
  params: ({ schema: e, schemaValue: t }) => typeof e == "string" ? (0, oe._)`{type: ${e}}` : (0, oe._)`{type: ${t}}`
};
function ou(e) {
  const t = HS(e);
  (0, LS.reportError)(t, BS);
}
Le.reportTypeError = ou;
function HS(e) {
  const { gen: t, data: r, schema: n } = e, s = (0, xm.schemaRefOrVal)(e, n, "type");
  return {
    gen: t,
    keyword: "type",
    data: r,
    schema: n.type,
    schemaCode: s,
    schemaValue: s,
    parentSchema: n,
    params: {},
    it: e
  };
}
var Qa = {};
Object.defineProperty(Qa, "__esModule", { value: !0 });
Qa.assignDefaults = void 0;
const In = ce, zS = G;
function GS(e, t) {
  const { properties: r, items: n } = e.schema;
  if (t === "object" && r)
    for (const s in r)
      wf(e, s, r[s].default);
  else t === "array" && Array.isArray(n) && n.forEach((s, i) => wf(e, i, s.default));
}
Qa.assignDefaults = GS;
function wf(e, t, r) {
  const { gen: n, compositeRule: s, data: i, opts: a } = e;
  if (r === void 0)
    return;
  const o = (0, In._)`${i}${(0, In.getProperty)(t)}`;
  if (s) {
    (0, zS.checkStrictMode)(e, `default is ignored for: ${o}`);
    return;
  }
  let l = (0, In._)`${o} === undefined`;
  a.useDefaults === "empty" && (l = (0, In._)`${l} || ${o} === null || ${o} === ""`), n.if(l, (0, In._)`${o} = ${(0, In.stringify)(r)}`);
}
var rr = {}, de = {};
Object.defineProperty(de, "__esModule", { value: !0 });
de.validateUnion = de.validateArray = de.usePattern = de.callValidateCode = de.schemaProperties = de.allSchemaProperties = de.noPropertyInData = de.propertyInData = de.isOwnProperty = de.hasPropFunc = de.reportMissingProp = de.checkMissingProp = de.checkReportMissingProp = void 0;
const Te = ce, lu = G, kr = ir, KS = G;
function WS(e, t) {
  const { gen: r, data: n, it: s } = e;
  r.if(uu(r, n, t, s.opts.ownProperties), () => {
    e.setParams({ missingProperty: (0, Te._)`${t}` }, !0), e.error();
  });
}
de.checkReportMissingProp = WS;
function YS({ gen: e, data: t, it: { opts: r } }, n, s) {
  return (0, Te.or)(...n.map((i) => (0, Te.and)(uu(e, t, i, r.ownProperties), (0, Te._)`${s} = ${i}`)));
}
de.checkMissingProp = YS;
function XS(e, t) {
  e.setParams({ missingProperty: t }, !0), e.error();
}
de.reportMissingProp = XS;
function Bm(e) {
  return e.scopeValue("func", {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    ref: Object.prototype.hasOwnProperty,
    code: (0, Te._)`Object.prototype.hasOwnProperty`
  });
}
de.hasPropFunc = Bm;
function cu(e, t, r) {
  return (0, Te._)`${Bm(e)}.call(${t}, ${r})`;
}
de.isOwnProperty = cu;
function JS(e, t, r, n) {
  const s = (0, Te._)`${t}${(0, Te.getProperty)(r)} !== undefined`;
  return n ? (0, Te._)`${s} && ${cu(e, t, r)}` : s;
}
de.propertyInData = JS;
function uu(e, t, r, n) {
  const s = (0, Te._)`${t}${(0, Te.getProperty)(r)} === undefined`;
  return n ? (0, Te.or)(s, (0, Te.not)(cu(e, t, r))) : s;
}
de.noPropertyInData = uu;
function Hm(e) {
  return e ? Object.keys(e).filter((t) => t !== "__proto__") : [];
}
de.allSchemaProperties = Hm;
function QS(e, t) {
  return Hm(t).filter((r) => !(0, lu.alwaysValidSchema)(e, t[r]));
}
de.schemaProperties = QS;
function ZS({ schemaCode: e, data: t, it: { gen: r, topSchemaRef: n, schemaPath: s, errorPath: i }, it: a }, o, l, c) {
  const u = c ? (0, Te._)`${e}, ${t}, ${n}${s}` : t, d = [
    [kr.default.instancePath, (0, Te.strConcat)(kr.default.instancePath, i)],
    [kr.default.parentData, a.parentData],
    [kr.default.parentDataProperty, a.parentDataProperty],
    [kr.default.rootData, kr.default.rootData]
  ];
  a.opts.dynamicRef && d.push([kr.default.dynamicAnchors, kr.default.dynamicAnchors]);
  const p = (0, Te._)`${u}, ${r.object(...d)}`;
  return l !== Te.nil ? (0, Te._)`${o}.call(${l}, ${p})` : (0, Te._)`${o}(${p})`;
}
de.callValidateCode = ZS;
const eT = (0, Te._)`new RegExp`;
function tT({ gen: e, it: { opts: t } }, r) {
  const n = t.unicodeRegExp ? "u" : "", { regExp: s } = t.code, i = s(r, n);
  return e.scopeValue("pattern", {
    key: i.toString(),
    ref: i,
    code: (0, Te._)`${s.code === "new RegExp" ? eT : (0, KS.useFunc)(e, s)}(${r}, ${n})`
  });
}
de.usePattern = tT;
function rT(e) {
  const { gen: t, data: r, keyword: n, it: s } = e, i = t.name("valid");
  if (s.allErrors) {
    const o = t.let("valid", !0);
    return a(() => t.assign(o, !1)), o;
  }
  return t.var(i, !0), a(() => t.break()), i;
  function a(o) {
    const l = t.const("len", (0, Te._)`${r}.length`);
    t.forRange("i", 0, l, (c) => {
      e.subschema({
        keyword: n,
        dataProp: c,
        dataPropType: lu.Type.Num
      }, i), t.if((0, Te.not)(i), o);
    });
  }
}
de.validateArray = rT;
function nT(e) {
  const { gen: t, schema: r, keyword: n, it: s } = e;
  if (!Array.isArray(r))
    throw new Error("ajv implementation error");
  if (r.some((l) => (0, lu.alwaysValidSchema)(s, l)) && !s.opts.unevaluated)
    return;
  const a = t.let("valid", !1), o = t.name("_valid");
  t.block(() => r.forEach((l, c) => {
    const u = e.subschema({
      keyword: n,
      schemaProp: c,
      compositeRule: !0
    }, o);
    t.assign(a, (0, Te._)`${a} || ${o}`), e.mergeValidEvaluated(u, o) || t.if((0, Te.not)(a));
  })), e.result(a, () => e.reset(), () => e.error(!0));
}
de.validateUnion = nT;
Object.defineProperty(rr, "__esModule", { value: !0 });
rr.validateKeywordUsage = rr.validSchemaType = rr.funcKeywordCode = rr.macroKeywordCode = void 0;
const ct = ce, pn = ir, sT = de, iT = pi;
function aT(e, t) {
  const { gen: r, keyword: n, schema: s, parentSchema: i, it: a } = e, o = t.macro.call(a.self, s, i, a), l = zm(r, n, o);
  a.opts.validateSchema !== !1 && a.self.validateSchema(o, !0);
  const c = r.name("valid");
  e.subschema({
    schema: o,
    schemaPath: ct.nil,
    errSchemaPath: `${a.errSchemaPath}/${n}`,
    topSchemaRef: l,
    compositeRule: !0
  }, c), e.pass(c, () => e.error(!0));
}
rr.macroKeywordCode = aT;
function oT(e, t) {
  var r;
  const { gen: n, keyword: s, schema: i, parentSchema: a, $data: o, it: l } = e;
  cT(l, t);
  const c = !o && t.compile ? t.compile.call(l.self, i, a, l) : t.validate, u = zm(n, s, c), d = n.let("valid");
  e.block$data(d, p), e.ok((r = t.valid) !== null && r !== void 0 ? r : d);
  function p() {
    if (t.errors === !1)
      $(), t.modifying && Ef(e), v(() => e.error());
    else {
      const g = t.async ? m() : _();
      t.modifying && Ef(e), v(() => lT(e, g));
    }
  }
  function m() {
    const g = n.let("ruleErrs", null);
    return n.try(() => $((0, ct._)`await `), (E) => n.assign(d, !1).if((0, ct._)`${E} instanceof ${l.ValidationError}`, () => n.assign(g, (0, ct._)`${E}.errors`), () => n.throw(E))), g;
  }
  function _() {
    const g = (0, ct._)`${u}.errors`;
    return n.assign(g, null), $(ct.nil), g;
  }
  function $(g = t.async ? (0, ct._)`await ` : ct.nil) {
    const E = l.opts.passContext ? pn.default.this : pn.default.self, N = !("compile" in t && !o || t.schema === !1);
    n.assign(d, (0, ct._)`${g}${(0, sT.callValidateCode)(e, u, E, N)}`, t.modifying);
  }
  function v(g) {
    var E;
    n.if((0, ct.not)((E = t.valid) !== null && E !== void 0 ? E : d), g);
  }
}
rr.funcKeywordCode = oT;
function Ef(e) {
  const { gen: t, data: r, it: n } = e;
  t.if(n.parentData, () => t.assign(r, (0, ct._)`${n.parentData}[${n.parentDataProperty}]`));
}
function lT(e, t) {
  const { gen: r } = e;
  r.if((0, ct._)`Array.isArray(${t})`, () => {
    r.assign(pn.default.vErrors, (0, ct._)`${pn.default.vErrors} === null ? ${t} : ${pn.default.vErrors}.concat(${t})`).assign(pn.default.errors, (0, ct._)`${pn.default.vErrors}.length`), (0, iT.extendErrors)(e);
  }, () => e.error());
}
function cT({ schemaEnv: e }, t) {
  if (t.async && !e.$async)
    throw new Error("async keyword in sync schema");
}
function zm(e, t, r) {
  if (r === void 0)
    throw new Error(`keyword "${t}" failed to compile`);
  return e.scopeValue("keyword", typeof r == "function" ? { ref: r } : { ref: r, code: (0, ct.stringify)(r) });
}
function uT(e, t, r = !1) {
  return !t.length || t.some((n) => n === "array" ? Array.isArray(e) : n === "object" ? e && typeof e == "object" && !Array.isArray(e) : typeof e == n || r && typeof e > "u");
}
rr.validSchemaType = uT;
function dT({ schema: e, opts: t, self: r, errSchemaPath: n }, s, i) {
  if (Array.isArray(s.keyword) ? !s.keyword.includes(i) : s.keyword !== i)
    throw new Error("ajv implementation error");
  const a = s.dependencies;
  if (a != null && a.some((o) => !Object.prototype.hasOwnProperty.call(e, o)))
    throw new Error(`parent schema must have dependencies of ${i}: ${a.join(",")}`);
  if (s.validateSchema && !s.validateSchema(e[i])) {
    const l = `keyword "${i}" value is invalid at path "${n}": ` + r.errorsText(s.validateSchema.errors);
    if (t.validateSchema === "log")
      r.logger.error(l);
    else
      throw new Error(l);
  }
}
rr.validateKeywordUsage = dT;
var Hr = {};
Object.defineProperty(Hr, "__esModule", { value: !0 });
Hr.extendSubschemaMode = Hr.extendSubschemaData = Hr.getSubschema = void 0;
const Zt = ce, Gm = G;
function fT(e, { keyword: t, schemaProp: r, schema: n, schemaPath: s, errSchemaPath: i, topSchemaRef: a }) {
  if (t !== void 0 && n !== void 0)
    throw new Error('both "keyword" and "schema" passed, only one allowed');
  if (t !== void 0) {
    const o = e.schema[t];
    return r === void 0 ? {
      schema: o,
      schemaPath: (0, Zt._)`${e.schemaPath}${(0, Zt.getProperty)(t)}`,
      errSchemaPath: `${e.errSchemaPath}/${t}`
    } : {
      schema: o[r],
      schemaPath: (0, Zt._)`${e.schemaPath}${(0, Zt.getProperty)(t)}${(0, Zt.getProperty)(r)}`,
      errSchemaPath: `${e.errSchemaPath}/${t}/${(0, Gm.escapeFragment)(r)}`
    };
  }
  if (n !== void 0) {
    if (s === void 0 || i === void 0 || a === void 0)
      throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
    return {
      schema: n,
      schemaPath: s,
      topSchemaRef: a,
      errSchemaPath: i
    };
  }
  throw new Error('either "keyword" or "schema" must be passed');
}
Hr.getSubschema = fT;
function hT(e, t, { dataProp: r, dataPropType: n, data: s, dataTypes: i, propertyName: a }) {
  if (s !== void 0 && r !== void 0)
    throw new Error('both "data" and "dataProp" passed, only one allowed');
  const { gen: o } = t;
  if (r !== void 0) {
    const { errorPath: c, dataPathArr: u, opts: d } = t, p = o.let("data", (0, Zt._)`${t.data}${(0, Zt.getProperty)(r)}`, !0);
    l(p), e.errorPath = (0, Zt.str)`${c}${(0, Gm.getErrorPath)(r, n, d.jsPropertySyntax)}`, e.parentDataProperty = (0, Zt._)`${r}`, e.dataPathArr = [...u, e.parentDataProperty];
  }
  if (s !== void 0) {
    const c = s instanceof Zt.Name ? s : o.let("data", s, !0);
    l(c), a !== void 0 && (e.propertyName = a);
  }
  i && (e.dataTypes = i);
  function l(c) {
    e.data = c, e.dataLevel = t.dataLevel + 1, e.dataTypes = [], t.definedProperties = /* @__PURE__ */ new Set(), e.parentData = t.data, e.dataNames = [...t.dataNames, c];
  }
}
Hr.extendSubschemaData = hT;
function pT(e, { jtdDiscriminator: t, jtdMetadata: r, compositeRule: n, createErrors: s, allErrors: i }) {
  n !== void 0 && (e.compositeRule = n), s !== void 0 && (e.createErrors = s), i !== void 0 && (e.allErrors = i), e.jtdDiscriminator = t, e.jtdMetadata = r;
}
Hr.extendSubschemaMode = pT;
var We = {}, Km = { exports: {} }, Vr = Km.exports = function(e, t, r) {
  typeof t == "function" && (r = t, t = {}), r = t.cb || r;
  var n = typeof r == "function" ? r : r.pre || function() {
  }, s = r.post || function() {
  };
  fa(t, n, s, e, "", e);
};
Vr.keywords = {
  additionalItems: !0,
  items: !0,
  contains: !0,
  additionalProperties: !0,
  propertyNames: !0,
  not: !0,
  if: !0,
  then: !0,
  else: !0
};
Vr.arrayKeywords = {
  items: !0,
  allOf: !0,
  anyOf: !0,
  oneOf: !0
};
Vr.propsKeywords = {
  $defs: !0,
  definitions: !0,
  properties: !0,
  patternProperties: !0,
  dependencies: !0
};
Vr.skipKeywords = {
  default: !0,
  enum: !0,
  const: !0,
  required: !0,
  maximum: !0,
  minimum: !0,
  exclusiveMaximum: !0,
  exclusiveMinimum: !0,
  multipleOf: !0,
  maxLength: !0,
  minLength: !0,
  pattern: !0,
  format: !0,
  maxItems: !0,
  minItems: !0,
  uniqueItems: !0,
  maxProperties: !0,
  minProperties: !0
};
function fa(e, t, r, n, s, i, a, o, l, c) {
  if (n && typeof n == "object" && !Array.isArray(n)) {
    t(n, s, i, a, o, l, c);
    for (var u in n) {
      var d = n[u];
      if (Array.isArray(d)) {
        if (u in Vr.arrayKeywords)
          for (var p = 0; p < d.length; p++)
            fa(e, t, r, d[p], s + "/" + u + "/" + p, i, s, u, n, p);
      } else if (u in Vr.propsKeywords) {
        if (d && typeof d == "object")
          for (var m in d)
            fa(e, t, r, d[m], s + "/" + u + "/" + mT(m), i, s, u, n, m);
      } else (u in Vr.keywords || e.allKeys && !(u in Vr.skipKeywords)) && fa(e, t, r, d, s + "/" + u, i, s, u, n);
    }
    r(n, s, i, a, o, l, c);
  }
}
function mT(e) {
  return e.replace(/~/g, "~0").replace(/\//g, "~1");
}
var gT = Km.exports;
Object.defineProperty(We, "__esModule", { value: !0 });
We.getSchemaRefs = We.resolveUrl = We.normalizeId = We._getFullPath = We.getFullPath = We.inlineRef = void 0;
const yT = G, $T = za, _T = gT, vT = /* @__PURE__ */ new Set([
  "type",
  "format",
  "pattern",
  "maxLength",
  "minLength",
  "maxProperties",
  "minProperties",
  "maxItems",
  "minItems",
  "maximum",
  "minimum",
  "uniqueItems",
  "multipleOf",
  "required",
  "enum",
  "const"
]);
function wT(e, t = !0) {
  return typeof e == "boolean" ? !0 : t === !0 ? !kl(e) : t ? Wm(e) <= t : !1;
}
We.inlineRef = wT;
const ET = /* @__PURE__ */ new Set([
  "$ref",
  "$recursiveRef",
  "$recursiveAnchor",
  "$dynamicRef",
  "$dynamicAnchor"
]);
function kl(e) {
  for (const t in e) {
    if (ET.has(t))
      return !0;
    const r = e[t];
    if (Array.isArray(r) && r.some(kl) || typeof r == "object" && kl(r))
      return !0;
  }
  return !1;
}
function Wm(e) {
  let t = 0;
  for (const r in e) {
    if (r === "$ref")
      return 1 / 0;
    if (t++, !vT.has(r) && (typeof e[r] == "object" && (0, yT.eachItem)(e[r], (n) => t += Wm(n)), t === 1 / 0))
      return 1 / 0;
  }
  return t;
}
function Ym(e, t = "", r) {
  r !== !1 && (t = Zn(t));
  const n = e.parse(t);
  return Xm(e, n);
}
We.getFullPath = Ym;
function Xm(e, t) {
  return e.serialize(t).split("#")[0] + "#";
}
We._getFullPath = Xm;
const bT = /#\/?$/;
function Zn(e) {
  return e ? e.replace(bT, "") : "";
}
We.normalizeId = Zn;
function ST(e, t, r) {
  return r = Zn(r), e.resolve(t, r);
}
We.resolveUrl = ST;
const TT = /^[a-z_][-a-z0-9._]*$/i;
function PT(e, t) {
  if (typeof e == "boolean")
    return {};
  const { schemaId: r, uriResolver: n } = this.opts, s = Zn(e[r] || t), i = { "": s }, a = Ym(n, s, !1), o = {}, l = /* @__PURE__ */ new Set();
  return _T(e, { allKeys: !0 }, (d, p, m, _) => {
    if (_ === void 0)
      return;
    const $ = a + p;
    let v = i[_];
    typeof d[r] == "string" && (v = g.call(this, d[r])), E.call(this, d.$anchor), E.call(this, d.$dynamicAnchor), i[p] = v;
    function g(N) {
      const O = this.opts.uriResolver.resolve;
      if (N = Zn(v ? O(v, N) : N), l.has(N))
        throw u(N);
      l.add(N);
      let U = this.refs[N];
      return typeof U == "string" && (U = this.refs[U]), typeof U == "object" ? c(d, U.schema, N) : N !== Zn($) && (N[0] === "#" ? (c(d, o[N], N), o[N] = d) : this.refs[N] = $), N;
    }
    function E(N) {
      if (typeof N == "string") {
        if (!TT.test(N))
          throw new Error(`invalid anchor "${N}"`);
        g.call(this, `#${N}`);
      }
    }
  }), o;
  function c(d, p, m) {
    if (p !== void 0 && !$T(d, p))
      throw u(m);
  }
  function u(d) {
    return new Error(`reference "${d}" resolves to more than one schema`);
  }
}
We.getSchemaRefs = PT;
Object.defineProperty(zt, "__esModule", { value: !0 });
zt.getData = zt.KeywordCxt = zt.validateFunctionCode = void 0;
const Jm = ns, bf = Le, du = $r, Ta = Le, AT = Qa, zs = rr, Lo = Hr, Q = ce, re = ir, RT = We, _r = G, Rs = pi;
function NT(e) {
  if (eg(e) && (tg(e), Zm(e))) {
    IT(e);
    return;
  }
  Qm(e, () => (0, Jm.topBoolOrEmptySchema)(e));
}
zt.validateFunctionCode = NT;
function Qm({ gen: e, validateName: t, schema: r, schemaEnv: n, opts: s }, i) {
  s.code.es5 ? e.func(t, (0, Q._)`${re.default.data}, ${re.default.valCxt}`, n.$async, () => {
    e.code((0, Q._)`"use strict"; ${Sf(r, s)}`), OT(e, s), e.code(i);
  }) : e.func(t, (0, Q._)`${re.default.data}, ${CT(s)}`, n.$async, () => e.code(Sf(r, s)).code(i));
}
function CT(e) {
  return (0, Q._)`{${re.default.instancePath}="", ${re.default.parentData}, ${re.default.parentDataProperty}, ${re.default.rootData}=${re.default.data}${e.dynamicRef ? (0, Q._)`, ${re.default.dynamicAnchors}={}` : Q.nil}}={}`;
}
function OT(e, t) {
  e.if(re.default.valCxt, () => {
    e.var(re.default.instancePath, (0, Q._)`${re.default.valCxt}.${re.default.instancePath}`), e.var(re.default.parentData, (0, Q._)`${re.default.valCxt}.${re.default.parentData}`), e.var(re.default.parentDataProperty, (0, Q._)`${re.default.valCxt}.${re.default.parentDataProperty}`), e.var(re.default.rootData, (0, Q._)`${re.default.valCxt}.${re.default.rootData}`), t.dynamicRef && e.var(re.default.dynamicAnchors, (0, Q._)`${re.default.valCxt}.${re.default.dynamicAnchors}`);
  }, () => {
    e.var(re.default.instancePath, (0, Q._)`""`), e.var(re.default.parentData, (0, Q._)`undefined`), e.var(re.default.parentDataProperty, (0, Q._)`undefined`), e.var(re.default.rootData, re.default.data), t.dynamicRef && e.var(re.default.dynamicAnchors, (0, Q._)`{}`);
  });
}
function IT(e) {
  const { schema: t, opts: r, gen: n } = e;
  Qm(e, () => {
    r.$comment && t.$comment && ng(e), LT(e), n.let(re.default.vErrors, null), n.let(re.default.errors, 0), r.unevaluated && DT(e), rg(e), xT(e);
  });
}
function DT(e) {
  const { gen: t, validateName: r } = e;
  e.evaluated = t.const("evaluated", (0, Q._)`${r}.evaluated`), t.if((0, Q._)`${e.evaluated}.dynamicProps`, () => t.assign((0, Q._)`${e.evaluated}.props`, (0, Q._)`undefined`)), t.if((0, Q._)`${e.evaluated}.dynamicItems`, () => t.assign((0, Q._)`${e.evaluated}.items`, (0, Q._)`undefined`));
}
function Sf(e, t) {
  const r = typeof e == "object" && e[t.schemaId];
  return r && (t.code.source || t.code.process) ? (0, Q._)`/*# sourceURL=${r} */` : Q.nil;
}
function kT(e, t) {
  if (eg(e) && (tg(e), Zm(e))) {
    UT(e, t);
    return;
  }
  (0, Jm.boolOrEmptySchema)(e, t);
}
function Zm({ schema: e, self: t }) {
  if (typeof e == "boolean")
    return !e;
  for (const r in e)
    if (t.RULES.all[r])
      return !0;
  return !1;
}
function eg(e) {
  return typeof e.schema != "boolean";
}
function UT(e, t) {
  const { schema: r, gen: n, opts: s } = e;
  s.$comment && r.$comment && ng(e), jT(e), MT(e);
  const i = n.const("_errs", re.default.errors);
  rg(e, i), n.var(t, (0, Q._)`${i} === ${re.default.errors}`);
}
function tg(e) {
  (0, _r.checkUnknownRules)(e), FT(e);
}
function rg(e, t) {
  if (e.opts.jtd)
    return Tf(e, [], !1, t);
  const r = (0, bf.getSchemaTypes)(e.schema), n = (0, bf.coerceAndCheckDataType)(e, r);
  Tf(e, r, !n, t);
}
function FT(e) {
  const { schema: t, errSchemaPath: r, opts: n, self: s } = e;
  t.$ref && n.ignoreKeywordsWithRef && (0, _r.schemaHasRulesButRef)(t, s.RULES) && s.logger.warn(`$ref: keywords ignored in schema at path "${r}"`);
}
function LT(e) {
  const { schema: t, opts: r } = e;
  t.default !== void 0 && r.useDefaults && r.strictSchema && (0, _r.checkStrictMode)(e, "default is ignored in the schema root");
}
function jT(e) {
  const t = e.schema[e.opts.schemaId];
  t && (e.baseId = (0, RT.resolveUrl)(e.opts.uriResolver, e.baseId, t));
}
function MT(e) {
  if (e.schema.$async && !e.schemaEnv.$async)
    throw new Error("async schema in sync schema");
}
function ng({ gen: e, schemaEnv: t, schema: r, errSchemaPath: n, opts: s }) {
  const i = r.$comment;
  if (s.$comment === !0)
    e.code((0, Q._)`${re.default.self}.logger.log(${i})`);
  else if (typeof s.$comment == "function") {
    const a = (0, Q.str)`${n}/$comment`, o = e.scopeValue("root", { ref: t.root });
    e.code((0, Q._)`${re.default.self}.opts.$comment(${i}, ${a}, ${o}.schema)`);
  }
}
function xT(e) {
  const { gen: t, schemaEnv: r, validateName: n, ValidationError: s, opts: i } = e;
  r.$async ? t.if((0, Q._)`${re.default.errors} === 0`, () => t.return(re.default.data), () => t.throw((0, Q._)`new ${s}(${re.default.vErrors})`)) : (t.assign((0, Q._)`${n}.errors`, re.default.vErrors), i.unevaluated && qT(e), t.return((0, Q._)`${re.default.errors} === 0`));
}
function qT({ gen: e, evaluated: t, props: r, items: n }) {
  r instanceof Q.Name && e.assign((0, Q._)`${t}.props`, r), n instanceof Q.Name && e.assign((0, Q._)`${t}.items`, n);
}
function Tf(e, t, r, n) {
  const { gen: s, schema: i, data: a, allErrors: o, opts: l, self: c } = e, { RULES: u } = c;
  if (i.$ref && (l.ignoreKeywordsWithRef || !(0, _r.schemaHasRulesButRef)(i, u))) {
    s.block(() => ag(e, "$ref", u.all.$ref.definition));
    return;
  }
  l.jtd || VT(e, t), s.block(() => {
    for (const p of u.rules)
      d(p);
    d(u.post);
  });
  function d(p) {
    (0, du.shouldUseGroup)(i, p) && (p.type ? (s.if((0, Ta.checkDataType)(p.type, a, l.strictNumbers)), Pf(e, p), t.length === 1 && t[0] === p.type && r && (s.else(), (0, Ta.reportTypeError)(e)), s.endIf()) : Pf(e, p), o || s.if((0, Q._)`${re.default.errors} === ${n || 0}`));
  }
}
function Pf(e, t) {
  const { gen: r, schema: n, opts: { useDefaults: s } } = e;
  s && (0, AT.assignDefaults)(e, t.type), r.block(() => {
    for (const i of t.rules)
      (0, du.shouldUseRule)(n, i) && ag(e, i.keyword, i.definition, t.type);
  });
}
function VT(e, t) {
  e.schemaEnv.meta || !e.opts.strictTypes || (BT(e, t), e.opts.allowUnionTypes || HT(e, t), zT(e, e.dataTypes));
}
function BT(e, t) {
  if (t.length) {
    if (!e.dataTypes.length) {
      e.dataTypes = t;
      return;
    }
    t.forEach((r) => {
      sg(e.dataTypes, r) || fu(e, `type "${r}" not allowed by context "${e.dataTypes.join(",")}"`);
    }), KT(e, t);
  }
}
function HT(e, t) {
  t.length > 1 && !(t.length === 2 && t.includes("null")) && fu(e, "use allowUnionTypes to allow union type keyword");
}
function zT(e, t) {
  const r = e.self.RULES.all;
  for (const n in r) {
    const s = r[n];
    if (typeof s == "object" && (0, du.shouldUseRule)(e.schema, s)) {
      const { type: i } = s.definition;
      i.length && !i.some((a) => GT(t, a)) && fu(e, `missing type "${i.join(",")}" for keyword "${n}"`);
    }
  }
}
function GT(e, t) {
  return e.includes(t) || t === "number" && e.includes("integer");
}
function sg(e, t) {
  return e.includes(t) || t === "integer" && e.includes("number");
}
function KT(e, t) {
  const r = [];
  for (const n of e.dataTypes)
    sg(t, n) ? r.push(n) : t.includes("integer") && n === "number" && r.push("integer");
  e.dataTypes = r;
}
function fu(e, t) {
  const r = e.schemaEnv.baseId + e.errSchemaPath;
  t += ` at "${r}" (strictTypes)`, (0, _r.checkStrictMode)(e, t, e.opts.strictTypes);
}
class ig {
  constructor(t, r, n) {
    if ((0, zs.validateKeywordUsage)(t, r, n), this.gen = t.gen, this.allErrors = t.allErrors, this.keyword = n, this.data = t.data, this.schema = t.schema[n], this.$data = r.$data && t.opts.$data && this.schema && this.schema.$data, this.schemaValue = (0, _r.schemaRefOrVal)(t, this.schema, n, this.$data), this.schemaType = r.schemaType, this.parentSchema = t.schema, this.params = {}, this.it = t, this.def = r, this.$data)
      this.schemaCode = t.gen.const("vSchema", og(this.$data, t));
    else if (this.schemaCode = this.schemaValue, !(0, zs.validSchemaType)(this.schema, r.schemaType, r.allowUndefined))
      throw new Error(`${n} value must be ${JSON.stringify(r.schemaType)}`);
    ("code" in r ? r.trackErrors : r.errors !== !1) && (this.errsCount = t.gen.const("_errs", re.default.errors));
  }
  result(t, r, n) {
    this.failResult((0, Q.not)(t), r, n);
  }
  failResult(t, r, n) {
    this.gen.if(t), n ? n() : this.error(), r ? (this.gen.else(), r(), this.allErrors && this.gen.endIf()) : this.allErrors ? this.gen.endIf() : this.gen.else();
  }
  pass(t, r) {
    this.failResult((0, Q.not)(t), void 0, r);
  }
  fail(t) {
    if (t === void 0) {
      this.error(), this.allErrors || this.gen.if(!1);
      return;
    }
    this.gen.if(t), this.error(), this.allErrors ? this.gen.endIf() : this.gen.else();
  }
  fail$data(t) {
    if (!this.$data)
      return this.fail(t);
    const { schemaCode: r } = this;
    this.fail((0, Q._)`${r} !== undefined && (${(0, Q.or)(this.invalid$data(), t)})`);
  }
  error(t, r, n) {
    if (r) {
      this.setParams(r), this._error(t, n), this.setParams({});
      return;
    }
    this._error(t, n);
  }
  _error(t, r) {
    (t ? Rs.reportExtraError : Rs.reportError)(this, this.def.error, r);
  }
  $dataError() {
    (0, Rs.reportError)(this, this.def.$dataError || Rs.keyword$DataError);
  }
  reset() {
    if (this.errsCount === void 0)
      throw new Error('add "trackErrors" to keyword definition');
    (0, Rs.resetErrorsCount)(this.gen, this.errsCount);
  }
  ok(t) {
    this.allErrors || this.gen.if(t);
  }
  setParams(t, r) {
    r ? Object.assign(this.params, t) : this.params = t;
  }
  block$data(t, r, n = Q.nil) {
    this.gen.block(() => {
      this.check$data(t, n), r();
    });
  }
  check$data(t = Q.nil, r = Q.nil) {
    if (!this.$data)
      return;
    const { gen: n, schemaCode: s, schemaType: i, def: a } = this;
    n.if((0, Q.or)((0, Q._)`${s} === undefined`, r)), t !== Q.nil && n.assign(t, !0), (i.length || a.validateSchema) && (n.elseIf(this.invalid$data()), this.$dataError(), t !== Q.nil && n.assign(t, !1)), n.else();
  }
  invalid$data() {
    const { gen: t, schemaCode: r, schemaType: n, def: s, it: i } = this;
    return (0, Q.or)(a(), o());
    function a() {
      if (n.length) {
        if (!(r instanceof Q.Name))
          throw new Error("ajv implementation error");
        const l = Array.isArray(n) ? n : [n];
        return (0, Q._)`${(0, Ta.checkDataTypes)(l, r, i.opts.strictNumbers, Ta.DataType.Wrong)}`;
      }
      return Q.nil;
    }
    function o() {
      if (s.validateSchema) {
        const l = t.scopeValue("validate$data", { ref: s.validateSchema });
        return (0, Q._)`!${l}(${r})`;
      }
      return Q.nil;
    }
  }
  subschema(t, r) {
    const n = (0, Lo.getSubschema)(this.it, t);
    (0, Lo.extendSubschemaData)(n, this.it, t), (0, Lo.extendSubschemaMode)(n, t);
    const s = { ...this.it, ...n, items: void 0, props: void 0 };
    return kT(s, r), s;
  }
  mergeEvaluated(t, r) {
    const { it: n, gen: s } = this;
    n.opts.unevaluated && (n.props !== !0 && t.props !== void 0 && (n.props = _r.mergeEvaluated.props(s, t.props, n.props, r)), n.items !== !0 && t.items !== void 0 && (n.items = _r.mergeEvaluated.items(s, t.items, n.items, r)));
  }
  mergeValidEvaluated(t, r) {
    const { it: n, gen: s } = this;
    if (n.opts.unevaluated && (n.props !== !0 || n.items !== !0))
      return s.if(r, () => this.mergeEvaluated(t, Q.Name)), !0;
  }
}
zt.KeywordCxt = ig;
function ag(e, t, r, n) {
  const s = new ig(e, r, t);
  "code" in r ? r.code(s, n) : s.$data && r.validate ? (0, zs.funcKeywordCode)(s, r) : "macro" in r ? (0, zs.macroKeywordCode)(s, r) : (r.compile || r.validate) && (0, zs.funcKeywordCode)(s, r);
}
const WT = /^\/(?:[^~]|~0|~1)*$/, YT = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
function og(e, { dataLevel: t, dataNames: r, dataPathArr: n }) {
  let s, i;
  if (e === "")
    return re.default.rootData;
  if (e[0] === "/") {
    if (!WT.test(e))
      throw new Error(`Invalid JSON-pointer: ${e}`);
    s = e, i = re.default.rootData;
  } else {
    const c = YT.exec(e);
    if (!c)
      throw new Error(`Invalid JSON-pointer: ${e}`);
    const u = +c[1];
    if (s = c[2], s === "#") {
      if (u >= t)
        throw new Error(l("property/index", u));
      return n[t - u];
    }
    if (u > t)
      throw new Error(l("data", u));
    if (i = r[t - u], !s)
      return i;
  }
  let a = i;
  const o = s.split("/");
  for (const c of o)
    c && (i = (0, Q._)`${i}${(0, Q.getProperty)((0, _r.unescapeJsonPointer)(c))}`, a = (0, Q._)`${a} && ${i}`);
  return a;
  function l(c, u) {
    return `Cannot access ${c} ${u} levels up, current level is ${t}`;
  }
}
zt.getData = og;
var mi = {};
Object.defineProperty(mi, "__esModule", { value: !0 });
class XT extends Error {
  constructor(t) {
    super("validation failed"), this.errors = t, this.ajv = this.validation = !0;
  }
}
mi.default = XT;
var fs = {};
Object.defineProperty(fs, "__esModule", { value: !0 });
const jo = We;
class JT extends Error {
  constructor(t, r, n, s) {
    super(s || `can't resolve reference ${n} from id ${r}`), this.missingRef = (0, jo.resolveUrl)(t, r, n), this.missingSchema = (0, jo.normalizeId)((0, jo.getFullPath)(t, this.missingRef));
  }
}
fs.default = JT;
var $t = {};
Object.defineProperty($t, "__esModule", { value: !0 });
$t.resolveSchema = $t.getCompilingSchema = $t.resolveRef = $t.compileSchema = $t.SchemaEnv = void 0;
const Lt = ce, QT = mi, an = ir, Bt = We, Af = G, ZT = zt;
class Za {
  constructor(t) {
    var r;
    this.refs = {}, this.dynamicAnchors = {};
    let n;
    typeof t.schema == "object" && (n = t.schema), this.schema = t.schema, this.schemaId = t.schemaId, this.root = t.root || this, this.baseId = (r = t.baseId) !== null && r !== void 0 ? r : (0, Bt.normalizeId)(n == null ? void 0 : n[t.schemaId || "$id"]), this.schemaPath = t.schemaPath, this.localRefs = t.localRefs, this.meta = t.meta, this.$async = n == null ? void 0 : n.$async, this.refs = {};
  }
}
$t.SchemaEnv = Za;
function hu(e) {
  const t = lg.call(this, e);
  if (t)
    return t;
  const r = (0, Bt.getFullPath)(this.opts.uriResolver, e.root.baseId), { es5: n, lines: s } = this.opts.code, { ownProperties: i } = this.opts, a = new Lt.CodeGen(this.scope, { es5: n, lines: s, ownProperties: i });
  let o;
  e.$async && (o = a.scopeValue("Error", {
    ref: QT.default,
    code: (0, Lt._)`require("ajv/dist/runtime/validation_error").default`
  }));
  const l = a.scopeName("validate");
  e.validateName = l;
  const c = {
    gen: a,
    allErrors: this.opts.allErrors,
    data: an.default.data,
    parentData: an.default.parentData,
    parentDataProperty: an.default.parentDataProperty,
    dataNames: [an.default.data],
    dataPathArr: [Lt.nil],
    // TODO can its length be used as dataLevel if nil is removed?
    dataLevel: 0,
    dataTypes: [],
    definedProperties: /* @__PURE__ */ new Set(),
    topSchemaRef: a.scopeValue("schema", this.opts.code.source === !0 ? { ref: e.schema, code: (0, Lt.stringify)(e.schema) } : { ref: e.schema }),
    validateName: l,
    ValidationError: o,
    schema: e.schema,
    schemaEnv: e,
    rootId: r,
    baseId: e.baseId || r,
    schemaPath: Lt.nil,
    errSchemaPath: e.schemaPath || (this.opts.jtd ? "" : "#"),
    errorPath: (0, Lt._)`""`,
    opts: this.opts,
    self: this
  };
  let u;
  try {
    this._compilations.add(e), (0, ZT.validateFunctionCode)(c), a.optimize(this.opts.code.optimize);
    const d = a.toString();
    u = `${a.scopeRefs(an.default.scope)}return ${d}`, this.opts.code.process && (u = this.opts.code.process(u, e));
    const m = new Function(`${an.default.self}`, `${an.default.scope}`, u)(this, this.scope.get());
    if (this.scope.value(l, { ref: m }), m.errors = null, m.schema = e.schema, m.schemaEnv = e, e.$async && (m.$async = !0), this.opts.code.source === !0 && (m.source = { validateName: l, validateCode: d, scopeValues: a._values }), this.opts.unevaluated) {
      const { props: _, items: $ } = c;
      m.evaluated = {
        props: _ instanceof Lt.Name ? void 0 : _,
        items: $ instanceof Lt.Name ? void 0 : $,
        dynamicProps: _ instanceof Lt.Name,
        dynamicItems: $ instanceof Lt.Name
      }, m.source && (m.source.evaluated = (0, Lt.stringify)(m.evaluated));
    }
    return e.validate = m, e;
  } catch (d) {
    throw delete e.validate, delete e.validateName, u && this.logger.error("Error compiling schema, function code:", u), d;
  } finally {
    this._compilations.delete(e);
  }
}
$t.compileSchema = hu;
function eP(e, t, r) {
  var n;
  r = (0, Bt.resolveUrl)(this.opts.uriResolver, t, r);
  const s = e.refs[r];
  if (s)
    return s;
  let i = nP.call(this, e, r);
  if (i === void 0) {
    const a = (n = e.localRefs) === null || n === void 0 ? void 0 : n[r], { schemaId: o } = this.opts;
    a && (i = new Za({ schema: a, schemaId: o, root: e, baseId: t }));
  }
  if (i !== void 0)
    return e.refs[r] = tP.call(this, i);
}
$t.resolveRef = eP;
function tP(e) {
  return (0, Bt.inlineRef)(e.schema, this.opts.inlineRefs) ? e.schema : e.validate ? e : hu.call(this, e);
}
function lg(e) {
  for (const t of this._compilations)
    if (rP(t, e))
      return t;
}
$t.getCompilingSchema = lg;
function rP(e, t) {
  return e.schema === t.schema && e.root === t.root && e.baseId === t.baseId;
}
function nP(e, t) {
  let r;
  for (; typeof (r = this.refs[t]) == "string"; )
    t = r;
  return r || this.schemas[t] || eo.call(this, e, t);
}
function eo(e, t) {
  const r = this.opts.uriResolver.parse(t), n = (0, Bt._getFullPath)(this.opts.uriResolver, r);
  let s = (0, Bt.getFullPath)(this.opts.uriResolver, e.baseId, void 0);
  if (Object.keys(e.schema).length > 0 && n === s)
    return Mo.call(this, r, e);
  const i = (0, Bt.normalizeId)(n), a = this.refs[i] || this.schemas[i];
  if (typeof a == "string") {
    const o = eo.call(this, e, a);
    return typeof (o == null ? void 0 : o.schema) != "object" ? void 0 : Mo.call(this, r, o);
  }
  if (typeof (a == null ? void 0 : a.schema) == "object") {
    if (a.validate || hu.call(this, a), i === (0, Bt.normalizeId)(t)) {
      const { schema: o } = a, { schemaId: l } = this.opts, c = o[l];
      return c && (s = (0, Bt.resolveUrl)(this.opts.uriResolver, s, c)), new Za({ schema: o, schemaId: l, root: e, baseId: s });
    }
    return Mo.call(this, r, a);
  }
}
$t.resolveSchema = eo;
const sP = /* @__PURE__ */ new Set([
  "properties",
  "patternProperties",
  "enum",
  "dependencies",
  "definitions"
]);
function Mo(e, { baseId: t, schema: r, root: n }) {
  var s;
  if (((s = e.fragment) === null || s === void 0 ? void 0 : s[0]) !== "/")
    return;
  for (const o of e.fragment.slice(1).split("/")) {
    if (typeof r == "boolean")
      return;
    const l = r[(0, Af.unescapeFragment)(o)];
    if (l === void 0)
      return;
    r = l;
    const c = typeof r == "object" && r[this.opts.schemaId];
    !sP.has(o) && c && (t = (0, Bt.resolveUrl)(this.opts.uriResolver, t, c));
  }
  let i;
  if (typeof r != "boolean" && r.$ref && !(0, Af.schemaHasRulesButRef)(r, this.RULES)) {
    const o = (0, Bt.resolveUrl)(this.opts.uriResolver, t, r.$ref);
    i = eo.call(this, n, o);
  }
  const { schemaId: a } = this.opts;
  if (i = i || new Za({ schema: r, schemaId: a, root: n, baseId: t }), i.schema !== i.root.schema)
    return i;
}
const iP = "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#", aP = "Meta-schema for $data reference (JSON AnySchema extension proposal)", oP = "object", lP = [
  "$data"
], cP = {
  $data: {
    type: "string",
    anyOf: [
      {
        format: "relative-json-pointer"
      },
      {
        format: "json-pointer"
      }
    ]
  }
}, uP = !1, dP = {
  $id: iP,
  description: aP,
  type: oP,
  required: lP,
  properties: cP,
  additionalProperties: uP
};
var pu = {};
Object.defineProperty(pu, "__esModule", { value: !0 });
const cg = $m;
cg.code = 'require("ajv/dist/runtime/uri").default';
pu.default = cg;
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.CodeGen = e.Name = e.nil = e.stringify = e.str = e._ = e.KeywordCxt = void 0;
  var t = zt;
  Object.defineProperty(e, "KeywordCxt", { enumerable: !0, get: function() {
    return t.KeywordCxt;
  } });
  var r = ce;
  Object.defineProperty(e, "_", { enumerable: !0, get: function() {
    return r._;
  } }), Object.defineProperty(e, "str", { enumerable: !0, get: function() {
    return r.str;
  } }), Object.defineProperty(e, "stringify", { enumerable: !0, get: function() {
    return r.stringify;
  } }), Object.defineProperty(e, "nil", { enumerable: !0, get: function() {
    return r.nil;
  } }), Object.defineProperty(e, "Name", { enumerable: !0, get: function() {
    return r.Name;
  } }), Object.defineProperty(e, "CodeGen", { enumerable: !0, get: function() {
    return r.CodeGen;
  } });
  const n = mi, s = fs, i = Sn, a = $t, o = ce, l = We, c = Le, u = G, d = dP, p = pu, m = (C, b) => new RegExp(C, b);
  m.code = "new RegExp";
  const _ = ["removeAdditional", "useDefaults", "coerceTypes"], $ = /* @__PURE__ */ new Set([
    "validate",
    "serialize",
    "parse",
    "wrapper",
    "root",
    "schema",
    "keyword",
    "pattern",
    "formats",
    "validate$data",
    "func",
    "obj",
    "Error"
  ]), v = {
    errorDataPath: "",
    format: "`validateFormats: false` can be used instead.",
    nullable: '"nullable" keyword is supported by default.',
    jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
    extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
    missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
    processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
    sourceCode: "Use option `code: {source: true}`",
    strictDefaults: "It is default now, see option `strict`.",
    strictKeywords: "It is default now, see option `strict`.",
    uniqueItems: '"uniqueItems" keyword is always validated.',
    unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
    cache: "Map is used as cache, schema object as key.",
    serialize: "Map is used as cache, schema object as key.",
    ajvErrors: "It is default now."
  }, g = {
    ignoreKeywordsWithRef: "",
    jsPropertySyntax: "",
    unicode: '"minLength"/"maxLength" account for unicode characters by default.'
  }, E = 200;
  function N(C) {
    var b, A, S, f, y, P, w, h, k, R, z, he, ge, we, Pe, Xe, $e, Ue, kt, Pt, vt, At, ar, or, lr;
    const wt = C.strict, Rt = (b = C.code) === null || b === void 0 ? void 0 : b.optimize, cr = Rt === !0 || Rt === void 0 ? 1 : Rt || 0, Tr = (S = (A = C.code) === null || A === void 0 ? void 0 : A.regExp) !== null && S !== void 0 ? S : m, mt = (f = C.uriResolver) !== null && f !== void 0 ? f : p.default;
    return {
      strictSchema: (P = (y = C.strictSchema) !== null && y !== void 0 ? y : wt) !== null && P !== void 0 ? P : !0,
      strictNumbers: (h = (w = C.strictNumbers) !== null && w !== void 0 ? w : wt) !== null && h !== void 0 ? h : !0,
      strictTypes: (R = (k = C.strictTypes) !== null && k !== void 0 ? k : wt) !== null && R !== void 0 ? R : "log",
      strictTuples: (he = (z = C.strictTuples) !== null && z !== void 0 ? z : wt) !== null && he !== void 0 ? he : "log",
      strictRequired: (we = (ge = C.strictRequired) !== null && ge !== void 0 ? ge : wt) !== null && we !== void 0 ? we : !1,
      code: C.code ? { ...C.code, optimize: cr, regExp: Tr } : { optimize: cr, regExp: Tr },
      loopRequired: (Pe = C.loopRequired) !== null && Pe !== void 0 ? Pe : E,
      loopEnum: (Xe = C.loopEnum) !== null && Xe !== void 0 ? Xe : E,
      meta: ($e = C.meta) !== null && $e !== void 0 ? $e : !0,
      messages: (Ue = C.messages) !== null && Ue !== void 0 ? Ue : !0,
      inlineRefs: (kt = C.inlineRefs) !== null && kt !== void 0 ? kt : !0,
      schemaId: (Pt = C.schemaId) !== null && Pt !== void 0 ? Pt : "$id",
      addUsedSchema: (vt = C.addUsedSchema) !== null && vt !== void 0 ? vt : !0,
      validateSchema: (At = C.validateSchema) !== null && At !== void 0 ? At : !0,
      validateFormats: (ar = C.validateFormats) !== null && ar !== void 0 ? ar : !0,
      unicodeRegExp: (or = C.unicodeRegExp) !== null && or !== void 0 ? or : !0,
      int32range: (lr = C.int32range) !== null && lr !== void 0 ? lr : !0,
      uriResolver: mt
    };
  }
  class O {
    constructor(b = {}) {
      this.schemas = {}, this.refs = {}, this.formats = {}, this._compilations = /* @__PURE__ */ new Set(), this._loading = {}, this._cache = /* @__PURE__ */ new Map(), b = this.opts = { ...b, ...N(b) };
      const { es5: A, lines: S } = this.opts.code;
      this.scope = new o.ValueScope({ scope: {}, prefixes: $, es5: A, lines: S }), this.logger = x(b.logger);
      const f = b.validateFormats;
      b.validateFormats = !1, this.RULES = (0, i.getRules)(), U.call(this, v, b, "NOT SUPPORTED"), U.call(this, g, b, "DEPRECATED", "warn"), this._metaOpts = ye.call(this), b.formats && me.call(this), this._addVocabularies(), this._addDefaultMetaSchema(), b.keywords && I.call(this, b.keywords), typeof b.meta == "object" && this.addMetaSchema(b.meta), B.call(this), b.validateFormats = f;
    }
    _addVocabularies() {
      this.addKeyword("$async");
    }
    _addDefaultMetaSchema() {
      const { $data: b, meta: A, schemaId: S } = this.opts;
      let f = d;
      S === "id" && (f = { ...d }, f.id = f.$id, delete f.$id), A && b && this.addMetaSchema(f, f[S], !1);
    }
    defaultMeta() {
      const { meta: b, schemaId: A } = this.opts;
      return this.opts.defaultMeta = typeof b == "object" ? b[A] || b : void 0;
    }
    validate(b, A) {
      let S;
      if (typeof b == "string") {
        if (S = this.getSchema(b), !S)
          throw new Error(`no schema with key or ref "${b}"`);
      } else
        S = this.compile(b);
      const f = S(A);
      return "$async" in S || (this.errors = S.errors), f;
    }
    compile(b, A) {
      const S = this._addSchema(b, A);
      return S.validate || this._compileSchemaEnv(S);
    }
    compileAsync(b, A) {
      if (typeof this.opts.loadSchema != "function")
        throw new Error("options.loadSchema should be a function");
      const { loadSchema: S } = this.opts;
      return f.call(this, b, A);
      async function f(R, z) {
        await y.call(this, R.$schema);
        const he = this._addSchema(R, z);
        return he.validate || P.call(this, he);
      }
      async function y(R) {
        R && !this.getSchema(R) && await f.call(this, { $ref: R }, !0);
      }
      async function P(R) {
        try {
          return this._compileSchemaEnv(R);
        } catch (z) {
          if (!(z instanceof s.default))
            throw z;
          return w.call(this, z), await h.call(this, z.missingSchema), P.call(this, R);
        }
      }
      function w({ missingSchema: R, missingRef: z }) {
        if (this.refs[R])
          throw new Error(`AnySchema ${R} is loaded but ${z} cannot be resolved`);
      }
      async function h(R) {
        const z = await k.call(this, R);
        this.refs[R] || await y.call(this, z.$schema), this.refs[R] || this.addSchema(z, R, A);
      }
      async function k(R) {
        const z = this._loading[R];
        if (z)
          return z;
        try {
          return await (this._loading[R] = S(R));
        } finally {
          delete this._loading[R];
        }
      }
    }
    // Adds schema to the instance
    addSchema(b, A, S, f = this.opts.validateSchema) {
      if (Array.isArray(b)) {
        for (const P of b)
          this.addSchema(P, void 0, S, f);
        return this;
      }
      let y;
      if (typeof b == "object") {
        const { schemaId: P } = this.opts;
        if (y = b[P], y !== void 0 && typeof y != "string")
          throw new Error(`schema ${P} must be string`);
      }
      return A = (0, l.normalizeId)(A || y), this._checkUnique(A), this.schemas[A] = this._addSchema(b, S, A, f, !0), this;
    }
    // Add schema that will be used to validate other schemas
    // options in META_IGNORE_OPTIONS are alway set to false
    addMetaSchema(b, A, S = this.opts.validateSchema) {
      return this.addSchema(b, A, !0, S), this;
    }
    //  Validate schema against its meta-schema
    validateSchema(b, A) {
      if (typeof b == "boolean")
        return !0;
      let S;
      if (S = b.$schema, S !== void 0 && typeof S != "string")
        throw new Error("$schema must be a string");
      if (S = S || this.opts.defaultMeta || this.defaultMeta(), !S)
        return this.logger.warn("meta-schema not available"), this.errors = null, !0;
      const f = this.validate(S, b);
      if (!f && A) {
        const y = "schema is invalid: " + this.errorsText();
        if (this.opts.validateSchema === "log")
          this.logger.error(y);
        else
          throw new Error(y);
      }
      return f;
    }
    // Get compiled schema by `key` or `ref`.
    // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
    getSchema(b) {
      let A;
      for (; typeof (A = q.call(this, b)) == "string"; )
        b = A;
      if (A === void 0) {
        const { schemaId: S } = this.opts, f = new a.SchemaEnv({ schema: {}, schemaId: S });
        if (A = a.resolveSchema.call(this, f, b), !A)
          return;
        this.refs[b] = A;
      }
      return A.validate || this._compileSchemaEnv(A);
    }
    // Remove cached schema(s).
    // If no parameter is passed all schemas but meta-schemas are removed.
    // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
    // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
    removeSchema(b) {
      if (b instanceof RegExp)
        return this._removeAllSchemas(this.schemas, b), this._removeAllSchemas(this.refs, b), this;
      switch (typeof b) {
        case "undefined":
          return this._removeAllSchemas(this.schemas), this._removeAllSchemas(this.refs), this._cache.clear(), this;
        case "string": {
          const A = q.call(this, b);
          return typeof A == "object" && this._cache.delete(A.schema), delete this.schemas[b], delete this.refs[b], this;
        }
        case "object": {
          const A = b;
          this._cache.delete(A);
          let S = b[this.opts.schemaId];
          return S && (S = (0, l.normalizeId)(S), delete this.schemas[S], delete this.refs[S]), this;
        }
        default:
          throw new Error("ajv.removeSchema: invalid parameter");
      }
    }
    // add "vocabulary" - a collection of keywords
    addVocabulary(b) {
      for (const A of b)
        this.addKeyword(A);
      return this;
    }
    addKeyword(b, A) {
      let S;
      if (typeof b == "string")
        S = b, typeof A == "object" && (this.logger.warn("these parameters are deprecated, see docs for addKeyword"), A.keyword = S);
      else if (typeof b == "object" && A === void 0) {
        if (A = b, S = A.keyword, Array.isArray(S) && !S.length)
          throw new Error("addKeywords: keyword must be string or non-empty array");
      } else
        throw new Error("invalid addKeywords parameters");
      if (F.call(this, S, A), !A)
        return (0, u.eachItem)(S, (y) => L.call(this, y)), this;
      M.call(this, A);
      const f = {
        ...A,
        type: (0, c.getJSONTypes)(A.type),
        schemaType: (0, c.getJSONTypes)(A.schemaType)
      };
      return (0, u.eachItem)(S, f.type.length === 0 ? (y) => L.call(this, y, f) : (y) => f.type.forEach((P) => L.call(this, y, f, P))), this;
    }
    getKeyword(b) {
      const A = this.RULES.all[b];
      return typeof A == "object" ? A.definition : !!A;
    }
    // Remove keyword
    removeKeyword(b) {
      const { RULES: A } = this;
      delete A.keywords[b], delete A.all[b];
      for (const S of A.rules) {
        const f = S.rules.findIndex((y) => y.keyword === b);
        f >= 0 && S.rules.splice(f, 1);
      }
      return this;
    }
    // Add format
    addFormat(b, A) {
      return typeof A == "string" && (A = new RegExp(A)), this.formats[b] = A, this;
    }
    errorsText(b = this.errors, { separator: A = ", ", dataVar: S = "data" } = {}) {
      return !b || b.length === 0 ? "No errors" : b.map((f) => `${S}${f.instancePath} ${f.message}`).reduce((f, y) => f + A + y);
    }
    $dataMetaSchema(b, A) {
      const S = this.RULES.all;
      b = JSON.parse(JSON.stringify(b));
      for (const f of A) {
        const y = f.split("/").slice(1);
        let P = b;
        for (const w of y)
          P = P[w];
        for (const w in S) {
          const h = S[w];
          if (typeof h != "object")
            continue;
          const { $data: k } = h.definition, R = P[w];
          k && R && (P[w] = H(R));
        }
      }
      return b;
    }
    _removeAllSchemas(b, A) {
      for (const S in b) {
        const f = b[S];
        (!A || A.test(S)) && (typeof f == "string" ? delete b[S] : f && !f.meta && (this._cache.delete(f.schema), delete b[S]));
      }
    }
    _addSchema(b, A, S, f = this.opts.validateSchema, y = this.opts.addUsedSchema) {
      let P;
      const { schemaId: w } = this.opts;
      if (typeof b == "object")
        P = b[w];
      else {
        if (this.opts.jtd)
          throw new Error("schema must be object");
        if (typeof b != "boolean")
          throw new Error("schema must be object or boolean");
      }
      let h = this._cache.get(b);
      if (h !== void 0)
        return h;
      S = (0, l.normalizeId)(P || S);
      const k = l.getSchemaRefs.call(this, b, S);
      return h = new a.SchemaEnv({ schema: b, schemaId: w, meta: A, baseId: S, localRefs: k }), this._cache.set(h.schema, h), y && !S.startsWith("#") && (S && this._checkUnique(S), this.refs[S] = h), f && this.validateSchema(b, !0), h;
    }
    _checkUnique(b) {
      if (this.schemas[b] || this.refs[b])
        throw new Error(`schema with key or id "${b}" already exists`);
    }
    _compileSchemaEnv(b) {
      if (b.meta ? this._compileMetaSchema(b) : a.compileSchema.call(this, b), !b.validate)
        throw new Error("ajv implementation error");
      return b.validate;
    }
    _compileMetaSchema(b) {
      const A = this.opts;
      this.opts = this._metaOpts;
      try {
        a.compileSchema.call(this, b);
      } finally {
        this.opts = A;
      }
    }
  }
  O.ValidationError = n.default, O.MissingRefError = s.default, e.default = O;
  function U(C, b, A, S = "error") {
    for (const f in C) {
      const y = f;
      y in b && this.logger[S](`${A}: option ${f}. ${C[y]}`);
    }
  }
  function q(C) {
    return C = (0, l.normalizeId)(C), this.schemas[C] || this.refs[C];
  }
  function B() {
    const C = this.opts.schemas;
    if (C)
      if (Array.isArray(C))
        this.addSchema(C);
      else
        for (const b in C)
          this.addSchema(C[b], b);
  }
  function me() {
    for (const C in this.opts.formats) {
      const b = this.opts.formats[C];
      b && this.addFormat(C, b);
    }
  }
  function I(C) {
    if (Array.isArray(C)) {
      this.addVocabulary(C);
      return;
    }
    this.logger.warn("keywords option as map is deprecated, pass array");
    for (const b in C) {
      const A = C[b];
      A.keyword || (A.keyword = b), this.addKeyword(A);
    }
  }
  function ye() {
    const C = { ...this.opts };
    for (const b of _)
      delete C[b];
    return C;
  }
  const W = { log() {
  }, warn() {
  }, error() {
  } };
  function x(C) {
    if (C === !1)
      return W;
    if (C === void 0)
      return console;
    if (C.log && C.warn && C.error)
      return C;
    throw new Error("logger must implement log, warn and error methods");
  }
  const se = /^[a-z_$][a-z0-9_$:-]*$/i;
  function F(C, b) {
    const { RULES: A } = this;
    if ((0, u.eachItem)(C, (S) => {
      if (A.keywords[S])
        throw new Error(`Keyword ${S} is already defined`);
      if (!se.test(S))
        throw new Error(`Keyword ${S} has invalid name`);
    }), !!b && b.$data && !("code" in b || "validate" in b))
      throw new Error('$data keyword must have "code" or "validate" function');
  }
  function L(C, b, A) {
    var S;
    const f = b == null ? void 0 : b.post;
    if (A && f)
      throw new Error('keyword with "post" flag cannot have "type"');
    const { RULES: y } = this;
    let P = f ? y.post : y.rules.find(({ type: h }) => h === A);
    if (P || (P = { type: A, rules: [] }, y.rules.push(P)), y.keywords[C] = !0, !b)
      return;
    const w = {
      keyword: C,
      definition: {
        ...b,
        type: (0, c.getJSONTypes)(b.type),
        schemaType: (0, c.getJSONTypes)(b.schemaType)
      }
    };
    b.before ? K.call(this, P, w, b.before) : P.rules.push(w), y.all[C] = w, (S = b.implements) === null || S === void 0 || S.forEach((h) => this.addKeyword(h));
  }
  function K(C, b, A) {
    const S = C.rules.findIndex((f) => f.keyword === A);
    S >= 0 ? C.rules.splice(S, 0, b) : (C.rules.push(b), this.logger.warn(`rule ${A} is not defined`));
  }
  function M(C) {
    let { metaSchema: b } = C;
    b !== void 0 && (C.$data && this.opts.$data && (b = H(b)), C.validateSchema = this.compile(b, !0));
  }
  const X = {
    $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
  };
  function H(C) {
    return { anyOf: [C, X] };
  }
})(Om);
var mu = {}, gu = {}, yu = {};
Object.defineProperty(yu, "__esModule", { value: !0 });
const fP = {
  keyword: "id",
  code() {
    throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
  }
};
yu.default = fP;
var Tn = {};
Object.defineProperty(Tn, "__esModule", { value: !0 });
Tn.callRef = Tn.getValidate = void 0;
const hP = fs, Rf = de, yt = ce, Dn = ir, Nf = $t, xi = G, pP = {
  keyword: "$ref",
  schemaType: "string",
  code(e) {
    const { gen: t, schema: r, it: n } = e, { baseId: s, schemaEnv: i, validateName: a, opts: o, self: l } = n, { root: c } = i;
    if ((r === "#" || r === "#/") && s === c.baseId)
      return d();
    const u = Nf.resolveRef.call(l, c, s, r);
    if (u === void 0)
      throw new hP.default(n.opts.uriResolver, s, r);
    if (u instanceof Nf.SchemaEnv)
      return p(u);
    return m(u);
    function d() {
      if (i === c)
        return ha(e, a, i, i.$async);
      const _ = t.scopeValue("root", { ref: c });
      return ha(e, (0, yt._)`${_}.validate`, c, c.$async);
    }
    function p(_) {
      const $ = ug(e, _);
      ha(e, $, _, _.$async);
    }
    function m(_) {
      const $ = t.scopeValue("schema", o.code.source === !0 ? { ref: _, code: (0, yt.stringify)(_) } : { ref: _ }), v = t.name("valid"), g = e.subschema({
        schema: _,
        dataTypes: [],
        schemaPath: yt.nil,
        topSchemaRef: $,
        errSchemaPath: r
      }, v);
      e.mergeEvaluated(g), e.ok(v);
    }
  }
};
function ug(e, t) {
  const { gen: r } = e;
  return t.validate ? r.scopeValue("validate", { ref: t.validate }) : (0, yt._)`${r.scopeValue("wrapper", { ref: t })}.validate`;
}
Tn.getValidate = ug;
function ha(e, t, r, n) {
  const { gen: s, it: i } = e, { allErrors: a, schemaEnv: o, opts: l } = i, c = l.passContext ? Dn.default.this : yt.nil;
  n ? u() : d();
  function u() {
    if (!o.$async)
      throw new Error("async schema referenced by sync schema");
    const _ = s.let("valid");
    s.try(() => {
      s.code((0, yt._)`await ${(0, Rf.callValidateCode)(e, t, c)}`), m(t), a || s.assign(_, !0);
    }, ($) => {
      s.if((0, yt._)`!(${$} instanceof ${i.ValidationError})`, () => s.throw($)), p($), a || s.assign(_, !1);
    }), e.ok(_);
  }
  function d() {
    e.result((0, Rf.callValidateCode)(e, t, c), () => m(t), () => p(t));
  }
  function p(_) {
    const $ = (0, yt._)`${_}.errors`;
    s.assign(Dn.default.vErrors, (0, yt._)`${Dn.default.vErrors} === null ? ${$} : ${Dn.default.vErrors}.concat(${$})`), s.assign(Dn.default.errors, (0, yt._)`${Dn.default.vErrors}.length`);
  }
  function m(_) {
    var $;
    if (!i.opts.unevaluated)
      return;
    const v = ($ = r == null ? void 0 : r.validate) === null || $ === void 0 ? void 0 : $.evaluated;
    if (i.props !== !0)
      if (v && !v.dynamicProps)
        v.props !== void 0 && (i.props = xi.mergeEvaluated.props(s, v.props, i.props));
      else {
        const g = s.var("props", (0, yt._)`${_}.evaluated.props`);
        i.props = xi.mergeEvaluated.props(s, g, i.props, yt.Name);
      }
    if (i.items !== !0)
      if (v && !v.dynamicItems)
        v.items !== void 0 && (i.items = xi.mergeEvaluated.items(s, v.items, i.items));
      else {
        const g = s.var("items", (0, yt._)`${_}.evaluated.items`);
        i.items = xi.mergeEvaluated.items(s, g, i.items, yt.Name);
      }
  }
}
Tn.callRef = ha;
Tn.default = pP;
Object.defineProperty(gu, "__esModule", { value: !0 });
const mP = yu, gP = Tn, yP = [
  "$schema",
  "$id",
  "$defs",
  "$vocabulary",
  { keyword: "$comment" },
  "definitions",
  mP.default,
  gP.default
];
gu.default = yP;
var $u = {}, _u = {};
Object.defineProperty(_u, "__esModule", { value: !0 });
const Pa = ce, Ur = Pa.operators, Aa = {
  maximum: { okStr: "<=", ok: Ur.LTE, fail: Ur.GT },
  minimum: { okStr: ">=", ok: Ur.GTE, fail: Ur.LT },
  exclusiveMaximum: { okStr: "<", ok: Ur.LT, fail: Ur.GTE },
  exclusiveMinimum: { okStr: ">", ok: Ur.GT, fail: Ur.LTE }
}, $P = {
  message: ({ keyword: e, schemaCode: t }) => (0, Pa.str)`must be ${Aa[e].okStr} ${t}`,
  params: ({ keyword: e, schemaCode: t }) => (0, Pa._)`{comparison: ${Aa[e].okStr}, limit: ${t}}`
}, _P = {
  keyword: Object.keys(Aa),
  type: "number",
  schemaType: "number",
  $data: !0,
  error: $P,
  code(e) {
    const { keyword: t, data: r, schemaCode: n } = e;
    e.fail$data((0, Pa._)`${r} ${Aa[t].fail} ${n} || isNaN(${r})`);
  }
};
_u.default = _P;
var vu = {};
Object.defineProperty(vu, "__esModule", { value: !0 });
const Gs = ce, vP = {
  message: ({ schemaCode: e }) => (0, Gs.str)`must be multiple of ${e}`,
  params: ({ schemaCode: e }) => (0, Gs._)`{multipleOf: ${e}}`
}, wP = {
  keyword: "multipleOf",
  type: "number",
  schemaType: "number",
  $data: !0,
  error: vP,
  code(e) {
    const { gen: t, data: r, schemaCode: n, it: s } = e, i = s.opts.multipleOfPrecision, a = t.let("res"), o = i ? (0, Gs._)`Math.abs(Math.round(${a}) - ${a}) > 1e-${i}` : (0, Gs._)`${a} !== parseInt(${a})`;
    e.fail$data((0, Gs._)`(${n} === 0 || (${a} = ${r}/${n}, ${o}))`);
  }
};
vu.default = wP;
var wu = {}, Eu = {};
Object.defineProperty(Eu, "__esModule", { value: !0 });
function dg(e) {
  const t = e.length;
  let r = 0, n = 0, s;
  for (; n < t; )
    r++, s = e.charCodeAt(n++), s >= 55296 && s <= 56319 && n < t && (s = e.charCodeAt(n), (s & 64512) === 56320 && n++);
  return r;
}
Eu.default = dg;
dg.code = 'require("ajv/dist/runtime/ucs2length").default';
Object.defineProperty(wu, "__esModule", { value: !0 });
const mn = ce, EP = G, bP = Eu, SP = {
  message({ keyword: e, schemaCode: t }) {
    const r = e === "maxLength" ? "more" : "fewer";
    return (0, mn.str)`must NOT have ${r} than ${t} characters`;
  },
  params: ({ schemaCode: e }) => (0, mn._)`{limit: ${e}}`
}, TP = {
  keyword: ["maxLength", "minLength"],
  type: "string",
  schemaType: "number",
  $data: !0,
  error: SP,
  code(e) {
    const { keyword: t, data: r, schemaCode: n, it: s } = e, i = t === "maxLength" ? mn.operators.GT : mn.operators.LT, a = s.opts.unicode === !1 ? (0, mn._)`${r}.length` : (0, mn._)`${(0, EP.useFunc)(e.gen, bP.default)}(${r})`;
    e.fail$data((0, mn._)`${a} ${i} ${n}`);
  }
};
wu.default = TP;
var bu = {};
Object.defineProperty(bu, "__esModule", { value: !0 });
const PP = de, Ra = ce, AP = {
  message: ({ schemaCode: e }) => (0, Ra.str)`must match pattern "${e}"`,
  params: ({ schemaCode: e }) => (0, Ra._)`{pattern: ${e}}`
}, RP = {
  keyword: "pattern",
  type: "string",
  schemaType: "string",
  $data: !0,
  error: AP,
  code(e) {
    const { data: t, $data: r, schema: n, schemaCode: s, it: i } = e, a = i.opts.unicodeRegExp ? "u" : "", o = r ? (0, Ra._)`(new RegExp(${s}, ${a}))` : (0, PP.usePattern)(e, n);
    e.fail$data((0, Ra._)`!${o}.test(${t})`);
  }
};
bu.default = RP;
var Su = {};
Object.defineProperty(Su, "__esModule", { value: !0 });
const Ks = ce, NP = {
  message({ keyword: e, schemaCode: t }) {
    const r = e === "maxProperties" ? "more" : "fewer";
    return (0, Ks.str)`must NOT have ${r} than ${t} properties`;
  },
  params: ({ schemaCode: e }) => (0, Ks._)`{limit: ${e}}`
}, CP = {
  keyword: ["maxProperties", "minProperties"],
  type: "object",
  schemaType: "number",
  $data: !0,
  error: NP,
  code(e) {
    const { keyword: t, data: r, schemaCode: n } = e, s = t === "maxProperties" ? Ks.operators.GT : Ks.operators.LT;
    e.fail$data((0, Ks._)`Object.keys(${r}).length ${s} ${n}`);
  }
};
Su.default = CP;
var Tu = {};
Object.defineProperty(Tu, "__esModule", { value: !0 });
const Ns = de, Ws = ce, OP = G, IP = {
  message: ({ params: { missingProperty: e } }) => (0, Ws.str)`must have required property '${e}'`,
  params: ({ params: { missingProperty: e } }) => (0, Ws._)`{missingProperty: ${e}}`
}, DP = {
  keyword: "required",
  type: "object",
  schemaType: "array",
  $data: !0,
  error: IP,
  code(e) {
    const { gen: t, schema: r, schemaCode: n, data: s, $data: i, it: a } = e, { opts: o } = a;
    if (!i && r.length === 0)
      return;
    const l = r.length >= o.loopRequired;
    if (a.allErrors ? c() : u(), o.strictRequired) {
      const m = e.parentSchema.properties, { definedProperties: _ } = e.it;
      for (const $ of r)
        if ((m == null ? void 0 : m[$]) === void 0 && !_.has($)) {
          const v = a.schemaEnv.baseId + a.errSchemaPath, g = `required property "${$}" is not defined at "${v}" (strictRequired)`;
          (0, OP.checkStrictMode)(a, g, a.opts.strictRequired);
        }
    }
    function c() {
      if (l || i)
        e.block$data(Ws.nil, d);
      else
        for (const m of r)
          (0, Ns.checkReportMissingProp)(e, m);
    }
    function u() {
      const m = t.let("missing");
      if (l || i) {
        const _ = t.let("valid", !0);
        e.block$data(_, () => p(m, _)), e.ok(_);
      } else
        t.if((0, Ns.checkMissingProp)(e, r, m)), (0, Ns.reportMissingProp)(e, m), t.else();
    }
    function d() {
      t.forOf("prop", n, (m) => {
        e.setParams({ missingProperty: m }), t.if((0, Ns.noPropertyInData)(t, s, m, o.ownProperties), () => e.error());
      });
    }
    function p(m, _) {
      e.setParams({ missingProperty: m }), t.forOf(m, n, () => {
        t.assign(_, (0, Ns.propertyInData)(t, s, m, o.ownProperties)), t.if((0, Ws.not)(_), () => {
          e.error(), t.break();
        });
      }, Ws.nil);
    }
  }
};
Tu.default = DP;
var Pu = {};
Object.defineProperty(Pu, "__esModule", { value: !0 });
const Ys = ce, kP = {
  message({ keyword: e, schemaCode: t }) {
    const r = e === "maxItems" ? "more" : "fewer";
    return (0, Ys.str)`must NOT have ${r} than ${t} items`;
  },
  params: ({ schemaCode: e }) => (0, Ys._)`{limit: ${e}}`
}, UP = {
  keyword: ["maxItems", "minItems"],
  type: "array",
  schemaType: "number",
  $data: !0,
  error: kP,
  code(e) {
    const { keyword: t, data: r, schemaCode: n } = e, s = t === "maxItems" ? Ys.operators.GT : Ys.operators.LT;
    e.fail$data((0, Ys._)`${r}.length ${s} ${n}`);
  }
};
Pu.default = UP;
var Au = {}, gi = {};
Object.defineProperty(gi, "__esModule", { value: !0 });
const fg = za;
fg.code = 'require("ajv/dist/runtime/equal").default';
gi.default = fg;
Object.defineProperty(Au, "__esModule", { value: !0 });
const xo = Le, ze = ce, FP = G, LP = gi, jP = {
  message: ({ params: { i: e, j: t } }) => (0, ze.str)`must NOT have duplicate items (items ## ${t} and ${e} are identical)`,
  params: ({ params: { i: e, j: t } }) => (0, ze._)`{i: ${e}, j: ${t}}`
}, MP = {
  keyword: "uniqueItems",
  type: "array",
  schemaType: "boolean",
  $data: !0,
  error: jP,
  code(e) {
    const { gen: t, data: r, $data: n, schema: s, parentSchema: i, schemaCode: a, it: o } = e;
    if (!n && !s)
      return;
    const l = t.let("valid"), c = i.items ? (0, xo.getSchemaTypes)(i.items) : [];
    e.block$data(l, u, (0, ze._)`${a} === false`), e.ok(l);
    function u() {
      const _ = t.let("i", (0, ze._)`${r}.length`), $ = t.let("j");
      e.setParams({ i: _, j: $ }), t.assign(l, !0), t.if((0, ze._)`${_} > 1`, () => (d() ? p : m)(_, $));
    }
    function d() {
      return c.length > 0 && !c.some((_) => _ === "object" || _ === "array");
    }
    function p(_, $) {
      const v = t.name("item"), g = (0, xo.checkDataTypes)(c, v, o.opts.strictNumbers, xo.DataType.Wrong), E = t.const("indices", (0, ze._)`{}`);
      t.for((0, ze._)`;${_}--;`, () => {
        t.let(v, (0, ze._)`${r}[${_}]`), t.if(g, (0, ze._)`continue`), c.length > 1 && t.if((0, ze._)`typeof ${v} == "string"`, (0, ze._)`${v} += "_"`), t.if((0, ze._)`typeof ${E}[${v}] == "number"`, () => {
          t.assign($, (0, ze._)`${E}[${v}]`), e.error(), t.assign(l, !1).break();
        }).code((0, ze._)`${E}[${v}] = ${_}`);
      });
    }
    function m(_, $) {
      const v = (0, FP.useFunc)(t, LP.default), g = t.name("outer");
      t.label(g).for((0, ze._)`;${_}--;`, () => t.for((0, ze._)`${$} = ${_}; ${$}--;`, () => t.if((0, ze._)`${v}(${r}[${_}], ${r}[${$}])`, () => {
        e.error(), t.assign(l, !1).break(g);
      })));
    }
  }
};
Au.default = MP;
var Ru = {};
Object.defineProperty(Ru, "__esModule", { value: !0 });
const Ul = ce, xP = G, qP = gi, VP = {
  message: "must be equal to constant",
  params: ({ schemaCode: e }) => (0, Ul._)`{allowedValue: ${e}}`
}, BP = {
  keyword: "const",
  $data: !0,
  error: VP,
  code(e) {
    const { gen: t, data: r, $data: n, schemaCode: s, schema: i } = e;
    n || i && typeof i == "object" ? e.fail$data((0, Ul._)`!${(0, xP.useFunc)(t, qP.default)}(${r}, ${s})`) : e.fail((0, Ul._)`${i} !== ${r}`);
  }
};
Ru.default = BP;
var Nu = {};
Object.defineProperty(Nu, "__esModule", { value: !0 });
const Fs = ce, HP = G, zP = gi, GP = {
  message: "must be equal to one of the allowed values",
  params: ({ schemaCode: e }) => (0, Fs._)`{allowedValues: ${e}}`
}, KP = {
  keyword: "enum",
  schemaType: "array",
  $data: !0,
  error: GP,
  code(e) {
    const { gen: t, data: r, $data: n, schema: s, schemaCode: i, it: a } = e;
    if (!n && s.length === 0)
      throw new Error("enum must have non-empty array");
    const o = s.length >= a.opts.loopEnum;
    let l;
    const c = () => l ?? (l = (0, HP.useFunc)(t, zP.default));
    let u;
    if (o || n)
      u = t.let("valid"), e.block$data(u, d);
    else {
      if (!Array.isArray(s))
        throw new Error("ajv implementation error");
      const m = t.const("vSchema", i);
      u = (0, Fs.or)(...s.map((_, $) => p(m, $)));
    }
    e.pass(u);
    function d() {
      t.assign(u, !1), t.forOf("v", i, (m) => t.if((0, Fs._)`${c()}(${r}, ${m})`, () => t.assign(u, !0).break()));
    }
    function p(m, _) {
      const $ = s[_];
      return typeof $ == "object" && $ !== null ? (0, Fs._)`${c()}(${r}, ${m}[${_}])` : (0, Fs._)`${r} === ${$}`;
    }
  }
};
Nu.default = KP;
Object.defineProperty($u, "__esModule", { value: !0 });
const WP = _u, YP = vu, XP = wu, JP = bu, QP = Su, ZP = Tu, eA = Pu, tA = Au, rA = Ru, nA = Nu, sA = [
  // number
  WP.default,
  YP.default,
  // string
  XP.default,
  JP.default,
  // object
  QP.default,
  ZP.default,
  // array
  eA.default,
  tA.default,
  // any
  { keyword: "type", schemaType: ["string", "array"] },
  { keyword: "nullable", schemaType: "boolean" },
  rA.default,
  nA.default
];
$u.default = sA;
var Cu = {}, hs = {};
Object.defineProperty(hs, "__esModule", { value: !0 });
hs.validateAdditionalItems = void 0;
const gn = ce, Fl = G, iA = {
  message: ({ params: { len: e } }) => (0, gn.str)`must NOT have more than ${e} items`,
  params: ({ params: { len: e } }) => (0, gn._)`{limit: ${e}}`
}, aA = {
  keyword: "additionalItems",
  type: "array",
  schemaType: ["boolean", "object"],
  before: "uniqueItems",
  error: iA,
  code(e) {
    const { parentSchema: t, it: r } = e, { items: n } = t;
    if (!Array.isArray(n)) {
      (0, Fl.checkStrictMode)(r, '"additionalItems" is ignored when "items" is not an array of schemas');
      return;
    }
    hg(e, n);
  }
};
function hg(e, t) {
  const { gen: r, schema: n, data: s, keyword: i, it: a } = e;
  a.items = !0;
  const o = r.const("len", (0, gn._)`${s}.length`);
  if (n === !1)
    e.setParams({ len: t.length }), e.pass((0, gn._)`${o} <= ${t.length}`);
  else if (typeof n == "object" && !(0, Fl.alwaysValidSchema)(a, n)) {
    const c = r.var("valid", (0, gn._)`${o} <= ${t.length}`);
    r.if((0, gn.not)(c), () => l(c)), e.ok(c);
  }
  function l(c) {
    r.forRange("i", t.length, o, (u) => {
      e.subschema({ keyword: i, dataProp: u, dataPropType: Fl.Type.Num }, c), a.allErrors || r.if((0, gn.not)(c), () => r.break());
    });
  }
}
hs.validateAdditionalItems = hg;
hs.default = aA;
var Ou = {}, ps = {};
Object.defineProperty(ps, "__esModule", { value: !0 });
ps.validateTuple = void 0;
const Cf = ce, pa = G, oA = de, lA = {
  keyword: "items",
  type: "array",
  schemaType: ["object", "array", "boolean"],
  before: "uniqueItems",
  code(e) {
    const { schema: t, it: r } = e;
    if (Array.isArray(t))
      return pg(e, "additionalItems", t);
    r.items = !0, !(0, pa.alwaysValidSchema)(r, t) && e.ok((0, oA.validateArray)(e));
  }
};
function pg(e, t, r = e.schema) {
  const { gen: n, parentSchema: s, data: i, keyword: a, it: o } = e;
  u(s), o.opts.unevaluated && r.length && o.items !== !0 && (o.items = pa.mergeEvaluated.items(n, r.length, o.items));
  const l = n.name("valid"), c = n.const("len", (0, Cf._)`${i}.length`);
  r.forEach((d, p) => {
    (0, pa.alwaysValidSchema)(o, d) || (n.if((0, Cf._)`${c} > ${p}`, () => e.subschema({
      keyword: a,
      schemaProp: p,
      dataProp: p
    }, l)), e.ok(l));
  });
  function u(d) {
    const { opts: p, errSchemaPath: m } = o, _ = r.length, $ = _ === d.minItems && (_ === d.maxItems || d[t] === !1);
    if (p.strictTuples && !$) {
      const v = `"${a}" is ${_}-tuple, but minItems or maxItems/${t} are not specified or different at path "${m}"`;
      (0, pa.checkStrictMode)(o, v, p.strictTuples);
    }
  }
}
ps.validateTuple = pg;
ps.default = lA;
Object.defineProperty(Ou, "__esModule", { value: !0 });
const cA = ps, uA = {
  keyword: "prefixItems",
  type: "array",
  schemaType: ["array"],
  before: "uniqueItems",
  code: (e) => (0, cA.validateTuple)(e, "items")
};
Ou.default = uA;
var Iu = {};
Object.defineProperty(Iu, "__esModule", { value: !0 });
const Of = ce, dA = G, fA = de, hA = hs, pA = {
  message: ({ params: { len: e } }) => (0, Of.str)`must NOT have more than ${e} items`,
  params: ({ params: { len: e } }) => (0, Of._)`{limit: ${e}}`
}, mA = {
  keyword: "items",
  type: "array",
  schemaType: ["object", "boolean"],
  before: "uniqueItems",
  error: pA,
  code(e) {
    const { schema: t, parentSchema: r, it: n } = e, { prefixItems: s } = r;
    n.items = !0, !(0, dA.alwaysValidSchema)(n, t) && (s ? (0, hA.validateAdditionalItems)(e, s) : e.ok((0, fA.validateArray)(e)));
  }
};
Iu.default = mA;
var Du = {};
Object.defineProperty(Du, "__esModule", { value: !0 });
const It = ce, qi = G, gA = {
  message: ({ params: { min: e, max: t } }) => t === void 0 ? (0, It.str)`must contain at least ${e} valid item(s)` : (0, It.str)`must contain at least ${e} and no more than ${t} valid item(s)`,
  params: ({ params: { min: e, max: t } }) => t === void 0 ? (0, It._)`{minContains: ${e}}` : (0, It._)`{minContains: ${e}, maxContains: ${t}}`
}, yA = {
  keyword: "contains",
  type: "array",
  schemaType: ["object", "boolean"],
  before: "uniqueItems",
  trackErrors: !0,
  error: gA,
  code(e) {
    const { gen: t, schema: r, parentSchema: n, data: s, it: i } = e;
    let a, o;
    const { minContains: l, maxContains: c } = n;
    i.opts.next ? (a = l === void 0 ? 1 : l, o = c) : a = 1;
    const u = t.const("len", (0, It._)`${s}.length`);
    if (e.setParams({ min: a, max: o }), o === void 0 && a === 0) {
      (0, qi.checkStrictMode)(i, '"minContains" == 0 without "maxContains": "contains" keyword ignored');
      return;
    }
    if (o !== void 0 && a > o) {
      (0, qi.checkStrictMode)(i, '"minContains" > "maxContains" is always invalid'), e.fail();
      return;
    }
    if ((0, qi.alwaysValidSchema)(i, r)) {
      let $ = (0, It._)`${u} >= ${a}`;
      o !== void 0 && ($ = (0, It._)`${$} && ${u} <= ${o}`), e.pass($);
      return;
    }
    i.items = !0;
    const d = t.name("valid");
    o === void 0 && a === 1 ? m(d, () => t.if(d, () => t.break())) : a === 0 ? (t.let(d, !0), o !== void 0 && t.if((0, It._)`${s}.length > 0`, p)) : (t.let(d, !1), p()), e.result(d, () => e.reset());
    function p() {
      const $ = t.name("_valid"), v = t.let("count", 0);
      m($, () => t.if($, () => _(v)));
    }
    function m($, v) {
      t.forRange("i", 0, u, (g) => {
        e.subschema({
          keyword: "contains",
          dataProp: g,
          dataPropType: qi.Type.Num,
          compositeRule: !0
        }, $), v();
      });
    }
    function _($) {
      t.code((0, It._)`${$}++`), o === void 0 ? t.if((0, It._)`${$} >= ${a}`, () => t.assign(d, !0).break()) : (t.if((0, It._)`${$} > ${o}`, () => t.assign(d, !1).break()), a === 1 ? t.assign(d, !0) : t.if((0, It._)`${$} >= ${a}`, () => t.assign(d, !0)));
    }
  }
};
Du.default = yA;
var mg = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.validateSchemaDeps = e.validatePropertyDeps = e.error = void 0;
  const t = ce, r = G, n = de;
  e.error = {
    message: ({ params: { property: l, depsCount: c, deps: u } }) => {
      const d = c === 1 ? "property" : "properties";
      return (0, t.str)`must have ${d} ${u} when property ${l} is present`;
    },
    params: ({ params: { property: l, depsCount: c, deps: u, missingProperty: d } }) => (0, t._)`{property: ${l},
    missingProperty: ${d},
    depsCount: ${c},
    deps: ${u}}`
    // TODO change to reference
  };
  const s = {
    keyword: "dependencies",
    type: "object",
    schemaType: "object",
    error: e.error,
    code(l) {
      const [c, u] = i(l);
      a(l, c), o(l, u);
    }
  };
  function i({ schema: l }) {
    const c = {}, u = {};
    for (const d in l) {
      if (d === "__proto__")
        continue;
      const p = Array.isArray(l[d]) ? c : u;
      p[d] = l[d];
    }
    return [c, u];
  }
  function a(l, c = l.schema) {
    const { gen: u, data: d, it: p } = l;
    if (Object.keys(c).length === 0)
      return;
    const m = u.let("missing");
    for (const _ in c) {
      const $ = c[_];
      if ($.length === 0)
        continue;
      const v = (0, n.propertyInData)(u, d, _, p.opts.ownProperties);
      l.setParams({
        property: _,
        depsCount: $.length,
        deps: $.join(", ")
      }), p.allErrors ? u.if(v, () => {
        for (const g of $)
          (0, n.checkReportMissingProp)(l, g);
      }) : (u.if((0, t._)`${v} && (${(0, n.checkMissingProp)(l, $, m)})`), (0, n.reportMissingProp)(l, m), u.else());
    }
  }
  e.validatePropertyDeps = a;
  function o(l, c = l.schema) {
    const { gen: u, data: d, keyword: p, it: m } = l, _ = u.name("valid");
    for (const $ in c)
      (0, r.alwaysValidSchema)(m, c[$]) || (u.if(
        (0, n.propertyInData)(u, d, $, m.opts.ownProperties),
        () => {
          const v = l.subschema({ keyword: p, schemaProp: $ }, _);
          l.mergeValidEvaluated(v, _);
        },
        () => u.var(_, !0)
        // TODO var
      ), l.ok(_));
  }
  e.validateSchemaDeps = o, e.default = s;
})(mg);
var ku = {};
Object.defineProperty(ku, "__esModule", { value: !0 });
const gg = ce, $A = G, _A = {
  message: "property name must be valid",
  params: ({ params: e }) => (0, gg._)`{propertyName: ${e.propertyName}}`
}, vA = {
  keyword: "propertyNames",
  type: "object",
  schemaType: ["object", "boolean"],
  error: _A,
  code(e) {
    const { gen: t, schema: r, data: n, it: s } = e;
    if ((0, $A.alwaysValidSchema)(s, r))
      return;
    const i = t.name("valid");
    t.forIn("key", n, (a) => {
      e.setParams({ propertyName: a }), e.subschema({
        keyword: "propertyNames",
        data: a,
        dataTypes: ["string"],
        propertyName: a,
        compositeRule: !0
      }, i), t.if((0, gg.not)(i), () => {
        e.error(!0), s.allErrors || t.break();
      });
    }), e.ok(i);
  }
};
ku.default = vA;
var to = {};
Object.defineProperty(to, "__esModule", { value: !0 });
const Vi = de, qt = ce, wA = ir, Bi = G, EA = {
  message: "must NOT have additional properties",
  params: ({ params: e }) => (0, qt._)`{additionalProperty: ${e.additionalProperty}}`
}, bA = {
  keyword: "additionalProperties",
  type: ["object"],
  schemaType: ["boolean", "object"],
  allowUndefined: !0,
  trackErrors: !0,
  error: EA,
  code(e) {
    const { gen: t, schema: r, parentSchema: n, data: s, errsCount: i, it: a } = e;
    if (!i)
      throw new Error("ajv implementation error");
    const { allErrors: o, opts: l } = a;
    if (a.props = !0, l.removeAdditional !== "all" && (0, Bi.alwaysValidSchema)(a, r))
      return;
    const c = (0, Vi.allSchemaProperties)(n.properties), u = (0, Vi.allSchemaProperties)(n.patternProperties);
    d(), e.ok((0, qt._)`${i} === ${wA.default.errors}`);
    function d() {
      t.forIn("key", s, (v) => {
        !c.length && !u.length ? _(v) : t.if(p(v), () => _(v));
      });
    }
    function p(v) {
      let g;
      if (c.length > 8) {
        const E = (0, Bi.schemaRefOrVal)(a, n.properties, "properties");
        g = (0, Vi.isOwnProperty)(t, E, v);
      } else c.length ? g = (0, qt.or)(...c.map((E) => (0, qt._)`${v} === ${E}`)) : g = qt.nil;
      return u.length && (g = (0, qt.or)(g, ...u.map((E) => (0, qt._)`${(0, Vi.usePattern)(e, E)}.test(${v})`))), (0, qt.not)(g);
    }
    function m(v) {
      t.code((0, qt._)`delete ${s}[${v}]`);
    }
    function _(v) {
      if (l.removeAdditional === "all" || l.removeAdditional && r === !1) {
        m(v);
        return;
      }
      if (r === !1) {
        e.setParams({ additionalProperty: v }), e.error(), o || t.break();
        return;
      }
      if (typeof r == "object" && !(0, Bi.alwaysValidSchema)(a, r)) {
        const g = t.name("valid");
        l.removeAdditional === "failing" ? ($(v, g, !1), t.if((0, qt.not)(g), () => {
          e.reset(), m(v);
        })) : ($(v, g), o || t.if((0, qt.not)(g), () => t.break()));
      }
    }
    function $(v, g, E) {
      const N = {
        keyword: "additionalProperties",
        dataProp: v,
        dataPropType: Bi.Type.Str
      };
      E === !1 && Object.assign(N, {
        compositeRule: !0,
        createErrors: !1,
        allErrors: !1
      }), e.subschema(N, g);
    }
  }
};
to.default = bA;
var Uu = {};
Object.defineProperty(Uu, "__esModule", { value: !0 });
const SA = zt, If = de, qo = G, Df = to, TA = {
  keyword: "properties",
  type: "object",
  schemaType: "object",
  code(e) {
    const { gen: t, schema: r, parentSchema: n, data: s, it: i } = e;
    i.opts.removeAdditional === "all" && n.additionalProperties === void 0 && Df.default.code(new SA.KeywordCxt(i, Df.default, "additionalProperties"));
    const a = (0, If.allSchemaProperties)(r);
    for (const d of a)
      i.definedProperties.add(d);
    i.opts.unevaluated && a.length && i.props !== !0 && (i.props = qo.mergeEvaluated.props(t, (0, qo.toHash)(a), i.props));
    const o = a.filter((d) => !(0, qo.alwaysValidSchema)(i, r[d]));
    if (o.length === 0)
      return;
    const l = t.name("valid");
    for (const d of o)
      c(d) ? u(d) : (t.if((0, If.propertyInData)(t, s, d, i.opts.ownProperties)), u(d), i.allErrors || t.else().var(l, !0), t.endIf()), e.it.definedProperties.add(d), e.ok(l);
    function c(d) {
      return i.opts.useDefaults && !i.compositeRule && r[d].default !== void 0;
    }
    function u(d) {
      e.subschema({
        keyword: "properties",
        schemaProp: d,
        dataProp: d
      }, l);
    }
  }
};
Uu.default = TA;
var Fu = {};
Object.defineProperty(Fu, "__esModule", { value: !0 });
const kf = de, Hi = ce, Uf = G, Ff = G, PA = {
  keyword: "patternProperties",
  type: "object",
  schemaType: "object",
  code(e) {
    const { gen: t, schema: r, data: n, parentSchema: s, it: i } = e, { opts: a } = i, o = (0, kf.allSchemaProperties)(r), l = o.filter(($) => (0, Uf.alwaysValidSchema)(i, r[$]));
    if (o.length === 0 || l.length === o.length && (!i.opts.unevaluated || i.props === !0))
      return;
    const c = a.strictSchema && !a.allowMatchingProperties && s.properties, u = t.name("valid");
    i.props !== !0 && !(i.props instanceof Hi.Name) && (i.props = (0, Ff.evaluatedPropsToName)(t, i.props));
    const { props: d } = i;
    p();
    function p() {
      for (const $ of o)
        c && m($), i.allErrors ? _($) : (t.var(u, !0), _($), t.if(u));
    }
    function m($) {
      for (const v in c)
        new RegExp($).test(v) && (0, Uf.checkStrictMode)(i, `property ${v} matches pattern ${$} (use allowMatchingProperties)`);
    }
    function _($) {
      t.forIn("key", n, (v) => {
        t.if((0, Hi._)`${(0, kf.usePattern)(e, $)}.test(${v})`, () => {
          const g = l.includes($);
          g || e.subschema({
            keyword: "patternProperties",
            schemaProp: $,
            dataProp: v,
            dataPropType: Ff.Type.Str
          }, u), i.opts.unevaluated && d !== !0 ? t.assign((0, Hi._)`${d}[${v}]`, !0) : !g && !i.allErrors && t.if((0, Hi.not)(u), () => t.break());
        });
      });
    }
  }
};
Fu.default = PA;
var Lu = {};
Object.defineProperty(Lu, "__esModule", { value: !0 });
const AA = G, RA = {
  keyword: "not",
  schemaType: ["object", "boolean"],
  trackErrors: !0,
  code(e) {
    const { gen: t, schema: r, it: n } = e;
    if ((0, AA.alwaysValidSchema)(n, r)) {
      e.fail();
      return;
    }
    const s = t.name("valid");
    e.subschema({
      keyword: "not",
      compositeRule: !0,
      createErrors: !1,
      allErrors: !1
    }, s), e.failResult(s, () => e.reset(), () => e.error());
  },
  error: { message: "must NOT be valid" }
};
Lu.default = RA;
var ju = {};
Object.defineProperty(ju, "__esModule", { value: !0 });
const NA = de, CA = {
  keyword: "anyOf",
  schemaType: "array",
  trackErrors: !0,
  code: NA.validateUnion,
  error: { message: "must match a schema in anyOf" }
};
ju.default = CA;
var Mu = {};
Object.defineProperty(Mu, "__esModule", { value: !0 });
const ma = ce, OA = G, IA = {
  message: "must match exactly one schema in oneOf",
  params: ({ params: e }) => (0, ma._)`{passingSchemas: ${e.passing}}`
}, DA = {
  keyword: "oneOf",
  schemaType: "array",
  trackErrors: !0,
  error: IA,
  code(e) {
    const { gen: t, schema: r, parentSchema: n, it: s } = e;
    if (!Array.isArray(r))
      throw new Error("ajv implementation error");
    if (s.opts.discriminator && n.discriminator)
      return;
    const i = r, a = t.let("valid", !1), o = t.let("passing", null), l = t.name("_valid");
    e.setParams({ passing: o }), t.block(c), e.result(a, () => e.reset(), () => e.error(!0));
    function c() {
      i.forEach((u, d) => {
        let p;
        (0, OA.alwaysValidSchema)(s, u) ? t.var(l, !0) : p = e.subschema({
          keyword: "oneOf",
          schemaProp: d,
          compositeRule: !0
        }, l), d > 0 && t.if((0, ma._)`${l} && ${a}`).assign(a, !1).assign(o, (0, ma._)`[${o}, ${d}]`).else(), t.if(l, () => {
          t.assign(a, !0), t.assign(o, d), p && e.mergeEvaluated(p, ma.Name);
        });
      });
    }
  }
};
Mu.default = DA;
var xu = {};
Object.defineProperty(xu, "__esModule", { value: !0 });
const kA = G, UA = {
  keyword: "allOf",
  schemaType: "array",
  code(e) {
    const { gen: t, schema: r, it: n } = e;
    if (!Array.isArray(r))
      throw new Error("ajv implementation error");
    const s = t.name("valid");
    r.forEach((i, a) => {
      if ((0, kA.alwaysValidSchema)(n, i))
        return;
      const o = e.subschema({ keyword: "allOf", schemaProp: a }, s);
      e.ok(s), e.mergeEvaluated(o);
    });
  }
};
xu.default = UA;
var qu = {};
Object.defineProperty(qu, "__esModule", { value: !0 });
const Na = ce, yg = G, FA = {
  message: ({ params: e }) => (0, Na.str)`must match "${e.ifClause}" schema`,
  params: ({ params: e }) => (0, Na._)`{failingKeyword: ${e.ifClause}}`
}, LA = {
  keyword: "if",
  schemaType: ["object", "boolean"],
  trackErrors: !0,
  error: FA,
  code(e) {
    const { gen: t, parentSchema: r, it: n } = e;
    r.then === void 0 && r.else === void 0 && (0, yg.checkStrictMode)(n, '"if" without "then" and "else" is ignored');
    const s = Lf(n, "then"), i = Lf(n, "else");
    if (!s && !i)
      return;
    const a = t.let("valid", !0), o = t.name("_valid");
    if (l(), e.reset(), s && i) {
      const u = t.let("ifClause");
      e.setParams({ ifClause: u }), t.if(o, c("then", u), c("else", u));
    } else s ? t.if(o, c("then")) : t.if((0, Na.not)(o), c("else"));
    e.pass(a, () => e.error(!0));
    function l() {
      const u = e.subschema({
        keyword: "if",
        compositeRule: !0,
        createErrors: !1,
        allErrors: !1
      }, o);
      e.mergeEvaluated(u);
    }
    function c(u, d) {
      return () => {
        const p = e.subschema({ keyword: u }, o);
        t.assign(a, o), e.mergeValidEvaluated(p, a), d ? t.assign(d, (0, Na._)`${u}`) : e.setParams({ ifClause: u });
      };
    }
  }
};
function Lf(e, t) {
  const r = e.schema[t];
  return r !== void 0 && !(0, yg.alwaysValidSchema)(e, r);
}
qu.default = LA;
var Vu = {};
Object.defineProperty(Vu, "__esModule", { value: !0 });
const jA = G, MA = {
  keyword: ["then", "else"],
  schemaType: ["object", "boolean"],
  code({ keyword: e, parentSchema: t, it: r }) {
    t.if === void 0 && (0, jA.checkStrictMode)(r, `"${e}" without "if" is ignored`);
  }
};
Vu.default = MA;
Object.defineProperty(Cu, "__esModule", { value: !0 });
const xA = hs, qA = Ou, VA = ps, BA = Iu, HA = Du, zA = mg, GA = ku, KA = to, WA = Uu, YA = Fu, XA = Lu, JA = ju, QA = Mu, ZA = xu, eR = qu, tR = Vu;
function rR(e = !1) {
  const t = [
    // any
    XA.default,
    JA.default,
    QA.default,
    ZA.default,
    eR.default,
    tR.default,
    // object
    GA.default,
    KA.default,
    zA.default,
    WA.default,
    YA.default
  ];
  return e ? t.push(qA.default, BA.default) : t.push(xA.default, VA.default), t.push(HA.default), t;
}
Cu.default = rR;
var Bu = {}, Hu = {};
Object.defineProperty(Hu, "__esModule", { value: !0 });
const Ie = ce, nR = {
  message: ({ schemaCode: e }) => (0, Ie.str)`must match format "${e}"`,
  params: ({ schemaCode: e }) => (0, Ie._)`{format: ${e}}`
}, sR = {
  keyword: "format",
  type: ["number", "string"],
  schemaType: "string",
  $data: !0,
  error: nR,
  code(e, t) {
    const { gen: r, data: n, $data: s, schema: i, schemaCode: a, it: o } = e, { opts: l, errSchemaPath: c, schemaEnv: u, self: d } = o;
    if (!l.validateFormats)
      return;
    s ? p() : m();
    function p() {
      const _ = r.scopeValue("formats", {
        ref: d.formats,
        code: l.code.formats
      }), $ = r.const("fDef", (0, Ie._)`${_}[${a}]`), v = r.let("fType"), g = r.let("format");
      r.if((0, Ie._)`typeof ${$} == "object" && !(${$} instanceof RegExp)`, () => r.assign(v, (0, Ie._)`${$}.type || "string"`).assign(g, (0, Ie._)`${$}.validate`), () => r.assign(v, (0, Ie._)`"string"`).assign(g, $)), e.fail$data((0, Ie.or)(E(), N()));
      function E() {
        return l.strictSchema === !1 ? Ie.nil : (0, Ie._)`${a} && !${g}`;
      }
      function N() {
        const O = u.$async ? (0, Ie._)`(${$}.async ? await ${g}(${n}) : ${g}(${n}))` : (0, Ie._)`${g}(${n})`, U = (0, Ie._)`(typeof ${g} == "function" ? ${O} : ${g}.test(${n}))`;
        return (0, Ie._)`${g} && ${g} !== true && ${v} === ${t} && !${U}`;
      }
    }
    function m() {
      const _ = d.formats[i];
      if (!_) {
        E();
        return;
      }
      if (_ === !0)
        return;
      const [$, v, g] = N(_);
      $ === t && e.pass(O());
      function E() {
        if (l.strictSchema === !1) {
          d.logger.warn(U());
          return;
        }
        throw new Error(U());
        function U() {
          return `unknown format "${i}" ignored in schema at path "${c}"`;
        }
      }
      function N(U) {
        const q = U instanceof RegExp ? (0, Ie.regexpCode)(U) : l.code.formats ? (0, Ie._)`${l.code.formats}${(0, Ie.getProperty)(i)}` : void 0, B = r.scopeValue("formats", { key: i, ref: U, code: q });
        return typeof U == "object" && !(U instanceof RegExp) ? [U.type || "string", U.validate, (0, Ie._)`${B}.validate`] : ["string", U, B];
      }
      function O() {
        if (typeof _ == "object" && !(_ instanceof RegExp) && _.async) {
          if (!u.$async)
            throw new Error("async format in sync schema");
          return (0, Ie._)`await ${g}(${n})`;
        }
        return typeof v == "function" ? (0, Ie._)`${g}(${n})` : (0, Ie._)`${g}.test(${n})`;
      }
    }
  }
};
Hu.default = sR;
Object.defineProperty(Bu, "__esModule", { value: !0 });
const iR = Hu, aR = [iR.default];
Bu.default = aR;
var ss = {};
Object.defineProperty(ss, "__esModule", { value: !0 });
ss.contentVocabulary = ss.metadataVocabulary = void 0;
ss.metadataVocabulary = [
  "title",
  "description",
  "default",
  "deprecated",
  "readOnly",
  "writeOnly",
  "examples"
];
ss.contentVocabulary = [
  "contentMediaType",
  "contentEncoding",
  "contentSchema"
];
Object.defineProperty(mu, "__esModule", { value: !0 });
const oR = gu, lR = $u, cR = Cu, uR = Bu, jf = ss, dR = [
  oR.default,
  lR.default,
  (0, cR.default)(),
  uR.default,
  jf.metadataVocabulary,
  jf.contentVocabulary
];
mu.default = dR;
var zu = {}, ro = {};
Object.defineProperty(ro, "__esModule", { value: !0 });
ro.DiscrError = void 0;
var Mf;
(function(e) {
  e.Tag = "tag", e.Mapping = "mapping";
})(Mf || (ro.DiscrError = Mf = {}));
Object.defineProperty(zu, "__esModule", { value: !0 });
const qn = ce, Ll = ro, xf = $t, fR = fs, hR = G, pR = {
  message: ({ params: { discrError: e, tagName: t } }) => e === Ll.DiscrError.Tag ? `tag "${t}" must be string` : `value of tag "${t}" must be in oneOf`,
  params: ({ params: { discrError: e, tag: t, tagName: r } }) => (0, qn._)`{error: ${e}, tag: ${r}, tagValue: ${t}}`
}, mR = {
  keyword: "discriminator",
  type: "object",
  schemaType: "object",
  error: pR,
  code(e) {
    const { gen: t, data: r, schema: n, parentSchema: s, it: i } = e, { oneOf: a } = s;
    if (!i.opts.discriminator)
      throw new Error("discriminator: requires discriminator option");
    const o = n.propertyName;
    if (typeof o != "string")
      throw new Error("discriminator: requires propertyName");
    if (n.mapping)
      throw new Error("discriminator: mapping is not supported");
    if (!a)
      throw new Error("discriminator: requires oneOf keyword");
    const l = t.let("valid", !1), c = t.const("tag", (0, qn._)`${r}${(0, qn.getProperty)(o)}`);
    t.if((0, qn._)`typeof ${c} == "string"`, () => u(), () => e.error(!1, { discrError: Ll.DiscrError.Tag, tag: c, tagName: o })), e.ok(l);
    function u() {
      const m = p();
      t.if(!1);
      for (const _ in m)
        t.elseIf((0, qn._)`${c} === ${_}`), t.assign(l, d(m[_]));
      t.else(), e.error(!1, { discrError: Ll.DiscrError.Mapping, tag: c, tagName: o }), t.endIf();
    }
    function d(m) {
      const _ = t.name("valid"), $ = e.subschema({ keyword: "oneOf", schemaProp: m }, _);
      return e.mergeEvaluated($, qn.Name), _;
    }
    function p() {
      var m;
      const _ = {}, $ = g(s);
      let v = !0;
      for (let O = 0; O < a.length; O++) {
        let U = a[O];
        if (U != null && U.$ref && !(0, hR.schemaHasRulesButRef)(U, i.self.RULES)) {
          const B = U.$ref;
          if (U = xf.resolveRef.call(i.self, i.schemaEnv.root, i.baseId, B), U instanceof xf.SchemaEnv && (U = U.schema), U === void 0)
            throw new fR.default(i.opts.uriResolver, i.baseId, B);
        }
        const q = (m = U == null ? void 0 : U.properties) === null || m === void 0 ? void 0 : m[o];
        if (typeof q != "object")
          throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${o}"`);
        v = v && ($ || g(U)), E(q, O);
      }
      if (!v)
        throw new Error(`discriminator: "${o}" must be required`);
      return _;
      function g({ required: O }) {
        return Array.isArray(O) && O.includes(o);
      }
      function E(O, U) {
        if (O.const)
          N(O.const, U);
        else if (O.enum)
          for (const q of O.enum)
            N(q, U);
        else
          throw new Error(`discriminator: "properties/${o}" must have "const" or "enum"`);
      }
      function N(O, U) {
        if (typeof O != "string" || O in _)
          throw new Error(`discriminator: "${o}" values must be unique strings`);
        _[O] = U;
      }
    }
  }
};
zu.default = mR;
const gR = "http://json-schema.org/draft-07/schema#", yR = "http://json-schema.org/draft-07/schema#", $R = "Core schema meta-schema", _R = {
  schemaArray: {
    type: "array",
    minItems: 1,
    items: {
      $ref: "#"
    }
  },
  nonNegativeInteger: {
    type: "integer",
    minimum: 0
  },
  nonNegativeIntegerDefault0: {
    allOf: [
      {
        $ref: "#/definitions/nonNegativeInteger"
      },
      {
        default: 0
      }
    ]
  },
  simpleTypes: {
    enum: [
      "array",
      "boolean",
      "integer",
      "null",
      "number",
      "object",
      "string"
    ]
  },
  stringArray: {
    type: "array",
    items: {
      type: "string"
    },
    uniqueItems: !0,
    default: []
  }
}, vR = [
  "object",
  "boolean"
], wR = {
  $id: {
    type: "string",
    format: "uri-reference"
  },
  $schema: {
    type: "string",
    format: "uri"
  },
  $ref: {
    type: "string",
    format: "uri-reference"
  },
  $comment: {
    type: "string"
  },
  title: {
    type: "string"
  },
  description: {
    type: "string"
  },
  default: !0,
  readOnly: {
    type: "boolean",
    default: !1
  },
  examples: {
    type: "array",
    items: !0
  },
  multipleOf: {
    type: "number",
    exclusiveMinimum: 0
  },
  maximum: {
    type: "number"
  },
  exclusiveMaximum: {
    type: "number"
  },
  minimum: {
    type: "number"
  },
  exclusiveMinimum: {
    type: "number"
  },
  maxLength: {
    $ref: "#/definitions/nonNegativeInteger"
  },
  minLength: {
    $ref: "#/definitions/nonNegativeIntegerDefault0"
  },
  pattern: {
    type: "string",
    format: "regex"
  },
  additionalItems: {
    $ref: "#"
  },
  items: {
    anyOf: [
      {
        $ref: "#"
      },
      {
        $ref: "#/definitions/schemaArray"
      }
    ],
    default: !0
  },
  maxItems: {
    $ref: "#/definitions/nonNegativeInteger"
  },
  minItems: {
    $ref: "#/definitions/nonNegativeIntegerDefault0"
  },
  uniqueItems: {
    type: "boolean",
    default: !1
  },
  contains: {
    $ref: "#"
  },
  maxProperties: {
    $ref: "#/definitions/nonNegativeInteger"
  },
  minProperties: {
    $ref: "#/definitions/nonNegativeIntegerDefault0"
  },
  required: {
    $ref: "#/definitions/stringArray"
  },
  additionalProperties: {
    $ref: "#"
  },
  definitions: {
    type: "object",
    additionalProperties: {
      $ref: "#"
    },
    default: {}
  },
  properties: {
    type: "object",
    additionalProperties: {
      $ref: "#"
    },
    default: {}
  },
  patternProperties: {
    type: "object",
    additionalProperties: {
      $ref: "#"
    },
    propertyNames: {
      format: "regex"
    },
    default: {}
  },
  dependencies: {
    type: "object",
    additionalProperties: {
      anyOf: [
        {
          $ref: "#"
        },
        {
          $ref: "#/definitions/stringArray"
        }
      ]
    }
  },
  propertyNames: {
    $ref: "#"
  },
  const: !0,
  enum: {
    type: "array",
    items: !0,
    minItems: 1,
    uniqueItems: !0
  },
  type: {
    anyOf: [
      {
        $ref: "#/definitions/simpleTypes"
      },
      {
        type: "array",
        items: {
          $ref: "#/definitions/simpleTypes"
        },
        minItems: 1,
        uniqueItems: !0
      }
    ]
  },
  format: {
    type: "string"
  },
  contentMediaType: {
    type: "string"
  },
  contentEncoding: {
    type: "string"
  },
  if: {
    $ref: "#"
  },
  then: {
    $ref: "#"
  },
  else: {
    $ref: "#"
  },
  allOf: {
    $ref: "#/definitions/schemaArray"
  },
  anyOf: {
    $ref: "#/definitions/schemaArray"
  },
  oneOf: {
    $ref: "#/definitions/schemaArray"
  },
  not: {
    $ref: "#"
  }
}, ER = {
  $schema: gR,
  $id: yR,
  title: $R,
  definitions: _R,
  type: vR,
  properties: wR,
  default: !0
};
(function(e, t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.MissingRefError = t.ValidationError = t.CodeGen = t.Name = t.nil = t.stringify = t.str = t._ = t.KeywordCxt = t.Ajv = void 0;
  const r = Om, n = mu, s = zu, i = ER, a = ["/properties"], o = "http://json-schema.org/draft-07/schema";
  class l extends r.default {
    _addVocabularies() {
      super._addVocabularies(), n.default.forEach((_) => this.addVocabulary(_)), this.opts.discriminator && this.addKeyword(s.default);
    }
    _addDefaultMetaSchema() {
      if (super._addDefaultMetaSchema(), !this.opts.meta)
        return;
      const _ = this.opts.$data ? this.$dataMetaSchema(i, a) : i;
      this.addMetaSchema(_, o, !1), this.refs["http://json-schema.org/schema"] = o;
    }
    defaultMeta() {
      return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(o) ? o : void 0);
    }
  }
  t.Ajv = l, e.exports = t = l, e.exports.Ajv = l, Object.defineProperty(t, "__esModule", { value: !0 }), t.default = l;
  var c = zt;
  Object.defineProperty(t, "KeywordCxt", { enumerable: !0, get: function() {
    return c.KeywordCxt;
  } });
  var u = ce;
  Object.defineProperty(t, "_", { enumerable: !0, get: function() {
    return u._;
  } }), Object.defineProperty(t, "str", { enumerable: !0, get: function() {
    return u.str;
  } }), Object.defineProperty(t, "stringify", { enumerable: !0, get: function() {
    return u.stringify;
  } }), Object.defineProperty(t, "nil", { enumerable: !0, get: function() {
    return u.nil;
  } }), Object.defineProperty(t, "Name", { enumerable: !0, get: function() {
    return u.Name;
  } }), Object.defineProperty(t, "CodeGen", { enumerable: !0, get: function() {
    return u.CodeGen;
  } });
  var d = mi;
  Object.defineProperty(t, "ValidationError", { enumerable: !0, get: function() {
    return d.default;
  } });
  var p = fs;
  Object.defineProperty(t, "MissingRefError", { enumerable: !0, get: function() {
    return p.default;
  } });
})(Cl, Cl.exports);
var bR = Cl.exports;
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.formatLimitDefinition = void 0;
  const t = bR, r = ce, n = r.operators, s = {
    formatMaximum: { okStr: "<=", ok: n.LTE, fail: n.GT },
    formatMinimum: { okStr: ">=", ok: n.GTE, fail: n.LT },
    formatExclusiveMaximum: { okStr: "<", ok: n.LT, fail: n.GTE },
    formatExclusiveMinimum: { okStr: ">", ok: n.GT, fail: n.LTE }
  }, i = {
    message: ({ keyword: o, schemaCode: l }) => (0, r.str)`should be ${s[o].okStr} ${l}`,
    params: ({ keyword: o, schemaCode: l }) => (0, r._)`{comparison: ${s[o].okStr}, limit: ${l}}`
  };
  e.formatLimitDefinition = {
    keyword: Object.keys(s),
    type: "string",
    schemaType: "string",
    $data: !0,
    error: i,
    code(o) {
      const { gen: l, data: c, schemaCode: u, keyword: d, it: p } = o, { opts: m, self: _ } = p;
      if (!m.validateFormats)
        return;
      const $ = new t.KeywordCxt(p, _.RULES.all.format.definition, "format");
      $.$data ? v() : g();
      function v() {
        const N = l.scopeValue("formats", {
          ref: _.formats,
          code: m.code.formats
        }), O = l.const("fmt", (0, r._)`${N}[${$.schemaCode}]`);
        o.fail$data((0, r.or)((0, r._)`typeof ${O} != "object"`, (0, r._)`${O} instanceof RegExp`, (0, r._)`typeof ${O}.compare != "function"`, E(O)));
      }
      function g() {
        const N = $.schema, O = _.formats[N];
        if (!O || O === !0)
          return;
        if (typeof O != "object" || O instanceof RegExp || typeof O.compare != "function")
          throw new Error(`"${d}": format "${N}" does not define "compare" function`);
        const U = l.scopeValue("formats", {
          key: N,
          ref: O,
          code: m.code.formats ? (0, r._)`${m.code.formats}${(0, r.getProperty)(N)}` : void 0
        });
        o.fail$data(E(U));
      }
      function E(N) {
        return (0, r._)`${N}.compare(${c}, ${u}) ${s[d].fail} 0`;
      }
    },
    dependencies: ["format"]
  };
  const a = (o) => (o.addKeyword(e.formatLimitDefinition), o);
  e.default = a;
})(Cm);
(function(e, t) {
  Object.defineProperty(t, "__esModule", { value: !0 });
  const r = Nm, n = Cm, s = ce, i = new s.Name("fullFormats"), a = new s.Name("fastFormats"), o = (c, u = { keywords: !0 }) => {
    if (Array.isArray(u))
      return l(c, u, r.fullFormats, i), c;
    const [d, p] = u.mode === "fast" ? [r.fastFormats, a] : [r.fullFormats, i], m = u.formats || r.formatNames;
    return l(c, m, d, p), u.keywords && (0, n.default)(c), c;
  };
  o.get = (c, u = "full") => {
    const p = (u === "fast" ? r.fastFormats : r.fullFormats)[c];
    if (!p)
      throw new Error(`Unknown format "${c}"`);
    return p;
  };
  function l(c, u, d, p) {
    var m, _;
    (m = (_ = c.opts.code).formats) !== null && m !== void 0 || (_.formats = (0, s._)`require("ajv-formats/dist/formats").${p}`);
    for (const $ of u)
      c.addFormat($, d[$]);
  }
  e.exports = t = o, Object.defineProperty(t, "__esModule", { value: !0 }), t.default = o;
})(Nl, Nl.exports);
var SR = Nl.exports;
const TR = /* @__PURE__ */ Np(SR), PR = (e, t, r, n) => {
  if (r === "length" || r === "prototype" || r === "arguments" || r === "caller")
    return;
  const s = Object.getOwnPropertyDescriptor(e, r), i = Object.getOwnPropertyDescriptor(t, r);
  !AR(s, i) && n || Object.defineProperty(e, r, i);
}, AR = function(e, t) {
  return e === void 0 || e.configurable || e.writable === t.writable && e.enumerable === t.enumerable && e.configurable === t.configurable && (e.writable || e.value === t.value);
}, RR = (e, t) => {
  const r = Object.getPrototypeOf(t);
  r !== Object.getPrototypeOf(e) && Object.setPrototypeOf(e, r);
}, NR = (e, t) => `/* Wrapped ${e}*/
${t}`, CR = Object.getOwnPropertyDescriptor(Function.prototype, "toString"), OR = Object.getOwnPropertyDescriptor(Function.prototype.toString, "name"), IR = (e, t, r) => {
  const n = r === "" ? "" : `with ${r.trim()}() `, s = NR.bind(null, n, t.toString());
  Object.defineProperty(s, "name", OR);
  const { writable: i, enumerable: a, configurable: o } = CR;
  Object.defineProperty(e, "toString", { value: s, writable: i, enumerable: a, configurable: o });
};
function DR(e, t, { ignoreNonConfigurable: r = !1 } = {}) {
  const { name: n } = e;
  for (const s of Reflect.ownKeys(t))
    PR(e, t, s, r);
  return RR(e, t), IR(e, t, n), e;
}
const qf = (e, t = {}) => {
  if (typeof e != "function")
    throw new TypeError(`Expected the first argument to be a function, got \`${typeof e}\``);
  const {
    wait: r = 0,
    maxWait: n = Number.POSITIVE_INFINITY,
    before: s = !1,
    after: i = !0
  } = t;
  if (r < 0 || n < 0)
    throw new RangeError("`wait` and `maxWait` must not be negative.");
  if (!s && !i)
    throw new Error("Both `before` and `after` are false, function wouldn't be called.");
  let a, o, l;
  const c = function(...u) {
    const d = this, p = () => {
      a = void 0, o && (clearTimeout(o), o = void 0), i && (l = e.apply(d, u));
    }, m = () => {
      o = void 0, a && (clearTimeout(a), a = void 0), i && (l = e.apply(d, u));
    }, _ = s && !a;
    return clearTimeout(a), a = setTimeout(p, r), n > 0 && n !== Number.POSITIVE_INFINITY && !o && (o = setTimeout(m, n)), _ && (l = e.apply(d, u)), l;
  };
  return DR(c, e), c.cancel = () => {
    a && (clearTimeout(a), a = void 0), o && (clearTimeout(o), o = void 0);
  }, c;
};
var jl = { exports: {} };
const kR = "2.0.0", $g = 256, UR = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
9007199254740991, FR = 16, LR = $g - 6, jR = [
  "major",
  "premajor",
  "minor",
  "preminor",
  "patch",
  "prepatch",
  "prerelease"
];
var no = {
  MAX_LENGTH: $g,
  MAX_SAFE_COMPONENT_LENGTH: FR,
  MAX_SAFE_BUILD_LENGTH: LR,
  MAX_SAFE_INTEGER: UR,
  RELEASE_TYPES: jR,
  SEMVER_SPEC_VERSION: kR,
  FLAG_INCLUDE_PRERELEASE: 1,
  FLAG_LOOSE: 2
};
const MR = typeof process == "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...e) => console.error("SEMVER", ...e) : () => {
};
var so = MR;
(function(e, t) {
  const {
    MAX_SAFE_COMPONENT_LENGTH: r,
    MAX_SAFE_BUILD_LENGTH: n,
    MAX_LENGTH: s
  } = no, i = so;
  t = e.exports = {};
  const a = t.re = [], o = t.safeRe = [], l = t.src = [], c = t.safeSrc = [], u = t.t = {};
  let d = 0;
  const p = "[a-zA-Z0-9-]", m = [
    ["\\s", 1],
    ["\\d", s],
    [p, n]
  ], _ = (v) => {
    for (const [g, E] of m)
      v = v.split(`${g}*`).join(`${g}{0,${E}}`).split(`${g}+`).join(`${g}{1,${E}}`);
    return v;
  }, $ = (v, g, E) => {
    const N = _(g), O = d++;
    i(v, O, g), u[v] = O, l[O] = g, c[O] = N, a[O] = new RegExp(g, E ? "g" : void 0), o[O] = new RegExp(N, E ? "g" : void 0);
  };
  $("NUMERICIDENTIFIER", "0|[1-9]\\d*"), $("NUMERICIDENTIFIERLOOSE", "\\d+"), $("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${p}*`), $("MAINVERSION", `(${l[u.NUMERICIDENTIFIER]})\\.(${l[u.NUMERICIDENTIFIER]})\\.(${l[u.NUMERICIDENTIFIER]})`), $("MAINVERSIONLOOSE", `(${l[u.NUMERICIDENTIFIERLOOSE]})\\.(${l[u.NUMERICIDENTIFIERLOOSE]})\\.(${l[u.NUMERICIDENTIFIERLOOSE]})`), $("PRERELEASEIDENTIFIER", `(?:${l[u.NONNUMERICIDENTIFIER]}|${l[u.NUMERICIDENTIFIER]})`), $("PRERELEASEIDENTIFIERLOOSE", `(?:${l[u.NONNUMERICIDENTIFIER]}|${l[u.NUMERICIDENTIFIERLOOSE]})`), $("PRERELEASE", `(?:-(${l[u.PRERELEASEIDENTIFIER]}(?:\\.${l[u.PRERELEASEIDENTIFIER]})*))`), $("PRERELEASELOOSE", `(?:-?(${l[u.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${l[u.PRERELEASEIDENTIFIERLOOSE]})*))`), $("BUILDIDENTIFIER", `${p}+`), $("BUILD", `(?:\\+(${l[u.BUILDIDENTIFIER]}(?:\\.${l[u.BUILDIDENTIFIER]})*))`), $("FULLPLAIN", `v?${l[u.MAINVERSION]}${l[u.PRERELEASE]}?${l[u.BUILD]}?`), $("FULL", `^${l[u.FULLPLAIN]}$`), $("LOOSEPLAIN", `[v=\\s]*${l[u.MAINVERSIONLOOSE]}${l[u.PRERELEASELOOSE]}?${l[u.BUILD]}?`), $("LOOSE", `^${l[u.LOOSEPLAIN]}$`), $("GTLT", "((?:<|>)?=?)"), $("XRANGEIDENTIFIERLOOSE", `${l[u.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`), $("XRANGEIDENTIFIER", `${l[u.NUMERICIDENTIFIER]}|x|X|\\*`), $("XRANGEPLAIN", `[v=\\s]*(${l[u.XRANGEIDENTIFIER]})(?:\\.(${l[u.XRANGEIDENTIFIER]})(?:\\.(${l[u.XRANGEIDENTIFIER]})(?:${l[u.PRERELEASE]})?${l[u.BUILD]}?)?)?`), $("XRANGEPLAINLOOSE", `[v=\\s]*(${l[u.XRANGEIDENTIFIERLOOSE]})(?:\\.(${l[u.XRANGEIDENTIFIERLOOSE]})(?:\\.(${l[u.XRANGEIDENTIFIERLOOSE]})(?:${l[u.PRERELEASELOOSE]})?${l[u.BUILD]}?)?)?`), $("XRANGE", `^${l[u.GTLT]}\\s*${l[u.XRANGEPLAIN]}$`), $("XRANGELOOSE", `^${l[u.GTLT]}\\s*${l[u.XRANGEPLAINLOOSE]}$`), $("COERCEPLAIN", `(^|[^\\d])(\\d{1,${r}})(?:\\.(\\d{1,${r}}))?(?:\\.(\\d{1,${r}}))?`), $("COERCE", `${l[u.COERCEPLAIN]}(?:$|[^\\d])`), $("COERCEFULL", l[u.COERCEPLAIN] + `(?:${l[u.PRERELEASE]})?(?:${l[u.BUILD]})?(?:$|[^\\d])`), $("COERCERTL", l[u.COERCE], !0), $("COERCERTLFULL", l[u.COERCEFULL], !0), $("LONETILDE", "(?:~>?)"), $("TILDETRIM", `(\\s*)${l[u.LONETILDE]}\\s+`, !0), t.tildeTrimReplace = "$1~", $("TILDE", `^${l[u.LONETILDE]}${l[u.XRANGEPLAIN]}$`), $("TILDELOOSE", `^${l[u.LONETILDE]}${l[u.XRANGEPLAINLOOSE]}$`), $("LONECARET", "(?:\\^)"), $("CARETTRIM", `(\\s*)${l[u.LONECARET]}\\s+`, !0), t.caretTrimReplace = "$1^", $("CARET", `^${l[u.LONECARET]}${l[u.XRANGEPLAIN]}$`), $("CARETLOOSE", `^${l[u.LONECARET]}${l[u.XRANGEPLAINLOOSE]}$`), $("COMPARATORLOOSE", `^${l[u.GTLT]}\\s*(${l[u.LOOSEPLAIN]})$|^$`), $("COMPARATOR", `^${l[u.GTLT]}\\s*(${l[u.FULLPLAIN]})$|^$`), $("COMPARATORTRIM", `(\\s*)${l[u.GTLT]}\\s*(${l[u.LOOSEPLAIN]}|${l[u.XRANGEPLAIN]})`, !0), t.comparatorTrimReplace = "$1$2$3", $("HYPHENRANGE", `^\\s*(${l[u.XRANGEPLAIN]})\\s+-\\s+(${l[u.XRANGEPLAIN]})\\s*$`), $("HYPHENRANGELOOSE", `^\\s*(${l[u.XRANGEPLAINLOOSE]})\\s+-\\s+(${l[u.XRANGEPLAINLOOSE]})\\s*$`), $("STAR", "(<|>)?=?\\s*\\*"), $("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$"), $("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
})(jl, jl.exports);
var yi = jl.exports;
const xR = Object.freeze({ loose: !0 }), qR = Object.freeze({}), VR = (e) => e ? typeof e != "object" ? xR : e : qR;
var Gu = VR;
const Vf = /^[0-9]+$/, _g = (e, t) => {
  if (typeof e == "number" && typeof t == "number")
    return e === t ? 0 : e < t ? -1 : 1;
  const r = Vf.test(e), n = Vf.test(t);
  return r && n && (e = +e, t = +t), e === t ? 0 : r && !n ? -1 : n && !r ? 1 : e < t ? -1 : 1;
}, BR = (e, t) => _g(t, e);
var vg = {
  compareIdentifiers: _g,
  rcompareIdentifiers: BR
};
const zi = so, { MAX_LENGTH: Bf, MAX_SAFE_INTEGER: Gi } = no, { safeRe: Ki, t: Wi } = yi, HR = Gu, { compareIdentifiers: Vo } = vg;
let zR = class Jt {
  constructor(t, r) {
    if (r = HR(r), t instanceof Jt) {
      if (t.loose === !!r.loose && t.includePrerelease === !!r.includePrerelease)
        return t;
      t = t.version;
    } else if (typeof t != "string")
      throw new TypeError(`Invalid version. Must be a string. Got type "${typeof t}".`);
    if (t.length > Bf)
      throw new TypeError(
        `version is longer than ${Bf} characters`
      );
    zi("SemVer", t, r), this.options = r, this.loose = !!r.loose, this.includePrerelease = !!r.includePrerelease;
    const n = t.trim().match(r.loose ? Ki[Wi.LOOSE] : Ki[Wi.FULL]);
    if (!n)
      throw new TypeError(`Invalid Version: ${t}`);
    if (this.raw = t, this.major = +n[1], this.minor = +n[2], this.patch = +n[3], this.major > Gi || this.major < 0)
      throw new TypeError("Invalid major version");
    if (this.minor > Gi || this.minor < 0)
      throw new TypeError("Invalid minor version");
    if (this.patch > Gi || this.patch < 0)
      throw new TypeError("Invalid patch version");
    n[4] ? this.prerelease = n[4].split(".").map((s) => {
      if (/^[0-9]+$/.test(s)) {
        const i = +s;
        if (i >= 0 && i < Gi)
          return i;
      }
      return s;
    }) : this.prerelease = [], this.build = n[5] ? n[5].split(".") : [], this.format();
  }
  format() {
    return this.version = `${this.major}.${this.minor}.${this.patch}`, this.prerelease.length && (this.version += `-${this.prerelease.join(".")}`), this.version;
  }
  toString() {
    return this.version;
  }
  compare(t) {
    if (zi("SemVer.compare", this.version, this.options, t), !(t instanceof Jt)) {
      if (typeof t == "string" && t === this.version)
        return 0;
      t = new Jt(t, this.options);
    }
    return t.version === this.version ? 0 : this.compareMain(t) || this.comparePre(t);
  }
  compareMain(t) {
    return t instanceof Jt || (t = new Jt(t, this.options)), this.major < t.major ? -1 : this.major > t.major ? 1 : this.minor < t.minor ? -1 : this.minor > t.minor ? 1 : this.patch < t.patch ? -1 : this.patch > t.patch ? 1 : 0;
  }
  comparePre(t) {
    if (t instanceof Jt || (t = new Jt(t, this.options)), this.prerelease.length && !t.prerelease.length)
      return -1;
    if (!this.prerelease.length && t.prerelease.length)
      return 1;
    if (!this.prerelease.length && !t.prerelease.length)
      return 0;
    let r = 0;
    do {
      const n = this.prerelease[r], s = t.prerelease[r];
      if (zi("prerelease compare", r, n, s), n === void 0 && s === void 0)
        return 0;
      if (s === void 0)
        return 1;
      if (n === void 0)
        return -1;
      if (n === s)
        continue;
      return Vo(n, s);
    } while (++r);
  }
  compareBuild(t) {
    t instanceof Jt || (t = new Jt(t, this.options));
    let r = 0;
    do {
      const n = this.build[r], s = t.build[r];
      if (zi("build compare", r, n, s), n === void 0 && s === void 0)
        return 0;
      if (s === void 0)
        return 1;
      if (n === void 0)
        return -1;
      if (n === s)
        continue;
      return Vo(n, s);
    } while (++r);
  }
  // preminor will bump the version up to the next minor release, and immediately
  // down to pre-release. premajor and prepatch work the same way.
  inc(t, r, n) {
    if (t.startsWith("pre")) {
      if (!r && n === !1)
        throw new Error("invalid increment argument: identifier is empty");
      if (r) {
        const s = `-${r}`.match(this.options.loose ? Ki[Wi.PRERELEASELOOSE] : Ki[Wi.PRERELEASE]);
        if (!s || s[1] !== r)
          throw new Error(`invalid identifier: ${r}`);
      }
    }
    switch (t) {
      case "premajor":
        this.prerelease.length = 0, this.patch = 0, this.minor = 0, this.major++, this.inc("pre", r, n);
        break;
      case "preminor":
        this.prerelease.length = 0, this.patch = 0, this.minor++, this.inc("pre", r, n);
        break;
      case "prepatch":
        this.prerelease.length = 0, this.inc("patch", r, n), this.inc("pre", r, n);
        break;
      case "prerelease":
        this.prerelease.length === 0 && this.inc("patch", r, n), this.inc("pre", r, n);
        break;
      case "release":
        if (this.prerelease.length === 0)
          throw new Error(`version ${this.raw} is not a prerelease`);
        this.prerelease.length = 0;
        break;
      case "major":
        (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) && this.major++, this.minor = 0, this.patch = 0, this.prerelease = [];
        break;
      case "minor":
        (this.patch !== 0 || this.prerelease.length === 0) && this.minor++, this.patch = 0, this.prerelease = [];
        break;
      case "patch":
        this.prerelease.length === 0 && this.patch++, this.prerelease = [];
        break;
      case "pre": {
        const s = Number(n) ? 1 : 0;
        if (this.prerelease.length === 0)
          this.prerelease = [s];
        else {
          let i = this.prerelease.length;
          for (; --i >= 0; )
            typeof this.prerelease[i] == "number" && (this.prerelease[i]++, i = -2);
          if (i === -1) {
            if (r === this.prerelease.join(".") && n === !1)
              throw new Error("invalid increment argument: identifier already exists");
            this.prerelease.push(s);
          }
        }
        if (r) {
          let i = [r, s];
          n === !1 && (i = [r]), Vo(this.prerelease[0], r) === 0 ? isNaN(this.prerelease[1]) && (this.prerelease = i) : this.prerelease = i;
        }
        break;
      }
      default:
        throw new Error(`invalid increment argument: ${t}`);
    }
    return this.raw = this.format(), this.build.length && (this.raw += `+${this.build.join(".")}`), this;
  }
};
var ht = zR;
const Hf = ht, GR = (e, t, r = !1) => {
  if (e instanceof Hf)
    return e;
  try {
    return new Hf(e, t);
  } catch (n) {
    if (!r)
      return null;
    throw n;
  }
};
var ms = GR;
const KR = ms, WR = (e, t) => {
  const r = KR(e, t);
  return r ? r.version : null;
};
var YR = WR;
const XR = ms, JR = (e, t) => {
  const r = XR(e.trim().replace(/^[=v]+/, ""), t);
  return r ? r.version : null;
};
var QR = JR;
const zf = ht, ZR = (e, t, r, n, s) => {
  typeof r == "string" && (s = n, n = r, r = void 0);
  try {
    return new zf(
      e instanceof zf ? e.version : e,
      r
    ).inc(t, n, s).version;
  } catch {
    return null;
  }
};
var eN = ZR;
const Gf = ms, tN = (e, t) => {
  const r = Gf(e, null, !0), n = Gf(t, null, !0), s = r.compare(n);
  if (s === 0)
    return null;
  const i = s > 0, a = i ? r : n, o = i ? n : r, l = !!a.prerelease.length;
  if (!!o.prerelease.length && !l) {
    if (!o.patch && !o.minor)
      return "major";
    if (o.compareMain(a) === 0)
      return o.minor && !o.patch ? "minor" : "patch";
  }
  const u = l ? "pre" : "";
  return r.major !== n.major ? u + "major" : r.minor !== n.minor ? u + "minor" : r.patch !== n.patch ? u + "patch" : "prerelease";
};
var rN = tN;
const nN = ht, sN = (e, t) => new nN(e, t).major;
var iN = sN;
const aN = ht, oN = (e, t) => new aN(e, t).minor;
var lN = oN;
const cN = ht, uN = (e, t) => new cN(e, t).patch;
var dN = uN;
const fN = ms, hN = (e, t) => {
  const r = fN(e, t);
  return r && r.prerelease.length ? r.prerelease : null;
};
var pN = hN;
const Kf = ht, mN = (e, t, r) => new Kf(e, r).compare(new Kf(t, r));
var Kt = mN;
const gN = Kt, yN = (e, t, r) => gN(t, e, r);
var $N = yN;
const _N = Kt, vN = (e, t) => _N(e, t, !0);
var wN = vN;
const Wf = ht, EN = (e, t, r) => {
  const n = new Wf(e, r), s = new Wf(t, r);
  return n.compare(s) || n.compareBuild(s);
};
var Ku = EN;
const bN = Ku, SN = (e, t) => e.sort((r, n) => bN(r, n, t));
var TN = SN;
const PN = Ku, AN = (e, t) => e.sort((r, n) => PN(n, r, t));
var RN = AN;
const NN = Kt, CN = (e, t, r) => NN(e, t, r) > 0;
var io = CN;
const ON = Kt, IN = (e, t, r) => ON(e, t, r) < 0;
var Wu = IN;
const DN = Kt, kN = (e, t, r) => DN(e, t, r) === 0;
var wg = kN;
const UN = Kt, FN = (e, t, r) => UN(e, t, r) !== 0;
var Eg = FN;
const LN = Kt, jN = (e, t, r) => LN(e, t, r) >= 0;
var Yu = jN;
const MN = Kt, xN = (e, t, r) => MN(e, t, r) <= 0;
var Xu = xN;
const qN = wg, VN = Eg, BN = io, HN = Yu, zN = Wu, GN = Xu, KN = (e, t, r, n) => {
  switch (t) {
    case "===":
      return typeof e == "object" && (e = e.version), typeof r == "object" && (r = r.version), e === r;
    case "!==":
      return typeof e == "object" && (e = e.version), typeof r == "object" && (r = r.version), e !== r;
    case "":
    case "=":
    case "==":
      return qN(e, r, n);
    case "!=":
      return VN(e, r, n);
    case ">":
      return BN(e, r, n);
    case ">=":
      return HN(e, r, n);
    case "<":
      return zN(e, r, n);
    case "<=":
      return GN(e, r, n);
    default:
      throw new TypeError(`Invalid operator: ${t}`);
  }
};
var bg = KN;
const WN = ht, YN = ms, { safeRe: Yi, t: Xi } = yi, XN = (e, t) => {
  if (e instanceof WN)
    return e;
  if (typeof e == "number" && (e = String(e)), typeof e != "string")
    return null;
  t = t || {};
  let r = null;
  if (!t.rtl)
    r = e.match(t.includePrerelease ? Yi[Xi.COERCEFULL] : Yi[Xi.COERCE]);
  else {
    const l = t.includePrerelease ? Yi[Xi.COERCERTLFULL] : Yi[Xi.COERCERTL];
    let c;
    for (; (c = l.exec(e)) && (!r || r.index + r[0].length !== e.length); )
      (!r || c.index + c[0].length !== r.index + r[0].length) && (r = c), l.lastIndex = c.index + c[1].length + c[2].length;
    l.lastIndex = -1;
  }
  if (r === null)
    return null;
  const n = r[2], s = r[3] || "0", i = r[4] || "0", a = t.includePrerelease && r[5] ? `-${r[5]}` : "", o = t.includePrerelease && r[6] ? `+${r[6]}` : "";
  return YN(`${n}.${s}.${i}${a}${o}`, t);
};
var JN = XN;
class QN {
  constructor() {
    this.max = 1e3, this.map = /* @__PURE__ */ new Map();
  }
  get(t) {
    const r = this.map.get(t);
    if (r !== void 0)
      return this.map.delete(t), this.map.set(t, r), r;
  }
  delete(t) {
    return this.map.delete(t);
  }
  set(t, r) {
    if (!this.delete(t) && r !== void 0) {
      if (this.map.size >= this.max) {
        const s = this.map.keys().next().value;
        this.delete(s);
      }
      this.map.set(t, r);
    }
    return this;
  }
}
var ZN = QN, Bo, Yf;
function Wt() {
  if (Yf) return Bo;
  Yf = 1;
  const e = /\s+/g;
  class t {
    constructor(L, K) {
      if (K = s(K), L instanceof t)
        return L.loose === !!K.loose && L.includePrerelease === !!K.includePrerelease ? L : new t(L.raw, K);
      if (L instanceof i)
        return this.raw = L.value, this.set = [[L]], this.formatted = void 0, this;
      if (this.options = K, this.loose = !!K.loose, this.includePrerelease = !!K.includePrerelease, this.raw = L.trim().replace(e, " "), this.set = this.raw.split("||").map((M) => this.parseRange(M.trim())).filter((M) => M.length), !this.set.length)
        throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
      if (this.set.length > 1) {
        const M = this.set[0];
        if (this.set = this.set.filter((X) => !$(X[0])), this.set.length === 0)
          this.set = [M];
        else if (this.set.length > 1) {
          for (const X of this.set)
            if (X.length === 1 && v(X[0])) {
              this.set = [X];
              break;
            }
        }
      }
      this.formatted = void 0;
    }
    get range() {
      if (this.formatted === void 0) {
        this.formatted = "";
        for (let L = 0; L < this.set.length; L++) {
          L > 0 && (this.formatted += "||");
          const K = this.set[L];
          for (let M = 0; M < K.length; M++)
            M > 0 && (this.formatted += " "), this.formatted += K[M].toString().trim();
        }
      }
      return this.formatted;
    }
    format() {
      return this.range;
    }
    toString() {
      return this.range;
    }
    parseRange(L) {
      const M = ((this.options.includePrerelease && m) | (this.options.loose && _)) + ":" + L, X = n.get(M);
      if (X)
        return X;
      const H = this.options.loose, C = H ? l[c.HYPHENRANGELOOSE] : l[c.HYPHENRANGE];
      L = L.replace(C, x(this.options.includePrerelease)), a("hyphen replace", L), L = L.replace(l[c.COMPARATORTRIM], u), a("comparator trim", L), L = L.replace(l[c.TILDETRIM], d), a("tilde trim", L), L = L.replace(l[c.CARETTRIM], p), a("caret trim", L);
      let b = L.split(" ").map((y) => E(y, this.options)).join(" ").split(/\s+/).map((y) => W(y, this.options));
      H && (b = b.filter((y) => (a("loose invalid filter", y, this.options), !!y.match(l[c.COMPARATORLOOSE])))), a("range list", b);
      const A = /* @__PURE__ */ new Map(), S = b.map((y) => new i(y, this.options));
      for (const y of S) {
        if ($(y))
          return [y];
        A.set(y.value, y);
      }
      A.size > 1 && A.has("") && A.delete("");
      const f = [...A.values()];
      return n.set(M, f), f;
    }
    intersects(L, K) {
      if (!(L instanceof t))
        throw new TypeError("a Range is required");
      return this.set.some((M) => g(M, K) && L.set.some((X) => g(X, K) && M.every((H) => X.every((C) => H.intersects(C, K)))));
    }
    // if ANY of the sets match ALL of its comparators, then pass
    test(L) {
      if (!L)
        return !1;
      if (typeof L == "string")
        try {
          L = new o(L, this.options);
        } catch {
          return !1;
        }
      for (let K = 0; K < this.set.length; K++)
        if (se(this.set[K], L, this.options))
          return !0;
      return !1;
    }
  }
  Bo = t;
  const r = ZN, n = new r(), s = Gu, i = ao(), a = so, o = ht, {
    safeRe: l,
    t: c,
    comparatorTrimReplace: u,
    tildeTrimReplace: d,
    caretTrimReplace: p
  } = yi, { FLAG_INCLUDE_PRERELEASE: m, FLAG_LOOSE: _ } = no, $ = (F) => F.value === "<0.0.0-0", v = (F) => F.value === "", g = (F, L) => {
    let K = !0;
    const M = F.slice();
    let X = M.pop();
    for (; K && M.length; )
      K = M.every((H) => X.intersects(H, L)), X = M.pop();
    return K;
  }, E = (F, L) => (F = F.replace(l[c.BUILD], ""), a("comp", F, L), F = q(F, L), a("caret", F), F = O(F, L), a("tildes", F), F = me(F, L), a("xrange", F), F = ye(F, L), a("stars", F), F), N = (F) => !F || F.toLowerCase() === "x" || F === "*", O = (F, L) => F.trim().split(/\s+/).map((K) => U(K, L)).join(" "), U = (F, L) => {
    const K = L.loose ? l[c.TILDELOOSE] : l[c.TILDE];
    return F.replace(K, (M, X, H, C, b) => {
      a("tilde", F, M, X, H, C, b);
      let A;
      return N(X) ? A = "" : N(H) ? A = `>=${X}.0.0 <${+X + 1}.0.0-0` : N(C) ? A = `>=${X}.${H}.0 <${X}.${+H + 1}.0-0` : b ? (a("replaceTilde pr", b), A = `>=${X}.${H}.${C}-${b} <${X}.${+H + 1}.0-0`) : A = `>=${X}.${H}.${C} <${X}.${+H + 1}.0-0`, a("tilde return", A), A;
    });
  }, q = (F, L) => F.trim().split(/\s+/).map((K) => B(K, L)).join(" "), B = (F, L) => {
    a("caret", F, L);
    const K = L.loose ? l[c.CARETLOOSE] : l[c.CARET], M = L.includePrerelease ? "-0" : "";
    return F.replace(K, (X, H, C, b, A) => {
      a("caret", F, X, H, C, b, A);
      let S;
      return N(H) ? S = "" : N(C) ? S = `>=${H}.0.0${M} <${+H + 1}.0.0-0` : N(b) ? H === "0" ? S = `>=${H}.${C}.0${M} <${H}.${+C + 1}.0-0` : S = `>=${H}.${C}.0${M} <${+H + 1}.0.0-0` : A ? (a("replaceCaret pr", A), H === "0" ? C === "0" ? S = `>=${H}.${C}.${b}-${A} <${H}.${C}.${+b + 1}-0` : S = `>=${H}.${C}.${b}-${A} <${H}.${+C + 1}.0-0` : S = `>=${H}.${C}.${b}-${A} <${+H + 1}.0.0-0`) : (a("no pr"), H === "0" ? C === "0" ? S = `>=${H}.${C}.${b}${M} <${H}.${C}.${+b + 1}-0` : S = `>=${H}.${C}.${b}${M} <${H}.${+C + 1}.0-0` : S = `>=${H}.${C}.${b} <${+H + 1}.0.0-0`), a("caret return", S), S;
    });
  }, me = (F, L) => (a("replaceXRanges", F, L), F.split(/\s+/).map((K) => I(K, L)).join(" ")), I = (F, L) => {
    F = F.trim();
    const K = L.loose ? l[c.XRANGELOOSE] : l[c.XRANGE];
    return F.replace(K, (M, X, H, C, b, A) => {
      a("xRange", F, M, X, H, C, b, A);
      const S = N(H), f = S || N(C), y = f || N(b), P = y;
      return X === "=" && P && (X = ""), A = L.includePrerelease ? "-0" : "", S ? X === ">" || X === "<" ? M = "<0.0.0-0" : M = "*" : X && P ? (f && (C = 0), b = 0, X === ">" ? (X = ">=", f ? (H = +H + 1, C = 0, b = 0) : (C = +C + 1, b = 0)) : X === "<=" && (X = "<", f ? H = +H + 1 : C = +C + 1), X === "<" && (A = "-0"), M = `${X + H}.${C}.${b}${A}`) : f ? M = `>=${H}.0.0${A} <${+H + 1}.0.0-0` : y && (M = `>=${H}.${C}.0${A} <${H}.${+C + 1}.0-0`), a("xRange return", M), M;
    });
  }, ye = (F, L) => (a("replaceStars", F, L), F.trim().replace(l[c.STAR], "")), W = (F, L) => (a("replaceGTE0", F, L), F.trim().replace(l[L.includePrerelease ? c.GTE0PRE : c.GTE0], "")), x = (F) => (L, K, M, X, H, C, b, A, S, f, y, P) => (N(M) ? K = "" : N(X) ? K = `>=${M}.0.0${F ? "-0" : ""}` : N(H) ? K = `>=${M}.${X}.0${F ? "-0" : ""}` : C ? K = `>=${K}` : K = `>=${K}${F ? "-0" : ""}`, N(S) ? A = "" : N(f) ? A = `<${+S + 1}.0.0-0` : N(y) ? A = `<${S}.${+f + 1}.0-0` : P ? A = `<=${S}.${f}.${y}-${P}` : F ? A = `<${S}.${f}.${+y + 1}-0` : A = `<=${A}`, `${K} ${A}`.trim()), se = (F, L, K) => {
    for (let M = 0; M < F.length; M++)
      if (!F[M].test(L))
        return !1;
    if (L.prerelease.length && !K.includePrerelease) {
      for (let M = 0; M < F.length; M++)
        if (a(F[M].semver), F[M].semver !== i.ANY && F[M].semver.prerelease.length > 0) {
          const X = F[M].semver;
          if (X.major === L.major && X.minor === L.minor && X.patch === L.patch)
            return !0;
        }
      return !1;
    }
    return !0;
  };
  return Bo;
}
var Ho, Xf;
function ao() {
  if (Xf) return Ho;
  Xf = 1;
  const e = Symbol("SemVer ANY");
  class t {
    static get ANY() {
      return e;
    }
    constructor(u, d) {
      if (d = r(d), u instanceof t) {
        if (u.loose === !!d.loose)
          return u;
        u = u.value;
      }
      u = u.trim().split(/\s+/).join(" "), a("comparator", u, d), this.options = d, this.loose = !!d.loose, this.parse(u), this.semver === e ? this.value = "" : this.value = this.operator + this.semver.version, a("comp", this);
    }
    parse(u) {
      const d = this.options.loose ? n[s.COMPARATORLOOSE] : n[s.COMPARATOR], p = u.match(d);
      if (!p)
        throw new TypeError(`Invalid comparator: ${u}`);
      this.operator = p[1] !== void 0 ? p[1] : "", this.operator === "=" && (this.operator = ""), p[2] ? this.semver = new o(p[2], this.options.loose) : this.semver = e;
    }
    toString() {
      return this.value;
    }
    test(u) {
      if (a("Comparator.test", u, this.options.loose), this.semver === e || u === e)
        return !0;
      if (typeof u == "string")
        try {
          u = new o(u, this.options);
        } catch {
          return !1;
        }
      return i(u, this.operator, this.semver, this.options);
    }
    intersects(u, d) {
      if (!(u instanceof t))
        throw new TypeError("a Comparator is required");
      return this.operator === "" ? this.value === "" ? !0 : new l(u.value, d).test(this.value) : u.operator === "" ? u.value === "" ? !0 : new l(this.value, d).test(u.semver) : (d = r(d), d.includePrerelease && (this.value === "<0.0.0-0" || u.value === "<0.0.0-0") || !d.includePrerelease && (this.value.startsWith("<0.0.0") || u.value.startsWith("<0.0.0")) ? !1 : !!(this.operator.startsWith(">") && u.operator.startsWith(">") || this.operator.startsWith("<") && u.operator.startsWith("<") || this.semver.version === u.semver.version && this.operator.includes("=") && u.operator.includes("=") || i(this.semver, "<", u.semver, d) && this.operator.startsWith(">") && u.operator.startsWith("<") || i(this.semver, ">", u.semver, d) && this.operator.startsWith("<") && u.operator.startsWith(">")));
    }
  }
  Ho = t;
  const r = Gu, { safeRe: n, t: s } = yi, i = bg, a = so, o = ht, l = Wt();
  return Ho;
}
const eC = Wt(), tC = (e, t, r) => {
  try {
    t = new eC(t, r);
  } catch {
    return !1;
  }
  return t.test(e);
};
var oo = tC;
const rC = Wt(), nC = (e, t) => new rC(e, t).set.map((r) => r.map((n) => n.value).join(" ").trim().split(" "));
var sC = nC;
const iC = ht, aC = Wt(), oC = (e, t, r) => {
  let n = null, s = null, i = null;
  try {
    i = new aC(t, r);
  } catch {
    return null;
  }
  return e.forEach((a) => {
    i.test(a) && (!n || s.compare(a) === -1) && (n = a, s = new iC(n, r));
  }), n;
};
var lC = oC;
const cC = ht, uC = Wt(), dC = (e, t, r) => {
  let n = null, s = null, i = null;
  try {
    i = new uC(t, r);
  } catch {
    return null;
  }
  return e.forEach((a) => {
    i.test(a) && (!n || s.compare(a) === 1) && (n = a, s = new cC(n, r));
  }), n;
};
var fC = dC;
const zo = ht, hC = Wt(), Jf = io, pC = (e, t) => {
  e = new hC(e, t);
  let r = new zo("0.0.0");
  if (e.test(r) || (r = new zo("0.0.0-0"), e.test(r)))
    return r;
  r = null;
  for (let n = 0; n < e.set.length; ++n) {
    const s = e.set[n];
    let i = null;
    s.forEach((a) => {
      const o = new zo(a.semver.version);
      switch (a.operator) {
        case ">":
          o.prerelease.length === 0 ? o.patch++ : o.prerelease.push(0), o.raw = o.format();
        case "":
        case ">=":
          (!i || Jf(o, i)) && (i = o);
          break;
        case "<":
        case "<=":
          break;
        default:
          throw new Error(`Unexpected operation: ${a.operator}`);
      }
    }), i && (!r || Jf(r, i)) && (r = i);
  }
  return r && e.test(r) ? r : null;
};
var mC = pC;
const gC = Wt(), yC = (e, t) => {
  try {
    return new gC(e, t).range || "*";
  } catch {
    return null;
  }
};
var $C = yC;
const _C = ht, Sg = ao(), { ANY: vC } = Sg, wC = Wt(), EC = oo, Qf = io, Zf = Wu, bC = Xu, SC = Yu, TC = (e, t, r, n) => {
  e = new _C(e, n), t = new wC(t, n);
  let s, i, a, o, l;
  switch (r) {
    case ">":
      s = Qf, i = bC, a = Zf, o = ">", l = ">=";
      break;
    case "<":
      s = Zf, i = SC, a = Qf, o = "<", l = "<=";
      break;
    default:
      throw new TypeError('Must provide a hilo val of "<" or ">"');
  }
  if (EC(e, t, n))
    return !1;
  for (let c = 0; c < t.set.length; ++c) {
    const u = t.set[c];
    let d = null, p = null;
    if (u.forEach((m) => {
      m.semver === vC && (m = new Sg(">=0.0.0")), d = d || m, p = p || m, s(m.semver, d.semver, n) ? d = m : a(m.semver, p.semver, n) && (p = m);
    }), d.operator === o || d.operator === l || (!p.operator || p.operator === o) && i(e, p.semver))
      return !1;
    if (p.operator === l && a(e, p.semver))
      return !1;
  }
  return !0;
};
var Ju = TC;
const PC = Ju, AC = (e, t, r) => PC(e, t, ">", r);
var RC = AC;
const NC = Ju, CC = (e, t, r) => NC(e, t, "<", r);
var OC = CC;
const eh = Wt(), IC = (e, t, r) => (e = new eh(e, r), t = new eh(t, r), e.intersects(t, r));
var DC = IC;
const kC = oo, UC = Kt;
var FC = (e, t, r) => {
  const n = [];
  let s = null, i = null;
  const a = e.sort((u, d) => UC(u, d, r));
  for (const u of a)
    kC(u, t, r) ? (i = u, s || (s = u)) : (i && n.push([s, i]), i = null, s = null);
  s && n.push([s, null]);
  const o = [];
  for (const [u, d] of n)
    u === d ? o.push(u) : !d && u === a[0] ? o.push("*") : d ? u === a[0] ? o.push(`<=${d}`) : o.push(`${u} - ${d}`) : o.push(`>=${u}`);
  const l = o.join(" || "), c = typeof t.raw == "string" ? t.raw : String(t);
  return l.length < c.length ? l : t;
};
const th = Wt(), Qu = ao(), { ANY: Go } = Qu, Cs = oo, Zu = Kt, LC = (e, t, r = {}) => {
  if (e === t)
    return !0;
  e = new th(e, r), t = new th(t, r);
  let n = !1;
  e: for (const s of e.set) {
    for (const i of t.set) {
      const a = MC(s, i, r);
      if (n = n || a !== null, a)
        continue e;
    }
    if (n)
      return !1;
  }
  return !0;
}, jC = [new Qu(">=0.0.0-0")], rh = [new Qu(">=0.0.0")], MC = (e, t, r) => {
  if (e === t)
    return !0;
  if (e.length === 1 && e[0].semver === Go) {
    if (t.length === 1 && t[0].semver === Go)
      return !0;
    r.includePrerelease ? e = jC : e = rh;
  }
  if (t.length === 1 && t[0].semver === Go) {
    if (r.includePrerelease)
      return !0;
    t = rh;
  }
  const n = /* @__PURE__ */ new Set();
  let s, i;
  for (const m of e)
    m.operator === ">" || m.operator === ">=" ? s = nh(s, m, r) : m.operator === "<" || m.operator === "<=" ? i = sh(i, m, r) : n.add(m.semver);
  if (n.size > 1)
    return null;
  let a;
  if (s && i) {
    if (a = Zu(s.semver, i.semver, r), a > 0)
      return null;
    if (a === 0 && (s.operator !== ">=" || i.operator !== "<="))
      return null;
  }
  for (const m of n) {
    if (s && !Cs(m, String(s), r) || i && !Cs(m, String(i), r))
      return null;
    for (const _ of t)
      if (!Cs(m, String(_), r))
        return !1;
    return !0;
  }
  let o, l, c, u, d = i && !r.includePrerelease && i.semver.prerelease.length ? i.semver : !1, p = s && !r.includePrerelease && s.semver.prerelease.length ? s.semver : !1;
  d && d.prerelease.length === 1 && i.operator === "<" && d.prerelease[0] === 0 && (d = !1);
  for (const m of t) {
    if (u = u || m.operator === ">" || m.operator === ">=", c = c || m.operator === "<" || m.operator === "<=", s) {
      if (p && m.semver.prerelease && m.semver.prerelease.length && m.semver.major === p.major && m.semver.minor === p.minor && m.semver.patch === p.patch && (p = !1), m.operator === ">" || m.operator === ">=") {
        if (o = nh(s, m, r), o === m && o !== s)
          return !1;
      } else if (s.operator === ">=" && !Cs(s.semver, String(m), r))
        return !1;
    }
    if (i) {
      if (d && m.semver.prerelease && m.semver.prerelease.length && m.semver.major === d.major && m.semver.minor === d.minor && m.semver.patch === d.patch && (d = !1), m.operator === "<" || m.operator === "<=") {
        if (l = sh(i, m, r), l === m && l !== i)
          return !1;
      } else if (i.operator === "<=" && !Cs(i.semver, String(m), r))
        return !1;
    }
    if (!m.operator && (i || s) && a !== 0)
      return !1;
  }
  return !(s && c && !i && a !== 0 || i && u && !s && a !== 0 || p || d);
}, nh = (e, t, r) => {
  if (!e)
    return t;
  const n = Zu(e.semver, t.semver, r);
  return n > 0 ? e : n < 0 || t.operator === ">" && e.operator === ">=" ? t : e;
}, sh = (e, t, r) => {
  if (!e)
    return t;
  const n = Zu(e.semver, t.semver, r);
  return n < 0 ? e : n > 0 || t.operator === "<" && e.operator === "<=" ? t : e;
};
var xC = LC;
const Ko = yi, ih = no, qC = ht, ah = vg, VC = ms, BC = YR, HC = QR, zC = eN, GC = rN, KC = iN, WC = lN, YC = dN, XC = pN, JC = Kt, QC = $N, ZC = wN, eO = Ku, tO = TN, rO = RN, nO = io, sO = Wu, iO = wg, aO = Eg, oO = Yu, lO = Xu, cO = bg, uO = JN, dO = ao(), fO = Wt(), hO = oo, pO = sC, mO = lC, gO = fC, yO = mC, $O = $C, _O = Ju, vO = RC, wO = OC, EO = DC, bO = FC, SO = xC;
var ed = {
  parse: VC,
  valid: BC,
  clean: HC,
  inc: zC,
  diff: GC,
  major: KC,
  minor: WC,
  patch: YC,
  prerelease: XC,
  compare: JC,
  rcompare: QC,
  compareLoose: ZC,
  compareBuild: eO,
  sort: tO,
  rsort: rO,
  gt: nO,
  lt: sO,
  eq: iO,
  neq: aO,
  gte: oO,
  lte: lO,
  cmp: cO,
  coerce: uO,
  Comparator: dO,
  Range: fO,
  satisfies: hO,
  toComparators: pO,
  maxSatisfying: mO,
  minSatisfying: gO,
  minVersion: yO,
  validRange: $O,
  outside: _O,
  gtr: vO,
  ltr: wO,
  intersects: EO,
  simplifyRange: bO,
  subset: SO,
  SemVer: qC,
  re: Ko.re,
  src: Ko.src,
  tokens: Ko.t,
  SEMVER_SPEC_VERSION: ih.SEMVER_SPEC_VERSION,
  RELEASE_TYPES: ih.RELEASE_TYPES,
  compareIdentifiers: ah.compareIdentifiers,
  rcompareIdentifiers: ah.rcompareIdentifiers
};
const kn = /* @__PURE__ */ Np(ed), TO = Object.prototype.toString, PO = "[object Uint8Array]", AO = "[object ArrayBuffer]";
function Tg(e, t, r) {
  return e ? e.constructor === t ? !0 : TO.call(e) === r : !1;
}
function Pg(e) {
  return Tg(e, Uint8Array, PO);
}
function RO(e) {
  return Tg(e, ArrayBuffer, AO);
}
function NO(e) {
  return Pg(e) || RO(e);
}
function CO(e) {
  if (!Pg(e))
    throw new TypeError(`Expected \`Uint8Array\`, got \`${typeof e}\``);
}
function OO(e) {
  if (!NO(e))
    throw new TypeError(`Expected \`Uint8Array\` or \`ArrayBuffer\`, got \`${typeof e}\``);
}
function oh(e, t) {
  if (e.length === 0)
    return new Uint8Array(0);
  t ?? (t = e.reduce((s, i) => s + i.length, 0));
  const r = new Uint8Array(t);
  let n = 0;
  for (const s of e)
    CO(s), r.set(s, n), n += s.length;
  return r;
}
const Ji = {
  utf8: new globalThis.TextDecoder("utf8")
};
function lh(e, t = "utf8") {
  return OO(e), Ji[t] ?? (Ji[t] = new globalThis.TextDecoder(t)), Ji[t].decode(e);
}
function IO(e) {
  if (typeof e != "string")
    throw new TypeError(`Expected \`string\`, got \`${typeof e}\``);
}
const DO = new globalThis.TextEncoder();
function Wo(e) {
  return IO(e), DO.encode(e);
}
Array.from({ length: 256 }, (e, t) => t.toString(16).padStart(2, "0"));
const kO = TR.default, ch = "aes-256-cbc", Un = () => /* @__PURE__ */ Object.create(null), UO = (e) => e != null, FO = (e, t) => {
  const r = /* @__PURE__ */ new Set([
    "undefined",
    "symbol",
    "function"
  ]), n = typeof t;
  if (r.has(n))
    throw new TypeError(`Setting a value of type \`${n}\` for key \`${e}\` is not allowed as it's not supported by JSON`);
}, ga = "__internal__", Yo = `${ga}.migrations.version`;
var xr, pr, St, mr;
class LO {
  constructor(t = {}) {
    ee(this, "path");
    ee(this, "events");
    bs(this, xr);
    bs(this, pr);
    bs(this, St);
    bs(this, mr, {});
    ee(this, "_deserialize", (t) => JSON.parse(t));
    ee(this, "_serialize", (t) => JSON.stringify(t, void 0, "	"));
    const r = {
      configName: "config",
      fileExtension: "json",
      projectSuffix: "nodejs",
      clearInvalidConfig: !1,
      accessPropertiesByDotNotation: !0,
      configFileMode: 438,
      ...t
    };
    if (!r.cwd) {
      if (!r.projectName)
        throw new Error("Please specify the `projectName` option.");
      r.cwd = c$(r.projectName, { suffix: r.projectSuffix }).config;
    }
    if (Ss(this, St, r), r.schema ?? r.ajvOptions ?? r.rootSchema) {
      if (r.schema && typeof r.schema != "object")
        throw new TypeError("The `schema` option must be an object.");
      const a = new fS.Ajv2020({
        allErrors: !0,
        useDefaults: !0,
        ...r.ajvOptions
      });
      kO(a);
      const o = {
        ...r.rootSchema,
        type: "object",
        properties: r.schema
      };
      Ss(this, xr, a.compile(o));
      for (const [l, c] of Object.entries(r.schema ?? {}))
        c != null && c.default && (Ae(this, mr)[l] = c.default);
    }
    r.defaults && Ss(this, mr, {
      ...Ae(this, mr),
      ...r.defaults
    }), r.serialize && (this._serialize = r.serialize), r.deserialize && (this._deserialize = r.deserialize), this.events = new EventTarget(), Ss(this, pr, r.encryptionKey);
    const n = r.fileExtension ? `.${r.fileExtension}` : "";
    this.path = fe.resolve(r.cwd, `${r.configName ?? "config"}${n}`);
    const s = this.store, i = Object.assign(Un(), r.defaults, s);
    if (r.migrations) {
      if (!r.projectVersion)
        throw new Error("Please specify the `projectVersion` option.");
      this._migrate(r.migrations, r.projectVersion, r.beforeEachMigration);
    }
    this._validate(i);
    try {
      Yy.deepEqual(s, i);
    } catch {
      this.store = i;
    }
    r.watch && this._watch();
  }
  get(t, r) {
    if (Ae(this, St).accessPropertiesByDotNotation)
      return this._get(t, r);
    const { store: n } = this;
    return t in n ? n[t] : r;
  }
  set(t, r) {
    if (typeof t != "string" && typeof t != "object")
      throw new TypeError(`Expected \`key\` to be of type \`string\` or \`object\`, got ${typeof t}`);
    if (typeof t != "object" && r === void 0)
      throw new TypeError("Use `delete()` to clear values");
    if (this._containsReservedKey(t))
      throw new TypeError(`Please don't use the ${ga} key, as it's used to manage this module internal operations.`);
    const { store: n } = this, s = (i, a) => {
      FO(i, a), Ae(this, St).accessPropertiesByDotNotation ? Md(n, i, a) : n[i] = a;
    };
    if (typeof t == "object") {
      const i = t;
      for (const [a, o] of Object.entries(i))
        s(a, o);
    } else
      s(t, r);
    this.store = n;
  }
  has(t) {
    return Ae(this, St).accessPropertiesByDotNotation ? i$(this.store, t) : t in this.store;
  }
  /**
      Reset items to their default values, as defined by the `defaults` or `schema` option.
  
      @see `clear()` to reset all items.
  
      @param keys - The keys of the items to reset.
      */
  reset(...t) {
    for (const r of t)
      UO(Ae(this, mr)[r]) && this.set(r, Ae(this, mr)[r]);
  }
  delete(t) {
    const { store: r } = this;
    Ae(this, St).accessPropertiesByDotNotation ? s$(r, t) : delete r[t], this.store = r;
  }
  /**
      Delete all items.
  
      This resets known items to their default values, if defined by the `defaults` or `schema` option.
      */
  clear() {
    this.store = Un();
    for (const t of Object.keys(Ae(this, mr)))
      this.reset(t);
  }
  onDidChange(t, r) {
    if (typeof t != "string")
      throw new TypeError(`Expected \`key\` to be of type \`string\`, got ${typeof t}`);
    if (typeof r != "function")
      throw new TypeError(`Expected \`callback\` to be of type \`function\`, got ${typeof r}`);
    return this._handleChange(() => this.get(t), r);
  }
  /**
      Watches the whole config object, calling `callback` on any changes.
  
      @param callback - A callback function that is called on any changes. When a `key` is first set `oldValue` will be `undefined`, and when a key is deleted `newValue` will be `undefined`.
      @returns A function, that when called, will unsubscribe.
      */
  onDidAnyChange(t) {
    if (typeof t != "function")
      throw new TypeError(`Expected \`callback\` to be of type \`function\`, got ${typeof t}`);
    return this._handleChange(() => this.store, t);
  }
  get size() {
    return Object.keys(this.store).length;
  }
  /**
      Get all the config as an object or replace the current config with an object.
  
      @example
      ```
      console.log(config.store);
      //=> {name: 'John', age: 30}
      ```
  
      @example
      ```
      config.store = {
          hello: 'world'
      };
      ```
      */
  get store() {
    try {
      const t = le.readFileSync(this.path, Ae(this, pr) ? null : "utf8"), r = this._encryptData(t), n = this._deserialize(r);
      return this._validate(n), Object.assign(Un(), n);
    } catch (t) {
      if ((t == null ? void 0 : t.code) === "ENOENT")
        return this._ensureDirectory(), Un();
      if (Ae(this, St).clearInvalidConfig && t.name === "SyntaxError")
        return Un();
      throw t;
    }
  }
  set store(t) {
    this._ensureDirectory(), this._validate(t), this._write(t), this.events.dispatchEvent(new Event("change"));
  }
  *[Symbol.iterator]() {
    for (const [t, r] of Object.entries(this.store))
      yield [t, r];
  }
  _encryptData(t) {
    if (!Ae(this, pr))
      return typeof t == "string" ? t : lh(t);
    try {
      const r = t.slice(0, 16), n = Ts.pbkdf2Sync(Ae(this, pr), r.toString(), 1e4, 32, "sha512"), s = Ts.createDecipheriv(ch, n, r), i = t.slice(17), a = typeof i == "string" ? Wo(i) : i;
      return lh(oh([s.update(a), s.final()]));
    } catch {
    }
    return t.toString();
  }
  _handleChange(t, r) {
    let n = t();
    const s = () => {
      const i = n, a = t();
      Wy(a, i) || (n = a, r.call(this, a, i));
    };
    return this.events.addEventListener("change", s), () => {
      this.events.removeEventListener("change", s);
    };
  }
  _validate(t) {
    if (!Ae(this, xr) || Ae(this, xr).call(this, t) || !Ae(this, xr).errors)
      return;
    const n = Ae(this, xr).errors.map(({ instancePath: s, message: i = "" }) => `\`${s.slice(1)}\` ${i}`);
    throw new Error("Config schema violation: " + n.join("; "));
  }
  _ensureDirectory() {
    le.mkdirSync(fe.dirname(this.path), { recursive: !0 });
  }
  _write(t) {
    let r = this._serialize(t);
    if (Ae(this, pr)) {
      const n = Ts.randomBytes(16), s = Ts.pbkdf2Sync(Ae(this, pr), n.toString(), 1e4, 32, "sha512"), i = Ts.createCipheriv(ch, s, n);
      r = oh([n, Wo(":"), i.update(Wo(r)), i.final()]);
    }
    if (je.env.SNAP)
      le.writeFileSync(this.path, r, { mode: Ae(this, St).configFileMode });
    else
      try {
        Rp(this.path, r, { mode: Ae(this, St).configFileMode });
      } catch (n) {
        if ((n == null ? void 0 : n.code) === "EXDEV") {
          le.writeFileSync(this.path, r, { mode: Ae(this, St).configFileMode });
          return;
        }
        throw n;
      }
  }
  _watch() {
    this._ensureDirectory(), le.existsSync(this.path) || this._write(Un()), je.platform === "win32" ? le.watch(this.path, { persistent: !1 }, qf(() => {
      this.events.dispatchEvent(new Event("change"));
    }, { wait: 100 })) : le.watchFile(this.path, { persistent: !1 }, qf(() => {
      this.events.dispatchEvent(new Event("change"));
    }, { wait: 5e3 }));
  }
  _migrate(t, r, n) {
    let s = this._get(Yo, "0.0.0");
    const i = Object.keys(t).filter((o) => this._shouldPerformMigration(o, s, r));
    let a = { ...this.store };
    for (const o of i)
      try {
        n && n(this, {
          fromVersion: s,
          toVersion: o,
          finalVersion: r,
          versions: i
        });
        const l = t[o];
        l == null || l(this), this._set(Yo, o), s = o, a = { ...this.store };
      } catch (l) {
        throw this.store = a, new Error(`Something went wrong during the migration! Changes applied to the store until this failed migration will be restored. ${l}`);
      }
    (this._isVersionInRangeFormat(s) || !kn.eq(s, r)) && this._set(Yo, r);
  }
  _containsReservedKey(t) {
    return typeof t == "object" && Object.keys(t)[0] === ga ? !0 : typeof t != "string" ? !1 : Ae(this, St).accessPropertiesByDotNotation ? !!t.startsWith(`${ga}.`) : !1;
  }
  _isVersionInRangeFormat(t) {
    return kn.clean(t) === null;
  }
  _shouldPerformMigration(t, r, n) {
    return this._isVersionInRangeFormat(t) ? r !== "0.0.0" && kn.satisfies(r, t) ? !1 : kn.satisfies(n, t) : !(kn.lte(t, r) || kn.gt(t, n));
  }
  _get(t, r) {
    return n$(this.store, t, r);
  }
  _set(t, r) {
    const { store: n } = this;
    Md(n, t, r), this.store = n;
  }
}
xr = new WeakMap(), pr = new WeakMap(), St = new WeakMap(), mr = new WeakMap();
const { app: ya, ipcMain: Ml, shell: jO } = vr;
let uh = !1;
const dh = () => {
  if (!Ml || !ya)
    throw new Error("Electron Store: You need to call `.initRenderer()` from the main process.");
  const e = {
    defaultCwd: ya.getPath("userData"),
    appVersion: ya.getVersion()
  };
  return uh || (Ml.on("electron-store-get-data", (t) => {
    t.returnValue = e;
  }), uh = !0), e;
};
class MO extends LO {
  constructor(t) {
    let r, n;
    if (je.type === "renderer") {
      const s = vr.ipcRenderer.sendSync("electron-store-get-data");
      if (!s)
        throw new Error("Electron Store: You need to call `.initRenderer()` from the main process.");
      ({ defaultCwd: r, appVersion: n } = s);
    } else Ml && ya && ({ defaultCwd: r, appVersion: n } = dh());
    t = {
      name: "config",
      ...t
    }, t.projectVersion || (t.projectVersion = n), t.cwd ? t.cwd = fe.isAbsolute(t.cwd) ? t.cwd : fe.join(r, t.cwd) : t.cwd = r, t.configName = t.name, delete t.name, super(t);
  }
  static initRenderer() {
    dh();
  }
  async openInEditor() {
    const t = await jO.openPath(this.path);
    if (t)
      throw new Error(t);
  }
}
const xO = st.join(wn.getPath("userData"), "app.log");
function nt(e) {
  Ag("INFO", e);
}
function ut(e, t) {
  const r = t instanceof Error ? t.stack : JSON.stringify(t);
  Ag("ERROR", `${e}${r ? ` - ${r}` : ""}`);
}
function Ag(e, t) {
  const n = `[${(/* @__PURE__ */ new Date()).toISOString()}] [${e}] ${t}
`;
  console.log(n.trim());
  try {
    Gt.appendFileSync(xO, n);
  } catch (s) {
    console.error("Failed to write to log file:", s);
  }
}
class qO {
  constructor() {
    ee(this, "id", "archive-org");
    ee(this, "name", "Archive.org");
    ee(this, "baseUrl", "https://archive.org");
  }
  async search(t) {
    try {
      const r = `${this.baseUrl}/search.php?query=${encodeURIComponent(t)}&and[]=mediatype%3A"movies"&and[]=collection%3A"prelinger" OR and[]=collection%3A"movies"`, n = await Me.get(r), s = sr.load(n.data), i = [];
      return s(".item-ia").each((a, o) => {
        const l = s(o).find(".title").text().trim(), c = s(o).attr("data-id"), u = s(o).find(".item-img").attr("src") || s(o).find("img").attr("src");
        c && l && i.push({
          id: c,
          title: l,
          description: "",
          thumbnail: u ? u.startsWith("http") ? u : `${this.baseUrl}${u}` : void 0,
          seasons: [],
          sourceId: this.id
        });
      }), i;
    } catch (r) {
      return console.error("Archive.org search error:", r), [];
    }
  }
  async getSeasonLinks(t) {
    return [{ number: 1, url: `${this.baseUrl}/details/${t}` }];
  }
  async getEpisodes(t, r) {
    try {
      const n = `${this.baseUrl}/details/${t}&output=json`, i = (await Me.get(n)).data, a = [], o = i.files || {};
      let l = 1;
      for (const c in o) {
        const u = o[c];
        u.format && (u.format.includes("Video") || u.format.includes("MPEG4") || c.endsWith(".mp4") || c.endsWith(".mkv")) && a.push({
          id: `${t}/${c}`,
          title: c,
          season: r,
          number: l++,
          downloadUrl: `${this.baseUrl}/download/${t}/${c}`,
          fileSize: u.size ? parseInt(u.size) : void 0,
          sourceId: this.id
        });
      }
      return a;
    } catch (n) {
      return console.error("Archive.org getEpisodes error:", n), [];
    }
  }
  async getDownloadUrl(t) {
    return `${this.baseUrl}/download/${t}`;
  }
}
class VO {
  constructor() {
    ee(this, "id", "british-council");
    ee(this, "name", "British Council Film");
    ee(this, "baseUrl", "http://film.britishcouncil.org");
  }
  async search(t) {
    try {
      const r = `${this.baseUrl}/british-council-film-collection/the-collection?q=${encodeURIComponent(t)}`, n = await Me.get(r), s = sr.load(n.data), i = [];
      return s(".film-item").each((a, o) => {
        const l = s(o).find("h3").text().trim(), c = s(o).find("a").attr("href");
        c && l && i.push({
          id: c,
          title: l,
          description: "",
          seasons: [],
          sourceId: this.id
        });
      }), i;
    } catch (r) {
      return console.error("British Council search error:", r), [];
    }
  }
  async getSeasonLinks(t) {
    return [{ number: 1, url: t.startsWith("http") ? t : `${this.baseUrl}${t}` }];
  }
  async getEpisodes(t, r) {
    try {
      const n = t.startsWith("http") ? t : `${this.baseUrl}${t}`, s = await Me.get(n), a = sr.load(s.data)('iframe[src*="vimeo"]').attr("src");
      return a ? [{
        id: a,
        title: "Archive Film",
        season: r,
        number: 1,
        downloadUrl: a,
        sourceId: this.id
      }] : [];
    } catch (n) {
      return console.error("British Council detail error:", n), [];
    }
  }
  async getDownloadUrl(t) {
    return t;
  }
}
class BO {
  constructor() {
    ee(this, "id", "loc-gov");
    ee(this, "name", "Library of Congress");
    ee(this, "baseUrl", "https://www.loc.gov");
  }
  async search(t) {
    var r, n;
    try {
      const s = `${this.baseUrl}/search/?q=${encodeURIComponent(t)}&fa=original-format:moving+image&fo=json&c=50`, a = (await Me.get(s)).data, o = [], l = a.results || [];
      for (const c of l)
        c.id && c.title && o.push({
          id: c.id,
          title: c.title,
          description: ((r = c.description) == null ? void 0 : r[0]) || "",
          thumbnail: ((n = c.image_url) == null ? void 0 : n[0]) || void 0,
          seasons: [],
          sourceId: this.id
        });
      return o;
    } catch (s) {
      return console.error("LOC search error:", s), [];
    }
  }
  async getSeasonLinks(t) {
    return [{ number: 1, url: t.startsWith("http") ? t : `${this.baseUrl}${t}` }];
  }
  async getEpisodes(t, r) {
    try {
      const n = `${t.startsWith("http") ? t : `${this.baseUrl}${t}`}?fo=json`, i = (await Me.get(n)).data, a = [], o = i.item || {}, l = i.resources || [];
      let c = 1;
      for (const u of l) {
        const d = u.files || [];
        for (const p of d) {
          const m = p.find((_) => {
            var $;
            return _.url && (_.url.endsWith(".mp4") || _.url.endsWith(".mov") || (($ = _.mimetype) == null ? void 0 : $.includes("video/mp4")));
          });
          m && a.push({
            id: m.url,
            title: o.title || `Part ${c}`,
            season: r,
            number: c++,
            downloadUrl: m.url,
            sourceId: this.id
          });
        }
      }
      return a.length === 0 && o.id, a;
    } catch (n) {
      return console.error("LOC getEpisodes error:", n), [];
    }
  }
  async getDownloadUrl(t) {
    return t;
  }
}
class HO {
  constructor() {
    ee(this, "id", "nasa-stock");
    ee(this, "name", "NASA / Public Stock");
    // NASA Image and Video Library API
    ee(this, "apiUrl", "https://images-api.nasa.gov");
  }
  async search(t) {
    var r, n;
    try {
      const s = `${this.apiUrl}/search?q=${encodeURIComponent(t)}&media_type=video`, a = (await Me.get(s)).data.collection.items || [], o = [];
      for (const l of a) {
        const c = (r = l.data) == null ? void 0 : r[0], u = (n = l.links) == null ? void 0 : n[0];
        c && c.nasa_id && o.push({
          id: c.nasa_id,
          title: c.title,
          description: c.description || "",
          thumbnail: u == null ? void 0 : u.href,
          seasons: [],
          sourceId: this.id
        });
      }
      return o;
    } catch (s) {
      return console.error("NASA search error:", s), [];
    }
  }
  async getSeasonLinks(t) {
    return [{ number: 1, url: t }];
  }
  async getEpisodes(t, r) {
    try {
      const n = `${this.apiUrl}/asset/${t}`, i = (await Me.get(n)).data.collection.items || [], a = i.find((o) => o.href.endsWith("~orig.mp4")) || i.find((o) => o.href.endsWith(".mp4"));
      return a ? [{
        id: t,
        title: "High Quality Stream",
        season: r,
        number: 1,
        downloadUrl: a.href,
        sourceId: this.id
      }] : [];
    } catch (n) {
      return console.error("NASA assets error:", n), [];
    }
  }
  async getDownloadUrl(t) {
    return t;
  }
}
class zO {
  constructor() {
    ee(this, "id", "nfb-ca");
    ee(this, "name", "National Film Board");
    ee(this, "baseUrl", "https://www.nfb.ca");
  }
  async search(t) {
    try {
      const r = `${this.baseUrl}/search/?q=${encodeURIComponent(t)}&type=film`, n = await Me.get(r), s = sr.load(n.data), i = [];
      return s(".film-card").each((a, o) => {
        const l = s(o).find(".film-card__title").text().trim(), c = s(o).find("a").attr("href"), u = s(o).find("img").attr("data-src") || s(o).find("img").attr("src");
        c && l && i.push({
          id: c,
          title: l,
          description: "",
          thumbnail: u ? u.startsWith("http") ? u : `${this.baseUrl}${u}` : void 0,
          seasons: [],
          sourceId: this.id
        });
      }), i;
    } catch (r) {
      return console.error("NFB search error:", r), [];
    }
  }
  async getSeasonLinks(t) {
    return [{ number: 1, url: t.startsWith("http") ? t : `${this.baseUrl}${t}` }];
  }
  async getEpisodes(t, r) {
    try {
      const n = t.startsWith("http") ? t : `${this.baseUrl}${t}`, s = await Me.get(n), i = sr.load(s.data), a = [], o = i("h1").text().trim();
      return a.push({
        id: t,
        title: o || "Full Film",
        season: r,
        number: 1,
        downloadUrl: n,
        sourceId: this.id
      }), a;
    } catch (n) {
      return console.error("NFB getEpisodes error:", n), [];
    }
  }
  async getDownloadUrl(t) {
    return t.startsWith("http") ? t : `${this.baseUrl}${t}`;
  }
}
class GO {
  constructor() {
    ee(this, "id", "open-culture");
    ee(this, "name", "Open Culture");
    ee(this, "baseUrl", "https://www.openculture.com");
  }
  async search(t) {
    try {
      const r = `${this.baseUrl}/?s=${encodeURIComponent(t)}`, n = await Me.get(r), s = sr.load(n.data), i = [];
      return s("article").each((a, o) => {
        const l = s(o).find("h2 a").text().trim(), c = s(o).find("h2 a").attr("href");
        c && l && i.push({
          id: c,
          title: l,
          description: s(o).find(".entry-content").text().substring(0, 150) + "...",
          seasons: [],
          sourceId: this.id
        });
      }), i;
    } catch (r) {
      return console.error("Open Culture search error:", r), [];
    }
  }
  async getSeasonLinks(t) {
    return [{ number: 1, url: t }];
  }
  async getEpisodes(t, r) {
    try {
      const n = await Me.get(t), i = sr.load(n.data)("iframe").attr("src");
      return i ? [{
        id: i,
        title: "Embedded Video",
        season: r,
        number: 1,
        downloadUrl: i,
        sourceId: this.id
      }] : [];
    } catch (n) {
      return console.error("Open Culture detail error:", n), [];
    }
  }
  async getDownloadUrl(t) {
    return t;
  }
}
class KO {
  constructor() {
    ee(this, "id", "pratt-archive");
    ee(this, "name", "Enoch Pratt Archive");
    ee(this, "baseUrl", "https://digitalmaryland.org");
  }
  async search(t) {
    try {
      const r = `${this.baseUrl}/search/collection/p16022coll61/searchterm/${encodeURIComponent(t)}`, n = await Me.get(r), s = sr.load(n.data), i = [];
      return s(".item-container").each((a, o) => {
        const l = s(o).find(".title-link").text().trim(), c = s(o).find(".title-link").attr("href");
        c && l && i.push({
          id: c,
          title: l,
          description: "",
          seasons: [],
          sourceId: this.id
        });
      }), i;
    } catch (r) {
      return console.error("Pratt Archive search error:", r), [];
    }
  }
  async getSeasonLinks(t) {
    return [{ number: 1, url: t }];
  }
  async getEpisodes(t, r) {
    return [{
      id: t,
      title: "Archival Record",
      season: r,
      number: 1,
      downloadUrl: t,
      sourceId: this.id
    }];
  }
  async getDownloadUrl(t) {
    return t;
  }
}
class WO {
  constructor() {
    ee(this, "id", "pd-movie");
    ee(this, "name", "Public Domain Movie");
    ee(this, "baseUrl", "https://publicdomainmovie.net");
  }
  async search(t) {
    try {
      const r = `${this.baseUrl}/search?query=${encodeURIComponent(t)}`, n = await Me.get(r), s = sr.load(n.data), i = [];
      return s(".movie-card").each((a, o) => {
        const l = s(o).find(".movie-title").text().trim(), c = s(o).find("a").attr("href"), u = s(o).find("img").attr("src");
        c && l && i.push({
          id: c,
          title: l,
          description: "",
          thumbnail: u ? u.startsWith("http") ? u : `${this.baseUrl}${u}` : void 0,
          seasons: [],
          sourceId: this.id
        });
      }), i;
    } catch (r) {
      return console.error("PD Movie search error:", r), [];
    }
  }
  async getSeasonLinks(t) {
    return [{ number: 1, url: t.startsWith("http") ? t : `${this.baseUrl}${t}` }];
  }
  async getEpisodes(t, r) {
    try {
      const n = t.startsWith("http") ? t : `${this.baseUrl}${t}`, s = await Me.get(n), i = sr.load(s.data), a = [], o = i(".download-button").attr("href");
      return o && a.push({
        id: o,
        title: i("h1.title").text().trim() || "Full Movie",
        season: r,
        number: 1,
        downloadUrl: o.startsWith("http") ? o : `${this.baseUrl}${o}`,
        sourceId: this.id
      }), a;
    } catch (n) {
      return console.error("PD Movie getEpisodes error:", n), [];
    }
  }
  async getDownloadUrl(t) {
    return t;
  }
}
class YO {
  constructor() {
    ee(this, "id", "vimeo-cc");
    ee(this, "name", "Vimeo (CC)");
  }
  async search(t) {
    try {
      return [];
    } catch (r) {
      return console.error("Vimeo search error:", r), [];
    }
  }
  async getSeasonLinks(t) {
    return [{ number: 1, url: t }];
  }
  async getEpisodes(t, r) {
    return [];
  }
  async getDownloadUrl(t) {
    return t;
  }
}
class XO {
  constructor() {
    ee(this, "id", "youtube-pd");
    ee(this, "name", "YouTube (Public Domain)");
    // Specific channels known for public domain or free-to-use content
    ee(this, "targetChannels", [
      { name: "FilmRise", url: "https://www.youtube.com/@FilmRise/search?query=" },
      { name: "Maverick Movies", url: "https://www.youtube.com/@MaverickMovies/search?query=" },
      { name: "Public Domain Movies", url: "https://www.youtube.com/@PublicDomainMovies/search?query=" }
    ]);
  }
  async search(t) {
    const r = await Xy.launch({ headless: !0 }), n = [];
    try {
      const s = await r.newPage();
      for (const i of this.targetChannels) {
        await s.goto(`${i.url}${encodeURIComponent(t)}`), await s.waitForSelector("ytd-video-renderer", { timeout: 1e4 }).catch(() => {
        });
        const a = await s.evaluate(() => Array.from(document.querySelectorAll("ytd-video-renderer")).map((l) => {
          var p, m, _;
          const c = l.querySelector("#video-title"), u = l.querySelector("img"), d = l.querySelector("a#video-title");
          return {
            id: (d == null ? void 0 : d.getAttribute("href")) || "",
            title: ((p = c == null ? void 0 : c.textContent) == null ? void 0 : p.trim()) || "",
            thumbnail: (u == null ? void 0 : u.getAttribute("src")) || "",
            description: ((_ = (m = l.querySelector("#description-text")) == null ? void 0 : m.textContent) == null ? void 0 : _.trim()) || ""
          };
        }));
        for (const o of a)
          o.id && o.title && n.push({
            id: o.id,
            title: `[${i.name}] ${o.title}`,
            description: o.description,
            thumbnail: o.thumbnail,
            seasons: [],
            sourceId: this.id
          });
      }
    } catch (s) {
      console.error("YouTube search error:", s);
    } finally {
      await r.close();
    }
    return n;
  }
  async getSeasonLinks(t) {
    return [{ number: 1, url: `https://www.youtube.com${t}` }];
  }
  async getEpisodes(t, r) {
    return [{
      id: t,
      title: "Full Video",
      season: r,
      number: 1,
      downloadUrl: `https://www.youtube.com${t}`,
      sourceId: this.id
    }];
  }
  async getDownloadUrl(t) {
    return `https://www.youtube.com${t}`;
  }
}
class JO {
  constructor() {
    ee(this, "sources", /* @__PURE__ */ new Map());
    this.registerSource(new qO()), this.registerSource(new BO()), this.registerSource(new WO()), this.registerSource(new XO()), this.registerSource(new zO()), this.registerSource(new HO()), this.registerSource(new GO()), this.registerSource(new VO()), this.registerSource(new YO()), this.registerSource(new KO());
  }
  registerSource(t) {
    this.sources.set(t.id, t);
  }
  getSource(t) {
    return this.sources.get(t);
  }
  getAllSources() {
    return Array.from(this.sources.values());
  }
  async searchAll(t) {
    const r = this.getAllSources().map(async (s) => {
      const i = await s.search(t);
      return {
        sourceId: s.id,
        results: i
      };
    });
    return (await Promise.allSettled(r)).map((s, i) => {
      if (s.status === "fulfilled")
        return s.value;
      {
        const a = this.getAllSources()[i].id;
        return console.error(`Search failed for source ${a}:`, s.reason), {
          sourceId: a,
          results: []
        };
      }
    });
  }
}
const Qi = new JO();
class QO {
  constructor() {
    ee(this, "players", []);
    this.detectPlayers();
  }
  detectPlayers() {
    const t = [
      // VLC
      { name: "VLC", type: "vlc", path: "C:\\Program Files\\VideoLAN\\VLC\\vlc.exe" },
      { name: "VLC", type: "vlc", path: "C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe" },
      // MPV
      { name: "MPV", type: "mpv", path: "C:\\Program Files\\mpv\\mpv.exe" },
      { name: "MPV", type: "mpv", path: st.join(process.env.LOCALAPPDATA || "", "mpv\\mpv.exe") }
    ];
    for (const r of t)
      Gt.existsSync(r.path) && (this.players.push(r), nt(`Detected player: ${r.name} at ${r.path}`));
  }
  getAvailablePlayers() {
    return this.players;
  }
  /**
   * Sanitizes the path to prevent command injection.
   * Node process.spawn handles arguments as an array, which is already safer than exec.
   * We still normalize and check existence.
   */
  sanitizePath(t) {
    const r = st.normalize(t);
    if (!Gt.existsSync(r))
      throw new Error(`File does not exist: ${r}`);
    return r;
  }
  async playFile(t, r = 0) {
    const n = this.players[0];
    if (!n) {
      nt("No specific player detected, falling back to OS default."), jd("cmd", ["/c", "start", '""', t], { shell: !0 });
      return;
    }
    const s = this.sanitizePath(t), i = [s];
    return r > 0 && (n.type === "vlc" ? i.push(`--start-time=${r}`) : n.type === "mpv" && i.push(`--start=${r}`)), nt(`Launching ${n.name} for ${s} at ${r}s`), new Promise((a, o) => {
      const l = jd(n.path, i, {
        detached: !0,
        stdio: "ignore"
      });
      l.on("error", (c) => {
        ut(`Failed to start player: ${c.message}`), o(c);
      }), l.on("exit", (c) => {
        nt(`Player exited with code ${c}`), a();
      });
    });
  }
}
const ZO = new QO();
class eI {
  constructor(t, r) {
    ee(this, "tmdbKey");
    ee(this, "omdbKey");
    ee(this, "queue", []);
    ee(this, "isProcessing", !1);
    this.tmdbKey = t, this.omdbKey = r;
  }
  setKeys(t, r) {
    this.tmdbKey = t, this.omdbKey = r;
  }
  async enrich(t, r = "tv") {
    return new Promise((n) => {
      this.queue.push({
        title: t,
        type: r,
        callback: (s) => n(s)
      }), this.processQueue();
    });
  }
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = !0;
    const { title: t, type: r, callback: n } = this.queue.shift();
    try {
      nt(`Enriching metadata for: ${t} (${r})`);
      let s = await this.fetchFromTMDB(t, r);
      !s && this.omdbKey && (nt(`TMDB failed or no key, trying OMDB for: ${t}`), s = await this.fetchFromOMDB(t, r)), n(s);
    } catch (s) {
      ut(`Metadata enrichment failed for ${t}`, s), n(null);
    } finally {
      this.isProcessing = !1, setTimeout(() => this.processQueue(), 500);
    }
  }
  async fetchFromTMDB(t, r) {
    var n, s, i;
    if (!this.tmdbKey) return null;
    try {
      const o = (n = (await Me.get(`https://api.themoviedb.org/3/search/${r}`, {
        params: {
          api_key: this.tmdbKey,
          query: t
        }
      })).data.results) == null ? void 0 : n[0];
      if (!o) return null;
      const c = (await Me.get(`https://api.themoviedb.org/3/${r}/${o.id}`, {
        params: {
          api_key: this.tmdbKey
        }
      })).data;
      return {
        title: c.name || c.title,
        description: c.overview,
        thumbnail: `https://image.tmdb.org/t/p/w500${c.poster_path}`,
        backdrop: `https://image.tmdb.org/t/p/original${c.backdrop_path}`,
        rating: ((s = c.vote_average) == null ? void 0 : s.toString()) || "N/A",
        genres: ((i = c.genres) == null ? void 0 : i.map((u) => u.name)) || [],
        releaseYear: (c.first_air_date || c.release_date || "").split("-")[0]
      };
    } catch (a) {
      return ut("TMDB fetch error", a), null;
    }
  }
  async fetchFromOMDB(t, r) {
    var n, s;
    if (!this.omdbKey) return null;
    try {
      const a = (await Me.get("http://www.omdbapi.com/", {
        params: {
          apikey: this.omdbKey,
          t,
          type: r === "tv" ? "series" : "movie"
        }
      })).data;
      return a.Response === "False" ? null : {
        title: a.Title,
        description: a.Plot,
        thumbnail: a.Poster !== "N/A" ? a.Poster : "",
        backdrop: "",
        // OMDB doesn't provide backdrops easily
        rating: a.imdbRating || "N/A",
        genres: ((n = a.Genre) == null ? void 0 : n.split(", ")) || [],
        releaseYear: (s = a.Year) == null ? void 0 : s.split("–")[0]
      };
    } catch (i) {
      return ut("OMDB fetch error", i), null;
    }
  }
}
const Xo = new eI();
var Lr = {}, An = {}, Gr = {}, xe = {}, Kr = {};
Object.defineProperty(Kr, "__esModule", { value: !0 });
Kr.CancellationError = Kr.CancellationToken = void 0;
const tI = bp;
class rI extends tI.EventEmitter {
  get cancelled() {
    return this._cancelled || this._parent != null && this._parent.cancelled;
  }
  set parent(t) {
    this.removeParentCancelHandler(), this._parent = t, this.parentCancelHandler = () => this.cancel(), this._parent.onCancel(this.parentCancelHandler);
  }
  // babel cannot compile ... correctly for super calls
  constructor(t) {
    super(), this.parentCancelHandler = null, this._parent = null, this._cancelled = !1, t != null && (this.parent = t);
  }
  cancel() {
    this._cancelled = !0, this.emit("cancel");
  }
  onCancel(t) {
    this.cancelled ? t() : this.once("cancel", t);
  }
  createPromise(t) {
    if (this.cancelled)
      return Promise.reject(new xl());
    const r = () => {
      if (n != null)
        try {
          this.removeListener("cancel", n), n = null;
        } catch {
        }
    };
    let n = null;
    return new Promise((s, i) => {
      let a = null;
      if (n = () => {
        try {
          a != null && (a(), a = null);
        } finally {
          i(new xl());
        }
      }, this.cancelled) {
        n();
        return;
      }
      this.onCancel(n), t(s, i, (o) => {
        a = o;
      });
    }).then((s) => (r(), s)).catch((s) => {
      throw r(), s;
    });
  }
  removeParentCancelHandler() {
    const t = this._parent;
    t != null && this.parentCancelHandler != null && (t.removeListener("cancel", this.parentCancelHandler), this.parentCancelHandler = null);
  }
  dispose() {
    try {
      this.removeParentCancelHandler();
    } finally {
      this.removeAllListeners(), this._parent = null;
    }
  }
}
Kr.CancellationToken = rI;
class xl extends Error {
  constructor() {
    super("cancelled");
  }
}
Kr.CancellationError = xl;
var gs = {};
Object.defineProperty(gs, "__esModule", { value: !0 });
gs.newError = nI;
function nI(e, t) {
  const r = new Error(e);
  return r.code = t, r;
}
var ft = {}, ql = { exports: {} }, Zi = { exports: {} }, Jo, fh;
function sI() {
  if (fh) return Jo;
  fh = 1;
  var e = 1e3, t = e * 60, r = t * 60, n = r * 24, s = n * 7, i = n * 365.25;
  Jo = function(u, d) {
    d = d || {};
    var p = typeof u;
    if (p === "string" && u.length > 0)
      return a(u);
    if (p === "number" && isFinite(u))
      return d.long ? l(u) : o(u);
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(u)
    );
  };
  function a(u) {
    if (u = String(u), !(u.length > 100)) {
      var d = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        u
      );
      if (d) {
        var p = parseFloat(d[1]), m = (d[2] || "ms").toLowerCase();
        switch (m) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return p * i;
          case "weeks":
          case "week":
          case "w":
            return p * s;
          case "days":
          case "day":
          case "d":
            return p * n;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return p * r;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return p * t;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return p * e;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return p;
          default:
            return;
        }
      }
    }
  }
  function o(u) {
    var d = Math.abs(u);
    return d >= n ? Math.round(u / n) + "d" : d >= r ? Math.round(u / r) + "h" : d >= t ? Math.round(u / t) + "m" : d >= e ? Math.round(u / e) + "s" : u + "ms";
  }
  function l(u) {
    var d = Math.abs(u);
    return d >= n ? c(u, d, n, "day") : d >= r ? c(u, d, r, "hour") : d >= t ? c(u, d, t, "minute") : d >= e ? c(u, d, e, "second") : u + " ms";
  }
  function c(u, d, p, m) {
    var _ = d >= p * 1.5;
    return Math.round(u / p) + " " + m + (_ ? "s" : "");
  }
  return Jo;
}
var Qo, hh;
function Rg() {
  if (hh) return Qo;
  hh = 1;
  function e(t) {
    n.debug = n, n.default = n, n.coerce = c, n.disable = o, n.enable = i, n.enabled = l, n.humanize = sI(), n.destroy = u, Object.keys(t).forEach((d) => {
      n[d] = t[d];
    }), n.names = [], n.skips = [], n.formatters = {};
    function r(d) {
      let p = 0;
      for (let m = 0; m < d.length; m++)
        p = (p << 5) - p + d.charCodeAt(m), p |= 0;
      return n.colors[Math.abs(p) % n.colors.length];
    }
    n.selectColor = r;
    function n(d) {
      let p, m = null, _, $;
      function v(...g) {
        if (!v.enabled)
          return;
        const E = v, N = Number(/* @__PURE__ */ new Date()), O = N - (p || N);
        E.diff = O, E.prev = p, E.curr = N, p = N, g[0] = n.coerce(g[0]), typeof g[0] != "string" && g.unshift("%O");
        let U = 0;
        g[0] = g[0].replace(/%([a-zA-Z%])/g, (B, me) => {
          if (B === "%%")
            return "%";
          U++;
          const I = n.formatters[me];
          if (typeof I == "function") {
            const ye = g[U];
            B = I.call(E, ye), g.splice(U, 1), U--;
          }
          return B;
        }), n.formatArgs.call(E, g), (E.log || n.log).apply(E, g);
      }
      return v.namespace = d, v.useColors = n.useColors(), v.color = n.selectColor(d), v.extend = s, v.destroy = n.destroy, Object.defineProperty(v, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => m !== null ? m : (_ !== n.namespaces && (_ = n.namespaces, $ = n.enabled(d)), $),
        set: (g) => {
          m = g;
        }
      }), typeof n.init == "function" && n.init(v), v;
    }
    function s(d, p) {
      const m = n(this.namespace + (typeof p > "u" ? ":" : p) + d);
      return m.log = this.log, m;
    }
    function i(d) {
      n.save(d), n.namespaces = d, n.names = [], n.skips = [];
      const p = (typeof d == "string" ? d : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const m of p)
        m[0] === "-" ? n.skips.push(m.slice(1)) : n.names.push(m);
    }
    function a(d, p) {
      let m = 0, _ = 0, $ = -1, v = 0;
      for (; m < d.length; )
        if (_ < p.length && (p[_] === d[m] || p[_] === "*"))
          p[_] === "*" ? ($ = _, v = m, _++) : (m++, _++);
        else if ($ !== -1)
          _ = $ + 1, v++, m = v;
        else
          return !1;
      for (; _ < p.length && p[_] === "*"; )
        _++;
      return _ === p.length;
    }
    function o() {
      const d = [
        ...n.names,
        ...n.skips.map((p) => "-" + p)
      ].join(",");
      return n.enable(""), d;
    }
    function l(d) {
      for (const p of n.skips)
        if (a(d, p))
          return !1;
      for (const p of n.names)
        if (a(d, p))
          return !0;
      return !1;
    }
    function c(d) {
      return d instanceof Error ? d.stack || d.message : d;
    }
    function u() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    return n.enable(n.load()), n;
  }
  return Qo = e, Qo;
}
var ph;
function iI() {
  return ph || (ph = 1, function(e, t) {
    t.formatArgs = n, t.save = s, t.load = i, t.useColors = r, t.storage = a(), t.destroy = /* @__PURE__ */ (() => {
      let l = !1;
      return () => {
        l || (l = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
      };
    })(), t.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function r() {
      if (typeof window < "u" && window.process && (window.process.type === "renderer" || window.process.__nwjs))
        return !0;
      if (typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/))
        return !1;
      let l;
      return typeof document < "u" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window < "u" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator < "u" && navigator.userAgent && (l = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(l[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function n(l) {
      if (l[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + l[0] + (this.useColors ? "%c " : " ") + "+" + e.exports.humanize(this.diff), !this.useColors)
        return;
      const c = "color: " + this.color;
      l.splice(1, 0, c, "color: inherit");
      let u = 0, d = 0;
      l[0].replace(/%[a-zA-Z%]/g, (p) => {
        p !== "%%" && (u++, p === "%c" && (d = u));
      }), l.splice(d, 0, c);
    }
    t.log = console.debug || console.log || (() => {
    });
    function s(l) {
      try {
        l ? t.storage.setItem("debug", l) : t.storage.removeItem("debug");
      } catch {
      }
    }
    function i() {
      let l;
      try {
        l = t.storage.getItem("debug") || t.storage.getItem("DEBUG");
      } catch {
      }
      return !l && typeof process < "u" && "env" in process && (l = process.env.DEBUG), l;
    }
    function a() {
      try {
        return localStorage;
      } catch {
      }
    }
    e.exports = Rg()(t);
    const { formatters: o } = e.exports;
    o.j = function(l) {
      try {
        return JSON.stringify(l);
      } catch (c) {
        return "[UnexpectedJSONParseError]: " + c.message;
      }
    };
  }(Zi, Zi.exports)), Zi.exports;
}
var ea = { exports: {} }, Zo, mh;
function aI() {
  return mh || (mh = 1, Zo = (e, t = process.argv) => {
    const r = e.startsWith("-") ? "" : e.length === 1 ? "-" : "--", n = t.indexOf(r + e), s = t.indexOf("--");
    return n !== -1 && (s === -1 || n < s);
  }), Zo;
}
var el, gh;
function oI() {
  if (gh) return el;
  gh = 1;
  const e = Va, t = Sp, r = aI(), { env: n } = process;
  let s;
  r("no-color") || r("no-colors") || r("color=false") || r("color=never") ? s = 0 : (r("color") || r("colors") || r("color=true") || r("color=always")) && (s = 1), "FORCE_COLOR" in n && (n.FORCE_COLOR === "true" ? s = 1 : n.FORCE_COLOR === "false" ? s = 0 : s = n.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(n.FORCE_COLOR, 10), 3));
  function i(l) {
    return l === 0 ? !1 : {
      level: l,
      hasBasic: !0,
      has256: l >= 2,
      has16m: l >= 3
    };
  }
  function a(l, c) {
    if (s === 0)
      return 0;
    if (r("color=16m") || r("color=full") || r("color=truecolor"))
      return 3;
    if (r("color=256"))
      return 2;
    if (l && !c && s === void 0)
      return 0;
    const u = s || 0;
    if (n.TERM === "dumb")
      return u;
    if (process.platform === "win32") {
      const d = e.release().split(".");
      return Number(d[0]) >= 10 && Number(d[2]) >= 10586 ? Number(d[2]) >= 14931 ? 3 : 2 : 1;
    }
    if ("CI" in n)
      return ["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE"].some((d) => d in n) || n.CI_NAME === "codeship" ? 1 : u;
    if ("TEAMCITY_VERSION" in n)
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(n.TEAMCITY_VERSION) ? 1 : 0;
    if (n.COLORTERM === "truecolor")
      return 3;
    if ("TERM_PROGRAM" in n) {
      const d = parseInt((n.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
      switch (n.TERM_PROGRAM) {
        case "iTerm.app":
          return d >= 3 ? 3 : 2;
        case "Apple_Terminal":
          return 2;
      }
    }
    return /-256(color)?$/i.test(n.TERM) ? 2 : /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(n.TERM) || "COLORTERM" in n ? 1 : u;
  }
  function o(l) {
    const c = a(l, l && l.isTTY);
    return i(c);
  }
  return el = {
    supportsColor: o,
    stdout: i(a(!0, t.isatty(1))),
    stderr: i(a(!0, t.isatty(2)))
  }, el;
}
var yh;
function lI() {
  return yh || (yh = 1, function(e, t) {
    const r = Sp, n = Jy;
    t.init = u, t.log = o, t.formatArgs = i, t.save = l, t.load = c, t.useColors = s, t.destroy = n.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    ), t.colors = [6, 2, 3, 4, 5, 1];
    try {
      const p = oI();
      p && (p.stderr || p).level >= 2 && (t.colors = [
        20,
        21,
        26,
        27,
        32,
        33,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        56,
        57,
        62,
        63,
        68,
        69,
        74,
        75,
        76,
        77,
        78,
        79,
        80,
        81,
        92,
        93,
        98,
        99,
        112,
        113,
        128,
        129,
        134,
        135,
        148,
        149,
        160,
        161,
        162,
        163,
        164,
        165,
        166,
        167,
        168,
        169,
        170,
        171,
        172,
        173,
        178,
        179,
        184,
        185,
        196,
        197,
        198,
        199,
        200,
        201,
        202,
        203,
        204,
        205,
        206,
        207,
        208,
        209,
        214,
        215,
        220,
        221
      ]);
    } catch {
    }
    t.inspectOpts = Object.keys(process.env).filter((p) => /^debug_/i.test(p)).reduce((p, m) => {
      const _ = m.substring(6).toLowerCase().replace(/_([a-z])/g, (v, g) => g.toUpperCase());
      let $ = process.env[m];
      return /^(yes|on|true|enabled)$/i.test($) ? $ = !0 : /^(no|off|false|disabled)$/i.test($) ? $ = !1 : $ === "null" ? $ = null : $ = Number($), p[_] = $, p;
    }, {});
    function s() {
      return "colors" in t.inspectOpts ? !!t.inspectOpts.colors : r.isatty(process.stderr.fd);
    }
    function i(p) {
      const { namespace: m, useColors: _ } = this;
      if (_) {
        const $ = this.color, v = "\x1B[3" + ($ < 8 ? $ : "8;5;" + $), g = `  ${v};1m${m} \x1B[0m`;
        p[0] = g + p[0].split(`
`).join(`
` + g), p.push(v + "m+" + e.exports.humanize(this.diff) + "\x1B[0m");
      } else
        p[0] = a() + m + " " + p[0];
    }
    function a() {
      return t.inspectOpts.hideDate ? "" : (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function o(...p) {
      return process.stderr.write(n.formatWithOptions(t.inspectOpts, ...p) + `
`);
    }
    function l(p) {
      p ? process.env.DEBUG = p : delete process.env.DEBUG;
    }
    function c() {
      return process.env.DEBUG;
    }
    function u(p) {
      p.inspectOpts = {};
      const m = Object.keys(t.inspectOpts);
      for (let _ = 0; _ < m.length; _++)
        p.inspectOpts[m[_]] = t.inspectOpts[m[_]];
    }
    e.exports = Rg()(t);
    const { formatters: d } = e.exports;
    d.o = function(p) {
      return this.inspectOpts.colors = this.useColors, n.inspect(p, this.inspectOpts).split(`
`).map((m) => m.trim()).join(" ");
    }, d.O = function(p) {
      return this.inspectOpts.colors = this.useColors, n.inspect(p, this.inspectOpts);
    };
  }(ea, ea.exports)), ea.exports;
}
typeof process > "u" || process.type === "renderer" || process.browser === !0 || process.__nwjs ? ql.exports = iI() : ql.exports = lI();
var cI = ql.exports, $i = {};
Object.defineProperty($i, "__esModule", { value: !0 });
$i.ProgressCallbackTransform = void 0;
const uI = Ma;
class dI extends uI.Transform {
  constructor(t, r, n) {
    super(), this.total = t, this.cancellationToken = r, this.onProgress = n, this.start = Date.now(), this.transferred = 0, this.delta = 0, this.nextUpdate = this.start + 1e3;
  }
  _transform(t, r, n) {
    if (this.cancellationToken.cancelled) {
      n(new Error("cancelled"), null);
      return;
    }
    this.transferred += t.length, this.delta += t.length;
    const s = Date.now();
    s >= this.nextUpdate && this.transferred !== this.total && (this.nextUpdate = s + 1e3, this.onProgress({
      total: this.total,
      delta: this.delta,
      transferred: this.transferred,
      percent: this.transferred / this.total * 100,
      bytesPerSecond: Math.round(this.transferred / ((s - this.start) / 1e3))
    }), this.delta = 0), n(null, t);
  }
  _flush(t) {
    if (this.cancellationToken.cancelled) {
      t(new Error("cancelled"));
      return;
    }
    this.onProgress({
      total: this.total,
      delta: this.delta,
      transferred: this.total,
      percent: 100,
      bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
    }), this.delta = 0, t(null);
  }
}
$i.ProgressCallbackTransform = dI;
Object.defineProperty(ft, "__esModule", { value: !0 });
ft.DigestTransform = ft.HttpExecutor = ft.HttpError = void 0;
ft.createHttpError = Bl;
ft.parseJson = _I;
ft.configureRequestOptionsFromUrl = Cg;
ft.configureRequestUrl = rd;
ft.safeGetHeader = es;
ft.configureRequestOptions = Ca;
ft.safeStringifyJson = Oa;
const fI = ui, hI = cI, pI = Gt, mI = Ma, Vl = Jr, gI = Kr, $h = gs, yI = $i, on = (0, hI.default)("electron-builder");
function Bl(e, t = null) {
  return new td(e.statusCode || -1, `${e.statusCode} ${e.statusMessage}` + (t == null ? "" : `
` + JSON.stringify(t, null, "  ")) + `
Headers: ` + Oa(e.headers), t);
}
const $I = /* @__PURE__ */ new Map([
  [429, "Too many requests"],
  [400, "Bad request"],
  [403, "Forbidden"],
  [404, "Not found"],
  [405, "Method not allowed"],
  [406, "Not acceptable"],
  [408, "Request timeout"],
  [413, "Request entity too large"],
  [500, "Internal server error"],
  [502, "Bad gateway"],
  [503, "Service unavailable"],
  [504, "Gateway timeout"],
  [505, "HTTP version not supported"]
]);
class td extends Error {
  constructor(t, r = `HTTP error: ${$I.get(t) || t}`, n = null) {
    super(r), this.statusCode = t, this.description = n, this.name = "HttpError", this.code = `HTTP_ERROR_${t}`;
  }
  isServerError() {
    return this.statusCode >= 500 && this.statusCode <= 599;
  }
}
ft.HttpError = td;
function _I(e) {
  return e.then((t) => t == null || t.length === 0 ? null : JSON.parse(t));
}
class Hn {
  constructor() {
    this.maxRedirects = 10;
  }
  request(t, r = new gI.CancellationToken(), n) {
    Ca(t);
    const s = n == null ? void 0 : JSON.stringify(n), i = s ? Buffer.from(s) : void 0;
    if (i != null) {
      on(s);
      const { headers: a, ...o } = t;
      t = {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": i.length,
          ...a
        },
        ...o
      };
    }
    return this.doApiRequest(t, r, (a) => a.end(i));
  }
  doApiRequest(t, r, n, s = 0) {
    return on.enabled && on(`Request: ${Oa(t)}`), r.createPromise((i, a, o) => {
      const l = this.createRequest(t, (c) => {
        try {
          this.handleResponse(c, t, r, i, a, s, n);
        } catch (u) {
          a(u);
        }
      });
      this.addErrorAndTimeoutHandlers(l, a, t.timeout), this.addRedirectHandlers(l, t, a, s, (c) => {
        this.doApiRequest(c, r, n, s).then(i).catch(a);
      }), n(l, a), o(() => l.abort());
    });
  }
  // noinspection JSUnusedLocalSymbols
  // eslint-disable-next-line
  addRedirectHandlers(t, r, n, s, i) {
  }
  addErrorAndTimeoutHandlers(t, r, n = 60 * 1e3) {
    this.addTimeOutHandler(t, r, n), t.on("error", r), t.on("aborted", () => {
      r(new Error("Request has been aborted by the server"));
    });
  }
  handleResponse(t, r, n, s, i, a, o) {
    var l;
    if (on.enabled && on(`Response: ${t.statusCode} ${t.statusMessage}, request options: ${Oa(r)}`), t.statusCode === 404) {
      i(Bl(t, `method: ${r.method || "GET"} url: ${r.protocol || "https:"}//${r.hostname}${r.port ? `:${r.port}` : ""}${r.path}

Please double check that your authentication token is correct. Due to security reasons, actual status maybe not reported, but 404.
`));
      return;
    } else if (t.statusCode === 204) {
      s();
      return;
    }
    const c = (l = t.statusCode) !== null && l !== void 0 ? l : 0, u = c >= 300 && c < 400, d = es(t, "location");
    if (u && d != null) {
      if (a > this.maxRedirects) {
        i(this.createMaxRedirectError());
        return;
      }
      this.doApiRequest(Hn.prepareRedirectUrlOptions(d, r), n, o, a).then(s).catch(i);
      return;
    }
    t.setEncoding("utf8");
    let p = "";
    t.on("error", i), t.on("data", (m) => p += m), t.on("end", () => {
      try {
        if (t.statusCode != null && t.statusCode >= 400) {
          const m = es(t, "content-type"), _ = m != null && (Array.isArray(m) ? m.find(($) => $.includes("json")) != null : m.includes("json"));
          i(Bl(t, `method: ${r.method || "GET"} url: ${r.protocol || "https:"}//${r.hostname}${r.port ? `:${r.port}` : ""}${r.path}

          Data:
          ${_ ? JSON.stringify(JSON.parse(p)) : p}
          `));
        } else
          s(p.length === 0 ? null : p);
      } catch (m) {
        i(m);
      }
    });
  }
  async downloadToBuffer(t, r) {
    return await r.cancellationToken.createPromise((n, s, i) => {
      const a = [], o = {
        headers: r.headers || void 0,
        // because PrivateGitHubProvider requires HttpExecutor.prepareRedirectUrlOptions logic, so, we need to redirect manually
        redirect: "manual"
      };
      rd(t, o), Ca(o), this.doDownload(o, {
        destination: null,
        options: r,
        onCancel: i,
        callback: (l) => {
          l == null ? n(Buffer.concat(a)) : s(l);
        },
        responseHandler: (l, c) => {
          let u = 0;
          l.on("data", (d) => {
            if (u += d.length, u > 524288e3) {
              c(new Error("Maximum allowed size is 500 MB"));
              return;
            }
            a.push(d);
          }), l.on("end", () => {
            c(null);
          });
        }
      }, 0);
    });
  }
  doDownload(t, r, n) {
    const s = this.createRequest(t, (i) => {
      if (i.statusCode >= 400) {
        r.callback(new Error(`Cannot download "${t.protocol || "https:"}//${t.hostname}${t.path}", status ${i.statusCode}: ${i.statusMessage}`));
        return;
      }
      i.on("error", r.callback);
      const a = es(i, "location");
      if (a != null) {
        n < this.maxRedirects ? this.doDownload(Hn.prepareRedirectUrlOptions(a, t), r, n++) : r.callback(this.createMaxRedirectError());
        return;
      }
      r.responseHandler == null ? wI(r, i) : r.responseHandler(i, r.callback);
    });
    this.addErrorAndTimeoutHandlers(s, r.callback, t.timeout), this.addRedirectHandlers(s, t, r.callback, n, (i) => {
      this.doDownload(i, r, n++);
    }), s.end();
  }
  createMaxRedirectError() {
    return new Error(`Too many redirects (> ${this.maxRedirects})`);
  }
  addTimeOutHandler(t, r, n) {
    t.on("socket", (s) => {
      s.setTimeout(n, () => {
        t.abort(), r(new Error("Request timed out"));
      });
    });
  }
  static prepareRedirectUrlOptions(t, r) {
    const n = Cg(t, { ...r }), s = n.headers;
    if (s != null && s.authorization) {
      const i = Hn.reconstructOriginalUrl(r), a = Ng(t, r);
      Hn.isCrossOriginRedirect(i, a) && (on.enabled && on(`Given the cross-origin redirect (from ${i.host} to ${a.host}), the Authorization header will be stripped out.`), delete s.authorization);
    }
    return n;
  }
  static reconstructOriginalUrl(t) {
    const r = t.protocol || "https:";
    if (!t.hostname)
      throw new Error("Missing hostname in request options");
    const n = t.hostname, s = t.port ? `:${t.port}` : "", i = t.path || "/";
    return new Vl.URL(`${r}//${n}${s}${i}`);
  }
  static isCrossOriginRedirect(t, r) {
    if (t.hostname.toLowerCase() !== r.hostname.toLowerCase())
      return !0;
    if (t.protocol === "http:" && // This can be replaced with `!originalUrl.port`, but for the sake of clarity.
    ["80", ""].includes(t.port) && r.protocol === "https:" && // This can be replaced with `!redirectUrl.port`, but for the sake of clarity.
    ["443", ""].includes(r.port))
      return !1;
    if (t.protocol !== r.protocol)
      return !0;
    const n = t.port, s = r.port;
    return n !== s;
  }
  static retryOnServerError(t, r = 3) {
    for (let n = 0; ; n++)
      try {
        return t();
      } catch (s) {
        if (n < r && (s instanceof td && s.isServerError() || s.code === "EPIPE"))
          continue;
        throw s;
      }
  }
}
ft.HttpExecutor = Hn;
function Ng(e, t) {
  try {
    return new Vl.URL(e);
  } catch {
    const r = t.hostname, n = t.protocol || "https:", s = t.port ? `:${t.port}` : "", i = `${n}//${r}${s}`;
    return new Vl.URL(e, i);
  }
}
function Cg(e, t) {
  const r = Ca(t), n = Ng(e, t);
  return rd(n, r), r;
}
function rd(e, t) {
  t.protocol = e.protocol, t.hostname = e.hostname, e.port ? t.port = e.port : t.port && delete t.port, t.path = e.pathname + e.search;
}
class Hl extends mI.Transform {
  // noinspection JSUnusedGlobalSymbols
  get actual() {
    return this._actual;
  }
  constructor(t, r = "sha512", n = "base64") {
    super(), this.expected = t, this.algorithm = r, this.encoding = n, this._actual = null, this.isValidateOnEnd = !0, this.digester = (0, fI.createHash)(r);
  }
  // noinspection JSUnusedGlobalSymbols
  _transform(t, r, n) {
    this.digester.update(t), n(null, t);
  }
  // noinspection JSUnusedGlobalSymbols
  _flush(t) {
    if (this._actual = this.digester.digest(this.encoding), this.isValidateOnEnd)
      try {
        this.validate();
      } catch (r) {
        t(r);
        return;
      }
    t(null);
  }
  validate() {
    if (this._actual == null)
      throw (0, $h.newError)("Not finished yet", "ERR_STREAM_NOT_FINISHED");
    if (this._actual !== this.expected)
      throw (0, $h.newError)(`${this.algorithm} checksum mismatch, expected ${this.expected}, got ${this._actual}`, "ERR_CHECKSUM_MISMATCH");
    return null;
  }
}
ft.DigestTransform = Hl;
function vI(e, t, r) {
  return e != null && t != null && e !== t ? (r(new Error(`checksum mismatch: expected ${t} but got ${e} (X-Checksum-Sha2 header)`)), !1) : !0;
}
function es(e, t) {
  const r = e.headers[t];
  return r == null ? null : Array.isArray(r) ? r.length === 0 ? null : r[r.length - 1] : r;
}
function wI(e, t) {
  if (!vI(es(t, "X-Checksum-Sha2"), e.options.sha2, e.callback))
    return;
  const r = [];
  if (e.options.onProgress != null) {
    const a = es(t, "content-length");
    a != null && r.push(new yI.ProgressCallbackTransform(parseInt(a, 10), e.options.cancellationToken, e.options.onProgress));
  }
  const n = e.options.sha512;
  n != null ? r.push(new Hl(n, "sha512", n.length === 128 && !n.includes("+") && !n.includes("Z") && !n.includes("=") ? "hex" : "base64")) : e.options.sha2 != null && r.push(new Hl(e.options.sha2, "sha256", "hex"));
  const s = (0, pI.createWriteStream)(e.destination);
  r.push(s);
  let i = t;
  for (const a of r)
    a.on("error", (o) => {
      s.close(), e.options.cancellationToken.cancelled || e.callback(o);
    }), i = i.pipe(a);
  s.on("finish", () => {
    s.close(e.callback);
  });
}
function Ca(e, t, r) {
  r != null && (e.method = r), e.headers = { ...e.headers };
  const n = e.headers;
  return t != null && (n.authorization = t.startsWith("Basic") || t.startsWith("Bearer") ? t : `token ${t}`), n["User-Agent"] == null && (n["User-Agent"] = "electron-builder"), (r == null || r === "GET" || n["Cache-Control"] == null) && (n["Cache-Control"] = "no-cache"), e.protocol == null && process.versions.electron != null && (e.protocol = "https:"), e;
}
function Oa(e, t) {
  return JSON.stringify(e, (r, n) => r.endsWith("Authorization") || r.endsWith("authorization") || r.endsWith("Password") || r.endsWith("PASSWORD") || r.endsWith("Token") || r.includes("password") || r.includes("token") || t != null && t.has(r) ? "<stripped sensitive data>" : n, 2);
}
var lo = {};
Object.defineProperty(lo, "__esModule", { value: !0 });
lo.MemoLazy = void 0;
class EI {
  constructor(t, r) {
    this.selector = t, this.creator = r, this.selected = void 0, this._value = void 0;
  }
  get hasValue() {
    return this._value !== void 0;
  }
  get value() {
    const t = this.selector();
    if (this._value !== void 0 && Og(this.selected, t))
      return this._value;
    this.selected = t;
    const r = this.creator(t);
    return this.value = r, r;
  }
  set value(t) {
    this._value = t;
  }
}
lo.MemoLazy = EI;
function Og(e, t) {
  if (typeof e == "object" && e !== null && (typeof t == "object" && t !== null)) {
    const s = Object.keys(e), i = Object.keys(t);
    return s.length === i.length && s.every((a) => Og(e[a], t[a]));
  }
  return e === t;
}
var _i = {};
Object.defineProperty(_i, "__esModule", { value: !0 });
_i.githubUrl = bI;
_i.githubTagPrefix = SI;
_i.getS3LikeProviderBaseUrl = TI;
function bI(e, t = "github.com") {
  return `${e.protocol || "https"}://${e.host || t}`;
}
function SI(e) {
  var t;
  return e.tagNamePrefix ? e.tagNamePrefix : !((t = e.vPrefixedTagName) !== null && t !== void 0) || t ? "v" : "";
}
function TI(e) {
  const t = e.provider;
  if (t === "s3")
    return PI(e);
  if (t === "spaces")
    return AI(e);
  throw new Error(`Not supported provider: ${t}`);
}
function PI(e) {
  let t;
  if (e.accelerate == !0)
    t = `https://${e.bucket}.s3-accelerate.amazonaws.com`;
  else if (e.endpoint != null)
    t = `${e.endpoint}/${e.bucket}`;
  else if (e.bucket.includes(".")) {
    if (e.region == null)
      throw new Error(`Bucket name "${e.bucket}" includes a dot, but S3 region is missing`);
    e.region === "us-east-1" ? t = `https://s3.amazonaws.com/${e.bucket}` : t = `https://s3-${e.region}.amazonaws.com/${e.bucket}`;
  } else e.region === "cn-north-1" ? t = `https://${e.bucket}.s3.${e.region}.amazonaws.com.cn` : t = `https://${e.bucket}.s3.amazonaws.com`;
  return Ig(t, e.path);
}
function Ig(e, t) {
  return t != null && t.length > 0 && (t.startsWith("/") || (e += "/"), e += t), e;
}
function AI(e) {
  if (e.name == null)
    throw new Error("name is missing");
  if (e.region == null)
    throw new Error("region is missing");
  return Ig(`https://${e.name}.${e.region}.digitaloceanspaces.com`, e.path);
}
var nd = {};
Object.defineProperty(nd, "__esModule", { value: !0 });
nd.retry = Dg;
const RI = Kr;
async function Dg(e, t) {
  var r;
  const { retries: n, interval: s, backoff: i = 0, attempt: a = 0, shouldRetry: o, cancellationToken: l = new RI.CancellationToken() } = t;
  try {
    return await e();
  } catch (c) {
    if (await Promise.resolve((r = o == null ? void 0 : o(c)) !== null && r !== void 0 ? r : !0) && n > 0 && !l.cancelled)
      return await new Promise((u) => setTimeout(u, s + i * a)), await Dg(e, { ...t, retries: n - 1, attempt: a + 1 });
    throw c;
  }
}
var sd = {};
Object.defineProperty(sd, "__esModule", { value: !0 });
sd.parseDn = NI;
function NI(e) {
  let t = !1, r = null, n = "", s = 0;
  e = e.trim();
  const i = /* @__PURE__ */ new Map();
  for (let a = 0; a <= e.length; a++) {
    if (a === e.length) {
      r !== null && i.set(r, n);
      break;
    }
    const o = e[a];
    if (t) {
      if (o === '"') {
        t = !1;
        continue;
      }
    } else {
      if (o === '"') {
        t = !0;
        continue;
      }
      if (o === "\\") {
        a++;
        const l = parseInt(e.slice(a, a + 2), 16);
        Number.isNaN(l) ? n += e[a] : (a++, n += String.fromCharCode(l));
        continue;
      }
      if (r === null && o === "=") {
        r = n, n = "";
        continue;
      }
      if (o === "," || o === ";" || o === "+") {
        r !== null && i.set(r, n), r = null, n = "";
        continue;
      }
    }
    if (o === " " && !t) {
      if (n.length === 0)
        continue;
      if (a > s) {
        let l = a;
        for (; e[l] === " "; )
          l++;
        s = l;
      }
      if (s >= e.length || e[s] === "," || e[s] === ";" || r === null && e[s] === "=" || r !== null && e[s] === "+") {
        a = s - 1;
        continue;
      }
    }
    n += o;
  }
  return i;
}
var is = {};
Object.defineProperty(is, "__esModule", { value: !0 });
is.nil = is.UUID = void 0;
const kg = ui, Ug = gs, CI = "options.name must be either a string or a Buffer", _h = (0, kg.randomBytes)(16);
_h[0] = _h[0] | 1;
const $a = {}, pe = [];
for (let e = 0; e < 256; e++) {
  const t = (e + 256).toString(16).substr(1);
  $a[t] = e, pe[e] = t;
}
class Pn {
  constructor(t) {
    this.ascii = null, this.binary = null;
    const r = Pn.check(t);
    if (!r)
      throw new Error("not a UUID");
    this.version = r.version, r.format === "ascii" ? this.ascii = t : this.binary = t;
  }
  static v5(t, r) {
    return OI(t, "sha1", 80, r);
  }
  toString() {
    return this.ascii == null && (this.ascii = II(this.binary)), this.ascii;
  }
  inspect() {
    return `UUID v${this.version} ${this.toString()}`;
  }
  static check(t, r = 0) {
    if (typeof t == "string")
      return t = t.toLowerCase(), /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-([a-f0-9]{12})$/.test(t) ? t === "00000000-0000-0000-0000-000000000000" ? { version: void 0, variant: "nil", format: "ascii" } : {
        version: ($a[t[14] + t[15]] & 240) >> 4,
        variant: vh(($a[t[19] + t[20]] & 224) >> 5),
        format: "ascii"
      } : !1;
    if (Buffer.isBuffer(t)) {
      if (t.length < r + 16)
        return !1;
      let n = 0;
      for (; n < 16 && t[r + n] === 0; n++)
        ;
      return n === 16 ? { version: void 0, variant: "nil", format: "binary" } : {
        version: (t[r + 6] & 240) >> 4,
        variant: vh((t[r + 8] & 224) >> 5),
        format: "binary"
      };
    }
    throw (0, Ug.newError)("Unknown type of uuid", "ERR_UNKNOWN_UUID_TYPE");
  }
  // read stringified uuid into a Buffer
  static parse(t) {
    const r = Buffer.allocUnsafe(16);
    let n = 0;
    for (let s = 0; s < 16; s++)
      r[s] = $a[t[n++] + t[n++]], (s === 3 || s === 5 || s === 7 || s === 9) && (n += 1);
    return r;
  }
}
is.UUID = Pn;
Pn.OID = Pn.parse("6ba7b812-9dad-11d1-80b4-00c04fd430c8");
function vh(e) {
  switch (e) {
    case 0:
    case 1:
    case 3:
      return "ncs";
    case 4:
    case 5:
      return "rfc4122";
    case 6:
      return "microsoft";
    default:
      return "future";
  }
}
var Xs;
(function(e) {
  e[e.ASCII = 0] = "ASCII", e[e.BINARY = 1] = "BINARY", e[e.OBJECT = 2] = "OBJECT";
})(Xs || (Xs = {}));
function OI(e, t, r, n, s = Xs.ASCII) {
  const i = (0, kg.createHash)(t);
  if (typeof e != "string" && !Buffer.isBuffer(e))
    throw (0, Ug.newError)(CI, "ERR_INVALID_UUID_NAME");
  i.update(n), i.update(e);
  const o = i.digest();
  let l;
  switch (s) {
    case Xs.BINARY:
      o[6] = o[6] & 15 | r, o[8] = o[8] & 63 | 128, l = o;
      break;
    case Xs.OBJECT:
      o[6] = o[6] & 15 | r, o[8] = o[8] & 63 | 128, l = new Pn(o);
      break;
    default:
      l = pe[o[0]] + pe[o[1]] + pe[o[2]] + pe[o[3]] + "-" + pe[o[4]] + pe[o[5]] + "-" + pe[o[6] & 15 | r] + pe[o[7]] + "-" + pe[o[8] & 63 | 128] + pe[o[9]] + "-" + pe[o[10]] + pe[o[11]] + pe[o[12]] + pe[o[13]] + pe[o[14]] + pe[o[15]];
      break;
  }
  return l;
}
function II(e) {
  return pe[e[0]] + pe[e[1]] + pe[e[2]] + pe[e[3]] + "-" + pe[e[4]] + pe[e[5]] + "-" + pe[e[6]] + pe[e[7]] + "-" + pe[e[8]] + pe[e[9]] + "-" + pe[e[10]] + pe[e[11]] + pe[e[12]] + pe[e[13]] + pe[e[14]] + pe[e[15]];
}
is.nil = new Pn("00000000-0000-0000-0000-000000000000");
var vi = {}, Fg = {};
(function(e) {
  (function(t) {
    t.parser = function(w, h) {
      return new n(w, h);
    }, t.SAXParser = n, t.SAXStream = u, t.createStream = c, t.MAX_BUFFER_LENGTH = 64 * 1024;
    var r = [
      "comment",
      "sgmlDecl",
      "textNode",
      "tagName",
      "doctype",
      "procInstName",
      "procInstBody",
      "entity",
      "attribName",
      "attribValue",
      "cdata",
      "script"
    ];
    t.EVENTS = [
      "text",
      "processinginstruction",
      "sgmldeclaration",
      "doctype",
      "comment",
      "opentagstart",
      "attribute",
      "opentag",
      "closetag",
      "opencdata",
      "cdata",
      "closecdata",
      "error",
      "end",
      "ready",
      "script",
      "opennamespace",
      "closenamespace"
    ];
    function n(w, h) {
      if (!(this instanceof n))
        return new n(w, h);
      var k = this;
      i(k), k.q = k.c = "", k.bufferCheckPosition = t.MAX_BUFFER_LENGTH, k.opt = h || {}, k.opt.lowercase = k.opt.lowercase || k.opt.lowercasetags, k.looseCase = k.opt.lowercase ? "toLowerCase" : "toUpperCase", k.tags = [], k.closed = k.closedRoot = k.sawRoot = !1, k.tag = k.error = null, k.strict = !!w, k.noscript = !!(w || k.opt.noscript), k.state = I.BEGIN, k.strictEntities = k.opt.strictEntities, k.ENTITIES = k.strictEntities ? Object.create(t.XML_ENTITIES) : Object.create(t.ENTITIES), k.attribList = [], k.opt.xmlns && (k.ns = Object.create($)), k.opt.unquotedAttributeValues === void 0 && (k.opt.unquotedAttributeValues = !w), k.trackPosition = k.opt.position !== !1, k.trackPosition && (k.position = k.line = k.column = 0), W(k, "onready");
    }
    Object.create || (Object.create = function(w) {
      function h() {
      }
      h.prototype = w;
      var k = new h();
      return k;
    }), Object.keys || (Object.keys = function(w) {
      var h = [];
      for (var k in w) w.hasOwnProperty(k) && h.push(k);
      return h;
    });
    function s(w) {
      for (var h = Math.max(t.MAX_BUFFER_LENGTH, 10), k = 0, R = 0, z = r.length; R < z; R++) {
        var he = w[r[R]].length;
        if (he > h)
          switch (r[R]) {
            case "textNode":
              se(w);
              break;
            case "cdata":
              x(w, "oncdata", w.cdata), w.cdata = "";
              break;
            case "script":
              x(w, "onscript", w.script), w.script = "";
              break;
            default:
              L(w, "Max buffer length exceeded: " + r[R]);
          }
        k = Math.max(k, he);
      }
      var ge = t.MAX_BUFFER_LENGTH - k;
      w.bufferCheckPosition = ge + w.position;
    }
    function i(w) {
      for (var h = 0, k = r.length; h < k; h++)
        w[r[h]] = "";
    }
    function a(w) {
      se(w), w.cdata !== "" && (x(w, "oncdata", w.cdata), w.cdata = ""), w.script !== "" && (x(w, "onscript", w.script), w.script = "");
    }
    n.prototype = {
      end: function() {
        K(this);
      },
      write: P,
      resume: function() {
        return this.error = null, this;
      },
      close: function() {
        return this.write(null);
      },
      flush: function() {
        a(this);
      }
    };
    var o;
    try {
      o = require("stream").Stream;
    } catch {
      o = function() {
      };
    }
    o || (o = function() {
    });
    var l = t.EVENTS.filter(function(w) {
      return w !== "error" && w !== "end";
    });
    function c(w, h) {
      return new u(w, h);
    }
    function u(w, h) {
      if (!(this instanceof u))
        return new u(w, h);
      o.apply(this), this._parser = new n(w, h), this.writable = !0, this.readable = !0;
      var k = this;
      this._parser.onend = function() {
        k.emit("end");
      }, this._parser.onerror = function(R) {
        k.emit("error", R), k._parser.error = null;
      }, this._decoder = null, l.forEach(function(R) {
        Object.defineProperty(k, "on" + R, {
          get: function() {
            return k._parser["on" + R];
          },
          set: function(z) {
            if (!z)
              return k.removeAllListeners(R), k._parser["on" + R] = z, z;
            k.on(R, z);
          },
          enumerable: !0,
          configurable: !1
        });
      });
    }
    u.prototype = Object.create(o.prototype, {
      constructor: {
        value: u
      }
    }), u.prototype.write = function(w) {
      if (typeof Buffer == "function" && typeof Buffer.isBuffer == "function" && Buffer.isBuffer(w)) {
        if (!this._decoder) {
          var h = Qy.StringDecoder;
          this._decoder = new h("utf8");
        }
        w = this._decoder.write(w);
      }
      return this._parser.write(w.toString()), this.emit("data", w), !0;
    }, u.prototype.end = function(w) {
      return w && w.length && this.write(w), this._parser.end(), !0;
    }, u.prototype.on = function(w, h) {
      var k = this;
      return !k._parser["on" + w] && l.indexOf(w) !== -1 && (k._parser["on" + w] = function() {
        var R = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);
        R.splice(0, 0, w), k.emit.apply(k, R);
      }), o.prototype.on.call(k, w, h);
    };
    var d = "[CDATA[", p = "DOCTYPE", m = "http://www.w3.org/XML/1998/namespace", _ = "http://www.w3.org/2000/xmlns/", $ = { xml: m, xmlns: _ }, v = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, g = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/, E = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, N = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
    function O(w) {
      return w === " " || w === `
` || w === "\r" || w === "	";
    }
    function U(w) {
      return w === '"' || w === "'";
    }
    function q(w) {
      return w === ">" || O(w);
    }
    function B(w, h) {
      return w.test(h);
    }
    function me(w, h) {
      return !B(w, h);
    }
    var I = 0;
    t.STATE = {
      BEGIN: I++,
      // leading byte order mark or whitespace
      BEGIN_WHITESPACE: I++,
      // leading whitespace
      TEXT: I++,
      // general stuff
      TEXT_ENTITY: I++,
      // &amp and such.
      OPEN_WAKA: I++,
      // <
      SGML_DECL: I++,
      // <!BLARG
      SGML_DECL_QUOTED: I++,
      // <!BLARG foo "bar
      DOCTYPE: I++,
      // <!DOCTYPE
      DOCTYPE_QUOTED: I++,
      // <!DOCTYPE "//blah
      DOCTYPE_DTD: I++,
      // <!DOCTYPE "//blah" [ ...
      DOCTYPE_DTD_QUOTED: I++,
      // <!DOCTYPE "//blah" [ "foo
      COMMENT_STARTING: I++,
      // <!-
      COMMENT: I++,
      // <!--
      COMMENT_ENDING: I++,
      // <!-- blah -
      COMMENT_ENDED: I++,
      // <!-- blah --
      CDATA: I++,
      // <![CDATA[ something
      CDATA_ENDING: I++,
      // ]
      CDATA_ENDING_2: I++,
      // ]]
      PROC_INST: I++,
      // <?hi
      PROC_INST_BODY: I++,
      // <?hi there
      PROC_INST_ENDING: I++,
      // <?hi "there" ?
      OPEN_TAG: I++,
      // <strong
      OPEN_TAG_SLASH: I++,
      // <strong /
      ATTRIB: I++,
      // <a
      ATTRIB_NAME: I++,
      // <a foo
      ATTRIB_NAME_SAW_WHITE: I++,
      // <a foo _
      ATTRIB_VALUE: I++,
      // <a foo=
      ATTRIB_VALUE_QUOTED: I++,
      // <a foo="bar
      ATTRIB_VALUE_CLOSED: I++,
      // <a foo="bar"
      ATTRIB_VALUE_UNQUOTED: I++,
      // <a foo=bar
      ATTRIB_VALUE_ENTITY_Q: I++,
      // <foo bar="&quot;"
      ATTRIB_VALUE_ENTITY_U: I++,
      // <foo bar=&quot
      CLOSE_TAG: I++,
      // </a
      CLOSE_TAG_SAW_WHITE: I++,
      // </a   >
      SCRIPT: I++,
      // <script> ...
      SCRIPT_ENDING: I++
      // <script> ... <
    }, t.XML_ENTITIES = {
      amp: "&",
      gt: ">",
      lt: "<",
      quot: '"',
      apos: "'"
    }, t.ENTITIES = {
      amp: "&",
      gt: ">",
      lt: "<",
      quot: '"',
      apos: "'",
      AElig: 198,
      Aacute: 193,
      Acirc: 194,
      Agrave: 192,
      Aring: 197,
      Atilde: 195,
      Auml: 196,
      Ccedil: 199,
      ETH: 208,
      Eacute: 201,
      Ecirc: 202,
      Egrave: 200,
      Euml: 203,
      Iacute: 205,
      Icirc: 206,
      Igrave: 204,
      Iuml: 207,
      Ntilde: 209,
      Oacute: 211,
      Ocirc: 212,
      Ograve: 210,
      Oslash: 216,
      Otilde: 213,
      Ouml: 214,
      THORN: 222,
      Uacute: 218,
      Ucirc: 219,
      Ugrave: 217,
      Uuml: 220,
      Yacute: 221,
      aacute: 225,
      acirc: 226,
      aelig: 230,
      agrave: 224,
      aring: 229,
      atilde: 227,
      auml: 228,
      ccedil: 231,
      eacute: 233,
      ecirc: 234,
      egrave: 232,
      eth: 240,
      euml: 235,
      iacute: 237,
      icirc: 238,
      igrave: 236,
      iuml: 239,
      ntilde: 241,
      oacute: 243,
      ocirc: 244,
      ograve: 242,
      oslash: 248,
      otilde: 245,
      ouml: 246,
      szlig: 223,
      thorn: 254,
      uacute: 250,
      ucirc: 251,
      ugrave: 249,
      uuml: 252,
      yacute: 253,
      yuml: 255,
      copy: 169,
      reg: 174,
      nbsp: 160,
      iexcl: 161,
      cent: 162,
      pound: 163,
      curren: 164,
      yen: 165,
      brvbar: 166,
      sect: 167,
      uml: 168,
      ordf: 170,
      laquo: 171,
      not: 172,
      shy: 173,
      macr: 175,
      deg: 176,
      plusmn: 177,
      sup1: 185,
      sup2: 178,
      sup3: 179,
      acute: 180,
      micro: 181,
      para: 182,
      middot: 183,
      cedil: 184,
      ordm: 186,
      raquo: 187,
      frac14: 188,
      frac12: 189,
      frac34: 190,
      iquest: 191,
      times: 215,
      divide: 247,
      OElig: 338,
      oelig: 339,
      Scaron: 352,
      scaron: 353,
      Yuml: 376,
      fnof: 402,
      circ: 710,
      tilde: 732,
      Alpha: 913,
      Beta: 914,
      Gamma: 915,
      Delta: 916,
      Epsilon: 917,
      Zeta: 918,
      Eta: 919,
      Theta: 920,
      Iota: 921,
      Kappa: 922,
      Lambda: 923,
      Mu: 924,
      Nu: 925,
      Xi: 926,
      Omicron: 927,
      Pi: 928,
      Rho: 929,
      Sigma: 931,
      Tau: 932,
      Upsilon: 933,
      Phi: 934,
      Chi: 935,
      Psi: 936,
      Omega: 937,
      alpha: 945,
      beta: 946,
      gamma: 947,
      delta: 948,
      epsilon: 949,
      zeta: 950,
      eta: 951,
      theta: 952,
      iota: 953,
      kappa: 954,
      lambda: 955,
      mu: 956,
      nu: 957,
      xi: 958,
      omicron: 959,
      pi: 960,
      rho: 961,
      sigmaf: 962,
      sigma: 963,
      tau: 964,
      upsilon: 965,
      phi: 966,
      chi: 967,
      psi: 968,
      omega: 969,
      thetasym: 977,
      upsih: 978,
      piv: 982,
      ensp: 8194,
      emsp: 8195,
      thinsp: 8201,
      zwnj: 8204,
      zwj: 8205,
      lrm: 8206,
      rlm: 8207,
      ndash: 8211,
      mdash: 8212,
      lsquo: 8216,
      rsquo: 8217,
      sbquo: 8218,
      ldquo: 8220,
      rdquo: 8221,
      bdquo: 8222,
      dagger: 8224,
      Dagger: 8225,
      bull: 8226,
      hellip: 8230,
      permil: 8240,
      prime: 8242,
      Prime: 8243,
      lsaquo: 8249,
      rsaquo: 8250,
      oline: 8254,
      frasl: 8260,
      euro: 8364,
      image: 8465,
      weierp: 8472,
      real: 8476,
      trade: 8482,
      alefsym: 8501,
      larr: 8592,
      uarr: 8593,
      rarr: 8594,
      darr: 8595,
      harr: 8596,
      crarr: 8629,
      lArr: 8656,
      uArr: 8657,
      rArr: 8658,
      dArr: 8659,
      hArr: 8660,
      forall: 8704,
      part: 8706,
      exist: 8707,
      empty: 8709,
      nabla: 8711,
      isin: 8712,
      notin: 8713,
      ni: 8715,
      prod: 8719,
      sum: 8721,
      minus: 8722,
      lowast: 8727,
      radic: 8730,
      prop: 8733,
      infin: 8734,
      ang: 8736,
      and: 8743,
      or: 8744,
      cap: 8745,
      cup: 8746,
      int: 8747,
      there4: 8756,
      sim: 8764,
      cong: 8773,
      asymp: 8776,
      ne: 8800,
      equiv: 8801,
      le: 8804,
      ge: 8805,
      sub: 8834,
      sup: 8835,
      nsub: 8836,
      sube: 8838,
      supe: 8839,
      oplus: 8853,
      otimes: 8855,
      perp: 8869,
      sdot: 8901,
      lceil: 8968,
      rceil: 8969,
      lfloor: 8970,
      rfloor: 8971,
      lang: 9001,
      rang: 9002,
      loz: 9674,
      spades: 9824,
      clubs: 9827,
      hearts: 9829,
      diams: 9830
    }, Object.keys(t.ENTITIES).forEach(function(w) {
      var h = t.ENTITIES[w], k = typeof h == "number" ? String.fromCharCode(h) : h;
      t.ENTITIES[w] = k;
    });
    for (var ye in t.STATE)
      t.STATE[t.STATE[ye]] = ye;
    I = t.STATE;
    function W(w, h, k) {
      w[h] && w[h](k);
    }
    function x(w, h, k) {
      w.textNode && se(w), W(w, h, k);
    }
    function se(w) {
      w.textNode = F(w.opt, w.textNode), w.textNode && W(w, "ontext", w.textNode), w.textNode = "";
    }
    function F(w, h) {
      return w.trim && (h = h.trim()), w.normalize && (h = h.replace(/\s+/g, " ")), h;
    }
    function L(w, h) {
      return se(w), w.trackPosition && (h += `
Line: ` + w.line + `
Column: ` + w.column + `
Char: ` + w.c), h = new Error(h), w.error = h, W(w, "onerror", h), w;
    }
    function K(w) {
      return w.sawRoot && !w.closedRoot && M(w, "Unclosed root tag"), w.state !== I.BEGIN && w.state !== I.BEGIN_WHITESPACE && w.state !== I.TEXT && L(w, "Unexpected end"), se(w), w.c = "", w.closed = !0, W(w, "onend"), n.call(w, w.strict, w.opt), w;
    }
    function M(w, h) {
      if (typeof w != "object" || !(w instanceof n))
        throw new Error("bad call to strictFail");
      w.strict && L(w, h);
    }
    function X(w) {
      w.strict || (w.tagName = w.tagName[w.looseCase]());
      var h = w.tags[w.tags.length - 1] || w, k = w.tag = { name: w.tagName, attributes: {} };
      w.opt.xmlns && (k.ns = h.ns), w.attribList.length = 0, x(w, "onopentagstart", k);
    }
    function H(w, h) {
      var k = w.indexOf(":"), R = k < 0 ? ["", w] : w.split(":"), z = R[0], he = R[1];
      return h && w === "xmlns" && (z = "xmlns", he = ""), { prefix: z, local: he };
    }
    function C(w) {
      if (w.strict || (w.attribName = w.attribName[w.looseCase]()), w.attribList.indexOf(w.attribName) !== -1 || w.tag.attributes.hasOwnProperty(w.attribName)) {
        w.attribName = w.attribValue = "";
        return;
      }
      if (w.opt.xmlns) {
        var h = H(w.attribName, !0), k = h.prefix, R = h.local;
        if (k === "xmlns")
          if (R === "xml" && w.attribValue !== m)
            M(
              w,
              "xml: prefix must be bound to " + m + `
Actual: ` + w.attribValue
            );
          else if (R === "xmlns" && w.attribValue !== _)
            M(
              w,
              "xmlns: prefix must be bound to " + _ + `
Actual: ` + w.attribValue
            );
          else {
            var z = w.tag, he = w.tags[w.tags.length - 1] || w;
            z.ns === he.ns && (z.ns = Object.create(he.ns)), z.ns[R] = w.attribValue;
          }
        w.attribList.push([w.attribName, w.attribValue]);
      } else
        w.tag.attributes[w.attribName] = w.attribValue, x(w, "onattribute", {
          name: w.attribName,
          value: w.attribValue
        });
      w.attribName = w.attribValue = "";
    }
    function b(w, h) {
      if (w.opt.xmlns) {
        var k = w.tag, R = H(w.tagName);
        k.prefix = R.prefix, k.local = R.local, k.uri = k.ns[R.prefix] || "", k.prefix && !k.uri && (M(w, "Unbound namespace prefix: " + JSON.stringify(w.tagName)), k.uri = R.prefix);
        var z = w.tags[w.tags.length - 1] || w;
        k.ns && z.ns !== k.ns && Object.keys(k.ns).forEach(function(At) {
          x(w, "onopennamespace", {
            prefix: At,
            uri: k.ns[At]
          });
        });
        for (var he = 0, ge = w.attribList.length; he < ge; he++) {
          var we = w.attribList[he], Pe = we[0], Xe = we[1], $e = H(Pe, !0), Ue = $e.prefix, kt = $e.local, Pt = Ue === "" ? "" : k.ns[Ue] || "", vt = {
            name: Pe,
            value: Xe,
            prefix: Ue,
            local: kt,
            uri: Pt
          };
          Ue && Ue !== "xmlns" && !Pt && (M(w, "Unbound namespace prefix: " + JSON.stringify(Ue)), vt.uri = Ue), w.tag.attributes[Pe] = vt, x(w, "onattribute", vt);
        }
        w.attribList.length = 0;
      }
      w.tag.isSelfClosing = !!h, w.sawRoot = !0, w.tags.push(w.tag), x(w, "onopentag", w.tag), h || (!w.noscript && w.tagName.toLowerCase() === "script" ? w.state = I.SCRIPT : w.state = I.TEXT, w.tag = null, w.tagName = ""), w.attribName = w.attribValue = "", w.attribList.length = 0;
    }
    function A(w) {
      if (!w.tagName) {
        M(w, "Weird empty close tag."), w.textNode += "</>", w.state = I.TEXT;
        return;
      }
      if (w.script) {
        if (w.tagName !== "script") {
          w.script += "</" + w.tagName + ">", w.tagName = "", w.state = I.SCRIPT;
          return;
        }
        x(w, "onscript", w.script), w.script = "";
      }
      var h = w.tags.length, k = w.tagName;
      w.strict || (k = k[w.looseCase]());
      for (var R = k; h--; ) {
        var z = w.tags[h];
        if (z.name !== R)
          M(w, "Unexpected close tag");
        else
          break;
      }
      if (h < 0) {
        M(w, "Unmatched closing tag: " + w.tagName), w.textNode += "</" + w.tagName + ">", w.state = I.TEXT;
        return;
      }
      w.tagName = k;
      for (var he = w.tags.length; he-- > h; ) {
        var ge = w.tag = w.tags.pop();
        w.tagName = w.tag.name, x(w, "onclosetag", w.tagName);
        var we = {};
        for (var Pe in ge.ns)
          we[Pe] = ge.ns[Pe];
        var Xe = w.tags[w.tags.length - 1] || w;
        w.opt.xmlns && ge.ns !== Xe.ns && Object.keys(ge.ns).forEach(function($e) {
          var Ue = ge.ns[$e];
          x(w, "onclosenamespace", { prefix: $e, uri: Ue });
        });
      }
      h === 0 && (w.closedRoot = !0), w.tagName = w.attribValue = w.attribName = "", w.attribList.length = 0, w.state = I.TEXT;
    }
    function S(w) {
      var h = w.entity, k = h.toLowerCase(), R, z = "";
      return w.ENTITIES[h] ? w.ENTITIES[h] : w.ENTITIES[k] ? w.ENTITIES[k] : (h = k, h.charAt(0) === "#" && (h.charAt(1) === "x" ? (h = h.slice(2), R = parseInt(h, 16), z = R.toString(16)) : (h = h.slice(1), R = parseInt(h, 10), z = R.toString(10))), h = h.replace(/^0+/, ""), isNaN(R) || z.toLowerCase() !== h ? (M(w, "Invalid character entity"), "&" + w.entity + ";") : String.fromCodePoint(R));
    }
    function f(w, h) {
      h === "<" ? (w.state = I.OPEN_WAKA, w.startTagPosition = w.position) : O(h) || (M(w, "Non-whitespace before first tag."), w.textNode = h, w.state = I.TEXT);
    }
    function y(w, h) {
      var k = "";
      return h < w.length && (k = w.charAt(h)), k;
    }
    function P(w) {
      var h = this;
      if (this.error)
        throw this.error;
      if (h.closed)
        return L(
          h,
          "Cannot write after close. Assign an onready handler."
        );
      if (w === null)
        return K(h);
      typeof w == "object" && (w = w.toString());
      for (var k = 0, R = ""; R = y(w, k++), h.c = R, !!R; )
        switch (h.trackPosition && (h.position++, R === `
` ? (h.line++, h.column = 0) : h.column++), h.state) {
          case I.BEGIN:
            if (h.state = I.BEGIN_WHITESPACE, R === "\uFEFF")
              continue;
            f(h, R);
            continue;
          case I.BEGIN_WHITESPACE:
            f(h, R);
            continue;
          case I.TEXT:
            if (h.sawRoot && !h.closedRoot) {
              for (var z = k - 1; R && R !== "<" && R !== "&"; )
                R = y(w, k++), R && h.trackPosition && (h.position++, R === `
` ? (h.line++, h.column = 0) : h.column++);
              h.textNode += w.substring(z, k - 1);
            }
            R === "<" && !(h.sawRoot && h.closedRoot && !h.strict) ? (h.state = I.OPEN_WAKA, h.startTagPosition = h.position) : (!O(R) && (!h.sawRoot || h.closedRoot) && M(h, "Text data outside of root node."), R === "&" ? h.state = I.TEXT_ENTITY : h.textNode += R);
            continue;
          case I.SCRIPT:
            R === "<" ? h.state = I.SCRIPT_ENDING : h.script += R;
            continue;
          case I.SCRIPT_ENDING:
            R === "/" ? h.state = I.CLOSE_TAG : (h.script += "<" + R, h.state = I.SCRIPT);
            continue;
          case I.OPEN_WAKA:
            if (R === "!")
              h.state = I.SGML_DECL, h.sgmlDecl = "";
            else if (!O(R)) if (B(v, R))
              h.state = I.OPEN_TAG, h.tagName = R;
            else if (R === "/")
              h.state = I.CLOSE_TAG, h.tagName = "";
            else if (R === "?")
              h.state = I.PROC_INST, h.procInstName = h.procInstBody = "";
            else {
              if (M(h, "Unencoded <"), h.startTagPosition + 1 < h.position) {
                var he = h.position - h.startTagPosition;
                R = new Array(he).join(" ") + R;
              }
              h.textNode += "<" + R, h.state = I.TEXT;
            }
            continue;
          case I.SGML_DECL:
            if (h.sgmlDecl + R === "--") {
              h.state = I.COMMENT, h.comment = "", h.sgmlDecl = "";
              continue;
            }
            h.doctype && h.doctype !== !0 && h.sgmlDecl ? (h.state = I.DOCTYPE_DTD, h.doctype += "<!" + h.sgmlDecl + R, h.sgmlDecl = "") : (h.sgmlDecl + R).toUpperCase() === d ? (x(h, "onopencdata"), h.state = I.CDATA, h.sgmlDecl = "", h.cdata = "") : (h.sgmlDecl + R).toUpperCase() === p ? (h.state = I.DOCTYPE, (h.doctype || h.sawRoot) && M(
              h,
              "Inappropriately located doctype declaration"
            ), h.doctype = "", h.sgmlDecl = "") : R === ">" ? (x(h, "onsgmldeclaration", h.sgmlDecl), h.sgmlDecl = "", h.state = I.TEXT) : (U(R) && (h.state = I.SGML_DECL_QUOTED), h.sgmlDecl += R);
            continue;
          case I.SGML_DECL_QUOTED:
            R === h.q && (h.state = I.SGML_DECL, h.q = ""), h.sgmlDecl += R;
            continue;
          case I.DOCTYPE:
            R === ">" ? (h.state = I.TEXT, x(h, "ondoctype", h.doctype), h.doctype = !0) : (h.doctype += R, R === "[" ? h.state = I.DOCTYPE_DTD : U(R) && (h.state = I.DOCTYPE_QUOTED, h.q = R));
            continue;
          case I.DOCTYPE_QUOTED:
            h.doctype += R, R === h.q && (h.q = "", h.state = I.DOCTYPE);
            continue;
          case I.DOCTYPE_DTD:
            R === "]" ? (h.doctype += R, h.state = I.DOCTYPE) : R === "<" ? (h.state = I.OPEN_WAKA, h.startTagPosition = h.position) : U(R) ? (h.doctype += R, h.state = I.DOCTYPE_DTD_QUOTED, h.q = R) : h.doctype += R;
            continue;
          case I.DOCTYPE_DTD_QUOTED:
            h.doctype += R, R === h.q && (h.state = I.DOCTYPE_DTD, h.q = "");
            continue;
          case I.COMMENT:
            R === "-" ? h.state = I.COMMENT_ENDING : h.comment += R;
            continue;
          case I.COMMENT_ENDING:
            R === "-" ? (h.state = I.COMMENT_ENDED, h.comment = F(h.opt, h.comment), h.comment && x(h, "oncomment", h.comment), h.comment = "") : (h.comment += "-" + R, h.state = I.COMMENT);
            continue;
          case I.COMMENT_ENDED:
            R !== ">" ? (M(h, "Malformed comment"), h.comment += "--" + R, h.state = I.COMMENT) : h.doctype && h.doctype !== !0 ? h.state = I.DOCTYPE_DTD : h.state = I.TEXT;
            continue;
          case I.CDATA:
            R === "]" ? h.state = I.CDATA_ENDING : h.cdata += R;
            continue;
          case I.CDATA_ENDING:
            R === "]" ? h.state = I.CDATA_ENDING_2 : (h.cdata += "]" + R, h.state = I.CDATA);
            continue;
          case I.CDATA_ENDING_2:
            R === ">" ? (h.cdata && x(h, "oncdata", h.cdata), x(h, "onclosecdata"), h.cdata = "", h.state = I.TEXT) : R === "]" ? h.cdata += "]" : (h.cdata += "]]" + R, h.state = I.CDATA);
            continue;
          case I.PROC_INST:
            R === "?" ? h.state = I.PROC_INST_ENDING : O(R) ? h.state = I.PROC_INST_BODY : h.procInstName += R;
            continue;
          case I.PROC_INST_BODY:
            if (!h.procInstBody && O(R))
              continue;
            R === "?" ? h.state = I.PROC_INST_ENDING : h.procInstBody += R;
            continue;
          case I.PROC_INST_ENDING:
            R === ">" ? (x(h, "onprocessinginstruction", {
              name: h.procInstName,
              body: h.procInstBody
            }), h.procInstName = h.procInstBody = "", h.state = I.TEXT) : (h.procInstBody += "?" + R, h.state = I.PROC_INST_BODY);
            continue;
          case I.OPEN_TAG:
            B(g, R) ? h.tagName += R : (X(h), R === ">" ? b(h) : R === "/" ? h.state = I.OPEN_TAG_SLASH : (O(R) || M(h, "Invalid character in tag name"), h.state = I.ATTRIB));
            continue;
          case I.OPEN_TAG_SLASH:
            R === ">" ? (b(h, !0), A(h)) : (M(h, "Forward-slash in opening tag not followed by >"), h.state = I.ATTRIB);
            continue;
          case I.ATTRIB:
            if (O(R))
              continue;
            R === ">" ? b(h) : R === "/" ? h.state = I.OPEN_TAG_SLASH : B(v, R) ? (h.attribName = R, h.attribValue = "", h.state = I.ATTRIB_NAME) : M(h, "Invalid attribute name");
            continue;
          case I.ATTRIB_NAME:
            R === "=" ? h.state = I.ATTRIB_VALUE : R === ">" ? (M(h, "Attribute without value"), h.attribValue = h.attribName, C(h), b(h)) : O(R) ? h.state = I.ATTRIB_NAME_SAW_WHITE : B(g, R) ? h.attribName += R : M(h, "Invalid attribute name");
            continue;
          case I.ATTRIB_NAME_SAW_WHITE:
            if (R === "=")
              h.state = I.ATTRIB_VALUE;
            else {
              if (O(R))
                continue;
              M(h, "Attribute without value"), h.tag.attributes[h.attribName] = "", h.attribValue = "", x(h, "onattribute", {
                name: h.attribName,
                value: ""
              }), h.attribName = "", R === ">" ? b(h) : B(v, R) ? (h.attribName = R, h.state = I.ATTRIB_NAME) : (M(h, "Invalid attribute name"), h.state = I.ATTRIB);
            }
            continue;
          case I.ATTRIB_VALUE:
            if (O(R))
              continue;
            U(R) ? (h.q = R, h.state = I.ATTRIB_VALUE_QUOTED) : (h.opt.unquotedAttributeValues || L(h, "Unquoted attribute value"), h.state = I.ATTRIB_VALUE_UNQUOTED, h.attribValue = R);
            continue;
          case I.ATTRIB_VALUE_QUOTED:
            if (R !== h.q) {
              R === "&" ? h.state = I.ATTRIB_VALUE_ENTITY_Q : h.attribValue += R;
              continue;
            }
            C(h), h.q = "", h.state = I.ATTRIB_VALUE_CLOSED;
            continue;
          case I.ATTRIB_VALUE_CLOSED:
            O(R) ? h.state = I.ATTRIB : R === ">" ? b(h) : R === "/" ? h.state = I.OPEN_TAG_SLASH : B(v, R) ? (M(h, "No whitespace between attributes"), h.attribName = R, h.attribValue = "", h.state = I.ATTRIB_NAME) : M(h, "Invalid attribute name");
            continue;
          case I.ATTRIB_VALUE_UNQUOTED:
            if (!q(R)) {
              R === "&" ? h.state = I.ATTRIB_VALUE_ENTITY_U : h.attribValue += R;
              continue;
            }
            C(h), R === ">" ? b(h) : h.state = I.ATTRIB;
            continue;
          case I.CLOSE_TAG:
            if (h.tagName)
              R === ">" ? A(h) : B(g, R) ? h.tagName += R : h.script ? (h.script += "</" + h.tagName, h.tagName = "", h.state = I.SCRIPT) : (O(R) || M(h, "Invalid tagname in closing tag"), h.state = I.CLOSE_TAG_SAW_WHITE);
            else {
              if (O(R))
                continue;
              me(v, R) ? h.script ? (h.script += "</" + R, h.state = I.SCRIPT) : M(h, "Invalid tagname in closing tag.") : h.tagName = R;
            }
            continue;
          case I.CLOSE_TAG_SAW_WHITE:
            if (O(R))
              continue;
            R === ">" ? A(h) : M(h, "Invalid characters in closing tag");
            continue;
          case I.TEXT_ENTITY:
          case I.ATTRIB_VALUE_ENTITY_Q:
          case I.ATTRIB_VALUE_ENTITY_U:
            var ge, we;
            switch (h.state) {
              case I.TEXT_ENTITY:
                ge = I.TEXT, we = "textNode";
                break;
              case I.ATTRIB_VALUE_ENTITY_Q:
                ge = I.ATTRIB_VALUE_QUOTED, we = "attribValue";
                break;
              case I.ATTRIB_VALUE_ENTITY_U:
                ge = I.ATTRIB_VALUE_UNQUOTED, we = "attribValue";
                break;
            }
            if (R === ";") {
              var Pe = S(h);
              h.opt.unparsedEntities && !Object.values(t.XML_ENTITIES).includes(Pe) ? (h.entity = "", h.state = ge, h.write(Pe)) : (h[we] += Pe, h.entity = "", h.state = ge);
            } else B(h.entity.length ? N : E, R) ? h.entity += R : (M(h, "Invalid character in entity name"), h[we] += "&" + h.entity + R, h.entity = "", h.state = ge);
            continue;
          default:
            throw new Error(h, "Unknown state: " + h.state);
        }
      return h.position >= h.bufferCheckPosition && s(h), h;
    }
    /*! http://mths.be/fromcodepoint v0.1.0 by @mathias */
    String.fromCodePoint || function() {
      var w = String.fromCharCode, h = Math.floor, k = function() {
        var R = 16384, z = [], he, ge, we = -1, Pe = arguments.length;
        if (!Pe)
          return "";
        for (var Xe = ""; ++we < Pe; ) {
          var $e = Number(arguments[we]);
          if (!isFinite($e) || // `NaN`, `+Infinity`, or `-Infinity`
          $e < 0 || // not a valid Unicode code point
          $e > 1114111 || // not a valid Unicode code point
          h($e) !== $e)
            throw RangeError("Invalid code point: " + $e);
          $e <= 65535 ? z.push($e) : ($e -= 65536, he = ($e >> 10) + 55296, ge = $e % 1024 + 56320, z.push(he, ge)), (we + 1 === Pe || z.length > R) && (Xe += w.apply(null, z), z.length = 0);
        }
        return Xe;
      };
      Object.defineProperty ? Object.defineProperty(String, "fromCodePoint", {
        value: k,
        configurable: !0,
        writable: !0
      }) : String.fromCodePoint = k;
    }();
  })(e);
})(Fg);
Object.defineProperty(vi, "__esModule", { value: !0 });
vi.XElement = void 0;
vi.parseXml = FI;
const DI = Fg, ta = gs;
class Lg {
  constructor(t) {
    if (this.name = t, this.value = "", this.attributes = null, this.isCData = !1, this.elements = null, !t)
      throw (0, ta.newError)("Element name cannot be empty", "ERR_XML_ELEMENT_NAME_EMPTY");
    if (!UI(t))
      throw (0, ta.newError)(`Invalid element name: ${t}`, "ERR_XML_ELEMENT_INVALID_NAME");
  }
  attribute(t) {
    const r = this.attributes === null ? null : this.attributes[t];
    if (r == null)
      throw (0, ta.newError)(`No attribute "${t}"`, "ERR_XML_MISSED_ATTRIBUTE");
    return r;
  }
  removeAttribute(t) {
    this.attributes !== null && delete this.attributes[t];
  }
  element(t, r = !1, n = null) {
    const s = this.elementOrNull(t, r);
    if (s === null)
      throw (0, ta.newError)(n || `No element "${t}"`, "ERR_XML_MISSED_ELEMENT");
    return s;
  }
  elementOrNull(t, r = !1) {
    if (this.elements === null)
      return null;
    for (const n of this.elements)
      if (wh(n, t, r))
        return n;
    return null;
  }
  getElements(t, r = !1) {
    return this.elements === null ? [] : this.elements.filter((n) => wh(n, t, r));
  }
  elementValueOrEmpty(t, r = !1) {
    const n = this.elementOrNull(t, r);
    return n === null ? "" : n.value;
  }
}
vi.XElement = Lg;
const kI = new RegExp(/^[A-Za-z_][:A-Za-z0-9_-]*$/i);
function UI(e) {
  return kI.test(e);
}
function wh(e, t, r) {
  const n = e.name;
  return n === t || r === !0 && n.length === t.length && n.toLowerCase() === t.toLowerCase();
}
function FI(e) {
  let t = null;
  const r = DI.parser(!0, {}), n = [];
  return r.onopentag = (s) => {
    const i = new Lg(s.name);
    if (i.attributes = s.attributes, t === null)
      t = i;
    else {
      const a = n[n.length - 1];
      a.elements == null && (a.elements = []), a.elements.push(i);
    }
    n.push(i);
  }, r.onclosetag = () => {
    n.pop();
  }, r.ontext = (s) => {
    n.length > 0 && (n[n.length - 1].value = s);
  }, r.oncdata = (s) => {
    const i = n[n.length - 1];
    i.value = s, i.isCData = !0;
  }, r.onerror = (s) => {
    throw s;
  }, r.write(e), t;
}
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.CURRENT_APP_PACKAGE_FILE_NAME = e.CURRENT_APP_INSTALLER_FILE_NAME = e.XElement = e.parseXml = e.UUID = e.parseDn = e.retry = e.githubTagPrefix = e.githubUrl = e.getS3LikeProviderBaseUrl = e.ProgressCallbackTransform = e.MemoLazy = e.safeStringifyJson = e.safeGetHeader = e.parseJson = e.HttpExecutor = e.HttpError = e.DigestTransform = e.createHttpError = e.configureRequestUrl = e.configureRequestOptionsFromUrl = e.configureRequestOptions = e.newError = e.CancellationToken = e.CancellationError = void 0, e.asArray = d;
  var t = Kr;
  Object.defineProperty(e, "CancellationError", { enumerable: !0, get: function() {
    return t.CancellationError;
  } }), Object.defineProperty(e, "CancellationToken", { enumerable: !0, get: function() {
    return t.CancellationToken;
  } });
  var r = gs;
  Object.defineProperty(e, "newError", { enumerable: !0, get: function() {
    return r.newError;
  } });
  var n = ft;
  Object.defineProperty(e, "configureRequestOptions", { enumerable: !0, get: function() {
    return n.configureRequestOptions;
  } }), Object.defineProperty(e, "configureRequestOptionsFromUrl", { enumerable: !0, get: function() {
    return n.configureRequestOptionsFromUrl;
  } }), Object.defineProperty(e, "configureRequestUrl", { enumerable: !0, get: function() {
    return n.configureRequestUrl;
  } }), Object.defineProperty(e, "createHttpError", { enumerable: !0, get: function() {
    return n.createHttpError;
  } }), Object.defineProperty(e, "DigestTransform", { enumerable: !0, get: function() {
    return n.DigestTransform;
  } }), Object.defineProperty(e, "HttpError", { enumerable: !0, get: function() {
    return n.HttpError;
  } }), Object.defineProperty(e, "HttpExecutor", { enumerable: !0, get: function() {
    return n.HttpExecutor;
  } }), Object.defineProperty(e, "parseJson", { enumerable: !0, get: function() {
    return n.parseJson;
  } }), Object.defineProperty(e, "safeGetHeader", { enumerable: !0, get: function() {
    return n.safeGetHeader;
  } }), Object.defineProperty(e, "safeStringifyJson", { enumerable: !0, get: function() {
    return n.safeStringifyJson;
  } });
  var s = lo;
  Object.defineProperty(e, "MemoLazy", { enumerable: !0, get: function() {
    return s.MemoLazy;
  } });
  var i = $i;
  Object.defineProperty(e, "ProgressCallbackTransform", { enumerable: !0, get: function() {
    return i.ProgressCallbackTransform;
  } });
  var a = _i;
  Object.defineProperty(e, "getS3LikeProviderBaseUrl", { enumerable: !0, get: function() {
    return a.getS3LikeProviderBaseUrl;
  } }), Object.defineProperty(e, "githubUrl", { enumerable: !0, get: function() {
    return a.githubUrl;
  } }), Object.defineProperty(e, "githubTagPrefix", { enumerable: !0, get: function() {
    return a.githubTagPrefix;
  } });
  var o = nd;
  Object.defineProperty(e, "retry", { enumerable: !0, get: function() {
    return o.retry;
  } });
  var l = sd;
  Object.defineProperty(e, "parseDn", { enumerable: !0, get: function() {
    return l.parseDn;
  } });
  var c = is;
  Object.defineProperty(e, "UUID", { enumerable: !0, get: function() {
    return c.UUID;
  } });
  var u = vi;
  Object.defineProperty(e, "parseXml", { enumerable: !0, get: function() {
    return u.parseXml;
  } }), Object.defineProperty(e, "XElement", { enumerable: !0, get: function() {
    return u.XElement;
  } }), e.CURRENT_APP_INSTALLER_FILE_NAME = "installer.exe", e.CURRENT_APP_PACKAGE_FILE_NAME = "package.7z";
  function d(p) {
    return p == null ? [] : Array.isArray(p) ? p : [p];
  }
})(xe);
var Ye = {}, id = {}, Yt = {};
function jg(e) {
  return typeof e > "u" || e === null;
}
function LI(e) {
  return typeof e == "object" && e !== null;
}
function jI(e) {
  return Array.isArray(e) ? e : jg(e) ? [] : [e];
}
function MI(e, t) {
  var r, n, s, i;
  if (t)
    for (i = Object.keys(t), r = 0, n = i.length; r < n; r += 1)
      s = i[r], e[s] = t[s];
  return e;
}
function xI(e, t) {
  var r = "", n;
  for (n = 0; n < t; n += 1)
    r += e;
  return r;
}
function qI(e) {
  return e === 0 && Number.NEGATIVE_INFINITY === 1 / e;
}
Yt.isNothing = jg;
Yt.isObject = LI;
Yt.toArray = jI;
Yt.repeat = xI;
Yt.isNegativeZero = qI;
Yt.extend = MI;
function Mg(e, t) {
  var r = "", n = e.reason || "(unknown reason)";
  return e.mark ? (e.mark.name && (r += 'in "' + e.mark.name + '" '), r += "(" + (e.mark.line + 1) + ":" + (e.mark.column + 1) + ")", !t && e.mark.snippet && (r += `

` + e.mark.snippet), n + " " + r) : n;
}
function ei(e, t) {
  Error.call(this), this.name = "YAMLException", this.reason = e, this.mark = t, this.message = Mg(this, !1), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = new Error().stack || "";
}
ei.prototype = Object.create(Error.prototype);
ei.prototype.constructor = ei;
ei.prototype.toString = function(t) {
  return this.name + ": " + Mg(this, t);
};
var wi = ei, Ls = Yt;
function tl(e, t, r, n, s) {
  var i = "", a = "", o = Math.floor(s / 2) - 1;
  return n - t > o && (i = " ... ", t = n - o + i.length), r - n > o && (a = " ...", r = n + o - a.length), {
    str: i + e.slice(t, r).replace(/\t/g, "→") + a,
    pos: n - t + i.length
    // relative position
  };
}
function rl(e, t) {
  return Ls.repeat(" ", t - e.length) + e;
}
function VI(e, t) {
  if (t = Object.create(t || null), !e.buffer) return null;
  t.maxLength || (t.maxLength = 79), typeof t.indent != "number" && (t.indent = 1), typeof t.linesBefore != "number" && (t.linesBefore = 3), typeof t.linesAfter != "number" && (t.linesAfter = 2);
  for (var r = /\r?\n|\r|\0/g, n = [0], s = [], i, a = -1; i = r.exec(e.buffer); )
    s.push(i.index), n.push(i.index + i[0].length), e.position <= i.index && a < 0 && (a = n.length - 2);
  a < 0 && (a = n.length - 1);
  var o = "", l, c, u = Math.min(e.line + t.linesAfter, s.length).toString().length, d = t.maxLength - (t.indent + u + 3);
  for (l = 1; l <= t.linesBefore && !(a - l < 0); l++)
    c = tl(
      e.buffer,
      n[a - l],
      s[a - l],
      e.position - (n[a] - n[a - l]),
      d
    ), o = Ls.repeat(" ", t.indent) + rl((e.line - l + 1).toString(), u) + " | " + c.str + `
` + o;
  for (c = tl(e.buffer, n[a], s[a], e.position, d), o += Ls.repeat(" ", t.indent) + rl((e.line + 1).toString(), u) + " | " + c.str + `
`, o += Ls.repeat("-", t.indent + u + 3 + c.pos) + `^
`, l = 1; l <= t.linesAfter && !(a + l >= s.length); l++)
    c = tl(
      e.buffer,
      n[a + l],
      s[a + l],
      e.position - (n[a] - n[a + l]),
      d
    ), o += Ls.repeat(" ", t.indent) + rl((e.line + l + 1).toString(), u) + " | " + c.str + `
`;
  return o.replace(/\n$/, "");
}
var BI = VI, Eh = wi, HI = [
  "kind",
  "multi",
  "resolve",
  "construct",
  "instanceOf",
  "predicate",
  "represent",
  "representName",
  "defaultStyle",
  "styleAliases"
], zI = [
  "scalar",
  "sequence",
  "mapping"
];
function GI(e) {
  var t = {};
  return e !== null && Object.keys(e).forEach(function(r) {
    e[r].forEach(function(n) {
      t[String(n)] = r;
    });
  }), t;
}
function KI(e, t) {
  if (t = t || {}, Object.keys(t).forEach(function(r) {
    if (HI.indexOf(r) === -1)
      throw new Eh('Unknown option "' + r + '" is met in definition of "' + e + '" YAML type.');
  }), this.options = t, this.tag = e, this.kind = t.kind || null, this.resolve = t.resolve || function() {
    return !0;
  }, this.construct = t.construct || function(r) {
    return r;
  }, this.instanceOf = t.instanceOf || null, this.predicate = t.predicate || null, this.represent = t.represent || null, this.representName = t.representName || null, this.defaultStyle = t.defaultStyle || null, this.multi = t.multi || !1, this.styleAliases = GI(t.styleAliases || null), zI.indexOf(this.kind) === -1)
    throw new Eh('Unknown kind "' + this.kind + '" is specified for "' + e + '" YAML type.');
}
var pt = KI, Os = wi, nl = pt;
function bh(e, t) {
  var r = [];
  return e[t].forEach(function(n) {
    var s = r.length;
    r.forEach(function(i, a) {
      i.tag === n.tag && i.kind === n.kind && i.multi === n.multi && (s = a);
    }), r[s] = n;
  }), r;
}
function WI() {
  var e = {
    scalar: {},
    sequence: {},
    mapping: {},
    fallback: {},
    multi: {
      scalar: [],
      sequence: [],
      mapping: [],
      fallback: []
    }
  }, t, r;
  function n(s) {
    s.multi ? (e.multi[s.kind].push(s), e.multi.fallback.push(s)) : e[s.kind][s.tag] = e.fallback[s.tag] = s;
  }
  for (t = 0, r = arguments.length; t < r; t += 1)
    arguments[t].forEach(n);
  return e;
}
function zl(e) {
  return this.extend(e);
}
zl.prototype.extend = function(t) {
  var r = [], n = [];
  if (t instanceof nl)
    n.push(t);
  else if (Array.isArray(t))
    n = n.concat(t);
  else if (t && (Array.isArray(t.implicit) || Array.isArray(t.explicit)))
    t.implicit && (r = r.concat(t.implicit)), t.explicit && (n = n.concat(t.explicit));
  else
    throw new Os("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
  r.forEach(function(i) {
    if (!(i instanceof nl))
      throw new Os("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    if (i.loadKind && i.loadKind !== "scalar")
      throw new Os("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
    if (i.multi)
      throw new Os("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
  }), n.forEach(function(i) {
    if (!(i instanceof nl))
      throw new Os("Specified list of YAML types (or a single Type object) contains a non-Type object.");
  });
  var s = Object.create(zl.prototype);
  return s.implicit = (this.implicit || []).concat(r), s.explicit = (this.explicit || []).concat(n), s.compiledImplicit = bh(s, "implicit"), s.compiledExplicit = bh(s, "explicit"), s.compiledTypeMap = WI(s.compiledImplicit, s.compiledExplicit), s;
};
var xg = zl, YI = pt, qg = new YI("tag:yaml.org,2002:str", {
  kind: "scalar",
  construct: function(e) {
    return e !== null ? e : "";
  }
}), XI = pt, Vg = new XI("tag:yaml.org,2002:seq", {
  kind: "sequence",
  construct: function(e) {
    return e !== null ? e : [];
  }
}), JI = pt, Bg = new JI("tag:yaml.org,2002:map", {
  kind: "mapping",
  construct: function(e) {
    return e !== null ? e : {};
  }
}), QI = xg, Hg = new QI({
  explicit: [
    qg,
    Vg,
    Bg
  ]
}), ZI = pt;
function eD(e) {
  if (e === null) return !0;
  var t = e.length;
  return t === 1 && e === "~" || t === 4 && (e === "null" || e === "Null" || e === "NULL");
}
function tD() {
  return null;
}
function rD(e) {
  return e === null;
}
var zg = new ZI("tag:yaml.org,2002:null", {
  kind: "scalar",
  resolve: eD,
  construct: tD,
  predicate: rD,
  represent: {
    canonical: function() {
      return "~";
    },
    lowercase: function() {
      return "null";
    },
    uppercase: function() {
      return "NULL";
    },
    camelcase: function() {
      return "Null";
    },
    empty: function() {
      return "";
    }
  },
  defaultStyle: "lowercase"
}), nD = pt;
function sD(e) {
  if (e === null) return !1;
  var t = e.length;
  return t === 4 && (e === "true" || e === "True" || e === "TRUE") || t === 5 && (e === "false" || e === "False" || e === "FALSE");
}
function iD(e) {
  return e === "true" || e === "True" || e === "TRUE";
}
function aD(e) {
  return Object.prototype.toString.call(e) === "[object Boolean]";
}
var Gg = new nD("tag:yaml.org,2002:bool", {
  kind: "scalar",
  resolve: sD,
  construct: iD,
  predicate: aD,
  represent: {
    lowercase: function(e) {
      return e ? "true" : "false";
    },
    uppercase: function(e) {
      return e ? "TRUE" : "FALSE";
    },
    camelcase: function(e) {
      return e ? "True" : "False";
    }
  },
  defaultStyle: "lowercase"
}), oD = Yt, lD = pt;
function cD(e) {
  return 48 <= e && e <= 57 || 65 <= e && e <= 70 || 97 <= e && e <= 102;
}
function uD(e) {
  return 48 <= e && e <= 55;
}
function dD(e) {
  return 48 <= e && e <= 57;
}
function fD(e) {
  if (e === null) return !1;
  var t = e.length, r = 0, n = !1, s;
  if (!t) return !1;
  if (s = e[r], (s === "-" || s === "+") && (s = e[++r]), s === "0") {
    if (r + 1 === t) return !0;
    if (s = e[++r], s === "b") {
      for (r++; r < t; r++)
        if (s = e[r], s !== "_") {
          if (s !== "0" && s !== "1") return !1;
          n = !0;
        }
      return n && s !== "_";
    }
    if (s === "x") {
      for (r++; r < t; r++)
        if (s = e[r], s !== "_") {
          if (!cD(e.charCodeAt(r))) return !1;
          n = !0;
        }
      return n && s !== "_";
    }
    if (s === "o") {
      for (r++; r < t; r++)
        if (s = e[r], s !== "_") {
          if (!uD(e.charCodeAt(r))) return !1;
          n = !0;
        }
      return n && s !== "_";
    }
  }
  if (s === "_") return !1;
  for (; r < t; r++)
    if (s = e[r], s !== "_") {
      if (!dD(e.charCodeAt(r)))
        return !1;
      n = !0;
    }
  return !(!n || s === "_");
}
function hD(e) {
  var t = e, r = 1, n;
  if (t.indexOf("_") !== -1 && (t = t.replace(/_/g, "")), n = t[0], (n === "-" || n === "+") && (n === "-" && (r = -1), t = t.slice(1), n = t[0]), t === "0") return 0;
  if (n === "0") {
    if (t[1] === "b") return r * parseInt(t.slice(2), 2);
    if (t[1] === "x") return r * parseInt(t.slice(2), 16);
    if (t[1] === "o") return r * parseInt(t.slice(2), 8);
  }
  return r * parseInt(t, 10);
}
function pD(e) {
  return Object.prototype.toString.call(e) === "[object Number]" && e % 1 === 0 && !oD.isNegativeZero(e);
}
var Kg = new lD("tag:yaml.org,2002:int", {
  kind: "scalar",
  resolve: fD,
  construct: hD,
  predicate: pD,
  represent: {
    binary: function(e) {
      return e >= 0 ? "0b" + e.toString(2) : "-0b" + e.toString(2).slice(1);
    },
    octal: function(e) {
      return e >= 0 ? "0o" + e.toString(8) : "-0o" + e.toString(8).slice(1);
    },
    decimal: function(e) {
      return e.toString(10);
    },
    /* eslint-disable max-len */
    hexadecimal: function(e) {
      return e >= 0 ? "0x" + e.toString(16).toUpperCase() : "-0x" + e.toString(16).toUpperCase().slice(1);
    }
  },
  defaultStyle: "decimal",
  styleAliases: {
    binary: [2, "bin"],
    octal: [8, "oct"],
    decimal: [10, "dec"],
    hexadecimal: [16, "hex"]
  }
}), Wg = Yt, mD = pt, gD = new RegExp(
  // 2.5e4, 2.5 and integers
  "^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
);
function yD(e) {
  return !(e === null || !gD.test(e) || // Quick hack to not allow integers end with `_`
  // Probably should update regexp & check speed
  e[e.length - 1] === "_");
}
function $D(e) {
  var t, r;
  return t = e.replace(/_/g, "").toLowerCase(), r = t[0] === "-" ? -1 : 1, "+-".indexOf(t[0]) >= 0 && (t = t.slice(1)), t === ".inf" ? r === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : t === ".nan" ? NaN : r * parseFloat(t, 10);
}
var _D = /^[-+]?[0-9]+e/;
function vD(e, t) {
  var r;
  if (isNaN(e))
    switch (t) {
      case "lowercase":
        return ".nan";
      case "uppercase":
        return ".NAN";
      case "camelcase":
        return ".NaN";
    }
  else if (Number.POSITIVE_INFINITY === e)
    switch (t) {
      case "lowercase":
        return ".inf";
      case "uppercase":
        return ".INF";
      case "camelcase":
        return ".Inf";
    }
  else if (Number.NEGATIVE_INFINITY === e)
    switch (t) {
      case "lowercase":
        return "-.inf";
      case "uppercase":
        return "-.INF";
      case "camelcase":
        return "-.Inf";
    }
  else if (Wg.isNegativeZero(e))
    return "-0.0";
  return r = e.toString(10), _D.test(r) ? r.replace("e", ".e") : r;
}
function wD(e) {
  return Object.prototype.toString.call(e) === "[object Number]" && (e % 1 !== 0 || Wg.isNegativeZero(e));
}
var Yg = new mD("tag:yaml.org,2002:float", {
  kind: "scalar",
  resolve: yD,
  construct: $D,
  predicate: wD,
  represent: vD,
  defaultStyle: "lowercase"
}), Xg = Hg.extend({
  implicit: [
    zg,
    Gg,
    Kg,
    Yg
  ]
}), Jg = Xg, ED = pt, Qg = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
), Zg = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
);
function bD(e) {
  return e === null ? !1 : Qg.exec(e) !== null || Zg.exec(e) !== null;
}
function SD(e) {
  var t, r, n, s, i, a, o, l = 0, c = null, u, d, p;
  if (t = Qg.exec(e), t === null && (t = Zg.exec(e)), t === null) throw new Error("Date resolve error");
  if (r = +t[1], n = +t[2] - 1, s = +t[3], !t[4])
    return new Date(Date.UTC(r, n, s));
  if (i = +t[4], a = +t[5], o = +t[6], t[7]) {
    for (l = t[7].slice(0, 3); l.length < 3; )
      l += "0";
    l = +l;
  }
  return t[9] && (u = +t[10], d = +(t[11] || 0), c = (u * 60 + d) * 6e4, t[9] === "-" && (c = -c)), p = new Date(Date.UTC(r, n, s, i, a, o, l)), c && p.setTime(p.getTime() - c), p;
}
function TD(e) {
  return e.toISOString();
}
var e0 = new ED("tag:yaml.org,2002:timestamp", {
  kind: "scalar",
  resolve: bD,
  construct: SD,
  instanceOf: Date,
  represent: TD
}), PD = pt;
function AD(e) {
  return e === "<<" || e === null;
}
var t0 = new PD("tag:yaml.org,2002:merge", {
  kind: "scalar",
  resolve: AD
}), RD = pt, ad = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
\r`;
function ND(e) {
  if (e === null) return !1;
  var t, r, n = 0, s = e.length, i = ad;
  for (r = 0; r < s; r++)
    if (t = i.indexOf(e.charAt(r)), !(t > 64)) {
      if (t < 0) return !1;
      n += 6;
    }
  return n % 8 === 0;
}
function CD(e) {
  var t, r, n = e.replace(/[\r\n=]/g, ""), s = n.length, i = ad, a = 0, o = [];
  for (t = 0; t < s; t++)
    t % 4 === 0 && t && (o.push(a >> 16 & 255), o.push(a >> 8 & 255), o.push(a & 255)), a = a << 6 | i.indexOf(n.charAt(t));
  return r = s % 4 * 6, r === 0 ? (o.push(a >> 16 & 255), o.push(a >> 8 & 255), o.push(a & 255)) : r === 18 ? (o.push(a >> 10 & 255), o.push(a >> 2 & 255)) : r === 12 && o.push(a >> 4 & 255), new Uint8Array(o);
}
function OD(e) {
  var t = "", r = 0, n, s, i = e.length, a = ad;
  for (n = 0; n < i; n++)
    n % 3 === 0 && n && (t += a[r >> 18 & 63], t += a[r >> 12 & 63], t += a[r >> 6 & 63], t += a[r & 63]), r = (r << 8) + e[n];
  return s = i % 3, s === 0 ? (t += a[r >> 18 & 63], t += a[r >> 12 & 63], t += a[r >> 6 & 63], t += a[r & 63]) : s === 2 ? (t += a[r >> 10 & 63], t += a[r >> 4 & 63], t += a[r << 2 & 63], t += a[64]) : s === 1 && (t += a[r >> 2 & 63], t += a[r << 4 & 63], t += a[64], t += a[64]), t;
}
function ID(e) {
  return Object.prototype.toString.call(e) === "[object Uint8Array]";
}
var r0 = new RD("tag:yaml.org,2002:binary", {
  kind: "scalar",
  resolve: ND,
  construct: CD,
  predicate: ID,
  represent: OD
}), DD = pt, kD = Object.prototype.hasOwnProperty, UD = Object.prototype.toString;
function FD(e) {
  if (e === null) return !0;
  var t = [], r, n, s, i, a, o = e;
  for (r = 0, n = o.length; r < n; r += 1) {
    if (s = o[r], a = !1, UD.call(s) !== "[object Object]") return !1;
    for (i in s)
      if (kD.call(s, i))
        if (!a) a = !0;
        else return !1;
    if (!a) return !1;
    if (t.indexOf(i) === -1) t.push(i);
    else return !1;
  }
  return !0;
}
function LD(e) {
  return e !== null ? e : [];
}
var n0 = new DD("tag:yaml.org,2002:omap", {
  kind: "sequence",
  resolve: FD,
  construct: LD
}), jD = pt, MD = Object.prototype.toString;
function xD(e) {
  if (e === null) return !0;
  var t, r, n, s, i, a = e;
  for (i = new Array(a.length), t = 0, r = a.length; t < r; t += 1) {
    if (n = a[t], MD.call(n) !== "[object Object]" || (s = Object.keys(n), s.length !== 1)) return !1;
    i[t] = [s[0], n[s[0]]];
  }
  return !0;
}
function qD(e) {
  if (e === null) return [];
  var t, r, n, s, i, a = e;
  for (i = new Array(a.length), t = 0, r = a.length; t < r; t += 1)
    n = a[t], s = Object.keys(n), i[t] = [s[0], n[s[0]]];
  return i;
}
var s0 = new jD("tag:yaml.org,2002:pairs", {
  kind: "sequence",
  resolve: xD,
  construct: qD
}), VD = pt, BD = Object.prototype.hasOwnProperty;
function HD(e) {
  if (e === null) return !0;
  var t, r = e;
  for (t in r)
    if (BD.call(r, t) && r[t] !== null)
      return !1;
  return !0;
}
function zD(e) {
  return e !== null ? e : {};
}
var i0 = new VD("tag:yaml.org,2002:set", {
  kind: "mapping",
  resolve: HD,
  construct: zD
}), od = Jg.extend({
  implicit: [
    e0,
    t0
  ],
  explicit: [
    r0,
    n0,
    s0,
    i0
  ]
}), yn = Yt, a0 = wi, GD = BI, KD = od, Wr = Object.prototype.hasOwnProperty, Ia = 1, o0 = 2, l0 = 3, Da = 4, sl = 1, WD = 2, Sh = 3, YD = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, XD = /[\x85\u2028\u2029]/, JD = /[,\[\]\{\}]/, c0 = /^(?:!|!!|![a-z\-]+!)$/i, u0 = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
function Th(e) {
  return Object.prototype.toString.call(e);
}
function nr(e) {
  return e === 10 || e === 13;
}
function vn(e) {
  return e === 9 || e === 32;
}
function _t(e) {
  return e === 9 || e === 32 || e === 10 || e === 13;
}
function zn(e) {
  return e === 44 || e === 91 || e === 93 || e === 123 || e === 125;
}
function QD(e) {
  var t;
  return 48 <= e && e <= 57 ? e - 48 : (t = e | 32, 97 <= t && t <= 102 ? t - 97 + 10 : -1);
}
function ZD(e) {
  return e === 120 ? 2 : e === 117 ? 4 : e === 85 ? 8 : 0;
}
function ek(e) {
  return 48 <= e && e <= 57 ? e - 48 : -1;
}
function Ph(e) {
  return e === 48 ? "\0" : e === 97 ? "\x07" : e === 98 ? "\b" : e === 116 || e === 9 ? "	" : e === 110 ? `
` : e === 118 ? "\v" : e === 102 ? "\f" : e === 114 ? "\r" : e === 101 ? "\x1B" : e === 32 ? " " : e === 34 ? '"' : e === 47 ? "/" : e === 92 ? "\\" : e === 78 ? "" : e === 95 ? " " : e === 76 ? "\u2028" : e === 80 ? "\u2029" : "";
}
function tk(e) {
  return e <= 65535 ? String.fromCharCode(e) : String.fromCharCode(
    (e - 65536 >> 10) + 55296,
    (e - 65536 & 1023) + 56320
  );
}
var d0 = new Array(256), f0 = new Array(256);
for (var Fn = 0; Fn < 256; Fn++)
  d0[Fn] = Ph(Fn) ? 1 : 0, f0[Fn] = Ph(Fn);
function rk(e, t) {
  this.input = e, this.filename = t.filename || null, this.schema = t.schema || KD, this.onWarning = t.onWarning || null, this.legacy = t.legacy || !1, this.json = t.json || !1, this.listener = t.listener || null, this.implicitTypes = this.schema.compiledImplicit, this.typeMap = this.schema.compiledTypeMap, this.length = e.length, this.position = 0, this.line = 0, this.lineStart = 0, this.lineIndent = 0, this.firstTabInLine = -1, this.documents = [];
}
function h0(e, t) {
  var r = {
    name: e.filename,
    buffer: e.input.slice(0, -1),
    // omit trailing \0
    position: e.position,
    line: e.line,
    column: e.position - e.lineStart
  };
  return r.snippet = GD(r), new a0(t, r);
}
function Z(e, t) {
  throw h0(e, t);
}
function ka(e, t) {
  e.onWarning && e.onWarning.call(null, h0(e, t));
}
var Ah = {
  YAML: function(t, r, n) {
    var s, i, a;
    t.version !== null && Z(t, "duplication of %YAML directive"), n.length !== 1 && Z(t, "YAML directive accepts exactly one argument"), s = /^([0-9]+)\.([0-9]+)$/.exec(n[0]), s === null && Z(t, "ill-formed argument of the YAML directive"), i = parseInt(s[1], 10), a = parseInt(s[2], 10), i !== 1 && Z(t, "unacceptable YAML version of the document"), t.version = n[0], t.checkLineBreaks = a < 2, a !== 1 && a !== 2 && ka(t, "unsupported YAML version of the document");
  },
  TAG: function(t, r, n) {
    var s, i;
    n.length !== 2 && Z(t, "TAG directive accepts exactly two arguments"), s = n[0], i = n[1], c0.test(s) || Z(t, "ill-formed tag handle (first argument) of the TAG directive"), Wr.call(t.tagMap, s) && Z(t, 'there is a previously declared suffix for "' + s + '" tag handle'), u0.test(i) || Z(t, "ill-formed tag prefix (second argument) of the TAG directive");
    try {
      i = decodeURIComponent(i);
    } catch {
      Z(t, "tag prefix is malformed: " + i);
    }
    t.tagMap[s] = i;
  }
};
function zr(e, t, r, n) {
  var s, i, a, o;
  if (t < r) {
    if (o = e.input.slice(t, r), n)
      for (s = 0, i = o.length; s < i; s += 1)
        a = o.charCodeAt(s), a === 9 || 32 <= a && a <= 1114111 || Z(e, "expected valid JSON character");
    else YD.test(o) && Z(e, "the stream contains non-printable characters");
    e.result += o;
  }
}
function Rh(e, t, r, n) {
  var s, i, a, o;
  for (yn.isObject(r) || Z(e, "cannot merge mappings; the provided source object is unacceptable"), s = Object.keys(r), a = 0, o = s.length; a < o; a += 1)
    i = s[a], Wr.call(t, i) || (t[i] = r[i], n[i] = !0);
}
function Gn(e, t, r, n, s, i, a, o, l) {
  var c, u;
  if (Array.isArray(s))
    for (s = Array.prototype.slice.call(s), c = 0, u = s.length; c < u; c += 1)
      Array.isArray(s[c]) && Z(e, "nested arrays are not supported inside keys"), typeof s == "object" && Th(s[c]) === "[object Object]" && (s[c] = "[object Object]");
  if (typeof s == "object" && Th(s) === "[object Object]" && (s = "[object Object]"), s = String(s), t === null && (t = {}), n === "tag:yaml.org,2002:merge")
    if (Array.isArray(i))
      for (c = 0, u = i.length; c < u; c += 1)
        Rh(e, t, i[c], r);
    else
      Rh(e, t, i, r);
  else
    !e.json && !Wr.call(r, s) && Wr.call(t, s) && (e.line = a || e.line, e.lineStart = o || e.lineStart, e.position = l || e.position, Z(e, "duplicated mapping key")), s === "__proto__" ? Object.defineProperty(t, s, {
      configurable: !0,
      enumerable: !0,
      writable: !0,
      value: i
    }) : t[s] = i, delete r[s];
  return t;
}
function ld(e) {
  var t;
  t = e.input.charCodeAt(e.position), t === 10 ? e.position++ : t === 13 ? (e.position++, e.input.charCodeAt(e.position) === 10 && e.position++) : Z(e, "a line break is expected"), e.line += 1, e.lineStart = e.position, e.firstTabInLine = -1;
}
function De(e, t, r) {
  for (var n = 0, s = e.input.charCodeAt(e.position); s !== 0; ) {
    for (; vn(s); )
      s === 9 && e.firstTabInLine === -1 && (e.firstTabInLine = e.position), s = e.input.charCodeAt(++e.position);
    if (t && s === 35)
      do
        s = e.input.charCodeAt(++e.position);
      while (s !== 10 && s !== 13 && s !== 0);
    if (nr(s))
      for (ld(e), s = e.input.charCodeAt(e.position), n++, e.lineIndent = 0; s === 32; )
        e.lineIndent++, s = e.input.charCodeAt(++e.position);
    else
      break;
  }
  return r !== -1 && n !== 0 && e.lineIndent < r && ka(e, "deficient indentation"), n;
}
function co(e) {
  var t = e.position, r;
  return r = e.input.charCodeAt(t), !!((r === 45 || r === 46) && r === e.input.charCodeAt(t + 1) && r === e.input.charCodeAt(t + 2) && (t += 3, r = e.input.charCodeAt(t), r === 0 || _t(r)));
}
function cd(e, t) {
  t === 1 ? e.result += " " : t > 1 && (e.result += yn.repeat(`
`, t - 1));
}
function nk(e, t, r) {
  var n, s, i, a, o, l, c, u, d = e.kind, p = e.result, m;
  if (m = e.input.charCodeAt(e.position), _t(m) || zn(m) || m === 35 || m === 38 || m === 42 || m === 33 || m === 124 || m === 62 || m === 39 || m === 34 || m === 37 || m === 64 || m === 96 || (m === 63 || m === 45) && (s = e.input.charCodeAt(e.position + 1), _t(s) || r && zn(s)))
    return !1;
  for (e.kind = "scalar", e.result = "", i = a = e.position, o = !1; m !== 0; ) {
    if (m === 58) {
      if (s = e.input.charCodeAt(e.position + 1), _t(s) || r && zn(s))
        break;
    } else if (m === 35) {
      if (n = e.input.charCodeAt(e.position - 1), _t(n))
        break;
    } else {
      if (e.position === e.lineStart && co(e) || r && zn(m))
        break;
      if (nr(m))
        if (l = e.line, c = e.lineStart, u = e.lineIndent, De(e, !1, -1), e.lineIndent >= t) {
          o = !0, m = e.input.charCodeAt(e.position);
          continue;
        } else {
          e.position = a, e.line = l, e.lineStart = c, e.lineIndent = u;
          break;
        }
    }
    o && (zr(e, i, a, !1), cd(e, e.line - l), i = a = e.position, o = !1), vn(m) || (a = e.position + 1), m = e.input.charCodeAt(++e.position);
  }
  return zr(e, i, a, !1), e.result ? !0 : (e.kind = d, e.result = p, !1);
}
function sk(e, t) {
  var r, n, s;
  if (r = e.input.charCodeAt(e.position), r !== 39)
    return !1;
  for (e.kind = "scalar", e.result = "", e.position++, n = s = e.position; (r = e.input.charCodeAt(e.position)) !== 0; )
    if (r === 39)
      if (zr(e, n, e.position, !0), r = e.input.charCodeAt(++e.position), r === 39)
        n = e.position, e.position++, s = e.position;
      else
        return !0;
    else nr(r) ? (zr(e, n, s, !0), cd(e, De(e, !1, t)), n = s = e.position) : e.position === e.lineStart && co(e) ? Z(e, "unexpected end of the document within a single quoted scalar") : (e.position++, s = e.position);
  Z(e, "unexpected end of the stream within a single quoted scalar");
}
function ik(e, t) {
  var r, n, s, i, a, o;
  if (o = e.input.charCodeAt(e.position), o !== 34)
    return !1;
  for (e.kind = "scalar", e.result = "", e.position++, r = n = e.position; (o = e.input.charCodeAt(e.position)) !== 0; ) {
    if (o === 34)
      return zr(e, r, e.position, !0), e.position++, !0;
    if (o === 92) {
      if (zr(e, r, e.position, !0), o = e.input.charCodeAt(++e.position), nr(o))
        De(e, !1, t);
      else if (o < 256 && d0[o])
        e.result += f0[o], e.position++;
      else if ((a = ZD(o)) > 0) {
        for (s = a, i = 0; s > 0; s--)
          o = e.input.charCodeAt(++e.position), (a = QD(o)) >= 0 ? i = (i << 4) + a : Z(e, "expected hexadecimal character");
        e.result += tk(i), e.position++;
      } else
        Z(e, "unknown escape sequence");
      r = n = e.position;
    } else nr(o) ? (zr(e, r, n, !0), cd(e, De(e, !1, t)), r = n = e.position) : e.position === e.lineStart && co(e) ? Z(e, "unexpected end of the document within a double quoted scalar") : (e.position++, n = e.position);
  }
  Z(e, "unexpected end of the stream within a double quoted scalar");
}
function ak(e, t) {
  var r = !0, n, s, i, a = e.tag, o, l = e.anchor, c, u, d, p, m, _ = /* @__PURE__ */ Object.create(null), $, v, g, E;
  if (E = e.input.charCodeAt(e.position), E === 91)
    u = 93, m = !1, o = [];
  else if (E === 123)
    u = 125, m = !0, o = {};
  else
    return !1;
  for (e.anchor !== null && (e.anchorMap[e.anchor] = o), E = e.input.charCodeAt(++e.position); E !== 0; ) {
    if (De(e, !0, t), E = e.input.charCodeAt(e.position), E === u)
      return e.position++, e.tag = a, e.anchor = l, e.kind = m ? "mapping" : "sequence", e.result = o, !0;
    r ? E === 44 && Z(e, "expected the node content, but found ','") : Z(e, "missed comma between flow collection entries"), v = $ = g = null, d = p = !1, E === 63 && (c = e.input.charCodeAt(e.position + 1), _t(c) && (d = p = !0, e.position++, De(e, !0, t))), n = e.line, s = e.lineStart, i = e.position, as(e, t, Ia, !1, !0), v = e.tag, $ = e.result, De(e, !0, t), E = e.input.charCodeAt(e.position), (p || e.line === n) && E === 58 && (d = !0, E = e.input.charCodeAt(++e.position), De(e, !0, t), as(e, t, Ia, !1, !0), g = e.result), m ? Gn(e, o, _, v, $, g, n, s, i) : d ? o.push(Gn(e, null, _, v, $, g, n, s, i)) : o.push($), De(e, !0, t), E = e.input.charCodeAt(e.position), E === 44 ? (r = !0, E = e.input.charCodeAt(++e.position)) : r = !1;
  }
  Z(e, "unexpected end of the stream within a flow collection");
}
function ok(e, t) {
  var r, n, s = sl, i = !1, a = !1, o = t, l = 0, c = !1, u, d;
  if (d = e.input.charCodeAt(e.position), d === 124)
    n = !1;
  else if (d === 62)
    n = !0;
  else
    return !1;
  for (e.kind = "scalar", e.result = ""; d !== 0; )
    if (d = e.input.charCodeAt(++e.position), d === 43 || d === 45)
      sl === s ? s = d === 43 ? Sh : WD : Z(e, "repeat of a chomping mode identifier");
    else if ((u = ek(d)) >= 0)
      u === 0 ? Z(e, "bad explicit indentation width of a block scalar; it cannot be less than one") : a ? Z(e, "repeat of an indentation width identifier") : (o = t + u - 1, a = !0);
    else
      break;
  if (vn(d)) {
    do
      d = e.input.charCodeAt(++e.position);
    while (vn(d));
    if (d === 35)
      do
        d = e.input.charCodeAt(++e.position);
      while (!nr(d) && d !== 0);
  }
  for (; d !== 0; ) {
    for (ld(e), e.lineIndent = 0, d = e.input.charCodeAt(e.position); (!a || e.lineIndent < o) && d === 32; )
      e.lineIndent++, d = e.input.charCodeAt(++e.position);
    if (!a && e.lineIndent > o && (o = e.lineIndent), nr(d)) {
      l++;
      continue;
    }
    if (e.lineIndent < o) {
      s === Sh ? e.result += yn.repeat(`
`, i ? 1 + l : l) : s === sl && i && (e.result += `
`);
      break;
    }
    for (n ? vn(d) ? (c = !0, e.result += yn.repeat(`
`, i ? 1 + l : l)) : c ? (c = !1, e.result += yn.repeat(`
`, l + 1)) : l === 0 ? i && (e.result += " ") : e.result += yn.repeat(`
`, l) : e.result += yn.repeat(`
`, i ? 1 + l : l), i = !0, a = !0, l = 0, r = e.position; !nr(d) && d !== 0; )
      d = e.input.charCodeAt(++e.position);
    zr(e, r, e.position, !1);
  }
  return !0;
}
function Nh(e, t) {
  var r, n = e.tag, s = e.anchor, i = [], a, o = !1, l;
  if (e.firstTabInLine !== -1) return !1;
  for (e.anchor !== null && (e.anchorMap[e.anchor] = i), l = e.input.charCodeAt(e.position); l !== 0 && (e.firstTabInLine !== -1 && (e.position = e.firstTabInLine, Z(e, "tab characters must not be used in indentation")), !(l !== 45 || (a = e.input.charCodeAt(e.position + 1), !_t(a)))); ) {
    if (o = !0, e.position++, De(e, !0, -1) && e.lineIndent <= t) {
      i.push(null), l = e.input.charCodeAt(e.position);
      continue;
    }
    if (r = e.line, as(e, t, l0, !1, !0), i.push(e.result), De(e, !0, -1), l = e.input.charCodeAt(e.position), (e.line === r || e.lineIndent > t) && l !== 0)
      Z(e, "bad indentation of a sequence entry");
    else if (e.lineIndent < t)
      break;
  }
  return o ? (e.tag = n, e.anchor = s, e.kind = "sequence", e.result = i, !0) : !1;
}
function lk(e, t, r) {
  var n, s, i, a, o, l, c = e.tag, u = e.anchor, d = {}, p = /* @__PURE__ */ Object.create(null), m = null, _ = null, $ = null, v = !1, g = !1, E;
  if (e.firstTabInLine !== -1) return !1;
  for (e.anchor !== null && (e.anchorMap[e.anchor] = d), E = e.input.charCodeAt(e.position); E !== 0; ) {
    if (!v && e.firstTabInLine !== -1 && (e.position = e.firstTabInLine, Z(e, "tab characters must not be used in indentation")), n = e.input.charCodeAt(e.position + 1), i = e.line, (E === 63 || E === 58) && _t(n))
      E === 63 ? (v && (Gn(e, d, p, m, _, null, a, o, l), m = _ = $ = null), g = !0, v = !0, s = !0) : v ? (v = !1, s = !0) : Z(e, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"), e.position += 1, E = n;
    else {
      if (a = e.line, o = e.lineStart, l = e.position, !as(e, r, o0, !1, !0))
        break;
      if (e.line === i) {
        for (E = e.input.charCodeAt(e.position); vn(E); )
          E = e.input.charCodeAt(++e.position);
        if (E === 58)
          E = e.input.charCodeAt(++e.position), _t(E) || Z(e, "a whitespace character is expected after the key-value separator within a block mapping"), v && (Gn(e, d, p, m, _, null, a, o, l), m = _ = $ = null), g = !0, v = !1, s = !1, m = e.tag, _ = e.result;
        else if (g)
          Z(e, "can not read an implicit mapping pair; a colon is missed");
        else
          return e.tag = c, e.anchor = u, !0;
      } else if (g)
        Z(e, "can not read a block mapping entry; a multiline key may not be an implicit key");
      else
        return e.tag = c, e.anchor = u, !0;
    }
    if ((e.line === i || e.lineIndent > t) && (v && (a = e.line, o = e.lineStart, l = e.position), as(e, t, Da, !0, s) && (v ? _ = e.result : $ = e.result), v || (Gn(e, d, p, m, _, $, a, o, l), m = _ = $ = null), De(e, !0, -1), E = e.input.charCodeAt(e.position)), (e.line === i || e.lineIndent > t) && E !== 0)
      Z(e, "bad indentation of a mapping entry");
    else if (e.lineIndent < t)
      break;
  }
  return v && Gn(e, d, p, m, _, null, a, o, l), g && (e.tag = c, e.anchor = u, e.kind = "mapping", e.result = d), g;
}
function ck(e) {
  var t, r = !1, n = !1, s, i, a;
  if (a = e.input.charCodeAt(e.position), a !== 33) return !1;
  if (e.tag !== null && Z(e, "duplication of a tag property"), a = e.input.charCodeAt(++e.position), a === 60 ? (r = !0, a = e.input.charCodeAt(++e.position)) : a === 33 ? (n = !0, s = "!!", a = e.input.charCodeAt(++e.position)) : s = "!", t = e.position, r) {
    do
      a = e.input.charCodeAt(++e.position);
    while (a !== 0 && a !== 62);
    e.position < e.length ? (i = e.input.slice(t, e.position), a = e.input.charCodeAt(++e.position)) : Z(e, "unexpected end of the stream within a verbatim tag");
  } else {
    for (; a !== 0 && !_t(a); )
      a === 33 && (n ? Z(e, "tag suffix cannot contain exclamation marks") : (s = e.input.slice(t - 1, e.position + 1), c0.test(s) || Z(e, "named tag handle cannot contain such characters"), n = !0, t = e.position + 1)), a = e.input.charCodeAt(++e.position);
    i = e.input.slice(t, e.position), JD.test(i) && Z(e, "tag suffix cannot contain flow indicator characters");
  }
  i && !u0.test(i) && Z(e, "tag name cannot contain such characters: " + i);
  try {
    i = decodeURIComponent(i);
  } catch {
    Z(e, "tag name is malformed: " + i);
  }
  return r ? e.tag = i : Wr.call(e.tagMap, s) ? e.tag = e.tagMap[s] + i : s === "!" ? e.tag = "!" + i : s === "!!" ? e.tag = "tag:yaml.org,2002:" + i : Z(e, 'undeclared tag handle "' + s + '"'), !0;
}
function uk(e) {
  var t, r;
  if (r = e.input.charCodeAt(e.position), r !== 38) return !1;
  for (e.anchor !== null && Z(e, "duplication of an anchor property"), r = e.input.charCodeAt(++e.position), t = e.position; r !== 0 && !_t(r) && !zn(r); )
    r = e.input.charCodeAt(++e.position);
  return e.position === t && Z(e, "name of an anchor node must contain at least one character"), e.anchor = e.input.slice(t, e.position), !0;
}
function dk(e) {
  var t, r, n;
  if (n = e.input.charCodeAt(e.position), n !== 42) return !1;
  for (n = e.input.charCodeAt(++e.position), t = e.position; n !== 0 && !_t(n) && !zn(n); )
    n = e.input.charCodeAt(++e.position);
  return e.position === t && Z(e, "name of an alias node must contain at least one character"), r = e.input.slice(t, e.position), Wr.call(e.anchorMap, r) || Z(e, 'unidentified alias "' + r + '"'), e.result = e.anchorMap[r], De(e, !0, -1), !0;
}
function as(e, t, r, n, s) {
  var i, a, o, l = 1, c = !1, u = !1, d, p, m, _, $, v;
  if (e.listener !== null && e.listener("open", e), e.tag = null, e.anchor = null, e.kind = null, e.result = null, i = a = o = Da === r || l0 === r, n && De(e, !0, -1) && (c = !0, e.lineIndent > t ? l = 1 : e.lineIndent === t ? l = 0 : e.lineIndent < t && (l = -1)), l === 1)
    for (; ck(e) || uk(e); )
      De(e, !0, -1) ? (c = !0, o = i, e.lineIndent > t ? l = 1 : e.lineIndent === t ? l = 0 : e.lineIndent < t && (l = -1)) : o = !1;
  if (o && (o = c || s), (l === 1 || Da === r) && (Ia === r || o0 === r ? $ = t : $ = t + 1, v = e.position - e.lineStart, l === 1 ? o && (Nh(e, v) || lk(e, v, $)) || ak(e, $) ? u = !0 : (a && ok(e, $) || sk(e, $) || ik(e, $) ? u = !0 : dk(e) ? (u = !0, (e.tag !== null || e.anchor !== null) && Z(e, "alias node should not have any properties")) : nk(e, $, Ia === r) && (u = !0, e.tag === null && (e.tag = "?")), e.anchor !== null && (e.anchorMap[e.anchor] = e.result)) : l === 0 && (u = o && Nh(e, v))), e.tag === null)
    e.anchor !== null && (e.anchorMap[e.anchor] = e.result);
  else if (e.tag === "?") {
    for (e.result !== null && e.kind !== "scalar" && Z(e, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + e.kind + '"'), d = 0, p = e.implicitTypes.length; d < p; d += 1)
      if (_ = e.implicitTypes[d], _.resolve(e.result)) {
        e.result = _.construct(e.result), e.tag = _.tag, e.anchor !== null && (e.anchorMap[e.anchor] = e.result);
        break;
      }
  } else if (e.tag !== "!") {
    if (Wr.call(e.typeMap[e.kind || "fallback"], e.tag))
      _ = e.typeMap[e.kind || "fallback"][e.tag];
    else
      for (_ = null, m = e.typeMap.multi[e.kind || "fallback"], d = 0, p = m.length; d < p; d += 1)
        if (e.tag.slice(0, m[d].tag.length) === m[d].tag) {
          _ = m[d];
          break;
        }
    _ || Z(e, "unknown tag !<" + e.tag + ">"), e.result !== null && _.kind !== e.kind && Z(e, "unacceptable node kind for !<" + e.tag + '> tag; it should be "' + _.kind + '", not "' + e.kind + '"'), _.resolve(e.result, e.tag) ? (e.result = _.construct(e.result, e.tag), e.anchor !== null && (e.anchorMap[e.anchor] = e.result)) : Z(e, "cannot resolve a node with !<" + e.tag + "> explicit tag");
  }
  return e.listener !== null && e.listener("close", e), e.tag !== null || e.anchor !== null || u;
}
function fk(e) {
  var t = e.position, r, n, s, i = !1, a;
  for (e.version = null, e.checkLineBreaks = e.legacy, e.tagMap = /* @__PURE__ */ Object.create(null), e.anchorMap = /* @__PURE__ */ Object.create(null); (a = e.input.charCodeAt(e.position)) !== 0 && (De(e, !0, -1), a = e.input.charCodeAt(e.position), !(e.lineIndent > 0 || a !== 37)); ) {
    for (i = !0, a = e.input.charCodeAt(++e.position), r = e.position; a !== 0 && !_t(a); )
      a = e.input.charCodeAt(++e.position);
    for (n = e.input.slice(r, e.position), s = [], n.length < 1 && Z(e, "directive name must not be less than one character in length"); a !== 0; ) {
      for (; vn(a); )
        a = e.input.charCodeAt(++e.position);
      if (a === 35) {
        do
          a = e.input.charCodeAt(++e.position);
        while (a !== 0 && !nr(a));
        break;
      }
      if (nr(a)) break;
      for (r = e.position; a !== 0 && !_t(a); )
        a = e.input.charCodeAt(++e.position);
      s.push(e.input.slice(r, e.position));
    }
    a !== 0 && ld(e), Wr.call(Ah, n) ? Ah[n](e, n, s) : ka(e, 'unknown document directive "' + n + '"');
  }
  if (De(e, !0, -1), e.lineIndent === 0 && e.input.charCodeAt(e.position) === 45 && e.input.charCodeAt(e.position + 1) === 45 && e.input.charCodeAt(e.position + 2) === 45 ? (e.position += 3, De(e, !0, -1)) : i && Z(e, "directives end mark is expected"), as(e, e.lineIndent - 1, Da, !1, !0), De(e, !0, -1), e.checkLineBreaks && XD.test(e.input.slice(t, e.position)) && ka(e, "non-ASCII line breaks are interpreted as content"), e.documents.push(e.result), e.position === e.lineStart && co(e)) {
    e.input.charCodeAt(e.position) === 46 && (e.position += 3, De(e, !0, -1));
    return;
  }
  if (e.position < e.length - 1)
    Z(e, "end of the stream or a document separator is expected");
  else
    return;
}
function p0(e, t) {
  e = String(e), t = t || {}, e.length !== 0 && (e.charCodeAt(e.length - 1) !== 10 && e.charCodeAt(e.length - 1) !== 13 && (e += `
`), e.charCodeAt(0) === 65279 && (e = e.slice(1)));
  var r = new rk(e, t), n = e.indexOf("\0");
  for (n !== -1 && (r.position = n, Z(r, "null byte is not allowed in input")), r.input += "\0"; r.input.charCodeAt(r.position) === 32; )
    r.lineIndent += 1, r.position += 1;
  for (; r.position < r.length - 1; )
    fk(r);
  return r.documents;
}
function hk(e, t, r) {
  t !== null && typeof t == "object" && typeof r > "u" && (r = t, t = null);
  var n = p0(e, r);
  if (typeof t != "function")
    return n;
  for (var s = 0, i = n.length; s < i; s += 1)
    t(n[s]);
}
function pk(e, t) {
  var r = p0(e, t);
  if (r.length !== 0) {
    if (r.length === 1)
      return r[0];
    throw new a0("expected a single document in the stream, but found more");
  }
}
id.loadAll = hk;
id.load = pk;
var m0 = {}, uo = Yt, Ei = wi, mk = od, g0 = Object.prototype.toString, y0 = Object.prototype.hasOwnProperty, ud = 65279, gk = 9, ti = 10, yk = 13, $k = 32, _k = 33, vk = 34, Gl = 35, wk = 37, Ek = 38, bk = 39, Sk = 42, $0 = 44, Tk = 45, Ua = 58, Pk = 61, Ak = 62, Rk = 63, Nk = 64, _0 = 91, v0 = 93, Ck = 96, w0 = 123, Ok = 124, E0 = 125, it = {};
it[0] = "\\0";
it[7] = "\\a";
it[8] = "\\b";
it[9] = "\\t";
it[10] = "\\n";
it[11] = "\\v";
it[12] = "\\f";
it[13] = "\\r";
it[27] = "\\e";
it[34] = '\\"';
it[92] = "\\\\";
it[133] = "\\N";
it[160] = "\\_";
it[8232] = "\\L";
it[8233] = "\\P";
var Ik = [
  "y",
  "Y",
  "yes",
  "Yes",
  "YES",
  "on",
  "On",
  "ON",
  "n",
  "N",
  "no",
  "No",
  "NO",
  "off",
  "Off",
  "OFF"
], Dk = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
function kk(e, t) {
  var r, n, s, i, a, o, l;
  if (t === null) return {};
  for (r = {}, n = Object.keys(t), s = 0, i = n.length; s < i; s += 1)
    a = n[s], o = String(t[a]), a.slice(0, 2) === "!!" && (a = "tag:yaml.org,2002:" + a.slice(2)), l = e.compiledTypeMap.fallback[a], l && y0.call(l.styleAliases, o) && (o = l.styleAliases[o]), r[a] = o;
  return r;
}
function Uk(e) {
  var t, r, n;
  if (t = e.toString(16).toUpperCase(), e <= 255)
    r = "x", n = 2;
  else if (e <= 65535)
    r = "u", n = 4;
  else if (e <= 4294967295)
    r = "U", n = 8;
  else
    throw new Ei("code point within a string may not be greater than 0xFFFFFFFF");
  return "\\" + r + uo.repeat("0", n - t.length) + t;
}
var Fk = 1, ri = 2;
function Lk(e) {
  this.schema = e.schema || mk, this.indent = Math.max(1, e.indent || 2), this.noArrayIndent = e.noArrayIndent || !1, this.skipInvalid = e.skipInvalid || !1, this.flowLevel = uo.isNothing(e.flowLevel) ? -1 : e.flowLevel, this.styleMap = kk(this.schema, e.styles || null), this.sortKeys = e.sortKeys || !1, this.lineWidth = e.lineWidth || 80, this.noRefs = e.noRefs || !1, this.noCompatMode = e.noCompatMode || !1, this.condenseFlow = e.condenseFlow || !1, this.quotingType = e.quotingType === '"' ? ri : Fk, this.forceQuotes = e.forceQuotes || !1, this.replacer = typeof e.replacer == "function" ? e.replacer : null, this.implicitTypes = this.schema.compiledImplicit, this.explicitTypes = this.schema.compiledExplicit, this.tag = null, this.result = "", this.duplicates = [], this.usedDuplicates = null;
}
function Ch(e, t) {
  for (var r = uo.repeat(" ", t), n = 0, s = -1, i = "", a, o = e.length; n < o; )
    s = e.indexOf(`
`, n), s === -1 ? (a = e.slice(n), n = o) : (a = e.slice(n, s + 1), n = s + 1), a.length && a !== `
` && (i += r), i += a;
  return i;
}
function Kl(e, t) {
  return `
` + uo.repeat(" ", e.indent * t);
}
function jk(e, t) {
  var r, n, s;
  for (r = 0, n = e.implicitTypes.length; r < n; r += 1)
    if (s = e.implicitTypes[r], s.resolve(t))
      return !0;
  return !1;
}
function Fa(e) {
  return e === $k || e === gk;
}
function ni(e) {
  return 32 <= e && e <= 126 || 161 <= e && e <= 55295 && e !== 8232 && e !== 8233 || 57344 <= e && e <= 65533 && e !== ud || 65536 <= e && e <= 1114111;
}
function Oh(e) {
  return ni(e) && e !== ud && e !== yk && e !== ti;
}
function Ih(e, t, r) {
  var n = Oh(e), s = n && !Fa(e);
  return (
    // ns-plain-safe
    (r ? (
      // c = flow-in
      n
    ) : n && e !== $0 && e !== _0 && e !== v0 && e !== w0 && e !== E0) && e !== Gl && !(t === Ua && !s) || Oh(t) && !Fa(t) && e === Gl || t === Ua && s
  );
}
function Mk(e) {
  return ni(e) && e !== ud && !Fa(e) && e !== Tk && e !== Rk && e !== Ua && e !== $0 && e !== _0 && e !== v0 && e !== w0 && e !== E0 && e !== Gl && e !== Ek && e !== Sk && e !== _k && e !== Ok && e !== Pk && e !== Ak && e !== bk && e !== vk && e !== wk && e !== Nk && e !== Ck;
}
function xk(e) {
  return !Fa(e) && e !== Ua;
}
function js(e, t) {
  var r = e.charCodeAt(t), n;
  return r >= 55296 && r <= 56319 && t + 1 < e.length && (n = e.charCodeAt(t + 1), n >= 56320 && n <= 57343) ? (r - 55296) * 1024 + n - 56320 + 65536 : r;
}
function b0(e) {
  var t = /^\n* /;
  return t.test(e);
}
var S0 = 1, Wl = 2, T0 = 3, P0 = 4, Vn = 5;
function qk(e, t, r, n, s, i, a, o) {
  var l, c = 0, u = null, d = !1, p = !1, m = n !== -1, _ = -1, $ = Mk(js(e, 0)) && xk(js(e, e.length - 1));
  if (t || a)
    for (l = 0; l < e.length; c >= 65536 ? l += 2 : l++) {
      if (c = js(e, l), !ni(c))
        return Vn;
      $ = $ && Ih(c, u, o), u = c;
    }
  else {
    for (l = 0; l < e.length; c >= 65536 ? l += 2 : l++) {
      if (c = js(e, l), c === ti)
        d = !0, m && (p = p || // Foldable line = too long, and not more-indented.
        l - _ - 1 > n && e[_ + 1] !== " ", _ = l);
      else if (!ni(c))
        return Vn;
      $ = $ && Ih(c, u, o), u = c;
    }
    p = p || m && l - _ - 1 > n && e[_ + 1] !== " ";
  }
  return !d && !p ? $ && !a && !s(e) ? S0 : i === ri ? Vn : Wl : r > 9 && b0(e) ? Vn : a ? i === ri ? Vn : Wl : p ? P0 : T0;
}
function Vk(e, t, r, n, s) {
  e.dump = function() {
    if (t.length === 0)
      return e.quotingType === ri ? '""' : "''";
    if (!e.noCompatMode && (Ik.indexOf(t) !== -1 || Dk.test(t)))
      return e.quotingType === ri ? '"' + t + '"' : "'" + t + "'";
    var i = e.indent * Math.max(1, r), a = e.lineWidth === -1 ? -1 : Math.max(Math.min(e.lineWidth, 40), e.lineWidth - i), o = n || e.flowLevel > -1 && r >= e.flowLevel;
    function l(c) {
      return jk(e, c);
    }
    switch (qk(
      t,
      o,
      e.indent,
      a,
      l,
      e.quotingType,
      e.forceQuotes && !n,
      s
    )) {
      case S0:
        return t;
      case Wl:
        return "'" + t.replace(/'/g, "''") + "'";
      case T0:
        return "|" + Dh(t, e.indent) + kh(Ch(t, i));
      case P0:
        return ">" + Dh(t, e.indent) + kh(Ch(Bk(t, a), i));
      case Vn:
        return '"' + Hk(t) + '"';
      default:
        throw new Ei("impossible error: invalid scalar style");
    }
  }();
}
function Dh(e, t) {
  var r = b0(e) ? String(t) : "", n = e[e.length - 1] === `
`, s = n && (e[e.length - 2] === `
` || e === `
`), i = s ? "+" : n ? "" : "-";
  return r + i + `
`;
}
function kh(e) {
  return e[e.length - 1] === `
` ? e.slice(0, -1) : e;
}
function Bk(e, t) {
  for (var r = /(\n+)([^\n]*)/g, n = function() {
    var c = e.indexOf(`
`);
    return c = c !== -1 ? c : e.length, r.lastIndex = c, Uh(e.slice(0, c), t);
  }(), s = e[0] === `
` || e[0] === " ", i, a; a = r.exec(e); ) {
    var o = a[1], l = a[2];
    i = l[0] === " ", n += o + (!s && !i && l !== "" ? `
` : "") + Uh(l, t), s = i;
  }
  return n;
}
function Uh(e, t) {
  if (e === "" || e[0] === " ") return e;
  for (var r = / [^ ]/g, n, s = 0, i, a = 0, o = 0, l = ""; n = r.exec(e); )
    o = n.index, o - s > t && (i = a > s ? a : o, l += `
` + e.slice(s, i), s = i + 1), a = o;
  return l += `
`, e.length - s > t && a > s ? l += e.slice(s, a) + `
` + e.slice(a + 1) : l += e.slice(s), l.slice(1);
}
function Hk(e) {
  for (var t = "", r = 0, n, s = 0; s < e.length; r >= 65536 ? s += 2 : s++)
    r = js(e, s), n = it[r], !n && ni(r) ? (t += e[s], r >= 65536 && (t += e[s + 1])) : t += n || Uk(r);
  return t;
}
function zk(e, t, r) {
  var n = "", s = e.tag, i, a, o;
  for (i = 0, a = r.length; i < a; i += 1)
    o = r[i], e.replacer && (o = e.replacer.call(r, String(i), o)), (br(e, t, o, !1, !1) || typeof o > "u" && br(e, t, null, !1, !1)) && (n !== "" && (n += "," + (e.condenseFlow ? "" : " ")), n += e.dump);
  e.tag = s, e.dump = "[" + n + "]";
}
function Fh(e, t, r, n) {
  var s = "", i = e.tag, a, o, l;
  for (a = 0, o = r.length; a < o; a += 1)
    l = r[a], e.replacer && (l = e.replacer.call(r, String(a), l)), (br(e, t + 1, l, !0, !0, !1, !0) || typeof l > "u" && br(e, t + 1, null, !0, !0, !1, !0)) && ((!n || s !== "") && (s += Kl(e, t)), e.dump && ti === e.dump.charCodeAt(0) ? s += "-" : s += "- ", s += e.dump);
  e.tag = i, e.dump = s || "[]";
}
function Gk(e, t, r) {
  var n = "", s = e.tag, i = Object.keys(r), a, o, l, c, u;
  for (a = 0, o = i.length; a < o; a += 1)
    u = "", n !== "" && (u += ", "), e.condenseFlow && (u += '"'), l = i[a], c = r[l], e.replacer && (c = e.replacer.call(r, l, c)), br(e, t, l, !1, !1) && (e.dump.length > 1024 && (u += "? "), u += e.dump + (e.condenseFlow ? '"' : "") + ":" + (e.condenseFlow ? "" : " "), br(e, t, c, !1, !1) && (u += e.dump, n += u));
  e.tag = s, e.dump = "{" + n + "}";
}
function Kk(e, t, r, n) {
  var s = "", i = e.tag, a = Object.keys(r), o, l, c, u, d, p;
  if (e.sortKeys === !0)
    a.sort();
  else if (typeof e.sortKeys == "function")
    a.sort(e.sortKeys);
  else if (e.sortKeys)
    throw new Ei("sortKeys must be a boolean or a function");
  for (o = 0, l = a.length; o < l; o += 1)
    p = "", (!n || s !== "") && (p += Kl(e, t)), c = a[o], u = r[c], e.replacer && (u = e.replacer.call(r, c, u)), br(e, t + 1, c, !0, !0, !0) && (d = e.tag !== null && e.tag !== "?" || e.dump && e.dump.length > 1024, d && (e.dump && ti === e.dump.charCodeAt(0) ? p += "?" : p += "? "), p += e.dump, d && (p += Kl(e, t)), br(e, t + 1, u, !0, d) && (e.dump && ti === e.dump.charCodeAt(0) ? p += ":" : p += ": ", p += e.dump, s += p));
  e.tag = i, e.dump = s || "{}";
}
function Lh(e, t, r) {
  var n, s, i, a, o, l;
  for (s = r ? e.explicitTypes : e.implicitTypes, i = 0, a = s.length; i < a; i += 1)
    if (o = s[i], (o.instanceOf || o.predicate) && (!o.instanceOf || typeof t == "object" && t instanceof o.instanceOf) && (!o.predicate || o.predicate(t))) {
      if (r ? o.multi && o.representName ? e.tag = o.representName(t) : e.tag = o.tag : e.tag = "?", o.represent) {
        if (l = e.styleMap[o.tag] || o.defaultStyle, g0.call(o.represent) === "[object Function]")
          n = o.represent(t, l);
        else if (y0.call(o.represent, l))
          n = o.represent[l](t, l);
        else
          throw new Ei("!<" + o.tag + '> tag resolver accepts not "' + l + '" style');
        e.dump = n;
      }
      return !0;
    }
  return !1;
}
function br(e, t, r, n, s, i, a) {
  e.tag = null, e.dump = r, Lh(e, r, !1) || Lh(e, r, !0);
  var o = g0.call(e.dump), l = n, c;
  n && (n = e.flowLevel < 0 || e.flowLevel > t);
  var u = o === "[object Object]" || o === "[object Array]", d, p;
  if (u && (d = e.duplicates.indexOf(r), p = d !== -1), (e.tag !== null && e.tag !== "?" || p || e.indent !== 2 && t > 0) && (s = !1), p && e.usedDuplicates[d])
    e.dump = "*ref_" + d;
  else {
    if (u && p && !e.usedDuplicates[d] && (e.usedDuplicates[d] = !0), o === "[object Object]")
      n && Object.keys(e.dump).length !== 0 ? (Kk(e, t, e.dump, s), p && (e.dump = "&ref_" + d + e.dump)) : (Gk(e, t, e.dump), p && (e.dump = "&ref_" + d + " " + e.dump));
    else if (o === "[object Array]")
      n && e.dump.length !== 0 ? (e.noArrayIndent && !a && t > 0 ? Fh(e, t - 1, e.dump, s) : Fh(e, t, e.dump, s), p && (e.dump = "&ref_" + d + e.dump)) : (zk(e, t, e.dump), p && (e.dump = "&ref_" + d + " " + e.dump));
    else if (o === "[object String]")
      e.tag !== "?" && Vk(e, e.dump, t, i, l);
    else {
      if (o === "[object Undefined]")
        return !1;
      if (e.skipInvalid) return !1;
      throw new Ei("unacceptable kind of an object to dump " + o);
    }
    e.tag !== null && e.tag !== "?" && (c = encodeURI(
      e.tag[0] === "!" ? e.tag.slice(1) : e.tag
    ).replace(/!/g, "%21"), e.tag[0] === "!" ? c = "!" + c : c.slice(0, 18) === "tag:yaml.org,2002:" ? c = "!!" + c.slice(18) : c = "!<" + c + ">", e.dump = c + " " + e.dump);
  }
  return !0;
}
function Wk(e, t) {
  var r = [], n = [], s, i;
  for (Yl(e, r, n), s = 0, i = n.length; s < i; s += 1)
    t.duplicates.push(r[n[s]]);
  t.usedDuplicates = new Array(i);
}
function Yl(e, t, r) {
  var n, s, i;
  if (e !== null && typeof e == "object")
    if (s = t.indexOf(e), s !== -1)
      r.indexOf(s) === -1 && r.push(s);
    else if (t.push(e), Array.isArray(e))
      for (s = 0, i = e.length; s < i; s += 1)
        Yl(e[s], t, r);
    else
      for (n = Object.keys(e), s = 0, i = n.length; s < i; s += 1)
        Yl(e[n[s]], t, r);
}
function Yk(e, t) {
  t = t || {};
  var r = new Lk(t);
  r.noRefs || Wk(e, r);
  var n = e;
  return r.replacer && (n = r.replacer.call({ "": n }, "", n)), br(r, 0, n, !0, !0) ? r.dump + `
` : "";
}
m0.dump = Yk;
var A0 = id, Xk = m0;
function dd(e, t) {
  return function() {
    throw new Error("Function yaml." + e + " is removed in js-yaml 4. Use yaml." + t + " instead, which is now safe by default.");
  };
}
Ye.Type = pt;
Ye.Schema = xg;
Ye.FAILSAFE_SCHEMA = Hg;
Ye.JSON_SCHEMA = Xg;
Ye.CORE_SCHEMA = Jg;
Ye.DEFAULT_SCHEMA = od;
Ye.load = A0.load;
Ye.loadAll = A0.loadAll;
Ye.dump = Xk.dump;
Ye.YAMLException = wi;
Ye.types = {
  binary: r0,
  float: Yg,
  map: Bg,
  null: zg,
  pairs: s0,
  set: i0,
  timestamp: e0,
  bool: Gg,
  int: Kg,
  merge: t0,
  omap: n0,
  seq: Vg,
  str: qg
};
Ye.safeLoad = dd("safeLoad", "load");
Ye.safeLoadAll = dd("safeLoadAll", "loadAll");
Ye.safeDump = dd("safeDump", "dump");
var fo = {};
Object.defineProperty(fo, "__esModule", { value: !0 });
fo.Lazy = void 0;
class Jk {
  constructor(t) {
    this._value = null, this.creator = t;
  }
  get hasValue() {
    return this.creator == null;
  }
  get value() {
    if (this.creator == null)
      return this._value;
    const t = this.creator();
    return this.value = t, t;
  }
  set value(t) {
    this._value = t, this.creator = null;
  }
}
fo.Lazy = Jk;
var bi = {}, La = { exports: {} };
La.exports;
(function(e, t) {
  var r = 200, n = "__lodash_hash_undefined__", s = 1, i = 2, a = 9007199254740991, o = "[object Arguments]", l = "[object Array]", c = "[object AsyncFunction]", u = "[object Boolean]", d = "[object Date]", p = "[object Error]", m = "[object Function]", _ = "[object GeneratorFunction]", $ = "[object Map]", v = "[object Number]", g = "[object Null]", E = "[object Object]", N = "[object Promise]", O = "[object Proxy]", U = "[object RegExp]", q = "[object Set]", B = "[object String]", me = "[object Symbol]", I = "[object Undefined]", ye = "[object WeakMap]", W = "[object ArrayBuffer]", x = "[object DataView]", se = "[object Float32Array]", F = "[object Float64Array]", L = "[object Int8Array]", K = "[object Int16Array]", M = "[object Int32Array]", X = "[object Uint8Array]", H = "[object Uint8ClampedArray]", C = "[object Uint16Array]", b = "[object Uint32Array]", A = /[\\^$.*+?()[\]{}|]/g, S = /^\[object .+?Constructor\]$/, f = /^(?:0|[1-9]\d*)$/, y = {};
  y[se] = y[F] = y[L] = y[K] = y[M] = y[X] = y[H] = y[C] = y[b] = !0, y[o] = y[l] = y[W] = y[u] = y[x] = y[d] = y[p] = y[m] = y[$] = y[v] = y[E] = y[U] = y[q] = y[B] = y[ye] = !1;
  var P = typeof Dt == "object" && Dt && Dt.Object === Object && Dt, w = typeof self == "object" && self && self.Object === Object && self, h = P || w || Function("return this")(), k = t && !t.nodeType && t, R = k && !0 && e && !e.nodeType && e, z = R && R.exports === k, he = z && P.process, ge = function() {
    try {
      return he && he.binding && he.binding("util");
    } catch {
    }
  }(), we = ge && ge.isTypedArray;
  function Pe(T, D) {
    for (var j = -1, Y = T == null ? 0 : T.length, Ee = 0, ie = []; ++j < Y; ) {
      var Ce = T[j];
      D(Ce, j, T) && (ie[Ee++] = Ce);
    }
    return ie;
  }
  function Xe(T, D) {
    for (var j = -1, Y = D.length, Ee = T.length; ++j < Y; )
      T[Ee + j] = D[j];
    return T;
  }
  function $e(T, D) {
    for (var j = -1, Y = T == null ? 0 : T.length; ++j < Y; )
      if (D(T[j], j, T))
        return !0;
    return !1;
  }
  function Ue(T, D) {
    for (var j = -1, Y = Array(T); ++j < T; )
      Y[j] = D(j);
    return Y;
  }
  function kt(T) {
    return function(D) {
      return T(D);
    };
  }
  function Pt(T, D) {
    return T.has(D);
  }
  function vt(T, D) {
    return T == null ? void 0 : T[D];
  }
  function At(T) {
    var D = -1, j = Array(T.size);
    return T.forEach(function(Y, Ee) {
      j[++D] = [Ee, Y];
    }), j;
  }
  function ar(T, D) {
    return function(j) {
      return T(D(j));
    };
  }
  function or(T) {
    var D = -1, j = Array(T.size);
    return T.forEach(function(Y) {
      j[++D] = Y;
    }), j;
  }
  var lr = Array.prototype, wt = Function.prototype, Rt = Object.prototype, cr = h["__core-js_shared__"], Tr = wt.toString, mt = Rt.hasOwnProperty, $d = function() {
    var T = /[^.]+$/.exec(cr && cr.keys && cr.keys.IE_PROTO || "");
    return T ? "Symbol(src)_1." + T : "";
  }(), _d = Rt.toString, H0 = RegExp(
    "^" + Tr.call(mt).replace(A, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
  ), vd = z ? h.Buffer : void 0, Ai = h.Symbol, wd = h.Uint8Array, Ed = Rt.propertyIsEnumerable, z0 = lr.splice, Zr = Ai ? Ai.toStringTag : void 0, bd = Object.getOwnPropertySymbols, G0 = vd ? vd.isBuffer : void 0, K0 = ar(Object.keys, Object), Eo = Nn(h, "DataView"), _s = Nn(h, "Map"), bo = Nn(h, "Promise"), So = Nn(h, "Set"), To = Nn(h, "WeakMap"), vs = Nn(Object, "create"), W0 = rn(Eo), Y0 = rn(_s), X0 = rn(bo), J0 = rn(So), Q0 = rn(To), Sd = Ai ? Ai.prototype : void 0, Po = Sd ? Sd.valueOf : void 0;
  function en(T) {
    var D = -1, j = T == null ? 0 : T.length;
    for (this.clear(); ++D < j; ) {
      var Y = T[D];
      this.set(Y[0], Y[1]);
    }
  }
  function Z0() {
    this.__data__ = vs ? vs(null) : {}, this.size = 0;
  }
  function ey(T) {
    var D = this.has(T) && delete this.__data__[T];
    return this.size -= D ? 1 : 0, D;
  }
  function ty(T) {
    var D = this.__data__;
    if (vs) {
      var j = D[T];
      return j === n ? void 0 : j;
    }
    return mt.call(D, T) ? D[T] : void 0;
  }
  function ry(T) {
    var D = this.__data__;
    return vs ? D[T] !== void 0 : mt.call(D, T);
  }
  function ny(T, D) {
    var j = this.__data__;
    return this.size += this.has(T) ? 0 : 1, j[T] = vs && D === void 0 ? n : D, this;
  }
  en.prototype.clear = Z0, en.prototype.delete = ey, en.prototype.get = ty, en.prototype.has = ry, en.prototype.set = ny;
  function ur(T) {
    var D = -1, j = T == null ? 0 : T.length;
    for (this.clear(); ++D < j; ) {
      var Y = T[D];
      this.set(Y[0], Y[1]);
    }
  }
  function sy() {
    this.__data__ = [], this.size = 0;
  }
  function iy(T) {
    var D = this.__data__, j = Ni(D, T);
    if (j < 0)
      return !1;
    var Y = D.length - 1;
    return j == Y ? D.pop() : z0.call(D, j, 1), --this.size, !0;
  }
  function ay(T) {
    var D = this.__data__, j = Ni(D, T);
    return j < 0 ? void 0 : D[j][1];
  }
  function oy(T) {
    return Ni(this.__data__, T) > -1;
  }
  function ly(T, D) {
    var j = this.__data__, Y = Ni(j, T);
    return Y < 0 ? (++this.size, j.push([T, D])) : j[Y][1] = D, this;
  }
  ur.prototype.clear = sy, ur.prototype.delete = iy, ur.prototype.get = ay, ur.prototype.has = oy, ur.prototype.set = ly;
  function tn(T) {
    var D = -1, j = T == null ? 0 : T.length;
    for (this.clear(); ++D < j; ) {
      var Y = T[D];
      this.set(Y[0], Y[1]);
    }
  }
  function cy() {
    this.size = 0, this.__data__ = {
      hash: new en(),
      map: new (_s || ur)(),
      string: new en()
    };
  }
  function uy(T) {
    var D = Ci(this, T).delete(T);
    return this.size -= D ? 1 : 0, D;
  }
  function dy(T) {
    return Ci(this, T).get(T);
  }
  function fy(T) {
    return Ci(this, T).has(T);
  }
  function hy(T, D) {
    var j = Ci(this, T), Y = j.size;
    return j.set(T, D), this.size += j.size == Y ? 0 : 1, this;
  }
  tn.prototype.clear = cy, tn.prototype.delete = uy, tn.prototype.get = dy, tn.prototype.has = fy, tn.prototype.set = hy;
  function Ri(T) {
    var D = -1, j = T == null ? 0 : T.length;
    for (this.__data__ = new tn(); ++D < j; )
      this.add(T[D]);
  }
  function py(T) {
    return this.__data__.set(T, n), this;
  }
  function my(T) {
    return this.__data__.has(T);
  }
  Ri.prototype.add = Ri.prototype.push = py, Ri.prototype.has = my;
  function Pr(T) {
    var D = this.__data__ = new ur(T);
    this.size = D.size;
  }
  function gy() {
    this.__data__ = new ur(), this.size = 0;
  }
  function yy(T) {
    var D = this.__data__, j = D.delete(T);
    return this.size = D.size, j;
  }
  function $y(T) {
    return this.__data__.get(T);
  }
  function _y(T) {
    return this.__data__.has(T);
  }
  function vy(T, D) {
    var j = this.__data__;
    if (j instanceof ur) {
      var Y = j.__data__;
      if (!_s || Y.length < r - 1)
        return Y.push([T, D]), this.size = ++j.size, this;
      j = this.__data__ = new tn(Y);
    }
    return j.set(T, D), this.size = j.size, this;
  }
  Pr.prototype.clear = gy, Pr.prototype.delete = yy, Pr.prototype.get = $y, Pr.prototype.has = _y, Pr.prototype.set = vy;
  function wy(T, D) {
    var j = Oi(T), Y = !j && Fy(T), Ee = !j && !Y && Ao(T), ie = !j && !Y && !Ee && Dd(T), Ce = j || Y || Ee || ie, qe = Ce ? Ue(T.length, String) : [], Be = qe.length;
    for (var Ne in T)
      mt.call(T, Ne) && !(Ce && // Safari 9 has enumerable `arguments.length` in strict mode.
      (Ne == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
      Ee && (Ne == "offset" || Ne == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
      ie && (Ne == "buffer" || Ne == "byteLength" || Ne == "byteOffset") || // Skip index properties.
      Oy(Ne, Be))) && qe.push(Ne);
    return qe;
  }
  function Ni(T, D) {
    for (var j = T.length; j--; )
      if (Nd(T[j][0], D))
        return j;
    return -1;
  }
  function Ey(T, D, j) {
    var Y = D(T);
    return Oi(T) ? Y : Xe(Y, j(T));
  }
  function ws(T) {
    return T == null ? T === void 0 ? I : g : Zr && Zr in Object(T) ? Ny(T) : Uy(T);
  }
  function Td(T) {
    return Es(T) && ws(T) == o;
  }
  function Pd(T, D, j, Y, Ee) {
    return T === D ? !0 : T == null || D == null || !Es(T) && !Es(D) ? T !== T && D !== D : by(T, D, j, Y, Pd, Ee);
  }
  function by(T, D, j, Y, Ee, ie) {
    var Ce = Oi(T), qe = Oi(D), Be = Ce ? l : Ar(T), Ne = qe ? l : Ar(D);
    Be = Be == o ? E : Be, Ne = Ne == o ? E : Ne;
    var Et = Be == E, Ut = Ne == E, Je = Be == Ne;
    if (Je && Ao(T)) {
      if (!Ao(D))
        return !1;
      Ce = !0, Et = !1;
    }
    if (Je && !Et)
      return ie || (ie = new Pr()), Ce || Dd(T) ? Ad(T, D, j, Y, Ee, ie) : Ay(T, D, Be, j, Y, Ee, ie);
    if (!(j & s)) {
      var Nt = Et && mt.call(T, "__wrapped__"), Ct = Ut && mt.call(D, "__wrapped__");
      if (Nt || Ct) {
        var Rr = Nt ? T.value() : T, dr = Ct ? D.value() : D;
        return ie || (ie = new Pr()), Ee(Rr, dr, j, Y, ie);
      }
    }
    return Je ? (ie || (ie = new Pr()), Ry(T, D, j, Y, Ee, ie)) : !1;
  }
  function Sy(T) {
    if (!Id(T) || Dy(T))
      return !1;
    var D = Cd(T) ? H0 : S;
    return D.test(rn(T));
  }
  function Ty(T) {
    return Es(T) && Od(T.length) && !!y[ws(T)];
  }
  function Py(T) {
    if (!ky(T))
      return K0(T);
    var D = [];
    for (var j in Object(T))
      mt.call(T, j) && j != "constructor" && D.push(j);
    return D;
  }
  function Ad(T, D, j, Y, Ee, ie) {
    var Ce = j & s, qe = T.length, Be = D.length;
    if (qe != Be && !(Ce && Be > qe))
      return !1;
    var Ne = ie.get(T);
    if (Ne && ie.get(D))
      return Ne == D;
    var Et = -1, Ut = !0, Je = j & i ? new Ri() : void 0;
    for (ie.set(T, D), ie.set(D, T); ++Et < qe; ) {
      var Nt = T[Et], Ct = D[Et];
      if (Y)
        var Rr = Ce ? Y(Ct, Nt, Et, D, T, ie) : Y(Nt, Ct, Et, T, D, ie);
      if (Rr !== void 0) {
        if (Rr)
          continue;
        Ut = !1;
        break;
      }
      if (Je) {
        if (!$e(D, function(dr, nn) {
          if (!Pt(Je, nn) && (Nt === dr || Ee(Nt, dr, j, Y, ie)))
            return Je.push(nn);
        })) {
          Ut = !1;
          break;
        }
      } else if (!(Nt === Ct || Ee(Nt, Ct, j, Y, ie))) {
        Ut = !1;
        break;
      }
    }
    return ie.delete(T), ie.delete(D), Ut;
  }
  function Ay(T, D, j, Y, Ee, ie, Ce) {
    switch (j) {
      case x:
        if (T.byteLength != D.byteLength || T.byteOffset != D.byteOffset)
          return !1;
        T = T.buffer, D = D.buffer;
      case W:
        return !(T.byteLength != D.byteLength || !ie(new wd(T), new wd(D)));
      case u:
      case d:
      case v:
        return Nd(+T, +D);
      case p:
        return T.name == D.name && T.message == D.message;
      case U:
      case B:
        return T == D + "";
      case $:
        var qe = At;
      case q:
        var Be = Y & s;
        if (qe || (qe = or), T.size != D.size && !Be)
          return !1;
        var Ne = Ce.get(T);
        if (Ne)
          return Ne == D;
        Y |= i, Ce.set(T, D);
        var Et = Ad(qe(T), qe(D), Y, Ee, ie, Ce);
        return Ce.delete(T), Et;
      case me:
        if (Po)
          return Po.call(T) == Po.call(D);
    }
    return !1;
  }
  function Ry(T, D, j, Y, Ee, ie) {
    var Ce = j & s, qe = Rd(T), Be = qe.length, Ne = Rd(D), Et = Ne.length;
    if (Be != Et && !Ce)
      return !1;
    for (var Ut = Be; Ut--; ) {
      var Je = qe[Ut];
      if (!(Ce ? Je in D : mt.call(D, Je)))
        return !1;
    }
    var Nt = ie.get(T);
    if (Nt && ie.get(D))
      return Nt == D;
    var Ct = !0;
    ie.set(T, D), ie.set(D, T);
    for (var Rr = Ce; ++Ut < Be; ) {
      Je = qe[Ut];
      var dr = T[Je], nn = D[Je];
      if (Y)
        var kd = Ce ? Y(nn, dr, Je, D, T, ie) : Y(dr, nn, Je, T, D, ie);
      if (!(kd === void 0 ? dr === nn || Ee(dr, nn, j, Y, ie) : kd)) {
        Ct = !1;
        break;
      }
      Rr || (Rr = Je == "constructor");
    }
    if (Ct && !Rr) {
      var Ii = T.constructor, Di = D.constructor;
      Ii != Di && "constructor" in T && "constructor" in D && !(typeof Ii == "function" && Ii instanceof Ii && typeof Di == "function" && Di instanceof Di) && (Ct = !1);
    }
    return ie.delete(T), ie.delete(D), Ct;
  }
  function Rd(T) {
    return Ey(T, My, Cy);
  }
  function Ci(T, D) {
    var j = T.__data__;
    return Iy(D) ? j[typeof D == "string" ? "string" : "hash"] : j.map;
  }
  function Nn(T, D) {
    var j = vt(T, D);
    return Sy(j) ? j : void 0;
  }
  function Ny(T) {
    var D = mt.call(T, Zr), j = T[Zr];
    try {
      T[Zr] = void 0;
      var Y = !0;
    } catch {
    }
    var Ee = _d.call(T);
    return Y && (D ? T[Zr] = j : delete T[Zr]), Ee;
  }
  var Cy = bd ? function(T) {
    return T == null ? [] : (T = Object(T), Pe(bd(T), function(D) {
      return Ed.call(T, D);
    }));
  } : xy, Ar = ws;
  (Eo && Ar(new Eo(new ArrayBuffer(1))) != x || _s && Ar(new _s()) != $ || bo && Ar(bo.resolve()) != N || So && Ar(new So()) != q || To && Ar(new To()) != ye) && (Ar = function(T) {
    var D = ws(T), j = D == E ? T.constructor : void 0, Y = j ? rn(j) : "";
    if (Y)
      switch (Y) {
        case W0:
          return x;
        case Y0:
          return $;
        case X0:
          return N;
        case J0:
          return q;
        case Q0:
          return ye;
      }
    return D;
  });
  function Oy(T, D) {
    return D = D ?? a, !!D && (typeof T == "number" || f.test(T)) && T > -1 && T % 1 == 0 && T < D;
  }
  function Iy(T) {
    var D = typeof T;
    return D == "string" || D == "number" || D == "symbol" || D == "boolean" ? T !== "__proto__" : T === null;
  }
  function Dy(T) {
    return !!$d && $d in T;
  }
  function ky(T) {
    var D = T && T.constructor, j = typeof D == "function" && D.prototype || Rt;
    return T === j;
  }
  function Uy(T) {
    return _d.call(T);
  }
  function rn(T) {
    if (T != null) {
      try {
        return Tr.call(T);
      } catch {
      }
      try {
        return T + "";
      } catch {
      }
    }
    return "";
  }
  function Nd(T, D) {
    return T === D || T !== T && D !== D;
  }
  var Fy = Td(/* @__PURE__ */ function() {
    return arguments;
  }()) ? Td : function(T) {
    return Es(T) && mt.call(T, "callee") && !Ed.call(T, "callee");
  }, Oi = Array.isArray;
  function Ly(T) {
    return T != null && Od(T.length) && !Cd(T);
  }
  var Ao = G0 || qy;
  function jy(T, D) {
    return Pd(T, D);
  }
  function Cd(T) {
    if (!Id(T))
      return !1;
    var D = ws(T);
    return D == m || D == _ || D == c || D == O;
  }
  function Od(T) {
    return typeof T == "number" && T > -1 && T % 1 == 0 && T <= a;
  }
  function Id(T) {
    var D = typeof T;
    return T != null && (D == "object" || D == "function");
  }
  function Es(T) {
    return T != null && typeof T == "object";
  }
  var Dd = we ? kt(we) : Ty;
  function My(T) {
    return Ly(T) ? wy(T) : Py(T);
  }
  function xy() {
    return [];
  }
  function qy() {
    return !1;
  }
  e.exports = jy;
})(La, La.exports);
var Qk = La.exports;
Object.defineProperty(bi, "__esModule", { value: !0 });
bi.DownloadedUpdateHelper = void 0;
bi.createTempUpdateFile = nU;
const Zk = ui, eU = Gt, jh = Qk, ln = Sr, Js = st;
class tU {
  constructor(t) {
    this.cacheDir = t, this._file = null, this._packageFile = null, this.versionInfo = null, this.fileInfo = null, this._downloadedFileInfo = null;
  }
  get downloadedFileInfo() {
    return this._downloadedFileInfo;
  }
  get file() {
    return this._file;
  }
  get packageFile() {
    return this._packageFile;
  }
  get cacheDirForPendingUpdate() {
    return Js.join(this.cacheDir, "pending");
  }
  async validateDownloadedPath(t, r, n, s) {
    if (this.versionInfo != null && this.file === t && this.fileInfo != null)
      return jh(this.versionInfo, r) && jh(this.fileInfo.info, n.info) && await (0, ln.pathExists)(t) ? t : null;
    const i = await this.getValidCachedUpdateFile(n, s);
    return i === null ? null : (s.info(`Update has already been downloaded to ${t}).`), this._file = i, i);
  }
  async setDownloadedFile(t, r, n, s, i, a) {
    this._file = t, this._packageFile = r, this.versionInfo = n, this.fileInfo = s, this._downloadedFileInfo = {
      fileName: i,
      sha512: s.info.sha512,
      isAdminRightsRequired: s.info.isAdminRightsRequired === !0
    }, a && await (0, ln.outputJson)(this.getUpdateInfoFile(), this._downloadedFileInfo);
  }
  async clear() {
    this._file = null, this._packageFile = null, this.versionInfo = null, this.fileInfo = null, await this.cleanCacheDirForPendingUpdate();
  }
  async cleanCacheDirForPendingUpdate() {
    try {
      await (0, ln.emptyDir)(this.cacheDirForPendingUpdate);
    } catch {
    }
  }
  /**
   * Returns "update-info.json" which is created in the update cache directory's "pending" subfolder after the first update is downloaded.  If the update file does not exist then the cache is cleared and recreated.  If the update file exists then its properties are validated.
   * @param fileInfo
   * @param logger
   */
  async getValidCachedUpdateFile(t, r) {
    const n = this.getUpdateInfoFile();
    if (!await (0, ln.pathExists)(n))
      return null;
    let i;
    try {
      i = await (0, ln.readJson)(n);
    } catch (c) {
      let u = "No cached update info available";
      return c.code !== "ENOENT" && (await this.cleanCacheDirForPendingUpdate(), u += ` (error on read: ${c.message})`), r.info(u), null;
    }
    if (!((i == null ? void 0 : i.fileName) !== null))
      return r.warn("Cached update info is corrupted: no fileName, directory for cached update will be cleaned"), await this.cleanCacheDirForPendingUpdate(), null;
    if (t.info.sha512 !== i.sha512)
      return r.info(`Cached update sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${i.sha512}, expected: ${t.info.sha512}. Directory for cached update will be cleaned`), await this.cleanCacheDirForPendingUpdate(), null;
    const o = Js.join(this.cacheDirForPendingUpdate, i.fileName);
    if (!await (0, ln.pathExists)(o))
      return r.info("Cached update file doesn't exist"), null;
    const l = await rU(o);
    return t.info.sha512 !== l ? (r.warn(`Sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${l}, expected: ${t.info.sha512}`), await this.cleanCacheDirForPendingUpdate(), null) : (this._downloadedFileInfo = i, o);
  }
  getUpdateInfoFile() {
    return Js.join(this.cacheDirForPendingUpdate, "update-info.json");
  }
}
bi.DownloadedUpdateHelper = tU;
function rU(e, t = "sha512", r = "base64", n) {
  return new Promise((s, i) => {
    const a = (0, Zk.createHash)(t);
    a.on("error", i).setEncoding(r), (0, eU.createReadStream)(e, {
      ...n,
      highWaterMark: 1024 * 1024
      /* better to use more memory but hash faster */
    }).on("error", i).on("end", () => {
      a.end(), s(a.read());
    }).pipe(a, { end: !1 });
  });
}
async function nU(e, t, r) {
  let n = 0, s = Js.join(t, e);
  for (let i = 0; i < 3; i++)
    try {
      return await (0, ln.unlink)(s), s;
    } catch (a) {
      if (a.code === "ENOENT")
        return s;
      r.warn(`Error on remove temp update file: ${a}`), s = Js.join(t, `${n++}-${e}`);
    }
  return s;
}
var ho = {}, fd = {};
Object.defineProperty(fd, "__esModule", { value: !0 });
fd.getAppCacheDir = iU;
const il = st, sU = Va;
function iU() {
  const e = (0, sU.homedir)();
  let t;
  return process.platform === "win32" ? t = process.env.LOCALAPPDATA || il.join(e, "AppData", "Local") : process.platform === "darwin" ? t = il.join(e, "Library", "Caches") : t = process.env.XDG_CACHE_HOME || il.join(e, ".cache"), t;
}
Object.defineProperty(ho, "__esModule", { value: !0 });
ho.ElectronAppAdapter = void 0;
const Mh = st, aU = fd;
class oU {
  constructor(t = vr.app) {
    this.app = t;
  }
  whenReady() {
    return this.app.whenReady();
  }
  get version() {
    return this.app.getVersion();
  }
  get name() {
    return this.app.getName();
  }
  get isPackaged() {
    return this.app.isPackaged === !0;
  }
  get appUpdateConfigPath() {
    return this.isPackaged ? Mh.join(process.resourcesPath, "app-update.yml") : Mh.join(this.app.getAppPath(), "dev-app-update.yml");
  }
  get userDataPath() {
    return this.app.getPath("userData");
  }
  get baseCachePath() {
    return (0, aU.getAppCacheDir)();
  }
  quit() {
    this.app.quit();
  }
  relaunch() {
    this.app.relaunch();
  }
  onQuit(t) {
    this.app.once("quit", (r, n) => t(n));
  }
}
ho.ElectronAppAdapter = oU;
var R0 = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.ElectronHttpExecutor = e.NET_SESSION_NAME = void 0, e.getNetSession = r;
  const t = xe;
  e.NET_SESSION_NAME = "electron-updater";
  function r() {
    return vr.session.fromPartition(e.NET_SESSION_NAME, {
      cache: !1
    });
  }
  class n extends t.HttpExecutor {
    constructor(i) {
      super(), this.proxyLoginCallback = i, this.cachedSession = null;
    }
    async download(i, a, o) {
      return await o.cancellationToken.createPromise((l, c, u) => {
        const d = {
          headers: o.headers || void 0,
          redirect: "manual"
        };
        (0, t.configureRequestUrl)(i, d), (0, t.configureRequestOptions)(d), this.doDownload(d, {
          destination: a,
          options: o,
          onCancel: u,
          callback: (p) => {
            p == null ? l(a) : c(p);
          },
          responseHandler: null
        }, 0);
      });
    }
    createRequest(i, a) {
      i.headers && i.headers.Host && (i.host = i.headers.Host, delete i.headers.Host), this.cachedSession == null && (this.cachedSession = r());
      const o = vr.net.request({
        ...i,
        session: this.cachedSession
      });
      return o.on("response", a), this.proxyLoginCallback != null && o.on("login", this.proxyLoginCallback), o;
    }
    addRedirectHandlers(i, a, o, l, c) {
      i.on("redirect", (u, d, p) => {
        i.abort(), l > this.maxRedirects ? o(this.createMaxRedirectError()) : c(t.HttpExecutor.prepareRedirectUrlOptions(p, a));
      });
    }
  }
  e.ElectronHttpExecutor = n;
})(R0);
var Si = {}, Xt = {};
Object.defineProperty(Xt, "__esModule", { value: !0 });
Xt.newBaseUrl = lU;
Xt.newUrlFromBase = cU;
Xt.getChannelFilename = uU;
const N0 = Jr;
function lU(e) {
  const t = new N0.URL(e);
  return t.pathname.endsWith("/") || (t.pathname += "/"), t;
}
function cU(e, t, r = !1) {
  const n = new N0.URL(e, t), s = t.search;
  return s != null && s.length !== 0 ? n.search = s : r && (n.search = `noCache=${Date.now().toString(32)}`), n;
}
function uU(e) {
  return `${e}.yml`;
}
var ke = {}, dU = "[object Symbol]", C0 = /[\\^$.*+?()[\]{}|]/g, fU = RegExp(C0.source), hU = typeof Dt == "object" && Dt && Dt.Object === Object && Dt, pU = typeof self == "object" && self && self.Object === Object && self, mU = hU || pU || Function("return this")(), gU = Object.prototype, yU = gU.toString, xh = mU.Symbol, qh = xh ? xh.prototype : void 0, Vh = qh ? qh.toString : void 0;
function $U(e) {
  if (typeof e == "string")
    return e;
  if (vU(e))
    return Vh ? Vh.call(e) : "";
  var t = e + "";
  return t == "0" && 1 / e == -1 / 0 ? "-0" : t;
}
function _U(e) {
  return !!e && typeof e == "object";
}
function vU(e) {
  return typeof e == "symbol" || _U(e) && yU.call(e) == dU;
}
function wU(e) {
  return e == null ? "" : $U(e);
}
function EU(e) {
  return e = wU(e), e && fU.test(e) ? e.replace(C0, "\\$&") : e;
}
var O0 = EU;
Object.defineProperty(ke, "__esModule", { value: !0 });
ke.Provider = void 0;
ke.findFile = AU;
ke.parseUpdateInfo = RU;
ke.getFileList = I0;
ke.resolveFiles = NU;
const Yr = xe, bU = Ye, SU = Jr, ja = Xt, TU = O0;
class PU {
  constructor(t) {
    this.runtimeOptions = t, this.requestHeaders = null, this.executor = t.executor;
  }
  // By default, the blockmap file is in the same directory as the main file
  // But some providers may have a different blockmap file, so we need to override this method
  getBlockMapFiles(t, r, n, s = null) {
    const i = (0, ja.newUrlFromBase)(`${t.pathname}.blockmap`, t);
    return [(0, ja.newUrlFromBase)(`${t.pathname.replace(new RegExp(TU(n), "g"), r)}.blockmap`, s ? new SU.URL(s) : t), i];
  }
  get isUseMultipleRangeRequest() {
    return this.runtimeOptions.isUseMultipleRangeRequest !== !1;
  }
  getChannelFilePrefix() {
    if (this.runtimeOptions.platform === "linux") {
      const t = process.env.TEST_UPDATER_ARCH || process.arch;
      return "-linux" + (t === "x64" ? "" : `-${t}`);
    } else
      return this.runtimeOptions.platform === "darwin" ? "-mac" : "";
  }
  // due to historical reasons for windows we use channel name without platform specifier
  getDefaultChannelName() {
    return this.getCustomChannelName("latest");
  }
  getCustomChannelName(t) {
    return `${t}${this.getChannelFilePrefix()}`;
  }
  get fileExtraDownloadHeaders() {
    return null;
  }
  setRequestHeaders(t) {
    this.requestHeaders = t;
  }
  /**
   * Method to perform API request only to resolve update info, but not to download update.
   */
  httpRequest(t, r, n) {
    return this.executor.request(this.createRequestOptions(t, r), n);
  }
  createRequestOptions(t, r) {
    const n = {};
    return this.requestHeaders == null ? r != null && (n.headers = r) : n.headers = r == null ? this.requestHeaders : { ...this.requestHeaders, ...r }, (0, Yr.configureRequestUrl)(t, n), n;
  }
}
ke.Provider = PU;
function AU(e, t, r) {
  var n;
  if (e.length === 0)
    throw (0, Yr.newError)("No files provided", "ERR_UPDATER_NO_FILES_PROVIDED");
  const s = e.filter((a) => a.url.pathname.toLowerCase().endsWith(`.${t.toLowerCase()}`)), i = (n = s.find((a) => [a.url.pathname, a.info.url].some((o) => o.includes(process.arch)))) !== null && n !== void 0 ? n : s.shift();
  return i || (r == null ? e[0] : e.find((a) => !r.some((o) => a.url.pathname.toLowerCase().endsWith(`.${o.toLowerCase()}`))));
}
function RU(e, t, r) {
  if (e == null)
    throw (0, Yr.newError)(`Cannot parse update info from ${t} in the latest release artifacts (${r}): rawData: null`, "ERR_UPDATER_INVALID_UPDATE_INFO");
  let n;
  try {
    n = (0, bU.load)(e);
  } catch (s) {
    throw (0, Yr.newError)(`Cannot parse update info from ${t} in the latest release artifacts (${r}): ${s.stack || s.message}, rawData: ${e}`, "ERR_UPDATER_INVALID_UPDATE_INFO");
  }
  return n;
}
function I0(e) {
  const t = e.files;
  if (t != null && t.length > 0)
    return t;
  if (e.path != null)
    return [
      {
        url: e.path,
        sha2: e.sha2,
        sha512: e.sha512
      }
    ];
  throw (0, Yr.newError)(`No files provided: ${(0, Yr.safeStringifyJson)(e)}`, "ERR_UPDATER_NO_FILES_PROVIDED");
}
function NU(e, t, r = (n) => n) {
  const s = I0(e).map((o) => {
    if (o.sha2 == null && o.sha512 == null)
      throw (0, Yr.newError)(`Update info doesn't contain nor sha256 neither sha512 checksum: ${(0, Yr.safeStringifyJson)(o)}`, "ERR_UPDATER_NO_CHECKSUM");
    return {
      url: (0, ja.newUrlFromBase)(r(o.url), t),
      info: o
    };
  }), i = e.packages, a = i == null ? null : i[process.arch] || i.ia32;
  return a != null && (s[0].packageInfo = {
    ...a,
    path: (0, ja.newUrlFromBase)(r(a.path), t).href
  }), s;
}
Object.defineProperty(Si, "__esModule", { value: !0 });
Si.GenericProvider = void 0;
const Bh = xe, al = Xt, ol = ke;
class CU extends ol.Provider {
  constructor(t, r, n) {
    super(n), this.configuration = t, this.updater = r, this.baseUrl = (0, al.newBaseUrl)(this.configuration.url);
  }
  get channel() {
    const t = this.updater.channel || this.configuration.channel;
    return t == null ? this.getDefaultChannelName() : this.getCustomChannelName(t);
  }
  async getLatestVersion() {
    const t = (0, al.getChannelFilename)(this.channel), r = (0, al.newUrlFromBase)(t, this.baseUrl, this.updater.isAddNoCacheQuery);
    for (let n = 0; ; n++)
      try {
        return (0, ol.parseUpdateInfo)(await this.httpRequest(r), t, r);
      } catch (s) {
        if (s instanceof Bh.HttpError && s.statusCode === 404)
          throw (0, Bh.newError)(`Cannot find channel "${t}" update info: ${s.stack || s.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
        if (s.code === "ECONNREFUSED" && n < 3) {
          await new Promise((i, a) => {
            try {
              setTimeout(i, 1e3 * n);
            } catch (o) {
              a(o);
            }
          });
          continue;
        }
        throw s;
      }
  }
  resolveFiles(t) {
    return (0, ol.resolveFiles)(t, this.baseUrl);
  }
}
Si.GenericProvider = CU;
var po = {}, mo = {};
Object.defineProperty(mo, "__esModule", { value: !0 });
mo.BitbucketProvider = void 0;
const Hh = xe, ll = Xt, cl = ke;
class OU extends cl.Provider {
  constructor(t, r, n) {
    super({
      ...n,
      isUseMultipleRangeRequest: !1
    }), this.configuration = t, this.updater = r;
    const { owner: s, slug: i } = t;
    this.baseUrl = (0, ll.newBaseUrl)(`https://api.bitbucket.org/2.0/repositories/${s}/${i}/downloads`);
  }
  get channel() {
    return this.updater.channel || this.configuration.channel || "latest";
  }
  async getLatestVersion() {
    const t = new Hh.CancellationToken(), r = (0, ll.getChannelFilename)(this.getCustomChannelName(this.channel)), n = (0, ll.newUrlFromBase)(r, this.baseUrl, this.updater.isAddNoCacheQuery);
    try {
      const s = await this.httpRequest(n, void 0, t);
      return (0, cl.parseUpdateInfo)(s, r, n);
    } catch (s) {
      throw (0, Hh.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${s.stack || s.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  resolveFiles(t) {
    return (0, cl.resolveFiles)(t, this.baseUrl);
  }
  toString() {
    const { owner: t, slug: r } = this.configuration;
    return `Bitbucket (owner: ${t}, slug: ${r}, channel: ${this.channel})`;
  }
}
mo.BitbucketProvider = OU;
var Xr = {};
Object.defineProperty(Xr, "__esModule", { value: !0 });
Xr.GitHubProvider = Xr.BaseGitHubProvider = void 0;
Xr.computeReleaseNotes = k0;
const hr = xe, $n = ed, IU = Jr, Kn = Xt, Xl = ke, ul = /\/tag\/([^/]+)$/;
class D0 extends Xl.Provider {
  constructor(t, r, n) {
    super({
      ...n,
      /* because GitHib uses S3 */
      isUseMultipleRangeRequest: !1
    }), this.options = t, this.baseUrl = (0, Kn.newBaseUrl)((0, hr.githubUrl)(t, r));
    const s = r === "github.com" ? "api.github.com" : r;
    this.baseApiUrl = (0, Kn.newBaseUrl)((0, hr.githubUrl)(t, s));
  }
  computeGithubBasePath(t) {
    const r = this.options.host;
    return r && !["github.com", "api.github.com"].includes(r) ? `/api/v3${t}` : t;
  }
}
Xr.BaseGitHubProvider = D0;
class DU extends D0 {
  constructor(t, r, n) {
    super(t, "github.com", n), this.options = t, this.updater = r;
  }
  get channel() {
    const t = this.updater.channel || this.options.channel;
    return t == null ? this.getDefaultChannelName() : this.getCustomChannelName(t);
  }
  async getLatestVersion() {
    var t, r, n, s, i;
    const a = new hr.CancellationToken(), o = await this.httpRequest((0, Kn.newUrlFromBase)(`${this.basePath}.atom`, this.baseUrl), {
      accept: "application/xml, application/atom+xml, text/xml, */*"
    }, a), l = (0, hr.parseXml)(o);
    let c = l.element("entry", !1, "No published versions on GitHub"), u = null;
    try {
      if (this.updater.allowPrerelease) {
        const v = ((t = this.updater) === null || t === void 0 ? void 0 : t.channel) || ((r = $n.prerelease(this.updater.currentVersion)) === null || r === void 0 ? void 0 : r[0]) || null;
        if (v === null)
          u = ul.exec(c.element("link").attribute("href"))[1];
        else
          for (const g of l.getElements("entry")) {
            const E = ul.exec(g.element("link").attribute("href"));
            if (E === null)
              continue;
            const N = E[1], O = ((n = $n.prerelease(N)) === null || n === void 0 ? void 0 : n[0]) || null, U = !v || ["alpha", "beta"].includes(v), q = O !== null && !["alpha", "beta"].includes(String(O));
            if (U && !q && !(v === "beta" && O === "alpha")) {
              u = N;
              break;
            }
            if (O && O === v) {
              u = N;
              break;
            }
          }
      } else {
        u = await this.getLatestTagName(a);
        for (const v of l.getElements("entry"))
          if (ul.exec(v.element("link").attribute("href"))[1] === u) {
            c = v;
            break;
          }
      }
    } catch (v) {
      throw (0, hr.newError)(`Cannot parse releases feed: ${v.stack || v.message},
XML:
${o}`, "ERR_UPDATER_INVALID_RELEASE_FEED");
    }
    if (u == null)
      throw (0, hr.newError)("No published versions on GitHub", "ERR_UPDATER_NO_PUBLISHED_VERSIONS");
    let d, p = "", m = "";
    const _ = async (v) => {
      p = (0, Kn.getChannelFilename)(v), m = (0, Kn.newUrlFromBase)(this.getBaseDownloadPath(String(u), p), this.baseUrl);
      const g = this.createRequestOptions(m);
      try {
        return await this.executor.request(g, a);
      } catch (E) {
        throw E instanceof hr.HttpError && E.statusCode === 404 ? (0, hr.newError)(`Cannot find ${p} in the latest release artifacts (${m}): ${E.stack || E.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : E;
      }
    };
    try {
      let v = this.channel;
      this.updater.allowPrerelease && (!((s = $n.prerelease(u)) === null || s === void 0) && s[0]) && (v = this.getCustomChannelName(String((i = $n.prerelease(u)) === null || i === void 0 ? void 0 : i[0]))), d = await _(v);
    } catch (v) {
      if (this.updater.allowPrerelease)
        d = await _(this.getDefaultChannelName());
      else
        throw v;
    }
    const $ = (0, Xl.parseUpdateInfo)(d, p, m);
    return $.releaseName == null && ($.releaseName = c.elementValueOrEmpty("title")), $.releaseNotes == null && ($.releaseNotes = k0(this.updater.currentVersion, this.updater.fullChangelog, l, c)), {
      tag: u,
      ...$
    };
  }
  async getLatestTagName(t) {
    const r = this.options, n = r.host == null || r.host === "github.com" ? (0, Kn.newUrlFromBase)(`${this.basePath}/latest`, this.baseUrl) : new IU.URL(`${this.computeGithubBasePath(`/repos/${r.owner}/${r.repo}/releases`)}/latest`, this.baseApiUrl);
    try {
      const s = await this.httpRequest(n, { Accept: "application/json" }, t);
      return s == null ? null : JSON.parse(s).tag_name;
    } catch (s) {
      throw (0, hr.newError)(`Unable to find latest version on GitHub (${n}), please ensure a production release exists: ${s.stack || s.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  get basePath() {
    return `/${this.options.owner}/${this.options.repo}/releases`;
  }
  resolveFiles(t) {
    return (0, Xl.resolveFiles)(t, this.baseUrl, (r) => this.getBaseDownloadPath(t.tag, r.replace(/ /g, "-")));
  }
  getBaseDownloadPath(t, r) {
    return `${this.basePath}/download/${t}/${r}`;
  }
}
Xr.GitHubProvider = DU;
function zh(e) {
  const t = e.elementValueOrEmpty("content");
  return t === "No content." ? "" : t;
}
function k0(e, t, r, n) {
  if (!t)
    return zh(n);
  const s = [];
  for (const i of r.getElements("entry")) {
    const a = /\/tag\/v?([^/]+)$/.exec(i.element("link").attribute("href"))[1];
    $n.valid(a) && $n.lt(e, a) && s.push({
      version: a,
      note: zh(i)
    });
  }
  return s.sort((i, a) => $n.rcompare(i.version, a.version));
}
var go = {};
Object.defineProperty(go, "__esModule", { value: !0 });
go.GitLabProvider = void 0;
const at = xe, dl = Jr, kU = O0, ra = Xt, fl = ke;
class UU extends fl.Provider {
  /**
   * Normalizes filenames by replacing spaces and underscores with dashes.
   *
   * This is a workaround to handle filename formatting differences between tools:
   * - electron-builder formats filenames like "test file.txt" as "test-file.txt"
   * - GitLab may provide asset URLs using underscores, such as "test_file.txt"
   *
   * Because of this mismatch, we can't reliably extract the correct filename from
   * the asset path without normalization. This function ensures consistent matching
   * across different filename formats by converting all spaces and underscores to dashes.
   *
   * @param filename The filename to normalize
   * @returns The normalized filename with spaces and underscores replaced by dashes
   */
  normalizeFilename(t) {
    return t.replace(/ |_/g, "-");
  }
  constructor(t, r, n) {
    super({
      ...n,
      // GitLab might not support multiple range requests efficiently
      isUseMultipleRangeRequest: !1
    }), this.options = t, this.updater = r, this.cachedLatestVersion = null;
    const i = t.host || "gitlab.com";
    this.baseApiUrl = (0, ra.newBaseUrl)(`https://${i}/api/v4`);
  }
  get channel() {
    const t = this.updater.channel || this.options.channel;
    return t == null ? this.getDefaultChannelName() : this.getCustomChannelName(t);
  }
  async getLatestVersion() {
    const t = new at.CancellationToken(), r = (0, ra.newUrlFromBase)(`projects/${this.options.projectId}/releases/permalink/latest`, this.baseApiUrl);
    let n;
    try {
      const p = { "Content-Type": "application/json", ...this.setAuthHeaderForToken(this.options.token || null) }, m = await this.httpRequest(r, p, t);
      if (!m)
        throw (0, at.newError)("No latest release found", "ERR_UPDATER_NO_PUBLISHED_VERSIONS");
      n = JSON.parse(m);
    } catch (p) {
      throw (0, at.newError)(`Unable to find latest release on GitLab (${r}): ${p.stack || p.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
    const s = n.tag_name;
    let i = null, a = "", o = null;
    const l = async (p) => {
      a = (0, ra.getChannelFilename)(p);
      const m = n.assets.links.find(($) => $.name === a);
      if (!m)
        throw (0, at.newError)(`Cannot find ${a} in the latest release assets`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
      o = new dl.URL(m.direct_asset_url);
      const _ = this.options.token ? { "PRIVATE-TOKEN": this.options.token } : void 0;
      try {
        const $ = await this.httpRequest(o, _, t);
        if (!$)
          throw (0, at.newError)(`Empty response from ${o}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
        return $;
      } catch ($) {
        throw $ instanceof at.HttpError && $.statusCode === 404 ? (0, at.newError)(`Cannot find ${a} in the latest release artifacts (${o}): ${$.stack || $.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : $;
      }
    };
    try {
      i = await l(this.channel);
    } catch (p) {
      if (this.channel !== this.getDefaultChannelName())
        i = await l(this.getDefaultChannelName());
      else
        throw p;
    }
    if (!i)
      throw (0, at.newError)(`Unable to parse channel data from ${a}`, "ERR_UPDATER_INVALID_UPDATE_INFO");
    const c = (0, fl.parseUpdateInfo)(i, a, o);
    c.releaseName == null && (c.releaseName = n.name), c.releaseNotes == null && (c.releaseNotes = n.description || null);
    const u = /* @__PURE__ */ new Map();
    for (const p of n.assets.links)
      u.set(this.normalizeFilename(p.name), p.direct_asset_url);
    const d = {
      tag: s,
      assets: u,
      ...c
    };
    return this.cachedLatestVersion = d, d;
  }
  /**
   * Utility function to convert GitlabReleaseAsset to Map<string, string>
   * Maps asset names to their download URLs
   */
  convertAssetsToMap(t) {
    const r = /* @__PURE__ */ new Map();
    for (const n of t.links)
      r.set(this.normalizeFilename(n.name), n.direct_asset_url);
    return r;
  }
  /**
   * Find blockmap file URL in assets map for a specific filename
   */
  findBlockMapInAssets(t, r) {
    const n = [`${r}.blockmap`, `${this.normalizeFilename(r)}.blockmap`];
    for (const s of n) {
      const i = t.get(s);
      if (i)
        return new dl.URL(i);
    }
    return null;
  }
  async fetchReleaseInfoByVersion(t) {
    const r = new at.CancellationToken(), n = [`v${t}`, t];
    for (const s of n) {
      const i = (0, ra.newUrlFromBase)(`projects/${this.options.projectId}/releases/${encodeURIComponent(s)}`, this.baseApiUrl);
      try {
        const a = { "Content-Type": "application/json", ...this.setAuthHeaderForToken(this.options.token || null) }, o = await this.httpRequest(i, a, r);
        if (o)
          return JSON.parse(o);
      } catch (a) {
        if (a instanceof at.HttpError && a.statusCode === 404)
          continue;
        throw (0, at.newError)(`Unable to find release ${s} on GitLab (${i}): ${a.stack || a.message}`, "ERR_UPDATER_RELEASE_NOT_FOUND");
      }
    }
    throw (0, at.newError)(`Unable to find release with version ${t} (tried: ${n.join(", ")}) on GitLab`, "ERR_UPDATER_RELEASE_NOT_FOUND");
  }
  setAuthHeaderForToken(t) {
    const r = {};
    return t != null && (t.startsWith("Bearer") ? r.authorization = t : r["PRIVATE-TOKEN"] = t), r;
  }
  /**
   * Get version info for blockmap files, using cache when possible
   */
  async getVersionInfoForBlockMap(t) {
    if (this.cachedLatestVersion && this.cachedLatestVersion.version === t)
      return this.cachedLatestVersion.assets;
    const r = await this.fetchReleaseInfoByVersion(t);
    return r && r.assets ? this.convertAssetsToMap(r.assets) : null;
  }
  /**
   * Find blockmap URLs from version assets
   */
  async findBlockMapUrlsFromAssets(t, r, n) {
    let s = null, i = null;
    const a = await this.getVersionInfoForBlockMap(r);
    a && (s = this.findBlockMapInAssets(a, n));
    const o = await this.getVersionInfoForBlockMap(t);
    if (o) {
      const l = n.replace(new RegExp(kU(r), "g"), t);
      i = this.findBlockMapInAssets(o, l);
    }
    return [i, s];
  }
  async getBlockMapFiles(t, r, n, s = null) {
    if (this.options.uploadTarget === "project_upload") {
      const i = t.pathname.split("/").pop() || "", [a, o] = await this.findBlockMapUrlsFromAssets(r, n, i);
      if (!o)
        throw (0, at.newError)(`Cannot find blockmap file for ${n} in GitLab assets`, "ERR_UPDATER_BLOCKMAP_FILE_NOT_FOUND");
      if (!a)
        throw (0, at.newError)(`Cannot find blockmap file for ${r} in GitLab assets`, "ERR_UPDATER_BLOCKMAP_FILE_NOT_FOUND");
      return [a, o];
    } else
      return super.getBlockMapFiles(t, r, n, s);
  }
  resolveFiles(t) {
    return (0, fl.getFileList)(t).map((r) => {
      const s = [
        r.url,
        // Original filename
        this.normalizeFilename(r.url)
        // Normalized filename (spaces/underscores → dashes)
      ].find((a) => t.assets.has(a)), i = s ? t.assets.get(s) : void 0;
      if (!i)
        throw (0, at.newError)(`Cannot find asset "${r.url}" in GitLab release assets. Available assets: ${Array.from(t.assets.keys()).join(", ")}`, "ERR_UPDATER_ASSET_NOT_FOUND");
      return {
        url: new dl.URL(i),
        info: r
      };
    });
  }
  toString() {
    return `GitLab (projectId: ${this.options.projectId}, channel: ${this.channel})`;
  }
}
go.GitLabProvider = UU;
var yo = {};
Object.defineProperty(yo, "__esModule", { value: !0 });
yo.KeygenProvider = void 0;
const Gh = xe, hl = Xt, pl = ke;
class FU extends pl.Provider {
  constructor(t, r, n) {
    super({
      ...n,
      isUseMultipleRangeRequest: !1
    }), this.configuration = t, this.updater = r, this.defaultHostname = "api.keygen.sh";
    const s = this.configuration.host || this.defaultHostname;
    this.baseUrl = (0, hl.newBaseUrl)(`https://${s}/v1/accounts/${this.configuration.account}/artifacts?product=${this.configuration.product}`);
  }
  get channel() {
    return this.updater.channel || this.configuration.channel || "stable";
  }
  async getLatestVersion() {
    const t = new Gh.CancellationToken(), r = (0, hl.getChannelFilename)(this.getCustomChannelName(this.channel)), n = (0, hl.newUrlFromBase)(r, this.baseUrl, this.updater.isAddNoCacheQuery);
    try {
      const s = await this.httpRequest(n, {
        Accept: "application/vnd.api+json",
        "Keygen-Version": "1.1"
      }, t);
      return (0, pl.parseUpdateInfo)(s, r, n);
    } catch (s) {
      throw (0, Gh.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${s.stack || s.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  resolveFiles(t) {
    return (0, pl.resolveFiles)(t, this.baseUrl);
  }
  toString() {
    const { account: t, product: r, platform: n } = this.configuration;
    return `Keygen (account: ${t}, product: ${r}, platform: ${n}, channel: ${this.channel})`;
  }
}
yo.KeygenProvider = FU;
var $o = {};
Object.defineProperty($o, "__esModule", { value: !0 });
$o.PrivateGitHubProvider = void 0;
const Ln = xe, LU = Ye, jU = st, Kh = Jr, Wh = Xt, MU = Xr, xU = ke;
class qU extends MU.BaseGitHubProvider {
  constructor(t, r, n, s) {
    super(t, "api.github.com", s), this.updater = r, this.token = n;
  }
  createRequestOptions(t, r) {
    const n = super.createRequestOptions(t, r);
    return n.redirect = "manual", n;
  }
  async getLatestVersion() {
    const t = new Ln.CancellationToken(), r = (0, Wh.getChannelFilename)(this.getDefaultChannelName()), n = await this.getLatestVersionInfo(t), s = n.assets.find((o) => o.name === r);
    if (s == null)
      throw (0, Ln.newError)(`Cannot find ${r} in the release ${n.html_url || n.name}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
    const i = new Kh.URL(s.url);
    let a;
    try {
      a = (0, LU.load)(await this.httpRequest(i, this.configureHeaders("application/octet-stream"), t));
    } catch (o) {
      throw o instanceof Ln.HttpError && o.statusCode === 404 ? (0, Ln.newError)(`Cannot find ${r} in the latest release artifacts (${i}): ${o.stack || o.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : o;
    }
    return a.assets = n.assets, a;
  }
  get fileExtraDownloadHeaders() {
    return this.configureHeaders("application/octet-stream");
  }
  configureHeaders(t) {
    return {
      accept: t,
      authorization: `token ${this.token}`
    };
  }
  async getLatestVersionInfo(t) {
    const r = this.updater.allowPrerelease;
    let n = this.basePath;
    r || (n = `${n}/latest`);
    const s = (0, Wh.newUrlFromBase)(n, this.baseUrl);
    try {
      const i = JSON.parse(await this.httpRequest(s, this.configureHeaders("application/vnd.github.v3+json"), t));
      return r ? i.find((a) => a.prerelease) || i[0] : i;
    } catch (i) {
      throw (0, Ln.newError)(`Unable to find latest version on GitHub (${s}), please ensure a production release exists: ${i.stack || i.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  get basePath() {
    return this.computeGithubBasePath(`/repos/${this.options.owner}/${this.options.repo}/releases`);
  }
  resolveFiles(t) {
    return (0, xU.getFileList)(t).map((r) => {
      const n = jU.posix.basename(r.url).replace(/ /g, "-"), s = t.assets.find((i) => i != null && i.name === n);
      if (s == null)
        throw (0, Ln.newError)(`Cannot find asset "${n}" in: ${JSON.stringify(t.assets, null, 2)}`, "ERR_UPDATER_ASSET_NOT_FOUND");
      return {
        url: new Kh.URL(s.url),
        info: r
      };
    });
  }
}
$o.PrivateGitHubProvider = qU;
Object.defineProperty(po, "__esModule", { value: !0 });
po.isUrlProbablySupportMultiRangeRequests = U0;
po.createClient = KU;
const na = xe, VU = mo, Yh = Si, BU = Xr, HU = go, zU = yo, GU = $o;
function U0(e) {
  return !e.includes("s3.amazonaws.com");
}
function KU(e, t, r) {
  if (typeof e == "string")
    throw (0, na.newError)("Please pass PublishConfiguration object", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
  const n = e.provider;
  switch (n) {
    case "github": {
      const s = e, i = (s.private ? process.env.GH_TOKEN || process.env.GITHUB_TOKEN : null) || s.token;
      return i == null ? new BU.GitHubProvider(s, t, r) : new GU.PrivateGitHubProvider(s, t, i, r);
    }
    case "bitbucket":
      return new VU.BitbucketProvider(e, t, r);
    case "gitlab":
      return new HU.GitLabProvider(e, t, r);
    case "keygen":
      return new zU.KeygenProvider(e, t, r);
    case "s3":
    case "spaces":
      return new Yh.GenericProvider({
        provider: "generic",
        url: (0, na.getS3LikeProviderBaseUrl)(e),
        channel: e.channel || null
      }, t, {
        ...r,
        // https://github.com/minio/minio/issues/5285#issuecomment-350428955
        isUseMultipleRangeRequest: !1
      });
    case "generic": {
      const s = e;
      return new Yh.GenericProvider(s, t, {
        ...r,
        isUseMultipleRangeRequest: s.useMultipleRangeRequest !== !1 && U0(s.url)
      });
    }
    case "custom": {
      const s = e, i = s.updateProvider;
      if (!i)
        throw (0, na.newError)("Custom provider not specified", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
      return new i(s, t, r);
    }
    default:
      throw (0, na.newError)(`Unsupported provider: ${n}`, "ERR_UPDATER_UNSUPPORTED_PROVIDER");
  }
}
var _o = {}, Ti = {}, ys = {}, Rn = {};
Object.defineProperty(Rn, "__esModule", { value: !0 });
Rn.OperationKind = void 0;
Rn.computeOperations = WU;
var _n;
(function(e) {
  e[e.COPY = 0] = "COPY", e[e.DOWNLOAD = 1] = "DOWNLOAD";
})(_n || (Rn.OperationKind = _n = {}));
function WU(e, t, r) {
  const n = Jh(e.files), s = Jh(t.files);
  let i = null;
  const a = t.files[0], o = [], l = a.name, c = n.get(l);
  if (c == null)
    throw new Error(`no file ${l} in old blockmap`);
  const u = s.get(l);
  let d = 0;
  const { checksumToOffset: p, checksumToOldSize: m } = XU(n.get(l), c.offset, r);
  let _ = a.offset;
  for (let $ = 0; $ < u.checksums.length; _ += u.sizes[$], $++) {
    const v = u.sizes[$], g = u.checksums[$];
    let E = p.get(g);
    E != null && m.get(g) !== v && (r.warn(`Checksum ("${g}") matches, but size differs (old: ${m.get(g)}, new: ${v})`), E = void 0), E === void 0 ? (d++, i != null && i.kind === _n.DOWNLOAD && i.end === _ ? i.end += v : (i = {
      kind: _n.DOWNLOAD,
      start: _,
      end: _ + v
      // oldBlocks: null,
    }, Xh(i, o, g, $))) : i != null && i.kind === _n.COPY && i.end === E ? i.end += v : (i = {
      kind: _n.COPY,
      start: E,
      end: E + v
      // oldBlocks: [checksum]
    }, Xh(i, o, g, $));
  }
  return d > 0 && r.info(`File${a.name === "file" ? "" : " " + a.name} has ${d} changed blocks`), o;
}
const YU = process.env.DIFFERENTIAL_DOWNLOAD_PLAN_BUILDER_VALIDATE_RANGES === "true";
function Xh(e, t, r, n) {
  if (YU && t.length !== 0) {
    const s = t[t.length - 1];
    if (s.kind === e.kind && e.start < s.end && e.start > s.start) {
      const i = [s.start, s.end, e.start, e.end].reduce((a, o) => a < o ? a : o);
      throw new Error(`operation (block index: ${n}, checksum: ${r}, kind: ${_n[e.kind]}) overlaps previous operation (checksum: ${r}):
abs: ${s.start} until ${s.end} and ${e.start} until ${e.end}
rel: ${s.start - i} until ${s.end - i} and ${e.start - i} until ${e.end - i}`);
    }
  }
  t.push(e);
}
function XU(e, t, r) {
  const n = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map();
  let i = t;
  for (let a = 0; a < e.checksums.length; a++) {
    const o = e.checksums[a], l = e.sizes[a], c = s.get(o);
    if (c === void 0)
      n.set(o, i), s.set(o, l);
    else if (r.debug != null) {
      const u = c === l ? "(same size)" : `(size: ${c}, this size: ${l})`;
      r.debug(`${o} duplicated in blockmap ${u}, it doesn't lead to broken differential downloader, just corresponding block will be skipped)`);
    }
    i += l;
  }
  return { checksumToOffset: n, checksumToOldSize: s };
}
function Jh(e) {
  const t = /* @__PURE__ */ new Map();
  for (const r of e)
    t.set(r.name, r);
  return t;
}
Object.defineProperty(ys, "__esModule", { value: !0 });
ys.DataSplitter = void 0;
ys.copyData = F0;
const sa = xe, JU = Gt, QU = Ma, ZU = Rn, Qh = Buffer.from(`\r
\r
`);
var jr;
(function(e) {
  e[e.INIT = 0] = "INIT", e[e.HEADER = 1] = "HEADER", e[e.BODY = 2] = "BODY";
})(jr || (jr = {}));
function F0(e, t, r, n, s) {
  const i = (0, JU.createReadStream)("", {
    fd: r,
    autoClose: !1,
    start: e.start,
    // end is inclusive
    end: e.end - 1
  });
  i.on("error", n), i.once("end", s), i.pipe(t, {
    end: !1
  });
}
class eF extends QU.Writable {
  constructor(t, r, n, s, i, a, o, l) {
    super(), this.out = t, this.options = r, this.partIndexToTaskIndex = n, this.partIndexToLength = i, this.finishHandler = a, this.grandTotalBytes = o, this.onProgress = l, this.start = Date.now(), this.nextUpdate = this.start + 1e3, this.transferred = 0, this.delta = 0, this.partIndex = -1, this.headerListBuffer = null, this.readState = jr.INIT, this.ignoreByteCount = 0, this.remainingPartDataCount = 0, this.actualPartLength = 0, this.boundaryLength = s.length + 4, this.ignoreByteCount = this.boundaryLength - 2;
  }
  get isFinished() {
    return this.partIndex === this.partIndexToLength.length;
  }
  // noinspection JSUnusedGlobalSymbols
  _write(t, r, n) {
    if (this.isFinished) {
      console.error(`Trailing ignored data: ${t.length} bytes`);
      return;
    }
    this.handleData(t).then(() => {
      if (this.onProgress) {
        const s = Date.now();
        (s >= this.nextUpdate || this.transferred === this.grandTotalBytes) && this.grandTotalBytes && (s - this.start) / 1e3 && (this.nextUpdate = s + 1e3, this.onProgress({
          total: this.grandTotalBytes,
          delta: this.delta,
          transferred: this.transferred,
          percent: this.transferred / this.grandTotalBytes * 100,
          bytesPerSecond: Math.round(this.transferred / ((s - this.start) / 1e3))
        }), this.delta = 0);
      }
      n();
    }).catch(n);
  }
  async handleData(t) {
    let r = 0;
    if (this.ignoreByteCount !== 0 && this.remainingPartDataCount !== 0)
      throw (0, sa.newError)("Internal error", "ERR_DATA_SPLITTER_BYTE_COUNT_MISMATCH");
    if (this.ignoreByteCount > 0) {
      const n = Math.min(this.ignoreByteCount, t.length);
      this.ignoreByteCount -= n, r = n;
    } else if (this.remainingPartDataCount > 0) {
      const n = Math.min(this.remainingPartDataCount, t.length);
      this.remainingPartDataCount -= n, await this.processPartData(t, 0, n), r = n;
    }
    if (r !== t.length) {
      if (this.readState === jr.HEADER) {
        const n = this.searchHeaderListEnd(t, r);
        if (n === -1)
          return;
        r = n, this.readState = jr.BODY, this.headerListBuffer = null;
      }
      for (; ; ) {
        if (this.readState === jr.BODY)
          this.readState = jr.INIT;
        else {
          this.partIndex++;
          let a = this.partIndexToTaskIndex.get(this.partIndex);
          if (a == null)
            if (this.isFinished)
              a = this.options.end;
            else
              throw (0, sa.newError)("taskIndex is null", "ERR_DATA_SPLITTER_TASK_INDEX_IS_NULL");
          const o = this.partIndex === 0 ? this.options.start : this.partIndexToTaskIndex.get(this.partIndex - 1) + 1;
          if (o < a)
            await this.copyExistingData(o, a);
          else if (o > a)
            throw (0, sa.newError)("prevTaskIndex must be < taskIndex", "ERR_DATA_SPLITTER_TASK_INDEX_ASSERT_FAILED");
          if (this.isFinished) {
            this.onPartEnd(), this.finishHandler();
            return;
          }
          if (r = this.searchHeaderListEnd(t, r), r === -1) {
            this.readState = jr.HEADER;
            return;
          }
        }
        const n = this.partIndexToLength[this.partIndex], s = r + n, i = Math.min(s, t.length);
        if (await this.processPartStarted(t, r, i), this.remainingPartDataCount = n - (i - r), this.remainingPartDataCount > 0)
          return;
        if (r = s + this.boundaryLength, r >= t.length) {
          this.ignoreByteCount = this.boundaryLength - (t.length - s);
          return;
        }
      }
    }
  }
  copyExistingData(t, r) {
    return new Promise((n, s) => {
      const i = () => {
        if (t === r) {
          n();
          return;
        }
        const a = this.options.tasks[t];
        if (a.kind !== ZU.OperationKind.COPY) {
          s(new Error("Task kind must be COPY"));
          return;
        }
        F0(a, this.out, this.options.oldFileFd, s, () => {
          t++, i();
        });
      };
      i();
    });
  }
  searchHeaderListEnd(t, r) {
    const n = t.indexOf(Qh, r);
    if (n !== -1)
      return n + Qh.length;
    const s = r === 0 ? t : t.slice(r);
    return this.headerListBuffer == null ? this.headerListBuffer = s : this.headerListBuffer = Buffer.concat([this.headerListBuffer, s]), -1;
  }
  onPartEnd() {
    const t = this.partIndexToLength[this.partIndex - 1];
    if (this.actualPartLength !== t)
      throw (0, sa.newError)(`Expected length: ${t} differs from actual: ${this.actualPartLength}`, "ERR_DATA_SPLITTER_LENGTH_MISMATCH");
    this.actualPartLength = 0;
  }
  processPartStarted(t, r, n) {
    return this.partIndex !== 0 && this.onPartEnd(), this.processPartData(t, r, n);
  }
  processPartData(t, r, n) {
    this.actualPartLength += n - r, this.transferred += n - r, this.delta += n - r;
    const s = this.out;
    return s.write(r === 0 && t.length === n ? t : t.slice(r, n)) ? Promise.resolve() : new Promise((i, a) => {
      s.on("error", a), s.once("drain", () => {
        s.removeListener("error", a), i();
      });
    });
  }
}
ys.DataSplitter = eF;
var vo = {};
Object.defineProperty(vo, "__esModule", { value: !0 });
vo.executeTasksUsingMultipleRangeRequests = tF;
vo.checkIsRangesSupported = Ql;
const Jl = xe, Zh = ys, ep = Rn;
function tF(e, t, r, n, s) {
  const i = (a) => {
    if (a >= t.length) {
      e.fileMetadataBuffer != null && r.write(e.fileMetadataBuffer), r.end();
      return;
    }
    const o = a + 1e3;
    rF(e, {
      tasks: t,
      start: a,
      end: Math.min(t.length, o),
      oldFileFd: n
    }, r, () => i(o), s);
  };
  return i;
}
function rF(e, t, r, n, s) {
  let i = "bytes=", a = 0, o = 0;
  const l = /* @__PURE__ */ new Map(), c = [];
  for (let p = t.start; p < t.end; p++) {
    const m = t.tasks[p];
    m.kind === ep.OperationKind.DOWNLOAD && (i += `${m.start}-${m.end - 1}, `, l.set(a, p), a++, c.push(m.end - m.start), o += m.end - m.start);
  }
  if (a <= 1) {
    const p = (m) => {
      if (m >= t.end) {
        n();
        return;
      }
      const _ = t.tasks[m++];
      if (_.kind === ep.OperationKind.COPY)
        (0, Zh.copyData)(_, r, t.oldFileFd, s, () => p(m));
      else {
        const $ = e.createRequestOptions();
        $.headers.Range = `bytes=${_.start}-${_.end - 1}`;
        const v = e.httpExecutor.createRequest($, (g) => {
          g.on("error", s), Ql(g, s) && (g.pipe(r, {
            end: !1
          }), g.once("end", () => p(m)));
        });
        e.httpExecutor.addErrorAndTimeoutHandlers(v, s), v.end();
      }
    };
    p(t.start);
    return;
  }
  const u = e.createRequestOptions();
  u.headers.Range = i.substring(0, i.length - 2);
  const d = e.httpExecutor.createRequest(u, (p) => {
    if (!Ql(p, s))
      return;
    const m = (0, Jl.safeGetHeader)(p, "content-type"), _ = /^multipart\/.+?\s*;\s*boundary=(?:"([^"]+)"|([^\s";]+))\s*$/i.exec(m);
    if (_ == null) {
      s(new Error(`Content-Type "multipart/byteranges" is expected, but got "${m}"`));
      return;
    }
    const $ = new Zh.DataSplitter(r, t, l, _[1] || _[2], c, n, o, e.options.onProgress);
    $.on("error", s), p.pipe($), p.on("end", () => {
      setTimeout(() => {
        d.abort(), s(new Error("Response ends without calling any handlers"));
      }, 1e4);
    });
  });
  e.httpExecutor.addErrorAndTimeoutHandlers(d, s), d.end();
}
function Ql(e, t) {
  if (e.statusCode >= 400)
    return t((0, Jl.createHttpError)(e)), !1;
  if (e.statusCode !== 206) {
    const r = (0, Jl.safeGetHeader)(e, "accept-ranges");
    if (r == null || r === "none")
      return t(new Error(`Server doesn't support Accept-Ranges (response code ${e.statusCode})`)), !1;
  }
  return !0;
}
var wo = {};
Object.defineProperty(wo, "__esModule", { value: !0 });
wo.ProgressDifferentialDownloadCallbackTransform = void 0;
const nF = Ma;
var Wn;
(function(e) {
  e[e.COPY = 0] = "COPY", e[e.DOWNLOAD = 1] = "DOWNLOAD";
})(Wn || (Wn = {}));
class sF extends nF.Transform {
  constructor(t, r, n) {
    super(), this.progressDifferentialDownloadInfo = t, this.cancellationToken = r, this.onProgress = n, this.start = Date.now(), this.transferred = 0, this.delta = 0, this.expectedBytes = 0, this.index = 0, this.operationType = Wn.COPY, this.nextUpdate = this.start + 1e3;
  }
  _transform(t, r, n) {
    if (this.cancellationToken.cancelled) {
      n(new Error("cancelled"), null);
      return;
    }
    if (this.operationType == Wn.COPY) {
      n(null, t);
      return;
    }
    this.transferred += t.length, this.delta += t.length;
    const s = Date.now();
    s >= this.nextUpdate && this.transferred !== this.expectedBytes && this.transferred !== this.progressDifferentialDownloadInfo.grandTotal && (this.nextUpdate = s + 1e3, this.onProgress({
      total: this.progressDifferentialDownloadInfo.grandTotal,
      delta: this.delta,
      transferred: this.transferred,
      percent: this.transferred / this.progressDifferentialDownloadInfo.grandTotal * 100,
      bytesPerSecond: Math.round(this.transferred / ((s - this.start) / 1e3))
    }), this.delta = 0), n(null, t);
  }
  beginFileCopy() {
    this.operationType = Wn.COPY;
  }
  beginRangeDownload() {
    this.operationType = Wn.DOWNLOAD, this.expectedBytes += this.progressDifferentialDownloadInfo.expectedByteCounts[this.index++];
  }
  endRangeDownload() {
    this.transferred !== this.progressDifferentialDownloadInfo.grandTotal && this.onProgress({
      total: this.progressDifferentialDownloadInfo.grandTotal,
      delta: this.delta,
      transferred: this.transferred,
      percent: this.transferred / this.progressDifferentialDownloadInfo.grandTotal * 100,
      bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
    });
  }
  // Called when we are 100% done with the connection/download
  _flush(t) {
    if (this.cancellationToken.cancelled) {
      t(new Error("cancelled"));
      return;
    }
    this.onProgress({
      total: this.progressDifferentialDownloadInfo.grandTotal,
      delta: this.delta,
      transferred: this.transferred,
      percent: 100,
      bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
    }), this.delta = 0, this.transferred = 0, t(null);
  }
}
wo.ProgressDifferentialDownloadCallbackTransform = sF;
Object.defineProperty(Ti, "__esModule", { value: !0 });
Ti.DifferentialDownloader = void 0;
const Is = xe, ml = Sr, iF = Gt, aF = ys, oF = Jr, ia = Rn, tp = vo, lF = wo;
class cF {
  // noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
  constructor(t, r, n) {
    this.blockAwareFileInfo = t, this.httpExecutor = r, this.options = n, this.fileMetadataBuffer = null, this.logger = n.logger;
  }
  createRequestOptions() {
    const t = {
      headers: {
        ...this.options.requestHeaders,
        accept: "*/*"
      }
    };
    return (0, Is.configureRequestUrl)(this.options.newUrl, t), (0, Is.configureRequestOptions)(t), t;
  }
  doDownload(t, r) {
    if (t.version !== r.version)
      throw new Error(`version is different (${t.version} - ${r.version}), full download is required`);
    const n = this.logger, s = (0, ia.computeOperations)(t, r, n);
    n.debug != null && n.debug(JSON.stringify(s, null, 2));
    let i = 0, a = 0;
    for (const l of s) {
      const c = l.end - l.start;
      l.kind === ia.OperationKind.DOWNLOAD ? i += c : a += c;
    }
    const o = this.blockAwareFileInfo.size;
    if (i + a + (this.fileMetadataBuffer == null ? 0 : this.fileMetadataBuffer.length) !== o)
      throw new Error(`Internal error, size mismatch: downloadSize: ${i}, copySize: ${a}, newSize: ${o}`);
    return n.info(`Full: ${rp(o)}, To download: ${rp(i)} (${Math.round(i / (o / 100))}%)`), this.downloadFile(s);
  }
  downloadFile(t) {
    const r = [], n = () => Promise.all(r.map((s) => (0, ml.close)(s.descriptor).catch((i) => {
      this.logger.error(`cannot close file "${s.path}": ${i}`);
    })));
    return this.doDownloadFile(t, r).then(n).catch((s) => n().catch((i) => {
      try {
        this.logger.error(`cannot close files: ${i}`);
      } catch (a) {
        try {
          console.error(a);
        } catch {
        }
      }
      throw s;
    }).then(() => {
      throw s;
    }));
  }
  async doDownloadFile(t, r) {
    const n = await (0, ml.open)(this.options.oldFile, "r");
    r.push({ descriptor: n, path: this.options.oldFile });
    const s = await (0, ml.open)(this.options.newFile, "w");
    r.push({ descriptor: s, path: this.options.newFile });
    const i = (0, iF.createWriteStream)(this.options.newFile, { fd: s });
    await new Promise((a, o) => {
      const l = [];
      let c;
      if (!this.options.isUseMultipleRangeRequest && this.options.onProgress) {
        const g = [];
        let E = 0;
        for (const O of t)
          O.kind === ia.OperationKind.DOWNLOAD && (g.push(O.end - O.start), E += O.end - O.start);
        const N = {
          expectedByteCounts: g,
          grandTotal: E
        };
        c = new lF.ProgressDifferentialDownloadCallbackTransform(N, this.options.cancellationToken, this.options.onProgress), l.push(c);
      }
      const u = new Is.DigestTransform(this.blockAwareFileInfo.sha512);
      u.isValidateOnEnd = !1, l.push(u), i.on("finish", () => {
        i.close(() => {
          r.splice(1, 1);
          try {
            u.validate();
          } catch (g) {
            o(g);
            return;
          }
          a(void 0);
        });
      }), l.push(i);
      let d = null;
      for (const g of l)
        g.on("error", o), d == null ? d = g : d = d.pipe(g);
      const p = l[0];
      let m;
      if (this.options.isUseMultipleRangeRequest) {
        m = (0, tp.executeTasksUsingMultipleRangeRequests)(this, t, p, n, o), m(0);
        return;
      }
      let _ = 0, $ = null;
      this.logger.info(`Differential download: ${this.options.newUrl}`);
      const v = this.createRequestOptions();
      v.redirect = "manual", m = (g) => {
        var E, N;
        if (g >= t.length) {
          this.fileMetadataBuffer != null && p.write(this.fileMetadataBuffer), p.end();
          return;
        }
        const O = t[g++];
        if (O.kind === ia.OperationKind.COPY) {
          c && c.beginFileCopy(), (0, aF.copyData)(O, p, n, o, () => m(g));
          return;
        }
        const U = `bytes=${O.start}-${O.end - 1}`;
        v.headers.range = U, (N = (E = this.logger) === null || E === void 0 ? void 0 : E.debug) === null || N === void 0 || N.call(E, `download range: ${U}`), c && c.beginRangeDownload();
        const q = this.httpExecutor.createRequest(v, (B) => {
          B.on("error", o), B.on("aborted", () => {
            o(new Error("response has been aborted by the server"));
          }), B.statusCode >= 400 && o((0, Is.createHttpError)(B)), B.pipe(p, {
            end: !1
          }), B.once("end", () => {
            c && c.endRangeDownload(), ++_ === 100 ? (_ = 0, setTimeout(() => m(g), 1e3)) : m(g);
          });
        });
        q.on("redirect", (B, me, I) => {
          this.logger.info(`Redirect to ${uF(I)}`), $ = I, (0, Is.configureRequestUrl)(new oF.URL($), v), q.followRedirect();
        }), this.httpExecutor.addErrorAndTimeoutHandlers(q, o), q.end();
      }, m(0);
    });
  }
  async readRemoteBytes(t, r) {
    const n = Buffer.allocUnsafe(r + 1 - t), s = this.createRequestOptions();
    s.headers.range = `bytes=${t}-${r}`;
    let i = 0;
    if (await this.request(s, (a) => {
      a.copy(n, i), i += a.length;
    }), i !== n.length)
      throw new Error(`Received data length ${i} is not equal to expected ${n.length}`);
    return n;
  }
  request(t, r) {
    return new Promise((n, s) => {
      const i = this.httpExecutor.createRequest(t, (a) => {
        (0, tp.checkIsRangesSupported)(a, s) && (a.on("error", s), a.on("aborted", () => {
          s(new Error("response has been aborted by the server"));
        }), a.on("data", r), a.on("end", () => n()));
      });
      this.httpExecutor.addErrorAndTimeoutHandlers(i, s), i.end();
    });
  }
}
Ti.DifferentialDownloader = cF;
function rp(e, t = " KB") {
  return new Intl.NumberFormat("en").format((e / 1024).toFixed(2)) + t;
}
function uF(e) {
  const t = e.indexOf("?");
  return t < 0 ? e : e.substring(0, t);
}
Object.defineProperty(_o, "__esModule", { value: !0 });
_o.GenericDifferentialDownloader = void 0;
const dF = Ti;
class fF extends dF.DifferentialDownloader {
  download(t, r) {
    return this.doDownload(t, r);
  }
}
_o.GenericDifferentialDownloader = fF;
var Qr = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.UpdaterSignal = e.UPDATE_DOWNLOADED = e.DOWNLOAD_PROGRESS = e.CancellationToken = void 0, e.addHandler = n;
  const t = xe;
  Object.defineProperty(e, "CancellationToken", { enumerable: !0, get: function() {
    return t.CancellationToken;
  } }), e.DOWNLOAD_PROGRESS = "download-progress", e.UPDATE_DOWNLOADED = "update-downloaded";
  class r {
    constructor(i) {
      this.emitter = i;
    }
    /**
     * Emitted when an authenticating proxy is [asking for user credentials](https://github.com/electron/electron/blob/master/docs/api/client-request.md#event-login).
     */
    login(i) {
      n(this.emitter, "login", i);
    }
    progress(i) {
      n(this.emitter, e.DOWNLOAD_PROGRESS, i);
    }
    updateDownloaded(i) {
      n(this.emitter, e.UPDATE_DOWNLOADED, i);
    }
    updateCancelled(i) {
      n(this.emitter, "update-cancelled", i);
    }
  }
  e.UpdaterSignal = r;
  function n(s, i, a) {
    s.on(i, a);
  }
})(Qr);
Object.defineProperty(Gr, "__esModule", { value: !0 });
Gr.NoOpLogger = Gr.AppUpdater = void 0;
const ot = xe, hF = ui, pF = Va, mF = bp, jt = Sr, gF = Ye, gl = fo, Mt = st, cn = ed, np = bi, yF = ho, sp = R0, $F = Si, yl = po, $l = Tp, _F = _o, jn = Qr;
class hd extends mF.EventEmitter {
  /**
   * Get the update channel. Doesn't return `channel` from the update configuration, only if was previously set.
   */
  get channel() {
    return this._channel;
  }
  /**
   * Set the update channel. Overrides `channel` in the update configuration.
   *
   * `allowDowngrade` will be automatically set to `true`. If this behavior is not suitable for you, simple set `allowDowngrade` explicitly after.
   */
  set channel(t) {
    if (this._channel != null) {
      if (typeof t != "string")
        throw (0, ot.newError)(`Channel must be a string, but got: ${t}`, "ERR_UPDATER_INVALID_CHANNEL");
      if (t.length === 0)
        throw (0, ot.newError)("Channel must be not an empty string", "ERR_UPDATER_INVALID_CHANNEL");
    }
    this._channel = t, this.allowDowngrade = !0;
  }
  /**
   *  Shortcut for explicitly adding auth tokens to request headers
   */
  addAuthHeader(t) {
    this.requestHeaders = Object.assign({}, this.requestHeaders, {
      authorization: t
    });
  }
  // noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
  get netSession() {
    return (0, sp.getNetSession)();
  }
  /**
   * The logger. You can pass [electron-log](https://github.com/megahertz/electron-log), [winston](https://github.com/winstonjs/winston) or another logger with the following interface: `{ info(), warn(), error() }`.
   * Set it to `null` if you would like to disable a logging feature.
   */
  get logger() {
    return this._logger;
  }
  set logger(t) {
    this._logger = t ?? new L0();
  }
  // noinspection JSUnusedGlobalSymbols
  /**
   * test only
   * @private
   */
  set updateConfigPath(t) {
    this.clientPromise = null, this._appUpdateConfigPath = t, this.configOnDisk = new gl.Lazy(() => this.loadUpdateConfig());
  }
  /**
   * Allows developer to override default logic for determining if an update is supported.
   * The default logic compares the `UpdateInfo` minimum system version against the `os.release()` with `semver` package
   */
  get isUpdateSupported() {
    return this._isUpdateSupported;
  }
  set isUpdateSupported(t) {
    t && (this._isUpdateSupported = t);
  }
  /**
   * Allows developer to override default logic for determining if the user is below the rollout threshold.
   * The default logic compares the staging percentage with numerical representation of user ID.
   * An override can define custom logic, or bypass it if needed.
   */
  get isUserWithinRollout() {
    return this._isUserWithinRollout;
  }
  set isUserWithinRollout(t) {
    t && (this._isUserWithinRollout = t);
  }
  constructor(t, r) {
    super(), this.autoDownload = !0, this.autoInstallOnAppQuit = !0, this.autoRunAppAfterInstall = !0, this.allowPrerelease = !1, this.fullChangelog = !1, this.allowDowngrade = !1, this.disableWebInstaller = !1, this.disableDifferentialDownload = !1, this.forceDevUpdateConfig = !1, this.previousBlockmapBaseUrlOverride = null, this._channel = null, this.downloadedUpdateHelper = null, this.requestHeaders = null, this._logger = console, this.signals = new jn.UpdaterSignal(this), this._appUpdateConfigPath = null, this._isUpdateSupported = (i) => this.checkIfUpdateSupported(i), this._isUserWithinRollout = (i) => this.isStagingMatch(i), this.clientPromise = null, this.stagingUserIdPromise = new gl.Lazy(() => this.getOrCreateStagingUserId()), this.configOnDisk = new gl.Lazy(() => this.loadUpdateConfig()), this.checkForUpdatesPromise = null, this.downloadPromise = null, this.updateInfoAndProvider = null, this._testOnlyOptions = null, this.on("error", (i) => {
      this._logger.error(`Error: ${i.stack || i.message}`);
    }), r == null ? (this.app = new yF.ElectronAppAdapter(), this.httpExecutor = new sp.ElectronHttpExecutor((i, a) => this.emit("login", i, a))) : (this.app = r, this.httpExecutor = null);
    const n = this.app.version, s = (0, cn.parse)(n);
    if (s == null)
      throw (0, ot.newError)(`App version is not a valid semver version: "${n}"`, "ERR_UPDATER_INVALID_VERSION");
    this.currentVersion = s, this.allowPrerelease = vF(s), t != null && (this.setFeedURL(t), typeof t != "string" && t.requestHeaders && (this.requestHeaders = t.requestHeaders));
  }
  //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
  getFeedURL() {
    return "Deprecated. Do not use it.";
  }
  /**
   * Configure update provider. If value is `string`, [GenericServerOptions](./publish.md#genericserveroptions) will be set with value as `url`.
   * @param options If you want to override configuration in the `app-update.yml`.
   */
  setFeedURL(t) {
    const r = this.createProviderRuntimeOptions();
    let n;
    typeof t == "string" ? n = new $F.GenericProvider({ provider: "generic", url: t }, this, {
      ...r,
      isUseMultipleRangeRequest: (0, yl.isUrlProbablySupportMultiRangeRequests)(t)
    }) : n = (0, yl.createClient)(t, this, r), this.clientPromise = Promise.resolve(n);
  }
  /**
   * Asks the server whether there is an update.
   * @returns null if the updater is disabled, otherwise info about the latest version
   */
  checkForUpdates() {
    if (!this.isUpdaterActive())
      return Promise.resolve(null);
    let t = this.checkForUpdatesPromise;
    if (t != null)
      return this._logger.info("Checking for update (already in progress)"), t;
    const r = () => this.checkForUpdatesPromise = null;
    return this._logger.info("Checking for update"), t = this.doCheckForUpdates().then((n) => (r(), n)).catch((n) => {
      throw r(), this.emit("error", n, `Cannot check for updates: ${(n.stack || n).toString()}`), n;
    }), this.checkForUpdatesPromise = t, t;
  }
  isUpdaterActive() {
    return this.app.isPackaged || this.forceDevUpdateConfig ? !0 : (this._logger.info("Skip checkForUpdates because application is not packed and dev update config is not forced"), !1);
  }
  // noinspection JSUnusedGlobalSymbols
  checkForUpdatesAndNotify(t) {
    return this.checkForUpdates().then((r) => r != null && r.downloadPromise ? (r.downloadPromise.then(() => {
      const n = hd.formatDownloadNotification(r.updateInfo.version, this.app.name, t);
      new vr.Notification(n).show();
    }), r) : (this._logger.debug != null && this._logger.debug("checkForUpdatesAndNotify called, downloadPromise is null"), r));
  }
  static formatDownloadNotification(t, r, n) {
    return n == null && (n = {
      title: "A new update is ready to install",
      body: "{appName} version {version} has been downloaded and will be automatically installed on exit"
    }), n = {
      title: n.title.replace("{appName}", r).replace("{version}", t),
      body: n.body.replace("{appName}", r).replace("{version}", t)
    }, n;
  }
  async isStagingMatch(t) {
    const r = t.stagingPercentage;
    let n = r;
    if (n == null)
      return !0;
    if (n = parseInt(n, 10), isNaN(n))
      return this._logger.warn(`Staging percentage is NaN: ${r}`), !0;
    n = n / 100;
    const s = await this.stagingUserIdPromise.value, a = ot.UUID.parse(s).readUInt32BE(12) / 4294967295;
    return this._logger.info(`Staging percentage: ${n}, percentage: ${a}, user id: ${s}`), a < n;
  }
  computeFinalHeaders(t) {
    return this.requestHeaders != null && Object.assign(t, this.requestHeaders), t;
  }
  async isUpdateAvailable(t) {
    const r = (0, cn.parse)(t.version);
    if (r == null)
      throw (0, ot.newError)(`This file could not be downloaded, or the latest version (from update server) does not have a valid semver version: "${t.version}"`, "ERR_UPDATER_INVALID_VERSION");
    const n = this.currentVersion;
    if ((0, cn.eq)(r, n) || !await Promise.resolve(this.isUpdateSupported(t)) || !await Promise.resolve(this.isUserWithinRollout(t)))
      return !1;
    const i = (0, cn.gt)(r, n), a = (0, cn.lt)(r, n);
    return i ? !0 : this.allowDowngrade && a;
  }
  checkIfUpdateSupported(t) {
    const r = t == null ? void 0 : t.minimumSystemVersion, n = (0, pF.release)();
    if (r)
      try {
        if ((0, cn.lt)(n, r))
          return this._logger.info(`Current OS version ${n} is less than the minimum OS version required ${r} for version ${n}`), !1;
      } catch (s) {
        this._logger.warn(`Failed to compare current OS version(${n}) with minimum OS version(${r}): ${(s.message || s).toString()}`);
      }
    return !0;
  }
  async getUpdateInfoAndProvider() {
    await this.app.whenReady(), this.clientPromise == null && (this.clientPromise = this.configOnDisk.value.then((n) => (0, yl.createClient)(n, this, this.createProviderRuntimeOptions())));
    const t = await this.clientPromise, r = await this.stagingUserIdPromise.value;
    return t.setRequestHeaders(this.computeFinalHeaders({ "x-user-staging-id": r })), {
      info: await t.getLatestVersion(),
      provider: t
    };
  }
  createProviderRuntimeOptions() {
    return {
      isUseMultipleRangeRequest: !0,
      platform: this._testOnlyOptions == null ? process.platform : this._testOnlyOptions.platform,
      executor: this.httpExecutor
    };
  }
  async doCheckForUpdates() {
    this.emit("checking-for-update");
    const t = await this.getUpdateInfoAndProvider(), r = t.info;
    if (!await this.isUpdateAvailable(r))
      return this._logger.info(`Update for version ${this.currentVersion.format()} is not available (latest version: ${r.version}, downgrade is ${this.allowDowngrade ? "allowed" : "disallowed"}).`), this.emit("update-not-available", r), {
        isUpdateAvailable: !1,
        versionInfo: r,
        updateInfo: r
      };
    this.updateInfoAndProvider = t, this.onUpdateAvailable(r);
    const n = new ot.CancellationToken();
    return {
      isUpdateAvailable: !0,
      versionInfo: r,
      updateInfo: r,
      cancellationToken: n,
      downloadPromise: this.autoDownload ? this.downloadUpdate(n) : null
    };
  }
  onUpdateAvailable(t) {
    this._logger.info(`Found version ${t.version} (url: ${(0, ot.asArray)(t.files).map((r) => r.url).join(", ")})`), this.emit("update-available", t);
  }
  /**
   * Start downloading update manually. You can use this method if `autoDownload` option is set to `false`.
   * @returns {Promise<Array<string>>} Paths to downloaded files.
   */
  downloadUpdate(t = new ot.CancellationToken()) {
    const r = this.updateInfoAndProvider;
    if (r == null) {
      const s = new Error("Please check update first");
      return this.dispatchError(s), Promise.reject(s);
    }
    if (this.downloadPromise != null)
      return this._logger.info("Downloading update (already in progress)"), this.downloadPromise;
    this._logger.info(`Downloading update from ${(0, ot.asArray)(r.info.files).map((s) => s.url).join(", ")}`);
    const n = (s) => {
      if (!(s instanceof ot.CancellationError))
        try {
          this.dispatchError(s);
        } catch (i) {
          this._logger.warn(`Cannot dispatch error event: ${i.stack || i}`);
        }
      return s;
    };
    return this.downloadPromise = this.doDownloadUpdate({
      updateInfoAndProvider: r,
      requestHeaders: this.computeRequestHeaders(r.provider),
      cancellationToken: t,
      disableWebInstaller: this.disableWebInstaller,
      disableDifferentialDownload: this.disableDifferentialDownload
    }).catch((s) => {
      throw n(s);
    }).finally(() => {
      this.downloadPromise = null;
    }), this.downloadPromise;
  }
  dispatchError(t) {
    this.emit("error", t, (t.stack || t).toString());
  }
  dispatchUpdateDownloaded(t) {
    this.emit(jn.UPDATE_DOWNLOADED, t);
  }
  async loadUpdateConfig() {
    return this._appUpdateConfigPath == null && (this._appUpdateConfigPath = this.app.appUpdateConfigPath), (0, gF.load)(await (0, jt.readFile)(this._appUpdateConfigPath, "utf-8"));
  }
  computeRequestHeaders(t) {
    const r = t.fileExtraDownloadHeaders;
    if (r != null) {
      const n = this.requestHeaders;
      return n == null ? r : {
        ...r,
        ...n
      };
    }
    return this.computeFinalHeaders({ accept: "*/*" });
  }
  async getOrCreateStagingUserId() {
    const t = Mt.join(this.app.userDataPath, ".updaterId");
    try {
      const n = await (0, jt.readFile)(t, "utf-8");
      if (ot.UUID.check(n))
        return n;
      this._logger.warn(`Staging user id file exists, but content was invalid: ${n}`);
    } catch (n) {
      n.code !== "ENOENT" && this._logger.warn(`Couldn't read staging user ID, creating a blank one: ${n}`);
    }
    const r = ot.UUID.v5((0, hF.randomBytes)(4096), ot.UUID.OID);
    this._logger.info(`Generated new staging user ID: ${r}`);
    try {
      await (0, jt.outputFile)(t, r);
    } catch (n) {
      this._logger.warn(`Couldn't write out staging user ID: ${n}`);
    }
    return r;
  }
  /** @internal */
  get isAddNoCacheQuery() {
    const t = this.requestHeaders;
    if (t == null)
      return !0;
    for (const r of Object.keys(t)) {
      const n = r.toLowerCase();
      if (n === "authorization" || n === "private-token")
        return !1;
    }
    return !0;
  }
  async getOrCreateDownloadHelper() {
    let t = this.downloadedUpdateHelper;
    if (t == null) {
      const r = (await this.configOnDisk.value).updaterCacheDirName, n = this._logger;
      r == null && n.error("updaterCacheDirName is not specified in app-update.yml Was app build using at least electron-builder 20.34.0?");
      const s = Mt.join(this.app.baseCachePath, r || this.app.name);
      n.debug != null && n.debug(`updater cache dir: ${s}`), t = new np.DownloadedUpdateHelper(s), this.downloadedUpdateHelper = t;
    }
    return t;
  }
  async executeDownload(t) {
    const r = t.fileInfo, n = {
      headers: t.downloadUpdateOptions.requestHeaders,
      cancellationToken: t.downloadUpdateOptions.cancellationToken,
      sha2: r.info.sha2,
      sha512: r.info.sha512
    };
    this.listenerCount(jn.DOWNLOAD_PROGRESS) > 0 && (n.onProgress = (E) => this.emit(jn.DOWNLOAD_PROGRESS, E));
    const s = t.downloadUpdateOptions.updateInfoAndProvider.info, i = s.version, a = r.packageInfo;
    function o() {
      const E = decodeURIComponent(t.fileInfo.url.pathname);
      return E.toLowerCase().endsWith(`.${t.fileExtension.toLowerCase()}`) ? Mt.basename(E) : t.fileInfo.info.url;
    }
    const l = await this.getOrCreateDownloadHelper(), c = l.cacheDirForPendingUpdate;
    await (0, jt.mkdir)(c, { recursive: !0 });
    const u = o();
    let d = Mt.join(c, u);
    const p = a == null ? null : Mt.join(c, `package-${i}${Mt.extname(a.path) || ".7z"}`), m = async (E) => {
      await l.setDownloadedFile(d, p, s, r, u, E), await t.done({
        ...s,
        downloadedFile: d
      });
      const N = Mt.join(c, "current.blockmap");
      return await (0, jt.pathExists)(N) && await (0, jt.copyFile)(N, Mt.join(l.cacheDir, "current.blockmap")), p == null ? [d] : [d, p];
    }, _ = this._logger, $ = await l.validateDownloadedPath(d, s, r, _);
    if ($ != null)
      return d = $, await m(!1);
    const v = async () => (await l.clear().catch(() => {
    }), await (0, jt.unlink)(d).catch(() => {
    })), g = await (0, np.createTempUpdateFile)(`temp-${u}`, c, _);
    try {
      await t.task(g, n, p, v), await (0, ot.retry)(() => (0, jt.rename)(g, d), {
        retries: 60,
        interval: 500,
        shouldRetry: (E) => E instanceof Error && /^EBUSY:/.test(E.message) ? !0 : (_.warn(`Cannot rename temp file to final file: ${E.message || E.stack}`), !1)
      });
    } catch (E) {
      throw await v(), E instanceof ot.CancellationError && (_.info("cancelled"), this.emit("update-cancelled", s)), E;
    }
    return _.info(`New version ${i} has been downloaded to ${d}`), await m(!0);
  }
  async differentialDownloadInstaller(t, r, n, s, i) {
    try {
      if (this._testOnlyOptions != null && !this._testOnlyOptions.isUseDifferentialDownload)
        return !0;
      const a = r.updateInfoAndProvider.provider, o = await a.getBlockMapFiles(t.url, this.app.version, r.updateInfoAndProvider.info.version, this.previousBlockmapBaseUrlOverride);
      this._logger.info(`Download block maps (old: "${o[0]}", new: ${o[1]})`);
      const l = async (_) => {
        const $ = await this.httpExecutor.downloadToBuffer(_, {
          headers: r.requestHeaders,
          cancellationToken: r.cancellationToken
        });
        if ($ == null || $.length === 0)
          throw new Error(`Blockmap "${_.href}" is empty`);
        try {
          return JSON.parse((0, $l.gunzipSync)($).toString());
        } catch (v) {
          throw new Error(`Cannot parse blockmap "${_.href}", error: ${v}`);
        }
      }, c = {
        newUrl: t.url,
        oldFile: Mt.join(this.downloadedUpdateHelper.cacheDir, i),
        logger: this._logger,
        newFile: n,
        isUseMultipleRangeRequest: a.isUseMultipleRangeRequest,
        requestHeaders: r.requestHeaders,
        cancellationToken: r.cancellationToken
      };
      this.listenerCount(jn.DOWNLOAD_PROGRESS) > 0 && (c.onProgress = (_) => this.emit(jn.DOWNLOAD_PROGRESS, _));
      const u = async (_, $) => {
        const v = Mt.join($, "current.blockmap");
        await (0, jt.outputFile)(v, (0, $l.gzipSync)(JSON.stringify(_)));
      }, d = async (_) => {
        const $ = Mt.join(_, "current.blockmap");
        try {
          if (await (0, jt.pathExists)($))
            return JSON.parse((0, $l.gunzipSync)(await (0, jt.readFile)($)).toString());
        } catch (v) {
          this._logger.warn(`Cannot parse blockmap "${$}", error: ${v}`);
        }
        return null;
      }, p = await l(o[1]);
      await u(p, this.downloadedUpdateHelper.cacheDirForPendingUpdate);
      let m = await d(this.downloadedUpdateHelper.cacheDir);
      return m == null && (m = await l(o[0])), await new _F.GenericDifferentialDownloader(t.info, this.httpExecutor, c).download(m, p), !1;
    } catch (a) {
      if (this._logger.error(`Cannot download differentially, fallback to full download: ${a.stack || a}`), this._testOnlyOptions != null)
        throw a;
      return !0;
    }
  }
}
Gr.AppUpdater = hd;
function vF(e) {
  const t = (0, cn.prerelease)(e);
  return t != null && t.length > 0;
}
class L0 {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  info(t) {
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  warn(t) {
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  error(t) {
  }
}
Gr.NoOpLogger = L0;
Object.defineProperty(An, "__esModule", { value: !0 });
An.BaseUpdater = void 0;
const ip = qa, wF = Gr;
class EF extends wF.AppUpdater {
  constructor(t, r) {
    super(t, r), this.quitAndInstallCalled = !1, this.quitHandlerAdded = !1;
  }
  quitAndInstall(t = !1, r = !1) {
    this._logger.info("Install on explicit quitAndInstall"), this.install(t, t ? r : this.autoRunAppAfterInstall) ? setImmediate(() => {
      vr.autoUpdater.emit("before-quit-for-update"), this.app.quit();
    }) : this.quitAndInstallCalled = !1;
  }
  executeDownload(t) {
    return super.executeDownload({
      ...t,
      done: (r) => (this.dispatchUpdateDownloaded(r), this.addQuitHandler(), Promise.resolve())
    });
  }
  get installerPath() {
    return this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.file;
  }
  // must be sync (because quit even handler is not async)
  install(t = !1, r = !1) {
    if (this.quitAndInstallCalled)
      return this._logger.warn("install call ignored: quitAndInstallCalled is set to true"), !1;
    const n = this.downloadedUpdateHelper, s = this.installerPath, i = n == null ? null : n.downloadedFileInfo;
    if (s == null || i == null)
      return this.dispatchError(new Error("No update filepath provided, can't quit and install")), !1;
    this.quitAndInstallCalled = !0;
    try {
      return this._logger.info(`Install: isSilent: ${t}, isForceRunAfter: ${r}`), this.doInstall({
        isSilent: t,
        isForceRunAfter: r,
        isAdminRightsRequired: i.isAdminRightsRequired
      });
    } catch (a) {
      return this.dispatchError(a), !1;
    }
  }
  addQuitHandler() {
    this.quitHandlerAdded || !this.autoInstallOnAppQuit || (this.quitHandlerAdded = !0, this.app.onQuit((t) => {
      if (this.quitAndInstallCalled) {
        this._logger.info("Update installer has already been triggered. Quitting application.");
        return;
      }
      if (!this.autoInstallOnAppQuit) {
        this._logger.info("Update will not be installed on quit because autoInstallOnAppQuit is set to false.");
        return;
      }
      if (t !== 0) {
        this._logger.info(`Update will be not installed on quit because application is quitting with exit code ${t}`);
        return;
      }
      this._logger.info("Auto install update on quit"), this.install(!0, !1);
    }));
  }
  spawnSyncLog(t, r = [], n = {}) {
    this._logger.info(`Executing: ${t} with args: ${r}`);
    const s = (0, ip.spawnSync)(t, r, {
      env: { ...process.env, ...n },
      encoding: "utf-8",
      shell: !0
    }), { error: i, status: a, stdout: o, stderr: l } = s;
    if (i != null)
      throw this._logger.error(l), i;
    if (a != null && a !== 0)
      throw this._logger.error(l), new Error(`Command ${t} exited with code ${a}`);
    return o.trim();
  }
  /**
   * This handles both node 8 and node 10 way of emitting error when spawning a process
   *   - node 8: Throws the error
   *   - node 10: Emit the error(Need to listen with on)
   */
  // https://github.com/electron-userland/electron-builder/issues/1129
  // Node 8 sends errors: https://nodejs.org/dist/latest-v8.x/docs/api/errors.html#errors_common_system_errors
  async spawnLog(t, r = [], n = void 0, s = "ignore") {
    return this._logger.info(`Executing: ${t} with args: ${r}`), new Promise((i, a) => {
      try {
        const o = { stdio: s, env: n, detached: !0 }, l = (0, ip.spawn)(t, r, o);
        l.on("error", (c) => {
          a(c);
        }), l.unref(), l.pid !== void 0 && i(!0);
      } catch (o) {
        a(o);
      }
    });
  }
}
An.BaseUpdater = EF;
var si = {}, Pi = {};
Object.defineProperty(Pi, "__esModule", { value: !0 });
Pi.FileWithEmbeddedBlockMapDifferentialDownloader = void 0;
const Mn = Sr, bF = Ti, SF = Tp;
class TF extends bF.DifferentialDownloader {
  async download() {
    const t = this.blockAwareFileInfo, r = t.size, n = r - (t.blockMapSize + 4);
    this.fileMetadataBuffer = await this.readRemoteBytes(n, r - 1);
    const s = j0(this.fileMetadataBuffer.slice(0, this.fileMetadataBuffer.length - 4));
    await this.doDownload(await PF(this.options.oldFile), s);
  }
}
Pi.FileWithEmbeddedBlockMapDifferentialDownloader = TF;
function j0(e) {
  return JSON.parse((0, SF.inflateRawSync)(e).toString());
}
async function PF(e) {
  const t = await (0, Mn.open)(e, "r");
  try {
    const r = (await (0, Mn.fstat)(t)).size, n = Buffer.allocUnsafe(4);
    await (0, Mn.read)(t, n, 0, n.length, r - n.length);
    const s = Buffer.allocUnsafe(n.readUInt32BE(0));
    return await (0, Mn.read)(t, s, 0, s.length, r - n.length - s.length), await (0, Mn.close)(t), j0(s);
  } catch (r) {
    throw await (0, Mn.close)(t), r;
  }
}
Object.defineProperty(si, "__esModule", { value: !0 });
si.AppImageUpdater = void 0;
const ap = xe, op = qa, AF = Sr, RF = Gt, Ds = st, NF = An, CF = Pi, OF = ke, lp = Qr;
class IF extends NF.BaseUpdater {
  constructor(t, r) {
    super(t, r);
  }
  isUpdaterActive() {
    return process.env.APPIMAGE == null && !this.forceDevUpdateConfig ? (process.env.SNAP == null ? this._logger.warn("APPIMAGE env is not defined, current application is not an AppImage") : this._logger.info("SNAP env is defined, updater is disabled"), !1) : super.isUpdaterActive();
  }
  /*** @private */
  doDownloadUpdate(t) {
    const r = t.updateInfoAndProvider.provider, n = (0, OF.findFile)(r.resolveFiles(t.updateInfoAndProvider.info), "AppImage", ["rpm", "deb", "pacman"]);
    return this.executeDownload({
      fileExtension: "AppImage",
      fileInfo: n,
      downloadUpdateOptions: t,
      task: async (s, i) => {
        const a = process.env.APPIMAGE;
        if (a == null)
          throw (0, ap.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
        (t.disableDifferentialDownload || await this.downloadDifferential(n, a, s, r, t)) && await this.httpExecutor.download(n.url, s, i), await (0, AF.chmod)(s, 493);
      }
    });
  }
  async downloadDifferential(t, r, n, s, i) {
    try {
      const a = {
        newUrl: t.url,
        oldFile: r,
        logger: this._logger,
        newFile: n,
        isUseMultipleRangeRequest: s.isUseMultipleRangeRequest,
        requestHeaders: i.requestHeaders,
        cancellationToken: i.cancellationToken
      };
      return this.listenerCount(lp.DOWNLOAD_PROGRESS) > 0 && (a.onProgress = (o) => this.emit(lp.DOWNLOAD_PROGRESS, o)), await new CF.FileWithEmbeddedBlockMapDifferentialDownloader(t.info, this.httpExecutor, a).download(), !1;
    } catch (a) {
      return this._logger.error(`Cannot download differentially, fallback to full download: ${a.stack || a}`), process.platform === "linux";
    }
  }
  doInstall(t) {
    const r = process.env.APPIMAGE;
    if (r == null)
      throw (0, ap.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
    (0, RF.unlinkSync)(r);
    let n;
    const s = Ds.basename(r), i = this.installerPath;
    if (i == null)
      return this.dispatchError(new Error("No update filepath provided, can't quit and install")), !1;
    Ds.basename(i) === s || !/\d+\.\d+\.\d+/.test(s) ? n = r : n = Ds.join(Ds.dirname(r), Ds.basename(i)), (0, op.execFileSync)("mv", ["-f", i, n]), n !== r && this.emit("appimage-filename-updated", n);
    const a = {
      ...process.env,
      APPIMAGE_SILENT_INSTALL: "true"
    };
    return t.isForceRunAfter ? this.spawnLog(n, [], a) : (a.APPIMAGE_EXIT_AFTER_INSTALL = "true", (0, op.execFileSync)(n, [], { env: a })), !0;
  }
}
si.AppImageUpdater = IF;
var ii = {}, $s = {};
Object.defineProperty($s, "__esModule", { value: !0 });
$s.LinuxUpdater = void 0;
const DF = An;
class kF extends DF.BaseUpdater {
  constructor(t, r) {
    super(t, r);
  }
  /**
   * Returns true if the current process is running as root.
   */
  isRunningAsRoot() {
    var t;
    return ((t = process.getuid) === null || t === void 0 ? void 0 : t.call(process)) === 0;
  }
  /**
   * Sanitizies the installer path for using with command line tools.
   */
  get installerPath() {
    var t, r;
    return (r = (t = super.installerPath) === null || t === void 0 ? void 0 : t.replace(/\\/g, "\\\\").replace(/ /g, "\\ ")) !== null && r !== void 0 ? r : null;
  }
  runCommandWithSudoIfNeeded(t) {
    if (this.isRunningAsRoot())
      return this._logger.info("Running as root, no need to use sudo"), this.spawnSyncLog(t[0], t.slice(1));
    const { name: r } = this.app, n = `"${r} would like to update"`, s = this.sudoWithArgs(n);
    this._logger.info(`Running as non-root user, using sudo to install: ${s}`);
    let i = '"';
    return (/pkexec/i.test(s[0]) || s[0] === "sudo") && (i = ""), this.spawnSyncLog(s[0], [...s.length > 1 ? s.slice(1) : [], `${i}/bin/bash`, "-c", `'${t.join(" ")}'${i}`]);
  }
  sudoWithArgs(t) {
    const r = this.determineSudoCommand(), n = [r];
    return /kdesudo/i.test(r) ? (n.push("--comment", t), n.push("-c")) : /gksudo/i.test(r) ? n.push("--message", t) : /pkexec/i.test(r) && n.push("--disable-internal-agent"), n;
  }
  hasCommand(t) {
    try {
      return this.spawnSyncLog("command", ["-v", t]), !0;
    } catch {
      return !1;
    }
  }
  determineSudoCommand() {
    const t = ["gksudo", "kdesudo", "pkexec", "beesu"];
    for (const r of t)
      if (this.hasCommand(r))
        return r;
    return "sudo";
  }
  /**
   * Detects the package manager to use based on the available commands.
   * Allows overriding the default behavior by setting the ELECTRON_BUILDER_LINUX_PACKAGE_MANAGER environment variable.
   * If the environment variable is set, it will be used directly. (This is useful for testing each package manager logic path.)
   * Otherwise, it checks for the presence of the specified package manager commands in the order provided.
   * @param pms - An array of package manager commands to check for, in priority order.
   * @returns The detected package manager command or "unknown" if none are found.
   */
  detectPackageManager(t) {
    var r;
    const n = (r = process.env.ELECTRON_BUILDER_LINUX_PACKAGE_MANAGER) === null || r === void 0 ? void 0 : r.trim();
    if (n)
      return n;
    for (const s of t)
      if (this.hasCommand(s))
        return s;
    return this._logger.warn(`No package manager found in the list: ${t.join(", ")}. Defaulting to the first one: ${t[0]}`), t[0];
  }
}
$s.LinuxUpdater = kF;
Object.defineProperty(ii, "__esModule", { value: !0 });
ii.DebUpdater = void 0;
const UF = ke, cp = Qr, FF = $s;
class pd extends FF.LinuxUpdater {
  constructor(t, r) {
    super(t, r);
  }
  /*** @private */
  doDownloadUpdate(t) {
    const r = t.updateInfoAndProvider.provider, n = (0, UF.findFile)(r.resolveFiles(t.updateInfoAndProvider.info), "deb", ["AppImage", "rpm", "pacman"]);
    return this.executeDownload({
      fileExtension: "deb",
      fileInfo: n,
      downloadUpdateOptions: t,
      task: async (s, i) => {
        this.listenerCount(cp.DOWNLOAD_PROGRESS) > 0 && (i.onProgress = (a) => this.emit(cp.DOWNLOAD_PROGRESS, a)), await this.httpExecutor.download(n.url, s, i);
      }
    });
  }
  doInstall(t) {
    const r = this.installerPath;
    if (r == null)
      return this.dispatchError(new Error("No update filepath provided, can't quit and install")), !1;
    if (!this.hasCommand("dpkg") && !this.hasCommand("apt"))
      return this.dispatchError(new Error("Neither dpkg nor apt command found. Cannot install .deb package.")), !1;
    const n = ["dpkg", "apt"], s = this.detectPackageManager(n);
    try {
      pd.installWithCommandRunner(s, r, this.runCommandWithSudoIfNeeded.bind(this), this._logger);
    } catch (i) {
      return this.dispatchError(i), !1;
    }
    return t.isForceRunAfter && this.app.relaunch(), !0;
  }
  static installWithCommandRunner(t, r, n, s) {
    var i;
    if (t === "dpkg")
      try {
        n(["dpkg", "-i", r]);
      } catch (a) {
        s.warn((i = a.message) !== null && i !== void 0 ? i : a), s.warn("dpkg installation failed, trying to fix broken dependencies with apt-get"), n(["apt-get", "install", "-f", "-y"]);
      }
    else if (t === "apt")
      s.warn("Using apt to install a local .deb. This may fail for unsigned packages unless properly configured."), n([
        "apt",
        "install",
        "-y",
        "--allow-unauthenticated",
        // needed for unsigned .debs
        "--allow-downgrades",
        // allow lower version installs
        "--allow-change-held-packages",
        r
      ]);
    else
      throw new Error(`Package manager ${t} not supported`);
  }
}
ii.DebUpdater = pd;
var ai = {};
Object.defineProperty(ai, "__esModule", { value: !0 });
ai.PacmanUpdater = void 0;
const up = Qr, LF = ke, jF = $s;
class md extends jF.LinuxUpdater {
  constructor(t, r) {
    super(t, r);
  }
  /*** @private */
  doDownloadUpdate(t) {
    const r = t.updateInfoAndProvider.provider, n = (0, LF.findFile)(r.resolveFiles(t.updateInfoAndProvider.info), "pacman", ["AppImage", "deb", "rpm"]);
    return this.executeDownload({
      fileExtension: "pacman",
      fileInfo: n,
      downloadUpdateOptions: t,
      task: async (s, i) => {
        this.listenerCount(up.DOWNLOAD_PROGRESS) > 0 && (i.onProgress = (a) => this.emit(up.DOWNLOAD_PROGRESS, a)), await this.httpExecutor.download(n.url, s, i);
      }
    });
  }
  doInstall(t) {
    const r = this.installerPath;
    if (r == null)
      return this.dispatchError(new Error("No update filepath provided, can't quit and install")), !1;
    try {
      md.installWithCommandRunner(r, this.runCommandWithSudoIfNeeded.bind(this), this._logger);
    } catch (n) {
      return this.dispatchError(n), !1;
    }
    return t.isForceRunAfter && this.app.relaunch(), !0;
  }
  static installWithCommandRunner(t, r, n) {
    var s;
    try {
      r(["pacman", "-U", "--noconfirm", t]);
    } catch (i) {
      n.warn((s = i.message) !== null && s !== void 0 ? s : i), n.warn("pacman installation failed, attempting to update package database and retry");
      try {
        r(["pacman", "-Sy", "--noconfirm"]), r(["pacman", "-U", "--noconfirm", t]);
      } catch (a) {
        throw n.error("Retry after pacman -Sy failed"), a;
      }
    }
  }
}
ai.PacmanUpdater = md;
var oi = {};
Object.defineProperty(oi, "__esModule", { value: !0 });
oi.RpmUpdater = void 0;
const dp = Qr, MF = ke, xF = $s;
class gd extends xF.LinuxUpdater {
  constructor(t, r) {
    super(t, r);
  }
  /*** @private */
  doDownloadUpdate(t) {
    const r = t.updateInfoAndProvider.provider, n = (0, MF.findFile)(r.resolveFiles(t.updateInfoAndProvider.info), "rpm", ["AppImage", "deb", "pacman"]);
    return this.executeDownload({
      fileExtension: "rpm",
      fileInfo: n,
      downloadUpdateOptions: t,
      task: async (s, i) => {
        this.listenerCount(dp.DOWNLOAD_PROGRESS) > 0 && (i.onProgress = (a) => this.emit(dp.DOWNLOAD_PROGRESS, a)), await this.httpExecutor.download(n.url, s, i);
      }
    });
  }
  doInstall(t) {
    const r = this.installerPath;
    if (r == null)
      return this.dispatchError(new Error("No update filepath provided, can't quit and install")), !1;
    const n = ["zypper", "dnf", "yum", "rpm"], s = this.detectPackageManager(n);
    try {
      gd.installWithCommandRunner(s, r, this.runCommandWithSudoIfNeeded.bind(this), this._logger);
    } catch (i) {
      return this.dispatchError(i), !1;
    }
    return t.isForceRunAfter && this.app.relaunch(), !0;
  }
  static installWithCommandRunner(t, r, n, s) {
    if (t === "zypper")
      return n(["zypper", "--non-interactive", "--no-refresh", "install", "--allow-unsigned-rpm", "-f", r]);
    if (t === "dnf")
      return n(["dnf", "install", "--nogpgcheck", "-y", r]);
    if (t === "yum")
      return n(["yum", "install", "--nogpgcheck", "-y", r]);
    if (t === "rpm")
      return s.warn("Installing with rpm only (no dependency resolution)."), n(["rpm", "-Uvh", "--replacepkgs", "--replacefiles", "--nodeps", r]);
    throw new Error(`Package manager ${t} not supported`);
  }
}
oi.RpmUpdater = gd;
var li = {};
Object.defineProperty(li, "__esModule", { value: !0 });
li.MacUpdater = void 0;
const fp = xe, _l = Sr, qF = Gt, hp = st, VF = Zy, BF = Gr, HF = ke, pp = qa, mp = ui;
class zF extends BF.AppUpdater {
  constructor(t, r) {
    super(t, r), this.nativeUpdater = vr.autoUpdater, this.squirrelDownloadedUpdate = !1, this.nativeUpdater.on("error", (n) => {
      this._logger.warn(n), this.emit("error", n);
    }), this.nativeUpdater.on("update-downloaded", () => {
      this.squirrelDownloadedUpdate = !0, this.debug("nativeUpdater.update-downloaded");
    });
  }
  debug(t) {
    this._logger.debug != null && this._logger.debug(t);
  }
  closeServerIfExists() {
    this.server && (this.debug("Closing proxy server"), this.server.close((t) => {
      t && this.debug("proxy server wasn't already open, probably attempted closing again as a safety check before quit");
    }));
  }
  async doDownloadUpdate(t) {
    let r = t.updateInfoAndProvider.provider.resolveFiles(t.updateInfoAndProvider.info);
    const n = this._logger, s = "sysctl.proc_translated";
    let i = !1;
    try {
      this.debug("Checking for macOS Rosetta environment"), i = (0, pp.execFileSync)("sysctl", [s], { encoding: "utf8" }).includes(`${s}: 1`), n.info(`Checked for macOS Rosetta environment (isRosetta=${i})`);
    } catch (d) {
      n.warn(`sysctl shell command to check for macOS Rosetta environment failed: ${d}`);
    }
    let a = !1;
    try {
      this.debug("Checking for arm64 in uname");
      const p = (0, pp.execFileSync)("uname", ["-a"], { encoding: "utf8" }).includes("ARM");
      n.info(`Checked 'uname -a': arm64=${p}`), a = a || p;
    } catch (d) {
      n.warn(`uname shell command to check for arm64 failed: ${d}`);
    }
    a = a || process.arch === "arm64" || i;
    const o = (d) => {
      var p;
      return d.url.pathname.includes("arm64") || ((p = d.info.url) === null || p === void 0 ? void 0 : p.includes("arm64"));
    };
    a && r.some(o) ? r = r.filter((d) => a === o(d)) : r = r.filter((d) => !o(d));
    const l = (0, HF.findFile)(r, "zip", ["pkg", "dmg"]);
    if (l == null)
      throw (0, fp.newError)(`ZIP file not provided: ${(0, fp.safeStringifyJson)(r)}`, "ERR_UPDATER_ZIP_FILE_NOT_FOUND");
    const c = t.updateInfoAndProvider.provider, u = "update.zip";
    return this.executeDownload({
      fileExtension: "zip",
      fileInfo: l,
      downloadUpdateOptions: t,
      task: async (d, p) => {
        const m = hp.join(this.downloadedUpdateHelper.cacheDir, u), _ = () => (0, _l.pathExistsSync)(m) ? !t.disableDifferentialDownload : (n.info("Unable to locate previous update.zip for differential download (is this first install?), falling back to full download"), !1);
        let $ = !0;
        _() && ($ = await this.differentialDownloadInstaller(l, t, d, c, u)), $ && await this.httpExecutor.download(l.url, d, p);
      },
      done: async (d) => {
        if (!t.disableDifferentialDownload)
          try {
            const p = hp.join(this.downloadedUpdateHelper.cacheDir, u);
            await (0, _l.copyFile)(d.downloadedFile, p);
          } catch (p) {
            this._logger.warn(`Unable to copy file for caching for future differential downloads: ${p.message}`);
          }
        return this.updateDownloaded(l, d);
      }
    });
  }
  async updateDownloaded(t, r) {
    var n;
    const s = r.downloadedFile, i = (n = t.info.size) !== null && n !== void 0 ? n : (await (0, _l.stat)(s)).size, a = this._logger, o = `fileToProxy=${t.url.href}`;
    this.closeServerIfExists(), this.debug(`Creating proxy server for native Squirrel.Mac (${o})`), this.server = (0, VF.createServer)(), this.debug(`Proxy server for native Squirrel.Mac is created (${o})`), this.server.on("close", () => {
      a.info(`Proxy server for native Squirrel.Mac is closed (${o})`);
    });
    const l = (c) => {
      const u = c.address();
      return typeof u == "string" ? u : `http://127.0.0.1:${u == null ? void 0 : u.port}`;
    };
    return await new Promise((c, u) => {
      const d = (0, mp.randomBytes)(64).toString("base64").replace(/\//g, "_").replace(/\+/g, "-"), p = Buffer.from(`autoupdater:${d}`, "ascii"), m = `/${(0, mp.randomBytes)(64).toString("hex")}.zip`;
      this.server.on("request", (_, $) => {
        const v = _.url;
        if (a.info(`${v} requested`), v === "/") {
          if (!_.headers.authorization || _.headers.authorization.indexOf("Basic ") === -1) {
            $.statusCode = 401, $.statusMessage = "Invalid Authentication Credentials", $.end(), a.warn("No authenthication info");
            return;
          }
          const N = _.headers.authorization.split(" ")[1], O = Buffer.from(N, "base64").toString("ascii"), [U, q] = O.split(":");
          if (U !== "autoupdater" || q !== d) {
            $.statusCode = 401, $.statusMessage = "Invalid Authentication Credentials", $.end(), a.warn("Invalid authenthication credentials");
            return;
          }
          const B = Buffer.from(`{ "url": "${l(this.server)}${m}" }`);
          $.writeHead(200, { "Content-Type": "application/json", "Content-Length": B.length }), $.end(B);
          return;
        }
        if (!v.startsWith(m)) {
          a.warn(`${v} requested, but not supported`), $.writeHead(404), $.end();
          return;
        }
        a.info(`${m} requested by Squirrel.Mac, pipe ${s}`);
        let g = !1;
        $.on("finish", () => {
          g || (this.nativeUpdater.removeListener("error", u), c([]));
        });
        const E = (0, qF.createReadStream)(s);
        E.on("error", (N) => {
          try {
            $.end();
          } catch (O) {
            a.warn(`cannot end response: ${O}`);
          }
          g = !0, this.nativeUpdater.removeListener("error", u), u(new Error(`Cannot pipe "${s}": ${N}`));
        }), $.writeHead(200, {
          "Content-Type": "application/zip",
          "Content-Length": i
        }), E.pipe($);
      }), this.debug(`Proxy server for native Squirrel.Mac is starting to listen (${o})`), this.server.listen(0, "127.0.0.1", () => {
        this.debug(`Proxy server for native Squirrel.Mac is listening (address=${l(this.server)}, ${o})`), this.nativeUpdater.setFeedURL({
          url: l(this.server),
          headers: {
            "Cache-Control": "no-cache",
            Authorization: `Basic ${p.toString("base64")}`
          }
        }), this.dispatchUpdateDownloaded(r), this.autoInstallOnAppQuit ? (this.nativeUpdater.once("error", u), this.nativeUpdater.checkForUpdates()) : c([]);
      });
    });
  }
  handleUpdateDownloaded() {
    this.autoRunAppAfterInstall ? this.nativeUpdater.quitAndInstall() : this.app.quit(), this.closeServerIfExists();
  }
  quitAndInstall() {
    this.squirrelDownloadedUpdate ? this.handleUpdateDownloaded() : (this.nativeUpdater.on("update-downloaded", () => this.handleUpdateDownloaded()), this.autoInstallOnAppQuit || this.nativeUpdater.checkForUpdates());
  }
}
li.MacUpdater = zF;
var ci = {}, yd = {};
Object.defineProperty(yd, "__esModule", { value: !0 });
yd.verifySignature = KF;
const gp = xe, M0 = qa, GF = Va, yp = st;
function x0(e, t) {
  return ['set "PSModulePath=" & chcp 65001 >NUL & powershell.exe', ["-NoProfile", "-NonInteractive", "-InputFormat", "None", "-Command", e], {
    shell: !0,
    timeout: t
  }];
}
function KF(e, t, r) {
  return new Promise((n, s) => {
    const i = t.replace(/'/g, "''");
    r.info(`Verifying signature ${i}`), (0, M0.execFile)(...x0(`"Get-AuthenticodeSignature -LiteralPath '${i}' | ConvertTo-Json -Compress"`, 20 * 1e3), (a, o, l) => {
      var c;
      try {
        if (a != null || l) {
          vl(r, a, l, s), n(null);
          return;
        }
        const u = WF(o);
        if (u.Status === 0) {
          try {
            const _ = yp.normalize(u.Path), $ = yp.normalize(t);
            if (r.info(`LiteralPath: ${_}. Update Path: ${$}`), _ !== $) {
              vl(r, new Error(`LiteralPath of ${_} is different than ${$}`), l, s), n(null);
              return;
            }
          } catch (_) {
            r.warn(`Unable to verify LiteralPath of update asset due to missing data.Path. Skipping this step of validation. Message: ${(c = _.message) !== null && c !== void 0 ? c : _.stack}`);
          }
          const p = (0, gp.parseDn)(u.SignerCertificate.Subject);
          let m = !1;
          for (const _ of e) {
            const $ = (0, gp.parseDn)(_);
            if ($.size ? m = Array.from($.keys()).every((g) => $.get(g) === p.get(g)) : _ === p.get("CN") && (r.warn(`Signature validated using only CN ${_}. Please add your full Distinguished Name (DN) to publisherNames configuration`), m = !0), m) {
              n(null);
              return;
            }
          }
        }
        const d = `publisherNames: ${e.join(" | ")}, raw info: ` + JSON.stringify(u, (p, m) => p === "RawData" ? void 0 : m, 2);
        r.warn(`Sign verification failed, installer signed with incorrect certificate: ${d}`), n(d);
      } catch (u) {
        vl(r, u, null, s), n(null);
        return;
      }
    });
  });
}
function WF(e) {
  const t = JSON.parse(e);
  delete t.PrivateKey, delete t.IsOSBinary, delete t.SignatureType;
  const r = t.SignerCertificate;
  return r != null && (delete r.Archived, delete r.Extensions, delete r.Handle, delete r.HasPrivateKey, delete r.SubjectName), t;
}
function vl(e, t, r, n) {
  if (YF()) {
    e.warn(`Cannot execute Get-AuthenticodeSignature: ${t || r}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
    return;
  }
  try {
    (0, M0.execFileSync)(...x0("ConvertTo-Json test", 10 * 1e3));
  } catch (s) {
    e.warn(`Cannot execute ConvertTo-Json: ${s.message}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
    return;
  }
  t != null && n(t), r && n(new Error(`Cannot execute Get-AuthenticodeSignature, stderr: ${r}. Failing signature validation due to unknown stderr.`));
}
function YF() {
  const e = GF.release();
  return e.startsWith("6.") && !e.startsWith("6.3");
}
Object.defineProperty(ci, "__esModule", { value: !0 });
ci.NsisUpdater = void 0;
const aa = xe, $p = st, XF = An, JF = Pi, _p = Qr, QF = ke, ZF = Sr, eL = yd, vp = Jr;
class tL extends XF.BaseUpdater {
  constructor(t, r) {
    super(t, r), this._verifyUpdateCodeSignature = (n, s) => (0, eL.verifySignature)(n, s, this._logger);
  }
  /**
   * The verifyUpdateCodeSignature. You can pass [win-verify-signature](https://github.com/beyondkmp/win-verify-trust) or another custom verify function: ` (publisherName: string[], path: string) => Promise<string | null>`.
   * The default verify function uses [windowsExecutableCodeSignatureVerifier](https://github.com/electron-userland/electron-builder/blob/master/packages/electron-updater/src/windowsExecutableCodeSignatureVerifier.ts)
   */
  get verifyUpdateCodeSignature() {
    return this._verifyUpdateCodeSignature;
  }
  set verifyUpdateCodeSignature(t) {
    t && (this._verifyUpdateCodeSignature = t);
  }
  /*** @private */
  doDownloadUpdate(t) {
    const r = t.updateInfoAndProvider.provider, n = (0, QF.findFile)(r.resolveFiles(t.updateInfoAndProvider.info), "exe");
    return this.executeDownload({
      fileExtension: "exe",
      downloadUpdateOptions: t,
      fileInfo: n,
      task: async (s, i, a, o) => {
        const l = n.packageInfo, c = l != null && a != null;
        if (c && t.disableWebInstaller)
          throw (0, aa.newError)(`Unable to download new version ${t.updateInfoAndProvider.info.version}. Web Installers are disabled`, "ERR_UPDATER_WEB_INSTALLER_DISABLED");
        !c && !t.disableWebInstaller && this._logger.warn("disableWebInstaller is set to false, you should set it to true if you do not plan on using a web installer. This will default to true in a future version."), (c || t.disableDifferentialDownload || await this.differentialDownloadInstaller(n, t, s, r, aa.CURRENT_APP_INSTALLER_FILE_NAME)) && await this.httpExecutor.download(n.url, s, i);
        const u = await this.verifySignature(s);
        if (u != null)
          throw await o(), (0, aa.newError)(`New version ${t.updateInfoAndProvider.info.version} is not signed by the application owner: ${u}`, "ERR_UPDATER_INVALID_SIGNATURE");
        if (c && await this.differentialDownloadWebPackage(t, l, a, r))
          try {
            await this.httpExecutor.download(new vp.URL(l.path), a, {
              headers: t.requestHeaders,
              cancellationToken: t.cancellationToken,
              sha512: l.sha512
            });
          } catch (d) {
            try {
              await (0, ZF.unlink)(a);
            } catch {
            }
            throw d;
          }
      }
    });
  }
  // $certificateInfo = (Get-AuthenticodeSignature 'xxx\yyy.exe'
  // | where {$_.Status.Equals([System.Management.Automation.SignatureStatus]::Valid) -and $_.SignerCertificate.Subject.Contains("CN=siemens.com")})
  // | Out-String ; if ($certificateInfo) { exit 0 } else { exit 1 }
  async verifySignature(t) {
    let r;
    try {
      if (r = (await this.configOnDisk.value).publisherName, r == null)
        return null;
    } catch (n) {
      if (n.code === "ENOENT")
        return null;
      throw n;
    }
    return await this._verifyUpdateCodeSignature(Array.isArray(r) ? r : [r], t);
  }
  doInstall(t) {
    const r = this.installerPath;
    if (r == null)
      return this.dispatchError(new Error("No update filepath provided, can't quit and install")), !1;
    const n = ["--updated"];
    t.isSilent && n.push("/S"), t.isForceRunAfter && n.push("--force-run"), this.installDirectory && n.push(`/D=${this.installDirectory}`);
    const s = this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.packageFile;
    s != null && n.push(`--package-file=${s}`);
    const i = () => {
      this.spawnLog($p.join(process.resourcesPath, "elevate.exe"), [r].concat(n)).catch((a) => this.dispatchError(a));
    };
    return t.isAdminRightsRequired ? (this._logger.info("isAdminRightsRequired is set to true, run installer using elevate.exe"), i(), !0) : (this.spawnLog(r, n).catch((a) => {
      const o = a.code;
      this._logger.info(`Cannot run installer: error code: ${o}, error message: "${a.message}", will be executed again using elevate if EACCES, and will try to use electron.shell.openItem if ENOENT`), o === "UNKNOWN" || o === "EACCES" ? i() : o === "ENOENT" ? vr.shell.openPath(r).catch((l) => this.dispatchError(l)) : this.dispatchError(a);
    }), !0);
  }
  async differentialDownloadWebPackage(t, r, n, s) {
    if (r.blockMapSize == null)
      return !0;
    try {
      const i = {
        newUrl: new vp.URL(r.path),
        oldFile: $p.join(this.downloadedUpdateHelper.cacheDir, aa.CURRENT_APP_PACKAGE_FILE_NAME),
        logger: this._logger,
        newFile: n,
        requestHeaders: this.requestHeaders,
        isUseMultipleRangeRequest: s.isUseMultipleRangeRequest,
        cancellationToken: t.cancellationToken
      };
      this.listenerCount(_p.DOWNLOAD_PROGRESS) > 0 && (i.onProgress = (a) => this.emit(_p.DOWNLOAD_PROGRESS, a)), await new JF.FileWithEmbeddedBlockMapDifferentialDownloader(r, this.httpExecutor, i).download();
    } catch (i) {
      return this._logger.error(`Cannot download differentially, fallback to full download: ${i.stack || i}`), process.platform === "win32";
    }
    return !1;
  }
}
ci.NsisUpdater = tL;
(function(e) {
  var t = Dt && Dt.__createBinding || (Object.create ? function(v, g, E, N) {
    N === void 0 && (N = E);
    var O = Object.getOwnPropertyDescriptor(g, E);
    (!O || ("get" in O ? !g.__esModule : O.writable || O.configurable)) && (O = { enumerable: !0, get: function() {
      return g[E];
    } }), Object.defineProperty(v, N, O);
  } : function(v, g, E, N) {
    N === void 0 && (N = E), v[N] = g[E];
  }), r = Dt && Dt.__exportStar || function(v, g) {
    for (var E in v) E !== "default" && !Object.prototype.hasOwnProperty.call(g, E) && t(g, v, E);
  };
  Object.defineProperty(e, "__esModule", { value: !0 }), e.NsisUpdater = e.MacUpdater = e.RpmUpdater = e.PacmanUpdater = e.DebUpdater = e.AppImageUpdater = e.Provider = e.NoOpLogger = e.AppUpdater = e.BaseUpdater = void 0;
  const n = Sr, s = st;
  var i = An;
  Object.defineProperty(e, "BaseUpdater", { enumerable: !0, get: function() {
    return i.BaseUpdater;
  } });
  var a = Gr;
  Object.defineProperty(e, "AppUpdater", { enumerable: !0, get: function() {
    return a.AppUpdater;
  } }), Object.defineProperty(e, "NoOpLogger", { enumerable: !0, get: function() {
    return a.NoOpLogger;
  } });
  var o = ke;
  Object.defineProperty(e, "Provider", { enumerable: !0, get: function() {
    return o.Provider;
  } });
  var l = si;
  Object.defineProperty(e, "AppImageUpdater", { enumerable: !0, get: function() {
    return l.AppImageUpdater;
  } });
  var c = ii;
  Object.defineProperty(e, "DebUpdater", { enumerable: !0, get: function() {
    return c.DebUpdater;
  } });
  var u = ai;
  Object.defineProperty(e, "PacmanUpdater", { enumerable: !0, get: function() {
    return u.PacmanUpdater;
  } });
  var d = oi;
  Object.defineProperty(e, "RpmUpdater", { enumerable: !0, get: function() {
    return d.RpmUpdater;
  } });
  var p = li;
  Object.defineProperty(e, "MacUpdater", { enumerable: !0, get: function() {
    return p.MacUpdater;
  } });
  var m = ci;
  Object.defineProperty(e, "NsisUpdater", { enumerable: !0, get: function() {
    return m.NsisUpdater;
  } }), r(Qr, e);
  let _;
  function $() {
    if (process.platform === "win32")
      _ = new ci.NsisUpdater();
    else if (process.platform === "darwin")
      _ = new li.MacUpdater();
    else {
      _ = new si.AppImageUpdater();
      try {
        const v = s.join(process.resourcesPath, "package-type");
        if (!(0, n.existsSync)(v))
          return _;
        switch ((0, n.readFileSync)(v).toString().trim()) {
          case "deb":
            _ = new ii.DebUpdater();
            break;
          case "rpm":
            _ = new oi.RpmUpdater();
            break;
          case "pacman":
            _ = new ai.PacmanUpdater();
            break;
          default:
            break;
        }
      } catch (v) {
        console.warn("Unable to detect 'package-type' for autoUpdater (rpm/deb/pacman support). If you'd like to expand support, please consider contributing to electron-builder", v.message);
      }
    }
    return _;
  }
  Object.defineProperty(e, "autoUpdater", {
    enumerable: !0,
    get: () => _ || $()
  });
})(Lr);
class rL {
  constructor(t) {
    ee(this, "window", null);
    this.window = t, this.setupListeners();
  }
  setupListeners() {
    Lr.autoUpdater.on("checking-for-update", () => {
      nt("Checking for update...");
    }), Lr.autoUpdater.on("update-available", (t) => {
      var r;
      nt(`Update available: ${t.version}`), (r = this.window) == null || r.webContents.send("update-available", t);
    }), Lr.autoUpdater.on("update-not-available", (t) => {
      nt(`Update not available: ${t.version}`);
    }), Lr.autoUpdater.on("error", (t) => {
      ut("Error in auto-updater: ", t);
    }), Lr.autoUpdater.on("download-progress", (t) => {
      let r = "Download speed: " + t.bytesPerSecond;
      r = r + " - Downloaded " + t.percent + "%", r = r + " (" + t.transferred + "/" + t.total + ")", nt(r);
    }), Lr.autoUpdater.on("update-downloaded", (t) => {
      var r;
      nt("Update downloaded"), (r = this.window) == null || r.webContents.send("update-ready", t);
    });
  }
  checkForUpdates() {
    Lr.autoUpdater.checkForUpdatesAndNotify();
  }
}
const nL = Hy(import.meta.url), sL = nL("better-sqlite3"), Yn = new MO();
Yn.get("downloadPath") || Yn.set("downloadPath", wn.getPath("downloads"));
const q0 = fe.dirname(zy(import.meta.url));
process.env.APP_ROOT = fe.join(q0, "..");
const Zl = process.env.VITE_DEV_SERVER_URL, qL = fe.join(process.env.APP_ROOT, "dist-electron"), V0 = fe.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = Zl ? fe.join(process.env.APP_ROOT, "public") : V0;
let be = null;
const Ms = new e$(), iL = fe.join(wn.getPath("userData"), "downloads.db"), Ge = new sL(iL);
Ge.exec(`
  CREATE TABLE IF NOT EXISTS download_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT UNIQUE,
    save_path TEXT,
    status TEXT,
    progress INTEGER,
    title TEXT,
    season INTEGER,
    episode INTEGER,
    thumbnail TEXT,
    backdrop TEXT,
    genres TEXT,
    description TEXT,
    rating TEXT,
    source_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS series (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    thumbnail TEXT,
    backdrop TEXT,
    genres TEXT,
    rating TEXT,
    source_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS episodes (
    id TEXT PRIMARY KEY,
    series_id TEXT,
    title TEXT,
    season INTEGER,
    number INTEGER,
    download_url TEXT,
    status TEXT DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    save_path TEXT,
    source_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(series_id) REFERENCES series(id)
  );

  CREATE TABLE IF NOT EXISTS playback_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_path TEXT UNIQUE,
    last_position REAL DEFAULT 0,
    duration REAL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
try {
  Ge.exec(`
    ALTER TABLE download_history ADD COLUMN backdrop TEXT;
    ALTER TABLE download_history ADD COLUMN genres TEXT;
    ALTER TABLE download_history ADD COLUMN thumbnail TEXT;
    ALTER TABLE download_history ADD COLUMN description TEXT;
    ALTER TABLE download_history ADD COLUMN rating TEXT;
    ALTER TABLE download_history ADD COLUMN source_id TEXT;
    ALTER TABLE series ADD COLUMN backdrop TEXT;
    ALTER TABLE series ADD COLUMN genres TEXT;
  `);
} catch {
}
function aL() {
  Ve.handle("show-save-dialog", async (e, t = {}) => {
    try {
      const r = await Ld.showSaveDialog(be, {
        title: "Save Downloaded File",
        defaultPath: t.defaultPath || "downloaded_file",
        filters: [
          { name: "All Files", extensions: ["*"] },
          { name: "Videos", extensions: ["mp4", "mkv", "avi", "mov", "wmv", "flv", "webm"] },
          { name: "Images", extensions: ["jpg", "jpeg", "png", "gif", "bmp", "webp"] },
          { name: "Documents", extensions: ["pdf", "doc", "docx", "txt", "rtf"] },
          { name: "Audio", extensions: ["mp3", "wav", "flac", "aac", "m4a"] },
          { name: "Archives", extensions: ["zip", "rar", "7z", "tar", "gz"] }
        ],
        properties: ["createDirectory", "showOverwriteConfirmation"]
      });
      return {
        canceled: r.canceled,
        filePath: r.filePath || null
      };
    } catch (r) {
      return console.error("File dialog error:", r), {
        canceled: !0,
        filePath: null,
        error: r instanceof Error ? r.message : "Unknown error"
      };
    }
  }), Ve.handle("start-download", async (e, { url: t, savePath: r, metadata: n }) => {
    let s = r;
    try {
      if (!t || typeof t != "string")
        throw new Error("Invalid URL provided");
      return n && (s = t$(r, n)), nt(`Starting download: ${t} -> ${s}`), await Ms.downloadFile(t, s, (i) => {
        be && !be.isDestroyed() && be.webContents.send("download-progress", {
          url: t,
          progress: i,
          savePath: s
        });
      }), be && !be.isDestroyed() && be.webContents.send("download-complete", {
        url: t,
        savePath: s,
        success: !0
      }), Ge.prepare(`
        INSERT OR REPLACE INTO download_history (url, save_path, status, progress, title, season, episode)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        t,
        s,
        "completed",
        100,
        (n == null ? void 0 : n.seriesTitle) || (n == null ? void 0 : n.title) || null,
        (n == null ? void 0 : n.season) || null,
        (n == null ? void 0 : n.episode) || null
      ), console.log(`Download completed: ${s}`), { success: !0, message: "Download completed successfully" };
    } catch (i) {
      return console.error("Download error:", i), be && !be.isDestroyed() && be.webContents.send("download-error", {
        url: t || "unknown",
        savePath: s || "unknown",
        error: i instanceof Error ? i.message : "Unknown error"
      }), {
        success: !1,
        error: i instanceof Error ? i.message : "Unknown error"
      };
    }
  }), Ve.handle("pause-download", async (e, { url: t }) => {
    try {
      return await Ms.stopDownload(t) ? (Ge.prepare("UPDATE download_history SET status = 'paused' WHERE url = ?").run(t), { success: !0 }) : { success: !1, error: "Download not found or already stopped" };
    } catch (r) {
      return ut("Pause download error", r), { success: !1, error: r instanceof Error ? r.message : "Unknown error" };
    }
  }), Ve.handle("cancel-download", async (e, { url: t }) => {
    try {
      return await Ms.stopDownload(t), Ge.prepare("DELETE FROM download_history WHERE url = ?").run(t), Ge.prepare("DELETE FROM episodes WHERE download_url = ?").run(t), { success: !0 };
    } catch (r) {
      return ut("Cancel download error", r), { success: !1, error: r instanceof Error ? r.message : "Unknown error" };
    }
  }), Ve.handle("get-settings", () => Yn.store), Ve.handle("set-setting", (e, { key: t, value: r }) => {
    Yn.set(t, r);
  }), Ve.handle("select-directory", async () => {
    if (!be) return null;
    const e = await Ld.showOpenDialog(be, {
      properties: ["openDirectory"]
    });
    return e.canceled ? null : e.filePaths[0];
  }), Ve.handle("get-download-history", () => {
    try {
      return Ge.prepare("SELECT * FROM download_history ORDER BY created_at DESC").all();
    } catch (e) {
      return console.error("Failed to get history:", e), [];
    }
  }), Ve.handle("bulk-insert-episodes", async (e, { series: t, episodes: r, sourceId: n }) => {
    const s = Yn.get("tmdbApiKey"), i = Yn.get("omdbApiKey");
    Xo.setKeys(s || process.env.TMDB_API_KEY, i || process.env.OMDB_API_KEY), Xo.enrich(t.title).then((c) => {
      c && (Ge.prepare(`
          UPDATE series 
          SET description = ?, thumbnail = ?, backdrop = ?, genres = ?, rating = ?
          WHERE id = ?
        `).run(
        c.description || t.description,
        c.thumbnail || t.thumbnail,
        c.backdrop,
        JSON.stringify(c.genres),
        c.rating || t.rating,
        t.id
      ), nt(`Enriched database entry for series: ${t.title}`));
    });
    const a = Ge.prepare(`
      INSERT OR REPLACE INTO series (id, title, description, thumbnail, rating, source_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `), o = Ge.prepare(`
      INSERT OR REPLACE INTO episodes (id, series_id, title, season, number, download_url, source_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `), l = Ge.transaction((c, u) => {
      a.run(
        c.id,
        c.title,
        c.description,
        c.thumbnail,
        c.rating,
        n
      );
      for (const d of u)
        o.run(
          d.id,
          c.id,
          d.title,
          d.season,
          d.number,
          d.downloadUrl,
          n
        );
    });
    try {
      return l(t, r), { success: !0 };
    } catch (c) {
      return ut("Failed to bulk insert episodes", c), {
        success: !1,
        error: c instanceof Error ? c.message : "Unknown error"
      };
    }
  }), Ve.handle("save-download-record", async (e, t) => {
    try {
      const { url: r, save_path: n, status: s, progress: i, title: a, season: o, episode: l, thumbnail: c, description: u, rating: d, source_id: p } = t;
      return Xo.enrich(a).then((_) => {
        _ && Ge.prepare(`
            UPDATE download_history 
            SET backdrop = ?, genres = ?, description = ?, thumbnail = ?, rating = ?
            WHERE url = ?
          `).run(
          _.backdrop,
          JSON.stringify(_.genres),
          _.description || u,
          _.thumbnail || c,
          _.rating || d,
          r
        );
      }), Ge.prepare(
        "INSERT OR REPLACE INTO download_history (url, save_path, status, progress, title, season, episode, thumbnail, description, rating, source_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).run(r, n, s, i, a, o, l, c, u, d, p), { success: !0 };
    } catch (r) {
      return ut("Failed to save download record", r), {
        success: !1,
        error: r instanceof Error ? r.message : "Unknown error"
      };
    }
  }), Ve.handle("play-file", async (e, t) => {
    try {
      const r = Ge.prepare("SELECT last_position FROM playback_history WHERE file_path = ?").get(t), n = (r == null ? void 0 : r.last_position) || 0;
      return nt(`Opening file: ${t} at ${n}s`), ZO.playFile(t, n).then(() => {
        nt(`Playback finished for ${t}`);
      }), { success: !0 };
    } catch (r) {
      return ut("Failed to play file", r), { success: !1, error: r instanceof Error ? r.message : "Unknown error" };
    }
  }), Ve.handle("get-playback-position", (e, t) => {
    const r = Ge.prepare("SELECT last_position FROM playback_history WHERE file_path = ?").get(t);
    return (r == null ? void 0 : r.last_position) || 0;
  }), Ve.handle("update-playback-position", (e, { filePath: t, position: r, duration: n }) => (Ge.prepare("INSERT OR REPLACE INTO playback_history (file_path, last_position, duration, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)").run(t, r, n), { success: !0 })), Ve.handle("set-max-speed", (e, t) => {
    Ms.setMaxSpeed(t);
  }), Ve.handle("search-sources", async (e, t) => {
    try {
      return await Qi.searchAll(t);
    } catch (r) {
      return ut("IPC Search sources failed", r), [];
    }
  }), Ve.handle("get-season-links", async (e, { sourceId: t, seriesId: r }) => {
    try {
      const n = Qi.getSource(t);
      if (!n) throw new Error(`Source ${t} not found`);
      return await n.getSeasonLinks(r);
    } catch (n) {
      return ut(`IPC get-season-links failed for ${t}`, n), [];
    }
  }), Ve.handle("get-episodes", async (e, { sourceId: t, seriesId: r, seasonNumber: n }) => {
    try {
      const s = Qi.getSource(t);
      if (!s) throw new Error(`Source ${t} not found`);
      return await s.getEpisodes(r, n);
    } catch (s) {
      return ut(`IPC get-episodes failed for ${t}`, s), [];
    }
  }), Ve.handle("get-source-download-url", async (e, { sourceId: t, episodeId: r }) => {
    try {
      const n = Qi.getSource(t);
      if (!n) throw new Error(`Source ${t} not found`);
      return await n.getDownloadUrl(r);
    } catch (n) {
      throw ut(`IPC get-download-url failed for ${t}`, n), n;
    }
  });
}
async function oL() {
  try {
    const e = Ge.prepare("SELECT * FROM episodes WHERE status = 'pending' OR status = 'downloading'").all();
    nt(`Auto-resume: Found ${e.length} pending tasks.`);
    for (const t of e)
      Ms.downloadFile(t.download_url, t.save_path, (r) => {
        be && !be.isDestroyed() && be.webContents.send("download-progress", {
          url: t.download_url,
          progress: r,
          savePath: t.save_path
        });
      });
  } catch (e) {
    ut("Auto-resume failed", e);
  }
}
function B0() {
  be = new wp({
    width: 1200,
    height: 800,
    icon: fe.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: fe.join(q0, "preload.mjs"),
      nodeIntegration: !1,
      contextIsolation: !0
    }
  }), be.webContents.on("did-finish-load", () => {
    be == null || be.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString()), new rL(be).checkForUpdates();
  }), (() => {
    Ep.setApplicationMenu(null);
  })(), Zl ? (be.loadURL(Zl), be.webContents.openDevTools()) : be.loadFile(fe.join(V0, "index.html"));
}
wn.on("window-all-closed", () => {
  process.platform !== "darwin" && (wn.quit(), be = null);
});
wn.on("activate", () => {
  wp.getAllWindows().length === 0 && B0();
});
wn.whenReady().then(() => {
  Ep.setApplicationMenu(null), aL(), B0(), oL();
});
export {
  qL as MAIN_DIST,
  V0 as RENDERER_DIST,
  Zl as VITE_DEV_SERVER_URL
};
