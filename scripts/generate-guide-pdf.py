#!/usr/bin/env python3
"""Generate ATELIER frontend complete-system PDF guide."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, inch
from reportlab.lib.colors import Color, HexColor, white, black
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    PageBreak,
    Table,
    TableStyle,
    Preformatted,
    KeepTogether,
    ListFlowable,
    ListItem,
    Flowable,
    CondPageBreak,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from datetime import date
import os

OUT = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "ATELIER-Frontend-Complete-Guide.pdf",
)

TEAL = HexColor("#00272D")
TEAL_MID = HexColor("#0A3D45")
CREAM = HexColor("#F5F0E8")
ACCENT = HexColor("#4E9CFF")
INK = HexColor("#1A1A1C")
MUTED = HexColor("#5A5A5E")
CODE_BG = HexColor("#F4F1EA")
CODE_FG = HexColor("#1E2A32")
ROW_ALT = HexColor("#F7F5F0")
LINE = HexColor("#D8D2C6")
WARN = HexColor("#8A5A12")
OK = HexColor("#1F6B4A")
BOX_FILL = HexColor("#E8F2FF")
BOX_UE = HexColor("#E6F4EE")
BOX_STOR = HexColor("#FFF3D6")
BOX_URL = HexColor("#F3E8FF")


class HRule(Flowable):
    def __init__(self, color=LINE, thickness=0.6, space=6):
        super().__init__()
        self.color = color
        self.thickness = thickness
        self.space = space
        self.height = space * 2 + thickness
        self.width = 0

    def wrap(self, aw, ah):
        self.width = aw
        return aw, self.height

    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.thickness)
        y = self.space
        self.canv.line(0, y, self.width, y)


class Callout(Flowable):
    def __init__(self, title, body, fill, width=None):
        super().__init__()
        self.title = title
        self.body = body
        self.fill = fill
        self._w = width
        self._h = 0

    def wrap(self, aw, ah):
        self._w = aw
        # estimate height from wrapped text
        from reportlab.pdfbase.pdfmetrics import stringWidth

        max_w = aw - 16
        words = self.body.split()
        lines = []
        cur = ""
        for w in words:
            test = (cur + " " + w).strip()
            if stringWidth(test, "Helvetica", 8.5) <= max_w:
                cur = test
            else:
                if cur:
                    lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
        self._lines = lines
        self._h = 22 + len(lines) * 12 + 10
        return aw, self._h

    def draw(self):
        c = self.canv
        c.setFillColor(self.fill)
        c.roundRect(0, 0, self._w, self._h, 5, fill=1, stroke=0)
        c.setFillColor(TEAL)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(8, self._h - 14, self.title.upper())
        c.setFillColor(INK)
        c.setFont("Helvetica", 8.5)
        y = self._h - 28
        for line in self._lines:
            c.drawString(8, y, line)
            y -= 12


class Diagram(Flowable):
    """Generic stacked-box flowchart with optional side labels."""

    def __init__(self, boxes, arrows=True, height=None):
        super().__init__()
        self.boxes = boxes  # list of (label, fill)
        self.arrows = arrows
        n = len(boxes)
        self._box_h = 22
        self._gap = 16
        self._h = n * self._box_h + (n - 1) * self._gap + 8
        self._w = 0

    def wrap(self, aw, ah):
        self._w = aw
        return aw, self._h

    def draw(self):
        c = self.canv
        n = len(self.boxes)
        bw = min(self._w * 0.72, 380)
        x = (self._w - bw) / 2
        y = self._h - self._box_h - 2
        for i, (label, fill) in enumerate(self.boxes):
            c.setFillColor(fill)
            c.setStrokeColor(TEAL_MID)
            c.setLineWidth(0.7)
            c.roundRect(x, y, bw, self._box_h, 4, fill=1, stroke=1)
            c.setFillColor(INK)
            c.setFont("Helvetica", 8)
            c.drawCentredString(x + bw / 2, y + 7, label)
            if self.arrows and i < n - 1:
                ay = y - 2
                c.setStrokeColor(TEAL)
                c.setFillColor(TEAL)
                c.setLineWidth(1)
                c.line(x + bw / 2, ay, x + bw / 2, ay - self._gap + 6)
                # arrow head
                c.drawString(x + bw / 2 - 3, ay - self._gap + 4, "v")
            y -= self._box_h + self._gap


class LayerDiagram(Flowable):
    def wrap(self, aw, ah):
        self._w = aw
        self._h = 168
        return aw, self._h

    def draw(self):
        c = self.canv
        layers = [
            ("Routes  ·  src/app/*  ·  homepage, projects, /configurator/[projectId]", HexColor("#DCEBFF")),
            ("Shell UI  ·  ConfiguratorShell + ZoneTopBar + SidePanel + Dock", HexColor("#E8F2FF")),
            ("Hooks  ·  useStreamPixel · useShareableParams · useSelectionMap · useUeInteraction", HexColor("#E6F4EE")),
            ("Domain lib  ·  api.ts · storage · sync-to-ue · zone-catalog · mesh-rules · pricing", HexColor("#FFF3D6")),
            ("StreamPixel SDK  ·  WebRTC video  ·  emitUIInteraction  →  Unreal Engine", HexColor("#F3E8FF")),
        ]
        y = self._h - 28
        for label, fill in layers:
            c.setFillColor(fill)
            c.setStrokeColor(TEAL_MID)
            c.roundRect(8, y, self._w - 16, 24, 4, fill=1, stroke=1)
            c.setFillColor(INK)
            c.setFont("Helvetica", 8)
            c.drawString(16, y + 8, label)
            y -= 32


class DualModeDiagram(Flowable):
    def wrap(self, aw, ah):
        self._w = aw
        self._h = 118
        return aw, self._h

    def draw(self):
        c = self.canv
        w = (self._w - 28) / 2
        boxes = [
            (8, "EDIT mode  (no designCode)", BOX_FILL, [
                "URL: unit + level + camera + zone",
                "Selections: FE map + localStorage",
                "UE: live preview only",
                "Submit → Design Code",
            ]),
            (16 + w, "VIEW_ONLY mode  (has designCode)", BOX_UE, [
                "URL: unit + level + designCode",
                "Selections: loaded from registry",
                "Editors / submit hidden",
                "Start my own design drops code",
            ]),
        ]
        for x, title, fill, lines in boxes:
            c.setFillColor(fill)
            c.setStrokeColor(TEAL_MID)
            c.roundRect(x, 8, w, 102, 6, fill=1, stroke=1)
            c.setFillColor(TEAL)
            c.setFont("Helvetica-Bold", 8.5)
            c.drawString(x + 8, 94, title)
            c.setFillColor(INK)
            c.setFont("Helvetica", 8)
            yy = 76
            for line in lines:
                c.drawString(x + 8, yy, "•  " + line)
                yy -= 14


class PersistenceDiagram(Flowable):
    def wrap(self, aw, ah):
        self._w = aw
        self._h = 92
        return aw, self._h

    def draw(self):
        c = self.canv
        items = [
            (8, BOX_URL, "URL", "camera, zone, level,\nunit, designCode"),
            (self._w / 3 + 4, BOX_STOR, "localStorage", "mesh + material\nper slot (draft)"),
            (2 * self._w / 3, BOX_UE, "Unreal Engine", "live 3D preview\nNOT durable"),
        ]
        bw = self._w / 3 - 12
        for x, fill, title, body in items:
            c.setFillColor(fill)
            c.setStrokeColor(TEAL_MID)
            c.roundRect(x, 8, bw, 76, 5, fill=1, stroke=1)
            c.setFillColor(TEAL)
            c.setFont("Helvetica-Bold", 9)
            c.drawCentredString(x + bw / 2, 66, title)
            c.setFillColor(INK)
            c.setFont("Helvetica", 7.5)
            for i, line in enumerate(body.split("\n")):
                c.drawCentredString(x + bw / 2, 48 - i * 12, line)


def make_styles():
    ss = getSampleStyleSheet()
    styles = {
        "coverKicker": ParagraphStyle(
            "coverKicker",
            fontName="Helvetica",
            fontSize=9,
            letterSpacing=2.2,
            textColor=CREAM,
            alignment=TA_CENTER,
            spaceAfter=8,
        ),
        "coverTitle": ParagraphStyle(
            "coverTitle",
            fontName="Helvetica-Bold",
            fontSize=26,
            leading=32,
            textColor=CREAM,
            alignment=TA_CENTER,
            spaceAfter=8,
        ),
        "coverSub": ParagraphStyle(
            "coverSub",
            fontName="Helvetica",
            fontSize=11,
            leading=16,
            textColor=HexColor("#C9D8D4"),
            alignment=TA_CENTER,
        ),
        "h1": ParagraphStyle(
            "h1",
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=20,
            textColor=TEAL,
            spaceBefore=4,
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "h2",
            fontName="Helvetica-Bold",
            fontSize=12.5,
            leading=16,
            textColor=TEAL_MID,
            spaceBefore=12,
            spaceAfter=6,
        ),
        "h3": ParagraphStyle(
            "h3",
            fontName="Helvetica-Bold",
            fontSize=10.5,
            leading=14,
            textColor=INK,
            spaceBefore=9,
            spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "body",
            fontName="Helvetica",
            fontSize=9.2,
            leading=13.2,
            textColor=INK,
            alignment=TA_JUSTIFY,
            spaceAfter=6,
        ),
        "bodyL": ParagraphStyle(
            "bodyL",
            fontName="Helvetica",
            fontSize=9.2,
            leading=13.2,
            textColor=INK,
            alignment=TA_LEFT,
            spaceAfter=6,
        ),
        "small": ParagraphStyle(
            "small",
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=MUTED,
            spaceAfter=4,
        ),
        "caption": ParagraphStyle(
            "caption",
            fontName="Helvetica-Oblique",
            fontSize=8,
            leading=11,
            textColor=MUTED,
            alignment=TA_CENTER,
            spaceBefore=2,
            spaceAfter=10,
        ),
        "bullet": ParagraphStyle(
            "bullet",
            fontName="Helvetica",
            fontSize=9,
            leading=12.8,
            textColor=INK,
            leftIndent=12,
            spaceAfter=2,
        ),
        "code": ParagraphStyle(
            "code",
            fontName="Courier",
            fontSize=7.4,
            leading=10.2,
            textColor=CODE_FG,
            leftIndent=4,
            rightIndent=4,
        ),
        "toc": ParagraphStyle(
            "toc",
            fontName="Helvetica",
            fontSize=10,
            leading=16,
            textColor=INK,
        ),
        "filePath": ParagraphStyle(
            "filePath",
            fontName="Courier-Bold",
            fontSize=8,
            leading=11,
            textColor=TEAL,
            spaceBefore=7,
            spaceAfter=2,
        ),
        "th": ParagraphStyle(
            "th",
            fontName="Helvetica-Bold",
            fontSize=7.5,
            leading=10,
            textColor=white,
        ),
        "td": ParagraphStyle(
            "td",
            fontName="Helvetica",
            fontSize=7.6,
            leading=10.2,
            textColor=INK,
        ),
        "tdB": ParagraphStyle(
            "tdB",
            fontName="Courier",
            fontSize=7.2,
            leading=10,
            textColor=TEAL,
        ),
        "footer": ParagraphStyle(
            "footer",
            fontName="Helvetica",
            fontSize=7.5,
            textColor=MUTED,
        ),
    }
    return styles


S = make_styles()


def P(text, style="body"):
    return Paragraph(text.replace("\n", "<br/>"), S[style])


def code_block(text):
    pre = Preformatted(text.strip("\n"), S["code"])
    t = Table([[pre]], colWidths=["*"])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), CODE_BG),
                ("BOX", (0, 0), (-1, -1), 0.4, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    return t


def file_table(rows):
    header = [
        P("File", "th"),
        P("Role in the system", "th"),
        P("Edit for", "th"),
    ]
    data = [header]
    for path, role, edit in rows:
        data.append([P(path, "tdB"), P(role, "td"), P(edit, "td")])
    t = Table(data, colWidths=[148, 210, 117], repeatRows=1)
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), TEAL),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.3, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            style_cmds.append(("BACKGROUND", (0, i), (-1, i), ROW_ALT))
        else:
            style_cmds.append(("BACKGROUND", (0, i), (-1, i), white))
    t.setStyle(TableStyle(style_cmds))
    return t


def bullets(items):
    out = []
    for it in items:
        out.append(P("•  " + it, "bullet"))
    return out


def add_header_footer(canv, doc):
    canv.saveState()
    page = canv.getPageNumber()
    if page == 1:
        canv.restoreState()
        return
    w, h = A4
    canv.setFillColor(TEAL)
    canv.rect(0, h - 14 * mm, w, 14 * mm, fill=1, stroke=0)
    canv.setFillColor(CREAM)
    canv.setFont("Helvetica", 8)
    canv.drawString(18 * mm, h - 9 * mm, "ATELIER  ·  Frontend complete system guide")
    canv.drawRightString(w - 18 * mm, h - 9 * mm, "atelier-fe")
    canv.setFillColor(TEAL)
    canv.rect(0, 0, w, 12 * mm, fill=1, stroke=0)
    canv.setFillColor(CREAM)
    canv.setFont("Helvetica", 8)
    canv.drawString(18 * mm, 5 * mm, "Confidential engineering notes  ·  mock backend")
    canv.drawRightString(w - 18 * mm, 5 * mm, f"Page {page}")
    canv.restoreState()


def draw_cover(canv, doc):
    w, h = A4
    canv.saveState()
    canv.setFillColor(TEAL)
    canv.rect(0, 0, w, h, fill=1, stroke=0)
    # decorative lines
    canv.setStrokeColor(HexColor("#1A4A50"))
    canv.setLineWidth(0.4)
    canv.line(w * 0.28, 0, w * 0.28, h)
    canv.line(w * 0.72, 0, w * 0.72, h)
    canv.line(0, h * 0.32, w, h * 0.32)
    canv.line(0, h * 0.68, w, h * 0.68)
    canv.setFillColor(CREAM)
    canv.setFont("Helvetica", 9)
    canv.drawCentredString(w / 2, h - 38 * mm, "R E E F   ·   A T E L I E R")
    canv.setFont("Helvetica-Bold", 28)
    canv.drawCentredString(w / 2, h / 2 + 18, "Frontend complete")
    canv.drawCentredString(w / 2, h / 2 - 10, "system guide")
    canv.setFont("Helvetica", 11)
    canv.setFillColor(HexColor("#C9D8D4"))
    canv.drawCentredString(
        w / 2,
        h / 2 - 32,
        "Every file, every flow, every place to change style, behavior, and APIs",
    )
    canv.setFillColor(ACCENT)
    canv.roundRect(w / 2 - 55, 42 * mm, 110, 8 * mm, 3, fill=1, stroke=0)
    canv.setFillColor(white)
    canv.setFont("Helvetica-Bold", 8)
    canv.drawCentredString(w / 2, 44.5 * mm, "Next.js 16  ·  StreamPixel  ·  Unreal Engine")
    canv.setFillColor(HexColor("#8AA8A6"))
    canv.setFont("Helvetica", 8)
    canv.drawCentredString(w / 2, 28 * mm, date.today().strftime("%d %B %Y"))
    canv.drawCentredString(w / 2, 22 * mm, "Generated from the atelier-fe-demo source tree")
    canv.restoreState()


def build():
    story = []
    # cover is drawn by onFirstPage; add a spacer page break
    story.append(Spacer(1, 200 * mm))
    story.append(PageBreak())

    # TOC
    story.append(P("Contents", "h1"))
    story.append(HRule(TEAL, 1.2, 3))
    toc = [
        "1.  What this application is",
        "2.  Product rules (locked contracts)",
        "3.  Architecture — how layers talk",
        "4.  End-to-end process (with diagrams)",
        "5.  Core features, with code examples",
        "6.  How to edit style",
        "7.  How to edit behavior",
        "8.  Future API integration (swap mock → real)",
        "9.  Data model &amp; URL contract",
        "10. Unreal Engine protocol",
        "11. File-by-file catalog",
        "12. Common recipes (copy-paste)",
        "13. Environment, scripts, and gotchas",
    ]
    for t in toc:
        story.append(P(t, "toc"))
    story.append(PageBreak())

    # 1
    story.append(P("1.  What this application is", "h1"))
    story.append(HRule(TEAL, 1.2, 3))
    story.append(P(
        "ATELIER FE (<font face='Courier'>atelier-fe</font>) is a Next.js 16 marketing + 3D apartment "
        "configurator. The marketing pages (home intro, about, projects, reference number) are mostly "
        "brand shells. The real product is <b>/configurator/[projectId]</b>: a full-viewport Pixel Streaming "
        "session (StreamPixel SDK) that talks to an Unreal Engine (UE) apartment, lets a buyer pick "
        "meshes and materials per surface (slot), persists those picks in the browser until submit, "
        "then mints a Design Code that turns the same URL into a read-only share link.",
        "body",
    ))
    story.append(P(
        "There is <b>no real backend yet</b>. Session catalog, pricing, and design storage are mocks in "
        "<font face='Courier'>src/lib/configurator/api.ts</font> plus <font face='Courier'>src/mocks/</font>. "
        "That façade is the only place you should replace when APIs land. Types stay in "
        "<font face='Courier'>src/types/configurator.ts</font>.",
        "body",
    ))
    story.append(P("Stack at a glance", "h2"))
    for b in [
        "<b>Framework:</b> Next.js 16 App Router, React 19, TypeScript. Webpack is required (not Turbopack) because StreamPixel needs Node polyfills.",
        "<b>Styling:</b> Tailwind CSS 4 + shadcn/ui tokens in <font face='Courier'>globals.css</font>. Configurator chrome uses a dedicated stylesheet <font face='Courier'>configurator.css</font> (glass panels, not Tailwind-only).",
        "<b>3D stream:</b> <font face='Courier'>streampixelsdk</font> (WebRTC). Commands go out as JSON via <font face='Courier'>emitUIInteraction</font>. Camera/zone events come back on the <font face='Courier'>cameraZone</font> listener.",
        "<b>State:</b> URL (camera/zone/level/unit/designCode), React state (UI), localStorage (draft selections). Jotai is wired globally but almost unused (page-loader atom, currently commented out).",
        "<b>Motion / scroll:</b> Motion (Framer) on the homepage. Lenis smooth-scroll on marketing pages; it is <b>stopped</b> on /configurator so the stream can fill 100% of the viewport.",
        "<b>Forms:</b> react-hook-form + zod + shadcn Field/Form exist, but the live submit modal is a simple controlled form.",
    ]:
        story.append(P("•  " + b, "bullet"))

    story.append(P("How to run it", "h2"))
    story.append(code_block("""npm run dev          # next dev --webpack   (required)
