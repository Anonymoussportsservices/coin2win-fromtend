from pathlib import Path

path = Path("/var/www/coin2win-ui/app/cashier/page.tsx")
text = path.read_text()

marker = '{showKycModal && ('

first = text.find(marker)
if first == -1:
    raise SystemExit("No encontré ningún modal KYC")

second = text.find(marker, first + 1)
if second == -1:
    raise SystemExit("Solo hay un modal. No hice cambios.")

end_marker = '\n\n        <div style={{ marginBottom: 16 }}>'
end = text.find(end_marker, second)
if end == -1:
    raise SystemExit("No encontré el final esperado del segundo modal")

new_text = text[:second] + text[end:]
path.write_text(new_text)
print("OK: segundo modal KYC eliminado")
