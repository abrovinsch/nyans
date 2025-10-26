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
const marginTop = 25;
const marginRight = 25;
const marginBottom = 25;
const marginLeft = 25;

const graphWidth = () => {
	return cachedgraphWidth;
};
const graphHeight = () => {
	return cachedGraphHeight;
}

function calculateGraphHeight() {
	let viewPortHeight = Math.min(document.documentElement.clientHeight || 0, window.innerHeight || 0);
	return Math.min(viewPortHeight - 100, graphWidth());
}

const radius = () => (graphHeight() - marginTop - marginBottom) / 2;
const cx = () => graphWidth() / 2;
const cy = () => marginTop + ((graphHeight() - marginTop - marginBottom) / 2);

// Declare the radials scale
let polarHeightScale = (t) => t * radius();
let xScale = (t) => marginLeft + (t /360) * (graphWidth() - marginRight - marginLeft);
let yScale = (t) => marginTop + (1-t) * (graphHeight() - marginTop - marginBottom);

function HeightComponentOfHSL(hsl) {
	return window.inputParameters.variableOnRadialAxis == 'Lightness' ? hsl[2] : 1 - hsl[1];
}

function colorToChartCoordinate(color) {
	let hsl = color.hsl();
	let radialHeight = HeightComponentOfHSL(hsl);
	return window.inputParameters.chartCoordinateTransformer(hsl[0], radialHeight);
}

function referencePointToChartCoordinate(refPoint){
	let y = HeightComponentOfHSL(chroma(refPoint.colorHex).hsl());
	let targetHue = refPoint.hue;
	return window.inputParameters.chartCoordinateTransformer(refPoint.hue, y); 
}

function cartesianChartCoordinate(x, y) {
	return {x: xScale(x), y: yScale(y)};
}

function polarChartCoordinate (x, y) {
	const angleRad = (x - 90) * (Math.PI / 180); // rotate so 0° = up
	let polarPoint = {
		x: cx() + polarHeightScale(y) * Math.cos(angleRad),
		y: cy() + polarHeightScale(y) * Math.sin(angleRad)
	};
	return polarPoint;
}

function redraw() {
	// Set the chart size
	d3.select("#chart1")
		.attr("width", graphWidth())
	  .attr("height", graphHeight());

	drawGrid(40, 6, "#dddddd", 0.01, 1);

	drawColorRangeLines("#chart1", window.colorRanges, window.showProceduralColors, "colorRangeLines");

	drawColorPoints("#chart1", window.proceduralColors, "circle", "proceduralColorCircle", window.showProceduralColors, 15);	
	drawColorPoints("#chart1", window.testColors, "rect", "testColors", window.showColorspaceTestColors, 20);	
	drawColorPoints("#chart1", window.referenceColors, "rect", "referenceColors", window.showReferenceColors, 10);

	drawReferencePoints("#chart1", window.altColorSpacePoints, "circle", "referenceColors", window.showAltColorSpace, 9);	
	
	drawColorGridSVG(window.proceduralColors, window.inputParameters.pointsPerLine, "#procedural-colors-grid");
	drawColorGridSVG(window.referenceColors, window.inputParameters.pointsPerLine, "#reference-colors-grid");
}

function drawGrid(longitudalLines, heightLines, color, innerRadius, outerRadius){
	const grid = d3.select("#chart1").selectAll("g.axis").data([null]);// bind a single dummy element
	const epsilon = 0.001;

	const gridEnter = grid.enter()
		.append("g")
		.attr("class", "axis");

	const gridMerged = gridEnter.merge(grid);
	let heightsForLines = d3.range(innerRadius, outerRadius, (outerRadius - innerRadius - epsilon) / heightLines)
	const heightPolyLines = heightsForLines.map(
		(y) => {
			let xVals = d3.range(0, 360, (360 - epsilon) / 90);
			let result = xVals.map((xVal) => [xVal, y]);
			return result;
		}
	);
	const lineFunc = d3.line()
		.x((d) => { return window.inputParameters.chartCoordinateTransformer(d[0],d[1]).x }) 
		.y((d) => { return window.inputParameters.chartCoordinateTransformer(d[0],d[1]).y }) 
		.curve(d3.curveMonotoneX);

	drawChartPolyLine(gridMerged, heightPolyLines, lineFunc, color, 1, true, "heightGridLine");

	// Longitudal lines
	const longitudalGridLines = gridMerged.selectAll("line.longitudalGridLine")
		.data(d3.range(0, 360, (360 -.01) / longitudalLines));		
	longitudalGridLines.join(
		enter => enter.append("line")
			.attr("class", "longitudalGridLine")
			.attr("stroke", color)
			.attr("x1", d => window.inputParameters.chartCoordinateTransformer(d, innerRadius).x)
			.attr("y1", d => window.inputParameters.chartCoordinateTransformer(d, innerRadius).y)
			.attr("x2", d => window.inputParameters.chartCoordinateTransformer(d, outerRadius).x)
			.attr("y2", d => window.inputParameters.chartCoordinateTransformer(d, outerRadius).y)
			.attr("fill", "none"),
		update => update
			.attr("x1", d => window.inputParameters.chartCoordinateTransformer(d, innerRadius).x)
			.attr("y1", d => window.inputParameters.chartCoordinateTransformer(d, innerRadius).y)
			.attr("x2", d => window.inputParameters.chartCoordinateTransformer(d, outerRadius).x)
			.attr("y2", d => window.inputParameters.chartCoordinateTransformer(d, outerRadius).y),
		exit => exit.remove()
	);
}

