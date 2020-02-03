////////////////////////////////////////////////////////////////////////
// Script to generate E6B problems dynamically.
////////////////////////////////////////////////////////////////////////


/**
 * Top-level object (for encapsulation)
 */
var e6b = {
    problems: {
        calc: {},
        wind: {}
    },
    nodes: {}
};



////////////////////////////////////////////////////////////////////////
// Problems for the wind side
////////////////////////////////////////////////////////////////////////


/**
 * Generate random parameters for a wind problem.
 */
e6b.gen_wind_params = function () {
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


/**
 * Wind problem: calculate the actual winds.
 */
e6b.problems.wind.wind = function () {
    var params = e6b.gen_wind_params();
    return [
        "Calculate actual winds: track "
	    + params.track
	    + "°, heading "
	    + params.heading
	    + "°, " + params.tas
	    + " kt TAS, "
	    + e6b.num(params.gs, 'kt GS.'),
        "Winds are from "
	    + params.wind_dir
	    + "° @ "
	    + params.wind_speed
	    + " kt."
    ];
};


/**
 * Wind problem: calculate (crabbed) heading.
 */
e6b.problems.wind.heading = function () {
    var params = e6b.gen_wind_params();
    return [
        "Calculate heading: desired course "
	    + params.track
	    + "°, airspeed "
	    + e6b.num(params.tas, 'kt TAS')
	    + ", winds "
	    + params.wind_dir
	    + "@"
	    + e6b.num(params.wind_speed, 'kt.'),
        "Required heading is "
	    + params.heading
	    + "°."
    ];
};


/**
 * Wind problem: calculate groundspeed.
 */
e6b.problems.wind.groundspeed = function () {
    var params = e6b.gen_wind_params();
    return [
        "Calculate groundspeed: desired course "
	    + params.track
	    + "°, airspeed "
	    + params.tas
	    + " kt TAS, winds "
	    + params.wind_dir
	    + "@"
	    + e6b.num(params.wind_speed, 'kt'),
        "Groundspeed is "
	    + e6b.num(params.gs, 'kt')
    ];
};


/**
 * Wind problem: calculate headwind or tailwind.
 */
e6b.problems.wind.headwind = function () {
    var params = e6b.gen_wind_params();
    return [
        "Calculate headwind/tailwind: desired course " + params.track + "°, airspeed " + params.tas + " kt TAS, winds " + params.wind_dir + "@" + params.wind_speed + " kt.",
        "There is a " + Math.abs(params.headwind) + (params.headwind < 0 ? " kt tailwind component." : " kt headwind component.")
    ];
};


/**
 * Wind problem: calculate crosswind.
 */
e6b.problems.wind.crosswind = function () {
    var params = e6b.gen_wind_params();
    return [
        "Calculate crosswind: track " + params.track + "°, airspeed " + params.tas + " kt TAS, winds " + params.wind_dir + "@" + params.wind_speed + " kt.",
        "The crosswind is " + Math.abs(params.crosswind) + " kt from the " + (params.crosswind < 0 ? "left." : "right.")
    ];
};




////////////////////////////////////////////////////////////////////////
// Problems for the calculator side.
////////////////////////////////////////////////////////////////////////


/**
 * Generate random parameters for a distance/speed/time problem.
 */
e6b.gen_dst_params = function () {
    var params = {};
    params.speed = e6b.rand(60, 300);
    params.time = e6b.rand(5, 180);
    params.dist = Math.round(params.speed / 60.0 * params.time);
    params.time = e6b.time(params.time);
    return params;
};


/**
 * Calculator problem: speed from distance and time
 */
e6b.problems.calc.speed = function () {
    var params = e6b.gen_dst_params();
    return [
        "Calculate groundspeed after flying "
            + e6b.num(params.dist, "nautical miles")
            + " in "
            + params.time
            + "?",
        e6b.num(params.speed, "knots groundspeed")
    ];
};


/**
 * Calculator problem: time from speed and distance
 */
e6b.problems.calc.time = function () {
    var params = e6b.gen_dst_params();
    return [
        "Calculate time to fly "
            + e6b.num(params.dist, "nautical miles")
            + " at "
            + e6b.num(params.speed, "knots")
            + ".",
        params.time
    ];
};


/**
 * Calculator problem: distance from speed and time
 */
e6b.problems.calc.dist = function () {
    var params = e6b.gen_dst_params();
    return [
        "Calculate distance traveled in "
            + params.time
            + " at "
            + e6b.num(params.speed, "knots")
            + ".",
        e6b.num(params.dist, "nautical miles")
    ];
};


/**
 * Generate random parameters for a burn/endurance/fuel problem.
 */
e6b.gen_bef_params = function () {
    var params = {};
    params.burn = e6b.rand(50, 300) / 10.0; // one decimal place
    params.endurance = e6b.rand(5, 180);
    params.fuel = Math.round(params.burn / 6.0 * params.endurance) / 10.0;
    params.endurance = e6b.time(params.endurance);
    return params;
};


/**
 * Calculator problem: fuel burn from fuel and endurance.
 */
e6b.problems.calc.burn = function () {
    params = e6b.gen_bef_params();
    return [
        "What is your fuel burn if you use " + params.fuel + " gallons in " + params.endurance + "?",
        "" + params.burn + " gallons per hour"
    ];
};


/**
 * Calculator problem: fuel from fuel burn and endurance.
 */
e6b.problems.calc.fuel = function () {
    params = e6b.gen_bef_params();
    return [
        "Calculate fuel used in "
            + params.endurance
            + " at "
            + e6b.num(params.burn, 'gallons/hour')
            + ".",
        e6b.num(params.fuel, 'gallons')
    ];
};


/**
 * Calculator problem: endurance from fuel and fuel burn.
 */
e6b.problems.calc.burn = function () {
    var params = e6b.gen_bef_params();
    return [
        "Calculate your endurance with "
            + e6b.num(params.fuel, 'gallons')
            + " burning "
            + e6b.num(params.burn, "gallons per hour")
            + ".",
        params.endurance
    ];
};


/**
 * Generate random parameters for a density-altitude problem.
 */
e6b.gen_density_alt = function () {
    // FIXME - not the real formulas
    var params = {};
    var oat_offset = e6b.rand(20, -20);
    params.palt = e6b.rand(1, 18) * 1000;
    params.oat = 15 - (params.palt * 1.98 / 1000) + oat_offset;
    params.dalt = e6b.density_altitude(params.palt, params.oat);
    params.cas = e6b.rand(70, 250);
    params.tas = Math.round(params.cas + (params.cas * (0.02 * (params.dalt / 1000))));
    params.oat = Math.round(params.oat);
    return params;
};


/**
 * Calculator problem: density altitude from pressure altitude and OAT.
 */
e6b.problems.calc.density_alt = function () {
    var params = e6b.gen_density_alt();
    return [
        "Calculate density altitude for "
	    + e6b.num(params.palt, 'feet pressure altitude')
	    + " and "
	    + e6b.num(params.oat)
	    + "°C outside air temperature.",
        e6b.num(Math.round(params.dalt/100)*100, "feet density altitude")
    ];
};


/**
 * Calculator problem: TAS from CAS, pressure altitude, and OAT
 */
e6b.problems.calc.true_airspeed = function () {
    var params = e6b.gen_density_alt();
    return [
        "Calculate true airspeed for "
            + e6b.num(params.cas, 'knots')
            + " calibrated airspeed, "
            + e6b.num(params.palt, 'feet')
            + " pressure altitude, "
            + e6b.num(params.oat)
            + "°C outside air temperature.",
        e6b.num(params.tas, 'knots true airspeed')
    ];
};


/**
 * Calculator problem: true altitude
 */
e6b.problems.calc.true_altitude = function () {
    // nearest 100
    var station_elev = e6b.rand(0, 50) * 100;
    // nearest 1000
    var pressure_alt = Math.round(station_elev / 1000) * 1000 + e6b.rand(0, 15) * 1000;
    // ISA temperature
    var isa_temp = Math.round(15 - (pressure_alt / 1000 * 1.98));
    // randomised delta temperature
    var delta_temp = e6b.rand(-20, 20);
    // actual temperature
    var oat = isa_temp + delta_temp;
    // true altitude
    var true_alt = Math.round(pressure_alt + ((pressure_alt - station_elev) / 1000 * delta_temp * 4));
    return [
	"Calculate true altitude for station elevation "
            + e6b.num(station_elev, 'feet MSL')
            + ", "
            + e6b.num(pressure_alt, 'feet pressure altitude')
            + ", "
            + e6b.num(oat)
            + "°C outside air temperature.",
	e6b.num(true_alt, 'feet true altitude')
    ];
};

 
/**
 * Generate random parameters for a volume problem.
 */
e6b.gen_vol_params = function () {
    var params = {};
    params.gallons = e6b.rand(30, 1500) / 10.0; // one decimal place
    params.litres = Math.round(params.gallons * 3.78541);
    return params;
};


/**
 * Calculator problem: convert gallons to litres.
 */
e6b.problems.calc.litres = function () {
    var params = e6b.gen_vol_params();
    return [
        "Convert "
            + e6b.num(params.gallons, 'gallons')
            + " to litres.",
        e6b.num(params.litres, 'litres')
    ];
};


/**
 * Calculator problem: convert litres to gallons.
 */
e6b.problems.calc.gallons = function () {
    var params = e6b.gen_vol_params();
    return [
        "Convert " + params.litres + " litres to gallons.",
        "" + params.gallons + " US gallons"
    ];
};


/**
 * Generate random parameters for a distance problem.
 */
e6b.gen_dist_params = function () {
    var params = {};
    params.nm = e6b.rand(10, 300);
    params.sm = Math.round(params.nm * 1.15078);
    params.km = Math.round(params.nm * 1.852);
    return params;
};


/**
 * Calculator problem: convert statue miles or kilometers to nautical miles
 */
e6b.problems.calc.nm = function () {
    var params = e6b.gen_dist_params();
    switch (e6b.rand(0, 2)) {
    case 0:
        return [
            "Convert " + params.sm + " statute miles to nautical miles.",
            "" + params.nm + " nautical miles"
        ];
    default:
        return [
            "Convert " + params.km + " kilometers to nautical miles.",
            "" + params.nm + " nautical miles"
        ];
    };
};


/**
 * Calculator problem: convert nautical miles or kilometers to statute miles
 */
e6b.problems.calc.sm = function () {
    var params = e6b.gen_dist_params();
    switch (e6b.rand(0, 2)) {
    case 0:
        return [
            "Convert " + params.nm + " nautical miles to statute miles.",
            "" + params.sm + " statute miles"
        ];
    default:
        return [
            "Convert " + params.km + " kilometers to statute miles.",
            "" + params.sm + " statute miles"
        ];
    };
};


/**
 * Calculator problem: convert nautical miles or kilometers to statute miles
 */
e6b.problems.calc.km = function () {
    var params = e6b.gen_dist_params();
    switch (e6b.rand(0, 2)) {
    case 0:
        return [
            "Convert " + params.nm + " nautical miles to kilometers.",
            "" + params.km + " kilometers"
        ];
    default:
        return [
            "Convert " + params.sm + " statute miles to kilometers.",
            "" + params.km + " kilometers"
        ];
    };
};


/**
 * Calculator problem: fuel weight
 */
e6b.problems.calc.fuelweight = function () {
    var gallons = e6b.rand(5, 150);
    var lb = Math.round(gallons * 6.01);
    switch (e6b.rand(0, 2)) {
    case 0:
        return [
            "Calculate weight in pounds of "
                + e6b.num(gallons, 'gallons')
                + " of avgas at ISA sea level.",
            e6b.num(lb, 'pounds')
        ];
    default:
        return [
            "Calculate volume in gallons of "
                + e6b.num(lb, 'pounds')
                + " of avgas at ISA sea level.",
            e6b.num(gallons, "gallons")
        ];
    }
};


/**
 * Calculator problem: weight
 */
e6b.problems.calc.weight = function () {
    var lb = e6b.rand(10, 300);
    var kg = Math.round(lb / 2.205);
    switch (e6b.rand(0, 2)) {
    case 0:
        return [
            "Convert " + lb + " pounds to kilograms.",
            "" + kg + " kilograms"
        ];
    default:
        return [
            "Convert " + kg + " kilograms to pounds.",
            "" + lb + " pounds"
        ];
    }
};


/**
 * Calculator problem: length
 */
e6b.problems.calc.length = function () {
    var feet = e6b.rand(1, 80) * 100;
    var metres = Math.round(feet / 3.281);
    switch (e6b.rand(0, 2)) {
    case 0:
        return [
            "Convert "
                + e6b.num(feet, 'feet')
                + " to metres.",
            e6b.num(metres, 'metres')
        ];
    default:
        return [
            "Convert "
                + e6b.num(metres, 'metres')
                + " to feet.",
            e6b.num(feet, 'feet')
        ];
    }
};


/**
 * Calculator problem: temperature
 */
e6b.problems.calc.temperature = function () {
    var celsius = e6b.rand(-40, 40);
    var fahrenheit = Math.round(celsius * (9.0 / 5) + 32);
    switch (e6b.rand(0, 2)) {
    case 0:
        return [
            "Convert " + celsius + "° celsius to fahrenheit.",
            "" + fahrenheit + "° fahrenheit"
        ];
    default:
        return [
            "Convert " + fahrenheit + "° fahrenheit to celsius.",
            "" + celsius + "° celsius"
        ];
    }
};



////////////////////////////////////////////////////////////////////////
// Utility functions.
////////////////////////////////////////////////////////////////////////


/**
 * Generate a random number between min and max-1
 */
e6b.rand = function(min, max) {
    return Math.floor(Math.random() * (max - min) + min)
};


/**
 * Choose a random item from an object/dict
 */
e6b.rand_item = function (obj) {
    var keys = Object.keys(obj);
    return obj[keys[keys.length * Math.random() << 0]];
};


/**
 * Format a number in the current locale string, and optionally add units.
 */
e6b.num = function (n, unit) {
    var s = n.toLocaleString();
    if (unit) {
	s += "\xa0" + unit;
    }
    return s;
};


/**
 * Display minutes as HH:MM
 */
e6b.time = function(minutes) {
    var h = Math.floor(minutes / 60);
    var m = minutes % 60;
    if (m < 10) {
        m = '0' + m;
    }
    return h + ":" + m;
};



////////////////////////////////////////////////////////////////////////
// Top-level logic
////////////////////////////////////////////////////////////////////////


/**
 * Ask the next question.
 */
e6b.show_problem = function () {
    if (e6b.type == 'wind') {
        var qfun = e6b.rand_item(e6b.problems.wind);
    } else {
        var qfun = e6b.rand_item(e6b.problems.calc);
    }
    var info = qfun();
    e6b.nodes.answer.hidden = true;
    e6b.nodes.question.textContent = info[0];
    e6b.nodes.answer.textContent = info[1];
};


/**
 * React to an input event (click, tap, key)
 */
e6b.input = function () {
    if (e6b.nodes.answer.hidden) {
        e6b.nodes.answer.hidden = false;
    } else {
        e6b.show_problem();
    }
};


/**
 * Calculate density altitude from pressure altitude and temperature.
 */
e6b.density_altitude = function (pressure_altitude, temperature) {
    // FIXME - rough approximations - results are a bit too high
    var isa_temperature = 15 - (pressure_altitude / 1000 * 1.98); // difference from ISO temperature
    var offset = (temperature - isa_temperature) * 118.8;
    return Math.round(pressure_altitude + offset);
};




////////////////////////////////////////////////////////////////////////
// Hook to run the exercises
////////////////////////////////////////////////////////////////////////

window.addEventListener('load', function () {

    // Add listeners for user input
    window.addEventListener('click', e6b.input);
    window.addEventListener('keypress', e6b.input);

    // Save points to the question / answer nodes
    e6b.nodes.question = document.getElementById("question");
    e6b.nodes.answer = document.getElementById("answer");

    // Show the first problem
    e6b.show_problem();
});

// end
