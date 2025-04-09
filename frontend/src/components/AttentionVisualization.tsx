import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface AttentionData {
  attention: number[][][][];
  left_text: string[];
  right_text: string[];
}

interface AttentionVisualizationProps {
  data: AttentionData;
  layer: number;
  onLayerChange: (layer: number) => void;
}

const TEXT_SIZE = 15;
const BOXWIDTH = 110;
const BOXHEIGHT = 22.5;
const MATRIX_WIDTH = 115;
const CHECKBOX_SIZE = 20;
const TEXT_TOP = 30;

const AttentionVisualization: React.FC<AttentionVisualizationProps> = ({ data, layer, onLayerChange }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [headVisibility, setHeadVisibility] = useState<boolean[]>(new Array(data.attention[0].length).fill(true));

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const height = Math.max(data.left_text.length, data.right_text.length) * BOXHEIGHT + TEXT_TOP;
    svg.attr("width", "100%")
       .attr("height", height + "px");

    // Create color scale for heads
    const headColors = d3.scaleOrdinal(d3.schemeCategory10);

    // Render text and attention
    renderText(svg, data.left_text, true, data.attention[layer], 0, headColors, headVisibility);
    renderText(svg, data.right_text, false, data.attention[layer], MATRIX_WIDTH + BOXWIDTH, headColors, headVisibility);
    renderAttention(svg, data.attention[layer], headColors, headVisibility);
    drawCheckboxes(svg, headColors, headVisibility, setHeadVisibility);

  }, [data, layer, headVisibility]);

  return (
    <div className="attention-visualization">
      <div className="controls">
        <select 
          value={layer} 
          onChange={(e) => onLayerChange(Number(e.target.value))}
        >
          {data.attention.map((_, i) => (
            <option key={i} value={i}>Layer {i}</option>
          ))}
        </select>
      </div>
      <svg ref={svgRef}></svg>
    </div>
  );
};

// Helper functions for rendering
function renderText(
  svg: d3.Selection<SVGSVGElement | null, unknown, null, undefined>,
  text: string[],
  isLeft: boolean,
  attention: number[][][],
  leftPos: number,
  headColors: d3.ScaleOrdinal<string, string>,
  headVisibility: boolean[]
) {
  const textContainer = svg.append("g")
    .attr("id", isLeft ? "left" : "right");

  // Add attention boxes
  textContainer.append("g")
    .classed("attentionBoxes", true)
    .selectAll("g")
    .data(attention)
    .enter()
    .append("g")
    .attr("head-index", (_, i) => i)
    .selectAll("rect")
    .data(d => isLeft ? d : transpose(d))
    .enter()
    .append("rect")
    .attr("x", function() {
      const headIndex = +this.parentNode.getAttribute("head-index");
      return leftPos + boxOffsets(headIndex, headVisibility);
    })
    .attr("y", () => BOXHEIGHT)
    .attr("width", BOXWIDTH / activeHeads(headVisibility))
    .attr("height", BOXHEIGHT)
    .attr("fill", function() {
      return headColors(+this.parentNode.getAttribute("head-index"));
    })
    .style("opacity", 0.0);

  // Add token text
  const tokenContainer = textContainer.append("g")
    .selectAll("g")
    .data(text)
    .enter()
    .append("g");

  tokenContainer.append("rect")
    .classed("background", true)
    .style("opacity", 0.0)
    .attr("fill", "lightgray")
    .attr("x", leftPos)
    .attr("y", (_, i) => TEXT_TOP + i * BOXHEIGHT)
    .attr("width", BOXWIDTH)
    .attr("height", BOXHEIGHT);

  const textEl = tokenContainer.append("text")
    .text(d => d)
    .attr("font-size", TEXT_SIZE + "px")
    .style("cursor", "default")
    .style("-webkit-user-select", "none")
    .attr("x", leftPos)
    .attr("y", (_, i) => TEXT_TOP + i * BOXHEIGHT);

  if (isLeft) {
    textEl.style("text-anchor", "end")
      .attr("dx", BOXWIDTH - 0.5 * TEXT_SIZE)
      .attr("dy", TEXT_SIZE);
  } else {
    textEl.style("text-anchor", "start")
      .attr("dx", 0.5 * TEXT_SIZE)
      .attr("dy", TEXT_SIZE);
  }
}

