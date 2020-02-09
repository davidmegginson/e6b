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
 * Basic trig to calculate a headwind
 */
e6b.get_headwind = function (course, wind_dir, wind_speed) {
    // use the cosine of the angle between the course and the wind
    var cos = Math.cos((wind_dir - course) * (Math.PI / 180.0));
    return Math.round(wind_speed * cos);
};


/**
 * Basic trig to calculate a crosswind.
 */
e6b.get_crosswind = function (course, wind_dir, wind_speed) {
    // use the sine of the angle between the course and the wind
    var sin = Math.sin((wind_dir - course) * (Math.PI / 180.0));
    return Math.round(wind_speed * sin);
};


/**
 * Calculate effective speed when in a crab.
 * FIXME: needs testing
 */
e6b.get_effective_speed = function (true_airspeed, crosswind) {
    // Use Pythagoras to compute the cosine
    var cos = true_airspeed / Math.sqrt(true_airspeed * true_airspeed + crosswind * crosswind);
    return Math.round(true_airspeed * cos);
};


/**
 * Calculate the wind-correction angle
 * FIXME: needs testing
 */
e6b.get_wind_correction_angle = function (true_airspeed, crosswind) {
    var cos = true_airspeed / Math.sqrt(true_airspeed * true_airspeed + crosswind * crosswind);
    var dir = crosswind < 0 ? -1 : 1; // -1 for left, 1 for right
    return Math.round(Math.acos(cos) *(180 / Math.PI)) * dir;
};


/**
 * Generate random parameters for a wind problem.
 */
e6b.gen_wind_params = function () {
    var params = {};

    // Randomly-generated values
    params.course = e6b.rand(0, 360);
    params.true_airspeed = e6b.rand(60, 250);
    params.wind_dir = e6b.rand(0, 36) * 10;
    params.wind_speed = e6b.rand(5, 40);

    // Derived values
    params.headwind = e6b.get_headwind(params.course, params.wind_dir, params.wind_speed);
    params.crosswind = e6b.get_crosswind(params.course, params.wind_dir, params.wind_speed);
    params.groundspeed = e6b.get_effective_speed(params.true_airspeed, params.crosswind) - params.headwind;
    params.wind_correction_angle = e6b.get_wind_correction_angle(params.true_airspeed, params.crosswind);
    params.heading = (params.course + params.wind_correction_angle) % 360;

    return params;
};


/**
 * Wind problem: calculate the actual winds.
 */
e6b.problems.wind.actual_wind = function () {
    var params = e6b.gen_wind_params();
    return [
        "Calculate actual wind: "
            + e6b.num(params.true_airspeed, 'knot')
	    + " true airspeed,  course "
	    + params.course
	    + "°, heading "
	    + params.heading
	    + "°, "
	    + e6b.num(params.groundspeed, 'knot')
            + ' groundspeed.',
	"Wind from "
            + e6b.num(params.wind_dir)
	    + "°\xa0@\xa0"
	    + e6b.num(params.wind_speed, 'knot')
    ];
};


/**
 * Wind problem: calculate heading corrected for wind.
 */
e6b.problems.wind.heading = function () {
    var params = e6b.gen_wind_params();
    return [
        "Calculate heading: "
	    + e6b.num(params.true_airspeed, 'knot')
	    + " true airspeed, course "
	    + params.course
	    + "°, wind from "
	    + params.wind_dir
	    + "°\xa0@\xa0"
	    + e6b.num(params.wind_speed, 'knot')
            + ".",
        "Fly heading "
            +e6b.num(params.heading)
	    + "°"
    ];
};


/**
 * Wind problem: calculate groundspeed.
 */
e6b.problems.wind.groundspeed = function () {
    var params = e6b.gen_wind_params();
    return [
        "Calculate groundspeed: "
	    + e6b.num(params.true_airspeed, 'knot')
	    + " true airspeed, course "
	    + e6b.num(params.course)
	    + "°, wind from "
	    + e6b.num(params.wind_dir)
	    + "°\xa0@\xa0"
	    + e6b.num(params.wind_speed, 'knot')
            + ".",
        e6b.num(params.groundspeed, 'knot')
            + ' groundspeed'
    ];
};


/**
 * Wind problem: calculate headwind or tailwind.
 */
