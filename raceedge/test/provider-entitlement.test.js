import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source=readFileSync(new URL('../server.js',import.meta.url),'utf8');

test('public provider price display is entitlement gated',()=>{
  assert.match(source,/planAllowsPublicPriceDisplay=plan=>\['plus','platform'\]/);
  assert.match(source,/PUNTERSEDGE_PUBLIC_PRICE_DISPLAY/);
  assert.match(source,/stripPublicPricesFromEvents/);
  assert.match(source,/priceDisplayAllowed:false/);
  assert.match(source,/price:null,valueEdge:null/);
});

test('public tips and settled results suppress provider prices when unlicensed',()=>{
  assert.match(source,/rows\.map\(row=>\(\{\.\.\.row,price:null\}\)\)/);
  assert.match(source,/averageRecordedPrice:publicPriceDisplayAllowed\(\)\?/);
});
