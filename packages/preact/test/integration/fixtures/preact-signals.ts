import { isValidElement as e, options as i, Component as t } from "preact";
import { useMemo as n, useRef as o, useEffect as r } from "preact/hooks";
import { Signal as f, computed as l, signal as s, effect as u } from "./signal-core.ts";
export { Signal, batch, computed, effect, signal, untracked } from "./signal-core.ts";
function c(t, e) {
	i[t] = e.bind(null, i[t] || (() => {}));
}
let a, d;
function h(t) {
	if (d) d();
	d = t && t.S();
}
function p({ data: t }) {
	const i = useSignal(t);
	i.value = t;
	const o = n(() => {
		let t = this.__v;
		while ((t = t.__))
			if (t.__c) {
				t.__c.__$f |= 4;
				break;
			}
		this.__$u.c = () => {
			var t;
			if (!e(o.peek()) && 3 === (null == (t = this.base) ? void 0 : t.nodeType))
				this.base.data = o.peek();
			else {
				this.__$f |= 1;
				this.setState({});
			}
		};
		return l(() => {
			let t = i.value.value;
			return 0 === t ? 0 : !0 === t ? "" : t || "";
		});
	}, []);
	return o.value;
}
p.displayName = "_st";
Object.defineProperties(f.prototype, {
	constructor: { configurable: !0, value: void 0 },
	type: { configurable: !0, value: p },
	props: {
		configurable: !0,
		get() {
			return { data: this };
		},
	},
	__b: { configurable: !0, value: 1 },
});
c("__b", (t, i) => {
	if ("string" == typeof i.type) {
		let t,
			e = i.props;
		for (let n in e) {
			if ("children" === n) continue;
			let o = e[n];
			if (o instanceof f) {
				if (!t) i.__np = t = {};
				t[n] = o;
				e[n] = o.peek();
			}
		}
	}
	t(i);
});
c("__r", (t, i) => {
	h();
	let e,
		n = i.__c;
	if (n) {
		n.__$f &= -2;
		e = n.__$u;
		if (void 0 === e)
			n.__$u = e = (function (t) {
				let i;
				u(function () {
					i = this;
				});
				i.c = () => {
					n.__$f |= 1;
					n.setState({});
				};
				return i;
			})();
	}
	a = n;
	h(e);
	t(i);
});
c("__e", (t, i, e, n) => {
	h();
	a = void 0;
	t(i, e, n);
});
c("diffed", (t, i) => {
	h();
	a = void 0;
	let e;
	if ("string" == typeof i.type && (e = i.__e)) {
		let t = i.__np,
			n = i.props;
		if (t) {
			let i = e.U;
			if (i)
				for (let e in i) {
					let n = i[e];
					if (void 0 !== n && !(e in t)) {
						n.d();
						i[e] = void 0;
					}
				}
			else {
				i = {};
				e.U = i;
			}
			for (let o in t) {
				let r = i[o],
					f = t[o];
				if (void 0 === r) {
					r = v(e, o, f, n);
					i[o] = r;
				} else r.o(f, n);
			}
		}
	}
	t(i);
});
function v(t, i, e, n) {
	const o = i in t && void 0 === t.ownerSVGElement,
		r = s(e);
	return {
		o: (t, i) => {
			r.value = t;
			n = i;
		},
		d: u(() => {
			const e = r.value.value;
			if (n[i] !== e) {
				n[i] = e;
				if (o) t[i] = e;
				else if (e) t.setAttribute(i, e);
				else t.removeAttribute(i);
			}
		}),
	};
}
c("unmount", (t, i) => {
	if ("string" == typeof i.type) {
		let t = i.__e;
		if (t) {
			const i = t.U;
			if (i) {
				t.U = void 0;
				for (let t in i) {
					let e = i[t];
					if (e) e.d();
				}
			}
		}
	} else {
		let t = i.__c;
		if (t) {
			const i = t.__$u;
			if (i) {
				t.__$u = void 0;
				i.d();
			}
		}
	}
	t(i);
});
c("__h", (t, i, e, n) => {
	if (n < 3 || 9 === n) i.__$f |= 2;
	t(i, e, n);
});
t.prototype.shouldComponentUpdate = function (t, i) {
	const e = this.__$u;
	if (!((e && void 0 !== e.s) || 4 & this.__$f)) return !0;
	if (3 & this.__$f) return !0;
	for (let t in i) return !0;
	for (let i in t) if ("__source" !== i && t[i] !== this.props[i]) return !0;
	for (let i in this.props) if (!(i in t)) return !0;
	return !1;
};
function useSignal(t) {
	return n(() => s(t), []);
}
function useComputed(t) {
	const i = o(t);
	i.current = t;
	a.__$f |= 4;
	return n(() => l(() => i.current()), []);
}
function useSignalEffect(t) {
	const i = o(t);
	i.current = t;
	r(() => u(() => i.current()), []);
}
export { useComputed, useSignal, useSignalEffect }; //# sourceMappingURL=signals.mjs.map
