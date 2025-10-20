const testReferenceColorsList = [
	"#b21638",
	"#db8c8a",
	"#dad8c9",
	"#507ca7",
	"#364e5e",
	"#d3dfee",
	"#f6f6f7",
	"#292c33",
	"#929ba4",
	"#938a80",
	"#95a390",
	"#aeb398",
	"#dad8c9",
	"#d1b56d",
	"#938a80",
	"#74a372",
	"#97b074",
	"#d1c99f",
	"#ebc35e",
	"#938a80",
];

// Declare the chart dimensions and margins.
const width = 900;
const height = 800;
const marginTop = 50;
const marginRight = 50;
const marginBottom = 50;
const marginLeft = 50;
const dotRadius = 15;

const radius = (height - marginTop - marginBottom) / 2;
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
	let hsl = color.hsl();
	let point = {
		x: hsl[0],
		y: hsl[1],
		z: hsl[2]
	}

	let yVariable = window.inputParameters.vizMode == 'hueVsLightness' ? point.z : 1 - point.y;

    const angleRad = (point.x - 90) * (Math.PI / 180); // rotate so 0° = up
    let polarPoint = {
      x: cx + rScale(yVariable) * Math.cos(angleRad),
      y: cy + rScale(yVariable) * Math.sin(angleRad)
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
	let points = window.proceduralColors;
	let guideCurves = [];
	for (var i = 0; i < window.colorRanges.length; i++) {
		guideCurves.push(
			evaluateColorRange(window.colorRanges[i], 40)
		);
	}

	const svg = d3.select("#chart1");

	// Draw procedural guide curves
	const line = d3.line()
        .x(function(d) { 
        	return scalePolar(d).x 
        }) 
        .y(function(d) { 
        	return scalePolar(d).y 
        }) 
        .curve(d3.curveMonotoneX);

    let guideCurveColor= chroma.hsl(0,0,0.3);
	const guideCurvePaths = svg.selectAll("path.guideCurves").data(guideCurves);
	guideCurvePaths.join(
      enter => enter.append("path")
      	.attr("class","guideCurves")
		.attr("stroke", guideCurveColor)
		.attr("stroke-width", 0.2)
		.attr("fill", "none")
		.attr("visibility", window.showProceduralColors ? "visible" : "hidden")
		.attr("d", line),
      update => update
		.attr("d", line)
		.attr("visibility", window.showProceduralColors ? "visible" : "hidden"),
      exit => exit
        .remove()
    );

	// Draw procedural colors 
	const proceduralColors = svg.selectAll("circle.proceduralColorCircle").data(points);
	proceduralColors.join(
      enter => enter.append("circle")
        .attr("cx", function (d) { return scalePolar(d).x })
        .attr("cy", function (d) { return scalePolar(d).y })
        .attr("class", "proceduralColorCircle")
        .attr("r", dotRadius)
        .style("fill", function (d) {return d.hex()})
        .attr("visibility", window.showProceduralColors ? "visible" : "hidden"),
      update => update
        .attr("cx", function (d) { return scalePolar(d).x })
        .attr("cy", function (d) { return scalePolar(d).y })
        .attr("r", dotRadius)
        .style("fill", function (d) {return d.hex()})
        .attr("visibility", window.showProceduralColors ? "visible" : "hidden"),
      exit => exit
        .remove()
    );

    // Draw reference colors
    const referenceColors = svg.selectAll("rect.referenceColors").data(window.referenceColors);
   	referenceSquareSide = 20;
	referenceColors.join(
      enter => enter.append("rect")
        .attr("x", function (d) { return scalePolar(d).x - referenceSquareSide / 2})
        .attr("y", function (d) { return scalePolar(d).y - referenceSquareSide / 2})
        .attr("class", "referenceColors")
        .attr("width", referenceSquareSide)
        .attr("height", referenceSquareSide)
        .attr("visibility", window.showReferenceColors ? "visible" : "hidden")
        .style("fill", function (d) {return d.hex()}),
      update => update
        .attr("x", function (d) { return scalePolar(d).x - referenceSquareSide / 2})
        .attr("y", function (d) { return scalePolar(d).y - referenceSquareSide / 2})
        .attr("width", referenceSquareSide)
        .attr("height", referenceSquareSide)
        .attr("visibility", window.showReferenceColors ? "visible" : "hidden")
        .style("fill", function (d) {return d.hex()}),
      exit => exit
        .remove()
    );

    // Draw test colors
    const testColorCircles = svg.selectAll("circle.testColors").data(window.testColors);
   	let testColorRadius = 20;
	testColorCircles.join(
      enter => enter.append("circle")
        .attr("cx", function (d) { return scalePolar(d).x })
        .attr("cy", function (d) { return scalePolar(d).y })
        .attr("class", "testColors")
        .attr("r", testColorRadius)
        .style("fill", function (d) {return d.hex()})
        .attr("visibility", window.showColorspaceTestColors ? "visible" : "hidden"),
      update => update
        .attr("cx", function (d) { return scalePolar(d).x })
        .attr("cy", function (d) { return scalePolar(d).y })
        .attr("r", testColorRadius)
        .style("fill", function (d) {return d.hex()})
        .attr("visibility", window.showColorspaceTestColors ? "visible" : "hidden"),
      exit => exit
        .remove()
    );

	// Draw color grids
    drawColorGridSVG(points, window.inputParameters.pointsPerLine, "#colorGridSVG");
    drawColorGridSVG(window.referenceColors, window.inputParameters.pointsPerLine, "#savedColorsSVG");
}