e6b.problems.wind.headwind = function () {
    var params = e6b.gen_wind_params();
    var dir = (params.headwind < 0 ? ' tailwind' : ' headwind');
    return [
        "Calculate headwind or tailwind: course "
            + params.course +
            "°, wind from "
            + params.wind_dir
            + "°\xa0@\xa0"
            + e6b.num(params.wind_speed, 'knot')
            + ".",
        e6b.num(Math.abs(params.headwind), 'knot', 'knot') // use "knot" for singular and plural before headwind/tailwind
            + dir
    ];
};


/**
 * Wind problem: calculate wind-correction angle.
 */
e6b.problems.wind.wind_correction_angle = function () {
    var params = e6b.gen_wind_params();
    var dir = params.crosswind < 0 ? '° to the left' : '° to the right';
    return [
        "Calculate wind-correction angle: "
            + e6b.num(params.true_airspeed, "knot")
            + " true airspeed, course "
            + params.course
            + "°, wind from "
            + params.wind_dir
            + "°\xa0@\xa0"
            + e6b.num(params.wind_speed, 'knot')
            + ".",
        (params.wind_correction_angle == 0 ?
         "No wind correction required" :
         "Adjust heading "
           + e6b.num(Math.abs(params.wind_correction_angle))
           + dir)
    ];
};


/**
 * Calculate the runway crosswind for landing.
 */
e6b.problems.wind.runway_crosswind = function () {
    var runway = e6b.rand(0, 36) + 1;
    var wind_dir = ((runway * 10) + e6b.rand(-90, 90)) % 360;
    var wind_speed = e6b.rand(15, 25);
    var crosswind = e6b.get_crosswind(runway * 10, wind_dir, wind_speed);
    var dir = crosswind < 0 ? " from the left" : " from the right";
    return [
        "Calculate crosswind: landing on runway "
            + runway
            + " with surface wind from "
            + wind_dir
            + "°\xa0@\xa0"
            + e6b.num(wind_speed, 'knot')
            + ".",
        crosswind == 0 ? "No crosswind"
            : "Crosswind "
            + e6b.num(Math.abs(crosswind), 'knot')
            + dir
    ]
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
    return params;
};


/**
 * Calculator problem: speed from distance and time
 */
e6b.problems.calc.speed = function () {
    var params = e6b.gen_dst_params();
    return [
        "Calculate groundspeed after flying "
            + e6b.num(params.dist, "nautical\xa0mile")
            + " in "
            + e6b.hours(params.time)
            + ".",
        e6b.num(params.speed, "knot")
            + " groundspeed"
    ];
};


/**
 * Calculator problem: time from speed and distance
 */
e6b.problems.calc.time = function () {
    var params = e6b.gen_dst_params();
    return [
        "Calculate time to fly "
            + e6b.num(params.dist, "nautical\xa0mile")
            + " at "
            + e6b.num(params.speed, "knot")
            + ".",
        e6b.hours(params.time)
    ];
};


/**
 * Calculator problem: distance from speed and time
 */
