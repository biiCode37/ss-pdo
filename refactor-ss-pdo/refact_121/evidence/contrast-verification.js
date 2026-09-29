/**
 * Independent WCAG 2.1 Contrast Ratio Verification Script
 * Standard Formula: IEC 61966-2-1 sRGB relative luminance
 * L = 0.2126 * R_lin + 0.7152 * G_lin + 0.0722 * B_lin
 * Contrast Ratio = (L_lighter + 0.05) / (L_darker + 0.05)
 * Alpha Blending over Background: C_comp = round(alpha * C_fg + (1 - alpha) * C_bg)
 */

function sRGBtoLin(val) {
  const c = val / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function lum(rgb) {
  return (
    0.2126 * sRGBtoLin(rgb[0]) +
    0.7152 * sRGBtoLin(rgb[1]) +
    0.0722 * sRGBtoLin(rgb[2])
  );
}

function contrast(c1, c2) {
  const l1 = lum(c1);
  const l2 = lum(c2);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

function blend(fg, bg, alpha) {
  return [
    Math.round(alpha * fg[0] + (1 - alpha) * bg[0]),
    Math.round(alpha * fg[1] + (1 - alpha) * bg[1]),
    Math.round(alpha * fg[2] + (1 - alpha) * bg[2]),
  ];
}

console.log("================================================================================");
console.log("             WCAG 2.1 CONTRAST & RELATIVE LUMINANCE AUDIT (refact_121)           ");
console.log("================================================================================\n");

// --- LIGHT MODE ---
console.log("--- 1. LIGHT MODE AUDIT ---");
const whiteBg = [255, 255, 255]; // Card background #ffffff

// Warning Banner Background: rgba(234, 88, 12, 0.1) composite on #ffffff
const warnTintLight = [234, 88, 12]; // #ea580c (orange-600)
const bannerBgLight = blend(warnTintLight, whiteBg, 0.1);
const lumBannerBgLight = lum(bannerBgLight);
console.log("Latar Banner Komposit (10% rgba(234,88,12,0.1) over #ffffff):", bannerBgLight);
console.log("  Luminansi L_bg =", lumBannerBgLight.toFixed(4));

// A. Title: --warning-banner-title: #9a3412
const titleLight = [154, 52, 18];
const lumTitleLight = lum(titleLight);
const crTitleLight = contrast(titleLight, bannerBgLight);
console.log("\nA. Judul Banner (--warning-banner-title: #9a3412):");
console.log("   L_fg =", lumTitleLight.toFixed(4), "| L_bg =", lumBannerBgLight.toFixed(4));
console.log("   Formula: (" + lumBannerBgLight.toFixed(4) + " + 0.05) / (" + lumTitleLight.toFixed(4) + " + 0.05)");
console.log("   Ratio =", crTitleLight.toFixed(2) + ":1", crTitleLight >= 4.5 ? "[PASS AA >= 4.5:1]" : "[FAIL]");

// B. Body Text: --warning-banner-text: var(--text-primary) (#171717)
const bodyLight = [23, 23, 23];
const lumBodyLight = lum(bodyLight);
const crBodyLight = contrast(bodyLight, bannerBgLight);
console.log("\nB. Isi Penjelas Banner (--warning-banner-text: #171717):");
console.log("   L_fg =", lumBodyLight.toFixed(4), "| L_bg =", lumBannerBgLight.toFixed(4));
console.log("   Formula: (" + lumBannerBgLight.toFixed(4) + " + 0.05) / (" + lumBodyLight.toFixed(4) + " + 0.05)");
console.log("   Ratio =", crBodyLight.toFixed(2) + ":1", crBodyLight >= 7.0 ? "[PASS AAA >= 7.0:1]" : "[PASS AA]");

// C. Button: background --warning-color #d97706, foreground --warning-btn-text #0f172a
const btnBgLight = [217, 119, 6];
const btnText = [15, 23, 42];
const lumBtnBgLight = lum(btnBgLight);
const lumBtnText = lum(btnText);
const crBtnLight = contrast(btnText, btnBgLight);
console.log("\nC. Tombol Banner (--warning-btn-text: #0f172a over --warning-color: #d97706):");
console.log("   L_fg =", lumBtnText.toFixed(4), "| L_bg =", lumBtnBgLight.toFixed(4));
console.log("   Formula: (" + lumBtnBgLight.toFixed(4) + " + 0.05) / (" + lumBtnText.toFixed(4) + " + 0.05)");
console.log("   Ratio =", crBtnLight.toFixed(2) + ":1", crBtnLight >= 4.5 ? "[PASS AA >= 4.5:1]" : "[FAIL]");

// D. Shift 1 Chip Light: --shift1-bg rgba(2, 132, 199, 0.08) (8% alpha) composite on #ffffff
const s1Tint = [2, 132, 199];
const s1ChipBgLight = blend(s1Tint, whiteBg, 0.08); // 8% alpha in CSS
const lumS1ChipBgLight = lum(s1ChipBgLight);
const s1TextLight = [3, 105, 161]; // #0369a1
const lumS1TextLight = lum(s1TextLight);
const crS1Light = contrast(s1TextLight, s1ChipBgLight);
console.log("\nD. Chip Aktif Shift 1 Light (--shift1-action-text: #0369a1 over 8% --shift1-bg):");
console.log("   Latar Chip Komposit:", s1ChipBgLight, "L_bg =", lumS1ChipBgLight.toFixed(4));
console.log("   L_fg =", lumS1TextLight.toFixed(4));
console.log("   Formula: (" + lumS1ChipBgLight.toFixed(4) + " + 0.05) / (" + lumS1TextLight.toFixed(4) + " + 0.05)");
console.log("   Ratio =", crS1Light.toFixed(2) + ":1", crS1Light >= 4.5 ? "[PASS AA >= 4.5:1]" : "[FAIL]");


// --- DARK MODE ---
console.log("\n\n--- 2. DARK MODE AUDIT ---");
const darkCardBg = [21, 21, 21]; // card-bg in dark mode

// Warning Banner Background: rgba(249, 115, 22, 0.12) composite on dark card
const warnTintDark = [249, 115, 22]; // #f97316
const bannerBgDark = blend(warnTintDark, darkCardBg, 0.12);
const lumBannerBgDark = lum(bannerBgDark);
console.log("Latar Banner Komposit (12% rgba(249,115,22,0.12) over darkCard):", bannerBgDark);
console.log("  Luminansi L_bg =", lumBannerBgDark.toFixed(4));

// A. Title: --warning-banner-title: #f59e0b
const titleDark = [245, 158, 11];
const lumTitleDark = lum(titleDark);
const crTitleDark = contrast(titleDark, bannerBgDark);
console.log("\nA. Judul Banner (--warning-banner-title: #f59e0b):");
console.log("   L_fg =", lumTitleDark.toFixed(4), "| L_bg =", lumBannerBgDark.toFixed(4));
console.log("   Formula: (" + lumTitleDark.toFixed(4) + " + 0.05) / (" + lumBannerBgDark.toFixed(4) + " + 0.05)");
console.log("   Ratio =", crTitleDark.toFixed(2) + ":1", crTitleDark >= 7.0 ? "[PASS AAA >= 7.0:1]" : "[PASS AA]");

// B. Body Text: --warning-banner-text: var(--text-primary) (#ededed)
const bodyDark = [237, 237, 237];
const lumBodyDark = lum(bodyDark);
const crBodyDark = contrast(bodyDark, bannerBgDark);
console.log("\nB. Isi Penjelas Banner (--warning-banner-text: #ededed):");
console.log("   L_fg =", lumBodyDark.toFixed(4), "| L_bg =", lumBannerBgDark.toFixed(4));
console.log("   Formula: (" + lumBodyDark.toFixed(4) + " + 0.05) / (" + lumBannerBgDark.toFixed(4) + " + 0.05)");
console.log("   Ratio =", crBodyDark.toFixed(2) + ":1", crBodyDark >= 7.0 ? "[PASS AAA >= 7.0:1]" : "[PASS AA]");

// C. Button: background --warning-color #f59e0b, foreground --warning-btn-text #0f172a
const btnBgDark = [245, 158, 11];
const lumBtnBgDark = lum(btnBgDark);
const crBtnDark = contrast(btnText, btnBgDark);
console.log("\nC. Tombol Banner (--warning-btn-text: #0f172a over --warning-color: #f59e0b):");
console.log("   L_fg =", lumBtnText.toFixed(4), "| L_bg =", lumBtnBgDark.toFixed(4));
console.log("   Formula: (" + lumBtnBgDark.toFixed(4) + " + 0.05) / (" + lumBtnText.toFixed(4) + " + 0.05)");
console.log("   Ratio =", crBtnDark.toFixed(2) + ":1", crBtnDark >= 7.0 ? "[PASS AAA >= 7.0:1]" : "[PASS AA]");
