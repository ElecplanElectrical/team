"""One-time Elecplan-only presentation migration. No API/auth/database edits."""
from pathlib import Path
import re, json, sys
root=Path(sys.argv[1]) if len(sys.argv)>1 else Path('elecplan-scaffold')
assert root.name=='elecplan-scaffold' and (root/'src/components/Sidebar.tsx').is_file()
assert (root/'src/lib/carbon-theme.ts').is_file()
if 'data-elecplan-theme="recessed-carbon-10"' in (root/'src/app/layout.tsx').read_text():
    print("Theme already migrated; no changes.");sys.exit(0)
changes=[]
hex_map={}
def group(values,replacement):
    for value in values.split():hex_map[value.lower()]=replacement
# Neutral surfaces, text and brand anchors only. Operational status hues stay intact.
group('#03101f #061525 #0b0d10 #0a0d12 #07131f','#0d1117')
group('#041323 #10151b','#10151b')
group('#07192b #07182b #0a2038 #081b30 #151a21 #181e26','#181e27')
group('#09213a #103152 #202731 #222a35 #0d2a48 #0a223b #0a2a47','#20272f')
group('#16466f','#29323d')
group('#f5f9ff #f6f9ff #f4f8ff','#f4f7fa')
group('#93a9c2 #93a8c1 #91a8c1 #94a8c2 #a8c3dd #c0c7d0 #c2cad4','#c5cdd7')
group('#617993 #607892 #627892 #7392af #5f7894 #7f8b9b #8e99a8','#a5b0bd')
group('#168dff #1592ff #25c7ff #38bdf8 #2a9cff #138cff #0d6fe7 #075fd0 #0ea5e9','#43D2FF')
group('#62b6ff','#78e5ff')

def hex_replace(match):
    v=match[0].lower(); base=v[:7]
    if v in hex_map:return hex_map[v]
    if len(v)==9 and base in hex_map:return hex_map[base]+v[7:]
    return match[0]

def balanced_end(t,start):
    level=0; quote=None;esc=False
    for i in range(start,len(t)):
        c=t[i]
        if quote:
            if esc:esc=False
            elif c=='\\':esc=True
            elif c==quote:quote=None
            continue
        if c in ['"',"'",'`']:quote=c
        elif c=='{':level+=1
        elif c=='}':
            level-=1
            if level==0:return i+1
    raise ValueError('Unbalanced style object')

def primary_text(t):
    # Replace white text only in a style object that has a primary-blue fill.
    starts=[m.end()-1 for m in re.finditer(r'style\s*=\s*\{\s*\{',t)]
    for start in reversed(starts):
        end=balanced_end(t,start); block=t[start:end]
        if '...UI.primary' in block:
            block=re.sub(r'\bcolor\s*:\s*(?:"(?:white|#fff|#ffffff)"|UI\.text)(?![A-Za-z0-9_])', 'color: UI.activeText',block)
            t=t[:start]+block+t[end:]
    return t

