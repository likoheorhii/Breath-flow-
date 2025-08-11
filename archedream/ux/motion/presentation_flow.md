# Презентационный флоу и анимации

Стартовый кадр: Home (Flow starting point)

Переходы
- Home → Record: Smart Animate, 220ms, cubic-bezier(0.22,1,0.36,1)
- Record → Insight: Smart Animate, 220ms; мандала scale .92→1.0, opacity 0→1
- Insight → Integrate: Smart Animate, 220ms
- Insight → Wheel (overlay): Open Overlay, bottom sheet, slide up 32px, backdrop .4
- Home → Sanctuary: Open Overlay, opacity .12, Reduce Motion — только opacity

Элементы
- Evidence chips: hover → elevation e1 (100ms) + glow архетипа (150ms)
- Practice done: Change To done=true; после — конфетти 6 точек (opacity 0→1→0, 500ms)

Советы
- Включите Smart Animate matching layers: имена слоёв одинаковые на экранах.
- В Reduce Motion — снимите «Smart Animate matching layers», используйте Fade.