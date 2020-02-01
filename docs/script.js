var e6b = {
    questions: {
        calc: {},
        wind: {}
    },
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

e6b.wind_params = function () {
    var params = {};
    params.track = e6b.rand(0, 360);
    params.tas = e6b.rand(60, 250);
    params.wind_dir = e6b.rand(0, 36) * 10;
    params.wind_speed = e6b.rand(5, 40);

    var delta = params.wind_dir - params.track;

    var cos = Math.cos(delta * (Math.PI / 180.0));
    var sin = Math.sin(delta * (Math.PI / 180.0));
    params.headwind = Math.round(params.wind_speed * cos);
    params.crosswind = Math.round(params.wind_speed * sin);

    var cos2 = params.tas / Math.sqrt(params.tas * params.tas + params.crosswind * params.crosswind);
    var effective_speed = Math.round(params.tas * cos2);
    params.gs = effective_speed - params.headwind;

    var delta2 = Math.round(Math.acos(cos2) * (180 / Math.PI)) * (Math.abs(params.wind_dir - params.track) < 180 ? 1 : -1);
    params.heading = params.track + delta2;

    return params;
};


////////////////////////////////////////////////////////////////////////
// Questions for the wind side
////////////////////////////////////////////////////////////////////////

e6b.questions.wind.wind = function () {
    var params = e6b.wind_params();
    return [
        "Calculate actual winds: track " + params.track + "°, heading " + params.heading + "°, " + params.tas + " kt TAS, " + params.gs + " kt GS.",
        "Winds are from " + params.wind_dir + "° @ " + params.wind_speed + " kt."
    ];
};

e6b.questions.wind.heading = function () {
    var params = e6b.wind_params();
    return [
        "Calculate heading: desired course " + params.track + "°, airspeed " + params.tas + " ktas, winds " + params.wind_dir + "@" + params.wind_speed + " kt.",
        "Required heading is " + params.heading + "°."
    ];
};

e6b.questions.wind.groundspeed = function () {
    var params = e6b.wind_params();
    return [
        "Calculate groundspeed: desired course " + params.track + "°, airspeed " + params.tas + " ktas, winds " + params.wind_dir + "@" + params.wind_speed + " kt.",
        "Groundspeed is " + params.gs + " kt."
    ];
};

e6b.questions.wind.headwind = function () {
    var params = e6b.wind_params();
    return [
        "Calculate headwind/tailwind: desired course " + params.track + "°, airspeed " + params.tas + " ktas, winds " + params.wind_dir + "@" + params.wind_speed + " kt.",
        "There is a " + Math.abs(params.headwind) + (params.headwind < 0 ? " kt tailwind component." : " kt headwind component.")
    ];
};

e6b.questions.wind.crosswind = function () {
    var params = e6b.wind_params();
    return [
        "Calculate crosswind: " + params.track + "°, airspeed " + params.tas + " ktas, winds " + params.wind_dir + "@" + params.wind_speed + " kt.",
        "The crosswind is " + Math.abs(params.headwind) + " kt from the " + (params.crosswind < 0 ? "left." : "right.")
    ];
};




////////////////////////////////////////////////////////////////////////
// Questions for the calculator side.
////////////////////////////////////////////////////////////////////////

e6b.questions.calc.volumeUnits = function () {
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


e6b.questions.calc.distanceUnits = function () {
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


e6b.questions.calc.fuelTimeDistance = function () {
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


e6b.questions.calc.speedTimeDistance = function () {
    var speed = e6b.rand(60, 300);
    var time = e6b.rand(5, 180);
    var distance = Math.round(speed / 60.0 * time);

    switch (e6b.rand(0, 3)) {
    case 0:
        return [
            "How far will you travel at " + speed + " kt for " + e6b.time(time) + "?",
            "" + distance + " nm"
        ];
    case 1:
        return [
            "How long will it take to travel " + distance + " nm at " + speed + " kt?",
            "" + e6b.time(time)
        ];
    default:
        return [
            "How fast are you going if you cover " + distance + " nm in " + e6b.time(time) + "?",
            "" + speed + " kt"
        ];
    }
};

e6b.rand_item = function (obj) {
    var keys = Object.keys(obj);
    return obj[keys[keys.length * Math.random() << 0]];
};

e6b.question = function () {
    if (e6b.type == 'wind') {
        var qfun = e6b.rand_item(e6b.questions.wind);
    } else {
        var qfun = e6b.rand_item(e6b.questions.calc);
    }
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

    e6b.nodes.question = document.getElementById("question");
    e6b.nodes.answer = document.getElementById("answer");

    e6b.question();
};

