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
    p.course = e6b.rand(1, 360);
    p.tas = e6b.rand(60, 180);
    p.wdir = e6b.rand(1, 36) * 10;
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
        e6b.fmt("Heading: wind from {{n}}° @ {{n}} kt, course {{n}}°, {{n}} kt true airspeed",
                p.wdir, p.wspeed, p.course, p.tas),
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
        e6b.fmt("Groundspeed (knots): wind from {{n}}° @ {{n}} kt, course {{n}}°, {{n}} kt true airspeed",
                p.wdir, p.wspeed, p.course, p.tas),
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
    p.runway = e6b.rand(1, 36);
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
        e6b.fmt("Time enroute: {{n}} kt over {{n}} nm", p.speed, p.dist),
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
        e6b.fmt("Distance travelled: flying at {{n}} kt for {{t}}", p.speed, p.time),
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
        e6b.fmt("Fuel-consumption rate (gallons/hour): used {{n}} gallons in {{t}}", p.fuel, p.endurance),
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
        e6b.fmt("Fuel required (gallons): consuming {{n}} gph over {{t}}", p.gph, p.endurance),
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
        e6b.fmt("Endurance (time): consuming {{n}} gph with {{n}} gallons fuel onboard", p.gph, p.fuel),
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
        e6b.fmt("True airspeed (knots): {{n}} ft pressure altitude, {{n}}°C outside air temperature, {{n}} kt calibrated airspeed",
                p.palt, p.oat, p.cas),
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
    
    // station elevation, 0-5000 ft (500 ft increments)
    var station_elev = e6b.rand(1, 50) * 100;

    // indicated altitude, station alt + 3000-15000 ft (500-foot increments)
    var indicated_alt = (Math.ceil(station_elev / 500) * 500) + (e6b.rand(6, 30) * 500);

    // pressure altitude +/- 1,500 ft from indicated
    var pressure_alt = indicated_alt + (e6b.rand(-2, 2) * 500);

    // expected ISA temperature at pressure altitude
    var isa_temp = Math.round(15 - (pressure_alt / 1000 * 1.98));

    // randomised delta temperature, -20c to 20c
    var delta_temp = e6b.rand(-20, 20);

    // actual temperature at altitude
    var oat = isa_temp + delta_temp;
    
    // true altitude (rounded to the nearest 100 feet)
    var true_alt = Math.round((indicated_alt + ((indicated_alt - station_elev) / 1000 * delta_temp * 4)) / 100) * 100;

    return [
        e6b.fmt("True altitude (nearest 100 ft): {{n}} ft pressure altitude, {{n}}°C OAT, {{n}} ft indicated altitude, {{n}} ft MSL station elevation",
                pressure_alt, oat, indicated_alt, station_elev),
        e6b.fmt("Approximately {{n}} ft true altitude", true_alt),
        [
            e6b.fmt("In the True Altitude window, line up {{n}} (thousand feet) pressure altitude with {{n}}°C",
                    Math.round(pressure_alt / 1000), oat),
            e6b.fmt("Subtract {{n}} ft station elevation from {{n}} ft indicated altitude to get {{n}} ft indicated altitude above station",
                    station_elev, indicated_alt, indicated_alt - station_elev),
            e6b.fmt("Find indicated altitude above station {{n}} ft on the main inner scale", indicated_alt - station_elev),
            e6b.fmt("Read approximate true altitude above station {{n}} ft on the outer scale above {{n}}",
                    Math.round((true_alt - station_elev) / 100) * 100, indicated_alt - station_elev),
            e6b.fmt("Add {{n}} ft to the station elevation {{n}} ft to get the approximate true altitude, {{n}} ft",
                    Math.round((true_alt - station_elev) / 100) * 100, station_elev, true_alt)
        ]
    ];
};


/**
 * Calculator problem: rate of climb
 */
