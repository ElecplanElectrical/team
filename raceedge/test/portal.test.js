import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../public/app.css',import.meta.url),'utf8');
const server=readFileSync(new URL('../server.js',import.meta.url),'utf8');

test('RaceEdge portal exposes the approved five-tab navigation',()=>{
  for(const label of ['Home','Races','Tips','Results','More']) assert.ok(html.includes(label),label);
  assert.match(html,/brandLogo/);
  assert.match(css,/--blue:#1db8ff/);
});

test('RaceEdge portal implements all approved working screen flows',()=>{
  for(const screen of ["home","races","meeting","race","runner","tips","results","more"]) {
    assert.match(js,new RegExp("function "+screen+"\\("),screen);
  }
  for(const tab of ['tips','form','analysis','pace']) assert.ok(js.includes("data-racetab=\""+tab+"\""),tab);
  for(const tab of ['form','stats','track','history']) assert.ok(js.includes("data-runnertab=\""+tab+"\""),tab);
});

test('RaceEdge portal consumes only public production APIs',()=>{
  for(const path of ['/api/v1/live/today','/api/v1/results','/api/v1/performance','/api/v1/release-status']) assert.ok(js.includes(path),path);
  assert.doesNotMatch(js,/\/api\/v1\/provider\//);
  assert.doesNotMatch(js,/\/api\/v1\/admin\//);
});

test('CSP supports approved embedded logo without unsafe inline script/style',()=>{
  assert.match(server,/img-src 'self' data:/);
  assert.match(server,/style-src 'self'/);
  assert.match(server,/script-src 'self'/);
  assert.doesNotMatch(server,/unsafe-inline/);
});
