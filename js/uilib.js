let onUIChange = () => {};

function createSliderElement(idText, parentId, titleText, min, max, step, onInput, valueBind, formatLabel = (txt) => txt) {
	const title = document.createElement("p");
	title.id = `${idText}-title`;
	title.classList.add("slider-title");
	title.textContent = titleText;

	const slider = document.createElement("input");
	slider.type = "range";
	slider.classList.add("slider");
	slider.id = `${idText}-slider`;
	slider.min = min;
	slider.max = max;
	slider.step = step;
	slider.addEventListener("input", (event) => {
		onInput(event.target.value);
		onUIChange();
	});

	const label = document.createElement("label");
	label.id = `${idText}-label`;
	label.classList.add("slider-label")
	label.textContent = valueBind();

	let parent = document.getElementById(parentId)
	parent.appendChild(title);
	parent.appendChild(slider);
	parent.appendChild(label);

	const updateCallBack = () => {
		label.textContent = formatLabel(valueBind());
		slider.value = valueBind();
	}

	window.updateRoutines.push(updateCallBack);
}

function createControlGroup(idText, parentId, titleText) {
	const title = document.createElement("h4");
	title.classList.add("control-group-title");
	title.id = `${idText}-title`;
	title.textContent = titleText;

	const div = document.createElement("div");
	div.classList.add("control-group");
	div.id = idText;

	let parent = document.getElementById(parentId)
	parent.appendChild(div);
	div.appendChild(title);
}

function createCollapsableSection (idText, parentId, titleText, onInput, isOpenBind) {
	const title = document.createElement("h3");
	title.classList.add("collapse-section-title");
	title.id = `${idText}-section-title`;
	title.textContent = titleText;
	title.addEventListener("click", (event) => {
		onInput(event.target.value);
		onUIChange();
	});

	const div = document.createElement("div");
	div.classList.add("collapse-section");
	div.id = idText;

	let parent = document.getElementById(parentId)
	parent.appendChild(title);
	parent.appendChild(div);

	const updateCallBack = () => {
		const open = isOpenBind();
		div.style.display = open ? "block" : "none";;
		title.style.color = open ? "black" : "gray";
	}
	window.updateRoutines.push(updateCallBack);
}

function createCheckbox(idText, parentId, titleText, onInput, valueBind) {

	const checkbox = document.createElement("input");
	checkbox.type = "checkbox";
	checkbox.classList.add("checkbox");
	checkbox.id = `${idText}-checkbox`;
	checkbox.value = idText;

	checkbox.addEventListener("input", (event) => {
		onInput(event.target.checked);
		onUIChange();
	});

	const label = document.createElement("label");
	label.textContent = titleText;
	label.id = `${idText}-label`;
	label.for = checkbox.value;

	let parent = document.getElementById(parentId)
	parent.appendChild(checkbox);
	parent.appendChild(label);

	const updateCallBack = () => {
		checkbox.checked = valueBind();
	}

	window.updateRoutines.push(updateCallBack);
}

function createParagraph(idText, parentId, titleText, valueBind = () =>{""}) {
	const p = document.createElement("p");
	p.id = `${idText}-paragraph`;
	p.textContent = titleText;

	const updateCallBack = () => {
		p.textContent = valueBind();
	}

	let parent = document.getElementById(parentId)
	parent.appendChild(p);

	window.updateRoutines.push(updateCallBack);
}	

function createButton(idText, parentId, titleText, onInput) {
	const button = document.createElement("button");
	button.textContent = titleText;

	button.addEventListener("click", (event) => {
		onInput();
		onUIChange();
	});

	let parent = document.getElementById(parentId)
	parent.appendChild(button);
}

function createRadioInput(idText, parentId, options, titleText, onInput, valueBind) {
	const controlGroupId = idText + "-control-group";
	createControlGroup(controlGroupId, parentId, titleText);
	const fieldset = document.createElement("fieldset");
	const fieldset_id = `fieldset-${idText}`;

	let parent = document.getElementById(parentId)
	parent.appendChild(fieldset);
	
	const buttons = [];

	for (var i = 0; i < options.length; i++) {
		const optionDiv = document.createElement("div");
		optionDiv.classList.add("radio-option");

		const radioButton = document.createElement("input");
		radioButton.type = "radio";
		radioButton.id = `radio-option-${idText}-${options[i]}`;
		radioButton.name = fieldset_id;
		radioButton.value = options[i];
		radioButton.addEventListener("click", (event) => {
			onInput(event.target.value);
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
			btn.checked = valueBind() == btn.value;
		});
	}
	window.updateRoutines.push(updateCallBack);
}

function updateUI() {
	window.updateRoutines.forEach((routine) => routine());
}

// Utilities
async function setClipboardToText(text) {
  const type = "text/plain";
  const clipboardItemData = {
    [type]: text,
  };
  const clipboardItem = new ClipboardItem(clipboardItemData);
  await navigator.clipboard.write([clipboardItem]);
}