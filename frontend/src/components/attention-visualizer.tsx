"use client";

import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AttentionResponse, getAttentionData } from "@/lib/api/attention";

// Add CSS keyframes for animations at the top level
const AnimationStyles = () => (
  <style jsx global>{`
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes drawLine {
      from {
        stroke-dashoffset: 1000;
      }
      to {
        stroke-dashoffset: 0;
      }
    }

    @keyframes scaleIn {
      from {
        transform: scale(0);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    .animate-fade-in {
      animation: fadeIn 0.8s ease-in-out forwards;
    }

    .animate-draw-line {
      stroke-dasharray: 1000;
      stroke-dashoffset: 1000;
      animation: drawLine 1.2s ease-in-out forwards;
    }

    .animate-scale-in {
      transform-origin: center;
      animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }

    .delay-100 {
      animation-delay: 100ms;
    }
    .delay-200 {
      animation-delay: 200ms;
    }
    .delay-300 {
      animation-delay: 300ms;
    }
    .delay-400 {
      animation-delay: 400ms;
    }
    .delay-500 {
      animation-delay: 500ms;
    }

    .tooltip-container {
      opacity: 0;
      transition: opacity 0.3s ease-out;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
    }

    .tooltip-container.visible {
      opacity: 1;
    }
  `}</style>
);

