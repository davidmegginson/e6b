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
        }
    },
    compute: {
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
    var p = {};

    // Randomly-generated values
    p.course = e6b.rand(0, 360);
    p.tas = e6b.rand(60, 180);
    p.wdir = e6b.rand(0, 36) * 10;
    p.wspeed = e6b.rand(5, 40);

    // Derived values
    p.headwind = e6b.compute.headwind(p.course, p.wdir, p.wspeed);
    p.crosswind = e6b.compute.crosswind(p.course, p.wdir, p.wspeed);
    p.espeed = e6b.compute.effective_speed(p.tas, p.crosswind);
    p.gs = p.espeed - p.headwind;
    p.wca = e6b.compute.wind_correction_angle(p.tas, p.crosswind);
    p.heading = (p.course + p.wca + 360) % 360;

    if (p.headwind < 0) {
        p.headwind_dir = "tailwind";
        p.headwind_op = "Add";
        p.headwind_prep = "to";
    } else {
        p.headwind_dir = "headwind";
        p.headwind_op = "Subtract";
        p.headwind_prep = "from";
    }

    if (p.crosswind < 0) {
        p.crosswind_dir = "left";
        p.crosswind_op = "Subtract";
        p.crosswind_prep = "from";
    } else {
        p.crosswind_dir = "right";
        p.crosswind_op = "Add";
        p.crosswind_prep = "to";
    }

    return p;
};


/**
 * Wind problem: calculate heading corrected for wind.
 */
e6b.problems.wind.basic.heading = function () {
    var p = e6b.gen_wind_params();
    return [
        e6b.fmt("Heading: {{n}} kt true airspeed, course {{n}}°, wind from {{n}}° @ {{n}} kt",
                p.tas, p.course, p.wdir, p.wspeed),
        e6b.fmt("Fly heading {{n}}°", p.heading),
        [
            e6b.fmt("Set the wind direction {{n}}° under the \"true index\" pointer", p.wdir),
            e6b.fmt("Make a pencil mark for the wind speed {{n}} kt straight up from the centre grommet", p.wspeed),
            e6b.fmt("Rotate to set the course {{n}}° next to the \"true index\" pointer", p.course),
            e6b.fmt("Slide the card until the pencil mark is over the true airspeed {{n}} kt", p.tas),
            e6b.fmt("Read the wind-correction angle {{n}}° to the {{s}} under the pencil mark",
                    Math.abs(p.wca), p.crosswind_dir),
            e6b.fmt("{{s}} {{n}} {{s}} the course {{n}}° to get the heading {{n}}°",
                    p.crosswind_op, Math.abs(p.wca), p.crosswind_prep, p.course, p.heading)
        ]
    ];
};


/**
 * Wind problem: calculate groundspeed.
 */
e6b.problems.wind.basic.groundspeed = function () {
    var p = e6b.gen_wind_params();
    return [
        e6b.fmt("Groundspeed (kt): {{n}} kt true airspeed, course {{n}}°, wind from {{n}}° @ {{n}} kt",
                p.tas, p.course, p.wdir, p.wspeed),
        e6b.fmt("{{n}} kt groundspeed", p.gs),
        [
            e6b.fmt("Rotate to set the wind direction {{n}}° under the \"true index\" pointer", p.wdir),
            e6b.fmt("Make a pencil mark for the wind speed {{n}} kt straight up from the centre grommet", p.wspeed),
            e6b.fmt("Rotate to set the course {{n}}° next to the \"true index\" pointer", p.course),
            e6b.fmt("Slide the card until the pencil mark is over the true airspeed {{n}} kt", p.tas),
            e6b.fmt("Read the groundspeed {{n}} kt under the centre grommet", p.gs)
        ]
    ];
};


/**
 * Wind problem: calculate wind aloft.
 */
