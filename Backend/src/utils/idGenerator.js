import crypto from "node:crypto";

export function generateUUID() {
  return crypto.randomUUID();
}

let counters = {
  EMP: 1050,
  REQ: 1200,
  CAND: 300,
  OFFER: 150,
  ONB: 400,
  ATT: 5000,
  LEV: 800,
  OT: 250,
  GOAL: 600,
  REV: 350,
  CRS: 120,
  PAY: 100,
  PSLIP: 2000,
  WF: 900,
  AUD: 7000,
};

export function generateCode(prefix = "DOC") {
  const year = new Date().getFullYear();
  if (prefix === "EMP") {
    counters.EMP += 1;
    return `EMP-${counters.EMP}`;
  }
  if (!counters[prefix]) {
    counters[prefix] = 100;
  }
  counters[prefix] += 1;
  return `${prefix}-${year}-${String(counters[prefix]).padStart(4, "0")}`;
}

