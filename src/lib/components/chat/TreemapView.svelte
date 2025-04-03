<script lang="ts">
  import type { Chat } from '$lib/types/chat'
  import * as d3 from 'd3'
  import { afterUpdate, onDestroy, onMount } from 'svelte'

  export let chats: Chat[] = [];
  export let onChatClick: (chatId: string) => void;

  let container: HTMLElement;

  function createTreemap() {
    if (!container || chats.length === 0) return;
    
    d3.select(container).selectAll("*").remove();
    
    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3.select(container)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("font-family", "monospace")
      .style("font-size", "10px");
    
    const defs = svg.append("defs");
    
    chats.forEach(chat => {
      const gradient = defs.append("radialGradient")
        .attr("id", `gradient-${chat.id}`)
        .attr("cx", "50%")
        .attr("cy", "50%")
        .attr("r", "80%");

      const colors = chat.expand?.participants?.map(p => p.colour) || [chat.color, chat.color];
      
      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", colors[0] || "#666");

      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colors[1] || colors[0] || "#666");
    });
    
    const hierarchyData = {
      name: "chats",
      children: chats.map(chat => ({
        name: chat.participantNames?.join(' & ') || 'Chat',
        value: chat.totalSize || 1,
        id: chat.id
      }))
    };
    
    const root = d3.hierarchy(hierarchyData)
      .sum((d: any) => d.value)
      .sort((a: any, b: any) => b.value - a.value);
    
    const treemap = d3.treemap()
      .size([width, height])
      .paddingOuter(1)
      .paddingInner(2)
      .round(true);
    
    treemap(root);
    
    const leaf = svg.selectAll("g")
      .data(root.leaves())
      .join("g")
      .attr("transform", (d: any) => `translate(${d.x0},${d.y0})`);

    // clicktochat
    leaf.on("click", (_: any, d: any) => {
      onChatClick(d.data.id);
    });
    
    // gradient
    leaf.append("rect")
      .attr("width", (d: any) => d.x1 - d.x0)
      .attr("height", (d: any) => d.y1 - d.y0)
      .attr("fill", (d: any) => `url(#gradient-${d.data.id})`)
      .attr("stroke", "white")
      .attr("cursor", "pointer");
    
    
    leaf.each(function(d: any) {
      const node = d3.select(this);
      const cellWidth = d.x1 - d.x0;
      const cellHeight = d.y1 - d.y0;
      const names = d.data.name;
      const size = Math.round((d.data.value || 0) / 1024);
      
      // is cell big
      if (cellWidth < 30 || cellHeight < 30) return;

      // size
      node.append("text")
        .attr("class", "size-text")
        .attr("x", cellWidth / 2)
        .attr("y", cellHeight / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-size", "10px")
        .text(`${size}KB`);

      // people
      const nameText = node.append("text")
        .attr("class", "name-text")
        .attr("x", cellWidth / 2)
        .attr("y", cellHeight / 2 - 6)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-size", "12px")
        .attr("opacity", "0") 
        .text(names);

      
      const textWidth = (nameText.node() as SVGTextElement).getComputedTextLength();
      if (textWidth > cellWidth - 10) {
        const scale = (cellWidth - 10) / textWidth;
        nameText.style("font-size", `${10 * scale}px`);
      }

      // hover
      node.on("mouseenter", function() {
        d3.select(this).select(".name-text")
          .transition()
          .duration(200)
          .attr("opacity", "1");
        
        d3.select(this).select(".size-text")
          .transition()
          .duration(200)
          .attr("y", cellHeight / 2 + 12);
      });

      node.on("mouseleave", function() {
        d3.select(this).select(".name-text")
          .transition()
          .duration(200)
          .attr("opacity", "0");
        
        d3.select(this).select(".size-text")
          .transition()
          .duration(200)
          .attr("y", cellHeight / 2);
      });
    });
    
    // tooltips
    leaf.append("title")
      .text((d: any) => `${d.data.name}\nSize: ${Math.round((d.data.value || 0) / 1024)}KB`);
  }

  function handleResize() {
    createTreemap();
  }

  onMount(() => {
    window.addEventListener('resize', handleResize);
    createTreemap();
  });
  
  onDestroy(() => {
    window.removeEventListener('resize', handleResize);
  });
  
  afterUpdate(() => {
    createTreemap();
  });
</script>

<div class="view--treemap" bind:this={container}></div>

<style>
  .view--treemap {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
</style> 