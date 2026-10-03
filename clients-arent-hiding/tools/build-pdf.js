/**
 * Build the print edition of "Clients Aren't Hiding" from index.html.
 *
 * Usage (from this folder):
 *   npm i pdfkit cheerio       # in any scratch folder, or globally
 *   node tools/build-pdf.js
 *
 * The script reads index.html, walks the semantic structure of the book and
 * typesets it into Clients-Arent-Hiding.pdf. It deliberately avoids a headless
 * browser so the PDF can be rebuilt in minimal environments.
 */
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const cheerio = require('cheerio');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'Clients-Arent-Hiding.pdf');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const $ = cheerio.load(html);
$('br').replaceWith(' ');

const INK = '#111b24';
const MUTED = '#5f6b78';
const ORANGE = '#e2642a';
const GOLD = '#f0a830';
const NAVY = '#0d1117';
const TEAL = '#13605c';
const LINE = '#d9d2c6';
const PAPER = '#f4f1ea';

const M = 64;                 // page margin
const doc = new PDFDocument({ size: 'A4', margins: { top: M, bottom: 70, left: M, right: M }, bufferPages: true, autoFirstPage: false });
doc.pipe(fs.createWriteStream(OUT));
const W = doc.page ? 0 : 595.28 - M * 2; // A4 width minus margins
const CW = 595.28 - M * 2;
const PH = 841.89;

const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
const txt = (el) => clean($(el).text());

let sectionLabel = '';
function newPage() {
  doc.addPage();
  footer();
}
function footer() {
  const y = PH - 48;
  const keep = doc.page.margins.bottom;
  doc.page.margins.bottom = 0; // allow drawing in the footer strip
  doc.save();
  doc.strokeColor(LINE).lineWidth(0.5).moveTo(M, y - 10).lineTo(595.28 - M, y - 10).stroke();
  doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
    .text(sectionLabel.toUpperCase(), M, y, { width: CW / 2, lineBreak: false });
  doc.text('CLIENTS AREN\u2019T HIDING', M + CW / 2, y, { width: CW / 2, align: 'right', lineBreak: false });
  doc.restore();
  doc.page.margins.bottom = keep;
  doc.y = M;
}
function space(n) { doc.y += n; }
function room(need) {
  if (doc.y + need > PH - 80) { newPage(); return true; }
  return false;
}

/* ---------- primitive writers ---------- */
function para(t, opts = {}) {
  const size = opts.size || 10.5;
  doc.font(opts.font || 'Helvetica').fontSize(size).fillColor(opts.color || INK);
  const h = doc.heightOfString(t, { width: opts.width || CW, lineGap: opts.lineGap ?? 3.2 });
  room(Math.min(h, 120));
  doc.text(t, opts.x || M, doc.y, { width: opts.width || CW, lineGap: opts.lineGap ?? 3.2, align: opts.align || 'left' });
  space(opts.after ?? 9);
}
function h3(t) {
  room(60);
  space(8);
  doc.font('Times-Bold').fontSize(15).fillColor(INK).text(t, M, doc.y, { width: CW });
  space(7);
}
function label(t, color = ORANGE) {
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(color)
    .text(t.toUpperCase(), M, doc.y, { width: CW, characterSpacing: 1.6 });
  space(5);
}
function rule() { doc.strokeColor(LINE).lineWidth(0.6).moveTo(M, doc.y).lineTo(M + CW, doc.y).stroke(); space(14); }

/** measure+draw a boxed block. render(y, innerWidth) returns consumed height. */
function box(render, { bg, border, accent, pad = 16 } = {}) {
  const innerW = CW - pad * 2;
  // measure on a throwaway pass
  const startY = doc.y;
  const probe = render(null, innerW, true);
  room(Math.min(probe + pad * 2 + 10, 420));
  const y0 = doc.y;
  const h = probe + pad * 2;
  if (bg) doc.save().rect(M, y0, CW, h).fill(bg).restore();
  if (border) doc.save().rect(M, y0, CW, h).lineWidth(0.8).stroke(border).restore();
  if (accent) doc.save().rect(M, y0, 3.5, h).fill(accent).restore();
  doc.y = y0 + pad;
  render(doc.y, innerW, false);
  doc.y = y0 + h + 16;
}

