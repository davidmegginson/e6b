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
    return e6b.approx(wind_speed * cos);
};


/**
 * Basic trig to calculate a crosswind.
 */
e6b.get_crosswind = function (course, wind_dir, wind_speed) {
    // use the sine of the angle between the course and the wind
    var sin = Math.sin((wind_dir - course) * (Math.PI / 180.0));
    return e6b.approx(wind_speed * sin);
};


/**
 * Calculate effective speed when in a crab.
 * FIXME: needs testing
 */
e6b.get_effective_speed = function (true_airspeed, crosswind) {
    // Use Pythagoras to compute the cosine
    var cos = true_airspeed / Math.sqrt(true_airspeed * true_airspeed + crosswind * crosswind);
    return e6b.approx(true_airspeed * cos);
};


/**
 * Calculate the wind-correction angle
 * FIXME: needs testing
 */
e6b.get_wind_correction_angle = function (true_airspeed, crosswind) {
    var cos = true_airspeed / Math.sqrt(true_airspeed * true_airspeed + crosswind * crosswind);
    var dir = crosswind < 0 ? -1 : 1; // -1 for left, 1 for right
    return e6b.approx(Math.acos(cos) *(180 / Math.PI)) * dir;
};


/**
 * Generate random parameters for a wind problem.
 */
e6b.gen_wind_params = function () {
    var params = {};

    // Randomly-generated values
    params.course = e6b.rand(0, 360);
    params.tas = e6b.rand(60, 180);
    params.wdir = e6b.rand(0, 36) * 10;
    params.wspeed = e6b.rand(5, 40);

    // Derived values
    params.headwind = e6b.get_headwind(params.course, params.wdir, params.wspeed);
    params.crosswind = e6b.get_crosswind(params.course, params.wdir, params.wspeed);
    params.espeed = e6b.get_effective_speed(params.tas, params.crosswind);
    params.gs = params.espeed - params.headwind;
    params.wca = e6b.get_wind_correction_angle(params.tas, params.crosswind);
    params.heading = (params.course + params.wca + 360) % 360;

    if (params.headwind < 0) {
        params.headwind_dir = "tailwind";
        params.headwind_op = "Add";
        params.headwind_prep = "to";
    } else {
        params.headwind_dir = "headwind";
        params.headwind_op = "Subtract";
        params.headwind_prep = "from";
    }

    if (params.crosswind < 0) {
        params.crosswind_dir = "left";
        params.crosswind_op = "Subtract";
        params.crosswind_prep = "from";
    } else {
        params.crosswind_dir = "right";
        params.crosswind_op = "Add";
        params.crosswind_prep = "to";
    }

    return params;
};


/**
 * Wind problem: calculate heading corrected for wind.
 */
e6b.problems.wind.basic.heading = function () {
    var params = e6b.gen_wind_params();
    return [
        e6b.fmt("Heading: {{n}} kt true airspeed, course {{n}}°, wind from {{n}}° @ {{n}} kt",
                params.tas, params.course, params.wdir, params.wspeed),
        e6b.fmt("Fly heading {{n}}°", params.heading),
        [
            e6b.fmt("Set the wind direction {{n}}° under the \"true index\" pointer", params.wdir),
            e6b.fmt("Make a pencil mark for the wind speed {{n}} kt straight up from the centre grommet", params.wspeed),
            e6b.fmt("Rotate to set the course {{n}}° next to the \"true index\" pointer", params.course),
            e6b.fmt("Slide the card until the pencil mark is over the true airspeed {{n}} kt", params.tas),
            e6b.fmt("Read the wind-correction angle {{n}}° to the {{s}} under the pencil mark",
                    Math.abs(params.wca), params.crosswind_dir),
            e6b.fmt("{{s}} {{n}} {{s}} the course {{n}}° to get the heading {{n}}°",
                    params.crosswind_op, Math.abs(params.wca), params.crosswind_prep, params.course, params.heading)
        ]
    ];
};


/**
 * Wind problem: calculate groundspeed.
 */
