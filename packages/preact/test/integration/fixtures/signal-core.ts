const i = Symbol.for("preact-signals");
function t() {
	if (r > 1) {
		r--;
		return;
	}
	let i,
		t = !1;
	while (void 0 !== s) {
		let o = s;
		s = void 0;
		f++;
		while (void 0 !== o) {
			const n = o.o;
			o.o = void 0;
			o.f &= -3;
			if (!(8 & o.f) && v(o))
				try {
					o.c();
				} catch (o) {
					if (!t) {
						i = o;
						t = !0;
					}
				}
			o = n;
		}
	}
	f = 0;
	r--;
	if (t) throw i;
}
function o(i) {
	if (r > 0) return i();
	r++;
	try {
		return i();
	} finally {
		t();
	}
}
let n, s;
function h(i) {
	const t = n;
	n = void 0;
	try {
		return i();
	} finally {
		n = t;
	}
}
let r = 0,
	f = 0,
	e = 0;
function c(i) {
	if (void 0 === n) return;
	let t = i.n;
	if (void 0 === t || t.t !== n) {
		t = { i: 0, S: i, p: n.s, n: void 0, t: n, e: void 0, x: void 0, r: t };
		if (void 0 !== n.s) n.s.n = t;
		n.s = t;
		i.n = t;
		if (32 & n.f) i.S(t);
		return t;
	} else if (-1 === t.i) {
		t.i = 0;
		if (void 0 !== t.n) {
			t.n.p = t.p;
			if (void 0 !== t.p) t.p.n = t.n;
			t.p = n.s;
			t.n = void 0;
			n.s.n = t;
			n.s = t;
		}
		return t;
	}
}
function u(i) {
	this.v = i;
	this.i = 0;
	this.n = void 0;
	this.t = void 0;
}
u.prototype.brand = i;
u.prototype.h = function () {
	return !0;
};
u.prototype.S = function (i) {
	if (this.t !== i && void 0 === i.e) {
		i.x = this.t;
		if (void 0 !== this.t) this.t.e = i;
		this.t = i;
	}
};
u.prototype.U = function (i) {
	if (void 0 !== this.t) {
		const t = i.e,
			o = i.x;
		if (void 0 !== t) {
			t.x = o;
			i.e = void 0;
		}
		if (void 0 !== o) {
			o.e = t;
			i.x = void 0;
		}
		if (i === this.t) this.t = o;
	}
};
u.prototype.subscribe = function (i) {
	return E(() => {
		const t = this.value,
			o = n;
		n = void 0;
		try {
			i(t);
		} finally {
			n = o;
		}
	});
};
u.prototype.valueOf = function () {
	return this.value;
};
u.prototype.toString = function () {
	return this.value + "";
};
u.prototype.toJSON = function () {
	return this.value;
};
u.prototype.peek = function () {
	const i = n;
	n = void 0;
	try {
		return this.value;
	} finally {
		n = i;
	}
};
Object.defineProperty(u.prototype, "value", {
	get() {
		const i = c(this);
		if (void 0 !== i) i.i = this.i;
		return this.v;
	},
	set(i) {
		if (i !== this.v) {
			if (f > 100) throw new Error("Cycle detected");
			this.v = i;
			this.i++;
			e++;
			r++;
			try {
				for (let i = this.t; void 0 !== i; i = i.x) i.t.N();
			} finally {
				t();
			}
		}
	},
});
function d(i) {
	return new u(i);
}
function v(i) {
	for (let t = i.s; void 0 !== t; t = t.n)
		if (t.S.i !== t.i || !t.S.h() || t.S.i !== t.i) return !0;
	return !1;
}
function l(i) {
	for (let t = i.s; void 0 !== t; t = t.n) {
		const o = t.S.n;
		if (void 0 !== o) t.r = o;
		t.S.n = t;
		t.i = -1;
		if (void 0 === t.n) {
			i.s = t;
			break;
		}
	}
}
function y(i) {
	let t,
		o = i.s;
	while (void 0 !== o) {
		const i = o.p;
		if (-1 === o.i) {
			o.S.U(o);
			if (void 0 !== i) i.n = o.n;
			if (void 0 !== o.n) o.n.p = i;
		} else t = o;
		o.S.n = o.r;
		if (void 0 !== o.r) o.r = void 0;
		o = i;
	}
	i.s = t;
}
function a(i) {
	u.call(this, void 0);
	this.x = i;
	this.s = void 0;
	this.g = e - 1;
	this.f = 4;
}
(a.prototype = new u()).h = function () {
	this.f &= -3;
	if (1 & this.f) return !1;
	if (32 == (36 & this.f)) return !0;
	this.f &= -5;
	if (this.g === e) return !0;
	this.g = e;
	this.f |= 1;
	if (this.i > 0 && !v(this)) {
		this.f &= -2;
		return !0;
	}
	const i = n;
	try {
		l(this);
		n = this;
		const i = this.x();
		if (16 & this.f || this.v !== i || 0 === this.i) {
			this.v = i;
			this.f &= -17;
			this.i++;
		}
	} catch (i) {
		this.v = i;
		this.f |= 16;
		this.i++;
	}
	n = i;
	y(this);
	this.f &= -2;
	return !0;
};
a.prototype.S = function (i) {
	if (void 0 === this.t) {
		this.f |= 36;
		for (let i = this.s; void 0 !== i; i = i.n) i.S.S(i);
	}
	u.prototype.S.call(this, i);
};
a.prototype.U = function (i) {
	if (void 0 !== this.t) {
		u.prototype.U.call(this, i);
		if (void 0 === this.t) {
			this.f &= -33;
			for (let i = this.s; void 0 !== i; i = i.n) i.S.U(i);
		}
	}
};
a.prototype.N = function () {
	if (!(2 & this.f)) {
		this.f |= 6;
		for (let i = this.t; void 0 !== i; i = i.x) i.t.N();
	}
};
Object.defineProperty(a.prototype, "value", {
	get() {
		if (1 & this.f) throw new Error("Cycle detected");
		const i = c(this);
		this.h();
		if (void 0 !== i) i.i = this.i;
		if (16 & this.f) throw this.v;
		return this.v;
	},
});
function w(i) {
	return new a(i);
}
function _(i) {
	const o = i.u;
	i.u = void 0;
	if ("function" == typeof o) {
		r++;
		const s = n;
		n = void 0;
		try {
			o();
		} catch (t) {
			i.f &= -2;
			i.f |= 8;
			g(i);
			throw t;
		} finally {
			n = s;
			t();
		}
	}
}
function g(i) {
	for (let t = i.s; void 0 !== t; t = t.n) t.S.U(t);
	i.x = void 0;
	i.s = void 0;
	_(i);
}
function p(i) {
	if (n !== this) throw new Error("Out-of-order effect");
	y(this);
	n = i;
	this.f &= -2;
	if (8 & this.f) g(this);
	t();
}
function b(i) {
	this.x = i;
	this.u = void 0;
	this.s = void 0;
	this.o = void 0;
	this.f = 32;
}
b.prototype.c = function () {
	const i = this.S();
	try {
		if (8 & this.f) return;
		if (void 0 === this.x) return;
		const t = this.x();
		if ("function" == typeof t) this.u = t;
	} finally {
		i();
	}
};
b.prototype.S = function () {
	if (1 & this.f) throw new Error("Cycle detected");
	this.f |= 1;
	this.f &= -9;
	_(this);
	l(this);
	r++;
	const i = n;
	n = this;
	return p.bind(this, i);
};
b.prototype.N = function () {
	if (!(2 & this.f)) {
		this.f |= 2;
		this.o = s;
		s = this;
	}
};
b.prototype.d = function () {
	this.f |= 8;
	if (!(1 & this.f)) g(this);
};
function E(i) {
	const t = new b(i);
	try {
		t.c();
	} catch (i) {
		t.d();
		throw i;
	}
	return t.d.bind(t);
}
export { u as Signal, o as batch, w as computed, E as effect, d as signal, h as untracked }; //# sourceMappingURL=signals-core.mjs.map