function drawXYPoints(svgElement, data, elementType, className, visibility, pointSize, xFunc, yFunc, colorFunc, border=0){
	const elements = d3.select(svgElement).selectAll(`${elementType}.${className}`).data(data);
	const visibilityAttr = visibility ? "visible" : "hidden";
	if(elementType === "circle") {
		elements.join(
			enter => enter.append("circle")
				.attr("cx", xFunc)
				.attr("cy", yFunc)
				.attr("class", className)
				.attr("r", pointSize)
				.style("fill", colorFunc)
				.style("stroke-width", border)
				.style("stroke", "black")
				.attr("visibility", visibilityAttr),
			update => update
				.attr("cx", xFunc)
				.attr("cy", yFunc)
				.attr("r", pointSize)
				.style("fill", colorFunc)
				.attr("visibility", visibilityAttr),
			exit => exit
				.remove()
		);
	} else if (elementType === "rect"){
		elements.join(
			enter => enter.append("rect")
				.attr("x", (d) => xFunc(d) - pointSize / 2)
				.attr("y", (d) => yFunc(d) - pointSize / 2)
				.attr("class", className)
				.attr("width", pointSize)
				.attr("height", pointSize)
				.attr("visibility", visibilityAttr)
				.style("fill", colorFunc)
				.style("stroke-width", border)
				.style("stroke", "black"),
			update => update
				.attr("x", (d) => xFunc(d) - pointSize / 2)
				.attr("y", (d) => yFunc(d) - pointSize / 2)
				.attr("width", pointSize)
				.attr("height", pointSize)
				.attr("visibility", visibilityAttr)
				.style("fill", colorFunc),
			exit => exit
				.remove()
		);
	}
}

function drawColorPoints(svgElement, data, elementType, className, visibility, pointSize){
	const colorFunc = (d) => sampleColorSystemFromHSL(window.altColorSpacePoints, d).hex();
	const x_func = (d) => colorToChartCoordinate(d).x;
	const y_func = (d) => colorToChartCoordinate(d).y;
	drawXYPoints(svgElement, data, elementType, className, visibility, pointSize, x_func, y_func, colorFunc);
}

function drawReferencePoints(svgElement, data, elementType, className, visibility, pointSize) {
	// Interpolated points 
	const r = d3.range(0.1, 359, (360 - 0.001) / 100);
	const interpolatedPoints = r.map((p) => {
		let averageColor = InterpolateHueUsingReferencePoints1D(window.altColorSpacePoints, p);
		return {
			x: p,
			colorHex: averageColor.hex(),
			hue: p,
			color: averageColor
		}
	});
	const interp_x = (d) => referencePointToChartCoordinate(d).x;
	const interp_y = (d) => referencePointToChartCoordinate(d).y;

	drawXYPoints(svgElement, interpolatedPoints, "rect", className, visibility, 9, interp_x, interp_y, (d) => d.color, border=1);
	const colorFunc = (d) => chroma(d.colorHex);
	drawXYPoints(svgElement, data, elementType, className, visibility, pointSize, interp_x, interp_y, colorFunc, border=2);
}

function drawColorRangeLines(svgElement, ranges, visibility, className) {
	let polyLines = [];
	for (var i = 0; i < ranges.length; i++) {
		polyLines.push(evaluateColorRange(ranges[i], 40));
	}
	const lineFunc = d3.line()
		.x((d) => { return colorToChartCoordinate(d).x }) 
		.y((d) => { return colorToChartCoordinate(d).y }) 
		.curve(d3.curveMonotoneX);

	drawChartPolyLine(d3.select(svgElement), polyLines, lineFunc, "gray", 0.3, visibility, className);
}