npm run build        # next build --webpack
npm start

# Open an edit session (example):
/configurator/6a427d215af97179992c7c66?unit=LO-APT-2BHK-T02&level=2BHK_Type_2_Updated&camera=4&zone=Kitchen

# View-only after submit:
...&designCode=AT-XXXXXX

# UI-only, no StreamPixel (logs UE payloads to console):
NEXT_PUBLIC_MOCK_UE=true"""))

    story.append(Callout(
        "Mental model in one sentence",
        "The URL remembers where you are looking. localStorage remembers what you picked. Unreal Engine only shows it. Submit is the first moment a Design Code exists.",
        BOX_STOR,
    ))
    story.append(Spacer(1, 8))

    # 2
    story.append(P("2.  Product rules (locked contracts)", "h1"))
    story.append(HRule(TEAL, 1.2, 3))
    story.append(P(
        "These five rules are encoded in comments, README, types, and code. Breaking them silently "
        "breaks share links and reload restore.",
        "body",
    ))
    rules = [
        ("1. Mid-edit is local only", "While the buyer is designing, selections live in the FE map + localStorage key atelier:config:{projectId}:{unitId}. There is no draft autosave API."),
        ("2. Design Code only on Submit", "submitDesign() is the first write that creates AT-XXXXXX. Until then nothing is shareable across devices."),
        ("3. designCode in the URL = VIEW_ONLY", "useShareableParams reads designCode (or legacy loadId). ConfiguratorShell sets viewOnly = Boolean(params.designCode) and hides editors."),
        ("4. Share after submit, not mid-edit", "Camera/zone/level can be in the URL during edit, but mesh/material must never be. A coworker opening the same URL mid-edit will not see your unfinished picks."),
        ("5. Stream is preview, not storage", "UE receives SetMeshByName / ApplyMaterialToMesh for live look. On reconnect, FE re-applies every stored selection. If you skip that sync, the 3D view resets to UE defaults."),
    ]
    for title, body in rules:
        story.append(P("<b>" + title + ".</b>  " + body, "bodyL"))

    story.append(P("Where each piece of state lives", "h2"))
    story.append(PersistenceDiagram())
    story.append(P("Figure 1 — Persistence split. Never put mesh/material in the query string.", "caption"))

    story.append(DualModeDiagram())
    story.append(P("Figure 2 — EDIT vs VIEW_ONLY. The presence of ?designCode= is the switch.", "caption"))

    # 3
    story.append(P("3.  Architecture — how layers talk", "h1"))
    story.append(HRule(TEAL, 1.2, 3))
    story.append(P(
        "Think of the configurator as five layers. UI never talks to StreamPixel directly. "
        "ConfiguratorShell is the orchestra conductor: it owns session/design fetching, selection "
        "handlers, and when to sync storage into UE.",
        "body",
    ))
    story.append(LayerDiagram())
    story.append(P("Figure 3 — Layer cake. Change the bottom layer (api.ts) when backends exist; change CSS at the top.", "caption"))

    story.append(P("Boot path (page → stream)", "h2"))
    story.append(Diagram([
        ("Next.js route  src/app/configurator/[projectId]/page.tsx", BOX_FILL),
        ("ConfiguratorClient  (dynamic import, ssr:false + Mixpanel mute)", BOX_FILL),
        ("ConfiguratorShell  fetches session / design, hydrates selections", BOX_STOR),
        ("useStreamPixel  →  ensureStreamPixelApplication(appId)", HexColor("#F3E8FF")),
        ("Video mounts into StreamViewport  ·  streamReady = true", BOX_UE),
        ("syncDraftToUe  applies localStorage or design finishes into UE", BOX_UE),
    ]))
    story.append(P("Figure 4 — Boot sequence. SSR is skipped because WebRTC cannot run on the server.", "caption"))

    story.append(P("Who owns what (do not mix these)", "h2"))
    story.append(file_table([
        ("configurator-shell.tsx", "Orchestration: session, handlers, layout of overlays.", "Wire new UI or new user actions."),
        ("use-stream-pixel.ts", "SDK lifecycle, loading %, AFK, mute, fullscreen.", "Connection / video / reconnect."),
        ("use-ue-interaction.ts", "Safe emitUIInteraction wrapper.", "Never call emit from a button directly."),
        ("use-selection-map.ts", "Slot → mesh/material map + persist.", "How picks are stored."),
        ("use-shareable-params.ts", "Read/write URL query.", "What belongs in a share link."),
        ("sync-to-ue.ts", "Reload restore of ALL finishes.", "Timing / retries into Blueprints."),
        ("api.ts", "Mock HTTP façade.", "Real backend swap."),
    ]))

    # 4
    story.append(PageBreak())
    story.append(P("4.  End-to-end process", "h1"))
    story.append(HRule(TEAL, 1.2, 3))

    story.append(P("4.1 Marketing → configurator", "h2"))
    story.append(P(
        "The homepage (<font face='Courier'>HomeIntro</font>) is a timed Motion sequence: teal→black, "
        "logo rise, crosshair, stars, “STEP INTO Personalized LUXURY”, then a ticket-notch CTA. "
        "The CTA currently routes to <font face='Courier'>/projects</font>, which is still a stub "
        "(“Projects”). In production you will likely deep-link straight into a unit URL.",
        "body",
    ))
    story.append(Diagram([
        ("/   HomeIntro animation  →  Start Your Experience", BOX_FILL),
        ("/projects   (stub)  or a future unit picker", BOX_FILL),
        ("/configurator/{streamProjectId}?unit=...&level=...", BOX_UE),
    ]))

    story.append(P("4.2 Session load (EDIT)", "h2"))
    story.append(P(
        "If the URL has no <font face='Courier'>unit</font> and no <font face='Courier'>designCode</font>, "
        "the shell shows: “Missing ?unit= in the URL.” Otherwise it calls "
        "<font face='Courier'>getConfiguratorSession({ unitId, streamProjectId, levelName })</font>. "
        "Today that function waits 120ms and returns <font face='Courier'>buildMockSession()</font>, "
        "which merges mesh-rules, materials map, areas, and slot labels.",
        "body",
    ))
    story.append(code_block("""// src/lib/configurator/api.ts  (MOCK — replace body later)
