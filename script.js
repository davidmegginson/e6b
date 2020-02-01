var e6b = {
    questions: {},
    nodes: {}
};

e6b.rand = function(min, max) {
    return Math.floor(Math.random() * (max - min) + min)
};

e6b.time = function(minutes) {
    var h = Math.floor(minutes / 60);
    var m = minutes % 60;
    if (m < 10) {
        m = '0' + m;
    }
    return h + ":" + m;
};

e6b.questions.volumeUnits = function () {
    var gallons = e6b.rand(3, 150);
    var litres = Math.floor(gallons * 3.78541);
    switch (e6b.rand(0, 2)) {
    case 0:
        return [
            "Convert " + gallons + " US gallons to litres.",
            "" + litres + " litres"
        ];
    default:
        return [
            "Convert " + litres + " litres to US gallons.",
            "" + gallons + " gallons"
        ];
    }
};


e6b.questions.distanceUnits = function () {
    var units = ['nautical miles', 'statue miles', 'kilometers'];
    var values = [];
    values [0] = e6b.rand(10, 300);
    values [1] = Math.round(values[0] * 1.15078);
    values [2] = Math.round(values[0] * 1.852);

    var k1 = e6b.rand(0, 3);
    var k2;
    do {
        k2 = e6b.rand(0, 3);
    } while (k2 == k1);

    return [
        "Convert " + values[k1] + " " + units[k1] + " to " + units[k2] + ".",
        "" + values[k2] + " " + units[k2]
    ];
};


e6b.questions.fuelTimeDistance = function () {
    var fuel_burn = e6b.rand(50, 300) / 10.0;
    var time = e6b.rand(5, 180);
    var gallons = Math.round(fuel_burn / 6.0 * time) / 10.0;

    switch (e6b.rand(0, 3)) {
    case 0:
        return [
            "How much fuel will you burn at " + fuel_burn + " gal/hr for " + e6b.time(time) + "?",
            "" + gallons + " gal"
        ];
    case 1:
        return [
            "How long can you fly with " + gallons + " gal at " + fuel_burn + " gal/hr?",
            "" + e6b.time(time)
        ];
    default:
        return [
            "What is your fuel consumption using " + gallons + " gal in " + e6b.time(time) + "?",
            "" + fuel_burn + " gal/hr"
        ];
    }
};


e6b.questions.speedTimeDistance = function () {
    var speed = e6b.rand(60, 300);
    var time = e6b.rand(5, 180);
    var distance = Math.round(speed / 60.0 * time);

    switch (e6b.rand(0, 3)) {
    case 0:
        return [
            "How far will you travel at " + speed + " kt for " + e6b.time(time) + "?",
            "" + distance + " nm"
        ];
    case 1:
        return [
            "How long will it take to travel " + distance + " nm at " + speed + " kt?",
            "" + e6b.time(time)
        ];
    default:
        return [
            "How fast are you going if you cover " + distance + " nm in " + e6b.time(time) + "?",
            "" + speed + " kt"
        ];
    }
};

e6b.question = function () {
    var keys = Object.keys(e6b.questions);
    var qfun = e6b.questions[keys[keys.length * Math.random() << 0]];
    var info = qfun();
    e6b.nodes.answer.hidden = true;
    e6b.nodes.question.textContent = info[0];
    e6b.nodes.answer.textContent = info[1];
};

e6b.input = function () {
    if (e6b.nodes.answer.hidden) {
        e6b.nodes.answer.hidden = false;
    } else {
        e6b.question();
    }
};

window.onload = function () {
    window.addEventListener('click', e6b.input);
    window.addEventListener('keypress', e6b.input);
    window.addEventListener('touchstart', e6b.input);

    e6b.nodes.question = document.getElementById("question");
    e6b.nodes.answer = document.getElementById("answer");

    e6b.question();
};