function drawChartPolyLine(parentObject, polyLines, lineFunc, color, strokeWidth, visibility, className) {
	const visibilityAttr = visibility ? "visible" : "hidden"; 
	const paths = parentObject.selectAll(`path.${className}`).data(polyLines);
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

  const colorFunc = (d) => sampleColorSystemFromHSL(window.altColorSpacePoints, d).hex();
  
  svg.attr("width", totalWidth)
     .attr("height", totalHeight);
  
  const cells = svg.selectAll("rect")
    .data(colors)
    .join("rect")
    .attr("width", cellWidth)
    .attr("height", cellHeight)
    .attr("x", (d, i) => (i % columns) * (cellWidth + padding))
    .attr("y", (d, i) => Math.floor(i / columns) * (cellHeight + yPadding))
    .attr("fill", colorFunc);
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

	let testColorDepth = 12;
	let testColorHues = 24;
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
	window.cachedgraphWidth = document.documentElement.clientWidth - 600;
	window.cachedGraphHeight = calculateGraphHeight();

	calculateProceduralColors();
	calculateTestColors();

	//window.altColorSpacePoints = goetheReferencePoints;
	window.altColorSpacePoints = pseudoNCSReferencePoints;

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

function setChartCoordinateSystem(system) {
	if(system == "Cartesian") {
		window.inputParameters.chartCoordinateTransformer = cartesianChartCoordinate;
		window.inputParameters.chartCoordinateSystem = system;
	} else {
		window.inputParameters.chartCoordinateTransformer = polarChartCoordinate;
		window.inputParameters.chartCoordinateSystem = "Polar";
	}
	//update();
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
		chartCoordinateTransformer: polarChartCoordinate,
		chartCoordinateSystem : "Polar",

		pointToColorConverter: pointToHSLColor,
	}
	window.showColorspaceTestColors = false;
	window.showProceduralColors = true;
	window.showReferenceColors = false;
	window.showSettings = false;
	window.showAltColorSpace = false;
	//window.referenceColors = testReferenceColorsList.map(c => chroma(c));
	window.referenceColors = [];

	createUIElements();
	onUIChange = update;
	update();
}