e6b.problems.wind.basic.groundspeed = function () {
    var params = e6b.gen_wind_params();
    return [
        e6b.fmt("Groundspeed (kt): {{n}} kt true airspeed, course {{n}}°, wind from {{n}}° @ {{n}} kt",
                params.tas, params.course, params.wdir, params.wspeed),
        e6b.fmt("{{n}} kt groundspeed", params.gs),
        [
            e6b.fmt("Rotate to set the wind direction {{n}}° under the \"true index\" pointer", params.wdir),
            e6b.fmt("Make a pencil mark for the wind speed {{n}} kt straight up from the centre grommet", params.wspeed),
            e6b.fmt("Rotate to set the course {{n}}° next to the \"true index\" pointer", params.course),
            e6b.fmt("Slide the card until the pencil mark is over the true airspeed {{n}} kt", params.tas),
            e6b.fmt("Read the groundspeed {{n}} kt under the centre grommet", params.gs)
        ]
    ];
};


/**
 * Wind problem: calculate wind aloft.
 */
e6b.problems.wind.advanced.wind_aloft = function () {
    var params = e6b.gen_wind_params();
    return [
        e6b.fmt("Wind aloft: {{n}} kt true airspeed, course {{n}}°, heading {{n}}°, {{n}} kt groundspeed",
                params.tas, params.course, params.heading, params.gs),
        e6b.fmt("Wind from {{n}}° @ {{n}} kt", params.wdir, params.wspeed),
        [
            e6b.fmt("Rotate to set the course {{n}}° under the \"true index\" pointer", params.course),
            e6b.fmt("Slide the card until the centre grommet is over the groundspeed {{n}} kt", params.gs),
            e6b.fmt("Compare the course {{n}}° to the actual heading {{n}}° to get a wind-correction " +
                    "angle of {{n}}° to the {{s}}", params.course, params.heading, Math.abs(params.wca), params.crosswind_dir),
            e6b.fmt("Make a pencil mark where the {{n}}° wind-correction angle on the {{s}} side crosses the " +
                    "{{n}} kt true airspeed line", Math.abs(params.wca), params.crosswind_dir, params.tas),
            "Rotate so that the pencil mark is on the vertical line above the grommet",
            e6b.fmt("The wind direction, {{n}}°, is under the \"true index\" pointer", params.wdir),
            e6b.fmt("The wind speed, {{n}} kt, is the number of knots between the grommet and the pencil mark",
                    params.wspeed)
        ]
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
        e6b.fmt("Groundspeed: travelled {{n}} nm in {{t}}", params.dist, params.time),
        e6b.fmt("{{n}} kt groundspeed", params.speed),
        [
            e6b.fmt("Find the distance {{n}} on the outer scale", params.dist),
            e6b.fmt("Rotate until the time {{n}} ({{t}}) on the inner scale is underneath {{n}}", params.time, params.time, params.dist),
            e6b.fmt("Read the speed {{n}} on the outer scale above the rate pointer (60)", params.speed)
        ]
    ];
};


/**
 * Calculator problem: time from speed and distance
 */
e6b.problems.calc.basic.time = function () {
    var params = e6b.gen_dst_params();
    return [
        e6b.fmt("Time enroute: {{n}} nm at {{n}} kt", params.dist, params.speed),
        e6b.fmt("{{t}} ETE", params.time),
        [
            e6b.fmt("Rotate until the airspeed, {{n}}, appears on the outer scale above the rate pointer (60)", params.speed),
            e6b.fmt("Find the distance {{n}} on the outer scale", params.dist),
            e6b.fmt("Read the time {{n}} ({{t}}) on the inner scale below {{n}}", params.time, params.time, params.dist)
        ]
    ];
};


/**
 * Calculator problem: distance from speed and time
 */