e6b.problems.wind.advanced.wind_aloft = function () {
    var p = e6b.gen_wind_params();
    return [
        e6b.fmt("Wind aloft: {{n}} kt true airspeed, course {{n}}°, heading {{n}}°, {{n}} kt groundspeed",
                p.tas, p.course, p.heading, p.gs),
        e6b.fmt("Wind from {{n}}° @ {{n}} kt", p.wdir, p.wspeed),
        [
            e6b.fmt("Rotate to set the course {{n}}° under the \"true index\" pointer", p.course),
            e6b.fmt("Slide the card until the centre grommet is over the groundspeed {{n}} kt", p.gs),
            e6b.fmt("Compare the course {{n}}° to the actual heading {{n}}° to get a wind-correction " +
                    "angle of {{n}}° to the {{s}}", p.course, p.heading, Math.abs(p.wca), p.crosswind_dir),
            e6b.fmt("Make a pencil mark where the {{n}}° wind-correction angle on the {{s}} side crosses the " +
                    "{{n}} kt true airspeed line", Math.abs(p.wca), p.crosswind_dir, p.tas),
            "Rotate so that the pencil mark is on the vertical line above the grommet",
            e6b.fmt("The wind direction, {{n}}°, is under the \"true index\" pointer", p.wdir),
            e6b.fmt("The wind speed, {{n}} kt, is the number of knots between the grommet and the pencil mark",
                    p.wspeed)
        ]
    ];
};


/**
 * Calculate parameters for runway-wind problems.
 */
e6b.runway_wind_params = function () {
    var p = {};
    p.runway = e6b.rand(0, 36) + 1;
    p.course = p.runway * 10;
    p.wind_dir = (p.course + e6b.rand(-90, 90) + 360) % 360;
    p.wind_speed = e6b.rand(5, 30);
    p.headwind = e6b.compute.headwind(p.course, p.wind_dir, p.wind_speed);
    p.headwind_dir = (p.headwind < 0 ? "tailwind" : "headwind");
    p.crosswind = e6b.compute.crosswind(p.course, p.wind_dir, p.wind_speed);
    p.crosswind_dir = (p.crosswind < 0 ? "left" : "right");
    p.wind_angle = p.wind_dir - p.course;
    return p;
};


/**
 * Wind problem: calculate the runway headwind for landing/takeoff.
 */
e6b.problems.wind.advanced.runway_headwind = function () {
    var p = e6b.runway_wind_params();
    return [
        e6b.fmt("Headwind: Runway {{n}}, wind from {{n}}° @ {{n}} kt",
                p.runway, p.wind_dir, p.wind_speed),
        (p.headwind == 0 ? "No headwind"
         : e6b.fmt("{{n}} kt {{s}}", Math.abs(p.headwind), p.headwind_dir)),
        [
            e6b.fmt("Compare the runway heading {{n}}° and the wind direction {{n}}° to get " +
                    "a wind angle of {{n}}° from the {{s}} side of the runway",
                    p.course, p.wind_dir, Math.abs(p.wind_angle), p.crosswind_dir),
            e6b.fmt("Using the wind-component grid on the card part of the E6B, " +
                    "trace approximately a {{n}}° angle line until it intersects with a {{n}} kt curve",
                    Math.abs(p.wind_angle), p.wind_speed),
            e6b.fmt("Look directly left and read approximately {{n}} kt on the \"Headwind component\" axis",
                    Math.abs(p.headwind))
        ]
    ];
};


/**
 * Wind problem: calculate the runway crosswind for landing.
 */
e6b.problems.wind.advanced.runway_crosswind = function () {
    var p = e6b.runway_wind_params();
    return [
        e6b.fmt("Crosswind: Runway {{n}}, wind from {{n}}° @ {{n}} kt",
                p.runway, p.wind_dir, p.wind_speed),
        (p.crosswind == 0 ? "No crosswind"
         : e6b.fmt("{{n}} kt crosswind from the {{s}} side of the runway",
                   Math.abs(p.crosswind), p.crosswind_dir)),
        [
            e6b.fmt("Compare the runway heading {{n}}° and the wind direction {{n}}° to get " +
                    "a wind angle of {{n}}° to the {{s}}",
                    p.course, p.wind_dir, Math.abs(p.wind_angle), p.crosswind_dir),
            e6b.fmt("Using the wind-component grid on the card part of the E6B, " +
                    "trace approximately a {{n}}° angle line until it intersects with a {{n}} kt curve",
                    Math.abs(p.wind_angle), p.wind_speed),
            e6b.fmt("Look directly down and read approximately {{n}} kt on the \"Crosswind component\" axis",
                    Math.abs(p.crosswind))
        ]             
    ];
};



