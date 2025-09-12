
#!/usr/bin/env bash
set -e
mkdir -p out-artifacts
echo "%PDF-1.4\n% stub Ventprom report" > out-artifacts/report-sample.pdf
cat > out-artifacts/scene-sample.html <<'HTML'
<!doctype html><meta charset="utf-8"><title>Ventprom 3D (stub)</title><h1>Ventprom Packer — 3D HTML (stub)</h1>
HTML
# Create a tiny glTF/GLB-like placeholder (not a valid model, stub for pipeline)
echo "GLB-STUB" > out-artifacts/scene-sample.glb
