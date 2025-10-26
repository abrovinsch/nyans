const goetheReferencePoints = [
	{
		hue: 0,
		colorHex: "#e40102",
		description: "red" 
	},
	{
		hue: 60,
		colorHex: "#fa4e05",
		description: "orange"
	},	
	{
		hue: 120,
		colorHex: "#f1af05",
		description: "yellow"
	},
	{
		hue: 180,
		colorHex: "#569168",
		description: "green"
	},
	{
		hue: 240,
		colorHex: "#04a4e6",
		description: "blue"
	},
	{
		hue: 300,
		colorHex: "#6479ac",
		description: "purple" 
	}
];

const pseudoNCSReferencePoints = [
	{
		hue: 0,
		colorHex: "#C40233",
		description: "R" 
	},
	{
		hue: 45,
		colorHex: "#e3660a",
		description: "-Y50R" 
	},
	{
		hue: 90,
		colorHex: "#FFD300",
		description: "Y" 
	},	
	{
		hue: 135,
		colorHex: "#bacb36",
		description: "-G50Y" 
	},	
	{
		hue: 180,
		colorHex: "#009F6B",
		description: "G" 
	},
	{
		hue: 225,
		colorHex: "#168270",
		description: "-B50G" 
	},
	{
		hue: 270,
		colorHex: "#0087BD",
		description: "B" 
	},
	{
		hue: 279,
		colorHex: "#00749f",
		description: "-R90B" 
	},
	{
		hue: 288,
		colorHex: "#005682",
		description: "-R80B" 
	},
	{
		hue: 297,
		colorHex: "#29457c",
		description: "-R70B" 
	},
	{
		hue: 306,
		colorHex: "#3c306a",
		description: "-R60B" 
	},
	{
		hue: 315,
		colorHex: "#783a70",
		description: "-R50B" 
	},
	{
		hue: 333,
		colorHex: "#a82961",
		description: "-R30B" 
	},
];

const availableColorSystems = [goetheReferencePoints, pseudoNCSReferencePoints];
availableColorSystems.forEach((system) => system = unwrapHSLOnReferencePoints(system));

function unwrapHSLOnReferencePoints(refPoints) {
	// Optimization - do this only once
	if(!Object.hasOwn(refPoints[0], "hsl")) {
		refPoints.forEach((p) => {
			p.hsl = chroma(p.colorHex).hsl()
		});
	}
}

function sampleColorSystemFromHSL(colorSystem, col) {
	const hsl = col.hsl();
	return sampleColorSystemAtPoint(colorSystem, hsl[0], hsl[1], hsl[2]);
}

function sampleColorSystemAtPoint(colorSystem, targetHue, targetSaturation, targetLuminance) {
	const neutralHue = InterpolateHueUsingReferencePoints1D(colorSystem, targetHue);
	const [nHue, nSat, nLgt] = neutralHue.hsl();

	let luminance = 0.5;
	if(targetLuminance < 0.5) {
		luminance = nLgt * targetLuminance * 2;
	} else {
		luminance = (targetLuminance - 0.5) * 2 + nLgt;
	}

	return chroma.hsl(nHue, targetSaturation * nSat, luminance);
}

function InterpolateHueUsingReferencePoints1D(refPoints, targetHue) {

	const weightedDistanceTable = refPoints.map(
		(p) => {
			return {
				weight: (1 / Math.max(shortestArc(p.hue, targetHue),0.01)) ** 2,
				hue: p.hsl[0] % 360,
				sat: p.hsl[1],
				lgt: p.hsl[2]
			}
		}
	);

	return weightedColorMean(weightedDistanceTable);
}

function weightedColorMean(weightedPoints) {
	const totalWeight = weightedPoints.reduce((s, p) => s + p.weight, 0);
	let x = 0, y = 0, sat = 0, lgt = 0;

	for (const p of weightedPoints) {
		const rad = (p.hue * Math.PI) / 180;
		x += Math.cos(rad) * p.weight;
		y += Math.sin(rad) * p.weight;
		sat += p.sat * p.weight;
		lgt += p.lgt * p.weight;
	}

	const hue = (Math.atan2(y / totalWeight, x / totalWeight) * 180 / Math.PI + 360) % 360;
	return chroma.hsl(hue, sat / totalWeight, lgt / totalWeight);
}

function shortestArc(a, b) {
	const d = Math.abs(a - b) % 360;
 	return d > 180 ? 360 - d : d;
}