for p in sorted((root/'src').rglob('*.tsx')):
    rel=p.relative_to(root).as_posix()
    if '/api/' in rel or p.name in ['CarbonNavigation.tsx','Sidebar.tsx','MobileNav.tsx']:continue
    old=p.read_text();t=old
    # Existing views use a common UI object. Keep their behavior and consume shared tokens.
    t,n=re.subn(r'const UI\s*=\s*\{[^{}]*\};', 'import { PORTAL_UI as UI } from "@/lib/carbon-theme";',t)
    assert n<=1,rel
    t=re.sub(r'#[A-Fa-f0-9]{3,8}\b',hex_replace,t)
    # All main surfaces lose the old navy wash.
    t=re.sub(r'background\s*:\s*"radial-gradient\([^"\n]*\),\s*#0d1117"', 'background: "var(--ep-main)"',t)
    # Highlight, panel and field primitives: spreads preserve caller overrides.
    t=re.sub(r'\bbackground\s*:\s*UI\.panelAlt\b','...UI.inset, background: UI.panelAlt',t)
    t=re.sub(r'\bbackground\s*:\s*UI\.alt\b','...UI.inset, background: UI.alt',t)
    t=re.sub(r'\bbackground\s*:\s*UI\.panel\b','...UI.raised, background: UI.panel',t)
    t=re.sub(r'\bbackground\s*:\s*UI\.blue\b','...UI.primary',t)
    t=re.sub(r'\bbackground\s*:\s*"#10151b"','...{boxShadow:"var(--ep-inset-shadow)"}, background: "var(--ep-input)"',t)
    t=re.sub(r'\bbackground\s*:\s*"#181e27"','...{boxShadow:"var(--ep-raised-shadow)"}, background: "var(--ep-shell)"',t)
    t=re.sub(r'\bbackground\s*:\s*"#20272f"','...{boxShadow:"var(--ep-inset-shadow)"}, background: "var(--ep-tray)"',t)
    t=re.sub(r'background\s*:\s*"linear-gradient\(160deg,#181e27,#12171d\)"','background:"var(--ep-shell)",boxShadow:"var(--ep-raised-shadow)"',t)
    t=re.sub(r'background\s*:\s*"rgba\(10,32,56,\.98\)"','background:"var(--ep-shell)"',t)
    # Centralize branded RGB colors used in selected chips and charts.
    for triplet in ['21,146,255','22,141,255','37,199,255','56,189,248','61,197,240','15,91,163','20,91,160']:
        pattern=r'(rgba?\(\s*)'+r'\s*,\s*'.join(triplet.split(','))+r'\s*,'
        t=re.sub(pattern,r'\g<1>67,210,255,',t)
    for triplet in ['77,150,221','73,145,214','125,211,252','90,129,164']:
        pattern=r'(rgba\(\s*)'+r'\s*,\s*'.join(triplet.split(','))+r'\s*,'
        t=re.sub(pattern,r'\g<1>197,205,215,',t)
    for triplet in ['9,31,54','3,17,31','8,29,51','5,22,40','8,28,48']:
        pattern=r'(rgba\(\s*)'+r'\s*,\s*'.join(triplet.split(','))+r'\s*,'
        t=re.sub(pattern,r'\g<1>24,29,35,',t)
    t=primary_text(t)
    if p.name=='TopBar.tsx':t=t.replace('return <header className="','return <header className="ep-carbon-topbar ')
    if rel=='src/app/(app)/layout.tsx':
        t=t.replace('<MobileNav role={user.role} />','<MobileNav role={user.role} name={user.name ?? user.email ?? "User"} />')
    if rel=='src/app/layout.tsx':
        t=t.replace('import "./globals.css";','import "./globals.css";\nimport "@/styles/recessed-carbon.css";')
        t=t.replace('<body className="min-h-full">','<body className="ep-carbon min-h-full" data-elecplan-theme="recessed-carbon-10">')
    if p.name=='AiAssistantClient.tsx':
        t=t.replace('bg-white/[.04]','ep-raised').replace('bg-white/[.03]','ep-inset').replace('bg-white/[.05]','ep-inset').replace('bg-sky-950/30','ep-inset')
    if t!=old:p.write_text(t);changes.append(rel)
# Theme tokens keep semantic job/calendar colours and all original type definitions.
p=root/'src/lib/theme.ts';old=p.read_text();t=old
start=t.index('/**'); end=t.index('export const COLORS')
t='/** Elecplan Recessed Carbon (#10). Shared semantic colours, independent of other products. */\n'+t[end:]
repls={'bg':'#0d1117','sidebar':'#14181e','card':'#181e27','cardAlt':'#20272f','border':'#3a424c','borderSoft':'#2a313a','text':'#f4f7fa','textMute':'#c5cdd7','textFaint':'#a5b0bd','accent':'#43D2FF','accentDim':'rgba(67,210,255,0.14)','accentGlow':'rgba(67,210,255,0.35)'}
for key,value in repls.items():t=re.sub(r'\b'+key+r':\s*"[^"]+"',key+': "'+value+'"',t,count=1)
t=t.replace('export const ON_ACCENT = "#06222C"','export const ON_ACCENT = "#062531"')
if t!=old:p.write_text(t);changes.append(str(p.relative_to(root)))
# Leave fonts, dependencies, CSP, APIs, migrations, brand assets and service workers alone.
for rel in ['src/app/manifest.ts','public/manifest.webmanifest']:
    p=root/rel
    if p.is_file():
        old=p.read_text();t=re.sub(r'#(?:07131f|03101f|0a0d12)', '#0d1117',old,flags=re.I)
        if t!=old:p.write_text(t);changes.append(rel)
print(json.dumps({'theme':'10 Recessed Carbon','files':len(changes),'changed':changes},indent=2))