function createUIElements() {
	window.updateRoutines = [];

	// Settings
	uiCreateCollapsableSection(
		"settings", 
		"left-panel", 
		"Settings", 
		onInput = () => {window.showSettings = !window.showSettings},
		openBind = () => window.showSettings
	);
	createRadioInput(
		idText = "radial-axis-input", 
		parent = "settings", 
		options = ["Lightness","Saturation"], 
		title = "Secondary axis", 
		onInput = (value) => {window.inputParameters.variableOnRadialAxis = value}, 
		valueBind = () => window.inputParameters.variableOnRadialAxis
	);

	createRadioInput(
		idText = "graph-style-input", 
		parent = "settings", 
		options = ["Polar","Cartesian"], 
		title = "Graph coordinate system", 
		onInput = (value) => {
			setChartCoordinateSystem(value);
		}, 
		valueBind = () => {
			return window.inputParameters.chartCoordinateSystem
		}
	);

	// Color space
	uiCreateControlGroup("color-space-controls", "settings", "Color space");

	createParagraph("colorspace-paragraph","color-space-controls", "-", valueBind = () => window.inputParameters.colorSpace)

	uiCreateCheckbox(
		idText = "colorspace-checkbox", 
		parent = "color-space-controls", 
		title = "Show colorspace", 
		onInput = (value) => {window.showColorspaceTestColors = value}, 
		valueBind = () => window.showColorspaceTestColors
	);	

	uiCreateCheckbox(
		idText = "alt-colorspace-checkbox", 
		parent = "color-space-controls", 
		title = "Show alt colorspace", 
		onInput = (value) => {window.showAltColorSpace = value}, 
		valueBind = () => window.showAltColorSpace
	);

	// Procedural colors
	uiCreateCollapsableSection(
		"procedural-colors", 
		"left-panel", 
		"New colors", 
		onInput = () => {window.showProceduralColors = !window.showProceduralColors},
		openBind = () => window.showProceduralColors
	);

	const grid1 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	grid1.id = "procedural-colors-grid"
	document.getElementById("procedural-colors").append(grid1);

	uiCreateButton(
		idText = "save-btn", 
		parent = "procedural-colors", 
		title = "Save", 
		onInput = () => {
			saveColors(window.proceduralColors);
			update();
	});

	uiCreateButton(
		idText = "copy-procedural-btn", 
		parent = "procedural-colors", 
		title = "Copy", 
		onInput = () => {
			copyColorsToClipboard(window.proceduralColors);
			update();
	});

	// Reference colors
	uiCreateCollapsableSection(
		"reference-colors", 
		"left-panel", 
		"Saved colors", 
		onInput = () => {window.showReferenceColors = !window.showReferenceColors},
		openBind = () => window.showReferenceColors
	);
	
	const grid2 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	grid2.id = "reference-colors-grid";
	document.getElementById("reference-colors").append(grid2);

	uiCreateButton(
		idText = "paste-reference-btn", 
		parent = "reference-colors", 
		title = "Copy", 
		onInput = () => {
			copyColorsToClipboard(window.referenceColors);
			update();
	});

	uiCreateButton(
		idText = "copy-reference-btn", 
		parent = "reference-colors", 
		title = "Paste", 
		onInput = () => {
			pasteColors();
			update();
	});

	uiCreateButton(
		idText = "clear-reference-btn", 
		parent = "reference-colors", 
		title = "Clear", 
		onInput = () => {
			clearSavedColors();
			update();
	});

	// RIGHT SIDE

	// Color Group
	uiCreateControlGroup("color-groups-controls", "right-panel", "Color groups");
	uiCreateSliderElement(
			idText = "color-groups", 
			parent = "color-groups-controls", 
			title = "Number of hue groups", 
			min = 0, 
			max = 20, 
			step = 1,
			onInput = (value) => {window.inputParameters.hueCount = Number(value)},
			valueBind = () => window.inputParameters.hueCount
	);	

	uiCreateSliderElement(
		idText = "colors-per-group", 
		parent = "color-groups-controls", 
		title = "Colors per group", 
		min = 0, 
		max = 24, 
		step = 1,
		onInput = (value) => {window.inputParameters.pointsPerLine = Number(value)},
		valueBind = () => window.inputParameters.pointsPerLine
	);

	// Hue
	uiCreateControlGroup("hue-controls", "right-panel", "Hue");
	uiCreateSliderElement(
		idText = "hue-increment", 
		parent = "hue-controls", 
		title = "Increment", 
		min = -180, 
		max = 180, 
		step = 1,
		onInput = (value) => {window.inputParameters.hueTilt = Number(value)},
		valueBind = () => window.inputParameters.hueTilt, 
		toDegree
	);

	uiCreateSliderElement(
		idText = "hue-offset", 
		parent = "hue-controls", 
		title = "Offset", 
		min = -180, 
		max = 180, 
		step = 1,
		onInput = (value) => {window.inputParameters.hueOffset = Number(value)},
		valueBind = () => window.inputParameters.hueOffset, 
		toDegree
	);	

	// Saturation
	uiCreateControlGroup("saturation-controls", "right-panel", "Saturation");
	uiCreateSliderElement(
		idText = "dark-saturation", 
		parent = "saturation-controls", 
		title = "Dark", 
		min = 0.01, 
		max = 1, 
		step = 0.01,
		onInput = (value) => {window.inputParameters.lowSaturation = Number(value)},
		valueBind = () => window.inputParameters.lowSaturation,
		labelFormatter = toPercentage
	);	

	uiCreateSliderElement(
		idText = "mid-saturation", 
		parent = "saturation-controls", 
		title = "Mid", 
		min = 0.01, 
		max = 1, 
		step = 0.01,
		onInput = (value) => {window.inputParameters.midSaturation = Number(value)},
		valueBind = () => window.inputParameters.midSaturation,
		labelFormatter = toPercentage
	);	
	uiCreateSliderElement(
		idText = "high-saturation", 
		parent = "saturation-controls", 
		title = "Lights", 
		min = 0.01, 
		max = 1, 
		step = 0.01,
		onInput = (value) => {window.inputParameters.highSaturation = Number(value)},
		valueBind = () => window.inputParameters.highSaturation,
		labelFormatter = toPercentage
	);
	
	// Value
	uiCreateControlGroup("brightness-controls", "right-panel", "Brightness");
	uiCreateSliderElement(
		idText = "darkest-value", 
		parent = "brightness-controls", 
		title = "Darkest value", 
		min = 0.01, 
		max = 0.99, 
		step = 0.01,
		onInput = (value) => {window.inputParameters.minValue = Number(value)},
		valueBind = () => window.inputParameters.minValue,
		labelFormatter = toPercentage
	);

	uiCreateSliderElement(
		idText = "brightest-value", 
		parent = "brightness-controls", 
		title = "Brightest value", 
		min = 0.01, 
		max = 0.99, 
		step = 0.01,
		onInput = (value) => {window.inputParameters.maxValue = Number(value)},
		valueBind = () => window.inputParameters.maxValue,
		labelFormatter = toPercentage
	);
}

window.onresize = (event) => {
		update();
	}
window.onload = init;