function measureText(t, font, size, width, lineGap = 3) {
  doc.font(font).fontSize(size);
  return doc.heightOfString(t, { width, lineGap });
}
function drawText(t, x, y, font, size, color, width, lineGap = 3) {
  doc.font(font).fontSize(size).fillColor(color).text(t, x, y, { width, lineGap });
  return doc.y;
}

/* ---------- cover ---------- */
doc.addPage();
const cover = path.join(ROOT, 'assets', 'cover-hero.jpg');
doc.save();
doc.rect(0, 0, 595.28, PH).fill(NAVY);
if (fs.existsSync(cover)) {
  doc.image(cover, 0, 0, { cover: [595.28, PH], align: 'center', valign: 'center' });
  doc.rect(0, 0, 595.28, PH).fillOpacity(0.62).fill(NAVY).fillOpacity(1);
}
doc.restore();
doc.font('Helvetica-Bold').fontSize(8.5).fillColor(GOLD)
  .text('A FIELD MANUAL FOR GETTING HIRED', M, 150, { characterSpacing: 2.4 });
doc.font('Times-Bold').fontSize(56).fillColor('#ffffff').text('Clients', M, 200);
doc.text('Aren\u2019t', M, doc.y - 10);
doc.font('Times-BoldItalic').fillColor(GOLD).text('Hiding', M, doc.y - 10);
doc.moveTo(M, doc.y + 18).lineTo(M + 90, doc.y + 18).lineWidth(3).stroke(ORANGE);
doc.font('Times-Roman').fontSize(19).fillColor('#ffffff')
  .text('How to Find Them, Pitch Them,\nand Land the Work', M, doc.y + 34, { lineGap: 4 });
doc.font('Helvetica').fontSize(10).fillColor('#cfd6de')
  .text('Cold pitches  \u00b7  Remote jobs  \u00b7  Internships  \u00b7  Freelance clients', M, doc.y + 22);
doc.font('Times-Italic').fontSize(13).fillColor('#ffffff')
  .text('\u201cClients aren\u2019t hiding. Most people just don\u2019t know where to look.\u201d', M, PH - 150, { width: CW - 40 });

/* ---------- contents ---------- */
sectionLabel = 'Contents';
newPage();
doc.font('Helvetica-Bold').fontSize(8).fillColor(ORANGE).text('INSIDE THIS MANUAL', M, doc.y, { characterSpacing: 2 });
space(12);
doc.font('Times-Bold').fontSize(30).fillColor(INK).text('Contents', M, doc.y);
space(22);
$('.toc ol li a').each((_, a) => {
  const n = clean($(a).find('span').text());
  const t = clean($(a).find('b').text());
  const s = clean($(a).find('small').text());
  const y = doc.y;
  doc.font('Helvetica-Bold').fontSize(10).fillColor(ORANGE).text(n, M, y + 2, { width: 34 });
  doc.font('Times-Bold').fontSize(14).fillColor(INK).text(t, M + 36, y, { width: CW - 36 });
  doc.font('Helvetica').fontSize(9.5).fillColor(MUTED).text(s, M + 36, doc.y + 1, { width: CW - 36 });
  space(10);
  doc.strokeColor(LINE).lineWidth(0.5).moveTo(M, doc.y).lineTo(M + CW, doc.y).stroke();
  space(10);
});

/* welcome */
space(10);
doc.font('Times-BoldItalic').fontSize(18).fillColor(INK).text('The work was always there.', M, doc.y, { width: CW });
space(10);
$('.welcome-grid > div > p').each((_, p) => para(txt(p), { color: MUTED }));

