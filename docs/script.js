////////////////////////////////////////////////////////////////////////
// Script to generate E6B problems dynamically.
////////////////////////////////////////////////////////////////////////


/**
 * Top-level object (for encapsulation)
 */
var e6b = {
    problems: {
        calc: {
            basic: {},
            advanced: {}
        },
        wind: {
            basic: {},
            advanced: {}
        },
	disabled: {}
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
    params.heading = (params.course + params.wind_correction_angle + 360) % 360;

    return params;
};


/**
 * Wind problem: calculate heading corrected for wind.
 */
e6b.problems.wind.basic.heading = function () {
    var params = e6b.gen_wind_params();
    return [
        e6b.fmt("Heading: {{n}} kt true airspeed, course {{n}}°, wind from {{n}}° @ {{n}} kt",
                params.true_airspeed, params.course, params.wind_dir, params.wind_speed),
        e6b.fmt("Fly heading {{n}}°", params.heading)
    ];
};


/**
 * Wind problem: calculate groundspeed.
 */
e6b.problems.wind.basic.groundspeed = function () {
    var params = e6b.gen_wind_params();
    return [
        e6b.fmt("Groundspeed (kt): {{n}} kt true airspeed, course {{n}}°, wind from {{n}}° @ {{n}} kt",
                params.true_airspeed, params.course, params.wind_dir, params.wind_speed),
        e6b.fmt("{{n}} kt groundspeed", params.groundspeed)
    ];
};


/**
 * Wind problem: calculate headwind or tailwind.
 */
e6b.problems.wind.basic.headwind = function () {
    var params = e6b.gen_wind_params();
    return [
        e6b.fmt("Headwind/tailwind (kt): course {{n}}°, wind from {{n}}° @ {{n}} kt",
                params.course, params.wind_dir, params.wind_speed),
        (params.headwind == 0 ? "No headwind"
         : e6b.fmt("{{n}} kt {{s}}", Math.abs(params.headwind), (params.headwind < 0 ? 'tailwind' : 'headwind')))
    ];
};


/**
 * Wind problem: calculate wind aloft.
 */
e6b.problems.wind.advanced.wind_aloft = function () {
    var params = e6b.gen_wind_params();
    return [
        e6b.fmt("Wind aloft: {{n}} kt true airspeed, course {{n}}°, heading {{n}}°, {{n}} kt groundspeed",
                params.true_airspeed, params.course, params.heading, params.groundspeed),
        e6b.fmt("Wind from {{n}}° @ {{n}} kt", params.wind_dir, params.wind_speed)
    ];
};


/**
 * Wind problem: calculate actual course.
 */
e6b.problems.wind.advanced.course = function () {
    var params = e6b.gen_wind_params();
    return [
        e6b.fmt("Course over the ground: heading {{n}}°, {{n}} kt groundspeed, wind from {{n}}° @ {{n}} kt",
                params.heading, params.groundspeed, params.wind_dir, params.wind_speed),
        e6b.fmt("Course {{n}}°", params.course)
    ];
}


/**
 * Wind problem: calculate true airspeed
 */
e6b.problems.wind.advanced.true_airspeed = function () {
    var params = e6b.gen_wind_params();
    return [
        e6b.fmt("True airspeed (kt): course {{n}}°, {{n}} kt groundspeed, wind from {{n}}° @ {{n}} kt",
                params.course, params.groundspeed, params.wind_dir, params.wind_speed),
        e6b.fmt("{{n}} kt true airspeed", params.true_airspeed)
    ];
};

/**
 * Wind problem: calculate the runway crosswind for landing.
 */
e6b.problems.wind.advanced.runway_crosswind = function () {
    var runway = e6b.rand(0, 36) + 1;
    var wind_dir = ((runway * 10) + e6b.rand(-90, 90) + 360) % 360;
    var wind_speed = e6b.rand(15, 25);
    var crosswind = e6b.get_crosswind(runway * 10, wind_dir, wind_speed);
    return [
        e6b.fmt("Crosswind: Runway {{n}}, wind from {{n}}° @ {{n}} kt", runway, wind_dir, wind_speed),
        (crosswind == 0 ? "No crosswind"
         : e6b.fmt("{{n}} kt crosswind from the {{s}}", crosswind, (crosswind < 0 ? "left" : "right")))
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
    return params;
};


/**
 * Calculator problem: speed from distance and time
 */
e6b.problems.calc.basic.speed = function () {
    var params = e6b.gen_dst_params();
    return [
        e6b.fmt("Groundspeed: travelled {{n}} kt in {{t}}", params.dist, params.time),
        e6b.fmt("{{n}} kt groundspeed", params.speed)
    ];
};


/**
 * Calculator problem: time from speed and distance
 */
e6b.problems.calc.basic.ete = function () {
    var params = e6b.gen_dst_params();
    return [
        e6b.fmt("Time enroute: {{n}} nm at {{n}} kt", params.dist, params.speed),
        e6b.fmt("{{t}} ETE", params.time)
    ];
};


/**
 * Calculator problem: distance from speed and time
 */
e6b.problems.calc.basic.dist = function () {
    var params = e6b.gen_dst_params();
    return [
        e6b.fmt("Distance travelled: flying for {{t}} at {{n}} kt", params.time, params.speed),
        e6b.fmt("{{n}} kt travelled", params.dist)
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
e6b.problems.calc.basic.burn = function () {
    params = e6b.gen_bef_params();
    return [
        e6b.fmt("Fuel-consumption rate (gph): used {{n}} gal in {{t}}", params.fuel, params.endurance),
        e6b.fmt("{{n}} gph", params.burn)
    ];
};


/**
 * Calculator problem: fuel from fuel burn and endurance.
 */
e6b.problems.calc.basic.fuel = function () {
    params = e6b.gen_bef_params();
    return [
        e6b.fmt("Fuel required (gal): flying for {{t}}, consuming {{n}} gph", params.endurance, params.burn),
        e6b.fmt("{{n}} gal required", params.fuel)
    ];
};


/**
 * Calculator problem: endurance from fuel and fuel burn.
 */
e6b.problems.calc.basic.endurance = function () {
    var params = e6b.gen_bef_params();
    return [
        e6b.fmt("Endurance: {{n}} gal fuel onboard, consuming {{n}} gph", params.fuel, params.burn),
        e6b.fmt("{{t}} endurance", params.endurance)
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
e6b.problems.calc.advanced.density_alt = function () {
    var params = e6b.gen_density_alt();
    return [
        "Density altitude (nearest 100\xa0ft): "
	    + e6b.num(params.palt, 'ft')
	    + " pressure altitude, "
	    + e6b.num(params.oat, '°C')
	    + " OAT",
        e6b.num(Math.round(params.dalt/100)*100, 'ft')
            + " density altitude"
    ];
};


/**
 * Calculator problem: TAS from CAS, pressure altitude, and OAT
 */
e6b.problems.calc.advanced.true_airspeed = function () {
    var params = e6b.gen_density_alt();
    return [
        e6b.fmt("True airspeed (kt): {{n}} kt calibrated airspeed, {{n}} ft pressure altitude, {{n}}°C outside air temperature",
                params.cas, params.palt, params.oat),
        e6b.fmt("{{n}} kt true airspeed", params.true_airspeed)
    ];
};


/**
 * Calculator problem: true altitude
 */
e6b.problems.calc.advanced.true_altitude = function () {
    // station elevation, 0-5000 ft (500 ft increments)
    var station_elev = e6b.rand(0, 50) * 100;

    // indicated altitude, station alt + 3000-15000 ft (500-foot increments)
    var indicated_alt = (Math.ceil(station_elev / 500) * 500) + (e6b.rand(6, 30) * 500);

    // pressure altitude +/- 0-1000 ft from indicated
    var pressure_alt = indicated_alt + (e6b.rand(-100, 100) * 10);

    // expected ISA temperature at pressure altitude
    var isa_temp = Math.round(15 - (pressure_alt / 1000 * 1.98));

    // randomised delta temperature, -20c to 20c
    var delta_temp = e6b.rand(-20, 20);

    // actual temperature at altitude
    var oat = isa_temp + delta_temp;
    
    // true altitude (rounded to the nearest 100 feet)
    var true_alt = Math.round((indicated_alt + ((indicated_alt - station_elev) / 1000 * delta_temp * 4)) / 100) * 100;

    return [
        e6b.fmt("True altitude: {{n}} ft indicated altitude, {{n}}°C OAT, {{n}} ft pressure altitude, {{n}} ft MSL station elevation",
                indicated_alt, oat, pressure_alt, station_elev),
        e6b.fmt("{{n}} ft true altitude", true_alt)
    ];
};


/**
 * Calculator problem: rate of climb
 */
e6b.problems.calc.advanced.vertical_speed = function () {
    var fpm = e6b.rand(300, 1200);
    var gs = e6b.rand(50, 150);
    var fpnm = Math.round(fpm * 60 / gs);
    switch (e6b.rand(0, 2)) {
    case 0:
        return [
            e6b.fmt("Climb gradiant (ft/nm): {{n}} kt groundspeed, {{n}} fpm climb rate", gs, fpm),
            e6b.fmt("{{n}} ft/nm climb gradiant", fpnm)
        ];
    default:
        return [
            e6b.fmt("Climb rate required (fpm): {{n}} kt groundspeed, {{n}} ft/nm gradiant", gs, fpnm),
            e6b.fmt("{{n}} fpm required", fpm)
        ];
    }
};


/**
 * Calculator problem: off-course
 */
e6b.problems.calc.advanced.off_course = function () {
    var dist_flown = e6b.rand(50, 200);
    var dist_remaining = e6b.rand(50, 200);
    var dist_off_course = e6b.rand(Math.round(dist_flown / 25), Math.round(dist_flown / 10));
    var correction_1 = Math.round((dist_off_course / dist_flown) * 60);
    var correction_2 = Math.round((dist_off_course / dist_remaining) * 60);

    switch (e6b.rand(2)) {
    case 0:
        return [
            "Degrees off course: "
                + e6b.num(dist_off_course, 'nm')
                + " off course after flying "
                + e6b.num(dist_flown, 'nm'),
            e6b.num(correction_1, '°')
                + " off course"
        ];
    default:
        return [
            "Course correction to destination: "
                + e6b.num(dist_off_course, 'nm')
                + " off course after flying "
                + e6b.num(dist_flown, 'nm')
                + ", with "
                + e6b.num(dist_remaining, 'nm')
                + " remaining",
            "Total correction "
                + e6b.num(correction_1 + correction_2, '°')
                + " ("
                + e6b.num(correction_1, '°')
                + " off course and "
                + e6b.num(correction_2, '°')
                + " to recapture)"
        ];
    }
};


/**
 * Conversions (all one function, so they don't come up too often)
 */
e6b.problems.calc.advanced.units = function () {
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
                + e6b.num(gallons, "US\xa0gallon", true)
                + " to litres",
            e6b.num(litres, 'litre', true)
        ];
    default:
        return [
            "Convert "
                + e6b.num(litres, 'litre', true)
                + " to US\xa0gallons",
            e6b.num(gallons, "gallon", true)
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
            + e6b.num(values[i], units[i], true)
            + " to "
            + e6b.plural(2, units[j], true),
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
            "Weight in pounds: "
                + e6b.num(gallons, 'gallon', true)
                + " of avgas at ISA sea level",
            e6b.num(lb, 'pound', true)
        ];
    default:
        return [
            "Volume in US\xa0gallons: "
                + e6b.num(lb, 'pound', true)
                + " of avgas at ISA sea level.",
            e6b.num(gallons, "US\xa0gallon", true)
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
            "Convert " + lb + "\xa0pounds to kilograms.",
            "" + kg + "\xa0kilograms"
        ];
    default:
        return [
            "Convert " + kg + "\xa0kilograms to pounds.",
            "" + lb + "\xa0pounds"
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
            e6b.num(metres, 'metre', true)
        ];
    default:
        return [
            "Convert "
                + e6b.num(metres, 'metre', true)
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
            "Convert " + celsius + "° Celsius to Fahrenheit.",
            "" + fahrenheit + "° Fahrenheit"
        ];
    default:
        return [
            "Convert " + fahrenheit + "° Fahrenheit to Celsius.",
            "" + celsius + "° Celsius"
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
        e6b.num(n1)
            + ' × '
            + e6b.num(n2)
            + " =",
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
        e6b.num(n1 * n2)
            + ' &#xf7; '
            + e6b.num(n1)
            + ' =',
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
 * Format values in a string.
 */
e6b.fmt = function (fmt) {
    var args = Array.from(arguments).slice(1);
    var parts = fmt.split(/{{|}}/);
    var result = '';
    while (parts.length > 0) {
        result += parts.shift();
        if (parts.length > 0 && args.length > 0) {
            var spec = parts.shift();
            var arg = args.shift();
            if (spec == 'n') {
                result += e6b.num(arg);
            } else if (spec == 't') {
                result += e6b.time(arg);
            } else if (spec == 's') {
                result += arg;
            } else {
                alert("Bad format string " + spec);
            }
        }
    }
    return result;
};


/**
 * Pluralise units if necessary.
 * if plural is just true, add an s
 */
e6b.plural = function (n, singular, plural) {
    if (plural === true) {
        plural = singular + "s";
    } else if (!plural) {
        plural = singular;
    }
    return (n == 1 ? singular : plural);
};


/**
 * Format a number in the current locale string, and optionally add units.
 */
e6b.num = function (n, unit, unit_plural) {
    var s = n.toLocaleString();
    if (unit) {
        if (unit == '°') {
            return s + unit;
        } else {
            return s + "\xa0" + e6b.plural(n, unit, unit_plural);
        }
    } else {
        return s;
    }
};


/**
 * Display minutes as HH:MM
 */
e6b.time = function(minutes) {
    if (minutes < 60) {
        return e6b.num(minutes)
            + "\xa0min";
    } else {
        var h = Math.floor(minutes / 60);
        var m = minutes % 60;
        if (m < 10) {
            m = '0' + m;
        }
        return h + ":" + m;
    }
};


/**
 * Display wind direction and speed
 */
e6b.wind = function (direction, speed) {
    return e6b.num(direction)
        + "°\xa0@\xa0"
        + e6b.num(speed)
        + "\xa0kt";
};



////////////////////////////////////////////////////////////////////////
// Top-level logic
////////////////////////////////////////////////////////////////////////


/**
 * Ask the next question.
 */
e6b.show_problem = function () {
    var problems = {};
    if (e6b.type == 'wind') {
        if (location.hash == '#advanced') {
            problems = Object.assign({}, e6b.problems.wind.basic, e6b.problems.wind.advanced);
        } else {
            problems = e6b.problems.wind.basic;
        }
    } else {
        if (location.hash == '#advanced') {
            problems = Object.assign({}, e6b.problems.calc.basic, e6b.problems.calc.advanced);
        } else {
            problems = e6b.problems.calc.basic;
        }
    }
    var info = e6b.rand_item(problems)();
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


e6b.setup_advanced = function () {
    var show_node = document.getElementById('show-advanced');
    var hide_node = document.getElementById('hide-advanced');

    function toggle_visibility () {
        var is_advanced = (location.hash == '#advanced');
        show_node.style.display = (is_advanced ? 'none' : 'block');
        hide_node.style.display = (is_advanced ? 'block' : 'none');
    }

    window.addEventListener('hashchange', toggle_visibility);
    
    toggle_visibility();
};



////////////////////////////////////////////////////////////////////////
// Hook to run the exercises
////////////////////////////////////////////////////////////////////////

window.addEventListener('load', function () {

    // Add listeners for user input
    document.addEventListener('click', e6b.input, { 'passive': false });
    document.addEventListener('keypress', e6b.input, { 'passive': false });

    // Save pointers to specific nodes
    e6b.nodes.question = document.getElementById("question");
    e6b.nodes.answer = document.getElementById("answer");

    // Setup basic/advanced toggle
    e6b.setup_advanced();

    // Show the first problem
    e6b.show_problem();
});

// end
