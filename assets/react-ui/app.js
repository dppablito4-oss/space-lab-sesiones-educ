// \0rolldown/runtime.js
var e = Object.create, t = Object.defineProperty, n = Object.getOwnPropertyDescriptor, r = Object.getOwnPropertyNames, i = Object.getPrototypeOf, a = Object.prototype.hasOwnProperty, o = (e, t) => () => (t || (e((t = { exports: {} }).exports, t, t.exports), e = null), t.exports), s = (e, i, o, s) => {
	if (i && typeof i == "object" || typeof i == "function") for (var c = r(i), l = 0, u = c.length, d; l < u; l++) d = c[l], !a.call(e, d) && d !== o && t(e, d, {
		get: ((e) => i[e]).bind(null, d),
		enumerable: !(s = n(i, d)) || s.enumerable
	});
	return e;
}, c = (n, r, o) => (o = n == null ? {} : e(i(n)), s(r || !n || !n.__esModule || !a.call(n, "default") ? t(o, "default", {
	value: n,
	enumerable: !0
}) : o, n)), l = /* @__PURE__ */ o(((e) => {
	function t(e, t) {
		var n = e.length;
		e.push(t);
		a: for (; 0 < n;) {
			var r = n - 1 >>> 1, a = e[r];
			if (0 < i(a, t)) e[r] = t, e[n] = a, n = r;
			else break a;
		}
	}
	function n(e) {
		return e.length === 0 ? null : e[0];
	}
	function r(e) {
		if (e.length === 0) return null;
		var t = e[0], n = e.pop();
		if (n !== t) {
			e[0] = n;
			a: for (var r = 0, a = e.length, o = a >>> 1; r < o;) {
				var s = 2 * (r + 1) - 1, c = e[s], l = s + 1, u = e[l];
				if (0 > i(c, n)) l < a && 0 > i(u, c) ? (e[r] = u, e[l] = n, r = l) : (e[r] = c, e[s] = n, r = s);
				else if (l < a && 0 > i(u, n)) e[r] = u, e[l] = n, r = l;
				else break a;
			}
		}
		return t;
	}
	function i(e, t) {
		var n = e.sortIndex - t.sortIndex;
		return n === 0 ? e.id - t.id : n;
	}
	if (e.unstable_now = void 0, typeof performance == "object" && typeof performance.now == "function") {
		var a = performance;
		e.unstable_now = function() {
			return a.now();
		};
	} else {
		var o = Date, s = o.now();
		e.unstable_now = function() {
			return o.now() - s;
		};
	}
	var c = [], l = [], u = 1, d = null, f = 3, p = !1, m = !1, h = !1, g = !1, _ = typeof setTimeout == "function" ? setTimeout : null, v = typeof clearTimeout == "function" ? clearTimeout : null, y = typeof setImmediate < "u" ? setImmediate : null;
	function b(e) {
		for (var i = n(l); i !== null;) {
			if (i.callback === null) r(l);
			else if (i.startTime <= e) r(l), i.sortIndex = i.expirationTime, t(c, i);
			else break;
			i = n(l);
		}
	}
	function ee(e) {
		if (h = !1, b(e), !m) {
			if (n(c) !== null) m = !0, x || (x = !0, ie());
			else {
				var t = n(l);
				t !== null && w(ee, t.startTime - e);
			}
		}
	}
	var x = !1, te = -1, ne = 5, S = -1;
	function re() {
		return g ? !0 : !(e.unstable_now() - S < ne);
	}
	function C() {
		if (g = !1, x) {
			var t = e.unstable_now();
			S = t;
			var i = !0;
			try {
				a: {
					m = !1, h && (h = !1, v(te), te = -1), p = !0;
					var a = f;
					try {
						b: {
							for (b(t), d = n(c); d !== null && !(d.expirationTime > t && re());) {
								var o = d.callback;
								if (typeof o == "function") {
									d.callback = null, f = d.priorityLevel;
									var s = o(d.expirationTime <= t);
									if (t = e.unstable_now(), typeof s == "function") {
										d.callback = s, b(t), i = !0;
										break b;
									}
									d === n(c) && r(c), b(t);
								} else r(c);
								d = n(c);
							}
							if (d !== null) i = !0;
							else {
								var u = n(l);
								u !== null && w(ee, u.startTime - t), i = !1;
							}
						}
						break a;
					} finally {
						d = null, f = a, p = !1;
					}
					i = void 0;
				}
			} finally {
				i ? ie() : x = !1;
			}
		}
	}
	var ie;
	if (typeof y == "function") ie = function() {
		y(C);
	};
	else if (typeof MessageChannel < "u") {
		var ae = new MessageChannel(), oe = ae.port2;
		ae.port1.onmessage = C, ie = function() {
			oe.postMessage(null);
		};
	} else ie = function() {
		_(C, 0);
	};
	function w(t, n) {
		te = _(function() {
			t(e.unstable_now());
		}, n);
	}
	e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(e) {
		e.callback = null;
	}, e.unstable_forceFrameRate = function(e) {
		0 > e || 125 < e ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : ne = 0 < e ? Math.floor(1e3 / e) : 5;
	}, e.unstable_getCurrentPriorityLevel = function() {
		return f;
	}, e.unstable_next = function(e) {
		switch (f) {
			case 1:
			case 2:
			case 3:
				var t = 3;
				break;
			default: t = f;
		}
		var n = f;
		f = t;
		try {
			return e();
		} finally {
			f = n;
		}
	}, e.unstable_requestPaint = function() {
		g = !0;
	}, e.unstable_runWithPriority = function(e, t) {
		switch (e) {
			case 1:
			case 2:
			case 3:
			case 4:
			case 5: break;
			default: e = 3;
		}
		var n = f;
		f = e;
		try {
			return t();
		} finally {
			f = n;
		}
	}, e.unstable_scheduleCallback = function(r, i, a) {
		var o = e.unstable_now();
		switch (typeof a == "object" && a ? (a = a.delay, a = typeof a == "number" && 0 < a ? o + a : o) : a = o, r) {
			case 1:
				var s = -1;
				break;
			case 2:
				s = 250;
				break;
			case 5:
				s = 1073741823;
				break;
			case 4:
				s = 1e4;
				break;
			default: s = 5e3;
		}
		return s = a + s, r = {
			id: u++,
			callback: i,
			priorityLevel: r,
			startTime: a,
			expirationTime: s,
			sortIndex: -1
		}, a > o ? (r.sortIndex = a, t(l, r), n(c) === null && r === n(l) && (h ? (v(te), te = -1) : h = !0, w(ee, a - o))) : (r.sortIndex = s, t(c, r), m || p || (m = !0, x || (x = !0, ie()))), r;
	}, e.unstable_shouldYield = re, e.unstable_wrapCallback = function(e) {
		var t = f;
		return function() {
			var n = f;
			f = t;
			try {
				return e.apply(this, arguments);
			} finally {
				f = n;
			}
		};
	};
})), u = /* @__PURE__ */ o(((e, t) => {
	t.exports = l();
})), d = /* @__PURE__ */ o(((e) => {
	var t = Symbol.for("react.transitional.element"), n = Symbol.for("react.portal"), r = Symbol.for("react.fragment"), i = Symbol.for("react.strict_mode"), a = Symbol.for("react.profiler"), o = Symbol.for("react.consumer"), s = Symbol.for("react.context"), c = Symbol.for("react.forward_ref"), l = Symbol.for("react.suspense"), u = Symbol.for("react.memo"), d = Symbol.for("react.lazy"), f = Symbol.for("react.activity"), p = Symbol.for("react.view_transition"), m = Symbol.iterator;
	function h(e) {
		return typeof e != "object" || !e ? null : (e = m && e[m] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var g = {
		isMounted: function() {
			return !1;
		},
		enqueueForceUpdate: function() {},
		enqueueReplaceState: function() {},
		enqueueSetState: function() {}
	}, _ = Object.assign, v = {};
	function y(e, t, n) {
		this.props = e, this.context = t, this.refs = v, this.updater = n || g;
	}
	y.prototype.isReactComponent = {}, y.prototype.setState = function(e, t) {
		if (typeof e != "object" && typeof e != "function" && e != null) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
		this.updater.enqueueSetState(this, e, t, "setState");
	}, y.prototype.forceUpdate = function(e) {
		this.updater.enqueueForceUpdate(this, e, "forceUpdate");
	};
	function b() {}
	b.prototype = y.prototype;
	function ee(e, t, n) {
		this.props = e, this.context = t, this.refs = v, this.updater = n || g;
	}
	var x = ee.prototype = new b();
	x.constructor = ee, _(x, y.prototype), x.isPureReactComponent = !0;
	var te = Array.isArray;
	function ne() {}
	var S = {
		H: null,
		A: null,
		T: null,
		S: null
	}, re = Object.prototype.hasOwnProperty;
	function C(e, n, r) {
		var i = r.ref;
		return {
			$$typeof: t,
			type: e,
			key: n,
			ref: i === void 0 ? null : i,
			props: r
		};
	}
	function ie(e, t) {
		return C(e.type, t, e.props);
	}
	function ae(e) {
		return typeof e == "object" && !!e && e.$$typeof === t;
	}
	function oe(e) {
		var t = {
			"=": "=0",
			":": "=2"
		};
		return "$" + e.replace(/[=:]/g, function(e) {
			return t[e];
		});
	}
	var w = /\/+/g;
	function se(e, t) {
		return typeof e == "object" && e && e.key != null ? oe("" + e.key) : t.toString(36);
	}
	function T(e) {
		switch (e.status) {
			case "fulfilled": return e.value;
			case "rejected": throw e.reason;
			default: switch (typeof e.status == "string" ? e.then(ne, ne) : (e.status = "pending", e.then(function(t) {
				e.status === "pending" && (e.status = "fulfilled", e.value = t);
			}, function(t) {
				e.status === "pending" && (e.status = "rejected", e.reason = t);
			})), e.status) {
				case "fulfilled": return e.value;
				case "rejected": throw e.reason;
			}
		}
		throw e;
	}
	function ce(e, r, i, a, o) {
		var s = typeof e;
		(s === "undefined" || s === "boolean") && (e = null);
		var c = !1;
		if (e === null) c = !0;
		else switch (s) {
			case "bigint":
			case "string":
			case "number":
				c = !0;
				break;
			case "object": switch (e.$$typeof) {
				case t:
				case n:
					c = !0;
					break;
				case d: return c = e._init, ce(c(e._payload), r, i, a, o);
			}
		}
		if (c) return o = o(e), c = a === "" ? "." + se(e, 0) : a, te(o) ? (i = "", c != null && (i = c.replace(w, "$&/") + "/"), ce(o, r, i, "", function(e) {
			return e;
		})) : o != null && (ae(o) && (o = ie(o, i + (o.key == null || e && e.key === o.key ? "" : ("" + o.key).replace(w, "$&/") + "/") + c)), r.push(o)), 1;
		c = 0;
		var l = a === "" ? "." : a + ":";
		if (te(e)) for (var u = 0; u < e.length; u++) a = e[u], s = l + se(a, u), c += ce(a, r, i, s, o);
		else if (u = h(e), typeof u == "function") for (e = u.call(e), u = 0; !(a = e.next()).done;) a = a.value, s = l + se(a, u++), c += ce(a, r, i, s, o);
		else if (s === "object") {
			if (typeof e.then == "function") return ce(T(e), r, i, a, o);
			throw r = String(e), Error("Objects are not valid as a React child (found: " + (r === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : r) + "). If you meant to render a collection of children, use an array instead.");
		}
		return c;
	}
	function E(e, t, n) {
		if (e == null) return e;
		var r = [], i = 0;
		return ce(e, r, "", "", function(e) {
			return t.call(n, e, i++);
		}), r;
	}
	function le(e) {
		if (e._status === -1) {
			var t = e._result, n = t();
			n.then(function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 1, e._result = t, n.status === void 0 && (n.status = "fulfilled", n.value = t));
			}, function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 2, e._result = t, n.status === void 0 && (n.status = "rejected", n.reason = t));
			}), e._status === -1 && (e._status = 0, e._result = n);
		}
		if (e._status === 1) return e._result.default;
		throw e._result;
	}
	var ue = typeof reportError == "function" ? reportError : function(e) {
		if (typeof window == "object" && typeof window.ErrorEvent == "function") {
			var t = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: typeof e == "object" && e && typeof e.message == "string" ? String(e.message) : String(e),
				error: e
			});
			if (!window.dispatchEvent(t)) return;
		} else if (typeof process == "object" && typeof process.emit == "function") {
			process.emit("uncaughtException", e);
			return;
		}
		console.error(e);
	};
	function de(e) {
		var t = S.T, n = {};
		n.types = t === null ? null : t.types, S.T = n;
		try {
			var r = e(), i = S.S;
			i !== null && i(n, r), typeof r == "object" && r && typeof r.then == "function" && r.then(ne, ue);
		} catch (e) {
			ue(e);
		} finally {
			t !== null && n.types !== null && (t.types = n.types), S.T = t;
		}
	}
	function fe(e) {
		var t = S.T;
		if (t !== null) {
			var n = t.types;
			n === null ? t.types = [e] : n.indexOf(e) === -1 && n.push(e);
		} else de(fe.bind(null, e));
	}
	var pe = {
		map: E,
		forEach: function(e, t, n) {
			E(e, function() {
				t.apply(this, arguments);
			}, n);
		},
		count: function(e) {
			var t = 0;
			return E(e, function() {
				t++;
			}), t;
		},
		toArray: function(e) {
			return E(e, function(e) {
				return e;
			}) || [];
		},
		only: function(e) {
			if (!ae(e)) throw Error("React.Children.only expected to receive a single React element child.");
			return e;
		}
	};
	e.Activity = f, e.Children = pe, e.Component = y, e.Fragment = r, e.Profiler = a, e.PureComponent = ee, e.StrictMode = i, e.Suspense = l, e.ViewTransition = p, e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = S, e.__COMPILER_RUNTIME = {
		__proto__: null,
		c: function(e) {
			return S.H.useMemoCache(e);
		}
	}, e.addTransitionType = fe, e.cache = function(e) {
		return function() {
			return e.apply(null, arguments);
		};
	}, e.cacheSignal = function() {
		return null;
	}, e.cloneElement = function(e, t, n) {
		if (e == null) throw Error("The argument must be a React element, but you passed " + e + ".");
		var r = _({}, e.props), i = e.key;
		if (t != null) for (a in t.key !== void 0 && (i = "" + t.key), t) !re.call(t, a) || a === "key" || a === "__self" || a === "__source" || a === "ref" && t.ref === void 0 || (r[a] = t[a]);
		var a = arguments.length - 2;
		if (a === 1) r.children = n;
		else if (1 < a) {
			for (var o = Array(a), s = 0; s < a; s++) o[s] = arguments[s + 2];
			r.children = o;
		}
		return C(e.type, i, r);
	}, e.createContext = function(e) {
		return e = {
			$$typeof: s,
			_currentValue: e,
			_currentValue2: e,
			_threadCount: 0,
			Provider: null,
			Consumer: null
		}, e.Provider = e, e.Consumer = {
			$$typeof: o,
			_context: e
		}, e;
	}, e.createElement = function(e, t, n) {
		var r, i = {}, a = null;
		if (t != null) for (r in t.key !== void 0 && (a = "" + t.key), t) re.call(t, r) && r !== "key" && r !== "__self" && r !== "__source" && (i[r] = t[r]);
		var o = arguments.length - 2;
		if (o === 1) i.children = n;
		else if (1 < o) {
			for (var s = Array(o), c = 0; c < o; c++) s[c] = arguments[c + 2];
			i.children = s;
		}
		if (e && e.defaultProps) for (r in o = e.defaultProps, o) i[r] === void 0 && (i[r] = o[r]);
		return C(e, a, i);
	}, e.createRef = function() {
		return { current: null };
	}, e.forwardRef = function(e) {
		return {
			$$typeof: c,
			render: e
		};
	}, e.isValidElement = ae, e.lazy = function(e) {
		return {
			$$typeof: d,
			_payload: {
				_status: -1,
				_result: e
			},
			_init: le
		};
	}, e.memo = function(e, t) {
		return {
			$$typeof: u,
			type: e,
			compare: t === void 0 ? null : t
		};
	}, e.startTransition = de, e.unstable_useCacheRefresh = function() {
		return S.H.useCacheRefresh();
	}, e.use = function(e) {
		return S.H.use(e);
	}, e.useActionState = function(e, t, n) {
		return S.H.useActionState(e, t, n);
	}, e.useCallback = function(e, t) {
		return S.H.useCallback(e, t);
	}, e.useContext = function(e) {
		return S.H.useContext(e);
	}, e.useDebugValue = function() {}, e.useDeferredValue = function(e, t) {
		return S.H.useDeferredValue(e, t);
	}, e.useEffect = function(e, t) {
		return S.H.useEffect(e, t);
	}, e.useEffectEvent = function(e) {
		return S.H.useEffectEvent(e);
	}, e.useId = function() {
		return S.H.useId();
	}, e.useImperativeHandle = function(e, t, n) {
		return S.H.useImperativeHandle(e, t, n);
	}, e.useInsertionEffect = function(e, t) {
		return S.H.useInsertionEffect(e, t);
	}, e.useLayoutEffect = function(e, t) {
		return S.H.useLayoutEffect(e, t);
	}, e.useMemo = function(e, t) {
		return S.H.useMemo(e, t);
	}, e.useOptimistic = function(e, t) {
		return S.H.useOptimistic(e, t);
	}, e.useReducer = function(e, t, n) {
		return S.H.useReducer(e, t, n);
	}, e.useRef = function(e) {
		return S.H.useRef(e);
	}, e.useState = function(e) {
		return S.H.useState(e);
	}, e.useSyncExternalStore = function(e, t, n) {
		return S.H.useSyncExternalStore(e, t, n);
	}, e.useTransition = function() {
		return S.H.useTransition();
	}, e.version = "19.3.1";
})), f = /* @__PURE__ */ o(((e, t) => {
	t.exports = d();
})), p = /* @__PURE__ */ o(((e) => {
	var t = f();
	function n(e) {
		var t = "https://react.dev/errors/" + e;
		if (1 < arguments.length) {
			t += "?args[]=" + encodeURIComponent(arguments[1]);
			for (var n = 2; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
		}
		return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
	}
	function r() {}
	var i = {
		d: {
			f: r,
			r: function() {
				throw Error(n(522));
			},
			D: r,
			C: r,
			L: r,
			m: r,
			X: r,
			S: r,
			M: r
		},
		p: 0,
		findDOMNode: null
	}, a = Symbol.for("react.portal"), o = Symbol.for("react.recoverable"), s = Symbol.for("react.optimistic_key");
	function c(e, t, n) {
		var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
		return {
			$$typeof: a,
			key: r == null ? null : r === s ? s : "" + r,
			children: e,
			containerInfo: t,
			implementation: n
		};
	}
	var l = t.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
	function u(e, t) {
		if (e === "font") return "";
		if (typeof t == "string") return t === "use-credentials" ? t : "";
	}
	e.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = i, e.browser = function(e) {
		return {
			$$typeof: o,
			_reason: e
		};
	}, e.createPortal = function(e, t) {
		var r = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
		if (!t || t.nodeType !== 1 && t.nodeType !== 9 && t.nodeType !== 11) throw Error(n(299));
		return c(e, t, null, r);
	}, e.flushSync = function(e) {
		var t = l.T, n = i.p;
		try {
			if (l.T = null, i.p = 2, e) return e();
		} finally {
			l.T = t, i.p = n, i.d.f();
		}
	}, e.preconnect = function(e, t) {
		typeof e == "string" && (t ? (t = t.crossOrigin, t = typeof t == "string" ? t === "use-credentials" ? t : "" : void 0) : t = null, i.d.C(e, t));
	}, e.prefetchDNS = function(e) {
		typeof e == "string" && i.d.D(e);
	}, e.preinit = function(e, t) {
		if (typeof e == "string" && t && typeof t.as == "string") {
			var n = t.as, r = u(n, t.crossOrigin), a = typeof t.integrity == "string" ? t.integrity : void 0, o = typeof t.fetchPriority == "string" ? t.fetchPriority : void 0;
			n === "style" ? i.d.S(e, typeof t.precedence == "string" ? t.precedence : void 0, {
				crossOrigin: r,
				integrity: a,
				fetchPriority: o
			}) : n === "script" && i.d.X(e, {
				crossOrigin: r,
				integrity: a,
				fetchPriority: o,
				nonce: typeof t.nonce == "string" ? t.nonce : void 0
			});
		}
	}, e.preinitModule = function(e, t) {
		if (typeof e == "string") {
			if (typeof t == "object" && t) {
				if (t.as == null || t.as === "script") {
					var n = u(t.as, t.crossOrigin);
					i.d.M(e, {
						crossOrigin: n,
						integrity: typeof t.integrity == "string" ? t.integrity : void 0,
						nonce: typeof t.nonce == "string" ? t.nonce : void 0,
						fetchPriority: typeof t.fetchPriority == "string" ? t.fetchPriority : void 0
					});
				}
			} else t ?? i.d.M(e);
		}
	}, e.preload = function(e, t) {
		if (typeof e == "string" && typeof t == "object" && t && typeof t.as == "string") {
			var n = t.as, r = u(n, t.crossOrigin);
			i.d.L(e, n, {
				crossOrigin: r,
				integrity: typeof t.integrity == "string" ? t.integrity : void 0,
				nonce: typeof t.nonce == "string" ? t.nonce : void 0,
				type: typeof t.type == "string" ? t.type : void 0,
				fetchPriority: typeof t.fetchPriority == "string" ? t.fetchPriority : void 0,
				referrerPolicy: typeof t.referrerPolicy == "string" ? t.referrerPolicy : void 0,
				imageSrcSet: typeof t.imageSrcSet == "string" ? t.imageSrcSet : void 0,
				imageSizes: typeof t.imageSizes == "string" ? t.imageSizes : void 0,
				media: typeof t.media == "string" ? t.media : void 0
			});
		}
	}, e.preloadModule = function(e, t) {
		if (typeof e == "string") {
			if (t) {
				var n = u(t.as, t.crossOrigin);
				i.d.m(e, {
					as: typeof t.as == "string" && t.as !== "script" ? t.as : void 0,
					crossOrigin: n,
					integrity: typeof t.integrity == "string" ? t.integrity : void 0,
					nonce: typeof t.nonce == "string" ? t.nonce : void 0,
					fetchPriority: typeof t.fetchPriority == "string" ? t.fetchPriority : void 0
				});
			} else i.d.m(e);
		}
	}, e.requestFormReset = function(e) {
		i.d.r(e);
	}, e.unstable_batchedUpdates = function(e, t) {
		return e(t);
	}, e.useFormState = function(e, t, n) {
		return l.H.useFormState(e, t, n);
	}, e.useFormStatus = function() {
		return l.H.useHostTransitionStatus();
	}, e.version = "19.3.1";
})), m = /* @__PURE__ */ o(((e, t) => {
	function n() {
		if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE == "function") try {
			__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
		} catch (e) {
			console.error(e);
		}
	}
	n(), t.exports = p();
})), h = /* @__PURE__ */ o(((e) => {
	var t = u(), n = f(), r = m();
	function i(e) {
		var t = "https://react.dev/errors/" + e;
		if (1 < arguments.length) {
			t += "?args[]=" + encodeURIComponent(arguments[1]);
			for (var n = 2; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
		}
		return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
	}
	function a(e) {
		return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
	}
	function o(e) {
		for (var t = e, n = t; n && !n.alternate;) t = n, t.flags & 4098 && (e = t.return), n = t.return;
		for (; t.return;) t = t.return;
		return t.tag === 3 ? e : null;
	}
	function s(e) {
		if (e.tag === 13) {
			var t = e.memoizedState;
			if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
		}
		return null;
	}
	function c(e) {
		if (e.tag === 31) {
			var t = e.memoizedState;
			if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
		}
		return null;
	}
	function l(e) {
		if (o(e) !== e) throw Error(i(188));
	}
	function d(e) {
		var t = e.alternate;
		if (!t) {
			if (t = o(e), t === null) throw Error(i(188));
			return t === e ? e : null;
		}
		for (var n = e, r = t;;) {
			var a = n.return;
			if (a === null) break;
			var s = a.alternate;
			if (s === null) {
				if (r = a.return, r !== null) {
					n = r;
					continue;
				}
				break;
			}
			if (a.child === s.child) {
				for (s = a.child; s;) {
					if (s === n) return l(a), e;
					if (s === r) return l(a), t;
					s = s.sibling;
				}
				throw Error(i(188));
			}
			if (n.return !== r.return) n = a, r = s;
			else {
				for (var c = !1, u = a.child; u;) {
					if (u === n) {
						c = !0, n = a, r = s;
						break;
					}
					if (u === r) {
						c = !0, r = a, n = s;
						break;
					}
					u = u.sibling;
				}
				if (!c) {
					for (u = s.child; u;) {
						if (u === n) {
							c = !0, n = s, r = a;
							break;
						}
						if (u === r) {
							c = !0, r = s, n = a;
							break;
						}
						u = u.sibling;
					}
					if (!c) throw Error(i(189));
				}
			}
			if (n.alternate !== r) throw Error(i(190));
		}
		if (n.tag !== 3) throw Error(i(188));
		return n.stateNode.current === n ? e : t;
	}
	function p(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e;
		for (e = e.child; e !== null;) {
			if (t = p(e), t !== null) return t;
			e = e.sibling;
		}
		return null;
	}
	function h(e, t, n, r, i, a) {
		for (; e !== null;) {
			if ((e.tag === 5 || e.tag === 27 || e.tag === 6) && n(e, r, i, a) || (e.tag !== 22 || e.memoizedState === null) && (t || e.tag !== 5 && e.tag !== 27) && h(e.child, t, n, r, i, a)) return !0;
			e = e.sibling;
		}
		return !1;
	}
	function g(e) {
		for (e = e.return; e !== null;) {
			if (e.tag === 3 || e.tag === 5 || e.tag === 27) return e;
			e = e.return;
		}
		return null;
	}
	function _(e) {
		var t = !1;
		for (e = e.return; e !== null && (e.tag === 4 && (t = !0), e.tag !== 3 && e.tag !== 5 && e.tag !== 27);) e = e.return;
		return t;
	}
	function v(e) {
		var t = [null, null], n = g(e);
		return n === null || y(t, e, n.child, { foundSelf: !1 }), t;
	}
	function y(e, t, n, r) {
		for (; n !== null;) {
			if (n === t) r.foundSelf = !0;
			else if (n.tag === 5 || n.tag === 27 || n.tag === 6) {
				if (r.foundSelf) return e[1] = n, !0;
				e[0] = n;
			} else if ((n.tag !== 22 || n.memoizedState === null) && y(e, t, n.child, r)) return !0;
			n = n.sibling;
		}
		return !1;
	}
	function b(e) {
		switch (e.tag) {
			case 5:
			case 27:
			case 6: return e.stateNode;
			case 3: return e.stateNode.containerInfo;
			default: throw Error(i(559));
		}
	}
	var ee = null, x = null;
	function te(e, t, n) {
		return e === n || e === t && (ee = e, !0);
	}
	function ne(e, t, n) {
		return e === n ? (x = e, !1) : e === t && (x !== null && (ee = e), !0);
	}
	function S(e) {
		if (e === null) return null;
		do
			e = e === null ? null : e.return;
		while (e && e.tag !== 5 && e.tag !== 27 && e.tag !== 3);
		return e || null;
	}
	function re(e, t, n) {
		for (var r = 0, i = e; i; i = n(i)) r++;
		i = 0;
		for (var a = t; a; a = n(a)) i++;
		for (; 0 < r - i;) e = n(e), r--;
		for (; 0 < i - r;) t = n(t), i--;
		for (; r--;) {
			if (e === t || t !== null && e === t.alternate) return e;
			e = n(e), t = n(t);
		}
		return null;
	}
	var C = Object.assign, ie = Symbol.for("react.element"), ae = Symbol.for("react.transitional.element"), oe = Symbol.for("react.portal"), w = Symbol.for("react.fragment"), se = Symbol.for("react.strict_mode"), T = Symbol.for("react.profiler"), ce = Symbol.for("react.consumer"), E = Symbol.for("react.context"), le = Symbol.for("react.forward_ref"), ue = Symbol.for("react.suspense"), de = Symbol.for("react.suspense_list"), fe = Symbol.for("react.memo"), pe = Symbol.for("react.lazy"), me = Symbol.for("react.activity"), he = Symbol.for("react.legacy_hidden"), ge = Symbol.for("react.memo_cache_sentinel"), _e = Symbol.for("react.view_transition"), ve = Symbol.for("react.recoverable"), ye = Symbol.iterator;
	function be(e) {
		return typeof e != "object" || !e ? null : (e = ye && e[ye] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var xe = Symbol.for("react.client.reference");
	function Se(e) {
		if (e == null) return null;
		if (typeof e == "function") return e.$$typeof === xe ? null : e.displayName || e.name || null;
		if (typeof e == "string") return e;
		switch (e) {
			case w: return "Fragment";
			case T: return "Profiler";
			case se: return "StrictMode";
			case ue: return "Suspense";
			case de: return "SuspenseList";
			case me: return "Activity";
			case _e: return "ViewTransition";
		}
		if (typeof e == "object") switch (e.$$typeof) {
			case oe: return "Portal";
			case E: return e.displayName || "Context";
			case ce: return (e._context.displayName || "Context") + ".Consumer";
			case le:
				var t = e.render;
				return e = e.displayName, e ||= (e = t.displayName || t.name || "", e === "" ? "ForwardRef" : "ForwardRef(" + e + ")"), e;
			case fe: return t = e.displayName || null, t === null ? Se(e.type) || "Memo" : t;
			case pe:
				t = e._payload, e = e._init;
				try {
					return Se(e(t));
				} catch {}
		}
		return null;
	}
	var Ce = Array.isArray, D = n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, O = r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, we = {
		pending: !1,
		data: null,
		method: null,
		action: null
	}, Te = [], Ee = -1;
	function De(e) {
		return { current: e };
	}
	function Oe(e) {
		0 > Ee || (e.current = Te[Ee], Te[Ee] = null, Ee--);
	}
	function k(e, t) {
		Ee++, Te[Ee] = e.current, e.current = t;
	}
	var ke = De(null), Ae = De(null), je = De(null), Me = De(null);
	function Ne(e, t) {
		switch (k(je, t), k(Ae, e), k(ke, null), t.nodeType) {
			case 9:
			case 11:
				e = (e = t.documentElement) && (e = e.namespaceURI) ? up(e) : 0;
				break;
			default: if (e = t.tagName, t = t.namespaceURI) t = up(t), e = dp(t, e);
			else switch (e) {
				case "svg":
					e = 1;
					break;
				case "math":
					e = 2;
					break;
				default: e = 0;
			}
		}
		Oe(ke), k(ke, e);
	}
	function Pe() {
		Oe(ke), Oe(Ae), Oe(je);
	}
	function Fe(e) {
		var t = e.memoizedState;
		t !== null && (sh._currentValue = t.memoizedState, k(Me, e)), t = ke.current;
		var n = dp(t, e.type);
		t !== n && (k(Ae, e), k(ke, n));
	}
	function Ie(e) {
		Ae.current === e && (Oe(ke), Oe(Ae)), Me.current === e && (Oe(Me), sh._currentValue = we);
	}
	var Le, Re;
	function ze(e) {
		if (Le === void 0) try {
			throw Error();
		} catch (e) {
			var t = e.stack.trim().match(/\n( *(at )?)/);
			Le = t && t[1] || "", Re = -1 < e.stack.indexOf("\n    at") ? " (<anonymous>)" : -1 < e.stack.indexOf("@") ? "@unknown:0:0" : "";
		}
		return "\n" + Le + e + Re;
	}
	var Be = !1;
	function Ve(e, t) {
		if (!e || Be) return "";
		Be = !0;
		var n = Error.prepareStackTrace;
		Error.prepareStackTrace = void 0;
		try {
			var r = { DetermineComponentFrameRoot: function() {
				try {
					if (t) {
						var n = function() {
							throw Error();
						};
						if (Object.defineProperty(n.prototype, "props", { set: function() {
							throw Error();
						} }), typeof Reflect == "object" && Reflect.construct) {
							try {
								Reflect.construct(n, []);
							} catch (e) {
								var r = e;
							}
							Reflect.construct(e, [], n);
						} else {
							try {
								n.call();
							} catch (e) {
								r = e;
							}
							n = !1;
							try {
								var i = Object.getOwnPropertyDescriptor(e.prototype, "props");
								Object.defineProperty(e.prototype, "props", {
									configurable: !0,
									set: function() {
										throw Error();
									}
								}), n = !0, new e();
							} finally {
								n && (i === void 0 ? delete e.prototype.props : Object.defineProperty(e.prototype, "props", i));
							}
						}
					} else {
						try {
							throw Error();
						} catch (e) {
							r = e;
						}
						(n = e()) && typeof n.catch == "function" && n.catch(function() {});
					}
				} catch (e) {
					if (e && r && typeof e.stack == "string") return [e.stack, r.stack];
				}
				return [null, null];
			} };
			r.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
			var i = Object.getOwnPropertyDescriptor(r.DetermineComponentFrameRoot, "name");
			i && i.configurable && Object.defineProperty(r.DetermineComponentFrameRoot, "name", { value: "DetermineComponentFrameRoot" });
			var a = r.DetermineComponentFrameRoot(), o = a[0], s = a[1];
			if (o && s) {
				var c = o.split("\n"), l = s.split("\n");
				for (i = r = 0; r < c.length && !c[r].includes("DetermineComponentFrameRoot");) r++;
				for (; i < l.length && !l[i].includes("DetermineComponentFrameRoot");) i++;
				if (r === c.length || i === l.length) for (r = c.length - 1, i = l.length - 1; 1 <= r && 0 <= i && c[r] !== l[i];) i--;
				for (; 1 <= r && 0 <= i; r--, i--) if (c[r] !== l[i]) {
					if (r !== 1 || i !== 1) do
						if (r--, i--, 0 > i || c[r] !== l[i]) {
							var u = "\n" + c[r].replace(" at new ", " at ");
							return e.displayName && u.includes("<anonymous>") && (u = u.replace("<anonymous>", e.displayName)), u;
						}
					while (1 <= r && 0 <= i);
					break;
				}
			}
		} finally {
			Be = !1, Error.prepareStackTrace = n;
		}
		return (n = e ? e.displayName || e.name : "") ? ze(n) : "";
	}
	function He(e, t) {
		switch (e.tag) {
			case 26:
			case 27:
			case 5: return ze(e.type);
			case 16: return ze("Lazy");
			case 13: return e.child !== t && t !== null ? ze("Suspense Fallback") : ze("Suspense");
			case 19: return ze("SuspenseList");
			case 0:
			case 15: return Ve(e.type, !1);
			case 11: return Ve(e.type.render, !1);
			case 1: return Ve(e.type, !0);
			case 31: return ze("Activity");
			case 30: return ze("ViewTransition");
			default: return "";
		}
	}
	function Ue(e) {
		try {
			var t = "", n = null;
			do
				t += He(e, n), n = e, e = e.return;
			while (e);
			return t;
		} catch (e) {
			return "\nError generating stack: " + e.message + "\n" + e.stack;
		}
	}
	var We = Object.prototype.hasOwnProperty, Ge = t.unstable_scheduleCallback, Ke = t.unstable_cancelCallback, qe = t.unstable_shouldYield, Je = t.unstable_requestPaint, Ye = t.unstable_now, Xe = t.unstable_getCurrentPriorityLevel, Ze = t.unstable_ImmediatePriority, Qe = t.unstable_UserBlockingPriority, $e = t.unstable_NormalPriority, et = t.unstable_LowPriority, tt = t.unstable_IdlePriority, nt = t.log, rt = t.unstable_setDisableYieldValue, it = null, at = null;
	function ot(e) {
		if (typeof nt == "function" && rt(e), at && typeof at.setStrictMode == "function") try {
			at.setStrictMode(it, e);
		} catch {}
	}
	var st = Math.clz32 ? Math.clz32 : ut, ct = Math.log, lt = Math.LN2;
	function ut(e) {
		return e >>>= 0, e === 0 ? 32 : 31 - (ct(e) / lt | 0) | 0;
	}
	var dt = 256, ft = 262144, pt = 4194304;
	function mt(e) {
		var t = e & 42;
		if (t !== 0) return t;
		switch (e & -e) {
			case 1: return 1;
			case 2: return 2;
			case 4: return 4;
			case 8: return 8;
			case 16: return 16;
			case 32: return 32;
			case 64: return 64;
			case 128: return 128;
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072: return e & -e;
			case 262144:
			case 524288:
			case 1048576:
			case 2097152: return e & 3932160;
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432: return e & 62914560;
			case 67108864: return 67108864;
			case 134217728: return 134217728;
			case 268435456: return 268435456;
			case 536870912: return 536870912;
			case 1073741824: return 0;
			default: return e;
		}
	}
	function A(e, t, n) {
		var r = e.pendingLanes;
		if (r === 0) return 0;
		var i = 0, a = e.suspendedLanes, o = e.pingedLanes;
		e = e.warmLanes;
		var s = r & 134217727;
		return s === 0 ? (s = r & ~a, s === 0 ? o === 0 ? n || (n = r & ~e, n !== 0 && (i = mt(n))) : i = mt(o) : i = mt(s)) : (r = s & ~a, r === 0 ? (o &= s, o === 0 ? n || (n = s & ~e, n !== 0 && (i = mt(n))) : i = mt(o)) : i = mt(r)), i === 0 ? 0 : t !== 0 && t !== i && (t & a) === 0 && (a = i & -i, n = t & -t, a >= n || a === 32 && n & 4194048) ? t : i;
	}
	function ht(e, t) {
		return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
	}
	function gt(e, t) {
		t & 8 && (t |= t & 32);
		var n = e.entangledLanes;
		if (n !== 0) for (e = e.entanglements, n &= t; 0 < n;) {
			var r = 31 - st(n), i = 1 << r;
			t |= e[r], n &= ~i;
		}
		return t;
	}
	function _t(e, t) {
		switch (e) {
			case 1:
			case 2:
			case 4:
			case 8:
			case 64: return t + 250;
			case 16:
			case 32:
			case 128:
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072:
			case 262144:
			case 524288:
			case 1048576:
			case 2097152: return t + 5e3;
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432: return -1;
			case 67108864:
			case 134217728:
			case 268435456:
			case 536870912:
			case 1073741824: return -1;
			default: return -1;
		}
	}
	function vt() {
		var e = pt;
		return pt <<= 1, !(pt & 62914560) && (pt = 4194304), e;
	}
	function yt(e) {
		for (var t = [], n = 0; 31 > n; n++) t.push(e);
		return t;
	}
	function bt(e, t) {
		e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0);
	}
	function xt(e, t, n, r, i, a) {
		var o = e.pendingLanes;
		e.pendingLanes = n, e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0, e.expiredLanes &= n, e.entangledLanes &= n, e.errorRecoveryDisabledLanes &= n, e.shellSuspendCounter = 0;
		var s = e.entanglements, c = e.expirationTimes, l = e.hiddenUpdates;
		for (n = o & ~n; 0 < n;) {
			var u = 31 - st(n), d = 1 << u;
			s[u] = 0, c[u] = -1;
			var f = l[u];
			if (f !== null) for (l[u] = null, u = 0; u < f.length; u++) {
				var p = f[u];
				p !== null && (p.lane &= -536870913);
			}
			n &= ~d;
		}
		r !== 0 && St(e, r, 0), a !== 0 && i === 0 && e.tag !== 0 && (e.suspendedLanes |= a & ~(o & ~t));
	}
	function St(e, t, n) {
		e.pendingLanes |= t, e.suspendedLanes &= ~t;
		var r = 31 - st(t);
		e.entangledLanes |= t, e.entanglements[r] = e.entanglements[r] | 1073741824 | n & 261930;
	}
	function Ct(e, t) {
		var n = e.entangledLanes |= t;
		for (e = e.entanglements; n;) {
			var r = 31 - st(n), i = 1 << r;
			i & t | e[r] & t && (e[r] |= t), n &= ~i;
		}
	}
	function wt(e, t) {
		var n = t & -t;
		return n = n & 42 ? 1 : Tt(n), (n & (e.suspendedLanes | t)) === 0 ? n : 0;
	}
	function Tt(e) {
		switch (e) {
			case 2:
				e = 1;
				break;
			case 8:
				e = 4;
				break;
			case 32:
				e = 16;
				break;
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072:
			case 262144:
			case 524288:
			case 1048576:
			case 2097152:
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432:
				e = 128;
				break;
			case 268435456:
				e = 134217728;
				break;
			default: e = 0;
		}
		return e;
	}
	function Et(e) {
		return e &= -e, 2 < e ? 8 < e ? e & 134217727 ? 32 : 268435456 : 8 : 2;
	}
	function Dt() {
		var e = O.p;
		return e === 0 ? (e = window.event, e === void 0 ? 32 : Ch(e.type)) : e;
	}
	function Ot(e, t) {
		var n = O.p;
		try {
			return O.p = e, t();
		} finally {
			O.p = n;
		}
	}
	var kt = Math.random().toString(36).slice(2), At = "__reactFiber$" + kt, jt = "__reactProps$" + kt, Mt = "__reactContainer$" + kt, Nt = "__reactEvents$" + kt, Pt = "__reactListeners$" + kt, Ft = "__reactHandles$" + kt, It = "__reactResources$" + kt, Lt = "__reactMarker$" + kt, Rt = "__reactLoad$" + kt;
	function zt(e) {
		delete e[At], delete e[jt], delete e[Pt], delete e[Ft];
	}
	function Bt(e) {
		var t;
		if (t = e[At]) return t;
		for (var n = e.parentNode; n;) {
			if (t = n[Mt] || n[At]) {
				if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = fm(e); e !== null;) {
					if (n = e[At]) return n;
					e = fm(e);
				}
				return t;
			}
			e = n, n = e.parentNode;
		}
		return null;
	}
	function Vt(e) {
		if (e = e[At] || e[Mt]) {
			var t = e.tag;
			if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e;
		}
		return null;
	}
	function Ht(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
		throw Error(i(33));
	}
	function Ut(e) {
		var t = e[It];
		return t ||= e[It] = {
			hoistableStyles: /* @__PURE__ */ new Map(),
			hoistableScripts: /* @__PURE__ */ new Map()
		}, t;
	}
	function Wt(e) {
		e[Lt] = !0;
	}
	function Gt(e) {
		e[Rt] = void 0;
	}
	var Kt = /* @__PURE__ */ new Set(), qt = {};
	function Jt(e, t) {
		Yt(e, t), Yt(e + "Capture", t);
	}
	function Yt(e, t) {
		for (qt[e] = t, e = 0; e < t.length; e++) Kt.add(t[e]);
	}
	var Xt = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), Zt = {}, Qt = {};
	function $t(e) {
		return We.call(Qt, e) ? !0 : We.call(Zt, e) ? !1 : Xt.test(e) ? Qt[e] = !0 : (Zt[e] = !0, !1);
	}
	var j = !1;
	function en() {
		var e = j;
		return j = !1, e;
	}
	function tn(e, t, n) {
		if ($t(t)) {
			if (n === null) e.removeAttribute(t);
			else {
				switch (typeof n) {
					case "undefined":
					case "function":
					case "symbol":
						e.removeAttribute(t);
						return;
					case "boolean":
						var r = t.toLowerCase().slice(0, 5);
						if (r !== "data-" && r !== "aria-") {
							e.removeAttribute(t);
							return;
						}
				}
				e.setAttribute(t, n);
			}
		}
	}
	function nn(e, t, n) {
		if (n === null) e.removeAttribute(t);
		else {
			switch (typeof n) {
				case "undefined":
				case "function":
				case "symbol":
				case "boolean":
					e.removeAttribute(t);
					return;
			}
			e.setAttribute(t, n);
		}
	}
	function rn(e, t, n, r) {
		if (r === null) e.removeAttribute(n);
		else {
			switch (typeof r) {
				case "undefined":
				case "function":
				case "symbol":
				case "boolean":
					e.removeAttribute(n);
					return;
			}
			e.setAttributeNS(t, n, r);
		}
	}
	function an(e) {
		switch (typeof e) {
			case "bigint":
			case "boolean":
			case "number":
			case "string":
			case "undefined": return e;
			case "object": return e;
			default: return "";
		}
	}
	function on(e) {
		var t = e.type;
		return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
	}
	function sn(e, t, n) {
		var r = Object.getOwnPropertyDescriptor(e.constructor.prototype, t);
		if (!e.hasOwnProperty(t) && r !== void 0 && typeof r.get == "function" && typeof r.set == "function") {
			var i = r.get, a = r.set;
			return Object.defineProperty(e, t, {
				configurable: !0,
				get: function() {
					return i.call(this);
				},
				set: function(e) {
					n = "" + e, a.call(this, e);
				}
			}), Object.defineProperty(e, t, { enumerable: r.enumerable }), {
				getValue: function() {
					return n;
				},
				setValue: function(e) {
					n = "" + e;
				},
				stopTracking: function() {
					e._valueTracker = null, delete e[t];
				}
			};
		}
	}
	function cn(e) {
		if (!e._valueTracker) {
			var t = on(e) ? "checked" : "value";
			e._valueTracker = sn(e, t, "" + e[t]);
		}
	}
	function ln(e) {
		if (!e) return !1;
		var t = e._valueTracker;
		if (!t) return !0;
		var n = t.getValue(), r = "";
		return e && (r = on(e) ? e.checked ? "true" : "false" : e.value), e = r, e !== n && (t.setValue(e), !0);
	}
	var un = /[\n"\\]/g;
	function dn(e) {
		return e.replace(un, function(e) {
			return "\\" + e.charCodeAt(0).toString(16) + " ";
		});
	}
	function fn(e, t, n, r, i, a, o, s) {
		e.name = "", o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" ? e.type = o : e.removeAttribute("type"), t == null ? o !== "submit" && o !== "reset" || e.removeAttribute("value") : o === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + an(t)) : e.value !== "" + an(t) && (e.value = "" + an(t)), t == null ? n == null ? r != null && e.removeAttribute("value") : mn(e, an(n)) : o === "number" && e.value == t ? mn(e, an(e.value)) : mn(e, an(t)), i == null && a != null && (e.defaultChecked = !!a), i != null && (e.checked = i && typeof i != "function" && typeof i != "symbol"), s != null && typeof s != "function" && typeof s != "symbol" && typeof s != "boolean" ? e.name = "" + an(s) : e.removeAttribute("name");
	}
	function pn(e, t, n, r, i, a, o, s) {
		if (a != null && typeof a != "function" && typeof a != "symbol" && typeof a != "boolean" && (e.type = a), t != null || n != null) {
			if (!(a !== "submit" && a !== "reset" || t != null)) {
				cn(e);
				return;
			}
			n = n == null ? "" : "" + an(n), t = t == null ? n : "" + an(t), s || t === e.value || (e.value = t), e.defaultValue = t;
		}
		r ??= i, r = typeof r != "function" && typeof r != "symbol" && !!r, e.checked = s ? e.checked : !!r, e.defaultChecked = !!r, o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" && (e.name = o), cn(e);
	}
	function mn(e, t) {
		e.defaultValue !== "" + t && (e.defaultValue = "" + t);
	}
	function hn(e, t, n, r) {
		if (e = e.options, t) {
			t = {};
			for (var i = 0; i < n.length; i++) t["$" + n[i]] = !0;
			for (n = 0; n < e.length; n++) i = t.hasOwnProperty("$" + e[n].value), e[n].selected !== i && (e[n].selected = i), i && r && (e[n].defaultSelected = !0);
		} else {
			for (n = "" + an(n), t = null, i = 0; i < e.length; i++) {
				if (e[i].value === n) {
					e[i].selected = !0, r && (e[i].defaultSelected = !0);
					return;
				}
				t !== null || e[i].disabled || (t = e[i]);
			}
			t !== null && (t.selected = !0);
		}
	}
	function gn(e, t, n) {
		t != null && (t = "" + an(t), t !== e.value && (e.value = t), n == null) ? e.defaultValue !== t && (e.defaultValue = t) : e.defaultValue = n == null ? "" : "" + an(n);
	}
	function _n(e, t, n, r) {
		if (t == null) {
			if (r != null) {
				if (n != null) throw Error(i(92));
				if (Ce(r)) {
					if (1 < r.length) throw Error(i(93));
					r = r[0];
				}
				n = r;
			}
			n ??= "", t = n;
		}
		n = an(t), e.defaultValue = n, r = e.textContent, r === n && r !== "" && r !== null && (e.value = r), cn(e);
	}
	function vn(e, t) {
		if (t) {
			var n = e.firstChild;
			if (n && n === e.lastChild && n.nodeType === 3) {
				n.nodeValue = t;
				return;
			}
		}
		e.textContent = t;
	}
	var yn = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
	function bn(e, t, n) {
		var r = t.indexOf("--") === 0;
		n == null || typeof n == "boolean" || n === "" ? r ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : r ? e.setProperty(t, n) : typeof n != "number" || n === 0 || yn.has(t) ? t === "float" ? e.cssFloat = n : e[t] = ("" + n).trim() : e[t] = n + "px";
	}
	function xn(e, t, n) {
		if (t != null && typeof t != "object") throw Error(i(62));
		if (e = e.style, n != null) {
			for (var r in n) !n.hasOwnProperty(r) || t != null && t.hasOwnProperty(r) || (r.indexOf("--") === 0 ? e.setProperty(r, "") : r === "float" ? e.cssFloat = "" : e[r] = "", j = !0);
			for (var a in t) r = t[a], t.hasOwnProperty(a) && n[a] !== r && (bn(e, a, r), j = !0);
		} else for (var o in t) t.hasOwnProperty(o) && bn(e, o, t[o]);
	}
	function Sn(e) {
		if (e.indexOf("-") === -1) return !1;
		switch (e) {
			case "annotation-xml":
			case "color-profile":
			case "font-face":
			case "font-face-src":
			case "font-face-uri":
			case "font-face-format":
			case "font-face-name":
			case "missing-glyph": return !1;
			default: return !0;
		}
	}
	var Cn = /* @__PURE__ */ new Map([
		["acceptCharset", "accept-charset"],
		["htmlFor", "for"],
		["httpEquiv", "http-equiv"],
		["crossOrigin", "crossorigin"],
		["accentHeight", "accent-height"],
		["alignmentBaseline", "alignment-baseline"],
		["arabicForm", "arabic-form"],
		["baselineShift", "baseline-shift"],
		["capHeight", "cap-height"],
		["clipPath", "clip-path"],
		["clipRule", "clip-rule"],
		["colorInterpolation", "color-interpolation"],
		["colorInterpolationFilters", "color-interpolation-filters"],
		["colorProfile", "color-profile"],
		["colorRendering", "color-rendering"],
		["dominantBaseline", "dominant-baseline"],
		["enableBackground", "enable-background"],
		["fillOpacity", "fill-opacity"],
		["fillRule", "fill-rule"],
		["floodColor", "flood-color"],
		["floodOpacity", "flood-opacity"],
		["fontFamily", "font-family"],
		["fontSize", "font-size"],
		["fontSizeAdjust", "font-size-adjust"],
		["fontStretch", "font-stretch"],
		["fontStyle", "font-style"],
		["fontVariant", "font-variant"],
		["fontWeight", "font-weight"],
		["glyphName", "glyph-name"],
		["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
		["glyphOrientationVertical", "glyph-orientation-vertical"],
		["horizAdvX", "horiz-adv-x"],
		["horizOriginX", "horiz-origin-x"],
		["imageRendering", "image-rendering"],
		["letterSpacing", "letter-spacing"],
		["lightingColor", "lighting-color"],
		["markerEnd", "marker-end"],
		["markerMid", "marker-mid"],
		["markerStart", "marker-start"],
		["maskType", "mask-type"],
		["overlinePosition", "overline-position"],
		["overlineThickness", "overline-thickness"],
		["paintOrder", "paint-order"],
		["panose-1", "panose-1"],
		["pointerEvents", "pointer-events"],
		["renderingIntent", "rendering-intent"],
		["shapeRendering", "shape-rendering"],
		["stopColor", "stop-color"],
		["stopOpacity", "stop-opacity"],
		["strikethroughPosition", "strikethrough-position"],
		["strikethroughThickness", "strikethrough-thickness"],
		["strokeDasharray", "stroke-dasharray"],
		["strokeDashoffset", "stroke-dashoffset"],
		["strokeLinecap", "stroke-linecap"],
		["strokeLinejoin", "stroke-linejoin"],
		["strokeMiterlimit", "stroke-miterlimit"],
		["strokeOpacity", "stroke-opacity"],
		["strokeWidth", "stroke-width"],
		["textAnchor", "text-anchor"],
		["textDecoration", "text-decoration"],
		["textRendering", "text-rendering"],
		["transformOrigin", "transform-origin"],
		["underlinePosition", "underline-position"],
		["underlineThickness", "underline-thickness"],
		["unicodeBidi", "unicode-bidi"],
		["unicodeRange", "unicode-range"],
		["unitsPerEm", "units-per-em"],
		["vAlphabetic", "v-alphabetic"],
		["vHanging", "v-hanging"],
		["vIdeographic", "v-ideographic"],
		["vMathematical", "v-mathematical"],
		["vectorEffect", "vector-effect"],
		["vertAdvY", "vert-adv-y"],
		["vertOriginX", "vert-origin-x"],
		["vertOriginY", "vert-origin-y"],
		["wordSpacing", "word-spacing"],
		["writingMode", "writing-mode"],
		["xmlnsXlink", "xmlns:xlink"],
		["xHeight", "x-height"]
	]), wn = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
	function Tn(e) {
		return wn.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e;
	}
	function En() {}
	var Dn = null;
	function On(e) {
		return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
	}
	var kn = null, An = null;
	function jn(e) {
		var t = Vt(e);
		if (t && (e = t.stateNode)) {
			var n = e[jt] || null;
			a: switch (e = t.stateNode, t.type) {
				case "input":
					if (fn(e, n.value, n.defaultValue, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name), t = n.name, n.type === "radio" && t != null) {
						for (n = e; n.parentNode;) n = n.parentNode;
						for (n = n.querySelectorAll("input[name=\"" + dn("" + t) + "\"][type=\"radio\"]"), t = 0; t < n.length; t++) {
							var r = n[t];
							if (r !== e && r.form === e.form) {
								var a = r[jt] || null;
								if (!a) throw Error(i(90));
								fn(r, a.value, a.defaultValue, a.defaultValue, a.checked, a.defaultChecked, a.type, a.name);
							}
						}
						for (t = 0; t < n.length; t++) r = n[t], r.form === e.form && ln(r);
					}
					break a;
				case "textarea":
					gn(e, n.value, n.defaultValue);
					break a;
				case "select": t = n.value, t != null && hn(e, !!n.multiple, t, !1);
			}
		}
	}
	var Mn = !1;
	function Nn(e, t, n) {
		if (Mn) return e(t, n);
		Mn = !0;
		try {
			return e(t);
		} finally {
			if (Mn = !1, (kn !== null || An !== null) && (zd(), kn && (t = kn, e = An, An = kn = null, jn(t), e))) for (t = 0; t < e.length; t++) jn(e[t]);
		}
	}
	function Pn(e, t) {
		var n = e.stateNode;
		if (n === null) return null;
		var r = n[jt] || null;
		if (r === null) return null;
		n = r[t];
		a: switch (t) {
			case "onClick":
			case "onClickCapture":
			case "onDoubleClick":
			case "onDoubleClickCapture":
			case "onMouseDown":
			case "onMouseDownCapture":
			case "onMouseMove":
			case "onMouseMoveCapture":
			case "onMouseUp":
			case "onMouseUpCapture":
			case "onMouseEnter":
				(r = !r.disabled) || (e = e.type, r = e !== "button" && e !== "input" && e !== "select" && e !== "textarea"), e = !r;
				break a;
			default: e = !1;
		}
		if (e) return null;
		if (n && typeof n != "function") throw Error(i(231, t, typeof n));
		return n;
	}
	var Fn = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0, In = !1;
	if (Fn) try {
		var Ln = {};
		Object.defineProperty(Ln, "passive", { get: function() {
			In = !0;
		} }), window.addEventListener("test", Ln, Ln), window.removeEventListener("test", Ln, Ln);
	} catch {
		In = !1;
	}
	var Rn = null, zn = null, Bn = null;
	function Vn() {
		if (Bn) return Bn;
		var e, t = zn, n = t.length, r, i = "value" in Rn ? Rn.value : Rn.textContent, a = i.length;
		for (e = 0; e < n && t[e] === i[e]; e++);
		var o = n - e;
		for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
		return Bn = i.slice(e, 1 < r ? 1 - r : void 0);
	}
	function Hn(e) {
		var t = e.keyCode;
		return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
	}
	function Un() {
		return !0;
	}
	function Wn() {
		return !1;
	}
	function Gn(e) {
		function t(t, n, r, i, a) {
			for (var o in this._reactName = t, this._targetInst = r, this.type = n, this.nativeEvent = i, this.target = a, this.currentTarget = null, e) e.hasOwnProperty(o) && (t = e[o], this[o] = t ? t(i) : i[o]);
			return this.isDefaultPrevented = (i.defaultPrevented == null ? !1 === i.returnValue : i.defaultPrevented) ? Un : Wn, this.isPropagationStopped = Wn, this;
		}
		return C(t.prototype, {
			preventDefault: function() {
				this.defaultPrevented = !0;
				var e = this.nativeEvent;
				e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = Un);
			},
			stopPropagation: function() {
				var e = this.nativeEvent;
				e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = Un);
			},
			persist: function() {},
			isPersistent: Un
		}), t;
	}
	var Kn = {
		eventPhase: 0,
		bubbles: 0,
		cancelable: 0,
		timeStamp: function(e) {
			return e.timeStamp || Date.now();
		},
		defaultPrevented: 0,
		isTrusted: 0
	}, qn = Gn(Kn), Jn = C({}, Kn, {
		view: 0,
		detail: 0
	}), Yn = Gn(Jn), Xn, Zn, Qn, $n = C({}, Jn, {
		screenX: 0,
		screenY: 0,
		clientX: 0,
		clientY: 0,
		pageX: 0,
		pageY: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		getModifierState: ur,
		button: 0,
		buttons: 0,
		relatedTarget: function(e) {
			return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
		},
		movementX: function(e) {
			return "movementX" in e ? e.movementX : (e !== Qn && (Qn && e.type === "mousemove" ? (Xn = e.screenX - Qn.screenX, Zn = e.screenY - Qn.screenY) : Zn = Xn = 0, Qn = e), Xn);
		},
		movementY: function(e) {
			return "movementY" in e ? e.movementY : Zn;
		}
	}), er = Gn($n), tr = Gn(C({}, $n, { dataTransfer: 0 })), nr = Gn(C({}, Jn, { relatedTarget: 0 })), rr = Gn(C({}, Kn, {
		animationName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), ir = Gn(C({}, Kn, { clipboardData: function(e) {
		return "clipboardData" in e ? e.clipboardData : window.clipboardData;
	} })), ar = Gn(C({}, Kn, { data: 0 })), or = {
		Esc: "Escape",
		Spacebar: " ",
		Left: "ArrowLeft",
		Up: "ArrowUp",
		Right: "ArrowRight",
		Down: "ArrowDown",
		Del: "Delete",
		Win: "OS",
		Menu: "ContextMenu",
		Apps: "ContextMenu",
		Scroll: "ScrollLock",
		MozPrintableKey: "Unidentified"
	}, sr = {
		8: "Backspace",
		9: "Tab",
		12: "Clear",
		13: "Enter",
		16: "Shift",
		17: "Control",
		18: "Alt",
		19: "Pause",
		20: "CapsLock",
		27: "Escape",
		32: " ",
		33: "PageUp",
		34: "PageDown",
		35: "End",
		36: "Home",
		37: "ArrowLeft",
		38: "ArrowUp",
		39: "ArrowRight",
		40: "ArrowDown",
		45: "Insert",
		46: "Delete",
		112: "F1",
		113: "F2",
		114: "F3",
		115: "F4",
		116: "F5",
		117: "F6",
		118: "F7",
		119: "F8",
		120: "F9",
		121: "F10",
		122: "F11",
		123: "F12",
		144: "NumLock",
		145: "ScrollLock",
		224: "Meta"
	}, cr = {
		Alt: "altKey",
		Control: "ctrlKey",
		Meta: "metaKey",
		Shift: "shiftKey"
	};
	function lr(e) {
		var t = this.nativeEvent;
		return t.getModifierState ? t.getModifierState(e) : (e = cr[e]) ? !!t[e] : !1;
	}
	function ur() {
		return lr;
	}
	var dr = Gn(C({}, Jn, {
		key: function(e) {
			if (e.key) {
				var t = or[e.key] || e.key;
				if (t !== "Unidentified") return t;
			}
			return e.type === "keypress" ? (e = Hn(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? sr[e.keyCode] || "Unidentified" : "";
		},
		code: 0,
		location: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		repeat: 0,
		locale: 0,
		getModifierState: ur,
		charCode: function(e) {
			return e.type === "keypress" ? Hn(e) : 0;
		},
		keyCode: function(e) {
			return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		},
		which: function(e) {
			return e.type === "keypress" ? Hn(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		}
	})), fr = Gn(C({}, $n, {
		pointerId: 0,
		width: 0,
		height: 0,
		pressure: 0,
		tangentialPressure: 0,
		tiltX: 0,
		tiltY: 0,
		twist: 0,
		pointerType: 0,
		isPrimary: 0
	})), pr = Gn(C({}, Kn, { submitter: 0 })), mr = Gn(C({}, Jn, {
		touches: 0,
		targetTouches: 0,
		changedTouches: 0,
		altKey: 0,
		metaKey: 0,
		ctrlKey: 0,
		shiftKey: 0,
		getModifierState: ur
	})), hr = Gn(C({}, Kn, {
		propertyName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), gr = Gn(C({}, $n, {
		deltaX: function(e) {
			return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
		},
		deltaY: function(e) {
			return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
		},
		deltaZ: 0,
		deltaMode: 0
	})), _r = Gn(C({}, Kn, {
		newState: 0,
		oldState: 0,
		source: 0
	})), vr = [
		9,
		13,
		27,
		32
	], yr = Fn && "CompositionEvent" in window, br = null;
	Fn && "documentMode" in document && (br = document.documentMode);
	var xr = Fn && "TextEvent" in window && !br, Sr = Fn && (!yr || br && 8 < br && 11 >= br), Cr = " ", wr = !1;
	function Tr(e, t) {
		switch (e) {
			case "keyup": return vr.indexOf(t.keyCode) !== -1;
			case "keydown": return t.keyCode !== 229;
			case "keypress":
			case "mousedown":
			case "focusout": return !0;
			default: return !1;
		}
	}
	function Er(e) {
		return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
	}
	var Dr = !1;
	function Or(e, t) {
		switch (e) {
			case "compositionend": return Er(t);
			case "keypress": return t.which === 32 ? (wr = !0, Cr) : null;
			case "textInput": return e = t.data, e === Cr && wr ? null : e;
			default: return null;
		}
	}
	function kr(e, t) {
		if (Dr) return e === "compositionend" || !yr && Tr(e, t) ? (e = Vn(), Bn = zn = Rn = null, Dr = !1, e) : null;
		switch (e) {
			case "paste": return null;
			case "keypress":
				if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
					if (t.char && 1 < t.char.length) return t.char;
					if (t.which) return String.fromCharCode(t.which);
				}
				return null;
			case "compositionend": return Sr && t.locale !== "ko" ? null : t.data;
			default: return null;
		}
	}
	var Ar = {
		color: !0,
		date: !0,
		datetime: !0,
		"datetime-local": !0,
		email: !0,
		month: !0,
		number: !0,
		password: !0,
		range: !0,
		search: !0,
		tel: !0,
		text: !0,
		time: !0,
		url: !0,
		week: !0
	};
	function jr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t === "input" ? !!Ar[e.type] : t === "textarea";
	}
	function Mr(e, t, n, r) {
		kn ? An ? An.push(r) : An = [r] : kn = r, t = Jf(t, "onChange"), 0 < t.length && (n = new qn("onChange", "change", null, n, r), e.push({
			event: n,
			listeners: t
		}));
	}
	var Nr = null, Pr = null;
	function Fr(e) {
		Vf(e, 0);
	}
	function Ir(e) {
		if (ln(Ht(e))) return e;
	}
	function Lr(e, t) {
		if (e === "change") return t;
	}
	var Rr = !1;
	if (Fn) {
		var zr;
		if (Fn) {
			var Br = "oninput" in document;
			if (!Br) {
				var Vr = document.createElement("div");
				Vr.setAttribute("oninput", "return;"), Br = typeof Vr.oninput == "function";
			}
			zr = Br;
		} else zr = !1;
		Rr = zr && (!document.documentMode || 9 < document.documentMode);
	}
	function Hr() {
		Nr && (Nr.detachEvent("onpropertychange", Ur), Pr = Nr = null);
	}
	function Ur(e) {
		if (e.propertyName === "value" && Ir(Pr)) {
			var t = [];
			Mr(t, Pr, e, On(e)), Nn(Fr, t);
		}
	}
	function Wr(e, t, n) {
		e === "focusin" ? (Hr(), Nr = t, Pr = n, Nr.attachEvent("onpropertychange", Ur)) : e === "focusout" && Hr();
	}
	function Gr(e) {
		if (e === "selectionchange" || e === "keyup" || e === "keydown") return Ir(Pr);
	}
	function Kr(e, t) {
		if (e === "click") return Ir(t);
	}
	function qr(e, t) {
		if (e === "input" || e === "change") return Ir(t);
	}
	function Jr(e, t) {
		return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
	}
	var Yr = typeof Object.is == "function" ? Object.is : Jr;
	function Xr(e, t) {
		if (Yr(e, t)) return !0;
		if (typeof e != "object" || !e || typeof t != "object" || !t) return !1;
		var n = Object.keys(e), r = Object.keys(t);
		if (n.length !== r.length) return !1;
		for (r = 0; r < n.length; r++) {
			var i = n[r];
			if (!We.call(t, i) || !Yr(e[i], t[i])) return !1;
		}
		return !0;
	}
	function Zr(e) {
		if (e ||= typeof document < "u" ? document : void 0, e === void 0) return null;
		try {
			return e.activeElement || e.body;
		} catch {
			return e.body;
		}
	}
	function Qr(e) {
		for (; e && e.firstChild;) e = e.firstChild;
		return e;
	}
	function $r(e, t) {
		var n = Qr(e);
		e = 0;
		for (var r; n;) {
			if (n.nodeType === 3) {
				if (r = e + n.textContent.length, e <= t && r >= t) return {
					node: n,
					offset: t - e
				};
				e = r;
			}
			a: {
				for (; n;) {
					if (n.nextSibling) {
						n = n.nextSibling;
						break a;
					}
					n = n.parentNode;
				}
				n = void 0;
			}
			n = Qr(n);
		}
	}
	function ei(e, t) {
		return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? ei(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
	}
	function ti(e) {
		e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
		for (var t = Zr(e.document); t instanceof e.HTMLIFrameElement;) {
			try {
				var n = typeof t.contentWindow.location.href == "string";
			} catch {
				n = !1;
			}
			if (n) e = t.contentWindow;
			else break;
			t = Zr(e.document);
		}
		return t;
	}
	function ni(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
	}
	var M = Fn && "documentMode" in document && 11 >= document.documentMode, ri = null, ii = null, ai = null, oi = !1;
	function si(e, t, n) {
		var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
		oi || ri == null || ri !== Zr(r) || (r = ri, "selectionStart" in r && ni(r) ? r = {
			start: r.selectionStart,
			end: r.selectionEnd
		} : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = {
			anchorNode: r.anchorNode,
			anchorOffset: r.anchorOffset,
			focusNode: r.focusNode,
			focusOffset: r.focusOffset
		}), ai && Xr(ai, r) || (ai = r, r = Jf(ii, "onSelect"), 0 < r.length && (t = new qn("onSelect", "select", null, t, n), e.push({
			event: t,
			listeners: r
		}), t.target = ri)));
	}
	function ci(e, t) {
		var n = {};
		return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
	}
	var li = {
		animationend: ci("Animation", "AnimationEnd"),
		animationiteration: ci("Animation", "AnimationIteration"),
		animationstart: ci("Animation", "AnimationStart"),
		transitionrun: ci("Transition", "TransitionRun"),
		transitionstart: ci("Transition", "TransitionStart"),
		transitioncancel: ci("Transition", "TransitionCancel"),
		transitionend: ci("Transition", "TransitionEnd")
	}, ui = {}, di = {};
	Fn && (di = document.createElement("div").style, "AnimationEvent" in window || (delete li.animationend.animation, delete li.animationiteration.animation, delete li.animationstart.animation), "TransitionEvent" in window || delete li.transitionend.transition);
	function fi(e) {
		if (ui[e]) return ui[e];
		if (!li[e]) return e;
		var t = li[e], n;
		for (n in t) if (t.hasOwnProperty(n) && n in di) return ui[e] = t[n];
		return e;
	}
	var pi = fi("animationend"), mi = fi("animationiteration"), hi = fi("animationstart"), gi = fi("transitionrun"), _i = fi("transitionstart"), vi = fi("transitioncancel"), yi = fi("transitionend"), bi = /* @__PURE__ */ new Map(), xi = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error fullscreenChange fullscreenError gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
	xi.push("scrollEnd");
	function Si(e, t) {
		bi.set(e, t), Jt(t, [e]);
	}
	var Ci = 0;
	function wi(e, t) {
		if (e.name != null && e.name !== "auto") return e.name;
		if (t.autoName !== null) return t.autoName;
		e = bd.identifierPrefix;
		var n = Ci++;
		return e = "_" + e + "t_" + n.toString(32) + "_", t.autoName = e;
	}
	function Ti(e) {
		if (e == null || typeof e == "string") return e;
		var t = null, n = Od;
		if (n !== null) for (var r = 0; r < n.length; r++) {
			var i = e[n[r]];
			if (i != null) {
				if (i === "none") return "none";
				t = t == null ? i : t + (" " + i);
			}
		}
		return t ?? e.default;
	}
	function Ei(e, t) {
		return e = Ti(e), t = Ti(t), t == null ? e === "auto" ? null : e : t === "auto" ? null : t;
	}
	var Di = typeof reportError == "function" ? reportError : function(e) {
		if (typeof window == "object" && typeof window.ErrorEvent == "function") {
			var t = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: typeof e == "object" && e && typeof e.message == "string" ? String(e.message) : String(e),
				error: e
			});
			if (!window.dispatchEvent(t)) return;
		} else if (typeof process == "object" && typeof process.emit == "function") {
			process.emit("uncaughtException", e);
			return;
		}
		console.error(e);
	}, Oi = [], ki = 0, Ai = 0;
	function ji() {
		for (var e = ki, t = Ai = ki = 0; t < e;) {
			var n = Oi[t];
			Oi[t++] = null;
			var r = Oi[t];
			Oi[t++] = null;
			var i = Oi[t];
			Oi[t++] = null;
			var a = Oi[t];
			if (Oi[t++] = null, r !== null && i !== null) {
				var o = r.pending;
				o === null ? i.next = i : (i.next = o.next, o.next = i), r.pending = i;
			}
			a !== 0 && Fi(n, i, a);
		}
	}
	function Mi(e, t, n, r) {
		Oi[ki++] = e, Oi[ki++] = t, Oi[ki++] = n, Oi[ki++] = r, Ai |= r, e.lanes |= r, e = e.alternate, e !== null && (e.lanes |= r);
	}
	function Ni(e, t, n, r) {
		return Mi(e, t, n, r), Ii(e);
	}
	function Pi(e, t) {
		return Mi(e, null, null, t), Ii(e);
	}
	function Fi(e, t, n) {
		e.lanes |= n;
		var r = e.alternate;
		r !== null && (r.lanes |= n);
		for (var i = !1, a = e.return; a !== null;) a.childLanes |= n, r = a.alternate, r !== null && (r.childLanes |= n), a.tag === 22 && (e = a.stateNode, e === null || e._visibility & 1 || (i = !0)), e = a, a = a.return;
		return e.tag === 3 ? (a = e.stateNode, i && t !== null && (i = 31 - st(n), e = a.hiddenUpdates, r = e[i], r === null ? e[i] = [t] : r.push(t), t.lane = n | 536870912), a) : null;
	}
	function Ii(e) {
		if (50 < kd) throw kd = 0, Ad = null, Error(i(185));
		for (var t = e.return; t !== null;) e = t, t = e.return;
		return e.tag === 3 ? e.stateNode : null;
	}
	var Li = {};
	function Ri(e, t, n, r) {
		this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
	}
	function zi(e, t, n, r) {
		return new Ri(e, t, n, r);
	}
	function Bi(e) {
		return e = e.prototype, !(!e || !e.isReactComponent);
	}
	function Vi(e, t) {
		var n = e.alternate;
		return n === null ? (n = zi(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 1206910976, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n.refCleanup = e.refCleanup, n;
	}
	function Hi(e, t) {
		e.flags &= 1206910978;
		var n = e.alternate;
		return n === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = n.childLanes, e.lanes = n.lanes, e.child = n.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = n.memoizedProps, e.memoizedState = n.memoizedState, e.updateQueue = n.updateQueue, e.type = n.type, t = n.dependencies, e.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}), e;
	}
	function Ui(e, t, n, r, a, o) {
		var s = 0;
		if (r = e, typeof r == "function") Bi(r) && (s = 1);
		else if (typeof r == "string") s = qm(e, n, ke.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
		else a: switch (r) {
			case me: return e = zi(31, n, t, a), e.elementType = me, e.lanes = o, e;
			case w: return Wi(n.children, a, o, t);
			case se:
				s = 8, a |= 24;
				break;
			case T: return e = zi(12, n, t, a | 2), e.elementType = T, e.lanes = o, e;
			case ue: return e = zi(13, n, t, a), e.elementType = ue, e.lanes = o, e;
			case de: return e = zi(19, n, t, a), e.elementType = de, e.lanes = o, e;
			case he:
			case _e: return e = a | 32, e = zi(30, n, t, e), e.elementType = _e, e.lanes = o, e.stateNode = {
				autoName: null,
				paired: null,
				clones: null,
				ref: null
			}, e;
			default:
				if (typeof r == "object" && r) switch (r.$$typeof) {
					case E:
						s = 10;
						break a;
					case ce:
						s = 9;
						break a;
					case le:
						s = 11;
						break a;
					case fe:
						s = 14;
						break a;
					case pe:
						s = 16, r = null;
						break a;
				}
				s = 29, n = Error(i(130, e === null ? "null" : typeof e, "")), r = null;
		}
		return t = zi(s, n, t, a), t.elementType = e, t.type = r, t.lanes = o, t;
	}
	function Wi(e, t, n, r) {
		return e = zi(7, e, r, t), e.lanes = n, e;
	}
	function Gi(e, t, n) {
		return e = zi(6, e, null, t), e.lanes = n, e;
	}
	function Ki(e) {
		var t = zi(18, null, null, 0);
		return t.stateNode = e, t;
	}
	function qi(e, t, n) {
		return t = zi(4, e.children === null ? [] : e.children, e.key, t), t.lanes = n, t.stateNode = {
			containerInfo: e.containerInfo,
			pendingChildren: null,
			implementation: e.implementation
		}, t;
	}
	var Ji = /* @__PURE__ */ new WeakMap();
	function Yi(e, t) {
		if (typeof e == "object" && e) {
			var n = Ji.get(e);
			return n === void 0 ? (t = {
				value: e,
				source: t,
				stack: Ue(t)
			}, Ji.set(e, t), t) : n;
		}
		return {
			value: e,
			source: t,
			stack: Ue(t)
		};
	}
	var Xi = [], Zi = 0, Qi = null, $i = 0, ea = [], ta = 0, na = null, ra = 1, ia = "";
	function aa(e, t) {
		Xi[Zi++] = $i, Xi[Zi++] = Qi, Qi = e, $i = t;
	}
	function oa(e, t, n) {
		ea[ta++] = ra, ea[ta++] = ia, ea[ta++] = na, na = e;
		var r = ra;
		e = ia;
		var i = 32 - st(r) - 1;
		r &= ~(1 << i), n += 1;
		var a = 32 - st(t) + i;
		if (30 < a) {
			var o = i - i % 5;
			a = (r & (1 << o) - 1).toString(32), r >>= o, i -= o, ra = 1 << 32 - st(t) + i | n << i | r, ia = a + e;
		} else ra = 1 << a | n << i | r, ia = e;
	}
	function sa(e) {
		e.return !== null && (aa(e, 1), oa(e, 1, 0));
	}
	function ca(e) {
		for (; e === Qi;) Qi = Xi[--Zi], Xi[Zi] = null, $i = Xi[--Zi], Xi[Zi] = null;
		for (; e === na;) na = ea[--ta], ea[ta] = null, ia = ea[--ta], ea[ta] = null, ra = ea[--ta], ea[ta] = null;
	}
	function la(e, t) {
		ea[ta++] = ra, ea[ta++] = ia, ea[ta++] = na, ra = t.id, ia = t.overflow, na = e;
	}
	var ua = null, N = null, P = !1, da = null, fa = !1, pa = Error(i(519));
	function ma(e) {
		throw ba(Yi(Error(i(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", "")), e)), pa;
	}
	function ha(e) {
		var t = e.stateNode, n = e.type, r = e.memoizedProps;
		switch (t[At] = e, t[jt] = r, n) {
			case "dialog":
				Q("cancel", t), Q("close", t);
				break;
			case "iframe":
			case "object":
			case "embed":
				Q("load", t);
				break;
			case "video":
			case "audio":
				for (n = 0; n < zf.length; n++) Q(zf[n], t);
				break;
			case "source":
				Q("error", t);
				break;
			case "img":
			case "image":
			case "link":
				Q("error", t), Q("load", t);
				break;
			case "details":
				Q("toggle", t);
				break;
			case "input":
				Q("invalid", t), pn(t, r.value, r.defaultValue, r.checked, r.defaultChecked, r.type, r.name, !0);
				break;
			case "select":
				Q("invalid", t);
				break;
			case "textarea": Q("invalid", t), _n(t, r.value, r.defaultValue, r.children);
		}
		n = r.children, typeof n != "string" && typeof n != "number" && typeof n != "bigint" || t.textContent === "" + n || !0 === r.suppressHydrationWarning || ep(t.textContent, n) ? (r.popover != null && (Q("beforetoggle", t), Q("toggle", t)), r.onScroll != null && Q("scroll", t), r.onScrollEnd != null && Q("scrollend", t), r.onClick != null && (t.onclick = En), t = !0) : t = !1, t || ma(e, !0);
	}
	function ga(e) {
		for (ua = e.return; ua;) switch (ua.tag) {
			case 5:
			case 31:
			case 13:
				fa = !1;
				return;
			case 27:
			case 3:
				fa = !0;
				return;
			default: ua = ua.return;
		}
	}
	function _a(e) {
		if (e !== ua) return !1;
		if (!P) return ga(e), P = !0, !1;
		var t = e.tag, n;
		if ((n = t !== 3 && t !== 27) && ((n = t === 5) && (n = e.type, n = n === "form" || n === "button" || pp(e.type, e.memoizedProps)), n = !n), n && N && ma(e), ga(e), t === 13) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
			N = dm(e);
		} else if (t === 31) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
			N = dm(e);
		} else t === 27 ? (t = N, Sp(e.type) ? (e = um, um = null, N = e) : N = t) : N = ua ? lm(e.stateNode.nextSibling) : null;
		return !0;
	}
	function va() {
		N = ua = null, P = !1;
	}
	function ya() {
		var e = da;
		return e !== null && (pd === null ? pd = e : pd.push.apply(pd, e), da = null), e;
	}
	function ba(e) {
		da === null ? da = [e] : da.push(e);
	}
	var xa = De(null), F = null, Sa = null;
	function Ca(e, t, n) {
		k(xa, t._currentValue), t._currentValue = n;
	}
	function wa(e) {
		e._currentValue = xa.current, Oe(xa);
	}
	function Ta(e, t, n) {
		for (; e !== null;) {
			var r = e.alternate;
			if ((e.childLanes & t) === t ? r !== null && (r.childLanes & t) !== t && (r.childLanes |= t) : (e.childLanes |= t, r !== null && (r.childLanes |= t)), e === n) break;
			e = e.return;
		}
	}
	function Ea(e, t, n, r) {
		var a = e.child;
		for (a !== null && (a.return = e); a !== null;) {
			var o = a.dependencies;
			if (o !== null) {
				var s = a.child;
				o = o.firstContext;
				a: for (; o !== null;) {
					var c = o;
					o = a;
					for (var l = 0; l < t.length; l++) if (c.context === t[l]) {
						o.lanes |= n, c = o.alternate, c !== null && (c.lanes |= n), Ta(o.return, n, e), r || (s = null);
						break a;
					}
					o = c.next;
				}
			} else if (a.tag === 18) {
				if (s = a.return, s === null) throw Error(i(341));
				s.lanes |= n, o = s.alternate, o !== null && (o.lanes |= n), Ta(s, n, e), s = null;
			} else a.tag === 13 && a.memoizedState !== null && a.memoizedState.dehydrated === null ? (a.lanes |= n, s = a.alternate, s !== null && (s.lanes |= n), Ta(a.return, n, e), s = a.child, s = s === null ? null : s.sibling) : s = a.child;
			if (s !== null) s.return = a;
			else for (s = a; s !== null;) {
				if (s === e) {
					s = null;
					break;
				}
				if (a = s.sibling, a !== null) {
					a.return = s.return, s = a;
					break;
				}
				s = s.return;
			}
			a = s;
		}
	}
	function Da(e, t, n, r) {
		e = null;
		for (var a = t, o = !1; a !== null;) {
			if (!o) {
				if (a.flags & 524288) o = !0;
				else if (a.flags & 262144) break;
			}
			if (a.tag === 10) {
				var s = a.alternate;
				if (s === null) throw Error(i(387));
				if (s = s.memoizedProps, s !== null) {
					var c = a.type;
					Yr(a.pendingProps.value, s.value) || (e === null ? e = [c] : e.push(c));
				}
			} else if (a === Me.current) {
				if (s = a.alternate, s === null) throw Error(i(387));
				s.memoizedState.memoizedState !== a.memoizedState.memoizedState && (e === null ? e = [sh] : e.push(sh));
			}
			a = a.return;
		}
		return e !== null && Ea(t, e, n, r), t.flags |= 262144, e !== null;
	}
	function Oa(e) {
		for (e = e.firstContext; e !== null;) {
			if (!Yr(e.context._currentValue, e.memoizedValue)) return !0;
			e = e.next;
		}
		return !1;
	}
	function ka(e) {
		F = e, Sa = null, e = e.dependencies, e !== null && (e.firstContext = null);
	}
	function Aa(e) {
		return Ma(F, e);
	}
	function ja(e, t) {
		return F === null && ka(e), Ma(e, t);
	}
	function Ma(e, t) {
		var n = t._currentValue;
		if (t = {
			context: t,
			memoizedValue: n,
			next: null
		}, Sa === null) {
			if (e === null) throw Error(i(308));
			Sa = t, e.dependencies = {
				lanes: 0,
				firstContext: t
			}, e.flags |= 524288;
		} else Sa = Sa.next = t;
		return n;
	}
	var Na = typeof AbortController < "u" ? AbortController : function() {
		var e = [], t = this.signal = {
			aborted: !1,
			addEventListener: function(t, n) {
				e.push(n);
			}
		};
		this.abort = function() {
			t.aborted = !0, e.forEach(function(e) {
				return e();
			});
		};
	}, Pa = t.unstable_scheduleCallback, Fa = t.unstable_NormalPriority, I = {
		$$typeof: E,
		Consumer: null,
		Provider: null,
		_currentValue: null,
		_currentValue2: null,
		_threadCount: 0
	};
	function Ia() {
		return {
			controller: new Na(),
			data: /* @__PURE__ */ new Map(),
			refCount: 0
		};
	}
	function La(e) {
		e.refCount--, e.refCount === 0 && Pa(Fa, function() {
			e.controller.abort();
		});
	}
	function Ra(e, t) {
		if (e.pendingLanes & 4194048) {
			var n = e.transitionTypes;
			for (n === null && (n = e.transitionTypes = []), e = 0; e < t.length; e++) {
				var r = t[e];
				n.indexOf(r) === -1 && n.push(r);
			}
		}
	}
	var za = null;
	function Ba(e) {
		var t = e.transitionTypes;
		return e.transitionTypes = null, t;
	}
	var Va = null, Ha = 0, Ua = 0, Wa = null;
	function Ga(e, t) {
		if (Va === null) {
			var n = Va = [];
			Ha = 0, Ua = Pf(), Wa = {
				status: "pending",
				value: void 0,
				then: function(e) {
					n.push(e);
				}
			};
		}
		return Ha++, t.then(Ka, Ka), t;
	}
	function Ka() {
		if (--Ha === 0 && (za = null, Va !== null)) {
			Wa !== null && (Wa.status = "fulfilled");
			var e = Va;
			Va = null, Ua = 0, Wa = null;
			for (var t = 0; t < e.length; t++) (0, e[t])();
		}
	}
	function qa(e, t) {
		var n = [], r = {
			status: "pending",
			value: null,
			reason: null,
			then: function(e) {
				n.push(e);
			}
		};
		return e.then(function() {
			r.status = "fulfilled", r.value = t;
			for (var e = 0; e < n.length; e++) (0, n[e])(t);
		}, function(e) {
			for (r.status = "rejected", r.reason = e, e = 0; e < n.length; e++) (0, n[e])(void 0);
		}), r;
	}
	var Ja = D.S;
	D.S = function(e, t) {
		if (gd = Ye(), typeof t == "object" && t && typeof t.then == "function" && Ga(e, t), za !== null) for (var n = bf; n !== null;) Ra(n, za), n = n.next;
		if (n = e.types, n !== null) {
			for (var r = bf; r !== null;) Ra(r, n), r = r.next;
			if (Ua !== 0) {
				r = za, r === null && (r = za = []);
				for (var i = 0; i < n.length; i++) {
					var a = n[i];
					r.indexOf(a) === -1 && r.push(a);
				}
			}
		}
		Ja !== null && Ja(e, t);
	};
	var Ya = De(null);
	function Xa() {
		var e = Ya.current;
		return e === null ? K.pooledCache : e;
	}
	function Za(e, t) {
		t === null ? k(Ya, Ya.current) : k(Ya, t.pool);
	}
	function Qa() {
		var e = Xa();
		return e === null ? null : {
			parent: I._currentValue,
			pool: e
		};
	}
	var $a = Error(i(460)), eo = Error(i(474)), to = Error(i(542)), no = { then: function() {} };
	function ro(e) {
		return e = e.status, e === "fulfilled" || e === "rejected";
	}
	function io(e, t, n) {
		switch (n = e[n], n === void 0 ? e.push(t) : n !== t && (t.then(En, En), t = n), t.status) {
			case "fulfilled": return t.value;
			case "rejected": throw e = t.reason, co(e), e === void 0 && !("reason" in t) ? Error(i(600)) : e;
			default:
				if (typeof t.status == "string") t.then(En, En);
				else {
					if (e = K, e !== null && 100 < e.shellSuspendCounter) throw Error(i(482));
					e = t, e.status = "pending", e.then(function(e) {
						if (t.status === "pending") {
							var n = t;
							n.status = "fulfilled", n.value = e;
						}
					}, function(e) {
						if (t.status === "pending") {
							var n = t;
							n.status = "rejected", n.reason = e;
						}
					});
				}
				switch (t.status) {
					case "fulfilled": return t.value;
					case "rejected": throw e = t.reason, co(e), e;
				}
				throw oo = t, $a;
		}
	}
	function ao(e) {
		try {
			var t = e._init;
			return t(e._payload);
		} catch (e) {
			throw typeof e == "object" && e && typeof e.then == "function" ? (oo = e, $a) : e;
		}
	}
	var oo = null;
	function so() {
		if (oo === null) throw Error(i(459));
		var e = oo;
		return oo = null, e;
	}
	function co(e) {
		if (e === $a || e === to) throw Error(i(483));
	}
	var lo = null, uo = 0;
	function fo(e) {
		var t = uo;
		return uo += 1, lo === null && (lo = []), io(lo, e, t);
	}
	function po(e, t) {
		t = t.props.ref, e.ref = t === void 0 ? null : t;
	}
	function mo(e, t) {
		throw t.$$typeof === ie ? Error(i(525)) : (e = Object.prototype.toString.call(t), Error(i(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)));
	}
	function ho(e) {
		function t(t, n) {
			if (e) {
				var r = t.deletions;
				r === null ? (t.deletions = [n], t.flags |= 16) : r.push(n);
			}
		}
		function n(n, r) {
			if (!e) return null;
			for (; r !== null;) t(n, r), r = r.sibling;
			return null;
		}
		function r(e) {
			for (var t = /* @__PURE__ */ new Map(); e !== null;) e.key === null ? t.set(e.index, e) : t.set(e.key, e), e = e.sibling;
			return t;
		}
		function a(e, t) {
			return e = Vi(e, t), e.index = 0, e.sibling = null, e;
		}
		function o(t, n, r) {
			return t.index = r, e ? (r = t.alternate, r === null ? (t.flags |= 134217730, n) : (r = r.index, r < n ? (t.flags |= 2, n) : r)) : (t.flags |= 1048576, n);
		}
		function s(t) {
			return e && t.alternate === null && (t.flags |= 134217730), t;
		}
		function c(e, t, n, r) {
			return t === null || t.tag !== 6 ? (t = Gi(n, e.mode, r), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function l(e, t, n, r) {
			var i = n.type;
			return i === w ? (e = d(e, t, n.props.children, r, n.key), po(e, n), e) : t !== null && (t.elementType === i || typeof i == "object" && i && i.$$typeof === pe && ao(i) === t.type) ? (t = a(t, n.props), po(t, n), t.return = e, t) : (t = Ui(n.type, n.key, n.props, null, e.mode, r), po(t, n), t.return = e, t);
		}
		function u(e, t, n, r) {
			return t === null || t.tag !== 4 || t.stateNode.containerInfo !== n.containerInfo || t.stateNode.implementation !== n.implementation ? (t = qi(n, e.mode, r), t.return = e, t) : (t = a(t, n.children || []), t.return = e, t);
		}
		function d(e, t, n, r, i) {
			return t === null || t.tag !== 7 ? (t = Wi(n, e.mode, r, i), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function f(e, t, n) {
			if (typeof t == "string" && t !== "" || typeof t == "number" || typeof t == "bigint") return t = Gi("" + t, e.mode, n), t.return = e, t;
			if (typeof t == "object" && t) {
				switch (t.$$typeof) {
					case ae: return n = Ui(t.type, t.key, t.props, null, e.mode, n), po(n, t), n.return = e, n;
					case oe: return t = qi(t, e.mode, n), t.return = e, t;
					case pe: return t = ao(t), f(e, t, n);
				}
				if (Ce(t) || be(t)) return t = Wi(t, e.mode, n, null), t.return = e, t;
				if (typeof t.then == "function") return f(e, fo(t), n);
				if (t.$$typeof === E) return f(e, ja(e, t), n);
				mo(e, t);
			}
			return null;
		}
		function p(e, t, n, r) {
			var i = t === null ? null : t.key;
			if (typeof n == "string" && n !== "" || typeof n == "number" || typeof n == "bigint") return i === null ? c(e, t, "" + n, r) : null;
			if (typeof n == "object" && n) {
				switch (n.$$typeof) {
					case ae: return n.key === i ? l(e, t, n, r) : null;
					case oe: return n.key === i ? u(e, t, n, r) : null;
					case pe: return n = ao(n), p(e, t, n, r);
				}
				if (Ce(n) || be(n)) return i === null ? d(e, t, n, r, null) : null;
				if (typeof n.then == "function") return p(e, t, fo(n), r);
				if (n.$$typeof === E) return p(e, t, ja(e, n), r);
				mo(e, n);
			}
			return null;
		}
		function m(e, t, n, r, i) {
			if (typeof r == "string" && r !== "" || typeof r == "number" || typeof r == "bigint") return e = e.get(n) || null, c(t, e, "" + r, i);
			if (typeof r == "object" && r) {
				switch (r.$$typeof) {
					case ae: return e = e.get(r.key === null ? n : r.key) || null, l(t, e, r, i);
					case oe: return e = e.get(r.key === null ? n : r.key) || null, u(t, e, r, i);
					case pe: return r = ao(r), m(e, t, n, r, i);
				}
				if (Ce(r) || be(r)) return e = e.get(n) || null, d(t, e, r, i, null);
				if (typeof r.then == "function") return m(e, t, n, fo(r), i);
				if (r.$$typeof === E) return m(e, t, n, ja(t, r), i);
				mo(t, r);
			}
			return null;
		}
		function h(i, a, s, c) {
			for (var l = null, u = null, d = a, h = a = 0, g = null; d !== null && h < s.length; h++) {
				d.index > h ? (g = d, d = null) : g = d.sibling;
				var _ = p(i, d, s[h], c);
				if (_ === null) {
					d === null && (d = g);
					break;
				}
				e && d && _.alternate === null && t(i, d), a = o(_, a, h), u === null ? l = _ : u.sibling = _, u = _, d = g;
			}
			if (h === s.length) return n(i, d), P && aa(i, h), l;
			if (d === null) {
				for (; h < s.length; h++) d = f(i, s[h], c), d !== null && (a = o(d, a, h), u === null ? l = d : u.sibling = d, u = d);
				return P && aa(i, h), l;
			}
			for (d = r(d); h < s.length; h++) g = m(d, i, h, s[h], c), g !== null && (e && (_ = g.alternate, _ !== null && d.delete(_.key === null ? h : _.key)), a = o(g, a, h), u === null ? l = g : u.sibling = g, u = g);
			return e && d.forEach(function(e) {
				return t(i, e);
			}), P && aa(i, h), l;
		}
		function g(a, s, c, l) {
			if (c == null) throw Error(i(151));
			for (var u = null, d = null, h = s, g = s = 0, _ = null, v = c.next(); h !== null && !v.done; g++, v = c.next()) {
				h.index > g ? (_ = h, h = null) : _ = h.sibling;
				var y = p(a, h, v.value, l);
				if (y === null) {
					h === null && (h = _);
					break;
				}
				e && h && y.alternate === null && t(a, h), s = o(y, s, g), d === null ? u = y : d.sibling = y, d = y, h = _;
			}
			if (v.done) return n(a, h), P && aa(a, g), u;
			if (h === null) {
				for (; !v.done; g++, v = c.next()) v = f(a, v.value, l), v !== null && (s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
				return P && aa(a, g), u;
			}
			for (h = r(h); !v.done; g++, v = c.next()) v = m(h, a, g, v.value, l), v !== null && (e && (_ = v.alternate, _ !== null && h.delete(_.key === null ? g : _.key)), s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
			return e && h.forEach(function(e) {
				return t(a, e);
			}), P && aa(a, g), u;
		}
		function _(e, r, o, c) {
			if (typeof o == "object" && o && o.type === w && o.key === null && o.props.ref === void 0 && (o = o.props.children), typeof o == "object" && o) {
				switch (o.$$typeof) {
					case ae:
						a: {
							for (var l = o.key; r !== null;) {
								if (r.key === l) {
									if (l = o.type, l === w) {
										if (r.tag === 7) {
											n(e, r.sibling), c = a(r, o.props.children), po(c, o), c.return = e, e = c;
											break a;
										}
									} else if (r.elementType === l || typeof l == "object" && l && l.$$typeof === pe && ao(l) === r.type) {
										n(e, r.sibling), c = a(r, o.props), po(c, o), c.return = e, e = c;
										break a;
									}
									n(e, r);
									break;
								}
								t(e, r), r = r.sibling;
							}
							o.type === w ? (c = Wi(o.props.children, e.mode, c, o.key), po(c, o), c.return = e, e = c) : (c = Ui(o.type, o.key, o.props, null, e.mode, c), po(c, o), c.return = e, e = c);
						}
						return s(e);
					case oe:
						a: {
							for (l = o.key; r !== null;) {
								if (r.key === l) {
									if (r.tag === 4 && r.stateNode.containerInfo === o.containerInfo && r.stateNode.implementation === o.implementation) {
										n(e, r.sibling), c = a(r, o.children || []), c.return = e, e = c;
										break a;
									}
									n(e, r);
									break;
								}
								t(e, r), r = r.sibling;
							}
							c = qi(o, e.mode, c), c.return = e, e = c;
						}
						return s(e);
					case pe: return o = ao(o), _(e, r, o, c);
				}
				if (Ce(o)) return h(e, r, o, c);
				if (be(o)) {
					if (l = be(o), typeof l != "function") throw Error(i(150));
					return o = l.call(o), g(e, r, o, c);
				}
				if (typeof o.then == "function") return _(e, r, fo(o), c);
				if (o.$$typeof === E) return _(e, r, ja(e, o), c);
				mo(e, o);
			}
			return typeof o == "string" && o !== "" || typeof o == "number" || typeof o == "bigint" ? (o = "" + o, r !== null && r.tag === 6 ? (n(e, r.sibling), c = a(r, o), c.return = e, e = c) : (n(e, r), c = Gi(o, e.mode, c), c.return = e, e = c), s(e)) : n(e, r);
		}
		return function(e, t, n, r) {
			try {
				uo = 0;
				var i = _(e, t, n, r);
				return lo = null, i;
			} catch (t) {
				if (t === $a || t === to) throw t;
				var a = zi(29, t, null, e.mode);
				return a.lanes = r, a.return = e, a;
			}
		};
	}
	var go = ho(!0), _o = ho(!1), vo = !1;
	function yo(e) {
		e.updateQueue = {
			baseState: e.memoizedState,
			firstBaseUpdate: null,
			lastBaseUpdate: null,
			shared: {
				pending: null,
				lanes: 0,
				hiddenCallbacks: null
			},
			callbacks: null
		};
	}
	function bo(e, t) {
		e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
			baseState: e.baseState,
			firstBaseUpdate: e.firstBaseUpdate,
			lastBaseUpdate: e.lastBaseUpdate,
			shared: e.shared,
			callbacks: null
		});
	}
	function xo(e) {
		return {
			lane: e,
			tag: 0,
			payload: null,
			callback: null,
			next: null
		};
	}
	function So(e, t, n) {
		var r = e.updateQueue;
		if (r === null) return null;
		if (r = r.shared, G & 2) {
			var i = r.pending;
			return i === null ? t.next = t : (t.next = i.next, i.next = t), r.pending = t, t = Ii(e), Fi(e, null, n), t;
		}
		return Mi(e, r, t, n), Ii(e);
	}
	function Co(e, t, n) {
		if (t = t.updateQueue, t !== null && (t = t.shared, n & 4194048)) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, Ct(e, n);
		}
	}
	function wo(e, t) {
		var n = e.updateQueue, r = e.alternate;
		if (r !== null && (r = r.updateQueue, n === r)) {
			var i = null, a = null;
			if (n = n.firstBaseUpdate, n !== null) {
				do {
					var o = {
						lane: n.lane,
						tag: n.tag,
						payload: n.payload,
						callback: null,
						next: null
					};
					a === null ? i = a = o : a = a.next = o, n = n.next;
				} while (n !== null);
				a === null ? i = a = t : a = a.next = t;
			} else i = a = t;
			n = {
				baseState: r.baseState,
				firstBaseUpdate: i,
				lastBaseUpdate: a,
				shared: r.shared,
				callbacks: r.callbacks
			}, e.updateQueue = n;
		} else e = n.lastBaseUpdate, e === null ? n.firstBaseUpdate = t : e.next = t, n.lastBaseUpdate = t;
	}
	var To = !1;
	function Eo() {
		if (To) {
			var e = Wa;
			if (e !== null) throw e;
		}
	}
	function Do(e, t, n, r) {
		To = !1;
		var i = e.updateQueue;
		vo = !1;
		var a = i.firstBaseUpdate, o = i.lastBaseUpdate, s = i.shared.pending;
		if (s !== null) {
			i.shared.pending = null;
			var c = s, l = c.next;
			c.next = null, o === null ? a = l : o.next = l, o = c;
			var u = e.alternate;
			u !== null && (u = u.updateQueue, s = u.lastBaseUpdate, s !== o && (s === null ? u.firstBaseUpdate = l : s.next = l, u.lastBaseUpdate = c));
		}
		if (a !== null) {
			var d = i.baseState;
			o = 0, u = l = c = null, s = a;
			do {
				var f = s.lane & -536870913, p = f !== s.lane;
				if (p ? (J & f) === f : (r & f) === f) {
					f !== 0 && f === Ua && (To = !0), u !== null && (u = u.next = {
						lane: 0,
						tag: s.tag,
						payload: s.payload,
						callback: null,
						next: null
					});
					a: {
						var m = e, h = s;
						f = t;
						var g = n;
						switch (h.tag) {
							case 1:
								if (m = h.payload, typeof m == "function") {
									d = m.call(g, d, f);
									break a;
								}
								d = m;
								break a;
							case 3: m.flags = m.flags & -65537 | 128;
							case 0:
								if (m = h.payload, f = typeof m == "function" ? m.call(g, d, f) : m, f == null) break a;
								d = C({}, d, f);
								break a;
							case 2: vo = !0;
						}
					}
					f = s.callback, f !== null && (e.flags |= 64, p && (e.flags |= 8192), p = i.callbacks, p === null ? i.callbacks = [f] : p.push(f));
				} else p = {
					lane: f,
					tag: s.tag,
					payload: s.payload,
					callback: s.callback,
					next: null
				}, u === null ? (l = u = p, c = d) : u = u.next = p, o |= f;
				if (s = s.next, s === null) {
					if (s = i.shared.pending, s === null) break;
					p = s, s = p.next, p.next = null, i.lastBaseUpdate = p, i.shared.pending = null;
				}
			} while (1);
			u === null && (c = d), i.baseState = c, i.firstBaseUpdate = l, i.lastBaseUpdate = u, a === null && (i.shared.lanes = 0), sd |= o, e.lanes = o, e.memoizedState = d;
		}
	}
	function Oo(e, t) {
		if (typeof e != "function") throw Error(i(191, e));
		e.call(t);
	}
	function ko(e, t) {
		var n = e.callbacks;
		if (n !== null) for (e.callbacks = null, e = 0; e < n.length; e++) Oo(n[e], t);
	}
	var Ao = De(null), jo = De(0);
	function Mo(e, t) {
		e = ad, k(jo, e), k(Ao, t), ad = e | t.baseLanes;
	}
	function No() {
		k(jo, ad), k(Ao, Ao.current);
	}
	function L() {
		ad = jo.current, Oe(Ao), Oe(jo);
	}
	var Po = De(null), Fo = null;
	function Io(e) {
		var t = e.alternate;
		k(Vo, Vo.current & 1), k(Po, e), Fo === null && (t === null || Ao.current !== null || t.memoizedState !== null) && (Fo = e);
	}
	function Lo(e) {
		k(Vo, Vo.current), k(Po, e), Fo === null && (Fo = e);
	}
	function Ro(e) {
		e.tag === 22 ? (k(Vo, Vo.current), k(Po, e), Fo === null && (Fo = e)) : zo();
	}
	function zo() {
		k(Vo, Vo.current), k(Po, Po.current);
	}
	function Bo(e) {
		Oe(Po), Fo === e && (Fo = null), Oe(Vo);
	}
	var Vo = De(0);
	function Ho(e, t) {
		k(Po, Po.current), k(Vo, t);
	}
	function Uo(e) {
		Oe(Vo), Oe(Po), Fo === e && (Fo = null);
	}
	function Wo(e) {
		for (var t = e; t !== null;) {
			if (t.tag === 13) {
				var n = t.memoizedState;
				if (n !== null && (n = n.dehydrated, n === null || om(n) || sm(n))) return t;
			} else if (t.tag === 19 && t.memoizedProps.revealOrder !== "independent") {
				if (t.flags & 128) return t;
			} else if (t.child !== null) {
				t.child.return = t, t = t.child;
				continue;
			}
			if (t === e) break;
			for (; t.sibling === null;) {
				if (t.return === null || t.return === e) return null;
				t = t.return;
			}
			t.sibling.return = t.return, t = t.sibling;
		}
		return null;
	}
	var Go = 0, R = null, z = null, B = null, Ko = !1, qo = !1, Jo = !1, Yo = 0, Xo = 0, Zo = null, Qo = 0;
	function V() {
		throw Error(i(321));
	}
	function $o(e, t) {
		if (t === null) return !1;
		for (var n = 0; n < t.length && n < e.length; n++) if (!Yr(e[n], t[n])) return !1;
		return !0;
	}
	function es(e, t, n, r, i, a) {
		return Go = a, R = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, D.H = e === null || e.memoizedState === null ? _c : vc, Jo = !1, a = n(r, i), Jo = !1, qo && (a = ns(t, n, r, i)), ts(e), a;
	}
	function ts(e) {
		D.H = gc;
		var t = z !== null && z.next !== null;
		if (Go = 0, B = z = R = null, Ko = !1, Xo = 0, Zo = null, t) throw Error(i(300));
		e === null || Fc || (e = e.dependencies, e !== null && Oa(e) && (Fc = !0));
	}
	function ns(e, t, n, r) {
		R = e;
		var a = 0;
		do {
			if (qo && (Zo = null), Xo = 0, qo = !1, 25 <= a) throw Error(i(301));
			if (a += 1, B = z = null, e.updateQueue != null) {
				var o = e.updateQueue;
				o.lastEffect = null, o.events = null, o.stores = null, o.memoCache != null && (o.memoCache.index = 0);
			}
			D.H = yc, o = t(n, r);
		} while (qo);
		return o;
	}
	function rs() {
		var e = D.H, t = e.useState()[0];
		return t = typeof t.then == "function" ? us(t) : t, e = e.useState()[0], (z === null ? null : z.memoizedState) !== e && (R.flags |= 1024), t;
	}
	function is() {
		var e = Yo !== 0;
		return Yo = 0, e;
	}
	function as(e, t, n) {
		t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~n;
	}
	function os(e) {
		if (Ko) {
			for (e = e.memoizedState; e !== null;) {
				var t = e.queue;
				t !== null && (t.pending = null), e = e.next;
			}
			Ko = !1;
		}
		Go = 0, B = z = R = null, qo = !1, Xo = Yo = 0, Zo = null;
	}
	function ss() {
		var e = {
			memoizedState: null,
			baseState: null,
			baseQueue: null,
			queue: null,
			next: null
		};
		return B === null ? R.memoizedState = B = e : B = B.next = e, B;
	}
	function cs() {
		if (z === null) {
			var e = R.alternate;
			e = e === null ? null : e.memoizedState;
		} else e = z.next;
		var t = B === null ? R.memoizedState : B.next;
		if (t !== null) B = t, z = e;
		else {
			if (e === null) throw R.alternate === null ? Error(i(467)) : Error(i(310));
			z = e, e = {
				memoizedState: z.memoizedState,
				baseState: z.baseState,
				baseQueue: z.baseQueue,
				queue: z.queue,
				next: null
			}, B === null ? R.memoizedState = B = e : B = B.next = e;
		}
		return B;
	}
	function ls() {
		return {
			lastEffect: null,
			events: null,
			stores: null,
			memoCache: null
		};
	}
	function us(e) {
		var t = Xo;
		return Xo += 1, Zo === null && (Zo = []), e = io(Zo, e, t), t = R, (B === null ? t.memoizedState : B.next) === null && (t = t.alternate, D.H = t === null || t.memoizedState === null ? _c : vc), e;
	}
	function ds(e) {
		if (typeof e == "object" && e) {
			if (typeof e.then == "function") return us(e);
			if (e.$$typeof === ve) return;
			if (e.$$typeof === E) return Aa(e);
		}
		throw Error(i(438, String(e)));
	}
	function fs(e) {
		var t = null, n = R.updateQueue;
		if (n !== null && (t = n.memoCache), t == null) {
			var r = R.alternate;
			r !== null && (r = r.updateQueue, r !== null && (r = r.memoCache, r != null && (t = {
				data: r.data.map(function(e) {
					return e.slice();
				}),
				index: 0
			})));
		}
		if (t ??= {
			data: [],
			index: 0
		}, n === null && (n = ls(), R.updateQueue = n), n.memoCache = t, n = t.data[t.index], n === void 0) for (n = t.data[t.index] = Array(e), r = 0; r < e; r++) n[r] = ge;
		return t.index++, n;
	}
	function ps(e, t) {
		return typeof t == "function" ? t(e) : t;
	}
	function ms(e) {
		return hs(cs(), z, e);
	}
	function hs(e, t, n) {
		var r = e.queue;
		if (r === null) throw Error(i(311));
		r.lastRenderedReducer = n;
		var a = e.baseQueue, o = r.pending;
		if (o !== null) {
			if (a !== null) {
				var s = a.next;
				a.next = o.next, o.next = s;
			}
			t.baseQueue = a = o, r.pending = null;
		}
		if (o = e.baseState, a === null) e.memoizedState = o;
		else {
			t = a.next;
			var c = s = null, l = null, u = t, d = !1;
			do {
				var f = u.lane & -536870913;
				if (f === u.lane ? (Go & f) === f : (J & f) === f) {
					var p = u.revertLane;
					if (p === 0) l !== null && (l = l.next = {
						lane: 0,
						revertLane: 0,
						gesture: null,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}), f === Ua && (d = !0);
					else if ((Go & p) === p) {
						u = u.next, p === Ua && (d = !0);
						continue;
					} else f = {
						lane: 0,
						revertLane: u.revertLane,
						gesture: null,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}, l === null ? (c = l = f, s = o) : l = l.next = f, R.lanes |= p, sd |= p;
					f = u.action, Jo && n(o, f), o = u.hasEagerState ? u.eagerState : n(o, f);
				} else p = {
					lane: f,
					revertLane: u.revertLane,
					gesture: u.gesture,
					action: u.action,
					hasEagerState: u.hasEagerState,
					eagerState: u.eagerState,
					next: null
				}, l === null ? (c = l = p, s = o) : l = l.next = p, R.lanes |= f, sd |= f;
				u = u.next;
			} while (u !== null && u !== t);
			if (l === null ? s = o : l.next = c, !Yr(o, e.memoizedState) && (Fc = !0, d && (n = Wa, n !== null))) throw n;
			e.memoizedState = o, e.baseState = s, e.baseQueue = l, r.lastRenderedState = o;
		}
		return a === null && (r.lanes = 0), [e.memoizedState, r.dispatch];
	}
	function gs(e) {
		var t = cs(), n = t.queue;
		if (n === null) throw Error(i(311));
		n.lastRenderedReducer = e;
		var r = n.dispatch, a = n.pending, o = t.memoizedState;
		if (a !== null) {
			n.pending = null;
			var s = a = a.next;
			do
				o = e(o, s.action), s = s.next;
			while (s !== a);
			Yr(o, t.memoizedState) || (Fc = !0), t.memoizedState = o, t.baseQueue === null && (t.baseState = o), n.lastRenderedState = o;
		}
		return [o, r];
	}
	function _s(e, t, n) {
		var r = R, a = cs(), o = P;
		if (o) {
			if (n === void 0) throw Error(i(407));
			n = n();
		} else n = t();
		var s = !Yr((z || a).memoizedState, n);
		if (s && (a.memoizedState = n, Fc = !0), a = a.queue, Hs(bs.bind(null, r, a, e), [e]), e = a.getSnapshot !== t || s || B !== null && !!(B.memoizedState.tag & 1), Ls(e ? 9 : 8, { destroy: void 0 }, ys.bind(null, r, a, n, t), null), e) {
			if (r.flags |= 2048, K === null) throw Error(i(349));
			o || Go & 127 || vs(r, t, n);
		}
		return n;
	}
	function vs(e, t, n) {
		e.flags |= 16384, e = {
			getSnapshot: t,
			value: n
		}, t = R.updateQueue, t === null ? (t = ls(), R.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
	}
	function ys(e, t, n, r) {
		t.value = n, t.getSnapshot = r, xs(t) && Ss(e);
	}
	function bs(e, t, n) {
		return n(function() {
			xs(t) && Ss(e);
		});
	}
	function xs(e) {
		var t = e.getSnapshot;
		e = e.value;
		try {
			var n = t();
			return !Yr(e, n);
		} catch {
			return !0;
		}
	}
	function Ss(e) {
		var t = Pi(e, 2);
		t !== null && Pd(t, e, 2);
	}
	function Cs(e) {
		var t = ss();
		if (typeof e == "function") {
			var n = e;
			if (e = n(), Jo) {
				ot(!0);
				try {
					n();
				} finally {
					ot(!1);
				}
			}
		}
		return t.memoizedState = t.baseState = e, t.queue = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: ps,
			lastRenderedState: e
		}, t;
	}
	function ws(e, t, n, r) {
		return e.baseState = n, hs(e, z, typeof r == "function" ? r : ps);
	}
	function Ts(e, t, n, r, a) {
		if (pc(e)) throw Error(i(485));
		if (e = t.action, e !== null) {
			var o = {
				payload: a,
				action: e,
				next: null,
				isTransition: !0,
				status: "pending",
				value: null,
				reason: null,
				listeners: [],
				then: function(e) {
					o.listeners.push(e);
				}
			};
			D.T === null ? o.isTransition = !1 : n(!0), r(o), n = t.pending, n === null ? (o.next = t.pending = o, Es(t, o)) : (o.next = n.next, t.pending = n.next = o);
		}
	}
	function Es(e, t) {
		var n = t.action, r = t.payload, i = e.state;
		if (t.isTransition) {
			var a = D.T, o = {};
			o.types = a === null ? null : a.types, D.T = o;
			try {
				var s = n(i, r), c = D.S;
				c !== null && c(o, s), Ds(e, t, s);
			} catch (n) {
				ks(e, t, n);
			} finally {
				a !== null && o.types !== null && (a.types = o.types), D.T = a;
			}
		} else try {
			a = n(i, r), Ds(e, t, a);
		} catch (n) {
			ks(e, t, n);
		}
	}
	function Ds(e, t, n) {
		typeof n == "object" && n && typeof n.then == "function" ? n.then(function(n) {
			Os(e, t, n);
		}, function(n) {
			return ks(e, t, n);
		}) : Os(e, t, n);
	}
	function Os(e, t, n) {
		t.status = "fulfilled", t.value = n, As(t), e.state = n, t = e.pending, t !== null && (n = t.next, n === t ? e.pending = null : (n = n.next, t.next = n, Es(e, n)));
	}
	function ks(e, t, n) {
		var r = e.pending;
		if (e.pending = null, r !== null) {
			r = r.next;
			do
				t.status = "rejected", t.reason = n, As(t), t = t.next;
			while (t !== r);
		}
		e.action = null;
	}
	function As(e) {
		e = e.listeners;
		for (var t = 0; t < e.length; t++) (0, e[t])();
	}
	function js(e, t) {
		return t;
	}
	function Ms(e, t) {
		if (P) {
			var n = K.formState;
			if (n !== null) {
				a: {
					var r = R;
					if (P) {
						if (N) {
							b: {
								for (var i = N, a = fa; i.nodeType !== 8;) if (!a || (i = lm(i.nextSibling), i === null)) {
									i = null;
									break b;
								}
								a = i.data, i = a === "F!" || a === "F" ? i : null;
							}
							if (i) {
								N = lm(i.nextSibling), r = i.data === "F!";
								break a;
							}
						}
						ma(r);
					}
					r = !1;
				}
				r && (t = n[0]);
			}
		}
		return n = ss(), n.memoizedState = n.baseState = t, r = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: js,
			lastRenderedState: t
		}, n.queue = r, n = uc.bind(null, R, r), r.dispatch = n, r = Cs(!1), a = fc.bind(null, R, !1, r.queue), r = ss(), i = {
			state: t,
			dispatch: null,
			action: e,
			pending: null
		}, r.queue = i, n = Ts.bind(null, R, i, a, n), i.dispatch = n, r.memoizedState = e, [
			t,
			n,
			!1
		];
	}
	function Ns(e) {
		return Ps(cs(), z, e);
	}
	function Ps(e, t, n) {
		if (t = hs(e, t, js)[0], e = ms(ps)[0], typeof t == "object" && t && typeof t.then == "function") try {
			var r = us(t);
		} catch (e) {
			throw e === $a ? to : e;
		}
		else r = t;
		t = cs();
		var i = t.queue, a = i.dispatch;
		return n !== t.memoizedState && (R.flags |= 2048, Ls(9, { destroy: void 0 }, Fs.bind(null, i, n), null)), [
			r,
			a,
			e
		];
	}
	function Fs(e, t) {
		e.action = t;
	}
	function Is(e) {
		var t = cs(), n = z;
		if (n !== null) return Ps(t, n, e);
		cs(), t = t.memoizedState, n = cs();
		var r = n.queue.dispatch;
		return n.memoizedState = e, [
			t,
			r,
			!1
		];
	}
	function Ls(e, t, n, r) {
		return e = {
			tag: e,
			create: n,
			deps: r,
			inst: t,
			next: null
		}, t = R.updateQueue, t === null && (t = ls(), R.updateQueue = t), n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e), e;
	}
	function Rs() {
		return cs().memoizedState;
	}
	function zs(e, t, n, r) {
		var i = ss();
		R.flags |= e, i.memoizedState = Ls(1 | t, { destroy: void 0 }, n, r === void 0 ? null : r);
	}
	function Bs(e, t, n, r) {
		var i = cs();
		r = r === void 0 ? null : r;
		var a = i.memoizedState.inst;
		z !== null && r !== null && $o(r, z.memoizedState.deps) ? i.memoizedState = Ls(t, a, n, r) : (R.flags |= e, i.memoizedState = Ls(1 | t, a, n, r));
	}
	function Vs(e, t) {
		zs(8390656, 8, e, t);
	}
	function Hs(e, t) {
		Bs(2048, 8, e, t);
	}
	function Us(e) {
		R.flags |= 4;
		var t = R.updateQueue;
		if (t === null) t = ls(), R.updateQueue = t, t.events = [e];
		else {
			var n = t.events;
			n === null ? t.events = [e] : n.push(e);
		}
	}
	function Ws(e) {
		var t = cs().memoizedState;
		return Us({
			ref: t,
			nextImpl: e
		}), function() {
			if (G & 2) throw Error(i(440));
			return t.impl.apply(void 0, arguments);
		};
	}
	function Gs(e, t) {
		return Bs(4, 2, e, t);
	}
	function Ks(e, t) {
		return Bs(4, 4, e, t);
	}
	function qs(e, t) {
		if (typeof t == "function") {
			e = e();
			var n = t(e);
			return function() {
				typeof n == "function" ? n() : t(null);
			};
		}
		if (t != null) return e = e(), t.current = e, function() {
			t.current = null;
		};
	}
	function Js(e, t, n) {
		n = n == null ? null : n.concat([e]), Bs(4, 4, qs.bind(null, t, e), n);
	}
	function Ys() {}
	function Xs(e, t) {
		var n = cs();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		return t !== null && $o(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
	}
	function Zs(e, t) {
		var n = cs();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		if (t !== null && $o(t, r[1])) return r[0];
		if (r = e(), Jo) {
			ot(!0);
			try {
				e();
			} finally {
				ot(!1);
			}
		}
		return n.memoizedState = [r, t], r;
	}
	function Qs(e, t, n) {
		return n === void 0 || Go & 1073741824 && !(J & 261930) ? e.memoizedState = t : (e.memoizedState = n, e = Md(), R.lanes |= e, sd |= e, n);
	}
	function $s(e, t, n, r) {
		return Yr(n, t) ? n : Ao.current === null ? !(Go & 106) || Go & 1073741824 && !(J & 261930) ? (Fc = !0, e.memoizedState = n) : (e = Md(), R.lanes |= e, sd |= e, t) : (e = Qs(e, n, r), Yr(e, t) || (Fc = !0), e);
	}
	function ec(e, t, n, r, i) {
		var a = O.p;
		O.p = a !== 0 && 8 > a ? a : 8;
		var o = D.T, s = {};
		s.types = o === null ? null : o.types, D.T = s, fc(e, !1, t, n);
		try {
			var c = i(), l = D.S;
			l !== null && l(s, c), typeof c == "object" && c && typeof c.then == "function" ? dc(e, t, qa(c, r), jd(e)) : dc(e, t, r, jd(e));
		} catch (n) {
			dc(e, t, {
				then: function() {},
				status: "rejected",
				reason: n
			}, jd());
		} finally {
			O.p = a, o !== null && s.types !== null && (o.types = s.types), D.T = o;
		}
	}
	function tc() {}
	function nc(e, t, n, r) {
		if (e.tag !== 5) throw Error(i(476));
		var a = rc(e).queue;
		ec(e, a, t, we, n === null ? tc : function() {
			return ic(e), n(r);
		});
	}
	function rc(e) {
		var t = e.memoizedState;
		if (t !== null) return t;
		t = {
			memoizedState: we,
			baseState: we,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: ps,
				lastRenderedState: we
			},
			next: null
		};
		var n = {};
		return t.next = {
			memoizedState: n,
			baseState: n,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: ps,
				lastRenderedState: n
			},
			next: null
		}, e.memoizedState = t, e = e.alternate, e !== null && (e.memoizedState = t), t;
	}
	function ic(e) {
		var t = rc(e);
		t.next === null && (t = e.alternate.memoizedState), dc(e, t.next.queue, {}, jd());
	}
	function ac() {
		return Aa(sh);
	}
	function oc() {
		return cs().memoizedState;
	}
	function sc() {
		return cs().memoizedState;
	}
	function cc(e) {
		for (var t = e.return; t !== null;) {
			switch (t.tag) {
				case 24:
				case 3:
					var n = jd();
					e = xo(n);
					var r = So(t, e, n);
					r !== null && (Pd(r, t, n), Co(r, t, n)), t = { cache: Ia() }, e.payload = t;
					return;
			}
			t = t.return;
		}
	}
	function lc(e, t, n) {
		var r = jd();
		n = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, pc(e) ? mc(t, n) : (n = Ni(e, t, n, r), n !== null && (Pd(n, e, r), hc(n, t, r)));
	}
	function uc(e, t, n) {
		dc(e, t, n, jd());
	}
	function dc(e, t, n, r) {
		var i = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		};
		if (pc(e)) mc(t, i);
		else {
			var a = e.alternate;
			if (e.lanes === 0 && (a === null || a.lanes === 0) && (a = t.lastRenderedReducer, a !== null)) try {
				var o = t.lastRenderedState, s = a(o, n);
				if (i.hasEagerState = !0, i.eagerState = s, Yr(s, o)) return Mi(e, t, i, 0), K === null && ji(), !1;
			} catch {}
			if (n = Ni(e, t, i, r), n !== null) return Pd(n, e, r), hc(n, t, r), !0;
		}
		return !1;
	}
	function fc(e, t, n, r) {
		if (r = {
			lane: 2,
			revertLane: Pf(),
			gesture: null,
			action: r,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, pc(e)) {
			if (t) throw Error(i(479));
		} else t = Ni(e, n, r, 2), t !== null && Pd(t, e, 2);
	}
	function pc(e) {
		var t = e.alternate;
		return e === R || t !== null && t === R;
	}
	function mc(e, t) {
		qo = Ko = !0;
		var n = e.pending;
		n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
	}
	function hc(e, t, n) {
		if (n & 4194048) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, Ct(e, n);
		}
	}
	var gc = {
		readContext: Aa,
		use: ds,
		useCallback: V,
		useContext: V,
		useEffect: V,
		useImperativeHandle: V,
		useLayoutEffect: V,
		useInsertionEffect: V,
		useMemo: V,
		useReducer: V,
		useRef: V,
		useState: V,
		useDebugValue: V,
		useDeferredValue: V,
		useTransition: V,
		useSyncExternalStore: V,
		useId: V,
		useHostTransitionStatus: V,
		useFormState: V,
		useActionState: V,
		useOptimistic: V,
		useMemoCache: V,
		useCacheRefresh: V,
		useEffectEvent: V
	}, _c = {
		readContext: Aa,
		use: ds,
		useCallback: function(e, t) {
			return ss().memoizedState = [e, t === void 0 ? null : t], e;
		},
		useContext: Aa,
		useEffect: Vs,
		useImperativeHandle: function(e, t, n) {
			n = n == null ? null : n.concat([e]), zs(4194308, 4, qs.bind(null, t, e), n);
		},
		useLayoutEffect: function(e, t) {
			return zs(4194308, 4, e, t);
		},
		useInsertionEffect: function(e, t) {
			zs(4, 2, e, t);
		},
		useMemo: function(e, t) {
			var n = ss();
			t = t === void 0 ? null : t;
			var r = e();
			if (Jo) {
				ot(!0);
				try {
					e();
				} finally {
					ot(!1);
				}
			}
			return n.memoizedState = [r, t], r;
		},
		useReducer: function(e, t, n) {
			var r = ss();
			if (n !== void 0) {
				var i = n(t);
				if (Jo) {
					ot(!0);
					try {
						n(t);
					} finally {
						ot(!1);
					}
				}
			} else i = t;
			return r.memoizedState = r.baseState = i, e = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: e,
				lastRenderedState: i
			}, r.queue = e, e = e.dispatch = lc.bind(null, R, e), [r.memoizedState, e];
		},
		useRef: function(e) {
			var t = ss();
			return e = { current: e }, t.memoizedState = e;
		},
		useState: function(e) {
			e = Cs(e);
			var t = e.queue, n = uc.bind(null, R, t);
			return t.dispatch = n, [e.memoizedState, n];
		},
		useDebugValue: Ys,
		useDeferredValue: function(e, t) {
			return Qs(ss(), e, t);
		},
		useTransition: function() {
			var e = Cs(!1);
			return e = ec.bind(null, R, e.queue, !0, !1), ss().memoizedState = e, [!1, e];
		},
		useSyncExternalStore: function(e, t, n) {
			var r = R, a = ss();
			if (P) {
				if (n === void 0) throw Error(i(407));
				n = n();
			} else {
				if (n = t(), K === null) throw Error(i(349));
				J & 127 || vs(r, t, n);
			}
			a.memoizedState = n;
			var o = {
				value: n,
				getSnapshot: t
			};
			return a.queue = o, Vs(bs.bind(null, r, o, e), [e]), r.flags |= 2048, Ls(9, { destroy: void 0 }, ys.bind(null, r, o, n, t), null), n;
		},
		useId: function() {
			var e = ss(), t = K.identifierPrefix;
			if (P) {
				var n = ia, r = ra;
				n = (r & ~(1 << 32 - st(r) - 1)).toString(32) + n, t = "_" + t + "R_" + n, n = Yo++, 0 < n && (t += "H" + n.toString(32)), t += "_";
			} else n = Qo++, t = "_" + t + "r_" + n.toString(32) + "_";
			return e.memoizedState = t;
		},
		useHostTransitionStatus: ac,
		useFormState: Ms,
		useActionState: Ms,
		useOptimistic: function(e) {
			var t = ss();
			t.memoizedState = t.baseState = e;
			var n = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: null,
				lastRenderedState: null
			};
			return t.queue = n, t = fc.bind(null, R, !0, n), n.dispatch = t, [e, t];
		},
		useMemoCache: fs,
		useCacheRefresh: function() {
			return ss().memoizedState = cc.bind(null, R);
		},
		useEffectEvent: function(e) {
			var t = ss(), n = { impl: e };
			return t.memoizedState = n, function() {
				if (G & 2) throw Error(i(440));
				return n.impl.apply(void 0, arguments);
			};
		}
	}, vc = {
		readContext: Aa,
		use: ds,
		useCallback: Xs,
		useContext: Aa,
		useEffect: Hs,
		useImperativeHandle: Js,
		useInsertionEffect: Gs,
		useLayoutEffect: Ks,
		useMemo: Zs,
		useReducer: ms,
		useRef: Rs,
		useState: function() {
			return ms(ps);
		},
		useDebugValue: Ys,
		useDeferredValue: function(e, t) {
			return $s(cs(), z.memoizedState, e, t);
		},
		useTransition: function() {
			var e = ms(ps)[0], t = cs().memoizedState;
			return [typeof e == "boolean" ? e : us(e), t];
		},
		useSyncExternalStore: _s,
		useId: oc,
		useHostTransitionStatus: ac,
		useFormState: Ns,
		useActionState: Ns,
		useOptimistic: function(e, t) {
			return ws(cs(), z, e, t);
		},
		useMemoCache: fs,
		useCacheRefresh: sc,
		useEffectEvent: Ws
	}, yc = {
		readContext: Aa,
		use: ds,
		useCallback: Xs,
		useContext: Aa,
		useEffect: Hs,
		useImperativeHandle: Js,
		useInsertionEffect: Gs,
		useLayoutEffect: Ks,
		useMemo: Zs,
		useReducer: gs,
		useRef: Rs,
		useState: function() {
			return gs(ps);
		},
		useDebugValue: Ys,
		useDeferredValue: function(e, t) {
			var n = cs();
			return z === null ? Qs(n, e, t) : $s(n, z.memoizedState, e, t);
		},
		useTransition: function() {
			var e = gs(ps)[0], t = cs().memoizedState;
			return [typeof e == "boolean" ? e : us(e), t];
		},
		useSyncExternalStore: _s,
		useId: oc,
		useHostTransitionStatus: ac,
		useFormState: Is,
		useActionState: Is,
		useOptimistic: function(e, t) {
			var n = cs();
			return z === null ? (n.baseState = e, [e, n.queue.dispatch]) : ws(n, z, e, t);
		},
		useMemoCache: fs,
		useCacheRefresh: sc,
		useEffectEvent: Ws
	};
	function bc(e, t, n, r) {
		t = e.memoizedState, n = n(r, t), n = n == null ? t : C({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
	}
	var xc = {
		enqueueSetState: function(e, t, n) {
			e = e._reactInternals;
			var r = jd(), i = xo(r);
			i.payload = t, n != null && (i.callback = n), t = So(e, i, r), t !== null && (Pd(t, e, r), Co(t, e, r));
		},
		enqueueReplaceState: function(e, t, n) {
			e = e._reactInternals;
			var r = jd(), i = xo(r);
			i.tag = 1, i.payload = t, n != null && (i.callback = n), t = So(e, i, r), t !== null && (Pd(t, e, r), Co(t, e, r));
		},
		enqueueForceUpdate: function(e, t) {
			e = e._reactInternals;
			var n = jd(), r = xo(n);
			r.tag = 2, t != null && (r.callback = t), t = So(e, r, n), t !== null && (Pd(t, e, n), Co(t, e, n));
		}
	};
	function Sc(e, t, n, r, i, a, o) {
		return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, a, o) : t.prototype && t.prototype.isPureReactComponent ? !Xr(n, r) || !Xr(i, a) : !0;
	}
	function Cc(e, t, n, r) {
		e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && xc.enqueueReplaceState(t, t.state, null);
	}
	function wc(e, t) {
		var n = t;
		if ("ref" in t) for (var r in n = {}, t) r !== "ref" && (n[r] = t[r]);
		if (e = e.defaultProps) for (var i in n === t && (n = C({}, n)), e) n[i] === void 0 && (n[i] = e[i]);
		return n;
	}
	function Tc(e) {
		Di(e);
	}
	function Ec(e) {
		console.error(e);
	}
	function Dc(e) {
		Di(e);
	}
	function Oc(e, t) {
		try {
			var n = e.onUncaughtError;
			n(t.value, { componentStack: t.stack });
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	function kc(e, t, n) {
		try {
			var r = e.onCaughtError;
			r(n.value, {
				componentStack: n.stack,
				errorBoundary: t.tag === 1 ? t.stateNode : null
			});
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	function Ac(e, t, n) {
		return n = xo(n), n.tag = 3, n.payload = { element: null }, n.callback = function() {
			Oc(e, t);
		}, n;
	}
	function jc(e) {
		return e = xo(e), e.tag = 3, e;
	}
	function Mc(e, t, n, r) {
		var i = n.type.getDerivedStateFromError;
		if (typeof i == "function") {
			var a = r.value;
			e.payload = function() {
				return i(a);
			}, e.callback = function() {
				kc(t, n, r);
			};
		}
		var o = n.stateNode;
		o !== null && typeof o.componentDidCatch == "function" && (e.callback = function() {
			kc(t, n, r), typeof i != "function" && (yd === null ? yd = /* @__PURE__ */ new Set([this]) : yd.add(this));
			var e = r.stack;
			this.componentDidCatch(r.value, { componentStack: e === null ? "" : e });
		});
	}
	function Nc(e, t, n, r, a) {
		if (n.flags |= 32768, typeof r == "object" && r && typeof r.then == "function") {
			if (t = n.alternate, t !== null && Da(t, n, a, !0), n = Po.current, n !== null) {
				switch (n.tag) {
					case 31:
					case 13:
					case 19: return Fo === null ? Kd() : n.alternate === null && od === 0 && (od = 3), n.flags &= -257, n.flags |= 65536, n.lanes = a, r === no ? n.flags |= 16384 : (t = n.updateQueue, t === null ? n.updateQueue = /* @__PURE__ */ new Set([r]) : t.add(r), mf(e, r, a)), !1;
					case 22: return n.flags |= 65536, r === no ? n.flags |= 16384 : (t = n.updateQueue, t === null ? (t = {
						transitions: null,
						markerInstances: null,
						retryQueue: /* @__PURE__ */ new Set([r])
					}, n.updateQueue = t) : (n = t.retryQueue, n === null ? t.retryQueue = /* @__PURE__ */ new Set([r]) : n.add(r)), mf(e, r, a)), !1;
				}
				throw Error(i(435, n.tag));
			}
			return mf(e, r, a), Kd(), !1;
		}
		if (P) return t = Po.current, t === null ? (r !== pa && (t = Error(i(423), { cause: r }), ba(Yi(t, n))), e = e.current.alternate, e.flags |= 65536, a &= -a, e.lanes |= a, r = Yi(r, n), a = Ac(e.stateNode, r, a), wo(e, a), od !== 4 && (od = 2)) : (!(t.flags & 65536) && (t.flags |= 256), t.flags |= 65536, t.lanes = a, r !== pa && (e = Error(i(422), { cause: r }), ba(Yi(e, n)))), !1;
		var o = Error(i(520), { cause: r });
		if (o = Yi(o, n), fd === null ? fd = [o] : fd.push(o), od !== 4 && (od = 2), t === null) return !0;
		r = Yi(r, n), n = t;
		do {
			switch (n.tag) {
				case 3: return n.flags |= 65536, e = a & -a, n.lanes |= e, e = Ac(n.stateNode, r, e), wo(n, e), !1;
				case 1:
					if (t = n.type, o = n.stateNode, !(n.flags & 128) && (typeof t.getDerivedStateFromError == "function" || o !== null && typeof o.componentDidCatch == "function" && (yd === null || !yd.has(o)))) return n.flags |= 65536, a &= -a, n.lanes |= a, a = jc(a), Mc(a, e, n, r), wo(n, a), !1;
					break;
				case 22: if (n.memoizedState !== null) return n.flags |= 65536, !1;
			}
			n = n.return;
		} while (n !== null);
		return !1;
	}
	var Pc = Error(i(461)), Fc = !1;
	function Ic(e, t, n, r) {
		t.child = e === null ? _o(t, null, n, r) : go(t, e.child, n, r);
	}
	function Lc(e, t, n, r, i) {
		n = n.render;
		var a = t.ref;
		if ("ref" in r) {
			var o = {};
			for (var s in r) s !== "ref" && (o[s] = r[s]);
		} else o = r;
		return ka(t), r = es(e, t, n, o, a, i), s = is(), e !== null && !Fc ? (as(e, t, i), dl(e, t, i)) : (P && s && sa(t), t.flags |= 1, Ic(e, t, r, i), t.child);
	}
	function Rc(e, t, n, r, i) {
		if (e === null) {
			var a = n.type;
			return typeof a == "function" && !Bi(a) && a.defaultProps === void 0 && n.compare === null ? (t.tag = 15, t.type = a, zc(e, t, a, r, i)) : (e = Ui(n.type, null, r, t, t.mode, i), e.ref = t.ref, e.return = t, t.child = e);
		}
		if (a = e.child, !fl(e, i)) {
			var o = a.memoizedProps;
			if (n = n.compare, n = n === null ? Xr : n, n(o, r) && e.ref === t.ref) return dl(e, t, i);
		}
		return t.flags |= 1, e = Vi(a, r), e.ref = t.ref, e.return = t, t.child = e;
	}
	function zc(e, t, n, r, i) {
		if (e !== null) {
			var a = e.memoizedProps;
			if (Xr(a, r) && e.ref === t.ref) {
				if (Fc = !1, t.pendingProps = r = a, fl(e, i)) e.flags & 131072 && (Fc = !0);
				else return t.lanes = e.lanes, dl(e, t, i);
			}
		}
		return qc(e, t, n, r, i);
	}
	function Bc(e, t, n, r) {
		var i = r.children, a = e === null ? null : e.memoizedState;
		if (e === null && t.stateNode === null && (t.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		}), r.mode === "hidden") {
			if (t.flags & 128) {
				if (a = a === null ? n : a.baseLanes | n, e !== null) {
					for (r = t.child = e.child, i = 0; r !== null;) i = i | r.lanes | r.childLanes, r = r.sibling;
					r = i & ~a;
				} else r = 0, t.child = null;
				return Hc(e, t, a, n, r);
			}
			if (n & 536870912) t.memoizedState = {
				baseLanes: 0,
				cachePool: null
			}, e !== null && Za(t, a === null ? null : a.cachePool), a === null ? No() : Mo(t, a), Ro(t);
			else return r = t.lanes = 536870912, Hc(e, t, a === null ? n : a.baseLanes | n, n, r);
		} else a === null ? (e !== null && Za(t, null), No(), zo()) : (Za(t, a.cachePool), Mo(t, a), zo(), t.memoizedState = null);
		return Ic(e, t, i, n), t.child;
	}
	function Vc(e, t) {
		return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		}), t.sibling;
	}
	function Hc(e, t, n, r, i) {
		var a = Xa();
		return a = a === null ? null : {
			parent: I._currentValue,
			pool: a
		}, t.memoizedState = {
			baseLanes: n,
			cachePool: a
		}, e !== null && Za(t, null), No(), Ro(t), e !== null && Da(e, t, r, !0), t.childLanes = i, null;
	}
	function Uc(e, t) {
		return t = nl({
			mode: t.mode,
			children: t.children
		}, e.mode), t.ref = e.ref, e.child = t, t.return = e, t;
	}
	function Wc(e, t, n) {
		return go(t, e.child, null, n), e = Uc(t, t.pendingProps), e.flags |= 2, Bo(t), t.memoizedState = null, e;
	}
	function Gc(e, t, n) {
		var r = t.pendingProps, a = !!(t.flags & 128);
		if (t.flags &= -129, e === null) {
			if (P) {
				if (r.mode === "hidden") return e = Uc(t, r), t.lanes = 536870912, e.memoizedState = {
					baseLanes: 0,
					cachePool: null
				}, Vc(null, e);
				if (Lo(t), (e = N) ? (e = am(e, fa), e = e !== null && e.data === "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: na === null ? null : {
						id: ra,
						overflow: ia
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = Ki(e), n.return = t, t.child = n, ua = t, N = null)) : e = null, e === null) throw ma(t);
				return t.lanes = 536870912, null;
			}
			return Uc(t, r);
		}
		var o = e.memoizedState;
		if (o !== null) {
			var s = o.dehydrated;
			if (Lo(t), a) {
				if (t.flags & 256) t.flags &= -257, t = Wc(e, t, n);
				else if (t.memoizedState !== null) t.child = e.child, t.flags |= 128, t = null;
				else throw Error(i(558));
			} else if (Fc || Da(e, t, n, !1), a = (n & e.childLanes) !== 0, Fc || a) {
				if (Ao.current === null) {
					if (r = K, r !== null && (s = wt(r, n), s !== 0 && s !== o.retryLane)) throw o.retryLane = s, Pi(e, s), Pd(r, e, s), Pc;
					Kd();
				}
				t = Wc(e, t, n);
			} else e = o.treeContext, N = lm(s.nextSibling), ua = t, P = !0, da = null, fa = !1, e !== null && la(t, e), t = Uc(t, r), t.flags |= 134221824;
			return t;
		}
		return e = Vi(e.child, {
			mode: r.mode,
			children: r.children
		}), e.ref = t.ref, t.child = e, e.return = t, e;
	}
	function Kc(e, t) {
		var n = t.ref;
		if (n === null) e !== null && e.ref !== null && (t.flags |= 4194816);
		else {
			if (typeof n != "function" && typeof n != "object") throw Error(i(284));
			(e === null || e.ref !== n) && (t.flags |= 4194816);
		}
	}
	function qc(e, t, n, r, i) {
		return ka(t), n = es(e, t, n, r, void 0, i), r = is(), e !== null && !Fc ? (as(e, t, i), dl(e, t, i)) : (P && r && sa(t), t.flags |= 1, Ic(e, t, n, i), t.child);
	}
	function Jc(e, t, n, r, i, a) {
		return ka(t), t.updateQueue = null, n = ns(t, r, n, i), ts(e), r = is(), e !== null && !Fc ? (as(e, t, a), dl(e, t, a)) : (P && r && sa(t), t.flags |= 1, Ic(e, t, n, a), t.child);
	}
	function Yc(e, t, n, r, i) {
		if (ka(t), t.stateNode === null) {
			var a = Li, o = n.contextType;
			typeof o == "object" && o && (a = Aa(o)), a = new n(r, a), t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, a.updater = xc, t.stateNode = a, a._reactInternals = t, a = t.stateNode, a.props = r, a.state = t.memoizedState, a.refs = {}, yo(t), o = n.contextType, a.context = typeof o == "object" && o ? Aa(o) : Li, a.state = t.memoizedState, o = n.getDerivedStateFromProps, typeof o == "function" && (bc(t, n, o, r), a.state = t.memoizedState), typeof n.getDerivedStateFromProps == "function" || typeof a.getSnapshotBeforeUpdate == "function" || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (o = a.state, typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount(), o !== a.state && xc.enqueueReplaceState(a, a.state, null), Do(t, r, a, i), Eo(), a.state = t.memoizedState), typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !0;
		} else if (e === null) {
			a = t.stateNode;
			var s = t.memoizedProps, c = wc(n, s);
			a.props = c;
			var l = a.context, u = n.contextType;
			o = Li, typeof u == "object" && u && (o = Aa(u));
			var d = n.getDerivedStateFromProps;
			u = typeof d == "function" || typeof a.getSnapshotBeforeUpdate == "function", s = t.pendingProps !== s, u || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (s || l !== o) && Cc(t, a, r, o), vo = !1;
			var f = t.memoizedState;
			a.state = f, Do(t, r, a, i), Eo(), l = t.memoizedState, s || f !== l || vo ? (typeof d == "function" && (bc(t, n, d, r), l = t.memoizedState), (c = vo || Sc(t, n, c, r, f, l, o)) ? (u || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount()), typeof a.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = l), a.props = r, a.state = l, a.context = o, r = c) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
		} else {
			a = t.stateNode, bo(e, t), o = t.memoizedProps, u = wc(n, o), a.props = u, d = t.pendingProps, f = a.context, l = n.contextType, c = Li, typeof l == "object" && l && (c = Aa(l)), s = n.getDerivedStateFromProps, (l = typeof s == "function" || typeof a.getSnapshotBeforeUpdate == "function") || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (o !== d || f !== c) && Cc(t, a, r, c), vo = !1, f = t.memoizedState, a.state = f, Do(t, r, a, i), Eo();
			var p = t.memoizedState;
			o !== d || f !== p || vo || e !== null && e.dependencies !== null && Oa(e.dependencies) ? (typeof s == "function" && (bc(t, n, s, r), p = t.memoizedState), (u = vo || Sc(t, n, u, r, f, p, c) || e !== null && e.dependencies !== null && Oa(e.dependencies)) ? (l || typeof a.UNSAFE_componentWillUpdate != "function" && typeof a.componentWillUpdate != "function" || (typeof a.componentWillUpdate == "function" && a.componentWillUpdate(r, p, c), typeof a.UNSAFE_componentWillUpdate == "function" && a.UNSAFE_componentWillUpdate(r, p, c)), typeof a.componentDidUpdate == "function" && (t.flags |= 4), typeof a.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = p), a.props = r, a.state = p, a.context = c, r = u) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), r = !1);
		}
		return a = r, Kc(e, t), r = !!(t.flags & 128), a || r ? (a = t.stateNode, n = r && typeof n.getDerivedStateFromError != "function" ? null : a.render(), t.flags |= 1, e !== null && r ? (t.child = go(t, e.child, null, i), t.child = go(t, null, n, i)) : Ic(e, t, n, i), t.memoizedState = a.state, e = t.child) : e = dl(e, t, i), e;
	}
	function Xc(e, t, n, r) {
		return va(), t.flags |= 256, Ic(e, t, n, r), t.child;
	}
	var Zc = {
		dehydrated: null,
		treeContext: null,
		retryLane: 0,
		hydrationErrors: null
	};
	function Qc(e) {
		return {
			baseLanes: e,
			cachePool: Qa()
		};
	}
	function $c(e, t, n) {
		return e = e === null ? 0 : e.childLanes & ~n, t && (e |= ud), e;
	}
	function el(e, t, n) {
		var r = t.pendingProps, i = !1, a = !!(t.flags & 128), o;
		if ((o = a) || (o = e !== null && e.memoizedState === null ? !1 : !!(Vo.current & 2)), o && (i = !0, t.flags &= -129), o = !!(t.flags & 32), t.flags &= -33, e === null) {
			if (P) {
				if (i ? Io(t) : zo(), (e = N) ? (e = am(e, fa), e = e !== null && e.data !== "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: na === null ? null : {
						id: ra,
						overflow: ia
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = Ki(e), n.return = t, t.child = n, ua = t, N = null)) : e = null, e === null) throw ma(t);
				return t.lanes = sm(e) ? 32 : 536870912, null;
			}
			return a = r.children, r = r.fallback, i ? (zo(), i = t.mode, a = nl({
				mode: "hidden",
				children: a
			}, i), r = Wi(r, i, n, null), a.return = t, r.return = t, a.sibling = r, t.child = a, r = t.child, r.memoizedState = Qc(n), r.childLanes = $c(e, o, n), t.memoizedState = Zc, Vc(null, r)) : (Io(t), tl(t, a));
		}
		var s = e.memoizedState;
		if (s !== null) {
			var c = s.dehydrated;
			if (c !== null) return il(e, t, a, o, r, c, s, n);
		}
		return i ? (zo(), i = r.fallback, a = t.mode, s = e.child, c = s.sibling, r = Vi(s, {
			mode: "hidden",
			children: r.children
		}), r.subtreeFlags = s.subtreeFlags & 1206910976, c === null ? (i = Wi(i, a, n, null), i.flags |= 2) : i = Vi(c, i), i.return = t, r.return = t, r.sibling = i, t.child = r, Vc(null, r), r = t.child, i = e.child.memoizedState, i === null ? i = Qc(n) : (a = i.cachePool, a === null ? a = Qa() : (s = I._currentValue, a = a.parent === s ? a : {
			parent: s,
			pool: s
		}), i = {
			baseLanes: i.baseLanes | n,
			cachePool: a
		}), r.memoizedState = i, r.childLanes = $c(e, o, n), t.memoizedState = Zc, Vc(e.child, r)) : (Io(t), n = e.child, e = n.sibling, n = Vi(n, {
			mode: "visible",
			children: r.children
		}), n.return = t, n.sibling = null, e !== null && (o = t.deletions, o === null ? (t.deletions = [e], t.flags |= 16) : o.push(e)), t.child = n, t.memoizedState = null, n);
	}
	function tl(e, t) {
		return t = nl({
			mode: "visible",
			children: t
		}, e.mode), t.return = e, e.child = t;
	}
	function nl(e, t) {
		return e = zi(22, e, null, t), e.lanes = 0, e;
	}
	function rl(e, t, n) {
		return go(t, e.child, null, n), e = tl(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
	}
	function il(e, t, n, r, a, o, s, c) {
		if (n) return t.flags & 256 ? (Io(t), t.flags &= -257, rl(e, t, c)) : t.memoizedState === null ? (zo(), o = a.fallback, s = t.mode, a = nl({
			mode: "visible",
			children: a.children
		}, s), o = Wi(o, s, c, null), o.flags |= 2, a.return = t, o.return = t, a.sibling = o, t.child = a, go(t, e.child, null, c), a = t.child, a.memoizedState = Qc(c), a.childLanes = $c(e, r, c), t.memoizedState = Zc, Vc(null, a)) : (zo(), t.child = e.child, t.flags |= 128, null);
		if (Io(t), sm(o)) {
			if (r = o.nextSibling && o.nextSibling.dataset, r) var l = r.dgst;
			return r = l, r !== "" && (a = Error(i(419)), a.stack = "", a.digest = r, ba({
				value: a,
				source: null,
				stack: null
			})), rl(e, t, c);
		}
		if (Fc || Da(e, t, c, !1), r = (c & e.childLanes) !== 0, Fc || r) {
			if (Ao.current !== null) return rl(e, t, c);
			if (r = K, r !== null && (a = wt(r, c), a !== 0 && a !== s.retryLane)) throw s.retryLane = a, Pi(e, a), Pd(r, e, a), Pc;
			return om(o) || Kd(), rl(e, t, c);
		}
		return om(o) ? (t.flags |= 192, t.child = e.child, null) : (e = s.treeContext, N = lm(o.nextSibling), ua = t, P = !0, da = null, fa = !1, e !== null && la(t, e), t = tl(t, a.children), t.flags |= 134221824, t);
	}
	function al(e, t, n) {
		e.lanes |= t;
		var r = e.alternate;
		r !== null && (r.lanes |= t), Ta(e.return, t, n);
	}
	function ol(e) {
		for (var t = null; e !== null;) {
			var n = e.alternate;
			n !== null && Wo(n) === null && (t = e), e = e.sibling;
		}
		return t;
	}
	function sl(e, t, n, r, i, a) {
		var o = e.memoizedState;
		o === null ? e.memoizedState = {
			isBackwards: t,
			rendering: null,
			renderingStartTime: 0,
			last: r,
			tail: n,
			tailMode: i,
			treeForkCount: a
		} : (o.isBackwards = t, o.rendering = null, o.renderingStartTime = 0, o.last = r, o.tail = n, o.tailMode = i, o.treeForkCount = a);
	}
	function cl(e) {
		var t = e.child;
		for (e.child = null; t !== null;) {
			var n = t.sibling;
			t.sibling = e.child, e.child = t, t = n;
		}
	}
	function ll(e, t, n) {
		var r = t.pendingProps, i = r.revealOrder, a = r.tail;
		r = r.children;
		var o = Vo.current;
		if (t.flags & 128) return Ho(t, o), null;
		var s = !!(o & 2);
		if (s ? (o = o & 1 | 2, t.flags |= 128) : o &= 1, Ho(t, o), i === "backwards" && e !== null ? (cl(e), Ic(e, t, r, n), cl(e)) : Ic(e, t, r, n), r = P ? $i : 0, !s && e !== null && e.flags & 128) a: for (e = t.child; e !== null;) {
			if (e.tag === 13) e.memoizedState !== null && al(e, n, t);
			else if (e.tag === 19) al(e, n, t);
			else if (e.child !== null) {
				e.child.return = e, e = e.child;
				continue;
			}
			if (e === t) break a;
			for (; e.sibling === null;) {
				if (e.return === null || e.return === t) break a;
				e = e.return;
			}
			e.sibling.return = e.return, e = e.sibling;
		}
		switch (i) {
			case "backwards":
				n = ol(t.child), n === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null, cl(t)), sl(t, !0, i, null, a, r);
				break;
			case "unstable_legacy-backwards":
				for (n = null, i = t.child, t.child = null; i !== null;) {
					if (e = i.alternate, e !== null && Wo(e) === null) {
						t.child = i;
						break;
					}
					e = i.sibling, i.sibling = n, n = i, i = e;
				}
				sl(t, !0, n, null, a, r);
				break;
			case "together":
				sl(t, !1, null, null, void 0, r);
				break;
			case "independent":
				t.memoizedState = null;
				break;
			default: n = ol(t.child), n === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null), sl(t, !1, i, n, a, r);
		}
		return t.child;
	}
	function ul(e, t, n) {
		var r = t.pendingProps;
		return Ca(t, t.type, r.value), Ic(e, t, r.children, n), t.child;
	}
	function dl(e, t, n) {
		if (e !== null && (t.dependencies = e.dependencies), sd |= t.lanes, (n & t.childLanes) === 0) {
			if (e !== null) {
				if (Da(e, t, n, !1), (n & t.childLanes) === 0) return null;
			} else return null;
		}
		if (e !== null && t.child !== e.child) throw Error(i(153));
		if (t.child !== null) {
			for (e = t.child, n = Vi(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null;) e = e.sibling, n = n.sibling = Vi(e, e.pendingProps), n.return = t;
			n.sibling = null;
		}
		return t.child;
	}
	function fl(e, t) {
		return (e.lanes & t) !== 0 || (e = e.dependencies, !!(e !== null && Oa(e)));
	}
	function pl(e, t, n) {
		switch (t.tag) {
			case 3:
				Ne(t, t.stateNode.containerInfo), Ca(t, I, e.memoizedState.cache), va();
				break;
			case 27:
			case 5:
				Fe(t);
				break;
			case 4:
				Ne(t, t.stateNode.containerInfo);
				break;
			case 10:
				Ca(t, t.type, t.memoizedProps.value);
				break;
			case 31:
				if (t.memoizedState !== null) return t.flags |= 128, Lo(t), null;
				break;
			case 13:
				var r = t.memoizedState;
				if (r !== null) {
					if (r.dehydrated !== null) return Io(t), t.flags |= 128, null;
					r = Da(e, t, n, !1);
					var i = t.child.childLanes;
					return r || (n & i) !== 0 ? el(e, t, n) : (Io(t), e = dl(e, t, n), e === null ? null : e.sibling);
				}
				Io(t);
				break;
			case 19:
				if (t.flags & 128) return ll(e, t, n);
				if (i = !!(e.flags & 128), r = (n & t.childLanes) !== 0, r ||= (Da(e, t, n, !1), (n & t.childLanes) !== 0), i) {
					if (r) return ll(e, t, n);
					t.flags |= 128;
				}
				if (i = t.memoizedState, i !== null && (i.rendering = null, i.tail = null, i.lastEffect = null), Ho(t, Vo.current), r) break;
				return null;
			case 22: return t.lanes = 0, Bc(e, t, n, t.pendingProps);
			case 24: Ca(t, I, e.memoizedState.cache);
		}
		return dl(e, t, n);
	}
	function ml(e, t, n) {
		if (e !== null) {
			if (e.memoizedProps !== t.pendingProps) Fc = !0;
			else {
				if (!fl(e, n) && !(t.flags & 128)) return Fc = !1, pl(e, t, n);
				Fc = !!(e.flags & 131072);
			}
		} else Fc = !1, P && t.flags & 1048576 && oa(t, $i, t.index);
		switch (t.lanes = 0, t.tag) {
			case 16:
				a: {
					var r = t.pendingProps;
					if (e = ao(t.elementType), t.type = e, typeof e == "function") Bi(e) ? (r = wc(e, r), t.tag = 1, t = Yc(null, t, e, r, n)) : (t.tag = 0, t = qc(null, t, e, r, n));
					else {
						if (e != null) {
							var a = e.$$typeof;
							if (a === le) {
								t.tag = 11, t = Lc(null, t, e, r, n);
								break a;
							}
							if (a === fe) {
								t.tag = 14, t = Rc(null, t, e, r, n);
								break a;
							}
							if (a === E) {
								t.tag = 10, t.type = e, t = ul(null, t, n);
								break a;
							}
						}
						throw t = Se(e) || e, Error(i(306, t, ""));
					}
				}
				return t;
			case 0: return qc(e, t, t.type, t.pendingProps, n);
			case 1: return r = t.type, a = wc(r, t.pendingProps), Yc(e, t, r, a, n);
			case 3:
				a: {
					if (Ne(t, t.stateNode.containerInfo), e === null) throw Error(i(387));
					r = t.pendingProps;
					var o = t.memoizedState;
					a = o.element, bo(e, t), Do(t, r, null, n);
					var s = t.memoizedState;
					if (r = s.cache, Ca(t, I, r), r !== o.cache && Ea(t, [I], n, !0), Eo(), r = s.element, o.isDehydrated) {
						if (o = {
							element: r,
							isDehydrated: !1,
							cache: s.cache
						}, t.updateQueue.baseState = o, t.memoizedState = o, t.flags & 256) {
							t = Xc(e, t, r, n);
							break a;
						}
						if (r !== a) {
							a = Yi(Error(i(424)), t), ba(a), t = Xc(e, t, r, n);
							break a;
						}
						switch (e = t.stateNode.containerInfo, e.nodeType) {
							case 9:
								e = e.body;
								break;
							default: e = e.nodeName === "HTML" ? e.ownerDocument.body : e;
						}
						for (N = lm(e.firstChild), ua = t, P = !0, da = null, fa = !0, n = _o(t, null, r, n), t.child = n; n;) n.flags = n.flags & -3 | 134221824, n = n.sibling;
					} else {
						if (va(), r === a) {
							t = dl(e, t, n);
							break a;
						}
						Ic(e, t, r, n);
					}
					t = t.child;
				}
				return t;
			case 26: return Kc(e, t), e === null ? (n = Nm(t.type, null, t.pendingProps, null)) ? t.memoizedState = n : P || (t.stateNode = fp(t.type, t.pendingProps, je.current, t)) : t.memoizedState = Nm(t.type, e.memoizedProps, t.pendingProps, e.memoizedState), null;
			case 27: return Fe(t), e === null && P && (r = t.stateNode = hm(t.type, t.pendingProps, je.current), ua = t, fa = !0, a = N, Sp(t.type) ? (um = a, N = lm(r.firstChild)) : N = a), Ic(e, t, t.pendingProps.children, n), Kc(e, t), e === null && (t.flags |= 4194304), t.child;
			case 5: return e === null && P && ((a = r = N) && (r = rm(r, t.type, t.pendingProps, fa), r === null ? a = !1 : (t.stateNode = r, ua = t, N = lm(r.firstChild), fa = !1, a = !0)), a || ma(t)), Fe(t), a = t.type, o = t.pendingProps, s = e === null ? null : e.memoizedProps, r = o.children, pp(a, o) ? r = null : s !== null && pp(a, s) && (t.flags |= 32), t.memoizedState !== null && (a = es(e, t, rs, null, null, n), sh._currentValue = a), Kc(e, t), Ic(e, t, r, n), t.child;
			case 6: return e === null && P && ((e = n = N) && (n = im(n, t.pendingProps, fa), n === null ? e = !1 : (t.stateNode = n, ua = t, N = null, e = !0)), e || ma(t)), null;
			case 13: return el(e, t, n);
			case 4: return Ne(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = go(t, null, r, n) : Ic(e, t, r, n), t.child;
			case 11: return Lc(e, t, t.type, t.pendingProps, n);
			case 7: return r = t.pendingProps, Kc(e, t), Ic(e, t, r, n), t.child;
			case 8: return Ic(e, t, t.pendingProps.children, n), t.child;
			case 12: return Ic(e, t, t.pendingProps.children, n), t.child;
			case 10: return ul(e, t, n);
			case 9: return a = t.type._context, r = t.pendingProps.children, ka(t), a = Aa(a), r = r(a), t.flags |= 1, Ic(e, t, r, n), t.child;
			case 14: return Rc(e, t, t.type, t.pendingProps, n);
			case 15: return zc(e, t, t.type, t.pendingProps, n);
			case 19: return ll(e, t, n);
			case 31: return Gc(e, t, n);
			case 22: return Bc(e, t, n, t.pendingProps);
			case 24: return ka(t), r = Aa(I), e === null ? (a = Xa(), a === null && (a = K, o = Ia(), a.pooledCache = o, o.refCount++, o !== null && (a.pooledCacheLanes |= n), a = o), t.memoizedState = {
				parent: r,
				cache: a
			}, yo(t), Ca(t, I, a)) : ((e.lanes & n) !== 0 && (bo(e, t), Do(t, null, null, n), Eo()), a = e.memoizedState, o = t.memoizedState, a.parent === r ? (r = o.cache, Ca(t, I, r), r !== a.cache && Ea(t, [I], n, !0)) : (a = {
				parent: r,
				cache: r
			}, t.memoizedState = a, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = a), Ca(t, I, r))), Ic(e, t, t.pendingProps.children, n), t.child;
			case 30: return t.stateNode === null && (t.stateNode = {
				autoName: null,
				paired: null,
				clones: null,
				ref: null
			}), r = t.pendingProps, r.name != null && r.name !== "auto" ? t.flags |= e === null ? 18882560 : 18874368 : P && sa(t), e !== null && e.memoizedProps.name !== r.name ? t.flags |= 4194816 : Kc(e, t), Ic(e, t, r.children, n), t.child;
			case 29: throw t.pendingProps;
		}
		throw Error(i(156, t.tag));
	}
	function hl(e) {
		e.flags |= 4;
	}
	function gl(e, t, n, r, i) {
		var a;
		if ((a = !!(e.mode & 32)) && (a = n === null ? Jm(t, r) : Jm(t, r) && (r.src !== n.src || r.srcSet !== n.srcSet)), a) {
			if (e.flags |= 16777216, (i & 335544128) === i) {
				if (e.stateNode.complete) e.flags |= 8192;
				else if (Ud()) e.flags |= 8192;
				else throw oo = no, eo;
			}
		} else e.flags &= -16777217;
	}
	function _l(e, t) {
		if (t.type !== "stylesheet" || t.state.loading & 4) e.flags &= -16777217;
		else if (e.flags |= 16777216, !Ym(t)) {
			if (Ud()) e.flags |= 8192;
			else throw oo = no, eo;
		}
	}
	function vl(e, t) {
		t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag === 22 ? 536870912 : vt(), e.lanes |= t, dd |= t);
	}
	function yl(e, t) {
		if (!P) switch (e.tailMode) {
			case "visible": break;
			case "collapsed":
				for (var n = e.tail, r = null; n !== null;) n.alternate !== null && (r = n), n = n.sibling;
				r === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : r.sibling = null;
				break;
			default:
				for (t = e.tail, n = null; t !== null;) t.alternate !== null && (n = t), t = t.sibling;
				n === null ? e.tail = null : n.sibling = null;
		}
	}
	function H(e) {
		var t = e.alternate !== null && e.alternate.child === e.child, n = 0, r = 0;
		if (t) for (var i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags & 1206910976, r |= i.flags & 1206910976, i.return = e, i = i.sibling;
		else for (i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags, r |= i.flags, i.return = e, i = i.sibling;
		return e.subtreeFlags |= r, e.childLanes = n, t;
	}
	function bl(e, t, n) {
		var r = t.pendingProps;
		switch (ca(t), t.tag) {
			case 16:
			case 15:
			case 0:
			case 11:
			case 7:
			case 8:
			case 12:
			case 9:
			case 14: return H(t), null;
			case 1: return H(t), null;
			case 3: return n = t.stateNode, r = null, e !== null && (r = e.memoizedState.cache), t.memoizedState.cache !== r && (t.flags |= 2048), wa(I), Pe(), n.pendingContext && (n.context = n.pendingContext, n.pendingContext = null), (e === null || e.child === null) && (_a(t) ? hl(t) : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, ya())), H(t), null;
			case 26:
				var a = t.type, o = t.memoizedState;
				return e === null ? (hl(t), o === null ? (H(t), gl(t, a, null, r, n)) : (H(t), _l(t, o))) : o ? o === e.memoizedState ? (H(t), t.flags &= -16777217) : (hl(t), H(t), _l(t, o)) : (e = e.memoizedProps, e !== r && hl(t), H(t), gl(t, a, e, r, n)), null;
			case 27:
				if (Ie(t), n = je.current, a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && hl(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return H(t), t.subtreeFlags &= -33554433, null;
					}
					e = ke.current, _a(t) ? ha(t, e) : (e = hm(a, r, n), t.stateNode = e, hl(t));
				}
				return H(t), t.subtreeFlags &= -33554433, null;
			case 5:
				if (Ie(t), a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && hl(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return H(t), t.subtreeFlags &= -33554433, null;
					}
					if (o = ke.current, _a(t)) ha(t, o);
					else {
						var s = lp(je.current);
						switch (o) {
							case 1:
								o = s.createElementNS("http://www.w3.org/2000/svg", a);
								break;
							case 2:
								o = s.createElementNS("http://www.w3.org/1998/Math/MathML", a);
								break;
							default: switch (a) {
								case "svg":
									o = s.createElementNS("http://www.w3.org/2000/svg", a);
									break;
								case "math":
									o = s.createElementNS("http://www.w3.org/1998/Math/MathML", a);
									break;
								case "script":
									o = s.createElement("div"), o.innerHTML = "<script><\/script>", o = o.removeChild(o.firstChild);
									break;
								case "select":
									o = typeof r.is == "string" ? s.createElement("select", { is: r.is }) : s.createElement("select"), r.multiple ? o.multiple = !0 : r.size && (o.size = r.size);
									break;
								default: o = typeof r.is == "string" ? s.createElement(a, { is: r.is }) : s.createElement(a);
							}
						}
						o[At] = t, o[jt] = r;
						a: for (s = t.child; s !== null;) {
							if (s.tag === 5 || s.tag === 6) o.appendChild(s.stateNode);
							else if (s.tag !== 4 && s.tag !== 27 && s.child !== null) {
								s.child.return = s, s = s.child;
								continue;
							}
							if (s === t) break a;
							for (; s.sibling === null;) {
								if (s.return === null || s.return === t) break a;
								s = s.return;
							}
							s.sibling.return = s.return, s = s.sibling;
						}
						t.stateNode = o;
						a: switch (np(o, a, r), a) {
							case "button":
							case "input":
							case "select":
							case "textarea":
								r = !!r.autoFocus;
								break a;
							case "img":
								r = !0;
								break a;
							default: r = !1;
						}
						r && hl(t);
					}
				}
				return H(t), t.subtreeFlags &= -33554433, gl(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, n), null;
			case 6:
				if (e && t.stateNode != null) e.memoizedProps !== r && hl(t);
				else {
					if (typeof r != "string" && t.stateNode === null) throw Error(i(166));
					if (e = je.current, _a(t)) {
						if (e = t.stateNode, n = t.memoizedProps, r = null, a = ua, a !== null) switch (a.tag) {
							case 27:
							case 5: r = a.memoizedProps;
						}
						e[At] = t, e = !!(e.nodeValue === n || r !== null && !0 === r.suppressHydrationWarning || ep(e.nodeValue, n)), e || ma(t, !0);
					} else e = lp(e).createTextNode(r), e[At] = t, t.stateNode = e;
				}
				return H(t), null;
			case 31:
				if (n = t.memoizedState, e === null || e.memoizedState !== null) {
					if (r = _a(t), n !== null) {
						if (e === null) {
							if (!r) throw Error(i(318));
							if (e = t.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(557));
							e[At] = t;
						} else va(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						H(t), e = !1;
					} else n = ya(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n), e = !0;
					if (!e) return t.flags & 256 ? (Bo(t), t) : (Bo(t), null);
					if (t.flags & 128) throw Error(i(558));
				}
				return H(t), null;
			case 13:
				if (r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
					if (a = _a(t), r !== null && r.dehydrated !== null) {
						if (e === null) {
							if (!a) throw Error(i(318));
							if (a = t.memoizedState, a = a === null ? null : a.dehydrated, !a) throw Error(i(317));
							a[At] = t;
						} else va(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						H(t), a = !1;
					} else a = ya(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = a), a = !0;
					if (!a) return t.flags & 256 ? (Bo(t), t) : (Bo(t), null);
				}
				return Bo(t), t.flags & 128 ? (t.lanes = n, t) : (n = r !== null, e = e !== null && e.memoizedState !== null, n && (r = t.child, a = null, r.alternate !== null && r.alternate.memoizedState !== null && r.alternate.memoizedState.cachePool !== null && (a = r.alternate.memoizedState.cachePool.pool), o = null, r.memoizedState !== null && r.memoizedState.cachePool !== null && (o = r.memoizedState.cachePool.pool), o !== a && (r.flags |= 2048)), n !== e && n && (t.child.flags |= 8192), vl(t, t.updateQueue), H(t), null);
			case 4: return Pe(), e === null && Wf(t.stateNode.containerInfo), t.flags |= 67108864, H(t), null;
			case 10: return wa(t.type), H(t), null;
			case 19:
				if (Uo(t), r = t.memoizedState, r === null) return H(t), null;
				if (a = !!(t.flags & 128), o = r.rendering, o === null) {
					if (a) yl(r, !1);
					else {
						if (od !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null;) {
							if (o = Wo(e), o !== null) {
								for (t.flags |= 128, yl(r, !1), e = o.updateQueue, t.updateQueue = e, vl(t, e), t.subtreeFlags = 0, e = n, n = t.child; n !== null;) Hi(n, e), n = n.sibling;
								return Ho(t, Vo.current & 1 | 2), P && aa(t, r.treeForkCount), t.child;
							}
							e = e.sibling;
						}
						r.tail !== null && Ye() > _d && (t.flags |= 128, a = !0, yl(r, !1), t.lanes = 4194304);
					}
				} else {
					if (!a) {
						if (e = Wo(o), e !== null) {
							if (t.flags |= 128, a = !0, e = e.updateQueue, t.updateQueue = e, vl(t, e), yl(r, !0), r.tail === null && r.tailMode !== "collapsed" && r.tailMode !== "visible" && !o.alternate && !P) return H(t), null;
						} else 2 * Ye() - r.renderingStartTime > _d && n !== 536870912 && (t.flags |= 128, a = !0, yl(r, !1), t.lanes = 4194304);
					}
					r.isBackwards ? (o.sibling = t.child, t.child = o) : (e = r.last, e === null ? t.child = o : e.sibling = o, r.last = o);
				}
				if (r.tail !== null) {
					e = r.tail;
					a: {
						for (n = e; n !== null;) {
							if (n.alternate !== null) {
								n = !1;
								break a;
							}
							n = n.sibling;
						}
						n = !0;
					}
					return r.rendering = e, r.tail = e.sibling, r.renderingStartTime = Ye(), e.sibling = null, o = Vo.current, o = a ? o & 1 | 2 : o & 1, r.tailMode === "visible" || r.tailMode === "collapsed" || !n || P ? Ho(t, o) : (n = o, k(Po, t), k(Vo, n), Fo === null && (Fo = t)), P && aa(t, r.treeForkCount), e;
				}
				return H(t), null;
			case 22:
			case 23: return Bo(t), L(), r = t.memoizedState !== null, e === null ? r && (t.flags |= 8192) : e.memoizedState !== null !== r && (t.flags |= 8192), r ? n & 536870912 && !(t.flags & 128) && (H(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : H(t), n = t.updateQueue, n !== null && vl(t, n.retryQueue), n = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), r = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (r = t.memoizedState.cachePool.pool), r !== n && (t.flags |= 2048), e !== null && Oe(Ya), null;
			case 24: return n = null, e !== null && (n = e.memoizedState.cache), t.memoizedState.cache !== n && (t.flags |= 2048), wa(I), H(t), null;
			case 25: return null;
			case 30: return t.flags |= 33554432, H(t), null;
		}
		throw Error(i(156, t.tag));
	}
	function xl(e, t) {
		switch (ca(t), t.tag) {
			case 1: return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 3: return wa(I), Pe(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
			case 26:
			case 27:
			case 5: return Ie(t), null;
			case 31:
				if (t.memoizedState !== null) {
					if (Bo(t), t.alternate === null) throw Error(i(340));
					va();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 13:
				if (Bo(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
					if (t.alternate === null) throw Error(i(340));
					va();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 19: return Uo(t), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, e = t.memoizedState, e !== null && (e.rendering = null, e.tail = null), t.flags |= 4, t) : null;
			case 4: return Pe(), null;
			case 10: return wa(t.type), null;
			case 22:
			case 23: return Bo(t), L(), e !== null && Oe(Ya), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 24: return wa(I), null;
			case 25: return null;
			default: return null;
		}
	}
	function Sl(e, t) {
		switch (ca(t), t.tag) {
			case 3:
				wa(I), Pe();
				break;
			case 26:
			case 27:
			case 5:
				Ie(t);
				break;
			case 4:
				Pe();
				break;
			case 31:
				t.memoizedState !== null && Bo(t);
				break;
			case 13:
				Bo(t);
				break;
			case 19:
				Uo(t);
				break;
			case 10:
				wa(t.type);
				break;
			case 22:
			case 23:
				Bo(t), L(), e !== null && Oe(Ya);
				break;
			case 24: wa(I);
		}
	}
	function Cl(e, t) {
		try {
			var n = t.updateQueue, r = n === null ? null : n.lastEffect;
			if (r !== null) {
				var i = r.next;
				n = i;
				do {
					if ((n.tag & e) === e) {
						r = void 0;
						var a = n.create, o = n.inst;
						r = a(), o.destroy = r;
					}
					n = n.next;
				} while (n !== i);
			}
		} catch (e) {
			Z(t, t.return, e);
		}
	}
	function wl(e, t, n) {
		try {
			var r = t.updateQueue, i = r === null ? null : r.lastEffect;
			if (i !== null) {
				var a = i.next;
				r = a;
				do {
					if ((r.tag & e) === e) {
						var o = r.inst, s = o.destroy;
						if (s !== void 0) {
							o.destroy = void 0, i = t;
							var c = n, l = s;
							try {
								l();
							} catch (e) {
								Z(i, c, e);
							}
						}
					}
					r = r.next;
				} while (r !== a);
			}
		} catch (e) {
			Z(t, t.return, e);
		}
	}
	function Tl(e) {
		var t = e.updateQueue;
		if (t !== null) {
			var n = e.stateNode;
			try {
				ko(t, n);
			} catch (t) {
				Z(e, e.return, t);
			}
		}
	}
	function El(e, t, n) {
		n.props = wc(e.type, e.memoizedProps), n.state = e.memoizedState;
		try {
			n.componentWillUnmount();
		} catch (n) {
			Z(e, t, n);
		}
	}
	function Dl(e, t) {
		try {
			var n = e.ref;
			if (n !== null) {
				switch (e.tag) {
					case 26:
					case 27:
					case 5:
						var r = e.stateNode;
						break;
					case 30:
						var i = e.stateNode, a = wi(e.memoizedProps, i);
						(i.ref === null || i.ref.name !== a) && (i.ref = Pp(a)), r = i.ref;
						break;
					case 7:
						if (e.stateNode === null) {
							var o = new Fp(e);
							h(e.child, !1, Qp, o, void 0, void 0), e.stateNode = o;
						}
						r = e.stateNode;
						break;
					default: r = e.stateNode;
				}
				typeof n == "function" ? e.refCleanup = n(r) : n.current = r;
			}
		} catch (n) {
			Z(e, t, n);
		}
	}
	function Ol(e, t) {
		var n = e.ref, r = e.refCleanup;
		if (n !== null) {
			if (typeof r == "function") try {
				r();
			} catch (n) {
				Z(e, t, n);
			} finally {
				e.refCleanup = null, e = e.alternate, e != null && (e.refCleanup = null);
			}
			else if (typeof n == "function") try {
				n(null);
			} catch (n) {
				Z(e, t, n);
			}
			else n.current = null;
		}
	}
	function kl(e, t) {
		if ((e.tag === 5 || e.tag === 27 || e.tag === 6) && e.alternate === null && t !== null) for (var n = 0; n < t.length; n++) em(e.stateNode, t[n]);
	}
	function Al(e) {
		for (var t = e.return; t !== null && (Nl(t) && em(e.stateNode, t.stateNode), !Ml(t));) t = t.return;
	}
	function jl(e) {
		for (var t = e.return; t !== null && (Nl(t) && tm(e.stateNode, t.stateNode), !Ml(t));) t = t.return;
	}
	function Ml(e) {
		return e.tag === 5 || e.tag === 3 || e.tag === 27;
	}
	function Nl(e) {
		return e && e.tag === 7 && e.stateNode !== null;
	}
	function Pl(e) {
		var t = e.type, n = e.memoizedProps, r = e.stateNode;
		try {
			a: switch (t) {
				case "button":
				case "input":
				case "select":
				case "textarea":
					n.autoFocus && r.focus();
					break a;
				case "img": n.src ? r.src = n.src : n.srcSet && (r.srcset = n.srcSet);
			}
		} catch (t) {
			Z(e, e.return, t);
		}
	}
	function Fl(e, t, n) {
		try {
			var r = e.stateNode;
			ip(r, e.type, n, t), r[jt] = t;
		} catch (t) {
			Z(e, e.return, t);
		}
	}
	function Il(e) {
		return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && Sp(e.type) || e.tag === 4;
	}
	function Ll(e) {
		a: for (;;) {
			for (; e.sibling === null;) {
				if (e.return === null || Il(e.return)) return null;
				e = e.return;
			}
			for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18;) {
				if (e.tag === 27 && Sp(e.type) || e.flags & 2 || e.child === null || e.tag === 4) continue a;
				e.child.return = e, e = e.child;
			}
			if (!(e.flags & 2)) return e.stateNode;
		}
	}
	function Rl(e, t, n, r) {
		var i = e.tag;
		if (i === 5 || i === 6) i = e.stateNode, t ? (n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n).insertBefore(i, t) : (t = n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n, t.appendChild(i), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = En)), kl(e, r), j = !0;
		else if (i !== 4 && (i === 27 && (kl(e, r), r = null, Sp(e.type) && (n = e.stateNode, t = null)), e = e.child, e !== null)) for (Rl(e, t, n, r), e = e.sibling; e !== null;) Rl(e, t, n, r), e = e.sibling;
	}
	function zl(e, t, n, r) {
		var i = e.tag;
		if (i === 5 || i === 6) i = e.stateNode, t ? n.insertBefore(i, t) : n.appendChild(i), kl(e, r), j = !0;
		else if (i !== 4 && (i === 27 && (kl(e, r), r = null, Sp(e.type) && (n = e.stateNode)), e = e.child, e !== null)) for (zl(e, t, n, r), e = e.sibling; e !== null;) zl(e, t, n, r), e = e.sibling;
	}
	function Bl(e) {
		var t = e.stateNode, n = e.memoizedProps;
		try {
			for (var r = e.type, i = t.attributes; i.length;) t.removeAttributeNode(i[0]);
			np(t, r, n), t[At] = e, t[jt] = n;
		} catch (t) {
			Z(e, e.return, t);
		}
	}
	var Vl = !1, Hl = null;
	function Ul(e) {
		(e.tag === 30 || e.subtreeFlags & 33554432) && (Vl = !0);
	}
	var Wl = null;
	function Gl() {
		var e = Wl;
		return Wl = null, e;
	}
	var Kl = 0;
	function ql(e, t, n, r, i) {
		return Kl = 0, Jl(e.child, t, n, r, i);
	}
	function Jl(e, t, n, r, i) {
		for (var a = !1; e !== null;) {
			if (e.tag === 5) {
				var o = e.stateNode;
				if (r !== null) {
					var s = Op(o);
					r.push(s), s.view && (a = !0);
				} else a || Op(o).view && (a = !0);
				Vl = !0, Tp(o, Kl === 0 ? t : t + "_" + Kl, n), Kl++;
			} else e.tag === 22 && e.memoizedState !== null || e.tag === 30 && i || Jl(e.child, t, n, r, i) && (a = !0);
			e = e.sibling;
		}
		return a;
	}
	function Yl(e, t) {
		for (; e !== null;) e.tag === 5 ? Ep(e.stateNode, e.memoizedProps) : e.tag === 22 && e.memoizedState !== null || e.tag === 30 && t || Yl(e.child, t), e = e.sibling;
	}
	function Xl(e) {
		if (e.subtreeFlags & 18874368) for (e = e.child; e !== null;) {
			if ((e.tag !== 22 || e.memoizedState === null) && (Xl(e), e.tag === 30 && e.flags & 18874368 && e.stateNode.paired)) {
				var t = e.memoizedProps;
				if (t.name == null || t.name === "auto") throw Error(i(544));
				var n = t.name;
				t = Ei(t.default, t.share), t !== "none" && (ql(e, n, t, null, !1) || Yl(e.child, !1));
			}
			e = e.sibling;
		}
	}
	function Zl(e, t) {
		if (e.tag === 30) {
			var n = e.stateNode, r = e.memoizedProps, i = wi(r, n), a = Ei(r.default, n.paired ? r.share : r.enter);
			a === "none" ? Xl(e) : ql(e, i, a, null, !1) ? (Xl(e), n.paired || t || Nd(e, r.onEnter)) : Yl(e.child, !1);
		} else if (e.subtreeFlags & 33554432) for (e = e.child; e !== null;) Zl(e, t), e = e.sibling;
		else Xl(e);
	}
	function Ql(e) {
		if (Hl !== null && Hl.size !== 0) {
			var t = Hl;
			if (e.subtreeFlags & 18874368) for (e = e.child; e !== null;) {
				if (e.tag !== 22 || e.memoizedState === null) {
					if (e.tag === 30 && e.flags & 18874368) {
						var n = e.memoizedProps, r = n.name;
						if (r != null && r !== "auto") {
							var i = t.get(r);
							if (i !== void 0) {
								var a = Ei(n.default, n.share);
								if (a !== "none" && (ql(e, r, a, null, !1) ? (a = e.stateNode, i.paired = a, a.paired = i, Nd(e, n.onShare)) : Yl(e.child, !1)), t.delete(r), t.size === 0) break;
							}
						}
					}
					Ql(e);
				}
				e = e.sibling;
			}
		}
	}
	function $l(e) {
		if (e.tag === 30) {
			var t = e.memoizedProps, n = wi(t, e.stateNode), r = Hl === null ? void 0 : Hl.get(n), i = Ei(t.default, r === void 0 ? t.exit : t.share);
			i !== "none" && (ql(e, n, i, null, !1) ? r === void 0 ? Nd(e, t.onExit) : (i = e.stateNode, r.paired = i, i.paired = r, Hl.delete(n), Nd(e, t.onShare)) : Yl(e.child, !1)), Hl !== null && Ql(e);
		} else if (e.subtreeFlags & 33554432) for (e = e.child; e !== null;) $l(e), e = e.sibling;
		else Hl !== null && Ql(e);
	}
	function eu(e) {
		for (e = e.child; e !== null;) {
			if (e.tag === 30) {
				var t = e.memoizedProps, n = wi(t, e.stateNode);
				t = Ei(t.default, t.update), e.flags &= -5, t !== "none" && ql(e, n, t, e.memoizedState = [], !1);
			} else e.subtreeFlags & 33554432 && eu(e);
			e = e.sibling;
		}
	}
	function tu(e) {
		if (e.subtreeFlags & 18874368) for (e = e.child; e !== null;) {
			if (e.tag !== 22 || e.memoizedState === null) {
				if (e.tag === 30 && e.flags & 18874368) {
					var t = e.stateNode;
					t.paired !== null && (t.paired = null, Yl(e.child, !1));
				}
				tu(e);
			}
			e = e.sibling;
		}
	}
	function nu(e) {
		if (e.tag === 30) e.stateNode.paired = null, Yl(e.child, !1), tu(e);
		else if (e.subtreeFlags & 33554432) for (e = e.child; e !== null;) nu(e), e = e.sibling;
		else tu(e);
	}
	function ru(e) {
		for (e = e.child; e !== null;) e.tag === 30 ? Yl(e.child, !1) : e.subtreeFlags & 33554432 && ru(e), e = e.sibling;
	}
	function iu(e, t, n, r, i, a, o) {
		for (var s = !1; t !== null;) {
			if (t.tag === 5) {
				var c = t.stateNode;
				if (a !== null && Kl < a.length) {
					var l = a[Kl], u = Op(c);
					(l.view || u.view) && (s = !0);
					var d;
					if (d = !(e.flags & 4)) {
						if (u.clip) d = !0;
						else {
							d = l.rect;
							var f = u.rect;
							d = d.y !== f.y || d.x !== f.x || d.height !== f.height || d.width !== f.width;
						}
					}
					d && (e.flags |= 4), u.abs ? u = !l.abs : (l = l.rect, u = u.rect, u = l.height !== u.height || l.width !== u.width), u && (e.flags |= 32);
				} else e.flags |= 32;
				e.flags & 4 && Tp(c, Kl === 0 ? n : n + "_" + Kl, i), s && e.flags & 4 || (Wl === null && (Wl = []), Wl.push(c, Kl === 0 ? r : r + "_" + Kl, t.memoizedProps)), Kl++;
			} else (t.tag !== 22 || t.memoizedState === null) && (t.tag === 30 && o ? e.flags |= t.flags & 32 : iu(e, t.child, n, r, i, a, o) && (s = !0));
			t = t.sibling;
		}
		return s;
	}
	function au(e, t) {
		for (e = e.child; e !== null;) {
			if (e.tag === 30) {
				var n = e.memoizedProps, r = e.stateNode, i = wi(n, r), a = Ei(n.default, n.update);
				if (t) {
					r = r.clones;
					var o = r === null ? null : r.map(kp);
				} else o = e.memoizedState, e.memoizedState = null;
				r = e;
				var s = e.child;
				Kl = 0, i = iu(r, s, i, i, a, o, !1), e.flags & 4 && i && (t || Nd(e, n.onUpdate));
			} else e.subtreeFlags & 33554432 && au(e, t);
			e = e.sibling;
		}
	}
	var ou = !1, U = !1, su = !1, cu = !1, lu = typeof WeakSet == "function" ? WeakSet : Set, uu = null, du = !1, fu = !1, pu = !1, mu = !1;
	function hu(e, t, n) {
		if (e = e.containerInfo, sp = gh, e = ti(e), ni(e)) {
			if ("selectionStart" in e) var r = {
				start: e.selectionStart,
				end: e.selectionEnd
			};
			else a: {
				r = (r = e.ownerDocument) && r.defaultView || window;
				var i = r.getSelection && r.getSelection();
				if (i && i.rangeCount !== 0) {
					r = i.anchorNode;
					var a = i.anchorOffset, o = i.focusNode;
					i = i.focusOffset;
					try {
						r.nodeType, o.nodeType;
					} catch {
						r = null;
						break a;
					}
					var s = 0, c = -1, l = -1, u = 0, d = 0, f = e, p = null;
					b: for (;;) {
						for (var m; f !== r || a !== 0 && f.nodeType !== 3 || (c = s + a), f !== o || i !== 0 && f.nodeType !== 3 || (l = s + i), f.nodeType === 3 && (s += f.nodeValue.length), (m = f.firstChild) !== null;) p = f, f = m;
						for (;;) {
							if (f === e) break b;
							if (p === r && ++u === a && (c = s), p === o && ++d === i && (l = s), (m = f.nextSibling) !== null) break;
							f = p, p = f.parentNode;
						}
						f = m;
					}
					r = c === -1 || l === -1 ? null : {
						start: c,
						end: l
					};
				} else r = null;
			}
			r ||= {
				start: 0,
				end: 0
			};
		} else r = null;
		for (cp = {
			focusedElem: e,
			selectionRange: r
		}, gh = !1, n = (n & 335544064) === n, uu = t, t = n ? 9270 : 1024; uu !== null;) {
			if (e = uu, n && (r = e.deletions, r !== null)) for (a = 0; a < r.length; a++) n && $l(r[a]);
			if (e.alternate === null && e.flags & 2) n && Ul(e), gu(n);
			else {
				if (e.tag === 22) {
					if (r = e.alternate, e.memoizedState !== null) {
						r !== null && r.memoizedState === null && n && $l(r), gu(n);
						continue;
					}
					if (r !== null && r.memoizedState !== null) {
						n && Ul(e), gu(n);
						continue;
					}
				}
				r = e.child, (e.subtreeFlags & t) !== 0 && r !== null ? (r.return = e, uu = r) : (n && eu(e), gu(n));
			}
		}
		Hl = null;
	}
	function gu(e) {
		for (; uu !== null;) {
			var t = uu, n = e, r = t.alternate, a = t.flags;
			switch (t.tag) {
				case 0:
				case 11:
				case 15: break;
				case 1:
					if (a & 1024 && r !== null) {
						n = void 0, a = r.memoizedProps, r = r.memoizedState;
						var o = t.stateNode;
						try {
							var s = wc(t.type, a);
							n = o.getSnapshotBeforeUpdate(s, r), o.__reactInternalSnapshotBeforeUpdate = n;
						} catch (e) {
							Z(t, t.return, e);
						}
					}
					break;
				case 3:
					if (a & 1024) {
						if (r = t.stateNode.containerInfo, n = r.nodeType, n === 9) nm(r);
						else if (n === 1) switch (r.nodeName) {
							case "HEAD":
							case "HTML":
							case "BODY":
								nm(r);
								break;
							default: r.textContent = "";
						}
					}
					break;
				case 5:
				case 26:
				case 27:
				case 6:
				case 4:
				case 17: break;
				case 30:
					n && r !== null && (n = wi(r.memoizedProps, r.stateNode), a = t.memoizedProps, a = Ei(a.default, a.update), a !== "none" && ql(r, n, a, r.memoizedState = [], !0));
					break;
				default: if (a & 1024) throw Error(i(163));
			}
			if (r = t.sibling, r !== null) {
				r.return = t.return, uu = r;
				break;
			}
			uu = t.return;
		}
	}
	function _u(e, t, n) {
		var r = n.flags;
		switch (n.tag) {
			case 0:
			case 11:
			case 15:
				Iu(e, n), r & 4 && Cl(5, n);
				break;
			case 1:
				if (Iu(e, n), r & 4) {
					if (e = n.stateNode, t === null) try {
						e.componentDidMount();
					} catch (e) {
						Z(n, n.return, e);
					}
					else {
						var i = wc(n.type, t.memoizedProps);
						t = t.memoizedState;
						try {
							e.componentDidUpdate(i, t, e.__reactInternalSnapshotBeforeUpdate);
						} catch (e) {
							Z(n, n.return, e);
						}
					}
				}
				r & 64 && Tl(n), r & 512 && Dl(n, n.return);
				break;
			case 3:
				if (Iu(e, n), r & 64 && (e = n.updateQueue, e !== null)) {
					if (t = null, n.child !== null) switch (n.child.tag) {
						case 27:
						case 5:
							t = n.child.stateNode;
							break;
						case 1: t = n.child.stateNode;
					}
					try {
						ko(e, t);
					} catch (e) {
						Z(n, n.return, e);
					}
				}
				break;
			case 27: t === null && r & 4 && Bl(n);
			case 26:
			case 5:
				Iu(e, n), t === null && r & 4 && Pl(n), r & 512 && Dl(n, n.return);
				break;
			case 12:
				Iu(e, n);
				break;
			case 31:
				Iu(e, n), r & 4 && Tu(e, n);
				break;
			case 13:
				Iu(e, n), r & 4 && Eu(e, n), r & 64 && (e = n.memoizedState, e !== null && (e = e.dehydrated, e !== null && (n = _f.bind(null, n), cm(e, n))));
				break;
			case 22:
				if (r = n.memoizedState !== null || ou, !r) {
					var a = t !== null && t.memoizedState !== null || U;
					t = ou, i = U, ou = r, (U = a) && !i ? (r = 2, n.subtreeFlags & 8772 && (r |= 1), Ru(e, n, r)) : Iu(e, n), ou = t, U = i;
				}
				break;
			case 30:
				Iu(e, n), r & 512 && Dl(n, n.return);
				break;
			case 7: r & 512 && Dl(n, n.return);
			default: Iu(e, n);
		}
	}
	function vu(e, t) {
		for (e = e.child; e !== null;) yu(e, t), e = e.sibling;
	}
	function yu(e, t) {
		switch (e.tag) {
			case 5:
			case 26:
				try {
					var n = e.stateNode;
					if (t) {
						var r = n.style;
						typeof r.setProperty == "function" ? r.setProperty("display", "none", "important") : r.display = "none";
					} else {
						var i = e.stateNode, a = e.memoizedProps.style, o = a != null && a.hasOwnProperty("display") ? a.display : null;
						i.style.display = o == null || typeof o == "boolean" ? "" : ("" + o).trim();
					}
				} catch (t) {
					Z(e, e.return, t);
				}
				bu(e, t);
				break;
			case 6:
				try {
					e.stateNode.nodeValue = t ? "" : e.memoizedProps, j = !0;
				} catch (t) {
					Z(e, e.return, t);
				}
				break;
			case 18:
				try {
					var s = e.stateNode;
					t ? wp(s, !0) : wp(e.stateNode, !1);
				} catch (t) {
					Z(e, e.return, t);
				}
				break;
			case 22:
			case 23:
				e.memoizedState === null && vu(e, t);
				break;
			default: vu(e, t);
		}
	}
	function bu(e, t) {
		if (e.subtreeFlags & 67108864) for (e = e.child; e !== null;) {
			a: {
				var n = e, r = t;
				switch (n.tag) {
					case 4:
						yu(n, r);
						break a;
					case 22:
						n.memoizedState === null && bu(n, r);
						break a;
					default: bu(n, r);
				}
			}
			e = e.sibling;
		}
	}
	function xu(e) {
		var t = e.alternate;
		t !== null && (e.alternate = null, xu(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && zt(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
	}
	var W = null, Su = !1;
	function Cu(e, t, n) {
		for (n = n.child; n !== null;) wu(e, t, n), n = n.sibling;
	}
	function wu(e, t, n) {
		if (at && typeof at.onCommitFiberUnmount == "function") try {
			at.onCommitFiberUnmount(it, n);
		} catch {}
		switch (n.tag) {
			case 26:
				U || Ol(n, t), Cu(e, t, n), n.memoizedState ? n.memoizedState.count-- : n.stateNode && !U && (n = n.stateNode, n.parentNode.removeChild(n));
				break;
			case 27:
				U || Ol(n, t), jl(n);
				var r = W, i = Su;
				Sp(n.type) && (W = n.stateNode, Su = !1), Cu(e, t, n), gm(n.stateNode, n.type, n.memoizedProps), W = r, Su = i;
				break;
			case 5: U || Ol(n, t), jl(n);
			case 6:
				if (n.tag === 6 && jl(n), r = W, i = Su, W = null, Cu(e, t, n), W = r, Su = i, W !== null) {
					if (Su) try {
						(W.nodeType === 9 ? W.body : W.nodeName === "HTML" ? W.ownerDocument.body : W).removeChild(n.stateNode), j = !0;
					} catch (e) {
						Z(n, t, e);
					}
					else try {
						W.removeChild(n.stateNode), j = !0;
					} catch (e) {
						Z(n, t, e);
					}
				}
				break;
			case 18:
				W !== null && (Su ? (e = W, Cp(e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, n.stateNode), Hh(e)) : Cp(W, n.stateNode));
				break;
			case 4:
				r = W, i = Su, W = n.stateNode.containerInfo, Su = !0, Cu(e, t, n), W = r, Su = i;
				break;
			case 0:
			case 11:
			case 14:
			case 15:
				wl(2, n, t), U || wl(4, n, t), Cu(e, t, n);
				break;
			case 1:
				U || (Ol(n, t), r = n.stateNode, typeof r.componentWillUnmount == "function" && El(n, t, r)), Cu(e, t, n);
				break;
			case 21:
				Cu(e, t, n);
				break;
			case 22:
				U = (r = U) || n.memoizedState !== null, Cu(e, t, n), U = r;
				break;
			case 30:
				Ol(n, t), Cu(e, t, n);
				break;
			case 7:
				U || Ol(n, t), Cu(e, t, n);
				break;
			default: Cu(e, t, n);
		}
	}
	function Tu(e, t) {
		if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null))) {
			e = e.dehydrated;
			try {
				Hh(e);
			} catch (e) {
				Z(t, t.return, e);
			}
		}
	}
	function Eu(e, t) {
		if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null && (e = e.dehydrated, e !== null)))) try {
			Hh(e);
		} catch (e) {
			Z(t, t.return, e);
		}
	}
	function Du(e) {
		switch (e.tag) {
			case 31:
			case 13:
			case 19:
				var t = e.stateNode;
				return t === null && (t = e.stateNode = new lu()), t;
			case 22: return e = e.stateNode, t = e._retryCache, t === null && (t = e._retryCache = new lu()), t;
			default: throw Error(i(435, e.tag));
		}
	}
	function Ou(e, t) {
		var n = Du(e);
		t.forEach(function(t) {
			if (!n.has(t)) {
				n.add(t);
				var r = vf.bind(null, e, t);
				t.then(r, r);
			}
		});
	}
	function ku(e, t, n) {
		var r = t.deletions;
		if (r !== null) for (var a = 0; a < r.length; a++) {
			var o = r[a], s = e, c = t, l = c;
			a: for (; l !== null;) {
				switch (l.tag) {
					case 27:
						if (Sp(l.type)) {
							W = l.stateNode, Su = !1;
							break a;
						}
						break;
					case 5:
						W = l.stateNode, Su = !1;
						break a;
					case 3:
					case 4:
						W = l.stateNode.containerInfo, Su = !0;
						break a;
				}
				l = l.return;
			}
			if (W === null) throw Error(i(160));
			wu(s, c, o), W = null, Su = !1, s = o.alternate, s !== null && (s.return = null), o.return = null;
		}
		if (t.subtreeFlags & 13886) for (t = t.child; t !== null;) ju(t, e, n), t = t.sibling;
	}
	var Au = null;
	function ju(e, t, n) {
		var r = e.alternate, a = e.flags;
		switch (e.tag) {
			case 0:
			case 11:
			case 14:
			case 15:
				if (a & 4 && (r = e.updateQueue, r = r === null ? null : r.events, r !== null)) for (var o = 0; o < r.length; o++) {
					var s = r[o];
					s.ref.impl = s.nextImpl;
				}
				ku(t, e, n), Mu(e), a & 4 && (wl(3, e, e.return), Cl(3, e), wl(5, e, e.return));
				break;
			case 1:
				ku(t, e, n), Mu(e), a & 512 && (U || r === null || Ol(r, r.return)), a & 64 && ou && (e = e.updateQueue, e !== null && (t = e.callbacks, t !== null && (n = e.shared.hiddenCallbacks, e.shared.hiddenCallbacks = n === null ? t : n.concat(t))));
				break;
			case 26:
				if (o = Au, ku(t, e, n), Mu(e), a & 512 && (U || r === null || Ol(r, r.return)), a & 4) {
					if (a = r === null ? null : r.memoizedState, n = e.memoizedState, r === null) {
						if (n === null) {
							if (e.stateNode === null) {
								if (ou) e.stateNode = fp(e.type, e.memoizedProps, t.containerInfo, e);
								else {
									a: {
										t = e.type, n = e.memoizedProps, a = o.ownerDocument || o;
										b: switch (t) {
											case "title":
												r = a.getElementsByTagName("title")[0], (!r || r[Lt] || r[At] || r.namespaceURI === "http://www.w3.org/2000/svg" || r.hasAttribute("itemprop")) && (r = a.createElement(t), a.head.insertBefore(r, a.querySelector("head > title"))), np(r, t, n), r[At] = e, Wt(r), t = r;
												break a;
											case "link":
												if (o = Gm("link", "href", a).get(t + (n.href || ""))) {
													for (s = 0; s < o.length; s++) if (r = o[s], r.getAttribute("href") === (n.href == null || n.href === "" ? null : n.href) && r.getAttribute("rel") === (n.rel == null ? null : n.rel) && r.getAttribute("title") === (n.title == null ? null : n.title) && r.getAttribute("crossorigin") === (n.crossOrigin == null ? null : n.crossOrigin)) {
														o.splice(s, 1);
														break b;
													}
												}
												r = a.createElement(t), np(r, t, n), a.head.appendChild(r);
												break;
											case "meta":
												if (o = Gm("meta", "content", a).get(t + (n.content || ""))) {
													for (s = 0; s < o.length; s++) if (r = o[s], r.getAttribute("content") === (n.content == null ? null : "" + n.content) && r.getAttribute("name") === (n.name == null ? null : n.name) && r.getAttribute("property") === (n.property == null ? null : n.property) && r.getAttribute("http-equiv") === (n.httpEquiv == null ? null : n.httpEquiv) && r.getAttribute("charset") === (n.charSet == null ? null : n.charSet)) {
														o.splice(s, 1);
														break b;
													}
												}
												r = a.createElement(t), np(r, t, n), a.head.appendChild(r);
												break;
											default: throw Error(i(468, t));
										}
										r[At] = e, Wt(r), t = r;
									}
									e.stateNode = t;
								}
							} else ou || Km(o, e.type, e.stateNode);
						} else e.stateNode = Bm(o, n, e.memoizedProps);
					} else a === n ? n === null && e.stateNode !== null && Fl(e, e.memoizedProps, r.memoizedProps) : (a === null ? (t = r.stateNode, t === null || U || t.parentNode.removeChild(t)) : a.count--, n === null ? ou || Km(o, e.type, e.stateNode) : Bm(o, n, e.memoizedProps));
				}
				break;
			case 27:
				ku(t, e, n), Mu(e), a & 512 && (U || r === null || Ol(r, r.return)), r !== null && a & 4 && Fl(e, e.memoizedProps, r.memoizedProps);
				break;
			case 5:
				if (o = su, su = !1, ku(t, e, n), su = o, Mu(e), a & 512 && (U || r === null || Ol(r, r.return)), e.flags & 32) {
					t = e.stateNode;
					try {
						vn(t, ""), j = !0;
					} catch (t) {
						Z(e, e.return, t);
					}
				}
				a & 4 && e.stateNode != null && (t = e.memoizedProps, Fl(e, t, r === null ? t : r.memoizedProps)), a & 1024 && (cu = !0);
				break;
			case 6:
				if (ku(t, e, n), Mu(e), a & 4) {
					if (e.stateNode === null) throw Error(i(162));
					t = e.memoizedProps, n = e.stateNode;
					try {
						n.nodeValue = t, j = !0;
					} catch (t) {
						Z(e, e.return, t);
					}
				}
				break;
			case 3:
				if (j = !1, Wm = null, o = Au, Au = bm(t.containerInfo), ku(t, e, n), Au = o, Mu(e), a & 4 && r !== null && r.memoizedState.isDehydrated) try {
					Hh(t.containerInfo);
				} catch (t) {
					Z(e, e.return, t);
				}
				cu && (cu = !1, Nu(e)), j = !1;
				break;
			case 4:
				a = su, su = ou, r = en(), o = Au, Au = bm(e.stateNode.containerInfo), ku(t, e, n), Mu(e), Au = o, j && fu && (pu = !0), j = r, su = a;
				break;
			case 12:
				ku(t, e, n), Mu(e);
				break;
			case 31:
				ku(t, e, n), Mu(e), a & 4 && (t = e.updateQueue, t !== null && (e.updateQueue = null, Ou(e, t)));
				break;
			case 13:
				ku(t, e, n), Mu(e), e.child.flags & 8192 && e.memoizedState !== null != (r !== null && r.memoizedState !== null) && (hd = Ye()), a & 4 && (t = e.updateQueue, t !== null && (e.updateQueue = null, Ou(e, t)));
				break;
			case 22:
				o = e.memoizedState !== null, s = r !== null && r.memoizedState !== null;
				var c = ou, l = U, u = su;
				ou = c || o, su = u || o, U = l || s, ku(t, e, n), U = l, su = u, ou = c, Mu(e), a & 8192 && (t = e.stateNode, t._visibility = o ? t._visibility & -2 : t._visibility | 1, !o || r === null || s || ou || U || (t = s || U, n = ou, r = U, ou = o || ou, U = t, Lu(e, 2), ou = n, U = r), !o && su || vu(e, o)), a & 4 && (t = e.updateQueue, t !== null && (n = t.retryQueue, n !== null && (t.retryQueue = null, Ou(e, n))));
				break;
			case 19:
				ku(t, e, n), Mu(e), a & 4 && (t = e.updateQueue, t !== null && (e.updateQueue = null, Ou(e, t)));
				break;
			case 30:
				a & 512 && (U || r === null || Ol(r, r.return)), a = en(), o = fu, s = (n & 335544064) === n, c = e.memoizedProps, fu = s && Ei(c.default, c.update) !== "none", ku(t, e, n), Mu(e), s && r !== null && j && (e.flags |= 4), fu = o, j = a;
				break;
			case 21: break;
			case 7: a & 512 && (U || r === null || Ol(r, r.return)), r && r.stateNode !== null && (r.stateNode._fragmentFiber = e);
			default: ku(t, e, n), Mu(e);
		}
	}
	function Mu(e) {
		var t = e.flags;
		if (t & 2) {
			try {
				for (var n, r = e.return; r !== null;) {
					if (Il(r)) {
						n = r;
						break;
					}
					r = r.return;
				}
				r = null;
				for (var a = e.return; a !== null;) {
					if (Nl(a)) {
						var o = a.stateNode;
						r === null ? r = [o] : r.push(o);
					}
					if (Ml(a)) break;
					a = a.return;
				}
				var s = r;
				if (n == null) throw Error(i(160));
				switch (n.tag) {
					case 27:
						var c = n.stateNode;
						zl(e, Ll(e), c, s);
						break;
					case 5:
						var l = n.stateNode;
						n.flags & 32 && (vn(l, ""), n.flags &= -33), zl(e, Ll(e), l, s);
						break;
					case 3:
					case 4:
						var u = n.stateNode.containerInfo;
						Rl(e, Ll(e), u, s);
						break;
					default: throw Error(i(161));
				}
			} catch (t) {
				Z(e, e.return, t);
			}
			e.flags &= -3;
		}
		t & 4096 && (e.flags &= -4097);
	}
	function Nu(e) {
		if (e.subtreeFlags & 1024) for (e = e.child; e !== null;) {
			var t = e;
			Nu(t), t.tag === 5 && t.flags & 1024 && (t = t.stateNode, gh = !0, t.reset(), gh = !1), e = e.sibling;
		}
	}
	function Pu(e, t) {
		if (t.subtreeFlags & 9270) for (t = t.child; t !== null;) Fu(t, e), t = t.sibling;
		else au(t, !1);
	}
	function Fu(e, t) {
		var n = e.alternate;
		if (n === null) Zl(e, !1);
		else switch (e.tag) {
			case 3:
				if (mu = du = !1, Gl(), Pu(t, e), !du && !pu) {
					if (e = Wl, e !== null) for (var r = 0; r < e.length; r += 3) {
						n = e[r];
						var i = e[r + 1];
						Ep(n, e[r + 2]), n = n.ownerDocument.documentElement, n !== null && n.animate({
							opacity: [0, 0],
							pointerEvents: ["none", "none"]
						}, {
							duration: 0,
							fill: "forwards",
							pseudoElement: "::view-transition-group(" + i + ")"
						});
					}
					e = t.containerInfo, e = e.nodeType === 9 ? e.documentElement : e.ownerDocument.documentElement, e !== null && e.style.viewTransitionName === "" && (e.style.viewTransitionName = "none", e.animate({
						opacity: [0, 0],
						pointerEvents: ["none", "none"]
					}, {
						duration: 0,
						fill: "forwards",
						pseudoElement: "::view-transition-group(root)"
					}), e.animate({
						width: [0, 0],
						height: [0, 0]
					}, {
						duration: 0,
						fill: "forwards",
						pseudoElement: "::view-transition"
					})), mu = !0;
				}
				Wl = null;
				break;
			case 5:
				Pu(t, e);
				break;
			case 4:
				r = du, du = !1, Pu(t, e), du && (pu = !0), du = r;
				break;
			case 22:
				e.memoizedState === null && (n.memoizedState === null ? Pu(t, e) : Zl(e, !1));
				break;
			case 30:
				r = du, i = Gl(), du = !1, Pu(t, e), du && (e.flags |= 4);
				var a = e.memoizedProps, o = e.stateNode;
				t = wi(a, o), o = wi(n.memoizedProps, o);
				var s = Ei(a.default, a.update);
				s === "none" ? t = !1 : (a = n.memoizedState, n.memoizedState = null, n = e.child, Kl = 0, t = iu(e, n, t, o, s, a, !0), Kl !== (a === null ? 0 : a.length) && (e.flags |= 32)), e.flags & 4 && t ? (Nd(e, e.memoizedProps.onUpdate), Wl = i) : i !== null && (i.push.apply(i, Wl), Wl = i), du = e.flags & 32 ? !0 : r;
				break;
			default: Pu(t, e);
		}
	}
	function Iu(e, t) {
		if (t.subtreeFlags & 8772) for (t = t.child; t !== null;) _u(e, t.alternate, t), t = t.sibling;
	}
	function Lu(e, t) {
		for (e = e.child; e !== null;) {
			var n = e, r = t;
			switch (n.tag) {
				case 0:
				case 11:
				case 14:
				case 15:
					wl(4, n, n.return), Lu(n, r);
					break;
				case 1:
					Ol(n, n.return);
					var i = n.stateNode;
					typeof i.componentWillUnmount == "function" && El(n, n.return, i), Lu(n, r);
					break;
				case 27: r & 2 && gm(n.stateNode, n.type, n.memoizedProps);
				case 5:
					Ol(n, n.return), n.tag !== 5 && n.tag !== 27 || jl(n), Lu(n, r);
					break;
				case 6:
					jl(n);
					break;
				case 26:
					Ol(n, n.return), i = n.stateNode, n.memoizedState !== null || i === null || U || i.parentNode.removeChild(i), Lu(n, r);
					break;
				case 22:
					n.memoizedState === null && Lu(n, r);
					break;
				case 30:
					Ol(n, n.return), Lu(n, r);
					break;
				case 7: Ol(n, n.return);
				default: Lu(n, r);
			}
			e = e.sibling;
		}
	}
	function Ru(e, t, n) {
		for (n = t.subtreeFlags & 8772 ? n : n & -2, t = t.child; t !== null;) {
			var r = t.alternate, i = e, a = t, o = a.flags, s = !!(n & 1);
			switch (a.tag) {
				case 0:
				case 11:
				case 15:
					Ru(i, a, n), Cl(4, a);
					break;
				case 1:
					if (Ru(i, a, n), r = a, i = r.stateNode, typeof i.componentDidMount == "function") try {
						i.componentDidMount();
					} catch (e) {
						Z(r, r.return, e);
					}
					if (r = a, i = r.updateQueue, i !== null) {
						var c = r.stateNode;
						try {
							var l = i.shared.hiddenCallbacks;
							if (l !== null) for (i.shared.hiddenCallbacks = null, i = 0; i < l.length; i++) Oo(l[i], c);
						} catch (e) {
							Z(r, r.return, e);
						}
					}
					s && o & 64 && Tl(a), Dl(a, a.return);
					break;
				case 27: n & 2 && Bl(a);
				case 5:
					a.tag !== 5 && a.tag !== 27 || Al(a), Ru(i, a, n), s && r === null && o & 4 && Pl(a), Dl(a, a.return);
					break;
				case 6:
					Al(a);
					break;
				case 26:
					c = a.stateNode, a.memoizedState !== null || c === null || ou || Km(bm(c.ownerDocument), a.type, c), Ru(i, a, n), s && r === null && o & 4 && Pl(a), Dl(a, a.return);
					break;
				case 12:
					Ru(i, a, n);
					break;
				case 31:
					Ru(i, a, n), s && o & 4 && Tu(i, a);
					break;
				case 13:
					Ru(i, a, n), s && o & 4 && Eu(i, a);
					break;
				case 22:
					a.memoizedState === null && Ru(i, a, n), Dl(a, a.return);
					break;
				case 30:
					Ru(i, a, n), Dl(a, a.return);
					break;
				case 7: Dl(a, a.return);
				default: Ru(i, a, n);
			}
			t = t.sibling;
		}
	}
	function zu(e, t) {
		var n = null;
		e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== n && (e != null && e.refCount++, n != null && La(n));
	}
	function Bu(e, t) {
		e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && La(e));
	}
	function Vu(e, t, n, r) {
		var i = (n & 335544064) === n;
		if (t.subtreeFlags & (i ? 10262 : 10256)) for (t = t.child; t !== null;) Hu(e, t, n, r), t = t.sibling;
		else i && ru(t);
	}
	function Hu(e, t, n, r) {
		var i = (n & 335544064) === n;
		i && t.alternate === null && t.return !== null && t.return.alternate !== null && nu(t);
		var a = t.flags;
		switch (t.tag) {
			case 0:
			case 11:
			case 15:
				Vu(e, t, n, r), a & 2048 && Cl(9, t);
				break;
			case 1:
				Vu(e, t, n, r);
				break;
			case 3:
				Vu(e, t, n, r), i && mu && (e = e.containerInfo, e = e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, e.style.viewTransitionName === "root" && (e.style.viewTransitionName = ""), e = e.ownerDocument.documentElement, e !== null && e.style.viewTransitionName === "none" && (e.style.viewTransitionName = "")), a & 2048 && (a = null, t.alternate !== null && (a = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== a && (t.refCount++, a != null && La(a)));
				break;
			case 12:
				if (a & 2048) {
					Vu(e, t, n, r), a = t.stateNode;
					try {
						var o = t.memoizedProps, s = o.id, c = o.onPostCommit;
						typeof c == "function" && c(s, t.alternate === null ? "mount" : "update", a.passiveEffectDuration, -0);
					} catch (e) {
						Z(t, t.return, e);
					}
				} else Vu(e, t, n, r);
				break;
			case 31:
				Vu(e, t, n, r);
				break;
			case 13:
				Vu(e, t, n, r);
				break;
			case 23: break;
			case 22:
				o = t.stateNode, s = t.alternate, t.memoizedState === null ? (i && s !== null && s.memoizedState !== null && nu(t), o._visibility & 2 ? Vu(e, t, n, r) : (o._visibility |= 2, Uu(e, t, n, r, !!(t.subtreeFlags & 10256) || !1))) : (i && s !== null && s.memoizedState === null && nu(s), o._visibility & 2 ? Vu(e, t, n, r) : Wu(e, t)), a & 2048 && zu(s, t);
				break;
			case 24:
				Vu(e, t, n, r), a & 2048 && Bu(t.alternate, t);
				break;
			case 30:
				i && (a = t.alternate, a !== null && (Yl(a.child, !0), Yl(t.child, !0))), Vu(e, t, n, r);
				break;
			default: Vu(e, t, n, r);
		}
	}
	function Uu(e, t, n, r, i) {
		for (i &&= !!(t.subtreeFlags & 10256) || !1, t = t.child; t !== null;) {
			var a = e, o = t, s = n, c = r, l = o.flags;
			switch (o.tag) {
				case 0:
				case 11:
				case 15:
					Uu(a, o, s, c, i), Cl(8, o);
					break;
				case 23: break;
				case 22:
					var u = o.stateNode;
					o.memoizedState === null ? (u._visibility |= 2, Uu(a, o, s, c, i)) : u._visibility & 2 ? Uu(a, o, s, c, i) : Wu(a, o), i && l & 2048 && zu(o.alternate, o);
					break;
				case 24:
					Uu(a, o, s, c, i), i && l & 2048 && Bu(o.alternate, o);
					break;
				default: Uu(a, o, s, c, i);
			}
			t = t.sibling;
		}
	}
	function Wu(e, t) {
		if (t.subtreeFlags & 10256) for (t = t.child; t !== null;) {
			var n = e, r = t, i = r.flags;
			switch (r.tag) {
				case 22:
					Wu(n, r), i & 2048 && zu(r.alternate, r);
					break;
				case 24:
					Wu(n, r), i & 2048 && Bu(r.alternate, r);
					break;
				default: Wu(n, r);
			}
			t = t.sibling;
		}
	}
	var Gu = 8192;
	function Ku(e, t, n) {
		if (e.subtreeFlags & Gu) for (e = e.child; e !== null;) qu(e, t, n), e = e.sibling;
	}
	function qu(e, t, n) {
		switch (e.tag) {
			case 26:
				Ku(e, t, n), e.flags & Gu && (e.memoizedState === null ? (e = e.stateNode, (t & 335544128) === t && Zm(n, e)) : Qm(n, Au, e.memoizedState, e.memoizedProps));
				break;
			case 5:
				Ku(e, t, n), e.flags & Gu && (e = e.stateNode, (t & 335544128) === t && Zm(n, e));
				break;
			case 3:
			case 4:
				var r = Au;
				Au = bm(e.stateNode.containerInfo), Ku(e, t, n), Au = r;
				break;
			case 22:
				e.memoizedState === null && (r = e.alternate, r !== null && r.memoizedState !== null ? (r = Gu, Gu = 16777216, Ku(e, t, n), Gu = r) : Ku(e, t, n));
				break;
			case 30:
				if ((e.flags & Gu) !== 0 && (r = e.memoizedProps.name, r != null && r !== "auto")) {
					var i = e.stateNode;
					i.paired = null, Hl === null && (Hl = /* @__PURE__ */ new Map()), Hl.set(r, i);
				}
				Ku(e, t, n);
				break;
			default: Ku(e, t, n);
		}
	}
	function Ju(e) {
		var t = e.alternate;
		if (t !== null && (e = t.child, e !== null)) {
			t.child = null;
			do
				t = e.sibling, e.sibling = null, e = t;
			while (e !== null);
		}
	}
	function Yu(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				uu = r, Qu(r, e);
			}
			Ju(e);
		}
		if (e.subtreeFlags & 10256) for (e = e.child; e !== null;) Xu(e), e = e.sibling;
	}
	function Xu(e) {
		switch (e.tag) {
			case 0:
			case 11:
			case 15:
				Yu(e), e.flags & 2048 && wl(9, e, e.return);
				break;
			case 3:
				Yu(e);
				break;
			case 12:
				Yu(e);
				break;
			case 22:
				var t = e.stateNode;
				e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3, Zu(e)) : Yu(e);
				break;
			default: Yu(e);
		}
	}
	function Zu(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				uu = r, Qu(r, e);
			}
			Ju(e);
		}
		for (e = e.child; e !== null;) {
			switch (t = e, t.tag) {
				case 0:
				case 11:
				case 15:
					wl(8, t, t.return), Zu(t);
					break;
				case 22:
					n = t.stateNode, n._visibility & 2 && (n._visibility &= -3, Zu(t));
					break;
				default: Zu(t);
			}
			e = e.sibling;
		}
	}
	function Qu(e, t) {
		for (; uu !== null;) {
			var n = uu;
			switch (n.tag) {
				case 0:
				case 11:
				case 15:
					wl(8, n, t);
					break;
				case 23:
				case 22:
					if (n.memoizedState !== null && n.memoizedState.cachePool !== null) {
						var r = n.memoizedState.cachePool.pool;
						r != null && r.refCount++;
					}
					break;
				case 24: La(n.memoizedState.cache);
			}
			if (r = n.child, r !== null) r.return = n, uu = r;
			else a: for (n = e; uu !== null;) {
				r = uu;
				var i = r.sibling, a = r.return;
				if (xu(r), r === n) {
					uu = null;
					break a;
				}
				if (i !== null) {
					i.return = a, uu = i;
					break a;
				}
				uu = a;
			}
		}
	}
	var $u = {
		getCacheForType: function(e) {
			var t = Aa(I), n = t.data.get(e);
			return n === void 0 && (n = e(), t.data.set(e, n)), n;
		},
		cacheSignal: function() {
			return Aa(I).controller.signal;
		}
	}, ed = typeof WeakMap == "function" ? WeakMap : Map, G = 0, K = null, q = null, J = 0, Y = 0, td = null, nd = !1, rd = !1, id = !1, ad = 0, od = 0, sd = 0, cd = 0, ld = 0, ud = 0, dd = 0, fd = null, pd = null, md = !1, hd = 0, gd = 0, _d = Infinity, vd = null, yd = null, X = 0, bd = null, xd = null, Sd = 0, Cd = 0, wd = null, Td = null, Ed = null, Dd = null, Od = null, kd = 0, Ad = null;
	function jd() {
		return G & 2 && J !== 0 ? J & -J : D.T === null ? Dt() : Pf();
	}
	function Md() {
		if (ud === 0) {
			if (!(J & 536870912) || P) {
				var e = ft;
				ft <<= 1, !(ft & 3932160) && (ft = 262144), ud = e;
			} else ud = 536870912;
		}
		return e = Po.current, e !== null && (e.flags |= 32), ud;
	}
	function Nd(e, t) {
		if (t != null) {
			var n = e.stateNode, r = n.ref;
			r === null && (r = n.ref = Pp(wi(e.memoizedProps, n))), Dd === null && (Dd = []), Dd.push(t.bind(null, r));
		}
	}
	function Pd(e, t, n) {
		(e === K && (Y === 2 || Y === 9) || e.cancelPendingCommit !== null) && (Vd(e, 0), Rd(e, J, ud, !1)), bt(e, n), G & 2 && e === K || (e === K && (!(G & 2) && (cd |= n), od === 4 && Rd(e, J, ud, !1)), Ef(e));
	}
	function Fd(e, t, n) {
		if (G & 6) throw Error(i(327));
		var r = !n && !(t & 127) && (t & e.expiredLanes) === 0 || ht(e, t), a = r ? Yd(e, t) : qd(e, t, !0), o = r;
		do {
			if (a === 0) {
				rd && !r && Rd(e, t, 0, !1);
				break;
			}
			if (n = e.current.alternate, o && !Ld(n)) a = qd(e, t, !1), o = !1;
			else {
				if (a === 2) {
					if (o = t, e.errorRecoveryDisabledLanes & o) var s = 0;
					else s = e.pendingLanes & -536870913, s = s === 0 ? s & 536870912 ? 536870912 : 0 : s;
					if (s !== 0) {
						t = s;
						a: {
							var c = e;
							a = fd;
							var l = c.current.memoizedState.isDehydrated;
							if (l && (Vd(c, s).flags |= 256), s = qd(c, s, !1), s !== 2 && s !== 6) {
								if (id && !l) {
									c.errorRecoveryDisabledLanes |= o, cd |= o, a = 4;
									break a;
								}
								o = pd, pd = a, o !== null && (pd === null ? pd = o : pd.push.apply(pd, o));
							}
							a = s;
						}
						if (o = !1, a !== 2) continue;
					}
				}
				if (a === 1) {
					Vd(e, 0), Rd(e, t, 0, !0);
					break;
				}
				a: {
					switch (r = e, o = a, o) {
						case 0:
						case 1: throw Error(i(345));
						case 4: if ((t & 4194048) !== t && (t & 62914560) !== t) break;
						case 6:
							Rd(r, t, ud, !nd);
							break a;
						case 2:
							pd = null;
							break;
						case 3:
						case 5: break;
						default: throw Error(i(329));
					}
					if ((t & 62914560) === t && (a = hd + 300 - Ye(), 10 < a)) {
						if (Rd(r, t, ud, !nd), A(r, 0, !0) !== 0) break a;
						Sd = t, r.timeoutHandle = gp(Id.bind(null, r, n, pd, vd, md, t, ud, cd, dd, nd, o, "Throttled", -0, 0), a);
						break a;
					}
					Id(r, n, pd, vd, md, t, ud, cd, dd, nd, o, null, -0, 0);
				}
				break;
			}
		} while (1);
		Ef(e);
	}
	function Id(e, t, n, r, i, a, o, s, c, l, u, d, f, p) {
		e.timeoutHandle = -1;
		var m = t.subtreeFlags, h = (a & 335544064) === a;
		d = null, (h || m & 8192 || (m & 16785408) == 16785408) && (d = {
			stylesheets: null,
			count: 0,
			imgCount: 0,
			imgBytes: 0,
			suspenseyImages: [],
			waitingForImages: !0,
			waitingForViewTransition: !1,
			unsuspend: En
		}, Hl = null, qu(t, a, d), h && (m = d, h = e.containerInfo, h = (h.nodeType === 9 ? h : h.ownerDocument).__reactViewTransition, h != null && (m.count++, m.waitingForViewTransition = !0, m = nh.bind(m), h.finished.then(m, m))), m = (a & 62914560) === a ? hd - Ye() : (a & 4194048) === a ? gd - Ye() : 0, m = eh(d, m), m !== null) ? (Sd = a, e.cancelPendingCommit = m(nf.bind(null, e, t, a, n, r, i, o, s, c, l, u, d, null, f, p)), Rd(e, a, o, !l)) : nf(e, t, a, n, r, i, o, s, c, l, u, d);
	}
	function Ld(e) {
		for (var t = e;;) {
			var n = t.tag;
			if ((n === 0 || n === 11 || n === 15) && t.flags & 16384 && (n = t.updateQueue, n !== null && (n = n.stores, n !== null))) for (var r = 0; r < n.length; r++) {
				var i = n[r], a = i.getSnapshot;
				i = i.value;
				try {
					if (!Yr(a(), i)) return !1;
				} catch {
					return !1;
				}
			}
			if (n = t.child, t.subtreeFlags & 16384 && n !== null) n.return = t, t = n;
			else {
				if (t === e) break;
				for (; t.sibling === null;) {
					if (t.return === null || t.return === e) return !0;
					t = t.return;
				}
				t.sibling.return = t.return, t = t.sibling;
			}
		}
		return !0;
	}
	function Rd(e, t, n, r) {
		t = gt(e, t), t &= ~ld, t &= ~cd, e.suspendedLanes |= t, e.pingedLanes &= ~t, r && (e.warmLanes |= t), r = e.expirationTimes;
		for (var i = t; 0 < i;) {
			var a = 31 - st(i), o = 1 << a;
			r[a] = -1, i &= ~o;
		}
		n !== 0 && St(e, n, t);
	}
	function zd() {
		return G & 6 ? !0 : (Df(0, !1), !1);
	}
	function Bd() {
		if (q !== null) {
			if (Y === 0) var e = q.return;
			else e = q, Sa = F = null, os(e), lo = null, uo = 0, e = q;
			for (; e !== null;) Sl(e.alternate, e), e = e.return;
			q = null;
		}
	}
	function Vd(e, t) {
		var n = e.timeoutHandle;
		return n !== -1 && (e.timeoutHandle = -1, _p(n)), n = e.cancelPendingCommit, n !== null && (e.cancelPendingCommit = null, n()), Sd = 0, Bd(), K = e, q = n = Vi(e.current, null), J = t, Y = 0, td = null, nd = !1, rd = ht(e, t), id = !1, dd = ud = ld = cd = sd = od = 0, pd = fd = null, md = !1, ad = gt(e, t), ji(), n;
	}
	function Hd(e, t) {
		R = null, D.H = gc, t === $a || t === to ? (t = so(), Y = 3) : t === eo ? (t = so(), Y = 4) : Y = t === Pc ? 8 : typeof t == "object" && t && typeof t.then == "function" ? 6 : 1, td = t, q === null && (od = 1, Oc(e, Yi(t, e.current)));
	}
	function Ud() {
		var e = Po.current;
		return e === null ? !0 : (J & 4194048) === J ? Fo === null : (J & 62914560) === J || J & 536870912 ? e === Fo : !1;
	}
	function Wd() {
		var e = D.H;
		return D.H = gc, e === null ? gc : e;
	}
	function Gd() {
		var e = D.A;
		return D.A = $u, e;
	}
	function Kd() {
		od = 4, nd || (J & 4194048) !== J && Po.current !== null || (rd = !0), !(sd & 134217727) && !(cd & 134217727) || K === null || Rd(K, J, ud, !1);
	}
	function qd(e, t, n) {
		var r = G;
		G |= 2;
		var i = Wd(), a = Gd();
		(K !== e || J !== t) && (vd = null, Vd(e, t)), t = !1;
		var o = od;
		a: do
			try {
				if (Y !== 0 && q !== null) {
					var s = q, c = td;
					switch (Y) {
						case 8:
							Bd(), o = 6;
							break a;
						case 3:
						case 2:
						case 9:
						case 6:
							Po.current === null && (t = !0);
							var l = Y;
							if (Y = 0, td = null, $d(e, s, c, l), n && rd) {
								o = 0;
								break a;
							}
							break;
						default: l = Y, Y = 0, td = null, $d(e, s, c, l);
					}
				}
				Jd(), o = od;
				break;
			} catch (t) {
				Hd(e, t);
			}
		while (1);
		return t && e.shellSuspendCounter++, Sa = F = null, G = r, D.H = i, D.A = a, q === null && (K = null, J = 0, ji()), o;
	}
	function Jd() {
		for (; q !== null;) Zd(q);
	}
	function Yd(e, t) {
		var n = G;
		G |= 2;
		var r = Wd(), a = Gd();
		K !== e || J !== t ? (vd = null, _d = Ye() + 500, Vd(e, t)) : rd = ht(e, t);
		a: do
			try {
				if (Y !== 0 && q !== null) {
					t = q;
					var o = td;
					b: switch (Y) {
						case 1:
							Y = 0, td = null, $d(e, t, o, 1);
							break;
						case 2:
						case 9:
							if (ro(o)) {
								Y = 0, td = null, Qd(t);
								break;
							}
							t = function() {
								Y !== 2 && Y !== 9 || K !== e || (Y = 7), Ef(e);
							}, o.then(t, t);
							break a;
						case 3:
							Y = 7;
							break a;
						case 4:
							Y = 5;
							break a;
						case 7:
							ro(o) ? (Y = 0, td = null, Qd(t)) : (Y = 0, td = null, $d(e, t, o, 7));
							break;
						case 5:
							var s = null;
							switch (q.tag) {
								case 26: s = q.memoizedState;
								case 5:
								case 27:
									var c = q;
									if (s ? Ym(s) : c.stateNode.complete) {
										Y = 0, td = null;
										var l = c.sibling;
										if (l !== null) q = l;
										else {
											var u = c.return;
											u === null ? q = null : (q = u, ef(u));
										}
										break b;
									}
							}
							Y = 0, td = null, $d(e, t, o, 5);
							break;
						case 6:
							Y = 0, td = null, $d(e, t, o, 6);
							break;
						case 8:
							Bd(), od = 6;
							break a;
						default: throw Error(i(462));
					}
				}
				Xd();
				break;
			} catch (t) {
				Hd(e, t);
			}
		while (1);
		return Sa = F = null, D.H = r, D.A = a, G = n, q === null ? (K = null, J = 0, ji(), od) : 0;
	}
	function Xd() {
		for (; q !== null && !qe();) Zd(q);
	}
	function Zd(e) {
		var t = ml(e.alternate, e, ad);
		e.memoizedProps = e.pendingProps, t === null ? ef(e) : q = t;
	}
	function Qd(e) {
		var t = e, n = t.alternate;
		switch (t.tag) {
			case 15:
			case 0:
				t = Jc(n, t, t.pendingProps, t.type, void 0, J);
				break;
			case 11:
				t = Jc(n, t, t.pendingProps, t.type.render, t.ref, J);
				break;
			case 5:
				os(t);
				var r = t;
				r === ua && (P ? (ga(r), r.tag === 5 && r.stateNode != null && (N = r.stateNode)) : (ga(r), P = !0));
			default: Sl(n, t), t = q = Hi(t, ad), t = ml(n, t, ad);
		}
		e.memoizedProps = e.pendingProps, t === null ? ef(e) : q = t;
	}
	function $d(e, t, n, r) {
		Sa = F = null, os(t), lo = null, uo = 0;
		var i = t.return;
		try {
			if (Nc(e, i, t, n, J)) {
				od = 1, Oc(e, Yi(n, e.current)), q = null;
				return;
			}
		} catch (t) {
			if (i !== null) throw q = i, t;
			od = 1, Oc(e, Yi(n, e.current)), q = null;
			return;
		}
		t.flags & 32768 ? (P || r === 1 ? e = !0 : rd || J & 536870912 ? e = !1 : (nd = e = !0, (r === 2 || r === 9 || r === 3 || r === 6) && (r = Po.current, r !== null && r.tag === 13 && (r.flags |= 16384))), tf(t, e)) : ef(t);
	}
	function ef(e) {
		var t = e;
		do {
			if (t.flags & 32768) {
				tf(t, nd);
				return;
			}
			e = t.return;
			var n = bl(t.alternate, t, ad);
			if (n !== null) {
				q = n;
				return;
			}
			if (t = t.sibling, t !== null) {
				q = t;
				return;
			}
			q = t = e;
		} while (t !== null);
		od === 0 && (od = 5);
	}
	function tf(e, t) {
		do {
			var n = xl(e.alternate, e);
			if (n !== null) {
				n.flags &= 32767, q = n;
				return;
			}
			if (n = e.return, n !== null && (n.flags |= 32768, n.subtreeFlags = 0, n.deletions = null), !t && (e = e.sibling, e !== null)) {
				q = e;
				return;
			}
			q = e = n;
		} while (e !== null);
		od = 6, q = null;
	}
	function nf(e, t, n, r, a, o, s, c, l, u, d, f) {
		e.cancelPendingCommit = null;
		do
			df();
		while (X !== 0);
		if (G & 6) throw Error(i(327));
		if (t !== null) {
			if (t === e.current) throw Error(i(177));
			e === K && (q = K = null, J = 0), xd = t, bd = e, Sd = n, wd = a, Td = r, rf(e, t, n, s, c, l, f);
		}
	}
	function rf(e, t, n, r, i, a, o) {
		var s = t.lanes | t.childLanes;
		if (Cd = s, s |= Ai, xt(e, n, s, r, i, a), Dd = null, (n & 335544064) === n ? (Od = Ba(e), r = 10262) : (Od = null, r = 10256), (t.subtreeFlags & r) !== 0 || (t.flags & r) !== 0 ? (e.callbackNode = null, e.callbackPriority = 0, yf($e, function() {
			return ff(), null;
		})) : (e.callbackNode = null, e.callbackPriority = 0), Vl = !1, r = !!(t.flags & 13878), t.subtreeFlags & 13878 || r) {
			r = D.T, D.T = null, i = O.p, O.p = 2, a = G, G |= 4;
			try {
				hu(e, t, n);
			} finally {
				G = a, O.p = i, D.T = r;
			}
		}
		X = 1, Vl ? Ed = Mp(o, e.containerInfo, Od, sf, cf, of, lf, ff, af, null, null) : (sf(), cf(), lf());
	}
	function af(e) {
		if (X !== 0) {
			var t = bd.onRecoverableError;
			t(e, { componentStack: null });
		}
	}
	function of() {
		X === 3 && (X = 0, Fu(xd, bd), X = 4);
	}
	function sf() {
		if (X === 1) {
			X = 0;
			var e = bd, t = xd, n = Sd, r = !!(t.flags & 13878);
			if (t.subtreeFlags & 13878 || r) {
				r = D.T, D.T = null;
				var i = O.p;
				O.p = 2;
				var a = G;
				G |= 4;
				try {
					fu = pu = !1, ju(t, e, n), n = cp;
					var o = ti(e.containerInfo), s = n.focusedElem, c = n.selectionRange;
					if (o !== s && s && s.ownerDocument && ei(s.ownerDocument.documentElement, s)) {
						if (c !== null && ni(s)) {
							var l = c.start, u = c.end;
							if (u === void 0 && (u = l), "selectionStart" in s) s.selectionStart = l, s.selectionEnd = Math.min(u, s.value.length);
							else {
								var d = s.ownerDocument || document, f = d && d.defaultView || window;
								if (f.getSelection) {
									var p = f.getSelection(), m = s.textContent.length, h = Math.min(c.start, m), g = c.end === void 0 ? h : Math.min(c.end, m);
									!p.extend && h > g && (o = g, g = h, h = o);
									var _ = $r(s, h), v = $r(s, g);
									if (_ && v && (p.rangeCount !== 1 || p.anchorNode !== _.node || p.anchorOffset !== _.offset || p.focusNode !== v.node || p.focusOffset !== v.offset)) {
										var y = d.createRange();
										y.setStart(_.node, _.offset), p.removeAllRanges(), h > g ? (p.addRange(y), p.extend(v.node, v.offset)) : (y.setEnd(v.node, v.offset), p.addRange(y));
									}
								}
							}
						}
						for (d = [], p = s; p = p.parentNode;) p.nodeType === 1 && d.push({
							element: p,
							left: p.scrollLeft,
							top: p.scrollTop
						});
						for (typeof s.focus == "function" && s.focus(), s = 0; s < d.length; s++) {
							var b = d[s];
							b.element.scrollLeft = b.left, b.element.scrollTop = b.top;
						}
					}
					gh = !!sp, cp = sp = null;
				} finally {
					G = a, O.p = i, D.T = r;
				}
			}
			e.current = t, X = 2;
		}
	}
	function cf() {
		if (X === 2) {
			X = 0;
			var e = bd, t = xd, n = !!(t.flags & 8772);
			if (t.subtreeFlags & 8772 || n) {
				n = D.T, D.T = null;
				var r = O.p;
				O.p = 2;
				var i = G;
				G |= 4;
				try {
					_u(e, t.alternate, t);
				} finally {
					G = i, O.p = r, D.T = n;
				}
			}
			X = 3;
		}
	}
	function lf() {
		if (X === 4 || X === 3) {
			X = 0;
			var e = Ed;
			Ed = null, Je();
			var t = bd, n = xd, r = Sd, i = Td, a = (r & 335544064) === r ? 10262 : 10256;
			if ((n.subtreeFlags & a) !== 0 || (n.flags & a) !== 0 ? X = 5 : (X = 0, xd = bd = null, uf(t, t.pendingLanes)), a = t.pendingLanes, a === 0 && (yd = null), Et(r), n = n.stateNode, at && typeof at.onCommitFiberRoot == "function") try {
				at.onCommitFiberRoot(it, n, void 0, (n.current.flags & 128) == 128);
			} catch {}
			if (i !== null) {
				n = D.T, a = O.p, O.p = 2, D.T = null;
				try {
					for (var o = t.onRecoverableError, s = 0; s < i.length; s++) {
						var c = i[s];
						o(c.value, { componentStack: c.stack });
					}
				} finally {
					D.T = n, O.p = a;
				}
			}
			if (i = Dd, o = Od, Od = null, i !== null && (Dd = null, o === null && (o = []), e !== null)) for (c = 0; c < i.length; c++) n = (0, i[c])(o), n !== void 0 && e.finished.finally(n);
			Sd & 3 && df(), Ef(t), a = t.pendingLanes, r & 261930 && a & 42 ? t === Ad ? kd++ : (kd = 0, Ad = t) : (kd = 0, Ad = null), Df(0, !1);
		}
	}
	function uf(e, t) {
		(e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache, t != null && (e.pooledCache = null, La(t)));
	}
	function df() {
		return Ed !== null && (Ed.skipTransition(), Ed = null), sf(), cf(), lf(), ff();
	}
	function ff() {
		if (X !== 5) return !1;
		var e = bd, t = Cd;
		Cd = 0;
		var n = Et(Sd), r = D.T, a = O.p;
		try {
			O.p = 32 > n ? 32 : n, D.T = null, n = wd, wd = null;
			var o = bd, s = Sd;
			if (X = 0, xd = bd = null, Sd = 0, G & 6) throw Error(i(331));
			var c = G;
			if (G |= 4, Xu(o.current), Hu(o, o.current, s, n), G = c, Df(0, !1), at && typeof at.onPostCommitFiberRoot == "function") try {
				at.onPostCommitFiberRoot(it, o);
			} catch {}
			return !0;
		} finally {
			O.p = a, D.T = r, uf(e, t);
		}
	}
	function pf(e, t, n) {
		t = Yi(n, t), t = Ac(e.stateNode, t, 2), e = So(e, t, 2), e !== null && (bt(e, 2), Ef(e));
	}
	function Z(e, t, n) {
		if (e.tag === 3) pf(e, e, n);
		else for (; t !== null;) {
			if (t.tag === 3) {
				pf(t, e, n);
				break;
			}
			if (t.tag === 1) {
				var r = t.stateNode;
				if (typeof t.type.getDerivedStateFromError == "function" || typeof r.componentDidCatch == "function" && (yd === null || !yd.has(r))) {
					e = Yi(n, e), n = jc(2), r = So(t, n, 2), r !== null && (Mc(n, r, t, e), bt(r, 2), Ef(r));
					break;
				}
			}
			t = t.return;
		}
	}
	function mf(e, t, n) {
		var r = e.pingCache;
		if (r === null) {
			r = e.pingCache = new ed();
			var i = /* @__PURE__ */ new Set();
			r.set(t, i);
		} else i = r.get(t), i === void 0 && (i = /* @__PURE__ */ new Set(), r.set(t, i));
		i.has(n) || (id = !0, i.add(n), e = hf.bind(null, e, t, n), t.then(e, e));
	}
	function hf(e, t, n) {
		var r = e.pingCache;
		r !== null && r.delete(t), e.pingedLanes |= e.suspendedLanes & n, e.warmLanes &= ~n, K === e && (J & n) === n && (od === 4 || od === 3 && (J & 62914560) === J && 300 > Ye() - hd ? G & 2 ? ld |= n : Vd(e, 0) : ld |= n, dd === J && (dd = 0)), Ef(e);
	}
	function gf(e, t) {
		t === 0 && (t = vt()), e = Pi(e, t), e !== null && (bt(e, t), Ef(e));
	}
	function _f(e) {
		var t = e.memoizedState, n = 0;
		t !== null && (n = t.retryLane), gf(e, n);
	}
	function vf(e, t) {
		var n = 0;
		switch (e.tag) {
			case 31:
			case 13:
				var r = e.stateNode, a = e.memoizedState;
				a !== null && (n = a.retryLane);
				break;
			case 19:
				r = e.stateNode;
				break;
			case 22:
				r = e.stateNode._retryCache;
				break;
			default: throw Error(i(314));
		}
		r !== null && r.delete(t), gf(e, n);
	}
	function yf(e, t) {
		return Ge(e, t);
	}
	var bf = null, xf = null, Sf = !1, Cf = !1, wf = !1, Tf = 0;
	function Ef(e) {
		e !== xf && e.next === null && (xf === null ? bf = xf = e : xf = xf.next = e), Cf = !0, Sf || (Sf = !0, Nf());
	}
	function Df(e, t) {
		if (!wf && Cf) {
			wf = !0;
			do
				for (var n = !1, r = bf; r !== null;) {
					if (!t) {
						if (e !== 0) {
							var i = r.pendingLanes;
							if (i === 0) var a = 0;
							else {
								var o = r.suspendedLanes, s = r.pingedLanes;
								a = (1 << 31 - st(42 | e) + 1) - 1, a &= i & ~(o & ~s), a = a & 201326741 ? a & 201326741 | 1 : a ? a | 2 : 0;
							}
							a !== 0 && (n = !0, Mf(r, a));
						} else a = J, a = A(r, r === K ? a : 0, r.cancelPendingCommit !== null || r.timeoutHandle !== -1), !(a & 3) || ht(r, a) || (n = !0, Mf(r, a));
					}
					r = r.next;
				}
			while (n);
			wf = !1;
		}
	}
	function Of() {
		kf();
	}
	function kf() {
		Cf = Sf = !1;
		var e = 0;
		Tf !== 0 && hp() && (e = Tf);
		for (var t = Ye(), n = null, r = bf; r !== null;) {
			var i = r.next, a = Af(r, t);
			a === 0 ? (r.next = null, n === null ? bf = i : n.next = i, i === null && (xf = n)) : (n = r, (e !== 0 || a & 3) && (Cf = !0)), r = i;
		}
		X !== 0 && X !== 5 || Df(e, !1), Tf !== 0 && (Tf = 0);
	}
	function Af(e, t) {
		for (var n = e.suspendedLanes, r = e.pingedLanes, i = e.expirationTimes, a = e.pendingLanes & -62914561; 0 < a;) {
			var o = 31 - st(a), s = 1 << o, c = i[o];
			c === -1 ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = _t(s, t)) : c <= t && (e.expiredLanes |= s), a &= ~s;
		}
		if (t = K, n = J, n = A(e, e === t ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r = e.callbackNode, n === 0 || e === t && (Y === 2 || Y === 9) || e.cancelPendingCommit !== null) return r !== null && r !== null && Ke(r), e.callbackNode = null, e.callbackPriority = 0;
		if (!(n & 3) || ht(e, n)) {
			if (t = n & -n, t === e.callbackPriority) return t;
			switch (r !== null && Ke(r), Et(n)) {
				case 2:
				case 8:
					n = Qe;
					break;
				case 32:
					n = $e;
					break;
				case 268435456:
					n = tt;
					break;
				default: n = $e;
			}
			return r = jf.bind(null, e), n = Ge(n, r), e.callbackPriority = t, e.callbackNode = n, t;
		}
		return r !== null && r !== null && Ke(r), e.callbackPriority = 2, e.callbackNode = null, 2;
	}
	function jf(e, t) {
		if (X !== 0 && X !== 5) return e.callbackNode = null, e.callbackPriority = 0, null;
		var n = e.callbackNode;
		if (df() && e.callbackNode !== n) return null;
		var r = J;
		return r = A(e, e === K ? r : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r === 0 ? null : (Fd(e, r, t), Af(e, Ye()), e.callbackNode != null && e.callbackNode === n ? jf.bind(null, e) : null);
	}
	function Mf(e, t) {
		if (df()) return null;
		Fd(e, t, !0);
	}
	function Nf() {
		bp(function() {
			G & 6 ? Ge(Ze, Of) : kf();
		});
	}
	function Pf() {
		if (Tf === 0) {
			var e = Ua;
			e === 0 && (e = dt, dt <<= 1, !(dt & 261888) && (dt = 256)), Tf = e;
		}
		return Tf;
	}
	function Ff(e) {
		return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : Tn(e);
	}
	function If(e, t, n, r, i) {
		if (t === "submit" && n && n.stateNode === i) {
			var a = Ff((i[jt] || null).action), o = r.submitter;
			o && (t = (t = o[jt] || null) ? Ff(t.formAction) : o.getAttribute("formAction"), t !== null && (a = t, o = null));
			var s = new qn("action", "action", null, r, i);
			e.push({
				event: s,
				listeners: [{
					instance: null,
					listener: function() {
						if (r.defaultPrevented) {
							if (Tf !== 0) {
								var e = new FormData(i, o);
								nc(n, {
									pending: !0,
									data: e,
									method: i.method,
									action: a
								}, null, e);
							}
						} else typeof a == "function" && (s.preventDefault(), e = new FormData(i, o), nc(n, {
							pending: !0,
							data: e,
							method: i.method,
							action: a
						}, a, e));
					},
					currentTarget: i
				}]
			});
		}
	}
	for (var Lf = 0; Lf < xi.length; Lf++) {
		var Rf = xi[Lf];
		Si(Rf.toLowerCase(), "on" + (Rf[0].toUpperCase() + Rf.slice(1)));
	}
	Si(pi, "onAnimationEnd"), Si(mi, "onAnimationIteration"), Si(hi, "onAnimationStart"), Si("dblclick", "onDoubleClick"), Si("focusin", "onFocus"), Si("focusout", "onBlur"), Si(gi, "onTransitionRun"), Si(_i, "onTransitionStart"), Si(vi, "onTransitionCancel"), Si(yi, "onTransitionEnd"), Yt("onMouseEnter", ["mouseout", "mouseover"]), Yt("onMouseLeave", ["mouseout", "mouseover"]), Yt("onPointerEnter", ["pointerout", "pointerover"]), Yt("onPointerLeave", ["pointerout", "pointerover"]), Jt("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), Jt("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), Jt("onBeforeInput", [
		"compositionend",
		"keypress",
		"textInput",
		"paste"
	]), Jt("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), Jt("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), Jt("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
	var zf = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), Bf = new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(zf));
	function Vf(e, t) {
		t = !!(t & 4);
		for (var n = 0; n < e.length; n++) {
			var r = e[n], i = r.event;
			r = r.listeners;
			a: {
				var a = void 0;
				if (t) for (var o = r.length - 1; 0 <= o; o--) {
					var s = r[o], c = s.instance, l = s.currentTarget;
					if (s = s.listener, c !== a && i.isPropagationStopped()) break a;
					a = s, i.currentTarget = l;
					try {
						a(i);
					} catch (e) {
						Di(e);
					}
					i.currentTarget = null, a = c;
				}
				else for (o = 0; o < r.length; o++) {
					if (s = r[o], c = s.instance, l = s.currentTarget, s = s.listener, c !== a && i.isPropagationStopped()) break a;
					a = s, i.currentTarget = l;
					try {
						a(i);
					} catch (e) {
						Di(e);
					}
					i.currentTarget = null, a = c;
				}
			}
		}
	}
	function Q(e, t) {
		var n = t[Nt];
		n === void 0 && (n = t[Nt] = /* @__PURE__ */ new Set());
		var r = e + "__bubble";
		n.has(r) || (Gf(t, e, 2, !1), n.add(r));
	}
	function Hf(e, t, n) {
		var r = 0;
		t && (r |= 4), Gf(n, e, r, t);
	}
	var Uf = "_reactListening" + Math.random().toString(36).slice(2);
	function Wf(e) {
		if (!e[Uf]) {
			e[Uf] = !0, Kt.forEach(function(t) {
				t !== "selectionchange" && (Bf.has(t) || Hf(t, !1, e), Hf(t, !0, e));
			});
			var t = e.nodeType === 9 ? e : e.ownerDocument;
			t === null || t[Uf] || (t[Uf] = !0, Hf("selectionchange", !1, t));
		}
	}
	function Gf(e, t, n, r) {
		switch (Ch(t)) {
			case 2:
				var i = _h;
				break;
			case 8:
				i = vh;
				break;
			default: i = yh;
		}
		n = i.bind(null, t, n, e), i = void 0, !In || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (i = !0), r ? i === void 0 ? e.addEventListener(t, n, !0) : e.addEventListener(t, n, {
			capture: !0,
			passive: i
		}) : i === void 0 ? e.addEventListener(t, n, !1) : e.addEventListener(t, n, { passive: i });
	}
	function Kf(e, t, n, r, i) {
		var a = r;
		if (!(t & 1) && !(t & 2) && r !== null) a: for (;;) {
			if (r === null) return;
			var s = r.tag;
			if (s === 3 || s === 4) {
				var c = r.stateNode.containerInfo;
				if (c === i) break;
				if (s === 4) for (s = r.return; s !== null;) {
					var l = s.tag;
					if ((l === 3 || l === 4) && s.stateNode.containerInfo === i) return;
					s = s.return;
				}
				for (; c !== null;) {
					if (s = Bt(c), s === null) return;
					if (l = s.tag, l === 5 || l === 6 || l === 26 || l === 27) {
						r = a = s;
						continue a;
					}
					c = c.parentNode;
				}
			}
			r = r.return;
		}
		Nn(function() {
			var r = a, i = On(n), s = [];
			a: {
				var c = bi.get(e);
				if (c !== void 0) {
					var l = qn, u = e;
					switch (e) {
						case "keypress": if (Hn(n) === 0) break a;
						case "keydown":
						case "keyup":
							l = dr;
							break;
						case "focusin":
							u = "focus", l = nr;
							break;
						case "focusout":
							u = "blur", l = nr;
							break;
						case "beforeblur":
						case "afterblur":
							l = nr;
							break;
						case "click": if (n.button === 2) break a;
						case "auxclick":
						case "dblclick":
						case "mousedown":
						case "mousemove":
						case "mouseup":
						case "mouseout":
						case "mouseover":
						case "contextmenu":
							l = er;
							break;
						case "drag":
						case "dragend":
						case "dragenter":
						case "dragexit":
						case "dragleave":
						case "dragover":
						case "dragstart":
						case "drop":
							l = tr;
							break;
						case "touchcancel":
						case "touchend":
						case "touchmove":
						case "touchstart":
							l = mr;
							break;
						case pi:
						case mi:
						case hi:
							l = rr;
							break;
						case yi:
							l = hr;
							break;
						case "scroll":
						case "scrollend":
							l = Yn;
							break;
						case "wheel":
							l = gr;
							break;
						case "copy":
						case "cut":
						case "paste":
							l = ir;
							break;
						case "gotpointercapture":
						case "lostpointercapture":
						case "pointercancel":
						case "pointerdown":
						case "pointermove":
						case "pointerout":
						case "pointerover":
						case "pointerup":
							l = fr;
							break;
						case "submit":
							l = pr;
							break;
						case "toggle":
						case "beforetoggle": l = _r;
					}
					var d = !!(t & 4), f = !d && (e === "scroll" || e === "scrollend"), p = d ? c === null ? null : c + "Capture" : c;
					d = [];
					for (var m = r, h; m !== null;) {
						var g = m;
						if (h = g.stateNode, g = g.tag, g !== 5 && g !== 26 && g !== 27 || h === null || p === null || (g = Pn(m, p), g != null && d.push(qf(m, g, h))), f) break;
						m = m.return;
					}
					0 < d.length && (c = new l(c, u, null, n, i), s.push({
						event: c,
						listeners: d
					}));
				}
			}
			if (!(t & 7)) {
				a: {
					if (l = e === "mouseover" || e === "pointerover", c = e === "mouseout" || e === "pointerout", l && n !== Dn && (u = n.relatedTarget || n.fromElement) && (Bt(u) || u[Mt])) break a;
					(c || l) && (u = i.window === i ? i : (l = i.ownerDocument) ? l.defaultView || l.parentWindow : window, c ? (l = n.relatedTarget || n.toElement, c = r, l = l ? Bt(l) : null, l !== null && (f = o(l), d = l.tag, l !== f || d !== 5 && d !== 27 && d !== 6) && (l = null)) : (c = null, l = r), c !== l && (d = er, g = "onMouseLeave", p = "onMouseEnter", m = "mouse", (e === "pointerout" || e === "pointerover") && (d = fr, g = "onPointerLeave", p = "onPointerEnter", m = "pointer"), f = c == null ? u : Ht(c), h = l == null ? u : Ht(l), u = new d(g, m + "leave", c, n, i), u.target = f, u.relatedTarget = h, g = null, Bt(i) === r && (d = new d(p, m + "enter", l, n, i), d.target = h, d.relatedTarget = f, g = d), f = g, d = c && l ? re(c, l, Yf) : null, c !== null && Xf(s, u, c, d, !1), l !== null && f !== null && Xf(s, f, l, d, !0)));
				}
				a: {
					if (c = r ? Ht(r) : window, l = c.nodeName && c.nodeName.toLowerCase(), l === "select" || l === "input" && c.type === "file") var _ = Lr;
					else if (jr(c)) {
						if (Rr) _ = qr;
						else {
							_ = Gr;
							var v = Wr;
						}
					} else l = c.nodeName, !l || l.toLowerCase() !== "input" || c.type !== "checkbox" && c.type !== "radio" ? r && Sn(r.elementType) && (_ = Lr) : _ = Kr;
					if (_ &&= _(e, r)) {
						Mr(s, _, n, i);
						break a;
					}
					v && v(e, c, r);
				}
				switch (v = r ? Ht(r) : window, e) {
					case "focusin":
						(jr(v) || v.contentEditable === "true") && (ri = v, ii = r, ai = null);
						break;
					case "focusout":
						ai = ii = ri = null;
						break;
					case "mousedown":
						oi = !0;
						break;
					case "contextmenu":
					case "mouseup":
					case "dragend":
						oi = !1, si(s, n, i);
						break;
					case "selectionchange": if (M) break;
					case "keydown":
					case "keyup": si(s, n, i);
				}
				var y;
				if (yr) b: {
					switch (e) {
						case "compositionstart":
							var b = "onCompositionStart";
							break b;
						case "compositionend":
							b = "onCompositionEnd";
							break b;
						case "compositionupdate":
							b = "onCompositionUpdate";
							break b;
					}
					b = void 0;
				}
				else Dr ? Tr(e, n) && (b = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (b = "onCompositionStart");
				b && (Sr && n.locale !== "ko" && (Dr || b !== "onCompositionStart" ? b === "onCompositionEnd" && Dr && (y = Vn()) : (Rn = i, zn = "value" in Rn ? Rn.value : Rn.textContent, Dr = !0)), v = Jf(r, b), 0 < v.length && (b = new ar(b, e, null, n, i), s.push({
					event: b,
					listeners: v
				}), y ? b.data = y : (y = Er(n), y !== null && (b.data = y)))), (y = xr ? Or(e, n) : kr(e, n)) && (b = Jf(r, "onBeforeInput"), 0 < b.length && (v = new ar("onBeforeInput", "beforeinput", null, n, i), s.push({
					event: v,
					listeners: b
				}), v.data = y)), If(s, e, r, n, i);
			}
			Vf(s, t);
		});
	}
	function qf(e, t, n) {
		return {
			instance: e,
			listener: t,
			currentTarget: n
		};
	}
	function Jf(e, t) {
		for (var n = t + "Capture", r = []; e !== null;) {
			var i = e, a = i.stateNode;
			if (i = i.tag, i !== 5 && i !== 26 && i !== 27 || a === null || (i = Pn(e, n), i != null && r.unshift(qf(e, i, a)), i = Pn(e, t), i != null && r.push(qf(e, i, a))), e.tag === 3) return r;
			e = e.return;
		}
		return [];
	}
	function Yf(e) {
		if (e === null) return null;
		do
			e = e.return;
		while (e && e.tag !== 5 && e.tag !== 27);
		return e || null;
	}
	function Xf(e, t, n, r, i) {
		for (var a = t._reactName, o = []; n !== null && n !== r;) {
			var s = n, c = s.alternate, l = s.stateNode;
			if (s = s.tag, c !== null && c === r) break;
			s !== 5 && s !== 26 && s !== 27 || l === null || (c = l, i ? (l = Pn(n, a), l != null && o.unshift(qf(n, l, c))) : i || (l = Pn(n, a), l != null && o.push(qf(n, l, c)))), n = n.return;
		}
		o.length !== 0 && e.push({
			event: t,
			listeners: o
		});
	}
	var Zf = /\r\n?/g, Qf = /\u0000|\uFFFD/g;
	function $f(e) {
		return (typeof e == "string" ? e : "" + e).replace(Zf, "\n").replace(Qf, "");
	}
	function ep(e, t) {
		return t = $f(t), $f(e) === t;
	}
	function $(e, t, n, r, a, o) {
		switch (n) {
			case "children":
				if (typeof r == "string") t === "body" || t === "textarea" && r === "" || vn(e, r);
				else if (typeof r == "number" || typeof r == "bigint") t !== "body" && vn(e, "" + r);
				else return;
				break;
			case "className":
				nn(e, "class", r);
				break;
			case "tabIndex":
				nn(e, "tabindex", r);
				break;
			case "dir":
			case "role":
			case "viewBox":
			case "width":
			case "height":
				nn(e, n, r);
				break;
			case "style":
				xn(e, r, o);
				return;
			case "data": if (t !== "object") {
				nn(e, "data", r);
				break;
			}
			case "src":
			case "href":
				if (r === "" && (t !== "a" || n !== "href") || r == null || typeof r == "function" || typeof r == "symbol" || typeof r == "boolean") {
					e.removeAttribute(n);
					break;
				}
				r = Tn(r), e.setAttribute(n, r);
				break;
			case "action":
			case "formAction":
				if (typeof r == "function") {
					e.setAttribute(n, "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");
					break;
				}
				if (typeof o == "function" && (n === "formAction" ? (t !== "input" && $(e, t, "name", a.name, a, null), $(e, t, "formEncType", a.formEncType, a, null), $(e, t, "formMethod", a.formMethod, a, null), $(e, t, "formTarget", a.formTarget, a, null)) : ($(e, t, "encType", a.encType, a, null), $(e, t, "method", a.method, a, null), $(e, t, "target", a.target, a, null))), r == null || typeof r == "symbol" || typeof r == "boolean") {
					e.removeAttribute(n);
					break;
				}
				r = Tn(r), e.setAttribute(n, r);
				break;
			case "onClick":
				r != null && (e.onclick = En);
				return;
			case "onScroll":
				r != null && Q("scroll", e);
				return;
			case "onScrollEnd":
				r != null && Q("scrollend", e);
				return;
			case "dangerouslySetInnerHTML":
				if (r != null) {
					if (typeof r != "object" || !("__html" in r)) throw Error(i(61));
					if (n = r.__html, n != null) {
						if (a.children != null) throw Error(i(60));
						o?.__html !== n && (e.innerHTML = n);
					}
				}
				break;
			case "multiple":
				e.multiple = r && typeof r != "function" && typeof r != "symbol";
				break;
			case "muted":
				e.muted = r && typeof r != "function" && typeof r != "symbol";
				break;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "defaultValue":
			case "defaultChecked":
			case "innerHTML":
			case "ref": break;
			case "autoFocus": break;
			case "xlinkHref":
				if (r == null || typeof r == "function" || typeof r == "boolean" || typeof r == "symbol") {
					e.removeAttribute("xlink:href");
					break;
				}
				n = Tn(r), e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", n);
				break;
			case "contentEditable":
			case "spellCheck":
			case "draggable":
			case "value":
			case "autoReverse":
			case "externalResourcesRequired":
			case "focusable":
			case "preserveAlpha":
				r != null && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, r) : e.removeAttribute(n);
				break;
			case "inert":
			case "allowFullScreen":
			case "async":
			case "autoPlay":
			case "controls":
			case "credentialless":
			case "default":
			case "defer":
			case "disabled":
			case "disablePictureInPicture":
			case "disableRemotePlayback":
			case "formNoValidate":
			case "hidden":
			case "loop":
			case "noModule":
			case "noValidate":
			case "open":
			case "playsInline":
			case "readOnly":
			case "required":
			case "reversed":
			case "scoped":
			case "seamless":
			case "itemScope":
				r && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, "") : e.removeAttribute(n);
				break;
			case "capture":
			case "download":
				!0 === r ? e.setAttribute(n, "") : !1 !== r && r != null && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, r) : e.removeAttribute(n);
				break;
			case "cols":
			case "rows":
			case "size":
			case "span":
				r != null && typeof r != "function" && typeof r != "symbol" && !isNaN(r) && 1 <= r ? e.setAttribute(n, r) : e.removeAttribute(n);
				break;
			case "rowSpan":
			case "start":
				r == null || typeof r == "function" || typeof r == "symbol" || isNaN(r) ? e.removeAttribute(n) : e.setAttribute(n, r);
				break;
			case "popover":
				Q("beforetoggle", e), Q("toggle", e), tn(e, "popover", r);
				break;
			case "xlinkActuate":
				rn(e, "http://www.w3.org/1999/xlink", "xlink:actuate", r);
				break;
			case "xlinkArcrole":
				rn(e, "http://www.w3.org/1999/xlink", "xlink:arcrole", r);
				break;
			case "xlinkRole":
				rn(e, "http://www.w3.org/1999/xlink", "xlink:role", r);
				break;
			case "xlinkShow":
				rn(e, "http://www.w3.org/1999/xlink", "xlink:show", r);
				break;
			case "xlinkTitle":
				rn(e, "http://www.w3.org/1999/xlink", "xlink:title", r);
				break;
			case "xlinkType":
				rn(e, "http://www.w3.org/1999/xlink", "xlink:type", r);
				break;
			case "xmlBase":
				rn(e, "http://www.w3.org/XML/1998/namespace", "xml:base", r);
				break;
			case "xmlLang":
				rn(e, "http://www.w3.org/XML/1998/namespace", "xml:lang", r);
				break;
			case "xmlSpace":
				rn(e, "http://www.w3.org/XML/1998/namespace", "xml:space", r);
				break;
			case "is":
				tn(e, "is", r);
				break;
			case "innerText":
			case "textContent": return;
			default: if (!(2 < n.length) || n[0] !== "o" && n[0] !== "O" || n[1] !== "n" && n[1] !== "N") n = Cn.get(n) || n, tn(e, n, r);
			else return;
		}
		j = !0;
	}
	function tp(e, t, n, r, a, o) {
		switch (n) {
			case "style":
				xn(e, r, o);
				return;
			case "dangerouslySetInnerHTML":
				if (r != null) {
					if (typeof r != "object" || !("__html" in r)) throw Error(i(61));
					if (n = r.__html, n != null) {
						if (a.children != null) throw Error(i(60));
						o?.__html !== n && (e.innerHTML = n);
					}
				}
				break;
			case "children":
				if (typeof r == "string") vn(e, r);
				else if (typeof r == "number" || typeof r == "bigint") vn(e, "" + r);
				else return;
				break;
			case "onScroll":
				r != null && Q("scroll", e);
				return;
			case "onScrollEnd":
				r != null && Q("scrollend", e);
				return;
			case "onClick":
				r != null && (e.onclick = En);
				return;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "innerHTML":
			case "ref": return;
			case "innerText":
			case "textContent": return;
			default:
				if (!qt.hasOwnProperty(n)) a: {
					if (n[0] === "o" && n[1] === "n" && (a = n.endsWith("Capture"), o = n.slice(2, a ? n.length - 7 : void 0), t = e[jt] || null, t = t == null ? null : t[n], typeof t == "function" && e.removeEventListener(o, t, a), typeof r == "function")) {
						typeof t != "function" && t !== null && (n in e ? e[n] = null : e.hasAttribute(n) && e.removeAttribute(n)), e.addEventListener(o, r, a);
						break a;
					}
					j = !0, n in e ? e[n] = r : !0 === r ? e.setAttribute(n, "") : tn(e, n, r);
				}
				return;
		}
		j = !0;
	}
	function np(e, t, n) {
		switch (t) {
			case "div":
			case "span":
			case "svg":
			case "path":
			case "a":
			case "g":
			case "p":
			case "li": break;
			case "img":
				Q("error", e), Q("load", e);
				var r = !1, a = !1, o;
				for (o in n) if (n.hasOwnProperty(o)) {
					var s = n[o];
					if (s != null) switch (o) {
						case "src":
							r = !0;
							break;
						case "srcSet":
							a = !0;
							break;
						case "children":
						case "dangerouslySetInnerHTML": throw Error(i(137, t));
						default: $(e, t, o, s, n, null);
					}
				}
				a && $(e, t, "srcSet", n.srcSet, n, null), r && $(e, t, "src", n.src, n, null);
				return;
			case "input":
				Q("invalid", e);
				var c = o = s = a = null, l = null, u = null;
				for (r in n) if (n.hasOwnProperty(r)) {
					var d = n[r];
					if (d != null) switch (r) {
						case "name":
							a = d;
							break;
						case "type":
							s = d;
							break;
						case "checked":
							l = d;
							break;
						case "defaultChecked":
							u = d;
							break;
						case "value":
							o = d;
							break;
						case "defaultValue":
							c = d;
							break;
						case "children":
						case "dangerouslySetInnerHTML":
							if (d != null) throw Error(i(137, t));
							break;
						default: $(e, t, r, d, n, null);
					}
				}
				pn(e, o, c, l, u, s, a, !1);
				return;
			case "select":
				for (a in Q("invalid", e), r = s = o = null, n) if (n.hasOwnProperty(a) && (c = n[a], c != null)) switch (a) {
					case "value":
						o = c;
						break;
					case "defaultValue":
						s = c;
						break;
					case "multiple": r = c;
					default: $(e, t, a, c, n, null);
				}
				t = o, n = s, e.multiple = !!r, t == null ? n != null && hn(e, !!r, n, !0) : hn(e, !!r, t, !1);
				return;
			case "textarea":
				for (s in Q("invalid", e), o = a = r = null, n) if (n.hasOwnProperty(s) && (c = n[s], c != null)) switch (s) {
					case "value":
						r = c;
						break;
					case "defaultValue":
						a = c;
						break;
					case "children":
						o = c;
						break;
					case "dangerouslySetInnerHTML":
						if (c != null) throw Error(i(91));
						break;
					default: $(e, t, s, c, n, null);
				}
				_n(e, r, a, o);
				return;
			case "option":
				for (l in n) if (n.hasOwnProperty(l) && (r = n[l], r != null)) switch (l) {
					case "selected":
						e.selected = r && typeof r != "function" && typeof r != "symbol";
						break;
					default: $(e, t, l, r, n, null);
				}
				return;
			case "dialog":
				Q("beforetoggle", e), Q("toggle", e), Q("cancel", e), Q("close", e);
				break;
			case "iframe":
			case "object":
				Q("load", e);
				break;
			case "video":
			case "audio":
				for (r = 0; r < zf.length; r++) Q(zf[r], e);
				break;
			case "image":
				Q("error", e), Q("load", e);
				break;
			case "details":
				Q("toggle", e);
				break;
			case "embed":
			case "source":
			case "link": Q("error", e), Q("load", e);
			case "area":
			case "base":
			case "br":
			case "col":
			case "hr":
			case "keygen":
			case "meta":
			case "param":
			case "track":
			case "wbr":
			case "menuitem":
				for (u in n) if (n.hasOwnProperty(u) && (r = n[u], r != null)) switch (u) {
					case "children":
					case "dangerouslySetInnerHTML": throw Error(i(137, t));
					default: $(e, t, u, r, n, null);
				}
				return;
			default: if (Sn(t)) {
				for (d in n) n.hasOwnProperty(d) && (r = n[d], r !== void 0 && tp(e, t, d, r, n, void 0));
				return;
			}
		}
		for (c in n) n.hasOwnProperty(c) && (r = n[c], r != null && $(e, t, c, r, n, null));
	}
	var rp = {};
	function ip(e, t, n, r) {
		switch (t) {
			case "div":
			case "span":
			case "svg":
			case "path":
			case "a":
			case "g":
			case "p":
			case "li": break;
			case "input":
				var a = null, o = null, s = null, c = null, l = null, u = null, d = null;
				for (m in n) {
					var f = n[m];
					if (n.hasOwnProperty(m) && f != null) switch (m) {
						case "checked": break;
						case "value": break;
						case "defaultValue": l = f;
						default: r.hasOwnProperty(m) || $(e, t, m, null, r, f);
					}
				}
				for (var p in r) {
					var m = r[p];
					if (f = n[p], r.hasOwnProperty(p) && (m != null || f != null)) switch (p) {
						case "type":
							m !== f && (j = !0), o = m;
							break;
						case "name":
							m !== f && (j = !0), a = m;
							break;
						case "checked":
							m !== f && (j = !0), u = m;
							break;
						case "defaultChecked":
							m !== f && (j = !0), d = m;
							break;
						case "value":
							m !== f && (j = !0), s = m;
							break;
						case "defaultValue":
							m !== f && (j = !0), c = m;
							break;
						case "children":
						case "dangerouslySetInnerHTML":
							if (m != null) throw Error(i(137, t));
							break;
						default: m !== f && $(e, t, p, m, r, f);
					}
				}
				fn(e, s, c, l, u, d, o, a);
				return;
			case "select":
				for (o in m = s = c = p = null, n) if (l = n[o], n.hasOwnProperty(o) && l != null) switch (o) {
					case "value": break;
					case "multiple": m = l;
					default: r.hasOwnProperty(o) || $(e, t, o, null, r, l);
				}
				for (a in r) if (o = r[a], l = n[a], r.hasOwnProperty(a) && (o != null || l != null)) switch (a) {
					case "value":
						o !== l && (j = !0), p = o;
						break;
					case "defaultValue":
						o !== l && (j = !0), c = o;
						break;
					case "multiple": o !== l && (j = !0), s = o;
					default: o !== l && $(e, t, a, o, r, l);
				}
				t = c, n = s, r = m, p == null ? !!r != !!n && (t == null ? hn(e, !!n, n ? [] : "", !1) : hn(e, !!n, t, !0)) : hn(e, !!n, p, !1);
				return;
			case "textarea":
				for (c in m = p = null, n) if (a = n[c], n.hasOwnProperty(c) && a != null && !r.hasOwnProperty(c)) switch (c) {
					case "value": break;
					case "children": break;
					default: $(e, t, c, null, r, a);
				}
				for (s in r) if (a = r[s], o = n[s], r.hasOwnProperty(s) && (a != null || o != null)) switch (s) {
					case "value":
						a !== o && (j = !0), p = a;
						break;
					case "defaultValue":
						a !== o && (j = !0), m = a;
						break;
					case "children": break;
					case "dangerouslySetInnerHTML":
						if (a != null) throw Error(i(91));
						break;
					default: a !== o && $(e, t, s, a, r, o);
				}
				gn(e, p, m);
				return;
			case "option":
				for (var h in n) if (p = n[h], n.hasOwnProperty(h) && p != null && !r.hasOwnProperty(h)) switch (h) {
					case "selected":
						e.selected = !1;
						break;
					default: $(e, t, h, null, r, p);
				}
				for (l in r) if (p = r[l], m = n[l], r.hasOwnProperty(l) && p !== m && (p != null || m != null)) switch (l) {
					case "selected":
						p !== m && (j = !0), e.selected = p && typeof p != "function" && typeof p != "symbol";
						break;
					default: $(e, t, l, p, r, m);
				}
				return;
			case "img":
			case "link":
			case "area":
			case "base":
			case "br":
			case "col":
			case "embed":
			case "hr":
			case "keygen":
			case "meta":
			case "param":
			case "source":
			case "track":
			case "wbr":
			case "menuitem":
				for (var g in n) p = n[g], n.hasOwnProperty(g) && p != null && !r.hasOwnProperty(g) && $(e, t, g, null, r, p);
				for (u in r) if (p = r[u], m = n[u], r.hasOwnProperty(u) && p !== m && (p != null || m != null)) switch (u) {
					case "children":
					case "dangerouslySetInnerHTML":
						if (p != null) throw Error(i(137, t));
						break;
					default: $(e, t, u, p, r, m);
				}
				return;
			default: if (Sn(t)) {
				for (var _ in n) p = n[_], n.hasOwnProperty(_) && p !== void 0 && !r.hasOwnProperty(_) && tp(e, t, _, void 0, r, p);
				for (d in r) p = r[d], m = n[d], !r.hasOwnProperty(d) || p === m || p === void 0 && m === void 0 || tp(e, t, d, p, r, m);
				return;
			}
		}
		for (var v in n) p = n[v], n.hasOwnProperty(v) && p != null && !r.hasOwnProperty(v) && $(e, t, v, null, r, p);
		for (f in r) p = r[f], m = n[f], !r.hasOwnProperty(f) || p === m || p == null && m == null || $(e, t, f, p, r, m);
	}
	function ap(e) {
		switch (e) {
			case "css":
			case "script":
			case "font":
			case "img":
			case "image":
			case "input":
			case "link": return !0;
			default: return !1;
		}
	}
	function op() {
		if (typeof performance.getEntriesByType == "function") {
			for (var e = 0, t = 0, n = performance.getEntriesByType("resource"), r = 0; r < n.length; r++) {
				var i = n[r], a = i.transferSize, o = i.initiatorType, s = i.duration;
				if (a && s && ap(o)) {
					for (o = 0, s = i.responseEnd, r += 1; r < n.length; r++) {
						var c = n[r], l = c.startTime;
						if (l > s) break;
						var u = c.transferSize, d = c.initiatorType;
						u && ap(d) && (c = c.responseEnd, o += u * (c < s ? 1 : (s - l) / (c - l)));
					}
					if (--r, t += 8 * (a + o) / (i.duration / 1e3), e++, 10 < e) break;
				}
			}
			if (0 < e) return t / e / 1e6;
		}
		return navigator.connection && (e = navigator.connection.downlink, typeof e == "number") ? e : 5;
	}
	var sp = null, cp = null;
	function lp(e) {
		return e.nodeType === 9 ? e : e.ownerDocument;
	}
	function up(e) {
		switch (e) {
			case "http://www.w3.org/2000/svg": return 1;
			case "http://www.w3.org/1998/Math/MathML": return 2;
			default: return 0;
		}
	}
	function dp(e, t) {
		if (e === 0) switch (t) {
			case "svg": return 1;
			case "math": return 2;
			default: return 0;
		}
		return e === 1 && t === "foreignObject" ? 0 : e;
	}
	function fp(e, t, n, r) {
		return n = lp(n).createElement(e), n[At] = r, n[jt] = t, np(n, e, t), Wt(n), n;
	}
	function pp(e, t) {
		return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.children == "bigint" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
	}
	var mp = null;
	function hp() {
		var e = window.event;
		return e && e.type === "popstate" ? e !== mp && (mp = e, !0) : (mp = null, !1);
	}
	var gp = typeof setTimeout == "function" ? setTimeout : void 0, _p = typeof clearTimeout == "function" ? clearTimeout : void 0, vp = typeof Promise == "function" ? Promise : void 0, yp = typeof requestAnimationFrame == "function" ? requestAnimationFrame : gp, bp = typeof queueMicrotask == "function" ? queueMicrotask : vp === void 0 ? gp : function(e) {
		return vp.resolve(null).then(e).catch(xp);
	};
	function xp(e) {
		setTimeout(function() {
			throw e;
		});
	}
	function Sp(e) {
		return e === "head";
	}
	function Cp(e, t) {
		var n = t, r = 0;
		do {
			var i = n.nextSibling;
			if (e.removeChild(n), i && i.nodeType === 8) {
				if (n = i.data, n === "/$" || n === "/&") {
					if (r === 0) {
						e.removeChild(i), Hh(t);
						return;
					}
					r--;
				} else if (n === "$" || n === "$?" || n === "$~" || n === "$!" || n === "&") r++;
				else if (n === "html") _m(e.ownerDocument.documentElement);
				else if (n === "head") {
					n = e.ownerDocument.head, _m(n);
					for (var a = n.firstChild; a;) {
						var o = a.nextSibling, s = a.nodeName;
						a[Lt] || s === "SCRIPT" || s === "STYLE" || s === "LINK" && a.rel.toLowerCase() === "stylesheet" || n.removeChild(a), a = o;
					}
				} else n === "body" && _m(e.ownerDocument.body);
			}
			n = i;
		} while (n);
		Hh(t);
	}
	function wp(e, t) {
		var n = e;
		e = 0;
		do {
			var r = n.nextSibling;
			if (n.nodeType === 1 ? t ? (n._stashedDisplay = n.style.display, n.style.display = "none") : (n.style.display = n._stashedDisplay || "", n.getAttribute("style") === "" && n.removeAttribute("style")) : n.nodeType === 3 && (t ? (n._stashedText = n.nodeValue, n.nodeValue = "") : n.nodeValue = n._stashedText || ""), r && r.nodeType === 8) {
				if (n = r.data, n === "/$") {
					if (e === 0) break;
					e--;
				} else n !== "$" && n !== "$?" && n !== "$~" && n !== "$!" || e++;
			}
			n = r;
		} while (n);
	}
	function Tp(e, t, n) {
		if (t = CSS.escape(t) === t ? t : "r-" + btoa(t).replace(/=/g, ""), e.style.viewTransitionName = t, n != null && (e.style.viewTransitionClass = n), n = getComputedStyle(e), n.display === "inline") {
			if (t = e.getClientRects(), t.length === 1) var r = 1;
			else for (var i = r = 0; i < t.length; i++) {
				var a = t[i];
				0 < a.width && 0 < a.height && r++;
			}
			r === 1 && (e = e.style, e.display = t.length === 1 ? "inline-block" : "block", e.marginTop = "-" + n.paddingTop, e.marginBottom = "-" + n.paddingBottom);
		}
	}
	function Ep(e, t) {
		e = e.style, t = t.style;
		var n = t == null ? null : t.hasOwnProperty("viewTransitionName") ? t.viewTransitionName : t.hasOwnProperty("view-transition-name") ? t["view-transition-name"] : null;
		e.viewTransitionName = n == null || typeof n == "boolean" ? "" : ("" + n).trim(), n = t == null ? null : t.hasOwnProperty("viewTransitionClass") ? t.viewTransitionClass : t.hasOwnProperty("view-transition-class") ? t["view-transition-class"] : null, e.viewTransitionClass = n == null || typeof n == "boolean" ? "" : ("" + n).trim(), e.display === "inline-block" && (t == null ? e.display = e.margin = "" : (n = t.display, e.display = n == null || typeof n == "boolean" ? "" : n, n = t.margin, n == null ? (n = t.hasOwnProperty("marginTop") ? t.marginTop : t["margin-top"], e.marginTop = n == null || typeof n == "boolean" ? "" : n, t = t.hasOwnProperty("marginBottom") ? t.marginBottom : t["margin-bottom"], e.marginBottom = t == null || typeof t == "boolean" ? "" : t) : e.margin = n));
	}
	function Dp(e, t, n) {
		return n = n.ownerDocument.defaultView, {
			rect: e,
			abs: t.position === "absolute" || t.position === "fixed",
			clip: t.clipPath !== "none" || t.overflow !== "visible" || t.filter !== "none" || t.mask !== "none" || t.mask !== "none" || t.borderRadius !== "0px",
			view: 0 <= e.bottom && 0 <= e.right && e.top <= n.innerHeight && e.left <= n.innerWidth
		};
	}
	function Op(e) {
		return Dp(e.getBoundingClientRect(), getComputedStyle(e), e);
	}
	function kp(e) {
		var t = e.getBoundingClientRect();
		t = new DOMRect(t.x + 2e4, t.y + 2e4, t.width, t.height);
		var n = getComputedStyle(e);
		return Dp(t, n, e);
	}
	function Ap(e) {
		return e.documentElement.clientHeight;
	}
	function jp(e) {
		this.addEventListener("load", e), this.addEventListener("error", e);
	}
	function Mp(e, t, n, r, i, a, o, s, c) {
		var l = t.nodeType === 9 ? t : t.ownerDocument;
		try {
			var u = l.startViewTransition({
				update: function() {
					var t = l.defaultView, n = t.navigation && t.navigation.transition, o = l.fonts.status;
					r();
					var s = [];
					if (o === "loaded" && (Ap(l), l.fonts.status === "loading" && s.push(l.fonts.ready)), o = s.length, e !== null) for (var c = e.suspenseyImages, u = 0, d = 0; d < c.length; d++) {
						var f = c[d];
						if (!f.complete) {
							var p = f.getBoundingClientRect();
							if (0 < p.bottom && 0 < p.right && p.top < t.innerHeight && p.left < t.innerWidth) {
								if (u += Xm(f), u > $m) {
									s.length = o;
									break;
								}
								f = new Promise(jp.bind(f)), s.push(f);
							}
						}
					}
					if (0 < s.length) return t = Promise.race([Promise.all(s), new Promise(function(e) {
						return setTimeout(e, 500);
					})]).then(i, i), (n ? Promise.allSettled([n.finished, t]) : t).then(a, a);
					if (i(), n) return n.finished.then(a, a);
					a();
				},
				types: n
			});
			l.__reactViewTransition = u;
			var d = [];
			return u.ready.then(function() {
				for (var e = l.documentElement.getAnimations({ subtree: !0 }), t = 0; t < e.length; t++) {
					var n = e[t], r = n.effect, i = r.pseudoElement;
					if (i != null && i.startsWith("::view-transition")) {
						d.push(n), n = r.getKeyframes();
						for (var a = i = void 0, s = !0, c = 0; c < n.length; c++) {
							var u = n[c], f = u.width;
							if (i === void 0) i = f;
							else if (i !== f) {
								s = !1;
								break;
							}
							if (f = u.height, a === void 0) a = f;
							else if (a !== f) {
								s = !1;
								break;
							}
							delete u.width, delete u.height, u.transform === "none" && delete u.transform;
						}
						s && i !== void 0 && a !== void 0 && (r.setKeyframes(n), s = getComputedStyle(r.target, r.pseudoElement), s.width !== i || s.height !== a) && (s = n[0], s.width = i, s.height = a, s = n[n.length - 1], s.width = i, s.height = a, r.setKeyframes(n));
					}
				}
				o();
			}, function(e) {
				l.__reactViewTransition === u && (l.__reactViewTransition = null);
				try {
					if (typeof e == "object" && e) switch (e.name) {
						case "InvalidStateError": (e.message === "View transition was skipped because document visibility state is hidden." || e.message === "Skipping view transition because document visibility state has become hidden." || e.message === "Skipping view transition because viewport size changed." || e.message === "Transition was aborted because of invalid state") && (e = null);
					}
					e !== null && c(e);
				} finally {
					r(), i(), o();
				}
			}), u.finished.finally(function() {
				for (var e = 0; e < d.length; e++) d[e].cancel();
				l.__reactViewTransition === u && (l.__reactViewTransition = null), s();
			}), u;
		} catch {
			return r(), i(), o(), null;
		}
	}
	function Np(e, t) {
		this._scope = document.documentElement, this._selector = "::view-transition-" + e + "(" + t + ")";
	}
	Np.prototype.animate = function(e, t) {
		return t = typeof t == "number" ? { duration: t } : C({}, t), t.pseudoElement = this._selector, this._scope.animate(e, t);
	}, Np.prototype.getAnimations = function() {
		for (var e = this._scope, t = this._selector, n = e.getAnimations({ subtree: !0 }), r = [], i = 0; i < n.length; i++) {
			var a = n[i].effect;
			a !== null && a.target === e && a.pseudoElement === t && r.push(n[i]);
		}
		return r;
	}, Np.prototype.getComputedStyle = function() {
		return getComputedStyle(this._scope, this._selector);
	};
	function Pp(e) {
		return {
			name: e,
			group: new Np("group", e),
			imagePair: new Np("image-pair", e),
			old: new Np("old", e),
			new: new Np("new", e)
		};
	}
	function Fp(e) {
		this._fragmentFiber = e, this._observers = this._eventListeners = null;
	}
	Fp.prototype.addEventListener = function(e, t, n) {
		var r = null, i = null;
		if (!(n != null && typeof n != "boolean" && (r = n.signal || null, r !== null && r.aborted))) {
			this._eventListeners === null && (this._eventListeners = []);
			var a = this._eventListeners;
			if (Bp(a, e, t, n) === -1) {
				var o = this, s = t;
				n != null && typeof n != "boolean" && !0 === n.once && (s = function(r) {
					o.removeEventListener(e, t, n), typeof t == "function" ? t.call(this, r) : t.handleEvent(r);
				}), r !== null && (i = o.removeEventListener.bind(o, e, t, n), r.addEventListener("abort", i, { once: !0 }), i = r.removeEventListener.bind(r, "abort", i)), r = Rp(n), a.push({
					type: e,
					listener: t,
					optionsOrUseCapture: n,
					attachedListener: s,
					cleanup: i
				}), h(this._fragmentFiber.child, !1, Ip, e, s, r);
			}
			this._eventListeners = a;
		}
	};
	function Ip(e, t, n, r) {
		return b(e).addEventListener(t, n, r), !1;
	}
	Fp.prototype.removeEventListener = function(e, t, n) {
		var r = this._eventListeners;
		if (r !== null && (t = Bp(r, e, t, n), t !== -1)) {
			var i = r[t];
			n = i.attachedListener;
			var a = i.cleanup;
			i = Rp(i.optionsOrUseCapture), h(this._fragmentFiber.child, !1, Lp, e, n, i), r.splice(t, 1), a !== null && a();
		}
	};
	function Lp(e, t, n, r) {
		return b(e).removeEventListener(t, n, r), !1;
	}
	function Rp(e) {
		return e != null && typeof e != "boolean" && (!0 === e.once || e.signal instanceof AbortSignal) ? {
			capture: e.capture,
			passive: e.passive
		} : e;
	}
	function zp(e) {
		return e == null ? "c=0" : typeof e == "boolean" ? "c=" + (e ? "1" : "0") : "c=" + (e.capture ? "1" : "0");
	}
	function Bp(e, t, n, r) {
		if (e.length === 0) return -1;
		r = zp(r);
		for (var i = 0; i < e.length; i++) {
			var a = e[i];
			if (a.type === t && a.listener === n && zp(a.optionsOrUseCapture) === r) return i;
		}
		return -1;
	}
	Fp.prototype.dispatchEvent = function(e) {
		var t = g(this._fragmentFiber);
		if (t === null) return !0;
		t = b(t);
		var n = this._eventListeners;
		if (n !== null && 0 < n.length || !e.bubbles) {
			var r = t.nodeType === 9 ? t.createComment("") : document.createTextNode("");
			if (n) for (var i = 0; i < n.length; i++) {
				var a = n[i];
				r.addEventListener(a.type, a.attachedListener, Rp(a.optionsOrUseCapture));
			}
			if (t.appendChild(r), e = r.dispatchEvent(e), n) for (i = 0; i < n.length; i++) a = n[i], r.removeEventListener(a.type, a.attachedListener, Rp(a.optionsOrUseCapture));
			return t.removeChild(r), e;
		}
		return t.dispatchEvent(e);
	}, Fp.prototype.focus = function(e) {
		h(this._fragmentFiber.child, !0, Vp, e, void 0, void 0);
	};
	function Vp(e, t) {
		return e.tag !== 6 && (e = b(e), pm(e, t));
	}
	Fp.prototype.focusLast = function(e) {
		var t = [];
		h(this._fragmentFiber.child, !0, Hp, t, void 0, void 0);
		for (var n = t.length - 1; 0 <= n && !Vp(t[n], e); n--);
	};
	function Hp(e, t) {
		return t.push(e), !1;
	}
	Fp.prototype.blur = function() {
		var e = g(this._fragmentFiber);
		e !== null && (e = b(e), e = lp(e).activeElement, e !== null && h(this._fragmentFiber.child, !1, Up, e, void 0, void 0));
	};
	function Up(e, t) {
		return e.tag !== 6 && (e = b(e), e === t || e.contains(t) ? (t.blur(), !0) : !1);
	}
	Fp.prototype.observeUsing = function(e) {
		this._observers === null && (this._observers = /* @__PURE__ */ new Set()), this._observers.add(e), h(this._fragmentFiber.child, !1, Wp, e, void 0, void 0);
	};
	function Wp(e, t) {
		return e.tag === 6 || (e = b(e), t.observe(e)), !1;
	}
	Fp.prototype.unobserveUsing = function(e) {
		var t = this._observers;
		if (t !== null && t.has(e)) {
			t.delete(e), h(this._fragmentFiber.child, !1, Gp, e, void 0, void 0);
			for (var n = t = 0; n < Kp.length; n++) {
				var r = Kp[n];
				r.fragmentInstance === this && r.observer === e ? e.unobserve(r.instance) : Kp[t++] = r;
			}
			Kp.length = t;
		}
	};
	function Gp(e, t) {
		return e.tag === 6 || (e = b(e), t.unobserve(e)), !1;
	}
	var Kp = [], qp = !1;
	function Jp(e, t, n) {
		Kp.push({
			fragmentInstance: e,
			observer: t,
			instance: n
		}), qp || (qp = !0, mm(function() {
			qp = !1;
			var e = Kp;
			Kp = [];
			for (var t = 0; t < e.length; t++) {
				var n = e[t];
				n.observer.unobserve(n.instance);
			}
		}));
	}
	Fp.prototype.getClientRects = function() {
		var e = [];
		return h(this._fragmentFiber.child, !1, Yp, e, void 0, void 0), e;
	};
	function Yp(e, t) {
		if (e.tag === 6) {
			e = e.stateNode;
			var n = e.ownerDocument.createRange();
			n.selectNodeContents(e), t.push.apply(t, n.getClientRects());
		} else e = b(e), t.push.apply(t, e.getClientRects());
		return !1;
	}
	Fp.prototype.getRootNode = function(e) {
		var t = g(this._fragmentFiber);
		return t === null ? this : b(t).getRootNode(e);
	}, Fp.prototype.compareDocumentPosition = function(e) {
		var t = g(this._fragmentFiber);
		if (t === null) return Node.DOCUMENT_POSITION_DISCONNECTED;
		var n = [];
		h(this._fragmentFiber.child, !1, Hp, n, void 0, void 0);
		var r = b(t);
		if (n.length === 0) {
			if (n = r, _(this._fragmentFiber)) {
				a: {
					for (t = this._fragmentFiber.return; t !== null;) {
						if (t.tag === 4) {
							t = t.stateNode.containerInfo;
							break a;
						}
						if (t.tag === 3 || t.tag === 5 || t.tag === 27) break;
						t = t.return;
					}
					t = null;
				}
				t != null && (n = t);
			}
			t = this._fragmentFiber;
			var i = r = n.compareDocumentPosition(e);
			return n === e ? i = Node.DOCUMENT_POSITION_CONTAINS : r & Node.DOCUMENT_POSITION_CONTAINED_BY && (n = v(t)[1], n === null ? i = Node.DOCUMENT_POSITION_PRECEDING : (e = b(n).compareDocumentPosition(e), i = e === 0 || e & Node.DOCUMENT_POSITION_FOLLOWING ? Node.DOCUMENT_POSITION_FOLLOWING : Node.DOCUMENT_POSITION_PRECEDING)), i |= Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC;
		}
		t = b(n[0]), i = b(n[n.length - 1]);
		var a = _(this._fragmentFiber) ? t.parentElement : r;
		if (a == null) return Node.DOCUMENT_POSITION_DISCONNECTED;
		r = a.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_CONTAINED_BY, a = a.compareDocumentPosition(i) & Node.DOCUMENT_POSITION_CONTAINED_BY;
		var o = t.compareDocumentPosition(e), s = i.compareDocumentPosition(e), c = o & Node.DOCUMENT_POSITION_CONTAINED_BY || s & Node.DOCUMENT_POSITION_CONTAINED_BY;
		return s = r && a && o & Node.DOCUMENT_POSITION_FOLLOWING && s & Node.DOCUMENT_POSITION_PRECEDING, t = r && t === e || a && i === e || c || s ? Node.DOCUMENT_POSITION_CONTAINED_BY : !r && t === e || !a && i === e ? Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC : o, t & Node.DOCUMENT_POSITION_DISCONNECTED || t & Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC || Xp(t, this._fragmentFiber, n[0], n[n.length - 1], e) ? t : Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC;
	};
	function Xp(e, t, n, r, i) {
		var a = Bt(i);
		if (e & Node.DOCUMENT_POSITION_CONTAINED_BY) {
			if (n = !!a) a: {
				for (; a !== null;) {
					if (a.tag === 7 && (a === t || a.alternate === t)) {
						n = !0;
						break a;
					}
					a = a.return;
				}
				n = !1;
			}
			return n;
		}
		if (e & Node.DOCUMENT_POSITION_CONTAINS) {
			if (a === null) return a = i.ownerDocument, i === a || i === a.documentElement || i === a.body;
			a: {
				for (a = t, t = g(t); a !== null;) {
					if (!(a.tag !== 5 && a.tag !== 3 && a.tag !== 27 || a !== t && a.alternate !== t)) {
						a = !0;
						break a;
					}
					a = a.return;
				}
				a = !1;
			}
			return a;
		}
		return e & Node.DOCUMENT_POSITION_PRECEDING ? ((t = !!a) && !(t = a === n) && (t = re(n, a, S), t === null ? t = !1 : (h(t, !0, te, a, n), a = ee, ee = null, t = a !== null)), t) : e & Node.DOCUMENT_POSITION_FOLLOWING ? ((t = !!a) && !(t = a === r) && (t = re(r, a, S), t === null ? t = !1 : (h(t, !0, ne, a, r), a = ee, x = ee = null, t = a !== null)), t) : !1;
	}
	function Zp(e, t) {
		var n = e.ownerDocument.createRange();
		n.selectNodeContents(e), e = n.getBoundingClientRect(), window.scrollTo(window.scrollX + e.left, t ? window.scrollY + e.top : window.scrollY + e.bottom - window.innerHeight);
	}
	Fp.prototype.scrollIntoView = function(e) {
		if (typeof e == "object") throw Error(i(566));
		var t = [];
		h(this._fragmentFiber.child, !1, Hp, t, void 0, void 0);
		var n = !1 !== e;
		if (t.length === 0) {
			var r = v(this._fragmentFiber);
			if (r = n ? r[1] || r[0] || g(this._fragmentFiber) : r[0] || r[1], r === null) return;
			if (r.tag === 6) {
				e = b(r), Zp(e, n);
				return;
			}
			if (r = b(r), r.nodeType !== 9) {
				if (r.nodeType === 11) {
					n = "host" in r ? r.host : null, n !== null && n.scrollIntoView(e);
					return;
				}
				r.scrollIntoView(e);
			}
		}
		for (r = n ? t.length - 1 : 0; r !== (n ? -1 : t.length);) {
			var a = t[r];
			a.tag === 6 ? (a = b(a), Zp(a, n)) : b(a).scrollIntoView(e), r += n ? -1 : 1;
		}
	};
	function Qp(e, t) {
		return e = b(e), $p(e, t), !1;
	}
	function $p(e, t) {
		e.reactFragments ??= /* @__PURE__ */ new Set(), e.reactFragments.add(t);
	}
	function em(e, t) {
		var n = t._eventListeners;
		if (n !== null) for (var r = 0; r < n.length; r++) {
			var i = n[r];
			e.addEventListener(i.type, i.attachedListener, Rp(i.optionsOrUseCapture));
		}
		e.nodeType !== 3 && (n = t._observers, n !== null && n.forEach(function(n) {
			for (var r = 0, i = 0; i < Kp.length; i++) {
				var a = Kp[i];
				(a.fragmentInstance !== t || a.observer !== n || a.instance !== e) && (Kp[r++] = a);
			}
			Kp.length = r, n.observe(e);
		}), $p(e, t));
	}
	function tm(e, t) {
		var n = t._eventListeners;
		if (n !== null) for (var r = 0; r < n.length; r++) {
			var i = n[r];
			e.removeEventListener(i.type, i.attachedListener, Rp(i.optionsOrUseCapture));
		}
		e.nodeType !== 3 && (n = t._observers, n !== null && n.forEach(function(n) {
			typeof n.rootMargin == "string" ? Jp(t, n, e) : n.unobserve(e);
		}), e.reactFragments != null && e.reactFragments.delete(t));
	}
	function nm(e) {
		var t = e.firstChild;
		for (t && t.nodeType === 10 && (t = t.nextSibling); t;) {
			var n = t;
			switch (t = t.nextSibling, n.nodeName) {
				case "HTML":
				case "HEAD":
				case "BODY":
					nm(n), zt(n);
					continue;
				case "SCRIPT":
				case "STYLE": continue;
				case "LINK": if (n.rel.toLowerCase() === "stylesheet") continue;
			}
			e.removeChild(n);
		}
	}
	function rm(e, t, n, r) {
		for (; e.nodeType === 1;) {
			var i = n;
			if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
				if (!r && (e.nodeName !== "INPUT" || e.type !== "hidden")) break;
			} else if (!r) {
				if (t === "input" && e.type === "hidden") {
					var a = i.name == null ? null : "" + i.name;
					if (i.type === "hidden" && e.getAttribute("name") === a) return e;
				} else return e;
			} else if (!e[Lt]) switch (t) {
				case "meta":
					if (!e.hasAttribute("itemprop")) break;
					return e;
				case "link":
					if (a = e.getAttribute("rel"), a === "stylesheet" && e.hasAttribute("data-precedence") || a !== i.rel || e.getAttribute("href") !== (i.href == null || i.href === "" ? null : i.href) || e.getAttribute("crossorigin") !== (i.crossOrigin == null ? null : i.crossOrigin) || e.getAttribute("title") !== (i.title == null ? null : i.title)) break;
					return e;
				case "style":
					if (e.hasAttribute("data-precedence")) break;
					return e;
				case "script":
					if (a = e.getAttribute("src"), (a !== (i.src == null ? null : i.src) || e.getAttribute("type") !== (i.type == null ? null : i.type) || e.getAttribute("crossorigin") !== (i.crossOrigin == null ? null : i.crossOrigin)) && a && e.hasAttribute("async") && !e.hasAttribute("itemprop")) break;
					return e;
				default: return e;
			}
			if (e = lm(e.nextSibling), e === null) break;
		}
		return null;
	}
	function im(e, t, n) {
		if (t === "") return null;
		for (; e.nodeType !== 3;) if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !n || (e = lm(e.nextSibling), e === null)) return null;
		return e;
	}
	function am(e, t) {
		for (; e.nodeType !== 8;) if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !t || (e = lm(e.nextSibling), e === null)) return null;
		return e;
	}
	function om(e) {
		return e.data === "$?" || e.data === "$~";
	}
	function sm(e) {
		return e.data === "$!" || e.data === "$?" && e.ownerDocument.readyState !== "loading";
	}
	function cm(e, t) {
		var n = e.ownerDocument;
		if (e.data === "$~") e._reactRetry = t;
		else if (e.data !== "$?" || n.readyState !== "loading") t();
		else {
			var r = function() {
				t(), n.removeEventListener("DOMContentLoaded", r);
			};
			n.addEventListener("DOMContentLoaded", r), e._reactRetry = r;
		}
	}
	function lm(e) {
		for (; e != null; e = e.nextSibling) {
			var t = e.nodeType;
			if (t === 1 || t === 3) break;
			if (t === 8) {
				if (t = e.data, t === "$" || t === "$!" || t === "$?" || t === "$~" || t === "&" || t === "F!" || t === "F") break;
				if (t === "/$" || t === "/&") return null;
			}
		}
		return e;
	}
	var um = null;
	function dm(e) {
		e = e.nextSibling;
		for (var t = 0; e;) {
			if (e.nodeType === 8) {
				var n = e.data;
				if (n === "/$" || n === "/&") {
					if (t === 0) return lm(e.nextSibling);
					t--;
				} else n !== "$" && n !== "$!" && n !== "$?" && n !== "$~" && n !== "&" || t++;
			}
			e = e.nextSibling;
		}
		return null;
	}
	function fm(e) {
		e = e.previousSibling;
		for (var t = 0; e;) {
			if (e.nodeType === 8) {
				var n = e.data;
				if (n === "$" || n === "$!" || n === "$?" || n === "$~" || n === "&") {
					if (t === 0) return e;
					t--;
				} else n !== "/$" && n !== "/&" || t++;
			}
			e = e.previousSibling;
		}
		return null;
	}
	function pm(e, t) {
		function n() {
			r = !0;
		}
		if (e.ownerDocument.activeElement === e) return !0;
		var r = !1;
		try {
			e.ownerDocument.addEventListener("focus", n, !0), (e.focus || HTMLElement.prototype.focus).call(e, t);
		} finally {
			e.ownerDocument.removeEventListener("focus", n, !0);
		}
		return r;
	}
	function mm(e) {
		yp(function() {
			yp(function(t) {
				return e(t);
			});
		});
	}
	function hm(e, t, n) {
		switch (t = lp(n), e) {
			case "html":
				if (e = t.documentElement, !e) throw Error(i(452));
				return e;
			case "head":
				if (e = t.head, !e) throw Error(i(453));
				return e;
			case "body":
				if (e = t.body, !e) throw Error(i(454));
				return e;
			default: throw Error(i(451));
		}
	}
	function gm(e, t, n) {
		for (var r in n) {
			var i = n[r];
			n.hasOwnProperty(r) && i != null && $(e, t, r, null, rp, i);
		}
		n.dangerouslySetInnerHTML != null && (e.textContent = ""), e.onclick === En && (e.onclick = null), zt(e);
	}
	function _m(e) {
		for (var t = e.attributes; t.length;) e.removeAttributeNode(t[0]);
		zt(e);
	}
	var vm = /* @__PURE__ */ new Map(), ym = /* @__PURE__ */ new Set();
	function bm(e) {
		if (typeof e.getRootNode == "function") {
			var t = e.getRootNode();
			if (t.nodeType === 9 || t.nodeType === 11) return t;
		}
		return e.nodeType === 9 ? e : e.ownerDocument;
	}
	var xm = O.d;
	O.d = {
		f: Sm,
		r: Cm,
		D: Em,
		C: Dm,
		L: Om,
		m: km,
		X: jm,
		S: Am,
		M: Mm
	};
	function Sm() {
		var e = xm.f(), t = zd();
		return e || t;
	}
	function Cm(e) {
		var t = Vt(e);
		t !== null && t.tag === 5 && t.type === "form" ? ic(t) : xm.r(e);
	}
	var wm = typeof document > "u" ? null : document;
	function Tm(e, t, n) {
		var r = wm;
		if (r && typeof t == "string" && t) {
			var i = dn(t);
			i = "link[rel=\"" + e + "\"][href=\"" + i + "\"]", typeof n == "string" && (i += "[crossorigin=\"" + n + "\"]"), ym.has(i) || (ym.add(i), e = {
				rel: e,
				crossOrigin: n,
				href: t
			}, r.querySelector(i) === null && (t = r.createElement("link"), np(t, "link", e), Wt(t), r.head.appendChild(t)));
		}
	}
	function Em(e) {
		xm.D(e), Tm("dns-prefetch", e, null);
	}
	function Dm(e, t) {
		xm.C(e, t), Tm("preconnect", e, t);
	}
	function Om(e, t, n) {
		xm.L(e, t, n);
		var r = wm;
		if (r && e && t) {
			var i = "link[rel=\"preload\"][as=\"" + dn(t) + "\"]";
			t === "image" && n && n.imageSrcSet ? (i += "[imagesrcset=\"" + dn(n.imageSrcSet) + "\"]", typeof n.imageSizes == "string" && (i += "[imagesizes=\"" + dn(n.imageSizes) + "\"]")) : i += "[href=\"" + dn(e) + "\"]";
			var a = i;
			switch (t) {
				case "style":
					a = Pm(e);
					break;
				case "script": a = Rm(e);
			}
			if (!(vm.has(a) || (e = C({
				rel: "preload",
				href: t === "image" && n && n.imageSrcSet ? void 0 : e,
				as: t
			}, n), vm.set(a, e), r.querySelector(i) !== null || t === "style" && r.querySelector(Fm(a)) || t === "script" && r.querySelector(zm(a))))) {
				var o = r.createElement("link");
				np(o, "link", e), t === "style" && (o[Rt] = !0, o.onload = o.onerror = function() {
					Gt(o);
				}), Wt(o), r.head.appendChild(o);
			}
		}
	}
	function km(e, t) {
		xm.m(e, t);
		var n = wm;
		if (n && e) {
			var r = t && typeof t.as == "string" ? t.as : "script", i = "link[rel=\"modulepreload\"][as=\"" + dn(r) + "\"][href=\"" + dn(e) + "\"]", a = i;
			switch (r) {
				case "audioworklet":
				case "paintworklet":
				case "serviceworker":
				case "sharedworker":
				case "worker":
				case "script": a = Rm(e);
			}
			if (!vm.has(a) && (e = C({
				rel: "modulepreload",
				href: e
			}, t), vm.set(a, e), n.querySelector(i) === null)) {
				switch (r) {
					case "audioworklet":
					case "paintworklet":
					case "serviceworker":
					case "sharedworker":
					case "worker":
					case "script": if (n.querySelector(zm(a))) return;
				}
				r = n.createElement("link"), np(r, "link", e), Wt(r), n.head.appendChild(r);
			}
		}
	}
	function Am(e, t, n) {
		xm.S(e, t, n);
		var r = wm;
		if (r && e) {
			var i = Ut(r).hoistableStyles, a = Pm(e);
			t ||= "default";
			var o = i.get(a);
			if (!o) {
				var s = {
					loading: 0,
					preload: null
				};
				if (o = r.querySelector(Fm(a))) s.loading = 5;
				else {
					e = C({
						rel: "stylesheet",
						href: e,
						"data-precedence": t
					}, n), (n = vm.get(a)) && Hm(e, n);
					var c = o = r.createElement("link");
					Wt(c), np(c, "link", e), c._p = new Promise(function(e, t) {
						c.onload = e, c.onerror = t;
					}), c.addEventListener("load", function() {
						s.loading |= 1;
					}), c.addEventListener("error", function() {
						s.loading |= 2;
					}), s.loading |= 4, Vm(o, t, r);
				}
				o = {
					type: "stylesheet",
					instance: o,
					count: 1,
					state: s
				}, i.set(a, o);
			}
		}
	}
	function jm(e, t) {
		xm.X(e, t);
		var n = wm;
		if (n && e) {
			var r = Ut(n).hoistableScripts, i = Rm(e), a = r.get(i);
			a || (a = n.querySelector(zm(i)), a || (e = C({
				src: e,
				async: !0
			}, t), (t = vm.get(i)) && Um(e, t), a = n.createElement("script"), Wt(a), np(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function Mm(e, t) {
		xm.M(e, t);
		var n = wm;
		if (n && e) {
			var r = Ut(n).hoistableScripts, i = Rm(e), a = r.get(i);
			a || (a = n.querySelector(zm(i)), a || (e = C({
				src: e,
				async: !0,
				type: "module"
			}, t), (t = vm.get(i)) && Um(e, t), a = n.createElement("script"), Wt(a), np(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function Nm(e, t, n, r) {
		var a = (a = je.current) ? bm(a) : null;
		if (!a) throw Error(i(446));
		switch (e) {
			case "meta":
			case "title": return null;
			case "style": return typeof n.precedence == "string" && typeof n.href == "string" ? (n = Pm(n.href), t = Ut(a).hoistableStyles, r = t.get(n), r || (r = {
				type: "style",
				instance: null,
				count: 0,
				state: null
			}, t.set(n, r)), r) : {
				type: "void",
				instance: null,
				count: 0,
				state: null
			};
			case "link":
				if (n.rel === "stylesheet" && typeof n.href == "string" && typeof n.precedence == "string") {
					e = Pm(n.href);
					var o = Ut(a).hoistableStyles, s = o.get(e);
					if (s || (a = a.ownerDocument || a, s = {
						type: "stylesheet",
						instance: null,
						count: 0,
						state: {
							loading: 0,
							preload: null
						}
					}, o.set(e, s), (o = a.querySelector(Fm(e))) ? o._p || (s.instance = o, s.state.loading = 5) : (o = vm.get(e), o || (o = {
						rel: "preload",
						as: "style",
						href: n.href,
						crossOrigin: n.crossOrigin,
						integrity: n.integrity,
						media: n.media,
						hrefLang: n.hrefLang,
						referrerPolicy: n.referrerPolicy
					}, vm.set(e, o)), Lm(a, e, o, s.state))), t && r === null) throw Error(i(528, ""));
					return s;
				}
				if (t && r !== null) throw Error(i(529, ""));
				return null;
			case "script": return t = n.async, n = n.src, typeof n == "string" && t && typeof t != "function" && typeof t != "symbol" ? (n = Rm(n), t = Ut(a).hoistableScripts, r = t.get(n), r || (r = {
				type: "script",
				instance: null,
				count: 0,
				state: null
			}, t.set(n, r)), r) : {
				type: "void",
				instance: null,
				count: 0,
				state: null
			};
			default: throw Error(i(444, e));
		}
	}
	function Pm(e) {
		return "href=\"" + dn(e) + "\"";
	}
	function Fm(e) {
		return "link[rel=\"stylesheet\"][" + e + "]";
	}
	function Im(e) {
		return C({}, e, {
			"data-precedence": e.precedence,
			precedence: null
		});
	}
	function Lm(e, t, n, r) {
		if (t = e.querySelector("link[rel=\"preload\"][as=\"style\"][" + t + "]")) {
			if (!0 !== t[Rt]) {
				r.loading = 1;
				return;
			}
		} else t = e.createElement("link"), t[Rt] = !0, t.onload = t.onerror = Gt.bind(null, t), np(t, "link", n), Wt(t), e.head.appendChild(t);
		r.preload = t, t.addEventListener("load", function() {
			return r.loading |= 1;
		}), t.addEventListener("error", function() {
			return r.loading |= 2;
		});
	}
	function Rm(e) {
		return "[src=\"" + dn(e) + "\"]";
	}
	function zm(e) {
		return "script[async]" + e;
	}
	function Bm(e, t, n) {
		if (t.count++, t.instance === null) switch (t.type) {
			case "style":
				var r = e.querySelector("style[data-href~=\"" + dn(n.href) + "\"]");
				if (r) return t.instance = r, Wt(r), r;
				var a = C({}, n, {
					"data-href": n.href,
					"data-precedence": n.precedence,
					href: null,
					precedence: null
				});
				return r = (e.ownerDocument || e).createElement("style"), Wt(r), np(r, "style", a), Vm(r, n.precedence, e), t.instance = r;
			case "stylesheet":
				a = Pm(n.href);
				var o = e.querySelector(Fm(a));
				if (o) return t.state.loading |= 4, t.instance = o, Wt(o), o;
				r = Im(n), (a = vm.get(a)) && Hm(r, a), o = (e.ownerDocument || e).createElement("link"), Wt(o);
				var s = o;
				return s._p = new Promise(function(e, t) {
					s.onload = e, s.onerror = t;
				}), np(o, "link", r), t.state.loading |= 4, Vm(o, n.precedence, e), t.instance = o;
			case "script": return o = Rm(n.src), (a = e.querySelector(zm(o))) ? (t.instance = a, Wt(a), a) : (r = n, (a = vm.get(o)) && (r = C({}, n), Um(r, a)), e = e.ownerDocument || e, a = e.createElement("script"), Wt(a), np(a, "link", r), e.head.appendChild(a), t.instance = a);
			case "void": return null;
			default: throw Error(i(443, t.type));
		}
		else t.type === "stylesheet" && !(t.state.loading & 4) && (r = t.instance, t.state.loading |= 4, Vm(r, n.precedence, e));
		return t.instance;
	}
	function Vm(e, t, n) {
		for (var r = n.querySelectorAll("link[rel=\"stylesheet\"][data-precedence],style[data-precedence]"), i = r.length ? r[r.length - 1] : null, a = i, o = 0; o < r.length; o++) {
			var s = r[o];
			if (s.dataset.precedence === t) a = s;
			else if (a !== i) break;
		}
		a ? a.parentNode.insertBefore(e, a.nextSibling) : (t = n.nodeType === 9 ? n.head : n, t.insertBefore(e, t.firstChild));
	}
	function Hm(e, t) {
		e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.title ??= t.title;
	}
	function Um(e, t) {
		e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.integrity ??= t.integrity;
	}
	var Wm = null;
	function Gm(e, t, n) {
		if (Wm === null) {
			var r = /* @__PURE__ */ new Map(), i = Wm = /* @__PURE__ */ new Map();
			i.set(n, r);
		} else i = Wm, r = i.get(n), r || (r = /* @__PURE__ */ new Map(), i.set(n, r));
		if (r.has(e)) return r;
		for (r.set(e, null), n = n.getElementsByTagName(e), i = 0; i < n.length; i++) {
			var a = n[i];
			if (!(a[Lt] || a[At] || e === "link" && a.getAttribute("rel") === "stylesheet") && a.namespaceURI !== "http://www.w3.org/2000/svg") {
				var o = a.getAttribute(t) || "";
				o = e + o;
				var s = r.get(o);
				s ? s.push(a) : r.set(o, [a]);
			}
		}
		return r;
	}
	function Km(e, t, n) {
		e = e.ownerDocument || e, e.head.insertBefore(n, t === "title" ? e.querySelector("head > title") : null);
	}
	function qm(e, t, n) {
		if (n === 1 || t.itemProp != null) return !1;
		switch (e) {
			case "meta":
			case "title": return !0;
			case "style":
				if (typeof t.precedence != "string" || typeof t.href != "string" || t.href === "") break;
				return !0;
			case "link":
				if (typeof t.rel != "string" || typeof t.href != "string" || t.href === "" || t.onLoad || t.onError) break;
				switch (t.rel) {
					case "stylesheet": return e = t.disabled, typeof t.precedence == "string" && e == null;
					default: return !0;
				}
			case "script": if (t.async && typeof t.async != "function" && typeof t.async != "symbol" && !t.onLoad && !t.onError && t.src && typeof t.src == "string") return !0;
		}
		return !1;
	}
	function Jm(e, t) {
		return e === "img" && t.src != null && t.src !== "" && t.onLoad == null && t.loading !== "lazy";
	}
	function Ym(e) {
		return !(e.type === "stylesheet" && !(e.state.loading & 3));
	}
	function Xm(e) {
		return (e.width || 100) * (e.height || 100) * (typeof devicePixelRatio == "number" ? devicePixelRatio : 1) * .25;
	}
	function Zm(e, t) {
		typeof t.decode == "function" && (e.imgCount++, t.complete || (e.imgBytes += Xm(t), e.suspenseyImages.push(t)), e = rh.bind(e), t.decode().then(e, e));
	}
	function Qm(e, t, n, r) {
		if (n.type === "stylesheet" && (typeof r.media != "string" || !1 !== matchMedia(r.media).matches) && !(n.state.loading & 4)) {
			if (n.instance === null) {
				var i = Pm(r.href), a = t.querySelector(Fm(i));
				if (a) {
					t = a._p, typeof t == "object" && t && typeof t.then == "function" && (e.count++, e = nh.bind(e), t.then(e, e)), n.state.loading |= 4, n.instance = a, Wt(a);
					return;
				}
				a = t.ownerDocument || t, r = Im(r), (i = vm.get(i)) && Hm(r, i), a = a.createElement("link"), Wt(a);
				var o = a;
				o._p = new Promise(function(e, t) {
					o.onload = e, o.onerror = t;
				}), np(a, "link", r), n.instance = a;
			}
			e.stylesheets === null && (e.stylesheets = /* @__PURE__ */ new Map()), e.stylesheets.set(n, t), (t = n.state.preload) && !(n.state.loading & 3) && (e.count++, n = nh.bind(e), t.addEventListener("load", n), t.addEventListener("error", n));
		}
	}
	var $m = 0;
	function eh(e, t) {
		return e.stylesheets && e.count === 0 && ah(e, e.stylesheets), 0 < e.count || 0 < e.imgCount ? function(n) {
			var r = setTimeout(function() {
				if (e.stylesheets && ah(e, e.stylesheets), e.unsuspend) {
					var t = e.unsuspend;
					e.unsuspend = null, t();
				}
			}, 6e4 + t);
			0 < e.imgBytes && $m === 0 && ($m = 62500 * op());
			var i = setTimeout(function() {
				if (e.waitingForImages = !1, e.count === 0 && (e.stylesheets && ah(e, e.stylesheets), e.unsuspend)) {
					var t = e.unsuspend;
					e.unsuspend = null, t();
				}
			}, (e.imgBytes > $m ? 50 : 800) + t);
			return e.unsuspend = n, function() {
				e.unsuspend = null, clearTimeout(r), clearTimeout(i);
			};
		} : null;
	}
	function th(e) {
		if (e.count === 0 && (e.imgCount === 0 || !e.waitingForImages)) {
			if (e.stylesheets) ah(e, e.stylesheets);
			else if (e.unsuspend) {
				var t = e.unsuspend;
				e.unsuspend = null, t();
			}
		}
	}
	function nh() {
		this.count--, th(this);
	}
	function rh() {
		this.imgCount--, th(this);
	}
	var ih = null;
	function ah(e, t) {
		e.stylesheets = null, e.unsuspend !== null && (e.count++, ih = /* @__PURE__ */ new Map(), t.forEach(oh, e), ih = null, nh.call(e));
	}
	function oh(e, t) {
		if (!(t.state.loading & 4)) {
			var n = ih.get(e);
			if (n) var r = n.get(null);
			else {
				n = /* @__PURE__ */ new Map(), ih.set(e, n);
				for (var i = e.querySelectorAll("link[data-precedence],style[data-precedence]"), a = 0; a < i.length; a++) {
					var o = i[a];
					(o.nodeName === "LINK" || o.getAttribute("media") !== "not all") && (n.set(o.dataset.precedence, o), r = o);
				}
				r && n.set(null, r);
			}
			i = t.instance, o = i.getAttribute("data-precedence"), a = n.get(o) || r, a === r && n.set(null, i), n.set(o, i), this.count++, r = nh.bind(this), i.addEventListener("load", r), i.addEventListener("error", r), a ? a.parentNode.insertBefore(i, a.nextSibling) : (e = e.nodeType === 9 ? e.head : e, e.insertBefore(i, e.firstChild)), t.state.loading |= 4;
		}
	}
	var sh = {
		$$typeof: E,
		Provider: null,
		Consumer: null,
		_currentValue: we,
		_currentValue2: we,
		_threadCount: 0
	};
	function ch(e, t, n, r, i, a, o, s, c) {
		this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = yt(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = yt(0), this.hiddenUpdates = yt(null), this.identifierPrefix = r, this.onUncaughtError = i, this.onCaughtError = a, this.onRecoverableError = o, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = c, this.transitionTypes = null, this.incompleteTransitions = /* @__PURE__ */ new Map();
	}
	function lh(e, t, n, r, i, a, o, s, c, l, u, d) {
		return e = new ch(e, t, n, o, c, l, u, d, s), t = 1, !0 === a && (t |= 24), a = zi(3, null, null, t), e.current = a, a.stateNode = e, t = Ia(), t.refCount++, e.pooledCache = t, t.refCount++, a.memoizedState = {
			element: r,
			isDehydrated: n,
			cache: t
		}, yo(a), e;
	}
	function uh(e) {
		return e ? (e = Li, e) : Li;
	}
	function dh(e, t, n, r, i, a) {
		i = uh(i), r.context === null ? r.context = i : r.pendingContext = i, r = xo(t), r.payload = { element: n }, a = a === void 0 ? null : a, a !== null && (r.callback = a), n = So(e, r, t), n !== null && (Pd(n, e, t), Co(n, e, t));
	}
	function fh(e, t) {
		if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
			var n = e.retryLane;
			e.retryLane = n !== 0 && n < t ? n : t;
		}
	}
	function ph(e, t) {
		fh(e, t), (e = e.alternate) && fh(e, t);
	}
	function mh(e) {
		if (e.tag === 13 || e.tag === 31) {
			var t = Pi(e, 67108864);
			t !== null && Pd(t, e, 67108864), ph(e, 67108864);
		}
	}
	function hh(e) {
		if (e.tag === 13 || e.tag === 31) {
			var t = jd();
			t = Tt(t);
			var n = Pi(e, t);
			n !== null && Pd(n, e, t), ph(e, t);
		}
	}
	var gh = !0;
	function _h(e, t, n, r) {
		var i = D.T;
		D.T = null;
		var a = O.p;
		try {
			O.p = 2, yh(e, t, n, r);
		} finally {
			O.p = a, D.T = i;
		}
	}
	function vh(e, t, n, r) {
		var i = D.T;
		D.T = null;
		var a = O.p;
		try {
			O.p = 8, yh(e, t, n, r);
		} finally {
			O.p = a, D.T = i;
		}
	}
	function yh(e, t, n, r) {
		if (gh) {
			var i = bh(r);
			if (i === null) Kf(e, t, r, xh, n), Mh(e, r);
			else if (Ph(i, e, t, n, r)) r.stopPropagation();
			else if (Mh(e, r), t & 4 && -1 < jh.indexOf(e)) {
				for (; i !== null;) {
					var a = Vt(i);
					if (a !== null) switch (a.tag) {
						case 3:
							if (a = a.stateNode, a.current.memoizedState.isDehydrated) {
								var o = mt(a.pendingLanes);
								if (o !== 0) {
									var s = a;
									for (s.pendingLanes |= 2, s.entangledLanes |= 2; o;) {
										var c = 1 << 31 - st(o);
										s.entanglements[1] |= c, o &= ~c;
									}
									Ef(a), !(G & 6) && (_d = Ye() + 500, Df(0, !1));
								}
							}
							break;
						case 31:
						case 13: s = Pi(a, 2), s !== null && Pd(s, a, 2), zd(), ph(a, 2);
					}
					if (a = bh(r), a === null && Kf(e, t, r, xh, n), a === i) break;
					i = a;
				}
				i !== null && r.stopPropagation();
			} else Kf(e, t, r, null, n);
		}
	}
	function bh(e) {
		return e = On(e), Sh(e);
	}
	var xh = null;
	function Sh(e) {
		if (xh = null, e = Bt(e), e !== null) {
			var t = o(e);
			if (t === null) e = null;
			else {
				var n = t.tag;
				if (n === 13) {
					if (e = s(t), e !== null) return e;
					e = null;
				} else if (n === 31) {
					if (e = c(t), e !== null) return e;
					e = null;
				} else if (n === 3) {
					if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
					e = null;
				} else t !== e && (e = null);
			}
		}
		return xh = e, null;
	}
	function Ch(e) {
		switch (e) {
			case "beforetoggle":
			case "cancel":
			case "click":
			case "close":
			case "contextmenu":
			case "copy":
			case "cut":
			case "auxclick":
			case "dblclick":
			case "dragend":
			case "dragstart":
			case "drop":
			case "focusin":
			case "focusout":
			case "input":
			case "invalid":
			case "keydown":
			case "keypress":
			case "keyup":
			case "mousedown":
			case "mouseup":
			case "paste":
			case "pause":
			case "play":
			case "pointercancel":
			case "pointerdown":
			case "pointerup":
			case "ratechange":
			case "reset":
			case "seeked":
			case "submit":
			case "toggle":
			case "touchcancel":
			case "touchend":
			case "touchstart":
			case "volumechange":
			case "change":
			case "selectionchange":
			case "textInput":
			case "compositionstart":
			case "compositionend":
			case "compositionupdate":
			case "beforeblur":
			case "afterblur":
			case "beforeinput":
			case "blur":
			case "fullscreenchange":
			case "fullscreenerror":
			case "focus":
			case "hashchange":
			case "popstate":
			case "select":
			case "selectstart": return 2;
			case "drag":
			case "dragenter":
			case "dragexit":
			case "dragleave":
			case "dragover":
			case "mousemove":
			case "mouseout":
			case "mouseover":
			case "pointermove":
			case "pointerout":
			case "pointerover":
			case "resize":
			case "scroll":
			case "touchmove":
			case "wheel":
			case "mouseenter":
			case "mouseleave":
			case "pointerenter":
			case "pointerleave": return 8;
			case "message": switch (Xe()) {
				case Ze: return 2;
				case Qe: return 8;
				case $e:
				case et: return 32;
				case tt: return 268435456;
				default: return 32;
			}
			default: return 32;
		}
	}
	var wh = !1, Th = null, Eh = null, Dh = null, Oh = /* @__PURE__ */ new Map(), kh = /* @__PURE__ */ new Map(), Ah = [], jh = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");
	function Mh(e, t) {
		switch (e) {
			case "focusin":
			case "focusout":
				Th = null;
				break;
			case "dragenter":
			case "dragleave":
				Eh = null;
				break;
			case "mouseover":
			case "mouseout":
				Dh = null;
				break;
			case "pointerover":
			case "pointerout":
				Oh.delete(t.pointerId);
				break;
			case "gotpointercapture":
			case "lostpointercapture": kh.delete(t.pointerId);
		}
	}
	function Nh(e, t, n, r, i, a) {
		return e === null || e.nativeEvent !== a ? (e = {
			blockedOn: t,
			domEventName: n,
			eventSystemFlags: r,
			nativeEvent: a,
			targetContainers: [i]
		}, t !== null && (t = Vt(t), t !== null && mh(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, i !== null && t.indexOf(i) === -1 && t.push(i), e);
	}
	function Ph(e, t, n, r, i) {
		switch (t) {
			case "focusin": return Th = Nh(Th, e, t, n, r, i), !0;
			case "dragenter": return Eh = Nh(Eh, e, t, n, r, i), !0;
			case "mouseover": return Dh = Nh(Dh, e, t, n, r, i), !0;
			case "pointerover":
				var a = i.pointerId;
				return Oh.set(a, Nh(Oh.get(a) || null, e, t, n, r, i)), !0;
			case "gotpointercapture": return a = i.pointerId, kh.set(a, Nh(kh.get(a) || null, e, t, n, r, i)), !0;
		}
		return !1;
	}
	function Fh(e) {
		var t = Bt(e.target);
		if (t !== null) {
			var n = o(t);
			if (n !== null) {
				if (t = n.tag, t === 13) {
					if (t = s(n), t !== null) {
						e.blockedOn = t, Ot(e.priority, function() {
							hh(n);
						});
						return;
					}
				} else if (t === 31) {
					if (t = c(n), t !== null) {
						e.blockedOn = t, Ot(e.priority, function() {
							hh(n);
						});
						return;
					}
				} else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
					e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
					return;
				}
			}
		}
		e.blockedOn = null;
	}
	function Ih(e) {
		if (e.blockedOn !== null) return !1;
		for (var t = e.targetContainers; 0 < t.length;) {
			var n = bh(e.nativeEvent);
			if (n === null) {
				n = e.nativeEvent;
				var r = new n.constructor(n.type, n);
				Dn = r, n.target.dispatchEvent(r), Dn = null;
			} else return t = Vt(n), t !== null && mh(t), e.blockedOn = n, !1;
			t.shift();
		}
		return !0;
	}
	function Lh(e, t, n) {
		Ih(e) && n.delete(t);
	}
	function Rh() {
		wh = !1, Th !== null && Ih(Th) && (Th = null), Eh !== null && Ih(Eh) && (Eh = null), Dh !== null && Ih(Dh) && (Dh = null), Oh.forEach(Lh), kh.forEach(Lh);
	}
	function zh(e, n) {
		e.blockedOn === n && (e.blockedOn = null, wh || (wh = !0, t.unstable_scheduleCallback(t.unstable_NormalPriority, Rh)));
	}
	var Bh = null;
	function Vh(e) {
		Bh !== e && (Bh = e, t.unstable_scheduleCallback(t.unstable_NormalPriority, function() {
			Bh === e && (Bh = null);
			for (var t = 0; t < e.length; t += 3) {
				var n = e[t], r = e[t + 1], i = e[t + 2];
				if (typeof r != "function") {
					if (Sh(r || n) === null) continue;
					break;
				}
				var a = Vt(n);
				a !== null && (e.splice(t, 3), t -= 3, nc(a, {
					pending: !0,
					data: i,
					method: n.method,
					action: r
				}, r, i));
			}
		}));
	}
	function Hh(e) {
		function t(t) {
			return zh(t, e);
		}
		Th !== null && zh(Th, e), Eh !== null && zh(Eh, e), Dh !== null && zh(Dh, e), Oh.forEach(t), kh.forEach(t);
		for (var n = 0; n < Ah.length; n++) {
			var r = Ah[n];
			r.blockedOn === e && (r.blockedOn = null);
		}
		for (; 0 < Ah.length && (n = Ah[0], n.blockedOn === null);) Fh(n), n.blockedOn === null && Ah.shift();
		if (n = (e.ownerDocument || e).$$reactFormReplay, n != null) for (r = 0; r < n.length; r += 3) {
			var i = n[r], a = n[r + 1], o = i[jt] || null;
			if (typeof a == "function") o || Vh(n);
			else if (o) {
				var s = null;
				if (a && a.hasAttribute("formAction")) {
					if (i = a, o = a[jt] || null) s = o.formAction;
					else if (Sh(i) !== null) continue;
				} else s = o.action;
				typeof s == "function" ? n[r + 1] = s : (n.splice(r, 3), r -= 3), Vh(n);
			}
		}
	}
	function Uh() {
		function e(e) {
			e.canIntercept && e.info === "react-transition" && e.intercept({
				handler: function() {
					return new Promise(function(e) {
						return i = e;
					});
				},
				focusReset: "manual",
				scroll: "manual"
			});
		}
		function t() {
			i !== null && (i(), i = null), r || setTimeout(n, 20);
		}
		function n() {
			if (!r && !navigation.transition) {
				var e = navigation.currentEntry;
				e && e.url != null && navigation.navigate(e.url, {
					state: e.getState(),
					info: "react-transition",
					history: "replace"
				});
			}
		}
		if (typeof navigation == "object") {
			var r = !1, i = null;
			return navigation.addEventListener("navigate", e), navigation.addEventListener("navigatesuccess", t), navigation.addEventListener("navigateerror", t), setTimeout(n, 100), function() {
				r = !0, navigation.removeEventListener("navigate", e), navigation.removeEventListener("navigatesuccess", t), navigation.removeEventListener("navigateerror", t), i !== null && (i(), i = null);
			};
		}
	}
	function Wh(e) {
		this._internalRoot = e;
	}
	Gh.prototype.render = Wh.prototype.render = function(e) {
		var t = this._internalRoot;
		if (t === null) throw Error(i(409));
		var n = t.current;
		dh(n, jd(), e, t, null, null);
	}, Gh.prototype.unmount = Wh.prototype.unmount = function() {
		var e = this._internalRoot;
		if (e !== null) {
			this._internalRoot = null;
			var t = e.containerInfo;
			dh(e.current, 2, null, e, null, null), zd(), t[Mt] = null;
		}
	};
	function Gh(e) {
		this._internalRoot = e;
	}
	Gh.prototype.unstable_scheduleHydration = function(e) {
		if (e) {
			var t = Dt();
			e = {
				blockedOn: null,
				target: e,
				priority: t
			};
			for (var n = 0; n < Ah.length && t !== 0 && t < Ah[n].priority; n++);
			Ah.splice(n, 0, e), n === 0 && Fh(e);
		}
	};
	var Kh = n.version;
	if (Kh !== "19.3.1") throw Error(i(527, Kh, "19.3.1"));
	O.findDOMNode = function(e) {
		var t = e._reactInternals;
		if (t === void 0) throw typeof e.render == "function" ? Error(i(188)) : (e = Object.keys(e).join(","), Error(i(268, e)));
		return e = d(t), e = e === null ? null : p(e), e = e === null ? null : e.stateNode, e;
	};
	var qh = {
		bundleType: 0,
		version: "19.3.1",
		rendererPackageName: "react-dom",
		currentDispatcherRef: D,
		reconcilerVersion: "19.3.1"
	};
	if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
		var Jh = __REACT_DEVTOOLS_GLOBAL_HOOK__;
		if (!Jh.isDisabled && Jh.supportsFiber) try {
			it = Jh.inject(qh), at = Jh;
		} catch {}
	}
	e.createRoot = function(e, t) {
		if (!a(e)) throw Error(i(299));
		var n = !1, r = "", o = Tc, s = Ec, c = Dc;
		return t != null && (!0 === t.unstable_strictMode && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onUncaughtError !== void 0 && (o = t.onUncaughtError), t.onCaughtError !== void 0 && (s = t.onCaughtError), t.onRecoverableError !== void 0 && (c = t.onRecoverableError)), t = lh(e, 1, !1, null, null, n, r, null, o, s, c, Uh), e[Mt] = t.current, Wf(e), new Wh(t);
	}, e.hydrateRoot = function(e, t, n) {
		if (!a(e)) throw Error(i(299));
		var r = !1, o = "", s = Tc, c = Ec, l = Dc, u = null;
		return n != null && (!0 === n.unstable_strictMode && (r = !0), n.identifierPrefix !== void 0 && (o = n.identifierPrefix), n.onUncaughtError !== void 0 && (s = n.onUncaughtError), n.onCaughtError !== void 0 && (c = n.onCaughtError), n.onRecoverableError !== void 0 && (l = n.onRecoverableError), n.formState !== void 0 && (u = n.formState)), t = lh(e, 1, !0, t, n ?? null, r, o, u, s, c, l, Uh), t.context = uh(null), n = t.current, r = jd(), r = Tt(r), o = xo(r), o.callback = null, So(n, o, r), n = r, t.current.lanes = n, bt(t, n), Ef(t), e[Mt] = t.current, Wf(e), new Gh(t);
	};
})), g = /* @__PURE__ */ o(((e, t) => {
	function n() {
		if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE == "function") try {
			__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
		} catch (e) {
			console.error(e);
		}
	}
	n(), t.exports = h();
})), _ = /* @__PURE__ */ c(f(), 1), v = g(), y = Object.defineProperty, b = (e, t) => y(e, "name", {
	value: t,
	configurable: !0
}), ee = !!(typeof window < "u" && window.document && window.document.createElement);
function x(e, t, { checkForDefaultPrevented: n = !0 } = {}) {
	return /* @__PURE__ */ b(function(r) {
		if (e?.(r), n === !1 || !r || !r.defaultPrevented) return t?.(r);
	}, "handleEvent");
}
b(x, "composeEventHandlers");
function te(e) {
	if (!ee) throw Error("Cannot access window outside of the DOM");
	return e?.ownerDocument?.defaultView ?? window;
}
b(te, "getOwnerWindow");
function ne(e) {
	if (!ee) throw Error("Cannot access document outside of the DOM");
	return e?.ownerDocument ?? document;
}
b(ne, "getOwnerDocument");
function S(e, t = !1) {
	let { activeElement: n } = ne(e);
	if (!n?.nodeName) return null;
	if (re(n) && n.contentDocument) return S(n.contentDocument.body, t);
	if (t) {
		let e = n.getAttribute("aria-activedescendant");
		if (e) {
			let t = ne(n).getElementById(e);
			if (t) return t;
		}
	}
	return n;
}
b(S, "getActiveElement");
function re(e) {
	return e.tagName === "IFRAME";
}
b(re, "isFrame");
// node_modules/@radix-ui/react-compose-refs/dist/index.mjs
var C = Object.defineProperty, ie = (e, t) => C(e, "name", {
	value: t,
	configurable: !0
});
function ae(e, t) {
	if (typeof e == "function") return e(t);
	e != null && (e.current = t);
}
ie(ae, "setRef");
function oe(...e) {
	return (t) => {
		let n = !1, r = e.map((e) => {
			let r = ae(e, t);
			return !n && typeof r == "function" && (n = !0), r;
		});
		if (n) return () => {
			for (let t = 0; t < r.length; t++) {
				let n = r[t];
				typeof n == "function" ? n() : ae(e[t], null);
			}
		};
	};
}
ie(oe, "composeRefs");
function w(...e) {
	return _.useCallback(oe(...e), e);
}
ie(w, "useComposedRefs");
// node_modules/react/cjs/react-jsx-runtime.production.js
var se = /* @__PURE__ */ o(((e) => {
	var t = Symbol.for("react.transitional.element"), n = Symbol.for("react.fragment");
	function r(e, n, r) {
		var i = null;
		if (r !== void 0 && (i = "" + r), n.key !== void 0 && (i = "" + n.key), "key" in n) for (var a in r = {}, n) a !== "key" && (r[a] = n[a]);
		else r = n;
		return n = r.ref, {
			$$typeof: t,
			type: e,
			key: i,
			ref: n === void 0 ? null : n,
			props: r
		};
	}
	e.Fragment = n, e.jsx = r, e.jsxs = r;
})), T = (/* @__PURE__ */ o(((e, t) => {
	t.exports = se();
})))(), ce = Object.defineProperty, E = (e, t) => ce(e, "name", {
	value: t,
	configurable: !0
});
// @__NO_SIDE_EFFECTS__
function le(e, t) {
	let n = _.createContext(t);
	n.displayName = e + "Context";
	let r = /* @__PURE__ */ E((e) => {
		let { children: t, ...r } = e, i = _.useMemo(() => r, Object.values(r));
		return /* @__PURE__ */ (0, T.jsx)(n.Provider, {
			value: i,
			children: t
		});
	}, "Provider");
	r.displayName = e + "Provider";
	function i(r, i = {}) {
		let { optional: a = !1 } = i, o = _.useContext(n);
		if (o) return o;
		if (t !== void 0) return t;
		if (!a) throw Error(`\`${r}\` must be used within \`${e}\``);
	}
	return E(i, "useContext"), [r, i];
}
E(le, "createContext");
// @__NO_SIDE_EFFECTS__
function ue(e, t = []) {
	let n = [];
	function r(t, r) {
		let i = _.createContext(r);
		i.displayName = t + "Context";
		let a = n.length;
		n = [...n, r];
		let o = /* @__PURE__ */ E((t) => {
			let { scope: n, children: r, ...o } = t, s = n?.[e]?.[a] || i, c = _.useMemo(() => o, Object.values(o));
			return /* @__PURE__ */ (0, T.jsx)(s.Provider, {
				value: c,
				children: r
			});
		}, "Provider");
		o.displayName = t + "Provider";
		function s(n, o, s = {}) {
			let { optional: c = !1 } = s, l = o?.[e]?.[a] || i, u = _.useContext(l);
			if (u) return u;
			if (r !== void 0) return r;
			if (!c) throw Error(`\`${n}\` must be used within \`${t}\``);
		}
		return E(s, "useContext"), [o, s];
	}
	E(r, "createContext");
	let i = /* @__PURE__ */ E(() => {
		let t = n.map((e) => _.createContext(e));
		return /* @__PURE__ */ E(function(n) {
			let r = n?.[e] || t;
			return _.useMemo(() => ({ [`__scope${e}`]: {
				...n,
				[e]: r
			} }), [n, r]);
		}, "useScope");
	}, "createScope");
	return i.scopeName = e, [r, de(i, ...t)];
}
E(ue, "createContextScope");
function de(...e) {
	let t = e[0];
	if (e.length === 1) return t;
	let n = /* @__PURE__ */ E(() => {
		let n = e.map((e) => ({
			useScope: e(),
			scopeName: e.scopeName
		}));
		return /* @__PURE__ */ E(function(e) {
			let r = n.reduce((t, { useScope: n, scopeName: r }) => {
				let i = n(e)[`__scope${r}`];
				return {
					...t,
					...i
				};
			}, {});
			return _.useMemo(() => ({ [`__scope${t.scopeName}`]: r }), [r]);
		}, "useComposedScopes");
	}, "createScope");
	return n.scopeName = t.scopeName, n;
}
E(de, "composeContextScopes");
// node_modules/@radix-ui/react-use-layout-effect/dist/index.mjs
var fe = globalThis?.document ? _.useLayoutEffect : () => {}, pe = Object.defineProperty, me = (e, t) => pe(e, "name", {
	value: t,
	configurable: !0
}), he = _.useId || (() => void 0), ge = 0;
function _e(e) {
	let [t, n] = _.useState(he());
	return fe(() => {
		e || n((e) => e ?? String(ge++));
	}, [e]), e || (t ? `radix-${t}` : "");
}
me(_e, "useId");
// node_modules/@radix-ui/react-use-effect-event/dist/index.mjs
var ve = Object.defineProperty, ye = (e, t) => ve(e, "name", {
	value: t,
	configurable: !0
}), be = _.useEffectEvent, xe = _.useInsertionEffect;
function Se(e) {
	if (typeof be == "function") return be(e);
	let t = _.useRef(() => {
		throw Error("Cannot call an event handler while rendering.");
	});
	return typeof xe == "function" ? xe(() => {
		t.current = e;
	}) : fe(() => {
		t.current = e;
	}), _.useMemo(() => ((...e) => t.current?.(...e)), []);
}
ye(Se, "useEffectEvent");
// node_modules/@radix-ui/react-use-controllable-state/dist/index.mjs
var Ce = Object.defineProperty, D = (e, t) => Ce(e, "name", {
	value: t,
	configurable: !0
}), O = _.useInsertionEffect || fe;
function we({ prop: e, defaultProp: t, onChange: n = /* @__PURE__ */ D(() => {}, "onChange"), caller: r }) {
	let [i, a, o] = Te({
		defaultProp: t,
		onChange: n
	}), s = e !== void 0;
	return [s ? e : i, _.useCallback((t) => {
		if (s) {
			let n = Ee(t) ? t(e) : t;
			n !== e && o.current?.(n);
		} else a(t);
	}, [
		s,
		e,
		a,
		o
	])];
}
D(we, "useControllableState");
function Te({ defaultProp: e, onChange: t }) {
	let [n, r] = _.useState(e), i = _.useRef(n), a = _.useRef(t);
	return O(() => {
		a.current = t;
	}, [t]), _.useEffect(() => {
		i.current !== n && (a.current?.(n), i.current = n);
	}, [n, i]), [
		n,
		r,
		a
	];
}
D(Te, "useUncontrolledState");
function Ee(e) {
	return typeof e == "function";
}
D(Ee, "isFunction");
var De = Symbol("RADIX:SYNC_STATE");
function Oe(e, t, n, r) {
	let { prop: i, defaultProp: a, onChange: o, caller: s } = t, c = i !== void 0, l = Se(o), u = [{
		...n,
		state: a
	}];
	r && u.push(r);
	let [d, f] = _.useReducer((t, n) => {
		if (n.type === De) return {
			...t,
			state: n.state
		};
		let r = e(t, n);
		return c && !Object.is(r.state, t.state) && l(r.state), r;
	}, ...u), p = d.state, m = _.useRef(p);
	_.useEffect(() => {
		m.current !== p && (m.current = p, c || l(p));
	}, [
		p,
		m,
		c
	]);
	let h = _.useMemo(() => i === void 0 ? d : {
		...d,
		state: i
	}, [d, i]);
	return _.useEffect(() => {
		c && !Object.is(i, d.state) && f({
			type: De,
			state: i
		});
	}, [
		i,
		d.state,
		c
	]), [h, f];
}
D(Oe, "useControllableStateReducer");
// node_modules/@radix-ui/react-slot/dist/index.mjs
var k = /* @__PURE__ */ c(m(), 1), ke = Object.defineProperty, Ae = (e, t) => ke(e, "name", {
	value: t,
	configurable: !0
});
// @__NO_SIDE_EFFECTS__
function je(e) {
	let t = _.forwardRef((t, n) => {
		let { children: r, ...i } = t, a = null, o = !1, s = [];
		r = Ve(r), _.Children.forEach(r, (e) => {
			if (Le(e)) {
				o = !0;
				let t = e, n = "child" in t.props ? t.props.child : t.props.children;
				for (; ze(n) && typeof Ge == "function";) n = Ge(n._payload);
				a = Pe(t, n), s.push(a?.props?.children);
			} else s.push(e);
		}), a ? a = _.cloneElement(a, void 0, s) : !o && _.Children.count(r) === 1 && _.isValidElement(r) && (a = r);
		let c = a ? Ie(a) : void 0, l = w(n, c);
		if (!a) {
			if (r || r === 0) throw Error(o ? We(e) : Ue(e));
			return r;
		}
		let u = Fe(i, a.props ?? {});
		return a.type !== _.Fragment && (u.ref = n ? l : c), _.cloneElement(a, u);
	});
	return t.displayName = `${e}.Slot`, t;
}
Ae(je, "createSlot");
var Me = Symbol.for("radix.slottable");
// @__NO_SIDE_EFFECTS__
function Ne(e) {
	let t = /* @__PURE__ */ Ae((e) => "child" in e ? e.children(e.child) : e.children, "Slottable");
	return t.displayName = `${e}.Slottable`, t.__radixId = Me, t;
}
Ae(Ne, "createSlottable");
var Pe = /* @__PURE__ */ Ae((e, t) => "child" in e.props ? _.isValidElement(t) ? _.cloneElement(t, void 0, e.props.children(t.props.children)) : null : _.isValidElement(t) ? t : null, "getSlottableElementFromSlottable");
function Fe(e, t) {
	let n = { ...t };
	for (let r in t) {
		let i = e[r], a = t[r];
		/^on[A-Z]/.test(r) ? i && a ? n[r] = (...e) => {
			let t = a(...e);
			return i(...e), t;
		} : i && (n[r] = i) : r === "style" ? n[r] = {
			...i,
			...a
		} : r === "className" ? n[r] = [i, a].filter(Boolean).join(" ") : r === "aria-describedby" && (n[r] = He(a, i));
	}
	return {
		...e,
		...n
	};
}
Ae(Fe, "mergeProps");
function Ie(e) {
	let t = Object.getOwnPropertyDescriptor(e.props, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning;
	return n ? e.ref : (t = Object.getOwnPropertyDescriptor(e, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning, n ? e.props.ref : e.props.ref || e.ref);
}
Ae(Ie, "getElementRef");
function Le(e) {
	return _.isValidElement(e) && typeof e.type == "function" && "__radixId" in e.type && e.type.__radixId === Me;
}
Ae(Le, "isSlottable");
var Re = Symbol.for("react.lazy");
function ze(e) {
	return typeof e == "object" && !!e && "$$typeof" in e && e.$$typeof === Re && "_payload" in e && Be(e._payload);
}
Ae(ze, "isLazyComponent");
function Be(e) {
	return typeof e == "object" && !!e && "then" in e;
}
Ae(Be, "isPromiseLike");
function Ve(e) {
	let t = e;
	for (; ze(t) && typeof Ge == "function";) t = Ge(t._payload);
	return t;
}
Ae(Ve, "useUnwrappedLazy");
function He(...e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e) if (typeof n == "string") for (let e of String(n).trim().split(/\s+/)) e && t.add(e);
	return t.size > 0 ? Array.from(t).join(" ") : void 0;
}
Ae(He, "concatAriaDescribedby");
var Ue = /* @__PURE__ */ Ae((e) => `${e} failed to slot onto its children. Expected a single React element child or \`Slottable\`.`, "createSlotError"), We = /* @__PURE__ */ Ae((e) => `${e} failed to slot onto its \`Slottable\`. Expected \`Slottable\` to receive a single React element child.`, "createSlottableError"), Ge = _.use, Ke = Object.defineProperty, qe = (e, t) => Ke(e, "name", {
	value: t,
	configurable: !0
}), Je = [
	"a",
	"button",
	"div",
	"form",
	"h2",
	"h3",
	"img",
	"input",
	"label",
	"li",
	"nav",
	"ol",
	"p",
	"select",
	"span",
	"svg",
	"ul"
].reduce((e, t) => {
	let n = /* @__PURE__ */ je(`Primitive.${t}`), r = _.forwardRef((e, r) => {
		let { asChild: i, ...a } = e, o = i ? n : t;
		return typeof window < "u" && (window[Symbol.for("radix-ui")] = !0), /* @__PURE__ */ (0, T.jsx)(o, {
			...a,
			ref: r
		});
	});
	return r.displayName = `Primitive.${t}`, {
		...e,
		[t]: r
	};
}, {});
function Ye(e, t) {
	e && k.flushSync(() => e.dispatchEvent(t));
}
qe(Ye, "dispatchDiscreteCustomEvent");
// node_modules/@radix-ui/react-use-callback-ref/dist/index.mjs
var Xe = Object.defineProperty, Ze = (e, t) => Xe(e, "name", {
	value: t,
	configurable: !0
}), Qe = _.useInsertionEffect;
function $e(e) {
	let t = _.useRef(e);
	return typeof Qe == "function" ? Qe(() => {
		t.current = e;
	}) : fe(() => {
		t.current = e;
	}), _.useMemo(() => ((...e) => t.current?.(...e)), []);
}
Ze($e, "useCallbackRef");
// node_modules/@radix-ui/react-dismissable-layer/dist/index.mjs
var et = Object.defineProperty, tt = (e, t) => et(e, "name", {
	value: t,
	configurable: !0
}), nt = "dismissableLayer.update", rt = "dismissableLayer.pointerDownOutside", it = "dismissableLayer.focusOutside", at, ot = _.createContext({
	layers: /* @__PURE__ */ new Set(),
	layersWithOutsidePointerEventsDisabled: /* @__PURE__ */ new Set(),
	branches: /* @__PURE__ */ new Set(),
	dismissableSurfaces: /* @__PURE__ */ new Set()
}), st = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ tt(function(e, t) {
	let { disableOutsidePointerEvents: n = !1, deferPointerDownOutside: r = !1, onEscapeKeyDown: i, onPointerDownOutside: a, onFocusOutside: o, onInteractOutside: s, onDismiss: c, ...l } = e, u = _.useContext(ot), [d, f] = _.useState(null), p = d?.ownerDocument ?? globalThis?.document, [, m] = _.useState({}), h = w(t, f), g = Array.from(u.layers), [v] = [...u.layersWithOutsidePointerEventsDisabled].slice(-1), y = v ? g.indexOf(v) : -1, b = d ? g.indexOf(d) : -1, ee = u.layersWithOutsidePointerEventsDisabled.size > 0, te = b >= y, ne = _.useRef(!1), S = ut((e) => {
		a?.(e), s?.(e), e.defaultPrevented || c?.();
	}, {
		ownerDocument: p,
		deferPointerDownOutside: r,
		isDeferredPointerDownOutsideRef: ne,
		dismissableSurfaces: u.dismissableSurfaces,
		shouldHandlePointerDownOutside: _.useCallback((e) => {
			if (!(e instanceof Node)) return !1;
			let t = [...u.branches].some((t) => t.contains(e));
			return te && !t;
		}, [u.branches, te])
	}), re = dt((e) => {
		if (r && ne.current) return;
		let t = e.target;
		[...u.branches].some((e) => e.contains(t)) || (o?.(e), s?.(e), e.defaultPrevented || c?.());
	}, p), C = d ? b === g.length - 1 : !1, ie = $e((e) => {
		e.key === "Escape" && (i?.(e), !e.defaultPrevented && c && (e.preventDefault(), c()));
	});
	return _.useEffect(() => {
		if (C) return p.addEventListener("keydown", ie, { capture: !0 }), () => p.removeEventListener("keydown", ie, { capture: !0 });
	}, [
		p,
		C,
		ie
	]), _.useEffect(() => {
		if (d) return n && (u.layersWithOutsidePointerEventsDisabled.size === 0 && (at = p.body.style.pointerEvents, p.body.style.pointerEvents = "none"), u.layersWithOutsidePointerEventsDisabled.add(d)), u.layers.add(d), ft(), () => {
			n && (u.layersWithOutsidePointerEventsDisabled.delete(d), u.layersWithOutsidePointerEventsDisabled.size === 0 && (p.body.style.pointerEvents = at));
		};
	}, [
		d,
		p,
		n,
		u
	]), _.useEffect(() => () => {
		d && (u.layers.delete(d), u.layersWithOutsidePointerEventsDisabled.delete(d), ft());
	}, [d, u]), _.useEffect(() => {
		let e = /* @__PURE__ */ tt(() => m({}), "handleUpdate");
		return document.addEventListener(nt, e), () => document.removeEventListener(nt, e);
	}, []), /* @__PURE__ */ (0, T.jsx)(Je.div, {
		...l,
		ref: h,
		style: {
			pointerEvents: ee ? te ? "auto" : "none" : void 0,
			...e.style
		},
		onFocusCapture: x(e.onFocusCapture, re.onFocusCapture),
		onBlurCapture: x(e.onBlurCapture, re.onBlurCapture),
		onPointerDownCapture: x(e.onPointerDownCapture, S.onPointerDownCapture)
	});
}, "DismissableLayer"));
function ct() {
	let e = _.useContext(ot), [t, n] = _.useState(null);
	return _.useEffect(() => {
		if (t) return e.dismissableSurfaces.add(t), () => {
			e.dismissableSurfaces.delete(t);
		};
	}, [t, e.dismissableSurfaces]), n;
}
tt(ct, "useDismissableLayerSurface");
var lt = /* @__PURE__ */ tt(() => !0, "IS_TRUE");
function ut(e, t) {
	let { ownerDocument: n = globalThis?.document, deferPointerDownOutside: r = !1, isDeferredPointerDownOutsideRef: i, dismissableSurfaces: a, shouldHandlePointerDownOutside: o = lt } = t, s = $e(e), c = _.useRef(!1), l = _.useRef(!1), u = _.useRef(/* @__PURE__ */ new Map()), d = _.useRef(() => {});
	return _.useEffect(() => {
		function e() {
			l.current = !1, i.current = !1, u.current.clear();
		}
		tt(e, "resetOutsideInteraction");
		function t() {
			return Array.from(u.current.values()).some(Boolean);
		}
		tt(t, "isOutsideInteractionIntercepted");
		function f(e) {
			if (!l.current) return;
			let t = e.target;
			t instanceof Node && [...a].some((e) => e.contains(t)) || u.current.set(e.type, !0), e.type === "click" && window.setTimeout(() => {
				l.current && d.current();
			}, 0);
		}
		tt(f, "handleInteractionCapture");
		function p(e) {
			l.current && u.current.set(e.type, !1);
		}
		tt(p, "handleInteractionBubble");
		let m = /* @__PURE__ */ tt((a) => {
			if (a.target && !c.current) {
				let f = function() {
					n.removeEventListener("click", d.current);
					let r = t();
					e(), r || pt(rt, s, p, { discrete: !0 });
				};
				if (tt(f, "handleAndDispatchPointerDownOutsideEvent"), !o(a.target)) {
					n.removeEventListener("click", d.current), e(), c.current = !1;
					return;
				}
				let p = { originalEvent: a };
				l.current = !0, i.current = r && a.button === 0, u.current.clear(), !r || a.button !== 0 ? f() : (n.removeEventListener("click", d.current), d.current = f, n.addEventListener("click", d.current, { once: !0 }));
			} else n.removeEventListener("click", d.current), e();
			c.current = !1;
		}, "handlePointerDown"), h = [
			"pointerup",
			"mousedown",
			"mouseup",
			"touchstart",
			"touchend",
			"click"
		];
		for (let e of h) n.addEventListener(e, f, !0), n.addEventListener(e, p);
		let g = window.setTimeout(() => {
			n.addEventListener("pointerdown", m);
		}, 0);
		return () => {
			window.clearTimeout(g), n.removeEventListener("pointerdown", m), n.removeEventListener("click", d.current);
			for (let e of h) n.removeEventListener(e, f, !0), n.removeEventListener(e, p);
		};
	}, [
		n,
		s,
		r,
		i,
		a,
		o
	]), { onPointerDownCapture: /* @__PURE__ */ tt(() => c.current = !0, "onPointerDownCapture") };
}
tt(ut, "usePointerDownOutside");
function dt(e, t = globalThis?.document) {
	let n = $e(e), r = _.useRef(!1);
	return _.useEffect(() => {
		let e = /* @__PURE__ */ tt((e) => {
			e.target && !r.current && pt(it, n, { originalEvent: e }, { discrete: !1 });
		}, "handleFocus");
		return t.addEventListener("focusin", e), () => t.removeEventListener("focusin", e);
	}, [t, n]), {
		onFocusCapture: /* @__PURE__ */ tt(() => r.current = !0, "onFocusCapture"),
		onBlurCapture: /* @__PURE__ */ tt(() => r.current = !1, "onBlurCapture")
	};
}
tt(dt, "useFocusOutside");
function ft() {
	let e = new CustomEvent(nt);
	document.dispatchEvent(e);
}
tt(ft, "dispatchUpdate");
function pt(e, t, n, { discrete: r }) {
	let i = n.originalEvent.target, a = new CustomEvent(e, {
		bubbles: !1,
		cancelable: !0,
		detail: n
	});
	t && i.addEventListener(e, t, { once: !0 }), r ? Ye(i, a) : i.dispatchEvent(a);
}
tt(pt, "handleAndDispatchCustomEvent");
// node_modules/@radix-ui/react-focus-scope/dist/index.mjs
var mt = Object.defineProperty, A = (e, t) => mt(e, "name", {
	value: t,
	configurable: !0
}), ht = "focusScope.autoFocusOnMount", gt = "focusScope.autoFocusOnUnmount", _t = {
	bubbles: !1,
	cancelable: !0
}, vt = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ A(function(e, t) {
	let { loop: n = !1, trapped: r = !1, branches: i, onMountAutoFocus: a, onUnmountAutoFocus: o, ...s } = e, [c, l] = _.useState(null), u = $e(a), d = $e(o), f = _.useRef(null), p = w(t, l), m = _.useRef(i);
	_.useEffect(() => {
		m.current = i;
	});
	let h = _.useCallback((e) => e ? c?.contains(e) ? !0 : !!m.current?.some((t) => t.contains(e)) : !1, [c]), g = _.useRef({
		paused: !1,
		pause() {
			this.paused = !0;
		},
		resume() {
			this.paused = !1;
		}
	}).current;
	_.useEffect(() => {
		if (r) {
			let e = function(e) {
				if (g.paused || !c) return;
				let t = e.target;
				h(t) ? f.current = t : kt(f.current, { select: !0 });
			}, t = function(e) {
				if (g.paused || !c) return;
				let t = e.relatedTarget;
				t !== null && (h(t) || kt(f.current, { select: !0 }));
			}, n = function(e) {
				if (document.activeElement === document.body) for (let t of e) t.removedNodes.length > 0 && kt(c);
			};
			A(e, "handleFocusIn"), A(t, "handleFocusOut"), A(n, "handleMutations"), document.addEventListener("focusin", e), document.addEventListener("focusout", t);
			let r = new MutationObserver(n);
			return c && r.observe(c, {
				childList: !0,
				subtree: !0
			}), () => {
				document.removeEventListener("focusin", e), document.removeEventListener("focusout", t), r.disconnect();
			};
		}
	}, [
		r,
		c,
		g.paused,
		h
	]), _.useEffect(() => {
		if (c) {
			At.add(g);
			let e = document.activeElement;
			if (!c.contains(e)) {
				let t = new CustomEvent(ht, _t);
				c.addEventListener(ht, u), c.dispatchEvent(t), t.defaultPrevented || (Ct(Nt(Tt(c)), { select: !0 }), document.activeElement === e && kt(c));
			}
			return () => {
				c.removeEventListener(ht, u);
				let t = c.ownerDocument, n = CustomEvent;
				setTimeout(() => {
					let r = new n(gt, _t);
					c.addEventListener(gt, d), c.dispatchEvent(r), r.defaultPrevented || kt(e ?? t.body, { select: !0 }), c.removeEventListener(gt, d), At.remove(g);
				}, 0);
			};
		}
	}, [
		c,
		u,
		d,
		g
	]);
	let v = _.useCallback((e) => {
		if (!n && !r || g.paused) return;
		let t = e.key === "Tab" && !e.altKey && !e.ctrlKey && !e.metaKey, i = document.activeElement;
		if (t && i) {
			let t = e.currentTarget, [r, a] = wt(t);
			r && a ? !e.shiftKey && i === a ? (e.preventDefault(), n && kt(r, { select: !0 })) : e.shiftKey && i === r && (e.preventDefault(), n && kt(a, { select: !0 })) : i === t && e.preventDefault();
		}
	}, [
		n,
		r,
		g.paused
	]);
	return /* @__PURE__ */ (0, T.jsx)(Je.div, {
		tabIndex: -1,
		...s,
		ref: p,
		onKeyDown: v
	});
}, "FocusScope")), yt = _.createContext(null);
function bt({ registry: e, children: t }) {
	return e ? /* @__PURE__ */ (0, T.jsx)(yt.Provider, {
		value: e,
		children: t
	}) : t;
}
A(bt, "FocusScopeBranchProvider");
function xt() {
	let [e, t] = _.useState([]);
	return {
		nodes: e,
		registry: _.useMemo(() => ({
			add: /* @__PURE__ */ A((e) => t((t) => t.includes(e) ? t : [...t, e]), "add"),
			remove: /* @__PURE__ */ A((e) => t((t) => t.filter((t) => t !== e)), "remove")
		}), [])
	};
}
A(xt, "useFocusScopeBranchRegistry");
function St(e) {
	let t = _.useContext(yt);
	_.useEffect(() => {
		if (e && t) return t.add(e), () => t.remove(e);
	}, [e, t]);
}
A(St, "useFocusScopeBranch");
function Ct(e, { select: t = !1 } = {}) {
	let n = document.activeElement;
	for (let r of e) if (kt(r, { select: t }), document.activeElement !== n) return;
}
A(Ct, "focusFirst");
function wt(e) {
	let t = Tt(e);
	return [Et(t, e), Et(t.reverse(), e)];
}
A(wt, "getTabbableEdges");
function Tt(e) {
	let t = [], n = e.ownerDocument.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, { acceptNode: /* @__PURE__ */ A((e) => {
		let t = e.tagName === "INPUT" && e.type === "hidden";
		return e.disabled || e.hidden || t ? NodeFilter.FILTER_SKIP : e.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
	}, "acceptNode") });
	for (; n.nextNode();) t.push(n.currentNode);
	return t;
}
A(Tt, "getTabbableCandidates");
function Et(e, t) {
	let n = typeof t.checkVisibility == "function" && t.checkVisibility({ checkVisibilityCSS: !0 });
	for (let r of e) if (!(n ? !r.checkVisibility({ checkVisibilityCSS: !0 }) : Dt(r, { upTo: t }))) return r;
}
A(Et, "findVisible");
function Dt(e, { upTo: t }) {
	if (getComputedStyle(e).visibility === "hidden") return !0;
	for (; e;) {
		if (t !== void 0 && e === t) return !1;
		if (getComputedStyle(e).display === "none") return !0;
		e = e.parentElement;
	}
	return !1;
}
A(Dt, "isHidden");
function Ot(e) {
	return e.tagName === "INPUT" && typeof e.select == "function";
}
A(Ot, "isSelectableInput");
function kt(e, { select: t = !1 } = {}) {
	if (e && e.focus) {
		let n = (e.ownerDocument ?? document).activeElement;
		e.focus({ preventScroll: !0 }), e !== n && Ot(e) && t && e.select();
	}
}
A(kt, "focus");
var At = jt();
function jt() {
	let e = [];
	return {
		add(t) {
			let n = e[0];
			t !== n && n?.pause(), e = Mt(e, t), e.unshift(t);
		},
		remove(t) {
			e = Mt(e, t), e[0]?.resume();
		}
	};
}
A(jt, "createFocusScopesStack");
function Mt(e, t) {
	let n = [...e], r = n.indexOf(t);
	return r !== -1 && n.splice(r, 1), n;
}
A(Mt, "arrayRemove");
function Nt(e) {
	return e.filter((e) => e.tagName !== "A");
}
A(Nt, "removeLinks");
// node_modules/@radix-ui/react-portal/dist/index.mjs
var Pt = Object.defineProperty, Ft = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ ((e, t) => Pt(e, "name", {
	value: t,
	configurable: !0
}))(function(e, t) {
	let { container: n, ...r } = e, [i, a] = _.useState(!1);
	fe(() => a(!0), []);
	let o = n || i && globalThis?.document?.body;
	return o ? k.createPortal(/* @__PURE__ */ (0, T.jsx)(Je.div, {
		...r,
		ref: t
	}), o) : null;
}, "Portal")), It = Object.defineProperty, Lt = (e, t) => It(e, "name", {
	value: t,
	configurable: !0
});
function Rt(e, t) {
	return _.useReducer((e, n) => t[e][n] ?? e, e);
}
Lt(Rt, "useStateMachine");
var zt = /* @__PURE__ */ Lt((e) => {
	let { present: t, children: n } = e, r = Bt(t), i = typeof n == "function" ? n({ present: r.isPresent }) : _.Children.only(n), a = Ht(r.ref, Wt(i));
	return typeof n == "function" || r.isPresent ? _.cloneElement(i, { ref: a }) : null;
}, "Presence");
function Bt(e) {
	let [t, n] = _.useState(), r = _.useRef(null), i = _.useRef(e), a = _.useRef("none"), o = _.useRef(void 0), [s, c] = Rt(e ? "mounted" : "unmounted", {
		mounted: {
			UNMOUNT: "unmounted",
			ANIMATION_OUT: "unmountSuspended"
		},
		unmountSuspended: {
			MOUNT: "mounted",
			ANIMATION_END: "unmounted"
		},
		unmounted: { MOUNT: "mounted" }
	});
	return _.useEffect(() => {
		s === "mounted" ? (a.current = o.current ?? Ut(r.current), o.current = void 0) : a.current = "none";
	}, [s]), fe(() => {
		let t = r.current, n = i.current;
		if (n !== e) {
			let r = a.current, s = Ut(t);
			e ? (o.current = s, c("MOUNT")) : s === "none" || t?.display === "none" ? c("UNMOUNT") : c(n && r !== s ? "ANIMATION_OUT" : "UNMOUNT"), i.current = e;
		}
	}, [e, c]), fe(() => {
		if (t) {
			let e, n = t.ownerDocument.defaultView ?? window, o = /* @__PURE__ */ Lt((a) => {
				let o = Ut(r.current).includes(CSS.escape(a.animationName));
				if (a.target === t && o && (c("ANIMATION_END"), !i.current)) {
					let r = t.style.animationFillMode;
					t.style.animationFillMode = "forwards", e = n.setTimeout(() => {
						t.style.animationFillMode === "forwards" && (t.style.animationFillMode = r);
					});
				}
			}, "handleAnimationEnd"), s = /* @__PURE__ */ Lt((e) => {
				e.target === t && (a.current = Ut(r.current));
			}, "handleAnimationStart");
			return t.addEventListener("animationstart", s), t.addEventListener("animationcancel", o), t.addEventListener("animationend", o), () => {
				n.clearTimeout(e), t.removeEventListener("animationstart", s), t.removeEventListener("animationcancel", o), t.removeEventListener("animationend", o);
			};
		}
		c("ANIMATION_END");
	}, [t, c]), {
		isPresent: ["mounted", "unmountSuspended"].includes(s),
		ref: _.useCallback((e) => {
			if (e) {
				let t = getComputedStyle(e);
				r.current = t, o.current = Ut(t);
			} else r.current = null;
			n(e);
		}, [])
	};
}
Lt(Bt, "usePresence");
function Vt(e, t) {
	if (typeof e == "function") return e(t);
	e != null && (e.current = t);
}
Lt(Vt, "setRef");
function Ht(...e) {
	let t = _.useRef(e);
	return t.current = e, _.useCallback((e) => {
		let n = t.current, r = !1, i = n.map((t) => {
			let n = Vt(t, e);
			return !r && typeof n == "function" && (r = !0), n;
		});
		if (r) return () => {
			for (let e = 0; e < i.length; e++) {
				let t = i[e];
				typeof t == "function" ? t() : Vt(n[e], null);
			}
		};
	}, []);
}
Lt(Ht, "useStableComposedRefs");
function Ut(e) {
	return e?.animationName || "none";
}
Lt(Ut, "getAnimationName");
function Wt(e) {
	let t = Object.getOwnPropertyDescriptor(e.props, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning;
	return n ? e.ref : (t = Object.getOwnPropertyDescriptor(e, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning, n ? e.props.ref : e.props.ref || e.ref);
}
Lt(Wt, "getElementRef");
// node_modules/@radix-ui/react-focus-guards/dist/index.mjs
var Gt = Object.defineProperty, Kt = (e, t) => Gt(e, "name", {
	value: t,
	configurable: !0
}), qt = 0, Jt = null;
function Yt(e) {
	return Xt(), e.children;
}
Kt(Yt, "FocusGuards");
function Xt() {
	_.useEffect(() => {
		Jt ||= {
			start: Zt(),
			end: Zt()
		};
		let { start: e, end: t } = Jt;
		return document.body.firstElementChild !== e && document.body.insertAdjacentElement("afterbegin", e), document.body.lastElementChild !== t && document.body.insertAdjacentElement("beforeend", t), qt++, () => {
			qt === 1 && (Jt?.start.remove(), Jt?.end.remove(), Jt = null), qt = Math.max(0, qt - 1);
		};
	}, []);
}
Kt(Xt, "useFocusGuards");
function Zt() {
	let e = document.createElement("span");
	return e.setAttribute("data-radix-focus-guard", ""), e.tabIndex = 0, e.style.outline = "none", e.style.opacity = "0", e.style.position = "fixed", e.style.pointerEvents = "none", e;
}
Kt(Zt, "createFocusGuard");
// node_modules/tslib/tslib.es6.mjs
var Qt = function() {
	return Qt = Object.assign || function(e) {
		for (var t, n = 1, r = arguments.length; n < r; n++) for (var i in t = arguments[n], t) Object.prototype.hasOwnProperty.call(t, i) && (e[i] = t[i]);
		return e;
	}, Qt.apply(this, arguments);
};
function $t(e, t) {
	var n = {};
	for (var r in e) Object.prototype.hasOwnProperty.call(e, r) && t.indexOf(r) < 0 && (n[r] = e[r]);
	if (e != null && typeof Object.getOwnPropertySymbols == "function") for (var i = 0, r = Object.getOwnPropertySymbols(e); i < r.length; i++) t.indexOf(r[i]) < 0 && Object.prototype.propertyIsEnumerable.call(e, r[i]) && (n[r[i]] = e[r[i]]);
	return n;
}
function j(e, t, n) {
	if (n || arguments.length === 2) for (var r = 0, i = t.length, a; r < i; r++) (a || !(r in t)) && (a ||= Array.prototype.slice.call(t, 0, r), a[r] = t[r]);
	return e.concat(a || Array.prototype.slice.call(t));
}
// node_modules/react-remove-scroll-bar/dist/es2015/constants.js
var en = "right-scroll-bar-position", tn = "width-before-scroll-bar", nn = "with-scroll-bars-hidden", rn = "--removed-body-scroll-bar-size";
// node_modules/use-callback-ref/dist/es2015/assignRef.js
function an(e, t) {
	return typeof e == "function" ? e(t) : e && (e.current = t), e;
}
// node_modules/use-callback-ref/dist/es2015/useRef.js
function on(e, t) {
	var n = (0, _.useState)(function() {
		return {
			value: e,
			callback: t,
			facade: {
				get current() {
					return n.value;
				},
				set current(e) {
					var t = n.value;
					t !== e && (n.value = e, n.callback(e, t));
				}
			}
		};
	})[0];
	return n.callback = t, n.facade;
}
// node_modules/use-callback-ref/dist/es2015/useMergeRef.js
var sn = typeof window < "u" ? _.useLayoutEffect : _.useEffect, cn = /* @__PURE__ */ new WeakMap();
function ln(e, t) {
	var n = on(t || null, function(t) {
		return e.forEach(function(e) {
			return an(e, t);
		});
	});
	return sn(function() {
		var t = cn.get(n);
		if (t) {
			var r = new Set(t), i = new Set(e), a = n.current;
			r.forEach(function(e) {
				i.has(e) || an(e, null);
			}), i.forEach(function(e) {
				r.has(e) || an(e, a);
			});
		}
		cn.set(n, e);
	}, [e]), n;
}
// node_modules/use-sidecar/dist/es2015/medium.js
function un(e) {
	return e;
}
function dn(e, t) {
	t === void 0 && (t = un);
	var n = [], r = !1;
	return {
		read: function() {
			if (r) throw Error("Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.");
			return n.length ? n[n.length - 1] : e;
		},
		useMedium: function(e) {
			var i = t(e, r);
			return n.push(i), function() {
				n = n.filter(function(e) {
					return e !== i;
				});
			};
		},
		assignSyncMedium: function(e) {
			for (r = !0; n.length;) {
				var t = n;
				n = [], t.forEach(e);
			}
			n = {
				push: function(t) {
					return e(t);
				},
				filter: function() {
					return n;
				}
			};
		},
		assignMedium: function(e) {
			r = !0;
			var t = [];
			if (n.length) {
				var i = n;
				n = [], i.forEach(e), t = n;
			}
			var a = function() {
				var n = t;
				t = [], n.forEach(e);
			}, o = function() {
				return Promise.resolve().then(a);
			};
			o(), n = {
				push: function(e) {
					t.push(e), o();
				},
				filter: function(e) {
					return t = t.filter(e), n;
				}
			};
		}
	};
}
function fn(e) {
	e === void 0 && (e = {});
	var t = dn(null);
	return t.options = Qt({
		async: !0,
		ssr: !1
	}, e), t;
}
// node_modules/use-sidecar/dist/es2015/exports.js
var pn = function(e) {
	var t = e.sideCar, n = $t(e, ["sideCar"]);
	if (!t) throw Error("Sidecar: please provide `sideCar` property to import the right car");
	var r = t.read();
	if (!r) throw Error("Sidecar medium not found");
	return _.createElement(r, Qt({}, n));
};
pn.isSideCarExport = !0;
function mn(e, t) {
	return e.useMedium(t), pn;
}
// node_modules/react-remove-scroll/dist/es2015/medium.js
var hn = fn(), gn = function() {}, _n = _.forwardRef(function(e, t) {
	var n = _.useRef(null), r = _.useState({
		onScrollCapture: gn,
		onWheelCapture: gn,
		onTouchMoveCapture: gn
	}), i = r[0], a = r[1], o = e.forwardProps, s = e.children, c = e.className, l = e.removeScrollBar, u = e.enabled, d = e.shards, f = e.sideCar, p = e.noRelative, m = e.noIsolation, h = e.inert, g = e.allowPinchZoom, v = e.as, y = v === void 0 ? "div" : v, b = e.gapMode, ee = $t(e, [
		"forwardProps",
		"children",
		"className",
		"removeScrollBar",
		"enabled",
		"shards",
		"sideCar",
		"noRelative",
		"noIsolation",
		"inert",
		"allowPinchZoom",
		"as",
		"gapMode"
	]), x = f, te = ln([n, t]), ne = Qt(Qt({}, ee), i);
	return _.createElement(_.Fragment, null, u && _.createElement(x, {
		sideCar: hn,
		removeScrollBar: l,
		shards: d,
		noRelative: p,
		noIsolation: m,
		inert: h,
		setCallbacks: a,
		allowPinchZoom: !!g,
		lockRef: n,
		gapMode: b
	}), o ? _.cloneElement(_.Children.only(s), Qt(Qt({}, ne), { ref: te })) : _.createElement(y, Qt({}, ne, {
		className: c,
		ref: te
	}), s));
});
_n.defaultProps = {
	enabled: !0,
	removeScrollBar: !0,
	inert: !1
}, _n.classNames = {
	fullWidth: tn,
	zeroRight: en
};
// node_modules/get-nonce/dist/es2015/index.js
var vn = function() {
	if (typeof __webpack_nonce__ < "u") return __webpack_nonce__;
};
// node_modules/react-style-singleton/dist/es2015/singleton.js
function yn() {
	if (!document) return null;
	var e = document.createElement("style");
	e.type = "text/css";
	var t = vn();
	return t && e.setAttribute("nonce", t), e;
}
function bn(e, t) {
	e.styleSheet ? e.styleSheet.cssText = t : e.appendChild(document.createTextNode(t));
}
function xn(e) {
	(document.head || document.getElementsByTagName("head")[0]).appendChild(e);
}
var Sn = function() {
	var e = 0, t = null;
	return {
		add: function(n) {
			e == 0 && (t = yn()) && (bn(t, n), xn(t)), e++;
		},
		remove: function() {
			e--, !e && t && (t.parentNode && t.parentNode.removeChild(t), t = null);
		}
	};
}, Cn = function() {
	var e = Sn();
	return function(t, n) {
		_.useEffect(function() {
			return e.add(t), function() {
				e.remove();
			};
		}, [t && n]);
	};
}, wn = function() {
	var e = Cn();
	return function(t) {
		var n = t.styles, r = t.dynamic;
		return e(n, r), null;
	};
}, Tn = {
	left: 0,
	top: 0,
	right: 0,
	gap: 0
}, En = function(e) {
	return parseInt(e || "", 10) || 0;
}, Dn = function(e) {
	var t = window.getComputedStyle(document.body), n = t[e === "padding" ? "paddingLeft" : "marginLeft"], r = t[e === "padding" ? "paddingTop" : "marginTop"], i = t[e === "padding" ? "paddingRight" : "marginRight"];
	return [
		En(n),
		En(r),
		En(i)
	];
}, On = function(e) {
	if (e === void 0 && (e = "margin"), typeof window > "u") return Tn;
	var t = Dn(e), n = document.documentElement.clientWidth, r = window.innerWidth;
	return {
		left: t[0],
		top: t[1],
		right: t[2],
		gap: Math.max(0, r - n + t[2] - t[0])
	};
}, kn = wn(), An = "data-scroll-locked", jn = function(e, t, n, r) {
	var i = e.left, a = e.top, o = e.right, s = e.gap;
	return n === void 0 && (n = "margin"), `
  .${nn} {
   overflow: hidden ${r};
   padding-right: ${s}px ${r};
  }
  body[${An}] {
    overflow: hidden ${r};
    overscroll-behavior: contain;
    ${[
		t && `position: relative ${r};`,
		n === "margin" && `
    padding-left: ${i}px;
    padding-top: ${a}px;
    padding-right: ${o}px;
    margin-left:0;
    margin-top:0;
    margin-right: ${s}px ${r};
    `,
		n === "padding" && `padding-right: ${s}px ${r};`
	].filter(Boolean).join("")}
  }
  
  .${en} {
    right: ${s}px ${r};
  }
  
  .${tn} {
    margin-right: ${s}px ${r};
  }
  
  .${en} .${en} {
    right: 0 ${r};
  }
  
  .${tn} .${tn} {
    margin-right: 0 ${r};
  }
  
  body[${An}] {
    ${rn}: ${s}px;
  }
`;
}, Mn = function() {
	var e = parseInt(document.body.getAttribute("data-scroll-locked") || "0", 10);
	return isFinite(e) ? e : 0;
}, Nn = function() {
	_.useEffect(function() {
		return document.body.setAttribute(An, (Mn() + 1).toString()), function() {
			var e = Mn() - 1;
			e <= 0 ? document.body.removeAttribute(An) : document.body.setAttribute(An, e.toString());
		};
	}, []);
}, Pn = function(e) {
	var t = e.noRelative, n = e.noImportant, r = e.gapMode, i = r === void 0 ? "margin" : r;
	Nn();
	var a = _.useMemo(function() {
		return On(i);
	}, [i]);
	return _.createElement(kn, { styles: jn(a, !t, i, n ? "" : "!important") });
}, Fn = !1;
if (typeof window < "u") try {
	var In = Object.defineProperty({}, "passive", { get: function() {
		return Fn = !0, !0;
	} });
	window.addEventListener("test", In, In), window.removeEventListener("test", In, In);
} catch {
	Fn = !1;
}
var Ln = Fn ? { passive: !1 } : !1, Rn = function(e) {
	return e.tagName === "TEXTAREA";
}, zn = function(e, t) {
	if (!(e instanceof Element)) return !1;
	var n = window.getComputedStyle(e);
	return n[t] !== "hidden" && !(n.overflowY === n.overflowX && !Rn(e) && n[t] === "visible");
}, Bn = function(e) {
	return zn(e, "overflowY");
}, Vn = function(e) {
	return zn(e, "overflowX");
}, Hn = function(e, t) {
	var n = t.ownerDocument, r = t;
	do {
		if (typeof ShadowRoot < "u" && r instanceof ShadowRoot && (r = r.host), Gn(e, r)) {
			var i = Kn(e, r);
			if (i[1] > i[2]) return !0;
		}
		r = r.parentNode;
	} while (r && r !== n.body);
	return !1;
}, Un = function(e) {
	return [
		e.scrollTop,
		e.scrollHeight,
		e.clientHeight
	];
}, Wn = function(e) {
	return [
		e.scrollLeft,
		e.scrollWidth,
		e.clientWidth
	];
}, Gn = function(e, t) {
	return e === "v" ? Bn(t) : Vn(t);
}, Kn = function(e, t) {
	return e === "v" ? Un(t) : Wn(t);
}, qn = function(e, t) {
	return e === "h" && t === "rtl" ? -1 : 1;
}, Jn = function(e, t, n, r, i) {
	var a = qn(e, window.getComputedStyle(t).direction), o = a * r, s = n.target, c = t.contains(s), l = !1, u = o > 0, d = 0, f = 0;
	do {
		if (!s) break;
		var p = Kn(e, s), m = p[0], h = p[1] - p[2] - a * m;
		(m || h) && Gn(e, s) && (d += h, f += m);
		var g = s.parentNode;
		s = g && g.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? g.host : g;
	} while (!c && s !== document.body || c && (t.contains(s) || t === s));
	return (u && (i && Math.abs(d) < 1 || !i && o > d) || !u && (i && Math.abs(f) < 1 || !i && -o > f)) && (l = !0), l;
}, Yn = function(e) {
	return "changedTouches" in e ? [e.changedTouches[0].clientX, e.changedTouches[0].clientY] : [0, 0];
}, Xn = function(e) {
	return [e.deltaX, e.deltaY];
}, Zn = function(e) {
	return e && "current" in e ? e.current : e;
}, Qn = function(e, t) {
	return e[0] === t[0] && e[1] === t[1];
}, $n = function(e) {
	return `
  .block-interactivity-${e} {pointer-events: none;}
  .allow-interactivity-${e} {pointer-events: all;}
`;
}, er = 0, tr = [];
function nr(e) {
	var t = _.useRef([]), n = _.useRef([0, 0]), r = _.useRef(), i = _.useState(er++)[0], a = _.useState(wn)[0], o = _.useRef(e);
	_.useEffect(function() {
		o.current = e;
	}, [e]), _.useEffect(function() {
		if (e.inert) {
			document.body.classList.add(`block-interactivity-${i}`);
			var t = j([e.lockRef.current], (e.shards || []).map(Zn), !0).filter(Boolean);
			return t.forEach(function(e) {
				return e.classList.add(`allow-interactivity-${i}`);
			}), function() {
				document.body.classList.remove(`block-interactivity-${i}`), t.forEach(function(e) {
					return e.classList.remove(`allow-interactivity-${i}`);
				});
			};
		}
	}, [
		e.inert,
		e.lockRef.current,
		e.shards
	]);
	var s = _.useCallback(function(e, t) {
		if ("touches" in e && e.touches.length === 2 || e.type === "wheel" && e.ctrlKey) return !o.current.allowPinchZoom;
		var i = Yn(e), a = n.current, s = "deltaX" in e ? e.deltaX : a[0] - i[0], c = "deltaY" in e ? e.deltaY : a[1] - i[1], l, u = e.target, d = Math.abs(s) > Math.abs(c) ? "h" : "v";
		if ("touches" in e && d === "h" && u.type === "range") return !1;
		var f = window.getSelection(), p = f && f.anchorNode;
		if (p && (p === u || p.contains(u))) return !1;
		var m = Hn(d, u);
		if (!m) return !0;
		if (m ? l = d : (l = d === "v" ? "h" : "v", m = Hn(d, u)), !m) return !1;
		if (!r.current && "changedTouches" in e && (s || c) && (r.current = l), !l) return !0;
		var h = r.current || l;
		return Jn(h, t, e, h === "h" ? s : c, !0);
	}, []), c = _.useCallback(function(e) {
		var n = e;
		if (tr.length && tr[tr.length - 1] === a) {
			var r = "deltaY" in n ? Xn(n) : Yn(n), i = t.current.filter(function(e) {
				return e.name === n.type && (e.target === n.target || n.target === e.shadowParent) && Qn(e.delta, r);
			})[0];
			if (i && i.should) n.cancelable && n.preventDefault();
			else if (!i) {
				var c = (o.current.shards || []).map(Zn).filter(Boolean).filter(function(e) {
					return e.contains(n.target);
				});
				(c.length > 0 ? s(n, c[0]) : !o.current.noIsolation) && n.cancelable && n.preventDefault();
			}
		}
	}, []), l = _.useCallback(function(e, n, r, i) {
		var a = {
			name: e,
			delta: n,
			target: r,
			should: i,
			shadowParent: rr(r)
		};
		t.current.push(a), setTimeout(function() {
			t.current = t.current.filter(function(e) {
				return e !== a;
			});
		}, 1);
	}, []), u = _.useCallback(function(e) {
		n.current = Yn(e), r.current = void 0;
	}, []), d = _.useCallback(function(t) {
		l(t.type, Xn(t), t.target, s(t, e.lockRef.current));
	}, []), f = _.useCallback(function(t) {
		l(t.type, Yn(t), t.target, s(t, e.lockRef.current));
	}, []);
	_.useEffect(function() {
		return tr.push(a), e.setCallbacks({
			onScrollCapture: d,
			onWheelCapture: d,
			onTouchMoveCapture: f
		}), document.addEventListener("wheel", c, Ln), document.addEventListener("touchmove", c, Ln), document.addEventListener("touchstart", u, Ln), function() {
			tr = tr.filter(function(e) {
				return e !== a;
			}), document.removeEventListener("wheel", c, Ln), document.removeEventListener("touchmove", c, Ln), document.removeEventListener("touchstart", u, Ln);
		};
	}, []);
	var p = e.removeScrollBar, m = e.inert;
	return _.createElement(_.Fragment, null, m ? _.createElement(a, { styles: $n(i) }) : null, p ? _.createElement(Pn, {
		noRelative: e.noRelative,
		gapMode: e.gapMode
	}) : null);
}
function rr(e) {
	for (var t = null; e !== null;) e instanceof ShadowRoot && (t = e.host, e = e.host), e = e.parentNode;
	return t;
}
// node_modules/react-remove-scroll/dist/es2015/sidecar.js
var ir = mn(hn, nr), ar = _.forwardRef(function(e, t) {
	return _.createElement(_n, Qt({}, e, {
		ref: t,
		sideCar: ir
	}));
});
ar.classNames = _n.classNames;
// node_modules/aria-hidden/dist/es2015/index.js
var or = function(e) {
	return typeof document > "u" ? null : (Array.isArray(e) ? e[0] : e).ownerDocument.body;
}, sr = /* @__PURE__ */ new WeakMap(), cr = /* @__PURE__ */ new WeakMap(), lr = {}, ur = 0, dr = function(e) {
	return e && (e.host || dr(e.parentNode));
}, fr = function(e, t) {
	return t.map(function(t) {
		if (e.contains(t)) return t;
		var n = dr(t);
		return n && e.contains(n) ? n : (console.error("aria-hidden", t, "in not contained inside", e, ". Doing nothing"), null);
	}).filter(function(e) {
		return !!e;
	});
}, pr = function(e, t, n, r) {
	var i = fr(t, Array.isArray(e) ? e : [e]);
	lr[n] || (lr[n] = /* @__PURE__ */ new WeakMap());
	var a = lr[n], o = [], s = /* @__PURE__ */ new Set(), c = new Set(i), l = function(e) {
		e && !s.has(e) && (s.add(e), l(e.parentNode));
	};
	i.forEach(l);
	var u = function(e) {
		e && !c.has(e) && Array.prototype.forEach.call(e.children, function(e) {
			if (s.has(e)) u(e);
			else try {
				var t = e.getAttribute(r), i = t !== null && t !== "false", c = (sr.get(e) || 0) + 1, l = (a.get(e) || 0) + 1;
				sr.set(e, c), a.set(e, l), o.push(e), c === 1 && i && cr.set(e, !0), l === 1 && e.setAttribute(n, "true"), i || e.setAttribute(r, "true");
			} catch (t) {
				console.error("aria-hidden: cannot operate on ", e, t);
			}
		});
	};
	return u(t), s.clear(), ur++, function() {
		o.forEach(function(e) {
			var t = sr.get(e) - 1, i = a.get(e) - 1;
			sr.set(e, t), a.set(e, i), t || (cr.has(e) || e.removeAttribute(r), cr.delete(e)), i || e.removeAttribute(n);
		}), ur--, ur || (sr = /* @__PURE__ */ new WeakMap(), sr = /* @__PURE__ */ new WeakMap(), cr = /* @__PURE__ */ new WeakMap(), lr = {});
	};
}, mr = function(e, t, n) {
	n === void 0 && (n = "data-aria-hidden");
	var r = Array.from(Array.isArray(e) ? e : [e]), i = t || or(e);
	return i ? (r.push.apply(r, Array.from(i.querySelectorAll("[aria-live], script"))), pr(r, i, n, "aria-hidden")) : function() {
		return null;
	};
}, hr = Object.defineProperty, gr = (e, t) => hr(e, "name", {
	value: t,
	configurable: !0
}), _r = "Dialog", [vr, yr] = /* @__PURE__ */ ue(_r), [br, xr] = vr(_r), Sr = /* @__PURE__ */ gr((e) => {
	let { __scopeDialog: t, children: n, open: r, defaultOpen: i, onOpenChange: a, modal: o = !0 } = e, s = _.useRef(null), c = _.useRef(null), { nodes: l, registry: u } = xt(), [d, f] = we({
		prop: r,
		defaultProp: i ?? !1,
		onChange: a,
		caller: _r
	}), [p, m] = _.useState(0), [h, g] = _.useState(0);
	return /* @__PURE__ */ (0, T.jsx)(br, {
		scope: t,
		triggerRef: s,
		contentRef: c,
		contentId: _e(),
		titleId: _e(),
		descriptionId: _e(),
		titlePresent: p > 0,
		descriptionPresent: h > 0,
		setTitleCount: m,
		setDescriptionCount: g,
		open: d,
		onOpenChange: f,
		onOpenToggle: _.useCallback(() => f((e) => !e), [f]),
		modal: o,
		branchNodes: l,
		branchRegistry: u,
		children: n
	});
}, "Dialog"), Cr = "DialogTrigger", wr = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ gr(function(e, t) {
	let { __scopeDialog: n, ...r } = e, i = xr(Cr, n), a = w(t, i.triggerRef);
	return /* @__PURE__ */ (0, T.jsx)(Je.button, {
		type: "button",
		"aria-haspopup": "dialog",
		"aria-expanded": i.open,
		"aria-controls": i.open ? i.contentId : void 0,
		"data-state": Ur(i.open),
		...r,
		ref: a,
		onClick: x(e.onClick, i.onOpenToggle)
	});
}, "DialogTrigger")), Tr = "DialogPortal", [Er, Dr] = vr(Tr, { forceMount: void 0 }), Or = /* @__PURE__ */ gr((e) => {
	let { __scopeDialog: t, forceMount: n, children: r, container: i } = e, a = xr(Tr, t);
	return /* @__PURE__ */ (0, T.jsx)(Er, {
		scope: t,
		forceMount: n,
		children: _.Children.map(r, (e) => /* @__PURE__ */ (0, T.jsx)(zt, {
			present: n || a.open,
			children: /* @__PURE__ */ (0, T.jsx)(Ft, {
				asChild: !0,
				container: i,
				children: e
			})
		}))
	});
}, "DialogPortal"), kr = "DialogOverlay", Ar = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ gr(function(e, t) {
	let n = Dr(kr, e.__scopeDialog), { forceMount: r = n.forceMount, ...i } = e, a = xr(kr, e.__scopeDialog);
	return a.modal ? /* @__PURE__ */ (0, T.jsx)(zt, {
		present: r || a.open,
		children: /* @__PURE__ */ (0, T.jsx)(Mr, {
			...i,
			ref: t
		})
	}) : null;
}, "DialogOverlay")), jr = /* @__PURE__ */ je("DialogOverlay.RemoveScroll"), Mr = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ gr(function(e, t) {
	let { __scopeDialog: n, ...r } = e, i = xr(kr, n), a = w(t, ct());
	return /* @__PURE__ */ (0, T.jsx)(ar, {
		as: jr,
		allowPinchZoom: !0,
		shards: _.useMemo(() => [i.contentRef, ...i.branchNodes.map((e) => ({ current: e }))], [i.contentRef, i.branchNodes]),
		children: /* @__PURE__ */ (0, T.jsx)(Je.div, {
			"data-state": Ur(i.open),
			...r,
			ref: a,
			style: {
				pointerEvents: "auto",
				...r.style
			}
		})
	});
}, "DialogOverlayImpl")), Nr = "DialogContent", Pr = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ gr(function(e, t) {
	let n = Dr(Nr, e.__scopeDialog), { forceMount: r = n.forceMount, ...i } = e, a = xr(Nr, e.__scopeDialog);
	return /* @__PURE__ */ (0, T.jsx)(zt, {
		present: r || a.open,
		children: a.modal ? /* @__PURE__ */ (0, T.jsx)(Fr, {
			...i,
			ref: t
		}) : /* @__PURE__ */ (0, T.jsx)(Ir, {
			...i,
			ref: t
		})
	});
}, "DialogContent")), Fr = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ gr(function(e, t) {
	let n = xr(Nr, e.__scopeDialog), r = _.useRef(null), i = w(t, n.contentRef, r);
	return _.useEffect(() => {
		let e = r.current;
		if (e) return mr(e);
	}, []), /* @__PURE__ */ (0, T.jsx)(Lr, {
		...e,
		ref: i,
		trapFocus: n.open,
		disableOutsidePointerEvents: n.open,
		onCloseAutoFocus: x(e.onCloseAutoFocus, (e) => {
			e.preventDefault(), n.triggerRef.current?.focus();
		}),
		onPointerDownOutside: x(e.onPointerDownOutside, (e) => {
			let t = e.detail.originalEvent, n = t.button === 0 && t.ctrlKey === !0;
			(t.button === 2 || n) && e.preventDefault();
		}),
		onFocusOutside: x(e.onFocusOutside, (e) => e.preventDefault())
	});
}, "DialogContentModal")), Ir = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ gr(function(e, t) {
	let n = xr(Nr, e.__scopeDialog), r = _.useRef(!1), i = _.useRef(!1);
	return /* @__PURE__ */ (0, T.jsx)(Lr, {
		...e,
		ref: t,
		trapFocus: !1,
		disableOutsidePointerEvents: !1,
		onCloseAutoFocus: (t) => {
			e.onCloseAutoFocus?.(t), t.defaultPrevented || (r.current || n.triggerRef.current?.focus(), t.preventDefault()), r.current = !1, i.current = !1;
		},
		onInteractOutside: (t) => {
			e.onInteractOutside?.(t), t.defaultPrevented || (r.current = !0, t.detail.originalEvent.type === "pointerdown" && (i.current = !0));
			let a = t.target;
			n.triggerRef.current?.contains(a) && t.preventDefault(), t.detail.originalEvent.type === "focusin" && i.current && t.preventDefault();
		}
	});
}, "DialogContentNonModal")), Lr = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ gr(function(e, t) {
	let { __scopeDialog: n, trapFocus: r, onOpenAutoFocus: i, onCloseAutoFocus: a, "aria-describedby": o, children: s, ...c } = e, l = xr(Nr, n);
	return Xt(), /* @__PURE__ */ (0, T.jsx)(bt, {
		registry: l.branchRegistry,
		children: /* @__PURE__ */ (0, T.jsx)(vt, {
			asChild: !0,
			loop: !0,
			trapped: r,
			branches: l.branchNodes,
			onMountAutoFocus: i,
			onUnmountAutoFocus: a,
			children: /* @__PURE__ */ (0, T.jsx)(st, {
				role: "dialog",
				id: l.contentId,
				"aria-labelledby": l.titlePresent ? l.titleId : void 0,
				"aria-describedby": l.descriptionPresent ? Hr(o, l.descriptionId) : o,
				"data-state": Ur(l.open),
				...c,
				ref: t,
				deferPointerDownOutside: !0,
				onDismiss: () => l.onOpenChange(!1),
				children: s
			})
		})
	});
}, "DialogContentImpl")), Rr = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ gr(function(e, t) {
	let { __scopeDialog: n, ...r } = e, i = xr("DialogTitle", n), { setTitleCount: a } = i;
	return fe(() => (a((e) => e + 1), () => a((e) => e - 1)), [a]), /* @__PURE__ */ (0, T.jsx)(Je.h2, {
		id: i.titleId,
		...r,
		ref: t
	});
}, "DialogTitle")), zr = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ gr(function(e, t) {
	let { __scopeDialog: n, ...r } = e, i = xr("DialogDescription", n), { setDescriptionCount: a } = i;
	return fe(() => (a((e) => e + 1), () => a((e) => e - 1)), [a]), /* @__PURE__ */ (0, T.jsx)(Je.p, {
		id: i.descriptionId,
		...r,
		ref: t
	});
}, "DialogDescription")), Br = "DialogClose", Vr = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ gr(function(e, t) {
	let { __scopeDialog: n, ...r } = e, i = xr(Br, n);
	return /* @__PURE__ */ (0, T.jsx)(Je.button, {
		type: "button",
		...r,
		ref: t,
		onClick: x(e.onClick, () => i.onOpenChange(!1))
	});
}, "DialogClose"));
function Hr(...e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e) if (typeof n == "string") for (let e of String(n).trim().split(/\s+/)) e && t.add(e);
	return t.size > 0 ? Array.from(t).join(" ") : void 0;
}
gr(Hr, "concatAriaDescribedby");
function Ur(e) {
	return e ? "open" : "closed";
}
gr(Ur, "getState");
// node_modules/lucide-react/dist/esm/shared/src/utils/toKebabCase.mjs
var Wr = (e) => e?.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
// node_modules/lucide-react/dist/esm/shared/src/utils/toLucideIconData.mjs
function Gr(e, t, n = []) {
	if (t == null) throw Error("[lucide]: iconNode is required when icon name is used");
	return {
		name: Wr(e),
		size: 24,
		node: t,
		...n.length > 0 ? { aliases: n } : {}
	};
}
// node_modules/lucide-react/dist/esm/shared/src/utils/toCamelCase.mjs
var Kr = (e) => {
	let t = "", n = !1;
	for (let r of e) r === "-" || r === "_" || r <= " " ? n = t.length > 0 : (t.length === 0 ? t += r.toLowerCase() : t += n ? r.toUpperCase() : r, n = !1);
	return t;
}, qr = (e) => {
	let t = Kr(e);
	return t.charAt(0).toUpperCase() + t.slice(1);
}, Jr = (...e) => e.filter((e, t, n) => !!e && e.trim() !== "" && n.indexOf(e) === t).join(" ").trim(), Yr = {
	xmlns: "http://www.w3.org/2000/svg",
	width: 24,
	height: 24,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	"stroke-width": 2,
	"stroke-linecap": "round",
	"stroke-linejoin": "round"
};
// node_modules/lucide-react/dist/esm/shared/src/build/buildLucideIconNode.mjs
function Xr(e) {
	return e != null;
}
function Zr(e, t = {}) {
	let n = t.attributeNames ?? {}, r = (e) => n[e] ?? e, i = e.size ?? e.width ?? Yr.width, a = e.size ?? e.height ?? Yr.height, o = e.aliases?.filter((e) => typeof e == "string" && e.trim() !== "").map((e) => `lucide-${e}`) ?? [], s = [...e.name ? [`lucide-${e.name}`] : [], ...o], c = t.className?.split(" ").filter(Boolean) ?? [], l = t.includeDefaultClasses === !1 ? Jr(...c) : Jr("lucide", ...s, ...c), u = t.absoluteStrokeWidth ? Number(t.strokeWidth ?? Yr["stroke-width"]) * Number(e.size ?? e.width ?? Yr.width) / Number(t.size ?? t.width ?? Yr.width) : t.strokeWidth ?? Yr["stroke-width"];
	return [
		"svg",
		{
			...Object.entries(Yr).reduce((e, [t, n]) => (e[r(t)] = n, e), {}),
			..."color" in t && t.color && { [r("stroke")]: t.color },
			..."size" in t && Xr(t.size) && {
				[r("width")]: t.size,
				[r("height")]: t.size
			},
			..."width" in t && Xr(t.width) && { [r("width")]: t.width },
			..."height" in t && Xr(t.height) && { [r("height")]: t.height },
			[r("stroke-width")]: u,
			...l && { [r("class")]: l },
			[r("viewBox")]: `0 0 ${i} ${a}`,
			...t.hasA11yProp === !1 ? { [r("aria-hidden")]: "true" } : {},
			..."attributes" in t && t.attributes
		},
		e.node.map((e) => {
			let [n, i, a] = e, o = t.nonScalingStroke ? {
				[r("vector-effect")]: "non-scaling-stroke",
				...i
			} : i;
			return a ? [
				n,
				o,
				a
			] : [n, o];
		})
	];
}
// node_modules/lucide-react/dist/esm/shared/src/build/buildLucideIconForReact.mjs
function Qr(e, t = {}) {
	return Zr(e, {
		...t,
		attributeNames: {
			...t.attributeNames,
			class: "className",
			"stroke-width": "strokeWidth",
			"stroke-linecap": "strokeLinecap",
			"stroke-linejoin": "strokeLinejoin",
			"vector-effect": "vectorEffect"
		}
	});
}
// node_modules/lucide-react/dist/esm/shared/src/utils/hasA11yProp.mjs
var $r = (e) => {
	for (let t in e) if (t.startsWith("aria-") || t === "role" || t === "title") return !0;
	return !1;
}, ei = (0, _.createContext)({}), ti = () => (0, _.useContext)(ei), ni = (0, _.forwardRef)(({ color: e, size: t, width: n, height: r, strokeWidth: i, absoluteStrokeWidth: a, nonScalingStroke: o, className: s = "", children: c, iconNode: l = [], icon: u = {
	node: l,
	aliases: [],
	size: 24
}, ...d }, f) => {
	let { size: p = 24, strokeWidth: m = 2, absoluteStrokeWidth: h = !1, nonScalingStroke: g = !1, color: v = "currentColor", className: y = "" } = ti() ?? {}, b = !!c || $r(d), [ee, x, te = []] = Qr(u, {
		color: e ?? v,
		width: n ?? t ?? p,
		height: r ?? t ?? p,
		strokeWidth: i ?? m,
		absoluteStrokeWidth: a ?? h,
		nonScalingStroke: o ?? g,
		className: Jr(y, s),
		hasA11yProp: b,
		attributes: d
	});
	return (0, _.createElement)(ee, {
		ref: f,
		...x
	}, [...te.map(([e, t]) => (0, _.createElement)(e, t)), ...Array.isArray(c) ? c : [c]]);
});
// node_modules/lucide-react/dist/esm/createLucideIcon.mjs
function M(e, t = [], n = []) {
	let r = typeof e == "string" ? Gr(e, t, n) : e, i = (0, _.forwardRef)(({ className: e, ...t }, n) => (0, _.createElement)(ni, {
		ref: n,
		icon: r,
		className: e,
		...t
	}));
	return r.name && (i.displayName = qr(r.name)), i;
}
// node_modules/lucide-react/dist/esm/icons/arrow-left.mjs
var ri = {
	name: "arrow-left",
	size: 24,
	node: [["path", {
		d: "m12 19-7-7 7-7",
		key: "1l729n"
	}], ["path", {
		d: "M19 12H5",
		key: "x3x0zl"
	}]]
};
ri.node;
var ii = M(ri), ai = {
	name: "arrow-right",
	size: 24,
	node: [["path", {
		d: "M5 12h14",
		key: "1ays0h"
	}], ["path", {
		d: "m12 5 7 7-7 7",
		key: "xquz4c"
	}]]
};
ai.node;
var oi = M(ai), si = {
	name: "arrow-up-right",
	size: 24,
	node: [["path", {
		d: "M7 7h10v10",
		key: "1tivn9"
	}], ["path", {
		d: "M7 17 17 7",
		key: "1vkiza"
	}]]
};
si.node;
var ci = M(si), li = {
	name: "book-open-check",
	size: 24,
	node: [
		["path", {
			d: "M12 5v16",
			key: "1f6ucr"
		}],
		["path", {
			d: "m16 12 2 2 4-4",
			key: "mdajum"
		}],
		["path", {
			d: "M22 6V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2h4.001A2 2 0 0022 17v-1.344",
			key: "144kbk"
		}]
	]
};
li.node;
var ui = M(li), di = {
	name: "book-open",
	size: 24,
	node: [["path", {
		d: "M12 5v16",
		key: "1f6ucr"
	}], ["path", {
		d: "M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z",
		key: "1fyvmf"
	}]]
};
di.node;
var fi = M(di), pi = {
	name: "building-complex",
	size: 24,
	node: [
		["path", {
			d: "M10 12h4",
			key: "a56b0p"
		}],
		["path", {
			d: "M10 8h4",
			key: "1sr2af"
		}],
		["path", {
			d: "M14 21v-3a2 2 0 0 0-4 0v3",
			key: "1rgiei"
		}],
		["path", {
			d: "M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2",
			key: "secmi2"
		}],
		["path", {
			d: "M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16",
			key: "16ra0t"
		}]
	],
	aliases: ["building-2"]
};
pi.node;
var mi = M(pi), hi = {
	name: "check",
	size: 24,
	node: [["path", {
		d: "M20 6 9 17l-5-5",
		key: "1gmf2c"
	}]]
};
hi.node;
var gi = M(hi), _i = {
	name: "check-check",
	size: 24,
	node: [["path", {
		d: "M18 6 7 17l-5-5",
		key: "116fxf"
	}], ["path", {
		d: "m22 10-7.5 7.5L13 16",
		key: "ke71qq"
	}]]
};
_i.node;
var vi = M(_i), yi = {
	name: "chevron-down",
	size: 24,
	node: [["path", {
		d: "m6 9 6 6 6-6",
		key: "qrunsl"
	}]]
};
yi.node;
var bi = M(yi), xi = {
	name: "chevron-right",
	size: 24,
	node: [["path", {
		d: "m9 18 6-6-6-6",
		key: "mthhwq"
	}]]
};
xi.node;
var Si = M(xi), Ci = {
	name: "circle-question-mark",
	size: 24,
	node: [
		["circle", {
			cx: "12",
			cy: "12",
			r: "10",
			key: "1mglay"
		}],
		["path", {
			d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",
			key: "1u773s"
		}],
		["path", {
			d: "M12 17h.01",
			key: "p32p05"
		}]
	],
	aliases: ["help-circle", "circle-help"]
};
Ci.node;
var wi = M(Ci), Ti = {
	name: "clock-3",
	size: 24,
	node: [["circle", {
		cx: "12",
		cy: "12",
		r: "10",
		key: "1mglay"
	}], ["path", {
		d: "M12 6v6h4",
		key: "135r8i"
	}]]
};
Ti.node;
var Ei = M(Ti), Di = {
	name: "file-text",
	size: 24,
	node: [
		["path", {
			d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
			key: "1oefj6"
		}],
		["path", {
			d: "M14 2v5a1 1 0 0 0 1 1h5",
			key: "wfsgrz"
		}],
		["path", {
			d: "M10 9H8",
			key: "b1mrlr"
		}],
		["path", {
			d: "M16 13H8",
			key: "t4e002"
		}],
		["path", {
			d: "M16 17H8",
			key: "z1uh3a"
		}]
	]
};
Di.node;
var Oi = M(Di), ki = {
	name: "folder-open",
	size: 24,
	node: [["path", {
		d: "m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2",
		key: "usdka0"
	}]]
};
ki.node;
var Ai = M(ki), ji = {
	name: "graduation-cap",
	size: 24,
	node: [
		["path", {
			d: "M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z",
			key: "j76jl0"
		}],
		["path", {
			d: "M22 10v6",
			key: "1lu8f3"
		}],
		["path", {
			d: "M6 12.5V16a6 3 0 0 0 12 0v-3.5",
			key: "1r8lef"
		}]
	]
};
ji.node;
var Mi = M(ji), Ni = {
	name: "house",
	size: 24,
	node: [["path", {
		d: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8",
		key: "5wwlr5"
	}], ["path", {
		d: "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
		key: "r6nss1"
	}]],
	aliases: ["home"]
};
Ni.node;
var Pi = M(Ni), Fi = {
	name: "layers",
	size: 24,
	node: [
		["path", {
			d: "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",
			key: "zw3jo"
		}],
		["path", {
			d: "M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",
			key: "1wduqc"
		}],
		["path", {
			d: "M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",
			key: "kqbvx6"
		}]
	],
	aliases: ["layers-3"]
};
Fi.node;
var Ii = M(Fi), Li = {
	name: "lightbulb",
	size: 24,
	node: [
		["path", {
			d: "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5",
			key: "1gvzjb"
		}],
		["path", {
			d: "M9 18h6",
			key: "x1upvd"
		}],
		["path", {
			d: "M10 22h4",
			key: "ceow96"
		}]
	]
};
Li.node;
var Ri = M(Li), zi = {
	name: "loader-circle",
	size: 24,
	node: [["path", {
		d: "M21 12a9 9 0 1 1-6.219-8.56",
		key: "13zald"
	}]],
	aliases: ["loader-2"]
};
zi.node;
var Bi = M(zi), Vi = {
	name: "log-in",
	size: 24,
	node: [
		["path", {
			d: "m10 17 5-5-5-5",
			key: "1bsop3"
		}],
		["path", {
			d: "M15 12H3",
			key: "6jk70r"
		}],
		["path", {
			d: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4",
			key: "u53s6r"
		}]
	]
};
Vi.node;
var Hi = M(Vi), Ui = {
	name: "menu",
	size: 24,
	node: [
		["path", {
			d: "M4 5h16",
			key: "1tepv9"
		}],
		["path", {
			d: "M4 12h16",
			key: "1lakjw"
		}],
		["path", {
			d: "M4 19h16",
			key: "1djgab"
		}]
	]
};
Ui.node;
var Wi = M(Ui), Gi = {
	name: "moon",
	size: 24,
	node: [["path", {
		d: "M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401",
		key: "kfwtm"
	}]]
};
Gi.node;
var Ki = M(Gi), qi = {
	name: "palette",
	size: 24,
	node: [
		["path", {
			d: "M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z",
			key: "e79jfc"
		}],
		["circle", {
			cx: "13.5",
			cy: "6.5",
			r: ".5",
			fill: "currentColor",
			key: "1okk4w"
		}],
		["circle", {
			cx: "17.5",
			cy: "10.5",
			r: ".5",
			fill: "currentColor",
			key: "f64h9f"
		}],
		["circle", {
			cx: "6.5",
			cy: "12.5",
			r: ".5",
			fill: "currentColor",
			key: "qy21gx"
		}],
		["circle", {
			cx: "8.5",
			cy: "7.5",
			r: ".5",
			fill: "currentColor",
			key: "fotxhn"
		}]
	]
};
qi.node;
var Ji = M(qi), Yi = {
	name: "paperclip",
	size: 24,
	node: [["path", {
		d: "m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551",
		key: "1miecu"
	}]]
};
Yi.node;
var Xi = M(Yi), Zi = {
	name: "pencil-line",
	size: 24,
	node: [
		["path", {
			d: "M13 21h8",
			key: "1jsn5i"
		}],
		["path", {
			d: "m15 5 4 4",
			key: "1mk7zo"
		}],
		["path", {
			d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
			key: "1a8usu"
		}]
	]
};
Zi.node;
var Qi = M(Zi), $i = {
	name: "plus",
	size: 24,
	node: [["path", {
		d: "M5 12h14",
		key: "1ays0h"
	}], ["path", {
		d: "M12 5v14",
		key: "s699le"
	}]]
};
$i.node;
var ea = M($i), ta = {
	name: "settings-2",
	size: 24,
	node: [
		["path", {
			d: "M14 17H5",
			key: "gfn3mx"
		}],
		["path", {
			d: "M19 7h-9",
			key: "6i9tg"
		}],
		["circle", {
			cx: "17",
			cy: "17",
			r: "3",
			key: "18b49y"
		}],
		["circle", {
			cx: "7",
			cy: "7",
			r: "3",
			key: "dfmy0x"
		}]
	]
};
ta.node;
var na = M(ta), ra = {
	name: "shield-check",
	size: 24,
	node: [["path", {
		d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
		key: "oel41y"
	}], ["path", {
		d: "m9 12 2 2 4-4",
		key: "dzmm74"
	}]]
};
ra.node;
var ia = M(ra), aa = {
	name: "sliders-horizontal",
	size: 24,
	node: [
		["path", {
			d: "M10 5H3",
			key: "1qgfaw"
		}],
		["path", {
			d: "M12 19H3",
			key: "yhmn1j"
		}],
		["path", {
			d: "M14 3v4",
			key: "1sua03"
		}],
		["path", {
			d: "M16 17v4",
			key: "1q0r14"
		}],
		["path", {
			d: "M21 12h-9",
			key: "1o4lsq"
		}],
		["path", {
			d: "M21 19h-5",
			key: "1rlt1p"
		}],
		["path", {
			d: "M21 5h-7",
			key: "1oszz2"
		}],
		["path", {
			d: "M8 10v4",
			key: "tgpxqk"
		}],
		["path", {
			d: "M8 12H3",
			key: "a7s4jb"
		}]
	]
};
aa.node;
var oa = M(aa), sa = {
	name: "sparkles",
	size: 24,
	node: [
		["path", {
			d: "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",
			key: "1s2grr"
		}],
		["path", {
			d: "M20 2v4",
			key: "1rf3ol"
		}],
		["path", {
			d: "M22 4h-4",
			key: "gwowj6"
		}],
		["circle", {
			cx: "4",
			cy: "20",
			r: "2",
			key: "6kqj1y"
		}]
	],
	aliases: ["stars"]
};
sa.node;
var ca = M(sa), la = {
	name: "sprout",
	size: 24,
	node: [
		["path", {
			d: "M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3",
			key: "139s4v"
		}],
		["path", {
			d: "M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4",
			key: "1dlkgp"
		}],
		["path", {
			d: "M5 21h14",
			key: "11awu3"
		}]
	]
};
la.node;
var ua = M(la), N = {
	name: "sun",
	size: 24,
	node: [
		["circle", {
			cx: "12",
			cy: "12",
			r: "4",
			key: "4exip2"
		}],
		["path", {
			d: "M12 2v2",
			key: "tus03m"
		}],
		["path", {
			d: "M12 20v2",
			key: "1lh1kg"
		}],
		["path", {
			d: "m4.93 4.93 1.41 1.41",
			key: "149t6j"
		}],
		["path", {
			d: "m17.66 17.66 1.41 1.41",
			key: "ptbguv"
		}],
		["path", {
			d: "M2 12h2",
			key: "1t8f8n"
		}],
		["path", {
			d: "M20 12h2",
			key: "1q8mjw"
		}],
		["path", {
			d: "m6.34 17.66-1.41 1.41",
			key: "1m8zz5"
		}],
		["path", {
			d: "m19.07 4.93-1.41 1.41",
			key: "1shlcs"
		}]
	]
};
N.node;
var P = M(N), da = {
	name: "target",
	size: 24,
	node: [
		["circle", {
			cx: "12",
			cy: "12",
			r: "10",
			key: "1mglay"
		}],
		["circle", {
			cx: "12",
			cy: "12",
			r: "6",
			key: "1vlfrh"
		}],
		["circle", {
			cx: "12",
			cy: "12",
			r: "2",
			key: "1c9p78"
		}]
	]
};
da.node;
var fa = M(da), pa = {
	name: "trash",
	size: 24,
	node: [
		["path", {
			d: "M10 11v6",
			key: "nco0om"
		}],
		["path", {
			d: "M14 11v6",
			key: "outv1u"
		}],
		["path", {
			d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",
			key: "miytrc"
		}],
		["path", {
			d: "M3 6h18",
			key: "d0wm0j"
		}],
		["path", {
			d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
			key: "e791ji"
		}]
	],
	aliases: ["trash-2"]
};
pa.node;
var ma = M(pa), ha = {
	name: "triangle-alert",
	size: 24,
	node: [
		["path", {
			d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
			key: "wmoenq"
		}],
		["path", {
			d: "M12 9v4",
			key: "juzpu7"
		}],
		["path", {
			d: "M12 17h.01",
			key: "p32p05"
		}]
	],
	aliases: ["alert-triangle"]
};
ha.node;
var ga = M(ha), _a = {
	name: "users",
	size: 24,
	node: [
		["path", {
			d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
			key: "1yyitq"
		}],
		["path", {
			d: "M16 3.128a4 4 0 0 1 0 7.744",
			key: "16gr8j"
		}],
		["path", {
			d: "M22 21v-2a4 4 0 0 0-3-3.87",
			key: "kshegd"
		}],
		["circle", {
			cx: "9",
			cy: "7",
			r: "4",
			key: "nufk8"
		}]
	]
};
_a.node;
var va = M(_a), ya = {
	name: "x",
	size: 24,
	node: [["path", {
		d: "M18 6 6 18",
		key: "1bl5f8"
	}], ["path", {
		d: "m6 6 12 12",
		key: "d8bk6v"
	}]]
};
ya.node;
var ba = M(ya), xa = Object.defineProperty, F = (e, t) => xa(e, "name", {
	value: t,
	configurable: !0
});
// @__NO_SIDE_EFFECTS__
function Sa(e) {
	let t = e + "CollectionProvider", [n, r] = /* @__PURE__ */ ue(t), [i, a] = n(t, {
		collectionRef: { current: null },
		itemMap: /* @__PURE__ */ new Map()
	}), o = /* @__PURE__ */ F((e) => {
		let { scope: t, children: n } = e, r = _.useRef(null), a = _.useRef(/* @__PURE__ */ new Map()).current;
		return /* @__PURE__ */ (0, T.jsx)(i, {
			scope: t,
			itemMap: a,
			collectionRef: r,
			children: n
		});
	}, "CollectionProvider");
	o.displayName = t;
	let s = e + "CollectionSlot", c = /* @__PURE__ */ je(s), l = _.forwardRef((e, t) => {
		let { scope: n, children: r } = e, i = w(t, a(s, n).collectionRef);
		return /* @__PURE__ */ (0, T.jsx)(c, {
			ref: i,
			children: r
		});
	});
	l.displayName = s;
	let u = e + "CollectionItemSlot", d = "data-radix-collection-item", f = /* @__PURE__ */ je(u), p = _.forwardRef((e, t) => {
		let { scope: n, children: r, ...i } = e, o = _.useRef(null), s = w(t, o), c = a(u, n);
		return _.useEffect(() => (c.itemMap.set(o, {
			ref: o,
			...i
		}), () => void c.itemMap.delete(o))), /* @__PURE__ */ (0, T.jsx)(f, {
			[d]: "",
			ref: s,
			children: r
		});
	});
	p.displayName = u;
	function m(t) {
		let n = a(e + "CollectionConsumer", t);
		return _.useCallback(() => {
			let e = n.collectionRef.current;
			if (!e) return [];
			let t = Array.from(e.querySelectorAll(`[${d}]`));
			return Array.from(n.itemMap.values()).sort((e, n) => t.indexOf(e.ref.current) - t.indexOf(n.ref.current));
		}, [n.collectionRef, n.itemMap]);
	}
	return F(m, "useCollection"), [
		{
			Provider: o,
			Slot: l,
			ItemSlot: p
		},
		m,
		r
	];
}
F(Sa, "createCollection");
var Ca = /* @__PURE__ */ new WeakMap(), wa = class e extends Map {
	static {
		F(this, "OrderedDict");
	}
	#e;
	constructor(e) {
		super(e), this.#e = [...super.keys()], Ca.set(this, !0);
	}
	set(e, t) {
		return Ca.get(this) && !this.has(e) && this.#e.push(e), super.set(e, t), this;
	}
	insert(e, t, n) {
		let r = this.has(t), i = r ? this.size : this.size + 1, a = Da(e), o = a >= 0 ? Math.min(a, i - 1) : Math.max(i + a, 0);
		if (r ? this.#e.indexOf(t) === o : o === this.size) return this.set(t, n), this;
		let s = this.#e.filter((e) => e !== t);
		s.splice(o, 0, t);
		let c = s.map((e) => [e, e === t ? n : this.get(e)]);
		this.clear();
		for (let [e, t] of c) this.set(e, t);
		return this;
	}
	with(t, n, r) {
		let i = new e(this);
		return i.insert(t, n, r), i;
	}
	before(e) {
		let t = this.#e.indexOf(e) - 1;
		if (!(t < 0)) return this.entryAt(t);
	}
	setBefore(e, t, n) {
		let r = this.#e.indexOf(e);
		if (r === -1) return this;
		let i = this.#e.indexOf(t), a = i !== -1 && i < r ? r - 1 : r;
		return this.insert(a, t, n);
	}
	after(e) {
		let t = this.#e.indexOf(e);
		if (t = t === -1 || t === this.size - 1 ? -1 : t + 1, t !== -1) return this.entryAt(t);
	}
	setAfter(e, t, n) {
		let r = this.#e.indexOf(e);
		if (r === -1) return this;
		let i = this.#e.indexOf(t), a = i !== -1 && i <= r ? r : r + 1;
		return this.insert(a, t, n);
	}
	first() {
		return this.entryAt(0);
	}
	last() {
		return this.entryAt(-1);
	}
	clear() {
		return this.#e = [], super.clear();
	}
	delete(e) {
		let t = super.delete(e);
		return t && this.#e.splice(this.#e.indexOf(e), 1), t;
	}
	deleteAt(e) {
		let t = this.keyAt(e);
		return t !== void 0 && this.delete(t);
	}
	at(e) {
		let t = Ta(this.#e, e);
		if (t !== void 0) return this.get(t);
	}
	entryAt(e) {
		let t = Ta(this.#e, e);
		if (t !== void 0) return [t, this.get(t)];
	}
	indexOf(e) {
		return this.#e.indexOf(e);
	}
	keyAt(e) {
		return Ta(this.#e, e);
	}
	from(e, t) {
		let n = this.indexOf(e);
		if (n === -1) return;
		let r = n + t;
		return r < 0 && (r = 0), r >= this.size && (r = this.size - 1), this.at(r);
	}
	keyFrom(e, t) {
		let n = this.indexOf(e);
		if (n === -1) return;
		let r = n + t;
		return r < 0 && (r = 0), r >= this.size && (r = this.size - 1), this.keyAt(r);
	}
	find(e, t) {
		let n = 0;
		for (let r of this) {
			if (Reflect.apply(e, t, [
				r,
				n,
				this
			])) return r;
			n++;
		}
	}
	findIndex(e, t) {
		let n = 0;
		for (let r of this) {
			if (Reflect.apply(e, t, [
				r,
				n,
				this
			])) return n;
			n++;
		}
		return -1;
	}
	filter(t, n) {
		let r = [], i = 0;
		for (let e of this) Reflect.apply(t, n, [
			e,
			i,
			this
		]) && r.push(e), i++;
		return new e(r);
	}
	map(t, n) {
		let r = [], i = 0;
		for (let e of this) r.push([e[0], Reflect.apply(t, n, [
			e,
			i,
			this
		])]), i++;
		return new e(r);
	}
	reduce(...e) {
		let [t, n] = e, r = e.length > 1;
		if (!r && this.size === 0) throw TypeError("Reduce of empty OrderedDict with no initial value");
		let i = 0, a = n;
		for (let e of this) a = i === 0 && !r ? e : Reflect.apply(t, this, [
			a,
			e,
			i,
			this
		]), i++;
		return a;
	}
	reduceRight(...e) {
		let [t, n] = e, r = e.length > 1;
		if (!r && this.size === 0) throw TypeError("Reduce of empty OrderedDict with no initial value");
		let i = n;
		for (let e = this.size - 1; e >= 0; e--) {
			let n = this.entryAt(e);
			i = e === this.size - 1 && !r ? n : Reflect.apply(t, this, [
				i,
				n,
				e,
				this
			]);
		}
		return i;
	}
	sort(e) {
		if (typeof e != "function") throw TypeError("OrderedDict.sort requires a compare function");
		let t = [...this.entries()].sort(e);
		this.clear();
		for (let [e, n] of t) this.set(e, n);
		return this;
	}
	toSorted(t) {
		if (typeof t != "function") throw TypeError("OrderedDict.toSorted requires a compare function");
		let n = [...this.entries()].sort(t);
		return new e(n);
	}
	toReversed() {
		let t = new e();
		for (let e = this.size - 1; e >= 0; e--) {
			let n = this.keyAt(e), r = this.get(n);
			t.set(n, r);
		}
		return t;
	}
	toSpliced(...t) {
		let n = [...this.entries()];
		return n.splice(...t), new e(n);
	}
	slice(t, n) {
		let r = new e();
		for (let e of this.#e.slice(t, n)) r.set(e, this.get(e));
		return r;
	}
	every(e, t) {
		let n = 0;
		for (let r of this) {
			if (!Reflect.apply(e, t, [
				r,
				n,
				this
			])) return !1;
			n++;
		}
		return !0;
	}
	some(e, t) {
		let n = 0;
		for (let r of this) {
			if (Reflect.apply(e, t, [
				r,
				n,
				this
			])) return !0;
			n++;
		}
		return !1;
	}
};
function Ta(e, t) {
	if ("at" in Array.prototype) return Array.prototype.at.call(e, t);
	let n = Ea(e, t);
	return n === -1 ? void 0 : e[n];
}
F(Ta, "at");
function Ea(e, t) {
	let n = e.length, r = Da(t), i = r >= 0 ? r : n + r;
	return i < 0 || i >= n ? -1 : i;
}
F(Ea, "toSafeIndex");
function Da(e) {
	return e !== e || e === 0 ? 0 : Math.trunc(e);
}
F(Da, "toSafeInteger");
// @__NO_SIDE_EFFECTS__
function Oa(e) {
	let t = e + "CollectionProvider", [n, r] = /* @__PURE__ */ ue(t), [i, a] = n(t);
	i.displayName = e + "CollectionStableContextProvider";
	let [o, s] = n(t);
	o.displayName = e + "CollectionStatefulContextProvider";
	let c = /* @__PURE__ */ F(({ state: e, ...t }) => e ? /* @__PURE__ */ (0, T.jsx)(u, {
		...t,
		state: e
	}) : /* @__PURE__ */ (0, T.jsx)(l, { ...t }), "CollectionProvider");
	c.displayName = t;
	let l = /* @__PURE__ */ F((e) => {
		let t = v();
		return /* @__PURE__ */ (0, T.jsx)(u, {
			...e,
			state: t
		});
	}, "CollectionInit");
	l.displayName = e + "CollectionInit";
	let u = /* @__PURE__ */ F((e) => {
		let { scope: t, children: n, state: r } = e, a = _.useRef(null), [s, c] = _.useState(null), l = w(a, c), [u, d] = r, f = _.useRef(new wa()), p = _.useCallback(() => {
			let e = f.current;
			return ja(e) || e.sort(Ma), e;
		}, []);
		return _.useEffect(() => {
			if (!s) return;
			let e = Na(() => {
				d((e) => {
					let t = e.toSorted(Ma);
					return t.some(([t], n) => e.keyAt(n) !== t) ? t : e;
				});
			});
			return e.observe(s, {
				childList: !0,
				subtree: !0
			}), () => {
				e.disconnect();
			};
		}, [s, d]), /* @__PURE__ */ (0, T.jsx)(i, {
			scope: t,
			collectionElementRef: l,
			collectionElementRefObject: a,
			getCollection: p,
			setCollection: d,
			registryRef: f,
			children: /* @__PURE__ */ (0, T.jsx)(o, {
				scope: t,
				collectionElement: s,
				collection: u,
				children: n
			})
		});
	}, "CollectionProviderImpl");
	u.displayName = e + "CollectionProviderImpl";
	let d = e + "CollectionSlot", f = /* @__PURE__ */ je(d), p = _.forwardRef((e, t) => {
		let { scope: n, children: r } = e, i = w(t, a(d, n).collectionElementRef);
		return /* @__PURE__ */ (0, T.jsx)(f, {
			ref: i,
			children: r
		});
	});
	p.displayName = d;
	let m = e + "CollectionItemSlot", h = /* @__PURE__ */ je(m), g = _.forwardRef((e, t) => {
		let { scope: n, children: r, ...i } = e, o = _.useRef(null), { setCollection: s, registryRef: c } = a(m, n), l = _.useRef(i);
		ka(l.current, i) || (l.current = i);
		let u = l.current, d = w(t, _.useCallback((e) => {
			let t = c.current;
			e ? t.set(e, {
				...l.current,
				element: e
			}) : o.current && t.delete(o.current);
		}, [c]), o);
		fe(() => {
			let e = o.current, t = c.current;
			e && t.has(e) && t.set(e, {
				...u,
				element: e
			});
		}, [u, c]);
		let f = _.useRef(null);
		return _.useEffect(() => {
			let e = o.current, t = f.current;
			((t?.element ?? null) !== e || e && t?.itemData !== u) && (f.current = e ? {
				element: e,
				itemData: u
			} : null, s((n) => {
				let r = new wa(n);
				return t && t.element !== e && r.delete(t.element), e && r.set(e, {
					...u,
					element: e
				}), r.sort(Ma);
			}));
		}), _.useEffect(() => () => {
			let e = f.current;
			f.current = null, e && s((t) => {
				if (!t.has(e.element)) return t;
				let n = new wa(t);
				return n.delete(e.element), n;
			});
		}, [s]), /* @__PURE__ */ (0, T.jsx)(h, {
			"data-radix-collection-item": "",
			ref: d,
			children: r
		});
	});
	g.displayName = m;
	function v() {
		return _.useState(new wa());
	}
	F(v, "useInitCollection");
	function y(t) {
		let { collection: n } = s(e + "CollectionConsumer", t);
		return n;
	}
	F(y, "useCollection");
	function b(t) {
		let { getCollection: n } = a(e + "CollectionConsumer", t);
		return n;
	}
	return F(b, "useGetCollection"), [{
		Provider: c,
		Slot: p,
		ItemSlot: g
	}, {
		createCollectionScope: r,
		useCollection: y,
		useGetCollection: b,
		useInitCollection: v
	}];
}
F(Oa, "createCollection");
function ka(e, t) {
	if (e === t) return !0;
	if (typeof e != "object" || typeof t != "object" || e == null || t == null) return !1;
	let n = Object.keys(e), r = Object.keys(t);
	if (n.length !== r.length) return !1;
	for (let r of n) if (!Object.prototype.hasOwnProperty.call(t, r) || e[r] !== t[r]) return !1;
	return !0;
}
F(ka, "shallowEqual");
function Aa(e, t) {
	return !!(t.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_PRECEDING);
}
F(Aa, "isElementPreceding");
function ja(e) {
	let t;
	for (let n of e.keys()) {
		if (t) {
			let e = t.compareDocumentPosition(n);
			if (!(e & Node.DOCUMENT_POSITION_DISCONNECTED) && e & Node.DOCUMENT_POSITION_PRECEDING) return !1;
		}
		t = n;
	}
	return !0;
}
F(ja, "isInDocumentOrder");
function Ma(e, t) {
	return !e[1].element || !t[1].element ? 0 : Aa(e[1].element, t[1].element) ? -1 : 1;
}
F(Ma, "sortByDocumentPosition");
function Na(e) {
	return new MutationObserver((t) => {
		for (let n of t) if (n.type === "childList") {
			e();
			return;
		}
	});
}
F(Na, "getChildListObserver");
// node_modules/@radix-ui/react-collapsible/dist/index.mjs
var Pa = Object.defineProperty, Fa = (e, t) => Pa(e, "name", {
	value: t,
	configurable: !0
}), I = "Collapsible", [Ia, La] = /* @__PURE__ */ ue(I), [Ra, za] = Ia(I), Ba = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ Fa(function(e, t) {
	let { __scopeCollapsible: n, open: r, defaultOpen: i, disabled: a, onOpenChange: o, ...s } = e, [c, l] = we({
		prop: r,
		defaultProp: i ?? !1,
		onChange: o,
		caller: I
	});
	return /* @__PURE__ */ (0, T.jsx)(Ra, {
		scope: n,
		disabled: a,
		contentId: _e(),
		open: c,
		onOpenToggle: _.useCallback(() => l((e) => !e), [l]),
		children: /* @__PURE__ */ (0, T.jsx)(Je.div, {
			"data-state": Ka(c),
			"data-disabled": a ? "" : void 0,
			...s,
			ref: t
		})
	});
}, "Collapsible")), Va = "CollapsibleTrigger", Ha = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ Fa(function(e, t) {
	let { __scopeCollapsible: n, ...r } = e, i = za(Va, n);
	return /* @__PURE__ */ (0, T.jsx)(Je.button, {
		type: "button",
		"aria-controls": i.open ? i.contentId : void 0,
		"aria-expanded": i.open || !1,
		"data-state": Ka(i.open),
		"data-disabled": i.disabled ? "" : void 0,
		disabled: i.disabled,
		...r,
		ref: t,
		onClick: x(e.onClick, i.onOpenToggle)
	});
}, "CollapsibleTrigger")), Ua = "CollapsibleContent", Wa = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ Fa(function(e, t) {
	let { forceMount: n, ...r } = e, i = za(Ua, e.__scopeCollapsible);
	return /* @__PURE__ */ (0, T.jsx)(zt, {
		present: n || i.open,
		children: ({ present: e }) => /* @__PURE__ */ (0, T.jsx)(Ga, {
			...r,
			ref: t,
			present: e
		})
	});
}, "CollapsibleContent")), Ga = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ Fa(function(e, t) {
	let { __scopeCollapsible: n, present: r, children: i, ...a } = e, o = za(Ua, n), [s, c] = _.useState(r), l = _.useRef(null), u = w(t, l), d = _.useRef(0), f = d.current, p = _.useRef(0), m = p.current, h = o.open || s, g = _.useRef(h), v = _.useRef(void 0);
	return _.useEffect(() => {
		let e = requestAnimationFrame(() => g.current = !1);
		return () => cancelAnimationFrame(e);
	}, []), fe(() => {
		let e = l.current;
		if (e) {
			v.current = v.current || {
				transitionDuration: e.style.transitionDuration,
				animationName: e.style.animationName
			}, e.style.transitionDuration = "0s", e.style.animationName = "none";
			let t = e.getBoundingClientRect();
			d.current = t.height, p.current = t.width, g.current || (e.style.transitionDuration = v.current.transitionDuration, e.style.animationName = v.current.animationName), c(r);
		}
	}, [o.open, r]), /* @__PURE__ */ (0, T.jsx)(Je.div, {
		"data-state": Ka(o.open),
		"data-disabled": o.disabled ? "" : void 0,
		id: o.contentId,
		hidden: !h,
		...a,
		ref: u,
		style: {
			"--radix-collapsible-content-height": f ? `${f}px` : void 0,
			"--radix-collapsible-content-width": m ? `${m}px` : void 0,
			...e.style
		},
		children: h && i
	});
}, "CollapsibleContentImpl"));
function Ka(e) {
	return e ? "open" : "closed";
}
Fa(Ka, "getState");
// node_modules/@radix-ui/react-direction/dist/index.mjs
var qa = Object.defineProperty, Ja = (e, t) => qa(e, "name", {
	value: t,
	configurable: !0
}), Ya = {
	LTR: "ltr",
	RTL: "rtl"
}, Xa = _.createContext(void 0);
function Za(e) {
	let t = _.useContext(Xa);
	return e || t || Ya.LTR;
}
Ja(Za, "useDirection");
// node_modules/@radix-ui/react-accordion/dist/index.mjs
var Qa = Object.defineProperty, $a = (e, t) => Qa(e, "name", {
	value: t,
	configurable: !0
}), eo = {
	Single: "single",
	Multiple: "multiple"
}, to = {
	Vertical: "vertical",
	Horizontal: "horizontal"
}, no = {
	LTR: "ltr",
	RTL: "rtl"
}, ro = "Accordion", io = [
	"Home",
	"End",
	"ArrowDown",
	"ArrowUp",
	"ArrowLeft",
	"ArrowRight"
], [ao, { useGetCollection: oo, createCollectionScope: so }] = /* @__PURE__ */ Oa(ro), [co, lo] = /* @__PURE__ */ ue(ro, [so, La]), uo = La(), fo = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ $a(function(e, t) {
	let { type: n, ...r } = e, i = r, a = r;
	return /* @__PURE__ */ (0, T.jsx)(ao.Provider, {
		scope: e.__scopeAccordion,
		children: n === eo.Multiple ? /* @__PURE__ */ (0, T.jsx)(vo, {
			...a,
			ref: t
		}) : /* @__PURE__ */ (0, T.jsx)(_o, {
			...i,
			ref: t
		})
	});
}, "Accordion")), [po, mo] = co(ro), [ho, go] = co(ro, { collapsible: !1 }), _o = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ $a(function(e, t) {
	let { value: n, defaultValue: r, onValueChange: i = /* @__PURE__ */ $a(() => {}, "onValueChange"), collapsible: a = !1, ...o } = e, [s, c] = we({
		prop: n,
		defaultProp: r ?? "",
		onChange: i,
		caller: ro
	});
	return /* @__PURE__ */ (0, T.jsx)(po, {
		scope: e.__scopeAccordion,
		value: _.useMemo(() => s ? [s] : [], [s]),
		onItemOpen: c,
		onItemClose: _.useCallback(() => a && c(""), [a, c]),
		children: /* @__PURE__ */ (0, T.jsx)(ho, {
			scope: e.__scopeAccordion,
			collapsible: a,
			children: /* @__PURE__ */ (0, T.jsx)(xo, {
				...o,
				ref: t
			})
		})
	});
}, "AccordionImplSingle")), vo = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ $a(function(e, t) {
	let { value: n, defaultValue: r, onValueChange: i = /* @__PURE__ */ $a(() => {}, "onValueChange"), ...a } = e, [o, s] = we({
		prop: n,
		defaultProp: r ?? [],
		onChange: i,
		caller: ro
	}), c = _.useCallback((e) => s((t = []) => [...t, e]), [s]), l = _.useCallback((e) => s((t = []) => t.filter((t) => t !== e)), [s]);
	return /* @__PURE__ */ (0, T.jsx)(po, {
		scope: e.__scopeAccordion,
		value: o,
		onItemOpen: c,
		onItemClose: l,
		children: /* @__PURE__ */ (0, T.jsx)(ho, {
			scope: e.__scopeAccordion,
			collapsible: !0,
			children: /* @__PURE__ */ (0, T.jsx)(xo, {
				...a,
				ref: t
			})
		})
	});
}, "AccordionImplMultiple")), [yo, bo] = co(ro), xo = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ $a(function(e, t) {
	let { __scopeAccordion: n, disabled: r, dir: i, orientation: a = to.Vertical, ...o } = e, s = w(_.useRef(null), t), c = oo(n), l = Za(i) === no.LTR, u = x(e.onKeyDown, (e) => {
		if (!io.includes(e.key)) return;
		let t = c(), n = e.target, r = t.filter(([, e]) => !e.element.disabled), i = r.findIndex(([, e]) => e.element === n), o = r.size;
		if (i === -1) return;
		e.preventDefault();
		let s = i, u = o - 1, d = /* @__PURE__ */ $a(() => {
			s = i + 1, s > u && (s = 0);
		}, "moveNext"), f = /* @__PURE__ */ $a(() => {
			s = i - 1, s < 0 && (s = u);
		}, "movePrev");
		switch (e.key) {
			case "Home":
				s = 0;
				break;
			case "End":
				s = u;
				break;
			case "ArrowRight":
				a === to.Horizontal && (l ? d() : f());
				break;
			case "ArrowDown":
				a === to.Vertical && d();
				break;
			case "ArrowLeft":
				a === to.Horizontal && (l ? f() : d());
				break;
			case "ArrowUp": a === to.Vertical && f();
		}
		let p = s % o;
		r.at(p)?.element.focus();
	});
	return /* @__PURE__ */ (0, T.jsx)(yo, {
		scope: n,
		disabled: r,
		direction: i,
		orientation: a,
		children: /* @__PURE__ */ (0, T.jsx)(ao.Slot, {
			scope: n,
			children: /* @__PURE__ */ (0, T.jsx)(Je.div, {
				...o,
				"data-orientation": a,
				ref: s,
				onKeyDown: r ? void 0 : u
			})
		})
	});
}, "AccordionImpl")), So = "AccordionItem", [Co, wo] = co(So), To = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ $a(function(e, t) {
	let { __scopeAccordion: n, value: r, ...i } = e, a = bo(So, n), o = mo(So, n), s = uo(n), c = _e(), l = r && o.value.includes(r) || !1, u = a.disabled || e.disabled;
	return /* @__PURE__ */ (0, T.jsx)(Co, {
		scope: n,
		open: l,
		disabled: u,
		triggerId: c,
		children: /* @__PURE__ */ (0, T.jsx)(Ba, {
			"data-orientation": a.orientation,
			"data-state": Mo(l),
			...s,
			...i,
			ref: t,
			disabled: u,
			open: l,
			onOpenChange: (e) => {
				e ? o.onItemOpen(r) : o.onItemClose(r);
			}
		})
	});
}, "AccordionItem")), Eo = "AccordionHeader", Do = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ $a(function(e, t) {
	let { __scopeAccordion: n, ...r } = e, i = bo(ro, n), a = wo(Eo, n);
	return /* @__PURE__ */ (0, T.jsx)(Je.h3, {
		"data-orientation": i.orientation,
		"data-state": Mo(a.open),
		"data-disabled": a.disabled ? "" : void 0,
		...r,
		ref: t
	});
}, "AccordionHeader")), Oo = "AccordionTrigger", ko = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ $a(function(e, t) {
	let { __scopeAccordion: n, ...r } = e, i = bo(ro, n), a = wo(Oo, n), o = go(Oo, n), s = uo(n);
	return /* @__PURE__ */ (0, T.jsx)(ao.ItemSlot, {
		scope: n,
		children: /* @__PURE__ */ (0, T.jsx)(Ha, {
			"aria-disabled": a.open && !o.collapsible || void 0,
			"data-orientation": i.orientation,
			id: a.triggerId,
			...s,
			...r,
			ref: t
		})
	});
}, "AccordionTrigger")), Ao = "AccordionContent", jo = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ $a(function(e, t) {
	let { __scopeAccordion: n, ...r } = e, i = bo(ro, n), a = wo(Ao, n), o = uo(n);
	return /* @__PURE__ */ (0, T.jsx)(Wa, {
		role: "region",
		"aria-labelledby": a.triggerId,
		"data-orientation": i.orientation,
		...o,
		...r,
		ref: t,
		style: {
			"--radix-accordion-content-height": "var(--radix-collapsible-content-height)",
			"--radix-accordion-content-width": "var(--radix-collapsible-content-width)",
			...e.style
		}
	});
}, "AccordionContent"));
function Mo(e) {
	return e ? "open" : "closed";
}
$a(Mo, "getState");
// react-ui/src/components.tsx
function No({ title: e, children: t, icon: n, note: r }) {
	return /* @__PURE__ */ (0, T.jsx)(fo, {
		className: "sl-disclosure",
		type: "single",
		collapsible: !0,
		children: /* @__PURE__ */ (0, T.jsxs)(To, {
			value: "content",
			children: [/* @__PURE__ */ (0, T.jsx)(Do, { children: /* @__PURE__ */ (0, T.jsxs)(ko, {
				className: "sl-disclosure-trigger",
				children: [
					n && /* @__PURE__ */ (0, T.jsx)(n, { size: 18 }),
					/* @__PURE__ */ (0, T.jsxs)("span", { children: [e, r && /* @__PURE__ */ (0, T.jsx)("small", { children: r })] }),
					/* @__PURE__ */ (0, T.jsx)(bi, {
						size: 17,
						className: "sl-chevron"
					})
				]
			}) }), /* @__PURE__ */ (0, T.jsx)(jo, {
				className: "sl-disclosure-content",
				children: /* @__PURE__ */ (0, T.jsx)("div", { children: t })
			})]
		})
	});
}
function L({ name: e, label: t, state: n, bridge: r, placeholder: i, error: a, hint: o, rows: s, options: c, wide: l }) {
	let u = `react-${e}`, d = {
		id: u,
		value: n.fields[e],
		onChange: (t) => r.setField(e, t.target.value),
		"aria-invalid": a ? !0 : void 0,
		"aria-describedby": a || o ? `${u}-hint` : void 0
	};
	return /* @__PURE__ */ (0, T.jsxs)("div", {
		className: `sl-field${l ? " sl-wide" : ""}`,
		children: [
			/* @__PURE__ */ (0, T.jsx)("label", {
				htmlFor: u,
				children: t
			}),
			c ? /* @__PURE__ */ (0, T.jsxs)("div", {
				className: "sl-select-wrap",
				children: [/* @__PURE__ */ (0, T.jsx)("select", {
					...d,
					children: c.map((e) => /* @__PURE__ */ (0, T.jsx)("option", {
						value: e.value,
						disabled: e.disabled,
						children: e.label
					}, e.value))
				}), /* @__PURE__ */ (0, T.jsx)(bi, {
					size: 17,
					"aria-hidden": "true"
				})]
			}) : s ? /* @__PURE__ */ (0, T.jsx)("textarea", {
				...d,
				rows: s,
				maxLength: 2e3,
				placeholder: i
			}) : /* @__PURE__ */ (0, T.jsx)("input", {
				...d,
				maxLength: e === "titulo" ? 240 : 300,
				placeholder: i
			}),
			(a || o) && /* @__PURE__ */ (0, T.jsx)("small", {
				id: `${u}-hint`,
				className: a ? "sl-field-error" : "",
				children: a || o
			})
		]
	});
}
function Po({ eyebrow: e, title: t, description: n, icon: r }) {
	return /* @__PURE__ */ (0, T.jsxs)("div", {
		className: "sl-card-heading",
		children: [/* @__PURE__ */ (0, T.jsx)("span", {
			className: "sl-card-icon",
			children: /* @__PURE__ */ (0, T.jsx)(r, { size: 23 })
		}), /* @__PURE__ */ (0, T.jsxs)("div", { children: [
			/* @__PURE__ */ (0, T.jsx)("span", {
				className: "sl-eyebrow",
				children: e
			}),
			/* @__PURE__ */ (0, T.jsx)("h2", {
				id: "react-step-heading",
				tabIndex: -1,
				children: t
			}),
			/* @__PURE__ */ (0, T.jsx)("p", { children: n })
		] })]
	});
}
// react-ui/src/DataStep.tsx
function Fo({ state: e, bridge: t, errors: n }) {
	let r = {
		INICIAL: "Inicial",
		PRIMARIA: "Primaria",
		SECUNDARIA: "Secundaria"
	}, i = e.grades.includes(e.fields.grado), a = [{
		value: "",
		label: e.fields.nivel === "INICIAL" ? "Selecciona la edad" : "Selecciona el grado"
	}, ...e.grades.map((e) => ({
		value: e,
		label: e.includes("años") ? e : `${e.replace("°", ".º")} grado`
	}))];
	return e.fields.grado && !i && a.push({
		value: e.fields.grado,
		label: `${e.fields.grado} · revisa el nivel`
	}), /* @__PURE__ */ (0, T.jsxs)("section", {
		className: "sl-card sl-main-card",
		"aria-labelledby": "react-step-heading",
		children: [/* @__PURE__ */ (0, T.jsx)(Po, {
			icon: Mi,
			eyebrow: "EL PUNTO DE PARTIDA",
			title: "Cuéntanos sobre tu clase",
			description: "Solo lo esencial para crear una sesión que conecte con tus estudiantes."
		}), /* @__PURE__ */ (0, T.jsxs)("div", {
			className: "sl-form-body",
			children: [
				/* @__PURE__ */ (0, T.jsxs)("fieldset", {
					className: "sl-level-field",
					children: [/* @__PURE__ */ (0, T.jsx)("legend", { children: "Nivel educativo" }), /* @__PURE__ */ (0, T.jsx)("div", {
						className: "sl-levels",
						children: [
							{
								value: "INICIAL",
								Icon: ua
							},
							{
								value: "PRIMARIA",
								Icon: fi
							},
							{
								value: "SECUNDARIA",
								Icon: Mi
							}
						].map(({ value: n, Icon: i }) => /* @__PURE__ */ (0, T.jsxs)("button", {
							type: "button",
							className: e.fields.nivel === n ? "sl-level selected" : "sl-level",
							"aria-pressed": e.fields.nivel === n,
							onClick: () => t.setField("nivel", n),
							children: [
								/* @__PURE__ */ (0, T.jsx)(i, { size: 22 }),
								/* @__PURE__ */ (0, T.jsx)("span", { children: r[n] }),
								/* @__PURE__ */ (0, T.jsx)("span", { className: "sl-radio-dot" })
							]
						}, n))
					})]
				}),
				/* @__PURE__ */ (0, T.jsxs)("div", {
					className: "sl-field-grid",
					children: [
						/* @__PURE__ */ (0, T.jsx)(L, {
							name: "grado",
							label: e.fields.nivel === "INICIAL" ? "Edad de tus estudiantes" : "Grado de tus estudiantes",
							state: e,
							bridge: t,
							options: a,
							error: n.grado
						}),
						/* @__PURE__ */ (0, T.jsx)(L, {
							name: "area",
							label: "Área curricular",
							state: e,
							bridge: t,
							options: e.areas.map((e) => e.value ? e : {
								...e,
								label: "Selecciona un área"
							}),
							error: n.area
						}),
						/* @__PURE__ */ (0, T.jsx)(L, {
							name: "titulo",
							label: "¿Qué aprenderán hoy?",
							state: e,
							bridge: t,
							placeholder: "Ej. Descubrimos las matemáticas en nuestro mercado",
							hint: "Dale un título que describa el aprendizaje de la sesión.",
							error: n.titulo,
							wide: !0
						}),
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "sl-duration sl-wide",
							children: [/* @__PURE__ */ (0, T.jsxs)("div", {
								className: "sl-duration-heading",
								children: [/* @__PURE__ */ (0, T.jsx)(Ei, { size: 17 }), /* @__PURE__ */ (0, T.jsx)("span", { children: "Tiempo para aprender" })]
							}), /* @__PURE__ */ (0, T.jsxs)("div", {
								className: "sl-duration-options",
								children: [[
									45,
									60,
									90,
									120
								].map((n) => /* @__PURE__ */ (0, T.jsxs)("button", {
									type: "button",
									"aria-pressed": parseInt(e.fields.duracion) === n,
									className: parseInt(e.fields.duracion) === n ? "selected" : "",
									onClick: () => t.setField("duracion", `${n} min`),
									children: [n, /* @__PURE__ */ (0, T.jsx)("small", { children: " min" })]
								}, n)), /* @__PURE__ */ (0, T.jsx)(L, {
									name: "duracion",
									label: "Duración personalizada",
									state: e,
									bridge: t,
									placeholder: "Ej. 80 min",
									error: n.duracion
								})]
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, T.jsxs)(No, {
					icon: mi,
					title: "Tu institución y tu aula",
					note: "Opcional · puedes completarlo después",
					children: [/* @__PURE__ */ (0, T.jsxs)("div", {
						className: "sl-field-grid",
						children: [
							/* @__PURE__ */ (0, T.jsx)(L, {
								name: "institucion",
								label: "Institución educativa",
								state: e,
								bridge: t,
								wide: !0
							}),
							/* @__PURE__ */ (0, T.jsx)(L, {
								name: "docente",
								label: "Docente",
								state: e,
								bridge: t
							}),
							/* @__PURE__ */ (0, T.jsx)(L, {
								name: "seccion",
								label: "Sección",
								state: e,
								bridge: t,
								placeholder: "Ej. A"
							}),
							/* @__PURE__ */ (0, T.jsx)(L, {
								name: "director",
								label: "Director/a",
								state: e,
								bridge: t
							}),
							/* @__PURE__ */ (0, T.jsx)(L, {
								name: "ugel",
								label: "UGEL",
								state: e,
								bridge: t
							})
						]
					}), /* @__PURE__ */ (0, T.jsx)("p", {
						className: "sl-small-note",
						children: "Usamos los datos disponibles de tu perfil sin reemplazar lo que ya escribiste."
					})]
				})
			]
		})]
	});
}
// react-ui/src/bridge.ts
var Io = (e) => e.split(/[;\n]+/).map((e) => e.trim().replace(/^[•*]\s*/, "")).filter(Boolean), Lo = (e) => e.trim().replace(/[.。]+$/u, "").replace(/\s+/g, " ").toLocaleLowerCase("es"), Ro = (e, t) => Io(e).some((e) => Lo(e) === Lo(t));
// react-ui/src/LearningStep.tsx
function zo({ state: e, bridge: t }) {
	let n = e.profiles.filter((t) => Ro(e.fields.competencia, t.competency.officialName));
	return /* @__PURE__ */ (0, T.jsxs)("section", {
		className: "sl-card sl-main-card",
		"aria-labelledby": "react-step-heading",
		children: [/* @__PURE__ */ (0, T.jsx)(Po, {
			icon: ui,
			eyebrow: "CON INTENCIÓN PEDAGÓGICA",
			title: "Define los aprendizajes",
			description: "Elige qué trabajarán tus estudiantes y aporta tus ideas para la clase."
		}), /* @__PURE__ */ (0, T.jsxs)("div", {
			className: "sl-form-body",
			children: [
				/* @__PURE__ */ (0, T.jsxs)("div", {
					className: e.profiles.length ? "sl-inline-info" : "sl-inline-info caution",
					children: [/* @__PURE__ */ (0, T.jsx)(ga, { size: 19 }), /* @__PURE__ */ (0, T.jsx)("p", { children: e.profiles.length ? "Referencias curriculares de perfiles piloto. Revisa su correspondencia con tu programa curricular." : e.curriculumStatus || "Comprobando la cobertura curricular…" })]
				}),
				/* @__PURE__ */ (0, T.jsxs)("div", {
					className: "sl-section-label",
					children: [/* @__PURE__ */ (0, T.jsx)("h3", { children: "Competencias y capacidades" }), /* @__PURE__ */ (0, T.jsxs)("span", {
						className: "sl-count",
						children: [n.length, " seleccionadas"]
					})]
				}),
				/* @__PURE__ */ (0, T.jsx)("div", {
					className: "sl-competencies",
					children: e.profiles.map((n, r) => {
						let i = Ro(e.fields.competencia, n.competency.officialName);
						return /* @__PURE__ */ (0, T.jsxs)("div", {
							className: `sl-competency${i ? " selected" : ""}`,
							children: [/* @__PURE__ */ (0, T.jsxs)("label", {
								className: "sl-competency-label",
								children: [/* @__PURE__ */ (0, T.jsx)("input", {
									type: "checkbox",
									checked: i,
									onChange: () => t.toggleCompetency(r)
								}), /* @__PURE__ */ (0, T.jsx)("span", { children: n.competency.officialName })]
							}), i && /* @__PURE__ */ (0, T.jsx)("div", {
								className: "sl-capacities",
								children: n.capacities.map((n, i) => /* @__PURE__ */ (0, T.jsxs)("label", { children: [/* @__PURE__ */ (0, T.jsx)("input", {
									type: "checkbox",
									checked: Ro(e.fields.capacidad, n.officialName),
									onChange: () => t.toggleCapacity(r, i)
								}), /* @__PURE__ */ (0, T.jsx)("span", { children: n.officialName })] }, n.officialName))
							})]
						}, n.id);
					})
				}),
				/* @__PURE__ */ (0, T.jsxs)(No, {
					icon: Qi,
					title: e.profiles.length ? "Ajustar o aportar aprendizajes manualmente" : "Añadir aprendizajes de tu programa curricular",
					children: [/* @__PURE__ */ (0, T.jsx)(L, {
						name: "competencia",
						label: "Competencias",
						state: e,
						bridge: t,
						rows: 3,
						hint: "Una por línea o separadas por punto y coma."
					}), /* @__PURE__ */ (0, T.jsx)(L, {
						name: "capacidad",
						label: "Capacidades",
						state: e,
						bridge: t,
						rows: 3
					})]
				}),
				/* @__PURE__ */ (0, T.jsx)(L, {
					name: "desempeno",
					label: "Desempeño precisado",
					state: e,
					bridge: t,
					rows: 3,
					placeholder: "¿Qué desempeño observable esperas en esta sesión?",
					hint: "Aporta el desempeño de tu programa curricular y contextualízalo para tu aula."
				}),
				n.length > 0 && /* @__PURE__ */ (0, T.jsx)(No, {
					icon: ui,
					title: "Consultar desempeños de referencia",
					children: n.map((t) => /* @__PURE__ */ (0, T.jsxs)("div", {
						className: "sl-reference",
						children: [
							/* @__PURE__ */ (0, T.jsx)("strong", { children: t.competency.officialName }),
							/* @__PURE__ */ (0, T.jsx)("p", { children: t.provenance?.reviewNote || "Referencia piloto sujeta a cotejo con el programa curricular del MINEDU." }),
							/* @__PURE__ */ (0, T.jsx)("ul", { children: (t.performancesByGrade?.[e.fields.grado.match(/\d+/)?.[0] || ""] || []).map((e) => /* @__PURE__ */ (0, T.jsx)("li", { children: e.description }, e.description)) })
						]
					}, t.id))
				}),
				/* @__PURE__ */ (0, T.jsxs)("div", {
					className: "sl-ideas-card",
					children: [
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "sl-ideas-heading",
							children: [
								/* @__PURE__ */ (0, T.jsx)("span", { children: /* @__PURE__ */ (0, T.jsx)(Ri, { size: 21 }) }),
								/* @__PURE__ */ (0, T.jsxs)("div", { children: [/* @__PURE__ */ (0, T.jsx)("h3", { children: "Tus ideas hacen la diferencia" }), /* @__PURE__ */ (0, T.jsx)("p", { children: "Propuestas editables, separadas de las referencias curriculares." })] }),
								/* @__PURE__ */ (0, T.jsx)(ca, { size: 19 })
							]
						}),
						/* @__PURE__ */ (0, T.jsx)(L, {
							name: "activities",
							label: "Actividades que te gustaría incluir",
							state: e,
							bridge: t,
							rows: 3,
							placeholder: "Ej. Explorar precios del mercado y comparar cantidades en equipos"
						}),
						/* @__PURE__ */ (0, T.jsx)(L, {
							name: "criteria",
							label: "Criterios de evaluación",
							state: e,
							bridge: t,
							rows: 3,
							placeholder: "¿Cómo reconocerás que están aprendiendo? Un criterio por línea."
						}),
						/* @__PURE__ */ (0, T.jsx)(L, {
							name: "evidence",
							label: "Evidencia de aprendizaje",
							state: e,
							bridge: t,
							rows: 2,
							placeholder: "¿Qué producirán o demostrarán tus estudiantes?"
						}),
						/* @__PURE__ */ (0, T.jsx)("p", {
							className: "sl-small-note",
							children: "Si dejas estas propuestas vacías, podrás revisar las que complete la IA al generar. No se presentarán como textos curriculares oficiales."
						})
					]
				})
			]
		})]
	});
}
// react-ui/src/ReviewStep.tsx
function Bo({ state: e, bridge: t }) {
	let n = e.fields;
	return /* @__PURE__ */ (0, T.jsxs)("section", {
		className: "sl-card sl-main-card",
		"aria-labelledby": "react-step-heading",
		children: [/* @__PURE__ */ (0, T.jsx)(Po, {
			icon: vi,
			eyebrow: "DALE EL ÚLTIMO VISTAZO",
			title: "Tu sesión está tomando forma",
			description: "Revisa el contexto y ajusta lo que necesites antes de generar."
		}), /* @__PURE__ */ (0, T.jsxs)("div", {
			className: "sl-form-body",
			children: [
				/* @__PURE__ */ (0, T.jsxs)("div", {
					className: "sl-review-title",
					children: [/* @__PURE__ */ (0, T.jsx)("span", {
						className: "sl-review-check",
						children: /* @__PURE__ */ (0, T.jsx)(gi, { size: 22 })
					}), /* @__PURE__ */ (0, T.jsxs)("div", { children: [
						/* @__PURE__ */ (0, T.jsx)("small", { children: "SESIÓN DE APRENDIZAJE" }),
						/* @__PURE__ */ (0, T.jsx)("h3", { children: n.titulo }),
						/* @__PURE__ */ (0, T.jsxs)("p", { children: [[
							n.nivel,
							n.grado,
							n.area
						].filter(Boolean).join(" · "), /* @__PURE__ */ (0, T.jsxs)("span", { children: [" · ", n.duracion] })] })
					] })]
				}),
				/* @__PURE__ */ (0, T.jsx)("div", {
					className: "sl-review-grid",
					children: [
						["Competencias", n.competencia],
						["Capacidades", n.capacidad],
						["Desempeño", n.desempeno],
						["Actividades propuestas", n.activities],
						["Criterios de evaluación", n.criteria],
						["Evidencia", n.evidence]
					].map(([e, t]) => /* @__PURE__ */ (0, T.jsxs)("div", { children: [/* @__PURE__ */ (0, T.jsx)("h4", { children: e }), /* @__PURE__ */ (0, T.jsx)("p", { children: t || "Por definir y revisar con el resultado" })] }, e))
				}),
				e.warnings.length > 0 && /* @__PURE__ */ (0, T.jsx)(No, {
					icon: ga,
					title: "Aspectos para revisar",
					note: `${e.warnings.length} observaciones · no bloquean por sí solas la generación`,
					children: /* @__PURE__ */ (0, T.jsx)("ul", {
						className: "sl-warning-list",
						children: e.warnings.map((e) => /* @__PURE__ */ (0, T.jsx)("li", { children: e }, e))
					})
				}),
				/* @__PURE__ */ (0, T.jsxs)("div", {
					className: "sl-section-label",
					children: [/* @__PURE__ */ (0, T.jsx)("h3", { children: "A tu manera" }), /* @__PURE__ */ (0, T.jsx)("span", { children: "Opciones adicionales" })]
				}),
				/* @__PURE__ */ (0, T.jsxs)(No, {
					icon: na,
					title: "IA y metodología",
					note: "Calidad de generación y enfoque didáctico",
					children: [
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "sl-field-grid",
							children: [/* @__PURE__ */ (0, T.jsx)(L, {
								name: "quality",
								label: "Modo de calidad",
								state: e,
								bridge: t,
								options: e.qualities
							}), /* @__PURE__ */ (0, T.jsx)(L, {
								name: "methodology",
								label: "Metodología",
								state: e,
								bridge: t,
								options: e.methodologies
							})]
						}),
						/* @__PURE__ */ (0, T.jsx)("p", {
							className: "sl-small-note",
							children: "Las opciones dependen de tu cuenta y disponibilidad. Los créditos y permisos se comprueban al generar."
						}),
						/* @__PURE__ */ (0, T.jsx)("button", {
							className: "sl-text-button",
							type: "button",
							onClick: () => void t.refreshAvailability(),
							children: "Volver a comprobar disponibilidad"
						})
					]
				}),
				/* @__PURE__ */ (0, T.jsxs)(No, {
					icon: Xi,
					title: "Material de referencia",
					note: e.sourceFile || "Un archivo para dar contexto a la IA",
					children: [e.sourceFile ? /* @__PURE__ */ (0, T.jsxs)("div", {
						className: "sl-attached-file",
						children: [
							/* @__PURE__ */ (0, T.jsx)(Oi, { size: 22 }),
							/* @__PURE__ */ (0, T.jsx)("span", { children: e.sourceFile }),
							/* @__PURE__ */ (0, T.jsx)("button", {
								type: "button",
								className: "sl-icon-button",
								"aria-label": "Quitar archivo",
								onClick: () => t.removeAttachment(),
								children: /* @__PURE__ */ (0, T.jsx)(ma, { size: 18 })
							})
						]
					}) : /* @__PURE__ */ (0, T.jsxs)("label", {
						className: "sl-upload",
						children: [
							/* @__PURE__ */ (0, T.jsx)(Xi, { size: 25 }),
							/* @__PURE__ */ (0, T.jsx)("strong", { children: "Añade una referencia para tu clase" }),
							/* @__PURE__ */ (0, T.jsx)("span", { children: "Un material que ayude a contextualizar el aprendizaje." }),
							/* @__PURE__ */ (0, T.jsx)("input", {
								"aria-label": "Adjuntar referencia",
								type: "file",
								onChange: (e) => {
									let n = e.target.files?.[0];
									n && t.setAttachment(n);
								}
							})
						]
					}), /* @__PURE__ */ (0, T.jsx)(L, {
						name: "sourceInstruction",
						label: "¿Cómo usamos esta referencia?",
						state: e,
						bridge: t,
						rows: 2,
						placeholder: "Ej. Toma la situación de la primera página como punto de partida"
					})]
				}),
				/* @__PURE__ */ (0, T.jsxs)(No, {
					icon: Ji,
					title: "Documento y presentación",
					note: "Plantilla y estilo de exportación",
					children: [/* @__PURE__ */ (0, T.jsxs)("div", {
						className: "sl-field-grid",
						children: [/* @__PURE__ */ (0, T.jsx)(L, {
							name: "template",
							label: "Tipo de sesión",
							state: e,
							bridge: t,
							options: e.templates
						}), /* @__PURE__ */ (0, T.jsx)(L, {
							name: "designPreset",
							label: "Estilo del documento",
							state: e,
							bridge: t,
							options: e.presets
						})]
					}), /* @__PURE__ */ (0, T.jsx)("button", {
						type: "button",
						className: "sl-text-button",
						onClick: () => t.showLegacy("advanced"),
						children: "Abrir todas las opciones del editor"
					})]
				}),
				/* @__PURE__ */ (0, T.jsx)(No, {
					icon: va,
					title: "Estudiantes",
					note: Io(n.alumnos).length ? `${Io(n.alumnos).length} registrados` : "Opcional · puedes generar sin una lista",
					children: /* @__PURE__ */ (0, T.jsx)(L, {
						name: "alumnos",
						label: "Lista de estudiantes",
						state: e,
						bridge: t,
						rows: 5,
						hint: "Un nombre por línea. Puedes añadir la lista después de generar."
					})
				}),
				/* @__PURE__ */ (0, T.jsxs)("div", {
					className: "sl-generation-note",
					children: [/* @__PURE__ */ (0, T.jsx)(ca, { size: 20 }), /* @__PURE__ */ (0, T.jsx)("p", { children: "La IA elaborará una propuesta para tu revisión. Mantén esta pestaña abierta durante la generación y comprueba el resultado antes de usarlo en clase." })]
				}),
				e.hasDocument && /* @__PURE__ */ (0, T.jsx)("p", {
					className: "sl-small-note",
					children: "Las propuestas que ajustes aquí se aplican al generar de nuevo. Para editar directamente la sesión guardada, abre el editor avanzado."
				})
			]
		})]
	});
}
// react-ui/src/SessionSummary.tsx
function Vo({ state: e }) {
	let t = e.fields;
	return /* @__PURE__ */ (0, T.jsxs)("aside", {
		className: "sl-summary",
		"aria-label": "Resumen de tu sesión",
		children: [
			/* @__PURE__ */ (0, T.jsxs)("div", {
				className: "sl-session-preview",
				children: [
					/* @__PURE__ */ (0, T.jsxs)("div", {
						className: "sl-preview-pattern",
						"aria-hidden": "true",
						children: [
							/* @__PURE__ */ (0, T.jsx)("span", {}),
							/* @__PURE__ */ (0, T.jsx)("span", {}),
							/* @__PURE__ */ (0, T.jsx)("span", {}),
							/* @__PURE__ */ (0, T.jsx)(fi, { size: 44 })
						]
					}),
					/* @__PURE__ */ (0, T.jsx)("span", {
						className: "sl-preview-kicker",
						children: "ASÍ VA TU SESIÓN"
					}),
					/* @__PURE__ */ (0, T.jsx)("h3", {
						className: t.titulo ? "" : "empty",
						children: t.titulo || "Una idea que se convierte en aprendizaje"
					}),
					/* @__PURE__ */ (0, T.jsxs)("div", {
						className: "sl-preview-tags",
						children: [/* @__PURE__ */ (0, T.jsxs)("span", { children: [/* @__PURE__ */ (0, T.jsx)(Mi, { size: 14 }), t.grado || "Tu grupo"] }), /* @__PURE__ */ (0, T.jsxs)("span", { children: [/* @__PURE__ */ (0, T.jsx)(Ei, { size: 14 }), t.duracion || "Tu tiempo"] })]
					}),
					/* @__PURE__ */ (0, T.jsxs)("div", {
						className: "sl-preview-area",
						children: [/* @__PURE__ */ (0, T.jsx)("span", { children: t.area || "Elige un área curricular" }), /* @__PURE__ */ (0, T.jsx)(ci, { size: 17 })]
					})
				]
			}),
			/* @__PURE__ */ (0, T.jsxs)("div", {
				className: "sl-summary-details",
				children: [/* @__PURE__ */ (0, T.jsxs)("div", {
					className: "sl-section-label",
					children: [/* @__PURE__ */ (0, T.jsx)("h3", { children: "Una clase con propósito" }), /* @__PURE__ */ (0, T.jsx)("span", { className: "sl-status-dot" })]
				}), [
					{
						Icon: fa,
						title: "Aprendizajes claros",
						text: Io(t.competencia).length ? `${Io(t.competencia).length} competencias seleccionadas` : "Competencias y criterios de evaluación"
					},
					{
						Icon: Ii,
						title: "Una secuencia completa",
						text: "Inicio, desarrollo y cierre"
					},
					{
						Icon: Oi,
						title: "Lista para trabajar",
						text: "Revisa, edita y exporta a Word o PDF"
					}
				].map(({ Icon: e, title: t, text: n }) => /* @__PURE__ */ (0, T.jsxs)("div", {
					className: "sl-summary-item",
					children: [
						/* @__PURE__ */ (0, T.jsx)("span", { children: /* @__PURE__ */ (0, T.jsx)(e, { size: 18 }) }),
						/* @__PURE__ */ (0, T.jsxs)("div", { children: [/* @__PURE__ */ (0, T.jsx)("strong", { children: t }), /* @__PURE__ */ (0, T.jsx)("p", { children: n })] }),
						/* @__PURE__ */ (0, T.jsx)(gi, { size: 14 })
					]
				}, t))]
			}),
			/* @__PURE__ */ (0, T.jsxs)("div", {
				className: "sl-teacher-note",
				children: [/* @__PURE__ */ (0, T.jsx)(ia, { size: 20 }), /* @__PURE__ */ (0, T.jsxs)("div", { children: [/* @__PURE__ */ (0, T.jsx)("strong", { children: "Tu criterio, siempre al centro." }), /* @__PURE__ */ (0, T.jsx)("p", { children: "La IA propone. Tú revisas y adaptas cada aprendizaje a tu aula." })] })]
			})
		]
	});
}
// react-ui/src/App.tsx
var Ho = [
	{
		title: "Datos",
		description: "El contexto de tu clase",
		Icon: Mi
	},
	{
		title: "Aprendizajes",
		description: "Qué y cómo aprenderán",
		Icon: fi
	},
	{
		title: "Revisar y generar",
		description: "Tu último vistazo",
		Icon: ca
	}
];
function Uo({ bridge: e }) {
	let t = (0, _.useSyncExternalStore)(e.subscribe, e.getSnapshot), [n, r] = (0, _.useState)(0), [i, a] = (0, _.useState)({}), [o, s] = (0, _.useState)(""), [c, l] = (0, _.useState)(!1), u = (0, _.useRef)(null);
	(0, _.useEffect)(() => {
		if (![
			"#/app",
			"#/editor",
			"#/sessions/new"
		].includes(window.location.hash)) return;
		e.prepare();
		let t = e.getSnapshot();
		!t.hasDocument && !t.fields.duracion && e.setField("duracion", "90 min");
	}, [e]), (0, _.useEffect)(() => {
		let e = () => {
			r(0), a({}), s("");
		};
		return window.addEventListener("spacelab:session-cleared", e), () => window.removeEventListener("spacelab:session-cleared", e);
	}, []), (0, _.useLayoutEffect)(() => {
		t.view === "wizard" && (u.current?.scrollTo({
			top: 0,
			behavior: "instant"
		}), document.getElementById("react-step-heading")?.focus({ preventScroll: !0 }));
	}, [n, t.view]), (0, _.useEffect)(() => {
		window.dispatchEvent(new CustomEvent("spacelab:frontend-navigate"));
	}, [n, t.view]);
	function d() {
		let t = e.validate();
		return a(Object.fromEntries(t.map((e) => [e.id.replace("input-", ""), e.message]))), !t.length || (r(0), s("Revisa los datos señalados para continuar."), requestAnimationFrame(() => document.getElementById(`react-${t[0].id.replace("input-", "")}`)?.focus()), !1);
	}
	function f(e) {
		(e < n || d()) && (r(e), s(""));
	}
	async function p() {
		if (!d()) return;
		s("");
		let t = e.getSnapshot().generated;
		await e.generate(), e.getSnapshot().generated === t && s("La sesión todavía no se generó. Revisa el aviso, tu cuenta y las opciones seleccionadas.");
	}
	async function m() {
		l(!1), await new Promise((e) => requestAnimationFrame(e)), await e.newSession() && (e.setField("duracion", "90 min"), r(0), a({}), s(""), requestAnimationFrame(() => document.getElementById("react-step-heading")?.focus({ preventScroll: !0 })));
	}
	let h = t.view === "planning", g = /* @__PURE__ */ (0, T.jsxs)(T.Fragment, { children: [
		/* @__PURE__ */ (0, T.jsxs)("div", {
			className: "sl-brand",
			children: [/* @__PURE__ */ (0, T.jsx)("span", {
				className: "sl-brand-symbol",
				children: /* @__PURE__ */ (0, T.jsx)(Go, {})
			}), /* @__PURE__ */ (0, T.jsxs)("span", { children: [
				"Space",
				/* @__PURE__ */ (0, T.jsx)("span", {
					className: "sl-brand-light",
					children: "Lab"
				}),
				/* @__PURE__ */ (0, T.jsx)("small", { children: "EL ESPACIO DE TUS IDEAS" })
			] })]
		}),
		/* @__PURE__ */ (0, T.jsxs)("button", {
			type: "button",
			className: "sl-create-button",
			onClick: () => void m(),
			children: [/* @__PURE__ */ (0, T.jsx)(ea, { size: 19 }), "Nueva sesión"]
		}),
		/* @__PURE__ */ (0, T.jsx)("span", {
			className: "sl-nav-label",
			children: "TU ESPACIO DOCENTE"
		}),
		/* @__PURE__ */ (0, T.jsxs)("nav", {
			"aria-label": "Navegación principal",
			className: "sl-nav",
			children: [
				/* @__PURE__ */ (0, T.jsxs)("button", {
					type: "button",
					onClick: () => {
						e.showLegacy("home"), l(!1);
					},
					children: [/* @__PURE__ */ (0, T.jsx)(Pi, { size: 19 }), "Mi espacio"]
				}),
				/* @__PURE__ */ (0, T.jsxs)("button", {
					type: "button",
					className: h ? void 0 : "active",
					"aria-current": h ? void 0 : "page",
					onClick: () => {
						e.prepare(), l(!1);
					},
					children: [
						/* @__PURE__ */ (0, T.jsx)(ca, { size: 19 }),
						"Crear sesión",
						/* @__PURE__ */ (0, T.jsx)("span", { className: "sl-nav-dot" })
					]
				}),
				/* @__PURE__ */ (0, T.jsxs)("button", {
					type: "button",
					className: h ? "active" : void 0,
					"aria-current": h ? "page" : void 0,
					onClick: () => {
						l(!1), requestAnimationFrame(() => e.openPlanning());
					},
					children: [/* @__PURE__ */ (0, T.jsx)(Ii, { size: 19 }), "Unidades y experiencias"]
				}),
				/* @__PURE__ */ (0, T.jsxs)("button", {
					type: "button",
					onClick: () => {
						e.showLegacy("library"), l(!1);
					},
					children: [/* @__PURE__ */ (0, T.jsx)(Ai, { size: 19 }), "Mi biblioteca"]
				})
			]
		}),
		/* @__PURE__ */ (0, T.jsxs)("div", {
			className: "sl-nav-bottom",
			children: [/* @__PURE__ */ (0, T.jsxs)("div", {
				className: "sl-nav-tip",
				children: [
					/* @__PURE__ */ (0, T.jsx)("span", {
						className: "sl-tip-symbol",
						children: /* @__PURE__ */ (0, T.jsx)(ca, { size: 20 })
					}),
					/* @__PURE__ */ (0, T.jsx)("strong", { children: "Más tiempo para enseñar." }),
					/* @__PURE__ */ (0, T.jsx)("p", { children: "Dale forma a tus ideas y crea experiencias para tu aula." }),
					/* @__PURE__ */ (0, T.jsx)("span", { className: "sl-tip-line" })
				]
			}), /* @__PURE__ */ (0, T.jsxs)("span", {
				className: "sl-sidebar-footer",
				children: [/* @__PURE__ */ (0, T.jsx)("span", { className: "sl-status-dot" }), "Hecho para docentes"]
			})]
		})
	] });
	return t.view === "legacy" && [
		"home",
		"library",
		"landing"
	].includes(t.legacyDestination) ? null : t.view === "legacy" ? /* @__PURE__ */ (0, T.jsxs)("div", {
		className: "sl-return-bar",
		children: [/* @__PURE__ */ (0, T.jsxs)("span", { children: [/* @__PURE__ */ (0, T.jsx)(Go, {}), "Space Lab"] }), /* @__PURE__ */ (0, T.jsxs)("button", {
			type: "button",
			onClick: () => e.prepare(),
			children: [/* @__PURE__ */ (0, T.jsx)(ii, { size: 17 }), "Volver al generador"]
		})]
	}) : /* @__PURE__ */ (0, T.jsxs)("div", {
		className: "sl-app",
		children: [
			/* @__PURE__ */ (0, T.jsx)("a", {
				className: "sl-skip",
				href: h ? "#planning-title" : "#react-step-heading",
				onClick: (e) => {
					e.preventDefault(), document.getElementById(h ? "planning-title" : "react-step-heading")?.focus();
				},
				children: "Ir al generador"
			}),
			/* @__PURE__ */ (0, T.jsx)("aside", {
				className: "sl-sidebar",
				children: g
			}),
			/* @__PURE__ */ (0, T.jsxs)("div", {
				className: "sl-workspace",
				children: [/* @__PURE__ */ (0, T.jsxs)("header", {
					className: "sl-topbar",
					children: [
						/* @__PURE__ */ (0, T.jsxs)(Sr, {
							open: c,
							onOpenChange: l,
							children: [/* @__PURE__ */ (0, T.jsx)(wr, {
								asChild: !0,
								children: /* @__PURE__ */ (0, T.jsx)("button", {
									className: "sl-icon-button sl-mobile-menu",
									type: "button",
									"aria-label": "Abrir navegación",
									children: /* @__PURE__ */ (0, T.jsx)(Wi, { size: 22 })
								})
							}), /* @__PURE__ */ (0, T.jsxs)(Or, {
								container: document.getElementById("react-preview-root"),
								children: [/* @__PURE__ */ (0, T.jsx)(Ar, { className: "sl-dialog-overlay" }), /* @__PURE__ */ (0, T.jsxs)(Pr, {
									className: "sl-mobile-drawer",
									onCloseAutoFocus: (e) => {
										document.activeElement?.closest("#planning-dialog,#confirm-dialog,#auth-modal") && e.preventDefault();
									},
									children: [
										/* @__PURE__ */ (0, T.jsx)(Rr, {
											className: "sl-sr-only",
											children: "Navegación de Space Lab"
										}),
										/* @__PURE__ */ (0, T.jsx)(zr, {
											className: "sl-sr-only",
											children: "Accede a tus sesiones, unidades y biblioteca."
										}),
										/* @__PURE__ */ (0, T.jsx)(Vr, {
											className: "sl-drawer-close",
											"aria-label": "Cerrar navegación",
											children: /* @__PURE__ */ (0, T.jsx)(ba, { size: 22 })
										}),
										g
									]
								})]
							})]
						}),
						/* @__PURE__ */ (0, T.jsxs)("span", {
							className: "sl-mobile-brand",
							children: [
								/* @__PURE__ */ (0, T.jsx)(Go, {}),
								"Space",
								/* @__PURE__ */ (0, T.jsx)("span", { children: "Lab" })
							]
						}),
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "sl-breadcrumb",
							children: [
								/* @__PURE__ */ (0, T.jsx)("span", { children: "Planificador" }),
								/* @__PURE__ */ (0, T.jsx)(Si, { size: 14 }),
								/* @__PURE__ */ (0, T.jsx)("strong", { children: h ? "Unidades y experiencias" : t.linked ? "Sesión vinculada" : "Nueva sesión" })
							]
						}),
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "sl-topbar-actions",
							children: [
								/* @__PURE__ */ (0, T.jsx)("a", {
									className: "sl-icon-button",
									href: "mailto:pabloclsa87@gmail.com",
									"aria-label": "Contactar con soporte por correo",
									children: /* @__PURE__ */ (0, T.jsx)(wi, { size: 19 })
								}),
								/* @__PURE__ */ (0, T.jsx)("span", {
									className: "sl-beta-tag",
									children: "BETA"
								}),
								/* @__PURE__ */ (0, T.jsx)("button", {
									type: "button",
									className: "sl-icon-button",
									"aria-label": t.theme === "dark" ? "Usar tema claro" : "Usar tema oscuro",
									onClick: () => e.toggleTheme(),
									children: t.theme === "dark" ? /* @__PURE__ */ (0, T.jsx)(P, { size: 19 }) : /* @__PURE__ */ (0, T.jsx)(Ki, { size: 19 })
								}),
								/* @__PURE__ */ (0, T.jsx)(R, {}),
								/* @__PURE__ */ (0, T.jsxs)("button", {
									type: "button",
									className: "sl-account",
									onClick: () => t.account.signedIn ? e.showLegacy("home") : e.signIn(),
									children: [t.account.signedIn ? /* @__PURE__ */ (0, T.jsx)("span", {
										className: "sl-avatar",
										children: t.account.name.slice(0, 2).toUpperCase()
									}) : /* @__PURE__ */ (0, T.jsx)(Hi, { size: 18 }), /* @__PURE__ */ (0, T.jsx)("span", { children: t.account.name })]
								})
							]
						})
					]
				}), h ? /* @__PURE__ */ (0, T.jsx)(Wo, {}) : /* @__PURE__ */ (0, T.jsxs)(T.Fragment, { children: [/* @__PURE__ */ (0, T.jsx)("main", {
					className: "sl-main",
					ref: u,
					children: /* @__PURE__ */ (0, T.jsxs)("div", {
						className: "sl-page-width",
						children: [
							/* @__PURE__ */ (0, T.jsxs)("div", {
								className: "sl-page-heading",
								children: [/* @__PURE__ */ (0, T.jsxs)("div", { children: [
									/* @__PURE__ */ (0, T.jsxs)("span", {
										className: "sl-page-eyebrow",
										children: [/* @__PURE__ */ (0, T.jsx)("span", {}), "MENOS PAPELEO, MÁS APRENDIZAJE"]
									}),
									/* @__PURE__ */ (0, T.jsxs)("h1", { children: ["Tu próxima gran clase empieza aquí", /* @__PURE__ */ (0, T.jsx)("span", { children: "." })] }),
									/* @__PURE__ */ (0, T.jsx)("p", { children: "Trae una idea. Dale propósito. Conviértela en una sesión para tu aula." })
								] }), /* @__PURE__ */ (0, T.jsxs)("button", {
									className: "sl-advanced-link",
									type: "button",
									onClick: () => e.showLegacy("advanced"),
									children: [
										/* @__PURE__ */ (0, T.jsx)(oa, { size: 17 }),
										/* @__PURE__ */ (0, T.jsx)("span", { children: "Modo avanzado" }),
										/* @__PURE__ */ (0, T.jsx)(ci, { size: 15 })
									]
								})]
							}),
							/* @__PURE__ */ (0, T.jsx)("nav", {
								className: "sl-stepper",
								"aria-label": "Pasos del generador",
								children: Ho.map(({ title: e, description: t, Icon: r }, i) => /* @__PURE__ */ (0, T.jsxs)("button", {
									type: "button",
									className: `sl-step ${n === i ? "current" : i < n ? "done" : ""}`,
									"aria-current": n === i ? "step" : void 0,
									onClick: () => f(i),
									children: [
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "sl-step-number",
											children: i < n ? /* @__PURE__ */ (0, T.jsx)(gi, { size: 18 }) : i + 1
										}),
										/* @__PURE__ */ (0, T.jsxs)("span", { children: [/* @__PURE__ */ (0, T.jsx)("strong", { children: e }), /* @__PURE__ */ (0, T.jsx)("small", { children: t })] }),
										/* @__PURE__ */ (0, T.jsx)(r, {
											size: 21,
											className: "sl-step-icon"
										})
									]
								}, e))
							}),
							o && /* @__PURE__ */ (0, T.jsx)("div", {
								className: "sl-notice",
								role: "alert",
								children: o
							}),
							/* @__PURE__ */ (0, T.jsxs)("div", {
								className: "sl-content-grid",
								children: [/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "sl-step-content",
									children: [n === 0 ? /* @__PURE__ */ (0, T.jsx)(Fo, {
										state: t,
										bridge: e,
										errors: i
									}) : n === 1 ? /* @__PURE__ */ (0, T.jsx)(zo, {
										state: t,
										bridge: e
									}) : /* @__PURE__ */ (0, T.jsx)(Bo, {
										state: t,
										bridge: e
									}), /* @__PURE__ */ (0, T.jsxs)("div", {
										className: "sl-trust-line",
										children: [/* @__PURE__ */ (0, T.jsx)(Oi, { size: 15 }), /* @__PURE__ */ (0, T.jsx)("span", { children: t.hasDocument ? "Tus cambios se guardan con el documento." : "Podrás guardar y exportar tu sesión cuando esté generada." })]
									})]
								}), /* @__PURE__ */ (0, T.jsx)(Vo, { state: t })]
							})
						]
					})
				}), /* @__PURE__ */ (0, T.jsx)("footer", {
					className: "sl-footer",
					children: /* @__PURE__ */ (0, T.jsxs)("div", { children: [
						/* @__PURE__ */ (0, T.jsxs)("button", {
							type: "button",
							className: "sl-back-button",
							onClick: () => f(n - 1),
							disabled: n === 0 || t.busy,
							children: [/* @__PURE__ */ (0, T.jsx)(ii, { size: 18 }), "Anterior"]
						}),
						/* @__PURE__ */ (0, T.jsxs)("span", {
							className: "sl-footer-status",
							children: [/* @__PURE__ */ (0, T.jsxs)("span", { children: [
								"PASO ",
								n + 1,
								" DE 3"
							] }), /* @__PURE__ */ (0, T.jsx)("strong", { children: t.busy ? "Preparando tu sesión…" : Ho[n].title })]
						}),
						/* @__PURE__ */ (0, T.jsx)("button", {
							type: "button",
							className: "sl-primary-button",
							disabled: t.busy,
							onClick: () => n === 2 ? void p() : f(n + 1),
							children: t.busy ? /* @__PURE__ */ (0, T.jsxs)(T.Fragment, { children: [/* @__PURE__ */ (0, T.jsx)(Bi, {
								size: 19,
								className: "sl-spin"
							}), "Generando…"] }) : n === 2 ? /* @__PURE__ */ (0, T.jsxs)(T.Fragment, { children: [/* @__PURE__ */ (0, T.jsx)(ca, { size: 19 }), "Generar mi sesión"] }) : /* @__PURE__ */ (0, T.jsxs)(T.Fragment, { children: ["Continuar", /* @__PURE__ */ (0, T.jsx)(oi, { size: 19 })] })
						})
					] })
				})] })]
			})
		]
	});
}
function Wo() {
	let e = (0, _.useRef)(null);
	return (0, _.useLayoutEffect)(() => {
		let t = document.getElementById("planning-dialog");
		if (!t || !e.current) return;
		let n = t.parentNode, r = t.nextSibling;
		e.current.appendChild(t);
		let i = t.querySelector("#planning-title");
		return i?.setAttribute("tabindex", "-1"), i?.focus({ preventScroll: !0 }), () => {
			n.insertBefore(t, r?.parentNode === n ? r : null);
		};
	}, []), /* @__PURE__ */ (0, T.jsx)("div", {
		className: "sl-planning-surface",
		ref: e
	});
}
function Go() {
	return /* @__PURE__ */ (0, T.jsx)("img", {
		className: "sl-brand-logo",
		src: "assets/favicon.svg",
		alt: "",
		width: 40,
		height: 40
	});
}
function R() {
	return /* @__PURE__ */ (0, T.jsxs)(Sr, { children: [/* @__PURE__ */ (0, T.jsx)(wr, {
		asChild: !0,
		children: /* @__PURE__ */ (0, T.jsx)("button", {
			className: "sl-icon-button",
			type: "button",
			"aria-label": "Ayuda del generador",
			children: /* @__PURE__ */ (0, T.jsx)(wi, { size: 20 })
		})
	}), /* @__PURE__ */ (0, T.jsxs)(Or, {
		container: document.getElementById("react-preview-root"),
		children: [/* @__PURE__ */ (0, T.jsx)(Ar, { className: "sl-dialog-overlay" }), /* @__PURE__ */ (0, T.jsxs)(Pr, {
			className: "sl-help-dialog",
			children: [
				/* @__PURE__ */ (0, T.jsx)(Vr, {
					className: "sl-drawer-close",
					"aria-label": "Cerrar ayuda",
					children: /* @__PURE__ */ (0, T.jsx)(ba, { size: 21 })
				}),
				/* @__PURE__ */ (0, T.jsx)("span", {
					className: "sl-help-symbol",
					children: /* @__PURE__ */ (0, T.jsx)(ca, { size: 29 })
				}),
				/* @__PURE__ */ (0, T.jsx)(Rr, { children: "De tu idea a tu próxima clase." }),
				/* @__PURE__ */ (0, T.jsx)(zr, { children: "El generador te acompaña en tres pasos. Tú mantienes las decisiones pedagógicas." }),
				/* @__PURE__ */ (0, T.jsxs)("ol", { children: [
					/* @__PURE__ */ (0, T.jsxs)("li", { children: [/* @__PURE__ */ (0, T.jsx)("strong", { children: "Datos." }), " Define grupo, tema y tiempo."] }),
					/* @__PURE__ */ (0, T.jsxs)("li", { children: [/* @__PURE__ */ (0, T.jsx)("strong", { children: "Aprendizajes." }), " Revisa las referencias y aporta tus propuestas."] }),
					/* @__PURE__ */ (0, T.jsxs)("li", { children: [/* @__PURE__ */ (0, T.jsx)("strong", { children: "Revisar y generar." }), " Ajusta las opciones y crea la sesión con tu cuenta."] })
				] }),
				/* @__PURE__ */ (0, T.jsx)("p", { children: "La disponibilidad curricular varía por nivel. La generación requiere una cuenta y créditos; revisa siempre el resultado antes de compartirlo." }),
				/* @__PURE__ */ (0, T.jsx)(Vr, {
					asChild: !0,
					children: /* @__PURE__ */ (0, T.jsxs)("button", {
						className: "sl-primary-button",
						type: "button",
						children: ["Vamos a crear", /* @__PURE__ */ (0, T.jsx)(oi, { size: 18 })]
					})
				})
			]
		})]
	})] });
}
// react-ui/src/surfaces/Icons.tsx
function z() {
	return /* @__PURE__ */ (0, T.jsxs)(T.Fragment, { children: [
		" ",
		/* @__PURE__ */ (0, T.jsxs)("svg", {
			className: "ui-icon-sprite",
			"aria-hidden": "true",
			style: {
				display: "none !important",
				position: "absolute",
				width: "0",
				height: "0"
			},
			children: [
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("symbol", {
					id: "icon-edit",
					viewBox: "0 0 24 24",
					children: [/* @__PURE__ */ (0, T.jsx)("path", { d: "M12 20h9" }), /* @__PURE__ */ (0, T.jsx)("path", { d: "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" })]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("symbol", {
					id: "icon-eye",
					viewBox: "0 0 24 24",
					children: [/* @__PURE__ */ (0, T.jsx)("path", { d: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" }), /* @__PURE__ */ (0, T.jsx)("circle", {
						cx: "12",
						cy: "12",
						r: "3"
					})]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("symbol", {
					id: "icon-file",
					viewBox: "0 0 24 24",
					children: [/* @__PURE__ */ (0, T.jsx)("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" }), /* @__PURE__ */ (0, T.jsx)("path", { d: "M14 2v6h6M8 13h8M8 17h6" })]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("symbol", {
					id: "icon-download",
					viewBox: "0 0 24 24",
					children: [/* @__PURE__ */ (0, T.jsx)("path", { d: "M12 3v12m0 0 4-4m-4 4-4-4" }), /* @__PURE__ */ (0, T.jsx)("path", { d: "M4 18v2h16v-2" })]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsx)("symbol", {
					id: "icon-menu",
					viewBox: "0 0 24 24",
					children: /* @__PURE__ */ (0, T.jsx)("path", { d: "M4 6h16M4 12h16M4 18h16" })
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("symbol", {
					id: "icon-sparkles",
					viewBox: "0 0 24 24",
					children: [/* @__PURE__ */ (0, T.jsx)("path", { d: "m12 3-1.4 3.6L7 8l3.6 1.4L12 13l1.4-3.6L17 8l-3.6-1.4Z" }), /* @__PURE__ */ (0, T.jsx)("path", { d: "m19 14-.9 2.1L16 17l2.1.9L19 20l.9-2.1L22 17l-2.1-.9ZM5 14l-.7 1.3L3 16l1.3.7L5 18l.7-1.3L7 16l-1.3-.7Z" })]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsx)("symbol", {
					id: "icon-building",
					viewBox: "0 0 24 24",
					children: /* @__PURE__ */ (0, T.jsx)("path", { d: "M3 21h18M6 21V4h12v17M9 8h2m2 0h2m-6 4h2m2 0h2m-6 4h2m2 0h2" })
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("symbol", {
					id: "icon-target",
					viewBox: "0 0 24 24",
					children: [
						/* @__PURE__ */ (0, T.jsx)("circle", {
							cx: "12",
							cy: "12",
							r: "9"
						}),
						/* @__PURE__ */ (0, T.jsx)("circle", {
							cx: "12",
							cy: "12",
							r: "5"
						}),
						/* @__PURE__ */ (0, T.jsx)("circle", {
							cx: "12",
							cy: "12",
							r: "1"
						})
					]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("symbol", {
					id: "icon-users",
					viewBox: "0 0 24 24",
					children: [
						/* @__PURE__ */ (0, T.jsx)("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
						/* @__PURE__ */ (0, T.jsx)("circle", {
							cx: "9",
							cy: "7",
							r: "4"
						}),
						/* @__PURE__ */ (0, T.jsx)("path", { d: "M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" })
					]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("symbol", {
					id: "icon-save",
					viewBox: "0 0 24 24",
					children: [/* @__PURE__ */ (0, T.jsx)("path", { d: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" }), /* @__PURE__ */ (0, T.jsx)("path", { d: "M17 21v-8H7v8M7 3v5h8" })]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsx)("symbol", {
					id: "icon-folder",
					viewBox: "0 0 24 24",
					children: /* @__PURE__ */ (0, T.jsx)("path", { d: "M3 6h7l2 2h9v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" })
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("symbol", {
					id: "icon-upload",
					viewBox: "0 0 24 24",
					children: [/* @__PURE__ */ (0, T.jsx)("path", { d: "M12 16V4m0 0-4 4m4-4 4 4" }), /* @__PURE__ */ (0, T.jsx)("path", { d: "M4 18v2h16v-2" })]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsx)("symbol", {
					id: "icon-close",
					viewBox: "0 0 24 24",
					children: /* @__PURE__ */ (0, T.jsx)("path", { d: "M6 6l12 12M18 6 6 18" })
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsx)("symbol", {
					id: "icon-check",
					viewBox: "0 0 24 24",
					children: /* @__PURE__ */ (0, T.jsx)("path", { d: "m5 12 4 4L19 6" })
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("symbol", {
					id: "icon-user",
					viewBox: "0 0 24 24",
					children: [/* @__PURE__ */ (0, T.jsx)("circle", {
						cx: "12",
						cy: "8",
						r: "4"
					}), /* @__PURE__ */ (0, T.jsx)("path", { d: "M4 21a8 8 0 0 1 16 0" })]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("symbol", {
					id: "icon-shield",
					viewBox: "0 0 24 24",
					children: [/* @__PURE__ */ (0, T.jsx)("path", { d: "M12 3 4 6v5c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6Z" }), /* @__PURE__ */ (0, T.jsx)("path", { d: "m9 12 2 2 4-4" })]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("symbol", {
					id: "icon-logout",
					viewBox: "0 0 24 24",
					children: [/* @__PURE__ */ (0, T.jsx)("path", { d: "M10 17l5-5-5-5M15 12H3" }), /* @__PURE__ */ (0, T.jsx)("path", { d: "M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" })]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("symbol", {
					id: "icon-chat",
					viewBox: "0 0 24 24",
					children: [/* @__PURE__ */ (0, T.jsx)("path", { d: "M21 15a4 4 0 0 1-4 4H8l-5 3 1.5-5A8 8 0 1 1 21 15Z" }), /* @__PURE__ */ (0, T.jsx)("path", { d: "M8 12h.01M12 12h.01M16 12h.01" })]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("symbol", {
					id: "icon-sliders",
					viewBox: "0 0 24 24",
					children: [
						/* @__PURE__ */ (0, T.jsx)("path", { d: "M4 6h10M18 6h2M4 12h3M11 12h9M4 18h7M15 18h5" }),
						/* @__PURE__ */ (0, T.jsx)("circle", {
							cx: "16",
							cy: "6",
							r: "2"
						}),
						/* @__PURE__ */ (0, T.jsx)("circle", {
							cx: "9",
							cy: "12",
							r: "2"
						}),
						/* @__PURE__ */ (0, T.jsx)("circle", {
							cx: "13",
							cy: "18",
							r: "2"
						})
					]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsx)("symbol", {
					id: "icon-trash",
					viewBox: "0 0 24 24",
					children: /* @__PURE__ */ (0, T.jsx)("path", { d: "M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 10v7M14 10v7" })
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("symbol", {
					id: "icon-image",
					viewBox: "0 0 24 24",
					children: [
						/* @__PURE__ */ (0, T.jsx)("rect", {
							x: "3",
							y: "4",
							width: "18",
							height: "16",
							rx: "2"
						}),
						/* @__PURE__ */ (0, T.jsx)("circle", {
							cx: "9",
							cy: "10",
							r: "2"
						}),
						/* @__PURE__ */ (0, T.jsx)("path", { d: "m21 15-5-5L5 20" })
					]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("symbol", {
					id: "icon-refresh",
					viewBox: "0 0 24 24",
					children: [/* @__PURE__ */ (0, T.jsx)("path", { d: "M20 7h-5V2M4 17h5v5" }), /* @__PURE__ */ (0, T.jsx)("path", { d: "M6.1 7a8 8 0 0 1 13.5-1.5L20 7M4 17l.4 1.5A8 8 0 0 0 17.9 17" })]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsx)("symbol", {
					id: "icon-plus",
					viewBox: "0 0 24 24",
					children: /* @__PURE__ */ (0, T.jsx)("path", { d: "M12 5v14M5 12h14" })
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsx)("symbol", {
					id: "icon-minus",
					viewBox: "0 0 24 24",
					children: /* @__PURE__ */ (0, T.jsx)("path", { d: "M5 12h14" })
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsx)("symbol", {
					id: "icon-arrow-right",
					viewBox: "0 0 24 24",
					children: /* @__PURE__ */ (0, T.jsx)("path", { d: "M5 12h14M13 6l6 6-6 6" })
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("symbol", {
					id: "icon-alert",
					viewBox: "0 0 24 24",
					children: [/* @__PURE__ */ (0, T.jsx)("path", { d: "M10.3 3.7 2.5 17.2A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.8L13.7 3.7a2 2 0 0 0-3.4 0Z" }), /* @__PURE__ */ (0, T.jsx)("path", { d: "M12 9v4M12 17h.01" })]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("symbol", {
					id: "icon-undo",
					viewBox: "0 0 24 24",
					children: [/* @__PURE__ */ (0, T.jsx)("path", { d: "m9 7-5 5 5 5" }), /* @__PURE__ */ (0, T.jsx)("path", { d: "M20 17a7 7 0 0 0-7-7H4" })]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("symbol", {
					id: "icon-redo",
					viewBox: "0 0 24 24",
					children: [/* @__PURE__ */ (0, T.jsx)("path", { d: "m15 7 5 5-5 5" }), /* @__PURE__ */ (0, T.jsx)("path", { d: "M4 17a7 7 0 0 1 7-7h9" })]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("symbol", {
					id: "icon-list",
					viewBox: "0 0 24 24",
					children: [/* @__PURE__ */ (0, T.jsx)("path", { d: "M8 6h13M8 12h13M8 18h13" }), /* @__PURE__ */ (0, T.jsx)("path", { d: "M3 6h.01M3 12h.01M3 18h.01" })]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("symbol", {
					id: "icon-clean",
					viewBox: "0 0 24 24",
					children: [/* @__PURE__ */ (0, T.jsx)("path", { d: "m4 18 8-8M14 3l7 7-9 9H5l-2-2 9-9Z" }), /* @__PURE__ */ (0, T.jsx)("path", { d: "m11 19 2 2M16 16l2 2M7 15l4 4" })]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("symbol", {
					id: "icon-copy",
					viewBox: "0 0 24 24",
					children: [/* @__PURE__ */ (0, T.jsx)("rect", {
						width: "14",
						height: "14",
						x: "8",
						y: "8",
						rx: "2",
						ry: "2"
					}), /* @__PURE__ */ (0, T.jsx)("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" })]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsx)("symbol", {
					id: "icon-expand",
					viewBox: "0 0 24 24",
					children: /* @__PURE__ */ (0, T.jsx)("path", { d: "m15 3 6 6m0-6h-6m6 0v6M9 21l-6-6m0 6h6m-6 0v-6" })
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("symbol", {
					id: "icon-theme",
					viewBox: "0 0 24 24",
					children: [
						/* @__PURE__ */ (0, T.jsx)("rect", {
							x: "3",
							y: "4",
							width: "18",
							height: "14",
							rx: "2"
						}),
						/* @__PURE__ */ (0, T.jsx)("path", { d: "M8 22h8M12 18v4" }),
						/* @__PURE__ */ (0, T.jsx)("path", { d: "M16.5 8.5a4 4 0 1 1-5-1 3.2 3.2 0 0 0 5 1Z" })
					]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsx)("symbol", {
					id: "icon-chevron-down",
					viewBox: "0 0 24 24",
					children: /* @__PURE__ */ (0, T.jsx)("path", { d: "m6 9 6 6 6-6" })
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("symbol", {
					id: "icon-mail",
					viewBox: "0 0 24 24",
					children: [/* @__PURE__ */ (0, T.jsx)("rect", {
						width: "20",
						height: "16",
						x: "2",
						y: "4",
						rx: "2"
					}), /* @__PURE__ */ (0, T.jsx)("path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" })]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsx)("symbol", {
					id: "icon-whatsapp",
					viewBox: "0 0 24 24",
					children: /* @__PURE__ */ (0, T.jsx)("path", { d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.05 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" })
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("symbol", {
					id: "icon-globe",
					viewBox: "0 0 24 24",
					children: [
						/* @__PURE__ */ (0, T.jsx)("circle", {
							cx: "12",
							cy: "12",
							r: "10"
						}),
						/* @__PURE__ */ (0, T.jsx)("line", {
							x1: "2",
							y1: "12",
							x2: "22",
							y2: "12"
						}),
						/* @__PURE__ */ (0, T.jsx)("path", { d: "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" })
					]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsx)("symbol", {
					id: "icon-heart",
					viewBox: "0 0 24 24",
					children: /* @__PURE__ */ (0, T.jsx)("path", { d: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" })
				}),
				"\n"
			]
		}),
		"\n"
	] });
}
// react-ui/src/regions.tsx
var B = /* @__PURE__ */ new Map(), Ko = /* @__PURE__ */ new Set([
	"script",
	"iframe",
	"object",
	"embed",
	"base",
	"link",
	"meta",
	"style"
]), qo = /* @__PURE__ */ new Set([
	"disabled",
	"hidden",
	"required",
	"multiple",
	"open",
	"readonly",
	"autofocus",
	"checked"
]), Jo = {
	class: "className",
	for: "htmlFor",
	tabindex: "tabIndex",
	readonly: "readOnly",
	autofocus: "autoFocus",
	colspan: "colSpan",
	rowspan: "rowSpan",
	maxlength: "maxLength",
	minlength: "minLength",
	contenteditable: "contentEditable",
	spellcheck: "spellCheck",
	autocomplete: "autoComplete",
	"stroke-width": "strokeWidth",
	"stroke-linecap": "strokeLinecap",
	"stroke-linejoin": "strokeLinejoin"
}, Yo = (e) => e.replace(/-([a-z])/g, (e, t) => t.toUpperCase());
function Xo(e, t) {
	if (e.nodeType === Node.TEXT_NODE) return e.textContent;
	if (!(e instanceof Element) || Ko.has(e.localName)) return null;
	let n = e.localName, r = { key: t };
	for (let { name: t, value: i } of Array.from(e.attributes)) if (!(t.startsWith("on") || [
		"srcdoc",
		"style",
		"selected"
	].includes(t))) {
		if ([
			"href",
			"src",
			"xlink:href",
			"action",
			"formaction"
		].includes(t)) {
			if (n === "use" && !/^#[\w-]+$/.test(i)) continue;
			try {
				let e = new URL(i, location.href).protocol;
				if (![
					"http:",
					"https:",
					"mailto:",
					"blob:"
				].includes(e) && !/^data:image\/(png|jpeg|webp|gif);base64,/i.test(i)) continue;
			} catch {
				continue;
			}
		}
		t === "value" && ["input", "textarea"].includes(n) ? r.defaultValue = i : t === "checked" ? r.defaultChecked = !0 : r[Jo[t] || t] = qo.has(t) ? !0 : i;
	}
	if (e instanceof HTMLElement) {
		let t = {};
		for (let n of Array.from(e.style)) {
			let r = e.style.getPropertyValue(n);
			/(?:url\s*\(|expression\s*\(|javascript\s*:)/i.test(r) || (t[n.startsWith("--") ? n : Yo(n)] = r);
		}
		r.style = t;
	}
	if (n === "select") {
		let t = Array.from(e.querySelectorAll("option[selected]")).map((e) => e.getAttribute("value") || e.textContent || "");
		t.length && (r.defaultValue = r.multiple ? t : t[0]);
	}
	return n === "textarea" ? (r.defaultValue = e.textContent || "", (0, _.createElement)(n, r)) : [
		"input",
		"img",
		"br",
		"hr",
		"area",
		"col",
		"source",
		"wbr"
	].includes(n) ? (0, _.createElement)(n, r) : (0, _.createElement)(n, r, ...Array.from(e.childNodes, Xo));
}
function Zo(e, t) {
	for (let [t, n] of B) t !== e && e.contains(t) && (n.root.unmount(), B.delete(t));
	let n = B.get(e);
	n || (n = {
		root: (0, v.createRoot)(e),
		revision: 0
	}, B.set(e, n));
	let r = document.createElement("template");
	r.innerHTML = String(t);
	let i = Array.from(r.content.childNodes, Xo), a = n;
	return (0, k.flushSync)(() => a.root.render((0, _.createElement)(_.Fragment, { key: ++a.revision }, ...i))), t;
}
function Qo() {
	let e = new MutationObserver(() => {
		for (let [e, t] of B) e.isConnected || (t.root.unmount(), B.delete(e));
	});
	return e.observe(document.body, {
		childList: !0,
		subtree: !0
	}), () => {
		e.disconnect(), B.forEach((e) => e.root.unmount()), B.clear();
	};
}
// react-ui/src/live.tsx
function V(e) {
	let t = e, n = /* @__PURE__ */ new Set();
	return {
		get: () => t,
		server: () => e,
		subscribe: (e) => (n.add(e), () => n.delete(e)),
		set(e) {
			t = e, n.forEach((e) => e());
		}
	};
}
var $o = V([]), es = V({
	signedIn: !1,
	isAdmin: !1
}), ts = V([]), ns = /* @__PURE__ */ new Map(), rs = 0, is = (e) => {
	clearTimeout(ns.get(e)), ns.delete(e), ts.set(ts.get().filter((t) => t.id !== e));
};
function as({ name: e }) {
	return /* @__PURE__ */ (0, T.jsx)("svg", {
		className: "ui-icon",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, T.jsx)("use", { href: `#icon-${e}` })
	});
}
function os() {
	let e = (0, _.useSyncExternalStore)($o.subscribe, $o.get, $o.server);
	return e.length ? /* @__PURE__ */ (0, T.jsx)(T.Fragment, { children: e.map((e) => /* @__PURE__ */ (0, T.jsxs)("article", {
		className: "home-session-item",
		children: [/* @__PURE__ */ (0, T.jsxs)("div", {
			className: "home-session-main",
			children: [/* @__PURE__ */ (0, T.jsx)("span", {
				className: "home-session-symbol",
				children: /* @__PURE__ */ (0, T.jsx)(as, { name: "file" })
			}), /* @__PURE__ */ (0, T.jsxs)("div", {
				className: "home-session-copy",
				children: [/* @__PURE__ */ (0, T.jsx)("strong", { children: e.title }), /* @__PURE__ */ (0, T.jsx)("span", { children: e.description })]
			})]
		}), /* @__PURE__ */ (0, T.jsxs)("div", {
			className: "home-session-actions",
			children: [/* @__PURE__ */ (0, T.jsx)("time", {
				className: "home-session-date",
				dateTime: e.lastSaved,
				children: e.date
			}), /* @__PURE__ */ (0, T.jsxs)("button", {
				type: "button",
				className: "btn btn-ghost btn-sm home-open-session",
				"data-session-id": e.id,
				children: ["Abrir ", /* @__PURE__ */ (0, T.jsx)(as, { name: "arrow-right" })]
			})]
		})]
	}, e.id)) }) : /* @__PURE__ */ (0, T.jsxs)("div", {
		className: "home-empty-sessions",
		children: [
			/* @__PURE__ */ (0, T.jsx)("span", { children: /* @__PURE__ */ (0, T.jsx)(as, { name: "folder" }) }),
			/* @__PURE__ */ (0, T.jsx)("h3", { children: "Aún no tienes sesiones guardadas" }),
			/* @__PURE__ */ (0, T.jsx)("p", { children: "Crea tu primera planificación y aparecerá aquí automáticamente." }),
			/* @__PURE__ */ (0, T.jsx)("button", {
				type: "button",
				className: "btn btn-primary btn-sm",
				"data-home-action": "new-session",
				children: "Crear mi primera sesión"
			})
		]
	});
}
function ss() {
	let e = (0, _.useSyncExternalStore)(es.subscribe, es.get, es.server);
	return e.signedIn ? /* @__PURE__ */ (0, T.jsxs)("div", {
		className: "user-menu-container",
		children: [e.isAdmin && /* @__PURE__ */ (0, T.jsxs)("a", {
			href: "admin.html",
			className: "btn btn-accent btn-sm",
			children: [/* @__PURE__ */ (0, T.jsx)(as, { name: "shield" }), /* @__PURE__ */ (0, T.jsx)("span", {
				className: "auth-label",
				children: "Admin"
			})]
		}), /* @__PURE__ */ (0, T.jsxs)("button", {
			id: "btn-logout",
			className: "btn btn-ghost btn-sm",
			title: "Cerrar sesión",
			onClick: e.onLogout,
			children: [/* @__PURE__ */ (0, T.jsx)(as, { name: "logout" }), /* @__PURE__ */ (0, T.jsx)("span", {
				className: "auth-label",
				children: "Salir"
			})]
		})]
	}) : /* @__PURE__ */ (0, T.jsxs)("button", {
		id: "btn-login-trigger",
		className: "btn btn-ghost btn-sm",
		"aria-label": "Iniciar sesión",
		onClick: e.onLogin,
		children: [/* @__PURE__ */ (0, T.jsx)(as, { name: "user" }), /* @__PURE__ */ (0, T.jsx)("span", {
			className: "auth-label",
			children: "Iniciar sesión"
		})]
	});
}
function cs() {
	let e = (0, _.useSyncExternalStore)(ts.subscribe, ts.get, ts.server);
	(0, _.useEffect)(() => () => {
		ns.forEach(clearTimeout), ns.clear();
	}, []);
	let t = {
		success: "check",
		error: "close",
		info: "sparkles",
		warning: "alert"
	};
	return /* @__PURE__ */ (0, T.jsx)(T.Fragment, { children: e.map((e) => /* @__PURE__ */ (0, T.jsxs)("div", {
		className: `toast toast-${e.type}`,
		role: e.type === "error" ? "alert" : "status",
		onClick: () => is(e.id),
		children: [
			/* @__PURE__ */ (0, T.jsx)("span", {
				className: "toast-icon",
				children: /* @__PURE__ */ (0, T.jsx)(as, { name: t[e.type] || "sparkles" })
			}),
			/* @__PURE__ */ (0, T.jsx)("span", {
				className: "toast-msg",
				children: e.message
			}),
			/* @__PURE__ */ (0, T.jsx)("button", {
				type: "button",
				className: "btn btn-ghost btn-sm",
				"aria-label": "Cerrar aviso",
				onClick: () => is(e.id),
				children: "×"
			})
		]
	}, e.id)) });
}
function ls() {
	window.SpaceLabReactUI = {
		region: Zo,
		sessions: (e) => $o.set(e),
		auth: (e) => es.set(e),
		toast(e, t = "info", n = 3500) {
			let r = ++rs;
			ts.get().length >= 5 && is(ts.get()[0].id), ts.set([...ts.get(), {
				id: r,
				message: String(e ?? ""),
				type: t
			}]), ns.set(r, setTimeout(() => is(r), Math.max(0, n)));
		}
	};
}
// react-ui/src/surfaces/AuthDialog.tsx
function us() {
	return /* @__PURE__ */ (0, T.jsxs)(T.Fragment, { children: [
		" ",
		"\n",
		/* @__PURE__ */ (0, T.jsxs)("div", {
			id: "auth-modal",
			className: "load-modal hidden",
			style: { zIndex: "9999" },
			children: [
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("div", {
					className: "load-modal-content glass-card auth-premium-card",
					style: {
						maxWidth: "420px",
						padding: "2.5rem",
						textAlign: "center",
						position: "relative"
					},
					children: [
						"\n",
						"\n",
						/* @__PURE__ */ (0, T.jsx)("button", {
							id: "btn-close-auth",
							className: "btn btn-ghost btn-sm",
							"aria-label": "Cerrar",
							style: {
								position: "absolute",
								top: "1rem",
								right: "1rem",
								color: "#71717a"
							},
							children: /* @__PURE__ */ (0, T.jsx)("svg", {
								className: "ui-icon",
								"aria-hidden": "true",
								children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-close" })
							})
						}),
						"\n",
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							style: {
								marginBottom: "1.5rem",
								display: "flex",
								justifyContent: "center"
							},
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									style: {
										background: "#090a0f",
										border: "1px solid rgba(255,255,255,0.06)",
										padding: "12px",
										borderRadius: "8px",
										display: "inline-flex",
										alignItems: "center",
										justifyContent: "center",
										boxShadow: "var(--shadow-sm)"
									},
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("svg", {
											width: "42",
											height: "42",
											viewBox: "0 0 100 100",
											fill: "none",
											xmlns: "http://www.w3.org/2000/svg",
											style: { filter: "drop-shadow(0px 0px 8px rgba(0, 210, 255, 0.5))" },
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("rect", {
													x: "2",
													y: "2",
													width: "96",
													height: "96",
													rx: "28",
													fill: "#0d0e12",
													stroke: "#1f2937",
													strokeWidth: "2"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("path", {
													d: "M55 22C42.5 22 36.5 30 36.5 35C36.5 37.5 38.5 39.5 41 39.5C43.5 39.5 45 37.5 45.5 35.5C46.2 33 49 28.5 54.5 28.5C60.5 28.5 63 32.5 63 36.5C63 42.5 56.5 44.5 51 46.5L42.5 49.5C36.5 51.5 34.5 57.5 34.5 63.5C34.5 72.5 43.5 78 54 78C66.5 78 72 70 72 65C72 62.5 70 60.5 67.5 60.5C65 60.5 63.5 62.5 63 64.5C62.3 67 59.5 71.5 54 71.5C47.5 71.5 45 67.5 45 63.5C45 57.5 51.5 55.5 57 53.5L65.5 50.5C71.5 48.5 73.5 42.5 73.5 36.5C73.5 27.5 65.5 22 55 22Z",
													fill: "#ffffff"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("path", {
													d: "M56 25L38 52H48L44 75L62 48H52L56 25Z",
													fill: "#ffffff"
												}),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n",
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "auth-tabs",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("button", {
									type: "button",
									id: "auth-tab-login",
									className: "auth-tab active",
									children: "Ingresar"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("button", {
									type: "button",
									id: "auth-tab-register",
									className: "auth-tab",
									children: "Crear cuenta"
								}),
								"\n"
							]
						}),
						"\n",
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "load-modal-header",
							style: { display: "none" },
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("h3", {
									id: "auth-title",
									children: "Iniciar Sesión"
								}),
								"\n"
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("p", {
							id: "auth-subtitle",
							style: { display: "none" }
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("form", {
							id: "auth-form",
							autoComplete: "off",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("p", {
									id: "auth-recovery-description",
									className: "hidden",
									role: "status"
								}),
								"\n",
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									id: "auth-group-username",
									className: "form-group hidden",
									style: {
										textAlign: "left",
										marginBottom: "1rem"
									},
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("input", {
											type: "text",
											id: "auth-username",
											className: "auth-field",
											placeholder: "Apodo único (sin espacios)"
										}),
										"\n"
									]
								}),
								"\n",
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "form-group",
									style: {
										textAlign: "left",
										marginBottom: "1rem"
									},
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("input", {
											type: "email",
											id: "auth-email",
											className: "auth-field",
											placeholder: "Correo electrónico",
											required: !0
										}),
										"\n"
									]
								}),
								"\n",
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "form-group",
									style: {
										textAlign: "left",
										marginBottom: "1rem"
									},
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("input", {
											type: "password",
											id: "auth-password",
											className: "auth-field",
											placeholder: "Contraseña",
											required: !0
										}),
										"\n"
									]
								}),
								"\n",
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									id: "auth-group-confirm-password",
									className: "form-group hidden",
									style: {
										textAlign: "left",
										marginBottom: "1rem"
									},
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("input", {
											type: "password",
											id: "auth-confirm-password",
											className: "auth-field",
											placeholder: "Confirmar contraseña"
										}),
										"\n"
									]
								}),
								"\n",
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									id: "auth-group-terms",
									className: "form-group hidden",
									style: {
										textAlign: "left",
										marginBottom: "1.5rem",
										display: "flex",
										alignItems: "center",
										gap: "8px"
									},
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("input", {
											type: "checkbox",
											id: "auth-terms",
											style: {
												width: "16px",
												height: "16px",
												cursor: "pointer",
												accentColor: "#00d2ff",
												margin: "0"
											}
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("label", {
											htmlFor: "auth-terms",
											style: {
												fontSize: "0.8rem",
												color: "#71717a",
												lineHeight: "1.3",
												cursor: "pointer",
												userSelect: "none"
											},
											children: [
												"\n                        Acepto los ",
												/* @__PURE__ */ (0, T.jsx)("a", {
													href: "#",
													style: {
														color: "#00d2ff",
														textDecoration: "none",
														fontWeight: "600",
														borderBottom: "1px dotted #00d2ff"
													},
													children: "Términos\n                            y Privacidad"
												}),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n",
								"\n",
								/* @__PURE__ */ (0, T.jsx)("button", {
									type: "submit",
									id: "btn-submit-auth",
									className: "auth-submit-btn",
									children: "\n                    Iniciar Sesión\n                "
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("button", {
									type: "button",
									id: "btn-forgot-password",
									className: "btn btn-ghost",
									children: "Olvidé mi contraseña"
								}),
								"\n"
							]
						}),
						"\n",
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							style: { display: "none" },
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("span", {
									id: "auth-toggle-text",
									children: "¿No tienes una cuenta?"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("a", {
									href: "#",
									id: "auth-toggle-mode",
									children: "Créala aquí"
								}),
								"\n"
							]
						}),
						"\n",
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							style: { marginTop: "0.5rem" },
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("button", {
									type: "button",
									id: "btn-cancel-auth",
									className: "auth-cancel-btn",
									style: {
										background: "none",
										border: "none",
										color: "#71717a",
										fontSize: "0.9rem",
										cursor: "pointer",
										transition: "color 0.2s"
									},
									children: "Cancelar"
								}),
								"\n"
							]
						}),
						"\n"
					]
				}),
				"\n"
			]
		}),
		"\n"
	] });
}
// react-ui/src/surfaces/ConfirmDialogSurface.tsx
function ds() {
	return /* @__PURE__ */ (0, T.jsxs)(T.Fragment, { children: [
		" ",
		"\n",
		/* @__PURE__ */ (0, T.jsxs)("div", {
			id: "confirm-dialog",
			className: "confirm-overlay hidden",
			children: [
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("div", {
					className: "confirm-card glass-card",
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsx)("div", {
							className: "confirm-icon",
							children: /* @__PURE__ */ (0, T.jsx)("svg", {
								className: "ui-icon",
								"aria-hidden": "true",
								children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-alert" })
							})
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("h3", {
							id: "confirm-title",
							children: "¿Estás seguro?"
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("p", {
							id: "confirm-message",
							children: "Esta acción no se puede deshacer."
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "confirm-actions",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("button", {
									id: "confirm-cancel",
									className: "btn btn-ghost",
									children: "Cancelar"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("button", {
									id: "confirm-deny",
									className: "btn btn-warning hidden",
									children: "No Guardar"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("button", {
									id: "confirm-accept",
									className: "btn btn-danger",
									children: "Confirmar"
								}),
								"\n"
							]
						}),
						"\n"
					]
				}),
				"\n"
			]
		}),
		"\n"
	] });
}
// react-ui/src/surfaces/EngineRequired.tsx
function fs() {
	return /* @__PURE__ */ (0, T.jsxs)(T.Fragment, { children: [
		" ",
		"\n",
		/* @__PURE__ */ (0, T.jsxs)("div", {
			id: "engine-required-modal",
			className: "pdf-guide-overlay hidden",
			children: [
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("div", {
					className: "pdf-guide-card glass-card",
					style: { maxWidth: "420px" },
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsx)("button", {
							id: "engine-modal-close",
							className: "pdf-guide-close",
							title: "Cerrar",
							"aria-label": "Cerrar",
							children: "×"
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("div", {
							className: "pdf-guide-icon",
							style: {
								color: "#f59e0b",
								marginBottom: "10px"
							},
							children: /* @__PURE__ */ (0, T.jsx)("svg", {
								className: "ui-icon",
								"aria-hidden": "true",
								children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-alert" })
							})
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("h3", {
							className: "pdf-guide-title",
							children: "Motor Local Requerido"
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("p", {
							className: "pdf-guide-subtitle",
							style: {
								marginBottom: "15px",
								fontSize: "0.9rem"
							},
							children: "\n                La exportación nativa a **Microsoft Word (.docx)** con formato premium no está disponible sin vincular el motor local.\n            "
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							style: {
								background: "rgba(245, 158, 11, 0.06)",
								border: "1px solid rgba(245, 158, 11, 0.2)",
								borderRadius: "8px",
								padding: "12px",
								textAlign: "left",
								marginBottom: "18px",
								fontSize: "0.82rem",
								lineHeight: "1.4",
								color: "#fef08a"
							},
							children: [
								"\n                Para compilar y descargar un documento de Word limpio y editable con membretes de UGEL/MINEDU integrados, debes descargar e iniciar la aplicación ",
								/* @__PURE__ */ (0, T.jsx)("strong", { children: "pablitopyhost.exe" }),
								" en tu PC.\n            "
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							style: {
								display: "flex",
								flexDirection: "column",
								gap: "8px"
							},
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("a", {
									href: "https://descargas.sypablitodp.site",
									target: "_blank",
									rel: "noopener noreferrer",
									className: "btn btn-primary",
									style: {
										textDecoration: "none",
										padding: "10px",
										textAlign: "center"
									},
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-download" })
										}),
										" Descargar Motor Local (.exe)\n                "
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("button", {
									id: "engine-modal-cancel",
									className: "btn btn-ghost",
									style: { padding: "8px" },
									children: "Cancelar"
								}),
								"\n"
							]
						}),
						"\n"
					]
				}),
				"\n"
			]
		}),
		"\n"
	] });
}
// react-ui/src/surfaces/PdfGuide.tsx
function ps() {
	return /* @__PURE__ */ (0, T.jsxs)(T.Fragment, { children: [
		" ",
		"\n",
		/* @__PURE__ */ (0, T.jsxs)("div", {
			id: "pdf-guide-modal",
			className: "pdf-guide-overlay hidden",
			children: [
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("div", {
					className: "pdf-guide-card glass-card",
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsx)("button", {
							id: "pdf-guide-close",
							className: "pdf-guide-close",
							title: "Cerrar",
							"aria-label": "Cerrar",
							children: "×"
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("div", {
							className: "pdf-guide-icon",
							children: /* @__PURE__ */ (0, T.jsx)("svg", {
								className: "ui-icon",
								"aria-hidden": "true",
								children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-file" })
							})
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("h3", {
							className: "pdf-guide-title",
							children: "Exportar Sesión como PDF"
						}),
						"\n",
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "pdf-guide-warning-badge",
							style: {
								background: "rgba(245, 158, 11, 0.1)",
								border: "1px solid rgba(245, 158, 11, 0.25)",
								color: "#eab308",
								padding: "8px 12px",
								borderRadius: "8px",
								fontSize: "0.82rem",
								fontWeight: "600",
								marginBottom: "12px",
								textAlign: "center",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								gap: "6px"
							},
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("svg", {
									className: "ui-icon",
									"aria-hidden": "true",
									children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-alert" })
								}),
								" Motor Local Desconectado: Se usará la impresión de Windows\n            "
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("p", {
							className: "pdf-guide-subtitle",
							children: "Para obtener un PDF de calidad con el navegador, sigue estos pasos:"
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "pdf-guide-steps",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "pdf-guide-step",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "step-number",
											children: "1"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "step-content",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("strong", { children: "Destino" }),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("span", { children: ["Selecciona ", /* @__PURE__ */ (0, T.jsx)("em", { children: "\"Guardar como PDF\"" })] }),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "pdf-guide-step",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "step-number",
											children: "2"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "step-content",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("strong", { children: "Más opciones" }),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("span", { children: [
													"Activa ",
													/* @__PURE__ */ (0, T.jsx)("em", { children: "\"Gráficos de fondo\"" }),
													" (para conservar colores)"
												] }),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "pdf-guide-step",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "step-number",
											children: "3"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "step-content",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("strong", { children: "Cabeceras" }),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("span", { children: [
													"Desactiva ",
													/* @__PURE__ */ (0, T.jsx)("em", { children: "\"Cabeceras y pies de página\"" }),
													" (para limpiar URLs)"
												] }),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n",
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "pdf-premium-ad-box",
							style: {
								background: "var(--color-card-surface)",
								border: "1px dashed rgba(6, 182, 212, 0.3)",
								borderRadius: "8px",
								padding: "15px",
								margin: "15px 0",
								textAlign: "left"
							},
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									style: {
										display: "flex",
										alignItems: "center",
										gap: "8px",
										color: "#06b6d4",
										fontWeight: "600",
										fontSize: "0.9rem",
										marginBottom: "6px"
									},
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sparkles" })
										}),
										" ¡Recomendado: Exportación Premium Directa!\n                "
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("p", {
									style: {
										fontSize: "0.8rem",
										color: "#94a3b8",
										lineHeight: "1.4",
										marginBottom: "10px"
									},
									children: "\n                    Para descargas automáticas inmediatas con paginado físico A4 perfecto y archivos Word (.docx) nativos editables de Office, descarga e inicia el motor.\n                "
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("a", {
									href: "https://descargas.sypablitodp.site",
									target: "_blank",
									rel: "noopener noreferrer",
									className: "btn btn-primary",
									style: {
										display: "inline-flex",
										alignItems: "center",
										justifyContent: "center",
										width: "100%",
										fontSize: "0.85rem",
										fontWeight: "600",
										textDecoration: "none",
										padding: "8px 14px"
									},
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-download" })
										}),
										" Descargar Motor Local (.exe)\n                "
									]
								}),
								"\n"
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "pdf-guide-actions",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("button", {
									id: "pdf-guide-cancel",
									className: "btn btn-ghost",
									children: "Cancelar"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("button", {
									id: "pdf-guide-proceed",
									className: "btn btn-primary pdf-guide-proceed-btn",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-file" })
										}),
										" Abrir Impresora\n                "
									]
								}),
								"\n"
							]
						}),
						"\n"
					]
				}),
				"\n"
			]
		}),
		"\n"
	] });
}
// react-ui/src/surfaces/TermsDialog.tsx
function ms() {
	return /* @__PURE__ */ (0, T.jsxs)(T.Fragment, { children: [
		" ",
		"\n",
		/* @__PURE__ */ (0, T.jsxs)("div", {
			id: "terms-modal",
			className: "load-modal hidden",
			style: { zIndex: "10000" },
			children: [
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("div", {
					className: "load-modal-content glass-card",
					style: {
						maxWidth: "720px",
						padding: "2rem",
						textAlign: "left",
						maxHeight: "85vh",
						overflowY: "auto"
					},
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "load-modal-header",
							style: {
								borderBottom: "1px solid var(--border)",
								paddingBottom: "0.75rem",
								marginBottom: "1.25rem",
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center"
							},
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									style: {
										display: "flex",
										alignItems: "center",
										gap: "0.6rem"
									},
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											style: {
												color: "var(--accent)",
												width: "22px",
												height: "22px"
											},
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-shield" })
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("h3", {
											style: {
												fontSize: "1.2rem",
												fontWeight: "800",
												color: "var(--color-foreground)",
												margin: "0"
											},
											children: "\n                        Términos, Condiciones de Uso y Políticas de Privacidad — Space Lab\n                    "
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("button", {
									id: "btn-close-terms",
									className: "btn btn-ghost btn-sm",
									style: {
										fontSize: "1.1rem",
										padding: "4px 8px"
									},
									"aria-label": "Cerrar",
									children: /* @__PURE__ */ (0, T.jsx)("svg", {
										className: "ui-icon",
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-close" })
									})
								}),
								"\n"
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							style: {
								fontSize: "0.85rem",
								lineHeight: "1.6",
								color: "var(--text-primary)",
								display: "flex",
								flexDirection: "column",
								gap: "1.1rem"
							},
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									style: {
										background: "rgba(0, 210, 255, 0.06)",
										border: "1px solid rgba(0, 210, 255, 0.2)",
										borderRadius: "8px",
										padding: "0.85rem 1rem",
										fontSize: "0.82rem"
									},
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("strong", { children: "Última actualización: Octubre de 2026" }),
										" | Versión del Sistema: ",
										/* @__PURE__ */ (0, T.jsx)("strong", { children: "Space Lab 2.0 (Motor v1.4.1)" }),
										/* @__PURE__ */ (0, T.jsx)("br", {}),
										"\n                    Desarrollado y operado por ",
										/* @__PURE__ */ (0, T.jsx)("strong", { children: "Samuel Y. Pablo Claudio (pablitodp)" }),
										" — Huánuco, Perú.\n                "
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("p", { children: [
									"Bienvenido a ",
									/* @__PURE__ */ (0, T.jsx)("strong", { children: "Space Lab" }),
									" (",
									/* @__PURE__ */ (0, T.jsx)("code", { children: "sesiones.sypablitodp.site" }),
									"). Esta plataforma de asistencia pedagógica, planificación curricular y exportación documental está diseñada para facilitar el trabajo técnico-pedagógico de los docentes de Educación Básica Regular (Inicial, Primaria y Secundaria) del Perú. Al acceder, registrarte y utilizar nuestros servicios, aceptas en su totalidad los siguientes Términos y Condiciones y la Política de Privacidad conforme a la legislación vigente de la República del Perú."
								] }),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("h4", {
									style: {
										color: "var(--accent)",
										fontWeight: "700",
										marginTop: "0.5rem",
										display: "flex",
										alignItems: "center",
										gap: "0.4rem"
									},
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-user" })
										}),
										"\n                    1. REGISTRO, SEGURIDAD Y AUTENTICACIÓN\n                "
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("p", { children: "El registro en Space Lab es de carácter personal e intransferible. El usuario es responsable de mantener la confidencialidad de sus credenciales. La plataforma utiliza infraestructura segura en la nube (Supabase Auth) con contraseñas encriptadas mediante algoritmos criptográficos robustos y políticas de seguridad a nivel de fila (Row Level Security - RLS). Cada docente tiene acceso exclusivo y privado a sus propias sesiones, perfiles y datos." }),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("h4", {
									style: {
										color: "var(--accent)",
										fontWeight: "700",
										marginTop: "0.5rem",
										display: "flex",
										alignItems: "center",
										gap: "0.4rem"
									},
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-download" })
										}),
										"\n                    2. ARQUITECTURA DEL MOTOR LOCAL (pablitohost.exe / pablitopyhost.exe) Y PRIVACIDAD TOTAL DE TU PC\n                "
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									style: {
										background: "var(--bg-card)",
										border: "1px solid var(--border)",
										borderRadius: "8px",
										padding: "1rem",
										display: "flex",
										flexDirection: "column",
										gap: "0.75rem"
									},
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("p", { children: [
											/* @__PURE__ */ (0, T.jsx)("strong", { children: "¿Por qué se descarga el ejecutable local?" }),
											/* @__PURE__ */ (0, T.jsx)("br", {}),
											"\n                    Los navegadores web estándar tienen limitaciones técnicas estrictas: no pueden generar de forma nativa documentos de Microsoft Word (.docx) con estructuras complejas como tablas anidadas con anchos milimétricos del MINEDU, listas de cotejo con formato oficial de evaluación formativa y fórmulas matemáticas o científicas editables en formato OMML (Office Math Markup Language). Para lograr una calidad de impresión física 100% idéntica a la normativa de UGEL/DRE y ",
											/* @__PURE__ */ (0, T.jsx)("strong", { children: "sin subir tus documentos pedagógicos a servidores o convertidores externos en la nube" }),
											", se desarrolló el motor local ",
											/* @__PURE__ */ (0, T.jsx)("code", { children: "pablitohost.exe" }),
											" (también denominado ",
											/* @__PURE__ */ (0, T.jsx)("code", { children: "pablitopyhost.exe" }),
											")."
										] }),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("p", { children: [
											/* @__PURE__ */ (0, T.jsx)("strong", { children: "Arquitectura técnica en Python:" }),
											/* @__PURE__ */ (0, T.jsx)("br", {}),
											"\n                    El motor es un micro-servicio local programado íntegramente en ",
											/* @__PURE__ */ (0, T.jsx)("strong", { children: "Python" }),
											" utilizando un servidor asíncrono ultraligero (FastAPI / Uvicorn) y bibliotecas especializadas de manipulación XML/docx. Se ejecuta de forma aislada en segundo plano en tu propia computadora escuchando únicamente en el puerto local ",
											/* @__PURE__ */ (0, T.jsx)("code", { children: "http://127.0.0.1:8000" }),
											"."
										] }),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("p", { children: [
											/* @__PURE__ */ (0, T.jsx)("strong", { children: "Comunicación segura mediante Tokens Autorizados:" }),
											/* @__PURE__ */ (0, T.jsx)("br", {}),
											"\n                    La aplicación web se conecta con el motor local a través del estándar de seguridad ",
											/* @__PURE__ */ (0, T.jsx)("strong", { children: "Private Network Access (PNA)" }),
											". Toda petición requiere obligatoriamente un ",
											/* @__PURE__ */ (0, T.jsx)("strong", { children: "token criptográfico de vinculación" }),
											" generado al iniciar el programa. Asimismo, el motor cuenta con validación estricta de origen (CORS): únicamente procesa solicitudes emitidas desde el dominio oficial verificado (",
											/* @__PURE__ */ (0, T.jsx)("code", { children: "https://sesiones.sypablitodp.site" }),
											") o el entorno local de desarrollo. Cualquier solicitud proveniente de páginas web no autorizadas o scripts de terceros es rechazada automáticamente."
										] }),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("p", { children: /* @__PURE__ */ (0, T.jsx)("strong", { children: "Garantía de Privacidad y Aislamiento (No intrusión en tu sistema):" }) }),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("ul", {
											style: {
												margin: "0",
												paddingLeft: "1.2rem",
												display: "flex",
												flexDirection: "column",
												gap: "0.4rem"
											},
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("li", { children: [/* @__PURE__ */ (0, T.jsx)("strong", { children: "Sin exploración de documentos personales:" }), " El motor no busca ni recopila tus fotos, documentos o archivos personales. Utiliza sus recursos de aplicación y el contenido que el navegador le envía para exportar."] }),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("li", { children: [/* @__PURE__ */ (0, T.jsx)("strong", { children: "Cero telemetría invasiva:" }), " No monitorea la actividad de tu PC, no registra pulsaciones de teclado, ni accede a periféricos, micrófonos o cámaras."] }),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("li", { children: [/* @__PURE__ */ (0, T.jsx)("strong", { children: "Exportación local:" }), " Recibe el contenido de la sesión o planificación desde el navegador y devuelve el archivo Word o PDF. Según el formato, puede utilizar archivos temporales durante la conversión."] }),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("h4", {
									style: {
										color: "var(--accent)",
										fontWeight: "700",
										marginTop: "0.5rem",
										display: "flex",
										alignItems: "center",
										gap: "0.4rem"
									},
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sparkles" })
										}),
										"\n                    3. ASISTENCIA PEDAGÓGICA CON INTELIGENCIA ARTIFICIAL Y CRÉDITOS\n                "
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("p", { children: [
									"Space Lab utiliza OpenAI, Google Gemini y DeepSeek para asistir en la redacción pedagógica. Al solicitar una función de IA, el contenido necesario de tu solicitud y, si los adjuntas, textos o imágenes, se envía mediante las funciones de Supabase al proveedor seleccionado. Estos proveedores procesan ese contenido según sus propias condiciones. Los nombres de alumnos no son necesarios para generar una sesión: evita incluir datos personales de estudiantes en instrucciones y adjuntos. Las claves de los proveedores permanecen en los secretos del servidor y no se entregan al navegador. El uso de IA se registra mediante un ",
									/* @__PURE__ */ (0, T.jsx)("strong", { children: "sistema de créditos" }),
									"."
								] }),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("h4", {
									style: {
										color: "var(--accent)",
										fontWeight: "700",
										marginTop: "0.5rem",
										display: "flex",
										alignItems: "center",
										gap: "0.4rem"
									},
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-file" })
										}),
										"\n                    4. PROPIEDAD INTELECTUAL Y TITULARIDAD DOCENTE\n                "
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("p", { children: [
									"Todas las sesiones de aprendizaje, programaciones curriculares, fichas de aplicación, rúbricas y materiales creados o editados en la plataforma son ",
									/* @__PURE__ */ (0, T.jsx)("strong", { children: "propiedad intelectual exclusiva del docente que los elabora" }),
									". Space Lab no se atribuye ningún derecho de autor sobre los contenidos pedagógicos generados por sus usuarios."
								] }),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("h4", {
									style: {
										color: "var(--accent)",
										fontWeight: "700",
										marginTop: "0.5rem",
										display: "flex",
										alignItems: "center",
										gap: "0.4rem"
									},
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-target" })
										}),
										"\n                    5. RESPONSABILIDAD Y AUTONOMÍA PEDAGÓGICA\n                "
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("p", { children: "La inteligencia artificial y los asistentes de Space Lab actúan como herramientas de apoyo para agilizar la labor administrativa y brindar sugerencias curriculares basadas en el CNEB. Es responsabilidad exclusiva del docente revisar, adecuar a su contexto real y validar pedagógicamente cada sesión antes de su desarrollo en el aula o presentación formal ante la dirección de su institución educativa, UGEL o DRE." }),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("h4", {
									style: {
										color: "var(--accent)",
										fontWeight: "700",
										marginTop: "0.5rem",
										display: "flex",
										alignItems: "center",
										gap: "0.4rem"
									},
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-shield" })
										}),
										"\n                    6. PROTECCIÓN DE DATOS PERSONALES (LEY N° 29733) Y DERECHOS ARCO\n                "
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("p", { children: "Supabase gestiona la autenticación y el almacenamiento de perfiles, sesiones, planificaciones y listas de alumnos que guardas en tu cuenta. El navegador conserva copias y borradores locales; en equipos compartidos, cada cuenta dispone de un espacio local separado. La información necesaria para las funciones de IA se procesa como se describe en la sección anterior. No vendemos ni alquilamos tus datos. Para solicitar acceso, rectificación, cancelación u oposición al tratamiento de tus datos, o la eliminación de tu cuenta y contenido, utiliza el canal oficial de soporte indicado a continuación. El alcance y los plazos de conservación y eliminación deben confirmarse con soporte durante la beta." }),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("h4", {
									style: {
										color: "var(--accent)",
										fontWeight: "700",
										marginTop: "0.5rem",
										display: "flex",
										alignItems: "center",
										gap: "0.4rem"
									},
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-mail" })
										}),
										"\n                    7. CANALES DE CONTACTO Y SOPORTE OFICIAL\n                "
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("p", { children: "Para consultas técnicas, asistencia con el motor local, dudas sobre privacidad o reportes, puedes comunicarte directamente con el desarrollador:" }),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									style: {
										display: "flex",
										flexWrap: "wrap",
										gap: "0.6rem",
										fontSize: "0.82rem"
									},
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("a", {
											href: "mailto:pabloclsa87@gmail.com",
											style: {
												display: "inline-flex",
												alignItems: "center",
												gap: "4px",
												padding: "4px 10px",
												background: "rgba(255,255,255,0.05)",
												border: "1px solid var(--border)",
												borderRadius: "6px",
												color: "var(--color-foreground)",
												textDecoration: "none"
											},
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-mail" })
												}),
												" pabloclsa87@gmail.com\n                    "
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("a", {
											href: "https://wa.me/51918165428",
											target: "_blank",
											rel: "noopener noreferrer",
											style: {
												display: "inline-flex",
												alignItems: "center",
												gap: "4px",
												padding: "4px 10px",
												background: "rgba(37, 211, 102, 0.1)",
												border: "1px solid rgba(37, 211, 102, 0.3)",
												borderRadius: "6px",
												color: "#25d366",
												textDecoration: "none"
											},
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-whatsapp" })
												}),
												" WhatsApp: 918 165 428\n                    "
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("a", {
											href: "https://space.sypablitodp.site",
											target: "_blank",
											rel: "noopener noreferrer",
											style: {
												display: "inline-flex",
												alignItems: "center",
												gap: "4px",
												padding: "4px 10px",
												background: "rgba(0, 210, 255, 0.1)",
												border: "1px solid rgba(0, 210, 255, 0.3)",
												borderRadius: "6px",
												color: "#00d2ff",
												textDecoration: "none"
											},
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-globe" })
												}),
												" space.sypablitodp.site\n                    "
											]
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("h4", {
									style: {
										color: "var(--accent)",
										fontWeight: "700",
										marginTop: "0.5rem",
										display: "flex",
										alignItems: "center",
										gap: "0.4rem"
									},
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-building" })
										}),
										"\n                    8. LEGISLACIÓN APLICABLE Y JURISDICCIÓN\n                "
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("p", { children: [
									"Los presentes Términos y Condiciones se rigen e interpretan según las leyes de la República del Perú. Para cualquier controversia, las partes se someten voluntariamente a la competencia exclusiva de los jueces y tribunales del distrito judicial de ",
									/* @__PURE__ */ (0, T.jsx)("strong", { children: "Huánuco, Perú" }),
									"."
								] }),
								"\n"
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							style: {
								marginTop: "1.5rem",
								paddingTop: "1rem",
								borderTop: "1px solid var(--border)",
								display: "flex",
								justifyContent: "flex-end",
								gap: "0.75rem"
							},
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("button", {
									id: "btn-accept-terms-modal",
									className: "btn btn-primary",
									style: {
										padding: "0.6rem 1.4rem",
										fontWeight: "600",
										display: "inline-flex",
										alignItems: "center",
										gap: "0.4rem"
									},
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-check" })
										}),
										"\n                    Entendido y Aceptar\n                "
									]
								}),
								"\n"
							]
						}),
						"\n"
					]
				}),
				"\n"
			]
		}),
		"\n"
	] });
}
// react-ui/src/surfaces/GlobalOverlays.tsx
function hs() {
	return /* @__PURE__ */ (0, T.jsxs)(T.Fragment, { children: [
		" ",
		"\n",
		/* @__PURE__ */ (0, T.jsx)("div", {
			id: "toast-container",
			className: "toast-container",
			children: /* @__PURE__ */ (0, T.jsx)(cs, {})
		}),
		"\n",
		/* @__PURE__ */ (0, T.jsx)(ds, {}),
		"\n",
		/* @__PURE__ */ (0, T.jsx)(us, {}),
		"\n",
		/* @__PURE__ */ (0, T.jsx)(ms, {}),
		"\n",
		"\n",
		/* @__PURE__ */ (0, T.jsxs)("div", {
			id: "loader-overlay",
			className: "loader-overlay hidden",
			children: [
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("div", {
					className: "loader-content",
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "loader-spinner",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("div", { className: "orbit" }),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("div", { className: "orbit orbit-2" }),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("div", { className: "orbit orbit-3" }),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("div", { className: "core" }),
								"\n"
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("p", {
							id: "loader-text",
							className: "loader-text",
							children: "Generando sesión con IA..."
						}),
						"\n"
					]
				}),
				"\n"
			]
		}),
		"\n",
		/* @__PURE__ */ (0, T.jsx)(ps, {}),
		"\n",
		/* @__PURE__ */ (0, T.jsx)(fs, {}),
		"\n",
		"\n",
		/* @__PURE__ */ (0, T.jsx)("canvas", {
			id: "space-bg",
			className: "space-background",
			hidden: !0,
			"aria-hidden": "true"
		}),
		"\n"
	] });
}
// react-ui/src/surfaces/Landing.tsx
function gs() {
	return /* @__PURE__ */ (0, T.jsxs)(T.Fragment, { children: [
		" ",
		"\n",
		/* @__PURE__ */ (0, T.jsxs)("div", {
			id: "landing-view",
			className: "landing-view",
			children: [
				"\n",
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("header", {
					className: "landing-navbar",
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("a", {
							href: "#/",
							className: "landing-brand",
							"aria-label": "Space Lab - Inicio",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "landing-brand-logo",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("img", {
											src: "assets/favicon.svg",
											alt: "Space Lab Logo"
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "landing-brand-text",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "landing-brand-title",
											children: "Space Lab"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "landing-brand-badge",
											children: "MINEDU 2026 · CNEB"
										}),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("ul", {
							className: "landing-nav-links",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("li", { children: /* @__PURE__ */ (0, T.jsx)("a", {
									href: "#como-funciona",
									className: "landing-nav-link",
									children: "¿Cómo Funciona?"
								}) }),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("li", { children: /* @__PURE__ */ (0, T.jsx)("a", {
									href: "#motor-local",
									className: "landing-nav-link",
									children: "Motor Local"
								}) }),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("li", { children: /* @__PURE__ */ (0, T.jsx)("a", {
									href: "#modelos-ia",
									className: "landing-nav-link",
									children: "Modelos IA"
								}) }),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("li", { children: /* @__PURE__ */ (0, T.jsx)("a", {
									href: "#preguntas-frecuentes",
									className: "landing-nav-link",
									children: "Preguntas Frecuentes"
								}) }),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("li", { children: /* @__PURE__ */ (0, T.jsx)("a", {
									href: "#contacto",
									className: "landing-nav-link",
									children: "Contacto"
								}) }),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("li", { children: /* @__PURE__ */ (0, T.jsx)("a", {
									href: "descargas_landing.html",
									className: "landing-nav-link",
									children: "Descargas"
								}) }),
								"\n"
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "landing-nav-actions",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("label", {
									className: "theme-picker",
									title: "Tema de la aplicación",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-theme" })
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "sr-only",
											children: "Tema de la aplicación"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("select", {
											"data-theme-selector": "",
											"aria-label": "Tema de la aplicación",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("option", {
													value: "system",
													children: "Sistema"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("option", {
													value: "light",
													children: "Claro"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("option", {
													value: "dark",
													children: "Oscuro"
												}),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("button", {
									type: "button",
									className: "btn btn-ghost btn-sm",
									"data-action": "open-login",
									"aria-label": "Iniciar sesión con tu cuenta",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-user" })
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", { children: "Iniciar Sesión" }),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("button", {
									type: "button",
									className: "btn btn-primary btn-sm",
									"data-action": "enter-app",
									"aria-label": "Abrir editor de sesiones de aprendizaje",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sparkles" })
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", { children: "Ir al Editor" }),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n"
					]
				}),
				"\n",
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("section", {
					className: "landing-hero",
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "landing-hero-copy",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "landing-pill-badge",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sparkles" })
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", { children: "Plataforma Inteligente MINEDU 2026 · CNEB Perú" }),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("h1", {
									className: "landing-hero-title",
									children: [
										"\n                    Menos tiempo planificando.",
										/* @__PURE__ */ (0, T.jsx)("br", {}),
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "highlight",
											children: "Más tiempo enseñando."
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("p", {
									className: "landing-hero-subtitle",
									children: [
										"\n                    Prepara tu próxima clase para ",
										/* @__PURE__ */ (0, T.jsx)("strong", { children: "Inicial, Primaria o Secundaria" }),
										". Elige los aprendizajes, construye tu sesión con ayuda de la IA y dale tu toque antes de exportarla a ",
										/* @__PURE__ */ (0, T.jsx)("strong", { children: "Word o PDF" }),
										".\n                "
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "landing-hero-actions",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("button", {
											type: "button",
											className: "landing-btn-lg landing-btn-primary",
											"data-action": "enter-app",
											"aria-label": "Comenzar a planificar sesión de aprendizaje gratis",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sparkles" })
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", { children: "Crear mi sesión" }),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-arrow-right" })
												}),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("a", {
											href: "#como-funciona",
											className: "landing-btn-lg landing-btn-ghost",
											"aria-label": "Ver cómo funciona la plataforma",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", { children: "Ver Cómo Funciona" }),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "landing-badges-row",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "landing-badge-item",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-check" })
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", { children: "CNEB 2026 Oficial" }),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "landing-badge-item",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sparkles" })
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", { children: "GPT-6 Luna & DeepSeek R1" }),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "landing-badge-item",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-file" })
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", { children: "Motor Word (.docx) Nativo" }),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "landing-badge-item",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-shield" })
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", { children: "Privado y Seguro" }),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n",
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "landing-hero-preview landing-lesson-visual",
							role: "img",
							"aria-label": "Ejemplo de planificación: elegir competencias y capacidades, revisar la sesión y llevarla a Word o PDF.",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "lesson-scene",
									"aria-hidden": "true",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("div", { className: "lesson-dot-grid" }),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "lesson-mini-app",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("div", {
													className: "lesson-mini-top",
													children: [/* @__PURE__ */ (0, T.jsxs)("span", { children: [/* @__PURE__ */ (0, T.jsx)("svg", {
														className: "ui-icon",
														children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-folder" })
													}), " Tu próxima clase"] }), /* @__PURE__ */ (0, T.jsxs)("span", {
														className: "lesson-mini-saved",
														children: [/* @__PURE__ */ (0, T.jsx)("i", {}), " Guardado"]
													})]
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("div", {
													className: "lesson-mini-body",
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("div", {
															className: "lesson-mini-steps",
															children: [
																/* @__PURE__ */ (0, T.jsxs)("span", { children: [/* @__PURE__ */ (0, T.jsx)("svg", {
																	className: "ui-icon",
																	children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-check" })
																}), " Datos"] }),
																/* @__PURE__ */ (0, T.jsx)("strong", { children: "2 Aprendizajes" }),
																/* @__PURE__ */ (0, T.jsx)("span", { children: "3 Revisión" })
															]
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("span", {
															className: "lesson-mini-context",
															children: "MATEMÁTICA · 2.° DE SECUNDARIA"
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("h2", { children: [
															"Aprender también",
															/* @__PURE__ */ (0, T.jsx)("br", {}),
															"empieza con elegir."
														] }),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("p", { children: "¿Qué trabajarán tus estudiantes?" }),
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("div", {
															className: "lesson-mini-option selected",
															children: [/* @__PURE__ */ (0, T.jsx)("span", {
																className: "lesson-mini-check",
																children: /* @__PURE__ */ (0, T.jsx)("svg", {
																	className: "ui-icon",
																	children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-check" })
																})
															}), /* @__PURE__ */ (0, T.jsxs)("span", { children: ["Resuelve problemas de cantidad", /* @__PURE__ */ (0, T.jsx)("small", { children: "4 capacidades disponibles" })] })]
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("div", {
															className: "lesson-mini-option",
															children: [/* @__PURE__ */ (0, T.jsx)("span", { className: "lesson-mini-box" }), /* @__PURE__ */ (0, T.jsxs)("span", { children: [
																"Resuelve problemas de regularidad,",
																/* @__PURE__ */ (0, T.jsx)("br", {}),
																"equivalencia y cambio"
															] })]
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("div", {
															className: "lesson-mini-capacity",
															children: [/* @__PURE__ */ (0, T.jsx)("svg", {
																className: "ui-icon",
																children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-check" })
															}), " Traduce cantidades a expresiones numéricas"]
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("div", {
															className: "lesson-mini-capacity",
															children: [/* @__PURE__ */ (0, T.jsx)("svg", {
																className: "ui-icon",
																children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-check" })
															}), " Argumenta sus procedimientos"]
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("div", {
															className: "lesson-mini-bottom",
															children: "Tu sesión va tomando forma"
														}),
														"\n"
													]
												}),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "lesson-floating-paper",
											children: [
												/* @__PURE__ */ (0, T.jsxs)("span", {
													className: "lesson-paper-label",
													children: [/* @__PURE__ */ (0, T.jsx)("svg", {
														className: "ui-icon",
														children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-file" })
													}), " TU SESIÓN, LISTA PARA EL AULA"]
												}),
												/* @__PURE__ */ (0, T.jsxs)("div", {
													className: "lesson-paper-lines",
													children: [
														/* @__PURE__ */ (0, T.jsx)("i", {}),
														/* @__PURE__ */ (0, T.jsx)("i", {}),
														/* @__PURE__ */ (0, T.jsx)("i", {})
													]
												}),
												/* @__PURE__ */ (0, T.jsxs)("div", {
													className: "lesson-paper-table",
													children: [
														/* @__PURE__ */ (0, T.jsx)("span", { children: "Inicio" }),
														/* @__PURE__ */ (0, T.jsx)("i", {}),
														/* @__PURE__ */ (0, T.jsx)("span", { children: "Desarrollo" }),
														/* @__PURE__ */ (0, T.jsx)("i", {}),
														/* @__PURE__ */ (0, T.jsx)("span", { children: "Cierre" }),
														/* @__PURE__ */ (0, T.jsx)("i", {})
													]
												}),
												/* @__PURE__ */ (0, T.jsxs)("div", {
													className: "lesson-paper-formats",
													children: [
														"WORD ",
														/* @__PURE__ */ (0, T.jsx)("span", { children: "·" }),
														" PDF ",
														/* @__PURE__ */ (0, T.jsx)("svg", {
															className: "ui-icon",
															children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-check" })
														})
													]
												})
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "lesson-teacher-note",
											children: [/* @__PURE__ */ (0, T.jsx)("svg", {
												className: "ui-icon",
												children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sparkles" })
											}), /* @__PURE__ */ (0, T.jsxs)("span", { children: [
												"La IA propone.",
												/* @__PURE__ */ (0, T.jsx)("br", {}),
												/* @__PURE__ */ (0, T.jsx)("strong", { children: "Tú le das tu toque." })
											] })]
										}),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n"
					]
				}),
				"\n",
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("section", {
					id: "como-funciona",
					className: "landing-section",
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "landing-section-header",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("span", {
									className: "landing-section-eyebrow",
									children: "Flujo Pedagógico"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("h2", {
									className: "landing-section-title",
									children: "¿Cómo Funciona en 3 Simples Pasos?"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("p", {
									className: "landing-section-desc",
									children: "Diseñado para ahorrarte horas de trabajo administrativo y enfocarte en la enseñanza."
								}),
								"\n"
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "landing-steps-grid",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "landing-step-card",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "landing-step-number",
											children: "1"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("h3", {
											className: "landing-step-title",
											children: "Configuración Curricular CNEB"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("p", {
											className: "landing-step-text",
											children: "Elige tu nivel educativo (Inicial, Primaria o Secundaria), área, grado, competencias y capacidades precargadas del CNEB de forma automática."
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "landing-step-card",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "landing-step-number",
											children: "2"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("h3", {
											className: "landing-step-title",
											children: "Generación Pedagógica con IA"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("p", {
											className: "landing-step-text",
											children: "Los modelos de IA (GPT-6 Luna, DeepSeek R1 o Gemini) redactan situaciones significativas, la secuencia didáctica completa (Inicio, Desarrollo, Cierre) y los criterios de evaluación."
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "landing-step-card",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "landing-step-number",
											children: "3"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("h3", {
											className: "landing-step-title",
											children: "Compilación Nativa con Motor Local"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("p", {
											className: "landing-step-text",
											children: "Descarga el motor de escritorio para compilar Word (.docx) nativo con tablas CNEB perfectas, fórmulas matemáticas OMML editables y membretes oficiales sin descuadres."
										}),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n"
					]
				}),
				"\n",
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("section", {
					id: "motor-local",
					className: "landing-section",
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "landing-section-header",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("span", {
									className: "landing-section-eyebrow",
									children: "Arquitectura Híbrida"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("h2", {
									className: "landing-section-title",
									children: "¿Por qué Space Lab Incluye un Motor Local?"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("p", {
									className: "landing-section-desc",
									children: "Unificamos la flexibilidad de la web con la potencia del compilador nativo de escritorio para documentos Word (.docx) de máxima fidelidad."
								}),
								"\n"
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "motor-local-card",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "motor-local-info",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "motor-local-badge",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sparkles" })
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", { children: "Fidelidad Documental 100%" }),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("h3", {
											className: "motor-local-title",
											children: "Motor Local de Exportación para Windows"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("p", {
											className: "motor-local-desc",
											children: [
												"\n                        Los navegadores web no pueden crear de forma nativa documentos de Microsoft Word con tablas anidadas multinivel, márgenes físicos A4 de imprenta ni fórmulas matemáticas editables (OMML). Por eso creamos ",
												/* @__PURE__ */ (0, T.jsx)("strong", { children: "pablitopyhost.exe" }),
												": un motor ultraligero que corre en tu PC y se comunica de forma transparente y segura con esta aplicación web a través de ",
												/* @__PURE__ */ (0, T.jsx)("code", { children: "localhost:8000" }),
												".\n                    "
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "motor-local-features",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("div", {
													className: "motor-feature-item",
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsx)("svg", {
															className: "ui-icon",
															"aria-hidden": "true",
															children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-check" })
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("span", { children: "Tablas CNEB oficiales sin celdas descuadradas" }),
														"\n"
													]
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("div", {
													className: "motor-feature-item",
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsx)("svg", {
															className: "ui-icon",
															"aria-hidden": "true",
															children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-check" })
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("span", { children: "Ecuaciones matemáticas editables en formato OMML" }),
														"\n"
													]
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("div", {
													className: "motor-feature-item",
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsx)("svg", {
															className: "ui-icon",
															"aria-hidden": "true",
															children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-check" })
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("span", { children: "Membretes institucionales de DRE y UGEL" }),
														"\n"
													]
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("div", {
													className: "motor-feature-item",
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsx)("svg", {
															className: "ui-icon",
															"aria-hidden": "true",
															children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-check" })
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("span", { children: "Exportación instantánea sin límites de memoria web" }),
														"\n"
													]
												}),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "motor-local-actions",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("a", {
													href: "descargas_landing.html",
													className: "landing-btn-lg landing-btn-primary",
													"aria-label": "Ir a la página de descarga del motor local",
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsx)("svg", {
															className: "ui-icon",
															"aria-hidden": "true",
															children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-download" })
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("span", { children: "Descargar Motor Local (.exe)" }),
														"\n"
													]
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("a", {
													href: "conexion.html",
													className: "landing-btn-lg landing-btn-ghost",
													"aria-label": "Ver estado de conexión del motor",
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsx)("svg", {
															className: "ui-icon",
															"aria-hidden": "true",
															children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-refresh" })
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("span", { children: "Verificar Estado de Conexión" }),
														"\n"
													]
												}),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n"
					]
				}),
				"\n",
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("section", {
					id: "modelos-ia",
					className: "landing-section",
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "landing-section-header",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("span", {
									className: "landing-section-eyebrow",
									children: "Tecnología de Vanguardia"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("h2", {
									className: "landing-section-title",
									children: "Impulsado por los Mejores Modelos de IA"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("p", {
									className: "landing-section-desc",
									children: "Elige el motor de inteligencia artificial que mejor se adapte a tu estilo pedagógico."
								}),
								"\n"
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "landing-models-grid",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "landing-model-card",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "landing-model-badge",
											children: "Nuevo"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "landing-model-icon",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sparkles" })
												}),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("h3", {
											className: "landing-model-title",
											children: "GPT-6 Luna"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "landing-model-provider",
											children: "OpenAI Router"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("p", {
											className: "landing-model-desc",
											children: "Máxima agilidad y creatividad en el planteamiento de situaciones significativas contextualizadas a la realidad y coyuntura peruana."
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "landing-model-card",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "landing-model-badge",
											style: {
												background: "rgba(123, 97, 255, 0.15)",
												color: "#7b61ff",
												borderColor: "rgba(123, 97, 255, 0.3)"
											},
											children: "Recomendado"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "landing-model-icon",
											style: { color: "#7b61ff" },
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-target" })
												}),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("h3", {
											className: "landing-model-title",
											children: "DeepSeek R1 / V3"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "landing-model-provider",
											children: "DeepSeek Router"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("p", {
											className: "landing-model-desc",
											children: "Razonamiento pedagógico profundo, coherencia estricta en la alineación de propósitos y diseño de instrumentos de evaluación formativa."
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "landing-model-card",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "landing-model-badge",
											style: {
												background: "rgba(16, 185, 129, 0.15)",
												color: "#10b981",
												borderColor: "rgba(16, 185, 129, 0.3)"
											},
											children: "Rápido"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "landing-model-icon",
											style: { color: "#10b981" },
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-check" })
												}),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("h3", {
											className: "landing-model-title",
											children: "Gemini 2.5 Flash"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "landing-model-provider",
											children: "Google DeepMind"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("p", {
											className: "landing-model-desc",
											children: "Velocidad instantánea para actividades prácticas de inicio, desarrollo y cierre, fichas de trabajo y adaptación a distintos ritmos de aprendizaje."
										}),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n"
					]
				}),
				"\n",
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("section", {
					id: "preguntas-frecuentes",
					className: "landing-section",
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "landing-section-header",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("span", {
									className: "landing-section-eyebrow",
									children: "Respuestas Claras"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("h2", {
									className: "landing-section-title",
									children: "Preguntas Frecuentes para Docentes"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("p", {
									className: "landing-section-desc",
									children: "Todo lo que necesitas saber sobre la plataforma, el motor local y el currículo."
								}),
								"\n"
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "landing-faq-container",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "landing-faq-item",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("h3", {
											className: "landing-faq-question",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-download" })
												}),
												"\n                        ¿Qué es el Motor Local y por qué debo descargarlo?\n                    "
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("p", {
											className: "landing-faq-answer",
											children: [
												"Para que tus sesiones se descarguen en Microsoft Word (.docx) con las tablas oficiales del MINEDU, márgenes exactos, listas de cotejo y fórmulas matemáticas editables (OMML) sin que se mueva ninguna celda, desarrollamos un motor nativo (",
												/* @__PURE__ */ (0, T.jsx)("code", { children: "pablitopyhost.exe" }),
												"). Se ejecuta en segundo plano en tu computadora y procesa el documento con máxima fidelidad."
											]
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "landing-faq-item",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("h3", {
											className: "landing-faq-question",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-check" })
												}),
												"\n                        ¿Puedo usar la plataforma sin descargar el motor local?\n                    "
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("p", {
											className: "landing-faq-answer",
											children: "Sí. Puedes diseñar, redactar, editar, guardar en la nube o localmente, y utilizar todos los modelos de Inteligencia Artificial directamente en tu navegador. El motor local solo es necesario cuando deseas compilar y descargar tus sesiones en formato Word (.docx) editable de alta fidelidad."
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "landing-faq-item",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("h3", {
											className: "landing-faq-question",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-target" })
												}),
												"\n                        ¿Cómo se alinea al Currículo Nacional de la Educación Básica (CNEB)?\n                    "
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("p", {
											className: "landing-faq-answer",
											children: "Toda la base de datos de competencias, capacidades, desempeños por grado y ciclo (Inicial, Primaria y Secundaria), enfoques transversales e instrumentos de evaluación está completamente estructurada según las directivas curriculares vigentes del Ministerio de Educación del Perú (MINEDU)."
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "landing-faq-item",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("h3", {
											className: "landing-faq-question",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sparkles" })
												}),
												"\n                        ¿Qué modelos de Inteligencia Artificial están disponibles?\n                    "
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("p", {
											className: "landing-faq-answer",
											children: "Dispones de una arquitectura multi-modelo conectada a través de routers seguros: GPT-6 Luna de OpenAI, DeepSeek V3 y Reasoner R1 para razonamiento pedagógico profundo, y Google Gemini 2.5 Flash para generación ultrarrápida de actividades y criterios."
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "landing-faq-item",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("h3", {
											className: "landing-faq-question",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sliders" })
												}),
												"\n                        ¿Cómo funciona el sistema de créditos y monetización automatizada?\n                    "
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("p", {
											className: "landing-faq-answer",
											children: "La plataforma cuenta con un sistema de créditos automatizado gestionado en la nube con Supabase. No requiere procesos manuales de verificación: tus créditos de IA se recargan y acreditan de forma automática para que puedas seguir planificando sin interrupciones."
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "landing-faq-item",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("h3", {
											className: "landing-faq-question",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-shield" })
												}),
												"\n                        ¿Mis sesiones y datos personales están seguros?\n                    "
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("p", {
											className: "landing-faq-answer",
											children: "Totalmente seguros. Tus sesiones se guardan localmente en tu propio dispositivo (LocalStorage e IndexedDB) y, si inicias sesión, se sincronizan en la nube mediante Supabase con políticas de seguridad de nivel de fila (RLS). Tu información docente nunca se comparte con terceros."
										}),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n"
					]
				}),
				"\n",
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("section", {
					className: "landing-cta-banner",
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "landing-cta-card",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("h2", {
									className: "landing-cta-title",
									children: "¿Listo para Planificar tu Próxima Sesión?"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("p", {
									className: "landing-cta-text",
									children: "Únete a los docentes que ya optimizan su tiempo administrativo con inteligencia artificial curricular."
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("button", {
									type: "button",
									className: "landing-btn-lg landing-btn-primary",
									"data-action": "enter-app",
									"aria-label": "Entrar al editor y planificar sesión ahora",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sparkles" })
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", { children: "Entrar al Editor y Crear mi Sesión Ahora" }),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-arrow-right" })
										}),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n"
					]
				}),
				"\n",
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("section", {
					id: "contacto",
					className: "landing-contact-section",
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "landing-contact-content",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("h2", {
									className: "landing-contact-title",
									children: "ESTABLECER ENLACE"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("div", { className: "landing-contact-divider" }),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("p", {
									className: "landing-contact-desc",
									children: "\n                    ¿Tienes un proyecto en mente o necesitas una solución digital? Transmite tus requerimientos por cualquiera de estos canales.\n                "
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "landing-contact-buttons",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("a", {
											href: "https://wa.me/51918165428",
											target: "_blank",
											rel: "noopener noreferrer",
											className: "contact-btn contact-btn-whatsapp",
											"aria-label": "Contactar por WhatsApp al 918165428",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-whatsapp" })
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", { children: "WHATSAPP" }),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("a", {
											href: "mailto:pabloclsa87@gmail.com",
											className: "contact-btn contact-btn-email",
											"aria-label": "Enviar correo a pabloclsa87@gmail.com",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-mail" })
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", { children: "EMAIL" }),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("a", {
											href: "https://space.sypablitodp.site",
											target: "_blank",
											rel: "noopener noreferrer",
											className: "contact-btn contact-btn-web",
											"aria-label": "Visitar sitio personal space.sypablitodp.site",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-globe" })
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", { children: "WEB PERSONAL" }),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n"
					]
				}),
				"\n",
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("footer", {
					className: "landing-footer",
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "landing-creator-box",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "landing-creator-icon",
									"aria-hidden": "true",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sparkles" })
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("p", {
									className: "landing-creator-text",
									children: [
										"\n                    SISTEMA CREADO CON ",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon icon-heart",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-heart" })
										}),
										" POR ",
										/* @__PURE__ */ (0, T.jsx)("a", {
											href: "https://space.sypablitodp.site",
											target: "_blank",
											rel: "noopener noreferrer",
											className: "creator-highlight",
											children: "SAMUEL PABLO CLAUDIO"
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("span", {
									className: "landing-classified-tag",
									children: "© 2026 PABLITO_DP — ACCESO CLASIFICADO"
								}),
								"\n"
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "landing-footer-links",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("a", {
									href: "https://space.sypablitodp.site",
									target: "_blank",
									rel: "noopener noreferrer",
									className: "landing-footer-link",
									children: "space.sypablitodp.site"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("a", {
									href: "descargas_landing.html",
									className: "landing-footer-link",
									children: "Motor Local de Word"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("a", {
									href: "conexion.html",
									className: "landing-footer-link",
									children: "Estado de Conexión"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("a", {
									href: "#",
									id: "link-terms-footer",
									className: "landing-footer-link",
									children: "Términos y Privacidad"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("a", {
									href: "#/app",
									className: "landing-footer-link",
									"data-action": "enter-app",
									children: "Ir al Editor"
								}),
								"\n"
							]
						}),
						"\n"
					]
				}),
				"\n"
			]
		}),
		"\n"
	] });
}
// react-ui/src/surfaces/Home.tsx
function _s() {
	return /* @__PURE__ */ (0, T.jsxs)(T.Fragment, { children: [
		" ",
		"\n",
		/* @__PURE__ */ (0, T.jsxs)("div", {
			id: "home-view",
			className: "home-view hidden",
			children: [
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("header", {
					className: "home-header",
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("button", {
							type: "button",
							className: "home-brand",
							"data-action": "view-home",
							"aria-label": "Ir a Mi espacio",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("span", {
									className: "home-brand-mark",
									children: /* @__PURE__ */ (0, T.jsx)("img", {
										src: "assets/favicon.svg",
										alt: "",
										"aria-hidden": "true"
									})
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("span", { children: [
									"\n",
									/* @__PURE__ */ (0, T.jsx)("strong", { children: "Space Lab" }),
									"\n",
									/* @__PURE__ */ (0, T.jsx)("small", { children: "Mi espacio docente" }),
									"\n"
								] }),
								"\n"
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("nav", {
							className: "home-nav",
							"aria-label": "Navegación principal",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("a", {
									href: "#/home",
									className: "home-nav-link active",
									children: "Mi espacio"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("a", {
									href: "#/sessions",
									className: "home-nav-link",
									children: "Mis sesiones"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("a", {
									href: "mailto:pabloclsa87@gmail.com",
									className: "home-nav-link",
									children: "Soporte"
								}),
								"\n"
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "home-account",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("label", {
									className: "theme-picker",
									title: "Tema de la aplicación",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-theme" })
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "sr-only",
											children: "Tema de la aplicación"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("select", {
											"data-theme-selector": "",
											"aria-label": "Tema de la aplicación",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("option", {
													value: "system",
													children: "Sistema"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("option", {
													value: "light",
													children: "Claro"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("option", {
													value: "dark",
													children: "Oscuro"
												}),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "home-account-copy",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("strong", {
											id: "home-account-name",
											children: "Docente"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											id: "home-account-plan",
											children: "Plan docente"
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("span", {
									id: "home-account-avatar",
									className: "home-account-avatar",
									"aria-hidden": "true",
									children: "D"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("button", {
									type: "button",
									id: "home-logout",
									className: "btn btn-ghost btn-sm",
									title: "Cerrar sesión",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-logout" })
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", { children: "Salir" }),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n"
					]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("main", {
					className: "home-main",
					id: "home-main",
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("section", {
							className: "home-welcome",
							"aria-labelledby": "home-welcome-title",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "home-welcome-copy",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "home-eyebrow",
											children: "Tu centro de planificación"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("h1", {
											id: "home-welcome-title",
											children: "Bienvenido a tu espacio docente"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("p", { children: "Continúa una planificación o crea una nueva sesión con una guía clara, paso a paso." }),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "home-primary-actions",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("button", {
													type: "button",
													className: "btn btn-primary home-primary-button",
													"data-home-action": "new-session",
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsx)("svg", {
															className: "ui-icon",
															"aria-hidden": "true",
															children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-plus" })
														}),
														"\n                            Crear nueva sesión\n                        "
													]
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("button", {
													type: "button",
													id: "home-continue-session",
													className: "btn btn-ghost home-secondary-button hidden",
													"data-home-action": "continue-session",
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsx)("svg", {
															className: "ui-icon",
															"aria-hidden": "true",
															children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-edit" })
														}),
														"\n                            Continuar último borrador\n                        "
													]
												}),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("aside", {
									className: "home-guide",
									"aria-label": "Guía para comenzar",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "home-guide-heading",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", {
													className: "home-guide-icon",
													children: /* @__PURE__ */ (0, T.jsx)("svg", {
														className: "ui-icon",
														"aria-hidden": "true",
														children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sparkles" })
													})
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("div", { children: [
													"\n",
													/* @__PURE__ */ (0, T.jsx)("span", { children: "Primera sesión" }),
													"\n",
													/* @__PURE__ */ (0, T.jsx)("strong", { children: "Te acompañamos en cada paso" }),
													"\n"
												] }),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("ol", {
											className: "home-guide-steps",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("li", { children: [/* @__PURE__ */ (0, T.jsx)("span", { children: "1" }), /* @__PURE__ */ (0, T.jsxs)("p", { children: [/* @__PURE__ */ (0, T.jsx)("strong", { children: "Completa los datos" }), "Indica nivel, área y propósito."] })] }),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("li", { children: [/* @__PURE__ */ (0, T.jsx)("span", { children: "2" }), /* @__PURE__ */ (0, T.jsxs)("p", { children: [/* @__PURE__ */ (0, T.jsx)("strong", { children: "Genera con IA" }), "Obtén una propuesta alineada al CNEB."] })] }),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("li", { children: [/* @__PURE__ */ (0, T.jsx)("span", { children: "3" }), /* @__PURE__ */ (0, T.jsxs)("p", { children: [/* @__PURE__ */ (0, T.jsx)("strong", { children: "Revisa y exporta" }), "Edita libremente y descarga tu documento."] })] }),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("section", {
							className: "home-summary",
							"aria-label": "Resumen de la cuenta",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("article", {
									className: "home-summary-card",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "home-summary-icon",
											children: /* @__PURE__ */ (0, T.jsx)("svg", {
												className: "ui-icon",
												"aria-hidden": "true",
												children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-file" })
											})
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", { children: [/* @__PURE__ */ (0, T.jsx)("strong", {
											id: "home-session-count",
											children: "0"
										}), /* @__PURE__ */ (0, T.jsx)("span", { children: "Sesiones guardadas" })] }),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("article", {
									className: "home-summary-card",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "home-summary-icon accent-purple",
											children: /* @__PURE__ */ (0, T.jsx)("svg", {
												className: "ui-icon",
												"aria-hidden": "true",
												children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sparkles" })
											})
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", { children: [/* @__PURE__ */ (0, T.jsx)("strong", {
											id: "home-credit-count",
											children: "--"
										}), /* @__PURE__ */ (0, T.jsx)("span", { children: "Créditos de IA" })] }),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("article", {
									className: "home-summary-card home-plan-summary",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "home-summary-icon accent-green",
											children: /* @__PURE__ */ (0, T.jsx)("svg", {
												className: "ui-icon",
												"aria-hidden": "true",
												children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-shield" })
											})
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "home-plan-summary-copy",
											children: [/* @__PURE__ */ (0, T.jsx)("strong", {
												id: "home-plan-name",
												children: "Docente"
											}), /* @__PURE__ */ (0, T.jsx)("span", { children: "Plan actual" })]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("button", {
											type: "button",
											className: "home-plan-link",
											"data-home-action": "view-plans",
											children: [
												"\n                        Ver planes\n                        ",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-arrow-right" })
												}),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("section", {
							className: "home-section",
							"aria-labelledby": "home-tools-title",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "home-section-heading",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", { children: [
											"\n",
											/* @__PURE__ */ (0, T.jsx)("span", {
												className: "home-eyebrow",
												children: "Herramientas"
											}),
											"\n",
											/* @__PURE__ */ (0, T.jsx)("h2", {
												id: "home-tools-title",
												children: "¿Qué deseas preparar?"
											}),
											"\n"
										] }),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "home-tool-grid",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("article", {
											className: "home-tool-card home-tool-card-active",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", {
													className: "home-tool-icon",
													children: /* @__PURE__ */ (0, T.jsx)("svg", {
														className: "ui-icon",
														"aria-hidden": "true",
														children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-file" })
													})
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("div", {
													className: "home-tool-copy",
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsx)("span", {
															className: "home-tool-status",
															children: "Disponible"
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("h3", { children: "Sesión individual" }),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("p", { children: "Diseña, genera y exporta sesiones alineadas al CNEB para Inicial, Primaria y Secundaria." }),
														"\n"
													]
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("button", {
													type: "button",
													className: "home-tool-action",
													"data-home-action": "new-session",
													children: [
														"\n                            Crear sesión ",
														/* @__PURE__ */ (0, T.jsx)("svg", {
															className: "ui-icon",
															"aria-hidden": "true",
															children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-arrow-right" })
														}),
														"\n"
													]
												}),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("article", {
											className: "home-tool-card home-tool-card-active",
											"aria-label": "Planificación articulada",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", {
													className: "home-tool-icon",
													children: /* @__PURE__ */ (0, T.jsx)("svg", {
														className: "ui-icon",
														"aria-hidden": "true",
														children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-folder" })
													})
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("div", {
													className: "home-tool-copy",
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsx)("span", {
															className: "home-tool-status",
															children: "Beta"
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("h3", { children: "Planificación articulada" }),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("p", { children: "Experiencias, Unidades y Proyectos de aprendizaje. Construye y guarda tu mapa paso a paso." }),
														"\n"
													]
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("button", {
													type: "button",
													className: "home-tool-action",
													"data-open-planning": "",
													children: "Abrir planificaciones"
												}),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("section", {
							id: "home-sessions-section",
							className: "home-section home-sessions-section",
							"aria-labelledby": "home-sessions-title",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "home-section-heading",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", { children: [
											"\n",
											/* @__PURE__ */ (0, T.jsx)("span", {
												className: "home-eyebrow",
												children: "Biblioteca personal"
											}),
											"\n",
											/* @__PURE__ */ (0, T.jsx)("h2", {
												id: "home-sessions-title",
												children: "Mis sesiones"
											}),
											"\n"
										] }),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("button", {
											type: "button",
											id: "home-toggle-all-sessions",
											className: "btn btn-ghost btn-sm hidden",
											children: "Ver todas"
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("div", {
									id: "home-session-list",
									className: "home-session-list",
									"aria-live": "polite",
									children: /* @__PURE__ */ (0, T.jsx)(os, {})
								})
							]
						}),
						"\n"
					]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("dialog", {
					id: "home-plans-dialog",
					className: "home-plans-dialog",
					"aria-labelledby": "home-plans-title",
					"aria-describedby": "home-plans-description",
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "home-plans-shell",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("header", {
									className: "home-plans-header",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", { children: [
											"\n",
											/* @__PURE__ */ (0, T.jsx)("span", {
												className: "home-eyebrow",
												children: "Comparación de planes"
											}),
											"\n",
											/* @__PURE__ */ (0, T.jsx)("h2", {
												id: "home-plans-title",
												children: "Conoce qué incluye cada plan"
											}),
											"\n",
											/* @__PURE__ */ (0, T.jsx)("p", {
												id: "home-plans-description",
												children: "Conoce las diferencias antes de decidir. Los cambios de plan y los pagos todavía no están habilitados."
											}),
											"\n"
										] }),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("button", {
											type: "button",
											className: "home-plans-close",
											"data-home-action": "close-plans",
											"aria-label": "Cerrar comparación de planes",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-close" })
												}),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "home-plans-grid",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("article", {
											className: "home-plan-card",
											"data-plan-code": "free",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("div", {
													className: "home-plan-card-heading",
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("div", { children: [/* @__PURE__ */ (0, T.jsx)("span", {
															className: "home-plan-kicker",
															children: "Para comenzar"
														}), /* @__PURE__ */ (0, T.jsx)("h3", { children: "Gratuito" })] }),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("span", {
															className: "home-plan-current-badge",
															hidden: !0,
															children: "Tu plan actual"
														}),
														"\n"
													]
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("p", {
													className: "home-plan-description",
													children: "Lo esencial para crear y guardar tus primeras sesiones."
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("p", {
													className: "home-plan-credits",
													children: [/* @__PURE__ */ (0, T.jsx)("strong", { children: "30" }), /* @__PURE__ */ (0, T.jsx)("span", { children: "créditos de IA por ciclo" })]
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("ul", {
													className: "home-plan-benefits",
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("li", { children: [/* @__PURE__ */ (0, T.jsx)("svg", {
															className: "ui-icon",
															"aria-hidden": "true",
															children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-check" })
														}), "Crear sesiones con IA"] }),
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("li", { children: [/* @__PURE__ */ (0, T.jsx)("svg", {
															className: "ui-icon",
															"aria-hidden": "true",
															children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-check" })
														}), "Guardar tus planificaciones"] }),
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("li", { children: [/* @__PURE__ */ (0, T.jsx)("svg", {
															className: "ui-icon",
															"aria-hidden": "true",
															children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-check" })
														}), "Exportar a Word y PDF"] }),
														"\n"
													]
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", {
													className: "home-plan-status",
													children: "En desarrollo"
												}),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("article", {
											className: "home-plan-card",
											"data-plan-code": "beta_teacher",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("div", {
													className: "home-plan-card-heading",
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("div", { children: [/* @__PURE__ */ (0, T.jsx)("span", {
															className: "home-plan-kicker",
															children: "Acceso anticipado"
														}), /* @__PURE__ */ (0, T.jsx)("h3", { children: "Docente Beta" })] }),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("span", {
															className: "home-plan-current-badge",
															hidden: !0,
															children: "Tu plan actual"
														}),
														"\n"
													]
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("p", {
													className: "home-plan-description",
													children: "Para docentes que prueban y ayudan a mejorar Space Lab."
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("p", {
													className: "home-plan-credits",
													children: [/* @__PURE__ */ (0, T.jsx)("strong", { children: "100" }), /* @__PURE__ */ (0, T.jsx)("span", { children: "créditos de IA por ciclo" })]
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("ul", {
													className: "home-plan-benefits",
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("li", { children: [/* @__PURE__ */ (0, T.jsx)("svg", {
															className: "ui-icon",
															"aria-hidden": "true",
															children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-check" })
														}), "Todo lo incluido en Gratuito"] }),
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("li", { children: [/* @__PURE__ */ (0, T.jsx)("svg", {
															className: "ui-icon",
															"aria-hidden": "true",
															children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-check" })
														}), "Adjuntar fuentes al copiloto"] }),
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("li", { children: [/* @__PURE__ */ (0, T.jsx)("svg", {
															className: "ui-icon",
															"aria-hidden": "true",
															children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-check" })
														}), "Acceso anticipado a novedades"] }),
														"\n"
													]
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", {
													className: "home-plan-status",
													children: "En desarrollo"
												}),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("article", {
											className: "home-plan-card home-plan-card-featured",
											"data-plan-code": "teacher",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("div", {
													className: "home-plan-card-heading",
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("div", { children: [/* @__PURE__ */ (0, T.jsx)("span", {
															className: "home-plan-kicker",
															children: "Para el día a día"
														}), /* @__PURE__ */ (0, T.jsx)("h3", { children: "Docente Plus" })] }),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("span", {
															className: "home-plan-current-badge",
															hidden: !0,
															children: "Tu plan actual"
														}),
														"\n"
													]
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("p", {
													className: "home-plan-description",
													children: "Más capacidad y herramientas para una planificación frecuente."
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("p", {
													className: "home-plan-credits",
													children: [/* @__PURE__ */ (0, T.jsx)("strong", { children: "150" }), /* @__PURE__ */ (0, T.jsx)("span", { children: "créditos de IA por ciclo" })]
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("ul", {
													className: "home-plan-benefits",
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("li", { children: [/* @__PURE__ */ (0, T.jsx)("svg", {
															className: "ui-icon",
															"aria-hidden": "true",
															children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-check" })
														}), "Todo lo incluido en Gratuito"] }),
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("li", { children: [/* @__PURE__ */ (0, T.jsx)("svg", {
															className: "ui-icon",
															"aria-hidden": "true",
															children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-check" })
														}), "Archivos y calidad equilibrada"] }),
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("li", { children: [/* @__PURE__ */ (0, T.jsx)("svg", {
															className: "ui-icon",
															"aria-hidden": "true",
															children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-check" })
														}), "Plantillas personalizadas"] }),
														"\n"
													]
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", {
													className: "home-plan-status",
													children: "En desarrollo"
												}),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("article", {
											className: "home-plan-card",
											"data-plan-code": "pro",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("div", {
													className: "home-plan-card-heading",
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("div", { children: [/* @__PURE__ */ (0, T.jsx)("span", {
															className: "home-plan-kicker",
															children: "Máxima capacidad"
														}), /* @__PURE__ */ (0, T.jsx)("h3", { children: "Docente Pro" })] }),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("span", {
															className: "home-plan-current-badge",
															hidden: !0,
															children: "Tu plan actual"
														}),
														"\n"
													]
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("p", {
													className: "home-plan-description",
													children: "Para un uso intensivo y las capacidades más avanzadas."
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("p", {
													className: "home-plan-credits",
													children: [/* @__PURE__ */ (0, T.jsx)("strong", { children: "400" }), /* @__PURE__ */ (0, T.jsx)("span", { children: "créditos de IA por ciclo" })]
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("ul", {
													className: "home-plan-benefits",
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("li", { children: [/* @__PURE__ */ (0, T.jsx)("svg", {
															className: "ui-icon",
															"aria-hidden": "true",
															children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-check" })
														}), "Todo lo incluido en Plus"] }),
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("li", { children: [/* @__PURE__ */ (0, T.jsx)("svg", {
															className: "ui-icon",
															"aria-hidden": "true",
															children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-check" })
														}), "Calidad máxima de IA"] }),
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("li", { children: [/* @__PURE__ */ (0, T.jsx)("svg", {
															className: "ui-icon",
															"aria-hidden": "true",
															children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-check" })
														}), "Acceso previsto a planificación avanzada"] }),
														"\n"
													]
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", {
													className: "home-plan-status",
													children: "En desarrollo"
												}),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("footer", {
									className: "home-plans-footer",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-shield" })
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("p", { children: [/* @__PURE__ */ (0, T.jsx)("strong", { children: "Vista informativa." }), " No se realizará ningún cobro ni cambio de plan desde esta pantalla."] }),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n"
					]
				}),
				"\n"
			]
		}),
		"\n"
	] });
}
// react-ui/src/surfaces/PlanningHost.tsx
function vs() {
	return /* @__PURE__ */ (0, T.jsxs)(T.Fragment, { children: [
		" ",
		/* @__PURE__ */ (0, T.jsx)("dialog", {
			id: "planning-dialog",
			className: "planning-dialog",
			"aria-labelledby": "planning-title"
		}),
		"\n"
	] });
}
// react-ui/src/surfaces/QuickSession.tsx
function ys() {
	return /* @__PURE__ */ (0, T.jsxs)(T.Fragment, { children: [
		" ",
		/* @__PURE__ */ (0, T.jsxs)("div", {
			className: "session-mode-switch",
			role: "group",
			"aria-label": "Modo del generador",
			children: [
				"\n",
				/* @__PURE__ */ (0, T.jsx)("button", {
					type: "button",
					className: "btn btn-ghost",
					id: "session-mode-quick",
					"aria-pressed": "false",
					children: "Modo rápido · 3 pasos"
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsx)("button", {
					type: "button",
					className: "btn btn-ghost",
					id: "session-mode-advanced",
					"aria-pressed": "true",
					children: "Modo avanzado"
				}),
				"\n"
			]
		}),
		"\n",
		/* @__PURE__ */ (0, T.jsxs)("section", {
			id: "quick-session",
			hidden: !0,
			"aria-label": "Asistente rápido de sesiones",
			children: [
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("nav", {
					className: "quick-steps",
					"aria-label": "Pasos del modo rápido",
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsx)("button", {
							type: "button",
							"data-quick-step": "1",
							"aria-current": "step",
							children: "1. Datos"
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("button", {
							type: "button",
							"data-quick-step": "2",
							children: "2. Aprendizajes"
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("button", {
							type: "button",
							"data-quick-step": "3",
							children: "3. Revisar"
						}),
						"\n"
					]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsx)("p", {
					id: "quick-step-status",
					className: "curriculum-help",
					role: "status",
					children: "Paso 1 de 3"
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsx)("div", {
					id: "quick-errors",
					className: "quick-notice",
					role: "alert",
					hidden: !0
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("section", {
					"data-quick-panel": "1",
					"aria-labelledby": "quick-title-1",
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsx)("h3", {
							id: "quick-title-1",
							tabIndex: -1,
							children: "Datos de tu sesión"
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("p", { children: "Define qué enseñarás y a quiénes. Los datos de tu institución son opcionales." }),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("div", {
							id: "quick-data-fields",
							className: "quick-field-grid"
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("details", {
							className: "form-disclosure",
							children: [/* @__PURE__ */ (0, T.jsx)("summary", { children: "Datos institucionales y de aula (opcionales)" }), /* @__PURE__ */ (0, T.jsx)("div", {
								id: "quick-institution-fields",
								className: "form-disclosure-content"
							})]
						}),
						"\n"
					]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("section", {
					"data-quick-panel": "2",
					hidden: !0,
					"aria-labelledby": "quick-title-2",
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsx)("h3", {
							id: "quick-title-2",
							tabIndex: -1,
							children: "Aprendizajes y propuestas"
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("p", {
							id: "quick-curriculum-status",
							role: "status",
							children: "Comprobando cobertura curricular…"
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("p", { children: "El selector muestra referencias del catálogo. Los textos manuales o completados por IA requieren cotejo y no se convierten automáticamente en información oficial." }),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("div", { id: "quick-learning-fields" }),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("details", {
							className: "form-disclosure",
							children: [/* @__PURE__ */ (0, T.jsx)("summary", { children: "Desempeños y procedencia del catálogo" }), /* @__PURE__ */ (0, T.jsx)("div", {
								id: "quick-official-performances",
								className: "form-disclosure-content"
							})]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("div", { id: "quick-proposal-fields" }),
						"\n"
					]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("section", {
					"data-quick-panel": "3",
					hidden: !0,
					"aria-labelledby": "quick-title-3",
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsx)("h3", {
							id: "quick-title-3",
							tabIndex: -1,
							children: "Revisar y generar"
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("dl", { id: "quick-review" }),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("h4", { children: "Coherencia curricular y advertencias" }),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("ul", {
							id: "quick-warnings",
							className: "quick-notice"
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("p", { children: "Las actividades, criterios y evidencias son propuestas para revisión docente. Puedes generar sin registrar alumnos. La generación usa tu cuenta y está sujeta a tus límites y créditos de IA." }),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("details", {
							className: "form-disclosure",
							children: [/* @__PURE__ */ (0, T.jsx)("summary", { children: "Copiloto, referencias y opciones de generación" }), /* @__PURE__ */ (0, T.jsx)("div", {
								id: "quick-ai-options",
								className: "form-disclosure-content"
							})]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("details", {
							className: "form-disclosure",
							children: [/* @__PURE__ */ (0, T.jsx)("summary", { children: "Diseño del documento" }), /* @__PURE__ */ (0, T.jsx)("div", {
								id: "quick-design-options",
								className: "form-disclosure-content"
							})]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("details", {
							className: "form-disclosure",
							children: [/* @__PURE__ */ (0, T.jsx)("summary", { children: "Alumnos (opcional)" }), /* @__PURE__ */ (0, T.jsx)("div", {
								id: "quick-student-options",
								className: "form-disclosure-content"
							})]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("details", {
							className: "form-disclosure",
							children: [/* @__PURE__ */ (0, T.jsx)("summary", { children: "Fichas y material de aplicación" }), /* @__PURE__ */ (0, T.jsx)("div", {
								id: "quick-worksheet-options",
								className: "form-disclosure-content"
							})]
						}),
						"\n"
					]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("div", {
					className: "quick-navigation",
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsx)("button", {
							type: "button",
							className: "btn btn-ghost",
							id: "quick-back",
							disabled: !0,
							children: "Anterior"
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("button", {
							type: "button",
							className: "btn btn-primary",
							id: "quick-next",
							children: "Continuar"
						}),
						"\n"
					]
				}),
				"\n"
			]
		}),
		"\n"
	] });
}
// react-ui/src/surfaces/SessionPreview.tsx
function bs() {
	return /* @__PURE__ */ (0, T.jsxs)(T.Fragment, { children: [
		" ",
		"\n",
		/* @__PURE__ */ (0, T.jsxs)("section", {
			id: "preview-area",
			className: "preview-area",
			children: [
				"\n",
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("div", {
					id: "empty-state",
					className: "empty-state",
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "empty-state-copy",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "hero-badge",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sparkles" })
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", { children: "MINEDU 2026 · CNEB Perú · Planificación con IA" }),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "empty-brand-row",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "empty-brand-mark",
											style: {
												background: "linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(123,97,255,0.2) 100%)",
												borderRadius: "12px",
												padding: "10px",
												display: "inline-flex",
												boxShadow: "0 0 20px rgba(0,212,255,0.25)"
											},
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("img", {
													src: "assets/favicon.svg",
													alt: "Space Lab Icon",
													"aria-hidden": "true"
												}),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "empty-eyebrow",
											children: "Workspace Curricular Inteligente"
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("h2", {
									className: "empty-title",
									children: "Diseña Sesiones de Aprendizaje Oficiales MINEDU con IA"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("p", {
									className: "empty-text",
									children: [
										"Genera tu planificación curricular por competencias para ",
										/* @__PURE__ */ (0, T.jsx)("strong", { children: "Inicial, Primaria y Secundaria" }),
										" alineada al CNEB 2026. Con situaciones significativas, secuencia didáctica (Inicio, Desarrollo, Cierre), criterios e instrumentos de evaluación listos para editar y exportar a ",
										/* @__PURE__ */ (0, T.jsx)("strong", { children: "Word (.docx)" }),
										" y ",
										/* @__PURE__ */ (0, T.jsx)("strong", { children: "PDF" }),
										"."
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "hero-features-list",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "hero-feature-pill",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-check" })
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", { children: "Alineado al CNEB 2026" }),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "hero-feature-pill",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sparkles" })
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", { children: "GPT-6 Luna, Claude & Gemini" }),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "hero-feature-pill",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-file" })
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", { children: "Word (.docx) & PDF A4" }),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "hero-feature-pill",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-shield" })
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", { children: "Privado y en tu navegador" }),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "hero-actions-row",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("button", {
											type: "button",
											id: "btn-empty-start",
											className: "btn btn-primary empty-primary-action",
											"aria-label": "Comenzar a planificar sesión de aprendizaje",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sparkles" })
												}),
												"\n                                Comenzar a planificar\n                                ",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-arrow-right" })
												}),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "empty-steps",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "step-item",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "step-num",
											children: "1"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "step-content",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("strong", {
													className: "step-title",
													children: "1. Configura el Contexto"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", {
													className: "step-desc",
													children: "Selecciona nivel (Inicial, Primaria, Secundaria), área, competencias y el modelo de IA (GPT-6 Luna, Claude o Gemini)."
												}),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "step-item",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "step-num",
											children: "2"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "step-content",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("strong", {
													className: "step-title",
													children: "2. Genera con IA"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", {
													className: "step-desc",
													children: "Space AI estructura la situación significativa, los momentos didácticos (Inicio, Desarrollo, Cierre), criterios y evidencias."
												}),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "step-item",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "step-num",
											children: "3"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "step-content",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("strong", {
													className: "step-title",
													children: "3. Edita en Hoja A4"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", {
													className: "step-desc",
													children: "Ajusta los contenidos en tiempo real sobre la vista previa editable con fórmulas matemáticas KaTeX y tablas interactivas."
												}),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "step-item",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "step-num",
											children: "4"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "step-content",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("strong", {
													className: "step-title",
													children: "4. Exporta y Presenta"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", {
													className: "step-desc",
													children: "Descarga en Microsoft Word (.docx) nativo con membretes de UGEL/MINEDU o exporta en PDF físico listo para presentar."
												}),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n"
					]
				}),
				"\n",
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("div", {
					id: "print-preview",
					className: "print-preview hidden",
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("nav", {
							id: "linked-planning-context",
							className: "linked-planning-context no-print hidden",
							"aria-label": "Origen de la sesión",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("button", {
									type: "button",
									id: "btn-return-planning",
									className: "btn btn-ghost btn-sm",
									children: "← Volver a planificación"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "linked-planning-copy",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											id: "linked-planning-title",
											className: "linked-planning-title"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											id: "linked-planning-position",
											className: "linked-planning-position"
										}),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n",
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "preview-toolbar no-print",
							children: [
								"\n",
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "toolbar-group",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("button", {
											type: "button",
											id: "btn-format-undo",
											className: "btn btn-ghost btn-xs toolbar-btn",
											title: "Deshacer (Ctrl+Z)",
											"aria-label": "Deshacer",
											children: /* @__PURE__ */ (0, T.jsx)("svg", {
												className: "ui-icon",
												"aria-hidden": "true",
												children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-undo" })
											})
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("button", {
											type: "button",
											id: "btn-format-redo",
											className: "btn btn-ghost btn-xs toolbar-btn",
											title: "Rehacer (Ctrl+Y)",
											"aria-label": "Rehacer",
											children: /* @__PURE__ */ (0, T.jsx)("svg", {
												className: "ui-icon",
												"aria-hidden": "true",
												children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-redo" })
											})
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("div", {
											className: "toolbar-divider",
											style: {
												margin: "0 2px",
												height: "18px",
												alignSelf: "center"
											}
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("button", {
											type: "button",
											id: "btn-format-bold",
											className: "btn btn-ghost btn-xs toolbar-btn",
											style: { fontWeight: "800" },
											title: "Negrita (Ctrl+B)",
											children: "B"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("button", {
											type: "button",
											id: "btn-format-italic",
											className: "btn btn-ghost btn-xs toolbar-btn",
											style: { fontStyle: "italic" },
											title: "Cursiva (Ctrl+I)",
											children: "I"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("button", {
											type: "button",
											id: "btn-format-underline",
											className: "btn btn-ghost btn-xs toolbar-btn",
											style: { textDecoration: "underline" },
											title: "Subrayado (Ctrl+U)",
											children: "U"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("div", {
											className: "toolbar-divider",
											style: {
												margin: "0 2px",
												height: "18px",
												alignSelf: "center"
											}
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("button", {
											type: "button",
											id: "btn-format-list-bullet",
											className: "btn btn-ghost btn-xs toolbar-btn",
											title: "Lista de viñetas",
											"aria-label": "Lista de viñetas",
											children: /* @__PURE__ */ (0, T.jsx)("svg", {
												className: "ui-icon",
												"aria-hidden": "true",
												children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-list" })
											})
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("button", {
											type: "button",
											id: "btn-format-list-number",
											className: "btn btn-ghost btn-xs toolbar-btn",
											title: "Lista numerada",
											"aria-label": "Lista numerada",
											children: "1."
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("div", {
											className: "toolbar-divider",
											style: {
												margin: "0 2px",
												height: "18px",
												alignSelf: "center"
											}
										}),
										"\n",
										"\n",
										/* @__PURE__ */ (0, T.jsx)("button", {
											type: "button",
											id: "btn-format-align-left",
											className: "btn btn-ghost btn-xs toolbar-btn",
											style: {
												fontSize: "0.72rem",
												padding: "2px 4px !important"
											},
											title: "Alinear a la izquierda",
											children: "Izq"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("button", {
											type: "button",
											id: "btn-format-align-center",
											className: "btn btn-ghost btn-xs toolbar-btn",
											style: {
												fontSize: "0.72rem",
												padding: "2px 4px !important"
											},
											title: "Centrar",
											children: "Cen"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("button", {
											type: "button",
											id: "btn-format-align-right",
											className: "btn btn-ghost btn-xs toolbar-btn",
											style: {
												fontSize: "0.72rem",
												padding: "2px 4px !important"
											},
											title: "Alinear a la derecha",
											children: "Der"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("button", {
											type: "button",
											id: "btn-format-align-justify",
											className: "btn btn-ghost btn-xs toolbar-btn",
											style: {
												fontSize: "0.72rem",
												padding: "2px 4px !important"
											},
											title: "Justificar",
											children: "Just"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("div", {
											className: "toolbar-divider",
											style: {
												margin: "0 2px",
												height: "18px",
												alignSelf: "center"
											}
										}),
										"\n",
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											style: {
												display: "flex",
												alignItems: "center",
												gap: "3px"
											},
											title: "Color de letra",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", {
													style: {
														fontSize: "0.85rem",
														fontWeight: "bold",
														borderBottom: "2.5px solid #ff4444",
														lineHeight: "1",
														padding: "0 2px",
														color: "var(--text)"
													},
													children: "A"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("input", {
													type: "color",
													id: "btn-format-forecolor",
													className: "toolbar-color",
													defaultValue: "#000000",
													style: {
														width: "20px",
														height: "20px",
														border: "1px solid var(--border)",
														borderRadius: "4px",
														padding: "0",
														background: "transparent",
														cursor: "pointer"
													}
												}),
												"\n"
											]
										}),
										"\n",
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											style: {
												display: "flex",
												alignItems: "center",
												gap: "3px"
											},
											title: "Color de resaltado",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", {
													style: {
														fontSize: "0.72rem",
														fontWeight: "bold",
														background: "#ffff00",
														color: "#000000",
														padding: "0 3px",
														borderRadius: "3px",
														lineHeight: "1.2"
													},
													children: "ab"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("input", {
													type: "color",
													id: "btn-format-backcolor",
													className: "toolbar-color",
													defaultValue: "#ffff00",
													style: {
														width: "20px",
														height: "20px",
														border: "1px solid var(--border)",
														borderRadius: "4px",
														padding: "0",
														background: "transparent",
														cursor: "pointer"
													}
												}),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n",
								"\n",
								/* @__PURE__ */ (0, T.jsx)("div", { className: "toolbar-divider" }),
								"\n",
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "toolbar-group",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "toolbar-item",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("label", {
													htmlFor: "ribbon-font-family",
													className: "toolbar-sublabel",
													children: "Fuente"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("select", {
													id: "ribbon-font-family",
													className: "form-select select-sm toolbar-select",
													style: { width: "105px" },
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsx)("option", {
															value: "Arial, sans-serif",
															children: "Arial"
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("option", {
															value: "Calibri, Arial, sans-serif",
															children: "Calibri"
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("option", {
															value: "'Times New Roman', serif",
															children: "Times New Roman"
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("option", {
															value: "Georgia, serif",
															children: "Georgia"
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("option", {
															value: "'Courier New', monospace",
															children: "Courier New"
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("option", {
															value: "'Space Grotesk', sans-serif",
															children: "Space Grotesk"
														}),
														"\n"
													]
												}),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "toolbar-item",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("label", {
													htmlFor: "ribbon-font-size",
													className: "toolbar-sublabel",
													children: "Tamaño"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("select", {
													id: "ribbon-font-size",
													className: "form-select select-sm toolbar-select",
													style: { width: "65px" },
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsx)("option", {
															value: "8pt",
															children: "8pt"
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("option", {
															value: "9pt",
															children: "9pt"
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("option", {
															value: "10pt",
															children: "10pt"
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("option", {
															value: "11pt",
															children: "11pt"
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("option", {
															value: "12pt",
															children: "12pt"
														}),
														"\n"
													]
												}),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "toolbar-item",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("label", {
													htmlFor: "ribbon-padding",
													className: "toolbar-sublabel",
													children: "Padding"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("select", {
													id: "ribbon-padding",
													className: "form-select select-sm toolbar-select",
													style: { width: "85px" },
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsx)("option", {
															value: "2px 4px",
															children: "Compacto"
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("option", {
															value: "4px 6px",
															children: "Estándar"
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("option", {
															value: "6px 8px",
															children: "Amplio"
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("option", {
															value: "8px 10px",
															children: "Espacioso"
														}),
														"\n"
													]
												}),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "toolbar-item",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("label", {
													htmlFor: "ribbon-line-height",
													className: "toolbar-sublabel",
													children: "Interl."
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("select", {
													id: "ribbon-line-height",
													className: "form-select select-sm toolbar-select",
													style: { width: "55px" },
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsx)("option", {
															value: "1.2",
															children: "1.2"
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("option", {
															value: "1.3",
															children: "1.3"
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("option", {
															value: "1.4",
															children: "1.4"
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("option", {
															value: "1.5",
															children: "1.5"
														}),
														"\n"
													]
												}),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n",
								"\n",
								/* @__PURE__ */ (0, T.jsx)("div", { className: "toolbar-divider" }),
								"\n",
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "toolbar-group",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "toolbar-item",
											style: {
												flexDirection: "row",
												gap: "4px",
												alignItems: "center",
												height: "100%"
											},
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("label", {
													htmlFor: "ribbon-theme-color",
													className: "toolbar-sublabel",
													children: "Borde"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("input", {
													type: "color",
													id: "ribbon-theme-color",
													className: "toolbar-color",
													defaultValue: "#000000",
													title: "Color de borde"
												}),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "toolbar-item",
											style: { marginLeft: "6px" },
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("label", {
													htmlFor: "ribbon-header-bg",
													className: "toolbar-sublabel",
													children: "Fondo Momentos"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("select", {
													id: "ribbon-header-bg",
													className: "form-select select-sm toolbar-select",
													style: { width: "105px" },
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsx)("option", {
															value: "#BDD6EE",
															children: "MINEDU"
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("option", {
															value: "#DBEAFE",
															children: "Institucional"
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("option", {
															value: "#CCFBF1",
															children: "Moderno"
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("option", {
															value: "#F3F4F6",
															children: "Clásico"
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("option", {
															value: "#CFFAFE",
															children: "Accesible"
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("option", {
															value: "#F1F5F9",
															children: "Gris"
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("option", {
															value: "#E0F2FE",
															children: "Azul"
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("option", {
															value: "#DCFCE7",
															children: "Verde"
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("option", {
															value: "#FEE2E2",
															children: "Rojo"
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("option", {
															value: "#FEF3C7",
															children: "Amarillo"
														}),
														"\n"
													]
												}),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n",
								"\n",
								/* @__PURE__ */ (0, T.jsx)("div", { className: "toolbar-divider" }),
								"\n",
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "toolbar-group",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "toolbar-item",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("label", {
													className: "toolbar-sublabel",
													children: "Insertar Logos"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("button", {
													type: "button",
													id: "btn-ribbon-add-logo",
													className: "btn btn-ghost btn-sm toolbar-btn",
													style: {
														height: "28px",
														minHeight: "28px",
														padding: "2px 8px !important",
														display: "flex",
														alignItems: "center",
														gap: "4px"
													},
													title: "Añadir un nuevo logo al encabezado oficial",
													children: [/* @__PURE__ */ (0, T.jsx)("svg", {
														className: "ui-icon",
														"aria-hidden": "true",
														children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-plus" })
													}), "Añadir logo"]
												}),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n",
								"\n",
								/* @__PURE__ */ (0, T.jsx)("div", { className: "toolbar-divider" }),
								"\n",
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "toolbar-group",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "toolbar-item",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("label", {
													className: "toolbar-sublabel",
													children: "Filas de Tabla"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("div", {
													className: "btn-group",
													style: {
														display: "flex",
														gap: "4px"
													},
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("button", {
															type: "button",
															id: "btn-table-row-insert",
															className: "btn btn-ghost btn-sm toolbar-btn",
															style: {
																height: "28px",
																minHeight: "28px",
																padding: "2px 8px !important"
															},
															title: "Insertar fila debajo",
															children: [/* @__PURE__ */ (0, T.jsx)("svg", {
																className: "ui-icon",
																"aria-hidden": "true",
																children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-plus" })
															}), "Fila"]
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("button", {
															type: "button",
															id: "btn-table-row-delete",
															className: "btn btn-ghost btn-sm toolbar-btn",
															style: {
																height: "28px",
																minHeight: "28px",
																padding: "2px 8px !important"
															},
															title: "Eliminar fila",
															children: [/* @__PURE__ */ (0, T.jsx)("svg", {
																className: "ui-icon",
																"aria-hidden": "true",
																children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-minus" })
															}), "Fila"]
														}),
														"\n"
													]
												}),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n",
								"\n",
								/* @__PURE__ */ (0, T.jsx)("div", { className: "toolbar-divider" }),
								"\n",
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "toolbar-group",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "toolbar-item",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("label", {
													className: "toolbar-sublabel",
													children: "Copiloto IA"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("div", {
													className: "btn-group",
													style: {
														display: "flex",
														gap: "4px"
													},
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("button", {
															type: "button",
															id: "btn-ai-rubrica",
															className: "btn btn-ghost btn-sm toolbar-btn",
															style: {
																height: "28px",
																minHeight: "28px",
																padding: "2px 8px !important",
																fontWeight: "600"
															},
															title: "Autogenerar criterios o rúbrica de evaluación",
															children: [/* @__PURE__ */ (0, T.jsx)("svg", {
																className: "ui-icon",
																"aria-hidden": "true",
																children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-target" })
															}), "Rúbrica"]
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("button", {
															type: "button",
															id: "btn-ai-improve-text",
															className: "btn btn-ghost btn-sm toolbar-btn",
															style: {
																height: "28px",
																minHeight: "28px",
																padding: "2px 8px !important",
																fontWeight: "600"
															},
															title: "Mejorar redacción técnica del texto seleccionado",
															children: [/* @__PURE__ */ (0, T.jsx)("svg", {
																className: "ui-icon",
																"aria-hidden": "true",
																children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sparkles" })
															}), "Redactar"]
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("button", {
															type: "button",
															id: "btn-toolbar-ficha-prompt",
															className: "btn btn-ghost btn-sm toolbar-btn",
															style: {
																height: "28px",
																minHeight: "28px",
																padding: "2px 8px !important",
																fontWeight: "600"
															},
															title: "Ver prompt para Ficha en IA externa",
															children: [/* @__PURE__ */ (0, T.jsx)("svg", {
																className: "ui-icon",
																"aria-hidden": "true",
																children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sparkles" })
															}), "Ficha IA"]
														}),
														"\n"
													]
												}),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n",
								"\n",
								/* @__PURE__ */ (0, T.jsx)("div", { className: "toolbar-divider" }),
								"\n",
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "toolbar-group toolbar-group-actions",
									style: {
										marginLeft: "auto",
										display: "flex",
										gap: "8px",
										alignItems: "center"
									},
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("span", {
											className: "preview-badge",
											id: "edit-mode-badge",
											children: [/* @__PURE__ */ (0, T.jsx)("svg", {
												className: "ui-icon",
												"aria-hidden": "true",
												children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-edit" })
											}), "Modo edición"]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("button", {
											id: "btn-export-word-preview",
											className: "btn btn-ghost btn-sm toolbar-btn",
											style: {
												width: "32px",
												height: "32px",
												padding: "0 !important"
											},
											title: "Exportar sesión a Word",
											"aria-label": "Exportar sesión a Word",
											children: /* @__PURE__ */ (0, T.jsx)("svg", {
												className: "ui-icon",
												"aria-hidden": "true",
												children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-file" })
											})
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("button", {
											id: "btn-clean-format",
											className: "btn btn-ghost btn-sm toolbar-btn",
											style: {
												width: "32px",
												height: "32px",
												padding: "0 !important"
											},
											title: "Limpiar formato pegado",
											"aria-label": "Limpiar formato pegado",
											children: /* @__PURE__ */ (0, T.jsx)("svg", {
												className: "ui-icon",
												"aria-hidden": "true",
												children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-clean" })
											})
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("button", {
											id: "btn-close-session",
											className: "btn btn-ghost btn-sm toolbar-btn",
											style: {
												width: "32px",
												height: "32px",
												padding: "0 !important",
												color: "#ef4444",
												fontWeight: "bold",
												fontSize: "1.1rem"
											},
											title: "Cerrar sesión actual e iniciar una nueva",
											"aria-label": "Cerrar sesión actual e iniciar una nueva",
											children: /* @__PURE__ */ (0, T.jsx)("svg", {
												className: "ui-icon",
												"aria-hidden": "true",
												children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-close" })
											})
										}),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n",
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							id: "time-balance-warning",
							className: "time-balance-banner no-print",
							style: {
								background: "rgba(245, 158, 11, 0.12)",
								border: "1px solid rgba(245, 158, 11, 0.3)",
								color: "#eab308",
								padding: "10px 16px",
								borderRadius: "8px",
								margin: "10px auto",
								maxWidth: "820px",
								fontSize: "0.85rem",
								fontWeight: "600",
								display: "none",
								alignItems: "center",
								gap: "8px"
							},
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("svg", {
									className: "ui-icon",
									"aria-hidden": "true",
									children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-alert" })
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("span", { id: "time-balance-warning-text" }),
								"\n"
							]
						}),
						"\n",
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							id: "session-sheet",
							className: "session-sheet a4-page",
							children: ["\n", "\n"]
						}),
						"\n"
					]
				}),
				"\n"
			]
		}),
		"\n"
	] });
}
// react-ui/src/surfaces/SessionEditor.tsx
function xs() {
	return /* @__PURE__ */ (0, T.jsxs)(T.Fragment, { children: [
		" ",
		"\n",
		/* @__PURE__ */ (0, T.jsxs)("div", {
			id: "app-view",
			className: "app-wrapper hidden",
			children: [
				"\n",
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("header", {
					className: "app-header glass-card",
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "header-leading",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "header-brand",
									"data-action": "view-landing",
									style: { cursor: "pointer" },
									title: "Volver al inicio / presentación",
									role: "button",
									tabIndex: 0,
									"aria-label": "Volver al inicio de Space Lab",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "brand-icon",
											style: {
												background: "linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(123,97,255,0.2) 100%)",
												borderColor: "rgba(0,212,255,0.35)"
											},
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("img", {
													src: "assets/favicon.svg",
													alt: "Space Lab Logo",
													className: "brand-logo-img"
												}),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", { children: [
											"\n",
											/* @__PURE__ */ (0, T.jsx)("h1", {
												className: "brand-title",
												children: "Space Lab"
											}),
											"\n",
											/* @__PURE__ */ (0, T.jsx)("span", {
												className: "brand-subtitle",
												children: "Sesiones Educativas"
											}),
											"\n"
										] }),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "header-context",
									"aria-label": "Contexto de la sesión",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "header-context-label",
											children: "Editor de sesión"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											id: "session-context-title",
											className: "header-context-title",
											children: "Nueva sesión"
										}),
										"\n"
									]
								}),
								"\n",
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									id: "header-user-badge",
									className: "header-user-badge",
									role: "region",
									"aria-label": "Perfil y créditos del docente",
									hidden: !0,
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("div", {
											className: "user-avatar-badge",
											id: "header-user-avatar",
											"aria-hidden": "true",
											children: "--"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "user-details-col",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("div", {
													className: "user-name-row",
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsx)("span", {
															className: "user-display-name",
															id: "header-user-name",
															children: "Docente"
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("span", {
															className: "user-plan-tag",
															id: "header-user-plan",
															children: "Plan docente"
														}),
														"\n"
													]
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("div", {
													className: "user-credits-sub",
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsx)("svg", {
															className: "ui-icon",
															"aria-hidden": "true",
															children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sparkles" })
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("span", {
															className: "user-credits-text",
															id: "header-user-credits",
															children: "-- créditos IA"
														}),
														"\n"
													]
												}),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "save-indicator",
							id: "save-indicator",
							role: "status",
							"aria-live": "polite",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("span", { className: "save-dot" }),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("span", {
									className: "save-text",
									children: "Sin cambios"
								}),
								"\n"
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("nav", {
							className: "header-actions",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("a", {
									href: "mailto:pabloclsa87@gmail.com",
									className: "btn btn-ghost btn-sm",
									"aria-label": "Contactar con soporte por correo",
									children: "Soporte"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("span", {
									id: "ai-credit-indicator",
									className: "ai-credit-indicator",
									role: "status",
									"aria-live": "polite",
									hidden: !0,
									children: "IA · -- créditos"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("button", {
									id: "btn-home-nav",
									type: "button",
									className: "btn btn-ghost btn-sm",
									"data-action": "view-home",
									hidden: !0,
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-folder" })
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "btn-label",
											children: "Mi espacio"
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("label", {
									className: "theme-picker",
									title: "Tema de la aplicación",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-theme" })
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "sr-only",
											children: "Tema de la aplicación"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("select", {
											id: "theme-preference",
											"aria-label": "Tema de la aplicación",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("option", {
													value: "system",
													children: "Sistema"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("option", {
													value: "light",
													children: "Claro"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("option", {
													value: "dark",
													children: "Oscuro"
												}),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("button", {
									id: "btn-toggle-edit",
									className: "btn btn-ghost btn-icon",
									title: "Modo edición / lectura",
									"aria-label": "Cambiar modo de edición",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-edit" })
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "btn-label",
											children: "Editar"
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("button", {
									id: "btn-preview",
									className: "btn btn-ghost btn-icon",
									title: "Vista previa de impresión",
									"aria-label": "Abrir vista previa",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-eye" })
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "btn-label",
											children: "Vista Previa"
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("details", {
									id: "export-command-menu",
									className: "command-menu",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("summary", {
											className: "btn btn-primary",
											"aria-label": "Abrir opciones de exportación",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-download" })
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", {
													className: "btn-label",
													children: "Exportar"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon command-menu-chevron",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-chevron-down" })
												}),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "command-menu-panel",
											role: "group",
											"aria-label": "Opciones de exportación",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", {
													className: "command-menu-heading",
													children: "Exportar sesión"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("button", {
													id: "btn-export-pdf",
													className: "btn btn-pdf",
													title: "Exportar sesión a PDF",
													"aria-label": "Exportar sesión a PDF",
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsx)("svg", {
															className: "ui-icon",
															"aria-hidden": "true",
															children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-file" })
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("span", {
															className: "btn-label",
															children: "Documento PDF"
														}),
														"\n"
													]
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("button", {
													id: "btn-export-word",
													className: "btn btn-word",
													title: "Exportar sesión a Word",
													"aria-label": "Exportar sesión a Word",
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsx)("svg", {
															className: "ui-icon",
															"aria-hidden": "true",
															children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-file" })
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("span", {
															className: "btn-label",
															children: "Documento Word"
														}),
														"\n"
													]
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", {
													className: "command-menu-separator",
													"aria-hidden": "true"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("a", {
													id: "btn-download-engine",
													href: "https://descargas.sypablitodp.site",
													target: "_blank",
													rel: "noopener noreferrer",
													className: "btn btn-ghost",
													title: "Descargar Motor de Exportación Local (.exe)",
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsx)("svg", {
															className: "ui-icon",
															"aria-hidden": "true",
															children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-download" })
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsx)("span", {
															className: "btn-label",
															children: "Obtener motor local"
														}),
														"\n"
													]
												}),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("div", {
									id: "auth-header-container",
									className: "auth-header-container",
									children: /* @__PURE__ */ (0, T.jsx)(ss, {})
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("button", {
									id: "btn-menu-mobile",
									className: "btn btn-ghost btn-icon mobile-only",
									title: "Abrir planificación",
									"aria-label": "Abrir planificación",
									"aria-expanded": "false",
									"aria-controls": "sidebar",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-menu" })
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "btn-label",
											children: "Planificar"
										}),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n"
					]
				}),
				"\n",
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("main", {
					className: "app-main",
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("nav", {
							id: "workflow-rail",
							className: "workflow-rail",
							"aria-label": "Flujo de creación",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("button", {
									id: "btn-toggle-rail",
									className: "workflow-rail-brand",
									type: "button",
									"aria-label": "Mostrar nombres de las etapas",
									"aria-expanded": "false",
									"aria-controls": "workflow-tabs",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-menu" })
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", { children: "Etapas" }),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("button", {
									type: "button",
									id: "quick-open-planner",
									className: "btn btn-ghost",
									"aria-controls": "sidebar",
									children: "Editar sesión"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									id: "workflow-tabs",
									className: "sidebar-tabs",
									role: "group",
									"aria-label": "Secciones de la sesión",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("button", {
											type: "button",
											className: "sidebar-tab active",
											"data-tab": "tab-ai",
											"aria-label": "Copiloto, en curso",
											"aria-current": "step",
											"aria-controls": "tab-ai",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", {
													className: "tab-step",
													children: "01"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon tab-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sparkles" })
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("span", {
													className: "tab-copy",
													children: [/* @__PURE__ */ (0, T.jsx)("span", {
														className: "tab-text",
														children: "Copiloto"
													}), /* @__PURE__ */ (0, T.jsx)("span", {
														className: "tab-state",
														children: "En curso"
													})]
												}),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("button", {
											type: "button",
											className: "sidebar-tab",
											"data-tab": "tab-general",
											"aria-label": "Datos, pendiente",
											"aria-controls": "tab-general",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", {
													className: "tab-step",
													children: "02"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon tab-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-building" })
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("span", {
													className: "tab-copy",
													children: [/* @__PURE__ */ (0, T.jsx)("span", {
														className: "tab-text",
														children: "Datos"
													}), /* @__PURE__ */ (0, T.jsx)("span", {
														className: "tab-state",
														children: "Pendiente"
													})]
												}),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("button", {
											type: "button",
											className: "sidebar-tab",
											"data-tab": "tab-propositos",
											"aria-label": "Propósitos, pendiente",
											"aria-controls": "tab-propositos",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", {
													className: "tab-step",
													children: "03"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon tab-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-target" })
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("span", {
													className: "tab-copy",
													children: [/* @__PURE__ */ (0, T.jsx)("span", {
														className: "tab-text",
														children: "Propósitos"
													}), /* @__PURE__ */ (0, T.jsx)("span", {
														className: "tab-state",
														children: "Pendiente"
													})]
												}),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("button", {
											type: "button",
											className: "sidebar-tab",
											"data-tab": "tab-design",
											"aria-label": "Diseño, pendiente",
											"aria-controls": "tab-design",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", {
													className: "tab-step",
													children: "04"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon tab-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sliders" })
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("span", {
													className: "tab-copy",
													children: [/* @__PURE__ */ (0, T.jsx)("span", {
														className: "tab-text",
														children: "Diseño"
													}), /* @__PURE__ */ (0, T.jsx)("span", {
														className: "tab-state",
														children: "Pendiente"
													})]
												}),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("button", {
											type: "button",
											className: "sidebar-tab",
											"data-tab": "tab-alumnos",
											"aria-label": "Alumnos, pendiente",
											"aria-controls": "tab-alumnos",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", {
													className: "tab-step",
													children: "05"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon tab-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-users" })
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("span", {
													className: "tab-copy",
													children: [/* @__PURE__ */ (0, T.jsx)("span", {
														className: "tab-text",
														children: "Alumnos"
													}), /* @__PURE__ */ (0, T.jsx)("span", {
														className: "tab-state",
														children: "Pendiente"
													})]
												}),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("button", {
											type: "button",
											className: "sidebar-tab",
											"data-tab": "tab-fichas",
											"aria-label": "Fichas, pendiente",
											"aria-controls": "tab-fichas",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", {
													className: "tab-step",
													children: "06"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon tab-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-file" })
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("span", {
													className: "tab-copy",
													children: [/* @__PURE__ */ (0, T.jsx)("span", {
														className: "tab-text",
														children: "Fichas"
													}), /* @__PURE__ */ (0, T.jsx)("span", {
														className: "tab-state",
														children: "Pendiente"
													})]
												}),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n",
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("aside", {
							id: "sidebar",
							className: "sidebar glass-card",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "sidebar-header",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", { children: [
											"\n",
											/* @__PURE__ */ (0, T.jsx)("span", {
												className: "sidebar-eyebrow",
												children: "Planificador docente"
											}),
											"\n",
											/* @__PURE__ */ (0, T.jsx)("h2", {
												className: "sidebar-title",
												children: "Diseña tu sesión"
											}),
											"\n"
										] }),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("button", {
											id: "btn-close-sidebar",
											type: "button",
											className: "btn btn-ghost btn-sm",
											"aria-label": "Volver al documento",
											children: [/* @__PURE__ */ (0, T.jsx)("svg", {
												className: "ui-icon",
												"aria-hidden": "true",
												children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-close" })
											}), /* @__PURE__ */ (0, T.jsx)("span", { children: "Volver al documento" })]
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "sidebar-workflow",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("form", {
											id: "session-form",
											className: "session-form",
											autoComplete: "off",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)(ys, {}),
												"\n",
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("div", {
													id: "tab-ai",
													className: "tab-pane active",
													role: "region",
													"aria-labelledby": "inspector-title",
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("div", {
															className: "inspector-heading planner-section-heading",
															children: [
																"\n",
																/* @__PURE__ */ (0, T.jsx)("span", {
																	id: "inspector-step",
																	className: "inspector-step",
																	children: "Paso 01 de 06"
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsx)("h3", {
																	id: "inspector-title",
																	children: "Configura el copiloto"
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsx)("p", {
																	id: "inspector-description",
																	children: "Elige el modelo, la plantilla y las referencias para preparar tu sesión."
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsx)("p", {
																	className: "planner-scroll-help",
																	children: "Baja para continuar. El menú te lleva directo a cada sección."
																}),
																"\n"
															]
														}),
														"\n",
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("div", {
															className: "form-group ai-model-card",
															children: [
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "ai-model-header",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("div", { children: [
																			"\n",
																			/* @__PURE__ */ (0, T.jsx)("span", {
																				className: "ai-model-eyebrow",
																				children: "Copiloto Space AI"
																			}),
																			"\n",
																			/* @__PURE__ */ (0, T.jsx)("strong", { children: "Enrutamiento inteligente" }),
																			"\n"
																		] }),
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("span", {
																			className: "ai-model-status",
																			id: "ai-availability-status",
																			children: "Disponibilidad por verificar"
																		}),
																		"\n"
																	]
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsx)("label", {
																	htmlFor: "select-ai-provider",
																	className: "form-label",
																	children: "\n                                Modo de calidad\n                            "
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("select", {
																	defaultValue: "automatic",
																	id: "select-ai-provider",
																	className: "form-select",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("option", {
																			value: "automatic",
																			children: "Automático — Recomendado"
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("option", {
																			value: "fast",
																			disabled: !0,
																			hidden: !0,
																			children: "Rápido — Menor latencia"
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("option", {
																			value: "balanced",
																			disabled: !0,
																			hidden: !0,
																			children: "Equilibrado — Calidad y eficiencia"
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("option", {
																			value: "max_quality",
																			disabled: !0,
																			hidden: !0,
																			children: "Máxima calidad — Trabajo curricular complejo"
																		}),
																		"\n"
																	]
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsx)("p", {
																	id: "ai-availability-help",
																	className: "curriculum-help",
																	children: "Automático delega la selección al gateway. Las demás opciones requieren verificar tu cuenta y el backend."
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	id: "model-capabilities-badge",
																	className: "model-capabilities-badge",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("svg", {
																			className: "ui-icon badge-icon",
																			"aria-hidden": "true",
																			children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-file" })
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("span", {
																			className: "badge-text",
																			children: [/* @__PURE__ */ (0, T.jsx)("strong", { children: "Automático:" }), " El gateway elige la ruta más adecuada según la tarea y los archivos."]
																		}),
																		"\n"
																	]
																}),
																"\n"
															]
														}),
														"\n",
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("div", {
															className: "form-card",
															children: [
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-card-title",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("svg", {
																			className: "ui-icon",
																			"aria-hidden": "true",
																			children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sliders" })
																		}),
																		"\n                                Estructura de la Sesión\n                            "
																	]
																}),
																"\n",
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-group",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("label", {
																			htmlFor: "select-template",
																			className: "form-label",
																			children: "Tipo de Sesión"
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("select", {
																			id: "select-template",
																			className: "form-select",
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("option", {
																					value: "estandar",
																					children: "Sesión estándar MINEDU"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("option", {
																					value: "inicial",
																					children: "Sesión de educación inicial"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("option", {
																					value: "laboratorio",
																					children: "Sesión de laboratorio"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("option", {
																					value: "refuerzo",
																					children: "Sesión de refuerzo"
																				}),
																				"\n"
																			]
																		}),
																		"\n"
																	]
																}),
																"\n",
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-group",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("label", {
																			htmlFor: "select-methodology",
																			className: "form-label",
																			children: "Metodología Didáctica"
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("select", {
																			id: "select-methodology",
																			className: "form-select",
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("option", {
																					value: "",
																					children: "-- Por defecto del Área --"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("option", {
																					value: "polya",
																					children: "Método de Polya — resolución de problemas"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("option", {
																					value: "erca",
																					children: "Ciclo ERCA — experiencia, reflexión, conceptualización y aplicación"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("option", {
																					value: "project_based_learning",
																					children: "Aprendizaje Basado en Proyectos"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("option", {
																					value: "flipped",
																					children: "Aula invertida"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("option", {
																					value: "indagacion",
																					children: "Indagación científica (STEAM)"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("option", {
																					value: "cooperativo",
																					children: "Aprendizaje cooperativo"
																				}),
																				"\n"
																			]
																		}),
																		"\n"
																	]
																}),
																"\n"
															]
														}),
														"\n",
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("div", {
															className: "form-card source-file-group",
															children: [
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-card-title",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("svg", {
																			className: "ui-icon",
																			"aria-hidden": "true",
																			children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-upload" })
																		}),
																		"\n                                Documento de Referencia ",
																		/* @__PURE__ */ (0, T.jsx)("span", {
																			className: "optional-label",
																			style: {
																				fontSize: "0.65rem",
																				color: "var(--text-muted)",
																				marginLeft: "auto"
																			},
																			children: "Opcional"
																		}),
																		"\n"
																	]
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	id: "source-file-dropzone",
																	className: "source-file-dropzone",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("span", {
																			className: "icon",
																			children: /* @__PURE__ */ (0, T.jsx)("svg", {
																				className: "ui-icon",
																				"aria-hidden": "true",
																				children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-upload" })
																			})
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("span", {
																			className: "text",
																			children: "Haz clic o arrastra un archivo aquí (PDF, imagen, audio o texto)"
																		}),
																		"\n"
																	]
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	id: "source-file-info",
																	className: "source-file-info hidden",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("span", {
																			className: "file-name",
																			id: "source-file-name-text"
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("button", {
																			type: "button",
																			id: "btn-remove-source-file",
																			className: "btn-remove-file",
																			title: "Eliminar archivo",
																			"aria-label": "Eliminar archivo",
																			children: /* @__PURE__ */ (0, T.jsx)("svg", {
																				className: "ui-icon",
																				"aria-hidden": "true",
																				children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-close" })
																			})
																		}),
																		"\n"
																	]
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsx)("input", {
																	type: "file",
																	id: "input-source-file",
																	className: "hidden",
																	accept: ".pdf,image/*,audio/*,text/plain,.csv,.md,.json"
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	id: "source-file-guidance",
																	className: "source-file-guidance hidden",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("label", {
																			htmlFor: "input-source-instruction",
																			className: "form-label",
																			children: "\n                                    ¿Qué parte debe usar la IA?\n                                "
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("textarea", {
																			id: "input-source-instruction",
																			className: "form-textarea",
																			rows: 3,
																			maxLength: 600,
																			placeholder: "Ej.: Toma como situación central la primera situación problemática de la página 2. No uses los otros ejemplos."
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("p", {
																			className: "source-file-guidance-help",
																			children: "\n                                    Indica una página, un rango (págs. 3–5) o describe la situación. Si lo dejas vacío, la IA revisará todo el archivo.\n                                "
																		}),
																		"\n"
																	]
																}),
																"\n"
															]
														}),
														"\n",
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("div", {
															style: { marginTop: "0.5rem" },
															children: [
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("button", {
																	type: "button",
																	id: "btn-pedagogy-brief",
																	className: "pb-trigger-btn btn btn-ghost",
																	title: "Afinar el enfoque pedagógico con la IA antes de generar",
																	style: {
																		width: "100%",
																		padding: "10px 16px"
																	},
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("svg", {
																			className: "ui-icon",
																			"aria-hidden": "true",
																			children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sparkles" })
																		}),
																		" Afinar enfoque pedagógico con IA\n                            "
																	]
																}),
																"\n"
															]
														}),
														"\n"
													]
												}),
												"\n",
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("div", {
													id: "tab-general",
													className: "tab-pane",
													role: "region",
													"aria-labelledby": "planner-title-general",
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("header", {
															className: "planner-section-heading",
															children: [
																/* @__PURE__ */ (0, T.jsx)("span", {
																	className: "planner-section-step",
																	children: "Paso 02 de 06"
																}),
																/* @__PURE__ */ (0, T.jsx)("h3", {
																	id: "planner-title-general",
																	children: "Completa los datos"
																}),
																/* @__PURE__ */ (0, T.jsx)("p", { children: "Define la institución, el grado, el área y la identidad de tu sesión." })
															]
														}),
														"\n",
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("div", {
															className: "form-card",
															children: [
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-card-title",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("svg", {
																			className: "ui-icon",
																			"aria-hidden": "true",
																			children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-building" })
																		}),
																		"\n                                Institución y Jurisdicción\n                            "
																	]
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-group",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("label", {
																			htmlFor: "input-institucion",
																			className: "form-label",
																			children: "Institución Educativa"
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("input", {
																			type: "text",
																			id: "input-institucion",
																			className: "form-input",
																			placeholder: "I.E. N° 000 — Nombre"
																		}),
																		"\n"
																	]
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-row",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("div", {
																			className: "form-group",
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("label", {
																					htmlFor: "input-dre",
																					className: "form-label",
																					children: "DRE"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("input", {
																					type: "text",
																					id: "input-dre",
																					className: "form-input",
																					placeholder: "DRE Ucayali"
																				}),
																				"\n"
																			]
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("div", {
																			className: "form-group",
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("label", {
																					htmlFor: "input-ugel",
																					className: "form-label",
																					children: "UGEL"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("input", {
																					type: "text",
																					id: "input-ugel",
																					className: "form-input",
																					placeholder: "UGEL Padre Abad"
																				}),
																				"\n"
																			]
																		}),
																		"\n"
																	]
																}),
																"\n"
															]
														}),
														"\n",
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("div", {
															className: "form-card",
															children: [
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-card-title",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("svg", {
																			className: "ui-icon",
																			"aria-hidden": "true",
																			children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-user" })
																		}),
																		"\n                                Equipo Docente\n                            "
																	]
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-row",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("div", {
																			className: "form-group",
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("label", {
																					htmlFor: "input-docente",
																					className: "form-label",
																					children: "Docente"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("input", {
																					type: "text",
																					id: "input-docente",
																					className: "form-input",
																					placeholder: "Nombre completo"
																				}),
																				"\n"
																			]
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("div", {
																			className: "form-group",
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("label", {
																					htmlFor: "input-director",
																					className: "form-label",
																					children: "Director(a)"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("input", {
																					type: "text",
																					id: "input-director",
																					className: "form-input",
																					placeholder: "Nombre del director"
																				}),
																				"\n"
																			]
																		}),
																		"\n"
																	]
																}),
																"\n"
															]
														}),
														"\n",
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("div", {
															className: "form-card",
															children: [
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-card-title",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("svg", {
																			className: "ui-icon",
																			"aria-hidden": "true",
																			children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sliders" })
																		}),
																		"\n                                Programación de Aula\n                            "
																	]
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-row",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("div", {
																			className: "form-group",
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("label", {
																					htmlFor: "input-fecha",
																					className: "form-label",
																					children: "Fecha"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("input", {
																					type: "date",
																					id: "input-fecha",
																					className: "form-input"
																				}),
																				"\n"
																			]
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("div", {
																			className: "form-group",
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("label", {
																					htmlFor: "input-nivel",
																					className: "form-label",
																					children: "Nivel"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsxs)("select", {
																					id: "input-nivel",
																					className: "form-select",
																					children: [
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "SECUNDARIA",
																							children: "Secundaria"
																						}),
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "PRIMARIA",
																							children: "Primaria"
																						}),
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "INICIAL",
																							children: "Inicial"
																						}),
																						"\n"
																					]
																				}),
																				"\n"
																			]
																		}),
																		"\n"
																	]
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-row",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("div", {
																			className: "form-group",
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("label", {
																					htmlFor: "input-grado",
																					className: "form-label",
																					children: "Grado"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsxs)("select", {
																					id: "input-grado",
																					className: "form-select",
																					children: [
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "",
																							children: "Seleccionar"
																						}),
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "3 años",
																							children: "3 años (Inicial)"
																						}),
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "4 años",
																							children: "4 años (Inicial)"
																						}),
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "5 años",
																							children: "5 años (Inicial)"
																						}),
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "1°",
																							children: "1° Grado"
																						}),
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "2°",
																							children: "2° Grado"
																						}),
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "3°",
																							children: "3° Grado"
																						}),
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "4°",
																							children: "4° Grado"
																						}),
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "5°",
																							children: "5° Grado"
																						}),
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "6°",
																							children: "6° Grado"
																						}),
																						"\n"
																					]
																				}),
																				"\n"
																			]
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("div", {
																			className: "form-group",
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("label", {
																					htmlFor: "input-seccion",
																					className: "form-label",
																					children: "Sección"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("input", {
																					type: "text",
																					id: "input-seccion",
																					className: "form-input",
																					placeholder: "A, B, C..."
																				}),
																				"\n"
																			]
																		}),
																		"\n"
																	]
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-row",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("div", {
																			className: "form-group",
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("label", {
																					htmlFor: "input-numero-sesion",
																					className: "form-label",
																					children: "N° de Sesión"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("input", {
																					type: "text",
																					id: "input-numero-sesion",
																					className: "form-input",
																					placeholder: "03"
																				}),
																				"\n"
																			]
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("div", {
																			className: "form-group",
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("label", {
																					htmlFor: "input-duracion",
																					className: "form-label",
																					children: "Duración"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("input", {
																					type: "text",
																					id: "input-duracion",
																					className: "form-input",
																					placeholder: "90 min"
																				}),
																				"\n"
																			]
																		}),
																		"\n"
																	]
																}),
																"\n"
															]
														}),
														"\n",
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("div", {
															className: "form-card",
															children: [
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-card-title",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("svg", {
																			className: "ui-icon",
																			"aria-hidden": "true",
																			children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-file" })
																		}),
																		"\n                                Identidad y Temario\n                            "
																	]
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-group",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("label", {
																			htmlFor: "input-area",
																			className: "form-label",
																			children: "Área Curricular"
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("select", {
																			id: "input-area",
																			className: "form-select",
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("option", {
																					value: "",
																					children: "Seleccionar"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("option", {
																					value: "Comunicación",
																					children: "Comunicación"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("option", {
																					value: "Matemática",
																					children: "Matemática"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("option", {
																					value: "Ciencia y Tecnología",
																					children: "Ciencia y Tecnología"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("option", {
																					value: "Personal Social",
																					children: "Personal Social"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("option", {
																					value: "Arte y Cultura",
																					children: "Arte y Cultura"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("option", {
																					value: "Educación Física",
																					children: "Educación Física"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("option", {
																					value: "Educación Religiosa",
																					children: "Educación Religiosa"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("option", {
																					value: "Inglés",
																					children: "Inglés"
																				}),
																				"\n"
																			]
																		}),
																		"\n"
																	]
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-group",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("label", {
																			htmlFor: "input-unidad",
																			className: "form-label",
																			children: "Unidad Didáctica"
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("input", {
																			type: "text",
																			id: "input-unidad",
																			className: "form-input",
																			placeholder: "Unidad N° — Título"
																		}),
																		"\n"
																	]
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-group",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("label", {
																			htmlFor: "input-titulo",
																			className: "form-label",
																			children: "Título de la Sesión"
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("input", {
																			type: "text",
																			id: "input-titulo",
																			className: "form-input",
																			placeholder: "Título descriptivo de la sesión"
																		}),
																		"\n"
																	]
																}),
																"\n"
															]
														}),
														"\n",
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("div", {
															style: {
																display: "flex",
																gap: "8px",
																marginTop: "1rem"
															},
															children: [
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("button", {
																	type: "button",
																	id: "btn-save-defaults",
																	className: "btn btn-ghost btn-sm",
																	title: "Guardar predeterminados en la nube",
																	style: {
																		flex: "1",
																		fontSize: "0.76rem",
																		padding: "8px"
																	},
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("svg", {
																			className: "ui-icon",
																			"aria-hidden": "true",
																			children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-save" })
																		}),
																		" Predeterminados\n                            "
																	]
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("button", {
																	type: "button",
																	id: "btn-new",
																	className: "btn btn-ghost btn-sm",
																	title: "Limpiar formulario e iniciar nueva sesión",
																	style: {
																		flex: "1",
																		fontSize: "0.76rem",
																		padding: "8px"
																	},
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("svg", {
																			className: "ui-icon",
																			"aria-hidden": "true",
																			children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-trash" })
																		}),
																		" Limpiar Todo\n                            "
																	]
																}),
																"\n"
															]
														}),
														"\n"
													]
												}),
												"\n",
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("div", {
													id: "tab-propositos",
													className: "tab-pane",
													role: "region",
													"aria-labelledby": "planner-title-propositos",
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("header", {
															className: "planner-section-heading",
															children: [
																/* @__PURE__ */ (0, T.jsx)("span", {
																	className: "planner-section-step",
																	children: "Paso 03 de 06"
																}),
																/* @__PURE__ */ (0, T.jsx)("h3", {
																	id: "planner-title-propositos",
																	children: "Elige los aprendizajes"
																}),
																/* @__PURE__ */ (0, T.jsx)("p", { children: "Marca competencias y capacidades. Después, precisa los desempeños y enfoques que trabajarás." })
															]
														}),
														"\n",
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("div", {
															className: "form-card",
															children: [
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-card-title",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("svg", {
																			className: "ui-icon",
																			"aria-hidden": "true",
																			children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-target" })
																		}),
																		"\n                                Competencias y Capacidades\n                            "
																	]
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsx)("div", {
																	id: "curriculum-picker",
																	className: "curriculum-picker",
																	"aria-label": "Seleccionar competencias y capacidades"
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("details", {
																	id: "curriculum-manual",
																	className: "form-disclosure",
																	open: !0,
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("summary", { children: "Editar aprendizajes manualmente" }),
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("div", {
																			className: "form-disclosure-content",
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsxs)("div", {
																					className: "form-group",
																					children: [
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("label", {
																							htmlFor: "input-competencia",
																							className: "form-label",
																							children: "Competencia Curricular"
																						}),
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("select", {
																							id: "select-cneb-competencia",
																							className: "form-select hidden",
																							style: {
																								marginBottom: "6px",
																								fontSize: "0.8rem",
																								backgroundColor: "rgba(0, 212, 255, 0.08)",
																								borderColor: "var(--border-accent)"
																							}
																						}),
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("textarea", {
																							id: "input-competencia",
																							className: "form-textarea",
																							rows: 2,
																							placeholder: "Competencia curricular..."
																						}),
																						"\n"
																					]
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsxs)("div", {
																					className: "form-group",
																					children: [
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("label", {
																							htmlFor: "input-capacidad",
																							className: "form-label",
																							children: "Capacidad a Desarrollar"
																						}),
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("select", {
																							id: "select-cneb-capacidad",
																							className: "form-select hidden",
																							style: {
																								marginBottom: "6px",
																								fontSize: "0.8rem",
																								backgroundColor: "rgba(0, 212, 255, 0.08)",
																								borderColor: "var(--border-accent)"
																							}
																						}),
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("textarea", {
																							id: "input-capacidad",
																							className: "form-textarea",
																							rows: 2,
																							placeholder: "Capacidades a desarrollar..."
																						}),
																						"\n"
																					]
																				}),
																				"\n"
																			]
																		}),
																		"\n"
																	]
																}),
																"\n"
															]
														}),
														"\n",
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("div", {
															className: "form-card",
															children: [
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-card-title",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("svg", {
																			className: "ui-icon",
																			"aria-hidden": "true",
																			children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-check" })
																		}),
																		"\n                                Desempeños Esperados\n                            "
																	]
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-group",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("label", {
																			htmlFor: "input-desempeno",
																			className: "form-label",
																			children: "Desempeño de la sesión (por verificar)"
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("textarea", {
																			id: "input-desempeno",
																			className: "form-textarea",
																			rows: 3,
																			placeholder: "Desempeños esperados..."
																		}),
																		"\n"
																	]
																}),
																"\n"
															]
														}),
														"\n",
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("div", {
															className: "form-card",
															children: [
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-card-title",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("svg", {
																			className: "ui-icon",
																			"aria-hidden": "true",
																			children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sparkles" })
																		}),
																		"\n                                Enfoques Transversales CNEB\n                            "
																	]
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-group",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("label", {
																			htmlFor: "input-enfoque",
																			className: "form-label",
																			children: "Enfoque Transversal 1"
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("select", {
																			id: "select-cneb-enfoque",
																			className: "form-select",
																			style: {
																				marginBottom: "6px",
																				fontSize: "0.8rem",
																				backgroundColor: "rgba(0, 212, 255, 0.08)",
																				borderColor: "var(--border-accent)"
																			}
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("input", {
																			type: "text",
																			id: "input-enfoque",
																			className: "form-input",
																			placeholder: "Ej: Enfoque de derechos"
																		}),
																		"\n"
																	]
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-group",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("label", {
																			htmlFor: "input-enfoque2",
																			className: "form-label",
																			children: "Enfoque Transversal 2"
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("select", {
																			id: "select-cneb-enfoque2",
																			className: "form-select",
																			style: {
																				marginBottom: "6px",
																				fontSize: "0.8rem",
																				backgroundColor: "rgba(0, 212, 255, 0.08)",
																				borderColor: "var(--border-accent)"
																			}
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("input", {
																			type: "text",
																			id: "input-enfoque2",
																			className: "form-input",
																			placeholder: "Ej: Enfoque ambiental"
																		}),
																		"\n"
																	]
																}),
																"\n"
															]
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("section", {
															id: "session-proposals",
															className: "quick-suggestions",
															"aria-labelledby": "session-proposals-title",
															children: [
																"\n",
																/* @__PURE__ */ (0, T.jsx)("h4", {
																	id: "session-proposals-title",
																	children: "Propuestas para tu sesión"
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsx)("p", { children: "Actividades, criterios y evidencias son propuestas editables del docente o de la IA; no son textos curriculares oficiales. La IA las completará al generar." }),
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-group",
																	children: [/* @__PURE__ */ (0, T.jsx)("label", {
																		className: "form-label",
																		htmlFor: "input-session-activities",
																		children: "Actividades sugeridas"
																	}), /* @__PURE__ */ (0, T.jsx)("textarea", {
																		id: "input-session-activities",
																		className: "form-textarea",
																		rows: 3,
																		maxLength: 2e3,
																		placeholder: "Propón una actividad o revisa la propuesta después de generar."
																	})]
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-group",
																	children: [/* @__PURE__ */ (0, T.jsx)("label", {
																		className: "form-label",
																		htmlFor: "input-session-criteria",
																		children: "Criterios de evaluación sugeridos (uno por línea)"
																	}), /* @__PURE__ */ (0, T.jsx)("textarea", {
																		id: "input-session-criteria",
																		className: "form-textarea",
																		rows: 3,
																		maxLength: 2e3
																	})]
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-group",
																	children: [/* @__PURE__ */ (0, T.jsx)("label", {
																		className: "form-label",
																		htmlFor: "input-session-evidence",
																		children: "Evidencia sugerida"
																	}), /* @__PURE__ */ (0, T.jsx)("textarea", {
																		id: "input-session-evidence",
																		className: "form-textarea",
																		rows: 2,
																		maxLength: 2e3
																	})]
																}),
																"\n"
															]
														}),
														"\n"
													]
												}),
												" ",
												"\n",
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("div", {
													id: "tab-design",
													className: "tab-pane",
													role: "region",
													"aria-labelledby": "planner-title-design",
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("header", {
															className: "planner-section-heading",
															children: [
																/* @__PURE__ */ (0, T.jsx)("span", {
																	className: "planner-section-step",
																	children: "Paso 04 de 06"
																}),
																/* @__PURE__ */ (0, T.jsx)("h3", {
																	id: "planner-title-design",
																	children: "Dale tu estilo"
																}),
																/* @__PURE__ */ (0, T.jsx)("p", { children: "Ajusta cómo se verá tu documento en el editor y al exportarlo." })
															]
														}),
														"\n",
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("div", {
															className: "form-card",
															children: [
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-card-title",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("svg", {
																			className: "ui-icon",
																			"aria-hidden": "true",
																			children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sliders" })
																		}),
																		"\n                                Presentación del Documento\n                            "
																	]
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-group",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("label", {
																			className: "form-label",
																			htmlFor: "select-design-preset",
																			children: "Estilo Prediseñado"
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("select", {
																			defaultValue: "minedu",
																			id: "select-design-preset",
																			className: "form-select",
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("option", {
																					value: "minedu",
																					children: "MINEDU oficial"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("option", {
																					value: "institucional",
																					children: "Institucional azul"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("option", {
																					value: "moderno",
																					children: "Moderno verde"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("option", {
																					value: "clasico",
																					children: "Clásico editorial"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("option", {
																					value: "accesible",
																					children: "Accesible alto contraste"
																				}),
																				"\n"
																			]
																		}),
																		"\n"
																	]
																}),
																"\n"
															]
														}),
														"\n",
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("div", {
															className: "form-card",
															children: [
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-card-title",
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("svg", {
																			className: "ui-icon",
																			"aria-hidden": "true",
																			children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-image" })
																		}),
																		"\n                                Logos del Encabezado\n                            "
																	]
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	style: {
																		display: "flex",
																		gap: "8px",
																		marginBottom: "10px"
																	},
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("input", {
																			type: "file",
																			id: "input-upload-logo",
																			accept: "image/png,image/jpeg,image/webp",
																			className: "hidden"
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("button", {
																			type: "button",
																			id: "btn-trigger-upload-logo",
																			className: "btn btn-ghost btn-sm",
																			style: {
																				flex: "1",
																				fontSize: "0.74rem",
																				padding: "6px"
																			},
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("svg", {
																					className: "ui-icon",
																					"aria-hidden": "true",
																					children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-upload" })
																				}),
																				" Subir logo\n                                "
																			]
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("button", {
																			type: "button",
																			id: "btn-refresh-logos",
																			className: "btn btn-ghost btn-icon",
																			style: {
																				minWidth: "34px",
																				minHeight: "34px",
																				fontSize: "0.8rem",
																				padding: "2px"
																			},
																			title: "Actualizar lista",
																			"aria-label": "Actualizar galería de logos",
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("svg", {
																					className: "ui-icon",
																					"aria-hidden": "true",
																					children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-refresh" })
																				}),
																				"\n"
																			]
																		}),
																		"\n"
																	]
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	id: "logos-container",
																	style: {
																		display: "grid",
																		gridTemplateColumns: "repeat(4, 1fr)",
																		gap: "6px",
																		maxHeight: "120px",
																		overflowY: "auto",
																		padding: "6px",
																		background: "rgba(0,0,0,0.25)",
																		borderRadius: "8px",
																		border: "1px solid var(--border)"
																	},
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("span", {
																			style: {
																				gridColumn: "span 4",
																				fontSize: "0.7rem",
																				textAlign: "center",
																				color: "var(--text-muted)",
																				padding: "4px"
																			},
																			children: "Inicia\n                                    sesión para ver logos"
																		}),
																		"\n"
																	]
																}),
																"\n"
															]
														}),
														"\n",
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("details", {
															className: "form-disclosure",
															children: [
																"\n",
																/* @__PURE__ */ (0, T.jsx)("summary", { children: "Ajustes avanzados" }),
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-disclosure-content",
																	children: [
																		"\n",
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("div", {
																			className: "form-group",
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("label", {
																					className: "form-label",
																					htmlFor: "input-design-theme-color",
																					children: "Color de Bordes y Recuadros"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsxs)("div", {
																					style: {
																						display: "flex",
																						gap: "8px",
																						alignItems: "center"
																					},
																					children: [
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("input", {
																							type: "color",
																							id: "input-design-theme-color",
																							className: "form-input",
																							style: {
																								padding: "2px",
																								width: "45px",
																								height: "35px",
																								borderRadius: "6px",
																								cursor: "pointer",
																								background: "transparent",
																								border: "1px solid var(--border)"
																							},
																							defaultValue: "#000000"
																						}),
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("input", {
																							type: "text",
																							id: "input-design-theme-color-hex",
																							className: "form-input",
																							placeholder: "#000000",
																							"aria-label": "Código hexadecimal del color de bordes",
																							style: {
																								flex: "1",
																								fontFamily: "monospace"
																							},
																							defaultValue: "#000000"
																						}),
																						"\n"
																					]
																				}),
																				"\n"
																			]
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("div", {
																			className: "form-group",
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("label", {
																					className: "form-label",
																					htmlFor: "input-design-accent-color",
																					children: "Color de títulos y acentos"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("input", {
																					type: "color",
																					id: "input-design-accent-color",
																					className: "form-input",
																					defaultValue: "#C0392B",
																					style: {
																						padding: "2px",
																						width: "100%",
																						height: "35px",
																						cursor: "pointer",
																						background: "transparent",
																						border: "1px solid var(--border)"
																					}
																				}),
																				"\n"
																			]
																		}),
																		"\n",
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("div", {
																			className: "form-group",
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("label", {
																					className: "form-label",
																					htmlFor: "select-design-font-family",
																					children: "Tipo de Letra (Fuente)"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsxs)("select", {
																					defaultValue: "Arial, sans-serif",
																					id: "select-design-font-family",
																					className: "form-select",
																					children: [
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "Arial, sans-serif",
																							children: "Arial (Sans-serif estándar)"
																						}),
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "Calibri, Arial, sans-serif",
																							children: "Calibri (Word moderna)"
																						}),
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "'Times New Roman', serif",
																							children: "Times New Roman (Serif clásica)"
																						}),
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "Georgia, serif",
																							children: "Georgia (Serif de pantalla)"
																						}),
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "'Courier New', monospace",
																							children: "Courier New (Monospaced)"
																						}),
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "'Space Grotesk', sans-serif",
																							children: "Space Grotesk (Moderna)"
																						}),
																						"\n"
																					]
																				}),
																				"\n"
																			]
																		}),
																		"\n",
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("div", {
																			className: "form-group",
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("label", {
																					className: "form-label",
																					htmlFor: "select-design-font-size",
																					children: "Tamaño de Letra"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsxs)("select", {
																					defaultValue: "10pt",
																					id: "select-design-font-size",
																					className: "form-select",
																					children: [
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "8pt",
																							children: "Pequeño (8pt)"
																						}),
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "9pt",
																							children: "Estándar MINEDU (9pt)"
																						}),
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "10pt",
																							children: "Normal (10pt)"
																						}),
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "11pt",
																							children: "Grande (11pt)"
																						}),
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "12pt",
																							children: "Muy Grande (12pt)"
																						}),
																						"\n"
																					]
																				}),
																				"\n"
																			]
																		}),
																		"\n",
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("div", {
																			className: "form-group",
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("label", {
																					className: "form-label",
																					htmlFor: "select-design-padding",
																					children: "Espaciado de Celdas (Padding)"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsxs)("select", {
																					defaultValue: "4px 6px",
																					id: "select-design-padding",
																					className: "form-select",
																					children: [
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "2px 4px",
																							children: "Compacto (2px)"
																						}),
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "4px 6px",
																							children: "Estándar (4px)"
																						}),
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "6px 8px",
																							children: "Amplio (6px)"
																						}),
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "8px 10px",
																							children: "Espacioso (8px)"
																						}),
																						"\n"
																					]
																				}),
																				"\n"
																			]
																		}),
																		"\n",
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("div", {
																			className: "form-group",
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("label", {
																					className: "form-label",
																					htmlFor: "select-design-line-height",
																					children: "Interlineado (Line Height)"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsxs)("select", {
																					defaultValue: "1.4",
																					id: "select-design-line-height",
																					className: "form-select",
																					children: [
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "1.2",
																							children: "Compacto (1.2)"
																						}),
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "1.3",
																							children: "Sutil (1.3)"
																						}),
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "1.4",
																							children: "Estándar (1.4)"
																						}),
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("option", {
																							value: "1.5",
																							children: "Amplio (1.5)"
																						}),
																						"\n"
																					]
																				}),
																				"\n"
																			]
																		}),
																		"\n",
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("div", {
																			className: "form-group",
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("label", {
																					className: "form-label",
																					htmlFor: "select-design-header-bg",
																					children: "Estilo de Cabeceras de Momentos"
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("input", {
																					type: "color",
																					id: "select-design-header-bg",
																					className: "form-input",
																					defaultValue: "#BDD6EE",
																					style: {
																						padding: "2px",
																						width: "100%",
																						height: "35px",
																						cursor: "pointer",
																						background: "transparent",
																						border: "1px solid var(--border)"
																					}
																				}),
																				"\n"
																			]
																		}),
																		"\n"
																	]
																}),
																"\n"
															]
														}),
														"\n"
													]
												}),
												"\n",
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("div", {
													id: "tab-alumnos",
													className: "tab-pane",
													role: "region",
													"aria-labelledby": "planner-title-alumnos",
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("header", {
															className: "planner-section-heading",
															children: [
																/* @__PURE__ */ (0, T.jsx)("span", {
																	className: "planner-section-step",
																	children: "Paso 05 de 06"
																}),
																/* @__PURE__ */ (0, T.jsx)("h3", {
																	id: "planner-title-alumnos",
																	children: "Añade a tus estudiantes"
																}),
																/* @__PURE__ */ (0, T.jsx)("p", { children: "Prepara la lista de cotejo para tu grado y sección." })
															]
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("div", {
															className: "form-card",
															children: [
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-card-title",
																	style: { justifyContent: "space-between" },
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("div", {
																			style: {
																				display: "flex",
																				alignItems: "center",
																				gap: "8px"
																			},
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("svg", {
																					className: "ui-icon",
																					"aria-hidden": "true",
																					children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-users" })
																				}),
																				"\n                                    Registro de Estudiantes\n                                "
																			]
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("button", {
																			type: "button",
																			id: "btn-save-alumnos",
																			className: "btn btn-primary btn-sm",
																			style: {
																				fontSize: "0.72rem",
																				padding: "4px 12px",
																				cursor: "pointer"
																			},
																			children: "Guardar Alumnos"
																		}),
																		"\n"
																	]
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsx)("p", {
																	style: {
																		fontSize: "0.74rem",
																		color: "var(--text-muted)",
																		marginBottom: "12px",
																		lineHeight: "1.4"
																	},
																	children: "\n                                Registra la lista de alumnos para autocompletar la Lista de Cotejo de tu sesión.\n                            "
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-group",
																	style: { marginBottom: "0" },
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("textarea", {
																			id: "textarea-alumnos",
																			className: "form-textarea student-list-input",
																			placeholder: "Pega los nombres aquí, uno por línea. Ejemplo:\\nACOSTA MURGA, CLIFEER AMELEX\\nAGUILAR JAVIER, FARID OMAR"
																		}),
																		"\n"
																	]
																}),
																"\n"
															]
														}),
														"\n"
													]
												}),
												"\n",
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("div", {
													id: "tab-fichas",
													className: "tab-pane",
													role: "region",
													"aria-labelledby": "planner-title-fichas",
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("header", {
															className: "planner-section-heading",
															children: [
																/* @__PURE__ */ (0, T.jsx)("span", {
																	className: "planner-section-step",
																	children: "Paso 06 de 06"
																}),
																/* @__PURE__ */ (0, T.jsx)("h3", {
																	id: "planner-title-fichas",
																	children: "Prepara tus fichas"
																}),
																/* @__PURE__ */ (0, T.jsx)("p", { children: "Una vez generada tu sesión, prepara el material de aplicación que acompañará a tus estudiantes." })
															]
														}),
														"\n",
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("div", {
															id: "apartado-fichas",
															className: "form-card ficha-prompt-apartado",
															children: [
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	style: {
																		display: "flex",
																		alignItems: "center",
																		justifyContent: "space-between",
																		marginBottom: "8px"
																	},
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("label", {
																			htmlFor: "input-ficha-prompt",
																			className: "form-card-title",
																			style: {
																				margin: "0",
																				fontSize: "0.82rem"
																			},
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("svg", {
																					className: "ui-icon",
																					"aria-hidden": "true",
																					style: { color: "#00D4FF" },
																					children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sparkles" })
																				}),
																				"\n                                    Ficha Didáctica (Prompt IA)\n                                "
																			]
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("button", {
																			type: "button",
																			id: "btn-copy-ficha-prompt",
																			className: "btn btn-ghost btn-sm",
																			style: {
																				fontSize: "0.72rem",
																				padding: "4px 10px"
																			},
																			title: "Copiar prompt de ficha",
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("svg", {
																					className: "ui-icon",
																					"aria-hidden": "true",
																					children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-copy" })
																				}),
																				" Copiar\n                                "
																			]
																		}),
																		"\n"
																	]
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsx)("p", {
																	style: {
																		fontSize: "0.74rem",
																		color: "var(--text-muted)",
																		marginBottom: "12px",
																		lineHeight: "1.4"
																	},
																	children: "\n                                Genera un prompt optimizado para ChatGPT Images o Midjourney para crear fichas listas para imprimir:\n                            "
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	style: {
																		display: "grid",
																		gridTemplateColumns: "1fr 1fr",
																		gap: "8px",
																		marginBottom: "10px"
																	},
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("div", { children: [
																			"\n",
																			/* @__PURE__ */ (0, T.jsx)("label", {
																				htmlFor: "select-ficha-nivel",
																				className: "form-label",
																				style: {
																					fontSize: "0.72rem",
																					marginBottom: "4px"
																				},
																				children: "Dificultad"
																			}),
																			"\n",
																			/* @__PURE__ */ (0, T.jsxs)("select", {
																				defaultValue: "avanzado",
																				id: "select-ficha-nivel",
																				className: "form-select",
																				style: {
																					fontSize: "0.75rem",
																					padding: "6px 8px"
																				},
																				children: [
																					"\n",
																					/* @__PURE__ */ (0, T.jsx)("option", {
																						value: "inicio",
																						children: "Nivel Inicio (Andamiaje)"
																					}),
																					"\n",
																					/* @__PURE__ */ (0, T.jsx)("option", {
																						value: "avanzado",
																						children: "Nivel Avanzado (Estándar)"
																					}),
																					"\n",
																					/* @__PURE__ */ (0, T.jsx)("option", {
																						value: "experto",
																						children: "Nivel Experto (Desafío)"
																					}),
																					"\n"
																				]
																			}),
																			"\n"
																		] }),
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("div", { children: [
																			"\n",
																			/* @__PURE__ */ (0, T.jsx)("label", {
																				htmlFor: "select-ficha-variante",
																				className: "form-label",
																				style: {
																					fontSize: "0.72rem",
																					marginBottom: "4px"
																				},
																				children: "Variante"
																			}),
																			"\n",
																			/* @__PURE__ */ (0, T.jsxs)("select", {
																				defaultValue: "estandar",
																				id: "select-ficha-variante",
																				className: "form-select",
																				style: {
																					fontSize: "0.75rem",
																					padding: "6px 8px"
																				},
																				children: [
																					"\n",
																					/* @__PURE__ */ (0, T.jsx)("option", {
																						value: "estandar",
																						children: "Datos de la sesión"
																					}),
																					"\n",
																					/* @__PURE__ */ (0, T.jsx)("option", {
																						value: "alternativa",
																						children: "Situación alternativa"
																					}),
																					"\n",
																					/* @__PURE__ */ (0, T.jsx)("option", {
																						value: "refuerzo",
																						children: "Refuerzo guiado"
																					}),
																					"\n",
																					/* @__PURE__ */ (0, T.jsx)("option", {
																						value: "reto",
																						children: "Reto / Extensión"
																					}),
																					"\n"
																				]
																			}),
																			"\n"
																		] }),
																		"\n"
																	]
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsx)("textarea", {
																	id: "input-ficha-prompt",
																	className: "form-textarea",
																	rows: 7,
																	readOnly: !0,
																	style: {
																		fontSize: "0.75rem",
																		fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
																		lineHeight: "1.35",
																		background: "rgba(0,0,0,0.3)",
																		resize: "vertical"
																	},
																	placeholder: "Primero genera la sesión para poder crear la ficha didáctica..."
																}),
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	style: {
																		display: "flex",
																		gap: "8px",
																		marginTop: "10px"
																	},
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("button", {
																			type: "button",
																			id: "btn-trigger-ficha-prompt",
																			className: "btn btn-primary btn-sm",
																			style: {
																				flex: "1",
																				fontSize: "0.78rem",
																				padding: "8px 12px"
																			},
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("svg", {
																					className: "ui-icon",
																					"aria-hidden": "true",
																					children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sparkles" })
																				}),
																				" Generar variante\n                                "
																			]
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("button", {
																			type: "button",
																			id: "btn-modal-ficha-prompt",
																			className: "btn btn-ghost btn-sm",
																			style: {
																				fontSize: "0.78rem",
																				padding: "8px 12px"
																			},
																			title: "Ver prompt en ventana completa",
																			"aria-label": "Ver prompt en ventana completa",
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("svg", {
																					className: "ui-icon",
																					"aria-hidden": "true",
																					children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-expand" })
																				}),
																				"\n"
																			]
																		}),
																		"\n"
																	]
																}),
																"\n"
															]
														}),
														"\n"
													]
												}),
												"\n",
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("details", {
													className: "form-disclosure session-management-disclosure",
													style: { marginTop: "1.25rem" },
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("summary", {
															style: { fontSize: "0.78rem" },
															children: [
																"\n",
																/* @__PURE__ */ (0, T.jsx)("svg", {
																	className: "ui-icon",
																	"aria-hidden": "true",
																	style: {
																		color: "#00D4FF",
																		marginRight: "6px"
																	},
																	children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-folder" })
																}),
																"\n                            Gestión de Sesiones y Archivos\n                        "
															]
														}),
														"\n",
														/* @__PURE__ */ (0, T.jsxs)("div", {
															className: "form-disclosure-content",
															children: [
																"\n",
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "form-actions",
																	style: {
																		borderTop: "none",
																		paddingTop: "4px"
																	},
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("div", {
																			className: "form-actions-row",
																			style: {
																				display: "flex",
																				gap: "6px",
																				marginBottom: "6px"
																			},
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsxs)("button", {
																					type: "button",
																					id: "btn-save",
																					className: "btn btn-ghost btn-sm",
																					style: { flex: "1" },
																					title: "Guardar cambios en la sesión actual",
																					children: [
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("svg", {
																							className: "ui-icon",
																							"aria-hidden": "true",
																							children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-save" })
																						}),
																						" Guardar\n                                    "
																					]
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsxs)("button", {
																					type: "button",
																					id: "btn-load",
																					className: "btn btn-ghost btn-sm",
																					style: { flex: "1" },
																					title: "Cargar sesión previamente guardada",
																					children: [
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("svg", {
																							className: "ui-icon",
																							"aria-hidden": "true",
																							children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-folder" })
																						}),
																						" Cargar\n                                    "
																					]
																				}),
																				"\n"
																			]
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("button", {
																			type: "button",
																			id: "btn-save-as",
																			className: "btn btn-ghost btn-sm",
																			title: "Guardar una copia de esta sesión con un nuevo título",
																			style: {
																				width: "100%",
																				marginBottom: "6px"
																			},
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("svg", {
																					className: "ui-icon",
																					"aria-hidden": "true",
																					children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-save" })
																				}),
																				" Guardar como…\n                                "
																			]
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("div", {
																			className: "form-actions-row",
																			style: {
																				display: "flex",
																				gap: "6px"
																			},
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsxs)("button", {
																					type: "button",
																					id: "btn-export-json",
																					className: "btn btn-ghost btn-sm",
																					style: {
																						flex: "1",
																						fontSize: "0.72rem"
																					},
																					title: "Exportar sesión a archivo JSON",
																					children: [
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("svg", {
																							className: "ui-icon",
																							"aria-hidden": "true",
																							children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-download" })
																						}),
																						" Exportar JSON\n                                    "
																					]
																				}),
																				"\n",
																				/* @__PURE__ */ (0, T.jsxs)("button", {
																					type: "button",
																					id: "btn-import-json",
																					className: "btn btn-ghost btn-sm",
																					style: {
																						flex: "1",
																						fontSize: "0.72rem"
																					},
																					title: "Importar sesión desde archivo JSON",
																					children: [
																						"\n",
																						/* @__PURE__ */ (0, T.jsx)("svg", {
																							className: "ui-icon",
																							"aria-hidden": "true",
																							children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-upload" })
																						}),
																						" Importar JSON\n                                    "
																					]
																				}),
																				"\n"
																			]
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("input", {
																			type: "file",
																			id: "input-import-file",
																			className: "hidden",
																			accept: ".json"
																		}),
																		"\n"
																	]
																}),
																"\n",
																"\n",
																/* @__PURE__ */ (0, T.jsxs)("div", {
																	className: "saved-sessions",
																	style: { marginTop: "1rem" },
																	children: [
																		"\n",
																		/* @__PURE__ */ (0, T.jsx)("h3", {
																			className: "saved-title",
																			style: {
																				fontSize: "0.75rem",
																				marginBottom: "6px"
																			},
																			children: "Sesiones guardadas"
																		}),
																		"\n",
																		/* @__PURE__ */ (0, T.jsxs)("ul", {
																			id: "saved-list",
																			className: "saved-list",
																			children: [
																				"\n",
																				/* @__PURE__ */ (0, T.jsx)("li", {
																					className: "saved-empty",
																					children: "No hay sesiones guardadas"
																				}),
																				"\n"
																			]
																		}),
																		"\n"
																	]
																}),
																"\n"
															]
														}),
														"\n"
													]
												}),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("aside", {
											className: "session-planning-summary",
											"aria-labelledby": "planning-summary-heading",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", {
													className: "sidebar-eyebrow",
													id: "planning-summary-heading",
													children: "Tu sesión, de un vistazo"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("svg", {
													className: "ui-icon planning-summary-icon",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-file" })
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("h3", {
													id: "planning-summary-title",
													children: "Tu próxima clase"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("p", {
													id: "planning-summary-context",
													children: "Completa los datos de tu sesión."
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("dl", { id: "planning-summary-facts" }),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("div", {
													className: "planning-summary-note",
													children: [/* @__PURE__ */ (0, T.jsx)("svg", {
														className: "ui-icon",
														"aria-hidden": "true",
														children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sparkles" })
													}), /* @__PURE__ */ (0, T.jsx)("p", { children: "Inicio, desarrollo y cierre. Una estructura para acompañarte en el aula." })]
												}),
												"\n"
											]
										}),
										"\n",
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "sidebar-primary-action",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("span", {
													className: "sidebar-primary-hint",
													children: "Listo para crear"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("button", {
													type: "button",
													id: "btn-generate",
													className: "btn btn-primary btn-full",
													children: [
														"\n",
														/* @__PURE__ */ (0, T.jsx)("svg", {
															className: "ui-icon",
															"aria-hidden": "true",
															children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sparkles" })
														}),
														" Generar sesión con IA\n                    "
													]
												}),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsx)(bs, {}),
						"\n"
					]
				}),
				"\n"
			]
		}),
		"\n"
	] });
}
// react-ui/src/surfaces/LogoGallery.tsx
function Ss() {
	return /* @__PURE__ */ (0, T.jsxs)(T.Fragment, { children: [
		" ",
		"\n",
		/* @__PURE__ */ (0, T.jsxs)("div", {
			id: "logos-gallery-modal",
			className: "load-modal hidden no-print",
			style: { zIndex: "9998" },
			children: [
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("div", {
					className: "load-modal-content glass-card",
					style: {
						maxWidth: "520px",
						padding: "2rem",
						position: "relative"
					},
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsx)("button", {
							id: "btn-close-gallery-modal",
							className: "btn btn-ghost btn-sm",
							"aria-label": "Cerrar",
							style: {
								position: "absolute",
								top: "1rem",
								right: "1rem",
								color: "#71717a",
								cursor: "pointer",
								background: "none",
								border: "none",
								padding: "0"
							},
							children: /* @__PURE__ */ (0, T.jsx)("svg", {
								className: "ui-icon",
								"aria-hidden": "true",
								children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-close" })
							})
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("h3", {
							style: {
								margin: "0 0 1rem 0",
								fontSize: "1.2rem",
								color: "#fff",
								fontWeight: "700",
								display: "flex",
								alignItems: "center",
								gap: "8px"
							},
							children: [/* @__PURE__ */ (0, T.jsx)("svg", {
								className: "ui-icon",
								"aria-hidden": "true",
								children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-image" })
							}), " Galería de Logos del Encabezado"]
						}),
						"\n",
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							id: "modal-logo-dropzone",
							className: "source-file-dropzone",
							style: {
								border: "2px dashed rgba(0, 210, 255, 0.2)",
								background: "rgba(0, 210, 255, 0.02)",
								borderRadius: "12px",
								padding: "20px",
								textAlign: "center",
								cursor: "pointer",
								transition: "all 0.2s",
								marginBottom: "1.5rem"
							},
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("span", {
									className: "icon",
									style: {
										display: "block",
										marginBottom: "8px"
									},
									children: /* @__PURE__ */ (0, T.jsx)("svg", {
										className: "ui-icon",
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-upload" })
									})
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("span", {
									className: "text",
									style: {
										fontSize: "0.8rem",
										color: "#a1a1aa",
										lineHeight: "1.4"
									},
									children: [
										"Sube tu logo para el encabezado (PNG, JPG)",
										/* @__PURE__ */ (0, T.jsx)("br", {}),
										/* @__PURE__ */ (0, T.jsx)("strong", {
											style: { color: "#00d2ff" },
											children: "Se comprimirá automáticamente"
										}),
										" para un rendimiento ultra-rápido"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("input", {
									type: "file",
									id: "input-modal-upload-logo",
									accept: "image/png,image/jpeg,image/webp",
									className: "hidden"
								}),
								"\n"
							]
						}),
						"\n",
						"\n",
						/* @__PURE__ */ (0, T.jsx)("div", {
							className: "toolbar-divider",
							style: {
								margin: "1.5rem 0",
								background: "rgba(255,255,255,0.06)",
								height: "1px",
								width: "100%"
							}
						}),
						"\n",
						"\n",
						/* @__PURE__ */ (0, T.jsx)("h4", {
							style: {
								margin: "0 0 0.75rem 0",
								fontSize: "0.9rem",
								color: "#e4e4e7"
							},
							children: "Tus logos subidos previamente:"
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							id: "modal-logos-container",
							style: {
								display: "grid",
								gridTemplateColumns: "repeat(4, 1fr)",
								gap: "10px",
								maxHeight: "200px",
								overflowY: "auto",
								padding: "8px",
								background: "rgba(0,0,0,0.25)",
								borderRadius: "8px",
								border: "1px solid rgba(255,255,255,0.06)",
								marginBottom: "1.5rem"
							},
							children: ["\n", "\n"]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							style: {
								display: "flex",
								justifyContent: "flex-end",
								gap: "8px"
							},
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("button", {
									type: "button",
									id: "btn-modal-gallery-close",
									className: "btn btn-ghost btn-sm",
									style: {
										fontSize: "0.8rem",
										padding: "6px 16px"
									},
									children: "Cerrar"
								}),
								"\n"
							]
						}),
						"\n"
					]
				}),
				"\n"
			]
		}),
		"\n"
	] });
}
// react-ui/src/surfaces/RefineText.tsx
function Cs() {
	return /* @__PURE__ */ (0, T.jsxs)(T.Fragment, { children: [
		" ",
		"\n",
		/* @__PURE__ */ (0, T.jsxs)("div", {
			id: "refine-text-modal",
			className: "load-modal hidden no-print",
			style: { zIndex: "9999" },
			children: [
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("div", {
					className: "load-modal-content glass-card",
					style: {
						maxWidth: "485px",
						padding: "2rem",
						position: "relative"
					},
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsx)("button", {
							id: "btn-close-refine-modal",
							className: "btn btn-ghost btn-sm",
							"aria-label": "Cerrar",
							style: {
								position: "absolute",
								top: "1rem",
								right: "1rem",
								color: "#71717a",
								cursor: "pointer",
								background: "none",
								border: "none",
								padding: "0"
							},
							children: /* @__PURE__ */ (0, T.jsx)("svg", {
								className: "ui-icon",
								"aria-hidden": "true",
								children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-close" })
							})
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("h3", {
							style: {
								margin: "0 0 1rem 0",
								fontSize: "1.2rem",
								color: "#fff",
								fontWeight: "700",
								display: "flex",
								alignItems: "center",
								gap: "8px"
							},
							children: [/* @__PURE__ */ (0, T.jsx)("svg", {
								className: "ui-icon",
								"aria-hidden": "true",
								children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sparkles" })
							}), " Refinar Texto con IA"]
						}),
						"\n",
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							style: {
								background: "rgba(0,0,0,0.25)",
								border: "1px solid rgba(255,255,255,0.06)",
								padding: "12px",
								borderRadius: "8px",
								marginBottom: "1.25rem",
								maxHeight: "100px",
								overflowY: "auto"
							},
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("label", {
									style: {
										display: "block",
										fontSize: "0.75rem",
										color: "var(--text-muted)",
										marginBottom: "4px",
										fontWeight: "600"
									},
									children: "Texto seleccionado:"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("p", {
									id: "refine-text-preview",
									style: {
										fontSize: "0.8rem",
										color: "#e4e4e7",
										margin: "0",
										fontStyle: "italic",
										whiteSpace: "pre-wrap"
									}
								}),
								"\n"
							]
						}),
						"\n",
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "form-group",
							style: { marginBottom: "1.25rem" },
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("label", {
									className: "form-label",
									style: {
										fontSize: "0.85rem",
										fontWeight: "600",
										marginBottom: "8px",
										display: "block"
									},
									children: "¿Cómo deseas refinarlo?"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									style: {
										display: "grid",
										gridTemplateColumns: "repeat(2, 1fr)",
										gap: "8px",
										marginBottom: "12px"
									},
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("button", {
											type: "button",
											className: "btn btn-ghost btn-sm refine-opt-btn active",
											"data-instruction": "Hazlo más formal, claro y profesional. Mantén un tono pedagógico adecuado.",
											children: "Más Formal"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("button", {
											type: "button",
											className: "btn btn-ghost btn-sm refine-opt-btn",
											"data-instruction": "Hazlo mucho más sencillo, explicativo y fácil de entender para niños.",
											children: "Más Sencillo"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("button", {
											type: "button",
											className: "btn btn-ghost btn-sm refine-opt-btn",
											"data-instruction": "Reescríbelo con un tono lúdico, divertido, entusiasta y chistoso para enganchar a los estudiantes.",
											children: "Más Divertido"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("button", {
											type: "button",
											className: "btn btn-ghost btn-sm refine-opt-btn",
											"data-instruction": "Corrige estrictamente cualquier error de ortografía, puntuación o gramática sin alterar su sentido.",
											children: "Corregir Ortografía"
										}),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n",
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "form-group",
							style: { marginBottom: "1.5rem" },
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("label", {
									htmlFor: "input-refine-custom",
									className: "form-label",
									style: {
										fontSize: "0.8rem",
										fontWeight: "600",
										marginBottom: "6px"
									},
									children: "O escribe una orden personalizada:"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("textarea", {
									id: "input-refine-custom",
									className: "form-textarea",
									rows: 2,
									style: {
										fontSize: "0.8rem",
										background: "rgba(0,0,0,0.25)",
										border: "1px solid rgba(255,255,255,0.08)",
										width: "100%",
										borderRadius: "6px",
										padding: "8px",
										color: "#fff"
									},
									placeholder: "Ej. Escríbelo en forma de rima, tradúcelo a quechua, agrega preguntas..."
								}),
								"\n"
							]
						}),
						"\n",
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							style: {
								display: "flex",
								justifyContent: "flex-end",
								gap: "8px"
							},
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("button", {
									type: "button",
									id: "btn-refine-cancel",
									className: "btn btn-ghost btn-sm",
									style: {
										fontSize: "0.8rem",
										padding: "6px 16px"
									},
									children: "Cancelar"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("button", {
									type: "button",
									id: "btn-refine-submit",
									className: "btn btn-primary btn-sm",
									style: {
										fontSize: "0.8rem",
										padding: "6px 16px",
										fontWeight: "600"
									},
									children: [/* @__PURE__ */ (0, T.jsx)("svg", {
										className: "ui-icon",
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-sparkles" })
									}), " Refinar"]
								}),
								"\n"
							]
						}),
						"\n"
					]
				}),
				"\n"
			]
		}),
		"\n"
	] });
}
// react-ui/src/surfaces/SessionLibraryDialog.tsx
function ws() {
	return /* @__PURE__ */ (0, T.jsxs)(T.Fragment, { children: [
		" ",
		"\n",
		/* @__PURE__ */ (0, T.jsxs)("div", {
			id: "load-modal",
			className: "load-modal hidden",
			children: [
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("div", {
					className: "load-modal-content glass-card",
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "load-modal-header",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("h3", { children: [/* @__PURE__ */ (0, T.jsx)("svg", {
									className: "ui-icon",
									"aria-hidden": "true",
									children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-folder" })
								}), " Cargar Sesión Guardada"] }),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("button", {
									id: "btn-close-load",
									className: "btn btn-ghost btn-sm",
									"aria-label": "Cerrar",
									children: /* @__PURE__ */ (0, T.jsx)("svg", {
										className: "ui-icon",
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-close" })
									})
								}),
								"\n"
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("ul", {
							id: "load-list",
							className: "load-list",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("li", {
									className: "saved-empty",
									children: "No hay sesiones guardadas"
								}),
								"\n"
							]
						}),
						"\n"
					]
				}),
				"\n"
			]
		}),
		"\n"
	] });
}
// react-ui/src/surfaces/EditorOverlays.tsx
function Ts() {
	return /* @__PURE__ */ (0, T.jsxs)(T.Fragment, { children: [
		" ",
		"\n",
		/* @__PURE__ */ (0, T.jsxs)("div", {
			id: "chatbot-container",
			className: "chatbot-container no-print",
			children: [
				"\n",
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("button", {
					id: "chatbot-bubble",
					className: "chatbot-bubble",
					title: "Preguntar al copiloto",
					"aria-label": "Preguntar al copiloto",
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsx)("svg", {
							className: "ui-icon",
							"aria-hidden": "true",
							children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-chat" })
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("span", { className: "pulse-ring" }),
						"\n"
					]
				}),
				"\n",
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("div", {
					id: "chatbot-window",
					className: "chatbot-window glass-card hidden",
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "chatbot-header",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "chatbot-header-info",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", { className: "chatbot-dot" }),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", { children: [
											"\n",
											/* @__PURE__ */ (0, T.jsx)("h4", {
												className: "chatbot-title",
												children: "Space Assistant"
											}),
											"\n",
											/* @__PURE__ */ (0, T.jsx)("span", {
												className: "chatbot-subtitle",
												children: "GPT-6 Luna Copilot"
											}),
											"\n"
										] }),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("button", {
									id: "btn-close-chatbot",
									className: "btn-close-chat",
									"aria-label": "Cerrar copiloto",
									children: /* @__PURE__ */ (0, T.jsx)("svg", {
										className: "ui-icon",
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-close" })
									})
								}),
								"\n"
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							id: "chatbot-messages",
							className: "chatbot-messages",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "chat-message bot",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("div", {
											className: "message-bubble",
											children: "\n                        ¡Hola! Soy tu asistente pedagógico de Space Lab. ¿En qué puedo ayudarte hoy con tus sesiones o\n                        el Currículo Nacional?\n                    "
										}),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "chatbot-input-container",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("input", {
									type: "text",
									id: "chatbot-input",
									placeholder: "Pregunta algo sobre tu sesión...",
									autoComplete: "off"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("button", {
									id: "btn-send-chat",
									className: "btn btn-accent btn-icon-only",
									"aria-label": "Enviar mensaje al copiloto",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("svg", {
											className: "ui-icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-arrow-right" })
										}),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n"
					]
				}),
				"\n"
			]
		}),
		"\n",
		/* @__PURE__ */ (0, T.jsx)(ws, {}),
		"\n",
		"\n",
		/* @__PURE__ */ (0, T.jsxs)("div", {
			id: "logo-editor-popover",
			className: "logo-editor-popover hidden no-print",
			style: {
				position: "absolute",
				display: "none"
			},
			children: [
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("div", {
					className: "popover-header",
					style: {
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						borderBottom: "1px solid rgba(255,255,255,0.06)",
						paddingBottom: "8px"
					},
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("h4", {
							style: {
								margin: "0",
								fontSize: "0.9rem",
								color: "#fff",
								fontWeight: "600"
							},
							children: [/* @__PURE__ */ (0, T.jsx)("svg", {
								className: "ui-icon",
								"aria-hidden": "true",
								children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-image" })
							}), " Ajustes de Logo"]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("button", {
							type: "button",
							id: "logo-editor-close",
							className: "popover-close-btn",
							"aria-label": "Cerrar",
							style: {
								background: "none",
								border: "none",
								color: "#a1a1aa",
								cursor: "pointer",
								padding: "0",
								lineHeight: "1"
							},
							children: /* @__PURE__ */ (0, T.jsx)("svg", {
								className: "ui-icon",
								"aria-hidden": "true",
								children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-close" })
							})
						}),
						"\n"
					]
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("div", {
					className: "popover-body",
					style: {
						padding: "12px 0 0 0",
						display: "flex",
						flexDirection: "column",
						gap: "12px"
					},
					children: [
						"\n",
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "popover-action-row",
							style: {
								display: "flex",
								gap: "6px",
								flexWrap: "wrap"
							},
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("button", {
									type: "button",
									id: "logo-editor-gallery-trigger",
									className: "btn btn-ghost btn-sm",
									style: {
										flex: "1.5",
										fontSize: "0.75rem",
										padding: "4px 8px !important",
										minWidth: "100px"
									},
									children: [/* @__PURE__ */ (0, T.jsx)("svg", {
										className: "ui-icon",
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-image" })
									}), " Galería / Subir"]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("button", {
									type: "button",
									id: "logo-editor-swap",
									className: "btn btn-ghost btn-sm",
									style: {
										flex: "1",
										fontSize: "0.75rem",
										padding: "4px 8px !important"
									},
									title: "Mover la posición del logo en la lista",
									children: [/* @__PURE__ */ (0, T.jsx)("svg", {
										className: "ui-icon",
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-refresh" })
									}), " Mover"]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("button", {
									type: "button",
									id: "logo-editor-delete",
									className: "btn btn-danger-ghost btn-sm",
									style: {
										flex: "1",
										fontSize: "0.75rem",
										padding: "4px 8px !important",
										color: "#ef4444",
										borderColor: "rgba(239, 68, 68, 0.2)"
									},
									children: [/* @__PURE__ */ (0, T.jsx)("svg", {
										className: "ui-icon",
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, T.jsx)("use", { href: "#icon-trash" })
									}), " Quitar"]
								}),
								"\n"
							]
						}),
						"\n",
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "popover-control-group",
							style: {
								display: "flex",
								flexDirection: "column",
								gap: "4px"
							},
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									style: {
										display: "flex",
										justifyContent: "space-between",
										fontSize: "0.75rem",
										color: "#a1a1aa"
									},
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", { children: "Ancho:" }),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											id: "logo-editor-width-val",
											style: {
												fontWeight: "600",
												color: "#00d2ff"
											},
											children: "65px"
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("input", {
									type: "range",
									id: "logo-editor-width-slider",
									min: "30",
									max: "200",
									defaultValue: "65",
									style: {
										width: "100%",
										height: "4px",
										borderRadius: "2px",
										accentColor: "#00d2ff",
										cursor: "pointer"
									}
								}),
								"\n"
							]
						}),
						"\n",
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							style: {
								display: "flex",
								alignItems: "center",
								gap: "6px",
								cursor: "pointer"
							},
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("input", {
									type: "checkbox",
									id: "logo-editor-aspect-ratio",
									defaultChecked: !0,
									style: {
										width: "14px",
										height: "14px",
										cursor: "pointer",
										accentColor: "#00d2ff"
									}
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("label", {
									htmlFor: "logo-editor-aspect-ratio",
									style: {
										fontSize: "0.75rem",
										color: "#a1a1aa",
										cursor: "pointer",
										userSelect: "none"
									},
									children: "Mantener proporción (alto auto)"
								}),
								"\n"
							]
						}),
						"\n",
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							id: "logo-editor-height-container",
							className: "popover-control-group hidden",
							style: {
								display: "none",
								flexDirection: "column",
								gap: "4px"
							},
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									style: {
										display: "flex",
										justifyContent: "space-between",
										fontSize: "0.75rem",
										color: "#a1a1aa"
									},
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", { children: "Alto:" }),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											id: "logo-editor-height-val",
											style: {
												fontWeight: "600",
												color: "#00d2ff"
											},
											children: "65px"
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("input", {
									type: "range",
									id: "logo-editor-height-slider",
									min: "30",
									max: "200",
									defaultValue: "65",
									style: {
										width: "100%",
										height: "4px",
										borderRadius: "2px",
										accentColor: "#00d2ff",
										cursor: "pointer"
									}
								}),
								"\n"
							]
						}),
						"\n",
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							id: "logo-editor-fit-container",
							className: "popover-control-group hidden",
							style: {
								display: "none",
								flexDirection: "column",
								gap: "4px"
							},
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("span", {
									style: {
										fontSize: "0.75rem",
										color: "#a1a1aa"
									},
									children: "Ajuste de imagen:"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "fit-btn-group",
									style: {
										display: "flex",
										gap: "4px"
									},
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("button", {
											type: "button",
											className: "btn btn-ghost btn-xs btn-fit active",
											"data-fit": "contain",
											style: {
												flex: "1",
												fontSize: "0.65rem",
												padding: "2px 4px !important"
											},
											children: "Ajustar"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("button", {
											type: "button",
											className: "btn btn-ghost btn-xs btn-fit",
											"data-fit": "cover",
											style: {
												flex: "1",
												fontSize: "0.65rem",
												padding: "2px 4px !important"
											},
											children: "Recortar"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("button", {
											type: "button",
											className: "btn btn-ghost btn-xs btn-fit",
											"data-fit": "fill",
											style: {
												flex: "1",
												fontSize: "0.65rem",
												padding: "2px 4px !important"
											},
											children: "Estirar"
										}),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n",
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							style: {
								borderTop: "1px solid rgba(255,255,255,0.06)",
								paddingTop: "10px",
								marginTop: "2px"
							},
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("button", {
									type: "button",
									id: "logo-editor-reset",
									className: "btn btn-accent btn-full",
									style: {
										fontSize: "0.75rem",
										padding: "6px 12px",
										height: "auto"
									},
									children: "Restablecer valores"
								}),
								"\n"
							]
						}),
						"\n"
					]
				}),
				"\n"
			]
		}),
		"\n",
		/* @__PURE__ */ (0, T.jsx)(Cs, {}),
		"\n",
		/* @__PURE__ */ (0, T.jsx)(Ss, {}),
		"\n",
		"\n",
		/* @__PURE__ */ (0, T.jsxs)("div", {
			id: "editor-context-menu",
			className: "editor-context-menu hidden no-print",
			style: {
				position: "absolute",
				display: "none",
				zIndex: "10000"
			},
			children: [
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("ul", {
					className: "context-menu-list",
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("li", {
							id: "menu-item-bold",
							className: "context-menu-item",
							children: [
								/* @__PURE__ */ (0, T.jsx)("strong", { children: "Negrita" }),
								" ",
								/* @__PURE__ */ (0, T.jsx)("span", {
									className: "shortcut",
									children: "Ctrl+B"
								})
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("li", {
							id: "menu-item-italic",
							className: "context-menu-item",
							children: [
								/* @__PURE__ */ (0, T.jsx)("em", { children: "Cursiva" }),
								" ",
								/* @__PURE__ */ (0, T.jsx)("span", {
									className: "shortcut",
									children: "Ctrl+I"
								})
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("li", {
							id: "menu-item-underline",
							className: "context-menu-item",
							children: [
								/* @__PURE__ */ (0, T.jsx)("span", {
									style: { textDecoration: "underline" },
									children: "Subrayado"
								}),
								" ",
								/* @__PURE__ */ (0, T.jsx)("span", {
									className: "shortcut",
									children: "Ctrl+U"
								})
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("li", { className: "context-menu-divider" }),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("li", {
							id: "menu-item-cut",
							className: "context-menu-item",
							children: ["Cortar ", /* @__PURE__ */ (0, T.jsx)("span", {
								className: "shortcut",
								children: "Ctrl+X"
							})]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("li", {
							id: "menu-item-copy",
							className: "context-menu-item",
							children: ["Copiar ", /* @__PURE__ */ (0, T.jsx)("span", {
								className: "shortcut",
								children: "Ctrl+C"
							})]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("li", {
							id: "menu-item-paste",
							className: "context-menu-item",
							children: ["Pegar ", /* @__PURE__ */ (0, T.jsx)("span", {
								className: "shortcut",
								children: "Ctrl+V"
							})]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("li", { className: "context-menu-divider" }),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("li", {
							id: "menu-item-ai-improve",
							className: "context-menu-item",
							children: "Refinar con IA"
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("li", {
							id: "menu-item-ai-rubrica",
							className: "context-menu-item",
							children: "Rúbrica con IA"
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("li", {
							id: "menu-item-edit-logo",
							className: "context-menu-item hidden",
							children: "Ajustes de Logo"
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("li", {
							id: "menu-item-swap-logos",
							className: "context-menu-item hidden",
							children: "Intercambiar Lado"
						}),
						"\n"
					]
				}),
				"\n"
			]
		}),
		"\n"
	] });
}
// react-ui/src/FrontendShell.tsx
var Es = (0, _.memo)(function() {
	return /* @__PURE__ */ (0, T.jsxs)(T.Fragment, { children: [
		/* @__PURE__ */ (0, T.jsx)("div", { id: "react-preview-root" }),
		/* @__PURE__ */ (0, T.jsx)("a", {
			className: "skip-link",
			href: "#session-form",
			children: "Ir al formulario de sesión"
		}),
		/* @__PURE__ */ (0, T.jsx)(z, {}),
		/* @__PURE__ */ (0, T.jsx)(hs, {}),
		/* @__PURE__ */ (0, T.jsx)(gs, {}),
		/* @__PURE__ */ (0, T.jsx)(_s, {}),
		/* @__PURE__ */ (0, T.jsx)(vs, {}),
		/* @__PURE__ */ (0, T.jsx)(xs, {}),
		/* @__PURE__ */ (0, T.jsx)(Ts, {})
	] });
});
function Ds({ onReady: e }) {
	return (0, _.useEffect)(() => e?.(), [e]), /* @__PURE__ */ (0, T.jsx)(Es, {});
}
// react-ui/src/surfaces/Downloads.tsx
function Os() {
	return /* @__PURE__ */ (0, T.jsxs)(T.Fragment, { children: [
		"\n",
		/* @__PURE__ */ (0, T.jsxs)("label", {
			className: "theme-picker standalone-theme-picker",
			title: "Tema de la aplicación",
			children: [
				"\n",
				/* @__PURE__ */ (0, T.jsx)("span", {
					className: "sr-only",
					children: "Tema de la aplicación"
				}),
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("select", {
					id: "theme-preference",
					"aria-label": "Tema de la aplicación",
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsx)("option", {
							value: "system",
							children: "Sistema"
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("option", {
							value: "light",
							children: "Claro"
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("option", {
							value: "dark",
							children: "Oscuro"
						}),
						"\n"
					]
				}),
				"\n"
			]
		}),
		"\n",
		/* @__PURE__ */ (0, T.jsx)("div", { className: "stars" }),
		"\n",
		/* @__PURE__ */ (0, T.jsx)("div", { className: "stars-anim" }),
		"\n",
		/* @__PURE__ */ (0, T.jsx)("div", { className: "glow-orb-1" }),
		"\n",
		/* @__PURE__ */ (0, T.jsx)("div", { className: "glow-orb-2" }),
		"\n",
		/* @__PURE__ */ (0, T.jsxs)("div", {
			className: "container",
			children: [
				"\n",
				/* @__PURE__ */ (0, T.jsxs)("div", {
					className: "card",
					children: [
						"\n",
						/* @__PURE__ */ (0, T.jsx)("h1", { children: "S.Y. PABLITO_DP" }),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("div", {
							className: "version",
							children: "> Motor de Exportación Local v1.4.5"
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("p", { children: "\n                Activa el motor de exportación local en Windows para generar PDF en A4 y documentos de Word (.docx) editables desde la web, con tablas y fórmulas matemáticas.\n            " }),
						"\n",
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("a", {
							href: "https://github.com/dppablito4-oss/space-lab-sesiones-educ/releases/download/v1.4.5/pablitopyhost.exe",
							className: "btn-download",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("svg", {
									className: "download-icon",
									viewBox: "0 0 24 24",
									fill: "none",
									stroke: "currentColor",
									strokeWidth: "2.5",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" }),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("span", { children: "DESCARGAR MOTOR DE EXPORTACIÓN" }),
								"\n"
							]
						}),
						"\n",
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "mockup-terminal",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "terminal-header",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("div", { className: "terminal-dot red" }),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("div", { className: "terminal-dot yellow" }),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("div", { className: "terminal-dot green" }),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "terminal-title",
											children: "pablitopyhost.exe"
										}),
										"\n"
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "terminal-body",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "t-cyan",
											children: "S.Y. PABLITO_DP - Servidor Local v1.4.5"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "t-muted",
											children: "Escaneando motor de renderizado Chromium..."
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "t-green",
											children: "[LISTO] Motor Chromium extraído y disponible en ./bin/chrome-win/"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "t-muted",
											children: "Iniciando servidor local en el puerto 8000..."
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "t-magenta",
											children: "[MOTOR ONLINE] Servidor de exportación disponible en http://localhost:8000"
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "t-yellow",
											children: "[IMPORTANTE] Mantén esta ventana abierta en segundo plano."
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											className: "t-green",
											children: "[CONECTADO] El enlace de seguridad fue establecido con la web."
										}),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsx)("div", { className: "divider" }),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "steps-container",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("div", {
									className: "steps-title",
									children: "\n                    GUÍA DE INICIO RÁPIDO:\n                "
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									className: "install-steps",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "install-step",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("div", {
													className: "step-num",
													children: "1"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("div", {
													className: "step-text",
													children: [
														"Descarga el archivo ",
														/* @__PURE__ */ (0, T.jsx)("strong", { children: "pablitopyhost.exe" }),
														" desde el botón superior."
													]
												}),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "install-step",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("div", {
													className: "step-num",
													children: "2"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsx)("div", {
													className: "step-text",
													children: "Ejecuta el archivo. Verás iniciarse la terminal hacker de color negro profundo."
												}),
												"\n"
											]
										}),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", {
											className: "install-step",
											children: [
												"\n",
												/* @__PURE__ */ (0, T.jsx)("div", {
													className: "step-num",
													children: "3"
												}),
												"\n",
												/* @__PURE__ */ (0, T.jsxs)("div", {
													className: "step-text",
													children: [
														"Haz clic en el enlace ",
														/* @__PURE__ */ (0, T.jsx)("strong", { children: "[ CLIC AQUÍ PARA VINCULAR ]" }),
														" dentro de la consola para emparejar tu navegador."
													]
												}),
												"\n"
											]
										}),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "warning-box",
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsx)("div", {
									className: "warning-title",
									children: "NOTA DE SEGURIDAD (Windows SmartScreen):"
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("ul", {
									className: "warning-steps-list",
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("li", { children: "Al ser una aplicación de desarrollo independiente (no firmada digitalmente), Windows podría lanzar una advertencia." }),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("li", { children: [
											"Comprueba el origen y el hash de la descarga indicados abajo. Para continuar, haz clic en ",
											/* @__PURE__ */ (0, T.jsx)("strong", { children: "\"Más información\"" }),
											"."
										] }),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("li", { children: [
											"Presiona el botón ",
											/* @__PURE__ */ (0, T.jsx)("strong", { children: "\"Ejecutar de todas formas\"" }),
											" para iniciar el puente de exportación local."
										] }),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n",
						/* @__PURE__ */ (0, T.jsxs)("div", {
							className: "verify-box",
							style: {
								background: "rgba(6, 182, 212, 0.03)",
								border: "1px solid rgba(6, 182, 212, 0.2)",
								borderRadius: "16px",
								padding: "24px",
								textAlign: "left",
								marginTop: "25px"
							},
							children: [
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									style: {
										color: "var(--cyan)",
										fontWeight: "700",
										fontSize: "0.98rem",
										marginBottom: "12px",
										display: "flex",
										alignItems: "center",
										gap: "8px"
									},
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("svg", {
											width: "20",
											height: "20",
											viewBox: "0 0 24 24",
											fill: "none",
											stroke: "currentColor",
											strokeWidth: "2",
											children: [/* @__PURE__ */ (0, T.jsx)("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" }), /* @__PURE__ */ (0, T.jsx)("polyline", { points: "9 12 11 14 15 10" })]
										}),
										"\n                    VERIFICACIÓN DE INTEGRIDAD Y SEGURIDAD\n                "
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsx)("div", {
									style: {
										fontSize: "0.88rem",
										color: "#cbd5e1",
										lineHeight: "1.6",
										marginBottom: "12px"
									},
									children: "\n                    Comprueba que el SHA-256 de tu descarga coincida con el ejecutable publicado y compilado en GitHub Actions:\n                "
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									style: {
										background: "rgba(0,0,0,0.5)",
										padding: "12px",
										borderRadius: "8px",
										fontFamily: "'Fira Code', monospace",
										fontSize: "0.78rem",
										wordBreak: "break-all",
										color: "#a5f3fc",
										border: "1px solid rgba(6, 182, 212, 0.2)",
										marginBottom: "14px"
									},
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsx)("span", {
											style: {
												color: "#64748b",
												display: "block",
												fontSize: "0.7rem",
												textTransform: "uppercase"
											},
											children: "Hash SHA-256 Oficial:"
										}),
										"\n                    46F3CABDE6A5B58C8F59D5E15E811E33C7D66917DA84D9BA5A53BCD34620BDAB\n                "
									]
								}),
								"\n",
								/* @__PURE__ */ (0, T.jsxs)("div", {
									style: {
										fontSize: "0.82rem",
										color: "#94a3b8",
										display: "flex",
										flexDirection: "column",
										gap: "6px"
									},
									children: [
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", { children: [
											"• ",
											/* @__PURE__ */ (0, T.jsx)("strong", { children: "Versión:" }),
											" v1.4.5 | ",
											/* @__PURE__ */ (0, T.jsx)("strong", { children: "Publicación:" }),
											" 2026-10-24 02:24 UTC | ",
											/* @__PURE__ */ (0, T.jsx)("strong", { children: "Tamaño:" }),
											" 106.536.121 bytes"
										] }),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", { children: [
											"• ",
											/* @__PURE__ */ (0, T.jsx)("strong", { children: "Código fuente público:" }),
											" ",
											/* @__PURE__ */ (0, T.jsx)("a", {
												href: "https://github.com/dppablito4-oss/space-lab-sesiones-educ/tree/v1.4.5/backend",
												target: "_blank",
												rel: "noopener noreferrer",
												style: {
													color: "var(--cyan)",
													textDecoration: "underline"
												},
												children: "Ver backend en GitHub"
											})
										] }),
										"\n",
										/* @__PURE__ */ (0, T.jsxs)("div", { children: [
											"• ",
											/* @__PURE__ */ (0, T.jsx)("strong", { children: "Auditoría técnica:" }),
											" ",
											/* @__PURE__ */ (0, T.jsx)("a", {
												href: "https://github.com/dppablito4-oss/space-lab-sesiones-educ/blob/main/AUDITORIA_SEGURIDAD_MOTOR_LOCAL.md",
												target: "_blank",
												rel: "noopener noreferrer",
												style: {
													color: "var(--cyan)",
													textDecoration: "underline"
												},
												children: "Reporte de Seguridad y Aislamiento"
											})
										] }),
										"\n"
									]
								}),
								"\n"
							]
						}),
						"\n"
					]
				}),
				"\n"
			]
		}),
		"\n"
	] });
}
// react-ui/src/ConnectionPage.tsx
function ks() {
	let [e, t] = (0, _.useState)("system"), n = () => window.SpaceLabTheme;
	return (0, _.useEffect)(() => {
		t(n()?.getPreference() || "system");
	}, []), /* @__PURE__ */ (0, T.jsxs)("label", {
		className: "theme-picker standalone-theme-picker",
		title: "Tema de la aplicación",
		children: [/* @__PURE__ */ (0, T.jsx)("span", {
			className: "sr-only",
			children: "Tema de la aplicación"
		}), /* @__PURE__ */ (0, T.jsxs)("select", {
			id: "theme-preference",
			"aria-label": "Tema de la aplicación",
			value: e,
			onChange: (e) => {
				t(e.target.value), n()?.setPreference(e.target.value);
			},
			children: [
				/* @__PURE__ */ (0, T.jsx)("option", {
					value: "system",
					children: "Sistema"
				}),
				/* @__PURE__ */ (0, T.jsx)("option", {
					value: "light",
					children: "Claro"
				}),
				/* @__PURE__ */ (0, T.jsx)("option", {
					value: "dark",
					children: "Oscuro"
				})
			]
		})]
	});
}
function As() {
	let [e, t] = (0, _.useState)("ready"), [n, r] = (0, _.useState)(""), i = (0, _.useRef)(""), a = (0, _.useRef)(null);
	(0, _.useEffect)(() => (i.current = new URLSearchParams(window.location.search).get("token") || "", i.current || (t("error"), r("Falta el token de enlace seguro. Asegúrate de abrir la URL enviada por el ejecutable.")), () => a.current?.abort()), []), (0, _.useEffect)(() => {
		if (e !== "connected") return;
		let t = setTimeout(() => {
			window.location.href = "./#/app";
		}, 2200);
		return () => clearTimeout(t);
	}, [e]);
	async function o() {
		if (!i.current || e === "checking") return;
		t("checking"), r(""), a.current?.abort(), a.current = new AbortController();
		let n = a.current.signal;
		try {
			let e, r = encodeURIComponent(i.current);
			try {
				e = await fetch(`http://127.0.0.1:8000/verificar-token?token=${r}`, { signal: n });
			} catch (t) {
				if (n.aborted) throw t;
				e = await fetch(`http://localhost:8000/verificar-token?token=${r}`, { signal: n });
			}
			if (e.status === 401) throw Error("TOKEN_EXPIRED");
			if (!e.ok || (await e.json()).status !== "Connected") throw Error("CONNECTION_FAILED");
			localStorage.setItem("backend_connected", "true"), localStorage.setItem("connection_token", i.current), t("connected");
		} catch (e) {
			if (n.aborted) return;
			t("error"), r(e instanceof Error && e.message === "TOKEN_EXPIRED" ? "El token de enlace está vencido. Abre de nuevo el enlace de vinculación en pablitopyhost.exe." : "No se pudo establecer la conexión segura. Mantén abierto pablitopyhost.exe y permite a este sitio conectarse al motor local antes de reintentar.");
		}
	}
	return /* @__PURE__ */ (0, T.jsxs)(T.Fragment, { children: [
		/* @__PURE__ */ (0, T.jsx)(ks, {}),
		/* @__PURE__ */ (0, T.jsx)("div", { className: "grid-bg" }),
		/* @__PURE__ */ (0, T.jsx)("div", {
			className: "container",
			children: /* @__PURE__ */ (0, T.jsxs)("div", {
				id: "card",
				className: "glass-card",
				children: [
					/* @__PURE__ */ (0, T.jsxs)("div", {
						id: "link-box",
						className: `link-animation-box${e === "connected" ? " connected" : ""}`,
						children: [
							/* @__PURE__ */ (0, T.jsx)("div", {
								className: "node node-left",
								title: "Navegador web",
								children: /* @__PURE__ */ (0, T.jsxs)("svg", {
									viewBox: "0 0 24 24",
									"aria-hidden": "true",
									children: [/* @__PURE__ */ (0, T.jsx)("circle", {
										cx: "12",
										cy: "12",
										r: "9"
									}), /* @__PURE__ */ (0, T.jsx)("path", { d: "M3 12h18M12 3c3 3.5 3 14 0 18M12 3c-3 3.5-3 14 0 18" })]
								})
							}),
							/* @__PURE__ */ (0, T.jsx)("div", {
								className: "connection-beam",
								children: /* @__PURE__ */ (0, T.jsx)("div", { className: "connection-pulse" })
							}),
							/* @__PURE__ */ (0, T.jsx)("div", {
								className: "node node-right",
								title: "Motor local",
								children: /* @__PURE__ */ (0, T.jsxs)("svg", {
									viewBox: "0 0 24 24",
									"aria-hidden": "true",
									children: [/* @__PURE__ */ (0, T.jsx)("rect", {
										x: "4",
										y: "5",
										width: "16",
										height: "14",
										rx: "2"
									}), /* @__PURE__ */ (0, T.jsx)("path", { d: "M8 9h8M8 13h5M8 17h3" })]
								})
							})
						]
					}),
					/* @__PURE__ */ (0, T.jsx)("h1", {
						id: "title",
						children: e === "connected" ? "Motor Enlazado" : "Enlazar Motor Local"
					}),
					/* @__PURE__ */ (0, T.jsx)("p", {
						id: "description",
						children: e === "connected" ? "El motor de exportación local en Python ha sido vinculado correctamente. Redirigiéndote al editor..." : "Detectamos una solicitud de conexión segura para activar la exportación premium (PDF impecable y Word nativo)."
					}),
					/* @__PURE__ */ (0, T.jsx)("button", {
						id: "btn-connect",
						className: `btn-connect${e === "connected" ? " btn-success" : ""}`,
						onClick: () => void o(),
						disabled: e === "checking" || e === "connected" || e === "error" && !i.current,
						children: /* @__PURE__ */ (0, T.jsx)("span", {
							id: "btn-text",
							children: e === "checking" ? "Comprobando conexión..." : e === "connected" ? "¡Enlace Exitoso!" : "Vincular con Motor Local"
						})
					}),
					/* @__PURE__ */ (0, T.jsx)("div", {
						id: "status-message",
						className: n ? "status-alert alert-error" : "status-alert",
						role: "status",
						style: n ? { display: "block" } : void 0,
						children: n
					}),
					/* @__PURE__ */ (0, T.jsxs)("div", {
						className: "footer-info",
						children: ["Desarrollado por Samuel Pablo | ", /* @__PURE__ */ (0, T.jsx)("a", {
							href: "./",
							children: "Ir al Panel de Control"
						})]
					})
				]
			})
		})
	] });
}
// react-ui/src/runtime.ts
async function js() {
	let e = window.SpaceLabFrontend;
	if (!window.SpaceLabControllerBoot) throw Error("No se cargó el arranque de la aplicación.");
	await window.SpaceLabControllerBoot.start(), document.querySelectorAll("[data-theme-selector],#theme-preference").forEach((e) => {
		let t = window.SpaceLabTheme;
		t && (e.value = t.getPreference(), e.addEventListener("change", () => t.setPreference(e.value)));
	}), e.ready = !0, window.dispatchEvent(new CustomEvent("spacelab:frontend-ready"));
}
function Ms() {
	let e = window.matchMedia("(prefers-reduced-motion: reduce)"), t, n = (n) => {
		if (e.matches) return;
		let r = n.detail?.view, i = r ? document.getElementById(`${r}-view`) : document.querySelector(".sl-main");
		i && !i.classList.contains("hidden") && (t?.cancel(), t = i.animate([{
			opacity: .35,
			transform: "translateY(6px)"
		}, {
			opacity: 1,
			transform: "translateY(0)"
		}], {
			duration: 180,
			easing: "cubic-bezier(.2,.8,.2,1)"
		}));
	};
	return window.addEventListener("spacelab:view-changed", n), window.addEventListener("spacelab:frontend-navigate", n), () => {
		t?.cancel(), window.removeEventListener("spacelab:view-changed", n), window.removeEventListener("spacelab:frontend-navigate", n);
	};
}
// react-ui/src/main.tsx
function Ns() {
	let e = document.getElementById("react-preview-root");
	if (!e || new URLSearchParams(location.search).get("ui") === "legacy") return;
	[
		"#/app",
		"#/editor",
		"#/sessions/new"
	].includes(location.hash) && (e.innerHTML = "<div class=\"sl-starting\" role=\"status\"><span>Space Lab</span>Preparando tu espacio de trabajo…</div>");
	let t = performance.now();
	function n() {
		let r = window.SpaceLabReactBridge;
		r ? (e.dataset.ready = "true", (0, v.createRoot)(e).render(/* @__PURE__ */ (0, T.jsx)(Uo, { bridge: r }))) : performance.now() - t > 15e3 ? (e.replaceChildren(), delete document.body.dataset.reactPreview) : window.setTimeout(n, 50);
	}
	n();
}
var Ps = document.getElementById("frontend-root"), Fs = document.getElementById("standalone-root");
window.SpaceLabFrontend?.mode === "recovery" || (Fs ? (0, v.hydrateRoot)(Fs, Fs.dataset.page === "Downloads" ? /* @__PURE__ */ (0, T.jsx)(Os, {}) : /* @__PURE__ */ (0, T.jsx)(As, {})) : Ps ? (window.SpaceLabFrontend = {
	hydrated: !1,
	ready: !1,
	failures: []
}, (0, v.hydrateRoot)(Ps, /* @__PURE__ */ (0, T.jsx)(Ds, { onReady: () => {
	window.SpaceLabFrontend.hydrated = !0, ls();
	let e = Ms(), t = Qo();
	return js().then(Ns), () => {
		e(), t();
	};
} }), { onRecoverableError(e) {
	window.SpaceLabFrontend.failures.push("hydration"), console.error("Frontend hydration failed", e);
} })) : Ns());
