function computeGeometricColorPalette(
	colorFamilyCount, 
	colorsPerFamily, 
	hueOffset, 
	hueIncrement, 
	hueSpectrum, 
	darkestValue, 
	lightestValue, 
	saturationLight, 
	saturationMid, 
	saturationDark) 
{
	let families = [];
	for (var i = colorFamilyCount - 1; i >= 0; i--) {
		const centralHue = hueSpectrum / colorFamilyCount * i + hueOffset;
		families.push(
			createColorFamily(
				centralHue, 
				colorsPerFamily,
				hueIncrement, 
				darkestValue, 
				lightestValue, 
				saturationLight, 
				saturationMid, 
				saturationDark)
		);
	}
	return families;
}

function createColorFamily(
	centralHue, 
	colorsPerFamily, 
	hueIncrement, 
	darkestValue, 
	lightestValue, 
	saturationLight, 
	saturationMid, 
	saturationDark) 
{
	const colorRangeFunction = (t) => {
		return {
			_h: hueInterpolation(t, centralHue, hueIncrement), 
			_s: saturationInterpolation(t, saturationLight, saturationMid * 2, saturationDark),
			_l: lightnessInterpolation(t, lightestValue, darkestValue),
		}
	};

	let result = {
		centralHue,
		colorRangeFunction,
		geometricColors: []
	}

	let range = range01(colorsPerFamily);
	for (var i = 0; i < colorsPerFamily; i++) {
		result.geometricColors.push(colorRangeFunction(range[i]));
	}

	return result;
}

function hueInterpolation(t, centralHue, hueIncrement) {
	let hue = (centralHue - (hueIncrement/2) + hueIncrement * t) % 360;
	while(hue > 360) {
		hue = hue - 360;
	}	
	while(hue < 0) {
		hue = hue + 360;
	}
	return hue;
}

function saturationInterpolation(t, min, mid, max) {
	const raw = (1 - t) * (1 - t) * min +
		2 * (1 - t) * t * mid +
		t * t * max;
	return Math.min(Math.max(raw, 0.01), 0.99);
}

function lightnessInterpolation(t, min, max) {
	return t * (max - min) + min;
}

function range01(n) {
	if (n === 1) return [0.5]; // edge case
	return Array.from({ length: n }, (_, i) => i / (n - 1));
}