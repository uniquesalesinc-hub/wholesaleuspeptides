import { useState, useRef, useEffect } from "react";
import TrustBanner from "./components/TrustBanner.jsx";
import PartnerAccessModal from "./components/PartnerAccessModal.jsx";
import ContactModal from "./components/ContactModal.jsx";
import QuoteRequestModal from "./components/QuoteRequestModal.jsx";
import { trackEvent } from "./lib/analytics";

const PARTNER_ACCESS_KEY = "wsp_partner_access";

const C = {
  navy:"#05111F", navy2:"#0A1E30", gold:"#C9A84C",
  white:"#FFFFFF", off:"#F7F6F3", mist:"#D4CFC6",
  stone:"#8A8680", ink:"#1C2B3A", red:"#8B2E2E", green:"#2E6B4A",
};

const SITE_URL = "https://wholesaleuspeptides.com";

const PAGES = {
  home: {
    path: "/", title: "Home",
    seoTitle: "Wholesale Peptides | American Peptide Manufacturing & White Label Supplier",
    description: "Wholesale peptide supplier offering bulk peptides, white label peptide manufacturing, and private label programs. American-made, batch-tested, and built for distributors, research organizations, and private-label brands.",
  },
  catalog: {
    path: "/catalog", title: "Catalog",
    seoTitle: "Wholesale Peptides Catalog | Bulk Peptides & Tiered Pricing",
    description: "Browse our full catalog of wholesale peptides and bulk peptide pricing tiers. Minimum 10 units per SKU. Domestic manufacturing, third-party tested, ready for research organizations and distributors.",
  },
  wl: {
    path: "/white-label", title: "White Label",
    seoTitle: "White Label Peptides & Private Label Manufacturing",
    description: "Launch your own peptide brand with our white label peptides and private label manufacturing program. American peptide manufacturing, custom labeling, and batch-specific COAs.",
  },
  about: {
    path: "/standards", title: "Standards",
    seoTitle: "Peptide Manufacturing Standards & Quality Testing",
    description: "Our peptide manufacturing standards: third-party HPLC, LAL, and ICP-MS testing on domestic compliant facilities, with full batch transparency on every wholesale peptide supplier order.",
  },
  coa: {
    path: "/batch-verification", title: "Batch Verification",
    seoTitle: "Batch Verification & COA Lookup | Peptide Quality Assurance",
    description: "Verify your peptide batch with our COA lookup tool. Every wholesale peptide order includes batch-specific third-party lab documentation for full transparency.",
  },
  privacy: {
    path: "/privacy", title: "Privacy Policy",
    seoTitle: "Privacy Policy | WholesaleUSPeptides.com",
    description: "How WholesaleUSPeptides.com collects, uses, and protects information submitted by qualified business purchasers through lead forms, analytics, and cookies.",
  },
  terms: {
    path: "/terms", title: "Terms of Service",
    seoTitle: "Terms of Service | WholesaleUSPeptides.com",
    description: "Terms governing access to and use of the WholesaleUSPeptides.com wholesale manufacturing platform by qualified business purchasers.",
  },
  disclaimer: {
    path: "/disclaimer", title: "Disclaimer",
    seoTitle: "Disclaimer | WholesaleUSPeptides.com",
    description: "Research Use Only disclaimer and jurisdictional compliance responsibilities for purchasers on the WholesaleUSPeptides.com wholesale platform.",
  },
  cookies: {
    path: "/cookie-policy", title: "Cookie Policy",
    seoTitle: "Cookie Policy | WholesaleUSPeptides.com",
    description: "How WholesaleUSPeptides.com uses analytics, functional, and preference cookies across the wholesale manufacturing platform.",
  },
};

function pageIdFromPath(path) {
  const found = Object.entries(PAGES).find(([, v]) => v.path === path);
  return found ? found[0] : "home";
}