/* ---------- chapters ---------- */
const renderers = {
  'stat-row': (el) => {
    box((y, iw, probe) => {
      let yy = (y || doc.y);
      let h = 0;
      $(el).children('div').each((i, d) => {
        const b = txt($(d).find('b'));
        const s = txt($(d).find('span'));
        const bh = measureText(b, 'Times-Bold', 17, iw);
        const sh = measureText(s, 'Helvetica', 9.5, iw);
        if (!probe) {
          drawText(b, M + 16, yy, 'Times-Bold', 17, ORANGE, iw);
          drawText(s, M + 16, yy + bh + 2, 'Helvetica', 9.5, MUTED, iw);
        }
        const blockH = bh + sh + (i === $(el).children('div').length - 1 ? 0 : 14);
        yy += blockH; h += blockH;
      });
      return h;
    }, { bg: '#ffffff', border: LINE, accent: ORANGE });
  },
  'action-box': (el) => {
    const light = $(el).hasClass('light');
    box((y, iw, probe) => {
      let yy = y || doc.y, h = 0;
      const lab = txt($(el).find('.mini-label'));
      const head = txt($(el).find('h3'));
      const body = txt($(el).find('p').last());
      const lh = measureText(lab.toUpperCase(), 'Helvetica-Bold', 7.5, iw);
      const hh = measureText(head, 'Times-Bold', 17, iw);
      const bh = measureText(body, 'Helvetica', 10.5, iw, 3.2);
      if (!probe) {
        drawText(lab.toUpperCase(), M + 18, yy, 'Helvetica-Bold', 7.5, GOLD, iw);
        drawText(head, M + 18, yy + lh + 4, 'Times-Bold', 17, light ? INK : '#ffffff', iw);
        drawText(body, M + 18, yy + lh + hh + 8, 'Helvetica', 10.5, light ? MUTED : '#d7dde5', iw, 3.2);
      }
      h = lh + hh + bh + 12;
      return h;
    }, { bg: light ? '#ffffff' : NAVY, accent: light ? ORANGE : GOLD, pad: 18 });
  },
  'ground': (el) => {
    $(el).children('article').each((_, a) => {
      const n = txt($(a).find('.num'));
      const t = txt($(a).find('h3'));
      const ps = $(a).find('p').toArray();
      room(90);
      const y = doc.y;
      doc.font('Helvetica-Bold').fontSize(9).fillColor(ORANGE).text(n, M, y + 3, { width: 30 });
      doc.font('Times-Bold').fontSize(14).fillColor(INK).text(t, M + 30, y, { width: CW - 30 });
      space(4);
      ps.forEach((p) => {
        const isTell = $(p).hasClass('tell');
        para(txt(p), { x: M + 30, width: CW - 30, size: isTell ? 9.8 : 10.3, color: isTell ? INK : MUTED, after: 6 });
      });
      space(6);
      rule();
    });
  },
  'two-cards': (el) => {
    $(el).children('section').each((_, s) => {
      box((y, iw, probe) => {
        let yy = y || doc.y;
        const t = txt($(s).find('h3'));
        const p = txt($(s).find('p'));
        const b = txt($(s).find('b'));
        const th = measureText(t, 'Times-Bold', 14, iw);
        const ph = measureText(p, 'Helvetica', 10.3, iw, 3);
        const bh = measureText(b, 'Helvetica-Bold', 9.5, iw);
        if (!probe) {
          drawText(t, M + 16, yy, 'Times-Bold', 14, INK, iw);
          drawText(p, M + 16, yy + th + 4, 'Helvetica', 10.3, MUTED, iw, 3);
          drawText(b, M + 16, yy + th + ph + 10, 'Helvetica-Bold', 9.5, ORANGE, iw);
        }
        return th + ph + bh + 14;
      }, { bg: '#ffffff', border: LINE });
    });
  },
  'tiers': (el) => renderers['two-cards'](el),
  'formula': (el) => {
    const parts = $(el).children().toArray().map((c) => txt(c)).filter(Boolean);
    box((y, iw, probe) => {
      const t = parts.join('  ');
      const h = measureText(t, 'Helvetica-Bold', 11, iw);
      if (!probe) drawText(t, M + 16, y, 'Helvetica-Bold', 11, INK, iw);
      return h;
    }, { bg: '#ffffff', border: ORANGE });
  },
  'steps': (el) => {
    $(el).children('section').each((_, s) => {
      const n = txt($(s).find('> span'));
      const t = txt($(s).find('h3'));
      const p = txt($(s).find('p'));
      room(80);
      const y = doc.y;
      doc.font('Times-Bold').fontSize(20).fillColor('#e4ded2').text(n, M, y - 2, { width: 36 });
      doc.font('Times-Bold').fontSize(13.5).fillColor(INK).text(t, M + 40, y, { width: CW - 40 });
      space(3);
      para(p, { x: M + 40, width: CW - 40, color: MUTED, size: 10.3, after: 12 });
    });
    space(4);
  },
  'score-grid': (el) => {
    $(el).children('div').each((_, d) => {
      const b = txt($(d).find('b'));
      const s = txt($(d).find('span'));
      room(40);
      const y = doc.y;
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(ORANGE).text(b, M, y + 1, { width: 52 });
      doc.font('Helvetica').fontSize(10.3).fillColor(MUTED).text(s, M + 56, y, { width: CW - 56, lineGap: 2.5 });
      space(9);
    });
    space(6);
  },
  'sequence': (el) => renderers['score-grid'](el),
  'objections': (el) => {
    $(el).children('div').each((_, d) => {
      const b = txt($(d).find('b'));
      const p = txt($(d).find('p'));
      box((y, iw, probe) => {
        const bh = measureText(b, 'Times-Bold', 13, iw);
        const ph = measureText(p, 'Helvetica', 10.3, iw, 3);
        if (!probe) {
          drawText(b, M + 16, y, 'Times-Bold', 13, INK, iw);
          drawText(p, M + 16, y + bh + 4, 'Helvetica', 10.3, MUTED, iw, 3);
        }
        return bh + ph + 6;
      }, { bg: '#ffffff', border: LINE });
    });
  },
  'weeks': (el) => {
    $(el).children('section').each((_, s) => {
      const lab = txt($(s).find('.mini-label'));
      const t = txt($(s).find('h3'));
      const items = $(s).find('li').toArray().map(txt);
      box((y, iw, probe) => {
        let yy = y, h = 0;
        const lh = measureText(lab.toUpperCase(), 'Helvetica-Bold', 7.5, iw);
        const th = measureText(t, 'Times-Bold', 14, iw);
        if (!probe) {
          drawText(lab.toUpperCase(), M + 16, yy, 'Helvetica-Bold', 7.5, ORANGE, iw);
          drawText(t, M + 16, yy + lh + 3, 'Times-Bold', 14, INK, iw);
        }
        yy += lh + th + 8; h += lh + th + 8;
        items.forEach((it) => {
          const ih = measureText(it, 'Helvetica', 10.2, iw - 14, 2.5);
          if (!probe) {
            drawText('\u2022', M + 16, yy, 'Helvetica', 10.2, ORANGE, 10);
            drawText(it, M + 30, yy, 'Helvetica', 10.2, MUTED, iw - 14, 2.5);
          }
          yy += ih + 4; h += ih + 4;
        });
        return h;
      }, { bg: '#ffffff', border: LINE, accent: ORANGE });
    });
  },
  'warning-box': (el) => {
    const lab = txt($(el).find('.mini-label'));
    const head = txt($(el).find('h3'));
    const items = $(el).find('li').toArray().map((li) => ({ b: txt($(li).find('b')), s: txt($(li).find('span')) }));
    label(lab, ORANGE);
    doc.font('Times-Bold').fontSize(16).fillColor(INK).text(head, M, doc.y, { width: CW });
    space(10);
    items.forEach((it) => {
      room(46);
      const y = doc.y;
      doc.font('Helvetica-Bold').fontSize(10.3).fillColor(INK).text(it.b, M + 14, y, { width: CW - 14 });
      doc.font('Helvetica').fontSize(10).fillColor(MUTED).text(it.s, M + 14, doc.y + 1, { width: CW - 14, lineGap: 2.4 });
      doc.save().rect(M, y, 2, doc.y - y).fill(ORANGE).restore();
      space(10);
    });
    space(6);
  },
  'filter-card': (el) => {
    label(txt($(el).find('.mini-label')), TEAL);
    doc.font('Times-Bold').fontSize(16).fillColor(INK).text(txt($(el).find('h3')), M, doc.y, { width: CW });
    space(10);
    $(el).find('li').each((_, li) => {
      const n = txt($(li).find('span'));
      const b = txt($(li).find('b'));
      const p = txt($(li).find('p'));
      room(50);
      const y = doc.y;
      doc.font('Helvetica-Bold').fontSize(10).fillColor(TEAL).text(n, M, y + 1, { width: 42 });
      doc.font('Helvetica-Bold').fontSize(10.5).fillColor(INK).text(b, M + 46, y, { width: CW - 46 });
      doc.font('Helvetica').fontSize(10).fillColor(MUTED).text(p, M + 46, doc.y + 1, { width: CW - 46, lineGap: 2.4 });
      space(10);
    });
    space(4);
  },
  'pitch-card': (el) => {
    const lab = txt($(el).find('.mini-label'));
    const ps = $(el).find('p').toArray().filter((p) => !$(p).hasClass('mini-label'));
    box((y, iw, probe) => {
      let yy = y, h = 0;
      const lh = measureText(lab.toUpperCase(), 'Helvetica-Bold', 7.5, iw);
      if (!probe) drawText(lab.toUpperCase(), M + 18, yy, 'Helvetica-Bold', 7.5, TEAL, iw);
      yy += lh + 8; h += lh + 8;
      ps.forEach((p) => {
        const t = txt(p);
        const ph = measureText(t, 'Helvetica', 10.3, iw, 3);
        if (!probe) drawText(t, M + 18, yy, 'Helvetica', 10.3, INK, iw, 3);
        yy += ph + 7; h += ph + 7;
      });
      return h;
    }, { bg: '#ffffff', accent: TEAL, border: LINE, pad: 18 });
  },
  'table-wrap': (el) => {
    const rows = $(el).find('tbody tr').toArray().map((tr) => $(tr).find('td').toArray().map(txt));
    const heads = $(el).find('thead th').toArray().map(txt);
    const c1 = 150, c2 = CW - c1;
    room(60);
    let y = doc.y;
    doc.save().rect(M, y, CW, 22).fill('#efeadf').restore();
    doc.font('Helvetica-Bold').fontSize(8).fillColor(INK).text(heads[0].toUpperCase(), M + 8, y + 7, { width: c1, characterSpacing: 1.2 });
    doc.text(heads[1].toUpperCase(), M + c1 + 8, y + 7, { width: c2 - 16, characterSpacing: 1.2 });
    doc.y = y + 22;
    rows.forEach((r) => {
      const hA = measureText(r[0], 'Helvetica-Bold', 9.8, c1 - 16, 2);
      const hB = measureText(r[1], 'Helvetica', 9.8, c2 - 16, 2);
      const rh = Math.max(hA, hB) + 12;
      if (doc.y + rh > PH - 80) { newPage(); }
      y = doc.y;
      doc.font('Helvetica-Bold').fontSize(9.8).fillColor(INK).text(r[0], M + 8, y + 6, { width: c1 - 16, lineGap: 2 });
      doc.font('Helvetica').fontSize(9.8).fillColor(MUTED).text(r[1], M + c1 + 8, y + 6, { width: c2 - 16, lineGap: 2 });
      doc.y = y + rh;
      doc.strokeColor(LINE).lineWidth(0.5).moveTo(M, doc.y).lineTo(M + CW, doc.y).stroke();
    });
    space(16);
  },
  'practice-page': (el) => {
    label(txt($(el).find('.section-label')), ORANGE);
    doc.font('Times-Bold').fontSize(18).fillColor(INK).text(txt($(el).find('h3')), M, doc.y, { width: CW });
    space(12);
    $(el).find('label').each((_, l) => {
      room(44);
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(INK).text(txt(l), M, doc.y, { width: CW });
      space(16);
      doc.strokeColor(LINE).lineWidth(0.7).moveTo(M, doc.y).lineTo(M + CW, doc.y).stroke();
      space(14);
    });
  },
  'pullquote': (el) => {
    const t = txt($(el).find('p'));
    box((y, iw, probe) => {
      const h = measureText(t, 'Times-Italic', 15, iw, 4);
      if (!probe) drawText(t, M + 20, y, 'Times-Italic', 15, INK, iw, 4);
      return h;
    }, { bg: '#efeadf', accent: ORANGE, pad: 20 });
  },
  'margin-note': (el) => {
    const b = txt($(el).find('b'));
    const p = txt($(el).find('p'));
    box((y, iw, probe) => {
      const bh = measureText(b.toUpperCase(), 'Helvetica-Bold', 7.5, iw);
      const ph = measureText(p, 'Helvetica', 10, iw, 3);
      if (!probe) {
        drawText(b.toUpperCase(), M + 16, y, 'Helvetica-Bold', 7.5, TEAL, iw);
        drawText(p, M + 16, y + bh + 4, 'Helvetica', 10, MUTED, iw, 3);
      }
      return bh + ph + 6;
    }, { bg: '#ffffff', border: LINE });
  },
};

