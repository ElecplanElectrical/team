import { PrismaClient, Prisma } from "@prisma/client";
import { readFile } from "node:fs/promises";

const prisma = new PrismaClient();

function csvRows(input: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], field = "", quoted = false;
  for (let i=0;i<input.length;i++) { const c=input[i];
    if (c === '"') { if (quoted && input[i+1] === '"') { field += '"'; i++; } else quoted=!quoted; }
    else if (c === "," && !quoted) { row.push(field); field=""; }
    else if ((c === "\n" || c === "\r") && !quoted) { if (c==="\r" && input[i+1]==="\n") i++; row.push(field); if(row.some(Boolean)) rows.push(row); row=[]; field=""; }
    else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}
const money=(v:string)=>v.trim()===""?null:new Prisma.Decimal(v);
async function main(){
  const path=process.argv[2]; if(!path) throw new Error("Usage: npm run supplier:import -- /secure/path/file.csv");
  const rows=csvRows((await readFile(path,"utf8")).replace(/^\uFEFF/,"")); const [header,...data]=rows;
  const ix=(n:string)=>{const i=header.indexOf(n); if(i<0) throw new Error("Missing column: "+n); return i;};
  const c={code:ix("Product Code"),desc:ix("Product Description"),group:ix("Product Group"),ex:ix("Price Ex Tax"),inc:ix("Price Inc Tax"),retail:ix("Retail Price"),currency:ix("Currency"),unit:ix("Unit of Measure"),per:ix("Price Per"),entity:ix("Supplier Entity Code"),supplier:ix("Supplier Name")};
  let imported=0, review=0;
  for (const r of data) {
    const ex=money(r[c.ex]), per=money(r[c.per]); const needsReview=!ex || ex.lte(0) || ex.gt(100000) || (!!per && !per.equals(1)); if(needsReview) review++;
    await prisma.supplierProduct.upsert({
      where:{supplierEntityCode_productCode:{supplierEntityCode:r[c.entity],productCode:r[c.code]}},
      update:{supplierName:r[c.supplier],description:r[c.desc],productGroup:r[c.group]||null,priceExTax:ex,priceIncTax:money(r[c.inc]),retailPrice:money(r[c.retail]),currency:r[c.currency]||"AUD",unitOfMeasure:r[c.unit]||null,pricePer:per,reviewRequired:needsReview,sourceImportedAt:new Date()},
      create:{supplierEntityCode:r[c.entity],supplierName:r[c.supplier],productCode:r[c.code],description:r[c.desc],productGroup:r[c.group]||null,priceExTax:ex,priceIncTax:money(r[c.inc]),retailPrice:money(r[c.retail]),currency:r[c.currency]||"AUD",unitOfMeasure:r[c.unit]||null,pricePer:per,reviewRequired:needsReview}
    }); imported++;
  }
  console.log(JSON.stringify({imported,reviewRequired:review}));
}
main().finally(()=>prisma.$disconnect());