////////////////////////////////////////////////////////////////////////
// Problems for the calculator side.
////////////////////////////////////////////////////////////////////////


/**
 * Generate random parameters for a distance/speed/time problem.
 */
e6b.gen_dst_params = function () {
    var p = {};
    p.speed = e6b.rand(60, 300);
    p.time = e6b.rand(5, 180);
    p.dist = Math.round((p.speed / 60.0) * p.time);
    return p;
};


/**
 * Calculator problem: speed from distance and time
 */
e6b.problems.calc.basic.speed = function () {
    var p = e6b.gen_dst_params();
    return [
        e6b.fmt("Groundspeed (knots): travelled {{n}} nm in {{t}}", p.dist, p.time),
        e6b.fmt("{{n}} kt groundspeed", p.speed),
        [
            e6b.fmt("Find the distance {{n}} nm on the outer scale", p.dist),
            e6b.fmt("Rotate until the time {{t}} on the inner scale is underneath {{n}}", p.time, p.dist),
            e6b.fmt("Read the speed {{n}} kt on the outer scale above the rate pointer (60)", p.speed)
        ]
    ];
};


/**
 * Calculator problem: time from speed and distance
 */
e6b.problems.calc.basic.time = function () {
    var p = e6b.gen_dst_params();
    return [
        e6b.fmt("Time enroute: travelling {{n}} nm at {{n}} kt", p.dist, p.speed),
        e6b.fmt("{{t}} enroute", p.time),
        [
            e6b.fmt("Rotate until the airspeed {{n}} kt appears on the outer scale above the rate pointer (60)", p.speed),
            e6b.fmt("Find the distance {{n}} nm on the outer scale", p.dist),
            e6b.fmt("Read the time {{t}} on the inner scale below {{n}}", p.time, p.dist)
        ]
    ];
};


/**
 * Calculator problem: distance from speed and time
 */
e6b.problems.calc.basic.dist = function () {
    var p = e6b.gen_dst_params();
    return [
        e6b.fmt("Distance travelled: flying for {{t}} at {{n}} kt", p.time, p.speed),
        e6b.fmt("{{n}} nm travelled", p.dist),
        [
            e6b.fmt("Rotate until the speed {{n}} kt appears above the rate pointer (60)", p.speed),
            e6b.fmt("Find the time {{t}} on the inner scale", p.time),
            e6b.fmt("Read the distance {{n}} nm on the outer scale above {{t}}", p.dist, p.time)
        ]
    ];
};


/**
 * Generate random parameters for a burn/endurance/fuel problem.
 */
e6b.gen_bef_params = function () {
    var p = {};
    p.gph = e6b.rand(50, 300) / 10.0; // one decimal place
    p.endurance = e6b.rand(5, 180);
    p.fuel = Math.round((p.gph / 60) * p.endurance * 10) / 10;
    return p;
};


/**
 * Calculator problem: fuel burn from fuel and endurance.
 */
e6b.problems.calc.basic.gph = function () {
    var p = e6b.gen_bef_params();
    return [
        e6b.fmt("Fuel-consumption rate (gph): used {{n}} gallons in {{t}}", p.fuel, p.endurance),
        e6b.fmt("Consuming {{n}} gph", p.gph),
        [
            e6b.fmt("Find {{n}} gallons on the outer scale", p.fuel),
            e6b.fmt("Rotate until the time {{t}} appears on the inner scale below {{n}}", p.endurance, p.fuel),
            e6b.fmt("Read the fuel consumption {{n}} gph above the rate pointer (60)", p.gph)
        ]
    ];
};


/**
 * Calculator problem: fuel from fuel burn and endurance.
 */
e6b.problems.calc.basic.fuel = function () {
    var p = e6b.gen_bef_params();
    return [
        e6b.fmt("Fuel required (gallons): flying for {{t}}, consuming {{n}} gph", p.endurance, p.gph),
        e6b.fmt("{{n}} gallons required", p.fuel),
        [
            e6b.fmt("Rotate until the fuel consumption {{n}} gph appears above the rate pointer (60)", p.gph),
            e6b.fmt("Find the endurance {{t}} on the inner scale", p.endurance),
            e6b.fmt("Read {{n}} gallons fuel required on the outer scale above {{t}}", p.fuel, p.endurance)
        ]
    ];
};


