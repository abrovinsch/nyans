const oskarColorTheme = [
	"#b21638",
	"#db8c8a",
	"#dad8c9",
	"#507ca7",
	"#364e5e"
];

// Declare the chart dimensions and margins.
const width = 1000;
const height = 750;
const marginTop = 30;
const marginRight = 30;
const marginBottom = 30;
const marginLeft = 30;
const radius = height / 2;
const dotRadius = 15;
const cx = width / 2;
const cy = height / 2;

// Declare the x (horizontal position) scale.
const xScale = d3.scaleLinear()
    .domain([0, 360])
    .range([marginLeft, width - marginRight]);

// Declare the y (vertical position) scale.
const yScale = d3.scaleLinear()
    .domain([0, 1])
    .range([height - marginBottom, marginTop]);

const rScale = d3.scaleLinear().domain([0, 1]).range([0, radius]);

function scalePolar (color) {

	let point = window.inputParameters.colorToPointConverter(color);
    const angleRad = (point.x - 90) * (Math.PI / 180); // rotate so 0° = up
    let polarPoint = {
      x: cx + rScale(point.y) * Math.cos(angleRad),
      y: cy + rScale(point.y) * Math.sin(angleRad)
    };
    return polarPoint;
  }

function initGraph() {

	// Select the SVG container.
	const svg = d3.select("#chart1");

	svg.attr("width", width)
	    .attr("height", height);

	const grid = svg.append("g")
	    .attr("class", "axis")
	    .attr("transform", `translate(${cx},${cy})`);

	let gridColor = chroma.hsl(0,0,0.9);

	grid.selectAll("circle.grid")
		.data(d3.range(0, 1.01, 0.25))
		.join("circle")
		.attr("r", d => rScale(d))
		.attr("stroke", gridColor)
		.attr("fill", "none");

	grid.selectAll("line.angle")
		  .data(d3.range(0, 360, 30))
		  .join("line")
		  .attr("x1", d => rScale(0.25) * Math.cos((d - 90) * Math.PI / 180))
		  .attr("y1", d => rScale(0.25) * Math.sin((d - 90) * Math.PI / 180))
		  .attr("x2", d => rScale(1) * Math.cos((d - 90) * Math.PI / 180))
		  .attr("y2", d => rScale(1) * Math.sin((d - 90) * Math.PI / 180))
		  .attr("stroke", gridColor);
}

function updateGraph() {
	let points = window.colorPoints;
	let guideCurves = [];
	for (var i = 0; i < window.colorRanges.length; i++) {
		guideCurves.push(
			evaluateColorRange(window.colorRanges[i], 10)
		);
	}

	const svg = d3.select("#chart1");

	// Update curves
	const line = d3.line()
        .x(function(d) { 
        	//let col = window.inputParameters.pointToColorConverter(d);
        	return scalePolar(d).x 
        }) 
        .y(function(d) { 
        	//let col = window.inputParameters.pointToColorConverter(d);
        	return scalePolar(d).y 
        }) 
        .curve(d3.curveMonotoneX);

    let guideCurveColor= chroma.hsl(0,0,0.3);
	const curves = svg.selectAll("path.guideCurves").data(guideCurves);
	curves.join(
      enter => enter.append("path")
      	.attr("class","guideCurves")
		.attr("stroke", guideCurveColor)
		.attr("stroke-width", 0.2)
		.attr("fill", "none")
		.attr("d", line),
      update => update
		.attr("d", line),
      exit => exit
        .remove()
    );

	// Update dots
	const dots = svg.selectAll("circle.proceduralColorCircle").data(points);
	dots.join(
      enter => enter.append("circle")
        .attr("cx", function (d) { return scalePolar(d).x })
        .attr("cy", function (d) { return scalePolar(d).y })
        .attr("class", "proceduralColorCircle")
        .attr("r", dotRadius)
        .style("fill", function (d) {return d.hex()}),
      update => update
        .attr("cx", function (d) { return scalePolar(d).x })
        .attr("cy", function (d) { return scalePolar(d).y })
        .attr("r", dotRadius)
        .style("fill", function (d) {return d.hex()}),
      exit => exit
        .remove()
    );

    let list = d3.select("#colorList");

    list.selectAll("li")
	  .data(points)
	  .join("li")
	  .style('background-color',d => d.hex());
}

// Geometry
function dist(a, b) {
	const dx = a[0] - b[0];
	const dy = a[1] - b[1];
	const dz = a[2] - b[2];
	return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function interpolatePolyLine(v, points) {
	// v should be in range [0, 1] for the entire polyline
	// Calculate total distance
	let totalDistance = 0;
	const distances = [0];
	
	for (let i = 0; i < points.length - 1; i++) {
		const dx = points[i + 1][0] - points[i][0];
		const dy = points[i + 1][1] - points[i][1];
		const dz = points[i + 1][2] - points[i][2];
		const segmentDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);
		totalDistance += segmentDistance;
		distances.push(totalDistance);
	}
	
	// Find target distance along polyline
	const targetDistance = v * totalDistance;
	
	// Find which segment contains this distance
	let segmentIndex = 0;
	for (let i = 0; i < distances.length - 1; i++) {
		if (targetDistance >= distances[i] && targetDistance <= distances[i + 1]) {
			segmentIndex = i;
			break;
		}
	}
	
	// Calculate v value within this segment
	const segmentStart = distances[segmentIndex];
	const segmentEnd = distances[segmentIndex + 1];
	const segmentLength = segmentEnd - segmentStart;
	const segmentV = segmentLength > 0 ? (targetDistance - segmentStart) / segmentLength : 0;
	
	// Interpolate within the segment
	return interpolateLine(segmentV, points[segmentIndex], points[segmentIndex + 1]);
}