function upsertMeta(attr, value, content) {
  let el = document.querySelector(`meta[${attr}="${value}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, value);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

const TIERS = [
  {id:"R1",lbl:"10-20/SKU",  min:10, max:20,  grp:"retail"},
  {id:"R2",lbl:"21-40/SKU",  min:21, max:40,  grp:"retail"},
  {id:"R3",lbl:"41-60/SKU",  min:41, max:60,  grp:"retail"},
  {id:"T1",lbl:"61-199/SKU", min:61, max:199, grp:"wholesale"},
  {id:"T2",lbl:"200-399/SKU",min:200,max:399, grp:"wholesale"},
  {id:"T3",lbl:"400-599/SKU",min:400,max:599, grp:"wholesale"},
  {id:"T4",lbl:"600-999/SKU",min:600,max:999, grp:"wholesale"},
  {id:"T5",lbl:"1000+/SKU",  min:1000,max:null,grp:"wholesale"},
];

function tierForQty(qty) {
  const q = Math.max(10, qty || 10);
  for (const t of TIERS) {
    if (q >= t.min && (t.max === null || q <= t.max)) return t.id;
  }
  return "R1";
}

const fmt = n => n != null ? "$" + Number(n).toFixed(2) : "$0.00";

// A price is only valid for display if it is a finite, positive number.
// null/undefined/0/NaN all mean "no pricing data" — never render those as $0.
const hasPrice = n => typeof n === "number" && Number.isFinite(n) && n > 0;
const NO_PRICE_LABEL = "Pricing Available Upon Request";


const CATS = ["All","Peptides","GLP","Bio Regulators","Blends","Sprays","Topicals","Capsules","Diluents"];

const P = [
  {id:1, c:"Peptides",      n:"BPC-157",         s:"5mg",  R1:26,  R2:24.5,R3:23,  T1:21,  T2:16.5,T3:15,  T4:13.5,T5:12,  hot:1},
  {id:2, c:"Peptides",      n:"BPC-157",         s:"10mg", R1:37.5,R2:35,  R3:32.5,T1:30,  T2:22,  T3:17.5,T4:16,  T5:13,  hot:0},
  {id:3, c:"Peptides",      n:"BPC-157",         s:"15mg", R1:49,  R2:45.5,R3:42,  T1:39,  T2:31.5,T3:27.5,T4:23.5,T5:18,  hot:0},
  {id:4, c:"Peptides",      n:"BPC-157",         s:"20mg", R1:60,  R2:56,  R3:52,  T1:48,  T2:38.5,T3:32.5,T4:27,  T5:20,  hot:0},
  {id:5, c:"Peptides",      n:"TB-500",          s:"5mg",  R1:37.5,R2:35,  R3:32.5,T1:30,  T2:25,  T3:22.5,T4:18,  T5:16,  hot:1},
  {id:6, c:"Peptides",      n:"TB-500",          s:"10mg", R1:45,  R2:40,  R3:35,  T1:37.5,T2:35.5,T3:32.5,T4:29,  T5:26,  hot:0},
  {id:7, c:"Peptides",      n:"Ipamorelin",      s:"5mg",  R1:22.5,R2:21,  R3:19.5,T1:18,  T2:16.5,T3:15,  T4:13.5,T5:12,  hot:0},
  {id:8, c:"Peptides",      n:"Ipamorelin",      s:"10mg", R1:30,  R2:28,  R3:26,  T1:24,  T2:22,  T3:20,  T4:18,  T5:14,  hot:0},
  {id:9, c:"Peptides",      n:"AOD-9604",        s:"5mg",  R1:52.5,R2:49,  R3:45.5,T1:42,  T2:36,  T3:32.5,T4:27,  T5:24,  hot:0},
  {id:10,c:"Peptides",      n:"AOD-9604",        s:"10mg", R1:50,  R2:48.5,R3:47,  T1:45.5,T2:44.5,T3:43,  T4:41.5,T5:40,  hot:0},
  {id:11,c:"Peptides",      n:"CJC-1295 W DAC",  s:"5mg",  R1:71,  R2:66.5,R3:62,  T1:57,  T2:49.5,T3:42.5,T4:36,  T5:30,  hot:0},
  {id:12,c:"Peptides",      n:"CJC-1295 W DAC",  s:"10mg", R1:112.5,R2:105,R3:97.5,T1:90, T2:80,  T3:70,  T4:61,  T5:52,  hot:0},
  {id:13,c:"Peptides",      n:"CJC-1295",        s:"5mg",  R1:41,  R2:38.5,R3:36,  T1:33,  T2:27.5,T3:25,  T4:22.5,T5:18,  hot:0},
  {id:14,c:"Peptides",      n:"CJC-1295",        s:"10mg", R1:67.5,R2:63,  R3:58.5,T1:54,  T2:47,  T3:40,  T4:34,  T5:28,  hot:0},
  {id:15,c:"Peptides",      n:"Epithalon",       s:"10mg", R1:22.5,R2:21,  R3:19.5,T1:18,  T2:16.5,T3:15,  T4:13.5,T5:12,  hot:0},
  {id:16,c:"Peptides",      n:"Epithalon",       s:"50mg", R1:62,  R2:58.5,R3:54.5,T1:51,  T2:47,  T3:43.5,T4:39.5,T5:36,  hot:0},
  {id:17,c:"Peptides",      n:"GHK-Cu",          s:"50mg", R1:22.5,R2:21,  R3:19.5,T1:18,  T2:14,  T3:12.5,T4:11,  T5:10,  hot:1},
  {id:18,c:"Peptides",      n:"GHK-Cu",          s:"100mg",R1:30,  R2:27.5,R3:25.5,T1:23,  T2:21,  T3:18.5,T4:16.5,T5:14,  hot:0},
  {id:19,c:"Peptides",      n:"Melanotan-II",    s:"10mg", R1:30,  R2:28,  R3:26,  T1:24,  T2:19,  T3:17.5,T4:16,  T5:12,  hot:0},
  {id:20,c:"Peptides",      n:"FOXO4-DRI",       s:"10mg", R1:187.5,R2:175,R3:162.5,T1:150,T2:132,T3:115, T4:99,  T5:84,  hot:0},
  {id:21,c:"Peptides",      n:"KPV",             s:"10mg", R1:30,  R2:28,  R3:26,  T1:24,  T2:19,  T3:17.5,T4:16,  T5:14,  hot:0},
  {id:22,c:"Peptides",      n:"VIP",             s:"5mg",  R1:34,  R2:31.5,R3:29,  T1:27,  T2:22,  T3:20,  T4:16,  T5:14,  hot:0},
  {id:23,c:"Peptides",      n:"VIP",             s:"10mg", R1:60,  R2:56,  R3:52,  T1:48,  T2:41,  T3:35,  T4:29,  T5:24,  hot:0},
  {id:24,c:"Peptides",      n:"GHRP-2",          s:"5mg",  R1:22.5,R2:21,  R3:19.5,T1:18,  T2:16.5,T3:15,  T4:13.5,T5:12,  hot:0},
  {id:25,c:"Peptides",      n:"GHRP-6",          s:"5mg",  R1:22.5,R2:21,  R3:19.5,T1:18,  T2:16.5,T3:15,  T4:13.5,T5:12,  hot:0},
  {id:26,c:"Peptides",      n:"SNAP-8",          s:"10mg", R1:22.5,R2:21,  R3:19.5,T1:18,  T2:16.5,T3:15,  T4:13.5,T5:12,  hot:0},
  {id:27,c:"Peptides",      n:"MOTS-C",          s:"10mg", R1:26,  R2:24.5,R3:23,  T1:21,  T2:19,  T3:17.5,T4:16,  T5:14,  hot:1},
  {id:28,c:"Peptides",      n:"MOTS-C",          s:"20mg", R1:67.5,R2:63,  R3:58.5,T1:54,  T2:47,  T3:40,  T4:34,  T5:28,  hot:0},
  {id:29,c:"Peptides",      n:"IGF-1 LR3",       s:"1mg",  R1:95,  R2:88,  R3:80.5,T1:73.5,T2:66.5,T3:59.5,T4:52,  T5:45,  hot:0},
  {id:30,c:"Peptides",      n:"Dihexa",          s:"5mg",  R1:19,  R2:17.5,R3:16,  T1:15,  T2:14,  T3:12.5,T4:11,  T5:10,  hot:0},
  {id:31,c:"Peptides",      n:"Oxytocin",        s:"10mg", R1:30,  R2:28,  R3:26,  T1:24,  T2:19,  T3:17.5,T4:16,  T5:14,  hot:0},
  {id:32,c:"Peptides",      n:"PT-141",          s:"10mg", R1:26,  R2:24.5,R3:23,  T1:21,  T2:19,  T3:17.5,T4:16,  T5:14,  hot:0},
  {id:33,c:"Peptides",      n:"Thymosin Alpha-1",s:"10mg", R1:48,  R2:45,  R3:42.5,T1:39.5,T2:36.5,T3:33.5,T4:31,  T5:28,  hot:0},
  {id:34,c:"Peptides",      n:"Gonadorelin",     s:"10mg", R1:41,  R2:38.5,R3:36,  T1:33,  T2:27.5,T3:22.5,T4:20,  T5:16,  hot:0},
  {id:35,c:"Peptides",      n:"Semax",           s:"10mg", R1:26,  R2:24.5,R3:23,  T1:21,  T2:19,  T3:17.5,T4:16,  T5:12,  hot:0},
  {id:36,c:"Peptides",      n:"Selank",          s:"10mg", R1:26,  R2:24.5,R3:23,  T1:21,  T2:19,  T3:17.5,T4:16,  T5:12,  hot:0},
  {id:37,c:"Peptides",      n:"NAD+",            s:"500mg",R1:37.5,R2:35,  R3:32.5,T1:30,  T2:27.5,T3:25,  T4:22.5,T5:20,  hot:1},
  {id:38,c:"Peptides",      n:"NAD+",            s:"1000mg",R1:67.5,R2:63, R3:58.5,T1:54,  T2:49.5,T3:45,  T4:40.5,T5:36,  hot:0},
  {id:39,c:"Peptides",      n:"LL-37",           s:"5mg",  R1:56,  R2:52.5,R3:49,  T1:45,  T2:38.5,T3:32.5,T4:29,  T5:24,  hot:0},
  {id:40,c:"Peptides",      n:"ARA-290",         s:"16mg", R1:49,  R2:45.5,R3:42,  T1:39,  T2:36,  T3:32.5,T4:29,  T5:26,  hot:0},
  {id:41,c:"Peptides",      n:"SS-31",           s:"10mg", R1:34,  R2:31.5,R3:29,  T1:27,  T2:25,  T3:22.5,T4:20,  T5:18,  hot:0},
  {id:42,c:"Peptides",      n:"HGH Frag 176-191",s:"5mg",  R1:56,  R2:52.5,R3:49,  T1:45,  T2:38.5,T3:32.5,T4:29,  T5:24,  hot:0},
  {id:43,c:"GLP",           n:"GLP-S",              s:"5mg",  R1:45,  R2:43,  R3:40.5,T1:38.5,T2:36.5,T3:34.5,T4:32,  T5:30,  hot:1},
  {id:44,c:"GLP",           n:"GLP-S",              s:"10mg", R1:55,  R2:53,  R3:50.5,T1:48.5,T2:46.5,T3:44.5,T4:42,  T5:40,  hot:1},
  {id:45,c:"GLP",           n:"GLP-S",              s:"15mg", R1:75,  R2:72,  R3:69.5,T1:66.5,T2:63.5,T3:60.5,T4:58,  T5:55,  hot:0},
  {id:46,c:"GLP",           n:"GLP-S",              s:"20mg", R1:90,  R2:86.5,R3:83,  T1:79.5,T2:75.5,T3:72,  T4:68.5,T5:65,  hot:0},
  {id:47,c:"GLP",           n:"GLP-T",              s:"10mg", R1:48,  R2:46.5,R3:44.5,T1:43,  T2:41,  T3:39.5,T4:37.5,T5:36,  hot:1},
  {id:48,c:"GLP",           n:"GLP-T",              s:"15mg", R1:58,  R2:56,  R3:54.5,T1:52.5,T2:50.5,T3:48.5,T4:47,  T5:45,  hot:0},
  {id:49,c:"GLP",           n:"GLP-T",              s:"20mg", R1:74,  R2:70.5,R3:67.5,T1:64,  T2:61,  T3:57.5,T4:54.5,T5:51,  hot:0},
  {id:50,c:"GLP",           n:"GLP-T",              s:"30mg", R1:80,  R2:78.5,R3:76.5,T1:75,  T2:73,  T3:71.5,T4:69.5,T5:68,  hot:0},
  {id:51,c:"GLP",           n:"GLP-T",              s:"40mg", R1:90,  R2:88.5,R3:86.5,T1:85,  T2:83,  T3:81.5,T4:79.5,T5:78,  hot:0},
  {id:52,c:"GLP",           n:"GLP-R",              s:"10mg", R1:55,  R2:53,  R3:50.5,T1:48.5,T2:46.5,T3:44.5,T4:42,  T5:40,  hot:0},
  {id:53,c:"GLP",           n:"GLP-R",              s:"20mg", R1:90,  R2:88,  R3:85.5,T1:83.5,T2:81.5,T3:79.5,T4:77,  T5:75,  hot:0},
  {id:54,c:"GLP",           n:"GLP-R",              s:"30mg", R1:120, R2:115.5,R3:111.5,T1:107,T2:103,T3:98.5,T4:94.5,T5:90,  hot:0},
  {id:55,c:"GLP",           n:"Tesamorelin",     s:"5mg",  R1:37.5,R2:35,  R3:32.5,T1:30,  T2:27.5,T3:22.5,T4:18,  T5:16,  hot:0},
  {id:56,c:"GLP",           n:"Tesamorelin",     s:"10mg", R1:60,  R2:56,  R3:52,  T1:48,  T2:44,  T3:40,  T4:36,  T5:32,  hot:0},
  {id:57,c:"GLP",           n:"Tesamorelin",     s:"20mg", R1:135, R2:126, R3:117, T1:108, T2:93.5,T3:85,  T4:72,  T5:64,  hot:0},
  {id:58,c:"GLP",           n:"Sermorelin",      s:"5mg",  R1:34,  R2:31.5,R3:29,  T1:27,  T2:22,  T3:17.5,T4:16,  T5:14,  hot:0},
  {id:59,c:"GLP",           n:"Sermorelin",      s:"10mg", R1:54,  R2:50.5,R3:47,  T1:43.5,T2:40,  T3:36.5,T4:33,  T5:29.5,hot:0},
  {id:60,c:"Bio Regulators",n:"Pinealon",        s:"20mg", R1:37.5,R2:35,  R3:32.5,T1:30,  T2:25,  T3:20,  T4:18,  T5:14,  hot:0},
  {id:61,c:"Bio Regulators",n:"Ovagen",          s:"20mg", R1:37.5,R2:35,  R3:32.5,T1:30,  T2:25,  T3:20,  T4:18,  T5:14,  hot:0},
  {id:62,c:"Bio Regulators",n:"Chonluten",       s:"20mg", R1:37.5,R2:35,  R3:32.5,T1:30,  T2:25,  T3:20,  T4:18,  T5:14,  hot:0},
  {id:63,c:"Bio Regulators",n:"Thymalin",        s:"20mg", R1:37.5,R2:35,  R3:32.5,T1:30,  T2:25,  T3:20,  T4:18,  T5:14,  hot:0},
  {id:64,c:"Bio Regulators",n:"Cardiogen",       s:"20mg", R1:37.5,R2:35,  R3:32.5,T1:30,  T2:25,  T3:20,  T4:18,  T5:14,  hot:0},
  {id:65,c:"Bio Regulators",n:"Vesugen",         s:"20mg", R1:37.5,R2:35,  R3:32.5,T1:30,  T2:25,  T3:20,  T4:18,  T5:14,  hot:0},
  {id:66,c:"Bio Regulators",n:"Testagen",        s:"20mg", R1:37.5,R2:35,  R3:32.5,T1:30,  T2:25,  T3:20,  T4:18,  T5:14,  hot:0},
  {id:67,c:"Bio Regulators",n:"Vilon",           s:"20mg", R1:37.5,R2:35,  R3:32.5,T1:30,  T2:25,  T3:20,  T4:18,  T5:14,  hot:0},
  {id:68,c:"Bio Regulators",n:"Crystagen",       s:"20mg", R1:37.5,R2:35,  R3:32.5,T1:30,  T2:25,  T3:20,  T4:18,  T5:14,  hot:0},
  {id:69,c:"Bio Regulators",n:"Bronchogen",      s:"20mg", R1:37.5,R2:35,  R3:32.5,T1:30,  T2:25,  T3:20,  T4:18,  T5:14,  hot:0},
  {id:70,c:"Blends",        n:"BPC-TB Blend",    s:"5/5mg",R1:30,  R2:30,  R3:30,  T1:28,  T2:26,  T3:26,  T4:24,  T5:22,  hot:1},
  {id:71,c:"Blends",        n:"BPC-TB Blend",    s:"10/10mg",R1:38,R2:36,  R3:34,  T1:34,  T2:32,  T3:32,  T4:30,  T5:28,  hot:0},
  {id:72,c:"Blends",        n:"Ipa/CJC Blend",   s:"5/5mg",R1:28,  R2:27,  R3:26,  T1:26,  T2:24,  T3:22,  T4:22,  T5:20,  hot:1},
  {id:73,c:"Blends",        n:"GLOW Blend",      s:"50/10/10mg",R1:36,R2:35,R3:34,T1:34,  T2:32,  T3:32,  T4:30,  T5:30,  hot:0},
  {id:74,c:"Blends",        n:"KLOW Blend",      s:"50/10mg",R1:44,R2:43,  R3:42,  T1:42,  T2:40,  T3:38,  T4:38,  T5:38,  hot:0},
  {id:75,c:"Blends",        n:"Semax/Selank",    s:"30/10mg",R1:38,R2:37,  R3:36,  T1:36,  T2:34,  T3:34,  T4:32,  T5:32,  hot:0},
  {id:76,c:"Blends",        n:"AOD/Tesa Blend",  s:"5/5mg", R1:46, R2:45,  R3:44,  T1:44,  T2:42,  T3:40,  T4:40,  T5:40,  hot:0},
  {id:77,c:"Sprays",        n:"BPC-157 Spray",   s:"30ml",  R1:42, R2:40,  R3:38,  T1:35,  T2:32.5,T3:32.5,T4:30,  T5:30,  hot:0},
  {id:78,c:"Sprays",        n:"NAD+ Spray",      s:"30ml",  R1:42, R2:40,  R3:38,  T1:35,  T2:32.5,T3:32.5,T4:30,  T5:30,  hot:1},
  {id:79,c:"Sprays",        n:"Semax Spray",     s:"30ml",  R1:40, R2:38,  R3:36,  T1:33,  T2:30.5,T3:30.5,T4:28,  T5:28,  hot:0},
  {id:80,c:"Sprays",        n:"Selank Spray",    s:"30ml",  R1:40, R2:38,  R3:36,  T1:33,  T2:30.5,T3:30.5,T4:28,  T5:28,  hot:0},
  {id:81,c:"Sprays",        n:"PT-141 Spray",    s:"30ml",  R1:42, R2:40,  R3:38,  T1:35,  T2:32.5,T3:32.5,T4:30,  T5:30,  hot:0},
  {id:82,c:"Sprays",        n:"TB500 Spray",     s:"30ml",  R1:42, R2:40,  R3:38,  T1:35,  T2:32.5,T3:32.5,T4:30,  T5:30,  hot:0},
  {id:83,c:"Topicals",      n:"Repair Cream",    s:"50ml",  R1:89.99,R2:85.99,R3:82.99,T1:45,T2:42.5,T3:42.5,T4:40,T5:40, hot:1},
  {id:84,c:"Topicals",      n:"Smooth Cream",    s:"50ml",  R1:94.99,R2:90.99,R3:87.99,T1:49,T2:46.5,T3:46.5,T4:44,T5:44, hot:0},
  {id:85,c:"Topicals",      n:"Tan Cream",       s:"50ml",  R1:89.99,R2:85.99,R3:82.99,T1:45,T2:42.5,T3:42.5,T4:40,T5:40, hot:0},
  {id:86,c:"Diluents",      n:"Water",           s:"10ml",  R1:6.99,R2:6.49,R3:5.99,T1:4.5,T2:4.5,T3:4.5,T4:4.5,T5:4.5,   hot:0},
  {id:87,c:"Capsules",      n:"BPC-157",         s:"500mcg / 60ct", R1:0,R2:0,R3:0,T1:0,T2:0,T3:0,T4:0,T5:0, hot:0},
  {id:88,c:"Capsules",      n:"BPC-157",         s:"1mg / 60ct",    R1:0,R2:0,R3:0,T1:0,T2:0,T3:0,T4:0,T5:0, hot:0},
  {id:89,c:"Capsules",      n:"TB-500",          s:"5mg / 60ct",    R1:0,R2:0,R3:0,T1:0,T2:0,T3:0,T4:0,T5:0, hot:0},
  {id:90,c:"Capsules",      n:"NAD+",            s:"250mg / 60ct",  R1:0,R2:0,R3:0,T1:0,T2:0,T3:0,T4:0,T5:0, hot:0},
  {id:91,c:"Capsules",      n:"NAD+",            s:"500mg / 60ct",  R1:0,R2:0,R3:0,T1:0,T2:0,T3:0,T4:0,T5:0, hot:0},
  {id:92,c:"Capsules",      n:"NMN",             s:"250mg / 60ct",  R1:0,R2:0,R3:0,T1:0,T2:0,T3:0,T4:0,T5:0, hot:0},
  {id:93,c:"Capsules",      n:"NMN",             s:"500mg / 60ct",  R1:0,R2:0,R3:0,T1:0,T2:0,T3:0,T4:0,T5:0, hot:0},
  {id:94,c:"Capsules",      n:"Methylene Blue",  s:"50mg / 60ct",   R1:0,R2:0,R3:0,T1:0,T2:0,T3:0,T4:0,T5:0, hot:0},
  {id:95,c:"Capsules",      n:"LDN",             s:"1.5mg / 60ct",  R1:0,R2:0,R3:0,T1:0,T2:0,T3:0,T4:0,T5:0, hot:0},
  {id:96,c:"Capsules",      n:"LDN",             s:"4.5mg / 60ct",  R1:0,R2:0,R3:0,T1:0,T2:0,T3:0,T4:0,T5:0, hot:0},
  {id:97,c:"Capsules",      n:"Berberine HCl",   s:"500mg / 60ct",  R1:0,R2:0,R3:0,T1:0,T2:0,T3:0,T4:0,T5:0, hot:0},
  {id:98,c:"Capsules",      n:"Rapamycin",       s:"1mg / 60ct",    R1:0,R2:0,R3:0,T1:0,T2:0,T3:0,T4:0,T5:0, hot:0},
  {id:99,c:"Capsules",      n:"Metformin",       s:"500mg / 60ct",  R1:0,R2:0,R3:0,T1:0,T2:0,T3:0,T4:0,T5:0, hot:0},
];

function groupProducts(flat) {
  const map = new Map();
  for (const item of flat) {
    const key = item.n + "|||" + item.c;
    if (!map.has(key)) {
      map.set(key, {
        id: item.n.toLowerCase().replace(/[^a-z0-9]+/g,"-") + "-" + item.c.toLowerCase().replace(/[^a-z0-9]+/g,"-"),
        c: item.c,
        n: item.n,
        hot: item.hot,
        variants: [],
      });
    }
    const grp = map.get(key);
    if (item.hot === 1) grp.hot = 1;
    grp.variants.push({ id: item.id, s: item.s, R1:item.R1, R2:item.R2, R3:item.R3, T1:item.T1, T2:item.T2, T3:item.T3, T4:item.T4, T5:item.T5 });
  }
  return Array.from(map.values());
}

const GROUPED = groupProducts(P);


function Hero({ setPage }) {
  return (
    <div style={{background:C.navy,padding:"88px 40px 72px",position:"relative",overflow:"hidden"}}>
      {/* Subtle flag-inspired vertical stripes — elegant, not patriotic */}
      <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",pointerEvents:"none"}}>
        {[0,1,2,3,4,5,6,7,8,9,10,11,12].map(i=>(
          <div key={i} style={{position:"absolute",top:0,bottom:0,left:`${i*7.7}%`,width:"3.8%",background:i%2===0?"rgba(178,34,52,0.04)":"rgba(60,59,110,0.04)"}}/>
        ))}
      </div>
      <div style={{maxWidth:1240,margin:"0 auto",position:"relative"}} className="hero-grid">
        <div className="hero-copy">
          <div style={{display:"inline-flex",alignItems:"center",gap:10,marginBottom:22,padding:"6px 14px",border:"1px solid rgba(201,168,76,0.3)",background:"rgba(201,168,76,0.06)"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:C.gold}}/>
            <span style={{fontSize:9,letterSpacing:3.5,color:C.gold,textTransform:"uppercase",fontWeight:700}}>Wholesale Manufacturing Platform — Minimum 10 Units Per SKU</span>
          </div>
          <div style={{width:56,height:3,background:C.gold,marginBottom:22}}/>
          <h1 style={{fontSize:44,fontWeight:800,color:C.white,lineHeight:1.16,marginBottom:18,letterSpacing:-1.2,fontFamily:"Georgia,serif",maxWidth:620}}>
            American Peptide Manufacturing Built for<br/>
            <span style={{color:C.gold}}>Scalable Private Label Growth.</span>
          </h1>
          <p style={{fontSize:15,color:"rgba(255,255,255,0.55)",lineHeight:1.9,maxWidth:540,marginBottom:18,fontWeight:300}}>
            WholesaleUSPeptides.com provides batch-verified peptide manufacturing, white-label packaging, and fulfillment solutions for research organizations, private label brands, and qualified distributors.
          </p>
          <p style={{fontSize:11,color:C.gold,letterSpacing:1,lineHeight:1.7,maxWidth:540,marginBottom:32,fontWeight:600,textTransform:"uppercase"}}>
            Minimum Order: 10 Units Per SKU &nbsp;·&nbsp; Quotes Delivered Within 48 Hours &nbsp;·&nbsp; Batch-Specific COAs Available
          </p>
          <div style={{display:"flex",gap:12,marginBottom:40,flexWrap:"wrap"}}>
            <button onClick={()=>setPage("catalog")} style={{padding:"13px 30px",background:C.gold,border:"none",color:C.navy,fontSize:11,fontWeight:800,letterSpacing:2,textTransform:"uppercase",cursor:"pointer"}}>
              Request Wholesale Pricing
            </button>
            <button onClick={()=>setPage("catalog")} style={{padding:"13px 28px",background:"transparent",border:"1px solid rgba(201,168,76,0.4)",color:C.gold,fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",cursor:"pointer"}}>
              View Product Catalog
            </button>
            <a href="/downloads/2026-wholesaleuspeptides-partner-catalog.pdf" download onClick={()=>trackEvent("catalog_download")} style={{padding:"13px 28px",background:"transparent",border:"1px solid rgba(255,255,255,0.25)",color:"rgba(255,255,255,0.85)",fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",cursor:"pointer",textDecoration:"none",display:"inline-flex",alignItems:"center"}}>
              Download Partner Catalog
            </a>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:0,borderTop:"1px solid rgba(201,168,76,0.15)",paddingTop:26}} className="hero-trust-row">
            {[
              "Made in USA",
              "Third-Party Tested",
              "Batch Traceable",
              "White Label Ready",
            ].map((t,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,paddingRight:14,borderRight:i<3?"1px solid rgba(201,168,76,0.12)":"none",marginRight:i<3?14:0}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:C.gold,flexShrink:0}}/>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.55)",lineHeight:1.4}}>{t}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-visual-glow"/>
          <div className="hero-visual-item hero-visual-cream">
            <img src="/images/master/master-cream-pump.png" alt="Topical cream pump" onError={e=>{e.target.parentElement.style.visibility="hidden";}}/>
          </div>
          <div className="hero-visual-item hero-visual-spray">
            <img src="/images/master/master-spray.png" alt="Nasal spray bottle" onError={e=>{e.target.parentElement.style.visibility="hidden";}}/>
          </div>
          <div className="hero-visual-item hero-visual-capsule">
            <img src="/images/master/master-capsule.png" alt="Capsule bottle" onError={e=>{e.target.parentElement.style.visibility="hidden";}}/>
          </div>
          <div className="hero-visual-item hero-visual-vial">
            <img src="/images/master/master-vial.png" alt="Injectable vial" onError={e=>{e.target.parentElement.style.visibility="hidden";}}/>
          </div>
        </div>
      </div>
    </div>
  );
}


// ── MASTER ASSET IMAGE SYSTEM ─────────────────────────────────────────────────
// Every product reuses one of four master container photos. Per-product
// identity (name / strength) is rendered as a text overlay, not baked into
// the image, so a single asset serves the entire category.
const MASTER_ASSET = {
  Topicals: '/images/master/master-cream-pump.png', // airless cream pump bottle
  Sprays:   '/images/master/master-spray.png',      // nasal spray bottle
  Capsules: '/images/master/master-capsule.png',    // capsule bottle
};
const MASTER_ASSET_DEFAULT = '/images/master/master-vial.png'; // injectable vial

function masterAssetFor(cat) {
  return MASTER_ASSET[cat] || MASTER_ASSET_DEFAULT;
}

function ProductVisual({ name, strength, cat }) {
  const src = masterAssetFor(cat);
  return (
    <div className="product-visual">
      <img
        src={src}
        alt={name}
        className="product-img"
        onError={e => {
          console.error(`Master asset not found: ${name} (${cat}) -> ${src}`);
          e.target.style.display = 'none';
        }}
      />
      <div className="product-label-overlay">
        <div className="product-label-name">{name}</div>
        {strength && <div className="product-label-strength">{strength}</div>}
      </div>
    </div>
  );
}




// ── PRODUCT CARD ──────────────────────────────────────────────────────────────
function ProdCard({ p, onAdd, onOpenCart, partnerUnlocked, onUnlockClick }) {
  const [hov, setHov] = useState(false);
  const [varIdx, setVarIdx] = useState(0);
  const [qty, setQty] = useState(10);
  const variant = p.variants[varIdx];
  const t = tierForQty(qty);
  const price = variant[t] || 0;
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:C.white,border:"1px solid "+(hov?C.gold:C.mist),display:"flex",flexDirection:"column",transition:"all 0.25s ease",boxShadow:hov?"0 12px 32px rgba(5,17,31,0.16)":"0 2px 8px rgba(5,17,31,0.04)",transform:hov?"translateY(-4px)":"translateY(0)"}}>
      <div style={{position:"relative",flexShrink:0,transform:hov?"scale(1.03)":"scale(1)",transition:"transform 0.35s ease",overflow:"hidden"}}>
        <ProductVisual name={p.n} strength={variant.s} cat={p.c}/>
        {p.hot===1 && <div style={{position:"absolute",top:9,left:9,background:C.navy,color:C.gold,fontSize:8,fontWeight:700,letterSpacing:2,textTransform:"uppercase",padding:"3px 8px",zIndex:2}}>Top Seller</div>}
        <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:C.gold,zIndex:2}}/>
      </div>
      <div style={{padding:"22px 20px 26px",flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{fontSize:8,letterSpacing:2.5,color:C.gold,textTransform:"uppercase",fontWeight:700,marginBottom:10}}>{p.c}</div>
        <div style={{fontSize:16,fontWeight:700,color:C.navy,marginBottom:14,fontFamily:"Georgia,serif",lineHeight:1.3}}>{p.n}</div>
        {p.variants.length > 1 && (
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:14}}>
            {p.variants.map((v,i)=>(
              <button key={v.id} onClick={()=>setVarIdx(i)} className="btn-polish"
                style={{padding:"3px 9px",fontSize:10,fontWeight:600,cursor:"pointer",border:"1px solid "+(i===varIdx?C.navy:C.mist),background:i===varIdx?C.navy:"transparent",color:i===varIdx?C.white:C.stone,transition:"all 0.15s"}}>
                {v.s}
              </button>
            ))}
          </div>
        )}
        {p.variants.length === 1 && (
          <div style={{fontSize:11,color:C.stone,marginBottom:14}}>{variant.s}</div>
        )}
        {partnerUnlocked ? (
          <div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:2,marginBottom:14}}>
            {TIERS.map(tr=>{
              const active = tr.id===t;
              return (
                <div key={tr.id} style={{textAlign:"center",padding:"3px 1px",background:active?"rgba(201,168,76,0.1)":"transparent",border:"1px solid "+(active?C.gold:C.mist)}}>
                  <div style={{fontSize:7.5,color:active?C.navy:C.stone,fontWeight:active?700:400}}>
                    {hasPrice(variant[tr.id])?fmt(variant[tr.id]):"—"}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{marginBottom:14}}>
            {hasPrice(variant.R1) ? (
              <div style={{display:"flex",alignItems:"baseline",gap:6,marginBottom:9}}>
                <div style={{fontSize:8,letterSpacing:1.5,color:C.stone,textTransform:"uppercase",fontWeight:700}}>Starting At</div>
                <div style={{fontSize:15,fontWeight:800,color:C.navy}}>{fmt(variant.R1)}</div>
                <div style={{fontSize:9,color:C.stone}}>/unit (10+ units)</div>
              </div>
            ) : (
              <div style={{fontSize:12,fontWeight:700,color:C.navy,marginBottom:9}}>{NO_PRICE_LABEL}</div>
            )}
            <button onClick={onUnlockClick} className="btn-polish" style={{width:"100%",padding:"8px 0",background:"transparent",border:"1px solid "+C.gold,color:C.navy,fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",cursor:"pointer"}}>
              Unlock Partner Pricing
            </button>
          </div>
        )}
        <div style={{background:C.off,padding:"12px 14px",marginBottom:16,border:"1px solid "+C.mist}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
            <div style={{fontSize:8,color:C.stone,letterSpacing:1,textTransform:"uppercase",fontWeight:700}}>Units</div>
            <input type="number" min="10" value={qty} onChange={e=>setQty(Math.max(10,parseInt(e.target.value)||10))}
              style={{width:52,padding:"3px 6px",border:"1px solid "+C.mist,background:C.white,fontSize:11,color:C.navy,outline:"none",textAlign:"center"}}/>
          </div>
          {hasPrice(price) ? (
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
              <div style={{fontSize:9,color:C.stone}}>{fmt(price)}/unit</div>
              <div style={{fontSize:13,fontWeight:800,color:C.navy}}>{fmt(price*qty)}</div>
            </div>
          ) : (
            <div style={{fontSize:11,fontWeight:700,color:C.stone}}>{NO_PRICE_LABEL}</div>
          )}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:18}}>
          {["Min. Order: 10 Units","COA Available"].map(f=>(
            <div key={f} style={{display:"flex",gap:7,alignItems:"center"}}>
              <div style={{width:4,height:4,borderRadius:"50%",background:C.green,flexShrink:0}}/>
              <div style={{fontSize:10,color:C.stone}}>{f}</div>
            </div>
          ))}
        </div>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:8,letterSpacing:2,color:C.stone,textTransform:"uppercase",fontWeight:700,marginBottom:8}}>Manufacturing Standards</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
            {["Manufactured in USA","Third Party Tested","White Label Available","Batch Verified"].map((b,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 7px",background:C.off,border:"1px solid "+C.mist}}>
                <span style={{width:4,height:4,borderRadius:"50%",background:C.gold,flexShrink:0}}/>
                <span style={{fontSize:8,fontWeight:700,color:C.navy,textTransform:"uppercase",letterSpacing:0.2,lineHeight:1.3}}>{b}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{background:C.off,border:"1px solid "+C.mist,padding:"10px 12px",marginBottom:12}}>
          <div style={{fontSize:9,fontWeight:700,color:C.navy,textTransform:"uppercase",letterSpacing:1.5,marginBottom:5}}>Qualified Business Buyers Only</div>
          <div style={{fontSize:9.5,color:C.stone,lineHeight:1.6}}>Supplied to research organizations, distribution partners, manufacturing partners, and private label brands.</div>
        </div>
        <button onClick={()=>onAdd(p,variant,qty,t)} className="btn-polish" style={{padding:"9px 0",background:hov?C.navy:"transparent",border:"1px solid "+C.navy,color:hov?C.white:C.navy,fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",cursor:"pointer",transition:"all 0.25s ease"}}>
          Add to Order
        </button>
      </div>
    </div>
  );
}

// ── CATALOG PAGE ──────────────────────────────────────────────────────────────
function Catalog({ addToCart, openCart, partnerUnlocked, onUnlockClick }) {
  const [cat, setCat] = useState("All");
  const [srch, setSrch] = useState("");
  const [toast, setToast] = useState("");
  const rows = GROUPED.filter(p=>(cat==="All"||p.c===cat)&&(!srch||p.n.toLowerCase().includes(srch.toLowerCase())||p.c.toLowerCase().includes(srch.toLowerCase())||p.variants.some(v=>v.s.toLowerCase().includes(srch.toLowerCase()))));
  const add = (p,variant,qty,tier) => {
    if (addToCart) addToCart(p,variant,qty,tier);
    setToast(p.n);
    setTimeout(()=>setToast(""),2200);
  };
  return (
    <div style={{background:C.off,minHeight:"100vh"}}>
      {toast && <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:C.navy,color:C.white,padding:"10px 20px",fontSize:11,fontWeight:600,zIndex:999,whiteSpace:"nowrap",border:"1px solid "+C.gold}}>Added to Order: {toast}</div>}
      <div style={{background:C.navy,padding:"40px 40px 32px",borderBottom:"1px solid rgba(201,168,76,0.15)"}}>
        <div style={{maxWidth:1280,margin:"0 auto"}}>
          <div style={{fontSize:9,letterSpacing:4,color:C.gold,textTransform:"uppercase",fontWeight:700,marginBottom:10}}>Wholesale Catalog</div>
          <h1 style={{fontSize:32,fontWeight:800,lineHeight:1.18,color:C.white,fontFamily:"Georgia,serif",marginBottom:8}}>Research Compound Catalog</h1>
          <p style={{fontSize:11,color:"rgba(255,255,255,0.4)",lineHeight:1.7}}>American Manufacturing — Independent Testing Per Lot — Minimum 10 Units Per SKU</p>
        </div>
      </div>
      <div style={{maxWidth:1400,margin:"0 auto",padding:"24px 40px 72px"}}>
        <div style={{background:"#EDE9DF",border:"1px solid "+C.mist,padding:"9px 14px",marginBottom:16,fontSize:10,color:"#6B5E4A",lineHeight:1.7}}>
          <strong style={{color:C.red}}>RUO ONLY.</strong> All compounds for legitimate research purposes only. Not FDA approved. Not for human or veterinary use.
        </div>
        <div style={{marginBottom:16,background:C.white,border:"1px solid "+C.mist,padding:"12px 16px"}}>
          <div style={{fontSize:9,letterSpacing:2,color:C.stone,textTransform:"uppercase",fontWeight:700,marginBottom:9}}>Pricing Tiers — Applied Automatically by Quantity</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {["retail","wholesale"].map(grp=>(
              <div key={grp}>
                <div style={{fontSize:9,color:C.gold,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:5}}>{grp==="retail"?"Retail":"Wholesale"}</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {TIERS.filter(t=>t.grp===grp).map(t=>(
                    <div key={t.id} style={{padding:"4px 9px",border:"1px solid "+C.mist,background:C.off,fontSize:9,color:C.stone}}>{t.lbl}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:9,alignItems:"center"}}>
          {CATS.map(c=>(
            <button key={c} onClick={()=>setCat(c)} className="btn-polish" style={{padding:"5px 12px",fontSize:10,fontWeight:600,cursor:"pointer",border:"1px solid "+(cat===c?C.navy:C.mist),background:cat===c?C.navy:"transparent",color:cat===c?C.white:C.stone,transition:"all 0.15s"}}>
              {c}
            </button>
          ))}
          <input placeholder="Search..." value={srch} onChange={e=>setSrch(e.target.value)}
            style={{marginLeft:"auto",padding:"5px 12px",border:"1px solid "+C.mist,fontSize:11,outline:"none",background:C.white,color:C.navy,minWidth:170}}/>
        </div>
        <div style={{fontSize:10,color:C.stone,marginBottom:16}}>{rows.length} compounds — enter quantity, tier pricing applies automatically</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:1,background:C.mist}}>
          {rows.map(p=><ProdCard key={p.id} p={p} onAdd={add} onOpenCart={openCart} partnerUnlocked={partnerUnlocked} onUnlockClick={onUnlockClick}/>)}
        </div>
      </div>
    </div>
  );
}


function PartnerCard({ title, items }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:C.white,border:"1px solid "+(hov?C.gold:C.mist),padding:"32px 26px",textAlign:"center",transition:"all 0.25s ease",transform:hov?"translateY(-6px)":"translateY(0)",boxShadow:hov?"0 16px 34px rgba(5,17,31,0.16)":"0 6px 18px rgba(5,17,31,0.06)"}}>
      <div style={{width:28,height:2,background:C.gold,margin:"0 auto 16px"}}/>
      <div style={{fontSize:13,fontWeight:700,color:C.navy,fontFamily:"Georgia,serif",marginBottom:16,letterSpacing:2,textTransform:"uppercase"}}>{title}</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {items.map(it=>(
          <div key={it} style={{display:"flex",gap:7,alignItems:"center",justifyContent:"center"}}>
            <div style={{width:4,height:4,borderRadius:"50%",background:C.gold,flexShrink:0}}/>
            <div style={{fontSize:11,color:C.stone}}>{it}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── WHY PARTNERS CHOOSE US ──────────────────────────────────────────────────
function WhyPartners() {
  const cards = [
    {title:"Manufacturing", items:["cGMP APIs","Made in USA","White Label Support"]},
    {title:"Quality",       items:["Third-Party Tested","COA Available","Batch Traceable"]},
    {title:"Fulfillment",   items:["Inventory Management","Packaging Support","Nationwide Shipping"]},
    {title:"Partnership",   items:["Dedicated Account Support","Bulk Pricing","Custom Solutions"]},
  ];
  return (
    <div style={{background:C.off,padding:"68px 40px"}}>
      <div style={{maxWidth:1280,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:44}}>
          <div style={{fontSize:9,letterSpacing:4,color:C.gold,textTransform:"uppercase",fontWeight:700,marginBottom:12}}>Why Partners Choose Us</div>
          <h2 style={{fontSize:32,fontWeight:700,color:C.navy,fontFamily:"Georgia,serif",letterSpacing:-0.5,marginBottom:14}}>Built For Long-Term Manufacturing Partnerships.</h2>
          <p style={{fontSize:14,color:C.stone,lineHeight:1.8,maxWidth:620,margin:"0 auto"}}>Everything required to launch and scale a private-label peptide business under one trusted manufacturing partner.</p>
        </div>
        <div className="why-partners-grid">
          {cards.map((c,i)=><PartnerCard key={i} {...c}/>)}
        </div>
      </div>
    </div>
  );
}

// ── WHO WE SERVE ──────────────────────────────────────────────────────────────
function WhoWeServe() {
  const served = ["Research Organizations","Distribution Partners","Professional Organizations","Qualified Businesses","Laboratories","Private Label Brands","National Distributors"];
  return (
    <div className="home-section-pad" style={{background:C.white,padding:"84px 40px"}}>
      <div style={{maxWidth:1400,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:44}}>
          <div style={{fontSize:9,letterSpacing:4,color:C.gold,textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Who We Serve</div>
          <h2 style={{fontSize:36,fontWeight:800,lineHeight:1.18,color:C.navy,fontFamily:"Georgia,serif",letterSpacing:-0.5,marginBottom:12}}>Trusted by Distribution Partners &amp; Private-Label Brands</h2>
          <p style={{fontSize:14,color:C.stone,lineHeight:1.85,maxWidth:540,margin:"0 auto"}}>
            WholesaleUSPeptides.com supports qualified organizations nationwide.
          </p>
        </div>
        <div className="home-serve-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:1,background:C.mist}}>
          {served.map((label,i)=>(
            <div key={i} style={{background:C.white,padding:"30px 26px",textAlign:"center"}}>
              <div style={{width:26,height:3,background:C.gold,margin:"0 auto 16px"}}/>
              <div style={{fontSize:13,fontWeight:700,color:C.navy,letterSpacing:0.2,lineHeight:1.35}}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── UNLOCK PARTNER PRICING CTA ────────────────────────────────────────────────
function UnlockPartnerCTA({ partnerUnlocked, onUnlockClick, setPage }) {
  return (
    <div className="home-section-pad" style={{background:C.navy,padding:"84px 40px",borderTop:"1px solid rgba(201,168,76,0.15)"}}>
      <div style={{maxWidth:680,margin:"0 auto",textAlign:"center"}}>
        <div style={{fontSize:9,letterSpacing:4,color:C.gold,textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Partner Access</div>
        <h2 style={{fontSize:32,fontWeight:800,lineHeight:1.18,color:C.white,fontFamily:"Georgia,serif",letterSpacing:-0.5,marginBottom:16}}>Unlock Partner Pricing &amp; Resources</h2>
        <p style={{fontSize:14,color:"rgba(255,255,255,0.55)",lineHeight:1.85,maxWidth:520,margin:"0 auto 32px"}}>
          Register for partner access to view volume pricing, downloadable catalogs, white-label resources, and manufacturing documentation.
        </p>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          {partnerUnlocked ? (
            <button onClick={()=>setPage("catalog")} className="btn-polish" style={{padding:"15px 38px",background:C.gold,border:"none",color:C.navy,fontSize:11,fontWeight:800,letterSpacing:2,textTransform:"uppercase",cursor:"pointer"}}>
              View Wholesale Catalog
            </button>
          ) : (
            <button onClick={onUnlockClick} className="btn-polish" style={{padding:"15px 38px",background:C.gold,border:"none",color:C.navy,fontSize:11,fontWeight:800,letterSpacing:2,textTransform:"uppercase",cursor:"pointer"}}>
              Unlock Partner Access
            </button>
          )}
          <a href="/downloads/2026-wholesaleuspeptides-partner-catalog.pdf" download onClick={()=>trackEvent("catalog_download")} style={{padding:"15px 38px",background:"transparent",border:"1px solid rgba(255,255,255,0.25)",color:"rgba(255,255,255,0.85)",fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",cursor:"pointer",textDecoration:"none",display:"inline-flex",alignItems:"center"}}>
            Download Partner Catalog
          </a>
        </div>
      </div>
    </div>
  );
}

// ── STATS STRIP ──────────────────────────────────────────────────────────────
function StatsStrip() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const stats = ["10 Unit Minimums","250+ SKUs Available","48 Hour Quotes","Batch Traceability"];
  return (
    <div ref={ref} style={{background:C.navy,padding:"64px 40px"}}>
      <div style={{maxWidth:1400,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(4,1fr)"}} className="stats-strip-grid">
        {stats.map((s,i)=>(
          <div key={i} style={{textAlign:"center",padding:"0 24px",borderRight:i<3?"1px solid rgba(201,168,76,0.18)":"none",opacity:visible?1:0,transform:visible?"translateY(0)":"translateY(18px)",transition:`opacity 0.6s ease ${i*0.1}s, transform 0.6s ease ${i*0.1}s`}} className="stats-strip-item">
            <div style={{fontSize:28,fontWeight:800,color:C.gold,fontFamily:"Georgia,serif",letterSpacing:-0.3,lineHeight:1.3}} className="stats-strip-num">{s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── FOOTER ──────────────────────────────────────────────────────────────────
function Footer({ setPage, onContactClick }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const nav = [
    {label:"Catalog",           id:"catalog"},
    {label:"White Label",       id:"wl"},
    {label:"Standards",         id:"about"},
    {label:"Batch Verification",id:"coa"},
  ];
  const company = [
    {label:"Request Pricing", id:"catalog"},
    {label:"Contact",         id:null},
  ];
  const legal = [
    {label:"Privacy Policy",    id:"privacy"},
    {label:"Terms of Service",  id:"terms"},
    {label:"Disclaimer",        id:"disclaimer"},
    {label:"Cookie Policy",     id:"cookies"},
  ];
  return (
    <footer ref={ref} style={{background:C.navy,borderTop:"1px solid "+C.gold,padding:"56px 40px 28px",opacity:visible?1:0,transform:visible?"translateY(0)":"translateY(20px)",transition:"opacity 0.7s ease, transform 0.7s ease"}}>
      <div style={{maxWidth:1400,margin:"0 auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr 1fr 1fr 1fr",gap:40,marginBottom:36}} className="footer-grid">
          <div>
            <div style={{fontSize:15,fontWeight:800,color:C.white,fontFamily:"Georgia,serif",marginBottom:10}}>WholesaleUSPeptides.com</div>
            <p style={{fontSize:11,color:"rgba(255,255,255,0.4)",lineHeight:1.9,maxWidth:280,marginBottom:14}}>American peptide manufacturing and white-label solutions for qualified partners.</p>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",lineHeight:1.8}}>uniquesalesinc@gmail.com<br/>602-321-8381</div>
          </div>
          <div>
            <div style={{fontSize:9,letterSpacing:3,color:C.gold,textTransform:"uppercase",fontWeight:700,marginBottom:16,opacity:0.85}}>Navigation</div>
            {nav.map(({label,id})=>(
              <div key={label} onClick={()=>setPage(id)} className="footer-link" style={{fontSize:12,marginBottom:11,cursor:"pointer"}}>{label}</div>
            ))}
          </div>
          <div>
            <div style={{fontSize:9,letterSpacing:3,color:C.gold,textTransform:"uppercase",fontWeight:700,marginBottom:16,opacity:0.85}}>Company</div>
            {company.map(({label,id})=>{
              const onClick = label==="Contact" ? onContactClick : (id?()=>setPage(id):undefined);
              return <div key={label} onClick={onClick} className="footer-link" style={{fontSize:12,marginBottom:11,cursor:onClick?"pointer":"default"}}>{label}</div>;
            })}
          </div>
          <div>
            <div style={{fontSize:9,letterSpacing:3,color:C.gold,textTransform:"uppercase",fontWeight:700,marginBottom:16,opacity:0.85}}>Resources</div>
            <a href="/downloads/2026-wholesaleuspeptides-partner-catalog.pdf" download onClick={()=>trackEvent("catalog_download")} className="footer-link" style={{fontSize:12,marginBottom:11,cursor:"pointer",display:"block",textDecoration:"none"}}>Download Partner Catalog</a>
          </div>
          <div>
            <div style={{fontSize:9,letterSpacing:3,color:C.gold,textTransform:"uppercase",fontWeight:700,marginBottom:16,opacity:0.85}}>Legal</div>
            {legal.map(({label,id})=>(
              <div key={label} onClick={()=>setPage(id)} className="footer-link" style={{fontSize:12,marginBottom:11,cursor:"pointer"}}>{label}</div>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"flex-start",maxWidth:700,marginBottom:28}}>
          <div style={{color:C.gold,fontSize:9,marginTop:3,flexShrink:0,lineHeight:1}}>◆</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.8)",lineHeight:1.8}}>WholesaleUSPeptides supports distribution partners, research organizations, laboratories, and private-label brands. All orders are subject to internal review prior to fulfillment. Product availability, inventory, and compliance requirements are verified before processing.</div>
        </div>
        <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:18}}>
          <div style={{fontSize:9,color:"rgba(255,255,255,0.2)",lineHeight:1.9,marginBottom:9}}>
            All products are Research Use Only (RUO). Not approved by the U.S. FDA. Clinical trials for many compounds are ongoing. Not for human or veterinary use. Purchasers must be qualified wholesale professionals aged 18+ and are responsible for regulatory compliance in their jurisdiction.
          </div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",letterSpacing:0.3}}>© 2026 WholesaleUSPeptides.com</div>
        </div>
      </div>
    </footer>
  );
}

// ── PERSISTENT "REQUEST A QUOTE" CTA ─────────────────────────────────────────
function PersistentQuoteCTA({ onClick }) {
  return (
    <>
      <button onClick={onClick} className="quote-fab btn-polish" style={{position:"fixed",bottom:28,right:28,zIndex:700,padding:"15px 26px",background:C.gold,border:"none",color:C.navy,fontSize:11,fontWeight:800,letterSpacing:2,textTransform:"uppercase",cursor:"pointer",boxShadow:"0 10px 28px rgba(0,0,0,0.35)"}}>
        Request a Quote
      </button>
      <div className="quote-bar" style={{position:"fixed",bottom:0,left:0,right:0,zIndex:700,background:C.navy,borderTop:"1px solid "+C.gold,padding:"12px 16px"}}>
        <button onClick={onClick} style={{width:"100%",padding:"14px 0",background:C.gold,border:"none",color:C.navy,fontSize:12,fontWeight:800,letterSpacing:2,textTransform:"uppercase",cursor:"pointer"}}>
          Request a Quote
        </button>
      </div>
    </>
  );
}

function HomeSections({ setPage, onContactClick }) {
  const cats = [
    {label:"GLP Research Compounds",desc:"GLP-S, GLP-T, GLP-R, Tesamorelin"},
    {label:"Regenerative Compounds",desc:"BPC-157, TB-500, GHK-Cu, NAD+, MOTS-C, Thymosin Alpha-1"},
    {label:"Research Peptides",     desc:"Ipamorelin, CJC-1295, GHRP-2, GHRP-6, AOD-9604, IGF-1 LR3"},
    {label:"Research Compounds",    desc:"Bio Regulators, Epithalon, KPV, VIP, PT-141, DSIP, SS-31"},
    {label:"Capsules",               desc:"BPC-157, TB-500, NAD+, NMN, Methylene Blue, Berberine"},
    {label:"Custom Formulations",   desc:"Blends, Sprays, Topicals — custom ratios available on request"},
  ];
  const featured = [
    {n:"GLP-S", s:"5mg – 20mg", c:"GLP"},
    {n:"GLP-T", s:"10mg – 40mg",c:"GLP"},
    {n:"GLP-R", s:"10mg – 30mg",c:"GLP"},
    {n:"BPC-157",     s:"5mg – 20mg", c:"Peptides"},
    {n:"TB-500",      s:"5mg – 10mg", c:"Peptides"},
    {n:"GHK-Cu",      s:"50mg – 100mg",c:"Peptides"},
    {n:"NAD+",        s:"500mg – 1g", c:"Peptides"},
    {n:"MOTS-C",      s:"10mg – 20mg",c:"Peptides"},
  ];
  const mfg = [
    {t:"Quality Control",              b:"Every production lot subject to documented quality control procedures from synthesis through final packaging."},
    {t:"Third-Party Sterility Testing",b:"Independent sterility verification via LAL endotoxin assay on every production batch before release."},
    {t:"HPLC Purity Analysis",         b:"High-performance liquid chromatography purity testing confirms compound integrity at 99%+ per lot."},
    {t:"Heavy Metal Screening",        b:"ICP-MS heavy metal screening provides a complete safety profile for every production lot we release."},
    {t:"Batch Traceability",           b:"Every lot is assigned a unique batch number. Full chain-of-custody documentation available to verified partners."},
    {t:"COA Documentation",            b:"Batch-specific Certificates of Analysis delivered to white-label partners for publishing on their platforms."},
  ];
  const flow = ["Application Submitted","Internal Review","Account Approved","Wholesale Pricing Access","ACH Payment","Fulfillment"];

  return (
    <>
      {/* CATEGORIES */}
      <div className="home-section-pad" style={{background:C.off,padding:"76px 40px"}}>
        <div style={{maxWidth:1400,margin:"0 auto"}}>
          <div style={{marginBottom:36}}>
            <div style={{fontSize:9,letterSpacing:4,color:C.gold,textTransform:"uppercase",fontWeight:700,marginBottom:12}}>Product Categories</div>
            <h2 style={{fontSize:34,fontWeight:800,lineHeight:1.18,color:C.navy,fontFamily:"Georgia,serif",letterSpacing:-0.5}}>What We Supply</h2>
          </div>
          <div className="home-cats-grid" style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:1,background:C.mist}}>
            {cats.map(({label,desc},i)=>(
              <div key={i} onClick={()=>setPage("catalog")} style={{background:C.white,padding:"26px 22px",cursor:"pointer"}}>
                <div style={{width:22,height:2,background:C.gold,marginBottom:14}}/>
                <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:8,lineHeight:1.35}}>{label}</div>
                <div style={{fontSize:11,color:C.stone,lineHeight:1.7}}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURED PRODUCTS */}
      <div className="home-section-pad" style={{background:C.white,padding:"76px 40px"}}>
        <div style={{maxWidth:1400,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:32,flexWrap:"wrap",gap:12}}>
            <div>
              <div style={{fontSize:9,letterSpacing:4,color:C.gold,textTransform:"uppercase",fontWeight:700,marginBottom:12}}>Featured Compounds</div>
              <h2 style={{fontSize:34,fontWeight:800,lineHeight:1.18,color:C.navy,fontFamily:"Georgia,serif",letterSpacing:-0.5}}>Most-Requested Products</h2>
            </div>
            <button onClick={()=>setPage("catalog")} className="btn-polish" style={{background:"none",border:"1px solid "+C.navy,color:C.navy,padding:"9px 20px",fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",cursor:"pointer"}}>
              View Full Catalog
            </button>
          </div>
          <div className="home-featured-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,background:C.mist}}>
            {featured.map((item,i)=>(
              <div key={i} style={{background:C.white,display:"flex",flexDirection:"column"}}>
                <div style={{height:210,background:C.off,overflow:"hidden"}}>
                  <ProductVisual name={item.n} strength={item.s} cat={item.c}/>
                </div>
                <div style={{padding:"16px 18px 20px",flex:1,display:"flex",flexDirection:"column"}}>
                  <div style={{fontSize:8,letterSpacing:2.5,color:C.gold,textTransform:"uppercase",fontWeight:700,marginBottom:5}}>{item.c}</div>
                  <div style={{fontSize:14,fontWeight:700,color:C.navy,marginBottom:3,fontFamily:"Georgia,serif"}}>{item.n}</div>
                  <div style={{fontSize:11,color:C.stone,marginBottom:12}}>{item.s}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:14}}>
                    {["Minimum Order: 10 Units","White Label Available","COA Available"].map(f=>(
                      <div key={f} style={{display:"flex",gap:7,alignItems:"center"}}>
                        <div style={{width:4,height:4,borderRadius:"50%",background:C.green,flexShrink:0}}/>
                        <div style={{fontSize:10,color:C.stone}}>{f}</div>
                      </div>
                    ))}
                  </div>
                  <button onClick={()=>setPage("catalog")} className="btn-polish" style={{marginTop:"auto",padding:"9px 0",background:C.navy,border:"none",color:C.white,fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",cursor:"pointer"}}>
                    View In Catalog
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WHITE LABEL */}
      <div className="home-section-pad" style={{background:C.navy,padding:"76px 40px"}}>
        <div className="home-wl-outer" style={{maxWidth:1280,margin:"0 auto",display:"grid",gridTemplateColumns:"0.85fr 1.15fr",gap:56,alignItems:"center"}}>
          <div>
            <div style={{fontSize:9,letterSpacing:4,color:C.gold,textTransform:"uppercase",fontWeight:700,marginBottom:16}}>White Label Program</div>
            <h2 style={{fontSize:36,fontWeight:700,color:C.white,fontFamily:"Georgia,serif",lineHeight:1.2,letterSpacing:-0.5,marginBottom:16}}>
              Your Brand.<br/>Our Manufacturing.
            </h2>
            <p style={{fontSize:14,color:"rgba(255,255,255,0.5)",lineHeight:1.9,marginBottom:26,maxWidth:460}}>
              Launch your private label peptide line without a manufacturing facility. We handle production, testing, labeling, and fulfillment. You receive documented compounds under your brand, ready for your clients.
            </p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:1,background:"rgba(201,168,76,0.12)",marginBottom:28}}>
              {["Custom Branding","Custom Label Design","Batch-Specific COA","QR Code Verification","Packaging Support","Fulfillment Support"].map(f=>(
                <div key={f} style={{padding:"12px 16px",background:"rgba(5,17,31,0.5)",fontSize:11,color:"rgba(255,255,255,0.55)"}}>
                  <span style={{color:C.gold,marginRight:8}}>—</span>{f}
                </div>
              ))}
            </div>
            <button onClick={()=>setPage("wl")} style={{padding:"13px 28px",background:C.gold,border:"none",color:C.navy,fontSize:11,fontWeight:800,letterSpacing:2,textTransform:"uppercase",cursor:"pointer"}}>
              Start White Label Application
            </button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:22}}>
            {[
              {src:"/images/master/master-vial.png",        label:"Injectables",  scale:1.5},
              {src:"/images/master/master-capsule.png",      label:"Capsules",     scale:1.5},
              {src:"/images/master/master-spray.png",        label:"Nasal Sprays", scale:1.62},
              {src:"/images/master/master-cream-pump.png",   label:"Topicals",     scale:1.62},
            ].map((item,i)=>(
              <div key={i} className="wl-asset-card">
                <div className="wl-asset-imgwrap">
                  <img src={item.src} alt={item.label}
                    onError={e=>{e.target.style.visibility="hidden";}}
                    className="wl-asset-img"
                    style={{transform:`scale(${item.scale})`}}/>
                </div>
                <div className="wl-asset-label">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MANUFACTURING */}
      <div className="home-section-pad" style={{background:C.off,padding:"84px 40px"}}>
        <div style={{maxWidth:1400,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:44}}>
            <div style={{fontSize:9,letterSpacing:4,color:C.gold,textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Quality Assurance</div>
            <h2 style={{fontSize:36,fontWeight:800,lineHeight:1.18,color:C.navy,fontFamily:"Georgia,serif",letterSpacing:-0.5,marginBottom:12}}>Manufacturing Standards</h2>
            <p style={{fontSize:14,color:C.stone,lineHeight:1.85,maxWidth:540,margin:"0 auto"}}>
              Every batch produced through qualified domestic manufacturing partners with documented chain-of-custody procedures and lot traceability.
            </p>
          </div>
          <div className="home-mfg-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:1,background:C.mist}}>
            {mfg.map(({t,b},i)=>(
              <div key={i} style={{background:C.white,padding:"30px 26px"}}>
                <div style={{width:26,height:3,background:C.gold,marginBottom:16}}/>
                <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:10,lineHeight:1.35}}>{t}</div>
                <div style={{fontSize:12,color:C.stone,lineHeight:1.8}}>{b}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FLOW + CTA */}
      <div style={{background:C.navy2,padding:"76px 40px",borderTop:"1px solid rgba(201,168,76,0.12)"}}>
        <div style={{maxWidth:1100,margin:"0 auto",textAlign:"center"}}>
          <div style={{fontSize:9,letterSpacing:4,color:C.gold,textTransform:"uppercase",fontWeight:700,marginBottom:14}}>How It Works</div>
          <h2 style={{fontSize:32,fontWeight:800,lineHeight:1.18,color:C.white,fontFamily:"Georgia,serif",letterSpacing:-0.5,marginBottom:36}}>Account Approval Process</h2>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",flexWrap:"wrap",gap:0,marginBottom:40}}>
            {flow.map((step,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center"}}>
                <div style={{textAlign:"center",padding:"0 16px"}}>
                  <div style={{width:38,height:38,borderRadius:"50%",border:"1px solid "+C.gold,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 8px",fontSize:12,fontWeight:700,color:C.gold}}>{i+1}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.55)",maxWidth:96,lineHeight:1.5}}>{step}</div>
                </div>
                {i<flow.length-1 && <div style={{width:28,height:1,background:"rgba(201,168,76,0.2)",flexShrink:0}}/>}
              </div>
            ))}
          </div>
          <button onClick={()=>setPage("wl")} className="btn-polish" style={{padding:"13px 32px",background:C.gold,border:"none",color:C.navy,fontSize:11,fontWeight:800,letterSpacing:2,textTransform:"uppercase",cursor:"pointer"}}>
            Apply For Wholesale Account
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <Footer setPage={setPage} onContactClick={onContactClick}/>
    </>
  );
}


// ── WHITE LABEL PAGE ──────────────────────────────────────────────────────────
function WLPage({ setPage }) {
  // step: 1=Overview, 2=Company Info, 3=Product Interest, 4=Monthly Volume, 5=Review & Submit, 6=Confirmation
  const [step, setStep]           = useState(1);
  const [bsz, setBsz]             = useState(null);
  const [interests, setInterests] = useState([]);
  const [volume, setVolume]       = useState(null);
  const [fm, setFm]               = useState({co:"",cn:"",em:"",ph:"",web:"",br:"",sk:"",nt:""});
  const [logoFile, setLogoFile]       = useState(null);
  const [stickerFile, setStickerFile] = useState(null);
  const startedTrackedRef = useRef(false);
  const submittedTrackedRef = useRef(false);
  const startApplication = () => {
    if (!startedTrackedRef.current) { startedTrackedRef.current = true; trackEvent("white_label_application_started"); }
    setStep(2);
  };
  const submitApplication = () => {
    if (!submittedTrackedRef.current) { submittedTrackedRef.current = true; trackEvent("white_label_application_submitted"); }
    setStep(6);
  };
  const onboardingSteps = ["Company Info","Product Interest","Monthly Volume","Review & Submit"];
  const SZ = {
    "3ml": {d:"16mm x 45mm",la:"40mm x 25mm",ca:"44mm x 29mm",qr:"8mm x 8mm"},
    "10ml":{d:"24mm x 55mm",la:"68mm x 35mm",ca:"72mm x 39mm",qr:"12mm x 12mm"},
  };
  const inp = (k,l,ph) => (
    <div key={k} style={{marginBottom:11}}>
      <div style={{fontSize:9,letterSpacing:1.5,color:C.stone,textTransform:"uppercase",fontWeight:700,marginBottom:4}}>{l}</div>
      <input value={fm[k]||""} onChange={e=>setFm(f=>({...f,[k]:e.target.value}))} placeholder={ph}
        style={{width:"100%",padding:"9px 12px",border:"1px solid "+C.mist,background:C.white,fontSize:12,color:C.navy,outline:"none",boxSizing:"border-box"}}/>
    </div>
  );
  const toggleInterest = cat => setInterests(arr => arr.includes(cat) ? arr.filter(c=>c!==cat) : [...arr, cat]);
  const canCompanyInfo = fm.co && fm.cn && fm.em;
  return (
    <div style={{background:C.off,minHeight:"100vh"}}>
      <div style={{background:C.navy,padding:"40px 40px 32px",borderBottom:"1px solid rgba(201,168,76,0.15)"}}>
        <div style={{maxWidth:960,margin:"0 auto"}}>
          <div style={{fontSize:9,letterSpacing:4,color:C.gold,textTransform:"uppercase",fontWeight:700,marginBottom:10}}>White Label Program</div>
          <h1 style={{fontSize:30,fontWeight:700,color:C.white,fontFamily:"Georgia,serif",marginBottom:5}}>Private Label Application</h1>
          <p style={{fontSize:12,color:"rgba(255,255,255,0.4)",maxWidth:560}}>Launch your peptide brand. We handle manufacturing, labeling, and fulfillment. Every bottle ships with a QR code linked to the batch-specific Certificate of Analysis.</p>
        </div>
      </div>
      <div style={{maxWidth:960,margin:"0 auto",padding:"32px 40px 72px"}}>
        {step>=2 && step<=5 && (
          <div style={{display:"flex",marginBottom:28,borderBottom:"1px solid "+C.mist}} className="wl-stepper">
            {onboardingSteps.map((s,i)=>{
              const n=i+2; const active=step===n; const done=step>n;
              return (
                <div key={i} style={{flex:1,padding:"10px 4px",borderBottom:"2px solid "+(active?C.gold:done?"rgba(201,168,76,0.4)":"transparent"),textAlign:"center"}}>
                  <div style={{fontSize:8,letterSpacing:2,color:active?C.gold:done?C.navy:C.stone,textTransform:"uppercase",fontWeight:700,marginBottom:2}}>STEP 0{i+1}</div>
                  <div className="wl-stepper-label" style={{fontSize:10,color:active?C.navy:C.stone,fontWeight:active?700:400}}>{s}</div>
                </div>
              );
            })}
          </div>
        )}

        {step===1 && (
          <div>
            <div className="wl-grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:20}}>
              <div style={{background:C.navy,padding:"28px 24px"}}>
                <div style={{width:22,height:2,background:C.gold,marginBottom:14}}/>
                <div style={{fontSize:9,letterSpacing:3,color:C.gold,textTransform:"uppercase",marginBottom:9}}>Signature Feature</div>
                <h2 style={{fontSize:18,fontWeight:700,color:C.white,fontFamily:"Georgia,serif",lineHeight:1.35,marginBottom:11}}>Batch-Specific QR Code on Every Label</h2>
                <p style={{fontSize:11,color:"rgba(255,255,255,0.45)",lineHeight:1.85,marginBottom:12}}>Every label includes a unique QR code linked to the independent Certificate of Analysis for that production lot. Lot-specific, not a generic template. We send you the COA documents to publish on your platform.</p>
                {["QR code unique to each production batch","Independent third-party lab report","Purity, endotoxins, and heavy metals","COA documents emailed for your website"].map(f=>(
                  <div key={f} style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
                    <div style={{color:C.gold,fontSize:9,flexShrink:0}}>—</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.45)"}}>{f}</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:700,color:C.navy,letterSpacing:1,textTransform:"uppercase",marginBottom:11}}>Program Terms</div>
                {[["Minimum","10 units per SKU"],["Formats","3ml and 10ml vial"],["Turnaround","7-10 days after art approval"],["COA","Batch-specific PDF per lot, emailed"],["QR Code","Unique per batch, linked to COA"],["Deposit","50% ACH required to initiate"],["Pricing","8-tier retail and wholesale"],["Compliance","Labels reviewed before print approval"]].map(([k,v])=>(
                  <div key={k} style={{display:"flex",gap:10,padding:"6px 0",borderBottom:"1px solid "+C.mist}}>
                    <span style={{fontSize:11,fontWeight:700,color:C.navy,minWidth:108,flexShrink:0}}>{k}</span>
                    <span style={{fontSize:11,color:C.stone}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={startApplication} className="btn-polish" style={{padding:"12px 26px",background:C.navy,border:"none",color:C.white,fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",cursor:"pointer"}}>Start Application</button>
              <button onClick={()=>setPage("catalog")} className="btn-polish" style={{padding:"12px 20px",background:"transparent",border:"1px solid "+C.mist,color:C.stone,fontSize:11,cursor:"pointer"}}>View Pricing</button>
            </div>
          </div>
        )}

        {step===2 && (
          <div>
            <h2 style={{fontSize:19,fontWeight:700,fontFamily:"Georgia,serif",marginBottom:7}}>Company Information</h2>
            <p style={{fontSize:12,color:C.stone,marginBottom:18}}>Tell us about your company so we can tailor your white label proposal.</p>
            <div className="wl-grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
              {inp("co","Company Name","e.g. Apex Research LLC")}
              {inp("web","Website","yourcompany.com")}
              {inp("cn","Contact Name","Full name")}
              {inp("em","Email","you@company.com")}
              {inp("ph","Phone","Include country code")}
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setStep(1)} className="btn-polish" style={{padding:"10px 18px",background:"transparent",border:"1px solid "+C.mist,color:C.stone,fontSize:11,cursor:"pointer"}}>Back</button>
              <button onClick={()=>canCompanyInfo&&setStep(3)} className="btn-polish" style={{padding:"10px 24px",background:canCompanyInfo?C.navy:"#C8C0B4",border:"none",color:C.white,fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",cursor:canCompanyInfo?"pointer":"not-allowed"}}>Continue</button>
            </div>
          </div>
        )}

        {step===3 && (
          <div>
            <h2 style={{fontSize:19,fontWeight:700,fontFamily:"Georgia,serif",marginBottom:7}}>Product Interest</h2>
            <p style={{fontSize:12,color:C.stone,marginBottom:18}}>Select all product formats you're interested in white labeling.</p>
            <div className="wl-interest-grid" style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:22}}>
              {["Injectables","Capsules","Nasal Sprays","Topicals","Custom Products"].map(cat=>{
                const sel = interests.includes(cat);
                return (
                  <div key={cat} onClick={()=>toggleInterest(cat)} style={{border:"2px solid "+(sel?C.gold:C.mist),padding:"14px 16px",cursor:"pointer",background:sel?"rgba(201,168,76,0.04)":C.white,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontSize:12,fontWeight:700,color:C.navy}}>{cat}</span>
                    <span style={{width:16,height:16,borderRadius:3,border:"1.5px solid "+(sel?C.gold:C.mist),background:sel?C.gold:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}/>
                  </div>
                );
              })}
            </div>

            <div style={{fontSize:10,fontWeight:700,color:C.navy,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Bottle Format (if applicable)</div>
            <div className="wl-grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:18}}>
              {["3ml","10ml"].map(sz=>{
                const info=SZ[sz]; const sel=bsz===sz;
                return (
                  <div key={sz} onClick={()=>setBsz(sz===bsz?null:sz)} style={{border:"2px solid "+(sel?C.gold:C.mist),padding:"20px",cursor:"pointer",background:sel?"rgba(201,168,76,0.04)":C.white,position:"relative",transition:"all 0.15s"}}>
                    {sel && <div style={{position:"absolute",top:9,right:9,background:C.gold,color:C.navy,fontSize:8,fontWeight:700,padding:"2px 8px"}}>SELECTED</div>}
                    <div style={{fontSize:16,fontWeight:700,fontFamily:"Georgia,serif",color:C.navy,marginBottom:6}}>{sz} Vial</div>
                    <div style={{fontSize:11,color:C.stone,marginBottom:3}}>{info.d}</div>
                    <div style={{fontSize:11,fontWeight:700,color:C.navy,marginBottom:3}}>Label: {info.la}</div>
                    <div style={{fontSize:10,color:C.stone,marginBottom:9}}>Canvas: {info.ca} (2mm bleed)</div>
                    <div style={{padding:"9px 11px",background:"rgba(201,168,76,0.07)",border:"1px solid rgba(201,168,76,0.2)"}}>
                      <div style={{fontSize:9,color:C.gold,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>QR Code Zone</div>
                      <div style={{fontSize:10,color:C.stone}}>{info.qr} at bottom-right. Leave clear or specify placement.</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{marginBottom:11}}>
              <div style={{fontSize:9,letterSpacing:1.5,color:C.stone,textTransform:"uppercase",fontWeight:700,marginBottom:4}}>Compounds Required</div>
              <textarea value={fm.sk||""} onChange={e=>setFm(f=>({...f,sk:e.target.value}))} placeholder={"BPC-157 5mg - 50 units\nS 10mg - 50 units"}
                style={{width:"100%",padding:"9px 12px",border:"1px solid "+C.mist,background:C.white,fontSize:12,color:C.navy,outline:"none",height:80,resize:"vertical",boxSizing:"border-box",fontFamily:"'Inter',sans-serif"}}></textarea>
            </div>
            <div style={{marginBottom:18}}>
              {inp("br","White-Label Brand Name","Name for labels")}
            </div>
            <div style={{padding:"10px 14px",background:"#EDE9DF",border:"1px solid "+C.mist,marginBottom:18,fontSize:10,color:"#6B5E4A",lineHeight:1.7}}>
              Accepted: Adobe Illustrator (.ai), print-ready PDF (CMYK 300dpi+), high-resolution PNG. Labels must include compound name, lot number placeholder, and clear QR zone. No therapeutic or human-use claims permitted.
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setStep(2)} className="btn-polish" style={{padding:"10px 18px",background:"transparent",border:"1px solid "+C.mist,color:C.stone,fontSize:11,cursor:"pointer"}}>Back</button>
              <button onClick={()=>interests.length>0&&setStep(4)} className="btn-polish" style={{padding:"10px 24px",background:interests.length>0?C.navy:"#C8C0B4",border:"none",color:C.white,fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",cursor:interests.length>0?"pointer":"not-allowed"}}>Continue</button>
            </div>
          </div>
        )}

        {step===4 && (
          <div>
            <h2 style={{fontSize:19,fontWeight:700,fontFamily:"Georgia,serif",marginBottom:7}}>Monthly Volume</h2>
            <p style={{fontSize:12,color:C.stone,marginBottom:18}}>Select your estimated monthly volume across all SKUs.</p>
            <div className="wl-volume-grid" style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14,marginBottom:22}}>
              {["10-50 units","50-100 units","100-500 units","500+ units"].map(v=>{
                const sel = volume===v;
                return (
                  <div key={v} onClick={()=>setVolume(v)} style={{border:"2px solid "+(sel?C.gold:C.mist),padding:"20px",cursor:"pointer",background:sel?"rgba(201,168,76,0.04)":C.white,textAlign:"center",position:"relative"}}>
                    {sel && <div style={{position:"absolute",top:9,right:9,background:C.gold,color:C.navy,fontSize:8,fontWeight:700,padding:"2px 8px"}}>SELECTED</div>}
                    <div style={{fontSize:16,fontWeight:700,fontFamily:"Georgia,serif",color:C.navy}}>{v}</div>
                    <div style={{fontSize:10,color:C.stone,marginTop:4}}>per month, estimated</div>
                  </div>
                );
              })}
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setStep(3)} className="btn-polish" style={{padding:"10px 18px",background:"transparent",border:"1px solid "+C.mist,color:C.stone,fontSize:11,cursor:"pointer"}}>Back</button>
              <button onClick={()=>volume&&setStep(5)} className="btn-polish" style={{padding:"10px 24px",background:volume?C.navy:"#C8C0B4",border:"none",color:C.white,fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",cursor:volume?"pointer":"not-allowed"}}>Continue</button>
            </div>
          </div>
        )}

        {step===5 && (
          <div>
            <h2 style={{fontSize:19,fontWeight:700,fontFamily:"Georgia,serif",marginBottom:7}}>Review & Submit</h2>
            <p style={{fontSize:12,color:C.stone,marginBottom:18}}>Confirm your details below. Our team will contact you within 2 business days with specifications and a formal quote.</p>

            <div style={{background:C.white,border:"1px solid "+C.mist,padding:"18px 20px",marginBottom:22}}>
              <div style={{fontSize:10,letterSpacing:1.5,fontWeight:700,color:C.navy,textTransform:"uppercase",marginBottom:12}}>Application Summary</div>
              {[
                ["Company",fm.co||"—"],
                ["Website",fm.web||"—"],
                ["Contact",fm.cn||"—"],
                ["Email",fm.em||"—"],
                ["Phone",fm.ph||"—"],
                ["Product Interest",interests.length?interests.join(", "):"—"],
                ["Bottle Format",bsz?bsz+" Vial":"—"],
                ["Monthly Volume",volume||"—"],
                ["Brand Name",fm.br||"—"],
              ].map(([k,v])=>(
                <div key={k} style={{display:"flex",gap:10,padding:"6px 0",borderBottom:"1px solid "+C.mist}}>
                  <span style={{fontSize:11,fontWeight:700,color:C.navy,minWidth:130,flexShrink:0}}>{k}</span>
                  <span style={{fontSize:11,color:C.stone}}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{marginBottom:22}}>
              <div style={{fontSize:10,letterSpacing:1.5,fontWeight:700,color:C.navy,textTransform:"uppercase",marginBottom:12}}>Onboarding Timeline</div>
              <div className="wl-timeline" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
                {[["Week 1","Strategy"],["Week 2","Label Design"],["Week 3","Production"],["Week 4","Fulfillment"]].map(([w,t],i)=>(
                  <div key={w} style={{textAlign:"center",padding:"14px 10px",background:C.off,border:"1px solid "+C.mist}}>
                    <div style={{width:24,height:24,borderRadius:"50%",background:C.navy,color:C.gold,fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 8px"}}>{i+1}</div>
                    <div style={{fontSize:9,letterSpacing:1.5,color:C.gold,textTransform:"uppercase",fontWeight:700,marginBottom:3}}>{w}</div>
                    <div style={{fontSize:11,fontWeight:700,color:C.navy}}>{t}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="wl-trust-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:22}}>
              {["Manufactured in USA","Batch Verified","White Label Available","Third Party Tested"].map((b,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 10px",background:C.off,border:"1px solid "+C.mist}}>
                  <span style={{width:4,height:4,borderRadius:"50%",background:C.gold,flexShrink:0}}/>
                  <span style={{fontSize:9,fontWeight:700,letterSpacing:0.3,color:C.navy,textTransform:"uppercase"}}>{b}</span>
                </div>
              ))}
            </div>

            <div style={{marginBottom:18}}>
              <div style={{fontSize:9,letterSpacing:1.5,color:C.stone,textTransform:"uppercase",fontWeight:700,marginBottom:4}}>Additional Notes</div>
              <textarea value={fm.nt||""} onChange={e=>setFm(f=>({...f,nt:e.target.value}))} placeholder="QR placement, bottle size, shipping requirements..."
                style={{width:"100%",padding:"9px 12px",border:"1px solid "+C.mist,background:C.white,fontSize:12,color:C.navy,outline:"none",height:60,resize:"vertical",boxSizing:"border-box",fontFamily:"'Inter',sans-serif"}}></textarea>
            </div>
            <div className="wl-grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
              {[
                {label:"Logo File",desc:"Upload your brand logo for label printing",file:logoFile,set:setLogoFile,id:"logo-upload"},
                {label:"Sticker File",desc:"Upload your sticker artwork for white labeling",file:stickerFile,set:setStickerFile,id:"sticker-upload"},
              ].map(({label,desc,file,set,id})=>(
                <div key={id}>
                  <div style={{fontSize:9,letterSpacing:1.5,color:C.stone,textTransform:"uppercase",fontWeight:700,marginBottom:4}}>{label}</div>
                  <label htmlFor={id} style={{display:"block",border:"1px dashed "+(file?C.gold:C.mist),background:file?"rgba(201,168,76,0.04)":C.white,padding:"14px 14px",cursor:"pointer",textAlign:"center"}}>
                    <input id={id} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:"none"}} onChange={e=>set(e.target.files[0]||null)}/>
                    {file ? (
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:C.navy,marginBottom:3,wordBreak:"break-all"}}>{file.name}</div>
                        <div style={{fontSize:9,color:C.stone}}>{(file.size/1024).toFixed(1)} KB — click to replace</div>
                      </div>
                    ) : (
                      <div>
                        <div style={{fontSize:11,color:C.stone,marginBottom:3}}>Click to upload</div>
                        <div style={{fontSize:9,color:"#9B8F7F"}}>PDF, JPEG, or PNG</div>
                      </div>
                    )}
                  </label>
                  <div style={{fontSize:9,color:C.stone,marginTop:4,lineHeight:1.5}}>{desc}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setStep(4)} className="btn-polish" style={{padding:"10px 18px",background:"transparent",border:"1px solid "+C.mist,color:C.stone,fontSize:11,cursor:"pointer"}}>Back</button>
              <button onClick={submitApplication} className="btn-polish" style={{padding:"10px 26px",background:C.gold,border:"none",color:C.navy,fontSize:11,fontWeight:800,letterSpacing:2,textTransform:"uppercase",cursor:"pointer"}}>Submit Application</button>
            </div>
          </div>
        )}

        {step===6 && (
          <div style={{textAlign:"center",maxWidth:480,margin:"0 auto",padding:"28px 0"}}>
            <div style={{width:50,height:50,borderRadius:"50%",background:"rgba(46,107,74,0.1)",border:"2px solid "+C.green,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:C.green,margin:"0 auto 16px"}}>OK</div>
            <div style={{width:30,height:2,background:C.gold,margin:"0 auto 14px"}}/>
            <h2 style={{fontSize:21,fontWeight:700,fontFamily:"Georgia,serif",color:C.navy,marginBottom:10}}>Application Received</h2>
            <p style={{fontSize:12,color:C.stone,lineHeight:1.85,marginBottom:18}}>Our wholesale team will contact you at <strong>{fm.em||"the email you provided"}</strong> within 2 business days to confirm specifications and issue a formal quote.</p>
            <div style={{background:C.white,border:"1px solid "+C.mist,padding:"14px 18px",marginBottom:18,textAlign:"left"}}>
              {["Artwork reviewed for spec and compliance","QR placement confirmed","Formal quote and deposit invoice issued","Production begins upon 50% ACH deposit","Labeled compounds ship 7-10 days after deposit clears","Batch-specific COA documents emailed"].map((s,i)=>(
                <div key={i} style={{display:"flex",gap:10,padding:"5px 0",borderBottom:"1px solid "+C.mist,fontSize:11,color:C.stone}}>
                  <div style={{color:C.gold,fontWeight:700,minWidth:20,fontFamily:"'Courier New',monospace"}}>0{i+1}</div>
                  <div>{s}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:11,color:C.stone,marginBottom:16}}>Questions: uniquesalesinc@gmail.com — 602-321-8381</div>
            <div style={{display:"flex",gap:8,alignItems:"flex-start",maxWidth:700,margin:"0 auto 18px",textAlign:"left"}}>
              <div style={{color:C.gold,fontSize:9,marginTop:2,flexShrink:0,lineHeight:1}}>◆</div>
              <div style={{fontSize:10,color:C.stone,lineHeight:1.75,opacity:0.8}}>Applications are subject to internal review prior to approval. Account status, inventory availability, and compliance requirements are confirmed before production begins.</div>
            </div>
            <button onClick={()=>setPage("catalog")} className="btn-polish" style={{padding:"11px 24px",background:C.navy,border:"none",color:C.white,fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",cursor:"pointer"}}>View Catalog</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── STANDARDS PAGE ────────────────────────────────────────────────────────────
function AboutPage() {
  return (
    <div style={{background:C.off,minHeight:"100vh"}}>
      <div style={{background:C.navy,padding:"40px 40px 32px",borderBottom:"1px solid rgba(201,168,76,0.15)"}}>
        <div style={{maxWidth:880,margin:"0 auto"}}>
          <div style={{fontSize:9,letterSpacing:4,color:C.gold,textTransform:"uppercase",fontWeight:700,marginBottom:10}}>Quality & Testing</div>
          <h1 style={{fontSize:32,fontWeight:800,lineHeight:1.2,color:C.white,fontFamily:"Georgia,serif"}}>Manufacturing Standards & Legal Position</h1>
        </div>
      </div>
      <div style={{maxWidth:880,margin:"0 auto",padding:"44px 40px 72px"}}>
        {[
          {t:"American Manufacturing & Compliant Facilities",    b:"Every compound produced through licensed U.S. manufacturing partners and processed in compliant domestic facilities. We do not source, repackage, or relabel foreign bulk API. Every lot carries documented domestic chain of custody."},
          {t:"Three-Panel Independent Testing — Every Lot",      b:"HPLC peptide purity (99%+), endotoxin via LAL assay, and heavy metal screen via ICP-MS. Performed by a U.S. third-party laboratory on every production lot — not averaged, not based on manufacturer-supplied COAs."},
          {t:"Batch-Specific COA for White-Label Partners",      b:"White-label partners receive the full third-party COA document for every lot we fulfill under their brand — delivered as PDF for posting on partner websites. Full traceability from the QR code on the bottle to the independent lab report."},
          {t:"Research Use Only (RUO) — Legal Position",        b:"All products are Research Use Only. Not approved by the U.S. FDA for any clinical, diagnostic, or therapeutic use. Clinical trials for many compounds are ongoing. Not drugs, supplements, or medical devices. Partners and purchasers are responsible for compliance with all applicable federal, state, and local laws."},
          {t:"Payment Policy",                                   b:"WholesaleUSPeptides accepts ACH bank transfer, debit cards, and Zelle (debit card and Zelle payments accepted up to $2,500). All orders are held pending until payment clears. 50% deposit required on all new accounts to initiate production. Net terms are not offered."},
        ].map(({t,b})=>(
          <div key={t} style={{marginBottom:24,paddingBottom:24,borderBottom:"1px solid "+C.mist}}>
            <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
              <div style={{width:3,minWidth:3,height:16,background:C.gold,marginTop:3,flexShrink:0}}/>
              <div>
                <h2 style={{fontSize:14,fontWeight:700,color:C.navy,fontFamily:"Georgia,serif",marginBottom:8}}>{t}</h2>
                <p style={{fontSize:12,color:C.stone,lineHeight:1.9}}>{b}</p>
              </div>
            </div>
          </div>
        ))}
        <div style={{background:"#EDE9DF",border:"1px solid "+C.mist,padding:"14px 18px",fontSize:11,color:"#6B5E4A",lineHeight:1.9}}>
          All products are intended solely for legitimate laboratory research by qualified professionals aged 18 and over. Not for human or veterinary use. Not FDA approved. Purchasers affirm they will handle and distribute compounds in full compliance with applicable law.
        </div>
      </div>
    </div>
  );
}

// ── BATCH VERIFICATION PAGE ───────────────────────────────────────────────────
function COAPage() {
  const [srch, setSrch] = useState("");
  const lastTrackedSearch = useRef("");
  const rows = P.slice(0,24).filter(p=>{
    const lot = "LOT-2026-"+String(p.id).padStart(3,"0");
    const term = srch.trim().toLowerCase();
    return !term || p.n.toLowerCase().includes(term) || lot.toLowerCase().includes(term);
  });
  useEffect(() => {
    const term = srch.trim();
    if (!term) return;
    const timer = setTimeout(() => {
      if (term.toLowerCase() !== lastTrackedSearch.current) {
        lastTrackedSearch.current = term.toLowerCase();
        trackEvent("batch_verification_search", { search_term: term, results_count: rows.length });
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [srch]);
  return (
    <div style={{background:C.off,minHeight:"100vh"}}>
      <div style={{background:C.navy,padding:"40px 40px 32px",borderBottom:"1px solid rgba(201,168,76,0.15)"}}>
        <div style={{maxWidth:1060,margin:"0 auto"}}>
          <div style={{fontSize:9,letterSpacing:4,color:C.gold,textTransform:"uppercase",fontWeight:700,marginBottom:10}}>Documentation</div>
          <h1 style={{fontSize:32,fontWeight:800,lineHeight:1.2,color:C.white,fontFamily:"Georgia,serif",marginBottom:8}}>Batch Verification Center</h1>
          <p style={{fontSize:12,color:"rgba(255,255,255,0.4)",lineHeight:1.7,maxWidth:520}}>Every production lot independently tested. Each COA covers HPLC purity, endotoxin level (LAL), and heavy metal screen (ICP-MS). White-label partners receive batch-specific COA PDFs for their platforms.</p>
        </div>
      </div>
      <div style={{maxWidth:1060,margin:"0 auto",padding:"28px 40px 72px"}}>
        <div style={{marginBottom:32}}>
          <div style={{fontSize:9,letterSpacing:3,color:C.gold,textTransform:"uppercase",fontWeight:700,marginBottom:6}}>The Process</div>
          <h2 style={{fontSize:20,fontWeight:800,color:C.navy,fontFamily:"Georgia,serif",marginBottom:18}}>How Batch Verification Works</h2>
          <div className="coa-howitworks-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
            {[
              {n:"01",t:"Enter Batch Number",b:"Locate the lot number printed on your bottle label or QR code."},
              {n:"02",t:"Retrieve Laboratory Results",b:"Pull the independent HPLC, LAL, and ICP-MS results for that specific production lot."},
              {n:"03",t:"Verify Product Authenticity",b:"Confirm the compound, strength, and lot match the original manufacturing record."},
              {n:"04",t:"Download Certificate of Analysis (COA)",b:"Save or share the batch-specific COA PDF for your records or platform."},
            ].map(c=>(
              <div key={c.n} className="coa-howitworks-card" style={{border:"1px solid "+C.mist,background:C.white,padding:"18px 16px"}}>
                <div style={{fontSize:18,fontWeight:800,color:"rgba(201,168,76,0.4)",fontFamily:"Georgia,serif",marginBottom:10}}>{c.n}</div>
                <div style={{fontSize:12,fontWeight:700,color:C.navy,marginBottom:6,lineHeight:1.4}}>{c.t}</div>
                <div style={{fontSize:10.5,color:C.stone,lineHeight:1.6}}>{c.b}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="coa-trust-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:18}}>
          {["Manufactured in USA","Third Party Tested","Batch Verified","White Label Available"].map((b,i)=>(
            <div key={i} className="coa-trust-badge" style={{display:"flex",alignItems:"center",gap:6,padding:"8px 10px",background:C.white,border:"1px solid "+C.mist}}>
              <span style={{width:4,height:4,borderRadius:"50%",background:C.gold,flexShrink:0}}/>
              <span style={{fontSize:9.5,fontWeight:700,letterSpacing:0.3,color:C.navy,textTransform:"uppercase"}}>{b}</span>
            </div>
          ))}
        </div>
        <div style={{background:"rgba(201,168,76,0.08)",border:"1px solid rgba(201,168,76,0.25)",padding:"12px 16px",marginBottom:20,fontSize:11,color:C.navy,lineHeight:1.7}}>
          Every production batch is independently tested and archived for verification purposes.
        </div>
        <div style={{background:"#EDE9DF",border:"1px solid "+C.mist,padding:"9px 14px",marginBottom:20,fontSize:10,color:"#6B5E4A",lineHeight:1.7}}>
          <strong style={{color:C.red}}>RUO Documentation:</strong> COAs support legitimate laboratory research only. They do not constitute FDA approval for any use.
        </div>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:9,letterSpacing:1.5,color:C.stone,textTransform:"uppercase",fontWeight:700,marginBottom:6}}>Lookup by Compound or Lot Number</div>
          <input value={srch} onChange={e=>setSrch(e.target.value)} placeholder="e.g. BPC-157 or LOT-2026-004"
            style={{width:"100%",padding:"10px 14px",border:"1px solid "+C.mist,background:C.white,fontSize:12,color:C.navy,outline:"none",boxSizing:"border-box"}}/>
        </div>
        <div style={{border:"1px solid "+C.mist,background:C.white}}>
          <div style={{padding:"10px 18px",background:C.navy2,display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr",gap:10}}>
            {["Compound","Lot Number","HPLC Purity","Endotoxins","Heavy Metals","COA"].map(h=>(
              <div key={h} style={{fontSize:8,letterSpacing:2,color:C.gold,textTransform:"uppercase",fontWeight:700}}>{h}</div>
            ))}
          </div>
          {rows.length===0 && (
            <div style={{padding:"24px 18px",fontSize:11,color:C.stone,textAlign:"center"}}>No matching compound or lot number found.</div>
          )}
          {rows.map((p,i)=>(
            <div key={p.id} style={{padding:"10px 18px",borderBottom:"1px solid "+C.mist,background:i%2===1?C.off:C.white,display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr",gap:10,alignItems:"center"}}>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:C.navy}}>{p.n}</div>
                <div style={{fontSize:9,color:C.stone}}>{p.s} — {p.c}</div>
              </div>
              <div style={{fontSize:10,color:C.stone,fontFamily:"'Courier New',monospace"}}>LOT-2026-{String(p.id).padStart(3,"0")}</div>
              <div style={{fontSize:10,fontWeight:700,color:C.green}}>99.2%+</div>
              <div style={{fontSize:10,fontWeight:700,color:C.green}}>Pass</div>
              <div style={{fontSize:10,fontWeight:700,color:C.green}}>Pass</div>
              <button className="btn-polish" style={{fontSize:9,color:C.gold,background:"none",border:"1px solid rgba(201,168,76,0.35)",padding:"4px 10px",cursor:"pointer",fontWeight:700}}>Download</button>
            </div>
          ))}
        </div>
        <div style={{marginTop:18,textAlign:"center",fontSize:11,color:C.stone}}>
          Full COA package for all lots available to verified wholesale partners.<br/>
          Contact uniquesalesinc@gmail.com — 602-321-8381
        </div>
      </div>
    </div>
  );
}

// ── LEGAL PAGES ───────────────────────────────────────────────────────────────
function LegalPage({ eyebrow, title, updated, intro, sections, note }) {
  return (
    <div style={{background:C.off,minHeight:"100vh"}}>
      <div style={{background:C.navy,padding:"40px 40px 32px",borderBottom:"1px solid rgba(201,168,76,0.15)"}}>
        <div style={{maxWidth:780,margin:"0 auto"}}>
          <div style={{fontSize:9,letterSpacing:4,color:C.gold,textTransform:"uppercase",fontWeight:700,marginBottom:10}}>{eyebrow}</div>
          <h1 style={{fontSize:32,fontWeight:800,lineHeight:1.2,color:C.white,fontFamily:"Georgia,serif",marginBottom:8}}>{title}</h1>
          <p style={{fontSize:11,color:"rgba(255,255,255,0.4)",letterSpacing:0.5}}>Last Updated: {updated}</p>
        </div>
      </div>
      <div style={{maxWidth:780,margin:"0 auto",padding:"44px 40px 72px"}}>
        {intro && <p style={{fontSize:12,color:C.stone,lineHeight:1.9,marginBottom:30}}>{intro}</p>}
        {sections.map(({t,b})=>(
          <div key={t} style={{marginBottom:24,paddingBottom:24,borderBottom:"1px solid "+C.mist}}>
            <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
              <div style={{width:3,minWidth:3,height:16,background:C.gold,marginTop:3,flexShrink:0}}/>
              <div>
                <h2 style={{fontSize:14,fontWeight:700,color:C.navy,fontFamily:"Georgia,serif",marginBottom:8}}>{t}</h2>
                <p style={{fontSize:12,color:C.stone,lineHeight:1.9,whiteSpace:"pre-line"}}>{b}</p>
              </div>
            </div>
          </div>
        ))}
        {note && (
          <div style={{background:"#EDE9DF",border:"1px solid "+C.mist,padding:"14px 18px",fontSize:11,color:"#6B5E4A",lineHeight:1.9}}>
            {note}
          </div>
        )}
      </div>
    </div>
  );
}

const LEGAL_UPDATED = "January 1, 2026";

function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      updated={LEGAL_UPDATED}
      intro="WholesaleUSPeptides.com is a B2B wholesale manufacturing platform serving qualified business purchasers — distributors, researchers, and private-label brands. This policy explains what information we collect through the platform and how it is used."
      sections={[
        {t:"Information We Collect", b:"We collect information you submit directly: full name, company name, business email, phone number, business type, products of interest, and estimated order or production volume. We also collect standard technical data automatically, such as IP address, browser/device type, and pages viewed."},
        {t:"Lead Forms", b:"Information submitted through Partner Access, Request a Quote, Contact, and White Label Application forms is used solely to verify wholesale eligibility, respond to inquiries, prepare manufacturing quotes, and process applications. We do not sell submitted business information to third parties."},
        {t:"Analytics", b:"We use Google Analytics (GA4) to understand aggregate platform usage — such as page views and conversion events like quote requests, catalog downloads, and application submissions — so we can improve the wholesale experience. Analytics data does not include information beyond what is voluntarily submitted through forms."},
        {t:"Cookies", b:"The platform uses cookies and local storage to support analytics and to remember partner-access status on returning visits. See our Cookie Policy for full detail on the categories of cookies used."},
        {t:"Contact Information", b:"Questions about this Privacy Policy or requests regarding your business information can be directed to support@wholesaleuspeptides.com."},
      ]}
      note="This Privacy Policy applies to qualified business purchasers interacting with the WholesaleUSPeptides.com wholesale manufacturing platform and does not extend rights to individual consumers, as the platform is not intended for direct-to-consumer use."
    />
  );
}

function TermsOfServicePage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      updated={LEGAL_UPDATED}
      intro="These Terms of Service govern access to and use of the WholesaleUSPeptides.com wholesale manufacturing platform. By accessing the platform, you agree to the terms below."
      sections={[
        {t:"Qualified Business Purchasers Only", b:"This platform is restricted to licensed wholesale buyers, distributors, research organizations, and private-label brands aged 18 and over. It is not intended for individual consumers. A minimum order of 10 units per SKU is enforced on all orders."},
        {t:"No Guarantee of Product Availability", b:"Product inventory, SKUs, and formulations are subject to change without notice. Submitting a quote request, partner access form, or white-label application does not guarantee product availability or order fulfillment. All orders are subject to internal review prior to acceptance."},
        {t:"Pricing Subject to Change", b:"All pricing tiers displayed on this platform are subject to change without notice. Quoted pricing is valid for a limited period and is subject to confirmation at the time an order is placed."},
        {t:"Manufacturing Timelines May Vary", b:"Quote turnaround and manufacturing lead times referenced on this platform are estimates only. Actual production and fulfillment timelines may vary based on order volume, custom formulation requirements, white-label specifications, and supply conditions."},
        {t:"Payment Terms", b:"WholesaleUSPeptides.com accepts ACH bank transfer, debit card, and Zelle (debit card and Zelle accepted up to $2,500). Credit cards are not accepted and net terms are not offered. A 50% deposit is required to initiate production, with the balance due on completion of manufacturing prior to shipping. Orders are held until payment clears."},
        {t:"Governing Law & Jurisdiction", b:"These Terms are governed by the laws of the United States and the state in which WholesaleUSPeptides.com's manufacturing operations are domiciled, without regard to conflict-of-law principles. Any dispute arising from use of this platform is subject to the exclusive jurisdiction of the courts located in that state."},
        {t:"Limitation of Liability", b:"WholesaleUSPeptides.com is not liable for indirect, incidental, or consequential damages arising from use of this platform, including delays in manufacturing, changes in pricing, or unavailability of product."},
      ]}
    />
  );
}

function DisclaimerPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Disclaimer"
      updated={LEGAL_UPDATED}
      intro="The following disclaimer applies to all products, pricing, and information presented on the WholesaleUSPeptides.com wholesale manufacturing platform."
      sections={[
        {t:"Research Applications Only", b:"All products offered through this platform are Research Use Only (RUO). They are not approved by the U.S. FDA for any clinical, diagnostic, or therapeutic use, and are not drugs, supplements, or medical devices. Clinical trials for many compounds are still ongoing."},
        {t:"Not for Direct Consumer Sale", b:"WholesaleUSPeptides.com is a wholesale platform serving qualified business purchasers — distributors, research organizations, and private-label brands. Products are not offered for sale to individual end consumers."},
        {t:"Compliance Is the Purchaser's Responsibility", b:"Purchasers and partners are solely responsible for ensuring that their use, resale, and distribution of products comply with all applicable federal, state, local, and international laws in their jurisdiction."},
        {t:"Educational Information Only", b:"Manufacturing standards, certificates of analysis, product descriptions, and other content on this platform are provided for general informational and educational purposes only. Nothing on this platform constitutes medical, legal, or regulatory advice."},
      ]}
      note="By using this platform, you acknowledge that all compounds are intended solely for legitimate research by qualified professionals aged 18 and over, and not for human or veterinary use."
    />
  );
}

function CookiePolicyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Cookie Policy"
      updated={LEGAL_UPDATED}
      intro="This Cookie Policy explains the categories of cookies and similar technologies used across the WholesaleUSPeptides.com wholesale manufacturing platform."
      sections={[
        {t:"Analytics Cookies", b:"We use Google Analytics (GA4) cookies and identifiers to measure aggregate platform usage, including page views and conversion events such as quote requests, catalog downloads, and application submissions. This data helps us improve the wholesale experience."},
        {t:"Functional Cookies", b:"Functional cookies support core platform features, including the business-purchaser qualification gate and form session state, so the platform behaves correctly as you navigate between pages."},
        {t:"User Preferences", b:"Local storage is used to remember partner-access status on returning visits, so verified partners are not required to resubmit access forms each session."},
        {t:"Managing Cookies", b:"You can control or clear cookies through your browser settings at any time. Disabling cookies may limit certain platform features, such as retaining partner access between visits."},
      ]}
    />
  );
}

// ── AGE GATE ──────────────────────────────────────────────────────────────────
function Gate({ ok }) {
  const [no, setNo] = useState(false);
  return (
    <div style={{position:"fixed",inset:0,zIndex:9999,background:"#030D18",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{maxWidth:500,width:"100%",border:"1px solid rgba(201,168,76,0.3)",padding:"48px 44px",background:"#071424",textAlign:"center",fontFamily:"'Inter',sans-serif"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:28}}>
          <div style={{width:40,height:1,background:"rgba(201,168,76,0.35)"}}/>
          <div style={{fontSize:9,letterSpacing:4,color:C.gold,textTransform:"uppercase",fontWeight:700}}>Wholesale Access Required</div>
          <div style={{width:40,height:1,background:"rgba(201,168,76,0.35)"}}/>
        </div>
        <div style={{fontSize:22,fontWeight:800,color:C.white,marginBottom:4,fontFamily:"Georgia,serif",letterSpacing:-0.3}}>WholesaleUSPeptides.com</div>
        <div style={{fontSize:10,color:C.gold,letterSpacing:3,textTransform:"uppercase",marginBottom:26,opacity:0.75}}>Wholesale Manufacturing Platform</div>
        {!no ? (
          <>
            <p style={{fontSize:12,color:"rgba(255,255,255,0.5)",lineHeight:1.9,marginBottom:10}}>
              This platform is restricted to <strong style={{color:"rgba(255,255,255,0.8)"}}>licensed wholesale buyers, distributors, and white-label partners</strong> aged 18 and over.
            </p>
            <p style={{fontSize:12,color:"rgba(255,255,255,0.45)",lineHeight:1.85,marginBottom:26}}>
              All compounds are <strong style={{color:"rgba(255,255,255,0.75)"}}>Research Use Only (RUO)</strong>. Not approved by the FDA. Clinical trials for many of these compounds are still ongoing. Not for human or veterinary use.
            </p>
            <button onClick={ok} className="btn-polish" style={{display:"block",width:"100%",padding:"14px 0",marginBottom:10,background:C.gold,border:"none",color:"#05111F",fontSize:11,fontWeight:800,letterSpacing:2.5,textTransform:"uppercase",cursor:"pointer"}}>
              I Confirm — Enter Platform
            </button>
            <button onClick={()=>setNo(true)} className="btn-polish" style={{display:"block",width:"100%",padding:"11px 0",background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.3)",fontSize:11,cursor:"pointer"}}>
              I Do Not Qualify — Exit
            </button>
            <div style={{marginTop:22,fontSize:9,color:"rgba(255,255,255,0.18)",lineHeight:1.8}}>
              By entering you confirm compliance with all applicable federal, state, and local regulations.
            </div>
          </>
        ) : (
          <div>
            <p style={{fontSize:12,color:"rgba(255,100,100,0.7)",marginBottom:14}}>Access is restricted to qualified wholesale professionals aged 18+.</p>
            <a href="https://www.google.com" style={{fontSize:11,color:"rgba(255,255,255,0.25)"}}>Return to a safe page</a>
          </div>
        )}
      </div>
    </div>
  );
}

// ── CART DRAWER ───────────────────────────────────────────────────────────────
function CartDrawer({ cart, setCart, open, setOpen, setPage }) {
  const total = cart.reduce((s,i) => s + (i.variant[i.tier]||0)*i.qty, 0);
  const units = cart.reduce((s,i) => s + i.qty, 0);
  const [requested, setRequested] = useState(false);
  useEffect(() => { setRequested(false); }, [cart]);
  const requestQuote = () => {
    if (requested) return;
    setRequested(true);
    trackEvent("quote_requested", { units, value: total });
  };
  const upd = (pid, vid, qty) => {
    if (qty < 1) setCart(p => p.filter(i => !(i.p.id===pid && i.variant.id===vid)));
    else setCart(p => p.map(i => (i.p.id===pid && i.variant.id===vid) ? {...i,qty} : i));
  };
  return (
    <>
      {open && <div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,background:"rgba(3,13,24,0.72)",zIndex:800}}/>}
      <div style={{position:"fixed",top:0,right:0,width:390,height:"100vh",background:C.white,zIndex:900,transform:open?"translateX(0)":"translateX(100%)",transition:"transform 0.3s ease",display:"flex",flexDirection:"column",fontFamily:"'Inter',sans-serif",boxShadow:"-4px 0 32px rgba(0,0,0,0.22)"}}>
        <div style={{padding:"15px 22px",borderBottom:"1px solid "+C.mist,display:"flex",justifyContent:"space-between",alignItems:"center",background:C.navy}}>
          <div>
            <div style={{fontSize:9,letterSpacing:3,color:C.gold,textTransform:"uppercase",marginBottom:2}}>Wholesale Order</div>
            <div style={{fontSize:15,color:C.white,fontFamily:"Georgia,serif"}}>Quote — {units} units</div>
          </div>
          <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",fontSize:22,color:"rgba(255,255,255,0.35)",cursor:"pointer",lineHeight:1}}>x</button>
        </div>
        <div style={{padding:"10px 22px 0"}}>
          <div style={{padding:"8px 12px",background:"#EDE9DF",border:"1px solid "+C.mist,fontSize:10,color:"#6B5E4A",lineHeight:1.6}}>
            <strong style={{color:C.red}}>RUO:</strong> Research purposes only. Not FDA approved. ACH, debit card, or Zelle (up to $2,500) payment accepted. Orders held until payment clears.
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"12px 22px"}}>
          {cart.length===0 ? (
            <div style={{padding:"20px 0 8px"}}>
              <div style={{textAlign:"center",marginBottom:22}}>
                <div style={{fontSize:20,fontWeight:800,fontFamily:"Georgia,serif",color:C.navy,marginBottom:8,lineHeight:1.2}}>Request Wholesale Pricing</div>
                <div style={{fontSize:12,color:C.stone,lineHeight:1.6,maxWidth:300,margin:"0 auto"}}>Receive pricing tiers, MOQ requirements, white label options, and manufacturing timelines.</div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:18}}>
                {["Batch Verified","Manufactured in USA","White Label Available","Third-Party Tested"].map((b,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 10px",background:C.off,border:"1px solid "+C.mist}}>
                    <span style={{width:4,height:4,borderRadius:"50%",background:C.gold,flexShrink:0}}/>
                    <span style={{fontSize:9.5,fontWeight:700,letterSpacing:0.3,color:C.navy,textTransform:"uppercase"}}>{b}</span>
                  </div>
                ))}
              </div>

              <div style={{textAlign:"center",fontSize:11,color:C.gold,fontWeight:600,marginBottom:20}}>
                We typically respond within 1 business day.
              </div>

              <div style={{background:C.off,border:"1px solid "+C.mist,padding:"14px 16px",marginBottom:20}}>
                <div style={{fontSize:10,letterSpacing:1.5,fontWeight:700,color:C.navy,textTransform:"uppercase",marginBottom:10}}>After submission you'll receive:</div>
                {["Wholesale pricing tiers","Product availability","White label options","Production timelines","Minimum order requirements"].map((t,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:i<4?7:0}}>
                    <span style={{color:C.gold,fontSize:11,marginTop:1}}>•</span>
                    <span style={{fontSize:11.5,color:C.ink,lineHeight:1.5}}>{t}</span>
                  </div>
                ))}
              </div>

              <div style={{textAlign:"center"}}>
                <div style={{fontSize:11,color:C.mist,marginBottom:10}}>Add compounds from the catalog to begin.</div>
                {setPage && (
                  <button onClick={()=>{ setOpen(false); setPage("catalog"); }} className="btn-polish" style={{background:C.navy,color:C.gold,border:"none",padding:"11px 22px",fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",cursor:"pointer"}}>Browse Catalog</button>
                )}
              </div>
            </div>
          ) : cart.map(({p,variant,qty,tier})=>(
            <div key={p.id+"-"+variant.id} style={{display:"flex",gap:12,paddingBottom:14,marginBottom:14,borderBottom:"1px solid "+C.mist}}>
              <div style={{width:54,height:54,background:"#F8F7F3",flexShrink:0,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <img src={masterAssetFor(p.c)} alt={p.n}
                  onError={e=>{e.target.style.display="none";}}
                  style={{width:"100%",height:"100%",objectFit:"contain",padding:"4px",boxSizing:"border-box"}}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:700,color:C.navy}}>{p.n}</div>
                <div style={{fontSize:10,color:C.stone,marginBottom:6}}>{variant.s} — {hasPrice(variant[tier])?fmt(variant[tier])+"/unit":NO_PRICE_LABEL}</div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <button onClick={()=>upd(p.id,variant.id,qty-1)} style={{width:22,height:22,background:C.off,border:"1px solid "+C.mist,cursor:"pointer",color:C.navy,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>-</button>
                    <span style={{fontSize:12,color:C.navy,minWidth:22,textAlign:"center"}}>{qty}</span>
                    <button onClick={()=>upd(p.id,variant.id,qty+1)} style={{width:22,height:22,background:C.off,border:"1px solid "+C.mist,cursor:"pointer",color:C.navy,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                  </div>
                  <div style={{fontSize:12,fontWeight:700,color:C.navy}}>{hasPrice(variant[tier])?fmt(variant[tier]*qty):NO_PRICE_LABEL}</div>
                </div>
              </div>
              <button onClick={()=>setCart(prev=>prev.filter(i=>!(i.p.id===p.id && i.variant.id===variant.id)))} style={{background:"none",border:"none",color:C.mist,cursor:"pointer",fontSize:18,alignSelf:"flex-start",lineHeight:1}}>x</button>
            </div>
          ))}
        </div>
        {cart.length>0 && (
          <div style={{padding:"16px 22px",borderTop:"1px solid "+C.mist}}>
            {/* Line subtotals */}
            <div style={{marginBottom:14}}>
              {cart.map(({p,variant,qty,tier})=>{
                const up=variant[tier];
                return (
                  <div key={p.id+"-"+variant.id} style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.stone,padding:"4px 0",borderBottom:"1px solid "+C.mist}}>
                    <span style={{maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.n} {variant.s} x{qty}</span>
                    <span style={{fontWeight:600,color:C.navy,flexShrink:0,marginLeft:8}}>{hasPrice(up)?fmt(up*qty):NO_PRICE_LABEL}</span>
                  </div>
                );
              })}
            </div>
            {/* Subtotal */}
            <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+C.mist,fontSize:12,color:C.stone}}>
              <span>Subtotal ({units} units)</span>
              <span style={{fontWeight:600,color:C.navy}}>{hasPrice(total)?fmt(total):NO_PRICE_LABEL}</span>
            </div>
            {/* Tax */}
            <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+C.mist,fontSize:12,color:C.stone}}>
              <span>Tax</span>
              <span style={{fontSize:11,color:C.stone,fontStyle:"italic"}}>Calculated at checkout</span>
            </div>
            {/* Shipping */}
            <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px dashed "+C.mist,fontSize:12,color:C.stone}}>
              <span>Shipping</span>
              <span style={{fontSize:11,color:C.stone,fontStyle:"italic"}}>Calculated at checkout</span>
            </div>
            {/* Order total */}
            <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",marginTop:2}}>
              <span style={{fontSize:15,fontFamily:"Georgia,serif",fontWeight:700,color:C.navy}}>Order Total</span>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:18,fontWeight:800,color:C.navy}}>{hasPrice(total)?fmt(total):NO_PRICE_LABEL}</div>
                <div style={{fontSize:9,color:C.stone,marginTop:1}}>+ tax & shipping</div>
              </div>
            </div>
            {/* Deposit */}
            <div style={{padding:"10px 14px",background:C.off,border:"1px solid "+C.mist,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.stone,marginBottom:3}}>
                <span>50% Deposit Required</span>
                <span style={{fontWeight:700,color:C.navy}}>{hasPrice(total)?fmt(total*0.5):NO_PRICE_LABEL}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.stone}}>
                <span>Balance Due on Completion of Manufacturing Prior to Shipping</span>
                <span style={{fontWeight:700,color:C.navy}}>{hasPrice(total)?fmt(total*0.5):NO_PRICE_LABEL}</span>
              </div>
            </div>
            <div style={{padding:"7px 12px",background:C.navy,marginBottom:10,fontSize:9,color:C.gold,fontWeight:700,letterSpacing:1,textAlign:"center"}}>ACH · Debit Card · Zelle (Debit &amp; Zelle up to $2,500) — No Credit Cards</div>
            <button onClick={requestQuote} disabled={requested} style={{width:"100%",padding:"12px 0",background:requested?"#8A8680":C.navy,border:"none",color:C.white,fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",cursor:requested?"not-allowed":"pointer",marginBottom:7}}>
              {requested ? "Request Submitted" : "Submit For Review"}
            </button>
            <div style={{fontSize:9,color:C.stone,textAlign:"center",lineHeight:1.6,marginBottom:8}}>Orders are reviewed before fulfillment. Payment initiation does not guarantee approval. Business information, inventory availability, and compliance requirements are verified prior to processing.</div>
            <div style={{fontSize:9,color:C.stone,textAlign:"center",lineHeight:1.6}}>Tax and shipping calculated before final invoice.</div>
          </div>
        )}
      </div>
    </>
  );
}

export default function App() {
  const [gated, setGated] = useState(true);
  const [cart,  setCart]  = useState([]);
  const [copen, setCopen] = useState(false);
  const [page,  setPageState] = useState(() => pageIdFromPath(window.location.pathname));
  const [partnerAccess, setPartnerAccess] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PARTNER_ACCESS_KEY)); } catch { return null; }
  });
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const partnerUnlocked = !!partnerAccess?.unlocked;
  const unlockPartnerAccess = (lead) => {
    const record = { unlocked: true, lead, unlockedAt: new Date().toISOString() };
    localStorage.setItem(PARTNER_ACCESS_KEY, JSON.stringify(record));
    setPartnerAccess(record);
  };
  const count = cart.reduce((s,i)=>s+i.qty,0);

  const setPage = (id) => {
    setPageState(id);
    const path = (PAGES[id] || PAGES.home).path;
    if (window.location.pathname !== path) window.history.pushState({page:id}, "", path);
  };

  useEffect(() => {
    const onPop = () => setPageState(pageIdFromPath(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (typeof window.gtag !== "function") return;
    const cfg = PAGES[page] || PAGES.home;
    window.gtag("event", "page_view", {
      page_path: cfg.path,
      page_title: cfg.title,
      page_location: window.location.origin + cfg.path,
    });
  }, [page]);

  useEffect(() => {
    const cfg = PAGES[page] || PAGES.home;
    const fullTitle = `${cfg.seoTitle} | WholesaleUSPeptides.com`;
    const url = SITE_URL + (cfg.path === "/" ? "/" : cfg.path);
    document.title = fullTitle;
    upsertMeta("name", "description", cfg.description);
    upsertCanonical(url);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", cfg.description);
    upsertMeta("property", "og:url", url);
  }, [page]);

  if (gated) return <Gate ok={()=>setGated(false)}/>;

  const addToCart = (p, variant, qty, tier) => {
    setCart(prev => {
      const ex = prev.find(i=>i.p.id===p.id && i.variant.id===variant.id);
      if (ex) return prev.map(i=>(i.p.id===p.id && i.variant.id===variant.id)?{...i,qty:i.qty+qty}:i);
      return [...prev,{p,variant,qty,tier}];
    });
    setCopen(true);
  };

  return (
    <div style={{fontFamily:"'Inter',sans-serif",background:C.off,minHeight:"100vh"}}>
      <CartDrawer cart={cart} setCart={setCart} open={copen} setOpen={setCopen} setPage={setPage}/>
      <PartnerAccessModal open={partnerModalOpen} onClose={()=>setPartnerModalOpen(false)} unlocked={partnerUnlocked} onUnlock={unlockPartnerAccess} setPage={setPage}/>
      <ContactModal open={contactModalOpen} onClose={()=>setContactModalOpen(false)}/>
      <QuoteRequestModal open={quoteModalOpen} onClose={()=>setQuoteModalOpen(false)}/>
      <PersistentQuoteCTA onClick={()=>setQuoteModalOpen(true)}/>
      <div style={{background:C.navy2,color:C.gold,textAlign:"center",padding:"9px",fontSize:9,letterSpacing:2.5,fontWeight:600,textTransform:"uppercase"}}>
        Wholesale Manufacturing — American Manufacturing — Independent Testing — RUO Only
      </div>
      <nav className="site-nav" style={{background:C.navy,padding:"0 40px",display:"flex",alignItems:"center",justifyContent:"space-between",height:62,position:"sticky",top:0,zIndex:700,borderBottom:"1px solid rgba(201,168,76,0.15)"}}>
        <button onClick={()=>setPage("home")} style={{background:"none",border:"none",cursor:"pointer",textAlign:"left",flexShrink:0}}>
          <div style={{fontSize:14,fontWeight:800,color:C.white,fontFamily:"Georgia,serif"}}>WholesaleUSPeptides.com</div>
          <div style={{fontSize:7,letterSpacing:3,color:C.gold,textTransform:"uppercase",marginTop:2,opacity:0.8}}>Wholesale Manufacturing & White Label</div>
        </button>
        <div className="nav-links" style={{display:"flex"}}>
          {[["home","Home"],["catalog","Catalog"],["wl","White Label"],["about","Standards"],["coa","Batch Verification"]].map(([id,l])=>(
            <button key={id} onClick={()=>setPage(id)} style={{background:"none",border:"none",padding:"0 13px",height:62,fontSize:10,fontWeight:600,color:page===id?C.gold:"rgba(255,255,255,0.5)",borderBottom:page===id?"2px solid "+C.gold:"2px solid transparent",cursor:"pointer",whiteSpace:"nowrap",letterSpacing:0.3}}>
              {l}
            </button>
          ))}
        </div>
        <button onClick={()=>setCopen(true)} style={{background:C.gold,border:"none",color:C.navy,padding:"9px 18px",fontSize:10,fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",cursor:"pointer",flexShrink:0}}>
          {count>0?"Order ("+count+")":"Request Pricing"}
        </button>
      </nav>
      {page==="home"    && <><Hero setPage={setPage}/><WhyPartners/><WhoWeServe/><UnlockPartnerCTA partnerUnlocked={partnerUnlocked} onUnlockClick={()=>setPartnerModalOpen(true)} setPage={setPage}/><StatsStrip/><TrustBanner/><HomeSections setPage={setPage} onContactClick={()=>setContactModalOpen(true)}/></>}
      {page==="catalog" && <Catalog addToCart={addToCart} openCart={()=>setCopen(true)} partnerUnlocked={partnerUnlocked} onUnlockClick={()=>setPartnerModalOpen(true)}/>}
      {page==="wl"      && <WLPage setPage={setPage}/>}
      {page==="about"   && <AboutPage/>}
      {page==="coa"     && <COAPage/>}
      {page==="privacy"   && <PrivacyPolicyPage/>}
      {page==="terms"     && <TermsOfServicePage/>}
      {page==="disclaimer"&& <DisclaimerPage/>}
      {page==="cookies"   && <CookiePolicyPage/>}
    </div>
  );
}