/**
 * Calculator problem: endurance from fuel and fuel burn.
 */
e6b.problems.calc.basic.endurance = function () {
    var p = e6b.gen_bef_params();
    return [
        e6b.fmt("Endurance: {{n}} gallons fuel onboard, consuming {{n}} gph", p.fuel, p.gph),
        e6b.fmt("{{t}} endurance", p.endurance),
        [
            e6b.fmt("Rotate until the fuel consumption {{n}} gph appears above the rate pointer (60)", p.gph),
            e6b.fmt("Find the fuel available {{n}} gallons on the outer scale", p.fuel),
            e6b.fmt("Read the endurance {{t}} on the inner scale below {{n}}", p.endurance, p.fuel)
        ]
    ];
};


/**
 * Generate random parameters for a density-altitude problem.
 */
e6b.gen_density_alt = function () {
    // FIXME - not the real formulas
    var p = {};
    var oat_offset = e6b.rand(20, -20);
    p.palt = e6b.rand(1, 18) * 1000;
    p.oat = Math.round(15 - (p.palt * 1.98 / 1000) + oat_offset);
    p.dalt = e6b.compute.density_altitude(p.palt, p.oat);
    p.cas = e6b.rand(70, 250);
    p.tas = Math.round(e6b.compute.true_airspeed(p.cas, p.dalt));
    p.oat = Math.round(p.oat);
    return p;
};


/**
 * Calculator problem: density altitude from pressure altitude and OAT.
 */
e6b.problems.calc.advanced.density_alt = function () {
    var p = e6b.gen_density_alt();
    return [
        e6b.fmt("Density altitude (nearest 1,000 ft): {{n}} ft pressure altitude, {{n}}°c outside air temperature",
                p.palt, p.oat),
        e6b.fmt("Approximately {{n}} ft density altitude", Math.round(p.dalt / 1000) * 1000),
        [
            e6b.fmt("In the bottom section of the True Airspeed window, line up {{n}} (thousand feet) pressure altitude with {{n}}°C",
                    Math.round(p.palt / 1000), p.oat),
            e6b.fmt("In the top section, read {{n}} (thousand feet) under the Density Altitude pointer",
                    Math.round(p.dalt / 1000) * 1000)
        ]
    ];
};


/**
 * Calculator problem: TAS from CAS, pressure altitude, and OAT
 */
