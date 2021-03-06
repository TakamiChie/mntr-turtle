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
	var validator = new Validator();
	
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
		var errors = validator.check(source.value);
		if (errors.length === 0) {
			intervalNum.onchange();
			turtle.run(source.value);
		} else {
			alert('Errors have occurred.');
			println('---');
			println(String(errors.length) + ' ERRORS FOUND.');
			for(var i = 0; i < errors.length; i++){
				var error = errors[i];
				if(error.code === 500){
					println(error.message + ': ' + error.source);
				} else if (error.code === 503) {
					println(error.message);
				}
			}
			println('---');
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
