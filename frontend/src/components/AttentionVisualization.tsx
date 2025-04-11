import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface AttentionData {
  attention: Array<{
    attn: number[][][][];
    left_text: string[];
    right_text: string[];
  }>;
  default_filter: string;
  include_layers: number[];
  root_div_id: string;
}

const AttentionVisualization: React.FC<{ data: AttentionData }> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentLayer, setCurrentLayer] = useState<number>(0);
  const [headVisibility, setHeadVisibility] = useState<boolean[]>([]);
  
  // Constants
  const TEXT_SIZE = 15;
  const BOXWIDTH = 110;
  const BOXHEIGHT = 22.5;
  const MATRIX_WIDTH = 115;
  const CHECKBOX_SIZE = 20;
  const TEXT_TOP = 30;
  const headColors = d3.scaleOrdinal(d3.schemeCategory10);

  useEffect(() => {
    if (!svgRef.current || !data.attention.length) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const attnData = data.attention[0];
    const leftText = attnData.left_text;
    const rightText = attnData.right_text;
    const layerAttention = attnData.attn[currentLayer];
    const nHeads = layerAttention.length;

    // Initialize head visibility
    if (headVisibility.length !== nHeads) {
      setHeadVisibility(new Array(nHeads).fill(true));
      return;
    }

    // Calculate height
    const height = Math.max(leftText.length, rightText.length) * BOXHEIGHT + TEXT_TOP;
    svg.attr("height", height);

    // Render text elements
    renderText(svg, leftText, true, layerAttention, 0);
    renderText(svg, rightText, false, layerAttention, MATRIX_WIDTH + BOXWIDTH);
    
    // Render attention arcs
    renderAttention(svg, layerAttention);

    // Draw checkboxes
    drawCheckboxes(svg, layerAttention);

  }, [currentLayer, headVisibility, data]);

  const renderText = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    text: string[],
    isLeft: boolean,
    attention: number[][][],
    leftPos: number
  ) => {
    const textContainer = svg.append("g").attr("id", isLeft ? "left" : "right");

    // Attention boxes
    textContainer.append("g")
      .classed("attentionBoxes", true)
      .selectAll("g")
      .data(attention)
      .enter().append("g")
      .attr("head-index", (d, i) => i)
      .selectAll("rect")
      .data(d => isLeft ? d : transpose(d))
      .enter().append("rect")
      .attr("x", function() {
        const headIndex = +this.parentNode.getAttribute("head-index")!;
        return leftPos + boxOffsets(headIndex);
      })
      .attr("y", () => TEXT_TOP)
      .attr("width", BOXWIDTH / activeHeads())
      .attr("height", BOXHEIGHT)
      .attr("fill", function() {
        return headColors(+this.parentNode.getAttribute("head-index")!);
      })
      .style("opacity", 0.0);

    // Token elements
    const tokenContainer = textContainer.append("g")
      .selectAll("g")
      .data(text)
      .enter().append("g");

    // Background hover
    tokenContainer.append("rect")
      .classed("background", true)
      .style("opacity", 0.0)
      .attr("fill", "lightgray")
      .attr("x", leftPos)
      .attr("y", (d, i) => TEXT_TOP + i * BOXHEIGHT)
      .attr("width", BOXWIDTH)
      .attr("height", BOXHEIGHT);

    // Text elements
    const textEl = tokenContainer.append("text")
      .text(d => d)
      .attr("font-size", `${TEXT_SIZE}px`)
      .style("cursor", "default")
      .style("-webkit-user-select", "none")
      .attr("x", leftPos)
      .attr("y", (d, i) => TEXT_TOP + i * BOXHEIGHT + TEXT_SIZE);

    if (isLeft) {
      textEl.style("text-anchor", "end")
        .attr("dx", BOXWIDTH - TEXT_SIZE/2);
    } else {
      textEl.style("text-anchor", "start")
        .attr("dx", TEXT_SIZE/2);
    }

    // Hover interactions
    tokenContainer.on("mouseover", function(event, index) {
      const textContainer = d3.select(this.parentNode);
      textContainer.selectAll(".background")
        .style("opacity", (d, i) => i === index ? 1.0 : 0.0);

      const svg = d3.select(svgRef.current);
      svg.select("#attention")
        .selectAll<SVGLineElement, unknown>("line")
        .attr("visibility", null);

      svg.select("#attention").attr("visibility", "hidden");

      if (isLeft) {
        svg.select("#attention").selectAll(`line[left-token-index='${index}']`)
          .attr("visibility", "visible");
      } else {
        svg.select("#attention").selectAll(`line[right-token-index='${index}']`)
          .attr("visibility", "visible");
      }

      const id = isLeft ? "right" : "left";
      const pos = isLeft ? MATRIX_WIDTH + BOXWIDTH : 0;
      svg.select(`#${id}`).selectAll(".attentionBoxes")
        .selectAll("g")
        .selectAll("rect")
        .style("opacity", function(d: any) {
          const headIndex = +this.parentNode.getAttribute("head-index")!;
          return headVisibility[headIndex] ? d[index] : 0.0;
        });
    });

    tokenContainer.on("mouseleave", function() {
      const textContainer = d3.select(this.parentNode);
      textContainer.selectAll(".background").style("opacity", 0.0);
      const svg = d3.select(svgRef.current);
      svg.select("#attention").selectAll("line").attr("visibility", null);
      svg.select("#attention").attr("visibility", "visible");
      svg.selectAll(".attentionBoxes rect").style("opacity", 0.0);
    });
  };

  const renderAttention = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    attention: number[][][]
  ) => {
    svg.append("g")
      .attr("id", "attention")
      .selectAll(".headAttention")
      .data(attention)
      .enter().append("g")
      .classed("headAttention", true)
      .attr("head-index", (d, i) => i)
      .selectAll(".tokenAttention")
      .data(d => d)
      .enter().append("g")
      .classed("tokenAttention", true)
      .attr("left-token-index", (d, i) => i)
      .selectAll("line")
      .data(d => d)
      .enter().append("line")
      .attr("x1", BOXWIDTH)
      .attr("y1", function() {
        const leftTokenIndex = +this.parentNode!.getAttribute("left-token-index")!;
        return TEXT_TOP + leftTokenIndex * BOXHEIGHT + BOXHEIGHT/2;
      })
      .attr("x2", BOXWIDTH + MATRIX_WIDTH)
      .attr("y2", (d, rightTokenIndex) => TEXT_TOP + rightTokenIndex * BOXHEIGHT + BOXHEIGHT/2)
      .attr("stroke-width", 2)
      .attr("stroke", function() {
        const headIndex = +this.parentNode!.parentNode!.getAttribute("head-index")!;
        return headColors(headIndex);
      })
      .attr("left-token-index", function() {
        return +this.parentNode!.getAttribute("left-token-index")!;
      })
      .attr("right-token-index", (d, i) => i)
      .attr("stroke-opacity", function(d) {
        const headIndex = +this.parentNode!.parentNode!.getAttribute("head-index")!;
        return headVisibility[headIndex] ? d / activeHeads() : 0;
      });
  };

  const drawCheckboxes = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    attention: number[][][]
  ) => {
    const checkboxContainer = svg.append("g")
      .attr("transform", "translate(20, 10)");

    checkboxContainer.selectAll("rect")
      .data(headVisibility)
      .enter().append("rect")
      .attr("fill", (d, i) => d ? headColors(i) : lighten(headColors(i)))
      .attr("x", (d, i) => i * CHECKBOX_SIZE)
      .attr("width", CHECKBOX_SIZE)
      .attr("height", CHECKBOX_SIZE)
      .on("click", (event, i) => {
        if (headVisibility[i] && activeHeads() === 1) return;
        const newVisibility = [...headVisibility];
        newVisibility[i] = !newVisibility[i];
        setHeadVisibility(newVisibility);
      })
      .on("dblclick", (event, i) => {
        const newVisibility = headVisibility.map((_, idx) => idx === i);
        setHeadVisibility(newVisibility);
      });
  };

  // Helper functions
  const activeHeads = () => headVisibility.filter(v => v).length;

  const boxOffsets = (i: number) => {
    return headVisibility.slice(0, i).filter(v => v).length * (BOXWIDTH / activeHeads());
  };

  const lighten = (color: string) => {
    const c = d3.hsl(color);
    c.l += (1 - c.l) * 0.6;
    c.s -= 0.2;
    return c.toString();
  };

  const transpose = (matrix: number[][]) => {
    return matrix[0].map((col, i) => matrix.map(row => row[i]));
  };

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: 20 }}>
        <label>
          Layer: 
          <select
            value={currentLayer}
            onChange={e => setCurrentLayer(Number(e.target.value))}
            style={{ marginLeft: 10 }}
          >
            {data.include_layers.map(layer => (
              <option key={layer} value={layer}>Layer {layer}</option>
            ))}
          </select>
        </label>
      </div>
      <svg ref={svgRef} width="100%" />
    </div>
  );
};

export default AttentionVisualization;