e6b.problems.calc.advanced.true_airspeed = function () {
    var p = e6b.gen_density_alt();
    return [
        e6b.fmt("True airspeed (knots): {{n}} kt calibrated airspeed, {{n}} ft pressure altitude, {{n}}°C outside air temperature",
                p.cas, p.palt, p.oat),
        e6b.fmt("{{n}} kt true airspeed", p.tas),
        [
            e6b.fmt("In the True Airspeed window, line up {{n}} (thousand feet) pressure altitude with {{n}}°C",
                    Math.round(p.palt / 1000), p.oat),
            e6b.fmt("Find the calibrated airspeed {{n}} kt on the inner scale of the main circle", p.cas),
            e6b.fmt("Read the true airspeed {{n}} kt on the outer scale above {{n}}", p.tas, p.cas)
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
        e6b.fmt("True altitude: {{n}} ft indicated altitude, {{n}}°C OAT, {{n}} ft pressure altitude, {{n}} ft MSL station elevation",
                indicated_alt, oat, pressure_alt, station_elev),
        e6b.fmt("{{n}} ft true altitude", true_alt),
        [
            e6b.fmt("Subtract {{n}} ft station elevation from {{n}} ft indicated altitude to get {{n}} ft indicated altitude above station",
                    station_elev, indicated_alt, indicated_alt - station_elev),
            e6b.fmt("In the True Altitude window, line up {{n}} (thousand feet) pressure altitude with {{n}}°C",
                    Math.round(pressure_alt / 1000), oat),
            e6b.fmt("Find indicated altitude above station {{n}} ft on the main inner scale", indicated_alt - station_elev),
            e6b.fmt("Read approximate true altitude above station {{n}} ft on the outer scale above {{n}}",
                    e6b.approx(true_alt - station_elev), indicated_alt - station_elev),
            e6b.fmt("Add {{n}} to the station elevation {{n}} to get the approximate true altitude, {{n}}",
                    e6b.approx(true_alt - station_elev), station_elev, true_alt)
        ]
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
            e6b.fmt("Climb gradiant (ft/nm): {{n}} kt groundspeed, {{n}} fpm climb rate", gs, fpm),
            e6b.fmt("{{n}} ft/nm climb gradiant", fpnm),
            [
                e6b.fmt("Rotate until the groundspeed {{n}} kt appears above the rate pointer (60)", gs),
                e6b.fmt("Find the climb rate {{n}} fpm on the inner scale", fpm),
                e6b.fmt("Read the climb gradiant {{n}} ft/nm on the outer scale above {{n}}", fpnm, fpm)
            ]
        ];
    default:
        return [
            e6b.fmt("Climb rate required (fpm): {{n}} kt groundspeed, {{n}} ft/nm gradiant", gs, fpnm),
            e6b.fmt("{{n}} fpm climb rate required", fpm),
            [
                e6b.fmt("Rotate until the groundspeed {{n}} kt appears above the rate pointer (60)", gs),
                e6b.fmt("Find the climb gradiant {{n}} ft/nm on the outer scale", fpnm),
                e6b.fmt("Read the climb rate {{n}} fpm on the inner scale below {{n}}", fpm, fpnm)
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
    var heading_error = e6b.approx((dist_off_course / dist_flown) * 60);
    var intercept_angle = e6b.approx((dist_off_course / dist_remaining) * 60);

    switch (e6b.rand(2)) {
    case 0:
        return [
            e6b.fmt("Heading error (degrees): {{n}} nm off course after flying {{n}} nm",
                    dist_off_course, dist_flown),
            e6b.fmt("{{n}}° off course", heading_error),
            [
                e6b.fmt("Find the distance off course {{n}} nm on the outer scale", dist_off_course),
                e6b.fmt("Rotate until the distance flown {{n}} nm appears on the inner scale below {{n}}", dist_flown, dist_off_course),
                e6b.fmt("Read the heading error {{n}}° above the rate pointer (60)", heading_error)
            ]
        ];
    default:
        return [
            e6b.fmt("Heading correction to destination: {{n}} nm off course after flying {{n}} nm, {{n}} nm remaining",
                    dist_off_course, dist_flown, dist_remaining),
            e6b.fmt("Correction to intercept: {{n}}° ({{n}}° heading error and {{n}}° additional intercept angle)",
                    heading_error + intercept_angle, heading_error, heading_error),
            [
                e6b.fmt("Find the distance off course {{n}}  on the outer scale", dist_off_course),
                e6b.fmt("Rotate until the distance flown {{n}} nm appears on the inner scale below {{n}}", dist_flown, dist_off_course),
                e6b.fmt("Read the heading error {{n}}° above the rate pointer (60)", heading_error),
                e6b.fmt("Rotate again until the distance remaining {{n}}° appears on the inner scale below {{n}}", dist_remaining, dist_off_course),
                e6b.fmt("Read the the intercept angle {{n}}° above the rate pointer (60)", intercept_angle),
                e6b.fmt("Add {{n}}° heading error and {{n}}° intercept angle to get the total heading correction to destination {{n}}°",
                        heading_error, intercept_angle, heading_error+intercept_angle)
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
            e6b.fmt("Convert {{n}} US gallon(s) to litres", gallons),
            e6b.fmt("{{n}} litres", litres),
            [
                "Set the conversion ratio by placing the \"US gal\" pointer on the outer scale (near 13) above the \"litres\" " +
                    "pointer on the inner scale (near 50)",
                e6b.fmt("Find the {{n}} gallons on the outer scale", gallons),
                e6b.fmt("Read {{n}} litres on the inner scale directly below {{n}}", litres, gallons)
            ]
        ];
    default:
        return [
            e6b.fmt("Convert {{n}} litres to US gallons", litres),
            e6b.fmt("{{n}} US gallons", gallons),
            [
                "Set the conversion ratio by placing the \"US gal\" pointer on the outer scale (near 13) above the \"litres\" " +
                    "pointer on the inner scale (near 50)",
                e6b.fmt("Find {{n}} litres on the inner scale", litres),
                e6b.fmt("Read {{n}} US gallons on the outer scale directly above {{n}}", gallons, litres)
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
    var units = ["nautical miles", "statute miles", "kilometers"];
    var locations = ["66", "76", "12"];
    var i = e6b.rand(0, 3);
    do {
        var j = e6b.rand(0, 3);
    } while (i == j);
    return [
        e6b.fmt("Convert {{n}} {{s}} to {{s}}", values[i], units[i], units[j]),
        e6b.fmt("{{n}} {{s}}", values[j], units[j]),
        [
            e6b.fmt("Set the conversion ratio by placing the \"{{s}}\" pointer on outer scale (near {{s}}) " +
                    "above the \"{{s}}\" pointer on the inner scale (near {{s}})",
                    units[i], locations[i], units[j], locations[j]),
            e6b.fmt("Find {{n}} {{s}} on the outer scale", values[i], units[i]),
            e6b.fmt("Read the {{n}} {{s}} on the inner scale directly below {{n}}", values[j], units[j], values[i])
        ]
    ];
};


/**
 * Calculator problem: weight
 */
e6b.convert_weight = function () {
    var lb = e6b.rand(10, 300);
    var kg = Math.round(lb / 2.205 * 2) / 2;
    switch (e6b.rand(0, 2)) {
    case 0:
        return [
            e6b.fmt("Convert {{n}} pounds to kilograms", lb),
            e6b.fmt("{{n}} kilograms", kg),
            [
                "Set the conversion ratio by placing the kilograms pointer on the outer scale (near 17) above " +
                    "the pounds pointer on the inner scale (near 36)",
                e6b.fmt("Find {{n}} kg on the outer scale", kg),
                e6b.fmt("Read {{n}} lb on the inner scale directly below {{n}}", lb, kg)
            ]
        ];
    default:
        return [
            e6b.fmt("Convert {{n}} kilograms to pounds", kg),
            e6b.fmt("{{n}} pounds", lb),
            [
                "Set the conversion ratio by placing the kilograms pointer on the outer scale (near 17) above " +
                    "the pounds pointer on the inner scale (near 36)",
                e6b.fmt("Find {{n}} lb on the inner scale", lb),
                e6b.fmt("Read {{n}} kg on the outer scale directly above {{n}}", kg, lb)
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
            e6b.fmt("Convert {{n}} feet to metres", feet),
            e6b.fmt("{{n}} metres", metres),
            [
                "Set the conversion ratio by placing the feet pointer on the outer scale (near 14) above " +
                    "the metres pointer on the inner scale (near 44)",
                e6b.fmt("Find {{n}} feet on the outer scale", feet),
                e6b.fmt("Read approximately {{n}} metres on the inner scale directly below {{n}}", metres, feet)
            ]
        ];
    default:
        return [
            e6b.fmt("Convert {{n}} metres to feet", metres),
            e6b.fmt("{{n}} feet", feet),
            [
                "Set the conversion ratio by placing the feet pointer on the outer scale (near 14) above " +
                    "the metres pointer on the inner scale (near 44)",
                e6b.fmt("Find {{n}} metres on the inner scale", metres),
                e6b.fmt("Read approximately {{n}} ft on the outer scale directly above {{n}}", feet, metres)
            ]
        ];
    }
};


/**
 * Calculator problem: temperature
 */
e6b.convert_temperature = function () {
    var celsius = e6b.rand(-40, 40);
    var fahrenheit = Math.round(celsius * (9.0 / 5) + 32);
    switch (e6b.rand(0, 2)) {
    case 0:
        return [
            e6b.fmt("Convert {{n}}°C to Fahrenheit", celsius),
            e6b.fmt("{{n}}°F", fahrenheit),
            [
                e6b.fmt("If your E6B has a temperature scale, simply read {{n}}°F adjacent to {{n}}°C; otherwise …",
                        fahrenheit, celsius),
                "Set the conversion ratio by placing 36 on the outer scale above 20 on the inner scale",
                e6b.fmt("Add 40 to {{n}}°C to get {{n}}, and find {{n}} on the inner scale",
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
                e6b.fmt("Add 40 to {{n}}°F to get {{n}}, and find {{n}} on the outer scale", 
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
    var lb = e6b.rand(30, 900);
    var gallons = e6b.approx(lb / 6.01 * 10) / 10;
    switch (e6b.rand(0, 2)) {
    case 0:
        return [
            e6b.fmt("Weight in pounds: {{n}} US gallons of avgas at ISA sea level", gallons),
            e6b.fmt("{{n}} pounds", lb),
            [
                "Set the conversion ratio by placing the \"fuel lbs\" pointer on the outer scale (near 77) above "
                    + "the \"US gallons\" pointer on the inner scale (near 13)",
                e6b.fmt("Find {{n}} gallons on the inner scale", gallons),
                e6b.fmt("Read {{n}} pounds on the outer scale directly above {{n}}", lb, gallons)
            ]
        ];
    default:
        return [
            e6b.fmt("Volume in US gallons: {{n}} pounds of avgas at ISA sea level", lb),
            e6b.fmt("{{n}} US gallons", gallons),
            [
                "Set the conversion ratio by placing the \"fuel lbs\" pointer on the outer scale (near 77) above " +
                    "the \"US gallons\" pointer on the inner scale (near 13)",
                e6b.fmt("Find {{n}} pounds on the outer scale", lb),
                e6b.fmt("Read {{n}} gallons on the inner scale directly below {{n}}", gallons, lb)
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
            e6b.fmt("Read the approximate product {{n}} on the outer scale directly above {{n}}", e6b.approx(n1 * n2), n2)
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
            e6b.fmt("Read the approximate quotient {{n}} on the outer scale directly above the units pointer (10)", n2)
        ]
    ];
};



////////////////////////////////////////////////////////////////////////
// Computations
////////////////////////////////////////////////////////////////////////

/**
 * Basic trig to calculate a headwind
 */
e6b.compute.headwind = function (course, wind_dir, wind_speed) {
    // use the cosine of the angle between the course and the wind
    var cos = Math.cos((wind_dir - course) * (Math.PI / 180.0));
    return Math.round(wind_speed * cos);
};


/**
 * Basic trig to calculate a crosswind.
 */
e6b.compute.crosswind = function (course, wind_dir, wind_speed) {
    // use the sine of the angle between the course and the wind
    var sin = Math.sin((wind_dir - course) * (Math.PI / 180.0));
    return Math.round(wind_speed * sin);
};


/**
 * Calculate effective speed when in a crab.
 * FIXME: needs testing
 */
e6b.compute.effective_speed = function (true_airspeed, crosswind) {
    // Use Pythagoras to compute the cosine
    var cos = true_airspeed / Math.sqrt(true_airspeed * true_airspeed + crosswind * crosswind);
    return Math.round(true_airspeed * cos);
};


/**
 * Calculate the wind-correction angle
 * FIXME: needs testing
 */
e6b.compute.wind_correction_angle = function (true_airspeed, crosswind) {
    var cos = true_airspeed / Math.sqrt(true_airspeed * true_airspeed + crosswind * crosswind);
    var dir = crosswind < 0 ? -1 : 1; // -1 for left, 1 for right
    return Math.round(Math.acos(cos) *(180 / Math.PI)) * dir;
};


/**
 * Calculate density altitude from pressure altitude and temperature.
 */
e6b.compute.density_altitude = function (pressure_altitude, temperature) {
    var isa_temperature = 15 - ((pressure_altitude / 1000) * 2); // difference from ISO temperature
    var offset = (temperature - isa_temperature) * 120;
    return Math.round(pressure_altitude + offset);
};


/**
 * Calculate true airspeed from calibrated airspeed and density altitude.
 * Reverse engineered from the E6B
 */
e6b.compute.true_airspeed = function (calibrated_airspeed, density_altitude) {
    var factor = 1 + ((density_altitude / 1000) * (0.012 + (density_altitude / 1000) * 0.0004)); // WRONG, but close
    return Math.round(calibrated_airspeed * factor);
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