export async function getConfiguratorSession(args: {
  unitId: string;
  streamProjectId: string;
  levelName?: string;
}): Promise<ConfiguratorSession> {
  await delay(120);
  if (!args.unitId?.trim()) throw new ApiError("unit is required", 400);
  return buildMockSession({
    unitId: args.unitId.trim(),
    streamProjectId: args.streamProjectId,
    levelName: args.levelName,
  });
}"""))

    story.append(P("4.3 Picking a zone, camera, mesh, material", "h2"))
    story.append(P(
        "Zone chips come from <font face='Courier'>CONFIGURATOR_ZONES</font>: LivingArea, Kitchen, "
        "bedroom-1, bedroom-2, plus Free camera. Kitchen is a UI grouping — in UE those cameras "
        "(CAM-LV-KT / CAM-LV-PT) live inside the LivingArea volume, so <font face='Courier'>ueZoneName('Kitchen')</font> "
        "returns <font face='Courier'>LivingArea</font>.",
        "body",
    ))
    story.append(Diagram([
        ("Click zone chip  →  handleSelectZone(zoneId)", BOX_FILL),
        ("URL patch: zone + first camera index", BOX_URL),
        ("UE: EnterZone + GoToZone + SwitchCameraByIndex", BOX_UE),
        ("Side panel opens with cameras for that zone", BOX_FILL),
        ("Click camera  →  SwitchCameraByIndex", BOX_UE),
        ("Click mesh  →  selections.select() + localStorage", BOX_STOR),
        ("applyOneSelectionToUe  SetMeshByName then ApplyMaterialToMesh", BOX_UE),
    ]))
    story.append(P("Figure 5 — Live customization. Storage is written before (or as) UE is told.", "caption"))

    story.append(P(
        "A selection is one row per <b>slot</b> (surface), not per camera. Example: living-tv-wall can "
        "only hold one mesh+material at a time. Picking MSH-LV-TV-0004 with wallpaper MT-WP0001 stores:",
        "body",
    ))
    story.append(code_block("""{
  "slot": "living-tv-wall",
  "meshId": "MSH-LV-TV-0004",
  "materialId": "MT-WP0001",
  "cameraId": "CAM-LV-TV",
  "cameraIndex": 0
}"""))
    story.append(P(
        "<b>Why cameraIndex is stored:</b> Atelier Blueprints apply finishes in the <i>active camera "
        "context</i>. On reload, sync-to-ue switches to that index, then sets mesh/material, then "
        "restores the URL camera so the buyer is not left touring every slot.",
        "body",
    ))

    story.append(P("4.4 Reload / reconnect restore", "h2"))
    story.append(P(
        "When the stream reports ready (or after a reconnect, when <font face='Courier'>stream.isLoading</font> "
        "goes false), ConfiguratorShell calls <font face='Courier'>syncDraftToUe({ force: true })</font>. "
        "That function:",
        "body",
    ))
    for b in [
        "Waits until video.readyState >= 2 and emitUIInteraction accepts a ConfiguratorReadyProbe.",
        "Optionally LoadLevel if the URL level is not the default boot plan 2BHK_Type_2_Updated.",
        "Sends ApplyConfiguration with the full list (best-effort bulk).",
        "Then one-by-one: SwitchCameraByIndex (if stored) → SetMeshByName → ApplyMaterialToMesh (retried, even a second material pass).",
        "Finally restores URL zone/camera (or ExitCamera if free roam).",
    ]:
        story.append(P("•  " + b, "bullet"))
    story.append(P(
        "If some finishes fail, the UI shows “Could not apply all finishes” with a <b>Re-apply finishes</b> "
        "button that bumps <font face='Courier'>ueSyncNonce</font>.",
        "body",
    ))

    story.append(P("4.5 Submit → Design Code → view-only", "h2"))
    story.append(Diagram([
        ("Selections sheet  →  Submit design  →  SubmitModal (name/email/phone)", BOX_FILL),
        ("submitDesign() validates meshes/materials, recomputes price", BOX_STOR),
        ("mockGenerateDesignCode()  →  AT-9F3K2  saved in memory + atelier:designs:registry", BOX_STOR),
        ("URL gains designCode  ·  local draft cleared  ·  DesignSuccess dialog", BOX_URL),
        ("Reload with that URL  →  getDesign()  →  VIEW_ONLY banner", BOX_UE),
    ]))
    story.append(P("Figure 6 — Submit is the durability boundary.", "caption"))

    story.append(P("4.6 UE talking back (cameraZone)", "h2"))
    story.append(P(
        "When the pawn enters a volume, UE emits a JSON payload on the Pixel Streaming response "
        "channel named <font face='Courier'>cameraZone</font>. "
        "<font face='Courier'>parse-ue-response.ts</font> unwraps double-encoded strings and normalizes "
        "type/event/zone/cameras (PascalCase or camelCase). "
        "ConfiguratorShell then updates the URL zone (replace, no history spam) and highlights the chip. "
        "If the user is in free roam, the side panel stays closed.",
        "body",
    ))
    story.append(code_block("""// Typical UE → FE payload (after parse)
{
  "type": "cameraZone",
  "event": "enter",          // or "exit"
  "zone": "LivingArea",
  "cameras": [
    { "name": "CAM-LV-TV", "index": 0, "mode": "Living TVWall" }
  ]
}"""))

    # 5
    story.append(PageBreak())
    story.append(P("5.  Core features, with code examples", "h1"))
    story.append(HRule(TEAL, 1.2, 3))

    story.append(P("5.1 Pixel Streaming viewport", "h2"))
    story.append(P(
        "<font face='Courier'>StreamViewport</font> is an empty full-bleed div. The SDK’s "
        "<font face='Courier'>appStream.rootElement</font> is appended into it after video init. "
        "<font face='Courier'>fit-stream.ts</font> forces player/video CSS to cover the container and "
        "nudges Pixel Streaming’s resize helpers. Default Epic chrome (#uiFeatures) is hidden.",
        "body",
    ))
    story.append(code_block("""// use-stream-pixel.ts (simplified)