function renderProse($prose) {
  $prose.children().each((_, el) => {
    const tag = el.tagName.toLowerCase();
    const cls = ($(el).attr('class') || '').split(/\s+/);
    const key = cls.find((c) => renderers[c]);
    if (key) { renderers[key](el); return; }
    if (tag === 'p') {
      para(txt(el), { size: $(el).hasClass('lead') ? 12 : 10.8, color: $(el).hasClass('lead') ? INK : INK, after: 10 });
      return;
    }
    if (tag === 'h3') { h3(txt(el)); return; }
    if (tag === 'ol' || tag === 'ul') {
      const ordered = tag === 'ol';
      $(el).children('li').each((i, li) => {
        const t = txt(li);
        room(44);
        const y = doc.y;
        const marker = ordered ? String(i + 1).padStart(2, '0') : '\u2022';
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor(ORANGE).text(marker, M, y + 1, { width: 26 });
        doc.font('Helvetica').fontSize(10.5).fillColor(INK).text(t, M + 30, y, { width: CW - 30, lineGap: 3 });
        space(10);
      });
      space(6);
      return;
    }
    // fallback
    const t = txt(el);
    if (t) para(t, { color: MUTED });
  });
}

$('article > section.chapter').each((_, sec) => {
  const num = clean($(sec).find('.chapter-number span').first().text());
  const kind = clean($(sec).find('.chapter-number').first().clone().children().remove().end().text());
  const title = clean($(sec).find('.chapter-head h2').first().text());
  const deck = clean($(sec).find('.chapter-deck').first().text());
  sectionLabel = `${kind} ${num} \u2014 ${title}`;
  newPage();

  doc.save().rect(M, doc.y, CW, 4).fill(ORANGE).restore();
  space(22);
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(ORANGE)
    .text(`${kind.toUpperCase()} ${num}`, M, doc.y, { characterSpacing: 2.2 });
  space(8);
  doc.font('Times-Bold').fontSize(34).fillColor(INK).text(title, M, doc.y, { width: CW, lineGap: -2 });
  space(8);
  doc.font('Times-Italic').fontSize(13).fillColor(MUTED).text(deck, M, doc.y, { width: CW });
  space(22);

  renderProse($(sec).find('.prose').first());
});

