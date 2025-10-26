let onUIChange = () => {mutateParameters(()=>{})};
window.updateRoutines = [];
var READY_FOR_UPDATES = false;

/** DATA FLOW **/
async function init() {
	initUI();
	initViz(_PARAMETERS._VISUAL);
	READY_FOR_UPDATES = true;

	await waitForStableLayout();
	resizeCanvas();
}

function mutateParameters(mutator) {
	if(!READY_FOR_UPDATES) return;
	mutator();
	const data = resolveModel(_PARAMETERS);
	visualize(data, _PARAMETERS._VISUAL);
	uiUpdate();
} 

async function waitForStableLayout() {
	for (let i = 0; i < frames; i++) {
    await new Promise(requestAnimationFrame);
  }
}

function availableScreenHeightForChart() {
	const footer = document.querySelector('footer');
	const header = document.querySelector('header');
	const headerHeight = header ? header.offsetHeight : 0;
	const footerHeight = footer ? footer.offsetHeight : 0;

	return window.innerHeight - headerHeight - footerHeight;
}

/** VISUALIZATION **/
function centeredCartesianSpace(_x, _y, visualParameters) {
	let centerX = visualParameters._mainCanvasDimensions.width / 2;
	let centerY = visualParameters._mainCanvasDimensions.height / 2;

	let x = _x * scaleFactor + centerX;
	let y = _y * scaleFactor + centerY;
	console.assert(!isNaN(x) && !isNaN(y));
	return {x, y};
}

function domainWidth(visualParameters) {
	return visualParameters._chartDimensions.xDomainMax - visualParameters._chartDimensions.xDomainMin;
}

function domainHeight(visualParameters) {
	return visualParameters._chartDimensions.yDomainMax - visualParameters._chartDimensions.yDomainMin;
}

function availableWidth(visualParameters) {
	return visualParameters._mainCanvasDimensions.width 
		- visualParameters._chartDimensions.marginLeft 
		- visualParameters._chartDimensions.marginRight;
}
function availableHeight(visualParameters) {
	return visualParameters._mainCanvasDimensions.height 
		- visualParameters._chartDimensions.marginTop 
		- visualParameters._chartDimensions.marginBottom;
}

function cartesianGraphSpace(_x, _y, visualParameters) {
	const totalWidth =  visualParameters._chartDimensions.fillAvailabeSpace ? availableWidth(visualParameters) :  visualParameters._chartDimensions.widthPx;
	const totalHeight = visualParameters._chartDimensions.fillAvailabeSpace ? availableHeight(visualParameters) : visualParameters._chartDimensions.heightPx;

	let x = _x * totalWidth  / domainWidth(visualParameters) +  visualParameters._chartDimensions.marginLeft;
	let y = _y * totalHeight / domainHeight(visualParameters) + visualParameters._chartDimensions.marginTop;
	return {x, y};
}

function polarGraphSpace(_x, _y, visualParameters) {
	const width = availableWidth(visualParameters);
	const height = availableHeight(visualParameters);
	const centerX = width / 2;
	const centerY = height / 2;
	const radius = Math.min(width, height) / 2 - 10;
	const polarHeightScale = (y) => y * radius;

	const angleRad = (_x - 90) * (Math.PI / 180); // rotate so 0° = up
	let polarPoint = {
		x: centerX + polarHeightScale(_y) * Math.cos(angleRad),
		y: centerY + polarHeightScale(_y) * Math.sin(angleRad)
	};
	return polarPoint;	

	return {_x, _y};
}

function convertModelSpaceToPaperSpace(worldPos, visualParameters) {
	const coordFunction = visualParameters.chartCoordinateSystem === "Cartesian" ? cartesianGraphSpace : polarGraphSpace;

	const {x, y} = coordFunction(worldPos.x, worldPos.y, visualParameters); 
	console.assert(!isNaN(x) && !isNaN(y));
	console.assert(x != undefined && y != undefined);
	return {x, y};
}

function calculateMainCanvasDimensions() {
	let canvas = document.getElementById("main-canvas");
	const rect = canvas.getBoundingClientRect()
	let width = Math.floor(rect.width);
	let height = availableScreenHeightForChart();
	console.assert(!isNaN(width) && !isNaN(height));
	return {width, height};
}

function getMainSVGCanvas() {
	return d3.select("#main-canvas-svg");
}

/** UI ELEMENTS **/
function uiUpdate() {
	window.updateRoutines.forEach((routine) => routine());
}

function uiCreateSliderElement(id, parent, title, min, max, step, bind, formatLabel = (txt) => txt) {
	const titleElement = document.createElement("p");
	titleElement.id = `${id}-title`;
	titleElement.classList.add("slider-title");
	titleElement.textContent = title;

	const slider = document.createElement("input");
	slider.type = "range";
	slider.classList.add("slider");
	slider.id = `${id}-slider`;
	slider.min = min;
	slider.max = max;
	slider.step = step;
	slider.addEventListener("input", (event) => {
		bind.set(event.target.value);
		onUIChange();
	});

	const label = document.createElement("label");
	label.id = `${id}-label`;
	label.classList.add("slider-label")
	label.textContent = bind.get();

	let parentObject = document.getElementById(parent)
	parentObject.appendChild(titleElement);
	parentObject.appendChild(slider);
	parentObject.appendChild(label);

	const updateCallBack = () => {
		label.textContent = formatLabel(bind.get());
		slider.value = bind.get();
	}

	window.updateRoutines.push(updateCallBack);
}