const result = await ensureStreamPixelApplication({
  appId: projectId,       // StreamPixel dashboard project id
  AutoConnect: true,
  forceTurn: true,        // helps corporate / restrictive NAT
  sfuHost: sfuHost ?? "false",
  sfuPlayer: sfuPlayer ?? "false",
});
appStream.onVideoInitialized = () => {
  container.appendChild(appStream.rootElement);
  fitStreamDom(container, appStream, pixelStreaming);
};"""))
    story.append(Callout(
        "Strict Mode / SDK singleton",
        "StreamPixel initializes once per page. ensure-application.ts caches the promise; useStreamPixel delays disconnect 100ms so React Strict Mode remounts reuse the live session instead of killing WebRTC.",
        HexColor("#F3E8FF"),
    ))
    story.append(Spacer(1, 8))

    story.append(P("5.2 Zone catalog vs mesh rules", "h2"))
    story.append(P(
        "Two catalogs must stay aligned with UE Blueprints and the ATELIER-Rules CSVs:",
        "body",
    ))
    for b in [
        "<b>zone-catalog.ts</b> — which chips exist, aliases, which cameras belong to Kitchen vs LivingArea, and the UE zone string to send.",
        "<b>mesh-rules.ts</b> — camera index + name + mode → list of mesh IDs. This is also the fallback until GET /api/configurator/mesh-rules exists.",
        "<b>materials.ts</b> — mesh ID → allowed material IDs (wood, wallpaper, parquet, etc.).",
        "<b>mocks/session.ts</b> — slotFromMeshId(), human slot labels, pricePerSqm, meshAreas (sqm) used by pricing.",
    ]:
        story.append(P("•  " + b, "bullet"))
    story.append(P(
        "If you add a bathroom zone tomorrow: add a ZoneDefinition, add CameraRule rows with indexes "
        "that match UE, add mesh IDs + materials, and add slotFromMeshId branches. The side panel "
        "will pick them up automatically via <font face='Courier'>camerasForZone()</font> and "
        "<font face='Courier'>getMeshesForCamera()</font>.",
        "body",
    ))

    story.append(P("5.3 Pricing", "h2"))
    story.append(P(
        "Optimistic price in the sheet uses <font face='Courier'>estimatePriceFromSession</font>: "
        "fixedPrice if set, else pricePerSqm × areaSqm (default area 1). On submit, "
        "<font face='Courier'>computeAuthoritativePrice</font> runs the same formula in the mock "
        "server path — the comment is explicit: never trust the client total when a real API exists.",
        "body",
    ))
    story.append(code_block("""// Oak cladding on TV wall: 85 AED/sqm × 8 sqm = 680 AED