function renderAttention(
  svg: d3.Selection<SVGSVGElement | null, unknown, null, undefined>,
  attention: number[][][],
  headColors: d3.ScaleOrdinal<string, string>,
  headVisibility: boolean[]
) {
  svg.append("g")
    .attr("id", "attention")
    .selectAll(".headAttention")
    .data(attention)
    .enter()
    .append("g")
    .classed("headAttention", true)
    .attr("head-index", (_, i) => i)
    .selectAll(".tokenAttention")
    .data(d => d)
    .enter()
    .append("g")
    .classed("tokenAttention", true)
    .attr("left-token-index", (_, i) => i)
    .selectAll("line")
    .data(d => d)
    .enter()
    .append("line")
    .attr("x1", BOXWIDTH)
    .attr("y1", function() {
      const leftTokenIndex = +this.parentNode.getAttribute("left-token-index");
      return TEXT_TOP + leftTokenIndex * BOXHEIGHT + (BOXHEIGHT / 2);
    })
    .attr("x2", BOXWIDTH + MATRIX_WIDTH)
    .attr("y2", (_, rightTokenIndex) => TEXT_TOP + rightTokenIndex * BOXHEIGHT + (BOXHEIGHT / 2))
    .attr("stroke-width", 2)
    .attr("stroke", function() {
      const headIndex = +this.parentNode.parentNode.getAttribute("head-index");
      return headColors(headIndex);
    })
    .attr("stroke-opacity", function(d) {
      const headIndex = +this.parentNode.parentNode.getAttribute("head-index");
      return headVisibility[headIndex] ? d / activeHeads(headVisibility) : 0.0;
    });
}

function drawCheckboxes(
  svg: d3.Selection<SVGSVGElement | null, unknown, null, undefined>,
  headColors: d3.ScaleOrdinal<string, string>,
  headVisibility: boolean[],
  setHeadVisibility: React.Dispatch<React.SetStateAction<boolean[]>>
) {
  const checkboxContainer = svg.append("g");
  const checkbox = checkboxContainer.selectAll("rect")
    .data(headVisibility)
    .enter()
    .append("rect")
    .attr("fill", (_, i) => headVisibility[i] ? headColors(i) : lighten(headColors(i)))
    .attr("x", (_, i) => i * CHECKBOX_SIZE)
    .attr("y", 0)
    .attr("width", CHECKBOX_SIZE)
    .attr("height", CHECKBOX_SIZE);

  checkbox.on("click", function(_, i) {
    if (headVisibility[i] && activeHeads(headVisibility) === 1) return;
    const newVisibility = [...headVisibility];
    newVisibility[i] = !newVisibility[i];
    setHeadVisibility(newVisibility);
  });

  checkbox.on("dblclick", function(_, i) {
    if (headVisibility[i] && activeHeads(headVisibility) === 1) {
      setHeadVisibility(new Array(headVisibility.length).fill(true));
    } else {
      const newVisibility = new Array(headVisibility.length).fill(false);
      newVisibility[i] = true;
      setHeadVisibility(newVisibility);
    }
  });
}

function boxOffsets(i: number, headVisibility: boolean[]): number {
  const numHeadsAbove = headVisibility.reduce((acc, val, cur) => 
    val && cur < i ? acc + 1 : acc, 0);
  return numHeadsAbove * (BOXWIDTH / activeHeads(headVisibility));
}

function activeHeads(headVisibility: boolean[]): number {
  return headVisibility.reduce((acc, val) => val ? acc + 1 : acc, 0);
}

function lighten(color: string): string {
  const c = d3.hsl(color);
  const increment = (1 - c.l) * 0.6;
  c.l += increment;
  c.s -= increment;
  return c.toString();
}

function transpose(mat: number[][]): number[][] {
  return mat[0].map((_, i) => mat.map(row => row[i]));
}

export default AttentionVisualization; 