/* ---------- closing ---------- */
sectionLabel = 'The last page';
newPage();
const closing = $('#closing');
doc.font('Helvetica-Bold').fontSize(8).fillColor(ORANGE).text('THE LAST PAGE', M, doc.y, { characterSpacing: 2 });
space(14);
doc.font('Times-Bold').fontSize(30).fillColor(INK).text('Nobody is coming to discover you.', M, doc.y, { width: CW });
space(18);
closing.children('p').each((_, p) => { if (!$(p).hasClass('section-label')) para(txt(p), { size: 11.5 }); });
space(10);
box((y, iw, probe) => {
  const t1 = clean(closing.find('.prayer span').text()).toUpperCase();
  const t2 = clean(closing.find('.prayer p').text());
  const h1 = measureText(t1, 'Helvetica-Bold', 8, iw);
  const h2 = measureText(t2, 'Times-Italic', 13, iw, 4);
  if (!probe) {
    drawText(t1, M + 20, y, 'Helvetica-Bold', 8, GOLD, iw);
    drawText(t2, M + 20, y + h1 + 8, 'Times-Italic', 13, '#ffffff', iw, 4);
  }
  return h1 + h2 + 10;
}, { bg: NAVY, accent: GOLD, pad: 20 });

/* page numbers */
const range = doc.bufferedPageRange();
for (let i = 1; i < range.count; i++) {
  doc.switchToPage(i);
  doc.page.margins.bottom = 0;
  doc.font('Helvetica-Bold').fontSize(8).fillColor(ORANGE)
    .text(String(i), M, PH - 48, { width: CW, align: 'center', lineBreak: false });
}
doc.end();
console.log('wrote', OUT);
