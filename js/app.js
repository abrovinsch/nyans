/** GLOBAL VARIABLES **/
var _PARAMETERS = {
	colorSystemUsedString: "HSL",

	showSettings: false,
	
	// Color Families
	colorFamilyCount: 5,
	colorsPerFamily: 9,

	// Hue
	hueOffset: 15,
	hueIncrement: 5,
	hueSpectrum: 360,

	// Saturation
	saturationDark: 0.8,
	saturationMid: 0.30,
	saturationLight: 0.95,

	// Lightness
	lightnessLowerLimit: 0.25,
	lightnessUpperLimit: 0.95,

	_VISUAL: {
		_mainCanvasDimensions: {
			width: 500,
			height: 500
		},
		_chartDimensions: {	
			fillAvailabeSpace: true,
			xDomainMin: 0,
			xDomainMax: 360,
			yDomainMin: 0,
			yDomainMax: 1,
			marginLeft: 0,
			marginRight: 0,
			marginTop: 0,
			marginBottom: 0,
			widthPx: 250,
			heightPx: 250,
		},
		_scale: 1,
		chartCoordinateSystem: "Polar",
		graphYAxisRepresents: "Lightness",
		grid: {
			horizontalLines: 6,
			verticalLines: 10,
			color: "#eeeeee",
		},
		isVisible: {
			proceduralColorFamilies: true,
			savedColorFamilies: true,
			colorSpaceColorFamilies: false,
			altColorSpace: false,
		},
	}
};

/** DATA TRANSFORMATION **/
function resolveModel(parameters) {
	let proceduralFamilies = computeGeometricColorPalette(
		parameters.colorFamilyCount, 
		parameters.colorsPerFamily, 
		parameters.hueOffset, 
		parameters.hueIncrement, 
		parameters.hueSpectrum, 
		parameters.lightnessLowerLimit, 
		parameters.lightnessUpperLimit, 
		parameters.saturationLight, 
		parameters.saturationMid, 
		parameters.saturationDark
	);
	return {
		proceduralColorFamilies: proceduralFamilies
	};
}

/** VISUALIZATION **/
function initViz(visualParameters, svgElement){
	
}

function visualize(data, visualParameters) {
	const svgElement = getMainSVGCanvas();

	const geometricColorFunc = (d) => {
		let c = chroma.oklch(d._l, (1 - d._s) * 0.4, d._h).hex();
		return c;
	};
	const geometricColorX = (d) => paperX({x: d._h, y: visualParameters.graphYAxisRepresents == "Lightness" ? d._l : d._s});
	const geometricColorY = (d) => paperY({x: d._h, y: visualParameters.graphYAxisRepresents == "Lightness" ? d._l : d._s});

	const paperX = (worldPos) => convertModelSpaceToPaperSpace(worldPos, visualParameters).x;
	const paperY = (worldPos) => convertModelSpaceToPaperSpace(worldPos, visualParameters).y;

	vizDrawGrid(
		svgElement,
		paperX,
		paperY,
		visualParameters.grid.horizontalLines, 
		visualParameters.grid.verticalLines, 
		visualParameters.grid.color, 
		visualParameters._chartDimensions.yDomainMin, 
		visualParameters._chartDimensions.yDomainMax,
		visualParameters._chartDimensions.xDomainMin, 
		visualParameters._chartDimensions.xDomainMax,
	);
	console.assert(data.proceduralColorFamilies.length > 0);
	vizDrawProceduralColorFamilies(svgElement, data.proceduralColorFamilies, geometricColorX, geometricColorY, geometricColorFunc);	
}

function vizDrawGrid(svgElement, paperX, paperY, xLines, yLines, color, yMin, yMax, xMin, xMax) {
	const grid = svgElement.selectAll("g.axis").data([null]); // bind a single dummy element
	const epsilon = 0.001;

	const gridEnter = grid.enter()
		.append("g")
		.attr("class", "axis");
	const gridMerged = gridEnter.merge(grid);

	// X lines
	const _xLines = gridMerged.selectAll("line.xLine")
		.data(d3.range(xMin, xMax, (xMax - epsilon) / xLines));		
	_xLines.join(
		enter => enter.append("line")
			.attr("class", "xLine")
			.attr("stroke", color)
			.attr("x1", (d) => paperX({x: d, y: yMin}))
			.attr("y1", (d) => paperY({x: d, y: yMin}))
			.attr("x2", (d) => paperX({x: d, y: yMax}))
			.attr("y2", (d) => paperY({x: d, y: yMax}))
			.attr("fill", "none"),
		update => update
			.attr("x1", (d) => paperX({x: d, y: yMin}))
			.attr("y1", (d) => paperY({x: d, y: yMin}))
			.attr("x2", (d) => paperX({x: d, y: yMax}))
			.attr("y2", (d) => paperY({x: d, y: yMax})),
		exit => exit.remove()
	);

	// Y lines
	const _yLines = gridMerged.selectAll("line.yLine")
		.data(d3.range(yMin, yMax, (yMax - epsilon) / yLines));		

	_yLines.join(
		enter => enter.append("line")
			.attr("class", "yLine")
			.attr("stroke", color)
			.attr("x1", (d) => paperX({x: xMin, y: d}))
			.attr("y1", (d) => paperY({x: xMin, y: d}))
			.attr("x2", (d) => paperX({x: xMax, y: d}))
			.attr("y2", (d) => paperY({x: xMax, y: d}))
			.attr("fill", "none"),
		update => update
			.attr("x1", (d) => paperX({x: xMin, y: d}))
			.attr("y1", (d) => paperY({x: xMin, y: d}))
			.attr("x2", (d) => paperX({x: xMax, y: d}))
			.attr("y2", (d) => paperY({x: xMax, y: d})),
		exit => exit.remove()
	);
}