function uiCreateControlGroup(id, parent, title) {
	const titleElement = document.createElement("h4");
	titleElement.classList.add("control-group-title");
	titleElement.id = `${id}-title`;
	titleElement.textContent = title;

	const div = document.createElement("div");
	div.classList.add("control-group");
	div.id = id;

	let parentObject = document.getElementById(parent)
	parentObject.appendChild(div);
	div.appendChild(titleElement);

	return div;
}

function uiCreateCollapsableSection (id, parent, title, bind) {
	const titleElement = document.createElement("h3");
	titleElement.classList.add("collapse-section-title");
	titleElement.id = `${id}-section-title`;
	titleElement.textContent = title;
	titleElement.addEventListener("click", (event) => {
		bind.set(event.target.value);
		onUIChange();
	});

	const div = document.createElement("div");
	div.classList.add("collapse-section");
	div.id = id;

	let parentObject = document.getElementById(parent)
	parentObject.appendChild(titleElement);
	parentObject.appendChild(div);

	const updateCallBack = () => {
		const open = bind.get();
		div.style.display = open ? "block" : "none";;
		titleElement.textContent = (open ? "▾ " : "▸ ") + title;
		titleElement.style.color = open ? "black" : "gray";
	}
	window.updateRoutines.push(updateCallBack);
}

function uiCreateCheckbox(id, parent, title, bind) {

	const div = document.createElement("div");
	div.classList.add("checkbox-container");
	div.id = id;

	const checkbox = document.createElement("input");
	checkbox.type = "checkbox";
	checkbox.classList.add("checkbox");
	checkbox.id = `${id}-checkbox`;
	checkbox.value = id;

	checkbox.addEventListener("input", (event) => {
		bind.set(event.target.checked);
		onUIChange();
	});

	const label = document.createElement("label");
	label.textContent = title;
	label.id = `${id}-label`;
	label.for = checkbox.value;

	let parentObject = document.getElementById(parent)
	div.appendChild(checkbox);
	div.appendChild(label);
	parentObject.appendChild(div);

	const updateCallBack = () => {
		checkbox.checked = bind.get();
	}

	window.updateRoutines.push(updateCallBack);
}

function uiCreateParagraph(id, parent, title, bind={get: () =>{""}}) {
	const p = document.createElement("p");
	p.id = `${id}-paragraph`;
	p.textContent = title;

	const updateCallBack = () => {
		p.textContent = bind.get();
	}

	let parentObject = document.getElementById(parent)
	parentObject.appendChild(p);

	window.updateRoutines.push(updateCallBack);
}	

function uiCreateButton(id, parent, title, onclickbutton) {
	const button = document.createElement("button");
	button.textContent = title;

	button.addEventListener("click", (event) => {
		onclickbutton(event.target.value);
		onUIChange();
	});

	let parentObject = document.getElementById(parent);
	parentObject.appendChild(button);
}

function uiCreateRadioInput(id, parent, options, title, bind) {
	const controlGroupId = id + "-control-group";
	const controlGroup = uiCreateControlGroup(controlGroupId, parent, title);
	const fieldset = document.createElement("fieldset");
	const fieldset_id = `fieldset-${id}`;

	controlGroup.appendChild(fieldset);
	
	const buttons = [];

	for (var i = 0; i < options.length; i++) {
		const optionDiv = document.createElement("div");
		optionDiv.classList.add("radio-option");

		const radioButton = document.createElement("input");
		radioButton.type = "radio";
		radioButton.id = `radio-option-${id}-${options[i]}`;
		radioButton.name = fieldset_id;
		radioButton.value = options[i];
		radioButton.addEventListener("click", (event) => {
			bind.set(event.target.value);
			onUIChange();
		});

		const label = document.createElement("label");
		label.textContent = options[i];
		label.for = radioButton.value;

		optionDiv.appendChild(radioButton);
		optionDiv.appendChild(label);

		fieldset.appendChild(optionDiv);
		buttons.push(radioButton);
	}
	
	const updateCallBack = () => {
		buttons.forEach( (btn) => {
			btn.checked = bind.get() == btn.value;
		});
	}
	window.updateRoutines.push(updateCallBack);
}


// Utilities
function resizeCanvas() {
	requestAnimationFrame(
		() =>	mutateParameters(p => {
			let dim = calculateMainCanvasDimensions();
			setCanvasSize(dim.width, dim.height);
			_PARAMETERS._VISUAL._mainCanvasDimensions = dim;
		})
	);
}

function setCanvasSize(width, height) {
	const svgElement = d3.select("#main-canvas-svg");

	svgElement
	  .attr("viewBox", `0 0 ${width} ${height}`);
}

async function setClipboardToText(text) {
  const type = "text/plain";
  const clipboardItemData = {
    [type]: text,
  };
  const clipboardItem = new ClipboardItem(clipboardItemData);
  await navigator.clipboard.write([clipboardItem]);
}

function toPercentageString(value) {
	return Math.round(value * 100) + "%";
}

function toDegreeString(value) {
	return Math.round(value) + "°";
}

/** SETUP **/
/** SETUP **/
window.onresize = () => { resizeCanvas() }
window.onload = init;