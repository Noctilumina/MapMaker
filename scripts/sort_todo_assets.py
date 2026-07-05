#!/usr/bin/env python3
"""One-off: sort public/assets/todo/*.png into library categories.
Renames to library style (Title Case + WxH), infers gridSize from PNG dims
(300 px/tile), rebuilds manifest.json + tags.json. DRY unless --execute."""
import os, re, json, struct, shutil, sys, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "public", "assets")
TODO = os.path.join(ASSETS, "todo")
TILE = 300
EXECUTE = "--execute" in sys.argv

ACRONYM = {"ncra": "NCRA", "ncpd": "NCPD", "ncn": "NCN", "sovoil": "SovOil",
           "sus": "Sus", "network54": "Network54"}
CORP = {"arasaka", "militech", "zetatech", "petrochem", "ncra", "ncpd", "ncn",
        "biotechnica", "continental", "sovoil", "rocklinaug", "orbitalair",
        "network54", "netrunner", "ripperdock", "chopshop"}

def png_dims(path):
    with open(path, "rb") as f:
        assert f.read(8) == b"\x89PNG\r\n\x1a\n", path
        f.read(4); assert f.read(4) == b"IHDR"
        return struct.unpack(">II", f.read(8))

def grid(w, h):
    return max(1, round(w / TILE)), max(1, round(h / TILE))

def categorize(b):
    if re.match(r"(asphalt|concrete|dirt|grass|gravel|sand)_patch", b): return "patches"
    if b.startswith("concrete_plant") or b.startswith("plant_"): return "nature"
    if b.startswith("dumpster") or b.startswith("trash_container") or "waste_container" in b: return "trash"
    if b.startswith("container_"): return "container"
    if b.startswith("vending_"): return "tech"
    if b.startswith("cable_bundle"): return "wall-elements"
    if b.startswith("light_fixture"): return "lighting"
    if b.startswith("grate") or b.startswith("spills"): return "floor-elements"
    if b.startswith("manhole"): return "street"
    if b.startswith("graffiti"): return "graffiti"
    if b.startswith("tarp") or b.startswith("tent") or b.startswith("net_"): return "decor"
    if b.startswith("industrial_tank"): return "tech"
    if b.startswith("locked_safe"): return "furniture"
    if re.match(r"(chair|folding_chair|desk|fridge|stove|sink|washing_machine|bathtub|shower|kitchen|bathroom|medical)", b):
        return "furniture"
    return "furniture"

def vibe(cat, b):
    if cat in ("patches", "nature", "decor"): return ["generic"]
    if cat == "container": return ["sci-fi"]
    if any(tok in b for tok in CORP): return ["sci-fi"]
    return ["modern"]

def pretty(stem):
    return " ".join(ACRONYM.get(t, t.capitalize()) for t in stem.split("_"))

# --- gather + normalize ---
files = sorted(f for f in os.listdir(TODO) if f.lower().endswith(".png"))
recs = []
for f in files:
    base = f[:-4]                                   # drop .png
    base = base.replace("contaainer", "container")  # fix typo
    norm = re.sub(r"\s*\(\d+\)$", "", base)         # drop " (1)"
    stem = re.sub(r"_\d+$", "", norm)               # drop trailing _NN
    w, h = png_dims(os.path.join(TODO, f))
    cat = categorize(norm)
    recs.append({"src": f, "stem": stem, "cat": cat, "w": w, "h": h,
                 "grid": grid(w, h)})

# --- assign variant numbers per (cat, stem), build names ---
groups = collections.defaultdict(list)
for r in recs:
    groups[(r["cat"], r["stem"])].append(r)

existing = set()
for r in sorted(recs, key=lambda x: x["src"]):
    grp = groups[(r["cat"], r["stem"])]
    multi = len(grp) > 1
    n = grp.index(r) + 1
    gw, gh = r["grid"]
    label = pretty(r["stem"])
    name = f"{label} {n} - {gw}x{gh}" if multi else f"{label} - {gw}x{gh}"
    # avoid collision with anything already claimed / on disk
    catdir = os.path.join(ASSETS, r["cat"])
    k = n if multi else 1
    while True:
        fname = name + ".png"
        if (r["cat"], fname) not in existing and not os.path.exists(os.path.join(catdir, fname)):
            break
        k += 1
        name = f"{label} {k} - {gw}x{gh}"
    existing.add((r["cat"], name + ".png"))
    r["name"] = name
    r["fname"] = name + ".png"
    r["path"] = f"/assets/{r['cat']}/{r['fname']}"
    r["id"] = f"{r['cat']}/{r['fname'].replace(' ', '-')}"
    r["rel"] = f"{r['cat']}/{r['fname']}"
    r["vibe"] = vibe(r["cat"], r["stem"])

# --- report ---
bycat = collections.Counter(r["cat"] for r in recs)
print("CATEGORY TOTALS:", dict(sorted(bycat.items(), key=lambda x: -x[1])))
print(f"TOTAL: {len(recs)} files  |  MODE: {'EXECUTE' if EXECUTE else 'DRY-RUN'}\n")
for r in sorted(recs, key=lambda x: (x["cat"], x["name"])):
    print(f"  {r['cat']:14} {r['src']:42} -> {r['fname']}  {r['grid'][0]}x{r['grid'][1]}  {r['vibe'][0]}")

if not EXECUTE:
    print("\n(dry-run; no files moved, no JSON written. add --execute)")
    sys.exit(0)

# --- execute: move files ---
for r in recs:
    catdir = os.path.join(ASSETS, r["cat"])
    os.makedirs(catdir, exist_ok=True)
    shutil.move(os.path.join(TODO, r["src"]), os.path.join(catdir, r["fname"]))

# --- update manifest.json ---
mpath = os.path.join(ASSETS, "manifest.json")
man = json.load(open(mpath, encoding="utf-8"))
have = {a["path"] for a in man["assets"]}
added = 0
for r in recs:
    if r["path"] in have: continue
    man["assets"].append({"id": r["id"], "name": r["name"], "category": r["cat"],
                          "path": r["path"], "gridSize": [r["grid"][0], r["grid"][1]]})
    added += 1
man["assets"].sort(key=lambda a: (a["category"], a["name"]))
json.dump(man, open(mpath, "w", encoding="utf-8"), indent=2, ensure_ascii=False)

# --- update tags.json ---
tpath = os.path.join(ASSETS, "tags.json")
tags = json.load(open(tpath, encoding="utf-8"))
thave = {t["rel_path"] for t in tags}
tadded = 0
for r in recs:
    if r["rel"] in thave: continue
    tags.append({"rel_path": r["rel"], "name": r["name"], "category": r["cat"],
                 "vibe_tags": r["vibe"]})
    tadded += 1
tags.sort(key=lambda t: (t["category"], t["name"]))
json.dump(tags, open(tpath, "w", encoding="utf-8"), indent=2, ensure_ascii=False)

print(f"\nMOVED {len(recs)} files | manifest +{added} (now {len(man['assets'])}) | tags +{tadded} (now {len(tags)})")
left = [f for f in os.listdir(TODO) if f.lower().endswith('.png')]
print(f"todo/ remaining PNGs: {len(left)}")