function vizDrawProceduralColorFamilies(svgElement, families, paperX, paperY, colorFunc){

	const allColors = families.flatMap(f => f.geometricColors);

	vizDrawXYPoints(
		svgElement, 
		allColors, 
		"circle", 
		"procedural-color-circle",
		true,
		10,
		paperX,
		paperY, 
		colorFunc
	);
}

function vizDrawXYPoints(svgElement, data, elementType, className, visibility, pointSize, xFunc, yFunc, colorFunc, border=0){
	const elements = svgElement.selectAll(`${elementType}.${className}`).data(data);
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

/** UI CODE **/
function initUI(){
	// Settings
	uiCreateCollapsableSection(
		"settings", 
		"left-panel", 
		"Settings", 
		bind = { 
			set: () => {_PARAMETERS.showSettings = !_PARAMETERS.showSettings},
			get: () => _PARAMETERS.showSettings
		}
	);
	uiCreateRadioInput(
		id = "radial-axis-input", 
		parent = "settings", 
		options = ["Lightness","Saturation"], 
		title = "Secondary axis", 
		bind = { 
			set: (value) => {_PARAMETERS._VISUAL.graphYAxisRepresents = value},
			get: () => _PARAMETERS._VISUAL.graphYAxisRepresents
		}
	);

	uiCreateRadioInput(
		id = "graph-style-input", 
		parent = "settings", 
		options = ["Polar","Cartesian"], 
		title = "Graph coordinate system", 
		bind = { 
			set: (value) => {_PARAMETERS._VISUAL.chartCoordinateSystem = value},
			get: () => _PARAMETERS._VISUAL.chartCoordinateSystem
		}
	);

	// Color space
	uiCreateControlGroup("color-space-controls", "settings", "Color space");

	uiCreateParagraph("colorspace-paragraph","color-space-controls", "-", bind={get: () => _PARAMETERS.colorSystemUsedString});

	uiCreateCheckbox(
		id = "colorspace-checkbox", 
		parent = "color-space-controls", 
		title = "Show colorspace", 
		bind = { 
			set: (value) => {_PARAMETERS._VISUAL.isVisible.colorSpaceColorFamilies = value},
			get: () => _PARAMETERS._VISUAL.isVisible.colorSpaceColorFamilies
		}
	);	

	uiCreateCheckbox(
		id = "alt-colorspace-checkbox", 
		parent = "color-space-controls", 
		title = "Show alt colorspace", 
		bind = { 
			set: (value) => {_PARAMETERS._VISUAL.isVisible.altColorSpace = value},
			get: () => _PARAMETERS._VISUAL.isVisible.altColorSpace
		}
	);

	// Procedural colors
	uiCreateCollapsableSection(
		"procedural-colors", 
		"left-panel", 
		"New colors", 
		bind = { 
			set: () => {_PARAMETERS._VISUAL.isVisible.proceduralColors = !_PARAMETERS._VISUAL.isVisible.proceduralColors},
			get: () => _PARAMETERS._VISUAL.isVisible.proceduralColors
		}
	);

	uiCreateButton(
		id = "save-btn", 
		parent = "procedural-colors", 
		title = "Save", 
		onclickbutton = () => {
			saveColors(window.proceduralColors);
			update();
	});

	uiCreateButton(
		id = "copy-procedural-btn", 
		parent = "procedural-colors", 
		title = "Copy", 
		onclickbutton = () => {
			copyColorsToClipboard(window.proceduralColors);
			update();
	});

	const grid1 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	grid1.id = "procedural-colors-grid"
	document.getElementById("procedural-colors").append(grid1);

	// Reference colors
	uiCreateCollapsableSection(
		"reference-colors", 
		"left-panel", 
		"Saved colors", 
		bind = { 
			set: () => {_PARAMETERS._VISUAL.isVisible.savedColorFamilies = !_PARAMETERS._VISUAL.isVisible.savedColorFamilies},
			get: () => _PARAMETERS._VISUAL.isVisible.savedColorFamilies
		}
	);
	
	uiCreateButton(
		id = "paste-reference-btn", 
		parent = "reference-colors", 
		title = "Copy", 
		onclickbutton = () => {
			copyColorsToClipboard(window.referenceColors);
			update();
	});

	uiCreateButton(
		id = "copy-reference-btn", 
		parent = "reference-colors", 
		title = "Paste", 
		onclickbutton = () => {
			pasteColors();
			update();
	});

	uiCreateButton(
		id = "clear-reference-btn", 
		parent = "reference-colors", 
		title = "Clear", 
		onclickbutton = () => {
			clearSavedColors();
			update();
	});

	const grid2 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	grid2.id = "reference-colors-grid";
	document.getElementById("reference-colors").append(grid2);

	// RIGHT SIDE

	// Color Group
	uiCreateControlGroup("color-groups-controls", "right-panel", "Color groups");
	uiCreateSliderElement(
		id = "color-groups", 
		parent = "color-groups-controls", 
		title = "Number of hue groups", 
		min = 1, 
		max = 24, 
		step = 1,
		bind = { 
			set: (value) => {_PARAMETERS.colorFamilyCount = Number(value)},
			get: () => _PARAMETERS.colorFamilyCount
		}
	);	

	uiCreateControlGroup("color-groups-controls", "right-panel", "Color groups");
	uiCreateSliderElement(
		id = "hue-spectrum", 
		parent = "color-groups-controls", 
		title = "Hue spectrum", 
		min = 10, 
		max = 360, 
		step = 1,
		bind = { 
			set: (value) => {_PARAMETERS.hueSpectrum = Number(value)},
			get: () => _PARAMETERS.hueSpectrum
		}
	);	

	uiCreateSliderElement(
		id = "colors-per-group", 
		parent = "color-groups-controls", 
		title = "Colors per group", 
		min = 0, 
		max = 24, 
		step = 1,
		bind = { 
			set: (value) => {_PARAMETERS.colorsPerFamily = Number(value)},
			get: () => _PARAMETERS.colorsPerFamily
		}
	);

	// Hue
	uiCreateControlGroup("hue-controls", "right-panel", "Hue");
	uiCreateSliderElement(
		id = "hue-increment", 
		parent = "hue-controls", 
		title = "Increment", 
		min = -180, 
		max = 180, 
		step = 1,
		bind = { 
			set: (value) => {_PARAMETERS.hueIncrement = Number(value)},
			get: () => _PARAMETERS.hueIncrement
		}, 
		toDegreeString
	);

	uiCreateSliderElement(
		id = "hue-offset", 
		parent = "hue-controls", 
		title = "Offset", 
		min = -180, 
		max = 180, 
		step = 1,
		bind = { 
			set: (value) => {_PARAMETERS.hueOffset = Number(value)},
			get: () => _PARAMETERS.hueOffset
		}, 
		toDegreeString
	);	

	// Saturation
	uiCreateControlGroup("saturation-controls", "right-panel", "Saturation");
	uiCreateSliderElement(
		id = "dark-saturation", 
		parent = "saturation-controls", 
		title = "Dark", 
		min = 0.01, 
		max = 1, 
		step = 0.01,
		bind = { 
			set: (value) => {_PARAMETERS.saturationDark = Number(value)},
			get: () => _PARAMETERS.saturationDark
		}, 
		formatLabel = toPercentageString
	);	

	uiCreateSliderElement(
		id = "mid-saturation", 
		parent = "saturation-controls", 
		title = "Mid", 
		min = 0.01, 
		max = 1, 
		step = 0.01,
		bind = { 
			set: (value) => {_PARAMETERS.saturationMid = Number(value)},
			get: () => _PARAMETERS.saturationMid
		}, 
		formatLabel = toPercentageString
	);	
	uiCreateSliderElement(
		id = "high-saturation", 
		parent = "saturation-controls", 
		title = "Lights", 
		min = 0.01, 
		max = 1, 
		step = 0.01,
		bind = { 
			set: (value) => {_PARAMETERS.saturationLight = Number(value)},
			get: () => _PARAMETERS.saturationLight
		}, 
		formatLabel = toPercentageString
	);
	
	// Value
	uiCreateControlGroup("brightness-controls", "right-panel", "Brightness");
	uiCreateSliderElement(
		id = "darkest-value", 
		parent = "brightness-controls", 
		title = "Darkest value", 
		min = 0.01, 
		max = 0.99, 
		step = 0.01,
		bind = { 
			set: (value) => {_PARAMETERS.lightnessLowerLimit = Number(value)},
			get: () => _PARAMETERS.lightnessLowerLimit
		}, 
		formatLabel = toPercentageString
	);

	uiCreateSliderElement(
		id = "brightest-value", 
		parent = "brightness-controls", 
		title = "Brightest value", 
		min = 0.01, 
		max = 0.99, 
		step = 0.01,
		bind = { 
			set: (value) => {_PARAMETERS.lightnessUpperLimit = Number(value)},
			get: () => _PARAMETERS.lightnessUpperLimit
		}, 
		formatLabel = toPercentageString
	);
}