
# API_CONTRACT

## POST /parse
- Input: multipart form, files (pdf/xlsx/txt)
- Output: { items: DuctItem[] }

## POST /pack
- Input: { vehicle: Vehicle, items: DuctItem[] }
- Output: PackResult

## GET /presets
- Output: Vehicle[]

## POST /export/pdf
- Input: { packResult: PackResult, companyMeta?: { title, logoBase64 } }
- Output: application/pdf (binary)

## POST /export/glb
- Input: { packResult: PackResult }
- Output: model/glb

## POST /export/html
- Input: { packResult: PackResult }
- Output: text/html (self-contained)
