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
const marginTop = 5;
const marginRight = 5;
const marginBottom = 100;
const marginLeft = 5;

const graphWidth = () => {
	let viewPortHeight = Math.min(document.documentElement.clientHeight || 0, window.innerHeight || 0);
	return Math.min(document.documentElement.clientWidth - 600, viewPortHeight);
};
const graphHeight = () => graphWidth();
const radius = () => (graphHeight() - marginTop - marginBottom) / 2;
const cx = () => graphWidth() / 2;
const cy = () => marginTop + ((graphHeight() - marginTop - marginBottom) / 2);

// Declare the radials scale
let rScale = (t) => t * radius();

function colorToPolarCoords (color) {
	let hsl = color.hsl();
	let radialHeight = window.inputParameters.variableOnRadialAxis == 'Lightness' ? hsl[2] : 1 - hsl[1];

	const angleRad = (hsl[0] - 90) * (Math.PI / 180); // rotate so 0° = up
	let polarPoint = {
		x: cx() + rScale(radialHeight) * Math.cos(angleRad),
		y: cy() + rScale(radialHeight) * Math.sin(angleRad)
	};
	return polarPoint;
}

function redraw() {
	// Set the chart size
	d3.select("#chart1")
		.attr("width", graphWidth())
	  .attr("height", graphHeight());

	drawGrid(12, "#dddddd", 0.25, 1);

	drawColorRangeLines("#chart1", window.colorRanges, window.showProceduralColors, "colorRangeLines");

	drawColorPoints("#chart1", window.proceduralColors, "circle", "proceduralColorCircle", window.showProceduralColors, 15);	
	drawColorPoints("#chart1", window.testColors, "rect", "testColors", window.showColorspaceTestColors, 20);	
	drawColorPoints("#chart1", window.referenceColors, "rect", "referenceColors", window.showReferenceColors, 10);	

	drawColorGridSVG(window.proceduralColors, window.inputParameters.pointsPerLine, "#procedural-colors-grid");
	drawColorGridSVG(window.referenceColors, window.inputParameters.pointsPerLine, "#reference-colors-grid");
}

function drawGrid(longitudalLines, color, innerRadius, outerRadius){
	const grid = d3.select("#chart1").selectAll("g.axis").data([null]);// bind a single dummy element

	const gridEnter = grid.enter()
		.append("g")
		.attr("class", "axis");

	const gridMerged = gridEnter.merge(grid)
		.attr("transform", `translate(${cx()}, ${cy()})`);
	
	// Latitudal "circles"
	const latitudalGridLines = gridMerged.selectAll("circle.latitudalGridLine")
		.data(d3.range(0, outerRadius + 0.01, innerRadius));		
	latitudalGridLines.join(
		enter => enter.append("circle")
			.attr("class", "latitudalGridLine")
			.attr("r", d => rScale(d))
			.attr("stroke", color)
			.attr("fill", "none"),
		update => update
			.attr("r", d => rScale(d)),
		exit => exit.remove()
	);

	// Longitudal lines
	const longitudalGridLines = gridMerged.selectAll("line.longitudalGridLine")
		.data(d3.range(0, 360, 360 / longitudalLines));		
	longitudalGridLines.join(
		enter => enter.append("line")
			.attr("class", "longitudalGridLine")
			.attr("stroke", color)
			.attr("x1", d => rScale(innerRadius) * Math.cos((d - 90) * Math.PI / 180))
			.attr("y1", d => rScale(innerRadius) * Math.sin((d - 90) * Math.PI / 180))
			.attr("x2", d => rScale(outerRadius) * Math.cos((d - 90) * Math.PI / 180))
			.attr("y2", d => rScale(outerRadius) * Math.sin((d - 90) * Math.PI / 180))
			.attr("fill", "none"),
		update => update
			.attr("x1", d => rScale(innerRadius) * Math.cos((d - 90) * Math.PI / 180))
			.attr("y1", d => rScale(innerRadius) * Math.sin((d - 90) * Math.PI / 180))
			.attr("x2", d => rScale(outerRadius) * Math.cos((d - 90) * Math.PI / 180))
			.attr("y2", d => rScale(outerRadius) * Math.sin((d - 90) * Math.PI / 180)),
		exit => exit.remove()
	);
}