function interpolateLine(v, lineStartPoint, lineEndPoint) {
	const x = (lineEndPoint[0]-lineStartPoint[0]) * v + lineStartPoint[0]; 
	const y = (lineEndPoint[1]-lineStartPoint[1]) * v + lineStartPoint[1];
	const z = (lineEndPoint[2]-lineStartPoint[2]) * v + lineStartPoint[2];
	return [x, y, z];
}

// Color space

function pointToHSV_defaultSaturation(pt) {
	return chroma.hsv(pt[0],window.inputParameters.saturation,pt[1])
}

function HSVcolorToPoint_defaultSaturation(col) {
	return {x: col.hsv()[0], y: col.hsv()[2]};
}

function pointToHSL_defaultSaturation(pt) {
	return chroma.hsl(pt[0],window.inputParameters.saturation,pt[1])
}

function HSLcolorToPoint_defaultSaturation(col) {
	return {x: col.hsl()[0], y: col.hsl()[2]};
}

function pointToRGB_defaultG(pt) {
	return chroma.rgb(pt[0],window.inputParameters.saturation,pt[1])
}

function RGBcolorToPoint_defaultG(col) {
	return {x: col.rgb()[0], y: col.rgb()[2]};
}

// Color generation
function evaluateColorRange(colorRange, divisions) {
	let points = [];
	points.push(colorRange[1]);
	for (var i = divisions - 1; i >= 0; i--) {
		let col = interpolatePolyLine(i/divisions, colorRange)
		points.push(col);
	}

	let colors = points.map(c => window.inputParameters.pointToColorConverter(c))
	return colors;
}

function generateColorRanges(amount, offset, tilt, minValue, maxValue) {
	let lines = [];

	for(var i = 0; i < amount; i++) {
		startHue = 360 * (i/amount) + offset;
		if(startHue > 360) startHue - 360;
		endHue = startHue + tilt;
		lines.push([
			[startHue, maxValue, 0],
			[endHue, minValue, 0]
		])
	}
	return lines;
}

function calculateColors() {
	window.colorPoints = []

	window.colorRanges = generateColorRanges(
							window.inputParameters.hueCount, 
							window.inputParameters.hueOffset,
							window.inputParameters.hueTilt,
							window.inputParameters.minValue,
							window.inputParameters.maxValue
							); 

	for (var i = window.colorRanges.length - 1; i >= 0; i--) {
		let colors = evaluateColorRange(window.colorRanges[i], window.inputParameters.pointsPerLine);
		window.colorPoints = window.colorPoints.concat(colors);
	}

	updateGraph();
}

function init(){
	window.inputParameters = {
		pointsPerLine: 3,
		saturation: 0.9,
		hueCount: 1,
		hueTilt: 10, 
		hueOffset: 20,
		minValue: 0.4,
		maxValue: 0.99,
		pointToColorConverter: pointToHSL_defaultSaturation,
		colorToPointConverter: HSLcolorToPoint_defaultSaturation	
	}
	prepareInputs();
	calculateColors();
	initGraph();
	updateGraph();
	updateLabels();
}

function prepareInputs () {
	// Saturation Slider
	document.getElementById("saturation-input").addEventListener("input", (event) => {
		window.inputParameters.saturation = Number(event.target.value);
		calculateColors();
		updateLabels();
	});	

	document.getElementById("pointsPerLine-input").addEventListener("input", (event) => {
		window.inputParameters.pointsPerLine = Number(event.target.value);
		calculateColors();
		updateLabels();
	});	

	document.getElementById("hueCount-input").addEventListener("input", (event) => {
		window.inputParameters.hueCount = Number(event.target.value);
		calculateColors();
		updateLabels();
	});

	document.getElementById("hueTilt-input").addEventListener("input", (event) => {
		window.inputParameters.hueTilt = Number(event.target.value);
		calculateColors();
		updateLabels();
	});

	document.getElementById("hueOffset-input").addEventListener("input", (event) => {
		window.inputParameters.hueOffset = Number(event.target.value);
		calculateColors();
		updateLabels();
	});

	document.getElementById("minValue-input").addEventListener("input", (event) => {
		window.inputParameters.minValue = Number(event.target.value);
		calculateColors();
		updateLabels();
	});

	document.getElementById("maxValue-input").addEventListener("input", (event) => {
		window.inputParameters.maxValue = Number(event.target.value);
		calculateColors();
		updateLabels();
	});

	updateLabels();
}


function updateLabels() {
	document.getElementById("saturation-label").textContent = window.inputParameters.saturation;
	document.getElementById("pointsPerLine-label").textContent = window.inputParameters.pointsPerLine;
	document.getElementById("hueCount-label").textContent = window.inputParameters.hueCount;
	document.getElementById("hueTilt-label").textContent = window.inputParameters.hueTilt;
	document.getElementById("hueOffset-label").textContent = window.inputParameters.hueOffset;
	document.getElementById("minValue-label").textContent = window.inputParameters.minValue;
	document.getElementById("maxValue-label").textContent = window.inputParameters.maxValue;
	//updateColorList();
}

window.onload = init;

