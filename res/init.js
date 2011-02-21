function println(str) {
	console.log(str)
}
function init() {
	var canvas = document.getElementById("canvas");
	var console = document.getElementById("console");
	var pointer = canvas.lastChild;
	var source = console.source;
	var intervalNum = console.interval;
	var startButton = console.start;
	var imagenizeButton = console.imagenize;
	var samples = console.samples;
	
	var _ = "  ";
	var turtle = new Turtle(canvas.firstChild);
	
	var clickHandler;
	
	turtle.on("start", function() {
		startButton.value = "実行中(クリックで中断)";
		
		// めんどくさいからクロージャで実装。
		// 誰かてきとーになおして
		clickHandler = startButton.onclick;
		startButton.onclick = function() {
			turtle.interrupt();
		};
	});
	
	turtle.on("end", function() {
		startButton.value = "実行";

		if (clickHandler) 
			startButton.onclick = clickHandler;
	});

	turtle.on("point", function(x,y) {
		pointer.style.left = (x-1) + "px";
		pointer.style.top = (y-1) + "px";
	});

	intervalNum.onchange = function() {
		turtle.skipRadius = Number(this.value);
	};
	startButton.onclick = function() {
		// 最高に汚いので整理したい
		// コードをここで事前にバリデーション
		var checked = validCode(source.value);
		var depth = returnDepth(source.value);
		if (checked[0].message === 'success' && depth === 0) {
			intervalNum.onchange();
			turtle.run(source.value);
		} else {
			alert('error!');
			if (checked[0].message !== 'success') {
				printError(check);
			}
			if(depth !== 0){
				println('Brackets not closed.');
			}
		}
	};

	imagenizeButton.onclick = function() {
		try {
			var url = canvas.firstChild.toDataURL();
			window.open(url, null);
		} catch (e) {
			alert("このブラウザでは画像のエクスポートができません。");
		}
	};

	var draws = {
		"四角":
			"Center\n"+
			"Repeat 4 [\n"+
			_+"Forward 100\n"+
			_+"Turn 90\n"+
			"]",
		"星":
			"Center\n"+
			"Turn 90\n"+
			"Repeat 5 [\n"+
			_+"Forward 100\n"+
			_+"Turn 144\n"+
			"]",
		"円":
			"Center\n"+
			"Turn 60\n"+
			_+"Repeat 360 [\n"+
			_+"Forward 1\n"+
			_+"Turn 1\n"+
			"]",
		"花":
			"Center\n"+
			"Repeat 6 [\n"+
			_+"Turn 60\n"+
			_+"Repeat 360 [\n"+
			_+_+"Forward 1\n"+
			_+_+"Turn 1\n"+
			_+"]\n"+
			"]",
	};

	for (var name in draws) {
		var opt = document.createElement("option");
		opt.setAttribute("value", draws[name]);
		opt.innerHTML = name;
		samples.appendChild(opt);
	}
	samples.onchange = function() {
		var index = samples.selectedIndex;
		if (index <= 0) return false;

		source.value = samples.options[index].getAttribute("value");
	};

	shrinker("comref", true);
}

// LOGO Validator

function validCode(code) {
	var list = code.split(/\r?\n\r?/);
	var reg = /^(setsize)$|^(moveto\s[0-9]+\s[0-9]+)$|^(move\s[0-9]+\s[0-9]+)$|^(center)$|^(forward\s[0-9]+)$|^(Turn\s[0-9]+)$|^(repeat\s[0-9]+\s\[)$|^(\])$/i;
	var errors = [];
	
	for(var i = 0; i < list.length; i++){
		var line = list[i];
		line = line.replace(/^\s+|\s+$/g, "");
		line = line.replace(reg, '');
		if (line !== '') {
			errors.push({
				line: i + 1,
				message: 'syntax error at line ' + String(i+1),
				source: line
			});
		}
	}
	if (errors.length === 0) {
		errors[0] = {message: 'success'};
	}
	return errors;
};

function returnDepth(code) {
	var list = code.split(/\r?\n\r?/);
	var depth = 0;
	for(var i = 0; i < list.length; i++){
		var line = list[i].replace(/^\s+|\s+$/g, "");
		if(line.slice(-1) === '['){
			depth++;
		}else if(line.slice(0,1) === ']'){
			depth--;
		}
		if(depth < 0) depth = 0;
	}
	return depth;
};

function printError(errors) {
	for (var i = 0; i < errors.length; i++) {
		println(errors[i].message + ': \'' + errors[i].source + '\'.');
	}
};

function shrinker(targetID, hidden) {
	var trigger = document.getElementById(targetID+"_shrink");
	var target = document.getElementById(targetID);
	var display = target.style.display || "block";
	var isHidden = !!hidden;

	// initialize

	if (isHidden) target.style.display = "none";
	
	trigger.style.cursor = "pointer";

	trigger.onclick = function() {
		if (isHidden) {
			target.style.display = display;
		} else {
			target.style.display = "none";
		}

		isHidden = !isHidden;
	};
}

window.onload = init;