function drawColorPoints(svgElement, data, elementType, className, visibility, pointSize){
	const elements = d3.select(svgElement).selectAll(`${elementType}.${className}`).data(data);
	const visibilityAttr = visibility ? "visible" : "hidden";
	const colorFunc = (d) => d.hex();

	if(elementType === "circle") {
		const x_func = (d) => {return colorToPolarCoords(d).x};
		const y_func = (d) => {return colorToPolarCoords(d).y};

		elements.join(
			enter => enter.append("circle")
				.attr("cx", x_func)
				.attr("cy", y_func)
				.attr("class", className)
				.attr("r", pointSize)
				.style("fill", colorFunc)
				.attr("visibility", visibilityAttr),
			update => update
				.attr("cx", x_func)
				.attr("cy", y_func)
				.attr("r", pointSize)
				.style("fill", colorFunc)
				.attr("visibility", visibilityAttr),
			exit => exit
				.remove()
		);
	} else if (elementType === "rect"){

		const x_func = (d) => {return colorToPolarCoords(d).x - pointSize / 2};
		const y_func = (d) => {return colorToPolarCoords(d).y - pointSize / 2};

		elements.join(
			enter => enter.append("rect")
				.attr("x", x_func)
				.attr("y", y_func)
				.attr("class", className)
				.attr("width", pointSize)
				.attr("height", pointSize)
				.attr("visibility", visibilityAttr)
				.style("fill", colorFunc),
			update => update
				.attr("x", x_func)
				.attr("y", y_func)
				.attr("width", pointSize)
				.attr("height", pointSize)
				.attr("visibility", visibilityAttr)
				.style("fill", colorFunc),
			exit => exit
				.remove()
		);
	}
}

function drawColorRangeLines(svgElement, ranges, visibility, className) {

	let polyLines = [];
	for (var i = 0; i < ranges.length; i++) {
		polyLines.push(evaluateColorRange(ranges[i], 40));
	}

	const lineFunc = d3.line()
		.x((d) => { return colorToPolarCoords(d).x }) 
		.y((d) => { return colorToPolarCoords(d).y }) 
		.curve(d3.curveMonotoneX);

	const color = "gray"
	const strokeWidth = 0.3;
	const visibilityAttr = visibility ? "visible" : "hidden"; 

	const paths = d3.select(svgElement).selectAll(`path.${className}`).data(polyLines);
	paths.join(
  	enter => enter.append("path")
    	.attr("class",className)
			.attr("stroke", color)
			.attr("stroke-width", strokeWidth)
			.attr("fill", "none")
			.attr("visibility", visibilityAttr)
			.attr("d", lineFunc),
		update => update
			.attr("d", lineFunc)
			.attr("visibility", visibilityAttr),
		exit => exit
			.remove()
    );
}

