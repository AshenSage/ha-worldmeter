# Krisenradar 1.0.0

Erste normale Veröffentlichung der installierbaren Home-Assistant-Karte. Die Version ist kein GitHub-Prerelease, ihre Inhalte sind aber ausdrücklich eine Demo mit erfundenen Strahlungsmesswerten und Krankheitsfällen. Eine Live-Datenanbindung ist noch nicht enthalten.

## Downloads

- `krisenradar-card.js`: direkt installierbare Karte.
- `ha-worldmeter-1.0.0.zip`: Karte, Anleitung, YAML-Beispiele und eigenständige Vorschau.
- `SHA256SUMS.txt`: Prüfsummen.

In Home Assistant nach Installation verwenden:

```yaml
type: custom:krisenradar-card
region: world
layer: all
demo: true
```

Die komplette Anleitung für HACS und manuelle Installation steht in der README.
