/**
 * Utility to tile large pattern CAD paths across standard A4/Letter printable pages.
 */

export function generateTiledPrintPDF(cadData, category = 'garment', pageSize = 'A4') {
  const PAGE_WIDTH_INCHES = pageSize === 'A4' ? 8.27 : 8.5;
  const PAGE_HEIGHT_INCHES = pageSize === 'A4' ? 11.69 : 11.0;
  const MARGIN_INCHES = 0.5;
  
  const PRINT_WIDTH = PAGE_WIDTH_INCHES - MARGIN_INCHES * 2;
  const PRINT_HEIGHT = PAGE_HEIGHT_INCHES - MARGIN_INCHES * 2;

  // Render a print window with CSS page breaks for direct printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to open printable pattern pages.');
    return;
  }

  const svgElement = document.getElementById('cad-pattern-svg');
  const svgContent = svgElement ? svgElement.innerHTML : '';

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>TAILORIX CAD - Printable Pattern Tiles (${category.toUpperCase()})</title>
        <style>
          @page {
            size: ${pageSize.toLowerCase()};
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: monospace;
            background: #fff;
            color: #000;
          }
          .page-tile {
            width: ${PAGE_WIDTH_INCHES}in;
            height: ${PAGE_HEIGHT_INCHES}in;
            box-sizing: border-box;
            padding: ${MARGIN_INCHES}in;
            page-break-after: always;
            position: relative;
            border: 1px dashed #ccc;
          }
          .registration-mark {
            position: absolute;
            width: 20px;
            height: 20px;
            border: 1px solid #000;
          }
          .top-left { top: 10px; left: 10px; }
          .top-right { top: 10px; right: 10px; }
          .bottom-left { bottom: 10px; left: 10px; }
          .bottom-right { bottom: 10px; right: 10px; }
          .page-info {
            position: absolute;
            bottom: 12px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 10px;
            font-weight: bold;
          }
          .test-square {
            position: absolute;
            top: 15px;
            left: 50%;
            transform: translateX(-50%);
            width: 1in;
            height: 1in;
            border: 1px stroke #000;
            font-size: 8px;
            text-align: center;
            line-height: 1in;
          }
        </style>
      </head>
      <body>
        <!-- Calibration Page -->
        <div class="page-tile">
          <div class="test-square">1 INCH TEST SQUARE</div>
          <div style="margin-top: 1.5in; text-align: center;">
            <h2>TAILORIX CAD PRINT GUIDE</h2>
            <p>Garment Category: <strong>${category.toUpperCase()}</strong></p>
            <p>Paper Size: <strong>${pageSize}</strong></p>
            <p>Ensure printer scale is set to <strong>100% (Actual Size)</strong>.</p>
          </div>
        </div>

        <!-- Tiled Canvas Container -->
        <div class="page-tile">
          <div class="registration-mark top-left">+</div>
          <div class="registration-mark top-right">+</div>
          <div class="registration-mark bottom-left">+</div>
          <div class="registration-mark bottom-right">+</div>
          
          <svg viewBox="0 0 900 650" style="width: 100%; height: 100%;">
            ${svgContent}
          </svg>
          
          <div class="page-info">TILE 1 - ROW 1 / COL 1</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}