e6b.problems.calc.basic.dist = function () {
    var params = e6b.gen_dst_params();
    return [
        e6b.fmt("Distance travelled: flying for {{t}} at {{n}} kt", params.time, params.speed),
        e6b.fmt("{{n}} kt travelled", params.dist),
        [
            e6b.fmt("Rotate until the speed, {{n}}, appears above the rate pointer (60)", params.speed),
            e6b.fmt("Find the time {{n}} ({{t}}) on the inner scale", params.time, params.time),
            e6b.fmt("Read the distance {{n}} on the outer scale above {{n}}", params.dist, params.time)
        ]
    ];
};


/**
 * Generate random parameters for a burn/endurance/fuel problem.
 */
e6b.gen_bef_params = function () {
    var params = {};
    params.burn = e6b.rand(50, 300) / 10.0; // one decimal place
    params.endurance = e6b.rand(5, 180);
    params.fuel = Math.round((params.burn / 60) * params.endurance);
    return params;
};


/**
 * Calculator problem: fuel burn from fuel and endurance.
 */
e6b.problems.calc.basic.burn = function () {
    params = e6b.gen_bef_params();
    return [
        e6b.fmt("Fuel-consumption rate (gph): used {{n}} gal in {{t}}", params.fuel, params.endurance),
        e6b.fmt("{{n}} gph", params.burn),
        [
            e6b.fmt("Find the fuel used, {{n}}, on the outer scale", params.fuel),
            e6b.fmt("Rotate until the time {{n}} ({{t}}) appears on the inner scale below {{n}}",
                    params.endurance, params.endurance, params.fuel),
            e6b.fmt("Read the fuel consumption {{n}} above the rate pointer (60)", params.burn)
        ]
    ];
};


/**
 * Calculator problem: fuel from fuel burn and endurance.
 */
e6b.problems.calc.basic.fuel = function () {
    params = e6b.gen_bef_params();
    return [
        e6b.fmt("Fuel required (US gallons): flying for {{t}}, consuming {{n}} gph", params.endurance, params.burn),
        e6b.fmt("{{n}} US gallons required", params.fuel),
        [
            e6b.fmt("Rotate until the fuel consumption, {{n}}, appears above the rate pointer (60)", params.burn),
            e6b.fmt("Find the endurance {{n}} ({{t}}) on the inner scale", params.endurance, params.endurance),
            e6b.fmt("Read the fuel needed, {{n}}, on the outer scale above {{n}}", params.fuel, params.endurance)
        ]
    ];
};


/**
 * Calculator problem: endurance from fuel and fuel burn.
 */
