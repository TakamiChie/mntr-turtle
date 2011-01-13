//
// The TURTLE interpreter / javascript
//
//

/**
 * String trim method (for IE)
 */
if (!String.prototype.trim) {
	String.prototype.trim = function() {
		return this.replace(/^\s+/,"").replace(/\s+$/, ""); 
	};
}

/**
 * Vector calculation methods
 */
var Vector2D = {
	degreeToRadian: function (deg) {
		return (deg/360)*2*Math.PI;
	},
	rotate: function (x, y, rad) {
		x = Number(x); y = Number(y);
		return {
			x: x*Math.cos(rad)-y*Math.sin(rad),
			y: x*Math.sin(rad)+y*Math.cos(rad)
		};
	}
};

function TokenArray() {
	// inherit
	Array.apply(this);

	// properties
	this.current = -1;
	
	// construtor
	this.initialize.apply(this, arguments);
}
TokenArray.prototype = (function() {
	var proto = new Array;

	// constructor
	proto.initialize = function(code) {
		var list = code.split(/\r?\n\r?/);
		while (list.length) {
			var line = list.shift();
			if (line != "") {
			// Forwardコマンドに限り、数ピクセル刻みで分割
				if(line.toLowerCase().indexOf("forward") != -1) {
				 	var nums = line.trim().split(" ")[1];
				 	for(var i = 0; i < nums; i++) {
						this.push("Forward 1");
					}
				} else {
					this.push(line);
				}
			}
		}
		this.first();
	};
	
	// public
	proto.first = function() {
		this.current = -1;
	};
	
	proto.next = function() {
		if (this.length <= 0) return null;
		if (this.current >= this.length-1) {
			this.current = this.length-1;
			return null;
		}
		return this._parseToken(++this.current);
	};
	

	// private
	proto._parseToken = function(lineNum) {
		var raw = this[lineNum].split(" ");
		var token = [];

		while (raw.length) {
			var args = raw.shift();
			if (args != "") token.push(args);
		}
		return token;
	};

	// aspect
	/*
	var _aspect = function() {
		if (this.length <= 0) throw new Error("oops! there's no codes!");
		if (this.length <= this.current) {
			this.current = this.length-1;
			return null;
		}
	};
	var _methods = ["next"];
	while(_methods.length) (function(name) {
		var f = proto[name];
		proto[name] = function() {
			_aspect.apply(this, arguments);
			f.apply(this, arguments);
		};
	})(_methods.shift());
	*/
	
	return proto;
})();


/**
 * class Interpreter
 */
function Interpreter() {
	// properties
	this.interval = 0;
	
	this._isHanged = true;
	this._tokenList = [];
	this._map = {};
}
Interpreter.prototype = (function() {
	var proto = {};

	// public
	proto.run = function(code) {
		this._isHanged = false;
		this._interprete(code);
	};

	proto.end = function() {
		this._tokenList.length = 0;
	};

	proto.interrupt = function() {
		this._isHanged = true;
	};

	proto.on = function(key, callback) {
		this._map[key.toLowerCase()] = callback;
	};

	proto.off = function(key) {
		var f = this._map[key.toLowerCase()] || function() {};
		this._map[key.toLowerCase()] = undefined;
		return f;
	};

	proto.dispatch = function(key, args) {
		var that = this;
		
		if (this._map[key.toLowerCase()]) {
			//setTimeout(function() {
				that._map[key.toLowerCase()].apply(that, args || [])
			//}, 0);
		}
	};
	
	proto.count = function() {
		return this._tokenList.current;
	};
	
	proto.move = function(count) {
		return this._tokenList.current = count;
	};
	
	// private
	proto._interprete = function(code) {
		var that = this;
		// split each lines
		this._tokenList = new TokenArray(code);
		
		// interprete
		(function() {
			var token, key;
			
			do {
				token = that._tokenList.next();
				if (!token || that._isHanged) return that.dispatch("end");
				
				key = token.shift();
				that.dispatch(key, token);

				if (0 < that.interval) {
					return setTimeout(arguments.callee, that.interval);
				}
			} while(true);
		})();
	};
	
	return proto;
})();


/**
 * class Turtle
 */
function Turtle(element) {
	// inherit
	Interpreter.apply(this);
	
	// properties
	this.canvas = element;
	
	this.x = 0;
	this.y = 0;
	this.degree = 0;
	this.skipRadius = 1;
	
	this._duration = 0;
	this._varStore = {};

	
	// constructor
	
	
	if (!element) throw new Error("element:Element not specified.");
	
	var ctx = element.getContext("2d");
	var interval = 50;
	var that = this;

	that.on("repeat", function(num) {
		var count = this.count();
		var handler = this.off("]");
		
		that.on("]", function() {
			if (--num <= 0) return that.on("]", handler);
			that.move(count);
		});
		
	});
	
	that.on("forward", function(duration) {
		
		duration = Number(duration);
		
		// あまりに描画が遅いので高速化
		if (that.duration < that.skipRadius) {
			that.duration += duration;
			that.interval = 0;
		} else {
			that.interval = interval;
			that.duration = 0;
		}
		
		var rotated = Vector2D.rotate(
			0, duration, Vector2D.degreeToRadian(that.degree+180)
		);
		var rx = Number(that.x+rotated.x), ry = Number(that.y+rotated.y);
		
		ctx.beginPath();
		ctx.moveTo(that.x, that.y);
		ctx.lineTo(rx, ry);
		ctx.stroke();

		that.dispatch("moveto", [rx, ry]);
		that.dispatch("point", [rx, ry]);
	});

	that.on("moveto", function(x, y) {
		x = Number(x), y = Number(y);

		that.x = x;
		that.y = y;
		ctx.moveTo(x, y);
	});

	that.on("center", function() {
		var dim = that.getCanvasSize();
		that.dispatch("moveTo", [parseInt(dim.width/2), parseInt(dim.height/2)]);
	});

	that.on("turn", function(degree) {
		that.degree = that.degree + Number(degree) % 360;
	});

	that.on("setsize", function(width, height) {
		that.setCanvasSize({width: Number(width), height: Number(height)});
	});

	that.on("clear", function() {
		var dim = that.getCanvasSize();
		ctx.clearRect(0, 0, dim.width, dim.height);
	});
	
	that.on("end", function() {
		that.end();
	});
}
Turtle.prototype = (function() {
	var proto = new Interpreter;

	// public
	var _proto_run = proto.run;
	proto.run = function(code) {
		this.clear();
		this.degree = 0;
		this.dispatch("start");
		this.dispatch("moveto", [0, 0]);
		
		_proto_run.call(this, code);
	};

	proto.clear = function() {
		this.dispatch("clear");
		this.dispatch("end");
		this.off("]")
	};

	proto.setCanvasSize = function(dimension) {
		this.canvas.setAttribute("width", String(dimension.width));
		this.canvas.setAttribute("height", String(dimension.height));
	};
	
	proto.getCanvasSize = function() {
		return {
			width: Number(this.canvas.getAttribute("width")),
			height: Number(this.canvas.getAttribute("height")),
		};
	};

	// private
	
	return proto;
})();
