/**
 * Generate the Life Cadence Ledger app icon (1024x1024 PNG).
 * Usage: node scripts/generate-icon.mjs
 */

import { createCanvas } from "canvas";
import { writeFileSync } from "fs";

const SIZE = 1024;
const canvas = createCanvas(SIZE, SIZE);
const ctx = canvas.getContext("2d");

// Background — dark, matching --color-bg
ctx.fillStyle = "#0f1117";
ctx.beginPath();
ctx.roundRect(0, 0, SIZE, SIZE, 180);
ctx.fill();

// Subtle inner border
ctx.strokeStyle = "#2a2e3a";
ctx.lineWidth = 4;
ctx.beginPath();
ctx.roundRect(40, 40, SIZE - 80, SIZE - 80, 150);
ctx.stroke();

// Accent wave — energy/focus pulse line
ctx.strokeStyle = "#4f8cff";
ctx.lineWidth = 28;
ctx.lineCap = "round";
ctx.lineJoin = "round";
ctx.beginPath();

const waveY = SIZE * 0.48;
const amplitude = SIZE * 0.12;
const startX = SIZE * 0.15;
const endX = SIZE * 0.85;
const points = 200;

for (let i = 0; i <= points; i++) {
	const t = i / points;
	const x = startX + t * (endX - startX);
	// Compound wave — main sine + subtle harmonic
	const y =
		waveY -
		Math.sin(t * Math.PI * 2.5) * amplitude * (0.5 + 0.5 * Math.sin(t * Math.PI)) -
		Math.sin(t * Math.PI * 5) * amplitude * 0.15;

	if (i === 0) ctx.moveTo(x, y);
	else ctx.lineTo(x, y);
}
ctx.stroke();

// Secondary wave (focus) — thinner, offset, purple
ctx.strokeStyle = "#818cf8";
ctx.lineWidth = 16;
ctx.globalAlpha = 0.6;
ctx.beginPath();

for (let i = 0; i <= points; i++) {
	const t = i / points;
	const x = startX + t * (endX - startX);
	const y =
		waveY +
		SIZE * 0.06 -
		Math.sin(t * Math.PI * 2.5 + 0.8) * amplitude * 0.7 * (0.4 + 0.6 * Math.sin(t * Math.PI)) -
		Math.sin(t * Math.PI * 5 + 0.8) * amplitude * 0.1;

	if (i === 0) ctx.moveTo(x, y);
	else ctx.lineTo(x, y);
}
ctx.stroke();
ctx.globalAlpha = 1.0;

// Leaf accent — small, bottom-right
ctx.fillStyle = "#34d399";
ctx.globalAlpha = 0.9;
ctx.beginPath();
const leafCx = SIZE * 0.78;
const leafCy = SIZE * 0.75;
const leafSize = SIZE * 0.08;
ctx.ellipse(leafCx, leafCy, leafSize * 1.8, leafSize, -Math.PI / 5, 0, Math.PI * 2);
ctx.fill();

// Leaf vein
ctx.strokeStyle = "#0f1117";
ctx.lineWidth = 3;
ctx.globalAlpha = 0.5;
ctx.beginPath();
ctx.moveTo(leafCx - leafSize * 1.2, leafCy + leafSize * 0.3);
ctx.lineTo(leafCx + leafSize * 1.2, leafCy - leafSize * 0.3);
ctx.stroke();
ctx.globalAlpha = 1.0;

// "LCL" monogram — subtle, top area
ctx.font = "bold 72px SF Pro Display, Helvetica Neue, Arial, sans-serif";
ctx.fillStyle = "#8b8fa3";
ctx.globalAlpha = 0.3;
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.fillText("LCL", SIZE * 0.5, SIZE * 0.22);
ctx.globalAlpha = 1.0;

// Three dots at bottom — representing check-in steps
const dotY = SIZE * 0.85;
const dotSpacing = SIZE * 0.06;
const dotRadius = SIZE * 0.015;
const dotColors = ["#fbbf24", "#818cf8", "#60a5fa"]; // energy, focus, sleep

for (let i = 0; i < 3; i++) {
	const x = SIZE * 0.5 + (i - 1) * dotSpacing;
	ctx.fillStyle = dotColors[i];
	ctx.globalAlpha = 0.8;
	ctx.beginPath();
	ctx.arc(x, dotY, dotRadius, 0, Math.PI * 2);
	ctx.fill();
}

const buffer = canvas.toBuffer("image/png");
writeFileSync("app-icon.png", buffer);
console.log("Generated app-icon.png (1024x1024)");