function drawColorGridSVG(colors, columns, id) {
  if(colors.length == 0) return;

  const svg = d3.select(id);
  const totalWidth = 200;
  const padding = 1;
  const cellHeight = 30;
  const yPadding = 6;

  const cellWidth = (totalWidth - padding * (columns - 1)) / columns;
  const rows = Math.ceil(colors.length / columns);
  const totalHeight = rows * (cellHeight + yPadding);
  
  svg.attr("width", totalWidth)
     .attr("height", totalHeight);
  
  const cells = svg.selectAll("rect")
    .data(colors)
    .join("rect")
    .attr("width", cellWidth)
    .attr("height", cellHeight)
    .attr("x", (d, i) => (i % columns) * (cellWidth + padding))
    .attr("y", (d, i) => Math.floor(i / columns) * (cellHeight + yPadding))
    .attr("fill", d => d);
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
function pointToHSVColor(pt) {
	return chroma.hsv(pt[0],pt[1],pt[2])
}

function HSVcolorToPoint(col) {
	return {x: col.hsv()[0], y: col.hsv()[1], z: col.hsv()[2]};
}

function pointToHSLColor(pt) {
	return chroma.hsl(pt[0],pt[1],pt[2])
}

function HSLcolorToPoint(col) {
	return {x: col.hsl()[0], y: col.hsl()[1], z: col.hsl()[2]};
}

// Color generation
function evaluateColorRange(colorRange, divisions) {
	let points = [];

	for (var i = 0; i < divisions - 1; i++) {
		let col = interpolatePolyLine(i/(divisions - 1), colorRange)
		points.push(col);
	}
	points.push(interpolatePolyLine(1,colorRange));

	let colors = points.map(c => window.inputParameters.pointToColorConverter(c))
	return colors;
}

function generateColorRanges(amount, hueRotation, tilt, minLightness, maxLightness, lowSat, midSat, highSat) {
	let lines = [];

	for(var i = 0; i < amount; i++) {
		
		/* TODO: Smooth interpolation
		
		const smoothInterpolation = d3.scaleLinear()
		  .domain([0, 0.5, 1])
		  .range([low, mid, high])
		  .interpolate(d3.interpolateCubic); // or d3.interpolateRgb, etc.
		*/


		let startColor = [
			360 * (i/amount) + (hueRotation - tilt / 2), // Hue
			highSat, // Sat
			maxLightness // Lightness
		];

		let endColor = [
			startColor[0] + tilt,
			lowSat, 
			minLightness
		];

		let midcolor = interpolateLine(0.5, startColor, endColor);
		midcolor[1] = midSat;

		lines.push([
			startColor,
			midcolor,
			endColor
		])
	}
	return lines;
}

function calculateTestColors() {
	window.testColors = [];

	let testColorDepth = 5;
	let testColorHues = 12;
	let testColorRanges = [];

	testColorRanges = testColorRanges.concat(
			testColorRanges,
			generateColorRanges(
							testColorHues, 
							0,
							0,
							0.1,
							0.9,
							0.99,
							0.99,
							0.99
							)); 

	for (var i = testColorRanges.length - 1; i >= 0; i--) {
		let colors = evaluateColorRange(testColorRanges[i], testColorDepth);
		window.testColors = window.testColors.concat(colors);
	}
}

function calculateProceduralColors() {
	window.proceduralColors = [];

	window.colorRanges = generateColorRanges(
							window.inputParameters.hueCount, 
							window.inputParameters.hueOffset,
							window.inputParameters.hueTilt,
							window.inputParameters.minValue,
							window.inputParameters.maxValue,
							window.inputParameters.lowSaturation,
							window.inputParameters.midSaturation,
							window.inputParameters.highSaturation
							); 

	for (var i = window.colorRanges.length - 1; i >= 0; i--) {
		let colors = evaluateColorRange(window.colorRanges[i], window.inputParameters.pointsPerLine);
		window.proceduralColors = window.proceduralColors.concat(colors);
	}
}

function updateColorDisplay() {
	calculateProceduralColors();
	calculateTestColors();
	updateGraph();
}

function saveColors(colors) {
	window.referenceColors = window.referenceColors.concat(colors);
	updateGraph();
}

function clearSavedColors() {
	window.referenceColors = [];
	updateGraph();
}

function copyColorsToClipboard(colors) {
	let hexCodes = colors.map(c => c.hex());
	let text = hexCodes.join("\n");
	setClipboard(text);
}

async function pasteColors() {
	
	await navigator.clipboard.readText().then(t => {
		console.log(t);
		let lines = t.split("\n");
		let hex = lines.filter(line => chroma.valid(line.trim()));
		let colorsToSave = hex.map(c => chroma(c));
		saveColors(colorsToSave);
	});
}


async function setClipboard(text) {
  const type = "text/plain";
  const clipboardItemData = {
    [type]: text,
  };
  const clipboardItem = new ClipboardItem(clipboardItemData);
  await navigator.clipboard.write([clipboardItem]);
}

function init(){
	window.inputParameters = {
		vizMode: "hueVsLightness",
		pointsPerLine: 4,
		hueCount: 2,
		hueTilt: -10, 
		hueOffset: 0,
		minValue: 0.25,
		maxValue: 0.9,
		
		lowSaturation: 0.12,
		midSaturation: 0.3,
		highSaturation: 0.5,

		pointToColorConverter: pointToHSLColor,
	}

	window.showColorspaceTestColors = false;
	window.showProceduralColors = true;
	window.showReferenceColors = false;


	//window.referenceColors = testReferenceColorsList.map(c => chroma(c));
	window.referenceColors = [];

	prepareInputs();
	initGraph();
	updateColorDisplay();
	updateGraph();
	updateUI();
}

function prepareInputs () {
	// Color headings
	document.getElementById("referenceColor-heading").addEventListener("click", (event) => {
		window.showReferenceColors = !window.showReferenceColors;
		updateColorDisplay();
		updateUI();
	});	

	document.getElementById("proceduralColors-heading").addEventListener("click", (event) => {
		window.showProceduralColors = !window.showProceduralColors;
		updateColorDisplay();
		updateUI();
	});	

	document.getElementById("colorspaceTestColors-heading").addEventListener("click", (event) => {
		window.showColorspaceTestColors = !window.showColorspaceTestColors;
		updateColorDisplay();
		updateUI();
	});	

	// Buttons

	document.getElementById("copyColors-button").addEventListener("click", (event) => {
		copyColorsToClipboard(window.proceduralColors);
	});		

	document.getElementById("copyReferenceColors-button").addEventListener("click", (event) => {
		copyColorsToClipboard(window.referenceColors);
	});		

	document.getElementById("pasteColors-button").addEventListener("click", (event) => {
		pasteColors();
	});		

	document.getElementById("saveColors-button").addEventListener("click", (event) => {
		saveColors(window.proceduralColors);
	});			

	document.getElementById("clearSavedColors-button").addEventListener("click", (event) => {
		clearSavedColors();
	});		

	// Sliders
	document.getElementById("lowSaturation-input").addEventListener("input", (event) => {
		window.inputParameters.lowSaturation = Number(event.target.value);
		updateColorDisplay();
		updateUI();
	});	

	document.getElementById("midSaturation-input").addEventListener("input", (event) => {
		window.inputParameters.midSaturation = Number(event.target.value);
		updateColorDisplay();
		updateUI();
	});	

	document.getElementById("highSaturation-input").addEventListener("input", (event) => {
		window.inputParameters.highSaturation = Number(event.target.value);
		updateColorDisplay();
		updateUI();
	});	

	document.getElementById("pointsPerLine-input").addEventListener("input", (event) => {
		window.inputParameters.pointsPerLine = Number(event.target.value);
		updateColorDisplay();
		updateUI();
	});	

	document.getElementById("hueCount-input").addEventListener("input", (event) => {
		window.inputParameters.hueCount = Number(event.target.value);
		updateColorDisplay();
		updateUI();
	});

	document.getElementById("hueTilt-input").addEventListener("input", (event) => {
		window.inputParameters.hueTilt = Number(event.target.value);
		updateColorDisplay();
		updateUI();
	});

	document.getElementById("hueOffset-input").addEventListener("input", (event) => {
		window.inputParameters.hueOffset = Number(event.target.value);
		updateColorDisplay();
		updateUI();
	});

	document.getElementById("minValue-input").addEventListener("input", (event) => {
		window.inputParameters.minValue = Number(event.target.value);
		updateColorDisplay();
		updateUI();
	});

	document.getElementById("maxValue-input").addEventListener("input", (event) => {
		window.inputParameters.maxValue = Number(event.target.value);
		updateColorDisplay();
		updateUI();
	});

	// Radio options
	document.getElementById("hueVsLightness-input").addEventListener("input", (event) => {
		window.inputParameters.vizMode = "hueVsLightness";
		updateColorDisplay();
		updateUI();
	});	

	document.getElementById("hueVsSaturation-input").addEventListener("input", (event) => {
		window.inputParameters.vizMode = "hueVsSaturation";
		updateColorDisplay();
		updateUI();
	});

	updateUI();
}

function toPercentage(value) {
	return Math.round(value * 100) + "%";
}

function updateUI() {

	// Controls
	document.getElementById("lowSaturation-input").value = inputParameters.lowSaturation;
	document.getElementById("lowSaturation-label").textContent = toPercentage(inputParameters.lowSaturation);
	document.getElementById("midSaturation-input").value = window.inputParameters.midSaturation;
	document.getElementById("midSaturation-label").textContent = toPercentage(window.inputParameters.midSaturation);
	document.getElementById("highSaturation-input").value = window.inputParameters.highSaturation;
	document.getElementById("highSaturation-label").textContent = toPercentage(window.inputParameters.highSaturation);
	document.getElementById("pointsPerLine-input").value = window.inputParameters.pointsPerLine;
	document.getElementById("pointsPerLine-label").textContent = window.inputParameters.pointsPerLine;
	document.getElementById("hueCount-input").value = window.inputParameters.hueCount;
	document.getElementById("hueCount-label").textContent = window.inputParameters.hueCount;
	document.getElementById("hueTilt-input").value = window.inputParameters.hueTilt;
	document.getElementById("hueTilt-label").textContent = window.inputParameters.hueTilt  + "°";
	document.getElementById("hueOffset-input").value = window.inputParameters.hueOffset;
	document.getElementById("hueOffset-label").textContent = window.inputParameters.hueOffset + "°";
	document.getElementById("minValue-input").value = window.inputParameters.minValue;
	document.getElementById("minValue-label").textContent = toPercentage(window.inputParameters.minValue);
	document.getElementById("maxValue-input").value = window.inputParameters.maxValue;
	document.getElementById("maxValue-label").textContent = toPercentage(window.inputParameters.maxValue);

	// Labels
	document.getElementById("referenceColor-heading").style.color = window.showReferenceColors ? "black" : "gray";
	document.getElementById("savedColorsSVG").style.display = window.showReferenceColors ? "block" : "none";

	document.getElementById("proceduralColors-heading").style.color = window.showProceduralColors ? "black" : "gray";
	document.getElementById("colorGridSVG").style.display = window.showProceduralColors ? "block" : "none";

	document.getElementById("colorspaceTestColors-heading").style.color = window.showColorspaceTestColors ? "black" : "gray";
}

window.onload = init;