e6b.problems.calc.dist = function () {
    var params = e6b.gen_dst_params();
    return [
        "Calculate distance traveled in "
            + e6b.hours(params.time)
            + " at "
            + e6b.num(params.speed, "knot")
            + ".",
        e6b.num(params.dist, "nautical\xa0mile")
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
    return params;
};


/**
 * Calculator problem: fuel burn from fuel and endurance.
 */
e6b.problems.calc.burn = function () {
    params = e6b.gen_bef_params();
    return [
        "Calculate fuel consumption gallons/hour after using "
            + e6b.num(params.fuel, 'gallon')
            + " in "
            + e6b.hours(params.endurance)
            + ".",
        e6b.num(params.burn, "gallon")
            + " / hour"
    ];
};


/**
 * Calculator problem: fuel from fuel burn and endurance.
 */
e6b.problems.calc.fuel = function () {
    params = e6b.gen_bef_params();
    return [
        "Calculate fuel used in "
            + e6b.hours(params.endurance)
            + ", consuming "
            + e6b.num(params.burn, 'gallon')
            + " / hour.",
        e6b.num(params.fuel, 'gallon')
    ];
};


/**
 * Calculator problem: endurance from fuel and fuel burn.
 */
e6b.problems.calc.burn = function () {
    var params = e6b.gen_bef_params();
    return [
        "Calculate your endurance with "
            + e6b.num(params.fuel, 'gallon')
            + ", consuming "
            + e6b.num(params.burn, "gallon")
            + " / hour.",
        e6b.hours(params.endurance)
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
    params.true_airspeed = Math.round(e6b.true_airspeed(params.cas, params.dalt));
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
	    + e6b.num(params.palt, 'foot', 'feet')
	    + " pressure altitude and "
	    + e6b.num(params.oat)
	    + "°C outside air temperature.",
        e6b.num(Math.round(params.dalt/100)*100, 'foot', 'feet')
            + " density altitude"
    ];
};


/**
 * Calculator problem: TAS from CAS, pressure altitude, and OAT
 */
e6b.problems.calc.true_airspeed = function () {
    var params = e6b.gen_density_alt();
    return [
        "Calculate true airspeed for "
            + e6b.num(params.cas, 'knot')
            + " calibrated airspeed, "
            + e6b.num(params.palt, 'foot', 'feet')
            + " pressure altitude, "
            + e6b.num(params.oat)
            + "°C outside air temperature.",
        e6b.num(params.true_airspeed, 'knot')
            + ' true airspeed'
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
            + e6b.num(station_elev, 'foot', 'feet')
            + " MSL, "
            + e6b.num(pressure_alt, 'foot', 'feet')
            + " pressure altitude, "
            + e6b.num(oat)
            + "°C outside air temperature.",
	e6b.num(true_alt, 'foot', 'feet')
            + ' true altitude'
    ];
};


/**
 * Calculator problem: rate of climb
 */
e6b.problems.calc.vertical_speed = function () {
    var fpm = e6b.rand(300, 1200);
    var gs = e6b.rand(50, 150);
    var fpnm = Math.round(fpm * 60 / gs);
    switch (e6b.rand(0, 2)) {
    case 0:
        return [
            "Calculate feet / nautical mile: ground speed "
                + e6b.num(gs, "knot")
                + ", vertical speed "
                + e6b.num(fpm, "foot", "feet")
                + " / minute.",
            e6b.num(fpnm, "foot", "feet")
                + " / nautical mile"
        ];
    default:
        return [
            "Calculate feet / minute: ground speed "
                + e6b.num(gs, "knot")
                + ", gradiant "
                + e6b.num(fpnm, "foot", "feet")
                + " / nautical mile.",
            e6b.num(fpm, "foot", "feet")
                + " / minute"
        ];
    }
};


/**
 * Conversions (all one function, so they don't come up too often)
 */
e6b.problems.calc.units = function () {
    var functions = [
        e6b.units_convert_volume,
        e6b.units_convert_long_distance,
        e6b.units_convert_fuel_weight,
        e6b.units_convert_weight,
        e6b.units_convert_short_length,
        e6b.units_convert_temperature,
        e6b.units_multiplication,
        e6b.units_division
    ];
    return functions[functions.length * Math.random() << 0]();
};

 
/**
 * Volume-conversion problems
 */
e6b.units_convert_volume = function () {
    var gallons = e6b.rand(30, 1500) / 10.0; // one decimal place
    var litres = Math.round(gallons * 3.78541);
    switch (e6b.rand(0, 2)) {
    case 0:
        return [
            "Convert "
                + e6b.num(gallons, 'gallon')
                + " to litres.",
            e6b.num(litres, 'litre')
        ];
    default:
        return [
            "Convert "
                + e6b.num(litres, 'litre')
                + " to gallons.",
            e6b.num(gallons, "US\xa0gallon")
        ];
    }
};


/**
 * Long-distance conversion problems.
 */
e6b.units_convert_long_distance = function () {
    var distance_nm = e6b.rand(10, 300);
    var values = [distance_nm, Math.round(distance_nm * 1.15078), Math.round(distance_nm * 1.852)];
    var units = ["nautical\xa0mile", "statute\xa0mile", "kilometer"];
    var i = e6b.rand(0, 3);
    do {
        var j = e6b.rand(0, 3);
    } while (i == j);
    return [
        "Convert "
            + e6b.num(values[i], units[i])
            + " to "
            + e6b.plural(2, units[j])
            + ".",
        e6b.num(values[j], units[j])
    ];
};


/**
 * Calculator problem: fuel weight
 */
e6b.units_convert_fuel_weight = function () {
    var gallons = e6b.rand(5, 150);
    var lb = Math.round(gallons * 6.01);
    switch (e6b.rand(0, 2)) {
    case 0:
        return [
            "Calculate weight in pounds for "
                + e6b.num(gallons, 'gallon')
                + " of avgas at ISA sea level.",
            e6b.num(lb, 'pound')
        ];
    default:
        return [
            "Calculate volume in gallons for "
                + e6b.num(lb, 'pound')
                + " of avgas at ISA sea level.",
            e6b.num(gallons, "gallon")
        ];
    }
};


/**
 * Calculator problem: weight
 */
e6b.units_convert_weight = function () {
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
e6b.units_convert_short_length = function () {
    var feet = e6b.rand(1, 80) * 100;
    var metres = Math.round(feet / 3.281);
    switch (e6b.rand(0, 2)) {
    case 0:
        return [
            "Convert "
                + e6b.num(feet, 'foot', 'feet')
                + " to metres.",
            e6b.num(metres, 'metre')
        ];
    default:
        return [
            "Convert "
                + e6b.num(metres, 'metre')
                + " to feet.",
            e6b.num(feet, 'foot', 'feet')
        ];
    }
};


/**
 * Calculator problem: temperature
 */
e6b.units_convert_temperature = function () {
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


/**
 * Calculator problem: multiplication.
 */
e6b.units_multiplication = function () {
    var n1 = e6b.rand(3, 9);
    var n2 = e6b.rand(3, 99);
    return [
        "Multiply "
            + e6b.num(n1)
            + '  by '
            + e6b.num(n2)
            + '.',
        e6b.num(n1 * n2)
    ];
};


/**
 * Calculator problem: division.
 */
e6b.units_division = function () {
    var n1 = e6b.rand(3, 9);
    var n2 = e6b.rand(3, 99);
    return [
        "Divide "
            + e6b.num(n1 * n2)
            + '  by '
            + e6b.num(n1)
            + '.',
        e6b.num(n2)
    ];
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
 * Pluralise units if necessary.
 */
e6b.plural = function (n, singular, plural) {
    if (!plural) {
        plural = singular + "s";
    }
    return (n == 1 ? singular : plural);
};


/**
 * Format a number in the current locale string, and optionally add units.
 */
e6b.num = function (n, unit, unit_plural) {
    var s = n.toLocaleString();
    if (unit) {
        return s + "\xa0" + e6b.plural(n, unit, unit_plural);
    } else {
        return s;
    }
};


/**
 * Display minutes as HH:MM
 */
e6b.hours = function(minutes) {
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
e6b.input = function (event) {
    if (e6b.nodes.answer.hidden) {
        e6b.nodes.answer.hidden = false;
    } else {
        e6b.show_problem();
    }
    event.stopPropagation();
    return false;
};


/**
 * Calculate density altitude from pressure altitude and temperature.
 * Reverse engineered from the E6B
 */
e6b.density_altitude = function (pressure_altitude, temperature) {
    var isa_temperature = 15 - (pressure_altitude / 1000 * 1.98); // difference from ISO temperature
    var offset = (temperature - isa_temperature) * 118.8;
    return Math.round(pressure_altitude + offset);
};


/**
 * Calculate true airspeed from calibrated airspeed and density altitude.
 * Reverse engineered from the E6B
 */
e6b.true_airspeed = function (calibrated_airspeed, density_altitude) {
    var factor = 1 + ((density_altitude / 1000) * (0.012 + (density_altitude / 1000) * 0.0004)); // WRONG, but close
    return calibrated_airspeed * factor;
};



////////////////////////////////////////////////////////////////////////
// Hook to run the exercises
////////////////////////////////////////////////////////////////////////

window.addEventListener('load', function () {

    // Add listeners for user input
    window.addEventListener('click', e6b.input);
    // window.addEventListener('touchend', e6b.input);
    window.addEventListener('keypress', e6b.input);

    // Save points to the question / answer nodes
    e6b.nodes.question = document.getElementById("question");
    e6b.nodes.answer = document.getElementById("answer");

    // Show the first problem
    e6b.show_problem();
});

// end