e6b.problems.calc.advanced.vertical_speed = function () {
    var fpm = e6b.rand(30, 120) * 10;
    var gs = e6b.rand(50, 150);
    var fpnm = Math.round(fpm * 60 / gs / 10) * 10;
    switch (e6b.rand(0, 2)) {
    case 0:
        return [
            e6b.fmt("Climb gradiant (nearest 10 ft/nm): {{n}} kt groundspeed, {{n}} fpm climb rate", gs, fpm),
            e6b.fmt("Approximately {{n}} ft/nm climb gradiant", fpnm),
            [
                e6b.fmt("Rotate until the groundspeed {{n}} kt appears above the rate pointer (60)", gs),
                e6b.fmt("Find the climb rate {{n}} fpm on the outer scale", fpm),
                e6b.fmt("Read the approximate climb gradiant {{n}} ft/nm on the inner scale below {{n}}", fpnm, fpm)
            ]
        ];
    default:
        return [
            e6b.fmt("Climb rate required (nearest 10 fpm): {{n}} kt groundspeed, {{n}} ft/nm gradiant", gs, fpnm),
            e6b.fmt("Approximately {{n}} fpm climb rate required", fpm),
            [
                e6b.fmt("Rotate until the groundspeed {{n}} kt appears above the rate pointer (60)", gs),
                e6b.fmt("Find the climb gradiant {{n}} ft/nm on the inner scale", fpnm),
                e6b.fmt("Read the approximate climb rate {{n}} fpm on the outer scale above {{n}}", fpm, fpnm)
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
    var heading_error = Math.round((dist_off_course / dist_flown) * 60);
    var intercept_angle = Math.round((dist_off_course / dist_remaining) * 60);

    switch (e6b.rand(2)) {
    case 0:
        return [
            e6b.fmt("Heading error (degrees): {{n}} nm off course after flying {{n}} nm",
                    dist_off_course, dist_flown),
            e6b.fmt("{{n}}° off course", heading_error),
            [
                e6b.fmt("Find the distance off course {{n}} nm on the outer scale", dist_off_course),
                e6b.fmt("Rotate until the distance flown {{n}} nm appears on the inner scale below {{n}}", dist_flown, dist_off_course),
                e6b.fmt("Read the approximate heading error {{n}}° above the rate pointer (60)", heading_error)
            ]
        ];
    default:
        return [
            e6b.fmt("Heading correction to destination: {{n}} nm off course after flying {{n}} nm, {{n}} nm remaining",
                    dist_off_course, dist_flown, dist_remaining),
            e6b.fmt("Correction to intercept: {{n}}° ({{n}}° heading error and {{n}}° additional intercept angle)",
                    heading_error + intercept_angle, heading_error, intercept_angle),
            [
                e6b.fmt("Find the distance off course {{n}}  on the outer scale", dist_off_course),
                e6b.fmt("Rotate until the distance flown {{n}} nm appears on the inner scale below {{n}}", dist_flown, dist_off_course),
                e6b.fmt("Read the approximate heading error {{n}}° above the rate pointer (60)", heading_error),
                e6b.fmt("Rotate again until the distance remaining {{n}} nm appears on the inner scale below {{n}}",
                        dist_remaining, dist_off_course),
                e6b.fmt("Read the the approximate intercept angle {{n}}° above the rate pointer (60)", intercept_angle),
                e6b.fmt("Add {{n}}° heading error and {{n}}° intercept angle to get the total heading correction to destination {{n}}°",
                        heading_error, intercept_angle, heading_error+intercept_angle)
            ]
        ];
    }
};


/**
 * Calculator problem: distance to navaid
 */
e6b.problems.calc.advanced.distance_to_navaid = function () {

    // groundspeed and angle traversed
    var gs = e6b.rand(12, 31) * 5;
    var angle = e6b.rand(5, 15);

    // traversal time/distance
    var xtime = e6b.rand(2, Math.round(gs / 25) * (angle / 5));
    var xdist = Math.round((xtime / 60) * gs);

    // time/distance to navaid
    var dist = Math.round((60 / angle) * xdist);
    var time = Math.round((60 / angle) * xtime);

    // choose a navaid type
    if (e6b.rand(1, 2) == 1) {
        var type = "VOR";
        var bearing = "radial";
    } else {
        var type = "NDB";
        var bearing = "bearing";
    }

    if (e6b.rand(1, 2) == 1) {
        return [
            e6b.fmt("Distance to {{s}}: {{n}} kt groundspeed, {{s}} changes by {{n}}° in {{t}} flying perpendicular to the {{s}}",
                    type, gs, bearing, angle, xtime, bearing),
            e6b.fmt("Approximately {{n}} nm to the {{s}}", dist, type),
            [
                e6b.fmt("Rotate so that the rate pointer (60) points to the groundspeed {{n}} kt", gs),
                e6b.fmt("Find the traversal time {{t}} on the inner scale", xtime),
                e6b.fmt("Read the traversal distance, {{n}} nm, on the outer scale above {{n}}",
                        xdist, xtime),
                e6b.fmt("Rotate so that the rate pointer (60) points to the {{s}} change {{n}}°", bearing, angle),
                e6b.fmt("Read the approximate distance to the {{s}}, {{n}} nm, on the inner scale below {{n}} on the outer scale",
                        type, dist, xdist)
            ]
        ];
    } else {
        return [
            e6b.fmt("Time to {{s}} (no wind): {{s}} changes by {{n}}° in {{t}} flying perpendicular to the {{s}}",
                    type, bearing, angle, xtime, bearing),
            e6b.fmt("Approximately {{t}} to the {{s}}", time, type),
            [
                e6b.fmt("Rotate so that the rate pointer (60) points to the {{s}} change {{n}}°", bearing, angle),
                e6b.fmt("Find the time traversed, {{t}}, on the outer scale", xtime),
                e6b.fmt("Read the approximate time to the {{s}}, {{n}} ({{t}}), on the inner scale below {{n}} on the outer scale",
                        type, time, time, xtime)
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
    var litres = Math.round(gallons * 3.78541);
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
    var values = [distance_nm, Math.round(distance_nm * 1.15078), Math.round(distance_nm * 1.852)];
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
    var metres = Math.round(feet / 3.281);
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
    var gallons = Math.round(lb / 6.01 * 10) / 10;
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
        e6b.fmt("{{n}} × {{n}} = ?", n1, n2),
        e6b.fmt("{{n}}", Math.round(n1 * n2)),
        [
            e6b.fmt("Rotate so that the units pointer (10) on the inner scale is below {{n}} on the outer scale", n1),
            e6b.fmt("Find {{n}} on the inner scale", n2),
            e6b.fmt("Read the product {{n}} on the outer scale directly above {{n}}", Math.round(n1 * n2), n2)
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
        e6b.fmt("{{n}} ÷ {{n}} = ?", n1 * n2, n1),
        e6b.fmt("{{n}}", n2),
        [
            e6b.fmt("Find {{n}} on the outer scale", n1*n2),
            e6b.fmt("Rotate so that {{n}} appears on the inner scale directly below {{n}}", n1, n1*n2),
            e6b.fmt("Read the quotient {{n}} on the outer scale directly above the units pointer (10)", n2)
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
 * Check if we're locked to a specific problem type
 */
e6b.is_locked = function () {
    return !["", "#", "#basic", "#advanced"].includes(location.hash);
};


/**
 * Generate a random number between min and max-1
 */
e6b.rand = function(min, max) {
    return Math.round(Math.random() * (max - min) + min)
};


/**
 * Choose a random item from an object/dict
 *
 * If last_key is specified, avoid repetition.
 *
 * @param obj: the object (associated array) to choose a key from.
 * @param last_key: (optional) don't repeat this key
 */
e6b.rand_key = function (obj, last_key) {
    var keys = Object.keys(obj);
    var key;
    do {
        key = keys[keys.length * Math.random() << 0];
    } while (last_key && key == last_key);
    return key;
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

    var info;
    var problems = {};

    if (!e6b.is_locked()) {
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
        var key = e6b.rand_key(problems, e6b.current_key);
        e6b.update_key(key);
        info = problems[key]();
    } else {
        var f;
        var key = location.hash.substr(1);
        e6b.update_key(key);
        switch (e6b.type) {
        case 'wind':
            f = e6b.problems.wind.basic[key];
            if (!f) {
                f = e6b.problems.wind.advanced[key];
            }
            break;
        case 'calc':
            f = e6b.problems.calc.basic[key];
            if (!f) {
                f = e6b.problems.calc.advanced[key];
            }
            break;
        }
        if (f) {
            info = f();
        } else {
            console.error("No problem " + key + " found for the " + e6b.type + " side");
            return;
        }
    }
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
 * Update for a new key.
 */
e6b.update_key = function (key) {
    var node = document.getElementById('lock-link');
    var url = node.getAttribute("href");

    // update the #lock element so that we can lock to this problem
    if (url.indexOf('#') >= 0) {
        url = url.substring(0, url.indexOf('#'));
    }
    url += '#' + key;
    node.setAttribute("href", url);

    e6b.current_key = key;
};


/**
 * React to an input event (click, tap, key)
 */
e6b.input = function (event) {
    if (!('tagName' in event.target && event.target.tagName.toLowerCase() == 'a')) {
        if (e6b.nodes.answer.hidden) {
            e6b.nodes.answer.hidden = false;
            e6b.nodes.help.hidden = !e6b.show_help;
        } else {
            e6b.show_problem();
        }
    }
};



////////////////////////////////////////////////////////////////////////
// Hook to run the exercises
////////////////////////////////////////////////////////////////////////

window.addEventListener('load', function () {

    function setup_advanced_toggle () {
        var show_node = document.getElementById('show-advanced');
        var hide_node = document.getElementById('hide-advanced');

        function toggle_visibility () {
            var is_advanced = (location.hash == '#advanced');
            show_node.style.display = (is_advanced ? 'none' : 'block');
            hide_node.style.display = (is_advanced ? 'block' : 'none');
        }

        window.addEventListener('hashchange', toggle_visibility);
        
        toggle_visibility();
    }

    function setup_lock_toggle () {
        var lock_node = document.getElementById('lock');
        var unlock_node = document.getElementById('unlock');

        function toggle_visibility () {
            var is_locked = e6b.is_locked();
            lock_node.style.display = (is_locked ? 'none' : 'block');
            unlock_node.style.display = (is_locked ? 'block' : 'none');
        }

        window.addEventListener('hashchange', toggle_visibility);

        toggle_visibility();
    }


    // Add listeners for user input
    document.addEventListener('click', e6b.input, { 'passive': false });
    document.addEventListener('keypress', e6b.input, { 'passive': false });

    // Save pointers to specific nodes
    e6b.nodes.question = document.getElementById("question");
    e6b.nodes.answer = document.getElementById("answer");
    e6b.nodes.help = document.getElementById("help");
    e6b.nodes.help_steps = document.getElementById("help-steps");

    // Setup basic/advanced toggle
    setup_advanced_toggle();
    setup_lock_toggle();

    // Show the first problem
    e6b.show_problem();
});

// end