function drawColorGridSVG(colors, columns, id) {
  const svg = d3.select(id);
  const totalWidth = 280;
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

function update() {
	calculateProceduralColors();
	calculateTestColors();
	updateUI();
	redraw();
}

function saveColors(colors) {
	window.referenceColors = window.referenceColors.concat(colors);
	redraw();
}

function clearSavedColors() {
	window.referenceColors = [];
	update();
}

function copyColorsToClipboard(colors) {
	let hexCodes = colors.map(c => c.hex());
	let text = hexCodes.join("\n");
	setClipboardToText(text);
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

function init(){
	window.inputParameters = {
		variableOnRadialAxis: "Lightness",
		pointsPerLine: 4,
		hueCount: 2,
		hueTilt: -10, 
		hueOffset: 0,
		minValue: 0.25,
		maxValue: 0.9,
		
		lowSaturation: 0.12,
		midSaturation: 0.3,
		highSaturation: 0.5,
		colorSpace: "HSL",

		pointToColorConverter: pointToHSLColor,
	}
	window.showColorspaceTestColors = false;
	window.showProceduralColors = true;
	window.showReferenceColors = false;
	window.showSettings = false;
	//window.referenceColors = testReferenceColorsList.map(c => chroma(c));
	window.referenceColors = [];

	createUIElements();
	onUIChange = update;
	update();
}

function createUIElements() {
	window.updateRoutines = [];

	// Settings
	createCollapsableSection(
		"settings", 
		"left-panel", 
		"Settings", 
		onInput = () => {window.showSettings = !window.showSettings},
		openBind = () => window.showSettings
	);
	createRadioInput(
		idText = "radial-axis-input", 
		parentId = "settings", 
		options = ["Lightness","Saturation"], 
		titleText = "Secondary axis", 
		onInput = (value) => {window.inputParameters.variableOnRadialAxis = value}, 
		valueBind = () => window.inputParameters.variableOnRadialAxis
	);

	// Color space
	createControlGroup("color-space-controls", "settings", "Color space");

	createParagraph("colorspace-paragraph","color-space-controls", "-", valueBind = () => window.inputParameters.colorSpace)

	createCheckbox(
		idText = "colorspace-checkbox", 
		parentId = "color-space-controls", 
		titleText = "Show colorspace", 
		onInput = (value) => {window.showColorspaceTestColors = value; console.log(value)}, 
		valueBind = () => window.showColorspaceTestColors
	);

	// Procedural colors
	createCollapsableSection(
		"procedural-colors", 
		"left-panel", 
		"New colors", 
		onInput = () => {window.showProceduralColors = !window.showProceduralColors},
		openBind = () => window.showProceduralColors
	);

	const grid1 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	grid1.id = "procedural-colors-grid"
	document.getElementById("procedural-colors").append(grid1);

	createButton(
		idText = "save-btn", 
		parentId = "procedural-colors", 
		titleText = "Save", 
		onInput = () => {
			saveColors(window.proceduralColors);
			update();
	});

	createButton(
		idText = "copy-procedural-btn", 
		parentId = "procedural-colors", 
		titleText = "Copy", 
		onInput = () => {
			copyColorsToClipboard(window.proceduralColors);
			update();
	});

	// Reference colors
	createCollapsableSection(
		"reference-colors", 
		"left-panel", 
		"Saved colors", 
		onInput = () => {window.showReferenceColors = !window.showReferenceColors},
		openBind = () => window.showReferenceColors
	);
	
	const grid2 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	grid2.id = "reference-colors-grid";
	document.getElementById("reference-colors").append(grid2);

	createButton(
		idText = "paste-reference-btn", 
		parentId = "reference-colors", 
		titleText = "Copy", 
		onInput = () => {
			copyColorsToClipboard(window.proceduralColors);
			update();
	});

	createButton(
		idText = "copy-reference-btn", 
		parentId = "reference-colors", 
		titleText = "Paste", 
		onInput = () => {
			pasteColors();
			update();
	});

	createButton(
		idText = "clear-reference-btn", 
		parentId = "reference-colors", 
		titleText = "Clear", 
		onInput = () => {
			clearSavedColors();
			update();
	});

	// RIGHT SIDE

	// Color Group
	createControlGroup("color-groups-controls", "right-panel", "Color groups");
		createSliderElement(
			idText = "color-groups", 
			parentId = "color-groups-controls", 
			titleText = "Number of hue groups", 
			min = 0, 
			max = 20, 
			step = 1,
			onInput = (value) => {window.inputParameters.hueCount = Number(value)},
			valueBind = () => window.inputParameters.hueCount
	);	

	createSliderElement(
		idText = "colors-per-group", 
		parentId = "color-groups-controls", 
		titleText = "Colors per group", 
		min = 0, 
		max = 24, 
		step = 1,
		onInput = (value) => {window.inputParameters.pointsPerLine = Number(value)},
		valueBind = () => window.inputParameters.pointsPerLine
	);

	// Hue
	createControlGroup("hue-controls", "right-panel", "Hue");
	createSliderElement(
		idText = "hue-increment", 
		parentId = "hue-controls", 
		titleText = "Increment", 
		min = -180, 
		max = 180, 
		step = 1,
		onInput = (value) => {window.inputParameters.hueTilt = Number(value)},
		valueBind = () => window.inputParameters.hueTilt, 
		toDegree
	);

	createSliderElement(
		idText = "hue-offset", 
		parentId = "hue-controls", 
		titleText = "Offset", 
		min = -180, 
		max = 180, 
		step = 1,
		onInput = (value) => {window.inputParameters.hueOffset = Number(value)},
		valueBind = () => window.inputParameters.hueOffset, 
		toDegree
	);	

	// Saturation
	createControlGroup("saturation-controls", "right-panel", "Saturation");
	createSliderElement(
		idText = "dark-saturation", 
		parentId = "saturation-controls", 
		titleText = "Dark", 
		min = 0.01, 
		max = 1, 
		step = 0.01,
		onInput = (value) => {window.inputParameters.lowSaturation = Number(value)},
		valueBind = () => window.inputParameters.lowSaturation,
		formatLabel = toPercentage
	);	

	createSliderElement(
		idText = "mid-saturation", 
		parentId = "saturation-controls", 
		titleText = "Mid", 
		min = 0.01, 
		max = 1, 
		step = 0.01,
		onInput = (value) => {window.inputParameters.midSaturation = Number(value)},
		valueBind = () => window.inputParameters.midSaturation,
		formatLabel = toPercentage
	);	
	createSliderElement(
		idText = "high-saturation", 
		parentId = "saturation-controls", 
		titleText = "Lights", 
		min = 0.01, 
		max = 1, 
		step = 0.01,
		onInput = (value) => {window.inputParameters.highSaturation = Number(value)},
		valueBind = () => window.inputParameters.highSaturation,
		formatLabel = toPercentage
	);
	
	// Value
	createControlGroup("brightness-controls", "right-panel", "Brightness");
	createSliderElement(
		idText = "darkest-value", 
		parentId = "brightness-controls", 
		titleText = "Darkest value", 
		min = 0.01, 
		max = 1, 
		step = 0.01,
		onInput = (value) => {window.inputParameters.minValue = Number(value)},
		valueBind = () => window.inputParameters.minValue,
		formatLabel = toPercentage
	);

	createSliderElement(
		idText = "brightest-value", 
		parentId = "brightness-controls", 
		titleText = "Brightest value", 
		min = 0.01, 
		max = 1, 
		step = 0.01,
		onInput = (value) => {window.inputParameters.maxValue = Number(value)},
		valueBind = () => window.inputParameters.maxValue,
		formatLabel = toPercentage
	);
}

function toPercentage(value) {
	return Math.round(value * 100) + "%";
}

function toDegree(value) {
	return Math.round(value) + "°";
}

window.onresize = (event) => {
		update();
	}
window.onload = init;