const areaByMesh = new Map(session.meshAreas.map(a => [a.meshId, a.areaSqm]));
const mat = matById.get(sel.materialId);
total += mat.fixedPrice ?? (mat.pricePerSqm ?? 0) * (areaByMesh.get(sel.meshId) ?? 1);"""))

    story.append(P("5.4 Loading overlay &amp; AFK", "h2"))
    story.append(P(
        "Copy for connecting / reconnecting / queue lives in <font face='Courier'>loading-config.ts</font> "
        "(colors, titles, statusMessages). The overlay component is presentational. AFK is an SDK event: "
        "afkWarningActivate gives a countdown + dismissAfk callback; timeout fails the session.",
        "body",
    ))

    story.append(P("5.5 Mock UE mode", "h2"))
    story.append(P(
        "Set <font face='Courier'>NEXT_PUBLIC_MOCK_UE=true</font> (or NEXT_PUBLIC_STREAMPIXEL_MOCK). "
        "ConfiguratorShell wraps send() so payloads are console.info’d and treated as accepted. "
        "You can develop UI, localStorage, and submit without a live stream.",
        "body",
    ))

    story.append(P("5.6 Homepage brand system", "h2"))
    story.append(P(
        "Fonts are registered in root layout: General Sans (body), Libre Baskerville (small caps / CTA), "
        "Snell Roundhand (script “Personalized”), Geist (unused spare). Colors: background animation "
        "#00272D → #000, type #F5F0E8. The ticket CTA uses <font face='Courier'>.ticket-notch</font> "
        "in globals.css (radial-gradient mask punches the four corners).",
        "body",
    ))

    # 6
    story.append(PageBreak())
    story.append(P("6.  How to edit style", "h1"))
    story.append(HRule(TEAL, 1.2, 3))
    story.append(P(
        "There are two visual worlds. Do not mix them carelessly.",
        "body",
    ))

    story.append(P("6.1 Marketing pages (Tailwind + CSS variables)", "h2"))
    story.append(file_table([
        ("src/app/globals.css", "Tailwind 4 @theme tokens, :root colors, .ticket-notch, Lenis height rules.", "Brand colors, radius, fonts, homepage CTA shape."),
        ("src/app/layout.tsx", "Font CSS variables on <html>.", "Swap typefaces."),
        ("src/components/pages/homepage/home-intro.tsx", "Motion timeline, positions, delays, copy.", "Homepage animation and CTA target."),
        ("src/components/icons/*", "SVG wordmarks (Atelier, by, REEF, Star).", "Logo geometry / color via currentColor."),
        ("src/components/ui/*.tsx", "shadcn primitives (Button, Dialog, Input…).", "Reusable marketing/form controls."),
        ("src/lib/utils.ts", "cn() = clsx + tailwind-merge.", "Conditional classNames."),
    ]))
    story.append(P("Change the homepage CTA destination", "h3"))
    story.append(code_block("""// home-intro.tsx  — currently goes to /projects
onClick={() => handleNavigate("/projects")}

// Deep-link a unit instead:
onClick={() => handleNavigate(
  "/configurator/YOUR_STREAM_PROJECT_ID?unit=LO-APT-2BHK-T02&level=2BHK_Type_2_Updated"
)}"""))
    story.append(P("Change brand cream / teal", "h3"))
    story.append(code_block("""/* Most homepage colors are hardcoded in home-intro.tsx:
   #00272D  #000000  #F5F0E8
   Search that file and replace. Tokenized colors live in globals.css :root
   (--background, --foreground, --primary, --radius). */"""))
    story.append(P("Change button look (shadcn)", "h3"))
    story.append(code_block("""// src/components/ui/button.tsx
const buttonVariants = cva("...base classes...", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/80",
      // add:  atelier: "bg-[#00272D] text-[#F5F0E8] tracking-[0.22em] uppercase"
    },
  },
});"""))

    story.append(P("6.2 Configurator chrome (configurator.css)", "h2"))
    story.append(P(
        "The live product UI is <b>not</b> primarily Tailwind. Classes like "
        "<font face='Courier'>.cfg-zone-bar</font>, <font face='Courier'>.cfg-side-panel</font>, "
        "<font face='Courier'>.cfg-dock</font>, <font face='Courier'>.cfg-sheet</font>, "
        "<font face='Courier'>.cfg-glass-select</font> are defined in "
        "<font face='Courier'>src/app/configurator/configurator.css</font>. That file also locks "
        "html/body to 100% when <font face='Courier'>.configurator-active</font> is set (the layout "
        "adds that class so Lenis cannot break the stream).",
        "body",
    ))
    story.append(file_table([
        (".configurator-shell", "Fixed full viewport, black bg.", "Outer frame."),
        (".stream-viewport / video", "Absolute fill, object-fit: cover.", "How the 3D image crops."),
        (".cfg-zone-bar / .cfg-zone-chip", "Top zone navigation.", "Chip shape, active color."),
        (".cfg-side-panel", "Left glass editor.", "Width, blur, typography."),
        (".cfg-dock-wrap / .cfg-dock-btn", "Bottom toolbar.", "Dock position and buttons."),
        (".cfg-sheet", "Selections drawer.", "Sheet size / list rows."),
        (".cfg-glass-select-*", "Custom material dropdown.", "Menu blur (native select cannot)."),
        (".cfg-primary-btn / .cfg-sync-*", "Accent actions, sync overlays.", "Accent #4e9cff."),
        (".camera-zone-panel etc.", "Legacy panel styles (older UI).", "Only if you revive panels/."),
    ]))
    story.append(P("Example: make the active zone chip cream instead of default", "h3"))
    story.append(code_block("""/* src/app/configurator/configurator.css */
.cfg-zone-chip.is-active {
  background: #F5F0E8;
  color: #00272D;
  border-color: transparent;
}"""))
    story.append(P("Example: loading overlay accent", "h3"))
    story.append(code_block("""// loading-overlay.tsx bar color is Tailwind:
<div className="h-full bg-[#4e9cff] ..." />