export function AttentionVisualizer() {
  const [text, setText] = useState(
    "Explain the difference between a dog and a cat"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attentionData, setAttentionData] = useState<AttentionResponse | null>(
    null
  );
  const [currentLayer, setCurrentLayer] = useState(0);
  const [currentHead, setCurrentHead] = useState(0);
  const [threshold, setThreshold] = useState(0);
  const [hideSpecialTokens, setHideSpecialTokens] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const svgRef = useRef<SVGSVGElement>(null);

  // Fetch attention data when requested
  const fetchAttentionData = async () => {
    setLoading(true);
    setError(null);
    setDebugInfo("");

    try {
      const response = await getAttentionData({ text });

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        console.log("Received attention data:", response.data);
        setAttentionData(response.data);
        setCurrentLayer(0);
        setCurrentHead(0);

        // Enhanced debug info
        const numLayers = response.data.num_layers || 0;
        const numHeads = response.data.num_heads || 0;
        let debugText = `Received data with ${numLayers} layers and ${numHeads} heads\n`;

        // Log data structure information
        debugText += `\nAttention data structure:\n`;
        if (response.data.attention) {
          debugText += `- Layers: ${response.data.attention.length}\n`;

          // Check if first layer exists and has heads
          if (response.data.attention.length > 0) {
            const firstLayer = response.data.attention[0];
            debugText += `- Heads in first layer: ${
              Array.isArray(firstLayer) ? firstLayer.length : "not an array"
            }\n`;

            // Check if first head in first layer exists
            if (Array.isArray(firstLayer) && firstLayer.length > 0) {
              const firstHead = firstLayer[0];
              debugText += `- First head data type: ${typeof firstHead}\n`;
              debugText += `- First head data structure: ${
                Array.isArray(firstHead)
                  ? "array of length " + firstHead.length
                  : "not an array"
              }\n`;
            }
          }
        }

        // Log sample attention weights for the first layer and head
        if (
          response.data.attention &&
          response.data.attention.length > 0 &&
          response.data.attention[0] &&
          response.data.attention[0].length > 0
        ) {
          const sampleLayer = response.data.attention[0];
          const sampleHead = sampleLayer[0];

          // Count non-zero weights in the first head
          let nonZeroCount = 0;
          let totalWeights = 0;
          let minWeight = 1;
          let maxWeight = 0;
          let sumWeights = 0;

          if (Array.isArray(sampleHead)) {
            for (const row of sampleHead) {
              if (Array.isArray(row)) {
                for (const weight of row) {
                  totalWeights++;
                  if (weight > 0) nonZeroCount++;
                  if (weight > 0 && weight < minWeight) minWeight = weight;
                  if (weight > maxWeight) maxWeight = weight;
                  sumWeights += weight;
                }
              }
            }

            debugText += `First head statistics:\n`;
            debugText += `- Non-zero weights: ${nonZeroCount}/${totalWeights} (${(
              (nonZeroCount / totalWeights) *
              100
            ).toFixed(2)}%)\n`;
            debugText += `- Min weight: ${minWeight.toExponential(4)}\n`;
            debugText += `- Max weight: ${maxWeight.toExponential(4)}\n`;
            debugText += `- Average weight: ${(
              sumWeights / totalWeights
            ).toExponential(4)}\n`;

            // Sample of weight values
            debugText += `Sample weights (first 3 tokens):\n`;
            for (let i = 0; i < Math.min(3, sampleHead.length); i++) {
              if (Array.isArray(sampleHead[i])) {
                const rowSample = sampleHead[i].slice(0, 3);
                debugText += `Token ${i}: [${rowSample
                  .map((w) => w.toExponential(4))
                  .join(", ")}...]\n`;
              }
            }
          }
        }

        setDebugInfo(debugText);
      }
    } catch (err) {
      setError(`Error fetching attention data: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // Format token for display
  const formatToken = (token: string) => {
    // Handle special tokens
    if (token.startsWith("Ġ")) return token.substring(1); // Space prefix
    if (token.startsWith("Ċ")) return "↵"; // Newline
    if (token === "[CLS]") return "[CLS]";
    if (token === "[SEP]") return "[SEP]";
    return token;
  };

  // Helper function to ensure we always have a valid number
  const ensureNumber = (value: any): number => {
    if (typeof value === "number" && !isNaN(value)) {
      return value;
    }
    return 0;
  };

  // Render the attention visualization
  useEffect(() => {
    if (!attentionData || !svgRef.current) return;

    // Add debug logging for the attention data
    console.log("Current layer:", currentLayer);
    console.log("Current head:", currentHead);

    // Update debug info with current selection
    setDebugInfo((prev) => {
      let updatedInfo = prev;
      updatedInfo += `\n\nSelected: Layer ${currentLayer + 1}, Head ${
        currentHead + 1
      }\n`;

      // Get data for the current layer and head
      const layerData = attentionData.attention[currentLayer];
      if (layerData && Array.isArray(layerData)) {
        updatedInfo += `Layer ${currentLayer} contains ${layerData.length} heads\n`;

        const headData = layerData[currentHead];
        if (headData && Array.isArray(headData)) {
          updatedInfo += `Head ${currentHead} contains ${headData.length} token rows\n`;

          // For the first few token rows, show how many columns they have
          for (let i = 0; i < Math.min(3, headData.length); i++) {
            if (Array.isArray(headData[i])) {
              updatedInfo += `Token row ${i} has ${headData[i].length} attention values\n`;
            }
          }

          // Calculate stats for this head
          let nonZeroCount = 0;
          let totalWeights = 0;
          let minWeight = 1;
          let maxWeight = 0;
          let sumWeights = 0;

          for (const row of headData) {
            if (Array.isArray(row)) {
              for (const weight of row) {
                totalWeights++;
                if (weight > 0) nonZeroCount++;
                if (weight > 0 && weight < minWeight) minWeight = weight;
                if (weight > maxWeight) maxWeight = weight;
                sumWeights += weight;
              }
            }
          }

          updatedInfo += `Current head statistics:\n`;
          updatedInfo += `- Non-zero weights: ${nonZeroCount}/${totalWeights} (${(
            (nonZeroCount / totalWeights) *
            100
          ).toFixed(2)}%)\n`;
          if (nonZeroCount > 0) {
            updatedInfo += `- Min non-zero weight: ${minWeight.toExponential(
              4
            )}\n`;
          } else {
            updatedInfo += `- Min non-zero weight: N/A (all zeros)\n`;
          }
          updatedInfo += `- Max weight: ${maxWeight.toExponential(4)}\n`;
          updatedInfo += `- Average weight: ${(
            sumWeights / totalWeights
          ).toExponential(4)}\n`;

          // Log access examples for the first few tokens
          updatedInfo += `\nWeight access examples:\n`;
          for (let i = 0; i < Math.min(3, headData.length); i++) {
            for (let j = 0; j < Math.min(3, headData[i]?.length || 0); j++) {
              const weightValue = headData[i][j];
              let formattedValue = "undefined";

              // Check if the value is a number or can be converted to one
              if (weightValue !== undefined && weightValue !== null) {
                if (typeof weightValue === "number") {
                  formattedValue = weightValue.toExponential(4);
                } else if (typeof weightValue === "string") {
                  try {
                    const numberValue = parseFloat(weightValue);
                    formattedValue = numberValue.toExponential(4);
                  } catch (e) {
                    formattedValue = `"${weightValue}" (string)`;
                  }
                } else {
                  formattedValue = `${weightValue} (${typeof weightValue})`;
                }
              }

              updatedInfo += `headData[${i}][${j}] = ${formattedValue}\n`;
            }
          }
        }
      }

      return updatedInfo;
    });

    // Check the full attention data structure
    if (attentionData && attentionData.attention) {
      console.log("Attention data shape:", {
        layers: attentionData.attention.length,
        heads: attentionData.attention[0]?.length,
        queryTokens: attentionData.attention[0]?.[0]?.length,
        keyTokens: attentionData.attention[0]?.[0]?.[0]?.length,
      });

      // Log a sample of weights from the current layer and head
      if (
        attentionData.attention[currentLayer] &&
        attentionData.attention[currentLayer][currentHead]
      ) {
        console.log("Sample weights from first few tokens:");
        const sampleRows = attentionData.attention[currentLayer][
          currentHead
        ].slice(0, 3);
        sampleRows.forEach((row, i) => {
          console.log(`Token ${i} attention:`, row.slice(0, 5));

          // Check if there are any non-zero weights in this row
          const nonZeroCount = row.filter((w) => w > 0).length;
          console.log(
            `Token ${i} has ${nonZeroCount} non-zero weights out of ${row.length}`
          );

          // Log the maximum weight in this row
          if (row.length > 0) {
            const maxWeight = Math.max(
              ...row.map((w) => (typeof w === "number" ? w : 0))
            );
            console.log(`Token ${i} max weight: ${maxWeight}`);
          }
        });
      }
    }

    // Validate the attention data structure
    if (
      !attentionData.attention ||
      !Array.isArray(attentionData.attention) ||
      attentionData.attention.length === 0
    ) {
      setError("Invalid attention data: missing or empty attention array");
      return;
    }

    // Ensure we have a valid layer index
    const validLayerIndex = Math.min(
      currentLayer,
      attentionData.attention.length - 1
    );
    if (validLayerIndex !== currentLayer) {
      setCurrentLayer(validLayerIndex);
      return;
    }

    // Get layer data
    const layerData = attentionData.attention[validLayerIndex];
    if (!layerData || !Array.isArray(layerData) || layerData.length === 0) {
      setError(`Invalid attention data for layer ${validLayerIndex}`);
      return;
    }

    // Ensure we have a valid head index
    const validHeadIndex = Math.min(currentHead, layerData.length - 1);
    if (validHeadIndex !== currentHead) {
      setCurrentHead(validHeadIndex);
      return;
    }

    // Get head data
    const headData = layerData[validHeadIndex];
    if (!headData || !Array.isArray(headData)) {
      setError(
        `Invalid attention data for head ${validHeadIndex} in layer ${validLayerIndex}`
      );
      return;
    }

    // Clear SVG
    const svg = svgRef.current;
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    // Filter tokens if hide special tokens is enabled
    let tokens = [...attentionData.tokens];
    let filteredIndices: number[] = [];

    if (hideSpecialTokens) {
      // Get indices of non-special tokens
      filteredIndices = tokens
        .map((token, idx) =>
          token === "[CLS]" || token === "[SEP]" ? -1 : idx
        )
        .filter((idx) => idx !== -1);
      tokens = tokens.filter((token) => token !== "[CLS]" && token !== "[SEP]");
    } else {
      filteredIndices = tokens.map((_, idx) => idx);
    }

    // Setup dimensions
    const svgWidth = svg.clientWidth;
    const svgHeight = Math.max(1000, tokens.length * 60 + 160); // Even taller
    svg.setAttribute("height", svgHeight.toString());

    // Column width for tokens
    const columnWidth = 220; // Wider columns
    const startX1 = svgWidth / 2 - columnWidth - 100; // More space between columns
    const startX2 = svgWidth / 2 + 100;
    const verticalGap = 60; // More spacing between tokens
    const startY = 140; // More top padding

    // Create a group for all elements to ensure proper rendering
    const mainGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    mainGroup.setAttribute("class", "animate-fade-in");
    svg.appendChild(mainGroup);

    // Create a subtle grid pattern in the background
    const gridGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    gridGroup.setAttribute("opacity", "0.05");
    mainGroup.appendChild(gridGroup);

    // Horizontal grid lines
    for (let y = startY - 60; y <= svgHeight; y += 60) {
      const gridLine = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      gridLine.setAttribute("x1", "0");
      gridLine.setAttribute("y1", y.toString());
      gridLine.setAttribute("x2", svgWidth.toString());
      gridLine.setAttribute("y2", y.toString());
      gridLine.setAttribute("stroke", "currentColor");
      gridLine.setAttribute("stroke-width", "1");
      gridGroup.appendChild(gridLine);
    }

    // Vertical grid lines
    for (let x = 100; x <= svgWidth - 100; x += 100) {
      const gridLine = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      gridLine.setAttribute("x1", x.toString());
      gridLine.setAttribute("y1", "0");
      gridLine.setAttribute("x2", x.toString());
      gridLine.setAttribute("y2", svgHeight.toString());
      gridLine.setAttribute("stroke", "currentColor");
      gridLine.setAttribute("stroke-width", "1");
      gridGroup.appendChild(gridLine);
    }

    // Create layers for proper rendering order
    const linesGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    const tokensGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    mainGroup.appendChild(linesGroup);
    mainGroup.appendChild(tokensGroup);

    // Create labels for "query" and "key" with monochrome styling
    const queryLabel = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    queryLabel.setAttribute("x", startX1.toString());
    queryLabel.setAttribute("y", (startY - 60).toString());
    queryLabel.setAttribute("font-size", "24");
    queryLabel.setAttribute("fill", "currentColor");
    queryLabel.setAttribute("font-weight", "bold");
    queryLabel.setAttribute("font-family", "system-ui, sans-serif");
    queryLabel.textContent = "query";
    tokensGroup.appendChild(queryLabel);

    const keyLabel = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    keyLabel.setAttribute("x", startX2.toString());
    keyLabel.setAttribute("y", (startY - 60).toString());
    keyLabel.setAttribute("font-size", "24");
    keyLabel.setAttribute("fill", "currentColor");
    keyLabel.setAttribute("font-weight", "bold");
    keyLabel.setAttribute("font-family", "system-ui, sans-serif");
    keyLabel.textContent = "key";
    tokensGroup.appendChild(keyLabel);

    // Track count of lines drawn for debugging
    let linesDrawnCount = 0;

    // Draw tokens and connections
    const tokenElements: { left: SVGTextElement[]; right: SVGTextElement[] } = {
      left: [],
      right: [],
    };

    // Draw all tokens on both sides
    tokens.forEach((token, tokenIndex) => {
      const y = startY + tokenIndex * verticalGap;
      const displayToken = formatToken(token);

      // Left token (query)
      const leftToken = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      leftToken.setAttribute("x", startX1.toString());
      leftToken.setAttribute("y", y.toString());
      leftToken.setAttribute("text-anchor", "start");
      leftToken.setAttribute("font-size", "20"); // Even larger font
      leftToken.setAttribute("font-family", "monospace");
      leftToken.setAttribute("fill", "currentColor");
      leftToken.setAttribute("class", "animate-fade-in");
      leftToken.setAttribute("style", `animation-delay: ${tokenIndex * 50}ms`);
      leftToken.textContent = displayToken;
      tokensGroup.appendChild(leftToken);
      tokenElements.left.push(leftToken);

      // Right token (key)
      const rightToken = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      rightToken.setAttribute("x", startX2.toString());
      rightToken.setAttribute("y", y.toString());
      rightToken.setAttribute("text-anchor", "start");
      rightToken.setAttribute("font-size", "20"); // Even larger font
      rightToken.setAttribute("font-family", "monospace");
      rightToken.setAttribute("fill", "currentColor");
      rightToken.setAttribute("class", "animate-fade-in");
      rightToken.setAttribute("style", `animation-delay: ${tokenIndex * 50}ms`);
      rightToken.textContent = displayToken;
      tokensGroup.appendChild(rightToken);
      tokenElements.right.push(rightToken);
    });

    // First collect all connections we want to draw
    type ConnectionInfo = {
      fromIndex: number;
      toIndex: number;
      weight: number;
      startX1: number;
      startY1: number;
      startX2: number;
      startY2: number;
    };

    const connectionsToRender: ConnectionInfo[] = [];

    // Collect line data first
    tokens.forEach((_, queryIndex) => {
      const originalQueryIndex = filteredIndices[queryIndex];

      tokens.forEach((_, keyIndex) => {
        const originalKeyIndex = filteredIndices[keyIndex];

        // Safety check for array bounds
        if (
          originalQueryIndex < 0 ||
          originalKeyIndex < 0 ||
          originalQueryIndex >= headData.length
        ) {
          return;
        }

        // Get attention weight
        let rawWeight = 0;
        try {
          // For the first few tokens, log the structure to help debugging
          if (queryIndex < 3 && keyIndex < 3) {
            console.log(`Accessing attention at [${queryIndex}][${keyIndex}]`, {
              headDataLength: Array.isArray(headData)
                ? headData.length
                : "not an array",
              sampleRow: headData[queryIndex]
                ? Array.isArray(headData[queryIndex])
                  ? `array of length ${headData[queryIndex].length}`
                  : `not an array (${typeof headData[queryIndex]})`
                : "undefined",
              filteredIndices: {
                queryIndex,
                keyIndex,
                originalQueryIndex,
                originalKeyIndex,
              },
            });
          }

          // Direct access - the backend has already formatted the data correctly
          const weightValue = Array.isArray(headData[queryIndex])
            ? headData[queryIndex][keyIndex]
            : 0;

          // Ensure we have a valid number
          rawWeight =
            typeof weightValue === "number"
              ? weightValue
              : typeof weightValue === "string"
              ? parseFloat(weightValue)
              : 0;
        } catch (e) {
          console.error("Error accessing attention weight:", e, {
            queryIndex,
            keyIndex,
            originalQueryIndex,
            originalKeyIndex,
          });
          rawWeight = 0;
        }

        const weight = rawWeight;

        // Skip if below threshold
        if (weight < threshold) return;

        // Calculate positions - adjust to make lines reach the words
        const startY1 = startY + queryIndex * verticalGap;
        const startY2 = startY + keyIndex * verticalGap;

        // Get the length of the query token text to adjust endpoint correctly
        const queryToken = tokens[queryIndex];
        const queryTokenLength = queryToken.length * 8; // Approximate width based on character count

        // Store connection info for rendering - fixed to reach text
        connectionsToRender.push({
          fromIndex: queryIndex,
          toIndex: keyIndex,
          weight,
          startX1: startX1 + queryTokenLength + 5, // Dynamic adjustment based on word length
          startY1,
          startX2: startX2 + 5, // Adjusted to touch the word beginning
          startY2,
        });
      });
    });

    console.log(
      `Found ${connectionsToRender.length} connections above threshold ${threshold}`
    );
    setDebugInfo(
      (prev) =>
        `${prev}\nFound ${connectionsToRender.length} connections above threshold ${threshold}`
    );

    // Create maps to track lines connected to each token
    const queryLineMap: Map<number, SVGLineElement[]> = new Map();
    const keyLineMap: Map<number, SVGLineElement[]> = new Map();

    // Function to create a bezier path between two points
    const createBezierPath = (
      x1: number,
      y1: number,
      x2: number,
      y2: number
    ): string => {
      const controlPointX1 = x1 + (x2 - x1) / 3;
      const controlPointX2 = x1 + (2 * (x2 - x1)) / 3;
      return `M ${x1} ${y1} C ${controlPointX1} ${y1}, ${controlPointX2} ${y2}, ${x2} ${y2}`;
    };

    // Draw all the lines
    connectionsToRender.forEach((connection, index) => {
      const { fromIndex, toIndex, weight, startX1, startY1, startX2, startY2 } =
        connection;

      // Create gradient definition
      const gradientId = `gradient-${fromIndex}-${toIndex}`;
      const gradient = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "linearGradient"
      );
      gradient.setAttribute("id", gradientId);
      gradient.setAttribute("x1", "0%");
      gradient.setAttribute("y1", "0%");
      gradient.setAttribute("x2", "100%");
      gradient.setAttribute("y2", "0%");

      const stop1 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "stop"
      );
      stop1.setAttribute("offset", "0%");
      stop1.setAttribute("stop-color", "hsl(var(--primary) / 0.7)");

      const stop2 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "stop"
      );
      stop2.setAttribute("offset", "100%");
      stop2.setAttribute("stop-color", "hsl(var(--primary) / 0.3)");

      gradient.appendChild(stop1);
      gradient.appendChild(stop2);

      // Add the gradient to defs
      let defs = svg.querySelector("defs");
      if (!defs) {
        defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        svg.appendChild(defs);
      }
      defs.appendChild(gradient);

      // Create a curved path instead of a straight line
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      path.setAttribute(
        "d",
        createBezierPath(startX1, startY1, startX2, startY2)
      );

      // Calculate opacity based on attention weight
      const opacityScale = 100;
      const opacity = Math.min(0.9, Math.max(0.05, weight * opacityScale));

      // Use the gradient with appropriate opacity
      path.setAttribute("stroke", `url(#${gradientId})`);
      path.setAttribute("stroke-opacity", opacity.toString());
      path.setAttribute("stroke-width", Math.max(0.5, weight * 8).toString()); // Wider lines
      path.setAttribute("fill", "none");
      path.setAttribute("stroke-linecap", "round"); // Rounded ends
      path.setAttribute("data-weight", weight.toFixed(3));
      path.setAttribute("data-from", tokens[fromIndex]);
      path.setAttribute("data-to", tokens[toIndex]);
      path.setAttribute("data-opacity", opacity.toString());
      path.setAttribute("data-from-index", fromIndex.toString());
      path.setAttribute("data-to-index", toIndex.toString());
      path.setAttribute("class", "attention-path");

      // Add to lines group
      linesGroup.appendChild(path);
      linesDrawnCount++;

      // Store reference for highlighting
      if (!queryLineMap.has(fromIndex)) {
        queryLineMap.set(fromIndex, []);
      }
      queryLineMap.get(fromIndex)?.push(path as any);

      if (!keyLineMap.has(toIndex)) {
        keyLineMap.set(toIndex, []);
      }
      keyLineMap.get(toIndex)?.push(path as any);
    });

    // Function to calculate the midpoint of a bezier curve properly
    const calculateBezierMidpoint = (
      pathData: string
    ): { x: number; y: number } => {
      const match = pathData.match(
        /M ([0-9.]+) ([0-9.]+) C ([0-9.]+) ([0-9.]+), ([0-9.]+) ([0-9.]+), ([0-9.]+) ([0-9.]+)/
      );

      if (match && match.length >= 9) {
        // Parse all points from the bezier curve
        const x0 = parseFloat(match[1]); // Start x
        const y0 = parseFloat(match[2]); // Start y
        const x1 = parseFloat(match[3]); // First control point x
        const y1 = parseFloat(match[4]); // First control point y
        const x2 = parseFloat(match[5]); // Second control point x
        const y2 = parseFloat(match[6]); // Second control point y
        const x3 = parseFloat(match[7]); // End x
        const y3 = parseFloat(match[8]); // End y

        // For visual clarity, position the tooltip above the curve at a point
        // that appears visually in the middle of the path, not mathematically at t=0.5
        // Use t=0.4 for better visual centering since the curve bends
        const t = 0.4;
        const mt = 1 - t;
        const mt2 = mt * mt;
        const mt3 = mt2 * mt;
        const t2 = t * t;
        const t3 = t2 * t;

        const x = mt3 * x0 + 3 * mt2 * t * x1 + 3 * mt * t2 * x2 + t3 * x3;
        const y = mt3 * y0 + 3 * mt2 * t * y1 + 3 * mt * t2 * y2 + t3 * y3 - 10; // Apply offset upward

        return { x, y };
      }

      // Fallback if path parsing fails
      return { x: 0, y: 0 };
    };

    // Function to sort paths by weight for a token
    const sortPathsByWeight = (paths: SVGElement[]): SVGElement[] => {
      return [...paths].sort((a, b) => {
        const weightA = parseFloat(a.getAttribute("data-weight") || "0");
        const weightB = parseFloat(b.getAttribute("data-weight") || "0");
        return weightB - weightA; // Sort in descending order (highest weights first)
      });
    };

    // Function to show/hide connections based on token hover
    const toggleConnections = (
      isHovering: boolean,
      tokenIndex: number,
      isQuery: boolean
    ) => {
      // First, set all paths to almost invisible
      const allPaths = svg.querySelectorAll(".attention-path");

      if (isHovering) {
        // When hovering, make other connections nearly invisible
        allPaths.forEach((path) => {
          path.setAttribute("stroke-opacity", "0.05");
          path.setAttribute("stroke-width", "0.5");
          // Reset any animation classes
          path.classList.remove("animate-draw-line");
        });

        // Then highlight only the relevant connections
        const relevantPaths = isQuery
          ? queryLineMap.get(tokenIndex) || []
          : keyLineMap.get(tokenIndex) || [];

        // Sort paths by weight and filter out zero weights
        const sortedPaths = sortPathsByWeight(relevantPaths).filter((path) => {
          const weight = parseFloat(path.getAttribute("data-weight") || "0");

          // Skip connections with zero weight
          if (weight <= 0) return false;

          // Skip connections between the same token on both sides
          const fromIndex = parseInt(
            path.getAttribute("data-from-index") || "-1"
          );
          const toIndex = parseInt(path.getAttribute("data-to-index") || "-1");
          if (fromIndex === toIndex) return false;

          return true;
        });

        // Create a tooltip group that will hold all tooltips together
        const tooltipGroup = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g"
        );
        tooltipGroup.setAttribute("class", "attention-tooltip-group");
        tokensGroup.appendChild(tooltipGroup);

        // Highlight each connection and add tooltips
        sortedPaths.forEach((path, idx) => {
          const weight = parseFloat(path.getAttribute("data-weight") || "0");
          const originalWidth = Math.max(0.5, weight * 8);

          // Make this path visible and emphasized
          path.setAttribute("stroke-opacity", "0.9");
          path.setAttribute(
            "stroke-width",
            Math.max(2, originalWidth).toString()
          );

          // Add animation on hover
          path.classList.add("animate-draw-line");
          const animationDelay = idx * 50; // Stagger the animations
          path.setAttribute("style", `animation-delay: ${animationDelay}ms`);

          // Add glow effect
          path.setAttribute(
            "filter",
            "drop-shadow(0 0 4px white) drop-shadow(0 0 2px hsl(var(--primary)))"
          );

          // Highlight the other token this path connects to
          const otherTokenIndex = isQuery
            ? parseInt(path.getAttribute("data-to-index") || "0")
            : parseInt(path.getAttribute("data-from-index") || "0");

          const otherTokenElement = isQuery
            ? tokenElements.right[otherTokenIndex]
            : tokenElements.left[otherTokenIndex];

          if (otherTokenElement) {
            otherTokenElement.setAttribute("font-weight", "bold");
            otherTokenElement.setAttribute("font-size", "24");
          }

          // Get path data and calculate proper position for the tooltip
          const pathData = path.getAttribute("d") || "";
          const pathLength = (path as any).getTotalLength
            ? (path as any).getTotalLength()
            : 300;
          const positionFactor = 0.4; // Position tooltip at 40% along the path
          const positionAlongPath = positionFactor * pathLength;

          // Get point along the path
          let tooltipPoint;
          if ((path as any).getPointAtLength) {
            tooltipPoint = (path as any).getPointAtLength(positionAlongPath);
          } else {
            // Fallback to bezier calculation
            tooltipPoint = calculateBezierMidpoint(pathData);
          }

          // Format weight for display
          let formattedWeight = "";
          if (weight < 0.001) {
            formattedWeight = weight.toExponential(1); // Shorter format, only 1 decimal place
          } else {
            formattedWeight = weight.toFixed(2); // Only 2 decimal places for smaller display
          }

          // Create a single container for the tooltip to keep animations in sync
          const tooltipContainer = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g"
          );
          tooltipContainer.setAttribute("class", "tooltip-container");
          tooltipGroup.appendChild(tooltipContainer);

          // Create tooltip background - much smaller
          const textWidth = Math.max(formattedWeight.length * 6 + 6, 16); // Minimal padding
          const tooltipBg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect"
          );
          tooltipBg.setAttribute(
            "x",
            (tooltipPoint.x - textWidth / 2).toString()
          );
          tooltipBg.setAttribute("y", (tooltipPoint.y - 10).toString()); // Position closer to line
          tooltipBg.setAttribute("width", textWidth.toString());
          tooltipBg.setAttribute("height", "16"); // Smaller height
          tooltipBg.setAttribute("rx", "8"); // Rounded corners that match the height
          tooltipBg.setAttribute("fill", "rgba(25, 25, 25, 0.85)"); // Dark background for contrast
          tooltipBg.setAttribute("stroke", "none");
          tooltipContainer.appendChild(tooltipBg);

          // Create tooltip text - smaller but more legible
          const tooltip = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
          );
          tooltip.setAttribute("x", tooltipPoint.x.toString());
          tooltip.setAttribute("y", (tooltipPoint.y + 2.5).toString()); // Adjusted for the smaller box
          tooltip.setAttribute("text-anchor", "middle");
          tooltip.setAttribute("font-size", "10"); // Much smaller text
          tooltip.setAttribute("font-family", "system-ui, sans-serif");
          tooltip.setAttribute("font-weight", "600"); // Slightly bolder for legibility
          tooltip.setAttribute("fill", "rgba(255, 255, 255, 0.95)"); // White text with high contrast
          tooltip.setAttribute("pointer-events", "none");
          tooltip.textContent = formattedWeight;
          tooltipContainer.appendChild(tooltip);

          // Add animation end listener to show the tooltip after the line is drawn
          const animationEndHandler = () => {
            // Instead of changing opacity directly and separately for each element,
            // we'll add the visible class to the container which triggers a CSS transition
            tooltipContainer.classList.add("visible");
            path.removeEventListener("animationend", animationEndHandler);
          };

          path.addEventListener("animationend", animationEndHandler);
        });
      } else {
        // When no longer hovering, restore all paths to their original state
        allPaths.forEach((path) => {
          const weight = parseFloat(path.getAttribute("data-weight") || "0");
          const originalWidth = Math.max(0.5, weight * 8);
          const originalOpacity = path.getAttribute("data-opacity") || "0.1";

          path.setAttribute("stroke-opacity", originalOpacity);
          path.setAttribute("stroke-width", originalWidth.toString());
          path.removeAttribute("filter");
          path.classList.remove("animate-draw-line");
          path.removeAttribute("style");
        });

        // Reset all tokens to their original state
        tokens.forEach((_, idx) => {
          if (tokenElements.left[idx]) {
            tokenElements.left[idx].removeAttribute("font-weight");
            tokenElements.left[idx].setAttribute("font-size", "20");
          }
          if (tokenElements.right[idx]) {
            tokenElements.right[idx].removeAttribute("font-weight");
            tokenElements.right[idx].setAttribute("font-size", "20");
          }
        });

        // Remove all tooltips and connector lines
        removeAllTooltips();
      }
    };

    // Function to remove all tooltips
    const removeAllTooltips = () => {
      const tooltips = svg.querySelectorAll(
        ".attention-tooltip, .attention-tooltip-bg, .attention-tooltip-connector, .attention-tooltip-group"
      );
      tooltips.forEach((tooltip) => tooltip.parentNode?.removeChild(tooltip));
    };

    // Update token hover functionality for paths instead of lines
    tokens.forEach((_, tokenIndex) => {
      // Add hover handlers to left (query) tokens
      if (tokenElements.left[tokenIndex]) {
        tokenElements.left[tokenIndex].style.cursor = "pointer";

        tokenElements.left[tokenIndex].addEventListener("mouseenter", () => {
          removeAllTooltips();

          // Highlight the token
          tokenElements.left[tokenIndex].setAttribute("font-weight", "bold");
          tokenElements.left[tokenIndex].setAttribute("font-size", "24"); // Enlarge on hover

          // Show only this token's connections and hide others
          toggleConnections(true, tokenIndex, true);
        });

        tokenElements.left[tokenIndex].addEventListener("mouseleave", () => {
          // Restore token styling
          tokenElements.left[tokenIndex].removeAttribute("font-weight");
          tokenElements.left[tokenIndex].setAttribute("font-size", "20");

          // Restore all connections
          toggleConnections(false, tokenIndex, true);
        });
      }

      // Add similar hover handlers to right (key) tokens
      if (tokenElements.right[tokenIndex]) {
        tokenElements.right[tokenIndex].style.cursor = "pointer";

        tokenElements.right[tokenIndex].addEventListener("mouseenter", () => {
          removeAllTooltips();

          // Highlight the token
          tokenElements.right[tokenIndex].setAttribute("font-weight", "bold");
          tokenElements.right[tokenIndex].setAttribute("font-size", "24");

          // Show only this token's connections and hide others
          toggleConnections(true, tokenIndex, false);
        });

        tokenElements.right[tokenIndex].addEventListener("mouseleave", () => {
          // Restore token styling
          tokenElements.right[tokenIndex].removeAttribute("font-weight");
          tokenElements.right[tokenIndex].setAttribute("font-size", "20");

          // Restore all connections
          toggleConnections(false, tokenIndex, false);
        });
      }
    });

    // Add debug info
    const debugText = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    debugText.setAttribute("x", "10");
    debugText.setAttribute("y", (svgHeight - 20).toString());
    debugText.setAttribute("font-size", "12");
    debugText.setAttribute("fill", "#666");
    debugText.textContent = `Lines drawn: ${linesDrawnCount}`;
    mainGroup.appendChild(debugText);

    setDebugInfo(
      (prev) => `${prev}\nLines successfully drawn: ${linesDrawnCount}`
    );
  }, [attentionData, currentLayer, currentHead, threshold, hideSpecialTokens]);

  // Generate layer tabs
  const generateLayerTabs = () => {
    if (!attentionData || !attentionData.num_layers) return null;

    // Create rows with 4 layers each
    const numLayers = attentionData.num_layers;
    const rows = Math.ceil(numLayers / 4);
    const layerRows = Array.from({ length: rows }, (_, rowIdx) => {
      const startIdx = rowIdx * 4;
      const endIdx = Math.min(startIdx + 4, numLayers);
      return Array.from(
        { length: endIdx - startIdx },
        (_, idx) => startIdx + idx
      );
    });

    return (
      <Tabs
        value={currentLayer.toString()}
        onValueChange={(v: string) => setCurrentLayer(parseInt(v))}
      >
        <div className="mb-4 space-y-2">
          {layerRows.map((row, rowIdx) => (
            <TabsList key={`row-${rowIdx}`} className="w-full flex gap-2">
              {row.map((layerIdx) => (
                <TabsTrigger
                  key={layerIdx}
                  value={layerIdx.toString()}
                  className="flex-1 min-w-[80px]"
                >
                  Layer {layerIdx + 1}
                </TabsTrigger>
              ))}
              {/* Add empty placeholders to maintain grid alignment */}
              {rowIdx === layerRows.length - 1 &&
                row.length < 4 &&
                Array.from({ length: 4 - row.length }, (_, idx) => (
                  <div
                    key={`placeholder-${idx}`}
                    className="flex-1 min-w-[80px]"
                  ></div>
                ))}
            </TabsList>
          ))}
        </div>
      </Tabs>
    );
  };

  // Generate head tabs
  const generateHeadTabs = () => {
    if (!attentionData || !attentionData.num_heads) return null;

    // Create rows with 4 heads each
    const numHeads = attentionData.num_heads;
    const rows = Math.ceil(numHeads / 4);
    const headRows = Array.from({ length: rows }, (_, rowIdx) => {
      const startIdx = rowIdx * 4;
      const endIdx = Math.min(startIdx + 4, numHeads);
      return Array.from(
        { length: endIdx - startIdx },
        (_, idx) => startIdx + idx
      );
    });

    return (
      <Tabs
        value={currentHead.toString()}
        onValueChange={(v: string) => setCurrentHead(parseInt(v))}
      >
        <div className="mb-4 space-y-2">
          {headRows.map((row, rowIdx) => (
            <TabsList key={`row-${rowIdx}`} className="w-full flex gap-2">
              {row.map((headIdx) => (
                <TabsTrigger
                  key={headIdx}
                  value={headIdx.toString()}
                  className="flex-1 min-w-[80px]"
                >
                  Head {headIdx + 1}
                </TabsTrigger>
              ))}
              {/* Add empty placeholders to maintain grid alignment */}
              {rowIdx === headRows.length - 1 &&
                row.length < 4 &&
                Array.from({ length: 4 - row.length }, (_, idx) => (
                  <div
                    key={`placeholder-${idx}`}
                    className="flex-1 min-w-[80px]"
                  ></div>
                ))}
            </TabsList>
          ))}
        </div>
      </Tabs>
    );
  };

  return (
    <div className="space-y-8">
      <AnimationStyles />
      <Card className="shadow-lg border dark:border-slate-800">
        <CardContent className="pt-8 px-6">
          <div className="flex flex-col space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Enter text to visualize attention"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-grow text-lg py-6"
              />
              <Button
                onClick={fetchAttentionData}
                disabled={loading || !text.trim()}
                size="lg"
                className="text-lg py-6 px-8"
              >
                {loading ? "Loading..." : "Visualize Attention"}
              </Button>
            </div>
            {error && (
              <div className="text-destructive text-sm p-4 border border-destructive/20 rounded-lg bg-destructive/10">
                {error}
              </div>
            )}
            {attentionData && (
              <div className="space-y-8">
                <div className="flex flex-wrap gap-6 items-center p-4 border rounded-lg">
                  <div className="space-y-2 flex-grow">
                    <Label className="text-lg">
                      Attention Threshold: {threshold.toFixed(2)}
                    </Label>
                    <Slider
                      value={[threshold]}
                      min={0}
                      max={0.5}
                      step={0.01}
                      className="py-4"
                      onValueChange={(values: number[]) =>
                        setThreshold(values[0])
                      }
                    />
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border">
                    <Checkbox
                      id="hideSpecial"
                      checked={hideSpecialTokens}
                      className="w-5 h-5"
                      onCheckedChange={(checked: boolean | "indeterminate") =>
                        setHideSpecialTokens(checked === true)
                      }
                    />
                    <Label
                      htmlFor="hideSpecial"
                      className="cursor-pointer text-lg"
                    >
                      Hide Special Tokens
                    </Label>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg">
                  <div>
                    <Label className="text-xl mb-3 block font-bold">
                      Layer
                    </Label>
                    {generateLayerTabs()}
                  </div>
                  <div>
                    <Label className="text-xl mb-3 block font-bold">Head</Label>
                    {generateHeadTabs()}
                  </div>
                </div>
                <div className="border rounded-lg p-6 overflow-x-auto shadow-sm bg-card">
                  <svg
                    ref={svgRef}
                    width="100%"
                    height="1000"
                    className="w-full min-w-[900px]"
                  ></svg>
                </div>
                {/* Debug info panel at the bottom */}
                {debugInfo && (
                  <div className="text-muted-foreground text-xs p-2 border border-border rounded max-h-[300px] overflow-y-auto">
                    <h3 className="font-bold mb-1">Debug Information</h3>
                    <pre className="whitespace-pre-wrap">{debugInfo}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
