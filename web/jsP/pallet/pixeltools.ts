// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface RGB {
    r: number;
    g: number;
    b: number;
    a?: number;
  }
  
  interface Point {
    x: number;
    y: number;
  }
  
  interface Line {
    start: Point;
    end: Point;
    angle: number;
    length: number;
  }
  
  interface EdgeInfo {
    points: Point[];
    edges: ImageData;
    strength: number[][];
  }
  
  interface CleaningConfig {
    antiAliasingThreshold: number;
    edgeDetectionThreshold: number;
    minLineLength: number;
    angleSnapTolerance: number;
    morphologyKernelSize: number;
    colorClusterCount: number;
    isometricAngles: number[];
  }
  
  // ============================================================================
  // PIXEL ART CLEANER CLASS
  // ============================================================================
  
  export class PixelArtCleaner {
    private imageData: ImageData;
    private width: number;
    private height: number;
    private config: CleaningConfig;
  
    // Default configuration
    private defaultConfig: CleaningConfig = {
      antiAliasingThreshold: 40,
      edgeDetectionThreshold: 30,
      minLineLength: 5,
      angleSnapTolerance: 5,
      morphologyKernelSize: 3,
      colorClusterCount: 16,
      isometricAngles: [0, 30, 45, 60, 90, 120, 135, 150]
    };
  
    constructor(imageData: ImageData, config?: Partial<CleaningConfig>) {
      this.imageData = this.cloneImageData(imageData);
      this.width = imageData.width;
      this.height = imageData.height;
      this.config = { ...this.defaultConfig, ...config };
    }
  
    // ============================================================================
    // UTILITY METHODS
    // ============================================================================
  
    private cloneImageData(imageData: ImageData): ImageData {
      const clone = new ImageData(imageData.width, imageData.height);
      clone.data.set(imageData.data);
      return clone;
    }
  
    private getPixel(x: number, y: number, data?: ImageData): RGB {
      const img = data || this.imageData;
      if (x < 0 || x >= img.width || y < 0 || y >= img.height) {
        return { r: 0, g: 0, b: 0, a: 0 };
      }
      const idx = (y * img.width + x) * 4;
      return {
        r: img.data[idx],
        g: img.data[idx + 1],
        b: img.data[idx + 2],
        a: img.data[idx + 3]
      };
    }
  
    private setPixel(x: number, y: number, color: RGB, data?: ImageData): void {
      const img = data || this.imageData;
      if (x < 0 || x >= img.width || y < 0 || y >= img.height) return;
      const idx = (y * img.width + x) * 4;
      img.data[idx] = color.r;
      img.data[idx + 1] = color.g;
      img.data[idx + 2] = color.b;
      img.data[idx + 3] = color.a !== undefined ? color.a : 255;
    }
  
    private colorDistance(c1: RGB, c2: RGB): number {
      return Math.sqrt(
        Math.pow(c1.r - c2.r, 2) +
        Math.pow(c1.g - c2.g, 2) +
        Math.pow(c1.b - c2.b, 2)
      );
    }
  
    private colorToGray(color: RGB): number {
      return 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
    }
  
    // ============================================================================
    // CORE CLEANING TOOLS
    // ============================================================================
  
    /**
     * Remove anti-aliasing artifacts between colors
     * Replaces transitional colors with dominant neighbor colors
     */
    removeAntiAliasing(threshold?: number): this {
      const th = threshold || this.config.antiAliasingThreshold;
      const result = this.cloneImageData(this.imageData);
  
      for (let y = 1; y < this.height - 1; y++) {
        for (let x = 1; x < this.width - 1; x++) {
          const center = this.getPixel(x, y);
          
          // Get 4-connected neighbors
          const neighbors = [
            this.getPixel(x - 1, y),
            this.getPixel(x + 1, y),
            this.getPixel(x, y - 1),
            this.getPixel(x, y + 1)
          ];
  
          // Find dominant color among neighbors
          const colorMap = new Map<string, { color: RGB; count: number }>();
          
          for (const n of neighbors) {
            const key = `${n.r},${n.g},${n.b}`;
            const existing = colorMap.get(key);
            if (existing) {
              existing.count++;
            } else {
              colorMap.set(key, { color: n, count: 1 });
            }
          }
  
          let dominant = center;
          let maxCount = 0;
          
          for (const entry of colorMap.values()) {
            if (entry.count > maxCount) {
              maxCount = entry.count;
              dominant = entry.color;
            }
          }
  
          // If center color is close to dominant but not exact, snap to dominant
          const dist = this.colorDistance(center, dominant);
          if (dist > 1 && dist < th && maxCount >= 2) {
            this.setPixel(x, y, dominant, result);
          }
        }
      }
  
      this.imageData = result;
      return this;
    }
  
    /**
     * Detect edges using Sobel operator
     * Returns edge strength map and edge points
     */
    detectEdges(threshold?: number): EdgeInfo {
      const th = threshold || this.config.edgeDetectionThreshold;
      const edges = new ImageData(this.width, this.height);
      const strength: number[][] = Array(this.height).fill(0).map(() => Array(this.width).fill(0));
      const points: Point[] = [];
  
      // Sobel kernels
      const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
      const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
  
      for (let y = 1; y < this.height - 1; y++) {
        for (let x = 1; x < this.width - 1; x++) {
          let gx = 0, gy = 0;
  
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const pixel = this.getPixel(x + kx, y + ky);
              const gray = this.colorToGray(pixel);
              gx += gray * sobelX[ky + 1][kx + 1];
              gy += gray * sobelY[ky + 1][kx + 1];
            }
          }
  
          const magnitude = Math.sqrt(gx * gx + gy * gy);
          strength[y][x] = magnitude;
  
          if (magnitude > th) {
            const value = Math.min(255, magnitude);
            this.setPixel(x, y, { r: value, g: value, b: value }, edges);
            points.push({ x, y });
          } else {
            this.setPixel(x, y, { r: 0, g: 0, b: 0 }, edges);
          }
        }
      }
  
      return { points, edges, strength };
    }
  
    /**
     * Detect lines in the image
     * Returns array of detected lines with their properties
     */
    detectLines(minLength?: number): Line[] {
      const minLen = minLength || this.config.minLineLength;
      const edgeInfo = this.detectEdges();
      const lines: Line[] = [];
      const visited = new Set<string>();
  
      for (const start of edgeInfo.points) {
        const key = `${start.x},${start.y}`;
        if (visited.has(key)) continue;
  
        // Try angles at 1-degree increments
        for (let angle = 0; angle < 180; angle += 1) {
          const rad = (angle * Math.PI) / 180;
          const dx = Math.cos(rad);
          const dy = Math.sin(rad);
  
          const linePixels: Point[] = [start];
          let currentX = start.x;
          let currentY = start.y;
  
          // Trace line forward
          for (let step = 1; step < Math.max(this.width, this.height); step++) {
            currentX += dx;
            currentY += dy;
            const x = Math.round(currentX);
            const y = Math.round(currentY);
  
            if (x < 0 || x >= this.width || y < 0 || y >= this.height) break;
  
            const isEdge = edgeInfo.points.some(p => p.x === x && p.y === y);
            if (isEdge) {
              linePixels.push({ x, y });
              visited.add(`${x},${y}`);
            } else if (linePixels.length >= minLen) {
              break;
            } else {
              break;
            }
          }
  
          if (linePixels.length >= minLen) {
            const end = linePixels[linePixels.length - 1];
            const length = Math.sqrt(
              Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
            );
            lines.push({ start, end, angle, length });
            break;
          }
        }
      }
  
      return lines;
    }
  
    /**
     * Snap line angles to nearest isometric angles
     */
    snapLinesToIsometric(lines: Line[]): Line[] {
      const targetAngles = this.config.isometricAngles;
      
      return lines.map(line => {
        let nearestAngle = targetAngles[0];
        let minDiff = Math.abs(line.angle - targetAngles[0]);
  
        for (const target of targetAngles) {
          const diff = Math.abs(line.angle - target);
          if (diff < minDiff) {
            minDiff = diff;
            nearestAngle = target;
          }
        }
  
        // Recalculate end point based on snapped angle
        const rad = (nearestAngle * Math.PI) / 180;
        const dx = Math.cos(rad) * line.length;
        const dy = Math.sin(rad) * line.length;
        
        return {
          ...line,
          angle: nearestAngle,
          end: {
            x: Math.round(line.start.x + dx),
            y: Math.round(line.start.y + dy)
          }
        };
      });
    }
  
    /**
     * Redraw lines with perfect alignment
     */
    redrawLines(lines: Line[], color?: RGB): this {
      const lineColor = color || { r: 0, g: 0, b: 0 };
      
      for (const line of lines) {
        const dx = line.end.x - line.start.x;
        const dy = line.end.y - line.start.y;
        const steps = Math.max(Math.abs(dx), Math.abs(dy));
        
        for (let i = 0; i <= steps; i++) {
          const t = steps === 0 ? 0 : i / steps;
          const x = Math.round(line.start.x + dx * t);
          const y = Math.round(line.start.y + dy * t);
          this.setPixel(x, y, lineColor);
        }
      }
      
      return this;
    }
  
    /**
     * Detect corners (intersections and direction changes)
     */
    detectCorners(threshold?: number): Point[] {
      const th = threshold || 100;
      const corners: Point[] = [];
  
      for (let y = 2; y < this.height - 2; y++) {
        for (let x = 2; x < this.width - 2; x++) {
          const center = this.getPixel(x, y);
          
          // Get 8-connected neighbors
          const neighbors = [
            this.getPixel(x - 1, y - 1), this.getPixel(x, y - 1), this.getPixel(x + 1, y - 1),
            this.getPixel(x - 1, y), this.getPixel(x + 1, y),
            this.getPixel(x - 1, y + 1), this.getPixel(x, y + 1), this.getPixel(x + 1, y + 1)
          ];
  
          // Count significant color changes
          let changes = 0;
          for (const n of neighbors) {
            if (this.colorDistance(center, n) > 50) {
              changes++;
            }
          }
  
          // Corner if 3+ directions have significant changes
          if (changes >= 3 && changes <= 6) {
            corners.push({ x, y });
          }
        }
      }
  
      return corners;
    }
  
    /**
     * Morphological closing: closes small gaps
     */
    morphologicalClose(kernelSize?: number): this {
      const size = kernelSize || this.config.morphologyKernelSize;
      this.dilate(size);
      this.erode(size);
      return this;
    }
  
    /**
     * Morphological opening: removes small noise
     */
    morphologicalOpen(kernelSize?: number): this {
      const size = kernelSize || this.config.morphologyKernelSize;
      this.erode(size);
      this.dilate(size);
      return this;
    }
  
    /**
     * Dilate (expand bright regions)
     */
    dilate(kernelSize: number = 3): this {
      const result = this.cloneImageData(this.imageData);
      const radius = Math.floor(kernelSize / 2);
  
      for (let y = radius; y < this.height - radius; y++) {
        for (let x = radius; x < this.width - radius; x++) {
          let maxColor = { r: 0, g: 0, b: 0 };
          let maxBrightness = 0;
  
          for (let ky = -radius; ky <= radius; ky++) {
            for (let kx = -radius; kx <= radius; kx++) {
              const color = this.getPixel(x + kx, y + ky);
              const brightness = color.r + color.g + color.b;
              if (brightness > maxBrightness) {
                maxBrightness = brightness;
                maxColor = color;
              }
            }
          }
  
          this.setPixel(x, y, maxColor, result);
        }
      }
  
      this.imageData = result;
      return this;
    }
  
    /**
     * Erode (shrink bright regions)
     */
    erode(kernelSize: number = 3): this {
      const result = this.cloneImageData(this.imageData);
      const radius = Math.floor(kernelSize / 2);
  
      for (let y = radius; y < this.height - radius; y++) {
        for (let x = radius; x < this.width - radius; x++) {
          let minColor = { r: 255, g: 255, b: 255 };
          let minBrightness = 999999;
  
          for (let ky = -radius; ky <= radius; ky++) {
            for (let kx = -radius; kx <= radius; kx++) {
              const color = this.getPixel(x + kx, y + ky);
              const brightness = color.r + color.g + color.b;
              if (brightness < minBrightness) {
                minBrightness = brightness;
                minColor = color;
              }
            }
          }
  
          this.setPixel(x, y, minColor, result);
        }
      }
  
      this.imageData = result;
      return this;
    }
  
    /**
     * Quantize colors to reduce palette (K-means clustering)
     */
    quantizeColors(numColors?: number): this {
      const k = numColors || this.config.colorClusterCount;
      
      // Collect all unique colors
      const colorSet = new Set<string>();
      const pixels: RGB[] = [];
      
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const color = this.getPixel(x, y);
          const key = `${color.r},${color.g},${color.b}`;
          if (!colorSet.has(key)) {
            colorSet.add(key);
            pixels.push(color);
          }
        }
      }
  
      // Initialize centroids randomly
      const centroids: RGB[] = [];
      const step = Math.floor(pixels.length / k);
      for (let i = 0; i < k && i * step < pixels.length; i++) {
        centroids.push({ ...pixels[i * step] });
      }
  
      // K-means iterations
      for (let iter = 0; iter < 10; iter++) {
        const clusters: RGB[][] = Array(k).fill(0).map(() => []);
  
        // Assign pixels to nearest centroid
        for (const pixel of pixels) {
          let nearest = 0;
          let minDist = this.colorDistance(pixel, centroids[0]);
          
          for (let i = 1; i < centroids.length; i++) {
            const dist = this.colorDistance(pixel, centroids[i]);
            if (dist < minDist) {
              minDist = dist;
              nearest = i;
            }
          }
          
          clusters[nearest].push(pixel);
        }
  
        // Update centroids
        for (let i = 0; i < k; i++) {
          if (clusters[i].length > 0) {
            const sum = clusters[i].reduce((acc, c) => ({
              r: acc.r + c.r,
              g: acc.g + c.g,
              b: acc.b + c.b
            }), { r: 0, g: 0, b: 0 });
            
            centroids[i] = {
              r: Math.round(sum.r / clusters[i].length),
              g: Math.round(sum.g / clusters[i].length),
              b: Math.round(sum.b / clusters[i].length)
            };
          }
        }
      }
  
      // Apply quantization
      const result = this.cloneImageData(this.imageData);
      
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const color = this.getPixel(x, y);
          
          let nearest = centroids[0];
          let minDist = this.colorDistance(color, centroids[0]);
          
          for (let i = 1; i < centroids.length; i++) {
            const dist = this.colorDistance(color, centroids[i]);
            if (dist < minDist) {
              minDist = dist;
              nearest = centroids[i];
            }
          }
          
          this.setPixel(x, y, nearest, result);
        }
      }
  
      this.imageData = result;
      return this;
    }
  
    /**
     * Smooth jagged edges along boundaries
     */
    smoothEdges(): this {
      const result = this.cloneImageData(this.imageData);
      
      for (let y = 1; y < this.height - 1; y++) {
        for (let x = 1; x < this.width - 1; x++) {
          const center = this.getPixel(x, y);
          
          // Check if this is an edge pixel
          const neighbors = [
            this.getPixel(x - 1, y), this.getPixel(x + 1, y),
            this.getPixel(x, y - 1), this.getPixel(x, y + 1)
          ];
          
          const differentNeighbors = neighbors.filter(n => 
            this.colorDistance(center, n) > 30
          ).length;
          
          if (differentNeighbors >= 2 && differentNeighbors <= 3) {
            // This is an edge, average with similar neighbors
            const similarNeighbors = neighbors.filter(n => 
              this.colorDistance(center, n) < 30
            );
            
            if (similarNeighbors.length > 0) {
              const avg = similarNeighbors.reduce((acc, n) => ({
                r: acc.r + n.r,
                g: acc.g + n.g,
                b: acc.b + n.b
              }), { r: center.r, g: center.g, b: center.b });
              
              const count = similarNeighbors.length + 1;
              this.setPixel(x, y, {
                r: Math.round(avg.r / count),
                g: Math.round(avg.g / count),
                b: Math.round(avg.b / count)
              }, result);
            }
          }
        }
      }
      
      this.imageData = result;
      return this;
    }
  
    /**
     * Remove isolated pixels (noise)
     */
    removeIsolatedPixels(minNeighbors: number = 2): this {
      const result = this.cloneImageData(this.imageData);
      
      for (let y = 1; y < this.height - 1; y++) {
        for (let x = 1; x < this.width - 1; x++) {
          const center = this.getPixel(x, y);
          
          const neighbors = [
            this.getPixel(x - 1, y), this.getPixel(x + 1, y),
            this.getPixel(x, y - 1), this.getPixel(x, y + 1),
            this.getPixel(x - 1, y - 1), this.getPixel(x + 1, y - 1),
            this.getPixel(x - 1, y + 1), this.getPixel(x + 1, y + 1)
          ];
          
          const similarNeighbors = neighbors.filter(n => 
            this.colorDistance(center, n) < 20
          ).length;
          
          if (similarNeighbors < minNeighbors) {
            // Find most common neighbor color
            const colorCounts = new Map<string, { color: RGB; count: number }>();
            
            for (const n of neighbors) {
              const key = `${n.r},${n.g},${n.b}`;
              const existing = colorCounts.get(key);
              if (existing) {
                existing.count++;
              } else {
                colorCounts.set(key, { color: n, count: 1 });
              }
            }
            
            let mostCommon = center;
            let maxCount = 0;
            for (const entry of colorCounts.values()) {
              if (entry.count > maxCount) {
                maxCount = entry.count;
                mostCommon = entry.color;
              }
            }
            
            this.setPixel(x, y, mostCommon, result);
          }
        }
      }
      
      this.imageData = result;
      return this;
    }
  
    // ============================================================================
    // PRESET WORKFLOWS
    // ============================================================================
  
    /**
     * Complete isometric cleaning workflow
     */
    cleanIsometric(): this {
      return this
        .removeAntiAliasing()
        .morphologicalClose()
        .removeIsolatedPixels()
        .smoothEdges();
    }
  
    /**
     * Aggressive cleaning for very noisy images
     */
    aggressiveClean(): this {
      return this
        .quantizeColors(8)
        .removeAntiAliasing(50)
        .morphologicalClose(5)
        .morphologicalOpen(3)
        .removeIsolatedPixels(3)
        .smoothEdges();
    }
  
    /**
     * Gentle cleaning that preserves detail
     */
    gentleClean(): this {
      return this
        .removeAntiAliasing(30)
        .removeIsolatedPixels(1);
    }
  
    // ============================================================================
    // OUTPUT METHODS
    // ============================================================================
  
    /**
     * Get the current processed ImageData
     */
    getImageData(): ImageData {
      return this.cloneImageData(this.imageData);
    }
  
    /**
     * Reset to original image
     */
    reset(imageData: ImageData): this {
      this.imageData = this.cloneImageData(imageData);
      this.width = imageData.width;
      this.height = imageData.height;
      return this;
    }
  
    /**
     * Get analysis report
     */
    analyze(): {
      dimensions: { width: number; height: number };
      uniqueColors: number;
      edges: EdgeInfo;
      corners: Point[];
      lines: Line[];
    } {
      // Count unique colors
      const colorSet = new Set<string>();
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const c = this.getPixel(x, y);
          colorSet.add(`${c.r},${c.g},${c.b}`);
        }
      }
  
      const edges = this.detectEdges();
      const corners = this.detectCorners();
      const lines = this.detectLines();
  
      return {
        dimensions: { width: this.width, height: this.height },
        uniqueColors: colorSet.size,
        edges,
        corners,
        lines
      };
    }
  
    // ============================================================================
    // ADVANCED FUNCTIONS
    // ============================================================================
  
    /**
     * Trace contours and simplify them to straight line segments
     * Returns closed contours that can be redrawn perfectly
     */
    traceAndSimplifyContours(epsilon: number = 2): Line[][] {
      const edgeInfo = this.detectEdges();
      const visited = new Set<string>();
      const contours: Line[][] = [];
  
      // Find connected edge components
      for (const start of edgeInfo.points) {
        const key = `${start.x},${start.y}`;
        if (visited.has(key)) continue;
  
        const contourPoints: Point[] = [start];
        visited.add(key);
        
        // Trace contour using 8-connectivity
        let current = start;
        let found = true;
        
        while (found && contourPoints.length < 10000) {
          found = false;
          
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              
              const nx = current.x + dx;
              const ny = current.y + dy;
              const nkey = `${nx},${ny}`;
              
              if (!visited.has(nkey) && 
                  edgeInfo.points.some(p => p.x === nx && p.y === ny)) {
                contourPoints.push({ x: nx, y: ny });
                visited.add(nkey);
                current = { x: nx, y: ny };
                found = true;
                break;
              }
            }
            if (found) break;
          }
        }
  
        if (contourPoints.length >= 4) {
          // Douglas-Peucker simplification
          const simplified = this.douglasPeucker(contourPoints, epsilon);
          
          // Convert to line segments
          const lines: Line[] = [];
          for (let i = 0; i < simplified.length - 1; i++) {
            const start = simplified[i];
            const end = simplified[i + 1];
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            const length = Math.sqrt(dx * dx + dy * dy);
            lines.push({ start, end, angle, length });
          }
          
          if (lines.length > 0) {
            contours.push(lines);
          }
        }
      }
  
      return contours;
    }
  
    /**
     * Douglas-Peucker algorithm for line simplification
     */
    private douglasPeucker(points: Point[], epsilon: number): Point[] {
      if (points.length <= 2) return points;
  
      // Find point with maximum distance from line
      let maxDist = 0;
      let maxIndex = 0;
      const start = points[0];
      const end = points[points.length - 1];
  
      for (let i = 1; i < points.length - 1; i++) {
        const dist = this.perpendicularDistance(points[i], start, end);
        if (dist > maxDist) {
          maxDist = dist;
          maxIndex = i;
        }
      }
  
      // If max distance is greater than epsilon, recursively simplify
      if (maxDist > epsilon) {
        const left = this.douglasPeucker(points.slice(0, maxIndex + 1), epsilon);
        const right = this.douglasPeucker(points.slice(maxIndex), epsilon);
        return [...left.slice(0, -1), ...right];
      } else {
        return [start, end];
      }
    }
  
    /**
     * Calculate perpendicular distance from point to line
     */
    private perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
      const dx = lineEnd.x - lineStart.x;
      const dy = lineEnd.y - lineStart.y;
      const num = Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x);
      const den = Math.sqrt(dx * dx + dy * dy);
      return den === 0 ? 0 : num / den;
    }
  
    /**
     * Intelligent angle correction - analyzes local context to fix misaligned lines
     */
    correctLineAngles(tolerance: number = 3): this {
      const lines = this.detectLines();
      const snapped = this.snapLinesToIsometric(lines);
      
      // Group lines by similar angles
      const angleGroups = new Map<number, Line[]>();
      for (const line of snapped) {
        const existing = angleGroups.get(line.angle) || [];
        existing.push(line);
        angleGroups.set(line.angle, existing);
      }
  
      // Find dominant angles
      const dominantAngles = Array.from(angleGroups.entries())
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 4)
        .map(([angle]) => angle);
  
      // Correct lines that deviate slightly from dominant angles
      const correctedLines: Line[] = [];
      for (const line of lines) {
        let bestAngle = line.angle;
        let minDiff = Infinity;
  
        for (const domAngle of dominantAngles) {
          const diff = Math.abs(line.angle - domAngle);
          if (diff < minDiff && diff < tolerance) {
            minDiff = diff;
            bestAngle = domAngle;
          }
        }
  
        const rad = (bestAngle * Math.PI) / 180;
        const newEnd = {
          x: Math.round(line.start.x + Math.cos(rad) * line.length),
          y: Math.round(line.start.y + Math.sin(rad) * line.length)
        };
  
        correctedLines.push({ ...line, angle: bestAngle, end: newEnd });
      }
  
      // Clear and redraw
      this.redrawLines(correctedLines);
      return this;
    }
  
    /**
     * Intelligent gap filling - connects nearby line endpoints that should be connected
     */
    fillLineGaps(maxGapDistance: number = 5): this {
      const lines = this.detectLines();
      const result = this.cloneImageData(this.imageData);
  
      // Find endpoints
      const endpoints: { point: Point; line: Line; isStart: boolean }[] = [];
      for (const line of lines) {
        endpoints.push({ point: line.start, line, isStart: true });
        endpoints.push({ point: line.end, line, isStart: false });
      }
  
      // Connect nearby endpoints with compatible angles
      for (let i = 0; i < endpoints.length; i++) {
        for (let j = i + 1; j < endpoints.length; j++) {
          const ep1 = endpoints[i];
          const ep2 = endpoints[j];
  
          // Don't connect endpoints from same line
          if (ep1.line === ep2.line) continue;
  
          const dist = Math.sqrt(
            Math.pow(ep1.point.x - ep2.point.x, 2) +
            Math.pow(ep1.point.y - ep2.point.y, 2)
          );
  
          if (dist <= maxGapDistance && dist > 0) {
            // Check if angles are compatible
            const angle1 = ep1.line.angle;
            const angle2 = ep2.line.angle;
            const angleDiff = Math.abs(angle1 - angle2);
  
            if (angleDiff < 10 || angleDiff > 170) {
              // Draw connecting line
              const dx = ep2.point.x - ep1.point.x;
              const dy = ep2.point.y - ep1.point.y;
              const steps = Math.max(Math.abs(dx), Math.abs(dy));
  
              for (let s = 0; s <= steps; s++) {
                const t = steps === 0 ? 0 : s / steps;
                const x = Math.round(ep1.point.x + dx * t);
                const y = Math.round(ep1.point.y + dy * t);
                const color = this.getPixel(ep1.point.x, ep1.point.y);
                this.setPixel(x, y, color, result);
              }
            }
          }
        }
      }
  
      this.imageData = result;
      return this;
    }
  
    /**
     * Staircase removal - removes jagged staircase patterns on diagonal lines
     */
    removeStaircasing(): this {
      const result = this.cloneImageData(this.imageData);
  
      for (let y = 1; y < this.height - 1; y++) {
        for (let x = 1; x < this.width - 1; x++) {
          const center = this.getPixel(x, y);
          
          // Check for staircase pattern (L-shaped configurations)
          const patterns = [
            // Pattern 1: ┐
            { check: [{dx: 0, dy: -1}, {dx: 1, dy: 0}], fill: {dx: 1, dy: -1} },
            // Pattern 2: ┌
            { check: [{dx: 0, dy: -1}, {dx: -1, dy: 0}], fill: {dx: -1, dy: -1} },
            // Pattern 3: ┘
            { check: [{dx: 0, dy: 1}, {dx: 1, dy: 0}], fill: {dx: 1, dy: 1} },
            // Pattern 4: └
            { check: [{dx: 0, dy: 1}, {dx: -1, dy: 0}], fill: {dx: -1, dy: 1} }
          ];
  
          for (const pattern of patterns) {
            const checkColors = pattern.check.map(p => 
              this.getPixel(x + p.dx, y + p.dy)
            );
            
            const diagonal = this.getPixel(x + pattern.fill.dx, y + pattern.fill.dy);
  
            // If check positions match center color and diagonal is different
            const allMatch = checkColors.every(c => 
              this.colorDistance(c, center) < 10
            );
            const diagonalDifferent = this.colorDistance(diagonal, center) > 30;
  
            if (allMatch && diagonalDifferent) {
              // Fill diagonal to smooth the staircase
              this.setPixel(x + pattern.fill.dx, y + pattern.fill.dy, center, result);
            }
          }
        }
      }
  
      this.imageData = result;
      return this;
    }
  
    /**
     * Align parallel lines to have consistent spacing
     */
    alignParallelLines(angleThreshold: number = 5): this {
      const lines = this.detectLines();
      
      // Group lines by similar angles
      const angleGroups = new Map<number, Line[]>();
      
      for (const line of lines) {
        let foundGroup = false;
        
        for (const [angle, group] of angleGroups.entries()) {
          if (Math.abs(line.angle - angle) < angleThreshold) {
            group.push(line);
            foundGroup = true;
            break;
          }
        }
        
        if (!foundGroup) {
          angleGroups.set(line.angle, [line]);
        }
      }
  
      // For each group, find average angle and realign
      for (const [baseAngle, group] of angleGroups.entries()) {
        if (group.length < 2) continue;
  
        const avgAngle = group.reduce((sum, line) => sum + line.angle, 0) / group.length;
        
        // Redraw all lines in group with average angle
        for (const line of group) {
          const rad = (avgAngle * Math.PI) / 180;
          const newEnd = {
            x: Math.round(line.start.x + Math.cos(rad) * line.length),
            y: Math.round(line.start.y + Math.sin(rad) * line.length)
          };
          
          this.redrawLines([{ ...line, angle: avgAngle, end: newEnd }]);
        }
      }
  
      return this;
    }
  
    /**
     * Vectorize and reconstruct - converts to vectors and redraws with perfect alignment
     */
    vectorizeAndReconstruct(): this {
      const contours = this.traceAndSimplifyContours(2);
      
      // Clear image
      const result = new ImageData(this.width, this.height);
      
      // Get dominant colors
      const colorCounts = new Map<string, { color: RGB; count: number }>();
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const c = this.getPixel(x, y);
          const key = `${c.r},${c.g},${c.b}`;
          const existing = colorCounts.get(key);
          if (existing) {
            existing.count++;
          } else {
            colorCounts.set(key, { color: c, count: 1 });
          }
        }
      }
  
      const dominantColors = Array.from(colorCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(e => e.color);
  
      // Fill background with most common color
      const bgColor = dominantColors[0];
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          this.setPixel(x, y, bgColor, result);
        }
      }
  
      // Redraw contours with snapped angles
      for (const contour of contours) {
        const snapped = this.snapLinesToIsometric(contour);
        for (const line of snapped) {
          const dx = line.end.x - line.start.x;
          const dy = line.end.y - line.start.y;
          const steps = Math.max(Math.abs(dx), Math.abs(dy));
          
          for (let i = 0; i <= steps; i++) {
            const t = steps === 0 ? 0 : i / steps;
            const x = Math.round(line.start.x + dx * t);
            const y = Math.round(line.start.y + dy * t);
            this.setPixel(x, y, dominantColors[1] || { r: 0, g: 0, b: 0 }, result);
          }
        }
      }
  
      this.imageData = result;
      return this;
    }
  
    /**
     * Perspective correction for isometric art
     * Corrects lines that should be at 30/60 degree angles
     */
    correctIsometricPerspective(): this {
      const lines = this.detectLines();
      
      // Isometric angles are typically 30° and 60° from horizontal
      const targetAngles = [30, 60, 150, 120, -30, -60, -150, -120];
      
      const correctedLines: Line[] = [];
      
      for (const line of lines) {
        // Normalize angle to -180 to 180
        let angle = line.angle;
        while (angle > 180) angle -= 360;
        while (angle < -180) angle += 360;
  
        // Find closest isometric angle
        let bestAngle = targetAngles[0];
        let minDiff = Math.abs(angle - targetAngles[0]);
        
        for (const target of targetAngles) {
          const diff = Math.abs(angle - target);
          if (diff < minDiff) {
            minDiff = diff;
            bestAngle = target;
          }
        }
  
        // Only correct if within tolerance
        if (minDiff < 15) {
          const rad = (bestAngle * Math.PI) / 180;
          const newEnd = {
            x: Math.round(line.start.x + Math.cos(rad) * line.length),
            y: Math.round(line.start.y + Math.sin(rad) * line.length)
          };
          correctedLines.push({ ...line, angle: bestAngle, end: newEnd });
        } else {
          correctedLines.push(line);
        }
      }
  
      // Clear and redraw
      const result = this.cloneImageData(this.imageData);
      for (const line of correctedLines) {
        const dx = line.end.x - line.start.x;
        const dy = line.end.y - line.start.y;
        const steps = Math.max(Math.abs(dx), Math.abs(dy));
        
        for (let i = 0; i <= steps; i++) {
          const t = steps === 0 ? 0 : i / steps;
          const x = Math.round(line.start.x + dx * t);
          const y = Math.round(line.start.y + dy * t);
          const original = this.getPixel(line.start.x, line.start.y);
          this.setPixel(x, y, original, result);
        }
      }
  
      this.imageData = result;
      return this;
    }
  
    /**
     * Bilateral filter - edge-preserving smoothing
     * Smooths colors while preserving sharp edges
     */
    bilateralFilter(spatialSigma: number = 3, colorSigma: number = 30): this {
      const result = this.cloneImageData(this.imageData);
      const radius = Math.ceil(spatialSigma * 2);
  
      for (let y = radius; y < this.height - radius; y++) {
        for (let x = radius; x < this.width - radius; x++) {
          const centerColor = this.getPixel(x, y);
          let sumR = 0, sumG = 0, sumB = 0, sumWeight = 0;
  
          for (let ky = -radius; ky <= radius; ky++) {
            for (let kx = -radius; kx <= radius; kx++) {
              const nx = x + kx;
              const ny = y + ky;
              const neighborColor = this.getPixel(nx, ny);
  
              // Spatial weight (Gaussian based on distance)
              const spatialDist = Math.sqrt(kx * kx + ky * ky);
              const spatialWeight = Math.exp(-(spatialDist * spatialDist) / (2 * spatialSigma * spatialSigma));
  
              // Color weight (Gaussian based on color difference)
              const colorDist = this.colorDistance(centerColor, neighborColor);
              const colorWeight = Math.exp(-(colorDist * colorDist) / (2 * colorSigma * colorSigma));
  
              const weight = spatialWeight * colorWeight;
              sumR += neighborColor.r * weight;
              sumG += neighborColor.g * weight;
              sumB += neighborColor.b * weight;
              sumWeight += weight;
            }
          }
  
          if (sumWeight > 0) {
            this.setPixel(x, y, {
              r: Math.round(sumR / sumWeight),
              g: Math.round(sumG / sumWeight),
              b: Math.round(sumB / sumWeight)
            }, result);
          }
        }
      }
  
      this.imageData = result;
      return this;
    }
  
    /**
     * Outline extraction - extracts only the outlines/borders of shapes
     */
    extractOutlines(thickness: number = 1): this {
      const result = new ImageData(this.width, this.height);
      
      // Fill with white background
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          this.setPixel(x, y, { r: 255, g: 255, b: 255 }, result);
        }
      }
  
      // Find edges
      for (let y = 1; y < this.height - 1; y++) {
        for (let x = 1; x < this.width - 1; x++) {
          const center = this.getPixel(x, y);
          
          const neighbors = [
            this.getPixel(x - 1, y), this.getPixel(x + 1, y),
            this.getPixel(x, y - 1), this.getPixel(x, y + 1)
          ];
  
          // If any neighbor is different, this is an outline pixel
          const isOutline = neighbors.some(n => 
            this.colorDistance(center, n) > 30
          );
  
          if (isOutline) {
            // Draw outline with specified thickness
            for (let ty = -thickness + 1; ty < thickness; ty++) {
              for (let tx = -thickness + 1; tx < thickness; tx++) {
                this.setPixel(x + tx, y + ty, { r: 0, g: 0, b: 0 }, result);
              }
            }
          }
        }
      }
  
      this.imageData = result;
      return this;
    }
  
    /**
     * Sub-pixel rendering correction - fixes color fringing from sub-pixel rendering
     */
    correctSubPixelRendering(): this {
      const result = this.cloneImageData(this.imageData);
  
      for (let y = 1; y < this.height - 1; y++) {
        for (let x = 2; x < this.width - 2; x++) {
          const center = this.getPixel(x, y);
          const left = this.getPixel(x - 1, y);
          const right = this.getPixel(x + 1, y);
          const left2 = this.getPixel(x - 2, y);
          const right2 = this.getPixel(x + 2, y);
  
          // Detect sub-pixel rendering pattern (color fringing)
          const leftDiff = this.colorDistance(center, left);
          const rightDiff = this.colorDistance(center, right);
          const left2Same = this.colorDistance(left, left2) < 10;
          const right2Same = this.colorDistance(right, right2) < 10;
  
          // If center is between two different colors (fringing)
          if (leftDiff > 20 && rightDiff > 20 && left2Same && right2Same) {
            // Replace with dominant neighbor
            const leftBright = left.r + left.g + left.b;
            const rightBright = right.r + right.g + right.b;
            const replacement = leftBright > rightBright ? left : right;
            this.setPixel(x, y, replacement, result);
          }
        }
      }
  
      this.imageData = result;
      return this;
    }
  
    /**
     * Pixel-perfect line drawing - redraws lines with Bresenham's algorithm
     */
    drawBresenhamLine(x0: number, y0: number, x1: number, y1: number, color: RGB): this {
      const dx = Math.abs(x1 - x0);
      const dy = Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1;
      const sy = y0 < y1 ? 1 : -1;
      let err = dx - dy;
  
      let x = x0;
      let y = y0;
  
      while (true) {
        this.setPixel(x, y, color);
  
        if (x === x1 && y === y1) break;
  
        const e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          x += sx;
        }
        if (e2 < dx) {
          err += dx;
          y += sy;
        }
      }
  
      return this;
    }
  
    /**
     * Flood fill - fills a region with a color
     */
    floodFill(startX: number, startY: number, fillColor: RGB, tolerance: number = 0): this {
      const targetColor = this.getPixel(startX, startY);
      
      if (this.colorDistance(targetColor, fillColor) < 1) {
        return this; // Already filled
      }
  
      const stack: Point[] = [{ x: startX, y: startY }];
      const visited = new Set<string>();
  
      while (stack.length > 0) {
        const point = stack.pop()!;
        const key = `${point.x},${point.y}`;
  
        if (visited.has(key)) continue;
        if (point.x < 0 || point.x >= this.width || point.y < 0 || point.y >= this.height) continue;
  
        const currentColor = this.getPixel(point.x, point.y);
        if (this.colorDistance(currentColor, targetColor) > tolerance) continue;
  
        visited.add(key);
        this.setPixel(point.x, point.y, fillColor);
  
        // Add neighbors
        stack.push({ x: point.x + 1, y: point.y });
        stack.push({ x: point.x - 1, y: point.y });
        stack.push({ x: point.x, y: point.y + 1 });
        stack.push({ x: point.x, y: point.y - 1 });
      }
  
      return this;
    }
  
    /**
     * Region growing segmentation - segments image into regions of similar colors
     */
    segmentRegions(tolerance: number = 20): Map<string, Point[]> {
      const regions = new Map<string, Point[]>();
      const visited = new Set<string>();
  
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const key = `${x},${y}`;
          if (visited.has(key)) continue;
  
          const seedColor = this.getPixel(x, y);
          const region: Point[] = [];
          const stack: Point[] = [{ x, y }];
  
          while (stack.length > 0) {
            const point = stack.pop()!;
            const pkey = `${point.x},${point.y}`;
  
            if (visited.has(pkey)) continue;
            if (point.x < 0 || point.x >= this.width || point.y < 0 || point.y >= this.height) continue;
  
            const currentColor = this.getPixel(point.x, point.y);
            if (this.colorDistance(currentColor, seedColor) > tolerance) continue;
  
            visited.add(pkey);
            region.push(point);
  
            stack.push({ x: point.x + 1, y: point.y });
            stack.push({ x: point.x - 1, y: point.y });
            stack.push({ x: point.x, y: point.y + 1 });
            stack.push({ x: point.x, y: point.y - 1 });
          }
  
          if (region.length > 0) {
            const regionKey = `region_${regions.size}`;
            regions.set(regionKey, region);
          }
        }
      }
  
      return regions;
    }
  
    /**
     * Skeleton extraction - reduces shapes to their skeletal structure
     */
    extractSkeleton(maxIterations: number = 100): this {
      let changed = true;
      let iterations = 0;
  
      while (changed && iterations < maxIterations) {
        changed = false;
        iterations++;
        const result = this.cloneImageData(this.imageData);
  
        for (let y = 1; y < this.height - 1; y++) {
          for (let x = 1; x < this.width - 1; x++) {
            const center = this.getPixel(x, y);
            const centerBright = center.r + center.g + center.b;
  
            // Only process foreground pixels
            if (centerBright < 384) { // Not white
              // Get 8-neighbors
              const neighbors = [
                this.getPixel(x, y - 1), this.getPixel(x + 1, y - 1),
                this.getPixel(x + 1, y), this.getPixel(x + 1, y + 1),
                this.getPixel(x, y + 1), this.getPixel(x - 1, y + 1),
                this.getPixel(x - 1, y), this.getPixel(x - 1, y - 1)
              ];
  
              const foregroundNeighbors = neighbors.filter(n => 
                (n.r + n.g + n.b) < 384
              ).length;
  
              // Remove if it has enough neighbors (not endpoint)
              if (foregroundNeighbors >= 2 && foregroundNeighbors <= 6) {
                // Check if removing creates a disconnection
                let transitions = 0;
                for (let i = 0; i < 8; i++) {
                  const curr = (neighbors[i].r + neighbors[i].g + neighbors[i].b) < 384;
                  const next = (neighbors[(i + 1) % 8].r + neighbors[(i + 1) % 8].g + neighbors[(i + 1) % 8].b) < 384;
                  if (!curr && next) transitions++;
                }
  
                if (transitions === 1) {
                  this.setPixel(x, y, { r: 255, g: 255, b: 255 }, result);
                  changed = true;
                }
              }
            }
          }
        }
  
        if (changed) {
          this.imageData = result;
        }
      }
  
      return this;
    }
  
    /**
     * Convex hull computation for a set of points
     */
    computeConvexHull(points: Point[]): Point[] {
      if (points.length < 3) return points;
  
      // Sort points by x-coordinate
      const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  
      // Build lower hull
      const lower: Point[] = [];
      for (const point of sorted) {
        while (lower.length >= 2 && this.cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
          lower.pop();
        }
        lower.push(point);
      }
  
      // Build upper hull
      const upper: Point[] = [];
      for (let i = sorted.length - 1; i >= 0; i--) {
        const point = sorted[i];
        while (upper.length >= 2 && this.cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
          upper.pop();
        }
        upper.push(point);
      }
  
      // Remove last point of each half because it's repeated
      lower.pop();
      upper.pop();
  
      return [...lower, ...upper];
    }
  
    private cross(o: Point, a: Point, b: Point): number {
      return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    }
  
    /**
     * Dithering reduction - removes dithering patterns and replaces with solid colors
     */
    reduceDithering(blockSize: number = 2): this {
      const result = this.cloneImageData(this.imageData);
  
      for (let y = 0; y < this.height; y += blockSize) {
        for (let x = 0; x < this.width; x += blockSize) {
          // Analyze block
          const colors: RGB[] = [];
          for (let by = 0; by < blockSize && y + by < this.height; by++) {
            for (let bx = 0; bx < blockSize && x + bx < this.width; bx++) {
              colors.push(this.getPixel(x + bx, y + by));
            }
          }
  
          // Calculate average color
          const avg = {
            r: Math.round(colors.reduce((sum, c) => sum + c.r, 0) / colors.length),
            g: Math.round(colors.reduce((sum, c) => sum + c.g, 0) / colors.length),
            b: Math.round(colors.reduce((sum, c) => sum + c.b, 0) / colors.length)
          };
  
          // Fill block with average
          for (let by = 0; by < blockSize && y + by < this.height; by++) {
            for (let bx = 0; bx < blockSize && x + bx < this.width; bx++) {
              this.setPixel(x + bx, y + by, avg, result);
            }
          }
        }
      }
  
      this.imageData = result;
      return this;
    }
  
    /**
     * Median filter - removes salt-and-pepper noise
     */
    medianFilter(kernelSize: number = 3): this {
      const result = this.cloneImageData(this.imageData);
      const radius = Math.floor(kernelSize / 2);
  
      for (let y = radius; y < this.height - radius; y++) {
        for (let x = radius; x < this.width - radius; x++) {
          const rValues: number[] = [];
          const gValues: number[] = [];
          const bValues: number[] = [];
  
          for (let ky = -radius; ky <= radius; ky++) {
            for (let kx = -radius; kx <= radius; kx++) {
              const color = this.getPixel(x + kx, y + ky);
              rValues.push(color.r);
              gValues.push(color.g);
              bValues.push(color.b);
            }
          }
  
          rValues.sort((a, b) => a - b);
          gValues.sort((a, b) => a - b);
          bValues.sort((a, b) => a - b);
  
          const mid = Math.floor(rValues.length / 2);
          this.setPixel(x, y, {
            r: rValues[mid],
            g: gValues[mid],
            b: bValues[mid]
          }, result);
        }
      }
  
      this.imageData = result;
      return this;
    }
  
    /**
     * Adaptive threshold - converts to binary based on local statistics
     */
    adaptiveThreshold(blockSize: number = 15, constant: number = 10): this {
      const result = this.cloneImageData(this.imageData);
      const radius = Math.floor(blockSize / 2);
  
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          // Calculate local mean
          let sum = 0;
          let count = 0;
  
          for (let ky = Math.max(0, y - radius); ky < Math.min(this.height, y + radius + 1); ky++) {
            for (let kx = Math.max(0, x - radius); kx < Math.min(this.width, x + radius + 1); kx++) {
              const color = this.getPixel(kx, ky);
              sum += this.colorToGray(color);
              count++;
            }
          }
  
          const mean = sum / count;
          const current = this.colorToGray(this.getPixel(x, y));
          
          const value = current > (mean - constant) ? 255 : 0;
          this.setPixel(x, y, { r: value, g: value, b: value }, result);
        }
      }
  
      this.imageData = result;
      return this;
    }
  
    /**
     * Edge enhancement using unsharp masking
     */
    enhanceEdges(amount: number = 1.5, radius: number = 1): this {
      // Create blurred version
      const blurred = this.cloneImageData(this.imageData);
      const temp = new PixelArtCleaner(blurred);
      
      // Simple box blur
      for (let i = 0; i < radius; i++) {
        temp.dilate(3).erode(3);
      }
      const blurredData = temp.getImageData();
  
      // Unsharp mask: original + amount * (original - blurred)
      const result = this.cloneImageData(this.imageData);
  
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const original = this.getPixel(x, y);
          const blur = this.getPixel(x, y, blurredData);
  
          const enhanced = {
            r: Math.max(0, Math.min(255, Math.round(original.r + amount * (original.r - blur.r)))),
            g: Math.max(0, Math.min(255, Math.round(original.g + amount * (original.g - blur.g)))),
            b: Math.max(0, Math.min(255, Math.round(original.b + amount * (original.b - blur.b))))
          };
  
          this.setPixel(x, y, enhanced, result);
        }
      }
  
      this.imageData = result;
      return this;
    }
  
    /**
     * Pattern detection - finds repeating patterns in the image
     */
    detectPatterns(patternSize: number = 8, threshold: number = 0.9): Map<string, Point[]> {
      const patterns = new Map<string, Point[]>();
  
      for (let y = 0; y < this.height - patternSize; y += patternSize) {
        for (let x = 0; x < this.width - patternSize; x += patternSize) {
          // Extract pattern
          const pattern: RGB[] = [];
          for (let py = 0; py < patternSize; py++) {
            for (let px = 0; px < patternSize; px++) {
              pattern.push(this.getPixel(x + px, y + py));
            }
          }
  
          // Search for similar patterns
          const matches: Point[] = [];
          for (let sy = 0; sy < this.height - patternSize; sy += patternSize) {
            for (let sx = 0; sx < this.width - patternSize; sx += patternSize) {
              if (sx === x && sy === y) continue;
  
              // Compare patterns
              let similarity = 0;
              for (let i = 0; i < pattern.length; i++) {
                const py = Math.floor(i / patternSize);
                const px = i % patternSize;
                const testColor = this.getPixel(sx + px, sy + py);
                const dist = this.colorDistance(pattern[i], testColor);
                similarity += 1 - (dist / 442); // 442 is max possible distance
              }
              similarity /= pattern.length;
  
              if (similarity >= threshold) {
                matches.push({ x: sx, y: sy });
              }
            }
          }
  
          if (matches.length > 0) {
            const patternKey = `pattern_${x}_${y}`;
            patterns.set(patternKey, [{ x, y }, ...matches]);
          }
        }
      }
  
      return patterns;
    }
  
    /**
     * Rotate image by 90, 180, or 270 degrees
     */
    rotate(degrees: 90 | 180 | 270): this {
      let result: ImageData;
  
      if (degrees === 90) {
        result = new ImageData(this.height, this.width);
        for (let y = 0; y < this.height; y++) {
          for (let x = 0; x < this.width; x++) {
            const color = this.getPixel(x, y);
            const newX = this.height - 1 - y;
            const newY = x;
            this.setPixel(newX, newY, color, result);
          }
        }
        this.width = result.width;
        this.height = result.height;
      } else if (degrees === 180) {
        result = new ImageData(this.width, this.height);
        for (let y = 0; y < this.height; y++) {
          for (let x = 0; x < this.width; x++) {
            const color = this.getPixel(x, y);
            const newX = this.width - 1 - x;
            const newY = this.height - 1 - y;
            this.setPixel(newX, newY, color, result);
          }
        }
      } else { // 270
        result = new ImageData(this.height, this.width);
        for (let y = 0; y < this.height; y++) {
          for (let x = 0; x < this.width; x++) {
            const color = this.getPixel(x, y);
            const newX = y;
            const newY = this.width - 1 - x;
            this.setPixel(newX, newY, color, result);
          }
        }
        this.width = result.width;
        this.height = result.height;
      }
  
      this.imageData = result;
      return this;
    }
  
    /**
     * Scale image using nearest neighbor (pixel perfect)
     */
    scaleNearestNeighbor(scaleX: number, scaleY: number): this {
      const newWidth = Math.floor(this.width * scaleX);
      const newHeight = Math.floor(this.height * scaleY);
      const result = new ImageData(newWidth, newHeight);
  
      for (let y = 0; y < newHeight; y++) {
        for (let x = 0; x < newWidth; x++) {
          const srcX = Math.floor(x / scaleX);
          const srcY = Math.floor(y / scaleY);
          const color = this.getPixel(srcX, srcY);
          this.setPixel(x, y, color, result);
        }
      }
  
      this.imageData = result;
      this.width = newWidth;
      this.height = newHeight;
      return this;
    }
  }
  
  // ============================================================================
  // USAGE EXAMPLES
  // ============================================================================
  
  /*
  // Example 1: Basic cleaning
  const cleaner = new PixelArtCleaner(myImageData);
  const cleaned = cleaner
    .removeAntiAliasing()
    .morphologicalClose()
    .getImageData();
  
  // Example 2: Isometric line fixing
  const cleaner2 = new PixelArtCleaner(myImageData, {
    isometricAngles: [0, 30, 60, 90, 120, 150]
  });
  const lines = cleaner2.detectLines();
  const snappedLines = cleaner2.snapLinesToIsometric(lines);
  cleaner2.redrawLines(snappedLines);
  const result = cleaner2.getImageData();
  
  // Example 3: Complete workflow
  const cleaner3 = new PixelArtCleaner(myImageData);
  const final = cleaner3
    .cleanIsometric()
    .getImageData();
  
  // Example 4: Analysis
  const cleaner4 = new PixelArtCleaner(myImageData);
  const analysis = cleaner4.analyze();
  console.log(`Unique colors: ${analysis.uniqueColors}`);
  console.log(`Detected lines: ${analysis.lines.length}`);
  console.log(`Corners found: ${analysis.corners.length}`);
  
  // Example 5: Custom pipeline
  const cleaner5 = new PixelArtCleaner(myImageData, {
    antiAliasingThreshold: 35,
    morphologyKernelSize: 5,
    colorClusterCount: 12
  });
  const custom = cleaner5
    .quantizeColors()
    .removeAntiAliasing()
    .morphologicalClose()
    .smoothEdges()
    .removeIsolatedPixels(2)
    .getImageData();
  */