// Copy/status strings:
// src/lib/configurator/loading-config.ts  title, subtitle, statusMessages"""))

    story.append(P("6.3 Layout / fullscreen caveats", "h2"))
    for b in [
        "Configurator layout sets html/body.configurator-active; CSS forces height 100% and overflow hidden. If the stream letterboxes, check fit-stream.ts object-fit and MatchViewportRes.",
        "Fullscreen targets the shell (not only the video) so ZoneTopBar and Dock stay visible. CSS explicitly keeps those overlays visible under :fullscreen.",
        "Do not re-enable Lenis on /configurator — LenisWrapper already returns null there.",
    ]:
        story.append(P("•  " + b, "bullet"))

    # 7
    story.append(PageBreak())
    story.append(P("7.  How to edit behavior", "h1"))
    story.append(HRule(TEAL, 1.2, 3))
    story.append(P(
        "Almost every user gesture is a handler in <font face='Courier'>configurator-shell.tsx</font>. "
        "Find the handler, then follow it into a hook or lib. Do not sprinkle emitUIInteraction in leaf components.",
        "body",
    ))
    story.append(file_table([
        ("handleSelectZone", "Enter zone, seed cameras, switch first camera, open panel.", "New rooms / different default camera."),
        ("handleFreeCamera", "ExitCamera, clear URL camera, close panel.", "Free roam UX."),
        ("handleSelectCamera", "SwitchCameraByIndex (+ ZoneName).", "Camera switching."),
        ("handleSelectMesh", "Write slot, then applyOneSelectionToUe.", "Mesh-only vs mesh+material."),
        ("handleSelectMaterial", "Update slot material + UE apply.", "Material change."),
        ("handleRemoveSelection", "Delete slot from map/storage.", "Sheet remove button."),
        ("handleReset", "clearDraft + apply defaults or ResetCustomization.", "Reset semantics."),
        ("handleSubmit", "submitDesign, clear draft, set designCode in URL.", "What happens after submit."),
        ("handleStartOwn", "Drop designCode, reset map.", "Leave view-only."),
        ("handleLoadLevel", "URL ?level=  (effect LoadLevel + re-apply).", "Floor-plan switch."),
        ("handleChangeResolution", "UIControl.setResolution.", "720p/1080p/1440p."),
        ("handleUeResponse", "Parse cameraZone, update URL/chips.", "UE → UI coupling."),
    ]))

    story.append(P("Disable editing in view-only (already done)", "h3"))
    story.append(code_block("""const viewOnly = Boolean(params.designCode);

const handleSelectMesh = (mesh) => {
  if (viewOnly) return;
  // ...
};"""))

    story.append(P("Require a material before counting a selection", "h3"))
    story.append(P(
        "Today a mesh with an empty materials list is valid (kitchen glass partitions). "
        "If product later requires a finish on every slot, reject empty materialId in "
        "<font face='Courier'>select()</font> and in <font face='Courier'>submitDesign</font> validation.",
        "body",
    ))

    story.append(P("Change retry aggressiveness into UE", "h3"))
    story.append(code_block("""// src/lib/configurator/sync-to-ue.ts  applyOne()
await sendUntilAccepted(send, payload, {
  attempts: 24,   // increase if Blueprints are slow after LoadLevel
  gapMs: 350,
  label: `SetMesh ${s.meshId}`,
});"""))

    story.append(P("Add a new UE command", "h3"))
    story.append(P(
        "1) Add a payload type in <font face='Courier'>ue-protocol.ts</font>. "
        "2) Send it through <font face='Courier'>send()</font> / <font face='Courier'>sendUEInteraction</font>. "
        "3) Confirm the Blueprint Function name matches exactly (case-sensitive).",
        "body",
    ))
    story.append(code_block("""// ue-protocol.ts
export type ResetPayload = { Function: "ResetCustomization" };

// shell
send({ Function: "ResetCustomization" });"""))

    story.append(P("Unused / legacy UI (safe to ignore unless you revive it)", "h2"))
    story.append(P(
        "These components exist but the current shell does not render them. They are earlier iterations "
        "(camera-zone-panel, pickers, control-bar, price-summary, use-customization-state). "
        "Prefer ZoneTopBar + ZoneSidePanel + Dock + SelectionsSheet.",
        "body",
    ))

    # 8
    story.append(PageBreak())
    story.append(P("8.  Future API integration", "h1"))
    story.append(HRule(TEAL, 1.2, 3))
    story.append(P(
        "The project was designed so that <b>only function bodies in api.ts change</b>. "
        "Keep signatures and the types in configurator.ts stable. UI already speaks those types.",
        "body",
    ))
    story.append(P("8.1 Endpoints to implement", "h2"))

    story.append(P("GET /api/configurator/session", "h3"))
    story.append(code_block("""// Replace getConfiguratorSession body:
export async function getConfiguratorSession(args: {
  unitId: string;
  streamProjectId: string;
  levelName?: string;
}): Promise<ConfiguratorSession> {
  const q = new URLSearchParams({
    unit: args.unitId,
    streamProjectId: args.streamProjectId,
    ...(args.levelName ? { level: args.levelName } : {}),
  });
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/configurator/session?${q}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  return res.json(); // must match ConfiguratorSession
}"""))
    story.append(P(
        "Response must include: streamProjectId, unitId, levelName, cameras[], meshes[], materials[], "
        "materialsByMesh, meshAreas[], slotLabels, optional defaults[]. Camera indexes must match UE.",
        "body",
    ))

    story.append(P("GET /api/configurator/designs/:designCode", "h3"))
    story.append(code_block("""export async function getDesign(designCode: string): Promise<StoredDesign> {
  const code = designCode.trim().toUpperCase();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/configurator/designs/${code}`,
  );
  if (res.status === 404) throw new ApiError("Design not found", 404);
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  return res.json();
}"""))

    story.append(P("POST /api/configurator/designs", "h3"))
    story.append(code_block("""export async function submitDesign(args): Promise<SubmitDesignResult> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/configurator/designs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      streamProjectId: args.streamProjectId,
      unitId: args.unitId,
      configuration: args.configuration, // { version:1, levelName, selections[] }
      contact: args.contact,             // { name, email, phone }
      // Do NOT send client price — server recomputes
    }),
  });
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  return res.json(); // { designCode, shareUrl, price, currency }
}"""))

    story.append(P("8.2 Optional later endpoints (already noted in source comments)", "h2"))
    for b in [
        "GET /api/configurator/mesh-rules?unit=&amp;level=  →  replace DEFAULT_MESH_RULES.",
        "GET /api/configurator/materials?meshId=  or  /materials-map?unit=  →  replace MESH_MATERIALS.",
        "Do <b>not</b> add a draft autosave API unless product explicitly changes rule 1.",
    ]:
        story.append(P("•  " + b, "bullet"))

    story.append(P("8.3 Axios vs fetch", "h2"))
    story.append(P(
        "axios is in package.json but unused. Either fetch (as above) or introduce a single "
        "<font face='Courier'>src/lib/http.ts</font> wrapper that injects TOKEN / BASE_URL from "
        "<font face='Courier'>.env</font>. Root <font face='Courier'>.env.example</font> already lists "
        "NEXT_PUBLIC_BASE_URL, NEXT_PUBLIC_MEDIA_URL, BASE_URL, TOKEN.",
        "body",
    ))

    story.append(P("8.4 What the backend must return for a session (shape)", "h2"))
    story.append(code_block("""{
  "streamProjectId": "6a427d215af97179992c7c66",
  "unitId": "LO-APT-2BHK-T02",
  "levelName": "2BHK_Type_2_Updated",
  "cameras": [
    { "index": 0, "name": "CAM-LV-TV", "mode": "Living TVWall",
      "meshIds": ["MSH-LV-TV-0001","MSH-LV-TV-0002"], "slot": "living-tv-wall" }
  ],
  "meshes": [{ "id": "MSH-LV-TV-0002", "displayName": "TV Wall Wood", "slot": "living-tv-wall" }],
  "materials": [{ "id": "MT-TW0001", "displayName": "Oak Cladding",
                  "category": "wood", "pricePerSqm": 85 }],
  "materialsByMesh": { "MSH-LV-TV-0002": ["MT-TW0001", "MT-TW0002"] },
  "meshAreas": [{ "meshId": "MSH-LV-TV-0002", "areaSqm": 8 }],
  "slotLabels": { "living-tv-wall": "TV Wall" },
  "defaults": []
}"""))

    # 9
    story.append(P("9.  Data model &amp; URL contract", "h1"))
    story.append(HRule(TEAL, 1.2, 3))
    story.append(P("Shareable query keys", "h2"))
    story.append(file_table([
        ("projectId", "Path param — StreamPixel appId.", "Which stream to connect."),
        ("unit", "Required for EDIT.", "Which apartment catalog."),
        ("level", "UE LoadLevel name.", "Floor plan."),
        ("camera", "Numeric UE index.", "Locked camera; omit = free roam."),
        ("zone", "UE / catalog zone string.", "Chip highlight + EnterZone."),
        ("designCode", "AT-XXXXXX.", "Turns page VIEW_ONLY."),
        ("streamerId / sfuHost / sfuPlayer", "StreamPixel extras.", "Advanced streaming."),
        ("mesh / material", "STRIPPED if present.", "Legacy — never restore."),
    ]))
    story.append(P("localStorage keys", "h2"))
    story.append(code_block("""atelier:config:{streamProjectId}:{unitId}
  → LocalDraft { version:1, levelName, selections[], updatedAt }

atelier:designs:registry
  → { "AT-9F3K2": StoredDesign, ... }   // mock only, until real GET design"""))

    story.append(P("SelectionMap vs SelectionEntry[]", "h2"))
    story.append(P(
        "UI thinks in a map keyed by slot (easy overwrite). Storage and submit think in an array. "
        "<font face='Courier'>selectionsToMap</font> / <font face='Courier'>mapToSelections</font> convert. "
        "Empty materialId means “mesh only”.",
        "body",
    ))

    # 10
    story.append(P("10. Unreal Engine protocol", "h1"))
    story.append(HRule(TEAL, 1.2, 3))
    story.append(P(
        "Single source of Function names: <font face='Courier'>src/lib/stream-pixel/ue-protocol.ts</font>. "
        "UE Blueprints must expose the same names via Pixel Streaming UI interaction.",
        "body",
    ))
    story.append(file_table([
        ("SwitchCameraByIndex", "{ Index, ZoneName? }", "Lock pawn to a camera."),
        ("ExitCamera", "{}", "Free roam."),
        ("SetMeshByName", "{ MeshName, Slot?, CameraName? }", "Swap geometry on a slot."),
        ("ApplyMaterialToMesh", "{ MeshName, MaterialName, Slot? }", "Apply finish."),
        ("LoadLevel", "{ LevelName }", "Change apartment plan."),
        ("EnterZone / GoToZone / …", "{ ZoneName }", "Teleport probes (best-effort)."),
        ("ApplyConfiguration", "{ Selections: [...] }", "Bulk apply (if Blueprint exists)."),
        ("SaveCustomization / LoadCustomization", "UnitId / LoadID", "Defined, not the FE draft path."),
        ("ResetCustomization", "{}", "Used when no catalog defaults."),
        ("ConfiguratorReadyProbe", "{}", "FE-only probe: emit accepted?"),
        ("SwitchCameraByName", "{ CameraName, Mode? }", "Fallback if index missing."),
    ]))
    story.append(P(
        "Numeric Index is coerced from strings in useUeInteraction because UE is picky about types. "
        "If emitUIInteraction returns false, the video is not ready — sendUntilAccepted retries.",
        "body",
    ))

    # 11 File catalog
    story.append(PageBreak())
    story.append(P("11. File-by-file catalog", "h1"))
    story.append(HRule(TEAL, 1.2, 3))
    story.append(P(
        "Every application source file (excluding node_modules, .next, lockfiles). Use this as the map "
        "when you need to change something and do not remember where it lives.",
        "body",
    ))

    story.append(P("11.1 Root config", "h2"))
    story.append(file_table([
        ("package.json", "Scripts and dependencies. Webpack flags on dev/build.", "Add packages; keep --webpack."),
        ("package-lock.json", "Locked versions.", "Do not hand-edit."),
        ("next.config.ts", "transpile streampixelsdk + Node polyfills (crypto, stream, buffer…).", "SDK/webpack issues."),
        ("tsconfig.json", "strict TS, @/* → src/*.", "Path aliases."),
        ("postcss.config.mjs", "Tailwind 4 PostCSS plugin.", "CSS pipeline."),
        ("eslint.config.mjs", "Next core-web-vitals + TS.", "Lint rules."),
        ("components.json", "shadcn config (style, aliases).", "Adding shadcn components."),
        ("next-env.d.ts", "Next generated types.", "Do not edit."),
        (".env / .env.example", "BASE_URL, TOKEN, public URLs.", "API hosts. Never commit secrets."),
        (".gitignore", "Ignores .env, .next, node_modules.", "Keep .env ignored."),
        ("README.md", "Default create-next-app readme.", "Prefer configurator/README.md."),
        ("src/app/configurator/README.md", "Product contract for the configurator.", "Onboarding."),
    ]))

    story.append(P("11.2 App routes", "h2"))
    story.append(file_table([
        ("src/app/layout.tsx", "Root HTML, fonts, Jotai, Lenis, ScrollToTop.", "Global providers / fonts."),
        ("src/app/globals.css", "Design tokens + homepage utilities.", "Brand CSS."),
        ("src/app/page.tsx", "Renders HomeIntro.", "Homepage entry."),
        ("src/app/about/page.tsx", "Stub “About”.", "About content."),
        ("src/app/projects/page.tsx", "Stub “Projects”.", "Project listing / unit picker."),
        ("src/app/reference-number/page.tsx", "Stub “Reference Number”.", "Likely designCode lookup UI."),
        ("src/app/favicon.ico", "Tab icon.", "Brand favicon."),
        ("src/app/fonts/GeneralSans-Variable.woff2", "Body font.", "Typography."),
        ("src/app/fonts/SnellRoundhand.woff2", "Script headline font.", "Typography."),
        ("src/app/configurator/layout.tsx", "Adds configurator-active; imports CSS.", "Viewport lock."),
        ("src/app/configurator/configurator.css", "All stream UI chrome + video fill.", "Configurator look."),
        ("src/app/configurator/[projectId]/page.tsx", "SSR page, metadata noindex, passes projectId.", "SEO / route."),
        ("src/app/configurator/[projectId]/configurator-client.tsx", "Client boundary, dynamic(ssr:false) shell.", "SDK must stay client-only."),
    ]))

    story.append(P("11.3 Configurator components (current UI)", "h2"))
    story.append(file_table([
        ("configurator-shell.tsx", "God-component: data + handlers + composition.", "Behavior orchestration."),
        ("stream-viewport.tsx", "DOM mount point for WebRTC video.", "Test id stream-viewport."),
        ("loading-overlay.tsx", "Title / subtitle / progress bar.", "Loading visuals."),
        ("zone-top-bar.tsx", "Zone chips + Free camera.", "Top nav labels."),
        ("zone-side-panel.tsx", "Cameras, meshes, GlassSelect materials.", "Editor UX."),
        ("glass-select.tsx", "Custom glass dropdown.", "Material picker chrome."),
        ("configurator-dock.tsx", "Selections / Reset / Saved / Fullscreen / Settings.", "Toolbar."),
        ("selections-sheet.tsx", "List slots, remove, estimate, submit CTA.", "Cart of finishes."),
        ("submit-modal.tsx", "Name, email, phone portal dialog.", "Lead capture."),
        ("design-success.tsx", "Shows AT- code, price, copy share URL.", "Post-submit."),
        ("view-only-banner.tsx", "Read-only chip + Start my own design.", "Share mode."),
    ]))

    story.append(P("11.4 Configurator components (legacy / unused by shell)", "h2"))
    story.append(file_table([
        ("control-bar.tsx", "Mute / fullscreen / toggle camera panel (old).", "Revive mute in dock if needed."),
        ("price-summary.tsx", "Floating estimate card (old).", "Alternative to sheet footer."),
        ("panels/camera-zone-panel.tsx", "Combined portal panel with pickers.", "Old editor."),
        ("panels/level-picker.tsx", "List of level names.", "Used by old panel."),
        ("panels/mesh-picker.tsx", "Mesh buttons.", "Used by old panel."),
        ("panels/material-picker.tsx", "Material buttons.", "Used by old panel."),
        ("panels/save-load-panel.tsx", "UE Save/Load IDs.", "Not the localStorage draft."),
        ("panels/settings-panel.tsx", "Resolution / hover mouse.", "Superseded by dock settings."),
        ("panels/stats-panel.tsx", "Stream stats popup.", "Dev diagnostics."),
        ("panels/dev-tools-panel.tsx", "Raw JSON emit for engineers.", "Enable with SHOW_DEV_TOOLS."),
    ]))

    story.append(P("11.5 Hooks", "h2"))
    story.append(file_table([
        ("use-stream-pixel.ts", "Connect, events, AFK, mute, fullscreen, refit.", "Streaming robustness."),
        ("use-ue-interaction.ts", "Typed, numeric-safe emit with throttled warnings.", "All UE sends."),
        ("use-shareable-params.ts", "URL read/write; strips mesh/material.", "Share contract."),
        ("use-selection-map.ts", "Hydrate/persist/select/reset/price.", "Draft behavior."),
        ("use-camera-zone.ts", "Live cameras from UE + hydrateFromShare.", "Zone UI state."),
        ("use-customization-state.ts", "Old per-camera mesh memory.", "Unused by current shell."),
    ]))

    story.append(P("11.6 Configurator lib", "h2"))
    story.append(file_table([
        ("api.ts", "getConfiguratorSession, getDesign, submitDesign, ApiError.", "REAL HTTP goes here."),
        ("storage.ts", "Draft CRUD, memory fallback, map converters.", "localStorage key/format."),
        ("sync-to-ue.ts", "Full restore pipeline + cache invalidation.", "Reload apply."),
        ("apply-ue.ts", "applyOne / applySelections / restoreCameraZone.", "Live pick apply."),
        ("pricing.ts", "Optimistic + authoritative (mock same formula).", "Price math."),
        ("mesh-rules.ts", "DEFAULT_MESH_RULES + getMeshesForCamera.", "Camera→meshes."),
        ("materials.ts", "MESH_MATERIALS + getMaterialsForMesh.", "Mesh→materials."),
        ("zone-catalog.ts", "Zones, aliases, Kitchen/Living mapping.", "Top bar rooms."),
        ("url-params.ts", "normalizeZone, zoneUrlPatch.", "URL hygiene."),
        ("loading-config.ts", "Loading copy and colors.", "Connecting UX."),
        ("resolve-camera-index.ts", "Infer cameraIndex for a selection.", "Restore targeting."),
    ]))

    story.append(P("11.7 StreamPixel helpers", "h2"))
    story.append(file_table([
        ("ensure-application.ts", "Singleton StreamPixelApplication cache.", "Double-init / Strict Mode."),
        ("fit-stream.ts", "CSS fill + resizePlayerStyle + fullscreen helpers.", "Letterboxing."),
        ("parse-ue-response.ts", "cameraZone JSON unwrap.", "UE event shape."),
        ("share-restore.ts", "sendUntilAccepted, probeEnterZone, delay.", "Retry primitives."),
        ("suppress-sdk-noise.ts", "Hides Mixpanel CORS console.error.", "Dev overlay noise."),
        ("ue-protocol.ts", "Payload TypeScript contract.", "Blueprint names."),
        ("types.ts", "SDK-shaped types + RESOLUTION_OPTIONS.", "Resolution list."),
        ("src/types/streampixelsdk.d.ts", "Ambient module types for untyped SDK.", "SDK API surface."),
    ]))

    story.append(P("11.8 Mocks, types, state, marketing, UI kit", "h2"))
    story.append(file_table([
        ("mocks/session.ts", "buildMockSession, slotFromMeshId, labels, areas, prices.", "Demo catalog."),
        ("mocks/designs-store.ts", "In-memory + registry Design Codes.", "Demo submit/get."),
        ("types/configurator.ts", "All domain types (session, draft, design…).", "API contract."),
        ("lib/jotai-provider.tsx", "Jotai Provider + DevTools in development.", "Global store."),
        ("atoms/page-loader-atom.tsx", "pageLoaderDoneAtom (loader currently off).", "Intro loader flag."),
        ("context/lenis-wrapper.tsx", "Smooth scroll except /configurator.", "Scroll feel."),
        ("components/shared/scroll-to-top.tsx", "Reset scroll on route change.", "Navigation."),
        ("components/layout/page-loader/*", "Full-screen branded loader (commented out in layout).", "Intro loader."),
        ("components/pages/homepage/home-intro.tsx", "Animated landing.", "First impression."),
        ("components/icons/*", "AtelierLogo, ByWord, ReefWord, Star.", "Brand marks."),
        ("constants/countries-data.ts", "Country list for phone input.", "Phone field."),
        ("components/ui/*", "shadcn: accordion, button, carousel, command, dialog, field, form, input, input-group, label, phone-input, popover, scroll-area, select, separator, textarea.", "Design-system controls."),
        ("public/*", "Default Next SVGs + Pattern.png.", "Static assets."),
        (".vscode/settings.json", "Editor settings.", "Local DX."),
    ]))

    # 12 recipes
    story.append(PageBreak())
    story.append(P("12. Common recipes", "h1"))
    story.append(HRule(TEAL, 1.2, 3))

    story.append(P("Add a new zone (e.g. Bathroom)", "h2"))
    story.append(code_block("""// 1) zone-catalog.ts
{
  id: "bathroom-1",
  label: "Bathroom 01",
  ueZone: "bathroom-1",
  aliases: ["bath", "bathroom", "br-bath"],
  cameras: [{ name: "CAM-BA-01-FL", mode: "Bathroom 01 Floor" }],
}

// 2) mesh-rules.ts  — camera index MUST match UE
{ index: 20, name: "CAM-BA-01-FL", mode: "Bathroom 01 Floor",
  meshIds: ["MSH-BA-01-FL-0001", "MSH-BA-01-FL-0002"] }

// 3) materials.ts
"MSH-BA-01-FL-0001": ["MT-FL0006", "MT-FL0007"],

// 4) mocks/session.ts  slotFromMeshId + SLOT_LABELS + DEFAULT_MESH_AREAS
if (meshId.startsWith("MSH-BA-01-FL")) return "bathroom-01-floor";"""))

    story.append(P("Change default apartment level", "h2"))
    story.append(code_block("""// sync-to-ue.ts and configurator-shell.tsx both hardcode:
const defaultBoot = "2BHK_Type_2_Updated";
// If UE boots a different map, change BOTH so LoadLevel is not skipped incorrectly."""))

    story.append(P("Look up a design from the Reference Number page", "h2"))
    story.append(code_block("""// src/app/reference-number/page.tsx  (today a stub)
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Page() {
  const [code, setCode] = useState("");
  const router = useRouter();
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const c = code.trim().toUpperCase();
      router.push(
        `/configurator/YOUR_PROJECT_ID?unit=LO-APT-2BHK-T02&designCode=${c}`
      );
    }}>
      <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="AT-XXXXXX" />
      <button type="submit">Open design</button>
    </form>
  );
}"""))

    story.append(P("Show material thumbnails", "h2"))
    story.append(P(
        "MaterialOption already has optional thumbnailUrl. When the API fills it, extend GlassSelect "
        "options to render an &lt;img&gt; beside the label. Until then displayName is enough.",
        "body",
    ))

    story.append(P("Enable StreamPixel DevTools on window", "h2"))
    story.append(code_block("""# .env.local
NEXT_PUBLIC_SHOW_DEV_TOOLS=true
# Exposes window.pixelStreaming / window.appStream for console experiments."""))

    # 13
    story.append(P("13. Environment, scripts, and gotchas", "h1"))
    story.append(HRule(TEAL, 1.2, 3))
    story.append(P("Environment variables", "h2"))
    story.append(file_table([
        ("NEXT_PUBLIC_BASE_URL", "Public API origin for future fetch.", "Browser-safe."),
        ("NEXT_PUBLIC_MEDIA_URL", "CDN for thumbnails later.", "Images."),
        ("BASE_URL / TOKEN", "Server-only (if you add Route Handlers).", "Do not prefix NEXT_PUBLIC unless you want it in the bundle."),
        ("NEXT_PUBLIC_MOCK_UE", "true = no stream, console UE.", "UI development."),
        ("NEXT_PUBLIC_STREAMPIXEL_MOCK", "Alias of MOCK_UE.", "Same."),
        ("NEXT_PUBLIC_SHOW_DEV_TOOLS", "window.pixelStreaming.", "Debug."),
    ]))
    story.append(P("Gotchas that already bit this codebase", "h2"))
    for b in [
        "<b>Turbopack vs webpack:</b> next.config.ts webpack polyfills do nothing under Turbopack. Scripts must pass --webpack.",
        "<b>SDK initializes once:</b> changing projectId without a full reload fails. Cache returns {} and UI shows Connection Failed.",
        "<b>Mixpanel noise:</b> ad blockers make the SDK log “Bad HTTP status: 0”. suppressStreamPixelConsoleNoise filters that so Next’s error overlay stays usable.",
        "<b>Lenis vs 100vh:</b> html.lenis body { height: auto } breaks the stream. configurator-active + LenisWrapper null on that route fix it.",
        "<b>Kitchen vs LivingArea:</b> UI keeps the Kitchen chip even if UE reports LivingArea, unless the user is in free roam.",
        "<b>Quota / private mode:</b> storage falls back to an in-memory map and shows a warning; drafts will not survive refresh.",
        "<b>Submit validation:</b> at least one selection; email regex; mesh/material must exist in session; material must be allowed on that mesh.",
        "<b>Page loader:</b> PageLoaderWrapper is commented out in layout; HomeIntro currently is the branded entry.",
        "<b>Jotai DevTools</b> render in development (bottom-right). Ignore unless you start using atoms for configurator state (today you should not — URL + localStorage are the sources of truth).",
    ]:
        story.append(P("•  " + b, "bullet"))

    story.append(P("Suggested reading order for a new engineer", "h2"))
    story.append(Diagram([
        ("src/app/configurator/README.md  (product rules)", BOX_STOR),
        ("src/types/configurator.ts  (shapes)", BOX_FILL),
        ("configurator-shell.tsx  (handlers, composition)", BOX_FILL),
        ("use-selection-map + storage + api  (data)", BOX_STOR),
        ("use-stream-pixel + ue-protocol + sync-to-ue  (3D)", BOX_UE),
        ("configurator.css + zone-catalog  (what you see)", BOX_URL),
    ]))

    story.append(Spacer(1, 10))
    story.append(Callout(
        "If you remember only one thing",
        "Change look in configurator.css or HomeIntro. Change user flows in configurator-shell handlers. Change durability in storage.ts. Change backends only in api.ts. Talk to Unreal only through useUeInteraction + ue-protocol.ts.",
        BOX_FILL,
    ))

    story.append(Spacer(1, 16))
    story.append(P(
        "This guide was generated from the atelier-fe-demo tree as of the document date. If files move, "
        "re-run the generator or treat the catalog as a snapshot and trust the source.",
        "small",
    ))

    doc = SimpleDocTemplate(
        OUT,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=20 * mm,
        bottomMargin=16 * mm,
        title="ATELIER Frontend Complete System Guide",
        author="ATELIER engineering",
        subject="File-by-file architecture, flows, style, behavior, and API swap guide",
    )
    doc.build(story, onFirstPage=draw_cover, onLaterPages=add_header_footer)
    print("Wrote", OUT)


if __name__ == "__main__":
    build()