e6b.problems.calc.basic.endurance = function () {
    var params = e6b.gen_bef_params();
    return [
        e6b.fmt("Endurance: {{n}} gal fuel onboard, consuming {{n}} gph", params.fuel, params.burn),
        e6b.fmt("{{t}} endurance", params.endurance),
        [
            e6b.fmt("Rotate until the fuel consumption, {{n}}, appears above the rate pointer (60)", params.burn),
            e6b.fmt("Find the fuel available, {{n}}, on the outer scale", params.fuel),
            e6b.fmt("Read the endurance {{n}} ({{t}}) on the inner scale below {{n}}", params.endurance, params.endurance, params.fuel)
        ]
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
    params.tas = e6b.approx(e6b.true_airspeed(params.cas, params.dalt));
    params.oat = e6b.approx(params.oat);
    return params;
};


/**
 * Calculator problem: density altitude from pressure altitude and OAT.
 */
e6b.problems.calc.advanced.density_alt = function () {
    var params = e6b.gen_density_alt();
    return [
        e6b.fmt("Density altitude: {{n}} ft pressure altitude, {{n}}°c outside air temperature",
                params.palt, params.oat),
        e6b.fmt("{{n}} ft density altitude", e6b.approx(params.dalt)),
        [
            e6b.fmt("In the bottom section of the True Airspeed window, line up {{n}} (thousand) pressure altitude with {{n}}°C",
                    params.palt / 1000, params.oat),
            e6b.fmt("In the top section, read {{n}} (thousand) under the Density Altitude pointer",
                    e6b.approx(params.dalt))
        ]
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
        e6b.fmt("{{n}} kt true airspeed", params.tas),
        [
            e6b.fmt("In the True Airspeed window, line up {{n}} (thousand) pressure altitude with {{n}}°C",
                    params.palt / 1000, params.oat),
            e6b.fmt("Find the calibrated airspeed {{n}} on the inner scale of the main circle", params.cas),
            e6b.fmt("Read the true airspeed {{n}} on the outer scale above {{n}}", params.tas, params.cas)
        ]
    ];
};


/**
 * Calculator problem: true altitude
 */
e6b.problems.calc.advanced.true_altitude = function () {
    // FIXME not quite matching E6B
    
    // station elevation, 0-5000 ft (500 ft increments)
    var station_elev = e6b.rand(0, 50) * 100;

    // indicated altitude, station alt + 3000-15000 ft (500-foot increments)
    var indicated_alt = (Math.ceil(station_elev / 500) * 500) + (e6b.rand(6, 30) * 500);

    // pressure altitude +/- 0-1000 ft from indicated
    var pressure_alt = indicated_alt + (e6b.rand(-100, 100) * 10);

    // expected ISA temperature at pressure altitude
    var isa_temp = e6b.approx(15 - (pressure_alt / 1000 * 1.98));

    // randomised delta temperature, -20c to 20c
    var delta_temp = e6b.rand(-20, 20);

    // actual temperature at altitude
    var oat = isa_temp + delta_temp;
    
    // true altitude (rounded to the nearest 100 feet)
    var true_alt = e6b.approx(indicated_alt + ((indicated_alt - station_elev) / 1000 * delta_temp * 4));

    return [
        e6b.fmt("True altitude: {{n}} ft indicated altitude, {{n}}°C OAT, {{n}} ft pressure altitude, {{n}} ft MSL station elevation",
                indicated_alt, oat, pressure_alt, station_elev),
        e6b.fmt("{{n}} ft true altitude", true_alt),
        [
            e6b.fmt("Subtract {{n}} station elevation from {{n}} indicated altitude to get {{n}} (indicated altitude above station)",
                    station_elev, indicated_alt, indicated_alt - station_elev),
            e6b.fmt("In the True Altitude window, line up {{n}} (thousand) pressure altitude with {{n}}°C",
                    e6b.approx(pressure_alt) / 1000, oat),
            e6b.fmt("Find the altitude difference, {{n}}, on the main inner scale", indicated_alt - station_elev),
            e6b.fmt("Read true altitude above station, {{n}}, on the outer scale above {{n}}",
                    true_alt - station_elev, indicated_alt - station_elev),
            e6b.fmt("Add {{n}} to the station elevation {{n}} to get the absolute true altitude, {{n}}",
                    true_alt - station_elev, station_elev, true_alt)
        ]
    ];
};


/**
 * Calculator problem: rate of climb
 */
e6b.problems.calc.advanced.vertical_speed = function () {
    var fpm = e6b.rand(300, 1200);
    var gs = e6b.rand(50, 150);
    var fpnm = e6b.approx(fpm * 60 / gs);
    switch (e6b.rand(0, 2)) {
    case 0:
        return [
            e6b.fmt("Climb gradiant (ft/nm): {{n}} kt groundspeed, {{n}} fpm climb rate", gs, fpm),
            e6b.fmt("{{n}} ft/nm climb gradiant", fpnm),
            [
                e6b.fmt("Rotate until the groundspeed, {{n}}, appears above the rate pointer (60)", gs),
                e6b.fmt("Find the fpm climb rate, {{n}}, on the inner scale", fpm),
                e6b.fmt("Read the ft/nm climb gradiant, {{n}}, on the outer scale above {{n}}", fpnm, fpm)
            ]
        ];
    default:
        return [
            e6b.fmt("Climb rate required (fpm): {{n}} kt groundspeed, {{n}} ft/nm gradiant", gs, fpnm),
            e6b.fmt("{{n}} fpm required", fpm),
            [
                e6b.fmt("Rotate until the groundspeed, {{n}}, appears above the rate pointer (60)", gs),
                e6b.fmt("Find the ft/nm climb gradiant, {{n}}, on the outer scale", fpnm),
                e6b.fmt("Read the fpm climb rate, {{n}}, on the inner scale below {{n}}", fpm, fpnm)
            ]
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
    var correction_1 = e6b.approx((dist_off_course / dist_flown) * 60);
    var correction_2 = e6b.approx((dist_off_course / dist_remaining) * 60);

    switch (e6b.rand(2)) {
    case 0:
        return [
            e6b.fmt("Degrees off course: {{n}} nm off course after flying {{n}} nm",
                    dist_off_course, dist_flown),
            e6b.fmt("{{n}}° off course", correction_1),
            [
                e6b.fmt("Find the distance off course, {{n}}, on the outer scale", dist_off_course),
                e6b.fmt("Rotate until the distance flown, {{n}}, appears on the inner scale below {{n}}", dist_flown, dist_off_course),
                e6b.fmt("Read the number of degrees off course, {{n}}, above the rate pointer (60)", correction_1)
            ]
        ];
    default:
        return [
            e6b.fmt("Heading correction to destination: {{n}} nm off course after flying {{n}} nm, {{n}} nm remaining",
                    dist_off_course, dist_flown, dist_remaining),
            e6b.fmt("Total correction: {{n}}° ({{n}}° off course and {{n}}° to recapture)",
                    correction_1 + correction_2, correction_1, correction_1),
            [
                e6b.fmt("Find the distance off course, {{n}}, on the outer scale", dist_off_course),
                e6b.fmt("Rotate until the distance flown, {{n}}, appears on the inner scale below {{n}}", dist_flown, dist_off_course),
                e6b.fmt("Read the number of degrees off course, {{n}}, above the rate pointer (60)", correction_1),
                e6b.fmt("Rotate again, until the distance remaining, {{n}}, appears on the inner scale below {{n}}", dist_remaining, dist_off_course),
                e6b.fmt("Read the additional heading adjustment to recapture, {{n}}, above the rate pointer (60)", correction_2),
                e6b.fmt("Add {{n}} and {{n}} to get the total heading correction to destination, {{n}}°",
                        correction_1, correction_2, correction_1+correction_2)
            ]
        ];
    }
};


/**
 * Conversions (all one function, so they don't come up too often)
 */
e6b.problems.calc.advanced.conversions = function () {
    var functions = [
        e6b.convert_temperature,
        e6b.convert_volume,
        e6b.convert_distance,
        e6b.convert_weight,
        e6b.convert_length
    ];
    return functions[functions.length * Math.random() << 0]();
};

 
/**
 * Unit conversion problems: volume
 */
e6b.convert_volume = function () {
    var gallons = e6b.rand(30, 1500) / 10.0; // one decimal place
    var litres = e6b.approx(gallons * 3.78541);
    switch (e6b.rand(0, 2)) {
    case 0:
        return [
            e6b.fmt("Convert {{n}} US gallon(s) to litres", gallons),
            e6b.fmt("{{n}} litres", litres),
            [
                "Set the conversion ratio by placing the US gal pointer on the outer scale (near 13) above the litres pointer on the inner scale (near 50)",
                e6b.fmt("Find the number of US gallons, {{n}}, on the outer scale", gallons),
                e6b.fmt("Read the number of litres, {{n}}, on the inner scale directly below {{n}}",
                        litres, gallons)
            ]
        ];
    default:
        return [
            e6b.fmt("Convert {{n}} litres to US gallons", litres),
            e6b.fmt("{{n}} US gallons", gallons),
            [
                "Set the conversion ratio by placing the US gallons pointer on the outer scale (near 13) lines above the litres pointer on the inner scale (near 50)",
                e6b.fmt("Find the number of litres, {{n}}, on the inner scale", litres),
                e6b.fmt("Read the number of US gallons, {{n}}, on the outer scale directly above {{n}}",
                        gallons, litres)
            ]
        ];
    }
};


/**
 * Unit conversion problems: distance
 */
e6b.convert_distance = function () {
    var distance_nm = e6b.rand(10, 300);
    var values = [distance_nm, e6b.approx(distance_nm * 1.15078), e6b.approx(distance_nm * 1.852)];
    var units = ["nautical miles", "statute miles", "kilometers"];
    var locations = ["66", "76", "12"];
    var i = e6b.rand(0, 3);
    do {
        var j = e6b.rand(0, 3);
    } while (i == j);
    return [
        e6b.fmt("Convert {{n}} {{s}} to {{s}}", values[i], units[i], units[j]),
        e6b.fmt("{{n}} {{s}}", values[j], units[j]),
        [
            e6b.fmt("Set the conversion ratio by placing the {{s}} pointer on outer scale (near {{s}}) above the {{s}} pointer on the inner scale (near {{s}})",
                    units[i], locations[i], units[j], locations[j]),
            e6b.fmt("Find the number of {{s}}, {{n}}, on the outer scale",
                    units[i], values[i]),
            e6b.fmt("Read the number of {{s}}, {{n}}, on the inner scale directly below {{n}}",
                    units[j], values[j], values[i])
        ]
    ];
};


/**
 * Calculator problem: weight
 */
e6b.convert_weight = function () {
    var lb = e6b.rand(10, 300);
    var kg = e6b.approx(lb / 2.205);
    switch (e6b.rand(0, 2)) {
    case 0:
        return [
            e6b.fmt("Convert {{n}} pounds to kilograms", lb),
            e6b.fmt("{{n}} kilograms", kg),
            [
                "Set the conversion ratio by placing the kilograms pointer on the outer scale (near 17) above the pounds pointer on the inner scale (near 36)",
                e6b.fmt("Find the number of kilograms, {{n}}, on the outer scale", kg),
                e6b.fmt("Read the number of pounds, {{n}}, on the inner scale directly below {{n}}", lb, kg)
            ]
        ];
    default:
        return [
            e6b.fmt("Convert {{n}} kilograms to pounds", kg),
            e6b.fmt("{{n}} pounds", lb),
            [
                "Set the conversion ratio by placing the kilograms pointer on the outer scale (near 17) above the pounds pointer on the inner scale (near 36)",
                e6b.fmt("Find the number of pounds, {{n}}, on the inner scale", lb),
                e6b.fmt("Read the number of kilograms, {{n}}, on the outer scale directly above {{n}}", kg, lb)
            ]
        ];
    }
};


/**
 * Calculator problem: length
 */
e6b.convert_length = function () {
    var feet = e6b.rand(10, 800) * 10;
    var metres = e6b.approx(feet / 3.281);
    switch (e6b.rand(0, 2)) {
    case 0:
        return [
            e6b.fmt("Convert {{n}} feet to metres", feet),
            e6b.fmt("{{n}} metres", metres),
            [
                "Set the conversion ratio by placing the feet pointer on the outer scale (near 14) above the metres pointer on the inner scale (near 44)",
                e6b.fmt("Find the number of feet, {{n}}, on the outer scale", feet),
                e6b.fmt("Read the number of metres, {{n}}, on the inner scale directly below {{n}}", metres, feet)
            ]
        ];
    default:
        return [
            e6b.fmt("Convert {{n}} metres to feet", metres),
            e6b.fmt("{{n}} feet", feet),
            [
                "Set the conversion ratio by placing the feet pointer on the outer scale (near 14) above the metres pointer on the inner scale (near 44)",
                e6b.fmt("Find the number of metres, {{n}}, on the inner scale", metres),
                e6b.fmt("Read the number of feet, {{n}}, on the outer scale directly above {{n}}", feet, metres)
            ]
        ];
    }
};


/**
 * Calculator problem: temperature
 */
e6b.convert_temperature = function () {
    var celsius = e6b.rand(-40, 40);
    var fahrenheit = e6b.approx(celsius * (9.0 / 5) + 32);
    switch (e6b.rand(0, 2)) {
    case 0:
        return [
            e6b.fmt("Convert {{n}}°C to Fahrenheit", celsius),
            e6b.fmt("{{n}}°F", fahrenheit),
            [
                e6b.fmt("If your E6B has a temperature scale, simply read {{n}}°F adjacent to {{n}}°C; otherwise …",
                        fahrenheit, celsius),
                "Set the conversion ratio by placing 36 on the outer scale above 20 on the inner scale",
                e6b.fmt("Add 40 to {{n}} to get {{n}}, and find {{n}} on the inner scale",
                        celsius, celsius+40, celsius+40),
                e6b.fmt("Read {{n}} on the outer scale above {{n}}, and subtract 40 to get {{n}}°F",
                        fahrenheit+40, celsius+40, fahrenheit)
            ]
        ];
    default:
        return [
            e6b.fmt("Convert {{n}}°F to Celsius", fahrenheit),
            e6b.fmt("{{n}}°C", celsius),
            [
                e6b.fmt("If your E6B has a temperature scale, simply read {{n}}°C adjacent to {{n}}°F; otherwise …",
                        celsius, fahrenheit),
                "Set the conversion ratio by placing 36 on the outer scale above 20 on the inner scale",
                e6b.fmt("Add 40 to {{n}} to get {{n}}, and find {{n}} on the outer scale", 
                        fahrenheit, fahrenheit+40, fahrenheit+40),
                e6b.fmt("Read {{n}} on the inner scale below {{n}}, and subtract 40 to get {{n}}°C",
                        celsius+40, fahrenheit+40, celsius)
            ]
        ];
    }
};


/**
 * Conversions (all one function, so they don't come up too often)
 */
e6b.problems.calc.advanced.misc = function () {
    var functions = [
        e6b.misc_fuel_weight,
        e6b.misc_multiplication,
        e6b.misc_division
    ];
    return functions[functions.length * Math.random() << 0]();
};

 
/**
 * Unit conversion problems: fuel-weight
 */
e6b.misc_fuel_weight = function () {
    var gallons = e6b.rand(5, 150);
    var lb = e6b.approx(gallons * 6.01);
    switch (e6b.rand(0, 2)) {
    case 0:
        return [
            e6b.fmt("Weight in pounds: {{n}} US gallons of avgas at ISA sea level", gallons),
            e6b.fmt("{{n}} pounds", lb),
            [
                "Set the conversion ratio by placing the fuel lbs pointer on the outer scale (near 77) above the US gallons pointer on the inner scale (near 13)",
                e6b.fmt("Find the number of gallons, {{n}}, on the inner scale", gallons),
                e6b.fmt("Read the number of pounds, {{n}}, on the outer scale directly above {{n}}", lb, gallons)
            ]
        ];
    default:
        return [
            e6b.fmt("Volume in US gallons: {{n}} pounds of avgas at ISA sea level", lb),
            e6b.fmt("{{n}} US gallons", gallons),
            [
                "Set the conversion ratio by placing the fuel lbs pointer on the outer scale (near 77) above the US gallons pointer on the inner scale (near 13)",
                e6b.fmt("Find the number of pounds, {{n}}, on the outer scale", lb),
                e6b.fmt("Read the number of gallons, {{n}}, on the inner scale directly below {{n}}", gallons, lb)
            ]
        ];
    }
};


/**
 * Calculator problem: multiplication.
 */
e6b.misc_multiplication = function () {
    var n1 = e6b.rand(3, 99);
    var n2 = e6b.rand(3, 99);
    return [
        e6b.fmt("{{n}} × {{n}} =", n1, n2),
        e6b.fmt("(approximately) {{n}}", e6b.approx(n1 * n2)),
        [
            e6b.fmt("Rotate so that the units pointer (10) on the inner scale is below {{n}} on the outer scale", n1),
            e6b.fmt("Find {{n}} on the inner scale", n2),
            e6b.fmt("Read the approximate product, {{n}}, on the outer scale directly above {{n}}", e6b.approx(n1 * n2), n2)
        ]
    ];
};


/**
 * Calculator problem: division.
 */
e6b.misc_division = function () {
    var n1 = e6b.rand(3, 9);
    var n2 = e6b.rand(3, 99);
    return [
        e6b.fmt("{{n}} ÷ {{n}} =", n1 * n2, n1),
        e6b.fmt("{{n}}", n2),
        [
            e6b.fmt("Find {{n}} on the outer scale", n1*n2),
            e6b.fmt("Rotate so that {{n}} appears on the inner scale directly below {{n}}", n1, n1*n2),
            e6b.fmt("Read the quotient, {{n}}, on the outer scale directly above the units pointer (10)", n2)
        ]
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
 * Approximate a value based on order of magnitude.
 */
e6b.approx = function (n) {
    // FIXME - there's probably an elegant way to do this
    if (n > 10000) {
        return Math.round(n / 1000) * 1000;
    } else if (n > 1000) {
        return Math.round(n / 100) * 100;
    } else if (n > 100) {
        return Math.round(n / 10) * 10;
    } else {
        return Math.round(n);
    }
}


/**
 * Choose a random item from an object/dict
 */
e6b.rand_item = function (obj) {
    var keys = Object.keys(obj);
    return obj[keys[keys.length * Math.random() << 0]];
};


/**
 * Format values in a string.
 * The first parameter is a format string; the remaining ones are
 * arguments to insert into the string. The escape sequences in the
 * format string are as follow:

 * {{n}} - format argument as a number
 * {{t}} - format argument as a time (minutes)
 * {{s}} - insert argument as-is as a string
 */
e6b.fmt = function (fmt) {

    function time (minutes) {
        if (minutes < 60) {
            return minutes + " minutes";
        } else {
            var h = Math.floor(minutes / 60);
            var m = minutes % 60;
            if (m < 10) {
                m = '0' + m;
            }
            return h + ":" + m;
        }
    }

    var args = Array.from(arguments).slice(1);
    var parts = fmt.split(/{{|}}/);
    var result = '';
    while (parts.length > 0) {
        result += parts.shift();
        if (parts.length > 0 && args.length > 0) {
            var spec = parts.shift();
            var arg = args.shift();
            if (spec == 'n') {
                result += arg.toLocaleString();
            } else if (spec == 't') {
                result += time(arg);
            } else if (spec == 's') {
                result += arg;
            } else {
                console.error("Unrecognised format string", spec);
            }
        }
    }
    if (parts.length > 0) {
        console.error("Unused format-string specs", parts);
    }
    if (args.length > 0) {
        console.error("Unused arguments", args);
    }
    return result;
};



////////////////////////////////////////////////////////////////////////
// Top-level logic
////////////////////////////////////////////////////////////////////////


/**
 * Ask the next question.
 */
e6b.show_problem = function () {

    function setup_help (steps) {
        for (i in steps) {
            var node = document.createElement("li");
            node.textContent = steps[i];
            e6b.nodes.help_steps.appendChild(node);
        }
    }
    
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
    e6b.nodes.help.hidden = true;

    e6b.nodes.help_steps.innerHTML = "";
    if (info.length > 2) {
        e6b.show_help = true;
        setup_help(info[2]);
    } else {
        e6b.show_help = false;
    }
};


/**
 * React to an input event (click, tap, key)
 */
e6b.input = function (event) {
    if (e6b.nodes.answer.hidden) {
        e6b.nodes.answer.hidden = false;
        e6b.nodes.help.hidden = !e6b.show_help;
    } else {
        e6b.show_problem();
    }
};


/**
 * Calculate density altitude from pressure altitude and temperature.
 * Reverse engineered from the E6B
 */
e6b.density_altitude = function (pressure_altitude, temperature) {
    var isa_temperature = 15 - ((pressure_altitude / 1000) * 1.98); // difference from ISO temperature
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
    e6b.nodes.help = document.getElementById("help");
    e6b.nodes.help_steps = document.getElementById("help-steps");

    // Setup basic/advanced toggle
    e6b.setup_advanced();

    // Show the first problem
    e6b.show_problem();
});

// end
